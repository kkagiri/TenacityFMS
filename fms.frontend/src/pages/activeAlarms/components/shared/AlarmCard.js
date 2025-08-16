import React from 'react';
import { useNavigate } from 'react-router-dom';
import './AlarmCard.scss';

const AlarmCard = ({
  type = 'summary', // 'summary', 'detail', 'compact'
  showActions = true,
  showDetails = true,
  className = '',
  onCardClick = null,
  alarm = null,
  statistics = null
}) => {
  const navigate = useNavigate();

  const handleViewDetails = (alarmId) => {
    if (onCardClick) {
      onCardClick(alarmId);
    } else {
      navigate(`/active-alarms/${alarmId}/details`);
    }
  };

  const handleViewAll = () => {
    navigate('/active-alarms/list');
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'red';
      case 'high': return 'orange';
      case 'medium': return 'yellow';
      case 'low': return 'green';
      default: return 'gray';
    }
  };

  const getAlarmTypeIcon = (alarmType) => {
    switch (alarmType) {
      case 'LowTankVolume':
      case 'HighTankVolume':
      case 'TankLeakDetected':
        return 'fa-light fa-gas-pump';
      case 'DeviceDisconnection':
      case 'DeviceOffline':
      case 'HardwareFailure':
        return 'fa-light fa-microchip';
      case 'UnauthorizedAccess':
        return 'fa-light fa-shield-exclamation';
      case 'SystemFailure':
        return 'fa-light fa-server';
      default:
        return 'fa-light fa-bell';
    }
  };

  // Summary card for dashboard overview
  if (type === 'summary' && statistics) {
    return (
      <div className={`alarm-card summary ${className}`}>
        <div className="alarm-card-header">
          <h3 className="alarm-card-title">
            <i className="fa-light fa-bell-exclamation"></i>
            Active Alarms
          </h3>
          <div className="alarm-card-actions">
            <button
              className="view-all-btn"
              onClick={handleViewAll}
              title="View all alarms"
            >
              <i className="fa-light fa-external-link"></i>
            </button>
          </div>
        </div>

        <div className="alarm-stats-grid">
          <div className="stat-item critical">
            <div className="stat-icon">
              <i className="fa-light fa-triangle-exclamation"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{statistics.Critical || 0}</div>
              <div className="stat-label">Critical</div>
            </div>
          </div>

          <div className="stat-item active">
            <div className="stat-icon">
              <i className="fa-light fa-bell"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{statistics.TotalActive || 0}</div>
              <div className="stat-label">Active</div>
            </div>
          </div>

          <div className="stat-item acknowledged">
            <div className="stat-icon">
              <i className="fa-light fa-check"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{(statistics.TotalActive || 0) - (statistics.Unacknowledged || 0)}</div>
              <div className="stat-label">Acknowledged</div>
            </div>
          </div>

          <div className="stat-item resolved">
            <div className="stat-icon">
              <i className="fa-light fa-check-double"></i>
            </div>
            <div className="stat-content">
              <div className="stat-value">{statistics.ResolvedToday || 0}</div>
              <div className="stat-label">Resolved Today</div>
            </div>
          </div>
        </div>

        {statistics.recentAlarms && statistics.recentAlarms.length > 0 && (
          <div className="recent-alarms">
            <h4>Recent Critical Alarms</h4>
            <div className="recent-alarms-list">
              {statistics.recentAlarms.slice(0, 3).map((alarm) => (
                <div
                  key={alarm.id}
                  className="recent-alarm-item"
                  onClick={() => handleViewDetails(alarm.id)}
                >
                  <div className="alarm-info">
                    <span className={`priority-indicator ${getPriorityColor(alarm.priority)}`}></span>
                    <span className="alarm-message">{alarm.message}</span>
                  </div>
                  <div className="alarm-time">
                    {new Date(alarm.triggeredAt).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Compact card for sidebar or minimal display
  if (type === 'compact' && statistics) {
    return (
      <div className={`alarm-card compact ${className}`}>
        <div className="compact-header">
          <i className="fa-light fa-bell-exclamation"></i>
          <span>Alarms</span>
        </div>
        <div className="compact-stats">
          <div className="compact-stat critical">
            <span className="value">{statistics.Critical || 0}</span>
            <span className="label">Critical</span>
          </div>
          <div className="compact-stat active">
            <span className="value">{statistics.TotalActive || 0}</span>
            <span className="label">Active</span>
          </div>
        </div>
        {showActions && (
          <div className="compact-actions">
            <button onClick={handleViewAll} className="compact-action-btn">
              View All
            </button>
          </div>
        )}
      </div>
    );
  }

  // Detail card for individual alarm
  if (type === 'detail' && alarm) {
    return (
      <div className={`alarm-card detail ${className}`}>
        <div className="alarm-detail-header">
          <div className="alarm-type-info">
            <i className={getAlarmTypeIcon(alarm.alarmType)}></i>
            <div>
              <h4>{alarm.alarmType}</h4>
              <span className="alarm-site">{alarm.site?.name || 'Unknown Site'}</span>
            </div>
          </div>
          <div className="alarm-status">
            <span className={`priority-badge ${getPriorityColor(alarm.priority)}`}>
              {alarm.priority}
            </span>
            <span className={`state-badge ${alarm.state?.toLowerCase()}`}>
              {alarm.state}
            </span>
          </div>
        </div>

        <div className="alarm-content">
          <p className="alarm-message">{alarm.message}</p>
          {alarm.description && (
            <p className="alarm-description">{alarm.description}</p>
          )}
        </div>

        <div className="alarm-meta">
          <div className="meta-item">
            <i className="fa-light fa-clock"></i>
            <span>Triggered: {new Date(alarm.triggeredAt).toLocaleString()}</span>
          </div>
          {alarm.acknowledgedAt && (
            <div className="meta-item">
              <i className="fa-light fa-check"></i>
              <span>Acknowledged: {new Date(alarm.acknowledgedAt).toLocaleString()}</span>
            </div>
          )}
          {alarm.assignedTo && (
            <div className="meta-item">
              <i className="fa-light fa-user"></i>
              <span>Assigned to: {alarm.assignedTo}</span>
            </div>
          )}
        </div>

        {showActions && (
          <div className="alarm-actions">
            <button
              className="action-btn primary"
              onClick={() => handleViewDetails(alarm.id)}
            >
              View Details
            </button>
            {alarm.state === 'Active' && (
              <button className="action-btn secondary">
                Acknowledge
              </button>
            )}
            {alarm.state === 'Acknowledged' && (
              <button className="action-btn success">
                Resolve
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
};

export default AlarmCard;
