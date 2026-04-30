using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using VehicleEntity = FMS.Domain.Entities.Vehicle;

namespace FMS.Application.Features.FuelAudit.Queries
{
    /// <summary>
    /// Query to get fuel refills from selected tanks for a given period
    /// Used in audit wizard step 4 to show vehicles that were fueled
    /// Now includes vehicle classification into 5 categories
    /// </summary>
    public record GetTankRefillsForPeriodQuery(GetTankRefillsPreviewRequest Request)
        : IRequest<FMSResponse<List<VehicleRefillSummaryDTO>>>;

    /// <summary>
    /// Handler for GetTankRefillsForPeriodQuery
    /// Classifies vehicles using Vehicle entity properties:
    /// - WorkingSiteId: Site assignment
    /// - IsCompanyVehicle: Ownership
    /// - IsFullTankPolicy: Full tank policy flag (for Category 2)
    /// - AverageKmL: False = equipment (L/hr), True = vehicle (km/L)
    /// - VehicleProviderMappings: Modern GPS tracking (replaces deprecated HasGPSInstalled/DeviceId)
    /// - FuelTankCapacity: Tank size for estimates
    /// </summary>
    public class GetTankRefillsForPeriodQueryHandler
        : IRequestHandler<GetTankRefillsForPeriodQuery, FMSResponse<List<VehicleRefillSummaryDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTankRefillsForPeriodQueryHandler> _logger;

        public GetTankRefillsForPeriodQueryHandler(
            GpsdataContext context,
            ILogger<GetTankRefillsForPeriodQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleRefillSummaryDTO>>> Handle(
            GetTankRefillsForPeriodQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var req = request.Request;

                // Validate request
                if (req.TankIds == null || req.TankIds.Count == 0)
                {
                    return FMSResponse<List<VehicleRefillSummaryDTO>>.Failed("At least one tank ID is required");
                }

                if (req.StartDate > req.EndDate)
                {
                    return FMSResponse<List<VehicleRefillSummaryDTO>>.Failed("Start date must be before end date");
                }

                _logger.LogInformation(
                    "Getting tank refills for tanks {TankIds} from {StartDate} to {EndDate}, SiteIds: {SiteIds}",
                    string.Join(",", req.TankIds),
                    req.StartDate,
                    req.EndDate,
                    req.SiteIds.Count > 0 ? string.Join(",", req.SiteIds) : "All");

                // Query fuel refills from the selected tanks within the date range
                var query = _context.FuelRefills
                    .AsNoTracking()
                    .Where(r => r.TankId.HasValue && req.TankIds.Contains(r.TankId.Value))
                    .Where(r => r.Date.HasValue && r.Date.Value >= req.StartDate && r.Date.Value <= req.EndDate)
                    .Where(r => !r.IsDeleted); // Exclude soft-deleted records

                // Apply site filter if provided (for the tank location, not vehicle assignment)
                // Support both multi-site (SiteIds) filtering
                if (req.SiteIds.Count > 0)
                {
                    query = query.Where(r => req.SiteIds.Contains(r.SiteId));
                }

                // Get refills with related data
                var refills = await query
                    .Include(r => r.Vehicle)
                        .ThenInclude(v => v.VehicleType)
                    .Include(r => r.Tank)
                    .Include(r => r.Driver)
                    .Include(r => r.Site)
                    .OrderBy(r => r.VehicleId)
                    .ThenBy(r => r.Date)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("Found {Count} fuel refill records", refills.Count);

                // Get audit site IDs for classification (supports multi-site)
                var auditSiteIds = req.SiteIds.Count > 0
                    ? new HashSet<int>(req.SiteIds)
                    : new HashSet<int>();

                // Get vehicle IDs for GPS mapping lookup
                var vehicleIds = refills
                    .Select(r => r.VehicleId)
                    .Distinct()
                    .ToList();

                // Fetch active GPS provider mappings with fuel sensor info for these vehicles
                var gpsMappings = await _context.VehicleProviderMappings
                    .AsNoTracking()
                    .Where(m => m.VehicleId != null && vehicleIds.Contains(m.VehicleId.Value) && m.IsActive)
                    .Select(m => new { VehicleId = m.VehicleId!.Value, m.HasFuelSensor })
                    .ToListAsync(cancellationToken);

                var vehiclesWithGps = new HashSet<int>(gpsMappings.Select(m => m.VehicleId));
                var vehiclesWithFuelSensor = new HashSet<int>(
                    gpsMappings.Where(m => m.HasFuelSensor == true).Select(m => m.VehicleId));

                _logger.LogDebug(
                    "GPS mappings found for {GpsCount}/{Total} vehicles, {FuelSensorCount} with fuel sensors",
                    vehiclesWithGps.Count,
                    vehicleIds.Count,
                    vehiclesWithFuelSensor.Count);

                // Group by vehicle and create summaries with classification
                var vehicleSummaries = refills
                    .GroupBy(r => r.VehicleId)
                    .Select(g =>
                    {
                        var vehicleRefills = g.ToList();
                        var firstRefill = vehicleRefills.First();
                        var vehicle = firstRefill.Vehicle;
                        var driver = firstRefill.Driver;

                        // Get vehicle type info
                        var isKmL = vehicle?.AverageKmL ?? true; // Default to km/L if not set

                        // Check for GPS via modern VehicleProviderMappings or installed GPS flag
                        var vehicleId = g.Key;
                        var hasModernGps = vehiclesWithGps.Contains(vehicleId);
                        var hasGPS = hasModernGps || (vehicle?.HasGPSInstalled == 1);

                        // Check for fuel sensor (only from modern mappings)
                        var hasFuelSensor = vehiclesWithFuelSensor.Contains(vehicleId);

                        // Check IsFullTankPolicy for Category 2 classification
                        var isFullTankPolicy = vehicle?.IsFullTankPolicy ?? false;

                        // Classify vehicle into one of 5 categories
                        var (category, categoryName, dataSource, confidence) =
                            ClassifyVehicle(vehicle, auditSiteIds, isKmL, hasGPS, hasFuelSensor, isFullTankPolicy);

                        // Determine if vehicle is company-owned
                        var isCompanyVehicle = (vehicle?.IsCompanyVehicle == 1);

                        // Determine if vehicle belongs to any audit site
                        var belongsToAuditSite = vehicle?.WorkingSiteId.HasValue == true
                            && auditSiteIds.Contains(vehicle.WorkingSiteId.Value);

                        // Calculate totals
                        var totalFuel = vehicleRefills.Sum(r => r.ManualFuelrefillAmount ?? 0);
                        var totalDistanceOrHours = vehicleRefills
                            .Where(r => r.CurrentMeterReading.HasValue && r.PreviousMeterReading.HasValue)
                            .Sum(r => r.CurrentMeterReading!.Value - r.PreviousMeterReading!.Value);

                        // Calculate efficiency based on vehicle type
                        decimal? efficiency = null;
                        if (totalFuel > 0 && totalDistanceOrHours > 0)
                        {
                            if (isKmL)
                            {
                                // km/L: distance / fuel (higher is better)
                                efficiency = Math.Round(totalDistanceOrHours / totalFuel, 2);
                            }
                            else
                            {
                                // L/hr: fuel / hours (lower is better for consumption rate)
                                efficiency = Math.Round(totalFuel / totalDistanceOrHours, 2);
                            }
                        }

                        return new VehicleRefillSummaryDTO
                        {
                            VehicleId = g.Key,
                            VehicleNo = vehicle?.VehicleCode ?? vehicle?.NumberPlate ?? $"Vehicle {g.Key}",
                            DriverId = driver?.Id,
                            DriverName = driver?.FullName ?? "Unassigned",
                            VehicleTypeId = vehicle?.VehicleTypeId,
                            VehicleTypeName = vehicle?.VehicleType?.Name ?? "Unknown",
                            IsKmL = isKmL,

                            // Classification fields
                            VehicleCategory = category,
                            VehicleCategoryName = categoryName,
                            HasGPS = hasGPS,
                            HasFuelSensor = hasFuelSensor,
                            IsCompanyVehicle = isCompanyVehicle,
                            BelongsToAuditSite = belongsToAuditSite,
                            DataSourcePrimary = dataSource,
                            DataConfidence = confidence,

                            // Vehicle properties for calculations
                            IsFullTankPolicy = isFullTankPolicy,
                            FuelTankCapacity = vehicle?.FuelTankCapacity,

                            // Refill summary
                            RefillCount = vehicleRefills.Count,
                            TotalFuelAmount = totalFuel,
                            TotalDistanceOrHours = totalDistanceOrHours > 0 ? totalDistanceOrHours : null,
                            Efficiency = efficiency,
                            FirstRefillDate = vehicleRefills.Min(r => r.Date),
                            LastRefillDate = vehicleRefills.Max(r => r.Date),
                            Refills = vehicleRefills.Select(r => new TankRefillPreviewDTO
                            {
                                RefillId = r.Id,
                                VehicleId = r.VehicleId,
                                VehicleNo = r.Vehicle?.VehicleCode ?? r.Vehicle?.NumberPlate ?? $"Vehicle {r.VehicleId}",
                                TankId = r.TankId,
                                TankName = r.Tank?.Name ?? $"Tank {r.TankId}",
                                DriverId = r.DriverId,
                                DriverName = r.Driver?.FullName ?? "Unassigned",
                                RefillDate = r.Date,
                                FuelAmount = r.ManualFuelrefillAmount ?? 0,
                                PreviousMeterReading = r.PreviousMeterReading,
                                CurrentMeterReading = r.CurrentMeterReading,
                                SiteId = r.SiteId,
                                SiteName = r.Site?.Name ?? $"Site {r.SiteId}",
                                TagId = r.TagId,
                                Comment = r.Comment,
                                FuelBy = r.FuelBy
                            }).ToList()
                        };
                    })
                    // Order by category first, then by fuel amount within each category
                    .OrderBy(v => v.VehicleCategory)
                    .ThenByDescending(v => v.TotalFuelAmount)
                    .ToList();

                // Log category breakdown
                var categoryBreakdown = vehicleSummaries
                    .GroupBy(v => v.VehicleCategory)
                    .Select(g => $"Cat{g.Key}:{g.Count()}")
                    .ToList();

                _logger.LogInformation(
                    "Grouped into {VehicleCount} vehicles [{Categories}] with total {TotalFuel:N0} liters",
                    vehicleSummaries.Count,
                    string.Join(", ", categoryBreakdown),
                    vehicleSummaries.Sum(v => v.TotalFuelAmount));

                return FMSResponse<List<VehicleRefillSummaryDTO>>.Success(
                    vehicleSummaries,
                    $"Found {vehicleSummaries.Count} vehicles with {refills.Count} refill records");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank refills for period");
                return FMSResponse<List<VehicleRefillSummaryDTO>>.Failed($"Error: {ex.Message}");
            }
        }

        /// <summary>
        /// Classifies a vehicle into one of 5 categories based on:
        /// - WorkingSiteId (belongs to audit site(s) or not)
        /// - IsCompanyVehicle (company-owned or external)
        /// - HasGPS (via VehicleProviderMappings or legacy fields)
        /// - HasFuelSensor (from VehicleProviderMappings.HasFuelSensor)
        /// - IsFullTankPolicy (explicit full tank policy flag)
        /// - AverageKmL (IsKmL: true = vehicle, false = equipment with L/hr)
        ///
        /// Category Logic:
        /// 1. Site GPS Fleet with Fuel Sensor: At site + GPS + FuelSensor = use GPS_REST real-time data
        /// 2. Site Full Tank Policy: At site + (IsFullTankPolicy OR (GPS without fuel sensor)) = estimate from full tank
        /// 3. Site Equipment: At site + No GPS/Sensor + No full tank policy = track fuel issued only
        /// 4. Cross-Site Company: Company vehicle from another site = use GPS_SOAP Report 212
        /// 5. External Non-Company: Third-party/contractor = just account for fuel taken
        /// </summary>
        private static (int category, string name, string dataSource, string confidence) ClassifyVehicle(
            VehicleEntity? vehicle,
            HashSet<int> auditSiteIds,
            bool isKmL,
            bool hasGPS,
            bool hasFuelSensor,
            bool isFullTankPolicy)
        {
            if (vehicle == null)
            {
                return (5, "External Non-Company", "Unavailable", "ACCOUNTED");
            }

            // Check if vehicle belongs to any of the audit sites
            var atSite = vehicle.WorkingSiteId.HasValue && auditSiteIds.Contains(vehicle.WorkingSiteId.Value);
            var isCompany = (vehicle.IsCompanyVehicle == 1);

            // Category 1: Site GPS Fleet with Fuel Sensor
            // Vehicle belongs to audit site AND has GPS AND has fuel sensor
            if (atSite && hasGPS && hasFuelSensor)
            {
                return (1, "Site GPS Fleet", "GPS_REST", "HIGH");
            }

            // Category 2: Site Full Tank Policy
            // Vehicle belongs to audit site AND either:
            // - Explicitly follows full tank policy
            // - Has GPS but no fuel sensor (use full tank estimation instead)
            if (atSite && (isFullTankPolicy || (hasGPS && !hasFuelSensor)))
            {
                var source = isFullTankPolicy ? "FullTank" : "FullTank_GPS";
                return (2, "Site Full Tank (No Sensor)", source, "MEDIUM");
            }

            // Category 3: Site Equipment (No GPS/Sensor, No Full Tank)
            // Vehicle belongs to audit site, no GPS or no fuel sensor, no full tank policy
            if (atSite && !isFullTankPolicy)
            {
                return (3, "Site Equipment", "FuelRefill", "LOW");
            }

            // Category 4: Cross-Site Company Vehicle
            // Vehicle is company-owned but belongs to different site (or no site assigned)
            if (!atSite && isCompany)
            {
                // Cross-site company vehicles may have GPS, use SOAP Report 212
                var source = (hasGPS && hasFuelSensor) ? "GPS_SOAP" : "FuelRefill";
                return (4, "Cross-Site Company", source, "HIGH");
            }

            // Category 5: External Non-Company
            // Not company-owned, external contractor/third-party
            return (5, "External Non-Company", "FuelRefill", "ACCOUNTED");
        }
    }
}
