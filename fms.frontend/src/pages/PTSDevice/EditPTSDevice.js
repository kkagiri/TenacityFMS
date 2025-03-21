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

// windsurf comment
const EditPTSDevice = () => {
  const { deviceId } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    ptsid: "",
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
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isNewDevice, setIsNewDevice] = useState(deviceId === 'new');

  const ptsDevice = useSelector((state) => state.ptsDevice.currentDevice);

  useEffect(() => {
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
      notify(`Error ${isNewDevice ? 'creating' : 'updating'} device: ${error.message}`, "error", 3000);
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
      <h2>{isNewDevice ? 'Create New PTS Device' : 'Edit PTS Device'}</h2>
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
              dataField="ipaddress"
              editorType="dxTextBox"
              editorOptions={{
                stylingMode: "filled",
              }}
            >
              <Label text="IP Address" />
            </SimpleItem>
          </GroupItem>

          <GroupItem colCount={2}>
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
              editorType="dxNumberBox"
              editorOptions={{
                stylingMode: "filled",
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
