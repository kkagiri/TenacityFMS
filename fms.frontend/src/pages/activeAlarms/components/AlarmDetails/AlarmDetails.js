/**
 * File: AlarmDetails.js
 * Purpose: Displays full detail view for a single ActiveAlarm including header,
 *          info card, threshold data, timeline, action buttons, and resolution notes.
 * Dependencies: devextreme-react, Redux (activeAlarmActions), activeAlarmTypes, react-router
 * Last Modified: 2026-02-06
 *
 * Key Components:
 * - AlarmDetails: Main detail page fetched by route param :id
 */
import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Popup } from 'devextreme-react/popup';
import { TextArea } from 'devextreme-react/text-area';
import notify from 'devextreme/ui/notify';

import {
  fetchAlarmById,
  acknowledgeAlarm,
  resolveAlarm,
  suppressAlarm,
  escalateAlarm,
} from '../../../../redux/actions/activeAlarmActions';

import {
  ALARM_STATES,
  PRIORITY_COLORS,
  STATE_COLORS,
  ALARM_TYPE_ICONS,
  DEFAULT_ICONS,
} from '../../../../redux/types/activeAlarmTypes';

import { activeAlarmRoutes } from '../../utils/navigationHelper';
import './AlarmDetails.scss';

/* ───────── helpers ───────── */

const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  return d.toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  });
};

const timeSince = (dateStr) => {
  if (!dateStr) return '';
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h ago`;
};

const formatDuration = (start, end) => {
  if (!start || !end) return '—';
  const ms = new Date(end).getTime() - new Date(start).getTime();
  const minutes = Math.floor(ms / 60000);
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ${minutes % 60}m`;
  const days = Math.floor(hours / 24);
  return `${days}d ${hours % 24}h`;
};

const getIcon = (type) => ALARM_TYPE_ICONS[type] || 'fa-light fa-bell';

const triggerSourceIcon = (src) => {
  const map = {
    Hardware: 'fa-light fa-microchip',
    System: 'fa-light fa-server',
    Manual: 'fa-light fa-user',
    Policy: 'fa-light fa-file-shield',
  };
  return map[src] || 'fa-light fa-circle-question';
};

const parseJson = (str) => {
  if (!str) return null;
  try { return typeof str === 'object' ? str : JSON.parse(str); } catch { return null; }
};

/* ───────── sub-components ───────── */

const InfoRow = ({ label, icon, value }) => (
  <div className="info-row">
    <span className="info-label"><i className={`${icon} tw-mr-1`}></i>{label}</span>
    <span className="info-value">{value}</span>
  </div>
);

const StatItem = ({ label, value }) => (
  <div className="stat-item">
    <span className="stat-label">{label}</span>
    <span className="stat-value">{value}</span>
  </div>
);

/* ───────── main component ───────── */

const AlarmDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const { currentAlarm: alarm, loadingStates, errors } = useSelector((s) => s.activeAlarm);
  const loading = loadingStates?.fetchingAlarmDetails;

  const [actionPopup, setActionPopup] = useState({ visible: false, type: null });
  const [notes, setNotes] = useState('');

  /* ── fetch on mount ── */
  useEffect(() => {
    if (id) dispatch(fetchAlarmById(id));
  }, [id, dispatch]);

  /* ── action handlers ── */
  const openAction = useCallback((type) => {
    setNotes('');
    setActionPopup({ visible: true, type });
  }, []);

  const closeAction = useCallback(() => setActionPopup({ visible: false, type: null }), []);

  const submitAction = useCallback(async () => {
    const { type } = actionPopup;
    try {
      if (type === 'acknowledge') {
        await dispatch(acknowledgeAlarm(alarm.id, notes));
      } else if (type === 'resolve') {
        if (!notes.trim()) { notify('Resolution notes are required', 'warning', 2500); return; }
        await dispatch(resolveAlarm(alarm.id, notes));
      } else if (type === 'suppress') {
        await dispatch(suppressAlarm(alarm.id));
      } else if (type === 'escalate') {
        await dispatch(escalateAlarm(alarm.id, notes));
      }
      notify(`Alarm ${type}d successfully`, 'success', 2000);
      closeAction();
      dispatch(fetchAlarmById(id));
    } catch {
      notify(`Failed to ${type} alarm`, 'error', 3000);
    }
  }, [actionPopup, alarm, notes, dispatch, id, closeAction]);

  /* ── loading state ── */
  if (loading) {
    return (
      <div className="alarm-details-loading tw-flex tw-items-center tw-justify-center tw-py-20">
        <i className="fa-light fa-spinner-third fa-spin tw-text-3xl tw-text-blue-500 tw-mr-3"></i>
        <span className="tw-text-gray-500 tw-text-lg">Loading alarm details…</span>
      </div>
    );
  }

  /* ── not found / error ── */
  if (!alarm) {
    return (
      <div className="tw-text-center tw-py-20">
        <i className="fa-light fa-triangle-exclamation tw-text-5xl tw-text-gray-400 tw-mb-4"></i>
        <p className="tw-text-gray-500 tw-text-lg">
          {errors?.fetch ? `Error: ${errors.fetch}` : 'Alarm not found'}
        </p>
        <button className="tw-mt-4 tw-text-blue-600 hover:tw-underline" onClick={() => navigate(activeAlarmRoutes.alarmList)}>
          <i className="fa-light fa-arrow-left tw-mr-1"></i> Back to Alarm List
        </button>
      </div>
    );
  }

  /* ── derived values ── */
  const priorityColor = PRIORITY_COLORS[alarm.priority] || '#6c757d';
  const stateColor = STATE_COLORS[alarm.state] || '#6c757d';
  const additionalData = parseJson(alarm.additionalData);
  const isActive = alarm.state === ALARM_STATES.Active;
  const isAcknowledged = alarm.state === ALARM_STATES.Acknowledged;
  const isResolved = alarm.state === ALARM_STATES.Resolved;
  const isSuppressed = alarm.state === ALARM_STATES.Suppressed;

  /* ── build timeline ── */
  const timeline = [];
  timeline.push({ icon: 'fa-light fa-bolt', label: 'Triggered', date: alarm.triggeredAt, color: '#dc3545', detail: `Source: ${alarm.triggerSource}` });
  if (alarm.acknowledgedAt) timeline.push({ icon: 'fa-light fa-check', label: 'Acknowledged', date: alarm.acknowledgedAt, color: '#ffc107', detail: `By: ${alarm.acknowledgedBy || '—'}` });
  if (alarm.lastEscalatedAt) timeline.push({ icon: 'fa-light fa-arrow-up', label: `Escalated (Level ${alarm.escalationLevel})`, date: alarm.lastEscalatedAt, color: '#fd7e14', detail: '' });
  if (alarm.resolvedAt) timeline.push({ icon: 'fa-light fa-check-double', label: 'Resolved', date: alarm.resolvedAt, color: '#28a745', detail: `By: ${alarm.resolvedBy || '—'}` });

  /* ── render ── */
  return (
    <div className="alarm-details">
      {/* Back Button */}
      <button className="tw-mb-4 tw-text-blue-600 hover:tw-underline tw-text-sm tw-bg-transparent tw-border-0 tw-cursor-pointer" onClick={() => navigate(activeAlarmRoutes.alarmList)}>
        <i className="fa-light fa-arrow-left tw-mr-1"></i> Back to Alarm List
      </button>

      {/* ── Header Card ── */}
      <div className="detail-header" style={{ borderLeftColor: priorityColor }}>
        <div className="tw-flex tw-items-start tw-justify-between tw-flex-wrap tw-gap-3">
          <div className="tw-flex tw-items-center tw-gap-3">
            <div className="header-icon" style={{ background: `${priorityColor}15`, color: priorityColor }}>
              <i className={getIcon(alarm.alarmType)}></i>
            </div>
            <div>
              <h2 className="tw-text-xl tw-font-bold tw-text-gray-900 tw-mb-1">
                {(alarm.alarmType || '').replace(/([A-Z])/g, ' $1').trim()}
              </h2>
              <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                <span className="badge" style={{ background: priorityColor }}>{alarm.priority}</span>
                <span className="badge" style={{ background: stateColor }}>{alarm.state}</span>
                <span className="tw-text-gray-400 tw-text-sm">ID: #{alarm.id}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="tw-flex tw-gap-2 tw-flex-wrap">
            {isActive && (
              <button className="action-btn acknowledge" onClick={() => openAction('acknowledge')}>
                <i className={DEFAULT_ICONS?.ACKNOWLEDGE || 'fa-light fa-check'}></i> Acknowledge
              </button>
            )}
            {(isActive || isAcknowledged) && (
              <button className="action-btn resolve" onClick={() => openAction('resolve')}>
                <i className={DEFAULT_ICONS?.RESOLVE || 'fa-light fa-check-double'}></i> Resolve
              </button>
            )}
            {(isActive || isAcknowledged) && (
              <button className="action-btn suppress" onClick={() => openAction('suppress')}>
                <i className={DEFAULT_ICONS?.SUPPRESS || 'fa-light fa-volume-mute'}></i> Suppress
              </button>
            )}
            {(isActive || isAcknowledged) && (
              <button className="action-btn escalate" onClick={() => openAction('escalate')}>
                <i className={DEFAULT_ICONS?.ESCALATE || 'fa-light fa-arrow-up'}></i> Escalate
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Body Grid ── */}
      <div className="detail-grid">
        {/* Left Column */}
        <div className="detail-left">
          {/* Message */}
          <div className="detail-card">
            <h3 className="card-title"><i className="fa-light fa-message tw-mr-2"></i>Message</h3>
            <p className="tw-text-gray-800 tw-text-sm tw-leading-relaxed">{alarm.message}</p>
            {alarm.description && (
              <p className="tw-text-gray-500 tw-text-sm tw-mt-2 tw-italic">{alarm.description}</p>
            )}
          </div>

          {/* Info */}
          <div className="detail-card">
            <h3 className="card-title"><i className="fa-light fa-circle-info tw-mr-2"></i>Information</h3>
            <div className="info-grid">
              <InfoRow label="Trigger Source" icon={triggerSourceIcon(alarm.triggerSource)} value={alarm.triggerSource} />
              <InfoRow label="Site" icon="fa-light fa-location-dot" value={alarm.site?.name || alarm.siteName || (alarm.siteId ? `Site #${alarm.siteId}` : '—')} />
              <InfoRow label="Tank" icon="fa-light fa-oil-can" value={alarm.tank?.name || alarm.tankName || (alarm.tankId ? `Tank #${alarm.tankId}` : '—')} />
              {alarm.ptsDeviceId && <InfoRow label="PTS Device" icon="fa-light fa-microchip" value={alarm.ptsDeviceId} />}
              <InfoRow label="Triggered" icon="fa-light fa-clock" value={`${formatDate(alarm.triggeredAt)} (${timeSince(alarm.triggeredAt)})`} />
              {alarm.autoResolveMinutes > 0 && <InfoRow label="Auto-Resolve" icon="fa-light fa-timer" value={`${alarm.autoResolveMinutes} minutes`} />}
              <InfoRow label="Escalation Level" icon="fa-light fa-arrow-up" value={alarm.escalationLevel || 0} />
              <InfoRow label="Notifications" icon="fa-light fa-bell" value={alarm.suppressNotifications ? 'Suppressed' : 'Enabled'} />
            </div>
          </div>

          {/* Threshold (conditional) */}
          {(alarm.thresholdValue != null || alarm.actualValue != null) && (
            <div className="detail-card">
              <h3 className="card-title"><i className="fa-light fa-gauge tw-mr-2"></i>Threshold Data</h3>
              <div className="threshold-grid">
                {alarm.thresholdValue != null && (
                  <div className="threshold-item">
                    <span className="threshold-label">Threshold</span>
                    <span className="threshold-value">{alarm.thresholdValue} {alarm.unitOfMeasure || ''}</span>
                  </div>
                )}
                {alarm.actualValue != null && (
                  <div className="threshold-item">
                    <span className="threshold-label">Actual Value</span>
                    <span className="threshold-value tw-font-bold" style={{ color: priorityColor }}>
                      {alarm.actualValue} {alarm.unitOfMeasure || ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Additional Data (JSON) */}
          {additionalData && Object.keys(additionalData).length > 0 && (
            <div className="detail-card">
              <h3 className="card-title"><i className="fa-light fa-code tw-mr-2"></i>Additional Data</h3>
              <div className="additional-data">
                {Object.entries(additionalData).map(([key, value]) => (
                  <div key={key} className="data-row">
                    <span className="data-key">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    <span className="data-value">{typeof value === 'object' ? JSON.stringify(value) : String(value ?? '—')}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Resolution Notes */}
          {alarm.resolutionNotes && (
            <div className="detail-card">
              <h3 className="card-title"><i className="fa-light fa-note-sticky tw-mr-2"></i>Resolution Notes</h3>
              <p className="tw-text-gray-700 tw-text-sm tw-whitespace-pre-wrap">{alarm.resolutionNotes}</p>
            </div>
          )}
        </div>

        {/* Right Column — Timeline & Quick Info */}
        <div className="detail-right">
          <div className="detail-card">
            <h3 className="card-title"><i className="fa-light fa-timeline tw-mr-2"></i>Timeline</h3>
            <div className="timeline">
              {timeline.map((entry, idx) => (
                <div key={idx} className="timeline-entry">
                  <div className="timeline-dot" style={{ background: entry.color }}>
                    <i className={entry.icon}></i>
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-label">{entry.label}</span>
                    <span className="timeline-date">{formatDate(entry.date)}</span>
                    <span className="timeline-ago">{timeSince(entry.date)}</span>
                    {entry.detail && <span className="timeline-detail">{entry.detail}</span>}
                  </div>
                </div>
              ))}
              {!isResolved && !isSuppressed && (
                <div className="timeline-entry pending">
                  <div className="timeline-dot" style={{ background: '#ccc' }}>
                    <i className="fa-light fa-hourglass"></i>
                  </div>
                  <div className="timeline-content">
                    <span className="timeline-label tw-text-gray-400">Awaiting resolution…</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="detail-card">
            <h3 className="card-title"><i className="fa-light fa-chart-simple tw-mr-2"></i>Quick Info</h3>
            <div className="quick-stats">
              <StatItem label="Time Open" value={isResolved ? formatDuration(alarm.triggeredAt, alarm.resolvedAt) : timeSince(alarm.triggeredAt)} />
              {alarm.acknowledgedAt && !isResolved && (
                <StatItem label="Time Since Ack" value={timeSince(alarm.acknowledgedAt)} />
              )}
              {alarm.resolvedAt && alarm.triggeredAt && (
                <StatItem label="Resolution Time" value={formatDuration(alarm.triggeredAt, alarm.resolvedAt)} />
              )}
              <StatItem label="Escalation Level" value={alarm.escalationLevel || 0} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Action Popup ── */}
      <Popup
        visible={actionPopup.visible}
        onHiding={closeAction}
        title={`${(actionPopup.type || '').charAt(0).toUpperCase() + (actionPopup.type || '').slice(1)} Alarm`}
        width={420}
        height="auto"
        showCloseButton
        dragEnabled={false}
      >
        <div className="tw-p-2">
          <p className="tw-text-gray-600 tw-text-sm tw-mb-3">
            {actionPopup.type === 'resolve'
              ? 'Please provide resolution notes (required):'
              : `Optionally add notes for this ${actionPopup.type}:`}
          </p>
          <TextArea
            value={notes}
            onValueChanged={(e) => setNotes(e.value)}
            placeholder={actionPopup.type === 'resolve' ? 'Describe how the alarm was resolved…' : 'Add notes (optional)…'}
            height={100}
          />
          <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-4">
            <button className="tw-px-4 tw-py-2 tw-rounded tw-border tw-border-gray-300 tw-text-gray-600 hover:tw-bg-gray-50 tw-bg-white tw-cursor-pointer" onClick={closeAction}>
              Cancel
            </button>
            <button
              className="tw-px-4 tw-py-2 tw-rounded tw-text-white tw-border-0 tw-cursor-pointer"
              style={{ background: actionPopup.type === 'resolve' ? '#28a745' : actionPopup.type === 'escalate' ? '#fd7e14' : '#0d6efd' }}
              onClick={submitAction}
            >
              Confirm {actionPopup.type}
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default AlarmDetails;
