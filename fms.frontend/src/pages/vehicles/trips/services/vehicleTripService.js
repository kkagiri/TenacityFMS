/**
 * File: vehicleTripService.js
 * Purpose: Centralizes vehicle trip API access for history, tracking timeline, and drill-down panels.
 * Dependencies: axiosInstance, vehicleTripUi normalization helpers.
 * Last Modified: 2026-03-11
 */
import axiosInstance from "../../../../api/axiosInstance";
import {
  normalizeTripDetail,
  normalizeTripGroup,
} from "../utils/vehicleTripUi";

const unwrapResponse = (response, fallbackMessage) => {
  const payload = response?.data ?? {};
  const isSuccess = payload?.isSuccess ?? payload?.success ?? payload?.Success ?? false;

  if (!isSuccess) {
    throw new Error(payload?.message || payload?.Message || fallbackMessage);
  }

  return payload?.data ?? payload?.Data ?? null;
};

const buildParams = (params = {}) => {
  return Object.entries(params).reduce((accumulator, [key, value]) => {
    if (value === undefined || value === null || value === "") {
      return accumulator;
    }

    accumulator[key] = value;
    return accumulator;
  }, {});
};

export const fetchVehicleTripList = async (params = {}) => {
  const response = await axiosInstance.get("/vehicletrips", {
    params: buildParams(params),
  });

  const data = unwrapResponse(response, "Failed to load trips");
  return Array.isArray(data) ? data.map(normalizeTripGroup) : [];
};

export const fetchVehicleTripHistory = async (vehicleId, params = {}) => {
  if (!vehicleId) {
    return [];
  }

  const response = await axiosInstance.get(`/vehicletrips/vehicle/${vehicleId}`, {
    params: buildParams(params),
  });

  const data = unwrapResponse(response, "Failed to load trip history");
  return Array.isArray(data) ? data.map(normalizeTripGroup) : [];
};

export const fetchVehicleTripDetail = async (vehicleTripGroupId) => {
  if (!vehicleTripGroupId) {
    return null;
  }

  const response = await axiosInstance.get(`/vehicletrips/${vehicleTripGroupId}`);
  const data = unwrapResponse(response, "Failed to load trip detail");
  return data ? normalizeTripDetail(data) : null;
};

export const fetchVehicleTripBreadcrumbs = async (vehicleTripGroupId, params = {}) => {
  if (!vehicleTripGroupId) {
    return [];
  }

  const response = await axiosInstance.get(`/vehicletrips/${vehicleTripGroupId}/breadcrumbs`, {
    params: buildParams(params),
  });

  const data = unwrapResponse(response, "Failed to load trip breadcrumbs");
  const points = data?.trackPoints ?? data?.TrackPoints ?? [];
  return Array.isArray(points) ? points : [];
};

export const fetchVehicleTripSettings = async () => {
  const response = await axiosInstance.get("/vehicletrips/settings");
  return unwrapResponse(response, "Failed to load trip settings");
};

export const updateVehicleTripSettings = async (settings) => {
  const response = await axiosInstance.put("/vehicletrips/settings", settings);

  return unwrapResponse(response, "Failed to update trip settings");
};

export const recomputeVehicleTrips = async ({ vehicleId, fromUtc, toUtc }) => {
  if (!vehicleId) {
    throw new Error("Vehicle is required before recompute can run");
  }

  const response = await axiosInstance.post("/vehicletrips/recompute", {
    vehicleId: Number(vehicleId),
    fromUtc,
    toUtc,
  });

  return unwrapResponse(response, "Trip recompute failed");
};

export const reconcileVehicleTrips = async ({ vehicleId, fromUtc, toUtc, previewOnly = false }) => {
  if (!vehicleId) {
    throw new Error("Vehicle is required before reconciliation can run");
  }

  const response = await axiosInstance.post("/vehicletrips/reconciliation", {
    vehicleId: Number(vehicleId),
    fromUtc,
    toUtc,
    previewOnly,
  });

  return unwrapResponse(response, "Trip reconciliation failed");
};

// Preview endpoints were removed. Trip analysis runs locally inside the Vehicle
// Tracking workspace against already-loaded track points and commits via recompute.

export const fetchTripSiteLookup = async () => {
  const response = await axiosInstance.get("/site", {
    params: { includeInactive: false },
  });

  const payload = response?.data?.data ?? response?.data?.Data ?? response?.data ?? [];
  const source = Array.isArray(payload) ? payload : [];

  return source
    .map((site) => ({
      siteId: Number(site.siteId ?? site.SiteId ?? site.id ?? site.Id ?? 0),
      label: site.name ?? site.Name ?? site.siteName ?? site.SiteName ?? "Unnamed site",
      gpsGeofenceCenterLatitude:
        site.gpsGeofenceCenterLatitude ??
        site.GpsGeofenceCenterLatitude ??
        site.centerLatitude ??
        site.CenterLatitude ??
        null,
      gpsGeofenceCenterLongitude:
        site.gpsGeofenceCenterLongitude ??
        site.GpsGeofenceCenterLongitude ??
        site.centerLongitude ??
        site.CenterLongitude ??
        null,
    }))
    .filter((site) => Number.isFinite(site.siteId) && site.siteId > 0);
};

export const splitVehicleTrip = async (payload) => {
  const response = await axiosInstance.post("/vehicletrips/override/split", payload);
  return unwrapResponse(response, "Split override failed");
};

export const mergeVehicleTrips = async (payload) => {
  const response = await axiosInstance.post("/vehicletrips/override/merge", payload);
  return unwrapResponse(response, "Merge override failed");
};

export const reassignVehicleTripSite = async (payload) => {
  const response = await axiosInstance.post("/vehicletrips/override/reassign-site", payload);
  return unwrapResponse(response, "Reassign site override failed");
};

export const addVehicleTrip = async (payload) => {
  const response = await axiosInstance.post("/vehicletrips/override/add", payload);
  return unwrapResponse(response, "Add trip override failed");
};

export const deleteVehicleTrip = async (payload) => {
  const response = await axiosInstance.post("/vehicletrips/override/delete", payload);
  return unwrapResponse(response, "Delete trip override failed");
};

export const adjustVehicleTripTimes = async (payload) => {
  const response = await axiosInstance.post("/vehicletrips/override/adjust-times", payload);
  return unwrapResponse(response, "Adjust times override failed");
};

export const fetchVehicleTripOverrideHistory = async (vehicleTripGroupId) => {
  if (!vehicleTripGroupId) {
    return [];
  }

  const response = await axiosInstance.get(`/vehicletrips/${vehicleTripGroupId}/overrides`);
  const data = unwrapResponse(response, "Failed to load override history");
  return Array.isArray(data) ? data : [];
};

/* ── Planning API stubs ── */

export const updateTripPlanningLink = async (vehicleTripGroupId, payload) => {
  const response = await axiosInstance.patch(`/vehicletrips/${vehicleTripGroupId}/planning-link`, payload);
  return unwrapResponse(response, "Failed to update planning link");
};

export const fetchProjectLookup = async (siteId) => {
  const response = await axiosInstance.get("/projects", {
    params: buildParams({ siteId }),
  });

  const data = unwrapResponse(response, "Failed to load projects");
  return Array.isArray(data) ? data : [];
};

export const fetchProjectWorkDays = async (projectId, tripDate) => {
  const response = await axiosInstance.get(`/projects/${projectId}/workdays`, {
    params: buildParams({ tripDate }),
  });

  const data = unwrapResponse(response, "Failed to load work days");
  return Array.isArray(data) ? data : [];
};

export const fetchProjectZones = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/zones`);
  const data = unwrapResponse(response, "Failed to load work zones");
  return Array.isArray(data) ? data : [];
};

export const fetchProjectHaulRoutes = async (projectId) => {
  const response = await axiosInstance.get(`/projects/${projectId}/haulroutes`);
  const data = unwrapResponse(response, "Failed to load haul routes");
  return Array.isArray(data) ? data : [];
};
