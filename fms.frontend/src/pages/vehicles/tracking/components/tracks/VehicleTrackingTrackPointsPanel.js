/**
 * File: VehicleTrackingTrackPointsPanel.js
 * Purpose: Dock panel that displays individual GPS track points for selected track rows across checked vehicles.
 *          Reuses track history already loaded by the tracks panel to avoid duplicate GPS provider requests.
 * Dependencies: React, DevExtreme DataGrid
 * Last Modified: 2026-03-23
 *
 * Key Components:
 * - VehicleTrackingTrackPointsPanel: Track point data grid with configurable columns
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataGrid, {
    Column,
    ColumnChooser,
    Paging,
    Scrolling,
    Sorting,
    Summary,
    TotalItem,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { DropDownButton } from 'devextreme-react/drop-down-button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import vehicleGPSTrackingService from '../../../../../services/vehicleGPSTrackingService';
import { getVehicleTrackColor } from './vehicleTrackingTrackColors';
import './VehicleTrackingTrackPointsPanel.scss';

const EAT_TIMEZONE = 'Africa/Nairobi';

const formatDateTime = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', timeZone: EAT_TIMEZONE });
};

const formatTime = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: EAT_TIMEZONE });
};

const renderVehicleCell = ({ data }) => (
    <div className="tw-flex tw-items-center tw-gap-2">
        <span
            className="tw-inline-block tw-h-2.5 tw-w-2.5 tw-rounded-full"
            style={{ backgroundColor: data.vehicleColor }}
        />
        <span>{data.vehicleLabel}</span>
    </div>
);

const VehicleTrackingTrackPointsPanel = ({
    trackedVehicles = [],
    selectedTrackDays,
    prefetchedTrackPoints = [],
    onTrackPointsLoaded,
    onTrackPointLoadingChange,
    onDrawGraph,
    drawOptions,
    onDraw,
    onDrawOptionsChange,
    drawingStats,
    onOpenDrawingPlayground,
    onRefreshTrackData,
}) => {
    const gridRef = useRef(null);
    const [loadedTrackPoints, setLoadedTrackPoints] = useState([]);
    const [loading, setLoading] = useState(false);

    const trackedVehicleMap = useMemo(
        () => new Map(trackedVehicles.map((vehicle) => [String(vehicle.id), vehicle])),
        [trackedVehicles],
    );

    const shouldFetchOnDemand = selectedTrackDays?.length > 0 && prefetchedTrackPoints.length === 0;

    useEffect(() => {
        let isActive = true;

        const loadTrackPoints = async () => {
            if (!shouldFetchOnDemand) {
                setLoadedTrackPoints([]);
                onTrackPointLoadingChange?.(false);
                return;
            }

            setLoading(true);
            onTrackPointLoadingChange?.(true);
            try {
                const responses = await Promise.all(selectedTrackDays.map(async (day) => {
                    const from = day.startTime || `${day.date}T00:00:00`;
                    const to = day.stopTime || `${day.date}T23:59:59`;
                    const result = await vehicleGPSTrackingService.getTrackPoints(day.vehicleId, from, to);
                    const points = result?.isSuccess || result?.success ? result.data || [] : [];

                    return points.map((point, index) => ({
                        _id: `${day.vehicleId}:${day.date}:${index}:${point.timestamp}`,
                        ...point,
                        vehicleId: day.vehicleId,
                    }));
                }));

                if (isActive) {
                    setLoadedTrackPoints(responses.flat());
                }
            } catch {
                if (isActive) {
                    setLoadedTrackPoints([]);
                }
            } finally {
                if (isActive) {
                    setLoading(false);
                    onTrackPointLoadingChange?.(false);
                }
            }
        };

        loadTrackPoints();

        return () => {
            isActive = false;
        };
    }, [onTrackPointLoadingChange, prefetchedTrackPoints.length, selectedTrackDays, shouldFetchOnDemand]);

    const rawTrackPoints = prefetchedTrackPoints.length > 0 ? prefetchedTrackPoints : loadedTrackPoints;

    const trackPoints = useMemo(() => rawTrackPoints
        .map((point, index) => {
            const vehicleId = point?.vehicleId == null ? null : Number(point.vehicleId);
            const vehicle = vehicleId == null ? null : trackedVehicleMap.get(String(vehicleId));

            return {
                _id: point._id || `${vehicleId}:${index}:${point.timestamp}`,
                ...point,
                vehicleId,
                vehicleLabel: point.vehicleLabel || vehicle?.trackingCode || `Vehicle #${vehicleId}`,
                vehicleColor: point.vehicleColor || getVehicleTrackColor(vehicleId),
            };
        })
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp)), [rawTrackPoints, trackedVehicleMap]);

    const filteredPoints = useMemo(() => {
        if (!selectedTrackDays?.length) return trackPoints;

        const selectedDateSet = new Set(selectedTrackDays.map((day) => `${day.vehicleId}:${day.date}`));
        return trackPoints.filter((p) => {
            const dayKey = `${p.vehicleId}:${new Date(p.timestamp).toISOString().slice(0, 10)}`;
            return selectedDateSet.has(dayKey);
        });
    }, [selectedTrackDays, trackPoints]);

    useEffect(() => {
        onTrackPointsLoaded?.(filteredPoints);
    }, [filteredPoints, onTrackPointsLoaded]);

    const handleContextMenuPreparing = useCallback((e) => {
        if (e.target === 'header') {
            e.items = e.items || [];
            e.items.push({
                text: 'Choose Columns',
                icon: 'columnchooser',
                onItemClick: () => gridRef.current?.instance?.showColumnChooser?.(),
            });
        }
    }, []);

    const handleDrawGraph = useCallback(() => {
        onDrawGraph?.();
    }, [onDrawGraph]);

    const handleRefreshClick = useCallback(() => {
        onRefreshTrackData?.();
    }, [onRefreshTrackData]);

    const drawMenuItems = useMemo(() => [
        { id: 'showPolyline', text: 'Show Polyline', icon: 'fa-light fa-route', checked: drawOptions?.showPolyline ?? true },
        { id: 'showPoints', text: 'Show Sampled Points', icon: 'fa-light fa-location-arrow', checked: drawOptions?.showPoints ?? false },
        { id: 'showFatPoints', text: 'Show Fat Points (≥2 min)', icon: 'fa-light fa-circle-exclamation', checked: drawOptions?.showFatPoints ?? false },
        { id: 'zoomToFit', text: 'Zoom to Fit', icon: 'fa-light fa-expand', checked: drawOptions?.zoomToFit ?? true },
    ], [drawOptions]);

    const handleDrawOptionClick = useCallback((e) => {
        const key = e.itemData?.id;
        if (!key || !onDrawOptionsChange) return;
        onDrawOptionsChange((prev) => ({ ...prev, [key]: !prev[key] }));
    }, [onDrawOptionsChange]);

    const handleDrawClick = useCallback(() => {
        onDraw?.();
    }, [onDraw]);

    const renderDrawMenuItem = useCallback((item) => (
        <div className="tw-flex tw-items-center tw-gap-2 tw-text-[12px] tw-px-1">
            <i className={item.checked ? 'fa-light fa-square-check tw-text-[#0078d4]' : 'fa-light fa-square tw-text-[#a19f9d]'} />
            <i className={`${item.icon} tw-w-4 tw-text-center`} />
            <span>{item.text}</span>
        </div>
    ), []);

    if (!trackedVehicles.length) {
        return (
            <div className="vt-trackpoints-panel tw-flex tw-h-full tw-items-center tw-justify-center">
                <div className="tw-text-center tw-px-6">
                    <i className="fa-light fa-location-dot tw-mb-3 tw-text-3xl tw-text-[#9aa09d]" />
                    <div className="tw-text-[14px] tw-font-semibold tw-text-[#111813]">No Tracked Vehicles</div>
                    <div className="tw-mt-1 tw-text-[12px] tw-text-[#5a6360]">Check one or more vehicles in the Track column to load points</div>
                </div>
            </div>
        );
    }

    if (!selectedTrackDays?.length) {
        return (
            <div className="vt-trackpoints-panel tw-flex tw-h-full tw-items-center tw-justify-center">
                <div className="tw-text-center tw-px-6">
                    <i className="fa-light fa-check-square tw-mb-3 tw-text-3xl tw-text-[#9aa09d]" />
                    <div className="tw-text-[14px] tw-font-semibold tw-text-[#111813]">No Track Days Selected</div>
                    <div className="tw-mt-1 tw-text-[12px] tw-text-[#5a6360]">
                        Select one or more days from the Tracks panel to load track points
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="vt-trackpoints-panel tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-white">
            <div className="vt-trackpoints-panel__header tw-flex tw-items-center tw-gap-2 tw-border-b tw-border-[#edebe9] tw-px-3 tw-py-2">
                <div className="vt-trackpoints-panel__summary tw-flex tw-items-center tw-gap-2 tw-text-[11px] tw-text-[#605e5c]">
                    <span>
                        {drawingStats?.sampledPointCount ?? filteredPoints.length} of {drawingStats?.sourcePointCount ?? filteredPoints.length} points drawn
                    </span>
                    <span className="tw-hidden md:tw-inline">•</span>
                    <span className="tw-hidden md:tw-inline">{drawingStats?.pointMinGapSeconds ?? 60}s or {drawingStats?.pointMinDistanceMeters ?? 200}m</span>
                </div>
                <div className="tw-ml-auto tw-flex tw-items-center tw-gap-1">
                    <Button
                        text="Draw"
                        icon="fa-light fa-pen-line"
                        stylingMode="outlined"
                        height={26}
                        onClick={handleDrawClick}
                        disabled={loading || filteredPoints.length === 0}
                    />
                    <DropDownButton
                        text=""
                        stylingMode="outlined"
                        height={26}
                        items={drawMenuItems}
                        onItemClick={handleDrawOptionClick}
                        itemRender={renderDrawMenuItem}
                        displayExpr="text"
                        keyExpr="id"
                        showArrowIcon={true}
                        width={32}
                        dropDownOptions={{ width: 220 }}
                    />
                    <Button
                        icon="fa-light fa-sliders"
                        stylingMode="outlined"
                        hint="Drawing playground"
                        height={26}
                        width={32}
                        onClick={onOpenDrawingPlayground}
                    />
                    <Button
                        text="Draw Graph"
                        icon="fa-light fa-chart-line"
                        stylingMode="outlined"
                        hint="Plot data in Graph panel"
                        height={26}
                        onClick={handleDrawGraph}
                        disabled={loading || filteredPoints.length === 0}
                    />
                    <Button
                        icon="fa-light fa-arrows-rotate"
                        stylingMode="text"
                        hint="Refresh"
                        height={26}
                        onClick={handleRefreshClick}
                    />
                </div>
            </div>

            {/* Track points grid */}
            <div className="tw-flex-1 tw-min-h-0 tw-relative">
                {loading && (
                    <div className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-white/70">
                        <LoadIndicator height={40} width={40} />
                    </div>
                )}
                <DataGrid
                    ref={gridRef}
                    dataSource={filteredPoints}
                    keyExpr="_id"
                    height="100%"
                    showBorders={false}
                    showColumnLines={true}
                    showRowLines={true}
                    hoverStateEnabled={true}
                    rowAlternationEnabled={false}
                    allowColumnReordering={true}
                    allowColumnResizing={true}
                    columnAutoWidth={true}
                    columnResizingMode="widget"
                    noDataText="No track point data"
                    onContextMenuPreparing={handleContextMenuPreparing}
                >
                    <Sorting mode="multiple" />
                    <ColumnChooser enabled={true} mode="select" height={420} />
                    <Scrolling mode="virtual" rowRenderingMode="virtual" showScrollbar="always" />
                    <Paging enabled={false} />

                    {/* Default visible columns */}
                    <Column
                        dataField="vehicleLabel"
                        caption="Vehicle"
                        minWidth={150}
                        cellRender={renderVehicleCell}
                    />
                    <Column
                        dataField="timestamp"
                        caption="Date"
                        dataType="string"
                        minWidth={100}
                        customizeText={({ value }) => formatDateTime(value)}
                        sortOrder="asc"
                    />
                    <Column
                        dataField="timestamp"
                        name="time"
                        caption="Time"
                        dataType="string"
                        minWidth={90}
                        customizeText={({ value }) => formatTime(value)}
                    />
                    <Column
                        dataField="speed"
                        caption="Speed (km/h)"
                        dataType="number"
                        minWidth={100}
                        alignment="right"
                        format="#,##0.00"
                    />
                    <Column
                        dataField="ignitionStatus"
                        caption="Ignition"
                        dataType="string"
                        minWidth={80}
                        calculateCellValue={(rowData) => rowData.ignitionStatus == null ? '—' : rowData.ignitionStatus ? 'ON' : 'OFF'}
                    />
                    <Column
                        dataField="fuelLevel"
                        caption="Fuel"
                        dataType="number"
                        minWidth={80}
                        alignment="right"
                        format="#,##0.00"
                    />

                    {/* Hidden by default — available through column chooser */}
                    <Column dataField="latitude" caption="Latitude" dataType="number" minWidth={100} visible={false} format="#0.######" />
                    <Column dataField="longitude" caption="Longitude" dataType="number" minWidth={100} visible={false} format="#0.######" />
                    <Column dataField="altitude" caption="Altitude" dataType="number" minWidth={80} visible={false} format="#,##0.00" />
                    <Column dataField="heading" caption="Heading (°)" dataType="number" minWidth={90} visible={false} format="#,##0.00" />
                    <Column dataField="odometer" caption="Odometer (km)" dataType="number" minWidth={110} visible={false} format="#,##0.00" />
                    <Column dataField="satelliteCount" caption="Satellites" dataType="number" minWidth={80} visible={false} />
                    <Column dataField="distanceFromPreviousKm" caption="Δ Distance (km)" dataType="number" minWidth={110} visible={false} format="#,##0.00" />
                    <Column dataField="timeDeltaSeconds" caption="Δ Time (s)" dataType="number" minWidth={90} visible={false} />
                    <Column dataField="address" caption="Address" minWidth={200} visible={false} />
                    <Column dataField="containingSiteName" caption="Site" minWidth={120} visible={false} />

                    <Summary>
                        <TotalItem column="speed" summaryType="avg" displayFormat="Avg: {0}" valueFormat="#,##0.00" />
                    </Summary>
                </DataGrid>
            </div>
        </div>
    );
};

export default VehicleTrackingTrackPointsPanel;
