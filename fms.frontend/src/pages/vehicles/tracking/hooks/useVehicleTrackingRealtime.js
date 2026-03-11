/**
 * File: useVehicleTrackingRealtime.js
 * Purpose: Listens to real-time tracking updates from the vehicleTrackingSignalRService singleton
 *          and merges them into the current vehicle list. Connection lifecycle is owned by
 *          SignalRConnectionManager (route-based); this hook only subscribes and listens.
 * Dependencies: React hooks, vehicleTrackingSignalRService, vehicleTrackingHelpers
 * Last Modified: 2026-03-10
 *
 * Key Functions:
 * - useVehicleTrackingRealtime(): Subscribes to live location and connection updates for the active tracking view
 */
import { useEffect, useState, useRef } from 'react';
import vehicleTrackingSignalRService, { ConnectionState } from '../../../../signalR/vehicleTrackingSignalRService';
import { getVehicleHeading, getVehicleSpeed, isVehicleMoving } from '../utils/vehicleTrackingHelpers';

export default function useVehicleTrackingRealtime({
    selectedVehicleId,
    setVehicles,
    setSelectedVehicle,
    setLastRefresh,
}) {
    const [connectionState, setConnectionState] = useState(vehicleTrackingSignalRService.state);
    const startAttemptedRef = useRef(false);
    const pendingLocationUpdatesRef = useRef(new Map());
    const pendingConnectionStatusesRef = useRef(new Map());
    const flushTimeoutRef = useRef(null);
    const lastRefreshTimestampRef = useRef(0);

    // ── Effect 1: Register event listeners and ensure the connection is alive ──
    // The SignalRConnectionManager owns start/stop lifecycle for the singleton.
    // We call start() here ONLY as a safety-net (no-op when already connected).
    // We intentionally do NOT call stop() on cleanup – the manager does that on
    // route change.  Calling stop() here previously killed the shared connection
    // when React re-mounted the component (StrictMode double-mount, key changes).
    useEffect(() => {
        let isMounted = true;

        const mergeVehicleLocation = (previousVehicle, location) => ({
            ...previousVehicle,
            latitude: location.latitude,
            longitude: location.longitude,
            speed: getVehicleSpeed({ ...previousVehicle, speed: location.speed, speedKmh: location.speedKmh }),
            heading: getVehicleHeading({ ...previousVehicle, heading: location.heading }),
            address: location.address ?? previousVehicle.address,
            isOnline: location.isOnline ?? previousVehicle.isOnline,
            lastUpdated: location.lastUpdated || location.utc || new Date(),
            lastMovedAt: location.lastMovedAt ?? previousVehicle.lastMovedAt,
            movementSource: location.movementSource ?? previousVehicle.movementSource,
            ignitionOn: location.ignitionOn ?? previousVehicle.ignitionOn,
            isParked: location.isParked ?? previousVehicle.isParked,
            operationalStatus: location.operationalStatus ?? previousVehicle.operationalStatus,
            isMoving: isVehicleMoving({
                ...previousVehicle,
                speed: location.speed ?? previousVehicle.speed,
                speedKmh: location.speedKmh,
                isMoving: location.isMoving,
            }),
        });

        const mergeVehicleConnectionStatus = (previousVehicle, status) => ({
            ...previousVehicle,
            isOnline: status.isOnline,
            lastUpdated: new Date(),
        });

        const clearScheduledFlush = () => {
            if (flushTimeoutRef.current) {
                clearTimeout(flushTimeoutRef.current);
                flushTimeoutRef.current = null;
            }
        };

        const flushPendingUpdates = () => {
            clearScheduledFlush();

            const locationUpdates = pendingLocationUpdatesRef.current;
            const connectionStatuses = pendingConnectionStatusesRef.current;

            if (locationUpdates.size === 0 && connectionStatuses.size === 0) {
                return;
            }

            pendingLocationUpdatesRef.current = new Map();
            pendingConnectionStatusesRef.current = new Map();

            setVehicles((previousVehicles) => {
                let hasChanges = false;

                const updatedVehicles = previousVehicles.map((vehicle) => {
                    const location = locationUpdates.get(vehicle.id);
                    const status = connectionStatuses.get(vehicle.id);

                    if (!location && !status) {
                        return vehicle;
                    }

                    let nextVehicle = vehicle;

                    if (location) {
                        nextVehicle = mergeVehicleLocation(nextVehicle, location);
                    }

                    if (status) {
                        nextVehicle = mergeVehicleConnectionStatus(nextVehicle, status);
                    }

                    if (nextVehicle !== vehicle) {
                        hasChanges = true;
                    }

                    return nextVehicle;
                });

                return hasChanges ? updatedVehicles : previousVehicles;
            });

            setSelectedVehicle((previous) => {
                if (!previous?.id) {
                    return previous;
                }

                const location = locationUpdates.get(previous.id);
                const status = connectionStatuses.get(previous.id);

                if (!location && !status) {
                    return previous;
                }

                let nextVehicle = previous;

                if (location) {
                    nextVehicle = mergeVehicleLocation(nextVehicle, location);
                }

                if (status) {
                    nextVehicle = mergeVehicleConnectionStatus(nextVehicle, status);
                }

                return nextVehicle;
            });

            // Throttle the "Last update" timestamp to every 5 seconds so the
            // header text doesn't re-render on every single flush cycle.
            const now = Date.now();
            if (now - lastRefreshTimestampRef.current >= 5000) {
                lastRefreshTimestampRef.current = now;
                setLastRefresh(new Date());
            }
        };

        const scheduleFlush = () => {
            if (flushTimeoutRef.current) {
                return;
            }

            flushTimeoutRef.current = setTimeout(() => {
                flushPendingUpdates();
            }, 1000);
        };

        // Safety-net: if the manager hasn't started the service yet (e.g. debounce
        // delay), kick it off so we don't wait 300 ms staring at "disconnected".
        const ensureConnection = async () => {
            if (startAttemptedRef.current) return;
            startAttemptedRef.current = true;

            try {
                if (vehicleTrackingSignalRService.isConnected) {
                    if (isMounted) setConnectionState(ConnectionState.CONNECTED);
                    return;
                }

                const connected = await vehicleTrackingSignalRService.start();
                if (connected && isMounted) {
                    setConnectionState(vehicleTrackingSignalRService.state);
                }
            } catch (error) {
                console.error('[VehicleTracking] Safety-net start failed:', error);
            }
        };

        // --- Register event listeners BEFORE attempting connection ---
        const unsubscribeLocationUpdate = vehicleTrackingSignalRService.on('locationUpdate', (location) => {
            if (!location?.vehicleId) return;

            pendingLocationUpdatesRef.current.set(location.vehicleId, location);
            scheduleFlush();
        });

        const unsubscribeConnectionStatus = vehicleTrackingSignalRService.on('connectionStatus', (status) => {
            if (!status?.vehicleId) return;

            pendingConnectionStatusesRef.current.set(status.vehicleId, status);
            scheduleFlush();
        });

        const unsubscribeStateChange = vehicleTrackingSignalRService.on('stateChange', (nextState) => {
            if (isMounted) setConnectionState(nextState);
        });

        ensureConnection();

        return () => {
            isMounted = false;
            clearScheduledFlush();
            pendingLocationUpdatesRef.current.clear();
            pendingConnectionStatusesRef.current.clear();
            // DO NOT call vehicleTrackingSignalRService.stop() here.
            // The SignalRConnectionManager owns the connection lifecycle and will
            // stop the service when the user navigates away from /vehicles/tracking.
            unsubscribeLocationUpdate();
            unsubscribeConnectionStatus();
            unsubscribeStateChange();
        };
    }, [setLastRefresh, setSelectedVehicle, setVehicles]);

    // ── Effect 2: Switch between all-vehicles and vehicle-{id} subscriptions ──
    // Default state uses all-vehicles so the page can show a live fleet overview.
    // Once a vehicle is selected, we switch to vehicle-{id} only. This reduces
    // SignalR traffic and lets the selected vehicle stay live while focused.
    useEffect(() => {
        if (connectionState !== ConnectionState.CONNECTED) {
            return undefined;
        }

        let isDisposed = false;

        const syncSubscription = async () => {
            try {
                if (selectedVehicleId) {
                    const subscribed = await vehicleTrackingSignalRService.switchToVehicleMode(selectedVehicleId);
                    if (subscribed && !isDisposed) {
                        console.log(`[VehicleTracking] Subscribed to vehicle-${selectedVehicleId} live updates`);
                    }
                    return;
                }

                const subscribed = await vehicleTrackingSignalRService.switchToAllVehiclesMode();
                if (subscribed && !isDisposed) {
                    console.log('[VehicleTracking] Subscribed to all-vehicles live updates');
                }
            } catch (error) {
                if (!isDisposed) {
                    console.error('[VehicleTracking] Failed to synchronize live subscription mode:', error);
                }
            }
        };

        syncSubscription();

        return () => {
            isDisposed = true;
        };
    }, [connectionState, selectedVehicleId]);

    return {
        connectionState,
        isRealtimeConnected: connectionState === ConnectionState.CONNECTED,
    };
}
