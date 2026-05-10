/**
 * File: useGeofencePreviewOverlay.js
 * Purpose: Manages a read-only geofence boundary overlay on a Google Map.
 *          Draws when the geofence changes and cleans up automatically.
 * Dependencies: geofenceOverlayUtils
 * Last Modified: 2026-03-18
 *
 * Key Functions:
 * - useGeofencePreviewOverlay(mapRef, geofence, color): Draws/removes overlay as geofence changes
 */
import { useEffect, useRef } from 'react';
import { drawGeofenceOverlay, removeGeofenceOverlay, fitMapToGeofence } from '../../../../utils/geofenceOverlayUtils';

/**
 * Draws a non-interactive geofence overlay on the map whenever `geofence` changes.
 * Pass null to clear the overlay.
 *
 * @param {{ current: google.maps.Map|null }} mapRef - Ref to the Google Maps instance
 * @param {Object|null} geofence - Geofence object (geofenceType, coordinates, geometryJson, etc.)
 * @param {string|null} color - Fill/stroke color override
 */
export default function useGeofencePreviewOverlay(mapRef, geofence, color) {
    const overlayRef = useRef(null);

    useEffect(() => {
        if (overlayRef.current) {
            removeGeofenceOverlay(overlayRef.current);
            overlayRef.current = null;
        }

        const map = mapRef?.current;
        if (!map || !window.google?.maps || !geofence) {
            return;
        }

        const overlay = drawGeofenceOverlay(map, geofence, {
            fillColor: color || undefined,
            fillOpacity: 0.18,
            strokeColor: color || undefined,
            strokeOpacity: 0.95,
            strokeWeight: geofence.geofenceType === 'Route' ? 8 : 4,
        });

        overlayRef.current = overlay;

        if (overlay) {
            fitMapToGeofence(map, geofence);
        }

        return () => {
            if (overlayRef.current) {
                removeGeofenceOverlay(overlayRef.current);
                overlayRef.current = null;
            }
        };
    }, [mapRef, geofence, color]);
}
