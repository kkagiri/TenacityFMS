import React, { useEffect, useState, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Popup } from "devextreme-react/popup";
import { DataGrid } from "devextreme-react";
import { Column, Paging, Selection, Scrolling, SearchPanel } from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { SelectBox } from "devextreme-react/select-box";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import {
  fetchProviders,
  fetchProviderDevices,
  mapDeviceToVehicle,
} from "../../../redux/actions/providerActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import "./DeviceMappingPopup.scss";

/**
 * Device Mapping Popup Component
 * Allows users to map GPS devices from provider to FMS vehicles
 * Two-grid layout: Devices (left) and Vehicles (right)
 * Includes provider selector to choose which provider to fetch devices from
 */
const DeviceMappingPopup = ({ visible, onHiding, providers: externalProviders, onMappingComplete }) => {
  const dispatch = useDispatch();

  // Get data from Redux store
  const vehicles = useSelector((state) => state.vehicle.vehicles || []);
  const { providers: reduxProviders } = useSelector((state) => state.provider || {});

  // Use external providers if provided, otherwise use from Redux
  const providers = useMemo(() => {
    const providerList = externalProviders || reduxProviders || [];
    return providerList.map((p) => ({
      providerId: p.providerId || p.ProviderId,
      providerName: p.providerName || p.ProviderName,
      displayName: p.displayName || p.DisplayName,
      isEnabled: p.isEnabled ?? p.IsEnabled ?? true,
    })).filter(p => p.isEnabled);
  }, [externalProviders, reduxProviders]);

  // Local state for devices (since they're provider-specific and temporary)
  const [devices, setDevices] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleKeys, setSelectedVehicleKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [autoMapOnVehicleSelect, setAutoMapOnVehicleSelect] = useState(true);
  const [activeGrid, setActiveGrid] = useState(null); // 'device' | 'vehicle'

  // Filter states
  // Default to showing only online devices per request
  const [showOnlineOnly, setShowOnlineOnly] = useState(true);
  const [showUnmappedOnly, setShowUnmappedOnly] = useState(true);

  // Initialize provider selection when popup opens or providers change
  useEffect(() => {
    if (visible && providers.length > 0 && !selectedProvider) {
      // Default to first enabled provider
      setSelectedProvider(providers[0].providerName);
    }
  }, [visible, providers, selectedProvider]);

  // Fetch providers if not available
  useEffect(() => {
    if (visible && !externalProviders && (!reduxProviders || reduxProviders.length === 0)) {
      dispatch(fetchProviders());
    }
  }, [visible, externalProviders, reduxProviders, dispatch]);

  useEffect(() => {
    if (visible && selectedProvider) {
      loadDevices();
      loadVehicles();
    } else if (!visible) {
      // Reset state when popup closes
      setSelectedDevice(null);
      setSelectedVehicle(null);
      setDevices([]);
    }
  }, [visible, selectedProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDevices = async () => {
    if (!selectedProvider) return;

    setLoading(true);
    try {
      const response = await dispatch(fetchProviderDevices(selectedProvider));
      if (response.success) {
        setDevices(response.data || []);
      }
    } catch (error) {
      console.error("Error loading devices:", error);
      notify("Error loading devices from provider", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadVehicles = async () => {
    try {
      await dispatch(fetchVehicleList());
    } catch (error) {
      console.error("Error loading vehicles:", error);
      notify("Error loading vehicles", "error", 3000);
    }
  };

  const filteredDevices = useMemo(() => {
    let filtered = devices;

    if (showOnlineOnly) {
      filtered = filtered.filter(d => d.isOnline);
    }

    if (showUnmappedOnly) {
      filtered = filtered.filter(d => !d.isMapped);
    }

    return filtered;
  }, [devices, showOnlineOnly, showUnmappedOnly]);

  const filteredVehicles = useMemo(() => {
    if (showUnmappedOnly) {
      // Only show vehicles without active mapping
      return vehicles.filter(v => !devices.some(d => d.mappedVehicleId === v.vehicleId && d.isMapped));
    }
    return vehicles;
  }, [vehicles, devices, showUnmappedOnly]);

  // If the currently selected device gets filtered out (e.g., due to online-only filter), clear selection
  useEffect(() => {
    if (selectedDevice && !filteredDevices.some(d => d.id === selectedDevice.id)) {
      setSelectedDevice(null);
    }
  }, [filteredDevices, selectedDevice]);

  const handleMapDevice = async () => {
    if (!selectedDevice || !selectedVehicle) {
      notify("Please select both a device and a vehicle", "warning", 2000);
      return;
    }

    if (selectedDevice.isMapped) {
      notify("This device is already mapped to " + selectedDevice.mappedVehicleName, "warning", 3000);
      return;
    }

    setMapping(true);
    try {
      const mappingData = {
        vehicleId: selectedVehicle.vehicleId,
        providerName: selectedProvider,
        externalDeviceId: String(selectedDevice.id), // Convert to string
        deviceIMEI: selectedDevice.imei,
        deviceName: selectedDevice.name,
        deviceType: selectedDevice.deviceType,
        metadata: JSON.stringify({
          username: selectedDevice.username,
          phoneNumber: selectedDevice.phoneNumber,
          protocol: selectedDevice.protocol,
          lastPositionUpdate: selectedDevice.lastPositionUpdate,
          lastDeviceActivity: selectedDevice.lastDeviceActivity
        })
      };

      const response = await dispatch(mapDeviceToVehicle(mappingData));

      if (response.success) {
        notify(`Successfully mapped device ${selectedDevice.name} to vehicle ${selectedVehicle.hyoungNo}`, "success", 3000);

        // Reload devices to update mapping status
        await loadDevices();

        // Clear selections
        setSelectedDevice(null);
        setSelectedVehicle(null);

        // Notify parent component
        if (onMappingComplete) {
          onMappingComplete();
        }
      }
    } catch (error) {
      console.error("Error mapping device:", error);
      notify(error.message || "Error mapping device to vehicle", "error", 3000);
    } finally {
      setMapping(false);
    }
  };

  // Auto-map helper to map a selected device to a specific vehicle id
  const mapSelectedDeviceToVehicleId = async (vehicleId) => {
    if (!selectedDevice) {
      notify("Select a device first", "warning", 2000);
      return;
    }

    const vehicle = vehicles.find((v) => v.vehicleId === vehicleId);
    if (!vehicle) return;

    const mappingData = {
      vehicleId: vehicle.vehicleId,
      providerName: selectedProvider,
      externalDeviceId: String(selectedDevice.id),
      deviceIMEI: selectedDevice.imei,
      deviceName: selectedDevice.name,
      deviceType: selectedDevice.deviceType,
      metadata: JSON.stringify({
        username: selectedDevice.username,
        phoneNumber: selectedDevice.phoneNumber,
        protocol: selectedDevice.protocol,
        lastPositionUpdate: selectedDevice.lastPositionUpdate,
        lastDeviceActivity: selectedDevice.lastDeviceActivity,
      }),
    };

    try {
      setMapping(true);
      const response = await dispatch(mapDeviceToVehicle(mappingData));
      if (response.success) {
        notify(
          `Mapped ${selectedDevice.name} to ${vehicle.hyoungNo}`,
          "success",
          2000
        );
        // Refresh devices to reflect mapping flags
        await loadDevices();
      }
    } catch (err) {
      console.error("Auto-map error:", err);
      const msg = err?.response?.data?.message || err.message || "Mapping failed";
      notify(msg, "error", 3000);
    } finally {
      setMapping(false);
    }
  };

  const renderOnlineStatus = (data) => {
    const isOnline = data.data.isOnline;
    return (
      <span className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
        isOnline ? 'tw-bg-green-100 tw-text-green-800' : 'tw-bg-gray-100 tw-text-gray-800'
      }`}>
        <i className={`fa-light fa-circle ${isOnline ? 'tw-text-green-500' : 'tw-text-gray-400'}`}></i>
        {isOnline ? 'Online' : 'Offline'}
      </span>
    );
  };

  const renderLastActivity = (data) => {
    const timestamp = data.value;
    if (!timestamp) return <span className="tw-text-gray-400 tw-text-sm">Never</span>;

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo = '';
    if (diffDays > 0) {
      timeAgo = `${diffDays}d ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours}h ago`;
    } else if (diffMins > 0) {
      timeAgo = `${diffMins}m ago`;
    } else {
      timeAgo = 'Just now';
    }

    return (
      <div className="tw-text-xs">
        <div className="tw-text-gray-700">{timeAgo}</div>
        <div className="tw-text-gray-500">{date.toLocaleString()}</div>
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={true}
      closeOnOutsideClick={false}
      showTitle={true}
      title="Map GPS Devices to Vehicles"
      width="90%"
      height="90%"
      showCloseButton={true}
    >
      <div className="device-mapping-popup">
        <LoadPanel visible={loading} />

        <div className="tw-h-full tw-flex tw-flex-col tw-p-4">
        {/* Provider Selector and Filter Controls */}
        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-mb-6 tw-pb-4 tw-border-b tw-border-gray-200">
          {/* Provider Selector */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
              <i className="fa-light fa-satellite-dish tw-mr-1"></i>
              Provider:
            </label>
            <SelectBox
              dataSource={providers}
              displayExpr="displayName"
              valueExpr="providerName"
              value={selectedProvider}
              onValueChanged={(e) => {
                setSelectedProvider(e.value);
                setSelectedDevice(null); // Clear device selection when provider changes
                setDevices([]); // Clear devices list
              }}
              placeholder="Select a provider"
              width={200}
              disabled={loading || mapping}
            />
          </div>

          <div className="tw-border-l tw-border-gray-300 tw-h-6 tw-self-center"></div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <input
              type="checkbox"
              id="showOnlineOnly"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="tw-w-4 tw-h-4"
            />
            <label htmlFor="showOnlineOnly" className="tw-text-sm tw-text-gray-700">
              Show online devices only
            </label>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <input
              type="checkbox"
              id="showUnmappedOnly"
              checked={showUnmappedOnly}
              onChange={(e) => setShowUnmappedOnly(e.target.checked)}
              className="tw-w-4 tw-h-4"
            />
            <label htmlFor="showUnmappedOnly" className="tw-text-sm tw-text-gray-700">
              Show unmapped only
            </label>
          </div>
          <div className="tw-flex-1"></div>
          <div className="tw-text-sm tw-text-gray-600">
            Devices: <span className="tw-font-semibold">{filteredDevices.length}</span> / {devices.length}
            {' '} | Vehicles: <span className="tw-font-semibold">{filteredVehicles.length}</span> / {vehicles.length}
          </div>
        </div>

        {/* Two-Grid Layout */}
        <div className="tw-flex-1 tw-grid tw-grid-cols-2 tw-gap-6 tw-overflow-hidden">
          {/* GPS Devices Grid */}
          <div
            className={`tw-flex tw-flex-col tw-border tw-border-gray-300 tw-rounded ${
              activeGrid === 'device' ? 'active-grid-highlight' : ''
            }`}
            onMouseDown={() => setActiveGrid('device')}
          >
            <div className="tw-bg-gray-100 tw-px-4 tw-py-3 tw-border-b tw-border-gray-300">
              <h3 className="tw-font-semibold tw-text-gray-800 tw-text-base">
                <i className="fa-light fa-satellite-dish tw-mr-2"></i>
                GPS Devices
              </h3>
            </div>
            <div className="tw-flex-1 tw-overflow-hidden">
              <DataGrid
                className="device-grid"
                dataSource={filteredDevices}
                keyExpr="id"
                showBorders={false}
                rowAlternationEnabled={true}
                hoverStateEnabled={true}
                selectedRowKeys={selectedDevice ? [selectedDevice.id] : []}
                onSelectionChanged={(e) => setSelectedDevice(e.selectedRowsData[0] || null)}
                height="100%"
              >
                <Selection mode="single" />
                <SearchPanel visible={true} width={240} placeholder="Search devices..." />
                <Scrolling mode="virtual" />
                <Paging enabled={false} />

                <Column dataField="username" caption="Username" width={100} />
                <Column dataField="name" caption="Device Name" width={140} />
                <Column dataField="imei" caption="IMEI" width={120} />
                <Column dataField="phoneNumber" caption="Phone" width={110} />
                <Column
                  caption="Status"
                  cellRender={renderOnlineStatus}
                  width={80}
                  alignment="center"
                />
                <Column
                  dataField="lastDeviceActivity"
                  caption="Last Activity"
                  cellRender={renderLastActivity}
                  width={120}
                />
              </DataGrid>
            </div>
          </div>

          {/* FMS Vehicles Grid */}
          <div
            className={`tw-flex tw-flex-col tw-border tw-border-gray-300 tw-rounded ${
              activeGrid === 'vehicle' ? 'active-grid-highlight' : ''
            }`}
            onMouseDown={() => setActiveGrid('vehicle')}
          >
            <div className="tw-bg-gray-100 tw-px-4 tw-py-3 tw-border-b tw-border-gray-300">
              <h3 className="tw-font-semibold tw-text-gray-800 tw-text-base">
                <i className="fa-light fa-car tw-mr-2"></i>
                FMS Vehicles
              </h3>
            </div>
            <div className="tw-flex-1 tw-overflow-hidden">
              <DataGrid
                className="vehicle-grid"
                dataSource={filteredVehicles}
                keyExpr="vehicleId"
                showBorders={false}
                rowAlternationEnabled={true}
                hoverStateEnabled={true}
                selectedRowKeys={selectedVehicleKeys}
                onSelectionChanged={async (e) => {
                  setSelectedVehicle(e.selectedRowsData[0] || null);
                  setSelectedVehicleKeys(e.selectedRowKeys);

                  // Auto map only for newly selected rows if toggle is on
                  if (autoMapOnVehicleSelect && e.currentSelectedRowKeys?.length) {
                    // Map sequentially to avoid race conditions
                    for (const vId of e.currentSelectedRowKeys) {
                      await mapSelectedDeviceToVehicleId(vId);
                    }
                  }
                }}
                height="100%"
              >
                <Selection mode="multiple" showCheckBoxesMode="always" />
                <SearchPanel visible={true} width={240} placeholder="Search vehicles..." />
                <Scrolling mode="virtual" />
                <Paging enabled={false} />

                <Column dataField="vehicleId" caption="ID" width={60} />
                <Column dataField="hyoungNo" caption="Vehicle Name" width={150} />
                <Column dataField="numberPlate" caption="Number Plate" width={120} />
              </DataGrid>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="tw-flex tw-flex-col tw-gap-4 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          {/* Controls */}
          <div className="tw-flex tw-items-center tw-justify-between">
            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-700">
              <input
                type="checkbox"
                checked={autoMapOnVehicleSelect}
                onChange={(e) => setAutoMapOnVehicleSelect(e.target.checked)}
              />
              Auto-map selected device to selected vehicles
            </label>

            <div className="tw-flex tw-gap-2">
              <Button
                stylingMode="outlined"
                type="normal"
                text="Refresh"
                icon="fa-light fa-refresh"
                onClick={loadDevices}
                disabled={loading || mapping}
              />
              <Button
                stylingMode="contained"
                type="success"
                text="Map Device to Vehicle"
                icon="fa-light fa-link"
                onClick={handleMapDevice}
                disabled={!selectedDevice || !selectedVehicle || mapping}
              />
            </div>
          </div>
          {/* Notification Message */}
          {selectedDevice && selectedVehicle && (
            <div className="tw-flex tw-items-start tw-gap-3 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
              <i className="fa-light fa-info-circle tw-text-blue-500 tw-mt-0.5 tw-flex-shrink-0"></i>
              <div>
                <div className="tw-text-sm tw-text-blue-900">
                  <span className="tw-font-semibold">Ready to map:</span> {selectedDevice.name} (IMEI: {selectedDevice.imei})
                </div>
                <div className="tw-text-sm tw-text-blue-800">
                  <span className="tw-font-semibold">To vehicle:</span> {selectedVehicle.hyoungNo} ({selectedVehicle.numberPlate})
                </div>
              </div>
            </div>
          )}

          {/* Button Controls (secondary, kept for manual mapping) */}
          <div className="tw-flex tw-items-center tw-justify-between">
            {!selectedDevice && !selectedVehicle && (
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-500">
                <i className="fa-light fa-hand-pointer"></i>
                <span>Select a device and a vehicle to map them</span>
              </div>
            )}
            {(selectedDevice || selectedVehicle) && !(selectedDevice && selectedVehicle) && (
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-yellow-600">
                <i className="fa-light fa-exclamation-circle"></i>
                <span>Please select {!selectedDevice ? 'a device' : 'a vehicle'}</span>
              </div>
            )}
            {selectedDevice && selectedVehicle && <div></div>}

            <div></div>
          </div>
        </div>
        </div>
      </div>
    </Popup>
  );
};

export default DeviceMappingPopup;
