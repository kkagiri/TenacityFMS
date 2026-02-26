/**
 * File: OhlcChart.js
 * Purpose: OHLC (stock) chart showing tank level open-high-low-close using
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
} from 'devextreme-react/chart';
import { groupByTime, siteColorByName, tankColor } from './shared';

const OhlcChart = ({ data, groupBy = 'tank', tanks }) => {
  // Build flat OHLC data with seriesName for SeriesTemplate
  const { flatData, colorMap } = useMemo(() => {
    const buckets = new Map();
    (data || []).forEach(item => {
      const seriesName = groupBy === 'tank'
        ? (tanks?.find(t => t.id === item.tankId)?.name || item.tankName || `Tank ${item.tankId}`)
        : (item.site || `Site ${item.siteId || 'Unknown'}`);
      if (!buckets.has(seriesName)) buckets.set(seriesName, { items: [], sample: item });
      buckets.get(seriesName).items.push(item);
    });

    const flat = [];
    const colors = {};

    buckets.forEach(({ items, sample }, seriesName) => {
      colors[seriesName] = groupBy === 'tank'
        ? tankColor(sample.tankId)
        : siteColorByName(sample.site);

      const grouped = groupByTime(items, 'hourly');
      grouped.forEach(point => {
        flat.push({ ...point, seriesName });
      });
    });

    try {
      console.log('[OhlcChart] flat OHLC points:', flat.length, 'series:', Object.keys(colors));
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
    const fmt = (v) => (v != null ? Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '–');
    return {
      html: `<div style="padding:4px"><b>${d.seriesName}</b><br/>Open: ${fmt(d.open)} L<br/>High: ${fmt(d.high)} L<br/>Low: ${fmt(d.low)} L<br/>Close: ${fmt(d.close)} L<br/>Vol: ${fmt(d.volume)} L</div>`,
    };
  }, []);

  if (!flatData || flatData.length === 0) {
    return <div className="tw-text-gray-500 tw-italic tw-p-4">No data to display</div>;
  }

  return (
    <Chart dataSource={flatData} height={500}>
      <CommonSeriesSettings
        type="stock"
        argumentField="timestamp"
        openValueField="open"
        highValueField="high"
        lowValueField="low"
        closeValueField="close"
      />
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

export default OhlcChart;
