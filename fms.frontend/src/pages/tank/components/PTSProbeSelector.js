/**
 * File:          PTSProbeSelector.js
 * Purpose:       Probe selection and explicit PTS tank mapping with live-data
 *                vs device-config toggle, live probe data card, and auto-stock toggle.
 * Dependencies:  react, devextreme-react/select-box, M365SectionCard, M365InfoRow
 * Last Modified: 2026-03-24
 *
 * Props:
 * - availableProbes      (array):  Probes from live data or config
 * - selectedProbeNumber  (number): Currently selected probe number
 * - availableTanks       (array):  Tank configurations read from the PTS device
 * - selectedPtsTankId    (number): Currently selected PTS tank ID
 * - onProbeChange        (func):   (probeNumber) => void
 * - onPtsTankChange      (func):   (ptsTankId) => void
 * - showLiveData         (bool):   Current toggle state
 * - onToggleLiveData     (func):   Toggle live/config source for probes
 * - loadingConfig        (bool):   Config probes still loading
 * - configError          (string): Config probe fetch error
 * - onRetryConfig        (func):   Retry config probe fetch
 * - loadingTanks         (bool):   Tank configuration still loading
 * - tanksError           (string): Tank config fetch error
 * - onRetryTanks         (func):   Retry tank config fetch
 * - usePtsProbeReadings  (bool):   Auto-stock toggle
 * - onToggleAutoStock    (func):   Toggle auto-stock
 */
import React, { useMemo } from "react";
import { SelectBox } from "devextreme-react/select-box";
import M365SectionCard from "../../../components/m365/M365SectionCard";
import M365InfoRow from "../../../components/m365/M365InfoRow";

const fmtVol = (value) =>
    value == null
        ? "N/A"
        : `${Number(value).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`;

const fmtTemp = (value) => (value == null ? "N/A" : `${Number(value).toFixed(1)} °C`);

const PTSProbeSelector = ({
    availableProbes,
    selectedProbeNumber,
    availableTanks,
    selectedPtsTankId,
    onProbeChange,
    onPtsTankChange,
    showLiveData,
    onToggleLiveData,
    loadingConfig,
    configError,
    onRetryConfig,
    loadingTanks,
    tanksError,
    onRetryTanks,
    usePtsProbeReadings,
    onToggleAutoStock,
}) => {
    const selectedProbe = useMemo(
        () => availableProbes.find((probe) => probe.probeNumber === selectedProbeNumber),
        [availableProbes, selectedProbeNumber]
    );

    const selectedTank = useMemo(
        () => availableTanks.find((tank) => tank.id === selectedPtsTankId),
        [availableTanks, selectedPtsTankId]
    );

    return (
        <>
            <M365SectionCard title="Probe / Tank Channel" icon="fa-light fa-gauge">
                <div className="tw-space-y-3">
                    <div className="tw-flex tw-items-center tw-justify-between tw-py-1">
                        <div>
                            <span className="m365-field__label tw-mb-0">Data Source</span>
                            <p className="m365-field__hint">
                                {showLiveData ? "Live SignalR readings" : "Device configuration"}
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onToggleLiveData}
                            className={`m365-toggle ${showLiveData ? "m365-toggle--on" : ""}`}
                            title={showLiveData ? "Switch to device configuration" : "Switch to live data"}
                        >
                            <span className="m365-toggle__thumb" />
                        </button>
                    </div>

                    {!showLiveData && loadingConfig && (
                        <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
                            <i className="fa-light fa-spinner fa-spin tw-mr-2" style={{ color: "var(--m365-primary)" }} />
                            <span style={{ fontSize: 13, color: "var(--m365-text-secondary)" }}>
                                Loading probes from device…
                            </span>
                        </div>
                    )}

                    {!showLiveData && configError && (
                        <div
                            className="tw-rounded tw-p-3 tw-mb-2"
                            style={{
                                background: "var(--m365-danger-bg, #fef2f2)",
                                border: "1px solid var(--m365-danger, #d13438)",
                            }}
                        >
                            <p style={{ fontSize: 13, color: "var(--m365-danger)" }}>
                                <i className="fa-light fa-triangle-exclamation tw-mr-2" />
                                {configError}
                            </p>
                            <button className="m365-btn m365-btn--ghost tw-mt-2" onClick={onRetryConfig}>
                                Retry
                            </button>
                        </div>
                    )}

                    {(!loadingConfig || showLiveData) && !configError && (
                        <>
                            <label className="m365-field__label">Select Probe Channel</label>
                            <SelectBox
                                dataSource={availableProbes}
                                displayExpr={(item) => {
                                    if (!item) return "";

                                    const details = [`Probe ${item.probeNumber}`];
                                    if (item.source === "config" && item.port) {
                                        details.push(`Port ${item.port}`);
                                    }
                                    if (item.source === "config" && item.address) {
                                        details.push(`Addr ${item.address}`);
                                    }
                                    if (item.source !== "config" && item.productVolume != null) {
                                        details.push(fmtVol(item.productVolume));
                                    }

                                    return details.join(" • ");
                                }}
                                valueExpr="probeNumber"
                                value={selectedProbeNumber}
                                onValueChanged={(e) => onProbeChange(e.value || null)}
                                placeholder={
                                    availableProbes.length > 0
                                        ? "Select a probe"
                                        : showLiveData
                                            ? "Waiting for live probe data…"
                                            : "No probes configured"
                                }
                                disabled={availableProbes.length === 0}
                                height={34}
                                stylingMode="outlined"
                            />

                            {availableProbes.length === 0 && (
                                <p className="m365-field__hint">
                                    {showLiveData
                                        ? "Waiting for UploadStatus readings. Ensure the device is online."
                                        : "No probes were returned by the device configuration."}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </M365SectionCard>

            <M365SectionCard title="PTS Tank Mapping" icon="fa-light fa-oil-can-drip">
                <div className="tw-space-y-3">
                    {loadingTanks && (
                        <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
                            <i className="fa-light fa-spinner fa-spin tw-mr-2" style={{ color: "var(--m365-primary)" }} />
                            <span style={{ fontSize: 13, color: "var(--m365-text-secondary)" }}>
                                Loading tanks from device…
                            </span>
                        </div>
                    )}

                    {tanksError && !loadingTanks && (
                        <div
                            className="tw-rounded tw-p-3"
                            style={{
                                background: "var(--m365-danger-bg, #fef2f2)",
                                border: "1px solid var(--m365-danger, #d13438)",
                            }}
                        >
                            <p style={{ fontSize: 13, color: "var(--m365-danger)" }}>
                                <i className="fa-light fa-triangle-exclamation tw-mr-2" />
                                {tanksError}
                            </p>
                            <button className="m365-btn m365-btn--ghost tw-mt-2" onClick={onRetryTanks}>
                                Retry
                            </button>
                        </div>
                    )}

                    {!loadingTanks && !tanksError && (
                        <>
                            <label className="m365-field__label">Select PTS Tank</label>
                            <SelectBox
                                dataSource={availableTanks}
                                displayExpr={(item) => {
                                    if (!item) return "";

                                    const status = item.automaticCalibrationEnabled
                                        ? item.automaticCalibrationReadyForGeneration
                                            ? "Auto Cal Ready"
                                            : "Auto Cal Enabled"
                                        : "Auto Cal Disabled";

                                    return [
                                        `PTS Tank ${item.id}`,
                                        item.height != null ? `${item.height} mm` : null,
                                        item.fuelGradeId ? `Grade ${item.fuelGradeId}` : null,
                                        status,
                                    ]
                                        .filter(Boolean)
                                        .join(" • ");
                                }}
                                valueExpr="id"
                                value={selectedPtsTankId}
                                onValueChanged={(e) => onPtsTankChange(e.value || null)}
                                placeholder={availableTanks.length > 0 ? "Select a PTS tank" : "No PTS tanks configured"}
                                disabled={availableTanks.length === 0}
                                height={34}
                                stylingMode="outlined"
                            />

                            {availableTanks.length === 0 && (
                                <p className="m365-field__hint">
                                    No PTS tank configuration was returned by this device.
                                </p>
                            )}
                        </>
                    )}

                    {selectedTank && (
                        <div className="tw-rounded tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3">
                            <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                                <M365InfoRow label="PTS Tank" icon="fa-light fa-hashtag" value={selectedTank.id} />
                                <M365InfoRow
                                    label="Height"
                                    icon="fa-light fa-ruler-vertical"
                                    value={selectedTank.height != null ? `${selectedTank.height} mm` : "N/A"}
                                />
                                <M365InfoRow
                                    label="Fuel Grade"
                                    icon="fa-light fa-droplet"
                                    value={selectedTank.fuelGradeId ?? "N/A"}
                                />
                                <M365InfoRow
                                    label="PTS Auto Calibration"
                                    icon="fa-light fa-wand-magic-sparkles"
                                    value={
                                        selectedTank.automaticCalibrationEnabled
                                            ? selectedTank.automaticCalibrationReadyForGeneration
                                                ? "Enabled and ready"
                                                : "Enabled, waiting for readiness"
                                            : "Disabled"
                                    }
                                />
                            </div>
                        </div>
                    )}
                </div>
            </M365SectionCard>

            {selectedProbe && showLiveData && (
                <M365SectionCard title={`Live Probe ${selectedProbe.probeNumber}`} icon="fa-light fa-signal-stream">
                    <M365InfoRow label="Volume" icon="fa-light fa-cube" value={fmtVol(selectedProbe.productVolume)} />
                    <M365InfoRow
                        label="Product Height"
                        icon="fa-light fa-arrows-up-down"
                        value={selectedProbe.productHeight != null ? `${Number(selectedProbe.productHeight).toFixed(1)} mm` : "N/A"}
                    />
                    <M365InfoRow label="Temperature" icon="fa-light fa-temperature-half" value={fmtTemp(selectedProbe.temperature)} />
                    <M365InfoRow
                        label="Water Height"
                        icon="fa-light fa-droplet"
                        value={selectedProbe.waterHeight != null ? `${Number(selectedProbe.waterHeight).toFixed(1)} mm` : "N/A"}
                    />
                    {selectedProbe.updatedAt && (
                        <M365InfoRow
                            label="Updated"
                            icon="fa-light fa-clock"
                            value={new Date(selectedProbe.updatedAt).toLocaleString()}
                        />
                    )}
                </M365SectionCard>
            )}

            {selectedProbeNumber && (
                <M365SectionCard title="Auto Stock Updates" icon="fa-light fa-gauge-high">
                    <div className="tw-flex tw-items-center tw-justify-between tw-py-1">
                        <div>
                            <span className="m365-field__label tw-mb-0">Enable Auto Physical Stock Updates</span>
                            <p className="m365-field__hint">
                                Automatically update this tank&apos;s physical stock from probe readings
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onToggleAutoStock}
                            className={`m365-toggle ${usePtsProbeReadings ? "m365-toggle--on" : ""}`}
                        >
                            <span className="m365-toggle__thumb" />
                        </button>
                    </div>
                    {usePtsProbeReadings && (
                        <p className="tw-mt-1" style={{ fontSize: 12, color: "var(--m365-success)" }}>
                            <i className="fa-light fa-check-circle tw-mr-1" />
                            Physical stock will be updated automatically from probe measurements
                        </p>
                    )}
                </M365SectionCard>
            )}
        </>
    );
};

export default PTSProbeSelector;
