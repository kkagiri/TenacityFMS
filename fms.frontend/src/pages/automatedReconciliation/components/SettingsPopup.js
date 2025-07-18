import React, { useState, useEffect, useCallback } from "react";
import {
  Popup,
  TabPanel,
  ScrollView,
  Button,
  TextBox,
  TextArea,
  Switch,
  SelectBox,
  NumberBox,
  DataGrid,
  LoadIndicator,
  Toolbar,
} from "devextreme-react";
import { SearchPanel, FilterRow, HeaderFilter, Paging, Column } from "devextreme-react/data-grid";
import { Item as ToolbarItem } from "devextreme-react/toolbar";
import { Item as TabPanelItem } from "devextreme-react/tab-panel";
import { RequiredRule } from "devextreme-react/validator";
import { confirm } from "devextreme/ui/dialog";
import { mockPolicyMetrics } from "../mockData";
import "./SettingsPopup.scss";

const SettingsPopup = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState("policies");
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Using mock data instead of hardcoded sample data
  const samplePolicies = React.useMemo(() =>
    mockPolicyMetrics.map(policy => ({
      ...policy,
      policyType: policy.type,
      siteName: "All Sites",
      tankScopeConfiguration: '{"siteIds":[1,2,3],"minimumTankVolume":1000}',
      maxTanksPerExecution: 50,
      notificationConfiguration: '{"emailAddresses":["ops@company.com"],"enableSlackNotifications":true}',
      createdBy: "admin",
      createdOn: policy.createdDate,
      modifiedBy: "manager",
      modifiedOn: new Date().toISOString(),
      lastExecuted: policy.lastExecution,
      nextExecution: policy.nextExecution,
      totalExecutions: policy.executionCount,
      successfulExecutions: Math.floor(policy.executionCount * (policy.successRate / 100)),
      averageExecutionDurationMs: Math.floor(Math.random() * 1000000) + 300000,
      totalTanksReconciled: Math.floor(Math.random() * 3000) + 1000,
    })), []);

  const loadPolicies = useCallback(async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setPolicies(samplePolicies);
    } catch (error) {
      console.error("Failed to load policies:", error);
    } finally {
      setLoading(false);
    }
  }, [samplePolicies]);

  useEffect(() => {
    if (isOpen) {
      loadPolicies();
    }
  }, [isOpen, loadPolicies]);

  const handleCreatePolicy = () => {
    setEditingPolicy(null);
    setIsCreateDialogOpen(true);
  };

  const handleEditPolicy = (policy) => {
    setEditingPolicy(policy);
    setIsEditDialogOpen(true);
  };

  const handleDeletePolicy = async (policyId) => {
    try {
      // Replace with actual API call
      setPolicies(policies.filter((p) => p.id !== policyId));
    } catch (error) {
      console.error("Failed to delete policy:", error);
    }
  };

  const policyTypes = [
    { id: "all", text: "All Types" },
    { id: "scheduled", text: "Scheduled" },
    { id: "threshold", text: "Threshold" },
    { id: "hybrid", text: "Hybrid" },
    { id: "event driven", text: "Event Driven" },
  ];

  const statusOptions = [
    { id: "all", text: "All Status" },
    { id: "active", text: "Active" },
    { id: "inactive", text: "Inactive" },
  ];

  const filteredPolicies = policies.filter((policy) => {
    const matchesSearch =
      policy.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (policy.description?.toLowerCase().includes(searchTerm.toLowerCase()) ?? false);
    const matchesType =
      filterType === "all" || policy.policyType.toLowerCase() === filterType.toLowerCase();
    const matchesStatus =
      filterStatus === "all" ||
      (filterStatus === "active" && policy.isActive) ||
      (filterStatus === "inactive" && !policy.isActive);

    return matchesSearch && matchesType && matchesStatus;
  });

  const tabItems = [
    { id: "policies", title: "Policies", icon: "fa-light fa-list" },
    { id: "system", title: "System", icon: "fa-light fa-cog" },
    { id: "notifications", title: "Notifications", icon: "fa-light fa-bell" },
    { id: "security", title: "Security", icon: "fa-light fa-shield" },
  ];

  return (
    <>
      <Popup
        visible={isOpen}
        onHiding={onClose}
        dragEnabled={false}
        showCloseButton
={true}
        showTitle={true}
        title="System Settings"
        width="90%"
        height="90%"
        maxWidth={1200}
        maxHeight={800}
        className="tw-settings-popup"
      >
        <div className="tw-p-4">
          <div className="tw-flex tw-items-center tw-mb-4">
            <i className="fa-light fa-gear tw-mr-2 tw-text-lg"></i>
            <span className="tw-text-sm tw-text-gray-600">
              Configure automated reconciliation policies, system parameters, and notification settings
            </span>
          </div>

          <TabPanel
            selectedIndex={tabItems.findIndex(tab => tab.id === activeTab)}
            onSelectionChanged={(e) => setActiveTab(tabItems[e.selectedIndex].id)}
            height="100%"
            className="tw-settings-tabs"
          >
            <TabPanelItem title="Policies" icon="fa-light fa-list">
              <PolicyManagementTab
                policies={filteredPolicies}
                loading={loading}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                filterType={filterType}
                setFilterType={setFilterType}
                filterStatus={filterStatus}
                setFilterStatus={setFilterStatus}
                onCreatePolicy={handleCreatePolicy}
                onEditPolicy={handleEditPolicy}
                onDeletePolicy={handleDeletePolicy}
                policyTypes={policyTypes}
                statusOptions={statusOptions}
              />
            </TabPanelItem>

            <TabPanelItem title="System" icon="fa-light fa-cog">
              <SystemConfigurationTab />
            </TabPanelItem>

            <TabPanelItem title="Notifications" icon="fa-light fa-bell">
              <NotificationSettingsTab />
            </TabPanelItem>

            <TabPanelItem title="Security" icon="fa-light fa-shield">
              <SecuritySettingsTab />
            </TabPanelItem>
          </TabPanel>
        </div>

        <Toolbar>
          <ToolbarItem location="after">
            <Button
              text="Close"
              type="normal"
              onClick={onClose}
              icon="fa-light fa-times"
            />
          </ToolbarItem>
        </Toolbar>
      </Popup>

      {/* Create Policy Dialog */}
      <PolicyFormDialog
        isOpen={isCreateDialogOpen}
        onClose={() => setIsCreateDialogOpen(false)}
        onSave={(policy) => {
          // Handle create
          setPolicies([...policies, { ...policy, id: Date.now() }]);
          setIsCreateDialogOpen(false);
        }}
        title="Create New Policy"
        mode="create"
      />

      {/* Edit Policy Dialog */}
      <PolicyFormDialog
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        onSave={(policy) => {
          // Handle update
          setPolicies(
            policies.map((p) =>
              p.id === editingPolicy?.id ? { ...policy, id: editingPolicy.id } : p,
            ),
          );
          setIsEditDialogOpen(false);
        }}
        title="Edit Policy"
        mode="edit"
        initialData={editingPolicy}
      />
    </>
  );
};

// Policy Management Tab Component
function PolicyManagementTab({
  policies,
  loading,
  searchTerm,
  setSearchTerm,
  filterType,
  setFilterType,
  filterStatus,
  setFilterStatus,
  onCreatePolicy,
  onEditPolicy,
  onDeletePolicy,
  policyTypes,
  statusOptions,
}) {
  const renderActionButtons = (cellData) => {
    return (
      <div className="tw-flex tw-space-x-2">
        <Button
          icon="fa-light fa-edit"
          text="Edit"
          type="default"
          height={28}
          onClick={() => onEditPolicy(cellData.data)}
        />
        <Button
          icon="fa-light fa-trash"
          text="Delete"
          type="danger"
          height={28}
          onClick={() => {
            confirm("Are you sure you want to delete this policy?", "Delete Policy").then((result) => {
              if (result) {
                onDeletePolicy(cellData.data.id);
              }
            });
          }}
        />
      </div>
    );
  };

  const renderStatus = (cellData) => {
    const isActive = cellData.value;
    return (
      <div className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-medium ${
        isActive
          ? 'tw-bg-green-100 tw-text-green-800'
          : 'tw-bg-gray-100 tw-text-gray-800'
      }`}>
        {isActive ? 'Active' : 'Inactive'}
      </div>
    );
  };

  const renderPolicyType = (cellData) => {
    return (
      <div className="tw-px-2 tw-py-1 tw-rounded tw-bg-blue-100 tw-text-blue-800 tw-text-xs tw-font-medium">
        {cellData.value}
      </div>
    );
  };

  const renderSuccessRate = (cellData) => {
    const policy = cellData.data;
    const successRate = policy.totalExecutions > 0
      ? Math.round((policy.successfulExecutions / policy.totalExecutions) * 100 * 10) / 10
      : 0;

    return (
      <div className="tw-flex tw-items-center">
        <span className="tw-font-medium tw-text-green-600">{successRate}%</span>
      </div>
    );
  };

  return (
    <div className="tw-space-y-4">
      {/* Header and Controls */}
      <div className="tw-flex tw-justify-between tw-items-center">
        <div>
          <h3 className="tw-text-lg tw-font-semibold">Policy Management</h3>
          <p className="tw-text-sm tw-text-gray-600">Create, edit, and manage reconciliation policies</p>
        </div>
        <Button
          text="Create Policy"
          type="success"
          icon="fa-light fa-plus"
          onClick={onCreatePolicy}
        />
      </div>

      {/* Filters */}
      <div className="tw-bg-white tw-p-4 tw-rounded tw-border">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
          <TextBox
            placeholder="Search policies..."
            value={searchTerm}
            onValueChanged={(e) => setSearchTerm(e.value)}
            showClearButton={true}
            stylingMode="outlined"
          >
            <Button name="search" location="after" icon="fa-light fa-search" />
          </TextBox>

          <SelectBox
            dataSource={policyTypes}
            displayExpr="text"
            valueExpr="id"
            value={filterType}
            onValueChanged={(e) => setFilterType(e.value)}
            placeholder="Policy Type"
            stylingMode="outlined"
          />

          <SelectBox
            dataSource={statusOptions}
            displayExpr="text"
            valueExpr="id"
            value={filterStatus}
            onValueChanged={(e) => setFilterStatus(e.value)}
            placeholder="Status"
            stylingMode="outlined"
          />
        </div>
      </div>

      {/* Policy Grid */}
      <div className="tw-bg-white tw-rounded tw-border">
        {loading ? (
          <div className="tw-flex tw-justify-center tw-items-center tw-py-8">
            <LoadIndicator visible={true} />
            <span className="tw-ml-2">Loading policies...</span>
          </div>
        ) : (
          <DataGrid
            dataSource={policies}
            keyExpr="id"
            showBorders={true}
            showColumnLines={true}
            showRowLines={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            height={400}
            noDataText="No policies found"
          >
            <SearchPanel visible={false} />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={10} />

            <Column
              dataField="name"
              caption="Policy Name"
              width={200}
              cssClass="tw-font-medium"
            />
            <Column
              dataField="policyType"
              caption="Type"
              width={120}
              cellRender={renderPolicyType}
            />
            <Column
              dataField="isActive"
              caption="Status"
              width={100}
              cellRender={renderStatus}
            />
            <Column
              dataField="priority"
              caption="Priority"
              width={80}
              dataType="number"
            />
            <Column
              caption="Success Rate"
              width={120}
              cellRender={renderSuccessRate}
              allowSorting={false}
            />
            <Column
              dataField="totalExecutions"
              caption="Executions"
              width={100}
              dataType="number"
            />
            <Column
              dataField="siteName"
              caption="Site"
              width={120}
            />
            <Column
              dataField="modifiedOn"
              caption="Last Modified"
              width={140}
              dataType="date"
              format="dd/MM/yyyy"
            />
            <Column
              caption="Actions"
              width={160}
              cellRender={renderActionButtons}
              allowSorting={false}
            />
          </DataGrid>
        )}
      </div>
    </div>
  );
}

// Policy Form Dialog Component
function PolicyFormDialog({ isOpen, onClose, onSave, title, mode, initialData }) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    policyType: "Scheduled",
    discrepancyThreshold: 5.0,
    discrepancyPercentageThreshold: 2.0,
    priority: 100,
    maxTanksPerExecution: 50,
    isActive: true,
  });

  const policyTypeOptions = [
    { id: "Scheduled", text: "Scheduled" },
    { id: "Threshold", text: "Threshold" },
    { id: "Hybrid", text: "Hybrid" },
    { id: "EventDriven", text: "Event Driven" },
  ];

  useEffect(() => {
    if (initialData && mode === "edit") {
      setFormData({
        name: initialData.name,
        description: initialData.description || "",
        policyType: initialData.policyType,
        discrepancyThreshold: initialData.discrepancyThreshold || 5.0,
        discrepancyPercentageThreshold: initialData.discrepancyPercentageThreshold || 2.0,
        priority: initialData.priority,
        maxTanksPerExecution: initialData.maxTanksPerExecution || 50,
        isActive: initialData.isActive,
      });
    } else if (mode === "create") {
      setFormData({
        name: "",
        description: "",
        policyType: "Scheduled",
        discrepancyThreshold: 5.0,
        discrepancyPercentageThreshold: 2.0,
        priority: 100,
        maxTanksPerExecution: 50,
        isActive: true,
      });
    }
  }, [initialData, mode]);

  const handleSave = () => {
    if (!formData.name.trim()) {
      return;
    }
    onSave(formData);
  };

  return (
    <Popup
      visible={isOpen}
      onHiding={onClose}
      dragEnabled={false}
      showCloseButton
={true}
      showTitle={true}
      title={title}
      width={600}
      height={500}
      className="tw-policy-form-popup"
    >
      <ScrollView height="100%">
        <div className="tw-p-4 tw-space-y-4">
          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            <div className="tw-space-y-2">
              <label className="tw-font-medium tw-text-sm">Policy Name *</label>
              <TextBox
                value={formData.name}
                onValueChanged={(e) => setFormData({ ...formData, name: e.value })}
                placeholder="Enter policy name"
                stylingMode="outlined"
              >
                <RequiredRule message="Policy name is required" />
              </TextBox>
            </div>
            <div className="tw-space-y-2">
              <label className="tw-font-medium tw-text-sm">Policy Type *</label>
              <SelectBox
                dataSource={policyTypeOptions}
                displayExpr="text"
                valueExpr="id"
                value={formData.policyType}
                onValueChanged={(e) => setFormData({ ...formData, policyType: e.value })}
                stylingMode="outlined"
              />
            </div>
          </div>

          <div className="tw-space-y-2">
            <label className="tw-font-medium tw-text-sm">Description</label>
            <TextArea
              value={formData.description}
              onValueChanged={(e) => setFormData({ ...formData, description: e.value })}
              placeholder="Enter policy description"
              height={80}
              stylingMode="outlined"
            />
          </div>

          <div className="tw-grid tw-grid-cols-3 tw-gap-4">
            <div className="tw-space-y-2">
              <label className="tw-font-medium tw-text-sm">Priority</label>
              <NumberBox
                value={formData.priority}
                onValueChanged={(e) => setFormData({ ...formData, priority: e.value })}
                min={1}
                max={1000}
                stylingMode="outlined"
              />
            </div>
            <div className="tw-space-y-2">
              <label className="tw-font-medium tw-text-sm">Threshold (L)</label>
              <NumberBox
                value={formData.discrepancyThreshold}
                onValueChanged={(e) => setFormData({ ...formData, discrepancyThreshold: e.value })}
                step={0.1}
                format="#0.0"
                stylingMode="outlined"
              />
            </div>
            <div className="tw-space-y-2">
              <label className="tw-font-medium tw-text-sm">Threshold (%)</label>
              <NumberBox
                value={formData.discrepancyPercentageThreshold}
                onValueChanged={(e) => setFormData({ ...formData, discrepancyPercentageThreshold: e.value })}
                step={0.1}
                format="#0.0"
                stylingMode="outlined"
              />
            </div>
          </div>

          <div className="tw-grid tw-grid-cols-2 tw-gap-4">
            <div className="tw-space-y-2">
              <label className="tw-font-medium tw-text-sm">Max Tanks per Execution</label>
              <NumberBox
                value={formData.maxTanksPerExecution}
                onValueChanged={(e) => setFormData({ ...formData, maxTanksPerExecution: e.value })}
                min={1}
                stylingMode="outlined"
              />
            </div>
            <div className="tw-flex tw-items-center tw-space-x-2 tw-pt-6">
              <Switch
                value={formData.isActive}
                onValueChanged={(e) => setFormData({ ...formData, isActive: e.value })}
              />
              <label className="tw-font-medium tw-text-sm">Active Policy</label>
            </div>
          </div>
        </div>
      </ScrollView>

      <Toolbar>
        <ToolbarItem location="before">
          <Button
            text="Cancel"
            type="normal"
            onClick={onClose}
            icon="fa-light fa-times"
          />
        </ToolbarItem>
        <ToolbarItem location="after">
          <Button
            text={mode === "create" ? "Create Policy" : "Update Policy"}
            type="success"
            onClick={handleSave}
            icon="fa-light fa-save"
          />
        </ToolbarItem>
      </Toolbar>
    </Popup>
  );
}
// System Configuration Tab
function SystemConfigurationTab() {
  const [config, setConfig] = useState({
    connectionTimeout: 30,
    queryTimeout: 120,
    autoRetry: true,
    maxConcurrentExecutions: 5,
    executionTimeout: 60,
    defaultRetryAttempts: 3,
  });

  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold">System Configuration</h3>
        <p className="tw-text-sm tw-text-gray-600">Configure global system settings and parameters</p>
      </div>

      <div className="tw-bg-white tw-p-4 tw-rounded tw-border">
        <div className="tw-flex tw-items-center tw-mb-4">
          <i className="fa-light fa-database tw-mr-2 tw-text-lg"></i>
          <h4 className="tw-text-md tw-font-semibold">Database Settings</h4>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
          <div className="tw-space-y-2">
            <label className="tw-font-medium tw-text-sm">Connection Timeout (seconds)</label>
            <NumberBox
              value={config.connectionTimeout}
              onValueChanged={(e) => setConfig({ ...config, connectionTimeout: e.value })}
              min={1}
              stylingMode="outlined"
            />
          </div>
          <div className="tw-space-y-2">
            <label className="tw-font-medium tw-text-sm">Query Timeout (seconds)</label>
            <NumberBox
              value={config.queryTimeout}
              onValueChanged={(e) => setConfig({ ...config, queryTimeout: e.value })}
              min={1}
              stylingMode="outlined"
            />
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-space-x-2">
          <Switch
            value={config.autoRetry}
            onValueChanged={(e) => setConfig({ ...config, autoRetry: e.value })}
          />
          <label className="tw-font-medium tw-text-sm">Enable Auto Retry on Connection Failure</label>
        </div>
      </div>

      <div className="tw-bg-white tw-p-4 tw-rounded tw-border">
        <div className="tw-flex tw-items-center tw-mb-4">
          <i className="fa-light fa-clock tw-mr-2 tw-text-lg"></i>
          <h4 className="tw-text-md tw-font-semibold">Execution Settings</h4>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
          <div className="tw-space-y-2">
            <label className="tw-font-medium tw-text-sm">Max Concurrent Executions</label>
            <NumberBox
              value={config.maxConcurrentExecutions}
              onValueChanged={(e) => setConfig({ ...config, maxConcurrentExecutions: e.value })}
              min={1}
              stylingMode="outlined"
            />
          </div>
          <div className="tw-space-y-2">
            <label className="tw-font-medium tw-text-sm">Execution Timeout (minutes)</label>
            <NumberBox
              value={config.executionTimeout}
              onValueChanged={(e) => setConfig({ ...config, executionTimeout: e.value })}
              min={1}
              stylingMode="outlined"
            />
          </div>
        </div>
        <div className="tw-space-y-2">
          <label className="tw-font-medium tw-text-sm">Default Retry Attempts</label>
          <NumberBox
            value={config.defaultRetryAttempts}
            onValueChanged={(e) => setConfig({ ...config, defaultRetryAttempts: e.value })}
            min={0}
            stylingMode="outlined"
          />
        </div>
      </div>
    </div>
  );
}

// Notification Settings Tab
function NotificationSettingsTab() {
  const [settings, setSettings] = useState({
    globalEmail: true,
    globalSlack: true,
    adminEmail: "admin@company.com",
    slackWebhook: "",
  });

  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold">Notification Settings</h3>
        <p className="tw-text-sm tw-text-gray-600">Configure global notification preferences</p>
      </div>

      <div className="tw-bg-white tw-p-4 tw-rounded tw-border">
        <div className="tw-flex tw-items-center tw-mb-4">
          <i className="fa-light fa-bell tw-mr-2 tw-text-lg"></i>
          <h4 className="tw-text-md tw-font-semibold">Global Notification Settings</h4>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Switch
              value={settings.globalEmail}
              onValueChanged={(e) => setSettings({ ...settings, globalEmail: e.value })}
            />
            <label className="tw-font-medium tw-text-sm">Enable Email Notifications</label>
          </div>
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Switch
              value={settings.globalSlack}
              onValueChanged={(e) => setSettings({ ...settings, globalSlack: e.value })}
            />
            <label className="tw-font-medium tw-text-sm">Enable Slack Notifications</label>
          </div>
        </div>
        <div className="tw-space-y-4">
          <div className="tw-space-y-2">
            <label className="tw-font-medium tw-text-sm">Default Admin Email</label>
            <TextBox
              value={settings.adminEmail}
              onValueChanged={(e) => setSettings({ ...settings, adminEmail: e.value })}
              stylingMode="outlined"
            />
          </div>
          <div className="tw-space-y-2">
            <label className="tw-font-medium tw-text-sm">Slack Webhook URL</label>
            <TextBox
              value={settings.slackWebhook}
              onValueChanged={(e) => setSettings({ ...settings, slackWebhook: e.value })}
              placeholder="https://hooks.slack.com/..."
              stylingMode="outlined"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

// Security Settings Tab
function SecuritySettingsTab() {
  const [securitySettings, setSecuritySettings] = useState({
    requireApproval: true,
    auditLog: true,
    sessionTimeout: 480,
  });

  return (
    <div className="tw-space-y-6">
      <div>
        <h3 className="tw-text-lg tw-font-semibold">Security Settings</h3>
        <p className="tw-text-sm tw-text-gray-600">Configure security and access control settings</p>
      </div>

      <div className="tw-bg-white tw-p-4 tw-rounded tw-border">
        <div className="tw-flex tw-items-center tw-mb-4">
          <i className="fa-light fa-triangle-exclamation tw-mr-2 tw-text-lg"></i>
          <h4 className="tw-text-md tw-font-semibold">Access Control</h4>
        </div>
        <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mb-4">
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Switch
              value={securitySettings.requireApproval}
              onValueChanged={(e) => setSecuritySettings({ ...securitySettings, requireApproval: e.value })}
            />
            <label className="tw-font-medium tw-text-sm">Require Approval for Policy Changes</label>
          </div>
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Switch
              value={securitySettings.auditLog}
              onValueChanged={(e) => setSecuritySettings({ ...securitySettings, auditLog: e.value })}
            />
            <label className="tw-font-medium tw-text-sm">Enable Audit Logging</label>
          </div>
        </div>
        <div className="tw-space-y-2">
          <label className="tw-font-medium tw-text-sm">Session Timeout (minutes)</label>
          <NumberBox
            value={securitySettings.sessionTimeout}
            onValueChanged={(e) => setSecuritySettings({ ...securitySettings, sessionTimeout: e.value })}
            min={1}
            stylingMode="outlined"
          />
        </div>
      </div>
    </div>
  );
}

export default SettingsPopup;