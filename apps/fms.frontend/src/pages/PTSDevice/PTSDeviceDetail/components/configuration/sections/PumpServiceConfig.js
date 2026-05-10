/**
 * PumpServiceConfig.js
 * Pump Service configuration section
 * Based on PTS Protocol:
 * - 48/50. GetPumpsConfiguration/PumpsConfiguration (ports, pumps)
 * - 66/68. GetPumpNozzlesConfiguration/PumpNozzlesConfiguration (nozzle mappings)
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import notify from "devextreme/ui/notify";
import ptsConfigService from "../../../../../../services/ptsConfigService";
import {
  NumberInput,
  Select,
  ConfigSection,
  StatusBadge,
} from "../controls/ConfigControls";
import "./PumpServiceConfig.scss";

// Protocol lookup - based on PTS-2 firmware supported protocols
const PUMP_PROTOCOLS = {
  1: "Tokheim TCS",
  2: "Tokheim DPT",
  3: "IFSF",
  4: "Gilbarco",
  5: "Wayne",
  6: "Hectronic",
  7: "Adast",
  8: "Sanki",
  9: "Tatsuno",
  10: "AveStar",
};

// Baud rate lookup
const BAUD_RATES = {
  1: "1200",
  2: "2400",
  3: "4800",
  4: "9600",
  5: "19200",
  6: "38400",
  7: "57600",
  8: "115200",
};

const PumpServiceConfig = ({ device, isConnected, onConfigChange }) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [pumpsConfig, setPumpsConfig] = useState(null);
  const [nozzlesConfig, setNozzlesConfig] = useState(null);
  const [pendingChanges, setPendingChanges] = useState({});
  const [expandedPump, setExpandedPump] = useState(null);
  const [activeTab, setActiveTab] = useState("pumps"); // 'pumps' or 'ports'

  // Load both pumps and nozzles configuration
  const loadConfig = useCallback(async () => {
    if (!device?.ptsid || !isConnected) return;

    setLoading(true);
    try {
      // Load pumps configuration (ports and pumps)
      const pumpsResult = await ptsConfigService.getPumpsConfiguration(device.ptsid);
      if (pumpsResult.isSuccess) {
        setPumpsConfig(pumpsResult.data);
      } else {
        notify(pumpsResult.message || "Failed to load pumps configuration", "error", 3000);
      }

      // Load nozzles configuration
      try {
        const nozzlesResult = await ptsConfigService.getPumpNozzlesConfiguration(device.ptsid);
        if (nozzlesResult.isSuccess) {
          setNozzlesConfig(nozzlesResult.data);
        }
      } catch (nozzleError) {
        console.log("Nozzles config not available:", nozzleError);
        // Nozzles config is optional, don't show error
      }

      setPendingChanges({});
    } catch (error) {
      console.error("Error loading config:", error);
      notify("Failed to load configuration", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [device?.ptsid, isConnected]);

  useEffect(() => {
    if (isConnected) {
      loadConfig();
    }
  }, [isConnected, loadConfig]);

  // Check for unsaved changes
  const hasChanges = useMemo(() => {
    return Object.keys(pendingChanges).length > 0;
  }, [pendingChanges]);

  // Handle port setting change
  const handlePortChange = useCallback((portId, key, newValue, currentValue) => {
    const changeKey = `port_${portId}_${key}`;
    setPendingChanges(prev => {
      const updated = { ...prev };
      if (newValue === currentValue) {
        delete updated[changeKey];
      } else {
        updated[changeKey] = { portId, key, value: newValue };
      }
      return updated;
    });
  }, []);

  // Handle pump setting change
  const handlePumpChange = useCallback((pumpId, key, newValue, currentValue) => {
    const changeKey = `pump_${pumpId}_${key}`;
    setPendingChanges(prev => {
      const updated = { ...prev };
      if (newValue === currentValue) {
        delete updated[changeKey];
      } else {
        updated[changeKey] = { pumpId, key, value: newValue };
      }
      return updated;
    });
  }, []);

  // Cancel changes
  const handleCancel = useCallback(() => {
    setPendingChanges({});
    notify("Changes cancelled", "info", 2000);
  }, []);

  // Save changes
  const handleSave = async () => {
    if (!device?.ptsid || !hasChanges) return;

    setSaving(true);
    try {
      // Build the configuration from pending changes
      const portsToUpdate = [];
      const pumpsToUpdate = [];

      for (const change of Object.values(pendingChanges)) {
        if (change.portId !== undefined) {
          // Find existing port or create new entry
          let portEntry = portsToUpdate.find(p => p.id === change.portId);
          if (!portEntry) {
            const existingPort = pumpsConfig?.ports?.find(p => p.id === change.portId) || {};
            portEntry = { id: change.portId, ...existingPort };
            portsToUpdate.push(portEntry);
          }
          portEntry[change.key] = change.value;
        } else if (change.pumpId !== undefined) {
          let pumpEntry = pumpsToUpdate.find(p => p.id === change.pumpId);
          if (!pumpEntry) {
            const existingPump = pumpsConfig?.pumps?.find(p => p.id === change.pumpId) || {};
            pumpEntry = { id: change.pumpId, ...existingPump };
            pumpsToUpdate.push(pumpEntry);
          }
          pumpEntry[change.key] = change.value;
        }
      }

      const config = {};
      if (portsToUpdate.length > 0) {
        config.ports = portsToUpdate;
      }
      if (pumpsToUpdate.length > 0) {
        config.pumps = pumpsToUpdate;
      }

      const result = await ptsConfigService.setPumpsConfiguration(device.ptsid, config);

      if (result.isSuccess) {
        notify("Pump configuration saved successfully!", "success", 3000);
        setPendingChanges({});
        onConfigChange?.();
        setTimeout(loadConfig, 2000);
      } else {
        notify(result.message || "Failed to save configuration", "error", 3000);
      }
    } catch (error) {
      console.error("Error saving pump config:", error);
      notify("Error saving pump configuration", "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  // Get effective value for a port setting
  const getPortValue = useCallback((portId, key, currentValue) => {
    const changeKey = `port_${portId}_${key}`;
    return changeKey in pendingChanges ? pendingChanges[changeKey].value : currentValue;
  }, [pendingChanges]);

  // Get effective value for a pump setting
  const getPumpValue = useCallback((pumpId, key, currentValue) => {
    const changeKey = `pump_${pumpId}_${key}`;
    return changeKey in pendingChanges ? pendingChanges[changeKey].value : currentValue;
  }, [pendingChanges]);

  // Get nozzle config for a pump
  const getNozzleConfigForPump = useCallback((pumpId) => {
    return nozzlesConfig?.pumpNozzles?.find(n => n.pumpId === pumpId);
  }, [nozzlesConfig]);

  // Get port info for a pump
  const getPortForPump = useCallback((pump) => {
    return pumpsConfig?.ports?.find(p => p.id === pump.port);
  }, [pumpsConfig]);

  if (!isConnected) {
    return (
      <ConfigSection
        title="Pump Configuration"
        icon="fa-light fa-gas-pump"
        description="Configure pump ports and pump-to-port assignments (Protocol 48-50)"
      >
        <div className="tw-text-center tw-py-6 tw-text-gray-500">
          <span><i className="fa-light fa-plug-circle-xmark tw-text-4xl tw-mb-3 tw-block"></i></span>
          <p>Device must be connected to configure pump settings</p>
        </div>
      </ConfigSection>
    );
  }

  if (loading) {
    return (
      <ConfigSection
        title="Pump Configuration"
        icon="fa-light fa-gas-pump"
        description="Configure pump ports and pump-to-port assignments (Protocol 48-50)"
      >
        <div className="tw-flex tw-items-center tw-justify-center tw-py-6">
          <span><i className="fa-light fa-spinner fa-spin tw-text-2xl tw-text-blue-500"></i></span>
          <span className="tw-ml-3 tw-text-gray-600">Loading pump configuration...</span>
        </div>
      </ConfigSection>
    );
  }

  return (
    <ConfigSection
      title="Pump Configuration"
      icon="fa-light fa-gas-pump"
      description="Configure pump ports and pump-to-port assignments (Protocol 48-50)"
      actions={
        <div className="tw-flex tw-items-center tw-gap-2">
          <button
            type="button"
            onClick={loadConfig}
            disabled={loading}
            className="tw-p-2 tw-text-gray-500 hover:tw-text-gray-700 hover:tw-bg-gray-200 tw-rounded tw-transition-colors"
            title="Refresh configuration"
          >
            <span><i className={`fa-light fa-sync ${loading ? "fa-spin" : ""}`}></i></span>
          </button>
        </div>
      }
    >
      {/* Unsaved changes warning */}
      {hasChanges && (
        <div className="tw-bg-yellow-50 tw-border tw-border-yellow-300 tw-rounded-lg tw-p-3 tw-mb-4 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-yellow-800">
            <span><i className="fa-light fa-exclamation-triangle"></i></span>
            <span className="tw-text-sm">You have unsaved changes</span>
          </div>
          <div className="tw-flex tw-gap-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={saving}
              className="tw-px-3 tw-py-1 tw-text-sm tw-text-gray-600 tw-border tw-border-gray-300 tw-rounded hover:tw-bg-gray-100 tw-transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="tw-px-3 tw-py-1 tw-text-sm tw-text-white tw-bg-blue-600 tw-rounded hover:tw-bg-blue-700 tw-transition-colors tw-flex tw-items-center tw-gap-2"
            >
              {saving && <span><i className="fa-light fa-spinner fa-spin"></i></span>}
              Save Changes
            </button>
          </div>
        </div>
      )}

      {pumpsConfig ? (
        <div className="pump-service-config">
          {/* Tab Navigation */}
          <div className="tw-flex tw-border-b tw-border-gray-200 tw-mb-4">
            <button
              type="button"
              onClick={() => setActiveTab("pumps")}
              className={`tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-border-b-2 tw-transition-colors ${
                activeTab === "pumps"
                  ? "tw-border-blue-600 tw-text-blue-600"
                  : "tw-border-transparent tw-text-gray-500 hover:tw-text-gray-700"
              }`}
            >
              <span><i className="fa-light fa-gas-pump tw-mr-2"></i></span>
              Pumps ({pumpsConfig.pumps?.length || 0})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("ports")}
              className={`tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-border-b-2 tw-transition-colors ${
                activeTab === "ports"
                  ? "tw-border-blue-600 tw-text-blue-600"
                  : "tw-border-transparent tw-text-gray-500 hover:tw-text-gray-700"
              }`}
            >
              <span><i className="fa-light fa-plug tw-mr-2"></i></span>
              Ports ({pumpsConfig.ports?.length || 0})
            </button>
          </div>

          {/* Ports Tab */}
          {activeTab === "ports" && (
            <div className="tw-space-y-4">
              <div className="tw-text-sm tw-text-gray-600 tw-mb-4">
                <span><i className="fa-light fa-info-circle tw-mr-2"></i></span>
                Configure communication ports for pump protocols. Each port can connect to multiple pumps.
              </div>

              {pumpsConfig.ports?.length > 0 ? (
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
                  {pumpsConfig.ports.map((port) => {
                    const pumpsOnPort = pumpsConfig.pumps?.filter(p => p.port === port.id) || [];
                    const isModified = Object.keys(pendingChanges).some(k => k.startsWith(`port_${port.id}_`));

                    return (
                      <div
                        key={port.id}
                        className={`tw-bg-white tw-border tw-rounded-lg tw-p-4 ${
                          isModified ? "tw-border-yellow-400 tw-bg-yellow-50" : "tw-border-gray-200"
                        }`}
                      >
                        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                          <h4 className="tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                            <span className="tw-w-8 tw-h-8 tw-bg-blue-100 tw-rounded tw-flex tw-items-center tw-justify-center">
                              <i className="fa-light fa-plug tw-text-blue-600"></i>
                            </span>
                            Port {port.id}
                          </h4>
                          <StatusBadge
                            status={pumpsOnPort.length > 0 ? "success" : "neutral"}
                            label={`${pumpsOnPort.length} pump${pumpsOnPort.length !== 1 ? "s" : ""}`}
                          />
                        </div>

                        <div className="tw-space-y-4">
                          <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                              Protocol
                            </label>
                            <Select
                              value={getPortValue(port.id, "protocol", port.protocol)}
                              onChange={(v) => handlePortChange(port.id, "protocol", parseInt(v), port.protocol)}
                              options={Object.entries(PUMP_PROTOCOLS).map(([value, label]) => ({
                                value: parseInt(value),
                                label: `${value} - ${label}`,
                              }))}
                              disabled={saving}
                            />
                          </div>

                          <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                              Baud Rate
                            </label>
                            <Select
                              value={getPortValue(port.id, "baudRate", port.baudRate)}
                              onChange={(v) => handlePortChange(port.id, "baudRate", parseInt(v), port.baudRate)}
                              options={Object.entries(BAUD_RATES).map(([value, label]) => ({
                                value: parseInt(value),
                                label: `${value} - ${label} bps`,
                              }))}
                              disabled={saving}
                            />
                          </div>

                          {pumpsOnPort.length > 0 && (
                            <div className="tw-pt-3 tw-border-t tw-border-gray-200">
                              <span className="tw-text-xs tw-text-gray-500">Connected Pumps:</span>
                              <div className="tw-flex tw-flex-wrap tw-gap-1 tw-mt-1">
                                {pumpsOnPort.map(p => (
                                  <span
                                    key={p.id}
                                    className="tw-text-xs tw-bg-gray-100 tw-px-2 tw-py-0.5 tw-rounded"
                                  >
                                    Pump {p.id} (Addr: {p.address})
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="tw-text-center tw-py-8 tw-text-gray-500">
                  <span><i className="fa-light fa-plug tw-text-4xl tw-mb-3 tw-block tw-opacity-50"></i></span>
                  <p>No ports configured</p>
                </div>
              )}
            </div>
          )}

          {/* Pumps Tab */}
          {activeTab === "pumps" && (
            <div className="tw-space-y-4">
              <div className="tw-text-sm tw-text-gray-600 tw-mb-4">
                <span><i className="fa-light fa-info-circle tw-mr-2"></i></span>
                Configure pump assignments to ports and communication addresses.
              </div>

              {pumpsConfig.pumps?.length > 0 ? (
                <div className="tw-space-y-3">
                  {pumpsConfig.pumps.map((pump) => {
                    const port = getPortForPump(pump);
                    const nozzleConfig = getNozzleConfigForPump(pump.id);
                    const isExpanded = expandedPump === pump.id;
                    const isModified = Object.keys(pendingChanges).some(k => k.startsWith(`pump_${pump.id}_`));

                    return (
                      <div
                        key={pump.id}
                        className={`tw-bg-white tw-border tw-rounded-lg tw-overflow-hidden ${
                          isModified ? "tw-border-yellow-400" : "tw-border-gray-200"
                        }`}
                      >
                        {/* Pump Header */}
                        <div
                          className={`tw-flex tw-items-center tw-justify-between tw-p-4 tw-cursor-pointer hover:tw-bg-gray-50 tw-transition-colors ${
                            isModified ? "tw-bg-yellow-50" : ""
                          }`}
                          onClick={() => setExpandedPump(isExpanded ? null : pump.id)}
                        >
                          <div className="tw-flex tw-items-center tw-gap-4">
                            <div className="tw-w-12 tw-h-12 tw-bg-blue-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
                              <span><i className="fa-light fa-gas-pump tw-text-xl tw-text-blue-600"></i></span>
                            </div>
                            <div>
                              <h4 className="tw-font-semibold tw-text-gray-800">
                                Pump {pump.id}
                              </h4>
                              <div className="tw-flex tw-items-center tw-gap-3 tw-text-sm tw-text-gray-500">
                                <span>Port {pump.port}</span>
                                <span>•</span>
                                <span>Address {pump.address}</span>
                                {port && (
                                  <>
                                    <span>•</span>
                                    <span>{PUMP_PROTOCOLS[port.protocol] || `Protocol ${port.protocol}`}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                          <div className="tw-flex tw-items-center tw-gap-3">
                            {nozzleConfig && (
                              <span className="tw-text-sm tw-text-gray-500">
                                {nozzleConfig.fuelGradeIds?.filter(id => id > 0).length || 0} nozzles
                              </span>
                            )}
                            <span className="tw-text-gray-400">
                              <i className={`fa-light ${isExpanded ? "fa-chevron-up" : "fa-chevron-down"}`}></i>
                            </span>
                          </div>
                        </div>

                        {/* Pump Details (Expanded) */}
                        {isExpanded && (
                          <div className={`tw-border-t tw-border-gray-200 tw-p-4 ${isModified ? "tw-bg-yellow-50" : "tw-bg-gray-50"}`}>
                            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-6">
                              {/* Pump Settings */}
                              <div>
                                <h5 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                                  <span><i className="fa-light fa-sliders"></i></span>
                                  Pump Settings
                                </h5>
                                <div className="tw-space-y-4">
                                  <div className="tw-bg-white tw-p-3 tw-rounded-lg tw-border tw-border-gray-200">
                                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                      Port Assignment
                                    </label>
                                    <Select
                                      value={getPumpValue(pump.id, "port", pump.port)}
                                      onChange={(v) => handlePumpChange(pump.id, "port", parseInt(v), pump.port)}
                                      options={pumpsConfig.ports?.map(p => ({
                                        value: p.id,
                                        label: `Port ${p.id} - ${PUMP_PROTOCOLS[p.protocol] || `Protocol ${p.protocol}`}`,
                                      })) || []}
                                      disabled={saving}
                                    />
                                  </div>

                                  <div className="tw-bg-white tw-p-3 tw-rounded-lg tw-border tw-border-gray-200">
                                    <NumberInput
                                      value={getPumpValue(pump.id, "address", pump.address)}
                                      onChange={(v) => handlePumpChange(pump.id, "address", v, pump.address)}
                                      min={1}
                                      max={99}
                                      label="Communication Address"
                                      disabled={saving}
                                    />
                                  </div>
                                </div>
                              </div>

                              {/* Nozzle Configuration (Read-only from GetPumpNozzlesConfiguration) */}
                              <div>
                                <h5 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
                                  <span><i className="fa-light fa-faucet-drip"></i></span>
                                  Nozzle Assignments
                                  <span className="tw-text-xs tw-text-gray-400 tw-font-normal">(from Protocol 66)</span>
                                </h5>
                                {nozzleConfig ? (
                                  <div className="tw-space-y-2">
                                    {nozzleConfig.fuelGradeIds?.map((fuelGradeId, idx) => {
                                      if (fuelGradeId === 0) return null;
                                      const tankId = nozzleConfig.tankIds?.[idx];
                                      const paymentFormId = nozzleConfig.paymentFormIds?.[idx];

                                      return (
                                        <div
                                          key={idx}
                                          className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200"
                                        >
                                          <div className="tw-flex tw-items-center tw-gap-3">
                                            <span className="tw-w-8 tw-h-8 tw-bg-green-100 tw-rounded tw-flex tw-items-center tw-justify-center tw-font-mono tw-font-bold tw-text-green-700">
                                              N{idx + 1}
                                            </span>
                                            <div className="tw-text-sm">
                                              <div className="tw-font-medium">Fuel Grade {fuelGradeId}</div>
                                              <div className="tw-text-gray-500 tw-text-xs">
                                                {tankId > 0 && <span>Tank {tankId}</span>}
                                                {paymentFormId > 0 && <span> • Payment Form {paymentFormId}</span>}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    }).filter(Boolean)}
                                    {(!nozzleConfig.fuelGradeIds || nozzleConfig.fuelGradeIds.every(id => id === 0)) && (
                                      <p className="tw-text-sm tw-text-gray-500 tw-italic tw-p-3 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200">
                                        No nozzles configured
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <div className="tw-p-3 tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-text-sm tw-text-gray-500">
                                    Nozzle configuration not available
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="tw-text-center tw-py-8 tw-text-gray-500">
                  <span><i className="fa-light fa-gas-pump tw-text-4xl tw-mb-3 tw-block tw-opacity-50"></i></span>
                  <p>No pumps configured on this device</p>
                </div>
              )}
            </div>
          )}

          {/* Summary Footer */}
          <div className="tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-center">
              <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg">
                <div className="tw-text-2xl tw-font-bold tw-text-blue-600">
                  {pumpsConfig.ports?.length || 0}
                </div>
                <div className="tw-text-xs tw-text-gray-500">Configured Ports</div>
              </div>
              <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg">
                <div className="tw-text-2xl tw-font-bold tw-text-green-600">
                  {pumpsConfig.pumps?.length || 0}
                </div>
                <div className="tw-text-xs tw-text-gray-500">Configured Pumps</div>
              </div>
              <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg">
                <div className="tw-text-2xl tw-font-bold tw-text-purple-600">
                  {nozzlesConfig?.pumpNozzles?.reduce((acc, p) =>
                    acc + (p.fuelGradeIds?.filter(id => id > 0).length || 0), 0) || 0}
                </div>
                <div className="tw-text-xs tw-text-gray-500">Total Nozzles</div>
              </div>
              <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg">
                <div className="tw-text-2xl tw-font-bold tw-text-orange-600">
                  {[...new Set(pumpsConfig.ports?.map(p => p.protocol) || [])].length}
                </div>
                <div className="tw-text-xs tw-text-gray-500">Protocols Used</div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="tw-text-center tw-py-6 tw-text-gray-500">
          <span><i className="fa-light fa-gas-pump tw-text-4xl tw-mb-3 tw-block tw-opacity-50"></i></span>
          <p>Click refresh to load pump configuration</p>
        </div>
      )}
    </ConfigSection>
  );
};

export default PumpServiceConfig;
