/**
 * File: GroupingControls.js
 * Purpose: Group control buttons component for TransactionHub DataGrid
 * Last Modified: 2025-11-26
 */
import React from 'react';
import Button from 'devextreme-react/button';
import CheckBox from 'devextreme-react/check-box';

/**
 * GroupingControls component for managing DataGrid grouping
 */
export const GroupingControls = ({
  groupBy,
  handleGroupByChange,
  handleClearGrouping,
  hasActiveGrouping,
  isGroupsExpanded,
  handleToggleExpandGroups,
  showDispensingTotal,
  handleToggleDispensingTotal
}) => {
  return (
    <div className="tw-mt-3 tw-p-3 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg">
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-gap-3">
        {/* Grouping Options */}
        <div className="tw-flex tw-items-center tw-gap-4">
          <label className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-flex tw-items-center">
            <i className="fa-light fa-layer-group tw-mr-2"></i>
            Group By:
          </label>

          {/* Date Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="Date"
              value={groupBy.date}
              onValueChanged={() => handleGroupByChange('date')}
              elementAttr={{
                class: 'tw-flex tw-items-center'
              }}
            />
            <i className="fa-light fa-calendar tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* Site Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="Site"
              value={groupBy.site}
              onValueChanged={() => handleGroupByChange('site')}
              elementAttr={{
                class: 'tw-flex tw-items-center'
              }}
            />
            <i className="fa-light fa-building tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* Tank Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              text="Tank"
              value={groupBy.tank}
              onValueChanged={() => handleGroupByChange('tank')}
              elementAttr={{
                class: 'tw-flex tw-items-center'
              }}
            />
            <i className="fa-light fa-gas-pump tw-ml-1 tw-text-gray-500"></i>
          </div>

          {/* Clear Grouping Button */}
          {hasActiveGrouping && (
            <Button
              text="Clear"
              icon="fa-light fa-times"
              onClick={handleClearGrouping}
              stylingMode="text"
              type="danger"
              elementAttr={{
                class: 'tw-text-sm'
              }}
              hint="Clear all groupings"
            />
          )}
        </div>

        {/* Group Controls */}
        {hasActiveGrouping && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-border-l tw-border-gray-300 tw-pl-4">
            <Button
              text={isGroupsExpanded ? "Collapse All" : "Expand All"}
              icon={isGroupsExpanded ? "fa-light fa-compress" : "fa-light fa-expand"}
              onClick={handleToggleExpandGroups}
              stylingMode="outlined"
              type="default"
              elementAttr={{
                class: 'tw-text-sm'
              }}
            />
            <Button
              text={showDispensingTotal ? "Hide Dispensing" : "Show Dispensing"}
              icon={showDispensingTotal ? "fa-light fa-eye-slash" : "fa-light fa-eye"}
              onClick={handleToggleDispensingTotal}
              stylingMode="outlined"
              type="default"
              elementAttr={{
                class: 'tw-text-sm'
              }}
              hint={showDispensingTotal ? "Hide dispensing totals in summaries" : "Show dispensing totals in summaries"}
            />
          </div>
        )}

        {/* Active Grouping Indicator */}
        {hasActiveGrouping && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-600 tw-ml-auto">
            <i className="fa-light fa-info-circle"></i>
            <span>
              Grouped by: {[
                groupBy.date && 'Date',
                groupBy.site && 'Site',
                groupBy.tank && 'Tank'
              ].filter(Boolean).join(' → ')}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GroupingControls;
