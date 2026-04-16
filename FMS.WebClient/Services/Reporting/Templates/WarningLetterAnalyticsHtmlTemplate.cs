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

    .summary-section { display:grid; grid-template-columns:repeat(4,1fr); gap:12px; margin-bottom:20px; }
    .summary-card { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; padding:14px 16px; border-top:3px solid var(--primary); }
    .summary-card.success { border-top-color:var(--success); }
    .summary-card.danger { border-top-color:var(--danger); }
    .summary-card.warning { border-top-color:var(--warning); }
    .summary-card .label { font-size:10px; color:var(--text-muted); text-transform:uppercase; font-weight:600; letter-spacing:0.5px; }
    .summary-card .value { font-size:22px; font-weight:700; margin-top:4px; }
    .summary-card .sub { font-size:10px; color:var(--text-muted); margin-top:2px; }

    .analytics-grid { display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px; }
    .chart-card { background:var(--bg-card); border:1px solid var(--border); border-radius:8px; overflow:hidden; }
    .chart-card-header { padding:12px 16px; border-bottom:1px solid var(--border); }
    .chart-card-title { font-size:13px; font-weight:700; }
    .chart-card-sub { font-size:10px; color:var(--text-muted); margin-top:2px; }
    .chart-card-body { padding:12px 16px; }

    .kpi-strip { display:grid; grid-template-columns:repeat(3,1fr); border-top:1px solid var(--border); }
    .kpi-item { padding:10px 16px; text-align:center; border-right:1px solid var(--border); }
    .kpi-item:last-child { border-right:none; }
    .kpi-label { font-size:9px; color:var(--text-muted); text-transform:uppercase; font-weight:600; }
    .kpi-value { font-size:16px; font-weight:700; margin-top:2px; }
    .kpi-value.good { color:var(--success); }
    .kpi-value.bad { color:var(--danger); }

    .employee-list { padding:8px 16px; }
    .employee-row { display:grid; grid-template-columns:140px 1fr 60px 80px; align-items:center; gap:8px; padding:4px 0; border-bottom:1px solid var(--border); }
    .employee-row:last-child { border-bottom:none; }
    .employee-name { font-size:11px; font-weight:600; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; }
    .employee-bar-track { height:8px; background:var(--bg-light); border-radius:4px; overflow:hidden; }
    .employee-bar-fill { height:100%; border-radius:4px; background:var(--primary); }
    .employee-count { font-size:11px; font-weight:700; text-align:right; }
    .employee-cost { font-size:10px; color:var(--text-muted); text-align:right; }

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

    .stage-durations { display:flex; gap:12px; flex-wrap:wrap; margin-bottom:16px; }
    .stage-pill { background:var(--bg-light); border:1px solid var(--border); border-radius:16px; padding:6px 14px; font-size:11px; }
    .stage-pill .days { font-weight:700; color:var(--primary); }

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
            <div class=""label"">Total Deductions</div>
            <div class=""value"">{{analytics.totalDeductionsFormatted}}</div>
            <div class=""sub"">Excess cost charged</div>
        </div>
        <div class=""summary-card warning"">
            <div class=""label"">Avg Days to Acknowledge</div>
            <div class=""value"">{{analytics.avgDaysToAcknowledge}}</div>
            <div class=""sub"">From creation to acknowledged</div>
        </div>
        <div class=""summary-card success"">
            <div class=""label"">Top Employee</div>
            <div class=""value"" style=""font-size:14px;"">{{analytics.employeeWithMostWarnings.employeeName}}</div>
            <div class=""sub"">{{analytics.employeeWithMostWarnings.count}} warnings</div>
        </div>
    </div>

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

    <!-- Monthly Trend + Deductions by Site -->
    <div class=""analytics-grid"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Monthly Trend</div>
                    <div class=""chart-card-sub"">Warning letters issued per month</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""monthlyTrendChart""></canvas>
            </div>
        </div>
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Deductions by Site</div>
                    <div class=""chart-card-sub"">Total excess cost per site</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""deductionBySiteChart""></canvas>
            </div>
        </div>
    </div>

    <!-- Deductions by Vehicle Type + Stage Duration -->
    <div class=""analytics-grid"">
        <div class=""chart-card"">
            <div class=""chart-card-header"">
                <div>
                    <div class=""chart-card-title"">Deductions by Vehicle Type</div>
                    <div class=""chart-card-sub"">Total excess cost per vehicle category</div>
                </div>
            </div>
            <div class=""chart-card-body"" style=""height:220px;"">
                <canvas id=""deductionByVehicleTypeChart""></canvas>
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
    <div class=""chart-card"" style=""margin-bottom:20px;"">
        <div class=""chart-card-header"">
            <div>
                <div class=""chart-card-title"">Top 10 Employees by Warnings</div>
                <div class=""chart-card-sub"">Employee ranking with warning count and total deduction</div>
            </div>
        </div>
        <div class=""employee-list"">
            {{#each analytics.employeeRanking}}
            <div class=""employee-row"">
                <span class=""employee-name"">{{employeeName}}</span>
                <div class=""employee-bar-track""><div class=""employee-bar-fill"" style=""width:{{widthPercent}}%""></div></div>
                <span class=""employee-count"">{{warningCount}}</span>
                <span class=""employee-cost"">{{totalDeductionFormatted}}</span>
            </div>
            {{/each}}
        </div>
    </div>

    <!-- Last Warning by Employee -->
    <div class=""section-label""><h2>Last Warning per Employee</h2></div>
    <table class=""data-table"">
        <thead>
            <tr>
                <th>Employee</th>
                <th>Last Letter Date</th>
                <th>Letter Type</th>
            </tr>
        </thead>
        <tbody>
            {{#each analytics.lastWarningByEmployee}}
            <tr>
                <td>{{employeeName}}</td>
                <td>{{lastLetterDateFormatted}}</td>
                <td>{{letterType}}</td>
            </tr>
            {{/each}}
        </tbody>
    </table>
    {{/if}}

    <!-- Detail Table -->
    <div class=""section-label""><h2>Warning Letters Detail</h2></div>
    {{#if records}}
    <table class=""data-table"">
        <thead>
            <tr>
                <th>#</th>
                <th>Date</th>
                <th>Employee</th>
                <th>Vehicle</th>
                <th>Site</th>
                <th>Type</th>
                <th>Stage</th>
                <th class=""text-right"">Excess Cost</th>
            </tr>
        </thead>
        <tbody>
            {{#each records}}
            <tr>
                <td>{{@index}}</td>
                <td>{{letterDateFormatted}}</td>
                <td>{{employeeName}}</td>
                <td>{{vehicleHyoungNo}}</td>
                <td>{{siteName}}</td>
                <td>{{letterTypeName}}</td>
                <td>{{workflowStageName}}</td>
                <td class=""text-right"">{{excessCostFormatted}}</td>
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

    // 1. Stage Breakdown Doughnut
    if (cd.stageBreakdown && cd.stageBreakdown.labels.length > 0) {
        new Chart(document.getElementById('stageChart'), {
            type: 'doughnut',
            data: {
                labels: cd.stageBreakdown.labels,
                datasets: [{
                    data: cd.stageBreakdown.data,
                    backgroundColor: ['#A1A1AA', PRIMARY, WARNING, SUCCESS, PURPLE],
                    borderWidth: 2,
                    borderColor: '#ffffff',
                    hoverOffset: 6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                cutout: '62%',
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } }
                }
            }
        });
    }

    // 2. Letter Type Doughnut
    if (cd.letterTypeBreakdown && cd.letterTypeBreakdown.labels.length > 0) {
        new Chart(document.getElementById('letterTypeChart'), {
            type: 'doughnut',
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
                plugins: {
                    legend: { position: 'right', labels: { boxWidth: 10, padding: 8, font: { size: 10 } } }
                }
            }
        });
    }

    // 3. Monthly Trend Line
    if (cd.monthlyTrend && cd.monthlyTrend.labels.length > 0) {
        new Chart(document.getElementById('monthlyTrendChart'), {
            type: 'line',
            data: {
                labels: cd.monthlyTrend.labels,
                datasets: [{
                    data: cd.monthlyTrend.data,
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
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false }, ticks: { maxRotation: 45 } },
                    y: { grid: { color: BORDER }, beginAtZero: true, ticks: { stepSize: 1 } }
                }
            }
        });
    }

    // 4. Deductions by Site Bar
    if (cd.deductionBySite && cd.deductionBySite.labels.length > 0) {
        new Chart(document.getElementById('deductionBySiteChart'), {
            type: 'bar',
            data: {
                labels: cd.deductionBySite.labels,
                datasets: [{
                    label: 'Excess Cost',
                    data: cd.deductionBySite.data,
                    backgroundColor: DANGER,
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { display: false } },
                    y: { grid: { color: BORDER }, beginAtZero: true }
                }
            }
        });
    }

    // 5. Deductions by Vehicle Type Horizontal Bar
    if (cd.deductionByVehicleType && cd.deductionByVehicleType.labels.length > 0) {
        new Chart(document.getElementById('deductionByVehicleTypeChart'), {
            type: 'bar',
            data: {
                labels: cd.deductionByVehicleType.labels,
                datasets: [{
                    label: 'Excess Cost',
                    data: cd.deductionByVehicleType.data,
                    backgroundColor: [PRIMARY, SUCCESS, WARNING, PURPLE, DANGER, '#0EA5E9'],
                    borderRadius: 4,
                    barPercentage: 0.6
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: BORDER }, beginAtZero: true },
                    y: { grid: { display: false }, ticks: { font: { size: 10, weight: '700' } } }
                }
            }
        });
    }
}
</script>
</body>
</html>";
}
