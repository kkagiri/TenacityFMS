import React, { useState, useCallback, useEffect, useMemo } from 'react';
import TankStockReportsService from '../../../../../services/tankStockReportsService';
import PivotGridReport from './PivotGridReport';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import './VolumeHistoryReports.scss';

const VolumeHistoryReports = () => {
  const [pivotData, setPivotData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [selectedSites, setSelectedSites] = useState([]);
  const [selectedTanks, setSelectedTanks] = useState([]);
  const [groupByPeriod, setGroupByPeriod] = useState('month');

  // Options for dropdowns
  const [siteOptions, setSiteOptions] = useState([]);
  const [tankOptions, setTankOptions] = useState([]);

  const periodOptions = [
    { value: 'day', text: 'Daily' },
    { value: 'week', text: 'Weekly' },
    { value: 'month', text: 'Monthly' },
    { value: 'quarter', text: 'Quarterly' }
  ];

  // Memoize filter dependencies to prevent infinite re-renders
  const filterDeps = useMemo(() => ({
    startDate: startDate?.toISOString?.() || null,
    endDate: endDate?.toISOString?.() || null,
    siteIds: selectedSites,
    tankIds: selectedTanks,
    groupByPeriod: groupByPeriod
  }), [
    startDate,
    endDate,
    selectedSites,
    selectedTanks,
    groupByPeriod
  ]);

  const loadReportData = useCallback(async () => {
    setLoading(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('[VolumeHistoryReports] loadReportData called with filterDeps:', filterDeps);
    }
    try {
      const params = {
        startDate: filterDeps.startDate.split('T')[0],
        endDate: filterDeps.endDate.split('T')[0],
        siteIds: filterDeps.siteIds.length > 0 ? filterDeps.siteIds : null,
        tankIds: filterDeps.tankIds.length > 0 ? filterDeps.tankIds : null,
        groupByPeriod: filterDeps.groupByPeriod
      };

      // Load only pivot data
      const pivotResult = await TankStockReportsService.getPivotData(params);

      if (pivotResult.success) {
        setPivotData(pivotResult.data);
        notify({
          message: `Loaded pivot data successfully`,
          type: 'success',
          displayTime: 3000
        });
      } else {
        notify({
          message: `Failed to load pivot data: ${pivotResult.error}`,
          type: 'error',
          displayTime: 5000
        });
      }

    } catch (error) {
      console.error('Error loading pivot data:', error);
      notify({
        message: `Failed to load pivot data: ${error.message}`,
        type: 'error',
        displayTime: 5000
      });
    } finally {
      setLoading(false);
    }
  }, [filterDeps]);

  // Load site and tank options
  const loadFilterOptions = useCallback(async () => {
    try {
      // Load sites
      const sitesResult = await TankStockReportsService.getSites();
      if (sitesResult.success) {
        setSiteOptions(sitesResult.data.map(site => ({
          value: site.id,
          text: site.name
        })));
      }

      // Load tanks
      const tanksResult = await TankStockReportsService.getTanks();
      if (tanksResult.success) {
        setTankOptions(tanksResult.data.map(tank => ({
          value: tank.id,
          text: `${tank.siteName} - ${tank.name}`
        })));
      }
    } catch (error) {
      console.error('Error loading filter options:', error);
    }
  }, []);

  // Apply filters and load data
  const handleApplyFilters = useCallback(() => {
    if (startDate && endDate) {
      loadReportData();
    } else {
      notify({
        message: 'Please select both start and end dates',
        type: 'warning',
        displayTime: 3000
      });
    }
  }, [startDate, endDate, loadReportData]);

  // Initialize component and load data
  useEffect(() => {
    loadFilterOptions();
    loadReportData();
    setIsInitialized(true);
  }, [loadFilterOptions, loadReportData]);

  // Load data when filters change (only after initialization)
  useEffect(() => {
    if (isInitialized && filterDeps.startDate && filterDeps.endDate) {
      loadReportData();
    }
  }, [filterDeps, isInitialized, loadReportData]);

  return (
    <div className="volume-history-reports tw-p-4">
      {/* Header */}
      <div className="tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">
          Tank Volume History - Pivot Grid
        </h2>
        <p className="tw-text-gray-600">
          Interactive pivot table analysis with customizable filters
        </p>
      </div>

      {/* Filters */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-4 tw-mb-6">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-4">
          {/* Date Range */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Start Date
            </label>
            <DateBox
              value={startDate}
              onValueChanged={(e) => setStartDate(e.value)}
              displayFormat="dd/MM/yyyy"
              type="date"
              showClearButton={true}
              width="100%"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              End Date
            </label>
            <DateBox
              value={endDate}
              onValueChanged={(e) => setEndDate(e.value)}
              displayFormat="dd/MM/yyyy"
              type="date"
              showClearButton={true}
              width="100%"
            />
          </div>

          {/* Period Grouping */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Group By Period
            </label>
            <SelectBox
              value={groupByPeriod}
              onValueChanged={(e) => setGroupByPeriod(e.value)}
              dataSource={periodOptions}
              displayExpr="text"
              valueExpr="value"
              width="100%"
            />
          </div>

          {/* Apply Button */}
          <div className="tw-flex tw-items-end">
            <Button
              text="Apply Filters"
              type="default"
              icon="fa-light fa-filter"
              onClick={handleApplyFilters}
              disabled={loading}
              width="100%"
            />
          </div>
        </div>

        {/* Optional Filters Row */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          {/* Sites Filter */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Sites (Optional)
            </label>
            <SelectBox
              value={selectedSites}
              onValueChanged={(e) => setSelectedSites(e.value || [])}
              dataSource={siteOptions}
              displayExpr="text"
              valueExpr="value"
              placeholder="Select sites (all if empty)"
              showClearButton={true}
              searchEnabled={true}
              width="100%"
              // Allow multiple selection
              onSelectionChanged={(e) => setSelectedSites(e.selectedItems?.map(item => item.value) || [])}
            />
          </div>

          {/* Tanks Filter */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Tanks (Optional)
            </label>
            <SelectBox
              value={selectedTanks}
              onValueChanged={(e) => setSelectedTanks(e.value || [])}
              dataSource={tankOptions}
              displayExpr="text"
              valueExpr="value"
              placeholder="Select tanks (all if empty)"
              showClearButton={true}
              searchEnabled={true}
              width="100%"
              // Allow multiple selection
              onSelectionChanged={(e) => setSelectedTanks(e.selectedItems?.map(item => item.value) || [])}
            />
          </div>
        </div>
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
          <LoadIndicator visible={true} />
          <span className="tw-ml-3 tw-text-gray-600">Loading pivot data...</span>
        </div>
      )}

      {/* Pivot Grid Only */}
      <div className="tw-space-y-6">
        <PivotGridReport
          key="pivot-grid-report"
          data={pivotData}
          reportType={groupByPeriod.charAt(0).toUpperCase() + groupByPeriod.slice(1)}
          loading={loading}
          visible={!loading && !!pivotData}
        />
      </div>

      {/* No Data Message */}
      {!loading && !pivotData?.data?.length && (
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-chart-line tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
            No Data Available
          </h3>
          <p className="tw-text-gray-500">
            No pivot data available for the current date range.
          </p>
        </div>
      )}
    </div>
  );
};

export default VolumeHistoryReports;
