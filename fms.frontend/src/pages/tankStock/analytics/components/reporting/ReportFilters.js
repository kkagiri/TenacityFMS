import React, { useState, useCallback } from 'react';
import PropTypes from 'prop-types';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import { CheckBox } from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import './ReportFilters.scss';

const ReportFilters = ({
  filters,
  sites,
  volumeChangeReasons,
  onFilterChange,
  onClose,
  reportType
}) => {
  const [localFilters, setLocalFilters] = useState({ ...filters });

  const handleFilterUpdate = useCallback((field, value) => {
    setLocalFilters(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleApplyFilters = useCallback(() => {
    onFilterChange(localFilters);
    onClose();
  }, [localFilters, onFilterChange, onClose]);

  const handleResetFilters = useCallback(() => {
    const resetFilters = {
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date(),
      siteIds: [],
      tankIds: [],
      changeReasons: [],
      includeCumulative: false,
      groupByPeriod: 'Day'
    };
    setLocalFilters(resetFilters);
  }, []);

  // Get tanks for selected sites
  const availableTanks = sites
    .filter(site => localFilters.siteIds.length === 0 || localFilters.siteIds.includes(site.id))
    .flatMap(site => site.tanks || [])
    .map(tank => ({ id: tank.id, name: tank.name, siteId: tank.siteId }));

  const groupByPeriodOptions = [
    { value: 'Day', text: 'Daily' },
    { value: 'Week', text: 'Weekly' },
    { value: 'Month', text: 'Monthly' }
  ];

  return (
    <div className="report-filters tw-p-4">
      {/* Date Range */}
      <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Start Date
          </label>
          <DateBox
            value={localFilters.startDate}
            onValueChanged={(e) => handleFilterUpdate('startDate', e.value)}
            type="date"
            width="100%"
          />
        </div>
        <div>
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            End Date
          </label>
          <DateBox
            value={localFilters.endDate}
            onValueChanged={(e) => handleFilterUpdate('endDate', e.value)}
            type="date"
            width="100%"
          />
        </div>
      </div>

      {/* Sites Selection */}
      <div className="tw-mb-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Sites (leave empty for all sites)
        </label>
        <TagBox
          dataSource={sites}
          valueExpr="id"
          displayExpr="name"
          value={localFilters.siteIds}
          onValueChanged={(e) => handleFilterUpdate('siteIds', e.value || [])}
          placeholder="Select sites..."
          searchEnabled={true}
          showClearButton={true}
          width="100%"
        />
      </div>

      {/* Tanks Selection */}
      <div className="tw-mb-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Tanks (leave empty for all tanks)
        </label>
        <TagBox
          dataSource={availableTanks}
          valueExpr="id"
          displayExpr="name"
          value={localFilters.tankIds}
          onValueChanged={(e) => handleFilterUpdate('tankIds', e.value || [])}
          placeholder="Select tanks..."
          searchEnabled={true}
          showClearButton={true}
          width="100%"
          disabled={availableTanks.length === 0}
        />
      </div>

      {/* Volume Change Reasons */}
      <div className="tw-mb-4">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          Volume Change Reasons (leave empty for all reasons)
        </label>
        <TagBox
          dataSource={volumeChangeReasons}
          valueExpr="value"
          displayExpr="name"
          value={localFilters.changeReasons}
          onValueChanged={(e) => handleFilterUpdate('changeReasons', e.value || [])}
          placeholder="Select change reasons..."
          searchEnabled={true}
          showClearButton={true}
          width="100%"
        />
      </div>

      {/* Custom Date Grouping (only for Custom report type) */}
      {reportType === 'Custom' && (
        <div className="tw-mb-4">
          <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
            Group By Period
          </label>
          <SelectBox
            dataSource={groupByPeriodOptions}
            valueExpr="value"
            displayExpr="text"
            value={localFilters.groupByPeriod}
            onValueChanged={(e) => handleFilterUpdate('groupByPeriod', e.value)}
            width="100%"
          />
        </div>
      )}

      {/* Include Cumulative */}
      <div className="tw-mb-6">
        <CheckBox
          value={localFilters.includeCumulative}
          onValueChanged={(e) => handleFilterUpdate('includeCumulative', e.value)}
          text="Include cumulative volume calculations"
        />
      </div>

      {/* Action Buttons */}
      <div className="tw-flex tw-justify-between tw-gap-3">
        <Button
          text="Reset"
          type="normal"
          onClick={handleResetFilters}
        />
        <div className="tw-flex tw-gap-3">
          <Button
            text="Cancel"
            type="normal"
            onClick={onClose}
          />
          <Button
            text="Apply Filters"
            type="default"
            onClick={handleApplyFilters}
          />
        </div>
      </div>
    </div>
  );
};

ReportFilters.propTypes = {
  filters: PropTypes.object.isRequired,
  sites: PropTypes.array.isRequired,
  volumeChangeReasons: PropTypes.array.isRequired,
  onFilterChange: PropTypes.func.isRequired,
  onClose: PropTypes.func.isRequired,
  reportType: PropTypes.string.isRequired
};

export default ReportFilters;
