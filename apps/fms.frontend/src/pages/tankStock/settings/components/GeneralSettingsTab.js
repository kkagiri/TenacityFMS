import React from 'react';
import { ScrollView } from 'devextreme-react';
import { Form, SimpleItem, GroupItem, Label, RequiredRule } from 'devextreme-react/form';

const GeneralSettingsTab = ({ settings, handleSettingChange }) => {
  const policyOptions = [
    { value: 'BLOCK', text: 'BLOCK - Prevent historical entries when future records exist' },
    { value: 'WARN_RECONCILE', text: 'WARN_RECONCILE - Warn and require manual reconciliation' },
    { value: 'WARN_RECALCULATE', text: 'WARN_RECALCULATE - Warn and automatically recalculate' },
    { value: 'ALLOW_RECALCULATE', text: 'ALLOW_RECALCULATE - Allow and automatically recalculate' }
  ];

  return (
    <ScrollView height="calc(100vh - 300px)" width="100%" direction="vertical" showScrollbar="always">
      <div className="tw-p-6">
        <Form formData={settings} labelLocation="top" showColonAfterLabel={false}>
          {/* Future Records Policy */}
          <GroupItem caption="Historical Entry & Future Records Policy" colCount={2}>
            <SimpleItem
              dataField="futureRecordsPolicy"
              editorType="dxSelectBox"
              colSpan={1}
              editorOptions={{
                dataSource: policyOptions,
                valueExpr: 'value',
                displayExpr: 'text',
                onValueChanged: (e) => handleSettingChange('futureRecordsPolicy', e.value)
              }}
            >
              <Label text="Future Records Policy" />
              <RequiredRule message="Policy is required" />
            </SimpleItem>

            <SimpleItem
              dataField="maxHistoricalDays"
              editorType="dxNumberBox"
              colSpan={1}
              editorOptions={{
                min: 0,
                max: 9999,
                showSpinButtons: true,
                onValueChanged: (e) => handleSettingChange('maxHistoricalDays', e.value)
              }}
            >
              <Label text="Maximum Historical Days (0 = unlimited)" />
            </SimpleItem>

            <SimpleItem
              dataField="allowOverride"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Allow users to override warnings',
                onValueChanged: (e) => handleSettingChange('allowOverride', e.value)
              }}
            >
              <Label text="Override Permission" />
            </SimpleItem>
          </GroupItem>

          {/* Warning Display Settings */}
          <GroupItem caption="Warning & Display Settings" colCount={2}>
            <SimpleItem
              dataField="showDetailedWarnings"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Show detailed warning messages',
                onValueChanged: (e) => handleSettingChange('showDetailedWarnings', e.value)
              }}
            >
              <Label text="Detailed Warnings" />
            </SimpleItem>

            <SimpleItem
              dataField="showRecordDetails"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Show detailed record information in warnings',
                onValueChanged: (e) => handleSettingChange('showRecordDetails', e.value)
              }}
            >
              <Label text="Record Details" />
            </SimpleItem>
          </GroupItem>

          {/* Tank Management Settings */}
          <GroupItem caption="Tank Management Settings" colCount={2}>
            <SimpleItem
              dataField="enableSensorPhysicalStockUpdate"
              editorType="dxCheckBox"
              colSpan={2}
              editorOptions={{
                text: 'Enable automatic physical stock updates from sensor readings',
                onValueChanged: (e) => handleSettingChange('enableSensorPhysicalStockUpdate', e.value)
              }}
            >
              <Label text="Sensor Stock Updates" />
            </SimpleItem>
          </GroupItem>
        </Form>

        {/* Info Panel */}
        <div className="tw-mt-6 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
          <h3 className="tw-text-blue-900 tw-font-semibold tw-mb-2 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-info-circle"></i>
            Policy Descriptions
          </h3>
          <ul className="tw-text-blue-800 tw-text-sm tw-space-y-2">
            <li><strong>BLOCK:</strong> Completely prevent historical entries when future records exist</li>
            <li><strong>WARN_RECONCILE:</strong> Show warning and require manual reconciliation of future records</li>
            <li><strong>WARN_RECALCULATE:</strong> Show warning but automatically recalculate affected records</li>
            <li><strong>ALLOW_RECALCULATE:</strong> Silently allow entry and automatically recalculate</li>
          </ul>
        </div>
      </div>
    </ScrollView>
  );
};

export default GeneralSettingsTab;
