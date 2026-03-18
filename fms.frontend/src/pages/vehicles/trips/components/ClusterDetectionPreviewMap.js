/**
 * File: ClusterDetectionPreviewMap.js
 * Purpose: Renders the GPS preview map for cluster detection runs using frontend-loaded track points and derived preview entities.
 * Dependencies: React, axiosInstance, devextreme/ui/notify, Google Maps API.
 * Last Modified: 2026-03-16
 *
 * Key Functions:
 * - ClusterDetectionPreviewMap(): Draws the raw GPS polyline, stops, clusters, trip legs, and site markers for the active preview run.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../../api/axiosInstance";

const TRACK_COLOR = "#0078d4";
const SITE_COLOR = "#0f766e";

const CLUSTER_COLORS = {
    Parking: "#0ea5e9",
    Load: "#16a34a",
    Dump: "#dc2626",
    Transit: "#f59e0b",
    Unknown: "#6b7280",
};

const GEOFENCE_FILL_COLORS = ["#0ea5e9", "#16a34a", "#f59e0b", "#8b5cf6", "#dc2626", "#06b6d4", "#d946ef", "#84cc16"];

const SITE_CLASSIFICATION_COLORS = {
    Parking: "#0ea5e9",
    Load: "#16a34a",
    Dump: "#dc2626",
    Fuel: "#f59e0b",
    Workshop: "#8b5cf6",
    Unknown: "#6b7280",
};

const CLUSTER_LAYER_CONFIG = [
    { key: "track", label: "GPS track", icon: "fa-light fa-wave-pulse", color: TRACK_COLOR },
    { key: "stops", label: "Stops", icon: "fa-light fa-circle-stop", color: "#6366f1" },
    { key: "clusters", label: "Clusters", icon: "fa-light fa-circle-nodes", color: "#16a34a" },
    { key: "tripLegs", label: "Trip legs", icon: "fa-light fa-route", color: "#3b82f6" },
    { key: "sites", label: "Sites", icon: "fa-light fa-map-location-dot", color: SITE_COLOR },
];

const GEOFENCE_LAYER_CONFIG = [
    { key: "track", label: "GPS track", icon: "fa-light fa-wave-pulse", color: TRACK_COLOR },
    { key: "geofences", label: "Geofences", icon: "fa-light fa-draw-polygon", color: "#8b5cf6" },
    { key: "siteVisits", label: "Site visits", icon: "fa-light fa-building", color: "#10b981" },
    { key: "tripLegs", label: "Trip legs", icon: "fa-light fa-route", color: "#3b82f6" },
];

let googleMapsApiKeyPromise = null;
let googleMapsScriptPromise = null;

const isValidCoordinate = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    return Number.isFinite(lat)
        && Number.isFinite(lng)
        && (lat !== 0 || lng !== 0)
        && Math.abs(lat) <= 90
        && Math.abs(lng) <= 180;
};

const fetchGoogleMapsApiKey = async () => {
    if (!googleMapsApiKeyPromise) {
        googleMapsApiKeyPromise = (async () => {
            const response = await axiosInstance.get("/SystemConfiguration/by-key/GoogleMaps.ApiKey");
            const payload = response?.data ?? {};
            const isSuccess = payload?.success ?? payload?.isSuccess ?? payload?.Success ?? false;
            const configuration = payload?.data ?? payload?.Data ?? null;
            const apiKey = configuration?.configurationValue ?? configuration?.ConfigurationValue ?? null;

            if (!isSuccess || !apiKey) {
                googleMapsApiKeyPromise = null;
                throw new Error("Google Maps API key is not configured.");
            }

            return apiKey;
        })();
    }

    return googleMapsApiKeyPromise;
};

const ensureGoogleMapsLoaded = async (apiKey) => {
    if (window.google?.maps) {
        return;
    }

    if (!googleMapsScriptPromise) {
        googleMapsScriptPromise = new Promise((resolve, reject) => {
            const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');

            if (existingScript) {
                existingScript.addEventListener("load", () => resolve(), { once: true });
                existingScript.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")), { once: true });
                return;
            }

            const script = document.createElement("script");
            script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}`;
            script.async = true;
            script.defer = true;
            script.addEventListener("load", () => resolve(), { once: true });
            script.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")), { once: true });
            document.head.appendChild(script);
        });
    }

    await googleMapsScriptPromise;
};

const ClusterDetectionPreviewMap = ({ preview = null, siteLookup = [], selection = null, playbackIndex = null, detectionMode = "cluster" }) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const trackPolylineRef = useRef(null);
    const stopMarkersRef = useRef([]);
    const clusterCirclesRef = useRef([]);
    const clusterMarkersRef = useRef([]);
    const tripLegPolylinesRef = useRef([]);
    const siteMarkersRef = useRef([]);
    const geofenceOverlaysRef = useRef([]);
    const siteVisitMarkersRef = useRef([]);
    const playbackMarkerRef = useRef(null);

    const isGeofence = detectionMode === "geofence";
    const layerConfig = isGeofence ? GEOFENCE_LAYER_CONFIG : CLUSTER_LAYER_CONFIG;

    const [mapReady, setMapReady] = useState(false);
    const [mapError, setMapError] = useState("");
    const [layers, setLayers] = useState({
        track: true,
        stops: true,
        clusters: true,
        tripLegs: true,
        sites: true,
        geofences: true,
        siteVisits: true,
    });

    const previewTrack = useMemo(() => {
        const points = isGeofence
            ? (Array.isArray(preview?.annotatedPoints) ? preview.annotatedPoints : [])
            : (Array.isArray(preview?.trackPoints) ? preview.trackPoints : []);
        return points.filter((point) => isValidCoordinate(point.latitude, point.longitude));
    }, [preview]);

    const clearOverlays = useCallback(() => {
        if (trackPolylineRef.current) {
            trackPolylineRef.current.setMap(null);
        }

        stopMarkersRef.current.forEach((marker) => marker?.setMap(null));
        clusterCirclesRef.current.forEach((circle) => circle?.setMap(null));
        clusterMarkersRef.current.forEach((marker) => marker?.setMap(null));
        tripLegPolylinesRef.current.forEach((polyline) => polyline?.setMap(null));
        siteMarkersRef.current.forEach((marker) => marker?.setMap(null));
        geofenceOverlaysRef.current.forEach((overlay) => overlay?.setMap(null));
        siteVisitMarkersRef.current.forEach((marker) => marker?.setMap(null));

        if (playbackMarkerRef.current) {
            playbackMarkerRef.current.setMap(null);
            playbackMarkerRef.current = null;
        }

        trackPolylineRef.current = null;
        stopMarkersRef.current = [];
        clusterCirclesRef.current = [];
        clusterMarkersRef.current = [];
        tripLegPolylinesRef.current = [];
        siteMarkersRef.current = [];
        geofenceOverlaysRef.current = [];
        siteVisitMarkersRef.current = [];
    }, []);

    useEffect(() => {
        if (!selection) {
            return;
        }

        const targetLayer = selection.type === "stops"
            ? "stops"
            : selection.type === "clusters"
                ? "clusters"
                : selection.type === "tripLegs"
                    ? "tripLegs"
                    : selection.type === "siteVisits"
                        ? "siteVisits"
                        : null;

        if (targetLayer && !layers[targetLayer]) {
            setLayers((current) => ({ ...current, [targetLayer]: true }));
        }
    }, [selection, layers]);

    const renderMap = useCallback(async () => {
        if (!mapContainerRef.current || !preview) {
            clearOverlays();
            setMapReady(false);
            return;
        }

        try {
            setMapError("");
            const apiKey = await fetchGoogleMapsApiKey();
            await ensureGoogleMapsLoaded(apiKey);
        } catch (error) {
            const message = error?.message || "Failed to load Google Maps.";
            setMapError(message);
            setMapReady(false);
            notify(message, "warning", 3000);
            return;
        }

        const { google } = window;
        if (!google?.maps) {
            setMapError("Google Maps is unavailable.");
            setMapReady(false);
            return;
        }

        if (!mapRef.current) {
            mapRef.current = new google.maps.Map(mapContainerRef.current, {
                zoom: 11,
                mapTypeId: "roadmap",
                mapTypeControl: false,
                streetViewControl: false,
                fullscreenControl: false,
            });
        }

        clearOverlays();

        const bounds = new google.maps.LatLngBounds();
        let hasBounds = false;

        if (layers.track && previewTrack.length > 1) {
            const trackPath = previewTrack.map((point) => ({ lat: Number(point.latitude), lng: Number(point.longitude) }));
            trackPolylineRef.current = new google.maps.Polyline({
                map: mapRef.current,
                path: trackPath,
                strokeColor: TRACK_COLOR,
                strokeOpacity: 0.92,
                strokeWeight: 4,
                geodesic: true,
            });

            trackPath.forEach((position) => {
                bounds.extend(position);
                hasBounds = true;
            });
        }

        (preview?.tripLegs || []).forEach((leg, index) => {
            const startLat = Number(leg.startLatitude);
            const startLng = Number(leg.startLongitude);
            const endLat = Number(leg.endLatitude);
            const endLng = Number(leg.endLongitude);

            if (!layers.tripLegs || !isValidCoordinate(startLat, startLng) || !isValidCoordinate(endLat, endLng)) {
                return;
            }

            const path = [
                { lat: startLat, lng: startLng },
                { lat: endLat, lng: endLng },
            ];

            const polyline = new google.maps.Polyline({
                map: mapRef.current,
                path,
                strokeColor: "#3b82f6",
                strokeOpacity: 0.7,
                strokeWeight: 3,
                icons: [
                    {
                        icon: { path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW, scale: 3 },
                        offset: "50%",
                    },
                ],
            });

            tripLegPolylinesRef.current[index] = polyline;
            path.forEach((position) => {
                bounds.extend(position);
                hasBounds = true;
            });
        });

        (preview?.stops || []).forEach((stop, index) => {
            const lat = Number(stop.latitude);
            const lng = Number(stop.longitude);
            if (!layers.stops || !isValidCoordinate(lat, lng)) {
                return;
            }

            const marker = new google.maps.Marker({
                map: mapRef.current,
                position: { lat, lng },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 5,
                    fillColor: "#6366f1",
                    fillOpacity: 0.8,
                    strokeColor: "#ffffff",
                    strokeWeight: 1.5,
                },
                title: `Stop #${stop.sequenceNo || index + 1}`,
            });

            stopMarkersRef.current[index] = marker;
            bounds.extend({ lat, lng });
            hasBounds = true;
        });

        (preview?.clusters || []).forEach((cluster, index) => {
            const lat = Number(cluster.centerLatitude ?? cluster.latitude);
            const lng = Number(cluster.centerLongitude ?? cluster.longitude);
            if (!layers.clusters || !isValidCoordinate(lat, lng)) {
                return;
            }

            const color = CLUSTER_COLORS[cluster.clusterType] || CLUSTER_COLORS.Unknown;
            const position = { lat, lng };
            const circle = new google.maps.Circle({
                map: mapRef.current,
                center: position,
                radius: Number(cluster.radiusMeters ?? preview?.settingsClusterRadiusMeters ?? 150),
                fillColor: color,
                fillOpacity: 0.16,
                strokeColor: color,
                strokeOpacity: 0.65,
                strokeWeight: 2,
            });
            circle.__baseColor = color;

            const marker = new google.maps.Marker({
                map: mapRef.current,
                position,
                label: {
                    text: cluster.clusterType?.[0] || "?",
                    color: "#ffffff",
                    fontSize: "12px",
                    fontWeight: "700",
                },
                icon: {
                    path: google.maps.SymbolPath.CIRCLE,
                    scale: 14,
                    fillColor: color,
                    fillOpacity: 0.95,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                },
                title: cluster.label || cluster.clusterType || `Cluster ${index + 1}`,
            });

            clusterCirclesRef.current[index] = circle;
            clusterMarkersRef.current[index] = marker;
            bounds.extend(position);
            hasBounds = true;
        });

        (Array.isArray(siteLookup) ? siteLookup : []).forEach((site, index) => {
            const lat = Number(site.gpsGeofenceCenterLatitude);
            const lng = Number(site.gpsGeofenceCenterLongitude);
            if (isGeofence || !layers.sites || !isValidCoordinate(lat, lng)) {
                return;
            }

            const marker = new google.maps.Marker({
                map: mapRef.current,
                position: { lat, lng },
                title: site.label || `Site ${index + 1}`,
                icon: {
                    path: "M 0 -9 L 8 0 L 0 9 L -8 0 z",
                    fillColor: SITE_COLOR,
                    fillOpacity: 0.88,
                    strokeColor: "#ffffff",
                    strokeWeight: 1.5,
                    scale: 1.1,
                    anchor: new google.maps.Point(0, 0),
                },
            });

            siteMarkersRef.current[index] = marker;
            bounds.extend({ lat, lng });
            hasBounds = true;
        });

        // Geofence mode: render polygon/circle geofence boundaries and site visit markers
        if (isGeofence && layers.geofences) {
            (preview?.siteGeofences || []).forEach((sg, index) => {
                const fillColor = SITE_CLASSIFICATION_COLORS[sg.classification] || GEOFENCE_FILL_COLORS[index % GEOFENCE_FILL_COLORS.length];
                const type = (sg.geofenceType || "").toLowerCase();

                if (type === "circle") {
                    const centerLat = Number(sg.centerLatitude);
                    const centerLng = Number(sg.centerLongitude);
                    const radius = Number(sg.radiusMeters);
                    if (!isValidCoordinate(centerLat, centerLng) || !Number.isFinite(radius)) return;

                    const circle = new google.maps.Circle({
                        map: mapRef.current,
                        center: { lat: centerLat, lng: centerLng },
                        radius,
                        fillColor,
                        fillOpacity: 0.12,
                        strokeColor: fillColor,
                        strokeOpacity: 0.7,
                        strokeWeight: 2,
                    });
                    geofenceOverlaysRef.current.push(circle);
                    bounds.extend({ lat: centerLat, lng: centerLng });
                    hasBounds = true;

                    // Label marker at center
                    const labelMarker = new google.maps.Marker({
                        map: mapRef.current,
                        position: { lat: centerLat, lng: centerLng },
                        title: sg.label || `Geofence ${index + 1}`,
                        icon: {
                            path: "M 0 -9 L 8 0 L 0 9 L -8 0 z",
                            fillColor,
                            fillOpacity: 0.9,
                            strokeColor: "#ffffff",
                            strokeWeight: 1.5,
                            scale: 1.1,
                            anchor: new google.maps.Point(0, 0),
                        },
                    });
                    geofenceOverlaysRef.current.push(labelMarker);
                } else if (type === "polygon" || type === "route") {
                    let coords = [];
                    try {
                        let parsed = typeof sg.geometryJson === "string" ? JSON.parse(sg.geometryJson) : sg.geometryJson;
                        if (parsed && !Array.isArray(parsed) && parsed.coordinates) parsed = parsed.coordinates;
                        const extract = (el) => {
                            if (!Array.isArray(el)) return;
                            if (el.length >= 2 && typeof el[0] === "number" && typeof el[1] === "number") {
                                coords.push({ lat: el[1], lng: el[0] });
                                return;
                            }
                            for (const item of el) extract(item);
                        };
                        extract(parsed);
                    } catch { /* skip bad geometry */ }

                    if (coords.length < 3) return;

                    const polygon = new google.maps.Polygon({
                        map: mapRef.current,
                        paths: coords,
                        fillColor,
                        fillOpacity: 0.12,
                        strokeColor: fillColor,
                        strokeOpacity: 0.7,
                        strokeWeight: 2,
                    });
                    geofenceOverlaysRef.current.push(polygon);
                    coords.forEach((c) => { bounds.extend(c); hasBounds = true; });

                    // Label marker at centroid
                    const centroidLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;
                    const centroidLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
                    const labelMarker = new google.maps.Marker({
                        map: mapRef.current,
                        position: { lat: centroidLat, lng: centroidLng },
                        title: sg.label || `Geofence ${index + 1}`,
                        icon: {
                            path: "M 0 -9 L 8 0 L 0 9 L -8 0 z",
                            fillColor,
                            fillOpacity: 0.9,
                            strokeColor: "#ffffff",
                            strokeWeight: 1.5,
                            scale: 1.1,
                            anchor: new google.maps.Point(0, 0),
                        },
                    });
                    geofenceOverlaysRef.current.push(labelMarker);
                }
            });
        }

        // Geofence mode: site visit entry markers
        if (isGeofence && layers.siteVisits) {
            (preview?.siteVisits || []).forEach((visit, index) => {
                const lat = Number(visit.entryLatitude);
                const lng = Number(visit.entryLongitude);
                if (!isValidCoordinate(lat, lng)) return;

                const visitColor = SITE_CLASSIFICATION_COLORS[visit.classification] || "#10b981";

                const marker = new google.maps.Marker({
                    map: mapRef.current,
                    position: { lat, lng },
                    title: `Visit #${index + 1}: ${visit.label || "Unknown site"} (${visit.classification || "Unknown"})`,
                    icon: {
                        path: google.maps.SymbolPath.CIRCLE,
                        scale: 6,
                        fillColor: visitColor,
                        fillOpacity: 0.9,
                        strokeColor: "#ffffff",
                        strokeWeight: 1.5,
                    },
                });
                siteVisitMarkersRef.current.push(marker);
                bounds.extend({ lat, lng });
                hasBounds = true;
            });
        }

        if (hasBounds) {
            mapRef.current.fitBounds(bounds, 48);
            google.maps.event.addListenerOnce(mapRef.current, "idle", () => {
                if (mapRef.current && mapRef.current.getZoom() > 17) {
                    mapRef.current.setZoom(17);
                }
            });
        }

        setMapReady(true);
    }, [clearOverlays, layers, preview, previewTrack, siteLookup, isGeofence]);

    useEffect(() => {
        renderMap();
    }, [renderMap]);

    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) {
            return;
        }

        const google = window.google;

        stopMarkersRef.current.forEach((marker) => {
            if (!marker) {
                return;
            }

            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 5,
                fillColor: "#6366f1",
                fillOpacity: 0.8,
                strokeColor: "#ffffff",
                strokeWeight: 1.5,
            });
            marker.setZIndex(1);
        });

        clusterCirclesRef.current.forEach((circle) => {
            if (!circle) {
                return;
            }

            circle.setOptions({
                fillOpacity: 0.16,
                strokeWeight: 2,
                strokeColor: circle.__baseColor || circle.get("strokeColor"),
            });
        });

        clusterMarkersRef.current.forEach((marker) => marker?.setZIndex(1));

        tripLegPolylinesRef.current.forEach((polyline) => {
            if (!polyline) {
                return;
            }

            polyline.setOptions({ strokeColor: "#3b82f6", strokeOpacity: 0.7, strokeWeight: 3, zIndex: 1 });
        });

        siteVisitMarkersRef.current.forEach((marker) => {
            if (!marker) return;
            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 6,
                fillColor: "#10b981",
                fillOpacity: 0.9,
                strokeColor: "#ffffff",
                strokeWeight: 1.5,
            });
            marker.setZIndex(1);
        });

        if (!selection) {
            return;
        }

        if (selection.type === "stops") {
            const marker = stopMarkersRef.current[selection.index];
            if (!marker) {
                return;
            }

            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#f43f5e",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
            });
            marker.setZIndex(999);
            mapRef.current.panTo(marker.getPosition());
        }

        if (selection.type === "clusters") {
            const circle = clusterCirclesRef.current[selection.index];
            const marker = clusterMarkersRef.current[selection.index];
            if (!circle) {
                return;
            }

            circle.setOptions({ fillOpacity: 0.32, strokeWeight: 4, strokeColor: "#ffffff" });
            marker?.setZIndex(999);
            mapRef.current.panTo(circle.getCenter());
        }

        if (selection.type === "tripLegs") {
            const polyline = tripLegPolylinesRef.current[selection.index];
            if (!polyline) {
                return;
            }

            polyline.setOptions({ strokeColor: "#f43f5e", strokeOpacity: 1, strokeWeight: 6, zIndex: 999 });
            const bounds = new google.maps.LatLngBounds();
            polyline.getPath().forEach((point) => bounds.extend(point));
            mapRef.current.panTo(bounds.getCenter());
        }

        if (selection.type === "siteVisits") {
            const marker = siteVisitMarkersRef.current[selection.index];
            if (!marker) return;

            marker.setIcon({
                path: google.maps.SymbolPath.CIRCLE,
                scale: 10,
                fillColor: "#f43f5e",
                fillOpacity: 1,
                strokeColor: "#ffffff",
                strokeWeight: 3,
            });
            marker.setZIndex(999);
            mapRef.current.panTo(marker.getPosition());
        }
    }, [selection]);

    // Playback marker — moves through track points
    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) return;
        const google = window.google;

        const points = isGeofence ? preview?.annotatedPoints : preview?.trackPoints;
        const pt = points?.[playbackIndex];

        if (playbackIndex == null || !pt) {
            if (playbackMarkerRef.current) {
                playbackMarkerRef.current.setMap(null);
                playbackMarkerRef.current = null;
            }
            return;
        }

        const lat = Number(pt.latitude);
        const lng = Number(pt.longitude);
        if (!isValidCoordinate(lat, lng)) return;

        const pos = { lat, lng };
        const rotation = Number(pt.heading) || 0;

        if (!playbackMarkerRef.current) {
            playbackMarkerRef.current = new google.maps.Marker({
                map: mapRef.current,
                position: pos,
                icon: {
                    path: google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                    scale: 6,
                    fillColor: "#dc2626",
                    fillOpacity: 1,
                    strokeColor: "#ffffff",
                    strokeWeight: 2,
                    rotation,
                },
                zIndex: 9999,
            });
        } else {
            playbackMarkerRef.current.setPosition(pos);
            const icon = playbackMarkerRef.current.getIcon();
            icon.rotation = rotation;
            playbackMarkerRef.current.setIcon(icon);
        }

        mapRef.current.panTo(pos);
    }, [playbackIndex, preview, isGeofence]);

    if (!preview) {
        return (
            <div className="tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-300 tw-bg-slate-50 tw-p-8 tw-text-center">
                <div className="tw-text-sm tw-font-semibold tw-text-slate-700">GPS preview map</div>
                <p className="tw-mt-2 tw-text-sm tw-text-slate-500">
                    Load track data to preview the raw GPS polyline and derived cluster geometry on the map.
                </p>
            </div>
        );
    }

    return (
        <section className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm tw-overflow-hidden">
            <div className="tw-flex tw-flex-col tw-gap-3 tw-border-b tw-border-slate-200 tw-px-5 tw-py-4 lg:tw-flex-row lg:tw-items-center lg:tw-justify-between">
                <div>
                    <h3 className="tw-text-base tw-font-semibold tw-text-slate-900">
                        <i className="fa-light fa-map tw-mr-2 tw-text-sky-600" />
                        GPS preview
                    </h3>
                    <p className="tw-mt-1 tw-text-sm tw-text-slate-500">
                        {isGeofence
                            ? "Track with toggleable geofence boundary, site visit, and trip-leg overlays."
                            : "Track with toggleable stop, cluster, trip-leg, and site overlays."}
                    </p>
                </div>

                <div className="tw-flex tw-flex-wrap tw-gap-2">
                    {layerConfig.map((layer) => (
                        <button
                            key={layer.key}
                            type="button"
                            onClick={() => setLayers((current) => ({ ...current, [layer.key]: !current[layer.key] }))}
                            className={`tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-full tw-border tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-transition-colors ${layers[layer.key]
                                ? "tw-border-transparent tw-text-white"
                                : "tw-border-slate-200 tw-bg-white tw-text-slate-500"
                                }`}
                            style={layers[layer.key] ? { backgroundColor: layer.color } : undefined}
                        >
                            <i className={layer.icon} />
                            {layer.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="tw-relative tw-h-[460px] tw-bg-slate-100">
                {!mapReady && !mapError ? (
                    <div className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-slate-100/90 tw-text-sm tw-text-slate-500">
                        <i className="fa-light fa-spinner-third fa-spin tw-mr-2" />
                        Loading GPS preview map...
                    </div>
                ) : null}

                {mapError ? (
                    <div className="tw-absolute tw-inset-0 tw-z-10 tw-flex tw-items-center tw-justify-center tw-bg-amber-50 tw-p-6 tw-text-center">
                        <div>
                            <div className="tw-text-sm tw-font-semibold tw-text-amber-900">Map unavailable</div>
                            <p className="tw-mt-2 tw-text-sm tw-text-amber-800">{mapError}</p>
                        </div>
                    </div>
                ) : null}

                <div ref={mapContainerRef} className="tw-h-full tw-w-full" />
            </div>
        </section>
    );
};

export default ClusterDetectionPreviewMap;