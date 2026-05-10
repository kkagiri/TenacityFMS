/**
 * File: VehicleTrackingTracksPanel.js
 * Purpose: Dock panel that loads daily GPS tracks for all checked vehicles within a date range.
 *          Shows per-vehicle daily summaries with persistent multi-vehicle selection.
 * Dependencies: React, DevExtreme DataGrid, DateBox, vehicleGPSTrackingService
 * Last Modified: 2026-03-23
 *
 * Key Components:
 * - VehicleTrackingTracksPanel: Date range picker + daily track summary grid
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import DataGrid, {
    Column,
    ColumnChooser,
    Paging,
    Scrolling,
    Selection,
    Sorting,
    Summary,
    TotalItem,
} from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { DropDownButton } from 'devextreme-react/drop-down-button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import vehicleGPSTrackingService from '../../../../../services/vehicleGPSTrackingService';
import { getVehicleTrackColor } from './vehicleTrackingTrackColors';
import './VehicleTrackingTracksPanel.scss';

const DEFAULT_RANGE_DAYS = 7;

const getDefaultFrom = () => {
    const d = new Date();
    d.setDate(d.getDate() - DEFAULT_RANGE_DAYS);
    d.setHours(0, 0, 0, 0);
    return d;
};

const getDefaultTo = () => {
    const d = new Date();
    d.setHours(23, 59, 59, 999);
    return d;
};

/**
 * Build daily summary rows from the track history response.
 * Each row represents one day with start/stop time, km, and estimated fuel usage.
 */
/** Haversine distance between two lat/lng pairs in km */
const haversineKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const buildDailySummaries = (trackHistory, vehicle) => {
    if (trackHistory?.dailySummaries?.length) {
        return trackHistory.dailySummaries
            .map((summary) => ({
                id: `${vehicle.id}:${summary.date}`,
                vehicleId: vehicle.id,
                vehicleLabel: vehicle.trackingCode || `Vehicle #${vehicle.id}`,
                vehicleColor: getVehicleTrackColor(vehicle.id),
                date: summary.date,
                startTime: summary.startTime,
                stopTime: summary.stopTime,
                distanceKm: summary.distanceKm ?? 0,
                pointCount: summary.pointCount ?? 0,
                fuelUsed: vehicle.fuelEfficiency > 0 && summary.distanceKm != null
                    ? Math.round(summary.distanceKm / vehicle.fuelEfficiency)
                    : null,
            }))
            .sort((left, right) => left.date.localeCompare(right.date));
    }

    if (!trackHistory?.trackPoints?.length) return [];

    // Sort points chronologically
    const sorted = [...trackHistory.trackPoints].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp),
    );

    const dayMap = new Map();

    for (let i = 0; i < sorted.length; i++) {
        const point = sorted[i];
        const ts = new Date(point.timestamp);
        const dayKey = ts.toISOString().slice(0, 10);

        if (!dayMap.has(dayKey)) {
            dayMap.set(dayKey, {
                date: dayKey,
                startTime: ts,
                stopTime: ts,
                distanceKm: 0,
            });
        }

        const entry = dayMap.get(dayKey);
        if (ts < entry.startTime) entry.startTime = ts;
        if (ts > entry.stopTime) entry.stopTime = ts;

        // Use backend-computed distance if available, otherwise compute from coords
        let segmentKm = point.distanceFromPreviousKm ?? 0;
        if (segmentKm === 0 && i > 0) {
            const prev = sorted[i - 1];
            segmentKm = haversineKm(prev.latitude, prev.longitude, point.latitude, point.longitude);
        }
        entry.distanceKm += segmentKm;
    }

    const summaries = Array.from(dayMap.values())
        .sort((a, b) => a.date.localeCompare(b.date))
        .map((row) => ({
            id: `${vehicle.id}:${row.date}`,
            vehicleId: vehicle.id,
            vehicleLabel: vehicle.trackingCode || `Vehicle #${vehicle.id}`,
            vehicleColor: getVehicleTrackColor(vehicle.id),
            date: row.date,
            startTime: row.startTime.toISOString(),
            stopTime: row.stopTime.toISOString(),
            distanceKm: Math.round(row.distanceKm),
            fuelUsed: vehicle.fuelEfficiency > 0 ? Math.round(row.distanceKm / vehicle.fuelEfficiency) : null,
        }));

    return summaries;
};

const EAT_TIMEZONE = 'Africa/Nairobi';

const formatTime = (isoStr) => {
    if (!isoStr) return '—';
    const d = new Date(isoStr);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZone: EAT_TIMEZONE });
};

const formatDate = (dateStr) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric', timeZone: EAT_TIMEZONE });
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

const buildSelectedTrackPoints = (selectedRows, trackHistoryByVehicle) => {
    if (!selectedRows?.length) {
        return [];
    }

    const selectedDateKeys = new Set(selectedRows.map((row) => `${row.vehicleId}:${row.date}`));

    return Object.entries(trackHistoryByVehicle)
        .flatMap(([vehicleId, history]) => ((history?.trackPoints || []).map((point, index) => ({
            _id: `${vehicleId}:summary:${index}:${point.timestamp}`,
            ...point,
            vehicleId: Number(vehicleId),
        }))))
        .filter((point) => selectedDateKeys.has(`${point.vehicleId}:${new Date(point.timestamp).toISOString().slice(0, 10)}`))
        .sort((left, right) => new Date(left.timestamp) - new Date(right.timestamp));
};

const VehicleTrackingTracksPanel = ({
    trackedVehicles = [],
    onTrackDaysSelected,
    drawOptions,
    onDraw,
    onDrawOptionsChange,
    reloadToken = 0,
}) => {
    const [fromDate, setFromDate] = useState(getDefaultFrom);
    const [toDate, setToDate] = useState(getDefaultTo);
    const [loading, setLoading] = useState(false);
    const [trackHistoryByVehicle, setTrackHistoryByVehicle] = useState({});
    const [selectedDayKeys, setSelectedDayKeys] = useState([]);
    const gridRef = useRef(null);
    const lastLoadedRangeKeyRef = useRef(null);
    const trackHistoryByVehicleRef = useRef({});

    const trackedVehicleKey = useMemo(
        () => trackedVehicles.map((vehicle) => String(vehicle.id)).sort().join(','),
        [trackedVehicles],
    );

    const rangeKey = useMemo(() => {
        const fromValue = fromDate ? new Date(fromDate).toISOString() : '';
        const toValue = toDate ? new Date(toDate).toISOString() : '';
        return `${fromValue}|${toValue}`;
    }, [fromDate, toDate]);

    const dailySummaries = useMemo(() => trackedVehicles
        .flatMap((vehicle) => buildDailySummaries(trackHistoryByVehicle[vehicle.id], vehicle))
        .sort((left, right) => {
            const dateCompare = left.date.localeCompare(right.date);
            if (dateCompare !== 0) {
                return dateCompare;
            }

            return left.vehicleLabel.localeCompare(right.vehicleLabel);
        }), [trackHistoryByVehicle, trackedVehicles]);

    useEffect(() => {
        trackHistoryByVehicleRef.current = trackHistoryByVehicle;
    }, [trackHistoryByVehicle]);

    const loadTracks = useCallback(async (options = {}) => {
        const { forceReload = false } = options;
        const vehiclesToLoad = trackedVehicles.filter((vehicle) => vehicle?.id);
        if (!vehiclesToLoad.length) {
            setTrackHistoryByVehicle({});
            trackHistoryByVehicleRef.current = {};
            setSelectedDayKeys([]);
            onTrackDaysSelected?.([], []);
            lastLoadedRangeKeyRef.current = null;
            return;
        }

        const canReuseActiveRange = !forceReload && lastLoadedRangeKeyRef.current === rangeKey;
        const currentHistory = trackHistoryByVehicleRef.current;
        const retainedHistory = canReuseActiveRange
            ? vehiclesToLoad.reduce((accumulator, vehicle) => {
                if (Object.prototype.hasOwnProperty.call(currentHistory, vehicle.id)) {
                    accumulator[vehicle.id] = currentHistory[vehicle.id];
                }

                return accumulator;
            }, {})
            : {};

        const vehiclesNeedingLoad = forceReload || !canReuseActiveRange
            ? vehiclesToLoad
            : vehiclesToLoad.filter((vehicle) => !Object.prototype.hasOwnProperty.call(retainedHistory, vehicle.id));

        if (!vehiclesNeedingLoad.length) {
            const existingVehicleIds = Object.keys(currentHistory).sort().join(',');
            const retainedVehicleIds = Object.keys(retainedHistory).sort().join(',');

            if (existingVehicleIds !== retainedVehicleIds) {
                setTrackHistoryByVehicle(retainedHistory);
                trackHistoryByVehicleRef.current = retainedHistory;
            }

            return;
        }

        setLoading(true);
        try {
            const results = await Promise.all(vehiclesNeedingLoad.map(async (vehicle) => {
                try {
                    const result = await vehicleGPSTrackingService.getTrackHistory(vehicle.id, fromDate, toDate);
                    return {
                        vehicleId: vehicle.id,
                        history: result?.isSuccess || result?.success ? result.data : null,
                    };
                } catch {
                    return {
                        vehicleId: vehicle.id,
                        history: null,
                    };
                }
            }));

            const nextHistory = { ...retainedHistory };
            results.forEach(({ vehicleId: currentVehicleId, history }) => {
                nextHistory[currentVehicleId] = history;
            });

            setTrackHistoryByVehicle(nextHistory);
            trackHistoryByVehicleRef.current = nextHistory;
            lastLoadedRangeKeyRef.current = rangeKey;
        } catch {
            setTrackHistoryByVehicle({});
            trackHistoryByVehicleRef.current = {};
            lastLoadedRangeKeyRef.current = null;
        } finally {
            setLoading(false);
        }
    }, [fromDate, onTrackDaysSelected, rangeKey, toDate, trackedVehicles]);

    useEffect(() => {
        if (trackedVehicles.length > 0) {
            loadTracks();
        } else {
            setTrackHistoryByVehicle({});
            trackHistoryByVehicleRef.current = {};
            setSelectedDayKeys([]);
            onTrackDaysSelected?.([], []);
            lastLoadedRangeKeyRef.current = null;
        }
    }, [loadTracks, onTrackDaysSelected, trackedVehicleKey, trackedVehicles.length]);

    useEffect(() => {
        if (reloadToken > 0 && trackedVehicles.length > 0) {
            loadTracks({ forceReload: true });
        }
    }, [loadTracks, reloadToken, trackedVehicles.length]);

    useEffect(() => {
        const validKeySet = new Set(dailySummaries.map((row) => row.id));
        const nextSelectedKeys = selectedDayKeys.filter((key) => validKeySet.has(key));

        if (nextSelectedKeys.length !== selectedDayKeys.length) {
            setSelectedDayKeys(nextSelectedKeys);
        }

        const selectedRows = dailySummaries.filter((row) => nextSelectedKeys.includes(row.id));
        onTrackDaysSelected?.(selectedRows, buildSelectedTrackPoints(selectedRows, trackHistoryByVehicle));
    }, [dailySummaries, onTrackDaysSelected, selectedDayKeys, trackHistoryByVehicle]);

    const handleSelectionChanged = useCallback((e) => {
        const keys = e.selectedRowKeys || [];
        setSelectedDayKeys(keys);

        const selectedRows = dailySummaries.filter((r) => keys.includes(r.id));
        onTrackDaysSelected?.(selectedRows, buildSelectedTrackPoints(selectedRows, trackHistoryByVehicle));
    }, [dailySummaries, onTrackDaysSelected, trackHistoryByVehicle]);

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

    return (
        <div className="vt-tracks-panel tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-bg-white">
            <div className="vt-tracks-panel__header tw-flex tw-flex-wrap tw-items-center tw-gap-2 tw-border-b tw-border-[#edebe9] tw-px-3 tw-py-2">
                <div className="tw-flex tw-items-center tw-gap-1">
                    <label className="tw-text-[11px] tw-text-[#605e5c]">From</label>
                    <DateBox
                        value={fromDate}
                        onValueChanged={(e) => setFromDate(e.value)}
                        type="datetime"
                        width={170}
                        height={28}
                        stylingMode="outlined"
                        displayFormat="yyyy-MM-dd HH:mm"
                    />
                </div>
                <div className="tw-flex tw-items-center tw-gap-1">
                    <label className="tw-text-[11px] tw-text-[#605e5c]">To</label>
                    <DateBox
                        value={toDate}
                        onValueChanged={(e) => setToDate(e.value)}
                        type="datetime"
                        width={170}
                        height={28}
                        stylingMode="outlined"
                        displayFormat="yyyy-MM-dd HH:mm"
                    />
                </div>
                <Button
                    text="Load"
                    icon="fa-light fa-download"
                    stylingMode="contained"
                    type="default"
                    height={28}
                    onClick={() => loadTracks({ forceReload: true })}
                    disabled={loading || trackedVehicles.length === 0}
                />
                <Button
                    text="Draw"
                    icon="fa-light fa-pen-line"
                    stylingMode="outlined"
                    height={28}
                    onClick={handleDrawClick}
                    disabled={loading || dailySummaries.length === 0}
                />
                <DropDownButton
                    text=""
                    stylingMode="outlined"
                    height={28}
                    items={drawMenuItems}
                    onItemClick={handleDrawOptionClick}
                    itemRender={renderDrawMenuItem}
                    displayExpr="text"
                    keyExpr="id"
                    showArrowIcon={true}
                    width={34}
                    dropDownOptions={{ width: 220 }}
                />
            </div>

            {/* Daily tracks grid */}
            <div className="tw-flex-1 tw-min-h-0 tw-relative">
                {!trackedVehicles.length ? (
                    <div className="tw-flex tw-h-full tw-items-center tw-justify-center">
                        <div className="tw-text-center tw-px-6">
                            <i className="fa-light fa-road tw-mb-3 tw-text-3xl tw-text-[#9aa09d]" />
                            <div className="tw-text-[14px] tw-font-semibold tw-text-[#111813]">No Tracked Vehicles</div>
                            <div className="tw-mt-1 tw-text-[12px] tw-text-[#5a6360]">Check one or more vehicles in the Track column to load tracks</div>
                        </div>
                    </div>
                ) : (
                    <DataGrid
                        ref={gridRef}
                        dataSource={dailySummaries}
                        keyExpr="id"
                        height="100%"
                        showBorders={false}
                        showColumnLines={true}
                        showRowLines={true}
                        hoverStateEnabled={true}
                        rowAlternationEnabled={false}
                        columnAutoWidth={true}
                        noDataText={loading ? 'Loading tracks...' : 'No track data available'}
                        selectedRowKeys={selectedDayKeys}
                        onSelectionChanged={handleSelectionChanged}
                        onContextMenuPreparing={handleContextMenuPreparing}
                    >
                        <Selection mode="multiple" showCheckBoxesMode="always" />
                        <ColumnChooser enabled={true} mode="select" height={340} />
                        <Sorting mode="single" />
                        <Scrolling mode="virtual" showScrollbar="always" />
                        <Paging enabled={false} />

                        <Column
                            dataField="vehicleLabel"
                            caption="Vehicle"
                            minWidth={150}
                            cellRender={renderVehicleCell}
                        />

                        <Column
                            dataField="date"
                            caption="Date"
                            dataType="string"
                            minWidth={110}
                            customizeText={({ value }) => formatDate(value)}
                            sortOrder="asc"
                        />
                        <Column
                            dataField="startTime"
                            caption="Start"
                            dataType="string"
                            minWidth={100}
                            customizeText={({ value }) => formatTime(value)}
                        />
                        <Column
                            dataField="stopTime"
                            caption="Stop"
                            dataType="string"
                            minWidth={100}
                            customizeText={({ value }) => formatTime(value)}
                        />
                        <Column
                            dataField="distanceKm"
                            caption="Distance"
                            dataType="number"
                            minWidth={100}
                            alignment="right"
                            format="#,##0 km"
                        />
                        <Column
                            dataField="fuelUsed"
                            caption="Fuel (L)"
                            dataType="number"
                            minWidth={90}
                            alignment="right"
                            format="#,##0"
                        />

                        <Summary>
                            <TotalItem column="distanceKm" summaryType="sum" displayFormat="Total: {0}" valueFormat="#,##0 km" />
                            <TotalItem column="fuelUsed" summaryType="sum" displayFormat="Total: {0}" valueFormat="#,##0 L" />
                        </Summary>
                    </DataGrid>
                )}
                {loading && (
                    <div className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-white/70">
                        <LoadIndicator height={40} width={40} />
                    </div>
                )}
            </div>
        </div>
    );
};

export default VehicleTrackingTracksPanel;
