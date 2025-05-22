import React, { useState, useCallback } from "react";
import { Button } from "devextreme-react/button";
import { TextBox } from "devextreme-react/text-box";
import { NumberBox } from "devextreme-react/number-box";
import { TileView } from "devextreme-react/tile-view";
import ProgressBar from "devextreme-react/progress-bar";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { Lookup } from "devextreme-react/lookup";
import { useSelector } from "react-redux";
import { RadioGroup } from "devextreme-react/radio-group";

// Import icons
import PumpIcon from "../icons/PumpIcon";
import NozzleIcon from "../icons/NozzleIcon";

//cluade import needed components
import "./fuelingprocess.scss";

const FuelingProcessRenderer = {
  renderPumpSelection: (
    availablePumps,
    activePumps,
    setSelectedPump,
    setStep,
    setActivePump,
    setShowFuelingPopup
  ) => {
    return (
      <div className="dx-card responsive-paddings">
        <h3>
          {/* Cursor: Use Font Awesome full package icon */}
          <i className="fas fa-gas-pump tw-mr-2"></i>Select Pump
        </h3>
        <div className="pump-selection-container">
          {availablePumps && availablePumps.length > 0 ? (
            <div className="dx-fieldset">
              <TileView
                items={availablePumps}
                baseItemHeight={220}
                baseItemWidth={200}
                itemMargin={15}
                itemRender={(item) => {
                  const isActive = activePumps.some(
                    (p) => p.pumpId === item.id
                  );
                  // Determine clickability: all pumps status  are clickable, offline are not
                  const isClickable =
                    item.status === "idle" ||
                    item.status === "nozzleUp" ||
                    item.status === "fueling"; // Allow clicking fueling to view
                  const isSelectable = item.status === "idle"; // Only idle pumps can start a new process

                  return (
                    <div
                      className={`pump-tile ${
                        isSelectable ? "selectable" : "" // Can start new fueling
                      } ${isClickable ? "clickable" : "disabled"} ${
                        isActive ? "currently-active" : "" // Currently fueling/EOT
                      }`}
                      style={{
                        padding: "15px",
                        borderRadius: "8px",
                        height: "100%",
                        border: isActive
                          ? "2px solid #4caf50" // Green border if busy
                          : isSelectable
                          ? "1px solid #198754" // Greenish border if selectable
                          : "1px solid #ddd", // Default border
                        backgroundColor: isClickable ? "#f8f8f8" : "#eee",
                        opacity: isClickable ? 1 : 0.6,
                        cursor: isClickable ? "pointer" : "not-allowed",
                      }}
                    >
                      <div className="pump-icon-container">
                        <PumpIcon
                          className="pump-icon"
                          // Color based on selectability/status
                          color={
                            isSelectable
                              ? "#198754"
                              : item.status === "offline"
                              ? "#dc3545"
                              : isActive
                              ? "#4caf50" // Busy color
                              : "#6c757d" // Other non-selectable (nozzleUp)
                          }
                        />
                        {isActive && (
                          <div className="active-indicator-badge">
                            {/* Cursor: Use Font Awesome full package icon */}
                            <i className="fas fa-circle"></i> Busy
                          </div>
                        )}
                        {item.status === "offline" && (
                          <div className="offline-indicator-badge">
                            {/* Cursor: Use Font Awesome full package icon */}
                            <i className="fas fa-triangle-exclamation"></i>{" "}
                            Offline
                          </div>
                        )}
                      </div>
                      <h4>{item.name}</h4>
                      <p>
                        Status:{" "}
                        <span
                          style={{
                            fontWeight: "bold", // Cursor: Make status bold
                            color:
                              item.status === "idle"
                                ? "green"
                                : item.status === "nozzleUp"
                                ? "orange"
                                : item.status === "fueling"
                                ? "blue"
                                : item.status === "endOfTransaction" // Cursor: Add EOT color
                                ? "#6f42c1" // Purple for EOT
                                : "red", // Offline
                          }}
                        >
                          {/* Cursor: Nicer status names */}
                          {item.status === "idle"
                            ? "Available"
                            : item.status === "nozzleUp"
                            ? "Nozzle Lifted"
                            : item.status === "fueling"
                            ? "Fueling"
                            : item.status === "endOfTransaction"
                            ? "Completed"
                            : item.status === "offline"
                            ? "Offline"
                            : item.status}
                        </span>
                      </p>

                      {/* Display last transaction if available */}
                      {item.lastTransaction > 0 && (
                        <div className="last-transaction">
                          <small>
                            {/* Cursor: Use Font Awesome full package icon */}
                            <i className="fas fa-receipt"></i> Last:
                            {item.lastAmount > 0 && (
                              <span className="last-amount">
                                {" "}
                                ${item.lastAmount.toFixed(2)}
                              </span>
                            )}
                            {item.lastVolume > 0 && (
                              <span className="last-volume">
                                {" "}
                                ({item.lastVolume.toFixed(2)}L)
                              </span>
                            )}
                          </small>
                        </div>
                      )}

                      {/* Cursor: Button logic refinement */}
                      {isActive && ( // Show 'View Fueling' only if currently active (fueling/EOT)
                        <div
                          className="button-container"
                          // Use native DOM event handler to stop propagation
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                          }}
                        >
                          <Button
                            text="View Details" // Changed text
                            type="success"
                            stylingMode="contained"
                            width="100%"
                            onClick={() => {
                              setActivePump(item); // Set context for the popup
                              setShowFuelingPopup(true); // Show the progress/complete popup
                            }}
                            // Cursor: Use Font Awesome full package icon
                            icon="fas fa-eye"
                            className="view-fueling-btn"
                          />
                        </div>
                      )}
                    </div>
                  );
                }}
                onItemClick={(e) => {
                  // Cursor: Allow selection only if pump is idle
                  if (
                    e.itemData.status === "idle" ||
                    e.itemData.status === "nozzleUp"
                  ) {
                    setSelectedPump(e.itemData);
                    setStep("nozzle");
                  } else if (
                    e.itemData.status === "fueling" ||
                    e.itemData.status === "endOfTransaction"
                  ) {
                    // If clicking a busy pump, show its details popup
                    setActivePump(e.itemData);
                    setShowFuelingPopup(true);
                  } else if (e.itemData.status === "offline") {
                    notify("This pump is offline.", "error", 2000);
                  } else if (e.itemData.status === "nozzleUp") {
                    notify(
                      "Nozzle is already lifted for this pump.",
                      "warning",
                      2000
                    );
                    // Optionally allow selecting nozzleUp pumps if your logic supports it
                    setSelectedPump(e.itemData);
                    setStep("nozzle");
                  }
                }}
              />
            </div>
          ) : (
            <div className="no-pumps-message">
              <div className="no-data-icon">
                {/* Cursor: Use Font Awesome full package icon */}
                <i className="fa-light fa-gas-pump"></i>
                <i className="fas fa-slash"></i>
              </div>
              <p>No pumps are available for this device.</p>
              <p className="no-data-subtext">
                Please check device configuration or connection status.
              </p>
            </div>
          )}
        </div>
      </div>
    );
  },

  renderNozzleSelection: (nozzles, setSelectedNozzle, setStep) => {
    // Cursor: Handle case where nozzles might be undefined or empty
    const hasNozzles = nozzles && nozzles.length > 0;

    return (
      <div className="dx-card responsive-paddings">
        <h3>
          {/* Cursor: Use Font Awesome full package icon */}
          <i className="fas fa-filter tw-mr-2"></i>Select Nozzle
        </h3>
        <div className="nozzle-selection-container">
          {hasNozzles ? (
            <div className="dx-fieldset">
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                {nozzles.map((item) => {
                  const isClickable =
                    item.status === "idle" || item.status === "lifted";

                  // Use different colors for different fuel types
                  let fuelColor = "#007bff"; // Default blue
                  if (item.fuelType) {
                    if (item.fuelType.toLowerCase().includes("diesel")) {
                      fuelColor = "#4e810a"; // Green for diesel
                    } else if (
                      item.fuelType.toLowerCase().includes("petrol") ||
                      item.fuelType.toLowerCase().includes("gasoline")
                    ) {
                      fuelColor = "#e63946"; // Red for petrol/gasoline
                    } else if (
                      item.fuelType.toLowerCase().includes("premium")
                    ) {
                      fuelColor = "#7209b7"; // Purple for premium
                    }
                  }

                  return (
                    <div
                      key={item.id}
                      className={`tw-border tw-rounded-lg tw-transition-all tw-duration-100 tw-transform tw-min-h-[180px] ${
                        isClickable
                          ? "tw-bg-white tw-shadow-sm hover:tw-shadow tw-cursor-pointer"
                          : "tw-bg-gray-100 tw-opacity-60 tw-cursor-not-allowed"
                      }`}
                      onClick={() => {
                        if (isClickable) {
                          console.log(`Clicking nozzle ${item.id}`); //Cursor
                          setSelectedNozzle(item);
                          setStep("scan");
                        } else {
                          notify(
                            `Nozzle ${item.id} is currently ${
                              item.status || "unavailable"
                            }. Cannot select.`,
                            "warning",
                            2000
                          );
                        }
                      }}
                    >
                      <div className="tw-p-4 tw-flex tw-flex-col tw-h-full">
                        <div className="tw-flex tw-justify-between tw-items-start tw-mb-3">
                          <div
                            className="tw-h-12 tw-w-12 tw-flex tw-items-center tw-justify-center tw-rounded-full"
                            style={{
                              backgroundColor: `${
                                isClickable ? fuelColor : "#6c757d"
                              }15`,
                            }}
                          >
                            {/* Use fuel type icon based on fuel type */}
                            {item.fuelType &&
                            item.fuelType.toLowerCase().includes("diesel") ? (
                              <i
                                className="fas fa-truck-monster tw-text-2xl"
                                style={{
                                  color: isClickable ? fuelColor : "#6c757d",
                                }}
                              ></i>
                            ) : item.fuelType &&
                              item.fuelType
                                .toLowerCase()
                                .includes("premium") ? (
                              <i
                                className="fas fa-tachometer-alt tw-text-2xl"
                                style={{
                                  color: isClickable ? fuelColor : "#6c757d",
                                }}
                              ></i>
                            ) : (
                              <i
                                className="fas fa-gas-pump tw-text-2xl"
                                style={{
                                  color: isClickable ? fuelColor : "#6c757d",
                                }}
                              ></i>
                            )}
                          </div>
                          <span
                            className={`tw-inline-flex tw-items-center tw-justify-center tw-h-6 tw-w-6 tw-rounded-full tw-font-bold ${
                              isClickable
                                ? "tw-bg-blue-100 tw-text-blue-800"
                                : "tw-bg-gray-200 tw-text-gray-600"
                            }`}
                          >
                            {item.id}
                          </span>
                        </div>

                        <div className="tw-mb-2">
                          <h5 className="tw-text-lg tw-font-semibold tw-mb-1">
                            {item.name || `Nozzle ${item.id}`}
                          </h5>
                          <div
                            className={`tw-inline-block tw-px-2 tw-py-1 tw-text-xs tw-font-medium tw-rounded ${
                              isClickable
                                ? "tw-bg-blue-100 tw-text-blue-800"
                                : "tw-bg-gray-200 tw-text-gray-600"
                            }`}
                          >
                            {item.status === "idle"
                              ? "Ready"
                              : item.status === "lifted"
                              ? "Lifted"
                              : item.status}
                          </div>
                        </div>

                        <div className="tw-mt-auto">
                          <div className="tw-flex tw-items-center tw-text-sm tw-text-gray-600">
                            <i
                              className="fas fa-fill tw-mr-2"
                              style={{
                                color: isClickable ? fuelColor : "#6c757d",
                              }}
                            ></i>
                            <span className="tw-font-medium">
                              {item.fuelType || "Unknown Fuel"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="no-nozzles-message">
              <div className="no-data-icon">
                <i className="fa-light fa-filter"></i>
                <i className="fas fa-slash"></i>
              </div>
              <p>No nozzles found for the selected pump.</p>
              <p className="no-data-subtext">
                Please check the device configuration or pump status.
              </p>
            </div>
          )}
        </div>
        <Button
          text="Back to Pumps"
          type="normal"
          icon="fas fa-chevron-left"
          stylingMode="outlined"
          onClick={() => setStep("pump")}
          className="tw-mt-4"
        />
      </div>
    );
  },

  renderVehicleSelection: (setStep) => {
    return (
      <div className="dx-card responsive-paddings">
        <h3>
          {/* Cursor: Use Font Awesome full package icon */}
          <i className="fas fa-id-card-alt tw-mr-2"></i>Vehicle Identification
        </h3>
        <div className="dx-fieldset">
          <div className="dx-field">
            <Button
              text="Proceed to Vehicle/Tag Selection"
              width="100%"
              height={60}
              stylingMode="contained"
              type="success"
              onClick={() => {
                setStep("scan");
              }}
              icon="fas fa-arrow-right"
              className="tw-text-lg"
            />
          </div>
        </div>
        <Button
          text="Back to Nozzles"
          type="normal"
          icon="fas fa-chevron-left"
          stylingMode="outlined"
          onClick={() => setStep("nozzle")}
          className="tw-mt-4"
        />
      </div>
    );
  },
  renderScanProcess: (
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
    setVehicleReg = () => {}
  ) => {
    console.log("[RenderScanProcess] Received props:", {
      selectionMethod,
      selectedVehicleId,
      isScanning,
      scanResult,
    });

    const selectionMethods = [
      { id: "lookup", text: "Select Company Vehicle", icon: "fas fa-list-ul" },
      { id: "scan", text: "Scan RFID Tag", icon: "fas fa-tag" },
    ];

    const isLookupSelected = selectionMethod === "lookup";
    const isScanSelected = selectionMethod === "scan";

    const handleMethodChange = (e) => {
      const newMethod = e.value;
      console.log(
        "[handleMethodChange] Fired. Current:",
        selectionMethod,
        "New:",
        newMethod
      );

      // Always update the selection method regardless of previous state
      setSelectionMethod(newMethod);

      // Reset state based on the selected method
      if (newMethod === "lookup") {
        // If switching to lookup, cancel any ongoing scan
        if (isScanning) {
          cancelScan();
        }
        // Show lookup section, hide scan section
        document.querySelector(".lookup-section").classList.remove("tw-hidden");
        document.querySelector(".lookup-section").classList.add("tw-block");
        document.querySelector(".scan-section").classList.add("tw-hidden");
        document.querySelector(".scan-section").classList.remove("tw-block");
      } else if (newMethod === "scan") {
        // If switching to scan, clear any selected vehicle
        handleVehicleSelected(null);
        // Show scan section, hide lookup section
        document.querySelector(".scan-section").classList.remove("tw-hidden");
        document.querySelector(".scan-section").classList.add("tw-block");
        document.querySelector(".lookup-section").classList.add("tw-hidden");
        document.querySelector(".lookup-section").classList.remove("tw-block");
      }
    };

    console.log("[RenderScanProcess] Calculated:", {
      isLookupSelected,
      isScanSelected,
    });

    return (
      <div className="dx-card responsive-paddings">
        <h3>
          {/* Cursor: Use Font Awesome full package icon */}
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
              onValueChanged={(e) => {
                const vehicle = vehicles.find((v) => v.vehicleId === e.value);
                handleVehicleSelected(vehicle || null);
              }}
              displayExpr={(item) => {
                return item
                  ? `${
                      item.hyoungNo || item.numberPlate || "Unknown Vehicle"
                    } (${item.numberPlate || "No Plate"})`
                  : "";
              }}
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
                    {vehicleInfo.regNumber || "N/A"}
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

                  {vehicleInfo.monthlyLimit !== undefined &&
                    vehicleInfo.monthlyLimit !== null &&
                    vehicleInfo.monthlyLimit > 0 && (
                      <div className="limit-item tw-mb-2">
                        <div className="limit-header tw-flex tw-justify-between tw-text-sm tw-mb-1">
                          <span className="limit-label">Monthly Usage:</span>
                          <span className="limit-value">
                            {vehicleInfo.monthlyUsed?.toFixed(2) || 0}L /{" "}
                            {vehicleInfo.monthlyLimit?.toFixed(2)}L
                          </span>
                        </div>
                        <ProgressBar
                          min={0}
                          max={vehicleInfo.monthlyLimit || 1}
                          value={vehicleInfo.monthlyUsed || 0}
                          statusFormat={() => ``}
                          className="limits-progress-bar monthly"
                        />
                      </div>
                    )}

                  {vehicleInfo.dailyLimit !== undefined &&
                    vehicleInfo.dailyLimit !== null &&
                    vehicleInfo.dailyLimit > 0 && (
                      <div className="limit-item tw-mb-2">
                        <div className="limit-header tw-flex tw-justify-between tw-text-sm tw-mb-1">
                          <span className="limit-label">Daily Usage:</span>
                          <span className="limit-value">
                            {vehicleInfo.dailyUsed?.toFixed(2) || 0}L /{" "}
                            {vehicleInfo.dailyLimit?.toFixed(2)}L
                          </span>
                        </div>
                        <ProgressBar
                          min={0}
                          max={vehicleInfo.dailyLimit || 1}
                          value={vehicleInfo.dailyUsed || 0}
                          statusFormat={() => ``}
                          className="limits-progress-bar daily"
                        />
                      </div>
                    )}

                  <div className="limit-item tw-text-sm">
                    <span className="limit-label tw-font-medium tw-text-gray-600">
                      Fueling Limit (per Txn):
                    </span>
                    <span className="limit-value tw-ml-1 tw-font-semibold">
                      {vehicleInfo.fuelingLimit !== undefined &&
                      vehicleInfo.fuelingLimit !== null
                        ? `${vehicleInfo.fuelingLimit.toFixed(2)} L`
                        : "No Limit Set"}
                    </span>
                  </div>
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
                  onClick={() => acceptScanResult(vehicleInfo)}
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

        {isLookupSelected && selectedVehicleId && !isLoadingVehicles && (
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
                  {vehicleReg ||
                    vehicles.find((v) => v.vehicleId === selectedVehicleId)
                      ?.hyoungNo ||
                    "Vehicle Selected"}
                </h4>
              </div>
              <p className="tw-text-sm tw-text-gray-600">
                Vehicle selected from company fleet. Press "Accept & Continue"
                to proceed.
              </p>
            </div>

            <div className="selection-actions tw-flex tw-justify-between tw-mt-4">
              <Button
                text="Change Selection"
                type="normal"
                stylingMode="outlined"
                icon="fas fa-times"
                onClick={() => {
                  handleVehicleSelected(null);
                }}
              />
              <Button
                text="Accept & Continue"
                type="success"
                stylingMode="contained"
                icon="fas fa-check"
                onClick={() => acceptScanResult(null)}
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
            onClick={() => setStep("nozzle")}
          />
        </div>
      </div>
    );
  },

  renderFuelingDetails: (
    selectedPump,
    selectedNozzle,
    activeFuelingProcesses,
    selectedType,
    setSelectedType,
    amount,
    setAmount,
    volume,
    setVolume,
    vehicleReg,
    vehicleDetails,
    isAuthorizing,
    startFueling,
    setStep,
    useMasterTag,
    userMasterTag,
    vehicleInfo,
    scanResult
  ) => {
    const isPumpNozzleBusy =
      selectedPump &&
      selectedNozzle &&
      activeFuelingProcesses.some(
        (p) =>
          p.pumpId === selectedPump.id &&
          p.nozzleId === selectedNozzle.id &&
          (p.status === "fueling" || p.status === "endOfTransaction")
      );

    const tagBeingUsed = useMasterTag ? userMasterTag : vehicleDetails?.tagId;

    const currentFuelingLimit = useMasterTag
      ? null
      : vehicleDetails?.fuelingLimit;

    const dailyLimit = vehicleDetails?.dailyLimit;
    const dailyUsed = vehicleDetails?.dailyUsed;
    const dailyRemaining =
      dailyLimit !== null &&
      dailyLimit !== undefined &&
      dailyUsed !== null &&
      dailyUsed !== undefined
        ? Math.max(0, dailyLimit - dailyUsed)
        : null;

    const monthlyLimit = vehicleDetails?.monthlyLimit;
    const monthlyUsed = vehicleDetails?.monthlyUsed;
    const monthlyRemaining =
      monthlyLimit !== null &&
      monthlyLimit !== undefined &&
      monthlyUsed !== null &&
      monthlyUsed !== undefined
        ? Math.max(0, monthlyLimit - monthlyUsed)
        : null;

    let effectiveVolumeLimit = null;
    if (
      currentFuelingLimit !== null &&
      currentFuelingLimit !== undefined &&
      currentFuelingLimit >= 0
    ) {
      effectiveVolumeLimit = currentFuelingLimit;
    }
    if (dailyRemaining !== null) {
      effectiveVolumeLimit =
        effectiveVolumeLimit === null
          ? dailyRemaining
          : Math.min(effectiveVolumeLimit, dailyRemaining);
    }
    if (monthlyRemaining !== null) {
      effectiveVolumeLimit =
        effectiveVolumeLimit === null
          ? monthlyRemaining
          : Math.min(effectiveVolumeLimit, monthlyRemaining);
    }

    const isVolumeValid =
      selectedType !== "Volume" ||
      (volume > 0 &&
        (effectiveVolumeLimit === null || volume <= effectiveVolumeLimit));
    const isFullTankValid = selectedType === "FullTank";
    const canAuthorize =
      (isVolumeValid || isFullTankValid) && !isPumpNozzleBusy;

    return (
      <div className="dx-card responsive-paddings">
        <h3>
          <i className="fas fa-check-circle tw-mr-2"></i>Fueling Authorization
        </h3>
        <div className="dx-fieldset">
          <div className="dx-field tw-mb-4">
            <div className="dx-field-label tw-font-semibold tw-mb-2">
              Authorization Type
            </div>
            <div className="dx-field-value">
              <div className="auth-type-buttons tw-flex tw-justify-center tw-gap-4">
                <button
                  className={`auth-type-btn tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-rounded-lg tw-border tw-w-1/2 ${
                    selectedType === "Volume"
                      ? "tw-bg-blue-50 tw-border-blue-400 tw-text-blue-700"
                      : "tw-bg-gray-50 tw-border-gray-200 tw-text-gray-700"
                  }`}
                  onClick={() => {
                    setSelectedType("Volume");
                    setAmount("");
                  }}
                >
                  <i className="fas fa-fill-drip tw-text-3xl tw-mb-2"></i>
                  <span className="tw-font-medium">By Volume</span>
                </button>
                <button
                  className={`auth-type-btn tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-rounded-lg tw-border tw-w-1/2 ${
                    selectedType === "FullTank"
                      ? "tw-bg-green-50 tw-border-green-400 tw-text-green-700"
                      : "tw-bg-gray-50 tw-border-gray-200 tw-text-gray-700"
                  }`}
                  onClick={() => {
                    setSelectedType("FullTank");
                    setAmount("");
                    setVolume("");
                  }}
                >
                  <i className="fas fa-gas-pump tw-text-3xl tw-mb-2"></i>
                  <span className="tw-font-medium">Full Tank</span>
                </button>
              </div>
            </div>
          </div>

          <div className="authorization-inputs tw-mb-4">
            {selectedType === "Volume" && (
              <div className="dx-field">
                <div className="dx-field-label tw-mb-1">Volume (L)</div>
                <div className="dx-field-value">
                  <NumberBox
                    value={volume}
                    onValueChanged={(e) => setVolume(e.value)}
                    placeholder="Enter desired volume"
                    format="#,##0.00"
                    showSpinButtons={true}
                    min={0.01}
                    max={
                      effectiveVolumeLimit !== null
                        ? effectiveVolumeLimit
                        : undefined
                    }
                    height={40}
                  />
                  {effectiveVolumeLimit !== null && (
                    <small className="tw-text-gray-500 tw-block tw-mt-1">
                      Max allowed: {effectiveVolumeLimit.toFixed(2)} L (based on
                      transaction/daily/monthly limits)
                    </small>
                  )}
                  {volume > 0 &&
                    effectiveVolumeLimit !== null &&
                    volume > effectiveVolumeLimit && (
                      <small className="tw-text-red-500 tw-block tw-mt-1">
                        Entered volume exceeds the maximum allowed limit.
                      </small>
                    )}
                </div>
              </div>
            )}

            {selectedType === "FullTank" && (
              <div className="full-tank-message tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded">
                <div className="full-tank-info tw-flex tw-items-start">
                  <i className="fas fa-info-circle tw-text-blue-500 tw-mr-2 tw-mt-1"></i>
                  <span className="tw-text-sm tw-text-blue-700">
                    Tank will be filled to capacity or until the maximum allowed
                    limit (per transaction, daily, or monthly) is reached.
                    {effectiveVolumeLimit !== null &&
                      ` (Max: ${effectiveVolumeLimit.toFixed(2)} L)`}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="fueling-details-card tw-border tw-rounded-lg tw-p-3 tw-bg-gray-50 tw-shadow-sm tw-mb-3">
            <h4 className="tw-text-base tw-font-medium tw-mb-3">
              <i className="fas fa-clipboard-list tw-mr-2"></i> Authorization
              Summary
            </h4>

            <div className="summary-table tw-w-full tw-text-sm">
              <div className="tw-flex tw-items-center tw-mb-2">
                <div className="tw-w-6 tw-flex tw-justify-center">
                  <i className="fas fa-tag tw-text-gray-500"></i>
                </div>
                <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                  Auth Tag:
                </div>
                <div className="tw-flex-1 tw-font-mono">
                  {useMasterTag
                    ? `${userMasterTag} (Master)`
                    : tagBeingUsed || vehicleReg || "None"}
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-mb-2">
                <div className="tw-flex tw-items-center tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center">
                    <i className="fas fa-gas-pump tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                    Pump:
                  </div>
                  <div className="tw-flex-1">{selectedPump?.name}</div>
                </div>

                <div className="tw-flex tw-items-center tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center">
                    <i className="fas fa-filter tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                    Nozzle:
                  </div>
                  <div className="tw-flex-1 ">{selectedNozzle?.name}</div>
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-mb-2">
                <div className="tw-flex tw-items-center tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center">
                    <i className="fas fa-oil-can tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                    Fuel:
                  </div>
                  <div className="tw-flex-1">
                    {selectedNozzle?.fuelType || "N/A"}
                  </div>
                </div>

                <div className="tw-flex tw-items-center tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center">
                    <i className="fas fa-car tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                    Vehicle:
                  </div>
                  <div className="tw-flex-1">{vehicleReg || "N/A"}</div>
                </div>
              </div>

              {vehicleDetails && (
                <div className="tw-flex tw-items-center tw-mb-1">
                  <div className="tw-flex tw-items-center tw-w-1/2">
                    <div className="tw-w-6 tw-flex tw-justify-center">
                      <i className="fas fa-calendar-day tw-text-gray-500"></i>
                    </div>
                    <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                      Daily:
                    </div>
                    <div className="tw-flex-1">
                      {vehicleDetails.dailyUsed || 0}L /{" "}
                      {vehicleDetails.dailyLimit || "N/A"}L
                    </div>
                  </div>

                  <div className="tw-flex tw-items-center tw-w-1/2">
                    <div className="tw-w-6 tw-flex tw-justify-center">
                      <i className="fas fa-calendar-week tw-text-gray-500"></i>
                    </div>
                    <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                      Monthly:
                    </div>
                    <div className="tw-flex-1">
                      {vehicleDetails.monthlyUsed || 0}L /{" "}
                      {vehicleDetails.monthlyLimit || "N/A"}L
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="dx-field tw-mt-4">
            {isPumpNozzleBusy ? (
              <div className="already-fueling-message tw-text-center tw-p-3 tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-text-yellow-800 tw-rounded">
                <i className="fas fa-exclamation-triangle tw-mr-2"></i>
                <span>
                  This pump and nozzle combination is currently busy (fueling or
                  completing). Please select another or wait.
                </span>
              </div>
            ) : (
              <Button
                text={
                  isAuthorizing ? "Authorizing..." : "Authorize & Start Fueling"
                }
                type="success"
                stylingMode="contained"
                width="100%"
                height={50}
                onClick={() => {
                  if (canAuthorize) {
                    startFueling();
                  } else if (
                    selectedType === "Volume" &&
                    volume > effectiveVolumeLimit
                  ) {
                    notify("Volume exceeds allowed limit.", "error", 3000);
                  } else {
                    notify(
                      "Please select type and enter a valid value.",
                      "error",
                      2000
                    );
                  }
                }}
                disabled={isAuthorizing || !canAuthorize}
                icon={isAuthorizing ? "fas fa-spinner fa-spin" : "fas fa-play"}
              />
            )}
          </div>
        </div>
        <Button
          text="Back"
          type="normal"
          icon="fas fa-chevron-left"
          stylingMode="outlined"
          onClick={() => {
            setStep("scan");
          }}
          className="tw-mt-3"
          width="100%"
        />
      </div>
    );
  },
};

export default FuelingProcessRenderer;
