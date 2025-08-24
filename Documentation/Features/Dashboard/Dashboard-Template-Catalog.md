# Categorized Dashboard Template Catalog
<!-- markdownlint-disable MD022 MD032 MD031 MD040 MD058 -->

## Purpose
Defines standardized dashboard template domains organized into categories: **Active Alarms**, **Key Statistics**, **Performance Metrics**, and **Fuel Management**. Each category contains multiple ticker templates with specific data sources, aggregation models, time scale support, refresh strategies, permissions, and implementation notes.

## Category-Based Organization

### Active Alarms Category
Real-time monitoring and management of system alerts and notifications.

### Key Statistics Category
Essential operational metrics and KPIs for daily monitoring.

### Performance Metrics Category
Efficiency tracking, trend analysis, and comparative performance data.

### Fuel Management Category
Comprehensive fuel inventory, consumption analysis, and cost management.

## Time Scale Model

| Mode | Description | Typical Domains | Backend Query Pattern | Refresh Guidance |
|------|-------------|-----------------|-----------------------|------------------|
| live | Sub‑minute streaming / push | Active Alerts, Tank Stock (level deltas) | Poll 15–30s now; future: WebSocket/SSE | 15–60s (until push infra) |
| near_real_time | Batched within last hour | Fuel Dispense events, Issue status changes | Incremental window (NOW-1h .. NOW) | 60–300s |
| daily_agg | Pre-aggregated per day | Fuel Consumption, Vehicle Usage, Performance Metrics | GROUP BY date (UTC) | 300–1800s |
| range | Arbitrary custom range (startUtc/endUtc) | All except live-only | Parameterized time bounds | Depends on domain |
| relative | Predefined: today,yesterday,last7d,lastWeek,last30d,thisMonth | All | Map to absolute bounds | Derived from selected preset |

API Query Parameters (standardized):
```
?timeRange=<today|yesterday|last7d|lastWeek|last30d|thisMonth|custom>
&startUtc=<ISO8601?>&endUtc=<ISO8601?>
&live=true|false  (mutually exclusive with start/end custom once push adopted)
&siteIds=1,2&vehicleTypeIds=...&tankIds=... (domain-specific filters)
```

Validation Rules:
- If `timeRange=custom`, both `startUtc` and `endUtc` required.
- If `live=true`, ignore `timeRange` and return last N minutes (server default 5) snapshot slice.
- Reject ranges exceeding domain cap (e.g. 180 days for consumption) with 400.

## Template Schema Extension
Base (from existing ticker config) plus domain attributes:
```json
{
  "tickerType": "fuel_consumption_summary",
  "category": "fuel",
  "aggregationLevel": ["site","vehicleType","vehicle"],
  "timeScaleModes": ["relative","range","daily_agg"],
  "refreshModes": {"default": 300, "min": 60, "max": 1800},
  "metrics": ["totalDispensed","gpsUsed","variance","fuelLost"],
  "dimensions": ["site","vehicleType","vehicle"],
  "defaultVisualization": "stacked_bar",
  "permissions": ["_Read_fueling"],
  "entityRefs": ["Vehicleconsumption", "Fuelrefill"],
  "dataContractsVersion": "1.0"
}
```

## Domain Catalog by Category

### 1. Active Alarms Category

#### Alarm Statistics Ticker
| Template Type | Purpose | Entities / Tables | Primary Metrics | Key Filters | Time Modes | Refresh | Notes |
|---------------|---------|-------------------|-----------------|-------------|-----------|---------|-------|
| alarm_statistics | Current alarm counts by severity | ActiveAlarm | totalActive, critical, high, unacknowledged | siteIds, severityLevel, alarmType | live, relative | 15–60s | Real-time counts with severity breakdown |
| recent_critical_alarms | Latest high-priority alerts | ActiveAlarm | recentAlarms (last 10 critical) | siteIds, lastNHours | live, relative | 15–30s | Focus on actionable critical items |
| alarm_trends | Historical alarm patterns | ActiveAlarm (with timestamps) | alarmsPerDay, avgResolutionTime | siteIds, alarmType | relative, range | 300–600s | Trend analysis for pattern recognition |
| escalated_alarms | Management attention required | ActiveAlarm + EscalationLog | escalatedCount, pendingEscalations | siteIds, escalationLevel | live, relative | 30–60s | Management dashboard focus |

#### Common Aggregation Pattern (Alarms):
```csharp
var alarmStats = context.ActiveAlarms
  .Where(x => x.State == "Active" && siteIds.Contains(x.SiteId))
  .GroupBy(x => x.Priority)
  .Select(g => new { Priority = g.Key, Count = g.Count() });
```

### 2. Key Statistics Category

#### Tank and Transaction Tickers
| Template Type | Purpose | Entities / Tables | Primary Metrics | Key Filters | Time Modes | Refresh | Notes |
|---------------|---------|-------------------|-----------------|-------------|-----------|---------|-------|
| tank_levels | Current tank stock levels | Tank, Tankstock, TankVolumeHistory | volume, capacityPct, status | siteIds, tankIds | live, relative | 15–60s | Real-time vs last reading reconciliation |
| daily_transactions | Today's fuel dispensing activity | Fuelrefill, PumpTransaction | transactionCount, volumeDispensed, revenue | siteIds, transactionType | relative, daily_agg | 60–300s | Focus on current day operations |
| volume_summary | Total volume metrics | Multiple fuel tables | totalDispensed, totalRemaining, turnoverRate | siteIds, fuelType | relative, daily_agg | 60–300s | High-level volume management |
| system_health | Overall system status | SystemStatus, DeviceStatus | onlineDevices, offlineDevices, systemUptime | none (system-wide) | live, relative | 60–300s | Infrastructure monitoring |

### 3. Performance Metrics Category

#### Efficiency and Performance Tickers
| Template Type | Purpose | Entities | Metrics | Filters | Time Modes | Refresh | Notes |
|---------------|---------|----------|---------|---------|-----------|---------|-------|
| fuel_efficiency | Km/L and L/Hr performance | Vehicleconsumption, Expectedaverage | kmPerLiterAvg, literPerHourAvg, variance | siteIds, vehicleTypeIds | daily_agg, relative, range | 300–900s | Core efficiency tracking |
| vehicle_performance | Fleet utilization metrics | Vehicleconsumption | distanceTraveled, engineHours, utilizationRate | siteIds, vehicleTypeIds | daily_agg, relative, range | 300–900s | Fleet management focus |
| weekly_trends | Historical performance patterns | Vehicleconsumption (aggregated) | weeklyAvgKmL, trendDirection, performance | siteIds, vehicleTypeIds | relative, range | 600–1800s | Trend analysis and forecasting |
| expected_vs_actual | Variance analysis | Vehicleconsumption, Expectedaverage | actualVsExpected, variancePct, outliers | siteIds, vehicleTypeIds | daily_agg, relative, range | 600–1800s | Performance gap analysis |

### 4. Fuel Management Category

#### Consumption and Cost Tickers
| Template Type | Purpose | Entities | Metrics | Filters | Time Modes | Refresh | Notes |
|---------------|---------|----------|---------|---------|-----------|---------|-------|
| consumption_summary | Detailed consumption patterns | Vehicleconsumption, Fuelrefill | totalConsumed, consumptionRate, efficiency | siteIds, vehicleTypeIds, fuelType | daily_agg, relative, range | 300–1800s | Comprehensive consumption analysis |
| inventory_status | Stock levels and reorder points | Tank, Tankstock, ReorderThresholds | currentStock, reorderLevel, daysRemaining | siteIds, tankIds, fuelType | live, relative | 60–600s | Inventory management |
| cost_analysis | Fuel costs and budget tracking | Fuelrefill + pricing, CostCenter | totalCost, costPerLiter, budgetVariance | siteIds, costCenter, supplier | daily_agg, relative, range | 600–1800s | Financial management (Manager/Admin only) |
| supply_chain | Delivery and supplier metrics | Intankdelivery, Supplier | deliverySchedule, supplierPerformance, leadTime | siteIds, supplierId | relative, range | 1800–3600s | Supply chain optimization |

## Permissions Matrix (Suggested)
| Template Category | Permission(s) | Default Roles |
|-------------------|---------------|--------------|
| Fuel | _Read_fueling | User/Manager/Admin |
| Vehicle Usage | _Read_vehicle | User/Manager/Admin |
| Performance | _Read_expectedAverage | Manager/Admin |
| Active Alerts | _Read_activeAlarms | Admin/Manager |
| Issue Tracker | _Read_issueTracker | User/Manager/Admin |
| Tank Stock | _Read_tankStock | User/Manager/Admin |
| Cost (Fuel Cost) | _Read_fuelCost | Manager/Admin |

## Refresh Strategy Guidelines
- Live widgets: optimistic 15s poll + jitter (±10%) to prevent thundering herd.
- Daily aggregates: cache key (domain:sites:vehicleTypes:rangeHash) TTL 5–15 min.
- Composite widgets: assemble from cached component queries, not raw tables.

## Caching & Invalidation
| Domain | Cache Layer | Key Components | Invalidation Trigger |
|--------|-------------|---------------|---------------------|
| Fuel Consumption | Memory + Distributed | userId, filterHash, timeHash | New fueling event ingestion |
| Vehicle Usage | Distributed | siteSetHash:dateBucket | End-of-day job / new event batch |
| Performance Metrics | Distributed | vehicleTypeSetHash:dateBucket | Expected average update / new usage batch |
| Active Alerts | Memory | siteSet:severityCounts | Alert state change |
| Issue Tracker | Distributed | siteSet:statusSnapshot | Issue create/close/update |
| Tank Stock | Memory | tankId:lastReading | New telemetry / reconciliation completion |

## Implementation Steps (Per Template)
1. Define ticker/template config JSON and seed in `DashboardTickerTemplates`.
2. Add query handler (CQRS) with standardized filter/time parameter object.
3. Implement repository method with projection DTO (avoid over-fetching navigation props).
4. Add cache layer wrapper (where applicable) using composite key strategy.
5. Expose endpoint: `GET /api/dashboard/data/{templateType}`.
6. Frontend: Add configuration in TICKER_CONFIGS, map filters to UI controls.
7. Connect data hook (useTemplateData) -> builds query string from preferences.
8. Implement skeleton + error states; wire live refresh or interval scheduling.
9. Add unit tests (handler aggregation, variance formulas, permission gating).
10. Document metrics & formulas (this file + code XML comments).

## Metrics & Formula Reference
| Metric | Formula | Notes |
|--------|---------|-------|
| kmPerLiter | totalDistance / (TotalFuel - FuelLost) | Guard divide by zero |
| literPerHour | (TotalFuel - FuelLost) / EngHours | Skip if EngHours < threshold |
| variance (fuel) | (Actual - Expected) / Expected | Clamp expected > 0 |
| capacityPct | volume / capacity * 100 | Use latest tank calibration |
| lossRate | FuelLost / (TotalFuel + FuelLost) | Daily granularity |

## Edge Cases
- Mixed unit assets (distance vs engine hour): split efficiency templates; do not aggregate across incompatible types.
- Sparse data days: return explicit `dataGaps` array for UI shading.
- Clock skew: enforce UTC boundaries server-side; reject client timezone offsets.
- Retroactive corrections (manual adjustments): mark affected days with `revised=true`.

## Data Quality Flags
Return optional flags array per record (e.g. `[{ code: "ESTIMATED_DISTANCE", severity: "low" }]`) to surface estimation or missing sensor scenarios.

## Example Response (Fuel Consumption Variance)
```json
{
  "templateType": "fuel_consumption_variance",
  "timeRange": { "from": "2025-08-01T00:00:00Z", "to": "2025-08-07T23:59:59Z", "preset": "last7d" },
  "grouping": "site",
  "data": [
    { "siteId": 12, "day": "2025-08-01", "actualUsed": 1450.5, "expectedUsed": 1380.0, "variance": 0.0511, "fuelLost": 12.4 },
    { "siteId": 12, "day": "2025-08-02", "actualUsed": 1398.0, "expectedUsed": 1405.0, "variance": -0.0050, "fuelLost": 8.7 }
  ],
  "meta": { "currency": "USD", "revisedDays": ["2025-08-01"], "dataGaps": [] }
}
```

## Linking to Preferences
Preference entry references template by `tickerType`; domain-specific filters stored under a consistent key namespace, e.g.:
```json
{
  "enabledTickers": ["fuel_dispense_summary", "tank_stock_levels"],
  "filters": {
    "global": { "siteIds": [1,2] },
    "fuel_dispense_summary": { "vehicleTypeIds": [3,4] },
    "tank_stock_levels": { "tankIds": [10,11] }
  }
}
```

## Security Considerations
- Enforce filter intersection (requested IDs ⊆ authorized set); reject else 403.
- Cost templates restricted to Manager/Admin.
- Obfuscate internal variance thresholds (no raw expected formula secrets) if proprietary.

## Roadmap Hooks
Future enhancements: switch live templates to push channel, introduce columnar pre-aggregation for heavy variance queries, add anomaly detection tags (AI).

---
This catalog underpins consistent implementation & onboarding for new dashboard templates.
