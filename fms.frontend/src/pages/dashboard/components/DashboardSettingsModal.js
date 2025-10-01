/**
 * DashboardSettingsModal - Modal for configuring dashboard settings
 *
 * Allows users to configure layout settings, grid properties, and display preferences.
 */

import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Popup } from 'devextreme-react/popup';
import { ScrollView } from 'devextreme-react/scroll-view';
import { Button } from 'devextreme-react/button';
import { NumberBox } from 'devextreme-react/number-box';
import { CheckBox } from 'devextreme-react/check-box';
import { SelectBox } from 'devextreme-react/select-box';
import { Form, GroupItem, SimpleItem } from 'devextreme-react/form';
import notify from 'devextreme/ui/notify';

const COMPACT_TYPE_OPTIONS = [
  { value: 'vertical', text: 'Vertical' },
  { value: 'horizontal', text: 'Horizontal' },
  { value: null, text: 'None' }
];

const RESIZE_HANDLE_OPTIONS = [
  { value: 'se', text: 'Southeast (bottom-right)' },
  { value: 'sw', text: 'Southwest (bottom-left)' },
  { value: 'ne', text: 'Northeast (top-right)' },
  { value: 'nw', text: 'Northwest (top-left)' },
  { value: 's', text: 'South (bottom)' },
  { value: 'n', text: 'North (top)' },
  { value: 'e', text: 'East (right)' },
  { value: 'w', text: 'West (left)' }
];

/**
 * DashboardSettingsModal Component
 */
const DashboardSettingsModal = ({
  visible,
  currentSettings,
  onSubmit,
  onCancel
}) => {
  const [settings, setSettings] = useState({
    breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
    cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
    rowHeight: 60,
    margin: [10, 10],
    containerPadding: [20, 20],
    compactType: 'vertical',
    preventCollision: false,
    useCSSTransforms: true,
    resizeHandles: ['se'],
    autoSize: true,
    measureBeforeMount: false,
    // Additional dashboard-specific settings
    refreshInterval: 30000,
    enableRealtime: true,
    showConnectionStatus: true,
    enableEditMode: true,
    saveLayoutChanges: true,
    ...currentSettings
  });

  const [isLoading, setIsLoading] = useState(false);

  // Initialize settings when modal opens
  useEffect(() => {
    if (visible && currentSettings) {
      setSettings({
        breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
        cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
        rowHeight: 60,
        margin: [10, 10],
        containerPadding: [20, 20],
        compactType: 'vertical',
        preventCollision: false,
        useCSSTransforms: true,
        resizeHandles: ['se'],
        autoSize: true,
        measureBeforeMount: false,
        refreshInterval: 30000,
        enableRealtime: true,
        showConnectionStatus: true,
        enableEditMode: true,
        saveLayoutChanges: true,
        ...currentSettings
      });
    }
  }, [visible, currentSettings]);

  // Handle form field changes
  const handleFieldChange = (field, value) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle nested object changes (breakpoints, cols, etc.)
  const handleNestedChange = (parent, key, value) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...prev[parent],
        [key]: value
      }
    }));
  };

  // Handle array changes (margin, containerPadding, resizeHandles)
  const handleArrayChange = (field, index, value) => {
    setSettings(prev => {
      const newArray = [...prev[field]];
      newArray[index] = value;
      return {
        ...prev,
        [field]: newArray
      };
    });
  };

  // Handle resize handles change
  const handleResizeHandlesChange = (value) => {
    setSettings(prev => ({
      ...prev,
      resizeHandles: value
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    setIsLoading(true);

    try {
      // Validate settings
      const validatedSettings = validateSettings(settings);
      await onSubmit(validatedSettings);
    } catch (error) {
      console.error('Error saving settings:', error);
      notify('Failed to save settings', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  };

  // Validate settings before submission
  const validateSettings = (settings) => {
    const validated = { ...settings };

    // Ensure row height is positive
    if (validated.rowHeight <= 0) {
      validated.rowHeight = 60;
    }

    // Ensure margins are non-negative
    validated.margin = validated.margin.map(m => Math.max(0, m));
    validated.containerPadding = validated.containerPadding.map(p => Math.max(0, p));

    // Ensure breakpoints are in descending order
    const breakpoints = validated.breakpoints;
    if (breakpoints.lg <= breakpoints.md ||
        breakpoints.md <= breakpoints.sm ||
        breakpoints.sm <= breakpoints.xs) {
      notify('Breakpoints must be in descending order (lg > md > sm > xs)', 'warning', 4000);
      throw new Error('Invalid breakpoint configuration');
    }

    // Ensure columns are positive
    Object.keys(validated.cols).forEach(bp => {
      if (validated.cols[bp] <= 0) {
        validated.cols[bp] = 1;
      }
    });

    return validated;
  };

  // Reset to defaults
  const handleReset = () => {
    setSettings({
      breakpoints: { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 },
      cols: { lg: 12, md: 10, sm: 6, xs: 4, xxs: 2 },
      rowHeight: 60,
      margin: [10, 10],
      containerPadding: [20, 20],
      compactType: 'vertical',
      preventCollision: false,
      useCSSTransforms: true,
      resizeHandles: ['se'],
      autoSize: true,
      measureBeforeMount: false,
      refreshInterval: 30000,
      enableRealtime: true,
      showConnectionStatus: true,
      enableEditMode: true,
      saveLayoutChanges: true
    });
    notify('Settings reset to defaults', 'info', 2000);
  };

  return (
    <Popup
      visible={visible}
      onHiding={onCancel}
      dragEnabled={false}
      closeOnOutsideClick={true}
      showCloseButton={true}
      title="Dashboard Settings"
      width={700}
      height={650}
      className="dashboard-settings-modal"
    >
      <ScrollView>
        <div className="tw-p-4">
          <Form formData={settings} labelLocation="left" colCount={1}>
            {/* Grid Layout Settings */}
            <GroupItem caption="Grid Layout" colCount={1}>
              <SimpleItem dataField="rowHeight" editorType="dxNumberBox">
                <div className="tw-mb-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Row Height (pixels)
                  </label>
                  <NumberBox
                    value={settings.rowHeight}
                    onValueChanged={(e) => handleFieldChange('rowHeight', e.value)}
                    min={30}
                    max={200}
                    step={10}
                    showSpinButtons={true}
                  />
                </div>
              </SimpleItem>

              <SimpleItem dataField="margin">
                <div className="tw-mb-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Widget Margin [Horizontal, Vertical]
                  </label>
                  <div className="tw-flex tw-space-x-2">
                    <NumberBox
                      value={settings.margin[0]}
                      onValueChanged={(e) => handleArrayChange('margin', 0, e.value)}
                      placeholder="Horizontal"
                      min={0}
                      max={50}
                    />
                    <NumberBox
                      value={settings.margin[1]}
                      onValueChanged={(e) => handleArrayChange('margin', 1, e.value)}
                      placeholder="Vertical"
                      min={0}
                      max={50}
                    />
                  </div>
                </div>
              </SimpleItem>

              <SimpleItem dataField="containerPadding">
                <div className="tw-mb-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Container Padding [Horizontal, Vertical]
                  </label>
                  <div className="tw-flex tw-space-x-2">
                    <NumberBox
                      value={settings.containerPadding[0]}
                      onValueChanged={(e) => handleArrayChange('containerPadding', 0, e.value)}
                      placeholder="Horizontal"
                      min={0}
                      max={100}
                    />
                    <NumberBox
                      value={settings.containerPadding[1]}
                      onValueChanged={(e) => handleArrayChange('containerPadding', 1, e.value)}
                      placeholder="Vertical"
                      min={0}
                      max={100}
                    />
                  </div>
                </div>
              </SimpleItem>

              <SimpleItem dataField="compactType">
                <div className="tw-mb-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Compact Type
                  </label>
                  <SelectBox
                    items={COMPACT_TYPE_OPTIONS}
                    value={settings.compactType}
                    onValueChanged={(e) => handleFieldChange('compactType', e.value)}
                    displayExpr="text"
                    valueExpr="value"
                  />
                </div>
              </SimpleItem>
            </GroupItem>

            {/* Responsive Breakpoints */}
            <GroupItem caption="Responsive Breakpoints" colCount={1}>
              {Object.keys(settings.breakpoints).map(bp => (
                <SimpleItem key={bp} dataField={`breakpoints.${bp}`}>
                  <div className="tw-mb-2">
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                      {bp.toUpperCase()} Breakpoint (pixels)
                    </label>
                    <NumberBox
                      value={settings.breakpoints[bp]}
                      onValueChanged={(e) => handleNestedChange('breakpoints', bp, e.value)}
                      min={0}
                      max={2000}
                      step={10}
                    />
                  </div>
                </SimpleItem>
              ))}
            </GroupItem>

            {/* Column Configuration */}
            <GroupItem caption="Grid Columns" colCount={1}>
              {Object.keys(settings.cols).map(bp => (
                <SimpleItem key={bp} dataField={`cols.${bp}`}>
                  <div className="tw-mb-2">
                    <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                      {bp.toUpperCase()} Columns
                    </label>
                    <NumberBox
                      value={settings.cols[bp]}
                      onValueChanged={(e) => handleNestedChange('cols', bp, e.value)}
                      min={1}
                      max={24}
                      step={1}
                    />
                  </div>
                </SimpleItem>
              ))}
            </GroupItem>

            {/* Behavior Settings */}
            <GroupItem caption="Behavior" colCount={1}>
              <SimpleItem dataField="preventCollision">
                <CheckBox
                  value={settings.preventCollision}
                  onValueChanged={(e) => handleFieldChange('preventCollision', e.value)}
                  text="Prevent widget collision"
                />
              </SimpleItem>

              <SimpleItem dataField="useCSSTransforms">
                <CheckBox
                  value={settings.useCSSTransforms}
                  onValueChanged={(e) => handleFieldChange('useCSSTransforms', e.value)}
                  text="Use CSS transforms for positioning"
                />
              </SimpleItem>

              <SimpleItem dataField="autoSize">
                <CheckBox
                  value={settings.autoSize}
                  onValueChanged={(e) => handleFieldChange('autoSize', e.value)}
                  text="Auto-size container height"
                />
              </SimpleItem>
            </GroupItem>

            {/* Dashboard Features */}
            <GroupItem caption="Dashboard Features" colCount={1}>
              <SimpleItem dataField="enableRealtime">
                <CheckBox
                  value={settings.enableRealtime}
                  onValueChanged={(e) => handleFieldChange('enableRealtime', e.value)}
                  text="Enable real-time data updates"
                />
              </SimpleItem>

              <SimpleItem dataField="showConnectionStatus">
                <CheckBox
                  value={settings.showConnectionStatus}
                  onValueChanged={(e) => handleFieldChange('showConnectionStatus', e.value)}
                  text="Show connection status indicator"
                />
              </SimpleItem>

              <SimpleItem dataField="enableEditMode">
                <CheckBox
                  value={settings.enableEditMode}
                  onValueChanged={(e) => handleFieldChange('enableEditMode', e.value)}
                  text="Allow layout editing"
                />
              </SimpleItem>

              <SimpleItem dataField="refreshInterval">
                <div className="tw-mb-2">
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Auto-refresh Interval (milliseconds)
                  </label>
                  <NumberBox
                    value={settings.refreshInterval}
                    onValueChanged={(e) => handleFieldChange('refreshInterval', e.value)}
                    min={5000}
                    max={300000}
                    step={5000}
                  />
                </div>
              </SimpleItem>
            </GroupItem>
          </Form>
        </div>
      </ScrollView>

      {/* Action Buttons */}
      <div className="tw-border-t tw-border-gray-200 tw-p-4 tw-flex tw-justify-between">
        <Button
          text="Reset to Defaults"
          onClick={handleReset}
          disabled={isLoading}
          stylingMode="outlined"
          type="danger"
        />

        <div className="tw-flex tw-space-x-3">
          <Button
            text="Cancel"
            onClick={onCancel}
            disabled={isLoading}
            stylingMode="outlined"
          />

          <Button
            text={isLoading ? "Saving..." : "Save Settings"}
            onClick={handleSubmit}
            disabled={isLoading}
            type="default"
            useSubmitBehavior={true}
          >
            {isLoading && <i className="fa-light fa-spinner fa-spin tw-mr-2"></i>}
          </Button>
        </div>
      </div>
    </Popup>
  );
};

DashboardSettingsModal.propTypes = {
  visible: PropTypes.bool.isRequired,
  currentSettings: PropTypes.object.isRequired,
  onSubmit: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired
};

export default DashboardSettingsModal;