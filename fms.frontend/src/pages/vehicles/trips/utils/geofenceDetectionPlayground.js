/**
 * File: geofenceDetectionPlayground.js
 * Purpose: Replays geofence detection in the browser from loaded track points and site geofences so threshold changes can be tested without another backend round-trip.
 * Dependencies: None.
 * Last Modified: 2026-07-06
 *
 * Key Functions:
 * - buildGeofenceSourceKey(): Identifies a loaded track-data session.
 * - buildFrontendGeofencePreview(): Builds site visits and trip legs from track points + geofence containment in the frontend.
 */

/* ─── helpers (shared logic with clusterDetectionPlayground.js) ─── */

const toNumber = (value, fallback = 0) => {
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : fallback;
};

const round = (value, decimals = 2) => {
    const factor = 10 ** decimals;
    return Math.round(toNumber(value, 0) * factor) / factor;
};

const sortByTimestamp = (left, right) => new Date(left.timestamp).getTime() - new Date(right.timestamp).getTime();

const normalizeTrackPoints = (trackPoints) => {
    return (Array.isArray(trackPoints) ? trackPoints : [])
        .map((point, index) => {
            const latitude = toNumber(point.latitude ?? point.Latitude, NaN);
            const longitude = toNumber(point.longitude ?? point.Longitude, NaN);
            const timestampValue = point.timestamp ?? point.Timestamp;
            const timestamp = timestampValue ? new Date(timestampValue) : null;

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || !timestamp || Number.isNaN(timestamp.getTime())) {
                return null;
            }

            return {
                index,
                latitude,
                longitude,
                speed: toNumber(point.speed ?? point.Speed, 0),
                heading: point.heading ?? point.Heading ?? null,
                timestamp,
                address: point.address ?? point.Address ?? null,
                ignitionStatus: point.ignitionStatus ?? point.IgnitionStatus ?? null,
            };
        })
        .filter(Boolean)
        .sort(sortByTimestamp);
};

const haversineDistanceMeters = (lat1, lon1, lat2, lon2) => {
    const earthRadiusMeters = 6371000;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a = Math.sin(dLat / 2) * Math.sin(dLat / 2)
        + Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180)
        * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return earthRadiusMeters * c;
};

const calculateDistanceKm = (points, startIndex, endIndex) => {
    let totalMeters = 0;
    for (let index = startIndex + 1; index <= endIndex; index += 1) {
        totalMeters += haversineDistanceMeters(
            points[index - 1].latitude,
            points[index - 1].longitude,
            points[index].latitude,
            points[index].longitude
        );
    }
    return totalMeters / 1000;
};

const calculateMaxSpeed = (points, startIndex, endIndex) => {
    const speeds = points
        .slice(startIndex, endIndex + 1)
        .map((point) => toNumber(point.speed, 0));
    return speeds.length ? round(Math.max(...speeds), 2) : null;
};

/* ─── geofence containment ─── */

/**
 * Parse a GeometryJson string into an array of { lat, lng } coordinate pairs.
 * Handles nested GeoJSON-style coordinate arrays and flat [lng, lat] pairs.
 */
const extractCoordinatePairs = (geometryJson) => {
    if (!geometryJson) return [];

    try {
        let parsed = typeof geometryJson === "string" ? JSON.parse(geometryJson) : geometryJson;

        // If it's a GeoJSON object with "coordinates" property, unwrap it
        if (parsed && typeof parsed === "object" && !Array.isArray(parsed) && parsed.coordinates) {
            parsed = parsed.coordinates;
        }

        const pairs = [];
        const extract = (element) => {
            if (!Array.isArray(element)) return;

            // If this is a [number, number] pair (lng, lat)
            if (element.length >= 2 && typeof element[0] === "number" && typeof element[1] === "number") {
                pairs.push({ lng: element[0], lat: element[1] });
                return;
            }

            // Otherwise recurse into sub-arrays
            for (const item of element) {
                extract(item);
            }
        };

        extract(parsed);
        return pairs;
    } catch {
        return [];
    }
};

/**
 * Check if a point is inside a circle geofence using Haversine distance.
 */
const isPointInCircle = (latitude, longitude, geofence) => {
    const centerLat = toNumber(geofence.centerLatitude, NaN);
    const centerLng = toNumber(geofence.centerLongitude, NaN);
    const radius = toNumber(geofence.radiusMeters, NaN);

    if (!Number.isFinite(centerLat) || !Number.isFinite(centerLng) || !Number.isFinite(radius)) {
        return false;
    }

    const distanceMeters = haversineDistanceMeters(latitude, longitude, centerLat, centerLng);
    return distanceMeters <= radius;
};

/**
 * Ray-casting algorithm — check if a point is inside a polygon.
 * Polygon is an array of { lat, lng }.
 */
const isPointInPolygon = (latitude, longitude, polygon) => {
    if (!Array.isArray(polygon) || polygon.length < 3) return false;

    let inside = false;
    for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
        const xi = polygon[i].lng;
        const yi = polygon[i].lat;
        const xj = polygon[j].lng;
        const yj = polygon[j].lat;

        const intersects = ((yi > latitude) !== (yj > latitude))
            && (longitude < (xj - xi) * (latitude - yi) / ((yj - yi) === 0 ? Number.EPSILON : (yj - yi)) + xi);

        if (intersects) {
            inside = !inside;
        }
    }

    return inside;
};

/**
 * Check if a point falls inside a given site geofence (dispatches by type).
 */
const isPointInsideGeofence = (latitude, longitude, siteGeofence) => {
    const type = (siteGeofence.geofenceType || "").toLowerCase();

    if (type === "circle") {
        return isPointInCircle(latitude, longitude, siteGeofence);
    }

    if (type === "polygon" || type === "route") {
        if (!siteGeofence._parsedPolygon) {
            siteGeofence._parsedPolygon = extractCoordinatePairs(siteGeofence.geometryJson);
        }
        return isPointInPolygon(latitude, longitude, siteGeofence._parsedPolygon);
    }

    return false;
};

/**
 * Find the first site geofence that contains the given point.
 * Returns the SiteGeofenceDTO or null.
 */
const resolveContainingSite = (latitude, longitude, siteGeofences) => {
    for (const sg of siteGeofences) {
        if (isPointInsideGeofence(latitude, longitude, sg)) {
            return sg;
        }
    }
    return null;
};

/* ─── source key ─── */

const buildGeofenceSourceKey = ({ vehicleId, fromUtc, toUtc, maxTrackPoints, geofenceGroupId }) => {
    return [vehicleId || 0, fromUtc || "", toUtc || "", toNumber(maxTrackPoints, 0), geofenceGroupId || ""].join("|");
};

/* ─── main algorithm ─── */

/**
 * Build geofence detection preview entirely in the browser.
 *
 * @param {object} params
 * @param {object} params.sourcePreview - The raw GeofenceDetectionPreviewDTO from the backend.
 * @param {object} params.settings      - { minimumTripDistanceKm, minimumTripDurationMinutes }
 * @returns {{ siteVisits: Array, tripLegs: Array, annotatedPoints: Array, summary: object }}
 */
const buildFrontendGeofencePreview = ({ sourcePreview, settings }) => {
    const siteGeofences = (sourcePreview.siteGeofences || sourcePreview.SiteGeofences || []).map((sg) => ({
        siteId: toNumber(sg.siteId ?? sg.SiteId, 0),
        label: sg.label ?? sg.Label ?? sg.name ?? sg.Name ?? "Unnamed",
        classification: sg.classification ?? sg.Classification ?? "Unknown",
        gpsGeofenceId: sg.gpsGeofenceId ?? sg.GpsGeofenceId ?? null,
        geofenceType: sg.geofenceType ?? sg.GeofenceType ?? "",
        geometryJson: sg.geometryJson ?? sg.GeometryJson ?? null,
        centerLatitude: sg.centerLatitude ?? sg.CenterLatitude ?? null,
        centerLongitude: sg.centerLongitude ?? sg.CenterLongitude ?? null,
        radiusMeters: sg.radiusMeters ?? sg.RadiusMeters ?? null,
    }));

    const rawPoints = sourcePreview.trackPoints || sourcePreview.TrackPoints || [];
    const points = normalizeTrackPoints(rawPoints);

    if (points.length < 2 || siteGeofences.length === 0) {
        return {
            siteVisits: [],
            tripLegs: [],
            annotatedPoints: points.map((p) => ({ ...p, containingSiteId: null, containingSiteLabel: null })),
            siteGeofences,
            summary: {
                totalTrackPoints: points.length,
                siteVisitsDetected: 0,
                tripLegsDetected: 0,
                totalSiteGeofences: siteGeofences.length,
            },
        };
    }

    const minDistanceKm = toNumber(settings.minimumTripDistanceKm, 0.5);
    const minDurationMinutes = toNumber(settings.minimumTripDurationMinutes, 2);

    // Annotate each point with its containing site
    const annotatedPoints = points.map((point) => {
        const site = resolveContainingSite(point.latitude, point.longitude, siteGeofences);
        return {
            ...point,
            containingSiteId: site ? site.siteId : null,
            containingSiteLabel: site ? site.label : null,
            containingSiteClassification: site ? site.classification : null,
        };
    });

    // Track site visits (contiguous runs inside the same site)
    const siteVisits = [];
    let currentVisit = null;

    for (let i = 0; i < annotatedPoints.length; i += 1) {
        const point = annotatedPoints[i];

        if (point.containingSiteId !== null) {
            if (currentVisit && currentVisit.siteId === point.containingSiteId) {
                // Continue same visit
                currentVisit.exitTime = point.timestamp;
                currentVisit.exitIndex = i;
                currentVisit.pointCount += 1;
            } else {
                // New visit (finalize previous if any)
                if (currentVisit) {
                    currentVisit.durationMinutes = round((currentVisit.exitTime.getTime() - currentVisit.entryTime.getTime()) / 60000, 2);
                    siteVisits.push(currentVisit);
                }
                currentVisit = {
                    siteId: point.containingSiteId,
                    label: point.containingSiteLabel,
                    classification: point.containingSiteClassification || "Unknown",
                    entryTime: point.timestamp,
                    exitTime: point.timestamp,
                    entryIndex: i,
                    exitIndex: i,
                    entryLatitude: point.latitude,
                    entryLongitude: point.longitude,
                    pointCount: 1,
                    durationMinutes: 0,
                };
            }
        } else {
            // Outside any geofence — finalize current visit
            if (currentVisit) {
                currentVisit.durationMinutes = round((currentVisit.exitTime.getTime() - currentVisit.entryTime.getTime()) / 60000, 2);
                siteVisits.push(currentVisit);
                currentVisit = null;
            }
        }
    }

    // Finalize trailing visit
    if (currentVisit) {
        currentVisit.durationMinutes = round((currentVisit.exitTime.getTime() - currentVisit.entryTime.getTime()) / 60000, 2);
        siteVisits.push(currentVisit);
    }

    // Build trip legs from consecutive site visits at different sites
    const tripLegs = [];
    for (let i = 0; i < siteVisits.length - 1; i += 1) {
        const origin = siteVisits[i];
        const destination = siteVisits[i + 1];

        if (origin.siteId === destination.siteId) continue;

        const departureIndex = origin.exitIndex;
        const arrivalIndex = destination.entryIndex;

        const departurePoint = annotatedPoints[departureIndex];
        const arrivalPoint = annotatedPoints[arrivalIndex];

        const durationMinutes = round((arrivalPoint.timestamp.getTime() - departurePoint.timestamp.getTime()) / 60000, 2);
        const distanceKm = round(calculateDistanceKm(annotatedPoints, departureIndex, arrivalIndex), 2);

        if (distanceKm < minDistanceKm || durationMinutes < minDurationMinutes) continue;

        tripLegs.push({
            legIndex: tripLegs.length,
            originSiteId: origin.siteId,
            originLabel: origin.label,
            originClassification: origin.classification || "Unknown",
            destinationSiteId: destination.siteId,
            destinationLabel: destination.label,
            destinationClassification: destination.classification || "Unknown",
            startTimeUtc: departurePoint.timestamp,
            endTimeUtc: arrivalPoint.timestamp,
            startLatitude: departurePoint.latitude,
            startLongitude: departurePoint.longitude,
            endLatitude: arrivalPoint.latitude,
            endLongitude: arrivalPoint.longitude,
            distanceKm,
            durationMinutes,
            maxSpeedKph: calculateMaxSpeed(annotatedPoints, departureIndex, arrivalIndex),
            departureIndex,
            arrivalIndex,
            status: "Completed",
            detectionMode: "Geofence",
        });
    }

    return {
        siteVisits,
        tripLegs,
        annotatedPoints,
        siteGeofences,
        summary: {
            totalTrackPoints: annotatedPoints.length,
            siteVisitsDetected: siteVisits.length,
            tripLegsDetected: tripLegs.length,
            totalSiteGeofences: siteGeofences.length,
        },
    };
};

export { buildGeofenceSourceKey, buildFrontendGeofencePreview };
