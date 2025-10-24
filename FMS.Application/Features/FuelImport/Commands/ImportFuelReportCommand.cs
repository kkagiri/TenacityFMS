using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Communication.SignalR;
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
        private ImportProgressInfo _progressInfo = new ImportProgressInfo();

        public ImportFuelReportCommandHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<ImportFuelReportCommandHandler> logger,
            IHubContext<FrontEndHub> hubContext)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _hubContext = hubContext;
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

            _progressInfo = new ImportProgressInfo
            {
                ReportId = reportId,
                TotalRecords = request.Models.Count,
                ProcessedRecords = 0,
                SuccessCount = 0,
                FailureCount = 0
            };

            // Send initial progress
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
                return new FMSResponse<ImportFuelReportResult>
                {
                    IsSuccess = false,
                    Message = "Validation failed: " + string.Join("; ", validationErrors),
                    ValidationErrors = validationErrors
                };
            }

            // Check for duplicates
            List<DuplicateRecordInfo> duplicateCheck = new List<DuplicateRecordInfo>();
            bool skipDuplicateCheck = request.SkipDuplicates || request.Models.Any(c => c.OverwriteExisting == true);

            if (!skipDuplicateCheck)
            {
                duplicateCheck = await CheckForExistingDuplicates(request.Models, cancellationToken);
                if (duplicateCheck.Any())
                {
                    _progressInfo.DuplicateCount = duplicateCheck.Count();
                    _progressInfo.Status = "Failed: Duplicate Records";
                    await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo, cancellationToken);

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
            else if (request.SkipDuplicates)
            {
                var duplicateRecords = await CheckForExistingDuplicates(request.Models, cancellationToken);
                if (duplicateRecords.Any())
                {
                    _logger.LogInformation($"Skipping {duplicateRecords.Count()} duplicate records");
                    skippedDuplicates = duplicateRecords.Cast<ImportDuplicateError>().ToList();
                    var indicesToSkip = duplicateRecords.Select(d => d.RowIndex).ToHashSet();
                    request.Models = request.Models.Where(c => !indicesToSkip.Contains(c.RowIndex ?? -1)).ToList();

                    _progressInfo.DuplicateCount = duplicateRecords.Count();
                    _progressInfo.SkippedCount = duplicateRecords.Count();

                    if (!request.Models.Any())
                    {
                        return new FMSResponse<ImportFuelReportResult>
                        {
                            IsSuccess = true,
                            Message = $"All {duplicateRecords.Count()} records were duplicates and skipped.",
                            Data = new ImportFuelReportResult
                            {
                                DuplicateRecords = duplicateRecords.Cast<ImportDuplicateError>().ToList(),
                                TotalRecords = 0,
                                TotalProcessed = 0,
                                SuccessCount = 0,
                                FailureCount = 0,
                                SkippedCount = duplicateRecords.Count(),
                                ReportId = reportId,
                                DuplicateCount = duplicateRecords.Count()
                            }
                        };
                    }

                    _progressInfo.TotalRecords = request.Models.Count;
                    await _hubContext.Clients.All.SendAsync("FuelImportProgress", _progressInfo, cancellationToken);
                }
            }

            _logger.LogInformation("Using GUID ReportId: {ReportId}", reportId);

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

            await _context.Vehicleconsumptions.AddRangeAsync(vehicleConsumptions, cancellationToken);

            try
            {
                await UpdateProgressAsync(processedCount, processedCount, processedWithErrors, "Saving");
                await _context.SaveChangesAsync(cancellationToken);

                // ✅ NEW: Track import history for calendar visualization
                await TrackImportHistory(request.Models, reportId, request.UserId, "Success", cancellationToken);

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

                return successResponse;
            }
            catch (DbUpdateException ex)
            {
                await UpdateProgressAsync(processedCount, 0, processedCount, "Failed: Database Error");
                await TrackImportHistory(request.Models, reportId, request.UserId, "Failed", cancellationToken, ex.Message);

                bool isUniqueConstraint = IsUniqueConstraintViolation(ex);
                bool isForeignKeyViolation = IsForeignKeyViolation(ex);

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

                return errorResponse;
            }
        }

        /// <summary>
        /// NEW: Track import history for calendar visualization
        /// </summary>
        private async Task TrackImportHistory(List<ConsumptionDTO> models, string reportId, string userId, string status, CancellationToken cancellationToken, string notes = null)
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
                    FileName = null, // Can be enhanced to track filename if available
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

            var requestedSiteIds = models.Where(c => c.SiteId > 0 && !c.IsKmPerHr).Select(c => c.SiteId).Distinct().ToList();
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

            var invalidSiteIds = models.Where(c => !c.IsKmPerHr && c.SiteId <= 0).Select((item, index) => new { Index = index, SiteId = item.SiteId }).ToList();
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

        private async Task<List<DuplicateRecordInfo>> CheckForExistingDuplicates(List<ConsumptionDTO> models, CancellationToken cancellationToken)
        {
            var duplicates = new List<DuplicateRecordInfo>();
            var dates = models.Select(c => c.Date.Date).Distinct().ToList();
            var vehicleIds = models.Select(c => c.VehicleId).Distinct().ToList();
            var siteIds = models.Where(c => c.SiteId > 0).Select(c => c.SiteId).Distinct().ToList();
            var minDate = dates.Min();
            var maxDate = dates.Max();

            var existingRecords = await _context.Vehicleconsumptions
                .Where(c => c.Date.Date >= minDate && c.Date.Date <= maxDate)
                .Select(c => new { c.VehicleId, Date = c.Date.Date, IsNightShift = c.IsNightShift })
                .ToListAsync(cancellationToken);

            var existingVehicleDateShiftCombos = existingRecords
                .Where(e => vehicleIds.Contains(e.VehicleId))
                .ToList();

            // Pre-load vehicles and sites to avoid multiple queries
            var vehicles = await _context.Vehicles
                .Where(v => vehicleIds.Contains(v.VehicleId))
                .ToDictionaryAsync(v => v.VehicleId, v => v.HyoungNo, cancellationToken);

            var sites = siteIds.Any()
                ? await _context.Sites
                    .Where(s => siteIds.Contains(s.Id))
                    .ToDictionaryAsync(s => s.Id, s => s.Name, cancellationToken)
                : new Dictionary<int, string>();

            if (existingVehicleDateShiftCombos.Any())
            {
                foreach (var model in models)
                {
                    var isDuplicate = existingVehicleDateShiftCombos.Any(e =>
                        e.VehicleId == model.VehicleId &&
                        e.Date == model.Date.Date &&
                        e.IsNightShift == (model.IsNightShift ? 1UL : 0UL));

                    if (isDuplicate)
                    {
                        var vehicleName = vehicles.ContainsKey(model.VehicleId)
                            ? vehicles[model.VehicleId]
                            : $"Vehicle ID {model.VehicleId}";

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
