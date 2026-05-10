/**
 * File: Dashboard.js
 * Purpose: Admin notification dashboard that renders live summary metrics, delivery performance, and recent activity.
 * Dependencies: react, react-router-dom, devextreme-react, notificationsApi
 * Last Modified: 2026-04-01
 *
 * Key Functions:
 * - loadDashboardData: Loads live admin dashboard data from the notification module.
 * - mapPerformanceSeries: Converts API performance buckets into chart rows.
 * - buildSystemAlerts: Derives recent delivery issues from live notification activity.
 */
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart,
  DataGrid,
  LoadIndicator
} from 'devextreme-react';
import {
  Series,
  ArgumentAxis,
  ValueAxis,
  Legend,
  Tooltip
} from 'devextreme-react/chart';
import { Column, Paging } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import notificationsApi from '../../../dataservice/notificationsApi';
import { notificationRoutes } from '../utils/navigationHelper';
import '../layout/NotificationLayout.scss';

const DEFAULT_STATISTICS = {
  totalNotifications: 0,
  deliveredNotifications: 0,
  failedDeliveries: 0,
  deliveryRate: 0,
  activePolicies: 0,
  notificationCount: 0,
  periodLabel: 'Last 24 hours'
};

const formatPeriodLabel = (fromDate, toDate) => {
  if (!fromDate || !toDate) {
    return 'Last 24 hours';
  }

  const start = new Date(fromDate);
  const end = new Date(toDate);
  const formatter = new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  return `${formatter.format(start)} - ${formatter.format(end)}`;
};

const formatChartTime = (value) => {
  if (!value) {
    return '—';
  }

  return new Intl.DateTimeFormat(undefined, {
    hour: '2-digit',
    minute: '2-digit'
  }).format(new Date(value));
};

const mapPerformanceSeries = (items = []) => {
  return items.map((item) => ({
    time: formatChartTime(item.bucketStart),
    sent: item.sent ?? 0,
    delivered: item.delivered ?? 0,
    failed: item.failed ?? 0
  }));
};

const mapRecentNotifications = (items = []) => {
  return items.map((item) => ({
    id: item.id,
    title: item.title,
    message: item.message,
    priority: item.priority,
    timestamp: new Date(item.createdAt),
    status: item.status,
    recipients: item.recipientCount ?? 0,
    policy: item.policyName || 'Unassigned',
    failedCount: item.failedCount ?? 0,
    deliveredCount: item.deliveredCount ?? 0
  }));
};

const buildSystemAlerts = (items = []) => {
  return items
    .filter((item) => (item.failedCount ?? 0) > 0 || String(item.status || '').toLowerCase() === 'failed')
    .slice(0, 4)
    .map((item) => ({
      id: item.id,
      title: item.title,
      description: `${item.failedCount ?? 0} failed delivery${(item.failedCount ?? 0) === 1 ? '' : 'ies'}${item.policyName ? ` • ${item.policyName}` : ''}`,
      severity: (item.failedCount ?? 0) > 0 ? 'Warning' : 'Info',
      timestamp: new Date(item.createdAt)
    }));
};

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState(DEFAULT_STATISTICS);

  const [recentNotifications, setRecentNotifications] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const response = await notificationsApi.getAdminDashboard({
        recentCount: 10,
        bucketHours: 4
      });

      if (!response.isSuccess) {
        throw new Error(response.message);
      }

      const dashboardData = response.data || {};
      const liveRecentNotifications = mapRecentNotifications(dashboardData.recentNotifications);

      setStatistics({
        totalNotifications: dashboardData.totalSent ?? 0,
        deliveredNotifications: dashboardData.totalDelivered ?? 0,
        failedDeliveries: dashboardData.totalFailed ?? 0,
        deliveryRate: Number(dashboardData.deliveryRate ?? 0),
        activePolicies: dashboardData.activePolicies ?? 0,
        notificationCount: dashboardData.notificationCount ?? 0,
        periodLabel: formatPeriodLabel(dashboardData.fromDate, dashboardData.toDate)
      });
      setPerformanceData(mapPerformanceSeries(dashboardData.performanceSeries));
      setRecentNotifications(liveRecentNotifications);
      setSystemAlerts(buildSystemAlerts(dashboardData.recentNotifications));
    } catch (error) {
      notify(error.message || 'Error loading dashboard data', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator visible={true} />
      </div>
    );
  }

  return (
    <div className="form-container">
      <div className="form-content">
        <div className="notification-dashboard notification-form">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon success">
            <i className="fa-light fa-bell tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.totalNotifications?.toLocaleString()}</div>
          <div className="stat-label">Notifications Sent</div>
          <div className="stat-change neutral">{statistics.periodLabel}</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <i className="fa-light fa-check-circle tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.deliveryRate}%</div>
          <div className="stat-label">Delivery Success Rate</div>
          <div className="stat-change neutral">{statistics.deliveredNotifications?.toLocaleString()} delivered</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon error">
            <i className="fa-light fa-exclamation-circle tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.failedDeliveries}</div>
          <div className="stat-label">Failed Deliveries</div>
          <div className="stat-change neutral">{statistics.notificationCount?.toLocaleString()} notifications created</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <i className="fa-light fa-file-lines tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.activePolicies}</div>
          <div className="stat-label">Active Policies</div>
          <div className="stat-change neutral">Currently enabled</div>
        </div>
      </div>

      {/* Charts and Activity */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-8">
        {/* Performance Chart */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
              Notification Performance
            </h3>
            <div className="tw-text-sm tw-text-gray-500">{statistics.periodLabel}</div>
          </div>
          <Chart
            dataSource={performanceData}
            height={300}
          >
            <ArgumentAxis />
            <ValueAxis />
            <Series
              valueField="sent"
              argumentField="time"
              name="Sent"
              type="line"
              color="#3B82F6"
            />
            <Series
              valueField="delivered"
              argumentField="time"
              name="Delivered"
              type="line"
              color="#10B981"
            />
            <Series
              valueField="failed"
              argumentField="time"
              name="Failed"
              type="line"
              color="#EF4444"
            />
            <Legend visible={true} />
            <Tooltip enabled={true} />
          </Chart>
        </div>

        {/* System Alerts */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
              Delivery Alerts
            </h3>
            <Link
              to={notificationRoutes.history}
              className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-800"
            >
              View History
            </Link>
          </div>
          <div className="tw-space-y-4">
            {systemAlerts.length === 0 ? (
              <div className="tw-rounded-md tw-border tw-border-gray-200 tw-bg-gray-50 tw-p-4 tw-text-sm tw-text-gray-600">
                No active delivery issues in recent notifications.
              </div>
            ) : (
              systemAlerts.map((alert) => (
                <div key={alert.id} className="tw-flex tw-items-start tw-space-x-3">
                  <div className={`tw-w-2 tw-h-2 tw-rounded-full tw-mt-2 ${
                    alert.severity === 'Warning' ? 'tw-bg-yellow-400' : 'tw-bg-blue-400'
                  }`}></div>
                  <div className="tw-flex-1">
                    <div className="tw-font-medium tw-text-sm tw-text-gray-900">
                      {alert.title}
                    </div>
                    <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
                      {alert.description}
                    </div>
                    <div className="tw-text-xs tw-text-gray-500 tw-mt-1">
                      {formatTimestamp(alert.timestamp)}
                    </div>
                  </div>
                  <Link
                    to={notificationRoutes.history}
                    className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-800"
                  >
                    Review
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Notifications */}
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
              Recent Notifications
            </h3>
            <Link
              to={notificationRoutes.history}
              className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-800"
            >
              View All History
            </Link>
          </div>
        </div>
        <div className="tw-p-6">
          <DataGrid
            dataSource={recentNotifications}
            showBorders={false}
            showRowLines={false}
            height={400}
          >
            <Column
              dataField="title"
              caption="Notification"
              cellRender={({ data }) => (
                <div>
                  <div className="tw-font-medium tw-text-gray-900">{data.title}</div>
                  <div className="tw-text-sm tw-text-gray-600 tw-mt-1">{data.message}</div>
                </div>
              )}
            />
            <Column
              dataField="priority"
              caption="Priority"
              width={100}
              cellRender={({ data }) => (
                <span className={`priority-badge ${data.priority?.toLowerCase()}`}>
                  {data.priority}
                </span>
              )}
            />
            <Column
              dataField="status"
              caption="Status"
              width={100}
              cellRender={({ data }) => (
                <span className={`status-badge ${data.status?.toLowerCase()}`}>
                  {data.status}
                </span>
              )}
            />
            <Column
              dataField="recipients"
              caption="Recipients"
              width={100}
              cellRender={({ data }) => (
                <div className="tw-flex tw-items-center">
                  <i className="fa-light fa-users tw-mr-1 tw-text-gray-400"></i>
                  {data.recipients}
                </div>
              )}
            />
            <Column
              dataField="timestamp"
              caption="Time"
              width={120}
              cellRender={({ data }) => (
                <span className="tw-text-sm tw-text-gray-600">
                  {formatTimestamp(data.timestamp)}
                </span>
              )}
            />
            <Paging enabled={false} />
          </DataGrid>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="tw-mt-8 tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
        <Link
          to={notificationRoutes.policyCreate}
          className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-block"
        >
          <div className="tw-text-center">
            <i className="fa-light fa-plus tw-text-3xl tw-text-blue-600 tw-mb-3"></i>
            <div className="tw-font-medium tw-text-gray-900">Create Policy</div>
            <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Set up new notification rules
            </div>
          </div>
        </Link>

        <Link
          to={notificationRoutes.testing}
          className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-block"
        >
          <div className="tw-text-center">
            <i className="fa-light fa-flask-vial tw-text-3xl tw-text-green-600 tw-mb-3"></i>
            <div className="tw-font-medium tw-text-gray-900">Test Notifications</div>
            <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Send test emails and diagnostics
            </div>
          </div>
        </Link>

        <Link
          to={notificationRoutes.emailConfig}
          className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-block"
        >
          <div className="tw-text-center">
            <i className="fa-light fa-gear tw-text-3xl tw-text-purple-600 tw-mb-3"></i>
            <div className="tw-font-medium tw-text-gray-900">Email Settings</div>
            <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Configure SMTP server
            </div>
          </div>
        </Link>

        <Link
          to={notificationRoutes.recipients}
          className="tw-bg-white tw-p-6 tw-rounded-lg tw-border tw-border-gray-200 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow tw-block"
        >
          <div className="tw-text-center">
            <i className="fa-light fa-users tw-text-3xl tw-text-orange-600 tw-mb-3"></i>
            <div className="tw-font-medium tw-text-gray-900">Manage Recipients</div>
            <div className="tw-text-sm tw-text-gray-600 tw-mt-1">
              User and group management
            </div>
          </div>
        </Link>
      </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
