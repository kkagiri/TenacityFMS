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
  ZoomAndPan,
  Label
} from 'devextreme-react/chart';
import './LineChartWidget.css';

/**
 * Line Chart Widget Component using DevExtreme
 * Displays trend data with line charts and enhanced features
 */
const LineChartWidget = ({
  widget,
  data,
  isLoading = false,
  error = null,
  onRefresh = null,
  onConfigChange = null,
  isEditMode = false
}) => {
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    if (onRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh(widget.instanceId);
      } finally {
        setIsRefreshing(false);
      }
    }
  };

  // Process chart data
  const chartData = useMemo(() => {
    if (!data || !data.chartData) {
      return [];
    }

    // Handle different data formats
    if (Array.isArray(data.chartData)) {
      // Ensure items have { argument, value }
      return data.chartData.map((point, index) => {
        if (point && typeof point === 'object') {
          const argument = point.argument ?? point.timestamp ?? point.date ?? point.label ?? index;
          const value = point.value ?? point.y ?? 0;
          return { argument, value, ...point };
        }
        // Primitive fallback
        return { argument: index, value: Number(point) || 0 };
      });
    }

    if (data.chartData.series && Array.isArray(data.chartData.series)) {
      // Transform series data to DevExtreme format
      return data.chartData.series.map((point, index) => ({
        argument: point.x || point.date || point.label || index,
        value: point.y || point.value || 0,
        ...point
      }));
    }

    return [];
  }, [data]);

  // Aggregate into daily buckets for last 7 days including today; support cumulative modes
  const dailyData = useMemo(() => {
    if (!chartData || chartData.length === 0) return [];

    // If server indicated bucketed time series, trust it and do not re-aggregate
    if (data?.metadata?.serverBucketed) {
      return chartData;
    }

    // Detect time-like arguments
    const isTimeSeries = chartData.some(p => p && (p.argument instanceof Date || typeof p.argument === 'string'));
    if (!isTimeSeries && data?.aggregationType !== 'daily') return chartData;

    // Normalize to Date objects
    const normalized = chartData.map(p => {
      const d = p.argument instanceof Date ? p.argument : new Date(p.argument);
      return { date: d, value: Number(p.value) || 0 };
    });

    // Create last 7 days including today (local time)
    const today = new Date();
    const end = new Date(today.getFullYear(), today.getMonth(), today.getDate()); // midnight today
    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    // Initialize buckets
    const buckets = new Map();
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      const key = d.toISOString().slice(0, 10);
      buckets.set(key, { argument: new Date(d), value: 0 });
    }

    // Sum values into day buckets
    for (const p of normalized) {
      const key = new Date(p.date.getFullYear(), p.date.getMonth(), p.date.getDate()).toISOString().slice(0, 10);
      if (buckets.has(key)) {
        buckets.get(key).value += p.value;
      }
    }

    // Convert to array ordered by date
    const ordered = Array.from(buckets.values()).sort((a, b) => a.argument - b.argument);
    // Cumulative options
    const cumulativeMode = widget?.configuration?.chart?.cumulativeMode || data?.cumulativeMode || 'daily';
    if (cumulativeMode === 'running') {
      // Running total across days
      let running = 0;
      return ordered.map(p => ({ argument: p.argument, value: (running += p.value) }));
    }
    // Default: daily sums (reset every day)
    return ordered;
  }, [chartData, widget, data]);

  // Get chart configuration
  const chartConfig = widget.configuration?.chart || {};
  const {
    height = 300,
    showLegend = true,
    showTooltip = true,
    argumentField = 'argument',
    valueField = 'value',
    seriesType = 'line',
    color = '#1976d2',
    showGrid = true,
    enableZoom = false
  } = chartConfig;

  if (error) {
    return (
      <div className="line-chart-widget widget-container error">
        <div className="widget-header">
          <h3>{widget.title || 'Line Chart'}</h3>
          {isEditMode && onConfigChange && (
            <button
              className="widget-config-btn"
              onClick={() => onConfigChange(widget)}
              title="Configure Widget"
            >
              <i className="fa-solid fa-cog" />
            </button>
          )}
        </div>
        <div className="widget-content">
          <div className="error-state">
            <i className="fa-solid fa-exclamation-triangle" />
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="line-chart-widget widget-container">
      <div className="widget-header">
        <h3>{widget.title || widget.name || 'Line Chart'}</h3>
        <div className="widget-actions">
          {onRefresh && (
            <button
              className="widget-action-btn"
              onClick={handleRefresh}
              disabled={isRefreshing || isLoading}
              title="Refresh Data"
            >
              <i
                className={`fa-solid fa-refresh ${isRefreshing || isLoading ? 'fa-spin' : ''}`}
              />
            </button>
          )}
          {isEditMode && onConfigChange && (
            <button
              className="widget-action-btn"
              onClick={() => onConfigChange(widget)}
              title="Configure Widget"
            >
              <i className="fa-solid fa-cog" />
            </button>
          )}
        </div>
      </div>

      <div className="widget-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading chart data...</p>
          </div>
        ) : !data || chartData.length === 0 ? (
          <div className="no-data-state">
            <i className="fa-solid fa-chart-line" style={{ fontSize: '2rem', color: '#ccc', marginBottom: '8px' }} />
            <p>No chart data available</p>
            <small>This chart is waiting for data</small>
            {onRefresh && (
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={handleRefresh}
                style={{ marginTop: '8px' }}
              >
                Refresh Data
              </button>
            )}
          </div>
        ) : (
          <div className="chart-container">
            <Chart
              dataSource={dailyData}
              height={height}
              palette="Material"
            >
              <LoadingIndicator enabled={isLoading} />

              {data?.title && <Title text={data.title} />}

              <Series
                argumentField={argumentField}
                valueField={valueField}
                type={seriesType}
                color={color}
                name={data?.seriesName || 'Value'}
              />

              <ArgumentAxis tickInterval={'day'}>
                <Grid visible={showGrid} />
                <Label format="shortDate" />
              </ArgumentAxis>

              <ValueAxis>
                <Grid visible={showGrid} />
              </ValueAxis>

              {showLegend && <Legend visible={true} />}

              {showTooltip && (
                <Tooltip
                  enabled={true}
                  customizeTooltip={(info) => ({
                    text: `${info.argumentText}: ${info.valueText}${data?.unit || ''}`
                  })}
                />
              )}

              {enableZoom && (
                <ZoomAndPan
                  argumentAxis="both"
                  valueAxis="both"
                />
              )}
            </Chart>

            {/* Chart summary */}
            {data?.summary && (
              <div className="chart-summary">
                <div className="summary-stats">
                  {data.summary.total !== undefined && (
                    <div className="stat-item">
                      <span className="label">Total:</span>
                      <span className="value">{data.summary.total}{data?.unit || ''}</span>
                    </div>
                  )}
                  {data.summary.average !== undefined && (
                    <div className="stat-item">
                      <span className="label">Average:</span>
                      <span className="value">{data.summary.average}{data?.unit || ''}</span>
                    </div>
                  )}
                  {data.summary.trend && (
                    <div className={`stat-item trend ${data.summary.trend.direction}`}>
                      <span className="label">Trend:</span>
                      <span className="value">{data.summary.trend.percentage}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Meta information */}
        {data?.lastUpdated && (
          <div className="widget-meta">
            <small>Updated: {new Date(data.lastUpdated).toLocaleString()}</small>
          </div>
        )}
      </div>

      {/* Configuration preview in edit mode */}
      {isEditMode && (
        <div className="widget-config-preview">
          <small>Type: {widget.templateType || widget.type}</small>
          {widget.category && <small>Category: {widget.category}</small>}
          <small>Chart: {seriesType}</small>
        </div>
      )}
    </div>
  );
};

LineChartWidget.propTypes = {
  widget: PropTypes.object.isRequired,
  data: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  onConfigChange: PropTypes.func,
  isEditMode: PropTypes.bool
};

export default LineChartWidget;

