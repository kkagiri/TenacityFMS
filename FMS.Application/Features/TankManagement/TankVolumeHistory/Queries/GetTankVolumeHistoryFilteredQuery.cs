using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.TankVolumeHistory;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Queries {
    public record GetTankVolumeHistoryFilteredQuery : IRequest<FMSResponse<List<TankVolumeHistoryDTO>>> {
        public int? SiteId { get; init; }
        public int? TankId { get; init; }
        public string? RecordedBy { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public int? Take { get; init; } = 100; // Default limit
        public bool? IncludeVehicleNames { get; init; } = true;
    }

    public class GetTankVolumeHistoryFilteredQueryHandler : IRequestHandler<GetTankVolumeHistoryFilteredQuery, FMSResponse<List<TankVolumeHistoryDTO>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTankVolumeHistoryFilteredQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetTankVolumeHistoryFilteredQueryHandler (
            GpsdataContext context,
            ILogger<GetTankVolumeHistoryFilteredQueryHandler> logger,
            IMapper mapper) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponse<List<TankVolumeHistoryDTO>>> Handle (GetTankVolumeHistoryFilteredQuery request, CancellationToken cancellationToken) {
            try {
                // Set default date range if not provided (last 1 day)
                var endDate = request.EndDate ?? DateTime.UtcNow;
                var startDate = request.StartDate ?? endDate.AddDays (-1);

                // Build the query with filters
                var query = _context.TankVolumeHistories
                    .Include (tvh => tvh.Tank)
                    .ThenInclude (t => t.Site)
                    .Include (tvh => tvh.RecordedByNavigation)
                    .Where (tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate);

                // Apply site filter
                if (request.SiteId.HasValue && request.SiteId.Value > 0) {
                    query = query.Where (tvh => tvh.Tank.SiteId == request.SiteId.Value);
                }

                // Apply tank filter
                if (request.TankId.HasValue && request.TankId.Value > 0) {
                    query = query.Where (tvh => tvh.TankId == request.TankId.Value);
                }

                // Apply recorded by filter
                if (!string.IsNullOrEmpty (request.RecordedBy)) {
                    query = query.Where (tvh => tvh.RecordedBy == request.RecordedBy);
                }

                // Order by timestamp descending
                query = query.OrderByDescending (tvh => tvh.Timestamp);

                // Execute the main query
                var tankVolumeHistories = await query.ToListAsync (cancellationToken);

                // Get all dispensing transaction IDs for bulk vehicle name lookup
                var dispensingTransactionIds = new List<int> ();
                if (request.IncludeVehicleNames == true) {
                    dispensingTransactionIds = tankVolumeHistories
                        .Where (h => h.ChangeReason == VolumeChangeReasonEnum.Dispensing && h.ReferenceId.HasValue)
                        .Select (h => h.ReferenceId.Value)
                        .ToList ();
                }

                // Bulk load vehicle names for dispensing transactions to avoid N+1 queries
                var vehicleNameLookup = new Dictionary<int, string> ();
                if (dispensingTransactionIds.Any ()) {
                    var fuelRefillsWithVehicles = await _context.FuelRefills
                        .Where (fr => dispensingTransactionIds.Contains (fr.Id))
                        .Include (fr => fr.Vehicle)
                        .Select (fr => new { fr.Id, VehicleName = fr.Vehicle != null ? fr.Vehicle.HyoungNo : "N/A" })
                        .ToListAsync (cancellationToken);

                    vehicleNameLookup = fuelRefillsWithVehicles.ToDictionary (
                        fr => fr.Id,
                        fr => fr.VehicleName ?? "N/A"
                    );
                }

                var result = new List<TankVolumeHistoryDTO> ();

                foreach (var history in tankVolumeHistories) {
                    var dto = _mapper.Map<TankVolumeHistoryDTO> (history);

                    // Set site information
                    dto.Site = history.Tank?.Site?.Name ?? "Unknown";
                    dto.SiteId = history.Tank?.SiteId;

                    // Set recorded by user name
                    dto.RecordedByUserName = history.RecordedByNavigation?.UserName ?? "Unknown";

                    // Handle vehicle names for dispensing transactions using lookup
                    if (request.IncludeVehicleNames == true &&
                        history.ChangeReason == VolumeChangeReasonEnum.Dispensing &&
                        history.ReferenceId.HasValue &&
                        vehicleNameLookup.TryGetValue (history.ReferenceId.Value, out string? vehicleName)) {
                        dto.VehicleName = vehicleName;
                    } else {
                        dto.VehicleName = "N/A";
                    }

                    result.Add (dto);
                }

                _logger.LogInformation ("Retrieved {Count} tank volume history records with filters: SiteId={SiteId}, TankId={TankId}, StartDate={StartDate}, EndDate={EndDate}",
                    result.Count, request.SiteId, request.TankId, startDate, endDate);

                return FMSResponse<List<TankVolumeHistoryDTO>>.Success (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting filtered tank volume history list");
                return FMSResponse<List<TankVolumeHistoryDTO>>.Failed ("Failed to retrieve tank volume history");
            }
        }
    }
}