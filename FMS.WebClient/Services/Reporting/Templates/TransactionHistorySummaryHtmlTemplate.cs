/**
 * File: TransactionHistorySummaryHtmlTemplate.cs
 * Purpose: Handlebars/HTML template for the Transaction History Summary report.
 *          Extracted from JsReportHtmlTemplates.cs for maintainability.
 * Dependencies: None
 * Last Modified: 2026-02-02
 *
 * Key Sections:
 * - Company bar with optional logo
 * - Summary cards (transactions, dispensed, delivered, transferred)
 * - Monthly groups with site sub-headers and per-tank rows
 * - Subtotal rows per month and grand total row
 * - Footer with report ID
 */
namespace FMS.WebClient.Services.Reporting
{
    /// <summary>
    /// Transaction History Summary report template  monthly/yearly aggregation
    /// with site grouping, subtotals, and grand totals.
    /// </summary>
    internal static class TransactionHistorySummaryHtmlTemplate
    {
        public static string Get() => @"<!DOCTYPE html>
<html>
<head>
    <meta charset=""UTF-8"">
    <title>{{reportTitle}} - Hyoung FMS System</title>
    <link href=""https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@300;400;600;700;800;900&display=swap"" rel=""stylesheet"">
    <script src=""https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js""></script>
    <style>
        :root {
            --primary:       #0078D4;
            --primary-dark:  #005A9E;
            --primary-light: #EBF4FC;
            --surface:       #FFFFFF;
            --bg:            #F3F4F6;
            --border:        #E5E7EB;
            --text-strong:   #111827;
            --text-body:     #374151;
            --text-muted:    #6B7280;
            --dark-header:   #1F2937;
            --success:       #107C10;
            --danger:        #DC3545;
            --warning:       #D97706;
            --ago:           #0078D4;
            --pms:           #D97706;
        }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
            font-family: 'Nunito Sans', 'Segoe UI', Arial, sans-serif;
            background: var(--bg);
            color: var(--text-body);
            font-size: 12px;
            line-height: 1.5;
        }
        .page { max-width: 1200px; margin: 0 auto; padding: 28px 32px 48px; }

        /* â”€â”€ Company Bar â”€â”€ */
        .company-bar {
            background: #1F2937;
            margin: -28px -32px 0;
            padding: 12px 32px;
            display: flex; align-items: center; justify-content: space-between;
            margin-bottom: 24px;
        }
        .company-bar-left { display: flex; align-items: center; gap: 14px; }
        .company-logo { height: 40px; width: auto; object-fit: contain; filter: brightness(0) invert(1); }
        .company-bar-titles { display: flex; flex-direction: column; gap: 1px; }
        .company-main-title { font-size: 15px; font-weight: 800; color: #FFFFFF; letter-spacing: 0.3px; }
        .company-sub-title  { font-size: 10.5px; color: #9CA3AF; font-weight: 500; }
        .company-bar-right  { font-size: 10.5px; color: #6B7280; font-weight: 600; letter-spacing: 1.2px; text-transform: uppercase; }

        /* â”€â”€ Report Header â”€â”€ */
        .report-header {
            display: flex; justify-content: space-between; align-items: flex-end;
            padding-bottom: 18px; margin-bottom: 24px;
            border-bottom: 2px solid var(--border);
        }
        .report-title h1 { font-size: 20px; font-weight: 800; color: var(--text-strong); letter-spacing: -0.3px; }
        .report-title p  { color: var(--text-muted); font-size: 11.5px; margin-top: 2px; }
        .report-meta     { text-align: right; font-size: 11px; color: var(--text-muted); }
        .badge-period {
            display: inline-block;
            background: var(--primary-light); color: var(--primary-dark);
            font-weight: 700; font-size: 10.5px;
            padding: 3px 10px; border-radius: 20px; margin-top: 6px;
        }

        /* â”€â”€ Summary Cards â”€â”€ */
        .summary-section { display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px; margin-bottom: 24px; }
        .summary-card {
            background: var(--surface); border: 1px solid var(--border);
            border-radius: 8px; padding: 18px 20px 16px;
            position: relative; overflow: hidden;
        }
        .summary-card::before { content: ''; position: absolute; top: 0; left: 0; right: 0; height: 3px; background: var(--primary); }
        .summary-card.alt::before    { background: var(--dark-header); }
        .summary-card.accent::before { background: var(--primary-dark); }
        .summary-card.success-card::before { background: var(--success); }
        .card-icon { width: 28px; height: 28px; background: var(--primary-light); border-radius: 6px; display: flex; align-items: center; justify-content: center; margin-bottom: 12px; }
        .card-icon svg { fill: var(--primary); }
        .alt    .card-icon { background: #F1F3F5; }
        .alt    .card-icon svg { fill: var(--dark-header); }
        .accent .card-icon { background: #EBF4FC; }
        .accent .card-icon svg { fill: var(--primary-dark); }
        .success-card .card-icon { background: #F0FFF4; }
        .success-card .card-icon svg { fill: var(--success); }
        .card-value { font-size: 22px; font-weight: 800; color: var(--text-strong); margin-bottom: 4px; }
        .card-label { font-size: 10.5px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.8px; }
        .card-sub   { font-size: 10px; color: var(--text-muted); margin-top: 4px; }

        /* â”€â”€ Month Section â”€â”€ */
        .month-section { margin-bottom: 28px; }
        .month-header {
            background: var(--dark-header); color: #FFFFFF;
            padding: 10px 16px; border-radius: 6px 6px 0 0;
            font-size: 14px; font-weight: 700;
        }

        /* â”€â”€ Data Table â”€â”€ */
        .data-table { width: 100%; border-collapse: collapse; font-size: 10.5px; }
        .data-table thead th {
            background: #F8F9FA; color: var(--text-strong);
            padding: 8px 10px; text-align: left; font-weight: 700;
            border-bottom: 2px solid var(--border); font-size: 10px;
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .data-table tbody td { padding: 7px 10px; border-bottom: 1px solid var(--border); }
        .data-table tbody tr:nth-child(even) { background: #FAFBFC; }
        .data-table tbody tr:hover { background: var(--primary-light); }

        .text-right  { text-align: right; }
        .text-center { text-align: center; }
        .text-muted  { color: var(--text-muted); }
        .text-success { color: var(--success); }
        .text-danger  { color: var(--danger); }
        .text-warning { color: var(--warning); }
        .font-bold { font-weight: 700; }

        /* â”€â”€ Subtotal / Grand total rows â”€â”€ */
        .subtotal-row td {
            background: #F0F4F8 !important; font-weight: 700;
            border-top: 2px solid var(--border); padding: 9px 10px;
        }
        .grand-total-row td {
            background: var(--dark-header) !important; color: #FFFFFF;
            font-weight: 800; padding: 10px; font-size: 11px;
        }

        /* â”€â”€ Site sub-header â”€â”€ */
        .site-header td {
            background: #EBF4FC !important; font-weight: 700; color: var(--primary-dark);
            padding: 6px 10px; font-size: 10.5px;
        }

        /* â”€â”€ Variance badge â”€â”€ */
        .variance-ok  { color: var(--success); }
        .variance-bad { color: var(--danger); font-weight: 700; }

        /* â”€â”€ Report Footer â”€â”€ */
        .report-footer {
            margin-top: 36px; padding-top: 16px;
            border-top: 2px solid var(--border);
            display: flex; justify-content: space-between;
            font-size: 10px; color: var(--text-muted);
        }

        /* Section Label */
        .section-label {
            display: flex; align-items: center; gap: 10px;
            margin-bottom: 14px; margin-top: 4px;
        }
        .section-label h2 {
            font-size: 13px; font-weight: 800; color: var(--text-strong);
            text-transform: uppercase; letter-spacing: 0.8px;
        }
        .section-label::after {
            content: ''; flex: 1; height: 1px; background: var(--border);
        }
        /* Analytics Grid */
        .analytics-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 16px;
            margin-bottom: 16px;
        }
        .chart-card {
            background: var(--surface);
            border: 1px solid var(--border);
            border-radius: 8px;
            overflow: hidden;
        }
        .chart-card-header {
            padding: 12px 16px 10px;
            border-bottom: 1px solid var(--border);
            display: flex; align-items: center; justify-content: space-between;
        }
        .chart-card-title {
            font-size: 11.5px; font-weight: 800; color: var(--text-strong);
            text-transform: uppercase; letter-spacing: 0.5px;
        }
        .chart-card-sub {
            font-size: 10px; color: var(--text-muted); margin-top: 1px;
        }
        .chart-card-body {
            padding: 16px;
            position: relative;
        }
        /* KPI strip */
        .kpi-strip {
            display: grid; grid-template-columns: repeat(3, 1fr);
            gap: 0;
            border-top: 1px solid var(--border);
        }
        .kpi-item {
            padding: 10px 16px;
            border-right: 1px solid var(--border);
        }
        .kpi-item:last-child { border-right: none; }
        .kpi-label { font-size: 9px; font-weight: 700; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
        .kpi-value { font-size: 15px; font-weight: 800; color: var(--text-strong); line-height: 1.2; margin-top: 2px; }
        .kpi-value.good  { color: var(--success); }
        .kpi-value.warn  { color: var(--warning); }
        .kpi-value.bad   { color: var(--danger); }
        .kpi-note { font-size: 9px; color: var(--text-muted); margin-top: 1px; }
        /* Variance Gauges */
        .gauge-grid {
            display: grid; grid-template-columns: repeat(4, 1fr); gap: 12px;
            padding: 16px;
        }
        .gauge-item { text-align: center; }
        .gauge-wrap {
            position: relative; width: 72px; height: 40px;
            margin: 0 auto 6px; overflow: hidden;
        }
        .gauge-wrap canvas { display: block; }
        .gauge-center-val {
            position: absolute; bottom: 0; left: 50%; transform: translateX(-50%);
            font-size: 9px; font-weight: 800; color: var(--text-strong);
            white-space: nowrap;
        }
        .gauge-name  { font-size: 9.5px; font-weight: 700; color: var(--text-strong); }
        .gauge-site  { font-size: 8.5px; color: var(--text-muted); }
        .gauge-status {
            display: inline-block; margin-top: 3px;
            font-size: 8px; font-weight: 700; padding: 1px 6px; border-radius: 20px;
            text-transform: uppercase; letter-spacing: 0.3px;
        }
        .gauge-status.ok  { background: #F0FFF4; color: var(--success); }
        .gauge-status.warn { background: #FFFBEB; color: var(--warning); }
        .gauge-status.bad  { background: #FEF2F2; color: var(--danger); }
        /* Vehicle ranking bars */
        .vehicle-list { padding: 8px 16px 12px; }
        .vehicle-row {
            display: grid; grid-template-columns: 80px 1fr 54px 50px;
            align-items: center; gap: 8px; padding: 5px 0;
            border-bottom: 1px solid #F3F4F6;
        }
        .vehicle-row:last-child { border-bottom: none; }
        .vehicle-plate {
            display: inline-block; background: var(--primary-light); color: var(--primary-dark);
            font-size: 9px; font-weight: 700; padding: 2px 6px; border-radius: 3px;
            letter-spacing: 0.5px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
        }
        .vehicle-bar-track {
            height: 7px; background: var(--bg); border-radius: 4px; overflow: hidden;
        }
        .vehicle-bar-fill {
            height: 100%; border-radius: 4px; background: var(--primary);
            transition: width 0.3s ease;
        }
        .vehicle-bar-fill.ago { background: var(--ago); }
        .vehicle-bar-fill.pms { background: var(--pms); }
        .vehicle-vol { font-size: 10px; font-weight: 700; color: var(--text-strong); text-align: right; }
        .vehicle-txn { font-size: 9px; color: var(--text-muted); text-align: right; }
        /* Days of supply meter */
        .supply-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 0; }
        .supply-item {
            padding: 12px 16px;
            border-right: 1px solid var(--border);
        }
        .supply-item:last-child { border-right: none; }
        .supply-site  { font-size: 10px; font-weight: 800; color: var(--text-strong); margin-bottom: 6px; }
        .supply-meter-track {
            height: 8px; background: var(--bg); border-radius: 4px; overflow: hidden; margin-bottom: 4px;
        }
        .supply-meter-fill {
            height: 100%; border-radius: 4px;
        }
        .supply-days  { font-size: 18px; font-weight: 900; line-height: 1; }
        .supply-label { font-size: 9px; color: var(--text-muted); font-weight: 600; margin-top: 2px; }
        .supply-stock { font-size: 9px; color: var(--text-muted); margin-top: 2px; }

        @media print {
            body { background: #fff; }
            .page { padding: 0; max-width: none; }
        }
    </style>
</head>
<body>
<div class=""page"">

    <!-- Company Bar -->
    <div class=""company-bar"">
        <div class=""company-bar-left"">
            {{#if logoBase64}}<img class=""company-logo"" src=""{{logoBase64}}"" alt=""Logo"">{{/if}}
            <div class=""company-bar-titles"">
                <span class=""company-main-title"">Hyoung Fleet Management</span>
                <span class=""company-sub-title"">Fleet Management &amp; Fueling Operations</span>
            </div>
        </div>
        <div class=""company-bar-right"">Analytics Report</div>
    </div>

    <!-- Report Header -->
    <div class=""report-header"">
        <div class=""report-title"">
            <h1>Transaction History Summary</h1>
            <p>{{reportSubtitle}}</p>
        </div>
        <div class=""report-meta"">
            <p><strong>Generated:</strong> {{generatedAt}}</p>
            <p><strong>By:</strong> {{generatedBy}}</p>
            <div class=""badge-period"">{{dateFrom}} â€” {{dateTo}}</div>
        </div>
    </div>

    <!-- Summary Cards -->
    {{#if summary}}
    <div class=""summary-section"">
        <div class=""summary-card"">
            <div class=""card-icon""><svg width=""16"" height=""16"" viewBox=""0 0 24 24""><path d=""M19 3H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm-7 14H6v-2h6v2zm4-4H6v-2h10v2zm0-4H6V7h10v2z""/></svg></div>
            <div class=""card-value"">{{summary.totalTransactions}}</div>
            <div class=""card-label"">Total Transactions</div>
            <div class=""card-sub"">{{summary.monthsCovered}} month(s) Â· {{summary.sitesMonitored}} site(s) Â· {{summary.tanksMonitored}} tank(s)</div>
        </div>
        <div class=""summary-card alt"">
            <div class=""card-icon""><svg width=""16"" height=""16"" viewBox=""0 0 24 24""><path d=""M20 6h-4V4c0-1.1-.9-2-2-2h-4c-1.1 0-2 .9-2 2v2H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zM10 4h4v2h-4V4z""/></svg></div>
            <div class=""card-value"">{{summary.totalDispensed}} L</div>
            <div class=""card-label"">Total Dispensed</div>
            <div class=""card-sub"">Avg {{summary.avgDailyDispensed}} L/day across all sites</div>
        </div>
        <div class=""summary-card success-card"">
            <div class=""card-icon""><svg width=""16"" height=""16"" viewBox=""0 0 24 24""><path d=""M5 9.2h3V19H5zM10.6 5h2.8v14h-2.8zm5.6 8H19v6h-2.8z""/></svg></div>
            <div class=""card-value"">{{summary.totalDelivery}} L</div>
            <div class=""card-label"">Total Delivered</div>
        </div>
        <div class=""summary-card accent"">
            <div class=""card-icon""><svg width=""16"" height=""16"" viewBox=""0 0 24 24""><path d=""M6.99 11L3 15l3.99 4v-3H14v-2H6.99v-3zM21 9l-3.99-4v3H10v2h7.01v3L21 9z""/></svg></div>
            <div class=""card-value"">{{summary.netVariance}} L</div>
            <div class=""card-label"">Net Variance</div>
        </div>
    </div>
    {{/if}}

    <!-- Analytics Section -->
    {{#if analytics}}
    <div class=""section-label""><h2>Analytics &amp; Insights</h2></div>

    <!-- Row 1: Daily Trend + Transaction Type -->
    <div class=""analytics-grid"" style=""grid-template-columns: 1.6fr 1fr; margin-bottom: 16px;"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Daily Consumption Trend</div>
                    <div class=""chart-card-sub"">Total litres dispensed per day &#8212; all sites combined</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:200px;"">
                <canvas id=""dailyTrendChart""></canvas>
            </div>
            <div class=""kpi-strip"">
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Peak Day</div>
                    <div class=""kpi-value"">{{analytics.kpis.peakDayLabel}}</div>
                    <div class=""kpi-note"">{{analytics.kpis.peakDayVolume}} dispensed</div>
                </div>
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Avg Daily</div>
                    <div class=""kpi-value"">{{analytics.kpis.avgDailyLabel}}</div>
                    <div class=""kpi-note"">{{analytics.kpis.avgDailyNote}}</div>
                </div>
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Lowest Day</div>
                    <div class=""kpi-value warn"">{{analytics.kpis.lowestDayLabel}}</div>
                    <div class=""kpi-note"">{{analytics.kpis.lowestDayVolume}}</div>
                </div>
            </div>
        </div>
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Transaction Type Split</div>
                    <div class=""chart-card-sub"">By transaction count, all sites</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:160px; display:flex; align-items:center; justify-content:center;"">
                <canvas id=""txnTypeChart"" style=""max-width:160px; max-height:160px;""></canvas>
            </div>
            <div class=""kpi-strip"" style=""grid-template-columns: 1fr 1fr;"">
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Dispensing</div>
                    <div class=""kpi-value"">{{analytics.kpis.dispensingTxnCount}} <span style=""font-size:10px;font-weight:600;color:var(--text-muted)"">txn</span></div>
                </div>
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Deliveries</div>
                    <div class=""kpi-value good"">{{analytics.kpis.deliveryTxnCount}} <span style=""font-size:10px;font-weight:600;color:var(--text-muted)"">txn</span></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Row 2: Site Comparison + Vehicle Type -->
    <div class=""analytics-grid"" style=""margin-bottom: 16px;"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Dispensed by Site</div>
                    <div class=""chart-card-sub"">Monthly comparison &#8212; litres dispensed</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:210px;"">
                <canvas id=""siteCompareChart""></canvas>
            </div>
        </div>
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Consumption by Vehicle Type</div>
                    <div class=""chart-card-sub"">Total litres dispensed per fleet category</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:210px;"">
                <canvas id=""vehicleTypeChart""></canvas>
            </div>
        </div>
    </div>

    <!-- Row 3: Top Vehicles + Days of Supply -->
    <div class=""analytics-grid"" style=""grid-template-columns: 1fr 1fr; margin-bottom: 16px;"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Top 10 Vehicles by Consumption</div>
                    <div class=""chart-card-sub"">Litres dispensed over the period</div>
                </div>
            </div>
            <div class=""vehicle-list"">
                {{#each analytics.topVehicles}}
                <div class=""vehicle-row"">
                    <span class=""vehicle-plate"">{{plate}}</span>
                    <div class=""vehicle-bar-track""><div class=""vehicle-bar-fill {{fuelType}}"" style=""width:{{widthPercent}}%""></div></div>
                    <span class=""vehicle-vol"">{{litresFormatted}} L</span>
                    <span class=""vehicle-txn"">{{txnCount}} txn</span>
                </div>
                {{/each}}
            </div>
        </div>
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Days of Supply Remaining</div>
                    <div class=""chart-card-sub"">Based on closing stock &#247; avg daily consumption</div>
                </div>
            </div>
            <div class=""supply-grid"">
                {{#each analytics.daysOfSupply}}
                <div class=""supply-item"">
                    <div class=""supply-site"">{{siteName}}</div>
                    <div class=""supply-meter-track"">
                        <div class=""supply-meter-fill"" style=""width:{{widthPercent}}%; background: {{statusColor}}; height:100%;""></div>
                    </div>
                    <div class=""supply-days"" style=""color:{{statusColor}}"">{{days}} <span style=""font-size:10px;font-weight:600;color:var(--text-muted)"">days</span></div>
                    <div class=""supply-stock"">Closing: {{closingStockFormatted}} L &#183; Avg: {{avgDailyFormatted}} L/day</div>
                </div>
                {{/each}}
            </div>
            <div class=""kpi-strip"">
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Avg L / Vehicle / Txn</div>
                    <div class=""kpi-value"">{{analytics.kpis.avgPerVehicleTxn}}</div>
                </div>
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Total Days Covered</div>
                    <div class=""kpi-value"">{{analytics.kpis.avgDailyNote}}</div>
                </div>
                <div class=""kpi-item"">
                    <div class=""kpi-label"">&#9888; Low Stock Alert</div>
                    <div class=""kpi-value bad"">{{analytics.kpis.lowStockAlertCount}} sites</div>
                    <div class=""kpi-note"">{{analytics.kpis.lowStockSites}}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Row 4: Variance Health Gauges -->
    <div class=""chart-card"" style=""margin-bottom: 28px;"">
        <div class=""chart-card-header"">
            <div>
                <div class=""chart-card-title"">Variance Health &#8212; Per Tank</div>
                <div class=""chart-card-sub"">Actual closing vs expected closing &#183; green &lt;0.5% &#183; amber 0.5&#8211;2% &#183; red &gt;2%</div>
            </div>
        </div>
        <div class=""gauge-grid"" id=""gaugeGrid""></div>
    </div>
    {{/if}}

    <!-- Monthly Detail -->
    <div class=""section-label""><h2>Monthly Detail</h2></div>

    <!-- Monthly Groups -->
    {{#each monthlyGroups}}
    <div class=""month-section"">
        <div class=""month-header"">{{monthLabel}}</div>
        <table class=""data-table"">
            <thead>
                <tr>
                    <th>Tank</th>
                    <th class=""text-right"">Opening (L)</th>
                    <th class=""text-right"">Dispensing (L)</th>
                    <th class=""text-center"">Disp. #</th>
                    <th class=""text-right"">Delivery (L)</th>
                    <th class=""text-center"">Del. #</th>
                    <th class=""text-right"">Transfer (L)</th>
                    <th class=""text-center"">Xfer #</th>
                    <th class=""text-right"">Closing (L)</th>
                    <th class=""text-right"">Variance (L)</th>
                    <th class=""text-right"">Avg Daily (L)</th>
                </tr>
            </thead>
            <tbody>
                {{#each siteGroups}}
                <tr class=""site-header"">
                    <td colspan=""11"">{{siteName}}</td>
                </tr>
                {{#each tanks}}
                <tr>
                    <td class=""font-bold"">{{tankName}}</td>
                    <td class=""text-right"">{{openingBalance}}</td>
                    <td class=""text-right text-danger"">{{dispensing.total}}</td>
                    <td class=""text-center text-muted"">{{dispensing.count}}</td>
                    <td class=""text-right text-success"">{{delivery.total}}</td>
                    <td class=""text-center text-muted"">{{delivery.count}}</td>
                    <td class=""text-right"">{{transfer.total}}</td>
                    <td class=""text-center text-muted"">{{transfer.count}}</td>
                    <td class=""text-right font-bold"">{{closingBalance}}</td>
                    <td class=""text-right {{#if varianceIsNegative}}variance-bad{{else}}variance-ok{{/if}}"">{{variance}} ({{variancePercent}})</td>
                    <td class=""text-right text-muted"">{{avgDailyConsumption}}</td>
                </tr>
                {{/each}}
                {{/each}}
                <!-- Month subtotal -->
                <tr class=""subtotal-row"">
                    <td>Subtotal â€” {{monthLabel}}</td>
                    <td></td>
                    <td class=""text-right"">{{subtotal.dispensing}}</td>
                    <td class=""text-center"">{{subtotal.dispensingCount}}</td>
                    <td class=""text-right"">{{subtotal.delivery}}</td>
                    <td class=""text-center"">{{subtotal.deliveryCount}}</td>
                    <td class=""text-right"">{{subtotal.transfer}}</td>
                    <td class=""text-center"">{{subtotal.transferCount}}</td>
                    <td></td>
                    <td class=""text-right"">{{subtotal.variance}}</td>
                    <td></td>
                </tr>
            </tbody>
        </table>
    </div>
    {{/each}}

    <!-- Grand Total -->
    {{#if grandTotal}}
    <table class=""data-table"" style=""margin-top: 8px;"">
        <tbody>
            <tr class=""grand-total-row"">
                <td>Grand Total</td>
                <td></td>
                <td class=""text-right"">{{grandTotal.dispensing}} L</td>
                <td></td>
                <td class=""text-right"">{{grandTotal.delivery}} L</td>
                <td></td>
                <td class=""text-right"">{{grandTotal.transfer}} L</td>
                <td></td>
                <td></td>
                <td class=""text-right {{#if grandTotal.varianceIsNegative}}text-danger{{else}}text-success{{/if}}"">{{grandTotal.variance}} L</td>
                <td></td>
            </tr>
        </tbody>
    </table>
    {{/if}}

    {{#unless monthlyGroups}}
    <div style=""text-align:center; padding:60px 20px; color: var(--text-muted);"">
        <p style=""font-size: 14px; font-weight: 600;"">No transaction data found for the selected period.</p>
        <p style=""font-size: 12px; margin-top: 8px;"">Try adjusting the date range, site, or tank filters.</p>
    </div>
    {{/unless}}

    <!-- Footer -->
    <div class=""report-footer"">
        <div><strong>FMS Fleet Management System</strong> &#183; Transaction History Summary + Analytics</div>
        <div style=""text-align:right;"">Report ID: {{reportId}}</div>
    </div>
</div>

<script>
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = ""'Nunito Sans', 'Segoe UI', Arial, sans-serif"";
    Chart.defaults.font.size = 10;
    Chart.defaults.color = '#6B7280';

    var PRIMARY   = '#0078D4';
    var SUCCESS   = '#107C10';
    var DANGER    = '#DC3545';
    var WARNING   = '#D97706';
    var BORDER    = '#E5E7EB';

    var cd = {{{analyticsJson}}};

    // 1. Daily Consumption Trend
    if (cd.dailyTrend && cd.dailyTrend.labels.length > 0) {
        new Chart(document.getElementById('dailyTrendChart'), {
            type: 'line',
            data: {
                labels: cd.dailyTrend.labels,
                datasets: [{
                    data: cd.dailyTrend.data,
                    borderColor: PRIMARY,
                    backgroundColor: 'rgba(0,120,212,0.08)',
                    borderWidth: 1.8,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 0,
                    pointHoverRadius: 4,
                    pointHoverBackgroundColor: PRIMARY
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false }, tooltip: {
                    callbacks: { label: function(ctx) { return ' ' + ctx.parsed.y.toLocaleString() + ' L'; } }
                }},
                scales: {
                    x: { grid: { display: false }, ticks: { maxTicksLimit: 8, maxRotation: 0 } },
                    y: { grid: { color: BORDER }, ticks: {
                        callback: function(v) { return (v/1000).toFixed(1)+'k'; }
                    }}
                }
            }
        });
    }

    // 2. Transaction Type Donut
    if (cd.txnTypeSplit && cd.txnTypeSplit.data.some(function(v){return v>0;})) {
        new Chart(document.getElementById('txnTypeChart'), {
            type: 'doughnut',
            data: {
                labels: cd.txnTypeSplit.labels,
                datasets: [{
                    data: cd.txnTypeSplit.data,
                    backgroundColor: [DANGER, SUCCESS, PRIMARY, WARNING],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: true,
                cutout: '68%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, padding: 8, font:{size:9} } }
                }
            }
        });
    }

    // 3. Site Comparison Bar
    if (cd.siteComparison && cd.siteComparison.labels.length > 0) {
        var scDatasets = cd.siteComparison.datasets.map(function(ds, i) {
            return { label: ds.label, data: ds.data, backgroundColor: i === 0 ? PRIMARY : 'rgba(0,120,212,0.35)', borderRadius: 3, barPercentage: 0.7 };
        });
        new Chart(document.getElementById('siteCompareChart'), {
            type: 'bar',
            data: { labels: cd.siteComparison.labels, datasets: scDatasets },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { position: 'top', labels: { boxWidth: 10, padding: 12 } } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: BORDER }, ticks: { callback: function(v) { return (v/1000)+'k L'; } } }
                }
            }
        });
    }

    // 4. Vehicle Type Consumption
    if (cd.vehicleTypeConsumption && cd.vehicleTypeConsumption.labels.length > 0) {
        var vtColors = [PRIMARY, SUCCESS, WARNING, '#7C3AED', DANGER, '#0EA5E9'];
        var vtTotal = cd.vehicleTypeConsumption.total;
        new Chart(document.getElementById('vehicleTypeChart'), {
            type: 'bar',
            data: {
                labels: cd.vehicleTypeConsumption.labels,
                datasets: [{
                    label: 'Litres Dispensed',
                    data: cd.vehicleTypeConsumption.data,
                    backgroundColor: vtColors.slice(0, cd.vehicleTypeConsumption.labels.length),
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: function(ctx) {
                                var pct = ((ctx.parsed.x / vtTotal) * 100).toFixed(1);
                                return ' ' + ctx.parsed.x.toLocaleString() + ' L  (' + pct + '%)';
                            }
                        }
                    }
                },
                scales: {
                    x: { grid: { color: BORDER }, ticks: { callback: function(v) { return (v/1000)+'k L'; } } },
                    y: { grid: { display: false }, ticks: { font: { size: 10, weight: '700' } } }
                }
            },
            plugins: [{
                id: 'pctLabels',
                afterDatasetsDraw: function(chart) {
                    var ctx2 = chart.ctx;
                    chart.data.datasets.forEach(function(dataset, di) {
                        chart.getDatasetMeta(di).data.forEach(function(bar, i) {
                            var val = dataset.data[i];
                            var pct = ((val / vtTotal) * 100).toFixed(1);
                            ctx2.save();
                            ctx2.font = '700 9px Nunito Sans, sans-serif';
                            ctx2.fillStyle = '#6B7280';
                            ctx2.textAlign = 'left';
                            ctx2.textBaseline = 'middle';
                            ctx2.fillText(pct + '%', bar.x + 6, bar.y);
                            ctx2.restore();
                        });
                    });
                }
            }]
        });
    }

    // 5. Variance Gauges
    if (cd.varianceGauges && cd.varianceGauges.length > 0) {
        var gaugeGrid = document.getElementById('gaugeGrid');
        cd.varianceGauges.forEach(function(t, i) {
            var pct = t.variancePercent;
            var status = t.status;
            var color = status === 'ok' ? SUCCESS : status === 'warn' ? WARNING : DANGER;
            var filled = t.filledRatio;

            var div = document.createElement('div');
            div.className = 'gauge-item';
            div.innerHTML = '<div class=""gauge-wrap""><canvas id=""gauge' + i + '"" width=""72"" height=""40""></canvas><div class=""gauge-center-val"">' + (pct === 0 ? '\u2713 0.00%' : '-' + pct.toFixed(2) + '%') + '</div></div><div class=""gauge-name"">' + t.tankName + '</div><div class=""gauge-site"">' + t.siteName + '</div><span class=""gauge-status ' + status + '"">' + (status === 'ok' ? 'Normal' : status === 'warn' ? 'Monitor' : 'Alert') + '</span>';
            gaugeGrid.appendChild(div);

            setTimeout(function() {
                new Chart(document.getElementById('gauge' + i).getContext('2d'), {
                    type: 'doughnut',
                    data: {
                        datasets: [{
                            data: [filled, 1 - filled],
                            backgroundColor: [color, '#F3F4F6'],
                            borderWidth: 0,
                            circumference: 180,
                            rotation: 270
                        }]
                    },
                    options: {
                        responsive: false,
                        cutout: '72%',
                        plugins: { legend: { display: false }, tooltip: { enabled: false } }
                    }
                });
            }, 0);
        });
    }
}
</script>
</body>
</html>";
    }
}
