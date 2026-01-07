using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.ATG;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.TankManagement.PumpTransaction
{
    public class GetPumpTransactionQuery : IRequest<FMSResponse<IEnumerable<PumpTransactionDto>>>
    {
        public List<int>? TankIds { get; set; }
        public List<int>? VehicleIds { get; set; }
        public List<string>? PtsIds { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? ProcessedOnly { get; set; }
        public List<int>? SiteIds { get; set; }
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
                        Odometer = fr?.CurrentMeterReading ?? pt.Odometer,
                        HasBeenProcessed = pt.HasBeenProcessed,

                        // Site info from Tank (primary) or PTS device (fallback)
                        SiteId = pt.Tank?.SiteId ?? pt.Pts?.Site,
                        SiteName = pt.Tank?.Site?.Name ?? pt.Pts?.SiteNavigation?.Name,
                        FueledBy = fr?.FuelBy,
                        FueledByUserName = fr?.FuelByNavigation?.UserName,
                        PreviousOdometer = fr?.PreviousMeterReading,
                        ConsumptionSinceLastRefuel = CalculateConsumption(fr?.CurrentMeterReading, fr?.PreviousMeterReading),
                        DriverName = fr?.Driver?.FullName,
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

        private static decimal? CalculateConsumption(decimal? currentOdometer, decimal? previousOdometer)
        {
            if (!currentOdometer.HasValue || !previousOdometer.HasValue)
            {
                return null;
            }
            var consumption = currentOdometer.Value - previousOdometer.Value;
            return consumption > 0 ? consumption : null;
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