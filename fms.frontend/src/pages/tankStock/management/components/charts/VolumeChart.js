import React, { useMemo } from 'react';
import Chart, { Series, CommonSeriesSettings, ValueAxis, ArgumentAxis, Label, Legend, Tooltip } from 'devextreme-react/chart';
import { typeColor, typeName } from './shared';

const VolumeChart = ({ data }) => {
  // Filter to movement transactions
  const filtered = useMemo(() => (data || []).filter(i => [2,3,4,6,7].includes(i.changeReason)), [data]);
  try { console.log('[VolumeChart] input:', data?.length, 'filtered:', filtered.length); } catch {}

  // series per type
  const seriesByType = useMemo(() => {
    const map = new Map();
    filtered.forEach(item => {
      const key = item.changeReason;
      if (!map.has(key)) map.set(key, { name: typeName(key), color: typeColor(key), data: [] });
      map.get(key).data.push({ ...item, timestamp: new Date(item.timestamp || item.recordedDateTime), value: item.volumeChange });
    });
  const arr = Array.from(map.values());
    try { console.log('[VolumeChart] seriesByType:', arr.map(s=>({name:s.name, count:s.data.length}))); } catch {}
  return arr;
  }, [filtered]);

  const ranges = useMemo(() => {
    let vMin = Number.POSITIVE_INFINITY;
    let vMax = Number.NEGATIVE_INFINITY;
    let tMin = null;
    let tMax = null;
    (seriesByType || []).forEach(s => {
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
  }, [seriesByType]);

  const customizeTooltip = (info) => {
    const d = info.point.data;
    const sign = (d.volumeChange||0) > 0 ? '+' : '';
    return { html: `<div><b>${d.site} - Tank ${d.tankId}</b><br/>${typeName(d.changeReason)}: ${sign}${(d.volumeChange||0).toFixed(2)} L<br/>After: ${(d.newVolume||0).toFixed(2)} L</div>` };
  };

  if (!seriesByType || seriesByType.length === 0) {
    return <div className="tw-text-gray-500 tw-italic">No data to display</div>;
  }

  return (
    <Chart height={500} width="100%" title="Volume Changes">
  <CommonSeriesSettings argumentField="timestamp" type="bar" valueField="value" barPadding={0.3} />
      {seriesByType.map(s => (
        <Series key={s.name} dataSource={s.data} name={s.name} color={s.color} />
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

export default VolumeChart;
