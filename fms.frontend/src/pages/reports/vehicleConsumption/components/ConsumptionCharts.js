import React, { useState, useMemo, useCallback } from 'react';
import {
    Chart,
    Series,
    CommonSeriesSettings,
    Legend,
    ArgumentAxis,
    ValueAxis,
    Tooltip,
    Label,
    Export,
    Title
} from 'devextreme-react/chart';
import PieChart, {
    Series as PieSeries,
    Label as PieLabel,
    Connector,
    Legend as PieLegend,
    Export as PieExport,
    Tooltip as PieTooltip
} from 'devextreme-react/pie-chart';
import SelectBox from 'devextreme-react/select-box';
import TagBox from 'devextreme-react/tag-box';
import LoadIndicator from 'devextreme-react/load-indicator';

// Metric options for comparison
const METRIC_OPTIONS = [
    { value: 'totalFuelConsumed', text: 'Fuel Consumed (L)', color: '#8b5cf6' },
    { value: 'totalDistance', text: 'Distance (km)', color: '#10b981' },
    { value: 'totalEngineHours', text: 'Engine Hours', color: '#f59e0b' },
    { value: 'averageConsumption', text: 'Avg Consumption', color: '#3b82f6' },
    { value: 'fuelEfficiency', text: 'Fuel Efficiency', color: '#ec4899' },
    { value: 'expectedAverage', text: 'Expected Average', color: '#6366f1' },
    { value: 'efficiencyVariance', text: 'Efficiency Variance', color: '#ef4444' },
    { value: 'refillCount', text: 'Refill Count', color: '#14b8a6' }
];

// Comparison dimension options
const COMPARE_BY_OPTIONS = [
    { value: 'type', text: 'By Vehicle Type' },
    { value: 'model', text: 'By Vehicle Model' },
    { value: 'vehicle', text: 'By Individual Vehicle' }
];

const ConsumptionCharts = ({ summaryData, loading, groupBy }) => {
    // State for chart controls
    const [selectedMetrics, setSelectedMetrics] = useState(['totalFuelConsumed', 'averageConsumption']);
    const [compareBy, setCompareBy] = useState('type');
    const [selectedVehicles, setSelectedVehicles] = useState([]);

    // Get available vehicles for selection
    const availableVehicles = useMemo(() => {
        if (!summaryData?.vehicleComparisons) return [];
        return summaryData.vehicleComparisons.map(v => ({
            id: v.vehicleId,
            name: `${v.hyoungNo} (${v.vehicleType})`
        }));
    }, [summaryData]);

    // Prepare comparison data based on selected dimension
    const comparisonData = useMemo(() => {
        if (!summaryData) return [];

        switch (compareBy) {
            case 'type':
                return (summaryData.typeSummaries || []).map(t => ({
                    label: t.vehicleType || 'Unknown',
                    ...t
                }));
            case 'model':
                return (summaryData.modelSummaries || []).slice(0, 15).map(m => ({
                    label: `${m.manufacturer} ${m.vehicleModel}`,
                    ...m
                }));
            case 'vehicle':
                const vehicles = summaryData.vehicleComparisons || [];
                if (selectedVehicles.length > 0) {
                    return vehicles
                        .filter(v => selectedVehicles.includes(v.vehicleId))
                        .map(v => ({
                            label: v.hyoungNo,
                            ...v
                        }));
                }
                return vehicles.slice(0, 10).map(v => ({
                    label: v.hyoungNo,
                    ...v
                }));
            default:
                return [];
        }
    }, [summaryData, compareBy, selectedVehicles]);

    // Prepare trend data
    const trendChartData = useMemo(() => {
        if (!summaryData?.trendData) return [];
        return summaryData.trendData.map(trend => ({
            date: new Date(trend.date),
            dateLabel: formatTrendDate(trend.date, groupBy),
            fuelConsumed: trend.totalFuelConsumed,
            avgConsumption: trend.averageConsumption,
            vehicleCount: trend.vehicleCount,
            refillCount: trend.refillCount
        }));
    }, [summaryData, groupBy]);

    // Prepare site distribution data
    const sitePieData = useMemo(() => {
        if (!summaryData?.siteSummaries) return [];
        return summaryData.siteSummaries.map(site => ({
            site: site.siteName,
            fuelConsumed: site.totalFuelConsumed
        }));
    }, [summaryData]);

    // Format trend date
    function formatTrendDate(dateStr, period) {
        const date = new Date(dateStr);
        switch (period) {
            case 'week':
                return `Week ${getWeekNumber(date)}`;
            case 'month':
                return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
            case 'quarter':
                const quarter = Math.ceil((date.getMonth() + 1) / 3);
                return `Q${quarter} ${date.getFullYear()}`;
            case 'year':
                return date.getFullYear().toString();
            default:
                return date.toLocaleDateString();
        }
    }

    function getWeekNumber(date) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        return Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    }

    // Get metric info
    const getMetricInfo = useCallback((metricValue) => {
        return METRIC_OPTIONS.find(m => m.value === metricValue) || { text: metricValue, color: '#8b5cf6' };
    }, []);

    // Custom tooltip for comparison chart
    const customizeComparisonTooltip = useCallback((info) => {
        const metricInfo = getMetricInfo(info.seriesName);
        return {
            text: `${info.argumentText}\n${metricInfo.text}: ${Number(info.value).toLocaleString(undefined, { maximumFractionDigits: 2 })}`
        };
    }, [getMetricInfo]);

    // Custom tooltip for pie chart
    const customizePieTooltip = (info) => {
        return {
            text: `${info.argumentText}: ${Number(info.valueText).toLocaleString()} L (${(info.percent * 100).toFixed(1)}%)`
        };
    };

    if (loading) {
        return (
            <div className="tw-flex tw-justify-center tw-items-center tw-py-16">
                <LoadIndicator width={48} height={48} />
            </div>
        );
    }

    if (!summaryData) {
        return (
            <div className="empty-state">
                <i className="fa-light fa-chart-bar"></i>
                <h3>No Data Available</h3>
                <p>Apply filters and search to view consumption charts</p>
            </div>
        );
    }

    return (
        <div className="consumption-charts tw-space-y-6">
            {/* Comparison Controls */}
            <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-border tw-border-gray-200">
                <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-4">
                    {/* Compare By Selector */}
                    <div className="tw-min-w-[180px]">
                        <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">Compare By</label>
                        <SelectBox
                            items={COMPARE_BY_OPTIONS}
                            displayExpr="text"
                            valueExpr="value"
                            value={compareBy}
                            onValueChanged={(e) => setCompareBy(e.value)}
                            stylingMode="outlined"
                            width="100%"
                        />
                    </div>

                    {/* Metrics Selector */}
                    <div className="tw-flex-1 tw-min-w-[300px]">
                        <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">Metrics to Compare</label>
                        <TagBox
                            items={METRIC_OPTIONS}
                            displayExpr="text"
                            valueExpr="value"
                            value={selectedMetrics}
                            onValueChanged={(e) => setSelectedMetrics(e.value)}
                            stylingMode="outlined"
                            showSelectionControls={true}
                            maxDisplayedTags={4}
                            placeholder="Select metrics..."
                        />
                    </div>

                    {/* Vehicle Selector (when comparing by vehicle) */}
                    {compareBy === 'vehicle' && (
                        <div className="tw-flex-1 tw-min-w-[300px]">
                            <label className="tw-block tw-text-xs tw-text-gray-500 tw-mb-1">Select Vehicles</label>
                            <TagBox
                                items={availableVehicles}
                                displayExpr="name"
                                valueExpr="id"
                                value={selectedVehicles}
                                onValueChanged={(e) => setSelectedVehicles(e.value)}
                                stylingMode="outlined"
                                showSelectionControls={true}
                                maxDisplayedTags={5}
                                placeholder="Select vehicles to compare..."
                                searchEnabled={true}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Main Comparison Chart */}
            <div className="consumption-chart-container">
                <div className="chart-title">
                    <i className="fa-light fa-chart-column"></i>
                    Multi-Metric Comparison {compareBy === 'type' ? 'by Vehicle Type' : compareBy === 'model' ? 'by Model' : 'by Vehicle'}
                </div>
                {comparisonData.length > 0 && selectedMetrics.length > 0 ? (
                    <Chart
                        dataSource={comparisonData}
                        rotated={comparisonData.length > 6}
                        height={Math.max(350, comparisonData.length * 40)}
                    >
                        <CommonSeriesSettings
                            argumentField="label"
                            type="bar"
                        />

                        {selectedMetrics.map((metric) => {
                            const metricInfo = getMetricInfo(metric);
                            return (
                                <Series
                                    key={metric}
                                    valueField={metric}
                                    name={metricInfo.text}
                                    color={metricInfo.color}
                                />
                            );
                        })}

                        <ArgumentAxis>
                            <Label wordWrap="none" overlappingBehavior="stagger" />
                        </ArgumentAxis>

                        <ValueAxis>
                            <Label format="#,##0.##" />
                        </ValueAxis>

                        <Tooltip enabled={true} customizeTooltip={customizeComparisonTooltip} />

                        <Legend
                            visible={true}
                            verticalAlignment="bottom"
                            horizontalAlignment="center"
                        />

                        <Export enabled={true} />
                    </Chart>
                ) : (
                    <div className="tw-text-center tw-py-8 tw-text-gray-400">
                        {selectedMetrics.length === 0 ? 'Select at least one metric to display' : 'No data available for comparison'}
                    </div>
                )}
            </div>

            {/* Two Column Layout */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
                {/* Fuel vs Expected Average Comparison */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-scale-balanced"></i>
                        Actual vs Expected Consumption
                    </div>
                    {comparisonData.filter(d => d.expectedAverage > 0).length > 0 ? (
                        <Chart
                            dataSource={comparisonData.filter(d => d.expectedAverage > 0).slice(0, 10)}
                            rotated={true}
                            height={350}
                        >
                            <CommonSeriesSettings
                                argumentField="label"
                                type="bar"
                            />

                            <Series
                                valueField="averageConsumption"
                                name="Actual"
                                color="#8b5cf6"
                            />

                            <Series
                                valueField="expectedAverage"
                                name="Expected"
                                color="#10b981"
                            />

                            <ArgumentAxis>
                                <Label wordWrap="none" />
                            </ArgumentAxis>

                            <ValueAxis>
                                <Label format="#0.0" />
                            </ValueAxis>

                            <Tooltip enabled={true} />

                            <Legend
                                visible={true}
                                verticalAlignment="bottom"
                                horizontalAlignment="center"
                            />

                            <Export enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-text-center tw-py-8 tw-text-gray-400">
                            No expected average data available
                        </div>
                    )}
                </div>

                {/* Site Distribution */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-chart-pie"></i>
                        Fuel Distribution by Site
                    </div>
                    {sitePieData.length > 0 ? (
                        <PieChart
                            dataSource={sitePieData}
                            palette="Violet"
                            height={350}
                        >
                            <PieSeries
                                argumentField="site"
                                valueField="fuelConsumed"
                            >
                                <PieLabel
                                    visible={true}
                                    customizeText={(info) => `${info.argumentText}`}
                                >
                                    <Connector visible={true} width={1} />
                                </PieLabel>
                            </PieSeries>

                            <PieLegend
                                visible={true}
                                horizontalAlignment="right"
                                verticalAlignment="top"
                            />

                            <PieTooltip enabled={true} customizeTooltip={customizePieTooltip} />
                            <PieExport enabled={true} />
                        </PieChart>
                    ) : (
                        <div className="tw-text-center tw-py-8 tw-text-gray-400">
                            No site data available
                        </div>
                    )}
                </div>
            </div>

            {/* Efficiency Variance Chart */}
            <div className="consumption-chart-container">
                <div className="chart-title">
                    <i className="fa-light fa-chart-mixed"></i>
                    Efficiency Variance (Actual - Expected)
                    <span className="tw-text-xs tw-text-gray-400 tw-ml-2">
                        Positive = underperforming | Negative = overperforming
                    </span>
                </div>
                {comparisonData.filter(d => d.efficiencyVariance !== 0).length > 0 ? (
                    <Chart
                        dataSource={comparisonData.filter(d => d.efficiencyVariance !== 0).slice(0, 15)}
                        height={300}
                    >
                        <CommonSeriesSettings
                            argumentField="label"
                            type="bar"
                        />

                        <Series
                            valueField="efficiencyVariance"
                            name="Variance"
                            color="#ef4444"
                        >
                            <Label
                                visible={true}
                                position="outside"
                                customizeText={(info) => {
                                    const val = info.value;
                                    return val > 0 ? `+${val.toFixed(2)}` : val.toFixed(2);
                                }}
                            />
                        </Series>

                        <ArgumentAxis>
                            <Label wordWrap="none" overlappingBehavior="rotate" rotationAngle={-30} />
                        </ArgumentAxis>

                        <ValueAxis>
                            <Label format="#0.00" />
                        </ValueAxis>

                        <Tooltip enabled={true} />
                        <Legend visible={false} />
                        <Export enabled={true} />
                    </Chart>
                ) : (
                    <div className="tw-text-center tw-py-8 tw-text-gray-400">
                        No efficiency variance data available
                    </div>
                )}
            </div>

            {/* Distance vs Engine Hours Comparison */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
                {/* Distance by Type/Model */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-road"></i>
                        Total Distance Comparison
                    </div>
                    {comparisonData.filter(d => d.totalDistance > 0).length > 0 ? (
                        <Chart
                            dataSource={comparisonData.filter(d => d.totalDistance > 0).slice(0, 10)}
                            height={300}
                        >
                            <CommonSeriesSettings
                                argumentField="label"
                                type="bar"
                            >
                                <Label visible={true} position="outside" format="#,##0" />
                            </CommonSeriesSettings>

                            <Series
                                valueField="totalDistance"
                                name="Distance (km)"
                                color="#10b981"
                            />

                            <ArgumentAxis>
                                <Label wordWrap="none" overlappingBehavior="rotate" rotationAngle={-30} />
                            </ArgumentAxis>

                            <ValueAxis>
                                <Label format="#,##0" />
                            </ValueAxis>

                            <Tooltip enabled={true} />
                            <Legend visible={false} />
                            <Export enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-text-center tw-py-8 tw-text-gray-400">
                            No distance data available
                        </div>
                    )}
                </div>

                {/* Engine Hours by Type/Model */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-clock"></i>
                        Total Engine Hours Comparison
                    </div>
                    {comparisonData.filter(d => d.totalEngineHours > 0).length > 0 ? (
                        <Chart
                            dataSource={comparisonData.filter(d => d.totalEngineHours > 0).slice(0, 10)}
                            height={300}
                        >
                            <CommonSeriesSettings
                                argumentField="label"
                                type="bar"
                            >
                                <Label visible={true} position="outside" format="#,##0.0" />
                            </CommonSeriesSettings>

                            <Series
                                valueField="totalEngineHours"
                                name="Engine Hours"
                                color="#f59e0b"
                            />

                            <ArgumentAxis>
                                <Label wordWrap="none" overlappingBehavior="rotate" rotationAngle={-30} />
                            </ArgumentAxis>

                            <ValueAxis>
                                <Label format="#,##0.0" />
                            </ValueAxis>

                            <Tooltip enabled={true} />
                            <Legend visible={false} />
                            <Export enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-text-center tw-py-8 tw-text-gray-400">
                            No engine hours data available
                        </div>
                    )}
                </div>
            </div>

            {/* Trend Chart */}
            <div className="consumption-chart-container">
                <div className="chart-title">
                    <i className="fa-light fa-chart-line"></i>
                    Consumption Trend ({groupBy.charAt(0).toUpperCase() + groupBy.slice(1)}ly)
                </div>
                {trendChartData.length > 0 ? (
                    <Chart
                        dataSource={trendChartData}
                        height={350}
                    >
                        <CommonSeriesSettings argumentField="dateLabel" type="spline" />

                        <Series
                            valueField="fuelConsumed"
                            name="Total Fuel (L)"
                            color="#8b5cf6"
                        />

                        <Series
                            valueField="avgConsumption"
                            name="Avg Consumption"
                            color="#10b981"
                            axis="avgAxis"
                        />

                        <ArgumentAxis>
                            <Label overlappingBehavior="rotate" rotationAngle={-45} />
                        </ArgumentAxis>

                        <ValueAxis name="fuelAxis" position="left">
                            <Label format="#,##0" />
                            <Title text="Fuel (L)" />
                        </ValueAxis>

                        <ValueAxis name="avgAxis" position="right">
                            <Label format="#0.0" />
                            <Title text="Avg Consumption" />
                        </ValueAxis>

                        <Tooltip enabled={true} />

                        <Legend
                            visible={true}
                            verticalAlignment="bottom"
                            horizontalAlignment="center"
                        />

                        <Export enabled={true} />
                    </Chart>
                ) : (
                    <div className="tw-text-center tw-py-8 tw-text-gray-400">
                        No trend data available
                    </div>
                )}
            </div>
        </div>
    );
};

export default ConsumptionCharts;
