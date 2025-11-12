import React, { memo } from "react";
import { Button } from "devextreme-react/button";
import { NumberBox } from "devextreme-react/number-box";
import notify from "devextreme/ui/notify";

//Cursor: Memoized FuelingDetailsStep component
const FuelingDetailsStep = memo(
  ({
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
    displayDetails,
    isAuthorizing,
    isAuthorized,
    currentTransactionId,
    startFueling,
    setStep,
    useMasterTag,
    userMasterTag,
    vehicleInfo,
    scanResult,
  }) => {
    const isPumpNozzleBusy =
      selectedPump &&
      selectedNozzle &&
      activeFuelingProcesses.some(
        (p) =>
          p.pumpId === selectedPump.id &&
          p.nozzleId === selectedNozzle.id &&
          (p.status === "fueling" || p.status === "endOfTransaction")
      );

    const tagBeingUsed = useMasterTag ? userMasterTag : displayDetails?.tagId;

    const currentFuelingLimit = useMasterTag
      ? null
      : displayDetails?.fuelingLimit;

    const dailyLimit = displayDetails?.dailyLimit;
    const dailyUsed = displayDetails?.dailyUsed;
    const dailyRemaining =
      dailyLimit !== null &&
      dailyLimit !== undefined &&
      dailyUsed !== null &&
      dailyUsed !== undefined
        ? Math.max(0, dailyLimit - dailyUsed)
        : null;

    const monthlyLimit = displayDetails?.monthlyLimit;
    const monthlyUsed = displayDetails?.monthlyUsed;
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
      selectedType === "Volume" &&
      volume > 0 &&
      (effectiveVolumeLimit === null || volume <= effectiveVolumeLimit);
    const isFullTankValid = selectedType === "FullTank";
    const isTypeSelected = selectedType !== null && selectedType !== undefined;
    const canAuthorize =
      isTypeSelected && (isVolumeValid || isFullTankValid) && !isPumpNozzleBusy;

    return (
      <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
        <h3 className="tw-flex-shrink-0 tw-mb-4">
          <i className="fa-light fa-check-circle tw-mr-2"></i>Fueling Authorization
        </h3>
        <div className="dx-fieldset tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw--mr-2">
          {/* Authorization Type Section */}
          <div className="tw-mb-4">
            <div className="tw-font-semibold tw-mb-3 tw-text-center">
              Authorization Type <span className="tw-text-red-500">*</span>
            </div>
            <div className="auth-type-buttons tw-flex tw-justify-center tw-gap-4">
              <button
                className={`auth-type-btn tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-rounded-lg tw-border tw-w-1/2 tw-transition-all ${
                  selectedType === "Volume"
                    ? "tw-bg-blue-50 tw-border-blue-400 tw-text-blue-700 tw-shadow-md"
                    : "tw-bg-gray-50 tw-border-gray-200 tw-text-gray-700 hover:tw-border-blue-300 hover:tw-bg-blue-50"
                }`}
                onClick={() => {
                  setSelectedType("Volume");
                  setAmount("");
                }}
              >
                <i className="fa-light fa-fill-drip tw-text-3xl tw-mb-2"></i>
                <span className="tw-font-medium">By Volume</span>
              </button>
              <button
                className={`auth-type-btn tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-4 tw-rounded-lg tw-border tw-w-1/2 tw-transition-all ${
                  selectedType === "FullTank"
                    ? "tw-bg-green-50 tw-border-green-400 tw-text-green-700 tw-shadow-md"
                    : "tw-bg-gray-50 tw-border-gray-200 tw-text-gray-700 hover:tw-border-green-300 hover:tw-bg-green-50"
                }`}
                onClick={() => {
                  setSelectedType("FullTank");
                  setAmount("");
                  setVolume("");
                }}
              >
                <i className="fa-light fa-gas-pump tw-text-3xl tw-mb-2"></i>
                <span className="tw-font-medium">Full Tank</span>
              </button>
            </div>
            {!isTypeSelected && (
              <small className="tw-text-orange-600 tw-block tw-mt-2 tw-text-center">
                <i className="fa-light fa-info-circle tw-mr-1"></i>
                Please select an authorization type to continue
              </small>
            )}
          </div>

          <div className="authorization-inputs tw-mb-4">
            {selectedType === "Volume" && (
              <div className="tw-mb-4">
                <div className="tw-font-semibold tw-mb-3 tw-text-center sm:tw-text-left">Volume (L)</div>
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
            )}

            {selectedType === "FullTank" && (
              <div className="full-tank-message tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded">
                <div className="full-tank-info tw-flex tw-items-start">
                  <i className="fa-light fa-info-circle tw-text-blue-500 tw-mr-2 tw-mt-1"></i>
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
            <h4 className="tw-text-sm sm:tw-text-base tw-font-medium tw-mb-3">
              <i className="fa-light fa-clipboard-list tw-mr-2"></i> Authorization
              Summary
            </h4>

            <div className="summary-table tw-w-full tw-text-xs sm:tw-text-sm">
              <div className="tw-flex tw-items-center tw-mb-2">
                <div className="tw-w-6 tw-flex tw-justify-center tw-flex-shrink-0">
                  <i className="fa-light fa-tag tw-text-gray-500"></i>
                </div>
                <div className="tw-w-[60px] sm:tw-w-[80px] tw-font-medium tw-text-gray-600 tw-flex-shrink-0">
                  Auth Tag:
                </div>
                <div className="tw-flex-1 tw-font-mono tw-truncate">
                  {useMasterTag
                    ? `${userMasterTag} (Master)`
                    : tagBeingUsed || vehicleReg || "None"}
                </div>
              </div>

              <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-mb-2 tw-gap-2 sm:tw-gap-0">
                <div className="tw-flex tw-items-center tw-w-full sm:tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center tw-flex-shrink-0">
                    <i className="fa-light fa-gas-pump tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[60px] sm:tw-w-[80px] tw-font-medium tw-text-gray-600 tw-flex-shrink-0">
                    Pump:
                  </div>
                  <div className="tw-flex-1">{selectedPump?.name}</div>
                </div>

                <div className="tw-flex tw-items-center tw-w-full sm:tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center tw-flex-shrink-0">
                    <i className="fa-light fa-filter tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[60px] sm:tw-w-[80px] tw-font-medium tw-text-gray-600 tw-flex-shrink-0">
                    Nozzle:
                  </div>
                  <div className="tw-flex-1">{selectedNozzle?.name}</div>
                </div>
              </div>

              <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-mb-2 tw-gap-2 sm:tw-gap-0">
                <div className="tw-flex tw-items-center tw-w-full sm:tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center tw-flex-shrink-0">
                    <i className="fa-light fa-oil-can tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[60px] sm:tw-w-[80px] tw-font-medium tw-text-gray-600 tw-flex-shrink-0">
                    Fuel:
                  </div>
                  <div className="tw-flex-1">
                    {selectedNozzle?.fuelType || "N/A"}
                  </div>
                </div>

                <div className="tw-flex tw-items-center tw-w-full sm:tw-w-1/2">
                  <div className="tw-w-6 tw-flex tw-justify-center tw-flex-shrink-0">
                    <i className="fa-light fa-car tw-text-gray-500"></i>
                  </div>
                  <div className="tw-w-[60px] sm:tw-w-[80px] tw-font-medium tw-text-gray-600 tw-flex-shrink-0">
                    Vehicle:
                  </div>
                  <div className="tw-flex-1 tw-truncate">{vehicleReg || "N/A"}</div>
                </div>
              </div>

              {displayDetails && (
                <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-mb-1 tw-gap-2 sm:tw-gap-0">
                  <div className="tw-flex tw-items-center tw-w-full sm:tw-w-1/2">
                    <div className="tw-w-6 tw-flex tw-justify-center tw-flex-shrink-0">
                      <i className="fa-light fa-calendar-day tw-text-gray-500"></i>
                    </div>
                    <div className="tw-w-[60px] sm:tw-w-[80px] tw-font-medium tw-text-gray-600 tw-flex-shrink-0">
                      Daily:
                    </div>
                    <div className="tw-flex-1">
                      {displayDetails.dailyUsed || 0}L /{" "}
                      {displayDetails.dailyLimit || "N/A"}L
                    </div>
                  </div>

                  <div className="tw-flex tw-items-center tw-w-full sm:tw-w-1/2">
                    <div className="tw-w-6 tw-flex tw-justify-center tw-flex-shrink-0">
                      <i className="fa-light fa-calendar-week tw-text-gray-500"></i>
                    </div>
                    <div className="tw-w-[60px] sm:tw-w-[80px] tw-font-medium tw-text-gray-600 tw-flex-shrink-0">
                      Monthly:
                    </div>
                    <div className="tw-flex-1">
                      {displayDetails.monthlyUsed || 0}L /{" "}
                      {displayDetails.monthlyLimit || "N/A"}L
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Authorization Success - Ready to Fuel State */}
          {isAuthorized && currentTransactionId && (
            <div className="authorization-success tw-mb-4 tw-p-4 tw-bg-green-50 tw-border-2 tw-border-green-400 tw-rounded-lg tw-animate-pulse">
              <div className="tw-flex tw-items-center tw-mb-3">
                <i className="fa-light fa-check-circle tw-text-green-600 tw-text-3xl tw-mr-3"></i>
                <div>
                  <h4 className="tw-text-lg tw-font-bold tw-text-green-800 tw-mb-1">
                    Authorization Successful!
                  </h4>
                  <p className="tw-text-sm tw-text-green-700">
                    Transaction ID: <span className="tw-font-mono tw-font-semibold">{currentTransactionId}</span>
                  </p>
                </div>
              </div>

              <div className="tw-bg-white tw-border tw-border-green-300 tw-rounded-lg tw-p-3 tw-mb-3">
                <h5 className="tw-font-semibold tw-text-green-800 tw-mb-2 tw-flex tw-items-center">
                  <i className="fa-light fa-info-circle tw-mr-2"></i>
                  Ready to Start Fueling
                </h5>
                <ol className="tw-list-decimal tw-list-inside tw-space-y-2 tw-text-sm tw-text-gray-700">
                  <li className="tw-flex tw-items-start">
                    <span className="tw-mr-2">1.</span>
                    <span className="tw-flex-1">
                      <strong>Lift Nozzle {selectedNozzle?.id || selectedNozzle?.name}</strong> from Pump {selectedPump?.id || selectedPump?.name}
                    </span>
                  </li>
                  <li className="tw-flex tw-items-start">
                    <span className="tw-mr-2">2.</span>
                    <span className="tw-flex-1">
                      <strong>Insert nozzle</strong> into vehicle fuel tank
                    </span>
                  </li>
                  <li className="tw-flex tw-items-start">
                    <span className="tw-mr-2">3.</span>
                    <span className="tw-flex-1">
                      <strong>Pull trigger</strong> to start fuel flow - counter will begin automatically
                    </span>
                  </li>
                  <li className="tw-flex tw-items-start">
                    <span className="tw-mr-2">4.</span>
                    <span className="tw-flex-1">
                      <strong>Monitor progress</strong> on screen - transaction will complete when nozzle clicks off or you release trigger
                    </span>
                  </li>
                </ol>
              </div>

              <div className="tw-flex tw-items-center tw-justify-center tw-text-xs tw-text-green-600 tw-italic">
                <i className="fa-light fa-hourglass-half tw-mr-2 tw-animate-spin"></i>
                Waiting for physical fueling to begin...
              </div>
            </div>
          )}

          <div className="dx-field tw-mt-4">
            {isPumpNozzleBusy ? (
              <div className="already-fueling-message tw-text-center tw-p-3 tw-bg-yellow-50 tw-border tw-border-yellow-200 tw-text-yellow-800 tw-rounded">
                <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                <span>
                  This pump and nozzle combination is currently busy (fueling or
                  completing). Please select another or wait.
                </span>
              </div>
            ) : isAuthorized ? (
              <div className="authorization-pending tw-text-center tw-p-3 tw-bg-blue-50 tw-border-2 tw-border-blue-400 tw-text-blue-800 tw-rounded">
                <i className="fa-light fa-pump-medical tw-mr-2 tw-text-2xl"></i>
                <div className="tw-font-semibold tw-text-lg">Pump Authorized - Waiting for Fueling</div>
                <div className="tw-text-sm tw-mt-2">
                  Lift the nozzle and pull the trigger to start. Transaction will appear automatically.
                </div>
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
                  if (!isTypeSelected) {
                    notify("Please select an authorization type first.", "warning", 2000);
                  } else if (canAuthorize) {
                    startFueling();
                  } else if (
                    selectedType === "Volume" &&
                    (!volume || volume <= 0)
                  ) {
                    notify("Please enter a valid volume amount.", "warning", 2000);
                  } else if (
                    selectedType === "Volume" &&
                    volume > effectiveVolumeLimit
                  ) {
                    notify("Volume exceeds allowed limit.", "error", 3000);
                  } else {
                    notify(
                      "Please complete the authorization details.",
                      "warning",
                      2000
                    );
                  }
                }}
                disabled={isAuthorizing || !canAuthorize}
                icon={isAuthorizing ? "fa-light fa-spinner fa-spin" : "fa-light fa-play"}
              />
            )}
          </div>
        </div>
        <div className="tw-flex-shrink-0 tw-mt-3">
          <Button
            text="Back"
            type="normal"
            icon="fa-light fa-chevron-left"
            stylingMode="outlined"
            onClick={() => {
              // Reset type selection when going back
              setSelectedType(null);
              setVolume("");
              setAmount("");
              setStep("scan");
            }}
            width="100%"
          />
        </div>
      </div>
    );
  }
);

export default FuelingDetailsStep;
