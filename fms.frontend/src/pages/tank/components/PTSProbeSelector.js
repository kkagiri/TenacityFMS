/**
 * File:          PTSProbeSelector.js
 * Purpose:       Probe/tank-channel selection with live-data vs device-config
 *                toggle, live probe data card, and auto-stock toggle.
 * Dependencies:  devextreme-react/select-box, M365SectionCard, M365InfoRow
 * Last Modified: 2026-02-26
 *
 * Props:
 * - availableProbes      (array):  Probes from live data or config
 * - selectedProbeNumber  (number): Currently selected probe number
 * - onProbeChange        (func):   (probeNumber) => void
 * - showLiveData         (bool):   Current toggle state
 * - onToggleLiveData     (func):   Toggle live ↔ config
 * - loadingConfig        (bool):   Config probes still loading
 * - configError          (string): Config fetch error
 * - onRetryConfig        (func):   Retry config fetch
 * - usePtsProbeReadings  (bool):   Auto-stock toggle
 * - onToggleAutoStock    (func):   Toggle auto-stock
 */
import React, { useMemo } from "react";
import { SelectBox } from "devextreme-react/select-box";
import M365SectionCard from "../../../components/m365/M365SectionCard";
import M365InfoRow from "../../../components/m365/M365InfoRow";

const fmtVol = (v) =>
    v == null
        ? "N/A"
        : `${Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`;

const fmtTemp = (t) => (t == null ? "N/A" : `${Number(t).toFixed(1)} °C`);

const PTSProbeSelector = ({
    availableProbes,
    selectedProbeNumber,
    onProbeChange,
    showLiveData,
    onToggleLiveData,
    loadingConfig,
    configError,
    onRetryConfig,
    usePtsProbeReadings,
    onToggleAutoStock,
}) => {
    const selectedProbe = useMemo(
        () => availableProbes.find((p) => p.probeNumber === selectedProbeNumber),
        [availableProbes, selectedProbeNumber]
    );

    return (
        <>
            {/* ── Probe Selector ── */}
            <M365SectionCard title="Probe / Tank Channel" icon="fa-light fa-gauge">
                <div className="tw-space-y-3">
                    {/* Toggle: Live Data ↔ Device Config */}
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
                            title={showLiveData ? "Switch to Device Config" : "Switch to Live Data"}
                        >
                            <span className="m365-toggle__thumb" />
                        </button>
                    </div>

                    {/* Loading config probes */}
                    {!showLiveData && loadingConfig && (
                        <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
                            <i className="fa-light fa-spinner fa-spin tw-mr-2" style={{ color: "var(--m365-primary)" }} />
                            <span style={{ fontSize: 13, color: "var(--m365-text-secondary)" }}>
                                Loading probes from device…
                            </span>
                        </div>
                    )}

                    {/* Config error */}
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

                    {/* Probe dropdown */}
                    {(!loadingConfig || showLiveData) && !configError && (
                        <>
                            <SelectBox
                                dataSource={availableProbes}
                                displayExpr={(item) => {
                                    if (!item) return "";
                                    let label = `Probe ${item.probeNumber}`;
                                    if (item.source === "config" && item.port) {
                                        label += ` (Port: ${item.port}, Addr: ${item.address})`;
                                    } else if (item.productVolume != null) {
                                        label += ` — ${fmtVol(item.productVolume)}`;
                                    }
                                    return label;
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
                                        ? "Waiting for UploadStatus readings. Ensure device is online."
                                        : "No probes in device config. Try live data toggle."}
                                </p>
                            )}
                        </>
                    )}
                </div>
            </M365SectionCard>

            {/* ── Live Probe Data Card ── */}
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

            {/* ── Auto Physical Stock Toggle ── */}
            {selectedProbeNumber && (
                <M365SectionCard title="Auto Stock Updates" icon="fa-light fa-gauge-high">
                    <div className="tw-flex tw-items-center tw-justify-between tw-py-1">
                        <div>
                            <span className="m365-field__label tw-mb-0">
                                Enable Auto Physical Stock Updates
                            </span>
                            <p className="m365-field__hint">
                                Automatically update this tank's physical stock from probe readings
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
