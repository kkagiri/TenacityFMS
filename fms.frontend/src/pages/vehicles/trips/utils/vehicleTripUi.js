/**
 * File: vehicleTripUi.js
 * Purpose: Shared trip-management formatters, badge metadata, and normalization helpers for vehicle trip UI.
 * Dependencies: None.
 * Last Modified: 2026-03-11
 */

const MOVEMENT_PROFILE_MAP = {
  0: "Undefined",
  1: "Geofence",
  2: "Cluster",
  Undefined: "Undefined",
  Geofence: "Geofence",
  Cluster: "Cluster",
  SiteToSite: "Geofence",
  Shuttle: "Cluster",
};

const TRIP_STATUS_MAP = {
  1: { label: "In progress", tone: "info" },
  2: { label: "Completed", tone: "success" },
  InProgress: { label: "In progress", tone: "info" },
  Completed: { label: "Completed", tone: "success" },
};

const GROUPING_TYPE_MAP = {
  0: "None",
  1: "Single leg",
  2: "Round trip",
  3: "Load cycle",
  None: "None",
  SingleLeg: "Single leg",
  RoundTrip: "Round trip",
  LoadCycle: "Load cycle",
};

const RECONCILIATION_MAP = {
  0: { label: "Pending", tone: "neutral" },
  1: { label: "Confirmed", tone: "success" },
  2: { label: "Split", tone: "warning" },
  3: { label: "Merged", tone: "info" },
  4: { label: "Adjusted", tone: "info" },
  5: { label: "Anomaly", tone: "danger" },
  Pending: { label: "Pending", tone: "neutral" },
  Confirmed: { label: "Confirmed", tone: "success" },
  Split: { label: "Split", tone: "warning" },
  Merged: { label: "Merged", tone: "info" },
  Adjusted: { label: "Adjusted", tone: "info" },
  Anomaly: { label: "Anomaly", tone: "danger" },
};

const ANOMALY_FLAG_MAP = [
  { bit: 1, key: "LowConfidence", label: "Low confidence", tone: "warning" },
  { bit: 2, key: "UnknownOriginOrDestination", label: "Unknown endpoint", tone: "warning" },
  { bit: 4, key: "GpsGapSuspected", label: "GPS gap", tone: "warning" },
  { bit: 8, key: "OffSiteIdleSuspected", label: "Off-site idle", tone: "warning" },
  { bit: 16, key: "UnmatchedReturn", label: "Unmatched return", tone: "warning" },
  { bit: 32, key: "MissingFuelData", label: "Missing fuel", tone: "warning" },
  { bit: 64, key: "NegativeFuelConsumption", label: "Negative fuel", tone: "danger" },
  { bit: 128, key: "UnrealisticSpeed", label: "Speed spike", tone: "danger" },
  { bit: 256, key: "AsymmetricCycle", label: "Asymmetric cycle", tone: "warning" },
  { bit: 512, key: "NoReturnToOrigin", label: "No return", tone: "warning" },
  { bit: 1024, key: "WeakFuelData", label: "Weak fuel data", tone: "warning" },
  { bit: 2048, key: "SuspiciousFuelRate", label: "Suspicious fuel rate", tone: "danger" },
];

export const PLANNING_ENTITY_PLACEHOLDERS = [
  { label: "Project", value: "Not linked", control: "SelectBox", source: "GET /projects?siteId={originSiteId}", cascade: null },
  { label: "Work day", value: "Not linked", control: "SelectBox", source: "GET /projects/{projectId}/workdays", cascade: "Project" },
  { label: "Work zone", value: "Not linked", control: "SelectBox", source: "GET /projects/{projectId}/zones", cascade: "Project" },
  { label: "Haul route", value: "Not linked", control: "SelectBox", source: "GET /projects/{projectId}/haulroutes", cascade: "Project" },
  { label: "Vehicle assignment", value: "Reserved", control: "ReadOnly", source: "Auto-resolved from project + date", cascade: "Project" },
];

export const PLANNING_GEO_ZONE_TYPES = [
  { key: "Section", label: "Section", icon: "fa-light fa-grid-dividers", color: "#0078d4" },
  { key: "BorrowPit", label: "Borrow pit", icon: "fa-light fa-shovel", color: "#ca5010" },
  { key: "DumpPoint", label: "Dump point", icon: "fa-light fa-truck-ramp-box", color: "#107c10" },
  { key: "Corridor", label: "Corridor", icon: "fa-light fa-road", color: "#6b21a8" },
];

export const PLANNING_RULE_PLACEHOLDERS = [
  { key: "tripToPlanMatching", label: "Trip-to-plan matching rules", location: "Planning zones & boundaries tab" },
  { key: "outOfBoundsThreshold", label: "Out-of-bounds threshold", location: "Planning zones & boundaries tab" },
  { key: "nonProductiveToggle", label: "Non-productive reporting toggle", location: "Planning zones & boundaries tab" },
];

export const PLAN_MATCH_STATUS_MAP = {
  Matched: { label: "Matched", tone: "success" },
  Unmatched: { label: "Unmatched", tone: "danger" },
  Partial: { label: "Partial", tone: "warning" },
  0: { label: "Unmatched", tone: "danger" },
  1: { label: "Matched", tone: "success" },
  2: { label: "Partial", tone: "warning" },
};

export const getPlanMatchConfig = (status) => {
  return PLAN_MATCH_STATUS_MAP[status] || { label: String(status || "—"), tone: "neutral" };
};

const pickValue = (source, keys = [], fallback = undefined) => {
  if (!source) {
    return fallback;
  }

  for (const key of keys) {
    const value = source?.[key];
    if (value !== undefined && value !== null) {
      return value;
    }
  }

  return fallback;
};

export const toNumber = (value, fallback = 0) => {
  if (value === null || value === undefined || value === "") {
    return fallback;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

export const toNullableNumber = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

export const getMovementProfileLabel = (movementProfile) => {
  if (movementProfile === null || movementProfile === undefined || movementProfile === "") {
    return "Undefined";
  }

  return MOVEMENT_PROFILE_MAP[movementProfile] || String(movementProfile);
};

export const getTripStatusConfig = (status) => {
  return TRIP_STATUS_MAP[status] || { label: String(status || "Unknown"), tone: "neutral" };
};

export const isTripInProgress = (status) => {
  return getTripStatusConfig(status).label === "In progress";
};

export const getGroupingTypeLabel = (groupingType) => {
  return GROUPING_TYPE_MAP[groupingType] || String(groupingType || "Single leg");
};

export const getReconciliationConfig = (value) => {
  return RECONCILIATION_MAP[value] || { label: String(value || "Pending"), tone: "neutral" };
};

export const getConfidenceConfig = (score, band) => {
  const numericScore = toNumber(score, 1);
  const normalizedBand = typeof band === "string" ? band.toLowerCase() : "";

  if (normalizedBand === "low" || numericScore < 0.55) {
    return { label: `Low · ${numericScore.toFixed(2)}`, tone: "danger" };
  }

  if (normalizedBand === "medium" || numericScore < 0.8) {
    return { label: `Medium · ${numericScore.toFixed(2)}`, tone: "warning" };
  }

  return { label: `High · ${numericScore.toFixed(2)}`, tone: "success" };
};

const parseAnomalyFlagsFromString = (flags) => {
  if (!flags || flags === "None") {
    return [];
  }

  return String(flags)
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)
    .map((item) => {
      const normalizedKey = item.replace(/\s+/g, "");
      return ANOMALY_FLAG_MAP.find((flag) => flag.key === normalizedKey || flag.label === item) || {
        key: normalizedKey,
        label: item,
        tone: "warning",
      };
    });
};

export const getAnomalyItems = (flags) => {
  if (typeof flags === "string") {
    return parseAnomalyFlagsFromString(flags);
  }

  const numericFlags = toNumber(flags, 0);
  if (!numericFlags) {
    return [];
  }

  return ANOMALY_FLAG_MAP.filter((flag) => (numericFlags & flag.bit) === flag.bit);
};

export const formatDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString();
};

export const formatShortDateTime = (value) => {
  if (!value) {
    return "—";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "—";
  }

  return parsed.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

export const formatDistance = (value) => `${toNumber(value, 0).toFixed(2)} km`;

export const formatDuration = (value) => {
  const totalMinutes = Math.max(0, Math.round(toNumber(value, 0)));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours <= 0) {
    return `${minutes} min`;
  }

  if (minutes === 0) {
    return `${hours} hr`;
  }

  return `${hours} hr ${minutes} min`;
};

export const formatFuel = (value) => {
  const parsed = toNullableNumber(value);
  return parsed === null ? "—" : `${parsed.toFixed(2)} L`;
};

export const buildDateTimeLocalValue = (value) => {
  if (!value) {
    return "";
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return "";
  }

  const offset = parsed.getTimezoneOffset();
  const localDate = new Date(parsed.getTime() - offset * 60 * 1000);
  return localDate.toISOString().slice(0, 16);
};

export const parseDateTimeLocalValue = (value) => {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

export const normalizeTripLeg = (trip = {}) => {
  const status = pickValue(trip, ["status", "Status"], 2);
  const movementProfile = pickValue(trip, ["movementProfile", "MovementProfile"], 1);
  const groupingType = pickValue(trip, ["groupingType", "GroupingType"], 1);
  const reconciliationStatus = pickValue(trip, ["reconciliationStatus", "ReconciliationStatus"], 0);
  const confidenceScore = toNumber(pickValue(trip, ["confidenceScore", "ConfidenceScore"], 1), 1);
  const anomalyFlags = pickValue(trip, ["anomalyFlags", "AnomalyFlags"], 0);

  return {
    vehicleTripId: toNumber(pickValue(trip, ["vehicleTripId", "VehicleTripId"]), 0),
    sequenceNo: toNumber(pickValue(trip, ["sequenceNo", "SequenceNo"]), 0),
    startTimeUtc: pickValue(trip, ["startTimeUtc", "StartTimeUtc"]),
    endTimeUtc: pickValue(trip, ["endTimeUtc", "EndTimeUtc"]),
    originSiteId: toNullableNumber(pickValue(trip, ["originSiteId", "OriginSiteId"])),
    originSiteName: pickValue(trip, ["originSiteName", "OriginSiteName"], null),
    originDisplayName: pickValue(trip, ["originDisplayName", "OriginDisplayName"], "Unknown"),
    destinationSiteId: toNullableNumber(pickValue(trip, ["destinationSiteId", "DestinationSiteId"])),
    destinationSiteName: pickValue(trip, ["destinationSiteName", "DestinationSiteName"], null),
    destinationDisplayName: pickValue(trip, ["destinationDisplayName", "DestinationDisplayName"], "Unknown"),
    startLatitude: toNumber(pickValue(trip, ["startLatitude", "StartLatitude"]), 0),
    startLongitude: toNumber(pickValue(trip, ["startLongitude", "StartLongitude"]), 0),
    endLatitude: toNumber(pickValue(trip, ["endLatitude", "EndLatitude"]), 0),
    endLongitude: toNumber(pickValue(trip, ["endLongitude", "EndLongitude"]), 0),
    distanceKm: toNumber(pickValue(trip, ["distanceKm", "DistanceKm"]), 0),
    durationMinutes: toNumber(pickValue(trip, ["durationMinutes", "DurationMinutes"]), 0),
    maxSpeedKph: toNullableNumber(pickValue(trip, ["maxSpeedKph", "MaxSpeedKph"])),
    fuelAtDeparture: toNullableNumber(pickValue(trip, ["fuelAtDeparture", "FuelAtDeparture"])),
    fuelAtArrival: toNullableNumber(pickValue(trip, ["fuelAtArrival", "FuelAtArrival"])),
    fuelConsumed: toNullableNumber(pickValue(trip, ["fuelConsumed", "FuelConsumed"])),
    status,
    statusLabel: getTripStatusConfig(status).label,
    movementProfile,
    movementProfileLabel: getMovementProfileLabel(movementProfile),
    detectionMode: pickValue(trip, ["detectionMode", "DetectionMode"], "Geofence"),
    groupingType,
    groupingTypeLabel: getGroupingTypeLabel(groupingType),
    confidenceScore,
    confidenceBand: pickValue(trip, ["confidenceBand", "ConfidenceBand"], "High"),
    anomalyFlags,
    anomalyItems: getAnomalyItems(anomalyFlags),
    reconciliationStatus,
    reconciliationLabel: getReconciliationConfig(reconciliationStatus).label,
  };
};

export const normalizeTripGroup = (group = {}) => {
  const status = pickValue(group, ["status", "Status"], 2);
  const movementProfile = pickValue(group, ["movementProfile", "MovementProfile"], 1);
  const groupingType = pickValue(group, ["groupingType", "GroupingType"], 1);
  const reconciliationStatus = pickValue(group, ["reconciliationStatus", "ReconciliationStatus"], 0);
  const confidenceScore = toNumber(pickValue(group, ["confidenceScore", "ConfidenceScore"], 1), 1);
  const anomalyFlags = pickValue(group, ["anomalyFlags", "AnomalyFlags"], 0);
  const projectLocationLabel = pickValue(group, [
    "projectLocationName",
    "ProjectLocationName",
    "projectLocationLabel",
    "ProjectLocationLabel",
    "originProjectLocationName",
    "OriginProjectLocationName",
    "destinationProjectLocationName",
    "DestinationProjectLocationName",
  ], null);
  const siteClassificationLabel = pickValue(group, [
    "siteName",
    "SiteName",
    "originSiteName",
    "OriginSiteName",
    "destinationSiteName",
    "DestinationSiteName",
  ], null);

  return {
    vehicleTripGroupId: toNumber(pickValue(group, ["vehicleTripGroupId", "VehicleTripGroupId"]), 0),
    vehicleId: toNumber(pickValue(group, ["vehicleId", "VehicleId"]), 0),
    vehicleLabel: pickValue(group, ["vehicleLabel", "VehicleLabel"], "Unknown vehicle"),
    numberPlate: pickValue(group, ["numberPlate", "NumberPlate"], null),
    tripDate: pickValue(group, ["tripDate", "TripDate"]),
    startTimeUtc: pickValue(group, ["startTimeUtc", "StartTimeUtc"]),
    endTimeUtc: pickValue(group, ["endTimeUtc", "EndTimeUtc"]),
    originSiteId: toNullableNumber(pickValue(group, ["originSiteId", "OriginSiteId"])),
    originSiteName: pickValue(group, ["originSiteName", "OriginSiteName"], null),
    originDisplayName: pickValue(group, ["originDisplayName", "OriginDisplayName"], "Unknown"),
    destinationSiteId: toNullableNumber(pickValue(group, ["destinationSiteId", "DestinationSiteId"])),
    destinationSiteName: pickValue(group, ["destinationSiteName", "DestinationSiteName"], null),
    destinationDisplayName: pickValue(group, ["destinationDisplayName", "DestinationDisplayName"], "Unknown"),
    tripCount: toNumber(pickValue(group, ["tripCount", "TripCount"]), 0),
    totalDistanceKm: toNumber(pickValue(group, ["totalDistanceKm", "TotalDistanceKm"]), 0),
    totalDurationMinutes: toNumber(pickValue(group, ["totalDurationMinutes", "TotalDurationMinutes"]), 0),
    totalFuelConsumed: toNullableNumber(pickValue(group, ["totalFuelConsumed", "TotalFuelConsumed"])),
    status,
    statusLabel: getTripStatusConfig(status).label,
    movementProfile,
    movementProfileLabel: getMovementProfileLabel(movementProfile),
    detectionMode: pickValue(group, ["detectionMode", "DetectionMode"], "Geofence"),
    groupingType,
    groupingTypeLabel: getGroupingTypeLabel(groupingType),
    confidenceScore,
    confidenceBand: pickValue(group, ["confidenceBand", "ConfidenceBand"], "High"),
    anomalyFlags,
    anomalyItems: getAnomalyItems(anomalyFlags),
    reconciliationStatus,
    reconciliationLabel: getReconciliationConfig(reconciliationStatus).label,
    classificationSourceType: projectLocationLabel ? "ProjectLocation" : "Site",
    classificationSourceLabel: projectLocationLabel || siteClassificationLabel || null,
    projectId: toNullableNumber(pickValue(group, ["projectId", "ProjectId"])),
    projectLabel: pickValue(group, ["projectLabel", "ProjectLabel", "projectName", "ProjectName"], null),
    workDayId: toNullableNumber(pickValue(group, ["workDayId", "WorkDayId"])),
    workDayLabel: pickValue(group, ["workDayLabel", "WorkDayLabel"], null),
    workZoneId: toNullableNumber(pickValue(group, ["workZoneId", "WorkZoneId"])),
    workZoneLabel: pickValue(group, ["workZoneLabel", "WorkZoneLabel"], null),
    haulRouteId: toNullableNumber(pickValue(group, ["haulRouteId", "HaulRouteId"])),
    haulRouteLabel: pickValue(group, ["haulRouteLabel", "HaulRouteLabel"], null),
    vehicleAssignmentLabel: pickValue(group, ["vehicleAssignmentLabel", "VehicleAssignmentLabel"], null),
    vehicleAssignmentActive: Boolean(pickValue(group, ["vehicleAssignmentActive", "VehicleAssignmentActive"], false)),
    planMatchStatus: pickValue(group, ["planMatchStatus", "PlanMatchStatus"], null),
    planMatchScore: toNullableNumber(pickValue(group, ["planMatchScore", "PlanMatchScore"])),
    isOutOfBounds: Boolean(pickValue(group, ["isOutOfBounds", "IsOutOfBounds"], false)),
    outOfBoundsDurationMinutes: toNullableNumber(pickValue(group, ["outOfBoundsDurationMinutes", "OutOfBoundsDurationMinutes"])),
    outOfBoundsDistanceKm: toNullableNumber(pickValue(group, ["outOfBoundsDistanceKm", "OutOfBoundsDistanceKm"])),
    isProductive: pickValue(group, ["isProductive", "IsProductive"], null),
    originGeoZone: pickValue(group, ["originGeoZone", "OriginGeoZone"], null),
    destinationGeoZone: pickValue(group, ["destinationGeoZone", "DestinationGeoZone"], null),
    corridorGeoZone: pickValue(group, ["corridorGeoZone", "CorridorGeoZone"], null),
    corridorCoverage: toNullableNumber(pickValue(group, ["corridorCoverage", "CorridorCoverage"])),
  };
};

export const normalizeTripDetail = (detail = {}) => {
  const normalizedGroup = normalizeTripGroup(detail);

  return {
    ...normalizedGroup,
    trips: Array.isArray(pickValue(detail, ["trips", "Trips"], []))
      ? pickValue(detail, ["trips", "Trips"], []).map(normalizeTripLeg)
      : [],
  };
};
