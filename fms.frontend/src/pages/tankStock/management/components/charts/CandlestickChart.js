/**
 * File: CandlestickChart.js
 * Purpose: Candlestick chart showing tank level OHLC patterns using
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
  Reduction,
  SeriesTemplate,
  Format,
} from 'devextreme-react/chart';
import { groupByTime, siteColorByName, tankColor } from './shared';

const CandlestickChart = ({ data, groupBy = 'tank', tanks }) => {
  // Build flat OHLC data with seriesName for SeriesTemplate
  const { flatData, colorMap } = useMemo(() => {
    // Bucket raw data by series key (tank or site)
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

      // Enhance zero-range candlesticks for visibility
      grouped.forEach(point => {
        const range = point.high - point.low;
        let enhanced = point;
        if (range === 0) {
          const v = Number(point.close);
          const spread = Math.max(v * 0.01, 10);
          enhanced = {
            ...point,
            high: v + spread,
            low: v - spread,
            open: v - spread / 2,
            close: v + spread / 2,
          };
        }
        flat.push({ ...enhanced, seriesName });
      });
    });

    try {
      console.log('[CandlestickChart] flat OHLC points:', flat.length, 'series:', Object.keys(colors));
    } catch { /* ignore */ }
    return { flatData: flat, colorMap: colors };
  }, [data, groupBy, tanks]);

  const customizeSeries = useCallback(
    (seriesName) => ({
      color: colorMap[seriesName] || '#6b7280',
      reduction: { color: '#dc2626' },
    }),
    [colorMap]
  );

  const customizeTooltip = useCallback((info) => {
    const d = info.point?.data;
    if (!d) return {};
    const fmt = (v) => (v != null ? Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '–');
    return {
      html: `<div style="padding:4px"><b>${d.seriesName}</b><br/>Open: ${fmt(d.open)} L<br/>High: ${fmt(d.high)} L<br/>Low: ${fmt(d.low)} L<br/>Close: ${fmt(d.close)} L<br/>Volume: ${fmt(d.volume)} L</div>`,
    };
  }, []);

  if (!flatData || flatData.length === 0) {
    return <div className="tw-text-gray-500 tw-italic tw-p-4">No data to display</div>;
  }

  return (
    <Chart dataSource={flatData} height={500}>
      <CommonSeriesSettings
        type="candlestick"
        argumentField="timestamp"
        openValueField="open"
        highValueField="high"
        lowValueField="low"
        closeValueField="close"
      >
        <Reduction color="red" />
      </CommonSeriesSettings>
      <SeriesTemplate nameField="seriesName" customizeSeries={customizeSeries} />
      <ValueAxis>
        <Label>
          <Format type="fixedPoint" precision={0} />
        </Label>
      </ValueAxis>
      <ArgumentAxis argumentType="datetime">
        <Label rotationAngle={45} />
      </ArgumentAxis>
      <Legend visible={true} />
      <Tooltip enabled={true} customizeTooltip={customizeTooltip} />
    </Chart>
  );
};

export default CandlestickChart;
