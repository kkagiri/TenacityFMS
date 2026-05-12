using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Services
{
    /// <summary>
    /// Service for retrieving tank stock data from TankVolumeHistory for Fuel Audit calculations.
    /// Provides opening/closing volumes and transaction summaries for audit periods.
    /// </summary>
    public interface IFuelAuditTankStockService
    {
        /// <summary>
        /// Gets the tank volume at a specific point in time
        /// </summary>
        Task<TankVolumeSnapshot?> GetTankVolumeAtTimeAsync(int tankId, DateTime timestamp, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets the opening and closing volumes for a tank during an audit period
        /// </summary>
        Task<TankAuditPeriodData?> GetTankAuditPeriodDataAsync(int tankId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets all tank volumes for a site during an audit period
        /// </summary>
        Task<List<TankAuditPeriodData>> GetSiteTankAuditDataAsync(int? siteId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets volume transactions (deliveries, dispensing, transfers) during an audit period
        /// </summary>
        Task<List<TankVolumeTransaction>> GetTankTransactionsDuringPeriodAsync(int tankId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default);

        /// <summary>
        /// Gets a summary of all fuel movements during an audit period
        /// </summary>
        Task<FuelMovementSummary> GetFuelMovementSummaryAsync(int? siteId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default);
    }

    public class FuelAuditTankStockService : IFuelAuditTankStockService
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<FuelAuditTankStockService> _logger;

        public FuelAuditTankStockService(GpsdataContext context, ILogger<FuelAuditTankStockService> logger)
        {
            _context = context;
            _logger = logger;
        }

        /// <inheritdoc />
        public async Task<TankVolumeSnapshot?> GetTankVolumeAtTimeAsync(int tankId, DateTime timestamp, CancellationToken cancellationToken = default)
        {
            try
            {
                // Get the most recent volume history entry at or before the specified time
                // CRITICAL: Secondary sort by Id ensures we get the correct latest record when timestamps are equal
                var volumeRecord = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.Timestamp <= timestamp &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .OrderByDescending(h => h.Timestamp)
                    .ThenByDescending(h => h.Id)  // Secondary sort for deterministic ordering
                    .FirstOrDefaultAsync(cancellationToken);

                if (volumeRecord == null)
                {
                    _logger.LogWarning("No volume history found for tank {TankId} at or before {Timestamp}", tankId, timestamp);
                    return null;
                }

                var tank = await _context.Tanks.FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

                return new TankVolumeSnapshot
                {
                    TankId = tankId,
                    TankName = tank?.Name ?? $"Tank {tankId}",
                    Volume = volumeRecord.NewVolume ?? 0,
                    Timestamp = volumeRecord.Timestamp,
                    ChangeReason = volumeRecord.ChangeReason.ToString(),
                    IsExactReading = volumeRecord.ChangeReason == VolumeChangeReasonEnum.OpeningStock ||
                                    volumeRecord.ChangeReason == VolumeChangeReasonEnum.ClosingStock
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank volume at time for tank {TankId} at {Timestamp}", tankId, timestamp);
                return null;
            }
        }

        /// <inheritdoc />
        public async Task<TankAuditPeriodData?> GetTankAuditPeriodDataAsync(int tankId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default)
        {
            try
            {
                var tank = await _context.Tanks.FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);
                if (tank == null)
                {
                    _logger.LogWarning("Tank {TankId} not found", tankId);
                    return null;
                }

                // Get opening volume - the most recent volume at or before period start
                // CRITICAL: Secondary sort by Id ensures we get the correct latest record when timestamps are equal
                var openingRecord = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.Timestamp <= periodStart &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .OrderByDescending(h => h.Timestamp)
                    .ThenByDescending(h => h.Id)  // Secondary sort for deterministic ordering
                    .FirstOrDefaultAsync(cancellationToken);

                // Get closing volume - the most recent volume at or before period end
                // CRITICAL: Secondary sort by Id ensures we get the correct latest record when timestamps are equal
                var closingRecord = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.Timestamp <= periodEnd &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .OrderByDescending(h => h.Timestamp)
                    .ThenByDescending(h => h.Id)  // Secondary sort for deterministic ordering
                    .FirstOrDefaultAsync(cancellationToken);

                // Get all transactions during the period
                var transactions = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.Timestamp > periodStart &&
                                h.Timestamp <= periodEnd &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .OrderBy(h => h.Timestamp)
                    .ToListAsync(cancellationToken);

                // Calculate totals by change reason
                var deliveries = transactions
                    .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Delivery)
                    .Sum(t => t.VolumeChange ?? 0);

                var dispensing = transactions
                    .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing ||
                               t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                    .Sum(t => Math.Abs(t.VolumeChange ?? 0));

                var transfersIn = transactions
                    .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                    .Sum(t => t.VolumeChange ?? 0);

                var transfersOut = transactions
                    .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                    .Sum(t => Math.Abs(t.VolumeChange ?? 0));

                var adjustments = transactions
                    .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Adjustment ||
                               t.ChangeReason == VolumeChangeReasonEnum.Reconciliation ||
                               t.ChangeReason == VolumeChangeReasonEnum.AutomatedReconciliation)
                    .Sum(t => t.VolumeChange ?? 0);

                // Check if we have explicit opening/closing stock entries
                var hasOpeningStockEntry = transactions.Any(t => t.ChangeReason == VolumeChangeReasonEnum.OpeningStock);
                var hasClosingStockEntry = transactions.Any(t => t.ChangeReason == VolumeChangeReasonEnum.ClosingStock);

                // If we have explicit opening stock entry at period start, use that
                var explicitOpeningStock = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                                h.Timestamp.Date == periodStart.Date &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .FirstOrDefaultAsync(cancellationToken);

                var explicitClosingStock = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                                h.Timestamp.Date == periodEnd.Date &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .FirstOrDefaultAsync(cancellationToken);

                var openingVolume = explicitOpeningStock?.NewVolume ?? openingRecord?.NewVolume ?? 0;
                var closingVolume = explicitClosingStock?.NewVolume ?? closingRecord?.NewVolume ?? 0;

                // Calculate expected closing based on transactions
                var expectedClosing = openingVolume + deliveries + transfersIn - dispensing - transfersOut + adjustments;
                var variance = closingVolume - expectedClosing;

                return new TankAuditPeriodData
                {
                    TankId = tankId,
                    TankName = tank.Name ?? $"Tank {tankId}",
                    TankCapacity = tank.TankVolume,
                    PeriodStart = periodStart,
                    PeriodEnd = periodEnd,
                    OpeningVolume = openingVolume,
                    ClosingVolume = closingVolume,
                    HasExplicitOpeningStock = explicitOpeningStock != null,
                    HasExplicitClosingStock = explicitClosingStock != null,
                    OpeningReadingTime = explicitOpeningStock?.Timestamp ?? openingRecord?.Timestamp,
                    ClosingReadingTime = explicitClosingStock?.Timestamp ?? closingRecord?.Timestamp,
                    TotalDeliveries = deliveries,
                    TotalDispensing = dispensing,
                    TotalTransfersIn = transfersIn,
                    TotalTransfersOut = transfersOut,
                    TotalAdjustments = adjustments,
                    ExpectedClosingVolume = expectedClosing,
                    Variance = variance,
                    TransactionCount = transactions.Count
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank audit period data for tank {TankId}", tankId);
                return null;
            }
        }

        /// <inheritdoc />
        public async Task<List<TankAuditPeriodData>> GetSiteTankAuditDataAsync(int? siteId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default)
        {
            try
            {
                var tanksQuery = _context.Tanks.AsQueryable();

                if (siteId.HasValue)
                {
                    tanksQuery = tanksQuery.Where(t => t.SiteId == siteId.Value);
                }

                var tanks = await tanksQuery.Select(t => t.Id).ToListAsync(cancellationToken);

                var results = new List<TankAuditPeriodData>();

                foreach (var tankId in tanks)
                {
                    var tankData = await GetTankAuditPeriodDataAsync(tankId, periodStart, periodEnd, cancellationToken);
                    if (tankData != null)
                    {
                        results.Add(tankData);
                    }
                }

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting site tank audit data for site {SiteId}", siteId);
                return new List<TankAuditPeriodData>();
            }
        }

        /// <inheritdoc />
        public async Task<List<TankVolumeTransaction>> GetTankTransactionsDuringPeriodAsync(int tankId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default)
        {
            try
            {
                var transactions = await _context.TankVolumeHistories
                    .Where(h => h.TankId == tankId &&
                                h.Timestamp > periodStart &&
                                h.Timestamp <= periodEnd &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .OrderBy(h => h.Timestamp)
                    .Select(h => new TankVolumeTransaction
                    {
                        Id = h.Id,
                        TankId = h.TankId ?? 0,
                        Timestamp = h.Timestamp,
                        VolumeChange = h.VolumeChange ?? 0,
                        NewVolume = h.NewVolume ?? 0,
                        ChangeReason = h.ChangeReason.ToString(),
                        ReferenceId = h.ReferenceId,
                        ReferenceType = h.ReferenceType,
                        RecordedBy = h.RecordedBy
                    })
                    .ToListAsync(cancellationToken);

                return transactions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank transactions for tank {TankId}", tankId);
                return new List<TankVolumeTransaction>();
            }
        }

        /// <inheritdoc />
        public async Task<FuelMovementSummary> GetFuelMovementSummaryAsync(int? siteId, DateTime periodStart, DateTime periodEnd, CancellationToken cancellationToken = default)
        {
            try
            {
                var tanksQuery = _context.Tanks.AsQueryable();

                if (siteId.HasValue)
                {
                    tanksQuery = tanksQuery.Where(t => t.SiteId == siteId.Value);
                }

                var tankIds = await tanksQuery.Select(t => t.Id).ToListAsync(cancellationToken);

                var transactions = await _context.TankVolumeHistories
                    .Where(h => tankIds.Contains(h.TankId ?? 0) &&
                                h.Timestamp > periodStart &&
                                h.Timestamp <= periodEnd &&
                                (h.IsDeleted == null || h.IsDeleted == false))
                    .ToListAsync(cancellationToken);

                var summary = new FuelMovementSummary
                {
                    PeriodStart = periodStart,
                    PeriodEnd = periodEnd,
                    SiteId = siteId,
                    TotalDeliveries = transactions
                        .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Delivery)
                        .Sum(t => t.VolumeChange ?? 0),
                    TotalDispensing = transactions
                        .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing ||
                                   t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                        .Sum(t => Math.Abs(t.VolumeChange ?? 0)),
                    TotalTransfersIn = transactions
                        .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn)
                        .Sum(t => t.VolumeChange ?? 0),
                    TotalTransfersOut = transactions
                        .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferOut)
                        .Sum(t => Math.Abs(t.VolumeChange ?? 0)),
                    TotalAdjustments = transactions
                        .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Adjustment ||
                                   t.ChangeReason == VolumeChangeReasonEnum.Reconciliation ||
                                   t.ChangeReason == VolumeChangeReasonEnum.AutomatedReconciliation)
                        .Sum(t => t.VolumeChange ?? 0),
                    DeliveryCount = transactions.Count(t => t.ChangeReason == VolumeChangeReasonEnum.Delivery),
                    DispensingCount = transactions.Count(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing ||
                                                             t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing),
                    TransferCount = transactions.Count(t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn ||
                                                           t.ChangeReason == VolumeChangeReasonEnum.TransferOut),
                    AdjustmentCount = transactions.Count(t => t.ChangeReason == VolumeChangeReasonEnum.Adjustment ||
                                                             t.ChangeReason == VolumeChangeReasonEnum.Reconciliation ||
                                                             t.ChangeReason == VolumeChangeReasonEnum.AutomatedReconciliation),
                    TotalTransactions = transactions.Count
                };

                // Get tank-level data for opening/closing
                var tankData = await GetSiteTankAuditDataAsync(siteId, periodStart, periodEnd, cancellationToken);
                summary.TotalOpeningStock = tankData.Sum(t => t.OpeningVolume);
                summary.TotalClosingStock = tankData.Sum(t => t.ClosingVolume);
                summary.TankCount = tankData.Count;

                return summary;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting fuel movement summary for site {SiteId}", siteId);
                return new FuelMovementSummary
                {
                    PeriodStart = periodStart,
                    PeriodEnd = periodEnd,
                    SiteId = siteId
                };
            }
        }
    }

    #region DTOs for Tank Stock Service

    /// <summary>
    /// Represents a snapshot of tank volume at a specific point in time
    /// </summary>
    public class TankVolumeSnapshot
    {
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public decimal Volume { get; set; }
        public DateTime Timestamp { get; set; }
        public string ChangeReason { get; set; } = string.Empty;
        public bool IsExactReading { get; set; }
    }

    /// <summary>
    /// Represents tank volume data for an audit period
    /// </summary>
    public class TankAuditPeriodData
    {
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public decimal? TankCapacity { get; set; }
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }

        // Opening stock
        public decimal OpeningVolume { get; set; }
        public bool HasExplicitOpeningStock { get; set; }
        public DateTime? OpeningReadingTime { get; set; }

        // Closing stock
        public decimal ClosingVolume { get; set; }
        public bool HasExplicitClosingStock { get; set; }
        public DateTime? ClosingReadingTime { get; set; }

        // Transaction summaries
        public decimal TotalDeliveries { get; set; }
        public decimal TotalDispensing { get; set; }
        public decimal TotalTransfersIn { get; set; }
        public decimal TotalTransfersOut { get; set; }
        public decimal TotalAdjustments { get; set; }

        // Calculated fields
        public decimal ExpectedClosingVolume { get; set; }
        public decimal Variance { get; set; }
        public int TransactionCount { get; set; }

        /// <summary>
        /// Net change = Closing - Opening
        /// </summary>
        public decimal NetChange => ClosingVolume - OpeningVolume;

        /// <summary>
        /// Expected net change = Deliveries + TransfersIn - Dispensing - TransfersOut + Adjustments
        /// </summary>
        public decimal ExpectedNetChange => TotalDeliveries + TotalTransfersIn - TotalDispensing - TotalTransfersOut + TotalAdjustments;
    }

    /// <summary>
    /// Represents a single volume transaction
    /// </summary>
    public class TankVolumeTransaction
    {
        public int Id { get; set; }
        public int TankId { get; set; }
        public DateTime Timestamp { get; set; }
        public decimal VolumeChange { get; set; }
        public decimal NewVolume { get; set; }
        public string ChangeReason { get; set; } = string.Empty;
        public int? ReferenceId { get; set; }
        public string? ReferenceType { get; set; }
        public string? RecordedBy { get; set; }
    }

    /// <summary>
    /// Summary of all fuel movements during an audit period
    /// </summary>
    public class FuelMovementSummary
    {
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }
        public int? SiteId { get; set; }

        // Stock levels
        public decimal TotalOpeningStock { get; set; }
        public decimal TotalClosingStock { get; set; }

        // Movement totals
        public decimal TotalDeliveries { get; set; }
        public decimal TotalDispensing { get; set; }
        public decimal TotalTransfersIn { get; set; }
        public decimal TotalTransfersOut { get; set; }
        public decimal TotalAdjustments { get; set; }

        // Transaction counts
        public int DeliveryCount { get; set; }
        public int DispensingCount { get; set; }
        public int TransferCount { get; set; }
        public int AdjustmentCount { get; set; }
        public int TotalTransactions { get; set; }
        public int TankCount { get; set; }

        /// <summary>
        /// Net stock change = Closing - Opening
        /// </summary>
        public decimal NetStockChange => TotalClosingStock - TotalOpeningStock;

        /// <summary>
        /// Expected net change based on transactions
        /// </summary>
        public decimal ExpectedNetChange => TotalDeliveries + TotalTransfersIn - TotalDispensing - TotalTransfersOut + TotalAdjustments;

        /// <summary>
        /// Variance = Actual net change - Expected net change
        /// </summary>
        public decimal Variance => NetStockChange - ExpectedNetChange;
    }

    #endregion
}
