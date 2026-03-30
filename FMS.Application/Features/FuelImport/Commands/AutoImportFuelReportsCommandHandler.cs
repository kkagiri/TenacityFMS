/**
 * File: AutoImportFuelReportsCommandHandler.cs
 * Purpose: Handles the on-demand AutoImportFuelReportsCommand by delegating to IFuelAutoImportService.
 * Dependencies: IFuelAutoImportService, AutoImportFuelReportsCommand
 * Last Modified: 2026-03-30
 *
 * Key Functions:
 * - Handle: Routes to ScanAndImportAsync or ImportSingleFileAsync based on command properties
 */
using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelImport.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelImport.Commands;

public class AutoImportFuelReportsCommandHandler
    : IRequestHandler<AutoImportFuelReportsCommand, FMSResponse<AutoImportResult>>
{
    private readonly IFuelAutoImportService _autoImportService;
    private readonly ILogger<AutoImportFuelReportsCommandHandler> _logger;

    public AutoImportFuelReportsCommandHandler(
        IFuelAutoImportService autoImportService,
        ILogger<AutoImportFuelReportsCommandHandler> logger)
    {
        _autoImportService = autoImportService;
        _logger = logger;
    }

    public async Task<FMSResponse<AutoImportResult>> Handle(
        AutoImportFuelReportsCommand request,
        CancellationToken cancellationToken)
    {
        try
        {
            AutoImportResult result;

            if (!string.IsNullOrWhiteSpace(request.SingleFilePath))
            {
                // Single file import mode
                _logger.LogInformation("On-demand single file import: {FilePath} by {User}",
                    request.SingleFilePath, request.UserId);

                result = await _autoImportService.ImportSingleFileAsync(
                    request.SingleFilePath, request.UserId, cancellationToken);
            }
            else
            {
                // Full scan mode
                _logger.LogInformation("On-demand auto-import triggered by {User}. ProfileId: {Profile}, BatchSize: {Batch}, Type: {Type}",
                    request.UserId, request.ProfileId ?? "all", request.BatchSize, request.ReportTypeFilter ?? "all");

                var options = new AutoImportOptions
                {
                    ProfileId = request.ProfileId,
                    ScanPaths = request.ScanPaths,
                    ReportTypeFilter = request.ReportTypeFilter,
                    BatchSize = request.BatchSize,
                    IncludeRetries = request.IncludeRetries,
                    ForceReprocess = request.ForceReprocess,
                    UserId = request.UserId
                };

                result = await _autoImportService.ScanAndImportAsync(options, cancellationToken);
            }

            if (result.Errors.Any())
            {
                _logger.LogWarning("Auto-import completed with {ErrorCount} errors", result.Errors.Count);
                return FMSResponse<AutoImportResult>.Success(result,
                    $"Import completed with {result.FilesSucceeded} files imported, {result.FilesFailed} failed. Duration: {result.Duration.TotalSeconds:F1}s");
            }

            return FMSResponse<AutoImportResult>.Success(result,
                $"Import completed successfully. {result.FilesSucceeded} files, {result.TotalRecordsImported} records. Duration: {result.Duration.TotalSeconds:F1}s");
        }
        catch (OperationCanceledException)
        {
            _logger.LogInformation("Auto-import was cancelled by user");
            return FMSResponse<AutoImportResult>.Failed("Import was cancelled by user.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Auto-import command failed");
            return FMSResponse<AutoImportResult>.Failed($"Auto-import failed: {ex.Message}");
        }
    }
}
