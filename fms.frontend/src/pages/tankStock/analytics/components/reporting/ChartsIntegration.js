import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Chart, Series, CommonSeriesSettings, Legend, Tooltip, Export } from 'devextreme-react/chart';
import { SelectBox } from 'devextreme-react/select-box';
import { Button } from 'devextreme-react/button';
import './ChartsIntegration.scss';

const ChartsIntegration = ({ data, reportType, visible = true }) => {
  const [chartData, setChartData] = useState([]);
  const [chartType, setChartType] = useState('bar');
  const [groupBy, setGroupBy] = useState('changeReason');
  const [canRenderDevExtreme, setCanRenderDevExtreme] = useState(false);

  const chartTypeOptions = [
    { value: 'bar', text: 'Bar Chart' },
    { value: 'line', text: 'Line Chart' },
    { value: 'area', text: 'Area Chart' },
    { value: 'pie', text: 'Pie Chart' }
  ];

  const groupByOptions = [
    { value: 'changeReason', text: 'By Change Reason' },
    { value: 'site', text: 'By Site' },
    { value: 'timePeriod', text: 'By Time Period' },
    { value: 'tank', text: 'By Tank' }
  ];

  // Delay DevExtreme initialization until after React's commit phase
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRenderDevExtreme(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Process data for charts
  useEffect(() => {
    if (data?.data) {
      const processedData = processDataForChart(data.data, groupBy);
      setChartData(processedData);
    }
  }, [data, groupBy]);

  const processDataForChart = (rawData, groupField) => {
    if (!rawData?.length) return [];

    let groupedData;

    switch (groupField) {
      case 'changeReason':
        groupedData = rawData.reduce((acc, item) => {
          const key = item.changeReasonDisplay || 'Unknown';
          if (!acc[key]) acc[key] = 0;
          acc[key] += item.totalVolume || 0;
          return acc;
        }, {});
        break;

      case 'site':
        groupedData = rawData.reduce((acc, item) => {
          const key = item.siteName || 'Unknown';
          if (!acc[key]) acc[key] = 0;
          acc[key] += item.totalVolume || 0;
          return acc;
        }, {});
        break;

      case 'timePeriod':
        groupedData = rawData.reduce((acc, item) => {
          const key = item.timePeriod || 'Unknown';
          if (!acc[key]) acc[key] = 0;
          acc[key] += item.totalVolume || 0;
          return acc;
        }, {});
        break;

      case 'tank':
        groupedData = rawData.reduce((acc, item) => {
          const key = `${item.siteName} - ${item.tankName}` || 'Unknown';
          if (!acc[key]) acc[key] = 0;
          acc[key] += item.totalVolume || 0;
          return acc;
        }, {});
        break;

      default:
        groupedData = {};
    }

    return Object.entries(groupedData).map(([key, value]) => ({
      category: key,
      value: value,
      displayValue: value.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })
    }));
  };

  const getChartTitle = () => {
    const groupByText = groupByOptions.find(opt => opt.value === groupBy)?.text || '';
    return `Tank Volume Analysis ${groupByText} - ${reportType}`;
  };

  const handleExportChart = () => {
    // This would trigger chart export functionality
    console.log('Exporting chart...');
  };

  // Keep component mounted; toggle visibility via CSS to avoid unmount/remount issues

  if (!visible) {
    return (
      <div className="charts-integration tw-bg-white tw-rounded-lg tw-shadow" style={{ display: 'none' }} />
    );
  }

  if (!chartData.length) {
    return (
      <div className="charts-integration tw-bg-white tw-rounded-lg tw-shadow tw-p-8 tw-text-center">
        <i key="no-chart-data-icon" className="fa-light fa-chart-bar tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
        <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
          No Chart Data Available
        </h3>
        <p className="tw-text-gray-500">
          Generate report data to view chart visualizations.
        </p>
      </div>
    );
  }

  return (
  <div className="charts-integration tw-bg-white tw-rounded-lg tw-shadow" style={{ display: visible ? 'block' : 'none' }}>
      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-b">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            Volume History Charts
          </h3>
          <p className="tw-text-sm tw-text-gray-600">
            Visual analysis of tank volume data
          </p>
        </div>

        <div className="tw-flex tw-gap-3">
          <SelectBox
            dataSource={groupByOptions}
            valueExpr="value"
            displayExpr="text"
            value={groupBy}
            onValueChanged={(e) => setGroupBy(e.value)}
            width={150}
          />
          <SelectBox
            dataSource={chartTypeOptions}
            valueExpr="value"
            displayExpr="text"
            value={chartType}
            onValueChanged={(e) => setChartType(e.value)}
            width={120}
          />
          <Button
            icon="fa-light fa-download"
            type="default"
            onClick={handleExportChart}
            hint="Export Chart"
          />
        </div>
      </div>

      {/* Chart */}
      <div className="tw-p-4" style={{ height: '400px' }}>
        {canRenderDevExtreme && (
          <Chart
            dataSource={chartData}
            title={getChartTitle()}
          >
            <CommonSeriesSettings
              argumentField="category"
              valueField="value"
              type={chartType}
              barPadding={0.3}
              color="#1f77b4"
            />

            {chartType === 'pie' ? (
              <Series
                argumentField="category"
                valueField="value"
                type="pie"
              />
            ) : (
              <Series />
            )}

            <Legend
              visible={chartType === 'pie'}
              position="bottom"
            />

            <Tooltip
              enabled={true}
              customizeTooltip={(arg) => ({
                text: `${arg.argumentText}: ${arg.valueText}`
              })}
            />

            <Export enabled={true} />
          </Chart>
        )}
      </div>

      {/* Chart Summary */}
      <div className="tw-p-4 tw-border-t tw-bg-gray-50">
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-4 tw-text-sm">
          <div>
            <span className="tw-text-gray-600">Total Categories:</span>
            <span className="tw-ml-2 tw-font-semibold">
              {chartData.length}
            </span>
          </div>
          <div>
            <span className="tw-text-gray-600">Total Volume:</span>
            <span className="tw-ml-2 tw-font-semibold tw-text-green-600">
              {chartData.reduce((sum, item) => sum + item.value, 0).toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </span>
          </div>
          <div>
            <span className="tw-text-gray-600">Chart Type:</span>
            <span className="tw-ml-2 tw-font-semibold tw-capitalize">
              {chartType}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

ChartsIntegration.propTypes = {
  data: PropTypes.object,
  reportType: PropTypes.string.isRequired,
  visible: PropTypes.bool
};

export default ChartsIntegration;
