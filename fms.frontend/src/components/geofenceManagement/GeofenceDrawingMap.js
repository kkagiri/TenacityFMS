/**
 * File: GeofenceDrawingMap.js
 * Purpose: Provides map-first geofence drawing for circle, polygon, and route corridor creation.
 * Dependencies: React, axiosInstance, Google Maps JavaScript API.
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - GeofenceDrawingMap(): Loads Google Maps drawing tools and captures editable geofence geometry.
 * - clearDrawing(): Removes the active overlay and resets the captured geometry.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axiosInstance from "../../api/axiosInstance";

const DEFAULT_CENTER = { lat: -1.286389, lng: 36.817223 };
const MAP_SCRIPT_SELECTOR = 'script[src*="maps.googleapis.com/maps/api/js"]';
const REQUIRED_LIBRARIES = ["places", "marker", "drawing", "geometry"];
const GEOFENCE_FILL_COLOR = "#22c55e";
const GEOFENCE_STROKE_COLOR = "#15803d";
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
            latitude: Number(coordinate.latitude),
            longitude: Number(coordinate.longitude),
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
    if (!path || typeof path.getLength !== "function") {
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

const formatCoordinateValue = (value) => {
    if (!Number.isFinite(Number(value))) {
        return "—";
    }

    return Number(value).toFixed(6);
};

const buildShapeSignature = ({ geofenceType, centerLatitude, centerLongitude, radiusMeters, coordinates }) =>
    JSON.stringify({
        geofenceType,
        centerLatitude: centerLatitude == null || centerLatitude === "" ? null : Number(centerLatitude),
        centerLongitude: centerLongitude == null || centerLongitude === "" ? null : Number(centerLongitude),
        radiusMeters: radiusMeters == null || radiusMeters === "" ? null : Number(radiusMeters),
        coordinates: normalizeCoordinates(coordinates),
    });

const resolveOverlayType = (maps, geofenceType) => {
    switch (geofenceType) {
        case "Polygon":
            return maps.drawing.OverlayType.POLYGON;
        case "Route":
            return maps.drawing.OverlayType.POLYLINE;
        case "Circle":
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

const GeofenceDrawingMap = ({
    geofenceType = "Circle",
    centerLatitude,
    centerLongitude,
    radiusMeters,
    coordinates = [],
    height = 420,
    initialViewport = null,
    onShapeChange,
}) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const drawingManagerRef = useRef(null);
    const overlayRef = useRef(null);
    const overlayListenersRef = useRef([]);
    const drawingCompleteListenerRef = useRef(null);
    const lastShapeSignatureRef = useRef("");

    const [mapApiKey, setMapApiKey] = useState(null);
    const [isMapReady, setIsMapReady] = useState(false);
    const [isMapLoading, setIsMapLoading] = useState(false);
    const [loadError, setLoadError] = useState("");

    const normalizedCoordinates = useMemo(() => normalizeCoordinates(coordinates), [coordinates]);
    const derivedCenter = useMemo(() => computeCenter(normalizedCoordinates), [normalizedCoordinates]);

    const hasShape = useMemo(() => {
        if (geofenceType === "Circle") {
            return Number.isFinite(Number(centerLatitude))
                && Number.isFinite(Number(centerLongitude))
                && Number(radiusMeters) > 0;
        }

        return geofenceType === "Polygon"
            ? normalizedCoordinates.length >= 3
            : normalizedCoordinates.length >= 2;
    }, [centerLatitude, centerLongitude, geofenceType, normalizedCoordinates, radiusMeters]);

    const shapeSummary = useMemo(() => {
        if (geofenceType === "Circle") {
            return [
                { label: "Latitude", value: formatCoordinateValue(centerLatitude) },
                { label: "Longitude", value: formatCoordinateValue(centerLongitude) },
                { label: "Radius", value: Number(radiusMeters) > 0 ? `${Math.round(Number(radiusMeters))} m` : "—" },
            ];
        }

        return [
            {
                label: geofenceType === "Route" ? "Route points" : "Boundary points",
                value: normalizedCoordinates.length || "—",
            },
            { label: "Latitude", value: formatCoordinateValue(derivedCenter?.latitude) },
            { label: "Longitude", value: formatCoordinateValue(derivedCenter?.longitude) },
        ];
    }, [centerLatitude, centerLongitude, derivedCenter, geofenceType, normalizedCoordinates.length, radiusMeters]);

    const clearOverlayListeners = useCallback(() => {
        if (!window.google?.maps?.event) {
            overlayListenersRef.current = [];
            return;
        }

        overlayListenersRef.current.forEach((listener) => window.google.maps.event.removeListener(listener));
        overlayListenersRef.current = [];
    }, []);

    const clearOverlay = useCallback(() => {
        clearOverlayListeners();

        if (overlayRef.current) {
            overlayRef.current.setMap(null);
            overlayRef.current = null;
        }
    }, [clearOverlayListeners]);

    const fitOverlayToMap = useCallback((overlay, currentType = geofenceType) => {
        if (!overlay || !mapRef.current || !window.google?.maps) {
            return;
        }

        if (currentType === "Circle" && typeof overlay.getBounds === "function") {
            const bounds = overlay.getBounds();
            if (bounds) {
                mapRef.current.fitBounds(bounds, 80);
            }
            return;
        }

        const path = overlay.getPath?.();
        const pathCoordinates = getPathCoordinates(path);
        if (!pathCoordinates.length) {
            return;
        }

        const bounds = new window.google.maps.LatLngBounds();
        pathCoordinates.forEach((coordinate) => {
            bounds.extend(new window.google.maps.LatLng(coordinate.latitude, coordinate.longitude));
        });

        if (!bounds.isEmpty()) {
            mapRef.current.fitBounds(bounds, 80);
        }
    }, [geofenceType]);

    const emitShapeChange = useCallback((overlay, currentType = geofenceType) => {
        if (!overlay || !onShapeChange) {
            return;
        }

        if (currentType === "Circle") {
            const center = overlay.getCenter?.();
            const nextShape = {
                centerLatitude: center?.lat() ?? null,
                centerLongitude: center?.lng() ?? null,
                radiusMeters: overlay.getRadius?.() ? Math.round(overlay.getRadius()) : null,
                coordinates: [],
            };

            lastShapeSignatureRef.current = buildShapeSignature({ geofenceType: currentType, ...nextShape });
            onShapeChange(nextShape);
            return;
        }

        const pathCoordinates = getPathCoordinates(overlay.getPath?.());
        const center = computeCenter(pathCoordinates);
        const nextShape = {
            centerLatitude: center?.latitude ?? null,
            centerLongitude: center?.longitude ?? null,
            coordinates: pathCoordinates,
            ...(currentType === "Polygon" ? { radiusMeters: null } : {}),
        };

        lastShapeSignatureRef.current = buildShapeSignature({
            geofenceType: currentType,
            ...nextShape,
            radiusMeters: currentType === "Route" ? radiusMeters : null,
        });
        onShapeChange(nextShape);
    }, [geofenceType, onShapeChange, radiusMeters]);

    const attachOverlayListeners = useCallback((overlay, currentType = geofenceType) => {
        if (!overlay || !window.google?.maps?.event) {
            return;
        }

        clearOverlayListeners();

        const register = (target, eventName, handler) => {
            overlayListenersRef.current.push(window.google.maps.event.addListener(target, eventName, handler));
        };

        if (currentType === "Circle") {
            register(overlay, "center_changed", () => emitShapeChange(overlay, currentType));
            register(overlay, "radius_changed", () => emitShapeChange(overlay, currentType));
            register(overlay, "dragend", () => emitShapeChange(overlay, currentType));
            return;
        }

        const path = overlay.getPath?.();
        if (path) {
            register(path, "insert_at", () => emitShapeChange(overlay, currentType));
            register(path, "remove_at", () => emitShapeChange(overlay, currentType));
            register(path, "set_at", () => emitShapeChange(overlay, currentType));
        }

        register(overlay, "dragend", () => emitShapeChange(overlay, currentType));
        register(overlay, "mouseup", () => emitShapeChange(overlay, currentType));
    }, [clearOverlayListeners, emitShapeChange, geofenceType]);

    const ensureGoogleLibraries = useCallback(async () => {
        if (!window.google?.maps) {
            return false;
        }

        if (typeof window.google.maps.importLibrary === "function") {
            try {
                await Promise.all([
                    window.google.maps.importLibrary("maps"),
                    window.google.maps.importLibrary("drawing"),
                    window.google.maps.importLibrary("geometry"),
                ]);
            } catch (error) {
                console.warn("[GeofenceDrawingMap] Failed loading Google Maps libraries:", error);
            }
        }

        return Boolean(window.google.maps?.drawing && window.google.maps?.geometry);
    }, []);

    const loadMapApiKey = useCallback(async () => {
        try {
            const response = await axiosInstance.get("/SystemConfiguration/by-key/GoogleMaps.ApiKey");
            if (response.data && (response.data.success || response.data.isSuccess) && response.data.data?.configurationValue) {
                setMapApiKey(response.data.data.configurationValue);
                return;
            }

            setLoadError("Google Maps API key is not configured.");
        } catch (error) {
            console.error("[GeofenceDrawingMap] Error loading Google Maps API key:", error);
            setLoadError("Failed to load map configuration.");
        }
    }, []);

    const loadGoogleMapsScript = useCallback(async () => {
        if (!mapApiKey) {
            return;
        }

        if (window.google?.maps) {
            const isReady = await ensureGoogleLibraries();
            setIsMapReady(isReady);
            setLoadError(isReady ? "" : "Google Maps drawing tools are unavailable. Refresh the page and try again.");
            return;
        }

        setIsMapLoading(true);

        const finalizeSuccess = async () => {
            const isReady = await ensureGoogleLibraries();
            setIsMapReady(isReady);
            setIsMapLoading(false);
            setLoadError(isReady ? "" : "Google Maps drawing tools are unavailable. Refresh the page and try again.");
        };

        const finalizeError = () => {
            setIsMapLoading(false);
            setLoadError("Failed to load Google Maps.");
        };

        const existingScript = document.querySelector(MAP_SCRIPT_SELECTOR);
        if (existingScript) {
            existingScript.addEventListener("load", finalizeSuccess, { once: true });
            existingScript.addEventListener("error", finalizeError, { once: true });
            return;
        }

        const script = document.createElement("script");
        script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=${REQUIRED_LIBRARIES.join(",")}`;
        script.async = true;
        script.defer = true;
        script.onload = finalizeSuccess;
        script.onerror = finalizeError;
        document.head.appendChild(script);
    }, [ensureGoogleLibraries, mapApiKey]);

    const initializeMap = useCallback(() => {
        if (!isMapReady || !mapContainerRef.current || !window.google?.maps || mapRef.current) {
            return;
        }

        const viewportCenter = hasFiniteCoordinate(initialViewport?.center?.lat) && hasFiniteCoordinate(initialViewport?.center?.lng)
            ? { lat: Number(initialViewport.center.lat), lng: Number(initialViewport.center.lng) }
            : null;

        const initialCenter = Number.isFinite(Number(centerLatitude)) && Number.isFinite(Number(centerLongitude))
            ? { lat: Number(centerLatitude), lng: Number(centerLongitude) }
            : viewportCenter || DEFAULT_CENTER;

        const initialZoom = Number.isFinite(Number(initialViewport?.zoom)) ? Number(initialViewport.zoom) : 12;
        const initialMapTypeId = initialViewport?.mapTypeId || "roadmap";

        mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
            center: initialCenter,
            zoom: initialZoom,
            mapTypeId: initialMapTypeId,
            streetViewControl: false,
            fullscreenControl: true,
            mapTypeControl: true,
            zoomControl: true,
        });

        const viewportBounds = buildViewportBounds(window.google.maps, initialViewport);
        if (viewportBounds && !viewportBounds.isEmpty()) {
            mapRef.current.fitBounds(viewportBounds, 40);
        }
    }, [centerLatitude, centerLongitude, initialViewport, isMapReady]);

    const rebuildOverlayFromProps = useCallback(() => {
        if (!mapRef.current || !window.google?.maps) {
            return;
        }

        clearOverlay();

        if (geofenceType === "Circle") {
            if (!Number.isFinite(Number(centerLatitude)) || !Number.isFinite(Number(centerLongitude)) || Number(radiusMeters) <= 0) {
                return;
            }

            const circle = new window.google.maps.Circle({
                map: mapRef.current,
                center: { lat: Number(centerLatitude), lng: Number(centerLongitude) },
                radius: Number(radiusMeters),
                editable: true,
                draggable: true,
                fillColor: GEOFENCE_FILL_COLOR,
                fillOpacity: GEOFENCE_FILL_OPACITY,
                strokeColor: GEOFENCE_STROKE_COLOR,
                strokeOpacity: GEOFENCE_STROKE_OPACITY,
                strokeWeight: GEOFENCE_STROKE_WEIGHT,
            });

            overlayRef.current = circle;
            attachOverlayListeners(circle, "Circle");
            fitOverlayToMap(circle, "Circle");
            return;
        }

        if (geofenceType === "Polygon" && normalizedCoordinates.length >= 3) {
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

            overlayRef.current = polygon;
            attachOverlayListeners(polygon, "Polygon");
            fitOverlayToMap(polygon, "Polygon");
            return;
        }

        if (geofenceType === "Route" && normalizedCoordinates.length >= 2) {
            const route = new window.google.maps.Polyline({
                map: mapRef.current,
                path: normalizedCoordinates.map((coordinate) => ({ lat: coordinate.latitude, lng: coordinate.longitude })),
                editable: true,
                draggable: true,
                strokeColor: GEOFENCE_STROKE_COLOR,
                strokeOpacity: GEOFENCE_STROKE_OPACITY,
                strokeWeight: getRouteStrokeWeight(radiusMeters),
            });

            overlayRef.current = route;
            attachOverlayListeners(route, "Route");
            fitOverlayToMap(route, "Route");
        }
    }, [
        attachOverlayListeners,
        centerLatitude,
        centerLongitude,
        clearOverlay,
        fitOverlayToMap,
        geofenceType,
        normalizedCoordinates,
        radiusMeters,
    ]);

    const setDrawingMode = useCallback(() => {
        if (!drawingManagerRef.current || !window.google?.maps?.drawing) {
            return;
        }

        drawingManagerRef.current.setDrawingMode(resolveOverlayType(window.google.maps, geofenceType));
    }, [geofenceType]);

    const handleClearDrawing = useCallback(() => {
        clearOverlay();

        const clearedShape = geofenceType === "Route"
            ? { centerLatitude: null, centerLongitude: null, coordinates: [] }
            : { centerLatitude: null, centerLongitude: null, radiusMeters: null, coordinates: [] };

        lastShapeSignatureRef.current = buildShapeSignature({
            geofenceType,
            ...clearedShape,
            radiusMeters: geofenceType === "Route" ? radiusMeters : clearedShape.radiusMeters,
        });
        onShapeChange?.(clearedShape);
        setDrawingMode();
    }, [clearOverlay, geofenceType, onShapeChange, radiusMeters, setDrawingMode]);

    useEffect(() => {
        loadMapApiKey();
    }, [loadMapApiKey]);

    useEffect(() => {
        loadGoogleMapsScript();
    }, [loadGoogleMapsScript]);

    useEffect(() => {
        initializeMap();
    }, [initializeMap]);

    useEffect(() => {
        if (!mapRef.current || !window.google?.maps?.drawing) {
            return undefined;
        }

        if (!drawingManagerRef.current) {
            drawingManagerRef.current = new window.google.maps.drawing.DrawingManager({
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
                    strokeWeight: getRouteStrokeWeight(radiusMeters),
                },
            });
            drawingManagerRef.current.setMap(mapRef.current);
        }

        drawingManagerRef.current.setOptions({
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
                strokeWeight: getRouteStrokeWeight(radiusMeters),
            },
        });

        drawingManagerRef.current.setDrawingMode(overlayRef.current ? null : resolveOverlayType(window.google.maps, geofenceType));

        if (drawingCompleteListenerRef.current) {
            window.google.maps.event.removeListener(drawingCompleteListenerRef.current);
        }

        drawingCompleteListenerRef.current = window.google.maps.event.addListener(
            drawingManagerRef.current,
            "overlaycomplete",
            (event) => {
                const completedType = event.type === window.google.maps.drawing.OverlayType.CIRCLE
                    ? "Circle"
                    : event.type === window.google.maps.drawing.OverlayType.POLYGON
                        ? "Polygon"
                        : "Route";

                clearOverlay();
                overlayRef.current = event.overlay;
                attachOverlayListeners(event.overlay, completedType);
                fitOverlayToMap(event.overlay, completedType);
                emitShapeChange(event.overlay, completedType);
                drawingManagerRef.current?.setDrawingMode(null);
            }
        );

        return () => {
            if (drawingCompleteListenerRef.current && window.google?.maps?.event) {
                window.google.maps.event.removeListener(drawingCompleteListenerRef.current);
                drawingCompleteListenerRef.current = null;
            }
        };
    }, [attachOverlayListeners, clearOverlay, emitShapeChange, fitOverlayToMap, geofenceType]);

    useEffect(() => {
        if (!mapRef.current || !initialViewport || overlayRef.current) {
            return;
        }

        const viewportBounds = buildViewportBounds(window.google?.maps, initialViewport);
        if (viewportBounds && !viewportBounds.isEmpty()) {
            mapRef.current.fitBounds(viewportBounds, 40);
            return;
        }

        const center = initialViewport?.center;
        if (hasFiniteCoordinate(center?.lat) && hasFiniteCoordinate(center?.lng)) {
            mapRef.current.panTo({ lat: Number(center.lat), lng: Number(center.lng) });
        }

        if (Number.isFinite(Number(initialViewport?.zoom))) {
            mapRef.current.setZoom(Number(initialViewport.zoom));
        }
    }, [initialViewport]);

    useEffect(() => {
        if (!mapRef.current || !isMapReady) {
            return;
        }

        const nextSignature = buildShapeSignature({
            geofenceType,
            centerLatitude,
            centerLongitude,
            radiusMeters,
            coordinates: normalizedCoordinates,
        });

        if (nextSignature === lastShapeSignatureRef.current) {
            return;
        }

        lastShapeSignatureRef.current = nextSignature;
        rebuildOverlayFromProps();
    }, [
        centerLatitude,
        centerLongitude,
        geofenceType,
        isMapReady,
        normalizedCoordinates,
        radiusMeters,
        rebuildOverlayFromProps,
    ]);

    useEffect(() => () => {
        clearOverlay();

        if (drawingManagerRef.current) {
            drawingManagerRef.current.setMap(null);
            drawingManagerRef.current = null;
        }
    }, [clearOverlay]);

    return (
        <div className="tw-space-y-3">
            <div className="tw-flex tw-items-center tw-justify-end tw-gap-2">
                <button
                    type="button"
                    className="tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50"
                    onClick={setDrawingMode}
                >
                    Redraw
                </button>
                <button
                    type="button"
                    className="tw-rounded-md tw-border tw-border-gray-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-700 hover:tw-bg-gray-50 disabled:tw-cursor-not-allowed disabled:tw-opacity-50"
                    onClick={handleClearDrawing}
                    disabled={!hasShape}
                >
                    Clear
                </button>
            </div>

            {loadError && (
                <div className="tw-rounded-md tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-text-sm tw-text-red-700">
                    {loadError}
                </div>
            )}

            <div className="tw-relative tw-overflow-hidden tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white">
                {isMapLoading && (
                    <div className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-white/80 tw-text-sm tw-font-medium tw-text-gray-600">
                        Loading map...
                    </div>
                )}
                <div ref={mapContainerRef} style={{ height, width: "100%" }} />
            </div>

            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-3 tw-rounded-xl tw-border tw-border-gray-200 tw-bg-white tw-p-4">
                {shapeSummary.map((item) => (
                    <div key={item.label}>
                        <div className="tw-text-xs tw-font-medium tw-uppercase tw-tracking-wide tw-text-gray-500">{item.label}</div>
                        <div className="tw-mt-1 tw-text-sm tw-font-semibold tw-text-gray-900">{item.value}</div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default GeofenceDrawingMap;
