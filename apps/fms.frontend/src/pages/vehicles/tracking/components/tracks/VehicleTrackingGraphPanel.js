/**
 * File: VehicleTrackingGraphPanel.js
 * Purpose: Dock panel that displays a line chart of track point variables over time.
 *          User can toggle which variables (speed, fuel, heading, altitude, etc.) appear on the graph.
 * Dependencies: React, DevExtreme Chart
 * Last Modified: 2026-03-21
 *
 * Key Components:
 * - VehicleTrackingGraphPanel: Interactive chart with variable toggle buttons
 */
import React, { useCallback, useMemo, useRef, useState } from 'react';
import {
    Chart,
    ArgumentAxis,
    CommonSeriesSettings,
    Legend,
    Series,
    Tooltip,
    ValueAxis,
    ZoomAndPan,
    ScrollBar,
} from 'devextreme-react/chart';
import './VehicleTrackingGraphPanel.scss';

const VARIABLE_DEFS = [
    { field: 'speed', label: 'Speed (km/h)', color: '#0078d4', defaultVisible: true },
    { field: 'fuelLevel', label: 'Fuel Level', color: '#107c10', defaultVisible: true },
    { field: 'ignition', label: 'Ignition (On/Off)', color: '#d13438', defaultVisible: false, type: 'stepline' },
    { field: 'heading', label: 'Heading (°)', color: '#ca5010', defaultVisible: false },
    { field: 'altitude', label: 'Altitude', color: '#8764b8', defaultVisible: false },
    { field: 'odometer', label: 'Odometer', color: '#498205', defaultVisible: false },
    { field: 'distanceFromPreviousKm', label: 'Δ Distance (km)', color: '#c239b3', defaultVisible: false },
    { field: 'satelliteCount', label: 'Satellites', color: '#6b6b6b', defaultVisible: false },
];

const VehicleTrackingGraphPanel = ({ trackPoints = [], vehicleLabel, onPointClick, isLoading = false }) => {
    const [visibleVariables, setVisibleVariables] = useState(() => {
        const initial = {};
        VARIABLE_DEFS.forEach((v) => { initial[v.field] = v.defaultVisible; });
        return initial;
    });

    const chartRef = useRef(null);

    const toggleVariable = useCallback((field) => {
        setVisibleVariables((prev) => ({ ...prev, [field]: !prev[field] }));
    }, []);

    const resetZoom = useCallback(() => {
        const chart = chartRef.current?.instance;
        if (chart) chart.resetVisualRange();
    }, []);

    const handlePointClick = useCallback((e) => {
        const pointData = e.target?.data;
        if (pointData?.latitude && pointData?.longitude && onPointClick) {
            onPointClick(pointData.latitude, pointData.longitude);
        }
    }, [onPointClick]);

    const chartData = useMemo(() => {
        if (!trackPoints?.length) return [];
        return trackPoints.map((p) => ({
            _seriesVehicleKey: String(p.vehicleId ?? 'default'),
            vehicleId: p.vehicleId ?? null,
            vehicleLabel: p.vehicleLabel || vehicleLabel || `Vehicle #${p.vehicleId ?? ''}`.trim(),
            vehicleColor: p.vehicleColor ?? null,
            timestamp: new Date(p.timestamp),
            latitude: p.latitude,
            longitude: p.longitude,
            speed: p.speed ?? null,
            fuelLevel: p.fuelLevel ?? null,
            ignition: p.ignitionStatus != null ? (p.ignitionStatus ? 1 : 0) : null,
            heading: p.heading ?? null,
            altitude: p.altitude ?? null,
            odometer: p.odometer ?? null,
            distanceFromPreviousKm: p.distanceFromPreviousKm ?? null,
            satelliteCount: p.satelliteCount ?? null,
        }));
    }, [trackPoints, vehicleLabel]);

    const activeVariables = useMemo(
        () => VARIABLE_DEFS.filter((v) => visibleVariables[v.field]),
        [visibleVariables],
    );

    const vehiclesInChart = useMemo(() => {
        const seenVehicles = new Map();

        chartData.forEach((point) => {
            if (!seenVehicles.has(point._seriesVehicleKey)) {
                seenVehicles.set(point._seriesVehicleKey, {
                    vehicleKey: point._seriesVehicleKey,
                    vehicleLabel: point.vehicleLabel || `Vehicle ${point._seriesVehicleKey}`,
                    vehicleColor: point.vehicleColor,
                    points: [],
                });
            }

            seenVehicles.get(point._seriesVehicleKey).points.push(point);
        });

        return Array.from(seenVehicles.values());
    }, [chartData]);

    const chartSeries = useMemo(() => vehiclesInChart.flatMap((vehicle, vehicleIndex) =>
        activeVariables.map((variable, variableIndex) => {
            const hasValue = vehicle.points.some((point) => point[variable.field] != null);
            if (!hasValue) {
                return null;
            }

            return {
                key: `${vehicle.vehicleKey}:${variable.field}`,
                dataSource: vehicle.points,
                valueField: variable.field,
                name: vehiclesInChart.length > 1 ? `${vehicle.vehicleLabel} · ${variable.label}` : variable.label,
                color: vehiclesInChart.length > 1 && vehicle.vehicleColor ? vehicle.vehicleColor : variable.color,
                type: variable.type || undefined,
                axis: variable.field,
                dashStyle: vehiclesInChart.length > 1 && vehicleIndex % 2 === 1 ? 'dash' : 'solid',
                width: vehiclesInChart.length > 1 ? Math.max(1, 3 - (variableIndex % 2)) : 2,
            };
        }).filter(Boolean),
    ), [activeVariables, vehiclesInChart]);

    if (isLoading && !trackPoints?.length) {
        return (
            <div className="vt-graph-panel tw-flex tw-h-full tw-items-center tw-justify-center">
                <div className="tw-text-center tw-px-6">
                    <i className="fa-light fa-loader tw-mb-3 tw-text-3xl tw-text-[#9aa09d]" />
                    <div className="tw-text-[14px] tw-font-semibold tw-text-[#111813]">Loading Track Points</div>
                    <div className="tw-mt-1 tw-text-[12px] tw-text-[#5a6360]">
                        Detailed points are loading for the selected track days
                    </div>
                </div>
            </div>
        );
    }

    if (!trackPoints?.length) {
        return (
            <div className="vt-graph-panel tw-flex tw-h-full tw-items-center tw-justify-center">
                <div className="tw-text-center tw-px-6">
                    <i className="fa-light fa-chart-line tw-mb-3 tw-text-3xl tw-text-[#9aa09d]" />
                    <div className="tw-text-[14px] tw-font-semibold tw-text-[#111813]">No Track Data</div>
                    <div className="tw-mt-1 tw-text-[12px] tw-text-[#5a6360]">
                        Select track days and load track points to view the graph
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vt-graph-panel tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-white">
            {/* Variable toggles */}
            <div className="vt-graph-panel__toolbar tw-flex tw-flex-wrap tw-items-center tw-gap-1 tw-border-b tw-border-[#edebe9] tw-px-3 tw-py-2">
                <span className="tw-text-[11px] tw-font-semibold tw-text-[#605e5c] tw-mr-1">Variables:</span>
                {VARIABLE_DEFS.map((v) => (
                    <button
                        key={v.field}
                        type="button"
                        className={`vt-graph-panel__var-btn ${visibleVariables[v.field] ? 'vt-graph-panel__var-btn--active' : ''}`}
                        style={visibleVariables[v.field] ? { borderColor: v.color, color: v.color } : undefined}
                        onClick={() => toggleVariable(v.field)}
                    >
                        <span
                            className="vt-graph-panel__var-dot"
                            style={{ backgroundColor: visibleVariables[v.field] ? v.color : '#c8c6c4' }}
                        />
                        {v.label}
                    </button>
                ))}

                <button
                    type="button"
                    className="vt-graph-panel__var-btn"
                    onClick={resetZoom}
                    title="Reset zoom"
                >
                    <i className="fa-light fa-magnifying-glass-minus tw-mr-1" />
                    Reset Zoom
                </button>
                {vehicleLabel && (
                    <span className="tw-ml-auto tw-text-[11px] tw-text-[#605e5c]">{vehicleLabel}</span>
                )}
            </div>

            {/* Chart */}
            <div className="tw-flex-1 tw-min-h-0 tw-p-2">
                <Chart
                    ref={chartRef}
                    height="100%"
                    onPointClick={handlePointClick}
                >
                    <ArgumentAxis
                        argumentType="datetime"
                        valueMarginsEnabled={true}
                        label={{
                            customizeText: ({ value }) => {
                                if (!value) return '';
                                const d = value instanceof Date ? value : new Date(value);
                                return d.toLocaleString([], { timeZone: 'Africa/Nairobi', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
                            }
                        }}
                    />
                    <CommonSeriesSettings
                        type="line"
                        argumentField="timestamp"
                        point={{ size: 3, visible: chartData.length < 500 }}
                    />
                    {chartSeries.map((series) => (
                        <Series
                            key={series.key}
                            dataSource={series.dataSource}
                            valueField={series.valueField}
                            name={series.name}
                            color={series.color}
                            type={series.type}
                            axis={series.axis}
                            dashStyle={series.dashStyle}
                            width={series.width}
                        />
                    ))}
                    {activeVariables.map((variable) => (
                        <ValueAxis key={variable.field} name={variable.field} title="" position="left" />
                    ))}
                    <Legend
                        verticalAlignment="bottom"
                        horizontalAlignment="center"
                        itemTextPosition="right"
                        font={{ size: 11 }}
                    />
                    <Tooltip
                        enabled={true}
                        shared={true}
                        customizeTooltip={(arg) => {
                            const lines = [];
                            if (arg.argument) {
                                const d = arg.argument instanceof Date ? arg.argument : new Date(arg.argument);
                                lines.push(d.toLocaleString([], { timeZone: 'Africa/Nairobi', year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit' }));
                            }
                            if (arg.points) {
                                arg.points.forEach((p) => {
                                    if (p.seriesName === 'Ignition (On/Off)') {
                                        lines.push(`${p.seriesName}: ${p.value === 1 ? 'On' : 'Off'}`);
                                    } else {
                                        lines.push(`${p.seriesName}: ${p.value != null ? p.value.toFixed(2) : '\u2014'}`);
                                    }
                                });
                            } else if (arg.seriesName != null) {
                                if (arg.seriesName === 'Ignition (On/Off)') {
                                    lines.push(`${arg.seriesName}: ${arg.value === 1 ? 'On' : 'Off'}`);
                                } else {
                                    lines.push(`${arg.seriesName}: ${arg.value != null ? arg.value.toFixed(2) : '\u2014'}`);
                                }
                            }
                            return { text: lines.join('\n') };
                        }}
                    />
                    <ZoomAndPan argumentAxis="both" dragToZoom={true} allowMouseWheel={true} />
                    <ScrollBar visible={true} />
                </Chart>
            </div>
        </div>
    );
};

export default VehicleTrackingGraphPanel;
