/**
 * File: GeofenceGroupMapView.js
 * Purpose: Read-only Google Maps view rendering multiple geofences, color-coded by classification.
 * Dependencies: React, axiosInstance (for API key loading)
 * Last Modified: 2026-06-10
 *
 * Key Functions:
 * - Renders circles, polygons, and routes on Google Maps
 * - Color-codes overlays by classification (Fuel, Load, Dump, Parking, Workshop)
 * - Highlights the selected geofence with a distinct stroke
 * - Auto-fits bounds to show all visible geofences
 * - Shows info window on geofence click
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../../api/axiosInstance";

const MAP_SCRIPT_SELECTOR = 'script[src*="maps.googleapis.com/maps/api/js"]';
const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 };

const CLASSIFICATION_COLORS = {
    Parking: { fill: "#a855f7", stroke: "#7c3aed" },
    Load: { fill: "#f97316", stroke: "#ea580c" },
    Dump: { fill: "#eab308", stroke: "#ca8a04" },
    Fuel: { fill: "#f59e0b", stroke: "#d97706" },
    Workshop: { fill: "#14b8a6", stroke: "#0d9488" },
    Unknown: { fill: "#6b7280", stroke: "#4b5563" },
};

const SELECTED_STROKE = "#0078d4";
const FILL_OPACITY = 0.25;
const STROKE_OPACITY = 0.9;
const STROKE_WEIGHT = 2;
const SELECTED_STROKE_WEIGHT = 4;

const getClassificationColor = (classification) =>
    CLASSIFICATION_COLORS[classification] || CLASSIFICATION_COLORS.Unknown;

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
    if (value.type === "Feature") return value.geometry || null;
    if (value.type === "FeatureCollection") {
        return Array.isArray(value.features) ? value.features.find((f) => f?.geometry)?.geometry : null;
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

const toCoordinatePath = (coordinates) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return [];
    return coordinates
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((c) => {
            const lat = Number(c.latitude);
            const lng = Number(c.longitude);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { lat, lng };
        })
        .filter(Boolean);
};

const toLinePath = (geometryJson) => {
    const geometry = unwrapGeoJsonGeometry(parseGeometryObject(geometryJson));
    if (!geometry || !geometry.type) return [];

    let coords = null;
    if (geometry.type === "LineString") {
        coords = geometry.coordinates;
    } else if (geometry.type === "MultiLineString") {
        coords = geometry.coordinates?.[0];
    } else if (geometry.type === "Polygon") {
        coords = geometry.coordinates?.[0];
    } else if (geometry.type === "MultiPolygon") {
        coords = geometry.coordinates?.[0]?.[0];
    }

    if (!Array.isArray(coords)) return [];
    return coords
        .map((point) => {
            const lng = Number(point?.[0]);
            const lat = Number(point?.[1]);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { lat, lng };
        })
        .filter(Boolean);
};

const GeofenceGroupMapView = ({
    geofences = [],
    selectedGeofenceId = null,
    onGeofenceClick = null,
    height = 400,
}) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const overlaysRef = useRef([]);
    const infoWindowRef = useRef(null);

    const [mapApiKey, setMapApiKey] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const loadMapApiKey = useCallback(async () => {
        if (mapApiKey) return;
        try {
            const response = await axiosInstance.get("/SystemConfiguration/by-key/GoogleMaps.ApiKey");
            if (response.data && (response.data.success || response.data.isSuccess) && response.data.data?.configurationValue) {
                setMapApiKey(response.data.data.configurationValue);
                return;
            }
            setLoadError("Google Maps API key is not configured.");
        } catch (error) {
            console.error("[GeofenceGroupMapView] Error loading Google Maps API key:", error);
            setLoadError("Failed to load map configuration.");
        }
    }, [mapApiKey]);

    const loadGoogleMapsScript = useCallback(async () => {
        if (!mapApiKey) return;

        if (window.google?.maps) {
            setIsMapReady(true);
            return;
        }

        setIsMapLoading(true);

        const finalize = (success) => {
            setIsMapReady(success);
            setIsMapLoading(false);
            if (!success) setLoadError("Failed to load Google Maps.");
        };

        const existingScript = document.querySelector(MAP_SCRIPT_SELECTOR);
        if (existingScript) {
            if (window.google?.maps) {
                finalize(true);
                return;
            }
            existingScript.addEventListener("load", () => finalize(true), { once: true });
            existingScript.addEventListener("error", () => finalize(false), { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places,geometry`;
        script.async = true;
        script.defer = true;
        script.onload = () => finalize(true);
        script.onerror = () => finalize(false);
        document.head.appendChild(script);
    }, [mapApiKey]);

    useEffect(() => {
        loadMapApiKey();
    }, [loadMapApiKey]);

    useEffect(() => {
        loadGoogleMapsScript();
    }, [loadGoogleMapsScript]);

    const initializeMap = useCallback(() => {
        if (!isMapReady || !mapContainerRef.current || !window.google?.maps || mapRef.current) return;

        mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: DEFAULT_CENTER,
            zoom: 10,
            mapTypeId: "roadmap",
            streetViewControl: false,
            fullscreenControl: true,
            mapTypeControl: true,
            zoomControl: true,
        });

        infoWindowRef.current = new window.google.maps.InfoWindow();
    }, [isMapReady]);

    useEffect(() => {
        initializeMap();
    }, [initializeMap]);

    const clearOverlays = useCallback(() => {
        overlaysRef.current.forEach((overlay) => {
            if (overlay.setMap) overlay.setMap(null);
        });
        overlaysRef.current = [];
        if (infoWindowRef.current) infoWindowRef.current.close();
    }, []);

    const renderGeofenceOverlays = useCallback(() => {
        if (!mapRef.current || !window.google?.maps || geofences.length === 0) return;

        clearOverlays();

        const bounds = new window.google.maps.LatLngBounds();
        let hasValidBounds = false;

        geofences.forEach((geofence) => {
            const isSelected = geofence.id === selectedGeofenceId;
            const colors = getClassificationColor(geofence.classification);
            const strokeColor = isSelected ? SELECTED_STROKE : colors.stroke;
            const strokeWeight = isSelected ? SELECTED_STROKE_WEIGHT : STROKE_WEIGHT;
            const fillColor = colors.fill;
            const zIndex = isSelected ? 1000 : 1;

            let overlay = null;

            if (geofence.geofenceType === "Circle") {
                const lat = Number(geofence.centerLatitude);
                const lng = Number(geofence.centerLongitude);
                const radius = Number(geofence.radiusMeters);

                if (Number.isFinite(lat) && Number.isFinite(lng) && radius > 0) {
                    const center = new window.google.maps.LatLng(lat, lng);
                    overlay = new window.google.maps.Circle({
                        center,
                        radius,
                        fillColor,
                        fillOpacity: FILL_OPACITY,
                        strokeColor,
                        strokeOpacity: STROKE_OPACITY,
                        strokeWeight,
                        zIndex,
                        map: mapRef.current,
                    });

                    const circleBounds = overlay.getBounds();
                    if (circleBounds) {
                        bounds.union(circleBounds);
                        hasValidBounds = true;
                    }
                }
            } else if (geofence.geofenceType === "Polygon") {
                let path = toPolygonPath(geofence.geometryJson);
                if (path.length < 3) {
                    path = toCoordinatePath(geofence.coordinates);
                }

                if (path.length >= 3) {
                    overlay = new window.google.maps.Polygon({
                        paths: path,
                        fillColor,
                        fillOpacity: FILL_OPACITY,
                        strokeColor,
                        strokeOpacity: STROKE_OPACITY,
                        strokeWeight,
                        zIndex,
                        map: mapRef.current,
                    });

                    path.forEach((p) => {
                        bounds.extend(p);
                        hasValidBounds = true;
                    });
                }
            } else if (geofence.geofenceType === "Route") {
                let path = toCoordinatePath(geofence.coordinates);
                if (path.length < 2) {
                    path = toLinePath(geofence.geometryJson);
                }
                if (path.length >= 2) {
                    overlay = new window.google.maps.Polyline({
                        path,
                        strokeColor,
                        strokeOpacity: STROKE_OPACITY,
                        strokeWeight: strokeWeight + 2,
                        zIndex,
                        map: mapRef.current,
                    });

                    path.forEach((p) => {
                        bounds.extend(p);
                        hasValidBounds = true;
                    });
                }
            }

            if (!overlay) {
                const lat = Number(geofence.centerLatitude);
                const lng = Number(geofence.centerLongitude);
                if (Number.isFinite(lat) && Number.isFinite(lng)) {
                    const position = new window.google.maps.LatLng(lat, lng);
                    overlay = new window.google.maps.Marker({
                        position,
                        map: mapRef.current,
                        title: geofence.name,
                    });
                    bounds.extend(position);
                    hasValidBounds = true;
                }
            }

            if (overlay) {
                const clickHandler = () => {
                    if (onGeofenceClick) onGeofenceClick(geofence);

                    const lat = Number(geofence.centerLatitude);
                    const lng = Number(geofence.centerLongitude);
                    if (Number.isFinite(lat) && Number.isFinite(lng) && infoWindowRef.current) {
                        const classLabel = geofence.classification || "Unknown";
                        const fuelingLabel = geofence.isUsedForFuelValidation ? "Yes" : "No";
                        infoWindowRef.current.setContent(
                            `<div style="font-family:Segoe UI,system-ui,sans-serif;font-size:13px;max-width:260px;">` +
                            `<div style="font-weight:600;margin-bottom:4px;">${geofence.name || "Unnamed"}</div>` +
                            `<div style="color:#555;margin-bottom:2px;">Type: ${geofence.geofenceType || "Unknown"}</div>` +
                            `<div style="color:#555;margin-bottom:2px;">Classification: ${classLabel}</div>` +
                            `<div style="color:#555;">Fuel validation: ${fuelingLabel}</div>` +
                            `</div>`
                        );
                        infoWindowRef.current.setPosition({ lat, lng });
                        infoWindowRef.current.open(mapRef.current);
                    }
                };

                if (overlay.addListener) {
                    overlay.addListener("click", clickHandler);
                }

                overlaysRef.current.push(overlay);
            }
        });

        if (hasValidBounds && !bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds, 60);
        }
    }, [clearOverlays, geofences, onGeofenceClick, selectedGeofenceId]);

    useEffect(() => {
        if (mapRef.current && isMapReady) {
            renderGeofenceOverlays();
        }
    }, [isMapReady, renderGeofenceOverlays]);

    const selectedNames = useMemo(() => {
        if (!selectedGeofenceId) return null;
        return geofences.find((g) => g.id === selectedGeofenceId)?.name || null;
    }, [geofences, selectedGeofenceId]);

    if (loadError) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-text-sm tw-text-gray-500" style={{ height }}>
                <div className="tw-text-center">
                    <i className="fa-light fa-triangle-exclamation tw-text-amber-500 tw-text-xl tw-mb-2"></i>
                    <p>{loadError}</p>
                </div>
            </div>
        );
    }

    if (!isMapReady || isMapLoading) {
        return (
            <div className="tw-flex tw-items-center tw-justify-center tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-text-sm tw-text-gray-500" style={{ height }}>
                <div className="tw-text-center">
                    <i className="fa-light fa-spinner-third tw-animate-spin tw-text-blue-600 tw-text-xl tw-mb-2"></i>
                    <p>Loading map...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="tw-relative tw-rounded-lg tw-border tw-border-gray-200 tw-overflow-hidden" style={{ height }}>
            <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
            <div className="tw-absolute tw-top-2 tw-left-2 tw-bg-white tw-rounded tw-shadow tw-px-2 tw-py-1 tw-text-xs tw-text-gray-600 tw-pointer-events-none">
                <i className="fa-light fa-location-dot tw-mr-1 tw-text-blue-600"></i>
                {geofences.length} geofence{geofences.length !== 1 ? "s" : ""}
                {selectedNames && <span className="tw-ml-2 tw-font-medium tw-text-gray-800">• {selectedNames}</span>}
            </div>
            <div className="tw-absolute tw-bottom-2 tw-right-2 tw-bg-white tw-rounded tw-shadow tw-p-1.5 tw-flex tw-flex-wrap tw-gap-1.5 tw-max-w-[240px]">
                {Object.entries(CLASSIFICATION_COLORS).map(([key, val]) => (
                    <span key={key} className="tw-inline-flex tw-items-center tw-gap-1 tw-text-[10px] tw-text-gray-600">
                        <span className="tw-w-2.5 tw-h-2.5 tw-rounded-full tw-border tw-border-gray-300" style={{ backgroundColor: val.fill }} />
                        {key}
                    </span>
                ))}
            </div>
        </div>
    );
};

export default GeofenceGroupMapView;
