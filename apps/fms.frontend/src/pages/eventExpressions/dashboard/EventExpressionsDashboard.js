/**
 * File: EventExpressionsDashboard.js
 * Purpose: Dashboard overview for the Event Engine module showing stats cards,
 *          severity breakdown, recent activity, and quick-action links.
 * Dependencies: react, react-redux, react-router-dom, activeEventApi, eventExpressionSlice
 * Last Modified: 2026-02-18
 *
 * Key Features:
 * - Summary stat cards (active, acknowledged, resolved, total expressions)
 * - Severity breakdown with color-coded bars
 * - Event type distribution
 * - Recent events quick-list
 * - Quick-action shortcuts
 */

import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventExpressions } from '../../../redux/slices/eventExpressionSlice';
import activeEventApi from '../../../dataservice/activeEventApi';
import './EventExpressionsDashboard.scss';

const EventExpressionsDashboard = () => {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const { expressions, loading: expressionsLoading } = useSelector(
        (state) => state.eventExpressions
    );

    const [stats, setStats] = useState(null);
    const [recentEvents, setRecentEvents] = useState([]);
    const [statsLoading, setStatsLoading] = useState(true);
    const [statsError, setStatsError] = useState(null);

    // Fetch data on mount
    useEffect(() => {
        dispatch(fetchEventExpressions({ isActive: null, take: 100 }));
        loadDashboardData();
    }, [dispatch]);

    const loadDashboardData = useCallback(async () => {
        setStatsLoading(true);
        setStatsError(null);
        try {
            const [statsRes, eventsRes] = await Promise.all([
                activeEventApi.getActiveEventStats(),
                activeEventApi.getActiveEvents({ take: 8, state: 'Active' }),
            ]);
            const raw = statsRes?.data || statsRes;

            // Normalize bySeverity: API returns [{severity, count}] array → { label: count }
            let bySeverity = {};
            if (Array.isArray(raw?.bySeverity)) {
                for (const item of raw.bySeverity) {
                    bySeverity[item.severity || item.Severity || 'Unknown'] = item.count ?? item.Count ?? 0;
                }
            } else if (raw?.bySeverity && typeof raw.bySeverity === 'object') {
                bySeverity = raw.bySeverity;
            }

            // Normalize byEventType: API returns [{eventType, count}] array → { type: count }
            let byEventType = {};
            if (Array.isArray(raw?.byEventType)) {
                for (const item of raw.byEventType) {
                    byEventType[item.eventType || item.EventType || 'Unknown'] = item.count ?? item.Count ?? 0;
                }
            } else if (raw?.byEventType && typeof raw.byEventType === 'object') {
                byEventType = raw.byEventType;
            }

            setStats({
                total: raw?.total ?? 0,
                active: raw?.active ?? 0,
                acknowledged: raw?.acknowledged ?? 0,
                resolved: raw?.resolved ?? 0,
                bySeverity,
                byEventType,
            });

            const eventsList = eventsRes?.data || eventsRes;
            setRecentEvents(Array.isArray(eventsList) ? eventsList : []);
        } catch (err) {
            console.error('[EventDashboard] Failed to load stats:', err);
            setStatsError('Failed to load dashboard data');
        } finally {
            setStatsLoading(false);
        }
    }, []);

    // ── Derived stats ───────────────────────────────
    const totalExpressions = expressions?.length || 0;
    const activeExpressions = expressions?.filter((e) => e.isActive)?.length || 0;
    const activeCount = stats?.active || 0;
    const acknowledgedCount = stats?.acknowledged || 0;
    const resolvedCount = stats?.resolved || 0;
    const totalEvents = stats?.total || 0;

    const severityData = stats?.bySeverity || {};
    const eventTypeData = stats?.byEventType || {};

    // ── Severity color map ──────────────────────────
    const severityMeta = {
        Critical: { color: '#ef4444', bg: '#fef2f2', icon: 'fa-light fa-octagon-exclamation' },
        High: { color: '#f97316', bg: '#fff7ed', icon: 'fa-light fa-triangle-exclamation' },
        Medium: { color: '#eab308', bg: '#fefce8', icon: 'fa-light fa-circle-exclamation' },
        Low: { color: '#3b82f6', bg: '#eff6ff', icon: 'fa-light fa-info-circle' },
    };

    // ── Helpers ─────────────────────────────────────
    const formatTimeAgo = (dateStr) => {
        if (!dateStr) return '—';
        const diff = Date.now() - new Date(dateStr).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Just now';
        if (mins < 60) return `${mins}m ago`;
        const hrs = Math.floor(mins / 60);
        if (hrs < 24) return `${hrs}h ago`;
        return `${Math.floor(hrs / 24)}d ago`;
    };

    const getSeverityLabel = (severity) => {
        const map = { 1: 'Low', 2: 'Medium', 3: 'High', 4: 'Critical' };
        return map[severity] || severity || 'Unknown';
    };

    // ── Render ──────────────────────────────────────
    return (
        <div className="ee-dashboard">
            {/* ── Summary Cards ─────────────────────── */}
            <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
                {/* Active Events */}
                <div
                    className="stat-card stat-card--danger tw-cursor-pointer"
                    onClick={() => navigate('/event-expressions/active-events')}
                >
                    <div className="stat-card__icon">
                        <i className="fa-light fa-bell-exclamation"></i>
                    </div>
                    <div className="stat-card__body">
                        <span className="stat-card__value">
                            {statsLoading ? '...' : activeCount}
                        </span>
                        <span className="stat-card__label">Active Events</span>
                    </div>
                </div>

                {/* Acknowledged */}
                <div className="stat-card stat-card--warning">
                    <div className="stat-card__icon">
                        <i className="fa-light fa-eye"></i>
                    </div>
                    <div className="stat-card__body">
                        <span className="stat-card__value">
                            {statsLoading ? '...' : acknowledgedCount}
                        </span>
                        <span className="stat-card__label">Acknowledged</span>
                    </div>
                </div>

                {/* Resolved */}
                <div className="stat-card stat-card--success">
                    <div className="stat-card__icon">
                        <i className="fa-light fa-circle-check"></i>
                    </div>
                    <div className="stat-card__body">
                        <span className="stat-card__value">
                            {statsLoading ? '...' : resolvedCount}
                        </span>
                        <span className="stat-card__label">Resolved</span>
                    </div>
                </div>

                {/* Total Expressions */}
                <div
                    className="stat-card stat-card--info tw-cursor-pointer"
                    onClick={() => navigate('/event-expressions/expressions')}
                >
                    <div className="stat-card__icon">
                        <i className="fa-light fa-waveform-lines"></i>
                    </div>
                    <div className="stat-card__body">
                        <span className="stat-card__value">
                            {expressionsLoading ? '...' : `${activeExpressions}/${totalExpressions}`}
                        </span>
                        <span className="stat-card__label">Active / Total Rules</span>
                    </div>
                </div>
            </div>

            {/* ── Grid: Severity + Event Types ──────── */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4 tw-mb-6">
                {/* Severity Breakdown */}
                <div className="dashboard-panel">
                    <h3 className="dashboard-panel__title">
                        <i className="fa-light fa-signal-bars tw-mr-2"></i>
                        Events by Severity
                    </h3>
                    {statsError ? (
                        <p className="tw-text-sm tw-text-red-500">{statsError}</p>
                    ) : statsLoading ? (
                        <p className="tw-text-sm tw-text-gray-400">Loading...</p>
                    ) : (
                        <div className="severity-bars">
                            {Object.entries(severityMeta).map(([label, meta]) => {
                                const count = severityData[label] || 0;
                                const pct = totalEvents > 0 ? (count / totalEvents) * 100 : 0;
                                return (
                                    <div key={label} className="severity-bar-row">
                                        <div className="severity-bar-label">
                                            <i className={meta.icon} style={{ color: meta.color }}></i>
                                            <span>{label}</span>
                                        </div>
                                        <div className="severity-bar-track">
                                            <div
                                                className="severity-bar-fill"
                                                style={{
                                                    width: `${Math.max(pct, count > 0 ? 4 : 0)}%`,
                                                    backgroundColor: meta.color,
                                                }}
                                            ></div>
                                        </div>
                                        <span
                                            className="severity-bar-count"
                                            style={{ color: meta.color }}
                                        >
                                            {count}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Event Type Distribution */}
                <div className="dashboard-panel">
                    <h3 className="dashboard-panel__title">
                        <i className="fa-light fa-layer-group tw-mr-2"></i>
                        Events by Type
                    </h3>
                    {statsError ? (
                        <p className="tw-text-sm tw-text-red-500">{statsError}</p>
                    ) : statsLoading ? (
                        <p className="tw-text-sm tw-text-gray-400">Loading...</p>
                    ) : Object.keys(eventTypeData).length === 0 ? (
                        <p className="tw-text-sm tw-text-gray-400">No event data available</p>
                    ) : (
                        <div className="type-list">
                            {Object.entries(eventTypeData)
                                .sort(([, a], [, b]) => b - a)
                                .map(([type, count]) => (
                                    <div key={type} className="type-list-item">
                                        <span className="type-list-name">{type}</span>
                                        <span className="type-list-count">{count}</span>
                                    </div>
                                ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ── Grid: Recent Events + Quick Actions ── */}
            <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-4">
                {/* Recent Active Events */}
                <div className="dashboard-panel lg:tw-col-span-2">
                    <h3 className="dashboard-panel__title">
                        <i className="fa-light fa-clock-rotate-left tw-mr-2"></i>
                        Recent Active Events
                    </h3>
                    {statsLoading ? (
                        <p className="tw-text-sm tw-text-gray-400">Loading...</p>
                    ) : recentEvents.length === 0 ? (
                        <div className="tw-text-center tw-py-8">
                            <i className="fa-light fa-party-horn tw-text-4xl tw-text-green-300 tw-mb-2"></i>
                            <p className="tw-text-sm tw-text-gray-400">No active events — all clear!</p>
                        </div>
                    ) : (
                        <div className="recent-events-list">
                            {recentEvents.map((evt) => {
                                const sevLabel = getSeverityLabel(evt.severity);
                                const meta = severityMeta[sevLabel] || severityMeta.Medium;
                                return (
                                    <div key={evt.id} className="recent-event-row">
                                        <div
                                            className="recent-event-severity"
                                            style={{ backgroundColor: meta.bg, color: meta.color }}
                                        >
                                            <i className={meta.icon}></i>
                                        </div>
                                        <div className="recent-event-info">
                                            <span className="recent-event-message">
                                                {evt.message || evt.eventType}
                                            </span>
                                            <span className="recent-event-meta">
                                                {evt.eventType} &middot;{' '}
                                                {formatTimeAgo(evt.triggeredAt || evt.createdAt)}
                                            </span>
                                        </div>
                                        <span
                                            className="recent-event-badge"
                                            style={{
                                                backgroundColor: meta.bg,
                                                color: meta.color,
                                            }}
                                        >
                                            {sevLabel}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {recentEvents.length > 0 && (
                        <div className="tw-mt-3 tw-text-right">
                            <button
                                className="tw-text-sm tw-text-violet-600 hover:tw-text-violet-800 tw-font-medium"
                                onClick={() => navigate('/event-expressions/active-events')}
                            >
                                View all active events &rarr;
                            </button>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="dashboard-panel">
                    <h3 className="dashboard-panel__title">
                        <i className="fa-light fa-bolt tw-mr-2"></i>
                        Quick Actions
                    </h3>
                    <div className="quick-actions">
                        <button
                            className="quick-action-btn"
                            onClick={() => navigate('/event-expressions/create')}
                        >
                            <i className="fa-light fa-plus-circle"></i>
                            <span>Create Expression</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={() => navigate('/event-expressions/expressions')}
                        >
                            <i className="fa-light fa-list"></i>
                            <span>Manage Rules</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={() => navigate('/event-expressions/active-events')}
                        >
                            <i className="fa-light fa-bell-exclamation"></i>
                            <span>Active Events</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={() => navigate('/event-expressions/types')}
                        >
                            <i className="fa-light fa-layer-group"></i>
                            <span>Browse Types</span>
                        </button>
                        <button
                            className="quick-action-btn"
                            onClick={loadDashboardData}
                        >
                            <i className="fa-light fa-arrows-rotate"></i>
                            <span>Refresh Stats</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EventExpressionsDashboard;
