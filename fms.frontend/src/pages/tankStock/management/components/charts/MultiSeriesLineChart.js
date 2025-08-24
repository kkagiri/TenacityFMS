import React, { useMemo } from 'react';
import Chart, { Series, CommonSeriesSettings, ValueAxis, ArgumentAxis, Label, Legend, Tooltip } from 'devextreme-react/chart';
import { siteColor, tankColor } from './shared';

const MultiSeriesLineChart = ({ data, groupBy = 'tank', tanks }) => {
  const sorted = useMemo(() => (data || []).slice().sort((a,b) => new Date(a.timestamp || a.recordedDateTime) - new Date(b.timestamp || b.recordedDateTime)), [data]);

  const seriesMap = useMemo(() => {
    const map = new Map();
    sorted.forEach(item => {
      const key = groupBy === 'site' ? `site-${item.siteId}` : `tank-${item.tankId}`;
      const name = groupBy === 'site' ? item.site : (tanks?.find(t=>t.id===item.tankId)?.name || `Tank ${item.tankId}`);
      const color = groupBy === 'site' ? siteColor(item.siteId) : tankColor(item.tankId);
      if (!map.has(key)) map.set(key, { name, color, data: [] });
      map.get(key).data.push({ ...item, timestamp: new Date(item.timestamp || item.recordedDateTime), value: item.newVolume });
    });
  const arr = Array.from(map.values());
  try { console.log('[MultiSeriesLineChart] series:', arr.map(s=>({name:s.name, count:s.data.length}))); } catch {}
  return arr;
  }, [sorted, groupBy, tanks]);

  const ranges = useMemo(() => {
    let vMin = Number.POSITIVE_INFINITY;
    let vMax = Number.NEGATIVE_INFINITY;
    let tMin = null;
    let tMax = null;
    (seriesMap || []).forEach(s => {
      (s.data || []).forEach(p => {
        const v = Number(p.value);
        if (Number.isFinite(v)) {
          if (v < vMin) vMin = v;
          if (v > vMax) vMax = v;
        }
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
    const d = info.point.data;
    return { html: `<div><b>${d.site} - Tank ${d.tankId}</b><br/>Volume: ${(d.newVolume||0).toFixed(2)} L</div>` };
  };

  if (!seriesMap || seriesMap.length === 0) {
    return <div className="tw-text-gray-500 tw-italic">No data to display</div>;
  }

  return (
    <Chart height={500} width="100%" title="Multi-Series Line">
      <CommonSeriesSettings argumentField="timestamp" type="line" valueField="value" />
      {seriesMap.map(s => (
        <Series key={s.name} dataSource={s.data} name={s.name} color={s.color} width={2.5} point={{ visible: true, size: 5 }} />
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

export default MultiSeriesLineChart;
