import React from 'react';
import { ScrollView } from 'devextreme-react';
import { Form, SimpleItem, GroupItem, Label } from 'devextreme-react/form';

const ValidationSettingsTab = ({ stockValidationSettings, handleStockValidationSettingChange }) => {
  return (
    <ScrollView height="calc(100vh - 300px)" width="100%" direction="vertical" showScrollbar="always">
      <div className="tw-p-6">
        <div className="tw-mb-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-3">
          <div className="tw-flex tw-items-start tw-gap-2">
            <i className="fa-light fa-info-circle tw-text-blue-600 tw-mt-1"></i>
            <div className="tw-text-sm tw-text-blue-800">
              <p className="tw-font-semibold tw-mb-1">Stock Validation & Reconciliation Configuration</p>
              <p>Configure real-time validation thresholds, transfer reconciliation defaults, and variance detection settings.</p>
            </div>
          </div>
        </div>

        <Form formData={stockValidationSettings} labelLocation="top" showColonAfterLabel={false}>
          {/* Real-Time Validation */}
          <GroupItem caption="Real-Time Stock Validation" colCount={2}>
            <SimpleItem
              dataField="enableRealtimeValidation"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Enable real-time stock variance validation before saving entries',
                onValueChanged: (e) => handleStockValidationSettingChange('enableRealtimeValidation', e.value)
              }}
            >
              <Label text="Enable Real-Time Validation" />
            </SimpleItem>

            <SimpleItem
              dataField="varianceThresholdPercentage"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 100,
                step: 0.5,
                showSpinButtons: true,
                format: '#0.#%',
                disabled: !stockValidationSettings.enableRealtimeValidation,
                onValueChanged: (e) => handleStockValidationSettingChange('varianceThresholdPercentage', e.value)
              }}
            >
              <Label text="Variance Threshold (Percentage)" />
            </SimpleItem>

            <SimpleItem
              dataField="varianceThresholdAbsoluteLiters"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 10000,
                step: 10,
                showSpinButtons: true,
                format: '#,##0 L',
                disabled: !stockValidationSettings.enableRealtimeValidation,
                onValueChanged: (e) => handleStockValidationSettingChange('varianceThresholdAbsoluteLiters', e.value)
              }}
            >
              <Label text="Variance Threshold (Absolute Liters)" />
            </SimpleItem>

            <SimpleItem
              dataField="validationDebounceMs"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 100,
                max: 5000,
                step: 100,
                showSpinButtons: true,
                format: '#,##0 ms',
                disabled: !stockValidationSettings.enableRealtimeValidation,
                onValueChanged: (e) => handleStockValidationSettingChange('validationDebounceMs', e.value)
              }}
            >
              <Label text="Validation Debounce Delay (milliseconds)" />
            </SimpleItem>

            <SimpleItem
              dataField="requireConfirmationOnHighVariance"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Require user confirmation before saving entries with high variance (> 2x threshold)',
                disabled: !stockValidationSettings.enableRealtimeValidation,
                onValueChanged: (e) => handleStockValidationSettingChange('requireConfirmationOnHighVariance', e.value)
              }}
            >
              <Label text="High Variance Confirmation" />
            </SimpleItem>
          </GroupItem>

          {/* Transfer Reconciliation */}
          <GroupItem caption="Transfer Reconciliation Settings" colCount={2}>
            <SimpleItem
              dataField="transferReconciliationDefaultDaysRange"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 1,
                max: 365,
                step: 1,
                showSpinButtons: true,
                format: '#,##0 days',
                onValueChanged: (e) => handleStockValidationSettingChange('transferReconciliationDefaultDaysRange', e.value)
              }}
            >
              <Label text="Default Date Range (days)" />
            </SimpleItem>

            <SimpleItem
              dataField="transferReconciliationMaxPeriodsToAnalyze"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 10,
                max: 500,
                step: 10,
                showSpinButtons: true,
                format: '#,##0',
                onValueChanged: (e) => handleStockValidationSettingChange('transferReconciliationMaxPeriodsToAnalyze', e.value)
              }}
            >
              <Label text="Maximum Periods to Analyze" />
            </SimpleItem>

            <SimpleItem
              dataField="transferReconciliationIncludeTransferDetailsDefault"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Include detailed transfer transactions by default',
                onValueChanged: (e) => handleStockValidationSettingChange('transferReconciliationIncludeTransferDetailsDefault', e.value)
              }}
            >
              <Label text="Include Transfer Details" />
            </SimpleItem>
          </GroupItem>
        </Form>

        {/* Info Panel */}
        <div className="tw-mt-6 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
          <h3 className="tw-text-blue-900 tw-font-semibold tw-mb-2 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-info-circle"></i>
            Validation Settings Explained
          </h3>
          <ul className="tw-text-blue-800 tw-text-sm tw-space-y-2">
            <li><strong>Variance Threshold:</strong> Defines acceptable variance between expected and entered stock values. Uses both percentage and absolute liters (whichever is more permissive).</li>
            <li><strong>Debounce Delay:</strong> Prevents excessive API calls while user is typing. Recommended: 500ms for balance between responsiveness and server load.</li>
            <li><strong>High Variance Confirmation:</strong> Requires explicit user confirmation for variances exceeding 2x the threshold, preventing accidental data entry errors.</li>
            <li><strong>Transfer Reconciliation:</strong> Analyzes fuel movements between tanks over time. Default range determines initial date selection when opening the analysis page.</li>
          </ul>
        </div>
      </div>
    </ScrollView>
  );
};

export default ValidationSettingsTab;
