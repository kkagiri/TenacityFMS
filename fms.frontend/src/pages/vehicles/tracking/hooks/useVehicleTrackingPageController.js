/**
 * File: useVehicleTrackingPageController.js
 * Purpose: Orchestrates vehicle tracking page data, map/grid interactions, preferences, and trip workflows
 * Dependencies: React, DevExtreme data store, tracking hooks, vehicleTrackingSnapshotService, vehicleTripService
 * Last Modified: 2026-03-21
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import notify from 'devextreme/ui/notify';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../../contexts/themeContext';
import { usePermissions } from '../../../../hooks/usePermissions';
import { ConnectionState } from '../../../../signalR/vehicleTrackingSignalRService';
import { reconcileVehicleTrips, recomputeVehicleTrips } from '../../trips/services/vehicleTripService';
import { vehicleRoutes } from '../../utils/navigationHelper';
import { fetchTrackingTagsSnapshot, fetchVehiclesByTagSnapshot, normalizeTrackingTagId } from '../vehicleTrackingSnapshotService';
import vehicleTrackingPreferencesService from '../vehicleTrackingPreferencesService';
import {
    CITY_LEVEL_ZOOM,
    FOCUSED_VEHICLE_ZOOM_LEVEL,
    REGION_LEVEL_ZOOM,
    STREET_LEVEL_ZOOM,
    getVehicleCode,
    getVehicleDriverName,
    getVehicleEngineHours,
    getVehicleHeading,
    getVehicleOperationalStatus,
    getVehicleSpeed,
    getVehicleStatusSortValue,
    getVehicleStatusTone,
    resolveInitialTrackingView,
    saveTrackingViewPreference,
} from '../utils/vehicleTrackingHelpers';
import useGeofencePreviewOverlay from './useGeofencePreviewOverlay';
import useVehicleTrackingGeofenceManager from './useVehicleTrackingGeofenceManager';
import useVehicleTrackingMap from './useVehicleTrackingMap';
import useVehicleTrackingRealtime from './useVehicleTrackingRealtime';
import useVehicleTrackingTrips from './useVehicleTrackingTrips';

const useVehicleTrackingPageController = () => {
    const navigate = useNavigate();
    const { resolvedTheme } = useTheme();
    const { hasPermission } = usePermissions();
    const isDarkTheme = resolvedTheme === 'dark';
    const canManageTrips = hasPermission('_Edit_Vehicle');

    const trackingGridRef = useRef(null);
    const trackingPreferencesSaveTimeoutRef = useRef(null);
    const lastVehicleFetchRef = useRef({ tagId: null, timestamp: 0 });
    const previousRealtimeConnectionStateRef = useRef(ConnectionState.DISCONNECTED);
    const gridRowCacheRef = useRef(new Map());
    const gridStoreRef = useRef(new ArrayStore({ key: 'id', data: [] }));
    const gridDataSourceRef = useRef(new DataSource({ store: gridStoreRef.current, reshapeOnPush: true }));
    const gridSnapshotRef = useRef(new Map());
    const mapViewportRef = useRef({ getViewportSnapshot: null, scrollMapIntoView: null });

    const [tags, setTags] = useState([]);
    const [selectedTagId, setSelectedTagId] = useState(null);
    const [vehicles, setVehicles] = useState([]);
    const [trackingPreferences, setTrackingPreferences] = useState({ selectedView: null, workspaceLayout: null });
    const [isTrackingPreferencesLoaded, setIsTrackingPreferencesLoaded] = useState(false);
    const [clusterFilteredVehicleIds, setClusterFilteredVehicleIds] = useState(null);
    const [statusFilter] = useState('all');
    const [preferredVehicleZoomLevel, setPreferredVehicleZoomLevel] = useState(FOCUSED_VEHICLE_ZOOM_LEVEL);
    const [loading, setLoading] = useState(true);
    const [selectedVehicle, setSelectedVehicle] = useState(null);
    const [trackedVehicleIds, setTrackedVehicleIds] = useState([]);
    const [, setLastRefresh] = useState(null);
    const [isTripPanelOpen, setIsTripPanelOpen] = useState(false);
    const [selectedTripGroupId, setSelectedTripGroupId] = useState(null);
    const [tripDetailForOverride, setTripDetailForOverride] = useState(null);
    const [isTripOverridePanelOpen, setIsTripOverridePanelOpen] = useState(false);
    const [isTripCommandBusy, setIsTripCommandBusy] = useState(false);

    const getViewportSnapshot = useCallback(() => mapViewportRef.current.getViewportSnapshot?.() || null, []);
    const scrollMapIntoView = useCallback(() => mapViewportRef.current.scrollMapIntoView?.(), []);

    const geofenceManager = useVehicleTrackingGeofenceManager({ getViewportSnapshot, scrollMapIntoView });

    const {
        inProgressTrips,
        recentTrips,
        lowConfidenceCount,
        isLoading: isTripLoading,
        lastUpdated: lastTripUpdated,
        refreshTrips,
    } = useVehicleTrackingTrips({ enabled: isTripPanelOpen });

    const selectedVehicleId = selectedVehicle?.vehicleId || selectedVehicle?.id || null;
    const selectedVehicleGridId = selectedVehicle?.id ?? null;
    const selectedVehicleLabel = selectedVehicle ? getVehicleCode(selectedVehicle) : null;

    const filteredVehicles = useMemo(() => vehicles.filter((vehicle) => {
        const operationalStatus = getVehicleOperationalStatus(vehicle);
        return statusFilter === 'all'
            ? true
            : statusFilter === 'Offline'
                ? vehicle.isOnline === false
                : operationalStatus === statusFilter;
    }), [statusFilter, vehicles]);

    const {
        clusterContextMenu,
        closeClusterContextMenu,
        focusVehicleOnMap,
        getViewportSnapshot: liveViewportSnapshot,
        isMapLoaded,
        isMapLoading,
        mapContainerRef,
        mapRef,
        mapSectionRef,
        panToCoordinate,
        resetMapBounds,
        scrollMapIntoView: liveScrollMapIntoView,
    } = useVehicleTrackingMap({
        filteredVehicles,
        geofenceDrawing: geofenceManager.trackingGeofenceDrawing,
        onVehicleActivate: setSelectedVehicle,
        selectedVehicle,
        setSelectedVehicle,
        preferredVehicleZoomLevel,
        isDarkTheme,
    });

    mapViewportRef.current = {
        getViewportSnapshot: liveViewportSnapshot,
        scrollMapIntoView: liveScrollMapIntoView,
    };

    useGeofencePreviewOverlay(mapRef, geofenceManager.previewGeofence, geofenceManager.previewColor);

    const { connectionState } = useVehicleTrackingRealtime({
        trackedVehicleIds,
        setVehicles,
        setSelectedVehicle,
        setLastRefresh,
    });

    const clearClusterFilter = useCallback(() => setClusterFilteredVehicleIds(null), []);
    const applyClusterFilter = useCallback((vehicleIds = []) => {
        if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
            return;
        }

        setClusterFilteredVehicleIds(vehicleIds);
        closeClusterContextMenu();
    }, [closeClusterContextMenu]);

    const fetchTags = useCallback(async () => {
        try {
            const { preferences, shouldPersist } = await vehicleTrackingPreferencesService.loadPreferences();
            setTrackingPreferences(preferences);
            setIsTrackingPreferencesLoaded(true);

            const tagsData = await fetchTrackingTagsSnapshot();
            setTags(tagsData);

            if (tagsData.length > 0) {
                const initialView = resolveInitialTrackingView(tagsData, preferences?.selectedView);
                setSelectedTagId((previous) => previous ?? normalizeTrackingTagId(initialView?.id ?? tagsData[0]?.id));
            }

            if (shouldPersist && preferences) {
                vehicleTrackingPreferencesService.savePreferences(preferences).catch((error) => {
                    console.warn('[VehicleTracking] Failed to migrate local tracking preferences to API persistence:', error);
                });
            }
        } catch (error) {
            console.error('Error fetching tags:', error);
            notify('Failed to fetch vehicle views', 'error', 3000);
        } finally {
            setIsTrackingPreferencesLoaded(true);
        }
    }, []);

    const fetchVehiclesByTag = useCallback(async (tagId, options = {}) => {
        const normalizedTagId = normalizeTrackingTagId(tagId);
        if (normalizedTagId == null) {
            return;
        }

        const { force = false, silent = false } = options;
        const now = Date.now();
        if (!force && normalizeTrackingTagId(lastVehicleFetchRef.current.tagId) === normalizedTagId && now - lastVehicleFetchRef.current.timestamp < 1000) {
            return;
        }

        lastVehicleFetchRef.current = { tagId: normalizedTagId, timestamp: now };

        try {
            if (!silent) {
                setLoading(true);
            }

            const vehicleData = await fetchVehiclesByTagSnapshot(normalizedTagId);
            setVehicles(vehicleData);
            clearClusterFilter();
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error fetching vehicles:', error);
            notify(error?.message || 'Failed to fetch vehicles', 'error', 3000);
        } finally {
            if (!silent) {
                setLoading(false);
            }
        }
    }, [clearClusterFilter]);

    useEffect(() => {
        fetchTags();
    }, [fetchTags]);

    useEffect(() => {
        if (normalizeTrackingTagId(selectedTagId) == null || !tags.length) {
            return;
        }

        const selectedView = tags.find((tag) => normalizeTrackingTagId(tag.id) === normalizeTrackingTagId(selectedTagId));
        saveTrackingViewPreference(selectedView);
        setTrackingPreferences((previous) => {
            const nextSelectedView = selectedView ? { id: selectedView.id, name: selectedView.name || '' } : null;
            if (previous?.selectedView?.id === nextSelectedView?.id && previous?.selectedView?.name === nextSelectedView?.name) {
                return previous;
            }

            return {
                ...(previous || {}),
                selectedView: nextSelectedView,
                workspaceLayout: previous?.workspaceLayout || null,
            };
        });
    }, [selectedTagId, tags]);

    useEffect(() => {
        if (!isTrackingPreferencesLoaded || !trackingPreferences) {
            return undefined;
        }

        vehicleTrackingPreferencesService.cacheLegacyPreferences(trackingPreferences);
        if (trackingPreferencesSaveTimeoutRef.current) {
            clearTimeout(trackingPreferencesSaveTimeoutRef.current);
        }

        trackingPreferencesSaveTimeoutRef.current = setTimeout(() => {
            vehicleTrackingPreferencesService.savePreferences(trackingPreferences).catch((error) => {
                console.warn('[VehicleTracking] Failed to persist tracking preferences:', error);
            });
        }, 700);

        return () => {
            if (trackingPreferencesSaveTimeoutRef.current) {
                clearTimeout(trackingPreferencesSaveTimeoutRef.current);
                trackingPreferencesSaveTimeoutRef.current = null;
            }
        };
    }, [isTrackingPreferencesLoaded, trackingPreferences]);

    useEffect(() => {
        if (normalizeTrackingTagId(selectedTagId) == null) {
            return;
        }

        const previousKeys = Array.from(gridSnapshotRef.current.keys());
        if (previousKeys.length > 0) {
            gridStoreRef.current.push(previousKeys.map((id) => ({ type: 'remove', key: id })));
        }

        setSelectedVehicle(null);
        gridSnapshotRef.current = new Map();
        gridRowCacheRef.current = new Map();
        setVehicles([]);
        resetMapBounds();
        fetchVehiclesByTag(selectedTagId, { force: true });
    }, [fetchVehiclesByTag, resetMapBounds, selectedTagId]);

    useEffect(() => {
        const previousState = previousRealtimeConnectionStateRef.current;
        previousRealtimeConnectionStateRef.current = connectionState;

        if (
            normalizeTrackingTagId(selectedTagId) == null
            || connectionState !== ConnectionState.CONNECTED
            || !previousState
            || previousState === ConnectionState.CONNECTED
            || previousState === ConnectionState.CONNECTING
        ) {
            return;
        }

        const mergeReconnectSnapshot = async () => {
            try {
                const freshVehicles = await fetchVehiclesByTagSnapshot(selectedTagId);

                setVehicles((previousVehicles) => {
                    const previousMap = new Map(previousVehicles.map((vehicle) => [vehicle.id, vehicle]));
                    let hasChanges = false;

                    const mergedVehicles = freshVehicles.map((freshVehicle) => {
                        const existingVehicle = previousMap.get(freshVehicle.id);
                        if (!existingVehicle) {
                            hasChanges = true;
                            return freshVehicle;
                        }

                        const isUnchanged = existingVehicle.latitude === freshVehicle.latitude
                            && existingVehicle.longitude === freshVehicle.longitude
                            && existingVehicle.isOnline === freshVehicle.isOnline
                            && existingVehicle.speed === freshVehicle.speed
                            && existingVehicle.heading === freshVehicle.heading
                            && existingVehicle.address === freshVehicle.address;

                        if (isUnchanged) {
                            return existingVehicle;
                        }

                        hasChanges = true;
                        return freshVehicle;
                    });

                    if (mergedVehicles.length !== previousVehicles.length) {
                        hasChanges = true;
                    }

                    return hasChanges ? mergedVehicles : previousVehicles;
                });

                setLastRefresh(new Date());
            } catch (error) {
                console.error('[VehicleTracking] Reconnect snapshot merge failed:', error);
            }
        };

        mergeReconnectSnapshot();
    }, [connectionState, selectedTagId]);

    const gridFilteredVehicles = useMemo(() => {
        if (!Array.isArray(clusterFilteredVehicleIds) || clusterFilteredVehicleIds.length === 0) {
            return filteredVehicles;
        }

        const clusterVehicleIds = new Set(clusterFilteredVehicleIds);
        return filteredVehicles.filter((vehicle) => clusterVehicleIds.has(vehicle.id));
    }, [clusterFilteredVehicleIds, filteredVehicles]);

    const gridVehicles = useMemo(() => {
        const nextCache = new Map();

        const rows = gridFilteredVehicles.map((vehicle) => {
            const cachedEntry = gridRowCacheRef.current.get(vehicle.id);
            if (cachedEntry?.source === vehicle) {
                nextCache.set(vehicle.id, cachedEntry);
                return cachedEntry.row;
            }

            const row = {
                ...vehicle,
                trackingCode: getVehicleCode(vehicle),
                lastSeenAt: vehicle.lastUpdated ? new Date(vehicle.lastUpdated) : null,
                operationalStatusLabel: vehicle.isOnline === false ? 'Offline' : getVehicleOperationalStatus(vehicle),
                driverNameLabel: getVehicleDriverName(vehicle),
                engineHoursValue: getVehicleEngineHours(vehicle),
                speedValue: getVehicleSpeed(vehicle),
                headingValue: getVehicleHeading(vehicle),
                ignitionLabel: vehicle.ignitionOn === true ? 'On' : vehicle.ignitionOn === false ? 'Off' : '—',
                plateNumberLabel: vehicle.numberPlate || vehicle.plateNumber || '—',
                addressLabel: vehicle.address || '—',
                statusSortValue: getVehicleStatusSortValue(vehicle),
            };

            nextCache.set(vehicle.id, { source: vehicle, row });
            return row;
        });

        gridRowCacheRef.current = nextCache;
        return rows;
    }, [gridFilteredVehicles]);

    const stats = useMemo(() => ({
        total: vehicles.length,
        moving: vehicles.filter((vehicle) => vehicle.isMoving).length,
        online: vehicles.filter((vehicle) => vehicle.isOnline !== false).length,
        offline: vehicles.filter((vehicle) => vehicle.isOnline === false).length,
    }), [vehicles]);

    const trackedVehicles = useMemo(() => {
        if (!trackedVehicleIds.length) {
            return [];
        }

        const trackedIdSet = new Set(trackedVehicleIds);
        return gridVehicles.filter((vehicle) => trackedIdSet.has(vehicle.id));
    }, [gridVehicles, trackedVehicleIds]);

    useEffect(() => {
        const nextSnapshot = new Map(gridVehicles.map((row) => [row.id, row]));
        const changes = [];

        nextSnapshot.forEach((row, id) => {
            const previousRow = gridSnapshotRef.current.get(id);
            if (!previousRow) {
                changes.push({ type: 'insert', data: row });
                return;
            }

            if (previousRow !== row) {
                changes.push({ type: 'update', key: id, data: row });
            }
        });

        gridSnapshotRef.current.forEach((_, id) => {
            if (!nextSnapshot.has(id)) {
                changes.push({ type: 'remove', key: id });
            }
        });

        if (changes.length > 0) {
            gridStoreRef.current.push(changes);
            gridSnapshotRef.current = nextSnapshot;
        }
    }, [gridVehicles]);

    const handleTrackingViewChange = useCallback((event) => {
        setSelectedTagId(normalizeTrackingTagId(event?.value ?? event?.target?.value));
    }, []);

    const handleOpenTripsPage = useCallback(() => {
        navigate(vehicleRoutes.trips);
    }, [navigate]);

    const handleRecomputeTripPayload = useCallback(async (payload) => {
        if (!canManageTrips) {
            notify('Only admins can recompute trips', 'warning', 3000);
            return;
        }

        try {
            setIsTripCommandBusy(true);
            const result = await recomputeVehicleTrips(payload);
            notify(`Recompute finished. ${result?.groupsCreated || 0} groups / ${result?.tripsCreated || 0} trips created.`, 'success', 4000);
            await refreshTrips();
        } catch (error) {
            console.error('Error recomputing trip payload:', error);
            notify(error.message || 'Trip recompute failed', 'error', 3000);
        } finally {
            setIsTripCommandBusy(false);
        }
    }, [canManageTrips, refreshTrips]);

    const handleReconcileTripPayload = useCallback(async (payload) => {
        if (!canManageTrips) {
            notify('Only admins can reconcile trips', 'warning', 3000);
            return;
        }

        try {
            setIsTripCommandBusy(true);
            const result = await reconcileVehicleTrips({
                vehicleId: payload?.vehicleId,
                fromUtc: payload?.fromUtc,
                toUtc: payload?.toUtc,
                previewOnly: false,
            });
            notify(`Reconciliation finished. ${result?.groupsUpdated || 0} groups updated and ${result?.anomalyGroups || 0} anomalies reviewed.`, 'success', 4500);
            await refreshTrips();
        } catch (error) {
            console.error('Error reconciling trip payload:', error);
            notify(error.message || 'Trip reconciliation failed', 'error', 3000);
        } finally {
            setIsTripCommandBusy(false);
        }
    }, [canManageTrips, refreshTrips]);

    const handleRecomputeSelectedVehicle = useCallback(async () => {
        if (!selectedVehicleId) {
            notify('Select a vehicle first before recomputing trip history', 'warning', 3000);
            return;
        }

        const now = new Date();
        await handleRecomputeTripPayload({
            vehicleId: selectedVehicleId,
            fromUtc: new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString(),
            toUtc: now.toISOString(),
        });
    }, [handleRecomputeTripPayload, selectedVehicleId]);

    const handleToggleVehicleTracking = useCallback((vehicleId, shouldTrack) => {
        if (!vehicleId) {
            return;
        }

        setTrackedVehicleIds((previous) => {
            const nextTrackedIds = new Set(previous);
            if (shouldTrack) {
                nextTrackedIds.add(vehicleId);
            } else {
                nextTrackedIds.delete(vehicleId);
            }
            return Array.from(nextTrackedIds);
        });
    }, []);

    const handleVehicleClick = useCallback((vehicle) => {
        setSelectedVehicle(vehicle);
        if (!vehicle?.latitude || !vehicle?.longitude) {
            return;
        }

        try {
            scrollMapIntoView();
            window.setTimeout(() => {
                focusVehicleOnMap(vehicle, null, preferredVehicleZoomLevel);
            }, 250);
        } catch (error) {
            console.error('Error handling vehicle click:', error);
        }
    }, [focusVehicleOnMap, preferredVehicleZoomLevel, scrollMapIntoView]);

    const handleFocusMapOnCoordinate = useCallback((lat, lng) => {
        scrollMapIntoView();
        window.setTimeout(() => {
            panToCoordinate(lat, lng);
        }, 250);
    }, [panToCoordinate, scrollMapIntoView]);

    const handleTrackingGridContextMenuPreparing = useCallback((event) => {
        if (event.target === 'header') {
            event.items = event.items || [];
            event.items.push({
                text: 'Choose columns',
                icon: 'columnchooser',
                onItemClick: () => trackingGridRef.current?.instance?.showColumnChooser?.(),
            });
            return;
        }

        if (event.target !== 'content' || event.row?.rowType !== 'data' || !event.row?.data) {
            return;
        }

        [
            ['Zoom to street level', 'fa-light fa-location-crosshairs', STREET_LEVEL_ZOOM],
            ['Zoom to city level', 'fa-light fa-buildings', CITY_LEVEL_ZOOM],
            ['Zoom to region level', 'fa-light fa-earth-africa', REGION_LEVEL_ZOOM],
        ].forEach(([text, icon, zoomLevel]) => {
            event.items = event.items || [];
            event.items.push({
                text,
                icon,
                onItemClick: () => {
                    setPreferredVehicleZoomLevel(zoomLevel);
                    scrollMapIntoView();
                    window.setTimeout(() => {
                        focusVehicleOnMap(event.row.data, null, zoomLevel);
                    }, 250);
                },
            });
        });
    }, [focusVehicleOnMap, scrollMapIntoView]);

    const renderStatusCell = useCallback((cell) => {
        const tone = getVehicleStatusTone(cell.data);
        const isOffline = cell.data.isOnline === false;

        return (
            <div className="vehicle-tracking-status-cell">
                <span className={`vehicle-tracking-status-cell__dot vehicle-tracking-status-cell__dot--${isOffline ? 'offline' : tone.marker}`} />
                <span className="vehicle-tracking-status-cell__text">{isOffline ? 'Offline' : cell.value}</span>
            </div>
        );
    }, []);

    const toolbarProps = useMemo(() => ({
        inProgressTripCount: inProgressTrips.length,
        lowConfidenceCount,
        onOpenTripsPage: handleOpenTripsPage,
        onTrackingViewChange: handleTrackingViewChange,
        selectedTagId,
        stats,
        tags,
    }), [handleOpenTripsPage, handleTrackingViewChange, inProgressTrips.length, lowConfidenceCount, selectedTagId, stats, tags]);

    const mapPanelProps = useMemo(() => ({
        applyClusterFilter,
        closeClusterContextMenu,
        clusterContextMenu,
        isMapLoaded,
        isMapLoading,
        mapContainerRef,
        mapSectionRef,
    }), [applyClusterFilter, closeClusterContextMenu, clusterContextMenu, isMapLoaded, isMapLoading, mapContainerRef, mapSectionRef]);

    const gridPanelProps = useMemo(() => ({
        gridDataSource: gridDataSourceRef.current,
        handleToggleVehicleTracking,
        handleTrackingGridContextMenuPreparing,
        handleVehicleClick,
        loading,
        renderStatusCell,
        selectedVehicleId: selectedVehicleGridId,
        trackedVehicles,
        trackedVehicleIds,
        trackingGridRef,
    }), [handleToggleVehicleTracking, handleTrackingGridContextMenuPreparing, handleVehicleClick, loading, renderStatusCell, selectedVehicleGridId, trackedVehicleIds, trackedVehicles]);

    const tripPanelProps = useMemo(() => ({
        canRecompute: canManageTrips,
        inProgressTrips,
        isLoading: isTripLoading,
        isTripActionLoading: isTripCommandBusy,
        lastUpdated: lastTripUpdated,
        onClose: () => setIsTripPanelOpen(false),
        onOpenTripDetail: setSelectedTripGroupId,
        onOpenTripsPage: handleOpenTripsPage,
        onRecomputeSelectedVehicle: handleRecomputeSelectedVehicle,
        onRefresh: refreshTrips,
        open: isTripPanelOpen,
        recentTrips,
        selectedVehicleId,
        selectedVehicleLabel,
    }), [
        canManageTrips,
        handleOpenTripsPage,
        handleRecomputeSelectedVehicle,
        inProgressTrips,
        isTripCommandBusy,
        isTripLoading,
        isTripPanelOpen,
        lastTripUpdated,
        recentTrips,
        refreshTrips,
        selectedVehicleId,
        selectedVehicleLabel,
    ]);

    const tripDetailPanelProps = useMemo(() => ({
        canManageTrips,
        onClose: () => setSelectedTripGroupId(null),
        onRecompute: handleRecomputeTripPayload,
        onReconcile: handleReconcileTripPayload,
        onRequestOverride: (detail) => {
            setTripDetailForOverride(detail);
            setIsTripOverridePanelOpen(true);
        },
        open: selectedTripGroupId != null,
        vehicleTripGroupId: selectedTripGroupId,
    }), [canManageTrips, handleRecomputeTripPayload, handleReconcileTripPayload, selectedTripGroupId]);

    const tripOverridePanelProps = useMemo(() => ({
        onClose: () => setIsTripOverridePanelOpen(false),
        onOverrideSuccess: refreshTrips,
        open: isTripOverridePanelOpen,
        tripDetail: tripDetailForOverride,
    }), [isTripOverridePanelOpen, refreshTrips, tripDetailForOverride]);

    const dockPanelData = useMemo(() => ({
        inProgressTrips,
        isTripLoading,
        lastTripUpdated,
        lowConfidenceCount,
        recentTrips,
        refreshTrips,
        selectedVehicle,
        selectedVehicleId,
        selectedVehicleLabel,
        stats,
    }), [
        inProgressTrips,
        isTripLoading,
        lastTripUpdated,
        lowConfidenceCount,
        recentTrips,
        refreshTrips,
        selectedVehicle,
        selectedVehicleId,
        selectedVehicleLabel,
        stats,
    ]);

    const handlePageContextMenu = useCallback((event) => {
        event.preventDefault();
    }, []);

    return {
        dockPanelData,
        focusMapOnCoordinate: handleFocusMapOnCoordinate,
        geofenceDialogProps: geofenceManager.geofenceDialogProps,
        geofenceFormProps: geofenceManager.geofenceFormProps,
        geofenceWorkspaceProps: geofenceManager.geofenceWorkspaceProps,
        gridPanelProps,
        handlePageContextMenu,
        isTrackingGeofenceLoading: geofenceManager.isTrackingGeofenceLoading,
        loadPanelVisible: loading || isTripCommandBusy,
        mapPanelProps,
        mapRef,
        toolbarProps,
        tripDetailPanelProps,
        tripOverridePanelProps,
        tripPanelProps,
    };
};

export default useVehicleTrackingPageController;
