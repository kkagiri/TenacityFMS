/**
 * File: ImportFuelReportCommand.cs
 * Purpose: Imports fuel consumption rows, tracks import history, and creates user-facing notifications.
 * Dependencies: GpsdataContext, INotificationService, FrontEndHub, AutoMapper
 * Last Modified: 2026-03-26
 *
 * Key Types:
 * - ImportFuelReportCommand: Import request including optional source file metadata
 * - ImportFuelReportCommandHandler: Validation, duplicate handling, persistence, history, notifications
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.FuelImport;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelImport.Commands
{
    public class ImportFuelReportCommand : IRequest<FMSResponse<ImportFuelReportResult>>
    {
        public List<ConsumptionDTO> Models { get; set; }
        public bool SkipDuplicates { get; set; } = false;
        public bool OverwriteExisting { get; set; } = false;
        public string UserId { get; set; } // For tracking who imported
        public string JobId { get; set; } // Async job correlation ID (optional)
        public string? SourceFileName { get; set; }
        public string? SourceFilePath { get; set; }
        public string? SourceReportType { get; set; }
        public string? SourceDetectedSiteName { get; set; }
        public string ImportMode { get; set; } = "Manual Import";
    }

    public class ImportFuelReportResult
    {
        public string ReportId { get; set; }
        public int TotalRecords { get; set; }
        public int TotalProcessed { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public int SkippedCount { get; set; }
        public int DuplicateCount { get; set; }
        public List<ImportDuplicateError> DuplicateRecords { get; set; } = new List<ImportDuplicateError>();
    }

    public class ImportDuplicateError
    {
        public int RowIndex { get; set; }
        public int VehicleId { get; set; }
        public string VehicleName { get; set; }
        public string SiteName { get; set; }
        public DateTime Date { get; set; }
        public bool IsNightShift { get; set; }
        public string Message { get; set; }
    }

    public class ImportProgressInfo
    {
        public string JobId { get; set; }
        public int TotalRecords { get; set; } = 0;
        public int ProcessedRecords { get; set; } = 0;
        public int SuccessCount { get; set; } = 0;
        public int FailureCount { get; set; } = 0;
        public int SkippedCount { get; set; } = 0;
        public int DuplicateCount { get; set; } = 0;
        public string ReportId { get; set; }
        public string Status { get; set; } = "Processing";
        public double ProgressPercentage { get; set; } = 0;

        public void UpdatePercentage()
        {
            ProgressPercentage = TotalRecords > 0 ? Math.Round((double)ProcessedRecords / TotalRecords * 100, 1) : 0;
        }
    }

    public class DuplicateRecordInfo : ImportDuplicateError
    {
        // Inherited properties from ImportDuplicateError
    }

    public class ImportFuelReportCommandHandler : IRequestHandler<ImportFuelReportCommand, FMSResponse<ImportFuelReportResult>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ImportFuelReportCommandHandler> _logger;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private readonly INotificationService _notificationService;
        private ImportProgressInfo _progressInfo = new ImportProgressInfo();

        public ImportFuelReportCommandHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<ImportFuelReportCommandHandler> logger,
            IHubContext<FrontEndHub> hubContext,
            INotificationService notificationService)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _hubContext = hubContext;
            _notificationService = notificationService;
        }

        private async Task UpdateProgressAsync(int processedRecords, int? successCount = null, int? failureCount = null, string status = null)
        {
            _progressInfo.ProcessedRecords = processedRecords;

            if (successCount.HasValue)
                _progressInfo.SuccessCount = successCount.Value;

            if (failureCount.HasValue)
                _progressInfo.FailureCount = failureCount.Value;

            if (status != null)
                _progressInfo.Status = status;

            _progressInfo.UpdatePercentage();

            // Send progress update via SignalR
            await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo);

            _logger.LogInformation("Import progress: {ProcessedRecords}/{TotalRecords} records ({Percentage}%)",
                _progressInfo.ProcessedRecords,
                _progressInfo.TotalRecords,
                _progressInfo.ProgressPercentage);
        }

        public async Task<FMSResponse<ImportFuelReportResult>> Handle(ImportFuelReportCommand request, CancellationToken cancellationToken)
        {
            var reportId = Guid.NewGuid().ToString("N");
            var vehicleConsumptions = new List<Vehicleconsumption>();
            var resultConsumptions = new List<ConsumptionDTO>();
            List<ImportDuplicateError> skippedDuplicates = new List<ImportDuplicateError>();
            var sourceModels = request.Models.ToList();

            _progressInfo = new ImportProgressInfo
            {
                JobId = request.JobId,
                ReportId = reportId,
                TotalRecords = request.Models.Count,
                ProcessedRecords = 0,
                SuccessCount = 0,
                FailureCount = 0
            };

            // Send initial progress
            _progressInfo.Status = "Validating";
            _progressInfo.UpdatePercentage();
            await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo, cancellationToken);

            _logger.LogInformation("Starting import of {Count} fuel consumption records", request.Models.Count);

            // Handle potential DriverName property if present
            foreach (var model in request.Models)
            {
                var modelType = model.GetType();
                var driverNameProperty = modelType.GetProperty("DriverName");
                if (driverNameProperty != null)
                {
                    var driverName = driverNameProperty.GetValue(model) as string;
                    if (!string.IsNullOrEmpty(driverName) && string.IsNullOrEmpty(model.EmployeeName))
                    {
                        model.EmployeeName = driverName;
                    }
                }
            }

            // Propagate OverwriteExisting flag
            if (request.OverwriteExisting)
            {
                foreach (var consumption in request.Models)
                {
                    consumption.OverwriteExisting = true;
                }
            }

            // Validation
            var validationErrors = await ValidateImportData(request.Models, cancellationToken);
            if (validationErrors.Any())
            {
                _progressInfo.Status = "Failed: Validation";
                _progressInfo.UpdatePercentage();
                await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo, cancellationToken);
                return new FMSResponse<ImportFuelReportResult>
                {
                    IsSuccess = false,
                    Message = "Validation failed: " + string.Join("; ", validationErrors),
                    ValidationErrors = validationErrors
                };
            }

            // Check for duplicates
            List<DuplicateRecordInfo> duplicateCheck = new List<DuplicateRecordInfo>();

            // Only fail the import if we're NOT skipping duplicates AND NOT overwriting
            bool shouldFailOnDuplicates = !request.SkipDuplicates && !request.Models.Any(c => c.OverwriteExisting == true);

            if (shouldFailOnDuplicates)
            {
                _progressInfo.Status = "Checking duplicates";
                _progressInfo.UpdatePercentage();
                await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo, cancellationToken);
                duplicateCheck = await CheckForExistingDuplicates(request.Models, cancellationToken);
                if (duplicateCheck.Any())
                {
                    _progressInfo.DuplicateCount = duplicateCheck.Count();
                    _progressInfo.Status = "Failed: Duplicate Records";
                    await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo, cancellationToken);

                    // Create persistent notification for duplicate detection
                    await CreateImportNotificationAsync(
                        request,
                        reportId,
                        isSuccess: false,
                        successCount: 0,
                        failedCount: 0,
                        skippedCount: duplicateCheck.Count(),
                        duplicateCount: duplicateCheck.Count(),
                        sourceModels: sourceModels,
                        errorMessage: $"{duplicateCheck.Count()} duplicate record(s) detected - import stopped.",
                        cancellationToken: cancellationToken);

                    return new FMSResponse<ImportFuelReportResult>
                    {
                        IsSuccess = false,
                        Message = "Duplicate entry detected – one or more Vehicle / Date / Shift combinations already exist.",
                        Data = new ImportFuelReportResult
                        {
                            DuplicateRecords = duplicateCheck.Cast<ImportDuplicateError>().ToList(),
                            TotalRecords = 0,
                            TotalProcessed = 0,
                            SuccessCount = 0,
                            FailureCount = 0,
                            SkippedCount = duplicateCheck.Count(),
                            ReportId = reportId,
                            DuplicateCount = duplicateCheck.Count()
                        }
                    };
                }
            }

            // Handle overwrite logic
            var modelsToOverwrite = request.Models.Where(m => m.OverwriteExisting == true).ToList();
            if (modelsToOverwrite.Any())
            {
                await HandleOverwriteLogic(modelsToOverwrite, cancellationToken);
            }

            // Handle skip duplicates logic - this should run independently of the above
            if (request.SkipDuplicates)
            {
                _logger.LogInformation($"SkipDuplicates=true, checking for duplicates in {request.Models.Count} records");

                // Ensure all models have a RowIndex set for proper tracking
                for (int idx = 0; idx < request.Models.Count; idx++)
                {
                    if (request.Models[idx].RowIndex == null)
                    {
                        request.Models[idx].RowIndex = idx;
                    }
                }

                // First, check for duplicates WITHIN the import file itself (intra-batch duplicates)
                var intraBatchDuplicates = await FindIntraBatchDuplicatesAsync(request.Models, cancellationToken);
                if (intraBatchDuplicates.Any())
                {
                    _logger.LogInformation($"Found {intraBatchDuplicates.Count} intra-batch duplicates (same vehicle/date/shift within import file)");
                    skippedDuplicates.AddRange(intraBatchDuplicates.Cast<ImportDuplicateError>());
                    var intraBatchIndicesToSkip = intraBatchDuplicates.Select(d => d.RowIndex).ToHashSet();
                    var beforeCount = request.Models.Count;
                    request.Models = request.Models.Where(c => !intraBatchIndicesToSkip.Contains(c.RowIndex ?? -1)).ToList();
                    _logger.LogDebug($"After intra-batch filtering: {beforeCount} -> {request.Models.Count} records remaining");
                }

                // Then check for duplicates against existing database records
                var duplicateRecords = await CheckForExistingDuplicates(request.Models, cancellationToken);
                if (duplicateRecords.Any())
                {
                    _logger.LogInformation($"Found {duplicateRecords.Count()} duplicate records in database, filtering them out");
                    skippedDuplicates.AddRange(duplicateRecords.Cast<ImportDuplicateError>());
                    var indicesToSkip = duplicateRecords.Select(d => d.RowIndex).ToHashSet();
                    var beforeCount = request.Models.Count;
                    request.Models = request.Models.Where(c => !indicesToSkip.Contains(c.RowIndex ?? -1)).ToList();
                    _logger.LogInformation($"After filtering: {beforeCount} -> {request.Models.Count} records remaining");
                }

                _progressInfo.DuplicateCount = skippedDuplicates.Count;
                _progressInfo.SkippedCount = skippedDuplicates.Count;

                if (!request.Models.Any())
                {
                    await CreateImportNotificationAsync(
                        request,
                        reportId,
                        isSuccess: true,
                        successCount: 0,
                        failedCount: 0,
                        skippedCount: skippedDuplicates.Count,
                        duplicateCount: skippedDuplicates.Count,
                        sourceModels: sourceModels,
                        errorMessage: $"All {skippedDuplicates.Count} records were duplicates and skipped.",
                        cancellationToken: cancellationToken);

                    return new FMSResponse<ImportFuelReportResult>
                    {
                        IsSuccess = true,
                        Message = $"All {skippedDuplicates.Count} records were duplicates and skipped.",
                        Data = new ImportFuelReportResult
                        {
                            DuplicateRecords = skippedDuplicates,
                            TotalRecords = 0,
                            TotalProcessed = 0,
                            SuccessCount = 0,
                            FailureCount = 0,
                            SkippedCount = skippedDuplicates.Count,
                            ReportId = reportId,
                            DuplicateCount = skippedDuplicates.Count
                        }
                    };
                }

                _progressInfo.TotalRecords = request.Models.Count;
                await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo, cancellationToken);
            }

            _logger.LogInformation("Using GUID ReportId: {ReportId}", reportId);
            _logger.LogInformation("Starting to process {Count} records for import", request.Models.Count);

            // Process in batches
            const int batchSize = 100;
            int processedCount = 0;
            int processedWithErrors = 0;

            for (int i = 0; i < request.Models.Count; i += batchSize)
            {
                var batch = request.Models.Skip(i).Take(Math.Min(batchSize, request.Models.Count - i)).ToList();

                foreach (var consumptionDto in batch)
                {
                    try
                    {
                        var entity = _mapper.Map<Vehicleconsumption>(consumptionDto);
                        entity.IsModified = 0;
                        entity.ReportId = reportId;
                        vehicleConsumptions.Add(entity);
                        processedCount++;
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error mapping consumption record at index {Index}", i);
                        processedWithErrors++;
                    }
                }

                await UpdateProgressAsync(processedCount, processedCount, processedWithErrors);
            }

            _logger.LogInformation("Prepared {Count} vehicle consumption entities for database insert", vehicleConsumptions.Count);
            await _context.Vehicleconsumptions.AddRangeAsync(vehicleConsumptions, cancellationToken);

            try
            {
                await UpdateProgressAsync(processedCount, processedCount, processedWithErrors, "Saving");
                _logger.LogInformation("Attempting to save {Count} records to database...", vehicleConsumptions.Count);
                await _context.SaveChangesAsync(cancellationToken);
                _logger.LogInformation("Successfully saved {Count} records to database", vehicleConsumptions.Count);

                // ✅ NEW: Track import history for calendar visualization
                await TrackImportHistory(sourceModels, reportId, request.UserId, "Success", cancellationToken, request.SourceFileName);

                foreach (var savedEntity in vehicleConsumptions)
                {
                    var resultDto = _mapper.Map<ConsumptionDTO>(savedEntity);
                    resultConsumptions.Add(resultDto);
                }

                await UpdateProgressAsync(processedCount, processedCount, processedWithErrors, "Completed");

                var successResponse = new FMSResponse<ImportFuelReportResult>();
                successResponse.IsSuccess = true;

                if (skippedDuplicates.Any())
                {
                    successResponse.Message = $"Successfully imported {resultConsumptions.Count} consumption records. {skippedDuplicates.Count} duplicate records were skipped.";
                    successResponse.Data = new ImportFuelReportResult
                    {
                        ReportId = reportId,
                        TotalRecords = request.Models.Count + skippedDuplicates.Count,
                        TotalProcessed = processedCount,
                        SuccessCount = processedCount,
                        FailureCount = processedWithErrors,
                        SkippedCount = skippedDuplicates.Count,
                        DuplicateCount = skippedDuplicates.Count,
                        DuplicateRecords = skippedDuplicates
                    };
                }
                else
                {
                    successResponse.Message = $"Successfully imported {resultConsumptions.Count} consumption records.";
                    successResponse.Data = new ImportFuelReportResult
                    {
                        ReportId = reportId,
                        TotalRecords = request.Models.Count,
                        TotalProcessed = processedCount,
                        SuccessCount = processedCount,
                        FailureCount = processedWithErrors,
                        SkippedCount = 0,
                        DuplicateCount = 0
                    };
                }

                // Create persistent notification for successful import
                await CreateImportNotificationAsync(
                    request,
                    reportId,
                    isSuccess: true,
                    successCount: successResponse.Data.SuccessCount,
                    failedCount: successResponse.Data.FailureCount,
                    skippedCount: successResponse.Data.SkippedCount,
                    duplicateCount: successResponse.Data.DuplicateCount,
                    sourceModels: sourceModels,
                    cancellationToken: cancellationToken);

                return successResponse;
            }
            catch (DbUpdateException ex)
            {
                bool isUniqueConstraint = IsUniqueConstraintViolation(ex);
                bool isForeignKeyViolation = IsForeignKeyViolation(ex);

                // If SkipDuplicates is true and we got a unique constraint error, retry one-by-one
                if (request.SkipDuplicates && isUniqueConstraint)
                {
                    _logger.LogWarning("Batch insert failed with duplicate error. SkipDuplicates=true, retrying records one-by-one...");

                    // Clear the change tracker to remove the failed batch
                    foreach (var entity in vehicleConsumptions)
                    {
                        _context.Entry(entity).State = EntityState.Detached;
                    }

                    var savedCount = 0;
                    var failedDuplicates = new List<ImportDuplicateError>();

                    foreach (var entity in vehicleConsumptions)
                    {
                        try
                        {
                            _context.Vehicleconsumptions.Add(entity);
                            await _context.SaveChangesAsync(cancellationToken);
                            savedCount++;
                            resultConsumptions.Add(_mapper.Map<ConsumptionDTO>(entity));
                        }
                        catch (DbUpdateException innerEx)
                        {
                            // Detach the failed entity
                            _context.Entry(entity).State = EntityState.Detached;

                            if (IsUniqueConstraintViolation(innerEx))
                            {
                                _logger.LogDebug($"Skipping duplicate: VehicleId={entity.VehicleId}, Date={entity.Date:yyyy-MM-dd}, IsNightShift={entity.IsNightShift}");
                                failedDuplicates.Add(new ImportDuplicateError
                                {
                                    VehicleId = entity.VehicleId,
                                    Date = entity.Date,
                                    IsNightShift = entity.IsNightShift == 1UL,
                                    Message = $"Duplicate: Vehicle {entity.VehicleId} on {entity.Date:yyyy-MM-dd} {(entity.IsNightShift == 1UL ? "night" : "day")} shift already exists"
                                });
                            }
                            else
                            {
                                _logger.LogError(innerEx, $"Non-duplicate error for VehicleId={entity.VehicleId}");
                                processedWithErrors++;
                            }
                        }
                    }

                    // Combine with any previously skipped duplicates
                    skippedDuplicates.AddRange(failedDuplicates);

                    if (savedCount > 0)
                    {
                        await TrackImportHistory(sourceModels, reportId, request.UserId, "Partial", cancellationToken, request.SourceFileName);

                        var partialResponse = new FMSResponse<ImportFuelReportResult>
                        {
                            IsSuccess = true,
                            Message = $"Imported {savedCount} records successfully. {skippedDuplicates.Count} duplicate records were skipped.",
                            Data = new ImportFuelReportResult
                            {
                                ReportId = reportId,
                                TotalRecords = vehicleConsumptions.Count + skippedDuplicates.Count,
                                TotalProcessed = savedCount,
                                SuccessCount = savedCount,
                                FailureCount = processedWithErrors,
                                SkippedCount = skippedDuplicates.Count,
                                DuplicateCount = skippedDuplicates.Count,
                                DuplicateRecords = skippedDuplicates
                            }
                        };

                        await CreateImportNotificationAsync(
                            request,
                            reportId,
                            isSuccess: true,
                            successCount: savedCount,
                            failedCount: processedWithErrors,
                            skippedCount: skippedDuplicates.Count,
                            duplicateCount: skippedDuplicates.Count,
                            sourceModels: sourceModels,
                            cancellationToken: cancellationToken);

                        return partialResponse;
                    }
                    else
                    {
                        await CreateImportNotificationAsync(
                            request,
                            reportId,
                            isSuccess: true,
                            successCount: 0,
                            failedCount: 0,
                            skippedCount: skippedDuplicates.Count,
                            duplicateCount: skippedDuplicates.Count,
                            sourceModels: sourceModels,
                            errorMessage: $"All {skippedDuplicates.Count} records were duplicates and skipped.",
                            cancellationToken: cancellationToken);

                        // All records were duplicates
                        return new FMSResponse<ImportFuelReportResult>
                        {
                            IsSuccess = true,
                            Message = $"All {skippedDuplicates.Count} records were duplicates and skipped.",
                            Data = new ImportFuelReportResult
                            {
                                ReportId = reportId,
                                TotalRecords = skippedDuplicates.Count,
                                TotalProcessed = 0,
                                SuccessCount = 0,
                                FailureCount = 0,
                                SkippedCount = skippedDuplicates.Count,
                                DuplicateCount = skippedDuplicates.Count,
                                DuplicateRecords = skippedDuplicates
                            }
                        };
                    }
                }

                // Original error handling for non-skip cases
                await UpdateProgressAsync(processedCount, 0, processedCount, "Failed: Database Error");
                await TrackImportHistory(sourceModels, reportId, request.UserId, "Failed", cancellationToken, request.SourceFileName, ex.Message);

                var errorResponse = new FMSResponse<ImportFuelReportResult>();
                errorResponse.IsSuccess = false;

                if (isUniqueConstraint)
                {
                    var duplicates = ExtractDuplicatesFromException(ex, request.Models);
                    await UpdateProgressAsync(processedCount, processedCount - duplicates.Count, duplicates.Count, "Failed: Duplicate Records");
                    errorResponse.Message = "Duplicate entry detected – one or more Vehicle / Date / Shift combinations already exist.";
                    errorResponse.Data = new ImportFuelReportResult
                    {
                        DuplicateRecords = duplicates.Cast<ImportDuplicateError>().ToList(),
                        TotalRecords = 0,
                        TotalProcessed = 0,
                        SuccessCount = 0,
                        FailureCount = 0,
                        SkippedCount = duplicates.Count(),
                        ReportId = reportId,
                        DuplicateCount = duplicates.Count()
                    };
                }
                else if (isForeignKeyViolation)
                {
                    errorResponse.Message = "Foreign key constraint failed – one or more referenced Vehicles or Sites do not exist.";
                    errorResponse.Data = new ImportFuelReportResult();
                }
                else
                {
                    errorResponse.Message = "Database error occurred while saving the fuel report. Please check your data or contact support.";
                    errorResponse.Data = new ImportFuelReportResult();
                }

                // Create persistent notification for failed import
                var failedData = errorResponse.Data ?? new ImportFuelReportResult();
                await CreateImportNotificationAsync(
                    request,
                    reportId,
                    isSuccess: false,
                    successCount: failedData.SuccessCount,
                    failedCount: failedData.FailureCount > 0 ? failedData.FailureCount : 1,
                    skippedCount: failedData.SkippedCount,
                    duplicateCount: failedData.DuplicateCount,
                    sourceModels: sourceModels,
                    errorMessage: errorResponse.Message,
                    cancellationToken: cancellationToken);

                return errorResponse;
            }
        }

        /// <summary>
        /// NEW: Track import history for calendar visualization
        /// </summary>
        private async Task TrackImportHistory(List<ConsumptionDTO> models, string reportId, string userId, string status, CancellationToken cancellationToken, string? fileName = null, string notes = null)
        {
            try
            {
                if (!models.Any())
                {
                    _logger.LogWarning("No models to track for import history");
                    return;
                }

                // Get date range from the imported data
                var dates = models.Select(m => m.Date.Date).ToList();
                var startDate = dates.Min();
                var endDate = dates.Max();

                // Get site info (may be null for some imports)
                var siteId = models.Where(m => m.SiteId > 0).Select(m => m.SiteId).FirstOrDefault();

                // Calculate counts
                var totalRecords = models.Count;
                var successCount = status == "Success" ? totalRecords : 0;
                var failedCount = status == "Failed" ? totalRecords : 0;

                // Create a single import log entry for the entire batch
                var importLog = new FuelReportImportHistory
                {
                    ReportId = reportId,
                    ImportDate = DateTime.Now,
                    StartDate = startDate,
                    EndDate = endDate,
                    SiteId = siteId > 0 ? (int?)siteId : null,
                    TotalRecords = totalRecords,
                    SuccessCount = successCount,
                    FailedCount = failedCount,
                    SkippedCount = 0,
                    DuplicateCount = 0,
                    Status = status,
                    FileName = fileName,
                    ImportedBy = userId ?? "System"
                };

                await _context.Set<FuelReportImportHistory>().AddAsync(importLog, cancellationToken);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Tracked import history for reportId {ReportId}: {TotalRecords} records from {StartDate} to {EndDate}",
                    reportId, totalRecords, startDate, endDate);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to track import history for reportId {ReportId}", reportId);
                // Don't fail the entire import if history tracking fails
            }
        }

        /// <summary>
        /// Creates a persistent notification for fuel import completion
        /// </summary>
        private async Task CreateImportNotificationAsync(
            ImportFuelReportCommand request,
            string reportId,
            bool isSuccess,
            int successCount,
            int failedCount,
            int skippedCount,
            int duplicateCount,
            List<ConsumptionDTO> sourceModels,
            string errorMessage = null,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var notificationType = isSuccess ? NotificationType.Info : NotificationType.Error;
                var priority = isSuccess ? NotificationPriority.Medium : NotificationPriority.High;
                var sourceFileName = string.IsNullOrWhiteSpace(request.SourceFileName) ? "Manual Import" : request.SourceFileName;
                var latestRecord = await BuildLatestRecordSnapshotAsync(sourceModels, cancellationToken);

                string title;
                string message;

                if (isSuccess && failedCount == 0 && skippedCount == 0)
                {
                    title = "File Import Completed";
                    message = $"File '{sourceFileName}' imported successfully with {successCount} fuel consumption record(s). Report ID: {reportId}";
                }
                else if (isSuccess && (skippedCount > 0 || duplicateCount > 0))
                {
                    title = "File Import Completed with Skipped Records";
                    message = $"File '{sourceFileName}' imported {successCount} record(s). {skippedCount} skipped, {duplicateCount} duplicate(s). Report ID: {reportId}";
                    notificationType = NotificationType.Warning;
                }
                else if (!isSuccess && duplicateCount > 0)
                {
                    title = "File Import Stopped - Duplicates Found";
                    message = $"File '{sourceFileName}' import stopped: {duplicateCount} duplicate record(s) already exist in the database.";
                }
                else
                {
                    title = "File Import Failed";
                    message = errorMessage ?? $"File '{sourceFileName}' import failed with {failedCount} error(s). Please check the data and try again.";
                }

                if (latestRecord != null)
                {
                    message += $" Latest record: {latestRecord.RecordDate:dd-MMM-yyyy HH:mm} | {latestRecord.VehicleLabel} | {latestRecord.SiteLabel} | {latestRecord.Shift}.";
                }

                var eventData = new
                {
                    ReportId = reportId,
                    FileName = sourceFileName,
                    FilePath = request.SourceFilePath,
                    ReportType = request.SourceReportType,
                    DetectedSiteName = request.SourceDetectedSiteName,
                    ImportMode = request.ImportMode,
                    SuccessCount = successCount,
                    FailedCount = failedCount,
                    SkippedCount = skippedCount,
                    DuplicateCount = duplicateCount,
                    LatestRecord = latestRecord,
                    ImportManagementLink = "/reports/import-management",
                    EmailBodyHtml = BuildImportNotificationEmailBody(
                        sourceFileName,
                        reportId,
                        request,
                        successCount,
                        failedCount,
                        skippedCount,
                        duplicateCount,
                        message,
                        latestRecord)
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
                    TriggeredBy = request.UserId ?? "System",
                    Data = eventData,
                    DisableFallbackAllUsers = true, // Only send to the uploader, not all users
                    Recipients = !string.IsNullOrEmpty(request.UserId)
                        ? new List<NotificationRecipientDto>
                        {
                            new NotificationRecipientDto
                            {
                                UserId = request.UserId,
                                DeliveryMethods = new List<string> { DeliveryMethod.System.ToString(), DeliveryMethod.Email.ToString() },
                                ResolvedFrom = "FuelImport"
                            }
                        }
                        : null
                };

                var result = await _notificationService.CreateNotificationAsync(notificationRequest, cancellationToken);

                if (result.IsSuccess)
                {
                    _logger.LogInformation("Created import notification for reportId {ReportId}: {Title}", reportId, title);
                }
                else
                {
                    _logger.LogWarning("Failed to create import notification: {Error}", result.Message);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to create import notification for reportId {ReportId}", reportId);
                // Don't fail the import if notification creation fails
            }
        }

        private async Task<ImportLatestRecordSnapshot?> BuildLatestRecordSnapshotAsync(
            List<ConsumptionDTO> models,
            CancellationToken cancellationToken)
        {
            if (models == null || models.Count == 0)
            {
                return null;
            }

            var latest = models
                .OrderByDescending(model => model.Date)
                .ThenByDescending(model => model.RowIndex ?? -1)
                .First();

            var vehicleLabel = latest.VehicleId > 0
                ? await _context.Vehicles
                    .Where(vehicle => vehicle.VehicleId == latest.VehicleId)
                    .Select(vehicle => vehicle.HyoungNo)
                    .FirstOrDefaultAsync(cancellationToken)
                : null;

            var siteLabel = latest.SiteId > 0
                ? await _context.Sites
                    .Where(site => site.Id == latest.SiteId)
                    .Select(site => site.Name)
                    .FirstOrDefaultAsync(cancellationToken)
                : null;

            return new ImportLatestRecordSnapshot
            {
                RecordDate = latest.Date,
                VehicleId = latest.VehicleId,
                VehicleLabel = string.IsNullOrWhiteSpace(vehicleLabel) ? $"Vehicle #{latest.VehicleId}" : vehicleLabel,
                SiteId = latest.SiteId,
                SiteLabel = string.IsNullOrWhiteSpace(siteLabel) ? $"Site #{latest.SiteId}" : siteLabel,
                Shift = latest.IsNightShift ? "Night Shift" : "Day Shift",
                EmployeeName = latest.EmployeeName,
                TotalFuel = latest.TotalFuel,
                TotalDistance = latest.TotalDistance,
                EngineHours = latest.EngHours,
                FuelEfficiency = latest.FuelEfficiency,
            };
        }

        private static string BuildImportNotificationEmailBody(
            string sourceFileName,
            string reportId,
            ImportFuelReportCommand request,
            int successCount,
            int failedCount,
            int skippedCount,
            int duplicateCount,
            string message,
            ImportLatestRecordSnapshot? latestRecord)
        {
            static string Encode(string? value) => WebUtility.HtmlEncode(value ?? string.Empty);
            static string FormatNumber(decimal? value) => value.HasValue ? value.Value.ToString("N2") : "-";

            var latestRecordHtml = latestRecord == null
                ? "<p style=\"margin:0;color:#6b7280;\">No latest record snapshot was available.</p>"
                : $@"<table style=\"width: 100 %; border - collapse:collapse; font - size:13px;\">
                        < tr >< td style =\"padding:6px 0;font-weight:600;width:180px;\">Record Date</td><td style=\"padding:6px 0;\">{Encode(latestRecord.RecordDate.ToString("dd - MMM - yyyy HH: mm"))}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Vehicle</td><td style=\"padding:6px 0;\">{Encode(latestRecord.VehicleLabel)}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Site</td><td style=\"padding:6px 0;\">{Encode(latestRecord.SiteLabel)}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Shift</td><td style=\"padding:6px 0;\">{Encode(latestRecord.Shift)}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Employee</td><td style=\"padding:6px 0;\">{Encode(latestRecord.EmployeeName)}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Total Fuel</td><td style=\"padding:6px 0;\">{Encode(FormatNumber(latestRecord.TotalFuel))}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Total Distance</td><td style=\"padding:6px 0;\">{Encode(FormatNumber(latestRecord.TotalDistance))}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Engine Hours</td><td style=\"padding:6px 0;\">{Encode(FormatNumber(latestRecord.EngineHours))}</td></tr>
                        < tr >< td style =\"padding:6px 0;font-weight:600;\">Fuel Efficiency</td><td style=\"padding:6px 0;\">{Encode(FormatNumber(latestRecord.FuelEfficiency))}</td></tr>
                    </ table > ";

            return $@"<!DOCTYPE html>
<html>
<body style=\"font - family:Segoe UI, Arial, sans-serif; background:#f8fafc;color:#0f172a;margin:0;padding:24px;\">
    < div style =\"max-width:760px;margin:0 auto;background:#ffffff;border:1px solid #e2e8f0;border-radius:12px;padding:24px;\">
        < h2 style =\"margin:0 0 12px;font-size:22px;\">File Importation Notification Details</h2>
        < p style =\"margin:0 0 20px;color:#475569;line-height:1.6;\">{Encode(message)}</p>

        < div style =\"margin:0 0 20px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;\">
            < div style =\"font-weight:700;margin-bottom:12px;\">Import File Summary</div>
            < table style =\"width:100%;border-collapse:collapse;font-size:13px;\">
                < tr >< td style =\"padding:6px 0;font-weight:600;width:180px;\">File Name</td><td style=\"padding:6px 0;\">{Encode(sourceFileName)}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">File Path</td><td style=\"padding:6px 0;word-break:break-all;\">{Encode(request.SourceFilePath)}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">Import Mode</td><td style=\"padding:6px 0;\">{Encode(request.ImportMode)}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">Report Type</td><td style=\"padding:6px 0;\">{Encode(request.SourceReportType)}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">Detected Site</td><td style=\"padding:6px 0;\">{Encode(request.SourceDetectedSiteName)}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">Report ID</td><td style=\"padding:6px 0;\">{Encode(reportId)}</td></tr>
            </ table >
        </ div >

        < div style =\"margin:0 0 20px;padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;\">
            < div style =\"font-weight:700;margin-bottom:12px;\">Import Counts</div>
            < table style =\"width:100%;border-collapse:collapse;font-size:13px;\">
                < tr >< td style =\"padding:6px 0;font-weight:600;width:180px;\">Imported</td><td style=\"padding:6px 0;\">{successCount}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">Failed</td><td style=\"padding:6px 0;\">{failedCount}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">Skipped</td><td style=\"padding:6px 0;\">{skippedCount}</td></tr>
                < tr >< td style =\"padding:6px 0;font-weight:600;\">Duplicates</td><td style=\"padding:6px 0;\">{duplicateCount}</td></tr>
            </ table >
        </ div >

        < div style =\"padding:16px;background:#f8fafc;border-radius:10px;border:1px solid #e2e8f0;\">
            < div style =\"font-weight:700;margin-bottom:12px;\">Latest Record In File</div>
            { latestRecordHtml}
        </ div >
    </ div >
</ body >
</ html > ";
        }

        private sealed class ImportLatestRecordSnapshot
        {
            public DateTime RecordDate { get; set; }
            public int VehicleId { get; set; }
            public string VehicleLabel { get; set; } = null!;
            public int SiteId { get; set; }
            public string SiteLabel { get; set; } = null!;
            public string Shift { get; set; } = null!;
            public string? EmployeeName { get; set; }
            public decimal? TotalFuel { get; set; }
            public decimal? TotalDistance { get; set; }
            public decimal? EngineHours { get; set; }
            public decimal? FuelEfficiency { get; set; }
        }

        private async Task<List<string>> ValidateImportData(List<ConsumptionDTO> models, CancellationToken cancellationToken)
        {
            var validationErrors = new List<string>();

            var requestedVehicleIds = models.Where(c => c.VehicleId > 0).Select(c => c.VehicleId).Distinct().ToList();
            if (requestedVehicleIds.Any())
            {
                var allDbVehicleIds = await _context.Vehicles.Select(v => v.VehicleId).ToListAsync(cancellationToken);
                var existingVehicleIds = allDbVehicleIds.Where(id => requestedVehicleIds.Contains(id)).ToList();
                var missingVehicleIds = requestedVehicleIds.Except(existingVehicleIds).ToList();

                if (missingVehicleIds.Any())
                {
                    validationErrors.Add($"The following vehicle IDs do not exist: {string.Join(", ", missingVehicleIds)}");
                }
            }

            var invalidVehicleIds = models.Where(c => c.VehicleId <= 0).Select((item, index) => new { Index = index, VehicleId = item.VehicleId }).ToList();
            if (invalidVehicleIds.Any())
            {
                validationErrors.Add($"The following records have invalid vehicle IDs: {string.Join(", ", invalidVehicleIds.Select(x => $"Row {x.Index + 1} (ID: {x.VehicleId})"))}");
            }

            var requestedSiteIds = models.Where(c => c.SiteId > 0 && !c.IsKmperLiter).Select(c => c.SiteId).Distinct().ToList();
            if (requestedSiteIds.Any())
            {
                var allDbSiteIds = await _context.Sites.Select(s => s.Id).ToListAsync(cancellationToken);
                var existingSiteIds = allDbSiteIds.Where(id => requestedSiteIds.Contains(id)).ToList();
                var missingSiteIds = requestedSiteIds.Except(existingSiteIds).ToList();

                if (missingSiteIds.Any())
                {
                    validationErrors.Add($"The following site IDs do not exist: {string.Join(", ", missingSiteIds)}");
                }
            }

            var invalidSiteIds = models.Where(c => !c.IsKmperLiter && c.SiteId <= 0).Select((item, index) => new { Index = index, SiteId = item.SiteId }).ToList();
            if (invalidSiteIds.Any())
            {
                validationErrors.Add($"The following records require valid site IDs (for L/Hr record type): {string.Join(", ", invalidSiteIds.Select(x => $"Row {x.Index + 1} (ID: {x.SiteId})"))}");
            }

            return validationErrors;
        }

        private async Task HandleOverwriteLogic(List<ConsumptionDTO> modelsToOverwrite, CancellationToken cancellationToken)
        {
            var overwriteKeyDetails = modelsToOverwrite
                .Select(c => new { c.VehicleId, Date = c.Date.Date, c.IsNightShift })
                .Distinct()
                .ToList();

            if (overwriteKeyDetails.Any())
            {
                var vehicleIdsInKeys = overwriteKeyDetails.Select(k => k.VehicleId).Distinct().ToList();
                var minDateInKeys = overwriteKeyDetails.Min(k => k.Date);
                var maxDateInKeys = overwriteKeyDetails.Max(k => k.Date);

                var candidateDbRecordsByDate = await _context.Vehicleconsumptions
                    .Where(vc => vc.Date.Date >= minDateInKeys && vc.Date.Date <= maxDateInKeys)
                    .ToListAsync(cancellationToken);

                var candidateDbRecordsByDateAndVehicle = candidateDbRecordsByDate
                    .Where(vc => vehicleIdsInKeys.Contains(vc.VehicleId))
                    .ToList();

                var recordsToDelete = new List<Vehicleconsumption>();
                var keysHashSet = new HashSet<(int VehicleId, DateTime Date, bool IsNightShift)>(
                    overwriteKeyDetails.Select(k => (k.VehicleId, k.Date, k.IsNightShift))
                );

                foreach (var dbRecord in candidateDbRecordsByDateAndVehicle)
                {
                    if (keysHashSet.Contains((dbRecord.VehicleId, dbRecord.Date.Date, dbRecord.IsNightShift == 1UL)))
                    {
                        recordsToDelete.Add(dbRecord);
                    }
                }

                var distinctRecordsToDelete = recordsToDelete.Distinct().ToList();
                if (distinctRecordsToDelete.Any())
                {
                    _logger.LogInformation($"Removing {distinctRecordsToDelete.Count()} existing records for overwrite");
                    _context.Vehicleconsumptions.RemoveRange(distinctRecordsToDelete);
                    await _context.SaveChangesAsync(cancellationToken);
                }
            }
        }

        /// <summary>
        /// Finds duplicate records WITHIN the import batch itself (same vehicle/date/shift combination appearing multiple times in the import file)
        /// </summary>
        private async Task<List<DuplicateRecordInfo>> FindIntraBatchDuplicatesAsync(List<ConsumptionDTO> models, CancellationToken cancellationToken)
        {
            var duplicates = new List<DuplicateRecordInfo>();
            var seen = new Dictionary<(int VehicleId, DateTime Date, bool IsNightShift), (int RowIndex, ConsumptionDTO Model)>(); // Track first occurrence

            // Pre-load vehicle and site names for better reporting
            var vehicleIds = models.Select(m => m.VehicleId).Distinct().ToList();
            var siteIds = models.Where(m => m.SiteId > 0).Select(m => m.SiteId).Distinct().ToList();

            var vehicleNames = await _context.Vehicles
                .Where(v => vehicleIds.Contains(v.VehicleId))
                .ToDictionaryAsync(v => v.VehicleId, v => v.HyoungNo, cancellationToken);

            var siteNames = siteIds.Any()
                ? await _context.Sites
                    .Where(s => siteIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken)
                : new Dictionary<int, string>();

            int rowCounter = 0; // Fallback row counter if RowIndex is not set
            foreach (var model in models)
            {
                var currentRowIndex = model.RowIndex ?? rowCounter;
                var key = (model.VehicleId, model.Date.Date, model.IsNightShift);

                if (seen.TryGetValue(key, out var firstOccurrence))
                {
                    // This is a duplicate within the batch
                    var vehicleName = vehicleNames.ContainsKey(model.VehicleId)
                        ? vehicleNames[model.VehicleId]
                        : $"Vehicle ID {model.VehicleId}";

                    var siteName = model.SiteId > 0 && siteNames.ContainsKey(model.SiteId)
                        ? siteNames[model.SiteId]
                        : (firstOccurrence.Model.SiteId > 0 && siteNames.ContainsKey(firstOccurrence.Model.SiteId)
                            ? siteNames[firstOccurrence.Model.SiteId]
                            : "N/A");

                    var shiftText = model.IsNightShift ? "night" : "day";

                    _logger.LogDebug($"Intra-batch duplicate: {vehicleName} (VehicleId={model.VehicleId}), Date={model.Date:yyyy-MM-dd}, Shift={shiftText}, " +
                        $"First occurrence at row {firstOccurrence.RowIndex + 1}, duplicate at row {currentRowIndex + 1}");

                    duplicates.Add(new DuplicateRecordInfo
                    {
                        RowIndex = currentRowIndex,
                        VehicleId = model.VehicleId,
                        VehicleName = vehicleName,
                        SiteName = siteName,
                        Date = model.Date,
                        IsNightShift = model.IsNightShift,
                        Message = $"Duplicate within import file: {vehicleName} on {model.Date:dd/MM/yyyy} ({shiftText} shift) appears at row {firstOccurrence.RowIndex + 1} and row {currentRowIndex + 1}"
                    });
                }
                else
                {
                    seen[key] = (currentRowIndex, model);
                }
                rowCounter++;
            }

            return duplicates;
        }

        private async Task<List<DuplicateRecordInfo>> CheckForExistingDuplicates(List<ConsumptionDTO> models, CancellationToken cancellationToken)
        {
            var duplicates = new List<DuplicateRecordInfo>();

            // Guard against empty list to avoid Min()/Max() exceptions
            if (models == null || !models.Any())
            {
                _logger.LogDebug("No models to check for duplicates - returning empty list");
                return duplicates;
            }

            var dates = models.Select(c => c.Date.Date).Distinct().ToList();
            var vehicleIds = models.Select(c => c.VehicleId).Distinct().ToList();
            var siteIds = models.Where(c => c.SiteId > 0).Select(c => c.SiteId).Distinct().ToList();
            var minDate = dates.Min();
            var maxDate = dates.Max();

            _logger.LogDebug($"Checking for duplicates: Date range {minDate:yyyy-MM-dd} to {maxDate:yyyy-MM-dd}, Vehicles: {string.Join(",", vehicleIds)}");

            // Pre-load vehicles and sites FIRST (before raw SQL) to avoid connection disposal issues
            var vehicles = await _context.Vehicles
                .Where(v => vehicleIds.Contains(v.VehicleId))
                .ToDictionaryAsync(v => v.VehicleId, v => v.HyoungNo, cancellationToken);

            var sites = siteIds.Any()
                ? await _context.Sites
                    .Where(s => siteIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken)
                : new Dictionary<int, string>();

            // Use raw SQL to properly detect NULL IsNightShift values
            // Entity has IsNightShift as ulong (non-nullable) but DB allows NULL
            // MySQL treats NULL and 0 as different values in unique constraints
            var vehicleIdList = string.Join(",", vehicleIds);
            var sql = $@"
                SELECT VehicleId, DATE(Date) as DateOnly, IsNightShift
                FROM vehicleconsumption
                WHERE DATE(Date) >= @minDate
                AND DATE(Date) <= @maxDate
                AND VehicleId IN ({vehicleIdList})";

            var existingRecords = new List<(int VehicleId, DateTime Date, ulong? IsNightShift)>();

            // Don't use 'using' on GetDbConnection() - it's EF Core's shared connection!
            var connection = _context.Database.GetDbConnection();
            try
            {
                if (connection.State != System.Data.ConnectionState.Open)
                {
                    await connection.OpenAsync(cancellationToken);
                }

                using (var command = connection.CreateCommand())
                {
                    command.CommandText = sql;

                    var minDateParam = command.CreateParameter();
                    minDateParam.ParameterName = "@minDate";
                    minDateParam.Value = minDate.Date;
                    command.Parameters.Add(minDateParam);

                    var maxDateParam = command.CreateParameter();
                    maxDateParam.ParameterName = "@maxDate";
                    maxDateParam.Value = maxDate.Date;
                    command.Parameters.Add(maxDateParam);

                    using (var reader = await command.ExecuteReaderAsync(cancellationToken))
                    {
                        while (await reader.ReadAsync(cancellationToken))
                        {
                            var vehicleId = reader.GetInt32(0);
                            var date = reader.GetDateTime(1);
                            ulong? isNightShift = reader.IsDBNull(2) ? null : Convert.ToUInt64(reader.GetValue(2));

                            existingRecords.Add((vehicleId, date, isNightShift));
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error executing raw SQL for duplicate check");
                throw;
            }
            // Note: Do NOT close the connection - EF Core manages it

            _logger.LogDebug($"Found {existingRecords.Count} existing records in database (using raw SQL)");

            // Log each existing record for debugging
            foreach (var existing in existingRecords.Take(10))
            {
                _logger.LogDebug($"  DB Record: VehicleId={existing.VehicleId}, Date={existing.Date:yyyy-MM-dd}, IsNightShift={existing.IsNightShift?.ToString() ?? "NULL"}");
            }

            var existingVehicleDateShiftCombos = existingRecords
                .Select(r => new { r.VehicleId, r.Date, r.IsNightShift })
                .ToList();

            // vehicles and sites are already loaded before the raw SQL query

            if (existingVehicleDateShiftCombos.Any())
            {
                foreach (var model in models)
                {
                    // Handle NULL IsNightShift values properly (NULL is treated as 0/day shift in database)
                    var modelShiftValue = model.IsNightShift ? 1UL : 0UL;

                    // Find exact match including shift - convert nullable to value for comparison
                    var matchingRecord = existingVehicleDateShiftCombos.FirstOrDefault(e =>
                        e.VehicleId == model.VehicleId &&
                        e.Date == model.Date.Date &&
                        (e.IsNightShift.HasValue ? e.IsNightShift.Value : 0UL) == modelShiftValue); // Treat NULL as 0

                    if (matchingRecord != null)
                    {
                        var vehicleName = vehicles.ContainsKey(model.VehicleId)
                            ? vehicles[model.VehicleId]
                            : $"Vehicle ID {model.VehicleId}";

                        var shiftText = model.IsNightShift ? "night" : "day";
                        var dbShiftValue = matchingRecord.IsNightShift.HasValue ? matchingRecord.IsNightShift.Value : 0UL;

                        _logger.LogDebug(
                            $"Duplicate found: Vehicle {vehicleName} (ID:{model.VehicleId}) on {model.Date:yyyy-MM-dd} {shiftText} shift - " +
                            $"Importing shift={modelShiftValue}, DB shift={dbShiftValue}");

                        var siteName = model.SiteId > 0 && sites.ContainsKey(model.SiteId)
                            ? sites[model.SiteId]
                            : "Unknown Site";

                        duplicates.Add(new DuplicateRecordInfo
                        {
                            RowIndex = model.RowIndex ?? -1,
                            VehicleId = model.VehicleId,
                            VehicleName = vehicleName,
                            SiteName = siteName,
                            Date = model.Date,
                            IsNightShift = model.IsNightShift,
                            Message = $"Duplicate record found for {vehicleName} at {siteName} on {model.Date:dd/MM/yyyy} {(model.IsNightShift ? "night" : "day")} shift"
                        });
                    }
                }
            }

            return duplicates;
        }

        private bool IsUniqueConstraintViolation(DbUpdateException ex)
        {
            if (ex.InnerException == null) return false;
            string message = ex.InnerException.Message.ToLower();
            return message.Contains("unique constraint") || message.Contains("unique index") ||
                   message.Contains("duplicate key") || message.Contains("vehicle_date_shift_unique");
        }

        private bool IsForeignKeyViolation(DbUpdateException ex)
        {
            if (ex.InnerException == null) return false;
            string message = ex.InnerException.Message.ToLower();
            return message.Contains("foreign key constraint") || message.Contains("foreign key violation") ||
                   message.Contains("referential integrity") || message.Contains("references constraint");
        }

        private List<DuplicateRecordInfo> ExtractDuplicatesFromException(DbUpdateException ex, List<ConsumptionDTO> models)
        {
            var duplicates = new List<DuplicateRecordInfo>();
            if (ex.InnerException != null && ex.InnerException.Message.Contains("vehicle_date_shift_unique"))
            {
                var vehicleIds = models.Select(c => c.VehicleId).Distinct().ToList();
                var minDate = models.Min(c => c.Date.Date);
                var maxDate = models.Max(c => c.Date.Date);

                var existingRecords = _context.Vehicleconsumptions
                    .Where(v => v.Date.Date >= minDate && v.Date.Date <= maxDate)
                    .AsEnumerable()
                    .Where(v => vehicleIds.Contains(v.VehicleId))
                    .ToList();

                // Pre-load vehicles and sites for better performance
                var siteIds = models.Where(m => m.SiteId > 0).Select(m => m.SiteId).Distinct().ToList();

                var vehiclesDict = _context.Vehicles
                    .Where(v => vehicleIds.Contains(v.VehicleId))
                    .ToDictionary(v => v.VehicleId, v => v.HyoungNo);

                var sitesDict = siteIds.Any()
                    ? _context.Sites.Where(s => siteIds.Contains(s.Id)).ToDictionary(s => s.Id, s => s.Name)
                    : new Dictionary<int, string>();

                for (int i = 0; i < models.Count; i++)
                {
                    var dto = models[i];
                    var exists = existingRecords.Any(v =>
                        v.VehicleId == dto.VehicleId &&
                        v.Date.Date == dto.Date.Date &&
                        v.IsNightShift == (dto.IsNightShift ? 1ul : 0ul));

                    if (exists)
                    {
                        string vehicleName = vehiclesDict.ContainsKey(dto.VehicleId)
                            ? vehiclesDict[dto.VehicleId]
                            : $"ID: {dto.VehicleId}";

                        string siteName = dto.SiteId > 0 && sitesDict.ContainsKey(dto.SiteId)
                            ? sitesDict[dto.SiteId]
                            : "Unknown Site";

                        duplicates.Add(new DuplicateRecordInfo
                        {
                            RowIndex = dto.RowIndex ?? i,
                            VehicleId = dto.VehicleId,
                            VehicleName = vehicleName,
                            SiteName = siteName,
                            Date = dto.Date.Date,
                            IsNightShift = dto.IsNightShift,
                            Message = $"Duplicate: Vehicle {vehicleName} at {siteName} already has data for {dto.Date:yyyy-MM-dd} {(dto.IsNightShift ? "night" : "day")} shift"
                        });
                    }
                }
            }
            return duplicates;
        }
    }
}
