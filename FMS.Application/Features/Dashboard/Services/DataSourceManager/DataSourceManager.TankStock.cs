/**
 * File: DataSourceManager.TankStock.cs
 * Purpose: Provides tank-stock summary dashboard data sources (overview KPIs and critical tank count).
 * Dependencies: GpsdataContext, DataSourceMetadata
 * Last Modified: 2026-03-21
 *
 * Key Functions:
 * - IsTankStockSummaryDataSource(): Detects whether a canonical source key belongs to the tank-stock summary group.
 * - GetTankStockSummaryDataAsync(): Routes tank-stock summary requests to the correct builder.
 * - BuildTankStockOverviewAsync(): Overall tank count, volume, and capacity summary KPIs.
 * - BuildTankCriticalCountAsync(): Count of tanks below critical threshold for alert widgets.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string TankStockOverviewDataSource = "tankstock_overview";
        private const string TankCriticalCountDataSource = "tankstock_critical_count";

        private static readonly string[] TankStockSummaryDataSourceKeys =
        {
            TankStockOverviewDataSource,
            TankCriticalCountDataSource
        };

        private bool IsTankStockSummaryDataSource(string canonicalSource) =>
            TankStockSummaryDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);

        private async Task<object> GetTankStockSummaryDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode)
        {
            return canonicalSource switch
            {
                TankStockOverviewDataSource => await BuildTankStockOverviewAsync(request),
                TankCriticalCountDataSource => await BuildTankCriticalCountAsync(request),
                _ => new { error = $"Unsupported tank stock data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildTankStockOverviewAsync(DashboardMetricRequestDto request)
        {
            var siteIds = request.SiteIds;

            var query = _context.Tanks.AsNoTracking();
            if (siteIds != null && siteIds.Any())
            {
                query = query.Where(t => siteIds.Contains(t.SiteId));
            }

            var tanks = await query
                .Select(t => new
                {
                    t.Id,
                    t.Name,
                    SiteId = t.SiteId,
                    t.TankVolume,
                    t.PhysicalStockValue
                })
                .ToListAsync();

            var totalTanks = tanks.Count;
            var activeTanks = tanks.Count; // All queried tanks are considered active
            var totalCapacity = tanks.Sum(t => t.TankVolume);
            var totalVolume = tanks.Sum(t => t.PhysicalStockValue ?? 0m);

            return new
            {
                current = new
                {
                    value = totalTanks,
                    unit = "tanks",
                    timestamp = DateTime.UtcNow,
                    label = "Total Tanks"
                },
                summary = new
                {
                    totalTanks,
                    activeTanks,
                    totalCapacity = Math.Round(totalCapacity, 2),
                    totalVolume = Math.Round(totalVolume, 2),
                    fillPercentage = totalCapacity > 0
                        ? Math.Round(totalVolume / totalCapacity * 100, 1)
                        : 0m
                },
                metadata = GetDataSourceMetadata(TankStockOverviewDataSource)
            };
        }

        private async Task<object> BuildTankCriticalCountAsync(DashboardMetricRequestDto request)
        {
            var siteIds = request.SiteIds;
            const decimal criticalThresholdPercent = 20m;

            var query = _context.Tanks.AsNoTracking()
                .Where(t => t.TankVolume > 0 && t.PhysicalStockValue != null);

            if (siteIds != null && siteIds.Any())
            {
                query = query.Where(t => siteIds.Contains(t.SiteId));
            }

            var tanks = await query
                .Select(t => new { t.Id, t.Name, t.SiteId, t.TankVolume, t.PhysicalStockValue })
                .ToListAsync();

            var criticalTanks = tanks
                .Where(t => t.TankVolume > 0 && (t.PhysicalStockValue ?? 0m) / t.TankVolume * 100 <= criticalThresholdPercent)
                .Select(t => new
                {
                    id = t.Id,
                    name = t.Name,
                    siteId = t.SiteId,
                    fillPercent = Math.Round((t.PhysicalStockValue ?? 0m) / t.TankVolume * 100, 1)
                })
                .ToList();

            var rows = criticalTanks.Cast<object>().ToList();

            return new
            {
                current = new
                {
                    value = criticalTanks.Count,
                    unit = "tanks",
                    timestamp = DateTime.UtcNow,
                    label = "Critical Tanks"
                },
                summary = new
                {
                    criticalCount = criticalTanks.Count,
                    thresholdPercent = criticalThresholdPercent
                },
                rows,
                items = rows,
                metadata = GetDataSourceMetadata(TankCriticalCountDataSource)
            };
        }
    }
}
