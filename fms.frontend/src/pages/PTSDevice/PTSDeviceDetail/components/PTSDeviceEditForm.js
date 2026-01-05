import React from "react";
import { Form, SimpleItem, GroupItem, Label } from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { useDispatch, useSelector } from "react-redux";
import notify from "devextreme/ui/notify";
import { updatePTSDevice } from "../../../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../../../redux/actions/siteActions";
import "./PTSDeviceEditForm.scss";

/**
 * PTSDeviceEditForm - Edit device settings
 * Similar to PTSDeviceForm but embedded in detail page
 */
const PTSDeviceEditForm = ({ device, onSave }) => {
  const dispatch = useDispatch();
  const { sites } = useSelector((state) => state.site);

  // Ensure sites array is available for the SelectBox
  const sitesDataSource = Array.isArray(sites) ? sites : [];

  // Deep clone the device to avoid mutating Redux state
  const [formData, setFormData] = React.useState(() =>
    device ? JSON.parse(JSON.stringify(device)) : {}
  );
  const [saving, setSaving] = React.useState(false);

  // Fetch sites on mount
  React.useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  React.useEffect(() => {
    // Deep clone when device prop changes to avoid Redux state mutation
    if (device) {
      setFormData(JSON.parse(JSON.stringify(device)));
    }
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
      dataField === "autoAssignUserMasterTag" ||
      dataField === "enableLocationValidation" ||
      dataField === "requireVehicleProximity" ||
      dataField === "requireMobileAppProximity" ||
      dataField === "bypassOnGPSFailure"
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
      // Convert boolean fields to sbyte (0 or 1) before sending to API
      const booleanFields = [
        "isActive",
        "isAuthenticated",
        "webSocketCapable",
        "allowedForDirectCommands",
        "autoAssignUserMasterTag",
        "enableLocationValidation",
        "requireVehicleProximity",
        "requireMobileAppProximity",
        "bypassOnGPSFailure",
      ];

      const dataToSend = { ...formData };
      booleanFields.forEach((field) => {
        if (dataToSend[field] === true) {
          dataToSend[field] = 1;
        } else if (dataToSend[field] === false) {
          dataToSend[field] = 0;
        }
      });

      // Remove navigation properties that shouldn't be sent
      delete dataToSend.configuration;
      delete dataToSend.intankdeliveries;
      delete dataToSend.ptsDevicePendingCommands;
      delete dataToSend.pumptransactions;
      delete dataToSend.tanks;
      delete dataToSend.deviceConnections;
      delete dataToSend.siteNavigation;
      delete dataToSend.notifications;
      delete dataToSend.notificationPolicies;

      await dispatch(updatePTSDevice(device.ptsid, dataToSend));
      notify("Device settings updated successfully", "success", 3000);
      if (onSave) onSave();
    } catch (error) {
      notify(`Error updating device: ${error.message}`, "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    // Deep clone to avoid Redux state mutation
    if (device) {
      setFormData(JSON.parse(JSON.stringify(device)));
    }
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

        <SimpleItem dataField="ptsName" editorType="dxTextBox">
          <Label text="PTS Name" />
        </SimpleItem>

        <SimpleItem dataField="ipaddress" editorType="dxTextBox">
          <Label text="IP Address" />
        </SimpleItem>

        <SimpleItem dataField="portNumber" editorType="dxNumberBox">
          <Label text="Port Number" />
        </SimpleItem>

        <SimpleItem
          dataField="site"
          editorType="dxSelectBox"
          editorOptions={{
            dataSource: sitesDataSource,
            displayExpr: "name",
            valueExpr: "id",
            placeholder: "Select Site",
            searchEnabled: true,
            showClearButton: true,
          }}
        >
          <Label text="Site" />
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

        {/* Location Validation Settings */}
        <GroupItem colSpan={2} caption="Location Validation Settings">
          <GroupItem colCount={2}>
            <SimpleItem
              dataField="enableLocationValidation"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Enable Location Validation",
                value: formData.enableLocationValidation === 1,
              }}
            />

            <SimpleItem
              dataField="bypassOnGPSFailure"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Bypass on GPS Failure",
                value: formData.bypassOnGPSFailure === 1,
              }}
            />
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="requireVehicleProximity"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Require Vehicle Proximity",
                value: formData.requireVehicleProximity === 1,
              }}
            />

            <SimpleItem
              dataField="vehicleProximityRadius"
              editorType="dxNumberBox"
              editorOptions={{
                min: 10,
                max: 1000,
                showSpinButtons: true,
                format: "#0 meters",
              }}
            >
              <Label text="Vehicle Proximity Radius (m)" />
            </SimpleItem>
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="requireMobileAppProximity"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Require Mobile App Proximity",
                value: formData.requireMobileAppProximity === 1,
              }}
            />

            <SimpleItem
              dataField="mobileAppProximityRadius"
              editorType="dxNumberBox"
              editorOptions={{
                min: 5,
                max: 500,
                showSpinButtons: true,
                format: "#0 meters",
              }}
            >
              <Label text="Mobile App Proximity Radius (m)" />
            </SimpleItem>
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="minimumGPSAccuracy"
              editorType="dxNumberBox"
              editorOptions={{
                min: 1,
                max: 100,
                showSpinButtons: true,
                format: "#0 meters",
                placeholder: "Default: 20m",
              }}
            >
              <Label text="Minimum GPS Accuracy (m)" />
            </SimpleItem>

            <SimpleItem
              dataField="proximityGracePeriodMeters"
              editorType="dxNumberBox"
              editorOptions={{
                min: 0,
                max: 50,
                showSpinButtons: true,
                format: "#0 meters",
                placeholder: "Default: 10m",
              }}
            >
              <Label text="Grace Period Tolerance (m)" />
            </SimpleItem>
          </GroupItem>
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
