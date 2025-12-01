using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FuelAudit.Services;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelAudit.Queries
{
    /// <summary>
    /// Query to get tank preview data for fuel audit wizard Step 3.
    /// Returns opening stock, closing stock, deliveries, transfers for each selected tank.
    /// </summary>
    public record GetTankPreviewForAuditQuery(
        List<int> TankIds,
        DateTime StartDate,
        DateTime EndDate,
        int? SiteId = null
    ) : IRequest<FMSResponse<List<TankAuditPreviewDTO>>>;

    /// <summary>
    /// DTO for tank audit preview data (Step 3 of wizard)
    /// </summary>
    public class TankAuditPreviewDTO
    {
        public int TankId { get; set; }
        public string TankName { get; set; } = string.Empty;
        public string? FuelGradeName { get; set; }
        public decimal? TankCapacity { get; set; }

        // Period info
        public DateTime PeriodStart { get; set; }
        public DateTime PeriodEnd { get; set; }

        // Opening stock
        public decimal OpeningStock { get; set; }
        public bool HasExplicitOpeningStock { get; set; }
        public DateTime? OpeningReadingTime { get; set; }
        public string OpeningDataSource { get; set; } = "Calculated"; // "Manual", "PTS", "Calculated"

        // Closing stock
        public decimal ClosingStock { get; set; }
        public bool HasExplicitClosingStock { get; set; }
        public DateTime? ClosingReadingTime { get; set; }
        public string ClosingDataSource { get; set; } = "Calculated";

        // Transactions during period
        public decimal TotalDeliveries { get; set; }
        public int DeliveryCount { get; set; }
        public decimal TotalDispensed { get; set; }
        public int DispensingCount { get; set; }
        public decimal TotalTransfersIn { get; set; }
        public int TransferInCount { get; set; }
        public decimal TotalTransfersOut { get; set; }
        public int TransferOutCount { get; set; }
        public decimal TotalAdjustments { get; set; }
        public int AdjustmentCount { get; set; }

        // Calculated metrics
        public decimal ExpectedClosingStock { get; set; }
        public decimal Variance { get; set; }
        public decimal VariancePercent { get; set; }
        public decimal FillPercentage { get; set; }

        // Data quality indicators
        public string DataConfidence { get; set; } = "High"; // "High", "Medium", "Low"
        public int TotalTransactions { get; set; }
        public List<string> Warnings { get; set; } = new();
    }

    public class GetTankPreviewForAuditQueryHandler
        : IRequestHandler<GetTankPreviewForAuditQuery, FMSResponse<List<TankAuditPreviewDTO>>>
    {
        private readonly IFuelAuditTankStockService _tankStockService;
        private readonly Persistence.DataAccess.GpsdataContext _context;
        private readonly ILogger<GetTankPreviewForAuditQueryHandler> _logger;

        public GetTankPreviewForAuditQueryHandler(
            IFuelAuditTankStockService tankStockService,
            Persistence.DataAccess.GpsdataContext context,
            ILogger<GetTankPreviewForAuditQueryHandler> logger)
        {
            _tankStockService = tankStockService;
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<TankAuditPreviewDTO>>> Handle(
            GetTankPreviewForAuditQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                if (request.TankIds == null || request.TankIds.Count == 0)
                {
                    return FMSResponse<List<TankAuditPreviewDTO>>.Failed("No tanks specified");
                }

                _logger.LogInformation(
                    "Getting tank preview for {TankCount} tanks from {StartDate} to {EndDate}",
                    request.TankIds.Count, request.StartDate, request.EndDate);

                var result = new List<TankAuditPreviewDTO>();

                foreach (var tankId in request.TankIds)
                {
                    // Get tank info
                    var tank = await _context.Tanks
                        .FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

                    if (tank == null)
                    {
                        _logger.LogWarning("Tank {TankId} not found", tankId);
                        continue;
                    }

                    // Get audit period data from service
                    var periodData = await _tankStockService.GetTankAuditPeriodDataAsync(
                        tankId, request.StartDate, request.EndDate, cancellationToken);

                    // Get transaction details for counts
                    var transactions = await _tankStockService.GetTankTransactionsDuringPeriodAsync(
                        tankId, request.StartDate, request.EndDate, cancellationToken);

                    var preview = new TankAuditPreviewDTO
                    {
                        TankId = tankId,
                        TankName = tank.Name ?? $"Tank {tankId}",
                        FuelGradeName = tank.FuelGradeName,
                        TankCapacity = tank.TankVolume,
                        PeriodStart = request.StartDate,
                        PeriodEnd = request.EndDate
                    };

                    if (periodData != null)
                    {
                        // Opening stock
                        preview.OpeningStock = periodData.OpeningVolume;
                        preview.HasExplicitOpeningStock = periodData.HasExplicitOpeningStock;
                        preview.OpeningReadingTime = periodData.OpeningReadingTime;
                        preview.OpeningDataSource = periodData.HasExplicitOpeningStock ? "Manual" : "Calculated";

                        // Closing stock
                        preview.ClosingStock = periodData.ClosingVolume;
                        preview.HasExplicitClosingStock = periodData.HasExplicitClosingStock;
                        preview.ClosingReadingTime = periodData.ClosingReadingTime;
                        preview.ClosingDataSource = periodData.HasExplicitClosingStock ? "Manual" : "Calculated";

                        // Transactions
                        preview.TotalDeliveries = periodData.TotalDeliveries;
                        preview.TotalDispensed = periodData.TotalDispensing;
                        preview.TotalTransfersIn = periodData.TotalTransfersIn;
                        preview.TotalTransfersOut = periodData.TotalTransfersOut;
                        preview.TotalAdjustments = periodData.TotalAdjustments;

                        // Calculated
                        preview.ExpectedClosingStock = periodData.ExpectedClosingVolume;
                        preview.Variance = periodData.Variance;
                        preview.TotalTransactions = periodData.TransactionCount;

                        // Calculate variance percent
                        if (preview.ExpectedClosingStock != 0)
                        {
                            preview.VariancePercent = (preview.Variance / preview.ExpectedClosingStock) * 100;
                        }

                        // Calculate fill percentage
                        if (tank.TankVolume > 0)
                        {
                            preview.FillPercentage = (preview.ClosingStock / tank.TankVolume) * 100;
                        }
                    }

                    // Get transaction counts from the detailed list
                    if (transactions != null && transactions.Count > 0)
                    {
                        preview.DeliveryCount = transactions.Count(t => t.ChangeReason == "Delivery");
                        preview.DispensingCount = transactions.Count(t =>
                            t.ChangeReason == "Dispensing" || t.ChangeReason == "AutomatedDispensing");
                        preview.TransferInCount = transactions.Count(t => t.ChangeReason == "TransferIn");
                        preview.TransferOutCount = transactions.Count(t => t.ChangeReason == "TransferOut");
                        preview.AdjustmentCount = transactions.Count(t =>
                            t.ChangeReason == "Adjustment" ||
                            t.ChangeReason == "Reconciliation" ||
                            t.ChangeReason == "AutomatedReconciliation");
                    }

                    // Determine data confidence
                    preview.DataConfidence = DetermineDataConfidence(preview);

                    // Add warnings
                    if (!preview.HasExplicitOpeningStock)
                    {
                        preview.Warnings.Add("Opening stock was calculated from previous records, not an explicit reading.");
                    }
                    if (!preview.HasExplicitClosingStock)
                    {
                        preview.Warnings.Add("Closing stock was calculated from previous records, not an explicit reading.");
                    }
                    if (Math.Abs(preview.VariancePercent) > 5)
                    {
                        preview.Warnings.Add($"Variance of {preview.VariancePercent:F1}% exceeds 5% threshold.");
                    }
                    if (preview.TotalTransactions == 0)
                    {
                        preview.Warnings.Add("No transactions recorded during this period.");
                    }

                    result.Add(preview);
                }

                _logger.LogInformation("Successfully retrieved preview for {Count} tanks", result.Count);

                return FMSResponse<List<TankAuditPreviewDTO>>.Success(result, $"Preview data for {result.Count} tank(s)");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting tank preview for audit");
                return FMSResponse<List<TankAuditPreviewDTO>>.Failed($"Error getting tank preview: {ex.Message}");
            }
        }

        private static string DetermineDataConfidence(TankAuditPreviewDTO preview)
        {
            // High confidence: explicit readings and minimal variance
            if (preview.HasExplicitOpeningStock &&
                preview.HasExplicitClosingStock &&
                Math.Abs(preview.VariancePercent) <= 2)
            {
                return "High";
            }

            // Medium confidence: at least one explicit reading or low variance
            if ((preview.HasExplicitOpeningStock || preview.HasExplicitClosingStock) &&
                Math.Abs(preview.VariancePercent) <= 5)
            {
                return "Medium";
            }

            // Low confidence: no explicit readings or high variance
            return "Low";
        }
    }
}
