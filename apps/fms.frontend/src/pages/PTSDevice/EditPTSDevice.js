import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  SimpleItem,
  GroupItem,
  ButtonItem,
  Label,
} from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import {
  getPTSDeviceById,
  updatePTSDevice,
  createPTSDevice,
} from "../../redux/actions/ptsActions/ptsDeviceActions";
import { fetchSiteList } from "../../redux/actions/siteActions";

// windsurf comment
const EditPTSDevice = () => {
  const { deviceId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ptsid: "",
    ptsName: "",
    ipaddress: "",
    portNumber: 80,
    login: "",
    password: "",
    protocolSecurityType: "None",
    authenticationType: "Basic",
    site: null,
    isActive: true,
    isAuthenticated: false,
    webSocketCapable: false,
    allowedForDirectCommands: false,
    // Location Validation Settings
    enableLocationValidation: false,
    requireVehicleProximity: false,
    requireMobileAppProximity: false,
    vehicleProximityRadius: 100,
    mobileAppProximityRadius: 50,
    bypassOnGPSFailure: true,
    minimumGPSAccuracy: 20,
    proximityGracePeriodMeters: 10,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNewDevice, setIsNewDevice] = useState(deviceId === "new");

  const ptsDevice = useSelector((state) => state.ptsDevice.currentDevice);
  const { sites } = useSelector((state) => state.site);

  // Ensure sites array is available for the SelectBox
  const sitesDataSource = Array.isArray(sites) ? sites : [];

  useEffect(() => {
    // Fetch sites for the dropdown
    dispatch(fetchSiteList());

    if (!isNewDevice) {
      const fetchDevice = async () => {
        setLoading(true);
        await dispatch(getPTSDeviceById(deviceId));
        setLoading(false);
      };
      fetchDevice();
    }
  }, [dispatch, deviceId, isNewDevice]);

  useEffect(() => {
    if (ptsDevice && !isNewDevice) {
      setFormData({
        ptsid: ptsDevice.ptsid,
        ptsName: ptsDevice.ptsName || "",
        ipaddress: ptsDevice.ipaddress,
        portNumber: ptsDevice.portNumber,
        login: ptsDevice.login,
        password: ptsDevice.password,
        protocolSecurityType: ptsDevice.protocolSecurityType,
        authenticationType: ptsDevice.authenticationType,
        site: ptsDevice.site,
        isActive: ptsDevice.isActive === 1,
        isAuthenticated: ptsDevice.isAuthenticated === 1,
        webSocketCapable: ptsDevice.webSocketCapable === 1,
        allowedForDirectCommands: ptsDevice.allowedForDirectCommands === 1,
        // Location Validation Settings
        enableLocationValidation: ptsDevice.enableLocationValidation === 1,
        requireVehicleProximity: ptsDevice.requireVehicleProximity === 1,
        requireMobileAppProximity: ptsDevice.requireMobileAppProximity === 1,
        vehicleProximityRadius: ptsDevice.vehicleProximityRadius ?? 100,
        mobileAppProximityRadius: ptsDevice.mobileAppProximityRadius ?? 50,
        bypassOnGPSFailure: ptsDevice.bypassOnGPSFailure === 1,
        minimumGPSAccuracy: ptsDevice.minimumGPSAccuracy ?? 20,
        proximityGracePeriodMeters: ptsDevice.proximityGracePeriodMeters ?? 10,
      });
    }
  }, [ptsDevice, isNewDevice]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    // Convert boolean values to sbyte (0 or 1)
    const dataToSubmit = {
      ...formData,
      isActive: formData.isActive ? 1 : 0,
      isAuthenticated: formData.isAuthenticated ? 1 : 0,
      webSocketCapable: formData.webSocketCapable ? 1 : 0,
      allowedForDirectCommands: formData.allowedForDirectCommands ? 1 : 0,
      // Location Validation Settings
      enableLocationValidation: formData.enableLocationValidation ? 1 : 0,
      requireVehicleProximity: formData.requireVehicleProximity ? 1 : 0,
      requireMobileAppProximity: formData.requireMobileAppProximity ? 1 : 0,
      vehicleProximityRadius: formData.vehicleProximityRadius,
      mobileAppProximityRadius: formData.mobileAppProximityRadius,
      bypassOnGPSFailure: formData.bypassOnGPSFailure ? 1 : 0,
      minimumGPSAccuracy: formData.minimumGPSAccuracy,
      proximityGracePeriodMeters: formData.proximityGracePeriodMeters,
    };

    try {
      if (isNewDevice) {
        await dispatch(createPTSDevice(dataToSubmit));
        notify("Device created successfully", "success", 3000);
      } else {
        await dispatch(updatePTSDevice(deviceId, dataToSubmit));
        notify("Device updated successfully", "success", 3000);
      }
      navigate("/automatic fueling"); // Navigate back to the device dashboard
    } catch (error) {
      notify(
        `Error ${isNewDevice ? "creating" : "updating"} device: ${
          error.message
        }`,
        "error",
        3000
      );
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate("/automatic fueling"); // Navigate back to the device dashboard
  };

  const handleFieldChange = (e) => {
    const { dataField, value } = e.component.option();
    setFormData((prev) => ({
      ...prev,
      [dataField]: value,
    }));
  };

  if (loading) {
    return <LoadPanel visible={true} />;
  }

  return (
    <div className="content-block">
      <h2>{isNewDevice ? "Create New PTS Device" : "Edit PTS Device"}</h2>
      <div className="dx-card responsive-paddings">
        <Form
          formData={formData}
          onFieldDataChanged={handleFieldChange}
          labelMode="floating"
        >
          <GroupItem colCount={2}>
            <SimpleItem
              dataField="ptsid"
              editorType="dxTextBox"
              editorOptions={{
                readOnly: !isNewDevice,
                stylingMode: "filled",
              }}
            >
              <Label text="PTS ID" />
            </SimpleItem>
            <SimpleItem
              dataField="ptsName"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
                placeholder: "Enter a friendly name for this device",
              }}
            >
              <Label text="PTS Name" />
            </SimpleItem>
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="ipaddress"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
              }}
            >
              <Label text="IP Address" />
            </SimpleItem>
            <SimpleItem
              dataField="portNumber"
              editorType="dxNumberBox"
              editorOptions={{
                stylingMode: "filled",
                min: 1,
                max: 65535,
              }}
            >
              <Label text="Port Number" />
            </SimpleItem>
            <SimpleItem
              dataField="login"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
              }}
            >
              <Label text="Login" />
            </SimpleItem>
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="password"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
                mode: "password",
              }}
            >
              <Label text="Password" />
            </SimpleItem>
            <SimpleItem
              dataField="protocolSecurityType"
              editorType="dxSelectBox"
              editorOptions={{
                stylingMode: "filled",
                items: ["None", "SSL", "TLS"],
              }}
            >
              <Label text="Protocol Security Type" />
            </SimpleItem>
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="authenticationType"
              editorType="dxSelectBox"
              editorOptions={{
                stylingMode: "filled",
                items: ["Basic", "Digest", "NTLM", "Kerberos"],
              }}
            >
              <Label text="Authentication Type" />
            </SimpleItem>
            <SimpleItem
              dataField="site"
              editorType="dxSelectBox"
              editorOptions={{
                stylingMode: "filled",
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
          </GroupItem>

          <GroupItem colCount={2}>
            <SimpleItem
              dataField="isActive"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Is Active",
              }}
            />
            <SimpleItem
              dataField="isAuthenticated"
              editorType="dxCheckBox"
              editorOptions={{
                text: "Is Authenticated",
              }}
            />
          </GroupItem>

          <GroupItem colCount={2}>
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
                text: "Allowed For Direct Commands",
              }}
            />
          </GroupItem>

          {/* Location Validation Settings Section */}
          <GroupItem
            caption="Location Validation Settings"
            cssClass="tw-mt-6 tw-border-t tw-pt-4"
          >
            <GroupItem colCount={2}>
              <SimpleItem
                dataField="enableLocationValidation"
                editorType="dxCheckBox"
                editorOptions={{
                  text: "Enable Location Validation",
                }}
                helpText="Enable GPS-based proximity validation for fueling operations"
              />
              <SimpleItem
                dataField="bypassOnGPSFailure"
                editorType="dxCheckBox"
                editorOptions={{
                  text: "Bypass on GPS Failure",
                }}
                helpText="Allow fueling if GPS location is temporarily unavailable"
              />
            </GroupItem>

            <GroupItem colCount={2}>
              <SimpleItem
                dataField="requireVehicleProximity"
                editorType="dxCheckBox"
                editorOptions={{
                  text: "Require Vehicle Proximity",
                }}
                helpText="Require the receiving vehicle to be near the tank for fueling"
              />
              <SimpleItem
                dataField="requireMobileAppProximity"
                editorType="dxCheckBox"
                editorOptions={{
                  text: "Require Mobile App Proximity",
                }}
                helpText="Require the mobile app operator to be near the tank"
              />
            </GroupItem>

            <GroupItem colCount={2}>
              <SimpleItem
                dataField="vehicleProximityRadius"
                editorType="dxNumberBox"
                editorOptions={{
                  stylingMode: "filled",
                  min: 10,
                  max: 1000,
                  showSpinButtons: true,
                  format: "#0 meters",
                }}
              >
                <Label text="Vehicle Proximity Radius (meters)" />
              </SimpleItem>
              <SimpleItem
                dataField="mobileAppProximityRadius"
                editorType="dxNumberBox"
                editorOptions={{
                  stylingMode: "filled",
                  min: 10,
                  max: 500,
                  showSpinButtons: true,
                  format: "#0 meters",
                }}
              >
                <Label text="Mobile App Proximity Radius (meters)" />
              </SimpleItem>
            </GroupItem>

            <GroupItem colCount={2}>
              <SimpleItem
                dataField="minimumGPSAccuracy"
                editorType="dxNumberBox"
                editorOptions={{
                  stylingMode: "filled",
                  min: 5,
                  max: 100,
                  showSpinButtons: true,
                  format: "#0 meters",
                }}
              >
                <Label text="Minimum GPS Accuracy (meters)" />
              </SimpleItem>
              <SimpleItem
                dataField="proximityGracePeriodMeters"
                editorType="dxNumberBox"
                editorOptions={{
                  stylingMode: "filled",
                  min: 0,
                  max: 50,
                  showSpinButtons: true,
                  format: "#0 meters",
                }}
              >
                <Label text="Proximity Grace Period (meters)" />
              </SimpleItem>
            </GroupItem>
          </GroupItem>

          <GroupItem>
            <ButtonItem>
              <Button
                text={isNewDevice ? "Create" : "Save"}
                type="success"
                onClick={handleSubmit}
                disabled={saving}
              />
            </ButtonItem>
            <ButtonItem>
              <Button
                text="Cancel"
                type="normal"
                onClick={handleCancel}
                disabled={saving}
              />
            </ButtonItem>
          </GroupItem>
        </Form>
      </div>
      <LoadPanel visible={saving} />
    </div>
  );
};

export default EditPTSDevice;
