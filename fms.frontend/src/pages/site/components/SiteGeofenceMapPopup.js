/**
 * File:          SiteGeofenceMapPopup.js
 * Purpose:       Popup map preview for selected site geofence boundaries.
 * Dependencies:  react, devextreme-react/popup, devextreme-react/load-indicator, axiosInstance
 * Last Modified: 2026-02-26
 *
 * Props:
 * - visible      (bool):                    Popup visibility
 * - onClose      (func):                    Close handler
 * - geofence     (object | null):           Selected geofence object
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Popup } from "devextreme-react/popup";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";

const parseGeometryObject = (geometryJson) => {
  if (!geometryJson) return null;

  if (typeof geometryJson === "object") return geometryJson;
  if (typeof geometryJson !== "string") return null;

  try {
    return JSON.parse(geometryJson);
  } catch {
    return null;
  }
};

const unwrapGeoJsonGeometry = (value) => {
  if (!value || typeof value !== "object") return null;

  if (value.type === "Feature") {
    return value.geometry || null;
  }

  if (value.type === "FeatureCollection") {
    const firstGeometry = Array.isArray(value.features)
      ? value.features.find((f) => f?.geometry)?.geometry
      : null;
    return firstGeometry || null;
  }

  return value;
};

const toPolygonPath = (geometryJson) => {
  const geometry = unwrapGeoJsonGeometry(parseGeometryObject(geometryJson));
  if (!geometry || !geometry.type) return [];

  let ring = null;
  if (geometry.type === "Polygon") {
    ring = Array.isArray(geometry.coordinates) ? geometry.coordinates[0] : null;
  } else if (geometry.type === "MultiPolygon") {
    ring = Array.isArray(geometry.coordinates) ? geometry.coordinates[0]?.[0] : null;
  }

  if (!Array.isArray(ring)) return [];

  return ring
    .map((point) => {
      const lng = Number(point?.[0]);
      const lat = Number(point?.[1]);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
      return { lat, lng };
    })
    .filter(Boolean);
};

const computeCenter = (path, fallbackLat, fallbackLng) => {
  if (Number.isFinite(Number(fallbackLat)) && Number.isFinite(Number(fallbackLng))) {
    return { lat: Number(fallbackLat), lng: Number(fallbackLng) };
  }

  if (!Array.isArray(path) || path.length === 0) {
    return { lat: -1.2921, lng: 36.8219 };
  }

  const sum = path.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 }
  );

  return {
    lat: sum.lat / path.length,
    lng: sum.lng / path.length,
  };
};

const SiteGeofenceMapPopup = ({ visible, onClose, geofence }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const polygonRef = useRef(null);
  const markerRef = useRef(null);

  const [mapApiKey, setMapApiKey] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(false);

  const polygonPath = useMemo(
    () => toPolygonPath(geofence?.geometryJson),
    [geofence?.geometryJson]
  );

  const hasPolygonBoundary = polygonPath.length >= 3;
  const mapCenter = useMemo(
    () =>
      computeCenter(
        polygonPath,
        geofence?.centerLatitude ?? geofence?.gpsGeofenceCenterLatitude,
        geofence?.centerLongitude ?? geofence?.gpsGeofenceCenterLongitude
      ),
    [
      polygonPath,
      geofence?.centerLatitude,
      geofence?.centerLongitude,
      geofence?.gpsGeofenceCenterLatitude,
      geofence?.gpsGeofenceCenterLongitude,
    ]
  );

  const loadMapApiKey = useCallback(async () => {
    if (mapApiKey) return;

    try {
      const response = await axiosInstance.get("/SystemConfiguration/by-key/GoogleMaps.ApiKey");
      if (response.data && (response.data.success || response.data.isSuccess) && response.data.data?.configurationValue) {
        setMapApiKey(response.data.data.configurationValue);
      } else {
        notify("Google Maps API key is not configured", "warning", 3000);
      }
    } catch (error) {
      console.error("Failed to load Google Maps API key:", error);
      notify("Failed to load map configuration", "warning", 3000);
    }
  }, [mapApiKey]);

  const initializeMap = useCallback(() => {
    if (!mapContainerRef.current || !window.google || !window.google.maps) return;

    const map = new window.google.maps.Map(mapContainerRef.current, {
      center: mapCenter,
      zoom: 14,
      mapTypeId: "satellite",
      mapTypeControl: true,
      streetViewControl: false,
      fullscreenControl: true,
      zoomControl: true,
    });

    mapRef.current = map;

    if (hasPolygonBoundary) {
      const polygon = new window.google.maps.Polygon({
        paths: polygonPath,
        strokeColor: "#0078d4",
        strokeOpacity: 0.95,
        strokeWeight: 2,
        fillColor: "#deecf9",
        fillOpacity: 0.4,
      });

      polygon.setMap(map);
      polygonRef.current = polygon;

      const bounds = new window.google.maps.LatLngBounds();
      polygonPath.forEach((point) => bounds.extend(point));
      if (!bounds.isEmpty()) {
        map.fitBounds(bounds);
      }
    } else {
      markerRef.current = new window.google.maps.Marker({
        position: mapCenter,
        map,
        title: geofence?.name || "Geofence center",
      });
    }
  }, [geofence?.name, hasPolygonBoundary, mapCenter, polygonPath]);

  const loadGoogleMapsScript = useCallback(() => {
    if (!mapApiKey) return;

    if (window.google && window.google.maps) {
      initializeMap();
      return;
    }

    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      const onScriptLoad = () => {
        setIsMapLoading(false);
        initializeMap();
      };

      existingScript.addEventListener("load", onScriptLoad, { once: true });
      existingScript.addEventListener(
        "error",
        () => {
          setIsMapLoading(false);
          notify("Failed to load Google Maps", "error", 3000);
        },
        { once: true }
      );
      return;
    }

    setIsMapLoading(true);
    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      setIsMapLoading(false);
      initializeMap();
    };
    script.onerror = () => {
      setIsMapLoading(false);
      notify("Failed to load Google Maps", "error", 3000);
    };

    document.head.appendChild(script);
  }, [initializeMap, mapApiKey]);

  useEffect(() => {
    if (visible) {
      loadMapApiKey();
    }
  }, [loadMapApiKey, visible]);

  useEffect(() => {
    if (!visible) return;
    if (!mapApiKey) return;

    const timer = setTimeout(() => {
      loadGoogleMapsScript();
    }, 120);

    return () => clearTimeout(timer);
  }, [loadGoogleMapsScript, mapApiKey, visible, geofence?.id, hasPolygonBoundary]);

  useEffect(() => {
    if (!visible) {
      polygonRef.current = null;
      markerRef.current = null;
      mapRef.current = null;
    }
  }, [visible]);

  const contentRender = () => (
    <div className="m365-geofence-map-popup">
      <div className="m365-geofence-map-popup__meta">
        <div>
          <span className="m365-geofence-map-popup__label">Geofence</span>
          <span className="m365-geofence-map-popup__value">{geofence?.name || "-"}</span>
        </div>
        <div>
          <span className="m365-geofence-map-popup__label">Type</span>
          <span className="m365-geofence-map-popup__value">{geofence?.geofenceType || "-"}</span>
        </div>
      </div>

      <div className="m365-geofence-map-popup__canvas">
        <div ref={mapContainerRef} className="m365-geofence-map-popup__map" />
        {isMapLoading && (
          <div className="m365-geofence-map-popup__loading">
            <LoadIndicator width="36px" height="36px" visible />
            <span>Loading boundary map...</span>
          </div>
        )}
      </div>

      {!hasPolygonBoundary && (
        <div className="m365-geofence-map-popup__warning">
          Polygon boundary data is not available for this geofence.
        </div>
      )}
    </div>
  );

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      title={geofence?.name ? `Geofence Boundary: ${geofence.name}` : "Geofence Boundary"}
      width={960}
      height={640}
      showCloseButton
      dragEnabled
      hideOnOutsideClick
      contentRender={contentRender}
    />
  );
};

export default SiteGeofenceMapPopup;

