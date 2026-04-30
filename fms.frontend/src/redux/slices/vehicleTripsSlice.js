/**
 * File: vehicleTripsSlice.js
 * Purpose: Redux slice for persisted vehicle trip groups in the tracking workspace.
 * Dependencies: @reduxjs/toolkit, vehicleTripService
 * Last Modified: 2026-04-29
 */
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { fetchVehicleTripList } from "../../pages/vehicles/trips/services/vehicleTripService";

export const fetchVehicleTrips = createAsyncThunk(
    "vehicleTrips/fetchVehicleTrips",
    async (queryWindow) => {
        const tripGroups = await fetchVehicleTripList(queryWindow);
        return { tripGroups: Array.isArray(tripGroups) ? tripGroups : [] };
    }
);

const upsertTrip = (tripGroups, payload) => {
    if (!payload) {
        return tripGroups;
    }

    const tripId = payload.vehicleTripGroupId || payload.id;
    if (!tripId) {
        return tripGroups;
    }

    const next = [...tripGroups];
    const index = next.findIndex((item) => (item.vehicleTripGroupId || item.id) === tripId);
    if (index >= 0) {
        next[index] = { ...next[index], ...payload };
    } else {
        next.unshift(payload);
    }
    return next;
};

const vehicleTripsSlice = createSlice({
    name: "vehicleTrips",
    initialState: {
        tripGroups: [],
        isLoading: false,
        lastUpdated: null,
    },
    reducers: {
        mergeTripStarted: (state, action) => {
            state.tripGroups = upsertTrip(state.tripGroups, action.payload);
            state.lastUpdated = new Date().toISOString();
        },
        mergeTripInProgress: (state, action) => {
            state.tripGroups = upsertTrip(state.tripGroups, action.payload);
            state.lastUpdated = new Date().toISOString();
        },
        mergeTripCompleted: (state, action) => {
            state.tripGroups = upsertTrip(state.tripGroups, action.payload);
            state.lastUpdated = new Date().toISOString();
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchVehicleTrips.pending, (state) => {
                state.isLoading = true;
            })
            .addCase(fetchVehicleTrips.fulfilled, (state, action) => {
                state.isLoading = false;
                state.tripGroups = action.payload.tripGroups;
                state.lastUpdated = new Date().toISOString();
            })
            .addCase(fetchVehicleTrips.rejected, (state) => {
                state.isLoading = false;
            });
    },
});

export const { mergeTripStarted, mergeTripInProgress, mergeTripCompleted } = vehicleTripsSlice.actions;

export default vehicleTripsSlice.reducer;