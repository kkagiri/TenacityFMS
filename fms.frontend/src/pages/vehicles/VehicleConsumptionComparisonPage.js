/**
 * File: VehicleConsumptionComparisonPage.js
 * Purpose: Compare fuel consumption across multiple vehicles with site filtering and trend analysis
 * Dependencies: react, react-redux, devextreme-react components
 * Last Modified: 2025-11-08
 */

import React, { useEffect, useState, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox } from 'devextreme-react/date-box';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { fetchVehicleConsumptionComparison } from '../../redux/actions/vehicleActions';
import { fetchSiteList } from '../../redux/actions/siteActions';
import VehicleComparisonDataGrid from './component/vehiclecomparison/VehicleComparisonDataGrid';
import VehicleComparisonTrendChart from './component/vehiclecomparison/VehicleComparisonTrendChart';
import VehicleComparisonSummary from './component/vehiclecomparison/VehicleComparisonSummary';

const VehicleConsumptionComparisonPage = () => {
  const dispatch = useDispatch();

  // Redux state
  const vehicles = useSelector(state => state.vehicle.vehicles || []);
  const sites = useSelector(state => state.site.sites || []);
  const comparisonData = useSelector(state => state.vehicle.comparisonData || []);
  const isLoading = useSelector(state => state.vehicle.comparisonLoading || false);

  // Filter states
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [dateTo, setDateTo] = useState(new Date());
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [groupBy, setGroupBy] = useState('vehicle'); // vehicle, site, date

  // Load initial data
  useEffect(() => {
    dispatch(fetchSiteList());
  }, [dispatch]);

  // Filter vehicles by selected sites
  const filteredVehicles = useMemo(() => {
    if (!selectedSites || selectedSites.length === 0) {
      return vehicles;
    }
    return vehicles.filter(v => selectedSites.includes(v.siteId));
  }, [vehicles, selectedSites]);

  // Handle apply filter
  const handleApplyFilter = useCallback(() => {
    if (selectedVehicles.length === 0 && selectedSites.length === 0) {
      notify('Please select at least one site or vehicle', 'warning', 3000);
      return;
    }

    const params = {
      dateFrom: dateFrom.toISOString().split('T')[0],
      dateTo: dateTo.toISOString().split('T')[0],
      siteIds: selectedSites,
      vehicleIds: selectedVehicles,
      groupBy: groupBy
    };

    dispatch(fetchVehicleConsumptionComparison(params));
  }, [dispatch, dateFrom, dateTo, selectedSites, selectedVehicles, groupBy]);

  // Auto-load when page first mounts with sites selected
  useEffect(() => {
    if (selectedSites.length > 0) {
      handleApplyFilter();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  const handleRefresh = useCallback(() => {
    handleApplyFilter();
  }, [handleApplyFilter]);

  const handleClearFilters = useCallback(() => {
    setSelectedSites([]);
    setSelectedVehicles([]);
    setDateFrom(new Date(new Date().setDate(new Date().getDate() - 30)));
    setDateTo(new Date());
  }, []);

  const groupByOptions = [
    { value: 'vehicle', text: 'By Vehicle' },
    { value: 'site', text: 'By Site' },
    { value: 'date', text: 'By Date' }
  ];

  return (
    <div className="vehicle-consumption-comparison-page tw-p-6">
      <LoadPanel
        visible={isLoading}
        message="Loading comparison data..."
        shading={true}
        shadingColor="rgba(0,0,0,0.4)"
      />

      {/* Header */}
      <div className="tw-mb-6">
        <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
          <i className="fa-light fa-chart-mixed tw-text-3xl tw-text-blue-600"></i>
          <div>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">
              Vehicle Consumption Comparison
            </h1>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Compare fuel consumption patterns across multiple vehicles and sites
            </p>
          </div>
        </div>
      </div>

      {/* Filters Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-filter tw-text-blue-600"></i>
          Filters
        </h3>

        {/* Date Range */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              From Date
            </label>
            <DateBox
              value={dateFrom}
              onValueChanged={(e) => setDateFrom(e.value)}
              displayFormat="dd/MM/yyyy"
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              To Date
            </label>
            <DateBox
              value={dateTo}
              onValueChanged={(e) => setDateTo(e.value)}
              displayFormat="dd/MM/yyyy"
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Group By
            </label>
            <SelectBox
              items={groupByOptions}
              value={groupBy}
              displayExpr="text"
              valueExpr="value"
              onValueChanged={(e) => setGroupBy(e.value)}
              width="100%"
            />
          </div>
        </div>

        {/* Site and Vehicle Selection */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Select Sites
            </label>
            <TagBox
              dataSource={sites}
              displayExpr="name"
              valueExpr="siteId"
              value={selectedSites}
              onValueChanged={(e) => setSelectedSites(e.value || [])}
              placeholder="Select sites to filter vehicles..."
              searchEnabled={true}
              showSelectionControls={true}
              applyValueMode="useButtons"
              width="100%"
            />
            {selectedSites.length > 0 && (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                {selectedSites.length} site{selectedSites.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Select Vehicles (Optional)
            </label>
            <TagBox
              dataSource={filteredVehicles}
              displayExpr="hyoungNo"
              valueExpr="vehicleId"
              value={selectedVehicles}
              onValueChanged={(e) => setSelectedVehicles(e.value || [])}
              placeholder={selectedSites.length === 0 ? "Select sites first..." : "Select specific vehicles..."}
              searchEnabled={true}
              showSelectionControls={true}
              applyValueMode="useButtons"
              disabled={selectedSites.length === 0}
              width="100%"
            />
            {selectedVehicles.length > 0 && (
              <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                {selectedVehicles.length} vehicle{selectedVehicles.length !== 1 ? 's' : ''} selected
              </p>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <Button
            text="Apply Filter"
            icon="fa-light fa-filter"
            onClick={handleApplyFilter}
            type="default"
            stylingMode="contained"
            disabled={isLoading || (selectedSites.length === 0 && selectedVehicles.length === 0)}
          />
          <Button
            text="Refresh"
            icon="fa-light fa-sync"
            onClick={handleRefresh}
            type="normal"
            stylingMode="outlined"
            disabled={isLoading}
          />
          <Button
            text="Clear Filters"
            icon="fa-light fa-eraser"
            onClick={handleClearFilters}
            type="normal"
            stylingMode="text"
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Summary Section */}
      {comparisonData.length > 0 && (
        <VehicleComparisonSummary data={comparisonData} groupBy={groupBy} />
      )}

      {/* Trend Chart */}
      {comparisonData.length > 0 && (
        <VehicleComparisonTrendChart data={comparisonData} groupBy={groupBy} />
      )}

      {/* Comparison Data Grid */}
      {comparisonData.length > 0 ? (
        <VehicleComparisonDataGrid data={comparisonData} groupBy={groupBy} />
      ) : (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-12 tw-text-center">
          <i className="fa-light fa-chart-mixed tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-2">
            No Data Available
          </h3>
          <p className="tw-text-sm tw-text-gray-500 tw-mb-4">
            Select sites or vehicles and apply filters to view comparison data
          </p>
        </div>
      )}
    </div>
  );
};

export default VehicleConsumptionComparisonPage;
