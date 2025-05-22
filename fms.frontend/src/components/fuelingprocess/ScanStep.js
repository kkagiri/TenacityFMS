//Cursor
import React, { memo, useCallback, useMemo } from "react";
import { Button } from "devextreme-react/button";
import { Lookup } from "devextreme-react/lookup";
import { RadioGroup } from "devextreme-react/radio-group";
import LoadIndicator from "devextreme-react/load-indicator";
import ProgressBar from "devextreme-react/progress-bar";
import notify from "devextreme/ui/notify";

//Cursor: Memoized ScanStep component
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
    vehicles = [],
    isLoadingVehicles = false,
    selectedVehicleId = null,
    handleVehicleSelected = () => {},
    vehicleReg = "",
    selectedNozzle,
    setScanResult,
  }) => {
    //Cursor: Memoize selection methods
    const selectionMethods = useMemo(
      () => [
        {
          id: "lookup",
          text: "Select Company Vehicle",
          icon: "fas fa-list-ul",
        },
        { id: "scan", text: "Scan RFID Tag", icon: "fas fa-tag" },
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
        const vehicle = vehicles.find((v) => v.vehicleId === e.value);
        handleVehicleSelected(vehicle || null);
      },
      [vehicles, handleVehicleSelected]
    );

    //Cursor: Memoize vehicle display expression
    const vehicleDisplayExpr = useCallback((item) => {
      return item
        ? `${item.hyoungNo || "Unknown Vehicle"} (${
            item.numberPlate || "No Plate"
          })`
        : "";
    }, []);

    //Cursor: Memoize back button handler
    const handleBack = useCallback(() => {
      setStep("nozzle");
    }, [setStep]);

    //Cursor: Memoize clear selection handler
    const handleClearSelection = useCallback(() => {
      handleVehicleSelected(null);
    }, [handleVehicleSelected]);

    //Cursor: Memoize accept scan result handler
    const handleAcceptScanResult = useCallback(() => {
      acceptScanResult(vehicleInfo);
    }, [acceptScanResult, vehicleInfo]);

    //Cursor: Memoize accept lookup result handler
    const handleAcceptLookupResult = useCallback(() => {
      console.log("handleAcceptLookupResult", vehicleInfo);
      acceptScanResult(vehicleInfo);
    }, [acceptScanResult, vehicleInfo]);

    // Check if vehicle info is being loaded (selectedVehicleId exists but vehicleInfo doesn't)
    const isLoadingVehicleInfo = selectedVehicleId && !vehicleInfo;

    return (
      <div className="dx-card responsive-paddings">
        <h3>
          <i className="fas fa-id-card-alt tw-mr-2"></i>Vehicle Identification
        </h3>

        <div className="method-selection tw-mb-4 tw-p-3 tw-bg-gray-50 tw-rounded-md">
          <label className="tw-block tw-mb-2 tw-font-medium tw-text-gray-700">
            Choose Identification Method:
          </label>
          <RadioGroup
            items={selectionMethods}
            value={selectionMethod}
            onValueChanged={handleMethodChange}
            layout="horizontal"
            valueExpr="id"
            itemRender={(item) => (
              <div className="tw-flex tw-items-center">
                <i className={`${item.icon} tw-mr-2 tw-text-base`}></i>
                <span>{item.text}</span>
              </div>
            )}
          />
        </div>

        <div
          className={`lookup-section tw-mb-4 ${
            !isLookupSelected ? "tw-hidden" : "tw-block"
          }`}
        >
          <label className="tw-block tw-mb-1 tw-font-medium">
            Select Company Vehicle
          </label>
          <div className="vehicle-lookup tw-relative">
            <Lookup
              dataSource={vehicles}
              value={selectedVehicleId}
              onValueChanged={handleVehicleLookupChange}
              displayExpr={vehicleDisplayExpr}
              valueExpr="vehicleId"
              placeholder="Search or select a vehicle..."
              searchEnabled={true}
              disabled={isLoadingVehicles || !isLookupSelected}
              showClearButton={true}
              height={40}
              className="tw-w-full"
            />
            {isLoadingVehicles && isLookupSelected && (
              <LoadIndicator
                width={20}
                height={20}
                className="select-loader tw-absolute tw-right-10 tw-top-1/2 tw--translate-y-1/2"
              />
            )}
          </div>
          {isLookupSelected && !selectedVehicleId && !isLoadingVehicles && (
            <small className="select-hint tw-text-gray-600 tw-block tw-mt-1 tw-text-xs">
              <i className="fas fa-info-circle tw-mr-1"></i> Please select a
              company vehicle from the list above.
            </small>
          )}
        </div>

        <div
          className={`scan-section ${
            !isScanSelected ? "tw-hidden" : "tw-block"
          }`}
        >
          {isScanning && !scanResult && (
            <div className="scanning-container tw-text-center tw-my-5">
              <div className="scanning-animation">
                <i className="fas fa-wifi tw-text-blue-500 tw-text-4xl"></i>
                <div className="scanning-waves"></div>
              </div>
              <p className="scanning-text tw-text-lg tw-font-medium tw-mt-3">
                Scanning RFID tag...
              </p>
              <p className="scanning-instruction tw-text-gray-600">
                Please hold the tag near the scanner.
              </p>
              <Button
                text="Cancel Scan"
                type="danger"
                stylingMode="outlined"
                onClick={cancelScan}
                className="tw-mt-4"
                icon="fas fa-times"
              />
            </div>
          )}

          {scanResult && !vehicleInfo && !isScanning && (
            <div className="scan-result-container tw-text-center tw-my-5">
              <div className="scan-success tw-mb-3">
                <i className="fas fa-check-circle tw-text-green-500 tw-text-2xl"></i>
                <p className="tw-text-lg tw-font-medium tw-mt-1">
                  Tag scanned successfully
                </p>
              </div>
              <div className="tag-info">
                <p className="tag-id tw-font-mono tw-bg-gray-100 tw-p-2 tw-rounded tw-inline-block">
                  Tag ID: {scanResult}
                </p>
                <div className="tw-flex tw-items-center tw-justify-center tw-mt-3 tw-text-gray-600">
                  <LoadIndicator width={20} height={20} className="tw-mr-2" />
                  <p className="fetching-info tw-m-0">
                    Validating tag and fetching vehicle information...
                  </p>
                </div>
              </div>
              <Button
                text="Cancel Validation"
                type="danger"
                stylingMode="outlined"
                onClick={cancelScan}
                className="tw-mt-4"
                icon="fas fa-times"
              />
            </div>
          )}

          {vehicleInfo && scanResult && !isScanning && (
            <div className="vehicle-details-container tw-my-3">
              <div className="scan-success tw-mb-3 tw-text-center">
                <i className="fas fa-check-circle tw-text-green-500 tw-text-2xl"></i>
                <p className="tw-text-lg tw-font-medium tw-mt-1">
                  Tag Validated & Vehicle Info Retrieved
                </p>
              </div>

              <div className="vehicle-info-card tw-border tw-rounded-lg tw-p-4 tw-bg-white tw-shadow">
                <div className="vehicle-header tw-flex tw-items-center tw-mb-3">
                  <i className="fas fa-truck tw-text-xl tw-text-blue-600 tw-mr-3"></i>
                  <h4 className="tw-text-lg tw-font-semibold tw-m-0">
                    {vehicleInfo.hyoungNo || "N/A"}
                  </h4>
                  <span className="tag-id tw-ml-auto tw-font-mono tw-text-xs tw-bg-gray-100 tw-p-1 tw-rounded">
                    Tag: {scanResult}
                  </span>
                </div>

                <div className="vehicle-details tw-grid tw-grid-cols-2 tw-gap-2 tw-mb-4 tw-text-sm">
                  <div className="detail-item">
                    <span className="detail-label tw-font-medium tw-text-gray-600">
                      Type:
                    </span>
                    <span className="detail-value tw-ml-1">
                      {vehicleInfo.vehicleType || "N/A"}
                    </span>
                  </div>
                </div>

                <div className="vehicle-limits">
                  <h5 className="tw-text-base tw-font-medium tw-mb-2 tw-border-t tw-pt-3">
                    Fueling Limits
                  </h5>

                  {vehicleInfo && (
                    <>
                      {/* Show monthly limits if available */}
                      {vehicleInfo.monthlyLimit !== undefined &&
                        vehicleInfo.monthlyLimit !== null &&
                        vehicleInfo.monthlyLimit > 0 && (
                          <div className="limit-item tw-mb-2">
                            {/* Monthly limit display code */}
                          </div>
                        )}

                      {/* Show daily limits if available */}
                      {vehicleInfo.dailyLimit !== undefined &&
                        vehicleInfo.dailyLimit !== null &&
                        vehicleInfo.dailyLimit > 0 && (
                          <div className="limit-item tw-mb-2">
                            {/* Daily limit display code */}
                          </div>
                        )}

                      {/* Show transaction limit if available */}
                      <div className="limit-item tw-text-sm">
                        {/* Transaction limit display code */}
                      </div>
                    </>
                  )}
                </div>
              </div>

              <div className="scan-actions tw-flex tw-justify-between tw-mt-4">
                <Button
                  text="Back"
                  type="normal"
                  stylingMode="outlined"
                  icon="fas fa-chevron-left"
                  onClick={cancelScan}
                />
                <Button
                  text="Scan Again"
                  type="default"
                  stylingMode="outlined"
                  icon="fas fa-redo"
                  onClick={startScan}
                />
                <Button
                  text="Accept & Continue"
                  type="success"
                  stylingMode="contained"
                  icon="fas fa-check"
                  onClick={handleAcceptScanResult}
                />
              </div>
            </div>
          )}

          {!isScanning && !scanResult && !vehicleInfo && (
            <div className="initial-scan-action tw-mt-4 tw-text-center">
              <Button
                text="Start Scan"
                width="80%"
                height={50}
                stylingMode="contained"
                type="default"
                icon="fas fa-tag"
                onClick={startScan}
                className="tw-text-lg"
              />
              <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
                Click the button above to initiate RFID tag scanning.
              </p>
            </div>
          )}
        </div>

        {/* Loading state for vehicle info */}
        {isLookupSelected && isLoadingVehicleInfo && (
          <div className="tw-text-center tw-my-5">
            <LoadIndicator width={40} height={40} />
            <p className="tw-mt-3 tw-text-gray-600">
              Loading vehicle information...
            </p>
          </div>
        )}

        {isLookupSelected &&
          selectedVehicleId &&
          vehicleInfo &&
          !isLoadingVehicles && (
            <div className="vehicle-details-container tw-my-3">
              <div className="selection-success tw-mb-3 tw-text-center">
                <i className="fas fa-check-circle tw-text-green-500 tw-text-2xl"></i>
                <p className="tw-text-lg tw-font-medium tw-mt-1">
                  Vehicle Selected
                </p>
              </div>

              <div className="selected-vehicle-card tw-border tw-rounded-lg tw-p-4 tw-bg-white tw-shadow">
                <div className="vehicle-header tw-flex tw-items-center tw-mb-3">
                  <i className="fas fa-truck tw-text-xl tw-text-blue-600 tw-mr-3"></i>
                  <h4 className="tw-text-lg tw-font-semibold tw-m-0">
                    {vehicleInfo.hyoungNo || "N/A"}
                  </h4>
                </div>

                <div className="vehicle-details tw-text-sm">
                  <p className="tw-mb-3 tw-text-gray-600">
                    Vehicle selected from company fleet.
                  </p>

                  {/* Vehicle validation result details */}
                  <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-mb-4">
                    <div className="detail-item">
                      <span className="detail-label tw-font-medium tw-text-gray-600">
                        Vehicle ID:
                      </span>
                      <span className="detail-value tw-ml-1">
                        {vehicleInfo.vehicleId || "N/A"}
                      </span>
                    </div>
                    <div className="detail-item">
                      <span className="detail-label tw-font-medium tw-text-gray-600">
                        Hyoung No:
                      </span>
                      <span className="detail-value tw-ml-1">
                        {vehicleInfo.hyoungNo || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Fueling Limits Section */}
                  <div className="vehicle-limits tw-border-t tw-pt-3">
                    <h5 className="tw-text-base tw-font-medium tw-mb-2">
                      Fueling Limits
                    </h5>

                    <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                      {/* Daily Limit */}
                      {vehicleInfo.dailyLimit !== undefined && (
                        <div className="limit-item">
                          <div className="tw-flex tw-justify-between tw-mb-1">
                            <span className="tw-text-xs tw-font-medium">
                              Daily Limit:
                            </span>
                            <span className="tw-text-xs">
                              {vehicleInfo.dailyUsed || 0} /{" "}
                              {vehicleInfo.dailyLimit || 0} L
                            </span>
                          </div>
                          <ProgressBar
                            min={0}
                            max={vehicleInfo.dailyLimit || 100}
                            value={vehicleInfo.dailyUsed || 0}
                            className="tw-h-2"
                          />
                        </div>
                      )}

                      {/* Monthly Limit */}
                      {vehicleInfo.monthlyLimit !== undefined && (
                        <div className="limit-item">
                          <div className="tw-flex tw-justify-between tw-mb-1">
                            <span className="tw-text-xs tw-font-medium">
                              Monthly Limit:
                            </span>
                            <span className="tw-text-xs">
                              {vehicleInfo.monthlyUsed || 0} /{" "}
                              {vehicleInfo.monthlyLimit || 0} L
                            </span>
                          </div>
                          <ProgressBar
                            min={0}
                            max={vehicleInfo.monthlyLimit || 100}
                            value={vehicleInfo.monthlyUsed || 0}
                            className="tw-h-2"
                          />
                        </div>
                      )}

                      {/* Transaction Limit if available */}
                      {vehicleInfo.fuelingLimit !== undefined && (
                        <div className="limit-item tw-col-span-2">
                          <div className="tw-flex tw-items-center tw-text-xs">
                            <i className="fas fa-gas-pump tw-text-gray-600 tw-mr-1"></i>
                            <span className="tw-font-medium">
                              Transaction Limit:
                            </span>
                            <span className="tw-ml-2">
                              {vehicleInfo.fuelingLimit || 0} L per fueling
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="selection-actions tw-flex tw-justify-between tw-mt-4">
                <Button
                  text="Change Selection"
                  type="normal"
                  stylingMode="outlined"
                  icon="fas fa-times"
                  onClick={handleClearSelection}
                />
                <Button
                  text="Accept & Continue"
                  type="success"
                  stylingMode="contained"
                  icon="fas fa-check"
                  onClick={handleAcceptLookupResult}
                  disabled={!selectedVehicleId}
                />
              </div>
            </div>
          )}

        <div className="navigation-buttons tw-flex tw-justify-start tw-mt-6 tw-pt-4 tw-border-t">
          <Button
            text="Back to Nozzles"
            type="normal"
            icon="fas fa-chevron-left"
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
