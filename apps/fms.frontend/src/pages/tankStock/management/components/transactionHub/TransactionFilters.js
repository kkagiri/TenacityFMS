/**
 * File: TransactionFilters.js
 * Purpose: Filter panel component for TransactionHub
 * Last Modified: 2025-11-26
 */
import React from 'react';
import Button from 'devextreme-react/button';
import CheckBox from 'devextreme-react/check-box';
import SelectBox from 'devextreme-react/select-box';
import { formatDateRangeDisplay } from './transactionHubUtils';

/**
 * Inline Filter Panel - Only User and Manual Dispensing (Site/Tank/Dates in header)
 */
const FilterPanel = ({
  usersForFilter,
  filterUserId,
  onUserFilterChange,
  useManualDispensing,
  onManualDispensingChange,
  showGpsVolume,
  onGpsVolumeChange,
  onApplyFilters,
  onClearFilters
}) => (
  <div className="tw-mt-4 tw-p-3 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-lg">
    <div className="tw-flex tw-items-center tw-gap-4">
      {/* User Filter */}
      <div style={{ width: '200px' }}>
        <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
          Recorded By
        </label>
        <SelectBox
          dataSource={usersForFilter}
          displayExpr="userName"
          valueExpr="userId"
          value={filterUserId}
          onValueChanged={(e) => onUserFilterChange(e.value)}
          placeholder="All Users"
          searchEnabled={true}
          showClearButton={true}
        />
      </div>

      {/* Manual Dispensing Checkbox */}
      <div className="tw-flex tw-items-end tw-pb-1">
        <CheckBox
          text="Use Manual Dispensing"
          value={useManualDispensing}
          onValueChanged={(e) => onManualDispensingChange(e.value)}
          hint="Show manual dispensing from TankStock instead of sensor dispensing"
        />
      </div>

      {/* GPS Volume Checkbox */}
      <div className="tw-flex tw-items-end tw-pb-1">
        <CheckBox
          text="Show GPS Volume"
          value={showGpsVolume}
          onValueChanged={(e) => onGpsVolumeChange(e.value)}
          hint="Show GPS-reported fuel volume for dispensing transactions"
        />
      </div>

      {/* Filter Action Buttons */}
      <div className="tw-flex tw-gap-2 tw-items-end">
        <Button
          text="Apply"
          icon="fa-light fa-search"
          type="default"
          stylingMode="contained"
          onClick={onApplyFilters}
        />
        <Button
          text="Clear"
          icon="fa-light fa-times"
          type="normal"
          stylingMode="outlined"
          onClick={onClearFilters}
        />
      </div>
    </div>
  </div>
);

/**
 * Active Filters Display - Shows header filters + tab filters
 */
const ActiveFiltersDisplay = ({
  selectedSiteIds,
  selectedTankIds,
  filterUserId,
  useManualDispensing,
  headerStartDate,
  headerEndDate,
  sites,
  tanks,
  usersForFilter,
  onClearFilters
}) => (
  <div className="tw-mt-3 tw-p-3 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
    <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center sm:tw-justify-between tw-gap-3">
      {/* Active filters info */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row sm:tw-items-center tw-text-sm tw-text-blue-800 tw-gap-2 tw-flex-1">
        <div className="tw-flex tw-items-center tw-flex-shrink-0">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          <span className="tw-font-medium">Active Filters:</span>
        </div>

        {/* Filter tags - responsive wrapping */}
        <div className="tw-flex tw-flex-wrap tw-gap-2 tw-flex-1">
          {/* Site filter from header */}
          {selectedSiteIds && selectedSiteIds.length > 0 ? (
            selectedSiteIds.length === 1 ? (
              <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                Site: {sites?.find(s => s.id === selectedSiteIds[0])?.name || 'Unknown'}
              </span>
            ) : (
              <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                Sites: {selectedSiteIds.length} selected
              </span>
            )
          ) : (
            <span className="tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
              All Sites
            </span>
          )}

          {/* Tank filter from header */}
          {selectedTankIds && selectedTankIds.length > 0 && (
            selectedTankIds.length === 1 ? (
              <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                Tank: {tanks?.find(t => t.id === selectedTankIds[0])?.name || 'Unknown'}
              </span>
            ) : (
              <span className="tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
                Tanks: {selectedTankIds.length} selected
              </span>
            )
          )}

          {/* User filter - tab specific */}
          {filterUserId && (
            <span className="tw-bg-purple-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
              User: {usersForFilter?.find(u => u.userId === filterUserId)?.userName || 'Unknown'}
            </span>
          )}

          {/* Date range from header */}
          <span className="tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
            {formatDateRangeDisplay(headerStartDate, headerEndDate)}
          </span>

          {/* Manual Dispensing indicator */}
          {useManualDispensing && (
            <span className="tw-bg-yellow-100 tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-whitespace-nowrap">
              Manual Dispensing
            </span>
          )}
        </div>
      </div>

      {/* Reset tab filters button */}
      <div className="tw-flex-shrink-0">
        <Button
          text="Clear Tab Filters"
          onClick={onClearFilters}
          stylingMode="text"
          className="tw-text-xs tw-text-blue-600 tw-w-full sm:tw-w-auto"
        />
      </div>
    </div>
  </div>
);

/**
 * Main TransactionFilters component combining filter panel and active filters display
 */
export const TransactionFilters = ({
  // Filter panel props - adapted to match parent interface
  usersForFilter,
  filterUserId,
  setFilterUserId,
  useManualDispensing,
  setUseManualDispensing,
  showGpsVolume,
  setShowGpsVolume,
  handleApplyFilters,
  handleClearFilters,
  // Active filters display props
  selectedSiteIds,
  selectedTankIds,
  headerStartDate,
  headerEndDate,
  sites,
  tanks
}) => (
  <>
    <FilterPanel
      usersForFilter={usersForFilter}
      filterUserId={filterUserId}
      onUserFilterChange={setFilterUserId}
      useManualDispensing={useManualDispensing}
      onManualDispensingChange={setUseManualDispensing}
      showGpsVolume={showGpsVolume}
      onGpsVolumeChange={setShowGpsVolume}
      onApplyFilters={handleApplyFilters}
      onClearFilters={handleClearFilters}
    />
    <ActiveFiltersDisplay
      selectedSiteIds={selectedSiteIds}
      selectedTankIds={selectedTankIds}
      filterUserId={filterUserId}
      useManualDispensing={useManualDispensing}
      headerStartDate={headerStartDate}
      headerEndDate={headerEndDate}
      sites={sites}
      tanks={tanks}
      usersForFilter={usersForFilter}
      onClearFilters={handleClearFilters}
    />
  </>
);

export default TransactionFilters;
export { FilterPanel, ActiveFiltersDisplay };
