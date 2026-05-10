/**
 * File: vehicleTrackingTrackColors.js
 * Purpose: Provides consistent vehicle colors for multi-vehicle track and track point views.
 * Dependencies: None
 * Last Modified: 2026-03-21
 *
 * Key Functions:
 * - getVehicleTrackColor(vehicleId): Returns a deterministic color for a vehicle id
 */
const TRACK_COLOR_PALETTE = [
    '#0078d4',
    '#107c10',
    '#d13438',
    '#8764b8',
    '#ca5010',
    '#038387',
    '#5c2d91',
    '#498205',
    '#a4262c',
    '#8e562e',
];

const hashVehicleId = (vehicleId) => {
    const source = String(vehicleId || '');
    let hash = 0;

    for (let index = 0; index < source.length; index += 1) {
        hash = ((hash << 5) - hash) + source.charCodeAt(index);
        hash |= 0;
    }

    return Math.abs(hash);
};

export const getVehicleTrackColor = (vehicleId) => TRACK_COLOR_PALETTE[hashVehicleId(vehicleId) % TRACK_COLOR_PALETTE.length];
