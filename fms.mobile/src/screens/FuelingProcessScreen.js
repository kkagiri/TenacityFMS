//Cursor - Mobile fueling process screen adapted from web frontend
// Enhanced with Tank selection, Mode selection (Vehicle Fueling / Tank Transfer)
import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  BackHandler,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useDispatch, useSelector } from "react-redux";
import {
  useNavigation,
  useRoute,
  useFocusEffect,
} from "@react-navigation/native";
import Toast from "react-native-toast-message";

// Import mobile components
import TankSelectionStep from "../components/fueling/TankSelectionStep";
import PumpSelectionStep from "../components/fueling/PumpSelectionStep";
import NozzleSelectionStep from "../components/fueling/NozzleSelectionStep";
import ModeSelectionStep from "../components/fueling/ModeSelectionStep";
import TransferDetailsStep from "../components/fueling/TransferDetailsStep";
import VehicleSelectionStep from "../components/fueling/VehicleSelectionStep";
import FuelingVolumeStep from "../components/fueling/FuelingVolumeStep";
import ScanStep from "../components/fueling/ScanStep";
import TransactionMonitoringModal from "../components/fueling/TransactionMonitoringModal";
import FuelingHeader from "../components/fueling/FuelingHeader";
import LoadingOverlay from "../components/common/LoadingOverlay";

// Import hooks and services
import { useDeviceData } from "../hooks/useDeviceData";
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

const FuelingProcessScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  // Get params - ptsId is required for real device connection
  const ptsId = route.params?.ptsId;

  // Validate that ptsId was provided
  useEffect(() => {
    if (!ptsId) {
      console.error(
        "[FuelingProcess] ERROR: No ptsId provided in route params"
      );
      Toast.show({
        type: "error",
        text1: "Device Not Selected",
        text2: "Please select a PTS device from the device list",
        position: "bottom",
        visibilityTime: 4000,
      });
      navigation.goBack();
    }
  }, [ptsId, navigation]);
  const siteId = route.params?.siteId || 1;
  const previousPumpStatuses = useRef({});

  // Redux state
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
    probeTanks, // Tank data from PTS probes
  } = useDeviceData(ptsId);

  // Memoized selectors to prevent unnecessary rerenders
  const ptsDeviceList = useSelector((state) => state.device.ptsDeviceList);
  const ptsDevice = useMemo(
    () => ptsDeviceList.find((dev) => dev.ptsid === ptsId),
    [ptsDeviceList, ptsId]
  );

  const sites = useSelector((state) => state.site.sites);
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const isLoadingVehicles = useSelector((state) => state.vehicle.loading);
  const loggedInUser = useSelector((state) => state.auth.user);

  // Tank data from Redux - prefer API data over probe data
  const {
    tanks: apiTanks,
    filteredTanks,
    isLoading: isLoadingTanks,
  } = useSelector((state) => state.tank);

  // Memoize filtered events to avoid new array on each render
  const allFuelingEvents = useSelector((state) => state.fuelingEvent.events);
  const fuelingEvents = useMemo(
    () => allFuelingEvents.filter((e) => e.deviceId === ptsId),
    [allFuelingEvents, ptsId]
  );

  // Use API tanks first, fallback to probe tanks from PTS if no API data
  const availableTanks = useMemo(() => {
    // Priority: filtered tanks by site > probe tanks from PTS > empty array
    if (filteredTanks?.length > 0) return filteredTanks;
    if (probeTanks?.length > 0) return probeTanks;
    return [];
  }, [filteredTanks, probeTanks]);

  // Check if data is still loading (no mock mode anymore - always use real data)
  const isDataLoading =
    deviceConnectionStatus === "connecting" && availableTanks.length === 0;

  // Local state - Enhanced for new flow
  // Steps: 'tank' -> 'pump' -> 'nozzle' -> 'mode' -> 'transfer'/'vehicle' -> 'volume'/'details'
  // Note: step defaults to null until we check for saved tank
  const [step, setStep] = useState(null); // Will be set after checking saved tank
  const [selectedTank, setSelectedTank] = useState(null);
  const [tankLoadingComplete, setTankLoadingComplete] = useState(false); // Track if tank loading is done
  const [selectedPump, setSelectedPump] = useState(null);
  const [selectedNozzle, setSelectedNozzle] = useState(null);
  const [operationMode, setOperationMode] = useState(null); // 'vehicle' or 'transfer'
  const [destinationTank, setDestinationTank] = useState(null);
  const [transferVolume, setTransferVolume] = useState("");
  const [transferReason, setTransferReason] = useState("");
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [vehicleReg, setVehicleReg] = useState("");
  const [fuelingVolume, setFuelingVolume] = useState("");
  const [isFullTank, setIsFullTank] = useState(false);
  const [odometer, setOdometer] = useState("");
  const [notes, setNotes] = useState("");
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [selectedType, setSelectedType] = useState("Full");
  const [volume, setVolume] = useState("");
  const [showTransactionMonitoring, setShowTransactionMonitoring] =
    useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [isViewingExternalFueling, setIsViewingExternalFueling] =
    useState(false);
  const [viewingPumpData, setViewingPumpData] = useState(null); // Track which pump we're viewing
  const [tagDetails, setTagDetails] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectionMethod, setSelectionMethod] = useState("lookup");
  const [useMasterTag, setUseMasterTag] = useState(false);
  const [deviceConnectionStatus, setDeviceConnectionStatus] =
    useState("connecting");
  const [isRefreshing, setIsRefreshing] = useState(false); // For refresh button state
  const [fuelingRules, setFuelingRules] = useState(null); // Fueling rules from validation step

  // Fueling validation settings
  const [validationSettings, setValidationSettings] = useState({
    fuelRulesCheckEnabled: true,
    fuelCapacityValidationEnabled: true,
    gpsFuelLevelCheckEnabled: true,
  });

  // Debug logging - log on every render to trace state changes
  console.log("[FuelingProcess] RENDER - ptsId:", ptsId);
  console.log("[FuelingProcess] RENDER - probeTanks:", probeTanks?.length || 0);
  console.log(
    "[FuelingProcess] RENDER - apiTanks:",
    filteredTanks?.length || 0
  );
  console.log(
    "[FuelingProcess] RENDER - rawUploadStatus:",
    rawUploadStatus ? "exists" : "null"
  );
  console.log(
    "[FuelingProcess] RENDER - connectionStatus:",
    deviceConnectionStatus
  );
  console.log(
    "[FuelingProcess] RENDER - isLiveDataEnabled:",
    isLiveDataEnabled
  );

  // Get site name
  const siteName = useCallback(() => {
    if (!ptsDevice?.site && !siteId) return null;
    const targetSiteId = ptsDevice?.site || siteId;
    if (!sites?.length) return null;
    const site = sites.find((s) => s.id === targetSiteId);
    return site?.name || null;
  }, [ptsDevice, sites, siteId]);

  // Refresh handler - refetch tank data and device status
  const handleRefreshData = useCallback(async () => {
    const targetSiteId = ptsDevice?.site || siteId;
    setIsRefreshing(true);
    try {
      console.log("[FuelingProcess] Refreshing data...");

      // Refresh tanks from API
      if (targetSiteId) {
        await dispatch(fetchTanksBySite(targetSiteId)).unwrap();
        console.log("[FuelingProcess] Tanks refreshed");
      }

      // Re-subscribe to device updates if connected
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
      console.error("[FuelingProcess] Error refreshing data:", error.message);
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

  // Initialize data - fetch from real APIs (no mock fallback)
  useEffect(() => {
    const initializeData = async () => {
      // Load fueling validation settings
      try {
        const settings = await fuelingValidationSettings.loadSettings();
        setValidationSettings(settings);
        console.log("[FuelingProcess] Loaded validation settings:", settings);
      } catch (error) {
        console.warn(
          "[FuelingProcess] Failed to load validation settings:",
          error
        );
      }

      // Always fetch vehicle and site lists
      dispatch(fetchVehicleList());
      dispatch(fetchSiteList());

      // Get the actual site ID to use
      const targetSiteId = ptsDevice?.site || siteId;

      // Try to connect to real SignalR and fetch tank data
      let useRealData = false;

      try {
        console.log("[FuelingProcess] Attempting to connect to SignalR...");
        setDeviceConnectionStatus("connecting");

        // Start SignalR connection
        await signalRService.start(HubPaths.PTS);

        // Subscribe to device updates
        if (ptsId) {
          await signalRService.subscribeToDevice(ptsId);
        }

        // Fetch tanks from API if we have a site ID
        if (targetSiteId) {
          console.log(
            "[FuelingProcess] Fetching tanks for site:",
            targetSiteId
          );
          const tankResult = await dispatch(
            fetchTanksBySite(targetSiteId)
          ).unwrap();
          console.log(
            "[FuelingProcess] Tanks fetched:",
            tankResult?.length || 0
          );
        }

        useRealData = true;
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
          "[FuelingProcess] Failed to connect to PTS device:",
          error.message
        );

        // Show connection error - no mock data fallback in production
        setDeviceConnectionStatus("disconnected");
        dispatch(setLiveDataEnabled(false));

        Toast.show({
          type: "error",
          text1: "Connection Failed",
          text2: `Unable to connect to PTS device: ${error.message}`,
          position: "bottom",
          visibilityTime: 4000,
        });

        // Alert user with option to retry or go back
        Alert.alert(
          "Connection Error",
          `Could not connect to PTS device "${ptsId}". Please ensure:\n\n• The device is powered on\n• Network connection is available\n• The server is running\n\nWould you like to retry?`,
          [
            {
              text: "Go Back",
              style: "cancel",
              onPress: () => navigation.goBack(),
            },
            {
              text: "Retry",
              onPress: () => {
                // Re-trigger the useEffect by updating a dependency
                handleRefreshData();
              },
            },
          ]
        );
      }
    };

    initializeData();

    // Cleanup: unsubscribe from device and stop SignalR when component unmounts
    return () => {
      if (ptsId) {
        signalRService.unsubscribeFromDevice(ptsId);
      }
    };
  }, [dispatch, ptsId, ptsDevice?.site, siteId]);

  // Load saved tank selection on mount - this determines initial step
  useEffect(() => {
    const loadSavedTank = async () => {
      try {
        const storageKey = `${TANK_STORAGE_KEY_PREFIX}${ptsId}`;
        const savedTankJson = await AsyncStorage.getItem(storageKey);

        if (savedTankJson) {
          const savedTank = JSON.parse(savedTankJson);
          console.log("[FuelingProcess] Loaded saved tank:", savedTank);
          setSelectedTank(savedTank);
          setStep("pump"); // Skip tank selection, go directly to pump

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
          setStep("tank"); // No saved tank, start from tank selection
        }
      } catch (error) {
        console.error("[FuelingProcess] Error loading saved tank:", error);
        setStep("tank"); // On error, start from tank selection
      } finally {
        setTankLoadingComplete(true);
      }
    };

    loadSavedTank();
  }, [ptsId]);

  // Save tank selection to AsyncStorage whenever it changes
  useEffect(() => {
    const saveTank = async () => {
      if (!tankLoadingComplete) return; // Don't save until initial load is complete

      try {
        const storageKey = `${TANK_STORAGE_KEY_PREFIX}${ptsId}`;
        if (selectedTank) {
          await AsyncStorage.setItem(storageKey, JSON.stringify(selectedTank));
          console.log("[FuelingProcess] Saved tank selection:", selectedTank);
        }
        // Note: We don't remove saved tank when cleared - only explicit clear does that
      } catch (error) {
        console.error("[FuelingProcess] Error saving tank:", error);
      }
    };

    saveTank();
  }, [selectedTank, ptsId, tankLoadingComplete]);

  // Handle changing tank - navigates back to tank selection and clears downstream selections
  const handleChangeTank = useCallback(async () => {
    console.log("[FuelingProcess] User requested tank change");

    // Clear the saved tank from storage
    try {
      const storageKey = `${TANK_STORAGE_KEY_PREFIX}${ptsId}`;
      await AsyncStorage.removeItem(storageKey);
    } catch (error) {
      console.error("[FuelingProcess] Error clearing saved tank:", error);
    }

    // Clear tank selection and downstream selections
    setSelectedTank(null);
    setSelectedPump(null);
    setSelectedNozzle(null);
    setOperationMode(null);
    setDestinationTank(null);
    setSelectedVehicle(null);

    // Navigate to tank selection step
    setStep("tank");

    Toast.show({
      type: "info",
      text1: "Select New Tank",
      text2: "Choose a source tank for fueling",
      position: "bottom",
    });
  }, [ptsId]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step !== "tank") {
          handleStepBack();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => backHandler.remove();
    }, [step])
  );

  // Get step order based on operation mode
  const getStepOrder = () => {
    if (operationMode === "transfer") {
      return ["tank", "pump", "nozzle", "mode", "transfer"];
    } else if (operationMode === "vehicle") {
      return ["tank", "pump", "nozzle", "mode", "vehicle", "volume"];
    }
    return ["tank", "pump", "nozzle", "mode"];
  };

  // Handle step navigation
  const handleStepBack = () => {
    switch (step) {
      case "pump":
        // If tank was persisted (selectedTank exists), don't go back to tank step
        // Instead, exit the fueling process
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
        break;
      case "volume":
        setStep("vehicle");
        setSelectedVehicle(null);
        break;
      case "scan":
        setStep("nozzle");
        setSelectedNozzle(null);
        break;

      default:
        navigation.goBack();
    }
  };

  const handleStepNext = (nextStep, data = {}) => {
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
          "[FuelingProcess] Entering transfer step, selectedTank:",
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
  };

  // Handle tank transfer submission - calls real API
  const handleTransferConfirm = async () => {
    if (isAuthorizing) return;

    try {
      setIsAuthorizing(true);

      // Prepare data matching backend PumpAuthorizeTransferCommand structure
      const transferAuthData = {
        deviceId: ptsId,
        pumpId: selectedPump?.id,
        nozzle: selectedNozzle?.id, // Required by backend
        sourceTankId:
          selectedTank?.probeId || selectedTank?.tankId || selectedTank?.id,
        destinationTankId: destinationTank?.tankId || destinationTank?.id,
        volume: parseFloat(transferVolume),
        reason: transferReason || "Tank Transfer",
      };

      console.log(
        "[Mobile Fueling] Tank transfer authorization:",
        transferAuthData
      );

      // Call real API
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

        // Open transaction monitoring modal
        setShowTransactionMonitoring(true);
      } else {
        Alert.alert(
          "Authorization Failed",
          result.message || "Failed to authorize transfer"
        );
      }
    } catch (error) {
      console.error("[Mobile Fueling] Transfer error:", error);
      Alert.alert(
        "Transfer Error",
        error.message ||
          "Failed to process tank transfer. Please check your connection and try again."
      );
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Handle vehicle fueling confirmation - Call real API authorization
  const handleVehicleFuelingConfirm = async () => {
    // Gather authorization data from state
    const authData = {
      authType: isFullTank ? "Full" : fuelingVolume ? "Volume" : "Full",
      dose: isFullTank ? null : parseFloat(fuelingVolume) || null,
      vehicleId: selectedVehicle?.vehicleId || selectedVehicle?.id,
      tagId: selectedTag || tagDetails?.tagId || vehicleInfo?.tagId,
      useMasterTag: useMasterTag,
    };

    console.log("[Mobile Fueling] Starting real authorization:", {
      pumpId: selectedPump?.id,
      nozzleId: selectedNozzle?.id,
      tankId: selectedTank?.tankId || selectedTank?.id,
      ...authData,
    });

    // Call real authorization
    await startFueling(authData);
  };

  // Start fueling authorization
  const startFueling = async (authorizationData) => {
    if (isAuthorizing) return;

    try {
      setIsAuthorizing(true);

      const {
        authType,
        dose,
        vehicleId,
        tagId,
        useMasterTag: shouldUseMasterTag,
      } = authorizationData;

      // Validate required data
      const validation = FuelingUtils.validateTransactionData(
        selectedPump?.id,
        selectedNozzle?.id,
        vehicleId,
        tagId,
        authType,
        dose
      );

      if (!validation.isValid) {
        Alert.alert("Validation Error", validation.errors.join("\n"));
        return;
      }

      // Map frontend type values to backend enum values (matching web app pattern)
      // Backend expects: Volume=0, Amount=1, FullTank=2
      const typeMapping = {
        Volume: 0,
        Amount: 1,
        Full: 2,
        FullTank: 2,
      };

      // Get mobile device location for proximity validation
      console.log(
        "[Mobile Fueling] Getting device location for authorization..."
      );
      const deviceLocation = await locationService.getLocationForFueling();

      if (!deviceLocation) {
        // Location service already showed appropriate alert to user
        console.warn(
          "[Mobile Fueling] Could not get device location - proceeding without location"
        );
      } else {
        console.log(
          "[Mobile Fueling] Device location obtained:",
          `lat=${deviceLocation.latitude}, lng=${deviceLocation.longitude}, accuracy=${deviceLocation.accuracy}m`
        );
      }

      // Prepare authorization request matching backend PumpAuthorizeCommand
      const authRequest = {
        deviceId: ptsId,
        pumpId: selectedPump.id,
        nozzle: selectedNozzle.id,
        type: typeMapping[authType] ?? 2, // Default to FullTank if unknown
        dose:
          authType === "Full" || authType === "FullTank"
            ? 0
            : parseFloat(dose) || 0,
        vehicleId: vehicleId,
        tankId: selectedTank?.tankId || selectedTank?.id,
        tag: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
        odometer: odometer ? parseFloat(odometer) : null,
        // Include mobile location for proximity validation (backend LocationValidationService)
        mobileLocation: deviceLocation
          ? locationService.formatForApi(deviceLocation)
          : null,
      };

      console.log(
        "[Mobile Fueling] Starting authorization:",
        JSON.stringify(authRequest, null, 2)
      );
      console.log(
        "[Mobile Fueling] Dose value:",
        dose,
        "Type:",
        typeof dose,
        "AuthType:",
        authType
      );

      // Dispatch authorization action
      const result = await dispatch(authorizePump(authRequest)).unwrap();

      // Handle FMSResponse<T> structure from backend (same as web app pattern)
      if (result.isSuccess) {
        const transactionId =
          result.data?.transaction || result.data?.transactionId;
        const pumpIdFromResponse = result.data?.pump || selectedPump.id;
        const nozzleIdFromResponse = result.data?.nozzleId || selectedNozzle.id;

        setCurrentTransactionId(transactionId);
        setShowTransactionMonitoring(true);

        // Create fueling event
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
      } else {
        Alert.alert(
          "Authorization Failed",
          result.message || "Failed to authorize pump"
        );
      }
    } catch (error) {
      console.error("[Mobile Fueling] Authorization error:", error);
      Alert.alert("Error", error.message || "Failed to start fueling");
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Handle transaction completion
  const handleTransactionComplete = (transactionId) => {
    setShowTransactionMonitoring(false);
    setCurrentTransactionId(null);

    // Reset to pump selection
    resetFuelingProcess();

    Toast.show({
      type: "success",
      text1: "Transaction Complete",
      text2: `Transaction ${transactionId} completed successfully`,
    });
  };

  // Reset fueling process - preserves tank selection since it's persisted
  const resetFuelingProcess = () => {
    // Preserve tank selection - user selected it for the day
    // They can change it via "Change Tank" button if needed
    const preservedTank = selectedTank;

    // Reset to pump step if tank is selected, otherwise tank step
    setStep(preservedTank ? "pump" : "tank");
    // Don't clear selectedTank - it's persisted
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
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case "tank":
        return (
          <TankSelectionStep
            tanks={availableTanks}
            selectedTank={selectedTank}
            onSelectTank={setSelectedTank}
            onNext={(tank) => {
              console.log("[FuelingProcess] Tank selected via callback:", tank);
              handleStepNext("pump", { tank: tank || selectedTank });
            }}
            onBack={() => navigation.goBack()}
            onRefresh={handleRefreshData}
            isLoadingTanks={isDataLoading}
            isRefreshing={isRefreshing}
          />
        );
      case "pump":
        return (
          <PumpSelectionStep
            pumps={availablePumps}
            activePumps={activeFuelingProcesses}
            onPumpSelect={(pump) => handleStepNext("nozzle", { pump })}
            onRefresh={handleRefreshData}
            connectionStatus={deviceConnectionStatus}
            isRefreshing={isRefreshing}
            nozzleConfig={rawUploadStatus?.Pumps?.NozzleConfig || {}}
          />
        );
      case "nozzle":
        return (
          <NozzleSelectionStep
            pump={selectedPump}
            nozzles={getNozzlesForPump(selectedPump?.id)}
            fuelGrades={fuelGrades}
            onNozzleSelect={(nozzle) => handleStepNext("mode", { nozzle })}
            onRefresh={handleRefreshData}
            isRefreshing={isRefreshing}
            onBack={handleStepBack}
          />
        );
      case "mode":
        return (
          <ModeSelectionStep
            selectedMode={operationMode}
            onSelectMode={setOperationMode}
            onNext={(mode) => {
              // Mode is passed directly from callback to avoid state timing issues
              const selectedModeValue = mode || operationMode;
              if (selectedModeValue === "transfer") {
                handleStepNext("transfer");
              } else if (selectedModeValue === "vehicle") {
                handleStepNext("vehicle");
              }
            }}
            onBack={handleStepBack}
          />
        );
      case "transfer":
        return (
          <TransferDetailsStep
            sourceTank={selectedTank}
            destinationTank={destinationTank}
            transferVolume={transferVolume}
            transferReason={transferReason}
            onSelectDestination={setDestinationTank}
            onVolumeChange={setTransferVolume}
            onReasonChange={setTransferReason}
            onNext={handleTransferConfirm}
            onBack={handleStepBack}
            selectedPump={selectedPump}
            selectedNozzle={selectedNozzle}
            pumpDetails={getPumpDetails(selectedPump?.id)}
          />
        );
      case "vehicle":
        return (
          <VehicleSelectionStep
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(vehicle, rules) => {
              setSelectedVehicle(vehicle);
              setVehicleInfo(vehicle);
              setFuelingRules(rules); // Store fueling rules from validation
            }}
            onScanRfid={handleScan}
            isScanning={isScanning}
            onNext={() =>
              handleStepNext("volume", { vehicle: selectedVehicle })
            }
            onBack={handleStepBack}
            enableFuelRulesCheck={validationSettings.fuelRulesCheckEnabled}
          />
        );
      case "volume":
        return (
          <FuelingVolumeStep
            selectedVehicle={selectedVehicle}
            sourceTank={selectedTank}
            selectedPump={selectedPump}
            selectedNozzle={selectedNozzle}
            pumpDetails={getPumpDetails(selectedPump?.id)}
            volume={fuelingVolume}
            isFullTank={isFullTank}
            odometer={odometer}
            notes={notes}
            onVolumeChange={setFuelingVolume}
            onFullTankChange={setIsFullTank}
            onOdometerChange={setOdometer}
            onNotesChange={setNotes}
            onNext={handleVehicleFuelingConfirm}
            onBack={handleStepBack}
            enableFuelCapacityValidation={
              validationSettings.fuelCapacityValidationEnabled
            }
            enableGPSFuelLevelCheck={
              validationSettings.gpsFuelLevelCheckEnabled
            }
            fuelingRules={fuelingRules}
          />
        );
      case "scan":
        return (
          <ScanStep
            isScanning={isScanning}
            scanResult={scanResult}
            vehicleInfo={vehicleInfo}
            selectionMethod={selectionMethod}
            vehicles={vehicles}
            vehicleReg={vehicleReg}
            onScan={handleScan}
            onVehicleSelect={(vehicle, rules) => {
              setSelectedVehicle(vehicle);
              setVehicleInfo(vehicle);
              setFuelingRules(rules); // Store fueling rules from ScanStep
              handleStepNext("volume", { vehicle, rules });
            }}
            onNext={(data) => handleStepNext("volume", data)}
            onBack={handleStepBack}
            setSelectionMethod={setSelectionMethod}
            setVehicleReg={setVehicleReg}
            isLoadingVehicles={isLoadingVehicles}
            deviceId={ptsId}
          />
        );
      default:
        return null;
    }
  };

  // Handle tag scanning - now uses real RFID detection via ScanStep's deviceId prop
  const handleScan = async () => {
    // Start scanning state - actual tag detection is handled by ScanStep
    // via useDeviceData hook which listens for real RFID tags from SignalR
    setIsScanning(true);
    console.log(
      "[FuelingProcess] Scan initiated - listening for RFID tags via deviceId:",
      ptsId
    );

    // Note: We don't simulate tags anymore. ScanStep will:
    // 1. Use deviceId to subscribe to real RFID tag detection from upload status
    // 2. Call pumpControlService.getTagDetails() to validate detected tags
    // 3. Auto-select vehicle when valid tag is detected
  };

  // Handle vehicle selection
  const handleVehicleSelect = async (vehicle) => {
    try {
      const result = await dispatch(validateVehicle(vehicle.id)).unwrap();
      if (result.success) {
        setVehicleInfo(result.data);
        setSelectedVehicleId(vehicle.id);
      }
    } catch (error) {
      Alert.alert("Error", "Failed to validate vehicle");
    }
  };

  // Get the first active fueling pump for header display (backward compatibility)
  const activeFuelingPump = useMemo(() => {
    if (!activeFuelingProcesses || activeFuelingProcesses.length === 0) {
      return null;
    }
    // Return the first active fueling process
    return activeFuelingProcesses[0];
  }, [activeFuelingProcesses]);

  // Handler to open transaction monitoring from header - accepts pump parameter
  const handleViewFuelingFromHeader = (pump) => {
    // Use passed pump or fall back to first active
    const targetPump = pump || activeFuelingPump;
    if (targetPump) {
      // Select the active pump and show monitoring
      const pumpToSelect = availablePumps?.find(
        (p) => p.id === targetPump.pumpId
      );
      if (pumpToSelect) {
        setSelectedPump(pumpToSelect);
      }
      // Mark as external fueling since we didn't initiate it
      // (unless it matches our current transaction)
      const isExternal =
        !currentTransactionId ||
        currentTransactionId !== targetPump.transaction;
      setIsViewingExternalFueling(isExternal);
      setViewingPumpData(targetPump); // Save the pump data for initial values
      setShowTransactionMonitoring(true);
    }
  };

  // Handle minimize - allow user to start fueling on another pump
  const handleMinimizeMonitoring = () => {
    setShowTransactionMonitoring(false);
    setIsViewingExternalFueling(false);
    setViewingPumpData(null);

    // Reset to pump selection to allow starting another fueling
    // Keep tank selection as it's persisted
    setStep("pump");
    setSelectedPump(null);
    setSelectedNozzle(null);
    setOperationMode(null);
    setSelectedVehicle(null);
    setFuelingVolume("");
    setIsFullTank(false);

    // Note: We keep currentTransactionId so we can track our own transaction
    // if the user wants to view it again via the active fueling banner

    Toast.show({
      type: "info",
      text1: "Fueling Minimized",
      text2: "You can start another fueling or tap the banner to view",
      visibilityTime: 3000,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Show loading state while determining initial step */}
      {!tankLoadingComplete ? (
        <LoadingOverlay message="Loading..." />
      ) : (
        <>
          <FuelingHeader
            siteName={siteName()}
            deviceId={ptsId}
            deviceName={ptsDevice?.ptsName}
            currentStep={step}
            connectionStatus={deviceConnectionStatus}
            deviceOnline={deviceConnectionStatus === "connected"}
            onBack={
              step === "tank" ? () => navigation.goBack() : handleStepBack
            }
            selectedTank={selectedTank}
            operationMode={operationMode}
            onChangeTank={handleChangeTank}
            activeFuelingPump={activeFuelingPump}
            activeFuelingPumps={activeFuelingProcesses}
            onViewFueling={handleViewFuelingFromHeader}
          />

          <View style={styles.content}>{renderCurrentStep()}</View>
        </>
      )}

      {isAuthorizing && <LoadingOverlay message="Authorizing pump..." />}

      <TransactionMonitoringModal
        visible={showTransactionMonitoring}
        deviceId={ptsId}
        pumpId={selectedPump?.id}
        nozzleId={selectedNozzle?.id}
        transactionId={currentTransactionId}
        vehicleInfo={selectedVehicle}
        authorizationType={isFullTank ? "Full" : "Volume"}
        requestedVolume={isFullTank ? null : parseFloat(fuelingVolume) || null}
        onComplete={handleTransactionComplete}
        onCancel={() => {
          setShowTransactionMonitoring(false);
          setIsViewingExternalFueling(false);
          setViewingPumpData(null);
        }}
        onMinimize={handleMinimizeMonitoring}
        // External fueling props
        isExternalFueling={isViewingExternalFueling}
        initialVolume={
          isViewingExternalFueling ? viewingPumpData?.volume || 0 : 0
        }
        initialAmount={
          isViewingExternalFueling ? viewingPumpData?.amount || 0 : 0
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default FuelingProcessScreen;
