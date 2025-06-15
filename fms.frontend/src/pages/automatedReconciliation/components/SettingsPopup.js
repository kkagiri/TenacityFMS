import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../../../components/ui/card";
import { Badge } from "../../../components/ui/badge";
import { Input } from "../../../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../components/ui/tabs";
import { mockPolicyMetrics } from "../mockData";

// DevExtreme imports
import Popup from "devextreme-react/popup";
import ScrollView from "devextreme-react/scroll-view";
import Button from "devextreme-react/button";
import TextBox from "devextreme-react/text-box";
import SelectBox from "devextreme-react/select-box";
import CheckBox from "devextreme-react/check-box";
import TabPanel, { Item as TabItem } from "devextreme-react/tab-panel";
import NumberBox from "devextreme-react/number-box";
import notify from "devextreme/ui/notify";

const SettingsPopup = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState(0);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");

  // Using mock data instead of hardcoded sample data
  const samplePolicies = mockPolicyMetrics.map(policy => ({
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
  }));

  const loadPolicies = async () => {
    setLoading(true);
    try {
      // Replace with actual API call
      setPolicies(samplePolicies);
    } catch (error) {
      console.error("Failed to load policies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadPolicies();
    }
  }, [isOpen]);

  const handleDeletePolicy = async (policyId) => {
    try {
      // Replace with actual API call
      setPolicies(policies.filter((p) => p.id !== policyId));
      notify("Policy deleted successfully", "success", 3000);
    } catch (error) {
      console.error("Failed to delete policy:", error);
      notify("Failed to delete policy", "error", 3000);
    }
  };

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

  const policyTypeItems = [
    { text: "All Types", value: "all" },
    { text: "Scheduled", value: "scheduled" },
    { text: "Threshold", value: "threshold" },
    { text: "Hybrid", value: "hybrid" },
    { text: "Event Driven", value: "eventdriven" }
  ];

  const statusItems = [
    { text: "All Status", value: "all" },
    { text: "Active", value: "active" },
    { text: "Inactive", value: "inactive" }
  ];

  const tabItems = [
    { text: "Policies", component: PolicyManagementTab },
    { text: "System", component: SystemConfigurationTab },
    { text: "Notifications", component: NotificationSettingsTab },
    { text: "Security", component: SecuritySettingsTab }
  ];

  const renderTabContent = (data) => {
    const Component = data.component;
    return (
      <Component
        policies={filteredPolicies}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        filterType={filterType}
        setFilterType={setFilterType}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        onDeletePolicy={handleDeletePolicy}
      />
    );
  };

  return (
    <Popup
      visible={isOpen}
      onHiding={onClose}
      title="System Settings"
      showTitle={true}
      width="90%"
      height="90%"
      maxWidth={1200}
      className="settings-popup"
      showCloseButton={true}
    >
      <TabPanel
        selectedIndex={activeTab}
        onOptionChanged={(e) => {
          if (e.name === "selectedIndex") {
            setActiveTab(e.value);
          }
        }}
        height="100%"
      >
        {tabItems.map((item, index) => (
          <TabItem key={index} title={item.text} render={() => renderTabContent(item)} />
        ))}
      </TabPanel>
    </Popup>
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
  onDeletePolicy,
}) {
  return (
    <div className="tw-space-y-4">
      {/* Header and Controls */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-justify-between tw-items-start sm:tw-items-center tw-space-y-4 sm:tw-space-y-0">
        <div>
          <h3 className="tw-text-lg tw-font-semibold">Policy Management</h3>
          <p className="tw-text-sm tw-text-gray-600">Create, edit, and manage reconciliation policies</p>
        </div>
        <Button
          text="Create Policy"
          icon="plus"
          stylingMode="contained"
        />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="tw-pt-6">
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-space-y-4 sm:tw-space-y-0 sm:tw-space-x-4">
            <div className="tw-flex-1">
              <TextBox
                placeholder="Search policies..."
                value={searchTerm}
                onValueChanged={(e) => setSearchTerm(e.value)}
                showClearButton={true}
                className="tw-w-full"
              />
            </div>
            <SelectBox
              items={[
                { text: "All Types", value: "all" },
                { text: "Scheduled", value: "scheduled" },
                { text: "Threshold", value: "threshold" },
                { text: "Hybrid", value: "hybrid" },
                { text: "Event Driven", value: "eventdriven" }
              ]}
              value={filterType}
              onValueChanged={(e) => setFilterType(e.value)}
              placeholder="Policy Type"
              width={200}
            />
            <SelectBox
              items={[
                { text: "All Status", value: "all" },
                { text: "Active", value: "active" },
                { text: "Inactive", value: "inactive" }
              ]}
              value={filterStatus}
              onValueChanged={(e) => setFilterStatus(e.value)}
              placeholder="Status"
              width={150}
            />
          </div>
        </CardContent>
      </Card>

      {/* Policy List */}
      <ScrollView height={400}>
        <div className="tw-space-y-4">
          {loading ? (
            <div className="tw-text-center tw-py-8">Loading policies...</div>
          ) : policies.length === 0 ? (
            <Card>
              <CardContent className="tw-pt-6">
                <div className="tw-text-center tw-py-8">
                  <i className="fa-light fa-filter tw-h-12 tw-w-12 tw-text-gray-400 tw-mx-auto tw-mb-4"></i>
                  <h3 className="tw-text-lg tw-font-medium tw-text-gray-900 tw-mb-2">No policies found</h3>
                  <p className="tw-text-gray-600">Try adjusting your search or filter criteria</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            policies.map((policy) => (
              <PolicyCard
                key={policy.id}
                policy={policy}
                onDelete={() => onDeletePolicy(policy.id)}
              />
            ))
          )}
        </div>
      </ScrollView>
    </div>
  );
}

// Policy Card Component
function PolicyCard({ policy, onDelete }) {
  const successRate =
    policy.totalExecutions > 0
      ? Math.round((policy.successfulExecutions / policy.totalExecutions) * 100 * 10) / 10
      : 0;

  return (
    <Card>
      <CardContent className="tw-pt-6">
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center tw-justify-between tw-space-y-4 lg:tw-space-y-0">
          <div className="tw-flex-1 tw-space-y-3">
            <div className="tw-flex tw-items-center tw-space-x-3">
              <h4 className="tw-text-lg tw-font-semibold">{policy.name}</h4>
              <Badge variant="outline">{policy.policyType}</Badge>
              <Badge variant={policy.isActive ? "default" : "secondary"}>
                {policy.isActive ? "Active" : "Inactive"}
              </Badge>
              <Badge variant="outline" className="tw-bg-blue-50 tw-text-blue-700">
                Priority: {policy.priority}
              </Badge>
            </div>

            {policy.description && <p className="tw-text-gray-600">{policy.description}</p>}

            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-sm">
              <div>
                <p className="tw-text-gray-500">Success Rate</p>
                <p className="tw-font-medium tw-text-green-600">{successRate}%</p>
              </div>
              <div>
                <p className="tw-text-gray-500">Executions</p>
                <p className="tw-font-medium">{policy.totalExecutions}</p>
              </div>
              <div>
                <p className="tw-text-gray-500">Site</p>
                <p className="tw-font-medium">{policy.siteName || "All Sites"}</p>
              </div>
              <div>
                <p className="tw-text-gray-500">Last Modified</p>
                <p className="tw-font-medium">{new Date(policy.modifiedOn || policy.createdOn).toLocaleDateString()}</p>
              </div>
            </div>
          </div>

          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-space-y-2 sm:tw-space-y-0 sm:tw-space-x-2">
            <Button
              text="Edit"
              icon="edit"
              stylingMode="outlined"
            />
            <Button
              text="Delete"
              icon="trash"
              stylingMode="outlined"
              type="danger"
              onClick={() => {
                if (window.confirm(`Are you sure you want to delete "${policy.name}"? This action cannot be undone.`)) {
                  onDelete();
                }
              }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// System Configuration Tab Component
function SystemConfigurationTab() {
  return (
    <ScrollView height={400}>
      <div className="tw-space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Database Configuration</CardTitle>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="tw-space-y-2">
                <label className="tw-font-medium">Connection Timeout (seconds)</label>
                <NumberBox defaultValue={30} min={1} max={300} showSpinButtons={true} />
              </div>
              <div className="tw-space-y-2">
                <label className="tw-font-medium">Query Timeout (seconds)</label>
                <NumberBox defaultValue={120} min={1} max={600} showSpinButtons={true} />
              </div>
            </div>
            <div className="tw-flex tw-items-center tw-space-x-2">
              <CheckBox id="autoRetry" defaultValue={true} text="Enable Auto Retry on Connection Failure" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Execution Settings</CardTitle>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            <div className="tw-grid tw-grid-cols-2 tw-gap-4">
              <div className="tw-space-y-2">
                <label className="tw-font-medium">Max Concurrent Executions</label>
                <NumberBox defaultValue={5} min={1} max={20} showSpinButtons={true} />
              </div>
              <div className="tw-space-y-2">
                <label className="tw-font-medium">Execution Timeout (minutes)</label>
                <NumberBox defaultValue={60} min={1} max={180} showSpinButtons={true} />
              </div>
            </div>
            <div className="tw-space-y-2">
              <label className="tw-font-medium">Default Retry Attempts</label>
              <NumberBox defaultValue={3} min={0} max={10} showSpinButtons={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollView>
  );
}

// Notification Settings Tab Component
function NotificationSettingsTab() {
  return (
    <ScrollView height={400}>
      <div className="tw-space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Global Notification Settings</CardTitle>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            <div className="tw-space-y-4">
              <CheckBox id="globalEmail" defaultValue={true} text="Enable Email Notifications" />
              <CheckBox id="globalSlack" defaultValue={true} text="Enable Slack Notifications" />
            </div>
            <div className="tw-space-y-2">
              <label className="tw-font-medium">Default Admin Email</label>
              <TextBox defaultValue="admin@company.com" />
            </div>
            <div className="tw-space-y-2">
              <label className="tw-font-medium">Slack Webhook URL</label>
              <TextBox placeholder="https://hooks.slack.com/..." />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollView>
  );
}

// Security Settings Tab Component
function SecuritySettingsTab() {
  return (
    <ScrollView height={400}>
      <div className="tw-space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Access Control</CardTitle>
          </CardHeader>
          <CardContent className="tw-space-y-4">
            <div className="tw-space-y-4">
              <CheckBox id="requireApproval" defaultValue={true} text="Require Approval for Policy Changes" />
              <CheckBox id="auditLog" defaultValue={true} text="Enable Audit Logging" />
            </div>
            <div className="tw-space-y-2">
              <label className="tw-font-medium">Session Timeout (minutes)</label>
              <NumberBox defaultValue={480} min={5} max={1440} showSpinButtons={true} />
            </div>
          </CardContent>
        </Card>
      </div>
    </ScrollView>
  );
}

export default SettingsPopup;