import React from 'react';
import { ScrollView } from 'devextreme-react';
import { Form, SimpleItem, GroupItem, Label } from 'devextreme-react/form';

const BulkImportSettingsTab = ({ bulkImportSettings, handleBulkImportSettingChange }) => {
  const duplicateHandlingOptions = [
    { value: 'Skip', text: 'Skip duplicates (keep existing records)' },
    { value: 'Replace', text: 'Replace duplicates (update existing records)' }
  ];

  return (
    <ScrollView height="calc(100vh - 300px)" width="100%" direction="vertical" showScrollbar="always">
      <div className="tw-p-6">
        <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
          <div className="tw-flex tw-items-start tw-gap-2">
            <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-1"></i>
            <div className="tw-text-sm tw-text-blue-800">
              <p className="tw-font-semibold tw-mb-1">Bulk Import Configuration</p>
              <p>These settings control the default behavior and validation rules for bulk import operations. Changes will apply to all future imports.</p>
            </div>
          </div>
        </div>

        <Form formData={bulkImportSettings} labelLocation="top" showColonAfterLabel={false}>
          {/* Import Behavior */}
          <GroupItem caption="Import Behavior" colCount={2}>
            <SimpleItem
              dataField="defaultDuplicateHandling"
              editorType="dxSelectBox"
              colSpan={1}
              editorOptions={{
                items: duplicateHandlingOptions,
                displayExpr: 'text',
                valueExpr: 'value',
                searchEnabled: false,
                onValueChanged: (e) => handleBulkImportSettingChange('defaultDuplicateHandling', e.value)
              }}
            >
              <Label text="Default Duplicate Handling" />
            </SimpleItem>

            <SimpleItem
              dataField="maxBatchSize"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 100,
                max: 10000,
                step: 100,
                showSpinButtons: true,
                format: '#,##0',
                onValueChanged: (e) => handleBulkImportSettingChange('maxBatchSize', e.value)
              }}
            >
              <Label text="Maximum Batch Size (rows)" />
            </SimpleItem>

            <SimpleItem
              dataField="allowWarningImport"
              editorType="dxCheckBox"
              colSpan={1}
              editorOptions={{
                text: 'Allow import when warnings exist',
                onValueChanged: (e) => handleBulkImportSettingChange('allowWarningImport', e.value)
              }}
            >
              <Label text="Warning Policy" />
            </SimpleItem>

            <SimpleItem
              dataField="enableAutoValidation"
              editorType="dxCheckBox"
              colSpan={1}
              editorOptions={{
                text: 'Auto-validate after file upload',
                onValueChanged: (e) => handleBulkImportSettingChange('enableAutoValidation', e.value)
              }}
            >
              <Label text="Auto-Validation" />
            </SimpleItem>

            <SimpleItem
              dataField="showAdvancedOptions"
              editorType="dxCheckBox"
              colSpan={1}
              editorOptions={{
                text: 'Show advanced import options',
                onValueChanged: (e) => handleBulkImportSettingChange('showAdvancedOptions', e.value)
              }}
            >
              <Label text="Advanced Options" />
            </SimpleItem>
          </GroupItem>

          {/* Stock Continuity */}
          <GroupItem caption="Stock Continuity Check" colCount={3}>
            <SimpleItem
              dataField="stockContinuityEnabled"
              editorType="dxCheckBox"
              colSpan={3}
              editorOptions={{
                text: 'Enable stock continuity validation',
                onValueChanged: (e) => handleBulkImportSettingChange('stockContinuityEnabled', e.value)
              }}
            >
              <Label text="Enable Check" />
            </SimpleItem>

            <SimpleItem
              dataField="stockContinuityThresholdLiters"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 10000,
                step: 50,
                showSpinButtons: true,
                format: '#,##0',
                disabled: !bulkImportSettings.stockContinuityEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('stockContinuityThresholdLiters', e.value)
              }}
            >
              <Label text="Threshold (Liters)" />
            </SimpleItem>

            <SimpleItem
              dataField="stockContinuityThresholdPercent"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 100,
                step: 1,
                showSpinButtons: true,
                format: '#0.#',
                disabled: !bulkImportSettings.stockContinuityEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('stockContinuityThresholdPercent', e.value)
              }}
            >
              <Label text="Threshold (%)" />
            </SimpleItem>
          </GroupItem>

          {/* Balance Equation */}
          <GroupItem caption="Balance Equation Check" colCount={3}>
            <SimpleItem
              dataField="balanceEquationEnabled"
              editorType="dxCheckBox"
              colSpan={3}
              editorOptions={{
                text: 'Enable balance equation validation (Opening + Delivery - Dispensing = Closing)',
                onValueChanged: (e) => handleBulkImportSettingChange('balanceEquationEnabled', e.value)
              }}
            >
              <Label text="Enable Check" />
            </SimpleItem>

            <SimpleItem
              dataField="balanceEquationTolerancePercent"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 20,
                step: 0.5,
                showSpinButtons: true,
                format: '#0.#',
                disabled: !bulkImportSettings.balanceEquationEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('balanceEquationTolerancePercent', e.value)
              }}
            >
              <Label text="Tolerance (%)" />
            </SimpleItem>

            <SimpleItem
              dataField="balanceEquationMinVarianceLiters"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 1000,
                step: 5,
                showSpinButtons: true,
                format: '#,##0',
                disabled: !bulkImportSettings.balanceEquationEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('balanceEquationMinVarianceLiters', e.value)
              }}
            >
              <Label text="Minimum Variance (Liters)" />
            </SimpleItem>
          </GroupItem>

          {/* Meter Reading Validation */}
          <GroupItem caption="Meter Reading Validation" colCount={2}>
            <SimpleItem
              dataField="meterReadingsEnabled"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Enable meter reading vs dispensing validation',
                onValueChanged: (e) => handleBulkImportSettingChange('meterReadingsEnabled', e.value)
              }}
            >
              <Label text="Enable Check" />
            </SimpleItem>

            <SimpleItem
              dataField="meterReadingsTolerancePercent"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 20,
                step: 0.5,
                showSpinButtons: true,
                format: '#0.#',
                disabled: !bulkImportSettings.meterReadingsEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('meterReadingsTolerancePercent', e.value)
              }}
            >
              <Label text="Tolerance (%)" />
            </SimpleItem>

            <SimpleItem
              dataField="meterReadingsMinVarianceLiters"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 1000,
                step: 5,
                showSpinButtons: true,
                format: '#,##0',
                disabled: !bulkImportSettings.meterReadingsEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('meterReadingsMinVarianceLiters', e.value)
              }}
            >
              <Label text="Minimum Variance (Liters)" />
            </SimpleItem>

            <SimpleItem
              dataField="meterReadingsAllowReset"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Allow meter resets (decreasing readings)',
                disabled: !bulkImportSettings.meterReadingsEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('meterReadingsAllowReset', e.value)
              }}
            >
              <Label text="Allow Resets" />
            </SimpleItem>
          </GroupItem>

          {/* Transfer Reciprocity */}
          <GroupItem caption="Transfer Reciprocity Check" colCount={2}>
            <SimpleItem
              dataField="transferReciprocityEnabled"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Enable transfer IN/OUT matching validation',
                onValueChanged: (e) => handleBulkImportSettingChange('transferReciprocityEnabled', e.value)
              }}
            >
              <Label text="Enable Check" />
            </SimpleItem>

            <SimpleItem
              dataField="transferReciprocityToleranceLiters"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 1000,
                step: 5,
                showSpinButtons: true,
                format: '#,##0',
                disabled: !bulkImportSettings.transferReciprocityEnabled,
                onValueChanged: (e) => handleBulkImportSettingChange('transferReciprocityToleranceLiters', e.value)
              }}
            >
              <Label text="Tolerance (Liters)" />
            </SimpleItem>
          </GroupItem>
        </Form>
      </div>
    </ScrollView>
  );
};

export default BulkImportSettingsTab;
