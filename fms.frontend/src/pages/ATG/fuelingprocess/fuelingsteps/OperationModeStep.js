import React, { memo } from "react";
import { Button } from "devextreme-react/button";

/**
 * OperationModeStep - Step 3: Choose between Vehicle Fueling and Tank Transfer
 * Displayed after nozzle selection to determine the operation type
 */
const OperationModeStep = memo(({ operationMode, setOperationMode, onNext, onBack }) => {
  const operationModes = [
    {
      id: "vehicle",
      name: "Vehicle Fueling",
      icon: "fa-car",
      description: "Dispense fuel to a vehicle",
      color: "#007bff",
    },
    {
      id: "transfer",
      name: "Tank Transfer",
      icon: "fa-exchange",
      description: "Transfer fuel between storage tanks",
      color: "#28a745",
    },
  ];

  const selectedMode = operationModes.find((m) => m.id === operationMode);

  return (
    <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
      <h3 className="tw-flex-shrink-0 tw-mb-4">
        <i className="fa-light fa-list-radio tw-mr-2"></i>Select Operation Type
      </h3>

      <div className="tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6 tw-mb-6">
          {operationModes.map((mode) => {
            const isSelected = operationMode === mode.id;
            return (
              <div
                key={mode.id}
                className={`tw-border-2 tw-rounded-xl tw-p-6 tw-transition-all tw-duration-200 tw-cursor-pointer tw-min-h-[180px] ${
                  isSelected
                    ? "tw-border-blue-500 tw-bg-blue-50 tw-shadow-lg tw-scale-105"
                    : "tw-border-gray-300 tw-bg-white hover:tw-border-gray-400 hover:tw-shadow-md"
                }`}
                onClick={() => setOperationMode(mode.id)}
              >
                <div className="tw-flex tw-flex-col tw-h-full">
                  {/* Icon and Title */}
                  <div className="tw-flex tw-items-center tw-mb-4">
                    <div
                      className={`tw-h-14 tw-w-14 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-mr-4 ${
                        isSelected ? "tw-bg-blue-500" : "tw-bg-gray-200"
                      }`}
                    >
                      <i
                        className={`fa-light ${mode.icon} tw-text-2xl ${
                          isSelected ? "tw-text-white" : "tw-text-gray-600"
                        }`}
                      ></i>
                    </div>
                    <div>
                      <h4
                        className={`tw-font-semibold tw-text-lg tw-mb-1 ${
                          isSelected ? "tw-text-blue-700" : "tw-text-gray-800"
                        }`}
                      >
                        {mode.name}
                      </h4>
                    </div>
                  </div>

                  {/* Description */}
                  <p
                    className={`tw-text-sm tw-flex-1 ${
                      isSelected ? "tw-text-blue-600" : "tw-text-gray-600"
                    }`}
                  >
                    {mode.description}
                  </p>

                  {/* Selection Indicator */}
                  {isSelected && (
                    <div className="tw-flex tw-items-center tw-mt-3 tw-text-blue-600">
                      <i className="fa-light fa-check-circle tw-mr-2"></i>
                      <span className="tw-text-sm tw-font-medium">Selected</span>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Info Box */}
        {selectedMode && (
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-4">
            <div className="tw-flex tw-items-start">
              <i className="fa-light fa-info-circle tw-text-blue-500 tw-text-xl tw-mr-3 tw-mt-1"></i>
              <div>
                <p className="tw-text-sm tw-text-blue-700 tw-font-medium tw-mb-2">
                  {selectedMode.id === "vehicle"
                    ? "Vehicle Fueling Mode"
                    : "Tank Transfer Mode"}
                </p>
                <p className="tw-text-sm tw-text-blue-600">
                  {selectedMode.id === "vehicle"
                    ? "You'll scan a vehicle tag or manually select a vehicle, then authorize fueling with volume limits."
                    : "You'll select source and destination tanks, then authorize the transfer volume. No vehicle required."}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-between tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200 tw-flex-shrink-0">
        <Button
          text="Back"
          type="normal"
          icon="fa-light fa-chevron-left"
          stylingMode="outlined"
          onClick={onBack}
        />
        <Button
          text="Continue"
          type="default"
          icon="fa-light fa-chevron-right"
          stylingMode="contained"
          onClick={onNext}
          disabled={!operationMode}
        />
      </div>
    </div>
  );
});

OperationModeStep.displayName = "OperationModeStep";

export default OperationModeStep;
