/**
 * useFuelingAuthorization - Custom hook for managing fueling authorization operations
 * Handles tank transfers, vehicle fueling authorization, and transaction monitoring
 */
import { useState, useCallback } from "react";
import { useDispatch } from "react-redux";
import Toast from "react-native-toast-message";

// Import services and utilities
import { authorizePump } from "../redux/slices/fuelingSlice";
import { createFuelingEvent } from "../redux/slices/fuelingEventSlice";
import apiService from "../services/apiService";
import locationService from "../services/locationService";
import FuelingUtils from "../utils/FuelingUtils";

/**
 * Custom hook for managing fueling authorization
 * @param {Object} options - Configuration options
 * @param {string} options.ptsId - The PTS device ID
 * @param {Object} options.selectedPump - Currently selected pump
 * @param {Object} options.selectedNozzle - Currently selected nozzle
 * @param {Object} options.selectedTank - Currently selected tank
 * @param {Object} options.loggedInUser - Currently logged in user
 * @param {Function} options.onTransactionStart - Callback when transaction starts
 * @returns {Object} Authorization state and handlers
 */
export const useFuelingAuthorization = ({
  ptsId,
  selectedPump,
  selectedNozzle,
  selectedTank,
  loggedInUser,
  onTransactionStart,
}) => {
  const dispatch = useDispatch();

  // ===========================================
  // AUTHORIZATION STATE
  // ===========================================
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authorizingStatus, setAuthorizingStatus] = useState("");
  const [authError, setAuthError] = useState(null);
  const [pendingAuthData, setPendingAuthData] = useState(null);

  // ===========================================
  // TRANSACTION STATE
  // ===========================================
  const [showTransactionMonitoring, setShowTransactionMonitoring] =
    useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [isViewingExternalFueling, setIsViewingExternalFueling] =
    useState(false);
  const [viewingPumpData, setViewingPumpData] = useState(null);

  // ===========================================
  // TANK TRANSFER AUTHORIZATION
  // ===========================================
  const handleTransferConfirm = useCallback(
    async (transferData) => {
      const { destinationTank, transferVolume, transferReason } = transferData;

      if (isAuthorizing) return;

      setAuthError(null);

      try {
        setIsAuthorizing(true);
        setAuthorizingStatus("authorizing");

        const transferAuthData = {
          deviceId: ptsId,
          pumpId: selectedPump?.id,
          nozzle: selectedNozzle?.id,
          sourceTankId:
            selectedTank?.probeId || selectedTank?.tankId || selectedTank?.id,
          destinationTankId: destinationTank?.tankId || destinationTank?.id,
          volume: parseFloat(transferVolume),
          reason: transferReason || "Tank Transfer",
        };

        setPendingAuthData({
          isTransfer: true,
          ...transferAuthData,
          ...transferData,
        });

        console.log(
          "[useFuelingAuthorization] Tank transfer authorization:",
          transferAuthData
        );

        const result = await apiService.authorizeTankTransfer(transferAuthData);

        if (result.isSuccess) {
          const transactionId =
            result.data?.transactionId || result.data?.transaction;
          setCurrentTransactionId(transactionId);

          Toast.show({
            type: "success",
            text1: "Transfer Authorized",
            text2: `Transaction ${transactionId} started`,
            position: "bottom",
          });

          setIsAuthorizing(false);
          setAuthorizingStatus("");
          setPendingAuthData(null);
          setShowTransactionMonitoring(true);

          onTransactionStart?.(transactionId);
        } else {
          setIsAuthorizing(false);
          // Handle validation errors from FMSResponse
          const errorMessage =
            result.validationErrors?.length > 0
              ? result.validationErrors.join("\n")
              : result.message || "Failed to authorize transfer";
          setAuthError(errorMessage);
        }
      } catch (error) {
        console.error("[useFuelingAuthorization] Transfer error:", error);
        setIsAuthorizing(false);
        // Handle validation errors from rejectWithValue payload or thrown Error object
        const validationErrors =
          error?.validationErrors || error?.payload?.validationErrors;
        const errorMessage =
          validationErrors?.length > 0
            ? validationErrors.join("\n")
            : error?.message ||
              error?.payload?.message ||
              "Failed to process tank transfer. Please check your connection and try again.";
        setAuthError(errorMessage);
      }
    },
    [
      isAuthorizing,
      ptsId,
      selectedPump,
      selectedNozzle,
      selectedTank,
      onTransactionStart,
    ]
  );

  // ===========================================
  // VEHICLE FUELING AUTHORIZATION
  // ===========================================
  const startFueling = useCallback(
    async (authorizationData) => {
      if (isAuthorizing) return;

      setPendingAuthData(authorizationData);
      setAuthError(null);

      try {
        setIsAuthorizing(true);
        setAuthorizingStatus("location");

        const {
          authType,
          dose,
          vehicleId,
          tagId,
          useMasterTag: shouldUseMasterTag,
          odometer,
        } = authorizationData;

        const validation = FuelingUtils.validateTransactionData(
          selectedPump?.id,
          selectedNozzle?.id,
          vehicleId,
          tagId,
          authType,
          dose
        );

        if (!validation.isValid) {
          setIsAuthorizing(false);
          setAuthError(validation.errors.join("\n"));
          return;
        }

        const typeMapping = { Volume: 0, Amount: 1, Full: 2, FullTank: 2 };

        console.log(
          "[useFuelingAuthorization] Getting device location for authorization..."
        );
        const deviceLocation = await locationService.getLocationForFueling();

        if (!deviceLocation) {
          console.warn(
            "[useFuelingAuthorization] Could not get device location - proceeding without location"
          );
        } else {
          console.log(
            "[useFuelingAuthorization] Device location obtained:",
            `lat=${deviceLocation.latitude}, lng=${deviceLocation.longitude}, accuracy=${deviceLocation.accuracy}m`
          );
        }

        setAuthorizingStatus("authorizing");

        const authRequest = {
          deviceId: ptsId,
          pumpId: selectedPump.id,
          nozzle: selectedNozzle.id,
          type: typeMapping[authType] ?? 2,
          dose:
            authType === "Full" || authType === "FullTank"
              ? 0
              : parseFloat(dose) || 0,
          vehicleId: vehicleId,
          tankId: selectedTank?.tankId || selectedTank?.id,
          tag: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
          odometer: odometer ? parseFloat(odometer) : null,
          mobileLocation: deviceLocation
            ? locationService.formatForApi(deviceLocation)
            : null,
          // CRITICAL: Enable auto-close so transaction is automatically saved when fueling completes
          autoCloseTransaction: true,
        };

        console.log(
          "[useFuelingAuthorization] Starting authorization:",
          JSON.stringify(authRequest, null, 2)
        );

        const result = await dispatch(authorizePump(authRequest)).unwrap();

        if (result.isSuccess) {
          const transactionId =
            result.data?.transaction || result.data?.transactionId;
          const pumpIdFromResponse = result.data?.pump || selectedPump.id;
          const nozzleIdFromResponse =
            result.data?.nozzleId || selectedNozzle.id;

          setPendingAuthData(null);
          setAuthorizingStatus("");
          setCurrentTransactionId(transactionId);
          setShowTransactionMonitoring(true);

          dispatch(
            createFuelingEvent("started", ptsId, {
              pumpId: pumpIdFromResponse,
              nozzleNumber: nozzleIdFromResponse,
              transactionId: transactionId,
              authType,
              dose,
              vehicleId,
              tagId: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
            })
          );

          Toast.show({
            type: "success",
            text1: "Authorization Successful",
            text2: `Pump ${pumpIdFromResponse} authorized. Lift nozzle ${nozzleIdFromResponse} to start fueling.`,
          });

          setIsAuthorizing(false);
          setAuthorizingStatus("");

          onTransactionStart?.(transactionId);
        } else {
          setIsAuthorizing(false);
          // Handle validation errors from FMSResponse
          const errorMessage =
            result.validationErrors?.length > 0
              ? result.validationErrors.join("\n")
              : result.message || "Failed to authorize pump";
          setAuthError(errorMessage);
        }
      } catch (error) {
        console.error("[useFuelingAuthorization] Authorization error:", error);
        setIsAuthorizing(false);
        // Handle validation errors from rejectWithValue payload or thrown Error object
        const validationErrors =
          error?.validationErrors || error?.payload?.validationErrors;
        const errorMessage =
          validationErrors?.length > 0
            ? validationErrors.join("\n")
            : error?.message ||
              error?.payload?.message ||
              "Failed to start fueling. Please try again.";
        setAuthError(errorMessage);
      }
    },
    [
      isAuthorizing,
      dispatch,
      ptsId,
      selectedPump,
      selectedNozzle,
      selectedTank,
      loggedInUser,
      onTransactionStart,
    ]
  );

  // ===========================================
  // RETRY AND CANCEL HANDLERS
  // ===========================================
  const handleRetryAuthorization = useCallback(() => {
    if (pendingAuthData) {
      setAuthError(null);
      if (pendingAuthData.isTransfer) {
        handleTransferConfirm(pendingAuthData);
      } else {
        startFueling(pendingAuthData);
      }
    }
  }, [pendingAuthData, handleTransferConfirm, startFueling]);

  const handleCancelAuthorization = useCallback(() => {
    setIsAuthorizing(false);
    setAuthError(null);
    setAuthorizingStatus("");
    setPendingAuthData(null);
  }, []);

  // ===========================================
  // TRANSACTION MONITORING HANDLERS
  // ===========================================
  const handleTransactionComplete = useCallback((transactionId, onReset) => {
    setShowTransactionMonitoring(false);
    setCurrentTransactionId(null);

    onReset?.();

    Toast.show({
      type: "success",
      text1: "Transaction Complete",
      text2: `Transaction ${transactionId} completed successfully`,
    });
  }, []);

  const handleMinimizeMonitoring = useCallback((onMinimize) => {
    setShowTransactionMonitoring(false);
    setIsViewingExternalFueling(false);
    setViewingPumpData(null);

    onMinimize?.();

    Toast.show({
      type: "info",
      text1: "Fueling Minimized",
      text2: "You can start another fueling or tap the banner to view",
      visibilityTime: 3000,
    });
  }, []);

  const handleCloseTransactionMonitoring = useCallback(() => {
    setShowTransactionMonitoring(false);
    setIsViewingExternalFueling(false);
    setViewingPumpData(null);
  }, []);

  const handleViewFuelingFromHeader = useCallback(
    (pump, activeFuelingPump, availablePumps, onPumpSelect) => {
      const targetPump = pump || activeFuelingPump;
      if (targetPump) {
        const pumpToSelect = availablePumps?.find(
          (p) => p.id === targetPump.pumpId
        );
        if (pumpToSelect) {
          onPumpSelect?.(pumpToSelect);
        }
        const isExternal =
          !currentTransactionId ||
          currentTransactionId !== targetPump.transaction;
        setIsViewingExternalFueling(isExternal);
        setViewingPumpData(targetPump);
        setShowTransactionMonitoring(true);
      }
    },
    [currentTransactionId]
  );

  return {
    // Authorization state
    isAuthorizing,
    authorizingStatus,
    authError,
    pendingAuthData,

    // Authorization handlers
    startFueling,
    handleTransferConfirm,
    handleRetryAuthorization,
    handleCancelAuthorization,

    // Transaction monitoring state
    showTransactionMonitoring,
    setShowTransactionMonitoring,
    currentTransactionId,
    isViewingExternalFueling,
    viewingPumpData,

    // Transaction monitoring handlers
    handleTransactionComplete,
    handleMinimizeMonitoring,
    handleCloseTransactionMonitoring,
    handleViewFuelingFromHeader,
  };
};

export default useFuelingAuthorization;
