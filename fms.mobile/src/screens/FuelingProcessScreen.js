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
import FuelingDetailsStep from "../components/fueling/FuelingDetailsStep";
import TransactionMonitoringModal from "../components/fueling/TransactionMonitoringModal";
import FuelingHeader from "../components/fueling/FuelingHeader";
import LoadingOverlay from "../components/common/LoadingOverlay";

// Import hooks and services
import { useDeviceData } from "../hooks/useDeviceData";
import { pumpControlService } from "../services/pumpControlService";
import FuelingUtils from "../utils/FuelingUtils";

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
// Mock data kept for fallback/testing mode only
import { generateMockPTSData } from "../utils/mockPTSData";

// Storage key for persisting tank selection (per device)
const TANK_STORAGE_KEY_PREFIX = "@fms_selected_tank_";

const FuelingProcessScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  // Get params with fallback for testing (use MOCK-PTS-001 if no ptsId provided)
  const ptsId = route.params?.ptsId || "MOCK-PTS-001";
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

  const isMockMode =
    !isLiveDataEnabled && isMockDataLoaded && probeTanks?.length > 0;

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
  const [tagDetails, setTagDetails] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectionMethod, setSelectionMethod] = useState("lookup");
  const [useMasterTag, setUseMasterTag] = useState(false);
  const [deviceConnectionStatus, setDeviceConnectionStatus] =
    useState("connecting");
  const [isMockDataLoaded, setIsMockDataLoaded] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false); // For refresh button state

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
  console.log("[FuelingProcess] RENDER - isMockDataLoaded:", isMockDataLoaded);
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

  // Initialize data - fetch from real APIs with fallback to mock
  useEffect(() => {
    const initializeData = async () => {
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
        console.warn(
          "[FuelingProcess] Failed to connect to real PTS, using mock data:",
          error.message
        );

        // Fallback to mock data
        if (ptsId) {
          console.log(
            "[FuelingProcess] Loading mock PTS data for ptsId:",
            ptsId
          );
          const mockData = generateMockPTSData(ptsId);
          console.log("[FuelingProcess] Mock Probes:", mockData.Probes);

          dispatch(
            updateDeviceStatus({
              deviceId: ptsId,
              status: {
                uploadStatus: mockData,
                lastUpdated: Date.now(),
              },
            })
          );
          console.log(
            "[FuelingProcess] DISPATCHED updateDeviceStatus for:",
            ptsId
          );

          // Mark mock data as loaded
          setIsMockDataLoaded(true);
          dispatch(setLiveDataEnabled(false));
          setDeviceConnectionStatus("connected");

          Toast.show({
            type: "info",
            text1: "Mock Mode",
            text2: "Using simulated PTS data for testing",
            position: "bottom",
          });
        }
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
      case "details":
        // Go back to volume step (vehicle fueling flow)
        setStep("volume");
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
        setStep("volume");
        break;
      case "scan":
        setSelectedNozzle(data.nozzle);
        setStep("scan");
        break;
      case "details":
        if (data.vehicleInfo) {
          setVehicleInfo(data.vehicleInfo);
          setSelectedVehicleId(data.vehicleInfo.id);
        }
        if (data.tagDetails) {
          setTagDetails(data.tagDetails);
          setSelectedTag(data.tagDetails.id);
        }
        setStep("details");
        break;
    }
  };

  // Handle tank transfer submission - Real API with fallback to mock
  const handleTransferConfirm = async () => {
    if (isAuthorizing) return;

    try {
      setIsAuthorizing(true);

      // Prepare data matching backend PumpAuthorizeTransferCommand structure
      const transferAuthData = {
        deviceId: ptsId,
        pumpId: selectedPump?.id,
        sourceTankId: selectedTank?.probeId || selectedTank?.id,
        destinationTankId: destinationTank?.tankId,
        volume: parseFloat(transferVolume),
        reason: transferReason || "Tank Transfer",
      };

      console.log(
        "[Mobile Fueling] Tank transfer authorization:",
        transferAuthData
      );

      // Try real API call if live data is enabled
      if (isLiveDataEnabled) {
        try {
          const result = await apiService.authorizeTankTransfer(
            transferAuthData
          );

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
            return;
          } else {
            Alert.alert(
              "Authorization Failed",
              result.message || "Failed to authorize transfer"
            );
            return;
          }
        } catch (apiError) {
          console.warn(
            "[Mobile Fueling] API call failed, falling back to mock:",
            apiError.message
          );
          // Continue to mock mode below
        }
      }

      // Fallback: Simulate success after a short delay (mock mode)
      await new Promise((resolve) => setTimeout(resolve, 500));

      Toast.show({
        type: "info",
        text1: "Transfer Simulated (Mock Mode)",
        text2: `Would transfer ${transferVolume}L from ${
          selectedTank?.name || selectedTank?.tankName || "Source Tank"
        } to ${destinationTank?.tankName}`,
        position: "bottom",
      });

      resetFuelingProcess();
      navigation.goBack();
    } catch (error) {
      console.error("[Mobile Fueling] Transfer error:", error);
      Alert.alert("Error", error.message || "Failed to process transfer");
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Handle vehicle fueling confirmation - navigate to details step for mock simulation
  const handleVehicleFuelingConfirm = () => {
    // For mock simulation: just navigate to the fueling details step
    // The FuelingDetailsStep component handles the mock authorization flow internally
    console.log("[Mobile Fueling] Proceeding to fueling details (mock mode):", {
      pumpId: selectedPump?.id,
      nozzleId: selectedNozzle?.id,
      tankId: selectedTank?.tankId || selectedTank?.id,
      vehicleId: selectedVehicle?.vehicleId,
      isFullTank,
      volume: fuelingVolume,
    });

    setStep("details");
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

      // Prepare authorization request
      const authRequest = {
        deviceId: ptsId,
        pumpId: selectedPump.id,
        nozzle: selectedNozzle.id,
        type: authType,
        dose: authType === "Full" ? null : dose,
        vehicleId: vehicleId,
        tag: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
        useMasterTag: shouldUseMasterTag,
        odometer: odometer ? parseFloat(odometer) : null, // Include odometer reading
      };

      console.log("[Mobile Fueling] Starting authorization:", authRequest);

      // Dispatch authorization action
      const result = await dispatch(authorizePump(authRequest)).unwrap();

      if (result.success) {
        setCurrentTransactionId(result.data?.transactionId);
        setShowTransactionMonitoring(true);

        // Create fueling event
        dispatch(
          createFuelingEvent("started", ptsId, {
            pumpId: selectedPump.id,
            nozzleNumber: selectedNozzle.id,
            transactionId: result.data?.transactionId,
            authType,
            dose,
            vehicleId,
            tagId: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
          })
        );

        Toast.show({
          type: "success",
          text1: "Authorization Successful",
          text2: "Transaction started successfully",
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
            isLoadingTanks={!isMockMode && availableTanks.length === 0}
            isRefreshing={isRefreshing}
            isMockData={isMockMode}
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
            isMockData={isMockMode}
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
          />
        );
      case "vehicle":
        return (
          <VehicleSelectionStep
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(vehicle) => {
              setSelectedVehicle(vehicle);
              setVehicleInfo(vehicle);
            }}
            onScanRfid={handleScan}
            isScanning={isScanning}
            onNext={() =>
              handleStepNext("volume", { vehicle: selectedVehicle })
            }
            onBack={handleStepBack}
          />
        );
      case "volume":
        return (
          <FuelingVolumeStep
            selectedVehicle={selectedVehicle}
            sourceTank={selectedTank}
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
            onVehicleSelect={handleVehicleSelect}
            onNext={(data) => handleStepNext("details", data)}
            onBack={handleStepBack}
            setSelectionMethod={setSelectionMethod}
            setVehicleReg={setVehicleReg}
          />
        );
      case "details":
        return (
          <FuelingDetailsStep
            pump={selectedPump}
            nozzle={selectedNozzle}
            tank={selectedTank}
            vehicle={selectedVehicle || vehicleInfo}
            volume={fuelingVolume || volume}
            isFullTank={isFullTank}
            onComplete={(result) => {
              // Handle fueling completion with mock simulation
              console.log("[Mobile Fueling] Fueling complete (mock):", result);
              Toast.show({
                type: "success",
                text1: "Fueling Complete",
                text2: `Dispensed ${result.finalVolume} L - TXN: ${result.transactionId}`,
              });
              resetFuelingProcess();
            }}
            onBack={handleStepBack}
            onEmergencyStop={(data) => {
              console.log("[Mobile Fueling] Emergency stop (mock):", data);
              Toast.show({
                type: "error",
                text1: "Emergency Stop",
                text2: `Stopped at ${data.stoppedAt} L`,
              });
              resetFuelingProcess();
            }}
            onStartNewFueling={() => {
              // Allow starting new fueling from main page
              resetFuelingProcess();
            }}
          />
        );
      default:
        return null;
    }
  };

  // Handle tag scanning
  const handleScan = async () => {
    // Implementation for RFID/QR code scanning
    setIsScanning(true);
    // This would integrate with camera/NFC scanning
    // For now, simulate scan
    setTimeout(() => {
      setIsScanning(false);
      setScanResult("sample-tag-123");
    }, 2000);
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
            currentStep={step}
            connectionStatus={deviceConnectionStatus}
            onBack={
              step === "tank" ? () => navigation.goBack() : handleStepBack
            }
            selectedTank={selectedTank}
            operationMode={operationMode}
            onChangeTank={handleChangeTank}
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
        onComplete={handleTransactionComplete}
        onCancel={() => setShowTransactionMonitoring(false)}
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
