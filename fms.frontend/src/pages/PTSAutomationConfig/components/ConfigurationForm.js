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
    updateTankVolumeFromBookKeeping: true,
    usePtsProbeReadings: false,
    volumeSourcePriority: 1,
    duplicateVolumeTolerance: 0.01,
    autoReconcileTankVolumes: false,
    reconciliationFrequencyMinutes: 60,
    maxVolumeDiscrepancyThreshold: 10.0,
    discrepancyAction: 1,
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
        updateTankVolumeFromBookKeeping: configuration.updateTankVolumeFromBookKeeping !== false,
        usePtsProbeReadings: configuration.usePtsProbeReadings || false,
        volumeSourcePriority: configuration.volumeSourcePriority || 1,
        duplicateVolumeTolerance: configuration.duplicateVolumeTolerance || 0.01,
        autoReconcileTankVolumes: configuration.autoReconcileTankVolumes || false,
        reconciliationFrequencyMinutes: configuration.reconciliationFrequencyMinutes || 60,
        maxVolumeDiscrepancyThreshold: configuration.maxVolumeDiscrepancyThreshold || 10.0,
        discrepancyAction: configuration.discrepancyAction || 1,
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

          <SimpleItem
            dataField="duplicateVolumeTolerance"
            editorType="dxNumberBox"
            editorOptions={{
              placeholder: "Enter percentage (e.g., 0.01 for 1%)",
              stylingMode: "filled",
              min: 0,
              max: 1,
              step: 0.001,
              format: "percent",
              showSpinButtons: true,
              disabled: !formData.checkForDuplicateManualEntries,
              onValueChanged: (e) => handleFieldChange("duplicateVolumeTolerance", e.value),
            }}
          >
            <Label text="Duplicate Volume Tolerance (%)" />
            <NumericRule message="Must be a valid number" />
            <RangeRule min={0} max={1} message="Must be between 0% and 100%" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Volume Management" className="tw-mb-4">
          <SimpleItem
            dataField="updateTankVolumeFromBookKeeping"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Update Tank Volume from Book Keeping",
              hint: "Update tank current volume from ledger/book keeping records",
              onValueChanged: (e) => handleFieldChange("updateTankVolumeFromBookKeeping", e.value),
            }}
          />

          <SimpleItem
            dataField="usePtsProbeReadings"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Use PTS Probe Readings",
              hint: "Use PTS probe readings for tank volume measurements",
              onValueChanged: (e) => handleFieldChange("usePtsProbeReadings", e.value),
            }}
          />

          <SimpleItem
            dataField="volumeSourcePriority"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: [
                { id: 1, name: "Book Keeping Priority" },
                { id: 2, name: "PTS Probe Priority" }
              ],
              displayExpr: "name",
              valueExpr: "id",
              stylingMode: "filled",
              disabled: !formData.updateTankVolumeFromBookKeeping && !formData.usePtsProbeReadings,
              onValueChanged: (e) => handleFieldChange("volumeSourcePriority", e.value),
            }}
          >
            <Label text="Volume Source Priority" />
          </SimpleItem>
        </GroupItem>

        <GroupItem caption="Reconciliation Settings" className="tw-mb-4">
          <SimpleItem
            dataField="autoReconcileTankVolumes"
            editorType="dxCheckBox"
            editorOptions={{
              text: "Auto Reconcile Tank Volumes",
              hint: "Automatically reconcile tank volumes between different sources",
              onValueChanged: (e) => handleFieldChange("autoReconcileTankVolumes", e.value),
            }}
          />

          <SimpleItem
            dataField="reconciliationFrequencyMinutes"
            editorType="dxNumberBox"
            editorOptions={{
              placeholder: "Enter minutes",
              stylingMode: "filled",
              min: 1,
              max: 1440, // 24 hours
              step: 1,
              showSpinButtons: true,
              disabled: !formData.autoReconcileTankVolumes,
              onValueChanged: (e) => handleFieldChange("reconciliationFrequencyMinutes", e.value),
            }}
          >
            <Label text="Reconciliation Frequency (minutes)" />
            <NumericRule message="Must be a valid number" />
            <RangeRule min={1} max={1440} message="Must be between 1 and 1440 minutes" />
          </SimpleItem>

          <SimpleItem
            dataField="maxVolumeDiscrepancyThreshold"
            editorType="dxNumberBox"
            editorOptions={{
              placeholder: "Enter threshold value",
              stylingMode: "filled",
              min: 0,
              step: 0.1,
              showSpinButtons: true,
              disabled: !formData.autoReconcileTankVolumes,
              onValueChanged: (e) => handleFieldChange("maxVolumeDiscrepancyThreshold", e.value),
            }}
          >
            <Label text="Max Volume Discrepancy Threshold" />
            <NumericRule message="Must be a valid number" />
          </SimpleItem>

          <SimpleItem
            dataField="discrepancyAction"
            editorType="dxSelectBox"
            editorOptions={{
              dataSource: [
                { id: 1, name: "Alert Only" },
                { id: 2, name: "Block Operations" },
                { id: 3, name: "Auto-Adjust" }
              ],
              displayExpr: "name",
              valueExpr: "id",
              stylingMode: "filled",
              disabled: !formData.autoReconcileTankVolumes,
              onValueChanged: (e) => handleFieldChange("discrepancyAction", e.value),
            }}
          >
            <Label text="Discrepancy Action" />
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