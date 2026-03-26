/**
 * File:          PTSDeviceLinkPanel.js
 * Purpose:       Orchestrator rendered inside a SlidePanel. Manages SignalR,
 *                device list, probe selection, and saves the PTS binding.
 * Dependencies:  PTSDeviceList, PTSProbeSelector, ptsSignalRService,
 *                ptsConfigService, tankActions, ptsDeviceActions
 * Last Modified: 2026-03-24
 *
 * Props:
 * - tank      (object): Tank being linked
 * - onLinked  (func):   Called after successful save
 * - onClose   (func):   Close the panel
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import notify from "devextreme/ui/notify";
import { fetchPTSDevices } from "../../../redux/actions/ptsActions/ptsDeviceActions";
import { updateTank } from "../../../redux/actions/tankActions";
import ptsSignalRService from "../../../signalR/ptsSignalRService";
import ptsConfigService from "../../../services/ptsConfigService";
import SlidePanel from "../../../components/ui/SlidePanel";
import PTSDeviceList from "./PTSDeviceList";
import PTSProbeSelector from "./PTSProbeSelector";

const AUTO_CALIBRATION_SOURCE = "";
const DEFAULT_PHYSICAL_STOCK_SOURCE = "";
const PREVIEW_CHART_TYPES = ["manual", "automatic", "interval-volume", "fms-learned"];

const getChartDisplayName = (value) => {
    switch (value) {
        case "manual":
            return "Manual chart";
        case "automatic":
            return "PTS automatic chart";
        case "interval-volume":
            return "Interval-volume chart";
        case "fms-learned":
            return "FMS learned chart";
        default:
            return "Auto priority";
    }
};

const getAutoPriority = () => ["manual", "automatic", "fms-learned", "interval-volume"];

const normalizeRecords = (records) => {
    if (!Array.isArray(records)) return [];

    return records
        .map((record) => ({
            height: Number(record?.height ?? 0),
            volume: Number(record?.volume ?? 0),
            passesNumber: Number(record?.passesNumber ?? 0),
        }))
        .filter((record) => Number.isFinite(record.height) && Number.isFinite(record.volume))
        .sort((left, right) => left.height - right.height);
};

const hasUsableRecords = (records) => {
    if (!Array.isArray(records) || records.length < 2) return false;
    return records.some((record) => Number(record.volume) > 0) && records[records.length - 1].height > records[0].height;
};

const interpolateVolumeFromRecords = (records, productHeightMm) => {
    if (!hasUsableRecords(records) || !Number.isFinite(Number(productHeightMm)) || Number(productHeightMm) <= 0) {
        return null;
    }

    const attempts = [];

    const interpolate = (lookupHeight) => {
        if (!Number.isFinite(lookupHeight)) return null;
        if (lookupHeight < records[0].height || lookupHeight > records[records.length - 1].height) {
            return null;
        }

        for (let index = 0; index < records.length - 1; index += 1) {
            const lower = records[index];
            const upper = records[index + 1];
            if (lookupHeight < lower.height || lookupHeight > upper.height) {
                continue;
            }

            if (lookupHeight === lower.height) return lower.volume;
            if (lookupHeight === upper.height) return upper.volume;
            if (upper.height === lower.height) return lower.volume;

            const ratio = (lookupHeight - lower.height) / (upper.height - lower.height);
            return lower.volume + (upper.volume - lower.volume) * ratio;
        }

        return null;
    };

    const probeHeightMm = Number(productHeightMm);
    const heightCm = Math.round(probeHeightMm / 10);
    const volumeFromCm = interpolate(heightCm);
    attempts.push({
        label: `${probeHeightMm} mm → ${heightCm} cm`,
        outcome: volumeFromCm != null ? "succeeded" : "failed",
        detail: volumeFromCm != null
            ? `Interpolation matched the local snapshot in centimetres and returned ${Number(volumeFromCm).toLocaleString(undefined, { maximumFractionDigits: 2 })} L.`
            : "No usable centimetre-based range matched this height."
    });

    if (volumeFromCm != null) {
        return { volume: volumeFromCm, lookupHeight: heightCm, lookupUnit: "cm", attempts };
    }

    const roundedMm = Math.round(probeHeightMm);
    const volumeFromMm = interpolate(roundedMm);
    attempts.push({
        label: `${heightCm} cm failed → ${roundedMm} mm raw`,
        outcome: volumeFromMm != null ? "succeeded" : "failed",
        detail: volumeFromMm != null
            ? `Raw millimetre interpolation returned ${Number(volumeFromMm).toLocaleString(undefined, { maximumFractionDigits: 2 })} L.`
            : "Raw millimetre lookup also failed against the resolved local snapshot."
    });

    if (volumeFromMm != null) {
        return { volume: volumeFromMm, lookupHeight: roundedMm, lookupUnit: "mm", attempts };
    }

    return { volume: null, lookupHeight: null, lookupUnit: null, attempts };
};

const resolveEffectiveChartType = (preferredSource, snapshotsByType) => {
    const order = preferredSource ? [preferredSource] : getAutoPriority();
    return order.find((chartType) => hasUsableRecords(snapshotsByType?.[chartType]?.records)) || null;
};

const buildFallbackTrace = (preferredSource, snapshotsByType) => {
    const order = preferredSource ? [preferredSource] : getAutoPriority();

    return order.map((chartType, index) => {
        const snapshot = snapshotsByType?.[chartType] || null;
        const records = normalizeRecords(snapshot?.records);
        const usable = hasUsableRecords(records);

        let decision = "skipped";
        let reason = "No local snapshot was found.";

        if (snapshot && records.length < 2) {
            reason = "Snapshot exists, but it does not contain enough rows for interpolation.";
        } else if (snapshot && records.length >= 2 && !records.some((record) => Number(record.volume) > 0)) {
            reason = "Snapshot rows are present, but all stored volumes are zero.";
        } else if (snapshot && records.length >= 2 && records[records.length - 1].height <= records[0].height) {
            reason = "Snapshot rows are not strictly increasing by height.";
        } else if (usable) {
            decision = index === 0 ? "selected" : "fallback-selected";
            reason = preferredSource
                ? "Preferred source has a usable local snapshot."
                : `First usable local snapshot found in auto priority order after checking ${index} earlier source${index === 1 ? "" : "s"}.`;
        }

        return {
            chartType,
            decision,
            reason,
            recordCount: records.length,
            hasSnapshot: Boolean(snapshot),
            recordedAtUtc: snapshot?.recordedAtUtc || null,
        };
    });
};

const getPhysicalStockSourceSummary = (value) => {
    switch (value) {
        case "upload-status":
            return "UploadStatus probe readings";
        case "tank-measurement":
            return "Tank measurement pipeline";
        default:
            return "System default";
    }
};

const getCalibrationSourceSummary = (value) => {
    switch (value) {
        case "manual":
            return "Manual calibration chart";
        case "automatic":
            return "PTS automatic calibration chart";
        case "interval-volume":
            return "Interval-volume chart";
        case "fms-learned":
            return "FMS learned chart";
        default:
            return "Auto priority";
    }
};

const getProductVolumeSourceSummary = (value) => {
    switch (value) {
        case "pts":
            return "PTS product volume";
        case "fms-calibrated":
            return "FMS calibrated volume";
        default:
            return "System default";
    }
};

/* ── helpers ── */
const isOnline = (s) => {
    const n = (s || "").toLowerCase();
    return n === "connected" || n === "active" || n === "idle";
};

const extractProbeReadings = (entry) => {
    const probes = entry?.status?.probes;
    const os = probes?.onlineStatus || probes?.OnlineStatus;
    if (!os) return [];

    const meas = os.measurements || os.Measurements || [];
    const ids = os.ids || os.Ids || [];

    if (meas.length > 0) {
        const map = new Map();
        meas.forEach((m, i) => {
            const pn = Number(m?.probeNumber ?? m?.ProbeNumber ?? ids[i] ?? 0) || 0;
            if (pn > 0 && !map.has(pn)) {
                map.set(pn, {
                    probeNumber: pn,
                    productVolume: m?.productVolume ?? m?.ProductVolume ?? null,
                    temperature: m?.temperature ?? m?.Temperature ?? null,
                    waterHeight: m?.waterHeight ?? m?.WaterHeight ?? null,
                    productHeight: m?.productHeight ?? m?.ProductHeight ?? null,
                    updatedAt: entry?.receivedAt || new Date().toISOString(),
                    source: "live",
                });
            }
        });
        return Array.from(map.values()).sort((a, b) => a.probeNumber - b.probeNumber);
    }

    return (Array.isArray(ids) ? ids : [])
        .map((id) => Number(id || 0))
        .filter((id) => id > 0)
        .map((pn) => ({
            probeNumber: pn,
            productVolume: null,
            temperature: null,
            waterHeight: null,
            productHeight: null,
            updatedAt: entry?.receivedAt || new Date().toISOString(),
            source: "live",
        }));
};

const PTSDeviceLinkPanel = ({ tank, onLinked, onClose }) => {
    const dispatch = useDispatch();
    const mounted = useRef(true);

    const { ptsDeviceList } = useSelector((s) => s.ptsDevice);
    const connectionStatuses = useSelector((s) => s.deviceConnections?.connectionStatuses || {});
    const uploadStatusByDevice = useSelector((s) => s.realtimeStatus?.uploadStatusByDevice || {});

    const [selectedDeviceId, setSelectedDeviceId] = useState(null);
    const [selectedProbeNumber, setSelectedProbeNumber] = useState(null);
    const [usePtsProbeReadings, setUsePtsProbeReadings] = useState(false);
    const [probePhysicalStockUpdateSource, setProbePhysicalStockUpdateSource] = useState(DEFAULT_PHYSICAL_STOCK_SOURCE);
    const [calibrationChartSource, setCalibrationChartSource] = useState(AUTO_CALIBRATION_SOURCE);
    const [productVolumeSource, setProductVolumeSource] = useState("");
    const [signalRConnected, setSignalRConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showLiveData, setShowLiveData] = useState(true);
    const [configProbes, setConfigProbes] = useState([]);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [configError, setConfigError] = useState(null);
    const [selectedPtsTankId, setSelectedPtsTankId] = useState(null);
    const [configTanks, setConfigTanks] = useState([]);
    const [loadingTanks, setLoadingTanks] = useState(false);
    const [tanksError, setTanksError] = useState(null);
    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState(null);
    const [previewData, setPreviewData] = useState(null);
    const [previewHeightInput, setPreviewHeightInput] = useState("");
    const [helpOpen, setHelpOpen] = useState(false);

    useEffect(() => {
        mounted.current = true;
        return () => { mounted.current = false; };
    }, []);

    /* ── SignalR ── */
    const ensureSignalR = useCallback(async () => {
        if (!mounted.current) return;
        setConnecting(true);
        try {
            if (!ptsSignalRService.getConnectionStatus()) await ptsSignalRService.start();
            await ptsSignalRService.requestDeviceStatusSummary();
            if (mounted.current) setSignalRConnected(true);
        } catch (err) {
            if (mounted.current) {
                setSignalRConnected(false);
                notify(err?.message || "Unable to connect to PTS SignalR", "error", 4000);
            }
        } finally {
            if (mounted.current) setConnecting(false);
        }
    }, []);

    /* ── init ── */
    useEffect(() => {
        setSelectedDeviceId(tank?.ptsId || null);
        setSelectedProbeNumber(tank?.probeNumber || null);
        setSelectedPtsTankId(tank?.ptsTankId || null);
        setUsePtsProbeReadings(Boolean(tank?.usePtsProbeReadings));
        setProbePhysicalStockUpdateSource(tank?.probePhysicalStockUpdateSource || DEFAULT_PHYSICAL_STOCK_SOURCE);
        setCalibrationChartSource(tank?.calibrationChartSource || AUTO_CALIBRATION_SOURCE);
        setProductVolumeSource(tank?.productVolumeSource || "");
        setConfigProbes([]);
        setConfigTanks([]);
        setConfigError(null);
        setTanksError(null);

        dispatch(fetchPTSDevices());
        setSignalRConnected(ptsSignalRService.getConnectionStatus());
        if (!ptsSignalRService.getConnectionStatus()) {
            ensureSignalR();
        } else {
            ptsSignalRService.requestDeviceStatusSummary().catch(() => { });
        }
    }, [tank, dispatch, ensureSignalR]);

    /* ── SignalR status listener ── */
    useEffect(() => {
        const unsub = ptsSignalRService.on("connectionStatusChanged", (ok) => {
            if (mounted.current) setSignalRConnected(Boolean(ok));
        });
        return () => unsub?.();
    }, []);

    /* ── config probes fetch ── */
    const fetchConfig = useCallback(async (devId) => {
        if (!devId || !mounted.current) return;
        setLoadingConfig(true);
        setConfigError(null);
        try {
            const res = await ptsConfigService.getProbesConfiguration(devId);
            if (!mounted.current) return;
            if (res?.isSuccess && res?.data?.probes) {
                setConfigProbes(
                    res.data.probes.map((p) => ({
                        probeNumber: p.id,
                        port: p.port,
                        address: p.address,
                        productVolume: null,
                        temperature: null,
                        waterHeight: null,
                        productHeight: null,
                        source: "config",
                    }))
                );
            } else {
                setConfigError(res?.message || "Failed to fetch probes configuration");
                setConfigProbes([]);
            }
        } catch (err) {
            if (mounted.current) {
                setConfigError(err?.message || "Error fetching probes configuration");
                setConfigProbes([]);
            }
        } finally {
            if (mounted.current) setLoadingConfig(false);
        }
    }, []);

    const fetchTanksConfig = useCallback(async (devId) => {
        if (!devId || !mounted.current) return;
        setLoadingTanks(true);
        setTanksError(null);
        try {
            const res = await ptsConfigService.getTanksConfiguration(devId);
            if (!mounted.current) return;
            if (res?.isSuccess && Array.isArray(res?.data?.tanks)) {
                setConfigTanks(
                    res.data.tanks.map((tankConfig) => ({
                        id: tankConfig.id,
                        fuelGradeId: tankConfig.fuelGradeId,
                        height: tankConfig.height,
                        automaticCalibrationEnabled: Boolean(tankConfig.automaticCalibrationEnabled),
                        automaticCalibrationReadyForGeneration: Boolean(tankConfig.automaticCalibrationReadyForGeneration),
                    }))
                );
            } else {
                setTanksError(res?.message || "Failed to fetch tanks configuration");
                setConfigTanks([]);
            }
        } catch (err) {
            if (mounted.current) {
                setTanksError(err?.message || "Error fetching tanks configuration");
                setConfigTanks([]);
            }
        } finally {
            if (mounted.current) setLoadingTanks(false);
        }
    }, []);

    useEffect(() => {
        if (selectedDeviceId && !showLiveData) fetchConfig(selectedDeviceId);
    }, [selectedDeviceId, showLiveData, fetchConfig]);

    useEffect(() => {
        if (!selectedDeviceId) {
            setConfigTanks([]);
            setSelectedPtsTankId(null);
            return;
        }

        fetchTanksConfig(selectedDeviceId);
    }, [selectedDeviceId, fetchTanksConfig]);

    /* ── derived data ── */
    const devicesWithStatus = useMemo(() => {
        if (!Array.isArray(ptsDeviceList)) return [];
        return ptsDeviceList
            .map((d) => {
                const st = connectionStatuses[d.ptsid]?.status || "Disconnected";
                return {
                    ...d,
                    liveStatus: st,
                    isOnline: isOnline(st),
                    liveConnectionType: connectionStatuses[d.ptsid]?.connectionType || "Unknown",
                    liveLastActivity: connectionStatuses[d.ptsid]?.lastActivity || d.lastActivity || null,
                };
            })
            .sort((a, b) => (a.isOnline !== b.isOnline ? (a.isOnline ? -1 : 1) : (a.ptsName || a.ptsid).localeCompare(b.ptsName || b.ptsid)));
    }, [ptsDeviceList, connectionStatuses]);

    const liveProbes = useMemo(() => {
        if (!selectedDeviceId) return [];
        return extractProbeReadings(uploadStatusByDevice[selectedDeviceId]);
    }, [selectedDeviceId, uploadStatusByDevice]);

    const availableProbes = useMemo(
        () => (showLiveData ? liveProbes : configProbes),
        [showLiveData, liveProbes, configProbes]
    );

    const selectedProbe = useMemo(
        () => availableProbes.find((probe) => probe.probeNumber === selectedProbeNumber) || null,
        [availableProbes, selectedProbeNumber]
    );

    const previewHeightValue = useMemo(() => {
        const parsed = Number(previewHeightInput);
        return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
    }, [previewHeightInput]);

    const previewEvaluation = useMemo(() => {
        const effectiveSnapshot = previewData?.effectiveSnapshot || null;
        if (!effectiveSnapshot || previewHeightValue == null) {
            return null;
        }

        return interpolateVolumeFromRecords(normalizeRecords(effectiveSnapshot.records), previewHeightValue);
    }, [previewData, previewHeightValue]);

    /* ── auto-select single probe ── */
    useEffect(() => {
        if (!selectedDeviceId) { setSelectedProbeNumber(null); return; }
        if (availableProbes.length === 1 && selectedProbeNumber == null) {
            setSelectedProbeNumber(availableProbes[0].probeNumber);
        }
    }, [selectedDeviceId, availableProbes, selectedProbeNumber]);

    /* ── handlers ── */
    const handleDeviceChange = useCallback((id) => {
        setSelectedDeviceId(id);
        setSelectedProbeNumber(null);
        setSelectedPtsTankId(null);
        setConfigProbes([]);
        setConfigTanks([]);
        setConfigError(null);
        setTanksError(null);
    }, []);

    const loadCalibrationPreview = useCallback(async () => {
        if (!tank?.id) {
            setPreviewData(null);
            setPreviewError("Select a tank before opening calibration preview.");
            return;
        }

        setPreviewLoading(true);
        setPreviewError(null);

        try {
            const snapshotResults = await Promise.allSettled(
                PREVIEW_CHART_TYPES.map((chartType) => ptsConfigService.getTankCalibrationCurrentSnapshot(tank.id, chartType))
            );

            const snapshotsByType = PREVIEW_CHART_TYPES.reduce((accumulator, chartType, index) => {
                const result = snapshotResults[index];
                if (result.status === "fulfilled" && result.value?.data) {
                    accumulator[chartType] = result.value.data;
                }
                return accumulator;
            }, {});

            const preferredSource = calibrationChartSource || null;
            const effectiveChartType = resolveEffectiveChartType(preferredSource, snapshotsByType);
            const fallbackTrace = buildFallbackTrace(preferredSource, snapshotsByType);
            const historyChartType = effectiveChartType || preferredSource || "manual";

            let historyRows = [];
            try {
                const historyResult = await ptsConfigService.getTankCalibrationHistory(tank.id, historyChartType, 1, 5);
                historyRows = Array.isArray(historyResult?.data) ? historyResult.data : [];
            } catch (historyError) {
                console.warn("[PTSDeviceLinkPanel] Failed to load calibration history preview", historyError);
            }

            setPreviewData({
                snapshotsByType,
                preferredChartType: preferredSource,
                effectiveChartType,
                fallbackTrace,
                effectiveSnapshot: effectiveChartType ? snapshotsByType[effectiveChartType] || null : null,
                historyChartType,
                historyRows,
            });
        } catch (error) {
            setPreviewData(null);
            setPreviewError(error?.response?.data?.message || error?.message || "Failed to load local calibration preview.");
        } finally {
            if (mounted.current) {
                setPreviewLoading(false);
            }
        }
    }, [tank?.id, calibrationChartSource]);

    const openCalibrationPreview = useCallback(async () => {
        const suggestedHeight = selectedProbe?.productHeight != null
            ? Math.max(0, Math.round(Number(selectedProbe.productHeight)))
            : null;

        setPreviewHeightInput(suggestedHeight ? String(suggestedHeight) : "");
        setPreviewOpen(true);
        await loadCalibrationPreview();
    }, [loadCalibrationPreview, selectedProbe?.productHeight]);

    /* ── save ── */
    const handleSave = useCallback(async () => {
        if (!tank?.id) { notify("No tank selected", "error", 3000); return; }
        if (!selectedDeviceId) { notify("Please select a PTS device", "warning", 3000); return; }
        if (availableProbes.length > 0 && !selectedProbeNumber) {
            notify("Please select a probe/tank channel", "warning", 3000);
            return;
        }

        if (configTanks.length > 0 && !selectedPtsTankId) {
            notify("Please select a PTS tank mapping", "warning", 3000);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                id: tank.id,
                name: tank.name,
                tankVolume: tank.tankVolume,
                tankHeight: tank.tankHeight,
                tankLength: tank.tankLength,
                ptsId: selectedDeviceId,
                probeNumber: selectedProbeNumber || null,
                ptsTankId: selectedPtsTankId || null,
                usePtsProbeReadings,
                probePhysicalStockUpdateSource: probePhysicalStockUpdateSource || null,
                calibrationChartSource: calibrationChartSource || null,
                productVolumeSource: productVolumeSource || null,
                useBookKeeping: Boolean(tank.useBookKeeping),
                hasAutomaticBookKeeping: Boolean(tank.hasAutomaticBookKeeping),
                priority: tank.priority || null,
                siteId: tank.siteId,
                discrepancyThreshold: tank.discrepancyThreshold ?? null,
                currentStock: tank.currentStock ?? 0,
                fuelGradeId: tank.fuelGradeId ?? null,
                fuelGradeName: tank.fuelGradeName || null,
                tankType: tank.tankType || "Stationary",
                latitude: tank.tankType === "Stationary" ? tank.latitude ?? null : null,
                longitude: tank.tankType === "Stationary" ? tank.longitude ?? null : null,
                linkedVehicleId: tank.tankType === "MobileTanker" ? tank.linkedVehicleId ?? null : null,
                locationValidationRadius: tank.locationValidationRadius ?? 100,
            };

            const result = await dispatch(updateTank(tank.id, payload));
            if (!result?.success) throw new Error(result?.message || "Failed to save PTS binding");

            notify("PTS device binding saved successfully", "success", 3000);
            onLinked?.({
                ...tank,
                ...payload,
            });
            onClose?.();
        } catch (err) {
            notify(err?.message || "Error saving PTS binding", "error", 4000);
        } finally {
            if (mounted.current) setSaving(false);
        }
    }, [tank, selectedDeviceId, selectedProbeNumber, selectedPtsTankId, usePtsProbeReadings, probePhysicalStockUpdateSource, calibrationChartSource, productVolumeSource, availableProbes.length, configTanks.length, dispatch, onLinked, onClose]);

    return (
        <div className="m365-pts-link-panel">
            <PTSDeviceList
                devices={devicesWithStatus}
                selectedDeviceId={selectedDeviceId}
                onDeviceChange={handleDeviceChange}
                signalRConnected={signalRConnected}
                connecting={connecting}
                onReconnect={ensureSignalR}
            />

            {selectedDeviceId && (
                <PTSProbeSelector
                    availableProbes={availableProbes}
                    selectedProbeNumber={selectedProbeNumber}
                    availableTanks={configTanks}
                    selectedPtsTankId={selectedPtsTankId}
                    onProbeChange={setSelectedProbeNumber}
                    onPtsTankChange={setSelectedPtsTankId}
                    showLiveData={showLiveData}
                    onToggleLiveData={() => setShowLiveData((p) => !p)}
                    loadingConfig={loadingConfig}
                    configError={configError}
                    onRetryConfig={() => fetchConfig(selectedDeviceId)}
                    loadingTanks={loadingTanks}
                    tanksError={tanksError}
                    onRetryTanks={() => fetchTanksConfig(selectedDeviceId)}
                    usePtsProbeReadings={usePtsProbeReadings}
                    onToggleAutoStock={() => setUsePtsProbeReadings((p) => !p)}
                    probePhysicalStockUpdateSource={probePhysicalStockUpdateSource}
                    onProbePhysicalStockUpdateSourceChange={setProbePhysicalStockUpdateSource}
                    calibrationChartSource={calibrationChartSource}
                    onCalibrationChartSourceChange={setCalibrationChartSource}
                    productVolumeSource={productVolumeSource}
                    onProductVolumeSourceChange={setProductVolumeSource}
                    onOpenCalibrationPreview={openCalibrationPreview}
                    onOpenCalibrationHelp={() => setHelpOpen(true)}
                />
            )}

            {/* ── Binding Preview ── */}
            <div className="m365-pts-preview">
                <p style={{ fontSize: 12, fontWeight: 600, color: "var(--m365-primary)", marginBottom: 4 }}>
                    <i className="fa-light fa-link tw-mr-1" /> Binding Preview
                </p>
                <p style={{ fontSize: 13, color: "var(--m365-text-primary)" }}>
                    Tank <strong>{tank?.name || "-"}</strong> → device{" "}
                    <strong>{selectedDeviceId || "-"}</strong>
                    {selectedProbeNumber ? <> using <strong>Probe {selectedProbeNumber}</strong></> : <> with no probe selected</>}
                    {selectedPtsTankId ? <> mapped to <strong>PTS Tank {selectedPtsTankId}</strong>.</> : <> and no PTS tank selected.</>}
                </p>
                <p style={{ fontSize: 12, color: "var(--m365-text-secondary)", marginTop: 6 }}>
                    Physical stock owner: <strong>{getPhysicalStockSourceSummary(probePhysicalStockUpdateSource)}</strong>
                    {" · "}
                    Stored product volume: <strong>{getProductVolumeSourceSummary(productVolumeSource)}</strong>
                    {" · "}
                    Local calibration source: <strong>{getCalibrationSourceSummary(calibrationChartSource)}</strong>
                </p>
            </div>

            {/* ── Actions ── */}
            <div className="m365-pts-link-panel__actions">
                <button className="m365-btn m365-btn--ghost" onClick={onClose}>
                    Cancel
                </button>
                <button
                    className="m365-btn m365-btn--primary"
                    onClick={handleSave}
                    disabled={saving || !selectedDeviceId}
                >
                    <i className={`fa-light ${saving ? "fa-spinner fa-spin" : "fa-link"}`} />
                    {saving ? "Saving…" : "Save Binding"}
                </button>
            </div>

            <SlidePanel
                open={previewOpen}
                onClose={() => setPreviewOpen(false)}
                title="Calibration Preview"
                width={980}
                panelClassName="m365-pts-preview-panel-shell"
            >
                <div className="m365-pts-calibration-preview">
                    <div className="m365-pts-calibration-preview__intro">
                        <div>
                            <h4>Height to volume test</h4>
                            <p>
                                This preview uses the local tank calibration snapshots already stored in FMS. It does not change the calibration entity or write any values back to the controller.
                            </p>
                        </div>
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost"
                            onClick={loadCalibrationPreview}
                            disabled={previewLoading}
                        >
                            <i className={`fa-light ${previewLoading ? "fa-spinner fa-spin" : "fa-rotate-right"}`}></i>
                            Refresh Preview
                        </button>
                    </div>

                    <div className="m365-pts-calibration-preview__summary">
                        <div className="m365-pts-calibration-preview__summary-card">
                            <span className="m365-pts-calibration-preview__label">Preferred source</span>
                            <strong>{getChartDisplayName(calibrationChartSource)}</strong>
                        </div>
                        <div className="m365-pts-calibration-preview__summary-card">
                            <span className="m365-pts-calibration-preview__label">Resolved source</span>
                            <strong>{getChartDisplayName(previewData?.effectiveChartType)}</strong>
                        </div>
                        <div className="m365-pts-calibration-preview__summary-card">
                            <span className="m365-pts-calibration-preview__label">Stored volume source</span>
                            <strong>{getProductVolumeSourceSummary(productVolumeSource)}</strong>
                        </div>
                        <div className="m365-pts-calibration-preview__summary-card">
                            <span className="m365-pts-calibration-preview__label">Physical stock owner</span>
                            <strong>{getPhysicalStockSourceSummary(probePhysicalStockUpdateSource)}</strong>
                        </div>
                    </div>

                    <div className="m365-pts-calibration-preview__card m365-pts-calibration-preview__card--trace">
                        <h5>Auto fallback decision trace</h5>
                        <p className="m365-pts-calibration-preview__meta">
                            This is the exact order the preview checked before resolving the local chart source.
                        </p>
                        {previewData?.fallbackTrace?.length ? (
                            <div className="m365-pts-calibration-preview__trace-list">
                                {previewData.fallbackTrace.map((item, index) => {
                                    const badgeClass = item.decision === "selected" || item.decision === "fallback-selected"
                                        ? "m365-badge--success"
                                        : item.hasSnapshot
                                            ? "m365-badge--warning"
                                            : "m365-badge--neutral";

                                    const badgeText = item.decision === "selected"
                                        ? "Selected"
                                        : item.decision === "fallback-selected"
                                            ? "Used after fallback"
                                            : item.hasSnapshot
                                                ? "Skipped"
                                                : "Missing";

                                    return (
                                        <div key={`${item.chartType}-${index}`} className="m365-pts-calibration-preview__trace-item">
                                            <div className="m365-pts-calibration-preview__trace-index">{index + 1}</div>
                                            <div className="m365-pts-calibration-preview__trace-body">
                                                <div className="m365-pts-calibration-preview__trace-head">
                                                    <strong>{getChartDisplayName(item.chartType)}</strong>
                                                    <span className={`m365-badge ${badgeClass}`}>{badgeText}</span>
                                                </div>
                                                <div className="m365-pts-calibration-preview__meta">{item.reason}</div>
                                                <div className="m365-pts-calibration-preview__trace-foot">
                                                    <span>{item.recordCount} row(s)</span>
                                                    <span>{item.recordedAtUtc ? new Date(item.recordedAtUtc).toLocaleString() : "No snapshot timestamp"}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="m365-pts-calibration-preview__empty">
                                No decision trace is available for this preview.
                            </div>
                        )}
                    </div>

                    <div className="m365-pts-calibration-preview__tester">
                        <div>
                            <label className="m365-field__label">Test Product Height (mm)</label>
                            <input
                                type="number"
                                className="m365-input"
                                min={0}
                                step={1}
                                value={previewHeightInput}
                                onChange={(event) => setPreviewHeightInput(event.target.value)}
                                placeholder="Enter a probe height in millimetres"
                            />
                            <p className="m365-field__hint">
                                {selectedProbe?.productHeight != null
                                    ? `Live probe ${selectedProbe.probeNumber} currently reports ${Number(selectedProbe.productHeight).toFixed(1)} mm.`
                                    : "Use any height you want to test against the local snapshot records."}
                            </p>
                        </div>
                        <div className="m365-pts-calibration-preview__result">
                            <span className="m365-pts-calibration-preview__label">Derived volume</span>
                            <strong>
                                {previewEvaluation?.volume != null
                                    ? `${Number(previewEvaluation.volume).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`
                                    : "Unavailable"}
                            </strong>
                            <p>
                                {previewEvaluation?.volume != null
                                    ? `Lookup used ${previewEvaluation.lookupHeight} ${previewEvaluation.lookupUnit} from the resolved local snapshot.`
                                    : "No usable local snapshot matched the current selection and test height."}
                            </p>
                            {previewEvaluation?.attempts?.length ? (
                                <div className="m365-pts-calibration-preview__attempts">
                                    {previewEvaluation.attempts.map((attempt, index) => (
                                        <div key={`${attempt.label}-${index}`} className="m365-pts-calibration-preview__attempt-row">
                                            <span className={`m365-badge ${attempt.outcome === "succeeded" ? "m365-badge--success" : "m365-badge--warning"}`}>
                                                {attempt.outcome === "succeeded" ? "Succeeded" : "Failed"}
                                            </span>
                                            <div>
                                                <strong>{attempt.label}</strong>
                                                <div className="m365-pts-calibration-preview__meta">{attempt.detail}</div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : null}
                        </div>
                    </div>

                    {previewError && <div className="m365-pts-calibration-preview__error">{previewError}</div>}

                    <div className="m365-pts-calibration-preview__grid">
                        <div className="m365-pts-calibration-preview__card">
                            <h5>Local snapshot sources</h5>
                            {PREVIEW_CHART_TYPES.map((chartType) => {
                                const snapshot = previewData?.snapshotsByType?.[chartType] || null;
                                const records = normalizeRecords(snapshot?.records);
                                const usable = hasUsableRecords(records);
                                return (
                                    <div key={chartType} className="m365-pts-calibration-preview__snapshot-row">
                                        <div>
                                            <strong>{getChartDisplayName(chartType)}</strong>
                                            <div className="m365-pts-calibration-preview__meta">
                                                {snapshot?.recordedAtUtc
                                                    ? `Recorded ${new Date(snapshot.recordedAtUtc).toLocaleString()}`
                                                    : "No local snapshot stored"}
                                            </div>
                                        </div>
                                        <div className="m365-pts-calibration-preview__snapshot-stats">
                                            <span className={`m365-badge ${usable ? "m365-badge--success" : "m365-badge--warning"}`}>
                                                {usable ? "Usable" : "Missing / empty"}
                                            </span>
                                            <span>{records.length} rows</span>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="m365-pts-calibration-preview__card">
                            <h5>Resolved snapshot sample</h5>
                            {previewData?.effectiveSnapshot?.records?.length ? (
                                normalizeRecords(previewData.effectiveSnapshot.records).slice(0, 8).map((record, index) => (
                                    <div key={`${record.height}-${index}`} className="m365-pts-calibration-preview__record-row">
                                        <span>{record.height} mm/cm</span>
                                        <span>{Number(record.volume).toLocaleString(undefined, { maximumFractionDigits: 2 })} L</span>
                                        <span>{record.passesNumber > 0 ? `${record.passesNumber} pass(es)` : "-"}</span>
                                    </div>
                                ))
                            ) : (
                                <div className="m365-pts-calibration-preview__empty">
                                    No usable snapshot rows are available for the resolved source.
                                </div>
                            )}
                        </div>

                        <div className="m365-pts-calibration-preview__card">
                            <h5>Recent local history</h5>
                            <p className="m365-pts-calibration-preview__meta">
                                Showing the latest saved snapshots for {getChartDisplayName(previewData?.historyChartType)}.
                            </p>
                            {previewData?.historyRows?.length ? (
                                previewData.historyRows.map((row) => (
                                    <div key={row.id} className="m365-pts-calibration-preview__history-row">
                                        <div>
                                            <strong>{new Date(row.recordedAtUtc).toLocaleString()}</strong>
                                            <div className="m365-pts-calibration-preview__meta">{row.source || "Unknown source"}</div>
                                        </div>
                                        <div className="m365-pts-calibration-preview__snapshot-stats">
                                            <span>{row.recordCount || 0} rows</span>
                                            <span>{row.probeNumber ? `Probe ${row.probeNumber}` : "No probe"}</span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="m365-pts-calibration-preview__empty">
                                    No local snapshot history is available for the resolved source.
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </SlidePanel>

            <SlidePanel
                open={helpOpen}
                onClose={() => setHelpOpen(false)}
                title="Calibration Source Help"
                width={780}
                panelClassName="m365-pts-help-panel-shell"
            >
                <div className="m365-pts-help-panel">
                    <div className="m365-pts-help-panel__banner">
                        Automatic probe updates do two separate jobs: they can enrich a reading with a local height to volume chart, and they can optionally let that enriched reading own physical stock.
                    </div>

                    <div className="m365-pts-help-panel__diagram">
                        <div className="m365-pts-help-panel__step">
                            <strong>1. UploadStatus</strong>
                            <span>Probe sends product height and may send product volume.</span>
                        </div>
                        <div className="m365-pts-help-panel__arrow"><i className="fa-light fa-arrow-right"></i></div>
                        <div className="m365-pts-help-panel__step">
                            <strong>2. Local calibration lookup</strong>
                            <span>FMS checks the selected snapshot source and derives volume when needed.</span>
                        </div>
                        <div className="m365-pts-help-panel__arrow"><i className="fa-light fa-arrow-right"></i></div>
                        <div className="m365-pts-help-panel__step">
                            <strong>3. Ownership gate</strong>
                            <span>The physical stock owner decides whether UploadStatus can write physical stock.</span>
                        </div>
                    </div>

                    <div className="m365-pts-help-panel__grid">
                        <section className="m365-pts-help-panel__card">
                            <h4><i className="fa-light fa-circle-info"></i> What Auto Physical Stock Updates does</h4>
                            <p>
                                When this switch is enabled, probe-based UploadStatus readings are allowed to participate in automatic stock movement. If the owner is set to UploadStatus, the averaged probe volume can update <strong>PhysicalStockValue</strong>. If the owner is Tank measurement, UploadStatus may still be enriched, but it does not become the stock writer.
                            </p>
                        </section>

                        <section className="m365-pts-help-panel__card">
                            <h4><i className="fa-light fa-database"></i> Why the calibration entity was not changed again</h4>
                            <p>
                                The local calibration storage already exists in <strong>TankCalibrationSnapshot</strong> and already supports tank and probe-aware snapshots. The recent backend work changed how those snapshots are chosen and validated; it did not need another schema change for the snapshot table itself.
                            </p>
                        </section>

                        <section className="m365-pts-help-panel__card">
                            <h4><i className="fa-light fa-waveform-lines"></i> Stored Product Volume Source</h4>
                            <ul className="m365-pts-help-panel__list">
                                <li><strong>System default</strong>: keep a positive PTS ProductVolume when it arrives, otherwise derive from local calibration.</li>
                                <li><strong>PTS product volume</strong>: trust the probe ProductVolume when it is usable; calibration is only a fallback when the PTS volume is missing.</li>
                                <li><strong>FMS calibrated volume</strong>: prefer local height-to-volume calibration for the stored UploadStatus ProductVolume and only fall back to PTS when no usable local chart exists.</li>
                            </ul>
                        </section>

                        <section className="m365-pts-help-panel__card">
                            <h4><i className="fa-light fa-list-check"></i> Calibration Source options</h4>
                            <ul className="m365-pts-help-panel__list">
                                <li><strong>Auto priority</strong>: tries manual, automatic, FMS learned, then interval-volume until it finds a usable local snapshot.</li>
                                <li><strong>Manual</strong>: use the manually synced or pushed controller chart first.</li>
                                <li><strong>PTS automatic</strong>: use the controller-generated automatic chart first.</li>
                                <li><strong>Interval-volume</strong>: use interval snapshots first, useful only when those rows are not placeholder zeros.</li>
                                <li><strong>FMS learned</strong>: use the locally learned chart built from deliveries and measured stock behavior.</li>
                            </ul>
                        </section>

                        <section className="m365-pts-help-panel__card">
                            <h4><i className="fa-light fa-scale-balanced"></i> Physical Stock Owner options</h4>
                            <ul className="m365-pts-help-panel__list">
                                <li><strong>System default</strong>: keeps the legacy fallback behavior.</li>
                                <li><strong>UploadStatus probe readings</strong>: probe readings can own automatic physical stock updates.</li>
                                <li><strong>Tank measurement pipeline</strong>: only persisted tank measurements can move physical stock.</li>
                            </ul>
                        </section>
                    </div>
                </div>
            </SlidePanel>
        </div>
    );
};

export default PTSDeviceLinkPanel;
