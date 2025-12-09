import React, { useMemo } from 'react';
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
    Title,
    Subtitle
} from 'devextreme-react/chart';
import PieChart, {
    Series as PieSeries,
    Label as PieLabel,
    Connector,
    Legend as PieLegend,
    Export as PieExport,
    Tooltip as PieTooltip
} from 'devextreme-react/pie-chart';
import LoadIndicator from 'devextreme-react/load-indicator';

const ConsumptionCharts = ({ summaryData, loading, groupBy }) => {
    // Prepare data for vehicle model chart
    const modelChartData = useMemo(() => {
        if (!summaryData || !summaryData.modelSummaries) return [];
        return summaryData.modelSummaries
            .slice(0, 10) // Top 10 models
            .map(model => ({
                model: model.vehicleModel || 'Unknown',
                manufacturer: model.manufacturer || 'Unknown',
                type: model.vehicleType || 'Unknown',
                fuelConsumed: model.totalFuelConsumed,
                avgConsumption: model.averageConsumption,
                vehicleCount: model.vehicleCount,
                label: `${model.manufacturer} ${model.vehicleModel}`
            }));
    }, [summaryData]);

    // Prepare data for trend chart
    const trendChartData = useMemo(() => {
        if (!summaryData || !summaryData.trendData) return [];
        return summaryData.trendData.map(trend => ({
            date: new Date(trend.date),
            dateLabel: formatTrendDate(trend.date, groupBy),
            fuelConsumed: trend.totalFuelConsumed,
            avgConsumption: trend.averageConsumption,
            vehicleCount: trend.vehicleCount,
            refillCount: trend.refillCount
        }));
    }, [summaryData, groupBy]);

    // Prepare data for site pie chart
    const sitePieData = useMemo(() => {
        if (!summaryData || !summaryData.siteSummaries) return [];
        return summaryData.siteSummaries.map(site => ({
            site: site.siteName,
            fuelConsumed: site.totalFuelConsumed,
            percentage: 0 // Will be calculated by chart
        }));
    }, [summaryData]);

    // Prepare data for vehicle type distribution
    const vehicleTypeData = useMemo(() => {
        if (!summaryData || !summaryData.modelSummaries) return [];

        // Group by vehicle type
        const typeGroups = {};
        summaryData.modelSummaries.forEach(model => {
            const type = model.vehicleType || 'Unknown';
            if (!typeGroups[type]) {
                typeGroups[type] = { type, fuelConsumed: 0, vehicleCount: 0 };
            }
            typeGroups[type].fuelConsumed += model.totalFuelConsumed;
            typeGroups[type].vehicleCount += model.vehicleCount;
        });

        return Object.values(typeGroups);
    }, [summaryData]);

    // Format trend date based on groupBy
    function formatTrendDate(dateStr, groupBy) {
        const date = new Date(dateStr);
        switch (groupBy) {
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

    // Custom tooltip for bar chart
    const customizeBarTooltip = (info) => {
        return {
            text: `${info.argumentText}\nFuel: ${info.valueText} L\nVehicles: ${info.point.data.vehicleCount}`
        };
    };

    // Custom tooltip for trend chart
    const customizeTrendTooltip = (info) => {
        return {
            text: `${info.argumentText}\nFuel: ${Number(info.value).toLocaleString()} L\nVehicles: ${info.point.data.vehicleCount}\nRefills: ${info.point.data.refillCount}`
        };
    };

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
            {/* Top Row - Consumption by Vehicle Model & Site Distribution */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
                {/* Consumption by Vehicle Model */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-truck"></i>
                        Consumption by Vehicle Model
                    </div>
                    {modelChartData.length > 0 ? (
                        <Chart
                            dataSource={modelChartData}
                            rotated={true}
                            height={400}
                        >
                            <CommonSeriesSettings
                                argumentField="label"
                                type="bar"
                                hoverMode="allArgumentPoints"
                                selectionMode="allArgumentPoints"
                            >
                                <Label visible={true} position="outside" format="#,##0" />
                            </CommonSeriesSettings>

                            <Series
                                valueField="fuelConsumed"
                                name="Fuel Consumed (L)"
                                color="#8b5cf6"
                            />

                            <ArgumentAxis>
                                <Label wordWrap="none" overlappingBehavior="stagger" />
                            </ArgumentAxis>

                            <ValueAxis>
                                <Label format="#,##0" />
                            </ValueAxis>

                            <Tooltip enabled={true} customizeTooltip={customizeBarTooltip} />
                            <Legend visible={false} />
                            <Export enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-text-center tw-py-8 tw-text-gray-400">
                            No model data available
                        </div>
                    )}
                </div>

                {/* Site Distribution Pie Chart */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-chart-pie"></i>
                        Fuel Distribution by Site
                    </div>
                    {sitePieData.length > 0 ? (
                        <PieChart
                            dataSource={sitePieData}
                            palette="Violet"
                            height={400}
                        >
                            <PieSeries
                                argumentField="site"
                                valueField="fuelConsumed"
                            >
                                <PieLabel
                                    visible={true}
                                    format="#,##0 L"
                                    customizeText={(info) => `${info.argumentText}`}
                                >
                                    <Connector visible={true} width={1} />
                                </PieLabel>
                            </PieSeries>

                            <PieLegend
                                visible={true}
                                horizontalAlignment="right"
                                verticalAlignment="top"
                                itemTextPosition="right"
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

            {/* Trend Chart - Full Width */}
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
                        >
                            <Label visible={false} />
                        </Series>

                        <Series
                            valueField="refillCount"
                            name="Refill Count"
                            color="#10b981"
                            axis="refillAxis"
                        >
                            <Label visible={false} />
                        </Series>

                        <ArgumentAxis>
                            <Label overlappingBehavior="rotate" rotationAngle={-45} />
                        </ArgumentAxis>

                        <ValueAxis name="fuelAxis" position="left">
                            <Label format="#,##0" />
                            <Title text="Fuel (L)" />
                        </ValueAxis>

                        <ValueAxis name="refillAxis" position="right">
                            <Label format="#,##0" />
                            <Title text="Refills" />
                        </ValueAxis>

                        <Tooltip enabled={true} customizeTooltip={customizeTrendTooltip} />

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

            {/* Bottom Row - Vehicle Type Distribution */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
                {/* Vehicle Type Distribution */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-layer-group"></i>
                        Consumption by Vehicle Type
                    </div>
                    {vehicleTypeData.length > 0 ? (
                        <Chart
                            dataSource={vehicleTypeData}
                            height={300}
                        >
                            <CommonSeriesSettings
                                argumentField="type"
                                type="bar"
                            >
                                <Label visible={true} position="outside" format="#,##0" />
                            </CommonSeriesSettings>

                            <Series
                                valueField="fuelConsumed"
                                name="Fuel Consumed (L)"
                                color="#f59e0b"
                            />

                            <ArgumentAxis>
                                <Label wordWrap="none" />
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
                            No vehicle type data available
                        </div>
                    )}
                </div>

                {/* Average Consumption by Vehicle Type */}
                <div className="consumption-chart-container">
                    <div className="chart-title">
                        <i className="fa-light fa-gauge-high"></i>
                        Average Consumption by Model
                    </div>
                    {modelChartData.length > 0 ? (
                        <Chart
                            dataSource={modelChartData.slice(0, 8)}
                            height={300}
                        >
                            <CommonSeriesSettings
                                argumentField="label"
                                type="bar"
                            >
                                <Label visible={true} position="outside" format="#0.0" />
                            </CommonSeriesSettings>

                            <Series
                                valueField="avgConsumption"
                                name="Avg Consumption"
                                color="#10b981"
                            />

                            <ArgumentAxis>
                                <Label wordWrap="none" overlappingBehavior="rotate" rotationAngle={-30} />
                            </ArgumentAxis>

                            <ValueAxis>
                                <Label format="#0.0" />
                            </ValueAxis>

                            <Tooltip enabled={true} />
                            <Legend visible={false} />
                            <Export enabled={true} />
                        </Chart>
                    ) : (
                        <div className="tw-text-center tw-py-8 tw-text-gray-400">
                            No consumption data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default ConsumptionCharts;
