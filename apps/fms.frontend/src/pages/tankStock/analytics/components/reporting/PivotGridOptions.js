import React from 'react';
import PropTypes from 'prop-types';
import { SelectBox } from 'devextreme-react/select-box';
import { RadioGroup } from 'devextreme-react/radio-group';

/**
 * PivotGridOptions - Specific filter options for Pivot Grid tab
 * Supports: Sensor-Based, Manual Aggregate, and Combined (Smart Merge) modes
 */
const PivotGridOptions = ({
  groupByPeriod,
  onGroupByPeriodChange,
  useManualDispensing,
  onUseManualDispensingChange,
  useCombinedDispensing,
  onUseCombinedDispensingChange,
  loading = false
}) => {
  const periodOptions = [
    { value: 'day', text: 'Daily' },
    { value: 'week', text: 'Weekly' },
    { value: 'month', text: 'Monthly' },
    { value: 'quarter', text: 'Quarterly' }
  ];

  const dataSourceOptions = [
    {
      value: 'sensor',
      text: 'Sensor-Based (TankVolumeHistory)',
      icon: 'fa-sensor',
      description: 'Individual sensor transactions from TankVolumeHistory'
    },
    {
      value: 'manual',
      text: 'Manual Aggregate (TankStock)',
      icon: 'fa-clipboard-list',
      description: 'Bulk entries from TankStock records'
    },
    {
      value: 'combined',
      text: 'Combined (Smart Merge)',
      icon: 'fa-layer-group',
      description: 'Use TankVolumeHistory, fill gaps with TankStock data'
    }
  ];

  // Determine current mode
  const getCurrentMode = () => {
    if (useCombinedDispensing) return 'combined';
    if (useManualDispensing) return 'manual';
    return 'sensor';
  };

  const handleModeChange = (e) => {
    const newMode = e.value;

    // Update states based on selection
    if (onUseManualDispensingChange) {
      onUseManualDispensingChange(newMode === 'manual');
    }
    if (onUseCombinedDispensingChange) {
      onUseCombinedDispensingChange(newMode === 'combined');
    }
  };

  const renderDataSourceOption = (item) => {
    return (
      <div className="tw-flex tw-flex-col tw-py-1">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className={`fa-light ${item.icon} tw-text-blue-600`}></i>
          <span className="tw-font-medium">{item.text}</span>
        </div>
        <p className="tw-text-xs tw-text-gray-600 tw-ml-6 tw-mt-0.5">{item.description}</p>
      </div>
    );
  };

  return (
    <div className="tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-mt-4">
      <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
        <i className="fa-light fa-sliders tw-text-blue-600"></i>
        Pivot Grid Options
      </h3>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
        {/* Group By Period */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Group By Period
          </label>
          <SelectBox
            value={groupByPeriod}
            onValueChanged={(e) => onGroupByPeriodChange(e.value)}
            dataSource={periodOptions}
            displayExpr="text"
            valueExpr="value"
            width="100%"
            disabled={loading}
          />
        </div>

        {/* Data Source Mode */}
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Data Source Mode
          </label>
          <RadioGroup
            value={getCurrentMode()}
            onValueChanged={handleModeChange}
            dataSource={dataSourceOptions}
            valueExpr="value"
            itemRender={renderDataSourceOption}
            disabled={loading}
            layout="vertical"
          />
        </div>
      </div>
    </div>
  );
};

PivotGridOptions.propTypes = {
  groupByPeriod: PropTypes.string.isRequired,
  onGroupByPeriodChange: PropTypes.func.isRequired,
  useManualDispensing: PropTypes.bool.isRequired,
  onUseManualDispensingChange: PropTypes.func.isRequired,
  useCombinedDispensing: PropTypes.bool.isRequired,
  onUseCombinedDispensingChange: PropTypes.func.isRequired,
  loading: PropTypes.bool
};

export default PivotGridOptions;
