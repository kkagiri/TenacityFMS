import React, { useState, useEffect } from 'react';
import { Popup } from 'devextreme-react/popup';
import { Button } from 'devextreme-react/button';
import { NumberBox } from 'devextreme-react/number-box';
import { CheckBox } from 'devextreme-react/check-box';
import { SelectBox } from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';
import './SettingsModal.scss';

/**
 * SettingsModal - Configure variance threshold and display preferences
 *
 * Features:
 * - Variance threshold adjustment (1-100L)
 * - Show/hide deleted entries
 * - Default filter preference
 * - Default grouping preference
 *
 * @param {boolean} visible - Modal visibility
 * @param {object} currentSettings - Current user settings
 * @param {Function} onClose - Close callback
 * @param {Function} onSave - Save callback with new settings
 * @returns {JSX.Element} Settings Modal
 */
const SettingsModal = ({ visible, currentSettings, onClose, onSave }) => {
  const [isSaving, setIsSaving] = useState(false);
  const [settings, setSettings] = useState({
    varianceThreshold: 10,
    showDeleted: false,
    defaultFilter: 'all',
    defaultGrouping: 'none'
  });

  // Filter options
  const filterOptions = [
    { value: 'all', label: 'All Records' },
    { value: 'site', label: 'By Site' },
    { value: 'tank', label: 'By Tank' },
    { value: 'vehicle', label: 'By Vehicle' }
  ];

  // Grouping options
  const groupingOptions = [
    { value: 'none', label: 'No Grouping' },
    { value: 'vehicle', label: 'Group by Vehicle' },
    { value: 'site', label: 'Group by Site' },
    { value: 'tank', label: 'Group by Tank' },
    { value: 'date', label: 'Group by Date' }
  ];

  /**
   * Load current settings on mount
   */
  useEffect(() => {
    if (currentSettings) {
      setSettings({
        varianceThreshold: currentSettings.varianceThreshold || 10,
        showDeleted: currentSettings.showDeleted || false,
        defaultFilter: currentSettings.defaultFilter || 'all',
        defaultGrouping: currentSettings.defaultGrouping || 'none'
      });
    }
  }, [currentSettings, visible]);

  /**
   * Validate form data
   */
  const validateForm = () => {
    const errors = [];

    if (!settings.varianceThreshold || settings.varianceThreshold <= 0) {
      errors.push('Variance threshold must be greater than 0');
    }

    if (settings.varianceThreshold > 100) {
      errors.push('Variance threshold cannot exceed 100L');
    }

    return errors;
  };

  /**
   * Handle save
   */
  const handleSave = async () => {
    // Validate
    const errors = validateForm();
    if (errors.length > 0) {
      errors.forEach(error => notify(error, 'error', 3000));
      return;
    }

    try {
      setIsSaving(true);
      await onSave(settings);
      notify('Settings saved successfully', 'success', 3000);
      onClose();
    } catch (error) {
      console.error('Error saving settings:', error);
      notify('Failed to save settings', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  };

  /**
   * Reset to defaults
   */
  const handleReset = () => {
    setSettings({
      varianceThreshold: 10,
      showDeleted: false,
      defaultFilter: 'all',
      defaultGrouping: 'none'
    });
    notify('Settings reset to defaults', 'info', 3000);
  };

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      title="Fuel Comparison Settings"
      width={550}
      height="auto"
      showCloseButton={true}
      dragEnabled={false}
    >
      <div className="settings-modal">
        {/* Variance Threshold */}
        <div className="tw-mb-5">
          <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
            Variance Threshold (Liters) <span className="tw-text-red-500">*</span>
          </label>
          <NumberBox
            value={settings.varianceThreshold}
            onValueChanged={(e) => setSettings({ ...settings, varianceThreshold: e.value })}
            min={1}
            max={100}
            step={1}
            showSpinButtons={true}
            format="#0.## L"
            placeholder="Enter variance threshold"
          />
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
            Records with variance exceeding this threshold will be highlighted
          </div>
        </div>

        {/* Color Reference */}
        <div className="tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg tw-p-3 tw-mb-5">
          <div className="tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-2">Color Indicators:</div>
          <div className="tw-space-y-2">
            <div className="tw-flex tw-items-center tw-gap-2">
              <div className="tw-w-6 tw-h-6 tw-bg-red-200 tw-border tw-border-red-300 tw-rounded"></div>
              <span className="tw-text-xs tw-text-gray-700">
                <strong>Red:</strong> Variance &gt; Threshold ({settings.varianceThreshold}L)
              </span>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <div className="tw-w-6 tw-h-6 tw-bg-yellow-200 tw-border tw-border-yellow-300 tw-rounded"></div>
              <span className="tw-text-xs tw-text-gray-700">
                <strong>Yellow:</strong> Variance &gt; {(settings.varianceThreshold * 0.5).toFixed(1)}L (50% of threshold)
              </span>
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <div className="tw-w-6 tw-h-6 tw-bg-white tw-border tw-border-gray-300 tw-rounded"></div>
              <span className="tw-text-xs tw-text-gray-700">
                <strong>White:</strong> Normal variance
              </span>
            </div>
          </div>
        </div>

        {/* Show Deleted Entries */}
        <div className="tw-mb-5">
          <CheckBox
            value={settings.showDeleted}
            onValueChanged={(e) => setSettings({ ...settings, showDeleted: e.value })}
            text="Show Deleted Entries"
          />
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1 tw-ml-7">
            Include soft-deleted GPS entries in comparison results
          </div>
        </div>

        {/* Default Filter */}
        <div className="tw-mb-5">
          <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
            Default Filter
          </label>
          <SelectBox
            items={filterOptions}
            value={settings.defaultFilter}
            onValueChanged={(e) => setSettings({ ...settings, defaultFilter: e.value })}
            displayExpr="label"
            valueExpr="value"
            placeholder="Select default filter"
          />
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
            Default data filter when opening the dashboard
          </div>
        </div>

        {/* Default Grouping */}
        <div className="tw-mb-6">
          <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
            Default Grouping
          </label>
          <SelectBox
            items={groupingOptions}
            value={settings.defaultGrouping}
            onValueChanged={(e) => setSettings({ ...settings, defaultGrouping: e.value })}
            displayExpr="label"
            valueExpr="value"
            placeholder="Select default grouping"
          />
          <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
            Default data grouping for the comparison grid
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-between tw-gap-3 tw-mt-6 tw-pt-4 tw-border-t tw-border-gray-200">
          <Button
            text="Reset to Defaults"
            onClick={handleReset}
            type="normal"
            stylingMode="text"
            disabled={isSaving}
            icon="fa-light fa-rotate-left"
          />
          <div className="tw-flex tw-gap-3">
            <Button
              text="Cancel"
              onClick={onClose}
              type="normal"
              stylingMode="outlined"
              disabled={isSaving}
            />
            <Button
              text={isSaving ? "Saving..." : "Save Settings"}
              onClick={handleSave}
              type="success"
              stylingMode="contained"
              disabled={isSaving}
              icon={isSaving ? "fa-light fa-spinner fa-spin" : "fa-light fa-check"}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default SettingsModal;
