using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.TankStock.Commands;

//Cursor - Command for generating comprehensive stock reports
public class GenerateStockReportCommand : IRequest<FMSResponse<StockReportResultDTO>> {
    public string ReportType { get; set; } = null!; // summary, variance, utilization, movements
    public int? SiteId { get; set; }
    public DateTime StartDate { get; set; }
    public DateTime EndDate { get; set; }
    public bool IncludeCharts { get; set; } = true;
    public bool IncludeDetails { get; set; } = true;
    public List<int> ? TankIds { get; set; }
    public string UserId { get; set; } = null!;
}

public class GenerateStockReportCommandHandler : IRequestHandler<GenerateStockReportCommand, FMSResponse<StockReportResultDTO>> {
    private readonly GpsdataContext _context;
    private readonly ILogger<GenerateStockReportCommandHandler> _logger;

    public GenerateStockReportCommandHandler (GpsdataContext context, ILogger<GenerateStockReportCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponse<StockReportResultDTO>> Handle (GenerateStockReportCommand request, CancellationToken cancellationToken) {
        try {
            //Cursor - Added comprehensive validation
            // Validate input parameters
            if (string.IsNullOrEmpty (request.ReportType)) {
                return FMSResponse<StockReportResultDTO>.Failed ("Report type is required");
            }

            if (string.IsNullOrEmpty (request.UserId)) {
                return FMSResponse<StockReportResultDTO>.Failed ("User ID is required");
            }

            // Validate date range
            if (request.StartDate > request.EndDate) {
                return FMSResponse<StockReportResultDTO>.Failed ("Start date cannot be after end date");
            }

            if (request.StartDate > DateTime.UtcNow) {
                return FMSResponse<StockReportResultDTO>.Failed ("Start date cannot be in the future");
            }

            // Get tanks based on filters
            var tanksQuery = _context.Tanks
                .Include (t => t.Site)
                .Include (t => t.TankVolumeHistories)
                .Include (t => t.Fuelrefils)
                .Include (t => t.Deliveries)
                .AsQueryable ();

            if (request.SiteId.HasValue) {
                tanksQuery = tanksQuery.Where (t => t.SiteId == request.SiteId.Value);
            }

            if (request.TankIds != null && request.TankIds.Any ()) {
                tanksQuery = tanksQuery.Where (t => request.TankIds.Contains (t.Id));
            }

            var tanks = await tanksQuery.ToListAsync (cancellationToken);

            if (!tanks.Any ()) {
                return FMSResponse<StockReportResultDTO>.Failed ("No tanks found for the specified criteria");
            }

            // Generate report based on type
            var reportData = request.ReportType.ToLower () switch {
                "summary" => await GenerateSummaryReport (tanks, request, cancellationToken),
                "variance" => await GenerateVarianceReport (tanks, request, cancellationToken),
                "utilization" => await GenerateUtilizationReport (tanks, request, cancellationToken),
                "movements" => await GenerateMovementReport (tanks, request, cancellationToken),
                _ =>
                throw new ArgumentException ($"Invalid report type: {request.ReportType}")
            };

            //Cursor - Fixed nullable property issues
            var result = new StockReportResultDTO {
                Id = Guid.NewGuid ().ToString (),
                    ReportType = request.ReportType,
                    GeneratedDate = DateTime.UtcNow,
                    GeneratedBy = request.UserId,
                    TotalTanks = tanks.Count,
                    TotalCapacity = tanks.Sum (t => t.TankVolume),
                    TotalCurrentStock = tanks.Sum (t => t.CurrentStock ?? 0),
                    AverageUtilization = tanks.Count > 0 ?
                    tanks.Average (t => {
                        var capacity = t.TankVolume == 0 ? 1 : t.TankVolume;
                        return ((t.CurrentStock ?? 0) / capacity) * 100;
                    }) : 0,
                    Status = "Completed",
                    ReportData = reportData
            };

            _logger.LogInformation ("Stock report generated successfully: {ReportId} of type {ReportType}",
                result.Id, request.ReportType);

            return FMSResponse<StockReportResultDTO>.Success (result, "Stock report generated successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error generating stock report");
            return FMSResponse<StockReportResultDTO>.SystemError ($"Error generating stock report: {ex.Message}");
        }
    }

    private async Task<List<object>> GenerateSummaryReport (List<Tank> tanks, GenerateStockReportCommand request, CancellationToken cancellationToken) {
        var reportData = new List<object> ();

        foreach (var tank in tanks) {
            var volumeHistory = tank.TankVolumeHistories
                .Where (vh => vh.Timestamp >= request.StartDate && vh.Timestamp <= request.EndDate)
                .OrderBy (vh => vh.Timestamp)
                .ToList ();

            var deliveries = await _context.Deliveries
                .Where (d => d.TankId == tank.Id && d.DeliveryDate >= request.StartDate && d.DeliveryDate <= request.EndDate)
                .SumAsync (d => d.ManualDeliveryAmount, cancellationToken);

            var dispensed = await _context.FuelRefills
                .Where (fr => fr.TankId == tank.Id && fr.Date >= request.StartDate && fr.Date <= request.EndDate)
                .SumAsync (fr => fr.ManualFuelrefillAmount, cancellationToken);

            //Cursor - Fixed nullable property issues in summary report
            reportData.Add (new {
                id = tank.Id,
                    name = tank.Name,
                    siteName = tank.Site?.Name,
                    capacity = tank.TankVolume,
                    currentStock = tank.CurrentStock ?? 0,
                    utilization = ((tank.CurrentStock ?? 0) / (tank.TankVolume == 0 ? 1 : tank.TankVolume)) * 100,
                    deliveries = deliveries,
                    dispensed = dispensed,
                    openingStock = volumeHistory.FirstOrDefault ()?.NewVolume ?? (tank.CurrentStock ?? 0),
                    closingStock = volumeHistory.LastOrDefault ()?.NewVolume ?? (tank.CurrentStock ?? 0)
            });
        }

        return reportData;
    }

    private async Task<List<object>> GenerateVarianceReport (List<Tank> tanks, GenerateStockReportCommand request, CancellationToken cancellationToken) {
        var reportData = new List<object> ();

        foreach (var tank in tanks) {
            // Calculate expected stock based on deliveries and dispensing
            var deliveries = await _context.Deliveries
                .Where (d => d.TankId == tank.Id && d.DeliveryDate >= request.StartDate && d.DeliveryDate <= request.EndDate)
                .SumAsync (d => d.ManualDeliveryAmount, cancellationToken);

            var dispensed = await _context.FuelRefills
                .Where (fr => fr.TankId == tank.Id && fr.Date >= request.StartDate && fr.Date <= request.EndDate)
                .SumAsync (fr => fr.ManualFuelrefillAmount, cancellationToken);

            //Cursor - Fixed nullable property issues in variance report
            var openingStock = await _context.TankVolumeHistories
                .Where (vh => vh.TankId == tank.Id && vh.Timestamp < request.StartDate)
                .OrderByDescending (vh => vh.Timestamp)
                .Select (vh => vh.NewVolume)
                .FirstOrDefaultAsync (cancellationToken) ?? (tank.CurrentStock ?? 0);

            var expectedStock = openingStock + deliveries - dispensed;
            var variance = (tank.CurrentStock ?? 0) - expectedStock;

            reportData.Add (new {
                id = tank.Id,
                    name = tank.Name,
                    siteName = tank.Site?.Name,
                    capacity = tank.TankVolume,
                    currentStock = tank.CurrentStock ?? 0,
                    expectedStock = expectedStock,
                    variance = variance,
                    variancePercentage = expectedStock != 0 ? (variance / expectedStock) * 100 : 0,
                    utilization = ((tank.CurrentStock ?? 0) / (tank.TankVolume == 0 ? 1 : tank.TankVolume)) * 100
            });
        }

        return reportData;
    }

    private async Task<List<object>> GenerateUtilizationReport (List<Tank> tanks, GenerateStockReportCommand request, CancellationToken cancellationToken) {
        var reportData = new List<object> ();

        foreach (var tank in tanks) {
            var volumeHistory = await _context.TankVolumeHistories
                .Where (vh => vh.TankId == tank.Id && vh.Timestamp >= request.StartDate && vh.Timestamp <= request.EndDate)
                .OrderBy (vh => vh.Timestamp)
                .ToListAsync (cancellationToken);

            //Cursor - Fixed nullable property issues in utilization report
            var tankCapacity = tank.TankVolume == 0 ? 1 : tank.TankVolume; //Cursor - Avoid division by zero
            var currentStock = tank.CurrentStock ?? 0;

            var avgUtilization = volumeHistory.Any () ?
                volumeHistory.Average (vh => (vh.NewVolume / tankCapacity) * 100) :
                (currentStock / tankCapacity) * 100;

            var maxUtilization = volumeHistory.Any () ?
                volumeHistory.Max (vh => (vh.NewVolume / tankCapacity) * 100) :
                (currentStock / tankCapacity) * 100;

            var minUtilization = volumeHistory.Any () ?
                volumeHistory.Min (vh => (vh.NewVolume / tankCapacity) * 100) :
                (currentStock / tankCapacity) * 100;

            reportData.Add (new {
                id = tank.Id,
                    name = tank.Name,
                    siteName = tank.Site?.Name,
                    capacity = tankCapacity,
                    currentStock = currentStock,
                    utilization = ((currentStock / tankCapacity) * 100),
                    averageUtilization = avgUtilization,
                    maxUtilization = maxUtilization,
                    minUtilization = minUtilization,
                    daysAbove80Percent = volumeHistory.Count (vh => (vh.NewVolume / tankCapacity) * 100 > 80),
                    daysBelow20Percent = volumeHistory.Count (vh => (vh.NewVolume / tankCapacity) * 100 < 20)
            });
        }

        return reportData;
    }

    private async Task<List<object>> GenerateMovementReport (List<Tank> tanks, GenerateStockReportCommand request, CancellationToken cancellationToken) {
        var reportData = new List<object> ();

        foreach (var tank in tanks) {
            var deliveries = await _context.Deliveries
                .Where (d => d.TankId == tank.Id && d.DeliveryDate >= request.StartDate && d.DeliveryDate <= request.EndDate)
                .ToListAsync (cancellationToken);

            var refills = await _context.FuelRefills
                .Where (fr => fr.TankId == tank.Id && fr.Date >= request.StartDate && fr.Date <= request.EndDate)
                .ToListAsync (cancellationToken);

            var adjustments = await _context.StockAdjustments
                .Where (sa => sa.TankId == tank.Id && sa.AdjustmentDate >= request.StartDate && sa.AdjustmentDate <= request.EndDate)
                .ToListAsync (cancellationToken);

            //Cursor - Fixed nullable property issues in movement report
            var deliverySum = deliveries.Sum (d => d.ManualDeliveryAmount);
            var refillSum = refills.Sum (fr => fr.ManualFuelrefillAmount ?? 0);
            var adjustmentSum = adjustments.Sum (a => a.VolumeChange);

            reportData.Add (new {
                id = tank.Id,
                    name = tank.Name,
                    siteName = tank.Site?.Name,
                    capacity = tank.TankVolume,
                    currentStock = tank.CurrentStock ?? 0,
                    utilization = ((tank.CurrentStock ?? 0) / (tank.TankVolume == 0 ? 1 : tank.TankVolume)) * 100,
                    deliveries = deliverySum,
                    deliveryCount = deliveries.Count,
                    dispensed = refillSum,
                    dispensingCount = refills.Count,
                    adjustments = adjustmentSum,
                    adjustmentCount = adjustments.Count,
                    netChange = deliverySum - refillSum + adjustmentSum
            });
        }

        return reportData;
    }
}