/**
 * File: NotificationCenterPage.js
 * Purpose: User-facing full-page notification center - view, read, acknowledge and manage notifications.
 * Dependencies: react, react-redux, devextreme-react, notificationActions, notificationsApi, SlidePanel
 * Last Modified: 2026-03-06
 *
 * Key Components:
 * - NotificationCenterPage: Full page listing of user notifications with filters, bulk actions, and detail side panel.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acknowledgeNotification,
} from '../../redux/actions/notificationActions';
import SlidePanel from '../../components/ui/SlidePanel';
import './NotificationCenterPage.scss';

// ─── Helpers ────────────────────────────────────────────────────────────────

const parseDateToLocal = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    const raw = String(value).trim();
    if (!raw) return null;
    const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw);
    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return new Date(raw + 'T00:00:00');
    if (hasTimezone) return new Date(raw);
    return new Date(raw);
};

const formatTimestamp = (value) => {
    const d = parseDateToLocal(value);
    if (!d || isNaN(d.getTime())) return '—';
    const now = new Date();
    const diff = (now - d) / 1000;
    if (diff < 60) return 'Just now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleString();
};

const resolveField = (obj, ...keys) => {
    for (const k of keys) {
        if (obj?.[k] != null && obj[k] !== '') return obj[k];
    }
    return null;
};

const PRIORITY_CONFIG = {
    Critical: { color: '#d13438', bg: '#fde7e9', label: 'Critical' },
    High: { color: '#ca5010', bg: '#fff4ce', label: 'High' },
    Medium: { color: '#c09a00', bg: '#fff8e1', label: 'Medium' },
    Low: { color: '#107c10', bg: '#dff6dd', label: 'Low' },
};

const TYPE_CONFIG = {
    Alert: { icon: 'fa-light fa-triangle-exclamation', bg: '#fde7e9', color: '#d13438' },
    Warning: { icon: 'fa-light fa-circle-exclamation', bg: '#fff4ce', color: '#ca5010' },
    Info: { icon: 'fa-light fa-circle-info', bg: '#deecf9', color: '#0078d4' },
    Success: { icon: 'fa-light fa-circle-check', bg: '#dff6dd', color: '#107c10' },
    Fuel: { icon: 'fa-light fa-gas-pump', bg: '#fff4ce', color: '#ca5010' },
    Vehicle: { icon: 'fa-light fa-car', bg: '#deecf9', color: '#0078d4' },
    Task: { icon: 'fa-light fa-list-check', bg: '#e8eaf6', color: '#3949ab' },
    Issue: { icon: 'fa-light fa-bug', bg: '#fde7e9', color: '#d13438' },
    Report: { icon: 'fa-light fa-file-chart-column', bg: '#e0f2f1', color: '#00796b' },
    Maintenance: { icon: 'fa-light fa-wrench', bg: '#f3e8fd', color: '#6b21a8' },
};

const DEFAULT_TYPE_CONFIG = { icon: 'fa-light fa-bell', bg: '#f3f2f1', color: '#605e5c' };

const getTypeConfig = (type) =>
    TYPE_CONFIG[type] || TYPE_CONFIG[Object.keys(TYPE_CONFIG).find(k => type?.toLowerCase().includes(k.toLowerCase()))] || DEFAULT_TYPE_CONFIG;

const getPriorityConfig = (priority) =>
    PRIORITY_CONFIG[priority] || { color: '#605e5c', bg: '#f3f2f1', label: priority || 'Normal' };

// ─── Notification Card ───────────────────────────────────────────────────────

const NotificationCard = ({ notification, onPress, onMarkRead, onAcknowledge }) => {
    const title = resolveField(notification, 'title', 'Title', 'subject', 'Subject') || 'Notification';
    const message = resolveField(notification, 'message', 'Message', 'body', 'Body', 'content', 'Content') || '';
    const type = resolveField(notification, 'type', 'Type', 'notificationType') || 'Info';
    const priority = resolveField(notification, 'priority', 'Priority') || 'Low';
    const category = resolveField(notification, 'category', 'Category', 'categoryName') || '';
    const source = resolveField(notification, 'source', 'Source', 'sourceName') || '';
    const deviceId = resolveField(notification, 'deviceId', 'DeviceId', 'deviceName') || '';
    const createdAt = resolveField(notification, 'createdAt', 'CreatedAt', 'sentAt', 'SentAt', 'timestamp');
    const isRead = notification.isRead || notification.IsRead;
    const isAcknowledged = notification.isAcknowledged || notification.IsAcknowledged;
    const pConf = getPriorityConfig(priority);
    const tConf = getTypeConfig(type);

    return (
        <div
            className={`nc-card ${isRead ? 'nc-card--read' : 'nc-card--unread'}`}
            onClick={() => onPress(notification)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onPress(notification)}
        >
            {/* Circular type icon */}
            <div
                className="nc-card__icon"
                style={{ backgroundColor: tConf.bg, color: tConf.color }}
            >
                <i className={tConf.icon} />
            </div>

            <div className="nc-card__body">
                <div className="nc-card__header-row">
                    <span className="nc-card__title">
                        {title}
                        {!isRead && <span className="nc-card__new-badge">New</span>}
                    </span>
                    <span className="nc-card__time">{formatTimestamp(createdAt)}</span>
                </div>
                {message && (
                    <p className="nc-card__message">{message.length > 120 ? `${message.slice(0, 120)}…` : message}</p>
                )}
                <div className="nc-card__meta-row">
                    {category && <span className="nc-card__badge nc-card__badge--category">{category}</span>}
                    <span className="nc-card__badge nc-card__badge--type">
                        <i className={`${tConf.icon} tw-mr-1`} style={{ fontSize: '10px' }} />{type}
                    </span>
                    <span
                        className="nc-card__badge"
                        style={{ color: pConf.color, backgroundColor: pConf.bg }}
                    >
                        {pConf.label}
                    </span>
                    {source && (
                        <span className="nc-card__badge nc-card__badge--category">
                            <i className="fa-light fa-satellite-dish tw-mr-1" style={{ fontSize: '10px' }} />{source}
                        </span>
                    )}
                    {deviceId && (
                        <span className="nc-card__badge nc-card__badge--category">
                            <i className="fa-light fa-microchip tw-mr-1" style={{ fontSize: '10px' }} />{deviceId}
                        </span>
                    )}
                    {isAcknowledged && (
                        <span className="nc-card__badge nc-card__badge--ack">
                            <i className="fa-light fa-circle-check tw-mr-1" />Acknowledged
                        </span>
                    )}
                </div>
            </div>

            <div className="nc-card__actions" onClick={(e) => e.stopPropagation()}>
                {!isRead && (
                    <button
                        className="nc-action-btn"
                        title="Mark as read"
                        onClick={(e) => { e.stopPropagation(); onMarkRead(notification.id || notification.Id); }}
                    >
                        <i className="fa-light fa-envelope-open" />
                    </button>
                )}
                {!isAcknowledged && (
                    <button
                        className="nc-action-btn nc-action-btn--ack"
                        title="Acknowledge"
                        onClick={(e) => { e.stopPropagation(); onAcknowledge(notification.id || notification.Id); }}
                    >
                        <i className="fa-light fa-circle-check" />
                    </button>
                )}
            </div>
        </div>
    );
};

// ─── Detail Side Panel ───────────────────────────────────────────────────────

const NotificationDetailPanel = ({ notification, open, onClose, onMarkRead, onAcknowledge }) => {
    if (!notification) return null;

    const title = resolveField(notification, 'title', 'Title', 'subject', 'Subject') || 'Notification';
    const message = resolveField(notification, 'message', 'Message', 'body', 'Body', 'content', 'Content') || '';
    const type = resolveField(notification, 'type', 'Type', 'notificationType') || 'Info';
    const priority = resolveField(notification, 'priority', 'Priority') || 'Low';
    const category = resolveField(notification, 'category', 'Category', 'categoryName') || '';
    const createdAt = resolveField(notification, 'createdAt', 'CreatedAt', 'sentAt', 'SentAt', 'timestamp');
    const readAt = resolveField(notification, 'readAt', 'ReadAt');
    const acknowledgedAt = resolveField(notification, 'acknowledgedAt', 'AcknowledgedAt');
    const isRead = notification.isRead || notification.IsRead;
    const isAcknowledged = notification.isAcknowledged || notification.IsAcknowledged;
    const pConf = getPriorityConfig(priority);
    const tConf = getTypeConfig(type);
    const nId = notification.id || notification.Id;

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="Notification Details"
            width={620}
            panelClassName="nc-detail-panel"
        >
            <div className="nc-detail">
                <div className="nc-detail__badges">
                    <span className="nc-card__badge nc-card__badge--type">
                        <i className={`${tConf.icon} tw-mr-1`} />{type}
                    </span>
                    {category && <span className="nc-card__badge nc-card__badge--category">{category}</span>}
                    <span className="nc-card__badge" style={{ color: pConf.color, backgroundColor: pConf.bg }}>
                        {pConf.label}
                    </span>
                </div>

                <h3 className="nc-detail__title">{title}</h3>
                {message && <p className="nc-detail__message">{message}</p>}

                <div className="nc-detail__timestamps">
                    {createdAt && (
                        <div className="nc-detail__ts-row">
                            <i className="fa-light fa-clock nc-detail__ts-icon" />
                            <span className="nc-detail__ts-label">Sent:</span>
                            <span className="nc-detail__ts-value">{parseDateToLocal(createdAt)?.toLocaleString() || '—'}</span>
                        </div>
                    )}
                    {readAt && (
                        <div className="nc-detail__ts-row">
                            <i className="fa-light fa-envelope-open nc-detail__ts-icon" />
                            <span className="nc-detail__ts-label">Read:</span>
                            <span className="nc-detail__ts-value">{parseDateToLocal(readAt)?.toLocaleString() || '—'}</span>
                        </div>
                    )}
                    {acknowledgedAt && (
                        <div className="nc-detail__ts-row">
                            <i className="fa-light fa-circle-check nc-detail__ts-icon nc-detail__ts-icon--success" />
                            <span className="nc-detail__ts-label">Acknowledged:</span>
                            <span className="nc-detail__ts-value">{parseDateToLocal(acknowledgedAt)?.toLocaleString() || '—'}</span>
                        </div>
                    )}
                </div>

                <div className="nc-detail__footer">
                    {!isRead && (
                        <button className="nc-detail__btn" onClick={() => { onMarkRead(nId); onClose(); }}>
                            <i className="fa-light fa-envelope-open tw-mr-2" />Mark as Read
                        </button>
                    )}
                    {!isAcknowledged && (
                        <button className="nc-detail__btn nc-detail__btn--ack" onClick={() => { onAcknowledge(nId); onClose(); }}>
                            <i className="fa-light fa-circle-check tw-mr-2" />Acknowledge
                        </button>
                    )}
                    <button className="nc-detail__btn nc-detail__btn--close" onClick={onClose}>
                        Close
                    </button>
                </div>
            </div>
        </SlidePanel>
    );
};

// ─── Main Page ───────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
    { value: '', text: 'All Categories' },
    { value: 'Fuel', text: 'Fuel' },
    { value: 'Vehicle', text: 'Vehicle' },
    { value: 'Maintenance', text: 'Maintenance' },
    { value: 'Issue', text: 'Issue Tracker' },
    { value: 'Task', text: 'Task Management' },
    { value: 'System', text: 'System' },
];

const PRIORITY_OPTIONS = [
    { value: '', text: 'All Priorities' },
    { value: 'Critical', text: 'Critical' },
    { value: 'High', text: 'High' },
    { value: 'Medium', text: 'Medium' },
    { value: 'Low', text: 'Low' },
];

const NotificationCenterPage = () => {
    const dispatch = useDispatch();
    const backendNotifications = useSelector((s) => s.notification?.backendNotifications || []);
    const isLoading = useSelector((s) => s.notification?.loading?.notifications || false);

    const [activeTab, setActiveTab] = useState('all');
    const [filterCategory, setFilterCategory] = useState('');
    const [filterPriority, setFilterPriority] = useState('');
    const [filterDateFrom, setFilterDateFrom] = useState(null);
    const [filterDateTo, setFilterDateTo] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [detailVisible, setDetailVisible] = useState(false);
    const [page, setPage] = useState(0);
    const PAGE_SIZE = 20;

    // ── Load ──
    const load = useCallback(() => {
        const filters = {
            category: filterCategory || undefined,
            priority: filterPriority || undefined,
            dateFrom: filterDateFrom || undefined,
            dateTo: filterDateTo || undefined,
            isRead: activeTab === 'unread' ? false : undefined,
            skip: page * PAGE_SIZE,
            take: PAGE_SIZE,
        };
        dispatch(fetchNotifications(filters));
    }, [dispatch, activeTab, filterCategory, filterPriority, filterDateFrom, filterDateTo, page]);

    useEffect(() => { load(); }, [load]);

    // ── Derived data ──
    const filteredNotifications = useMemo(() => {
        let list = backendNotifications;
        if (activeTab === 'unread') list = list.filter((n) => !n.isRead && !n.IsRead);
        if (activeTab === 'acknowledged') list = list.filter((n) => n.isAcknowledged || n.IsAcknowledged);
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            list = list.filter((n) => {
                const t = ((n.title || n.Title || '') + ' ' + (n.message || n.Message || '')).toLowerCase();
                return t.includes(q);
            });
        }
        return list;
    }, [backendNotifications, activeTab, searchQuery]);

    const unreadCount = useMemo(
        () => backendNotifications.filter((n) => !n.isRead && !n.IsRead).length,
        [backendNotifications]
    );

    // ── Actions ──
    const handleMarkRead = useCallback(async (id) => {
        const res = await dispatch(markNotificationAsRead(id));
        if (res?.isSuccess) notify('Marked as read', 'success', 2000);
        else notify('Failed to mark as read', 'error', 3000);
    }, [dispatch]);

    const handleAcknowledge = useCallback(async (id) => {
        const res = await dispatch(acknowledgeNotification(id));
        if (res?.isSuccess) notify('Notification acknowledged', 'success', 2000);
        else notify('Failed to acknowledge', 'error', 3000);
    }, [dispatch]);

    const handleMarkAllRead = useCallback(async () => {
        const res = await dispatch(markAllNotificationsAsRead());
        if (res?.isSuccess) notify('All notifications marked as read', 'success', 2500);
        else notify('Failed to mark all as read', 'error', 3000);
    }, [dispatch]);

    const handleCardPress = useCallback((notification) => {
        setSelectedNotification(notification);
        setDetailVisible(true);
        if (!notification.isRead && !notification.IsRead) {
            const id = notification.id || notification.Id;
            if (id) dispatch(markNotificationAsRead(id));
        }
    }, [dispatch]);

    const handleClearFilters = useCallback(() => {
        setFilterCategory('');
        setFilterPriority('');
        setFilterDateFrom(null);
        setFilterDateTo(null);
        setSearchQuery('');
        setActiveTab('all');
        setPage(0);
    }, []);

    const hasFilters = filterCategory || filterPriority || filterDateFrom || filterDateTo || searchQuery || activeTab !== 'all';

    return (
        <div className="nc-page">
            {/* ── Header ── */}
            <div className="nc-header">
                <div className="nc-header__left">
                    <i className="fa-light fa-bell nc-header__icon" />
                    <h2 className="nc-header__title">
                        Notifications
                        {unreadCount > 0 && <span className="nc-header__badge">{unreadCount}</span>}
                    </h2>
                </div>
                <div className="nc-header__actions">
                    {unreadCount > 0 && (
                        <button className="nc-btn nc-btn--ghost" onClick={handleMarkAllRead}>
                            <i className="fa-light fa-envelope-open tw-mr-2" />Mark All Read
                        </button>
                    )}
                    <button className="nc-btn nc-btn--ghost" onClick={load}>
                        <i className="fa-light fa-rotate-right tw-mr-2" />Refresh
                    </button>
                </div>
            </div>

            {/* ── Tab Bar ── */}
            <div className="nc-tabs">
                {[
                    { key: 'all', label: 'All', icon: 'fa-light fa-inbox' },
                    { key: 'unread', label: 'Unread', icon: 'fa-light fa-envelope', count: unreadCount },
                    { key: 'acknowledged', label: 'Acknowledged', icon: 'fa-light fa-circle-check' },
                ].map((tab) => (
                    <button
                        key={tab.key}
                        className={`nc-tab${activeTab === tab.key ? ' nc-tab--active' : ''}`}
                        onClick={() => { setActiveTab(tab.key); setPage(0); }}
                    >
                        <i className={`${tab.icon} tw-mr-2`} />
                        {tab.label}
                        {tab.count > 0 && <span className="nc-tab__badge">{tab.count}</span>}
                    </button>
                ))}
            </div>

            {/* ── Filters ── */}
            <div className="nc-filters">
                <div className="nc-filters__search">
                    <i className="fa-light fa-magnifying-glass nc-filters__search-icon" />
                    <input
                        type="text"
                        className="nc-filters__search-input"
                        placeholder="Search notifications…"
                        value={searchQuery}
                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                    />
                </div>

                <div className="nc-filter-field nc-filter-field--select">
                    <select
                        className="nc-select"
                        value={filterCategory}
                        onChange={(e) => { setFilterCategory(e.target.value); setPage(0); }}
                    >
                        {CATEGORY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.text}</option>
                        ))}
                    </select>
                    <span className="nc-filter-field__icon" aria-hidden="true">
                        <i className="fa-light fa-chevron-down"></i>
                    </span>
                </div>

                <div className="nc-filter-field nc-filter-field--select">
                    <select
                        className="nc-select"
                        value={filterPriority}
                        onChange={(e) => { setFilterPriority(e.target.value); setPage(0); }}
                    >
                        {PRIORITY_OPTIONS.map((o) => (
                            <option key={o.value} value={o.value}>{o.text}</option>
                        ))}
                    </select>
                    <span className="nc-filter-field__icon" aria-hidden="true">
                        <i className="fa-light fa-chevron-down"></i>
                    </span>
                </div>

                <input
                    type="date"
                    className="nc-date-input"
                    value={filterDateFrom ? (filterDateFrom instanceof Date ? filterDateFrom.toISOString().slice(0, 10) : filterDateFrom) : ''}
                    onChange={(e) => { setFilterDateFrom(e.target.value ? new Date(e.target.value) : null); setPage(0); }}
                    placeholder="From"
                />
                <input
                    type="date"
                    className="nc-date-input"
                    value={filterDateTo ? (filterDateTo instanceof Date ? filterDateTo.toISOString().slice(0, 10) : filterDateTo) : ''}
                    onChange={(e) => { setFilterDateTo(e.target.value ? new Date(e.target.value) : null); setPage(0); }}
                    placeholder="To"
                />

                {hasFilters && (
                    <button className="nc-btn nc-btn--text" onClick={handleClearFilters} title="Clear filters">
                        <i className="fa-light fa-xmark tw-mr-1" />Clear
                    </button>
                )}
            </div>

            {/* ── Content ── */}
            <div className="nc-content">
                {isLoading ? (
                    <div className="nc-state nc-state--loading">
                        <LoadIndicator visible={true} height={40} width={40} />
                        <span className="nc-state__loading-text">Loading notifications…</span>
                    </div>
                ) : filteredNotifications.length === 0 ? (
                    <div className="nc-state nc-state--empty">
                        <i className="fa-light fa-bell-slash nc-state__icon" />
                        <p className="nc-state__title">No Notifications</p>
                        <p className="nc-state__sub">
                            {activeTab === 'unread'
                                ? "You've read all your notifications!"
                                : hasFilters
                                    ? 'No notifications match your filters.'
                                    : 'No notifications yet.'}
                        </p>
                        {hasFilters && (
                            <button className="nc-btn nc-btn--primary tw-mt-4" onClick={handleClearFilters}>
                                Clear Filters
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="nc-list">
                            {filteredNotifications.map((n) => (
                                <NotificationCard
                                    key={n.id || n.Id || n.notificationId}
                                    notification={n}
                                    onPress={handleCardPress}
                                    onMarkRead={handleMarkRead}
                                    onAcknowledge={handleAcknowledge}
                                />
                            ))}
                        </div>
                        <div className="nc-pagination">
                            <button
                                className="nc-btn nc-btn--ghost"
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                            >
                                <i className="fa-light fa-chevron-left tw-mr-1" />Previous
                            </button>
                            <span className="nc-pagination__info">
                                Page {page + 1} · Showing {filteredNotifications.length}
                            </span>
                            <button
                                className="nc-btn nc-btn--ghost"
                                disabled={filteredNotifications.length < PAGE_SIZE}
                                onClick={() => setPage((p) => p + 1)}
                            >
                                Next<i className="fa-light fa-chevron-right tw-ml-1" />
                            </button>
                        </div>
                    </>
                )}
            </div>

            {/* ── Detail Side Panel ── */}
            <NotificationDetailPanel
                notification={selectedNotification}
                open={detailVisible}
                onClose={() => setDetailVisible(false)}
                onMarkRead={handleMarkRead}
                onAcknowledge={handleAcknowledge}
            />
        </div>
    );
};

export default NotificationCenterPage;
