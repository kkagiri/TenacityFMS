/**
 * File:          useTripAnalysisOverlays.js
 * Purpose:       Draws Trip Analysis overlays (trip polylines, start/end markers, cluster circles,
 *                site pins) on the tracking map and tears them down on unmount or input change.
 * Dependencies:  React hooks, Google Maps JS API (from window.google).
 * Last Modified: 2026-04-17
 *
 * Key Functions:
 * - useTripAnalysisOverlays(): Synchronises overlays with the selected trips + toggles.
 */
import { useEffect, useRef } from 'react';

const TRIP_COLORS = [
    '#0078d4', '#d13438', '#107c10', '#8764b8', '#ca5010',
    '#038387', '#b4009e', '#498205', '#e3008c', '#5c2e91',
];

const CLUSTER_COLOR = '#ca5010';
const SITE_COLOR = '#107c10';

const getTimestampMs = (point) => {
    const raw = point?.timestamp ?? point?.Timestamp;
    const ms = raw ? new Date(raw).getTime() : NaN;
    return Number.isFinite(ms) ? ms : null;
};

const getLatLng = (point) => {
    const lat = Number(point?.latitude ?? point?.Latitude);
    const lng = Number(point?.longitude ?? point?.Longitude);
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    return { lat, lng };
};

const slicePointsForTrip = (trackPoints, trip) => {
    const startMs = new Date(trip.startTimeUtc).getTime();
    const endMs = new Date(trip.endTimeUtc).getTime();
    if (!Number.isFinite(startMs) || !Number.isFinite(endMs)) return [];

    const path = [];
    for (const point of trackPoints) {
        const ms = getTimestampMs(point);
        if (ms == null) continue;
        if (ms < startMs || ms > endMs) continue;
        const latLng = getLatLng(point);
        if (latLng) path.push(latLng);
    }

    // Always include start and end explicitly so short trips still draw a line.
    if (Number.isFinite(trip.startLatitude) && Number.isFinite(trip.startLongitude)) {
        path.unshift({ lat: Number(trip.startLatitude), lng: Number(trip.startLongitude) });
    }
    if (Number.isFinite(trip.endLatitude) && Number.isFinite(trip.endLongitude)) {
        path.push({ lat: Number(trip.endLatitude), lng: Number(trip.endLongitude) });
    }
    return path;
};

const buildMarkerIcon = (google, color, scale = 7) => ({
    path: google.maps.SymbolPath.CIRCLE,
    fillColor: color,
    fillOpacity: 1,
    strokeColor: '#ffffff',
    strokeWeight: 2,
    scale,
});

export default function useTripAnalysisOverlays(mapRef, {
    trackPoints = [],
    tripLegs = [],
    selectedTripKeys = [],
    clusters = [],
    sites = [],
    showClusters = false,
    showSites = false,
    zoomToSelection = false,
} = {}) {
    const overlaysRef = useRef({ polylines: [], markers: [], circles: [] });

    // Cleanup helper
    const clearOverlays = () => {
        const { polylines, markers, circles } = overlaysRef.current;
        polylines.forEach((p) => p.setMap(null));
        markers.forEach((m) => m.setMap(null));
        circles.forEach((c) => c.setMap(null));
        overlaysRef.current = { polylines: [], markers: [], circles: [] };
    };

    useEffect(() => {
        const map = mapRef?.current;
        const google = window.google;
        if (!map || !google?.maps) return undefined;

        clearOverlays();

        const bounds = new google.maps.LatLngBounds();
        let hasBoundsPoint = false;

        // --- Trip polylines & endpoints ---
        const selectedKeySet = new Set(selectedTripKeys.map(String));
        tripLegs.forEach((trip, index) => {
            const key = String(trip.tripKey ?? index);
            if (!selectedKeySet.has(key)) return;

            const color = TRIP_COLORS[index % TRIP_COLORS.length];
            const path = slicePointsForTrip(trackPoints, trip);
            if (path.length >= 2) {
                const polyline = new google.maps.Polyline({
                    path,
                    map,
                    strokeColor: color,
                    strokeOpacity: 0.9,
                    strokeWeight: 4,
                    zIndex: 10,
                });
                overlaysRef.current.polylines.push(polyline);
                path.forEach((p) => {
                    bounds.extend(p);
                    hasBoundsPoint = true;
                });
            }

            const startLat = Number(trip.startLatitude);
            const startLng = Number(trip.startLongitude);
            if (Number.isFinite(startLat) && Number.isFinite(startLng)) {
                const marker = new google.maps.Marker({
                    position: { lat: startLat, lng: startLng },
                    map,
                    title: `Trip ${index + 1} start`,
                    icon: buildMarkerIcon(google, '#107c10', 7),
                    zIndex: 20,
                });
                overlaysRef.current.markers.push(marker);
                bounds.extend({ lat: startLat, lng: startLng });
                hasBoundsPoint = true;
            }

            const endLat = Number(trip.endLatitude);
            const endLng = Number(trip.endLongitude);
            if (Number.isFinite(endLat) && Number.isFinite(endLng)) {
                const marker = new google.maps.Marker({
                    position: { lat: endLat, lng: endLng },
                    map,
                    title: `Trip ${index + 1} end`,
                    icon: buildMarkerIcon(google, '#d13438', 7),
                    zIndex: 20,
                });
                overlaysRef.current.markers.push(marker);
                bounds.extend({ lat: endLat, lng: endLng });
                hasBoundsPoint = true;
            }
        });

        // --- Cluster circles ---
        if (showClusters) {
            clusters.forEach((cluster) => {
                const lat = Number(cluster.centerLatitude ?? cluster.latitude);
                const lng = Number(cluster.centerLongitude ?? cluster.longitude);
                const radius = Number(cluster.radiusMeters) || 150;
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                const circle = new google.maps.Circle({
                    map,
                    center: { lat, lng },
                    radius,
                    fillColor: CLUSTER_COLOR,
                    fillOpacity: 0.15,
                    strokeColor: CLUSTER_COLOR,
                    strokeOpacity: 0.8,
                    strokeWeight: 1.5,
                    zIndex: 5,
                });
                overlaysRef.current.circles.push(circle);

                const label = cluster.label || `Cluster ${cluster.clusterId}`;
                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map,
                    icon: buildMarkerIcon(google, CLUSTER_COLOR, 5),
                    title: `${label} · ${cluster.visitCount || 0} visits`,
                    zIndex: 15,
                });
                overlaysRef.current.markers.push(marker);
            });
        }

        // --- Site pins ---
        if (showSites) {
            sites.forEach((site) => {
                const lat = Number(site.gpsGeofenceCenterLatitude ?? site.centerLatitude);
                const lng = Number(site.gpsGeofenceCenterLongitude ?? site.centerLongitude);
                if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

                const marker = new google.maps.Marker({
                    position: { lat, lng },
                    map,
                    icon: {
                        path: google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
                        fillColor: SITE_COLOR,
                        fillOpacity: 0.9,
                        strokeColor: '#ffffff',
                        strokeWeight: 1.5,
                        scale: 5,
                    },
                    title: site.label || `Site ${site.siteId}`,
                    zIndex: 12,
                });
                overlaysRef.current.markers.push(marker);
            });
        }

        if (zoomToSelection && hasBoundsPoint && !bounds.isEmpty()) {
            try {
                map.fitBounds(bounds, 60);
            } catch {
                /* ignore fitBounds failures for tiny bounds */
            }
        }

        return () => {
            clearOverlays();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [
        mapRef,
        trackPoints,
        tripLegs,
        selectedTripKeys.join('|'),
        clusters,
        sites,
        showClusters,
        showSites,
        zoomToSelection,
    ]);
}
