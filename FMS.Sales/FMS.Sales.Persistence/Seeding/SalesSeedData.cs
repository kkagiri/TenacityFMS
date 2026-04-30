/*
 * File:          SalesSeedData.cs
 * Purpose:       Seeds default Currencies and the Hybrid Option-3 plan
 *                catalogue (Free / Starter / Growth / Pro / Enterprise) with
 *                multi-currency prices on first startup.
 * Last Modified: 2026-04-29
 */
using FMS.Sales.Domain.Entities;
using FMS.Sales.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FMS.Sales.Persistence.Seeding;

public static class SalesSeedData
{
    public static async Task SeedAsync(SalesDbContext context, CancellationToken ct = default)
    {
        await SeedCurrenciesAsync(context, ct);
        await SeedPlansAsync(context, ct);
        await context.SaveChangesAsync(ct);
    }

    private static async Task SeedCurrenciesAsync(SalesDbContext context, CancellationToken ct)
    {
        if (await context.Currencies.AnyAsync(ct)) return;

        context.Currencies.AddRange(
            new Currency { Code = "USD", Name = "US Dollar",      Symbol = "$",     DecimalDigits = 2 },
            new Currency { Code = "EUR", Name = "Euro",           Symbol = "€",     DecimalDigits = 2 },
            new Currency { Code = "GBP", Name = "Pound Sterling", Symbol = "£",     DecimalDigits = 2 },
            new Currency { Code = "SGD", Name = "Singapore Dollar", Symbol = "S$",  DecimalDigits = 2 },
            new Currency { Code = "MYR", Name = "Malaysian Ringgit", Symbol = "RM", DecimalDigits = 2 },
            new Currency { Code = "IDR", Name = "Indonesian Rupiah", Symbol = "Rp", DecimalDigits = 0 },
            new Currency { Code = "AUD", Name = "Australian Dollar", Symbol = "A$", DecimalDigits = 2 },
            new Currency { Code = "INR", Name = "Indian Rupee",    Symbol = "₹",    DecimalDigits = 2 },
            new Currency { Code = "PHP", Name = "Philippine Peso", Symbol = "₱",    DecimalDigits = 2 },
            new Currency { Code = "THB", Name = "Thai Baht",       Symbol = "฿",    DecimalDigits = 2 }
        );
    }

    private record PlanSeed(
        string Code,
        string Name,
        decimal UsdMonthly,
        int Sites,
        int Users,
        int Devices,
        int Vehicles,
        int RfidTags,
        int PtsPumps,
        int TankSensors,
        int SortOrder,
        bool IsPublic = true);

    private static readonly PlanSeed[] _plans = new[]
    {
        new PlanSeed("free",       "Free",       0,    1, 2,  1,  5,    10,   1,  1,   0),
        new PlanSeed("starter",    "Starter",    99,   1, 5,  5,  50,   100,  4,  4,   1),
        new PlanSeed("growth",     "Growth",     299,  3, 15, 20, 200,  500,  16, 12,  2),
        new PlanSeed("pro",        "Pro",        799,  10,50, 80, 1000, 2500, 40, 20,  3),
        new PlanSeed("enterprise", "Enterprise", 0,    -1,-1,-1, -1,   -1,   -1, -1,  4, false),
    };

    /// <summary>USD per-unit overage prices used for all plans.</summary>
    private static readonly Dictionary<MeterKey, decimal> _overagePerUnitUsd = new()
    {
        [MeterKey.Sites]       = 25m,
        [MeterKey.Users]       = 4m,
        [MeterKey.Devices]     = 8m,
        [MeterKey.Vehicles]    = 1m,
        [MeterKey.RfidTags]    = 0.30m,
        [MeterKey.PtsPumps]    = 12m,
        [MeterKey.TankSensors] = 8m,
    };

    /// <summary>
    /// Approximate FX multipliers for seeding. Finance can edit these later via
    /// the Plans admin UI without redeploying.
    /// </summary>
    private static readonly Dictionary<string, decimal> _fxFromUsd = new()
    {
        ["USD"] = 1m,
        ["EUR"] = 0.92m,
        ["GBP"] = 0.79m,
        ["SGD"] = 1.34m,
        ["MYR"] = 4.70m,
        ["IDR"] = 16500m,
        ["AUD"] = 1.52m,
        ["INR"] = 83m,
        ["PHP"] = 57m,
        ["THB"] = 35m,
    };

    private const decimal AnnualDiscount = 0.85m;

    private static async Task SeedPlansAsync(SalesDbContext context, CancellationToken ct)
    {
        if (await context.Plans.AnyAsync(ct)) return;

        foreach (var seed in _plans)
        {
            var plan = new Plan
            {
                Code = seed.Code,
                Name = seed.Name,
                SortOrder = seed.SortOrder,
                IsActive = true,
                IsPublic = seed.IsPublic,
            };

            plan.Quotas = new List<PlanQuota>
            {
                new() { Metric = MeterKey.Sites,       IncludedUnits = seed.Sites },
                new() { Metric = MeterKey.Users,       IncludedUnits = seed.Users },
                new() { Metric = MeterKey.Devices,     IncludedUnits = seed.Devices },
                new() { Metric = MeterKey.Vehicles,    IncludedUnits = seed.Vehicles },
                new() { Metric = MeterKey.RfidTags,    IncludedUnits = seed.RfidTags },
                new() { Metric = MeterKey.PtsPumps,    IncludedUnits = seed.PtsPumps },
                new() { Metric = MeterKey.TankSensors, IncludedUnits = seed.TankSensors },
            };

            plan.Features = new List<PlanFeature>
            {
                new() { FeatureKey = "hasApi",              FeatureValue = (seed.SortOrder >= 2).ToString().ToLowerInvariant() },
                new() { FeatureKey = "hasRealtime",         FeatureValue = (seed.SortOrder >= 2).ToString().ToLowerInvariant() },
                new() { FeatureKey = "hasAdvancedReports",  FeatureValue = (seed.SortOrder >= 2).ToString().ToLowerInvariant() },
                new() { FeatureKey = "hasSso",              FeatureValue = (seed.SortOrder >= 3).ToString().ToLowerInvariant() },
                new() { FeatureKey = "supportSla",          FeatureValue = seed.SortOrder >= 3 ? "priority" : "standard" },
            };

            // Skip price rows for Enterprise (custom quote)
            if (seed.UsdMonthly > 0 || seed.Code == "free")
            {
                foreach (var (currency, fx) in _fxFromUsd)
                {
                    var monthly = Round(seed.UsdMonthly * fx, currency);
                    plan.Prices.Add(new PlanPrice
                    {
                        CurrencyCode = currency,
                        BillingCycle = BillingCycle.Monthly,
                        Amount = monthly,
                    });
                    plan.Prices.Add(new PlanPrice
                    {
                        CurrencyCode = currency,
                        BillingCycle = BillingCycle.Annual,
                        Amount = Round(monthly * 12 * AnnualDiscount, currency),
                    });

                    foreach (var (metric, usdUnit) in _overagePerUnitUsd)
                    {
                        plan.MeteredPrices.Add(new MeteredPrice
                        {
                            CurrencyCode = currency,
                            Metric = metric,
                            UnitPrice = Round(usdUnit * fx, currency),
                        });
                    }
                }
            }

            context.Plans.Add(plan);
        }
    }

    private static decimal Round(decimal value, string currencyCode)
    {
        var digits = currencyCode == "IDR" ? 0 : 2;
        return Math.Round(value, digits, MidpointRounding.ToEven);
    }
}
