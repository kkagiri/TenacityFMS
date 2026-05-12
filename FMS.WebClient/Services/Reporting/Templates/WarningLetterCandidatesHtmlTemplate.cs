/**
 * File:          WarningLetterCandidatesHtmlTemplate.cs
 * Purpose:       JsReport HTML template for Warning Letter Candidates (Not Generated) report.
 * Dependencies:  Handlebars
 * Last Modified: 2026-06-15
 *
 * Key Functions:
 * - Get(): Returns the full HTML template string
 */
namespace FMS.WebClient.Services.Reporting;

internal static class WarningLetterCandidatesHtmlTemplate
{
    public static string Get() => @"<!DOCTYPE html>
<html>
<head>
<meta charset=""utf-8"">
<title>Warning Letter Candidates</title>
<style>
    @page { size: A4 landscape; margin: 10mm; }

    :root {
        --primary: #0078D4;
        --success: #107C10;
        --danger: #DC3545;
        --warning: #D97706;
        --text-main: #1F2937;
        --text-muted: #6B7280;
        --border: #E5E7EB;
        --bg-light: #F9FAFB;
        --bg-card: #FFFFFF;
    }
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Segoe UI', 'Nunito Sans', Arial, sans-serif; font-size:12px; color:var(--text-main); background:#fff; }
    .page { width:100%; max-width:none; margin:0 auto; padding:18px 22px; }

    .company-bar { display:flex; align-items:center; gap:12px; padding-bottom:12px; border-bottom:2px solid var(--primary); margin-bottom:16px; }
    .company-bar img { height:36px; }
    .company-bar .company-name { font-size:15px; font-weight:700; color:var(--primary); }
    .company-bar .company-sub { font-size:10px; color:var(--text-muted); }

    .report-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
    .report-header h1 { font-size:18px; font-weight:700; color:var(--text-main); }
    .report-header .meta { font-size:10px; color:var(--text-muted); text-align:right; }
    .badge-period { display:inline-block; background:var(--primary); color:#fff; border-radius:10px; padding:2px 10px; font-size:10px; font-weight:600; margin-top:4px; }

    .summary-section { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
    .summary-card { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:14px 16px; border-top:3px solid var(--primary); }
    .summary-card.success { border-top-color:var(--success); }
    .summary-card.danger { border-top-color:var(--danger); }
    .summary-card.warning { border-top-color:var(--warning); }
    .summary-card .label { font-size:10px; color:var(--text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px; }
    .summary-card .value { font-size:22px; font-weight:700; margin-top:4px; }
    .summary-card .sub { font-size:10px; color:var(--text-muted); margin-top:2px; }

    .type-badges { display:flex; gap:12px; margin-bottom:20px; }
    .type-badge { display:flex; align-items:center; gap:8px; background:var(--bg-light); border:1px solid var(--border); border-radius:8px; padding:10px 16px; flex:1; }
    .type-badge .dot { width:10px; height:10px; border-radius:50%; }
    .type-badge .dot.fuel { background:var(--danger); }
    .type-badge .dot.speed { background:var(--warning); }
    .type-badge .dot.idling { background:#0EA5E9; }
    .type-badge .count { font-size:18px; font-weight:700; }
    .type-badge .name { font-size:10px; color:var(--text-muted); }

    .section-label { margin:24px 0 12px; }
    .section-label h2 { font-size:14px; font-weight:700; color:var(--text-main); border-bottom:2px solid var(--primary); padding-bottom:4px; display:inline-block; }

    .data-table { width:100%; border-collapse:collapse; font-size:11px; margin-bottom:16px; }
    .data-table th { background:var(--bg-light); border:1px solid var(--border); padding:6px 10px; font-weight:700; text-align:left; font-size:10px; text-transform:uppercase; letter-spacing:0.3px; }
    .data-table td { border:1px solid var(--border); padding:5px 10px; }
    .data-table tbody tr:nth-child(even) { background:var(--bg-light); }
    .text-right { text-align:right; }
    .text-center { text-align:center; }
    .text-muted { color:var(--text-muted); }
    .text-danger { color:var(--danger); }

    .report-footer { display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); border-top:1px solid var(--border); padding-top:10px; margin-top:32px; }

    @media print { .page { padding:12px; } }
</style>
</head>
<body>
<div class=""page"">
    <!-- Company Bar -->
    <div class=""company-bar"">
        {{#if companyLogo}}<img src=""{{companyLogo}}"" alt=""Logo"">{{/if}}
        <div>
            <div class=""company-name"">{{companyName}}</div>
            <div class=""company-sub"">Fleet Management System</div>
        </div>
    </div>

    <!-- Report Header -->
    <div class=""report-header"">
        <div>
            <h1>Warning Letter Candidates</h1>
            <p style=""font-size:11px; color:var(--text-muted); margin-top:4px;"">Violations without warning letters generated</p>
        </div>
        <div class=""meta"">
            Generated: {{generatedAt}}<br>
            {{#if dateFrom}}<span class=""badge-period"">{{dateFrom}} &mdash; {{dateTo}}</span>{{/if}}
        </div>
    </div>

    <!-- Summary Cards -->
    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card danger"">
            <div class=""label"">Pending Warning Letters</div>
            <div class=""value"">{{summary.totalCandidates}}</div>
            <div class=""sub"">Expected letters from pending violations</div>
        </div>
        <div class=""summary-card"">
            <div class=""label"">Unique Sites</div>
            <div class=""value"">{{summary.uniqueSites}}</div>
        </div>
        <div class=""summary-card"">
            <div class=""label"">Unique Vehicles</div>
            <div class=""value"">{{summary.uniqueVehicles}}</div>
        </div>
        <div class=""summary-card success"">
            <div class=""label"">Unique Employees</div>
            <div class=""value"">{{summary.uniqueEmployees}}</div>
        </div>
    </div>

    <!-- Type Badges -->
    <div class=""type-badges"">
        <div class=""type-badge"">
            <div class=""dot fuel""></div>
            <div>
                <div class=""count"">{{summary.excessFuelCount}}</div>
                <div class=""name"">Excess Fuel</div>
            </div>
        </div>
        <div class=""type-badge"">
            <div class=""dot speed""></div>
            <div>
                <div class=""count"">{{summary.excessiveSpeedCount}}</div>
                <div class=""name"">Excessive Speed</div>
            </div>
        </div>
        <div class=""type-badge"">
            <div class=""dot idling""></div>
            <div>
                <div class=""count"">{{summary.excessiveIdlingCount}}</div>
                <div class=""name"">Excessive Idling</div>
            </div>
        </div>
    </div>
    {{/if}}

    <!-- Detail Table -->
    <div class=""section-label""><h2>Candidate Details</h2></div>
    {{#if records}}
    <table class=""data-table"">
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Type</th>
                <th>Employee Name (Work No)</th>
                <th>Vehicle</th>
                <th>Vehicle Type</th>
                <th>Site</th>
                <th class=""text-right"">Expected</th>
                <th class=""text-right"">Actual</th>
                <th class=""text-right"">Excess</th>
            </tr>
        </thead>
        <tbody>
            {{#each records}}
            <tr>
                <td>{{rowNum}}</td>
                <td>{{metricDate}}</td>
                <td>{{letterTypeName}}</td>
                <td>{{employeeName}}</td>
                <td>{{vehicleCode}}</td>
                <td>{{vehicleTypeName}}</td>
                <td>{{siteName}}</td>
                <td class=""text-right"">{{expectedFormatted}}</td>
                <td class=""text-right"">{{actualFormatted}}</td>
                <td class=""text-right text-danger"">{{excessFormatted}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{else}}
    <div style=""text-align:center; padding:60px 20px; color: var(--text-muted);"">
        <p style=""font-size: 14px; font-weight: 600;"">No warning letter candidates found for the selected period.</p>
        <p style=""font-size: 12px; margin-top: 8px;"">All violations have warning letters generated, or no violations matched the filters.</p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class=""report-footer"">
        <div><strong>FMS Fleet Management System</strong> &middot; Warning Letter Candidates Report</div>
        <div style=""text-align:right;"">Report ID: {{reportId}}</div>
    </div>
</div>
</body>
</html>";
}
