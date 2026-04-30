/**
 * File: vehicleTripUi.js
 * Purpose: Compatibility UI helpers for vehicle-trip screens.
 * Dependencies: None
 * Last Modified: 2026-04-29
 */

export const PLANNING_ENTITY_PLACEHOLDERS = {
    routeName: "Unassigned",
    originDisplayName: "Unknown origin",
    destinationDisplayName: "Unknown destination",
};

export const isTripInProgress = (status) => String(status || "").toLowerCase().includes("progress") || String(status || "").toLowerCase().includes("transit");
export const formatDistance = (value) => value == null ? "0 km" : `${Number(value).toFixed(1)} km`;
export const formatDuration = (value) => value == null ? "0 min" : `${Math.round(Number(value))} min`;
export const formatFuel = (value) => value == null ? "0 L" : `${Number(value).toFixed(1)} L`;
export const formatShortDateTime = (value) => value ? new Date(value).toLocaleString() : "-";
export const formatDateTime = formatShortDateTime;
export const buildDateTimeLocalValue = (value) => {
    const date = value ? new Date(value) : new Date();
    const pad = (part) => String(part).padStart(2, "0");
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
};
export const parseDateTimeLocalValue = (value) => value ? new Date(value) : null;
export const getMovementProfileLabel = (value) => value || "Unknown";
export const getPlanMatchConfig = (value) => ({
    tone: value ? "success" : "muted",
    label: value ? String(value) : "Not matched",
});