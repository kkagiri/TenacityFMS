/**
 * File: VehicleTripReconciliationSettingsTab.js
 * Purpose: Renders editable system-configuration controls for the vehicle trip reconciliation background job.
 * Dependencies: React, DevExtreme CheckBox and NumberBox.
 * Last Modified: 2026-03-14
 */
import React from "react";
import CheckBox from "devextreme-react/check-box";
import NumberBox from "devextreme-react/number-box";

const VehicleTripReconciliationSettingsTab = ({
  settings,
  canEditSettings,
  saving,
  onFieldChange,
}) => {
  const runTimeValue = typeof settings.reconciliationDailyRunTimeLocal === "string"
    ? settings.reconciliationDailyRunTimeLocal.slice(0, 5)
    : "00:30";

  return (
    <>
      <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-5 tw-space-y-4">
        <div>
          <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Scheduled reconciliation</h2>
          <p className="tw-mt-1 tw-text-sm tw-text-slate-600">
            Configure the hosted job that replays persisted trip groups after midnight and applies reconciliation to the selected local-day window.
          </p>
        </div>

        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-4">
          <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-space-y-2">
            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Service</div>
            <div className="tw-text-sm tw-font-semibold tw-text-slate-900">VehicleTripReconciliationBackgroundService</div>
            <div className="tw-text-sm tw-text-slate-600">Hosted service registered in the web application background worker pipeline.</div>
          </div>

          <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-space-y-2">
            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Configuration keys</div>
            <div className="tw-text-sm tw-font-semibold tw-text-slate-900">VehicleTrips.Reconciliation.*</div>
            <div className="tw-text-sm tw-text-slate-600">Settings are stored in SystemConfiguration and applied without creating a separate configuration store.</div>
          </div>

          <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-space-y-2">
            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Processing scope</div>
            <div className="tw-text-sm tw-font-semibold tw-text-slate-900">Persisted trip groups only</div>
            <div className="tw-text-sm tw-text-slate-600">The worker gathers distinct vehicles with trip groups overlapping the configured local replay day.</div>
          </div>
        </div>
      </div>

      <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-5 tw-space-y-4">
        <div>
          <h3 className="tw-text-base tw-font-semibold tw-text-slate-900">Job controls</h3>
          <p className="tw-mt-1 tw-text-sm tw-text-slate-600">
            These values update the exact SystemConfiguration keys consumed by the background service at runtime.
          </p>
        </div>

        <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-space-y-4">
          <CheckBox
            text="Enable scheduled reconciliation background job"
            value={Boolean(settings.enableScheduledReconciliation)}
            onValueChanged={(event) => onFieldChange("enableScheduledReconciliation", Boolean(event.value))}
            disabled={!canEditSettings || saving}
          />

          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
            <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-space-y-2">
              <div className="tw-text-sm tw-font-semibold tw-text-slate-900">Daily run time (local)</div>
              <div className="tw-text-sm tw-text-slate-600">Stored in VehicleTrips.Reconciliation.DailyRunTimeLocal.</div>
              <input
                type="time"
                className="tw-w-full tw-rounded-lg tw-border tw-border-slate-300 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-slate-900 focus:tw-border-blue-500 focus:tw-outline-none focus:tw-ring-2 focus:tw-ring-blue-200 disabled:tw-bg-slate-100 disabled:tw-text-slate-500"
                value={runTimeValue}
                disabled={!canEditSettings || saving}
                onChange={(event) => onFieldChange("reconciliationDailyRunTimeLocal", event.target.value)}
              />
              <div className="tw-text-xs tw-text-slate-500">Default: {settings.defaultReconciliationDailyRunTimeLocal || "00:30"}</div>
            </div>

            <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-space-y-2">
              <div className="tw-text-sm tw-font-semibold tw-text-slate-900">Lookback days</div>
              <div className="tw-text-sm tw-text-slate-600">Stored in VehicleTrips.Reconciliation.LookbackDays.</div>
              <NumberBox
                value={settings.reconciliationLookbackDays}
                min={1}
                max={365}
                step={1}
                format="#0"
                showSpinButtons={true}
                width="100%"
                disabled={!canEditSettings || saving}
                onValueChanged={(event) => onFieldChange("reconciliationLookbackDays", event.value)}
              />
              <div className="tw-text-xs tw-text-slate-500">Default: {settings.defaultReconciliationLookbackDays ?? 1}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="tw-rounded-xl tw-border tw-border-sky-200 tw-bg-sky-50 tw-p-5 tw-space-y-3">
        <div className="tw-flex tw-items-start tw-gap-3">
          <div className="tw-flex tw-h-10 tw-w-10 tw-items-center tw-justify-center tw-rounded-full tw-bg-sky-100 tw-text-sky-700">
            <i className="fa-light fa-timer" />
          </div>
          <div className="tw-space-y-2">
            <h3 className="tw-text-base tw-font-semibold tw-text-sky-950">Effective schedule</h3>
            <p className="tw-text-sm tw-text-sky-900">
              {Boolean(settings.enableScheduledReconciliation) ? "Enabled" : "Disabled"} and scheduled for {runTimeValue || "00:30"} local with a {settings.reconciliationLookbackDays || 1}-day replay window.
            </p>
            <p className="tw-text-sm tw-text-sky-900">
              The worker uses the configured local time to calculate the next run and then reconciles persisted groups for the target local day.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default VehicleTripReconciliationSettingsTab;