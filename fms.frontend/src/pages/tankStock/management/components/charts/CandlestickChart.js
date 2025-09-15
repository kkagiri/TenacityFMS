import React, { useMemo } from 'react';
import Chart, {
  Series,
  CommonSeriesSettings,
  ValueAxis,
  ArgumentAxis,
  Label,
  Legend,
  Tooltip,
  Reduction,
  Format
} from 'devextreme-react/chart';
import { groupByTime, siteColor, tankColor } from './shared';

const CandlestickChart = ({ data, groupBy = 'site', tanks }) => {
  const seriesMap = useMemo(() => {
    const seriesBuckets = new Map();
    (data || []).forEach(item => {
      const key = groupBy === 'tank' ? `tank-${item.tankId}` : `site-${item.siteId}`;
      if (!seriesBuckets.has(key)) seriesBuckets.set(key, []);
      seriesBuckets.get(key).push(item);
    });
    const arr = Array.from(seriesBuckets.entries()).map(([key, items]) => {
      const grouped = groupByTime(items, 'hourly');
      // Add artificial spread for zero-range candlesticks
      const enhancedData = grouped.map(point => {
        const { high, low, close } = point;
        const range = high - low;
        if (range === 0) {
          // Add 1% artificial spread around the value
          const value = Number(close);
          const spread = Math.max(value * 0.01, 10); // At least 10L spread
          return {
            ...point,
            high: value + spread,
            low: value - spread,
            open: value - spread/2,
            close: value + spread/2
          };
        }
        return point;
      });

      const sample = items[0] || {};
      const name = groupBy === 'tank' ? (tanks?.find(t=>t.id===sample.tankId)?.name || `Tank ${sample.tankId}`) : sample.site;
      const color = groupBy === 'tank' ? tankColor(sample.tankId) : siteColor(sample.siteId);
      return { key, name, color, data: enhancedData, originalData: grouped };
    });
    try { console.log('[CandlestickChart] series count:', arr.length, 'details:', arr.map(s => ({ name: s.name, dataCount: s.data.length, firstPoint: s.data[0] }))); } catch {}
    return arr;
  }, [data, groupBy, tanks]);

  const ranges = useMemo(() => {
    let vMin = Number.POSITIVE_INFINITY;
    let vMax = Number.NEGATIVE_INFINITY;
    let tMin = null;
    let tMax = null;
    (seriesMap || []).forEach(s => {
      (s.data || []).forEach(p => {
        const vals = [p.open, p.high, p.low, p.close].map(Number).filter(Number.isFinite);
        vals.forEach(v => {
          if (v < vMin) vMin = v;
          if (v > vMax) vMax = v;
        });
        const ts = p.timestamp instanceof Date ? p.timestamp : new Date(p.timestamp);
        if (!tMin || ts < tMin) tMin = ts;
        if (!tMax || ts > tMax) tMax = ts;
      });
    });
    if (!Number.isFinite(vMin) || !Number.isFinite(vMax)) return null;
    const pad = (vMax - vMin) * 0.02 || 1;
    return { vStart: vMin - pad, vEnd: vMax + pad, tStart: tMin, tEnd: tMax };
  }, [seriesMap]);

  const customizeTooltip = (info) => {
    const data = info.point.data;
    return {
      text: `<b>${data.site || 'Tank'} ${data.tankId ? `- Tank ${data.tankId}` : ''}</b><br/>
Open: ${data.open?.toFixed(2)} L<br/>
High: ${data.high?.toFixed(2)} L<br/>
Low: ${data.low?.toFixed(2)} L<br/>
Close: ${data.close?.toFixed(2)} L<br/>
Volume: ${data.volume?.toFixed(2)} L`
    };
  };

  if (!seriesMap || seriesMap.length === 0 || seriesMap.every(s=>!s.data?.length)) {
    return <div className="tw-text-gray-500 tw-italic">No data to display</div>;
  }

  return (
    <Chart height={500} width="100%" title="Candlestick Chart">
      <CommonSeriesSettings
        argumentField="timestamp"
        type="candlestick"
        openValueField="open"
        highValueField="high"
        lowValueField="low"
        closeValueField="close"
      />
      {seriesMap.map((s, idx) => (
        <Series
          key={s.key || `${s.name}-${idx}`}
          dataSource={s.data}
          name={s.name}
          color={s.color}
        >
          <Reduction color="red" />
        </Series>
      ))}
      <ValueAxis visualRange={ranges ? { startValue: ranges.vStart, endValue: ranges.vEnd } : undefined}>
        <Label>
          <Format type="fixedPoint" precision={0} />
        </Label>
      </ValueAxis>
      <ArgumentAxis
        argumentType="datetime"
        visualRange={ranges ? { startValue: ranges.tStart, endValue: ranges.tEnd } : undefined}
      >
        <Label
          customizeText={(e) => new Date(e.value).toLocaleString()}
          rotationAngle={45}
        />
      </ArgumentAxis>
      <Legend visible={true} />
      <Tooltip enabled={true} customizeTooltip={customizeTooltip} />
    </Chart>
  );
};

export default CandlestickChart;
