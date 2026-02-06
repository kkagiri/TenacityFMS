/**
 * File: VehicleComparisonTrendChart.js
 * Purpose: Display trend analysis charts for vehicle consumption comparison
 * Dependencies: react, devextreme-react/chart
 * Last Modified: 2025-11-08
 */

import React, { useMemo, useState } from 'react';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip, CommonSeriesSettings, ZoomAndPan } from 'devextreme-react/chart';
import { SelectBox } from 'devextreme-react/select-box';

const VehicleComparisonTrendChart = ({ data, groupBy }) => {
  const [chartMetric, setChartMetric] = useState('fuelUsed');
  const [chartType, setChartType] = useState('line');

  const metricOptions = [
    { value: 'fuelUsed', text: 'Fuel Used (L)', color: '#3b82f6' },
    { value: 'avgEfficiency', text: 'Avg Efficiency', color: '#10b981' },
    { value: 'fuelLost', text: 'Fuel Lost (L)', color: '#ef4444' },
    { value: 'distance', text: 'Distance (km)', color: '#8b5cf6' },
    { value: 'engineHours', text: 'Engine Hours', color: '#f59e0b' }
  ];

  const chartTypeOptions = [
    { value: 'line', text: 'Line Chart' },
    { value: 'bar', text: 'Bar Chart' },
    { value: 'area', text: 'Area Chart' }
  ];

  // Prepare chart data based on groupBy
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    if (groupBy === 'vehicle') {
      // Group by vehicle - show each vehicle as a series
      const vehicleGroups = {};

      data.forEach(item => {
        const vehicleKey = item.vehicleNo || `Vehicle ${item.vehicleId}`;
        if (!vehicleGroups[vehicleKey]) {
          vehicleGroups[vehicleKey] = [];
        }

        let value = 0;
        switch (chartMetric) {
          case 'fuelUsed':
            value = item.totalFuel || 0;
            break;
          case 'avgEfficiency':
            if (item.isAverageKm && item.totalDistance > 0 && item.totalFuel > 0) {
              value = item.totalDistance / item.totalFuel;
            } else if (!item.isAverageKm && item.engHours > 0 && item.totalFuel > 0) {
              value = item.totalFuel / item.engHours;
            }
            break;
          case 'fuelLost':
            value = item.fuelLost || 0;
            break;
          case 'distance':
            value = item.totalDistance || 0;
            break;
          case 'engineHours':
            value = item.engHours || 0;
            break;
          default:
            value = 0;
        }

        vehicleGroups[vehicleKey].push({
          date: new Date(item.date).toLocaleDateString('en-GB'),
          value: value,
          vehicle: vehicleKey
        });
      });

      // Flatten for multi-series chart
      return Object.entries(vehicleGroups).flatMap(([vehicle, records]) =>
        records.map(r => ({ ...r, vehicle }))
      );

    } else if (groupBy === 'site') {
      // Group by site - show each site as a series
      const siteGroups = {};

      data.forEach(item => {
        const siteKey = item.site || `Site ${item.siteId}`;
        if (!siteGroups[siteKey]) {
          siteGroups[siteKey] = [];
        }

        let value = 0;
        switch (chartMetric) {
          case 'fuelUsed':
            value = item.totalFuel || 0;
            break;
          case 'avgEfficiency':
            if (item.isAverageKm && item.totalDistance > 0 && item.totalFuel > 0) {
              value = item.totalDistance / item.totalFuel;
            } else if (!item.isAverageKm && item.engHours > 0 && item.totalFuel > 0) {
              value = item.totalFuel / item.engHours;
            }
            break;
          case 'fuelLost':
            value = item.fuelLost || 0;
            break;
          case 'distance':
            value = item.totalDistance || 0;
            break;
          case 'engineHours':
            value = item.engHours || 0;
            break;
          default:
            value = 0;
        }

        siteGroups[siteKey].push({
          date: new Date(item.date).toLocaleDateString('en-GB'),
          value: value,
          site: siteKey
        });
      });

      return Object.entries(siteGroups).flatMap(([site, records]) =>
        records.map(r => ({ ...r, site }))
      );

    } else {
      // Group by date - aggregate all vehicles/sites per date
      const dateGroups = {};

      data.forEach(item => {
        const dateKey = new Date(item.date).toLocaleDateString('en-GB');
        if (!dateGroups[dateKey]) {
          dateGroups[dateKey] = [];
        }
        dateGroups[dateKey].push(item);
      });

      return Object.keys(dateGroups).map(date => {
        const records = dateGroups[date];
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
    }
  }, [data, chartMetric, groupBy]);

  const selectedMetric = metricOptions.find(m => m.value === chartMetric);

  return (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-mb-6">
      <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-mb-4 tw-gap-4">
        <div className="tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-chart-line tw-text-blue-600"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            Trend Analysis
          </h3>
        </div>
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
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-font-medium tw-text-gray-700">Chart Type:</label>
            <SelectBox
              items={chartTypeOptions}
              value={chartType}
              displayExpr="text"
              valueExpr="value"
              onValueChanged={(e) => setChartType(e.value)}
              width={150}
            />
          </div>
        </div>
      </div>

      {chartData.length > 0 ? (
        <Chart
          dataSource={chartData}
          height={400}
        >
          <ArgumentAxis
            valueMarginsEnabled={false}
            discreteAxisDivisionMode="crossLabels"
          />
          <ValueAxis
            title={selectedMetric?.text || ''}
          />
          <ZoomAndPan argumentAxis="both" />
          <CommonSeriesSettings
            argumentField="date"
            type={chartType}
          />

          {groupBy === 'vehicle' ? (
            // Multiple series - one per vehicle
            [...new Set(chartData.map(d => d.vehicle))].map((vehicle, index) => (
              <Series
                key={vehicle}
                valueField="value"
                name={vehicle}
                filter={['vehicle', '=', vehicle]}
                color={`hsl(${(index * 360) / [...new Set(chartData.map(d => d.vehicle))].length}, 70%, 50%)`}
              />
            ))
          ) : groupBy === 'site' ? (
            // Multiple series - one per site
            [...new Set(chartData.map(d => d.site))].map((site, index) => (
              <Series
                key={site}
                valueField="value"
                name={site}
                filter={['site', '=', site]}
                color={`hsl(${(index * 360) / [...new Set(chartData.map(d => d.site))].length}, 70%, 50%)`}
              />
            ))
          ) : (
            // Single series for date grouping
            <Series
              valueField="value"
              name={selectedMetric?.text || ''}
              color={selectedMetric?.color || '#3b82f6'}
            />
          )}

          <Legend
            visible={groupBy !== 'date'}
            verticalAlignment="bottom"
            horizontalAlignment="center"
          />
          <Tooltip
            enabled={true}
            customizeTooltip={(pointInfo) => {
              return {
                text: `${pointInfo.argumentText}<br/>${pointInfo.seriesName}: ${typeof pointInfo.value === 'number' ? pointInfo.value.toFixed(2) : pointInfo.value}`
              };
            }}
          />
        </Chart>
      ) : (
        <div className="tw-flex tw-items-center tw-justify-center tw-h-96 tw-text-gray-500">
          <div className="tw-text-center">
            <i className="fa-light fa-chart-line tw-text-6xl tw-mb-3"></i>
            <p className="tw-text-lg tw-font-medium">No data available for chart</p>
            <p className="tw-text-sm tw-mt-1">Apply filters to view trend analysis</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default React.memo(VehicleComparisonTrendChart);
