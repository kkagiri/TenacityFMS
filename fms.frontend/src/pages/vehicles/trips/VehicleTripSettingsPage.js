/**
 * File: VehicleTripSettingsPage.js
 * Purpose: Manages VehicleTrips runtime settings for realtime execution, reconciliation scheduling, fuel enrichment, and confidence scoring.
 * Dependencies: React, DevExtreme controls, vehicleTripService, usePermissions.
 * Last Modified: 2026-03-14
 */
import React, { useCallback, useEffect, useState } from "react";
import Button from "devextreme-react/button";
import CheckBox from "devextreme-react/check-box";
import LoadIndicator from "devextreme-react/load-indicator";
import NumberBox from "devextreme-react/number-box";
import notify from "devextreme/ui/notify";
import { useNavigate } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  fetchVehicleTripSettings,
  updateVehicleTripSettings,
} from "./services/vehicleTripService";
import VehicleTripReconciliationSettingsTab from "./components/VehicleTripReconciliationSettingsTab";
import ClusterDetectionPreviewPanel from "./components/ClusterDetectionPreviewPanel";
import { vehicleRoutes } from "../utils/navigationHelper";

const getDefaultSettings = () => ({
  enableRealtimeStateMachineExecution: true,
  defaultEnableRealtimeStateMachineExecution: true,
  enableScheduledReconciliation: true,
  defaultEnableScheduledReconciliation: true,
  reconciliationDailyRunTimeLocal: "00:30",
  defaultReconciliationDailyRunTimeLocal: "00:30",
  reconciliationLookbackDays: 1,
  defaultReconciliationLookbackDays: 1,
  enableFuelContextEnrichment: true,
  defaultEnableFuelContextEnrichment: true,
  fuelLookupWindowHours: 2.0,
  defaultFuelLookupWindowHours: 2.0,
  confidenceUnknownEndpointPenalty: 0.25,
  defaultConfidenceUnknownEndpointPenalty: 0.25,
  confidenceShortTripPenalty: 0.1,
  defaultConfidenceShortTripPenalty: 0.1,
  confidenceHighSpeedPenalty: 0.2,
  defaultConfidenceHighSpeedPenalty: 0.2,
  confidenceMissingFuelPenalty: 0.1,
  defaultConfidenceMissingFuelPenalty: 0.1,
  confidenceWeakFuelPenalty: 0.05,
  defaultConfidenceWeakFuelPenalty: 0.05,
  confidenceMinimumScore: 0.1,
  defaultConfidenceMinimumScore: 0.1,
  confidenceHighBandThreshold: 0.85,
  defaultConfidenceHighBandThreshold: 0.85,
  confidenceMediumBandThreshold: 0.6,
  defaultConfidenceMediumBandThreshold: 0.6,
  confidenceHighSpeedThresholdKph: 120,
  defaultConfidenceHighSpeedThresholdKph: 120,
  confidenceShortTripDistanceThresholdKm: 1,
  defaultConfidenceShortTripDistanceThresholdKm: 1,
  confidenceShortTripDurationThresholdMinutes: 5,
  defaultConfidenceShortTripDurationThresholdMinutes: 5,
  confidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter: 3,
  defaultConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter: 3,
  confidenceLoadCycleReturnFuelRateThresholdKmPerLiter: 3.5,
  defaultConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter: 3.5,
  clusterBatchStopSpeedThresholdKph: 3,
  defaultClusterBatchStopSpeedThresholdKph: 3,
  clusterBatchMinimumStopDurationMinutes: 1.5,
  defaultClusterBatchMinimumStopDurationMinutes: 1.5,
  clusterBatchMinimumTripDistanceKm: 0.5,
  defaultClusterBatchMinimumTripDistanceKm: 0.5,
  clusterBatchMinimumTripDurationMinutes: 2,
  defaultClusterBatchMinimumTripDurationMinutes: 2,
  clusterBatchClusterRadiusMeters: 150,
  defaultClusterBatchClusterRadiusMeters: 150,
  clusterBatchMaxTrackPoints: 5000,
  defaultClusterBatchMaxTrackPoints: 5000,
  clusterRealtimeStopSpeedThresholdKph: 5,
  defaultClusterRealtimeStopSpeedThresholdKph: 5,
  clusterRealtimeStopDurationPoints: 3,
  defaultClusterRealtimeStopDurationPoints: 3,
  clusterRealtimeMovingDurationPoints: 2,
  defaultClusterRealtimeMovingDurationPoints: 2,
  clusterRealtimeClusterMatchRadiusKm: 0.15,
  defaultClusterRealtimeClusterMatchRadiusKm: 0.15,
  configurationKey: "VehicleTrips.RealtimeStateMachineExecution.Enabled",
  description: "VehicleTrips enrichment, reconciliation scheduling, scoring, and realtime execution settings.",
  updatedAtUtc: null,
  updatedBy: "System",
});

const NUMBER_FIELDS = [
  {
    key: "fuelLookupWindowHours",
    label: "Fuel lookup window (hours)",
    hint: "Time window used when fuel readings are matched to trip start and end events.",
    min: 0.25,
    max: 24,
    step: 0.25,
    format: "#0.##",
  },
  {
    key: "confidenceUnknownEndpointPenalty",
    label: "Unknown endpoint penalty",
    hint: "Penalty applied when the origin or destination site is missing.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceShortTripPenalty",
    label: "Short trip penalty",
    hint: "Penalty applied when the trip falls below minimum duration or distance.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceHighSpeedPenalty",
    label: "High speed penalty",
    hint: "Penalty applied when max speed exceeds the configured threshold.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceMissingFuelPenalty",
    label: "Missing fuel penalty",
    hint: "Penalty applied when no fuel telemetry is attached to the trip.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceWeakFuelPenalty",
    label: "Weak fuel penalty",
    hint: "Penalty applied when fuel telemetry is marked weak or derived.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceMinimumScore",
    label: "Minimum confidence floor",
    hint: "Lowest confidence score a trip can retain after penalties are applied.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceHighBandThreshold",
    label: "High band threshold",
    hint: "Trips at or above this score are classified as High confidence.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceMediumBandThreshold",
    label: "Medium band threshold",
    hint: "Trips below High but at or above this score are classified as Medium confidence.",
    min: 0,
    max: 1,
    step: 0.01,
    format: "#0.00",
  },
  {
    key: "confidenceHighSpeedThresholdKph",
    label: "High speed threshold (km/h)",
    hint: "Trips above this speed are treated as potential GPS spikes or gaps.",
    min: 1,
    max: 500,
    step: 1,
    format: "#0.##",
  },
  {
    key: "confidenceShortTripDistanceThresholdKm",
    label: "Short trip distance threshold (km)",
    hint: "Trips shorter than this are treated as short-distance movements.",
    min: 0,
    max: 100,
    step: 0.1,
    format: "#0.##",
  },
  {
    key: "confidenceShortTripDurationThresholdMinutes",
    label: "Short trip duration threshold (minutes)",
    hint: "Trips shorter than this are treated as short-duration movements.",
    min: 0,
    max: 1440,
    step: 1,
    format: "#0.##",
  },
  {
    key: "confidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter",
    label: "Loaded leg suspicious fuel-rate threshold",
    hint: "Load-cycle legs at or below this rate are flagged as suspicious.",
    min: 0,
    max: 100,
    step: 0.1,
    format: "#0.##",
  },
  {
    key: "confidenceLoadCycleReturnFuelRateThresholdKmPerLiter",
    label: "Return leg fuel-rate threshold",
    hint: "Return legs at or above this rate are compared against loaded legs for anomaly detection.",
    min: 0,
    max: 100,
    step: 0.1,
    format: "#0.##",
  },
];

const SETTINGS_TABS = [
  {
    id: "runtime",
    label: "Runtime controls",
    icon: "fa-light fa-sliders-up",
  },
  {
    id: "reconciliation",
    label: "Reconciliation job",
    icon: "fa-light fa-clock-rotate-left",
  },
  {
    id: "cluster",
    label: "Cluster detection",
    icon: "fa-light fa-circle-nodes",
  },
];

const CLUSTER_BATCH_FIELDS = [
  {
    key: "clusterBatchStopSpeedThresholdKph",
    label: "Stop speed threshold (km/h)",
    hint: "GPS points at or below this speed are treated as stationary during batch stop extraction.",
    min: 0,
    max: 50,
    step: 0.5,
    format: "#0.#",
  },
  {
    key: "clusterBatchMinimumStopDurationMinutes",
    label: "Minimum stop duration (minutes)",
    hint: "Minimum dwell time for a stop to be recorded during batch detection.",
    min: 0.1,
    max: 60,
    step: 0.5,
    format: "#0.#",
  },
  {
    key: "clusterBatchMinimumTripDistanceKm",
    label: "Minimum trip distance (km)",
    hint: "Cluster-to-cluster movement must exceed this distance to count as a trip leg.",
    min: 0,
    max: 100,
    step: 0.1,
    format: "#0.##",
  },
  {
    key: "clusterBatchMinimumTripDurationMinutes",
    label: "Minimum trip duration (minutes)",
    hint: "Cluster-to-cluster movement must exceed this duration to count as a trip leg.",
    min: 0,
    max: 1440,
    step: 1,
    format: "#0.##",
  },
  {
    key: "clusterBatchClusterRadiusMeters",
    label: "Cluster radius (meters)",
    hint: "Nearby stops within this distance are grouped into the same spatial cluster.",
    min: 10,
    max: 5000,
    step: 10,
    format: "#0",
  },
  {
    key: "clusterBatchMaxTrackPoints",
    label: "Max track points",
    hint: "Maximum GPS track points fetched per vehicle per date range during batch detection.",
    min: 100,
    max: 50000,
    step: 500,
    format: "#0",
  },
];

const CLUSTER_REALTIME_FIELDS = [
  {
    key: "clusterRealtimeStopSpeedThresholdKph",
    label: "Stop speed threshold (km/h)",
    hint: "GPS points at or below this speed are treated as stationary in the realtime state machine.",
    min: 0,
    max: 50,
    step: 0.5,
    format: "#0.#",
  },
  {
    key: "clusterRealtimeStopDurationPoints",
    label: "Stop duration points",
    hint: "Consecutive low-speed GPS points required to detect a stop in the realtime state machine.",
    min: 1,
    max: 50,
    step: 1,
    format: "#0",
  },
  {
    key: "clusterRealtimeMovingDurationPoints",
    label: "Moving duration points",
    hint: "Consecutive high-speed GPS points required to transition from stopped to moving.",
    min: 1,
    max: 50,
    step: 1,
    format: "#0",
  },
  {
    key: "clusterRealtimeClusterMatchRadiusKm",
    label: "Cluster match radius (km)",
    hint: "Radius used to match an incoming stop to an existing cluster in the realtime state machine.",
    min: 0.01,
    max: 10,
    step: 0.01,
    format: "#0.##",
  },
];

const NumberSettingCard = ({ field, value, defaultValue, disabled, onChange }) => (
  <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-space-y-2">
    <div>
      <div className="tw-text-sm tw-font-semibold tw-text-slate-900">{field.label}</div>
      <div className="tw-mt-1 tw-text-sm tw-text-slate-600">{field.hint}</div>
    </div>
    <NumberBox
      value={value}
      min={field.min}
      max={field.max}
      step={field.step}
      format={field.format}
      showSpinButtons={true}
      width="100%"
      disabled={disabled}
      onValueChanged={(event) => onChange(field.key, event.value)}
    />
    <div className="tw-text-xs tw-text-slate-500">Default: {defaultValue}</div>
  </div>
);

const VehicleTripSettingsPage = () => {
  const navigate = useNavigate();
  const { hasAnyPermission } = usePermissions();
  const canViewSettings = hasAnyPermission(["_Read_VehicleTrips", "_Read_Vehicle"]);
  const canEditSettings = hasAnyPermission(["_Edit_VehicleTrips", "_Edit_Vehicle"]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("runtime");
  const [settings, setSettings] = useState(getDefaultSettings());

  const loadSettings = useCallback(async () => {
    if (!canViewSettings) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const data = await fetchVehicleTripSettings();
      setSettings({ ...getDefaultSettings(), ...data });
    } catch (error) {
      notify(error?.message || "Failed to load trip settings", "error", 4000);
    } finally {
      setLoading(false);
    }
  }, [canViewSettings]);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  const handleSave = useCallback(async () => {
    try {
      setSaving(true);
      const updated = await updateVehicleTripSettings({
        enableRealtimeStateMachineExecution: Boolean(settings.enableRealtimeStateMachineExecution),
        enableScheduledReconciliation: Boolean(settings.enableScheduledReconciliation),
        reconciliationDailyRunTimeLocal: settings.reconciliationDailyRunTimeLocal,
        reconciliationLookbackDays: Number(settings.reconciliationLookbackDays),
        enableFuelContextEnrichment: Boolean(settings.enableFuelContextEnrichment),
        fuelLookupWindowHours: Number(settings.fuelLookupWindowHours),
        confidenceUnknownEndpointPenalty: Number(settings.confidenceUnknownEndpointPenalty),
        confidenceShortTripPenalty: Number(settings.confidenceShortTripPenalty),
        confidenceHighSpeedPenalty: Number(settings.confidenceHighSpeedPenalty),
        confidenceMissingFuelPenalty: Number(settings.confidenceMissingFuelPenalty),
        confidenceWeakFuelPenalty: Number(settings.confidenceWeakFuelPenalty),
        confidenceMinimumScore: Number(settings.confidenceMinimumScore),
        confidenceHighBandThreshold: Number(settings.confidenceHighBandThreshold),
        confidenceMediumBandThreshold: Number(settings.confidenceMediumBandThreshold),
        confidenceHighSpeedThresholdKph: Number(settings.confidenceHighSpeedThresholdKph),
        confidenceShortTripDistanceThresholdKm: Number(settings.confidenceShortTripDistanceThresholdKm),
        confidenceShortTripDurationThresholdMinutes: Number(settings.confidenceShortTripDurationThresholdMinutes),
        confidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter: Number(settings.confidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter),
        confidenceLoadCycleReturnFuelRateThresholdKmPerLiter: Number(settings.confidenceLoadCycleReturnFuelRateThresholdKmPerLiter),
        clusterBatchStopSpeedThresholdKph: Number(settings.clusterBatchStopSpeedThresholdKph),
        clusterBatchMinimumStopDurationMinutes: Number(settings.clusterBatchMinimumStopDurationMinutes),
        clusterBatchMinimumTripDistanceKm: Number(settings.clusterBatchMinimumTripDistanceKm),
        clusterBatchMinimumTripDurationMinutes: Number(settings.clusterBatchMinimumTripDurationMinutes),
        clusterBatchClusterRadiusMeters: Number(settings.clusterBatchClusterRadiusMeters),
        clusterBatchMaxTrackPoints: Number(settings.clusterBatchMaxTrackPoints),
        clusterRealtimeStopSpeedThresholdKph: Number(settings.clusterRealtimeStopSpeedThresholdKph),
        clusterRealtimeStopDurationPoints: Number(settings.clusterRealtimeStopDurationPoints),
        clusterRealtimeMovingDurationPoints: Number(settings.clusterRealtimeMovingDurationPoints),
        clusterRealtimeClusterMatchRadiusKm: Number(settings.clusterRealtimeClusterMatchRadiusKm),
      });
      setSettings({ ...getDefaultSettings(), ...updated });
      notify("Trip settings saved successfully", "success", 3000);
    } catch (error) {
      notify(error?.message || "Failed to save trip settings", "error", 4000);
    } finally {
      setSaving(false);
    }
  }, [settings]);

  const handleReset = useCallback(() => {
    setSettings((current) => ({
      ...current,
      enableRealtimeStateMachineExecution: Boolean(current.defaultEnableRealtimeStateMachineExecution),
      enableScheduledReconciliation: Boolean(current.defaultEnableScheduledReconciliation),
      reconciliationDailyRunTimeLocal: current.defaultReconciliationDailyRunTimeLocal || "00:30",
      reconciliationLookbackDays: Number(current.defaultReconciliationLookbackDays),
      enableFuelContextEnrichment: Boolean(current.defaultEnableFuelContextEnrichment),
      fuelLookupWindowHours: Number(current.defaultFuelLookupWindowHours),
      confidenceUnknownEndpointPenalty: Number(current.defaultConfidenceUnknownEndpointPenalty),
      confidenceShortTripPenalty: Number(current.defaultConfidenceShortTripPenalty),
      confidenceHighSpeedPenalty: Number(current.defaultConfidenceHighSpeedPenalty),
      confidenceMissingFuelPenalty: Number(current.defaultConfidenceMissingFuelPenalty),
      confidenceWeakFuelPenalty: Number(current.defaultConfidenceWeakFuelPenalty),
      confidenceMinimumScore: Number(current.defaultConfidenceMinimumScore),
      confidenceHighBandThreshold: Number(current.defaultConfidenceHighBandThreshold),
      confidenceMediumBandThreshold: Number(current.defaultConfidenceMediumBandThreshold),
      confidenceHighSpeedThresholdKph: Number(current.defaultConfidenceHighSpeedThresholdKph),
      confidenceShortTripDistanceThresholdKm: Number(current.defaultConfidenceShortTripDistanceThresholdKm),
      confidenceShortTripDurationThresholdMinutes: Number(current.defaultConfidenceShortTripDurationThresholdMinutes),
      confidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter: Number(current.defaultConfidenceLoadCycleSuspiciousFuelRateThresholdKmPerLiter),
      confidenceLoadCycleReturnFuelRateThresholdKmPerLiter: Number(current.defaultConfidenceLoadCycleReturnFuelRateThresholdKmPerLiter),
      clusterBatchStopSpeedThresholdKph: Number(current.defaultClusterBatchStopSpeedThresholdKph),
      clusterBatchMinimumStopDurationMinutes: Number(current.defaultClusterBatchMinimumStopDurationMinutes),
      clusterBatchMinimumTripDistanceKm: Number(current.defaultClusterBatchMinimumTripDistanceKm),
      clusterBatchMinimumTripDurationMinutes: Number(current.defaultClusterBatchMinimumTripDurationMinutes),
      clusterBatchClusterRadiusMeters: Number(current.defaultClusterBatchClusterRadiusMeters),
      clusterBatchMaxTrackPoints: Number(current.defaultClusterBatchMaxTrackPoints),
      clusterRealtimeStopSpeedThresholdKph: Number(current.defaultClusterRealtimeStopSpeedThresholdKph),
      clusterRealtimeStopDurationPoints: Number(current.defaultClusterRealtimeStopDurationPoints),
      clusterRealtimeMovingDurationPoints: Number(current.defaultClusterRealtimeMovingDurationPoints),
      clusterRealtimeClusterMatchRadiusKm: Number(current.defaultClusterRealtimeClusterMatchRadiusKm),
    }));
  }, [settings]);

  const handleFieldChange = useCallback((field, value) => {
    setSettings((current) => ({
      ...current,
      [field]: value,
    }));
  }, []);

  if (!canViewSettings) {
    return (
      <div className="tw-p-6">
        <div className="tw-rounded-2xl tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-6 tw-shadow-sm">
          <div className="tw-flex tw-items-start tw-gap-4">
            <div className="tw-flex tw-h-12 tw-w-12 tw-items-center tw-justify-center tw-rounded-full tw-bg-amber-100 tw-text-amber-700">
              <i className="fa-light fa-lock" />
            </div>
            <div className="tw-space-y-2">
              <h1 className="tw-text-xl tw-font-semibold tw-text-slate-900">Trip settings access required</h1>
              <p className="tw-max-w-2xl tw-text-sm tw-text-slate-700">
                You need Vehicle Trips read access to review realtime trip configuration.
              </p>
              <Button
                text="Back to trips"
                icon="fa-light fa-arrow-left"
                stylingMode="outlined"
                onClick={() => navigate(vehicleRoutes.trips)}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="tw-p-6 tw-space-y-6">
      <div className="tw-flex tw-flex-col tw-gap-3 md:tw-flex-row md:tw-items-end md:tw-justify-between">
        <div>
          <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-[0.24em] tw-text-slate-500">
            Vehicle Trips
          </div>
          <h1 className="tw-mt-2 tw-text-3xl tw-font-semibold tw-text-slate-900">Trip settings</h1>
          <p className="tw-mt-2 tw-max-w-3xl tw-text-sm tw-text-slate-600">
            Configure realtime execution, reconciliation scheduling, fuel enrichment matching, and confidence scoring thresholds for VehicleTrips. These values are stored in system configuration and applied across recompute, reconciliation, tracking, and manual overrides.
          </p>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-2">
          <Button
            text="Back to trips"
            icon="fa-light fa-arrow-left"
            stylingMode="outlined"
            onClick={() => navigate(vehicleRoutes.trips)}
          />
          <Button
            text="Reload"
            icon="refresh"
            stylingMode="outlined"
            onClick={loadSettings}
            disabled={loading || saving}
          />
        </div>
      </div>

      <div className="tw-overflow-x-auto tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-shadow-sm">
        <div className="tw-flex tw-min-w-max tw-gap-2 tw-px-4 tw-pt-4" role="tablist" aria-label="Trip settings sections">
          {SETTINGS_TABS.map((tab) => (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={activeTab === tab.id}
              className={`tw-inline-flex tw-items-center tw-gap-2 tw-rounded-t-xl tw-border tw-border-b-0 tw-px-4 tw-py-3 tw-text-sm tw-font-medium tw-transition-colors ${activeTab === tab.id
                  ? "tw-border-slate-200 tw-bg-slate-50 tw-text-slate-900"
                  : "tw-border-transparent tw-bg-white tw-text-slate-500 hover:tw-bg-slate-50 hover:tw-text-slate-700"
                }`}
              onClick={() => setActiveTab(tab.id)}
            >
              <i className={tab.icon} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-[1.3fr_0.7fr] tw-gap-6">
        <section className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-6 tw-shadow-sm tw-space-y-6">
          {loading ? (
            <div className="tw-flex tw-items-center tw-gap-3 tw-py-10">
              <LoadIndicator width="24px" height="24px" visible={true} />
              <span className="tw-text-sm tw-text-slate-600">Loading trip settings...</span>
            </div>
          ) : (
            <>
              {activeTab === "runtime" && (
                <>
                  <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-5 tw-space-y-4">
                    <div>
                      <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Realtime execution</h2>
                      <p className="tw-mt-1 tw-text-sm tw-text-slate-600">{settings.description}</p>
                    </div>

                    <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4">
                      <CheckBox
                        text="Enable realtime VehicleTrips execution for live GPS processing"
                        value={Boolean(settings.enableRealtimeStateMachineExecution)}
                        onValueChanged={(event) => handleFieldChange("enableRealtimeStateMachineExecution", Boolean(event.value))}
                        disabled={!canEditSettings || saving}
                      />
                      <p className="tw-mt-3 tw-text-sm tw-text-slate-600">
                        When disabled, live GPS points bypass realtime trip execution. Existing trip history, manual overrides, recompute, and reconciliation endpoints remain available.
                      </p>
                    </div>
                  </div>

                  <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-5 tw-space-y-4">
                    <div>
                      <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Fuel enrichment</h2>
                      <p className="tw-mt-1 tw-text-sm tw-text-slate-600">
                        Control whether trips attach departure and arrival fuel readings and how wide the lookup window is when matching telemetry to trip events.
                      </p>
                    </div>

                    <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-white tw-p-4 tw-space-y-4">
                      <CheckBox
                        text="Enable fuel-context enrichment"
                        value={Boolean(settings.enableFuelContextEnrichment)}
                        onValueChanged={(event) => handleFieldChange("enableFuelContextEnrichment", Boolean(event.value))}
                        disabled={!canEditSettings || saving}
                      />
                      <NumberSettingCard
                        field={NUMBER_FIELDS[0]}
                        value={settings.fuelLookupWindowHours}
                        defaultValue={settings.defaultFuelLookupWindowHours}
                        disabled={!canEditSettings || saving}
                        onChange={handleFieldChange}
                      />
                    </div>
                  </div>

                  <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-5 tw-space-y-4">
                    <div>
                      <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Confidence scoring</h2>
                      <p className="tw-mt-1 tw-text-sm tw-text-slate-600">
                        Tune the penalties, thresholds, and confidence bands used when scoring trips and grouped sessions.
                      </p>
                    </div>

                    <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
                      {NUMBER_FIELDS.slice(1).map((field) => (
                        <NumberSettingCard
                          key={field.key}
                          field={field}
                          value={settings[field.key]}
                          defaultValue={settings[`default${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`]}
                          disabled={!canEditSettings || saving}
                          onChange={handleFieldChange}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-5 tw-space-y-3">
                    <div>
                      <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Planning zones & boundaries</h2>
                      <p className="tw-mt-1 tw-text-sm tw-text-slate-600">
                        Geo-zone management and trip-to-plan configuration have moved to the <strong>Planning zones & boundaries</strong> tab on the Trip groups page.
                      </p>
                    </div>
                    <button
                      type="button"
                      className="tw-text-sm tw-font-medium tw-text-blue-600 hover:tw-underline"
                      onClick={() => navigate("/vehicles/trips")}
                    >
                      <i className="fa-light fa-arrow-right tw-mr-1" />
                      Go to Planning zones & boundaries
                    </button>
                  </div>

                  <div className="tw-flex tw-flex-wrap tw-gap-3">
                    <Button
                      text={saving ? "Saving..." : "Save changes"}
                      icon="save"
                      type="default"
                      disabled={!canEditSettings || saving}
                      onClick={handleSave}
                    />
                    <Button
                      text="Reset to default"
                      icon="revert"
                      stylingMode="outlined"
                      disabled={saving}
                      onClick={handleReset}
                    />
                  </div>
                </>
              )}

              {activeTab === "reconciliation" && (
                <VehicleTripReconciliationSettingsTab
                  settings={settings}
                  canEditSettings={canEditSettings}
                  saving={saving}
                  onFieldChange={handleFieldChange}
                />
              )}

              {activeTab === "cluster" && (
                <>
                  <div className="tw-space-y-4 tw-mb-6">
                    <h3 className="tw-text-base tw-font-semibold tw-text-slate-800">
                      <i className="fa-light fa-layer-group tw-mr-2 tw-text-indigo-500" />
                      Batch cluster detection
                    </h3>
                    <p className="tw-text-sm tw-text-slate-500">
                      These settings control the offline batch cluster detection algorithm used during recompute operations.
                    </p>
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
                      {CLUSTER_BATCH_FIELDS.map((field) => (
                        <NumberSettingCard
                          key={field.key}
                          field={field}
                          value={settings[field.key]}
                          defaultValue={settings[`default${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`]}
                          disabled={!canEditSettings || saving}
                          onChange={(val) => handleFieldChange(field.key, val)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="tw-space-y-4">
                    <h3 className="tw-text-base tw-font-semibold tw-text-slate-800">
                      <i className="fa-light fa-signal-stream tw-mr-2 tw-text-teal-500" />
                      Realtime cluster detection
                    </h3>
                    <p className="tw-text-sm tw-text-slate-500">
                      These settings control the realtime state machine that classifies GPS points as they arrive.
                    </p>
                    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
                      {CLUSTER_REALTIME_FIELDS.map((field) => (
                        <NumberSettingCard
                          key={field.key}
                          field={field}
                          value={settings[field.key]}
                          defaultValue={settings[`default${field.key.charAt(0).toUpperCase()}${field.key.slice(1)}`]}
                          disabled={!canEditSettings || saving}
                          onChange={(val) => handleFieldChange(field.key, val)}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="tw-mt-8 tw-border-t tw-border-slate-200 tw-pt-6">
                    <div className="tw-mb-4 tw-flex tw-items-center tw-justify-between tw-rounded-xl tw-border tw-border-sky-200 tw-bg-sky-50 tw-p-4">
                      <div>
                        <div className="tw-text-sm tw-font-semibold tw-text-sky-900">Need more room to inspect the run?</div>
                        <p className="tw-mt-1 tw-text-sm tw-text-sky-800">
                          Open the standalone cluster preview workspace for point timeline and speed-profile charts.
                        </p>
                      </div>
                      <button
                        type="button"
                        className="tw-inline-flex tw-items-center tw-gap-2 tw-rounded-lg tw-bg-white tw-px-3 tw-py-2 tw-text-sm tw-font-medium tw-text-sky-700 tw-shadow-sm hover:tw-bg-sky-100"
                        onClick={() => navigate(vehicleRoutes.tripClusterPreview)}
                      >
                        <i className="fa-light fa-arrow-up-right-from-square" />
                        Open full page
                      </button>
                    </div>
                    <ClusterDetectionPreviewPanel />
                  </div>
                </>
              )}

              <div className="tw-flex tw-flex-wrap tw-gap-3">
                <Button
                  text={saving ? "Saving..." : "Save changes"}
                  icon="save"
                  type="default"
                  disabled={!canEditSettings || saving}
                  onClick={handleSave}
                />
                <Button
                  text="Reset to default"
                  icon="revert"
                  stylingMode="outlined"
                  disabled={saving}
                  onClick={handleReset}
                />
              </div>
            </>
          )}
        </section>

        <aside className="tw-rounded-2xl tw-border tw-border-slate-200 tw-bg-white tw-p-6 tw-shadow-sm tw-space-y-4">
          <div>
            <h2 className="tw-text-lg tw-font-semibold tw-text-slate-900">Operational impact</h2>
            <p className="tw-mt-1 tw-text-sm tw-text-slate-600">
              Use these controls when debugging trip detection, tuning anomaly sensitivity, or preparing controlled backfills.
            </p>
          </div>

          <div className="tw-space-y-3">
            <div className="tw-rounded-xl tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-p-4">
              <div className="tw-text-sm tw-font-semibold tw-text-emerald-900">Enabled</div>
              <p className="tw-mt-1 tw-text-sm tw-text-emerald-800">
                Live GPS updates continue creating and updating trip groups in realtime.
              </p>
            </div>

            <div className="tw-rounded-xl tw-border tw-border-amber-200 tw-bg-amber-50 tw-p-4">
              <div className="tw-text-sm tw-font-semibold tw-text-amber-900">Disabled</div>
              <p className="tw-mt-1 tw-text-sm tw-text-amber-800">
                Realtime execution or fuel enrichment can be paused while recompute and reconciliation remain available.
              </p>
            </div>

            <div className="tw-rounded-xl tw-border tw-border-sky-200 tw-bg-sky-50 tw-p-4">
              <div className="tw-text-sm tw-font-semibold tw-text-sky-900">Confidence tuning</div>
              <p className="tw-mt-1 tw-text-sm tw-text-sky-800">
                Lower penalties make detection more permissive. Higher penalties and tighter thresholds surface more anomalies for audit review.
              </p>
            </div>
          </div>

          <div className="tw-rounded-xl tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4 tw-space-y-2">
            <div className="tw-text-xs tw-font-semibold tw-uppercase tw-tracking-wide tw-text-slate-500">Metadata</div>
            <div className="tw-text-sm tw-text-slate-700">
              <span className="tw-font-medium">Primary config key:</span> {settings.configurationKey || "VehicleTrips.RealtimeStateMachineExecution.Enabled"}
            </div>
            <div className="tw-text-sm tw-text-slate-700">
              <span className="tw-font-medium">Updated by:</span> {settings.updatedBy || "System"}
            </div>
            <div className="tw-text-sm tw-text-slate-700">
              <span className="tw-font-medium">Updated at:</span> {settings.updatedAtUtc ? new Date(settings.updatedAtUtc).toLocaleString() : "Unknown"}
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
};

export default VehicleTripSettingsPage;