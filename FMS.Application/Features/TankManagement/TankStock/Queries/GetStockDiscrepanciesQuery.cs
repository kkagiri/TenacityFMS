using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankStock;

//Cursor - Get Stock Discrepancies Query for reconciliation dashboard
public record GetStockDiscrepanciesQuery (
    int? SiteId = null,
    decimal ThresholdValue = 10
) : IRequest<FMSResponse<List<StockDiscrepancyDTO>>>;

public class GetStockDiscrepanciesQueryHandler : IRequestHandler<GetStockDiscrepanciesQuery, FMSResponse<List<StockDiscrepancyDTO>>> {
    private readonly GpsdataContext _context;
    private readonly ILogger<GetStockDiscrepanciesQueryHandler> _logger;

    public GetStockDiscrepanciesQueryHandler (GpsdataContext context, ILogger<GetStockDiscrepanciesQueryHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<List<StockDiscrepancyDTO>>> Handle (GetStockDiscrepanciesQuery request, CancellationToken cancellationToken) {
        try {
            // Query tanks with their latest volume history
            var tanksQuery = _context.Tanks
                .Include (t => t.Site)
                .AsQueryable ();

            // Apply site filter if specified
            if (request.SiteId.HasValue) {
                tanksQuery = tanksQuery.Where (t => t.SiteId == request.SiteId.Value);
            }

            var tanks = await tanksQuery.ToListAsync (cancellationToken);
            var discrepancies = new List<StockDiscrepancyDTO> ();

            foreach (var tank in tanks) {
                // Get the latest reconciliation date for this tank
                var lastReconciliation = await _context.TankVolumeHistories
                    .Where (tvh => tvh.TankId == tank.Id && tvh.ChangeReason == VolumeChangeReasonEnum.Reconciliation) // Reconciliation enum value
                    .OrderByDescending (tvh => tvh.Timestamp) //Cursor - Fixed to use Timestamp instead of RecordedDate
                    .Select (tvh => tvh.Timestamp) //Cursor - Fixed to use Timestamp instead of RecordedDate
                    .FirstOrDefaultAsync (cancellationToken);

                // Calculate expected stock based on recent transactions since last reconciliation
                var cutoffDate = lastReconciliation != DateTime.MinValue ?
                    lastReconciliation :
                    DateTime.UtcNow.AddDays (-30); // Default to 30 days if no reconciliation

                //Cursor - Improved expected stock calculation - exclude adjustments and reconciliations
                var volumeChanges = await _context.TankVolumeHistories
                    .Where (tvh => tvh.TankId == tank.Id &&
                        tvh.Timestamp > cutoffDate &&
                        tvh.ChangeReason != VolumeChangeReasonEnum.Adjustment &&
                        tvh.ChangeReason != VolumeChangeReasonEnum.Reconciliation) //Cursor - Exclude adjustments and reconciliations from expected calculation
                    .SumAsync (tvh => tvh.VolumeChange ?? 0, cancellationToken);

                // Get the stock at the last reconciliation or opening stock
                var baseStock = await _context.TankVolumeHistories
                    .Where (tvh => tvh.TankId == tank.Id && tvh.Timestamp <= cutoffDate) //Cursor - Fixed to use Timestamp instead of RecordedDate
                    .OrderByDescending (tvh => tvh.Timestamp) //Cursor - Fixed to use Timestamp instead of RecordedDate
                    .Select (tvh => tvh.NewVolume ?? 0)
                    .FirstOrDefaultAsync (cancellationToken);

                var expectedStock = baseStock + volumeChanges;
                var currentStock = tank.CurrentStock ?? 0;
                //Cursor - Fixed discrepancy calculation - use raw difference, not absolute
                var discrepancyVolume = currentStock - expectedStock;

                // Only include discrepancies above threshold or all if threshold is 0
                //Cursor - Use absolute value only for threshold comparison
                if (request.ThresholdValue <= 0 || Math.Abs (discrepancyVolume) >= request.ThresholdValue) {
                    var discrepancy = new StockDiscrepancyDTO {
                    Id = tank.Id,
                    TankId = tank.Id,
                    SiteId = tank.SiteId,
                    TankName = tank.Name ?? $"Tank {tank.Id}",
                    SiteName = tank.Site?.Name ?? $"Site {tank.SiteId}",
                    TankCapacity = tank.TankVolume,
                    CurrentStock = currentStock,
                    ExpectedStock = expectedStock,
                    LastReconciliation = lastReconciliation,
                    //Cursor - Use absolute value for severity determination
                    Severity = DetermineSeverity (Math.Abs (discrepancyVolume), request.ThresholdValue)
                    };

                    discrepancies.Add (discrepancy);
                }
            }

            // Sort by discrepancy volume (highest first)
            var sortedDiscrepancies = discrepancies
                .OrderByDescending (d => Math.Abs (d.DiscrepancyVolume))
                .ToList ();

            _logger.LogInformation ("Found {Count} stock discrepancies above threshold {Threshold}L for SiteId={SiteId}",
                sortedDiscrepancies.Count, request.ThresholdValue, request.SiteId);

            return FMSResponse<List<StockDiscrepancyDTO>>.Success (sortedDiscrepancies,
                $"Found {sortedDiscrepancies.Count} stock discrepancies above threshold {request.ThresholdValue}L");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error retrieving stock discrepancies for SiteId={SiteId}, Threshold={Threshold}",
                request.SiteId, request.ThresholdValue);
            return FMSResponse<List<StockDiscrepancyDTO>>.SystemError ("An error occurred while retrieving stock discrepancies");
        }
    }

    private static string DetermineSeverity (decimal discrepancyVolume, decimal threshold) {
        var absDiscrepancy = Math.Abs (discrepancyVolume);

        return absDiscrepancy
        switch {
            var d when d >= threshold * 2 => "Critical",
                var d when d >= threshold => "Warning",
                    _ => "Normal"
        };
    }
}