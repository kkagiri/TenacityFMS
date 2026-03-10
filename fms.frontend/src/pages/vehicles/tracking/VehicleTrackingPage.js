/**
 * File: VehicleTrackingPage.js
 * Purpose: Coordinates vehicle tracking state, preferences, filtering, and workspace composition for the tracking module
 * Dependencies: React, DevExtreme controls, axiosInstance, vehicleTrackingSignalRService, useVehicleTrackingMap
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - fetchTags(): Loads available GPS tracking tags and resolves the preferred starting view
 * - fetchVehiclesByTag(): Loads and normalizes tracked vehicles for the selected view
 * - handleTrackingGridContextMenuPreparing(): Adds map zoom shortcuts and column chooser actions to the grid
 * - handleVehicleClick(): Selects a vehicle and focuses it on the map
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoadPanel } from 'devextreme-react/load-panel';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import axiosInstance from '../../../api/axiosInstance';
import notify from 'devextreme/ui/notify';
import { useTheme } from '../../../contexts/themeContext';
import vehicleTrackingSignalRService from '../../../signalR/vehicleTrackingSignalRService';
import VehicleTrackingWorkspaceLayout from './VehicleTrackingWorkspaceLayout';
import vehicleTrackingPreferencesService from './vehicleTrackingPreferencesService';
import { VehicleTrackingMapPanel, VehicleTrackingSidebarPanel } from './components/VehicleTrackingPanels';
import useVehicleTrackingMap from './hooks/useVehicleTrackingMap';
import useVehicleTrackingRealtime from './hooks/useVehicleTrackingRealtime';
import { ConnectionState } from '../../../signalR/vehicleTrackingSignalRService';
import {
  CITY_LEVEL_ZOOM,
  DEFAULT_TRACKING_VIEW_NAME,
  FOCUSED_VEHICLE_ZOOM_LEVEL,
  REGION_LEVEL_ZOOM,
  STREET_LEVEL_ZOOM,
  formatTrackingTimestamp,
  getVehicleCode,
  getVehicleDriverName,
  getVehicleEngineHours,
  getVehicleHeading,
  getVehicleOperationalStatus,
  getVehicleSpeed,
  getVehicleStatusSortValue,
  getVehicleStatusTone,
  normalizeVehicle,
  resolveInitialTrackingView,
  saveTrackingViewPreference,
} from './utils/vehicleTrackingHelpers';
import './VehicleTrackingPage.scss';

const TAGS_CACHE_TTL_MS = 5 * 60 * 1000;
const VEHICLE_SNAPSHOT_CACHE_TTL_MS = 4000;

let tagsRequestCache = {
  data: null,
  expiresAt: 0,
  promise: null,
};

const vehicleSnapshotRequestCache = new Map();

const cloneVehicleCollection = (collection = []) => collection.map((item) => ({ ...item }));

const fetchTrackingTagsSnapshot = async () => {
  if (tagsRequestCache.data && Date.now() < tagsRequestCache.expiresAt) {
    return cloneVehicleCollection(tagsRequestCache.data);
  }

  if (tagsRequestCache.promise) {
    const cachedTags = await tagsRequestCache.promise;
    return cloneVehicleCollection(cachedTags);
  }

  tagsRequestCache.promise = axiosInstance.get('/vehicletracking/tags')
    .then((response) => {
      if (!response.data?.isSuccess) {
        throw new Error(response.data?.message || 'Failed to fetch vehicle views');
      }

      const tags = response.data.data || [];
      tagsRequestCache = {
        data: cloneVehicleCollection(tags),
        expiresAt: Date.now() + TAGS_CACHE_TTL_MS,
        promise: null,
      };

      return cloneVehicleCollection(tags);
    })
    .catch((error) => {
      tagsRequestCache.promise = null;
      throw error;
    });

  const cachedTags = await tagsRequestCache.promise;
  return cloneVehicleCollection(cachedTags);
};

const fetchVehiclesByTagSnapshot = async (tagId) => {
  const cacheKey = String(tagId);
  const cachedEntry = vehicleSnapshotRequestCache.get(cacheKey);

  if (cachedEntry?.data && Date.now() < cachedEntry.expiresAt) {
    return cloneVehicleCollection(cachedEntry.data);
  }

  if (cachedEntry?.promise) {
    const cachedVehicles = await cachedEntry.promise;
    return cloneVehicleCollection(cachedVehicles);
  }

  const requestPromise = axiosInstance.get(`/vehicletracking/tags/${tagId}/vehicles`)
    .then((response) => {
      if (!response.data?.isSuccess) {
        throw new Error(response.data?.message || 'Failed to fetch vehicles');
      }

      const vehicles = (response.data.data || []).map(normalizeVehicle);
      vehicleSnapshotRequestCache.set(cacheKey, {
        data: cloneVehicleCollection(vehicles),
        expiresAt: Date.now() + VEHICLE_SNAPSHOT_CACHE_TTL_MS,
        promise: null,
      });

      return cloneVehicleCollection(vehicles);
    })
    .catch((error) => {
      const latestEntry = vehicleSnapshotRequestCache.get(cacheKey);
      if (latestEntry?.promise === requestPromise) {
        vehicleSnapshotRequestCache.delete(cacheKey);
      }

      throw error;
    });

  vehicleSnapshotRequestCache.set(cacheKey, {
    data: cachedEntry?.data || null,
    expiresAt: cachedEntry?.expiresAt || 0,
    promise: requestPromise,
  });

  const cachedVehicles = await requestPromise;
  return cloneVehicleCollection(cachedVehicles);
};

const VehicleTrackingPage = () => {
  const { resolvedTheme } = useTheme();
  const isDarkTheme = resolvedTheme === 'dark';
  const trackingGridRef = useRef(null);
  const trackingPreferencesSaveTimeoutRef = useRef(null);
  const lastVehicleFetchRef = useRef({ tagId: null, timestamp: 0 });
  const previousRealtimeConnectionStateRef = useRef(ConnectionState.DISCONNECTED);
  const gridRowCacheRef = useRef(new Map());
  const gridStoreRef = useRef(new ArrayStore({ key: 'id', data: [] }));
  const gridDataSourceRef = useRef(new DataSource({
    store: gridStoreRef.current,
    reshapeOnPush: true,
  }));
  const gridSnapshotRef = useRef(new Map());
  const [tags, setTags] = useState([]);
  const [selectedTagId, setSelectedTagId] = useState(null);
  const [vehicles, setVehicles] = useState([]);
  const [trackingPreferences, setTrackingPreferences] = useState({
    selectedView: null,
    workspaceLayout: null,
  });
  const [isTrackingPreferencesLoaded, setIsTrackingPreferencesLoaded] = useState(false);
  const [clusterFilteredVehicleIds, setClusterFilteredVehicleIds] = useState(null);
  const [searchText, setSearchText] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [preferredVehicleZoomLevel, setPreferredVehicleZoomLevel] = useState(FOCUSED_VEHICLE_ZOOM_LEVEL);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [lastRefresh, setLastRefresh] = useState(null);
  const [isDebugPopupVisible, setIsDebugPopupVisible] = useState(false);
  const [debugConnectionInfo, setDebugConnectionInfo] = useState(() => vehicleTrackingSignalRService.getConnectionInfo());
  const [debugEvents, setDebugEvents] = useState(() => vehicleTrackingSignalRService.getRecentEvents());
  const filteredVehicles = useMemo(() => {
    const searchLower = searchText.trim().toLowerCase();

    return vehicles.filter((vehicle) => {
      const operationalStatus = getVehicleOperationalStatus(vehicle);
      const matchesStatus = statusFilter === 'all'
        ? true
        : statusFilter === 'Offline'
          ? vehicle.isOnline === false
          : operationalStatus === statusFilter;

      if (!matchesStatus) {
        return false;
      }

      if (!searchLower) {
        return true;
      }

      return [
        vehicle.name,
        vehicle.description,
        vehicle.hyoungNo,
        vehicle.numberPlate,
        vehicle.plateNumber,
        vehicle.address,
        vehicle.siteName,
        vehicle.id,
        getVehicleDriverName(vehicle),
        operationalStatus,
      ].some((value) => value?.toString().toLowerCase().includes(searchLower));
    });
  }, [searchText, statusFilter, vehicles]);

  const {
    clusterContextMenu,
    closeClusterContextMenu,
    focusVehicleOnMap,
    isMapLoaded,
    isMapLoading,
    mapContainerRef,
    mapSectionRef,
    resetMapBounds,
    scrollMapIntoView,
  } = useVehicleTrackingMap({
    filteredVehicles,
    selectedVehicle,
    setSelectedVehicle,
    preferredVehicleZoomLevel,
    isDarkTheme,
  });

  const { connectionState } = useVehicleTrackingRealtime({
    selectedVehicleId: selectedVehicle?.id || null,
    setVehicles,
    setSelectedVehicle,
    setLastRefresh,
  });

  const clearClusterFilter = useCallback(() => {
    setClusterFilteredVehicleIds(null);
  }, []);

  const applyClusterFilter = useCallback((vehicleIds = []) => {
    if (!Array.isArray(vehicleIds) || vehicleIds.length === 0) {
      return;
    }

    setClusterFilteredVehicleIds(vehicleIds);
    closeClusterContextMenu();
  }, [closeClusterContextMenu]);

  const handleWorkspacePreferenceChange = useCallback((workspaceLayout) => {
    setTrackingPreferences((previous) => {
      const previousLayout = previous?.workspaceLayout;
      const nextHorizontal = workspaceLayout?.splitByAxis?.horizontal;
      const nextVertical = workspaceLayout?.splitByAxis?.vertical;

      if (
        previousLayout?.layoutMode === workspaceLayout?.layoutMode
        && previousLayout?.splitByAxis?.horizontal === nextHorizontal
        && previousLayout?.splitByAxis?.vertical === nextVertical
      ) {
        return previous;
      }

      return {
        ...(previous || {}),
        selectedView: previous?.selectedView || null,
        workspaceLayout,
      };
    });
  }, []);

  const fetchTags = useCallback(async () => {
    try {
      const { preferences, shouldPersist } = await vehicleTrackingPreferencesService.loadPreferences();
      setTrackingPreferences(preferences);
      setIsTrackingPreferencesLoaded(true);

      const tagsData = await fetchTrackingTagsSnapshot();
      setTags(tagsData);

      if (tagsData.length > 0) {
        const initialView = resolveInitialTrackingView(tagsData, preferences?.selectedView);
        setSelectedTagId((previous) => previous || initialView?.id || tagsData[0].id);
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
    if (!tagId) {
      return;
    }

    const { force = false, silent = false } = options;

    const now = Date.now();
    if (!force && lastVehicleFetchRef.current.tagId === tagId && now - lastVehicleFetchRef.current.timestamp < 1000) {
      return;
    }

    lastVehicleFetchRef.current = { tagId, timestamp: now };

    try {
      if (!silent) {
        setLoading(true);
      }

      const vehicleData = await fetchVehiclesByTagSnapshot(tagId);
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
    if (!selectedTagId || !tags.length) {
      return;
    }

    const selectedView = tags.find((tag) => tag.id === selectedTagId);
    saveTrackingViewPreference(selectedView);
    setTrackingPreferences((previous) => {
      const nextSelectedView = selectedView
        ? { id: selectedView.id, name: selectedView.name || '' }
        : null;

      if (
        previous?.selectedView?.id === nextSelectedView?.id
        && previous?.selectedView?.name === nextSelectedView?.name
      ) {
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
    if (!selectedTagId) {
      return;
    }

    // Clear previous view's selection so realtime re-subscribes to all vehicles
    setSelectedVehicle(null);
    // Clear snapshot so the push-effect diffs against a clean baseline
    gridSnapshotRef.current = new Map();

    resetMapBounds();
    fetchVehiclesByTag(selectedTagId);
  }, [fetchVehiclesByTag, resetMapBounds, selectedTagId]);

  // On reconnect, merge API snapshot into existing state so unchanged vehicles
  // keep their object identity and only genuinely new/changed rows trigger a
  // grid push.  This avoids a full grid redraw after a brief network hiccup.
  useEffect(() => {
    const previousState = previousRealtimeConnectionStateRef.current;
    previousRealtimeConnectionStateRef.current = connectionState;

    if (
      !selectedTagId
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
          const previousMap = new Map(previousVehicles.map((v) => [v.id, v]));
          let hasChanges = false;

          const merged = freshVehicles.map((fresh) => {
            const existing = previousMap.get(fresh.id);
            if (!existing) {
              hasChanges = true;
              return fresh;
            }

            // Keep existing reference if core tracking fields haven't changed
            const isSame =
              existing.latitude === fresh.latitude
              && existing.longitude === fresh.longitude
              && existing.isOnline === fresh.isOnline
              && existing.speed === fresh.speed
              && existing.heading === fresh.heading
              && existing.address === fresh.address;

            if (isSame) {
              return existing; // same reference → no downstream recompute
            }

            hasChanges = true;
            return fresh;
          });

          // Detect removals
          if (merged.length !== previousVehicles.length) {
            hasChanges = true;
          }

          return hasChanges ? merged : previousVehicles;
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

  useEffect(() => {
    const nextSnapshot = new Map(gridVehicles.map((row) => [row.id, row]));
    const previousSnapshot = gridSnapshotRef.current;
    const changes = [];

    nextSnapshot.forEach((row, id) => {
      const previousRow = previousSnapshot.get(id);

      if (!previousRow) {
        changes.push({ type: 'insert', data: row });
        return;
      }

      if (previousRow !== row) {
        changes.push({ type: 'update', key: id, data: row });
      }
    });

    previousSnapshot.forEach((_, id) => {
      if (!nextSnapshot.has(id)) {
        changes.push({ type: 'remove', key: id });
      }
    });

    if (changes.length > 0) {
      gridStoreRef.current.push(changes);
      gridSnapshotRef.current = nextSnapshot;
    }
  }, [gridVehicles]);

  const handleRefresh = useCallback(() => {
    if (!selectedTagId) {
      return;
    }

    fetchVehiclesByTag(selectedTagId);
    notify('Refreshing vehicle locations...', 'info', 2000);
  }, [fetchVehiclesByTag, selectedTagId]);

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

    const vehicle = event.row.data;
    const zoomActions = [
      { text: 'Zoom to street level', icon: 'fa-light fa-location-crosshairs', zoomLevel: STREET_LEVEL_ZOOM },
      { text: 'Zoom to city level', icon: 'fa-light fa-buildings', zoomLevel: CITY_LEVEL_ZOOM },
      { text: 'Zoom to region level', icon: 'fa-light fa-earth-africa', zoomLevel: REGION_LEVEL_ZOOM },
    ];

    event.items = event.items || [];
    zoomActions.forEach(({ text, icon, zoomLevel }) => {
      event.items.push({
        text,
        icon,
        onItemClick: () => {
          setPreferredVehicleZoomLevel(zoomLevel);
          scrollMapIntoView();
          window.setTimeout(() => {
            focusVehicleOnMap(vehicle, null, zoomLevel);
          }, 250);
        },
      });
    });
  }, [focusVehicleOnMap, scrollMapIntoView]);

  const handleTrackingGridOptionChanged = useCallback((event) => {
    if (event.fullName === 'searchPanel.text') {
      setSearchText(event.value || '');
    }
  }, []);

  const handlePageContextMenu = useCallback((event) => {
    event.preventDefault();
  }, []);

  const refreshDebugState = useCallback(() => {
    setDebugConnectionInfo(vehicleTrackingSignalRService.getConnectionInfo());
    setDebugEvents(vehicleTrackingSignalRService.getRecentEvents());
  }, []);

  useEffect(() => {
    if (!isDebugPopupVisible) {
      return undefined;
    }

    refreshDebugState();

    const intervalId = window.setInterval(() => {
      refreshDebugState();
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [isDebugPopupVisible, refreshDebugState]);

  const handleOpenDebugPopup = useCallback(() => {
    refreshDebugState();
    setIsDebugPopupVisible(true);
  }, [refreshDebugState]);

  const handleClearDebugEvents = useCallback(() => {
    vehicleTrackingSignalRService.clearRecentEvents();
    refreshDebugState();
  }, [refreshDebugState]);

  const trafficSummary = useMemo(() => ({
    total: debugEvents.length,
    locationUpdates: debugEvents.filter((event) => event.event === 'locationUpdate').length,
    connectionStatuses: debugEvents.filter((event) => event.event === 'connectionStatus').length,
    subscriptions: debugEvents.filter((event) => event.event === 'subscriptionConfirmed').length,
  }), [debugEvents]);

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

  const vehiclePanelContent = useMemo(() => (
    <VehicleTrackingSidebarPanel
      clusterFilteredVehicleIds={clusterFilteredVehicleIds}
      clearClusterFilter={clearClusterFilter}
      filteredVehiclesCount={filteredVehicles.length}
      gridFilteredVehiclesCount={gridFilteredVehicles.length}
      gridDataSource={gridDataSourceRef.current}
      handleTrackingGridContextMenuPreparing={handleTrackingGridContextMenuPreparing}
      handleTrackingGridOptionChanged={handleTrackingGridOptionChanged}
      handleVehicleClick={handleVehicleClick}
      loading={loading}
      renderStatusCell={renderStatusCell}
      searchText={searchText}
      selectedVehicleId={selectedVehicle?.id ?? null}
      trackingGridRef={trackingGridRef}
    />
  ), [
    clearClusterFilter,
    clusterFilteredVehicleIds,
    filteredVehicles.length,
    gridFilteredVehicles.length,
    handleTrackingGridContextMenuPreparing,
    handleTrackingGridOptionChanged,
    handleVehicleClick,
    loading,
    renderStatusCell,
    searchText,
    selectedVehicle?.id,
  ]);

  const mapPanelContent = useMemo(() => (
    <VehicleTrackingMapPanel
      applyClusterFilter={applyClusterFilter}
      closeClusterContextMenu={closeClusterContextMenu}
      clusterContextMenu={clusterContextMenu}
      isMapLoaded={isMapLoaded}
      isMapLoading={isMapLoading}
      mapContainerRef={mapContainerRef}
      mapSectionRef={mapSectionRef}
    />
  ), [
    applyClusterFilter,
    closeClusterContextMenu,
    clusterContextMenu,
    isMapLoaded,
    isMapLoading,
    mapContainerRef,
    mapSectionRef,
  ]);

  return (
    <div
      className="vehicle-tracking-page tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-overflow-hidden"
      onContextMenu={handlePageContextMenu}
    >
      <LoadPanel visible={loading} />

      <div className="tw-flex tw-shrink-0 tw-items-center tw-justify-between tw-border-b tw-bg-white tw-px-4 tw-py-3">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div>
            <h2 className="tw-text-xl tw-font-bold tw-text-gray-800">
              <i className="fa-light fa-satellite tw-mr-2"></i>
              Vehicle Tracking
            </h2>
            <p className="tw-mt-1 tw-text-sm tw-text-gray-500">
              Starts from {DEFAULT_TRACKING_VIEW_NAME} and remembers your last selected view.
            </p>
          </div>
          <SelectBox
            dataSource={tags}
            displayExpr="name"
            valueExpr="id"
            value={selectedTagId}
            onValueChanged={(event) => setSelectedTagId(event.value)}
            placeholder="Select View"
            width={240}
            showClearButton={false}
          />
        </div>

        <div className="tw-flex tw-items-center tw-gap-4">
          {lastRefresh && (
            <span className="tw-text-sm tw-text-gray-500">
              Last update: {formatTrackingTimestamp(lastRefresh)}
            </span>
          )}
          <Button
            icon="fa-light fa-bug"
            text="Live Debug"
            type="normal"
            stylingMode="outlined"
            onClick={handleOpenDebugPopup}
          />
          <Button
            icon="fa-light fa-refresh"
            text="Refresh"
            type="default"
            stylingMode="outlined"
            onClick={handleRefresh}
          />
        </div>
      </div>

      <div className="tw-flex tw-shrink-0 tw-gap-6 tw-border-b tw-bg-gray-50 tw-px-4 tw-py-2">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-truck tw-text-blue-500"></i>
          <span className="tw-text-sm tw-font-medium">Total: {stats.total}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-location-arrow tw-text-green-500"></i>
          <span className="tw-text-sm tw-font-medium">Moving: {stats.moving}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-wifi tw-text-green-500"></i>
          <span className="tw-text-sm tw-font-medium">Online: {stats.online}</span>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-wifi-slash tw-text-red-500"></i>
          <span className="tw-text-sm tw-font-medium">Offline: {stats.offline}</span>
        </div>
      </div>

      <VehicleTrackingWorkspaceLayout
        initialPreference={trackingPreferences?.workspaceLayout}
        onPreferenceChange={handleWorkspacePreferenceChange}
        vehiclePanel={vehiclePanelContent}
        mapPanel={mapPanelContent}
      />

      {isDebugPopupVisible && (
        <div className="vehicle-tracking-debug-popup tw-fixed tw-inset-0 tw-z-[1200] tw-flex tw-items-center tw-justify-center tw-bg-slate-900/40 tw-p-4">
          <div className="vehicle-tracking-debug-popup__card tw-flex tw-h-full tw-max-h-[80vh] tw-w-full tw-max-w-4xl tw-flex-col tw-overflow-hidden tw-rounded-xl tw-border tw-bg-white tw-shadow-2xl">
            <div className="vehicle-tracking-debug-popup__header tw-flex tw-items-start tw-justify-between tw-gap-4 tw-border-b tw-px-5 tw-py-4">
              <div>
                <h3 className="tw-text-lg tw-font-semibold tw-text-slate-900">
                  <i className="fa-light fa-bug tw-mr-2"></i>
                  Vehicle Tracking Live Debug
                </h3>
                <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
                  SignalR connection state and recent live traffic for this page.
                </p>
              </div>
              <div className="tw-flex tw-items-center tw-gap-2">
                <Button
                  icon="fa-light fa-broom-wide"
                  text="Clear Events"
                  type="normal"
                  stylingMode="outlined"
                  onClick={handleClearDebugEvents}
                />
                <Button
                  icon="fa-light fa-xmark"
                  text="Close"
                  type="normal"
                  stylingMode="outlined"
                  onClick={() => setIsDebugPopupVisible(false)}
                />
              </div>
            </div>

            <div className="vehicle-tracking-debug-popup__body tw-grid tw-min-h-0 tw-flex-1 tw-gap-4 tw-overflow-hidden tw-p-5 lg:tw-grid-cols-[320px_minmax(0,1fr)]">
              <div className="vehicle-tracking-debug-popup__summary tw-space-y-4 tw-overflow-auto">
                <div className="vehicle-tracking-debug-popup__section tw-rounded-lg tw-border tw-p-4">
                  <div className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Connection</div>
                  <div className="tw-space-y-2 tw-text-sm">
                    <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">State</span><strong>{debugConnectionInfo.state}</strong></div>
                    <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Connected</span><strong>{debugConnectionInfo.isConnected ? 'Yes' : 'No'}</strong></div>
                    <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Transport</span><strong>{debugConnectionInfo.transport || 'Unknown'}</strong></div>
                    <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Subscribed to all</span><strong>{debugConnectionInfo.subscribedToAll ? 'Yes' : 'No'}</strong></div>
                    <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Reconnect attempts</span><strong>{debugConnectionInfo.reconnectAttempts}</strong></div>
                    <div className="tw-flex tw-justify-between"><span className="tw-text-slate-500">Selected vehicle</span><strong>{selectedVehicle?.id || '—'}</strong></div>
                  </div>
                </div>

                <div className="vehicle-tracking-debug-popup__section tw-rounded-lg tw-border tw-p-4">
                  <div className="tw-mb-3 tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Traffic Summary</div>
                  <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <div className="vehicle-tracking-debug-popup__metric tw-rounded-md tw-bg-slate-50 tw-p-3">
                      <div className="tw-text-xs tw-text-slate-500">Recent events</div>
                      <div className="tw-text-lg tw-font-semibold tw-text-slate-900">{trafficSummary.total}</div>
                    </div>
                    <div className="vehicle-tracking-debug-popup__metric tw-rounded-md tw-bg-slate-50 tw-p-3">
                      <div className="tw-text-xs tw-text-slate-500">Location updates</div>
                      <div className="tw-text-lg tw-font-semibold tw-text-slate-900">{trafficSummary.locationUpdates}</div>
                    </div>
                    <div className="vehicle-tracking-debug-popup__metric tw-rounded-md tw-bg-slate-50 tw-p-3">
                      <div className="tw-text-xs tw-text-slate-500">Status changes</div>
                      <div className="tw-text-lg tw-font-semibold tw-text-slate-900">{trafficSummary.connectionStatuses}</div>
                    </div>
                    <div className="vehicle-tracking-debug-popup__metric tw-rounded-md tw-bg-slate-50 tw-p-3">
                      <div className="tw-text-xs tw-text-slate-500">Subscriptions</div>
                      <div className="tw-text-lg tw-font-semibold tw-text-slate-900">{trafficSummary.subscriptions}</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="vehicle-tracking-debug-popup__events tw-flex tw-min-h-0 tw-flex-col tw-overflow-hidden tw-rounded-lg tw-border">
                <div className="tw-flex tw-items-center tw-justify-between tw-border-b tw-px-4 tw-py-3">
                  <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Recent SignalR Events</div>
                  <div className="tw-text-xs tw-text-slate-400">Newest first</div>
                </div>

                <div className="tw-min-h-0 tw-flex-1 tw-overflow-auto tw-bg-slate-50">
                  {debugEvents.length === 0 ? (
                    <div className="tw-flex tw-h-full tw-items-center tw-justify-center tw-p-6 tw-text-sm tw-text-slate-500">
                      No live events captured yet.
                    </div>
                  ) : (
                    <div className="tw-space-y-3 tw-p-4">
                      {debugEvents.map((event, index) => (
                        <div key={`${event.timestamp}-${event.event}-${index}`} className="vehicle-tracking-debug-popup__event tw-rounded-lg tw-border tw-bg-white tw-p-3">
                          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
                            <div className="tw-flex tw-items-center tw-gap-2">
                              <span className="vehicle-tracking-debug-popup__badge tw-inline-flex tw-rounded-full tw-bg-blue-100 tw-px-2.5 tw-py-1 tw-text-xs tw-font-semibold tw-text-blue-700">
                                {event.event}
                              </span>
                              <span className="tw-text-xs tw-text-slate-400">{formatTrackingTimestamp(event.timestamp)}</span>
                            </div>
                            {event.summary?.vehicleId && (
                              <span className="tw-text-xs tw-font-medium tw-text-slate-500">Vehicle #{event.summary.vehicleId}</span>
                            )}
                          </div>

                          <pre className="tw-mt-3 tw-overflow-x-auto tw-rounded-md tw-bg-slate-950 tw-p-3 tw-text-xs tw-leading-5 tw-text-slate-100">{JSON.stringify(event.summary, null, 2)}</pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleTrackingPage;
