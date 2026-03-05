import React, { useState, useEffect, memo } from "react";
import { Button } from "devextreme-react/button";
import { ScrollView } from "devextreme-react/scroll-view";
import { useDispatch, useSelector } from "react-redux";
import { createTag, updateTag } from "../../../redux/actions/tagActions";
import { LoadPanel } from "devextreme-react/load-panel";
import { List } from "devextreme-react/list";
import notify from "devextreme/ui/notify";
import "./TagForm.scss";
import { fetchPTSDeviceList } from "../../../redux/actions/ptsActions/ptsDeviceActions";
import VehicleSearchableSelector from "../../selectors/VehicleSearchableSelector";
import SlidePanel from "../../ui/SlidePanel";

const TagForm = ({ isVisible, onClose, onSave, tag }) => {
  const dispatch = useDispatch();

  // Get PTS devices from redux store - uses ptsDeviceList from reducer
  const ptsDevices = useSelector((state) => state.ptsDevice?.ptsDeviceList || []);
  const ptsDevicesLoading = useSelector((state) => state.ptsDevice?.loading || false);

  const [showScanSection, setShowScanSection] = useState(false); // Show/hide scan section
  const [selectedDevice, setSelectedDevice] = useState(null);
  const [detectedTags, setDetectedTags] = useState([]);
  const [scanning, setScanning] = useState(false);

  const [formData, setFormData] = useState({
    id: null,
    name: "",
    isEnabled: true,
    vehicleId: null,
    isMaster: false,
  });

  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

  // Fetch PTS devices when scan section is shown
  useEffect(() => {
    if (showScanSection) {
      dispatch(fetchPTSDeviceList());
    }
  }, [showScanSection, dispatch]);

  // Handle refresh devices
  const handleRefreshDevices = () => {
    dispatch(fetchPTSDeviceList());
  };

  // Handle opening scan section
  const handleOpenScanSection = () => {
    setShowScanSection(true);
    setSelectedDevice(null);
    setDetectedTags([]);
    setScanning(false);
  };

  // Handle closing scan section
  const handleCloseScanSection = () => {
    setShowScanSection(false);
    setSelectedDevice(null);
    setDetectedTags([]);
    setScanning(false);
  };

  useEffect(() => {
    if (tag) {
      setFormData({
        id: tag.id,
        name: tag.name || "",
        isEnabled: tag.isEnabled !== false, // default to true if undefined
        vehicleId: tag.vehicleId || null,
        isMaster: tag.isMaster || false,
      });
    } else {
      // Reset form for new tag
      setFormData({
        name: "",
        isEnabled: true,
        vehicleId: null,
        isMaster: false,
      });
    }
  }, [tag]);

  // Helper function to add a detected tag
  const addDetectedTag = (tagId, source, sourceStatus) => {
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

  const handleFieldChange = (fieldName, value) => {
    setFormData({ ...formData, [fieldName]: value });

    // Clear validation error for this field if it exists
    if (validationErrors[fieldName]) {
      const newErrors = { ...validationErrors };
      delete newErrors[fieldName];
      setValidationErrors(newErrors);
    }
  };

  const handleDeviceChange = (e) => {
    const deviceId = e.target.value;
    setSelectedDevice(deviceId);
    setDetectedTags([]);
    setScanning(false);
  };

  const toggleScanning = () => {
    setScanning(!scanning);
  };

  const selectDetectedTag = (tagData) => {
    setFormData((prev) => ({
      ...prev,
      name: tagData.tagId,
    }));

    // Close scan section after selecting a tag
    handleCloseScanSection();
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

  // Render the tag item
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

  // Simplified TagScanForm component
  const TagScanForm = memo(
    ({
      ptsDevices,
      ptsDevicesLoading,
      selectedDevice,
      detectedTags,
      scanning,
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
              <Button
                icon="fa-light fa-refresh"
                hint="Refresh devices"
                stylingMode="text"
                onClick={onRefreshDevices}
                disabled={ptsDevicesLoading}
              />
            </div>

            {ptsDevicesLoading ? (
              <div className="tw-py-4 tw-text-center">
                <span>Loading devices...</span>
              </div>
            ) : ptsDevices.length === 0 ? (
              <div className="tw-py-4 tw-text-center tw-bg-gray-100 tw-rounded">
                <p className="tw-text-gray-600">No devices found</p>
                <Button
                  text="Refresh Devices"
                  icon="fa-light fa-refresh"
                  stylingMode="text"
                  onClick={onRefreshDevices}
                />
              </div>
            ) : (
              <select
                className="tw-w-full tw-p-2 tw-border tw-border-gray-300 tw-rounded tw-bg-white"
                value={selectedDevice || ""}
                onChange={onDeviceChange}
                disabled={scanning}
              >
                <option value="">-- Select a device --</option>
                {ptsDevices.map((device) => (
                  <option key={device.deviceId} value={device.deviceId}>
                    {device.ptsName || device.deviceId}
                  </option>
                ))}
              </select>
            )}

            {selectedDevice && (
              <div className="scan-controls tw-mt-5">
                <Button
                  text={scanning ? "Stop Scanning" : "Start Scanning"}
                  stylingMode="text"
                  onClick={onToggleScanning}
                  disabled={!selectedDevice}
                  icon={scanning ? "fa-light fa-stop" : "fa-light fa-play"}
                  className={scanning ? "tw-text-red-500" : "tw-text-green-500"}
                />
              </div>
            )}
          </div>

          <div className="detected-tags tw-mt-4">
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
                  height={Math.min(250, detectedTags.length * 75 + 20)}
                  focusStateEnabled={false}
                  activeStateEnabled={false}
                  hoverStateEnabled={false}
                  onItemClick={(e) => onTagSelect(e.itemData)}
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
        </div>
      );
    }
  );

  const renderTagScanForm = () => {
    return (
      <TagScanForm
        ptsDevices={ptsDevices}
        ptsDevicesLoading={ptsDevicesLoading}
        selectedDevice={selectedDevice}
        detectedTags={detectedTags}
        scanning={scanning}
        onDeviceChange={handleDeviceChange}
        onToggleScanning={toggleScanning}
        onTagSelect={selectDetectedTag}
        onRefreshDevices={handleRefreshDevices}
      />
    );
  };

  // Use React.memo to prevent unnecessary re-renders
  const ManualTagForm = memo(
    ({ formData, validationErrors, handleFieldChange, onOpenScan, isNewTag }) => {
      return (
        <div style={{ marginTop: 10 }}>
          {/* Tag ID with Scan Button */}
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Tag ID <span className="tw-text-red-500">*</span>
            </label>
            <div className="tw-flex tw-gap-2 tw-items-center">
              <input
                type="text"
                className="tw-flex-1 tw-p-2 tw-border tw-border-gray-300 tw-rounded tw-bg-white"
                placeholder="Enter tag ID (e.g. 123457890123)"
                value={formData.name || ""}
                onChange={(e) => handleFieldChange("name", e.target.value)}
              />
              {isNewTag && (
                <Button
                  icon="fa-light fa-qrcode"
                  hint="Scan from Reader"
                  stylingMode="text"
                  onClick={onOpenScan}
                  className="scan-button-round"
                />
              )}
            </div>
            {validationErrors.name && (
              <span className="tw-text-red-500 tw-text-sm">{validationErrors.name}</span>
            )}
          </div>

          {/* Enabled Checkbox */}
          <div className="tw-mb-4">
            <label className="tw-flex tw-items-center tw-cursor-pointer">
              <input
                type="checkbox"
                className="tw-w-4 tw-h-4 tw-mr-2 tw-accent-blue-500"
                checked={formData.isEnabled}
                onChange={(e) => handleFieldChange("isEnabled", e.target.checked)}
              />
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">Enabled</span>
            </label>
          </div>

          {/* Vehicle Select */}
          <div className="tw-mb-4">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Vehicle
            </label>
            <VehicleSearchableSelector
              value={formData.vehicleId}
              onValueChanged={(e) => handleFieldChange("vehicleId", e.value)}
              placeholder="Search vehicle by plate or Hyoung No..."
            />
          </div>

          {/* Master Tag Checkbox */}
          <div className="tw-mb-4">
            <label className="tw-flex tw-items-center tw-cursor-pointer">
              <input
                type="checkbox"
                className="tw-w-4 tw-h-4 tw-mr-2 tw-accent-blue-500"
                checked={formData.isMaster}
                onChange={(e) => handleFieldChange("isMaster", e.target.checked)}
              />
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">Master Tag</span>
            </label>
          </div>
        </div>
      );
    }
  );

  const renderManualTagForm = () => {
    return (
      <ManualTagForm
        formData={formData}
        validationErrors={validationErrors}
        handleFieldChange={handleFieldChange}
        onOpenScan={handleOpenScanSection}
        isNewTag={!tag}
      />
    );
  };

  return (
    <SlidePanel
      open={isVisible}
      onClose={onClose}
      title={tag ? "Edit Tag" : "Add New Tag"}
      width={tag ? 760 : 980}
    >
      <div className="tag-form-panel">
        <ScrollView height="100%" showScrollbar="onScroll">
          <div className="tag-form-container">
            <div className="form-content">
              {renderManualTagForm()}
            </div>

            {showScanSection && (
              <div className="scan-section-container tw-mt-4 tw-p-4 tw-border tw-border-blue-300 tw-rounded tw-bg-blue-50">
                <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
                  <h4 className="tw-text-lg tw-font-semibold tw-text-blue-800 tw-mb-0">
                    <i className="fa-light fa-qrcode tw-mr-2"></i>
                    Scan Tag from Reader
                  </h4>
                  <Button
                    icon="fa-light fa-times"
                    hint="Close"
                    stylingMode="text"
                    onClick={handleCloseScanSection}
                  />
                </div>
                {renderTagScanForm()}
              </div>
            )}

            <div className="form-bottom">
              <div className="form-actions tw-flex tw-justify-end tw-mt-6">
                <Button
                  text="Cancel"
                  stylingMode="text"
                  onClick={onClose}
                  className="tw-mr-3"
                />
                <Button
                  text="Save"
                  type="default"
                  stylingMode="text"
                  onClick={handleSubmit}
                  disabled={loading}
                />
              </div>
            </div>
          </div>
        </ScrollView>

        <LoadPanel
          visible={loading}
          showIndicator={true}
          shading={true}
          shadingColor="rgba(0, 0, 0, 0.4)"
          showPane={true}
          message="Saving..."
        />
      </div>
    </SlidePanel>
  );
};

export default TagForm;
