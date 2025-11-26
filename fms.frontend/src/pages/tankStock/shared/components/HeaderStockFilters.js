import React, { useEffect, useMemo } from 'react';
import DateRangeBox from 'devextreme-react/date-range-box';
import { TagBox } from 'devextreme-react/tag-box';
import { Button } from 'devextreme-react/button';
import { useSelector, useDispatch } from 'react-redux';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchUsersForFilter } from '../../../../redux/actions/userActions';
import { useStockFilters } from '../context/StockFilterContext';
import notify from 'devextreme/ui/notify';
import PropTypes from 'prop-types';
import './HeaderStockFilters.scss';

/**
 * HeaderStockFilters - Compact filter panel for TankStockLayout header
 * Placed in the header on the RIGHT side with a compact, minimal design
 */
const HeaderStockFilters = ({ showUserFilter = false, onApplyFilters }) => {
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
    <div className="header-stock-filters tw-flex tw-flex-col sm:tw-flex-row tw-items-stretch sm:tw-items-center tw-gap-3">
      {/* Filters - stack vertically on mobile, horizontal on desktop */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-flex-1">
        {/* Date Range */}
        <div className="tw-w-full sm:tw-w-auto">
          <DateRangeBox
            startDate={startDate}
            endDate={endDate}
            onValueChanged={(e) => {
              if (e.value && e.value.length === 2) {
                setStartDate(e.value[0]);
                setEndDate(e.value[1]);
              }
            }}
            displayFormat="dd/MM/yyyy"
            showClearButton={false}
            stylingMode="outlined"
          />
        </div>

        {/* Site Filter */}
        <div className="tw-w-full sm:tw-w-auto tw-min-w-[200px]">
          <TagBox
            value={selectedSiteIds}
            onValueChanged={(e) => setSelectedSiteIds(e.value)}
            dataSource={sites}
            displayExpr="name"
            valueExpr="id"
            placeholder="All Sites"
            showClearButton={true}
            searchEnabled={true}
            stylingMode="outlined"
            multiline={false}
            maxDisplayedTags = {3}
          />
        </div>

        {/* Tank Filter */}
        <div className="tw-w-full sm:tw-w-auto tw-min-w-[180px]">
          <TagBox
            value={selectedTankIds}
            onValueChanged={(e) => setSelectedTankIds(e.value)}
            dataSource={filteredTanks}
                        maxDisplayedTags = {3}

            displayExpr="name"
            valueExpr="id"
            placeholder="All Tanks"
            showClearButton={true}
            searchEnabled={true}
            stylingMode="outlined"
            multiline={false}
          />
        </div>

        {/* User Filter (Optional) */}
        {showUserFilter && (
          <div className="tw-w-full sm:tw-w-auto tw-min-w-[180px]">
            <TagBox
              value={selectedUserIds}
              onValueChanged={(e) => setSelectedUserIds(e.value)}
              dataSource={users}
              displayExpr="name"
              valueExpr="id"
              placeholder="All Users"
              showClearButton={true}
              searchEnabled={true}
              stylingMode="outlined"
              multiline={false}
            />
          </div>
        )}
      </div>

      {/* Action Buttons - side by side at bottom on mobile, end on desktop */}
      <div className="tw-flex tw-gap-2 tw-flex-shrink-0">
        <Button
          text="Apply"
          icon="fa-light fa-filter"
          onClick={handleApply}
          stylingMode="contained"
          type="default"
          hint="Apply Filters"
          width="100%"
          className="sm:tw-w-auto"
        />
        <Button
          text="Reset"
          icon="fa-light fa-refresh"
          onClick={handleReset}
          stylingMode="outlined"
          hint="Reset Filters"
          width="100%"
          className="sm:tw-w-auto"
        />
      </div>
    </div>
  );
};

HeaderStockFilters.propTypes = {
  showUserFilter: PropTypes.bool,
  onApplyFilters: PropTypes.func
};

export default HeaderStockFilters;
