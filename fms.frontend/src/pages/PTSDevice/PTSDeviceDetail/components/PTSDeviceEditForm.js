import React from "react";
import { Form, SimpleItem, GroupItem, Label } from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { useDispatch } from "react-redux";
import notify from "devextreme/ui/notify";
import { updatePTSDevice } from "../../../../redux/actions/ptsActions/ptsDeviceActions";
import "./PTSDeviceEditForm.scss";

/**
 * PTSDeviceEditForm - Edit device settings
 * Similar to PTSDeviceForm but embedded in detail page
 */
const PTSDeviceEditForm = ({ device, onSave }) => {
  const dispatch = useDispatch();
  const [formData, setFormData] = React.useState(device);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    setFormData(device);
  }, [device]);

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

  const handleSave = async () => {
    setSaving(true);
    try {
      await dispatch(updatePTSDevice(device.ptsid, formData));
      notify("Device settings updated successfully", "success", 3000);
      if (onSave) onSave();
    } catch (error) {
      notify(`Error updating device: ${error.message}`, "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    setFormData(device);
    notify("Changes reset", "info", 2000);
  };

  return (
    <div className="pts-device-edit-form">
      <div className="form-header">
        <h3 className="tw-text-lg tw-font-semibold">Device Settings</h3>
        <p className="tw-text-sm tw-text-gray-600">
          Update device configuration and connection settings
        </p>
      </div>

      <Form
        formData={formData}
        onFieldDataChanged={handleFieldChange}
        labelMode="floating"
        colCount={2}
      >
        <SimpleItem dataField="ptsid" editorOptions={{ readOnly: true }}>
          <Label text="PTS ID" />
        </SimpleItem>

        <SimpleItem dataField="ipaddress" editorType="dxTextBox">
          <Label text="IP Address" />
        </SimpleItem>

        <SimpleItem dataField="portNumber" editorType="dxNumberBox">
          <Label text="Port Number" />
        </SimpleItem>

        <SimpleItem dataField="site" editorType="dxNumberBox">
          <Label text="Site ID" />
        </SimpleItem>

        <SimpleItem dataField="login" editorType="dxTextBox">
          <Label text="Login" />
        </SimpleItem>

        <SimpleItem
          dataField="password"
          editorType="dxTextBox"
          editorOptions={{ mode: "password" }}
        >
          <Label text="Password" />
        </SimpleItem>

        <SimpleItem
          dataField="protocolSecurityType"
          editorType="dxSelectBox"
          editorOptions={{
            items: ["None", "SSL", "TLS"],
          }}
        >
          <Label text="Protocol Security" />
        </SimpleItem>

        <SimpleItem
          dataField="authenticationType"
          editorType="dxSelectBox"
          editorOptions={{
            items: ["Basic", "Digest", "NTLM", "Kerberos"],
          }}
        >
          <Label text="Authentication Type" />
        </SimpleItem>

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
              text: "Auto-assign User Master Tag",
              value: formData.autoAssignUserMasterTag === 1,
            }}
          />
        </GroupItem>

        <GroupItem colSpan={2}>
          <div className="form-actions">
            <Button
              text="Reset"
              type="normal"
              onClick={handleReset}
              disabled={saving}
            />
            <Button
              text="Save Changes"
              type="success"
              onClick={handleSave}
              disabled={saving}
              icon={saving ? "refresh" : "save"}
            />
          </div>
        </GroupItem>
      </Form>
    </div>
  );
};

export default PTSDeviceEditForm;
