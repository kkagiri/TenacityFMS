import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import PieChart, {
  Series,
  Legend,
  Tooltip,
  LoadingIndicator,
  Label,
  Connector
} from 'devextreme-react/pie-chart';
import './PieChartWidget.css';

/**
 * Pie Chart Widget Component using DevExtreme
 * Displays distribution data with pie charts and donut charts
 */
const PieChartWidget = ({
  widgetId,
  config = {},
  data = null,
  onRefresh,
  onConfigure,
  isEditing = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Default configuration
  const defaultConfig = {
    title: 'Pie Chart',
    type: 'pie', // pie, donut
    showLegend: true,
    showTooltips: true,
    showLabels: true,
    palette: 'Bright',
    innerRadius: 0.5, // for donut charts
    animation: {
      enabled: true,
      duration: 1000
    },
    valueFormat: 'decimal',
    percentageFormat: true
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Process chart data
  const chartData = useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    return data.map((item, index) => {
      if (typeof item === 'object') {
        return {
          category: item.category || item.name || `Category ${index + 1}`,
          value: parseFloat(item.value) || 0,
          ...item
        };
      }
      return {
        category: `Category ${index + 1}`,
        value: parseFloat(item) || 0
      };
    });
  }, [data]);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setLoading(true);
    setError(null);

    try {
      await onRefresh();
    } catch (err) {
      setError('Failed to refresh chart data');
      console.error('Pie chart widget refresh error:', err);
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
      <div className="pie-chart-widget">
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
      <div className="pie-chart-widget">
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
      <div className="pie-chart-widget">
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
            <i className="fa-solid fa-chart-pie" />
            <span>No data available for chart</span>
          </div>
        </div>
      </div>
    );
  }

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="pie-chart-widget">
      <div className="widget-header">
        <h3>{mergedConfig.title}</h3>
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
          >
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
        <div className="chart-container">
          <PieChart
            id={`pie-chart-${widgetId}`}
            dataSource={chartData}
            palette={mergedConfig.palette}
            type={mergedConfig.type}
            innerRadius={mergedConfig.type === 'donut' ? mergedConfig.innerRadius : 0}
            animation={mergedConfig.animation}
          >
            {mergedConfig.showTooltips && (
              <Tooltip
                enabled={true}
                format="millions"
                customizeTooltip={(arg) => ({
                  text: `${arg.argument}: ${formatValue(arg.value)} (${((arg.value / total) * 100).toFixed(1)}%)`
                })}
              />
            )}

            {mergedConfig.showLegend && (
              <Legend
                orientation="horizontal"
                itemTextPosition="right"
                horizontalAlignment="center"
                verticalAlignment="bottom"
              />
            )}

            <LoadingIndicator show={loading} />

            <Series
              argumentField="category"
              valueField="value"
            >
              {mergedConfig.showLabels && (
                <Label
                  visible={true}
                  position="columns"
                  customizeText={(arg) =>
                    mergedConfig.percentageFormat
                      ? `${((arg.value / total) * 100).toFixed(1)}%`
                      : formatValue(arg.value)
                  }
                >
                  <Connector visible={true} width={0.5} />
                </Label>
              )}
            </Series>
          </PieChart>
        </div>

        <div className="chart-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="label">Total Value</span>
              <span className="value">{formatValue(total)}</span>
            </div>
            <div className="stat-item">
              <span className="label">Categories</span>
              <span className="value">{chartData.length}</span>
            </div>
            <div className="stat-item">
              <span className="label">Largest</span>
              <span className="value">
                {Math.max(...chartData.map(item => item.value)) > 0
                  ? `${((Math.max(...chartData.map(item => item.value)) / total) * 100).toFixed(1)}%`
                  : '0%'
                }
              </span>
            </div>
          </div>
        </div>

        <div className="widget-meta">
          Last updated: {new Date().toLocaleTimeString()}
        </div>
      </div>

      {isEditing && (
        <div className="widget-config-preview">
          <span>Type: {mergedConfig.type}</span>
          <span>Categories: {chartData.length}</span>
        </div>
      )}
    </div>
  );
};

PieChartWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  config: PropTypes.object,
  data: PropTypes.array,
  onRefresh: PropTypes.func,
  onConfigure: PropTypes.func,
  isEditing: PropTypes.bool
};

export default PieChartWidget;

