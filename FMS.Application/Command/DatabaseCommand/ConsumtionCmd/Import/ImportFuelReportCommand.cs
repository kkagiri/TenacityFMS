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
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.ConsumtionCmd.Import {
    public class ImportFuelReportCommand : IRequest<FMSResponse<ImportFuelReportResult>> {
        public List<ConsumptionDTO> Models { get; set; }
        public bool SkipDuplicates { get; set; } = false;
        public bool OverwriteExisting { get; set; } = false;
    }

    public class ImportFuelReportResult {
        public string ReportId { get; set; }
        public int TotalRecords { get; set; }
        public int TotalProcessed { get; set; }
        public int SuccessCount { get; set; }
        public int FailureCount { get; set; }
        public int SkippedCount { get; set; }
        public int DuplicateCount { get; set; }
        public List<ImportDuplicateError> DuplicateRecords { get; set; } = new List<ImportDuplicateError> ();
    }

    public class ImportDuplicateError {
        public int RowIndex { get; set; }
        public int VehicleId { get; set; }
        public string VehicleName { get; set; }
        public DateTime Date { get; set; }
        public bool IsNightShift { get; set; }
        public string Message { get; set; }
    }

    public class ImportProgressInfo {
        public int TotalRecords { get; set; } = 0;
        public int ProcessedRecords { get; set; } = 0;
        public int SuccessCount { get; set; } = 0;
        public int FailureCount { get; set; } = 0;
        public int SkippedCount { get; set; } = 0;
        public int DuplicateCount { get; set; } = 0;
        public string ReportId { get; set; }
        public string Status { get; set; } = "Processing";
        public double ProgressPercentage { get; set; } = 0;

        public void UpdatePercentage () {
            ProgressPercentage = TotalRecords > 0 ? Math.Round ((double) ProcessedRecords / TotalRecords * 100, 1) : 0;
        }
    }

    public class DuplicateRecordInfo : ImportDuplicateError {
        // These properties are already inherited from ImportDuplicateError
        // No need to redeclare them
    }

    public class ImportFuelReportCommandHandler : IRequestHandler<ImportFuelReportCommand, FMSResponse<ImportFuelReportResult>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<ImportFuelReportCommandHandler> _logger;
        private readonly IHubContext<FrontEndHub> _hubContext;
        private ImportProgressInfo _progressInfo = new ImportProgressInfo ();

        public ImportFuelReportCommandHandler (
            GpsdataContext context,
            IMapper mapper,
            ILogger<ImportFuelReportCommandHandler> logger,
            IHubContext<FrontEndHub> hubContext) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
            _hubContext = hubContext;
        }

        private async Task UpdateProgressAsync (int processedRecords, int? successCount = null, int? failureCount = null, string status = null) {
            _progressInfo.ProcessedRecords = processedRecords;

            if (successCount.HasValue)
                _progressInfo.SuccessCount = successCount.Value;

            if (failureCount.HasValue)
                _progressInfo.FailureCount = failureCount.Value;

            if (status != null)
                _progressInfo.Status = status;

            // Send progress update via SignalR
            await _hubContext.Clients.All.SendAsync ("FuelImportProgress", _progressInfo);

            _logger.LogInformation ("Import progress: {ProcessedRecords}/{TotalRecords} records ({Percentage}%)",
                _progressInfo.ProcessedRecords,
                _progressInfo.TotalRecords,
                _progressInfo.ProgressPercentage);
        }

        public async Task<FMSResponse<ImportFuelReportResult>> Handle (ImportFuelReportCommand request, CancellationToken cancellationToken) {
            var reportId = Guid.NewGuid ().ToString ("N");
            var vehicleConsumptions = new List<Vehicleconsumption> ();
            var resultConsumptions = new List<ConsumptionDTO> ();
            List<ImportDuplicateError> skippedDuplicates = new List<ImportDuplicateError> (); // Track skipped duplicates

            _progressInfo = new ImportProgressInfo {
                ReportId = reportId,
                TotalRecords = request.Models.Count,
                ProcessedRecords = 0,
                SuccessCount = 0,
                FailureCount = 0
            };

            // Send initial progress
            await _hubContext.Clients.All.SendAsync ("FuelImportProgress", _progressInfo, cancellationToken);

            _logger.LogInformation ("Starting import of {Count} fuel consumption records", request.Models.Count);

            // Handle potential DriverName property if present in dynamic objects
            foreach (var model in request.Models) {
                // Check if the model has a DriverName property that needs to be mapped to EmployeeName
                var modelType = model.GetType ();
                var driverNameProperty = modelType.GetProperty ("DriverName");
                if (driverNameProperty != null) {
                    var driverName = driverNameProperty.GetValue (model) as string;
                    if (!string.IsNullOrEmpty (driverName) && string.IsNullOrEmpty (model.EmployeeName)) {
                        model.EmployeeName = driverName;
                        _logger.LogInformation ("Mapped DriverName '{0}' to EmployeeName for vehicle {1}",
                            driverName, model.VehicleId);
                    }
                }
            }

            // Propagate OverwriteExisting flag from command to each consumption if not already set
            if (request.OverwriteExisting) {
                foreach (var consumption in request.Models) {
                    consumption.OverwriteExisting = true;
                }
            }

            // Basic validation check
            var validationErrors = new List<string> ();

            // Filter out records with invalid vehicle IDs (0 or negative)
            var requestedVehicleIds = request.Models
                .Where (c => c.VehicleId > 0) // Only include positive IDs in the validation check
                .Select (c => c.VehicleId)
                .Distinct ()
                .ToList ();

            if (requestedVehicleIds.Any ()) {
                // Cursor
                // Fetch all vehicle IDs from the database then filter in memory
                var allDbVehicleIds = await _context.Vehicles
                    .Select (v => v.VehicleId)
                    .ToListAsync (cancellationToken);

                var existingVehicleIds = allDbVehicleIds
                    .Where (id => requestedVehicleIds.Contains (id))
                    .ToList ();
                //End Cursor

                var missingVehicleIds = requestedVehicleIds.Except (existingVehicleIds).ToList ();

                if (missingVehicleIds.Any ()) {
                    validationErrors.Add ($"The following vehicle IDs do not exist: {string.Join(", ", missingVehicleIds)}");
                }
            }

            // Check for records with invalid vehicle IDs that need to be fixed
            var invalidVehicleIds = request.Models
                .Where (c => c.VehicleId <= 0)
                .Select ((item, index) => new { Index = index, VehicleId = item.VehicleId })
                .ToList ();

            if (invalidVehicleIds.Any ()) {
                validationErrors.Add ($"The following records have invalid vehicle IDs: {string.Join(", ", invalidVehicleIds.Select(x => $"Row {x.Index + 1} (ID: {x.VehicleId})"))}");
            }

            // Filter out records with invalid site IDs (0 or negative) - only for non-KmPerHr records
            var requestedSiteIds = request.Models
                .Where (c => c.SiteId > 0 && !c.IsKmPerHr) // Only include positive IDs for L/Hr records
                .Select (c => c.SiteId)
                .Distinct ()
                .ToList ();

            if (requestedSiteIds.Any ()) {
                // Cursor
                // Fetch all site IDs from the database then filter in memory
                var allDbSiteIds = await _context.Sites
                    .Select (s => s.Id)
                    .ToListAsync (cancellationToken);

                var existingSiteIds = allDbSiteIds
                    .Where (id => requestedSiteIds.Contains (id))
                    .ToList ();
                // End Cursor

                var missingSiteIds = requestedSiteIds.Except (existingSiteIds).ToList ();

                if (missingSiteIds.Any ()) {
                    validationErrors.Add ($"The following site IDs do not exist: {string.Join(", ", missingSiteIds)}");
                }
            }

            // Check for L/Hr records with invalid site IDs that need to be fixed
            var invalidSiteIds = request.Models
                .Where (c => !c.IsKmPerHr && c.SiteId <= 0)
                .Select ((item, index) => new { Index = index, SiteId = item.SiteId })
                .ToList ();

            if (invalidSiteIds.Any ()) {
                validationErrors.Add ($"The following records require valid site IDs (for L/Hr record type): {string.Join(", ", invalidSiteIds.Select(x => $"Row {x.Index + 1} (ID: {x.SiteId})"))}");
            }

            if (validationErrors.Any ()) {
                return new FMSResponse<ImportFuelReportResult> {
                    IsSuccess = false,
                    Message = "Validation failed: " + string.Join ("; ", validationErrors),
                    ValidationErrors = validationErrors
                };
            }

            // Check for duplicates
            List<DuplicateRecordInfo> duplicateCheck = new List<DuplicateRecordInfo> ();
            bool skipDuplicateCheck = request.SkipDuplicates || request.Models.Any (c => c.OverwriteExisting == true);

            if (!skipDuplicateCheck) {
                duplicateCheck = await CheckForExistingDuplicates (request.Models, cancellationToken);
                if (duplicateCheck.Any ()) {
                    // Update progress info to show duplicates
                    _progressInfo.DuplicateCount = duplicateCheck.Count ();
                    _progressInfo.Status = "Failed: Duplicate Records";
                    await _hubContext.Clients.All.SendAsync ("FuelImportProgress", _progressInfo, cancellationToken);

                    // Create response with duplicate info
                    return new FMSResponse<ImportFuelReportResult> {
                        IsSuccess = false,
                        Message = "Duplicate entry detected – one or more Vehicle / Date / Shift combinations already exist.",
                        Data = new ImportFuelReportResult {
                            DuplicateRecords = duplicateCheck.Cast<ImportDuplicateError> ().ToList (),
                            TotalRecords = 0,
                            TotalProcessed = 0,
                            SuccessCount = 0,
                            FailureCount = 0,
                            SkippedCount = duplicateCheck.Count (),
                            ReportId = reportId,
                            DuplicateCount = duplicateCheck.Count ()
                            }
                    };
                }
            }

            // If we're overwriting existing records, we need to handle them differently
            // Cursor: Modified logic for overwriting existing records
            var modelsToOverwrite = request.Models.Where (m => m.OverwriteExisting == true).ToList ();

            if (modelsToOverwrite.Any ()) {
                var overwriteKeyDetails = modelsToOverwrite
                    .Select (c => new {
                        c.VehicleId,
                            Date = c.Date.Date, // Use Date part for comparison
                            c.IsNightShift
                    })
                    .Distinct ()
                    .ToList ();

                if (overwriteKeyDetails.Any ()) {
                    var vehicleIdsInKeys = overwriteKeyDetails.Select (k => k.VehicleId).Distinct ().ToList ();
                    var minDateInKeys = overwriteKeyDetails.Min (k => k.Date);
                    var maxDateInKeys = overwriteKeyDetails.Max (k => k.Date);

                    // Fetch candidate records from DB based ONLY on Date range
                    var candidateDbRecordsByDate = await _context.Vehicleconsumptions
                        .Where (vc => vc.Date.Date >= minDateInKeys && vc.Date.Date <= maxDateInKeys)
                        .ToListAsync (cancellationToken);

                    // Client-side filter: first by VehicleId
                    var candidateDbRecordsByDateAndVehicle = candidateDbRecordsByDate
                        .Where (vc => vehicleIdsInKeys.Contains (vc.VehicleId)) // In-memory .Contains
                        .ToList ();

                    // Client-side filter: for exact key match
                    var recordsToDelete = new List<Vehicleconsumption> ();
                    var keysHashSet = new HashSet < (int VehicleId, DateTime Date, bool IsNightShift) > (
                        overwriteKeyDetails.Select (k => (k.VehicleId, k.Date, k.IsNightShift))
                    );

                    foreach (var dbRecord in candidateDbRecordsByDateAndVehicle) {
                        if (keysHashSet.Contains ((dbRecord.VehicleId, dbRecord.Date.Date, dbRecord.IsNightShift == 1UL))) {
                            recordsToDelete.Add (dbRecord);
                        }
                    }

                    var distinctRecordsToDelete = recordsToDelete.Distinct ().ToList (); // Ensure distinct before removing
                    if (distinctRecordsToDelete.Any ()) {
                        _logger.LogInformation ($"Removing {distinctRecordsToDelete.Count()} existing records for overwrite");
                        _context.Vehicleconsumptions.RemoveRange (distinctRecordsToDelete);
                        await _context.SaveChangesAsync (cancellationToken);
                    }
                }
            } else if (request.SkipDuplicates) { // End Cursor
                // If we're skipping duplicates, we need to filter out any records that already exist
                var duplicateRecords = await CheckForExistingDuplicates (request.Models, cancellationToken);

                if (duplicateRecords.Any ()) {
                    _logger.LogInformation ($"Skipping {duplicateRecords.Count()} duplicate records");

                    // Store these duplicate records to return in the response
                    skippedDuplicates = duplicateRecords.Cast<ImportDuplicateError> ().ToList ();

                    // Get the row indices to skip
                    var indicesToSkip = duplicateRecords.Select (d => d.RowIndex).ToHashSet ();

                    // Update progress info
                    _progressInfo.DuplicateCount = duplicateRecords.Count ();
                    _progressInfo.SkippedCount = duplicateRecords.Count ();

                    // Filter out the duplicates
                    request.Models = request.Models.Where (c => !indicesToSkip.Contains (c.RowIndex ?? -1)).ToList ();

                    // If no records left, return success with info
                    if (!request.Models.Any ()) {
                        return new FMSResponse<ImportFuelReportResult> {
                            IsSuccess = true,
                            Message = $"All {duplicateRecords.Count()} records were duplicates and skipped. Nothing to import.",
                            Data = new ImportFuelReportResult {
                            DuplicateRecords = duplicateRecords.Cast<ImportDuplicateError> ().ToList (),
                            TotalRecords = 0,
                            TotalProcessed = 0,
                            SuccessCount = 0,
                            FailureCount = 0,
                            SkippedCount = duplicateRecords.Count (),
                            ReportId = reportId,
                            DuplicateCount = duplicateRecords.Count ()
                            }
                        };
                    }

                    // Update the progress info total to reflect the filtered list
                    _progressInfo.TotalRecords = request.Models.Count;
                    await _hubContext.Clients.All.SendAsync ("FuelImportProgress", _progressInfo, cancellationToken);
                }
            }

            _logger.LogInformation ("Using GUID ReportId: {ReportId}", reportId);

            // Process in batches to avoid memory issues with large imports
            const int batchSize = 100;
            int processedCount = 0;
            int processedWithErrors = 0;

            for (int i = 0; i < request.Models.Count; i += batchSize) {
                // Get the current batch
                var batch = request.Models.Skip (i).Take (Math.Min (batchSize, request.Models.Count - i)).ToList ();

                foreach (var consumptionDto in batch) {
                    try {
                        // Map to entity
                        var entity = _mapper.Map<Vehicleconsumption> (consumptionDto);
                        entity.IsModified = 0;

                        // Assign the report ID to all records in this batch
                        entity.ReportId = reportId;

                        vehicleConsumptions.Add (entity);
                        processedCount++;
                    } catch (Exception ex) {
                        _logger.LogError (ex, "Error mapping consumption record at index {Index}", i);
                        processedWithErrors++;
                    }
                }

                // Update progress after each batch
                await UpdateProgressAsync (processedCount, processedCount, processedWithErrors);
            }

            await _context.Vehicleconsumptions.AddRangeAsync (vehicleConsumptions, cancellationToken);

            try {
                // Update progress - saving to database
                await UpdateProgressAsync (processedCount, processedCount, processedWithErrors, "Saving");

                await _context.SaveChangesAsync (cancellationToken);

                foreach (var savedEntity in vehicleConsumptions) {
                    var resultDto = _mapper.Map<ConsumptionDTO> (savedEntity);
                    resultConsumptions.Add (resultDto);
                }

                // Final progress update - completed successfully
                await UpdateProgressAsync (processedCount, processedCount, processedWithErrors, "Completed");

                var successResponse = new FMSResponse<ImportFuelReportResult> ();
                successResponse.IsSuccess = true;

                // If we had skipped duplicates, include this in the success message and duplicateRecords
                if (skippedDuplicates.Any ()) {
                    successResponse.Message = $"Successfully imported {resultConsumptions.Count} consumption records. {skippedDuplicates.Count} duplicate records were skipped.";
                    successResponse.Data = new ImportFuelReportResult {
                        ReportId = reportId,
                        TotalRecords = request.Models.Count + skippedDuplicates.Count,
                        TotalProcessed = processedCount,
                        SuccessCount = processedCount,
                        FailureCount = processedWithErrors,
                        SkippedCount = skippedDuplicates.Count,
                        DuplicateCount = skippedDuplicates.Count,
                        DuplicateRecords = skippedDuplicates // Include the duplicate records in the success response
                    };
                } else {
                    successResponse.Message = $"Successfully imported {resultConsumptions.Count} consumption records.";
                    successResponse.Data = new ImportFuelReportResult {
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
            } catch (DbUpdateException ex) {
                // Update progress - failed during database save
                await UpdateProgressAsync (processedCount, 0, processedCount, "Failed: Database Error");

                bool isUniqueConstraint = IsUniqueConstraintViolation (ex);
                bool isForeignKeyViolation = IsForeignKeyViolation (ex);

                var errorResponse = new FMSResponse<ImportFuelReportResult> ();
                errorResponse.IsSuccess = false;

                if (isUniqueConstraint) {
                    // Try to extract duplicate information from the exception or fallback DB scan
                    var duplicates = ExtractDuplicatesFromException (ex, request.Models);

                    // Update progress to show duplicates
                    await UpdateProgressAsync (processedCount, processedCount - duplicates.Count, duplicates.Count, "Failed: Duplicate Records");

                    errorResponse.Message = "Duplicate entry detected – one or more Vehicle / Date / Shift combinations already exist.";
                    errorResponse.Data = new ImportFuelReportResult {
                        DuplicateRecords = duplicates.Cast<ImportDuplicateError> ().ToList (),
                        TotalRecords = 0,
                        TotalProcessed = 0,
                        SuccessCount = 0,
                        FailureCount = 0,
                        SkippedCount = duplicates.Count (),
                        ReportId = reportId,
                        DuplicateCount = duplicates.Count ()
                    };
                } else if (isForeignKeyViolation) {
                    errorResponse.Message = "Foreign key constraint failed – one or more referenced Vehicles or Sites do not exist.";
                    errorResponse.Data = new ImportFuelReportResult ();
                } else {
                    // Generic DB failure – surface a simple message to client, log detailed info server-side
                    errorResponse.Message = "Database error occurred while saving the fuel report. Please check your data or contact support.";
                    errorResponse.Data = new ImportFuelReportResult (); // Empty payload
                }

                return errorResponse;
            }
        }

        // Method to find duplicate records
        private async Task<List<DuplicateRecordInfo>> CheckForExistingDuplicates (List<ConsumptionDTO> models, CancellationToken cancellationToken) {
            var duplicates = new List<DuplicateRecordInfo> ();

            // Get all relevant dates and vehicle IDs to reduce the query scope
            var dates = models.Select (c => c.Date.Date).Distinct ().ToList ();
            var vehicleIds = models.Select (c => c.VehicleId).Distinct ().ToList ();

            // To resolve the LINQ translation error, we need to modify our approach:
            // 1. First get all existing records within our date range
            // 2. Then compare locally rather than sending collections to SQL

            // Start with a broad date range query which can be translated
            var minDate = dates.Min ();
            var maxDate = dates.Max ();

            // Get existing records (this query can be translated to SQL)
            var existingRecords = await _context.Vehicleconsumptions
                .Where (c => c.Date.Date >= minDate && c.Date.Date <= maxDate)
                .Select (c => new { c.VehicleId, Date = c.Date.Date, IsNightShift = c.IsNightShift })
                .ToListAsync (cancellationToken);

            // Now filter in memory to find matching records
            var existingVehicleDateShiftCombos = existingRecords
                .Where (e => vehicleIds.Contains (e.VehicleId))
                .ToList ();

            if (existingVehicleDateShiftCombos.Any ()) {
                // Check each model to see if it already exists
                foreach (var model in models) {
                    var isDuplicate = existingVehicleDateShiftCombos.Any (e =>
                        e.VehicleId == model.VehicleId &&
                        e.Date == model.Date.Date &&
                        e.IsNightShift == (model.IsNightShift ? 1UL : 0UL));

                    if (isDuplicate) {
                        // Fetch vehicle details (one query per unique vehicle)
                        var vehicle = await _context.Vehicles
                            .FirstOrDefaultAsync (v => v.VehicleId == model.VehicleId, cancellationToken);

                        var vehicleName = vehicle?.HyoungNo ?? $"Vehicle ID {model.VehicleId}";

                        duplicates.Add (new DuplicateRecordInfo {
                            RowIndex = model.RowIndex ?? -1,
                                VehicleId = model.VehicleId,
                                VehicleName = vehicleName,
                                Date = model.Date,
                                IsNightShift = model.IsNightShift,
                                Message = $"Duplicate record found for {vehicleName} on {model.Date.ToShortDateString ()} {(model.IsNightShift ? "night shift" : "day shift")}"
                        });
                    }
                }
            }

            return duplicates;
        }

        private bool IsUniqueConstraintViolation (DbUpdateException ex) {
            // Check for unique constraint violation in the exception message
            if (ex.InnerException == null) return false;

            string message = ex.InnerException.Message.ToLower ();

            // Common SQL error messages for unique constraint violations across different DB providers
            return message.Contains ("unique constraint") ||
                message.Contains ("unique index") ||
                message.Contains ("duplicate key") ||
                message.Contains ("vehicle_date_shift_unique") ||
                message.Contains ("violation of unique key constraint") ||
                message.Contains ("cannot insert duplicate key");
        }

        private bool IsForeignKeyViolation (DbUpdateException ex) {
            // Check for foreign key constraint violation in the exception message
            if (ex.InnerException == null) return false;

            string message = ex.InnerException.Message.ToLower ();

            // Common SQL error messages for foreign key violations across different DB providers
            return message.Contains ("foreign key constraint") ||
                message.Contains ("foreign key violation") ||
                message.Contains ("referential integrity") ||
                message.Contains ("references constraint") ||
                message.Contains ("constraint fk_");
        }

        private List<DuplicateRecordInfo> ExtractDuplicatesFromException (DbUpdateException ex, List<ConsumptionDTO> models) {
            var duplicates = new List<DuplicateRecordInfo> ();

            // This is a simplistic approach - in a real implementation, you might need to parse
            // the error message more carefully or use a more sophisticated approach
            if (ex.InnerException != null && ex.InnerException.Message.Contains ("vehicle_date_shift_unique")) {
                // As a fallback, we'll check for duplicates in memory to avoid LINQ translation issues
                // First, get all relevant record IDs
                var vehicleIds = models.Select (c => c.VehicleId).Distinct ().ToList ();
                var minDate = models.Min (c => c.Date.Date);
                var maxDate = models.Max (c => c.Date.Date);

                // Get all existing records in the date range
                var existingRecords = _context.Vehicleconsumptions
                    .Where (v => v.Date.Date >= minDate && v.Date.Date <= maxDate)
                    .AsEnumerable () // Force client-side evaluation
                    .Where (v => vehicleIds.Contains (v.VehicleId))
                    .ToList ();

                // Check each model for duplicates
                for (int i = 0; i < models.Count; i++) {
                    var dto = models[i];
                    var exists = existingRecords.Any (
                        v => v.VehicleId == dto.VehicleId &&
                        v.Date.Date == dto.Date.Date &&
                        v.IsNightShift == (dto.IsNightShift ? 1ul : 0ul));

                    if (exists) {
                        // Get vehicle info from context to get the vehicle name
                        var vehicle = _context.Vehicles
                            .FirstOrDefault (v => v.VehicleId == dto.VehicleId);

                        string vehicleName = vehicle?.HyoungNo ?? $"ID: {dto.VehicleId}";

                        duplicates.Add (new DuplicateRecordInfo {
                            RowIndex = i,
                                VehicleId = dto.VehicleId,
                                VehicleName = vehicleName,
                                Date = dto.Date.Date,
                                IsNightShift = dto.IsNightShift,
                                Message = $"Duplicate: Vehicle {vehicleName} already has data for {dto.Date.ToString("yyyy-MM-dd")} {(dto.IsNightShift ? "night shift" : "day shift")}"
                        });
                    }
                }
            }

            return duplicates;
        }
    }
}