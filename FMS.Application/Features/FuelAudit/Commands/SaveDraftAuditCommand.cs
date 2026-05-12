using System;
using System.Collections.Generic;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

// Alias to avoid namespace conflict
using FuelAuditEntity = FMS.Domain.Entities.FuelAudit.FuelAudit;
using FuelAuditTankerReadingEntity = FMS.Domain.Entities.FuelAudit.FuelAuditTankerReading;
using FuelAuditVehiclePositionEntity = FMS.Domain.Entities.FuelAudit.FuelAuditVehiclePosition;
using FuelAuditSiteEntity = FMS.Domain.Entities.FuelAudit.FuelAuditSite;

namespace FMS.Application.Features.FuelAudit.Commands
{
    /// <summary>
    /// DTO for saving draft audit at any wizard step
    /// </summary>
    public class SaveDraftAuditDTO
    {
        /// <summary>
        /// Existing audit ID if updating, null if creating new
        /// </summary>
        public long? AuditId { get; set; }

        /// <summary>
        /// User-defined audit name/number (optional override for auto-generated number)
        /// </summary>
        public string? AuditNumber { get; set; }

        /// <summary>
        /// Current wizard step (1-7)
        /// </summary>
        public int WizardStep { get; set; } = 1;

        // ===== Step 1: Site & Period =====
        /// <summary>
        /// Site IDs for multi-site audit
        /// </summary>
        public List<int> SiteIds { get; set; } = new();

        /// <summary>
        /// Audit period start date
        /// </summary>
        public DateTime? PeriodStart { get; set; }

        /// <summary>
        /// Audit period end date
        /// </summary>
        public DateTime? PeriodEnd { get; set; }

        /// <summary>
        /// Audit type: Daily, Weekly, Monthly
        /// </summary>
        public string AuditType { get; set; } = "Weekly";

        // ===== Step 2: Tank Selection =====
        /// <summary>
        /// Selected tank IDs
        /// </summary>
        public List<long> SelectedTankIds { get; set; } = new();

        // ===== Step 3: Tank Preview Data =====
        /// <summary>
        /// Tank preview data with edits
        /// </summary>
        public List<TankPreviewEditDTO> TankPreviewData { get; set; } = new();

        // ===== Step 4: Vehicle Selection =====
        /// <summary>
        /// Selected vehicle IDs
        /// </summary>
        public List<int> SelectedVehicleIds { get; set; } = new();

        /// <summary>
        /// Include GPS fleet vehicles
        /// </summary>
        public bool IncludeGpsFleet { get; set; } = true;

        /// <summary>
        /// Include pickup vehicles
        /// </summary>
        public bool IncludePickups { get; set; } = true;

        // ===== Step 5: GPS Data =====
        /// <summary>
        /// Vehicle GPS data with edits
        /// </summary>
        public List<VehicleGpsEditDTO> VehicleGpsData { get; set; } = new();

        // ===== Step 6: Reconciliation =====
        /// <summary>
        /// Reconciliation edits
        /// </summary>
        public ReconciliationEditDTO? ReconciliationData { get; set; }

        // ===== Metadata =====
        /// <summary>
        /// Notes/description
        /// </summary>
        public string? Notes { get; set; }

        /// <summary>
        /// User saving the draft
        /// </summary>
        public string? UserId { get; set; }
    }

    /// <summary>
    /// Tank preview edit data
    /// </summary>
    public class TankPreviewEditDTO
    {
        public long TankId { get; set; }
        public string? TankName { get; set; }
        public decimal? OpeningStock { get; set; }
        public decimal? ClosingStock { get; set; }
        public decimal? TotalDeliveries { get; set; }
        public decimal? TotalDispensed { get; set; }
        public decimal? TotalTransfersIn { get; set; }
        public decimal? TotalTransfersOut { get; set; }
        public string? OpeningDataSource { get; set; }
        public string? ClosingDataSource { get; set; }
        public bool IsEdited { get; set; }
    }

    /// <summary>
    /// Vehicle GPS edit data
    /// </summary>
    public class VehicleGpsEditDTO
    {
        public int VehicleId { get; set; }
        public string? VehicleName { get; set; }
        public int? VehicleCategory { get; set; }
        public decimal? OpeningFuel { get; set; }
        public decimal? ClosingFuel { get; set; }
        public decimal? Consumption { get; set; }
        public decimal? GpsMeasuredConsumption { get; set; }
        public decimal? ConsumptionVariance { get; set; }
        public decimal? VehicleVariance { get; set; }
        public decimal? TotalFuelRefilled { get; set; }
        public int? RefillCount { get; set; }
        public string? DataSource { get; set; }
        public string? DataQuality { get; set; }
        public string? OpeningDataQuality { get; set; }
        public string? ClosingDataQuality { get; set; }
        public DateTime? OpeningTimestamp { get; set; }
        public DateTime? ClosingTimestamp { get; set; }
        public int? OpeningDaysFromRequested { get; set; }
        public int? ClosingDaysFromRequested { get; set; }
        public bool HasVarianceFlag { get; set; }
        public string? VarianceFlagMessage { get; set; }
        public bool IsEdited { get; set; }
        public bool GpsDataLoaded { get; set; }

        /// <summary>
        /// GPS refill events for Categories 1 & 4 (from SOAP Report 212)
        /// </summary>
        public List<GpsRefillEventSaveDTO>? GpsRefillEvents { get; set; }
    }

    /// <summary>
    /// Simplified GPS refill event for save/load
    /// </summary>
    public class GpsRefillEventSaveDTO
    {
        public int EntryId { get; set; }
        public DateTime RefillDate { get; set; }
        public decimal? FuelBefore { get; set; }
        public decimal? FuelAfter { get; set; }
        public decimal GpsRefillVolume { get; set; }
        public decimal? ManualRefillAmount { get; set; }
        public decimal? Variance { get; set; }
        public decimal? VariancePercent { get; set; }
        public int? FuelRefillId { get; set; }
        public string? TankName { get; set; }
    }

    /// <summary>
    /// Reconciliation edit data
    /// </summary>
    public class ReconciliationEditDTO
    {
        public decimal? TankOpeningStock { get; set; }
        public decimal? TankClosingStock { get; set; }
        public decimal? FleetOpeningStock { get; set; }
        public decimal? FleetClosingStock { get; set; }
        public decimal? TotalDeliveries { get; set; }
        public decimal? TotalConsumption { get; set; }
        public decimal? CalculatedVariance { get; set; }
        public string? Notes { get; set; }
    }

    /// <summary>
    /// Command to save draft audit at any wizard step
    /// Creates a new draft on Step 1, updates on subsequent steps
    /// </summary>
    public record SaveDraftAuditCommand(SaveDraftAuditDTO Data)
        : IRequest<FMSResponse<SaveDraftAuditResponseDTO>>;

    /// <summary>
    /// Response DTO for save draft
    /// </summary>
    public class SaveDraftAuditResponseDTO
    {
        public long AuditId { get; set; }
        public string AuditNumber { get; set; } = string.Empty;
        public string Status { get; set; } = "Draft";
        public int WizardStep { get; set; }
        public DateTime LastSavedAt { get; set; }
        public string? Message { get; set; }

        /// <summary>
        /// Site IDs included in this audit (multi-site support)
        /// </summary>
        public List<int> SiteIds { get; set; } = new();
    }

    /// <summary>
    /// Handler for SaveDraftAuditCommand
    /// </summary>
    public class SaveDraftAuditCommandHandler
        : IRequestHandler<SaveDraftAuditCommand, FMSResponse<SaveDraftAuditResponseDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<SaveDraftAuditCommandHandler> _logger;

        public SaveDraftAuditCommandHandler(
            GpsdataContext context,
            ILogger<SaveDraftAuditCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<SaveDraftAuditResponseDTO>> Handle(
            SaveDraftAuditCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.Data;
                FuelAuditEntity audit;

                // Step 1: Create new or get existing
                if (dto.AuditId.HasValue && dto.AuditId > 0)
                {
                    // Get existing audit
                    audit = await _context.FuelAudits
                        .Include(a => a.TankerReadings)
                        .Include(a => a.VehiclePositions)
                        .FirstOrDefaultAsync(a => a.Id == dto.AuditId, cancellationToken);

                    if (audit == null)
                    {
                        return FMSResponse<SaveDraftAuditResponseDTO>.Failed($"Audit with ID {dto.AuditId} not found");
                    }

                    if (audit.Status != "Draft")
                    {
                        return FMSResponse<SaveDraftAuditResponseDTO>.Failed("Cannot modify a finalized or cancelled audit");
                    }
                }
                else
                {
                    // Create new draft audit (Step 1)
                    if (!dto.PeriodStart.HasValue || !dto.PeriodEnd.HasValue)
                    {
                        return FMSResponse<SaveDraftAuditResponseDTO>.Failed("Period start and end dates are required");
                    }

                    // Use provided audit number or generate one
                    string auditNumber;
                    if (!string.IsNullOrWhiteSpace(dto.AuditNumber))
                    {
                        auditNumber = dto.AuditNumber;
                    }
                    else
                    {
                        // Generate: FA - YYYY-MM-DD HH:mm:ss
                        var now = DateTime.UtcNow;
                        auditNumber = $"FA - {now:yyyy-MM-dd HH:mm:ss}";
                    }

                    audit = new FuelAuditEntity
                    {
                        AuditNumber = auditNumber,
                        StartDate = dto.PeriodStart.Value.Date,
                        EndDate = dto.PeriodEnd.Value.Date,
                        Status = "Draft",
                        SiteId = dto.SiteIds.FirstOrDefault(), // Primary site (for backward compatibility)
                        Description = dto.Notes ?? $"{dto.AuditType} Fuel Audit",
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = long.TryParse(dto.UserId, out var userId) ? userId : null
                    };

                    _context.FuelAudits.Add(audit);
                    await _context.SaveChangesAsync(cancellationToken);

                    // Save all site IDs to FuelAuditSites for multi-site support
                    await SaveAuditSites(audit.Id, dto.SiteIds, cancellationToken);

                    _logger.LogInformation("Created draft fuel audit {AuditNumber} (ID: {AuditId}) with {SiteCount} sites",
                        audit.AuditNumber, audit.Id, dto.SiteIds.Count);
                }

                // Update audit based on wizard step
                await UpdateAuditFromWizardStep(audit, dto, cancellationToken);

                await _context.SaveChangesAsync(cancellationToken);

                var response = new SaveDraftAuditResponseDTO
                {
                    AuditId = audit.Id,
                    AuditNumber = audit.AuditNumber,
                    Status = audit.Status,
                    WizardStep = dto.WizardStep,
                    LastSavedAt = DateTime.UtcNow,
                    Message = $"Draft saved at Step {dto.WizardStep}",
                    SiteIds = dto.SiteIds // Return site IDs in response
                };

                return FMSResponse<SaveDraftAuditResponseDTO>.Success(response, "Draft saved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving draft audit");
                return FMSResponse<SaveDraftAuditResponseDTO>.Failed($"Error saving draft: {ex.Message}");
            }
        }

        private async Task UpdateAuditFromWizardStep(
            FuelAuditEntity audit,
            SaveDraftAuditDTO dto,
            CancellationToken cancellationToken)
        {
            // Update audit number if provided
            if (!string.IsNullOrWhiteSpace(dto.AuditNumber))
                audit.AuditNumber = dto.AuditNumber;

            // Update period if changed
            if (dto.PeriodStart.HasValue)
                audit.StartDate = dto.PeriodStart.Value.Date;
            if (dto.PeriodEnd.HasValue)
                audit.EndDate = dto.PeriodEnd.Value.Date;

            audit.Description = dto.Notes ?? audit.Description;
            audit.UpdatedAt = DateTime.UtcNow;
            audit.UpdatedBy = long.TryParse(dto.UserId, out var userId) ? userId : null;

            // IMPORTANT: Save wizard step progress to database
            audit.WizardStep = dto.WizardStep;

            // Update site IDs if changed (multi-site support)
            if (dto.SiteIds.Any())
            {
                audit.SiteId = dto.SiteIds.FirstOrDefault(); // Primary site for backward compatibility
                await SaveAuditSites(audit.Id, dto.SiteIds, cancellationToken);
            }

            // Step 2-3: Save tank readings
            if (dto.WizardStep >= 2 && dto.SelectedTankIds.Any())
            {
                audit.TankerCount = dto.SelectedTankIds.Count;

                // Save/Update tank preview data (Step 3 edits)
                if (dto.TankPreviewData.Any())
                {
                    foreach (var tankData in dto.TankPreviewData)
                    {
                        var existing = audit.TankerReadings
                            .FirstOrDefault(t => t.TankId == tankData.TankId);

                        if (existing != null)
                        {
                            // Update existing
                            existing.OpeningStock = tankData.OpeningStock;
                            existing.ClosingStock = tankData.ClosingStock;
                            existing.FuelReceived = tankData.TotalDeliveries;
                            existing.FuelDispensed = tankData.TotalDispensed;
                            existing.FuelTransferredIn = tankData.TotalTransfersIn;
                            existing.FuelTransferredOut = tankData.TotalTransfersOut;
                            existing.OpeningMethod = tankData.IsEdited ? "Manual" : tankData.OpeningDataSource;
                            existing.ClosingMethod = tankData.IsEdited ? "Manual" : tankData.ClosingDataSource;
                            existing.UpdatedAt = DateTime.UtcNow;
                            existing.UpdatedBy = long.TryParse(dto.UserId, out var uid) ? uid : null;
                        }
                        else
                        {
                            // Create new
                            var reading = new FuelAuditTankerReadingEntity
                            {
                                AuditId = audit.Id,
                                TankId = tankData.TankId,
                                TankName = tankData.TankName,
                                OpeningStock = tankData.OpeningStock,
                                ClosingStock = tankData.ClosingStock,
                                FuelReceived = tankData.TotalDeliveries,
                                FuelDispensed = tankData.TotalDispensed,
                                FuelTransferredIn = tankData.TotalTransfersIn,
                                FuelTransferredOut = tankData.TotalTransfersOut,
                                OpeningMethod = tankData.IsEdited ? "Manual" : tankData.OpeningDataSource,
                                ClosingMethod = tankData.IsEdited ? "Manual" : tankData.ClosingDataSource,
                                DataSource = "WizardPreview",
                                IsAutoPopulated = !tankData.IsEdited,
                                CreatedAt = DateTime.UtcNow,
                                CreatedBy = long.TryParse(dto.UserId, out var uid) ? uid : null
                            };

                            // Calculate expected closing
                            reading.ExpectedClosing = (reading.OpeningStock ?? 0)
                                + (reading.FuelReceived ?? 0)
                                + (reading.FuelTransferredIn ?? 0)
                                - (reading.FuelDispensed ?? 0)
                                - (reading.FuelTransferredOut ?? 0);

                            reading.Variance = reading.ExpectedClosing - (reading.ClosingStock ?? 0);

                            if (reading.ExpectedClosing > 0)
                            {
                                var variancePercent = (reading.Variance / reading.ExpectedClosing) * 100;
                                // Clamp to database column limit: DECIMAL(5,2) allows -999.99 to 999.99
                                reading.VariancePercent = Math.Clamp(variancePercent ?? 0, -999.99m, 999.99m);
                            }
                            else
                            {
                                reading.VariancePercent = null;
                            }

                            audit.TankerReadings.Add(reading);
                        }
                    }

                    // Update tank totals on audit
                    audit.TankerOpeningStock = audit.TankerReadings.Sum(t => t.OpeningStock ?? 0);
                    audit.TankerClosingStock = audit.TankerReadings.Sum(t => t.ClosingStock ?? 0);
                    audit.TotalDispensed = audit.TankerReadings.Sum(t => t.FuelDispensed ?? 0);
                    audit.ExternalFuelIn = audit.TankerReadings.Sum(t => t.FuelReceived ?? 0);
                }
            }

            // Step 4-5: Save vehicle positions
            if (dto.WizardStep >= 4 && dto.SelectedVehicleIds.Any())
            {
                audit.GPSVehicleCount = dto.SelectedVehicleIds.Count(id =>
                    dto.VehicleGpsData.Any(v => v.VehicleId == id && (v.VehicleCategory == 1 || v.VehicleCategory == 4)));
                audit.PickupVehicleCount = dto.SelectedVehicleIds.Count - (audit.GPSVehicleCount ?? 0);

                // Save vehicle GPS data (Step 5 edits)
                if (dto.VehicleGpsData.Any())
                {
                    foreach (var vehicleData in dto.VehicleGpsData)
                    {
                        var existing = audit.VehiclePositions
                            .FirstOrDefault(v => v.VehicleId == vehicleData.VehicleId);

                        if (existing != null)
                        {
                            // Update existing - preserve all editable and GPS fields
                            existing.OpeningStock = vehicleData.OpeningFuel;
                            existing.ClosingStock = vehicleData.ClosingFuel;
                            existing.FuelConsumed = vehicleData.Consumption;
                            existing.GpsMeasuredConsumption = vehicleData.GpsMeasuredConsumption;
                            existing.FuelRefueled = vehicleData.TotalFuelRefilled;
                            existing.RefuelCount = vehicleData.RefillCount;
                            existing.OpeningDataSource = vehicleData.IsEdited ? "Manual" : vehicleData.DataSource;
                            existing.ClosingDataSource = vehicleData.IsEdited ? "Manual" : vehicleData.DataSource;
                            existing.OpeningDataQuality = vehicleData.OpeningDataQuality ?? vehicleData.DataQuality;
                            existing.ClosingDataQuality = vehicleData.ClosingDataQuality ?? vehicleData.DataQuality;
                            existing.OpeningReadingTime = vehicleData.OpeningTimestamp;
                            existing.ClosingReadingTime = vehicleData.ClosingTimestamp;
                            existing.HasVarianceFlag = vehicleData.HasVarianceFlag;
                            existing.VarianceFlagMessage = vehicleData.VarianceFlagMessage;
                            existing.IsManuallyEdited = vehicleData.IsEdited;
                            existing.UpdatedAt = DateTime.UtcNow;
                            existing.UpdatedBy = long.TryParse(dto.UserId, out var uid) ? uid : null;

                            // Save GPS refill events as JSON for Categories 1 & 4
                            if (vehicleData.GpsRefillEvents != null && vehicleData.GpsRefillEvents.Any())
                            {
                                existing.GpsRefillEventsJson = JsonSerializer.Serialize(vehicleData.GpsRefillEvents);
                            }

                            // Recalculate variance after update
                            existing.ExpectedClosing = (existing.OpeningStock ?? 0)
                                + (existing.FuelRefueled ?? 0)
                                - (existing.FuelConsumed ?? 0);
                            existing.Variance = (existing.ClosingStock ?? 0) - (existing.ExpectedClosing ?? 0);
                            if (existing.ExpectedClosing > 0)
                            {
                                var variancePercent = (existing.Variance / existing.ExpectedClosing) * 100;
                                // Clamp to database column limit: DECIMAL(5,2) allows -999.99 to 999.99
                                existing.VariancePercent = Math.Clamp(variancePercent ?? 0, -999.99m, 999.99m);
                            }
                            else
                            {
                                existing.VariancePercent = null;
                            }
                        }
                        else
                        {
                            // Create new
                            var position = new FuelAuditVehiclePositionEntity
                            {
                                AuditId = audit.Id,
                                VehicleId = vehicleData.VehicleId,
                                VehicleName = vehicleData.VehicleName,
                                VehicleType = GetVehicleType(vehicleData.VehicleCategory),
                                OpeningStock = vehicleData.OpeningFuel,
                                ClosingStock = vehicleData.ClosingFuel,
                                FuelConsumed = vehicleData.Consumption,
                                GpsMeasuredConsumption = vehicleData.GpsMeasuredConsumption,
                                FuelRefueled = vehicleData.TotalFuelRefilled,
                                RefuelCount = vehicleData.RefillCount,
                                OpeningDataSource = vehicleData.IsEdited ? "Manual" : vehicleData.DataSource,
                                ClosingDataSource = vehicleData.IsEdited ? "Manual" : vehicleData.DataSource,
                                OpeningDataQuality = vehicleData.OpeningDataQuality ?? vehicleData.DataQuality,
                                ClosingDataQuality = vehicleData.ClosingDataQuality ?? vehicleData.DataQuality,
                                OpeningReadingTime = vehicleData.OpeningTimestamp,
                                ClosingReadingTime = vehicleData.ClosingTimestamp,
                                HasVarianceFlag = vehicleData.HasVarianceFlag,
                                VarianceFlagMessage = vehicleData.VarianceFlagMessage,
                                IsManuallyEdited = vehicleData.IsEdited,
                                // Save GPS refill events as JSON for Categories 1 & 4
                                GpsRefillEventsJson = vehicleData.GpsRefillEvents != null && vehicleData.GpsRefillEvents.Any()
                                    ? JsonSerializer.Serialize(vehicleData.GpsRefillEvents)
                                    : null,
                                CreatedAt = DateTime.UtcNow,
                                CreatedBy = long.TryParse(dto.UserId, out var uid2) ? uid2 : null
                            };

                            // Calculate expected closing
                            position.ExpectedClosing = (position.OpeningStock ?? 0)
                                + (position.FuelRefueled ?? 0)
                                - (position.FuelConsumed ?? 0);

                            position.Variance = (position.ClosingStock ?? 0) - (position.ExpectedClosing ?? 0);

                            if (position.ExpectedClosing > 0)
                            {
                                var variancePercent = (position.Variance / position.ExpectedClosing) * 100;
                                // Clamp to database column limit: DECIMAL(5,2) allows -999.99 to 999.99
                                position.VariancePercent = Math.Clamp(variancePercent ?? 0, -999.99m, 999.99m);
                            }
                            else
                            {
                                position.VariancePercent = null;
                            }

                            audit.VehiclePositions.Add(position);
                        }
                    }

                    // Update fleet totals on audit
                    audit.GPSFleetOpeningStock = audit.VehiclePositions
                        .Where(v => v.VehicleType == "GPS")
                        .Sum(v => v.OpeningStock ?? 0);
                    audit.GPSFleetClosingStock = audit.VehiclePositions
                        .Where(v => v.VehicleType == "GPS")
                        .Sum(v => v.ClosingStock ?? 0);
                    audit.GPSFleetConsumption = audit.VehiclePositions
                        .Where(v => v.VehicleType == "GPS")
                        .Sum(v => v.FuelConsumed ?? 0);

                    audit.PickupFleetOpeningStock = audit.VehiclePositions
                        .Where(v => v.VehicleType != "GPS")
                        .Sum(v => v.OpeningStock ?? 0);
                    audit.PickupFleetClosingStock = audit.VehiclePositions
                        .Where(v => v.VehicleType != "GPS")
                        .Sum(v => v.ClosingStock ?? 0);
                    audit.PickupFleetConsumption = audit.VehiclePositions
                        .Where(v => v.VehicleType != "GPS")
                        .Sum(v => v.FuelConsumed ?? 0);
                }
            }

            // Step 6: Reconciliation adjustments
            if (dto.WizardStep >= 6 && dto.ReconciliationData != null)
            {
                var recon = dto.ReconciliationData;

                // Allow manual override of totals
                if (recon.TankOpeningStock.HasValue)
                    audit.TankerOpeningStock = recon.TankOpeningStock;
                if (recon.TankClosingStock.HasValue)
                    audit.TankerClosingStock = recon.TankClosingStock;
                if (recon.FleetOpeningStock.HasValue)
                    audit.GPSFleetOpeningStock = recon.FleetOpeningStock;
                if (recon.FleetClosingStock.HasValue)
                    audit.GPSFleetClosingStock = recon.FleetClosingStock;

                // Calculate system totals
                audit.SystemOpeningStock = (audit.TankerOpeningStock ?? 0)
                    + (audit.GPSFleetOpeningStock ?? 0)
                    + (audit.PickupFleetOpeningStock ?? 0);

                audit.SystemClosingStock = (audit.TankerClosingStock ?? 0)
                    + (audit.GPSFleetClosingStock ?? 0)
                    + (audit.PickupFleetClosingStock ?? 0);

                // Calculate expected closing
                var totalMovements = (audit.ExternalFuelIn ?? 0)
                    - (audit.GPSFleetConsumption ?? 0)
                    - (audit.PickupFleetConsumption ?? 0);

                audit.ExpectedClosingStock = audit.SystemOpeningStock + totalMovements;

                audit.SystemVariance = audit.ExpectedClosingStock - audit.SystemClosingStock;

                if (audit.ExpectedClosingStock > 0)
                {
                    var variancePercent = (audit.SystemVariance / audit.ExpectedClosingStock) * 100;
                    // Clamp to database column limit: DECIMAL(5,2) allows -999.99 to 999.99
                    audit.SystemVariancePercent = Math.Clamp(variancePercent ?? 0, -999.99m, 999.99m);
                }
                else
                {
                    audit.SystemVariancePercent = null;
                }

                // Add reconciliation notes
                if (!string.IsNullOrEmpty(recon.Notes))
                {
                    audit.Description = $"{audit.Description}\n\nReconciliation Notes: {recon.Notes}";
                }
            }

            // Update data quality metrics
            if (dto.VehicleGpsData.Any())
            {
                audit.VehiclesWithExactData = dto.VehicleGpsData
                    .Count(v => v.DataQuality == "Exact" || v.DataQuality == "High");
                audit.VehiclesWithEstimatedData = dto.VehicleGpsData
                    .Count(v => v.DataQuality == "Interpolated" || v.DataQuality == "Medium" || v.DataQuality == "Low");
                audit.VehiclesWithNoData = dto.VehicleGpsData
                    .Count(v => string.IsNullOrEmpty(v.DataQuality) || v.DataQuality == "NoData");

                // Determine overall confidence
                var totalVehicles = dto.VehicleGpsData.Count;
                var exactPercent = totalVehicles > 0 ? (audit.VehiclesWithExactData ?? 0) * 100.0 / totalVehicles : 0;

                audit.DataConfidence = exactPercent switch
                {
                    >= 80 => "High",
                    >= 60 => "Medium",
                    >= 40 => "Low",
                    _ => "VeryLow"
                };
            }
        }

        /// <summary>
        /// Saves/updates the audit site associations for multi-site support
        /// </summary>
        private async Task SaveAuditSites(long auditId, List<int> siteIds, CancellationToken cancellationToken)
        {
            if (siteIds == null || !siteIds.Any())
            {
                _logger.LogWarning("No site IDs provided for audit {AuditId}", auditId);
                return;
            }

            // Remove existing site associations
            var existingSites = await _context.FuelAuditSites
                .Where(s => s.AuditId == auditId)
                .ToListAsync(cancellationToken);

            if (existingSites.Any())
            {
                _context.FuelAuditSites.RemoveRange(existingSites);
            }

            // Add new site associations
            var order = 0;
            foreach (var siteId in siteIds)
            {
                var auditSite = new FuelAuditSiteEntity
                {
                    AuditId = auditId,
                    SiteId = siteId,
                    SiteOrder = order++,
                    CreatedAt = DateTime.UtcNow
                };

                _context.FuelAuditSites.Add(auditSite);
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Saved {SiteCount} site associations for audit {AuditId}: [{SiteIds}]",
                siteIds.Count, auditId, string.Join(", ", siteIds));
        }

        private static string GetVehicleType(int? category) => category switch
        {
            1 => "GPS",   // Site GPS Fleet
            4 => "GPS",   // Cross-Site Company GPS
            2 => "FullTank",
            3 => "Equipment",
            5 => "External",
            _ => "Pickup"
        };
    }
}
