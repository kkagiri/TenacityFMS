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

const MARKER_CLUSTERER_SCRIPT_ID = 'fms-vehicle-tracking-marker-clusterer';
const MARKER_CLUSTERER_SCRIPT_URL = 'https://unpkg.com/@googlemaps/markerclusterer/dist/index.min.js';
const MARKER_CLUSTER_RADIUS = 120;

export default function useVehicleTrackingMap({
  filteredVehicles,
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
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places,marker`;
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

  return {
    mapSectionRef,
    mapContainerRef,
    isMapLoaded,
    isMapLoading,
    clusterContextMenu,
    closeClusterContextMenu,
    focusVehicleOnMap,
    scrollMapIntoView,
    resetMapBounds,
  };
}
