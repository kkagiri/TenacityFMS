/**
 * File:          VehicleTrackingTripAnalysisPanel.js
 * Purpose:       Dock panel that runs trip detection (Cluster or Geofence) locally against the
 *                track points already loaded by the tracking workspace, shows detected stops /
 *                clusters / legs, and lets the operator commit the result via recompute.
 * Dependencies:  React, DevExtreme controls, buildFrontendClusterPreview, buildFrontendGeofencePreview,
 *                fetchTripSiteLookup, recomputeVehicleTrips
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - VehicleTrackingTripAnalysisPanel(): Map-integrated replacement for the standalone preview page.
 * - runAnalysis(): Executes the chosen detection mode locally from already-loaded points.
 * - saveAsTrips(): Promotes the tuned thresholds by asking the backend to recompute the same range.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from 'devextreme-react/button';
import NumberBox from 'devextreme-react/number-box';
import notify from 'devextreme/ui/notify';
import {
    buildFrontendClusterPreview,
} from '../../utils/clusterDetectionPlayground';
import {
    buildFrontendGeofencePreview,
} from '../../utils/geofenceDetectionPlayground';
import {
    fetchTripSiteLookup,
    recomputeVehicleTrips,
} from '../../../trips/services/vehicleTripService';

const DEFAULT_CLUSTER = {
    stopSpeedThresholdKph: 3,
    minimumStopDurationMinutes: 1.5,
    minimumTripDistanceKm: 0.5,
    minimumTripDurationMinutes: 2,
    clusterRadiusMeters: 150,
};

const DEFAULT_GEOFENCE = {
    minimumTripDistanceKm: 0.5,
    minimumTripDurationMinutes: 2,
};

const getPointTimestamp = (point) => {
    const raw = point?.timestamp ?? point?.Timestamp;
    if (!raw) return null;
    const date = raw instanceof Date ? raw : new Date(raw);
    return Number.isNaN(date.getTime()) ? null : date;
};

const getPointRange = (points) => {
    let min = null;
    let max = null;
    for (const point of points) {
        const ts = getPointTimestamp(point);
        if (!ts) continue;
        if (!min || ts < min) min = ts;
        if (!max || ts > max) max = ts;
    }
    return { min, max };
};

const VehicleTrackingTripAnalysisPanel = ({
    trackedVehicles = [],
    activeTrackPoints = [],
    onAnalysisResultChange,
}) => {
    const [mode, setMode] = useState('cluster');
    const [clusterSettings, setClusterSettings] = useState(DEFAULT_CLUSTER);
    const [geofenceSettings, setGeofenceSettings] = useState(DEFAULT_GEOFENCE);
    const [selectedVehicleId, setSelectedVehicleId] = useState(null);
    const [siteGeofences, setSiteGeofences] = useState([]);
    const [result, setResult] = useState(null);
    const [isSaving, setIsSaving] = useState(false);

    // Auto-pick single tracked vehicle
    useEffect(() => {
        if (trackedVehicles.length === 1) {
            setSelectedVehicleId(trackedVehicles[0].id);
        } else if (trackedVehicles.length === 0) {
            setSelectedVehicleId(null);
        } else if (!trackedVehicles.some((v) => v.id === selectedVehicleId)) {
            setSelectedVehicleId(trackedVehicles[0].id);
        }
    }, [trackedVehicles, selectedVehicleId]);

    // Load site geofences once (only when geofence mode is first used)
    useEffect(() => {
        if (mode !== 'geofence' || siteGeofences.length > 0) return;
        let cancelled = false;
        (async () => {
            try {
                const sites = await fetchTripSiteLookup();
                if (!cancelled) setSiteGeofences(Array.isArray(sites) ? sites : []);
            } catch {
                /* empty site list is fine — detector will report 0 visits */
            }
        })();
        return () => { cancelled = true; };
    }, [mode, siteGeofences.length]);

    const pointsForSelectedVehicle = useMemo(() => {
        if (!selectedVehicleId) return [];
        if (activeTrackPoints.length === 0) return [];

        // If track points are already scoped to one vehicle, take them as-is.
        const tagged = activeTrackPoints.filter(
            (p) => p.vehicleId === selectedVehicleId || p.VehicleId === selectedVehicleId,
        );
        return tagged.length > 0 ? tagged : activeTrackPoints;
    }, [activeTrackPoints, selectedVehicleId]);

    const { min: fromUtc, max: toUtc } = useMemo(
        () => getPointRange(pointsForSelectedVehicle),
        [pointsForSelectedVehicle],
    );

    const canAnalyze = Boolean(
        selectedVehicleId && pointsForSelectedVehicle.length >= 2,
    );
    const canSave = Boolean(result && fromUtc && toUtc && selectedVehicleId && !isSaving);

    const runAnalysis = useCallback(() => {
        if (!canAnalyze) return;

        const selectedVehicle = trackedVehicles.find((v) => v.id === selectedVehicleId);
        const sourcePreview = {
            vehicleId: selectedVehicleId,
            vehicleName: selectedVehicle?.trackingCode || `Vehicle #${selectedVehicleId}`,
            fromUtc: fromUtc ? fromUtc.toISOString() : null,
            toUtc: toUtc ? toUtc.toISOString() : null,
            trackPoints: pointsForSelectedVehicle,
            siteGeofences,
        };

        const preview = mode === 'cluster'
            ? buildFrontendClusterPreview({
                sourcePreview,
                settings: clusterSettings,
                sites: siteGeofences,
            })
            : buildFrontendGeofencePreview({
                sourcePreview,
                settings: geofenceSettings,
            });

        setResult({ mode, preview });
        onAnalysisResultChange?.({ mode, preview, selectedVehicleId });
    }, [
        canAnalyze, clusterSettings, fromUtc, geofenceSettings, mode,
        onAnalysisResultChange, pointsForSelectedVehicle, selectedVehicleId,
        siteGeofences, toUtc, trackedVehicles,
    ]);

    const saveAsTrips = useCallback(async () => {
        if (!canSave) return;
        setIsSaving(true);
        try {
            await recomputeVehicleTrips({
                vehicleId: selectedVehicleId,
                fromUtc: fromUtc.toISOString(),
                toUtc: toUtc.toISOString(),
            });
            notify('Trips recomputed and saved for this vehicle and range.', 'success', 3500);
        } catch (error) {
            notify(`Failed to save trips: ${error?.message || 'Unknown error'}`, 'error', 5000);
        } finally {
            setIsSaving(false);
        }
    }, [canSave, fromUtc, selectedVehicleId, toUtc]);

    const summary = result
        ? result.mode === 'cluster'
            ? {
                stops: result.preview.stopsDetected ?? 0,
                clusters: result.preview.clustersFormed ?? 0,
                legs: result.preview.tripLegsDetected ?? 0,
            }
            : {
                stops: result.preview.summary?.siteVisitsDetected ?? 0,
                clusters: result.preview.siteGeofences?.length ?? 0,
                legs: result.preview.summary?.tripLegsDetected ?? 0,
            }
        : null;

    return (
        <div className="tw-flex tw-h-full tw-flex-col tw-overflow-auto tw-bg-[#faf9f8] tw-p-4 tw-gap-4">
            <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-text-[13px] tw-font-semibold tw-text-[#201f1e]">Trip Analysis</div>
                <div className="tw-inline-flex tw-overflow-hidden tw-rounded tw-border tw-border-[#c8c6c4]">
                    <button
                        type="button"
                        className={`tw-px-3 tw-py-1 tw-text-[12px] ${mode === 'cluster' ? 'tw-bg-[#0078d4] tw-text-white' : 'tw-bg-white tw-text-[#323130]'}`}
                        onClick={() => setMode('cluster')}
                    >
                        Cluster
                    </button>
                    <button
                        type="button"
                        className={`tw-px-3 tw-py-1 tw-text-[12px] ${mode === 'geofence' ? 'tw-bg-[#0078d4] tw-text-white' : 'tw-bg-white tw-text-[#323130]'}`}
                        onClick={() => setMode('geofence')}
                    >
                        Geofence
                    </button>
                </div>
            </div>

            <div className="tw-rounded-md tw-border tw-border-[#edebe9] tw-bg-white tw-p-3">
                <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#605e5c] tw-mb-2">
                    Data source
                </div>
                <div className="tw-text-[12px] tw-text-[#323130]">
                    {trackedVehicles.length === 0 && 'No vehicles tracked. Select a vehicle in the Vehicles panel.'}
                    {trackedVehicles.length > 0 && activeTrackPoints.length === 0 && (
                        'Load track points in the Track Points panel first.'
                    )}
                    {pointsForSelectedVehicle.length > 0 && (
                        <>
                            <div><strong>{pointsForSelectedVehicle.length}</strong> track points loaded</div>
                            {fromUtc && toUtc && (
                                <div className="tw-text-[#605e5c]">
                                    {fromUtc.toLocaleString()} → {toUtc.toLocaleString()}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {mode === 'cluster' ? (
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <NumberBox
                        label="Stop speed (km/h)"
                        labelMode="floating"
                        stylingMode="outlined"
                        value={clusterSettings.stopSpeedThresholdKph}
                        min={0} max={50} step={0.5}
                        onValueChanged={(e) => setClusterSettings((s) => ({ ...s, stopSpeedThresholdKph: Number(e.value) || 0 }))}
                    />
                    <NumberBox
                        label="Min stop (min)"
                        labelMode="floating"
                        stylingMode="outlined"
                        value={clusterSettings.minimumStopDurationMinutes}
                        min={0.1} max={60} step={0.5}
                        onValueChanged={(e) => setClusterSettings((s) => ({ ...s, minimumStopDurationMinutes: Number(e.value) || 0 }))}
                    />
                    <NumberBox
                        label="Min trip distance (km)"
                        labelMode="floating"
                        stylingMode="outlined"
                        value={clusterSettings.minimumTripDistanceKm}
                        min={0} max={100} step={0.1}
                        onValueChanged={(e) => setClusterSettings((s) => ({ ...s, minimumTripDistanceKm: Number(e.value) || 0 }))}
                    />
                    <NumberBox
                        label="Min trip duration (min)"
                        labelMode="floating"
                        stylingMode="outlined"
                        value={clusterSettings.minimumTripDurationMinutes}
                        min={0} max={1440} step={1}
                        onValueChanged={(e) => setClusterSettings((s) => ({ ...s, minimumTripDurationMinutes: Number(e.value) || 0 }))}
                    />
                    <NumberBox
                        label="Cluster radius (m)"
                        labelMode="floating"
                        stylingMode="outlined"
                        value={clusterSettings.clusterRadiusMeters}
                        min={10} max={5000} step={10}
                        onValueChanged={(e) => setClusterSettings((s) => ({ ...s, clusterRadiusMeters: Number(e.value) || 0 }))}
                    />
                </div>
            ) : (
                <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                    <NumberBox
                        label="Min trip distance (km)"
                        labelMode="floating"
                        stylingMode="outlined"
                        value={geofenceSettings.minimumTripDistanceKm}
                        min={0} max={100} step={0.1}
                        onValueChanged={(e) => setGeofenceSettings((s) => ({ ...s, minimumTripDistanceKm: Number(e.value) || 0 }))}
                    />
                    <NumberBox
                        label="Min trip duration (min)"
                        labelMode="floating"
                        stylingMode="outlined"
                        value={geofenceSettings.minimumTripDurationMinutes}
                        min={0} max={1440} step={1}
                        onValueChanged={(e) => setGeofenceSettings((s) => ({ ...s, minimumTripDurationMinutes: Number(e.value) || 0 }))}
                    />
                </div>
            )}

            <div className="tw-flex tw-gap-2">
                <Button
                    text="Run analysis"
                    icon="fa-light fa-play"
                    type="default"
                    stylingMode="contained"
                    disabled={!canAnalyze}
                    onClick={runAnalysis}
                />
                <Button
                    text={isSaving ? 'Saving...' : 'Save as trips'}
                    icon="fa-light fa-floppy-disk"
                    type="success"
                    stylingMode="contained"
                    disabled={!canSave}
                    onClick={saveAsTrips}
                />
            </div>

            {summary && (
                <div className="tw-rounded-md tw-border tw-border-[#edebe9] tw-bg-white tw-p-3">
                    <div className="tw-text-[11px] tw-font-semibold tw-uppercase tw-tracking-wide tw-text-[#605e5c] tw-mb-2">
                        Result ({result.mode})
                    </div>
                    <div className="tw-grid tw-grid-cols-3 tw-gap-3 tw-text-center">
                        <div>
                            <div className="tw-text-[20px] tw-font-semibold tw-text-[#0078d4]">{summary.stops}</div>
                            <div className="tw-text-[11px] tw-text-[#605e5c]">{result.mode === 'cluster' ? 'Stops' : 'Site visits'}</div>
                        </div>
                        <div>
                            <div className="tw-text-[20px] tw-font-semibold tw-text-[#107c10]">{summary.clusters}</div>
                            <div className="tw-text-[11px] tw-text-[#605e5c]">{result.mode === 'cluster' ? 'Clusters' : 'Sites'}</div>
                        </div>
                        <div>
                            <div className="tw-text-[20px] tw-font-semibold tw-text-[#ca5010]">{summary.legs}</div>
                            <div className="tw-text-[11px] tw-text-[#605e5c]">Trip legs</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default VehicleTrackingTripAnalysisPanel;
