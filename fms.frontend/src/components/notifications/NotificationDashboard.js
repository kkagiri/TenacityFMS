import React, { useState, useEffect, useCallback } from "react";
import { useSelector, useDispatch } from "react-redux";
import {
  DataGrid,
  Button,
  SelectBox,
  DateBox,
  NumberBox,
  TextBox,
  TextArea,
  CheckBox,
  Popup,
  ScrollView,
  TabPanel,
  Chart,
  PieChart,
  LoadIndicator,
  ValidationGroup,
  Validator,
  Toolbar,
} from "devextreme-react";
import { Item as ToolbarItem } from "devextreme-react/toolbar";
import { RequiredRule } from "devextreme-react/form";
import { Column, Paging, FilterRow, HeaderFilter, Scrolling, Selection, Export } from "devextreme-react/data-grid";
import { Series, ArgumentAxis, ValueAxis, Legend, Tooltip } from "devextreme-react/chart";
import notify from "devextreme/ui/notify";
import "./NotificationDashboard.scss";

const NotificationDashboard = () => {
  const dispatch = useDispatch();
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);

  // Data states
  const [notifications, setNotifications] = useState([]);
  const [notificationPolicies, setNotificationPolicies] = useState([]);
  const [alarmHandlers, setAlarmHandlers] = useState([]);
  const [alertRecords, setAlertRecords] = useState([]);
  const [statistics, setStatistics] = useState({});

  // Filter states
  const [dateRange, setDateRange] = useState({
    startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
    endDate: new Date()
  });
  const [selectedSite, setSelectedSite] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState(null);

  // Modal states
  const [showCreatePolicy, setShowCreatePolicy] = useState(false);
  const [showCreateTrigger, setShowCreateTrigger] = useState(false);
  const [showTestNotification, setShowTestNotification] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);

  // Form states
  const [newPolicy, setNewPolicy] = useState({
    name: "",
    category: "",
    notificationType: "Alert",
    priority: "Medium",
    enableEmail: true,
    enableSms: false,
    enableSystem: true,
    maxNotificationsPerHour: 10,
    maxNotificationsPerDay: 50,
    cooldownMinutes: 30,
    titleTemplate: "",
    messageTemplate: "",
    requireAcknowledgment: false
  });

  const [newTrigger, setNewTrigger] = useState({
    type: "Alert",
    category: "System",
    priority: "Medium",
    title: "",
    message: "",
    triggerSource: "Manual",
    recipients: []
  });

  // Load initial data
  useEffect(() => {
    loadDashboardData();
  }, [dateRange, selectedSite, selectedCategory, selectedStatus]);

  const loadDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      await Promise.all([
        loadNotifications(),
        loadNotificationPolicies(),
        loadAlarmHandlers(),
        loadAlertRecords(),
        loadStatistics()
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      notify("Error loading dashboard data", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [dateRange, selectedSite, selectedCategory, selectedStatus]);

  const loadNotifications = async () => {
    try {
      const params = new URLSearchParams({
        fromDate: dateRange.startDate.toISOString(),
        toDate: dateRange.endDate.toISOString(),
        skip: 0,
        take: 1000
      });

      if (selectedSite) params.append('siteId', selectedSite);
      if (selectedCategory) params.append('category', selectedCategory);
      if (selectedStatus) params.append('status', selectedStatus);

      const response = await fetch(`/api/notification?${params}`);
      if (response.ok) {
        const data = await response.json();
        setNotifications(data.notifications || []);
      }
    } catch (error) {
      console.error("Error loading notifications:", error);
    }
  };

  const loadNotificationPolicies = async () => {
    try {
      const response = await fetch('/api/notification/policies');
      if (response.ok) {
        const data = await response.json();
        setNotificationPolicies(data || []);
      }
    } catch (error) {
      console.error("Error loading notification policies:", error);
    }
  };

  const loadAlarmHandlers = async () => {
    try {
      const response = await fetch('/api/notification/alarm-handlers');
      if (response.ok) {
        const data = await response.json();
        setAlarmHandlers(data || []);
      }
    } catch (error) {
      console.error("Error loading alarm handlers:", error);
    }
  };

  const loadAlertRecords = async () => {
    try {
      const params = new URLSearchParams({
        fromDate: dateRange.startDate.toISOString(),
        toDate: dateRange.endDate.toISOString(),
        skip: 0,
        take: 1000
      });

      const response = await fetch(`/api/notification/alert-records?${params}`);
      if (response.ok) {
        const data = await response.json();
        setAlertRecords(data || []);
      }
    } catch (error) {
      console.error("Error loading alert records:", error);
    }
  };

  const loadStatistics = async () => {
    try {
      const params = new URLSearchParams({
        fromDate: dateRange.startDate.toISOString(),
        toDate: dateRange.endDate.toISOString()
      });

      const response = await fetch(`/api/notification/statistics?${params}`);
      if (response.ok) {
        const data = await response.json();
        setStatistics(data || {});
      }
    } catch (error) {
      console.error("Error loading statistics:", error);
    }
  };

  const handleCreatePolicy = async () => {
    try {
      const response = await fetch('/api/notification/policies', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPolicy)
      });

      if (response.ok) {
        notify("Notification policy created successfully", "success", 3000);
        setShowCreatePolicy(false);
        setNewPolicy({
          name: "",
          category: "",
          notificationType: "Alert",
          priority: "Medium",
          enableEmail: true,
          enableSms: false,
          enableSystem: true,
          maxNotificationsPerHour: 10,
          maxNotificationsPerDay: 50,
          cooldownMinutes: 30,
          titleTemplate: "",
          messageTemplate: "",
          requireAcknowledgment: false
        });
        await loadNotificationPolicies();
      } else {
        const error = await response.json();
        notify(`Error creating policy: ${error.message}`, "error", 3000);
      }
    } catch (error) {
      console.error("Error creating policy:", error);
      notify("Error creating notification policy", "error", 3000);
    }
  };

  const handleCreateTrigger = async () => {
    try {
      const response = await fetch('/api/notification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTrigger)
      });

      if (response.ok) {
        notify("Custom notification triggered successfully", "success", 3000);
        setShowCreateTrigger(false);
        setNewTrigger({
          type: "Alert",
          category: "System",
          priority: "Medium",
          title: "",
          message: "",
          triggerSource: "Manual",
          recipients: []
        });
        await loadNotifications();
      } else {
        const error = await response.json();
        notify(`Error creating trigger: ${error.message}`, "error", 3000);
      }
    } catch (error) {
      console.error("Error creating trigger:", error);
      notify("Error creating custom trigger", "error", 3000);
    }
  };

  const handleTestNotification = async () => {
    try {
      const response = await fetch('/api/notification/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: "Test Notification",
          message: "This is a test notification from the dashboard",
          deliveryMethods: ["System"]
        })
      });

      if (response.ok) {
        notify("Test notification sent successfully", "success", 3000);
        setShowTestNotification(false);
      } else {
        const error = await response.json();
        notify(`Error sending test: ${error.message}`, "error", 3000);
      }
    } catch (error) {
      console.error("Error sending test notification:", error);
      notify("Error sending test notification", "error", 3000);
    }
  };

  const formatDateTime = (date) => {
    if (!date) return "";
    return new Date(date).toLocaleString();
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'sent': return 'tw-text-green-600';
      case 'pending': return 'tw-text-yellow-600';
      case 'failed': return 'tw-text-red-600';
      case 'scheduled': return 'tw-text-blue-600';
      default: return 'tw-text-gray-600';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'critical': return 'tw-text-red-600 tw-font-bold';
      case 'high': return 'tw-text-orange-600 tw-font-semibold';
      case 'medium': return 'tw-text-yellow-600';
      case 'low': return 'tw-text-green-600';
      default: return 'tw-text-gray-600';
    }
  };

  // Chart data preparation
  const deliveryMethodData = statistics.deliveryMethods || [];
  const priorityData = statistics.priorities || [];
  const dailyVolumeData = statistics.dailyVolume || [];

  const tabItems = [
    {
      title: "Overview",
      icon: "fa-light fa-chart-line",
      template: () => (
        <div className="tw-p-6">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
            {/* Statistics Cards */}
            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-font-medium tw-text-gray-600">Total Notifications</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-gray-900">{statistics.totalNotifications || 0}</p>
                </div>
                <div className="tw-w-12 tw-h-12 tw-bg-blue-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
                  <i className="fa-light fa-bell tw-text-blue-600 tw-text-xl"></i>
                </div>
              </div>
            </div>

            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-font-medium tw-text-gray-600">Delivery Rate</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-green-600">{statistics.deliveryRate || 0}%</p>
                </div>
                <div className="tw-w-12 tw-h-12 tw-bg-green-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
                  <i className="fa-light fa-check-circle tw-text-green-600 tw-text-xl"></i>
                </div>
              </div>
            </div>

            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-font-medium tw-text-gray-600">Pending</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-yellow-600">{statistics.pendingCount || 0}</p>
                </div>
                <div className="tw-w-12 tw-h-12 tw-bg-yellow-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
                  <i className="fa-light fa-clock tw-text-yellow-600 tw-text-xl"></i>
                </div>
              </div>
            </div>

            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <p className="tw-text-sm tw-font-medium tw-text-gray-600">Failed</p>
                  <p className="tw-text-3xl tw-font-bold tw-text-red-600">{statistics.failedCount || 0}</p>
                </div>
                <div className="tw-w-12 tw-h-12 tw-bg-red-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
                  <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-text-xl"></i>
                </div>
              </div>
            </div>
          </div>

          {/* Charts */}
          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Delivery Methods</h3>
              <PieChart
                id="delivery-methods-chart"
                dataSource={deliveryMethodData}
                height={300}
              >
                <Series argumentField="method" valueField="count" />
                <Legend visible={true} />
                <Tooltip enabled={true} />
              </PieChart>
            </div>

            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Priority Distribution</h3>
              <PieChart
                id="priority-chart"
                dataSource={priorityData}
                height={300}
              >
                <Series argumentField="priority" valueField="count" />
                <Legend visible={true} />
                <Tooltip enabled={true} />
              </PieChart>
            </div>
          </div>

          {/* Daily Volume Chart */}
          <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md tw-mt-6">
            <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Daily Notification Volume</h3>
            <Chart
              id="daily-volume-chart"
              dataSource={dailyVolumeData}
              height={300}
            >
              <ArgumentAxis />
              <ValueAxis />
              <Series
                valueField="count"
                argumentField="date"
                name="Notifications"
                type="line"
                color="#3b82f6"
              />
              <Legend visible={false} />
              <Tooltip enabled={true} />
            </Chart>
          </div>
        </div>
      )
    },
    {
      title: "Notifications",
      icon: "fa-light fa-list",
      template: () => (
        <div className="tw-p-6">
          <div className="tw-mb-6">
            <Toolbar>
              <ToolbarItem location="before">
                <div className="tw-flex tw-gap-4 tw-items-center">
                  <DateBox
                    value={dateRange.startDate}
                    onValueChanged={(e) => setDateRange(prev => ({ ...prev, startDate: e.value }))}
                    placeholder="Start Date"
                    width={150}
                  />
                  <DateBox
                    value={dateRange.endDate}
                    onValueChanged={(e) => setDateRange(prev => ({ ...prev, endDate: e.value }))}
                    placeholder="End Date"
                    width={150}
                  />
                  <SelectBox
                    dataSource={['All', 'Sent', 'Pending', 'Failed', 'Scheduled']}
                    value={selectedStatus || 'All'}
                    onValueChanged={(e) => setSelectedStatus(e.value === 'All' ? null : e.value)}
                    placeholder="Status"
                    width={120}
                  />
                </div>
              </ToolbarItem>
              <ToolbarItem location="after">
                <Button
                  text="Refresh"
                  icon="fa-light fa-refresh"
                  onClick={loadNotifications}
                />
              </ToolbarItem>
            </Toolbar>
          </div>

          <DataGrid
            dataSource={notifications}
            showBorders={true}
            remoteOperations={false}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
            height={600}
          >
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={50} />
            <Selection mode="single" />
            <Export enabled={true} />

            <Column dataField="notificationId" caption="ID" width={100} />
            <Column dataField="title" caption="Title" />
            <Column dataField="message" caption="Message" />
            <Column
              dataField="type"
              caption="Type"
              width={100}
            />
            <Column
              dataField="category"
              caption="Category"
              width={100}
            />
            <Column
              dataField="priority"
              caption="Priority"
              width={100}
              cellRender={(data) => (
                <span className={getPriorityColor(data.value)}>
                  {data.value}
                </span>
              )}
            />
            <Column
              dataField="status"
              caption="Status"
              width={100}
              cellRender={(data) => (
                <span className={getStatusColor(data.value)}>
                  {data.value}
                </span>
              )}
            />
            <Column
              dataField="createdAt"
              caption="Created"
              dataType="datetime"
              width={150}
            />
            <Column
              dataField="sentAt"
              caption="Sent"
              dataType="datetime"
              width={150}
            />
            <Column
              dataField="sendAttempts"
              caption="Retries"
              width={80}
            />
            <Column
              dataField="triggeredBy"
              caption="Triggered By"
              width={120}
            />
          </DataGrid>
        </div>
      )
    },
    {
      title: "Policies",
      icon: "fa-light fa-cog",
      template: () => (
        <div className="tw-p-6">
          <div className="tw-mb-6">
            <Button
              text="Create Policy"
              icon="fa-light fa-plus"
              type="default"
              onClick={() => setShowCreatePolicy(true)}
            />
          </div>

          <DataGrid
            dataSource={notificationPolicies}
            showBorders={true}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
            height={500}
          >
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={20} />

            <Column dataField="name" caption="Name" />
            <Column dataField="category" caption="Category" width={120} />
            <Column dataField="notificationType" caption="Type" width={100} />
            <Column dataField="priority" caption="Priority" width={100} />
            <Column dataField="maxNotificationsPerHour" caption="Max/Hour" width={100} />
            <Column dataField="maxNotificationsPerDay" caption="Max/Day" width={100} />
            <Column dataField="cooldownMinutes" caption="Cooldown (min)" width={120} />
            <Column
              dataField="isActive"
              caption="Active"
              dataType="boolean"
              width={80}
            />
            <Column
              dataField="createdAt"
              caption="Created"
              dataType="datetime"
              width={150}
            />
          </DataGrid>
        </div>
      )
    },
    {
      title: "Alarm Handlers",
      icon: "fa-light fa-exclamation-triangle",
      template: () => (
        <div className="tw-p-6">
          <DataGrid
            dataSource={alarmHandlers}
            showBorders={true}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
            height={500}
          >
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={20} />

            <Column dataField="name" caption="Name" />
            <Column dataField="alarmType" caption="Alarm Type" />
            <Column dataField="priority" caption="Priority" width={100} />
            <Column dataField="cooldownMinutes" caption="Cooldown (min)" width={120} />
            <Column dataField="maxNotificationsPerDay" caption="Max/Day" width={100} />
            <Column dataField="triggerCount" caption="Triggered" width={100} />
            <Column
              dataField="lastTriggeredAt"
              caption="Last Triggered"
              dataType="datetime"
              width={150}
            />
            <Column
              dataField="isActive"
              caption="Active"
              dataType="boolean"
              width={80}
            />
          </DataGrid>
        </div>
      )
    },
    {
      title: "PTS Alerts",
      icon: "fa-light fa-server",
      template: () => (
        <div className="tw-p-6">
          <DataGrid
            dataSource={alertRecords}
            showBorders={true}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
            height={500}
          >
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={50} />

            <Column dataField="ptsId" caption="PTS ID" width={150} />
            <Column dataField="deviceType" caption="Device Type" width={120} />
            <Column dataField="deviceNumber" caption="Device #" width={100} />
            <Column dataField="alertCode" caption="Alert Code" width={100} />
            <Column dataField="state" caption="State" width={100} />
            <Column
              dataField="dateTime"
              caption="Alert Time"
              dataType="datetime"
              width={150}
            />
            <Column
              dataField="processedAt"
              caption="Processed"
              dataType="datetime"
              width={150}
            />
            <Column dataField="configurationId" caption="Config ID" width={120} />
          </DataGrid>
        </div>
      )
    },
    {
      title: "Tools",
      icon: "fa-light fa-tools",
      template: () => (
        <div className="tw-p-6">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Create Custom Trigger</h3>
              <p className="tw-text-gray-600 tw-mb-4">Send a custom notification to specific users</p>
              <Button
                text="Create Trigger"
                icon="fa-light fa-plus"
                type="default"
                width="100%"
                onClick={() => setShowCreateTrigger(true)}
              />
            </div>

            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Test Notification</h3>
              <p className="tw-text-gray-600 tw-mb-4">Send a test notification to yourself</p>
              <Button
                text="Send Test"
                icon="fa-light fa-paper-plane"
                type="default"
                width="100%"
                onClick={handleTestNotification}
              />
            </div>

            <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow-md">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-4">Export Reports</h3>
              <p className="tw-text-gray-600 tw-mb-4">Export notification data for analysis</p>
              <Button
                text="Export Data"
                icon="fa-light fa-download"
                type="default"
                width="100%"
                onClick={() => notify("Export functionality coming soon", "info", 3000)}
              />
            </div>
          </div>
        </div>
      )
    }
  ];

  return (
    <div className="notification-dashboard tw-h-full">
      {loading && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <LoadIndicator visible={true} />
        </div>
      )}

      <div className="tw-bg-white tw-border-b tw-px-6 tw-py-4">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900">Notification Dashboard</h1>
            <p className="tw-text-gray-600">Manage notifications, policies, and monitoring</p>
          </div>
          <div className="tw-flex tw-gap-2">
            <Button
              text="Refresh All"
              icon="fa-light fa-refresh"
              onClick={loadDashboardData}
            />
          </div>
        </div>
      </div>

      <TabPanel
        selectedIndex={activeTab}
        onSelectionChanged={(e) => setActiveTab(e.selectedIndex)}
        height="calc(100vh - 120px)"
        showNavButtons={true}
      >
        {tabItems.map((tab, index) => (
          <div key={index} title={tab.title} icon={tab.icon}>
            {tab.template()}
          </div>
        ))}
      </TabPanel>

      {/* Create Policy Modal */}
      <Popup
        visible={showCreatePolicy}
        onHiding={() => setShowCreatePolicy(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Create Notification Policy"
        width={600}
        height={700}
      >
        <ScrollView height="100%">
          <div className="tw-p-6">
            <ValidationGroup>
              <div className="tw-grid tw-grid-cols-1 tw-gap-4">
                <TextBox
                  label="Policy Name"
                  value={newPolicy.name}
                  onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, name: e.value }))}
                >
                  <Validator>
                    <RequiredRule message="Policy name is required" />
                  </Validator>
                </TextBox>

                <SelectBox
                  label="Category"
                  dataSource={['Tank', 'Pump', 'Device', 'System', 'Custom']}
                  value={newPolicy.category}
                  onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, category: e.value }))}
                >
                  <Validator>
                    <RequiredRule message="Category is required" />
                  </Validator>
                </SelectBox>

                <SelectBox
                  label="Priority"
                  dataSource={['Low', 'Medium', 'High', 'Critical']}
                  value={newPolicy.priority}
                  onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, priority: e.value }))}
                />

                <div className="tw-grid tw-grid-cols-3 tw-gap-4">
                  <CheckBox
                    text="Enable Email"
                    value={newPolicy.enableEmail}
                    onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, enableEmail: e.value }))}
                  />
                  <CheckBox
                    text="Enable SMS"
                    value={newPolicy.enableSms}
                    onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, enableSms: e.value }))}
                  />
                  <CheckBox
                    text="Enable System"
                    value={newPolicy.enableSystem}
                    onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, enableSystem: e.value }))}
                  />
                </div>

                <div className="tw-grid tw-grid-cols-3 tw-gap-4">
                  <NumberBox
                    label="Max/Hour"
                    value={newPolicy.maxNotificationsPerHour}
                    onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, maxNotificationsPerHour: e.value }))}
                  />
                  <NumberBox
                    label="Max/Day"
                    value={newPolicy.maxNotificationsPerDay}
                    onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, maxNotificationsPerDay: e.value }))}
                  />
                  <NumberBox
                    label="Cooldown (min)"
                    value={newPolicy.cooldownMinutes}
                    onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, cooldownMinutes: e.value }))}
                  />
                </div>

                <TextBox
                  label="Title Template"
                  value={newPolicy.titleTemplate}
                  onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, titleTemplate: e.value }))}
                  placeholder="e.g., {AlarmType} Alert"
                />

                <TextArea
                  label="Message Template"
                  value={newPolicy.messageTemplate}
                  onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, messageTemplate: e.value }))}
                  placeholder="e.g., {AlarmType} detected on {DeviceType} {DeviceNumber}"
                  height={80}
                />

                <CheckBox
                  text="Require Acknowledgment"
                  value={newPolicy.requireAcknowledgment}
                  onValueChanged={(e) => setNewPolicy(prev => ({ ...prev, requireAcknowledgment: e.value }))}
                />
              </div>

              <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
                <Button
                  text="Cancel"
                  onClick={() => setShowCreatePolicy(false)}
                />
                <Button
                  text="Create Policy"
                  type="default"
                  onClick={handleCreatePolicy}
                />
              </div>
            </ValidationGroup>
          </div>
        </ScrollView>
      </Popup>

      {/* Create Trigger Modal */}
      <Popup
        visible={showCreateTrigger}
        onHiding={() => setShowCreateTrigger(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Create Custom Trigger"
        width={500}
        height={500}
      >
        <div className="tw-p-6">
          <ValidationGroup>
            <div className="tw-grid tw-grid-cols-1 tw-gap-4">
              <SelectBox
                label="Type"
                dataSource={['Alert', 'Info', 'Warning', 'Error']}
                value={newTrigger.type}
                onValueChanged={(e) => setNewTrigger(prev => ({ ...prev, type: e.value }))}
              />

              <SelectBox
                label="Category"
                dataSource={['System', 'Tank', 'Pump', 'Device', 'Custom']}
                value={newTrigger.category}
                onValueChanged={(e) => setNewTrigger(prev => ({ ...prev, category: e.value }))}
              />

              <SelectBox
                label="Priority"
                dataSource={['Low', 'Medium', 'High', 'Critical']}
                value={newTrigger.priority}
                onValueChanged={(e) => setNewTrigger(prev => ({ ...prev, priority: e.value }))}
              />

              <TextBox
                label="Title"
                value={newTrigger.title}
                onValueChanged={(e) => setNewTrigger(prev => ({ ...prev, title: e.value }))}
              >
                <Validator>
                  <RequiredRule message="Title is required" />
                </Validator>
              </TextBox>

              <TextArea
                label="Message"
                value={newTrigger.message}
                onValueChanged={(e) => setNewTrigger(prev => ({ ...prev, message: e.value }))}
                height={100}
              >
                <Validator>
                  <RequiredRule message="Message is required" />
                </Validator>
              </TextArea>
            </div>

            <div className="tw-flex tw-justify-end tw-gap-2 tw-mt-6">
              <Button
                text="Cancel"
                onClick={() => setShowCreateTrigger(false)}
              />
              <Button
                text="Send Notification"
                type="default"
                onClick={handleCreateTrigger}
              />
            </div>
          </ValidationGroup>
        </div>
      </Popup>
    </div>
  );
};

export default NotificationDashboard;