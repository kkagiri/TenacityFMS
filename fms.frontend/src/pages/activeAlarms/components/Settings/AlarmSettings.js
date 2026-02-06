/**
 * File: AlarmSettings.js
 * Purpose: Alarm system settings — escalation rules, auto-resolve timers, cooldowns,
 *          notification settings, and response time targets. Displays current config from
 *          activeAlarmTypes constants and provides admin actions (process auto-resolve,
 *          process escalation).
 * Dependencies: devextreme-react, Redux (activeAlarmActions), activeAlarmTypes
 * Last Modified: 2026-02-06
 *
 * Key Components:
 * - AlarmSettings: Read-only config display with admin action buttons
 */
import React, { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';

import {
  processAutoResolve,
  processEscalation,
} from '../../../../redux/actions/activeAlarmActions';

import {
  ALARM_PRIORITIES,
  ALARM_STATES,
  AUTO_RESOLVE_DEFAULTS,
  ESCALATION_INTERVALS,
  RESPONSE_TIME_TARGETS,
  NOTIFICATION_SETTINGS,
  PRIORITY_COLORS,
  STATE_COLORS,
  ALARM_CATEGORIES,
  ALARM_TYPE_CATEGORIES,
  ALARM_TYPE_ICONS,
} from '../../../../redux/types/activeAlarmTypes';

import './AlarmSettings.scss';

/* ───────── helpers ───────── */

const formatMinutes = (mins) => {
  if (!mins || mins === 0) return 'Manual only';
  if (mins < 60) return `${mins} min`;
  if (mins < 1440) return `${Math.floor(mins / 60)}h ${mins % 60 ? `${mins % 60}m` : ''}`.trim();
  return `${Math.floor(mins / 1440)}d`;
};

const alarmTypeLabel = (type) => (type || '').replace(/([A-Z])/g, ' $1').trim();

/* ───────── sub-components ───────── */

const SettingCard = ({ icon, title, subtitle, children }) => (
  <div className="setting-card">
    <div className="setting-card-header">
      <i className={`${icon} tw-text-lg`}></i>
      <div>
        <h3 className="tw-text-sm tw-font-semibold tw-text-gray-800">{title}</h3>
        {subtitle && <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5">{subtitle}</p>}
      </div>
    </div>
    <div className="setting-card-body">{children}</div>
  </div>
);

const ConfigRow = ({ label, value, color, hint }) => (
  <div className="config-row">
    <span className="config-label">{label}</span>
    <div className="tw-flex tw-items-center tw-gap-2">
      {color && <span className="config-dot" style={{ background: color }}></span>}
      <span className="config-value">{value}</span>
    </div>
    {hint && <span className="config-hint">{hint}</span>}
  </div>
);

/* ───────── main component ───────── */

const AlarmSettings = () => {
  const dispatch = useDispatch();
  const { loadingStates } = useSelector((s) => s.activeAlarm);
  const [activeSection, setActiveSection] = useState('escalation');

  const sections = [
    { id: 'escalation', label: 'Escalation Rules', icon: 'fa-light fa-arrow-up' },
    { id: 'autoresolve', label: 'Auto-Resolve', icon: 'fa-light fa-timer' },
    { id: 'response', label: 'Response Targets', icon: 'fa-light fa-bullseye' },
    { id: 'notifications', label: 'Notification Settings', icon: 'fa-light fa-bell' },
    { id: 'categories', label: 'Alarm Categories', icon: 'fa-light fa-tags' },
    { id: 'states', label: 'States & Priorities', icon: 'fa-light fa-palette' },
    { id: 'admin', label: 'Admin Actions', icon: 'fa-light fa-shield' },
  ];

  /* ── admin actions ── */
  const handleProcessAutoResolve = useCallback(async () => {
    try {
      await dispatch(processAutoResolve());
      notify('Auto-resolve processing triggered', 'success', 2000);
    } catch {
      notify('Failed to process auto-resolve', 'error', 3000);
    }
  }, [dispatch]);

  const handleProcessEscalation = useCallback(async () => {
    try {
      await dispatch(processEscalation());
      notify('Escalation processing triggered', 'success', 2000);
    } catch {
      notify('Failed to process escalation', 'error', 3000);
    }
  }, [dispatch]);

  /* ── render section ── */
  const renderSection = () => {
    switch (activeSection) {
      case 'escalation':
        return (
          <SettingCard
            icon="fa-light fa-arrow-up"
            title="Escalation Intervals"
            subtitle="Time before unacknowledged alarms escalate to the next level, by priority"
          >
            {Object.entries(ESCALATION_INTERVALS).map(([priority, minutes]) => (
              <ConfigRow
                key={priority}
                label={priority}
                value={formatMinutes(minutes)}
                color={PRIORITY_COLORS[priority]}
              />
            ))}
            <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100">
              <p className="tw-text-xs tw-text-gray-500">
                <i className="fa-light fa-circle-info tw-mr-1"></i>
                When an alarm is not acknowledged within the interval, it automatically escalates
                to the next level and notifies the escalation group.
              </p>
            </div>
          </SettingCard>
        );

      case 'autoresolve':
        return (
          <SettingCard
            icon="fa-light fa-timer"
            title="Auto-Resolve Timers"
            subtitle="Alarms that automatically resolve after a period of inactivity"
          >
            {Object.entries(AUTO_RESOLVE_DEFAULTS).map(([type, minutes]) => (
              <ConfigRow
                key={type}
                label={type === 'DEFAULT' ? 'Default' : alarmTypeLabel(type)}
                value={formatMinutes(minutes)}
                hint={minutes === 0 ? 'Requires manual resolution' : ''}
              />
            ))}
            <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100">
              <p className="tw-text-xs tw-text-gray-500">
                <i className="fa-light fa-circle-info tw-mr-1"></i>
                Auto-resolve runs as a background process. Alarms with 0 minutes require manual
                acknowledgement and resolution.
              </p>
            </div>
          </SettingCard>
        );

      case 'response':
        return (
          <SettingCard
            icon="fa-light fa-bullseye"
            title="Response Time Targets"
            subtitle="Target time to acknowledge an alarm, by priority level"
          >
            {Object.entries(RESPONSE_TIME_TARGETS).map(([priority, minutes]) => (
              <ConfigRow
                key={priority}
                label={priority}
                value={formatMinutes(minutes)}
                color={PRIORITY_COLORS[priority]}
              />
            ))}
            <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100">
              <p className="tw-text-xs tw-text-gray-500">
                <i className="fa-light fa-circle-info tw-mr-1"></i>
                These are target SLA times for first response. Alarms exceeding these targets
                may trigger escalation.
              </p>
            </div>
          </SettingCard>
        );

      case 'notifications':
        return (
          <SettingCard
            icon="fa-light fa-bell"
            title="Notification Behaviour"
            subtitle="Global notification settings for the alarm system"
          >
            <ConfigRow
              label="Disable fallback to all users"
              value={NOTIFICATION_SETTINGS.DISABLE_FALLBACK_ALL_USERS ? 'Yes' : 'No'}
            />
            <ConfigRow
              label="Auto-suppress duplicates"
              value={NOTIFICATION_SETTINGS.AUTO_SUPPRESS_DUPLICATES ? 'Yes' : 'No'}
            />
            <ConfigRow
              label="Max notifications per hour"
              value={NOTIFICATION_SETTINGS.MAX_NOTIFICATIONS_PER_HOUR}
            />
            <ConfigRow
              label="Batch notification delay"
              value={`${NOTIFICATION_SETTINGS.BATCH_NOTIFICATION_DELAY}s (${Math.floor(NOTIFICATION_SETTINGS.BATCH_NOTIFICATION_DELAY / 60)} min)`}
            />
            <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100">
              <p className="tw-text-xs tw-text-gray-500">
                <i className="fa-light fa-circle-info tw-mr-1"></i>
                To change notification delivery channels, recipients, and templates, go to the
                <strong> Notification Policies</strong> section in Admin → Notifications.
              </p>
            </div>
          </SettingCard>
        );

      case 'categories':
        return (
          <SettingCard
            icon="fa-light fa-tags"
            title="Alarm Type Categories"
            subtitle="How alarm types are grouped across the system"
          >
            {Object.entries(ALARM_CATEGORIES).map(([key, label]) => {
              const types = Object.entries(ALARM_TYPE_CATEGORIES)
                .filter(([, cat]) => cat === label)
                .map(([type]) => type);
              return (
                <div key={key} className="category-group">
                  <div className="category-header">
                    <span className="tw-font-semibold tw-text-sm tw-text-gray-800">{label}</span>
                    <span className="tw-text-xs tw-text-gray-400">{types.length} types</span>
                  </div>
                  <div className="category-types">
                    {types.map((t) => (
                      <span key={t} className="type-chip">
                        <i className={`${ALARM_TYPE_ICONS[t] || 'fa-light fa-bell'} tw-mr-1`}></i>
                        {alarmTypeLabel(t)}
                      </span>
                    ))}
                    {types.length === 0 && (
                      <span className="tw-text-xs tw-text-gray-400 tw-italic">No types mapped</span>
                    )}
                  </div>
                </div>
              );
            })}
          </SettingCard>
        );

      case 'states':
        return (
          <SettingCard
            icon="fa-light fa-palette"
            title="States & Priorities"
            subtitle="Visual indicators used throughout the alarm system"
          >
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-mb-2 tw-tracking-wide">
              Alarm States
            </h4>
            {Object.entries(ALARM_STATES).map(([key, val]) => (
              <ConfigRow
                key={key}
                label={val}
                value={key}
                color={STATE_COLORS[val]}
              />
            ))}
            <div className="tw-my-4 tw-border-t tw-border-gray-100"></div>
            <h4 className="tw-text-xs tw-font-semibold tw-text-gray-500 tw-uppercase tw-mb-2 tw-tracking-wide">
              Priority Levels
            </h4>
            {Object.entries(ALARM_PRIORITIES).map(([key, val]) => (
              <ConfigRow
                key={key}
                label={val}
                value={key}
                color={PRIORITY_COLORS[val]}
              />
            ))}
          </SettingCard>
        );

      case 'admin':
        return (
          <SettingCard
            icon="fa-light fa-shield"
            title="Admin Actions"
            subtitle="Manually trigger background alarm processing"
          >
            <div className="admin-actions">
              <div className="admin-action-item">
                <div>
                  <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800">Process Auto-Resolve</h4>
                  <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                    Scan all active alarms and auto-resolve those that have exceeded their auto-resolve timer.
                    This normally runs automatically every 5 minutes.
                  </p>
                </div>
                <button
                  className="admin-btn tw-bg-green-600"
                  onClick={handleProcessAutoResolve}
                  disabled={loadingStates?.processingAutoResolve}
                >
                  {loadingStates?.processingAutoResolve ? (
                    <><i className="fa-light fa-spinner-third fa-spin tw-mr-1"></i> Processing…</>
                  ) : (
                    <><i className="fa-light fa-timer tw-mr-1"></i> Run Now</>
                  )}
                </button>
              </div>

              <div className="admin-action-item">
                <div>
                  <h4 className="tw-text-sm tw-font-semibold tw-text-gray-800">Process Escalation</h4>
                  <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
                    Scan unacknowledged alarms and escalate those exceeding their interval.
                    This normally runs automatically every 5 minutes.
                  </p>
                </div>
                <button
                  className="admin-btn tw-bg-orange-600"
                  onClick={handleProcessEscalation}
                  disabled={loadingStates?.processingEscalation}
                >
                  {loadingStates?.processingEscalation ? (
                    <><i className="fa-light fa-spinner-third fa-spin tw-mr-1"></i> Processing…</>
                  ) : (
                    <><i className="fa-light fa-arrow-up tw-mr-1"></i> Run Now</>
                  )}
                </button>
              </div>
            </div>

            <div className="tw-mt-4 tw-pt-3 tw-border-t tw-border-gray-100">
              <p className="tw-text-xs tw-text-gray-500">
                <i className="fa-light fa-circle-info tw-mr-1"></i>
                These actions are idempotent — running them multiple times is safe. They process
                the same logic as the background service.
              </p>
            </div>
          </SettingCard>
        );

      default:
        return null;
    }
  };

  return (
    <div className="alarm-settings">
      <div className="settings-layout">
        {/* Section Navigation */}
        <div className="settings-nav">
          {sections.map((s) => (
            <button
              key={s.id}
              className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`}
              onClick={() => setActiveSection(s.id)}
            >
              <i className={s.icon}></i>
              <span>{s.label}</span>
            </button>
          ))}
        </div>

        {/* Section Content */}
        <div className="settings-content">
          {renderSection()}
        </div>
      </div>
    </div>
  );
};

export default AlarmSettings;
