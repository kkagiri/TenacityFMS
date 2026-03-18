/**
 * File: vehicleTripsSlice.js
 * Purpose: Redux Toolkit state for realtime and persisted vehicle trip groups used by tracking and trip-management UI.
 * Dependencies: @reduxjs/toolkit, vehicleTripService, vehicleTripUi helpers.
 * Last Modified: 2026-03-12
 *
 * Key Functions:
 * - fetchVehicleTrips(): Loads trip groups for the active query window.
 * - fetchVehicleTripGroupDetail(): Caches drill-down detail by trip-group id.
 * - mergeTripStarted(): Upserts an in-progress trip group from SignalR.
 * - mergeTripInProgress(): Merges distance and duration updates from SignalR.
 * - mergeTripCompleted(): Marks a trip group completed and merges its final totals.
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
    fetchVehicleTripDetail,
    fetchVehicleTripList,
} from "../../pages/vehicles/trips/services/vehicleTripService";
import {
    getAnomalyItems,
    getGroupingTypeLabel,
    getMovementProfileLabel,
    getReconciliationConfig,
    getTripStatusConfig,
    toNullableNumber,
    toNumber,
} from "../../pages/vehicles/trips/utils/vehicleTripUi";

const pickEventValue = (source, camelKey, pascalKey, fallback = undefined) => {
    if (!source) {
        return fallback;
    }

    const value = source?.[camelKey] ?? source?.[pascalKey];
    return value ?? fallback;
};

const buildRealtimeTripGroup = (payload = {}, existingGroup = null) => {
    const startedAtUtc = pickEventValue(payload, "startedAtUtc", "StartedAtUtc", existingGroup?.startTimeUtc ?? null);
    const completedAtUtc = pickEventValue(payload, "completedAtUtc", "CompletedAtUtc", existingGroup?.endTimeUtc ?? null);
    const eventTimeUtc = pickEventValue(payload, "eventTimeUtc", "EventTimeUtc", existingGroup?.endTimeUtc ?? null);
    const originSiteName = pickEventValue(payload, "originSiteName", "OriginSiteName", existingGroup?.originDisplayName ?? "Unknown origin");
    const destinationName =
        pickEventValue(payload, "destinationSiteName", "DestinationSiteName") ??
        pickEventValue(payload, "estimatedDestinationName", "EstimatedDestinationName") ??
        existingGroup?.destinationDisplayName ??
        "Awaiting destination";
    const status = toNumber(pickEventValue(payload, "status", "Status", existingGroup?.status ?? 1), existingGroup?.status ?? 1);
    const movementProfile = existingGroup?.movementProfile ?? 0;
    const groupingType = existingGroup?.groupingType ?? 0;
    const reconciliationStatus = existingGroup?.reconciliationStatus ?? 0;
    const anomalyFlags = existingGroup?.anomalyFlags ?? 0;

    return {
        vehicleTripGroupId: toNumber(
            pickEventValue(payload, "vehicleTripGroupId", "VehicleTripGroupId", existingGroup?.vehicleTripGroupId ?? 0),
            existingGroup?.vehicleTripGroupId ?? 0,
        ),
        vehicleId: toNumber(pickEventValue(payload, "vehicleId", "VehicleId", existingGroup?.vehicleId ?? 0), existingGroup?.vehicleId ?? 0),
        vehicleLabel: pickEventValue(payload, "vehicleLabel", "VehicleLabel", existingGroup?.vehicleLabel ?? "Unknown vehicle"),
        numberPlate: existingGroup?.numberPlate ?? null,
        tripDate: (startedAtUtc || completedAtUtc || eventTimeUtc || existingGroup?.tripDate || null),
        startTimeUtc: startedAtUtc || existingGroup?.startTimeUtc || eventTimeUtc || null,
        endTimeUtc: completedAtUtc || existingGroup?.endTimeUtc || null,
        originSiteId: toNullableNumber(pickEventValue(payload, "originSiteId", "OriginSiteId", existingGroup?.originSiteId ?? null)),
        originSiteName,
        originDisplayName: originSiteName,
        destinationSiteId: toNullableNumber(
            pickEventValue(payload, "destinationSiteId", "DestinationSiteId",
                pickEventValue(payload, "estimatedDestinationSiteId", "EstimatedDestinationSiteId", existingGroup?.destinationSiteId ?? null)),
        ),
        destinationSiteName: destinationName,
        destinationDisplayName: destinationName,
        tripCount: existingGroup?.tripCount ?? 1,
        totalDistanceKm: toNumber(pickEventValue(payload, "distanceKm", "DistanceKm", existingGroup?.totalDistanceKm ?? 0), existingGroup?.totalDistanceKm ?? 0),
        totalDurationMinutes: toNumber(
            pickEventValue(payload, "durationMinutes", "DurationMinutes", existingGroup?.totalDurationMinutes ?? 0),
            existingGroup?.totalDurationMinutes ?? 0,
        ),
        totalFuelConsumed: toNullableNumber(pickEventValue(payload, "fuelConsumed", "FuelConsumed", existingGroup?.totalFuelConsumed ?? null)),
        status,
        statusLabel: getTripStatusConfig(status).label,
        movementProfile,
        movementProfileLabel: getMovementProfileLabel(movementProfile),
        detectionMode: existingGroup?.detectionMode ?? "Realtime",
        groupingType,
        groupingTypeLabel: getGroupingTypeLabel(groupingType),
        confidenceScore: existingGroup?.confidenceScore ?? 1,
        confidenceBand: existingGroup?.confidenceBand ?? "High",
        anomalyFlags,
        anomalyItems: getAnomalyItems(anomalyFlags),
        reconciliationStatus,
        reconciliationLabel: getReconciliationConfig(reconciliationStatus).label,
    };
};

const upsertTripGroup = (tripGroups, payload) => {
    const incomingGroupId = toNumber(pickEventValue(payload, "vehicleTripGroupId", "VehicleTripGroupId", 0), 0);
    const incomingVehicleId = toNumber(pickEventValue(payload, "vehicleId", "VehicleId", 0), 0);
    const existingIndex = tripGroups.findIndex((tripGroup) => {
        if (incomingGroupId > 0 && tripGroup.vehicleTripGroupId === incomingGroupId) {
            return true;
        }

        return incomingVehicleId > 0 && tripGroup.vehicleId === incomingVehicleId && getTripStatusConfig(tripGroup.status).label === "In progress";
    });

    if (existingIndex >= 0) {
        tripGroups[existingIndex] = buildRealtimeTripGroup(payload, tripGroups[existingIndex]);
        return;
    }

    tripGroups.unshift(buildRealtimeTripGroup(payload, null));
};

export const fetchVehicleTrips = createAsyncThunk(
    "vehicleTrips/fetchVehicleTrips",
    async (params = {}) => {
        const tripGroups = await fetchVehicleTripList(params);
        return { params, tripGroups };
    },
);

export const fetchVehicleTripGroupDetail = createAsyncThunk(
    "vehicleTrips/fetchVehicleTripGroupDetail",
    async (vehicleTripGroupId) => {
        const detail = await fetchVehicleTripDetail(vehicleTripGroupId);
        return {
            vehicleTripGroupId,
            detail,
        };
    },
);

const initialState = {
    tripGroups: [],
    detailById: {},
    invalidatedGroupIds: [],
    isLoading: false,
    isDetailLoading: false,
    lastQuery: null,
    lastUpdated: null,
    error: null,
};

const vehicleTripsSlice = createSlice({
    name: "vehicleTrips",
    initialState,
    reducers: {
        mergeTripStarted: (state, action) => {
            upsertTripGroup(state.tripGroups, action.payload);
            state.lastUpdated = new Date().toISOString();
        },
        mergeTripInProgress: (state, action) => {
            upsertTripGroup(state.tripGroups, action.payload);
            state.lastUpdated = new Date().toISOString();
        },
        mergeTripCompleted: (state, action) => {
            upsertTripGroup(state.tripGroups, action.payload);
            state.lastUpdated = new Date().toISOString();
        },
        invalidateTripGroup: (state, action) => {
            const groupId = Number(action.payload);
            if (!Number.isFinite(groupId) || groupId <= 0) {
                return;
            }

            if (!state.invalidatedGroupIds.includes(groupId)) {
                state.invalidatedGroupIds.push(groupId);
            }
        },
        clearInvalidatedTripGroups: (state) => {
            state.invalidatedGroupIds = [];
        },
        clearTripGroupDetail: (state, action) => {
            const groupId = Number(action.payload);
            if (!Number.isFinite(groupId) || groupId <= 0) {
                return;
            }

            delete state.detailById[groupId];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVehicleTrips.pending, (state, action) => {
                state.isLoading = true;
                state.error = null;
                state.lastQuery = action.meta.arg ?? null;
            })
            .addCase(fetchVehicleTrips.fulfilled, (state, action) => {
                state.isLoading = false;
                state.tripGroups = action.payload.tripGroups;
                state.lastQuery = action.payload.params;
                state.lastUpdated = new Date().toISOString();
                state.invalidatedGroupIds = [];
            })
            .addCase(fetchVehicleTrips.rejected, (state, action) => {
                state.isLoading = false;
                state.error = action.error?.message || "Failed to load vehicle trips";
            })
            .addCase(fetchVehicleTripGroupDetail.pending, (state) => {
                state.isDetailLoading = true;
            })
            .addCase(fetchVehicleTripGroupDetail.fulfilled, (state, action) => {
                state.isDetailLoading = false;
                if (action.payload.detail) {
                    state.detailById[action.payload.vehicleTripGroupId] = action.payload.detail;

                    const index = state.tripGroups.findIndex(
                        (tripGroup) => tripGroup.vehicleTripGroupId === action.payload.vehicleTripGroupId,
                    );

                    if (index >= 0) {
                        state.tripGroups[index] = {
                            ...state.tripGroups[index],
                            ...action.payload.detail,
                        };
                    }
                }
            })
            .addCase(fetchVehicleTripGroupDetail.rejected, (state, action) => {
                state.isDetailLoading = false;
                state.error = action.error?.message || "Failed to load trip detail";
            });
    },
});

export const {
    clearInvalidatedTripGroups,
    clearTripGroupDetail,
    invalidateTripGroup,
    mergeTripCompleted,
    mergeTripInProgress,
    mergeTripStarted,
} = vehicleTripsSlice.actions;

export default vehicleTripsSlice.reducer;