/**
 * File: FuelAutoImportService.cs
 * Purpose: Orchestrates the auto-import pipeline: scan directories → detect changes → parse → import → track results.
 *          Dispatches existing ImportFuelReportCommand for each file's parsed records.
 * Dependencies: IExcelParsingService, IFileTrackerService, IMediator, GpsdataContext, IConfiguration
 * Last Modified: 2026-03-03
 *
 * Key Functions:
 * - ScanAndImportAsync: Full pipeline with batch processing
 * - ImportSingleFileAsync: Process one specific file
 * - ScanDirectories: Enumerate .xlsx files from configured paths
 * - ProcessFile: Parse → dispatch ImportFuelReportCommand → update tracker
 */
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using FMS.Application.Features.FuelImport.Commands;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelImport.Services;

public class FuelAutoImportService : IFuelAutoImportService
{
    private readonly IExcelParsingService _parsingService;
    private readonly IFileTrackerService _fileTrackerService;
    private readonly IMediator _mediator;
    private readonly GpsdataContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<FuelAutoImportService> _logger;

    // Default scan paths (overridable via SystemConfigurations DB or appsettings "FuelAutoImport:ScanPaths")
    private static readonly string[] DefaultScanPaths = new[]
    {
        @"Z:\Heavy Report",
        @"Z:\Truck Report",
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    public FuelAutoImportService(
        IExcelParsingService parsingService,
        IFileTrackerService fileTrackerService,
        IMediator mediator,
        GpsdataContext context,
        IConfiguration configuration,
        ILogger<FuelAutoImportService> logger)
    {
        _parsingService = parsingService;
        _fileTrackerService = fileTrackerService;
        _mediator = mediator;
        _context = context;
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<AutoImportResult> ScanAndImportAsync(AutoImportOptions? options = null)
    {
        options ??= new AutoImportOptions();
        var sw = Stopwatch.StartNew();
        var result = new AutoImportResult();

        try
        {
            // 1. Determine scan paths
            var scanPaths = options.ScanPaths.Any()
                ? options.ScanPaths
                : GetConfiguredScanPaths();

            _logger.LogInformation("Auto-import scan starting. Paths: {Paths}, BatchSize: {Batch}, ReportType: {Type}",
                string.Join(", ", scanPaths), options.BatchSize, options.ReportTypeFilter ?? "all");

            // 2. Scan directories for .xlsx files
            var allFiles = ScanDirectories(scanPaths, options.ReportTypeFilter);
            result.FilesScanned = allFiles.Count;

            if (allFiles.Count == 0)
            {
                _logger.LogInformation("No .xlsx files found in scan paths");
                result.Duration = sw.Elapsed;
                return result;
            }

            // 3. Detect new/changed files (skip unchanged via tracker)
            List<FuelReportFileMetadata> filesToProcess;
            if (options.ForceReprocess)
            {
                filesToProcess = allFiles;
                result.FilesNew = allFiles.Count;
            }
            else
            {
                filesToProcess = await _fileTrackerService.GetNewOrChangedFilesAsync(allFiles);
                result.FilesNew = filesToProcess.Count;
                result.FilesSkippedUnchanged = allFiles.Count - filesToProcess.Count;
            }

            // 4. Add retries if requested
            if (options.IncludeRetries && !options.ForceReprocess)
            {
                var retries = await _fileTrackerService.GetPendingRetriesAsync();
                foreach (var retry in retries)
                {
                    var metadata = _parsingService.DetectReportMetadata(retry.FilePath);
                    if (!filesToProcess.Any(f => f.FilePath.Equals(retry.FilePath, StringComparison.OrdinalIgnoreCase)))
                    {
                        filesToProcess.Add(metadata);
                    }
                }
            }

            // 5. Apply batch limit
            if (options.BatchSize > 0 && filesToProcess.Count > options.BatchSize)
            {
                _logger.LogInformation("Batch limiting: {Total} files to process, taking first {Batch}",
                    filesToProcess.Count, options.BatchSize);
                filesToProcess = filesToProcess.Take(options.BatchSize).ToList();
            }

            // 6. Build site lookup (used for both km/l filename resolution and l/hr row-level resolution)
            var siteLookup = await BuildSiteLookupAsync();

            // 7. Process each file
            foreach (var fileMetadata in filesToProcess)
            {
                try
                {
                    var fileResult = await ProcessFileAsync(fileMetadata, siteLookup, options.UserId);
                    result.FilesProcessed++;

                    if (fileResult.Success)
                    {
                        result.FilesSucceeded++;
                        result.TotalRecordsImported += fileResult.RecordsImported;
                        result.TotalDuplicatesSkipped += fileResult.DuplicatesSkipped;
                    }
                    else if (fileResult.Skipped)
                    {
                        result.FilesSkippedNoSite++;
                    }
                    else
                    {
                        result.FilesFailed++;
                        result.Errors.Add($"{fileMetadata.FileName}: {fileResult.ErrorMessage}");
                    }

                    result.Warnings.AddRange(fileResult.Warnings);
                }
                catch (Exception ex)
                {
                    result.FilesFailed++;
                    result.Errors.Add($"{fileMetadata.FileName}: {ex.Message}");
                    _logger.LogError(ex, "Unhandled error processing file: {FilePath}", fileMetadata.FilePath);
                }
            }
        }
        catch (Exception ex)
        {
            result.Errors.Add($"Scan failed: {ex.Message}");
            _logger.LogError(ex, "Auto-import scan failed");
        }

        sw.Stop();
        result.Duration = sw.Elapsed;

        _logger.LogInformation(
            "Auto-import scan completed in {Duration}ms. Scanned: {Scanned}, Processed: {Processed}, " +
            "Succeeded: {Succeeded}, Failed: {Failed}, Unchanged: {Unchanged}, Records: {Records}",
            sw.ElapsedMilliseconds, result.FilesScanned, result.FilesProcessed,
            result.FilesSucceeded, result.FilesFailed, result.FilesSkippedUnchanged, result.TotalRecordsImported);

        return result;
    }

    public async Task<AutoImportResult> ImportSingleFileAsync(string filePath, string userId = "SYSTEM_AUTO_IMPORT")
    {
        var options = new AutoImportOptions
        {
            ScanPaths = new List<string> { Path.GetDirectoryName(filePath)! },
            BatchSize = 1,
            UserId = userId,
            ForceReprocess = true
        };

        // Override scan to just this one file
        var metadata = _parsingService.DetectReportMetadata(filePath);
        var siteLookup = await BuildSiteLookupAsync();

        var result = new AutoImportResult { FilesScanned = 1 };
        var sw = Stopwatch.StartNew();

        try
        {
            var fileResult = await ProcessFileAsync(metadata, siteLookup, userId);
            result.FilesProcessed = 1;

            if (fileResult.Success)
            {
                result.FilesSucceeded = 1;
                result.TotalRecordsImported = fileResult.RecordsImported;
                result.TotalDuplicatesSkipped = fileResult.DuplicatesSkipped;
            }
            else if (fileResult.Skipped)
            {
                result.FilesSkippedNoSite = 1;
            }
            else
            {
                result.FilesFailed = 1;
                result.Errors.Add(fileResult.ErrorMessage ?? "Unknown error");
            }
            result.Warnings.AddRange(fileResult.Warnings);
        }
        catch (Exception ex)
        {
            result.FilesFailed = 1;
            result.Errors.Add(ex.Message);
            _logger.LogError(ex, "Failed to import single file: {FilePath}", filePath);
        }

        result.Duration = sw.Elapsed;
        return result;
    }

    #region Private Methods

    /// <summary>
    /// Get scan paths from FuelAutoImport.Profiles JSON in SystemConfigurations.
    /// Falls back to appsettings.json, then compiled defaults.
    /// Only returns paths for enabled profiles.
    /// </summary>
    private List<string> GetConfiguredScanPaths()
    {
        // 1. Try SystemConfigurations table — read profiles JSON
        try
        {
            var dbConfig = _context.SystemConfigurations
                .AsNoTracking()
                .FirstOrDefault(c => c.IsActive
                    && c.ConfigurationKey == Configuration.SystemConfiguration.DB_CONFIG_FUEL_AUTO_IMPORT_PROFILES_KEY);

            if (dbConfig != null && !string.IsNullOrWhiteSpace(dbConfig.ConfigurationValue))
            {
                var profiles = JsonSerializer.Deserialize<List<FuelAutoImportProfileDto>>(dbConfig.ConfigurationValue, JsonOptions);
                if (profiles != null && profiles.Count > 0)
                {
                    var enabledPaths = profiles
                        .Where(p => p.Enabled && !string.IsNullOrWhiteSpace(p.ScanPath))
                        .Select(p => p.ScanPath!)
                        .ToList();

                    if (enabledPaths.Count > 0)
                        return enabledPaths;
                }
            }
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not read profiles from SystemConfigurations, falling back to appsettings");
        }

        // 2. Try appsettings.json
        var configPaths = _configuration.GetSection("FuelAutoImport:ScanPaths").Get<string[]>();
        return (configPaths?.Length > 0 ? configPaths : DefaultScanPaths).ToList();
    }

    /// <summary>
    /// Scan directories recursively for .xlsx files and extract metadata from each.
    /// </summary>
    private List<FuelReportFileMetadata> ScanDirectories(List<string> paths, string? reportTypeFilter)
    {
        var files = new List<FuelReportFileMetadata>();

        foreach (var basePath in paths)
        {
            if (!Directory.Exists(basePath))
            {
                _logger.LogWarning("Scan path does not exist: {Path}", basePath);
                continue;
            }

            try
            {
                var xlsxFiles = Directory.EnumerateFiles(basePath, "*.xlsx", SearchOption.AllDirectories)
                    .Where(f => !Path.GetFileName(f).StartsWith("~$")); // Skip temp Excel lock files

                foreach (var filePath in xlsxFiles)
                {
                    try
                    {
                        var metadata = _parsingService.DetectReportMetadata(filePath);

                        // Apply report type filter
                        if (!string.IsNullOrEmpty(reportTypeFilter) &&
                            !metadata.ReportType.Equals(reportTypeFilter, StringComparison.OrdinalIgnoreCase))
                            continue;

                        files.Add(metadata);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Could not read metadata for file: {FilePath}", filePath);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error scanning directory: {Path}", basePath);
            }
        }

        return files;
    }

    /// <summary>
    /// Build a site name → siteId lookup dictionary from the Sites table.
    /// Includes mapped names (FOOTBRIDGE → BRIDGE, etc.).
    /// </summary>
    private async Task<Dictionary<string, int>> BuildSiteLookupAsync()
    {
        var sites = await _context.Sites
            .Where(s => s.IsActive == true)
            .Select(s => new { s.Id, s.Name })
            .ToListAsync();

        var lookup = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var site in sites)
        {
            if (!string.IsNullOrWhiteSpace(site.Name))
                lookup.TryAdd(site.Name.Trim(), site.Id);
        }

        // Add reverse mappings so that report names resolve to DB site names
        // e.g., "FOOTBRIDGE" in report → "BRIDGE" in DB
        var siteMappings = new Dictionary<string, string>(StringComparer.OrdinalIgnoreCase)
        {
            ["FOOTBRIDGE"] = "BRIDGE",
            ["IP"] = "Industrial Plot",
            ["british embassy"] = "BHC"
        };

        foreach (var (reportName, dbName) in siteMappings)
        {
            if (lookup.TryGetValue(dbName, out var siteId))
                lookup.TryAdd(reportName, siteId);
        }

        return lookup;
    }

    /// <summary>
    /// Process a single file through the full pipeline: register → parse → import → update tracker.
    /// </summary>
    private async Task<FileProcessResult> ProcessFileAsync(
        FuelReportFileMetadata metadata,
        Dictionary<string, int> siteLookup,
        string userId)
    {
        var processResult = new FileProcessResult();

        // 1. Register or update tracker
        var tracker = await _fileTrackerService.RegisterOrUpdateFileAsync(metadata);
        await _fileTrackerService.MarkAsProcessingAsync(tracker.Id);

        try
        {
            // 2. Parse based on report type
            ExcelParseResult parseResult;
            if (metadata.ReportType == "l/hr")
            {
                parseResult = _parsingService.ParseLHrReport(metadata.FilePath, siteLookup);
            }
            else // km/l
            {
                // Resolve site from filename
                var siteId = ResolveSiteIdFromFilename(metadata.DetectedSiteName, siteLookup);
                if (siteId == 0)
                {
                    var reason = $"Could not resolve site '{metadata.DetectedSiteName}' from filename";
                    await _fileTrackerService.MarkAsSkippedAsync(tracker.Id, reason);
                    processResult.Skipped = true;
                    processResult.ErrorMessage = reason;
                    _logger.LogWarning("Skipping file — site not found: {File}, DetectedSite: {Site}",
                        metadata.FileName, metadata.DetectedSiteName);
                    return processResult;
                }
                parseResult = _parsingService.ParseKmLReport(metadata.FilePath, siteId);
            }

            processResult.Warnings.AddRange(parseResult.Warnings);

            if (!parseResult.Success || parseResult.Records.Count == 0)
            {
                var error = parseResult.ErrorMessage ?? "No valid records found in file";
                await _fileTrackerService.MarkAsFailedAsync(tracker.Id, error);
                processResult.ErrorMessage = error;
                return processResult;
            }

            // 3. Dispatch to existing ImportFuelReportCommand with SkipDuplicates=true
            var command = new ImportFuelReportCommand
            {
                Models = parseResult.Records,
                SkipDuplicates = true,
                OverwriteExisting = false,
                UserId = userId,
                JobId = $"auto-import-{tracker.Id}-{DateTime.UtcNow:yyyyMMddHHmmss}"
            };

            var importResult = await _mediator.Send(command);

            if (importResult.IsSuccess && importResult.Data != null)
            {
                var data = importResult.Data;
                await _fileTrackerService.MarkAsCompletedAsync(
                    tracker.Id,
                    data.ReportId,
                    data.TotalRecords,
                    data.SuccessCount,
                    data.FailureCount,
                    data.SkippedCount,
                    data.DuplicateCount);

                processResult.Success = true;
                processResult.RecordsImported = data.SuccessCount;
                processResult.DuplicatesSkipped = data.DuplicateCount;

                _logger.LogInformation(
                    "File imported: {File} → {Success} success, {Dup} duplicates, {Fail} failed",
                    metadata.FileName, data.SuccessCount, data.DuplicateCount, data.FailureCount);
            }
            else
            {
                var error = importResult.Message ?? "Import command returned failure";
                await _fileTrackerService.MarkAsFailedAsync(tracker.Id, error);
                processResult.ErrorMessage = error;
            }
        }
        catch (Exception ex)
        {
            await _fileTrackerService.MarkAsFailedAsync(tracker.Id, ex.Message);
            processResult.ErrorMessage = ex.Message;
            throw; // Let caller handle logging
        }

        return processResult;
    }

    /// <summary>
    /// Resolve a site name (from filename) to a siteId using the lookup.
    /// </summary>
    private int ResolveSiteIdFromFilename(string? siteName, Dictionary<string, int> siteLookup)
    {
        if (string.IsNullOrWhiteSpace(siteName))
            return 0;
        return siteLookup.TryGetValue(siteName.Trim(), out var id) ? id : 0;
    }

    #endregion

    /// <summary>
    /// Internal result from processing a single file.
    /// </summary>
    private class FileProcessResult
    {
        public bool Success { get; set; }
        public bool Skipped { get; set; }
        public int RecordsImported { get; set; }
        public int DuplicatesSkipped { get; set; }
        public string? ErrorMessage { get; set; }
        public List<string> Warnings { get; set; } = new();
    }
}
