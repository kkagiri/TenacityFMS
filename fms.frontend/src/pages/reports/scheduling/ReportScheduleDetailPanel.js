/**
 * File: ReportScheduleDetailPanel.js
 * Purpose: Renders M365-style schedule details inside the schedule side panel.
 * Dependencies: react, reportScheduleDisplayUtils
 * Last Modified: 2026-03-06
 *
 * Key Components:
 * - ReportScheduleDetailPanel: Read-only schedule summary, timing, delivery, and recipient details
 */

import React from 'react';
import {
    formatScheduleDateTime,
    getDeliveryStats,
    getFrequency,
    getRecipients,
    getRecipientStatusBadgeClass,
    getReportLabel,
    getScheduleDetail,
    getStatusBadgeClass,
    getStatusLabel,
} from './reportScheduleDisplayUtils';

const renderValue = (value) => value || '—';

const ReportScheduleDetailPanel = ({ schedule }) => {
    if (!schedule) return null;

    const description = schedule.reportDescription || schedule.description || '';
    const recipients = getRecipients(schedule);
    const deliveryStats = getDeliveryStats(schedule);
    const reportLabel = getReportLabel(schedule);
    const frequency = getFrequency(schedule);
    const scheduleDetail = getScheduleDetail(schedule);
    const format = (schedule.format || schedule.outputFormat || '').toUpperCase() || '—';
    const nextRun = (() => {
        const freq = frequency.toLowerCase();
        const status = String(schedule.status || '').toLowerCase();
        if (freq === 'once' && ['sent', 'completed', 'cancelled', 'failed'].includes(status)) {
            return '—';
        }

        return formatScheduleDateTime(schedule.nextRunAtUtc || schedule.scheduledAt);
    })();
    const lastRun = formatScheduleDateTime(schedule.lastProcessedAtUtc || schedule.sentAt || schedule.lastRunAtUtc || schedule.lastRunAt);
    const createdAt = formatScheduleDateTime(schedule.createdOnUtc || schedule.createdAt || schedule.createdDate);
    const requestedBy = schedule.requestedBy || schedule.createdBy || '—';

    return (
        <div className="sched-mgr__detail-panel-body">
            <div className="sched-mgr__detail-hero">
                <div className="sched-mgr__detail-hero-icon">
                    <i className="fa-light fa-calendar-lines-pen" />
                </div>
                <div className="sched-mgr__detail-hero-content">
                    <span className="sched-mgr__detail-hero-eyebrow">Scheduled report overview</span>
                    <div className="sched-mgr__detail-hero-badges">
                        <span className={getStatusBadgeClass(schedule.status)}>{getStatusLabel(schedule.status)}</span>
                        <span className="m365-badge m365-badge--primary">{reportLabel}</span>
                        <span className="m365-badge m365-badge--neutral">{frequency}</span>
                    </div>
                    <p className="sched-mgr__detail-hero-description">
                        {description || 'Review schedule timing, delivery progress, and recipients from one place.'}
                    </p>
                </div>
            </div>

            <section className="sched-mgr__detail-section">
                <div className="sched-mgr__detail-section-header">
                    <h4 className="sched-mgr__detail-section-title">Schedule overview</h4>
                </div>
                <div className="sched-mgr__detail-grid">
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Report</span>
                        <span className="sched-mgr__detail-value">{reportLabel}</span>
                    </div>
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Format</span>
                        <span className="sched-mgr__detail-value">{format}</span>
                    </div>
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Frequency</span>
                        <span className="sched-mgr__detail-value">{frequency}</span>
                    </div>
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Schedule detail</span>
                        <span className="sched-mgr__detail-value">{scheduleDetail}</span>
                    </div>
                </div>
            </section>

            <section className="sched-mgr__detail-section">
                <div className="sched-mgr__detail-section-header">
                    <h4 className="sched-mgr__detail-section-title">Activity</h4>
                </div>
                <div className="sched-mgr__detail-grid">
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Next run</span>
                        <span className="sched-mgr__detail-value">{nextRun}</span>
                    </div>
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Last run</span>
                        <span className="sched-mgr__detail-value">{lastRun}</span>
                    </div>
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Created</span>
                        <span className="sched-mgr__detail-value">{createdAt}</span>
                    </div>
                    <div className="sched-mgr__detail-item">
                        <span className="sched-mgr__detail-label">Requested by</span>
                        <span className="sched-mgr__detail-value">{requestedBy}</span>
                    </div>
                    <div className="sched-mgr__detail-item sched-mgr__detail-item--full">
                        <span className="sched-mgr__detail-label">Schedule ID</span>
                        <span className="sched-mgr__detail-value sched-mgr__detail-value--mono">{renderValue(schedule.id)}</span>
                    </div>
                </div>
            </section>

            <section className="sched-mgr__detail-section">
                <div className="sched-mgr__detail-section-header">
                    <h4 className="sched-mgr__detail-section-title">Delivery</h4>
                </div>
                <div className="sched-mgr__detail-stats">
                    <div className="sched-mgr__detail-stat">
                        <span className="sched-mgr__detail-stat-value">{deliveryStats.total}</span>
                        <span className="sched-mgr__detail-stat-label">Recipients</span>
                    </div>
                    <div className="sched-mgr__detail-stat sched-mgr__detail-stat--success">
                        <span className="sched-mgr__detail-stat-value">{deliveryStats.delivered}</span>
                        <span className="sched-mgr__detail-stat-label">Delivered</span>
                    </div>
                    <div className="sched-mgr__detail-stat sched-mgr__detail-stat--warning">
                        <span className="sched-mgr__detail-stat-value">{deliveryStats.pending}</span>
                        <span className="sched-mgr__detail-stat-label">Pending</span>
                    </div>
                    <div className="sched-mgr__detail-stat sched-mgr__detail-stat--danger">
                        <span className="sched-mgr__detail-stat-value">{deliveryStats.failed}</span>
                        <span className="sched-mgr__detail-stat-label">Failed</span>
                    </div>
                </div>

                <div className="sched-mgr__detail-recipient-list">
                    <span className="sched-mgr__detail-label">Recipients</span>
                    {recipients.length > 0 ? (
                        <ul className="sched-mgr__detail-recipient-items">
                            {recipients.map((recipient, index) => {
                                const statusLabel = getStatusLabel(recipient.deliveryStatus);
                                const deliveredAt = recipient.deliveredAt || recipient.sentAt;
                                const deliveredLabel = deliveredAt
                                    ? formatScheduleDateTime(deliveredAt)
                                    : '';
                                const key = `${recipient.email || 'recipient'}-${index}`;

                                return (
                                    <li key={key} className="sched-mgr__detail-recipient-item">
                                        <div className="sched-mgr__detail-recipient-main">
                                            <i className="fa-light fa-envelope" />
                                            <span
                                                className="sched-mgr__detail-recipient-email"
                                                title={recipient.email}
                                            >
                                                {recipient.email || '—'}
                                            </span>
                                            <span className={getRecipientStatusBadgeClass(recipient.deliveryStatus)}>
                                                {statusLabel}
                                            </span>
                                        </div>
                                        <div className="sched-mgr__detail-recipient-meta">
                                            {deliveredLabel ? (
                                                <span className="sched-mgr__detail-recipient-meta-item">
                                                    <i className="fa-light fa-paper-plane" />
                                                    <span>Delivered {deliveredLabel}</span>
                                                </span>
                                            ) : (
                                                <span className="sched-mgr__detail-recipient-meta-item sched-mgr__detail-recipient-meta-item--muted">
                                                    <i className="fa-light fa-clock" />
                                                    <span>Not delivered yet</span>
                                                </span>
                                            )}
                                            {recipient.deliveryError ? (
                                                <span
                                                    className="sched-mgr__detail-recipient-meta-item sched-mgr__detail-recipient-meta-item--error"
                                                    title={recipient.deliveryError}
                                                >
                                                    <i className="fa-light fa-triangle-exclamation" />
                                                    <span>{recipient.deliveryError}</span>
                                                </span>
                                            ) : null}
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    ) : (
                        <span className="sched-mgr__detail-empty">No recipients configured.</span>
                    )}
                </div>
            </section>
        </div>
    );
};

export default ReportScheduleDetailPanel;