/**
 * File: VehicleTripRouteMap.js
 * Purpose: Renders a trip route map from persisted trip geometry and GPS breadcrumbs, and supports map-assisted override editing.
 * Dependencies: React, axiosInstance, devextreme/ui/notify, Google Maps API, vehicleTripService.
 * Last Modified: 2026-03-13
 *
 * Key Functions:
 * - VehicleTripRouteMap(): Draws a route skeleton with leg markers, segment lines, and optional editor interactions.
 */
import React, { useEffect, useMemo, useRef, useState } from "react";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../../api/axiosInstance";
import { fetchVehicleTripBreadcrumbs } from "../services/vehicleTripService";

let googleMapsScriptPromise = null;
let googleMapsApiKeyPromise = null;

const isValidCoordinate = (latitude, longitude) => {
    const lat = Number(latitude);
    const lng = Number(longitude);

    return Number.isFinite(lat)
        && Number.isFinite(lng)
        && (lat !== 0 || lng !== 0)
        && Math.abs(lat) <= 90
        && Math.abs(lng) <= 180;
};

const toPoint = (latitude, longitude) => ({
    lat: Number(latitude),
    lng: Number(longitude),
});

const buildSiteMarkers = (siteOptions = []) => {
    return siteOptions
        .filter((site) => isValidCoordinate(site.gpsGeofenceCenterLatitude, site.gpsGeofenceCenterLongitude))
        .map((site) => ({
            siteId: Number(site.siteId),
            label: site.label || "Site",
            position: toPoint(site.gpsGeofenceCenterLatitude, site.gpsGeofenceCenterLongitude),
        }));
};

const clampRatio = (value) => {
    if (!Number.isFinite(value)) {
        return 0;
    }

    if (value < 0) {
        return 0;
    }

    if (value > 1) {
        return 1;
    }

    return value;
};

const getProjectionRatio = (start, end, point) => {
    const deltaLng = end.lng - start.lng;
    const deltaLat = end.lat - start.lat;
    const denominator = (deltaLng * deltaLng) + (deltaLat * deltaLat);

    if (denominator <= 0) {
        return 0;
    }

    const projected = (((point.lng - start.lng) * deltaLng) + ((point.lat - start.lat) * deltaLat)) / denominator;
    return clampRatio(projected);
};

const estimateTimestamp = (startTimeUtc, endTimeUtc, ratio) => {
    const startTime = new Date(startTimeUtc).getTime();
    const endTime = new Date(endTimeUtc).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime <= startTime) {
        return startTimeUtc;
    }

    return new Date(startTime + ((endTime - startTime) * clampRatio(ratio))).toISOString();
};

const getModeInstruction = (interactionMode) => {
    switch (interactionMode) {
        case "split":
            return "Click the selected trip leg to choose the split point and derive the split time.";
        case "adjust-start":
            return "Click the selected trip leg to estimate a new departure time from the route geometry.";
        case "adjust-end":
            return "Click the selected trip leg to estimate a new arrival time from the route geometry.";
        case "reassign-origin":
            return "Click a site marker to assign a new origin site.";
        case "reassign-destination":
            return "Click a site marker to assign a new destination site.";
        case "add-start":
            return "Click the map or a site marker to choose the new trip start point.";
        case "add-end":
            return "Click the map or a site marker to choose the new trip end point.";
        default:
            return "Map editor is ready. Choose a map action in the override panel to begin.";
    }
};

const normalizeBreadcrumbPoint = (point) => {
    const latitude = Number(point?.latitude ?? point?.Latitude);
    const longitude = Number(point?.longitude ?? point?.Longitude);
    const timestamp = point?.timestamp ?? point?.Timestamp;

    if (!isValidCoordinate(latitude, longitude) || !timestamp) {
        return null;
    }

    return {
        latitude,
        longitude,
        timestamp,
        trackInfoId: point?.trackInfoId ?? point?.TrackInfoId ?? null,
    };
};

const toTimestampValue = (value) => {
    const parsed = new Date(value).getTime();
    return Number.isFinite(parsed) ? parsed : null;
};

const buildRoutePath = (segment) => {
    if (Array.isArray(segment.routePoints) && segment.routePoints.length > 1) {
        return segment.routePoints.map((point) => ({ lat: point.latitude, lng: point.longitude }));
    }

    return [segment.start, segment.end];
};

const getSegmentRoutePoints = (segment, breadcrumbPoints) => {
    if (!Array.isArray(breadcrumbPoints) || !breadcrumbPoints.length) {
        return [];
    }

    const startTime = toTimestampValue(segment.startTimeUtc);
    const endTime = toTimestampValue(segment.endTimeUtc);
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime)) {
        return [];
    }

    const startBoundary = startTime - (2 * 60 * 1000);
    const endBoundary = endTime + (2 * 60 * 1000);

    return breadcrumbPoints.filter((point) => {
        const timestamp = toTimestampValue(point.timestamp);
        return Number.isFinite(timestamp) && timestamp >= startBoundary && timestamp <= endBoundary;
    });
};

const getNearestRoutePoint = (segment, clickedPosition) => {
    if (!Array.isArray(segment.routePoints) || !segment.routePoints.length) {
        const ratio = getProjectionRatio(segment.start, segment.end, clickedPosition);
        return {
            latitude: clickedPosition.lat,
            longitude: clickedPosition.lng,
            timestamp: estimateTimestamp(segment.startTimeUtc, segment.endTimeUtc, ratio),
            ratio,
        };
    }

    let bestMatch = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    segment.routePoints.forEach((point, index) => {
        const distance = ((point.latitude - clickedPosition.lat) ** 2) + ((point.longitude - clickedPosition.lng) ** 2);
        if (distance < bestDistance) {
            bestDistance = distance;
            bestMatch = {
                latitude: point.latitude,
                longitude: point.longitude,
                timestamp: point.timestamp,
                ratio: segment.routePoints.length > 1 ? index / (segment.routePoints.length - 1) : 0,
            };
        }
    });

    return bestMatch;
};

const buildSegments = (trips = []) => {
    return trips
        .filter((leg) => isValidCoordinate(leg.startLatitude, leg.startLongitude)
            && isValidCoordinate(leg.endLatitude, leg.endLongitude))
        .map((leg, index) => ({
            vehicleTripId: leg.vehicleTripId,
            key: leg.vehicleTripId || `${leg.sequenceNo || index + 1}-${leg.startTimeUtc}`,
            sequenceNo: leg.sequenceNo || index + 1,
            originLabel: leg.originDisplayName || "Origin",
            destinationLabel: leg.destinationDisplayName || "Destination",
            startTimeUtc: leg.startTimeUtc,
            endTimeUtc: leg.endTimeUtc,
            distanceKm: leg.distanceKm,
            durationMinutes: leg.durationMinutes,
            start: toPoint(leg.startLatitude, leg.startLongitude),
            end: toPoint(leg.endLatitude, leg.endLongitude),
        }));
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
            script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}`;
            script.async = true;
            script.defer = true;
            script.addEventListener("load", () => resolve(), { once: true });
            script.addEventListener("error", () => reject(new Error("Failed to load Google Maps.")), { once: true });
            document.head.appendChild(script);
        });
    }

    await googleMapsScriptPromise;
};

const clearOverlays = (markersRef, polylinesRef) => {
    markersRef.current.forEach((marker) => marker.setMap(null));
    polylinesRef.current.forEach((polyline) => polyline.setMap(null));
    markersRef.current = [];
    polylinesRef.current = [];
};

const VehicleTripRouteMap = ({
    vehicleTripGroupId = null,
    trips = [],
    editable = false,
    interactionMode = null,
    selectedLegId = null,
    siteOptions = [],
    onSelectionChange = null,
}) => {
    const mapContainerRef = useRef(null);
    const mapRef = useRef(null);
    const markersRef = useRef([]);
    const polylinesRef = useRef([]);
    const infoWindowRef = useRef(null);
    const mapClickListenerRef = useRef(null);
    const hasFittedBoundsRef = useRef(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState("");
    const [breadcrumbPoints, setBreadcrumbPoints] = useState([]);
    const [isLoadingBreadcrumbs, setIsLoadingBreadcrumbs] = useState(false);
    const [breadcrumbsResolved, setBreadcrumbsResolved] = useState(false);
    const [breadcrumbNotice, setBreadcrumbNotice] = useState("");

    const segments = useMemo(() => buildSegments(trips), [trips]);
    const siteMarkers = useMemo(() => buildSiteMarkers(siteOptions), [siteOptions]);
    const routedSegments = useMemo(() => {
        return segments.map((segment) => ({
            ...segment,
            routePoints: getSegmentRoutePoints(segment, breadcrumbPoints),
        }));
    }, [breadcrumbPoints, segments]);

    const onSelectionChangeRef = useRef(onSelectionChange);
    useEffect(() => { onSelectionChangeRef.current = onSelectionChange; }, [onSelectionChange]);

    useEffect(() => {
        let isCancelled = false;

        const loadBreadcrumbs = async () => {
            if (!vehicleTripGroupId) {
                setBreadcrumbPoints([]);
                setBreadcrumbNotice("");
                setBreadcrumbsResolved(true);
                return;
            }

            try {
                setIsLoadingBreadcrumbs(true);
                setBreadcrumbNotice("");

                const points = await fetchVehicleTripBreadcrumbs(vehicleTripGroupId);
                if (isCancelled) {
                    return;
                }

                const normalized = points
                    .map((point) => normalizeBreadcrumbPoint(point))
                    .filter(Boolean)
                    .sort((left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime());

                setBreadcrumbPoints(normalized);
            } catch (error) {
                if (!isCancelled) {
                    setBreadcrumbPoints([]);
                    setBreadcrumbNotice(error.message || "GPS breadcrumbs are unavailable for this trip. Falling back to stored leg geometry.");
                    notify(error.message || "GPS breadcrumbs are unavailable for this trip.", "warning", 3000);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoadingBreadcrumbs(false);
                    setBreadcrumbsResolved(true);
                }
            }
        };

        loadBreadcrumbs();

        return () => {
            isCancelled = true;
            setBreadcrumbsResolved(false);
            hasFittedBoundsRef.current = false;
        };
    }, [vehicleTripGroupId]);

    /* ── Main render: build the map and all overlays (runs only when route data changes) ── */
    useEffect(() => {
        let isCancelled = false;

        const renderMap = async () => {
            if (!breadcrumbsResolved) {
                return;
            }

            if ((!routedSegments.length && !siteMarkers.length) || !mapContainerRef.current) {
                clearOverlays(markersRef, polylinesRef);
                return;
            }

            const isFirstRender = !mapRef.current;

            try {
                if (isFirstRender) {
                    setIsLoading(true);
                }
                setErrorMessage("");

                const apiKey = await fetchGoogleMapsApiKey();
                await ensureGoogleMapsLoaded(apiKey);

                if (isCancelled || !window.google?.maps || !mapContainerRef.current) {
                    return;
                }

                if (mapRef.current && mapRef.current.getDiv() !== mapContainerRef.current) {
                    mapRef.current = null;
                    infoWindowRef.current = null;
                }

                if (!mapRef.current) {
                    mapRef.current = new window.google.maps.Map(mapContainerRef.current, {
                        center: segments[0].start,
                        zoom: 11,
                        mapTypeControl: false,
                        streetViewControl: false,
                        fullscreenControl: false,
                        gestureHandling: "greedy",
                    });
                    infoWindowRef.current = new window.google.maps.InfoWindow();

                    setTimeout(() => {
                        if (mapRef.current) {
                            window.google.maps.event.trigger(mapRef.current, "resize");
                        }
                    }, 300);
                }

                clearOverlays(markersRef, polylinesRef);

                const bounds = new window.google.maps.LatLngBounds();

                routedSegments.forEach((segment, index) => {
                    const routePath = buildRoutePath(segment);
                    const polyline = new window.google.maps.Polyline({
                        map: mapRef.current,
                        path: routePath,
                        strokeColor: index === 0 ? "#0078d4" : "#0f6cbd",
                        strokeOpacity: 0.9,
                        strokeWeight: 4,
                        clickable: editable,
                    });

                    polyline._segmentData = segment;
                    polylinesRef.current.push(polyline);
                    routePath.forEach((point) => bounds.extend(point));

                    const startMarkerPosition = segment.routePoints?.[0]
                        ? { lat: segment.routePoints[0].latitude, lng: segment.routePoints[0].longitude }
                        : segment.start;
                    const endMarkerPosition = segment.routePoints?.length
                        ? {
                            lat: segment.routePoints[segment.routePoints.length - 1].latitude,
                            lng: segment.routePoints[segment.routePoints.length - 1].longitude,
                        }
                        : segment.end;

                    if (index === 0) {
                        const startMarker = new window.google.maps.Marker({
                            map: mapRef.current,
                            position: startMarkerPosition,
                            title: `Start: ${segment.originLabel}`,
                            icon: {
                                path: window.google.maps.SymbolPath.CIRCLE,
                                scale: 8,
                                fillColor: "#107c10",
                                fillOpacity: 1,
                                strokeColor: "#ffffff",
                                strokeWeight: 2,
                            },
                            label: {
                                text: "S",
                                color: "#ffffff",
                                fontWeight: "700",
                            },
                        });

                        startMarker.addListener("click", () => {
                            infoWindowRef.current?.setContent(`<strong>Start</strong><br/>${segment.originLabel}`);
                            infoWindowRef.current?.open({ anchor: startMarker, map: mapRef.current });
                        });
                        markersRef.current.push(startMarker);
                    }

                    const endMarker = new window.google.maps.Marker({
                        map: mapRef.current,
                        position: endMarkerPosition,
                        title: `Leg ${segment.sequenceNo}: ${segment.destinationLabel}`,
                        icon: {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: 9,
                            fillColor: index === routedSegments.length - 1 ? "#d83b01" : "#0f6cbd",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 2,
                        },
                        label: {
                            text: String(segment.sequenceNo),
                            color: "#ffffff",
                            fontWeight: "700",
                        },
                    });

                    endMarker.addListener("click", () => {
                        infoWindowRef.current?.setContent(
                            `<strong>Leg ${segment.sequenceNo}</strong><br/>${segment.originLabel} → ${segment.destinationLabel}`,
                        );
                        infoWindowRef.current?.open({ anchor: endMarker, map: mapRef.current });
                    });

                    markersRef.current.push(endMarker);
                });

                siteMarkers.forEach((site) => {
                    const marker = new window.google.maps.Marker({
                        map: mapRef.current,
                        position: site.position,
                        title: site.label,
                        icon: {
                            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                            scale: 5,
                            fillColor: "#5c2d91",
                            fillOpacity: 1,
                            strokeColor: "#ffffff",
                            strokeWeight: 1,
                        },
                    });

                    marker._siteData = site;
                    marker.addListener("click", () => {
                        infoWindowRef.current?.setContent(`<strong>${site.label}</strong><br/>Persisted site marker`);
                        infoWindowRef.current?.open({ anchor: marker, map: mapRef.current });
                    });

                    markersRef.current.push(marker);
                    bounds.extend(site.position);
                });

                if (!bounds.isEmpty() && !hasFittedBoundsRef.current) {
                    mapRef.current.fitBounds(bounds, 48);
                    hasFittedBoundsRef.current = true;
                }
            } catch (error) {
                if (!isCancelled) {
                    setErrorMessage(error.message || "Unable to load trip map.");
                    notify(error.message || "Unable to load trip map.", "warning", 3000);
                }
            } finally {
                if (!isCancelled) {
                    setIsLoading(false);
                }
            }
        };

        renderMap();

        return () => {
            isCancelled = true;
        };
    }, [breadcrumbsResolved, routedSegments, siteMarkers, editable, segments]);

    /* ── Lightweight style update: highlight selected leg without tearing down overlays ── */
    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) {
            return;
        }

        polylinesRef.current.forEach((polyline, index) => {
            const segment = polyline._segmentData;
            if (!segment) {
                return;
            }

            const isSelectedLeg = selectedLegId && Number(selectedLegId) === Number(segment.vehicleTripId);
            polyline.setOptions({
                strokeColor: isSelectedLeg ? "#c23934" : index === 0 ? "#0078d4" : "#0f6cbd",
                strokeWeight: isSelectedLeg ? 6 : 4,
            });
        });
    }, [selectedLegId]);

    /* ── Interaction-mode effect: manages click listeners without redrawing ── */
    useEffect(() => {
        if (!mapRef.current || !window.google?.maps) {
            return;
        }

        if (mapClickListenerRef.current) {
            window.google.maps.event.removeListener(mapClickListenerRef.current);
            mapClickListenerRef.current = null;
        }

        polylinesRef.current.forEach((polyline) => {
            window.google.maps.event.clearListeners(polyline, "click");

            const segment = polyline._segmentData;
            if (!segment) {
                return;
            }

            const isSelectedLeg = selectedLegId && Number(selectedLegId) === Number(segment.vehicleTripId);
            if (editable && onSelectionChangeRef.current && isSelectedLeg && ["split", "adjust-start", "adjust-end"].includes(interactionMode)) {
                polyline.addListener("click", (event) => {
                    const clickedPosition = {
                        lat: event.latLng.lat(),
                        lng: event.latLng.lng(),
                    };
                    const nearestPoint = getNearestRoutePoint(segment, clickedPosition);
                    const estimatedTimeUtc = nearestPoint?.timestamp || segment.startTimeUtc;
                    onSelectionChangeRef.current({
                        source: "route",
                        vehicleTripId: segment.vehicleTripId,
                        sequenceNo: segment.sequenceNo,
                        latitude: nearestPoint?.latitude ?? clickedPosition.lat,
                        longitude: nearestPoint?.longitude ?? clickedPosition.lng,
                        estimatedTimeUtc,
                        ratio: nearestPoint?.ratio ?? 0,
                    });

                    infoWindowRef.current?.setContent(
                        `<strong>Leg ${segment.sequenceNo}</strong><br/>Estimated time: ${new Date(estimatedTimeUtc).toLocaleString()}`,
                    );
                    infoWindowRef.current?.setPosition({
                        lat: nearestPoint?.latitude ?? clickedPosition.lat,
                        lng: nearestPoint?.longitude ?? clickedPosition.lng,
                    });
                    infoWindowRef.current?.open({ map: mapRef.current });
                });
            }
        });

        markersRef.current.forEach((marker) => {
            const site = marker._siteData;
            if (!site) {
                return;
            }

            if (editable && onSelectionChangeRef.current && ["reassign-origin", "reassign-destination", "add-start", "add-end"].includes(interactionMode)) {
                marker.addListener("click", () => {
                    onSelectionChangeRef.current({
                        source: "site",
                        siteId: site.siteId,
                        label: site.label,
                        latitude: site.position.lat,
                        longitude: site.position.lng,
                    });
                });
            }
        });

        if (editable && onSelectionChangeRef.current && ["add-start", "add-end"].includes(interactionMode)) {
            mapClickListenerRef.current = mapRef.current.addListener("click", (event) => {
                onSelectionChangeRef.current({
                    source: "map",
                    latitude: event.latLng.lat(),
                    longitude: event.latLng.lng(),
                });
            });
        }
    }, [editable, interactionMode, selectedLegId]);

    useEffect(() => {
        return () => {
            if (mapClickListenerRef.current && window.google?.maps) {
                window.google.maps.event.removeListener(mapClickListenerRef.current);
                mapClickListenerRef.current = null;
            }
        };
    }, []);

    if (!routedSegments.length && !siteMarkers.length) {
        const legCount = Array.isArray(trips) ? trips.length : 0;
        return (
            <div className="vehicle-trip-detail-panel__map-empty">
                <i className="fa-light fa-map-location-dot" />
                <span>
                    {legCount
                        ? `${legCount} trip leg(s) found but none have valid GPS coordinates. A recompute may populate the route geometry.`
                        : "No trip-leg coordinates are available for this route yet."}
                </span>
            </div>
        );
    }

    return (
        <div className="vehicle-trip-detail-panel__map-shell">
            <div ref={mapContainerRef} className="vehicle-trip-detail-panel__map-canvas" />
            {isLoading || isLoadingBreadcrumbs ? (
                <div className="vehicle-trip-detail-panel__map-overlay">
                    <i className="fa-light fa-spinner fa-spin" />
                    <span>{isLoadingBreadcrumbs ? "Loading GPS breadcrumbs…" : "Loading trip map…"}</span>
                </div>
            ) : null}
            {errorMessage ? (
                <div className="vehicle-trip-detail-panel__map-overlay vehicle-trip-detail-panel__map-overlay--error">
                    <i className="fa-light fa-triangle-exclamation" />
                    <span>{errorMessage}</span>
                </div>
            ) : null}
            <div className="vehicle-trip-detail-panel__map-note">
                {editable
                    ? getModeInstruction(interactionMode)
                    : breadcrumbPoints.length
                        ? "Showing recorded GPS breadcrumbs for this trip group."
                        : breadcrumbNotice || "Showing stored trip-leg geometry because no GPS breadcrumbs were returned."}
            </div>
        </div>
    );
};

export default VehicleTripRouteMap;