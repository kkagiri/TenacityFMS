import React, { memo } from "react";
import { Button } from "devextreme-react/button";
import { NumberBox } from "devextreme-react/number-box";
import ProgressBar from "devextreme-react/progress-bar";
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
      selectedType !== "Volume" ||
      (volume > 0 &&
        (effectiveVolumeLimit === null || volume <= effectiveVolumeLimit));
    const isFullTankValid = selectedType === "FullTank";
    const canAuthorize =
      (isVolumeValid || isFullTankValid) && !isPumpNozzleBusy;

    return (
      <div className="dx-card responsive-paddings tw-flex tw-flex-col tw-max-h-screen">
        <h3 className="tw-flex-shrink-0 tw-mb-4">
          <i className="fas fa-check-circle tw-mr-2"></i>Fueling Authorization
        </h3>
        <div className="dx-fieldset tw-flex-1 tw-overflow-y-auto tw-overflow-x-hidden tw-pr-2 tw--mr-2">
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

              {displayDetails && (
                <div className="tw-flex tw-items-center tw-mb-1">
                  <div className="tw-flex tw-items-center tw-w-1/2">
                    <div className="tw-w-6 tw-flex tw-justify-center">
                      <i className="fas fa-calendar-day tw-text-gray-500"></i>
                    </div>
                    <div className="tw-w-[80px] tw-font-medium tw-text-gray-600">
                      Daily:
                    </div>
                    <div className="tw-flex-1">
                      {displayDetails.dailyUsed || 0}L /{" "}
                      {displayDetails.dailyLimit || "N/A"}L
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
                      {displayDetails.monthlyUsed || 0}L /{" "}
                      {displayDetails.monthlyLimit || "N/A"}L
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
        <div className="tw-flex-shrink-0 tw-mt-3">
          <Button
            text="Back"
            type="normal"
            icon="fas fa-chevron-left"
            stylingMode="outlined"
            onClick={() => {
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
