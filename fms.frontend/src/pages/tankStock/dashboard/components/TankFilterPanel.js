import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { CheckBox } from 'devextreme-react/check-box';
import { Button } from 'devextreme-react/button';
import './TankFilterPanel.scss';

//Cursor - Tank Filter Panel component for filtering tank data based on anomaly conditions
const TankFilterPanel = ({ onFiltersChange, tankData = [] }) => {
  const [filters, setFilters] = useState({
    belowStockLevel: true,
    negativeFuelLevel: true,
    aboveCapacity: true,
    inactiveTanks: true,
    allTanks: false
  });

  const [isExpanded, setIsExpanded] = useState(false);
  const [filterCounts, setFilterCounts] = useState({
    belowStockLevel: 0,
    negativeFuelLevel: 0,
    aboveCapacity: 0,
    inactiveTanks: 0,
    total: 0
  });

  // Calculate filter counts based on tank data
  useEffect(() => {
    if (!tankData || tankData.length === 0) return;

    const oneMonthAgo = new Date();
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

    const counts = {
      belowStockLevel: 0,
      negativeFuelLevel: 0,
      aboveCapacity: 0,
      inactiveTanks: 0,
      total: tankData.length
    };

    tankData.forEach(tank => {
      // Below stock level (less than 30% capacity)
      const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;
      if (fillPercentage < 30) {
        counts.belowStockLevel++;
      }

      // Negative fuel level
      if (tank.currentStock < 0) {
        counts.negativeFuelLevel++;
      }

      // Above capacity
      if (tank.currentStock > tank.tankVolume) {
        counts.aboveCapacity++;
      }

      // Inactive tanks (not updated for 1 month)
      const lastUpdate = new Date(tank.lastStockUpdate);
      if (lastUpdate < oneMonthAgo) {
        counts.inactiveTanks++;
      }
    });

    setFilterCounts(counts);
  }, [tankData]);

  // Apply filters when filter state changes
  useEffect(() => {
    if (filters.allTanks) {
      onFiltersChange(tankData);
      return;
    }

    const filteredTanks = tankData.filter(tank => {
      const oneMonthAgo = new Date();
      oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

      const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;
      const lastUpdate = new Date(tank.lastStockUpdate);

      // Check each filter condition
      const matchesBelowStock = filters.belowStockLevel && fillPercentage < 30;
      const matchesNegative = filters.negativeFuelLevel && tank.currentStock < 0;
      const matchesAboveCapacity = filters.aboveCapacity && tank.currentStock > tank.tankVolume;
      const matchesInactive = filters.inactiveTanks && lastUpdate < oneMonthAgo;

      // Return true if tank matches any of the enabled filters
      return matchesBelowStock || matchesNegative || matchesAboveCapacity || matchesInactive;
    });

    onFiltersChange(filteredTanks);
  }, [filters, tankData, onFiltersChange]);

  const handleFilterChange = (filterKey, value) => {
    if (filterKey === 'allTanks' && value) {
      // If "All Tanks" is selected, disable other filters
      setFilters({
        belowStockLevel: false,
        negativeFuelLevel: false,
        aboveCapacity: false,
        inactiveTanks: false,
        allTanks: true
      });
    } else {
      // If any specific filter is selected, disable "All Tanks"
      setFilters(prev => ({
        ...prev,
        [filterKey]: value,
        allTanks: false
      }));
    }
  };

  const clearAllFilters = () => {
    setFilters({
      belowStockLevel: false,
      negativeFuelLevel: false,
      aboveCapacity: false,
      inactiveTanks: false,
      allTanks: true
    });
  };

  const selectAnomalyFilters = () => {
    setFilters({
      belowStockLevel: true,
      negativeFuelLevel: true,
      aboveCapacity: true,
      inactiveTanks: true,
      allTanks: false
    });
  };

  const getActiveFiltersCount = () => {
    if (filters.allTanks) return 0;
    return Object.values(filters).filter(Boolean).length;
  };

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-mb-6 tank-filter-panel">
      {/* Filter Panel Header */}
      <div
        className={`tw-flex tw-items-center tw-justify-between tw-p-4 tw-cursor-pointer tw-border-b tw-border-gray-200 filter-header ${isExpanded ? 'expanded' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="tw-flex tw-items-center">
          <i className="fa-light fa-filter tw-mr-2 tw-text-blue-600"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Tank Anomaly Filters</h3>
          {getActiveFiltersCount() > 0 && (
            <span className="tw-ml-2 tw-bg-blue-100 tw-text-blue-800 tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium">
              {getActiveFiltersCount()} active
            </span>
          )}
        </div>
        <div className="tw-flex tw-items-center">
          <span className="tw-text-sm tw-text-gray-500 tw-mr-3">
            {filters.allTanks ? filterCounts.total :
             tankData.filter(tank => {
               const oneMonthAgo = new Date();
               oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

               const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;
               const lastUpdate = new Date(tank.lastStockUpdate);

               const matchesBelowStock = filters.belowStockLevel && fillPercentage < 30;
               const matchesNegative = filters.negativeFuelLevel && tank.currentStock < 0;
               const matchesAboveCapacity = filters.aboveCapacity && tank.currentStock > tank.tankVolume;
               const matchesInactive = filters.inactiveTanks && lastUpdate < oneMonthAgo;

               return matchesBelowStock || matchesNegative || matchesAboveCapacity || matchesInactive;
             }).length
            } tanks shown
          </span>
          <i className={`fa-light ${isExpanded ? 'fa-chevron-up' : 'fa-chevron-down'} tw-text-gray-400`}></i>
        </div>
      </div>

      {/* Filter Panel Content */}
      {isExpanded && (
        <div className="tw-p-4">
          <div className="filter-grid tw-mb-4">
            {/* Below Stock Level Filter */}
            <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg filter-card ${filters.belowStockLevel ? 'active' : ''}`}>
              <div className="tw-flex tw-items-center">
                <CheckBox
                  value={filters.belowStockLevel}
                  onValueChanged={(e) => handleFilterChange('belowStockLevel', e.value)}
                />
                <div className="tw-ml-3">
                  <div className="tw-font-medium tw-text-gray-800">Low Stock Level</div>
                  <div className="tw-text-sm tw-text-gray-600">Below 30% capacity</div>
                </div>
              </div>
              <div className="filter-count-badge warning tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                {filterCounts.belowStockLevel}
              </div>
            </div>

            {/* Negative Fuel Level Filter */}
            <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg filter-card ${filters.negativeFuelLevel ? 'active' : ''}`}>
              <div className="tw-flex tw-items-center">
                <CheckBox
                  value={filters.negativeFuelLevel}
                  onValueChanged={(e) => handleFilterChange('negativeFuelLevel', e.value)}
                />
                <div className="tw-ml-3">
                  <div className="tw-font-medium tw-text-gray-800">Negative Stock</div>
                  <div className="tw-text-sm tw-text-gray-600">Abnormal readings</div>
                </div>
              </div>
              <div className="filter-count-badge critical tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                {filterCounts.negativeFuelLevel}
              </div>
            </div>

            {/* Above Capacity Filter */}
            <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg filter-card ${filters.aboveCapacity ? 'active' : ''}`}>
              <div className="tw-flex tw-items-center">
                <CheckBox
                  value={filters.aboveCapacity}
                  onValueChanged={(e) => handleFilterChange('aboveCapacity', e.value)}
                />
                <div className="tw-ml-3">
                  <div className="tw-font-medium tw-text-gray-800">Over Capacity</div>
                  <div className="tw-text-sm tw-text-gray-600">Stock {'>'}  tank volume</div>
                </div>
              </div>
              <div className="filter-count-badge critical tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                {filterCounts.aboveCapacity}
              </div>
            </div>

            {/* Inactive Tanks Filter */}
            <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg filter-card ${filters.inactiveTanks ? 'active' : ''}`}>
              <div className="tw-flex tw-items-center">
                <CheckBox
                  value={filters.inactiveTanks}
                  onValueChanged={(e) => handleFilterChange('inactiveTanks', e.value)}
                />
                <div className="tw-ml-3">
                  <div className="tw-font-medium tw-text-gray-800">Inactive Tanks</div>
                  <div className="tw-text-sm tw-text-gray-600">Not updated (1+ month)</div>
                </div>
              </div>
              <div className="filter-count-badge tw-bg-gray-100 tw-text-gray-800 tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                {filterCounts.inactiveTanks}
              </div>
            </div>

            {/* All Tanks Filter */}
            <div className={`tw-flex tw-items-center tw-justify-between tw-p-3 tw-border tw-border-gray-200 tw-rounded-lg filter-card ${filters.allTanks ? 'active' : ''}`}>
              <div className="tw-flex tw-items-center">
                <CheckBox
                  value={filters.allTanks}
                  onValueChanged={(e) => handleFilterChange('allTanks', e.value)}
                />
                <div className="tw-ml-3">
                  <div className="tw-font-medium tw-text-gray-800">All Tanks</div>
                  <div className="tw-text-sm tw-text-gray-600">Show all tanks</div>
                </div>
              </div>
              <div className="filter-count-badge info tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-medium">
                {filterCounts.total}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="tw-flex tw-justify-end tw-space-x-3 tw-pt-4 tw-border-t tw-border-gray-200">
            <Button
              text="Show All"
              icon="fa-light fa-eye"
              onClick={clearAllFilters}
              type="default"
              stylingMode="outlined"
            />
            <Button
              text="Show Anomalies Only"
              icon="fa-light fa-exclamation-triangle"
              onClick={selectAnomalyFilters}
              type="default"
              stylingMode="contained"
            />
          </div>
        </div>
      )}
    </div>
  );
};

TankFilterPanel.propTypes = {
  onFiltersChange: PropTypes.func.isRequired,
  tankData: PropTypes.array
};

export default TankFilterPanel;
