import React, { memo, useMemo } from "react";
import { SelectBox } from "devextreme-react/select-box";
import { TextArea } from "devextreme-react/text-area";
import { Button } from "devextreme-react/button";

/**
 * TankTransferStep - Step 4b: Tank Transfer Configuration
 * Displayed in transfer operation mode after nozzle selection
 * Allows selection of destination tank and optional transfer reason
 */
const TankTransferStep = memo(
  ({
    selectedNozzle,
    sourceTank,
    availableTanks,
    selectedTankId,
    setSelectedTankId,
    transferReason,
    setTransferReason,
    ptsDevice,
    onNext,
    onBack,
  }) => {
    // DEBUG: Log props received
    console.log("[TankTransferStep] Props received:", {
      sourceTank,
      availableTanks,
      availableTanksCount: availableTanks?.length || 0,
      selectedTankId,
    });

    // Filter available tanks to exclude ONLY the source tank (selected in header)
    const destinationTanks = useMemo(() => {
      if (!availableTanks || availableTanks.length === 0) {
        console.log("[TankTransferStep] No available tanks");
        return [];
      }

      // If source tank not loaded yet, show all tanks
      if (!sourceTank) {
        console.log("[TankTransferStep] Source tank not loaded yet, showing all tanks:", availableTanks.length);
        return availableTanks;
      }

      // Filter out ONLY the source tank
      const filtered = availableTanks.filter((tank) => tank.id !== sourceTank.id);
      console.log("[TankTransferStep] Filtered tanks (excluding source tank ID:", sourceTank.id, "):", filtered.length, "of", availableTanks.length);
      return filtered;
    }, [availableTanks, sourceTank]);

    // Selected destination tank details
    const destinationTank = useMemo(() => {
      if (!selectedTankId || !destinationTanks.length) return null;
      return destinationTanks.find((tank) => tank.id === selectedTankId);
    }, [selectedTankId, destinationTanks]);

    const canContinue = selectedTankId && destinationTanks.length > 0;

    // Tank capacity warning
    const capacityWarning = useMemo(() => {
      if (!destinationTank) return null;

      const currentStock = destinationTank.currentStock || 0;
      const capacity = destinationTank.capacity || 0;
      const fillingPercentage = capacity > 0 ? (currentStock / capacity) * 100 : 0;

      if (fillingPercentage >= 95) {
        return "Destination tank is nearly full";
      } else if (fillingPercentage >= 85) {
        return "Destination tank is over 85% full";
      }
      return null;
    }, [destinationTank]);

    return (
      <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
        <h3 className="tw-flex-shrink-0 tw-mb-4">
          <i className="fa-light fa-exchange tw-mr-2"></i>Tank Transfer Setup
        </h3>

        <div className="tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw--mr-2">
          {/* Source Tank (Read-Only) */}
          {sourceTank && (
            <div className="tw-mb-6">
              <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center tw-mb-3">
                  <div className="tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-blue-500 tw-mr-3">
                    <i className="fa-light fa-arrow-up-from-bracket tw-text-white tw-text-xl"></i>
                  </div>
                  <div>
                    <h5 className="tw-font-semibold tw-text-blue-900 tw-mb-0">
                      Source Tank
                    </h5>
                    <p className="tw-text-sm tw-text-blue-600 tw-mb-0">
                      Fuel will be transferred FROM this tank
                    </p>
                  </div>
                </div>

                <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-blue-100">
                  <div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      Tank Name
                    </span>
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                      {sourceTank.name}
                    </p>
                  </div>
                  <div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      Fuel Grade
                    </span>
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                      {sourceTank.fuelGrade}
                    </p>
                  </div>
                  <div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      Current Stock
                    </span>
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                      {sourceTank.currentStock?.toLocaleString() || 0} L
                    </p>
                  </div>
                  <div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      Capacity
                    </span>
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                      {sourceTank.capacity?.toLocaleString() || 0} L
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Destination Tank Selection */}
          <div className="tw-mb-6">
            <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-center tw-mb-3">
                <div className="tw-h-10 tw-w-10 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-green-500 tw-mr-3">
                  <i className="fa-light fa-arrow-down-to-bracket tw-text-white tw-text-xl"></i>
                </div>
                <div className="tw-flex-1">
                  <h5 className="tw-font-semibold tw-text-green-900 tw-mb-0">
                    Destination Tank
                  </h5>
                  <p className="tw-text-sm tw-text-green-600 tw-mb-0">
                    Select where the fuel will be transferred TO
                  </p>
                </div>
              </div>

              <div className="tw-mb-3">
                <SelectBox
                  dataSource={destinationTanks}
                  displayExpr={(tank) =>
                    tank
                      ? `${tank.name} (${tank.currentStock?.toLocaleString() || 0}L / ${tank.capacity?.toLocaleString() || 0}L)`
                      : ""
                  }
                  valueExpr="id"
                  value={selectedTankId}
                  onValueChanged={(e) => setSelectedTankId(e.value)}
                  placeholder="Select destination tank..."
                  disabled={false}
                  searchEnabled={true}
                  showClearButton={true}
                  stylingMode="outlined"
                  itemRender={(tank) => (
                    <div className="tw-flex tw-items-center tw-justify-between tw-py-1">
                      <div className="tw-flex-1">
                        <div className="tw-font-semibold tw-text-gray-800">
                          {tank.name}
                        </div>
                        <div className="tw-text-xs tw-text-gray-500">
                          {tank.fuelGrade}
                        </div>
                      </div>
                      <div className="tw-text-right tw-ml-3">
                        <div className="tw-text-sm tw-font-semibold tw-text-gray-700">
                          {tank.currentStock?.toLocaleString() || 0}L
                        </div>
                        <div className="tw-text-xs tw-text-gray-500">
                          of {tank.capacity?.toLocaleString() || 0}L
                        </div>
                      </div>
                    </div>
                  )}
                />
              </div>

              {/* Destination Tank Details */}
              {destinationTank && (
                <div className="tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-green-100">
                  <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <div>
                      <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                        Tank Name
                      </span>
                      <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                        {destinationTank.name}
                      </p>
                    </div>
                    <div>
                      <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                        Fuel Grade
                      </span>
                      <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                        {destinationTank.fuelGrade}
                      </p>
                    </div>
                    <div>
                      <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                        Current Stock
                      </span>
                      <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                        {destinationTank.currentStock?.toLocaleString() || 0} L
                      </p>
                    </div>
                    <div>
                      <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                        Available Space
                      </span>
                      <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                        {(
                          (destinationTank.capacity || 0) -
                          (destinationTank.currentStock || 0)
                        ).toLocaleString()}{" "}
                        L
                      </p>
                    </div>
                  </div>

                  {/* Capacity Warning */}
                  {capacityWarning && (
                    <div className="tw-mt-3 tw-flex tw-items-center tw-p-2 tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-md">
                      <i className="fa-light fa-exclamation-triangle tw-text-orange-500 tw-mr-2"></i>
                      <span className="tw-text-xs tw-text-orange-700 tw-font-medium">
                        {capacityWarning}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Transfer Reason (Optional) */}
          <div className="tw-mb-4">
            <label className="tw-block tw-mb-2 tw-text-sm tw-font-semibold tw-text-gray-700">
              Transfer Reason (Optional)
            </label>
            <TextArea
              value={transferReason}
              onValueChanged={(e) => setTransferReason(e.value)}
              placeholder="Enter reason for transfer (e.g., Stock balancing, Emergency transfer)..."
              height={80}
              maxLength={500}
              stylingMode="outlined"
            />
            <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
              {transferReason?.length || 0} / 500 characters
            </div>
          </div>

          {/* Info Box */}
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-start">
              <i className="fa-light fa-info-circle tw-text-blue-500 tw-text-xl tw-mr-3 tw-mt-1"></i>
              <div>
                <p className="tw-text-sm tw-text-blue-700 tw-font-medium tw-mb-2">
                  Transfer Information
                </p>
                <ul className="tw-text-sm tw-text-blue-600 tw-space-y-1 tw-mb-0 tw-pl-4">
                  <li>Source tank is selected in the header (stored in localStorage)</li>
                  <li>Destination can be ANY tank in the system (cross-site transfers allowed)</li>
                  <li>Examples: ST (Stationary Tank) → FT (Fuel Tanker) across sites</li>
                  <li>Physical transfer will be performed using the pump</li>
                  <li>Volume will be specified in the next step</li>
                </ul>
              </div>
            </div>
          </div>
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
            disabled={!canContinue}
          />
        </div>
      </div>
    );
  }
);

TankTransferStep.displayName = "TankTransferStep";

export default TankTransferStep;
