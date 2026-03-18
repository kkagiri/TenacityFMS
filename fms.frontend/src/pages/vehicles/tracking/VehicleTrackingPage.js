/**
 * File: VehicleTrackingPage.js
 * Purpose: Coordinates vehicle tracking state, preferences, filtering, and workspace composition for the tracking module
 * Dependencies: React, DevExtreme controls, axiosInstance, vehicleTrackingSignalRService, useVehicleTrackingMap
 * Last Modified: 2026-03-11
 *
 * Key Functions:
 * - fetchTags(): Loads available GPS tracking tags and resolves the preferred starting view
 * - fetchVehiclesByTag(): Loads and normalizes tracked vehicles for the selected view
 * - handleTrackingGridContextMenuPreparing(): Adds map zoom shortcuts and column chooser actions to the grid
 * - handleVehicleClick(): Selects a vehicle and focuses it on the map
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LoadPanel } from 'devextreme-react/load-panel';
import ArrayStore from 'devextreme/data/array_store';
import DataSource from 'devextreme/data/data_source';
import axiosInstance from '../../../api/axiosInstance';
import notify from 'devextreme/ui/notify';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '../../../contexts/themeContext';
import vehicleTrackingPreferencesService from './vehicleTrackingPreferencesService';
import { VehicleTrackingMapPanel, VehicleTrackingSidebarPanel } from './components/workspace/VehicleTrackingPanels';
import VehicleTrackingDetailPanelContent from './components/detail/VehicleTrackingDetailPanelContent';
import VehicleTrackingGeofencePanel from './components/geofence/VehicleTrackingGeofencePanel';
import VehicleTrackingGeofenceWorkspacePanel from './components/geofence/VehicleTrackingGeofenceWorkspacePanel';
import VehicleTrackingTripPanel, { VehicleTrackingTripContent } from './components/trips/VehicleTrackingTripPanel';
import VehicleTrackingDockLayout from './components/dock/VehicleTrackingDockLayout';
import VehicleTrackingDashboardPanel from './components/dock/VehicleTrackingDashboardPanel';
import useVehicleTrackingMap from './hooks/useVehicleTrackingMap';
import useGeofencePreviewOverlay from './hooks/useGeofencePreviewOverlay';
import useVehicleTrackingRealtime from './hooks/useVehicleTrackingRealtime';
import useVehicleTrackingTrips from './hooks/useVehicleTrackingTrips';
import { usePermissions } from '../../../hooks/usePermissions';
import { ConnectionState } from '../../../signalR/vehicleTrackingSignalRService';
import VehicleTripDetailPanel from '../trips/components/VehicleTripDetailPanel';
import VehicleTripOverridePanel from '../trips/components/VehicleTripOverridePanel';
import { reconcileVehicleTrips, recomputeVehicleTrips } from '../trips/services/vehicleTripService';
import { vehicleRoutes } from '../utils/navigationHelper';
import geofenceService from '../../../api/geofenceService';
import GeofenceCreateForm from '../../../components/geofenceManagement/GeofenceCreateForm';
import { resolvePolygonPath, resolveRoutePath } from '../../../utils/geofenceOverlayUtils';
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
const normalizeTrackingTagId = (value) => (value == null || value === '' ? null : String(value));
const emptyTrackingGeofenceShape = {
  centerLatitude: null,
  centerLongitude: null,
  radiusMeters: null,
  coordinates: [],
};

const buildShapeFromGeofence = (geofence) => {
  if (!geofence) return emptyTrackingGeofenceShape;
  const type = geofence.geofenceType || 'Circle';

  if (type === 'Circle') {
    return {
      centerLatitude: geofence.centerLatitude ?? null,
      centerLongitude: geofence.centerLongitude ?? null,
      radiusMeters: geofence.radiusMeters ?? null,
      coordinates: [],
    };
  }

  const path = type === 'Polygon' ? resolvePolygonPath(geofence) : resolveRoutePath(geofence);
  const coordinates = path.map((point, index) => ({
    latitude: point.lat,
    longitude: point.lng,
    order: index,
  }));

  let centerLat = geofence.centerLatitude;
  let centerLng = geofence.centerLongitude;
  if ((centerLat == null || centerLng == null) && coordinates.length > 0) {
    centerLat = coordinates.reduce((s, c) => s + c.latitude, 0) / coordinates.length;
    centerLng = coordinates.reduce((s, c) => s + c.longitude, 0) / coordinates.length;
  }

  return {
    centerLatitude: centerLat ?? null,
    centerLongitude: centerLng ?? null,
    radiusMeters: type === 'Route' ? (geofence.radiusMeters ?? 50) : null,
    coordinates,
  };
};

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
  const [statusFilter, setStatusFilter] = useState('all');
  const [preferredVehicleZoomLevel, setPreferredVehicleZoomLevel] = useState(FOCUSED_VEHICLE_ZOOM_LEVEL);
  const [loading, setLoading] = useState(true);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [trackedVehicleIds, setTrackedVehicleIds] = useState([]);
  const [, setLastRefresh] = useState(null);
  const [isGeofencePanelOpen, setIsGeofencePanelOpen] = useState(false);
  const [trackingGeofenceGroups, setTrackingGeofenceGroups] = useState([]);
  const [trackingGeofences, setTrackingGeofences] = useState([]);
  const [isTrackingGeofenceLoading, setIsTrackingGeofenceLoading] = useState(false);
  const [isTrackingGeofenceSaving, setIsTrackingGeofenceSaving] = useState(false);
  const [isTrackingGeofenceGroupSaving, setIsTrackingGeofenceGroupSaving] = useState(false);
  const [trackingGeofenceType, setTrackingGeofenceType] = useState('Circle');
  const [trackingGeofenceShape, setTrackingGeofenceShape] = useState(emptyTrackingGeofenceShape);
  const [trackingGeofenceViewport, setTrackingGeofenceViewport] = useState(null);
  const [previewGeofence, setPreviewGeofence] = useState(null);
  const [previewColor, setPreviewColor] = useState(null);
  const [editingGeofence, setEditingGeofence] = useState(null);
  const [floatingPanels, setFloatingPanels] = useState({
    trips: false,
  });
  const [selectedTrackingGeofenceGroup, setSelectedTrackingGeofenceGroup] = useState(null);
  const [isTripPanelOpen, setIsTripPanelOpen] = useState(false);
  const [selectedTripGroupId, setSelectedTripGroupId] = useState(null);
  const [tripDetailForOverride, setTripDetailForOverride] = useState(null);
  const [isTripOverridePanelOpen, setIsTripOverridePanelOpen] = useState(false);
  const [isTripCommandBusy, setIsTripCommandBusy] = useState(false);
  const {
    inProgressTrips,
    recentTrips,
    lowConfidenceCount,
    isLoading: isTripLoading,
    lastUpdated: lastTripUpdated,
    refreshTrips,
  } = useVehicleTrackingTrips();
  const filteredVehicles = useMemo(() => {
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

      return true;
    });
  }, [statusFilter, vehicles]);

  const handleVehicleActivate = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  const resetTrackingGeofenceDraft = useCallback((viewport = null) => {
    setTrackingGeofenceType('Circle');
    setTrackingGeofenceShape(emptyTrackingGeofenceShape);
    setTrackingGeofenceViewport(viewport || null);
  }, []);

  const trackingGeofenceDrawing = useMemo(() => {
    if (isGeofencePanelOpen) {
      return {
        enabled: true,
        geofenceType: trackingGeofenceType,
        shape: trackingGeofenceShape,
        focusViewport: null,
        onShapeChange: setTrackingGeofenceShape,
      };
    }

    return null;
  }, [isGeofencePanelOpen, trackingGeofenceShape, trackingGeofenceType]);

  const {
    clusterContextMenu,
    closeClusterContextMenu,
    fitGeofenceOnMap,
    focusVehicleOnMap,
    getViewportSnapshot,
    isMapLoaded,
    isMapLoading,
    mapContainerRef,
    mapRef,
    mapSectionRef,
    resetMapBounds,
    scrollMapIntoView,
  } = useVehicleTrackingMap({
    filteredVehicles,
    geofenceDrawing: trackingGeofenceDrawing,
    onVehicleActivate: handleVehicleActivate,
    selectedVehicle,
    setSelectedVehicle,
    preferredVehicleZoomLevel,
    isDarkTheme,
  });

  useGeofencePreviewOverlay(mapRef, previewGeofence, previewColor);

  const { connectionState } = useVehicleTrackingRealtime({
    trackedVehicleIds,
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
    if (
      !force
      && normalizeTrackingTagId(lastVehicleFetchRef.current.tagId) === normalizedTagId
      && now - lastVehicleFetchRef.current.timestamp < 1000
    ) {
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
    if (normalizeTrackingTagId(selectedTagId) == null) {
      return;
    }

    const previousSnapshot = gridSnapshotRef.current;
    const previousKeys = Array.from(previousSnapshot.keys());

    if (previousKeys.length > 0) {
      gridStoreRef.current.push(previousKeys.map((id) => ({ type: 'remove', key: id })));
    }

    // Clear previous view's selection so realtime re-subscribes to all vehicles
    setSelectedVehicle(null);
    // Clear snapshot/cache so the push-effect diffs against a clean baseline
    gridSnapshotRef.current = new Map();
    gridRowCacheRef.current = new Map();
    setVehicles([]);

    resetMapBounds();
    fetchVehiclesByTag(selectedTagId, { force: true });
  }, [fetchVehiclesByTag, resetMapBounds, selectedTagId]);

  // On reconnect, merge API snapshot into existing state so unchanged vehicles
  // keep their object identity and only genuinely new/changed rows trigger a
  // grid push.  This avoids a full grid redraw after a brief network hiccup.
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

  const handleTrackingViewChange = useCallback((event) => {
    setSelectedTagId(normalizeTrackingTagId(event.target.value));
  }, []);

  const handleOpenTripsPage = useCallback(() => {
    navigate(vehicleRoutes.trips);
  }, [navigate]);

  const loadTrackingGeofenceContext = useCallback(async () => {
    setIsTrackingGeofenceLoading(true);

    try {
      const [groups, geofences] = await Promise.all([
        geofenceService.getGeofenceGroups(true),
        geofenceService.getGeofences(),
      ]);

      setTrackingGeofenceGroups(Array.isArray(groups) ? groups : []);
      setTrackingGeofences(Array.isArray(geofences) ? geofences : []);
    } catch (error) {
      console.error('Error loading tracking geofence context:', error);
      notify(error?.message || 'Failed to load geofence setup', 'error', 3000);
    } finally {
      setIsTrackingGeofenceLoading(false);
    }
  }, []);

  // Keep the selected group in sync when geofence context refreshes
  useEffect(() => {
    if (!selectedTrackingGeofenceGroup) return;
    const refreshed = trackingGeofenceGroups.find((g) => g.id === selectedTrackingGeofenceGroup.id);
    if (refreshed) {
      setSelectedTrackingGeofenceGroup(refreshed);
    }
  }, [trackingGeofenceGroups]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (trackingGeofenceGroups.length > 0 || isTrackingGeofenceLoading) {
      return;
    }

    loadTrackingGeofenceContext();
  }, [isTrackingGeofenceLoading, loadTrackingGeofenceContext, trackingGeofenceGroups.length]);

  useEffect(() => {
    if (selectedVehicle) {
      return;
    }
  }, [selectedVehicle]);

  const handleToggleFloatingPanel = useCallback((panelKey, isVisible) => {
    if (panelKey === 'trips') {
      setFloatingPanels((previous) => ({ ...previous, trips: isVisible }));
      setIsTripPanelOpen(isVisible);
    }
  }, []);

  const handleCloseGeofencePanel = useCallback(() => {
    setIsGeofencePanelOpen(false);
    setEditingGeofence(null);
    resetTrackingGeofenceDraft(null);
  }, [resetTrackingGeofenceDraft]);

  const handleOpenCreateGeofencePanel = useCallback(() => {
    setPreviewGeofence(null);
    setPreviewColor(null);
    setEditingGeofence(null);
    resetTrackingGeofenceDraft(getViewportSnapshot?.() || null);
    setIsGeofencePanelOpen(true);
  }, [getViewportSnapshot, resetTrackingGeofenceDraft]);

  const handleTrackingGroupClick = useCallback((group) => {
    setSelectedTrackingGeofenceGroup(group);
    setPreviewGeofence(null);
    setPreviewColor(null);
  }, []);

  const handleEditTrackingGroup = useCallback(async (group) => {
    const newName = window.prompt('Group name:', group.name);
    if (newName == null || !newName.trim() || newName.trim() === group.name) return;

    try {
      setIsTrackingGeofenceGroupSaving(true);
      const response = await geofenceService.updateGeofenceGroup(group.id, { ...group, name: newName.trim() });
      if (response?.isSuccess) {
        notify('Group updated', 'success', 3000);
        await loadTrackingGeofenceContext();
      } else {
        notify(response?.message || 'Failed to update group', 'error', 4000);
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to update group', 'error', 4000);
    } finally {
      setIsTrackingGeofenceGroupSaving(false);
    }
  }, [loadTrackingGeofenceContext]);

  const handleDeleteTrackingGroup = useCallback(async (group) => {
    if (!window.confirm(`Delete group "${group.name}"?`)) return;

    try {
      setIsTrackingGeofenceGroupSaving(true);
      const response = await geofenceService.deleteGeofenceGroup(group.id);
      if (response?.isSuccess) {
        notify('Group deleted', 'success', 3000);
        if (selectedTrackingGeofenceGroup?.id === group.id) {
          setSelectedTrackingGeofenceGroup(null);
        }
        await loadTrackingGeofenceContext();
      } else {
        notify(response?.message || 'Failed to delete group', 'error', 4000);
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to delete group', 'error', 4000);
    } finally {
      setIsTrackingGeofenceGroupSaving(false);
    }
  }, [loadTrackingGeofenceContext, selectedTrackingGeofenceGroup?.id]);

  const handleToggleTrackingFueling = useCallback(async (group) => {
    try {
      setIsTrackingGeofenceGroupSaving(true);
      const response = await geofenceService.updateGroupAllowedForFueling(group.id, !group.isAllowedForFueling);
      if (response?.isSuccess) {
        notify(`Fueling ${group.isAllowedForFueling ? 'disabled' : 'enabled'} for "${group.name}"`, 'success', 3000);
        await loadTrackingGeofenceContext();
      } else {
        notify(response?.message || 'Failed to update fueling setting', 'error', 4000);
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to update fueling setting', 'error', 4000);
    } finally {
      setIsTrackingGeofenceGroupSaving(false);
    }
  }, [loadTrackingGeofenceContext]);

  const handleAddTrackingGroup = useCallback(async () => {
    const name = window.prompt('New group name:');
    if (!name?.trim()) return;

    try {
      setIsTrackingGeofenceGroupSaving(true);
      const response = await geofenceService.createGeofenceGroup({ name: name.trim(), colour: '#3b82f6' });
      if (response?.isSuccess) {
        notify('Group created', 'success', 3000);
        await loadTrackingGeofenceContext();
      } else {
        notify(response?.message || 'Failed to create group', 'error', 4000);
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to create group', 'error', 4000);
    } finally {
      setIsTrackingGeofenceGroupSaving(false);
    }
  }, [loadTrackingGeofenceContext]);

  const handleChangeTrackingClassification = useCallback(async (geofence, classification) => {
    try {
      setIsTrackingGeofenceSaving(true);
      const response = await geofenceService.updateGeofenceClassification(geofence.id, classification || 'Unknown');
      if (response?.isSuccess) {
        notify(`Classification changed to ${classification}`, 'success', 3000);
        await loadTrackingGeofenceContext();
      } else {
        notify(response?.message || 'Failed to update classification', 'error', 4000);
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to update classification', 'error', 4000);
    } finally {
      setIsTrackingGeofenceSaving(false);
    }
  }, [loadTrackingGeofenceContext]);

  const handleZoomTrackingGeofence = useCallback(async (geofence, group = null) => {
    if (!geofence) {
      return;
    }

    const color = group?.colour || selectedTrackingGeofenceGroup?.colour || '#15803d';

    // If geometry data is missing, try fetching the full geofence detail
    let enriched = geofence;
    if (!geofence.geometryJson && geofence.geofenceType !== 'Circle') {
      try {
        const detail = await geofenceService.getGeofenceById(geofence.id);
        if (detail?.geometryJson) {
          enriched = { ...geofence, geometryJson: detail.geometryJson };
          // Update the cached list so subsequent clicks don't need to refetch
          setTrackingGeofences((prev) =>
            prev.map((gf) => (gf.id === geofence.id ? enriched : gf))
          );
        }
      } catch {
        // Silently fall back to center-point placeholder
      }
    }

    setPreviewGeofence(enriched);
    setPreviewColor(color);
    scrollMapIntoView?.();
  }, [selectedTrackingGeofenceGroup?.colour, scrollMapIntoView]);

  const handleDeleteTrackingGeofence = useCallback(async (geofence) => {
    if (!window.confirm(`Delete geofence "${geofence.name}"?`)) return;

    try {
      setIsTrackingGeofenceSaving(true);
      const response = await geofenceService.deleteGeofence(geofence.id);
      if (response?.isSuccess) {
        setPreviewGeofence((current) => (current && Number(current.id) === Number(geofence.id) ? null : current));
        notify('Geofence deleted', 'success', 3000);
        await loadTrackingGeofenceContext();
      } else {
        notify(response?.message || 'Failed to delete geofence', 'error', 4000);
      }
    } catch (error) {
      notify(error?.response?.data?.message || error?.message || 'Failed to delete geofence', 'error', 4000);
    } finally {
      setIsTrackingGeofenceSaving(false);
    }
  }, [loadTrackingGeofenceContext]);

  const handleEditTrackingGeofence = useCallback(async (geofence) => {
    if (!geofence) return;

    try {
      // Fetch full geofence data (includes geometry)
      let fullGeofence = geofence;
      if (!geofence.geometryJson && geofence.geofenceType !== 'Circle') {
        const detail = await geofenceService.getGeofenceById(geofence.id);
        if (detail) {
          fullGeofence = { ...geofence, ...detail };
        }
      }

      // Determine group membership from current groups data
      const groupIds = trackingGeofenceGroups
        .filter((g) => Array.isArray(g.geofences) && g.geofences.some((gf) => Number(gf.id) === Number(geofence.id)))
        .map((g) => g.id);

      const editData = { ...fullGeofence, groupIds };
      const editShape = buildShapeFromGeofence(fullGeofence);
      const editType = fullGeofence.geofenceType || 'Circle';

      setEditingGeofence(editData);
      setPreviewGeofence(null);
      setPreviewColor(null);
      setTrackingGeofenceType(editType);
      setTrackingGeofenceShape(editShape);
      setTrackingGeofenceViewport(getViewportSnapshot?.() || null);
      setIsGeofencePanelOpen(true);
    } catch (error) {
      notify(error?.message || 'Failed to load geofence for editing', 'error', 4000);
    }
  }, [trackingGeofenceGroups, getViewportSnapshot]);

  const handleCreateTrackingGeofence = useCallback(async (payload) => {
    try {
      setIsTrackingGeofenceSaving(true);
      const response = await geofenceService.createGeofence(payload);

      if (response?.isSuccess) {
        notify(response.message || 'Geofence created successfully', 'success', 3000);
        handleCloseGeofencePanel();
        await loadTrackingGeofenceContext();
        return;
      }

      notify(response?.message || 'Failed to create geofence', 'error', 4000);
    } catch (error) {
      console.error('Error creating tracking geofence:', error);
      notify(error?.response?.data?.message || error?.message || 'Failed to create geofence', 'error', 4000);
    } finally {
      setIsTrackingGeofenceSaving(false);
    }
  }, [handleCloseGeofencePanel, loadTrackingGeofenceContext]);

  const handleUpdateTrackingGeofence = useCallback(async (payload) => {
    if (!editingGeofence) return;
    try {
      setIsTrackingGeofenceSaving(true);
      const response = await geofenceService.updateGeofence(editingGeofence.id, payload);

      if (response?.isSuccess) {
        notify(response.message || 'Geofence updated successfully', 'success', 3000);
        handleCloseGeofencePanel();
        await loadTrackingGeofenceContext();
        return;
      }

      notify(response?.message || 'Failed to update geofence', 'error', 4000);
    } catch (error) {
      console.error('Error updating tracking geofence:', error);
      notify(error?.response?.data?.message || error?.message || 'Failed to update geofence', 'error', 4000);
    } finally {
      setIsTrackingGeofenceSaving(false);
    }
  }, [editingGeofence, handleCloseGeofencePanel, loadTrackingGeofenceContext]);

  const handleCreateTrackingGeofenceGroup = useCallback(async (payload) => {
    try {
      setIsTrackingGeofenceGroupSaving(true);
      const response = await geofenceService.createGeofenceGroup(payload);

      if (response?.isSuccess) {
        const refreshedGroups = await geofenceService.getGeofenceGroups(true);
        setTrackingGeofenceGroups(Array.isArray(refreshedGroups) ? refreshedGroups : []);
        notify(response.message || 'Geofence group created successfully', 'success', 3000);

        const createdGroupId = response?.data?.id || response?.data?.groupId;
        if (createdGroupId != null) {
          return (Array.isArray(refreshedGroups) ? refreshedGroups : []).find((group) => Number(group.id) === Number(createdGroupId)) || null;
        }

        return (Array.isArray(refreshedGroups) ? refreshedGroups : []).find((group) => group.name === payload.name) || null;
      }

      notify(response?.message || 'Failed to create geofence group', 'error', 4000);
      return null;
    } catch (error) {
      console.error('Error creating tracking geofence group:', error);
      notify(error?.response?.data?.message || error?.message || 'Failed to create geofence group', 'error', 4000);
      return null;
    } finally {
      setIsTrackingGeofenceGroupSaving(false);
    }
  }, []);

  const handleTrackingGeofenceTypeChange = useCallback((value) => {
    setTrackingGeofenceType(value);
    // When entering edit mode, the initialData useEffect syncs the type.
    // Skip resetting shape if the type matches the editing geofence so the
    // existing overlay stays on the map for the user to adjust.
    if (editingGeofence && value === (editingGeofence.geofenceType || 'Circle')) {
      return;
    }
    setTrackingGeofenceShape({
      ...emptyTrackingGeofenceShape,
      radiusMeters: value === 'Route' ? 50 : null,
    });
  }, [editingGeofence]);

  const handleTrackingGeofenceViewportChange = useCallback((viewport) => {
    setTrackingGeofenceViewport(viewport || getViewportSnapshot?.() || null);
  }, [getViewportSnapshot]);

  const handleTrackingGeofenceShapePreviewChange = useCallback((partialShape) => {
    setTrackingGeofenceShape((current) => ({
      ...current,
      ...partialShape,
    }));
  }, []);

  const handleRecomputeTripPayload = useCallback(async (payload) => {
    if (!canManageTrips) {
      notify('Only admins can recompute trips', 'warning', 3000);
      return;
    }

    try {
      setIsTripCommandBusy(true);
      const result = await recomputeVehicleTrips(payload);
      notify(
        `Recompute finished. ${result?.groupsCreated || 0} groups / ${result?.tripsCreated || 0} trips created.`,
        'success',
        4000,
      );
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
      notify(
        `Reconciliation finished. ${result?.groupsUpdated || 0} groups updated and ${result?.anomalyGroups || 0} anomalies reviewed.`,
        'success',
        4500,
      );
      await refreshTrips();
    } catch (error) {
      console.error('Error reconciling trip payload:', error);
      notify(error.message || 'Trip reconciliation failed', 'error', 3000);
    } finally {
      setIsTripCommandBusy(false);
    }
  }, [canManageTrips, refreshTrips]);

  const handleRecomputeSelectedVehicle = useCallback(async () => {
    const activeVehicleId = selectedVehicle?.vehicleId || selectedVehicle?.id;
    if (!activeVehicleId) {
      notify('Select a vehicle first before recomputing trip history', 'warning', 3000);
      return;
    }

    const now = new Date();
    const fromUtc = new Date(now.getTime() - (24 * 60 * 60 * 1000)).toISOString();
    await handleRecomputeTripPayload({
      vehicleId: activeVehicleId,
      fromUtc,
      toUtc: now.toISOString(),
    });
  }, [handleRecomputeTripPayload, selectedVehicle]);

  const handleToggleVehicleTracking = useCallback((vehicleId, shouldTrack) => {
    if (!vehicleId) {
      return;
    }

    setTrackedVehicleIds((previous) => {
      const normalizedVehicleId = vehicleId;
      const nextSet = new Set(previous);

      if (shouldTrack) {
        nextSet.add(normalizedVehicleId);
      } else {
        nextSet.delete(normalizedVehicleId);
      }

      return Array.from(nextSet);
    });
  }, []);

  const handleVehicleClick = useCallback((vehicle) => {
    handleVehicleActivate(vehicle);

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
  }, [focusVehicleOnMap, handleVehicleActivate, preferredVehicleZoomLevel, scrollMapIntoView]);

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

  const handlePageContextMenu = useCallback((event) => {
    event.preventDefault();
  }, []);

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

  const dockPanelContentMap = useMemo(() => ({
    map: mapPanelContent,
    vehicles: (
      <VehicleTrackingSidebarPanel
        gridDataSource={gridDataSourceRef.current}
        handleTrackingGridContextMenuPreparing={handleTrackingGridContextMenuPreparing}
        handleToggleVehicleTracking={handleToggleVehicleTracking}
        handleVehicleClick={handleVehicleClick}
        loading={loading}
        renderStatusCell={renderStatusCell}
        selectedVehicleId={selectedVehicle?.id ?? null}
        trackedVehicleIds={trackedVehicleIds}
        trackingGridRef={trackingGridRef}
      />
    ),
    geofence: (
      <VehicleTrackingGeofenceWorkspacePanel
        allGeofences={trackingGeofences}
        groups={trackingGeofenceGroups}
        loading={isTrackingGeofenceLoading}
        onAddGeofence={handleOpenCreateGeofencePanel}
        onAddGroup={handleAddTrackingGroup}
        onChangeClassification={handleChangeTrackingClassification}
        onDeleteGeofence={handleDeleteTrackingGeofence}
        onDeleteGroup={handleDeleteTrackingGroup}
        onEditGeofence={handleEditTrackingGeofence}
        onEditGroup={handleEditTrackingGroup}
        onGeofenceSelect={handleZoomTrackingGeofence}
        onToggleFueling={handleToggleTrackingFueling}
        selectedGroup={selectedTrackingGeofenceGroup}
        setSelectedGroup={handleTrackingGroupClick}
      />
    ),
    dashboard: (
      <VehicleTrackingDashboardPanel
        inProgressTripCount={inProgressTrips.length}
        lowConfidenceCount={lowConfidenceCount}
        stats={stats}
      />
    ),
    trips: (
      <VehicleTrackingTripContent
        inProgressTrips={inProgressTrips}
        recentTrips={recentTrips}
        isLoading={isTripLoading}
        lastUpdated={lastTripUpdated}
        selectedVehicleId={selectedVehicle?.vehicleId || selectedVehicle?.id || null}
        selectedVehicleLabel={selectedVehicle ? getVehicleCode(selectedVehicle) : null}
        onOpenTripDetail={(vehicleTripGroupId) => setSelectedTripGroupId(vehicleTripGroupId)}
        onRefresh={refreshTrips}
      />
    ),
    detail: (
      <div className="vehicle-tracking-panel vehicle-tracking-panel--docked vehicle-tracking-panel--open">
        <VehicleTrackingDetailPanelContent
          isDocked={true}
          vehicleId={selectedVehicle?.vehicleId || selectedVehicle?.id || null}
          vehicleSnapshot={selectedVehicle}
        />
      </div>
    ),
  }), [
    handleAddTrackingGroup,
    handleChangeTrackingClassification,
    handleDeleteTrackingGeofence,
    handleDeleteTrackingGroup,
    handleEditTrackingGeofence,
    handleEditTrackingGroup,
    handleOpenCreateGeofencePanel,
    handleToggleTrackingFueling,
    handleToggleVehicleTracking,
    handleTrackingGridContextMenuPreparing,
    handleTrackingGroupClick,
    handleVehicleClick,
    inProgressTrips,
    isTripLoading,
    isTrackingGeofenceLoading,
    lastTripUpdated,
    loading,
    lowConfidenceCount,
    mapPanelContent,
    recentTrips,
    refreshTrips,
    renderStatusCell,
    selectedTrackingGeofenceGroup,
    selectedVehicle,
    selectedVehicle?.id,
    selectedVehicle?.vehicleId,
    stats,
    trackedVehicleIds,
    trackingGeofenceGroups,
    trackingGeofences,
  ]);

  return (
    <div
      className="vehicle-tracking-page tw-flex tw-h-full tw-min-h-0 tw-flex-col tw-overflow-hidden"
      onContextMenu={handlePageContextMenu}
    >
      <LoadPanel visible={loading || isTripCommandBusy} />

      <div className="vehicle-tracking-toolbar tw-shrink-0">
        <div className="vehicle-tracking-toolbar__section vehicle-tracking-toolbar__section--selector">
          <div className="vehicle-tracking-toolbar__field-group vehicle-tracking-toolbar__field-group--floating">
            <div className="vehicle-tracking-toolbar__select-wrap">
              <select
                id="vehicle-tracking-view-selector"
                className="vehicle-tracking-toolbar__select"
                aria-label="Vehicle view"
                value={selectedTagId == null ? '' : String(selectedTagId)}
                onChange={handleTrackingViewChange}
                disabled={tags.length === 0}
              >
                {tags.length === 0 ? (
                  <option value="">Loading views...</option>
                ) : (
                  tags.map((tag) => (
                    <option key={tag.id} value={String(tag.id)}>
                      {tag.name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>

        <div className="vehicle-tracking-toolbar__section vehicle-tracking-toolbar__section--summary" aria-label="Fleet summary">
          <div className="vehicle-tracking-toolbar__metric">
            <span className="vehicle-tracking-toolbar__metric-dot vehicle-tracking-toolbar__metric-dot--blue"></span>
            <span>Total:</span>
            <strong>{stats.total}</strong>
          </div>
          <div className="vehicle-tracking-toolbar__metric">
            <span className="vehicle-tracking-toolbar__metric-dot vehicle-tracking-toolbar__metric-dot--green"></span>
            <span>Moving:</span>
            <strong>{stats.moving}</strong>
          </div>
          <div className="vehicle-tracking-toolbar__metric">
            <span className="vehicle-tracking-toolbar__metric-dot vehicle-tracking-toolbar__metric-dot--emerald"></span>
            <span>Online:</span>
            <strong>{stats.online}</strong>
          </div>
          <div className="vehicle-tracking-toolbar__metric">
            <span className="vehicle-tracking-toolbar__metric-dot vehicle-tracking-toolbar__metric-dot--red"></span>
            <span>Offline:</span>
            <strong>{stats.offline}</strong>
          </div>
          <div className="vehicle-tracking-toolbar__metric">
            <span className="vehicle-tracking-toolbar__metric-dot vehicle-tracking-toolbar__metric-dot--orange"></span>
            <span>In transit:</span>
            <strong>{inProgressTrips.length}</strong>
          </div>
          <div className="vehicle-tracking-toolbar__metric">
            <span className="vehicle-tracking-toolbar__metric-dot vehicle-tracking-toolbar__metric-dot--purple"></span>
            <span>Low confidence:</span>
            <strong>{lowConfidenceCount}</strong>
          </div>
        </div>

        <div className="vehicle-tracking-toolbar__section vehicle-tracking-toolbar__section--actions" role="toolbar" aria-label="Tracking actions">
          <div className="vehicle-tracking-toolbar__actions">
            <button
              type="button"
              className="vehicle-tracking-toolbar__action vehicle-tracking-toolbar__action--ghost"
              onClick={handleOpenTripsPage}
            >
              <i className="fa-light fa-route"></i>
              <span>Trips</span>
            </button>
          </div>

        </div>
      </div>

      <VehicleTrackingDockLayout panelContentMap={dockPanelContentMap} />

      <VehicleTrackingGeofencePanel
        open={isGeofencePanelOpen}
        onClose={handleCloseGeofencePanel}
        title={editingGeofence ? "Edit geofence" : "Create geofence"}
      >
        <div className="tw-bg-[#faf9f8] tw-p-4">
          {isTrackingGeofenceLoading ? (
            <div className="tw-rounded-lg tw-border tw-border-gray-200 tw-bg-white tw-p-6 tw-text-sm tw-text-gray-600">
              Loading geofence setup...
            </div>
          ) : (
            <GeofenceCreateForm
              geofenceGroups={trackingGeofenceGroups}
              geofences={trackingGeofences}
              initialViewport={trackingGeofenceViewport || getViewportSnapshot?.() || null}
              initialData={editingGeofence}
              saving={isTrackingGeofenceSaving}
              creatingGroup={isTrackingGeofenceGroupSaving}
              compact={true}
              hideMap={true}
              externalShape={trackingGeofenceShape}
              onCreateGroup={handleCreateTrackingGeofenceGroup}
              onGeofenceTypeChange={handleTrackingGeofenceTypeChange}
              onMapViewportChange={handleTrackingGeofenceViewportChange}
              onShapePreviewChange={handleTrackingGeofenceShapePreviewChange}
              onCancel={handleCloseGeofencePanel}
              onSubmit={editingGeofence ? handleUpdateTrackingGeofence : handleCreateTrackingGeofence}
            />
          )}
        </div>
      </VehicleTrackingGeofencePanel>

      <VehicleTrackingTripPanel
        open={isTripPanelOpen}
        onClose={() => {
          setIsTripPanelOpen(false);
          setFloatingPanels((previous) => ({
            ...previous,
            trips: false,
          }));
        }}
        inProgressTrips={inProgressTrips}
        recentTrips={recentTrips}
        isLoading={isTripLoading}
        lastUpdated={lastTripUpdated}
        selectedVehicleId={selectedVehicle?.vehicleId || selectedVehicle?.id || null}
        selectedVehicleLabel={selectedVehicle ? getVehicleCode(selectedVehicle) : null}
        canRecompute={canManageTrips}
        onOpenTripDetail={(vehicleTripGroupId) => setSelectedTripGroupId(vehicleTripGroupId)}
        onOpenTripsPage={handleOpenTripsPage}
        onRefresh={refreshTrips}
        onRecomputeSelectedVehicle={handleRecomputeSelectedVehicle}
        isTripActionLoading={isTripCommandBusy}
      />

      <VehicleTripDetailPanel
        open={selectedTripGroupId != null}
        onClose={() => setSelectedTripGroupId(null)}
        vehicleTripGroupId={selectedTripGroupId}
        canManageTrips={canManageTrips}
        onRecompute={handleRecomputeTripPayload}
        onReconcile={handleReconcileTripPayload}
        onRequestOverride={(detail) => {
          setTripDetailForOverride(detail);
          setIsTripOverridePanelOpen(true);
        }}
      />

      <VehicleTripOverridePanel
        open={isTripOverridePanelOpen}
        onClose={() => setIsTripOverridePanelOpen(false)}
        tripDetail={tripDetailForOverride}
        onOverrideSuccess={refreshTrips}
      />
    </div>
  );
};

export default VehicleTrackingPage;
