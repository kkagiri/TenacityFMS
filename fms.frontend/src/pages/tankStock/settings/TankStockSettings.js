import React, { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { ScrollView } from 'devextreme-react';
import { Form, SimpleItem, GroupItem, Label, RequiredRule } from 'devextreme-react/form';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { usePermissions } from '../../../hooks/usePermissions';
import {
  fetchSystemConfigurations,
  updateSystemConfiguration
} from '../../../redux/actions/systemConfigActions';

const TankStockSettings = () => {
  const dispatch = useDispatch();
  const { userInfo } = usePermissions(); // Get user info from JWT token
  const { configurations, loading } = useSelector((state) => state.systemConfig);

  const [settings, setSettings] = useState({
    futureRecordsPolicy: 'WARN_RECALCULATE',
    showDetailedWarnings: true,
    maxHistoricalDays: 400,
    allowOverride: true,
    showRecordDetails: true,
    enableSensorPhysicalStockUpdate: false
  });

  const [saving, setSaving] = useState(false);
  const [configMap, setConfigMap] = useState({});

  // Check if user has admin role (from JWT token)
  // userInfo.roles can be a string or array
  const userRoles = Array.isArray(userInfo?.roles)
    ? userInfo.roles.map(r => r.toLowerCase())
    : (userInfo?.roles ? [userInfo.roles.toLowerCase()] : []);

  const hasAdminPermission = userRoles.includes('admin');

  // Fetch Tank Stock configurations
  useEffect(() => {
    dispatch(fetchSystemConfigurations({ category: 'TankStock' }));
    dispatch(fetchSystemConfigurations({ category: 'Tank Management' }));
  }, [dispatch]);

  // Map configurations to settings
  useEffect(() => {
    if (configurations && configurations.length > 0) {
      const configMapping = {};
      const newSettings = {
        futureRecordsPolicy: 'WARN_RECALCULATE',
        showDetailedWarnings: true,
        maxHistoricalDays: 400,
        allowOverride: true,
        showRecordDetails: true,
        enableSensorPhysicalStockUpdate: false
      };

      configurations.forEach(config => {
        configMapping[config.configurationKey] = config;

        // Map configuration values to settings
        switch (config.configurationKey) {
          case 'TankStock.FutureRecords.Policy':
            newSettings.futureRecordsPolicy = config.configurationValue;
            break;
          case 'TankStock.ShowDetailedWarnings':
            newSettings.showDetailedWarnings = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'TankStock.MaxHistoricalDays':
            newSettings.maxHistoricalDays = parseInt(config.configurationValue) || 0;
            break;
          case 'TankStock.FutureRecords.MaxDaysBack':
            newSettings.maxHistoricalDays = parseInt(config.configurationValue) || 0;
            break;
          case 'TankStock.FutureRecords.AllowOverride':
            newSettings.allowOverride = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'TankStock.FutureRecords.ShowRecordDetails':
            newSettings.showRecordDetails = config.configurationValue.toLowerCase() === 'true';
            break;
          case 'Tank.EnableSensorPhysicalStockUpdate':
            newSettings.enableSensorPhysicalStockUpdate = config.configurationValue.toLowerCase() === 'true';
            break;
          default:
            break;
        }
      });

      setConfigMap(configMapping);
      setSettings(newSettings);
    }
  }, [configurations]);

  const handleSettingChange = useCallback((field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  }, []);

  const handleSave = useCallback(async () => {
    if (!hasAdminPermission) {
      notify('You do not have permission to modify these settings', 'error', 4000);
      return;
    }

    setSaving(true);
    try {
      const updates = [];

      // Map settings back to configurations
      const settingsToConfigMap = {
        futureRecordsPolicy: 'TankStock.FutureRecords.Policy',
        showDetailedWarnings: 'TankStock.ShowDetailedWarnings',
        maxHistoricalDays: 'TankStock.FutureRecords.MaxDaysBack',
        allowOverride: 'TankStock.FutureRecords.AllowOverride',
        showRecordDetails: 'TankStock.FutureRecords.ShowRecordDetails',
        enableSensorPhysicalStockUpdate: 'Tank.EnableSensorPhysicalStockUpdate'
      };

      for (const [settingKey, configKey] of Object.entries(settingsToConfigMap)) {
        const config = configMap[configKey];
        if (config) {
          let newValue = settings[settingKey];

          // Convert boolean to string
          if (typeof newValue === 'boolean') {
            newValue = newValue.toString();
          }
          // Convert number to string
          else if (typeof newValue === 'number') {
            newValue = newValue.toString();
          }

          // Only update if value changed
          if (newValue !== config.configurationValue) {
            updates.push(
              dispatch(updateSystemConfiguration({
                ...config,
                configurationValue: newValue
              }))
            );
          }
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        notify('Tank Stock settings updated successfully', 'success', 3000);

        // Reload configurations
        dispatch(fetchSystemConfigurations({ category: 'TankStock' }));
        dispatch(fetchSystemConfigurations({ category: 'Tank Management' }));
      } else {
        notify('No changes to save', 'info', 2000);
      }
    } catch (error) {
      console.error('Error saving Tank Stock settings:', error);
      notify('Failed to update Tank Stock settings', 'error', 4000);
    } finally {
      setSaving(false);
    }
  }, [settings, configMap, hasAdminPermission, dispatch]);

  const policyOptions = [
    { value: 'BLOCK', text: 'BLOCK - Prevent historical entries when future records exist' },
    { value: 'WARN_RECONCILE', text: 'WARN_RECONCILE - Warn and require manual reconciliation' },
    { value: 'WARN_RECALCULATE', text: 'WARN_RECALCULATE - Warn and automatically recalculate' },
    { value: 'ALLOW_RECALCULATE', text: 'ALLOW_RECALCULATE - Allow and automatically recalculate' }
  ];

  if (!hasAdminPermission) {
    return (
      <ScrollView className="tw-bg-gray-50 tw-min-h-screen">
        <div className="tw-p-6">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-8">
            <div className="tw-text-center">
              <i className="fa-light fa-lock tw-text-6xl tw-text-red-600 tw-mb-4"></i>
              <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800 tw-mb-4">
                Access Denied
              </h2>
              <p className="tw-text-gray-600 tw-mb-6">
                You do not have permission to access Tank Stock settings.
              </p>
              <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
                <p className="tw-text-red-800 tw-font-medium">
                  <i className="fa-light fa-info-circle tw-mr-2"></i>
                  Admin permission is required to modify these settings
                </p>
              </div>
            </div>
          </div>
        </div>
      </ScrollView>
    );
  }

  return (
    <ScrollView className="tw-bg-gray-50 tw-min-h-screen">
      <div className="tw-p-6">
        {/* Header */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-3">
                <i className="fa-light fa-cog tw-text-blue-600"></i>
                Tank Stock Settings
              </h1>
              <p className="tw-text-gray-600 tw-mt-2">
                Configure tank stock operations, validation rules, and system preferences
              </p>
            </div>
            <Button
              text="Save Settings"
              type="success"
              stylingMode="contained"
              icon="fa-light fa-save"
              onClick={handleSave}
              disabled={saving || loading}
            />
          </div>
        </div>

        {/* Settings Form */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6">
          {loading && (
            <div className="tw-text-center tw-py-8">
              <i className="fa fa-spinner fa-spin tw-text-4xl tw-text-blue-600"></i>
              <p className="tw-text-gray-600 tw-mt-4">Loading settings...</p>
            </div>
          )}

          {!loading && (
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
          )}

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
      </div>
    </ScrollView>
  );
};

export default TankStockSettings;
