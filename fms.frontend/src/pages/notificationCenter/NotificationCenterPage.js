/**
 * File: NotificationCenterPage.js
 * Purpose: User-facing full-page notification center - view, read, acknowledge and manage notifications.
 * Dependencies: react, react-redux, devextreme-react, notificationActions, notificationsApi
 * Last Modified: 2026-02-23
 *
 * Key Components:
 * - NotificationCenterPage: Full page listing of user notifications with filters, bulk actions, and detail popup.
 */
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Popup } from 'devextreme-react/popup';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import {
    fetchNotifications,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    acknowledgeNotification,
} from '../../redux/actions/notificationActions';
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
    Critical: { color: '#dc2626', bg: '#fef2f2', label: 'Critical' },
    High: { color: '#ea580c', bg: '#fff7ed', label: 'High' },
    Medium: { color: '#d97706', bg: '#fefce8', label: 'Medium' },
    Low: { color: '#16a34a', bg: '#f0fdf4', label: 'Low' },
};

const TYPE_ICONS = {
    Alert: 'fa-light fa-triangle-exclamation',
    Warning: 'fa-light fa-circle-exclamation',
    Info: 'fa-light fa-circle-info',
    Success: 'fa-light fa-circle-check',
    Fuel: 'fa-light fa-gas-pump',
    Vehicle: 'fa-light fa-car',
    Task: 'fa-light fa-list-check',
    Issue: 'fa-light fa-bug',
    Report: 'fa-light fa-file-chart-column',
    Maintenance: 'fa-light fa-wrench',
};

const getTypeIcon = (type) =>
    TYPE_ICONS[type] || TYPE_ICONS[Object.keys(TYPE_ICONS).find(k => type?.toLowerCase().includes(k.toLowerCase()))] || 'fa-light fa-bell';

const getPriorityConfig = (priority) =>
    PRIORITY_CONFIG[priority] || { color: '#6b7280', bg: '#f3f4f6', label: priority || 'Normal' };

// ─── Notification Card ───────────────────────────────────────────────────────

const NotificationCard = ({ notification, onPress, onMarkRead, onAcknowledge }) => {
    const title = resolveField(notification, 'title', 'Title', 'subject', 'Subject') || 'Notification';
    const message = resolveField(notification, 'message', 'Message', 'body', 'Body', 'content', 'Content') || '';
    const type = resolveField(notification, 'type', 'Type', 'notificationType') || 'Info';
    const priority = resolveField(notification, 'priority', 'Priority') || 'Low';
    const category = resolveField(notification, 'category', 'Category', 'categoryName') || '';
    const createdAt = resolveField(notification, 'createdAt', 'CreatedAt', 'sentAt', 'SentAt', 'timestamp');
    const isRead = notification.isRead || notification.IsRead;
    const isAcknowledged = notification.isAcknowledged || notification.IsAcknowledged;
    const pConf = getPriorityConfig(priority);

    return (
        <div
            className={`nc-card ${isRead ? 'nc-card--read' : 'nc-card--unread'}`}
            onClick={() => onPress(notification)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onPress(notification)}
        >
            {!isRead && <div className="nc-card__unread-dot" />}

            <div className="nc-card__icon">
                <i className={getTypeIcon(type)} />
            </div>

            <div className="nc-card__body">
                <div className="nc-card__header-row">
                    <span className="nc-card__title">{title}</span>
                    <span className="nc-card__time">{formatTimestamp(createdAt)}</span>
                </div>
                {message && (
                    <p className="nc-card__message">{message.length > 120 ? `${message.slice(0, 120)}…` : message}</p>
                )}
                <div className="nc-card__meta-row">
                    {category && <span className="nc-card__badge nc-card__badge--category">{category}</span>}
                    <span
                        className="nc-card__badge"
                        style={{ color: pConf.color, backgroundColor: pConf.bg }}
                    >
                        {pConf.label}
                    </span>
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

// ─── Detail Popup ────────────────────────────────────────────────────────────

const NotificationDetailPopup = ({ notification, visible, onHide, onMarkRead, onAcknowledge }) => {
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
    const nId = notification.id || notification.Id;

    return (
        <Popup
            visible={visible}
            onHiding={onHide}
            title="Notification Details"
            showCloseButton={true}
            width="auto"
            height="auto"
            maxWidth={560}
        >
            <div className="nc-detail">
                <div className="nc-detail__badges">
                    <span className="nc-card__badge nc-card__badge--type">
                        <i className={`${getTypeIcon(type)} tw-mr-1`} />{type}
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
                            <i className="fa-light fa-clock tw-text-gray-400 tw-mr-2" />
                            <span className="tw-text-gray-500 tw-text-sm">Sent:</span>
                            <span className="tw-text-gray-700 tw-text-sm tw-ml-1">{parseDateToLocal(createdAt)?.toLocaleString() || '—'}</span>
                        </div>
                    )}
                    {readAt && (
                        <div className="nc-detail__ts-row">
                            <i className="fa-light fa-envelope-open tw-text-gray-400 tw-mr-2" />
                            <span className="tw-text-gray-500 tw-text-sm">Read:</span>
                            <span className="tw-text-gray-700 tw-text-sm tw-ml-1">{parseDateToLocal(readAt)?.toLocaleString() || '—'}</span>
                        </div>
                    )}
                    {acknowledgedAt && (
                        <div className="nc-detail__ts-row">
                            <i className="fa-light fa-circle-check tw-text-green-500 tw-mr-2" />
                            <span className="tw-text-gray-500 tw-text-sm">Acknowledged:</span>
                            <span className="tw-text-gray-700 tw-text-sm tw-ml-1">{parseDateToLocal(acknowledgedAt)?.toLocaleString() || '—'}</span>
                        </div>
                    )}
                </div>

                <div className="nc-detail__footer">
                    {!isRead && (
                        <button className="nc-detail__btn" onClick={() => { onMarkRead(nId); onHide(); }}>
                            <i className="fa-light fa-envelope-open tw-mr-2" />Mark as Read
                        </button>
                    )}
                    {!isAcknowledged && (
                        <button className="nc-detail__btn nc-detail__btn--ack" onClick={() => { onAcknowledge(nId); onHide(); }}>
                            <i className="fa-light fa-circle-check tw-mr-2" />Acknowledge
                        </button>
                    )}
                    <button className="nc-detail__btn nc-detail__btn--close" onClick={onHide}>
                        Close
                    </button>
                </div>
            </div>
        </Popup>
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
                    <div className="nc-header__icon-wrap">
                        <i className="fa-light fa-bell" />
                    </div>
                    <div>
                        <h1 className="nc-header__title">
                            My Notifications
                            {unreadCount > 0 && <span className="nc-header__badge">{unreadCount}</span>}
                        </h1>
                        <p className="nc-header__subtitle">View and manage your notifications</p>
                    </div>
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

                <SelectBox
                    dataSource={CATEGORY_OPTIONS}
                    displayExpr="text"
                    valueExpr="value"
                    value={filterCategory}
                    onValueChanged={(e) => { setFilterCategory(e.value); setPage(0); }}
                    placeholder="Category"
                    width={160}
                    showClearButton={true}
                />

                <SelectBox
                    dataSource={PRIORITY_OPTIONS}
                    displayExpr="text"
                    valueExpr="value"
                    value={filterPriority}
                    onValueChanged={(e) => { setFilterPriority(e.value); setPage(0); }}
                    placeholder="Priority"
                    width={140}
                    showClearButton={true}
                />

                <DateBox
                    value={filterDateFrom}
                    onValueChanged={(e) => { setFilterDateFrom(e.value); setPage(0); }}
                    placeholder="From date"
                    displayFormat="dd/MM/yyyy"
                    width={140}
                    showClearButton={true}
                />
                <DateBox
                    value={filterDateTo}
                    onValueChanged={(e) => { setFilterDateTo(e.value); setPage(0); }}
                    placeholder="To date"
                    displayFormat="dd/MM/yyyy"
                    width={140}
                    showClearButton={true}
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
                        <span className="tw-text-gray-500 tw-mt-3">Loading notifications…</span>
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

            {/* ── Detail Popup ── */}
            <NotificationDetailPopup
                notification={selectedNotification}
                visible={detailVisible}
                onHide={() => setDetailVisible(false)}
                onMarkRead={handleMarkRead}
                onAcknowledge={handleAcknowledge}
            />
        </div>
    );
};

export default NotificationCenterPage;
