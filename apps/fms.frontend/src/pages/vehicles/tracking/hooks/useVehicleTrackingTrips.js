/**
 * File: useVehicleTrackingTrips.js
 * Purpose: Polls persisted trip groups for the tracking workspace, merges SignalR trip events,
 *          and exposes Redux-backed summaries for tracking surfaces.
 * Dependencies: React, React Redux, vehicleTripsSlice, vehicleTrackingSignalRService.
 * Last Modified: 2026-03-11
 */
import { useCallback, useEffect, useMemo, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import vehicleTrackingSignalRService from "../../../../signalR/vehicleTrackingSignalRService";
import { isTripInProgress } from "../../trips/utils/vehicleTripUi";
import {
    fetchVehicleTrips,
    mergeTripCompleted,
    mergeTripInProgress,
    mergeTripStarted,
} from "../../../../redux/slices/vehicleTripsSlice";

const LOOKBACK_HOURS = 24;
const POLL_INTERVAL_MS = 30000;

const buildQueryWindow = () => {
    const now = new Date();
    const fromUtc = new Date(now.getTime() - LOOKBACK_HOURS * 60 * 60 * 1000);
    const toUtc = new Date(now.getTime() + 2 * 60 * 60 * 1000);

    return {
        fromUtc: fromUtc.toISOString(),
        toUtc: toUtc.toISOString(),
    };
};

const useVehicleTrackingTrips = ({ enabled = true } = {}) => {
    const dispatch = useDispatch();
    const tripGroups = useSelector((state) => state.vehicleTrips.tripGroups);
    const isLoading = useSelector((state) => state.vehicleTrips.isLoading);
    const lastUpdated = useSelector((state) => state.vehicleTrips.lastUpdated);
    const refreshTimeoutRef = useRef(null);

    const refreshTrips = useCallback(async () => {
        if (!enabled) {
            return [];
        }

        const result = await dispatch(fetchVehicleTrips(buildQueryWindow()));
        return result.payload?.tripGroups || [];
    }, [dispatch, enabled]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        refreshTrips();
        const timer = window.setInterval(() => {
            refreshTrips();
        }, POLL_INTERVAL_MS);

        return () => window.clearInterval(timer);
    }, [enabled, refreshTrips]);

    useEffect(() => {
        if (!enabled) {
            return undefined;
        }

        const scheduleRefresh = () => {
            if (refreshTimeoutRef.current) {
                return;
            }

            refreshTimeoutRef.current = window.setTimeout(() => {
                refreshTimeoutRef.current = null;
                refreshTrips();
            }, 2000);
        };

        const unsubscribeTripStarted = vehicleTrackingSignalRService.on("tripStarted", (event) => {
            dispatch(mergeTripStarted(event));
            scheduleRefresh();
        });

        const unsubscribeTripInProgress = vehicleTrackingSignalRService.on("tripInProgress", (event) => {
            dispatch(mergeTripInProgress(event));
        });

        const unsubscribeTripCompleted = vehicleTrackingSignalRService.on("tripCompleted", (event) => {
            dispatch(mergeTripCompleted(event));
            scheduleRefresh();
        });

        return () => {
            unsubscribeTripStarted();
            unsubscribeTripInProgress();
            unsubscribeTripCompleted();

            if (refreshTimeoutRef.current) {
                window.clearTimeout(refreshTimeoutRef.current);
                refreshTimeoutRef.current = null;
            }
        };
    }, [dispatch, enabled, refreshTrips]);

    const inProgressTrips = useMemo(() => {
        return tripGroups.filter((tripGroup) => isTripInProgress(tripGroup.status));
    }, [tripGroups]);

    const recentTrips = useMemo(() => {
        return [...tripGroups].sort((left, right) => {
            const leftTime = new Date(left.endTimeUtc || left.startTimeUtc || 0).getTime();
            const rightTime = new Date(right.endTimeUtc || right.startTimeUtc || 0).getTime();
            return rightTime - leftTime;
        });
    }, [tripGroups]);

    const lowConfidenceCount = useMemo(() => {
        return tripGroups.filter((tripGroup) => Number(tripGroup.confidenceScore || 0) < 0.8).length;
    }, [tripGroups]);

    return {
        tripGroups,
        inProgressTrips,
        recentTrips,
        lowConfidenceCount,
        isLoading,
        lastUpdated,
        refreshTrips,
    };
};

export default useVehicleTrackingTrips;
