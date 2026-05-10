/**
 * File: WeeklyFleetReportHtmlTemplate.cs
 * Purpose: Embedded HTML template for the weekly fleet executive PDF report.
 * Dependencies: None
 * Last Modified: 2026-03-28
 *
 * Key Functions:
 * - Get(): Returns the Handlebars HTML template for weekly fleet executive reporting
 */
namespace FMS.WebClient.Services.Reporting
{
    internal static class WeeklyFleetReportHtmlTemplate
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
        .cover { background: linear-gradient(135deg, #08131f 0%, #0f3a63 52%, #0078d4 100%); color: #ffffff; }
        .cover-logo { width: 58px; height: 58px; border-radius: 14px; background: rgba(255,255,255,0.92); color: #0078d4; display: flex; align-items: center; justify-content: center; font-size: 19px; font-weight: 800; margin-bottom: 18px; }
        .cover-grid { display: grid; grid-template-columns: 1.2fr 1fr; gap: 18px; }
        h1 { margin: 0 0 10px; font-size: 30px; line-height: 1.1; }
        h2 { margin: 0; font-size: 17px; }
        h3 { margin: 0 0 8px; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; }
        .subtitle { color: rgba(255,255,255,0.82); font-size: 12px; max-width: 440px; line-height: 1.5; }
        .period-badge { display: inline-block; margin: 14px 0 18px; padding: 7px 14px; border-radius: 999px; background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.25); font-size: 11px; font-weight: 700; }
        .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 10px; }
        .kpi-card { border: 1px solid #edebe9; border-radius: 10px; padding: 12px; background: #ffffff; min-height: 78px; }
        .cover .kpi-card { background: rgba(255,255,255,0.10); border-color: rgba(255,255,255,0.16); }
        .kpi-value { font-size: 17px; font-weight: 800; line-height: 1.2; }
        .kpi-label { margin-top: 5px; font-size: 9px; text-transform: uppercase; letter-spacing: 0.55px; color: #605e5c; }
        .cover .kpi-label { color: rgba(255,255,255,0.72); }
        .section-header { display: flex; justify-content: space-between; align-items: end; gap: 12px; padding-bottom: 8px; margin-bottom: 12px; border-bottom: 2px solid #edebe9; }
        .section-title { font-size: 16px; font-weight: 700; }
        .section-tag { font-size: 10px; text-transform: uppercase; letter-spacing: 0.55px; color: #605e5c; font-weight: 700; }
        .banner { padding: 9px 12px; border: 1px solid #bfd7f6; background: #edf5ff; color: #0f3a63; border-radius: 8px; font-size: 10px; margin-bottom: 12px; }
        .narrative { border: 1px solid #d7e7f8; background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%); border-radius: 10px; padding: 12px 14px; line-height: 1.6; font-size: 10px; margin-bottom: 12px; }
        .grid-2 { display: grid; grid-template-columns: 1.1fr 0.9fr; gap: 12px; }
        .grid-3 { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
        .panel { border: 1px solid #edebe9; border-radius: 10px; background: #ffffff; padding: 12px; }
        .panel-soft { background: #faf9f8; }
        .table-wrap { border: 1px solid #edebe9; border-radius: 10px; overflow: hidden; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; font-size: 9px; }
        th, td { border: 1px solid #edebe9; padding: 6px 7px; vertical-align: top; }
        th { background: #0f172a; color: #ffffff; text-transform: uppercase; letter-spacing: 0.45px; font-size: 8px; }
        .list-card { border: 1px solid #edebe9; border-radius: 10px; background: #ffffff; padding: 10px 12px; }
        .list-row { margin-bottom: 9px; }
        .list-row:last-child { margin-bottom: 0; }
        .list-topline { display: flex; justify-content: space-between; gap: 10px; font-size: 10px; margin-bottom: 4px; }
        .mini-note { font-size: 9px; color: #605e5c; line-height: 1.5; }
        .footer { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 10px; font-size: 9px; color: #605e5c; }
        .filter-panel { background: rgba(255,255,255,0.10); border: 1px solid rgba(255,255,255,0.14); border-radius: 12px; padding: 14px; }
        .filter-item { display: flex; justify-content: space-between; gap: 12px; padding: 6px 0; border-bottom: 1px solid rgba(255,255,255,0.10); font-size: 10px; }
        .filter-item:last-child { border-bottom: none; }
    </style>
</head>
<body>
    <div class=""page cover"">
        <div class=""cover-grid"">
            <div>
                <div class=""cover-logo"">HY</div>
                <h1>{{reportTitle}}</h1>
                <p class=""subtitle"">{{reportSubtitle}}</p>
                <div class=""period-badge"">{{periodBadge}}</div>
                <div class=""kpi-grid"">{{#each coverKpis}}<div class=""kpi-card""><div class=""kpi-value"">{{value}}</div><div class=""kpi-label"">{{label}}</div></div>{{/each}}</div>
            </div>
            <div class=""filter-panel"">{{#each filterSummary}}<div class=""filter-item""><strong>{{label}}</strong><span>{{value}}</span></div>{{/each}}<div class=""filter-item""><strong>Generated</strong><span>{{generatedAt}}</span></div><div class=""filter-item""><strong>Confidentiality</strong><span>{{confidentialityLabel}}</span></div></div>
        </div>
        <div class=""footer""><span>{{reportSubtitle}}</span><strong>{{reportId}}</strong></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 1 — Executive Weekly Summary</div><div class=""section-tag"">{{periodLabel}}</div></div>
        <div class=""banner"">Weekly buckets are computed from the persisted current-month vehicle and tank rows, preserving receipt and issue movement separately from transfer movement.</div>
        <div class=""kpi-grid"">{{#each executiveKpis}}<div class=""kpi-card""><div class=""kpi-value"">{{value}}</div><div class=""kpi-label"">{{label}}</div></div>{{/each}}</div>
        <div class=""grid-2"">
            <div>
                <div class=""narrative"">{{weeklyNarrative}}</div>
                <div class=""table-wrap""><table><thead><tr><th>Week</th><th>Start</th><th>End</th><th>Fuel Used GPS</th><th>Delivered</th><th>Fuel Dispensed</th><th>Distance</th><th>Engine Hrs</th></tr></thead><tbody>{{#each weeklyBuckets}}<tr><td><strong>{{weekLabel}}</strong></td><td>{{startDate}}</td><td>{{endDate}}</td><td>{{fuelUsed}}</td><td>{{delivered}}</td><td>{{issued}}</td><td>{{distance}}</td><td>{{engineHours}}</td></tr>{{/each}}</tbody></table></div>
            </div>
            <div class=""panel panel-soft"">
                <h3>Weekly Mode Highlights</h3>
                {{#each weeklyBuckets}}<div class=""list-row""><div class=""list-topline""><span>{{weekLabel}}</span><strong>{{fuelUsed}}</strong></div><div class=""mini-note"">LV {{lvEfficiency}} | HE {{heEfficiency}} | Fuel Dispensed {{issued}}</div></div>{{/each}}
            </div>
        </div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 1 of 8</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 2 — Weekly Stock Analysis</div><div class=""section-tag"">Tank Ledger</div></div>
        <div class=""table-wrap""><table><thead><tr><th>Site</th><th>Week</th><th>Delivered</th><th>Fuel Dispensed</th><th>Fuel Lost</th></tr></thead><tbody>{{#each weeklyStockRows}}{{#each weeks}}<tr><td><strong>{{../siteName}}</strong></td><td>{{weekLabel}}</td><td>{{delivered}}</td><td>{{issued}}</td><td>{{fuelLost}}</td></tr>{{/each}}{{/each}}</tbody></table></div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 2 of 8</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 3 — Weekly Light Vehicle Performance</div><div class=""section-tag"">km/L Segment</div></div>
        <div class=""table-wrap""><table><thead><tr><th>Site</th><th>Week</th><th>Fuel Used GPS</th><th>Fuel Lost</th><th>km/L</th><th>Distance</th></tr></thead><tbody>{{#each weeklyLvRows}}{{#each weeks}}<tr><td><strong>{{../siteName}}</strong></td><td>{{weekLabel}}</td><td>{{fuelUsed}}</td><td>{{fuelLost}}</td><td>{{kmPerLiter}}</td><td>{{distance}}</td></tr>{{/each}}{{/each}}</tbody></table></div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 3 of 8</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 4 — Weekly Light Vehicle Highlights</div><div class=""section-tag"">Week by Week</div></div>
        <div class=""grid-3"">{{#each weeklyHighlights.lv}}<div class=""list-card""><h3>{{weekLabel}}</h3><div class=""mini-note"">Fuel Used GPS <strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Efficiency <strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel Dispensed <strong>{{issued}}</strong></div><div class=""mini-note"">Delivered <strong>{{delivered}}</strong></div></div>{{/each}}</div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 4 of 8</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 5 — Weekly Heavy Equipment Performance</div><div class=""section-tag"">L/hr Segment</div></div>
        <div class=""table-wrap""><table><thead><tr><th>Site</th><th>Week</th><th>Fuel Used GPS</th><th>Fuel Lost</th><th>L/hr</th><th>Engine Hours</th></tr></thead><tbody>{{#each weeklyHeRows}}{{#each weeks}}<tr><td><strong>{{../siteName}}</strong></td><td>{{weekLabel}}</td><td>{{fuelUsed}}</td><td>{{fuelLost}}</td><td>{{litersPerHour}}</td><td>{{engineHours}}</td></tr>{{/each}}{{/each}}</tbody></table></div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 5 of 8</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 6 — Weekly Heavy Equipment Highlights</div><div class=""section-tag"">Week by Week</div></div>
        <div class=""grid-3"">{{#each weeklyHighlights.he}}<div class=""list-card""><h3>{{weekLabel}}</h3><div class=""mini-note"">Fuel Used GPS <strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Efficiency <strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel Dispensed <strong>{{issued}}</strong></div><div class=""mini-note"">Delivered <strong>{{delivered}}</strong></div></div>{{/each}}</div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 6 of 8</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 7 — Weekly Site Usage Matrix</div><div class=""section-tag"">Cross-Site Weekly View</div></div>
        <div class=""table-wrap""><table><thead><tr><th>Site</th><th>Week</th><th>LV Eff</th><th>HE Eff</th><th>Distance</th><th>Engine Hours</th><th>Total Fuel</th></tr></thead><tbody>{{#each weeklySiteUsageRows}}{{#each weeks}}<tr><td><strong>{{../siteName}}</strong></td><td>{{weekLabel}}</td><td>{{lvEfficiency}}</td><td>{{heEfficiency}}</td><td>{{distance}}</td><td>{{engineHours}}</td><td>{{totalFuel}}</td></tr>{{/each}}{{/each}}</tbody></table></div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 7 of 8</span></div>
    </div>

    <div class=""page"">
        <div class=""section-header""><div class=""section-title"">Page 8 — Weekly Executive Takeaways</div><div class=""section-tag"">Month-in-Weeks</div></div>
        <div class=""narrative"">This weekly edition mirrors the same data foundations as the monthly report but keeps the month fixed and recasts operational performance into weekly control buckets. It is intended for review meetings where week-to-week movement matters more than the full five-month trend.</div>
        <div class=""grid-2"">
            <div class=""panel panel-soft""><h3>Light Vehicle Weekly Highlights</h3>{{#each weeklyHighlights.lv}}<div class=""list-row""><div class=""list-topline""><span>{{weekLabel}}</span><strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel Used GPS {{fuelUsed}} | Fuel Dispensed {{issued}}</div></div>{{/each}}</div>
            <div class=""panel panel-soft""><h3>Heavy Equipment Weekly Highlights</h3>{{#each weeklyHighlights.he}}<div class=""list-row""><div class=""list-topline""><span>{{weekLabel}}</span><strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel Used GPS {{fuelUsed}} | Delivered {{delivered}}</div></div>{{/each}}</div>
        </div>
        <div class=""footer""><span>{{reportId}}</span><span>Page 8 of 8</span></div>
    </div>
</body>
</html>";
    }
}