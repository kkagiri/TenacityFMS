import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Popup, Position } from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import DateRangeBox from 'devextreme-react/date-range-box';
import SelectBox from 'devextreme-react/select-box';
import NumberBox from 'devextreme-react/number-box';
import './FilterPopup.scss';

//Cursor - Filter popup for manual fuel refill with date range, record count, and site filtering
const FilterPopup = ({
  visible,
  onHiding,
  onApplyFilter,
  sites = [],
  initialFilters = {}
}) => {
  const [filters, setFilters] = useState({
    dateRange: [
      new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
      new Date() // today
    ],
    siteId: 'all',
    recordCount: 100,
    ...initialFilters
  });

  const [tempFilters, setTempFilters] = useState(filters);

  useEffect(() => {
    if (visible) {
      setTempFilters(filters);
    }
  }, [visible, filters]);

  const handleDateRangeChange = (e) => {
    if (e.value && e.value.length === 2) {
      setTempFilters(prev => ({
        ...prev,
        dateRange: e.value
      }));
    }
  };

  const handleSiteChange = (e) => {
    setTempFilters(prev => ({
      ...prev,
      siteId: e.value
    }));
  };

  const handleRecordCountChange = (e) => {
    setTempFilters(prev => ({
      ...prev,
      recordCount: e.value
    }));
  };

  const handleApply = () => {
    setFilters(tempFilters);
    onApplyFilter(tempFilters);
    onHiding();
  };

  const handleReset = () => {
    const defaultFilters = {
      dateRange: [
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
        new Date()
      ],
      siteId: 'all',
      recordCount: 100
    };
    setTempFilters(defaultFilters);
  };

  const handleCancel = () => {
    setTempFilters(filters);
    onHiding();
  };

  const siteOptions = [
    { id: 'all', name: 'All Sites' },
    ...sites
  ];

  return (
    <Popup
      visible={visible}
      onHiding={handleCancel}
      dragEnabled={false}
      showCloseButton={true}
      showTitle={true}
      title="Filter Manual Fuel Refills"
      width={500}
      height='auto'
    >
      <Position
        my="center"
        at="center"
        of={window}
      />

      <div className="filter-popup-content">
        <div className="tw-space-y-6 tw-p-4">
          {/* Date Range Filter */}
          <div className="tw-space-y-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
              <i className="fa-light fa-calendar-range tw-mr-2 tw-text-blue-600"></i>
              Date Range
            </label>
            <DateRangeBox
              value={tempFilters.dateRange}
              onValueChanged={handleDateRangeChange}
              displayFormat="dd/MM/yyyy"
              placeholder="Select date range"
              width="100%"
            />
          </div>

          {/* Site Filter */}
          <div className="tw-space-y-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
              <i className="fa-light fa-building tw-mr-2 tw-text-blue-600"></i>
              Site
            </label>
            <SelectBox
              dataSource={siteOptions}
              valueExpr="id"
              displayExpr="name"
              value={tempFilters.siteId}
              onValueChanged={handleSiteChange}
              placeholder="Select site"
              width="100%"
            />
          </div>

          {/* Record Count Filter */}
          <div className="tw-space-y-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700">
              <i className="fa-light fa-list-ol tw-mr-2 tw-text-blue-600"></i>
              Number of Records
            </label>
            <NumberBox
              value={tempFilters.recordCount}
              onValueChanged={handleRecordCountChange}
              min={1}
              max={10000}
              showSpinButtons={true}
              placeholder="Enter record count"
              width="100%"
            />
          </div>

          {/* Applied Filters Summary */}
          <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg">
            <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Current Filters:
            </h4>
            <div className="tw-text-xs tw-text-gray-600 tw-space-y-1">
              <div>
                <span className="tw-font-medium">Date:</span> {' '}
                {tempFilters.dateRange[0]?.toLocaleDateString()} - {tempFilters.dateRange[1]?.toLocaleDateString()}
              </div>
              <div>
                <span className="tw-font-medium">Site:</span> {' '}
                {tempFilters.siteId === 'all' ? 'All Sites' :
                 sites.find(s => s.id === tempFilters.siteId)?.name || 'Unknown'}
              </div>
              <div>
                <span className="tw-font-medium">Records:</span> {tempFilters.recordCount}
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-justify-between tw-p-4 tw-border-t tw-bg-gray-50">
          <Button
            text="Reset"
            icon="fa-light fa-refresh"
            stylingMode="text"
            onClick={handleReset}
          />
          <div className="tw-space-x-2">
            <Button
              text="Cancel"
              stylingMode="outlined"
              onClick={handleCancel}
            />
            <Button
              text="Apply Filters"
              icon="fa-light fa-filter"
              type="default"
              stylingMode="contained"
              onClick={handleApply}
            />
          </div>
        </div>
      </div>
    </Popup>
  );
};

FilterPopup.propTypes = {
  visible: PropTypes.bool.isRequired,
  onHiding: PropTypes.func.isRequired,
  onApplyFilter: PropTypes.func.isRequired,
  sites: PropTypes.array,
  initialFilters: PropTypes.object
};

export default FilterPopup;