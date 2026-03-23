/**
 * File: useTrackDrawing.js
 * Purpose: Draws GPS track overlays on the Google Map — polyline, point markers, and fat-point
 *          markers (points with >=2 min gap). Displayed point markers are sampled to reduce map load,
 *          and options are persisted to localStorage.
 * Dependencies: React hooks, Google Maps API
 * Last Modified: 2026-03-21
 *
 * Key Functions:
 * - useTrackDrawing(mapRef, trackPoints): Manages map overlays based on user-selected draw options
 * - drawOptions: { showPolyline, showPoints, showFatPoints, zoomToFit, pointMinGapSeconds, pointMinDistanceMeters, showHeadingArrows }
 * - setDrawOptions(opts): Merge-updates options and persists to localStorage
 * - clearDrawing(): Removes all overlays from the map
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'fms-track-drawing-options';
const FAT_POINT_MIN_GAP_SECONDS = 120; // 2 minutes
const DEFAULT_POINT_MIN_GAP_SECONDS = 60;
const DEFAULT_POINT_MIN_DISTANCE_METERS = 200;

const POLYLINE_COLOR = '#0078d4';
const POLYLINE_OPACITY = 0.85;
const POLYLINE_WEIGHT = 3;

const POINT_COLOR = '#0078d4';
const POINT_RADIUS = 3;

const FAT_POINT_COLOR = '#d13438';
const FAT_POINT_RADIUS = 7;

const DEFAULT_OPTIONS = {
    showPolyline: true,
    showPoints: false,
    showFatPoints: false,
    zoomToFit: true,
    pointMinGapSeconds: DEFAULT_POINT_MIN_GAP_SECONDS,
    pointMinDistanceMeters: DEFAULT_POINT_MIN_DISTANCE_METERS,
    showHeadingArrows: true,
};

const toFiniteNumber = (value) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) ? numericValue : null;
};

const toTimestampMs = (value) => {
    const timestampMs = new Date(value).getTime();
    return Number.isFinite(timestampMs) ? timestampMs : null;
};

const haversineMeters = (from, to) => {
    const earthRadiusMeters = 6371000;
    const toRadians = (value) => (value * Math.PI) / 180;
    const latitudeDelta = toRadians(to.latitude - from.latitude);
    const longitudeDelta = toRadians(to.longitude - from.longitude);
    const latitude1 = toRadians(from.latitude);
    const latitude2 = toRadians(to.latitude);

    const a =
        Math.sin(latitudeDelta / 2) * Math.sin(latitudeDelta / 2) +
        Math.cos(latitude1) * Math.cos(latitude2) *
        Math.sin(longitudeDelta / 2) * Math.sin(longitudeDelta / 2);

    return earthRadiusMeters * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const calculateBearingDegrees = (from, to) => {
    const toRadians = (value) => (value * Math.PI) / 180;
    const toDegrees = (value) => (value * 180) / Math.PI;

    const latitude1 = toRadians(from.latitude);
    const latitude2 = toRadians(to.latitude);
    const longitudeDelta = toRadians(to.longitude - from.longitude);

    const y = Math.sin(longitudeDelta) * Math.cos(latitude2);
    const x =
        Math.cos(latitude1) * Math.sin(latitude2) -
        Math.sin(latitude1) * Math.cos(latitude2) * Math.cos(longitudeDelta);

    const degrees = (toDegrees(Math.atan2(y, x)) + 360) % 360;
    return Number.isFinite(degrees) ? degrees : 0;
};

const toPositiveNumberOrDefault = (value, fallback) => {
    const numericValue = Number(value);
    return Number.isFinite(numericValue) && numericValue >= 0 ? numericValue : fallback;
};

const buildHeading = (point, previousPoint, nextPoint) => {
    const explicitHeading = toFiniteNumber(point.heading);
    if (explicitHeading != null) {
        return explicitHeading;
    }

    if (nextPoint) {
        return calculateBearingDegrees(point, nextPoint);
    }

    if (previousPoint) {
        return calculateBearingDegrees(previousPoint, point);
    }

    return 0;
};

const loadPersistedOptions = () => {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw) return { ...DEFAULT_OPTIONS };
        const parsed = JSON.parse(raw);
        return {
            showPolyline: typeof parsed.showPolyline === 'boolean' ? parsed.showPolyline : DEFAULT_OPTIONS.showPolyline,
            showPoints: typeof parsed.showPoints === 'boolean' ? parsed.showPoints : DEFAULT_OPTIONS.showPoints,
            showFatPoints: typeof parsed.showFatPoints === 'boolean' ? parsed.showFatPoints : DEFAULT_OPTIONS.showFatPoints,
            zoomToFit: typeof parsed.zoomToFit === 'boolean' ? parsed.zoomToFit : DEFAULT_OPTIONS.zoomToFit,
            pointMinGapSeconds: toPositiveNumberOrDefault(parsed.pointMinGapSeconds, DEFAULT_OPTIONS.pointMinGapSeconds),
            pointMinDistanceMeters: toPositiveNumberOrDefault(parsed.pointMinDistanceMeters, DEFAULT_OPTIONS.pointMinDistanceMeters),
            showHeadingArrows: typeof parsed.showHeadingArrows === 'boolean' ? parsed.showHeadingArrows : DEFAULT_OPTIONS.showHeadingArrows,
        };
    } catch {
        return { ...DEFAULT_OPTIONS };
    }
};

const persistOptions = (opts) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(opts));
    } catch {
        // Storage full or unavailable — ignore
    }
};

export default function useTrackDrawing(mapRef, trackPoints) {
    const [drawOptions, setDrawOptionsState] = useState(loadPersistedOptions);
    const [drawVersion, setDrawVersion] = useState(0);
    const [mapVersion, setMapVersion] = useState(0);

    const polylineRefs = useRef([]);
    const pointMarkersRef = useRef([]);
    const fatPointMarkersRef = useRef([]);
    const lastMapInstanceRef = useRef(null);

    const normalizedTrackPoints = useMemo(() => {
        if (!Array.isArray(trackPoints) || trackPoints.length === 0) {
            return [];
        }

        return trackPoints
            .map((point, index) => {
                const latitude = toFiniteNumber(point?.latitude ?? point?.lat);
                const longitude = toFiniteNumber(point?.longitude ?? point?.lng);
                const timestamp = point?.timestamp ?? point?.gpsTimestamp ?? point?.serverTimestamp ?? null;
                const timestampMs = toTimestampMs(timestamp);

                if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || timestampMs == null) {
                    return null;
                }

                return {
                    id: point?._id ?? point?.id ?? index,
                    vehicleId: point?.vehicleId ?? 'default',
                    vehicleColor: point?.vehicleColor ?? POLYLINE_COLOR,
                    latitude,
                    longitude,
                    heading: point?.heading ?? point?.course ?? point?.bearing ?? null,
                    timestamp,
                    timestampMs,
                };
            })
            .filter(Boolean)
            .sort((left, right) => left.timestampMs - right.timestampMs);
    }, [trackPoints]);

    const groupedTrackPoints = useMemo(() => {
        const groups = new Map();

        normalizedTrackPoints.forEach((point) => {
            if (!groups.has(point.vehicleId)) {
                groups.set(point.vehicleId, {
                    vehicleId: point.vehicleId,
                    vehicleColor: point.vehicleColor || POLYLINE_COLOR,
                    points: [],
                });
            }

            groups.get(point.vehicleId).points.push(point);
        });

        return Array.from(groups.values());
    }, [normalizedTrackPoints]);

    const sampledPointGroups = useMemo(() => {
        const minimumGapSeconds = toPositiveNumberOrDefault(drawOptions.pointMinGapSeconds, DEFAULT_POINT_MIN_GAP_SECONDS);
        const minimumDistanceMeters = toPositiveNumberOrDefault(drawOptions.pointMinDistanceMeters, DEFAULT_POINT_MIN_DISTANCE_METERS);

        return groupedTrackPoints.map((group) => {
            if (group.points.length <= 2) {
                return {
                    ...group,
                    sampledPoints: group.points.map((point, index, points) => ({
                        ...point,
                        displayHeading: buildHeading(point, points[index - 1], points[index + 1]),
                    })),
                };
            }

            const sampledPoints = [group.points[0]];
            let lastKeptPoint = group.points[0];

            for (let index = 1; index < group.points.length - 1; index += 1) {
                const currentPoint = group.points[index];
                const gapSeconds = (currentPoint.timestampMs - lastKeptPoint.timestampMs) / 1000;
                const distanceMeters = haversineMeters(lastKeptPoint, currentPoint);

                if (gapSeconds >= minimumGapSeconds || distanceMeters >= minimumDistanceMeters) {
                    sampledPoints.push(currentPoint);
                    lastKeptPoint = currentPoint;
                }
            }

            const finalPoint = group.points[group.points.length - 1];
            if (sampledPoints[sampledPoints.length - 1]?.id !== finalPoint.id) {
                sampledPoints.push(finalPoint);
            }

            return {
                ...group,
                sampledPoints: sampledPoints.map((point, index, points) => ({
                    ...point,
                    displayHeading: buildHeading(point, points[index - 1], points[index + 1]),
                })),
            };
        });
    }, [drawOptions.pointMinDistanceMeters, drawOptions.pointMinGapSeconds, groupedTrackPoints]);

    const drawingStats = useMemo(() => {
        const sourcePointCount = groupedTrackPoints.reduce((total, group) => total + group.points.length, 0);
        const sampledPointCount = sampledPointGroups.reduce((total, group) => total + group.sampledPoints.length, 0);
        const reductionPercent = sourcePointCount > 0
            ? Math.max(0, Math.round(((sourcePointCount - sampledPointCount) / sourcePointCount) * 100))
            : 0;

        return {
            vehicleCount: groupedTrackPoints.length,
            sourcePointCount,
            sampledPointCount,
            reductionPercent,
            pointMinGapSeconds: toPositiveNumberOrDefault(drawOptions.pointMinGapSeconds, DEFAULT_POINT_MIN_GAP_SECONDS),
            pointMinDistanceMeters: toPositiveNumberOrDefault(drawOptions.pointMinDistanceMeters, DEFAULT_POINT_MIN_DISTANCE_METERS),
        };
    }, [drawOptions.pointMinDistanceMeters, drawOptions.pointMinGapSeconds, groupedTrackPoints, sampledPointGroups]);

    useEffect(() => {
        if (!mapRef) {
            return undefined;
        }

        let timeoutId = null;

        const syncMapInstance = () => {
            const nextMapInstance = mapRef.current;

            if (nextMapInstance && nextMapInstance !== lastMapInstanceRef.current) {
                lastMapInstanceRef.current = nextMapInstance;
                setMapVersion((prev) => prev + 1);
                return;
            }

            if (!nextMapInstance) {
                timeoutId = window.setTimeout(syncMapInstance, 250);
            }
        };

        syncMapInstance();

        return () => {
            if (timeoutId) {
                window.clearTimeout(timeoutId);
            }
        };
    }, [mapRef]);

    const clearDrawing = useCallback(() => {
        polylineRefs.current.forEach((polyline) => polyline.setMap(null));
        polylineRefs.current = [];
        pointMarkersRef.current.forEach((m) => m.setMap(null));
        pointMarkersRef.current = [];
        fatPointMarkersRef.current.forEach((m) => m.setMap(null));
        fatPointMarkersRef.current = [];
    }, []);

    const setDrawOptions = useCallback((update) => {
        setDrawOptionsState((prev) => {
            const next = typeof update === 'function' ? update(prev) : { ...prev, ...update };
            persistOptions(next);
            return next;
        });
    }, []);

    const redrawDrawing = useCallback(() => {
        setDrawVersion((prev) => prev + 1);
    }, []);

    // Main drawing effect — redraws whenever trackPoints or options change
    useEffect(() => {
        clearDrawing();

        const map = mapRef?.current;
        if (!map || !window.google?.maps || groupedTrackPoints.length === 0) {
            return;
        }

        const allPathPositions = [];

        groupedTrackPoints.forEach((group) => {
            group.points.forEach((point) => {
                allPathPositions.push({ lat: point.latitude, lng: point.longitude });
            });
        });

        if (allPathPositions.length === 0) return;

        // Polyline
        if (drawOptions.showPolyline) {
            polylineRefs.current = groupedTrackPoints
                .filter((group) => group.points.length > 1)
                .map((group) => new window.google.maps.Polyline({
                    map,
                    path: group.points.map((point) => ({ lat: point.latitude, lng: point.longitude })),
                    strokeColor: group.vehicleColor || POLYLINE_COLOR,
                    strokeOpacity: POLYLINE_OPACITY,
                    strokeWeight: POLYLINE_WEIGHT,
                    geodesic: true,
                    clickable: false,
                }));
        }

        // Sampled point markers
        if (drawOptions.showPoints) {
            pointMarkersRef.current = sampledPointGroups.flatMap((group) => group.sampledPoints.map((point) => {
                const pointColor = group.vehicleColor || POINT_COLOR;

                return new window.google.maps.Marker({
                    map,
                    position: { lat: point.latitude, lng: point.longitude },
                    icon: drawOptions.showHeadingArrows
                        ? {
                            path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
                            scale: 4,
                            fillColor: pointColor,
                            fillOpacity: 0.95,
                            strokeColor: '#fff',
                            strokeWeight: 1,
                            rotation: point.displayHeading,
                            anchor: new window.google.maps.Point(0, 2.5),
                        }
                        : {
                            path: window.google.maps.SymbolPath.CIRCLE,
                            scale: POINT_RADIUS,
                            fillColor: pointColor,
                            fillOpacity: 0.8,
                            strokeColor: '#fff',
                            strokeWeight: 1,
                        },
                    clickable: false,
                    zIndex: 1,
                });
            }));
        }

        // Fat-point markers (≥2 min gap from previous)
        if (drawOptions.showFatPoints) {
            fatPointMarkersRef.current = groupedTrackPoints.flatMap((group) => {
                const fatMarkers = [];

                for (let index = 1; index < group.points.length; index += 1) {
                    const currentPoint = group.points[index];
                    const previousPoint = group.points[index - 1];
                    const gap = (currentPoint.timestampMs - previousPoint.timestampMs) / 1000;

                    if (gap >= FAT_POINT_MIN_GAP_SECONDS) {
                        fatMarkers.push(
                            new window.google.maps.Marker({
                                map,
                                position: { lat: currentPoint.latitude, lng: currentPoint.longitude },
                                icon: {
                                    path: window.google.maps.SymbolPath.CIRCLE,
                                    scale: FAT_POINT_RADIUS,
                                    fillColor: FAT_POINT_COLOR,
                                    fillOpacity: 0.85,
                                    strokeColor: '#fff',
                                    strokeWeight: 2,
                                },
                                clickable: false,
                                zIndex: 2,
                            }),
                        );
                    }
                }

                return fatMarkers;
            });
        }

        // Zoom to fit
        if (drawOptions.zoomToFit && allPathPositions.length > 0) {
            const bounds = new window.google.maps.LatLngBounds();
            allPathPositions.forEach((pos) => bounds.extend(pos));
            if (!bounds.isEmpty()) {
                map.fitBounds(bounds, { padding: 60 });
            }
        }

        return () => {
            clearDrawing();
        };
    }, [mapRef, groupedTrackPoints, sampledPointGroups, drawOptions, drawVersion, mapVersion, clearDrawing]);

    return { drawOptions, setDrawOptions, clearDrawing, redrawDrawing, drawingStats };
}
