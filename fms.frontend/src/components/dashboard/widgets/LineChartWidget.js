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
      return data.chartData;
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
              dataSource={chartData}
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

              <ArgumentAxis>
                <Grid visible={showGrid} />
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

