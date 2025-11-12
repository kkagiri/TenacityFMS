/**
 * useFuelingActions.js
 *
 * Custom hook to manage all action handlers for the fueling process.
 * Centralizes all business logic and API interactions.
 *
 * Action Categories:
 * - Fueling Control (start, stop, complete)
 * - Navigation (with safety checks)
 * - Vehicle Selection
 * - Tag Scanning
 * - Transaction Management
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import notify from 'devextreme/ui/notify';
import pumpControlService from '../../../../services/pumpControlService';
import { validateTag } from '../../../../redux/actions/tagActions';
import { getVehicleById } from '../../../../redux/actions/vehicleActions';
import { authorizePump } from '../../../../redux/actions/ptsActions/ptspumpActions';

export const useFuelingActions = ({
  // Device data
  ptsId,
  devicePumpStatus,
  getPumpDetails,
  fuelGrades,

  // State management
  state,

  // User data
  userMasterTag,
}) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  /**
   * Start fueling - authorize pump with selected parameters
   */
  const startFueling = useCallback(async () => {
    // Only prevent starting if truly disconnected (not delayed or reconnecting)
    if (state.deviceConnectionStatus === "disconnected") {
      notify(
        "Cannot start fueling - device is disconnected. Please wait for reconnection.",
        "error",
        3000
      );
      return;
    }

    // Allow fueling even if delayed/reconnecting
    if (state.deviceConnectionStatus === "delayed") {
      notify(
        "Connection is delayed but fueling will proceed. Monitor connection status closely.",
        "info",
        3000
      );
    }

    if (!state.selectedPump || !state.selectedNozzle) {
      notify("Please select a pump and nozzle first.", "warning", 2000);
      return;
    }

    // Check if the selected pump is actually available (not offline/fueling)
    const pumpCurrentStatus = getPumpDetails(state.selectedPump.id)?.status;
    if (
      pumpCurrentStatus === "offline" ||
      pumpCurrentStatus === "fueling" ||
      pumpCurrentStatus === "endOfTransaction"
    ) {
      notify(
        `Pump ${state.selectedPump.id} is currently ${pumpCurrentStatus} and cannot be authorized.`,
        "error",
        3000
      );
      return;
    }

    try {
      state.setIsAuthorizing(true);

      // Get selected nozzle's fuel grade and price
      let fuelGradeId = 0;
      let fuelPrice = 0;

      // Try to find the fuel grade for this nozzle
      if (state.selectedNozzle.fuelType) {
        const matchingGrade = fuelGrades.find(
          (grade) =>
            grade.name.toLowerCase() === state.selectedNozzle.fuelType.toLowerCase()
        );

        if (matchingGrade) {
          fuelGradeId = matchingGrade.id;
          fuelPrice = matchingGrade.price;
        } else {
          fuelPrice = state.selectedNozzle?.price || 3.99; // Fallback price
        }
      }

      // Get the tag to use - prioritize scan result, then tag from status, then selected tag, then vehicle reg
      const tagToUse =
        state.scanResult ||
        (state.selectedPump ? getPumpDetails(state.selectedPump.id)?.tag : null) ||
        (state.selectedTag ? state.selectedTag.name : null) ||
        (state.tagDetails ? state.tagDetails.tagId : null) ||
        state.vehicleReg ||
        "";

      console.log("[Authorize] Using tag:", tagToUse);

      // Determine if we should auto-assign user master tag
      const hasVehicleInfo = state.vehicleInfo?.vehicleId || state.selectedVehicleId;
      const hasTag = state.useMasterTag ? userMasterTag : tagToUse;
      const shouldAutoAssign = hasVehicleInfo && !hasTag && !state.useMasterTag;

      console.log("[Authorize] Auto-assign decision:", {
        hasVehicleInfo: !!hasVehicleInfo,
        hasTag: !!hasTag,
        useMasterTag: state.useMasterTag,
        shouldAutoAssign
      });

      // Use device configuration for auto-assign feature
      const deviceSupportsAutoAssign = state.deviceConfig?.autoAssignUserMasterTag === true;
      const shouldAutoAssignWithDeviceCheck = shouldAutoAssign && deviceSupportsAutoAssign;

      console.log("[Authorize] Device auto-assign decision:", {
        deviceSupportsAutoAssign,
        shouldAutoAssignWithDeviceCheck,
        deviceConfig: state.deviceConfig
      });

      // Map frontend type values to backend enum values
      const typeMapping = {
        "Volume": 0,    // VOLUME
        "Amount": 1,    // AMOUNT
        "FullTank": 2   // FULLTANK
      };

      const authParams = {
        deviceId: ptsId,
        pumpId: state.selectedPump.id,
        nozzle: state.selectedNozzle.id,
        type: typeMapping[state.selectedType] ?? state.selectedType,
        dose:
          state.selectedType === "Amount"
            ? parseFloat(state.amount) || 0
            : state.selectedType === "Volume"
            ? parseFloat(state.volume) || 0
            : 0,
        price: fuelPrice,
        fuelGradeId: fuelGradeId,
        tankId: state.selectedTankId, // Add tankId for tank selection
        tag: state.useMasterTag ? userMasterTag : tagToUse,
        vehicleId: hasVehicleInfo ? (state.vehicleInfo?.vehicleId || state.selectedVehicleId) : null,
      };

      console.log("[Authorize] Sending auth request:", authParams);

      const response = await dispatch(authorizePump(authParams));
      console.log("[Authorize] Received response:", response);

      // Handle FMSResponse<T> structure from backend
      if (response && response.isSuccess) {
        const transactionId = response.data?.transaction || null;
        const pumpId = response.data?.pump || state.selectedPump.id;
        const connectionType = response.data?.connectionType || 'WebSocket';
        const nozzleId = response.data?.nozzleId || state.selectedNozzle.id;

        state.setCurrentTransactionId(transactionId);
        state.setActivePumpForPopup(state.selectedPump);
        state.setActiveNozzleForPopup(state.selectedNozzle);
        state.setIsFuelingPopupMinimized(false);
        state.setIsAuthorized(true); // Mark as authorized - waiting for physical fueling to start
        state.setEotDetected(false); // Reset EOT detection for new transaction

        // Navigate to authorization success step
        state.setStep("authorization");

        // Store transaction data but don't show separate monitoring widget
        // The fueling progress popup handles real-time updates
        if (transactionId) {
          state.setTransactionMonitoringData({
            deviceId: ptsId,
            pumpId: pumpId,
            nozzleId: nozzleId,
            transactionId: transactionId,
            connectionType: connectionType
          });
          state.setDeviceConnectionType(connectionType);
          // Don't show separate transaction monitoring - it's integrated in fueling popup
          // state.setShowTransactionMonitoring(true);
        }

        notify(
          `Pump ${pumpId} authorized successfully (${connectionType}). Transaction ID: ${
            transactionId || "N/A"
          }. Lift nozzle ${nozzleId} to start fueling.`,
          "success",
          5000
        );
      } else {
        notify(response?.message || "Failed to authorize pump", "error", 3000);
        state.setActivePumpForPopup(null);
        state.setActiveNozzleForPopup(null);
      }
    } catch (error) {
      console.error("[Authorize] Error:", error);
      notify(
        `Error authorizing pump: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
      state.setActivePumpForPopup(null);
      state.setActiveNozzleForPopup(null);
    } finally {
      state.setIsAuthorizing(false);
    }
  }, [
    ptsId,
    state,
    getPumpDetails,
    fuelGrades,
    userMasterTag,
    dispatch,
  ]);

  /**
   * Stop fueling - send stop command to pump
   */
  const stopFueling = useCallback(async () => {
    // Check if device is disconnected first
    if (state.isDeviceDisconnected) {
      notify(
        "Cannot stop fueling - device is disconnected. The physical stop button on the pump may still work.",
        "warning",
        5000
      );
      return;
    }

    if (!state.activePumpForPopup) {
      notify("No active pump selected to stop.", "warning", 2000);
      return;
    }

    const pumpCurrentStatus = getPumpDetails(state.activePumpForPopup.id)?.status;
    if (pumpCurrentStatus !== "fueling") {
      notify(
        `Pump ${state.activePumpForPopup.id} is not currently fueling. Cannot send stop command.`,
        "warning",
        3000
      );
      return;
    }

    try {
      console.log(`[Stop] Sending stop command for Pump ${state.activePumpForPopup.id}`);
      const response = await pumpControlService.stopPump(ptsId, state.activePumpForPopup.id);
      console.log(`[Stop] Received response for Pump ${state.activePumpForPopup.id}:`, response);

      if (response && response.success) {
        notify(`Stop command sent for Pump ${state.activePumpForPopup.id}`, "success", 2000);
      } else {
        notify(response?.message || "Failed to stop pump", "error", 3000);
      }
    } catch (error) {
      console.error(`[Stop] Error stopping pump ${state.activePumpForPopup.id}:`, error);
      notify(
        `Error stopping pump: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
    }
  }, [ptsId, state, getPumpDetails]);

  /**
   * Start a new fueling process - reset all UI state
   */
  const startNewFueling = useCallback(() => {
    console.log("[UI] Starting new fueling process flow.");
    state.setSelectedPump(null);
    state.setSelectedNozzle(null);
    state.setVehicleReg("");
    state.setVehicleInfo(null);
    state.setCurrentTransactionId(null);
    state.setActivePumpForPopup(null);
    state.setActiveNozzleForPopup(null);
    state.setShowFuelingPopup(false);
    state.setFuelingComplete(false);
    state.setAmount("");
    state.setVolume("");
    state.setScanResult(null);
    state.setIsAuthorized(false); // Reset authorization status
    state.setEotDetected(false); // Reset EOT detection
    state.setSelectedTankId(null); // Reset tank selection
    state.setStep("pump");
  }, [state]);

  /**
   * Complete fueling - finalize transaction after EOT
   */
  const completeFueling = useCallback(async () => {
    if (!state.activePumpForPopup) {
      notify(
        "Cannot complete: No pump context for the completed transaction.",
        "error",
        3000
      );
      state.setFuelingComplete(false);
      startNewFueling();
      return;
    }

    const pumpDetails = getPumpDetails(state.activePumpForPopup.id);
    const transactionIdToClose = state.currentTransactionId || pumpDetails?.transaction;

    if (pumpDetails?.status !== "endOfTransaction") {
      notify(
        `Cannot complete: Pump ${state.activePumpForPopup.id} is not in EndOfTransaction status. Current status: ${
          pumpDetails?.status || "Unknown"
        }.`,
        "warning",
        4000
      );
      return;
    }

    if (!transactionIdToClose) {
      notify(
        `Cannot complete: Missing transaction ID for Pump ${state.activePumpForPopup.id}.`,
        "error",
        3000
      );
      state.setFuelingComplete(false);
      startNewFueling();
      return;
    }

    try {
      console.log(
        `[Complete] Sending close command for Pump ${state.activePumpForPopup.id}, Txn ${transactionIdToClose}`
      );

      const response = await pumpControlService.closeTransaction(
        ptsId,
        state.activePumpForPopup.id,
        transactionIdToClose
      );

      console.log(
        `[Complete] Received response for Pump ${state.activePumpForPopup.id}, Txn ${transactionIdToClose}:`,
        response
      );

      if (response && response.success) {
        notify(
          `Transaction ${transactionIdToClose} completed successfully`,
          "success",
          2000
        );
      } else {
        notify(
          response?.message ||
            `Failed to explicitly close transaction ${transactionIdToClose} (Pump ${state.activePumpForPopup.id}). Resetting UI based on EndOfTransaction status.`,
          "warning",
          4000
        );
      }

      state.setFuelingComplete(false);
      startNewFueling();
    } catch (error) {
      console.error(
        `[Complete] Error completing transaction ${transactionIdToClose} for pump ${state.activePumpForPopup.id}:`,
        error
      );
      notify(
        `Error completing transaction: ${error.message || "Unknown error"}. Resetting UI.`,
        "error",
        3000
      );
      state.setFuelingComplete(false);
      startNewFueling();
    }
  }, [ptsId, state, getPumpDetails, startNewFueling]);

  /**
   * Handle navigation with safety check for active fueling
   */
  const handleNavigation = useCallback((path) => {
    const isAnyPumpFueling = Object.values(devicePumpStatus || {}).some(
      (p) => p.status === "fueling"
    );

    if (isAnyPumpFueling) {
      state.setNavigateTo(path);
      state.setShowNavigationDialog(true);
    } else {
      navigate(path);
    }
  }, [devicePumpStatus, state, navigate]);

  /**
   * Confirm navigation (override active fueling warning)
   */
  const confirmNavigation = useCallback(() => {
    state.setShowNavigationDialog(false);
    if (state.navigateTo) {
      navigate(state.navigateTo);
    }
  }, [state, navigate]);

  /**
   * Cancel navigation
   */
  const cancelNavigation = useCallback(() => {
    state.setShowNavigationDialog(false);
    state.setNavigateTo(null);
  }, [state]);

  /**
   * Handle vehicle selection from lookup
   */
  const handleVehicleSelected = useCallback(async (vehicle) => {
    state.setSelectedVehicleId(vehicle?.vehicleId || null);

    if (vehicle?.vehicleId) {
      try {
        state.setVehicleInfo(null); // Show loading state

        const vehicleResult = await dispatch(getVehicleById(vehicle.vehicleId));
        console.log("[Vehicle Selection] Vehicle data fetched:", vehicleResult);

        if (vehicleResult && vehicleResult.success && vehicleResult.data) {
          const vehicleData = vehicleResult.data;
          state.setVehicleInfo({
            vehicleId: vehicleData.vehicleId,
            hyoungNo: vehicleData.hyoungNo,
            numberPlate: vehicleData.numberPlate,
            vehicleType: vehicleData.vehicleType,
            isCompanyVehicle: vehicleData.isCompanyVehicle || false,
          });
        } else {
          notify(`Failed to fetch vehicle data`, "error", 3000);
          state.setSelectedVehicleId(null);
        }
      } catch (error) {
        console.error("[Vehicle Selection] Error fetching vehicle:", error);
        notify(
          `Error during vehicle validation: ${error.message || "Unknown error"}`,
          "error",
          3000
        );
        state.setSelectedVehicleId(null);
      }
    } else {
      state.setVehicleInfo(null);
    }
  }, [state, dispatch]);

  /**
   * Accept scanned tag result
   */
  const acceptScanResult = useCallback((validatedVehicleInfo) => {
    console.log("acceptScanResult - received:", validatedVehicleInfo);

    if (validatedVehicleInfo?.isMasterTag) {
      console.log("[Scan] Accepted master tag");
      state.setUseMasterTag(true);
      state.setStep("details");
      return;
    }

    const reg = validatedVehicleInfo?.hyoungNo ||
                validatedVehicleInfo?.numberPlate ||
                validatedVehicleInfo?.registrationNumber;

    if (validatedVehicleInfo && (reg || validatedVehicleInfo?.vehicleId)) {
      console.log(`[Scan] Accepted vehicle: ${reg || validatedVehicleInfo.vehicleId}`);

      if (reg) {
        state.setVehicleReg(reg);
      }

      state.setVehicleInfo(validatedVehicleInfo);
      state.setStep("details");
    } else {
      console.error("[Scan] Invalid vehicle info:", validatedVehicleInfo);
      notify("No valid vehicle information found. Please try again.", "error", 3000);
    }
  }, [state]);

  /**
   * Process scanned tag result
   */
  const processScanResult = useCallback(async (tagId) => {
    if (!tagId) return;

    state.setScanResult(tagId);
    notify(`Tag detected: ${tagId}. Validating...`, "info", 2000);

    try {
      const validationResult = await dispatch(validateTag(tagId));
      console.log(`[Scan] Validation result for tag ${tagId}:`, validationResult);

      if (validationResult && validationResult.isValid) {
        state.setTagDetails(validationResult);
        state.setVehicleInfo(validationResult.vehicleInfo);
        acceptScanResult(validationResult.vehicleInfo);
      } else {
        notify(`Tag ${tagId} validation failed. Please try again.`, "error", 3000);
        state.setScanResult(null);
      }
    } catch (error) {
      console.error("[Scan] Error during tag validation:", error);
      notify(
        `Error during tag validation: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
      state.setScanResult(null);
    } finally {
      state.setIsScanning(false);
    }
  }, [state, dispatch, acceptScanResult]);

  /**
   * Cancel tag scanning
   */
  const cancelScan = useCallback(() => {
    console.log("[Scan] Cancelling scan process");
    state.setIsScanning(false);
    state.setScanResult(null);
    state.setVehicleInfo(null);
    state.setTagDetails(null);
  }, [state]);

  /**
   * Start tag scanning
   */
  const startScan = useCallback(async () => {
    state.setIsScanning(true);
    state.setScanResult(null);
    state.setVehicleInfo(null);
    state.setTagDetails(null);

    try {
      console.log("[Scan] Starting tag scan...");

      const pumpDetails = state.selectedPump ? getPumpDetails(state.selectedPump.id) : null;
      const initialTag = pumpDetails?.tag;

      if (initialTag && initialTag.trim() !== "") {
        console.log(`[Scan] Tag found in pump status: ${initialTag}`);
        processScanResult(initialTag);
      } else {
        const scanTimeout = 20000; // 20 seconds timeout
        const scanStartTime = Date.now();

        const checkForTag = async () => {
          if (!state.isScanning) return;

          if (Date.now() - scanStartTime > scanTimeout) {
            notify("No tag detected within timeout period.", "warning", 3000);
            cancelScan();
            return;
          }

          const currentPumpDetails = state.selectedPump ? getPumpDetails(state.selectedPump.id) : null;
          const detectedTag = currentPumpDetails?.tag;

          if (detectedTag && detectedTag.trim() !== "") {
            console.log(`[Scan] Tag detected during polling: ${detectedTag}`);
            processScanResult(detectedTag);
          } else {
            setTimeout(checkForTag, 500);
          }
        };

        checkForTag();
      }
    } catch (error) {
      console.error("[Scan] Error during scan:", error);
      notify(
        `Error during scan: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
      state.setScanResult(null);
      cancelScan();
    }
  }, [state, getPumpDetails, processScanResult, cancelScan]);

  /**
   * Handle transaction cancellation
   */
  const handleCancelTransaction = useCallback(async (transactionId, reason) => {
    try {
      const response = await pumpControlService.cancelTransaction(
        ptsId,
        state.transactionMonitoringData?.pumpId,
        transactionId,
        reason
      );

      if (response && response.success) {
        notify(`Transaction ${transactionId} cancelled successfully`, "success", 3000);
        state.setShowTransactionMonitoring(false);
        state.setTransactionMonitoringData(null);
        startNewFueling();
      } else {
        notify(response?.message || "Failed to cancel transaction", "error", 3000);
      }
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      notify(`Error cancelling transaction: ${error.message}`, "error", 3000);
    }
  }, [ptsId, state, startNewFueling]);

  /**
   * Handle transaction completion
   */
  const handleCompleteTransaction = useCallback(async (transactionId) => {
    try {
      const response = await pumpControlService.closeTransaction(
        ptsId,
        state.transactionMonitoringData?.pumpId,
        transactionId
      );

      if (response && response.success) {
        notify(`Transaction ${transactionId} completed successfully`, "success", 3000);
        state.setShowTransactionMonitoring(false);
        state.setTransactionMonitoringData(null);
        state.setFuelingComplete(false);
        startNewFueling();
      } else {
        notify(response?.message || "Failed to complete transaction", "error", 3000);
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
      notify(`Error completing transaction: ${error.message}`, "error", 3000);
    }
  }, [ptsId, state, startNewFueling]);

  /**
   * Handle view pump transactions
   */
  const handleViewPumpTransactions = useCallback(() => {
    state.setShowPumpTransactionPopup(true);
  }, [state]);

  /**
   * Handle connection status change
   */
  const handleConnectionStatusChange = useCallback((status) => {
    state.setDeviceConnectionStatus(status);

    const isActuallyDisconnected = status === "disconnected";
    state.setIsDeviceDisconnected(isActuallyDisconnected);

    if (isActuallyDisconnected) {
      const activeFuelingProcesses = Object.values(devicePumpStatus || {}).filter(
        (p) => p.status === "fueling"
      );

      if (activeFuelingProcesses.length > 0) {
        notify(
          "Device connection lost! Active fueling may continue but monitoring may be affected. The device will attempt to reconnect automatically.",
          "warning",
          7000
        );
      }
    }
  }, [state, devicePumpStatus]);

  return {
    startFueling,
    stopFueling,
    completeFueling,
    startNewFueling,
    handleNavigation,
    confirmNavigation,
    cancelNavigation,
    handleVehicleSelected,
    processScanResult,
    startScan,
    cancelScan,
    acceptScanResult,
    handleCancelTransaction,
    handleCompleteTransaction,
    handleViewPumpTransactions,
    handleConnectionStatusChange,
  };
};

export default useFuelingActions;
