import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './AlertWidget.css';

/**
 * Alert Widget Component
 * Displays notifications, alerts, and important messages
 */
const AlertWidget = ({
  widgetId,
  config = {},
  data = null,
  onRefresh,
  onConfigure,
  isEditing = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(new Set());

  // Default configuration
  const defaultConfig = {
    title: 'Alerts',
    maxAlerts: 5,
    showTimestamp: true,
    showDismiss: true,
    showSource: true,
    allowMarkAsRead: true,
    autoRefresh: false,
    refreshInterval: 30000, // 30 seconds
    groupByType: false,
    sortBy: 'timestamp', // timestamp, priority, type
    sortOrder: 'desc',
    alertTypes: {
      error: { color: '#dc3545', icon: 'fa-solid fa-exclamation-circle' },
      warning: { color: '#ffc107', icon: 'fa-solid fa-exclamation-triangle' },
      info: { color: '#17a2b8', icon: 'fa-solid fa-info-circle' },
      success: { color: '#28a745', icon: 'fa-solid fa-check-circle' }
    }
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Process alerts data
  const processedAlerts = React.useMemo(() => {
    if (!data || !Array.isArray(data)) {
      return [];
    }

    // Filter out dismissed alerts
    let filtered = data.filter(alert => !dismissedAlerts.has(alert.id));

    // Sort alerts
    filtered.sort((a, b) => {
      let aVal, bVal;

      switch (mergedConfig.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority?.toLowerCase()] || 0;
          bVal = priorityOrder[b.priority?.toLowerCase()] || 0;
          break;
        case 'type':
          aVal = a.type || '';
          bVal = b.type || '';
          break;
        case 'timestamp':
        default:
          aVal = new Date(a.timestamp || a.createdAt || 0);
          bVal = new Date(b.timestamp || b.createdAt || 0);
          break;
      }

      if (mergedConfig.sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // Limit to max alerts
    return filtered.slice(0, mergedConfig.maxAlerts);
  }, [data, dismissedAlerts, mergedConfig.maxAlerts, mergedConfig.sortBy, mergedConfig.sortOrder]);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setLoading(true);
    setError(null);

    try {
      await onRefresh();
    } catch (err) {
      setError('Failed to refresh alerts');
      console.error('Alert widget refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismissAlert = (alertId) => {
    setDismissedAlerts(prev => new Set([...prev, alertId]));
  };

  const getAlertTypeConfig = (type) => {
    const typeLower = type?.toLowerCase() || 'info';
    return mergedConfig.alertTypes[typeLower] || mergedConfig.alertTypes.info;
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffMinutes = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
  };

  const renderAlert = (alert, index) => {
    const typeConfig = getAlertTypeConfig(alert.type);
    const alertId = alert.id || index;

    return (
      <div
        key={alertId}
        className={`alert-item ${alert.type?.toLowerCase() || 'info'} ${alert.read ? 'read' : 'unread'}`}
        style={{ borderLeftColor: typeConfig.color }}
      >
        <div className="alert-header">
          <div className="alert-icon-title">
            <i
              className={`alert-icon ${typeConfig.icon}`}
              style={{ color: typeConfig.color }}
            />
            <div className="alert-title-section">
              <span className="alert-title">
                {alert.title || alert.message?.substring(0, 50) || 'Alert'}
              </span>
              {alert.priority && (
                <span className={`priority-badge ${alert.priority.toLowerCase()}`}>
                  {alert.priority.toUpperCase()}
                </span>
              )}
            </div>
          </div>

          {mergedConfig.showDismiss && (
            <button
              className="dismiss-btn"
              onClick={() => handleDismissAlert(alertId)}
              title="Dismiss"
            >
              <i className="fa-solid fa-times" />
            </button>
          )}
        </div>

        {alert.message && alert.title && (
          <div className="alert-message">
            {alert.message}
          </div>
        )}

        <div className="alert-meta">
          {mergedConfig.showTimestamp && alert.timestamp && (
            <span className="meta-item">
              <i className="fa-solid fa-clock" />
              {formatTimestamp(alert.timestamp)}
            </span>
          )}

          {mergedConfig.showSource && alert.source && (
            <span className="meta-item">
              <i className="fa-solid fa-tag" />
              {alert.source}
            </span>
          )}

          {alert.assignee && (
            <span className="meta-item">
              <i className="fa-solid fa-user" />
              {alert.assignee}
            </span>
          )}
        </div>
      </div>
    );
  };

  // Loading state
  if (loading && !data) {
    return (
      <div className="alert-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
        </div>
        <div className="widget-content">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Loading alerts...</span>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="alert-widget">
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

  // No alerts state
  if (!processedAlerts.length) {
    return (
      <div className="alert-widget">
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
            <i className="fa-solid fa-bell" />
            <span>No alerts to display</span>
          </div>
        </div>
      </div>
    );
  }

  const alertCounts = processedAlerts.reduce((counts, alert) => {
    const type = alert.type?.toLowerCase() || 'info';
    counts[type] = (counts[type] || 0) + 1;
    return counts;
  }, {});

  const unreadCount = processedAlerts.filter(alert => !alert.read).length;

  return (
    <div className="alert-widget">
      <div className="widget-header">
        <h3>
          {mergedConfig.title}
          {unreadCount > 0 && (
            <span className="unread-badge">{unreadCount}</span>
          )}
        </h3>
        <div className="widget-actions">
          <button
            className="widget-action-btn"
            onClick={handleRefresh}
            disabled={loading}
            title="Refresh"
          >
            <i className={`fa-solid fa-refresh ${loading ? 'spinning' : ''}`} />
          </button>
          {onConfigure && (
            <button className="widget-action-btn" onClick={onConfigure} title="Configure">
              <i className="fa-solid fa-cog" />
            </button>
          )}
        </div>
      </div>

      <div className="widget-content">
        {Object.keys(alertCounts).length > 1 && (
          <div className="alert-summary">
            <div className="summary-counts">
              {Object.entries(alertCounts).map(([type, count]) => {
                const typeConfig = getAlertTypeConfig(type);
                return (
                  <div key={type} className="count-item">
                    <i
                      className={typeConfig.icon}
                      style={{ color: typeConfig.color }}
                    />
                    <span className="count-label">{type}</span>
                    <span className="count-value">{count}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="alerts-list">
          {processedAlerts.map((alert, index) => renderAlert(alert, index))}
        </div>

        {data && data.length > processedAlerts.length && (
          <div className="widget-meta">
            Showing {processedAlerts.length} of {data.length - dismissedAlerts.size} alerts
            {dismissedAlerts.size > 0 && (
              <span> • {dismissedAlerts.size} dismissed</span>
            )}
          </div>
        )}
      </div>

      {isEditing && (
        <div className="widget-config-preview">
          <span>Max: {mergedConfig.maxAlerts}</span>
          <span>Sort: {mergedConfig.sortBy}</span>
          <span>Auto-refresh: {mergedConfig.autoRefresh ? 'On' : 'Off'}</span>
        </div>
      )}
    </div>
  );
};

AlertWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  config: PropTypes.object,
  data: PropTypes.array,
  onRefresh: PropTypes.func,
  onConfigure: PropTypes.func,
  isEditing: PropTypes.bool
};

export default AlertWidget;
