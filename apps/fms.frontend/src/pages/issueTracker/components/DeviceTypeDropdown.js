/**
 * File: DeviceTypeDropdown.js
 * Purpose: Reusable device type selector for Issue Tracker forms and filters
 * Dependencies: React, DevExtreme SelectBox, issueTrackerV2Service
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - DeviceTypeDropdown: Renders and manages device type selection
 * - normalizeDeviceTypesResponse: Normalizes device type API response shape
 */
import React, { useEffect, useState } from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import issueTrackerV2Service from '../../../services/issueTrackerV2Service';

/**
 * DeviceTypeDropdown - Reusable dropdown for selecting device types
 * Used in issue creation forms and filters
 */
const DeviceTypeDropdown = ({
  value,
  onValueChanged,
  placeholder = 'Select Device Type...',
  showClearButton = true,
  disabled = false,
  isRequired = false,
  label = 'Device Type',
  showLabel = true,
  className = '',
  onlyMonitored = false, // Filter to show only monitored device types
}) => {
  const [deviceTypes, setDeviceTypes] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadDeviceTypes();
  }, [onlyMonitored]);

  const loadDeviceTypes = async () => {
    try {
      setLoading(true);
      const response = await issueTrackerV2Service.getDeviceTypes();
      let types = normalizeDeviceTypesResponse(response);

      // Filter to only monitored types if requested
      if (onlyMonitored) {
        types = types.filter(t => t.isMonitored);
      }

      setDeviceTypes(types);
    } catch (error) {
      console.error('Error loading device types:', error);
      setDeviceTypes([]);
    } finally {
      setLoading(false);
    }
  };

  const handleValueChanged = (e) => {
    if (onValueChanged) {
      const selectedType = deviceTypes.find(t => t.id === e.value);
      onValueChanged({
        value: e.value,
        deviceType: selectedType
      });
    }
  };

  const itemRender = (item) => {
    if (!item) return null;

    return (
      <div className="tw-flex tw-items-center tw-gap-2 tw-py-1">
        <span className="tw-font-medium tw-text-gray-700">{item.name}</span>
        {item.isMonitored && (
          <span className="tw-ml-auto tw-text-xs tw-bg-green-100 tw-text-green-700 tw-px-2 tw-py-0.5 tw-rounded">
            Monitored
          </span>
        )}
      </div>
    );
  };

  return (
    <div className={`device-type-dropdown ${className}`}>
      {showLabel && label && (
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
          {label}
          {isRequired && <span className="tw-text-red-500 tw-ml-1">*</span>}
        </label>
      )}
      <SelectBox
        value={value}
        dataSource={deviceTypes}
        displayExpr="name"
        valueExpr="id"
        placeholder={placeholder}
        showClearButton={showClearButton}
        disabled={disabled || loading}
        searchEnabled={true}
        searchMode="contains"
        searchExpr="name"
        onValueChanged={handleValueChanged}
        itemRender={itemRender}
        dropDownOptions={{
          minWidth: 250
        }}
      />
    </div>
  );
};

/**
 * Get icon based on device type name
 */
const getDeviceTypeIcon = (typeName) => {
  const iconMap = {
    'ATG': 'fa-gauge-high',
    'PTS': 'fa-gas-pump',
    'GPS': 'fa-satellite-dish',
    'Vehicle': 'fa-car',
    'Fuel Card': 'fa-credit-card',
    'Network': 'fa-network-wired',
    'Software': 'fa-laptop-code',
    'Other': 'fa-question-circle'
  };

  return iconMap[typeName] || 'fa-microchip';
};

/**
 * Handles both raw array responses and wrapped FMSResponse payloads
 */
const normalizeDeviceTypesResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  if (response !== null && response !== undefined) {
    console.error('Unexpected device type response format:', response);
  }

  return [];
};

export default DeviceTypeDropdown;
