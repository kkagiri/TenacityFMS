/**
 * useFuelingState.js
 *
 * Custom hook to manage all state variables for the fueling process.
 * Centralizes state management to reduce complexity in the main component.
 *
 * State Categories:
 * - UI State (loading, dialogs, popups)
 * - Selection State (pump, nozzle, vehicle)
 * - Transaction State (current transaction, authorization)
 * - Scan State (scanning, results)
 * - Configuration State (device config, connection status)
 */

import { useState } from 'react';

export const useFuelingState = () => {
  // --- Loading & UI State ---
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDeviceConfig, setIsLoadingDeviceConfig] = useState(true);
  const [showNavigationDialog, setShowNavigationDialog] = useState(false);
  const [navigateTo, setNavigateTo] = useState(null);
  const [step, setStep] = useState("pump"); // Current UI step

  // --- Pump & Nozzle Selection ---
  const [selectedPump, setSelectedPump] = useState(null); // Pump selected in UI *by the user*
  const [selectedNozzle, setSelectedNozzle] = useState(null); // Nozzle selected in UI *by the user*
  const [activePumpForPopup, setActivePumpForPopup] = useState(null); // Pump currently shown *in the progress popup*
  const [activeNozzleForPopup, setActiveNozzleForPopup] = useState(null); // Nozzle currently shown *in the progress popup*

  // --- Vehicle & Tag State ---
  const [selectedVehicleId, setSelectedVehicleId] = useState(null); // ID of selected vehicle
  const [vehicleReg, setVehicleReg] = useState(""); // Entered/scanned vehicle reg
  const [vehicleInfo, setVehicleInfo] = useState(null); // Info from tag validation
  const [tagDetails, setTagDetails] = useState(null); // Details for selected/scanned tag
  const [selectedTag, setSelectedTag] = useState(null); // Currently selected tag
  const [useMasterTag, setUseMasterTag] = useState(false);
  const [selectionMethod, setSelectionMethod] = useState("lookup"); // "lookup", "scan", or "master"

  // --- Tank Selection State ---
  const [selectedTankId, setSelectedTankId] = useState(null); // ID of selected tank
  const [availableTanks, setAvailableTanks] = useState([]); // Tanks available for this site
  const [isLoadingTanks, setIsLoadingTanks] = useState(false); // Tank loading state

  // --- Scan State ---
  const [isScanning, setIsScanning] = useState(false); // Scan API call in progress
  const [scanResult, setScanResult] = useState(null); // Tag read during scan

  // --- Transaction State ---
  const [isAuthorizing, setIsAuthorizing] = useState(false); // API call in progress
  const [isAuthorized, setIsAuthorized] = useState(false); // Pump authorized and waiting for physical fueling to start
  const [currentTransactionId, setCurrentTransactionId] = useState(null); // Store ID from authorize/status
  const [eotDetected, setEotDetected] = useState(false); // End of Transaction detected (nozzle replaced)

  // --- Fueling Type & Amounts ---
  const [selectedType, setSelectedType] = useState(null); // User must select type (Volume/FullTank)
  const [amount, setAmount] = useState(""); // Preset Amount input
  const [volume, setVolume] = useState(""); // Preset Volume input
  const [fuelPrice, setFuelPrice] = useState(3.99); // TODO: Get from FuelGrade status in Redux

  // --- Popup State ---
  const [showFuelingPopup, setShowFuelingPopup] = useState(false); // Controls visibility of progress popup
  const [isFuelingPopupMinimized, setIsFuelingPopupMinimized] = useState(false); // Tracks if user minimized the popup
  const [showAllFuelingPopup, setShowAllFuelingPopup] = useState(false);
  const [fuelingComplete, setFuelingComplete] = useState(false); // Controls completion popup visibility
  const [showPumpTransactionPopup, setShowPumpTransactionPopup] = useState(false);
  const [showStuckTransactionManager, setShowStuckTransactionManager] = useState(false);

  // --- Device Configuration State ---
  const [deviceConfig, setDeviceConfig] = useState(null);
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState("connecting");
  const [isDeviceDisconnected, setIsDeviceDisconnected] = useState(false);

  // --- Transaction Monitoring State ---
  const [showTransactionMonitoring, setShowTransactionMonitoring] = useState(false);
  const [deviceConnectionType, setDeviceConnectionType] = useState("Unknown");
  const [transactionMonitoringData, setTransactionMonitoringData] = useState(null);

  // Return all state variables and their setters
  return {
    // Loading & UI State
    isLoading,
    setIsLoading,
    isLoadingDeviceConfig,
    setIsLoadingDeviceConfig,
    showNavigationDialog,
    setShowNavigationDialog,
    navigateTo,
    setNavigateTo,
    step,
    setStep,

    // Pump & Nozzle Selection
    selectedPump,
    setSelectedPump,
    selectedNozzle,
    setSelectedNozzle,
    activePumpForPopup,
    setActivePumpForPopup,
    activeNozzleForPopup,
    setActiveNozzleForPopup,

    // Vehicle & Tag State
    selectedVehicleId,
    setSelectedVehicleId,
    vehicleReg,
    setVehicleReg,
    vehicleInfo,
    setVehicleInfo,
    tagDetails,
    setTagDetails,
    selectedTag,
    setSelectedTag,
    useMasterTag,
    setUseMasterTag,
    selectionMethod,
    setSelectionMethod,

    // Scan State
    isScanning,
    setIsScanning,
    scanResult,
    setScanResult,

    // Transaction State
    isAuthorizing,
    setIsAuthorizing,
    isAuthorized,
    setIsAuthorized,
    currentTransactionId,
    setCurrentTransactionId,
    eotDetected,
    setEotDetected,

    // Fueling Type & Amounts
    selectedType,
    setSelectedType,
    amount,
    setAmount,
    volume,
    setVolume,
    fuelPrice,
    setFuelPrice,

    // Popup State
    showFuelingPopup,
    setShowFuelingPopup,
    isFuelingPopupMinimized,
    setIsFuelingPopupMinimized,
    showAllFuelingPopup,
    setShowAllFuelingPopup,
    fuelingComplete,
    setFuelingComplete,
    showPumpTransactionPopup,
    setShowPumpTransactionPopup,
    showStuckTransactionManager,
    setShowStuckTransactionManager,

    // Device Configuration State
    deviceConfig,
    setDeviceConfig,
    deviceConnectionStatus,
    setDeviceConnectionStatus,
    isDeviceDisconnected,
    setIsDeviceDisconnected,

    // Transaction Monitoring State
    showTransactionMonitoring,
    setShowTransactionMonitoring,
    deviceConnectionType,
    setDeviceConnectionType,
    transactionMonitoringData,
    setTransactionMonitoringData,

    // Tank Selection State
    selectedTankId,
    setSelectedTankId,
    availableTanks,
    setAvailableTanks,
    isLoadingTanks,
    setIsLoadingTanks,
  };
};

export default useFuelingState;
