/**
 * File: useVehicleTrackingMap.js
 * Purpose: Encapsulates Google Maps loading, marker clustering, and cluster context-menu behavior for vehicle tracking
 * Dependencies: React hooks, axiosInstance, DevExtreme notify, vehicleTrackingHelpers
 * Last Modified: 2026-03-10
 *
 * Key Functions:
 * - useVehicleTrackingMap(): Manages map lifecycle and syncs map markers with filtered vehicles
 * - focusVehicleOnMap(): Focuses the selected vehicle and opens its info window
 * - scrollMapIntoView(): Scrolls the map pane into view for grid-triggered actions
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import notify from 'devextreme/ui/notify';
import axiosInstance from '../../../../api/axiosInstance';
import {
  MARKER_CLUSTER_MAX_ZOOM,
  buildClusterMarkerIcon,
  buildInfoWindowContent,
  buildVehicleMarkerIcon,
  defaultCenter,
  getVehicleMarkerLabel,
  getVehicleStatusTone,
} from '../utils/vehicleTrackingHelpers';
import { getGeofenceBounds } from '../../../../utils/geofenceOverlayUtils';

const MARKER_CLUSTERER_SCRIPT_ID = 'fms-vehicle-tracking-marker-clusterer';
const MARKER_CLUSTERER_SCRIPT_URL = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
const MARKER_CLUSTER_RADIUS = 120;
const GEOFENCE_FILL_COLOR = '#22c55e';
const GEOFENCE_STROKE_COLOR = '#15803d';
const GEOFENCE_FILL_OPACITY = 0.2;
const GEOFENCE_STROKE_OPACITY = 0.95;
const GEOFENCE_STROKE_WEIGHT = 4;

const getRouteStrokeWeight = (radiusMeters) => {
  const numericRadius = Number(radiusMeters);
  if (!Number.isFinite(numericRadius) || numericRadius <= 0) {
    return 6;
  }

  return Math.max(6, Math.min(18, Math.round(numericRadius / 12)));
};

const normalizeCoordinates = (coordinates = []) =>
  (Array.isArray(coordinates) ? coordinates : [])
    .map((coordinate, index) => ({
      latitude: Number(coordinate.latitude ?? coordinate.lat),
      longitude: Number(coordinate.longitude ?? coordinate.lng),
      order: Number.isFinite(Number(coordinate.order)) ? Number(coordinate.order) : index,
    }))
    .filter((coordinate) => Number.isFinite(coordinate.latitude) && Number.isFinite(coordinate.longitude))
    .sort((left, right) => left.order - right.order)
    .map((coordinate, index) => ({ ...coordinate, order: index }));



const computeCenter = (coordinates = []) => {
  if (!coordinates.length) {
    return null;
  }

  const totals = coordinates.reduce(
    (summary, coordinate) => ({
      latitude: summary.latitude + coordinate.latitude,
      longitude: summary.longitude + coordinate.longitude,
    }),
    { latitude: 0, longitude: 0 }
  );

  return {
    latitude: totals.latitude / coordinates.length,
    longitude: totals.longitude / coordinates.length,
  };
};

const getPathCoordinates = (path) => {
  if (!path || typeof path.getLength !== 'function') {
    return [];
  }

  return Array.from({ length: path.getLength() }, (_, index) => {
    const point = path.getAt(index);
    return {
      latitude: point.lat(),
      longitude: point.lng(),
      order: index,
    };
  });
};

const buildShapeSignature = ({ geofenceType, centerLatitude, centerLongitude, radiusMeters, coordinates }) =>
  JSON.stringify({
    geofenceType,
    centerLatitude: centerLatitude == null || centerLatitude === '' ? null : Number(centerLatitude),
    centerLongitude: centerLongitude == null || centerLongitude === '' ? null : Number(centerLongitude),
    radiusMeters: radiusMeters == null || radiusMeters === '' ? null : Number(radiusMeters),
    coordinates: normalizeCoordinates(coordinates),
  });

const resolveOverlayType = (maps, geofenceType) => {
  switch (geofenceType) {
    case 'Polygon':
      return maps.drawing.OverlayType.POLYGON;
    case 'Route':
      return maps.drawing.OverlayType.POLYLINE;
    case 'Circle':
    default:
      return maps.drawing.OverlayType.CIRCLE;
  }
};

const hasFiniteCoordinate = (value) => Number.isFinite(Number(value));

const buildViewportBounds = (maps, viewport) => {
  const bounds = viewport?.bounds;
  if (!maps || !bounds) {
    return null;
  }

  const { north, east, south, west } = bounds;
  if (![north, east, south, west].every(hasFiniteCoordinate)) {
    return null;
  }

  return new maps.LatLngBounds(
    new maps.LatLng(Number(south), Number(west)),
    new maps.LatLng(Number(north), Number(east))
  );
};

export default function useVehicleTrackingMap({
  filteredVehicles,
  geofenceDrawing = null,
  onVehicleActivate,
  selectedVehicle,
  setSelectedVehicle,
  preferredVehicleZoomLevel,
  isDarkTheme,
}) {
  const [mapApiKey, setMapApiKey] = useState(null);
  const [isMapLoaded, setIsMapLoaded] = useState(false);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const [isMarkerClustererLoaded, setIsMarkerClustererLoaded] = useState(Boolean(window.markerClusterer?.MarkerClusterer));
  const [clusterContextMenu, setClusterContextMenu] = useState(null);
  const mapRef = useRef(null);
  const mapSectionRef = useRef(null);
  const mapContainerRef = useRef(null);
  const markersRef = useRef([]);
  const markerLookupRef = useRef(new Map());
  const infoWindowRef = useRef(null);
  const markerClustererRef = useRef(null);
  const geofenceDrawingManagerRef = useRef(null);
  const geofenceOverlayRef = useRef(null);
  const geofenceOverlayListenersRef = useRef([]);
  const geofenceDrawingListenerRef = useRef(null);
  const geofenceShapeSignatureRef = useRef('');
  const initialBoundsFitRef = useRef(false);
  const prevVehicleIdsRef = useRef('');

  const closeClusterContextMenu = useCallback(() => {
    setClusterContextMenu(null);
  }, []);

  const loadMapApiKey = useCallback(async () => {
    try {
      const response = await axiosInstance.get('/SystemConfiguration/by-key/GoogleMaps.ApiKey');
      if (response.data && (response.data.success || response.data.isSuccess) && response.data.data) {
        setMapApiKey(response.data.data.configurationValue);
        return;
      }

      console.error('Failed to load Google Maps API key from configuration');
      notify('Failed to load map configuration', 'warning', 3000);
    } catch (error) {
      console.error('Error loading Google Maps API key:', error);
      notify('Error loading map configuration', 'warning', 3000);
    }
  }, []);

  const loadGoogleMapsScript = useCallback(() => {
    if (!mapApiKey) {
      return;
    }

    if (window.google?.maps) {
      setIsMapLoaded(true);
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      existingScript.addEventListener('load', () => {
        setIsMapLoaded(true);
        setIsMapLoading(false);
      });
      return;
    }

    setIsMapLoading(true);
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places,marker,drawing,geometry`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsMapLoaded(true);
      setIsMapLoading(false);
    };
    script.onerror = () => {
      setIsMapLoading(false);
      console.error('Failed to load Google Maps script');
      notify('Failed to load Google Maps', 'error', 3000);
    };
    document.head.appendChild(script);
  }, [mapApiKey]);

  const loadMarkerClustererScript = useCallback(() => {
    if (window.markerClusterer?.MarkerClusterer) {
      setIsMarkerClustererLoaded(true);
      return;
    }

    const existingScript = document.getElementById(MARKER_CLUSTERER_SCRIPT_ID);
    if (existingScript) {
      existingScript.addEventListener('load', () => setIsMarkerClustererLoaded(true));
      return;
    }

    const script = document.createElement('script');
    script.id = MARKER_CLUSTERER_SCRIPT_ID;
    script.src = MARKER_CLUSTERER_SCRIPT_URL;
    script.async = true;
    script.onload = () => setIsMarkerClustererLoaded(true);
    script.onerror = () => {
      console.warn('[VehicleTracking] Failed to load marker clusterer script. Falling back to plain markers.');
      setIsMarkerClustererLoaded(false);
    };
    document.head.appendChild(script);
  }, []);

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google?.maps || mapRef.current) {
      return;
    }

    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
      center: defaultCenter,
      zoom: 10,
      mapTypeId: 'roadmap',
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    infoWindowRef.current = new window.google.maps.InfoWindow({ disableAutoPan: true });
  }, []);

  const clearGeofenceOverlayListeners = useCallback(() => {
    if (!window.google?.maps?.event) {
      geofenceOverlayListenersRef.current = [];
      return;
    }

    geofenceOverlayListenersRef.current.forEach((listener) => window.google.maps.event.removeListener(listener));
    geofenceOverlayListenersRef.current = [];
  }, []);

  const clearGeofenceOverlay = useCallback(() => {
    clearGeofenceOverlayListeners();
    geofenceShapeSignatureRef.current = '';

    if (geofenceOverlayRef.current) {
      geofenceOverlayRef.current.setMap(null);
      geofenceOverlayRef.current = null;
    }
  }, [clearGeofenceOverlayListeners]);

  const fitOverlayToMap = useCallback((overlay, currentType) => {
    if (!overlay || !mapRef.current || !window.google?.maps) {
      return;
    }

    if (currentType === 'Circle' && typeof overlay.getBounds === 'function') {
      const bounds = overlay.getBounds();
      if (bounds) {
        mapRef.current.fitBounds(bounds, 80);
      }
      return;
    }

    const coordinates = getPathCoordinates(overlay.getPath?.());
    if (!coordinates.length) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    coordinates.forEach((coordinate) => bounds.extend(new window.google.maps.LatLng(coordinate.latitude, coordinate.longitude)));
    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, 80);
    }
  }, []);

  const emitGeofenceShapeChange = useCallback((overlay, currentType) => {
    if (!overlay || typeof geofenceDrawing?.onShapeChange !== 'function') {
      return;
    }

    if (currentType === 'Circle') {
      const center = overlay.getCenter?.();
      const nextShape = {
        centerLatitude: center?.lat() ?? null,
        centerLongitude: center?.lng() ?? null,
        radiusMeters: overlay.getRadius?.() ? Math.round(overlay.getRadius()) : null,
        coordinates: [],
      };

      geofenceShapeSignatureRef.current = buildShapeSignature({ geofenceType: currentType, ...nextShape });
      geofenceDrawing.onShapeChange(nextShape);
      return;
    }

    const coordinates = getPathCoordinates(overlay.getPath?.());
    const center = computeCenter(coordinates);
    const nextShape = {
      centerLatitude: center?.latitude ?? null,
      centerLongitude: center?.longitude ?? null,
      coordinates,
      ...(currentType === 'Polygon' ? { radiusMeters: null } : {}),
    };

    geofenceShapeSignatureRef.current = buildShapeSignature({
      geofenceType: currentType,
      ...nextShape,
      radiusMeters: currentType === 'Route' ? geofenceDrawing?.shape?.radiusMeters : null,
    });
    geofenceDrawing.onShapeChange(nextShape);
  }, [geofenceDrawing]);

  const attachGeofenceOverlayListeners = useCallback((overlay, currentType) => {
    if (!overlay || !window.google?.maps?.event) {
      return;
    }

    clearGeofenceOverlayListeners();

    const register = (target, eventName, handler) => {
      geofenceOverlayListenersRef.current.push(window.google.maps.event.addListener(target, eventName, handler));
    };

    if (currentType === 'Circle') {
      register(overlay, 'center_changed', () => emitGeofenceShapeChange(overlay, currentType));
      register(overlay, 'radius_changed', () => emitGeofenceShapeChange(overlay, currentType));
      register(overlay, 'dragend', () => emitGeofenceShapeChange(overlay, currentType));
      return;
    }

    const path = overlay.getPath?.();
    if (path) {
      register(path, 'insert_at', () => emitGeofenceShapeChange(overlay, currentType));
      register(path, 'remove_at', () => emitGeofenceShapeChange(overlay, currentType));
      register(path, 'set_at', () => emitGeofenceShapeChange(overlay, currentType));
    }

    register(overlay, 'dragend', () => emitGeofenceShapeChange(overlay, currentType));
    register(overlay, 'mouseup', () => emitGeofenceShapeChange(overlay, currentType));
  }, [clearGeofenceOverlayListeners, emitGeofenceShapeChange]);

  const syncGeofenceDrawingMode = useCallback((nextType = null) => {
    if (!geofenceDrawingManagerRef.current || !window.google?.maps?.drawing) {
      return;
    }

    const activeType = nextType || geofenceDrawing?.geofenceType || 'Circle';
    geofenceDrawingManagerRef.current.setDrawingMode(
      geofenceOverlayRef.current ? null : resolveOverlayType(window.google.maps, activeType)
    );
  }, [geofenceDrawing?.geofenceType]);

  const rebuildGeofenceOverlayFromState = useCallback(() => {
    if (!mapRef.current || !window.google?.maps || !geofenceDrawing?.enabled) {
      return;
    }

    clearGeofenceOverlay();

    const geofenceType = geofenceDrawing.geofenceType || 'Circle';
    const shape = geofenceDrawing.shape || {};
    const normalizedCoordinates = normalizeCoordinates(shape.coordinates);

    if (geofenceType === 'Circle') {
      if (!hasFiniteCoordinate(shape.centerLatitude) || !hasFiniteCoordinate(shape.centerLongitude) || Number(shape.radiusMeters) <= 0) {
        syncGeofenceDrawingMode(geofenceType);
        return;
      }

      const circle = new window.google.maps.Circle({
        map: mapRef.current,
        center: { lat: Number(shape.centerLatitude), lng: Number(shape.centerLongitude) },
        radius: Number(shape.radiusMeters),
        editable: true,
        draggable: true,
        fillColor: GEOFENCE_FILL_COLOR,
        fillOpacity: GEOFENCE_FILL_OPACITY,
        strokeColor: GEOFENCE_STROKE_COLOR,
        strokeOpacity: GEOFENCE_STROKE_OPACITY,
        strokeWeight: GEOFENCE_STROKE_WEIGHT,
      });

      geofenceOverlayRef.current = circle;
      attachGeofenceOverlayListeners(circle, 'Circle');
      fitOverlayToMap(circle, 'Circle');
      syncGeofenceDrawingMode('Circle');
      return;
    }

    if (geofenceType === 'Polygon' && normalizedCoordinates.length >= 3) {
      const polygon = new window.google.maps.Polygon({
        map: mapRef.current,
        paths: normalizedCoordinates.map((coordinate) => ({ lat: coordinate.latitude, lng: coordinate.longitude })),
        editable: true,
        draggable: true,
        fillColor: GEOFENCE_FILL_COLOR,
        fillOpacity: GEOFENCE_FILL_OPACITY,
        strokeColor: GEOFENCE_STROKE_COLOR,
        strokeOpacity: GEOFENCE_STROKE_OPACITY,
        strokeWeight: GEOFENCE_STROKE_WEIGHT,
      });

      geofenceOverlayRef.current = polygon;
      attachGeofenceOverlayListeners(polygon, 'Polygon');
      fitOverlayToMap(polygon, 'Polygon');
      syncGeofenceDrawingMode('Polygon');
      return;
    }

    if (geofenceType === 'Route' && normalizedCoordinates.length >= 2) {
      const route = new window.google.maps.Polyline({
        map: mapRef.current,
        path: normalizedCoordinates.map((coordinate) => ({ lat: coordinate.latitude, lng: coordinate.longitude })),
        editable: true,
        draggable: true,
        strokeColor: GEOFENCE_STROKE_COLOR,
        strokeOpacity: GEOFENCE_STROKE_OPACITY,
        strokeWeight: getRouteStrokeWeight(shape.radiusMeters),
      });

      geofenceOverlayRef.current = route;
      attachGeofenceOverlayListeners(route, 'Route');
      fitOverlayToMap(route, 'Route');
      syncGeofenceDrawingMode('Route');
      return;
    }

    syncGeofenceDrawingMode(geofenceType);
  }, [attachGeofenceOverlayListeners, clearGeofenceOverlay, fitOverlayToMap, geofenceDrawing, syncGeofenceDrawingMode]);

  const focusVehicleOnMap = useCallback((vehicle, markerInstance = null, zoomLevel, preserveHigherZoom = false) => {
    if (!mapRef.current || !window.google || !vehicle?.latitude || !vehicle?.longitude) {
      return;
    }

    const marker = markerInstance || markerLookupRef.current.get(vehicle.id);
    const position = new window.google.maps.LatLng(vehicle.latitude, vehicle.longitude);
    const currentZoom = typeof mapRef.current.getZoom === 'function' ? mapRef.current.getZoom() : 10;
    const targetZoom = preserveHigherZoom && currentZoom > zoomLevel ? currentZoom : zoomLevel;

    if (currentZoom !== targetZoom) {
      mapRef.current.setZoom(targetZoom);
    }

    if (infoWindowRef.current) {
      infoWindowRef.current.setContent(buildInfoWindowContent(vehicle, isDarkTheme));

      if (marker) {
        infoWindowRef.current.open({ anchor: marker, map: mapRef.current, shouldFocus: false });
      } else {
        infoWindowRef.current.setPosition(position);
        infoWindowRef.current.open({ map: mapRef.current, shouldFocus: false });
      }
    }

    mapRef.current.panTo(position);
    window.google.maps.event.addListenerOnce(mapRef.current, 'idle', () => {
      mapRef.current.panBy(0, 120);
    });
  }, [isDarkTheme]);

  const fitGeofenceOnMap = useCallback((geofence) => {
    if (!mapRef.current || !window.google?.maps || !geofence) {
      return;
    }

    const bounds = getGeofenceBounds(geofence);
    if (!bounds) {
      return;
    }

    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
      mapRef.current.panTo(bounds.getCenter());
      if (typeof mapRef.current.getZoom === 'function' && (mapRef.current.getZoom() ?? 0) < 15) {
        mapRef.current.setZoom(15);
      }
      return;
    }

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 80 });
    }
  }, []);

  const scrollMapIntoView = useCallback(() => {
    if (!mapSectionRef.current) {
      return;
    }

    mapSectionRef.current.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
      inline: 'nearest',
    });
  }, []);

  const zoomToCluster = useCallback((clusterMarkers = []) => {
    if (!mapRef.current || !window.google || !clusterMarkers.length) {
      return;
    }

    const bounds = new window.google.maps.LatLngBounds();
    clusterMarkers.forEach((marker) => {
      const position = marker?.getPosition?.();
      if (position) {
        bounds.extend(position);
      }
    });

    if (!bounds.isEmpty()) {
      mapRef.current.fitBounds(bounds, { padding: 80 });
    }
  }, []);

  const openClusterContextMenu = useCallback((clusterMarkers = [], domEvent = null) => {
    if (!mapSectionRef.current) {
      return;
    }

    const vehicleIds = clusterMarkers
      .map((marker) => marker?.fmsVehicleId)
      .filter((vehicleId) => vehicleId != null);

    if (!vehicleIds.length) {
      return;
    }

    const containerRect = mapSectionRef.current.getBoundingClientRect();
    const clientX = domEvent?.clientX ?? containerRect.left + (containerRect.width / 2);
    const clientY = domEvent?.clientY ?? containerRect.top + (containerRect.height / 2);

    setClusterContextMenu({
      x: Math.max(12, clientX - containerRect.left),
      y: Math.max(12, clientY - containerRect.top),
      vehicleIds,
      count: vehicleIds.length,
    });
  }, []);

  const createClusterRenderer = useCallback(() => ({
    render: ({ count, position, markers: clusterMarkers = [] }) => {
      const clusterMarker = new window.google.maps.Marker({
        position,
        icon: buildClusterMarkerIcon(count, isDarkTheme),
        title: `${count} vehicles`,
        zIndex: Number(window.google.maps.Marker.MAX_ZINDEX) + count,
      });

      clusterMarker.addListener('click', () => {
        closeClusterContextMenu();
        zoomToCluster(clusterMarkers);
      });

      clusterMarker.addListener('rightclick', (event) => {
        event?.domEvent?.preventDefault?.();
        openClusterContextMenu(clusterMarkers, event?.domEvent);
      });

      return clusterMarker;
    },
  }), [closeClusterContextMenu, isDarkTheme, openClusterContextMenu, zoomToCluster]);

  const updateMarkers = useCallback(() => {
    if (!mapRef.current || !window.google) {
      return;
    }

    closeClusterContextMenu();
    const vehiclesWithPosition = filteredVehicles.filter((vehicle) => vehicle.latitude != null && vehicle.longitude != null);
    const currentIds = vehiclesWithPosition.map((vehicle) => vehicle.id).sort().join(',');
    const vehicleSetChanged = currentIds !== prevVehicleIdsRef.current;
    prevVehicleIdsRef.current = currentIds;

    const nextVehicleIds = new Set(vehiclesWithPosition.map((vehicle) => vehicle.id));
    const previousMarkers = markerLookupRef.current;
    const removedMarkers = [];

    previousMarkers.forEach((marker, vehicleId) => {
      if (!nextVehicleIds.has(vehicleId)) {
        removedMarkers.push(marker);
        previousMarkers.delete(vehicleId);
      }
    });

    if (removedMarkers.length > 0) {
      if (markerClustererRef.current?.removeMarkers) {
        markerClustererRef.current.removeMarkers(removedMarkers, true);
      }

      removedMarkers.forEach((marker) => marker.setMap(null));
    }

    const addedMarkers = [];

    vehiclesWithPosition.forEach((vehicle) => {
      const statusTone = getVehicleStatusTone(vehicle);
      const isSelected = selectedVehicle?.id === vehicle.id;
      const existingMarker = previousMarkers.get(vehicle.id);

      if (existingMarker) {
        existingMarker.setPosition({ lat: vehicle.latitude, lng: vehicle.longitude });
        existingMarker.setTitle(vehicle.name || 'Unknown');
        existingMarker.setIcon(buildVehicleMarkerIcon(statusTone.marker, isSelected));
        existingMarker.setLabel({
          text: getVehicleMarkerLabel(vehicle),
          className: `vehicle-tracking-map-label${isSelected ? ' vehicle-tracking-map-label--selected' : ''}`,
        });
        existingMarker.setZIndex(isSelected ? 1000 : undefined);
        existingMarker.fmsVehicleData = vehicle;
        return;
      }

      const marker = new window.google.maps.Marker({
        position: { lat: vehicle.latitude, lng: vehicle.longitude },
        title: vehicle.name || 'Unknown',
        icon: buildVehicleMarkerIcon(statusTone.marker, isSelected),
        label: {
          text: getVehicleMarkerLabel(vehicle),
          className: `vehicle-tracking-map-label${isSelected ? ' vehicle-tracking-map-label--selected' : ''}`,
        },
        optimized: false,
        zIndex: isSelected ? 1000 : undefined,
      });

      marker.fmsVehicleId = vehicle.id;
      marker.fmsVehicleData = vehicle;
      marker.addListener('click', () => {
        const latestVehicle = marker.fmsVehicleData || vehicle;
        setSelectedVehicle(latestVehicle);
        onVehicleActivate?.(latestVehicle);
        focusVehicleOnMap(latestVehicle, marker, preferredVehicleZoomLevel, true);
      });

      previousMarkers.set(vehicle.id, marker);
      addedMarkers.push(marker);
    });

    const markers = Array.from(previousMarkers.values());
    markersRef.current = markers;

    if (isMarkerClustererLoaded && window.markerClusterer?.MarkerClusterer && markers.length > 1) {
      const { MarkerClusterer, SuperClusterAlgorithm } = window.markerClusterer;

      if (!markerClustererRef.current) {
        markerClustererRef.current = new MarkerClusterer({
          map: mapRef.current,
          markers,
          algorithm: SuperClusterAlgorithm
            ? new SuperClusterAlgorithm({
              radius: MARKER_CLUSTER_RADIUS,
              maxZoom: MARKER_CLUSTER_MAX_ZOOM,
            })
            : undefined,
          renderer: createClusterRenderer(),
        });
      } else {
        if (addedMarkers.length > 0 && markerClustererRef.current.addMarkers) {
          markerClustererRef.current.addMarkers(addedMarkers, true);
        }

        markerClustererRef.current.render?.();
      }
    } else {
      if (markerClustererRef.current) {
        markerClustererRef.current.clearMarkers();
        markerClustererRef.current.setMap(null);
        markerClustererRef.current = null;
      }

      markers.forEach((marker) => {
        if (!marker.getMap()) {
          marker.setMap(mapRef.current);
        }
      });
    }

    if (selectedVehicle?.id && infoWindowRef.current) {
      const selectedMarker = markerLookupRef.current.get(selectedVehicle.id);
      const selectedVehicleStillVisible = vehiclesWithPosition.find((vehicle) => vehicle.id === selectedVehicle.id);

      if (selectedMarker && selectedVehicleStillVisible) {
        infoWindowRef.current.setContent(buildInfoWindowContent(selectedVehicleStillVisible, isDarkTheme));
        infoWindowRef.current.open({
          anchor: selectedMarker,
          map: mapRef.current,
          shouldFocus: false,
        });
      }
    }

    if (vehiclesWithPosition.length > 0 && (!initialBoundsFitRef.current || vehicleSetChanged)) {
      const bounds = new window.google.maps.LatLngBounds();
      vehiclesWithPosition.forEach((vehicle) => {
        bounds.extend({ lat: vehicle.latitude, lng: vehicle.longitude });
      });

      if (vehiclesWithPosition.length > 1) {
        mapRef.current.fitBounds(bounds, { padding: 50 });
      }

      initialBoundsFitRef.current = true;
    }
  }, [
    closeClusterContextMenu,
    filteredVehicles,
    focusVehicleOnMap,
    isMarkerClustererLoaded,
    onVehicleActivate,
    preferredVehicleZoomLevel,
    selectedVehicle?.id,
    setSelectedVehicle,
    createClusterRenderer,
  ]);

  useEffect(() => {
    loadMapApiKey();
    loadMarkerClustererScript();
  }, [loadMapApiKey, loadMarkerClustererScript]);

  useEffect(() => {
    if (mapApiKey) {
      loadGoogleMapsScript();
    }
  }, [loadGoogleMapsScript, mapApiKey]);

  useEffect(() => {
    if (isMapLoaded && mapContainerRef.current) {
      initializeMap();
    }
  }, [initializeMap, isMapLoaded]);

  useEffect(() => {
    if (isMapLoaded && mapRef.current) {
      updateMarkers();
    }
  }, [isMapLoaded, updateMarkers]);

  useEffect(() => {
    if (!geofenceDrawing?.enabled || !mapRef.current || !window.google?.maps?.drawing) {
      if (!geofenceDrawing?.enabled) {
        clearGeofenceOverlay();
      }

      if (geofenceDrawingListenerRef.current && window.google?.maps?.event) {
        window.google.maps.event.removeListener(geofenceDrawingListenerRef.current);
        geofenceDrawingListenerRef.current = null;
      }

      if (geofenceDrawingManagerRef.current) {
        geofenceDrawingManagerRef.current.setMap(null);
        geofenceDrawingManagerRef.current = null;
      }

      return undefined;
    }

    if (!geofenceDrawingManagerRef.current) {
      geofenceDrawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
        drawingControl: true,
        drawingControlOptions: {
          position: window.google.maps.ControlPosition.TOP_CENTER,
          drawingModes: [
            window.google.maps.drawing.OverlayType.CIRCLE,
            window.google.maps.drawing.OverlayType.POLYGON,
            window.google.maps.drawing.OverlayType.POLYLINE,
          ],
        },
        circleOptions: {
          editable: true,
          draggable: true,
          fillColor: GEOFENCE_FILL_COLOR,
          fillOpacity: GEOFENCE_FILL_OPACITY,
          strokeColor: GEOFENCE_STROKE_COLOR,
          strokeOpacity: GEOFENCE_STROKE_OPACITY,
          strokeWeight: GEOFENCE_STROKE_WEIGHT,
        },
        polygonOptions: {
          editable: true,
          draggable: true,
          fillColor: GEOFENCE_FILL_COLOR,
          fillOpacity: GEOFENCE_FILL_OPACITY,
          strokeColor: GEOFENCE_STROKE_COLOR,
          strokeOpacity: GEOFENCE_STROKE_OPACITY,
          strokeWeight: GEOFENCE_STROKE_WEIGHT,
        },
        polylineOptions: {
          editable: true,
          draggable: true,
          strokeColor: GEOFENCE_STROKE_COLOR,
          strokeOpacity: GEOFENCE_STROKE_OPACITY,
          strokeWeight: getRouteStrokeWeight(geofenceDrawing?.shape?.radiusMeters),
        },
      });
      geofenceDrawingManagerRef.current.setMap(mapRef.current);
    }

    geofenceDrawingManagerRef.current.setOptions({
      circleOptions: {
        editable: true,
        draggable: true,
        fillColor: GEOFENCE_FILL_COLOR,
        fillOpacity: GEOFENCE_FILL_OPACITY,
        strokeColor: GEOFENCE_STROKE_COLOR,
        strokeOpacity: GEOFENCE_STROKE_OPACITY,
        strokeWeight: GEOFENCE_STROKE_WEIGHT,
      },
      polygonOptions: {
        editable: true,
        draggable: true,
        fillColor: GEOFENCE_FILL_COLOR,
        fillOpacity: GEOFENCE_FILL_OPACITY,
        strokeColor: GEOFENCE_STROKE_COLOR,
        strokeOpacity: GEOFENCE_STROKE_OPACITY,
        strokeWeight: GEOFENCE_STROKE_WEIGHT,
      },
      polylineOptions: {
        editable: true,
        draggable: true,
        strokeColor: GEOFENCE_STROKE_COLOR,
        strokeOpacity: GEOFENCE_STROKE_OPACITY,
        strokeWeight: getRouteStrokeWeight(geofenceDrawing?.shape?.radiusMeters),
      },
    });

    const geofenceType = geofenceDrawing.geofenceType || 'Circle';
    syncGeofenceDrawingMode(geofenceType);

    if (geofenceDrawingListenerRef.current) {
      window.google.maps.event.removeListener(geofenceDrawingListenerRef.current);
    }

    geofenceDrawingListenerRef.current = window.google.maps.event.addListener(
      geofenceDrawingManagerRef.current,
      'overlaycomplete',
      (event) => {
        const completedType = event.type === window.google.maps.drawing.OverlayType.CIRCLE
          ? 'Circle'
          : event.type === window.google.maps.drawing.OverlayType.POLYGON
            ? 'Polygon'
            : 'Route';

        clearGeofenceOverlay();
        geofenceOverlayRef.current = event.overlay;
        attachGeofenceOverlayListeners(event.overlay, completedType);
        fitOverlayToMap(event.overlay, completedType);
        emitGeofenceShapeChange(event.overlay, completedType);
        syncGeofenceDrawingMode(completedType);
      }
    );

    return () => {
      if (geofenceDrawingListenerRef.current && window.google?.maps?.event) {
        window.google.maps.event.removeListener(geofenceDrawingListenerRef.current);
        geofenceDrawingListenerRef.current = null;
      }
    };
  }, [attachGeofenceOverlayListeners, clearGeofenceOverlay, emitGeofenceShapeChange, fitOverlayToMap, geofenceDrawing, syncGeofenceDrawingMode]);

  useEffect(() => {
    if (!geofenceDrawing?.enabled || !mapRef.current) {
      return;
    }

    const focusViewport = geofenceDrawing.focusViewport;
    const viewportBounds = buildViewportBounds(window.google?.maps, focusViewport);
    if (!geofenceOverlayRef.current && viewportBounds && !viewportBounds.isEmpty()) {
      mapRef.current.fitBounds(viewportBounds, 40);
      return;
    }

    const center = focusViewport?.center;
    if (!geofenceOverlayRef.current && hasFiniteCoordinate(center?.lat) && hasFiniteCoordinate(center?.lng)) {
      mapRef.current.panTo({ lat: Number(center.lat), lng: Number(center.lng) });
      if (Number.isFinite(Number(focusViewport?.zoom))) {
        mapRef.current.setZoom(Number(focusViewport.zoom));
      }
    }
  }, [geofenceDrawing?.enabled, geofenceDrawing?.focusViewport]);

  useEffect(() => {
    if (!geofenceDrawing?.enabled || !mapRef.current) {
      return;
    }

    const shape = geofenceDrawing.shape || {};
    const nextSignature = buildShapeSignature({
      geofenceType: geofenceDrawing.geofenceType || 'Circle',
      centerLatitude: shape.centerLatitude,
      centerLongitude: shape.centerLongitude,
      radiusMeters: shape.radiusMeters,
      coordinates: shape.coordinates,
    });

    if (nextSignature === geofenceShapeSignatureRef.current) {
      return;
    }

    geofenceShapeSignatureRef.current = nextSignature;
    rebuildGeofenceOverlayFromState();
  }, [geofenceDrawing, rebuildGeofenceOverlayFromState]);

  useEffect(() => {
    if (!clusterContextMenu) {
      return undefined;
    }

    const handlePointerDown = (event) => {
      const menuElement = document.querySelector('.vehicle-tracking-cluster-menu');
      if (menuElement && !menuElement.contains(event.target)) {
        closeClusterContextMenu();
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, [closeClusterContextMenu, clusterContextMenu]);

  const resetMapBounds = useCallback(() => {
    initialBoundsFitRef.current = false;
    prevVehicleIdsRef.current = '';
  }, []);

  const getViewportSnapshot = useCallback(() => {
    if (!mapRef.current || !window.google?.maps) {
      return null;
    }

    const center = mapRef.current.getCenter?.();
    const bounds = mapRef.current.getBounds?.();
    const northEast = bounds?.getNorthEast?.();
    const southWest = bounds?.getSouthWest?.();

    return {
      center: center
        ? {
          lat: center.lat(),
          lng: center.lng(),
        }
        : null,
      zoom: typeof mapRef.current.getZoom === 'function' ? mapRef.current.getZoom() : null,
      mapTypeId: typeof mapRef.current.getMapTypeId === 'function' ? mapRef.current.getMapTypeId() : 'roadmap',
      bounds: northEast && southWest
        ? {
          north: northEast.lat(),
          east: northEast.lng(),
          south: southWest.lat(),
          west: southWest.lng(),
        }
        : null,
    };
  }, []);

  const panToCoordinate = useCallback((lat, lng) => {
    if (!mapRef.current || !window.google?.maps) return;
    mapRef.current.panTo(new window.google.maps.LatLng(lat, lng));
  }, []);

  return {
    mapRef,
    mapSectionRef,
    mapContainerRef,
    isMapLoaded,
    isMapLoading,
    clusterContextMenu,
    closeClusterContextMenu,
    focusVehicleOnMap,
    fitGeofenceOnMap,
    panToCoordinate,
    scrollMapIntoView,
    resetMapBounds,
    getViewportSnapshot,
  };
}
