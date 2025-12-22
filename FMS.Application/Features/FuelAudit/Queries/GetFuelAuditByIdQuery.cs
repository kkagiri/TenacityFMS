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

namespace FMS.Application.Features.FuelAudit.Queries
{
    /// <summary>
    /// Query to get a single fuel audit with full details
    /// </summary>
    public record GetFuelAuditByIdQuery(long AuditId)
        : IRequest<FMSResponse<FuelAuditDetailDTO>>;

    /// <summary>
    /// Handler for GetFuelAuditByIdQuery
    /// </summary>
    public class GetFuelAuditByIdQueryHandler
        : IRequestHandler<GetFuelAuditByIdQuery, FMSResponse<FuelAuditDetailDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetFuelAuditByIdQueryHandler> _logger;

        public GetFuelAuditByIdQueryHandler(
            GpsdataContext context,
            ILogger<GetFuelAuditByIdQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<FuelAuditDetailDTO>> Handle(
            GetFuelAuditByIdQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var audit = await _context.FuelAudits
                    .Include(a => a.TankerReadings)
                    .Include(a => a.VehiclePositions)
                        .ThenInclude(vp => vp.Vehicle)
                    .Include(a => a.Variances)
                    .Include(a => a.Flags)
                    .Include(a => a.AuditSites)
                    .FirstOrDefaultAsync(a => a.Id == request.AuditId, cancellationToken);

                if (audit == null)
                {
                    return FMSResponse<FuelAuditDetailDTO>.Failed($"Audit {request.AuditId} not found");
                }

                // Calculate derived values for DTO
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
                    WizardStep = audit.WizardStep,

                    // Site information - multi-site support
                    SiteId = audit.SiteId,
                    SiteIds = audit.AuditSites?
                        .OrderBy(s => s.SiteOrder)
                        .Select(s => s.SiteId)
                        .ToList() ?? new List<int>(),

                    // Tanker/Storage readings
                    TankerOpeningStock = audit.TankerOpeningStock,
                    TankerClosingStock = audit.TankerClosingStock,
                    TotalDeliveries = audit.ExternalFuelIn,
                    TotalDispensed = audit.TotalDispensed,
                    ExpectedClosingStock = audit.ExpectedClosingStock,
                    TankerVariance = audit.SystemVariance,
                    TankerVariancePercent = audit.SystemVariancePercent,

                    // Fleet calculations
                    FleetOpeningStock = fleetOpeningStock,
                    FleetClosingStock = fleetClosingStock,
                    FleetGrossConsumption = fleetConsumption,

                    // System summary
                    SystemOpeningStock = audit.SystemOpeningStock,
                    SystemClosingStock = audit.SystemClosingStock,
                    SystemVariance = audit.SystemVariance,
                    SystemVariancePercent = audit.SystemVariancePercent,

                    // Quality metrics
                    DataConfidence = audit.DataConfidence,
                    GPSCoverage = gpsCoverage,
                    VehiclesCovered = totalVehicles,
                    VehiclesWithGPS = audit.GPSVehicleCount ?? 0,
                    FlagCount = audit.FlagCount,
                    UnresolvedFlagCount = audit.UnresolvedFlagCount,

                    // Metadata
                    CreatedAt = audit.CreatedAt,
                    CreatedBy = audit.CreatedBy?.ToString(),
                    UpdatedAt = audit.UpdatedAt,
                    UpdatedBy = audit.UpdatedBy?.ToString(),
                    CalculatedAt = audit.CalculatedAt,
                    FinalizedAt = audit.FinalizedAt,
                    FinalizedBy = audit.FinalizedBy?.ToString(),
                    FinalizationNotes = audit.FinalizationNotes,

                    // Related data
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
                        VehicleName = vp.VehicleName ?? vp.Vehicle?.HyoungNo,
                        PlateNumber = vp.NumberPlate ?? vp.Vehicle?.NumberPlate,
                        VehicleType = vp.VehicleType,
                        TankCapacity = vp.TankCapacity ?? vp.Vehicle?.FuelTankCapacity,
                        OpeningStock = vp.OpeningStock,
                        OpeningReadingTime = vp.OpeningReadingTime,
                        OpeningDataQuality = vp.OpeningDataQuality,
                        OpeningDataSource = vp.OpeningDataSource,
                        ClosingStock = vp.ClosingStock,
                        ClosingReadingTime = vp.ClosingReadingTime,
                        ClosingDataQuality = vp.ClosingDataQuality,
                        ClosingDataSource = vp.ClosingDataSource,
                        TotalRefueled = vp.FuelRefueled,
                        RefuelCount = vp.RefuelCount,
                        FuelConsumed = vp.FuelConsumed,
                        GpsMeasuredConsumption = vp.GpsMeasuredConsumption,
                        GrossConsumption = vp.FuelConsumed,
                        ExpectedClosing = vp.ExpectedClosing,
                        Variance = vp.Variance,
                        VariancePercent = vp.VariancePercent,
                        HasVarianceFlag = vp.HasVarianceFlag,
                        VarianceFlagMessage = vp.VarianceFlagMessage,
                        IsManuallyEdited = vp.IsManuallyEdited,
                        DistanceTraveled = vp.DistanceTraveled,
                        FuelEfficiency = vp.FuelEfficiency,
                        DataSource = vp.OpeningDataSource,
                        DataQuality = vp.OpeningDataQuality,
                        Notes = vp.EstimationNotes,
                        // Deserialize GPS refill events from JSON
                        GpsRefillEvents = !string.IsNullOrEmpty(vp.GpsRefillEventsJson)
                            ? JsonSerializer.Deserialize<List<DTOs.GpsRefillEventDTO>>(vp.GpsRefillEventsJson)
                            : null
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

                return FMSResponse<FuelAuditDetailDTO>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fuel audit {AuditId}", request.AuditId);
                return FMSResponse<FuelAuditDetailDTO>.Failed($"Error: {ex.Message}");
            }
        }
    }
}
