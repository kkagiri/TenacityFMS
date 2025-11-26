import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Summary, TotalItem, Format } from 'devextreme-react/data-grid';
import { Chart } from 'devextreme-react/chart';
import { Series, ArgumentAxis, ValueAxis, Legend, Tooltip, CommonSeriesSettings } from 'devextreme-react/chart';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { fetchDeliveryCycleAnalysis } from '../../../redux/actions/tankStockAction';
import { useStockFilters } from '../shared/context/StockFilterContext';
import HelpPopup from '../../../components/HelpPopup/HelpPopup';
import DeliveryCycleAnalysisHelp from './DeliveryCycleAnalysisHelp';
import './DeliveryCycleAnalysis.scss';

const DeliveryCycleAnalysis = () => {
  const dispatch = useDispatch();
  const { selectedTankIds, singleTankId: selectedTank, startDate, endDate } = useStockFilters();
  const { deliveryCycleAnalysis, deliveryCycleLoading, error } = useSelector(state => state.tankStock);

  const [analysisType, setAnalysisType] = useState('BetweenDeliveries');
  const [chartView, setChartView] = useState('consumption');
  const [dispensingMode, setDispensingMode] = useState('sensor');
  const [lastFetchParams, setLastFetchParams] = useState(null);

  const analysisTypeOptions = [
    { value: 'BetweenDeliveries', label: 'Between Deliveries' },
    { value: 'Monthly', label: 'Monthly' },
    { value: 'UntilNextDelivery', label: 'Until Next Delivery' }
  ];

  const dispensingModeOptions = [
    { value: 'sensor', label: 'Sensor Data (Automated)' },
    { value: 'manual', label: 'Manual Entries (Aggregate)' },
    { value: 'combined', label: 'Combined (Auto + Manual Fill)' }
  ];

  const chartViewOptions = [
    { value: 'consumption', label: 'Consumption Rates' },
    { value: 'stock', label: 'Stock Levels' },
    { value: 'variance', label: 'Variance Trends' }
  ];

  const handleFetchData = useCallback(async () => {
    // Support both single and multi-tank analysis
    const effectiveTankIds = selectedTankIds?.length > 0 ? selectedTankIds : (selectedTank ? [selectedTank] : []);

    if (!effectiveTankIds.length || !startDate || !endDate) {
      notify('Please select tank(s) and date range', 'warning', 3000);
      return;
    }

    const isSingleTank = effectiveTankIds.length === 1;
    const tankIdsStr = effectiveTankIds.join(',');

    // Debug logging
    console.log('🔍 Delivery Cycle Analysis - Fetch Parameters:', {
      tankIds: effectiveTankIds,
      tankCount: effectiveTankIds.length,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      analysisType,
      dispensingMode
    });

    // Check if we've already fetched this combination (caching)
    const cacheKey = `${tankIdsStr}-${startDate?.toISOString()}-${endDate?.toISOString()}-${analysisType}-${dispensingMode}`;
    if (lastFetchParams === cacheKey) {
      console.log('📦 Using cached data for:', cacheKey);
      return; // Already have this data
    }

    // Convert dispensing mode to boolean flags
    const useManualDispensing = dispensingMode === 'manual';
    const useCombinedDispensing = dispensingMode === 'combined';

    console.log('🚀 Fetching delivery cycle analysis with flags:', {
      useManualDispensing,
      useCombinedDispensing,
      tankCount: effectiveTankIds.length
    });

    // Pass single tank ID or array of tank IDs
    const tankParam = isSingleTank ? effectiveTankIds[0] : effectiveTankIds;

    const result = await dispatch(fetchDeliveryCycleAnalysis(
      tankParam,
      startDate,
      endDate,
      analysisType,
      useManualDispensing,
      useCombinedDispensing
    ));

    if (result.success) {
      setLastFetchParams(cacheKey);
      const tankMsg = isSingleTank ? 'tank' : `${effectiveTankIds.length} tanks`;
      console.log(`✅ Delivery cycle analysis loaded successfully for ${tankMsg}`);
      notify(`Analysis completed for ${tankMsg}`, 'success', 3000);
    } else {
      console.error('❌ Failed to load delivery cycle analysis:', result.message);
      notify(result.message || 'Failed to fetch delivery cycle analysis', 'error', 4000);
    }
  }, [dispatch, selectedTankIds, selectedTank, startDate, endDate, analysisType, dispensingMode, lastFetchParams]);

  // Note: Auto-fetch removed - user must click Apply button to trigger analysis

  // Custom cell render for consumption rates with color coding
  const renderConsumptionRate = (cellData) => {
    if (cellData.value == null) return '-';

    const value = cellData.value;
    let className = 'consumption-rate';

    // Color code based on summary average
    if (deliveryCycleAnalysis?.summary?.averageConsumptionPerDay) {
      const avg = deliveryCycleAnalysis.summary.averageConsumptionPerDay;
      if (value > avg * 1.2) className += ' high';
      else if (value < avg * 0.8) className += ' low';
      else className += ' normal';
    }

    return <span className={className}>{value.toFixed(2)} L/day</span>;
  };

  // Custom cell render for days to stockout with warning
  const renderDaysToStockout = (cellData) => {
    if (cellData.value == null || cellData.value === 0) return '-';

    const days = cellData.value;
    let className = 'days-to-stockout';

    if (days <= 3) className += ' critical';
    else if (days <= 7) className += ' warning';
    else className += ' safe';

    return (
      <span className={className}>
        {days} days
        {days <= 3 && <i className="fa-light fa-triangle-exclamation tw-ml-2"></i>}
      </span>
    );
  };

  // Render chart based on selected view
  const renderChart = () => {
    if (!deliveryCycleAnalysis?.cycles || deliveryCycleAnalysis.cycles.length === 0) {
      return <div className="tw-text-center tw-text-gray-500 tw-p-8">No data available for chart</div>;
    }

    const cycles = deliveryCycleAnalysis.cycles;

    switch (chartView) {
      case 'consumption':
        return (
          <Chart dataSource={cycles} title="Consumption Rate Trends">
            <CommonSeriesSettings argumentField="cycleNumber" type="line" />
            <Series
              valueField="consumptionPerDay"
              name="Daily Consumption"
              color="#1f77b4"
            />
            <Series
              valueField="consumptionPerMonth"
              name="Monthly Consumption (Projected)"
              color="#ff7f0e"
            />
            {deliveryCycleAnalysis.summary?.averageConsumptionPerDay && (
              <Series
                valueField={() => deliveryCycleAnalysis.summary.averageConsumptionPerDay}
                name="Average Daily"
                type="line"
                dashStyle="dash"
                color="#2ca02c"
              />
            )}
            <ArgumentAxis title="Cycle Number" />
            <ValueAxis title="Volume (Liters)" />
            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
            <Tooltip enabled={true} />
          </Chart>
        );

      case 'stock':
        return (
          <Chart dataSource={cycles} title="Stock Level Trends">
            <CommonSeriesSettings argumentField="cycleNumber" />
            <Series
              valueField="openingStock"
              name="Opening Stock"
              type="line"
              color="#1f77b4"
            />
            <Series
              valueField="closingStock"
              name="Closing Stock"
              type="line"
              color="#ff7f0e"
            />
            <Series
              valueField="averageStockLevel"
              name="Average Stock"
              type="line"
              dashStyle="dash"
              color="#2ca02c"
            />
            <ArgumentAxis title="Cycle Number" />
            <ValueAxis title="Volume (Liters)" />
            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
            <Tooltip enabled={true} />
          </Chart>
        );

      case 'variance':
        return (
          <Chart dataSource={cycles} title="Variance Trends">
            <CommonSeriesSettings argumentField="cycleNumber" type="bar" />
            <Series
              valueField="variance"
              name="Variance"
              color={(point) => point.data.variance >= 0 ? '#2ca02c' : '#d62728'}
            />
            <ArgumentAxis title="Cycle Number" />
            <ValueAxis title="Variance (Liters)" />
            <Legend verticalAlignment="bottom" horizontalAlignment="center" />
            <Tooltip enabled={true} />
          </Chart>
        );

      default:
        return null;
    }
  };

  return (
    <div className="delivery-cycle-analysis">
      {/* Header with controls */}
      <div className="tw-mb-4">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
          <h3 className="tw-text-lg tw-font-semibold tw-m-0">
            <i className="fa-light fa-chart-line tw-mr-2"></i>
            Delivery Cycle Analysis
          </h3>
          <HelpPopup content={<DeliveryCycleAnalysisHelp />} displayMode="inline" />
        </div>

        {/* Controls Panel */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-4 tw-border tw-border-gray-200">
          <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-3">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                <i className="fa-light fa-layer-group tw-mr-2"></i>
                Analysis Type
              </label>
              <SelectBox
                dataSource={analysisTypeOptions}
                value={analysisType}
                onValueChanged={(e) => setAnalysisType(e.value)}
                displayExpr="label"
                valueExpr="value"
                width={200}
                placeholder="Analysis Type"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
                <i className="fa-light fa-database tw-mr-2"></i>
                Dispensing Data Source
              </label>
              <SelectBox
                dataSource={dispensingModeOptions}
                value={dispensingMode}
                onValueChanged={(e) => setDispensingMode(e.value)}
                displayExpr="label"
                valueExpr="value"
                width={250}
                placeholder="Dispensing Data Source"
              />
            </div>

            <div>
              <Button
                text="Apply Analysis"
                icon="fa-light fa-chart-line"
                type="default"
                stylingMode="contained"
                onClick={handleFetchData}
                disabled={deliveryCycleLoading || !selectedTank || !startDate || !endDate}
                hint="Click to load delivery cycle analysis"
              />
            </div>
          </div>

          {/* Info message */}
          <div className="tw-mt-3 tw-text-sm tw-text-gray-600 tw-flex tw-items-start tw-gap-2">
            <i className="fa-light fa-info-circle tw-mt-0.5"></i>
            <span>
              Use the filters at the top of the page to set date range and select a tank, then choose your analysis type and click "Apply Analysis".
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {deliveryCycleAnalysis?.summary && (
        <div className="summary-cards tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mb-6">
          <div className="summary-card">
            <div className="summary-label">Total Cycles</div>
            <div className="summary-value">{deliveryCycleAnalysis.summary.totalCycles || 0}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Avg Daily Consumption</div>
            <div className="summary-value">
              {deliveryCycleAnalysis.summary.averageConsumptionPerDay?.toFixed(2) || 0} L
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Avg Monthly Consumption</div>
            <div className="summary-value">
              {deliveryCycleAnalysis.summary.averageConsumptionPerMonth?.toFixed(2) || 0} L
            </div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Avg Variance</div>
            <div className={`summary-value ${deliveryCycleAnalysis.summary.averageVariance >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
              {deliveryCycleAnalysis.summary.averageVariance?.toFixed(2) || 0} L
            </div>
          </div>
        </div>
      )}

      {/* Chart View Selector and Chart */}
      <div className="tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
          <h4 className="tw-text-md tw-font-semibold tw-m-0">Trend Visualization</h4>
          <SelectBox
            dataSource={chartViewOptions}
            value={chartView}
            onValueChanged={(e) => setChartView(e.value)}
            displayExpr="label"
            valueExpr="value"
            width={250}
          />
        </div>
        <div className="chart-container">
          {deliveryCycleLoading ? (
            <div className="tw-text-center tw-p-8">
              <i className="fa-light fa-spinner fa-spin tw-text-3xl tw-text-blue-500"></i>
              <p className="tw-mt-3 tw-text-gray-600">Loading analysis...</p>
            </div>
          ) : deliveryCycleAnalysis?.cycles?.length > 0 ? (
            <div key={`chart-${chartView}-${selectedTank}-${lastFetchParams}`}>
              {renderChart()}
            </div>
          ) : (
            <div className="tw-text-center tw-text-gray-500 tw-p-8">No data available for chart</div>
          )}
        </div>
      </div>

      {/* Data Grid */}
      <div className="data-grid-container">
        <h4 className="tw-text-md tw-font-semibold tw-mb-3">Cycle Details</h4>
        <DataGrid
          dataSource={deliveryCycleAnalysis?.cycles || []}
          showBorders={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          wordWrapEnabled={false}
          allowColumnReordering={true}
          allowColumnResizing={true}
          noDataText="No cycles available. Adjust filters or date range."
        >
          <Column
            dataField="cycleNumber"
            caption="#"
            width={60}
            alignment="center"
          />
          <Column
            dataField="cycleStartDate"
            caption="Start Date"
            dataType="date"
            format="MMM dd, yyyy"
            width={120}
          />
          <Column
            dataField="cycleEndDate"
            caption="End Date"
            dataType="date"
            format="MMM dd, yyyy"
            width={120}
          />
          <Column
            dataField="daysInCycle"
            caption="Days"
            width={80}
            alignment="center"
          />
          <Column
            dataField="openingStock"
            caption="Opening Stock"
            dataType="number"
            format="#,##0.00"
            width={130}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="deliveryReceived"
            caption="Delivery"
            dataType="number"
            format="#,##0.00"
            width={110}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="stockAfterDelivery"
            caption="After Delivery"
            dataType="number"
            format="#,##0.00"
            width={130}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="totalDispensing"
            caption="Dispensing"
            dataType="number"
            format="#,##0.00"
            width={120}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="closingStock"
            caption="Closing Stock"
            dataType="number"
            format="#,##0.00"
            width={130}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="consumptionPerDay"
            caption="Daily Rate"
            dataType="number"
            width={110}
            cellRender={renderConsumptionRate}
          />
          <Column
            dataField="consumptionPerMonth"
            caption="Monthly Rate"
            dataType="number"
            format="#,##0.00"
            width={130}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="actualMonthlyConsumption"
            caption="Actual Monthly"
            dataType="number"
            format="#,##0.00"
            width={130}
            visible={analysisType === 'Monthly'}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="variance"
            caption="Variance"
            dataType="number"
            format="#,##0.00"
            width={110}
            cellRender={(cellData) => (
              <span className={cellData.value >= 0 ? 'tw-text-green-600' : 'tw-text-red-600'}>
                {cellData.value?.toFixed(2) || 0}
              </span>
            )}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>
          <Column
            dataField="daysToStockout"
            caption="Days to Stockout"
            dataType="number"
            width={140}
            cellRender={renderDaysToStockout}
          />
          <Column
            dataField="stockTurnoverRate"
            caption="Turnover Rate"
            dataType="number"
            format="#,##0.00"
            width={130}
          >
            <Format type="fixedPoint" precision={2} />
          </Column>

          <Summary>
            <TotalItem
              column="daysInCycle"
              summaryType="sum"
              displayFormat="Total: {0}"
            />
            <TotalItem
              column="totalDispensing"
              summaryType="sum"
              valueFormat="#,##0.00"
              displayFormat="Total: {0} L"
            />
            <TotalItem
              column="consumptionPerDay"
              summaryType="avg"
              valueFormat="#,##0.00"
              displayFormat="Avg: {0} L/day"
            />
            <TotalItem
              column="variance"
              summaryType="avg"
              valueFormat="#,##0.00"
              displayFormat="Avg: {0} L"
            />
          </Summary>
        </DataGrid>
      </div>

      {/* Error Display */}
      {error && (
        <div className="tw-mt-4 tw-p-4 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded">
          <i className="fa-light fa-circle-exclamation tw-mr-2 tw-text-red-600"></i>
          <span className="tw-text-red-800">{error}</span>
        </div>
      )}
    </div>
  );
};

export default DeliveryCycleAnalysis;
