using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Application.Features.FuelAudit.Services;
using FMS.Domain.Entities.FuelAudit;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Commands
{
    /// <summary>
    /// Command to calculate/recalculate an audit
    /// This orchestrates the full reconciliation process
    /// </summary>
    public record CalculateAuditCommand(CalculateAuditDTO Data)
        : IRequest<FMSResponse<FuelAuditDetailDTO>>;

    /// <summary>
    /// Handler for CalculateAuditCommand
    /// Orchestrates the fuel audit calculation process
    /// </summary>
    public class CalculateAuditCommandHandler
        : IRequestHandler<CalculateAuditCommand, FMSResponse<FuelAuditDetailDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IFuelAuditCalculationService _calculationService;
        private readonly ILogger<CalculateAuditCommandHandler> _logger;

        public CalculateAuditCommandHandler(
            GpsdataContext context,
            IFuelAuditCalculationService calculationService,
            ILogger<CalculateAuditCommandHandler> logger)
        {
            _context = context;
            _calculationService = calculationService;
            _logger = logger;
        }

        public async Task<FMSResponse<FuelAuditDetailDTO>> Handle(
            CalculateAuditCommand request,
            CancellationToken cancellationToken)
        {
            try
            {
                var dto = request.Data;

                // 1. Load the audit with all related data
                var audit = await _context.FuelAudits
                    .Include(a => a.TankerReadings)
                    .Include(a => a.VehiclePositions)
                        .ThenInclude(vp => vp.Vehicle)
                    .Include(a => a.Variances)
                    .Include(a => a.Flags)
                    .FirstOrDefaultAsync(a => a.Id == dto.AuditId, cancellationToken);

                if (audit == null)
                {
                    return FMSResponse<FuelAuditDetailDTO>.Failed($"Audit {dto.AuditId} not found");
                }

                if (audit.Status == "Finalized")
                {
                    return FMSResponse<FuelAuditDetailDTO>.Failed("Cannot recalculate a finalized audit");
                }

                if (audit.Status == "Cancelled")
                {
                    return FMSResponse<FuelAuditDetailDTO>.Failed("Cannot calculate a cancelled audit");
                }

                // 2. Validate we have required data
                var validationResult = ValidateAuditData(audit);
                if (!validationResult.IsSuccess)
                {
                    return FMSResponse<FuelAuditDetailDTO>.Failed(validationResult.Message!);
                }

                // 3. Update status to InProgress
                audit.Status = "InProgress";
                audit.UpdatedAt = DateTime.UtcNow;
                audit.UpdatedBy = long.TryParse(dto.CalculatedBy, out var updatedById) ? updatedById : null;

                // 4. Fetch GPS data if requested
                if (dto.FetchFreshGPSData)
                {
                    await _calculationService.FetchGPSDataAsync(
                        audit.Id,
                        audit.StartDate,
                        audit.EndDate,
                        cancellationToken);
                }

                // 5. Calculate tanker reconciliation
                await _calculationService.CalculateTankerReconciliationAsync(
                    audit, cancellationToken);

                // 6. Calculate fleet reconciliation
                await _calculationService.CalculateFleetReconciliationAsync(
                    audit, dto.IncludePickupEstimation, cancellationToken);

                // 7. Calculate system totals
                CalculateSystemTotals(audit);

                // 8. Clear existing variances and flags
                _context.FuelAuditVariances.RemoveRange(audit.Variances);
                _context.FuelAuditFlags.RemoveRange(audit.Flags);
                await _context.SaveChangesAsync(cancellationToken);

                // 9. Calculate variances
                var variances = await _calculationService.CalculateVariancesAsync(
                    audit, cancellationToken);

                foreach (var variance in variances)
                {
                    _context.FuelAuditVariances.Add(variance);
                }

                // 10. Generate flags based on thresholds
                var flags = await _calculationService.GenerateFlagsAsync(
                    audit, variances, cancellationToken);

                foreach (var flag in flags)
                {
                    _context.FuelAuditFlags.Add(flag);
                }

                // 11. Update audit with calculation results
                audit.Status = "Calculated";
                audit.CalculatedAt = DateTime.UtcNow;
                audit.CalculatedBy = long.TryParse(dto.CalculatedBy, out var calcById) ? calcById : null;
                audit.FlagCount = flags.Count;
                audit.UnresolvedFlagCount = flags.Count;
                audit.DataConfidence = CalculateDataConfidence(audit);

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Calculated audit {AuditNumber} (ID: {AuditId}). Flags: {FlagCount}",
                    audit.AuditNumber, audit.Id, flags.Count);

                // 12. Return full audit details
                return await GetAuditDetailsAsync(audit.Id, cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calculating audit {AuditId}", request.Data.AuditId);
                return FMSResponse<FuelAuditDetailDTO>.Failed($"Error: {ex.Message}");
            }
        }

        private FMSResponse<bool> ValidateAuditData(Domain.Entities.FuelAudit.FuelAudit audit)
        {
            var errors = new List<string>();

            // Check for tanker readings with opening data
            var hasOpeningReading = audit.TankerReadings.Any(r => r.OpeningStock.HasValue);
            if (!hasOpeningReading)
            {
                errors.Add("Missing tanker opening stock reading");
            }

            // Check for tanker readings with closing data
            var hasClosingReading = audit.TankerReadings.Any(r => r.ClosingStock.HasValue);
            if (!hasClosingReading)
            {
                errors.Add("Missing tanker closing stock reading");
            }

            if (errors.Any())
            {
                return FMSResponse<bool>.Failed(
                    $"Audit cannot be calculated: {string.Join(", ", errors)}");
            }

            return FMSResponse<bool>.Success(true);
        }

        private void CalculateSystemTotals(Domain.Entities.FuelAudit.FuelAudit audit)
        {
            // System = Tanker + Fleet combined view
            audit.SystemOpeningStock = (audit.TankerOpeningStock ?? 0) +
                                        (audit.GPSFleetOpeningStock ?? 0) +
                                        (audit.PickupFleetOpeningStock ?? 0);
            audit.SystemClosingStock = (audit.TankerClosingStock ?? 0) +
                                        (audit.GPSFleetClosingStock ?? 0) +
                                        (audit.PickupFleetClosingStock ?? 0);

            // System variance is the unaccounted difference
            var expectedChange = (audit.ExternalFuelIn ?? 0) - (audit.TotalDispensed ?? 0);
            var actualChange = (audit.SystemClosingStock ?? 0) - (audit.SystemOpeningStock ?? 0);
            audit.SystemVariance = actualChange - expectedChange;

            if (audit.SystemOpeningStock > 0)
            {
                audit.SystemVariancePercent = Math.Round(
                    ((audit.SystemVariance ?? 0) / (audit.SystemOpeningStock ?? 1)) * 100, 2);
            }
        }

        private string CalculateDataConfidence(Domain.Entities.FuelAudit.FuelAudit audit)
        {
            var totalVehicles = (audit.GPSVehicleCount ?? 0) + (audit.PickupVehicleCount ?? 0);
            if (totalVehicles == 0) return "VeryLow";

            var gpsRatio = (decimal)(audit.GPSVehicleCount ?? 0) / totalVehicles * 100;

            if (gpsRatio >= 90) return "High";
            if (gpsRatio >= 70) return "Medium";
            if (gpsRatio >= 50) return "Low";
            return "VeryLow";
        }

        private async Task<FMSResponse<FuelAuditDetailDTO>> GetAuditDetailsAsync(
            long auditId,
            CancellationToken cancellationToken)
        {
            var audit = await _context.FuelAudits
                .Include(a => a.TankerReadings)
                .Include(a => a.VehiclePositions)
                    .ThenInclude(vp => vp.Vehicle)
                .Include(a => a.Variances)
                .Include(a => a.Flags)
                .FirstOrDefaultAsync(a => a.Id == auditId, cancellationToken);

            if (audit == null)
            {
                return FMSResponse<FuelAuditDetailDTO>.Failed("Audit not found");
            }

            // Calculate fleet totals for DTO
            var fleetOpeningStock = (audit.GPSFleetOpeningStock ?? 0) + (audit.PickupFleetOpeningStock ?? 0);
            var fleetClosingStock = (audit.GPSFleetClosingStock ?? 0) + (audit.PickupFleetClosingStock ?? 0);
            var fleetConsumption = (audit.GPSFleetConsumption ?? 0) + (audit.PickupFleetConsumption ?? 0);
            var totalVehicles = (audit.GPSVehicleCount ?? 0) + (audit.PickupVehicleCount ?? 0);
            var gpsCoverage = totalVehicles > 0 ? (decimal)(audit.GPSVehicleCount ?? 0) / totalVehicles * 100 : 0;

            var result = new FuelAuditDetailDTO
            {
                Id = audit.Id,
                AuditNumber = audit.AuditNumber,
                StartDate = audit.StartDate,
                EndDate = audit.EndDate,
                Status = audit.Status,
                Description = audit.Description,

                TankerOpeningStock = audit.TankerOpeningStock,
                TankerClosingStock = audit.TankerClosingStock,
                TotalDeliveries = audit.ExternalFuelIn,
                TotalDispensed = audit.TotalDispensed,
                ExpectedClosingStock = audit.ExpectedClosingStock,
                TankerVariance = audit.SystemVariance,
                TankerVariancePercent = audit.SystemVariancePercent,

                FleetOpeningStock = fleetOpeningStock,
                FleetClosingStock = fleetClosingStock,
                FleetGrossConsumption = fleetConsumption,

                SystemOpeningStock = audit.SystemOpeningStock,
                SystemClosingStock = audit.SystemClosingStock,
                SystemVariance = audit.SystemVariance,
                SystemVariancePercent = audit.SystemVariancePercent,

                DataConfidence = audit.DataConfidence,
                GPSCoverage = gpsCoverage,
                VehiclesCovered = totalVehicles,
                VehiclesWithGPS = audit.GPSVehicleCount ?? 0,
                FlagCount = audit.FlagCount,
                UnresolvedFlagCount = audit.UnresolvedFlagCount,

                CreatedAt = audit.CreatedAt,
                CreatedBy = audit.CreatedBy?.ToString(),
                UpdatedAt = audit.UpdatedAt,
                UpdatedBy = audit.UpdatedBy?.ToString(),
                CalculatedAt = audit.CalculatedAt,
                FinalizedAt = audit.FinalizedAt,
                FinalizedBy = audit.FinalizedBy?.ToString(),
                FinalizationNotes = audit.FinalizationNotes,

                TankerReadings = audit.TankerReadings.Select(r => new TankerReadingDTO
                {
                    Id = r.Id,
                    AuditId = r.AuditId,
                    TankId = r.TankId,
                    TankName = r.TankName,
                    TankCapacity = r.TankCapacity,
                    OpeningStock = r.OpeningStock,
                    OpeningReadingTime = r.OpeningReadingTime,
                    OpeningMethod = r.OpeningMethod,
                    OpeningNotes = r.OpeningNotes,
                    ClosingStock = r.ClosingStock,
                    ClosingReadingTime = r.ClosingReadingTime,
                    ClosingMethod = r.ClosingMethod,
                    ClosingNotes = r.ClosingNotes,
                    FuelReceived = r.FuelReceived,
                    FuelDispensed = r.FuelDispensed,
                    FuelTransferredIn = r.FuelTransferredIn,
                    FuelTransferredOut = r.FuelTransferredOut,
                    ExpectedClosing = r.ExpectedClosing,
                    Variance = r.Variance,
                    VariancePercent = r.VariancePercent,
                    HasVarianceFlag = r.HasVarianceFlag,
                    CreatedAt = r.CreatedAt
                }).ToList(),

                VehiclePositions = audit.VehiclePositions.Select(vp => new VehiclePositionDTO
                {
                    Id = vp.Id,
                    AuditId = vp.AuditId,
                    VehicleId = vp.VehicleId,
                    VehicleName = vp.VehicleName ?? vp.Vehicle?.VehicleCode,
                    PlateNumber = vp.NumberPlate ?? vp.Vehicle?.NumberPlate,
                    OpeningStock = vp.OpeningStock,
                    ClosingStock = vp.ClosingStock,
                    TotalRefueled = vp.FuelRefueled,
                    GrossConsumption = vp.FuelConsumed,
                    DistanceTraveled = vp.DistanceTraveled,
                    FuelEfficiency = vp.FuelEfficiency,
                    DataSource = vp.OpeningDataSource,
                    DataQuality = vp.OpeningDataQuality,
                    Notes = vp.EstimationNotes
                }).ToList(),

                Variances = audit.Variances.Select(v => new VarianceDTO
                {
                    Id = v.Id,
                    AuditId = v.AuditId,
                    Category = v.Category,
                    Amount = v.VarianceAmount,
                    Percentage = v.VariancePercent,
                    Description = v.Notes,
                    IsWithinThreshold = !v.ExceedsThreshold,
                    ThresholdValue = v.ThresholdPercent ?? v.ThresholdAbsolute
                }).ToList(),

                Flags = audit.Flags.Select(f => new FlagDTO
                {
                    Id = f.Id,
                    AuditId = f.AuditId,
                    FlagType = f.FlagType,
                    Severity = f.Severity,
                    Category = f.Category,
                    Title = f.Title,
                    Description = f.Description,
                    Status = f.Status,
                    AffectedValue = f.ActualValue,
                    ThresholdValue = f.ThresholdValue,
                    AffectedEntityType = f.ReferenceType,
                    AffectedEntityId = f.ReferenceId,
                    AffectedEntityName = f.ReferenceName,
                    ResolutionNotes = f.ResolutionNotes,
                    ResolvedBy = f.ResolvedBy?.ToString(),
                    ResolvedAt = f.ResolvedAt,
                    CreatedAt = f.CreatedAt
                }).ToList()
            };

            return FMSResponse<FuelAuditDetailDTO>.Success(result, "Audit calculated successfully");
        }
    }
}
