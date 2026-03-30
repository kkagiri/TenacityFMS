/**
 * File: MonthlyFleetReportHtmlTemplate.cs
 * Purpose: Embedded HTML template for the monthly fleet executive PDF report.
 * Dependencies: None
 * Last Modified: 2026-03-29
 *
 * Key Functions:
 * - Get(): Returns the Handlebars HTML template for monthly fleet executive reporting
 */
namespace FMS.WebClient.Services.Reporting
{
    internal static class MonthlyFleetReportHtmlTemplate
    {
        public static string Get() => @"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>{{reportTitle}}</title>
    <style>
        @page { size: A4 landscape; margin: 10mm; }
        * { box-sizing: border-box; }
        body { margin: 0; font-family: 'Segoe UI', Arial, sans-serif; color: #201f1e; background: #f5f5f5; }
        .page { page-break-after: always; min-height: 186mm; padding: 14px 18px; background: #ffffff; }
        .page:last-child { page-break-after: avoid; }
        .cover { background: linear-gradient(135deg, #0f172a 0%, #123a66 48%, #0078d4 100%); color: #ffffff; position: relative; overflow: hidden; }
        .cover:before, .cover:after { content: ''; position: absolute; border-radius: 999px; opacity: 0.12; background: #ffffff; }
        .cover:before { width: 260px; height: 260px; top: -60px; right: -30px; }
        .cover:after { width: 180px; height: 180px; bottom: -50px; left: -20px; }
        .cover-logo { width: 58px; height: 58px; border-radius: 14px; background: rgba(255,255,255,0.92); color: #0078d4; display: flex; align-items: center; justify-content: center; font-size: 19px; font-weight: 800; margin-bottom: 20px; }
        .cover-grid { display: grid; grid-template-columns: 1.3fr 1fr; gap: 18px; position: relative; z-index: 1; }
        .cover-meta { padding-top: 8px; }
        h1 { margin: 0 0 10px; font-size: 30px; line-height: 1.1; }
        h2 { margin: 0; font-size: 17px; }
        h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        p { margin: 0; }
        .subtitle { color: rgba(255,255,255,0.82); font-size: 12px; max-width: 440px; line-height: 1.5; }
        .period-badge { display: inline-block; margin: 14px 0 18px; padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); font-size: 11px; font-weight: 700; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .kpi-card { border: 1px solid #edebe9; border-radius: 10px; padding: 12px; background: #ffffff; min-height: 78px; }
        .cover .kpi-card { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.16); }
        .kpi-value { font-size: 17px; font-weight: 800; line-height: 1.2; }
        .kpi-label { margin-top: 5px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.55px; color: #605e5c; }
        .cover .kpi-label { color: rgba(255,255,255,0.72); }
        .kpi-note { margin-top: 6px; font-size: 9px; color: #8a8886; }
        .cover .kpi-note { color: rgba(255,255,255,0.62); }
        .filter-panel { background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; padding: 14px; }
        .filter-item { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.10); font-size: 10px; }
        .filter-item:last-child { border-bottom: none; }
        .section-header { display: flex; justify-content: space-between; align-items: end; gap: 12px; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 2px solid #edebe9; }
        .section-title { font-size: 16px; font-weight: 700; }
        .section-tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.55px; color: #605e5c; font-weight: 700; }
        .banner { padding: 9px 12px; border: 1px solid #bfd7f6; background: #edf5ff; color: #0f3a63; border-radius: 8px; font-size: 10px; margin-bottom: 12px; }
        .narrative { border: 1px solid #d7e7f8; background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%); border-radius: 10px; padding: 12px 14px; line-height: 1.6; font-size: 10px; margin-bottom: 12px; }
        .grid-2 { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .panel { border: 1px solid #edebe9; border-radius: 10px; background: #ffffff; padding: 12px; }
        .panel-soft { background: #faf9f8; }
        .list-card { border: 1px solid #edebe9; border-radius: 10px; background: #ffffff; padding: 10px 12px; }
        .list-row { margin-bottom: 9px; }
        .list-row:last-child { margin-bottom: 0; }
        .list-topline { display: flex; justify-content: space-between; gap: 10px; font-size: 10px; margin-bottom: 5px; }
        .bar-track { height: 7px; border-radius: 999px; background: #f3f2f1; overflow: hidden; }
        .bar-fill { height: 100%; border-radius: 999px; background: linear-gradient(90deg, #0078d4 0%, #3aa0ff 100%); }
        .note-list { margin: 0; padding-left: 16px; font-size: 10px; line-height: 1.5; }
        .note-list li { margin-bottom: 4px; }
        .table-wrap { border: 1px solid #edebe9; border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th, td { border: 1px solid #edebe9; padding: 6px 7px; vertical-align: top; }
        th { background: #0f172a; color: #ffffff; text-transform: uppercase; letter-spacing: 0.45px; font-size: 8px; }
        td strong { font-weight: 700; }
        .mini-note { font-size: 9px; color: #605e5c; line-height: 1.5; }
        .footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; font-size: 9px; color: #605e5c; }
        .footer strong { color: #201f1e; }
        .tagline { margin-top: 10px; font-size: 11px; color: rgba(255,255,255,0.72); max-width: 540px; line-height: 1.5; }
    </style>
</head>
<body>
    <div class=""page cover"">
        <div class=""cover-grid"">
            <div class=""cover-meta"">
                <div class=""cover-logo"">HY</div>
                <h1>{{reportTitle}}</h1>
                <p class=""subtitle"">{{reportSubtitle}}</p>
                <div class=""period-badge"">{{periodBadge}}</div>
                <div class=""kpi-grid"">{{#each coverKpis}}<div class=""kpi-card""><div class=""kpi-value"">{{value}}</div><div class=""kpi-label"">{{label}}</div></div>{{/each}}</div>
                <p class=""tagline"">This executive pack combines persisted vehicle consumption, expected-average assignments, and tank ledger movement to present a month-close fleet and stock view in A4 landscape format.</p>
            </div>
            <div class=""filter-panel"">
                {{#each filterSummary}}<div class=""filter-item""><strong>{{label}}</strong><span>{{value}}</span></div>{{/each}}
                <div class=""filter-item""><strong>Generated</strong><span>{{generatedAt}}</span></div>
                <div class=""filter-item""><strong>Confidentiality</strong><span>{{confidentialityLabel}}</span></div>
            </div>
        </div>
        <div class=""footer""><span>{{reportSubtitle}}</span><strong>{{reportId}}</strong></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 1 — Executive Summary</div><div class=""section-tag"">{{periodLabel}}</div></div>
        <div class=""banner"">Payload status: {{implementationStatus}}. Values on this report are sourced from persisted vehicle consumption, expected averages, and tank movement records.</div>
        <div class=""kpi-grid"">{{#each executiveKpis}}<div class=""kpi-card""><div class=""kpi-value"">{{value}}</div><div class=""kpi-label"">{{label}}</div><div class=""kpi-note"">{{note}}</div></div>{{/each}}</div>
        <div class=""grid-2"">
            <div>
                <div class=""narrative"">{{executiveNarrative}}</div>
                <div class=""table-wrap""><table><thead><tr><th>Month</th><th>Fuel Used</th><th>GPS Distance</th><th>Fuel Issued</th><th>Fuel Received</th><th>Engine Hrs</th><th>Fuel Lost</th><th>% Lost</th><th>km/L</th><th>Exp km/L</th><th>L/hr</th><th>Exp L/hr</th></tr></thead><tbody>{{#each monthlyMatrix}}<tr><td><strong>{{month}}</strong></td><td>{{fuelUsed}}</td><td>{{gpsDistance}}</td><td>{{fuelIssued}}</td><td>{{fuelReceived}}</td><td>{{engineHours}}</td><td>{{fuelLost}}</td><td>{{fuelLostPercent}}</td><td>{{kmPerLiter}}</td><td>{{expectedKmPerLiter}}</td><td>{{litersPerHour}}</td><td>{{expectedLitersPerHour}}</td></tr>{{/each}}</tbody></table></div>
            </div>
            <div class=""panel panel-soft"">
                <h3>Reporting Notes</h3>
                <ul class=""note-list"">{{#each chartNotes}}<li>{{this}}</li>{{/each}}</ul>
                <div style=""height:10px""></div>
                <h3>Top Sites This Month</h3>
                {{#each fleetHighlights.topSites}}<div class=""list-row""><div class=""list-topline""><span>{{siteName}}</span><strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Issued {{issued}} | Delivered {{delivered}}</div><div class=""bar-track""><div class=""bar-fill"" style=""width: {{shareWidth}};""></div></div></div>{{/each}}
            </div>
        </div>
        <div class=""footer""><span>{{reportSubtitle}}</span><span>Page 1 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 2 — Stock Analysis</div><div class=""section-tag"">Tank Ledger Movement</div></div>
        <div class=""grid-2"">
            <div>
                <div class=""table-wrap""><table><thead><tr><th>Site</th><th>Delivered</th><th>Issued</th><th>Fuel Lost</th></tr></thead><tbody>{{#each stockSitePairs}}<tr><td><strong>{{siteName}}</strong></td><td>{{delivered}}</td><td>{{issued}}</td><td>{{fuelLost}}</td></tr>{{/each}}</tbody></table></div>
                <div class=""narrative"">Deliveries and issues on this page are taken directly from tank volume history, with transfer movement excluded so that stock movement reflects receipt and dispensing only.</div>
            </div>
            <div class=""grid-3"">{{#each stockHighlights}}<div class=""list-card""><h3>{{siteName}}</h3><div class=""mini-note"">Fuel Used: <strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Issued: <strong>{{issued}}</strong></div><div class=""mini-note"">Delivered: <strong>{{delivered}}</strong></div><div class=""mini-note"">Share: <strong>{{sharePercent}}</strong></div><div class=""bar-track"" style=""margin-top:8px""><div class=""bar-fill"" style=""width: {{shareWidth}};""></div></div></div>{{/each}}</div>
        </div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 2 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 3 — Light Vehicle Fuel & Loss</div><div class=""section-tag"">km/L Fleet Segment</div></div>
        {{#each lvFuelMatrix}}<div class=""table-wrap""><table><thead><tr><th colspan=""4"">{{siteName}}</th></tr><tr><th>Vehicle Type</th><th>Fuel Used</th><th>Fuel Lost</th><th>Loss %</th></tr></thead><tbody>{{#each rows}}<tr><td><strong>{{vehicleType}}</strong></td>{{#each metrics}}<td>{{value}}</td>{{/each}}</tr>{{/each}}</tbody></table></div>{{/each}}
        <div class=""footer""><span>{{reportId}}</span><span>Page 3 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 4 — Light Vehicle Efficiency</div><div class=""section-tag"">Actual vs Expected</div></div>
        <div class=""grid-2"">
            <div>{{#each lvEfficiencyMatrix}}<div class=""table-wrap""><table><thead><tr><th colspan=""4"">{{siteName}}</th></tr><tr><th>Vehicle Type</th><th>Actual km/L</th><th>Expected km/L</th><th>Variance</th></tr></thead><tbody>{{#each rows}}<tr><td><strong>{{vehicleType}}</strong></td>{{#each metrics}}<td>{{value}}</td>{{/each}}</tr>{{/each}}</tbody></table></div>{{/each}}</div>
            <div class=""panel panel-soft"">
                <h3>Leading Light Vehicle Types</h3>
                {{#each fleetHighlights.topLightVehicleTypes}}<div class=""list-row""><div class=""list-topline""><span>{{typeName}}</span><strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Efficiency {{efficiency}} | Expected {{expected}} | Units {{unitCount}}</div><div class=""bar-track""><div class=""bar-fill"" style=""width: {{shareWidth}};""></div></div></div>{{/each}}
            </div>
        </div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 4 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 5 — Light Vehicle Distance</div><div class=""section-tag"">Distance Productivity</div></div>
        {{#each lvDistanceMatrix}}<div class=""table-wrap""><table><thead><tr><th colspan=""4"">{{siteName}}</th></tr><tr><th>Vehicle Type</th><th>Total Distance</th><th>Avg km / Day</th><th>Unit Count</th></tr></thead><tbody>{{#each rows}}<tr><td><strong>{{vehicleType}}</strong></td>{{#each metrics}}<td>{{value}}</td>{{/each}}</tr>{{/each}}</tbody></table></div>{{/each}}
        <div class=""footer""><span>{{reportId}}</span><span>Page 5 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 6 — Heavy Equipment Overview</div><div class=""section-tag"">L/hr Fleet Segment</div></div>
        <div class=""grid-3"">{{#each fleetHighlights.topHeavyEquipmentTypes}}<div class=""list-card""><h3>{{typeName}}</h3><div class=""mini-note"">Fuel Used <strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Efficiency <strong>{{efficiency}}</strong></div><div class=""mini-note"">Expected <strong>{{expected}}</strong></div><div class=""mini-note"">Units <strong>{{unitCount}}</strong></div><div class=""bar-track"" style=""margin-top:8px""><div class=""bar-fill"" style=""width: {{shareWidth}};""></div></div></div>{{/each}}</div>
        <div class=""narrative"">Heavy-equipment segmentation is based on the persisted km/L mode flags, not on the vehicle-type label alone. This avoids misclassifying types whose naming does not match their configured consumption mode.</div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 6 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 7 — Heavy Equipment Fuel & Loss</div><div class=""section-tag"">Actual vs Expected L/hr</div></div>
        {{#each heFuelLostMatrix}}<div class=""table-wrap""><table><thead><tr><th colspan=""4"">{{siteName}}</th></tr><tr><th>Vehicle Type</th><th>Actual L/hr</th><th>Expected L/hr</th><th>Fuel Lost</th></tr></thead><tbody>{{#each rows}}<tr><td><strong>{{vehicleType}}</strong></td>{{#each metrics}}<td>{{value}}</td>{{/each}}</tr>{{/each}}</tbody></table></div>{{/each}}
        <div class=""footer""><span>{{reportId}}</span><span>Page 7 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 8 — Heavy Equipment Engine Hours</div><div class=""section-tag"">Utilization</div></div>
        {{#each heEngineHoursMatrix}}<div class=""table-wrap""><table><thead><tr><th colspan=""4"">{{siteName}}</th></tr><tr><th>Vehicle Type</th><th>Total Hours</th><th>Avg Hours / Unit</th><th>Unit Count</th></tr></thead><tbody>{{#each rows}}<tr><td><strong>{{vehicleType}}</strong></td>{{#each metrics}}<td>{{value}}</td>{{/each}}</tr>{{/each}}</tbody></table></div>{{/each}}
        <div class=""footer""><span>{{reportId}}</span><span>Page 8 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 9 — Heavy Equipment Efficiency</div><div class=""section-tag"">Variance Watchlist</div></div>
        {{#each heEfficiencyMatrix}}<div class=""table-wrap""><table><thead><tr><th colspan=""4"">{{siteName}}</th></tr><tr><th>Vehicle Type</th><th>Actual L/hr</th><th>Expected L/hr</th><th>Variance</th></tr></thead><tbody>{{#each rows}}<tr><td><strong>{{vehicleType}}</strong></td>{{#each metrics}}<td>{{value}}</td>{{/each}}</tr>{{/each}}</tbody></table></div>{{/each}}
        <div class=""footer""><span>{{reportId}}</span><span>Page 9 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 10 — Site Usage Matrix</div><div class=""section-tag"">Last 3 Months</div></div>
        <div class=""table-wrap""><table><thead><tr><th>Site</th><th>Month</th><th>LV Eff</th><th>HE Eff</th><th>Fuel Lost</th><th>Distance</th><th>Engine Hours</th><th>Total Fuel</th></tr></thead><tbody>{{#each siteUsageMatrix}}{{#each months}}<tr><td><strong>{{../siteName}}</strong></td><td>{{month}}</td><td>{{lvEfficiency}}</td><td>{{heEfficiency}}</td><td>{{fuelLost}}</td><td>{{distance}}</td><td>{{engineHours}}</td><td>{{totalFuel}}</td></tr>{{/each}}{{/each}}</tbody></table></div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 10 of 11</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 11 — Executive Takeaways</div><div class=""section-tag"">Portfolio View</div></div>
        <div class=""grid-3"">
            <div class=""panel panel-soft""><h3>Top Sites</h3>{{#each fleetHighlights.topSites}}<div class=""list-row""><div class=""list-topline""><span>{{siteName}}</span><strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Issued {{issued}} | Delivered {{delivered}}</div></div>{{/each}}</div>
            <div class=""panel panel-soft""><h3>Top Light Vehicle Types</h3>{{#each fleetHighlights.topLightVehicleTypes}}<div class=""list-row""><div class=""list-topline""><span>{{typeName}}</span><strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel {{fuelUsed}} | Expected {{expected}}</div></div>{{/each}}</div>
            <div class=""panel panel-soft""><h3>Top Heavy Equipment Types</h3>{{#each fleetHighlights.topHeavyEquipmentTypes}}<div class=""list-row""><div class=""list-topline""><span>{{typeName}}</span><strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel {{fuelUsed}} | Expected {{expected}}</div></div>{{/each}}</div>
        </div>
        <div class=""narrative"">This report is designed for executive PDF circulation. It preserves a fixed A4 landscape book structure while sourcing its figures from the current persistence layer instead of static placeholders.</div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 11 of 11</span></div>
    </div>
</body>
</html>";
    }
}
