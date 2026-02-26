/**
 * File: MultiSeriesLineChart.js
 * Purpose: Multi-series line chart showing tank/site volumes over time using
 *          DevExtreme Chart with SeriesTemplate for reliable multi-series rendering.
 * Dependencies: devextreme-react/chart, shared chart utilities
 * Last Modified: 2026-02-24
 */
import React, { useMemo, useCallback } from 'react';
import Chart, {
  CommonSeriesSettings,
  ValueAxis,
  ArgumentAxis,
  Label,
  Legend,
  Tooltip,
  SeriesTemplate,
  Point,
} from 'devextreme-react/chart';
import { siteColorByName, tankColor } from './shared';

const MultiSeriesLineChart = ({ data, groupBy = 'tank', tanks }) => {
  // Build a single flat data array with seriesName – DevExtreme SeriesTemplate
  // auto-creates one line per unique seriesName value from the chart-level dataSource.
  const { flatData, colorMap } = useMemo(() => {
    const flat = [];
    const colors = {};
    const sorted = (data || []).slice().sort(
      (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    sorted.forEach(item => {
      const seriesName = groupBy === 'site'
        ? (item.site || `Site ${item.siteId || 'Unknown'}`)
        : (tanks?.find(t => t.id === item.tankId)?.name || item.tankName || `Tank ${item.tankId}`);

      if (!colors[seriesName]) {
        colors[seriesName] = groupBy === 'site'
          ? siteColorByName(item.site)
          : tankColor(item.tankId);
      }

      flat.push({
        ...item,
        timestamp: new Date(item.timestamp || item.recordedDateTime),
        value: Number(item.newVolume),
        seriesName,
      });
    });

    try {
      console.log('[MultiSeriesLineChart] flat points:', flat.length, 'series:', Object.keys(colors));
    } catch { /* ignore */ }
    return { flatData: flat, colorMap: colors };
  }, [data, groupBy, tanks]);

  const customizeSeries = useCallback(
    (seriesName) => ({ color: colorMap[seriesName] || '#6b7280' }),
    [colorMap]
  );

  const customizeTooltip = useCallback((info) => {
    const d = info.point?.data;
    if (!d) return {};
    return {
      html: `<div style="padding:4px"><b>${d.seriesName}</b><br/>Volume: ${(d.value || 0).toLocaleString(undefined, { maximumFractionDigits: 2 })} L<br/>Time: ${new Date(d.timestamp).toLocaleString()}</div>`,
    };
  }, []);

  if (!flatData || flatData.length === 0) {
    return <div className="tw-text-gray-500 tw-italic tw-p-4">No data to display</div>;
  }

  return (
    <Chart dataSource={flatData} height={500}>
      <CommonSeriesSettings type="line" argumentField="timestamp" valueField="value">
        <Point visible={true} size={5} />
      </CommonSeriesSettings>
      <SeriesTemplate nameField="seriesName" customizeSeries={customizeSeries} />
      <ValueAxis>
        <Label format="#,##0 L" />
      </ValueAxis>
      <ArgumentAxis argumentType="datetime">
        <Label rotationAngle={45} />
      </ArgumentAxis>
      <Legend visible={true} />
      <Tooltip enabled={true} customizeTooltip={customizeTooltip} />
    </Chart>
  );
};

export default MultiSeriesLineChart;
