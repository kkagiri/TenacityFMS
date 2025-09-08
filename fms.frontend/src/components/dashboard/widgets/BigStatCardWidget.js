import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './BigStatCardWidget.css';

/**
 * Big Stat Card Widget Component
 * Displays large statistical values with trend indicators and formatting
 */
const BigStatCardWidget = ({
  widget,
  data,
  isLoading = false,
  error = null,
  onRefresh = null,
  onConfigChange = null,
  isEditMode = false,
  hideHeader = false
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

  // Extract data values
  const value = data?.value || data?.data?.value || 0;
  const unit = data?.unit || data?.data?.unit || '';
  const trend = data?.trend || data?.data?.trend || null;
  const previousValue = data?.previousValue || data?.data?.previousValue || null;
  const period = data?.period || data?.data?.period || 'Current';

  // Calculate trend percentage
  const trendPercentage = trend?.percentage ||
    (previousValue && previousValue !== 0 ?
      ((value - previousValue) / previousValue * 100).toFixed(1) : null);

  const trendDirection = trend?.direction ||
    (trendPercentage > 0 ? 'up' : trendPercentage < 0 ? 'down' : 'neutral');

  // Format large numbers
  const formatValue = (val) => {
    if (typeof val !== 'number') return val;

    if (val >= 1000000) {
      return (val / 1000000).toFixed(1) + 'M';
    } else if (val >= 1000) {
      return (val / 1000).toFixed(1) + 'K';
    }
    return val.toLocaleString();
  };

  // Determine card color based on widget configuration or data
  const getCardColor = () => {
    const config = widget.configuration || {};

    if (config.colorScheme) {
      return config.colorScheme;
    }

    // Auto-color based on trend
    if (trendDirection === 'up') return 'success';
    if (trendDirection === 'down') return 'warning';
    return 'primary';
  };

  const cardColor = getCardColor();

  if (error) {
    return (
      <div className="big-stat-card widget-container error">
        {!hideHeader && (
          <div className="widget-header">
            <h3>{widget.title || 'Big Stat Card'}</h3>
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
        )}
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
    <div className={`big-stat-card widget-container ${cardColor}`}>
      {!hideHeader && (
        <div className="widget-header">
          <h3>{widget.title || widget.name || 'Big Stat Card'}</h3>
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
      )}

      <div className="widget-content">
        {isLoading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p>Loading...</p>
          </div>
        ) : !data || (data && Object.keys(data).length === 0) ? (
          <div className="no-data-state">
            <i className="fa-solid fa-chart-line" style={{ fontSize: '2rem', color: '#ccc', marginBottom: '8px' }} />
            <p>No data available</p>
            <small>This widget is waiting for data</small>
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
          <div className="stat-card-content">
            <div className="main-value">
              <span className="value">{formatValue(value)}</span>
              {unit && <span className="unit">{unit}</span>}
            </div>

            {trendPercentage !== null && (
              <div className={`trend-indicator ${trendDirection}`}>
                <i
                  className={`fa-solid ${trendDirection === 'up' ? 'fa-arrow-up' : 'fa-arrow-down'}`}
                />
                <span>{Math.abs(trendPercentage)}%</span>
              </div>
            )}

            <div className="stat-meta">
              <div className="period">{period}</div>
              {data?.lastUpdated && (
                <div className="last-updated">
                  Updated: {new Date(data.lastUpdated).toLocaleTimeString()}
                </div>
              )}
            </div>

            {/* Additional info section */}
            {data?.additionalInfo && (
              <div className="additional-info">
                {data.additionalInfo.sites_count > 0 && (
                  <div className="info-item">
                    <span className="label">Sites:</span>
                    <span className="value">{data.additionalInfo.sites_count}</span>
                  </div>
                )}
                {data.additionalInfo.vehicles_count > 0 && (
                  <div className="info-item">
                    <span className="label">Vehicles:</span>
                    <span className="value">{data.additionalInfo.vehicles_count}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Configuration preview in edit mode */}
      {isEditMode && (
        <div className="widget-config-preview">
          <small>Type: {widget.templateType || widget.type}</small>
          {widget.category && <small>Category: {widget.category}</small>}
        </div>
      )}
    </div>
  );
};

BigStatCardWidget.propTypes = {
  widget: PropTypes.object.isRequired,
  data: PropTypes.object,
  isLoading: PropTypes.bool,
  error: PropTypes.string,
  onRefresh: PropTypes.func,
  onConfigChange: PropTypes.func,
  isEditMode: PropTypes.bool,
  hideHeader: PropTypes.bool
};

export default BigStatCardWidget;
