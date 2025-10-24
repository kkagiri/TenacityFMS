import React, {
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import ScrollView from "devextreme-react/scroll-view";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import "./fuelingprocess.scss"; //claude import scss file
import FuelingPopupRenderer from "./Components/FuelingPopupRenderer";
import FuelingHeader from "./Components/FuelingHeader";
import FuelingRulePopup from "./Components/FuelingRulePopup"; //Cursor
import PumpTransactionPopup from "../../../components/PumpTransactionPopup/PumpTransactionPopup";

// Import custom hooks
import { useDeviceData } from "../../../hooks/useDeviceData";
import pumpControlService from "../../../services/pumpControlService";
import { createFuelingEvent } from "../../../redux/actions/fuelingEventActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions"; //Cursor
import {
  validateTag,
  validateVehicle,
} from "../../../redux/actions/tagActions"; //Cursor
import { fetchSiteList } from "../../../redux/actions/siteActions"; //Cursor
import { authorizePump } from "../../../redux/actions/ptsActions/ptspumpActions"; //Cursor: Add for enhanced authorization

//Cursor: Import ScanStep
import ScanStep from "./fuelingsteps/ScanStep";

// Import the new memoized components
import PumpSelectionStep from "./fuelingsteps/PumpSelectionStep";
import NozzleSelectionStep from "./fuelingsteps/NozzleSelectionStep";
import FuelingDetailsStep from "./fuelingsteps/FuelingDetailsStep";
import TransactionMonitoringStatus from "./TransactionMonitoringStatus"; //Cursor: Add transaction monitoring component

const FuelingProcess = () => {
  const dispatch = useDispatch();
  const { ptsId } = useParams();
  const navigate = useNavigate();
  const previousPumpStatuses = useRef({}); // Ref to store previous pump statuses FOR EVENT DETECTION

  // --- Local UI State ---
  // Define selectedVehicleId early, before using it in selectors
  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // ID of selected vehicle

  // Use our device data hook
  const {
    devicePumpStatus, // Parsed pump status object { pumpId: { status, volume, ... } }
    pumps: availablePumps, // Derived array of pump objects for selection UI
    activeFuelingProcesses, // Derived array of fueling/EOT processes for display/checks
    lastUpdated: deviceLastUpdated, // Timestamp from Redux
    isLiveDataEnabled, // From Redux
    getPumpDetails, // Function to get parsed details for a specific pump
    getNozzlesForPump, // Function to get derived nozzle info for a specific pump
    rawUploadStatus, // Cursor: Pass raw status object
    fuelGrades, // Cursor: Fuel grades from status
  } = useDeviceData(ptsId);

  // Get PTS device info from Redux store (static info)
  const ptsDevice = useSelector((state) =>
    state.ptsDevice.ptsDeviceList.find((dev) => dev.ptsid === ptsId)
  );

  // Get sites from Redux store //Cursor
  const sites = useSelector((state) => state.site.sites);

  // Get site name for the current device //Cursor
  const siteName = useCallback(() => {
    if (!ptsDevice || !sites || !sites.length) return null;
    const siteId = ptsDevice.site;
    const site = sites.find((site) => site.id === siteId);
    return site ? site.name : null;
  }, [ptsDevice, sites]);

  // Get fueling events for the list component
  const fuelingEvents = useSelector((state) =>
    state.fuelingEvents.events.filter((e) => e.deviceId === ptsId)
  );

  // Get vehicles from Redux store
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  //Cursor: Ensure isLoadingVehicles defaults to false if state path is missing
  const isLoadingVehicles = useSelector(
    (state) => state.vehicle?.loading ?? false
  );

  // Get tag-related data from Redux using vehicleId from state
  const vehicleTags = useSelector((state) => {
    const tagsForVehicle = state.tag?.tagsByVehicle?.[selectedVehicleId] || [];
    return tagsForVehicle;
  });
  const isTagsLoading = useSelector((state) => state.tag?.loading);
  const validatedTag = useSelector((state) => state.tag?.validatedTag);
  const tagError = useSelector((state) => state.tag?.error);

  // --- Local UI State ---
  const [isLoading, setIsLoading] = useState(true);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [navigateTo, setNavigateTo] = useState(null);
  const [step, setStep] = useState("pump"); // Current UI step
  const [selectedPump, setSelectedPump] = useState(null); // Pump selected in UI *by the user*
  const [selectedNozzle, setSelectedNozzle] = useState(null); // Nozzle selected in UI *by the user*
  const [vehicleReg, setVehicleReg] = useState(""); // Entered/scanned vehicle reg
  const [isAuthorizing, setIsAuthorizing] = useState(false); // API call in progress
  const [isScanning, setIsScanning] = useState(false); // Scan API call in progress
  const [scanResult, setScanResult] = useState(null); // Tag read during scan
  const [vehicleInfo, setVehicleInfo] = useState(null); // Info from tag validation
  const [fuelingComplete, setFuelingComplete] = useState(false); // Controls completion popup visibility
  const [fuelPrice, setFuelPrice] = useState(3.99); // TODO: Get from FuelGrade status in Redux
  const [selectedType, setSelectedType] = useState("Amount"); // Preset type (Amount/Volume/Full)
  const [amount, setAmount] = useState(""); // Preset Amount input
  const [volume, setVolume] = useState(""); // Preset Volume input
  const [showFuelingPopup, setShowFuelingPopup] = useState(false); // Controls visibility of progress popup
  const [showAllFuelingPopup, setShowAllFuelingPopup] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null); // Store ID from authorize/status
  const [activePumpForPopup, setActivePumpForPopup] = useState(null); // Pump currently shown *in the progress popup*
  const [activeNozzleForPopup, setActiveNozzleForPopup] = useState(null); // Nozzle currently shown *in the progress popup*
  const [tagDetails, setTagDetails] = useState(null); // Details for selected/scanned tag
  const [selectedTag, setSelectedTag] = useState(null); // Currently selected tag

  // Add the company vehicle checkbox state and rule popup state
  const [isCompanyVehicle, setIsCompanyVehicle] = useState(false); //Cursor
  const [showFuelingRulePopup, setShowFuelingRulePopup] = useState(false); //Cursor
  const [vehicleForRules, setVehicleForRules] = useState(null); //Cursor

  // Add state for connection status
  const [deviceConnectionStatus, setDeviceConnectionStatus] =
    useState("connecting");
  const [isDeviceDisconnected, setIsDeviceDisconnected] = useState(false);

  // --- Selector Definitions ---
  const loggedInUser = useSelector((state) => state.auth.user);
  const userMasterTag = loggedInUser?.masterTag || null; // DEFINED HERE

  // Add state for master tag usage
  const [useMasterTag, setUseMasterTag] = useState(false);

  // Add state for selection method
  const [selectionMethod, setSelectionMethod] = useState("lookup"); // Already defined

  // Cursor: Add state for device configuration
  const [deviceConfig, setDeviceConfig] = useState(null);
  const [isLoadingDeviceConfig, setIsLoadingDeviceConfig] = useState(true);

  // Cursor: Add transaction monitoring states
  const [showTransactionMonitoring, setShowTransactionMonitoring] = useState(false);
  const [deviceConnectionType, setDeviceConnectionType] = useState("Unknown");
  const [transactionMonitoringData, setTransactionMonitoringData] = useState(null);

  // Pump transaction popup state
  const [showPumpTransactionPopup, setShowPumpTransactionPopup] = useState(false);

  // Fetch vehicles and sites when component mounts //Cursor
  useEffect(() => {
    dispatch(fetchVehicleList());
    dispatch(fetchSiteList());
  }, [dispatch]);

  // Cursor: Load device configuration when component mounts or ptsId changes
  useEffect(() => {
    const loadDeviceConfig = async () => {
      if (!ptsId) return;

      try {
        setIsLoadingDeviceConfig(true);
        const config = await pumpControlService.api.getDeviceConfig(ptsId);
        setDeviceConfig(config);
        console.log("[Device Config] Loaded configuration:", config);
      } catch (error) {
        console.error("[Device Config] Failed to load device configuration:", error);
        notify("Failed to load device configuration", "warning", 3000);
        // Set default config to prevent blocking
        setDeviceConfig({
          autoAssignUserMasterTag: false,
          isActive: true,
          isAuthenticated: true
        });
      } finally {
        setIsLoadingDeviceConfig(false);
      }
    };

    loadDeviceConfig();
  }, [ptsId]);

  // Update UI when validated tag changes
  useEffect(() => {
    if (validatedTag && validatedTag.isValid) {
      setTagDetails(validatedTag);
      setVehicleInfo(validatedTag.vehicleInfo);
    }
  }, [validatedTag]);

  // Set initial loading state
  useEffect(() => {
    if (ptsDevice) {
      const timer = setTimeout(() => setIsLoading(false), 500);
      return () => clearTimeout(timer);
    }
  }, [ptsDevice]);

  // New effect to request device status for this specific device
  useEffect(() => {
    if (ptsId && isLiveDataEnabled) {
      // Request status updates for this specific device when component mounts
      import("../../../signalR/SignalRService").then((module) => {
        const SignalRService = module.default;

        if (SignalRService.state === "connected") {
          console.log(`[FuelingProcess] Requesting status for device ${ptsId}`);
          SignalRService.requestDeviceStatus(ptsId);

          // Set up interval to periodically request status
          const statusInterval = setInterval(() => {
            if (SignalRService.state === "connected") {
              SignalRService.requestDeviceStatus(ptsId);
            }
          }, 5000); // Request every 5 seconds

          return () => {
            clearInterval(statusInterval);
          };
        }
      });
    }
  }, [ptsId, isLiveDataEnabled]);

  // --- Effect to Update Popup State Based on Redux ---
  useEffect(() => {
    // Check status of the pump currently selected FOR THE POPUP
    const pumpDetails = activePumpForPopup
      ? getPumpDetails(activePumpForPopup.id)
      : null;

    if (pumpDetails?.status === "fueling") {
      // Pump for popup is fueling -> show popup, update details
      setShowFuelingPopup(true);
      setFuelingComplete(false);
      if (!currentTransactionId && pumpDetails.currentTransaction) {
        setCurrentTransactionId(pumpDetails.currentTransaction);
      }
    } else if (pumpDetails?.status === "endOfTransaction") {
      // Pump for popup just finished -> hide progress, show completion
      setShowFuelingPopup(false);
      setFuelingComplete(true); // Trigger completion popup
      if (!currentTransactionId && pumpDetails.transaction) {
        setCurrentTransactionId(pumpDetails.transaction); // Capture final transaction ID
      }
    } else {
      // Pump for popup is idle, offline, nozzleUp, or not selected
      // Hide the progress popup if it was showing for this pump
      if (showFuelingPopup && activePumpForPopup?.id === pumpDetails?.id) {
        setShowFuelingPopup(false);
      }
      // Don't automatically hide completion popup here, let user dismiss it via 'completeFueling'
    }
  }, [devicePumpStatus, activePumpForPopup, getPumpDetails, showFuelingPopup]); // Dependency: Redux state & popup context

  // --- Effect to Dispatch Fueling Events for FuelingEventsList ---
  useEffect(() => {
    const currentStatuses = devicePumpStatus || {};
    const previousStatuses = previousPumpStatuses.current || {};

    // Iterate through pumps in the current status
    Object.keys(currentStatuses).forEach((pumpIdStr) => {
      const pumpId = parseInt(pumpIdStr, 10);
      const current = currentStatuses[pumpId];
      const previous = previousStatuses[pumpId];

      // Skip if status hasn't changed (or pump is new)
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
        (previous?.status === "nozzleUp" || previous?.status === "idle") && // Allow direct idle -> fueling
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
              Price: current.currentPrice, // Added price
              Tag: current.tag, // Added tag
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
            nozzleNumber: current.nozzle, // Use EOT nozzle
            transactionDetails: {
              Volume: current.volume,
              Amount: current.amount,
              Price: current.price, // Added price
              Tag: current.tag, // Added tag
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

      // Detect Tag Read (can happen in idle or fueling)
      // Check if tag exists now but didn't before (or changed)
      if (current.tag && current.tag !== previous?.tag) {
        dispatch(
          createFuelingEvent("tag", ptsId, {
            pumpId: current.id,
            tag: current.tag,
            // Determine nozzle context based on status
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

    // Detect pumps that disappeared (implicitly offline?) - Optional
    // Object.keys(previousStatuses).forEach(pumpIdStr => {
    //    if (!currentStatuses[pumpIdStr]) {
    //       // Pump existed before, now gone
    //       // Potentially dispatch offline event if not already offline
    //    }
    // });

    // Update previous statuses for next comparison
    previousPumpStatuses.current = currentStatuses;
  }, [devicePumpStatus, ptsId, dispatch]);

  // Helper to get current fueling amount for the popup pump
  const getCurrentPopupAmount = useCallback(() => {
    const details = activePumpForPopup
      ? getPumpDetails(activePumpForPopup.id)
      : null;
    return details?.currentAmount ?? details?.amount ?? 0; // Fueling amount or EOT amount
  }, [activePumpForPopup, getPumpDetails]);

  // Helper to get current fueling cost for the popup pump
  const getCurrentPopupCost = useCallback(() => {
    // For now, let's simplify and use Amount as Cost, as Price might not be in EOT easily
    // Ideally, calculate Cost = Volume * Price if possible
    const details = activePumpForPopup
      ? getPumpDetails(activePumpForPopup.id)
      : null;
    return details?.currentAmount ?? details?.amount ?? 0; // Fueling amount or EOT amount
  }, [activePumpForPopup, getPumpDetails]);

  // Helper to get current fueling volume for the popup pump
  const getCurrentPopupVolume = useCallback(() => {
    const details = activePumpForPopup
      ? getPumpDetails(activePumpForPopup.id)
      : null;
    return details?.currentVolume ?? details?.volume ?? 0; // Fueling volume or EOT volume
  }, [activePumpForPopup, getPumpDetails]);

  // --- Actions ---

  // Effect to determine if device is disconnected
  useEffect(() => {
    setIsDeviceDisconnected(deviceConnectionStatus === "disconnected");
  }, [deviceConnectionStatus]);

  // Function to handle connection status updates from header
  const handleConnectionStatusChange = (status) => {
    setDeviceConnectionStatus(status);

    // If device disconnects during an active fueling process, show warning
    if (
      status === "disconnected" &&
      activeFuelingProcesses?.some((p) => p.status === "fueling")
    ) {
      notify(
        "Device disconnected! Active fueling processes may be affected.",
        "warning",
        5000
      );
    }
  };

  const startFueling = async () => {
    // Check if device is disconnected first
    if (isDeviceDisconnected) {
      notify("Cannot start fueling - device is disconnected", "error", 3000);
      return;
    }


    if (!selectedPump || !selectedNozzle) {
      notify("Please select a pump and nozzle first.", "warning", 2000);
      return;
    }

    // Check if the selected pump is actually available (not offline/fueling)
    const pumpCurrentStatus = getPumpDetails(selectedPump.id)?.status;
    if (
      pumpCurrentStatus === "offline" ||
      pumpCurrentStatus === "fueling" ||
      pumpCurrentStatus === "endOfTransaction"
    ) {
      notify(
        `Pump ${selectedPump.id} is currently ${pumpCurrentStatus} and cannot be authorized.`,
        "error",
        3000
      );
      return;
    }

    try {
      setIsAuthorizing(true);

      // Get selected nozzle's fuel grade and price //Cursor
      let fuelGradeId = 0;
      let fuelPrice = 0;

      // Try to find the fuel grade for this nozzle
      if (selectedNozzle.fuelType) {
        const matchingGrade = fuelGrades.find(
          (grade) =>
            grade.name.toLowerCase() === selectedNozzle.fuelType.toLowerCase()
        );

        if (matchingGrade) {
          fuelGradeId = matchingGrade.id;
          fuelPrice = matchingGrade.price;
        } else {
          fuelPrice = selectedNozzle?.price || 3.99; // Fallback price
        }
      }

      // Get the tag to use - prioritize scan result, then tag from status, then selected tag, then vehicle reg
      const tagToUse =
        scanResult ||
        (selectedPump ? getPumpDetails(selectedPump.id)?.tag : null) ||
        (selectedTag ? selectedTag.name : null) ||
        (tagDetails ? tagDetails.tagId : null) ||
        vehicleReg ||
        "";

      console.log("[Authorize] Using tag:", tagToUse);

      // Cursor: Determine if we should auto-assign user master tag
      // This happens when: vehicle is selected, no tag is provided, and not using manual master tag
      const hasVehicleInfo = vehicleInfo?.vehicleId || selectedVehicleId;
      const hasTag = useMasterTag ? userMasterTag : tagToUse;
      const shouldAutoAssign = hasVehicleInfo && !hasTag && !useMasterTag;

      console.log("[Authorize] Auto-assign decision:", {
        hasVehicleInfo: !!hasVehicleInfo,
        hasTag: !!hasTag,
        useMasterTag,
        shouldAutoAssign
      });

      // Cursor: Use device configuration for auto-assign feature instead of hardcoded logic
      const deviceSupportsAutoAssign = deviceConfig?.autoAssignUserMasterTag === true;
      const shouldAutoAssignWithDeviceCheck = shouldAutoAssign && deviceSupportsAutoAssign;

      console.log("[Authorize] Device auto-assign decision:", {
        deviceSupportsAutoAssign,
        shouldAutoAssignWithDeviceCheck,
        deviceConfig: deviceConfig
      });

      const authParams = {
        deviceId: ptsId, // Add deviceId
        pumpId: selectedPump.id,
        nozzle: selectedNozzle.id,
        type: selectedType, // Amount, Volume, Full
        dose:
          selectedType === "Amount"
            ? parseFloat(amount) || 0 // Ensure valid number
            : selectedType === "Volume"
            ? parseFloat(volume) || 0 // Ensure valid number
            : 0, // Full dose is 0
        price: fuelPrice, // Use correct price from fuel grade
        fuelGradeId: fuelGradeId, // Include fuel grade ID if available
        tag: useMasterTag ? userMasterTag : tagToUse, // Use the determined tag or master tag
        vehicleId: hasVehicleInfo ? (vehicleInfo?.vehicleId || selectedVehicleId) : null, // Include vehicle ID
      };

      console.log("[Authorize] Sending auth request:", authParams);

      // Cursor: Use the simplified authorizePump action - auto-assign is handled by backend
      const response = await dispatch(authorizePump(authParams));
      console.log("[Authorize] Received response:", response);

      if (response && response.success) {
        setCurrentTransactionId(response.transactionId || null); // Store transaction ID if provided
        // Set the context for which pump/nozzle we expect fueling to start on
        setActivePumpForPopup(selectedPump);
        setActiveNozzleForPopup(selectedNozzle);

        // Cursor: Show transaction monitoring after successful authorization
        if (response.transactionId) {
          setTransactionMonitoringData({
            deviceId: ptsId,
            pumpId: selectedPump.id,
            nozzleId: selectedNozzle.id,
            transactionId: response.transactionId,
            connectionType: response.connectionType || 'Unknown'
          });
          setShowTransactionMonitoring(true);
        }

        // Don't setShowFuelingPopup(true) here - let the useEffect based on Redux state handle it
        notify(
          `Pump ${selectedPump.id} authorized successfully. Transaction ID: ${
            response.transactionId || "N/A"
          }. Lift nozzle ${selectedNozzle.id} to start fueling.`,
          "success",
          5000 // Longer duration
        );
        // Potentially clear selection/move step, or wait for nozzleUp status change
        // For now, stay on details step, user needs to lift nozzle
        // setStep('pump'); // Optional: Go back to pump selection
      } else {
        notify(response?.message || "Failed to authorize pump", "error", 3000);
        // Clear potentially stale popup context if auth fails
        setActivePumpForPopup(null);
        setActiveNozzleForPopup(null);
      }
    } catch (error) {
      console.error("[Authorize] Error:", error);
      notify(
        `Error authorizing pump: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
      // Clear potentially stale popup context on error
      setActivePumpForPopup(null);
      setActiveNozzleForPopup(null);
    } finally {
      setIsAuthorizing(false);
    }
  };

  const stopFueling = async () => {
    // Check if device is disconnected first
    if (isDeviceDisconnected) {
      notify(
        "Cannot stop fueling - device is disconnected. The physical stop button on the pump may still work.",
        "warning",
        5000
      );
      return;
    }

    // Stop the pump currently shown *in the popup*
    if (!activePumpForPopup) {
      notify("No active pump selected to stop.", "warning", 2000);
      return;
    }
    // Check if the pump is actually fueling
    const pumpCurrentStatus = getPumpDetails(activePumpForPopup.id)?.status;
    if (pumpCurrentStatus !== "fueling") {
      notify(
        `Pump ${activePumpForPopup.id} is not currently fueling. Cannot send stop command.`,
        "warning",
        3000
      );
      return;
    }

    try {
      console.log(
        `[Stop] Sending stop command for Pump ${activePumpForPopup.id}`
      );
      const response = await pumpControlService.stopPump(
        ptsId,
        activePumpForPopup.id
      );
      console.log(
        `[Stop] Received response for Pump ${activePumpForPopup.id}:`,
        response
      );
      if (response && response.success) {
        notify(
          `Stop command sent for Pump ${activePumpForPopup.id}`,
          "success",
          2000
        );
        // Let the useEffect based on Redux state handle UI changes (popup hiding, status change)
      } else {
        notify(response?.message || "Failed to stop pump", "error", 3000);
      }
    } catch (error) {
      console.error(
        `[Stop] Error stopping pump ${activePumpForPopup.id}:`,
        error
      );
      notify(
        `Error stopping pump: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
    }
  };

  const completeFueling = async () => {
    // Complete the transaction for the pump shown *in the popup* after EOT status received
    if (!activePumpForPopup) {
      notify(
        "Cannot complete: No pump context for the completed transaction.",
        "error",
        3000
      );
      // Reset UI anyway if possible
      setFuelingComplete(false);
      startNewFueling();
      return;
    }

    const pumpDetails = getPumpDetails(activePumpForPopup.id);
    const transactionIdToClose =
      currentTransactionId || pumpDetails?.transaction;

    // Ensure we have a transaction ID and the status is EOT
    if (pumpDetails?.status !== "endOfTransaction") {
      notify(
        `Cannot complete: Pump ${
          activePumpForPopup.id
        } is not in EndOfTransaction status. Current status: ${
          pumpDetails?.status || "Unknown"
        }.`,
        "warning",
        4000
      );
      // Optionally hide completion popup if status changed back
      // setFuelingComplete(false);
      return;
    }
    if (!transactionIdToClose) {
      notify(
        `Cannot complete: Missing transaction ID for Pump ${activePumpForPopup.id}.`,
        "error",
        3000
      );
      // Reset UI anyway
      setFuelingComplete(false);
      startNewFueling();
      return;
    }

    try {
      console.log(
        `[Complete] Sending close command for Pump ${activePumpForPopup.id}, Txn ${transactionIdToClose}`
      );
      // NOTE: Backend `closeTransaction` might not be necessary if EOT status
      // automatically implies completion. This depends on backend logic.
      // If closeTransaction is required to finalize records, keep it.
      // Otherwise, this might just be a UI cleanup action.
      // Let's assume it's needed for now.
      const response = await pumpControlService.closeTransaction(
        ptsId,
        activePumpForPopup.id,
        transactionIdToClose
      );
      console.log(
        `[Complete] Received response for Pump ${activePumpForPopup.id}, Txn ${transactionIdToClose}:`,
        response
      );

      if (response && response.success) {
        notify(
          `Transaction ${transactionIdToClose} completed successfully`,
          "success",
          2000
        );
        // Dispatch final completed event? Might be redundant if EOT already did.
        // dispatch(createFuelingEvent('completed', ptsId, { pumpId: activePumpForPopup.id, transactionId: transactionIdToClose }));
      } else {
        // Even if backend fails, proceed with UI reset as EOT was received.
        notify(
          response?.message ||
            `Failed to explicitly close transaction ${transactionIdToClose} (Pump ${activePumpForPopup.id}). Resetting UI based on EndOfTransaction status.`,
          "warning", // Downgrade to warning as UI should still reset
          4000
        );
      }

      // --- UI Reset Logic ---
      setFuelingComplete(false); // Hide completion popup
      startNewFueling(); // Reset selection state and step
    } catch (error) {
      console.error(
        `[Complete] Error completing transaction ${transactionIdToClose} for pump ${activePumpForPopup.id}:`,
        error
      );
      notify(
        `Error completing transaction: ${
          error.message || "Unknown error"
        }. Resetting UI.`,
        "error",
        3000
      );
      // --- UI Reset Logic on Error ---
      setFuelingComplete(false);
      startNewFueling();
    }
  };

  // Start a new fueling process UI flow
  const startNewFueling = () => {
    console.log("[UI] Starting new fueling process flow.");
    // Reset UI selection state
    setSelectedPump(null);
    setSelectedNozzle(null);
    setVehicleReg("");
    setVehicleInfo(null);
    setCurrentTransactionId(null);
    setActivePumpForPopup(null); // Clear popup context
    setActiveNozzleForPopup(null); // Clear popup context
    setShowFuelingPopup(false); // Hide progress popup
    setFuelingComplete(false); // Hide completion popup
    setAmount(""); // Clear preset amount
    setVolume(""); // Clear preset volume
    setScanResult(null); // Clear scanned tag
    setStep("pump"); // Go back to pump selection
  };

  // Navigation with fueling process check
  const handleNavigation = (path) => {
    // Check if any pump in Redux state is actually fueling
    const isAnyPumpFueling = Object.values(devicePumpStatus || {}).some(
      (p) => p.status === "fueling"
    );
    if (isAnyPumpFueling) {
      setNavigateTo(path);
      setShowNavigationDialog(true);
    } else {
      navigate(path);
    }
  };

  // ... (confirmNavigation, cancelNavigation remain the same) ...

  const confirmNavigation = () => {
    setShowNavigationDialog(false);
    if (navigateTo) {
      navigate(navigateTo);
    }
  };

  const cancelNavigation = () => {
    setShowNavigationDialog(false);
    setNavigateTo(null);
  };

  // Function to handle vehicle selection from the vehicle lookup
  const handleVehicleSelected = async (vehicle) => {
    setSelectedVehicleId(vehicle?.vehicleId || null);
    if (vehicle?.vehicleId) {
      try {
        // Show loading state by clearing vehicleInfo first
        setVehicleInfo(null);

        // Validate the vehicle
        const validationResult = await dispatch(
          validateVehicle(vehicle.vehicleId)
        );

        console.log("[Vehicle Selection] Validation result:", validationResult);

        if (validationResult && validationResult.isValid) {
          // Store the vehicle info from validation result
          setVehicleInfo(validationResult.vehicleInfo);
        } else {
          notify(
            `Vehicle validation failed: ${
              validationResult?.message || "Unknown error"
            }`,
            "error",
            3000
          );
          // Clear selected vehicle ID on validation failure
          setSelectedVehicleId(null);
        }
      } catch (error) {
        console.error("[Vehicle Selection] Error during validation:", error);
        notify(
          `Error during vehicle validation: ${
            error.message || "Unknown error"
          }`,
          "error",
          3000
        );
        // Clear selected vehicle ID on error
        setSelectedVehicleId(null);
      }
    } else {
      // Clear vehicle info if no vehicle selected
      setVehicleInfo(null);
    }
  };

  let scanningTimeoutId = null;

  const processScanResult = async (tagId) => {
    if (!tagId) return;
    setScanResult(tagId);
    notify(`Tag detected: ${tagId}. Validating...`, "info", 2000);
    try {
      // Dispatch action to validate the tag
      const validationResult = await dispatch(validateTag(tagId));
      console.log(
        `[Scan] Validation result for tag ${tagId}:`,
        validationResult
      );
      if (validationResult && validationResult.isValid) {
        // Validation data is now in Redux store
        setTagDetails(validationResult);
        setVehicleInfo(validationResult.vehicleInfo);
        // Accept the scan result automatically
        acceptScanResult(validationResult.vehicleInfo);
      } else {
        notify(
          `Tag ${tagId} validation failed. Please try again.`,
          "error",
          3000
        );
        setScanResult(null);
      }
    } catch (error) {
      console.error("[Scan] Error during tag validation:", error);
      notify(
        `Error during tag validation: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
      setScanResult(null);
    } finally {
      setIsScanning(false);
      if (scanningTimeoutId) {
        clearTimeout(scanningTimeoutId);
        scanningTimeoutId = null;
      }
    }
  };
  // Enhanced tag scan handling
  const startScan = async () => {
    setIsScanning(true);
    setScanResult(null);
    setVehicleInfo(null);
    setTagDetails(null);

    try {
      console.log("[Scan] Starting tag scan...");

      // Check if there's a tag already in the current pump status initially
      const pumpDetails = selectedPump ? getPumpDetails(selectedPump.id) : null;
      const initialTag = pumpDetails?.tag;

      if (initialTag && initialTag.trim() !== "") {
        // Tag is already present at scan start
        console.log(`[Scan] Tag found in pump status: ${initialTag}`);
        processScanResult(initialTag);
      } else {
        // No tag yet, setup a timeout for scanning
        const scanTimeout = 20000; // 20 seconds timeout
        const scanStartTime = Date.now();

        // Start a polling process to check for tags
        const checkForTag = async () => {
          // Only check if still in scanning mode
          if (!isScanning) return;

          // Check if timeout exceeded
          if (Date.now() - scanStartTime > scanTimeout) {
            notify("No tag detected within timeout period.", "warning", 3000);
            cancelScan();
            return;
          }

          // Check current pump status for tag
          const currentPumpDetails = selectedPump
            ? getPumpDetails(selectedPump.id)
            : null;
          const detectedTag = currentPumpDetails?.tag;

          if (detectedTag && detectedTag.trim() !== "") {
            // Tag detected during polling
            console.log(`[Scan] Tag detected during polling: ${detectedTag}`);
            processScanResult(detectedTag);
          } else {
            // Continue polling every 500ms
            setTimeout(checkForTag, 500);
          }
        };

        // Start the polling process
        checkForTag();
      }
    } catch (error) {
      console.error("[Scan] Error during scan:", error);
      notify(
        `Error during scan: ${error.message || "Unknown error"}`,
        "error",
        3000
      );
      setScanResult(null);
      cancelScan();
    }
  };
  const cancelScan = () => {
    console.log("[Scan] Cancelling scan process");
    setIsScanning(false);

    // Clear any pending timeout
    if (scanningTimeoutId) {
      clearTimeout(scanningTimeoutId);
      scanningTimeoutId = null;
    }

    // Reset scan-related states
    setScanResult(null);
    setVehicleInfo(null);
    setTagDetails(null);

    // Keep the current step (don't reset to "scan" as in original code)
    // This allows user to stay on the same screen while changing their selection method
  };

  // Modified to accept vehicle info directly
  const acceptScanResult = (validatedVehicleInfo) => {
    console.log("acceptScanResult", validatedVehicleInfo);

    // Handle master tag case first
    if (validatedVehicleInfo?.isMasterTag) {
      console.log("[Scan] Accepted master tag");
      setUseMasterTag(true);
      setStep("details"); // Move to fueling details step
      return;
    }

    // Handle vehicle info case
    const reg = validatedVehicleInfo?.hyoungNo;
    if (reg) {
      console.log(`[Scan] Accepted tag for vehicle: ${reg}`);
      setVehicleReg(reg); // Set registration number
      setVehicleInfo(validatedVehicleInfo); // Ensure full info is stored
      setStep("details"); // Move to fueling details step
    } else {
      notify("No valid vehicle registration found.", "error", 3000);
      // Stay on current step
    }
  };

  // Add a function to open the fueling rule popup
  const openFuelingRulePopup = (vehicleData) => {
    setVehicleForRules(vehicleData);
    setShowFuelingRulePopup(true);
  };

  // Cursor: Add transaction completion handlers
  const handleCancelTransaction = async (transactionId, reason) => {
    try {
      // Call the backend to cancel the transaction
      const response = await pumpControlService.cancelTransaction(
        ptsId,
        transactionMonitoringData?.pumpId,
        transactionId,
        reason
      );

      if (response && response.success) {
        notify(`Transaction ${transactionId} cancelled successfully`, "success", 3000);
        setShowTransactionMonitoring(false);
        setTransactionMonitoringData(null);
        startNewFueling(); // Reset the UI
      } else {
        notify(response?.message || "Failed to cancel transaction", "error", 3000);
      }
    } catch (error) {
      console.error("Error cancelling transaction:", error);
      notify(`Error cancelling transaction: ${error.message}`, "error", 3000);
    }
  };

  const handleCompleteTransaction = async (transactionId) => {
    try {
      // Use the existing completeFueling logic or call closeTransaction directly
      const response = await pumpControlService.closeTransaction(
        ptsId,
        transactionMonitoringData?.pumpId,
        transactionId
      );

      if (response && response.success) {
        notify(`Transaction ${transactionId} completed successfully`, "success", 3000);
        setShowTransactionMonitoring(false);
        setTransactionMonitoringData(null);
        setFuelingComplete(false);
        startNewFueling(); // Reset the UI
      } else {
        notify(response?.message || "Failed to complete transaction", "error", 3000);
      }
    } catch (error) {
      console.error("Error completing transaction:", error);
      notify(`Error completing transaction: ${error.message}`, "error", 3000);
    }
  };

  // Handle opening pump transaction popup
  const handleViewPumpTransactions = () => {
    setShowPumpTransactionPopup(true);
  };

  // Determine display details for steps
  const displayDetails = tagDetails || vehicleInfo;

  // Add useCallback for stable function references
  const handleStepChange = useCallback((newStep) => {
    setStep(newStep);
  }, []);

  const handlePumpSelection = useCallback((pump) => {
    setSelectedPump(pump);
    setStep("nozzle");
  }, []);

  const handleNozzleSelection = useCallback((nozzle) => {
    setSelectedNozzle(nozzle);
    setStep("scan");
  }, []);

  const handleBackToPumps = useCallback(() => {
    setStep("pump");
  }, []);

  const handleBackToNozzles = useCallback(() => {
    setStep("nozzle");
  }, []);

  const handleBackToScan = useCallback(() => {
    setStep("scan");
  }, []);

  // Memoize derived data
  const nozzlesForSelectedPump = useMemo(() => {
    return getNozzlesForPump(selectedPump?.id, rawUploadStatus);
  }, [selectedPump?.id, rawUploadStatus, getNozzlesForPump]);

  // Update renderCurrentStep
  const renderCurrentStep = () => {
    switch (step) {
      case "pump":
        return (
          <PumpSelectionStep
            availablePumps={availablePumps}
            activePumps={activeFuelingProcesses}
            setSelectedPump={handlePumpSelection}
            setStep={handleStepChange}
            setActivePump={setActivePumpForPopup}
            setShowFuelingPopup={setShowFuelingPopup}
          />
        );
      case "nozzle":
        return (
          <NozzleSelectionStep
            nozzles={nozzlesForSelectedPump}
            setSelectedNozzle={handleNozzleSelection}
            setStep={handleStepChange}
          />
        );
      case "scan":
        return (
          <ScanStep
            isScanning={isScanning}
            scanResult={scanResult}
            vehicleInfo={vehicleInfo}
            cancelScan={cancelScan}
            startScan={startScan}
            acceptScanResult={acceptScanResult}
            setStep={handleStepChange}
            selectionMethod={selectionMethod}
            setSelectionMethod={setSelectionMethod}
            vehicles={vehicles}
            isLoadingVehicles={isLoadingVehicles}
            selectedVehicleId={selectedVehicleId}
            handleVehicleSelected={handleVehicleSelected}
            vehicleReg={vehicleReg}
            selectedNozzle={selectedNozzle}
            setScanResult={setScanResult}
            ptsId={ptsId}
          />
        );
      case "details":
        return (
          <FuelingDetailsStep
            selectedPump={selectedPump}
            selectedNozzle={selectedNozzle}
            activeFuelingProcesses={activeFuelingProcesses}
            selectedType={selectedType}
            setSelectedType={setSelectedType}
            amount={amount}
            setAmount={setAmount}
            volume={volume}
            setVolume={setVolume}
            vehicleReg={vehicleReg}
            displayDetails={displayDetails}
            isAuthorizing={isAuthorizing}
            startFueling={startFueling}
            setStep={handleStepChange}
            useMasterTag={useMasterTag}
            userMasterTag={userMasterTag}
            vehicleInfo={vehicleInfo}
            scanResult={scanResult}
          />
        );
      default:
        return <div>Invalid step: {step}</div>;
    }
  };

  // Get details for the popup
  const popupPumpDetails = activePumpForPopup
    ? getPumpDetails(activePumpForPopup.id)
    : null;
  const popupAmount =
    popupPumpDetails?.currentAmount ?? popupPumpDetails?.amount ?? 0;
  const popupVolume =
    popupPumpDetails?.currentVolume ?? popupPumpDetails?.volume ?? 0;
  // Calculate cost using price from status if available, fallback if necessary
  const priceToUse =
    popupPumpDetails?.currentPrice ?? popupPumpDetails?.price ?? fuelPrice; // Get price from fueling or EOT status, or fallback
  const calculatedCost = popupVolume * priceToUse;
  const popupCost = calculatedCost; // Keep as number

  // --- Popup Data Calculation ---
  // This calculation is also *INSIDE* FuelingProcess
  const tagForPopups =
    popupPumpDetails?.tag ||
    (useMasterTag ? userMasterTag : selectedTag?.name || tagDetails?.tagId) ||
    vehicleReg;

  // --- Return JSX ---
  if (isLoading || isLoadingDeviceConfig) {
    // Check 1: Still loading device data or configuration?
    return (
      <div
        className="loading-container"
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
        }}
      >
        <LoadIndicator width={60} height={60} />
        <div style={{ marginLeft: "20px", fontSize: "16px" }}>
          {isLoading ? "Loading device..." : "Loading device configuration..."}
        </div>
      </div>
    );
  }

  if (!ptsDevice) {
    // Check 2: Loading finished, but device still not found?
    return (
      <div className="error-container dx-card">
        <h2>PTS Device Not Found</h2>
        <p>Could not find details for PTS ID: {ptsId}</p>
        <Button
          text="Return to Dashboard"
          onClick={() => navigate("/")}
          type="default"
        />
      </div>
    );
  }

  // --- Main Render ---
  // If execution reaches here, isLoading is false AND ptsDevice is defined.
  return (
    <div className="fueling-process-container">
      <FuelingHeader
        ptsDevice={ptsDevice} // Safe to pass here if the above checks are solid
        lastUpdated={deviceLastUpdated} // Pass timestamp from hook
        rawUploadStatus={rawUploadStatus} // Cursor: Pass raw status object
        activeFuelingProcesses={activeFuelingProcesses} // Pass derived state
        setShowAllFuelingPopup={setShowAllFuelingPopup}
        startNewFueling={startNewFueling}
        handleNavigation={handleNavigation}
        siteName={siteName()} // Use the siteName function to get the site name
        onConnectionStatusChange={handleConnectionStatusChange} // New prop
        handleViewPumpTransactions={handleViewPumpTransactions} // Add pump transactions handler
      />

      {/* Main Content - Disable interaction when disconnected */}
      <ScrollView>
        <div
          className={`main-content ${
            isDeviceDisconnected ? "tw-opacity-60 tw-pointer-events-none" : ""
          }`}
        >
          {renderCurrentStep()}
        </div>

        {/* Overlay message when disconnected */}
        {isDeviceDisconnected && (
          <div className="tw-fixed tw-inset-0 tw-flex tw-items-center tw-justify-center tw-z-50 tw-pointer-events-none">
            <div className="tw-bg-white tw-rounded-lg tw-p-6 tw-shadow-xl tw-max-w-md tw-mx-auto tw-pointer-events-auto">
              <div className="tw-flex tw-items-center tw-mb-4">
                <i className="fa-solid fa-wifi-slash tw-text-red-500 tw-text-3xl tw-mr-4"></i>
                <h3 className="tw-text-xl tw-font-bold tw-text-red-700">
                  Device Disconnected
                </h3>
              </div>
              <p className="tw-text-gray-700 tw-mb-4">
                The fueling terminal is currently disconnected from the server.
                Fueling operations are disabled until connection is restored.
              </p>
              <div className="tw-flex tw-justify-end">
                <Button
                  text="Check Device Settings"
                  type="danger"
                  stylingMode="outlined"
                  onClick={() =>
                    handleNavigation(
                      `/ptsdevice/${ptsDevice.ptsid || ptsDevice.deviceId}`
                    )
                  }
                />
              </div>
            </div>
          </div>
        )}
      </ScrollView>

      {/* Popups - Pass derived data */}
      {FuelingPopupRenderer.renderFuelingProgressPopup(
        showFuelingPopup,
        activePumpForPopup,
        activeNozzleForPopup,
        popupVolume, // Use derived volume
        popupCost, // Use derived cost
        tagForPopups, // Use the calculated tagForPopups
        stopFueling,
        () => setShowFuelingPopup(false)
      )}

      {FuelingPopupRenderer.renderFuelingCompletePopup(
        fuelingComplete, // Controlled by useEffect watching Redux state
        popupVolume, // Use derived final volume
        popupCost, // Use derived final cost
        activePumpForPopup,
        activeNozzleForPopup,
        tagForPopups, // Use the calculated tagForPopups
        completeFueling // Action to finalize/reset
      )}

      {FuelingPopupRenderer.renderNavigationDialog(
        showNavigationDialog,
        cancelNavigation,
        confirmNavigation
      )}

      {FuelingPopupRenderer.renderAllFuelingProcessesPopup(
        showAllFuelingPopup,
        activeFuelingProcesses, // Pass derived state
        availablePumps, // Pass derived state
        (pumpFromList) => {
          // Callback when user clicks a pump in the 'all processes' popup
          const process = activeFuelingProcesses.find(
            (p) => p.pumpId === pumpFromList.id
          );
          if (process) {
            const pumpObj = availablePumps.find((p) => p.id === process.pumpId);
            // Derive nozzle object based on the process data
            const nozzleId = process.nozzleId;
            const nozzleObj = nozzleId
              ? { id: nozzleId, name: `Nozzle ${nozzleId}` }
              : null;

            // Set the popup context to show details for this ongoing process
            setActivePumpForPopup(pumpObj);
            setActiveNozzleForPopup(nozzleObj);
            setCurrentTransactionId(process.transactionId); // Ensure correct txn ID is set

            // Reset user selection state as we are now viewing an ongoing process, not starting a new one
            setSelectedPump(null);
            setSelectedNozzle(null);
            setVehicleReg(""); // Clear UI state vehicle reg
            setVehicleInfo(null);
            setAmount("");
            setVolume("");

            // Show the individual progress popup
            setShowFuelingPopup(true); // Show progress popup (useEffect will manage based on status)
            setShowAllFuelingPopup(false); // Hide the list popup
            setStep("pump"); // Go back to base step view behind the popup
          }
        },
        setShowAllFuelingPopup
      )}

      {/* Add the FuelingRulePopup */}
      <FuelingRulePopup
        isVisible={showFuelingRulePopup}
        onClose={() => setShowFuelingRulePopup(false)}
        vehicleData={vehicleForRules}
      />

      {/* Cursor: Add Transaction Monitoring Status */}
      <TransactionMonitoringStatus
        deviceId={transactionMonitoringData?.deviceId}
        pumpId={transactionMonitoringData?.pumpId}
        transactionId={transactionMonitoringData?.transactionId}
        isVisible={showTransactionMonitoring}
        onCancel={handleCancelTransaction}
        onComplete={handleCompleteTransaction}
        connectionType={transactionMonitoringData?.connectionType}
      />

      {/* Pump Transaction Popup */}
      <PumpTransactionPopup
        isVisible={showPumpTransactionPopup}
        onClose={() => setShowPumpTransactionPopup(false)}
        title={`Pump Transactions - ${ptsDevice?.ptsid || ptsId}`}
        ptsId={ptsId}
        width="95%"
        height="90%"
      />
    </div>
  );
};

export default FuelingProcess;
