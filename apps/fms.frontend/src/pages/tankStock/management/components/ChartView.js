/**
 * File: ChartView.js
 * Purpose: Chart popup for tank volume visualisations (candlestick, OHLC, volume, multi-series).
 * Dependencies: devextreme-react, chart sub-components
 * Last Modified: 2026-02-24
 */
import React, { useMemo, useState, useRef } from 'react';
import { Popup, ScrollView } from 'devextreme-react';
import Button from 'devextreme-react/button';
import CandlestickChart from './charts/CandlestickChart';
import OhlcChart from './charts/OhlcChart';
import VolumeChart from './charts/VolumeChart';
import MultiSeriesLineChart from './charts/MultiSeriesLineChart';
import './ChartView.scss';

const CHART_LABELS = {
  candlestick: 'Candlestick',
  volume: 'Volume',
  'multi-series': 'Multi-Series Line',
  ohlc: 'OHLC',
};

const CHART_HINTS = {
  candlestick:
    'Each candle = one hour. Green = volume up, red = volume down. Wicks show the full high/low range for that period.',
  ohlc:
    'Each bar shows Open, High, Low and Close volumes for one hour. Left tick = open, right tick = close.',
  'multi-series':
    'Each coloured line is one tank or site. Click a legend item to show or hide it.',
  volume:
    'Bar height = absolute volume change per transaction. Negative bars indicate fuel dispensed or transferred out.',
};

/* Small (i) icon with a CSS hover tooltip */
const InfoHint = ({ text }) => {
  const [show, setShow] = useState(false);
  const timerRef = useRef(null);

  const handleEnter = () => {
    clearTimeout(timerRef.current);
    setShow(true);
  };

  const handleLeave = () => {
    timerRef.current = setTimeout(() => setShow(false), 80);
  };

  return (
    <span
      className="chart-info-hint"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <i className="fa-light fa-circle-info" />
      {show && <span className="chart-info-hint__popup">{text}</span>}
    </span>
  );
};

const ChartView = ({
  visible,
  onClose,
  tankVolumeHistory,
  tanks,
  sites,
  currentFilters = {},
  selectedChartType = 'candlestick'
}) => {
  const [chartGroupBy, setChartGroupBy] = useState('tank');

  const baseData = useMemo(() => {
    if (!tankVolumeHistory || tankVolumeHistory.length === 0) return [];
    return tankVolumeHistory
      .map(t => ({
        ...t,
        timestamp: new Date(t.timestamp || t.recordedDateTime),
        newVolume: t.newVolume != null ? Number(t.newVolume) : t.newVolume,
        volumeChange: t.volumeChange != null ? Number(t.volumeChange) : t.volumeChange,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
  }, [tankVolumeHistory]);

  // Build a concise filter summary string
  const filterSummary = useMemo(() => {
    const parts = [];
    if (currentFilters?.startDate && currentFilters?.endDate) {
      parts.push(
        `${new Date(currentFilters.startDate).toLocaleDateString()} – ${new Date(currentFilters.endDate).toLocaleDateString()}`
      );
    }
    if (currentFilters?.siteId) {
      const name = sites?.find(s => s.id === currentFilters.siteId)?.name;
      if (name) parts.push(name);
    }
    if (currentFilters?.tankId) {
      const name = tanks?.find(t => t.id === currentFilters.tankId)?.name;
      if (name) parts.push(name);
    }
    return parts.length > 0 ? parts.join('  ·  ') : 'All data';
  }, [currentFilters, sites, tanks]);

  if (!visible) return null;

  const title = CHART_LABELS[selectedChartType] || 'Chart';

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      showTitle={true}
      title={title}
      width="95%"
      height="90%"
      showCloseButton={true}
      dragEnabled={true}
      resizeEnabled={true}
      className="chart-popup"
    >
      <ScrollView height="100%" showScrollbar="onHover" bounceEnabled={false}>
        <div className="chart-popup__body">
          {/* Toolbar */}
          <div className="chart-popup__toolbar">
            <span className="chart-popup__meta">
              {baseData.length} records  ·  {filterSummary}
              <InfoHint text={CHART_HINTS[selectedChartType] || ''} />
            </span>

            {selectedChartType !== 'volume' && (
              <div className="chart-popup__toggle">
                <span className="chart-popup__toggle-label">Group by</span>
                <Button
                  text="Tank"
                  type={chartGroupBy === 'tank' ? 'default' : 'normal'}
                  stylingMode={chartGroupBy === 'tank' ? 'contained' : 'outlined'}
                  onClick={() => setChartGroupBy('tank')}
                  height={28}
                  focusStateEnabled={false}
                />
                <Button
                  text="Site"
                  type={chartGroupBy === 'site' ? 'default' : 'normal'}
                  stylingMode={chartGroupBy === 'site' ? 'contained' : 'outlined'}
                  onClick={() => setChartGroupBy('site')}
                  height={28}
                  focusStateEnabled={false}
                />
              </div>
            )}
          </div>

          {/* Chart area */}
          <div className="chart-popup__canvas">
            {selectedChartType === 'candlestick' && (
              <CandlestickChart data={baseData} groupBy={chartGroupBy} tanks={tanks} />
            )}
            {selectedChartType === 'ohlc' && (
              <OhlcChart data={baseData} groupBy={chartGroupBy} tanks={tanks} />
            )}
            {selectedChartType === 'volume' && (
              <VolumeChart data={baseData} />
            )}
            {selectedChartType === 'multi-series' && (
              <MultiSeriesLineChart data={baseData} groupBy={chartGroupBy} tanks={tanks} />
            )}
          </div>
        </div>
      </ScrollView>
    </Popup>
  );
};

export default ChartView;
