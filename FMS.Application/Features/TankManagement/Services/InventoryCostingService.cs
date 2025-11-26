using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Threading;
using FMS.Application.Common;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.TankManagement.Services;

//Cursor - Service for handling inventory costing calculations using weighted average method
public class InventoryCostingService
{
    private readonly GpsdataContext _context;
    private readonly ILogger<InventoryCostingService> _logger;

    public InventoryCostingService(
        GpsdataContext context,
        ILogger<InventoryCostingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    //Cursor - Get weighted average cost per liter for a specific tank
    public async Task<FMSResponse<decimal>> GetWeightedAverageCostAsync(int tankId, CancellationToken cancellationToken = default)
    {
        try
        {
            var tank = await _context.Tanks.FindAsync(tankId);
            if (tank == null)
            {
                return FMSResponse<decimal>.Failed("Tank not found");
            }

            // Get recent deliveries (last 60 days or last 15 deliveries)
            var cutoffDate = DateTime.UtcNow.AddDays(-60);

            var deliveries = await _context.Deliveries
                .Where(d => d.TankId == tankId &&
                           d.DeliveryDate >= cutoffDate &&
                           d.PricePerLiter > 0 &&
                           d.ManualDeliveryAmount > 0)
                .OrderByDescending(d => d.DeliveryDate)
                .Take(15)
                .ToListAsync(cancellationToken);

            if (!deliveries.Any())
            {
                // Try to get any historical deliveries
                deliveries = await _context.Deliveries
                    .Where(d => d.TankId == tankId &&
                               d.PricePerLiter > 0 &&
                               d.ManualDeliveryAmount > 0)
                    .OrderByDescending(d => d.DeliveryDate)
                    .Take(10)
                    .ToListAsync(cancellationToken);
            }

            if (!deliveries.Any())
            {
                _logger.LogWarning("No delivery records with pricing found for tank {TankId}", tankId);
                return FMSResponse<decimal>.Success(GetDefaultPricePerLiter(), "Using default price - no delivery history available");
            }

            // Calculate weighted average
            var totalValue = deliveries.Sum(d => d.ManualDeliveryAmount * (d.PricePerLiter ?? 0));
            var totalQuantity = deliveries.Sum(d => d.ManualDeliveryAmount);

            var weightedAverage = totalValue / totalQuantity;

            _logger.LogDebug("Weighted average cost calculated for Tank {TankId}: {Cost} KES/L based on {Count} deliveries",
                tankId, weightedAverage, deliveries.Count);

            return FMSResponse<decimal>.Success(weightedAverage,
                $"Weighted average calculated from {deliveries.Count} recent deliveries");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating weighted average cost for tank {TankId}", tankId);
            return FMSResponse<decimal>.SystemError($"Error calculating weighted average cost: {ex.Message}");
        }
    }

    //Cursor - Get current stock valuation for a tank
    public async Task<FMSResponse<StockValuation>> GetStockValuationAsync(int tankId, decimal? currentStockLiters = null, CancellationToken cancellationToken = default)
    {
        try
        {
            var tank = await _context.Tanks
                .Include(t => t.Site)
                .FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

            if (tank == null)
            {
                return FMSResponse<StockValuation>.Failed("Tank not found");
            }

            // Use provided stock or get current stock from tank
            var stockLiters = currentStockLiters ?? tank.CurrentStock ?? 0;

            var costResponse = await GetWeightedAverageCostAsync(tankId, cancellationToken);
            if (!costResponse.IsSuccess)
            {
                return FMSResponse<StockValuation>.Failed(costResponse.Message);
            }

            var costPerLiter = costResponse.Data;
            var totalValue = stockLiters * costPerLiter;

            var valuation = new StockValuation
            {
                TankId = tankId,
                TankName = tank.Name,
                SiteName = tank.Site?.Name,
                StockLiters = stockLiters,
                CostPerLiter = costPerLiter,
                TotalValue = totalValue,
                Currency = "KES",
                ValuationDate = DateTime.UtcNow,
                Product = await GetTankProductAsync(tankId, cancellationToken)
            };

            return FMSResponse<StockValuation>.Success(valuation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating stock valuation for tank {TankId}", tankId);
            return FMSResponse<StockValuation>.SystemError($"Error calculating stock valuation: {ex.Message}");
        }
    }

    //Cursor - Calculate cost impact of stock movement (consumption/delivery)
    public async Task<FMSResponse<StockMovementCostImpact>> CalculateMovementCostImpactAsync(
        int tankId,
        decimal previousStock,
        decimal currentStock,
        string movementType = "Unknown",
        CancellationToken cancellationToken = default)
    {
        try
        {
            var costResponse = await GetWeightedAverageCostAsync(tankId, cancellationToken);
            if (!costResponse.IsSuccess)
            {
                return FMSResponse<StockMovementCostImpact>.Failed(costResponse.Message);
            }

            var costPerLiter = costResponse.Data;
            var stockMovement = currentStock - previousStock;
            var costImpact = stockMovement * costPerLiter;

            var impact = new StockMovementCostImpact
            {
                TankId = tankId,
                PreviousStockLiters = previousStock,
                CurrentStockLiters = currentStock,
                StockMovementLiters = stockMovement,
                CostPerLiter = costPerLiter,
                PreviousStockValue = previousStock * costPerLiter,
                CurrentStockValue = currentStock * costPerLiter,
                CostImpact = Math.Abs(costImpact),
                MovementType = DetermineMovementType(stockMovement, movementType),
                Currency = "KES",
                CalculationDate = DateTime.UtcNow
            };

            return FMSResponse<StockMovementCostImpact>.Success(impact);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating movement cost impact for tank {TankId}", tankId);
            return FMSResponse<StockMovementCostImpact>.SystemError($"Error calculating cost impact: {ex.Message}");
        }
    }

    //Cursor - Get comprehensive site inventory valuation
    public async Task<FMSResponse<SiteInventoryValuation>> GetSiteInventoryValuationAsync(int siteId, CancellationToken cancellationToken = default)
    {
        try
        {
            var site = await _context.Sites
                .Include(s => s.Tanks)
                .FirstOrDefaultAsync(s => s.Id == siteId, cancellationToken);

            if (site == null)
            {
                return FMSResponse<SiteInventoryValuation>.Failed("Site not found");
            }

            var tankValuations = new List<StockValuation>();
            decimal totalSiteValue = 0;
            decimal totalSiteStock = 0;

            foreach (var tank in site.Tanks)
            {
                var valuationResponse = await GetStockValuationAsync(tank.Id, cancellationToken: cancellationToken);
                if (valuationResponse.IsSuccess)
                {
                    tankValuations.Add(valuationResponse.Data);
                    totalSiteValue += valuationResponse.Data.TotalValue;
                    totalSiteStock += valuationResponse.Data.StockLiters;
                }
            }

            var siteValuation = new SiteInventoryValuation
            {
                SiteId = siteId,
                SiteName = site.Name,
                TankCount = site.Tanks.Count,
                TotalStockLiters = totalSiteStock,
                TotalValue = totalSiteValue,
                WeightedAverageCostPerLiter = totalSiteStock > 0 ? totalSiteValue / totalSiteStock : 0,
                Currency = "KES",
                ValuationDate = DateTime.UtcNow,
                TankValuations = tankValuations
            };

            return FMSResponse<SiteInventoryValuation>.Success(siteValuation);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error calculating site inventory valuation for site {SiteId}", siteId);
            return FMSResponse<SiteInventoryValuation>.SystemError($"Error calculating site valuation: {ex.Message}");
        }
    }

    //Cursor - Private helper methods
    private decimal GetDefaultPricePerLiter()
    {
        // Default price per liter in KES based on current market rates
        return 150.0m; // Approximately 150 KES per liter
    }

    private string DetermineMovementType(decimal movement, string providedType)
    {
        if (providedType != "Unknown") return providedType;

        return movement switch
        {
            > 0 => "Stock Increase (Delivery/Transfer In)",
            < 0 => "Stock Decrease (Sale/Transfer Out)",
            _ => "No Movement"
        };
    }

    private async Task<string> GetTankProductAsync(int tankId, CancellationToken cancellationToken)
    {
        var lastDelivery = await _context.Deliveries
            .Where(d => d.TankId == tankId && !string.IsNullOrEmpty(d.Product))
            .OrderByDescending(d => d.DeliveryDate)
            .FirstOrDefaultAsync(cancellationToken);

        return lastDelivery?.Product ?? "Unknown";
    }
}

//Cursor - Stock valuation model
public class StockValuation
{
    public int TankId { get; set; }
    public string TankName { get; set; }
    public string SiteName { get; set; }
    public decimal StockLiters { get; set; }
    public decimal CostPerLiter { get; set; }
    public decimal TotalValue { get; set; }
    public string Currency { get; set; }
    public DateTime ValuationDate { get; set; }
    public string Product { get; set; }
}

//Cursor - Stock movement cost impact model
public class StockMovementCostImpact
{
    public int TankId { get; set; }
    public decimal PreviousStockLiters { get; set; }
    public decimal CurrentStockLiters { get; set; }
    public decimal StockMovementLiters { get; set; }
    public decimal CostPerLiter { get; set; }
    public decimal PreviousStockValue { get; set; }
    public decimal CurrentStockValue { get; set; }
    public decimal CostImpact { get; set; }
    public string MovementType { get; set; }
    public string Currency { get; set; }
    public DateTime CalculationDate { get; set; }
}

//Cursor - Site inventory valuation model
public class SiteInventoryValuation
{
    public int SiteId { get; set; }
    public string SiteName { get; set; }
    public int TankCount { get; set; }
    public decimal TotalStockLiters { get; set; }
    public decimal TotalValue { get; set; }
    public decimal WeightedAverageCostPerLiter { get; set; }
    public string Currency { get; set; }
    public DateTime ValuationDate { get; set; }
    public List<StockValuation> TankValuations { get; set; } = new();
}