import React, { useMemo, useCallback, useState } from 'react';
import Chart, {
  Series,
  CommonSeriesSettings,
  ValueAxis,
  ArgumentAxis,
  Label,
  Legend,
  Tooltip
} from 'devextreme-react/chart';
import { Popup, ScrollView, SelectBox, CheckBox, Button } from 'devextreme-react';
import './ChartView.scss';

const ChartView = ({
  visible,
  onClose,
  tankVolumeHistory,
  tanks,
  sites,
  currentFilters
}) => {
  // Chart control states
  const [chartType, setChartType] = useState('stock'); // 'stock', 'line', 'area', 'bar'
  const [dataView, setDataView] = useState('volume'); // 'volume', 'changes', 'both'
  const [groupBy, setGroupBy] = useState('site'); // 'site', 'tank', 'none'
  const [timeGrouping, setTimeGrouping] = useState('hourly'); // 'hourly', 'daily', 'none'
  const [selectedSites, setSelectedSites] = useState(new Set());
  const [selectedTanks, setSelectedTanks] = useState(new Set());

  // Chart type options
  const chartTypeOptions = [
    { value: 'stock', text: '📈 Stock Chart (OHLC)' },
    { value: 'line', text: '📊 Line Chart' },
    { value: 'area', text: '📉 Area Chart' },
    { value: 'bar', text: '📋 Bar Chart' },
    { value: 'candlestick', text: '🕯️ Candlestick' }
  ];

  const dataViewOptions = [
    { value: 'volume', text: '🛢️ Tank Volumes' },
    { value: 'changes', text: '⚡ Volume Changes' },
    { value: 'both', text: '📊 Both Views' }
  ];

  const groupingOptions = [
    { value: 'site', text: '🏢 Group by Site' },
    { value: 'tank', text: '🛢️ Group by Tank' },
    { value: 'type', text: '🔄 Group by Transaction Type' },
    { value: 'none', text: '➖ No Grouping' }
  ];

  const timeGroupingOptions = [
    { value: 'none', text: 'Show All Points' },
    { value: 'hourly', text: 'Group by Hour' },
    { value: 'daily', text: 'Group by Day' }
  ];

  // Color generation functions
  const getColorForSite = useCallback((siteId) => {
    const colors = ['#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
    return colors[siteId % colors.length];
  }, []);

  const getColorForTank = useCallback((tankId) => {
    const colors = ['#1f77b4', '#ff7f0e', '#2ca02c', '#d62728', '#9467bd', '#8c564b'];
    return colors[tankId % colors.length];
  }, []);

  const getColorForTransactionType = useCallback((changeReason) => {
    const typeColors = {
      0: '#10b981', // Opening Stock - Green
      1: '#ef4444', // Closing Stock - Red
      2: '#3b82f6', // Delivery - Blue
      3: '#f59e0b', // Transfer In - Orange
      4: '#8b5cf6', // Transfer Out - Purple
      5: '#ec4899', // Adjustment - Pink
      6: '#dc2626', // Dispensing - Dark Red
      7: '#059669'  // Manual Refill - Emerald
    };
    return typeColors[changeReason] || '#6b7280';
  }, []);

  const getTransactionTypeName = useCallback((changeReason) => {
    const names = {
      0: 'Opening Stock',
      1: 'Closing Stock',
      2: 'Delivery',
      3: 'Transfer In',
      4: 'Transfer Out',
      5: 'Adjustment',
      6: 'Dispensing',
      7: 'Manual Refill'
    };
    return names[changeReason] || 'Unknown';
  }, []);

  // Process data for stock-exchange style chart
  const processChartData = useMemo(() => {
    if (!tankVolumeHistory || tankVolumeHistory.length === 0) {
      console.log('📊 No chart data available');
      return { seriesData: [], stockData: [] };
    }

    console.log('📊 Processing chart data:', tankVolumeHistory.length, 'transactions');

    // Sort by timestamp
    const sortedData = [...tankVolumeHistory].sort((a, b) =>
      new Date(a.timestamp) - new Date(b.timestamp)
    );

    // Group data by time periods if timeGrouping is enabled
    let groupedData = sortedData;
    if (timeGrouping !== 'none') {
      const groups = new Map();

      sortedData.forEach(item => {
        const date = new Date(item.timestamp);
        let groupKey;

        if (timeGrouping === 'hourly') {
          groupKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}-${date.getHours()}`;
        } else if (timeGrouping === 'daily') {
          groupKey = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
        }

        if (!groups.has(groupKey)) {
          groups.set(groupKey, []);
        }
        groups.get(groupKey).push(item);
      });

      // Create OHLC data for each group
      groupedData = Array.from(groups.entries()).map(([key, items]) => {
        const volumes = items.map(item => item.newVolume);
        const firstItem = items[0];
        const lastItem = items[items.length - 1];

        return {
          ...firstItem,
          timestamp: firstItem.timestamp,
          open: firstItem.newVolume,
          high: Math.max(...volumes),
          low: Math.min(...volumes),
          close: lastItem.newVolume,
          volume: items.reduce((sum, item) => sum + Math.abs(item.volumeChange), 0),
          transactions: items.length
        };
      });
    }

    // Create series data based on grouping
    const seriesMap = new Map();

    groupedData.forEach(item => {
      let seriesKey;
      let seriesName;
      let color;

      switch (groupBy) {
        case 'site':
          seriesKey = `site-${item.siteId}`;
          seriesName = item.site;
          color = getColorForSite(item.siteId);
          break;
        case 'tank':
          seriesKey = `tank-${item.tankId}`;
          const tankName = tanks?.find(t => t.id === item.tankId)?.name || `Tank ${item.tankId}`;
          seriesName = `${tankName} (${item.site})`;
          color = getColorForTank(item.tankId);
          break;
        case 'type':
          seriesKey = `type-${item.changeReason}`;
          seriesName = getTransactionTypeName(item.changeReason);
          color = getColorForTransactionType(item.changeReason);
          break;
        default:
          seriesKey = 'all';
          seriesName = 'All Transactions';
          color = '#3b82f6';
      }

      if (!seriesMap.has(seriesKey)) {
        seriesMap.set(seriesKey, {
          name: seriesName,
          color: color,
          data: []
        });
      }

      const dataPoint = {
        timestamp: new Date(item.timestamp),
        value: dataView === 'changes' ? item.volumeChange : item.newVolume,
        newVolume: item.newVolume,
        volumeChange: item.volumeChange,
        ...item
      };

      // Add OHLC data if available
      if (item.open !== undefined) {
        dataPoint.open = item.open;
        dataPoint.high = item.high;
        dataPoint.low = item.low;
        dataPoint.close = item.close;
        dataPoint.volume = item.volume;
      }

      seriesMap.get(seriesKey).data.push(dataPoint);
    });

    const seriesData = Array.from(seriesMap.values());

    console.log('📊 Processed series data:', seriesData);
    return { seriesData, stockData: groupedData };
  }, [tankVolumeHistory, groupBy, dataView, timeGrouping, tanks, getColorForSite, getColorForTank, getColorForTransactionType, getTransactionTypeName]);

  // Get chart data
  const { seriesData } = processChartData;

  // Chart tooltip customization
  const customizeTooltip = useCallback((pointInfo) => {
    const point = pointInfo.point;
    const data = point.data;

    if (!data) return {};

    let html = `<div class="chart-tooltip">
      <div class="tooltip-title">${data.site} - Tank ${data.tankId}</div>
      <div class="tooltip-time">${new Date(data.timestamp).toLocaleString()}</div>`;

    if (chartType === 'stock' || chartType === 'candlestick') {
      html += `
        <div class="tooltip-ohlc">
          <div>Open: ${data.open?.toFixed(2) || 'N/A'} L</div>
          <div>High: ${data.high?.toFixed(2) || 'N/A'} L</div>
          <div>Low: ${data.low?.toFixed(2) || 'N/A'} L</div>
          <div>Close: ${data.close?.toFixed(2) || 'N/A'} L</div>
          <div>Volume: ${data.volume?.toFixed(2) || 'N/A'} L</div>
        </div>`;
    } else {
      html += `
        <div class="tooltip-value">
          <div>Volume: ${data.newVolume?.toFixed(2)} L</div>
          <div>Change: ${data.volumeChange > 0 ? '+' : ''}${data.volumeChange?.toFixed(2)} L</div>
          <div>Type: ${getTransactionTypeName(data.changeReason)}</div>
        </div>`;
    }

    html += `</div>`;

    return { html };
  }, [chartType, getTransactionTypeName]);

  // Chart series configuration
  const getSeriesConfig = useCallback(() => {
    if (!seriesData || seriesData.length === 0) return [];

    return seriesData.map(series => {
      const baseConfig = {
        valueField: 'value',
        argumentField: 'timestamp',
        name: series.name,
        color: series.color,
        point: { visible: true, size: 4 }
      };

      switch (chartType) {
        case 'stock':
          return {
            ...baseConfig,
            type: 'stock',
            openValueField: 'open',
            highValueField: 'high',
            lowValueField: 'low',
            closeValueField: 'close',
            reduction: { color: '#ef4444' }
          };
        case 'candlestick':
          return {
            ...baseConfig,
            type: 'candlestick',
            openValueField: 'open',
            highValueField: 'high',
            lowValueField: 'low',
            closeValueField: 'close',
            reduction: { color: '#ef4444' }
          };
        case 'area':
          return {
            ...baseConfig,
            type: 'area',
            opacity: 0.6
          };
        case 'bar':
          return {
            ...baseConfig,
            type: 'bar'
          };
        default: // line
          return {
            ...baseConfig,
            type: 'line',
            width: 2
          };
      }
    });
  }, [seriesData, chartType]);

  if (!visible) {
    return null;
  }

  // Memoized chart data processing
  const getChartData = useMemo(() => {
    if (!tankVolumeHistory || tankVolumeHistory.length === 0) {
      console.log('📊 No chart data available');
      return [];
    }

    const chartData = tankVolumeHistory.map((transaction, index) => ({
      timestamp: new Date(transaction.recordedDateTime),
      newVolume: transaction.newVolume,
      ...transaction
    }));

    console.log('📊 Chart data processed:', chartData.length, 'transactions');
    return chartData;
  }, [tankVolumeHistory]);

  return (
    <Popup
      visible={visible}
      onHiding={onClose}
      showTitle={true}
      title="Transaction Volume Chart"
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
          {/* Chart Controls */}
          <div className="chart-controls tw-mb-4 tw-flex tw-items-center tw-gap-4 tw-p-3 tw-bg-gray-50 tw-rounded-lg">
            {/* Data summary */}
            <div className="tw-flex tw-items-center tw-gap-4 tw-text-xs tw-text-gray-600">
              <span className="tw-font-medium">Data:</span>
              <span className="tw-px-2 tw-py-1 tw-rounded tw-bg-white tw-border tw-border-gray-200">
                {getChartData.length} transactions
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
              {currentFilters.startDate && currentFilters.endDate && (
                <span className="tw-flex tw-items-center tw-text-gray-600">
                  <i className="fa-light fa-calendar tw-mr-2 tw-text-green-600"></i>
                  {new Date(currentFilters.startDate).toLocaleDateString()} - {new Date(currentFilters.endDate).toLocaleDateString()}
                </span>
              )}

              {currentFilters.siteId ? (
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
              {currentFilters.tankId && (
                <span className="tw-flex tw-items-center tw-text-gray-600">
                  <i className="fa-light fa-oil-can tw-mr-2 tw-text-orange-600"></i>
                  Tank: {tanks?.find(t => t.id === currentFilters.tankId)?.name || 'Unknown'}
                </span>
              )}
            </div>
          </div>

          <Chart
            height={500}
            dataSource={getChartData}
            title={{
              text: "Tank Volume Changes Over Time",
              font: {
                size: 18,
                weight: 600
              }
            }}
            tooltip={{
              enabled: true,
              format: "fixedPoint",
              precision: 2,
              container: "body"
            }}
            crosshair={{
              enabled: true,
              color: '#949494',
              width: 1,
              dashStyle: 'dash'
            }}
            adaptiveLayout={{
              width: 80,
              height: 80,
              keepLabels: true
            }}
            onInitialized={(e) => {
              console.log('🎨 Chart initialized:', e);
              console.log('🎨 Chart data:', getChartData);
              console.log('🎨 Total data points:', getChartData.length);

              // Log sample data for debugging
              if (getChartData.length > 0) {
                console.log('🎨 Sample data point:', getChartData[0]);
                console.log('🎨 Timestamp:', getChartData[0]?.timestamp);
                console.log('🎨 NewVolume:', getChartData[0]?.newVolume);
              }

              // Debug series rendering
              setTimeout(() => {
                const chartElement = e.element;
                const seriesElements = chartElement.querySelectorAll('.dx-chart-series, path[class*="dx-chart-series"], .dx-chart-series-line');
                console.log('🎨 Found series elements:', seriesElements.length);

                seriesElements.forEach((element, index) => {
                  console.log(`🎨 Series ${index}:`, element);
                  // Force visibility
                  element.style.strokeWidth = '4px';
                  element.style.strokeOpacity = '1';
                  element.style.opacity = '1';
                  element.style.visibility = 'visible';
                  element.style.display = 'block';
                  element.style.stroke = '#3b82f6';
                });
              }, 500);

              // Fix tooltip z-index after chart initialization
              setTimeout(() => {
                const tooltips = document.querySelectorAll('.dx-chart-tooltip, .dx-tooltip, .dx-tooltip-wrapper, div[class*="tooltip"]');
                tooltips.forEach(tooltip => {
                  tooltip.style.zIndex = '99999';
                  tooltip.style.position = 'fixed';
                });
              }, 100);

              // Set up mutation observer to catch dynamically created tooltips
              const observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                  mutation.addedNodes.forEach((node) => {
                    if (node.nodeType === 1) { // Element node
                      const tooltips = node.querySelectorAll?.('.dx-chart-tooltip, .dx-tooltip, .dx-tooltip-wrapper') || [];
                      tooltips.forEach(tooltip => {
                        tooltip.style.zIndex = '99999';
                        tooltip.style.position = 'fixed';
                      });

                      // Check if the node itself is a tooltip
                      if (node.classList && (node.classList.contains('dx-chart-tooltip') || node.classList.contains('dx-tooltip'))) {
                        node.style.zIndex = '99999';
                        node.style.position = 'fixed';
                      }
                    }
                  });
                });
              });

              observer.observe(document.body, { childList: true, subtree: true });
            }}
          >
            <CommonSeriesSettings argumentField="timestamp" type="line" />
            <Series
              valueField="newVolume"
              name="Tank Volume"
              color="#3b82f6"
              point={{
                visible: true,
                size: 8,
                symbol: 'circle',
                color: '#1d4ed8',
                border: {
                  visible: true,
                  width: 2,
                  color: '#ffffff'
                }
              }}
              width={3}
            />
            <ValueAxis>
              <Label format="#,##0 L" />
            </ValueAxis>
            <ArgumentAxis>
              <Label
                customizeText={(e) => {
                  const date = new Date(e.value);
                  return date.toLocaleDateString('en-GB', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric'
                  }) + '\n' + date.toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit'
                  });
                }}
                rotationAngle={45}
              />
            </ArgumentAxis>
            <Legend visible={true} />
            <Tooltip
              enabled={true}
              customizeTooltip={customizeTooltip}
              onTooltipShown={(e) => {
                // Ensure tooltip has the highest z-index when shown
                console.log('Tooltip shown event:', e);
                if (e.element) {
                  e.element.style.zIndex = '99999';
                  e.element.style.position = 'fixed';
                }

                // Also check for parent elements that might be tooltip containers
                let parent = e.element?.parentElement;
                while (parent && parent !== document.body) {
                  if (parent.classList && (parent.classList.contains('dx-tooltip') || parent.classList.contains('dx-chart-tooltip'))) {
                    parent.style.zIndex = '99999';
                    parent.style.position = 'fixed';
                  }
                  parent = parent.parentElement;
                }

                // Force immediate DOM update
                setTimeout(() => {
                  const allTooltips = document.querySelectorAll('.dx-chart-tooltip, .dx-tooltip, div[class*="tooltip"]');
                  allTooltips.forEach(tooltip => {
                    tooltip.style.zIndex = '99999';
                    tooltip.style.position = 'fixed';
                  });
                }, 0);
              }}
            />
          </Chart>

          <div className="chart-guide tw-mt-4">
            <div className="tw-flex tw-items-center tw-mb-3">
              <i className="fa-light fa-lightbulb tw-mr-2 tw-text-blue-600"></i>
              <strong className="tw-text-gray-800">Chart Guide:</strong>
            </div>
            <ul className="tw-space-y-2 tw-text-sm tw-text-gray-600">
              <li className="tw-flex tw-items-start">
                <i className="fa-light fa-mouse tw-mr-2 tw-mt-1 tw-text-blue-500"></i>
                <span>Hover over data points to see detailed transaction information</span>
              </li>
              <li className="tw-flex tw-items-start">
                <i className="fa-light fa-search-plus tw-mr-2 tw-mt-1 tw-text-green-500"></i>
                <span>Use mouse wheel to zoom in/out on the chart</span>
              </li>
              <li className="tw-flex tw-items-start">
                <i className="fa-light fa-arrows tw-mr-2 tw-mt-1 tw-text-purple-500"></i>
                <span>Click and drag to pan around the chart when zoomed</span>
              </li>
              <li className="tw-flex tw-items-start">
                <i className="fa-light fa-chart-line tw-mr-2 tw-mt-1 tw-text-orange-500"></i>
                <span>Volume increases show as upward trends, decreases as downward trends</span>
              </li>
              <li className="tw-flex tw-items-start">
                <i className="fa-light fa-layer-group tw-mr-2 tw-mt-1 tw-text-indigo-500"></i>
                <span>Single line shows all tank volume changes chronologically</span>
              </li>
            </ul>
          </div>
        </div>
      </ScrollView>
    </Popup>
  );
};

export default ChartView;
