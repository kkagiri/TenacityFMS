using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities.FuelAudit;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Services
{
    /// <summary>
    /// Implementation of the fuel audit calculation service
    /// Handles core reconciliation logic between tanker and fleet
    /// </summary>
    public class FuelAuditCalculationService : IFuelAuditCalculationService
    {
        private readonly GpsdataContext _context;
        private readonly IFuelAuditGPSService _gpsService;
        private readonly IFuelAuditTankStockService _tankStockService;
        private readonly ILogger<FuelAuditCalculationService> _logger;

        public FuelAuditCalculationService(
            GpsdataContext context,
            IFuelAuditGPSService gpsService,
            IFuelAuditTankStockService tankStockService,
            ILogger<FuelAuditCalculationService> logger)
        {
            _context = context;
            _gpsService = gpsService;
            _tankStockService = tankStockService;
            _logger = logger;
        }

        /// <inheritdoc/>
        public async Task FetchGPSDataAsync(
            long auditId,
            DateTime startDate,
            DateTime endDate,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Fetching GPS data for audit {AuditId}, period {Start} to {End}",
                auditId, startDate, endDate);

            try
            {
                // Get all GPS-enabled vehicles (IsActive == 1)
                var vehicles = await _context.Vehicles
                    .Where(v => v.IsActive == 1)
                    .Select(v => new { v.VehicleId, v.VehicleCode })
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Found {Count} active vehicles", vehicles.Count);

                foreach (var vehicle in vehicles)
                {
                    try
                    {
                        // Fetch and cache GPS data for each vehicle
                        await _gpsService.GetVehicleConsumptionAsync(
                            vehicle.VehicleId,
                            startDate,
                            endDate,
                            cancellationToken);

                        _logger.LogDebug("Fetched GPS data for vehicle {VehicleId} ({Name})",
                            vehicle.VehicleId, vehicle.VehicleCode);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Failed to fetch GPS data for vehicle {VehicleId}",
                            vehicle.VehicleId);
                    }
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching GPS data for audit {AuditId}", auditId);
                throw;
            }
        }

        /// <inheritdoc/>
        public async Task CalculateTankerReconciliationAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Calculating tanker reconciliation for audit {AuditId}", audit.Id);

            // First, try to auto-populate tank readings from TankVolumeHistory if none exist
            var tankerReadings = audit.TankerReadings?.ToList() ?? new List<FuelAuditTankerReading>();

            if (tankerReadings.Count == 0)
            {
                _logger.LogInformation("No manual tanker readings found, attempting to auto-populate from TankVolumeHistory");
                tankerReadings = await PopulateTankReadingsFromHistoryAsync(audit, cancellationToken);
            }

            decimal totalTankerOpening = 0;
            decimal totalTankerClosing = 0;
            decimal totalFuelReceived = 0;
            decimal totalFuelDispensed = 0;

            foreach (var reading in tankerReadings)
            {
                totalTankerOpening += reading.OpeningStock ?? 0;
                totalTankerClosing += reading.ClosingStock ?? 0;
                totalFuelReceived += reading.FuelReceived ?? 0;
                totalFuelDispensed += reading.FuelDispensed ?? 0;
            }

            audit.TankerOpeningStock = totalTankerOpening;
            audit.TankerClosingStock = totalTankerClosing;
            audit.ExternalFuelIn = totalFuelReceived;
            audit.TotalDispensed = totalFuelDispensed;

            // Calculate expected closing stock
            // Expected = Opening + Received - Dispensed
            audit.ExpectedClosingStock = totalTankerOpening + totalFuelReceived - totalFuelDispensed;

            // System variance = Actual - Expected
            audit.SystemVariance = totalTankerClosing - (audit.ExpectedClosingStock ?? 0);

            // Calculate percentage
            if (audit.ExpectedClosingStock > 0)
            {
                audit.SystemVariancePercent = Math.Round(
                    ((audit.SystemVariance ?? 0) / (audit.ExpectedClosingStock ?? 1)) * 100, 2);
            }

            // Update tanker count
            audit.TankerCount = tankerReadings.Select(r => r.TankId).Distinct().Count();

            _logger.LogInformation("Tanker reconciliation: Opening={Opening}, Closing={Closing}, " +
                "Received={Received}, Dispensed={Dispensed}, Variance={Variance}",
                audit.TankerOpeningStock, audit.TankerClosingStock, audit.ExternalFuelIn,
                audit.TotalDispensed, audit.SystemVariance);
        }

        /// <summary>
        /// Auto-populates tank readings from TankVolumeHistory for the audit period
        /// </summary>
        private async Task<List<FuelAuditTankerReading>> PopulateTankReadingsFromHistoryAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            CancellationToken cancellationToken)
        {
            var readings = new List<FuelAuditTankerReading>();

            try
            {
                // Get tank data from TankVolumeHistory for the audit period
                var tankAuditData = await _tankStockService.GetSiteTankAuditDataAsync(
                    audit.SiteId,
                    audit.StartDate,
                    audit.EndDate,
                    cancellationToken);

                _logger.LogInformation("Found {Count} tanks with volume history for audit period", tankAuditData.Count);

                foreach (var tankData in tankAuditData)
                {
                    var reading = new FuelAuditTankerReading
                    {
                        AuditId = audit.Id,
                        TankId = tankData.TankId,
                        TankName = tankData.TankName,
                        TankCapacity = tankData.TankCapacity,

                        // Opening stock from TankVolumeHistory
                        OpeningStock = tankData.OpeningVolume,
                        OpeningReadingTime = tankData.OpeningReadingTime,
                        OpeningMethod = tankData.HasExplicitOpeningStock ? "Recorded" : "Interpolated",
                        OpeningNotes = tankData.HasExplicitOpeningStock
                            ? "From TankVolumeHistory OpeningStock entry"
                            : "Interpolated from last TankVolumeHistory entry before period",

                        // Closing stock from TankVolumeHistory
                        ClosingStock = tankData.ClosingVolume,
                        ClosingReadingTime = tankData.ClosingReadingTime,
                        ClosingMethod = tankData.HasExplicitClosingStock ? "Recorded" : "Interpolated",
                        ClosingNotes = tankData.HasExplicitClosingStock
                            ? "From TankVolumeHistory ClosingStock entry"
                            : "Interpolated from last TankVolumeHistory entry in period",

                        // Transaction totals from history
                        FuelReceived = tankData.TotalDeliveries + tankData.TotalTransfersIn,
                        FuelDispensed = tankData.TotalDispensing + tankData.TotalTransfersOut,

                        // Variance calculation
                        Variance = tankData.Variance,

                        // Auto-populated indicator
                        DataSource = "TankVolumeHistory",
                        IsAutoPopulated = true,

                        CreatedAt = DateTime.UtcNow
                    };

                    // Flag if we don't have explicit opening or closing stock readings
                    if (!tankData.HasExplicitOpeningStock || !tankData.HasExplicitClosingStock)
                    {
                        reading.HasDataQualityIssue = true;
                        reading.DataQualityNotes = !tankData.HasExplicitOpeningStock && !tankData.HasExplicitClosingStock
                            ? "Both opening and closing stock are interpolated"
                            : !tankData.HasExplicitOpeningStock
                                ? "Opening stock is interpolated"
                                : "Closing stock is interpolated";
                    }

                    readings.Add(reading);
                    _context.FuelAuditTankerReadings.Add(reading);
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Auto-populated {Count} tank readings from TankVolumeHistory", readings.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error auto-populating tank readings from TankVolumeHistory");
            }

            return readings;
        }

        /// <inheritdoc/>
        public async Task CalculateFleetReconciliationAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            bool includePickupEstimation,
            CancellationToken cancellationToken = default)
        {
            _logger.LogInformation("Calculating fleet reconciliation for audit {AuditId}", audit.Id);

            // Get all active vehicles
            var vehicles = await _context.Vehicles
                .Where(v => v.IsActive == 1)
                .ToListAsync(cancellationToken);

            int gpsVehicleCount = 0;
            int pickupVehicleCount = 0;
            int vehiclesWithExact = 0;
            int vehiclesWithEstimated = 0;
            int vehiclesWithNoData = 0;

            decimal gpsFleetOpening = 0;
            decimal gpsFleetClosing = 0;
            decimal gpsFleetConsumption = 0;
            decimal pickupFleetOpening = 0;
            decimal pickupFleetClosing = 0;
            decimal pickupFleetConsumption = 0;

            // Clear existing vehicle positions for this audit
            var existingPositions = await _context.FuelAuditVehiclePositions
                .Where(vp => vp.AuditId == audit.Id)
                .ToListAsync(cancellationToken);
            _context.FuelAuditVehiclePositions.RemoveRange(existingPositions);

            foreach (var vehicle in vehicles)
            {
                try
                {
                    // Get GPS fuel consumption for vehicle
                    var consumptionResult = await _gpsService.GetVehicleConsumptionAsync(
                        vehicle.VehicleId,
                        audit.StartDate,
                        audit.EndDate,
                        cancellationToken);

                    var vehiclePosition = new FuelAuditVehiclePosition
                    {
                        AuditId = audit.Id,
                        VehicleId = vehicle.VehicleId,
                        VehicleName = vehicle.VehicleCode,
                        NumberPlate = vehicle.NumberPlate,
                        VehicleType = "GPS",
                        TankCapacity = vehicle.FuelTankCapacity,
                        CreatedAt = DateTime.UtcNow
                    };

                    if (consumptionResult.IsSuccess && consumptionResult.Data != null)
                    {
                        var data = consumptionResult.Data;
                        vehiclePosition.OpeningStock = data.OpeningFuelLevel;
                        vehiclePosition.ClosingStock = data.ClosingFuelLevel;
                        vehiclePosition.OpeningReadingTime = data.StartDate;
                        vehiclePosition.ClosingReadingTime = data.EndDate;
                        vehiclePosition.FuelConsumed = data.TotalFuelConsumed;
                        vehiclePosition.DistanceTraveled = data.TotalDistance;
                        vehiclePosition.FuelEfficiency = data.FuelEfficiency;
                        vehiclePosition.OpeningDataQuality = data.OpeningDataQuality.ToString();
                        vehiclePosition.ClosingDataQuality = data.ClosingDataQuality.ToString();
                        vehiclePosition.OpeningDataSource = "GPS";
                        vehiclePosition.ClosingDataSource = "GPS";

                        // Get refuel events
                        var refuelResult = await _gpsService.DetectRefuelEventsAsync(
                            vehicle.VehicleId,
                            audit.StartDate,
                            10.0m,
                            cancellationToken);

                        if (refuelResult.IsSuccess && refuelResult.Data != null)
                        {
                            vehiclePosition.FuelRefueled = refuelResult.Data.Sum(r => r.FuelAdded);
                            vehiclePosition.RefuelCount = refuelResult.Data.Count;
                        }

                        // Calculate expected and variance
                        vehiclePosition.ExpectedClosing = (vehiclePosition.OpeningStock ?? 0)
                            + (vehiclePosition.FuelRefueled ?? 0)
                            - (vehiclePosition.FuelConsumed ?? 0);
                        vehiclePosition.Variance = (vehiclePosition.ClosingStock ?? 0)
                            - (vehiclePosition.ExpectedClosing ?? 0);

                        if (vehiclePosition.ExpectedClosing > 0)
                        {
                            vehiclePosition.VariancePercent = Math.Round(
                                ((vehiclePosition.Variance ?? 0) / (vehiclePosition.ExpectedClosing ?? 1)) * 100, 2);
                        }

                        if (data.HasCompleteData)
                        {
                            gpsVehicleCount++;
                            vehiclesWithExact++;
                            gpsFleetOpening += data.OpeningFuelLevel ?? 0;
                            gpsFleetClosing += data.ClosingFuelLevel ?? 0;
                            gpsFleetConsumption += data.TotalFuelConsumed ?? 0;
                        }
                        else
                        {
                            vehiclesWithEstimated++;
                        }
                    }
                    else if (includePickupEstimation)
                    {
                        // Mark as pickup vehicle
                        vehiclePosition.VehicleType = "Pickup";
                        vehiclePosition.OpeningDataSource = "Estimated";
                        vehiclePosition.ClosingDataSource = "Estimated";
                        vehiclePosition.OpeningDataQuality = "Low";
                        vehiclePosition.ClosingDataQuality = "Low";
                        vehiclePosition.EstimationConfidence = "Low";
                        vehiclePosition.EstimationNotes = "No GPS data available - estimation based on dispensing records";

                        pickupVehicleCount++;
                        vehiclesWithNoData++;
                    }
                    else
                    {
                        vehiclePosition.VehicleType = "Manual";
                        vehiclePosition.OpeningDataSource = "NoData";
                        vehiclePosition.ClosingDataSource = "NoData";
                        vehiclePosition.OpeningDataQuality = "NoData";
                        vehiclePosition.ClosingDataQuality = "NoData";
                        vehiclesWithNoData++;
                    }

                    _context.FuelAuditVehiclePositions.Add(vehiclePosition);
                }
                catch (Exception ex)
                {
                    _logger.LogWarning(ex, "Error processing vehicle {VehicleId} for audit", vehicle.VehicleId);
                }
            }

            // Update audit with fleet totals
            audit.GPSFleetOpeningStock = gpsFleetOpening;
            audit.GPSFleetClosingStock = gpsFleetClosing;
            audit.GPSFleetConsumption = gpsFleetConsumption;
            audit.PickupFleetOpeningStock = pickupFleetOpening;
            audit.PickupFleetClosingStock = pickupFleetClosing;
            audit.PickupFleetConsumption = pickupFleetConsumption;
            audit.GPSVehicleCount = gpsVehicleCount;
            audit.PickupVehicleCount = pickupVehicleCount;
            audit.VehiclesWithExactData = vehiclesWithExact;
            audit.VehiclesWithEstimatedData = vehiclesWithEstimated;
            audit.VehiclesWithNoData = vehiclesWithNoData;

            // Determine data confidence
            var totalVehicles = vehicles.Count;
            if (totalVehicles > 0)
            {
                var exactRatio = (decimal)vehiclesWithExact / totalVehicles;
                if (exactRatio >= 0.8m) audit.DataConfidence = "High";
                else if (exactRatio >= 0.6m) audit.DataConfidence = "Medium";
                else if (exactRatio >= 0.4m) audit.DataConfidence = "Low";
                else audit.DataConfidence = "VeryLow";
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Fleet reconciliation: GPSVehicles={GPS}, PickupVehicles={Pickup}, " +
                "Confidence={Confidence}",
                gpsVehicleCount, pickupVehicleCount, audit.DataConfidence);
        }

        /// <inheritdoc/>
        public async Task<List<FuelAuditVariance>> CalculateVariancesAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            CancellationToken cancellationToken = default)
        {
            var variances = new List<FuelAuditVariance>();

            // Get thresholds
            var thresholds = await _context.FuelAuditThresholds
                .Where(t => t.IsActive)
                .ToListAsync(cancellationToken);

            // 1. System/Tanker variance
            if (audit.SystemVariance.HasValue && audit.SystemVariance != 0)
            {
                var tankerThreshold = thresholds
                    .FirstOrDefault(t => t.ThresholdType == "TankerVariance");
                var thresholdValue = tankerThreshold?.ThresholdValue ?? 2.0m;

                variances.Add(new FuelAuditVariance
                {
                    AuditId = audit.Id,
                    Category = "Tanker",
                    ExpectedValue = audit.ExpectedClosingStock,
                    ActualValue = audit.TankerClosingStock,
                    VarianceAmount = audit.SystemVariance,
                    VariancePercent = audit.SystemVariancePercent,
                    VarianceDirection = audit.SystemVariance > 0 ? "Excess" : "Shortage",
                    ThresholdPercent = thresholdValue,
                    ExceedsThreshold = Math.Abs(audit.SystemVariancePercent ?? 0) > thresholdValue,
                    Severity = DetermineSeverityFromPercent(audit.SystemVariancePercent ?? 0),
                    PossibleCause = DeterminePossibleCause(audit.SystemVariance ?? 0, "Tanker"),
                    DataConfidence = audit.DataConfidence,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // 2. GPS Fleet variance
            var gpsFleetVariance = (audit.GPSFleetClosingStock ?? 0) - (audit.GPSFleetOpeningStock ?? 0)
                + (audit.GPSFleetConsumption ?? 0);
            if (Math.Abs(gpsFleetVariance) > 10) // Ignore tiny differences
            {
                var fleetThreshold = thresholds
                    .FirstOrDefault(t => t.ThresholdType == "FleetVariance");
                var thresholdValue = fleetThreshold?.ThresholdValue ?? 5.0m;
                var variancePercent = (audit.GPSFleetOpeningStock ?? 0) > 0
                    ? Math.Round(gpsFleetVariance / (audit.GPSFleetOpeningStock ?? 1) * 100, 2)
                    : 0;

                variances.Add(new FuelAuditVariance
                {
                    AuditId = audit.Id,
                    Category = "Fleet",
                    ReferenceName = "GPS Fleet",
                    ExpectedValue = audit.GPSFleetOpeningStock,
                    ActualValue = audit.GPSFleetClosingStock,
                    VarianceAmount = gpsFleetVariance,
                    VariancePercent = variancePercent,
                    VarianceDirection = gpsFleetVariance > 0 ? "Excess" : "Shortage",
                    ThresholdPercent = thresholdValue,
                    ExceedsThreshold = Math.Abs(variancePercent) > thresholdValue,
                    Severity = DetermineSeverityFromPercent(variancePercent),
                    DataConfidence = audit.DataConfidence,
                    CreatedAt = DateTime.UtcNow
                });
            }

            // 3. Dispensed vs GPS Refueled cross-check
            var gpsRefueled = await _context.FuelAuditVehiclePositions
                .Where(vp => vp.AuditId == audit.Id)
                .SumAsync(vp => vp.FuelRefueled ?? 0, cancellationToken);

            var dispensedVsRefueledVariance = (audit.TotalDispensed ?? 0) - gpsRefueled;
            if (Math.Abs(dispensedVsRefueledVariance) > 10)
            {
                var variancePercent = (audit.TotalDispensed ?? 0) > 0
                    ? Math.Round(dispensedVsRefueledVariance / (audit.TotalDispensed ?? 1) * 100, 2)
                    : 0;

                variances.Add(new FuelAuditVariance
                {
                    AuditId = audit.Id,
                    Category = "System",
                    ReferenceName = "DispensedVsRefueled",
                    ExpectedValue = audit.TotalDispensed,
                    ActualValue = gpsRefueled,
                    VarianceAmount = dispensedVsRefueledVariance,
                    VariancePercent = variancePercent,
                    VarianceDirection = dispensedVsRefueledVariance > 0 ? "Excess" : "Shortage",
                    ThresholdAbsolute = 50,
                    ExceedsThreshold = Math.Abs(dispensedVsRefueledVariance) > 50,
                    Severity = DetermineSeverityFromPercent(variancePercent),
                    Notes = $"Tanker dispensed ({audit.TotalDispensed:N2}L) vs GPS detected refueling ({gpsRefueled:N2}L)",
                    DataConfidence = audit.DataConfidence,
                    CreatedAt = DateTime.UtcNow
                });
            }

            return variances;
        }

        /// <inheritdoc/>
        public async Task<List<FuelAuditFlag>> GenerateFlagsAsync(
            Domain.Entities.FuelAudit.FuelAudit audit,
            List<FuelAuditVariance> variances,
            CancellationToken cancellationToken = default)
        {
            var flags = new List<FuelAuditFlag>();

            // Generate flags for variances that exceed thresholds
            foreach (var variance in variances.Where(v => v.ExceedsThreshold))
            {
                flags.Add(new FuelAuditFlag
                {
                    AuditId = audit.Id,
                    FlagType = $"{variance.Category}Variance",
                    Severity = variance.Severity ?? "Medium",
                    Category = variance.Category,
                    ReferenceId = variance.ReferenceId,
                    ReferenceType = variance.Category,
                    ReferenceName = variance.ReferenceName,
                    Title = $"{variance.Category} Variance Exceeded",
                    Description = variance.Notes ?? $"Variance of {variance.VarianceAmount:N2}L ({variance.VariancePercent:N2}%)",
                    ActualValue = variance.ActualValue,
                    ExpectedValue = variance.ExpectedValue,
                    ThresholdValue = variance.ThresholdPercent ?? variance.ThresholdAbsolute,
                    ValueUnit = variance.ThresholdPercent.HasValue ? "Percent" : "Liters",
                    Status = "Open",
                    CreatedAt = DateTime.UtcNow
                });
            }

            // Check for vehicle-specific issues
            var vehiclePositions = await _context.FuelAuditVehiclePositions
                .Include(vp => vp.Vehicle)
                .Where(vp => vp.AuditId == audit.Id)
                .ToListAsync(cancellationToken);

            var thresholds = await _context.FuelAuditThresholds
                .Where(t => t.IsActive)
                .ToListAsync(cancellationToken);

            var efficiencyThreshold = thresholds.FirstOrDefault(t => t.ThresholdType == "FuelEfficiency");
            var minEfficiency = efficiencyThreshold?.ThresholdValue ?? 5m;

            foreach (var vp in vehiclePositions)
            {
                // Check for suspicious fuel efficiency
                if (vp.FuelEfficiency.HasValue && vp.FuelEfficiency < minEfficiency)
                {
                    flags.Add(new FuelAuditFlag
                    {
                        AuditId = audit.Id,
                        FlagType = "LowFuelEfficiency",
                        Severity = vp.FuelEfficiency < (minEfficiency / 2) ? "Critical" : "Medium",
                        Category = "Vehicle",
                        ReferenceId = vp.VehicleId,
                        ReferenceType = "Vehicle",
                        ReferenceName = vp.VehicleName ?? vp.Vehicle?.VehicleCode,
                        Title = "Low Fuel Efficiency",
                        Description = $"Vehicle has low fuel efficiency: {vp.FuelEfficiency:N2} km/L",
                        ActualValue = vp.FuelEfficiency,
                        ExpectedValue = minEfficiency,
                        ThresholdValue = minEfficiency,
                        ValueUnit = "KmPerLiter",
                        Status = "Open",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // Check for data quality issues
                if (vp.OpeningDataQuality == "NoData" || vp.ClosingDataQuality == "NoData")
                {
                    flags.Add(new FuelAuditFlag
                    {
                        AuditId = audit.Id,
                        FlagType = "MissingData",
                        Severity = "Low",
                        Category = "Quality",
                        ReferenceId = vp.VehicleId,
                        ReferenceType = "Vehicle",
                        ReferenceName = vp.VehicleName ?? vp.Vehicle?.VehicleCode,
                        Title = "Missing GPS Data",
                        Description = $"Vehicle has no GPS fuel data for this period",
                        Status = "Open",
                        CreatedAt = DateTime.UtcNow
                    });
                }

                // Check for variance flag on vehicle
                if (vp.HasVarianceFlag)
                {
                    flags.Add(new FuelAuditFlag
                    {
                        AuditId = audit.Id,
                        FlagType = "VehicleVariance",
                        Severity = "Medium",
                        Category = "Vehicle",
                        ReferenceId = vp.VehicleId,
                        ReferenceType = "Vehicle",
                        ReferenceName = vp.VehicleName ?? vp.Vehicle?.VehicleCode,
                        Title = "Vehicle Fuel Variance",
                        Description = $"Vehicle has fuel variance of {vp.Variance:N2}L ({vp.VariancePercent:N2}%)",
                        ActualValue = vp.Variance,
                        ThresholdValue = 5, // Default 5% threshold
                        ValueUnit = "Liters",
                        Status = "Open",
                        CreatedAt = DateTime.UtcNow
                    });
                }
            }

            return flags;
        }

        private string DetermineSeverityFromPercent(decimal variancePercent)
        {
            var absPercent = Math.Abs(variancePercent);
            if (absPercent >= 10) return "Critical";
            if (absPercent >= 5) return "High";
            if (absPercent >= 2) return "Medium";
            return "Low";
        }

        private string DeterminePossibleCause(decimal variance, string category)
        {
            if (variance > 0)
            {
                return category switch
                {
                    "Tanker" => "MeasurementError",
                    "Fleet" => "UnrecordedRefueling",
                    _ => "Unknown"
                };
            }
            else
            {
                return category switch
                {
                    "Tanker" => "Evaporation",
                    "Fleet" => "UndetectedConsumption",
                    _ => "Unknown"
                };
            }
        }
    }
}
