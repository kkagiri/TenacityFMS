import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Form,
  Button,
  CheckBox,
  SelectBox,
  TagBox,
  NumberBox,
  Popup,
  DataGrid,
  LoadPanel,
  Toast
} from 'devextreme-react';

import {
  Column,
  Paging,
  FilterRow,
  HeaderFilter,
  Editing,
  Lookup
} from 'devextreme-react/data-grid';

import {
  SimpleItem,
  GroupItem,
  TabbedItem,
  Tab
} from 'devextreme-react/form';

import {
  fetchNotificationTemplates,
  createNotificationRule,
  updateNotificationRule,
  deleteNotificationRule,
  testNotificationRule,
  fetchNotificationHistory
} from '../../../redux/actions/issueTrackerActions';

import { EmailService } from '../../../services/emailService';
import useIssueTracker from '../../../hooks/useIssueTracker';
import './IssueTrackerNotificationSettings.scss';

/**
 * Issue Tracker Notification Integration
 * Comprehensive notification system with:
 * - Email alerts for issue events
 * - Custom notification rules
 * - Template management
 * - Real-time notifications
 * - SMS integration (optional)
 * - Slack/Teams webhooks
 */
const IssueTrackerNotificationSettings = () => {
  const dispatch = useDispatch();

  // Redux state
  const {
    notificationRules,
    notificationTemplates,
    notificationHistory,
    loading
  } = useSelector(state => state.issueTracker);

  // Local state
  const [editRulePopupVisible, setEditRulePopupVisible] = useState(false);
  const [testPopupVisible, setTestPopupVisible] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [testConfig, setTestConfig] = useState({
    ruleName: '',
    testEmail: '',
    sampleData: {}
  });
  const [toastConfig, setToastConfig] = useState({
    visible: false,
    type: 'success',
    message: ''
  });

  // Default notification rule structure
  const defaultRule = {
    id: 0,
    name: '',
    description: '',
    enabled: true,
    triggerEvents: [],
    conditions: {
      categories: [],
      priorities: [],
      statuses: [],
      assignees: [],
      vehicles: []
    },
    notifications: {
      email: {
        enabled: true,
        recipients: [],
        template: 'default',
        subject: '',
        includeAttachments: false
      },
      sms: {
        enabled: false,
        recipients: [],
        template: 'sms_default'
      },
      webhook: {
        enabled: false,
        url: '',
        method: 'POST',
        headers: {}
      },
      inApp: {
        enabled: true,
        roles: [],
        users: []
      }
    },
    schedule: {
      immediate: true,
      delayed: false,
      delayMinutes: 0,
      digest: false,
      digestFrequency: 'daily'
    }
  };

  // Initialize component
  useEffect(() => {
    loadNotificationData();
  }, []);

  // Load notification data
  const loadNotificationData = async () => {
    try {
      await Promise.all([
        dispatch(fetchNotificationTemplates()),
        dispatch(fetchNotificationHistory())
      ]);
    } catch (error) {
      console.error('Failed to load notification data:', error);
    }
  };

  // Handle create new rule
  const handleCreateRule = () => {
    setSelectedRule({ ...defaultRule });
    setEditRulePopupVisible(true);
  };

  // Handle edit rule
  const handleEditRule = (rule) => {
    setSelectedRule({ ...rule });
    setEditRulePopupVisible(true);
  };

  // Handle save rule
  const handleSaveRule = async () => {
    try {
      if (selectedRule.id === 0) {
        await dispatch(createNotificationRule(selectedRule));
        showToast('success', 'Notification rule created successfully');
      } else {
        await dispatch(updateNotificationRule(selectedRule));
        showToast('success', 'Notification rule updated successfully');
      }

      setEditRulePopupVisible(false);
      setSelectedRule(null);
    } catch (error) {
      showToast('error', 'Failed to save notification rule');
      console.error('Save rule failed:', error);
    }
  };

  // Handle delete rule
  const handleDeleteRule = async (ruleId) => {
    try {
      await dispatch(deleteNotificationRule(ruleId));
      showToast('success', 'Notification rule deleted successfully');
    } catch (error) {
      showToast('error', 'Failed to delete notification rule');
      console.error('Delete rule failed:', error);
    }
  };

  // Handle test notification
  const handleTestNotification = async () => {
    try {
      const result = await dispatch(testNotificationRule({
        ruleId: selectedRule.id,
        testEmail: testConfig.testEmail,
        sampleData: testConfig.sampleData
      }));

      if (result.success) {
        showToast('success', 'Test notification sent successfully');
        setTestPopupVisible(false);
      } else {
        showToast('error', 'Failed to send test notification');
      }
    } catch (error) {
      showToast('error', 'Failed to send test notification');
      console.error('Test notification failed:', error);
    }
  };

  // Show toast message
  const showToast = (type, message) => {
    setToastConfig({
      visible: true,
      type,
      message
    });
  };

  // Handle rule field change
  const handleRuleFieldChange = (field, value) => {
    const updatedRule = { ...selectedRule };

    // Handle nested field updates
    const fieldParts = field.split('.');
    let current = updatedRule;

    for (let i = 0; i < fieldParts.length - 1; i++) {
      if (!current[fieldParts[i]]) {
        current[fieldParts[i]] = {};
      }
      current = current[fieldParts[i]];
    }

    current[fieldParts[fieldParts.length - 1]] = value;
    setSelectedRule(updatedRule);
  };

  // Event options
  const eventOptions = [
    { value: 'created', text: 'Issue Created' },
    { value: 'updated', text: 'Issue Updated' },
    { value: 'assigned', text: 'Issue Assigned' },
    { value: 'status_changed', text: 'Status Changed' },
    { value: 'priority_changed', text: 'Priority Changed' },
    { value: 'resolved', text: 'Issue Resolved' },
    { value: 'closed', text: 'Issue Closed' },
    { value: 'comment_added', text: 'Comment Added' },
    { value: 'attachment_added', text: 'Attachment Added' },
    { value: 'due_date_approaching', text: 'Due Date Approaching' },
    { value: 'overdue', text: 'Issue Overdue' }
  ];

  // Priority options
  const priorityOptions = [
    { value: 'Critical', text: 'Critical' },
    { value: 'High', text: 'High' },
    { value: 'Medium', text: 'Medium' },
    { value: 'Low', text: 'Low' }
  ];

  // Status options
  const statusOptions = [
    { value: 'Open', text: 'Open' },
    { value: 'In Progress', text: 'In Progress' },
    { value: 'Pending', text: 'Pending' },
    { value: 'Resolved', text: 'Resolved' },
    { value: 'Closed', text: 'Closed' }
  ];

  // Template options
  const templateOptions = notificationTemplates?.map(template => ({
    value: template.id,
    text: template.name
  })) || [];

  // Render rules grid
  const renderRulesGrid = () => (
    <DataGrid
      dataSource={notificationRules || []}
      showBorders={true}
      allowColumnReordering={true}
      allowColumnResizing={true}
      columnAutoWidth={true}
      onRowUpdating={(e) => {
        const updatedRule = { ...e.oldData, ...e.newData };
        dispatch(updateNotificationRule(updatedRule));
      }}
      onRowRemoving={(e) => handleDeleteRule(e.data.id)}
    >
      <Column
        dataField="name"
        caption="Rule Name"
        allowEditing={false}
      />

      <Column
        dataField="description"
        caption="Description"
        allowEditing={false}
      />

      <Column
        dataField="enabled"
        caption="Enabled"
        dataType="boolean"
        allowEditing={true}
      />

      <Column
        dataField="triggerEvents"
        caption="Trigger Events"
        allowEditing={false}
        cellRender={(cellData) => {
          const events = cellData.value || [];
          return events.join(', ');
        }}
      />

      <Column
        caption="Actions"
        type="buttons"
        width={150}
        buttons={[
          {
            hint: 'Edit Rule',
            icon: 'edit',
            onClick: (e) => handleEditRule(e.row.data)
          },
          {
            hint: 'Test Rule',
            icon: 'email',
            onClick: (e) => {
              setSelectedRule(e.row.data);
              setTestConfig({
                ...testConfig,
                ruleName: e.row.data.name
              });
              setTestPopupVisible(true);
            }
          },
          {
            hint: 'Delete Rule',
            icon: 'trash',
            onClick: (e) => handleDeleteRule(e.row.data.id)
          }
        ]}
      />

      <Paging pageSize={10} />
      <FilterRow visible={true} />
      <HeaderFilter visible={true} />
      <Editing
        mode="row"
        allowUpdating={true}
        allowDeleting={true}
        useIcons={true}
      />
    </DataGrid>
  );

  // Render edit rule form
  const renderEditRuleForm = () => (
    <Form
      formData={selectedRule}
      labelLocation="top"
      colCount={2}
    >
      <TabbedItem>
        <Tab title="General" icon="info">
          <SimpleItem
            dataField="name"
            caption="Rule Name"
            isRequired={true}
            editorOptions={{
              placeholder: 'Enter rule name...'
            }}
            validationRules={[
              { type: 'required', message: 'Rule name is required' }
            ]}
            colSpan={2}
          />

          <SimpleItem
            dataField="description"
            caption="Description"
            editorType="dxTextArea"
            editorOptions={{
              placeholder: 'Enter rule description...',
              height: 80
            }}
            colSpan={2}
          />

          <SimpleItem
            dataField="enabled"
            caption="Enable Rule"
            editorType="dxCheckBox"
          />

          <SimpleItem
            dataField="triggerEvents"
            caption="Trigger Events"
            editorType="dxTagBox"
            editorOptions={{
              dataSource: eventOptions,
              displayExpr: 'text',
              valueExpr: 'value',
              placeholder: 'Select trigger events...'
            }}
            isRequired={true}
            validationRules={[
              { type: 'required', message: 'At least one trigger event is required' }
            ]}
          />
        </Tab>

        <Tab title="Conditions" icon="filter">
          <GroupItem caption="Filter Conditions" colCount={2}>
            <SimpleItem
              dataField="conditions.categories"
              caption="Categories"
              editorType="dxTagBox"
              editorOptions={{
                dataSource: [], // Will be populated from API
                placeholder: 'Select categories...'
              }}
            />

            <SimpleItem
              dataField="conditions.priorities"
              caption="Priorities"
              editorType="dxTagBox"
              editorOptions={{
                dataSource: priorityOptions,
                displayExpr: 'text',
                valueExpr: 'value',
                placeholder: 'Select priorities...'
              }}
            />

            <SimpleItem
              dataField="conditions.statuses"
              caption="Statuses"
              editorType="dxTagBox"
              editorOptions={{
                dataSource: statusOptions,
                displayExpr: 'text',
                valueExpr: 'value',
                placeholder: 'Select statuses...'
              }}
            />

            <SimpleItem
              dataField="conditions.assignees"
              caption="Assignees"
              editorType="dxTagBox"
              editorOptions={{
                dataSource: [], // Will be populated from API
                placeholder: 'Select assignees...'
              }}
            />
          </GroupItem>
        </Tab>

        <Tab title="Email" icon="email">
          <SimpleItem
            dataField="notifications.email.enabled"
            caption="Enable Email Notifications"
            editorType="dxCheckBox"
          />

          {selectedRule?.notifications?.email?.enabled && (
            <>
              <SimpleItem
                dataField="notifications.email.recipients"
                caption="Email Recipients"
                editorType="dxTagBox"
                editorOptions={{
                  acceptCustomValue: true,
                  placeholder: 'Enter email addresses...'
                }}
                colSpan={2}
              />

              <SimpleItem
                dataField="notifications.email.template"
                caption="Email Template"
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: templateOptions,
                  displayExpr: 'text',
                  valueExpr: 'value',
                  placeholder: 'Select template...'
                }}
              />

              <SimpleItem
                dataField="notifications.email.subject"
                caption="Custom Subject"
                editorOptions={{
                  placeholder: 'Leave empty to use template subject'
                }}
              />

              <SimpleItem
                dataField="notifications.email.includeAttachments"
                caption="Include Attachments"
                editorType="dxCheckBox"
              />
            </>
          )}
        </Tab>

        <Tab title="Webhooks" icon="globe">
          <SimpleItem
            dataField="notifications.webhook.enabled"
            caption="Enable Webhook Notifications"
            editorType="dxCheckBox"
          />

          {selectedRule?.notifications?.webhook?.enabled && (
            <>
              <SimpleItem
                dataField="notifications.webhook.url"
                caption="Webhook URL"
                editorOptions={{
                  placeholder: 'https://your-webhook-url.com'
                }}
                colSpan={2}
              />

              <SimpleItem
                dataField="notifications.webhook.method"
                caption="HTTP Method"
                editorType="dxSelectBox"
                editorOptions={{
                  dataSource: ['POST', 'PUT', 'PATCH'],
                  value: 'POST'
                }}
              />
            </>
          )}
        </Tab>

        <Tab title="Schedule" icon="clock">
          <SimpleItem
            dataField="schedule.immediate"
            caption="Send Immediately"
            editorType="dxCheckBox"
          />

          <SimpleItem
            dataField="schedule.delayed"
            caption="Delayed Delivery"
            editorType="dxCheckBox"
          />

          {selectedRule?.schedule?.delayed && (
            <SimpleItem
              dataField="schedule.delayMinutes"
              caption="Delay (minutes)"
              editorType="dxNumberBox"
              editorOptions={{
                min: 1,
                max: 1440,
                placeholder: '5'
              }}
            />
          )}

          <SimpleItem
            dataField="schedule.digest"
            caption="Digest Mode"
            editorType="dxCheckBox"
          />

          {selectedRule?.schedule?.digest && (
            <SimpleItem
              dataField="schedule.digestFrequency"
              caption="Digest Frequency"
              editorType="dxSelectBox"
              editorOptions={{
                dataSource: [
                  { value: 'hourly', text: 'Hourly' },
                  { value: 'daily', text: 'Daily' },
                  { value: 'weekly', text: 'Weekly' }
                ],
                displayExpr: 'text',
                valueExpr: 'value'
              }}
            />
          )}
        </Tab>
      </TabbedItem>
    </Form>
  );

  return (
    <div className="issue-tracker-notification-settings">
      <div className="notification-header">
        <h1>Notification Settings</h1>

        <div className="header-actions">
          <Button
            text="Create Rule"
            type="success"
            icon="plus"
            onClick={handleCreateRule}
          />

          <Button
            text="Refresh"
            type="default"
            icon="refresh"
            onClick={loadNotificationData}
          />
        </div>
      </div>

      <div className="notification-content">
        <div className="rules-section">
          <h2>Notification Rules</h2>
          {renderRulesGrid()}
        </div>
      </div>

      {/* Edit Rule Popup */}
      <Popup
        visible={editRulePopupVisible}
        onHiding={() => {
          setEditRulePopupVisible(false);
          setSelectedRule(null);
        }}
        dragEnabled={false}
        closeOnOutsideClick={false}
        showTitle={true}
        title={selectedRule?.id === 0 ? 'Create Notification Rule' : 'Edit Notification Rule'}
        width={800}
        height={600}
        maxWidth="90%"
        maxHeight="90%"
      >
        <div className="edit-rule-popup">
          {selectedRule && renderEditRuleForm()}

          <div className="popup-actions">
            <Button
              text="Cancel"
              onClick={() => {
                setEditRulePopupVisible(false);
                setSelectedRule(null);
              }}
            />
            <Button
              text="Save Rule"
              type="success"
              onClick={handleSaveRule}
            />
          </div>
        </div>
      </Popup>

      {/* Test Notification Popup */}
      <Popup
        visible={testPopupVisible}
        onHiding={() => setTestPopupVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Test Notification"
        width={500}
        height="auto"
      >
        <div className="test-notification-popup">
          <Form
            formData={testConfig}
            onFieldDataChanged={(e) =>
              setTestConfig({ ...testConfig, [e.dataField]: e.value })
            }
            labelLocation="top"
          >
            <SimpleItem
              dataField="testEmail"
              caption="Test Email Address"
              editorOptions={{
                placeholder: 'Enter email to receive test notification'
              }}
              isRequired={true}
              validationRules={[
                { type: 'required', message: 'Test email is required' },
                { type: 'email', message: 'Invalid email format' }
              ]}
            />
          </Form>

          <div className="popup-actions">
            <Button
              text="Cancel"
              onClick={() => setTestPopupVisible(false)}
            />
            <Button
              text="Send Test"
              type="success"
              onClick={handleTestNotification}
            />
          </div>
        </div>
      </Popup>

      {/* Toast Messages */}
      <Toast
        visible={toastConfig.visible}
        message={toastConfig.message}
        type={toastConfig.type}
        onHiding={() => setToastConfig({ ...toastConfig, visible: false })}
        displayTime={3000}
      />

      <LoadPanel
        visible={loading.notifications}
        message="Loading notification settings..."
        showPane={true}
        shading={true}
      />
    </div>
  );
};

export default IssueTrackerNotificationSettings;
