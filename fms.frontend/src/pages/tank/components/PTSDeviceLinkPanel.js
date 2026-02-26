/**
 * File:          PTSDeviceLinkPanel.js
 * Purpose:       Orchestrator rendered inside a SlidePanel. Manages SignalR,
 *                device list, probe selection, and saves the PTS binding.
 * Dependencies:  PTSDeviceList, PTSProbeSelector, ptsSignalRService,
 *                ptsConfigService, tankActions, ptsDeviceActions
 * Last Modified: 2026-02-26
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
import PTSDeviceList from "./PTSDeviceList";
import PTSProbeSelector from "./PTSProbeSelector";

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
    const [signalRConnected, setSignalRConnected] = useState(false);
    const [connecting, setConnecting] = useState(false);
    const [saving, setSaving] = useState(false);
    const [showLiveData, setShowLiveData] = useState(true);
    const [configProbes, setConfigProbes] = useState([]);
    const [loadingConfig, setLoadingConfig] = useState(false);
    const [configError, setConfigError] = useState(null);

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
        setUsePtsProbeReadings(Boolean(tank?.usePtsProbeReadings));
        setConfigProbes([]);
        setConfigError(null);

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

    useEffect(() => {
        if (selectedDeviceId && !showLiveData) fetchConfig(selectedDeviceId);
    }, [selectedDeviceId, showLiveData, fetchConfig]);

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
        setConfigProbes([]);
        setConfigError(null);
    }, []);

    /* ── save ── */
    const handleSave = useCallback(async () => {
        if (!tank?.id) { notify("No tank selected", "error", 3000); return; }
        if (!selectedDeviceId) { notify("Please select a PTS device", "warning", 3000); return; }
        if (availableProbes.length > 0 && !selectedProbeNumber) {
            notify("Please select a probe/tank channel", "warning", 3000);
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
                ptsTankId: null,
                usePtsProbeReadings,
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

            notify("PTS probe binding saved successfully", "success", 3000);
            onLinked?.();
            onClose?.();
        } catch (err) {
            notify(err?.message || "Error saving PTS binding", "error", 4000);
        } finally {
            if (mounted.current) setSaving(false);
        }
    }, [tank, selectedDeviceId, selectedProbeNumber, usePtsProbeReadings, availableProbes.length, dispatch, onLinked, onClose]);

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
                    onProbeChange={setSelectedProbeNumber}
                    showLiveData={showLiveData}
                    onToggleLiveData={() => setShowLiveData((p) => !p)}
                    loadingConfig={loadingConfig}
                    configError={configError}
                    onRetryConfig={() => fetchConfig(selectedDeviceId)}
                    usePtsProbeReadings={usePtsProbeReadings}
                    onToggleAutoStock={() => setUsePtsProbeReadings((p) => !p)}
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
                    {selectedProbeNumber ? <> using <strong>Probe {selectedProbeNumber}</strong>.</> : "."}
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
        </div>
    );
};

export default PTSDeviceLinkPanel;
