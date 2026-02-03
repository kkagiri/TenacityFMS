/**
 * File: HeaderStockFilters.js
 * Purpose: Compact header filters for tank stock pages with quick date range shortcuts.
 * Dependencies: react, devextreme-react, react-redux, StockFilterContext, redux actions.
 * Last Modified: 2026-02-03
 *
 * Key Functions/Components:
 * - HeaderStockFilters: Renders date/site/tank/user filters and apply/reset actions.
 * - handleQuickDateRange: Applies preset ranges such as Today, Yesterday, Last 7D, Last 30D.
 */
import React, { useCallback, useEffect, useMemo } from "react";
import DateRangeBox from "devextreme-react/date-range-box";
import { TagBox } from "devextreme-react/tag-box";
import { Button } from "devextreme-react/button";
import { useSelector, useDispatch } from "react-redux";
import { fetchSiteList } from "../../../../redux/actions/siteActions";
import { fetchTanks } from "../../../../redux/actions/tankActions";
import { fetchUsersForFilter } from "../../../../redux/actions/userActions";
import { useStockFilters } from "../context/StockFilterContext";
import notify from "devextreme/ui/notify";
import PropTypes from "prop-types";
import "./HeaderStockFilters.scss";

const QUICK_DATE_RANGES = [
  { key: "today", label: "Today" },
  { key: "yesterday", label: "Yesterday" },
  { key: "last7", label: "Last 7D" },
  { key: "last30", label: "Last 30D" },
];

const toDateKey = (date) => {
  const value = new Date(date);
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${value.getFullYear()}-${month}-${day}`;
};

const toStartOfDay = (date) => {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
};

const toEndOfDay = (date) => {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
};

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
    resetFilters,
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
    return tanks.filter((tank) => selectedSiteIds.includes(tank.siteId));
  }, [tanks, selectedSiteIds]);

  // Clear tank selection when site selection changes
  useEffect(() => {
    if (!selectedSiteIds || !selectedTankIds) return;

    if (selectedSiteIds.length > 0 && selectedTankIds.length > 0) {
      const validTankIds = selectedTankIds.filter((tankId) =>
        filteredTanks.some((tank) => tank.id === tankId)
      );
      if (validTankIds.length !== selectedTankIds.length) {
        setSelectedTankIds(validTankIds);
      }
    }
  }, [selectedSiteIds, selectedTankIds, filteredTanks, setSelectedTankIds]);

  const handleQuickDateRange = useCallback(
    (rangeKey) => {
      const baseDate = new Date();
      let rangeStart = new Date(baseDate);
      let rangeEnd = new Date(baseDate);

      switch (rangeKey) {
        case "today":
          break;
        case "yesterday":
          rangeStart.setDate(rangeStart.getDate() - 1);
          rangeEnd.setDate(rangeEnd.getDate() - 1);
          break;
        case "last7":
          rangeStart.setDate(rangeStart.getDate() - 6);
          break;
        case "last30":
          rangeStart.setDate(rangeStart.getDate() - 29);
          break;
        default:
          return;
      }

      setStartDate(toStartOfDay(rangeStart));
      setEndDate(toEndOfDay(rangeEnd));
    },
    [setStartDate, setEndDate]
  );

  const activeQuickDateRange = useMemo(() => {
    if (!startDate || !endDate) return "";

    const today = new Date();
    const todayKey = toDateKey(today);
    const startKey = toDateKey(startDate);
    const endKey = toDateKey(endDate);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = toDateKey(yesterday);

    if (startKey === todayKey && endKey === todayKey) return "today";
    if (startKey === yesterdayKey && endKey === yesterdayKey) return "yesterday";

    const last7Start = new Date(today);
    last7Start.setDate(last7Start.getDate() - 6);
    if (startKey === toDateKey(last7Start) && endKey === todayKey) return "last7";

    const last30Start = new Date(today);
    last30Start.setDate(last30Start.getDate() - 29);
    if (startKey === toDateKey(last30Start) && endKey === todayKey) return "last30";

    return "";
  }, [startDate, endDate]);

  const handleApply = () => {
    if (!startDate || !endDate) {
      notify({
        message: "Please select both start and end dates",
        type: "warning",
        displayTime: 3000,
      });
      return;
    }

    if (startDate > endDate) {
      notify({
        message: "Start date cannot be greater than end date.",
        type: "warning",
        displayTime: 3000,
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
              // Only process if we have both valid dates
              if (e.value && e.value.length === 2 && e.value[0] && e.value[1]) {
                // Ensure both values are valid Date objects
                const startVal = new Date(e.value[0]);
                const endVal = new Date(e.value[1]);

                // Check if dates are valid (not NaN)
                if (!isNaN(startVal.getTime()) && !isNaN(endVal.getTime())) {
                  // Set start date to beginning of day (00:00:00.000)
                  setStartDate(toStartOfDay(startVal));

                  // Set end date to end of day (23:59:59.999)
                  setEndDate(toEndOfDay(endVal));
                }
              }
            }}
            displayFormat="dd/MM/yyyy"
            showClearButton={false}
            stylingMode="outlined"
          />
          <div className="tw-mt-1 tw-flex tw-flex-wrap tw-gap-1">
            {QUICK_DATE_RANGES.map((range) => (
              <button
                key={range.key}
                type="button"
                onClick={() => handleQuickDateRange(range.key)}
                className={`tw-rounded tw-border tw-px-2 tw-py-1 tw-text-[11px] tw-leading-none tw-transition-colors ${
                  activeQuickDateRange === range.key
                    ? "tw-border-blue-600 tw-bg-blue-600 tw-text-white"
                    : "tw-border-gray-300 tw-bg-white tw-text-gray-600 hover:tw-bg-gray-50"
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
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
            maxDisplayedTags={3}
          />
        </div>

        {/* Tank Filter */}
        <div className="tw-w-full sm:tw-w-auto tw-min-w-[180px]">
          <TagBox
            value={selectedTankIds}
            onValueChanged={(e) => setSelectedTankIds(e.value)}
            dataSource={filteredTanks}
            maxDisplayedTags={3}
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
  onApplyFilters: PropTypes.func,
};

export default HeaderStockFilters;
