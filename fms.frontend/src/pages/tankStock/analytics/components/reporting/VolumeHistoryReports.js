import React, { useState, useCallback, useEffect, useRef } from 'react';
import TankStockReportsService from '../../../../../services/tankStockReportsService';
import PivotGridReport from './PivotGridReport';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import './VolumeHistoryReports.scss';

const MAX_DAILY_RANGE_DAYS = 7;

const calculateDayDifference = (start, end) => {
  if (!start || !end) return 0;

  const normalizedStart = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const normalizedEnd = new Date(end.getFullYear(), end.getMonth(), end.getDate());

  const diffMs = normalizedEnd.getTime() - normalizedStart.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1; // inclusive day count
};

const VolumeHistoryReports = () => {
  const [pivotData, setPivotData] = useState(null);
  const [loading, setLoading] = useState(false);

  // Filter states
  const [startDate, setStartDate] = useState(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)); // 30 days ago
  const [endDate, setEndDate] = useState(new Date());
  const [groupByPeriod, setGroupByPeriod] = useState('month');

  const periodOptions = [
    { value: 'day', text: 'Daily' },
    { value: 'week', text: 'Weekly' },
    { value: 'month', text: 'Monthly' },
    { value: 'quarter', text: 'Quarterly' }
  ];

  const initialFetchDone = useRef(false);

  const loadReportData = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    setLoading(true);
    if (process.env.NODE_ENV === 'development') {
      console.log('[VolumeHistoryReports] loadReportData called with params:', {
        startDate,
        endDate,
        groupByPeriod
      });
    }
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const params = {
        startDate: startDateStr,
        endDate: endDateStr,
        groupByPeriod
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
  }, [startDate, endDate, groupByPeriod]);

  // Apply filters and load data
  const handleApplyFilters = useCallback(() => {
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

    if (groupByPeriod === 'day') {
      const diff = calculateDayDifference(startDate, endDate);
      if (diff > MAX_DAILY_RANGE_DAYS) {
        notify({
          message: `Daily analysis supports a maximum range of ${MAX_DAILY_RANGE_DAYS} days. Adjust the dates to continue.`,
          type: 'warning',
          displayTime: 4000
        });
        return;
      }
    }

    loadReportData();
  }, [startDate, endDate, groupByPeriod, loadReportData]);

  // Initialize component and load data once
  useEffect(() => {
    if (!initialFetchDone.current) {
      initialFetchDone.current = true;
      loadReportData();
    }
  }, [loadReportData]);

  // Enforce constraints when filters change
  useEffect(() => {
    if (!startDate || !endDate) {
      return;
    }

    if (startDate > endDate) {
      setEndDate(startDate);
      notify({
        message: 'End date adjusted to match the selected start date.',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    if (groupByPeriod === 'day') {
      const diff = calculateDayDifference(startDate, endDate);
      if (diff > MAX_DAILY_RANGE_DAYS) {
        const adjustedStart = new Date(endDate);
        adjustedStart.setDate(adjustedStart.getDate() - (MAX_DAILY_RANGE_DAYS - 1));
        setStartDate(adjustedStart);
        notify({
          message: `Daily analysis supports a maximum range of ${MAX_DAILY_RANGE_DAYS} days. Dates adjusted; click Apply Filters to refresh.`,
          type: 'warning',
          displayTime: 4000
        });
      }
    }
  }, [groupByPeriod, startDate, endDate]);

  return (
    <div className="volume-history-reports tw-p-4 tw-flex tw-flex-col" style={{ height: '100%', minHeight: 0 }}>
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
              showClearButton={false}
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
              showClearButton={false}
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
      </div>

      {/* Loading Indicator */}
      {loading && (
        <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
          <LoadIndicator visible={true} />
          <span className="tw-ml-3 tw-text-gray-600">Loading pivot data...</span>
        </div>
      )}

      {/* Pivot Grid Only */}
      <div className="tw-space-y-6 tw-flex tw-flex-col" style={{ flex: 1, minHeight: 0 }}>
        <PivotGridReport
          key="pivot-grid-report"
          data={pivotData}
          reportType={groupByPeriod.charAt(0).toUpperCase() + groupByPeriod.slice(1)}
          loading={loading}
          visible={!loading && !!pivotData}
          minHeight={500}
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
