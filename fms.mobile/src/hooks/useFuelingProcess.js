/**
 * useFuelingProcess - Custom hook for managing the fueling process workflow
 * Handles state management, authorization, SignalR connection, and step navigation
 */
import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { Alert, BackHandler } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";

// Import hooks and services
import { useDeviceData } from "./useDeviceData";
import { pumpControlService } from "../services/pumpControlService";
import FuelingUtils from "../utils/FuelingUtils";
import fuelingValidationSettings from "../services/fuelingValidationSettings";
import locationService from "../services/locationService";

// Import Redux actions
import {
  fetchVehicleList,
  fetchTagsByVehicleId,
  validateTag,
  validateVehicle,
} from "../redux/slices/vehicleSlice";
import { fetchSiteList } from "../redux/slices/siteSlice";
import {
  fetchTanksBySite,
  updateTanksFromProbeStatus,
} from "../redux/slices/tankSlice";
import {
  authorizePump,
  updateDeviceStatus,
  setLiveDataEnabled,
} from "../redux/slices/fuelingSlice";
import { createFuelingEvent } from "../redux/slices/fuelingEventSlice";
import apiService from "../services/apiService";
import signalRService, {
  ConnectionState,
  HubPaths,
} from "../services/signalRService";

// Storage key for persisting tank selection (per device)
const TANK_STORAGE_KEY_PREFIX = "@fms_selected_tank_";

/**
 * Custom hook for managing the fueling process
 * @param {string} ptsId - The PTS device ID
 * @param {number} siteId - The site ID (defaults to 1)
 * @returns {Object} All state and handlers needed for the fueling process
 */
export const useFuelingProcess = (ptsId, siteId = 1) => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Device data hook
  const {
    devicePumpStatus,
    pumps: availablePumps,
    activeFuelingProcesses,
    lastUpdated: deviceLastUpdated,
    isLiveDataEnabled,
    getPumpDetails,
    getNozzlesForPump,
    rawUploadStatus,
    fuelGrades,
    probeTanks,
  } = useDeviceData(ptsId);

  // Redux state selectors
  const ptsDeviceList = useSelector((state) => state.device.ptsDeviceList);
  const ptsDevice = useMemo(
    () => ptsDeviceList.find((dev) => dev.ptsid === ptsId),
    [ptsDeviceList, ptsId]
  );

  const sites = useSelector((state) => state.site.sites);
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const isLoadingVehicles = useSelector((state) => state.vehicle.loading);
  const loggedInUser = useSelector((state) => state.auth.user);

  // Tank data from Redux
  const {
    tanks: apiTanks,
    filteredTanks,
    isLoading: isLoadingTanks,
  } = useSelector((state) => state.tank);

  // Memoize filtered events
  const allFuelingEvents = useSelector((state) => state.fuelingEvent.events);
  const fuelingEvents = useMemo(
    () => allFuelingEvents.filter((e) => e.deviceId === ptsId),
    [allFuelingEvents, ptsId]
  );

  // Available tanks - priority: filtered tanks > probe tanks > empty
  const availableTanks = useMemo(() => {
    if (filteredTanks?.length > 0) return filteredTanks;
    if (probeTanks?.length > 0) return probeTanks;
    return [];
  }, [filteredTanks, probeTanks]);

  // ===========================================
  // LOCAL STATE
  // ===========================================

  // Step and navigation state
  const [step, setStep] = useState(null);
  const [tankLoadingComplete, setTankLoadingComplete] = useState(false);
  const [deviceConnectionStatus, setDeviceConnectionStatus] =
    useState("connecting");
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Selection state
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedPump, setSelectedPump] = useState(null);
  const [selectedNozzle, setSelectedNozzle] = useState(null);
  const [operationMode, setOperationMode] = useState(null);
  const [destinationTank, setDestinationTank] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);

  // Transfer state
  const [transferVolume, setTransferVolume] = useState("");
  const [transferReason, setTransferReason] = useState("");

  // Vehicle fueling state
  const [vehicleReg, setVehicleReg] = useState("");
  const [fuelingVolume, setFuelingVolume] = useState("");
  const [isFullTank, setIsFullTank] = useState(false);
  const [odometer, setOdometer] = useState("");
  const [notes, setNotes] = useState("");
  const [selectedType, setSelectedType] = useState("Full");
  const [volume, setVolume] = useState("");

  // Driver/Employee state
  const [selectedDriver, setSelectedDriver] = useState(null);

  // Authorization state
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [authorizingStatus, setAuthorizingStatus] = useState("");
  const [authError, setAuthError] = useState(null);
  const [pendingAuthData, setPendingAuthData] = useState(null);

  // Scanning state
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [tagDetails, setTagDetails] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectionMethod, setSelectionMethod] = useState("lookup");
  const [useMasterTag, setUseMasterTag] = useState(false);

  // Transaction monitoring state
  const [showTransactionMonitoring, setShowTransactionMonitoring] =
    useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [isViewingExternalFueling, setIsViewingExternalFueling] =
    useState(false);
  const [viewingPumpData, setViewingPumpData] = useState(null);

  // Completed transaction data for summary step
  const [completedTransactionData, setCompletedTransactionData] = useState(null);

  // Validation state
  const [fuelingRules, setFuelingRules] = useState(null);
  const [validationSettings, setValidationSettings] = useState({
    fuelRulesCheckEnabled: true,
    fuelCapacityValidationEnabled: true,
    gpsFuelLevelCheckEnabled: true,
  });

  // Computed values
  const isDataLoading =
    deviceConnectionStatus === "connecting" && availableTanks.length === 0;

  // ===========================================
  // SITE NAME HELPER
  // ===========================================
  const siteName = useCallback(() => {
    if (!ptsDevice?.site && !siteId) return null;
    const targetSiteId = ptsDevice?.site || siteId;
    if (!sites?.length) return null;
    const site = sites.find((s) => s.id === targetSiteId);
    return site?.name || null;
  }, [ptsDevice, sites, siteId]);

  // ===========================================
  // REFRESH HANDLER
  // ===========================================
  const handleRefreshData = useCallback(async () => {
    const targetSiteId = ptsDevice?.site || siteId;
    setIsRefreshing(true);
    try {
      console.log("[useFuelingProcess] Refreshing data...");

      if (targetSiteId) {
        await dispatch(fetchTanksBySite(targetSiteId)).unwrap();
        console.log("[useFuelingProcess] Tanks refreshed");
      }

      if (
        ptsId &&
        signalRService.connectionState === ConnectionState.Connected
      ) {
        await signalRService.subscribeToDevice(ptsId);
      }

      Toast.show({
        type: "success",
        text1: "Data Refreshed",
        text2: "Tank and device data updated",
        position: "bottom",
        visibilityTime: 2000,
      });
    } catch (error) {
      console.error(
        "[useFuelingProcess] Error refreshing data:",
        error.message
      );
      Toast.show({
        type: "error",
        text1: "Refresh Failed",
        text2: error.message || "Failed to refresh data",
        position: "bottom",
      });
    } finally {
      setIsRefreshing(false);
    }
  }, [dispatch, ptsDevice?.site, siteId, ptsId]);

  // ===========================================
  // INITIALIZATION EFFECT
  // ===========================================
  useEffect(() => {
    const initializeData = async () => {
      // Load fueling validation settings
      try {
        const settings = await fuelingValidationSettings.loadSettings();
        setValidationSettings(settings);
        console.log(
          "[useFuelingProcess] Loaded validation settings:",
          settings
        );
      } catch (error) {
        console.warn(
          "[useFuelingProcess] Failed to load validation settings:",
          error
        );
      }

      // Fetch vehicle and site lists
      dispatch(fetchVehicleList());
      dispatch(fetchSiteList());

      // Pre-warm location service if mobile location validation might be needed
      // This requests permission early and caches location to avoid prompts during authorization
      const requireMobileLocation = ptsDevice?.requireMobileAppProximity === 1;
      if (requireMobileLocation) {
        console.log(
          "[useFuelingProcess] Mobile location required - warming up location service"
        );
        locationService
          .warmUpLocation(true) // Request permission if not granted
          .then((result) => {
            console.log("[useFuelingProcess] Location warm-up result:", result);
          })
          .catch((err) =>
            console.log(
              "[useFuelingProcess] Location warm-up failed:",
              err.message
            )
          );
      } else {
        // Still warm up silently for logging purposes
        locationService
          .warmUpLocation(false) // Don't request permission if not required
          .catch((err) =>
            console.log(
              "[useFuelingProcess] Location warm-up failed (non-critical):",
              err.message
            )
          );
      }

      const targetSiteId = ptsDevice?.site || siteId;

      try {
        console.log("[useFuelingProcess] Attempting to connect to SignalR...");
        setDeviceConnectionStatus("connecting");

        await signalRService.start(HubPaths.PTS);

        if (ptsId) {
          await signalRService.subscribeToDevice(ptsId);
        }

        if (targetSiteId) {
          console.log(
            "[useFuelingProcess] Fetching tanks for site:",
            targetSiteId
          );
          await dispatch(fetchTanksBySite(targetSiteId)).unwrap();
        }

        dispatch(setLiveDataEnabled(true));
        setDeviceConnectionStatus("connected");

        Toast.show({
          type: "success",
          text1: "Connected",
          text2: "Using live PTS data",
          position: "bottom",
          visibilityTime: 2000,
        });
      } catch (error) {
        console.error(
          "[useFuelingProcess] Failed to connect to PTS device:",
          error.message
        );

        setDeviceConnectionStatus("disconnected");
        dispatch(setLiveDataEnabled(false));

        Toast.show({
          type: "error",
          text1: "Connection Failed",
          text2: `Unable to connect to PTS device: ${error.message}`,
          position: "bottom",
          visibilityTime: 4000,
        });

        Alert.alert(
          "Connection Error",
          `Could not connect to PTS device "${ptsId}". Please ensure:\n\n• The device is powered on\n• Network connection is available\n• The server is running\n\nWould you like to retry?`,
          [
            {
              text: "Go Back",
              style: "cancel",
              onPress: () => navigation.goBack(),
            },
            { text: "Retry", onPress: () => handleRefreshData() },
          ]
        );
      }
    };

    initializeData();

    return () => {
      if (ptsId) {
        signalRService.unsubscribeFromDevice(ptsId);
      }
      locationService.cleanup();
    };
  }, [dispatch, ptsId, ptsDevice?.site, siteId]);

  // ===========================================
  // LOAD SAVED TANK EFFECT
  // ===========================================
  useEffect(() => {
    const loadSavedTank = async () => {
      try {
        const storageKey = `${TANK_STORAGE_KEY_PREFIX}${ptsId}`;
        const savedTankJson = await AsyncStorage.getItem(storageKey);

        if (savedTankJson) {
          const savedTank = JSON.parse(savedTankJson);
          console.log("[useFuelingProcess] Loaded saved tank:", savedTank);
          setSelectedTank(savedTank);
          setStep("pump");

          Toast.show({
            type: "info",
            text1: "Tank Restored",
            text2: `Using ${
              savedTank.name || savedTank.tankName || "saved tank"
            }`,
            position: "bottom",
            visibilityTime: 2000,
          });
        } else {
          setStep("tank");
        }
      } catch (error) {
        console.error("[useFuelingProcess] Error loading saved tank:", error);
        setStep("tank");
      } finally {
        setTankLoadingComplete(true);
      }
    };

    loadSavedTank();
  }, [ptsId]);

  // ===========================================
  // SAVE TANK SELECTION EFFECT
  // ===========================================
  useEffect(() => {
    const saveTank = async () => {
      if (!tankLoadingComplete) return;

      try {
        const storageKey = `${TANK_STORAGE_KEY_PREFIX}${ptsId}`;
        if (selectedTank) {
          await AsyncStorage.setItem(storageKey, JSON.stringify(selectedTank));
        }
      } catch (error) {
        console.error("[useFuelingProcess] Error saving tank:", error);
      }
    };

    saveTank();
  }, [selectedTank, ptsId, tankLoadingComplete]);

  // ===========================================
  // TANK CHANGE HANDLER
  // ===========================================
  const handleChangeTank = useCallback(async () => {
    console.log("[useFuelingProcess] User requested tank change");

    try {
      const storageKey = `${TANK_STORAGE_KEY_PREFIX}${ptsId}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error("[useFuelingProcess] Error clearing saved tank:", error);
    }

    setSelectedTank(null);
    setSelectedPump(null);
    setSelectedNozzle(null);
    setOperationMode(null);
    setDestinationTank(null);
    setSelectedVehicle(null);
    setStep("tank");

    Toast.show({
      type: "info",
      text1: "Select New Tank",
      text2: "Choose a source tank for fueling",
      position: "bottom",
    });
  }, [ptsId]);

  // ===========================================
  // SIGNALR RECONNECTION ON FOCUS
  // ===========================================
  useFocusEffect(
    useCallback(() => {
      const checkSignalRConnection = async () => {
        try {
          if (!signalRService.isConnected()) {
            console.log(
              "[useFuelingProcess] Screen focused, SignalR not connected. Reconnecting..."
            );
            setDeviceConnectionStatus("connecting");

            await signalRService.start(HubPaths.PTS);

            if (ptsId) {
              await signalRService.subscribeToDevice(ptsId);
            }

            setDeviceConnectionStatus("connected");
            console.log("[useFuelingProcess] SignalR reconnected successfully");
          } else {
            if (ptsId) {
              await signalRService.requestDeviceUploadStatus(ptsId);
            }
          }
        } catch (error) {
          console.error(
            "[useFuelingProcess] SignalR reconnection failed:",
            error?.message
          );
          setDeviceConnectionStatus("error");
          Toast.show({
            type: "error",
            text1: "Connection Issue",
            text2: "Pull down to refresh and retry",
            position: "bottom",
            visibilityTime: 3000,
          });
        }
      };

      checkSignalRConnection();
    }, [ptsId])
  );

  // ===========================================
  // STEP NAVIGATION
  // ===========================================
  const getStepOrder = () => {
    if (operationMode === "transfer") {
      return ["tank", "pump", "nozzle", "mode", "transfer"];
    } else if (operationMode === "vehicle") {
      return ["tank", "pump", "nozzle", "mode", "vehicle", "volume"];
    }
    return ["tank", "pump", "nozzle", "mode"];
  };

  const handleStepBack = useCallback(() => {
    switch (step) {
      case "pump":
        if (selectedTank) {
          navigation.goBack();
        } else {
          setStep("tank");
        }
        break;
      case "nozzle":
        setStep("pump");
        setSelectedPump(null);
        break;
      case "mode":
        setStep("nozzle");
        setSelectedNozzle(null);
        break;
      case "transfer":
        setStep("mode");
        setOperationMode(null);
        break;
      case "vehicle":
        setStep("mode");
        setOperationMode(null);
        // Clear volume step data when going back to mode
        setFuelingVolume("");
        setVolume("");
        setOdometer("");
        setIsFullTank(false);
        setSelectedDriver(null);
        break;
      case "volume":
        setStep("vehicle");
        setSelectedVehicle(null);
        // Clear volume step data when going back to vehicle
        setFuelingVolume("");
        setVolume("");
        setOdometer("");
        setIsFullTank(false);
        setSelectedDriver(null);
        break;
      case "scan":
        setStep("nozzle");
        setSelectedNozzle(null);
        break;
      default:
        navigation.goBack();
    }
  }, [step, selectedTank, navigation]);

  const handleStepNext = useCallback(
    (nextStep, data = {}) => {
      switch (nextStep) {
        case "pump":
          setSelectedTank(data.tank);
          setStep("pump");
          break;
        case "nozzle":
          setSelectedPump(data.pump);
          setStep("nozzle");
          break;
        case "mode":
          setSelectedNozzle(data.nozzle);
          setStep("mode");
          break;
        case "transfer":
          console.log(
            "[useFuelingProcess] Entering transfer step, selectedTank:",
            selectedTank
          );
          setOperationMode("transfer");
          setStep("transfer");
          break;
        case "vehicle":
          setOperationMode("vehicle");
          setStep("vehicle");
          break;
        case "volume":
          if (data.vehicle) {
            setSelectedVehicle(data.vehicle);
            setSelectedVehicleId(data.vehicle.vehicleId);
          }
          if (data.rules) {
            setFuelingRules(data.rules);
          }
          setStep("volume");
          break;
        case "scan":
          setSelectedNozzle(data.nozzle);
          setStep("scan");
          break;
      }
    },
    [selectedTank]
  );

  // ===========================================
  // TANK TRANSFER SUBMISSION
  // ===========================================
  const handleTransferConfirm = useCallback(async () => {
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

      setPendingAuthData({ isTransfer: true, ...transferAuthData });

      console.log(
        "[useFuelingProcess] Tank transfer authorization:",
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
      console.error("[useFuelingProcess] Transfer error:", error);
      setIsAuthorizing(false);
      // Handle validation errors from thrown Error object
      const errorMessage =
        error.validationErrors?.length > 0
          ? error.validationErrors.join("\n")
          : error.message ||
            "Failed to process tank transfer. Please check your connection and try again.";
      setAuthError(errorMessage);
    }
  }, [
    isAuthorizing,
    ptsId,
    selectedPump,
    selectedNozzle,
    selectedTank,
    destinationTank,
    transferVolume,
    transferReason,
  ]);

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

        // Check if mobile location validation is required for this PTS device
        const requireMobileLocation =
          ptsDevice?.requireMobileAppProximity === 1;
        // User-level bypass takes precedence, then device-level bypass
        const userBypassEnabled =
          loggedInUser?.bypassLocationValidation === true;
        const bypassOnGPSFailure =
          userBypassEnabled || ptsDevice?.bypassOnGPSFailure === 1;

        if (userBypassEnabled) {
          console.log(
            "[useFuelingProcess] User has GPS bypass enabled - location validation will be relaxed"
          );
        }

        let deviceLocation = null;

        if (requireMobileLocation && !userBypassEnabled) {
          console.log(
            "[useFuelingProcess] Mobile location required for this device, getting location..."
          );

          // Get location with configuration from PTS device
          deviceLocation = await locationService.getLocationForFueling({
            requireHighAccuracy: false, // Use network location first for reliability
            silentMode: locationService.permissionVerified, // Silent if already verified
            allowCachedLocation: bypassOnGPSFailure, // Allow cached if bypass is enabled
            maxAccuracyMeters: ptsDevice?.mobileAppProximityRadius || 500,
          });

          if (!deviceLocation && !bypassOnGPSFailure) {
            // Location is required but couldn't be obtained and bypass is disabled
            console.warn(
              "[useFuelingProcess] Could not get location and bypass is disabled"
            );
            setIsAuthorizing(false);
            setAuthError(
              "Location is required for fueling at this site but could not be obtained. " +
                "Please enable location services and try again."
            );
            return;
          }
        } else {
          // Location not required, but try to get it anyway for logging (silent mode)
          console.log(
            "[useFuelingProcess] Mobile location not required, attempting silent location fetch..."
          );
          deviceLocation = await locationService.getLocationForFueling({
            requireHighAccuracy: false,
            silentMode: true, // Never show alerts if not required
            allowCachedLocation: true,
            maxAccuracyMeters: 1000, // Accept lower accuracy since it's optional
          });
        }

        if (deviceLocation) {
          console.log(
            "[useFuelingProcess] Device location obtained:",
            `lat=${deviceLocation.latitude}, lng=${deviceLocation.longitude}, accuracy=${deviceLocation.accuracy}m`
          );
        } else {
          console.log(
            "[useFuelingProcess] Proceeding without location" +
              (bypassOnGPSFailure ? " (bypass enabled)" : "")
          );
        }

        setAuthorizingStatus("authorizing");

        const authRequest = {
          deviceId: ptsId,
          pumpId: selectedPump.id,
          nozzle: selectedNozzle.id,
          type: typeMapping[authType] ?? 2,
          // For Full/FullTank: use the dose passed (which now contains maxFuelAllowed)
          // The pump needs a non-zero cutoff value to know when to stop
          dose: parseFloat(dose) || 0,
          vehicleId: vehicleId,
          tankId: selectedTank?.tankId || selectedTank?.id,
          tag: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
          odometer: odometer ? parseFloat(odometer) : null,
          employeeId: selectedDriver?.id || null,
          mobileLocation: deviceLocation
            ? locationService.formatForApi(deviceLocation)
            : null,
          // CRITICAL: Enable auto-close so transaction is automatically saved when fueling completes
          autoCloseTransaction: true,
        };

        console.log(
          "[useFuelingProcess] Starting authorization:",
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
        console.error("[useFuelingProcess] Authorization error:", error);
        setIsAuthorizing(false);
        // Handle validation errors from rejectWithValue payload or thrown Error object
        // rejectWithValue returns an object with { message, validationErrors }
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
      ptsDevice,
      selectedPump,
      selectedNozzle,
      selectedTank,
      odometer,
      loggedInUser,
    ]
  );

  const handleVehicleFuelingConfirm = useCallback(async () => {
    // Calculate the dose to send to the pump
    // When full tank is selected, use the maximum allowed from fueling rules
    // The pump needs a specific cutoff value - it cannot accept 0 for full tank
    let doseToSend = null;

    if (isFullTank) {
      // For full tank: use maxFuelAllowed from rules, fallback to hardLimit, then tankCapacity
      doseToSend =
        fuelingRules?.maxFuelAllowed ||
        fuelingRules?.hardLimit ||
        fuelingRules?.tankCapacity ||
        selectedVehicle?.fuelTankCapacity ||
        null;

      console.log(
        "[useFuelingProcess] Full tank selected, using max allowed dose:",
        doseToSend
      );
    } else {
      // For manual volume: use the entered value
      doseToSend = parseFloat(fuelingVolume) || null;
    }

    const authData = {
      authType: isFullTank ? "Full" : fuelingVolume ? "Volume" : "Full",
      dose: doseToSend,
      vehicleId: selectedVehicle?.vehicleId || selectedVehicle?.id,
      tagId: selectedTag || tagDetails?.tagId || vehicleInfo?.tagId,
      useMasterTag: useMasterTag,
    };

    console.log("[useFuelingProcess] Starting real authorization:", {
      pumpId: selectedPump?.id,
      nozzleId: selectedNozzle?.id,
      tankId: selectedTank?.tankId || selectedTank?.id,
      ...authData,
    });

    await startFueling(authData);
  }, [
    isFullTank,
    fuelingVolume,
    fuelingRules,
    selectedVehicle,
    selectedTag,
    tagDetails,
    vehicleInfo,
    useMasterTag,
    selectedPump,
    selectedNozzle,
    selectedTank,
    startFueling,
  ]);

  // ===========================================
  // RETRY AND CANCEL HANDLERS
  // ===========================================
  const handleRetryAuthorization = useCallback(() => {
    if (pendingAuthData) {
      setAuthError(null);
      if (pendingAuthData.isTransfer) {
        handleTransferConfirm();
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
  // TRANSACTION HANDLERS
  // ===========================================
  const handleTransactionComplete = useCallback((transactionId, transactionData) => {
    console.log("[useFuelingProcess] Transaction complete:", transactionId);
    console.log("[useFuelingProcess] Transaction data:", transactionData);

    setShowTransactionMonitoring(false);
    setCurrentTransactionId(null);

    // Store completed transaction data for summary step display
    setCompletedTransactionData({
      ...transactionData,
      transactionId,
      tankInfo: selectedTank,
      destinationTank: destinationTank,
      driverInfo: selectedDriver,
    });

    // Navigate to summary step to show transaction receipt
    setStep("summary");

    Toast.show({
      type: "success",
      text1: "Transaction Complete",
      text2: `Transaction ${transactionId} completed successfully`,
    });
  }, [selectedTank, destinationTank, selectedDriver]);

  // Handler for starting new fueling from summary step
  const handleStartNewFueling = useCallback(() => {
    const preservedTank = selectedTank;

    // Clear completed transaction data
    setCompletedTransactionData(null);

    // Reset to pump selection if tank is preserved, otherwise tank selection
    setStep(preservedTank ? "pump" : "tank");
    setSelectedPump(null);
    setSelectedNozzle(null);
    setOperationMode(null);
    setDestinationTank(null);
    setTransferVolume("");
    setTransferReason("");
    setSelectedVehicle(null);
    setSelectedVehicleId(null);
    setVehicleReg("");
    setFuelingVolume("");
    setIsFullTank(false);
    setOdometer("");
    setNotes("");
    setScanResult(null);
    setVehicleInfo(null);
    setTagDetails(null);
    setSelectedTag(null);
    setVolume("");
    setSelectedType("Full");
    setUseMasterTag(false);
    setSelectedDriver(null);
  }, [selectedTank]);

  // Handler for going back to pump selection from summary step
  const handleBackToPumps = useCallback(() => {
    setCompletedTransactionData(null);
    // Go back to pump selection, preserving the selected tank
    setStep(selectedTank ? "pump" : "tank");
    setSelectedPump(null);
    setSelectedNozzle(null);
    setOperationMode(null);
  }, [selectedTank]);

  const resetFuelingProcess = useCallback(() => {
    const preservedTank = selectedTank;

    setStep(preservedTank ? "pump" : "tank");
    setSelectedPump(null);
    setSelectedNozzle(null);
    setOperationMode(null);
    setDestinationTank(null);
    setTransferVolume("");
    setTransferReason("");
    setSelectedVehicle(null);
    setSelectedVehicleId(null);
    setVehicleReg("");
    setFuelingVolume("");
    setIsFullTank(false);
    setOdometer("");
    setNotes("");
    setScanResult(null);
    setVehicleInfo(null);
    setTagDetails(null);
    setSelectedTag(null);
    setVolume("");
    setSelectedType("Full");
    setUseMasterTag(false);
  }, [selectedTank]);

  // ===========================================
  // SCAN HANDLER
  // ===========================================
  const handleScan = useCallback(async () => {
    setIsScanning(true);
    console.log(
      "[useFuelingProcess] Scan initiated - listening for RFID tags via deviceId:",
      ptsId
    );
  }, [ptsId]);

  // ===========================================
  // VEHICLE SELECTION HANDLER
  // ===========================================
  const handleVehicleSelect = useCallback(
    async (vehicle) => {
      try {
        const result = await dispatch(validateVehicle(vehicle.id)).unwrap();
        if (result.success) {
          setVehicleInfo(result.data);
          setSelectedVehicleId(vehicle.id);
        }
      } catch (error) {
        Alert.alert("Error", "Failed to validate vehicle");
      }
    },
    [dispatch]
  );

  // ===========================================
  // ACTIVE FUELING PUMP (for header display)
  // ===========================================
  const activeFuelingPump = useMemo(() => {
    if (!activeFuelingProcesses || activeFuelingProcesses.length === 0) {
      return null;
    }
    return activeFuelingProcesses[0];
  }, [activeFuelingProcesses]);

  // ===========================================
  // VIEW FUELING FROM HEADER
  // ===========================================
  const handleViewFuelingFromHeader = useCallback(
    (pump) => {
      const targetPump = pump || activeFuelingPump;
      if (targetPump) {
        const pumpToSelect = availablePumps?.find(
          (p) => p.id === targetPump.pumpId
        );
        if (pumpToSelect) {
          setSelectedPump(pumpToSelect);
        }
        const isExternal =
          !currentTransactionId ||
          currentTransactionId !== targetPump.transaction;
        setIsViewingExternalFueling(isExternal);
        setViewingPumpData(targetPump);
        setShowTransactionMonitoring(true);
      }
    },
    [activeFuelingPump, availablePumps, currentTransactionId]
  );

  // ===========================================
  // MINIMIZE MONITORING
  // ===========================================
  const handleMinimizeMonitoring = useCallback(() => {
    setShowTransactionMonitoring(false);
    setIsViewingExternalFueling(false);
    setViewingPumpData(null);

    setStep("pump");
    setSelectedPump(null);
    setSelectedNozzle(null);
    setOperationMode(null);
    setSelectedVehicle(null);
    setFuelingVolume("");
    setIsFullTank(false);

    Toast.show({
      type: "info",
      text1: "Fueling Minimized",
      text2: "You can start another fueling or tap the banner to view",
      visibilityTime: 3000,
    });
  }, []);

  // ===========================================
  // CLOSE TRANSACTION MONITORING
  // ===========================================
  const handleCloseTransactionMonitoring = useCallback(() => {
    setShowTransactionMonitoring(false);
    setIsViewingExternalFueling(false);
    setViewingPumpData(null);
  }, []);

  // Return all state and handlers
  return {
    // Navigation
    navigation,

    // Step state
    step,
    setStep,
    tankLoadingComplete,
    handleStepBack,
    handleStepNext,
    getStepOrder,

    // Device data
    ptsId,
    ptsDevice,
    deviceConnectionStatus,
    isLiveDataEnabled,
    isDataLoading,
    isRefreshing,
    handleRefreshData,
    rawUploadStatus,

    // Tank state
    availableTanks,
    selectedTank,
    setSelectedTank,
    handleChangeTank,
    destinationTank,
    setDestinationTank,

    // Pump and nozzle state
    availablePumps,
    selectedPump,
    setSelectedPump,
    selectedNozzle,
    setSelectedNozzle,
    getPumpDetails,
    getNozzlesForPump,
    fuelGrades,

    // Operation mode
    operationMode,
    setOperationMode,

    // Transfer state
    transferVolume,
    setTransferVolume,
    transferReason,
    setTransferReason,
    handleTransferConfirm,

    // Vehicle state
    vehicles,
    isLoadingVehicles,
    selectedVehicle,
    setSelectedVehicle,
    selectedVehicleId,
    vehicleReg,
    setVehicleReg,
    vehicleInfo,
    setVehicleInfo,
    handleVehicleSelect,

    // Fueling state
    fuelingVolume,
    setFuelingVolume,
    isFullTank,
    setIsFullTank,
    odometer,
    setOdometer,
    notes,
    setNotes,
    selectedType,
    setSelectedType,
    volume,
    setVolume,
    fuelingRules,
    setFuelingRules,
    handleVehicleFuelingConfirm,

    // Driver/Employee state
    selectedDriver,
    setSelectedDriver,

    // Authorization state
    isAuthorizing,
    authorizingStatus,
    authError,
    handleRetryAuthorization,
    handleCancelAuthorization,

    // Scanning state
    isScanning,
    setIsScanning,
    scanResult,
    setScanResult,
    tagDetails,
    setTagDetails,
    selectedTag,
    setSelectedTag,
    selectionMethod,
    setSelectionMethod,
    useMasterTag,
    setUseMasterTag,
    handleScan,

    // Transaction monitoring
    showTransactionMonitoring,
    setShowTransactionMonitoring,
    currentTransactionId,
    isViewingExternalFueling,
    viewingPumpData,
    handleTransactionComplete,
    handleMinimizeMonitoring,
    handleCloseTransactionMonitoring,
    handleViewFuelingFromHeader,

    // Summary step
    completedTransactionData,
    handleStartNewFueling,
    handleBackToPumps,

    // Active fueling
    activeFuelingProcesses,
    activeFuelingPump,

    // Validation settings
    validationSettings,

    // Site info
    sites,
    siteName,
    loggedInUser,
  };
};

export default useFuelingProcess;
