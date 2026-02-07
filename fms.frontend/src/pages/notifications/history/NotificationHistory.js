/**
 * File: NotificationHistory.js
 * Purpose: Display notification delivery history with filters, retry actions, and trend chart.
 * Dependencies: react, devextreme-react, notificationsApi
 * Last Modified: 2026-02-07
 *
 * Key Functions/Components:
 * - loadAll: Loads notification rows and chart data.
 * - handleRetry: Re-sends failed or pending notifications.
 * - renderStatus/renderType/renderPriority: Grid cell formatters.
 */
import React, { useState, useEffect } from 'react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';
import notificationsApi from '../../../dataservice/notificationsApi';

// No mocks: data loads from controller via notificationsApi

const ensureArray = (value) => {
  if (Array.isArray(value)) return value;
  if (value && Array.isArray(value.items)) return value.items;
  if (value && Array.isArray(value.data)) return value.data;
  return [];
};

const normalizeDateValue = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const normalizeStatsToChartRows = (statsPayload) => {
  const directList = ensureArray(statsPayload);
  if (directList.length > 0) {
    return directList.map((s) => ({
      date: s.date || s.day || s.bucket || s.dateString || new Date().toISOString(),
      sent: s.sent ?? s.totalSent ?? s.count ?? 0,
      delivered: s.delivered ?? s.totalDelivered ?? s.readCount ?? 0,
      failed: s.failed ?? s.totalFailed ?? 0,
    }));
  }

  const dailyList = ensureArray(statsPayload?.dailyStatistics || statsPayload?.DailyStatistics);
  if (dailyList.length > 0) {
    return dailyList.map((s) => ({
      date: s.date || s.Date || s.dateString || s.DateString || new Date().toISOString(),
      sent: s.sent ?? s.totalSent ?? s.count ?? s.Count ?? 0,
      delivered: s.delivered ?? s.totalDelivered ?? s.readCount ?? s.ReadCount ?? 0,
      failed: s.failed ?? s.totalFailed ?? 0,
    }));
  }

  return [];
};

const resolveRecipientDisplay = (n) => {
  return (
    n.recipient ||
    n.Recipient ||
    n.to ||
    n.To ||
    n.userEmail ||
    n.UserEmail ||
    n.recipientEmail ||
    n.RecipientEmail ||
    n.siteName ||
    n.SiteName ||
    n.vehicleName ||
    n.VehicleName ||
    n.tankName ||
    n.TankName ||
    n.ptsDeviceName ||
    n.PtsDeviceName ||
    '-'
  );
};

const resolveDeliveredAt = (n) => {
  return (
    n.deliveredAt ||
    n.DeliveredAt ||
    n.readAt ||
    n.ReadAt ||
    n.acknowledgedAt ||
    n.AcknowledgedAt ||
    null
  );
};

const tryParseMetadata = (n) => {
  if (n.metadata && typeof n.metadata === 'object') return n.metadata;
  if (n.Metadata && typeof n.Metadata === 'object') return n.Metadata;
  if (n.meta && typeof n.meta === 'object') return n.meta;
  if (n.Meta && typeof n.Meta === 'object') return n.Meta;
  if (n.data && typeof n.data === 'object') return n.data;
  if (n.Data && typeof n.Data === 'object') return n.Data;
  if (typeof n.data === 'string' && n.data.trim().startsWith('{')) {
    try {
      return JSON.parse(n.data);
    } catch {
      return null;
    }
  }
  if (typeof n.Data === 'string' && n.Data.trim().startsWith('{')) {
    try {
      return JSON.parse(n.Data);
    } catch {
      return null;
    }
  }
  return null;
};

const stripHtmlTags = (value) => {
  if (!value) return '';
  return String(value).replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
};

const resolveReportViewLink = (metadata) => {
  if (!metadata || typeof metadata !== 'object') return null;

  const rawLink = metadata.reportViewPath ||
    metadata.reportViewUrl ||
    metadata.ReportViewPath ||
    metadata.ReportViewUrl ||
    null;

  if (!rawLink || typeof rawLink !== 'string') return null;

  const normalized = rawLink.trim();
  if (!normalized) return null;

  return /^https?:\/\//i.test(normalized)
    ? normalized
    : (normalized.startsWith('/') ? normalized : `/${normalized}`);
};

const resolveReportActionText = (metadata) => {
  if (!metadata || typeof metadata !== 'object') {
    return 'Click here to view report';
  }

  const rawValue = metadata.reportActionText || metadata.ReportActionText;
  if (!rawValue || typeof rawValue !== 'string') {
    return 'Click here to view report';
  }

  const normalized = rawValue.trim();
  return normalized || 'Click here to view report';
};

const resolveNotificationFromCell = (cellInfoOrRow, rows) => {
  if (!cellInfoOrRow) return null;

  if (cellInfoOrRow.data && (cellInfoOrRow.data.id != null || cellInfoOrRow.data.subject)) {
    return cellInfoOrRow.data;
  }

  if (cellInfoOrRow.row?.data && (cellInfoOrRow.row.data.id != null || cellInfoOrRow.row.data.subject)) {
    return cellInfoOrRow.row.data;
  }

  if (cellInfoOrRow.id != null || cellInfoOrRow.subject) {
    return cellInfoOrRow;
  }

  if (cellInfoOrRow.key != null && Array.isArray(rows)) {
    const matched = rows.find((r) => String(r.id) === String(cellInfoOrRow.key));
    if (matched) return matched;
  }

  return null;
};

const formatMetadataValue = (value) => {
  if (value == null) return '-';
  if (typeof value === 'object') {
    try {
      return JSON.stringify(value);
    } catch {
      return '[object]';
    }
  }
  return String(value);
};

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailsPopup, setShowDetailsPopup] = useState(false);
  const [chartData, setChartData] = useState([]);
  const [filters, setFilters] = useState({
    status: 'all',
    type: 'all',
    dateFrom: null,
    dateTo: null
  });
  const [loading, setLoading] = useState(false);



  const statusOptions = [
    { value: 'all', text: 'All Statuses' },
    { value: 'sent', text: 'Sent' },
    { value: 'delivered', text: 'Delivered' },
    { value: 'failed', text: 'Failed' },
    { value: 'pending', text: 'Pending' }
  ];

  const typeOptions = [
    { value: 'all', text: 'All Types' },
    { value: 'email', text: 'Email' },
    { value: 'sms', text: 'SMS' },
    { value: 'push', text: 'Push Notification' }
  ];

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      try {
        // 1) Fetch notifications from controller
        const notifResult = await notificationsApi.getNotifications({
          type: filters.type,
          status: filters.status,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });

        const items = notifResult.isSuccess ? ensureArray(notifResult.data) : [];
        const mappedItems = items.map((n) => {
          const metadata = tryParseMetadata(n);
          const reportViewPath = resolveReportViewLink(metadata);
          const reportActionText = resolveReportActionText(metadata);
          const plainBody = stripHtmlTags(
            n.message ||
            n.Message ||
            n.body ||
            n.Body ||
            ''
          );

          return ({
            id: n.id ?? n.notificationId ?? n.Id,
            type: (n.type || n.Type || n.channel || n.Channel || 'system').toString().toLowerCase(),
            subject: n.subject || n.Subject || n.title || n.Title || 'Notification',
            recipient: resolveRecipientDisplay(n),
            status: (n.status || n.Status || 'pending').toString().toLowerCase(),
            sentAt: n.sentAt || n.SentAt || n.createdAt || n.CreatedAt || n.timestamp || n.Timestamp,
            deliveredAt: resolveDeliveredAt(n),
            template: n.templateName || n.TemplateName || n.template || n.Template || '-',
            policy: n.policyName || n.PolicyName || n.policy || n.Policy || '-',
            priority: (n.priority || n.Priority || 'medium').toString().toLowerCase(),
            retryCount: n.retryCount ?? n.RetryCount ?? 0,
            errorMessage: n.errorMessage || n.ErrorMessage || n.error || n.Error || null,
            metadata,
            reportViewPath,
            reportActionText,
            body: reportViewPath ? 'Click here to view the report.' : (plainBody || null),
          });
        });

        if (!notifResult.isSuccess) {
          notify(notifResult.message || 'Failed to load notifications', 'error', 3000);
        }
        setNotifications(mappedItems);

        // 2) Try fetching stats; fallback to local aggregation from mappedItems
        const statsResult = await notificationsApi.getStatistics({
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
        });

        const normalizedStats = statsResult.isSuccess
          ? normalizeStatsToChartRows(statsResult.data)
          : [];

        if (normalizedStats.length > 0) {
          setChartData(normalizedStats);
          return;
        }

        const now = new Date();
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const d = new Date(now);
          d.setDate(now.getDate() - i);
          days.push(new Date(d.getFullYear(), d.getMonth(), d.getDate()));
        }

        const buckets = days.map((d) => ({
          key: d.toISOString(),
          date: d,
          sent: 0,
          delivered: 0,
          failed: 0,
        }));

        mappedItems.forEach((n) => {
          const ts = normalizeDateValue(n.sentAt);
          if (!ts) return;

          const dayKey = new Date(ts.getFullYear(), ts.getMonth(), ts.getDate()).toISOString();
          const bucket = buckets.find((b) => b.key === dayKey);
          if (!bucket) return;

          bucket.sent += 1;
          if (n.status === 'delivered') bucket.delivered += 1;
          if (n.status === 'failed') bucket.failed += 1;
        });

        setChartData(buckets.map(({ date, sent, delivered, failed }) => ({ date, sent, delivered, failed })));
      } catch (error) {
        console.error('Error loading notification history:', error);
        notify('Error loading notification history', 'error', 3000);
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, [filters]);

  const handleViewDetails = (notificationOrCellInfo) => {
    const resolved = resolveNotificationFromCell(notificationOrCellInfo, notifications);
    if (!resolved) {
      notify('No details available for this notification row', 'warning', 2500);
      return;
    }
    setSelectedNotification(resolved);
    setShowDetailsPopup(true);
  };

  const handleRetry = async (notificationOrCellInfo) => {
    const notification = resolveNotificationFromCell(notificationOrCellInfo, notifications);
    if (!notification) {
      notify('Cannot retry. Notification row data is missing.', 'warning', 2500);
      return;
    }
    if (notification.status === 'failed' || notification.status === 'pending') {
      setLoading(true);
      const result = await notificationsApi.sendNotification(notification.id);
      if (result.isSuccess) {
        notify('Notification resend queued', 'success', 3000);
      } else {
        notify(result.message || 'Failed to resend', 'error', 3000);
      }
      setLoading(false);
    }
  };

  const handleExport = () => {
    // Simulate export functionality
    notify('Export functionality coming soon!', 'info', 3000);
  };

  const renderActionButtons = (data) => {
    return (
      <div className="tw-flex tw-space-x-2">
        <Button
          icon="fa-solid fa-eye"
          hint="View Details"
          onClick={() => handleViewDetails(data)}
          type="normal"
          stylingMode="text"
        />
        {resolveNotificationFromCell(data, notifications)?.status === 'failed' && (
          <Button
            icon="fa-solid fa-redo"
            hint="Retry"
            onClick={() => handleRetry(data)}
            type="normal"
            stylingMode="text"
          />
        )}
      </div>
    );
  };

  const renderStatus = (data) => {
    const statusConfig = {
      sent: { bg: 'tw-bg-blue-100', text: 'tw-text-blue-800', icon: 'fa-solid fa-paper-plane' },
      delivered: { bg: 'tw-bg-green-100', text: 'tw-text-green-800', icon: 'fa-solid fa-check' },
      failed: { bg: 'tw-bg-red-100', text: 'tw-text-red-800', icon: 'fa-solid fa-times' },
      pending: { bg: 'tw-bg-yellow-100', text: 'tw-text-yellow-800', icon: 'fa-solid fa-clock' }
    };

    const config = statusConfig[data.value] || statusConfig.pending;

    return (
      <span className={`tw-inline-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${config.bg} ${config.text}`}>
        <i className={`${config.icon} tw-mr-1`}></i>
        {data.value.charAt(0).toUpperCase() + data.value.slice(1)}
      </span>
    );
  };

  const renderType = (data) => {
    const icons = {
      email: 'fa-solid fa-envelope',
      sms: 'fa-solid fa-sms',
      push: 'fa-solid fa-bell'
    };

    return (
      <span className="tw-flex tw-items-center">
        <i className={`${icons[data.value]} tw-mr-2 tw-text-gray-600`}></i>
        {data.value.toUpperCase()}
      </span>
    );
  };

  const renderPriority = (data) => {
    const colors = {
      high: 'tw-text-red-600',
      medium: 'tw-text-yellow-600',
      low: 'tw-text-green-600'
    };

    return (
      <span className={`tw-font-medium ${colors[data.value]}`}>
        {data.value.charAt(0).toUpperCase() + data.value.slice(1)}
      </span>
    );
  };

  const renderDateTime = (data) => {
    if (!data.value) return '-';
    const date = new Date(data.value);
    return date.toLocaleString();
  };

  return (
    <div className="tw-p-6">
      {/* Statistics Chart */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-md tw-mb-6">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-solid fa-chart-line tw-mr-2 tw-text-blue-600"></i>
            Notification Statistics (Last 7 Days)
          </h3>
        </div>
        <div className="tw-p-6">
          <Chart dataSource={chartData} height={300}>
            <ArgumentAxis dataType="datetime" />
            <ValueAxis />
            <Series
              valueField="sent"
              argumentField="date"
              name="Sent"
              type="line"
              color="#3b82f6"
            />
            <Series
              valueField="delivered"
              argumentField="date"
              name="Delivered"
              type="line"
              color="#10b981"
            />
            <Series
              valueField="failed"
              argumentField="date"
              name="Failed"
              type="line"
              color="#ef4444"
            />
            <Legend visible={true} />
            <Tooltip enabled={true} />
          </Chart>
        </div>
      </div>

      {/* Notification History */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-md">
        {/* Header with Filters */}
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-justify-between tw-items-start">
            <div>
              <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">
                <i className="fa-solid fa-history tw-mr-2 tw-text-blue-600"></i>
                Notification History
              </h2>
              <p className="tw-text-gray-600 tw-mt-1">
                View and track all notification deliveries
              </p>
            </div>
            <Button
              text="Export"
              icon="fa-solid fa-download"
              type="normal"
              onClick={handleExport}
            />
          </div>

          {/* Filters */}
          <div className="tw-flex tw-space-x-4 tw-mt-4">
            <div className="tw-w-48">
              <SelectBox
                dataSource={statusOptions}
                valueExpr="value"
                displayExpr="text"
                value={filters.status}
                onValueChanged={(e) => setFilters(prev => ({ ...prev, status: e.value }))}
                placeholder="Filter by Status"
              />
            </div>
            <div className="tw-w-48">
              <SelectBox
                dataSource={typeOptions}
                valueExpr="value"
                displayExpr="text"
                value={filters.type}
                onValueChanged={(e) => setFilters(prev => ({ ...prev, type: e.value }))}
                placeholder="Filter by Type"
              />
            </div>
            <div className="tw-w-48">
              <DateBox
                value={filters.dateFrom}
                onValueChanged={(e) => setFilters(prev => ({ ...prev, dateFrom: e.value }))}
                placeholder="From Date"
              />
            </div>
            <div className="tw-w-48">
              <DateBox
                value={filters.dateTo}
                onValueChanged={(e) => setFilters(prev => ({ ...prev, dateTo: e.value }))}
                placeholder="To Date"
              />
            </div>
          </div>
        </div>

        {/* Notifications Grid */}
        <div className="tw-p-6">
          <DataGrid
            dataSource={notifications}
            showBorders={true}
            showRowLines={true}
            showColumnLines={false}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            loadPanel={{ enabled: loading }}
          >
            <Column dataField="id" caption="ID" width={80} />
            <Column dataField="type" caption="Type" cellRender={renderType} width={100} />
            <Column dataField="subject" caption="Subject" />
            <Column dataField="recipient" caption="Recipient" />
            <Column dataField="status" caption="Status" cellRender={renderStatus} width={120} />
            <Column dataField="priority" caption="Priority" cellRender={renderPriority} width={100} />
            <Column dataField="sentAt" caption="Sent At" cellRender={renderDateTime} width={150} />
            <Column dataField="deliveredAt" caption="Delivered At" cellRender={renderDateTime} width={150} />
            <Column caption="Actions" cellRender={renderActionButtons} width={120} allowSorting={false} />
          </DataGrid>
        </div>
      </div>

      {/* Notification Details Popup */}
      <Popup
        visible={showDetailsPopup}
        onHiding={() => setShowDetailsPopup(false)}
        dragEnabled={false}
        title="Notification Details"
        width={700}
        height={600}
        showCloseButton={true}
      >
        {selectedNotification ? (
          <div className="tw-p-4">
            {/* Header Info */}
            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-mb-4">
              <div className="tw-flex tw-justify-between tw-items-start">
                <div>
                  <h3 className="tw-font-semibold tw-text-lg tw-mb-2">{selectedNotification.subject}</h3>
                  <div className="tw-flex tw-items-center tw-space-x-4 tw-text-sm tw-text-gray-600">
                    <span><i className="fa-solid fa-user tw-mr-1"></i>{selectedNotification.recipient}</span>
                    <span><i className="fa-solid fa-tag tw-mr-1"></i>{selectedNotification.template}</span>
                    <span><i className="fa-solid fa-clock tw-mr-1"></i>{new Date(selectedNotification.sentAt).toLocaleString()}</span>
                  </div>
                </div>
                <div className="tw-text-right">
                  {renderStatus({ value: selectedNotification.status })}
                  <div className="tw-mt-2 tw-text-sm tw-text-gray-600">
                    Priority: {renderPriority({ value: selectedNotification.priority })}
                  </div>
                </div>
              </div>
            </div>

            {selectedNotification.body && (
              <div className="tw-mb-4">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Message:</label>
                <div className="tw-bg-white tw-border tw-p-3 tw-rounded tw-text-sm tw-text-gray-800">
                  {selectedNotification.body}
                </div>
              </div>
            )}
            {selectedNotification.reportViewPath && (
              <div className="tw-mb-4">
                <button
                  type="button"
                  className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-blue-700 tw-font-medium hover:tw-text-blue-800 tw-underline"
                  onClick={() => {
                    window.open(selectedNotification.reportViewPath, '_blank', 'noopener,noreferrer');
                  }}
                >
                  <i className="fa-light fa-link"></i>
                  {selectedNotification.reportActionText || 'Click here to view report'}
                </button>
              </div>
            )}

            {/* Details Grid */}
            <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Type:</label>
                <div className="tw-text-sm tw-text-gray-900">{selectedNotification.type.toUpperCase()}</div>
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Policy:</label>
                <div className="tw-text-sm tw-text-gray-900">{selectedNotification.policy}</div>
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Sent At:</label>
                <div className="tw-text-sm tw-text-gray-900">{new Date(selectedNotification.sentAt).toLocaleString()}</div>
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Delivered At:</label>
                <div className="tw-text-sm tw-text-gray-900">
                  {selectedNotification.deliveredAt ? new Date(selectedNotification.deliveredAt).toLocaleString() : 'N/A'}
                </div>
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Retry Count:</label>
                <div className="tw-text-sm tw-text-gray-900">{selectedNotification.retryCount}</div>
              </div>
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Template:</label>
                <div className="tw-text-sm tw-text-gray-900">{selectedNotification.template}</div>
              </div>
            </div>

            {/* Error Message */}
            {selectedNotification.errorMessage && (
              <div className="tw-mb-4">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Error Message:</label>
                <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-p-3 tw-rounded tw-text-sm tw-text-red-800">
                  {selectedNotification.errorMessage}
                </div>
              </div>
            )}

            {/* Metadata */}
            {selectedNotification.metadata && (
              <div className="tw-mb-4">
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Metadata:</label>
                <div className="tw-bg-gray-50 tw-border tw-p-3 tw-rounded">
                  {Object.entries(selectedNotification.metadata).map(([key, value]) => (
                    <div key={key} className="tw-flex tw-justify-between tw-py-1">
                      <span className="tw-text-sm tw-font-medium tw-text-gray-600">{key}:</span>
                      <span className="tw-text-sm tw-text-gray-900">{formatMetadataValue(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="tw-flex tw-justify-end tw-space-x-3">
              {selectedNotification.status === 'failed' && (
                <Button
                  text="Retry Notification"
                  icon="fa-solid fa-redo"
                  type="default"
                  onClick={() => {
                    handleRetry(selectedNotification);
                    setShowDetailsPopup(false);
                  }}
                />
              )}
              <Button
                text="Close"
                onClick={() => setShowDetailsPopup(false)}
              />
            </div>
          </div>
        ) : (
          <div className="tw-p-4 tw-text-sm tw-text-gray-600">
            No notification details available.
          </div>
        )}
      </Popup>
    </div>
  );
};

export default NotificationHistory;
