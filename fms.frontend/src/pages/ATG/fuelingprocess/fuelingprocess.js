import React, { useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import ScrollView from "devextreme-react/scroll-view";
import LoadIndicator from "devextreme-react/load-indicator";
import "./fuelingprocess.scss";

// Import components
import FuelingPopupRenderer from "./Components/FuelingPopupRenderer";
import FuelingHeader from "./Components/FuelingHeader";
import PumpTransactionPopup from "../../../components/PumpTransactionPopup/PumpTransactionPopup";
import StuckTransactionManager from "./Components/StuckTransactionManager";
import ScanStep from "./fuelingsteps/ScanStep";
import PumpSelectionStep from "./fuelingsteps/PumpSelectionStep";
import NozzleSelectionStep from "./fuelingsteps/NozzleSelectionStep";
import FuelingDetailsStep from "./fuelingsteps/FuelingDetailsStep";
import TransactionMonitoringStatus from "./TransactionMonitoringStatus";

// Import custom hooks
import { useDeviceData } from "../../../hooks/useDeviceData";
import { useFuelingState } from "./hooks/useFuelingState";
import { useFuelingActions } from "./hooks/useFuelingActions";
import { useFuelingEffects } from "./hooks/useFuelingEffects";

const FuelingProcess = () => {
  const { ptsId } = useParams();
  const navigate = useNavigate();

  // Use custom state hook
  const state = useFuelingState();

  // Destructure state for easier access
  const {
    isLoading,
    setIsLoading,
    showNavigationDialog,
    setShowNavigationDialog,
    navigateTo,
    setNavigateTo,
    step,
    setStep,
    selectedPump,
    setSelectedPump,
    selectedNozzle,
    setSelectedNozzle,
    vehicleReg,
    setVehicleReg,
    isAuthorizing,
    setIsAuthorizing,
    isScanning,
    setIsScanning,
    scanResult,
    setScanResult,
    vehicleInfo,
    setVehicleInfo,
    fuelingComplete,
    setFuelingComplete,
    fuelPrice,
    selectedType,
    setSelectedType,
    amount,
    setAmount,
    volume,
    setVolume,
    showFuelingPopup,
    setShowFuelingPopup,
    isFuelingPopupMinimized,
    setIsFuelingPopupMinimized,
    showAllFuelingPopup,
    setShowAllFuelingPopup,
    currentTransactionId,
    setCurrentTransactionId,
    activePumpForPopup,
    setActivePumpForPopup,
    activeNozzleForPopup,
    setActiveNozzleForPopup,
    tagDetails,
    setTagDetails,
    selectedTag,
    setSelectedTag,
    deviceConnectionStatus,
    setDeviceConnectionStatus,
    isDeviceDisconnected,
    setIsDeviceDisconnected,
    useMasterTag,
    setUseMasterTag,
    selectionMethod,
    setSelectionMethod,
    deviceConfig,
    setDeviceConfig,
    isLoadingDeviceConfig,
    setIsLoadingDeviceConfig,
    showTransactionMonitoring,
    setShowTransactionMonitoring,
    deviceConnectionType,
    setDeviceConnectionType,
    transactionMonitoringData,
    setTransactionMonitoringData,
    showPumpTransactionPopup,
    setShowPumpTransactionPopup,
    showStuckTransactionManager,
    setShowStuckTransactionManager,
    selectedVehicleId,
    setSelectedVehicleId,
  } = state;

  // Use device data hook
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
  } = useDeviceData(ptsId);

  // Get PTS device info from Redux store
  const ptsDevice = useSelector((reduxState) =>
    reduxState.ptsDevice.ptsDeviceList.find((dev) => dev.ptsid === ptsId)
  );

  // Get sites from Redux store
  const sites = useSelector((reduxState) => reduxState.site.sites);

  // Get vehicles from Redux store
  const vehicles = useSelector((reduxState) => reduxState.vehicle.vehicles);
  const isLoadingVehicles = false; // VehicleSearchableSelector loads on-demand

  // Get tag-related data from Redux
  const validatedTag = useSelector((reduxState) => reduxState.tag?.validatedTag);

  // Get logged-in user data
  const loggedInUser = useSelector((reduxState) => reduxState.auth.user);
  const userMasterTag = loggedInUser?.masterTag || null;

  // Get site name for the current device
  const siteName = useCallback(() => {
    if (!ptsDevice || !sites || !sites.length) return null;
    const siteId = ptsDevice.site;
    const site = sites.find((site) => site.id === siteId);
    return site ? site.name : null;
  }, [ptsDevice, sites]);

  // Use actions hook
  const actions = useFuelingActions({
    ptsId,
    devicePumpStatus,
    getPumpDetails,
    fuelGrades,
    state,
    userMasterTag,
  });

  // Destructure actions for easier access
  const {
    startFueling,
    stopFueling,
    completeFueling,
    startNewFueling,
    handleNavigation,
    handleVehicleSelected,
    startScan,
    cancelScan,
    acceptScanResult,
    processScanResult,
    handleCancelTransaction,
    handleCompleteTransaction,
    handleConnectionStatusChange,
    handleViewPumpTransactions,
  } = actions;

  // Use effects hook for side effects
  useFuelingEffects({
    ptsId,
    ptsDevice,
    state,
    devicePumpStatus,
    isLiveDataEnabled,
    getPumpDetails,
    validatedTag,
  });

  // Step navigation helpers
  const handleStepChange = useCallback((newStep) => {
    setStep(newStep);
  }, [setStep]);

  const handlePumpSelection = useCallback((pump) => {
    setSelectedPump(pump);
    setStep("nozzle");
  }, [setSelectedPump, setStep]);

  const handleNozzleSelection = useCallback((nozzle) => {
    setSelectedNozzle(nozzle);
    setStep("scan");
  }, [setSelectedNozzle, setStep]);

  // Navigation dialog helpers
  const confirmNavigation = useCallback(() => {
    setShowNavigationDialog(false);
    if (navigateTo) {
      navigate(navigateTo);
    }
  }, [navigateTo, navigate, setShowNavigationDialog]);

  const cancelNavigation = useCallback(() => {
    setShowNavigationDialog(false);
    setNavigateTo(null);
  }, [setShowNavigationDialog, setNavigateTo]);

  // Memoize derived data
  const nozzlesForSelectedPump = useMemo(() => {
    return getNozzlesForPump(selectedPump?.id, rawUploadStatus);
  }, [selectedPump?.id, rawUploadStatus, getNozzlesForPump]);

  // Determine display details for steps
  const displayDetails = tagDetails || vehicleInfo;

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
            // TODO: FUELING RULE FEATURE - Re-enable onConfigureRules callback when feature is ready
            /*
            onConfigureRules={(vehicleData) => {
              setVehicleForRules({
                vehicleId: vehicleData?.vehicleId,
                regNumber: vehicleData?.numberPlate || vehicleData?.hyoungNo || "Unknown",
                isCompanyVehicle: vehicleData?.isCompanyVehicle || false,
              });
              setShowFuelingRulePopup(true);
            }}
            */
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
  const popupVolume =
    popupPumpDetails?.currentVolume ?? popupPumpDetails?.volume ?? 0;
  // Calculate cost using price from status if available, fallback if necessary
  const priceToUse =
    popupPumpDetails?.currentPrice ?? popupPumpDetails?.price ?? fuelPrice;
  const calculatedCost = popupVolume * priceToUse;
  const popupCost = calculatedCost;

  // Popup tag calculation
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
        availablePumps={availablePumps} // Pass available pumps to check if any exist
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
                <i className="fa-light fa-wifi-slash tw-text-red-500 tw-text-3xl tw-mr-4"></i>
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
        () => {
          setShowFuelingPopup(false);
          setIsFuelingPopupMinimized(true); // Mark as minimized by user
        }
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
            setIsFuelingPopupMinimized(false); // Reset minimized state when viewing details
            setShowAllFuelingPopup(false); // Hide the list popup
            setStep("pump"); // Go back to base step view behind the popup
          }
        },
        setShowAllFuelingPopup
      )}

      {/* TODO: FUELING RULE FEATURE - Re-enable FuelingRulePopup when feature is ready */}
      {/* Add the FuelingRulePopup - Currently disabled as fuel rule validation is not active */}
      {/*
      <FuelingRulePopup
        isVisible={showFuelingRulePopup}
        onClose={() => {
          setShowFuelingRulePopup(false);
          setVehicleForRules(null);
        }}
        vehicleData={vehicleForRules}
        onRulesAssigned={async (vehicle) => {
          // Re-validate the vehicle after rules are assigned
          if (vehicle?.vehicleId) {
            try {
              const validationResult = await dispatch(
                validateVehicle(vehicle.vehicleId)
              );

              if (validationResult && validationResult.isValid) {
                setVehicleInfo(validationResult.vehicleInfo);
                setSelectedVehicleId(vehicle.vehicleId);
                notify("Vehicle rules configured! Click 'Accept & Continue' to proceed.", "success", 4000);
              } else {
                notify(
                  `Validation still failed: ${validationResult?.message || "Unknown error"}`,
                  "warning",
                  3000
                );
              }
            } catch (error) {
              console.error("Error re-validating vehicle:", error);
            }
          }
        }}
      />
      */}

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

      {/* Stuck Transaction Manager - Admin only emergency cleanup */}
      <StuckTransactionManager
        deviceId={ptsId}
        isVisible={showStuckTransactionManager}
        onClose={() => setShowStuckTransactionManager(false)}
      />
    </div>
  );
};

export default FuelingProcess;
