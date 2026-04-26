import React, {
  useEffect,
  useState,
  useMemo,
  useRef,
  useCallback,
} from "react";
import { useDispatch, useSelector } from "react-redux";
import { DataGrid } from "devextreme-react";
import {
  Column,
  Paging,
  Pager,
  Selection,
  Scrolling,
  SearchPanel,
} from "devextreme-react/data-grid";
import { Popup } from "devextreme-react/popup";
import { Button } from "devextreme-react/button";
import { SelectBox } from "devextreme-react/select-box";
import { LoadPanel } from "devextreme-react/load-panel";
import { confirm } from "devextreme/ui/dialog";
import notify from "devextreme/ui/notify";
import { useLocation, useNavigate } from "react-router-dom";
import {
  fetchProviders,
  fetchProviderDevices,
  mapDeviceToVehicle,
} from "../../../redux/actions/providerActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import "./MapGPSDevices.scss";

/**
 * Map GPS Devices Page Component
 * Allows users to map GPS devices from provider to FMS vehicles
 * Two-grid layout: Devices (left) and Vehicles (right)
 * Includes provider selector to choose which provider to fetch devices from
 */
const MapGPSDevices = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  // Grid refs for focus management
  const deviceGridRef = useRef(null);
  const vehicleGridRef = useRef(null);

  // Get data from Redux store
  const vehicles = useSelector((state) => state.vehicle.vehicles || []);
  const { providers: reduxProviders } = useSelector(
    (state) => state.provider || {}
  );

  // Normalize providers list
  const providers = useMemo(() => {
    const providerList = reduxProviders || [];
    return providerList
      .map((p) => ({
        providerId: p.providerId || p.ProviderId,
        providerName: p.providerName || p.ProviderName,
        displayName: p.displayName || p.DisplayName,
        isEnabled: p.isEnabled ?? p.IsEnabled ?? true,
      }))
      .filter((p) => p.isEnabled);
  }, [reduxProviders]);

  // Local state for devices (since they're provider-specific and temporary)
  const [devices, setDevices] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState(null);
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedVehicleKeys, setSelectedVehicleKeys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [mapping, setMapping] = useState(false);
  const [activeGrid, setActiveGrid] = useState("device"); // 'device' | 'vehicle'
  const [mappedDeviceIds, setMappedDeviceIds] = useState([]); // Track locally mapped device IDs
  const [mappedVehicleIds, setMappedVehicleIds] = useState([]); // Track locally mapped vehicle IDs
  // Filter states
  // Default to showing only online devices per request
  const [showOnlineOnly, setShowOnlineOnly] = useState(true);
  const [showUnmappedOnly, setShowUnmappedOnly] = useState(true);

  // When navigating here from a GPS fetch warning, pass IDs like:
  // /providermanagement/map-devices?unmapped=1597,1600
  const [unmappedGpsGateIds, setUnmappedGpsGateIds] = useState([]);
  const [showUnmappedPopup, setShowUnmappedPopup] = useState(false);
  const [applyUnmappedIdsFilter, setApplyUnmappedIdsFilter] = useState(false);

  const parseUnmappedIds = useCallback((raw) => {
    if (!raw) return [];
    return String(raw)
      .split(/[\s,;|]+/g)
      .map((x) => x.trim())
      .filter(Boolean);
  }, []);

  // Read unmapped IDs from query string (supports unmapped or unmappedVehicles)
  useEffect(() => {
    const params = new URLSearchParams(location.search || "");
    const raw = params.get("unmapped") || params.get("unmappedVehicles") || "";
    const parsed = parseUnmappedIds(raw);
    setUnmappedGpsGateIds(parsed);

    // If the URL provides a list, default to focusing unmapped devices
    if (parsed.length > 0) {
      setShowUnmappedOnly(true);
    }
  }, [location.search, parseUnmappedIds]);

  // Initial data load
  useEffect(() => {
    dispatch(fetchProviders());
    dispatch(fetchVehicleList());
  }, [dispatch]);

  // Initialize provider selection when providers are loaded
  useEffect(() => {
    if (providers.length > 0 && !selectedProvider) {
      setSelectedProvider(providers[0].providerName);
    }
  }, [providers, selectedProvider]);

  // Load devices when provider changes
  useEffect(() => {
    if (selectedProvider) {
      loadDevices();
    }
  }, [selectedProvider]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadDevices = useCallback(async () => {
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
  }, [dispatch, selectedProvider]);

  const filteredDevices = useMemo(() => {
    let filtered = devices;

    const unmappedIdSet =
      applyUnmappedIdsFilter && unmappedGpsGateIds.length
        ? new Set(unmappedGpsGateIds.map((x) => String(x)))
        : null;

    // Exclude locally mapped devices
    filtered = filtered.filter((d) => !mappedDeviceIds.includes(d.id));

    // If we navigated here with a specific list of unmapped GPSGate IDs,
    // allow focusing the grid on only those IDs.
    if (unmappedIdSet) {
      filtered = filtered.filter((d) => unmappedIdSet.has(String(d.id)));
    }

    if (showOnlineOnly) {
      filtered = filtered.filter((d) => d.isOnline);
    }

    if (showUnmappedOnly) {
      filtered = filtered.filter((d) => !d.isMapped);
    }

    return filtered;
  }, [
    devices,
    showOnlineOnly,
    showUnmappedOnly,
    mappedDeviceIds,
    applyUnmappedIdsFilter,
    unmappedGpsGateIds,
  ]);

  const clearUnmappedQueryParam = useCallback(() => {
    const params = new URLSearchParams(location.search || "");
    params.delete("unmapped");
    params.delete("unmappedVehicles");
    const next = params.toString();
    navigate({ search: next ? `?${next}` : "" }, { replace: true });
    setApplyUnmappedIdsFilter(false);
    setShowUnmappedPopup(false);
  }, [location.search, navigate]);

  const filteredVehicles = useMemo(() => {
    let filtered = vehicles;

    // Exclude locally mapped vehicles
    filtered = filtered.filter((v) => !mappedVehicleIds.includes(v.vehicleId));

    if (showUnmappedOnly) {
      // Only show vehicles without active mapping
      filtered = filtered.filter(
        (v) =>
          !devices.some((d) => d.mappedVehicleId === v.vehicleId && d.isMapped)
      );
    }
    return filtered;
  }, [vehicles, devices, showUnmappedOnly, mappedVehicleIds]);

  // If the currently selected device gets filtered out (e.g., due to online-only filter), clear selection
  useEffect(() => {
    if (
      selectedDevice &&
      !filteredDevices.some((d) => d.id === selectedDevice.id)
    ) {
      setSelectedDevice(null);
    }
  }, [filteredDevices, selectedDevice]);

  // Auto-map helper to map a selected device to a specific vehicle id
  const mapSelectedDeviceToVehicleId = useCallback(
    async (vehicleId) => {
      if (!selectedDevice) {
        notify("Select a device first", "warning", 2000);
        return false;
      }

      const vehicle = vehicles.find((v) => v.vehicleId === vehicleId);
      if (!vehicle) return false;

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
        const response = await dispatch(mapDeviceToVehicle(mappingData));
        if (response.success) {
          notify(
            `Mapped ${selectedDevice.name} to ${vehicle.vehicleCode}`,
            "success",
            2000
          );
          return true;
        }
      } catch (err) {
        console.error("Auto-map error:", err);
        const msg =
          err?.response?.data?.message || err.message || "Mapping failed";
        notify(msg, "error", 3000);
      }
      return false;
    },
    [dispatch, selectedDevice, selectedProvider, vehicles]
  );

  // Handle device grid selection
  const handleDeviceSelectionChanged = useCallback((e) => {
    const device = e.selectedRowsData[0] || null;
    setSelectedDevice(device);

    // When selecting a device, switch focus to vehicle grid
    if (device) {
      setActiveGrid("vehicle");
      // Focus vehicle grid after a short delay to let state update
      setTimeout(() => {
        if (vehicleGridRef.current) {
          vehicleGridRef.current.instance.focus();
        }
      }, 100);
    }
  }, []);

  // Handle vehicle grid selection - Show confirmation and auto-map
  const handleVehicleSelectionChanged = useCallback(
    async (e) => {
      const vehicle = e.selectedRowsData[0] || null;
      if (!vehicle) {
        setSelectedVehicle(null);
        setSelectedVehicleKeys([]);
        return;
      }

      setSelectedVehicle(vehicle);
      setSelectedVehicleKeys(e.selectedRowKeys);

      // If a device is selected, prompt for confirmation and auto-map
      if (selectedDevice && !mapping) {
        const result = await confirm(
          `<div>
          <p class="tw-font-semibold tw-mb-4"><strong>Map this device to vehicle?</strong></p>
          <div class="tw-flex tw-items-center tw-gap-4">
            <!-- Device Section -->
            <div class="tw-flex-1 tw-bg-gray-50 tw-p-3 tw-rounded">
              <p class="tw-font-semibold tw-text-sm tw-text-gray-700">Device</p>
              <p class="tw-font-medium tw-text-gray-900">${selectedDevice.name}</p>
              <p class="tw-text-xs tw-text-gray-600 tw-mt-1">IMEI: ${selectedDevice.imei}</p>
            </div>

            <!-- Arrow -->
            <div class="tw-flex tw-items-center tw-justify-center">
              <i class="fa-light fa-arrow-right tw-text-blue-500 tw-text-lg"></i>
            </div>

            <!-- Vehicle Section -->
            <div class="tw-flex-1 tw-bg-blue-50 tw-p-3 tw-rounded">
              <p class="tw-font-semibold tw-text-sm tw-text-gray-700">Vehicle</p>
              <p class="tw-font-medium tw-text-gray-900">${vehicle.vehicleCode}</p>
              <p class="tw-text-xs tw-text-gray-600 tw-mt-1">Plate: ${vehicle.numberPlate}</p>
            </div>
          </div>
        </div>`,
          "Confirm Mapping",
          {
            width: 550,
            height: "auto",
          }
        );

        if (result) {
          // User confirmed, proceed with mapping
          setMapping(true);
          try {
            const success = await mapSelectedDeviceToVehicleId(
              vehicle.vehicleId
            );
            if (success) {
              // Add to local mapped lists to remove from grids immediately
              setMappedDeviceIds((prev) => [...prev, selectedDevice.id]);
              setMappedVehicleIds((prev) => [...prev, vehicle.vehicleId]);

              // Clear selections and go back to device grid
              setSelectedDevice(null);
              setSelectedVehicle(null);
              setSelectedVehicleKeys([]);
              setActiveGrid("device");

              // Focus device grid
              setTimeout(() => {
                if (deviceGridRef.current) {
                  deviceGridRef.current.instance.focus();
                }
              }, 100);
            }
          } finally {
            setMapping(false);
          }
        } else {
          // User cancelled, clear vehicle selection
          setSelectedVehicle(null);
          setSelectedVehicleKeys([]);
        }
      }
    },
    [selectedDevice, mapping, mapSelectedDeviceToVehicleId]
  ); // Execute mapping for selected device and vehicle (fallback button)
  const handleMapDevice = useCallback(async () => {
    if (!selectedDevice || !selectedVehicle) {
      notify("Please select both a device and a vehicle", "warning", 2000);
      return;
    }

    if (selectedDevice.isMapped) {
      notify(
        "This device is already mapped to " + selectedDevice.mappedVehicleName,
        "warning",
        3000
      );
      return;
    }

    const result = await confirm(
      `<div>
        <p class="tw-font-semibold tw-mb-4"><strong>Map this device to vehicle?</strong></p>
        <div class="tw-flex tw-items-center tw-gap-4">
          <!-- Device Section -->
          <div class="tw-flex-1 tw-bg-gray-50 tw-p-3 tw-rounded">
            <p class="tw-font-semibold tw-text-sm tw-text-gray-700">Device</p>
            <p class="tw-font-medium tw-text-gray-900">${selectedDevice.name}</p>
            <p class="tw-text-xs tw-text-gray-600 tw-mt-1">IMEI: ${selectedDevice.imei}</p>
          </div>

          <!-- Arrow -->
          <div class="tw-flex tw-items-center tw-justify-center">
            <i class="fa-light fa-arrow-right tw-text-blue-500 tw-text-lg"></i>
          </div>

          <!-- Vehicle Section -->
          <div class="tw-flex-1 tw-bg-blue-50 tw-p-3 tw-rounded">
            <p class="tw-font-semibold tw-text-sm tw-text-gray-700">Vehicle</p>
            <p class="tw-font-medium tw-text-gray-900">${selectedVehicle.vehicleCode}</p>
            <p class="tw-text-xs tw-text-gray-600 tw-mt-1">Plate: ${selectedVehicle.numberPlate}</p>
          </div>
        </div>
      </div>`,
      "Confirm Mapping",
      {
        width: 550,
        height: "auto",
      }
    );

    if (!result) return;

    setMapping(true);
    try {
      const success = await mapSelectedDeviceToVehicleId(
        selectedVehicle.vehicleId
      );

      if (success) {
        // Add to local mapped lists to remove from grids immediately
        setMappedDeviceIds((prev) => [...prev, selectedDevice.id]);
        setMappedVehicleIds((prev) => [...prev, selectedVehicle.vehicleId]);

        // Clear selections and go back to device grid
        setSelectedDevice(null);
        setSelectedVehicle(null);
        setSelectedVehicleKeys([]);
        setActiveGrid("device");

        // Focus device grid
        setTimeout(() => {
          if (deviceGridRef.current) {
            deviceGridRef.current.instance.focus();
          }
        }, 100);
      }
    } finally {
      setMapping(false);
    }
  }, [selectedDevice, selectedVehicle, mapSelectedDeviceToVehicleId]);

  const renderOnlineStatus = (data) => {
    const isOnline = data.data.isOnline;
    return (
      <span
        className={`tw-inline-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
          isOnline
            ? "tw-bg-green-100 tw-text-green-800"
            : "tw-bg-gray-100 tw-text-gray-800"
        }`}
      >
        <i
          className={`fa-light fa-circle ${
            isOnline ? "tw-text-green-500" : "tw-text-gray-400"
          }`}
        ></i>
        {isOnline ? "Online" : "Offline"}
      </span>
    );
  };

  const renderLastActivity = (data) => {
    const timestamp = data.value;
    if (!timestamp)
      return <span className="tw-text-gray-400 tw-text-sm">Never</span>;

    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    let timeAgo = "";
    if (diffDays > 0) {
      timeAgo = `${diffDays}d ago`;
    } else if (diffHours > 0) {
      timeAgo = `${diffHours}h ago`;
    } else if (diffMins > 0) {
      timeAgo = `${diffMins}m ago`;
    } else {
      timeAgo = "Just now";
    }

    return (
      <div className="tw-text-xs">
        <div className="tw-text-gray-700">{timeAgo}</div>
        <div className="tw-text-gray-500">{date.toLocaleString()}</div>
      </div>
    );
  };

  return (
    <div className="map-gps-devices tw-h-full tw-flex tw-flex-col tw-p-6">
      <LoadPanel visible={loading} />

      <Popup
        visible={showUnmappedPopup}
        onHiding={() => setShowUnmappedPopup(false)}
        dragEnabled={true}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Unmapped GPSGate Vehicles (Device IDs)"
        width={720}
        height={520}
      >
        <div className="tw-flex tw-flex-col tw-gap-4 tw-p-4 tw-h-full">
          <div className="tw-text-sm tw-text-gray-700">
            These are the GPSGate "Vehicle" identifiers from the refueling
            report that currently have no mapping. Use this page to map each
            device to an FMS vehicle.
          </div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <Button
              stylingMode="contained"
              type="default"
              text={
                applyUnmappedIdsFilter
                  ? "Filtering devices by these IDs"
                  : "Filter devices by these IDs"
              }
              icon="fa-light fa-filter"
              onClick={() => {
                if (!unmappedGpsGateIds.length) return;
                setApplyUnmappedIdsFilter((v) => {
                  const next = !v;
                  if (next) {
                    // When focusing on these IDs, avoid hiding them due to Online-only.
                    setShowOnlineOnly(false);
                    setShowUnmappedOnly(true);
                  }
                  return next;
                });
              }}
              disabled={!unmappedGpsGateIds.length}
            />
            <Button
              stylingMode="outlined"
              type="normal"
              text="Copy IDs"
              icon="fa-light fa-copy"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(
                    unmappedGpsGateIds.join(",")
                  );
                  notify("Copied unmapped IDs to clipboard", "success", 2000);
                } catch {
                  notify("Could not copy to clipboard", "warning", 2000);
                }
              }}
              disabled={!unmappedGpsGateIds.length}
            />
            <div className="tw-flex-1"></div>
            <Button
              stylingMode="text"
              type="danger"
              text="Clear list"
              icon="fa-light fa-xmark"
              onClick={clearUnmappedQueryParam}
            />
          </div>

          <div className="tw-flex-1 tw-overflow-auto tw-border tw-border-gray-200 tw-rounded tw-bg-white">
            {unmappedGpsGateIds.length === 0 ? (
              <div className="tw-p-4 tw-text-sm tw-text-gray-500">
                No unmapped IDs were provided. You can open this page with:
                <div className="tw-mt-2 tw-font-mono tw-text-xs tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded tw-p-2">
                  /providermanagement/map-devices?unmapped=1597,1600
                </div>
              </div>
            ) : (
              <div className="tw-p-4">
                <div className="tw-text-sm tw-text-gray-600 tw-mb-2">
                  Total:{" "}
                  <span className="tw-font-semibold">
                    {unmappedGpsGateIds.length}
                  </span>
                </div>
                <div className="tw-grid tw-grid-cols-3 tw-gap-2">
                  {unmappedGpsGateIds.map((id) => (
                    <div
                      key={id}
                      className="tw-flex tw-items-center tw-justify-between tw-border tw-border-gray-200 tw-rounded tw-px-3 tw-py-2"
                    >
                      <div className="tw-font-semibold tw-text-gray-800">
                        {id}
                      </div>
                      <div className="tw-text-xs tw-text-gray-500">
                        {devices.some((d) => String(d.id) === String(id))
                          ? "In device list"
                          : "Not in device list"}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="tw-text-xs tw-text-gray-500">
            Tip: If a device shows "Not in device list", check Provider
            selection and click Refresh.
          </div>
        </div>
      </Popup>

      {/* Page Header */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-mb-6">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-center">
            <div>
              <h2 className="tw-text-lg tw-font-semibold tw-text-gray-900">
                <i className="fa-light fa-satellite-dish tw-mr-2"></i>
                Map GPS Devices to Vehicles
              </h2>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                Select a GPS device from your tracking provider and map it to an
                FMS vehicle
              </p>
            </div>
          </div>
        </div>

        {/* Provider Selector and Filter Controls */}
        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-p-4 tw-bg-gray-50">
          {/* Provider Selector */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
              <i className="fa-light fa-server tw-mr-1"></i>
              Provider:
            </label>
            <SelectBox
              dataSource={providers}
              displayExpr="displayName"
              valueExpr="providerName"
              value={selectedProvider}
              onValueChanged={(e) => {
                setSelectedProvider(e.value);
                setSelectedDevice(null);
                setDevices([]);
              }}
              placeholder="Select a provider"
              width={200}
              disabled={loading || mapping}
            />
          </div>

          {unmappedGpsGateIds.length > 0 && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-ml-2">
              <div className="tw-inline-flex tw-items-center tw-gap-2 tw-px-3 tw-py-1 tw-rounded tw-bg-yellow-50 tw-border tw-border-yellow-200">
                <i className="fa-light fa-triangle-exclamation tw-text-yellow-600"></i>
                <span className="tw-text-sm tw-text-yellow-800">
                  Unmapped IDs:{" "}
                  <span className="tw-font-semibold">
                    {unmappedGpsGateIds.length}
                  </span>
                </span>
              </div>
              <Button
                stylingMode="outlined"
                type="normal"
                text="View"
                icon="fa-light fa-list"
                onClick={() => setShowUnmappedPopup(true)}
              />
              <Button
                stylingMode={applyUnmappedIdsFilter ? "contained" : "outlined"}
                type={applyUnmappedIdsFilter ? "default" : "normal"}
                text={applyUnmappedIdsFilter ? "Filtered" : "Filter"}
                icon="fa-light fa-filter"
                onClick={() => {
                  setApplyUnmappedIdsFilter((v) => {
                    const next = !v;
                    if (next) {
                      setShowOnlineOnly(false);
                      setShowUnmappedOnly(true);
                    }
                    return next;
                  });
                }}
              />
            </div>
          )}

          <div className="tw-border-l tw-border-gray-300 tw-h-6 tw-self-center"></div>

          <div className="tw-flex tw-items-center tw-gap-2">
            <input
              type="checkbox"
              id="showOnlineOnly"
              checked={showOnlineOnly}
              onChange={(e) => setShowOnlineOnly(e.target.checked)}
              className="tw-w-4 tw-h-4"
            />
            <label
              htmlFor="showOnlineOnly"
              className="tw-text-sm tw-text-gray-700"
            >
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
            <label
              htmlFor="showUnmappedOnly"
              className="tw-text-sm tw-text-gray-700"
            >
              Show unmapped only
            </label>
          </div>

          <div className="tw-flex-1"></div>

          <div className="tw-text-sm tw-text-gray-600">
            Devices:{" "}
            <span className="tw-font-semibold">{filteredDevices.length}</span> /{" "}
            {devices.length} | Vehicles:{" "}
            <span className="tw-font-semibold">{filteredVehicles.length}</span>{" "}
            / {vehicles.length}
          </div>

          <Button
            stylingMode="outlined"
            type="normal"
            text="Refresh"
            icon="fa-light fa-refresh"
            onClick={loadDevices}
            disabled={loading || mapping || !selectedProvider}
          />
        </div>
      </div>

      {/* Two-Grid Layout */}
      <div className="tw-flex-1 tw-grid tw-grid-cols-2 tw-gap-6 tw-overflow-hidden tw-min-h-0">
        {/* GPS Devices Grid */}
        <div
          className={`tw-flex tw-flex-col tw-bg-white tw-rounded-lg tw-shadow tw-overflow-hidden ${
            activeGrid === "device" ? "tw-ring-2 tw-ring-blue-500" : ""
          }`}
          onMouseDown={() => setActiveGrid("device")}
        >
          <div className="tw-bg-gray-100 tw-px-4 tw-py-3 tw-border-b tw-border-gray-200">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-text-base">
              <i className="fa-light fa-satellite-dish tw-mr-2"></i>
              GPS Devices
              {selectedProvider && (
                <span className="tw-text-sm tw-font-normal tw-text-gray-500 tw-ml-2">
                  from{" "}
                  {providers.find((p) => p.providerName === selectedProvider)
                    ?.displayName || selectedProvider}
                </span>
              )}
            </h3>
            {!selectedDevice ? (
              <div className="guide-text-flash tw-mt-2">
                <i className="fa-light fa-circle tw-mr-2"></i>
                First select a device
              </div>
            ) : (
              <div className="guide-text-device tw-mt-2">
                <i className="fa-light fa-circle-check tw-mr-2"></i>
                Device selected
              </div>
            )}
          </div>
          <div className="tw-flex-1 tw-overflow-hidden">
            <DataGrid
              ref={deviceGridRef}
              className="device-grid"
              dataSource={filteredDevices}
              keyExpr="id"
              showBorders={false}
              rowAlternationEnabled={false}
              hoverStateEnabled={true}
              focusedRowEnabled={true}
              focusedRowKey={selectedDevice?.id}
              selectedRowKeys={selectedDevice ? [selectedDevice.id] : []}
              onSelectionChanged={handleDeviceSelectionChanged}
              onFocusedRowChanged={(e) => {
                if (e.row) {
                  setActiveGrid("device");
                }
              }}
              height="100%"
            >
              <Selection mode="single" />
              <SearchPanel
                visible={true}
                width={240}
                placeholder="Search devices..."
              />
              <Scrolling mode="standard" />
              <Paging enabled={true} defaultPageSize={20} />
              <Pager
                showPageSizeSelector={true}
                allowedPageSizes={[10, 20, 50, 100]}
                showInfo={true}
                showNavigationButtons={true}
              />

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
          className={`tw-flex tw-flex-col tw-bg-white tw-rounded-lg tw-shadow tw-overflow-hidden ${
            activeGrid === "vehicle" ? "tw-ring-2 tw-ring-blue-500" : ""
          } ${!selectedDevice ? "tw-opacity-50" : ""}`}
          onMouseDown={() => selectedDevice && setActiveGrid("vehicle")}
        >
          <div className="tw-bg-gray-100 tw-px-4 tw-py-3 tw-border-b tw-border-gray-200">
            <h3 className="tw-font-semibold tw-text-gray-800 tw-text-base">
              <i className="fa-light fa-car tw-mr-2"></i>
              FMS Vehicles
            </h3>
            {selectedDevice && !selectedVehicle ? (
              <div className="guide-text-flash tw-mt-2">
                <i className="fa-light fa-arrow-down-to-line tw-mr-2"></i>
                Assign matching vehicle
              </div>
            ) : !selectedDevice ? (
              <div className="guide-text-vehicle tw-mt-2">
                <i className="fa-light fa-lock tw-mr-2"></i>
                Select a device first
              </div>
            ) : (
              <div className="guide-text-vehicle tw-mt-2">
                <i className="fa-light fa-arrow-right tw-mr-2"></i>
                Then select a vehicle
              </div>
            )}
          </div>
          <div
            className={`tw-flex-1 tw-overflow-hidden ${
              !selectedDevice ? "tw-pointer-events-none" : ""
            }`}
          >
            <DataGrid
              ref={vehicleGridRef}
              className="vehicle-grid"
              dataSource={filteredVehicles}
              keyExpr="vehicleId"
              showBorders={false}
              rowAlternationEnabled={false}
              hoverStateEnabled={selectedDevice ? true : false}
              focusedRowEnabled={selectedDevice ? true : false}
              focusedRowKey={selectedVehicle?.vehicleId}
              selectedRowKeys={selectedVehicleKeys}
              onSelectionChanged={
                selectedDevice ? handleVehicleSelectionChanged : undefined
              }
              onFocusedRowChanged={(e) => {
                if (e.row && selectedDevice) {
                  setActiveGrid("vehicle");
                }
              }}
              height="100%"
            >
              <Selection mode="single" />
              <SearchPanel
                visible={true}
                width={240}
                placeholder="Search vehicles..."
              />
              <Scrolling mode="standard" />
              <Paging enabled={true} defaultPageSize={20} />
              <Pager
                showPageSizeSelector={true}
                allowedPageSizes={[10, 20, 50, 100]}
                showInfo={true}
                showNavigationButtons={true}
              />

              <Column dataField="vehicleId" caption="ID" width={60} />
              <Column dataField="vehicleCode" caption="Vehicle Name" width={150} />
              <Column
                dataField="numberPlate"
                caption="Number Plate"
                width={120}
              />
            </DataGrid>
          </div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-mt-6 tw-p-4">
        <div className="tw-flex tw-flex-col tw-gap-4">
          {/* Status Messages */}
          {selectedDevice && selectedVehicle && (
            <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
              <div className="tw-flex tw-items-start tw-gap-3">
                <i className="fa-light fa-info-circle tw-text-blue-500 tw-mt-0.5 tw-flex-shrink-0"></i>
                <div>
                  <div className="tw-text-sm tw-text-blue-900">
                    <span className="tw-font-semibold">Device:</span>{" "}
                    {selectedDevice.name} (IMEI: {selectedDevice.imei})
                  </div>
                  <div className="tw-text-sm tw-text-blue-800">
                    <span className="tw-font-semibold">Vehicle:</span>{" "}
                    {selectedVehicle.vehicleCode} ({selectedVehicle.numberPlate})
                  </div>
                </div>
              </div>
              <Button
                stylingMode="contained"
                type="success"
                text="Map Device to Vehicle"
                icon="fa-light fa-link"
                onClick={handleMapDevice}
                disabled={mapping}
              />
            </div>
          )}

          {!selectedDevice && !selectedVehicle && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-500 tw-p-2">
              <i className="fa-light fa-hand-pointer"></i>
              <span>
                <strong>Step 1:</strong> Select a device from the left panel
              </span>
            </div>
          )}

          {selectedDevice && !selectedVehicle && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-green-600 tw-p-2 tw-bg-green-50 tw-rounded">
              <i className="fa-light fa-check-circle"></i>
              <span>
                <strong>Device selected:</strong> {selectedDevice.name} — Now
                select a vehicle from the right panel
              </span>
            </div>
          )}

          {!selectedDevice && selectedVehicle && (
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-yellow-600 tw-p-2 tw-bg-yellow-50 tw-rounded">
              <i className="fa-light fa-exclamation-circle"></i>
              <span>Please select a device first from the left panel</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapGPSDevices;
