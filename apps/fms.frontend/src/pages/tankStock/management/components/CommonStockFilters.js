import React, { useEffect, useMemo } from 'react';
import { DateBox } from 'devextreme-react/date-box';
import { TagBox } from 'devextreme-react/tag-box';
import { Button } from 'devextreme-react/button';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchUsersForFilter } from '../../../../redux/actions/userActions';
import { useStockFilters } from '../context/StockFilterContext';
import notify from 'devextreme/ui/notify';

/**
 * CommonStockFilters - Shared filter panel for all Stock Management tabs
 * Placed in the header of the main StockManagement page
 */
const CommonStockFilters = ({ showUserFilter = false, onApplyFilters }) => {
  const dispatch = useDispatch();
  const {
    startDate,
    endDate,
    selectedSiteIds,
    selectedTankIds,
    selectedUserIds,
    setStartDate,
    setEndDate,
    setSelectedSiteIds,
    setSelectedTankIds,
    setSelectedUserIds,
    resetFilters
  } = useStockFilters();

  const sites = useSelector((state) => state.site?.sites || []);
  const tanks = useSelector((state) => state.tank?.tanks || []);
  const users = useSelector((state) => state.user?.usersForFilter || []);

  // Load data on mount
  useEffect(() => {
    dispatch(fetchSiteList());
    dispatch(fetchTanks());
    if (showUserFilter) {
      dispatch(fetchUsersForFilter());
    }
  }, [dispatch, showUserFilter]);

  // Filter tanks based on selected sites
  const filteredTanks = useMemo(() => {
    if (!selectedSiteIds || selectedSiteIds.length === 0) {
      return tanks;
    }
    return tanks.filter(tank => selectedSiteIds.includes(tank.siteId));
  }, [tanks, selectedSiteIds]);

  // Clear tank selection when site selection changes
  useEffect(() => {
    if (selectedSiteIds.length > 0 && selectedTankIds.length > 0) {
      const validTankIds = selectedTankIds.filter(tankId =>
        filteredTanks.some(tank => tank.id === tankId)
      );
      if (validTankIds.length !== selectedTankIds.length) {
        setSelectedTankIds(validTankIds);
      }
    }
  }, [selectedSiteIds, selectedTankIds, filteredTanks, setSelectedTankIds]);

  const handleApply = () => {
    if (!startDate || !endDate) {
      notify({
        message: 'Please select both start and end dates',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    if (startDate > endDate) {
      notify({
        message: 'Start date cannot be greater than end date.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    // Call parent callback if provided
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  const handleReset = () => {
    resetFilters();
    if (onApplyFilters) {
      onApplyFilters();
    }
  };

  return (
    <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-to-indigo-50 tw-rounded-lg tw-shadow-md tw-p-4 tw-border tw-border-blue-100">
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-6 tw-gap-3">
        {/* Start Date */}
        <div>
          <label className="tw-block tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-1 tw-flex tw-items-center tw-gap-1">
            <i className="fa-light fa-calendar-day tw-text-blue-600"></i>
            Start Date
          </label>
          <DateBox
            value={startDate}
            onValueChanged={(e) => setStartDate(e.value)}
            displayFormat="dd/MM/yyyy"
            type="date"
            showClearButton={false}
            width="100%"
            stylingMode="filled"
          />
        </div>

        {/* End Date */}
        <div>
          <label className="tw-block tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-1 tw-flex tw-items-center tw-gap-1">
            <i className="fa-light fa-calendar-check tw-text-blue-600"></i>
            End Date
          </label>
          <DateBox
            value={endDate}
            onValueChanged={(e) => setEndDate(e.value)}
            displayFormat="dd/MM/yyyy"
            type="date"
            showClearButton={false}
            width="100%"
            stylingMode="filled"
          />
        </div>

        {/* Site Filter */}
        <div>
          <label className="tw-block tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-1 tw-flex tw-items-center tw-gap-1">
            <i className="fa-light fa-building tw-text-blue-600"></i>
            Site <span className="tw-text-gray-500 tw-font-normal">(All)</span>
          </label>
          <TagBox
            value={selectedSiteIds}
            onValueChanged={(e) => setSelectedSiteIds(e.value)}
            dataSource={sites}
            displayExpr="name"
            valueExpr="id"
            placeholder="Select sites..."
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            stylingMode="filled"
          />
        </div>

        {/* Tank Filter */}
        <div>
          <label className="tw-block tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-1 tw-flex tw-items-center tw-gap-1">
            <i className="fa-light fa-gas-pump tw-text-blue-600"></i>
            Tank <span className="tw-text-gray-500 tw-font-normal">(All)</span>
          </label>
          <TagBox
            value={selectedTankIds}
            onValueChanged={(e) => setSelectedTankIds(e.value)}
            dataSource={filteredTanks}
            displayExpr="name"
            valueExpr="id"
            placeholder="Select tanks..."
            showClearButton={true}
            searchEnabled={true}
            width="100%"
            stylingMode="filled"
          />
        </div>

        {/* User Filter (Optional) */}
        {showUserFilter && (
          <div>
            <label className="tw-block tw-text-xs tw-font-semibold tw-text-gray-700 tw-mb-1 tw-flex tw-items-center tw-gap-1">
              <i className="fa-light fa-user tw-text-blue-600"></i>
              User <span className="tw-text-gray-500 tw-font-normal">(All)</span>
            </label>
            <TagBox
              value={selectedUserIds}
              onValueChanged={(e) => setSelectedUserIds(e.value)}
              dataSource={users}
              displayExpr="name"
              valueExpr="id"
              placeholder="Select users..."
              showClearButton={true}
              searchEnabled={true}
              width="100%"
              stylingMode="filled"
            />
          </div>
        )}

        {/* Action Buttons */}
        <div className="tw-flex tw-items-end tw-gap-2">
          <Button
            text="Apply"
            type="default"
            icon="fa-light fa-filter"
            onClick={handleApply}
            width="50%"
            stylingMode="contained"
          />
          <Button
            text="Reset"
            icon="fa-light fa-refresh"
            onClick={handleReset}
            width="50%"
            stylingMode="outlined"
          />
        </div>
      </div>

      {/* Filter Summary */}
      <div className="tw-mt-3 tw-pt-3 tw-border-t tw-border-blue-200 tw-flex tw-flex-wrap tw-gap-2 tw-text-xs tw-text-gray-600">
        <span className="tw-flex tw-items-center tw-gap-1">
          <i className="fa-light fa-calendar tw-text-blue-600"></i>
          <strong>Period:</strong> {startDate?.toLocaleDateString()} - {endDate?.toLocaleDateString()}
        </span>
        <span className="tw-flex tw-items-center tw-gap-1">
          <i className="fa-light fa-building tw-text-blue-600"></i>
          <strong>Sites:</strong> {selectedSiteIds.length === 0 ? 'All' : selectedSiteIds.length}
        </span>
        <span className="tw-flex tw-items-center tw-gap-1">
          <i className="fa-light fa-gas-pump tw-text-blue-600"></i>
          <strong>Tanks:</strong> {selectedTankIds.length === 0 ? 'All' : selectedTankIds.length}
        </span>
        {showUserFilter && (
          <span className="tw-flex tw-items-center tw-gap-1">
            <i className="fa-light fa-user tw-text-blue-600"></i>
            <strong>Users:</strong> {selectedUserIds.length === 0 ? 'All' : selectedUserIds.length}
          </span>
        )}
      </div>
    </div>
  );
};

export default CommonStockFilters;
