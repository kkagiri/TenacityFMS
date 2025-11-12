using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.FMS.TankVolumeHistory;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankVolumeHistory.Queries
{
    public record GetTankVolumeHistoryFilteredQuery : IRequest<FMSResponse<List<TankVolumeHistoryDTO>>>
    {
        public int? SiteId { get; init; }
        public int? TankId { get; init; }
        public string? RecordedBy { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public int? Take { get; init; } = 100; // Default limit
        public bool? IncludeVehicleNames { get; init; } = true;
        public bool? UseManualDispensing { get; init; } = false; // Use TankStock manual dispensing instead of sensor dispensing
    }

    public class GetTankVolumeHistoryFilteredQueryHandler : IRequestHandler<GetTankVolumeHistoryFilteredQuery, FMSResponse<List<TankVolumeHistoryDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTankVolumeHistoryFilteredQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetTankVolumeHistoryFilteredQueryHandler(
            GpsdataContext context,
            ILogger<GetTankVolumeHistoryFilteredQueryHandler> logger,
            IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponse<List<TankVolumeHistoryDTO>>> Handle(GetTankVolumeHistoryFilteredQuery request, CancellationToken cancellationToken)
        {
            try
            {
                // Set default date range if not provided (last 1 day)
                var endDate = request.EndDate ?? DateTime.UtcNow;
                var startDate = request.StartDate ?? endDate.AddDays(-1);

                List<TankVolumeHistoryDTO> result;

                if (request.UseManualDispensing == true)
                {
                    // Use manual dispensing from TankStock instead of sensor dispensing
                    result = await GetTankVolumeHistoryWithManualDispensingAsync(
                        startDate, endDate, request.SiteId, request.TankId, request.RecordedBy,
                        request.IncludeVehicleNames, cancellationToken);
                }
                else
                {
                    // Use sensor dispensing from TankVolumeHistory (default behavior)
                    result = await GetTankVolumeHistoryWithSensorDispensingAsync(
                        startDate, endDate, request.SiteId, request.TankId, request.RecordedBy,
                        request.IncludeVehicleNames, cancellationToken);
                }

                _logger.LogInformation("Retrieved {Count} tank volume history records with filters: SiteId={SiteId}, TankId={TankId}, StartDate={StartDate}, EndDate={EndDate}, UseManualDispensing={UseManualDispensing}",
                    result.Count, request.SiteId, request.TankId, startDate, endDate, request.UseManualDispensing);

                return FMSResponse<List<TankVolumeHistoryDTO>>.Success(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting filtered tank volume history list");
                return FMSResponse<List<TankVolumeHistoryDTO>>.Failed("Failed to retrieve tank volume history");
            }
        }

        /// <summary>
        /// Get tank volume history with sensor-based dispensing (default behavior)
        /// </summary>
        private async Task<List<TankVolumeHistoryDTO>> GetTankVolumeHistoryWithSensorDispensingAsync(
            DateTime startDate, DateTime endDate, int? siteId, int? tankId, string? recordedBy,
            bool? includeVehicleNames, CancellationToken cancellationToken)
        {

            // Build the query with filters
            var query = _context.TankVolumeHistories
                .Include(tvh => tvh.Tank)
                .ThenInclude(t => t.Site)
                .Include(tvh => tvh.RecordedByNavigation)
                .Where(tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate);

            // Apply site filter
            if (siteId.HasValue && siteId.Value > 0)
            {
                query = query.Where(tvh => tvh.Tank.SiteId == siteId.Value);
            }

            // Apply tank filter
            if (tankId.HasValue && tankId.Value > 0)
            {
                query = query.Where(tvh => tvh.TankId == tankId.Value);
            }

            // Apply recorded by filter
            if (!string.IsNullOrEmpty(recordedBy))
            {
                query = query.Where(tvh => tvh.RecordedBy == recordedBy);
            }

            // Order by timestamp descending
            query = query.OrderByDescending(tvh => tvh.Timestamp);

            // Execute the main query
            var tankVolumeHistories = await query.ToListAsync(cancellationToken);

            return await MapTankVolumeHistoryToDTO(tankVolumeHistories, includeVehicleNames, cancellationToken);
        }

        /// <summary>
        /// Get tank volume history with manual dispensing from TankStock
        /// Excludes sensor dispensing and includes manual dispensing aggregates
        /// </summary>
        private async Task<List<TankVolumeHistoryDTO>> GetTankVolumeHistoryWithManualDispensingAsync(
            DateTime startDate, DateTime endDate, int? siteId, int? tankId, string? recordedBy,
            bool? includeVehicleNames, CancellationToken cancellationToken)
        {

            // Get all NON-DISPENSING transactions from TankVolumeHistory
            var volumeHistoryQuery = _context.TankVolumeHistories
                .Include(tvh => tvh.Tank)
                .ThenInclude(t => t.Site)
                .Include(tvh => tvh.RecordedByNavigation)
                .Where(tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate)
                .Where(tvh => tvh.ChangeReason != VolumeChangeReasonEnum.Dispensing
                            && tvh.ChangeReason != VolumeChangeReasonEnum.AutomatedDispensing);

            // Apply site filter
            if (siteId.HasValue && siteId.Value > 0)
            {
                volumeHistoryQuery = volumeHistoryQuery.Where(tvh => tvh.Tank.SiteId == siteId.Value);
            }

            // Apply tank filter
            if (tankId.HasValue && tankId.Value > 0)
            {
                volumeHistoryQuery = volumeHistoryQuery.Where(tvh => tvh.TankId == tankId.Value);
            }

            // Apply recorded by filter
            if (!string.IsNullOrEmpty(recordedBy))
            {
                volumeHistoryQuery = volumeHistoryQuery.Where(tvh => tvh.RecordedBy == recordedBy);
            }

            var volumeHistoryData = await volumeHistoryQuery.ToListAsync(cancellationToken);

            // Get MANUAL DISPENSING from TankStock
            var tankStockQuery = _context.Tankstocks
                .Include(ts => ts.Tank)
                .ThenInclude(t => t.Site)
                .Where(ts => ts.EntryDate >= startDate && ts.EntryDate <= endDate)
                .Where(ts => ts.EntryType == VolumeChangeReasonEnum.Dispensing);

            // Apply site filter to TankStock
            if (siteId.HasValue && siteId.Value > 0)
            {
                tankStockQuery = tankStockQuery.Where(ts => ts.Tank.SiteId == siteId.Value);
            }

            // Apply tank filter to TankStock
            if (tankId.HasValue && tankId.Value > 0)
            {
                tankStockQuery = tankStockQuery.Where(ts => ts.TankId == tankId.Value);
            }

            // Apply recorded by filter to TankStock
            if (!string.IsNullOrEmpty(recordedBy))
            {
                tankStockQuery = tankStockQuery.Where(ts => ts.RecordedBy == recordedBy);
            }

            var tankStockData = await tankStockQuery.ToListAsync(cancellationToken);

            // Combine both data sources
            var result = new List<TankVolumeHistoryDTO>();

            // Map TankVolumeHistory (non-dispensing) records
            var mappedVolumeHistory = await MapTankVolumeHistoryToDTO(volumeHistoryData, includeVehicleNames, cancellationToken);
            result.AddRange(mappedVolumeHistory);

            // Map TankStock (manual dispensing) records
            foreach (var tankStock in tankStockData)
            {
                var dto = new TankVolumeHistoryDTO
                {
                    Id = tankStock.EntryId, // Use TankStock ID
                    TankId = tankStock.TankId,
                    Site = tankStock.Tank?.Site?.Name ?? "Unknown",
                    SiteId = tankStock.Tank?.SiteId,
                    Timestamp = tankStock.EntryDate,
                    VolumeChange = tankStock.ManualAmount ?? 0, // Use ManualAmount for manual dispensing
                    NewVolume = null, // TankStock doesn't track NewVolume for dispensing
                    ChangeReason = VolumeChangeReasonEnum.Dispensing,
                    ReferenceId = null,
                    RecordedBy = tankStock.RecordedBy ?? "Unknown",
                    RecordedByUserName = tankStock.RecordedBy ?? "Unknown",
                    VehicleName = "Manual Entry" // TankStock doesn't link to vehicles
                };

                result.Add(dto);
            }

            // Sort by timestamp descending
            result = result.OrderByDescending(r => r.Timestamp).ToList();

            _logger.LogInformation("Retrieved {VolumeHistoryCount} non-dispensing + {TankStockCount} manual dispensing = {TotalCount} total records",
                volumeHistoryData.Count, tankStockData.Count, result.Count);

            return result;
        }

        /// <summary>
        /// Helper method to map TankVolumeHistory entities to DTOs with vehicle name lookup
        /// </summary>
        private async Task<List<TankVolumeHistoryDTO>> MapTankVolumeHistoryToDTO(
            List<Domain.Entities.Features.TankStockManagement.TankVolumeHistory> tankVolumeHistories,
            bool? includeVehicleNames,
            CancellationToken cancellationToken)
        {

            // Get all dispensing transaction IDs for bulk vehicle name lookup
            var dispensingTransactionIds = new List<int>();
            if (includeVehicleNames == true)
            {
                dispensingTransactionIds = tankVolumeHistories
                    .Where(h => h.ChangeReason == VolumeChangeReasonEnum.Dispensing && h.ReferenceId.HasValue)
                    .Select(h => h.ReferenceId.Value)
                    .ToList();
            }

            // Bulk load vehicle names for dispensing transactions to avoid N+1 queries
            var vehicleNameLookup = new Dictionary<int, string>();
            if (dispensingTransactionIds.Any())
            {
                var fuelRefillsWithVehicles = await _context.FuelRefills
                    .Where(fr => dispensingTransactionIds.Contains(fr.Id))
                    .Include(fr => fr.Vehicle)
                    .Select(fr => new { fr.Id, VehicleName = fr.Vehicle != null ? fr.Vehicle.HyoungNo : "N/A" })
                    .ToListAsync(cancellationToken);

                vehicleNameLookup = fuelRefillsWithVehicles.ToDictionary(
                    fr => fr.Id,
                    fr => fr.VehicleName ?? "N/A"
                );
            }

            var result = new List<TankVolumeHistoryDTO>();

            foreach (var history in tankVolumeHistories)
            {
                var dto = _mapper.Map<TankVolumeHistoryDTO>(history);

                // Set site information
                dto.Site = history.Tank?.Site?.Name ?? "Unknown";
                dto.SiteId = history.Tank?.SiteId;

                // Set recorded by user name
                dto.RecordedByUserName = history.RecordedByNavigation?.UserName ?? "Unknown";

                // Handle vehicle names for dispensing transactions using lookup
                if (includeVehicleNames == true &&
                    history.ChangeReason == VolumeChangeReasonEnum.Dispensing &&
                    history.ReferenceId.HasValue &&
                    vehicleNameLookup.TryGetValue(history.ReferenceId.Value, out string? vehicleName))
                {
                    dto.VehicleName = vehicleName;
                }
                else
                {
                    dto.VehicleName = "N/A";
                }

                result.Add(dto);
            }

            return result;
        }
    }
}