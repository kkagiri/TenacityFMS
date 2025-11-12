//Cursor
import React, { memo, useCallback, useMemo, useState, useEffect } from "react";
import { Button } from "devextreme-react/button";
import { RadioGroup } from "devextreme-react/radio-group";
import LoadIndicator from "devextreme-react/load-indicator";
import ProgressBar from "devextreme-react/progress-bar";
import VehicleSearchableSelector from "../../../../components/selectors/VehicleSearchableSelector";
import pumpControlService from "../../../../services/pumpControlService";
import ptsSignalRService from "../../../../signalR/ptsSignalRService";
import notify from "devextreme/ui/notify";

//Cursor: Memoized ScanStep component - Redesigned to prevent UI overlays
const ScanStep = memo(
  ({
    isScanning,
    scanResult,
    vehicleInfo,
    cancelScan,
    startScan,
    acceptScanResult,
    setStep,
    selectionMethod,
    setSelectionMethod,
    isLoadingVehicles = false,
    selectedVehicleId = null,
    handleVehicleSelected = () => {},
    selectedNozzle,
    setScanResult,
    onConfigureRules, // Add callback for configuring rules
    ptsId, // Device ID for nozzle state check
  }) => {
    //Cursor: Nozzle state monitoring - NEW
    const [nozzleState, setNozzleState] = useState({
      isUp: false,
      nozzleNumber: null,
      status: "Unknown",
      message: "Checking nozzle status...",
      lastUpdated: null,
    });
    const [isCheckingNozzle, setIsCheckingNozzle] = useState(true);

    //Cursor: Initial nozzle state check on mount
    useEffect(() => {
      const checkInitialNozzleState = async () => {
        if (!ptsId || !selectedNozzle?.id) {
          setIsCheckingNozzle(false);
          return;
        }

        try {
          setIsCheckingNozzle(true);
          const response = await pumpControlService.api.getNozzleState(
            ptsId,
            selectedNozzle.id
          );

          if (response.isSuccess && response.data) {
            setNozzleState({
              isUp: response.data.isNozzleUp || false,
              nozzleNumber: response.data.nozzleNumber,
              status: response.data.status || "Unknown",
              message:
                response.data.message || "Nozzle state retrieved successfully",
              lastUpdated: new Date(),
            });
          } else {
            setNozzleState({
              isUp: false,
              nozzleNumber: selectedNozzle.nozzleNumber,
              status: "Unknown",
              message: response.message || "Unable to determine nozzle state",
              lastUpdated: new Date(),
            });
          }
        } catch (error) {
          console.error("[ScanStep] Error checking nozzle state:", error);
          setNozzleState({
            isUp: false,
            nozzleNumber: selectedNozzle.nozzleNumber,
            status: "Error",
            message: "Failed to check nozzle state",
            lastUpdated: new Date(),
          });
        } finally {
          setIsCheckingNozzle(false);
        }
      };

      checkInitialNozzleState();
    }, [ptsId, selectedNozzle]);

    //Cursor: Real-time nozzle state monitoring via SignalR
    useEffect(() => {
      if (!ptsId || !selectedNozzle?.id) return;

      const handleUploadStatusUpdate = (data) => {
        try {
          console.log("[ScanStep] UploadStatusUpdate received:", data);

          // Check if this update is for our device
          if (data?.deviceId !== ptsId) {
            console.log("[ScanStep] Update for different device, ignoring");
            return;
          }

          // Parse UploadStatus data structure from data.status
          const uploadStatus = data?.status;
          if (!uploadStatus) {
            console.log("[ScanStep] No status in update");
            return;
          }

          const idleStatus = uploadStatus?.pumps?.idleStatus;
          if (!idleStatus || !idleStatus.ids || !idleStatus.nozzlesUp) {
            console.log("[ScanStep] No IdleStatus in update");
            return;
          }

          // Find pump index in Ids array
          const pumpIndex = idleStatus.ids.findIndex(
            (id) => id === selectedNozzle.id
          );
          if (pumpIndex === -1) {
            console.log("[ScanStep] Pump not in idle state");
            return;
          }

          // Check nozzle state from NozzlesUp array
          const nozzleValue = idleStatus.nozzlesUp[pumpIndex];
          const isNozzleUp = nozzleValue > 0;

          console.log("[ScanStep] Nozzle state:", { pumpIndex, nozzleValue, isNozzleUp });

          setNozzleState((prev) => ({
            ...prev,
            isUp: isNozzleUp,
            nozzleNumber: nozzleValue > 0 ? nozzleValue : prev.nozzleNumber,
            status: isNozzleUp ? "Up" : "Down",
            message: isNozzleUp
              ? `✅ Nozzle ${nozzleValue} is UP - Ready to fuel`
              : "⚠️ Please lift nozzle from pump",
            lastUpdated: new Date(),
          }));
        } catch (error) {
          console.error(
            "[ScanStep] Error parsing uploadStatusUpdate:",
            error
          );
        }
      };

      // Subscribe to uploadStatusUpdate events using the .on() method
      console.log("[ScanStep] Subscribing to uploadStatusUpdate for device:", ptsId);
      const unsubscribe = ptsSignalRService.on(
        "uploadStatusUpdate",
        handleUploadStatusUpdate
      );

      // Cleanup subscription on unmount
      return () => {
        console.log("[ScanStep] Unsubscribing from uploadStatusUpdate");
        if (unsubscribe && typeof unsubscribe === "function") {
          unsubscribe();
        }
      };
    }, [ptsId, selectedNozzle]);

    //Cursor: Memoize selection methods
    const selectionMethods = useMemo(
      () => [
        {
          id: "lookup",
          text: "Select Company Vehicle",
          icon: "fa-light fa-list-ul",
        },
        { id: "scan", text: "Scan RFID Tag", icon: "fa-light fa-tag" },
      ],
      []
    );

    const isLookupSelected = selectionMethod === "lookup";
    const isScanSelected = selectionMethod === "scan";

    //Cursor: Memoize method change handler
    const handleMethodChange = useCallback(
      (e) => {
        const newMethod = e.value;
        setSelectionMethod(newMethod);
        if (newMethod === "lookup") {
          if (isScanning) {
            cancelScan();
          }
        } else if (newMethod === "scan") {
          handleVehicleSelected(null);
        }
      },
      [setSelectionMethod, isScanning, cancelScan, handleVehicleSelected]
    );

    //Cursor: Memoize vehicle lookup handler
    const handleVehicleLookupChange = useCallback(
      (e) => {
        // VehicleSearchableSelector passes { value: vehicleId }
        const vehicleId = e.value;
        if (vehicleId) {
          // Pass the vehicleId to parent to trigger validation
          handleVehicleSelected({ vehicleId });
        } else {
          // Clear selection
          handleVehicleSelected(null);
        }
      },
      [handleVehicleSelected]
    );

    //Cursor: Memoize back button handler
    const handleBack = useCallback(() => {
      setStep("nozzle");
    }, [setStep]);

    //Cursor: Memoize clear selection handler
    const handleClearSelection = useCallback(() => {
      handleVehicleSelected(null);
    }, [handleVehicleSelected]);

    //Cursor: Memoize accept handler (unified for both scan and lookup) - UPDATED with nozzle validation
    const handleAcceptVehicle = useCallback(() => {
      // Validate nozzle is UP before proceeding
      if (!nozzleState.isUp) {
        notify(
          {
            message:
              "⚠️ Please lift the nozzle from the pump before starting fueling",
            type: "warning",
            displayTime: 4000,
            position: { at: "top center", my: "top center" },
          },
          { direction: "down-push" }
        );
        return;
      }

      console.log("handleAcceptVehicle - Nozzle UP, proceeding", vehicleInfo);
      acceptScanResult(vehicleInfo);
    }, [acceptScanResult, vehicleInfo, nozzleState.isUp]);

    // Check if vehicle info is being loaded (selectedVehicleId exists but vehicleInfo doesn't)
    const isLoadingVehicleInfo = selectedVehicleId && !vehicleInfo;

    // Render vehicle information card (shared between scan and lookup)
    const renderVehicleInfoCard = useCallback(() => {
      if (!vehicleInfo) return null;

      return (
        <div className="vehicle-info-card tw-border tw-rounded-lg tw-p-4 tw-bg-white tw-shadow tw-mb-4">
          <div className="vehicle-header tw-flex tw-items-center tw-mb-3 tw-pb-3 tw-border-b">
            <i className="fa-light fa-truck tw-text-xl tw-text-blue-600 tw-mr-3"></i>
            <h4 className="tw-text-lg tw-font-semibold tw-m-0">
              {vehicleInfo.hyoungNo || "N/A"}
            </h4>
            {scanResult && (
              <span className="tag-id tw-ml-auto tw-font-mono tw-text-xs tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded">
                Tag: {scanResult}
              </span>
            )}
          </div>

          <div className="vehicle-basic-info tw-mb-4">
            <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm">
              {vehicleInfo.vehicleId && (
                <div className="detail-item">
                  <span className="detail-label tw-font-medium tw-text-gray-600 tw-block">
                    Vehicle ID:
                  </span>
                  <span className="detail-value tw-text-gray-900">
                    {vehicleInfo.vehicleId}
                  </span>
                </div>
              )}
              {vehicleInfo.vehicleType && (
                <div className="detail-item">
                  <span className="detail-label tw-font-medium tw-text-gray-600 tw-block">
                    Type:
                  </span>
                  <span className="detail-value tw-text-gray-900">
                    {vehicleInfo.vehicleType}
                  </span>
                </div>
              )}
              {vehicleInfo.numberPlate && (
                <div className="detail-item">
                  <span className="detail-label tw-font-medium tw-text-gray-600 tw-block">
                    Plate:
                  </span>
                  <span className="detail-value tw-text-gray-900">
                    {vehicleInfo.numberPlate}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Fueling Limits Section */}
          {(vehicleInfo.dailyLimit !== undefined ||
            vehicleInfo.monthlyLimit !== undefined ||
            vehicleInfo.fuelingLimit !== undefined) && (
            <div className="vehicle-limits tw-border-t tw-pt-3">
              <h5 className="tw-text-base tw-font-medium tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-gas-pump tw-text-blue-600 tw-mr-2"></i>
                Fueling Limits
              </h5>

              <div className="tw-space-y-3">
                {/* Daily Limit */}
                {vehicleInfo.dailyLimit !== undefined &&
                  vehicleInfo.dailyLimit > 0 && (
                    <div className="limit-item">
                      <div className="tw-flex tw-justify-between tw-mb-1">
                        <span className="tw-text-xs tw-font-medium tw-text-gray-700">
                          Daily Limit
                        </span>
                        <span className="tw-text-xs tw-font-semibold tw-text-gray-900">
                          {vehicleInfo.dailyUsed || 0} /{" "}
                          {vehicleInfo.dailyLimit} L
                        </span>
                      </div>
                      <ProgressBar
                        min={0}
                        max={vehicleInfo.dailyLimit}
                        value={vehicleInfo.dailyUsed || 0}
                        className="tw-h-2"
                      />
                    </div>
                  )}

                {/* Monthly Limit */}
                {vehicleInfo.monthlyLimit !== undefined &&
                  vehicleInfo.monthlyLimit > 0 && (
                    <div className="limit-item">
                      <div className="tw-flex tw-justify-between tw-mb-1">
                        <span className="tw-text-xs tw-font-medium tw-text-gray-700">
                          Monthly Limit
                        </span>
                        <span className="tw-text-xs tw-font-semibold tw-text-gray-900">
                          {vehicleInfo.monthlyUsed || 0} /{" "}
                          {vehicleInfo.monthlyLimit} L
                        </span>
                      </div>
                      <ProgressBar
                        min={0}
                        max={vehicleInfo.monthlyLimit}
                        value={vehicleInfo.monthlyUsed || 0}
                        className="tw-h-2"
                      />
                    </div>
                  )}

                {/* Transaction Limit */}
                {vehicleInfo.fuelingLimit !== undefined &&
                  vehicleInfo.fuelingLimit > 0 && (
                    <div className="limit-item tw-p-2 tw-bg-gray-50 tw-rounded">
                      <div className="tw-flex tw-items-center tw-justify-between tw-text-xs">
                        <span className="tw-font-medium tw-text-gray-700">
                          <i className="fa-light fa-tint tw-text-blue-500 tw-mr-1"></i>
                          Transaction Limit
                        </span>
                        <span className="tw-font-semibold tw-text-gray-900">
                          {vehicleInfo.fuelingLimit} L per fueling
                        </span>
                      </div>
                    </div>
                  )}
              </div>
            </div>
          )}
        </div>
      );
    }, [vehicleInfo, scanResult]);

    return (
      <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
        {/* Header */}
        <div className="tw-mb-4 tw-flex-shrink-0">
          <h3 className="tw-flex tw-items-center tw-text-xl tw-font-semibold tw-m-0">
            <i className="fa-light fa-id-card-alt tw-mr-2 tw-text-blue-600"></i>
            Vehicle Identification
          </h3>
        </div>

        {/* Nozzle State Indicator - NEW */}
        <div
          className={`tw-mb-4 tw-p-4 tw-rounded-lg tw-border-2 tw-flex tw-items-center tw-justify-between tw-transition-all ${
            isCheckingNozzle
              ? "tw-border-gray-300 tw-bg-gray-50"
              : nozzleState.isUp
              ? "tw-border-green-500 tw-bg-green-50"
              : "tw-border-orange-500 tw-bg-orange-50"
          }`}
        >
          <div className="tw-flex tw-items-center tw-gap-3">
            {isCheckingNozzle ? (
              <>
                <LoadIndicator width={24} height={24} />
                <div>
                  <p className="tw-font-semibold tw-text-gray-700 tw-mb-0">
                    Checking nozzle status...
                  </p>
                  <p className="tw-text-xs tw-text-gray-600 tw-mb-0 tw-mt-1">
                    Please wait
                  </p>
                </div>
              </>
            ) : nozzleState.isUp ? (
              <>
                <i className="fa-light fa-gas-pump tw-text-green-600 tw-text-3xl"></i>
                <div>
                  <p className="tw-font-semibold tw-text-green-700 tw-mb-0 tw-flex tw-items-center">
                    <i className="fa-light fa-check-circle tw-mr-2"></i>
                    Nozzle {nozzleState.nozzleNumber} is UP
                  </p>
                  <p className="tw-text-xs tw-text-green-600 tw-mb-0 tw-mt-1">
                    ✅ Ready to fuel - You may proceed
                  </p>
                </div>
              </>
            ) : (
              <>
                <i className="fa-light fa-gas-pump tw-text-orange-600 tw-text-3xl"></i>
                <div>
                  <p className="tw-font-semibold tw-text-orange-700 tw-mb-0 tw-flex tw-items-center">
                    <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                    Nozzle Down
                  </p>
                  <p className="tw-text-xs tw-text-orange-600 tw-mb-0 tw-mt-1">
                    ⚠️ Please lift the nozzle from the pump before continuing
                  </p>
                </div>
              </>
            )}
          </div>
          {nozzleState.lastUpdated && !isCheckingNozzle && (
            <div className="tw-text-right">
              <p className="tw-text-xs tw-text-gray-500 tw-mb-0">
                Last updated
              </p>
              <p className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-0">
                {nozzleState.lastUpdated.toLocaleTimeString()}
              </p>
            </div>
          )}
        </div>

        {/* Scrollable Content Wrapper */}
        <div className="tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw--mr-2">
          {/* Method Selection */}
          <div className="method-selection tw-mb-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
          <label className="tw-block tw-mb-3 tw-font-medium tw-text-gray-700 tw-text-sm">
            Choose Identification Method:
          </label>
          <RadioGroup
            items={selectionMethods}
            value={selectionMethod}
            onValueChanged={handleMethodChange}
            layout="horizontal"
            valueExpr="id"
            itemRender={(item) => (
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className={`${item.icon} tw-text-base`}></i>
                <span className="tw-text-sm">{item.text}</span>
              </div>
            )}
          />
        </div>

        {/* Main Content Area - Only one section visible at a time */}
        <div className="content-area tw-min-h-[300px]">
          {/* LOOKUP MODE */}
          {isLookupSelected && (
            <div className="lookup-mode-content">
              {/* Vehicle Search Selector - Always show, hide only during loading */}
              {!isLoadingVehicleInfo && (
                <div className="tw-mb-4" style={{ position: 'relative', zIndex: 10 }}>
                  <label className="tw-block tw-mb-2 tw-font-medium tw-text-gray-700 tw-text-sm">
                    Select Company Vehicle
                  </label>
                  <VehicleSearchableSelector
                    key={`vehicle-selector-${selectedVehicleId || 'empty'}`}
                    value={selectedVehicleId}
                    onValueChanged={handleVehicleLookupChange}
                    placeholder="Search and select a vehicle..."
                    disabled={isLoadingVehicles}
                    width="100%"
                  />
                  {!selectedVehicleId && !isLoadingVehicles && !vehicleInfo && (
                    <small className="tw-text-gray-500 tw-block tw-mt-2 tw-text-xs">
                      <i className="fa-light fa-info-circle tw-mr-1"></i>
                      Type at least 2 characters to search for a vehicle.
                    </small>
                  )}
                  {vehicleInfo && (
                    <small className="tw-text-green-600 tw-block tw-mt-2 tw-text-xs">
                      <i className="fa-light fa-check-circle tw-mr-1"></i>
                      Vehicle validated and ready
                    </small>
                  )}
                </div>
              )}

              {/* Loading State */}
              {isLoadingVehicleInfo && (
                <div className="tw-text-center tw-py-8">
                  <LoadIndicator width={40} height={40} />
                  <p className="tw-mt-3 tw-text-gray-600 tw-text-sm tw-font-medium">
                    Validating vehicle...
                  </p>
                  <p className="tw-mt-1 tw-text-gray-500 tw-text-xs">
                    Please wait while we verify vehicle information
                  </p>
                </div>
              )}

              {/* Vehicle Info Display */}
              {vehicleInfo && !isLoadingVehicleInfo && (
                <div className="vehicle-info-wrapper">
                  <div className="tw-text-center tw-mb-4">
                    <i className="fa-light fa-check-circle tw-text-green-500 tw-text-3xl"></i>
                    <p className="tw-text-lg tw-font-medium tw-mt-2 tw-text-gray-800">
                      Vehicle Selected
                    </p>
                    <p className="tw-text-sm tw-text-gray-500">
                      Vehicle information retrieved from company fleet
                    </p>
                  </div>
                  {renderVehicleInfoCard()}
                  {/* Action Buttons */}
                  <div className="tw-flex tw-flex-col tw-gap-2 tw-mt-4">
                    {/* TODO: FUELING RULE FEATURE - Re-enable Configure Rules Button when feature is ready */}
                    {/* Configure Rules Button - Disabled until fueling rules feature is implemented */}
                    {/*
                    {onConfigureRules && (
                      <Button
                        text="Configure Fuel Rules"
                        type="default"
                        stylingMode="outlined"
                        icon="fa-light fa-cog"
                        onClick={() => onConfigureRules(vehicleInfo)}
                        width="100%"
                        hint="Set up or modify fueling rules for this vehicle"
                      />
                    )}
                    */}

                    {/* Main Action Buttons */}
                    <div className="tw-flex tw-gap-3">
                      <Button
                        text="Change Vehicle"
                        type="normal"
                        stylingMode="outlined"
                        icon="fa-light fa-exchange-alt"
                        onClick={handleClearSelection}
                        className="tw-flex-1"
                      />
                      <Button
                        text="Accept & Continue"
                        type="success"
                        stylingMode="contained"
                        icon="fa-light fa-check"
                        onClick={handleAcceptVehicle}
                        className="tw-flex-1"
                        disabled={!nozzleState.isUp}
                        hint={
                          !nozzleState.isUp
                            ? "⚠️ Please lift the nozzle before continuing"
                            : "Proceed to fueling details"
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SCAN MODE */}
          {isScanSelected && (
            <div className="scan-mode-content">
              {/* Initial Scan State */}
              {!isScanning && !scanResult && !vehicleInfo && (
                <div className="tw-text-center tw-py-8">
                  <div className="tw-mb-6">
                    <i className="fa-light fa-tag tw-text-gray-400 tw-text-5xl"></i>
                  </div>
                  <Button
                    text="Start Scanning"
                    width="80%"
                    height={50}
                    stylingMode="contained"
                    type="default"
                    icon="fa-light fa-wifi"
                    onClick={startScan}
                    className="tw-text-base"
                  />
                  <p className="tw-text-sm tw-text-gray-500 tw-mt-3">
                    Click the button above to start RFID tag scanning
                  </p>
                </div>
              )}

              {/* Scanning in Progress */}
              {isScanning && !scanResult && (
                <div className="tw-text-center tw-py-8">
                  <div className="scanning-animation tw-mb-4">
                    <i className="fa-light fa-wifi tw-text-blue-500 tw-text-5xl"></i>
                    <div className="scanning-waves"></div>
                  </div>
                  <p className="tw-text-lg tw-font-medium tw-text-gray-800">
                    Scanning for RFID tag...
                  </p>
                  <p className="tw-text-sm tw-text-gray-600 tw-mb-6">
                    Please hold the tag near the scanner
                  </p>
                  <Button
                    text="Cancel Scan"
                    type="danger"
                    stylingMode="outlined"
                    onClick={cancelScan}
                    icon="fa-light fa-times"
                  />
                </div>
              )}

              {/* Tag Scanned, Validating */}
              {scanResult && !vehicleInfo && !isScanning && (
                <div className="tw-text-center tw-py-8">
                  <div className="tw-mb-4">
                    <i className="fa-light fa-check-circle tw-text-green-500 tw-text-4xl"></i>
                  </div>
                  <p className="tw-text-lg tw-font-medium tw-text-gray-800 tw-mb-2">
                    Tag Scanned Successfully
                  </p>
                  <div className="tw-inline-block tw-bg-gray-100 tw-px-4 tw-py-2 tw-rounded-lg tw-mb-6">
                    <p className="tw-font-mono tw-text-sm tw-text-gray-700 tw-m-0">
                      Tag ID: {scanResult}
                    </p>
                  </div>
                  <div className="tw-mb-4">
                    <LoadIndicator width={40} height={40} />
                  </div>
                  <p className="tw-text-gray-600 tw-font-medium tw-mb-1">
                    Validating vehicle...
                  </p>
                  <p className="tw-text-gray-500 tw-text-xs tw-mb-6">
                    Please wait while we verify vehicle information
                  </p>
                  <Button
                    text="Cancel"
                    type="danger"
                    stylingMode="outlined"
                    onClick={cancelScan}
                    icon="fa-light fa-times"
                  />
                </div>
              )}

              {/* Vehicle Info Retrieved */}
              {vehicleInfo && scanResult && !isScanning && (
                <div className="vehicle-info-wrapper">
                  <div className="tw-text-center tw-mb-4">
                    <i className="fa-light fa-check-circle tw-text-green-500 tw-text-3xl"></i>
                    <p className="tw-text-lg tw-font-medium tw-mt-2 tw-text-gray-800">
                      Tag Validated Successfully
                    </p>
                    <p className="tw-text-sm tw-text-gray-500">
                      Vehicle information retrieved
                    </p>
                  </div>
                  {renderVehicleInfoCard()}
                  {/* Action Buttons */}
                  <div className="tw-flex tw-flex-col tw-gap-2 tw-mt-4">
                    {/* TODO: FUELING RULE FEATURE - Re-enable Configure Rules Button when feature is ready */}
                    {/* Configure Rules Button - Disabled until fueling rules feature is implemented */}
                    {/*
                    {onConfigureRules && (
                      <Button
                        text="Configure Fuel Rules"
                        type="default"
                        stylingMode="outlined"
                        icon="fa-light fa-cog"
                        onClick={() => onConfigureRules(vehicleInfo)}
                        width="100%"
                        hint="Set up or modify fueling rules for this vehicle"
                      />
                    )}
                    */}

                    {/* Main Action Buttons */}
                    <div className="tw-flex tw-gap-2">
                      <Button
                        text="Cancel"
                        type="normal"
                        stylingMode="outlined"
                        icon="fa-light fa-times"
                        onClick={cancelScan}
                      />
                      <Button
                        text="Scan Again"
                        type="default"
                        stylingMode="outlined"
                        icon="fa-light fa-redo"
                        onClick={startScan}
                      />
                      <Button
                        text="Accept & Continue"
                        type="success"
                        stylingMode="contained"
                        icon="fa-light fa-check"
                        onClick={handleAcceptVehicle}
                        className="tw-flex-1"
                        disabled={!nozzleState.isUp}
                        hint={
                          !nozzleState.isUp
                            ? "⚠️ Please lift the nozzle before continuing"
                            : "Proceed to fueling details"
                        }
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          </div>
        </div>

        {/* Bottom Navigation - Always visible at bottom with proper spacing */}
        <div className="tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200 tw-flex-shrink-0">
          <Button
            text="Back to Nozzles"
            type="normal"
            icon="fa-light fa-chevron-left"
            stylingMode="outlined"
            onClick={handleBack}
          />
        </div>
      </div>
    );
  }
);

export default ScanStep;
//Cursor
