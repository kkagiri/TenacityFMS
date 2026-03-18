/**
 * File: VehicleTripAnalysisHtmlTemplate.cs
 * Purpose: Handlebars/HTML template for the vehicle trip route analysis report.
 * Dependencies: Vehicle trip route-analysis payload from the reporting engine.
 * Last Modified: 2026-03-11
 *
 * Key Sections:
 * - Summary cards for trip, cycle, route, and fuel metrics
 * - Route-level analysis table
 * - Reconciliation and anomaly visibility tables
 * - Planning/readiness section that clearly marks unavailable downstream data
 */
namespace FMS.WebClient.Services.Reporting
{
    internal static class VehicleTripAnalysisHtmlTemplate
    {
        public static string Get() => @"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>{{reportTitle}} - Hyoung FMS System</title>
    <link href=""https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap"" rel=""stylesheet"">
    <style>
        :root {
            --primary: #2563eb;
            --primary-dark: #1d4ed8;
            --primary-light: #dbeafe;
            --surface: #ffffff;
            --bg: #f3f4f6;
            --border: #e5e7eb;
            --text-strong: #111827;
            --text-body: #374151;
            --text-muted: #6b7280;
            --dark-header: #1f2937;
            --success: #15803d;
            --warning: #d97706;
            --danger: #dc2626;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Nunito Sans', 'Segoe UI', Arial, sans-serif;
            background: var(--bg);
            color: var(--text-body);
            font-size: 12px;
            line-height: 1.5;
        }
        .page { max-width: 1200px; margin: 0 auto; padding: 28px 32px 42px; }
        .report-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-end;
            gap: 20px;
            padding-bottom: 18px;
            margin-bottom: 22px;
        }
        .report-title h1 { font-size: 22px; font-weight: 800; color: var(--text-strong); }
        .report-title p { margin-top: 4px; color: var(--text-muted); font-size: 11.5px; }
        .badge-period {
            display: inline-block;
            background: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 700;
            font-size: 10.5px;
            padding: 4px 10px;
            border-radius: 20px;
        }

        .filter-summary,
        .panel {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
        }
        .filter-summary { padding: 14px 16px; margin-bottom: 18px; }
        .panel { padding: 16px; margin-bottom: 18px; }
        .panel-title {
            font-size: 13px;
            font-weight: 800;
            color: var(--text-strong);
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 12px;
        }
        .filter-grid,
        .note-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
            gap: 8px;
        }
        .filter-item,
        .note-item {
            display: flex;
            flex-direction: column;
            gap: 2px;
            min-width: 0;
        }
        .filter-label,
        .note-label {
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: var(--text-muted);
        }
        .filter-value,
        .note-value {
            font-size: 10.5px;
            color: var(--text-body);
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        }

        .summary-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 18px;
        }
        .summary-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
            padding: 14px 16px 12px;
            position: relative;
            overflow: hidden;
        }
        .summary-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: var(--primary);
        }
        .summary-card.success::before { background: var(--success); }
        .summary-card.warning::before { background: var(--warning); }
        .summary-card.danger::before { background: var(--danger); }
        .summary-card .value {
            font-size: 22px;
            font-weight: 800;
            color: var(--text-strong);
            line-height: 1.1;
        }
        .summary-card .label {
            margin-top: 4px;
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: var(--text-muted);
        }
        .summary-card .meta {
            margin-top: 5px;
            font-size: 9px;
            color: var(--text-muted);
        }

        .table-wrapper {
            overflow: hidden;
            border: 1px solid var(--border);
            border-radius: 10px;
            background: var(--surface);
        }
        .data-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 10.8px;
        }
        .data-table thead th {
            background: var(--dark-header);
            color: #e5e7eb;
            padding: 10px 12px;
            text-align: left;
            font-weight: 700;
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.45px;
        }
        .data-table tbody td {
            padding: 9px 12px;
            border-bottom: 1px solid var(--border);
            vertical-align: top;
        }
        .data-table tbody tr:nth-child(even) td { background: #fafafa; }
        .data-table tbody tr:last-child td { border-bottom: none; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .font-bold { font-weight: 700; }
        .text-success { color: var(--success); }
        .text-warning { color: var(--warning); }
        .text-danger { color: var(--danger); }
        .muted { color: var(--text-muted); }
        .chip {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 999px;
            background: #eef2ff;
            color: var(--primary-dark);
            font-size: 9px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.35px;
        }
        .chip.warning { background: #fff7ed; color: var(--warning); }
        .chip.danger { background: #fef2f2; color: var(--danger); }
        .chip.success { background: #f0fdf4; color: var(--success); }
        .status-note {
            border-left: 3px solid var(--warning);
            background: #fffbeb;
            padding: 10px 12px;
            border-radius: 8px;
            font-size: 10.5px;
            color: #92400e;
            margin-top: 12px;
        }
        .empty-state {
            padding: 36px 20px;
            text-align: center;
            color: var(--text-muted);
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 10px;
        }
        .report-footer {
            margin-top: 18px;
            padding-top: 14px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10px;
            color: var(--text-muted);
        }
        .footer-brand { display: flex; align-items: center; gap: 8px; }
        .footer-brand .dot { width: 8px; height: 8px; border-radius: 50%; background: var(--primary); }
        .footer-brand strong { color: var(--text-body); }
    </style>
</head>
<body>
<div class=""page"">
    <div class=""report-header"">
        <div class=""report-title"">
            <h1>Route Analysis</h1>
            <p>Vehicle trip reporting built on persisted trip groups and reconciliation-ready summaries.</p>
        </div>
        <div>
            <span class=""badge-period"">{{dateFrom}} &ndash; {{dateTo}}</span>
        </div>
    </div>

    <div class=""filter-summary"">
        <div class=""panel-title"">Report Parameters</div>
        <div class=""filter-grid"">
            <div class=""filter-item""><span class=""filter-label"">Vehicle</span><span class=""filter-value"">{{vehicleName}}</span></div>
            <div class=""filter-item""><span class=""filter-label"">Site</span><span class=""filter-value"">{{siteName}}</span></div>
            <div class=""filter-item""><span class=""filter-label"">Movement Profile</span><span class=""filter-value"">{{movementProfileLabel}}</span></div>
            <div class=""filter-item""><span class=""filter-label"">Detection Mode</span><span class=""filter-value"">{{detectionModeLabel}}</span></div>
            <div class=""filter-item""><span class=""filter-label"">Reconciliation</span><span class=""filter-value"">{{reconciliationStatusLabel}}</span></div>
            <div class=""filter-item""><span class=""filter-label"">Confidence Filter</span><span class=""filter-value"">{{confidenceFilterLabel}}</span></div>
        </div>
    </div>

    {{#if summary}}
    <div class=""summary-grid"">
        <div class=""summary-card""><div class=""value"">{{summary.totalTripGroups}}</div><div class=""label"">Trip Groups</div><div class=""meta"">{{summary.totalTripLegs}} legs across {{summary.totalVehicles}} vehicles</div></div>
        <div class=""summary-card success""><div class=""value"">{{summary.totalLoadCycles}}</div><div class=""label"">Load Cycles</div><div class=""meta"">{{summary.totalRoundTrips}} round trips</div></div>
        <div class=""summary-card""><div class=""value"">{{summary.totalDistanceKmDisplay}}</div><div class=""label"">Distance</div><div class=""meta"">Avg {{summary.averageDistanceKmDisplay}} per group</div></div>
        <div class=""summary-card""><div class=""value"">{{summary.totalDurationHoursDisplay}}</div><div class=""label"">Duration</div><div class=""meta"">Avg {{summary.averageDurationMinutesDisplay}} per group</div></div>
        <div class=""summary-card success""><div class=""value"">{{summary.totalFuelConsumedDisplay}}</div><div class=""label"">Fuel Captured</div><div class=""meta"">{{summary.fuelBackedGroups}} groups with fuel data</div></div>
        <div class=""summary-card warning""><div class=""value"">{{summary.missingFuelGroups}}</div><div class=""label"">Missing Fuel</div><div class=""meta"">Avg {{summary.averageFuelPerKmDisplay}}</div></div>
        <div class=""summary-card danger""><div class=""value"">{{summary.lowConfidenceGroups}}</div><div class=""label"">Low Confidence</div><div class=""meta"">{{summary.anomalyGroups}} anomaly-tagged groups</div></div>
        <div class=""summary-card warning""><div class=""value"">{{summary.totalRoutes}}</div><div class=""label"">Routes</div><div class=""meta"">Planning linkage: {{summary.planningZoneCoverageDisplay}}</div></div>
    </div>
    {{/if}}

    {{#if routeSummaries}}
    <div class=""panel"">
        <div class=""panel-title"">Route Summary</div>
        <div class=""table-wrapper"">
            <table class=""data-table"">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Route</th>
                        <th>Profile</th>
                        <th>Mode</th>
                        <th class=""text-center"">Vehicles</th>
                        <th class=""text-center"">Groups</th>
                        <th class=""text-center"">Legs</th>
                        <th class=""text-center"">Cycles</th>
                        <th class=""text-right"">Distance</th>
                        <th class=""text-right"">Duration</th>
                        <th class=""text-right"">Fuel</th>
                        <th class=""text-right"">Avg Conf.</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each routeSummaries}}
                    <tr>
                        <td class=""text-center muted"">{{rowNumber}}</td>
                        <td class=""font-bold"">{{routeLabel}}</td>
                        <td>{{movementProfileLabel}}</td>
                        <td>{{detectionMode}}</td>
                        <td class=""text-center"">{{vehicleCount}}</td>
                        <td class=""text-center"">{{tripGroups}}</td>
                        <td class=""text-center"">{{tripLegs}}</td>
                        <td class=""text-center"">{{loadCycles}}</td>
                        <td class=""text-right"">{{totalDistanceKmDisplay}}</td>
                        <td class=""text-right"">{{totalDurationHoursDisplay}}</td>
                        <td class=""text-right"">{{totalFuelConsumedDisplay}}</td>
                        <td class=""text-right"">{{averageConfidenceDisplay}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
    </div>
    {{/if}}

    {{#if reconciliationBreakdown}}
    <div class=""panel"">
        <div class=""panel-title"">Reconciliation Breakdown</div>
        <div class=""table-wrapper"">
            <table class=""data-table"">
                <thead>
                    <tr>
                        <th>Status</th>
                        <th class=""text-center"">Groups</th>
                        <th class=""text-right"">Share</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each reconciliationBreakdown}}
                    <tr>
                        <td class=""font-bold"">{{label}}</td>
                        <td class=""text-center"">{{count}}</td>
                        <td class=""text-right"">{{percentageDisplay}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
    </div>
    {{/if}}

    {{#if anomalyRecords}}
    <div class=""panel"">
        <div class=""panel-title"">Anomaly & Low-Confidence Review</div>
        <div class=""table-wrapper"">
            <table class=""data-table"">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Vehicle</th>
                        <th>Route</th>
                        <th>Date</th>
                        <th class=""text-right"">Confidence</th>
                        <th>Band</th>
                        <th>Reconciliation</th>
                        <th>Anomaly Flags</th>
                        <th class=""text-right"">Distance</th>
                        <th class=""text-right"">Fuel</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each anomalyRecords}}
                    <tr>
                        <td class=""text-center muted"">{{rowNumber}}</td>
                        <td class=""font-bold"">{{vehicleLabel}}</td>
                        <td>{{routeLabel}}</td>
                        <td>{{tripDateLabel}}</td>
                        <td class=""text-right"">{{confidenceScoreDisplay}}</td>
                        <td>{{confidenceBand}}</td>
                        <td>{{reconciliationStatusLabel}}</td>
                        <td>{{anomalyFlagsLabel}}</td>
                        <td class=""text-right"">{{totalDistanceKmDisplay}}</td>
                        <td class=""text-right"">{{totalFuelConsumedDisplay}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
    </div>
    {{/if}}

    {{#if records}}
    <div class=""panel"">
        <div class=""panel-title"">Trip Group Detail</div>
        <div class=""table-wrapper"">
            <table class=""data-table"">
                <thead>
                    <tr>
                        <th>#</th>
                        <th>Vehicle</th>
                        <th>Route</th>
                        <th>Trip Date</th>
                        <th>Start</th>
                        <th>End</th>
                        <th class=""text-center"">Legs</th>
                        <th class=""text-center"">Type</th>
                        <th class=""text-right"">Distance</th>
                        <th class=""text-right"">Duration</th>
                        <th class=""text-right"">Fuel</th>
                        <th class=""text-right"">Confidence</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each records}}
                    <tr>
                        <td class=""text-center muted"">{{rowNumber}}</td>
                        <td class=""font-bold"">{{vehicleLabel}}</td>
                        <td>
                            <div>{{routeLabel}}</div>
                            <div class=""muted"">{{movementProfileLabel}} · {{detectionMode}}</div>
                        </td>
                        <td>{{tripDateLabel}}</td>
                        <td>{{startTimeLocal}}</td>
                        <td>{{endTimeLocal}}</td>
                        <td class=""text-center"">{{tripCount}}</td>
                        <td>{{groupingTypeLabel}}</td>
                        <td class=""text-right"">{{totalDistanceKmDisplay}}</td>
                        <td class=""text-right"">{{totalDurationDisplay}}</td>
                        <td class=""text-right"">{{totalFuelConsumedDisplay}}</td>
                        <td class=""text-right"">
                            {{confidenceScoreDisplay}}
                            {{#if isLowConfidence}}
                            <div><span class=""chip warning"">Low</span></div>
                            {{/if}}
                        </td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
    </div>
    {{/if}}

    {{#if readinessRows}}
    <div class=""panel"">
        <div class=""panel-title"">Planning, Out-of-Bounds & Production Readiness</div>
        <div class=""table-wrapper"">
            <table class=""data-table"">
                <thead>
                    <tr>
                        <th>Reporting Area</th>
                        <th>Status</th>
                        <th>Detail</th>
                    </tr>
                </thead>
                <tbody>
                    {{#each readinessRows}}
                    <tr>
                        <td class=""font-bold"">{{reportingArea}}</td>
                        <td><span class=""chip warning"">{{status}}</span></td>
                        <td>{{detail}}</td>
                    </tr>
                    {{/each}}
                </tbody>
            </table>
        </div>
        <div class=""status-note"">
            Production is intentionally shown as unavailable until payload, tonnage, or standard cycle quantity data is added to the trip/reporting contract.
        </div>
    </div>
    {{/if}}

    {{#unless records}}
    <div class=""empty-state""><p>No persisted trip groups were returned for the selected filters.</p></div>
    {{/unless}}

    <div class=""report-footer"">
        <div class=""footer-brand""><span class=""dot""></span><span><strong>Hyoung Fleet Management</strong></span></div>
        <div>Report ID: {{reportId}}</div>
    </div>
</div>
</body>
</html>";
    }
}