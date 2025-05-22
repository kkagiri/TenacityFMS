import React, { useState, useEffect, memo, useMemo } from "react";
import { Popup } from "devextreme-react/popup";
import { Form, SimpleItem, GroupItem } from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { useDispatch, useSelector } from "react-redux";
import { createTag, updateTag } from "../../../redux/actions/tagActions";
import { LoadPanel } from "devextreme-react/load-panel";
import { RadioGroup } from "devextreme-react/radio-group";
import { SelectBox } from "devextreme-react/select-box";
import { List } from "devextreme-react/list";
import notify from "devextreme/ui/notify";
import "./TagForm.scss";
import { Tabs } from "devextreme-react/tabs";
import SignalRService from "../../../signalR/SignalRService";

const TagForm = ({ isVisible, onClose, onSave, tag }) => {
  const dispatch = useDispatch();
  const vehicles = useSelector((state) => state.vehicle.vehicles || []);
  const ruleSets = useSelector((state) => state.fuelingRule.ruleSets || []);

  // Get realtime reader status for tag scanning
  const deviceReaderStatus = useSelector(
    (state) => state.realtimeStatus?.deviceReaderStatus || {}
  );

  // Get the device connection statuses from both summary and status objects
  const deviceConnectionStatuses = useSelector(
    (state) => state.deviceConnections?.connectionStatuses || {}
  );

  const deviceConnectionSummary = useSelector(
    (state) => state.deviceConnections?.summary || {}
  );

  // Get all connected PTS devices - simplified to only show device ID
  const connectedDevices = useMemo(() => {
    const devices = [];

    // Try getting from connectionStatuses first
    if (Object.keys(deviceConnectionStatuses).length > 0) {
      Object.entries(deviceConnectionStatuses).forEach(([deviceId, status]) => {
        if (status?.status === "Connected" || status?.status === "Active") {
          // Simplified - just use the device ID
          devices.push({
            id: deviceId,
            name: `Device ${deviceId}`,
            status: status.status,
            lastActivity: status.lastActivity,
            source: "connectionStatuses",
          });
        }
      });
    }

    // If no devices found, try from summary
    if (devices.length === 0 && deviceConnectionSummary?.webSocketConnections) {
      deviceConnectionSummary.webSocketConnections.forEach((device) => {
        // Map status numbers to strings
        let statusText = "Unknown";
        if (device.status === 0) statusText = "Connected";
        else if (device.status === 1) statusText = "Active";
        else if (device.status === 2) statusText = "Idle";

        // Simplified - just use the device ID
        devices.push({
          id: device.deviceId,
          name: `Device ${device.deviceId}`,
          status: statusText,
          lastActivity: device.lastMessageAt,
          source: "summary",
        });
      });
    }

    console.log("Final devices list:", devices);

    // Sort devices by ID for consistent ordering
    return devices.sort((a, b) => a.id.localeCompare(b.id));
  }, [deviceConnectionStatuses, deviceConnectionSummary]);

  const [formMode, setFormMode] = useState("manual"); // "manual" or "scan"
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detectedTags, setDetectedTags] = useState([]);
  const [scanning, setScanning] = useState(false);
  const [isLoadingDevices, setIsLoadingDevices] = useState(false);
  const [isLoadingReaders, setIsLoadingReaders] = useState(false);
  const [deviceRequestSent, setDeviceRequestSent] = useState({});

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    isEnabled: true,
    vehicleId: null,
    fuelRuleSetId: null,
    isMaster: false,
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Get list of all PTS devices with online readers
  const devices = useSelector((state) => {
    // Get all devices with online readers
    const devicesWithReaders = [];

    // Process device reader status to find online readers
    Object.entries(deviceReaderStatus).forEach(([deviceId, readers]) => {
      if (
        readers &&
        Object.values(readers).some((reader) => reader.status === "online")
      ) {
        // Find device details if available
        const device = {
          id: deviceId,
          name: `Device ${deviceId}`, // Default name
          readers: Object.values(readers).filter(
            (reader) => reader.status === "online"
          ),
        };

        devicesWithReaders.push(device);
      }
    });

    return devicesWithReaders;
  });

  // Add processing for raw upload status
  const [rawDeviceData, setRawDeviceData] = useState({}); //Cursor
  const deviceUploadStatus = useSelector(
    (state) => state.realtimeStatus?.uploadStatusByDevice || {}
  ); //Cursor

  // Process the upload status to extract reader information
  useEffect(() => {
    if (selectedDevice && deviceUploadStatus[selectedDevice]?.status) {
      const rawStatus = deviceUploadStatus[selectedDevice].status;
      setRawDeviceData(rawStatus);

      // Process the received data
      console.log(
        "Received upload status for device:",
        selectedDevice,
        rawStatus
      );

      // If we received data, stop the loading state
      setIsLoadingReaders(false);
    }
  }, [selectedDevice, deviceUploadStatus]); //Cursor

  // Refresh all devices when tab is changed to scan mode
  useEffect(() => {
    if (formMode === "scan") {
      refreshDeviceStatus();
    }
  }, [formMode]);

  // Add debug logging for connected devices
  useEffect(() => {
    if (formMode === "scan") {
      console.log("Connected devices from Redux:", connectedDevices);
      console.log("Raw device connection summary:", deviceConnectionSummary);
    }
  }, [formMode, connectedDevices, deviceConnectionSummary]); //Cursor

  // Function to refresh all device statuses
  const refreshDeviceStatus = async () => {
    setIsLoadingDevices(true);
    try {
      // Log before the request
      console.log("Requesting all devices status...");

      // Send the request
      await SignalRService.requestAllDevicesStatus();

      // Log Redux state directly
      console.log(
        "Current Redux device connection state:",
        "connectionStatuses:",
        deviceConnectionStatuses,
        "summary:",
        deviceConnectionSummary
      );

      // Set a timeout to provide feedback regardless of response
      setTimeout(() => {
        console.log(
          "Device refresh timeout elapsed, current devices:",
          connectedDevices.length
        );
        // Log again after timeout
        console.log(
          "Redux state after timeout:",
          "connectionStatuses:",
          deviceConnectionStatuses,
          "summary:",
          deviceConnectionSummary
        );
        setIsLoadingDevices(false);
      }, 1500);
    } catch (error) {
      console.error("Error refreshing device status:", error);
      setIsLoadingDevices(false);
    }
  };

  // Function to manually refresh the SignalR connection entirely
  const refreshSignalRConnection = async () => {
    //Cursor
    try {
      console.log("Attempting to refresh SignalR connection...");
      await SignalRService.refreshConnection();
      console.log("SignalR connection refreshed.");
    } catch (error) {
      console.error("Error refreshing SignalR connection:", error);
    }
  };

  useEffect(() => {
    if (tag) {
      setFormData({
        id: tag.id,
        name: tag.name || "",
        isEnabled: tag.isEnabled !== false, // default to true if undefined
        vehicleId: tag.vehicleId || null,
        fuelRuleSetId: tag.fuelRuleSetId || null,
        isMaster: tag.isMaster || false,
      });
    } else {
      // Reset form for new tag
      setFormData({
        name: "",
        isEnabled: true,
        vehicleId: null,
        fuelRuleSetId: null,
        isMaster: false,
      });
    }
  }, [tag]);

  // Add useEffect to set default fuelRuleSetId when ruleSets is loaded
  useEffect(() => {
    if (ruleSets && ruleSets.length > 0 && !formData.fuelRuleSetId && !tag) {
      setFormData((prev) => ({
        ...prev,
        fuelRuleSetId: ruleSets[0].id,
      }));
    }
  }, [ruleSets, tag]);

  // Monitor for detected tags when in scan mode from raw device data
  useEffect(() => {
    if (formMode === "scan" && selectedDevice && scanning && rawDeviceData) {
      // Check for tags in the pumps section
      if (rawDeviceData.pumps) {
        const pumps = rawDeviceData.pumps;

        // Check idle pumps
        if (pumps.idleStatus && pumps.idleStatus.tags && pumps.idleStatus.ids) {
          pumps.idleStatus.tags.forEach((tag, index) => {
            if (tag && tag.trim() !== "") {
              const pumpId = pumps.idleStatus.ids[index];
              addDetectedTag(tag, `pump-${pumpId}`, "idle");
            }
          });
        }

        // Check filling pumps
        if (
          pumps.fillingStatus &&
          pumps.fillingStatus.tags &&
          pumps.fillingStatus.ids
        ) {
          pumps.fillingStatus.tags.forEach((tag, index) => {
            if (tag && tag.trim() !== "") {
              const pumpId = pumps.fillingStatus.ids[index];
              addDetectedTag(tag, `pump-${pumpId}`, "filling");
            }
          });
        }
      }

      // Check for tags in readers
      if (rawDeviceData.readers) {
        const readers = rawDeviceData.readers;

        // Check online readers
        if (
          readers.onlineStatus &&
          readers.onlineStatus.tags &&
          readers.onlineStatus.ids
        ) {
          readers.onlineStatus.tags.forEach((tag, index) => {
            if (tag && tag.trim() !== "") {
              const readerId = readers.onlineStatus.ids[index];
              addDetectedTag(tag, `reader-${readerId}`, "online");
            }
          });
        }
      }
    }
  }, [formMode, selectedDevice, scanning, rawDeviceData]); //Cursor

  // Helper function to add a detected tag
  const addDetectedTag = (tagId, source, sourceStatus) => {
    //Cursor
    setDetectedTags((prev) => {
      if (!prev.some((t) => t.tagId === tagId)) {
        return [
          ...prev,
          {
            tagId: tagId,
            readerId: source,
            sourceStatus: sourceStatus,
            detectedAt: new Date().toISOString(),
          },
        ];
      }
      return prev;
    });
  };

  // Original monitor effect for deviceReaderStatus (keep this as a backup)
  useEffect(() => {
    if (formMode === "scan" && selectedDevice && scanning) {
      // Reset detected tags when starting to scan
      if (detectedTags.length === 0) {
        setDetectedTags([]);
      }

      // Start monitoring selected device readers for tags
      const monitorInterval = setInterval(() => {
        if (deviceReaderStatus[selectedDevice]) {
          const readers = deviceReaderStatus[selectedDevice];

          // Look for any readers with tags
          Object.values(readers).forEach((reader) => {
            if (reader.status === "online" && reader.tag) {
              // Add to detected tags if not already in the list
              addDetectedTag(reader.tag, reader.id, reader.status);
            }
          });
        }
      }, 1000); // Check every second

      return () => clearInterval(monitorInterval);
    }
  }, [formMode, selectedDevice, scanning, deviceReaderStatus]);

  // Monitor for deviceReaderStatus updates for the selected device
  useEffect(() => {
    if (selectedDevice && deviceReaderStatus[selectedDevice]) {
      // When reader status is received, stop loading indicator
      setIsLoadingReaders(false);
    }
  }, [selectedDevice, deviceReaderStatus]);

  const handleFieldChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });

    // Clear validation error for this field if it exists
    if (validationErrors[fieldName]) {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldName];
      setValidationErrors(newErrors);
    }
  };

  const handleFormModeChange = (e) => {
    setFormMode(e.value);
    if (e.value === "scan") {
      // Reset scanning related state
      setSelectedDevice(null);
      setDetectedTags([]);
    }
  };

  const handleDeviceChange = (e) => {
    const deviceId = e.value;
    setSelectedDevice(deviceId);
    setDetectedTags([]);
    setScanning(false);

    // Request specific device status when selected
    if (deviceId) {
      setIsLoadingReaders(true);
      setDeviceRequestSent((prev) => ({ ...prev, [deviceId]: true }));

      // Request device status to get current reader status
      SignalRService.requestDeviceStatus(deviceId);

      // Set a timeout to ensure UI feedback even if no response
      setTimeout(() => {
        setIsLoadingReaders(false);
      }, 3000);
    }
  };

  const toggleScanning = () => {
    setScanning(!scanning);
  };

  const selectDetectedTag = (tagData) => {
    setFormData((prev) => ({
      ...prev,
      name: tagData.tagId,
    }));

    // Switch back to manual mode to complete the form
    setFormMode("manual");
    setSelectedDevice(null);
    setDetectedTags([]);
    setScanning(false);
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.name) {
      errors.name = "Tag ID is required";
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      notify("Please correct the errors before submitting", "error", 3000);
      return;
    }

    setLoading(true);
    try {
      const actionResult = formData.id
        ? await dispatch(updateTag(formData.id, formData))
        : await dispatch(createTag(formData));

      if (actionResult.success) {
        onSave(true);
      } else {
        notify(actionResult.error || "Failed to save tag", "error", 3000);
      }
    } catch (error) {
      console.error("Error saving tag:", error);
      notify("An unexpected error occurred", "error", 3000);
    } finally {
      setLoading(false);
    }
  };

  // Update the renderTagItem function for better display formatting
  const renderTagItem = (item) => {
    const timestamp = new Date(item.detectedAt).toLocaleTimeString();
    const sourceLabel = item.sourceStatus
      ? `${item.readerId} (${item.sourceStatus})`
      : item.readerId;

    return (
      <div className="detected-tag-item">
        <div className="tw-flex tw-justify-between tw-items-center">
          <span className="tag-id">{item.tagId}</span>
          <span className="time tw-text-xs tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded">
            {timestamp}
          </span>
        </div>
        <div className="reader-info tw-mt-1">Source: {sourceLabel}</div>
      </div>
    );
  };

  // Render the device item with just the ID and status
  const renderDeviceItem = (item) => {
    return (
      <div className="device-item">
        <div className="tw-flex tw-flex-col">
          <span className="device-name">{item.name}</span>
        </div>
        <span
          className={`device-status device-status-${
            item.status === "Connected" ? "online" : "offline"
          }`}
        >
          {item.status}
        </span>
      </div>
    );
  };

  // Create a helper function to get processed reader status
  const getReaderStatus = () => {
    if (!selectedDevice || !rawDeviceData?.readers) {
      return [];
    }

    const readers = [];
    const readersData = rawDeviceData.readers;

    // Process online readers
    if (
      readersData.onlineStatus &&
      readersData.onlineStatus.ids &&
      Array.isArray(readersData.onlineStatus.ids)
    ) {
      const onlineIds = readersData.onlineStatus.ids;
      const onlineTags = readersData.onlineStatus.tags || [];
      const onlineErrors = readersData.onlineStatus.errors || [];

      onlineIds.forEach((id, index) => {
        readers.push({
          id: id,
          status: "online",
          tag: onlineTags[index] || null,
          error: onlineErrors[index] || null,
        });
      });
    }

    // Process offline readers
    if (
      readersData.offlineStatus &&
      readersData.offlineStatus.ids &&
      Array.isArray(readersData.offlineStatus.ids)
    ) {
      const offlineIds = readersData.offlineStatus.ids;

      offlineIds.forEach((id) => {
        readers.push({
          id: id,
          status: "offline",
          tag: null,
          error: null,
        });
      });
    }

    // If no readers found from data structure, but we know the device exists,
    // add a default reader as fallback
    if (readers.length === 0 && selectedDevice) {
      readers.push({
        id: 1,
        status: "unknown",
        tag: null,
        error: "No reader information available",
      });
    }

    return readers;
  };

  // Function to refresh specific device status
  const refreshCurrentDeviceStatus = async () => {
    //Cursor
    if (!selectedDevice) return;

    setIsLoadingReaders(true);
    try {
      await SignalRService.requestDeviceStatus(selectedDevice);
      // Set a timeout to ensure UI feedback
      setTimeout(() => {
        if (!rawDeviceData?.readers) {
          setIsLoadingReaders(false);
        }
      }, 3000);
    } catch (error) {
      console.error("Error refreshing device status:", error);
      setIsLoadingReaders(false);
    }
  };

  // Add function to simulate a tag being detected (for testing)
  const simulateTagDetection = () => {
    //Cursor
    if (selectedDevice && scanning) {
      const mockTagId = `TAG${Math.floor(Math.random() * 10000)
        .toString()
        .padStart(5, "0")}`;
      addDetectedTag(mockTagId, `simulated-reader-1`, "simulation");
    }
  };

  // Update the TagScanForm component's props
  const TagScanForm = memo(
    ({
      devices,
      connectedDevices,
      deviceConnectionStatuses,
      deviceConnectionSummary,
      selectedDevice,
      detectedTags,
      scanning,
      isLoadingDevices,
      isLoadingReaders,
      deviceReaderStatus,
      rawDeviceData,
      getReaderStatus,
      simulateTagDetection,
      onRefreshCurrentDevice,
      onRefreshConnection,
      onDeviceChange,
      onToggleScanning,
      onTagSelect,
      onRefreshDevices,
    }) => {
      return (
        <div style={{ marginTop: 10 }}>
          <div className="scan-section">
            <div className="tw-flex tw-items-center tw-mb-4">
              <h4 className="tw-flex-1 tw-mb-0">Select Device</h4>
              <div className="tw-flex">
                <Button
                  icon="fa-light fa-refresh"
                  hint="Refresh devices"
                  onClick={onRefreshDevices}
                  disabled={isLoadingDevices}
                  className="tw-mr-2"
                />
                <Button
                  icon="fa-light fa-wifi"
                  hint="Refresh SignalR connection"
                  onClick={onRefreshConnection}
                  type="default"
                />
              </div>
            </div>

            {isLoadingDevices ? (
              <div className="tw-py-4 tw-text-center">
                <span>Loading devices...</span>
              </div>
            ) : connectedDevices.length === 0 ? (
              <div className="tw-py-4 tw-text-center tw-bg-gray-100 tw-rounded tw-border tw-border-gray-300">
                <p>No connected devices found</p>
                <div className="tw-flex tw-justify-center tw-mt-2 tw-space-x-2">
                  <Button text="Refresh Devices" onClick={onRefreshDevices} />
                  <Button
                    text="Reconnect SignalR"
                    onClick={onRefreshConnection}
                    type="default"
                  />
                </div>
              </div>
            ) : (
              <SelectBox
                dataSource={connectedDevices} // Simplified - no grouping
                placeholder="Select a device"
                displayExpr="name"
                valueExpr="id"
                value={selectedDevice}
                onValueChanged={onDeviceChange}
                disabled={scanning}
                itemRender={renderDeviceItem}
                searchEnabled={true}
                searchExpr={["name", "id"]}
              />
            )}

            {selectedDevice && (
              <div className="scan-controls tw-mt-5">
                <Button
                  text={scanning ? "Stop Scanning" : "Start Scanning"}
                  type={scanning ? "danger" : "success"}
                  onClick={onToggleScanning}
                  disabled={!selectedDevice}
                  icon={scanning ? "fa-light fa-stop" : "fa-light fa-play"}
                />

                {/* Add simulation button for testing */}
                {scanning && (
                  <Button
                    text="Simulate Tag Scan"
                    type="default"
                    stylingMode="outlined"
                    className="tw-ml-2"
                    onClick={simulateTagDetection}
                    disabled={!scanning}
                  />
                )}
              </div>
            )}
          </div>

          <div className="detected-tags">
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-2">
              <h4 className="tw-mb-0">Detected Tags</h4>
              {detectedTags.length > 0 && (
                <span className="tw-bg-blue-500 tw-text-white tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs">
                  {detectedTags.length}
                </span>
              )}
            </div>

            {detectedTags.length > 0 ? (
              <div className="tw-border tw-border-gray-200 tw-rounded tw-overflow-hidden">
                <List
                  dataSource={detectedTags}
                  itemRender={renderTagItem}
                  height={Math.min(250, detectedTags.length * 75 + 20)} // Increased height for better display
                  focusStateEnabled={false}
                  activeStateEnabled={false}
                  hoverStateEnabled={false}
                />
              </div>
            ) : scanning ? (
              <p className="no-tags tw-text-center tw-py-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded">
                <i className="fa-light fa-search tw-mr-2"></i>
                Scanning for tags... Please present a tag to a reader.
              </p>
            ) : (
              <p className="no-tags tw-text-center tw-py-4 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded">
                <i className="fa-light fa-info-circle tw-mr-2"></i>
                No tags detected. Press "Start Scanning" to begin.
              </p>
            )}
          </div>

          {
            // Reader status display
            selectedDevice && (
              <div className="reader-status tw-mt-4">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <h4 className="tw-mb-0">Reader Status</h4>
                  <Button
                    icon="fa-light fa-refresh"
                    hint="Refresh reader status"
                    onClick={onRefreshCurrentDevice}
                    disabled={isLoadingReaders}
                  />
                </div>

                {isLoadingReaders ? (
                  <div className="tw-text-center tw-py-4">
                    <span>Loading readers...</span>
                  </div>
                ) : getReaderStatus().length > 0 ? (
                  <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-mt-2">
                    {getReaderStatus().map((reader) => (
                      <div
                        key={reader.id}
                        className={`tw-p-2 tw-rounded tw-border ${
                          reader.status === "online"
                            ? "tw-border-green-500 tw-bg-green-50"
                            : reader.status === "offline"
                            ? "tw-border-red-300 tw-bg-red-50"
                            : "tw-border-yellow-300 tw-bg-yellow-50"
                        }`}
                      >
                        <div className="tw-font-medium">Reader {reader.id}</div>
                        <div className="tw-flex tw-justify-between tw-items-center">
                          <span
                            className={`tw-text-sm ${
                              reader.status === "online"
                                ? "tw-text-green-600"
                                : reader.status === "offline"
                                ? "tw-text-red-600"
                                : "tw-text-yellow-600"
                            }`}
                          >
                            {reader.status === "online"
                              ? "Online"
                              : reader.status === "offline"
                              ? "Offline"
                              : "Unknown"}
                          </span>
                          {reader.tag && (
                            <span className="tw-text-sm tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded">
                              Tag: {reader.tag}
                            </span>
                          )}
                          {reader.error && (
                            <span className="tw-text-sm tw-text-red-500">
                              {reader.error}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="tw-py-4 tw-text-center tw-bg-gray-100 tw-rounded tw-border tw-border-gray-300">
                    <p>No readers found for this device</p>
                    <Button
                      text="Refresh Device Status"
                      onClick={onRefreshCurrentDevice}
                      className="tw-mt-2"
                    />
                  </div>
                )}
              </div>
            )
          }
        </div>
      );
    }
  );

  const renderTagScanForm = () => {
    return (
      <TagScanForm
        devices={devices}
        connectedDevices={connectedDevices}
        deviceConnectionStatuses={deviceConnectionStatuses}
        deviceConnectionSummary={deviceConnectionSummary}
        selectedDevice={selectedDevice}
        detectedTags={detectedTags}
        scanning={scanning}
        isLoadingDevices={isLoadingDevices}
        isLoadingReaders={isLoadingReaders}
        deviceReaderStatus={deviceReaderStatus}
        rawDeviceData={rawDeviceData}
        getReaderStatus={getReaderStatus}
        simulateTagDetection={simulateTagDetection}
        onRefreshCurrentDevice={refreshCurrentDeviceStatus}
        onRefreshConnection={refreshSignalRConnection}
        onDeviceChange={handleDeviceChange}
        onToggleScanning={toggleScanning}
        onTagSelect={selectDetectedTag}
        onRefreshDevices={refreshDeviceStatus}
      />
    );
  };

  // Use React.memo to prevent unnecessary re-renders
  const ManualTagForm = memo(
    ({ formData, validationErrors, ruleSets, vehicles, handleFieldChange }) => {
      return (
        <div style={{ marginTop: 10 }}>
          <Form
            formData={formData}
            labelLocation="top"
            showColonAfterLabel={true}
            validationGroup="tagForm"
          >
            <SimpleItem
              dataField="name"
              label={{ text: "Tag ID" }}
              editorOptions={{
                placeholder: "Enter tag ID (e.g. 123457890123)",
                onValueChanged: (e) => handleFieldChange("name", e.value),
              }}
              isRequired={true}
              validationError={validationErrors.name}
            />

            <SimpleItem
              dataField="isEnabled"
              label={{ text: "Enabled" }}
              editorType="dxSwitch"
              editorOptions={{
                switchedOnText: "Yes",
                switchedOffText: "No",
                onValueChanged: (e) => handleFieldChange("isEnabled", e.value),
              }}
            />

            <SimpleItem
              dataField="vehicleId"
              label={{ text: "Vehicle" }}
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: vehicles,
                displayExpr: (item) =>
                  item
                    ? `${item.numberPlate || ""} (${item.hyoungNo || ""})`
                    : "",
                valueExpr: "vehicleId",
                searchEnabled: true,
                showClearButton: true,
                onValueChanged: (e) => handleFieldChange("vehicleId", e.value),
              }}
            />

            <SimpleItem
              dataField="isMaster"
              label={{ text: "Master Tag" }}
              editorType="dxSwitch"
              editorOptions={{
                switchedOnText: "Yes",
                switchedOffText: "No",
                onValueChanged: (e) => handleFieldChange("isMaster", e.value),
              }}
            />

            <SimpleItem
              dataField="fuelRuleSetId"
              label={{ text: "Fueling Rule Set" }}
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: ruleSets,
                displayExpr: "name",
                valueExpr: "id",
                searchEnabled: true,
                showClearButton: true,
                onValueChanged: (e) =>
                  handleFieldChange("fuelRuleSetId", e.value),
              }}
            />

            {formData.fuelRuleSetId && (
              <div className="rule-set-info">
                <h4>Rule Set Details</h4>
                {ruleSets.find((r) => r.id === formData.fuelRuleSetId)
                  ?.description && (
                  <p className="rule-description">
                    {
                      ruleSets.find((r) => r.id === formData.fuelRuleSetId)
                        ?.description
                    }
                  </p>
                )}
                {ruleSets.find((r) => r.id === formData.fuelRuleSetId)
                  ?.dailyMonthlyLimitRule && (
                  <div className="rule-limits">
                    <div className="limit-item">
                      <span className="limit-label">Daily Limit:</span>
                      <span className="limit-value">
                        {ruleSets.find((r) => r.id === formData.fuelRuleSetId)
                          ?.dailyMonthlyLimitRule?.dailyLimit || "N/A"}{" "}
                        L
                      </span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-label">Monthly Limit:</span>
                      <span className="limit-value">
                        {ruleSets.find((r) => r.id === formData.fuelRuleSetId)
                          ?.dailyMonthlyLimitRule?.monthlyLimit || "N/A"}{" "}
                        L
                      </span>
                    </div>
                    <div className="limit-item">
                      <span className="limit-label">Per Transaction:</span>
                      <span className="limit-value">
                        {ruleSets.find((r) => r.id === formData.fuelRuleSetId)
                          ?.dailyMonthlyLimitRule?.fuelingLimit ||
                          "No limit"}{" "}
                        L
                      </span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </Form>
        </div>
      );
    }
  );

  const renderManualTagForm = () => {
    return (
      <ManualTagForm
        formData={formData}
        validationErrors={validationErrors}
        ruleSets={ruleSets}
        vehicles={vehicles}
        handleFieldChange={handleFieldChange}
      />
    );
  };

  return (
    <Popup
      visible={isVisible}
      onHiding={onClose}
      title={tag ? "Edit Tag" : "Add New Tag"}
      showCloseButton={true}
      width={600}
      height={formMode === "scan" ? "auto" : 550}
      className="tag-form-popup"
    >
      <div className="tag-form-container">
        {!tag && ( // Only show mode selection for new tags
          <div className="form-mode-selector">
            <Tabs
              items={[
                {
                  id: "manual",
                  text: "Enter Tag Manually",
                  icon: "fa-light fa-keyboard",
                },
                {
                  id: "scan",
                  text: "Scan Tag from Reader",
                  icon: "fa-light fa-qrcode",
                },
              ]}
              selectedIndex={formMode === "manual" ? 0 : 1}
              onItemClick={(e) => {
                console.log("Tab clicked:", e.itemData.id);
                // Defer the state update to avoid React reconciliation issues
                setTimeout(() => {
                  setFormMode(e.itemData.id);
                  if (e.itemData.id === "scan") {
                    setSelectedDevice(null);
                    setDetectedTags([]);
                  }
                }, 0);
              }}
              itemRender={(item) => (
                <span>
                  <i className={item.icon} style={{ marginRight: 8 }} />
                  {item.text}
                </span>
              )}
            />
          </div>
        )}

        <div className="form-content">
          <div key={`form-mode-${formMode}`}>
            {formMode === "manual"
              ? renderManualTagForm()
              : renderTagScanForm()}
          </div>
        </div>

        <div className="form-bottom">
          <div className="form-actions tw-flex tw-justify-end tw-mt-10">
            <Button
              text="Cancel"
              stylingMode="outlined"
              type="normal"
              onClick={onClose}
              className="tw-mr-3"
            />
            <Button
              text="Save"
              type="default"
              stylingMode="contained"
              onClick={handleSubmit}
              disabled={loading || (formMode === "scan" && !formData.name)}
            />
          </div>
        </div>
      </div>

      <LoadPanel
        visible={loading}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0, 0, 0, 0.4)"
        showPane={true}
        message="Saving..."
      />
    </Popup>
  );
};

export default TagForm;
