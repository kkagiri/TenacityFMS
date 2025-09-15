import React, { useMemo, useCallback } from 'react';
import { Popup, ScrollView } from 'devextreme-react';
import CandlestickChart from './charts/CandlestickChart';
import OhlcChart from './charts/OhlcChart';
import VolumeChart from './charts/VolumeChart';
import MultiSeriesLineChart from './charts/MultiSeriesLineChart';
import './ChartView.scss';

const ChartView = ({
  visible,
  onClose,
  tankVolumeHistory,
  tanks,
  sites,
  currentFilters = {},
  selectedChartType = 'candlestick'
}) => {
  // Base data: normalized timestamp and sorted
  const baseData = useMemo(() => {
    if (!tankVolumeHistory || tankVolumeHistory.length === 0) return [];
    const out = tankVolumeHistory
      .map(t => ({
        ...t,
        timestamp: new Date(t.timestamp || t.recordedDateTime),
        newVolume: t.newVolume != null ? Number(t.newVolume) : t.newVolume,
        volumeChange: t.volumeChange != null ? Number(t.volumeChange) : t.volumeChange,
      }))
      .sort((a, b) => a.timestamp - b.timestamp);
    try { console.log('[ChartView] baseData size:', out.length, 'first:', out[0]); } catch {}
  return out;
  }, [tankVolumeHistory]);

  // Get chart title and description based on selected chart type
  const getChartTitle = useCallback(() => {
    switch (selectedChartType) {
      case 'candlestick':
        return '📈 Candlestick Chart - Tank Levels Like Stock Prices';
      case 'volume':
        return '📊 Volume Chart - Dispensing Activity Analysis';
      case 'multi-series':
        return '🎯 Multi-Series Line - Multiple Tanks/Sites Tracking';
      case 'ohlc':
        return '📉 OHLC Bars - Open, High, Low, Close by Time Period';
      default:
        return 'Tank Volume Changes Over Time';
    }
  }, [selectedChartType]);

  const getChartDescription = useCallback(() => {
    switch (selectedChartType) {
      case 'candlestick':
        return 'Shows tank level patterns over time with opening/closing volumes, similar to stock price charts. Grouped by hour to show volume fluctuations.';
      case 'volume':
        return 'Displays dispensing activity by transaction type. Focus on volume changes to identify fuel consumption patterns and operational activity.';
      case 'multi-series':
        return 'Tracks multiple tanks and sites simultaneously with separate colored lines. Perfect for comparing performance across different locations.';
      case 'ohlc':
        return 'Open-High-Low-Close bars for each time period. Shows the complete range of tank levels during each hour with opening and closing positions.';
      default:
        return 'Standard tank volume tracking over time.';
    }
  }, [selectedChartType]);

  // No local chart state needed; child components handle specifics

  // Local color/type helpers moved to dedicated chart components

  // Tooltip customization is handled by each chart component

  // Remove redundant hook and use processed data instead

  if (!visible) {
    return null;
  }

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      showTitle={true}
      title={getChartTitle()}
      width="95%"
      height="85%"
      showCloseButton={true}
      dragEnabled={true}
      resizeEnabled={false}
      className="chart-popup"
    >
      <ScrollView
        height="100%"
        showScrollbar="always"
        bounceEnabled={false}
      >
        <div className="tw-p-4">
          {/* Chart Type Description */}
          <div className="chart-type-info tw-mb-4 tw-p-4 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">

            <p className="tw-text-sm tw-text-blue-600 tw-leading-relaxed">
              {getChartDescription()}
            </p>
          </div>

          {/* Chart Controls */}
      <div className="chart-controls tw-mb-4 tw-flex tw-items-center tw-gap-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
            {/* Data summary */}
            <div className="tw-flex tw-items-center tw-gap-4 tw-text-xs tw-text-gray-600">
              <span className="tw-font-medium">Data:</span>
              <span className="tw-px-2 tw-py-1 tw-rounded tw-bg-white tw-border tw-border-gray-200">
        {baseData.length} transactions
              </span>
            </div>

            {/* Instructions */}
            <div className="tw-text-xs tw-text-blue-600 tw-italic">
              💡 Hover over points to see transaction details
            </div>
          </div>

      <div className="chart-info-panel tw-mb-4">
            <div className="tw-flex tw-flex-wrap tw-items-center tw-gap-4 tw-text-sm">
              <span className="tw-flex tw-items-center tw-font-medium tw-text-gray-700">
                <i className="fa-light fa-chart-bar tw-mr-2 tw-text-blue-600"></i>
                <strong>{tankVolumeHistory?.length || 0}</strong> transactions
              </span>

              {/* Show data range info */}
        {currentFilters?.startDate && currentFilters?.endDate && (
                <span className="tw-flex tw-items-center tw-text-gray-600">
                  <i className="fa-light fa-calendar tw-mr-2 tw-text-green-600"></i>
          {new Date(currentFilters.startDate).toLocaleDateString()} - {new Date(currentFilters.endDate).toLocaleDateString()}
                </span>
              )}

        {currentFilters?.siteId ? (
                <span className="tw-flex tw-items-center tw-text-gray-600">
                  <i className="fa-light fa-map-marker tw-mr-2 tw-text-purple-600"></i>
                  Site: {sites?.find(s => s.id === currentFilters.siteId)?.name || 'Unknown'}
                </span>
              ) : (
                <span className="tw-flex tw-items-center tw-text-gray-600">
                  <i className="fa-light fa-globe tw-mr-2 tw-text-purple-600"></i>
                  All Sites
                </span>
              )}
        {currentFilters?.tankId && (
                <span className="tw-flex tw-items-center tw-text-gray-600">
                  <i className="fa-light fa-oil-can tw-mr-2 tw-text-orange-600"></i>
                  Tank: {tanks?.find(t => t.id === currentFilters.tankId)?.name || 'Unknown'}
                </span>
              )}
            </div>
          </div>

          {/* Tiny debug info to ensure data reached the chart */}
          {process.env.NODE_ENV !== 'production' && baseData?.length > 0 && (
            <div className="tw-text-xs tw-text-gray-500 tw-mb-3">
              Debug sample: {baseData.slice(0, 2).map(d => `${d.tankId}@${new Date(d.timestamp).toLocaleTimeString()}=${d.newVolume}`).join(' | ')}
            </div>
          )}

          <div className="tw-mb-2">
            {selectedChartType === 'candlestick' && (
              <CandlestickChart data={baseData} groupBy="site" tanks={tanks} />
            )}
            {selectedChartType === 'ohlc' && (
              <OhlcChart data={baseData} groupBy="site" tanks={tanks} />
            )}
            {selectedChartType === 'volume' && (
              <VolumeChart data={baseData} />
            )}
            {selectedChartType === 'multi-series' && (
              <MultiSeriesLineChart data={baseData} groupBy="tank" tanks={tanks} />
            )}
          </div>

          <div className="chart-guide tw-mt-4">
            <div className="tw-flex tw-items-center tw-mb-3">
              <i className="fa-light fa-lightbulb tw-mr-2 tw-text-blue-600"></i>
              <strong className="tw-text-gray-800">Chart Guide - {selectedChartType.charAt(0).toUpperCase() + selectedChartType.slice(1)} View:</strong>
            </div>
            {selectedChartType === 'candlestick' && (
              <ul className="tw-space-y-2 tw-text-sm tw-text-gray-600">
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-chart-candlestick tw-mr-2 tw-mt-1 tw-text-green-500"></i>
                  <span>Green candles indicate volume increases, red candles show decreases</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-clock tw-mr-2 tw-mt-1 tw-text-blue-500"></i>
                  <span>Each candle represents one hour of tank activity</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-arrows-up-down tw-mr-2 tw-mt-1 tw-text-purple-500"></i>
                  <span>Wicks show the highest and lowest volume levels during that hour</span>
                </li>
              </ul>
            )}
            {selectedChartType === 'volume' && (
              <ul className="tw-space-y-2 tw-text-sm tw-text-gray-600">
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-gas-pump tw-mr-2 tw-mt-1 tw-text-red-500"></i>
                  <span>Focus on dispensing transactions and fuel movement activity</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-chart-bar tw-mr-2 tw-mt-1 tw-text-blue-500"></i>
                  <span>Bar heights represent volume changes for each transaction type</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-filter tw-mr-2 tw-mt-1 tw-text-green-500"></i>
                  <span>Filtered to show deliveries, transfers, dispensing, and manual refills</span>
                </li>
              </ul>
            )}
            {selectedChartType === 'multi-series' && (
              <ul className="tw-space-y-2 tw-text-sm tw-text-gray-600">
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-palette tw-mr-2 tw-mt-1 tw-text-purple-500"></i>
                  <span>Each colored line represents a different tank for easy comparison</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-eye tw-mr-2 tw-mt-1 tw-text-blue-500"></i>
                  <span>Click legend items to show/hide specific tanks</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-chart-line tw-mr-2 tw-mt-1 tw-text-green-500"></i>
                  <span>Perfect for tracking multiple tank performance simultaneously</span>
                </li>
              </ul>
            )}
            {selectedChartType === 'ohlc' && (
              <ul className="tw-space-y-2 tw-text-sm tw-text-gray-600">
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-chart-column tw-mr-2 tw-mt-1 tw-text-blue-500"></i>
                  <span>Each bar shows Open-High-Low-Close volumes for one hour</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-arrows-up-down tw-mr-2 tw-mt-1 tw-text-purple-500"></i>
                  <span>Vertical lines show the complete range of tank levels</span>
                </li>
                <li className="tw-flex tw-items-start">
                  <i className="fa-light fa-stock tw-mr-2 tw-mt-1 tw-text-orange-500"></i>
                  <span>Similar to stock market charts, ideal for analyzing volume patterns</span>
                </li>
              </ul>
            )}
            <li className="tw-flex tw-items-start tw-mt-3 tw-pt-2 tw-border-t tw-border-gray-200">
              <i className="fa-light fa-mouse tw-mr-2 tw-mt-1 tw-text-gray-500"></i>
              <span className="tw-text-gray-500">Hover over any data point for detailed transaction information</span>
            </li>
          </div>
        </div>
      </ScrollView>
    </Popup>
  );
};

export default ChartView;
