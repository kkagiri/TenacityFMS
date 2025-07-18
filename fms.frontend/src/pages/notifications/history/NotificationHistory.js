import React, { useState, useEffect } from 'react';
import { DataGrid, Column } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip } from 'devextreme-react/chart';
import notify from 'devextreme/ui/notify';

// Mock data for notification history
// eslint-disable-next-line no-unused-vars
const mockNotifications = [
  {
    id: 1,
    type: 'email',
    subject: 'Low Fuel Alert - Tank A1',
    recipient: 'john.smith@company.com',
    status: 'sent',
    sentAt: '2024-01-25T10:30:00',
    deliveredAt: '2024-01-25T10:30:15',
    template: 'Low Fuel Alert',
    policy: 'Critical Fuel Alerts',
    priority: 'high',
    retryCount: 0,
    errorMessage: null,
    metadata: {
      tankName: 'Tank A1',
      currentLevel: '15%',
      threshold: '20%'
    }
  },
  {
    id: 2,
    type: 'sms',
    subject: 'Temperature Warning',
    recipient: '+1-555-0124',
    status: 'delivered',
    sentAt: '2024-01-25T09:15:00',
    deliveredAt: '2024-01-25T09:15:05',
    template: 'High Temperature Warning',
    policy: 'Temperature Monitoring',
    priority: 'medium',
    retryCount: 0,
    errorMessage: null,
    metadata: {
      tankName: 'Tank B2',
      temperature: '85°C',
      maxTemperature: '80°C'
    }
  },
  {
    id: 3,
    type: 'email',
    subject: 'Maintenance Reminder',
    recipient: 'sarah.johnson@company.com',
    status: 'failed',
    sentAt: '2024-01-25T08:00:00',
    deliveredAt: null,
    template: 'Maintenance Reminder',
    policy: 'Scheduled Maintenance',
    priority: 'low',
    retryCount: 3,
    errorMessage: 'SMTP connection timeout',
    metadata: {
      equipmentName: 'Pump Unit 3',
      maintenanceDate: '2024-01-30'
    }
  },
  {
    id: 4,
    type: 'push',
    subject: 'System Status Update',
    recipient: 'mobile_device_001',
    status: 'pending',
    sentAt: '2024-01-25T11:45:00',
    deliveredAt: null,
    template: 'System Status',
    policy: 'System Updates',
    priority: 'low',
    retryCount: 1,
    errorMessage: null,
    metadata: {
      systemStatus: 'Online',
      uptime: '99.5%'
    }
  },
  {
    id: 5,
    type: 'email',
    subject: 'Daily Report',
    recipient: 'manager@company.com',
    status: 'sent',
    sentAt: '2024-01-24T17:00:00',
    deliveredAt: '2024-01-24T17:00:12',
    template: 'Daily Summary Report',
    policy: 'Daily Reports',
    priority: 'low',
    retryCount: 0,
    errorMessage: null,
    metadata: {
      reportDate: '2024-01-24',
      totalAlerts: '3',
      fuelLevel: 'Normal'
    }
  }
];

// Mock chart data for notification statistics
// eslint-disable-next-line no-unused-vars
const mockChartData = [
  { date: '2024-01-20', sent: 45, delivered: 42, failed: 3 },
  { date: '2024-01-21', sent: 52, delivered: 48, failed: 4 },
  { date: '2024-01-22', sent: 38, delivered: 35, failed: 3 },
  { date: '2024-01-23', sent: 61, delivered: 57, failed: 4 },
  { date: '2024-01-24', sent: 49, delivered: 46, failed: 3 },
  { date: '2024-01-25', sent: 33, delivered: 30, failed: 3 }
];

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

  // Mock data for notification history
  const mockNotifications = [
    {
      id: 1,
      type: 'email',
      subject: 'Low Fuel Alert - Tank A1',
      recipient: 'john.smith@company.com',
      status: 'sent',
      sentAt: '2024-01-25T10:30:00',
      deliveredAt: '2024-01-25T10:30:15',
      template: 'Low Fuel Alert',
      policy: 'Critical Fuel Alerts',
      priority: 'high',
      retryCount: 0,
      errorMessage: null,
      metadata: {
        tankName: 'Tank A1',
        currentLevel: '15%',
        threshold: '20%'
      }
    },
    {
      id: 2,
      type: 'sms',
      subject: 'Temperature Warning',
      recipient: '+1-555-0124',
      status: 'delivered',
      sentAt: '2024-01-25T09:15:00',
      deliveredAt: '2024-01-25T09:15:05',
      template: 'High Temperature Warning',
      policy: 'Temperature Monitoring',
      priority: 'medium',
      retryCount: 0,
      errorMessage: null,
      metadata: {
        tankName: 'Tank B2',
        temperature: '85°C',
        maxTemperature: '80°C'
      }
    },
    {
      id: 3,
      type: 'email',
      subject: 'Maintenance Reminder',
      recipient: 'sarah.johnson@company.com',
      status: 'failed',
      sentAt: '2024-01-25T08:00:00',
      deliveredAt: null,
      template: 'Maintenance Reminder',
      policy: 'Scheduled Maintenance',
      priority: 'low',
      retryCount: 3,
      errorMessage: 'SMTP connection timeout',
      metadata: {
        equipmentName: 'Pump Unit 3',
        maintenanceDate: '2024-01-30'
      }
    },
    {
      id: 4,
      type: 'push',
      subject: 'System Status Update',
      recipient: 'mobile_device_001',
      status: 'pending',
      sentAt: '2024-01-25T11:45:00',
      deliveredAt: null,
      template: 'System Status',
      policy: 'System Updates',
      priority: 'low',
      retryCount: 1,
      errorMessage: null,
      metadata: {
        systemStatus: 'Online',
        uptime: '99.5%'
      }
    },
    {
      id: 5,
      type: 'email',
      subject: 'Daily Report',
      recipient: 'manager@company.com',
      status: 'sent',
      sentAt: '2024-01-24T17:00:00',
      deliveredAt: '2024-01-24T17:00:12',
      template: 'Daily Summary Report',
      policy: 'Daily Reports',
      priority: 'low',
      retryCount: 0,
      errorMessage: null,
      metadata: {
        reportDate: '2024-01-24',
        totalAlerts: '3',
        fuelLevel: 'Normal'
      }
    }
  ];

  // Mock chart data for notification statistics
  const mockChartData = [
    { date: '2024-01-20', sent: 45, delivered: 42, failed: 3 },
    { date: '2024-01-21', sent: 52, delivered: 48, failed: 4 },
    { date: '2024-01-22', sent: 38, delivered: 35, failed: 3 },
    { date: '2024-01-23', sent: 61, delivered: 57, failed: 4 },
    { date: '2024-01-24', sent: 49, delivered: 46, failed: 3 },
    { date: '2024-01-25', sent: 33, delivered: 30, failed: 3 }
  ];

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
    const loadData = async () => {
      setLoading(true);
      // Simulate API call with filters
      setTimeout(() => {
        let filteredData = [...mockNotifications];

        if (filters.status !== 'all') {
          filteredData = filteredData.filter(n => n.status === filters.status);
        }

        if (filters.type !== 'all') {
          filteredData = filteredData.filter(n => n.type === filters.type);
        }

        // Date filtering would be implemented here

        setNotifications(filteredData);
        setLoading(false);
      }, 500);
    };

    const loadChart = async () => {
      // Simulate API call
      setTimeout(() => {
        setChartData(mockChartData);
      }, 300);
    };

    loadData();
    loadChart();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setShowDetailsPopup(true);
  };

  const handleRetry = async (notification) => {
    if (notification.status === 'failed') {
      setLoading(true);

      // Simulate retry API call
      setTimeout(() => {
        setNotifications(prev => prev.map(n =>
          n.id === notification.id
            ? { ...n, status: 'pending', retryCount: n.retryCount + 1, errorMessage: null }
            : n
        ));
        notify('Notification retry initiated!', 'success', 3000);
        setLoading(false);
      }, 1000);
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
          onClick={() => handleViewDetails(data.data)}
          type="normal"
          stylingMode="text"
        />
        {data.data.status === 'failed' && (
          <Button
            icon="fa-solid fa-redo"
            hint="Retry"
            onClick={() => handleRetry(data.data)}
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
      >
        {selectedNotification && (
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
                      <span className="tw-text-sm tw-text-gray-900">{value}</span>
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
        )}
      </Popup>
    </div>
  );
};

export default NotificationHistory;
