/**
 * File: MonthlyFleetReportHtmlTemplate.cs
 * Purpose: Embedded HTML template for the monthly fleet executive PDF report.
 * Dependencies: Chart.js 4.4.1 (CDN)
 * Last Modified: 2025-07-09
 *
 * Key Functions:
 * - Get(): Returns the Handlebars HTML template for monthly fleet executive reporting
 */
namespace FMS.WebClient.Services.Reporting
{
    internal static class MonthlyFleetReportHtmlTemplate
    {
        public static string Get(string? logoBase64 = null)
        {
            var logoSm = string.IsNullOrEmpty(logoBase64)
                ? "<span>HY</span>"
                : $"<img src=\"{logoBase64}\" style=\"width:28px;height:28px;object-fit:contain;border-radius:3px;\">";
            var logoLg = string.IsNullOrEmpty(logoBase64)
                ? "<span>HY</span>"
                : $"<img src=\"{logoBase64}\" style=\"width:48px;height:48px;object-fit:contain;border-radius:8px;\">";
            var tpl = @"<!DOCTYPE html>
<html><head><meta charset=""UTF-8""><title>{{reportTitle}}</title>
<script src=""https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.js""></script>
<style>
:root{--primary:#0078D4;--primary-dk:#005A9E;--primary-lt:#EBF4FC;--surface:#FFF;--bg:#F3F4F6;--border:#E5E7EB;--txt:#111827;--body:#374151;--muted:#6B7280;--hdr:#1F2937;--hdr2:#111827;--success:#107C10;--danger:#D13438;--amber:#D97706;--purple:#8764B8;--teal:#038387}
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:var(--bg);color:var(--body);font-size:12px;line-height:1.5}
@page{size:A4 landscape;margin:2mm}
.report-page{background:var(--bg);min-height:100vh;padding:0 0 40px;page-break-after:always;break-after:page}
.report-page:last-child{page-break-after:avoid;break-after:avoid}
.inner{padding:14px 28px}
.topbar{display:flex;justify-content:space-between;align-items:center;padding:10px 28px;background:var(--hdr2);color:#E5E7EB}
.topbar-left{display:flex;align-items:center;gap:12px}
.logo-box{width:32px;height:32px;background:#fff;border-radius:5px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.logo-box span{font-size:10px;font-weight:800;color:var(--primary);letter-spacing:-0.5px}
.topbar-right{text-align:right}
.period-badge{background:var(--primary);color:#fff;font-size:10px;font-weight:700;padding:3px 12px;border-radius:20px;display:inline-block;margin-bottom:3px}
.sec-hdr{padding:9px 28px;display:flex;align-items:center;gap:10px;margin-bottom:2px}
.sec-hdr.exec{background:var(--hdr)}.sec-hdr.stock{background:#065F46}.sec-hdr.lv{background:var(--primary-dk)}.sec-hdr.he{background:#92400E}
.sec-hdr .snum{width:22px;height:22px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;flex-shrink:0}
.sec-hdr.exec .snum{background:var(--primary);color:#fff}.sec-hdr.stock .snum{background:#107C10;color:#fff}.sec-hdr.lv .snum{background:#1a6faa;color:#fff}.sec-hdr.he .snum{background:var(--amber);color:#fff}
.sec-hdr h2{font-size:13px;font-weight:700;color:#E5E7EB;letter-spacing:0.1px}
.sec-hdr .stag{margin-left:auto;font-size:10px;color:#9CA3AF}
.lv-tag{background:var(--primary-lt);color:var(--primary-dk);font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:8px}
.he-tag{background:#FEF3C7;color:#92400E;font-size:9px;font-weight:700;padding:2px 8px;border-radius:10px;margin-left:8px}
.kpi4{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:10px}
.kcard{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:13px 15px 10px;position:relative;overflow:hidden}
.kcard::before{content:'';position:absolute;top:0;left:0;right:0;height:3px}
.kpi4 .kcard:nth-child(4n+1)::before{background:var(--primary)}.kpi4 .kcard:nth-child(4n+2)::before{background:var(--success)}.kpi4 .kcard:nth-child(4n+3)::before{background:var(--amber)}.kpi4 .kcard:nth-child(4n+4)::before{background:var(--danger)}
.kpi4 .kcard:nth-child(n+5){padding:9px 13px 7px}.kpi4 .kcard:nth-child(n+5) .kv{font-size:15px}
.kcard .kv{font-family:'Segoe UI Semibold','Segoe UI',Tahoma,Arial,sans-serif;font-size:20px;font-weight:700;color:var(--txt);line-height:1.1;margin-bottom:3px;letter-spacing:0;font-kerning:none;font-variant-ligatures:none;font-variant-numeric:tabular-nums lining-nums}
.kcard .kl{font-size:9.5px;color:var(--muted);font-weight:700;text-transform:uppercase;letter-spacing:0.4px}
.kcard .kt{font-size:10px;margin-top:4px;color:var(--muted)}
.crow{display:grid;gap:12px;margin-bottom:12px}.c2{grid-template-columns:1fr 1fr}.c3{grid-template-columns:1fr 1fr 1fr}
.ccard{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:12px 14px}
.ccard h3{font-size:11px;font-weight:700;color:var(--txt);margin-bottom:2px}
.ccard .csub{font-size:9.5px;color:var(--muted);margin-bottom:8px}
.leg{display:flex;flex-wrap:wrap;gap:10px;margin-bottom:6px;font-size:10px;color:var(--muted)}.leg span{display:flex;align-items:center;gap:4px}
.ld{width:9px;height:9px;border-radius:2px;flex-shrink:0}
.tbl-wrap{background:var(--surface);border:1px solid var(--border);border-radius:8px;overflow:hidden;margin-bottom:12px}
.tbl-wrap.scroll{overflow-x:auto}
table{width:100%;border-collapse:collapse;font-size:10.5px}
thead th{background:var(--hdr);color:#E5E7EB;padding:7px 9px;text-align:left;font-size:9.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.4px;white-space:nowrap}
thead th.tr{text-align:right}
tbody td{padding:7px 9px;border-bottom:1px solid var(--border);color:var(--body);vertical-align:middle}
tbody tr:last-child td{border-bottom:none}
tbody tr:nth-child(even) td{background:#FAFAFA}
tbody tr.grp td{background:#EBF4FC;color:var(--primary-dk);font-weight:700;font-size:10px;padding:5px 9px}
tbody tr.grp.he td{background:#FEF3C7;color:#92400E}
tfoot td{background:#F9FAFB;font-weight:800;color:var(--txt);padding:7px 9px;font-size:10.5px}
.tbl-label{font-size:10px;font-weight:700;color:var(--txt);margin-bottom:5px;padding-left:2px}
.tr{text-align:right}.tm{color:var(--muted)}.fw{font-weight:700}
.narrative{background:var(--primary-lt);border:1px solid #C2DFFE;border-radius:8px;padding:12px 16px;margin-bottom:12px;font-size:11px;line-height:1.8;color:var(--body)}
.narrative strong{color:var(--txt);font-weight:700}
.narrative.he{background:#FEF3C7;border-color:#FCD34D}
.site-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:12px}
.site-kpi{background:var(--surface);border:1px solid var(--border);border-radius:8px;padding:9px 11px}
.site-kpi .sn{font-size:9px;font-weight:700;color:var(--primary-dk);text-transform:uppercase;letter-spacing:0.4px;border-bottom:1px solid var(--border);padding-bottom:4px;margin-bottom:6px}
.site-kpi .sp{display:flex;justify-content:space-between}.site-kpi .sk{text-align:center;flex:1}
.site-kpi .sv{font-size:13px;font-weight:800;color:var(--txt)}.site-kpi .sl{font-size:8.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.3px;margin-top:1px}
.site-kpi .sv.del{color:var(--primary)}.site-kpi .sv.iss{color:var(--success)}
.sdiv{width:1px;background:var(--border)}
.cover-hero{background:var(--hdr2);min-height:100vh;display:flex;flex-direction:column}
.cover-top{padding:32px 40px;flex:1;display:flex;flex-direction:column;justify-content:center}
.cover-logo-lg{width:56px;height:56px;background:#fff;border-radius:10px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
.cover-logo-lg span{font-size:16px;font-weight:800;color:var(--primary)}
.cover-header-row{display:flex;align-items:center;gap:20px;margin-bottom:32px}
.cover-title-block{display:flex;flex-direction:column;gap:6px}
.cover-hero h1{font-size:32px;font-weight:800;color:#fff;letter-spacing:-1px;line-height:1.2;margin:0}
.cover-hero h2{font-size:16px;font-weight:400;color:#9CA3AF;margin:0}
.cover-period-lg{background:var(--primary);color:#fff;font-size:14px;font-weight:700;padding:8px 20px;border-radius:24px;display:inline-block;margin-bottom:32px}
.cover-kpis{display:grid;grid-template-columns:repeat(4,1fr);gap:16px;margin-bottom:40px}
.ckpi{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);border-radius:10px;padding:16px 18px}
.ckpi .cv{font-family:'Segoe UI Semibold','Segoe UI',Tahoma,Arial,sans-serif;font-size:24px;font-weight:700;color:#fff;margin-bottom:4px;letter-spacing:0;font-kerning:none;font-variant-ligatures:none;font-variant-numeric:tabular-nums lining-nums}
.ckpi .cl{font-size:10px;color:#9CA3AF;text-transform:uppercase;letter-spacing:0.5px;font-weight:700}
.cover-footer{background:rgba(0,0,0,0.3);padding:16px 40px;display:flex;justify-content:space-between;align-items:center;font-size:11px;color:#6B7280}
.cover-filter{display:flex;gap:24px;flex-wrap:wrap}
.cf{display:flex;gap:5px}.cfl{font-weight:700;color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:0.4px}.cfv{color:#6B7280;font-size:10px}
.grid-2{display:grid;grid-template-columns:1.1fr 0.9fr;gap:12px}
.grid-3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
.panel{border:1px solid var(--border);border-radius:10px;background:#fff;padding:12px}
.panel-soft{background:#faf9f8}
h3{margin:0 0 8px;font-size:12px;text-transform:uppercase;letter-spacing:0.5px}
.list-row{margin-bottom:9px}.list-row:last-child{margin-bottom:0}
.list-topline{display:flex;justify-content:space-between;gap:10px;font-size:10px;margin-bottom:5px}
.bar-track{height:7px;border-radius:999px;background:#f3f2f1;overflow:hidden}
.bar-fill{height:100%;border-radius:999px;background:linear-gradient(90deg,#0078d4 0%,#3aa0ff 100%)}
.mini-note{font-size:9px;color:#605e5c;line-height:1.5}
.note-list{margin:0;padding-left:16px;font-size:10px;line-height:1.5}.note-list li{margin-bottom:4px}
.stock-mini-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-bottom:10px}
.stock-mini{border:1px solid var(--border);border-radius:8px;background:#faf9f8;padding:8px 9px}
.stock-mini__value{font-size:13px;font-weight:800;color:var(--txt);line-height:1.1}
.stock-mini__label{font-size:8.5px;color:var(--muted);text-transform:uppercase;letter-spacing:0.35px;margin-top:3px}
.stock-mini__note{font-size:8.5px;color:#605e5c;line-height:1.35;margin-top:2px}
.stock-watch{padding:8px 0;border-bottom:1px solid var(--border)}.stock-watch:last-child{border-bottom:none;padding-bottom:0}
.stock-watch__top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:4px}
.stock-watch__metrics{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 12px;margin-bottom:5px}
.stock-watch__metric{font-size:9px;color:#605e5c;line-height:1.45}
.stock-watch__metric strong{color:var(--txt)}
.stock-pill{display:inline-flex;align-items:center;justify-content:center;padding:2px 8px;border-radius:999px;font-size:8.5px;font-weight:700;text-transform:uppercase;letter-spacing:0.35px}
.stock-pill.stable{background:#dff6dd;color:#107c10}
.stock-pill.watch{background:#fff4ce;color:#ca5010}
.stock-pill.critical{background:#fde7e9;color:#d13438}
.page-footer{margin:16px 28px 0;padding-top:10px;border-top:1px solid var(--border);display:flex;justify-content:space-between;font-size:9.5px;color:var(--muted)}
.pf-brand{display:flex;align-items:center;gap:6px}
.pf-dot{width:6px;height:6px;border-radius:50%;background:var(--primary);flex-shrink:0}
@media print{
body{background:#fff}
.report-page{height:202mm;min-height:202mm;padding:0;display:flex;flex-direction:column;overflow:hidden;page-break-after:always;break-after:page}
.report-page:last-child{page-break-after:avoid;break-after:avoid}
.cover-hero{min-height:100%;flex:1}
.inner{flex:1;min-height:0;padding:10px 18px 8px}
.topbar{padding:8px 18px}
.sec-hdr{padding:7px 18px}
.kpi4,.site-grid{gap:8px;margin-bottom:8px}
.kcard{padding:11px 12px 8px}
.kpi4 .kcard:nth-child(n+5){padding:8px 11px 6px}
.crow{gap:8px;margin-bottom:8px}
.grid-2,.grid-3{gap:8px}
.ccard,.panel,.site-kpi{padding:10px 12px}
.ccard h3{font-size:10.5px}
.ccard .csub{font-size:9px;margin-bottom:5px}
.leg{gap:8px;margin-bottom:4px;font-size:9px}
.stock-mini-grid{gap:6px;margin-bottom:8px}
.stock-mini{padding:7px 8px}
.stock-mini__value{font-size:12px}
.stock-mini__label,.stock-mini__note{font-size:8px}
.stock-watch{padding:6px 0}
.stock-watch__top{margin-bottom:3px}
.stock-watch__metrics{gap:5px 10px;margin-bottom:4px}
.stock-watch__metric{font-size:8.5px}
.stock-pill{font-size:8px;padding:2px 7px}
.tbl-wrap{margin-bottom:8px}
thead th{padding:6px 7px;font-size:8.7px}
tbody td,tfoot td{padding:5px 7px;font-size:9.4px}
tbody tr.grp td{padding:4px 7px;font-size:9px}
.narrative{padding:10px 14px;margin-bottom:8px;font-size:10px;line-height:1.55}
.page-footer{margin:8px 18px 0;padding-top:6px;font-size:8.8px;flex-shrink:0;margin-top:auto}
.tbl-wrap,.crow,.grid-2,.grid-3,.site-grid,.panel,.ccard,.narrative{break-inside:avoid;page-break-inside:avoid}
.report-page div[style*='position:relative;height:170px']{height:126px!important}
.report-page div[style*='position:relative;height:200px']{height:142px!important}
.report-page canvas{display:block!important;width:100%!important;height:100%!important;max-width:100%!important}
}
</style></head><body>

<!-- COVER PAGE -->
<div class=""report-page"" style=""padding-bottom:0""><div class=""cover-hero""><div class=""cover-top"">
<div class=""cover-header-row""><div class=""cover-logo-lg""><span>HY</span></div><div class=""cover-title-block""><h1>{{reportTitle}}</h1><h2>{{reportSubtitle}}</h2></div></div>
<div class=""cover-period-lg"">{{periodBadge}}</div>
<div class=""cover-kpis"">{{#each coverKpis}}<div class=""ckpi""><div class=""cv"">{{value}}</div><div class=""cl"">{{label}}</div></div>{{/each}}</div>
</div><div class=""cover-footer""><span>{{confidentialityLabel}}</span><div style=""display:flex;gap:24px""><span><span style=""font-weight:700;color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:0.4px"">GENERATED:</span> <span style=""color:#6B7280;font-size:10px"">{{generatedAt}}</span></span><span><span style=""font-weight:700;color:#9CA3AF;font-size:9px;text-transform:uppercase;letter-spacing:0.4px"">REPORT ID:</span> <span style=""color:#6B7280;font-size:10px"">{{reportId}}</span></span></div></div></div></div>

<!-- PAGE 1: Executive Summary -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr exec""><div class=""snum"">1</div><h2>Executive Summary</h2><span class=""stag"">{{periodLabel}}</span></div>
<div class=""inner"">
<div class=""kpi4"">{{#each executiveKpis}}<div class=""kcard""><div class=""kv"">{{value}}</div><div class=""kl"">{{label}}</div><div class=""kt"">{{note}}</div></div>{{/each}}</div>
<div class=""narrative"">{{executiveNarrative}}</div>
<div class=""tbl-label"">Monthly trend — {{periodLabel}}</div>
<div class=""tbl-wrap scroll""><table><thead><tr><th>Month</th><th class=""tr"">Fuel Used GPS</th><th class=""tr"">GPS Dist</th><th class=""tr"">Fuel Dispensed</th><th class=""tr"">Fuel Recv</th><th class=""tr"">Eng Hrs</th><th class=""tr"">Fuel Lost</th><th class=""tr"">% Lost</th><th class=""tr"">km/L</th><th class=""tr"">Exp km/L</th><th class=""tr"">L/hr</th><th class=""tr"">Exp L/hr</th></tr></thead>
<tbody>{{#each monthlyMatrix}}<tr><td class=""fw"">{{month}}</td><td class=""tr"">{{fuelUsed}}</td><td class=""tr"">{{gpsDistance}}</td><td class=""tr"">{{fuelIssued}}</td><td class=""tr"">{{fuelReceived}}</td><td class=""tr"">{{engineHours}}</td><td class=""tr"">{{fuelLost}}</td><td class=""tr"">{{fuelLostPercent}}</td><td class=""tr fw"">{{kmPerLiter}}</td><td class=""tr tm"">{{expectedKmPerLiter}}</td><td class=""tr"">{{litersPerHour}}</td><td class=""tr tm"">{{expectedLitersPerHour}}</td></tr>{{/each}}</tbody>
{{#if monthlyMatrixTotals}}<tfoot><tr><td class=""fw"">Total / Avg</td><td class=""tr"">{{monthlyMatrixTotals.fuelUsed}}</td><td class=""tr"">{{monthlyMatrixTotals.gpsDistance}}</td><td class=""tr"">{{monthlyMatrixTotals.fuelIssued}}</td><td class=""tr"">{{monthlyMatrixTotals.fuelReceived}}</td><td class=""tr"">{{monthlyMatrixTotals.engineHours}}</td><td class=""tr"">{{monthlyMatrixTotals.fuelLost}}</td><td class=""tr"">{{monthlyMatrixTotals.fuelLostPercent}}</td><td class=""tr fw"">{{monthlyMatrixTotals.kmPerLiter}}</td><td class=""tr tm"">{{monthlyMatrixTotals.expectedKmPerLiter}}</td><td class=""tr"">{{monthlyMatrixTotals.litersPerHour}}</td><td class=""tr tm"">{{monthlyMatrixTotals.expectedLitersPerHour}}</td></tr></tfoot>{{/if}}</table></div>
<div class=""crow c2""><div class=""ccard""><h3>Fuel Used GPS &amp; Monthly Average</h3><p class=""csub"">Bar = total fuel used GPS · Line = rolling average</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Fuel Used GPS</span><span><span class=""ld"" style=""background:#107C10;border-radius:50%""></span>Average</span></div><div style=""position:relative;height:170px""><canvas id=""c_execFuel""></canvas></div></div>
<div class=""ccard""><h3>Fuel Dispensed vs Delivered by Month</h3><p class=""csub"">Received into tanks vs dispensed to fleet</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Delivered</span><span><span class=""ld"" style=""background:#D13438""></span>Fuel Dispensed</span></div><div style=""position:relative;height:170px""><canvas id=""c_issDeliv""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 1 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 2: Stock Analysis -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr stock""><div class=""snum"">2</div><h2>Stock Analysis</h2><span class=""stag"">Tank Reconciliation</span></div>
<div class=""inner"">
<div class=""site-grid"">{{#each stockSitePairs}}<div class=""site-kpi""><div class=""sn"">{{siteName}}</div><div class=""sp""><div class=""sk""><div class=""sv del"">{{expectedClosing}}</div><div class=""sl"">Expected Closing</div></div><div class=""sdiv""></div><div class=""sk""><div class=""sv iss"">{{actualClosing}}</div><div class=""sl"">Actual Closing</div></div></div></div>{{/each}}</div>
<div class=""grid-2""><div>
<div class=""ccard""><h3>Stock Control Watchlist</h3><p class=""csub"">Sites ranked by reconciliation variance using opening stock, month movement, and closing stock</p><div class=""stock-mini-grid"">{{#each stockControlSummary}}<div class=""stock-mini""><div class=""stock-mini__value"">{{value}}</div><div class=""stock-mini__label"">{{label}}</div><div class=""stock-mini__note"">{{note}}</div></div>{{/each}}</div>{{#each stockControlHighlights}}<div class=""stock-watch""><div class=""stock-watch__top""><span class=""fw"">{{siteName}}</span><span class=""stock-pill {{statusClass}}"">{{statusLabel}}</span></div><div class=""stock-watch__metrics""><div class=""stock-watch__metric"">Opening Stock: <strong>{{openingStock}}</strong></div><div class=""stock-watch__metric"">Expected Closing: <strong>{{expectedClosing}}</strong></div><div class=""stock-watch__metric"">Actual Closing: <strong>{{actualClosing}}</strong></div><div class=""stock-watch__metric"">Variance: <strong>{{variance}}</strong> ({{variancePercent}})</div></div><div class=""mini-note"">{{movementSummary}}</div><div class=""bar-track""><div class=""bar-fill"" style=""width:{{barWidth}};background:{{barColor}}""></div></div></div>{{/each}}</div>
<div class=""narrative""><strong>How to read this:</strong> Expected Closing = Opening Stock + Delivered + Transfer In - Fuel Dispensed - Transfer Out +/- Adjustments. Actual Closing comes from the latest tank stock reading at or before month end. Status uses the same variance-percent bands used in Fuel Audit logic: under 2% is Stable, 2% to under 5% is Watch, and 5% or more is Action.</div></div>
<div><div class=""ccard""><h3>Stock Movement Trend</h3><p class=""csub"">Delivered vs fuel dispensed across months</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Delivered</span><span><span class=""ld"" style=""background:#D13438""></span>Fuel Dispensed</span></div><div style=""position:relative;height:200px""><canvas id=""c_stockTrend""></canvas></div></div></div>
</div></div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 2 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 3: LV Fuel & Loss -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr lv""><div class=""snum"">3</div><h2>Light Vehicle Fuel &amp; Loss</h2><span class=""lv-tag"">km/L Segment</span><span class=""stag"">{{periodLabel}}</span></div>
<div class=""inner"">
<div class=""tbl-wrap scroll""><table><thead><tr><th>Site</th><th>Vehicle Type</th><th class=""tr"">Total Fuel (L)</th><th class=""tr"">Fuel Lost (L)</th><th class=""tr"">% Lost</th></tr></thead>
<tbody>{{#each lvFuelMatrix}}<tr class=""grp""><td colspan=""5"">{{siteName}}</td></tr>{{#each rows}}<tr><td></td><td class=""tm"">{{vehicleType}}</td>{{#each metrics}}<td class=""tr"">{{value}}</td>{{/each}}</tr>{{/each}}{{/each}}</tbody></table></div>
<div class=""crow c2""><div class=""ccard""><h3>Fuel Used GPS vs Lost by Site</h3><p class=""csub"">Blue = fuel used GPS · Red = loss</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Fuel Used GPS</span><span><span class=""ld"" style=""background:#D13438""></span>Fuel lost</span></div><div style=""position:relative;height:170px""><canvas id=""c_lvFuSite""></canvas></div></div>
<div class=""ccard""><h3>Fuel loss % by site</h3><p class=""csub"">Loss as % of total consumed</p><div class=""leg""><span><span class=""ld"" style=""background:#D13438""></span>% Lost</span></div><div style=""position:relative;height:170px""><canvas id=""c_lvFuPct""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 3 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 4: LV Efficiency -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr lv""><div class=""snum"">4</div><h2>Light Vehicle Efficiency</h2><span class=""lv-tag"">km/L Segment</span><span class=""stag"">Actual vs Expected</span></div>
<div class=""inner"">
<div class=""grid-2""><div>
<div class=""tbl-wrap scroll""><table><thead><tr><th>Site</th><th>Vehicle Type</th><th class=""tr"">Actual km/L</th><th class=""tr"">Expected km/L</th><th class=""tr"">Variance</th></tr></thead>
<tbody>{{#each lvEfficiencyMatrix}}<tr class=""grp""><td colspan=""5"">{{siteName}}</td></tr>{{#each rows}}<tr><td></td><td class=""tm"">{{vehicleType}}</td>{{#each metrics}}<td class=""tr"">{{value}}</td>{{/each}}</tr>{{/each}}{{/each}}</tbody></table></div></div>
<div><div class=""panel panel-soft""><h3>Top Light Vehicle Types</h3>{{#each fleetHighlights.topLightVehicleTypes}}<div class=""list-row""><div class=""list-topline""><span>{{typeName}}</span><strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Efficiency {{efficiency}} | Expected {{expected}} | Units {{unitCount}}</div><div class=""bar-track""><div class=""bar-fill"" style=""width:{{shareWidth}}""></div></div></div>{{/each}}</div></div></div>
<div class=""crow c2""><div class=""ccard""><h3>Actual vs expected km/L</h3><p class=""csub"">Solid = actual · Dashed = expected</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Actual</span><span><span class=""ld"" style=""background:#107C10""></span>Expected</span></div><div style=""position:relative;height:170px""><canvas id=""c_lvEffLine""></canvas></div></div>
<div class=""ccard""><h3>Efficiency by vehicle type</h3><p class=""csub"">Current month comparison</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Actual</span><span><span class=""ld"" style=""background:#C8C6C4""></span>Expected</span></div><div style=""position:relative;height:170px""><canvas id=""c_lvEffType""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 4 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 5: LV Distance -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr lv""><div class=""snum"">5</div><h2>Light Vehicle Distance</h2><span class=""lv-tag"">km/L Segment</span><span class=""stag"">Distance Productivity</span></div>
<div class=""inner"">
<div class=""tbl-wrap scroll""><table><thead><tr><th>Site</th><th>Vehicle Type</th><th class=""tr"">Total Distance (km)</th><th class=""tr"">Avg km/Day</th><th class=""tr"">Unit Count</th></tr></thead>
<tbody>{{#each lvDistanceMatrix}}<tr class=""grp""><td colspan=""5"">{{siteName}}</td></tr>{{#each rows}}<tr><td></td><td class=""tm"">{{vehicleType}}</td>{{#each metrics}}<td class=""tr"">{{value}}</td>{{/each}}</tr>{{/each}}{{/each}}</tbody></table></div>
<div class=""crow c2""><div class=""ccard""><h3>GPS distance by site</h3><p class=""csub"">Total km per site</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Distance</span></div><div style=""position:relative;height:170px""><canvas id=""c_lvDistSite""></canvas></div></div>
<div class=""ccard""><h3>Distance trend</h3><p class=""csub"">Monthly total distance</p><div class=""leg""><span><span class=""ld"" style=""background:#0078D4""></span>Distance</span></div><div style=""position:relative;height:170px""><canvas id=""c_lvDistTrend""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 5 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 6: HE Overview -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr he""><div class=""snum"">6</div><h2>Heavy Equipment Overview</h2><span class=""he-tag"">L/hr Segment</span><span class=""stag"">{{periodLabel}}</span></div>
<div class=""inner"">
<div class=""grid-3"">{{#each fleetHighlights.topHeavyEquipmentTypes}}<div class=""panel""><h3>{{typeName}}</h3><div class=""mini-note"">Fuel Used GPS <strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Efficiency <strong>{{efficiency}}</strong></div><div class=""mini-note"">Expected <strong>{{expected}}</strong></div><div class=""mini-note"">Units <strong>{{unitCount}}</strong></div><div class=""bar-track"" style=""margin-top:8px""><div class=""bar-fill"" style=""width:{{shareWidth}}""></div></div></div>{{/each}}</div>
<div class=""narrative he"">Heavy-equipment segmentation uses persisted km/L mode flags for accurate classification by consumption mode rather than naming conventions.</div>
<div class=""crow c2""><div class=""ccard""><h3>Fuel distribution by type</h3><p class=""csub"">Share of total heavy-equipment fuel</p><div style=""position:relative;height:200px""><canvas id=""c_heDashType""></canvas></div></div>
<div class=""ccard""><h3>Fuel Used GPS by Site</h3><p class=""csub"">Heavy-equipment consumption per site</p><div class=""leg""><span><span class=""ld"" style=""background:#D97706""></span>Fuel Used GPS</span></div><div style=""position:relative;height:200px""><canvas id=""c_heDashSite""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 6 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 7: HE Fuel & Loss -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr he""><div class=""snum"">7</div><h2>Heavy Equipment Fuel &amp; Loss</h2><span class=""he-tag"">L/hr Segment</span><span class=""stag"">Actual vs Expected</span></div>
<div class=""inner"">
<div class=""tbl-wrap scroll""><table><thead><tr><th>Site</th><th>Vehicle Type</th><th class=""tr"">Actual L/hr</th><th class=""tr"">Expected L/hr</th><th class=""tr"">Fuel Lost (L)</th></tr></thead>
<tbody>{{#each heFuelLostMatrix}}<tr class=""grp he""><td colspan=""5"">{{siteName}}</td></tr>{{#each rows}}<tr><td></td><td class=""tm"">{{vehicleType}}</td>{{#each metrics}}<td class=""tr"">{{value}}</td>{{/each}}</tr>{{/each}}{{/each}}</tbody></table></div>
<div class=""crow c2""><div class=""ccard""><h3>Fuel lost by site</h3><p class=""csub"">Heavy-equipment fuel loss per site</p><div class=""leg""><span><span class=""ld"" style=""background:#D13438""></span>Fuel lost</span></div><div style=""position:relative;height:170px""><canvas id=""c_heFuSite""></canvas></div></div>
<div class=""ccard""><h3>Fuel loss trend</h3><p class=""csub"">Monthly heavy-equipment fuel loss</p><div class=""leg""><span><span class=""ld"" style=""background:#D13438""></span>Fuel lost</span></div><div style=""position:relative;height:170px""><canvas id=""c_heFuTrend""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 7 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 8: HE Engine Hours -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr he""><div class=""snum"">8</div><h2>Heavy Equipment Engine Hours</h2><span class=""he-tag"">L/hr Segment</span><span class=""stag"">Utilization</span></div>
<div class=""inner"">
<div class=""tbl-wrap scroll""><table><thead><tr><th>Site</th><th>Vehicle Type</th><th class=""tr"">Total Hours</th><th class=""tr"">Avg Hrs/Unit</th><th class=""tr"">Unit Count</th></tr></thead>
<tbody>{{#each heEngineHoursMatrix}}<tr class=""grp he""><td colspan=""5"">{{siteName}}</td></tr>{{#each rows}}<tr><td></td><td class=""tm"">{{vehicleType}}</td>{{#each metrics}}<td class=""tr"">{{value}}</td>{{/each}}</tr>{{/each}}{{/each}}</tbody></table></div>
<div class=""crow c2""><div class=""ccard""><h3>Engine hours trend</h3><p class=""csub"">Monthly total hours</p><div class=""leg""><span><span class=""ld"" style=""background:#D97706""></span>Engine hrs</span></div><div style=""position:relative;height:170px""><canvas id=""c_heEngTrend""></canvas></div></div>
<div class=""ccard""><h3>Avg hours per unit by type</h3><p class=""csub"">Equipment utilization</p><div class=""leg""><span><span class=""ld"" style=""background:#D97706""></span>Avg hrs</span></div><div style=""position:relative;height:170px""><canvas id=""c_heEngAvg""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 8 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 9: HE Efficiency -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr he""><div class=""snum"">9</div><h2>Heavy Equipment Efficiency</h2><span class=""he-tag"">L/hr Segment</span><span class=""stag"">Variance Watchlist</span></div>
<div class=""inner"">
<div class=""tbl-wrap scroll""><table><thead><tr><th>Site</th><th>Vehicle Type</th><th class=""tr"">Actual L/hr</th><th class=""tr"">Expected L/hr</th><th class=""tr"">Variance</th></tr></thead>
<tbody>{{#each heEfficiencyMatrix}}<tr class=""grp he""><td colspan=""5"">{{siteName}}</td></tr>{{#each rows}}<tr><td></td><td class=""tm"">{{vehicleType}}</td>{{#each metrics}}<td class=""tr"">{{value}}</td>{{/each}}</tr>{{/each}}{{/each}}</tbody></table></div>
<div class=""crow c2""><div class=""ccard""><h3>Actual vs expected L/hr by site</h3><p class=""csub"">Comparison per site</p><div class=""leg""><span><span class=""ld"" style=""background:#D97706""></span>Actual</span><span><span class=""ld"" style=""background:#C8C6C4""></span>Expected</span></div><div style=""position:relative;height:170px""><canvas id=""c_heEffSite""></canvas></div></div>
<div class=""ccard""><h3>Efficiency trend</h3><p class=""csub"">Actual vs expected over months</p><div class=""leg""><span><span class=""ld"" style=""background:#D97706""></span>Actual</span><span><span class=""ld"" style=""background:#C8C6C4""></span>Expected</span></div><div style=""position:relative;height:170px""><canvas id=""c_heEffTrend""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 9 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 10: Site Usage Matrix -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr exec""><div class=""snum"">10</div><h2>Site Usage Matrix</h2><span class=""stag"">Last 3 Months</span></div>
<div class=""inner"">
<div class=""tbl-wrap scroll""><table><thead><tr><th></th><th>Month</th><th class=""tr"">LV Eff (km/L)</th><th class=""tr"">HE Eff (L/hr)</th><th class=""tr"">Fuel Lost</th><th class=""tr"">Distance</th><th class=""tr"">Engine Hrs</th><th class=""tr"">Total Fuel</th></tr></thead>
<tbody>{{#each siteUsageMatrix}}<tr class=""grp""><td colspan=""8"">{{siteName}}</td></tr>{{#each months}}<tr><td></td><td>{{month}}</td><td class=""tr"">{{lvEfficiency}}</td><td class=""tr"">{{heEfficiency}}</td><td class=""tr"">{{fuelLost}}</td><td class=""tr"">{{distance}}</td><td class=""tr"">{{engineHours}}</td><td class=""tr"">{{totalFuel}}</td></tr>{{/each}}{{/each}}</tbody></table></div>
<div class=""crow c2""><div class=""ccard""><h3>Total fuel by site — monthly</h3><p class=""csub"">All vehicle types combined</p><div style=""position:relative;height:200px""><canvas id=""c_siteFuelTrend""></canvas></div></div>
<div class=""ccard""><h3>Fuel lost by site — monthly</h3><p class=""csub"">Recorded loss trend</p><div class=""leg""><span><span class=""ld"" style=""background:#D13438""></span>Fuel lost</span></div><div style=""position:relative;height:200px""><canvas id=""c_siteLostTrend""></canvas></div></div></div>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 10 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- PAGE 11: Executive Takeaways -->
<div class=""report-page"">
<div class=""topbar""><div class=""topbar-left""><div class=""logo-box""><span>HY</span></div><div><div style=""font-size:13px;font-weight:800;color:#E5E7EB"">{{reportTitle}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportSubtitle}}</div></div></div><div class=""topbar-right""><div class=""period-badge"">{{periodBadge}}</div><div style=""font-size:9px;color:#9CA3AF"">{{reportId}}</div></div></div>
<div class=""sec-hdr exec""><div class=""snum"">11</div><h2>Executive Takeaways</h2><span class=""stag"">Portfolio View</span></div>
<div class=""inner"">
<div class=""grid-3"">
<div class=""panel panel-soft""><h3>Top Sites</h3>{{#each fleetHighlights.topSites}}<div class=""list-row""><div class=""list-topline""><span>{{siteName}}</span><strong>{{fuelUsed}}</strong></div><div class=""mini-note"">Fuel Dispensed {{issued}} | Delivered {{delivered}}</div><div class=""bar-track""><div class=""bar-fill"" style=""width:{{shareWidth}}""></div></div></div>{{/each}}</div>
<div class=""panel panel-soft""><h3>Top LV Types</h3>{{#each fleetHighlights.topLightVehicleTypes}}<div class=""list-row""><div class=""list-topline""><span>{{typeName}}</span><strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel {{fuelUsed}} | Expected {{expected}}</div><div class=""bar-track""><div class=""bar-fill"" style=""width:{{shareWidth}}""></div></div></div>{{/each}}</div>
<div class=""panel panel-soft""><h3>Top HE Types</h3>{{#each fleetHighlights.topHeavyEquipmentTypes}}<div class=""list-row""><div class=""list-topline""><span>{{typeName}}</span><strong>{{efficiency}}</strong></div><div class=""mini-note"">Fuel {{fuelUsed}} | Expected {{expected}}</div><div class=""bar-track""><div class=""bar-fill"" style=""width:{{shareWidth}}""></div></div></div>{{/each}}</div>
</div>
<div class=""narrative"">This report is designed for executive PDF circulation. It presents a month-close view using persisted vehicle consumption, expected-average assignments, and tank ledger movement data in A4 landscape format.</div>
<h3>Reporting Notes</h3><ul class=""note-list"">{{#each chartNotes}}<li>{{this}}</li>{{/each}}</ul>
</div>
<div class=""page-footer""><div class=""pf-brand""><span class=""pf-dot""></span><strong>Hyoung FMS</strong></div><div>Page 11 of 11 &nbsp;|&nbsp; {{reportId}}</div></div></div>

<!-- Chart Data & Initialization -->
<script id=""chartData"" type=""application/json"">{{{chartDataJson}}}</script>
<script>var CD=null;try{var el=document.getElementById('chartData');if(el&&el.textContent)CD=JSON.parse(el.textContent);}catch(e){}if(CD&&typeof Chart!=='undefined'){Chart.defaults.animation=false;Object.keys(CD).forEach(function(id){var c=document.getElementById(id);if(c&&CD[id])try{new Chart(c,CD[id]);}catch(e){}});}window.__chartsReady=true;</script>
</body></html>";
            return tpl
                .Replace(@"<div class=""logo-box""><span>HY</span></div>", $@"<div class=""logo-box"">{logoSm}</div>")
                .Replace(@"<div class=""cover-logo-lg""><span>HY</span></div>", $@"<div class=""cover-logo-lg"">{logoLg}</div>");
        }
    }
}
