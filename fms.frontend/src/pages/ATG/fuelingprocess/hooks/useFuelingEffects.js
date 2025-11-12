/**
 * useFuelingEffects.js
 *
 * Custom hook to manage all side effects for the fueling process.
 * Centralizes useEffect hooks for cleaner component structure.
 *
 * Effect Categories:
 * - Data Loading (sites, device config, validation)
 * - Real-time Updates (SignalR, device status)
 * - State Synchronization (popup state, events)
 * - Connection Management
 */

import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import notify from 'devextreme/ui/notify';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { createFuelingEvent } from '../../../../redux/actions/fuelingEventActions';
import pumpControlService from '../../../../services/pumpControlService';
import ptsSignalRService from '../../../../signalR/ptsSignalRService';

export const useFuelingEffects = ({
  // Props
  ptsId,
  ptsDevice,

  // State
  state,

  // Device data
  devicePumpStatus,
  isLiveDataEnabled,
  getPumpDetails,
  validatedTag,
}) => {
  const dispatch = useDispatch();
  const previousPumpStatuses = useRef({});

  /**
   * Fetch sites when component mounts
   */
  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  /**
   * Load device configuration
   */
  useEffect(() => {
    const loadDeviceConfig = async () => {
      if (!ptsId) return;

      try {
        state.setIsLoadingDeviceConfig(true);
        const config = await pumpControlService.api.getDeviceConfig(ptsId);
        state.setDeviceConfig(config);
        console.log("[Device Config] Loaded configuration:", config);
      } catch (error) {
        console.error("[Device Config] Failed to load device configuration:", error);
        notify("Failed to load device configuration", "warning", 3000);
        // Set default config to prevent blocking
        state.setDeviceConfig({
          autoAssignUserMasterTag: false,
          isActive: true,
          isAuthenticated: true
        });
      } finally {
        state.setIsLoadingDeviceConfig(false);
      }
    };

    loadDeviceConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptsId]); // Only depend on ptsId - setState functions are stable

  /**
   * Update UI when validated tag changes
   */
  useEffect(() => {
    if (validatedTag && validatedTag.isValid) {
      state.setTagDetails(validatedTag);
      state.setVehicleInfo(validatedTag.vehicleInfo);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validatedTag]); // Only depend on validatedTag - setState functions are stable

  /**
   * Set initial loading state
   */
  useEffect(() => {
    if (ptsDevice) {
      const timer = setTimeout(() => state.setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ptsDevice]); // Only depend on ptsDevice - setState functions are stable

  /**
   * Request device status updates via SignalR
   */
  useEffect(() => {
    if (ptsId && isLiveDataEnabled) {
      if (ptsSignalRService.isConnected) {
        console.log(`[FuelingProcess] Requesting status for device ${ptsId}`);
        ptsSignalRService.requestDeviceStatus(ptsId);

        const statusInterval = setInterval(() => {
          if (ptsSignalRService.isConnected) {
            ptsSignalRService.requestDeviceStatus(ptsId);
          }
        }, 5000); // Request every 5 seconds

        return () => {
          clearInterval(statusInterval);
        };
      }
    }
  }, [ptsId, isLiveDataEnabled]);

  /**
   * Update popup state based on Redux device pump status
   */
  useEffect(() => {
    const pumpDetails = state.activePumpForPopup
      ? getPumpDetails(state.activePumpForPopup.id)
      : null;

    if (pumpDetails?.status === "fueling") {
      if (!state.isFuelingPopupMinimized) {
        state.setShowFuelingPopup(true);
      }
      state.setFuelingComplete(false);
      if (!state.currentTransactionId && pumpDetails.currentTransaction) {
        state.setCurrentTransactionId(pumpDetails.currentTransaction);
      }
    } else if (pumpDetails?.status === "endOfTransaction") {
      state.setShowFuelingPopup(false);
      state.setIsFuelingPopupMinimized(false);
      state.setFuelingComplete(true);
      state.setEotDetected(true); // Mark EOT detected for authorization step
      if (!state.currentTransactionId && pumpDetails.transaction) {
        state.setCurrentTransactionId(pumpDetails.transaction);
      }
    } else {
      if (state.showFuelingPopup && state.activePumpForPopup?.id === pumpDetails?.id) {
        state.setShowFuelingPopup(false);
        state.setIsFuelingPopupMinimized(false);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    devicePumpStatus,
    state.activePumpForPopup,
    state.showFuelingPopup,
    state.currentTransactionId,
    state.isFuelingPopupMinimized,
    getPumpDetails,
  ]); // Use specific state properties - setState functions are stable

  /**
   * Dispatch fueling events for FuelingEventsList
   */
  useEffect(() => {
    const currentStatuses = devicePumpStatus || {};
    const previousStatuses = previousPumpStatuses.current || {};

    Object.keys(currentStatuses).forEach((pumpIdStr) => {
      const pumpId = parseInt(pumpIdStr, 10);
      const current = currentStatuses[pumpId];
      const previous = previousStatuses[pumpId];

      // Skip if status hasn't changed
      if (previous?.status === current.status) return;

      console.log(
        `[Event Detection] Pump ${pumpId}: ${previous?.status} -> ${current.status}`
      );

      // Detect Transitions and Dispatch Events
      if (
        (previous?.status === "idle" || !previous) &&
        current.status === "nozzleUp"
      ) {
        dispatch(
          createFuelingEvent("nozzle", ptsId, {
            pumpId: current.id,
            nozzleNumber: current.nozzleUp,
            lastTransaction: current.lastTransaction,
            lastVolume: current.lastVolume,
            lastAmount: current.lastAmount,
          })
        );
      } else if (
        (previous?.status === "nozzleUp" || previous?.status === "idle") &&
        current.status === "fueling"
      ) {
        dispatch(
          createFuelingEvent("filling", ptsId, {
            pumpId: current.id,
            transactionId: current.currentTransaction,
            nozzleNumber: current.activeNozzle,
            transactionDetails: {
              Volume: current.currentVolume,
              Amount: current.currentAmount,
              Price: current.currentPrice,
              Tag: current.tag,
            },
          })
        );
      } else if (
        previous?.status === "fueling" &&
        current.status === "endOfTransaction"
      ) {
        dispatch(
          createFuelingEvent("completed", ptsId, {
            pumpId: current.id,
            transactionId: current.transaction,
            nozzleNumber: current.nozzle,
            transactionDetails: {
              Volume: current.volume,
              Amount: current.amount,
              Price: current.price,
              Tag: current.tag,
            },
          })
        );
      } else if (
        previous?.status !== "offline" &&
        current.status === "offline"
      ) {
        dispatch(
          createFuelingEvent("offline", ptsId, {
            pumpId: current.id,
          })
        );
      }

      // Detect Tag Read
      if (current.tag && current.tag !== previous?.tag) {
        dispatch(
          createFuelingEvent("tag", ptsId, {
            pumpId: current.id,
            tag: current.tag,
            nozzleNumber:
              current.status === "fueling"
                ? current.activeNozzle
                : current.status === "nozzleUp"
                ? current.nozzleUp
                : current.status === "endOfTransaction"
                ? current.nozzle
                : 0,
          })
        );
      }
    });

    // Update previous statuses for next comparison
    previousPumpStatuses.current = currentStatuses;
  }, [devicePumpStatus, ptsId, dispatch]);

  /**
   * Determine if device is disconnected
   */
  useEffect(() => {
    state.setIsDeviceDisconnected(state.deviceConnectionStatus === "disconnected");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.deviceConnectionStatus]); // Only depend on deviceConnectionStatus - setState functions are stable

  /**
   * Register global handler for stuck transaction manager
   */
  useEffect(() => {
    window.openStuckTransactionManager = () => {
      state.setShowStuckTransactionManager(true);
    };
    return () => {
      delete window.openStuckTransactionManager;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency - setup once on mount, setState functions are stable
};

export default useFuelingEffects;
