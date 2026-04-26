/**
 * File: GetTankVolumeHistoryFilteredQuery.cs
 * Purpose: Retrieves filtered tank volume history rows with optional vehicle/GPS enrichment.
 * Dependencies: EF Core, AutoMapper, MediatR, TankVolumeHistoryDTO
 * Last Modified: 2026-02-09
 *
 * Key Behaviors:
 * - Supports sensor mode and manual-dispensing mode.
 * - Enriches DTOs with site, tank, transfer, and transaction display fields.
 */
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
        public bool? IncludeGpsData { get; init; } = false; // Include GPS refill volume from GPSGate report entries
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
                var requestedEndDate = request.EndDate ?? DateTime.UtcNow;
                var endDate = requestedEndDate.TimeOfDay == TimeSpan.Zero
                    ? requestedEndDate.Date.AddDays(1).AddTicks(-1)
                    : requestedEndDate;
                var startDate = request.StartDate ?? endDate.AddDays(-1);

                List<TankVolumeHistoryDTO> result;

                if (request.UseManualDispensing == true)
                {
                    // Use manual dispensing from TankStock instead of sensor dispensing
                    result = await GetTankVolumeHistoryWithManualDispensingAsync(
                        startDate, endDate, request.SiteId, request.TankId, request.RecordedBy,
                        request.IncludeVehicleNames, request.IncludeGpsData, cancellationToken);
                }
                else
                {
                    // Use sensor dispensing from TankVolumeHistory (default behavior)
                    result = await GetTankVolumeHistoryWithSensorDispensingAsync(
                        startDate, endDate, request.SiteId, request.TankId, request.RecordedBy,
                        request.IncludeVehicleNames, request.IncludeGpsData, cancellationToken);
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
            bool? includeVehicleNames, bool? includeGpsData, CancellationToken cancellationToken)
        {

            // Build the query with filters
            var query = _context.TankVolumeHistories
                .Include(tvh => tvh.Tank)
                .ThenInclude(t => t.Site)
                .Include(tvh => tvh.RecordedByNavigation)
                .Where(tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate)
                .Where(tvh => tvh.IsDeleted != true); // Exclude soft-deleted records

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

            return await MapTankVolumeHistoryToDTO(tankVolumeHistories, includeVehicleNames, includeGpsData, startDate, endDate, cancellationToken);
        }

        /// <summary>
        /// Get tank volume history with manual dispensing from TankStock
        /// Excludes sensor dispensing and includes manual dispensing aggregates
        /// </summary>
        private async Task<List<TankVolumeHistoryDTO>> GetTankVolumeHistoryWithManualDispensingAsync(
            DateTime startDate, DateTime endDate, int? siteId, int? tankId, string? recordedBy,
            bool? includeVehicleNames, bool? includeGpsData, CancellationToken cancellationToken)
        {

            // Get all NON-DISPENSING transactions from TankVolumeHistory
            var volumeHistoryQuery = _context.TankVolumeHistories
                .Include(tvh => tvh.Tank)
                .ThenInclude(t => t.Site)
                .Include(tvh => tvh.RecordedByNavigation)
                .Where(tvh => tvh.Timestamp >= startDate && tvh.Timestamp <= endDate)
                .Where(tvh => tvh.IsDeleted != true) // Exclude soft-deleted records
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
            var mappedVolumeHistory = await MapTankVolumeHistoryToDTO(volumeHistoryData, includeVehicleNames, includeGpsData, startDate, endDate, cancellationToken);
            result.AddRange(mappedVolumeHistory);

            // Map TankStock (manual dispensing) records
            foreach (var tankStock in tankStockData)
            {
                var dto = new TankVolumeHistoryDTO
                {
                    Id = tankStock.EntryId, // Use TankStock ID
                    TankId = tankStock.TankId,
                    TankName = tankStock.Tank?.Name ?? "Unknown",
                    Site = tankStock.Tank?.Site?.Name ?? "Unknown",
                    SiteId = tankStock.Tank?.SiteId,
                    Timestamp = tankStock.EntryDate,
                    VolumeChange = tankStock.ManualAmount ?? 0, // Use ManualAmount for manual dispensing
                    NewVolume = null, // TankStock doesn't track NewVolume for dispensing
                    ChangeReason = VolumeChangeReasonEnum.Dispensing,
                    ChangeReasonDisplay = "Manual Dispensing",
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
    bool? includeGpsData,
    DateTime startDate,
    DateTime endDate,
    CancellationToken cancellationToken)
        {
            // Get all dispensing transaction IDs for bulk vehicle name lookup (manual dispensing via FuelRefill)
            var dispensingTransactionIds = new List<int>();
            // Get all automated dispensing transaction IDs for bulk vehicle name lookup (PumpTransaction)
            var automatedDispensingTransactionIds = new List<int>();

            if (includeVehicleNames == true)
            {
                dispensingTransactionIds = tankVolumeHistories
                    .Where(h => h.ChangeReason == VolumeChangeReasonEnum.Dispensing && h.ReferenceId.HasValue)
                    .Select(h => h.ReferenceId.Value)
                    .ToList();

                automatedDispensingTransactionIds = tankVolumeHistories
                    .Where(h => h.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing && h.ReferenceId.HasValue)
                    .Select(h => h.ReferenceId.Value)
                    .ToList();
            }

            // Bulk load vehicle names and types for dispensing transactions to avoid N+1 queries
            var vehicleNameLookup = new Dictionary<int, string>();
            var vehicleTypeLookup = new Dictionary<int, string>();
            var vehicleIdLookup = new Dictionary<int, int>(); // FuelRefill.Id -> Vehicle.Id
            if (dispensingTransactionIds.Any())
            {
                var fuelRefillsWithVehicles = await _context.FuelRefills
                    .Where(fr => dispensingTransactionIds.Contains(fr.Id))
                    .Include(fr => fr.Vehicle)
                        .ThenInclude(v => v.VehicleType)
                    .Select(fr => new
                    {
                        fr.Id,
                        VehicleId = fr.VehicleId,
                        VehicleName = fr.Vehicle != null ? fr.Vehicle.VehicleCode : "N/A",
                        VehicleType = fr.Vehicle != null && fr.Vehicle.VehicleType != null ? fr.Vehicle.VehicleType.Name : "N/A"
                    })
                    .ToListAsync(cancellationToken);

                vehicleNameLookup = fuelRefillsWithVehicles.ToDictionary(
                    fr => fr.Id,
                    fr => fr.VehicleName ?? "N/A"
                );

                vehicleTypeLookup = fuelRefillsWithVehicles.ToDictionary(
                    fr => fr.Id,
                    fr => fr.VehicleType ?? "N/A"
                );

                vehicleIdLookup = fuelRefillsWithVehicles
                    .Where(fr => fr.VehicleId > 0) // VehicleId is int, not nullable
                    .ToDictionary(
                        fr => fr.Id,
                        fr => fr.VehicleId
                    );
            }

            // Bulk load vehicle names and types for automated dispensing (PumpTransaction) to avoid N+1 queries
            var pumpTransactionVehicleNameLookup = new Dictionary<int, string>();
            var pumpTransactionVehicleTypeLookup = new Dictionary<int, string>();
            var pumpTransactionVehicleIdLookup = new Dictionary<int, int>(); // PumpTransaction.Id -> Vehicle.Id
            if (automatedDispensingTransactionIds.Any())
            {
                var distinctPumpTransactionIds = automatedDispensingTransactionIds.Distinct().ToList();
                _logger.LogDebug("Looking up vehicle info for {Count} AutomatedDispensing (PumpTransaction) records (distinct: {DistinctCount}): {Ids}",
                    automatedDispensingTransactionIds.Count, distinctPumpTransactionIds.Count, string.Join(", ", distinctPumpTransactionIds));

                var existingPumpTransactionIds = await _context.Pumptransactions
                    .Where(pt => distinctPumpTransactionIds.Contains(pt.Id))
                    .Select(pt => pt.Id)
                    .ToListAsync(cancellationToken);

                _logger.LogInformation("PumpTransaction ID check: Looking for {RequestedCount} IDs, found {ExistingCount} in database. Missing: {MissingIds}",
                    distinctPumpTransactionIds.Count,
                    existingPumpTransactionIds.Count,
                    existingPumpTransactionIds.Count < distinctPumpTransactionIds.Count
                        ? string.Join(", ", distinctPumpTransactionIds.Except(existingPumpTransactionIds))
                        : "none");

                var pumpTransactionsWithVehicles = await _context.Pumptransactions
                    .Where(pt => distinctPumpTransactionIds.Contains(pt.Id))
                    .Include(pt => pt.Vehicle)
                        .ThenInclude(v => v.VehicleType)
                    .Select(pt => new
                    {
                        pt.Id,
                        VehicleId = pt.VehicleId,
                        VehicleName = pt.Vehicle != null ? pt.Vehicle.VehicleCode : null,
                        VehicleType = pt.Vehicle != null && pt.Vehicle.VehicleType != null ? pt.Vehicle.VehicleType.Name : null
                    })
                    .ToListAsync(cancellationToken);

                var withVehicle = pumpTransactionsWithVehicles.Count(pt => pt.VehicleId.HasValue && pt.VehicleId.Value > 0);
                var withoutVehicle = pumpTransactionsWithVehicles.Count(pt => !pt.VehicleId.HasValue || pt.VehicleId.Value <= 0);
                _logger.LogInformation("PumpTransaction vehicle lookup: {Total} total, {WithVehicle} with VehicleId, {WithoutVehicle} without VehicleId",
                    pumpTransactionsWithVehicles.Count, withVehicle, withoutVehicle);

                pumpTransactionVehicleNameLookup = pumpTransactionsWithVehicles.ToDictionary(
                    pt => pt.Id,
                    pt => pt.VehicleName ?? "N/A"
                );

                pumpTransactionVehicleTypeLookup = pumpTransactionsWithVehicles.ToDictionary(
                    pt => pt.Id,
                    pt => pt.VehicleType ?? "N/A"
                );

                pumpTransactionVehicleIdLookup = pumpTransactionsWithVehicles
                    .Where(pt => pt.VehicleId.HasValue && pt.VehicleId.Value > 0)
                    .ToDictionary(
                        pt => pt.Id,
                        pt => pt.VehicleId!.Value
                    );

                var pumpTransactionIdsWithoutVehicle = pumpTransactionsWithVehicles
                    .Where(pt => !pt.VehicleId.HasValue || pt.VehicleId.Value <= 0)
                    .Select(pt => pt.Id)
                    .ToList();

                _logger.LogInformation("PumpTransaction fallback check: {Total} total, {WithoutVehicle} need fallback lookup, IDs: {Ids}",
                    pumpTransactionsWithVehicles.Count,
                    pumpTransactionIdsWithoutVehicle.Count,
                    pumpTransactionIdsWithoutVehicle.Count <= 30 ? string.Join(", ", pumpTransactionIdsWithoutVehicle) : $"[{pumpTransactionIdsWithoutVehicle.Count} IDs]");

                if (pumpTransactionIdsWithoutVehicle.Any())
                {
                    _logger.LogDebug("Attempting fallback vehicle lookup via FuelRefill for {Count} PumpTransactions without VehicleId",
                        pumpTransactionIdsWithoutVehicle.Count);

                    var fuelRefillsForPumpTransactions = await _context.FuelRefills
                        .Where(fr => fr.PumpTranscationId.HasValue && pumpTransactionIdsWithoutVehicle.Contains(fr.PumpTranscationId.Value))
                        .Where(fr => !fr.IsDeleted)
                        .Include(fr => fr.Vehicle)
                            .ThenInclude(v => v.VehicleType)
                        .Select(fr => new
                        {
                            PumpTransactionId = fr.PumpTranscationId!.Value,
                            fr.VehicleId,
                            VehicleName = fr.Vehicle != null ? fr.Vehicle.VehicleCode : null,
                            VehicleType = fr.Vehicle != null && fr.Vehicle.VehicleType != null ? fr.Vehicle.VehicleType.Name : null
                        })
                        .ToListAsync(cancellationToken);

                    foreach (var fr in fuelRefillsForPumpTransactions)
                    {
                        if (!pumpTransactionVehicleNameLookup.ContainsKey(fr.PumpTransactionId) ||
                            pumpTransactionVehicleNameLookup[fr.PumpTransactionId] == "N/A")
                        {
                            pumpTransactionVehicleNameLookup[fr.PumpTransactionId] = fr.VehicleName ?? "N/A";
                            pumpTransactionVehicleTypeLookup[fr.PumpTransactionId] = fr.VehicleType ?? "N/A";

                            if (fr.VehicleId > 0 && !pumpTransactionVehicleIdLookup.ContainsKey(fr.PumpTransactionId))
                            {
                                pumpTransactionVehicleIdLookup[fr.PumpTransactionId] = fr.VehicleId;
                            }
                        }
                    }

                    _logger.LogInformation("Fallback FuelRefill lookup found vehicle info for {Count} of {Total} PumpTransactions",
                        fuelRefillsForPumpTransactions.Count, pumpTransactionIdsWithoutVehicle.Count);
                }
            }

            // Bulk load GPS data if requested
            var gpsDataLookup = new Dictionary<string, decimal>(); // "vehicleId_date" -> RefillVolume
            var allVehicleIds = vehicleIdLookup.Values
                .Concat(pumpTransactionVehicleIdLookup.Values)
                .Distinct()
                .ToList();

            if (includeGpsData == true && allVehicleIds.Any())
            {
                var gpsEntries = await _context.GpsGateReportEntries
                    .Where(g => allVehicleIds.Contains(g.VehicleId))
                    .Where(g => g.DispenseDate >= startDate && g.DispenseDate <= endDate)
                    .Where(g => !g.IsDeleted)
                    .Select(g => new
                    {
                        g.VehicleId,
                        DispenseDate = g.DispenseDate.Date,
                        g.RefillVolume
                    })
                    .ToListAsync(cancellationToken);

                foreach (var entry in gpsEntries)
                {
                    var key = $"{entry.VehicleId}_{entry.DispenseDate:yyyy-MM-dd}";
                    if (gpsDataLookup.ContainsKey(key))
                    {
                        gpsDataLookup[key] += entry.RefillVolume;
                    }
                    else
                    {
                        gpsDataLookup[key] = entry.RefillVolume;
                    }
                }

                _logger.LogInformation("Loaded {Count} GPS entries for {VehicleCount} vehicles",
                    gpsEntries.Count, allVehicleIds.Count);
            }

            // FIXED: Bulk load tank transfer information for TransferIn/TransferOut transactions
            // Always load transfer info for transfer transactions, not conditional on includeVehicleNames
            var transferTransactionIds = tankVolumeHistories
                .Where(h => (h.ChangeReason == VolumeChangeReasonEnum.TransferIn ||
                             h.ChangeReason == VolumeChangeReasonEnum.TransferOut) &&
                             h.ReferenceId.HasValue &&
                             h.ReferenceType == "TankTransfer")
                .Select(h => h.ReferenceId.Value)
                .Distinct()
                .ToList();

            var transferSourceTankLookup = new Dictionary<int, (int TankId, string TankName, string SiteName)>();
            var transferDestTankLookup = new Dictionary<int, (int TankId, string TankName, string SiteName)>();

            if (transferTransactionIds.Any())
            {
                var tankTransfersWithTanks = await _context.TankTransfers
                    .Where(tt => transferTransactionIds.Contains(tt.Id))
                    //  .Where(tt => !tt.IsDeleted) // Exclude soft-deleted transfers
                    .Include(tt => tt.SourceTank)
                        .ThenInclude(t => t.Site)
                    .Include(tt => tt.DestinationTank)
                        .ThenInclude(t => t.Site)
                    .Select(tt => new
                    {
                        tt.Id,
                        SourceTankId = tt.SourceTankId,
                        SourceTankName = tt.SourceTank != null ? tt.SourceTank.Name : null,
                        SourceSiteName = tt.SourceTank != null && tt.SourceTank.Site != null ? tt.SourceTank.Site.Name : null,
                        DestinationTankId = tt.DestinationTankId,
                        DestinationTankName = tt.DestinationTank != null ? tt.DestinationTank.Name : null,
                        DestinationSiteName = tt.DestinationTank != null && tt.DestinationTank.Site != null ? tt.DestinationTank.Site.Name : null
                    })
                    .ToListAsync(cancellationToken);

                foreach (var tt in tankTransfersWithTanks)
                {
                    if (tt.SourceTankId.HasValue)
                    {
                        transferSourceTankLookup[tt.Id] = (
                            tt.SourceTankId.Value,
                            tt.SourceTankName ?? "Unknown Tank",
                            tt.SourceSiteName ?? "Unknown Site"
                        );
                    }

                    if (tt.DestinationTankId.HasValue)
                    {
                        transferDestTankLookup[tt.Id] = (
                            tt.DestinationTankId.Value,
                            tt.DestinationTankName ?? "Unknown Tank",
                            tt.DestinationSiteName ?? "Unknown Site"
                        );
                    }
                }

                _logger.LogInformation("Loaded transfer info for {Count} tank transfers (Source: {SourceCount}, Dest: {DestCount})",
                    tankTransfersWithTanks.Count,
                    transferSourceTankLookup.Count,
                    transferDestTankLookup.Count);
            }

            // Build result list
            var result = new List<TankVolumeHistoryDTO>();

            foreach (var history in tankVolumeHistories)
            {
                var dto = _mapper.Map<TankVolumeHistoryDTO>(history);

                // Set site information
                dto.TankName = history.Tank?.Name ?? "Unknown";
                dto.Site = history.Tank?.Site?.Name ?? "Unknown";
                dto.SiteId = history.Tank?.SiteId;
                dto.ChangeReasonDisplay = history.ChangeReason == VolumeChangeReasonEnum.Dispensing
                    ? "Manual Dispensing"
                    : history.ChangeReason.ToString();

                // Set recorded by user name
                dto.RecordedByUserName = history.RecordedByNavigation?.UserName ?? "Unknown";

                // Handle vehicle names and types for MANUAL dispensing transactions (FuelRefill)
                if (includeVehicleNames == true &&
                    history.ChangeReason == VolumeChangeReasonEnum.Dispensing &&
                    history.ReferenceId.HasValue)
                {
                    if (vehicleNameLookup.TryGetValue(history.ReferenceId.Value, out string? vehicleName))
                    {
                        dto.VehicleName = vehicleName;
                    }
                    else
                    {
                        dto.VehicleName = "N/A";
                    }

                    if (vehicleTypeLookup.TryGetValue(history.ReferenceId.Value, out string? vehicleType))
                    {
                        dto.VehicleType = vehicleType;
                    }
                    else
                    {
                        dto.VehicleType = "N/A";
                    }

                    if (vehicleIdLookup.TryGetValue(history.ReferenceId.Value, out int vehicleId))
                    {
                        dto.VehicleId = vehicleId;

                        if (includeGpsData == true)
                        {
                            var dateKey = $"{vehicleId}_{history.Timestamp:yyyy-MM-dd}";
                            if (gpsDataLookup.TryGetValue(dateKey, out decimal gpsVolume))
                            {
                                dto.GpsVolume = gpsVolume;
                            }
                        }
                    }
                }
                // Handle vehicle names and types for AUTOMATED dispensing transactions (PumpTransaction)
                else if (includeVehicleNames == true &&
                    history.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing &&
                    history.ReferenceId.HasValue)
                {
                    if (pumpTransactionVehicleNameLookup.TryGetValue(history.ReferenceId.Value, out string? vehicleName))
                    {
                        dto.VehicleName = vehicleName;
                    }
                    else
                    {
                        dto.VehicleName = "N/A";
                    }

                    if (pumpTransactionVehicleTypeLookup.TryGetValue(history.ReferenceId.Value, out string? vehicleType))
                    {
                        dto.VehicleType = vehicleType;
                    }
                    else
                    {
                        dto.VehicleType = "N/A";
                    }

                    if (pumpTransactionVehicleIdLookup.TryGetValue(history.ReferenceId.Value, out int vehicleId))
                    {
                        dto.VehicleId = vehicleId;

                        if (includeGpsData == true)
                        {
                            var dateKey = $"{vehicleId}_{history.Timestamp:yyyy-MM-dd}";
                            if (gpsDataLookup.TryGetValue(dateKey, out decimal gpsVolume))
                            {
                                dto.GpsVolume = gpsVolume;
                            }
                        }
                    }
                }
                else
                {
                    dto.VehicleName = "N/A";
                    dto.VehicleType = "N/A";
                }

                // Handle tank transfer information for TransferIn transactions
                if (history.ChangeReason == VolumeChangeReasonEnum.TransferIn &&
                    history.ReferenceId.HasValue

                    )
                {
                    // For TransferIn, show SOURCE tank (where fuel came FROM)
                    if (transferSourceTankLookup.TryGetValue(history.ReferenceId.Value, out var sourceTankInfo))
                    {
                        dto.TransferTankId = sourceTankInfo.TankId;
                        dto.TransferTankName = sourceTankInfo.TankName;
                        dto.TransferTankSite = sourceTankInfo.SiteName;
                    }
                    else
                    {
                        // Log warning when transfer data is missing
                        _logger.LogWarning("TransferIn record {HistoryId} references TankTransfer {TransferId} but no source tank found",
                            history.Id, history.ReferenceId.Value);
                        dto.TransferTankName = "Unknown Transfer";
                        dto.TransferTankSite = "Unknown Site";
                    }
                }
                // Handle tank transfer information for TransferOut transactions
                else if (history.ChangeReason == VolumeChangeReasonEnum.TransferOut &&
                         history.ReferenceId.HasValue &&
                         history.ReferenceType == "TankTransfer")
                {
                    // For TransferOut, show DESTINATION tank (where fuel went TO)
                    if (transferDestTankLookup.TryGetValue(history.ReferenceId.Value, out var destTankInfo))
                    {
                        dto.TransferTankId = destTankInfo.TankId;
                        dto.TransferTankName = destTankInfo.TankName;
                        dto.TransferTankSite = destTankInfo.SiteName;
                    }
                    else
                    {
                        // Log warning when transfer data is missing
                        _logger.LogWarning("TransferOut record {HistoryId} references TankTransfer {TransferId} but no destination tank found",
                            history.Id, history.ReferenceId.Value);
                        dto.TransferTankName = "Unknown Transfer";
                        dto.TransferTankSite = "Unknown Site";
                    }
                }

                result.Add(dto);
            }

            return result;
        }

    }

}
