/**
 * File: PTSDeviceEditForm.js
 * Purpose: Embedded PTS device settings form with stable edit/read transitions.
 * Dependencies: devextreme-react/form, devextreme-react/button, ptsDeviceActions, siteActions.
 * Last Modified: 2026-03-23
 *
 * Key Functions:
 * - buildFormData(): Normalizes API device flags into checkbox-friendly booleans.
 * - buildSavePayload(): Converts form booleans back into API payload values.
 */
import React from "react";
import { Form, SimpleItem, GroupItem, Label } from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { useDispatch, useSelector } from "react-redux";
import notify from "devextreme/ui/notify";
import { updatePTSDevice } from "../../../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../../../redux/actions/siteActions";
import "./PTSDeviceEditForm.scss";

const BOOLEAN_FIELDS = [
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

const RELATION_FIELDS = [
  "configuration",
  "intankdeliveries",
  "ptsDevicePendingCommands",
  "pumptransactions",
  "tanks",
  "deviceConnections",
  "siteNavigation",
  "notifications",
  "notificationPolicies",
];

const cloneValue = (value) => JSON.parse(JSON.stringify(value || {}));

const toBooleanFlag = (value) => value === true || value === 1;

const buildFormData = (device) => {
  const source = cloneValue(device);

  BOOLEAN_FIELDS.forEach((field) => {
    source[field] = toBooleanFlag(source[field]);
  });

  return {
    ...source,
    portNumber: source.portNumber ?? null,
    site: source.site ?? null,
    vehicleProximityRadius: source.vehicleProximityRadius ?? 100,
    mobileAppProximityRadius: source.mobileAppProximityRadius ?? 50,
    minimumGPSAccuracy: source.minimumGPSAccuracy ?? 20,
    proximityGracePeriodMeters: source.proximityGracePeriodMeters ?? 10,
  };
};

const buildSavePayload = (formData) => {
  const payload = cloneValue(formData);

  BOOLEAN_FIELDS.forEach((field) => {
    payload[field] = payload[field] ? 1 : 0;
  });

  RELATION_FIELDS.forEach((field) => {
    delete payload[field];
  });

  return payload;
};

const PTSDeviceEditForm = ({ device, onSave }) => {
  const dispatch = useDispatch();
  const { sites } = useSelector((state) => state.site);

  // Ensure sites array is available for the SelectBox
  const sitesDataSource = Array.isArray(sites) ? sites : [];

  const [formData, setFormData] = React.useState(() => buildFormData(device));
  const [saving, setSaving] = React.useState(false);
  const [isEditing, setIsEditing] = React.useState(false);

  // Fetch sites on mount
  React.useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  React.useEffect(() => {
    if (device && !isEditing) {
      setFormData(buildFormData(device));
    }
  }, [device, isEditing]);

  const handleFieldChange = (e) => {
    const dataField = e.dataField;
    const value = e.value;

    setFormData((prev) => ({
      ...prev,
      [dataField]: value,
    }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const dataToSend = buildSavePayload(formData);
      const result = await dispatch(updatePTSDevice(device.ptsid, dataToSend));
      const savedDevice = result?.data || dataToSend;

      setFormData(buildFormData(savedDevice));
      setIsEditing(false);

      if (onSave) {
        await Promise.resolve(onSave(savedDevice));
      }

      notify("Device settings updated successfully", "success", 3000);
    } catch (error) {
      notify(`Error updating device: ${error.message}`, "error", 3000);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (device) {
      setFormData(buildFormData(device));
    }
    setIsEditing(false);
    notify("Changes discarded", "info", 2000);
  };

  return (
    <div className="pts-device-edit-form">
      <div className="form-header">
        <div className="form-header__row">
          <div>
            <h3 className="form-header__title">Device Settings</h3>
            <p className="form-header__subtitle">
              {isEditing ? "Edit device configuration and connection settings" : "View device configuration and connection settings"}
            </p>
          </div>
          {!isEditing ? (
            <button className="m365-btn m365-btn--primary" onClick={() => setIsEditing(true)}>
              <i className="fa-light fa-pen"></i> Edit
            </button>
          ) : (
            <button className="m365-btn m365-btn--ghost" onClick={handleReset}>
              <i className="fa-light fa-xmark"></i> Cancel
            </button>
          )}
        </div>
      </div>

      <Form
        formData={formData}
        onFieldDataChanged={handleFieldChange}
        labelMode="floating"
        colCount={2}
        readOnly={!isEditing}
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

        <GroupItem
          colSpan={2}
          caption="Connection & Access"
          cssClass="pts-device-edit-form__section pts-device-edit-form__section--toggles"
        >
          <GroupItem colCount={2}>
            <SimpleItem
              dataField="isActive"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Device Active",
              }}
            />

            <SimpleItem
              dataField="isAuthenticated"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Is Authenticated",
              }}
            />

            <SimpleItem
              dataField="webSocketCapable"
              editorType="dxCheckBox"
              editorOptions={{
                text: "WebSocket Capable",
              }}
            />

            <SimpleItem
              dataField="allowedForDirectCommands"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Allow Direct Commands",
              }}
            />
          </GroupItem>

          <SimpleItem
            dataField="autoAssignUserMasterTag"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Auto-assign User Master Tag",
            }}
          />
        </GroupItem>

        <GroupItem
          colSpan={2}
          caption="Location Validation"
          cssClass="pts-device-edit-form__section pts-device-edit-form__section--toggles"
        >
          <GroupItem colCount={2}>
            <SimpleItem
              dataField="enableLocationValidation"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Enable Location Validation",
              }}
            />

            <SimpleItem
              dataField="bypassOnGPSFailure"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Bypass on GPS Failure",
                disabled: !formData.enableLocationValidation,
              }}
            />
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="requireVehicleProximity"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Require Vehicle Proximity",
                disabled: !formData.enableLocationValidation,
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
                disabled:
                  !formData.enableLocationValidation ||
                  !formData.requireVehicleProximity,
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
                disabled: !formData.enableLocationValidation,
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
                disabled:
                  !formData.enableLocationValidation ||
                  !formData.requireMobileAppProximity,
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
                disabled: !formData.enableLocationValidation,
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
                disabled: !formData.enableLocationValidation,
              }}
            >
              <Label text="Grace Period Tolerance (m)" />
            </SimpleItem>
          </GroupItem>
        </GroupItem>
      </Form>

      {isEditing && (
        <div className="form-actions">
          <Button
            text="Cancel"
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
      )}
    </div>
  );
};

export default PTSDeviceEditForm;
