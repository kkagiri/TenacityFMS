/**
 * File: ConsumptionTrendChart.js
 * Purpose: Display trend analysis chart for vehicle consumption data
 * Dependencies: react, devextreme-react/chart
 * Last Modified: 2025-10-26
 */

import React, { useMemo, useState } from 'react';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip, CommonSeriesSettings } from 'devextreme-react/chart';
import { SelectBox } from 'devextreme-react/select-box';

const ConsumptionTrendChart = ({ selectedData }) => {
  const [chartMetric, setChartMetric] = useState('fuelUsed');

  const metricOptions = [
    { value: 'fuelUsed', text: 'Fuel Used (L)' },
    { value: 'avgEfficiency', text: 'Avg Efficiency' },
    { value: 'fuelLost', text: 'Fuel Lost (L)' },
    { value: 'distance', text: 'Distance (km)' },
    { value: 'engineHours', text: 'Engine Hours' }
  ];

  // Prepare chart data
  const chartData = useMemo(() => {
    if (!selectedData || selectedData.length === 0) return [];

    // Group by date
    const groupedByDate = selectedData.reduce((acc, item) => {
      const dateKey = new Date(item.date).toLocaleDateString('en-GB');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(item);
      return acc;
    }, {});

    // Calculate aggregated values for each date
    return Object.keys(groupedByDate).map(date => {
      const records = groupedByDate[date];
      let value = 0;

      switch (chartMetric) {
        case 'fuelUsed':
          value = records.reduce((sum, r) => sum + (r.totalFuel || 0), 0);
          break;

        case 'avgEfficiency':
          const validRecords = records.filter(r =>
            r.isAverageKm
              ? (r.totalDistance > 0 && r.totalFuel > 0)
              : (r.engHours > 0 && r.totalFuel > 0)
          );
          if (validRecords.length > 0) {
            const efficiencies = validRecords.map(r =>
              r.isAverageKm
                ? r.totalDistance / r.totalFuel
                : r.totalFuel / r.engHours
            );
            value = efficiencies.reduce((sum, e) => sum + e, 0) / efficiencies.length;
          }
          break;

        case 'fuelLost':
          value = records.reduce((sum, r) => sum + (r.fuelLost || 0), 0);
          break;

        case 'distance':
          value = records.reduce((sum, r) => sum + (r.totalDistance || 0), 0);
          break;

        case 'engineHours':
          value = records.reduce((sum, r) => sum + (r.engHours || 0), 0);
          break;

        default:
          value = 0;
      }

      return {
        date: date,
        value: value
      };
    }).sort((a, b) => {
      const dateA = a.date.split('/').reverse().join('-');
      const dateB = b.date.split('/').reverse().join('-');
      return dateA.localeCompare(dateB);
    });
  }, [selectedData, chartMetric]);

  return (
    <div className="tw-mt-6 tw-bg-white tw-p-4 tw-rounded-lg tw-border tw-border-gray-200">
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-mb-4 tw-gap-4">
        <h4 className="tw-text-md tw-font-semibold tw-text-gray-800">Trend Analysis</h4>
        <div className="tw-flex tw-flex-col md:tw-flex-row tw-gap-3">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">Metric:</label>
            <SelectBox
              items={metricOptions}
              value={chartMetric}
              displayExpr="text"
              valueExpr="value"
              onValueChanged={(e) => setChartMetric(e.value)}
              width={180}
            />
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <Chart
          dataSource={chartData}
          height={300}
        >
          <ArgumentAxis
            valueMarginsEnabled={false}
            discreteAxisDivisionMode="crossLabels"
          />
          <ValueAxis
            title={metricOptions.find(m => m.value === chartMetric)?.text || ''}
          />
          <CommonSeriesSettings
            argumentField="date"
            type="line"
          />
          <Series
            valueField="value"
            name={metricOptions.find(m => m.value === chartMetric)?.text || ''}
            color="#3b82f6"
          />
          <Legend visible={false} />
          <Tooltip
            enabled={true}
            customizeTooltip={(pointInfo) => {
              return {
                text: `${pointInfo.argumentText}<br/>${pointInfo.seriesName}: ${pointInfo.valueText}`
              };
            }}
          />
        </Chart>
      ) : (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-64 tw-text-gray-500">
          <div className="tw-text-center">
            <i className="fa-light fa-chart-line tw-text-4xl tw-mb-2"></i>
            <p>No data available for chart</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(ConsumptionTrendChart, (prevProps, nextProps) => {
  // Only re-render if selectedData reference changes
  return prevProps.selectedData === nextProps.selectedData;
});
