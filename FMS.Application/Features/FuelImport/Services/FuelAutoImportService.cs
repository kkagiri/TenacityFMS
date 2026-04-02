/**
 * File: FuelAutoImportService.cs
 * Purpose: Orchestrates the auto-import pipeline: scan directories → detect changes → parse → import → track results.
 *          Dispatches existing ImportFuelReportCommand for each file's parsed records.
 * Dependencies: IExcelParsingService, IFileTrackerService, IMediator, GpsdataContext, IConfiguration
 * Last Modified: 2026-04-01
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
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.FuelImport.Commands;
using FMS.Application.Features.FuelImport.DTOs;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
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
    private readonly INotificationService _notificationService;

    // Default scan paths (overridable via SystemConfigurations DB or appsettings "FuelAutoImport:ScanPaths")
    private static readonly string[] DefaultScanPaths = new[]
    {
        @"\\10.0.10.150\reports\Heavy Report",
        @"\\10.0.10.150\reports\Truck Report",
    };

    private static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
    };

    private static readonly Dictionary<string, string> LegacyScanPathMappings = new(StringComparer.OrdinalIgnoreCase)
    {
        [@"Z:\Heavy Report"] = @"\\10.0.10.150\reports\Heavy Report",
        [@"Z:\Truck Report"] = @"\\10.0.10.150\reports\Truck Report",
    };

    private static readonly Dictionary<string, string> SiteAliases = new(StringComparer.OrdinalIgnoreCase)
    {
        ["FOOTBRIDGE"] = "BRIDGE",
        ["IP"] = "Industrial Plot",
        ["british embassy"] = "BHC",
        ["LANGATA KIBERA"] = "LANGATA-KIBERA",
        ["NARO MORU"] = "NARUMORO",
        ["OLKARI KEDONG"] = "OLKARIA-KEDONG",
        ["OLKARIA KEDONG"] = "OLKARIA-KEDONG"
    };

    private static readonly HashSet<string> ExcludedKmLSites = new(StringComparer.OrdinalIgnoreCase)
    {
        "KATANI"
    };

    public FuelAutoImportService(
        IExcelParsingService parsingService,
        IFileTrackerService fileTrackerService,
        IMediator mediator,
        GpsdataContext context,
        IConfiguration configuration,
        ILogger<FuelAutoImportService> logger,
        INotificationService notificationService)
    {
        _parsingService = parsingService;
        _fileTrackerService = fileTrackerService;
        _mediator = mediator;
        _context = context;
        _configuration = configuration;
        _logger = logger;
        _notificationService = notificationService;
    }

    public async Task<AutoImportResult> ScanAndImportAsync(AutoImportOptions? options = null, CancellationToken cancellationToken = default)
    {
        options ??= new AutoImportOptions();
        var sw = Stopwatch.StartNew();
        var result = new AutoImportResult();

        try
        {
            FuelAutoImportProfileDto? selectedProfile = null;
            var configuredProfiles = GetConfiguredProfiles();

            // 1. Resolve profile if ProfileId is specified
            if (!string.IsNullOrWhiteSpace(options.ProfileId))
            {
                selectedProfile = ResolveProfile(options.ProfileId);
                if (selectedProfile == null)
                {
                    result.Errors.Add($"Profile '{options.ProfileId}' not found or disabled");
                    result.Duration = sw.Elapsed;
                    _logger.LogWarning("Auto-import aborted — profile not found: {ProfileId}", options.ProfileId);
                    return result;
                }

                // Override options from profile settings
                options.ScanPaths = new List<string> { NormalizeScanPath(selectedProfile.ScanPath) };
                options.BatchSize = selectedProfile.BatchSize;
                options.IncludeRetries = selectedProfile.IncludeRetries;
                result.ProfileId = selectedProfile.Id;
                result.ProfileName = selectedProfile.Name;
                configuredProfiles = new List<FuelAutoImportProfileDto> { selectedProfile };

                _logger.LogInformation("Resolved profile '{ProfileId}' ({ProfileName}). Path: {Path}, Batch: {Batch}",
                    selectedProfile.Id, selectedProfile.Name, selectedProfile.ScanPath, selectedProfile.BatchSize);
            }

            // 2. Determine scan paths
            var scanPaths = options.ScanPaths.Any()
                ? options.ScanPaths.Select(NormalizeScanPath).ToList()
                : configuredProfiles.Select(p => NormalizeScanPath(p.ScanPath)).ToList();

            if (scanPaths.Count == 0)
            {
                _logger.LogInformation("Auto-import scan skipped — no enabled profiles or scan paths are configured");
                result.Duration = sw.Elapsed;
                return result;
            }

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
                cancellationToken.ThrowIfCancellationRequested();

                try
                {
                    var matchedProfile = selectedProfile ?? ResolveProfileForFilePath(fileMetadata.FilePath, configuredProfiles);
                    var fileResult = await ProcessFileAsync(fileMetadata, siteLookup, options.UserId, matchedProfile, suppressNotification: true);
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

        // Send a single batch summary notification instead of one per file
        if (result.FilesProcessed > 0)
        {
            await CreateBatchSummaryNotificationAsync(result, options?.UserId, CancellationToken.None);
        }

        _logger.LogInformation(
            "Auto-import scan completed in {Duration}ms. Scanned: {Scanned}, Processed: {Processed}, " +
            "Succeeded: {Succeeded}, Failed: {Failed}, Unchanged: {Unchanged}, Records: {Records}",
            sw.ElapsedMilliseconds, result.FilesScanned, result.FilesProcessed,
            result.FilesSucceeded, result.FilesFailed, result.FilesSkippedUnchanged, result.TotalRecordsImported);

        return result;
    }

    public async Task<AutoImportResult> ImportSingleFileAsync(string filePath, string userId = "SYSTEM_AUTO_IMPORT", CancellationToken cancellationToken = default)
    {
        _logger.LogInformation("Manual single-file import requested for {FilePath} by {UserId}", filePath, userId);

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
        var configuredProfiles = GetConfiguredProfiles(includeDisabled: true);
        var matchedProfile = ResolveProfileForFilePath(filePath, configuredProfiles);

        var result = new AutoImportResult { FilesScanned = 1 };
        var sw = Stopwatch.StartNew();

        if (matchedProfile != null)
        {
            result.ProfileId = matchedProfile.Id;
            result.ProfileName = matchedProfile.Name;
        }

        try
        {
            var fileResult = await ProcessFileAsync(metadata, siteLookup, userId, matchedProfile);
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
    /// Resolve a single profile by ID from the stored JSON in SystemConfigurations.
    /// Returns null if not found or disabled.
    /// </summary>
    private FuelAutoImportProfileDto? ResolveProfile(string profileId)
    {
        try
        {
            return GetConfiguredProfiles(includeDisabled: true)
                .FirstOrDefault(p => p.Enabled && p.Id.Equals(profileId, StringComparison.OrdinalIgnoreCase));
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to resolve profile '{ProfileId}' from SystemConfigurations", profileId);
            return null;
        }
    }

    private bool TryLoadStoredProfiles(out List<FuelAutoImportProfileDto> profiles)
    {
        profiles = new List<FuelAutoImportProfileDto>();

        try
        {
            var dbConfig = _context.SystemConfigurations
                .AsNoTracking()
                .FirstOrDefault(c => c.IsActive
                    && c.ConfigurationKey == Configuration.SystemConfiguration.DB_CONFIG_FUEL_AUTO_IMPORT_PROFILES_KEY);

            if (dbConfig == null || string.IsNullOrWhiteSpace(dbConfig.ConfigurationValue))
                return false;

            List<FuelAutoImportProfileDto>? parsedProfiles;
            try
            {
                parsedProfiles = JsonSerializer.Deserialize<List<FuelAutoImportProfileDto>>(dbConfig.ConfigurationValue, JsonOptions);
            }
            catch (JsonException)
            {
                // Legacy DB value with unescaped Windows paths — double all backslashes
                var sanitized = dbConfig.ConfigurationValue.Replace("\\", "\\\\");
                parsedProfiles = JsonSerializer.Deserialize<List<FuelAutoImportProfileDto>>(sanitized, JsonOptions);
            }
            profiles = (parsedProfiles ?? new List<FuelAutoImportProfileDto>())
                .Select(NormalizeProfile)
                .Where(p => !string.IsNullOrWhiteSpace(p.ScanPath))
                .ToList();

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Could not read profiles from SystemConfigurations, falling back to appsettings");
            return false;
        }
    }

    private List<FuelAutoImportProfileDto> GetConfiguredProfiles(bool includeDisabled = false)
    {
        if (TryLoadStoredProfiles(out var storedProfiles))
        {
            return includeDisabled
                ? storedProfiles
                : storedProfiles.Where(p => p.Enabled).ToList();
        }

        var configPaths = _configuration.GetSection("FuelAutoImport:ScanPaths").Get<string[]>();
        var fallbackPaths = (configPaths?.Length > 0 ? configPaths : DefaultScanPaths)
            .Select(NormalizeScanPath)
            .Where(path => !string.IsNullOrWhiteSpace(path))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToList();

        _logger.LogInformation(
            configPaths?.Length > 0
                ? "Resolved auto-import scan paths from appsettings: {Paths}"
                : "Resolved auto-import scan paths from compiled defaults: {Paths}",
            string.Join(", ", fallbackPaths));

        return fallbackPaths.Select((path, index) => new FuelAutoImportProfileDto
        {
            Id = $"fallback-profile-{index + 1}",
            Name = Path.GetFileName(path) ?? $"Profile {index + 1}",
            ScanPath = path,
            Enabled = true,
            IntervalMinutes = 0,
            ScheduleTime = string.Empty,
            BatchSize = 50,
            IncludeRetries = true,
            DuplicateHandling = FuelAutoImportProfileDto.DuplicateHandlingSkip,
            NotificationsEnabled = false,
            NotifyOnSuccess = false,
            NotifyOnFailure = true,
        }).ToList();
    }

    /// <summary>
    /// Get scan paths from FuelAutoImport.Profiles JSON in SystemConfigurations.
    /// Falls back to appsettings.json, then compiled defaults.
    /// Only returns paths for enabled profiles.
    /// </summary>
    private List<string> GetConfiguredScanPaths()
    {
        var enabledProfiles = GetConfiguredProfiles();
        if (enabledProfiles.Count == 0)
        {
            _logger.LogInformation("No enabled auto-import profiles resolved from configuration.");
            return new List<string>();
        }

        return enabledProfiles
            .Select(p => NormalizeScanPath(p.ScanPath))
            .ToList();
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
            .Select(s => new { s.Id, s.Name })
            .ToListAsync();

        var lookup = new Dictionary<string, int>(StringComparer.OrdinalIgnoreCase);
        foreach (var site in sites)
        {
            if (!string.IsNullOrWhiteSpace(site.Name))
                AddLookupValue(lookup, site.Name.Trim(), site.Id);
        }

        foreach (var (reportName, dbName) in SiteAliases)
        {
            if (lookup.TryGetValue(dbName, out var siteId))
                AddLookupValue(lookup, reportName, siteId);
        }

        return lookup;
    }

    /// <summary>
    /// Process a single file through the full pipeline: register → parse → import → update tracker.
    /// Set suppressNotification=true when called from a batch scan so a summary is sent instead.
    /// </summary>
    private async Task<FileProcessResult> ProcessFileAsync(
        FuelReportFileMetadata metadata,
        Dictionary<string, int> siteLookup,
        string userId,
        FuelAutoImportProfileDto? profile = null,
        bool suppressNotification = false)
    {
        var processResult = new FileProcessResult();

        _logger.LogInformation(
            "Starting auto-import for file {FileName}. Path: {FilePath}, ReportType: {ReportType}, DetectedSite: {DetectedSite}, UserId: {UserId}",
            metadata.FileName,
            metadata.FilePath,
            metadata.ReportType,
            metadata.DetectedSiteName ?? "unknown",
            userId);

        // 1. Register or update tracker
        var tracker = await _fileTrackerService.RegisterOrUpdateFileAsync(metadata);
        await _fileTrackerService.MarkAsProcessingAsync(tracker.Id);

        _logger.LogInformation("Tracker {TrackerId} marked as Processing for {FileName}", tracker.Id, metadata.FileName);

        try
        {
            if (ShouldSkipKmLFile(metadata))
            {
                var reason = $"Skipped auto-import for excluded km/l site '{metadata.DetectedSiteName ?? metadata.FileName}'";
                await _fileTrackerService.MarkAsSkippedAsync(tracker.Id, reason);
                processResult.Skipped = true;
                processResult.ErrorMessage = reason;
                _logger.LogInformation("Skipping excluded km/l file {FileName}. DetectedSite: {DetectedSite}", metadata.FileName, metadata.DetectedSiteName ?? "unknown");
                return processResult;
            }

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

            _logger.LogInformation(
                "Parsed file {FileName}. Success: {Success}, Records: {RecordCount}, Warnings: {WarningCount}",
                metadata.FileName,
                parseResult.Success,
                parseResult.Records.Count,
                parseResult.Warnings.Count);

            if (!parseResult.Success || parseResult.Records.Count == 0)
            {
                var error = parseResult.ErrorMessage ?? "No valid records found in file";
                await _fileTrackerService.MarkAsFailedAsync(tracker.Id, error);
                processResult.ErrorMessage = error;
                _logger.LogWarning("Parsing failed for {FileName}. TrackerId: {TrackerId}, Error: {Error}", metadata.FileName, tracker.Id, error);
                return processResult;
            }

            var duplicateHandling = FuelAutoImportProfileDto.NormalizeDuplicateHandling(profile?.DuplicateHandling);
            var shouldReplaceDuplicates = duplicateHandling == FuelAutoImportProfileDto.DuplicateHandlingReplace;

            _logger.LogInformation(
                "Using duplicate handling policy {DuplicateHandling} for file {FileName}. ProfileId: {ProfileId}",
                duplicateHandling,
                metadata.FileName,
                profile?.Id ?? "default");

            // 3. Dispatch to existing ImportFuelReportCommand using the resolved duplicate policy
            var command = new ImportFuelReportCommand
            {
                Models = parseResult.Records,
                SkipDuplicates = !shouldReplaceDuplicates,
                OverwriteExisting = shouldReplaceDuplicates,
                UserId = userId,
                JobId = $"auto-import-{tracker.Id}-{DateTime.UtcNow:yyyyMMddHHmmss}",
                SourceFileName = metadata.FileName,
                SourceFilePath = metadata.FilePath,
                SourceReportType = metadata.ReportType,
                SourceDetectedSiteName = metadata.DetectedSiteName,
                ImportMode = "Auto Import",
                SuppressNotification = suppressNotification
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
                _logger.LogWarning("Import command failed for {FileName}. TrackerId: {TrackerId}, Error: {Error}", metadata.FileName, tracker.Id, error);
            }
        }
        catch (Exception ex)
        {
            await _fileTrackerService.MarkAsFailedAsync(tracker.Id, ex.Message);
            processResult.ErrorMessage = ex.Message;
            _logger.LogError(ex, "Unhandled auto-import failure for {FileName}. TrackerId: {TrackerId}", metadata.FileName, tracker.Id);
            // Do NOT re-throw — let the caller continue processing remaining files
        }
        finally
        {
            // Safety net: clear the change tracker between files to prevent poisoned DbContext.
            // If a previous file's SaveChangesAsync failed, any Added entities still tracked
            // would cascade duplicate key errors to every subsequent file.
            _context.ChangeTracker.Clear();
        }

        return processResult;
    }

    private static bool ShouldSkipKmLFile(FuelReportFileMetadata metadata)
    {
        if (!string.Equals(metadata.ReportType, "km/l", StringComparison.OrdinalIgnoreCase))
        {
            return false;
        }

        if (!string.IsNullOrWhiteSpace(metadata.DetectedSiteName) && ExcludedKmLSites.Contains(metadata.DetectedSiteName.Trim()))
        {
            return true;
        }

        return metadata.FileName.Contains("KATANI", StringComparison.OrdinalIgnoreCase);
    }

    /// <summary>
    /// Resolve a site name (from filename) to a siteId using the lookup.
    /// </summary>
    private int ResolveSiteIdFromFilename(string? siteName, Dictionary<string, int> siteLookup)
    {
        if (string.IsNullOrWhiteSpace(siteName))
            return 0;

        var trimmedSiteName = siteName.Trim();
        if (siteLookup.TryGetValue(trimmedSiteName, out var id))
            return id;

        if (SiteAliases.TryGetValue(trimmedSiteName, out var mappedSiteName)
            && siteLookup.TryGetValue(mappedSiteName, out id))
            return id;

        return siteLookup.TryGetValue(NormalizeSiteKey(trimmedSiteName), out id) ? id : 0;
    }

    private static FuelAutoImportProfileDto NormalizeProfile(FuelAutoImportProfileDto profile)
    {
        profile.ScanPath = NormalizeScanPath(profile.ScanPath);
        profile.DuplicateHandling = FuelAutoImportProfileDto.NormalizeDuplicateHandling(profile.DuplicateHandling);
        return profile;
    }

    private static FuelAutoImportProfileDto? ResolveProfileForFilePath(string filePath, IReadOnlyCollection<FuelAutoImportProfileDto> profiles)
    {
        if (string.IsNullOrWhiteSpace(filePath) || profiles.Count == 0)
            return null;

        var normalizedFilePath = NormalizePathValue(filePath);

        return profiles
            .Where(profile => !string.IsNullOrWhiteSpace(profile.ScanPath))
            .OrderByDescending(profile => NormalizeScanPath(profile.ScanPath).Length)
            .FirstOrDefault(profile => IsPathWithinScanPath(normalizedFilePath, NormalizeScanPath(profile.ScanPath)));
    }

    private static string NormalizeScanPath(string scanPath)
    {
        if (string.IsNullOrWhiteSpace(scanPath))
            return scanPath;

        var normalized = NormalizePathValue(scanPath);
        return LegacyScanPathMappings.TryGetValue(normalized, out var mappedPath) ? mappedPath : normalized;
    }

    private static string NormalizePathValue(string path)
    {
        return path.Trim().TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
    }

    private static bool IsPathWithinScanPath(string filePath, string scanPath)
    {
        if (filePath.Equals(scanPath, StringComparison.OrdinalIgnoreCase))
            return true;

        return filePath.StartsWith(scanPath + Path.DirectorySeparatorChar, StringComparison.OrdinalIgnoreCase)
            || filePath.StartsWith(scanPath + Path.AltDirectorySeparatorChar, StringComparison.OrdinalIgnoreCase);
    }

    private static void AddLookupValue(Dictionary<string, int> lookup, string siteName, int siteId)
    {
        lookup.TryAdd(siteName, siteId);
        lookup.TryAdd(NormalizeSiteKey(siteName), siteId);
    }

    private static string NormalizeSiteKey(string value)
    {
        return System.Text.RegularExpressions.Regex.Replace(
            value.Trim().ToUpperInvariant(),
            @"[^A-Z0-9]+",
            string.Empty);
    }

    /// <summary>
    /// Sends a single summary notification for a completed batch scan cycle.
    /// Called once after ScanAndImportAsync processes all files.
    /// </summary>
    private async Task CreateBatchSummaryNotificationAsync(AutoImportResult result, string? userId, CancellationToken cancellationToken)
    {
        try
        {
            var hasFailures = result.FilesFailed > 0;
            var hasSkips = result.FilesSkippedNoSite > 0;

            NotificationType notificationType;
            NotificationPriority priority;
            string title;

            if (hasFailures && result.FilesSucceeded == 0)
            {
                notificationType = NotificationType.Error;
                priority = NotificationPriority.High;
                title = "Batch File Import Failed";
            }
            else if (hasFailures || hasSkips)
            {
                notificationType = NotificationType.Warning;
                priority = NotificationPriority.Medium;
                title = "Batch File Import Completed with Errors";
            }
            else
            {
                notificationType = NotificationType.Info;
                priority = NotificationPriority.Medium;
                title = "Batch File Import Completed";
            }

            var profileLabel = !string.IsNullOrWhiteSpace(result.ProfileName)
                ? $" ({result.ProfileName})"
                : string.Empty;

            var message = $"Batch import{profileLabel}: {result.FilesProcessed} file(s) processed — "
                + $"{result.FilesSucceeded} succeeded, {result.FilesFailed} failed, {result.FilesSkippedNoSite} skipped. "
                + $"{result.TotalRecordsImported} record(s) imported, {result.TotalDuplicatesSkipped} duplicate(s) skipped. "
                + $"Duration: {result.Duration.TotalSeconds:F1}s.";

            var errorsHtml = result.Errors.Any()
                ? "<ul style=\"margin:8px 0 0;padding-left:20px;\">" + string.Join("", result.Errors.Select(e => $"<li style=\"margin:2px 0;font-size:13px;\">{System.Net.WebUtility.HtmlEncode(e)}</li>")) + "</ul>"
                : "<p style=\"margin:0;color:#6b7280;font-size:13px;\">No errors.</p>";

            var emailBody = $@"<!DOCTYPE html>
<html>
<body style=""font-family:Segoe UI, Arial, sans-serif;background:#f8fafc;color:#0f172a;margin:0;padding:24px;"">
    <div style=""max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;"">
        <h2 style=""margin:0 0 12px;font-size:22px;"">Batch File Import Summary</h2>
        <p style=""margin:0 0 20px;color:#475569;line-height:1.6;"">{System.Net.WebUtility.HtmlEncode(message)}</p>

        <div style=""margin:0 0 20px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;"">
            <div style=""font-weight:700;margin-bottom:12px;"">File Counts</div>
            <table style=""width:100%;border-collapse:collapse;font-size:13px;"">
                <tr><td style=""padding:6px 0;font-weight:600;width:180px;"">Files Scanned</td><td style=""padding:6px 0;"">{result.FilesScanned}</td></tr>
                <tr><td style=""padding:6px 0;font-weight:600;"">Files Processed</td><td style=""padding:6px 0;"">{result.FilesProcessed}</td></tr>
                <tr><td style=""padding:6px 0;font-weight:600;"">Succeeded</td><td style=""padding:6px 0;"">{result.FilesSucceeded}</td></tr>
                <tr><td style=""padding:6px 0;font-weight:600;"">Failed</td><td style=""padding:6px 0;"">{result.FilesFailed}</td></tr>
                <tr><td style=""padding:6px 0;font-weight:600;"">Skipped (no site)</td><td style=""padding:6px 0;"">{result.FilesSkippedNoSite}</td></tr>
                <tr><td style=""padding:6px 0;font-weight:600;"">Unchanged (skipped)</td><td style=""padding:6px 0;"">{result.FilesSkippedUnchanged}</td></tr>
            </table>
        </div>

        <div style=""margin:0 0 20px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;"">
            <div style=""font-weight:700;margin-bottom:12px;"">Record Counts</div>
            <table style=""width:100%;border-collapse:collapse;font-size:13px;"">
                <tr><td style=""padding:6px 0;font-weight:600;width:180px;"">Records Imported</td><td style=""padding:6px 0;"">{result.TotalRecordsImported}</td></tr>
                <tr><td style=""padding:6px 0;font-weight:600;"">Duplicates Skipped</td><td style=""padding:6px 0;"">{result.TotalDuplicatesSkipped}</td></tr>
                <tr><td style=""padding:6px 0;font-weight:600;"">Duration</td><td style=""padding:6px 0;"">{result.Duration.TotalSeconds:F1}s</td></tr>
            </table>
        </div>

        <div style=""padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;"">
            <div style=""font-weight:700;margin-bottom:8px;"">Errors</div>
            {errorsHtml}
        </div>
    </div>
</body>
</html>";

            var eventData = new
            {
                ProfileId = result.ProfileId,
                ProfileName = result.ProfileName,
                FilesScanned = result.FilesScanned,
                FilesProcessed = result.FilesProcessed,
                FilesSucceeded = result.FilesSucceeded,
                FilesFailed = result.FilesFailed,
                FilesSkippedNoSite = result.FilesSkippedNoSite,
                FilesSkippedUnchanged = result.FilesSkippedUnchanged,
                TotalRecordsImported = result.TotalRecordsImported,
                TotalDuplicatesSkipped = result.TotalDuplicatesSkipped,
                DurationSeconds = result.Duration.TotalSeconds,
                Errors = result.Errors,
                ImportManagementLink = "/reports/import-management",
                EmailBodyHtml = emailBody
            };

            var notificationRequest = new CreateNotificationRequest
            {
                Type = notificationType,
                CategoryId = (int)WellKnownCategories.Generic,
                CategoryName = "File Importation Notification Details",
                Priority = priority,
                Title = title,
                Message = message,
                TriggerSource = "FuelImport",
                TriggeredBy = userId ?? "System",
                Data = eventData,
                DisableFallbackAllUsers = true,
                Recipients = !string.IsNullOrEmpty(userId)
                    ? new List<NotificationRecipientDto>
                    {
                        new NotificationRecipientDto
                        {
                            UserId = userId,
                            DeliveryMethods = new List<string> { DeliveryMethod.System.ToString(), DeliveryMethod.Email.ToString() },
                            ResolvedFrom = "FuelImport"
                        }
                    }
                    : null
            };

            var notifResult = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);

            if (notifResult.IsSuccess)
                _logger.LogInformation("Sent batch import summary notification: {Title}", title);
            else
                _logger.LogWarning("Failed to send batch import summary notification: {Error}", notifResult.Message);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to create batch import summary notification");
        }
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
