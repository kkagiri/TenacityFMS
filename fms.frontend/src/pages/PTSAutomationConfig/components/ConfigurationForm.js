//Cursor - Configuration Form component for PTS Automation
import React, { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  Form,
  SimpleItem,
  GroupItem,
  ButtonItem,
  Label,
  RequiredRule,
  NumericRule,
  RangeRule,
} from "devextreme-react/form";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { TextBox } from "devextreme-react/text-box";
import { NumberBox } from "devextreme-react/number-box";
import { CheckBox } from "devextreme-react/check-box";
import { SelectBox } from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";
import {
  createConfiguration,
  updateConfiguration,
} from "../../../redux/actions/ptsAutomationConfigActions";

//Cursor - Configuration Form component
const ConfigurationForm = ({ configuration, onSuccess, onCancel }) => {
  const dispatch = useDispatch();
  const { saving } = useSelector((state) => state.ptsAutomationConfig);
  const { sites } = useSelector((state) => state.site);

  const [formData, setFormData] = useState({
    name: "",
    siteId: null,
    isGlobal: false,
    autoCreateLedgerEntries: true,
    checkForDuplicateManualEntries: true,
    duplicateCheckHours: 24,
    isActive: true,
    createdBy: "System",
    description: "",
  });

  useEffect(() => {
    if (configuration) {
      setFormData({
        name: configuration.name || "",
        siteId: configuration.siteId || null,
        isGlobal: configuration.isGlobal || false,
        autoCreateLedgerEntries: configuration.autoCreateLedgerEntries !== false,
        checkForDuplicateManualEntries: configuration.checkForDuplicateManualEntries !== false,
        duplicateCheckHours: configuration.duplicateCheckHours || 24,
        isActive: configuration.isActive !== false,
        createdBy: configuration.createdBy || "System",
        description: configuration.description || "",
      });
    }
  }, [configuration]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name?.trim()) {
      notify("Configuration name is required", "error", 3000);
      return;
    }

    if (!formData.isGlobal && !formData.siteId) {
      notify("Site is required for non-global configurations", "error", 3000);
      return;
    }

    if (formData.isGlobal && formData.siteId) {
      notify("Global configurations cannot have a specific site", "error", 3000);
      return;
    }

    try {
      const dataToSubmit = {
        ...formData,
        siteId: formData.isGlobal ? null : formData.siteId,
      };

      if (configuration?.id) {
        await dispatch(updateConfiguration(configuration.id, dataToSubmit));
      } else {
        await dispatch(createConfiguration(dataToSubmit));
      }

      notify(
        `Configuration ${configuration?.id ? "updated" : "created"} successfully`,
        "success",
        3000
      );
      onSuccess();
    } catch (error) {
      console.error("Error saving configuration:", error);
      notify(
        `Error ${configuration?.id ? "updating" : "creating"} configuration: ${error.message}`,
        "error",
        3000
      );
    }
  };

  const handleFieldChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleGlobalChange = (value) => {
    setFormData((prev) => ({
      ...prev,
      isGlobal: value,
      siteId: value ? null : prev.siteId, // Clear siteId when global is true
    }));
  };

  return (
    <div className="tw-p-6">
      <Form
        formData={formData}
        labelMode="floating"
        className="tw-space-y-4"
      >
        <GroupItem caption="Basic Information" className="tw-mb-4">
          <SimpleItem
            dataField="name"
            editorType="dxTextBox"
            editorOptions={{
              placeholder: "Enter configuration name",
              stylingMode: "filled",
              onValueChanged: (e) => handleFieldChange("name", e.value),
            }}
          >
            <Label text="Configuration Name" />
            <RequiredRule message="Configuration name is required" />
          </SimpleItem>

          <SimpleItem
            dataField="description"
            editorType="dxTextArea"
            editorOptions={{
              placeholder: "Enter configuration description (optional)",
              stylingMode: "filled",
              height: 80,
              onValueChanged: (e) => handleFieldChange("description", e.value),
            }}
          >
            <Label text="Description" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Scope Configuration" className="tw-mb-4">
          <SimpleItem
            dataField="isGlobal"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Global Configuration",
              hint: "If checked, this configuration applies to all sites without specific configurations",
              onValueChanged: (e) => handleGlobalChange(e.value),
            }}
          />

          <SimpleItem
            dataField="siteId"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: sites || [],
              displayExpr: "name",
              valueExpr: "id",
              placeholder: "Select a site",
              stylingMode: "filled",
              disabled: formData.isGlobal,
              onValueChanged: (e) => handleFieldChange("siteId", e.value),
            }}
          >
            <Label text="Site" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Automation Settings" className="tw-mb-4">
          <SimpleItem
            dataField="autoCreateLedgerEntries"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Auto Create Ledger Entries",
              hint: "Automatically create tank volume history entries for pump transactions",
              onValueChanged: (e) => handleFieldChange("autoCreateLedgerEntries", e.value),
            }}
          />

          <SimpleItem
            dataField="checkForDuplicateManualEntries"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Check for Duplicate Manual Entries",
              hint: "Check if manual entries already exist before processing pump transactions",
              onValueChanged: (e) => handleFieldChange("checkForDuplicateManualEntries", e.value),
            }}
          />

          <SimpleItem
            dataField="duplicateCheckHours"
            editorType="dxNumberBox"
            editorOptions={{
              placeholder: "Enter hours",
              stylingMode: "filled",
              min: 1,
              max: 168, // 7 days
              step: 1,
              showSpinButtons: true,
              disabled: !formData.checkForDuplicateManualEntries,
              onValueChanged: (e) => handleFieldChange("duplicateCheckHours", e.value),
            }}
          >
            <Label text="Duplicate Check Hours" />
            <NumericRule message="Must be a valid number" />
            <RangeRule min={1} max={168} message="Must be between 1 and 168 hours" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Status" className="tw-mb-4">
          <SimpleItem
            dataField="isActive"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Active Configuration",
              hint: "Only active configurations are used by the system",
              onValueChanged: (e) => handleFieldChange("isActive", e.value),
            }}
          />
        </GroupItem>

        <GroupItem className="tw-flex tw-justify-end tw-gap-3 tw-mt-6">
          <ButtonItem>
            <Button
              text={configuration?.id ? "Update" : "Create"}
              type="success"
              onClick={handleSubmit}
              disabled={saving}
              className="tw-btn tw-btn-success"
            />
          </ButtonItem>
          <ButtonItem>
            <Button
              text="Cancel"
              type="normal"
              onClick={onCancel}
              disabled={saving}
              className="tw-btn tw-btn-outline"
            />
          </ButtonItem>
        </GroupItem>
      </Form>

      <LoadPanel visible={saving} message="Saving configuration..." />
    </div>
  );
};

export default ConfigurationForm;