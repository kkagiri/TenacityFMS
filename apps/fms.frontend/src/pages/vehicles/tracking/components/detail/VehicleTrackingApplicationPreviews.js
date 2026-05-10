/**
 * File: VehicleTrackingApplicationPreviews.js
 * Purpose: Dedicated compact preview components for vehicle application tabs inside the tracking detail popup.
 * Dependencies: React, axiosInstance, vehicle trip service, shared embedded preview shell
 * Last Modified: 2026-03-13
 *
 * Key Components:
 * - VehicleTripEmbeddedPreview(): Compact trip history preview
 * - VehicleConsumptionEmbeddedPreview(): Compact consumption history preview
 * - VehicleMaintenanceEmbeddedPreview(): Compact maintenance history preview
 * - VehicleFuelEmbeddedPreview(): Compact fuel history preview
 * - VehicleFuelEmbeddedPreview(): Compact fuel preview
 * - VehicleTransfersEmbeddedPreview(): Compact transfer history preview
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import notify from 'devextreme/ui/notify';
import axiosInstance from '../../../../../api/axiosInstance';
import { fetchVehicleTripHistory } from '../../../trips/services/vehicleTripService';
import { getVehicleDetailsRoute } from '../../../utils/navigationHelper';
import { VehicleEmbeddedPreviewFrame, VehicleEmbeddedPreviewGrid } from './VehicleEmbeddedPreviewFrame';

const VEHICLE_DETAILS_TAB_INDEX = {
    consumption: 2,
    maintenance: 3,
    fuel: 4,
    documents: 5,
    transfers: 7,
    trip: 8,
};

const createDefaultDateRange = () => {
    const today = new Date();
    const from = new Date(today);
    from.setDate(today.getDate() - 30);

    return {
        dateFrom: from,
        dateTo: today,
    };
};

const formatApiDate = (value) => {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }

    return date.toISOString().split('T')[0];
};

const formatDate = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString();
};

const formatDateTime = (value) => {
    if (!value) {
        return '—';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '—' : date.toLocaleString();
};

const formatNumber = (value, suffix = '') => {
    const parsed = Number(value);
    if (!Number.isFinite(parsed)) {
        return '—';
    }

    return `${parsed.toFixed(2)}${suffix}`;
};

const inRange = (value, dateFrom, dateTo) => {
    if (!value) {
        return false;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return false;
    }

    const start = new Date(dateFrom);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateTo);
    end.setHours(23, 59, 59, 999);

    return date >= start && date <= end;
};

const sortByDateDesc = (rows, selector) => [...rows].sort((left, right) => {
    const leftDate = new Date(selector(left) || 0).getTime();
    const rightDate = new Date(selector(right) || 0).getTime();
    return rightDate - leftDate;
});

const toPreviewRows = (rows) => rows.slice(0, 5);

const unwrapArrayResponse = (response) => {
    const payload = response?.data;
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    return [];
};

const usePreviewLoader = ({ loadData, vehicleId, appliedRange }) => {
    const [rows, setRows] = useState([]);
    const [loading, setLoading] = useState(false);

    const refresh = useCallback(async () => {
        if (!vehicleId) {
            setRows([]);
            return;
        }

        try {
            setLoading(true);
            const nextRows = await loadData({ vehicleId, ...appliedRange });
            setRows(Array.isArray(nextRows) ? nextRows : []);
        } catch (error) {
            console.error('Error loading embedded preview data:', error);
            notify(error.message || 'Failed to load preview data', 'error', 3000);
            setRows([]);
        } finally {
            setLoading(false);
        }
    }, [appliedRange, loadData, vehicleId]);

    useEffect(() => {
        refresh();
    }, [refresh]);

    return { loading, rows };
};

const buildPreviewActions = ({ navigate, tabKey, vehicleId, supportsAdd = false, supportsOpenPage = false }) => {
    const goToDetails = () => {
        if (!vehicleId) {
            return;
        }

        navigate(getVehicleDetailsRoute(vehicleId), {
            state: { initialTab: VEHICLE_DETAILS_TAB_INDEX[tabKey] ?? 0 },
        });
    };

    const actions = [];

    if (supportsOpenPage) {
        actions.push({
            label: 'Open full page',
            icon: 'fa-light fa-arrow-up-right-from-square',
            onClick: goToDetails,
        });
    }

    if (supportsAdd) {
        actions.unshift({
            label: 'Add item',
            icon: 'fa-light fa-plus',
            onClick: goToDetails,
            variant: 'primary',
        });
    }

    return actions;
};

const EmbeddedPreview = ({
    actions,
    columns,
    emptyText,
    loading,
    rows,
    stats,
    title,
}) => (
    <VehicleEmbeddedPreviewFrame
        actions={actions}
        stats={stats}
        title={title}
    >
        <VehicleEmbeddedPreviewGrid
            columns={columns}
            data={toPreviewRows(rows)}
            emptyText={emptyText}
            loading={loading}
        />
    </VehicleEmbeddedPreviewFrame>
);

export const VehicleTripEmbeddedPreview = ({ navigate, vehicleId, appliedRange }) => {
    const loadData = useCallback(async ({ vehicleId: targetVehicleId, dateFrom: start, dateTo: end }) => {
        const data = await fetchVehicleTripHistory(targetVehicleId, {
            fromUtc: new Date(start).toISOString(),
            toUtc: new Date(end).toISOString(),
        });

        return sortByDateDesc(data, (item) => item.startTimeUtc).map((item) => ({
            ...item,
            rowKey: `trip-${item.vehicleTripGroupId}`,
            routeLabel: `${item.originDisplayName} -> ${item.destinationDisplayName}`,
        }));
    }, []);

    const { loading, rows } = usePreviewLoader({ appliedRange, loadData, vehicleId });

    const stats = useMemo(() => ([
        { label: 'Route groups', value: String(rows.length), hint: 'Detected groups in range' },
        { label: 'Trips', value: String(rows.reduce((sum, item) => sum + Number(item.tripCount || 0), 0)), hint: 'Legs inside the groups' },
        { label: 'Distance', value: `${rows.reduce((sum, item) => sum + Number(item.totalDistanceKm || 0), 0).toFixed(1)} km`, hint: 'Combined distance' },
    ]), [rows]);

    const columns = useMemo(() => ([
        { dataField: 'startTimeUtc', caption: 'Start', minWidth: 150, customizeText: ({ value }) => formatDateTime(value) },
        { dataField: 'routeLabel', caption: 'Route', minWidth: 190 },
        { dataField: 'tripCount', caption: 'Trips', width: 70, alignment: 'center' },
        { dataField: 'totalDistanceKm', caption: 'Distance', width: 100, customizeText: ({ value }) => `${Number(value || 0).toFixed(1)} km` },
        { dataField: 'statusLabel', caption: 'Status', width: 110 },
    ]), []);

    return (
        <EmbeddedPreview
            actions={buildPreviewActions({ navigate, tabKey: 'trip', vehicleId })}
            columns={columns}
            emptyText="No trip groups found for the selected period."
            loading={loading}
            rows={rows}
            stats={stats}
            title="Trip"
        />
    );
};

export const VehicleConsumptionEmbeddedPreview = ({ navigate, vehicleId, appliedRange }) => {

    const loadData = useCallback(async ({ vehicleId: targetVehicleId, dateFrom: start, dateTo: end }) => {
        const from = new Date(start);
        const to = new Date(end);
        const diffDays = Math.max(5, Math.ceil(Math.abs(to - from) / (1000 * 60 * 60 * 24)));
        const response = await axiosInstance.get('/consumption/gethistoryconsumptionbyvehicle', {
            params: {
                vehicleId: targetVehicleId,
                datestring: formatApiDate(to),
                dateFromString: formatApiDate(from),
                entry: diffDays,
            },
        });

        return sortByDateDesc(unwrapArrayResponse(response), (item) => item.date).map((item, index) => ({
            ...item,
            rowKey: `consumption-${item.id || index}-${item.date || 'na'}`,
            efficiencyLabel: item.totalDistance > 0 && item.totalFuel > 0
                ? `${(Number(item.totalDistance) / Number(item.totalFuel)).toFixed(2)} km/L`
                : '—',
        }));
    }, []);

    const { loading, rows } = usePreviewLoader({ appliedRange, loadData, vehicleId });

    const stats = useMemo(() => ([
        { label: 'Entries', value: String(rows.length), hint: 'Consumption records' },
        { label: 'Fuel used', value: `${rows.reduce((sum, item) => sum + Number(item.totalFuel || 0), 0).toFixed(2)} L`, hint: 'Selected range' },
        { label: 'Distance', value: `${rows.reduce((sum, item) => sum + Number(item.totalDistance || 0), 0).toFixed(1)} km`, hint: 'Selected range' },
    ]), [rows]);

    const columns = useMemo(() => ([
        { dataField: 'date', caption: 'Date', minWidth: 110, customizeText: ({ value }) => formatDate(value) },
        { dataField: 'site', caption: 'Site', minWidth: 140 },
        { dataField: 'fuelType', caption: 'Fuel', width: 100 },
        { dataField: 'totalFuel', caption: 'Fuel used', width: 110, customizeText: ({ value }) => formatNumber(value, ' L') },
        { dataField: 'totalDistance', caption: 'Distance', width: 110, customizeText: ({ value }) => formatNumber(value, ' km') },
        { dataField: 'efficiencyLabel', caption: 'Efficiency', width: 120 },
    ]), []);

    return (
        <EmbeddedPreview
            actions={buildPreviewActions({ navigate, tabKey: 'consumption', vehicleId })}
            columns={columns}
            emptyText="No consumption history found for the selected period."
            loading={loading}
            rows={rows}
            stats={stats}
            title="Consumption history"
        />
    );
};

export const VehicleMaintenanceEmbeddedPreview = ({ navigate, vehicleId, appliedRange }) => {

    const loadData = useCallback(async ({ vehicleId: targetVehicleId, dateFrom: start, dateTo: end }) => {
        const response = await axiosInstance.get(`/VehicleMaintenance?vehicleId=${targetVehicleId}`);
        return sortByDateDesc(
            unwrapArrayResponse(response)
                .map((item, index) => ({
                    ...item,
                    rowKey: `maintenance-${item.vehicleMaintenanceId || index}`,
                    effectiveDate: item.completedDate || item.scheduledDate || item.dateCreated,
                }))
                .filter((item) => inRange(item.effectiveDate, start, end)),
            (item) => item.effectiveDate,
        );
    }, []);

    const { loading, rows } = usePreviewLoader({ appliedRange, loadData, vehicleId });

    const stats = useMemo(() => ([
        { label: 'Entries', value: String(rows.length), hint: 'Maintenance records' },
        { label: 'Completed', value: String(rows.filter((item) => String(item.status || '').toLowerCase() === 'completed').length), hint: 'Finished work orders' },
        { label: 'Scheduled', value: String(rows.filter((item) => String(item.status || '').toLowerCase() === 'scheduled').length), hint: 'Upcoming work' },
    ]), [rows]);

    const columns = useMemo(() => ([
        { dataField: 'effectiveDate', caption: 'Date', minWidth: 110, customizeText: ({ value }) => formatDate(value) },
        { dataField: 'maintenanceType', caption: 'Type', minWidth: 150 },
        { dataField: 'status', caption: 'Status', width: 110 },
        { dataField: 'priority', caption: 'Priority', width: 90 },
        { dataField: 'description', caption: 'Description', minWidth: 220 },
    ]), []);

    return (
        <EmbeddedPreview
            actions={buildPreviewActions({ navigate, supportsAdd: true, supportsOpenPage: true, tabKey: 'maintenance', vehicleId })}
            columns={columns}
            emptyText="No maintenance entries found for the selected period."
            loading={loading}
            rows={rows}
            stats={stats}
            title="Maintenance history"
        />
    );
};

export const VehicleFuelEmbeddedPreview = ({ navigate, vehicleId, appliedRange }) => {

    const loadData = useCallback(async ({ vehicleId: targetVehicleId, dateFrom: start, dateTo: end }) => {
        const response = await axiosInstance.get(`/consumption/vehicleRefills?startDate=${formatApiDate(start)}&endDate=${formatApiDate(end)}&vehicleId=${targetVehicleId}`);

        return sortByDateDesc(unwrapArrayResponse(response), (item) => item.date).map((item, index) => ({
            ...item,
            rowKey: `fuel-${item.id || index}`,
            fuelingDate: item.date,
            stationName: item.tankName || item.siteName || 'Tank',
            fuelAmount: item.manualFuelrefillAmount || 0,
        }));
    }, []);

    const { loading, rows } = usePreviewLoader({ appliedRange, loadData, vehicleId });

    const stats = useMemo(() => ([
        { label: 'Refills', value: String(rows.length), hint: 'Fuel events in range' },
        { label: 'Fuel dispensed', value: `${rows.reduce((sum, item) => sum + Number(item.fuelAmount || 0), 0).toFixed(2)} L`, hint: 'Selected range' },
        { label: 'Avg consumption', value: rows.length > 0 ? formatNumber(rows.reduce((sum, item) => sum + Number(item.consumption || 0), 0) / rows.length) : '—', hint: 'Per refill event' },
    ]), [rows]);

    const columns = useMemo(() => ([
        { dataField: 'fuelingDate', caption: 'Date', minWidth: 110, customizeText: ({ value }) => formatDate(value) },
        { dataField: 'stationName', caption: 'Source', minWidth: 150 },
        { dataField: 'driverName', caption: 'Driver', minWidth: 140 },
        { dataField: 'fuelAmount', caption: 'Fuel', width: 100, customizeText: ({ value }) => formatNumber(value, ' L') },
        { dataField: 'consumption', caption: 'Consumption', width: 120, customizeText: ({ value }) => formatNumber(value) },
    ]), []);

    return (
        <EmbeddedPreview
            actions={buildPreviewActions({ navigate, tabKey: 'fuel', vehicleId })}
            columns={columns}
            emptyText="No fueling entries found for the selected period."
            loading={loading}
            rows={rows}
            stats={stats}
            title="Fuel history"
        />
    );
};

export const VehicleTransfersEmbeddedPreview = ({ navigate, vehicleId, appliedRange }) => {

    const loadData = useCallback(async ({ vehicleId: targetVehicleId, dateFrom: start, dateTo: end }) => {
        const response = await axiosInstance.get(`/vehicletransfers/vehicle/${targetVehicleId}`);

        return sortByDateDesc(
            unwrapArrayResponse(response)
                .map((item, index) => ({
                    ...item,
                    rowKey: `transfer-${item.vehicleTransferId || index}`,
                    transferDateValue: item.transferDate || item.dateCreated,
                }))
                .filter((item) => inRange(item.transferDateValue, start, end)),
            (item) => item.transferDateValue,
        );
    }, []);

    const { loading, rows } = usePreviewLoader({ appliedRange, loadData, vehicleId });

    const stats = useMemo(() => ([
        { label: 'Transfers', value: String(rows.length), hint: 'Matched date range' },
        { label: 'Completed', value: String(rows.filter((item) => String(item.status || '').toLowerCase() === 'completed').length), hint: 'Completed transfers' },
        { label: 'In transit', value: String(rows.filter((item) => String(item.status || '').toLowerCase().includes('transit')).length), hint: 'Active movement' },
    ]), [rows]);

    const columns = useMemo(() => ([
        { dataField: 'transferDateValue', caption: 'Date', minWidth: 110, customizeText: ({ value }) => formatDate(value) },
        { dataField: 'fromSiteName', caption: 'From', minWidth: 140 },
        { dataField: 'toSiteName', caption: 'To', minWidth: 140 },
        { dataField: 'status', caption: 'Status', width: 110 },
        { dataField: 'driverName', caption: 'Driver', minWidth: 130 },
    ]), []);

    return (
        <EmbeddedPreview
            actions={buildPreviewActions({ navigate, supportsAdd: true, supportsOpenPage: true, tabKey: 'transfers', vehicleId })}
            columns={columns}
            emptyText="No transfers found for the selected period."
            loading={loading}
            rows={rows}
            stats={stats}
            title="Transfer history"
        />
    );
};
