import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './ProgressListWidget.css';

/**
 * Progress List Widget Component
 * Displays list of items with progress status, completion rates, and priority indicators
 */
const ProgressListWidget = ({
  widgetId,
  config = {},
  data = null,
  onRefresh,
  onConfigure,
  isEditing = false
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [processedData, setProcessedData] = useState([]);

  // Default configuration
  const defaultConfig = {
    title: 'Progress List',
    showProgress: true,
    showStatus: true,
    showPriority: true,
    maxItems: 10,
    sortBy: 'priority', // priority, progress, name, status
    sortOrder: 'desc',
    showCompleted: true,
    progressFormat: 'percentage', // percentage, fraction
    statusColors: {
      completed: '#28a745',
      inProgress: '#007bff',
      pending: '#ffc107',
      failed: '#dc3545',
      cancelled: '#6c757d'
    },
    priorityColors: {
      high: '#dc3545',
      medium: '#ffc107',
      low: '#28a745'
    }
  };

  const mergedConfig = { ...defaultConfig, ...config };

  // Process and sort data
  useEffect(() => {
    if (!data || !Array.isArray(data)) {
      setProcessedData([]);
      return;
    }

    let processed = [...data].slice(0, mergedConfig.maxItems);

    // Apply sorting
    processed.sort((a, b) => {
      let aVal, bVal;

      switch (mergedConfig.sortBy) {
        case 'priority':
          const priorityOrder = { high: 3, medium: 2, low: 1 };
          aVal = priorityOrder[a.priority?.toLowerCase()] || 0;
          bVal = priorityOrder[b.priority?.toLowerCase()] || 0;
          break;
        case 'progress':
          aVal = parseFloat(a.progress) || 0;
          bVal = parseFloat(b.progress) || 0;
          break;
        case 'name':
          aVal = a.name?.toLowerCase() || '';
          bVal = b.name?.toLowerCase() || '';
          break;
        case 'status':
          aVal = a.status?.toLowerCase() || '';
          bVal = b.status?.toLowerCase() || '';
          break;
        default:
          aVal = a.id || 0;
          bVal = b.id || 0;
      }

      if (mergedConfig.sortOrder === 'desc') {
        return bVal > aVal ? 1 : bVal < aVal ? -1 : 0;
      } else {
        return aVal > bVal ? 1 : aVal < bVal ? -1 : 0;
      }
    });

    // Filter completed items if needed
    if (!mergedConfig.showCompleted) {
      processed = processed.filter(item =>
        item.status?.toLowerCase() !== 'completed'
      );
    }

    setProcessedData(processed);
  }, [data, mergedConfig.maxItems, mergedConfig.sortBy, mergedConfig.sortOrder, mergedConfig.showCompleted]);

  const handleRefresh = async () => {
    if (!onRefresh) return;

    setLoading(true);
    setError(null);

    try {
      await onRefresh();
    } catch (err) {
      setError('Failed to refresh data');
      console.error('Progress list widget refresh error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    const statusLower = status?.toLowerCase();
    switch (statusLower) {
      case 'completed':
        return 'fa-solid fa-check-circle';
      case 'failed':
      case 'error':
        return 'fa-solid fa-times-circle';
      case 'inprogress':
      case 'in-progress':
      case 'running':
        return 'fa-solid fa-spinner';
      case 'pending':
      case 'waiting':
        return 'fa-solid fa-clock';
      default:
        return 'fa-solid fa-clock';
    }
  };

  const getStatusColor = (status) => {
    const statusLower = status?.toLowerCase();
    return mergedConfig.statusColors[statusLower] || mergedConfig.statusColors.pending;
  };

  const getPriorityColor = (priority) => {
    const priorityLower = priority?.toLowerCase();
    return mergedConfig.priorityColors[priorityLower] || mergedConfig.priorityColors.low;
  };

  const formatProgress = (progress) => {
    const numericProgress = parseFloat(progress) || 0;

    if (mergedConfig.progressFormat === 'fraction') {
      const completed = Math.round(numericProgress);
      return `${completed}/100`;
    }

    return `${numericProgress.toFixed(0)}%`;
  };

  const renderProgressBar = (progress) => {
    const numericProgress = Math.max(0, Math.min(100, parseFloat(progress) || 0));
    const progressClass = numericProgress >= 100 ? 'complete' :
                         numericProgress >= 75 ? 'high' :
                         numericProgress >= 25 ? 'medium' : 'low';

    return (
      <div className="progress-bar-container">
        <div className={`progress-bar ${progressClass}`}>
          <div
            className="progress-fill"
            style={{ width: `${numericProgress}%` }}
          />
        </div>
        <span className="progress-text">{formatProgress(progress)}</span>
      </div>
    );
  };

  const renderListItem = (item, index) => {
    const statusIcon = getStatusIcon(item.status);
    const statusColor = getStatusColor(item.status);
    const priorityColor = getPriorityColor(item.priority);

    return (
      <div key={item.id || index} className="progress-list-item">
        <div className="item-header">
          <div className="item-title-section">
            {mergedConfig.showStatus && (
              <i
                className={`${statusIcon} status-icon ${item.status?.toLowerCase() === 'inprogress' ? 'fa-spin' : ''}`}
                style={{ color: statusColor }}
              />
            )}
            <span className="item-name" title={item.name}>
              {item.name || `Item ${index + 1}`}
            </span>
          </div>

          {mergedConfig.showPriority && item.priority && (
            <span
              className="priority-badge"
              style={{ backgroundColor: priorityColor }}
            >
              {item.priority.toUpperCase()}
            </span>
          )}
        </div>

        {item.description && (
          <div className="item-description" title={item.description}>
            {item.description}
          </div>
        )}

        {mergedConfig.showProgress && item.progress !== undefined && (
          <div className="item-progress">
            {renderProgressBar(item.progress)}
          </div>
        )}

        <div className="item-meta">
          {item.startDate && (
            <span className="meta-item">Started: {new Date(item.startDate).toLocaleDateString()}</span>
          )}
          {item.dueDate && (
            <span className="meta-item">Due: {new Date(item.dueDate).toLocaleDateString()}</span>
          )}
          {item.assignee && (
            <span className="meta-item">Assignee: {item.assignee}</span>
          )}
        </div>
      </div>
    );
  };

  if (loading && !data) {
    return (
      <div className="progress-list-widget">
        <div className="widget-header">
          <h3>{mergedConfig.title}</h3>
        </div>
        <div className="widget-content">
          <div className="loading-state">
            <div className="loading-spinner" />
            <span>Loading progress data...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="progress-list-widget">
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

  if (!processedData.length) {
    return (
      <div className="progress-list-widget">
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
            <i className="fa-solid fa-refresh" />
            <span>No progress items to display</span>
          </div>
        </div>
      </div>
    );
  }

  const completedCount = processedData.filter(item =>
    item.status?.toLowerCase() === 'completed'
  ).length;

  const inProgressCount = processedData.filter(item =>
    item.status?.toLowerCase() === 'inprogress' ||
    item.status?.toLowerCase() === 'in-progress' ||
    item.status?.toLowerCase() === 'running'
  ).length;

  const averageProgress = processedData.reduce((sum, item) =>
    sum + (parseFloat(item.progress) || 0), 0
  ) / processedData.length;

  return (
    <div className="progress-list-widget">
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
        <div className="progress-summary">
          <div className="summary-stats">
            <div className="stat-item">
              <span className="label">Total Items</span>
              <span className="value">{processedData.length}</span>
            </div>
            <div className="stat-item">
              <span className="label">Completed</span>
              <span className="value completed">{completedCount}</span>
            </div>
            <div className="stat-item">
              <span className="label">In Progress</span>
              <span className="value in-progress">{inProgressCount}</span>
            </div>
            <div className="stat-item">
              <span className="label">Avg Progress</span>
              <span className="value">{averageProgress.toFixed(0)}%</span>
            </div>
          </div>
        </div>

        <div className="progress-list">
          {processedData.map((item, index) => renderListItem(item, index))}
        </div>

        {data && data.length > mergedConfig.maxItems && (
          <div className="widget-meta">
            Showing {processedData.length} of {data.length} items
          </div>
        )}
      </div>

      {isEditing && (
        <div className="widget-config-preview">
          <span>Sort: {mergedConfig.sortBy} ({mergedConfig.sortOrder})</span>
          <span>Max: {mergedConfig.maxItems}</span>
        </div>
      )}
    </div>
  );
};

ProgressListWidget.propTypes = {
  widgetId: PropTypes.string.isRequired,
  config: PropTypes.object,
  data: PropTypes.array,
  onRefresh: PropTypes.func,
  onConfigure: PropTypes.func,
  isEditing: PropTypes.bool
};

export default ProgressListWidget;

