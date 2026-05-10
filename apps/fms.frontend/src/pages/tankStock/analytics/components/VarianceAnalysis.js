import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  Chart,
  Series,
  ArgumentAxis,
  ValueAxis,
  Legend,
  Tooltip,
  Grid,
  Label,
  CommonSeriesSettings,
  Point,
  Font
} from 'devextreme-react/chart';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import ScrollView from 'devextreme-react/scroll-view';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { fetchVarianceAnalysis } from '../../../../redux/actions/tankStockAction';
import { useStockFilters } from '../../shared/context/StockFilterContext';
import HelpPopup from '../../../../components/HelpPopup/HelpPopup';
import VarianceAnalysisHelp from './VarianceAnalysisHelp';
import './VarianceAnalysis.scss';

// Variance Analysis Component
// Shows cumulative variance tracking and related visualizations for tank stock analysis
const VarianceAnalysis = () => {
  const dispatch = useDispatch();
  const tanks = useSelector((state) => state.tank?.tanks || []);
  const varianceLoading = useSelector((state) => state.tankStock?.varianceLoading || false);
  const varianceAnalysis = useSelector((state) => state.tankStock?.varianceAnalysis || null);
  const error = useSelector((state) => state.tankStock?.error);

  const { startDate, endDate, selectedTankIds } = useStockFilters();
  const [selectedTank, setSelectedTank] = useState(null);
  const [dispensingMode, setDispensingMode] = useState('sensor'); // 'sensor', 'manual', 'combined'
  const [lastFetchParams, setLastFetchParams] = useState(null);

  // Dispensing mode options
  const dispensingModeOptions = [
    { value: 'sensor', label: 'Sensor Data (TankVolumeHistory)' },
    { value: 'manual', label: 'Manual Data (TankStock Aggregate)' },
    { value: 'combined', label: 'Combined (Sensor + Manual Gap Fill)' }
  ];

  // Set default tank from context or first tank
  useEffect(() => {
    if (selectedTankIds && selectedTankIds.length > 0) {
      // Use first selected tank from context
      setSelectedTank(selectedTankIds[0]);
    } else if (tanks.length > 0 && !selectedTank) {
      // Fallback to first tank if no selection
      setSelectedTank(tanks[0].id);
    }
  }, [tanks, selectedTankIds, selectedTank]);

  // Fetch variance data
  const handleFetchData = useCallback(async () => {
    if (!selectedTank) {
      notify('Please select a tank', 'warning', 2000);
      return;
    }

    // Check if we've already fetched this combination (caching)
    const cacheKey = `${selectedTank}-${startDate?.toISOString()}-${endDate?.toISOString()}-${dispensingMode}`;
    if (lastFetchParams === cacheKey) {
      return; // Already have this data
    }

    // Convert dispensing mode to boolean flags
    const useManualDispensing = dispensingMode === 'manual';
    const useCombinedDispensing = dispensingMode === 'combined';

    const result = await dispatch(fetchVarianceAnalysis(
      selectedTank,
      startDate,
      endDate,
      useManualDispensing,
      useCombinedDispensing
    ));

    if (result.success) {
      setLastFetchParams(cacheKey);
    } else {
      notify(result.message || 'Failed to load variance analysis', 'error', 3000);
    }
  }, [selectedTank, startDate, endDate, dispensingMode, dispatch, lastFetchParams]);

  // Auto-fetch only when all required data is ready
  useEffect(() => {
    if (selectedTank && startDate && endDate && tanks.length > 0) {
      handleFetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTank, startDate, endDate, dispensingMode, tanks.length]);

  // Show error notification when error changes
  useEffect(() => {
    if (error) {
      notify(error, 'error', 4000);
    }
  }, [error]);

  const chartData = useMemo(() => {
    // Use ONLY API data - no mock data fallback
    if (varianceAnalysis && varianceAnalysis.dailyData && varianceAnalysis.dailyData.length > 0) {
      return varianceAnalysis.dailyData.map(item => ({
        date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        fullDate: new Date(item.date),
        expectedStock: item.expectedStock,
        actualStock: item.actualStock,
        dailyVariance: item.dailyVariance,
        cumulativeVariance: item.cumulativeVariance,
        delivery: item.deliveryVolume,
        dispensing: item.dispensingVolume,
        variancePercent: item.variancePercent
      }));
    }
    return [];
  }, [varianceAnalysis]);

  // Calculate statistics
  const statistics = useMemo(() => {
    if (chartData.length === 0) return null;

    const lastDay = chartData[chartData.length - 1];
    const totalDelivery = chartData.reduce((sum, item) => sum + (item.delivery || 0), 0);
    const totalDispensing = chartData.reduce((sum, item) => sum + (item.dispensing || 0), 0);
    const avgDailyVariance = chartData.reduce((sum, item) => sum + Math.abs(item.dailyVariance || 0), 0) / chartData.length;
    const maxVariance = Math.max(...chartData.map(item => Math.abs(item.cumulativeVariance || 0)));

    return {
      finalCumulativeVariance: lastDay.cumulativeVariance,
      totalDelivery,
      totalDispensing,
      avgDailyVariance,
      maxVariance,
      expectedClosing: lastDay.expectedStock,
      actualClosing: lastDay.actualStock
    };
  }, [chartData]);

  const selectedTankName = useMemo(() => {
    const tank = tanks.find(t => t.id === selectedTank);
    return tank ? tank.name : 'Unknown';
  }, [tanks, selectedTank]);

  // Filter available tanks based on context selection
  const availableTanks = useMemo(() => {
    if (selectedTankIds && selectedTankIds.length > 0) {
      return tanks.filter(t => selectedTankIds.includes(t.id));
    }
    return tanks;
  }, [tanks, selectedTankIds]);

  // Chart customization
  const customizeTooltip = (arg) => {
    return {
      text: `${arg.seriesName}: ${arg.valueText} L`
    };
  };

  const customizeVarianceTooltip = (arg) => {
    return {
      text: `Variance: ${arg.valueText} L\n${arg.argument}`
    };
  };

  return (
    <ScrollView className="variance-analysis" height="100%" showScrollbar="always">
      <div className="tw-p-6">
        {/* Header Section */}
        <div className="tw-mb-6">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-chart-mixed tw-text-blue-600"></i>
                Variance Analysis
              </h2>
              <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
                Track cumulative variance between expected and actual stock levels
              </p>
            </div>

            {/* Help Button */}
            <div>
              <HelpPopup title="Variance Analysis - Help & Documentation">
                <VarianceAnalysisHelp />
              </HelpPopup>
            </div>
          </div>

          {/* Tank Selection & Load Button */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-border tw-border-gray-200">
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-oil-can tw-mr-2"></i>
                  Select Tank for Detailed Analysis
                </label>
                <SelectBox
                  dataSource={availableTanks}
                  displayExpr="name"
                  valueExpr="id"
                  value={selectedTank}
                  onValueChanged={(e) => setSelectedTank(e.value)}
                  searchEnabled={true}
                  placeholder="Select Tank"
                  showClearButton={false}
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-database tw-mr-2"></i>
                  Dispensing Data Source
                </label>
                <SelectBox
                  dataSource={dispensingModeOptions}
                  displayExpr="label"
                  valueExpr="value"
                  value={dispensingMode}
                  onValueChanged={(e) => setDispensingMode(e.value)}
                  placeholder="Select Dispensing Data Source"
                  width={250}
                />
              </div>

              <div className="tw-flex tw-items-end">
                <Button
                  text="Load Analysis"
                  icon="fa-light fa-chart-line"
                  type="default"
                  onClick={handleFetchData}
                  disabled={varianceLoading || !selectedTank}
                  width="100%"
                />
              </div>
            </div>

            {/* Info message */}
            <div className="tw-mt-3 tw-text-sm tw-text-gray-600 tw-flex tw-items-start tw-gap-2">
              <i className="fa-light fa-info-circle tw-mt-0.5"></i>
              <span>
                Use the filters at the top of the page and click "Apply" to set date range and filter tanks. Then select a specific tank below and click "Load Analysis".
              </span>
            </div>
          </div>
        </div>

        {/* Loading Indicator */}
        {varianceLoading && (
          <div className="tw-flex tw-justify-center tw-items-center tw-py-12">
            <LoadIndicator width={'48px'} height={'48px'} visible={true} />
          </div>
        )}

        {/* Statistics Cards */}
        {!varianceLoading && statistics && (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mb-6">
            <div className="tw-bg-gradient-to-br tw-from-blue-500 tw-to-blue-600 tw-rounded-lg tw-shadow-md tw-p-4 tw-text-white">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-blue-100 tw-mb-1">Cumulative Variance</p>
                  <h3 className="tw-text-2xl tw-font-bold">
                    {statistics.finalCumulativeVariance.toFixed(1)} L
                  </h3>
                </div>
                <i className="fa-light fa-chart-line tw-text-4xl tw-text-blue-200"></i>
              </div>
            </div>

            <div className="tw-bg-gradient-to-br tw-from-green-500 tw-to-green-600 tw-rounded-lg tw-shadow-md tw-p-4 tw-text-white">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-green-100 tw-mb-1">Avg Daily Variance</p>
                  <h3 className="tw-text-2xl tw-font-bold">
                    {statistics.avgDailyVariance.toFixed(1)} L
                  </h3>
                </div>
                <i className="fa-light fa-calendar-day tw-text-4xl tw-text-green-200"></i>
              </div>
            </div>

            <div className="tw-bg-gradient-to-br tw-from-orange-500 tw-to-orange-600 tw-rounded-lg tw-shadow-md tw-p-4 tw-text-white">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-orange-100 tw-mb-1">Max Variance</p>
                  <h3 className="tw-text-2xl tw-font-bold">
                    {statistics.maxVariance.toFixed(1)} L
                  </h3>
                </div>
                <i className="fa-light fa-triangle-exclamation tw-text-4xl tw-text-orange-200"></i>
              </div>
            </div>

            <div className="tw-bg-gradient-to-br tw-from-purple-500 tw-to-purple-600 tw-rounded-lg tw-shadow-md tw-p-4 tw-text-white">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-text-purple-100 tw-mb-1">Stock Accuracy</p>
                  <h3 className="tw-text-2xl tw-font-bold">
                    {statistics.expectedClosing > 0
                      ? ((statistics.actualClosing / statistics.expectedClosing) * 100).toFixed(1)
                      : 0}%
                  </h3>
                </div>
                <i className="fa-light fa-percent tw-text-4xl tw-text-purple-200"></i>
              </div>
            </div>
          </div>
        )}

        {/* Main Chart: Expected vs Actual Stock */}
        {!varianceLoading && chartData.length > 0 && (
          <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-6 tw-border tw-border-gray-200">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
              <i className="fa-light fa-chart-area tw-text-blue-600"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                Expected vs Actual Stock - {selectedTankName}
              </h3>
            </div>
            <Chart
              dataSource={chartData}
              height={400}
              customizeTooltip={customizeTooltip}
            >
              <CommonSeriesSettings
                argumentField="date"
                type="spline"
              >
                <Point visible={true} size={8} />
              </CommonSeriesSettings>

              <Series
                valueField="expectedStock"
                name="Expected Stock"
                color="#3B82F6"
                width={3}
              />
              <Series
                valueField="actualStock"
                name="Actual Stock"
                color="#10B981"
                width={3}
              />

              <ArgumentAxis>
                <Label rotationAngle={-45}>
                  <Font size={11} />
                </Label>
                <Grid visible={true} />
              </ArgumentAxis>

              <ValueAxis title="Stock Level (Liters)">
                <Label>
                  <Font size={11} />
                </Label>
                <Grid visible={true} />
              </ValueAxis>

              <Legend
                verticalAlignment="bottom"
                horizontalAlignment="center"
                itemTextPosition="right"
              />

              <Tooltip
                enabled={true}
                shared={true}
                customizeTooltip={customizeTooltip}
              />
            </Chart>
          </div>
        )}

        {/* Cumulative Variance Chart */}
        {!varianceLoading && chartData.length > 0 && (
          <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-mb-6 tw-border tw-border-gray-200">
            <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
              <i className="fa-light fa-chart-line tw-text-red-600"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                Cumulative Variance Tracking
              </h3>
            </div>
            <Chart
              dataSource={chartData}
              height={350}
              customizeTooltip={customizeVarianceTooltip}
            >
              <Series
                valueField="cumulativeVariance"
                name="Cumulative Variance"
                type="area"
                color="#EF4444"
                argumentField="date"
              >
                <Point visible={true} size={6} />
              </Series>

              <ArgumentAxis>
                <Label rotationAngle={-45}>
                  <Font size={11} />
                </Label>
                <Grid visible={true} />
              </ArgumentAxis>

              <ValueAxis title="Variance (Liters)">
                <Label>
                  <Font size={11} />
                </Label>
                <Grid visible={true} />
              </ValueAxis>

              <Legend visible={false} />

              <Tooltip enabled={true} />
            </Chart>
          </div>
        )}

        {/* Daily Variance Bar Chart */}
        {!varianceLoading && chartData.length > 0 && (
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
            {/* Daily Variance */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-border tw-border-gray-200">
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
                <i className="fa-light fa-chart-column tw-text-amber-600"></i>
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                  Daily Variance
                </h3>
              </div>
              <Chart
                dataSource={chartData}
                height={300}
              >
                <Series
                  valueField="dailyVariance"
                  name="Daily Variance"
                  type="bar"
                  color="#F59E0B"
                  argumentField="date"
                />

                <ArgumentAxis>
                  <Label rotationAngle={-45}>
                    <Font size={10} />
                  </Label>
                </ArgumentAxis>

                <ValueAxis title="Variance (Liters)">
                  <Label>
                    <Font size={10} />
                  </Label>
                  <Grid visible={true} />
                </ValueAxis>

                <Legend visible={false} />
                <Tooltip enabled={true} />
              </Chart>
            </div>

            {/* Variance Percentage */}
            <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-6 tw-border tw-border-gray-200">
              <div className="tw-flex tw-items-center tw-gap-2 tw-mb-4">
                <i className="fa-light fa-percent tw-text-indigo-600"></i>
                <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                  Variance Percentage
                </h3>
              </div>
              <Chart
                dataSource={chartData}
                height={300}
              >
                <Series
                  valueField="variancePercent"
                  name="Variance %"
                  type="spline"
                  color="#6366F1"
                  argumentField="date"
                >
                  <Point visible={true} size={5} />
                </Series>

                <ArgumentAxis>
                  <Label rotationAngle={-45}>
                    <Font size={10} />
                  </Label>
                </ArgumentAxis>

                <ValueAxis title="Variance (%)">
                  <Label>
                    <Font size={10} />
                  </Label>
                  <Grid visible={true} />
                </ValueAxis>

                <Legend visible={false} />
                <Tooltip enabled={true} />
              </Chart>
            </div>
          </div>
        )}

        {/* Empty State */}
        {!varianceLoading && chartData.length === 0 && (
          <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-p-12 tw-text-center tw-border tw-border-gray-200">
            <i className="fa-light fa-chart-line tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
            <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
              No Variance Data Available
            </h3>
            <p className="tw-text-gray-500">
              Select a tank and date range, then click "Load Data" to view variance analysis
            </p>
          </div>
        )}
      </div>
    </ScrollView>
  );
};

export default VarianceAnalysis;
