/**
 * File: LiveTripOperationsHtmlTemplate.cs
 * Purpose: Handlebars/HTML template for the live trip operations report.
 * Dependencies: Live trip operations payload from the reporting engine.
 * Last Modified: 2026-03-13
 */
namespace FMS.WebClient.Services.Reporting
{
    internal static class LiveTripOperationsHtmlTemplate
    {
        public static string Get() => @"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>{{reportTitle}} - Hyoung FMS System</title>
    <link href=""https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&display=swap"" rel=""stylesheet"">
    <style>
        :root {
            --ink: #102a43;
            --body: #334e68;
            --muted: #627d98;
            --line: #d9e2ec;
            --paper: #ffffff;
            --canvas: #f8fbff;
            --accent: #0f6cbd;
            --accent-soft: #d9ecfb;
            --good: #137333;
            --good-soft: #e6f4ea;
            --warn: #b54708;
            --warn-soft: #fff3e0;
            --danger: #b42318;
            --danger-soft: #fee4e2;
            --slate: #486581;
            --slate-soft: #eaf2f8;
        }
        * { box-sizing: border-box; }
        body {
            margin: 0;
            background: linear-gradient(180deg, #f4f9ff 0%, #eef4f8 100%);
            font-family: 'Manrope', 'Segoe UI', sans-serif;
            color: var(--body);
            font-size: 12px;
            line-height: 1.5;
        }
        .page {
            width: 1200px;
            margin: 0 auto;
            padding: 28px 30px 36px;
        }
        .hero {
            display: grid;
            grid-template-columns: 1.4fr 0.8fr;
            gap: 16px;
            margin-bottom: 18px;
        }
        .hero-card,
        .panel,
        .summary-card {
            background: rgba(255,255,255,0.96);
            border: 1px solid var(--line);
            border-radius: 18px;
        }
        .hero-card {
            padding: 22px 24px;
            position: relative;
            overflow: hidden;
        }
        .hero-card::after {
            content: '';
            position: absolute;
            right: -30px;
            top: -30px;
            width: 140px;
            height: 140px;
            border-radius: 999px;
            background: radial-gradient(circle, rgba(15,108,189,0.14) 0%, rgba(15,108,189,0) 68%);
        }
        .hero-title {
            font-size: 26px;
            font-weight: 800;
            color: var(--ink);
            margin: 0 0 6px;
        }
        .hero-subtitle {
            margin: 0;
            color: var(--muted);
            max-width: 680px;
        }
        .hero-meta {
            display: grid;
            grid-template-columns: repeat(2, minmax(0, 1fr));
            gap: 10px;
            margin-top: 18px;
        }
        .meta-block {
            padding: 10px 12px;
            border-radius: 12px;
            background: var(--canvas);
            border: 1px solid #e5edf5;
        }
        .meta-label {
            display: block;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            color: var(--muted);
            margin-bottom: 2px;
        }
        .meta-value {
            color: var(--ink);
            font-weight: 700;
        }
        .hero-aside {
            padding: 22px 24px;
            display: flex;
            flex-direction: column;
            justify-content: space-between;
            background: linear-gradient(180deg, #0f6cbd 0%, #155eef 100%);
            color: #ffffff;
        }
        .hero-aside h2 {
            margin: 0;
            font-size: 14px;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            opacity: 0.88;
        }
        .hero-aside strong {
            display: block;
            margin-top: 8px;
            font-size: 28px;
            line-height: 1.15;
        }
        .hero-aside p {
            margin: 8px 0 0;
            font-size: 11px;
            opacity: 0.9;
        }
        .summary-grid {
            display: grid;
            grid-template-columns: repeat(5, minmax(0, 1fr));
            gap: 12px;
            margin-bottom: 18px;
        }
        .summary-card {
            padding: 14px 16px;
            min-height: 108px;
        }
        .summary-card__value {
            font-size: 24px;
            font-weight: 800;
            color: var(--ink);
            line-height: 1.1;
        }
        .summary-card__label {
            margin-top: 6px;
            color: var(--muted);
            font-size: 10px;
            font-weight: 800;
            text-transform: uppercase;
            letter-spacing: 0.08em;
        }
        .summary-card__meta {
            margin-top: 8px;
            font-size: 10.5px;
            color: var(--body);
        }
        .summary-card--accent { background: linear-gradient(180deg, #f8fcff 0%, #eef7ff 100%); }
        .summary-card--good { background: linear-gradient(180deg, #f7fdf8 0%, #edf8ef 100%); }
        .summary-card--warn { background: linear-gradient(180deg, #fffaf5 0%, #fff3e8 100%); }
        .summary-card--danger { background: linear-gradient(180deg, #fff8f8 0%, #fff0ef 100%); }
        .panel {
            margin-bottom: 18px;
            overflow: hidden;
        }
        .panel-head {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding: 14px 18px;
            border-bottom: 1px solid var(--line);
            background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
        }
        .panel-title {
            margin: 0;
            font-size: 14px;
            font-weight: 800;
            color: var(--ink);
        }
        .panel-note {
            font-size: 10.5px;
            color: var(--muted);
        }
        .table-wrap { padding: 0; }
        table {
            width: 100%;
            border-collapse: collapse;
        }
        th {
            background: #f8fbff;
            color: var(--muted);
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.08em;
            text-transform: uppercase;
            text-align: left;
            padding: 11px 14px;
            border-bottom: 1px solid var(--line);
        }
        td {
            padding: 11px 14px;
            border-bottom: 1px solid var(--line);
            vertical-align: top;
        }
        tbody tr:nth-child(even) td { background: #fcfdff; }
        tbody tr:last-child td { border-bottom: none; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .mono { font-variant-numeric: tabular-nums; }
        .route {
            font-weight: 700;
            color: var(--ink);
        }
        .subtle {
            color: var(--muted);
            font-size: 10.5px;
        }
        .pill {
            display: inline-block;
            padding: 3px 9px;
            border-radius: 999px;
            font-size: 10px;
            font-weight: 800;
            letter-spacing: 0.04em;
        }
        .pill--accent { background: var(--accent-soft); color: var(--accent); }
        .pill--good { background: var(--good-soft); color: var(--good); }
        .pill--warn { background: var(--warn-soft); color: var(--warn); }
        .pill--danger { background: var(--danger-soft); color: var(--danger); }
        .pill--slate { background: var(--slate-soft); color: var(--slate); }
        .empty {
            padding: 22px 18px;
            color: var(--muted);
            text-align: center;
        }
        .footer {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            padding-top: 10px;
            color: var(--muted);
            font-size: 10.5px;
        }
    </style>
</head>
<body>
    <div class=""page"">
        <div class=""hero"">
            <div class=""hero-card"">
                <h1 class=""hero-title"">Live Trip Operations</h1>
                <p class=""hero-subtitle"">Operational live view of active fleet movement, trip throughput, tipper cycle activity, and out-of-zone idle exceptions for the selected reporting window.</p>
                <div class=""hero-meta"">
                    <div class=""meta-block""><span class=""meta-label"">Window</span><span class=""meta-value"">{{dateFrom}} to {{dateTo}}</span></div>
                    <div class=""meta-block""><span class=""meta-label"">Idle Threshold</span><span class=""meta-value"">{{idleThresholdMinutes}} minutes</span></div>
                    <div class=""meta-block""><span class=""meta-label"">Generated</span><span class=""meta-value"">{{generatedAt}}</span></div>
                    <div class=""meta-block""><span class=""meta-label"">Report ID</span><span class=""meta-value"">{{reportId}}</span></div>
                </div>
            </div>
            <div class=""hero-aside"">
                <div>
                    <h2>Active Footprint</h2>
                    <strong>{{summary.vehiclesCurrentlyTravelingCount}} travelling</strong>
                    <p>{{summary.activeTripsInProgressCount}} active trips currently in progress across the filtered fleet.</p>
                </div>
                <div>
                    <strong>{{summary.vehiclesIdleOutsideWorkZonesCount}} flagged idle</strong>
                    <p>Vehicles matching the configured idle threshold and outside-zone heuristics.</p>
                </div>
            </div>
        </div>

        <div class=""summary-grid"">
            <div class=""summary-card summary-card--accent""><div class=""summary-card__value"">{{summary.vehiclesCurrentlyTravelingCount}}</div><div class=""summary-card__label"">Vehicles Currently Traveling</div><div class=""summary-card__meta"">{{summary.totalActiveDistanceDisplay}} active distance</div></div>
            <div class=""summary-card summary-card--accent""><div class=""summary-card__value"">{{summary.activeTripsInProgressCount}}</div><div class=""summary-card__label"">Active Trips In Progress</div><div class=""summary-card__meta"">{{summary.totalActiveDurationDisplay}} live duration</div></div>
            <div class=""summary-card summary-card--good""><div class=""summary-card__value"">{{summary.vehiclesWithTripCountsCount}}</div><div class=""summary-card__label"">Vehicles With Trip Counts</div><div class=""summary-card__meta"">{{summary.totalTripGroups}} groups / {{summary.totalTripLegs}} legs</div></div>
            <div class=""summary-card summary-card--good""><div class=""summary-card__value"">{{summary.liveTipperCycleVehicleCount}}</div><div class=""summary-card__label"">Tipper Cycle Vehicles</div><div class=""summary-card__meta"">Live cycle activity in the window</div></div>
            <div class=""summary-card summary-card--danger""><div class=""summary-card__value"">{{summary.vehiclesIdleOutsideWorkZonesCount}}</div><div class=""summary-card__label"">Idle Outside Work Zones</div><div class=""summary-card__meta"">Threshold-based flagged vehicles</div></div>
        </div>

        <div class=""panel"">
            <div class=""panel-head""><h2 class=""panel-title"">Vehicles Currently Traveling</h2><span class=""panel-note"">One row per vehicle with active movement</span></div>
            {{#if travelingVehicles.length}}
            <div class=""table-wrap"">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vehicle</th>
                            <th>Profile</th>
                            <th>Origin</th>
                            <th>Destination</th>
                            <th>Started</th>
                            <th>Last Update</th>
                            <th class=""text-right"">Duration</th>
                            <th class=""text-right"">Distance</th>
                            <th>Confidence</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each travelingVehicles}}
                        <tr>
                            <td class=""mono text-center"">{{rowNumber}}</td>
                            <td><div class=""route"">{{vehicleLabel}}</div><div class=""subtle"">{{numberPlate}}</div></td>
                            <td><span class=""pill pill--accent"">{{movementProfileLabel}}</span><div class=""subtle"">{{detectionMode}}</div></td>
                            <td>{{originDisplayName}}</td>
                            <td>{{destinationDisplayName}}</td>
                            <td class=""mono"">{{startedAtLocal}}</td>
                            <td class=""mono"">{{lastUpdatedAtLocal}}</td>
                            <td class=""text-right mono"">{{durationDisplay}}</td>
                            <td class=""text-right mono"">{{distanceDisplay}}</td>
                            <td><span class=""pill pill--slate"">{{confidenceBand}}</span></td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
            {{else}}
            <div class=""empty"">No vehicles are currently marked as traveling for the selected filters.</div>
            {{/if}}
        </div>

        <div class=""panel"">
            <div class=""panel-head""><h2 class=""panel-title"">Active Trips In Progress</h2><span class=""panel-note"">Detailed active trip state</span></div>
            {{#if activeTrips.length}}
            <div class=""table-wrap"">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vehicle</th>
                            <th>Route</th>
                            <th>Profile</th>
                            <th>Started</th>
                            <th>Last Update</th>
                            <th class=""text-right"">Duration</th>
                            <th class=""text-right"">Distance</th>
                            <th class=""text-right"">Fuel</th>
                            <th>Anomalies</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each activeTrips}}
                        <tr>
                            <td class=""mono text-center"">{{rowNumber}}</td>
                            <td><div class=""route"">{{vehicleLabel}}</div></td>
                            <td>{{routeLabel}}</td>
                            <td><span class=""pill pill--accent"">{{movementProfileLabel}}</span><div class=""subtle"">Out of bounds: {{outOfBoundsLabel}}</div></td>
                            <td class=""mono"">{{startedAtLocal}}</td>
                            <td class=""mono"">{{lastUpdatedAtLocal}}</td>
                            <td class=""text-right mono"">{{durationDisplay}}</td>
                            <td class=""text-right mono"">{{distanceDisplay}}</td>
                            <td class=""text-right mono"">{{fuelConsumedDisplay}}</td>
                            <td><div>{{anomalyFlagsLabel}}</div><div class=""subtle"">{{confidenceBand}}</div></td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
            {{else}}
            <div class=""empty"">No active trips were returned for the selected filters.</div>
            {{/if}}
        </div>

        <div class=""panel"">
            <div class=""panel-head""><h2 class=""panel-title"">Trip Counts Per Vehicle</h2><span class=""panel-note"">Window totals by vehicle</span></div>
            {{#if tripCounts.length}}
            <div class=""table-wrap"">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vehicle</th>
                            <th class=""text-center"">Trip Groups</th>
                            <th class=""text-center"">Trip Legs</th>
                            <th class=""text-center"">Active Trips</th>
                            <th class=""text-center"">Load Cycles</th>
                            <th class=""text-center"">Round Trips</th>
                            <th class=""text-right"">Distance</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each tripCounts}}
                        <tr>
                            <td class=""mono text-center"">{{rowNumber}}</td>
                            <td class=""route"">{{vehicleLabel}}</td>
                            <td class=""text-center mono"">{{tripGroupCount}}</td>
                            <td class=""text-center mono"">{{tripLegCount}}</td>
                            <td class=""text-center mono"">{{activeTripCount}}</td>
                            <td class=""text-center mono"">{{loadCycleCount}}</td>
                            <td class=""text-center mono"">{{roundTripCount}}</td>
                            <td class=""text-right mono"">{{totalDistanceDisplay}}</td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
            {{else}}
            <div class=""empty"">No trip counts were returned for the selected filters.</div>
            {{/if}}
        </div>

        <div class=""panel"">
            <div class=""panel-head""><h2 class=""panel-title"">Live Tipper Cycle Counts</h2><span class=""panel-note"">Cluster / load-cycle activity</span></div>
            {{#if tipperCycles.length}}
            <div class=""table-wrap"">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vehicle</th>
                            <th class=""text-center"">Total Cycles</th>
                            <th class=""text-center"">Completed</th>
                            <th class=""text-center"">Active</th>
                            <th class=""text-right"">Distance</th>
                            <th>Last Cycle Start</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each tipperCycles}}
                        <tr>
                            <td class=""mono text-center"">{{rowNumber}}</td>
                            <td class=""route"">{{vehicleLabel}}</td>
                            <td class=""text-center mono"">{{totalCycleCount}}</td>
                            <td class=""text-center mono"">{{completedCycleCount}}</td>
                            <td class=""text-center mono"">{{activeCycleCount}}</td>
                            <td class=""text-right mono"">{{totalDistanceDisplay}}</td>
                            <td class=""mono"">{{lastCycleStartedAtLocal}}</td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
            {{else}}
            <div class=""empty"">No live tipper cycles were returned for the selected filters.</div>
            {{/if}}
        </div>

        <div class=""panel"">
            <div class=""panel-head""><h2 class=""panel-title"">Vehicles Idle Outside Work Zones</h2><span class=""panel-note"">Flagged using out-of-bounds and off-site idle heuristics</span></div>
            {{#if idleOutsideWorkZones.length}}
            <div class=""table-wrap"">
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Vehicle</th>
                            <th>Location</th>
                            <th>Trip Start</th>
                            <th>Last Update</th>
                            <th class=""text-right"">Idle Time</th>
                            <th>Flag Source</th>
                            <th>Anomalies</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each idleOutsideWorkZones}}
                        <tr>
                            <td class=""mono text-center"">{{rowNumber}}</td>
                            <td class=""route"">{{vehicleLabel}}</td>
                            <td>{{locationDisplayName}}</td>
                            <td class=""mono"">{{startedAtLocal}}</td>
                            <td class=""mono"">{{lastUpdatedAtLocal}}</td>
                            <td class=""text-right mono"">{{idleMinutesDisplay}}</td>
                            <td><span class=""pill pill--danger"">{{flagSource}}</span></td>
                            <td>{{anomalyFlagsLabel}}</td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
            {{else}}
            <div class=""empty"">No vehicles met the idle outside work zones criteria for the selected filters.</div>
            {{/if}}
        </div>

        <div class=""footer"">
            <div>Hyoung Fleet Management System</div>
            <div>Report ID: {{reportId}}</div>
        </div>
    </div>
</body>
</html>";
    }
}