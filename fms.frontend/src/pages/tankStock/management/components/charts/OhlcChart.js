import React, { useMemo } from 'react';
import Chart, { Series, CommonSeriesSettings, ValueAxis, ArgumentAxis, Label, Legend, Tooltip } from 'devextreme-react/chart';
import { groupByTime, siteColor, tankColor } from './shared';

const OhlcChart = ({ data, groupBy = 'site', tanks }) => {
  const seriesMap = useMemo(() => {
    const seriesBuckets = new Map();
    (data || []).forEach(item => {
      const key = groupBy === 'tank' ? `tank-${item.tankId}` : `site-${item.siteId}`;
      if (!seriesBuckets.has(key)) seriesBuckets.set(key, []);
      seriesBuckets.get(key).push(item);
    });
    const arr = Array.from(seriesBuckets.entries()).map(([key, items]) => {
      const grouped = groupByTime(items, 'hourly');
      const sample = items[0] || {};
      const name = groupBy === 'tank' ? (tanks?.find(t=>t.id===sample.tankId)?.name || `Tank ${sample.tankId}`) : sample.site;
      const color = groupBy === 'tank' ? tankColor(sample.tankId) : siteColor(sample.siteId);
      return { key, name, color, data: grouped };
    });
    try { console.log('[OhlcChart] series count:', arr.length, 'details:', arr.map(s => ({ name: s.name, dataCount: s.data.length, firstPoint: s.data[0] }))); } catch {}
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
    // add 2% padding
    const pad = (vMax - vMin) * 0.02 || 1;
    return {
      vStart: vMin - pad,
      vEnd: vMax + pad,
      tStart: tMin,
      tEnd: tMax,
    };
  }, [seriesMap]);

  const customizeTooltip = (info) => {
    const d = info.point.data;
    return { html: `<div><b>${d.site} - Tank ${d.tankId}</b><br/>Open: ${d.open?.toFixed(2)} L<br/>High: ${d.high?.toFixed(2)} L<br/>Low: ${d.low?.toFixed(2)} L<br/>Close: ${d.close?.toFixed(2)} L<br/>Vol: ${d.volume?.toFixed(2)} L</div>` };
  };

  if (!seriesMap || seriesMap.length === 0 || seriesMap.every(s=>!s.data?.length)) {
    return <div className="tw-text-gray-500 tw-italic">No data to display</div>;
  }

  return (
    <Chart height={500} width="100%" title="OHLC">
      <CommonSeriesSettings argumentField="timestamp" type="stock" />
      {seriesMap.map((s, idx) => (
        <React.Fragment key={s.key || `${s.name}-${idx}`}>
          <Series type="stock" dataSource={s.data} name={s.name} color={s.color} openValueField="open" highValueField="high" lowValueField="low" closeValueField="close" />
          {/* Fallback scatter for single points */}
          <Series type="scatter" dataSource={s.data} name={`${s.name} Points`} color={s.color} argumentField="timestamp" valueField="close" point={{ visible: true, size: 8, symbol: 'square' }} />
        </React.Fragment>
      ))}
      <ValueAxis visualRange={ranges ? { startValue: ranges.vStart, endValue: ranges.vEnd } : undefined}>
        <Label format="#,##0 L" />
      </ValueAxis>
  <ArgumentAxis argumentType="datetime" visualRange={ranges ? { startValue: ranges.tStart, endValue: ranges.tEnd } : undefined}>
        <Label customizeText={(e)=> new Date(e.value).toLocaleString()} rotationAngle={45} />
      </ArgumentAxis>
      <Legend visible={true} />
      <Tooltip enabled={true} customizeTooltip={customizeTooltip} />
    </Chart>
  );
};

export default OhlcChart;
