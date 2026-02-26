/**
 * File: VolumeChart.js
 * Purpose: Volume bar chart showing dispensing/movement activity by transaction type
 *          using DevExtreme Chart with SeriesTemplate for reliable multi-series rendering.
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
import { typeColor, typeName } from './shared';

const VolumeChart = ({ data }) => {
  // Build flat data filtered to movement transactions with seriesName per type
  const { flatData, colorMap } = useMemo(() => {
    const flat = [];
    const colors = {};
    (data || [])
      .filter(i => [2, 3, 4, 6, 7].includes(i.changeReason))
      .forEach(item => {
        const seriesName = typeName(item.changeReason);
        colors[seriesName] = typeColor(item.changeReason);
        flat.push({
          ...item,
          timestamp: new Date(item.timestamp || item.recordedDateTime),
          value: item.volumeChange,
          seriesName,
        });
      });

    try {
      console.log('[VolumeChart] input:', data?.length, 'filtered:', flat.length, 'types:', Object.keys(colors));
    } catch { /* ignore */ }
    return { flatData: flat, colorMap: colors };
  }, [data]);

  const customizeSeries = useCallback(
    (seriesName) => ({ color: colorMap[seriesName] || '#6b7280' }),
    [colorMap]
  );

  const customizeTooltip = useCallback((info) => {
    const d = info.point?.data;
    if (!d) return {};
    const sign = (d.volumeChange || 0) > 0 ? '+' : '';
    return {
      html: `<div style="padding:4px"><b>${d.site || 'Unknown'} – Tank ${d.tankId}</b><br/>${d.seriesName}: ${sign}${(d.volumeChange || 0).toFixed(2)} L<br/>After: ${(d.newVolume || 0).toFixed(2)} L</div>`,
    };
  }, []);

  if (!flatData || flatData.length === 0) {
    return <div className="tw-text-gray-500 tw-italic tw-p-4">No data to display</div>;
  }

  return (
    <Chart dataSource={flatData} height={500}>
      <CommonSeriesSettings type="bar" argumentField="timestamp" valueField="value" barPadding={0.3} />
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

export default VolumeChart;
