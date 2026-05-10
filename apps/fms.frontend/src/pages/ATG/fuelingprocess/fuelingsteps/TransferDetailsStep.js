import React, { memo, useMemo, useState } from "react";
import { NumberBox } from "devextreme-react/number-box";
import { Button } from "devextreme-react/button";
import notify from "devextreme/ui/notify";

/**
 * TransferDetailsStep - Step 5b: Transfer Volume Input and Authorization
 * Displayed in transfer operation mode after tank selection
 * Shows transfer summary, volume input, and authorization button
 */
const TransferDetailsStep = memo(
  ({
    selectedPump,
    selectedNozzle,
    sourceTank,
    destinationTank,
    transferVolume,
    setTransferVolume,
    transferReason,
    activeFuelingProcesses,
    isAuthorizing,
    isAuthorized,
    startTransfer,
    onBack,
  }) => {
    const [volumeError, setVolumeError] = useState("");

    // Check if pump/nozzle is busy
    const isPumpNozzleBusy =
      selectedPump &&
      selectedNozzle &&
      activeFuelingProcesses.some(
        (p) =>
          p.pumpId === selectedPump.id &&
          p.nozzleId === selectedNozzle.id &&
          (p.status === "fueling" || p.status === "endOfTransaction")
      );

    // Calculate max transfer volume
    const maxTransferVolume = useMemo(() => {
      if (!sourceTank || !destinationTank) return 0;

      const sourceStock = sourceTank.currentStock || 0;
      const destCapacity = destinationTank.capacity || 0;
      const destStock = destinationTank.currentStock || 0;
      const destAvailableSpace = destCapacity - destStock;

      // Max transfer is limited by source stock and destination available space
      return Math.min(sourceStock, destAvailableSpace);
    }, [sourceTank, destinationTank]);

    // Volume validation
    const isVolumeValid = useMemo(() => {
      if (!transferVolume || transferVolume <= 0) {
        return false;
      }

      if (transferVolume > maxTransferVolume) {
        setVolumeError(
          `Volume exceeds maximum transferable amount (${maxTransferVolume.toLocaleString()} L)`
        );
        return false;
      }

      if (transferVolume > (sourceTank?.currentStock || 0)) {
        setVolumeError("Volume exceeds source tank stock");
        return false;
      }

      const destAvailableSpace =
        (destinationTank?.capacity || 0) - (destinationTank?.currentStock || 0);
      if (transferVolume > destAvailableSpace) {
        setVolumeError("Volume exceeds destination tank available space");
        return false;
      }

      setVolumeError("");
      return true;
    }, [transferVolume, maxTransferVolume, sourceTank, destinationTank]);

    const canAuthorize = isVolumeValid && !isPumpNozzleBusy && !isAuthorizing;

    // Handle authorization
    const handleAuthorize = async () => {
      if (!canAuthorize) {
        notify("Please enter a valid transfer volume", "warning", 2000);
        return;
      }

      if (!sourceTank || !destinationTank) {
        notify("Missing tank information", "error", 2000);
        return;
      }

      try {
        await startTransfer({
          sourceTankId: sourceTank.id,
          destinationTankId: destinationTank.id,
          volume: transferVolume,
          reason: transferReason,
        });
      } catch (error) {
        console.error("[TransferDetailsStep] Authorization error:", error);
        notify(error.message || "Failed to authorize transfer", "error", 3000);
      }
    };

    // Fuel compatibility check
    const fuelGradeMatch =
      sourceTank?.fuelGrade === destinationTank?.fuelGrade;

    return (
      <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
        <h3 className="tw-flex-shrink-0 tw-mb-4">
          <i className="fa-light fa-check-circle tw-mr-2"></i>Transfer
          Authorization
        </h3>

        <div className="tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw--mr-2">
          {/* Transfer Summary */}
          <div className="tw-mb-6">
            <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-to-green-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
              <h5 className="tw-font-semibold tw-text-gray-800 tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-exchange tw-mr-2 tw-text-blue-600"></i>
                Transfer Summary
              </h5>

              {/* Transfer Flow Visual */}
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                {/* Source Tank */}
                <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-blue-200">
                  <div className="tw-flex tw-items-center tw-mb-2">
                    <div className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-blue-500 tw-mr-2">
                      <i className="fa-light fa-arrow-up-from-bracket tw-text-white tw-text-sm"></i>
                    </div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      From
                    </span>
                  </div>
                  <p className="tw-font-semibold tw-text-gray-800 tw-mb-1">
                    {sourceTank?.name || "N/A"}
                  </p>
                  <p className="tw-text-xs tw-text-gray-600 tw-mb-1">
                    {sourceTank?.fuelGrade || "N/A"}
                  </p>
                  <p className="tw-text-sm tw-font-semibold tw-text-blue-600">
                    {sourceTank?.currentStock?.toLocaleString() || 0} L
                  </p>
                </div>

                {/* Arrow */}
                <div className="tw-px-4">
                  <i className="fa-light fa-arrow-right tw-text-3xl tw-text-gray-400"></i>
                </div>

                {/* Destination Tank */}
                <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-green-200">
                  <div className="tw-flex tw-items-center tw-mb-2">
                    <div className="tw-h-8 tw-w-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-green-500 tw-mr-2">
                      <i className="fa-light fa-arrow-down-to-bracket tw-text-white tw-text-sm"></i>
                    </div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      To
                    </span>
                  </div>
                  <p className="tw-font-semibold tw-text-gray-800 tw-mb-1">
                    {destinationTank?.name || "N/A"}
                  </p>
                  <p className="tw-text-xs tw-text-gray-600 tw-mb-1">
                    {destinationTank?.fuelGrade || "N/A"}
                  </p>
                  <p className="tw-text-sm tw-font-semibold tw-text-green-600">
                    {destinationTank?.currentStock?.toLocaleString() || 0} L
                  </p>
                </div>
              </div>

              {/* Pump & Nozzle Info */}
              <div className="tw-bg-white tw-rounded-lg tw-p-3 tw-border tw-border-gray-200">
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                  <div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      Pump
                    </span>
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                      Pump {selectedPump?.id || "N/A"}
                    </p>
                  </div>
                  <div>
                    <span className="tw-text-xs tw-text-gray-500 tw-uppercase tw-font-semibold">
                      Nozzle
                    </span>
                    <p className="tw-text-sm tw-font-semibold tw-text-gray-800 tw-mb-0">
                      Nozzle {selectedNozzle?.id || "N/A"}
                    </p>
                  </div>
                </div>
              </div>

              {/* Fuel Grade Compatibility Warning */}
              {!fuelGradeMatch && (
                <div className="tw-mt-3 tw-flex tw-items-center tw-p-2 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md">
                  <i className="fa-light fa-exclamation-circle tw-text-red-500 tw-mr-2"></i>
                  <span className="tw-text-xs tw-text-red-700 tw-font-medium">
                    Warning: Fuel grade mismatch detected!
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Volume Input */}
          <div className="tw-mb-6">
            <div className="tw-bg-white tw-border tw-border-gray-300 tw-rounded-lg tw-p-4">
              <label className="tw-block tw-mb-3 tw-text-sm tw-font-semibold tw-text-gray-700">
                Transfer Volume (Liters){" "}
                <span className="tw-text-red-500">*</span>
              </label>

              <NumberBox
                value={transferVolume}
                onValueChanged={(e) => setTransferVolume(e.value)}
                placeholder="Enter volume to transfer..."
                min={1}
                max={maxTransferVolume}
                step={1}
                showSpinButtons={true}
                showClearButton={true}
                stylingMode="outlined"
                format="#,##0.## L"
                width="100%"
              />

              {/* Volume Info & Validation */}
              <div className="tw-mt-3 tw-space-y-2">
                <div className="tw-flex tw-items-center tw-justify-between tw-text-xs tw-text-gray-600">
                  <span>Max transferable volume:</span>
                  <span className="tw-font-semibold tw-text-blue-600">
                    {maxTransferVolume.toLocaleString()} L
                  </span>
                </div>

                {volumeError && (
                  <div className="tw-flex tw-items-center tw-p-2 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md">
                    <i className="fa-light fa-exclamation-circle tw-text-red-500 tw-mr-2"></i>
                    <span className="tw-text-xs tw-text-red-700 tw-font-medium">
                      {volumeError}
                    </span>
                  </div>
                )}

                {transferVolume > 0 && isVolumeValid && (
                  <div className="tw-flex tw-items-center tw-p-2 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-md">
                    <i className="fa-light fa-check-circle tw-text-green-500 tw-mr-2"></i>
                    <span className="tw-text-xs tw-text-green-700 tw-font-medium">
                      Volume is valid for transfer
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Transfer Reason Display */}
          {transferReason && (
            <div className="tw-mb-6">
              <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-3">
                <label className="tw-block tw-mb-1 tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase">
                  Transfer Reason
                </label>
                <p className="tw-text-sm tw-text-gray-700 tw-mb-0">
                  {transferReason}
                </p>
              </div>
            </div>
          )}

          {/* Pump Status Warning */}
          {isPumpNozzleBusy && (
            <div className="tw-mb-4">
              <div className="tw-flex tw-items-center tw-p-3 tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded-lg">
                <i className="fa-light fa-exclamation-triangle tw-text-orange-500 tw-text-xl tw-mr-3"></i>
                <div>
                  <p className="tw-text-sm tw-text-orange-700 tw-font-medium tw-mb-1">
                    Pump is currently busy
                  </p>
                  <p className="tw-text-xs tw-text-orange-600 tw-mb-0">
                    Wait for the current transaction to complete before
                    authorizing a new transfer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Authorization Success */}
          {isAuthorized && (
            <div className="tw-mb-4">
              <div className="tw-flex tw-items-center tw-p-3 tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg">
                <i className="fa-light fa-check-circle tw-text-green-500 tw-text-xl tw-mr-3"></i>
                <div>
                  <p className="tw-text-sm tw-text-green-700 tw-font-medium tw-mb-1">
                    Transfer Authorized Successfully
                  </p>
                  <p className="tw-text-xs tw-text-green-600 tw-mb-0">
                    Lift nozzle {selectedNozzle?.id} from pump{" "}
                    {selectedPump?.id} to begin transfer.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Info Box */}
          {!isAuthorized && (
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-start">
                <i className="fa-light fa-info-circle tw-text-blue-500 tw-text-xl tw-mr-3 tw-mt-1"></i>
                <div>
                  <p className="tw-text-sm tw-text-blue-700 tw-font-medium tw-mb-2">
                    Before Authorization
                  </p>
                  <ul className="tw-text-sm tw-text-blue-600 tw-space-y-1 tw-mb-0 tw-pl-4">
                    <li>Verify source and destination tanks are correct</li>
                    <li>Enter the volume to be transferred</li>
                    <li>Ensure pump and nozzle are idle</li>
                    <li>
                      Physical transfer will be tracked by the device
                    </li>
                  </ul>
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
            disabled={isAuthorizing}
          />

          {!isAuthorized && (
            <Button
              text={isAuthorizing ? "Authorizing..." : "Authorize Transfer"}
              type="success"
              icon={isAuthorizing ? "fa-light fa-spinner fa-spin" : "fa-light fa-check-circle"}
              stylingMode="contained"
              onClick={handleAuthorize}
              disabled={!canAuthorize}
            />
          )}
        </div>
      </div>
    );
  }
);

TransferDetailsStep.displayName = "TransferDetailsStep";

export default TransferDetailsStep;
