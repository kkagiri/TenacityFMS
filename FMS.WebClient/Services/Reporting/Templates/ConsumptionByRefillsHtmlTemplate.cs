/**
 * File: ConsumptionByRefillsHtmlTemplate.cs
 * Purpose: Dedicated Handlebars/HTML template for the Consumption by Refills report.
 * Dependencies: None
 * Last Modified: 2026-03-11
 *
 * Key Sections:
 * - Report header with date range and selected consumption mode
 * - Summary cards with separate totals for distance, engine hours, and averages per unit mode
 * - Detail table with per-row unit-aware distance and consumption values
 * - Empty-state fallback and report footer
 */
namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Dedicated HTML template for the Consumption by Refills report with
    /// dynamic column labels driven by the AverageKmL selection.
    /// </summary>
    internal static class ConsumptionByRefillsHtmlTemplate
    {
        public static string Get() => @"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>{{reportTitle}} - Hyoung FMS System</title>
    <link href=""https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800&display=swap"" rel=""stylesheet"">
    <style>
        :root {
            --primary:       #20c997;
            --primary-dark:  #0f766e;
            --primary-light: #ecfdf5;
            --surface:       #FFFFFF;
            --bg:            #F3F4F6;
            --border:        #E5E7EB;
            --text-strong:   #111827;
            --text-body:     #374151;
            --text-muted:    #6B7280;
            --dark-header:   #1F2937;
            --success:       #107C10;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Nunito Sans', 'Segoe UI', Arial, sans-serif;
            background: var(--bg);
            color: var(--text-body);
            font-size: 12px;
            line-height: 1.5;
        }
        .page { max-width: 1150px; margin: 0 auto; padding: 28px 32px 48px; }

        .report-header {
            display: flex; justify-content: space-between; align-items: flex-end;
            padding-bottom: 18px; margin-bottom: 20px;
        }
        .report-title h1 { font-size: 20px; font-weight: 800; color: var(--text-strong); letter-spacing: -0.3px; }
        .report-title p { color: var(--text-muted); font-size: 11.5px; margin-top: 2px; }
        .report-meta { text-align: right; font-size: 11px; color: var(--text-muted); }
        .badge-period {
            display: inline-block;
            background: var(--primary-light);
            color: var(--primary-dark);
            font-weight: 700;
            font-size: 10.5px;
            padding: 3px 10px;
            border-radius: 20px;
            margin-top: 6px;
        }

        .filter-summary {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 12px 16px;
            margin-bottom: 18px;
            font-size: 10.5px;
        }
        .filter-summary h3 { margin: 0 0 8px 0; font-size: 12px; color: var(--text-strong); font-weight: 700; }
        .filter-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(180px, 1fr)); gap: 6px; }
        .filter-item { display: flex; gap: 4px; min-width: 0; }
        .filter-label { font-weight: 700; color: var(--text-body); text-transform: uppercase; font-size: 9px; letter-spacing: 0.3px; }
        .filter-value { color: var(--text-muted); font-size: 10px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

        .summary-section { display: grid; grid-template-columns: repeat(7, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 14px 16px 12px;
            position: relative;
            overflow: hidden;
        }
        .summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--primary); }
        .summary-card.card-primary::before { background: var(--primary); }
        .summary-card.card-success::before { background: var(--success); }
        .summary-card.card-info::before { background: var(--dark-header); }
        .summary-card .value { font-size: 22px; font-weight: 800; color: var(--text-strong); line-height: 1.1; margin-bottom: 4px; letter-spacing: -0.4px; }
        .summary-card .label { font-size: 10px; color: var(--text-muted); font-weight: 700; text-transform: uppercase; letter-spacing: 0.4px; }
        .summary-card .meta { font-size: 9px; color: var(--text-muted); margin-top: 4px; }

        .table-wrapper { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; overflow: hidden; margin-bottom: 24px; }
        .data-table { width: 100%; border-collapse: collapse; font-size: 11px; }
        .data-table thead th {
            background: var(--dark-header);
            color: #E5E7EB;
            padding: 10px 12px;
            text-align: left;
            font-weight: 700;
            font-size: 10.5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .data-table tbody td { padding: 10px 12px; border-bottom: 1px solid var(--border); color: var(--text-body); vertical-align: middle; }
        .data-table tbody tr:last-child td { border-bottom: none; }
        .data-table tbody tr:nth-child(even) td { background: #FAFAFA; }
        .text-right { text-align: right; }
        .text-center { text-align: center; }
        .text-muted { color: var(--text-muted); }
        .text-success { color: var(--success); }
        .font-bold { font-weight: 700; }

        .empty-state { background: var(--surface); border: 1px solid var(--border); border-radius: 8px; text-align: center; padding: 40px 20px; color: var(--text-muted); }

        .report-footer {
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid var(--border);
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
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
        <div class=""report-title""><h1>Consumption by Refills Report</h1><p>This report is created by calculating fuel consumption from fuel refill both manual entry and automated entry.</p></div>
        <div class=""report-meta"">
            <span class=""badge-period"">{{dateFrom}} &ndash; {{dateTo}}</span>
        </div>
    </div>

    <div class=""filter-summary"">
        <h3>Report Parameters</h3>
        <div class=""filter-grid"">
            {{#if dateFrom}}<div class=""filter-item""><span class=""filter-label"">From:</span><span class=""filter-value"">{{dateFrom}}</span></div>{{/if}}
            {{#if dateTo}}<div class=""filter-item""><span class=""filter-label"">To:</span><span class=""filter-value"">{{dateTo}}</span></div>{{/if}}
            {{#if consumptionModeLabel}}<div class=""filter-item""><span class=""filter-label"">Mode:</span><span class=""filter-value"">{{consumptionModeLabel}}</span></div>{{/if}}
        </div>
    </div>

    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card card-primary""><div class=""value"">{{summary.totalVehicles}}</div><div class=""label"">Vehicles</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.totalFuelDisplay}}</div><div class=""label"">Total Fuel</div></div>
        <div class=""summary-card card-success""><div class=""value"">{{summary.avgExpectedAverageDisplay}}</div><div class=""label"">Expected Average</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.totalDistanceKmDisplay}}</div><div class=""label"">Total Distance</div></div>
        <div class=""summary-card card-info""><div class=""value"">{{summary.totalEngineHoursDisplay}}</div><div class=""label"">Total Engine Hours</div></div>
        <div class=""summary-card card-primary""><div class=""value"">{{summary.avgConsumptionKmLDisplay}}</div><div class=""label"">Avg km/L</div></div>
        <div class=""summary-card card-primary""><div class=""value"">{{summary.avgConsumptionLHrDisplay}}</div><div class=""label"">Avg L/hr</div></div>
    </div>
    {{/if}}

    {{#if records}}
    <div class=""table-wrapper"">
        <table class=""data-table""><thead><tr><th>#</th><th>Vehicle</th><th>Plate</th><th>Site</th><th class=""text-right"">Refills</th><th class=""text-right"">Fuel (L)</th><th class=""text-right"">Distance / Eng Hrs</th><th class=""text-right"">Consumption</th><th class=""text-right"">Expected Avg</th></tr></thead>
            <tbody>{{#each records}}<tr>
                <td class=""text-center text-muted"">{{rowNumber}}</td><td class=""font-bold"">{{vehicleName}}</td><td>{{numberPlate}}</td><td>{{siteName}}</td>
                <td class=""text-center"">{{refillCount}}</td><td class=""text-right text-success font-bold"">{{totalVolume}}</td><td class=""text-right"">{{distanceDisplay}}</td><td class=""text-right font-bold"">{{consumptionDisplay}}</td><td class=""text-right"">{{expectedAverageDisplay}}</td>
            </tr>{{/each}}</tbody></table>
    </div>
    {{/if}}

    {{#unless records}}
    <div class=""empty-state""><p>No consumption data found for the selected criteria.</p></div>
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