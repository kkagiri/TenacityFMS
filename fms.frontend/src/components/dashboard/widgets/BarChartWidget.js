import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import Chart, {
  Series,
  ArgumentAxis,
  ValueAxis,
  Legend,
  Tooltip,
  LoadingIndicator,
  Title,
  Grid,
  ZoomAndPan
} from 'devextreme-react/chart';
import './BarChartWidget.css';

/**
 * Bar Chart Widget Component using DevExtreme
 * Displays comparison data with vertical or horizontal bar charts
 */
const BarChartWidget = ({
  widget, // full widget config (optional)
  widgetId,
  config = {},
  data = null,
  onRefresh,
  onConfigure,
  isEditing = false,
  units
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default configuration
  const defaultConfig = {
    title: 'Bar Chart',
    orientation: 'vertical', // vertical, horizontal
    showLegend: true,
    showGrid: true,
    showTooltips: true,
    enableZoom: false,
    animation: {
      enabled: true,
      duration: 1000,
      easing: 'easeOutQuart'
    },
    argumentAxis: {
      title: 'Categories',
      showTitle: true,
      gridVisible: false
    },
    valueAxis: {
      title: 'Values',
      showTitle: true,
      gridVisible: true
    },
    palette: 'Bright',
    barGroupPadding: 0.3,
    barGroupWidth: undefined,
    showValues: false,
    valueFormat: 'decimal',
    tooltipFormat: 'decimal'
  };

  // Infer metadata
  const displayName = widget?.name || data?.metadata?.displayName || config.title || defaultConfig.title;
  const unit = units || data?.metadata?.unit || data?.unit || undefined;

  // Treat data as already aggregated by server; determine if categorical or timeseries for labeling only
  const firstRaw = Array.isArray(data) && data.length > 0 ? data[0] : null;
  const isTimeSeries = !!(firstRaw && (firstRaw.timestamp || firstRaw.argument instanceof Date || typeof firstRaw.argument === 'string'));

  const mergedConfig = {
    ...defaultConfig,
    ...config,
    title: displayName,
    argumentAxis: {
      ...defaultConfig.argumentAxis,
      ...config.argumentAxis,
      // Use Date on X axis for time series
      title: isTimeSeries ? 'Date' : (config.argumentAxis?.title || defaultConfig.argumentAxis.title)
    },
    valueAxis: {
      ...defaultConfig.valueAxis,
      ...config.valueAxis,
      title: unit || config.valueAxis?.title || defaultConfig.valueAxis.title
    }
  };

  // Process chart data
  const chartData = useMemo(() => {
    if (!data) return [];
    // Accept either array directly or server-shaped { series: [...] }
    const arr = Array.isArray(data) ? data : Array.isArray(data.series) ? data.series : [];
    return arr.map((pt, idx) => {
      if (pt && typeof pt === 'object') {
        const ts = pt.argument ?? pt.timestamp ?? pt.date ?? null;
        const val = pt.value ?? pt.y ?? pt.amount ?? 0;
        if (ts) {
          // Do NOT re-bucket; just display as provided
          const d = ts instanceof Date ? ts : new Date(ts);
          return { argument: d, value: Number(val) || 0 };
        }
        const label = pt.category ?? pt.label ?? pt.key ?? `Item ${idx + 1}`;
        return { category: String(label), value: Number(val) || 0 };
      }
      return { category: `Item ${idx + 1}`, value: Number(pt) || 0 };
    });
  }, [data]);

  // Get chart series configuration
  const getSeriesConfig = () => {
    if (!chartData.length) return [];

    // Detect data structure
    const firstItem = chartData[0];
    const keys = Object.keys(firstItem).filter(key =>
      key !== 'category' &&
      key !== 'argument' &&
      typeof firstItem[key] === 'number'
    );

    if (keys.length === 0) {
      // Fallback to 'value' key
      return [{
        valueField: 'value',
        argumentField: 'category',
        name: 'Value',
        type: 'bar'
      }];
    }

    // Create series for each numeric field
    return keys.map(key => ({
      valueField: key,
      argumentField: firstItem.argument !== undefined ? 'argument' :
                     firstItem.category !== undefined ? 'category' :
                     Object.keys(firstItem)[0],
      name: key.charAt(0).toUpperCase() + key.slice(1),
      type: 'bar'
    }));
  };

  const seriesConfig = getSeriesConfig();

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!chartData.length || !seriesConfig.length) {
      return null;
    }

    // Summary is display-only; avoid heavy recomputation
    return null;
  }, [chartData, seriesConfig]);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setLoading(true);
    setError(null);

    try {
      await onRefresh();
    } catch (err) {
      setError('Failed to refresh chart data');
      console.error('Bar chart widget refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatValue = (value) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return value;

    switch (mergedConfig.valueFormat) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(numValue);
      case 'percentage':
        return `${numValue.toFixed(1)}%`;
      case 'integer':
        return Math.round(numValue).toLocaleString();
      default:
        return numValue.toLocaleString();
    }
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="bar-chart-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
        </div>
        <div className="widget-content">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Loading chart data...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="bar-chart-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
          <div className="widget-actions">
            <button className="widget-action-btn" onClick={handleRefresh} title="Retry">
              <i className="fa-solid fa-refresh" />
            </button>
          </div>
        </div>
        <div className="widget-content">
          <div className="error-state">
            <i className="fa-solid fa-exclamation-triangle" />
            <span>{error}</span>
          </div>
        </div>
      </div>
    );
  }

  // No data state
  if (!chartData.length) {
    return (
      <div className="bar-chart-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
          <div className="widget-actions">
            <button className="widget-action-btn" onClick={handleRefresh} title="Refresh">
              <i className="fa-solid fa-refresh" />
            </button>
            {onConfigure && (
              <button className="widget-action-btn" onClick={onConfigure} title="Configure">
                <i className="fa-solid fa-cog" />
              </button>
            )}
          </div>
        </div>
        <div className="widget-content">
          <div className="no-data-state">
            <i className="fa-solid fa-chart-bar" />
            <span>No data available for chart</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bar-chart-widget">
      <div className="widget-header">
        <h3>{mergedConfig.title}</h3>
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
          >
            <i className={`fa-solid fa-refresh ${loading ? 'fa-spin' : ''}`} />
          </button>
          {onConfigure && (
            <button className="widget-action-btn" onClick={onConfigure} title="Configure">
              <i className="fa-solid fa-cog" />
            </button>
          )}
        </div>
      </div>

      <div className="widget-content">
        <div className="chart-container">
          <Chart
            id={`bar-chart-${widgetId}`}
            dataSource={chartData}
            palette={mergedConfig.palette}
            rotated={mergedConfig.orientation === 'horizontal'}
            barGroupPadding={mergedConfig.barGroupPadding}
            barGroupWidth={mergedConfig.barGroupWidth}
            animation={mergedConfig.animation}
          >
            {mergedConfig.showTooltips && (
              <Tooltip
                enabled={true}
                location="edge"
                customizeTooltip={(arg) => ({
                  text: `${arg.seriesName}: ${formatValue(arg.value)}`
                })}
              />
            )}

            {mergedConfig.showLegend && seriesConfig.length > 1 && (
              <Legend
                verticalAlignment="bottom"
                horizontalAlignment="center"
                itemTextPosition="right"
                rowCount={2}
              />
            )}

            <LoadingIndicator show={loading} />

            {mergedConfig.argumentAxis.showTitle && (
              <Title
                text={mergedConfig.argumentAxis.title}
                horizontalAlignment="center"
              />
            )}

            <ArgumentAxis tickInterval={'day'}>
              <Grid visible={mergedConfig.argumentAxis.gridVisible} />
              {/* DevExtreme renders Date nicely with format below if needed: */}
              {/* <Label format="shortDate" /> */}
            </ArgumentAxis>

            <ValueAxis
              showZero={true}
              title={mergedConfig.valueAxis.showTitle ? {
                text: mergedConfig.valueAxis.title
              } : undefined}
            >
              <Grid visible={mergedConfig.valueAxis.gridVisible} />
            </ValueAxis>

            {seriesConfig.map((series, index) => (
              <Series
                key={index}
                {...series}
                color={
                  mergedConfig.customColors &&
                  mergedConfig.customColors[index]
                    ? mergedConfig.customColors[index]
                    : undefined
                }
              />
            ))}

            {mergedConfig.enableZoom && (
              <ZoomAndPan
                argumentAxis="both"
                valueAxis="both"
              />
            )}
          </Chart>
        </div>

        {summaryStats && (
          <div className="chart-summary">
            <h4>Summary Statistics</h4>
            <div className="summary-grid">
              {Object.entries(summaryStats).map(([seriesName, stats]) => (
                <div key={seriesName} className="summary-series">
                  <div className="series-name">{seriesName}</div>
                  <div className="series-stats">
                    <div className="stat-item">
                      <span className="label">Total</span>
                      <span className="value">{formatValue(stats.sum)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Average</span>
                      <span className="value">{formatValue(stats.avg)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Maximum</span>
                      <span className="value">{formatValue(stats.max)}</span>
                    </div>
                    <div className="stat-item">
                      <span className="label">Minimum</span>
                      <span className="value">{formatValue(stats.min)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="widget-meta">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {isEditing && (
        <div className="widget-config-preview">
          <span>Type: {mergedConfig.orientation} bars</span>
          <span>Series: {seriesConfig.length}</span>
          <span>Data points: {chartData.length}</span>
        </div>
      )}
    </div>
  );
};

BarChartWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  config: PropTypes.object,
  data: PropTypes.array,
  onRefresh: PropTypes.func,
  onConfigure: PropTypes.func,
  isEditing: PropTypes.bool,
  units: PropTypes.string
};

export default BarChartWidget;
