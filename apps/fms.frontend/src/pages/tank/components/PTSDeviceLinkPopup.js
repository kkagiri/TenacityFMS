/**
 * File: PTSDeviceLinkPopup.js
 * Purpose: Link a physical tank to an online PTS device and probe/tank channel.
 * Dependencies: react, react-redux, devextreme-react, ptsSignalRService, tankActions, ptsConfigService
 * Last Modified: 2026-02-05
 *
 * Key Functions/Components:
 * - PTSDeviceLinkPopup: Presents online PTS devices and persists the selected binding.
 * - extractProbeReadings: Normalizes UploadStatus probe payload into selectable tank channels.
 * - Supports both live SignalR data and device config probes fetching.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import { SelectBox } from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";
import { fetchPTSDevices } from "../../../redux/actions/ptsActions/ptsDeviceActions";
import { updateTank } from "../../../redux/actions/tankActions";
import ptsSignalRService from "../../../signalR/ptsSignalRService";
import ptsConfigService from "../../../services/ptsConfigService";

const isOnlineStatus = (status) => {
  const normalized = (status || "").toLowerCase();
  return normalized === "connected" || normalized === "active" || normalized === "idle";
};

/**
 * Extract probe readings from live UploadStatus data
 */
const extractProbeReadings = (uploadStatusEntry) => {
  const probes = uploadStatusEntry?.status?.probes;
  const onlineStatus = probes?.onlineStatus || probes?.OnlineStatus;

  if (!onlineStatus) {
    return [];
  }

  const measurements = onlineStatus.measurements || onlineStatus.Measurements || [];
  const ids = onlineStatus.ids || onlineStatus.Ids || [];

  if (Array.isArray(measurements) && measurements.length > 0) {
    const readings = measurements
      .map((measurement, index) => {
        const probeNumber =
          Number(measurement?.probeNumber ?? measurement?.ProbeNumber ?? ids[index] ?? 0) || 0;

        if (probeNumber <= 0) {
          return null;
        }

        return {
          probeNumber,
          productVolume:
            measurement?.productVolume ?? measurement?.ProductVolume ?? null,
          temperature:
            measurement?.temperature ?? measurement?.Temperature ?? null,
          waterHeight:
            measurement?.waterHeight ?? measurement?.WaterHeight ?? null,
          productHeight:
            measurement?.productHeight ?? measurement?.ProductHeight ?? null,
          updatedAt: uploadStatusEntry?.receivedAt || new Date().toISOString(),
          source: "live",
        };
      })
      .filter(Boolean);

    const uniqueByProbe = new Map();
    readings.forEach((reading) => {
      if (!uniqueByProbe.has(reading.probeNumber)) {
        uniqueByProbe.set(reading.probeNumber, reading);
      }
    });

    return Array.from(uniqueByProbe.values()).sort(
      (a, b) => a.probeNumber - b.probeNumber
    );
  }

  if (Array.isArray(ids) && ids.length > 0) {
    return ids
      .map((id) => Number(id || 0))
      .filter((id) => id > 0)
      .map((probeNumber) => ({
        probeNumber,
        productVolume: null,
        temperature: null,
        waterHeight: null,
        productHeight: null,
        updatedAt: uploadStatusEntry?.receivedAt || new Date().toISOString(),
        source: "live",
      }));
  }

  return [];
};

const PTSDeviceLinkPopup = ({ visible, tank, onClose, onLinked }) => {
  const dispatch = useDispatch();
  const isMounted = useRef(true);

  const { ptsDeviceList } = useSelector((state) => state.ptsDevice);
  const connectionStatuses = useSelector(
    (state) => state.deviceConnections?.connectionStatuses || {}
  );
  const uploadStatusByDevice = useSelector(
    (state) => state.realtimeStatus?.uploadStatusByDevice || {}
  );

  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [selectedPtsTankNumber, setSelectedPtsTankNumber] = useState(null);
  const [usePtsProbeReadings, setUsePtsProbeReadings] = useState(false);
  const [signalRConnected, setSignalRConnected] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showLiveData, setShowLiveData] = useState(true);
  const [configProbes, setConfigProbes] = useState([]);
  const [loadingConfigProbes, setLoadingConfigProbes] = useState(false);
  const [configProbesError, setConfigProbesError] = useState(null);

  // Track mounted state to prevent state updates after unmount
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  const ensureSignalRConnected = useCallback(async () => {
    if (!isMounted.current) return;

    try {
      setConnecting(true);

      if (!ptsSignalRService.getConnectionStatus()) {
        await ptsSignalRService.start();
      }

      await ptsSignalRService.requestDeviceStatusSummary();
      if (isMounted.current) {
        setSignalRConnected(true);
      }
    } catch (error) {
      if (isMounted.current) {
        setSignalRConnected(false);
        notify(
          error?.message || "Unable to connect to PTS SignalR. Check connection and retry.",
          "error",
          4000
        );
      }
    } finally {
      if (isMounted.current) {
        setConnecting(false);
      }
    }
  }, []);

  /**
   * Fetch probes configuration from the PTS device directly
   */
  const fetchProbesFromDevice = useCallback(async (deviceId) => {
    if (!deviceId || !isMounted.current) return;

    setLoadingConfigProbes(true);
    setConfigProbesError(null);

    try {
      const result = await ptsConfigService.getProbesConfiguration(deviceId);

      if (!isMounted.current) return;

      if (result?.isSuccess && result?.data?.probes) {
        const probesFromConfig = result.data.probes.map((probe) => ({
          probeNumber: probe.id,
          port: probe.port,
          address: probe.address,
          productVolume: null,
          temperature: null,
          waterHeight: null,
          productHeight: null,
          source: "config",
        }));
        setConfigProbes(probesFromConfig);
      } else {
        setConfigProbesError(result?.message || "Failed to fetch probes configuration");
        setConfigProbes([]);
      }
    } catch (error) {
      if (isMounted.current) {
        setConfigProbesError(error?.message || "Error fetching probes configuration");
        setConfigProbes([]);
      }
    } finally {
      if (isMounted.current) {
        setLoadingConfigProbes(false);
      }
    }
  }, []);

  // Initialize when popup becomes visible
  useEffect(() => {
    if (!visible) {
      return;
    }

    // Set initial values from tank - use probeNumber (new field name)
    setSelectedDeviceId(tank?.ptsId || null);
    setSelectedPtsTankNumber(tank?.ptsTankId || tank?.probeNumber || null);
    setUsePtsProbeReadings(Boolean(tank?.usePtsProbeReadings));
    setConfigProbes([]);
    setConfigProbesError(null);

    // Fetch PTS devices list
    dispatch(fetchPTSDevices());

    // Check SignalR connection status
    setSignalRConnected(ptsSignalRService.getConnectionStatus());

    if (!ptsSignalRService.getConnectionStatus()) {
      ensureSignalRConnected();
    } else {
      // Request latest device status
      ptsSignalRService.requestDeviceStatusSummary().catch(() => {
        // Non-blocking refresh request
      });
    }
  }, [visible, tank, dispatch, ensureSignalRConnected]);

  // Listen for SignalR connection status changes
  useEffect(() => {
    if (!visible) {
      return undefined;
    }

    const unsubscribe = ptsSignalRService.on(
      "connectionStatusChanged",
      (isConnected) => {
        if (isMounted.current) {
          setSignalRConnected(Boolean(isConnected));
        }
      }
    );

    return () => {
      unsubscribe?.();
    };
  }, [visible]);

  // Fetch probes config when device is selected and not using live data
  useEffect(() => {
    if (selectedDeviceId && !showLiveData) {
      fetchProbesFromDevice(selectedDeviceId);
    }
  }, [selectedDeviceId, showLiveData, fetchProbesFromDevice]);

  // Build list of all PTS devices with live status
  const allDevicesWithStatus = useMemo(() => {
    if (!Array.isArray(ptsDeviceList)) {
      return [];
    }

    return ptsDeviceList
      .map((device) => {
        const status = connectionStatuses[device.ptsid]?.status || "Disconnected";
        return {
          ...device,
          liveStatus: status,
          isOnline: isOnlineStatus(status),
          liveConnectionType:
            connectionStatuses[device.ptsid]?.connectionType || "Unknown",
          liveLastActivity:
            connectionStatuses[device.ptsid]?.lastActivity || device.lastActivity || null,
        };
      })
      .sort((a, b) => {
        // Sort: online devices first, then by name
        if (a.isOnline !== b.isOnline) {
          return a.isOnline ? -1 : 1;
        }
        return (a.ptsName || a.ptsid).localeCompare(b.ptsName || b.ptsid);
      });
  }, [ptsDeviceList, connectionStatuses]);

  // Get live probe readings from SignalR UploadStatus
  const liveProbeReadings = useMemo(() => {
    if (!selectedDeviceId) return [];
    const uploadStatus = uploadStatusByDevice[selectedDeviceId];
    return extractProbeReadings(uploadStatus);
  }, [selectedDeviceId, uploadStatusByDevice]);

  // Determine which probes to display based on toggle
  const availableProbes = useMemo(() => {
    if (showLiveData) {
      return liveProbeReadings;
    }
    return configProbes;
  }, [showLiveData, liveProbeReadings, configProbes]);

  // Auto-select single probe
  useEffect(() => {
    if (!selectedDeviceId) {
      setSelectedPtsTankNumber(null);
      return;
    }

    // Auto-select if only one probe and no selection yet
    if (
      availableProbes.length === 1 &&
      (selectedPtsTankNumber === null || selectedPtsTankNumber === undefined)
    ) {
      setSelectedPtsTankNumber(availableProbes[0].probeNumber);
    }
  }, [selectedDeviceId, availableProbes, selectedPtsTankNumber]);

  const handleDeviceChange = useCallback((e) => {
    const newDeviceId = e.value || null;
    setSelectedDeviceId(newDeviceId);
    setSelectedPtsTankNumber(null);
    setConfigProbes([]);
    setConfigProbesError(null);
  }, []);

  const handleProbeChange = useCallback((e) => {
    setSelectedPtsTankNumber(e.value || null);
  }, []);

  const handleToggleLiveData = useCallback(() => {
    setShowLiveData((prev) => !prev);
  }, []);

  const handleToggleUsePtsProbeReadings = useCallback(() => {
    setUsePtsProbeReadings((prev) => !prev);
  }, []);

  const handleSaveBinding = useCallback(async () => {
    if (!tank?.id) {
      notify("No tank selected", "error", 3000);
      return;
    }

    if (!selectedDeviceId) {
      notify("Please select a PTS device", "warning", 3000);
      return;
    }

    if (availableProbes.length > 0 && !selectedPtsTankNumber) {
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
        probeNumber: selectedPtsTankNumber || null,
        ptsTankId: selectedPtsTankNumber || null,
        usePtsProbeReadings: usePtsProbeReadings,
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
        linkedVehicleId:
          tank.tankType === "MobileTanker" ? tank.linkedVehicleId ?? null : null,
        locationValidationRadius: tank.locationValidationRadius ?? 100,
      };

      const result = await dispatch(updateTank(tank.id, payload));

      if (!result?.success) {
        throw new Error(result?.message || "Failed to save PTS binding");
      }

      notify("PTS probe binding saved successfully", "success", 3000);

      // Call onLinked callback without causing page refresh
      if (typeof onLinked === "function") {
        onLinked();
      }

      // Close popup
      if (typeof onClose === "function") {
        onClose();
      }
    } catch (error) {
      notify(error?.message || "Error saving PTS binding", "error", 4000);
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  }, [tank, selectedDeviceId, selectedPtsTankNumber, usePtsProbeReadings, availableProbes.length, dispatch, onLinked, onClose]);

  const selectedDevice = useMemo(() => {
    return allDevicesWithStatus.find((device) => device.ptsid === selectedDeviceId);
  }, [allDevicesWithStatus, selectedDeviceId]);

  // Get selected probe data for live display
  const selectedProbeData = useMemo(() => {
    if (!selectedPtsTankNumber) return null;
    return availableProbes.find((p) => p.probeNumber === selectedPtsTankNumber);
  }, [availableProbes, selectedPtsTankNumber]);

  // Format volume display
  const formatVolume = (volume) => {
    if (volume === null || volume === undefined) return "N/A";
    return `${Number(volume).toLocaleString(undefined, { maximumFractionDigits: 2 })} L`;
  };

  // Format temperature display
  const formatTemperature = (temp) => {
    if (temp === null || temp === undefined) return "N/A";
    return `${Number(temp).toFixed(1)}°C`;
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={true}
      showTitle={true}
      title={`Link Probe to Tank - ${tank?.name || "Tank"}`}
      width={680}
      height="auto"
      maxHeight="90vh"
      showCloseButton={true}
    >
      <div className="tw-p-5 tw-space-y-4 tw-overflow-y-auto">
        {/* SignalR Connection Status */}
        <div className="tw-rounded-lg tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-3">
          <div className="tw-flex tw-items-center tw-justify-between tw-gap-3">
            <div>
              <p className="tw-text-sm tw-font-semibold tw-text-slate-700">
                <i className={`fa-light ${signalRConnected ? "fa-wifi tw-text-green-500" : "fa-wifi-slash tw-text-red-500"} tw-mr-2`}></i>
                SignalR Connection
              </p>
              <p className="tw-text-xs tw-text-slate-500">
                {signalRConnected
                  ? "Connected - Receiving live probe data"
                  : "Disconnected - Connect to view live probe readings"}
              </p>
            </div>
            <Button
              text={signalRConnected ? "Refresh" : "Connect"}
              icon={connecting ? "fa-light fa-spinner fa-spin" : "fa-light fa-plug"}
              type="default"
              stylingMode="outlined"
              onClick={ensureSignalRConnected}
              disabled={connecting}
            />
          </div>
        </div>

        {/* PTS Device Selection */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-mb-2">
            <i className="fa-light fa-server tw-mr-2"></i>
            PTS Device
          </label>
          <SelectBox
            dataSource={allDevicesWithStatus}
            displayExpr={(item) => {
              if (!item) return "";
              const statusIcon = item.isOnline ? "🟢" : "🔴";
              return `${statusIcon} ${item.ptsName || item.name || item.ptsid} (${item.ptsid})`;
            }}
            valueExpr="ptsid"
            value={selectedDeviceId}
            onValueChanged={handleDeviceChange}
            placeholder={
              allDevicesWithStatus.length > 0
                ? "Select a PTS device"
                : "No PTS devices available"
            }
            searchEnabled={true}
            width="100%"
          />
          {allDevicesWithStatus.length === 0 && (
            <p className="tw-mt-2 tw-text-xs tw-text-amber-600">
              No PTS devices found. Please add devices in PTS Device Management.
            </p>
          )}
        </div>

        {/* Device Info Card */}
        {selectedDevice && (
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
            <div>
              <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-blue-600">
                Status
              </p>
              <p className={`tw-text-sm tw-font-medium ${selectedDevice.isOnline ? "tw-text-green-600" : "tw-text-red-600"}`}>
                {selectedDevice.liveStatus}
              </p>
            </div>
            <div>
              <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-blue-600">
                Connection
              </p>
              <p className="tw-text-sm tw-font-medium tw-text-slate-700">
                {selectedDevice.liveConnectionType}
              </p>
            </div>
            <div>
              <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-blue-600">
                Last Activity
              </p>
              <p className="tw-text-sm tw-font-medium tw-text-slate-700">
                {selectedDevice.liveLastActivity
                  ? new Date(selectedDevice.liveLastActivity).toLocaleString()
                  : "N/A"}
              </p>
            </div>
          </div>
        )}

        {/* Probe Selection with Data Source Toggle */}
        {selectedDeviceId && (
          <div>
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
              <label className="tw-text-sm tw-font-medium">
                <i className="fa-light fa-gauge tw-mr-2"></i>
                Probe / Tank Channel
              </label>
              <div className="tw-flex tw-items-center tw-gap-2">
                <span className="tw-text-xs tw-text-slate-500">
                  {showLiveData ? "Live Data" : "Device Config"}
                </span>
                <button
                  type="button"
                  onClick={handleToggleLiveData}
                  className={`tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none ${showLiveData ? "tw-bg-green-500" : "tw-bg-slate-300"
                    }`}
                  title={showLiveData ? "Switch to Device Config" : "Switch to Live Data"}
                >
                  <span
                    className={`tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${showLiveData ? "tw-translate-x-5" : "tw-translate-x-0"
                      }`}
                  />
                </button>
              </div>
            </div>

            {/* Loading state for config probes */}
            {!showLiveData && loadingConfigProbes && (
              <div className="tw-flex tw-items-center tw-justify-center tw-py-4">
                <i className="fa-light fa-spinner fa-spin tw-mr-2"></i>
                <span className="tw-text-sm tw-text-slate-500">Loading probes from device...</span>
              </div>
            )}

            {/* Error state for config probes */}
            {!showLiveData && configProbesError && (
              <div className="tw-rounded-lg tw-border tw-border-red-200 tw-bg-red-50 tw-p-3 tw-mb-2">
                <p className="tw-text-sm tw-text-red-600">
                  <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                  {configProbesError}
                </p>
                <Button
                  text="Retry"
                  type="default"
                  stylingMode="text"
                  onClick={() => fetchProbesFromDevice(selectedDeviceId)}
                  className="tw-mt-2"
                />
              </div>
            )}

            {/* Probe SelectBox */}
            {(!loadingConfigProbes || showLiveData) && !configProbesError && (
              <SelectBox
                dataSource={availableProbes}
                displayExpr={(item) => {
                  if (!item) return "";

                  let label = `Probe ${item.probeNumber}`;

                  if (item.source === "config" && item.port) {
                    label += ` (Port: ${item.port}, Addr: ${item.address})`;
                  } else if (item.productVolume !== null && item.productVolume !== undefined) {
                    label += ` - ${formatVolume(item.productVolume)}`;
                  }

                  return label;
                }}
                valueExpr="probeNumber"
                value={selectedPtsTankNumber}
                onValueChanged={handleProbeChange}
                placeholder={
                  availableProbes.length > 0
                    ? "Select a probe"
                    : showLiveData
                      ? "Waiting for live probe data..."
                      : "No probes configured"
                }
                searchEnabled={false}
                width="100%"
                disabled={availableProbes.length === 0}
              />
            )}

            {/* Help text */}
            {availableProbes.length === 0 && !loadingConfigProbes && !configProbesError && (
              <p className="tw-mt-2 tw-text-xs tw-text-slate-500">
                {showLiveData
                  ? "Waiting for UploadStatus probe readings. Ensure device is online and sending data."
                  : "No probes found in device configuration. Try fetching from device or switch to live data."}
              </p>
            )}
          </div>
        )}

        {/* Live Probe Data Card */}
        {selectedProbeData && showLiveData && (
          <div className="tw-rounded-lg tw-border tw-border-green-200 tw-bg-green-50 tw-p-3">
            <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-green-600 tw-mb-2">
              <i className="fa-light fa-signal-stream tw-mr-1"></i>
              Live Probe Data - Probe {selectedProbeData.probeNumber}
            </p>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-3">
              <div>
                <p className="tw-text-xs tw-text-slate-500">Volume</p>
                <p className="tw-text-sm tw-font-semibold tw-text-slate-700">
                  {formatVolume(selectedProbeData.productVolume)}
                </p>
              </div>
              <div>
                <p className="tw-text-xs tw-text-slate-500">Height</p>
                <p className="tw-text-sm tw-font-semibold tw-text-slate-700">
                  {selectedProbeData.productHeight !== null
                    ? `${Number(selectedProbeData.productHeight).toFixed(1)} mm`
                    : "N/A"}
                </p>
              </div>
              <div>
                <p className="tw-text-xs tw-text-slate-500">Temperature</p>
                <p className="tw-text-sm tw-font-semibold tw-text-slate-700">
                  {formatTemperature(selectedProbeData.temperature)}
                </p>
              </div>
              <div>
                <p className="tw-text-xs tw-text-slate-500">Water</p>
                <p className="tw-text-sm tw-font-semibold tw-text-slate-700">
                  {selectedProbeData.waterHeight !== null
                    ? `${Number(selectedProbeData.waterHeight).toFixed(1)} mm`
                    : "N/A"}
                </p>
              </div>
            </div>
            {selectedProbeData.updatedAt && (
              <p className="tw-text-xs tw-text-slate-400 tw-mt-2">
                Last updated: {new Date(selectedProbeData.updatedAt).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {/* Use PTS Probe Readings Toggle */}
        {selectedDeviceId && selectedPtsTankNumber && (
          <div className="tw-rounded-lg tw-border tw-border-blue-200 tw-bg-blue-50 tw-p-3">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <p className="tw-text-sm tw-font-semibold tw-text-blue-700">
                  <i className="fa-light fa-gauge-high tw-mr-2"></i>
                  Enable Auto Physical Stock Updates
                </p>
                <p className="tw-text-xs tw-text-blue-600 tw-mt-1">
                  When enabled, the system will automatically update this tank's physical stock value
                  from probe readings received via UploadStatus packets.
                </p>
              </div>
              <button
                type="button"
                onClick={handleToggleUsePtsProbeReadings}
                className={`tw-relative tw-inline-flex tw-h-6 tw-w-11 tw-flex-shrink-0 tw-cursor-pointer tw-rounded-full tw-border-2 tw-border-transparent tw-transition-colors tw-duration-200 tw-ease-in-out focus:tw-outline-none ${usePtsProbeReadings ? "tw-bg-green-500" : "tw-bg-slate-300"
                  }`}
                title={usePtsProbeReadings ? "Disable auto physical stock updates" : "Enable auto physical stock updates"}
              >
                <span
                  className={`tw-pointer-events-none tw-inline-block tw-h-5 tw-w-5 tw-transform tw-rounded-full tw-bg-white tw-shadow tw-ring-0 tw-transition tw-duration-200 tw-ease-in-out ${usePtsProbeReadings ? "tw-translate-x-5" : "tw-translate-x-0"
                    }`}
                />
              </button>
            </div>
            {usePtsProbeReadings && (
              <p className="tw-text-xs tw-text-green-600 tw-mt-2 tw-flex tw-items-center">
                <i className="fa-light fa-check-circle tw-mr-1"></i>
                Physical stock will be updated automatically from probe measurements
              </p>
            )}
          </div>
        )}

        {/* Binding Preview */}
        <div className="tw-rounded-lg tw-border tw-border-emerald-200 tw-bg-emerald-50 tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-emerald-600 tw-mb-1">
            <i className="fa-light fa-link tw-mr-1"></i>
            Binding Preview
          </p>
          <p className="tw-text-sm tw-text-slate-700">
            Tank <strong>{tank?.name || "-"}</strong> will be linked to device{" "}
            <strong>{selectedDeviceId || "-"}</strong>
            {selectedPtsTankNumber ? (
              <> using <strong>Probe {selectedPtsTankNumber}</strong>.</>
            ) : (
              <>.</>
            )}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2 tw-border-t tw-border-slate-200">
          <Button
            text="Cancel"
            onClick={onClose}
            type="normal"
            stylingMode="outlined"
          />
          <Button
            text={saving ? "Saving..." : "Save Binding"}
            icon={saving ? "fa-light fa-spinner fa-spin" : "fa-light fa-link"}
            onClick={handleSaveBinding}
            type="default"
            disabled={saving || !selectedDeviceId}
          />
        </div>
      </div>
    </Popup>
  );
};

export default PTSDeviceLinkPopup;
