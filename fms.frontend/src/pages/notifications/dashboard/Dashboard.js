import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Chart,
  PieChart,
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
import { Column, Paging, FilterRow } from 'devextreme-react/data-grid';
import notify from 'devextreme/ui/notify';
import { notificationRoutes } from '../utils/navigationHelper';
import '../layout/NotificationLayout.scss';

const Dashboard = () => {
  const [loading, setLoading] = useState(false);
  const [statistics, setStatistics] = useState({
    totalNotifications: 2847,
    deliveryRate: 99.2,
    failedDeliveries: 23,
    activePolicies: 12
  });

  const [recentNotifications, setRecentNotifications] = useState([]);
  const [systemAlerts, setSystemAlerts] = useState([]);
  const [performanceData, setPerformanceData] = useState([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Simulate API calls - replace with actual API calls
      await Promise.all([
        loadStatistics(),
        loadRecentNotifications(),
        loadSystemAlerts(),
        loadPerformanceData()
      ]);
    } catch (error) {
      notify('Error loading dashboard data', 'error', 3000);
    } finally {
      setLoading(false);
    }
  };

  const loadStatistics = async () => {
    // Mock data - replace with actual API call
    const mockStats = {
      totalNotifications: 2847,
      deliveryRate: 99.2,
      failedDeliveries: 23,
      activePolicies: 12,
      avgResponseTime: 1.2,
      systemUptime: 99.8
    };
    setStatistics(mockStats);
  };

  const loadRecentNotifications = async () => {
    // Mock data - replace with actual API call
    const mockNotifications = [
      {
        id: 1,
        title: 'Tank Level Critical Alert',
        message: 'Diesel Tank #3 level below 10% threshold',
        priority: 'Critical',
        timestamp: new Date(Date.now() - 2 * 60 * 1000),
        status: 'Delivered',
        recipients: 5,
        policy: 'Tank Level Monitoring'
      },
      {
        id: 2,
        title: 'Pump Maintenance Reminder',
        message: 'Pump #7 scheduled maintenance due tomorrow',
        priority: 'Medium',
        timestamp: new Date(Date.now() - 15 * 60 * 1000),
        status: 'Delivered',
        recipients: 3,
        policy: 'Maintenance Alerts'
      },
      {
        id: 3,
        title: 'System Health Check',
        message: 'Daily system health report generated',
        priority: 'Low',
        timestamp: new Date(Date.now() - 60 * 60 * 1000),
        status: 'Delivered',
        recipients: 8,
        policy: 'System Reports'
      },
      {
        id: 4,
        title: 'Device Connection Lost',
        message: 'Sensor #15 connection timeout detected',
        priority: 'High',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
        status: 'Failed',
        recipients: 4,
        policy: 'Device Monitoring'
      }
    ];
    setRecentNotifications(mockNotifications);
  };

  const loadSystemAlerts = async () => {
    // Mock data
    const mockAlerts = [
      {
        id: 1,
        title: 'SMTP Server Latency',
        description: 'Email delivery experiencing delays',
        severity: 'Warning',
        timestamp: new Date(Date.now() - 5 * 60 * 1000),
        action: 'Investigate'
      },
      {
        id: 2,
        title: 'Policy Trigger Frequency',
        description: 'Tank Alert policy triggered 15 times in last hour',
        severity: 'Info',
        timestamp: new Date(Date.now() - 30 * 60 * 1000),
        action: 'Monitor'
      }
    ];
    setSystemAlerts(mockAlerts);
  };

  const loadPerformanceData = async () => {
    // Mock performance data
    const mockData = [
      { time: '00:00', sent: 45, delivered: 44, failed: 1 },
      { time: '04:00', sent: 23, delivered: 23, failed: 0 },
      { time: '08:00', sent: 89, delivered: 87, failed: 2 },
      { time: '12:00', sent: 156, delivered: 154, failed: 2 },
      { time: '16:00', sent: 234, delivered: 232, failed: 2 },
      { time: '20:00', sent: 178, delivered: 176, failed: 2 }
    ];
    setPerformanceData(mockData);
  };

  const formatTimestamp = (timestamp) => {
    const now = new Date();
    const diff = Math.floor((now - timestamp) / 1000);

    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'success';
      default: return 'info';
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <LoadIndicator visible={true} />
      </div>
    );
  }

  return (
    <div className="notification-dashboard">
      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon success">
            <i className="fa-light fa-bell tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.totalNotifications?.toLocaleString()}</div>
          <div className="stat-label">Notifications Sent</div>
          <div className="stat-change positive">+12% from yesterday</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon success">
            <i className="fa-light fa-check-circle tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.deliveryRate}%</div>
          <div className="stat-label">Delivery Success Rate</div>
          <div className="stat-change positive">+0.3% from yesterday</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon error">
            <i className="fa-light fa-exclamation-circle tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.failedDeliveries}</div>
          <div className="stat-label">Failed Deliveries</div>
          <div className="stat-change positive">-8% from yesterday</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon info">
            <i className="fa-light fa-file-lines tw-text-xl"></i>
          </div>
          <div className="stat-value">{statistics.activePolicies}</div>
          <div className="stat-label">Active Policies</div>
          <div className="stat-change neutral">+2 new policies</div>
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
            <div className="tw-text-sm tw-text-gray-500">Last 24 hours</div>
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
              System Alerts
            </h3>
            <Link
              to={notificationRoutes.testing}
              className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-800"
            >
              View All
            </Link>
          </div>
          <div className="tw-space-y-4">
            {systemAlerts.map((alert) => (
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
                <button className="tw-text-sm tw-text-blue-600 hover:tw-text-blue-800">
                  {alert.action}
                </button>
              </div>
            ))}
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
  );
};

export default Dashboard;
