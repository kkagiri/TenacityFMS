/**
 * File: DashboardCharts.js
 * Purpose: Fluent-style Activity Heatmap + 4 chart cards for Issue Dashboard
 * Dependencies: DevExtreme Chart/PieChart, IssueActivityHeatmap
 * Last Modified: 2026-02-23
 *
 * Key Components:
 * - HeatmapCard: wraps IssueActivityHeatmap in a Fluent card
 * - WeekBarChart: issues opened/closed by week (DevExtreme bar)
 * - CategoryPieChart: issues by category (DevExtreme pie)
 * - VehicleBarChart: top vehicles horizontal bar (DevExtreme)
 * - SiteBarChart: top sites horizontal bar (DevExtreme)
 * - DashboardCharts: renders all chart cards
 */
import React from 'react';
import {
    Chart,
    Series,
    CommonSeriesSettings,
    Label,
    Legend,
    Tooltip,
    ArgumentAxis,
    ValueAxis,
} from 'devextreme-react/chart';
import {
    PieChart,
    Series as PieSeries,
    Label as PieLabel,
    Legend as PieLegend,
    Connector,
    Tooltip as PieTooltip,
} from 'devextreme-react/pie-chart';
import IssueActivityHeatmap from './IssueActivityHeatmap';

/* ─────────────────────────────────────────
   Empty state helper
───────────────────────────────────────── */
const EmptyChart = ({ message = 'No data available' }) => (
    <div className="fms-chart-empty">
        <i className="fa-light fa-chart-mixed"></i>
        <span>{message}</span>
    </div>
);

/* ─────────────────────────────────────────
   Card wrapper
───────────────────────────────────────── */
const ChartCard = ({ icon, title, children }) => (
    <div className="fms-card">
        <div className="fms-card__hd">
            <span className="fms-card__title">
                <i className={icon}></i>
                {title}
            </span>
        </div>
        <div className="fms-card__body">{children}</div>
    </div>
);

/* ─────────────────────────────────────────
   Heatmap card
───────────────────────────────────────── */
const HeatmapCard = ({ allIssues }) => (
    <div className="fms-card tw-mb-4">
        <div className="fms-card__hd">
            <span className="fms-card__title">
                <i className="fa-light fa-calendar-days"></i>
                Activity
            </span>
        </div>
        <div className="fms-card__body">
            <IssueActivityHeatmap
                dates={allIssues.map((i) => i.openDate).filter(Boolean)}
                weeks={52}
                title={`${allIssues.length} issues in the last year`}
                colorScheme="green"
                showSummary={true}
            />
        </div>
    </div>
);

/* ─────────────────────────────────────────
   Main export
───────────────────────────────────────── */
const DashboardCharts = ({ dashboardData, allIssues }) => {
    const weekData = dashboardData?.issuesByWeek || [];
    const categoryData = dashboardData?.issuesByCategory || [];
    const vehicleData = (dashboardData?.issuesByVehicle || []).slice(0, 8);
    const siteData = (dashboardData?.issuesBySite || []).slice(0, 8);

    return (
        <>
            {/* Activity Heatmap */}
            <HeatmapCard allIssues={allIssues} />

            {/* 2 × 2 chart grid */}
            <div className="fms-charts-grid tw-mb-4">
                {/* Issues by Week */}
                <ChartCard icon="fa-light fa-chart-bar" title="Issues by Week">
                    {weekData.length > 0 ? (
                        <Chart dataSource={weekData} height={220}>
                            <ArgumentAxis>
                                <Label rotationAngle={-45} displayMode="rotate" />
                            </ArgumentAxis>
                            <ValueAxis />
                            <CommonSeriesSettings argumentField="period" type="bar" />
                            <Series valueField="openedCount" name="Opened" color="#0078D4" />
                            <Series valueField="closedCount" name="Closed" color="#107C10" />
                            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
                            <Tooltip enabled={true} />
                        </Chart>
                    ) : (
                        <EmptyChart message="No weekly data available" />
                    )}
                </ChartCard>

                {/* Issues by Category */}
                <ChartCard icon="fa-light fa-chart-pie" title="Issues by Category">
                    {categoryData.length > 0 ? (
                        <PieChart
                            dataSource={categoryData}
                            height={220}
                            palette={['#0078D4', '#D13438', '#107C10', '#CA5010', '#C8C6C4']}
                        >
                            <PieSeries argumentField="categoryName" valueField="totalCount">
                                <PieLabel visible={true} position="columns">
                                    <Connector visible={true} width={0.5} />
                                </PieLabel>
                            </PieSeries>
                            <PieLegend verticalAlignment="bottom" horizontalAlignment="center" />
                            <PieTooltip
                                enabled={true}
                                customizeTooltip={(arg) => ({
                                    text: `${arg.argumentText}: ${arg.value} (${arg.percentText})`,
                                })}
                            />
                        </PieChart>
                    ) : (
                        <EmptyChart message="No category data available" />
                    )}
                </ChartCard>

                {/* Top Vehicles */}
                <ChartCard icon="fa-light fa-truck" title="Top Vehicles by Issues">
                    {vehicleData.length > 0 ? (
                        <Chart dataSource={vehicleData} height={220} rotated={true}>
                            <ArgumentAxis>
                                <Label />
                            </ArgumentAxis>
                            <ValueAxis />
                            <CommonSeriesSettings argumentField="vehicleName" type="bar" />
                            <Series valueField="totalCount" name="Issues" color="#5C2D91" />
                            <Tooltip enabled={true} />
                        </Chart>
                    ) : (
                        <EmptyChart message="No vehicle data available" />
                    )}
                </ChartCard>

                {/* Top Sites */}
                <ChartCard icon="fa-light fa-building" title="Top Sites by Issues">
                    {siteData.length > 0 ? (
                        <Chart dataSource={siteData} height={220} rotated={true}>
                            <ArgumentAxis>
                                <Label />
                            </ArgumentAxis>
                            <ValueAxis />
                            <CommonSeriesSettings argumentField="siteName" type="bar" />
                            <Series valueField="totalCount" name="Issues" color="#FFB900" />
                            <Tooltip enabled={true} />
                        </Chart>
                    ) : (
                        <EmptyChart message="No site data available" />
                    )}
                </ChartCard>
            </div>
        </>
    );
};

export default DashboardCharts;
