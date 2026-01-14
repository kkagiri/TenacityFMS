import React, { useState, useEffect, useCallback } from 'react';
import { Button } from 'devextreme-react/button';
import { Switch } from 'devextreme-react/switch';
import { TextBox } from 'devextreme-react/text-box';
import { NumberBox } from 'devextreme-react/number-box';
import { SelectBox } from 'devextreme-react/select-box';
import { TextArea } from 'devextreme-react/text-area';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

/**
 * Auto-Close Configuration Panel
 * Embedded panel for configuring auto-close rules within issue templates
 */
const AutoCloseConfigPanel = ({ templateId, templateName, onConfigSaved }) => {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [hasConfig, setHasConfig] = useState(false);

  // Checker type options
  const checkerTypes = [
    { id: 'ActiveAlarm', name: 'Active Alarm Resolution' },
    { id: 'StatusCheck', name: 'Status Check API' },
    { id: 'TimeBasedExpiry', name: 'Time-Based Expiry' },
    { id: 'ManualOnly', name: 'Manual Close Only' }
  ];

  // Load existing config for template
  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await issueTrackerV2Service.getAutoCloseConfigByTemplate(templateId);

      if (data) {
        setConfig(data);
        setHasConfig(true);
      } else {
        // Initialize with defaults
        setConfig({
          issueTemplateId: templateId,
          isEnabled: false,
          checkerType: 'ActiveAlarm',
          checkIntervalSeconds: 300,
          checkerConfigJson: '{}',
          autoCloseWhenSatisfied: true
        });
        setHasConfig(false);
      }
    } catch (error) {
      // No config exists - initialize with defaults
      setConfig({
        issueTemplateId: templateId,
        isEnabled: false,
        checkerType: 'ActiveAlarm',
        checkIntervalSeconds: 300,
        checkerConfigJson: '{}',
        autoCloseWhenSatisfied: true
      });
      setHasConfig(false);
    } finally {
      setLoading(false);
    }
  }, [templateId]);

  useEffect(() => {
    loadConfig();
  }, [loadConfig]);

  // Handle field changes
  const handleFieldChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Save configuration
  const handleSave = async () => {
    try {
      setSaving(true);

      // Validate JSON
      if (config.checkerConfigJson) {
        try {
          JSON.parse(config.checkerConfigJson);
        } catch (e) {
          notify({
            message: 'Invalid JSON in checker configuration',
            type: 'error',
            displayTime: 3000
          });
          return;
        }
      }

      if (hasConfig && config.id) {
        // Update existing
        await issueTrackerV2Service.updateAutoCloseConfig(config.id, config);
      } else {
        // Create new
        await issueTrackerV2Service.createAutoCloseConfig(config);
      }

      await loadConfig();
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error) {
      console.error('Error saving auto-close config:', error);
    } finally {
      setSaving(false);
    }
  };

  // Delete configuration
  const handleDelete = async () => {
    if (!hasConfig || !config.id) return;

    try {
      setSaving(true);
      await issueTrackerV2Service.deleteAutoCloseConfig(config.id);
      await loadConfig();
      if (onConfigSaved) {
        onConfigSaved();
      }
    } catch (error) {
      console.error('Error deleting auto-close config:', error);
    } finally {
      setSaving(false);
    }
  };

  // Get config template based on checker type
  const getConfigTemplate = (checkerType) => {
    switch (checkerType) {
      case 'ActiveAlarm':
        return JSON.stringify({
          alarmCodeField: 'alarmCode',
          resolutionCheckEndpoint: '/api/v1/activealarm/check-resolved',
          matchFields: ['deviceId', 'alarmCode']
        }, null, 2);
      case 'StatusCheck':
        return JSON.stringify({
          apiEndpoint: '/api/v1/status/check',
          successCondition: 'response.status === "healthy"',
          timeoutSeconds: 30
        }, null, 2);
      case 'TimeBasedExpiry':
        return JSON.stringify({
          expiryHours: 72,
          warningHours: 48,
          autoCloseStatus: 'Expired'
        }, null, 2);
      case 'ManualOnly':
        return JSON.stringify({
          requiresApproval: false,
          allowedRoles: ['Admin', 'Manager']
        }, null, 2);
      default:
        return '{}';
    }
  };

  // Apply config template
  const handleApplyTemplate = () => {
    const template = getConfigTemplate(config.checkerType);
    handleFieldChange('checkerConfigJson', template);
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-py-8">
        <LoadIndicator />
        <span className="tw-ml-3 tw-text-gray-600">Loading configuration...</span>
      </div>
    );
  }

  return (
    <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
        <div>
          <h4 className="tw-text-base tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-clock-rotate-left tw-mr-2"></i>
            Auto-Close Configuration
          </h4>
          <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
            Configure automatic issue closure rules for "{templateName}"
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <span className={`tw-text-xs tw-px-2 tw-py-1 tw-rounded ${hasConfig ? 'tw-bg-green-100 tw-text-green-700' : 'tw-bg-gray-200 tw-text-gray-600'}`}>
            {hasConfig ? 'Configured' : 'Not Configured'}
          </span>
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        {/* Enable/Disable */}
        <div className="tw-flex tw-items-center tw-gap-3">
          <label className="tw-text-sm tw-font-medium tw-text-gray-700">Enabled:</label>
          <Switch
            value={config.isEnabled}
            onValueChanged={(e) => handleFieldChange('isEnabled', e.value)}
            width={50}
          />
        </div>

        {/* Auto-Close When Satisfied */}
        <div className="tw-flex tw-items-center tw-gap-3">
          <label className="tw-text-sm tw-font-medium tw-text-gray-700">Auto-Close When Satisfied:</label>
          <Switch
            value={config.autoCloseWhenSatisfied}
            onValueChanged={(e) => handleFieldChange('autoCloseWhenSatisfied', e.value)}
            width={50}
          />
        </div>

        {/* Checker Type */}
        <div>
          <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-block tw-mb-1">
            Checker Type:
          </label>
          <SelectBox
            dataSource={checkerTypes}
            valueExpr="id"
            displayExpr="name"
            value={config.checkerType}
            onValueChanged={(e) => handleFieldChange('checkerType', e.value)}
            width="100%"
          />
        </div>

        {/* Check Interval */}
        <div>
          <label className="tw-text-sm tw-font-medium tw-text-gray-700 tw-block tw-mb-1">
            Check Interval (seconds):
          </label>
          <NumberBox
            value={config.checkIntervalSeconds}
            onValueChanged={(e) => handleFieldChange('checkIntervalSeconds', e.value)}
            min={60}
            max={86400}
            step={60}
            showSpinButtons={true}
            width="100%"
          />
        </div>

        {/* Checker Config JSON */}
        <div className="md:tw-col-span-2">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">
              Checker Configuration (JSON):
            </label>
            <Button
              text="Apply Template"
              type="default"
              stylingMode="text"
              onClick={handleApplyTemplate}
              hint="Apply default template for selected checker type"
            />
          </div>
          <TextArea
            value={config.checkerConfigJson}
            onValueChanged={(e) => handleFieldChange('checkerConfigJson', e.value)}
            height={150}
            placeholder='{"key": "value"}'
          />
          <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
            JSON configuration specific to the selected checker type. Click "Apply Template" for a starting point.
          </p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-items-center tw-justify-end tw-gap-2 tw-mt-4 tw-pt-4 tw-border-t tw-border-gray-200">
        {hasConfig && (
          <Button
            text="Delete"
            type="danger"
            stylingMode="outlined"
            onClick={handleDelete}
            disabled={saving}
          />
        )}
        <Button
          text={hasConfig ? 'Update' : 'Create'}
          type="default"
          stylingMode="contained"
          onClick={handleSave}
          disabled={saving}
        >
          {saving && <LoadIndicator height={20} width={20} />}
        </Button>
      </div>
    </div>
  );
};

export default AutoCloseConfigPanel;
