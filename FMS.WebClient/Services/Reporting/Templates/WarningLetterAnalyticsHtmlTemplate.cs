/**
 * File:          WarningLetterAnalyticsHtmlTemplate.cs
 * Purpose:       JsReport HTML template for Warning Letter Analytics report with Chart.js dashboards.
 * Dependencies:  Chart.js 4.4.1 CDN, Handlebars
 * Last Modified: 2026-06-15
 *
 * Key Functions:
 * - Get(): Returns the full HTML template string
 */
namespace FMS.WebClient.Services.Reporting;

internal static class WarningLetterAnalyticsHtmlTemplate
{
    public static string Get() => @"<!DOCTYPE html>
<html>
<head>
<meta charset=""utf-8"">
<title>Warning Letter Analytics</title>
<script src=""https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js""></script>
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
    .page { max-width:1200px; margin:0 auto; padding:24px 32px; }

    .company-bar { display:flex; align-items:center; gap:12px; padding-bottom:12px; border-bottom:2px solid var(--primary); margin-bottom:16px; }
    .company-bar img { height:36px; }
    .company-bar .company-name { font-size:15px; font-weight:700; color:var(--primary); }
    .company-bar .company-sub { font-size:10px; color:var(--text-muted); }

    .report-header { display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:20px; }
    .report-header h1 { font-size:18px; font-weight:700; color:var(--text-main); }
    .report-header .meta { font-size:10px; color:var(--text-muted); text-align:right; }
    .badge-period { display:inline-block; background:var(--primary); color:#fff; border-radius:10px; padding:2px 10px; font-size:10px; font-weight:600; margin-top:4px; }

    .summary-section { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:10px; margin-bottom:20px; }
    .summary-card { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:14px 16px; border-top:3px solid var(--primary); }
    .summary-card.success { border-top-color:var(--success); }
    .summary-card.danger { border-top-color:var(--danger); }
    .summary-card.warning { border-top-color:var(--warning); }
    .summary-card .label { font-size:10px; color:var(--text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px; }
    .summary-card .value { font-size:22px; font-weight:700; margin-top:4px; }
    .summary-card .sub { font-size:10px; color:var(--text-muted); margin-top:2px; }
    .summary-card .meta { font-size:10px; color:var(--text-muted); margin-top:6px; line-height:1.35; }

    .workflow-strip { display:grid; grid-template-columns:repeat(5,1fr); gap:10px; margin:-4px 0 20px; }
    .workflow-step { position:relative; background:var(--bg-card); border:1px solid var(--border); border-top:3px solid var(--primary); border-radius:8px; padding:12px 14px; min-height:84px; }
    .workflow-step::after { content:'\2192'; position:absolute; right:-9px; top:50%; transform:translateY(-50%); color:var(--text-muted); font-size:16px; font-weight:700; }
    .workflow-step:last-child::after { display:none; }
    .workflow-step__header { display:flex; align-items:center; justify-content:space-between; gap:8px; margin-bottom:8px; }
    .workflow-step__title { font-size:12px; font-weight:700; }
    .workflow-step__count { min-width:26px; height:26px; padding:0 8px; border-radius:999px; background:var(--bg-light); color:var(--text-main); display:inline-flex; align-items:center; justify-content:center; font-size:11px; font-weight:700; }
    .workflow-step__desc { font-size:10px; color:var(--text-muted); line-height:1.45; }

    .analytics-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .chart-card { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
    .chart-card-header { padding:12px 16px; border-bottom:1px solid var(--border); }
    .chart-card-title { font-size:13px; font-weight:700; }
    .chart-card-sub { font-size:10px; color:var(--text-muted); margin-top:2px; }
    .chart-card-body { padding:8px 10px; }

    .kpi-strip { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--border); }
    .kpi-item { padding:10px 16px; text-align:center; border-right:1px solid var(--border); }
    .kpi-item:last-child { border-right:none; }
    .kpi-label { font-size:9px; color:var(--text-muted); text-transform:uppercase; font-weight:600; }
    .kpi-value { font-size:16px; font-weight:700; margin-top:2px; }
    .kpi-value.good { color:var(--success); }
    .kpi-value.bad { color:var(--danger); }

    .ranking-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:20px; }
    .ranking-card { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
    .ranking-card__header { padding:12px 16px; border-bottom:1px solid var(--border); }
    .ranking-card__title { font-size:13px; font-weight:700; }
    .ranking-card__sub { font-size:10px; color:var(--text-muted); margin-top:2px; }
    .ranking-card__body { padding:0 16px 12px; }

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
    .text-success { color:var(--success); }
    .section-sub { margin:-4px 0 10px; font-size:10px; color:var(--text-muted); }
    .stage-badge { display:inline-flex; align-items:center; border:1px solid var(--border); border-radius:999px; padding:2px 8px; font-size:10px; font-weight:700; white-space:nowrap; }

    .stage-durations { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .stage-pill { background:var(--bg-light); border:1px solid var(--border); border-radius:16px; padding:6px 14px; font-size:11px; }
    .stage-pill .days { font-weight:700; color:var(--primary); }

    .report-footer { display:flex; justify-content:space-between; font-size:9px; color:var(--text-muted); border-top:1px solid var(--border); padding-top:10px; margin-top:32px; }
    .keep-together { break-inside: avoid-page; page-break-inside: avoid; }
    .page-break-before { break-before: page; page-break-before: always; }
    .detail-table thead { display: table-header-group; }
    .detail-table tr { break-inside: avoid-page; page-break-inside: avoid; }

    @media print {
        .page { padding:12px; }
        .keep-together { break-inside: avoid-page; page-break-inside: avoid; }
        .page-break-before { break-before: page; page-break-before: always; }
        .detail-table thead { display: table-header-group; }
    }
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
            <h1>Warning Letter Analytics</h1>
        </div>
        <div class=""meta"">
            Generated: {{generatedAt}}<br>
            {{#if dateFrom}}<span class=""badge-period"">{{dateFrom}} &mdash; {{dateTo}}</span>{{/if}}
        </div>
    </div>

    <!-- Summary Cards -->
    {{#if analytics}}
    <div class=""summary-section"">
        <div class=""summary-card"">
            <div class=""label"">Total Letters</div>
            <div class=""value"">{{analytics.totalLetters}}</div>
            <div class=""sub"">{{analytics.uniqueEmployees}} employees</div>
        </div>
        <div class=""summary-card danger"">
            <div class=""label"">Excess Fuel</div>
            <div class=""value"">{{analytics.totalExcessFuelLitresFormatted}} L</div>
            <div class=""sub"">Fuel loss across excess fuel letters</div>
        </div>
        <div class=""summary-card warning"">
            <div class=""label"">Avg Days to Acknowledge</div>
            <div class=""value"">{{analytics.avgDaysToAcknowledge}}</div>
            <div class=""sub"">From creation to acknowledged</div>
        </div>
        <div class=""summary-card success"">
            <div class=""label"">Top Speed Employee</div>
            <div class=""value"" style=""font-size:14px;"">{{analytics.topSpeedEmployee.employeeName}}</div>
            <div class=""sub"">{{analytics.topSpeedEmployee.warningCount}} speed warnings</div>
            <div class=""meta"">Vehicle: {{analytics.topSpeedEmployee.vehicleHyoungNo}}</div>
        </div>
        <div class=""summary-card"">
            <div class=""label"">Top Fuel Employee</div>
            <div class=""value"" style=""font-size:14px;"">{{analytics.topFuelEmployee.employeeName}}</div>
            <div class=""sub"">{{analytics.topFuelEmployee.warningCount}} fuel warnings</div>
            <div class=""meta"">Vehicle: {{analytics.topFuelEmployee.vehicleHyoungNo}}</div>
        </div>
    </div>
    {{#if analytics.workflowStages}}
    <div class=""workflow-strip"">
        {{#each analytics.workflowStages}}
        <div class=""workflow-step"" style=""border-top-color:{{color}};"">
            <div class=""workflow-step__header"">
                <span class=""workflow-step__title"" style=""color:{{color}};"">{{label}}</span>
                <span class=""workflow-step__count"">{{count}}</span>
            </div>
            <div class=""workflow-step__desc"">{{description}}</div>
        </div>
        {{/each}}
    </div>
    {{/if}}

    <!-- Stage Breakdown + Letter Type -->
    <div class=""analytics-grid"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Letters by Workflow Stage</div>
                    <div class=""chart-card-sub"">Distribution across workflow stages</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""stageChart""></canvas>
            </div>
        </div>
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Letters by Type</div>
                    <div class=""chart-card-sub"">Excess Fuel vs Speed vs Idling</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""letterTypeChart""></canvas>
            </div>
        </div>
    </div>

    <!-- Monthly Trend + Excess Warning Letters by Site -->
    <div class=""analytics-grid page-break-before"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Monthly Trend</div>
                    <div class=""chart-card-sub"">Number of warning letters issued across the selected period, shown by issue date.</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""monthlyTrendChart""></canvas>
            </div>
        </div>
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Excess Warning Letters by Site</div>
                    <div class=""chart-card-sub"">Stacked count of excess fuel consumption and excessive speed warning letters by site</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""excessFuelBySiteChart""></canvas>
            </div>
        </div>
    </div>

    <!-- Warning Letters by Vehicle Type + Stage Duration -->
    <div class=""analytics-grid"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Warning Letters by Vehicle Type</div>
                    <div class=""chart-card-sub"">Stacked count of excess fuel consumption and excessive speed warning letters by vehicle type</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""excessFuelByVehicleTypeChart""></canvas>
            </div>
        </div>
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Average Days Between Stages</div>
                    <div class=""chart-card-sub"">How long letters stay in each stage</div>
                </div>
            </div>
            <div class=""chart-card-body"">
                <div class=""stage-durations"">
                    {{#each analytics.averageDaysBetweenStages}}
                    <div class=""stage-pill"">{{transition}}: <span class=""days"">{{averageDays}} days</span></div>
                    {{/each}}
                </div>
            </div>
            <div class=""kpi-strip"">
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Total Letters</div>
                    <div class=""kpi-value"">{{analytics.totalLetters}}</div>
                </div>
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Unique Employees</div>
                    <div class=""kpi-value"">{{analytics.uniqueEmployees}}</div>
                </div>
                <div class=""kpi-item"">
                    <div class=""kpi-label"">Avg Days to Ack</div>
                    <div class=""kpi-value"">{{analytics.avgDaysToAcknowledge}}</div>
                </div>
            </div>
        </div>
    </div>

    <!-- Employee Ranking -->
    <div class=""keep-together"">
    <div class=""section-label""><h2>Top 10 Employees by Warnings</h2></div>
    <div class=""section-sub"">Split by warning type for excessive speed and fuel consumption.</div>
    <div class=""ranking-grid"">
        <div class=""ranking-card"">
            <div class=""ranking-card__header"">
                <div class=""ranking-card__title"">Excessive Speed Warnings</div>
                <div class=""ranking-card__sub"">Top employees ranked by speed warning count.</div>
            </div>
            <div class=""ranking-card__body"">
                <table class=""data-table"" style=""margin-bottom:0;"">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Vehicle</th>
                            <th>Warning Type</th>
                            <th class=""text-center"">Count</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each analytics.speedEmployeeRanking}}
                        <tr>
                            <td>{{employeeName}}</td>
                            <td>{{vehicleHyoungNo}}</td>
                            <td>{{warningType}}</td>
                            <td class=""text-center"">{{warningCount}}</td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
        </div>
        <div class=""ranking-card"">
            <div class=""ranking-card__header"">
                <div class=""ranking-card__title"">Excess Fuel Consumption Warnings</div>
                <div class=""ranking-card__sub"">Top employees ranked by fuel warning count and litres lost.</div>
            </div>
            <div class=""ranking-card__body"">
                <table class=""data-table"" style=""margin-bottom:0;"">
                    <thead>
                        <tr>
                            <th>Employee</th>
                            <th>Vehicle</th>
                            <th>Warning Type</th>
                            <th class=""text-center"">Count</th>
                            <th class=""text-right"">Fuel Loss (L)</th>
                        </tr>
                    </thead>
                    <tbody>
                        {{#each analytics.fuelEmployeeRanking}}
                        <tr>
                            <td>{{employeeName}}</td>
                            <td>{{vehicleHyoungNo}}</td>
                            <td>{{warningType}}</td>
                            <td class=""text-center"">{{warningCount}}</td>
                            <td class=""text-right"">{{totalExcessFuelLitresFormatted}}</td>
                        </tr>
                        {{/each}}
                    </tbody>
                </table>
            </div>
        </div>
    </div>
    </div>

    {{/if}}

    <!-- Detail Table -->
    {{#if records}}
    <table class=""data-table detail-table"">
        <thead>
            <tr>
                <th colspan=""8"">Warning Letters Detail</th>
            </tr>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Vehicle</th>
                <th>Site</th>
                <th>Type</th>
                <th>Stage</th>
                <th class=""text-right"">Excess Fuel (L)</th>
            </tr>
        </thead>
        <tbody>
            {{#each records}}
            <tr>
                <td>{{rowNumber}}</td>
                <td>{{letterDateFormatted}}</td>
                <td>{{employeeName}}</td>
                <td>{{vehicleHyoungNo}}</td>
                <td>{{siteName}}</td>
                <td>{{letterTypeName}}</td>
                <td><span class=""stage-badge"" style=""background:{{workflowStageTint}}; border-color:{{workflowStageBorderColor}}; color:{{workflowStageColor}};"">{{workflowStageName}}</span></td>
                <td class=""text-right"">{{excessFuelLitresDisplay}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{else}}
    <div style=""text-align:center; padding:60px 20px; color: var(--text-muted);"">
        <p style=""font-size: 14px; font-weight: 600;"">No warning letters found for the selected period.</p>
        <p style=""font-size: 12px; margin-top: 8px;"">Try adjusting the date range or filters.</p>
    </div>
    {{/if}}

    <!-- Footer -->
    <div class=""report-footer"">
        <div><strong>FMS Fleet Management System</strong> &middot; Warning Letter Analytics Report</div>
        <div style=""text-align:right;"">Report ID: {{reportId}}</div>
    </div>
</div>

<script>
if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family = ""'Segoe UI', 'Nunito Sans', Arial, sans-serif"";
    Chart.defaults.font.size = 10;
    Chart.defaults.color = '#6B7280';

    var PRIMARY = '#0078D4';
    var SUCCESS = '#107C10';
    var DANGER  = '#DC3545';
    var WARNING = '#D97706';
    var PURPLE  = '#7C3AED';
    var BORDER  = '#E5E7EB';

    var cd = {{{analyticsJson}}};
    var doughnutPercentageLabels = {
        id: 'doughnutPercentageLabels',
        afterDatasetsDraw: function(chart) {
            if (chart.config.type !== 'doughnut') {
                return;
            }

            var dataset = chart.data.datasets && chart.data.datasets[0];
            if (!dataset || !dataset.data || !dataset.data.length) {
                return;
            }

            var total = dataset.data.reduce(function(sum, value) {
                return sum + (Number(value) || 0);
            }, 0);

            if (!total) {
                return;
            }

            var ctx = chart.ctx;
            var meta = chart.getDatasetMeta(0);

            ctx.save();
            ctx.font = ""600 9px 'Segoe UI', Arial, sans-serif"";
            ctx.fillStyle = '#ffffff';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            meta.data.forEach(function(element, index) {
                var value = Number(dataset.data[index]) || 0;
                if (!value) {
                    return;
                }

                var props = element.getProps(['x', 'y', 'startAngle', 'endAngle', 'innerRadius', 'outerRadius'], true);
                var angle = (props.startAngle + props.endAngle) / 2;
                var radius = props.innerRadius + ((props.outerRadius - props.innerRadius) * 0.58);
                var x = props.x + Math.cos(angle) * radius;
                var y = props.y + Math.sin(angle) * radius;
                var percentage = Math.round((value / total) * 100);

                ctx.fillText(String(percentage) + '%', x, y);
            });

            ctx.restore();
        }
    };
    var stackedBarValueLabels = {
        id: 'stackedBarValueLabels',
        afterDatasetsDraw: function(chart) {
            var ctx = chart.ctx;
            ctx.save();
            ctx.font = ""600 10px 'Segoe UI', Arial, sans-serif"";
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            chart.data.datasets.forEach(function(dataset, datasetIndex) {
                var meta = chart.getDatasetMeta(datasetIndex);
                if (!meta || meta.hidden) {
                    return;
                }

                meta.data.forEach(function(element, index) {
                    var value = dataset.data[index];
                    if (!value) {
                        return;
                    }

                    var props = element.getProps(['x', 'y', 'base'], true);
                    var centerY = props.y + ((props.base - props.y) / 2);
                    if (Math.abs(props.base - props.y) < 16) {
                        centerY = props.y - 8;
                    }

                    ctx.fillStyle = '#ffffff';
                    ctx.fillText(String(value), props.x, centerY);
                });
            });

            ctx.restore();
        }
    };

    // 1. Stage Breakdown Doughnut
    if (cd.stageBreakdown && cd.stageBreakdown.labels.length > 0) {
        new Chart(document.getElementById('stageChart'), {
            type: 'doughnut',
            plugins: [doughnutPercentageLabels],
            data: {
                labels: cd.stageBreakdown.labels,
                datasets: [{
                    data: cd.stageBreakdown.data,
                    backgroundColor: cd.stageBreakdown.colors || ['#9CA3AF', PRIMARY, WARNING, '#0F766E', SUCCESS],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '62%',
                layout: { padding: { top: 2, right: 2, bottom: 2, left: 2 } },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 9, padding: 6, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' }
                    }
                }
            }
        });
    }

    // 2. Letter Type Doughnut
    if (cd.letterTypeBreakdown && cd.letterTypeBreakdown.labels.length > 0) {
        new Chart(document.getElementById('letterTypeChart'), {
            type: 'doughnut',
            plugins: [doughnutPercentageLabels],
            data: {
                labels: cd.letterTypeBreakdown.labels,
                datasets: [{
                    data: cd.letterTypeBreakdown.data,
                    backgroundColor: [DANGER, WARNING, '#0EA5E9'],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '62%',
                layout: { padding: { top: 2, right: 2, bottom: 2, left: 2 } },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { boxWidth: 9, padding: 6, font: { size: 9 }, usePointStyle: true, pointStyle: 'circle' }
                    }
                }
            }
        });
    }

    // 3. Monthly Trend Line
    if (cd.monthlyTrend && cd.monthlyTrend.points && cd.monthlyTrend.points.length > 0) {
        new Chart(document.getElementById('monthlyTrendChart'), {
            type: 'line',
            data: {
                datasets: [{
                    label: 'No. of Warning Letters',
                    data: cd.monthlyTrend.points,
                    parsing: false,
                    borderColor: PRIMARY,
                    backgroundColor: 'rgba(0,120,212,0.08)',
                    borderWidth: 2,
                    fill: true,
                    tension: 0.35,
                    pointRadius: 3,
                    pointBackgroundColor: PRIMARY,
                    pointHoverRadius: 5
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: true, position: 'top' } },
                scales: {
                    x: {
                        type: 'linear',
                        min: cd.monthlyTrend.minOffset,
                        max: cd.monthlyTrend.maxOffset,
                        grid: { display: false },
                        afterBuildTicks: function(scale) {
                            if (cd.monthlyTrend.tickValues && cd.monthlyTrend.tickValues.length) {
                                scale.ticks = cd.monthlyTrend.tickValues.map(function(value) { return { value: value }; });
                            }
                        },
                        ticks: {
                            callback: function(value) {
                                if (value === 0) {
                                    return cd.monthlyTrend.rangeStartLabel || 'Start';
                                }
                                if (value === cd.monthlyTrend.endOffset) {
                                    return cd.monthlyTrend.rangeEndLabel || 'End';
                                }
                                return value;
                            }
                        },
                        title: { display: true, text: 'Days from selected start date' }
                    },
                    y: {
                        grid: { color: BORDER },
                        beginAtZero: true,
                        ticks: { stepSize: 1 },
                        title: { display: true, text: 'No. of Warning Letters' }
                    }
                }
            }
        });
    }

        // 4. Excess Fuel by Site Bar
        if (cd.warningLettersBySite && cd.warningLettersBySite.labels.length > 0) {
            new Chart(document.getElementById('excessFuelBySiteChart'), {
                type: 'bar',
                data: {
                    labels: cd.warningLettersBySite.labels,
                    datasets: [
                        {
                            label: 'Excess Fuel Consumption',
                            data: cd.warningLettersBySite.fuelCounts,
                            backgroundColor: DANGER,
                            borderRadius: 4,
                            barPercentage: 0.6,
                            stack: 'warningLettersBySite'
                        },
                        {
                            label: 'Excessive Speed',
                            data: cd.warningLettersBySite.speedCounts,
                            backgroundColor: WARNING,
                            borderRadius: 4,
                            barPercentage: 0.6,
                            stack: 'warningLettersBySite'
                        }
                    ]
                },
                plugins: [stackedBarValueLabels],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: {
                        legend: { display: true, position: 'top' }
                    },
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: {
                            stacked: true,
                            grid: { color: BORDER },
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            title: { display: true, text: 'Warning Letter Count' }
                        }
                    }
                }
            });
        }

        // 5. Excess Fuel by Vehicle Type Horizontal Bar
        if (cd.warningLettersByVehicleType && cd.warningLettersByVehicleType.labels.length > 0) {
            new Chart(document.getElementById('excessFuelByVehicleTypeChart'), {
                type: 'bar',
                data: {
                    labels: cd.warningLettersByVehicleType.labels,
                    datasets: [
                        {
                            label: 'Excess Fuel Consumption',
                            data: cd.warningLettersByVehicleType.fuelCounts,
                            backgroundColor: SUCCESS,
                            borderRadius: 4,
                            barPercentage: 0.9,
                            categoryPercentage: 0.9,
                            stack: 'warningLettersByVehicleType'
                        },
                        {
                            label: 'Excessive Speed',
                            data: cd.warningLettersByVehicleType.speedCounts,
                            backgroundColor: PRIMARY,
                            borderRadius: 4,
                            barPercentage: 0.9,
                            categoryPercentage: 0.9,
                            stack: 'warningLettersByVehicleType'
                        }
                    ]
                },
                plugins: [stackedBarValueLabels],
                options: {
                    responsive: true, maintainAspectRatio: false,
                    plugins: { legend: { display: true, position: 'top' } },
                    scales: {
                        x: { stacked: true, grid: { display: false } },
                        y: {
                            stacked: true,
                            grid: { color: BORDER },
                            beginAtZero: true,
                            ticks: { stepSize: 1 },
                            title: { display: true, text: 'Warning Letter Count' }
                        }
                    }
                }
            });
        }

}
</script>
</body>
</html>";
}
