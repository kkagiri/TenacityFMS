using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TankManagement.BulkImport.DTOs;
using FMS.Application.Features.TankManagement.BulkImport.Services;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.BulkImport.Commands
{
    /// <summary>
    /// Handler for bulk import tank stock command
    /// </summary>
    public class BulkImportTankStockCommandHandler
        : IRequestHandler<BulkImportTankStockCommand, FMSResponse<BulkImportResponseDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<BulkImportTankStockCommandHandler> _logger;
        private readonly BulkImportValidationService _validationService;

        public BulkImportTankStockCommandHandler(
            GpsdataContext context,
            ILogger<BulkImportTankStockCommandHandler> logger,
            BulkImportValidationService validationService)
        {
            _context = context;
            _logger = logger;
            _validationService = validationService;
        }

        public async Task<FMSResponse<BulkImportResponseDTO>> Handle(
            BulkImportTankStockCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                _logger.LogInformation("Starting bulk import with {Count} rows. ValidateOnly: {ValidateOnly}, SkipValidation: {SkipValidation}",
                    request.Entries.Count, request.ValidateOnly, request.SkipValidation);

                var response = new BulkImportResponseDTO
                {
                    TotalRows = request.Entries.Count
                };

                // Declare shared variables at the top level
                List<string> tankNames;
                Dictionary<string, Tank> tanks;
                List<DuplicateEntryInfo> duplicates;

                // If SkipValidation is enabled (from system config), only do basic checks
                if (request.SkipValidation)
                {
                    _logger.LogInformation("Validation disabled by system configuration. Performing basic checks only.");

                    // Only check that tanks exist and fields are not empty
                    var basicCheck = await ValidateBasicFieldsOnly(request.Entries, cancellationToken);
                    if (!basicCheck.IsValid)
                    {
                        response.ValidationResult = basicCheck;
                        response.Message = "Basic field validation failed. Please fix critical errors.";
                        return FMSResponse<BulkImportResponseDTO>.Failed(response.Message);
                    }

                    // Load tanks
                    tankNames = request.Entries.Select(e => e.TankName).Distinct().ToList();
                    tanks = await _context.Tanks
                        .Where(t => tankNames.Contains(t.Name))
                        .ToDictionaryAsync(t => t.Name.ToLower(), t => t, cancellationToken);

                    // Check for duplicates
                    duplicates = await CheckForDuplicates(request.Entries, tanks, cancellationToken);
                    response.Duplicates = duplicates;

                    // Skip validation-only mode when validation is disabled
                    if (request.ValidateOnly)
                    {
                        response.Message = "Validation disabled by configuration. Data appears valid for import.";
                        response.ValidationResult = basicCheck;
                        return FMSResponse<BulkImportResponseDTO>.Success(response, response.Message);
                    }

                    // Perform import directly
                    var skipValidationImport = await PerformImport(request, tanks, duplicates, cancellationToken);
                    response.ImportedRows = skipValidationImport.ImportedCount;
                    response.SkippedRows = skipValidationImport.SkippedCount;
                    response.Message = $"Successfully imported {skipValidationImport.ImportedCount} rows. Skipped {skipValidationImport.SkippedCount} rows.";

                    _logger.LogInformation("Bulk import completed (validation skipped): Imported {Imported}, Skipped {Skipped}",
                        skipValidationImport.ImportedCount, skipValidationImport.SkippedCount);

                    return FMSResponse<BulkImportResponseDTO>.Success(response, response.Message);
                }

                // Standard validation flow (when validation is enabled)
                var basicValidation = await ValidateBasicRules(request.Entries, cancellationToken);
                if (!basicValidation.IsValid)
                {
                    response.ValidationResult = basicValidation;
                    response.Message = "Basic validation failed. Please fix errors before importing.";
                    return FMSResponse<BulkImportResponseDTO>.Failed(response.Message);
                }

                // Step 2: Load tanks for validation
                tankNames = request.Entries.Select(e => e.TankName).Distinct().ToList();
                tanks = await _context.Tanks
                    .Where(t => tankNames.Contains(t.Name))
                    .ToDictionaryAsync(t => t.Name.ToLower(), t => t, cancellationToken);

                // Validate that all tanks exist
                var missingTanks = tankNames.Where(tn => !tanks.ContainsKey(tn.ToLower())).ToList();
                if (missingTanks.Any())
                {
                    foreach (var tankName in missingTanks)
                    {
                        var row = request.Entries.First(e => e.TankName == tankName);
                        basicValidation.AddAnomaly(new ValidationAnomaly
                        {
                            Type = AnomalyType.TankNotFound,
                            Severity = AnomalySeverity.Critical,
                            TankName = tankName,
                            Date = row.Date,
                            RowNumber = row.RowNumber,
                            Message = $"Tank '{tankName}' not found in database",
                            Details = "Please verify tank name matches existing tank records"
                        });
                    }
                    response.ValidationResult = basicValidation;
                    response.Message = $"Tank validation failed: {missingTanks.Count} tank(s) not found.";
                    return FMSResponse<BulkImportResponseDTO>.Failed(response.Message);
                }

                // Step 3: Check for duplicates
                duplicates = await CheckForDuplicates(request.Entries, tanks, cancellationToken);
                response.Duplicates = duplicates;

                // Step 4: Advanced validation (all 11 anomaly types)
                var validationResult = await _validationService.ValidateImportAsync(
                    request.Entries, tanks, cancellationToken);

                response.ValidationResult = validationResult;
                response.WarningRows = validationResult.MediumCount + validationResult.LowCount;

                // If validation-only mode, return results without importing
                if (request.ValidateOnly)
                {
                    response.Message = validationResult.Summary;
                    return FMSResponse<BulkImportResponseDTO>.Success(response,
                        "Validation completed. Review results before importing.");
                }

                // Step 5: Check if we should proceed with import
                if (validationResult.HasBlockingAnomalies)
                {
                    response.Message = "Import blocked due to critical errors. Fix errors and try again.";
                    return FMSResponse<BulkImportResponseDTO>.Failed(response.Message);
                }

                if (validationResult.HasWarnings && !request.IgnoreWarnings)
                {
                    response.Message = "Import has warnings. Review or set IgnoreWarnings=true to proceed.";
                    return FMSResponse<BulkImportResponseDTO>.Failed(response.Message);
                }

                // Step 6: Perform the import
                var importResult = await PerformImport(request, tanks, duplicates, cancellationToken);

                response.ImportedRows = importResult.ImportedCount;
                response.SkippedRows = importResult.SkippedCount;
                response.Message = $"Successfully imported {importResult.ImportedCount} rows. " +
                                 $"Skipped {importResult.SkippedCount} rows.";

                _logger.LogInformation("Bulk import completed: Imported {Imported}, Skipped {Skipped}",
                    importResult.ImportedCount, importResult.SkippedCount);

                return FMSResponse<BulkImportResponseDTO>.Success(response, response.Message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error during bulk import");
                return FMSResponse<BulkImportResponseDTO>.SystemError($"Import failed: {ex.Message}");
            }
        }

        /// <summary>
        /// Validate only critical fields when validation is disabled
        /// </summary>
        private async Task<BulkImportValidationResult> ValidateBasicFieldsOnly(
            List<BulkImportRowDTO> entries, CancellationToken cancellationToken)
        {
            var result = new BulkImportValidationResult { TotalRows = entries.Count };
            var rowsWithErrors = new HashSet<int>();

            // Load all tanks for validation
            var tankNames = entries.Select(e => e.TankName).Distinct().ToList();
            var tanks = await _context.Tanks
                .Where(t => tankNames.Contains(t.Name))
                .Select(t => t.Name.ToLower())
                .ToListAsync(cancellationToken);

            foreach (var entry in entries)
            {
                // Required: Tank name
                if (string.IsNullOrWhiteSpace(entry.TankName))
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.MissingRequiredField,
                        Severity = AnomalySeverity.Critical,
                        TankName = "Unknown",
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Message = "Tank name is required"
                    });
                    rowsWithErrors.Add(entry.RowNumber);
                    continue;
                }

                // Required: Tank must exist
                if (!tanks.Contains(entry.TankName.ToLower()))
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.TankNotFound,
                        Severity = AnomalySeverity.Critical,
                        TankName = entry.TankName,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Message = $"Tank '{entry.TankName}' not found in database"
                    });
                    rowsWithErrors.Add(entry.RowNumber);
                }

                // Required: Valid date
                if (entry.Date == default)
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.InvalidDate,
                        Severity = AnomalySeverity.Critical,
                        TankName = entry.TankName,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Message = "Valid date is required"
                    });
                    rowsWithErrors.Add(entry.RowNumber);
                }
            }

            result.RowsWithErrors = rowsWithErrors.Count;
            return result;
        }

        /// <summary>
        /// Validate basic rules like required fields, positive numbers, valid dates
        /// </summary>
        private async Task<BulkImportValidationResult> ValidateBasicRules(
            List<BulkImportRowDTO> entries, CancellationToken cancellationToken)
        {
            var result = new BulkImportValidationResult { TotalRows = entries.Count };
            var rowsWithErrors = new HashSet<int>();

            foreach (var entry in entries)
            {
                // Required field validation
                if (string.IsNullOrWhiteSpace(entry.TankName))
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.MissingRequiredField,
                        Severity = AnomalySeverity.Critical,
                        TankName = entry.TankName ?? "Unknown",
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Message = "Tank name is required"
                    });
                    rowsWithErrors.Add(entry.RowNumber);
                }

                // Date validation
                if (entry.Date == default || entry.Date > DateTime.Now.AddDays(1))
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.InvalidDate,
                        Severity = AnomalySeverity.High,
                        TankName = entry.TankName,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Message = $"Invalid date: {entry.Date:yyyy-MM-dd}",
                        Details = "Date cannot be in the future"
                    });
                    rowsWithErrors.Add(entry.RowNumber);
                }

                // Negative values validation
                if (entry.Opening.HasValue && entry.Opening.Value < 0)
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.NegativeStock,
                        Severity = AnomalySeverity.Medium,
                        TankName = entry.TankName,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Message = $"Opening stock is negative: {entry.Opening.Value}L",
                        Details = "Negative stock allowed but flagged for review"
                    });
                    // rowsWithErrors.Add(entry.RowNumber); // Don't block on warnings
                }

                if (entry.Closing.HasValue && entry.Closing.Value < 0)
                {
                    result.AddAnomaly(new ValidationAnomaly
                    {
                        Type = AnomalyType.NegativeStock,
                        Severity = AnomalySeverity.Medium,
                        TankName = entry.TankName,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Message = $"Closing stock is negative: {entry.Closing.Value}L",
                        Details = "Negative stock allowed but flagged for review"
                    });
                    // rowsWithErrors.Add(entry.RowNumber); // Don't block on warnings
                }
            }

            result.RowsWithErrors = rowsWithErrors.Count;
            return result;
        }

        /// <summary>
        /// Check for duplicate entries (same tank, same date, same entry type)
        /// </summary>
        private async Task<List<DuplicateEntryInfo>> CheckForDuplicates(
            List<BulkImportRowDTO> entries,
            Dictionary<string, Tank> tanks,
            CancellationToken cancellationToken)
        {
            var duplicates = new List<DuplicateEntryInfo>();
            var processedEntries = new HashSet<string>();

            foreach (var entry in entries)
            {
                if (!tanks.TryGetValue(entry.TankName.ToLower(), out var tank))
                    continue;

                var key = $"{tank.Id}_{entry.Date:yyyy-MM-dd}";

                // Check if we've already seen this combination in the import file
                if (processedEntries.Contains(key))
                {
                    duplicates.Add(new DuplicateEntryInfo
                    {
                        TankName = entry.TankName,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        Action = "Duplicate in file"
                    });
                    continue;
                }

                // Check if entry already exists in database
                var existingEntry = await _context.Tankstocks
                    .Where(ts => ts.TankId == tank.Id && ts.EntryDate.Date == entry.Date.Date)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingEntry != null)
                {
                    duplicates.Add(new DuplicateEntryInfo
                    {
                        TankName = entry.TankName,
                        Date = entry.Date,
                        RowNumber = entry.RowNumber,
                        ExistingStockId = existingEntry.EntryId,
                        Action = "Exists in database"
                    });
                }

                processedEntries.Add(key);
            }

            return duplicates;
        }

        /// <summary>
        /// Perform the actual import of data
        /// </summary>
        private async Task<(int ImportedCount, int SkippedCount)> PerformImport(
            BulkImportTankStockCommand request,
            Dictionary<string, Tank> tanks,
            List<DuplicateEntryInfo> duplicates,
            CancellationToken cancellationToken)
        {
            int importedCount = 0;
            int skippedCount = 0;

            // Generate unique batch ID for this import
            var importBatchId = Guid.NewGuid().ToString();
            var importedAt = DateTime.UtcNow;

            _logger.LogInformation("Starting import batch {ImportBatchId} with {EntryCount} entries",
                importBatchId, request.Entries.Count);

            var duplicateKeys = duplicates
                .Where(d => d.ExistingStockId > 0)
                .Select(d => $"{d.TankName.ToLower()}_{d.Date:yyyy-MM-dd}")
                .ToHashSet();

            foreach (var entry in request.Entries)
            {
                if (!tanks.TryGetValue(entry.TankName.ToLower(), out var tank))
                {
                    skippedCount++;
                    continue;
                }

                var key = $"{entry.TankName.ToLower()}_{entry.Date:yyyy-MM-dd}";

                // Handle duplicates based on policy
                if (duplicateKeys.Contains(key))
                {
                    if (request.DuplicateHandling == DuplicateHandlingMode.Skip)
                    {
                        skippedCount++;
                        continue;
                    }
                    else // Replace
                    {
                        var existing = await _context.Tankstocks
                            .FirstOrDefaultAsync(ts => ts.TankId == tank.Id &&
                                                     ts.EntryDate.Date == entry.Date.Date,
                                               cancellationToken);
                        if (existing != null)
                        {
                            _context.Tankstocks.Remove(existing);
                        }
                    }
                }

                // Create tankstock entries based on data
                await CreateTankstockEntries(entry, tank, request.UserId,
                    importBatchId, importedAt, cancellationToken);
                importedCount++;
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Import batch {ImportBatchId} completed: Imported {ImportedCount}, Skipped {SkippedCount}",
                importBatchId, importedCount, skippedCount);

            return (importedCount, skippedCount);
        }

        /// <summary>
        /// Create tankstock entries for a row (opening, closing, dispensing, transfer, delivery)
        /// </summary>
        private async Task CreateTankstockEntries(
            BulkImportRowDTO entry,
            Tank tank,
            string recordedBy,
            string importBatchId,
            DateTime importedAt,
            CancellationToken cancellationToken)
        {
            // Create opening stock entry
            if (entry.Opening.HasValue)
            {
                var openingStock = new Tankstock
                {
                    TankId = tank.Id,
                    EntryDate = entry.Date,
                    EntryType = VolumeChangeReasonEnum.OpeningStock,
                    ManualOpeningLevel = entry.Opening.Value,
                    OpeningMeter = entry.OpeningMeter,
                    RecordedBy = recordedBy,
                    SiteId = tank.SiteId,
                    Comment = entry.Notes,
                    CreatedOn = DateTime.UtcNow,
                    ImportBatchId = importBatchId,
                    ImportedAt = importedAt,
                    ImportSource = "BulkImport"
                };
                _context.Tankstocks.Add(openingStock);
            }

            // Create closing stock entry
            if (entry.Closing.HasValue)
            {
                var expectedClosing = entry.CalculateExpectedClosing();
                var discrepancy = expectedClosing.HasValue ? entry.Closing.Value - expectedClosing.Value : (decimal?)null;

                var closingStock = new Tankstock
                {
                    TankId = tank.Id,
                    EntryDate = entry.Date,
                    EntryType = VolumeChangeReasonEnum.ClosingStock,
                    ManualClosingLevel = entry.Closing.Value,
                    ClosingMeter = entry.ClosingMeter,
                    ExpectedClosingLevel = expectedClosing,
                    Discrepancy = discrepancy,
                    RecordedBy = recordedBy,
                    SiteId = tank.SiteId,
                    Comment = entry.Notes,
                    CreatedOn = DateTime.UtcNow,
                    ImportBatchId = importBatchId,
                    ImportedAt = importedAt,
                    ImportSource = "BulkImport"
                };
                _context.Tankstocks.Add(closingStock);
            }

            // Create dispensing entry
            if (entry.Dispensing.HasValue && entry.Dispensing.Value > 0)
            {
                var dispensingEntry = new Tankstock
                {
                    TankId = tank.Id,
                    EntryDate = entry.Date,
                    EntryType = VolumeChangeReasonEnum.Dispensing,
                    ManualCalculatedUsage = entry.Dispensing.Value,
                    RecordedBy = recordedBy,
                    SiteId = tank.SiteId,
                    CreatedOn = DateTime.UtcNow,
                    ImportBatchId = importBatchId,
                    ImportedAt = importedAt,
                    ImportSource = "BulkImport"
                };
                _context.Tankstocks.Add(dispensingEntry);
            }

            // Create transfer IN entry
            if (entry.TransferIn.HasValue && entry.TransferIn.Value > 0)
            {
                var transferIn = new Tankstock
                {
                    TankId = tank.Id,
                    EntryDate = entry.Date,
                    EntryType = VolumeChangeReasonEnum.TransferIn,
                    ManualAmount = entry.TransferIn.Value,
                    RecordedBy = recordedBy,
                    SiteId = tank.SiteId,
                    Comment = entry.Notes,
                    CreatedOn = DateTime.UtcNow,
                    ImportBatchId = importBatchId,
                    ImportedAt = importedAt,
                    ImportSource = "BulkImport"
                };
                _context.Tankstocks.Add(transferIn);
            }

            // Create transfer OUT entry
            if (entry.TransferOut.HasValue && entry.TransferOut.Value > 0)
            {
                var transferOut = new Tankstock
                {
                    TankId = tank.Id,
                    EntryDate = entry.Date,
                    EntryType = VolumeChangeReasonEnum.TransferOut,
                    ManualAmount = entry.TransferOut.Value,
                    RecordedBy = recordedBy,
                    SiteId = tank.SiteId,
                    Comment = entry.Notes,
                    CreatedOn = DateTime.UtcNow,
                    ImportBatchId = importBatchId,
                    ImportedAt = importedAt,
                    ImportSource = "BulkImport"
                };
                _context.Tankstocks.Add(transferOut);
            }

            // Create delivery entry
            if (entry.Delivery.HasValue && entry.Delivery.Value > 0)
            {
                var delivery = new Tankstock
                {
                    TankId = tank.Id,
                    EntryDate = entry.Date,
                    EntryType = VolumeChangeReasonEnum.Delivery,
                    ManualAmount = entry.Delivery.Value,
                    RecordedBy = recordedBy,
                    SiteId = tank.SiteId,
                    Comment = entry.Notes,
                    CreatedOn = DateTime.UtcNow,
                    ImportBatchId = importBatchId,
                    ImportedAt = importedAt,
                    ImportSource = "BulkImport"
                };
                _context.Tankstocks.Add(delivery);
            }
        }
    }
}
