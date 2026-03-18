/**
 * File: ClusterDetectionPreviewPanel.js
 * Purpose: Runs a dry-run cluster detection session, keeps thresholds visible in the load workspace, and coordinates the preview map plus result grids.
 * Dependencies: React, DevExtreme controls, VehicleSearchableSelector, vehicleTripService, preview map/results components.
 * Last Modified: 2026-03-16
 *
 * Key Functions:
 * - ClusterDetectionPreviewPanel(): Loads track data once, replays preview detection locally, and feeds the map-first workspace.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Button from "devextreme-react/button";
import DateBox from "devextreme-react/date-box";
import LoadPanel from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import VehicleSearchableSelector from "../../../../components/selectors/VehicleSearchableSelector";
import { previewClusterDetection, previewGeofenceDetection, fetchTripSiteLookup, fetchVehicleTripSettings, fetchGeofenceGroups } from "../services/vehicleTripService";
import { buildClusterSourceKey, buildFrontendClusterPreview } from "../utils/clusterDetectionPlayground";
import { buildGeofenceSourceKey, buildFrontendGeofencePreview } from "../utils/geofenceDetectionPlayground";
import ClusterDetectionPreviewMap from "./ClusterDetectionPreviewMap";
import ClusterDetectionPreviewResults from "./ClusterDetectionPreviewResults";
import ClusterDetectionPreviewCharts from "./ClusterDetectionPreviewCharts";

const DEFAULT_PLAYGROUND = {
    stopSpeedThresholdKph: 3,
    minimumStopDurationMinutes: 1.5,
    minimumTripDistanceKm: 0.5,
    minimumTripDurationMinutes: 2,
    clusterRadiusMeters: 150,
    maxTrackPoints: 5000,
};

const PLAYGROUND_FIELDS = [
    { key: "stopSpeedThresholdKph", label: "Stop speed (km/h)", min: 0, max: 50, step: 0.5, help: "Points below this speed are classified as potential stops. Lower values catch only truly stationary moments." },
    { key: "minimumStopDurationMinutes", label: "Min stop duration (min)", min: 0.1, max: 60, step: 0.5, help: "A slow/stopped period must last at least this long to qualify as a stop. Filters out brief traffic pauses." },
    { key: "minimumTripDistanceKm", label: "Min trip distance (km)", min: 0, max: 100, step: 0.1, help: "Trip legs shorter than this distance are discarded. Prevents micro-movements from creating false trips." },
    { key: "minimumTripDurationMinutes", label: "Min trip duration (min)", min: 0, max: 1440, step: 1, help: "Trip legs shorter than this duration are discarded. Prevents very brief relocations from generating trips." },
    { key: "clusterRadiusMeters", label: "Cluster radius (m)", min: 10, max: 5000, step: 10, help: "Nearby stops within this radius are grouped into a single cluster (e.g. a loading bay). Larger values merge more stops together." },
    { key: "maxTrackPoints", label: "Max track points", min: 100, max: 50000, step: 500, help: "Maximum GPS points loaded from the server. Higher values give finer detail but take longer to process." },
];

const DEFAULT_GEOFENCE_PLAYGROUND = {
    minimumTripDistanceKm: 0.5,
    minimumTripDurationMinutes: 2,
    maxTrackPoints: 5000,
};

const GEOFENCE_PLAYGROUND_FIELDS = [
    { key: "minimumTripDistanceKm", label: "Min trip distance (km)", min: 0, max: 100, step: 0.1, help: "Trip legs shorter than this distance between sites are discarded. Prevents GPS drift at site boundaries from generating false trips." },
    { key: "minimumTripDurationMinutes", label: "Min trip duration (min)", min: 0, max: 1440, step: 1, help: "Trip legs shorter than this duration between sites are discarded. Filters out erroneous quick transitions." },
    { key: "maxTrackPoints", label: "Max track points", min: 100, max: 50000, step: 500, help: "Maximum GPS points loaded from the server. Higher values give finer detail but take longer to process." },
];

const ThresholdSlider = ({ field, value, onChange, disabled }) => {
    const pct = ((value - field.min) / (field.max - field.min)) * 100;
    return (
        <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
            <div className="tw-flex tw-items-baseline tw-justify-between tw-gap-3 tw-mb-2">
                <span className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-600">{field.label}</span>
                <span className="tw-font-mono tw-text-xs tw-font-bold tw-text-blue-700">{formatFieldValue(field, value)}</span>
            </div>
            <div className="tw-relative tw-flex tw-items-center tw-h-6">
                <div className="tw-absolute tw-inset-x-0 tw-h-[3px] tw-rounded-full tw-bg-slate-200" />
                <div className="tw-absolute tw-left-0 tw-h-[3px] tw-rounded-full tw-bg-blue-600" style={{ width: `${pct}%` }} />
                <div
                    className="tw-absolute tw-h-3.5 tw-w-3.5 tw-rounded-full tw-border-2 tw-border-blue-600 tw-bg-white tw-shadow"
                    style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                />
                <input
                    type="range"
                    min={field.min}
                    max={field.max}
                    step={field.step}
                    value={value}
                    onChange={(e) => onChange(field.key, parseFloat(e.target.value))}
                    disabled={disabled}
                    className="tw-absolute tw-inset-0 tw-w-full tw-cursor-pointer tw-opacity-0"
                />
            </div>
            <div className="tw-flex tw-justify-between tw-mt-1">
                <span className="tw-font-mono tw-text-[9px] tw-text-slate-400">{formatFieldValue(field, field.min)}</span>
                <span className="tw-font-mono tw-text-[9px] tw-text-slate-400">{formatFieldValue(field, field.max)}</span>
            </div>
        </div>
    );
};

const formatFieldValue = (field, value) => {
    const numericValue = Number(value ?? 0);

    if (field.key === "maxTrackPoints") {
        return `${Math.round(numericValue).toLocaleString()} pts`;
    }

    if (field.key === "clusterRadiusMeters") {
        return `${Math.round(numericValue)} m`;
    }

    return `${numericValue.toFixed(field.step < 1 ? 1 : 0)} ${field.key.includes("Minutes") ? "min" : field.key.includes("Distance") ? "km" : "km/h"}`;
};

const ClusterDetectionPreviewPanel = ({ onPreviewLoaded = null }) => {
    const [detectionMode, setDetectionMode] = useState("cluster");
    const [vehicleId, setVehicleId] = useState(null);
    const [selectedDate, setSelectedDate] = useState(null);
    const [timeFrom, setTimeFrom] = useState(null);
    const [timeTo, setTimeTo] = useState(null);
    const [running, setRunning] = useState(false);
    const [result, setResult] = useState(null);
    const [playground, setPlayground] = useState({ ...DEFAULT_PLAYGROUND });
    const [geofencePlayground, setGeofencePlayground] = useState({ ...DEFAULT_GEOFENCE_PLAYGROUND });
    const [trackSource, setTrackSource] = useState(null);
    const [geofenceTrackSource, setGeofenceTrackSource] = useState(null);
    const [siteLookup, setSiteLookup] = useState([]);
    const [geofenceGroups, setGeofenceGroups] = useState([]);
    const [selectedGeofenceGroupId, setSelectedGeofenceGroupId] = useState(null);
    const [selection, setSelection] = useState(null);
    const [playbackIndex, setPlaybackIndex] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [playbackSpeed, setPlaybackSpeed] = useState(1);
    const [showHelp, setShowHelp] = useState(false);

    const savedSettingsRef = useRef({ ...DEFAULT_PLAYGROUND });
    const lastRunPlaygroundRef = useRef(null);
    const hasRunRef = useRef(false);
    const replayTimerRef = useRef(null);
    const playbackTimerRef = useRef(null);

    const fromUtc = useMemo(() => {
        if (!selectedDate || timeFrom == null) return null;
        const d = new Date(selectedDate);
        const t = new Date(timeFrom);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes(), 0));
    }, [selectedDate, timeFrom]);

    const toUtc = useMemo(() => {
        if (!selectedDate || timeTo == null) return null;
        const d = new Date(selectedDate);
        const t = new Date(timeTo);
        return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), t.getHours(), t.getMinutes(), 0));
    }, [selectedDate, timeTo]);

    const currentSourceKey = detectionMode === "cluster"
        ? buildClusterSourceKey({
            vehicleId,
            fromUtc: fromUtc ? fromUtc.toISOString() : "",
            toUtc: toUtc ? toUtc.toISOString() : "",
            maxTrackPoints: playground.maxTrackPoints,
        })
        : buildGeofenceSourceKey({
            vehicleId,
            fromUtc: fromUtc ? fromUtc.toISOString() : "",
            toUtc: toUtc ? toUtc.toISOString() : "",
            maxTrackPoints: geofencePlayground.maxTrackPoints,
            geofenceGroupId: selectedGeofenceGroupId,
        });
    const activeTrackSource = detectionMode === "cluster" ? trackSource : geofenceTrackSource;
    const hasLoadedTrackSource = Boolean(activeTrackSource?.key && activeTrackSource.key === currentSourceKey && (
        detectionMode === "cluster" ? Array.isArray(activeTrackSource.trackPoints) : Array.isArray(activeTrackSource.trackPoints)
    ));

    const canRun = vehicleId && fromUtc && toUtc && !running;

    // Load saved cluster batch settings on mount
    useEffect(() => {
        let cancelled = false;
        (async () => {
            try {
                const s = await fetchVehicleTripSettings();
                if (cancelled || !s) return;
                const loaded = {
                    stopSpeedThresholdKph: s.clusterBatchStopSpeedThresholdKph ?? DEFAULT_PLAYGROUND.stopSpeedThresholdKph,
                    minimumStopDurationMinutes: s.clusterBatchMinimumStopDurationMinutes ?? DEFAULT_PLAYGROUND.minimumStopDurationMinutes,
                    minimumTripDistanceKm: s.clusterBatchMinimumTripDistanceKm ?? DEFAULT_PLAYGROUND.minimumTripDistanceKm,
                    minimumTripDurationMinutes: s.clusterBatchMinimumTripDurationMinutes ?? DEFAULT_PLAYGROUND.minimumTripDurationMinutes,
                    clusterRadiusMeters: s.clusterBatchClusterRadiusMeters ?? DEFAULT_PLAYGROUND.clusterRadiusMeters,
                    maxTrackPoints: s.clusterBatchMaxTrackPoints ?? DEFAULT_PLAYGROUND.maxTrackPoints,
                };
                setPlayground(loaded);
                savedSettingsRef.current = loaded;
            } catch { /* use defaults */ }
        })();
        return () => { cancelled = true; };
    }, []);

    // Load geofence groups when switching to geofence mode
    useEffect(() => {
        if (detectionMode !== "geofence" || geofenceGroups.length > 0) return;
        let cancelled = false;
        (async () => {
            try {
                const groups = await fetchGeofenceGroups();
                if (!cancelled) setGeofenceGroups(groups);
            } catch { /* ignore — dropdown will just be empty */ }
        })();
        return () => { cancelled = true; };
    }, [detectionMode, geofenceGroups.length]);

    const updatePlayground = useCallback((key, value) => {
        setPlayground((prev) => ({ ...prev, [key]: value }));
    }, []);

    const updateGeofencePlayground = useCallback((key, value) => {
        setGeofencePlayground((prev) => ({ ...prev, [key]: value }));
    }, []);

    const resetPlayground = useCallback(() => {
        setPlayground({ ...savedSettingsRef.current });
    }, []);

    const resetGeofencePlayground = useCallback(() => {
        setGeofencePlayground({ ...DEFAULT_GEOFENCE_PLAYGROUND });
    }, []);

    // Clear everything when vehicle changes
    useEffect(() => {
        setResult(null);
        setTrackSource(null);
        setGeofenceTrackSource(null);
        setSelection(null);
        setPlaybackIndex(null);
        setIsPlaying(false);
        hasRunRef.current = false;
    }, [vehicleId]);

    // Auto-replay locally when thresholds change (debounced, excludes maxTrackPoints) — cluster mode
    useEffect(() => {
        if (detectionMode !== "cluster" || !hasRunRef.current || !trackSource?.trackPoints?.length) return;
        clearTimeout(replayTimerRef.current);
        replayTimerRef.current = setTimeout(() => {
            const data = buildFrontendClusterPreview({
                sourcePreview: trackSource,
                settings: playground,
                sites: siteLookup,
            });
            setResult(data);
            setSelection(null);
            setPlaybackIndex(null);
            setIsPlaying(false);
            lastRunPlaygroundRef.current = { ...playground };
            if (onPreviewLoaded) onPreviewLoaded(data);
        }, 400);
        return () => clearTimeout(replayTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [playground.stopSpeedThresholdKph, playground.minimumStopDurationMinutes, playground.minimumTripDistanceKm, playground.minimumTripDurationMinutes, playground.clusterRadiusMeters, detectionMode]);

    // Auto-replay locally when thresholds change (debounced) — geofence mode
    useEffect(() => {
        if (detectionMode !== "geofence" || !hasRunRef.current || !geofenceTrackSource?.trackPoints?.length) return;
        clearTimeout(replayTimerRef.current);
        replayTimerRef.current = setTimeout(() => {
            const data = buildFrontendGeofencePreview({
                sourcePreview: geofenceTrackSource,
                settings: geofencePlayground,
            });
            setResult(data);
            setSelection(null);
            setPlaybackIndex(null);
            setIsPlaying(false);
            if (onPreviewLoaded) onPreviewLoaded(data);
        }, 400);
        return () => clearTimeout(replayTimerRef.current);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [geofencePlayground.minimumTripDistanceKm, geofencePlayground.minimumTripDurationMinutes, detectionMode]);

    const handleRun = useCallback(async () => {
        if (!vehicleId || !fromUtc || !toUtc) {
            notify("Please select a vehicle and date range.", "warning", 3000);
            return;
        }

        try {
            setRunning(true);
            setResult(null);
            setSelection(null);
            setPlaybackIndex(null);
            setIsPlaying(false);
            if (onPreviewLoaded) {
                onPreviewLoaded(null);
            }

            if (detectionMode === "cluster") {
                let sourcePreview = trackSource;
                if (!hasLoadedTrackSource) {
                    const data = await previewClusterDetection({
                        vehicleId,
                        fromUtc: new Date(fromUtc).toISOString(),
                        toUtc: new Date(toUtc).toISOString(),
                        settings: { maxTrackPoints: playground.maxTrackPoints },
                    });

                    sourcePreview = {
                        ...data,
                        key: currentSourceKey,
                    };
                    setTrackSource(sourcePreview);
                }

                let sites = siteLookup;
                if (!sites.length) {
                    sites = await fetchTripSiteLookup();
                    setSiteLookup(sites);
                }

                const previewData = buildFrontendClusterPreview({
                    sourcePreview,
                    settings: playground,
                    sites,
                });

                setResult(previewData);
                lastRunPlaygroundRef.current = { ...playground };
                hasRunRef.current = true;
                if (onPreviewLoaded) onPreviewLoaded(previewData);
            } else {
                // Geofence mode
                let sourcePreview = geofenceTrackSource;
                if (!hasLoadedTrackSource) {
                    const data = await previewGeofenceDetection({
                        vehicleId,
                        fromUtc: new Date(fromUtc).toISOString(),
                        toUtc: new Date(toUtc).toISOString(),
                        settings: { maxTrackPoints: geofencePlayground.maxTrackPoints },
                        geofenceGroupId: selectedGeofenceGroupId,
                    });

                    sourcePreview = {
                        ...data,
                        key: currentSourceKey,
                    };
                    setGeofenceTrackSource(sourcePreview);
                }

                const previewData = buildFrontendGeofencePreview({
                    sourcePreview,
                    settings: geofencePlayground,
                });

                setResult(previewData);
                hasRunRef.current = true;
                if (onPreviewLoaded) onPreviewLoaded(previewData);
            }

            setSelection(null);

        } catch (error) {
            if (onPreviewLoaded) {
                onPreviewLoaded(null);
            }
            notify(error?.message || `${detectionMode === "cluster" ? "Cluster" : "Geofence"} detection preview failed.`, "error", 4000);
        } finally {
            setRunning(false);
        }
    }, [vehicleId, fromUtc, toUtc, playground, geofencePlayground, detectionMode, onPreviewLoaded, trackSource, geofenceTrackSource, hasLoadedTrackSource, currentSourceKey, siteLookup, selectedGeofenceGroupId]);

    // ─── Playback ───
    const playbackPoints = useMemo(() => {
        if (!result) return [];
        return result.trackPoints || result.annotatedPoints || [];
    }, [result]);

    const handlePlayback = useCallback(() => {
        if (isPlaying) {
            setIsPlaying(false);
            return;
        }
        const total = playbackPoints.length;
        if (!total) return;
        if (playbackIndex == null || playbackIndex >= total - 1) setPlaybackIndex(0);
        setIsPlaying(true);
    }, [isPlaying, playbackIndex, playbackPoints]);

    const handlePlaybackStop = useCallback(() => {
        setIsPlaying(false);
        setPlaybackIndex(null);
        setPlaybackSpeed(1);
    }, []);

    useEffect(() => {
        if (!isPlaying || !playbackPoints.length) {
            clearInterval(playbackTimerRef.current);
            return;
        }
        const total = playbackPoints.length;
        const interval = Math.max(6, Math.round(50 / playbackSpeed));
        playbackTimerRef.current = setInterval(() => {
            setPlaybackIndex((prev) => {
                const next = (prev ?? 0) + 1;
                if (next >= total) {
                    setIsPlaying(false);
                    return total - 1;
                }
                return next;
            });
        }, interval);
        return () => clearInterval(playbackTimerRef.current);
    }, [isPlaying, playbackPoints, playbackSpeed]);

    const playbackStopIndex = useMemo(() => {
        if (playbackIndex == null) return -1;
        if (detectionMode === "geofence") {
            if (!result?.siteVisits?.length) return -1;
            return result.siteVisits.findIndex((v) => playbackIndex >= v.entryIndex && playbackIndex <= v.exitIndex);
        }
        if (!result?.stops?.length) return -1;
        return result.stops.findIndex((s) => playbackIndex >= s.startTrackIndex && playbackIndex <= s.endTrackIndex);
    }, [playbackIndex, result, detectionMode]);

    const summaryCards = useMemo(() => {
        if (!result) {
            return [];
        }

        if (detectionMode === "geofence") {
            const summary = result.summary || {};
            return [
                { icon: "fa-location-dot", label: "Track points", value: summary.totalTrackPoints ?? 0, color: "#6366f1" },
                { icon: "fa-draw-polygon", label: "Site geofences", value: summary.totalSiteGeofences ?? 0, color: "#8b5cf6" },
                { icon: "fa-building", label: "Site visits", value: summary.siteVisitsDetected ?? 0, color: "#10b981" },
                { icon: "fa-route", label: "Trip legs", value: summary.tripLegsDetected ?? 0, color: "#f59e0b" },
            ];
        }

        return [
            { icon: "fa-location-dot", label: "Track points", value: result.totalTrackPoints, color: "#6366f1" },
            { icon: "fa-wave-pulse", label: "Slow-point gate", value: `${Number(result.settingsStopSpeedThresholdKph || 0).toFixed(1)} km/h`, color: "#8b5cf6" },
            { icon: "fa-circle-stop", label: "Stops detected", value: result.stopsDetected, color: "#10b981" },
            { icon: "fa-circle-nodes", label: "Clusters formed", value: result.clustersFormed, color: "#0ea5e9" },
            { icon: "fa-route", label: "Trip legs", value: result.tripLegsDetected, color: "#f59e0b" },
            { icon: "fa-road", label: "Cluster radius", value: `${Math.round(Number(result.settingsClusterRadiusMeters || playground.clusterRadiusMeters || 0))} m`, color: "#ca8a04" },
        ];
    }, [playground.clusterRadiusMeters, result, detectionMode]);

    return (
        <div className="tw-flex tw-flex-col tw-gap-5 lg:tw-flex-row lg:tw-items-start">
            {/* ─── LEFT SIDEBAR  (1/4) ─── */}
            <aside className="tw-w-full tw-flex-shrink-0 lg:tw-w-1/4 lg:tw-sticky lg:tw-top-4">
                <section className="tw-overflow-hidden tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm">
                    {/* Vehicle / date range */}
                    <div className="tw-border-b tw-border-slate-200 tw-bg-[linear-gradient(135deg,#fcfdff_0%,#f4f8ff_48%,#eef5ff_100%)] tw-p-4">
                        <div className="tw-mb-3">
                            <div className="tw-flex tw-items-center tw-gap-1 tw-rounded-full tw-border tw-border-slate-200 tw-bg-white/90 tw-p-0.5">
                                <button
                                    type="button"
                                    onClick={() => { setDetectionMode("cluster"); setResult(null); setSelection(null); setPlaybackIndex(null); setIsPlaying(false); hasRunRef.current = false; }}
                                    className={`tw-flex-1 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-transition-colors ${detectionMode === "cluster"
                                        ? "tw-bg-sky-600 tw-text-white tw-shadow-sm"
                                        : "tw-text-slate-500 hover:tw-bg-slate-50"
                                        }`}
                                >
                                    <i className="fa-light fa-radar tw-mr-1" />
                                    Cluster
                                </button>
                                <button
                                    type="button"
                                    onClick={() => { setDetectionMode("geofence"); setResult(null); setSelection(null); setPlaybackIndex(null); setIsPlaying(false); hasRunRef.current = false; }}
                                    className={`tw-flex-1 tw-rounded-full tw-px-2.5 tw-py-1 tw-text-[10px] tw-font-semibold tw-uppercase tw-tracking-[0.12em] tw-transition-colors ${detectionMode === "geofence"
                                        ? "tw-bg-emerald-600 tw-text-white tw-shadow-sm"
                                        : "tw-text-slate-500 hover:tw-bg-slate-50"
                                        }`}
                                >
                                    <i className="fa-light fa-draw-polygon tw-mr-1" />
                                    Geofence
                                </button>
                            </div>
                        </div>

                        <div className="tw-space-y-3">
                            {detectionMode === "geofence" && geofenceGroups.length > 0 && (
                                <div>
                                    <label className="tw-mb-1 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-600">
                                        <i className="fa-light fa-layer-group tw-mr-1" />
                                        Geofence group
                                    </label>
                                    <select
                                        value={selectedGeofenceGroupId ?? ""}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setSelectedGeofenceGroupId(val ? Number(val) : null);
                                            setGeofenceTrackSource(null);
                                            setResult(null);
                                            hasRunRef.current = false;
                                        }}
                                        disabled={running}
                                        className="tw-w-full tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-text-slate-700 focus:tw-border-emerald-400 focus:tw-outline-none focus:tw-ring-1 focus:tw-ring-emerald-400"
                                    >
                                        <option value="">All sites (no group filter)</option>
                                        {geofenceGroups.map((g) => (
                                            <option key={g.groupId ?? g.id ?? g.Id} value={g.groupId ?? g.id ?? g.Id}>
                                                {g.groupName ?? g.name ?? g.Name ?? `Group ${g.groupId ?? g.id}`}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            )}
                            <div>
                                <label className="tw-mb-1 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-600">Vehicle</label>
                                <VehicleSearchableSelector
                                    value={vehicleId}
                                    onValueChanged={(event) => setVehicleId(event.value)}
                                    placeholder="Search vehicle..."
                                    disabled={running}
                                />
                            </div>
                            <div>
                                <label className="tw-mb-1 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-600">Date (UTC)</label>
                                <DateBox
                                    type="date"
                                    value={selectedDate}
                                    onValueChanged={(event) => setSelectedDate(event.value)}
                                    placeholder="dd/mm/yyyy"
                                    width="100%"
                                    disabled={running}
                                    displayFormat="dd/MM/yyyy"
                                />
                            </div>
                            <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                                <div>
                                    <label className="tw-mb-1 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-600">From</label>
                                    <DateBox
                                        type="time"
                                        value={timeFrom}
                                        onValueChanged={(event) => setTimeFrom(event.value)}
                                        placeholder="HH:mm"
                                        width="100%"
                                        disabled={running}
                                        displayFormat="HH:mm"
                                    />
                                </div>
                                <div>
                                    <label className="tw-mb-1 tw-block tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-600">To</label>
                                    <DateBox
                                        type="time"
                                        value={timeTo}
                                        onValueChanged={(event) => setTimeTo(event.value)}
                                        placeholder="HH:mm"
                                        width="100%"
                                        disabled={running}
                                        displayFormat="HH:mm"
                                    />
                                </div>
                            </div>
                            <Button
                                text={running ? "Loading..." : "Fetch & detect"}
                                icon="fa-light fa-download"
                                type="default"
                                disabled={!canRun}
                                onClick={handleRun}
                                width="100%"
                            />
                        </div>

                        {hasLoadedTrackSource && (
                            <div className="tw-mt-3 tw-text-[11px] tw-text-slate-500">
                                <i className="fa-light fa-circle-check tw-mr-1 tw-text-emerald-600" />
                                {activeTrackSource?.trackPoints?.length ?? 0} pts cached
                            </div>
                        )}
                    </div>

                    {/* Detection thresholds */}
                    <div className="tw-p-4">
                        <div className="tw-mb-3 tw-flex tw-items-center tw-justify-between tw-gap-2">
                            <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-violet-600">Thresholds</div>
                            <div className="tw-flex tw-items-center tw-gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowHelp((prev) => !prev)}
                                    title="Toggle setting descriptions"
                                    className={`tw-inline-flex tw-items-center tw-justify-center tw-h-6 tw-w-6 tw-rounded-lg tw-border tw-text-[11px] tw-transition-colors ${showHelp
                                        ? "tw-border-sky-300 tw-bg-sky-50 tw-text-sky-700"
                                        : "tw-border-slate-200 tw-bg-white tw-text-slate-400 hover:tw-bg-slate-50 hover:tw-text-slate-600"
                                        }`}
                                >
                                    <i className="fa-light fa-circle-question" />
                                </button>
                                <button
                                    type="button"
                                    onClick={detectionMode === "cluster" ? resetPlayground : resetGeofencePlayground}
                                    className="tw-inline-flex tw-items-center tw-gap-1 tw-rounded-lg tw-border tw-border-violet-200 tw-bg-violet-50 tw-px-2.5 tw-py-1 tw-text-[11px] tw-font-semibold tw-text-violet-700 hover:tw-bg-violet-100"
                                >
                                    <i className="fa-light fa-rotate-left" />
                                    Reset
                                </button>
                            </div>
                        </div>

                        {showHelp && (
                            <div className="tw-mb-3 tw-rounded-lg tw-border tw-border-sky-200 tw-bg-sky-50/60 tw-p-3">
                                <div className="tw-mb-2 tw-flex tw-items-center tw-gap-1.5">
                                    <i className="fa-light fa-circle-info tw-text-sky-600" />
                                    <span className="tw-text-[11px] tw-font-semibold tw-text-sky-800">
                                        {detectionMode === "cluster" ? "Cluster detection" : "Geofence detection"} — how it works
                                    </span>
                                </div>
                                <p className="tw-text-[11px] tw-leading-relaxed tw-text-sky-900/80 tw-mb-2">
                                    {detectionMode === "cluster"
                                        ? "Cluster detection finds trips by identifying where a vehicle stops (speed below threshold), grouping nearby stops into clusters (e.g. a quarry or depot), then building trip legs between clusters."
                                        : "Geofence detection finds trips by testing each GPS point against predefined site boundaries (polygons or circles). When the vehicle exits one site and enters another, a trip leg is created."}
                                </p>
                                <div className="tw-space-y-1.5">
                                    {(detectionMode === "cluster" ? PLAYGROUND_FIELDS : GEOFENCE_PLAYGROUND_FIELDS).map((field) => (
                                        <div key={field.key} className="tw-flex tw-gap-2">
                                            <span className="tw-text-[10px] tw-font-bold tw-text-sky-700 tw-whitespace-nowrap tw-min-w-[100px]">{field.label}</span>
                                            <span className="tw-text-[10px] tw-text-sky-900/70 tw-leading-snug">{field.help}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="tw-space-y-2.5">
                            {detectionMode === "cluster"
                                ? PLAYGROUND_FIELDS.map((field) => (
                                    <ThresholdSlider
                                        key={field.key}
                                        field={field}
                                        value={playground[field.key]}
                                        onChange={updatePlayground}
                                        disabled={running}
                                    />
                                ))
                                : GEOFENCE_PLAYGROUND_FIELDS.map((field) => (
                                    <ThresholdSlider
                                        key={field.key}
                                        field={field}
                                        value={geofencePlayground[field.key]}
                                        onChange={updateGeofencePlayground}
                                        disabled={running}
                                    />
                                ))
                            }
                        </div>
                    </div>

                    {/* Compact metrics below thresholds */}
                    {result && (
                        <div className="tw-border-t tw-border-slate-200 tw-p-4">
                            <div className="tw-mb-2 tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-[0.18em] tw-text-slate-400">Results</div>
                            <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                                {summaryCards.map((card) => (
                                    <div key={card.label} className="tw-flex tw-items-center tw-gap-2 tw-rounded-lg tw-border tw-border-slate-100 tw-bg-slate-50 tw-px-2.5 tw-py-2">
                                        <span className="tw-text-xs" style={{ color: card.color }}>
                                            <i className={`fa-light ${card.icon}`} />
                                        </span>
                                        <div className="tw-min-w-0">
                                            <div className="tw-font-mono tw-text-sm tw-font-semibold tw-text-slate-900 tw-truncate">{card.value ?? "—"}</div>
                                            <div className="tw-text-[9px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-400 tw-truncate">{card.label}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </section>
            </aside>

            {/* ─── RIGHT CONTENT  (3/4) ─── */}
            <div className="tw-min-w-0 tw-flex-1">
                <LoadPanel visible={running} message={hasLoadedTrackSource ? "Replaying detection..." : "Loading track data..."} />

                {!result && !running && (
                    <div className="tw-flex tw-h-[460px] tw-items-center tw-justify-center tw-rounded-2xl tw-border tw-border-dashed tw-border-slate-300 tw-bg-slate-50">
                        <div className="tw-text-center">
                            <i className="fa-light fa-map-location-dot tw-text-3xl tw-text-slate-300" />
                            <p className="tw-mt-2 tw-text-sm tw-text-slate-400">Select a vehicle and date range, then fetch to preview</p>
                        </div>
                    </div>
                )}

                {result && (
                    <div className="tw-space-y-5">
                        {/* Playback controls */}
                        <div className="tw-flex tw-items-center tw-gap-3 tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-px-4 tw-py-2.5 tw-shadow-sm">
                            <button
                                type="button"
                                onClick={handlePlayback}
                                className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-sky-200 tw-bg-sky-50 tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-sky-700 hover:tw-bg-sky-100"
                            >
                                <i className={`fa-light ${isPlaying ? "fa-pause" : "fa-play"}`} />
                                {isPlaying ? "Pause" : "Play trip"}
                            </button>
                            {playbackIndex != null && (
                                <button
                                    type="button"
                                    onClick={handlePlaybackStop}
                                    className="tw-inline-flex tw-items-center tw-gap-1.5 tw-rounded-lg tw-border tw-border-slate-200 tw-bg-white tw-px-3 tw-py-1.5 tw-text-xs tw-font-semibold tw-text-slate-600 hover:tw-bg-slate-50"
                                >
                                    <i className="fa-light fa-stop" />
                                    Stop
                                </button>
                            )}
                            <div className="tw-flex tw-items-center tw-gap-0.5 tw-rounded-lg tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-0.5">
                                {[1, 2, 4, 8].map((speed) => (
                                    <button
                                        key={speed}
                                        type="button"
                                        onClick={() => setPlaybackSpeed(speed)}
                                        className={`tw-rounded-md tw-px-2 tw-py-1 tw-text-[10px] tw-font-bold tw-transition-colors ${playbackSpeed === speed
                                            ? "tw-bg-sky-600 tw-text-white tw-shadow-sm"
                                            : "tw-text-slate-500 hover:tw-bg-slate-100"
                                            }`}
                                    >
                                        {speed}x
                                    </button>
                                ))}
                            </div>
                            {playbackIndex != null && (
                                <div className="tw-flex tw-flex-1 tw-items-center tw-gap-3">
                                    <div className="tw-relative tw-flex-1 tw-h-1.5 tw-rounded-full tw-bg-slate-200">
                                        <div
                                            className="tw-h-full tw-rounded-full tw-bg-sky-500 tw-transition-[width] tw-duration-75"
                                            style={{ width: `${((playbackIndex + 1) / (playbackPoints.length || 1)) * 100}%` }}
                                        />
                                    </div>
                                    <span className="tw-font-mono tw-text-[11px] tw-text-slate-500 tw-whitespace-nowrap">
                                        {playbackIndex + 1} / {playbackPoints.length}
                                    </span>
                                </div>
                            )}
                        </div>

                        <ClusterDetectionPreviewMap
                            preview={result}
                            siteLookup={siteLookup}
                            selection={selection}
                            playbackIndex={playbackIndex}
                            detectionMode={detectionMode}
                        />

                        <ClusterDetectionPreviewCharts
                            preview={result}
                            stopSpeedThreshold={detectionMode === "cluster" ? playground.stopSpeedThresholdKph : 0}
                            playbackIndex={playbackIndex}
                            detectionMode={detectionMode}
                        />

                        <ClusterDetectionPreviewResults
                            preview={result}
                            selection={selection}
                            onSelectionChange={setSelection}
                            playbackStopIndex={playbackStopIndex}
                            detectionMode={detectionMode}
                        />
                    </div>
                )}
            </div>
        </div>
    );
};

export default ClusterDetectionPreviewPanel;
