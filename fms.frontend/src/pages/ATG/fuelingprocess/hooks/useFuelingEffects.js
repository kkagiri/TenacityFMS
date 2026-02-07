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
import { useDispatch, useSelector } from 'react-redux';
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
  const monitoringPumpId =
    state.transactionMonitoringData?.pumpId || state.activePumpForPopup?.id || null;
  const currentFuelingContext = useSelector((reduxState) =>
    ptsId && monitoringPumpId
      ? reduxState.realtimeStatus?.deviceFuelingContexts?.[ptsId]?.[monitoringPumpId] || null
      : null
  );

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
   * Open transaction monitoring automatically after authorization
   * and keep legacy popup hidden while monitoring owns the flow.
   */
  useEffect(() => {
    const monitoringTransactionId =
      state.transactionMonitoringData?.transactionId || state.currentTransactionId;

    if (!state.isAuthorized || !monitoringTransactionId) {
      return;
    }

    if (!state.showTransactionMonitoring) {
      state.setShowTransactionMonitoring(true);
    }

    if (state.showFuelingPopup) {
      state.setShowFuelingPopup(false);
    }

    if (state.isFuelingPopupMinimized) {
      state.setIsFuelingPopupMinimized(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.isAuthorized,
    state.currentTransactionId,
    state.transactionMonitoringData,
    state.showTransactionMonitoring,
    state.showFuelingPopup,
    state.isFuelingPopupMinimized,
  ]);

  /**
   * Keep monitoring context aligned with local operation mode and tank selection.
   * This mirrors mobile behavior where monitor display remains informative even
   * when backend context payload is delayed or partial.
   */
  useEffect(() => {
    if (!ptsId || !state.showTransactionMonitoring || !monitoringPumpId) {
      return;
    }

    const monitoringData = state.transactionMonitoringData || {};
    const isTransferMode =
      state.operationMode === "transfer" || monitoringData?.isTransfer === true;

    const selectedTank = Array.isArray(state.availableTanks)
      ? state.availableTanks.find(
          (tank) => String(tank.id) === String(state.selectedTankId)
        )
      : null;

    const sourceTankName = state.sourceTank?.name || state.sourceTank?.tankName || null;
    const sourceTankId = state.sourceTank?.id || state.sourceTank?.tankId || null;
    const destinationTankName = isTransferMode
      ? selectedTank?.name || selectedTank?.tankName || null
      : null;
    const destinationTankId = isTransferMode
      ? state.selectedTankId || monitoringData?.destinationTankId || null
      : null;

    const resolvedMode =
      currentFuelingContext?.mode ||
      (isTransferMode
        ? "Transfer"
        : state.operationMode === "vehicle"
        ? "Vehicle"
        : null) ||
      "Vehicle";

    const fallbackTankName = isTransferMode
      ? sourceTankName
      : selectedTank?.name || selectedTank?.tankName || null;

    const nextContext = {
      ...(currentFuelingContext || {}),
      pumpId: monitoringPumpId,
      mode: resolvedMode,
      tankName: currentFuelingContext?.tankName || fallbackTankName || null,
      sourceTankName: currentFuelingContext?.sourceTankName || sourceTankName || null,
      sourceTankId: currentFuelingContext?.sourceTankId || sourceTankId || null,
      destinationTankName:
        currentFuelingContext?.destinationTankName || destinationTankName || null,
      destinationTankId:
        currentFuelingContext?.destinationTankId || destinationTankId || null,
    };

    const hasContextValue = Boolean(
      nextContext.mode ||
      nextContext.tankName ||
      nextContext.sourceTankName ||
      nextContext.destinationTankName
    );

    if (!hasContextValue) {
      return;
    }

    const isChanged =
      !currentFuelingContext ||
      currentFuelingContext.mode !== nextContext.mode ||
      currentFuelingContext.tankName !== nextContext.tankName ||
      currentFuelingContext.sourceTankName !== nextContext.sourceTankName ||
      currentFuelingContext.sourceTankId !== nextContext.sourceTankId ||
      currentFuelingContext.destinationTankName !== nextContext.destinationTankName ||
      currentFuelingContext.destinationTankId !== nextContext.destinationTankId;

    if (!isChanged) {
      return;
    }

    dispatch({
      type: "UPDATE_FUELING_CONTEXTS",
      payload: {
        deviceId: ptsId,
        fuelingContexts: [nextContext],
      },
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    ptsId,
    monitoringPumpId,
    state.showTransactionMonitoring,
    state.transactionMonitoringData,
    state.operationMode,
    state.availableTanks,
    state.selectedTankId,
    state.sourceTank,
    currentFuelingContext,
    dispatch,
  ]);

  /**
   * Update popup state based on Redux device pump status
   */
  useEffect(() => {
    const pumpDetails = state.activePumpForPopup
      ? getPumpDetails(state.activePumpForPopup.id)
      : null;
    const isMonitoringVisible =
      state.showTransactionMonitoring &&
      Boolean(
        state.transactionMonitoringData?.transactionId || state.currentTransactionId
      );

    if (isMonitoringVisible) {
      if (state.showFuelingPopup) {
        state.setShowFuelingPopup(false);
      }

      if (state.isFuelingPopupMinimized) {
        state.setIsFuelingPopupMinimized(false);
      }

      if (
        pumpDetails?.status === "endOfTransaction" ||
        (pumpDetails?.status === "nozzleUp" &&
          state.isAuthorized &&
          !state.fuelingComplete)
      ) {
        state.setEotDetected(true);
      }

      // Mobile-aligned flow: do not auto-reset UI on idle while monitor is open.
      return;
    }

    if (pumpDetails?.status === "fueling") {
      if (!state.isFuelingPopupMinimized) {
        state.setShowFuelingPopup(true);
      }
      state.setFuelingComplete(false);
      if (!state.currentTransactionId && pumpDetails.currentTransaction) {
        state.setCurrentTransactionId(pumpDetails.currentTransaction);
      }
    } else if (pumpDetails?.status === "endOfTransaction" ||
               (pumpDetails?.status === "nozzleUp" && state.isAuthorized && !state.fuelingComplete)) {
      // EOT detected OR simulator pump stuck in nozzleUp after authorized fueling
      const isSimulatorNozzleUp = pumpDetails?.status === "nozzleUp";

      state.setShowFuelingPopup(false);
      state.setIsFuelingPopupMinimized(false);
      state.setFuelingComplete(true);
      state.setEotDetected(true); // Mark EOT detected for authorization step

      // Get transaction ID
      const transactionId = state.currentTransactionId || pumpDetails.transaction;

      // Try to fetch complete transaction info from PTS device
      if (transactionId && ptsId) {
        console.log(`[EOT${isSimulatorNozzleUp ? ' - Simulator NozzleUp' : ''}] Fetching transaction info for txn ${transactionId}`);

        pumpControlService.api.getTransactionInfo(ptsId, state.activePumpForPopup.id, transactionId)
          .then(response => {
            if (response?.success && response?.data) {
              const txnData = response.data;
              const finalVolume = txnData.volume ?? 0;
              const finalAmount = txnData.amount ?? 0;

              state.setCompletedVolume(finalVolume);
              state.setCompletedCost(finalAmount);

              console.log(`[EOT - API] Captured transaction values from API - Volume: ${finalVolume}L, Amount: ${finalAmount}`);
            } else {
              // Fallback to pump status data if API call fails
              const finalVolume = pumpDetails?.currentVolume ?? pumpDetails?.volume ?? 0;
              const finalPrice = pumpDetails?.currentPrice ?? pumpDetails?.price ?? 0;
              const finalCost = finalVolume * finalPrice;

              state.setCompletedVolume(finalVolume);
              state.setCompletedCost(finalCost);

              console.log(`[EOT - Fallback] Captured values from pump status - Volume: ${finalVolume}L, Cost: ${finalCost}`);
            }
          })
          .catch(error => {
            console.warn(`[EOT] Failed to fetch transaction info, using pump status:`, error);

            // Fallback to pump status data
            const finalVolume = pumpDetails?.currentVolume ?? pumpDetails?.volume ?? 0;
            const finalPrice = pumpDetails?.currentPrice ?? pumpDetails?.price ?? 0;
            const finalCost = finalVolume * finalPrice;

            state.setCompletedVolume(finalVolume);
            state.setCompletedCost(finalCost);

            console.log(`[EOT - Error Fallback] Captured values from pump status - Volume: ${finalVolume}L, Cost: ${finalCost}`);
          });
      } else {
        // No transaction ID, use pump status data
        const finalVolume = pumpDetails?.currentVolume ?? pumpDetails?.volume ?? 0;
        const finalPrice = pumpDetails?.currentPrice ?? pumpDetails?.price ?? 0;
        const finalCost = finalVolume * finalPrice;

        state.setCompletedVolume(finalVolume);
        state.setCompletedCost(finalCost);

        console.log(`[EOT - No TxnID] Captured values from pump status - Volume: ${finalVolume}L, Cost: ${finalCost}`);
      }

      if (!state.currentTransactionId && pumpDetails.transaction) {
        state.setCurrentTransactionId(pumpDetails.transaction);
      }
    } else if (pumpDetails?.status === "idle" && state.eotDetected) {
      // Nozzle has been replaced after EOT - return to pump selection
      console.log("[EOT Complete] Nozzle replaced, returning to pump selection");

      // Reset all fueling state
      state.setEotDetected(false);
      state.setFuelingComplete(false);
      state.setIsAuthorized(false);
      state.setCurrentTransactionId(null);
      state.setActivePumpForPopup(null);
      state.setActiveNozzleForPopup(null);
      state.setSelectedPump(null);
      state.setSelectedNozzle(null);
      state.setVehicleInfo(null);
      state.setTagDetails(null);
      state.setSelectedTag(null);
      state.setAmount("");
      state.setVolume("");
      state.setVehicleReg("");
      state.setSelectedVehicleId(null);
      state.setCompletedVolume(0); // Reset completed transaction values
      state.setCompletedCost(0); // Reset completed transaction values

      // Return to pump selection step
      state.setStep("pump");

      notify("Transaction complete. Ready for next fueling.", "success", 3000);
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
    state.eotDetected,
    state.showTransactionMonitoring,
    state.transactionMonitoringData,
    state.isAuthorized,
    state.fuelingComplete,
    getPumpDetails,
    ptsId,
  ]); // Use specific state properties - setState functions are stable

  /**
   * Cleanup monitoring state when fueling session fully resets.
   */
  useEffect(() => {
    const hasActiveFuelingSession =
      Boolean(state.isAuthorized) ||
      Boolean(state.currentTransactionId) ||
      Boolean(state.activePumpForPopup?.id);

    if (!hasActiveFuelingSession && state.showTransactionMonitoring) {
      state.setShowTransactionMonitoring(false);
    }

    if (!hasActiveFuelingSession && state.transactionMonitoringData) {
      state.setTransactionMonitoringData(null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    state.isAuthorized,
    state.currentTransactionId,
    state.transactionMonitoringData,
    state.activePumpForPopup,
    state.showTransactionMonitoring,
  ]);

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
