import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Popup } from "devextreme-react/popup";
import {
  Form,
  SimpleItem,
  GroupItem,
  Label,
  RequiredRule,
  PatternRule,
  RangeRule,
} from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import {
  createPTSDevice,
  updatePTSDevice,
  getPTSDeviceById,
} from "../../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import "./PTSDeviceForm.scss";

/**
 * PTSDeviceForm - Popup form component for creating/editing PTS devices
 * Based on Ptsdevice.cs entity structure
 *
 * @param {boolean} visible - Controls popup visibility
 * @param {function} onClose - Callback when popup closes
 * @param {string|null} deviceId - Device ID for editing (null for creating new)
 * @param {function} onSave - Callback after successful save
 */
const PTSDeviceForm = ({ visible, onClose, deviceId = null, onSave }) => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const isEditMode = deviceId !== null && deviceId !== "new";

  // Get sites for dropdown
  const sites = useSelector((state) => state.site?.siteList || []);
  const currentDevice = useSelector((state) => state.ptsDevice?.currentDevice);

  // Initialize form data based on Ptsdevice.cs entity
  const [formData, setFormData] = useState({
    ptsid: "",
    ipaddress: "",
    portNumber: 80,
    login: "",
    password: "", // nosecret - Form field initialization, not actual password
    protocolSecurityType: "None",
    authenticationType: "Basic",
    site: null,
    isActive: 1,
    isAuthenticated: 0,
    webSocketCapable: 0,
    allowedForDirectCommands: 0,
    autoAssignUserMasterTag: 0,
  });

  // Load sites on mount
  useEffect(() => {
    if (visible) {
      dispatch(fetchSiteList());
    }
  }, [dispatch, visible]);

  // Load device data if editing
  useEffect(() => {
    if (visible && isEditMode) {
      setLoading(true);
      dispatch(getPTSDeviceById(deviceId))
        .then(() => setLoading(false))
        .catch(() => {
          setLoading(false);
          notify("Failed to load device data", "error", 3000);
        });
    }
  }, [dispatch, deviceId, isEditMode, visible]);

  // Populate form when device data is loaded
  useEffect(() => {
    if (currentDevice && isEditMode && visible) {
      setFormData({
        ptsid: currentDevice.ptsid || "",
        ipaddress: currentDevice.ipaddress || "",
        portNumber: currentDevice.portNumber || 80,
        login: currentDevice.login || "",
        password: currentDevice.password || "", // nosecret - Loading existing device credential
        protocolSecurityType: currentDevice.protocolSecurityType || "None",
        authenticationType: currentDevice.authenticationType || "Basic",
        site: currentDevice.site || null,
        isActive: currentDevice.isActive ?? 1,
        isAuthenticated: currentDevice.isAuthenticated ?? 0,
        webSocketCapable: currentDevice.webSocketCapable ?? 0,
        allowedForDirectCommands: currentDevice.allowedForDirectCommands ?? 0,
        autoAssignUserMasterTag: currentDevice.autoAssignUserMasterTag ?? 0,
      });
    }
  }, [currentDevice, isEditMode, visible]);

  // Reset form when popup closes
  useEffect(() => {
    if (!visible) {
      setFormData({
        ptsid: "",
        ipaddress: "",
        portNumber: 80,
        login: "",
        password: "", // nosecret - Form reset, empty value
        protocolSecurityType: "None",
        authenticationType: "Basic",
        site: null,
        isActive: 1,
        isAuthenticated: 0,
        webSocketCapable: 0,
        allowedForDirectCommands: 0,
        autoAssignUserMasterTag: 0,
      });
    }
  }, [visible]);

  const handleFieldChange = (e) => {
    const dataField = e.dataField;
    let value = e.value;

    // Convert boolean checkboxes to sbyte (0 or 1)
    if (
      dataField === "isActive" ||
      dataField === "isAuthenticated" ||
      dataField === "webSocketCapable" ||
      dataField === "allowedForDirectCommands" ||
      dataField === "autoAssignUserMasterTag"
    ) {
      value = value ? 1 : 0;
    }

    setFormData((prev) => ({
      ...prev,
      [dataField]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      if (isEditMode) {
        await dispatch(updatePTSDevice(deviceId, formData));
        notify("PTS Device updated successfully", "success", 3000);
      } else {
        await dispatch(createPTSDevice(formData));
        notify("PTS Device created successfully", "success", 3000);
      }

      if (onSave) {
        onSave();
      }

      onClose();
    } catch (error) {
      notify(
        `Error ${isEditMode ? "updating" : "creating"} device: ${error.message}`,
        "error",
        3000
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  // Prepare site data for dropdown
  const siteDataSource = sites.map((site) => ({
    id: site.id,
    name: site.name,
  }));

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      dragEnabled={false}
      closeOnOutsideClick={false}
      showTitle={true}
      title={isEditMode ? "Edit PTS Device" : "Create New PTS Device"}
      width={700}
      height="auto"
      className="pts-device-form-popup"
    >
      <div className="tw-p-4">
        {loading ? (
          <LoadPanel visible={true} />
        ) : (
          <Form
            formData={formData}
            onFieldDataChanged={handleFieldChange}
            labelMode="floating"
            colCount={2}
          >
            {/* PTS ID & IP Address */}
            <SimpleItem
              dataField="ptsid"
              editorType="dxTextBox"
              editorOptions={{
                readOnly: isEditMode,
                stylingMode: "filled",
                placeholder: "Enter PTS ID",
              }}
            >
              <Label text="PTS ID" />
              <RequiredRule message="PTS ID is required" />
            </SimpleItem>

            <SimpleItem
              dataField="ipaddress"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
                placeholder: "Enter IP Address",
              }}
            >
              <Label text="IP Address" />
              <PatternRule
                pattern={
                  /^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
                }
                message="Invalid IP address format"
              />
            </SimpleItem>

            {/* Port Number & Site */}
            <SimpleItem
              dataField="portNumber"
              editorType="dxNumberBox"
              editorOptions={{
                stylingMode: "filled",
                min: 1,
                max: 65535,
                placeholder: "Enter Port Number",
              }}
            >
              <Label text="Port Number" />
              <RequiredRule message="Port number is required" />
              <RangeRule min={1} max={65535} message="Port must be between 1 and 65535" />
            </SimpleItem>

            <SimpleItem
              dataField="site"
              editorType="dxSelectBox"
              editorOptions={{
                stylingMode: "filled",
                dataSource: siteDataSource,
                displayExpr: "name",
                valueExpr: "id",
                placeholder: "Select Site",
                searchEnabled: true,
              }}
            >
              <Label text="Site" />
            </SimpleItem>

            {/* Login & Password */}
            <SimpleItem
              dataField="login"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
                placeholder: "Enter Login",
              }}
            >
              <Label text="Login" />
            </SimpleItem>

            <SimpleItem
              dataField="password"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
                mode: "password",
                placeholder: "Enter Password",
              }}
            >
              <Label text="Password" />
            </SimpleItem>

            {/* Protocol Security Type & Authentication Type */}
            <SimpleItem
              dataField="protocolSecurityType"
              editorType="dxSelectBox"
              editorOptions={{
                stylingMode: "filled",
                items: ["None", "SSL", "TLS"],
                placeholder: "Select Security Type",
              }}
            >
              <Label text="Protocol Security Type" />
            </SimpleItem>

            <SimpleItem
              dataField="authenticationType"
              editorType="dxSelectBox"
              editorOptions={{
                stylingMode: "filled",
                items: ["Basic", "Digest", "NTLM", "Kerberos"],
                placeholder: "Select Authentication",
              }}
            >
              <Label text="Authentication Type" />
            </SimpleItem>

            {/* Boolean Flags - Full Width */}
            <GroupItem colSpan={2}>
              <GroupItem colCount={4}>
                <SimpleItem
                  dataField="isActive"
                  editorType="dxCheckBox"
                  editorOptions={{
                    text: "Is Active",
                    value: formData.isActive === 1,
                  }}
                />

                <SimpleItem
                  dataField="isAuthenticated"
                  editorType="dxCheckBox"
                  editorOptions={{
                    text: "Is Authenticated",
                    value: formData.isAuthenticated === 1,
                  }}
                />

                <SimpleItem
                  dataField="webSocketCapable"
                  editorType="dxCheckBox"
                  editorOptions={{
                    text: "WebSocket Capable",
                    value: formData.webSocketCapable === 1,
                  }}
                />

                <SimpleItem
                  dataField="allowedForDirectCommands"
                  editorType="dxCheckBox"
                  editorOptions={{
                    text: "Direct Commands",
                    value: formData.allowedForDirectCommands === 1,
                  }}
                />
              </GroupItem>

              <SimpleItem
                dataField="autoAssignUserMasterTag"
                editorType="dxCheckBox"
                editorOptions={{
                  text: "Auto-assign User Master Tag (when only vehicle provided)",
                  value: formData.autoAssignUserMasterTag === 1,
                }}
              />
            </GroupItem>

            {/* Form Buttons */}
            <GroupItem colSpan={2}>
              <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
                <Button
                  text="Cancel"
                  type="normal"
                  onClick={handleCancel}
                  disabled={saving}
                />
                <Button
                  text={isEditMode ? "Update" : "Create"}
                  type="success"
                  onClick={handleSubmit}
                  disabled={saving}
                  icon={saving ? "refresh" : undefined}
                />
              </div>
            </GroupItem>
          </Form>
        )}
        <LoadPanel visible={saving} message="Saving..." />
      </div>
    </Popup>
  );
};

export default PTSDeviceForm;
