using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.ATG;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.LocationValidation;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.TankManagement.PumpTransaction
{
    /// <summary>
    /// Represents a meter reading from either FuelRefill or PumpTransaction table
    /// Used to build a unified chronological history for consumption calculations
    /// </summary>
    /// <param name="VehicleId">Vehicle ID</param>
    /// <param name="Date">Date/time of the reading</param>
    /// <param name="MeterReading">Odometer or engine hours reading</param>
    /// <param name="Id">Record ID from source table</param>
    /// <param name="Source">Source table: "FuelRefill" or "PumpTransaction"</param>
    public record MeterReadingRecord(int VehicleId, DateTime? Date, decimal? MeterReading, int Id, string Source);

    public class GetPumpTransactionQuery : IRequest<FMSResponse<IEnumerable<PumpTransactionDto>>>
    {
        public List<int>? TankIds { get; set; }
        public List<int>? VehicleIds { get; set; }
        public List<string>? PtsIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? ProcessedOnly { get; set; }
        public List<int>? SiteIds { get; set; }
        /// <summary>
        /// If true, includes tank-to-tank transfer transactions. Defaults to false (excludes transfers).
        /// </summary>
        public bool IncludeTransfers { get; set; } = false;
    }

    public class GetPumpTransactionQueryHandler : IRequestHandler<GetPumpTransactionQuery, FMSResponse<IEnumerable<PumpTransactionDto>>>
    {
        private readonly GpsdataContext _context;

        public GetPumpTransactionQueryHandler(GpsdataContext context)
        {
            _context = context;
        }

        public async Task<FMSResponse<IEnumerable<PumpTransactionDto>>> Handle(GetPumpTransactionQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Validate request
                List<string> validationErrors = ValidateRequest(request);
                if (validationErrors.Any())
                {
                    return FMSResponse<IEnumerable<PumpTransactionDto>>.ValidationFailed(validationErrors);
                }

                IQueryable<Pumptransaction> query = _context.Pumptransactions.AsNoTracking();

                // Exclude transfer transactions by default (only include vehicle fueling)
                if (!request.IncludeTransfers)
                {
                    query = query.Where(pt => pt.IsTransferMode != true);
                }

                // Apply filters with array support
                if (request.TankIds != null && request.TankIds.Any())
                {
                    query = query.Where(pt => request.TankIds.Contains(pt.TankId ?? 0));
                }

                if (request.VehicleIds != null && request.VehicleIds.Any())
                {
                    query = query.Where(pt => request.VehicleIds.Contains(pt.VehicleId ?? 0));
                }

                if (request.PtsIds != null && request.PtsIds.Any())
                {
                    query = query.Where(pt => request.PtsIds.Contains(pt.PtsId));
                }

                if (request.StartDate.HasValue)
                {
                    query = query.Where(pt => pt.DateTime >= request.StartDate.Value);
                }

                if (request.EndDate.HasValue)
                {
                    query = query.Where(pt => pt.DateTime <= request.EndDate.Value);
                }

                if (request.ProcessedOnly.HasValue)
                {
                    query = query.Where(pt => pt.HasBeenProcessed == request.ProcessedOnly.Value);
                }

                // Join with related entities to get site and consumption data
                // Site comes from Tank (primary) or PTS device (fallback)
                // First, get the pump transactions with their basic includes
                var pumpTransactions = await query
                    .Include(pt => pt.Pts)
                        .ThenInclude(pts => pts.SiteNavigation)  // PTS device's assigned site (fallback)
                    .Include(pt => pt.Tank)
                        .ThenInclude(t => t.Site)  // Tank's site (primary - every fueling is from a tank)
                    .Include(pt => pt.Vehicle)
                    .Include(pt => pt.DestinationTank)  // Destination tank for tank-to-tank transfers
                    .Include(pt => pt.Employee)  // Employee/Driver who performed the fueling
                    .OrderByDescending(pt => pt.DateTime)
                    .ToListAsync(cancellationToken);

                // Filter by SiteIds if provided - check Tank.Site (primary) or PTS.Site (fallback)
                if (request.SiteIds != null && request.SiteIds.Any())
                {
                    pumpTransactions = pumpTransactions.Where(pt =>
                        (pt.Tank != null && request.SiteIds.Contains(pt.Tank.SiteId)) ||
                        (pt.Pts?.Site != null && request.SiteIds.Contains(pt.Pts.Site.Value))
                    ).ToList();
                }

                // Get all pump transaction IDs to fetch related fuel refills
                var pumpTransactionIds = pumpTransactions.Select(pt => pt.Id).ToList();

                // Fetch fuel refills separately to avoid complex query translation issues
                var fuelRefills = await _context.FuelRefills
                    .Where(fr => pumpTransactionIds.Contains(fr.PumpTranscationId ?? 0) && !fr.IsDeleted)
                    .Include(fr => fr.FuelByNavigation)
                    .Include(fr => fr.Driver)
                    .ToListAsync(cancellationToken);

                // Create a lookup dictionary for faster access
                var fuelRefillLookup = fuelRefills
                    .GroupBy(fr => fr.PumpTranscationId ?? 0)
                    .ToDictionary(g => g.Key, g => g.FirstOrDefault());

                // Fetch user lookup for resolving UserId (GUID string) to UserName
                var userIds = pumpTransactions
                    .Where(pt => !string.IsNullOrEmpty(pt.UserId))
                    .Select(pt => pt.UserId!)
                    .Distinct()
                    .ToList();

                var userLookup = await _context.Users
                    .Where(u => userIds.Contains(u.Id))
                    .ToDictionaryAsync(u => u.Id, u => u.UserName, cancellationToken);

                // Fetch fueling location logs (mobile app location) by PTS transaction ID
                var transactionNumbers = pumpTransactions
                    .Where(pt => pt.Transaction.HasValue && pt.Transaction.Value > 0)
                    .Select(pt => pt.Transaction!.Value)
                    .Distinct()
                    .ToList();

                Dictionary<int, LocationValidationLog> locationLogLookup = new();
                if (transactionNumbers.Any())
                {
                    var locationLogs = await _context.LocationValidationLogs
                        .Where(log => log.TransactionId.HasValue && transactionNumbers.Contains(log.TransactionId.Value))
                        .OrderByDescending(log => log.ValidationTime)
                        .ToListAsync(cancellationToken);

                    locationLogLookup = locationLogs
                        .GroupBy(log => log.TransactionId!.Value)
                        .ToDictionary(g => g.Key, g => g.OrderByDescending(x => x.ValidationTime).First());
                }

                // Build a unified lookup for previous meter readings from BOTH tables:
                // 1. FuelRefill.CurrentMeterReading (manual entries)
                // 2. Pumptransaction.Odometer (PTS fueling)
                // We need to combine them chronologically and find the previous reading
                var vehicleIds = pumpTransactions
                    .Where(pt => pt.VehicleId.HasValue && pt.VehicleId.Value > 0)
                    .Select(pt => pt.VehicleId!.Value)
                    .Distinct()
                    .ToList();

                // Get all fuel refills for these vehicles (manual entries with CurrentMeterReading)
                var allVehicleFuelRefills = vehicleIds.Any()
                    ? await _context.FuelRefills
                        .Where(fr => fr.VehicleId > 0 && vehicleIds.Contains(fr.VehicleId) && !fr.IsDeleted && fr.CurrentMeterReading.HasValue)
                        .Select(fr => new { fr.VehicleId, Date = fr.Date, MeterReading = fr.CurrentMeterReading, fr.Id, Source = "FuelRefill" })
                        .ToListAsync(cancellationToken)
                    : [];

                // Get all pump transactions with Odometer for these vehicles (PTS fueling)
                var allVehiclePumpTransactions = vehicleIds.Any()
                    ? await _context.Pumptransactions
                        .Where(pt => pt.VehicleId.HasValue && pt.VehicleId.Value > 0 && vehicleIds.Contains(pt.VehicleId.Value) && pt.Odometer.HasValue)
                        .Select(pt => new { VehicleId = pt.VehicleId!.Value, Date = (DateTime?)pt.DateTime, MeterReading = pt.Odometer, pt.Id, Source = "PumpTransaction" })
                        .ToListAsync(cancellationToken)
                    : [];

                // Combine both sources into a unified history, ordered chronologically (descending)
                // Readings should be in ascending order (odometer/hours only go up)
                var vehicleMeterHistory = allVehicleFuelRefills
                    .Select(fr => new MeterReadingRecord(fr.VehicleId, fr.Date, fr.MeterReading, fr.Id, fr.Source))
                    .Concat(allVehiclePumpTransactions.Select(pt => new MeterReadingRecord(pt.VehicleId, pt.Date, pt.MeterReading, pt.Id, pt.Source)))
                    .GroupBy(r => r.VehicleId)
                    .ToDictionary(
                        g => g.Key,
                        g => g.OrderByDescending(x => x.Date).ThenByDescending(x => x.Id).ToList()
                    );

                // Map to DTOs
                var dtos = pumpTransactions.Select(pt =>
                {
                    // Get the fuel refill for this pump transaction
                    fuelRefillLookup.TryGetValue(pt.Id, out var fr);

                    // Resolve username from UserId
                    string? userName = null;
                    if (!string.IsNullOrEmpty(pt.UserId) && userLookup.TryGetValue(pt.UserId, out var resolvedUserName))
                    {
                        userName = resolvedUserName;
                    }

                    // Resolve fueling location (mobile app) from LocationValidationLog if available
                    LocationValidationLog? locationLog = null;
                    if (pt.Transaction.HasValue && pt.Transaction.Value > 0)
                    {
                        locationLogLookup.TryGetValue(pt.Transaction.Value, out locationLog);
                    }

                    var fuelingLatitude = locationLog?.MobileLatitude;
                    var fuelingLongitude = locationLog?.MobileLongitude;
                    var fuelingAccuracy = locationLog?.MobileAccuracy;
                    var fuelingLocationSource = fuelingLatitude.HasValue && fuelingLongitude.HasValue
                        ? "MobileApp"
                        : null;

                    // Calculate previous odometer and consumption
                    // Priority: 1) FuelRefill.PreviousMeterReading (if explicitly set)
                    //           2) Previous reading from combined history (FuelRefill + PumpTransaction)
                    var currentOdometer = fr?.CurrentMeterReading ?? pt.Odometer;
                    decimal? previousOdometer = fr?.PreviousMeterReading;
                    string? previousOdometerSource = null;

                    if (previousOdometer.HasValue)
                    {
                        previousOdometerSource = "FuelRefill.PreviousMeterReading";
                    }

                    // If no PreviousMeterReading in FuelRefill, look up from combined vehicle meter history
                    if (!previousOdometer.HasValue && pt.VehicleId.HasValue && pt.VehicleId.Value > 0)
                    {
                        if (vehicleMeterHistory.TryGetValue(pt.VehicleId.Value, out var vehicleHistory))
                        {
                            // Find the most recent reading BEFORE this transaction's date
                            // Exclude the current transaction itself (by ID if source is PumpTransaction)
                            var previousReading = vehicleHistory
                                .Where(r => r.Date < pt.DateTime ||
                                           (r.Date == pt.DateTime && r.Source == "PumpTransaction" && r.Id != pt.Id))
                                .Where(r => r.MeterReading.HasValue && r.MeterReading.Value > 0)
                                .FirstOrDefault();

                            if (previousReading?.MeterReading != null)
                            {
                                previousOdometer = previousReading.MeterReading.Value;
                                previousOdometerSource = previousReading.Source;
                            }
                        }
                    }

                    return new PumpTransactionDto
                    {
                        PtsId = pt.PtsId,
                        PtsName = pt.Pts?.PtsName,
                        PacketId = pt.PacketId,
                        DateTimeStart = pt.DateTimeStart ?? DateTime.MinValue,
                        DateTime = pt.DateTime,
                        Pump = pt.Pump ?? 0,
                        Nozzle = pt.Nozzle ?? 0,
                        FuelGradeId = pt.FuelGradeId,
                        FuelGradeName = pt.FuelGradeName,
                        Transaction = pt.Transaction ?? 0,
                        Volume = pt.Volume ?? 0,
                        TCVolume = pt.Tcvolume,
                        Price = pt.Price,
                        Amount = pt.Amount ?? 0,
                        TotalVolume = pt.TotalVolume,
                        TotalAmount = pt.TotalAmount,
                        Tag = pt.Tag,
                        UserId = pt.UserId,
                        UserName = userName, // Resolved from User table lookup
                        ConfigurationId = pt.ConfigurationId,
                        TankId = pt.TankId,
                        TankName = pt.Tank?.Name,
                        VehicleId = pt.VehicleId,
                        VehicleName = pt.Vehicle?.HyoungNo,
                        VehicleNumberPlate = pt.Vehicle?.NumberPlate,
                        DestinationTankId = pt.DestinationTankId, // Destination tank for tank-to-tank transfers
                        DestinationTankName = pt.DestinationTank?.Name, // Destination tank name
                        IsTransferMode = pt.IsTransferMode, // Flag for tank transfer vs vehicle fueling
                        Odometer = currentOdometer,
                        HasBeenProcessed = pt.HasBeenProcessed,

                        // Site info from Tank (primary) or PTS device (fallback)
                        SiteId = pt.Tank?.SiteId ?? pt.Pts?.Site,
                        SiteName = pt.Tank?.Site?.Name ?? pt.Pts?.SiteNavigation?.Name,
                        // Site coordinates from Tank's GPS location (tank is the primary location for fueling)
                        SiteLatitude = pt.Tank?.Latitude,
                        SiteLongitude = pt.Tank?.Longitude,
                        FuelingLatitude = fuelingLatitude,
                        FuelingLongitude = fuelingLongitude,
                        FuelingLocationAccuracy = fuelingAccuracy,
                        FuelingLocationSource = fuelingLocationSource,
                        FueledBy = fr?.FuelBy,
                        FueledByUserName = fr?.FuelByNavigation?.UserName,
                        // Odometer data - from FuelRefill.PreviousMeterReading or historical lookup (FuelRefill/PumpTransaction)
                        PreviousOdometer = previousOdometer,
                        PreviousOdometerSource = previousOdometerSource,
                        ConsumptionSinceLastRefuel = CalculateDistanceOrHours(currentOdometer, previousOdometer),
                        // Vehicle measurement type: true = km/L (distance), false = L/hr (engine hours)
                        IsKmPerLiter = pt.Vehicle?.AverageKmL ?? true,
                        // Fuel efficiency: km/L (distance/volume) or L/hr (volume/hours)
                        FuelEfficiency = CalculateFuelEfficiency(
                            currentOdometer, previousOdometer, pt.Volume ?? 0, pt.Vehicle?.AverageKmL ?? true),
                        DriverName = pt.Employee?.FullName ?? fr?.Driver?.FullName, // Prefer Employee from pump transaction
                        EmployeeId = pt.EmployeeId,
                        EmployeeName = pt.Employee?.FullName,
                        FuelRefillId = fr?.Id,

                        // Fuel level data - placeholder, will be populated from GPS data if available
                        FuelLevelBefore = null,
                        FuelLevelAfter = null
                    };
                }).ToList();

                return FMSResponse<IEnumerable<PumpTransactionDto>>.Success(dtos, $"Retrieved {dtos.Count} pump transactions successfully");
            }
            catch (Exception ex)
            {
                return FMSResponse<IEnumerable<PumpTransactionDto>>.SystemError($"Error retrieving pump transactions: {ex.Message}");
            }
        }

        /// <summary>
        /// Calculate distance (km) or engine hours since last refuel
        /// </summary>
        private static decimal? CalculateDistanceOrHours(decimal? currentOdometer, decimal? previousOdometer)
        {
            if (!currentOdometer.HasValue || !previousOdometer.HasValue)
            {
                return null;
            }
            var difference = currentOdometer.Value - previousOdometer.Value;
            return difference > 0 ? difference : null;
        }

        /// <summary>
        /// Calculate fuel efficiency based on vehicle type:
        /// - For km/L vehicles: Distance / Volume = km/L (fuel efficiency)
        /// - For L/hr vehicles: Volume / Hours = L/hr (consumption rate)
        /// </summary>
        private static decimal? CalculateFuelEfficiency(
            decimal? currentOdometer, decimal? previousOdometer, decimal volume, bool isKmPerLiter)
        {
            if (!currentOdometer.HasValue || !previousOdometer.HasValue || volume <= 0)
            {
                return null;
            }

            var difference = currentOdometer.Value - previousOdometer.Value;
            if (difference <= 0)
            {
                return null;
            }

            if (isKmPerLiter)
            {
                // km/L = Distance / Volume
                return Math.Round(difference / volume, 2);
            }
            else
            {
                // L/hr = Volume / Hours
                return Math.Round(volume / difference, 2);
            }
        }

        private List<string> ValidateRequest(GetPumpTransactionQuery request)
        {
            List<string> errors = new List<string>();

            // Validate date range
            if (request.StartDate.HasValue && request.EndDate.HasValue && request.StartDate > request.EndDate)
            {
                errors.Add("Start date cannot be greater than end date");
            }

            // Validate PtsIds format if provided
            if (request.PtsIds != null && request.PtsIds.Any(id => !string.IsNullOrEmpty(id) && id.Length > 100))
            {
                errors.Add("PTS ID cannot exceed 100 characters");
            }

            // Validate that at least one filter is provided to prevent returning all records
            if ((request.TankIds == null || !request.TankIds.Any()) &&
                (request.VehicleIds == null || !request.VehicleIds.Any()) &&
                (request.PtsIds == null || !request.PtsIds.Any()) &&
                !request.StartDate.HasValue &&
                !request.EndDate.HasValue &&
                (request.SiteIds == null || !request.SiteIds.Any()))
            {
                errors.Add("At least one filter parameter must be provided");
            }

            return errors;
        }
    }
}