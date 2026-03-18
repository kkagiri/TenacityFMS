/**
 * File: geofenceOverlayUtils.js
 * Purpose: General-purpose utility for drawing geofence boundaries on a Google Map.
 *          Handles Circle, Polygon, and Route types with support for coordinates[] and GeoJSON geometryJson.
 * Dependencies: Google Maps JavaScript API (loaded externally)
 * Last Modified: 2026-03-18
 *
 * Key Functions:
 * - drawGeofenceOverlay(map, geofence, style): Draws a geofence boundary; returns the overlay
 * - removeGeofenceOverlay(overlay): Removes an overlay from the map
 * - fitMapToGeofence(map, geofence, padding): Fits the map viewport to a geofence
 * - getGeofenceBounds(geofence): Computes LatLngBounds for a geofence
 * - resolvePolygonPath(geofence): Extracts [{lat,lng}] from geometryJson or coordinates[]
 * - resolveRoutePath(geofence): Extracts [{lat,lng}] for route geofences
 */

// ─── GeoJSON Parsing ──────────────────────────────────────

export const parseGeometryObject = (geometryJson) => {
    if (!geometryJson) return null;
    if (typeof geometryJson === 'object') return geometryJson;
    if (typeof geometryJson !== 'string') return null;
    try {
        return JSON.parse(geometryJson);
    } catch {
        return null;
    }
};

export const unwrapGeoJsonGeometry = (geometryObject) => {
    if (!geometryObject || typeof geometryObject !== 'object') return null;
    if (geometryObject.type === 'Feature') return geometryObject.geometry || null;
    if (geometryObject.type === 'FeatureCollection') {
        return Array.isArray(geometryObject.features)
            ? geometryObject.features.find((f) => f?.geometry)?.geometry
            : null;
    }
    return geometryObject;
};

// ─── Coordinate Extraction ────────────────────────────────

/**
 * Extracts polygon ring from GeoJSON as [{lat, lng}].
 */
export const toPolygonPath = (geometryJson) => {
    const geometry = unwrapGeoJsonGeometry(parseGeometryObject(geometryJson));
    if (!geometry?.type) return [];

    let ring = null;
    if (geometry.type === 'Polygon') {
        ring = geometry.coordinates?.[0];
    } else if (geometry.type === 'MultiPolygon') {
        ring = geometry.coordinates?.[0]?.[0];
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

/**
 * Extracts line path from GeoJSON as [{lat, lng}].
 */
export const toLinePath = (geometryJson) => {
    const geometry = unwrapGeoJsonGeometry(parseGeometryObject(geometryJson));
    if (!geometry?.type) return [];

    let coords = null;
    if (geometry.type === 'LineString') {
        coords = geometry.coordinates;
    } else if (geometry.type === 'MultiLineString') {
        coords = geometry.coordinates?.[0];
    } else if (geometry.type === 'Polygon') {
        coords = geometry.coordinates?.[0];
    } else if (geometry.type === 'MultiPolygon') {
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

/**
 * Converts a coordinates[] array (sorted by order) to [{lat, lng}].
 */
export const toCoordinatePath = (coordinates) => {
    if (!Array.isArray(coordinates) || coordinates.length === 0) return [];
    return coordinates
        .slice()
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map((c) => {
            const lat = Number(c.latitude ?? c.lat);
            const lng = Number(c.longitude ?? c.lng);
            if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
            return { lat, lng };
        })
        .filter(Boolean);
};

/**
 * Resolves the best available [{lat, lng}] path for a Polygon geofence.
 * Tries geometryJson first (GeoJSON), then falls back to coordinates[].
 */
export const resolvePolygonPath = (geofence) => {
    if (!geofence) return [];
    const geoPath = toPolygonPath(geofence.geometryJson);
    if (geoPath.length >= 3) return geoPath;
    const coordPath = toCoordinatePath(geofence.coordinates);
    if (coordPath.length >= 3) return coordPath;
    return [];
};

/**
 * Resolves the best available [{lat, lng}] path for a Route geofence.
 * Tries coordinates[] first, then falls back to geometryJson (line geometry).
 */
export const resolveRoutePath = (geofence) => {
    if (!geofence) return [];
    const coordPath = toCoordinatePath(geofence.coordinates);
    if (coordPath.length >= 2) return coordPath;
    const linePath = toLinePath(geofence.geometryJson);
    if (linePath.length >= 2) return linePath;
    return [];
};

// ─── Default Style ────────────────────────────────────────

const DEFAULT_STYLE = {
    fillColor: '#22c55e',
    fillOpacity: 0.2,
    strokeColor: '#15803d',
    strokeOpacity: 0.95,
    strokeWeight: 4,
};

const resolveStyle = (options = {}) => ({
    fillColor: options.fillColor || options.color || DEFAULT_STYLE.fillColor,
    fillOpacity: Number.isFinite(Number(options.fillOpacity)) ? Number(options.fillOpacity) : DEFAULT_STYLE.fillOpacity,
    strokeColor: options.strokeColor || options.color || DEFAULT_STYLE.strokeColor,
    strokeOpacity: Number.isFinite(Number(options.strokeOpacity)) ? Number(options.strokeOpacity) : DEFAULT_STYLE.strokeOpacity,
    strokeWeight: Number.isFinite(Number(options.strokeWeight)) ? Number(options.strokeWeight) : DEFAULT_STYLE.strokeWeight,
});

// ─── Overlay Drawing ──────────────────────────────────────

/**
 * Draws a geofence boundary on a Google Map.
 *
 * @param {google.maps.Map} map - The Google Maps instance.
 * @param {Object} geofence - Geofence data object.
 *   Expected fields: geofenceType, centerLatitude, centerLongitude, radiusMeters, coordinates, geometryJson.
 * @param {Object} [options] - Style overrides and flags.
 *   { fillColor, fillOpacity, strokeColor, strokeOpacity, strokeWeight, color, editable, draggable }
 * @returns {google.maps.Circle|google.maps.Polygon|google.maps.Polyline|null} The created overlay, or null.
 */
export const drawGeofenceOverlay = (map, geofence, options = {}) => {
    if (!map || !geofence || !window.google?.maps) return null;

    const style = resolveStyle(options);
    const type = geofence.geofenceType || 'Circle';
    const editable = options.editable === true;
    const draggable = options.draggable === true;

    if (type === 'Circle') {
        const lat = Number(geofence.centerLatitude);
        const lng = Number(geofence.centerLongitude);
        const radius = Number(geofence.radiusMeters);

        if (!Number.isFinite(lat) || !Number.isFinite(lng) || !Number.isFinite(radius) || radius <= 0) {
            return null;
        }

        return new window.google.maps.Circle({
            map,
            center: { lat, lng },
            radius,
            editable,
            draggable,
            fillColor: style.fillColor,
            fillOpacity: style.fillOpacity,
            strokeColor: style.strokeColor,
            strokeOpacity: style.strokeOpacity,
            strokeWeight: style.strokeWeight,
        });
    }

    if (type === 'Polygon') {
        const path = resolvePolygonPath(geofence);
        if (path.length >= 3) {
            return new window.google.maps.Polygon({
                map,
                paths: path,
                editable,
                draggable,
                fillColor: style.fillColor,
                fillOpacity: style.fillOpacity,
                strokeColor: style.strokeColor,
                strokeOpacity: style.strokeOpacity,
                strokeWeight: style.strokeWeight,
            });
        }
        // No polygon path available — fall through to center-point fallback below
    }

    if (type === 'Route') {
        const path = resolveRoutePath(geofence);
        if (path.length >= 2) {
            return new window.google.maps.Polyline({
                map,
                path,
                editable,
                draggable,
                strokeColor: style.strokeColor,
                strokeOpacity: style.strokeOpacity,
                strokeWeight: style.strokeWeight,
            });
        }
        // No route path available — fall through to center-point fallback below
    }

    // Fallback: if no geometry data is available but center coordinates exist,
    // draw a small circle at the center point as a visual placeholder.
    const fallbackLat = Number(geofence.centerLatitude);
    const fallbackLng = Number(geofence.centerLongitude);
    if (Number.isFinite(fallbackLat) && Number.isFinite(fallbackLng)) {
        return new window.google.maps.Circle({
            map,
            center: { lat: fallbackLat, lng: fallbackLng },
            radius: Number(geofence.radiusMeters) || 200,
            editable,
            draggable,
            fillColor: style.fillColor,
            fillOpacity: style.fillOpacity,
            strokeColor: style.strokeColor,
            strokeOpacity: style.strokeOpacity,
            strokeWeight: style.strokeWeight,
        });
    }

    return null;
};

/**
 * Removes a geofence overlay from the map.
 */
export const removeGeofenceOverlay = (overlay) => {
    if (overlay && typeof overlay.setMap === 'function') {
        overlay.setMap(null);
    }
};

// ─── Bounds / Fit ─────────────────────────────────────────

/**
 * Computes a LatLngBounds for a geofence (all types).
 * @returns {google.maps.LatLngBounds|null}
 */
export const getGeofenceBounds = (geofence) => {
    if (!geofence || !window.google?.maps) return null;

    const type = geofence.geofenceType || 'Circle';

    if (type === 'Circle') {
        const lat = Number(geofence.centerLatitude);
        const lng = Number(geofence.centerLongitude);
        const radius = Number(geofence.radiusMeters);

        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;

        if (Number.isFinite(radius) && radius > 0) {
            const latOffset = radius / 111320;
            const lngOffset = radius / (111320 * Math.max(Math.cos((lat * Math.PI) / 180), 0.2));
            const bounds = new window.google.maps.LatLngBounds();
            bounds.extend({ lat: lat + latOffset, lng: lng + lngOffset });
            bounds.extend({ lat: lat - latOffset, lng: lng - lngOffset });
            return bounds;
        }

        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat, lng });
        return bounds;
    }

    const path = type === 'Polygon' ? resolvePolygonPath(geofence) : resolveRoutePath(geofence);

    if (path.length === 0) {
        const lat = Number(geofence.centerLatitude);
        const lng = Number(geofence.centerLongitude);
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend({ lat, lng });
        return bounds;
    }

    const bounds = new window.google.maps.LatLngBounds();
    path.forEach((p) => bounds.extend(p));
    return bounds;
};

/**
 * Fits the map viewport to show a geofence.
 */
export const fitMapToGeofence = (map, geofence, padding = 80) => {
    if (!map || !geofence) return;

    const bounds = getGeofenceBounds(geofence);
    if (!bounds || bounds.isEmpty()) return;

    if (bounds.getNorthEast().equals(bounds.getSouthWest())) {
        map.panTo(bounds.getCenter());
        if (typeof map.getZoom === 'function' && (map.getZoom() ?? 0) < 15) {
            map.setZoom(15);
        }
        return;
    }

    map.fitBounds(bounds, padding);
};
