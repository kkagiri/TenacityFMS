import React, { useState } from 'react';
import { Popup, ScrollView } from 'devextreme-react';
import './NotificationHelpPopup.scss';

/**
 * NotificationHelpPopup - A popup component that displays help documentation
 * for the notification system
 */
const NotificationHelpPopup = ({ visible, onHiding }) => {
  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', title: 'Overview', icon: 'fa-light fa-info-circle' },
    { id: 'policies', title: 'Notification Rules', icon: 'fa-light fa-shield' },
    { id: 'categories', title: 'Categories', icon: 'fa-light fa-tags' },
    { id: 'recipients', title: 'Recipient Groups', icon: 'fa-light fa-users-gear' },
    { id: 'history', title: 'History', icon: 'fa-light fa-clock-rotate-left' },
    { id: 'email', title: 'Email Settings', icon: 'fa-light fa-envelope-open-text' },
  ];

  const renderSectionContent = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <div className="help-section">
            <h3>
              <i className="fa-light fa-info-circle tw-mr-2 tw-text-blue-600"></i>
              Notification System Overview
            </h3>
            <p>
              The Notification System allows you to configure automated alerts and notifications
              for various events in the FMS platform. You can set up rules to notify users via
              different channels like email, SMS, push notifications, and in-app messages.
            </p>
            <h4>Key Features</h4>
            <ul>
              <li><strong>Notification Rules:</strong> Create rules that trigger notifications based on specific conditions</li>
              <li><strong>Categories:</strong> Organize notifications by type and priority</li>
              <li><strong>Recipient Groups:</strong> Define who receives notifications</li>
              <li><strong>Multi-channel Delivery:</strong> Send via email, SMS, push, or system notifications</li>
              <li><strong>History & Tracking:</strong> View all sent notifications and delivery status</li>
            </ul>
          </div>
        );

      case 'policies':
        return (
          <div className="help-section">
            <h3>
              <i className="fa-light fa-shield tw-mr-2 tw-text-blue-600"></i>
              Notification Rules (Policies)
            </h3>
            <p>
              Notification rules define the conditions that trigger notifications and how they are delivered.
            </p>
            <h4>Creating a Rule</h4>
            <ol>
              <li>Click the "Create Policy" button</li>
              <li>Give your rule a descriptive name</li>
              <li>Select the event type that triggers the notification</li>
              <li>Configure conditions (optional) to filter when notifications are sent</li>
              <li>Select the notification category</li>
              <li>Choose recipient groups or specific users</li>
              <li>Configure delivery methods</li>
              <li>Save the rule</li>
            </ol>
            <h4>Rule Status</h4>
            <ul>
              <li><strong>Active:</strong> Rule is processing events and sending notifications</li>
              <li><strong>Inactive:</strong> Rule is disabled and won't send notifications</li>
              <li><strong>Draft:</strong> Rule is not yet activated</li>
            </ul>
          </div>
        );

      case 'categories':
        return (
          <div className="help-section">
            <h3>
              <i className="fa-light fa-tags tw-mr-2 tw-text-blue-600"></i>
              Categories
            </h3>
            <p>
              Categories help organize notifications by type and set default behaviors.
            </p>
            <h4>Category Properties</h4>
            <ul>
              <li><strong>Name:</strong> Display name for the category</li>
              <li><strong>Description:</strong> Brief description of what notifications this category contains</li>
              <li><strong>Default Priority:</strong> Default priority level (Low, Medium, High, Critical)</li>
              <li><strong>Icon:</strong> Visual indicator for the category</li>
              <li><strong>Default Delivery Methods:</strong> Default channels for notifications in this category</li>
              <li><strong>Display Order:</strong> Sort order in lists and preferences</li>
            </ul>
            <h4>System Categories</h4>
            <p>
              Some categories are system-defined and cannot be deleted. These include:
            </p>
            <ul>
              <li>System Alerts</li>
              <li>Security Notifications</li>
              <li>Fuel Alerts</li>
              <li>Vehicle Alerts</li>
            </ul>
          </div>
        );

      case 'recipients':
        return (
          <div className="help-section">
            <h3>
              <i className="fa-light fa-users-gear tw-mr-2 tw-text-blue-600"></i>
              Recipient Groups
            </h3>
            <p>
              Recipient groups allow you to define collections of users who should receive notifications.
            </p>
            <h4>Creating a Group</h4>
            <ol>
              <li>Click "Create Group"</li>
              <li>Enter a group name and description</li>
              <li>Add members by selecting users or roles</li>
              <li>Configure group-level settings if needed</li>
              <li>Save the group</li>
            </ol>
            <h4>Group Types</h4>
            <ul>
              <li><strong>Static:</strong> Fixed list of users</li>
              <li><strong>Role-based:</strong> Automatically includes all users with specific roles</li>
              <li><strong>Dynamic:</strong> Based on user attributes or conditions</li>
            </ul>
          </div>
        );

      case 'history':
        return (
          <div className="help-section">
            <h3>
              <i className="fa-light fa-clock-rotate-left tw-mr-2 tw-text-blue-600"></i>
              Notification History
            </h3>
            <p>
              The history view shows all notifications that have been sent, including delivery status.
            </p>
            <h4>Status Indicators</h4>
            <ul>
              <li><span className="tw-text-green-600">● Delivered:</span> Successfully delivered to recipient</li>
              <li><span className="tw-text-yellow-600">● Pending:</span> Queued for delivery</li>
              <li><span className="tw-text-red-600">● Failed:</span> Delivery failed</li>
              <li><span className="tw-text-blue-600">● Read:</span> Recipient has viewed the notification</li>
            </ul>
            <h4>Filtering Options</h4>
            <ul>
              <li>Filter by date range</li>
              <li>Filter by category</li>
              <li>Filter by delivery status</li>
              <li>Filter by recipient</li>
              <li>Search by notification content</li>
            </ul>
          </div>
        );

      case 'email':
        return (
          <div className="help-section">
            <h3>
              <i className="fa-light fa-envelope-open-text tw-mr-2 tw-text-blue-600"></i>
              Email Settings
            </h3>
            <p>
              Configure email delivery settings for the notification system.
            </p>
            <h4>SMTP Configuration</h4>
            <ul>
              <li><strong>SMTP Server:</strong> Mail server address</li>
              <li><strong>Port:</strong> SMTP port (usually 587 for TLS, 465 for SSL)</li>
              <li><strong>Username:</strong> SMTP authentication username</li>
              <li><strong>Password:</strong> SMTP authentication password</li>
              <li><strong>From Address:</strong> Email address notifications are sent from</li>
              <li><strong>From Name:</strong> Display name for the sender</li>
            </ul>
            <h4>Testing</h4>
            <p>
              Use the "Send Test Email" button to verify your configuration is working correctly.
            </p>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={true}
      closeOnOutsideClick={true}
      showCloseButton={true}
      showTitle={false}
      width={800}
      height={600}
      className="notification-help-popup"
    >
      <div className="tw-h-full tw-flex tw-flex-col">
        {/* Header */}
        <div className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-3 tw-border-b tw-border-gray-200 tw-bg-blue-50">
          <i className="fa-light fa-circle-question tw-text-2xl tw-text-blue-600"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-m-0">Notification System Help</h3>
        </div>

        {/* Content */}
        <div className="tw-flex tw-flex-1 tw-overflow-hidden">
          {/* Sidebar Navigation */}
          <div className="tw-w-48 tw-border-r tw-border-gray-200 tw-bg-gray-50 tw-flex-shrink-0">
            <nav className="tw-p-2">
              {sections.map(section => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`tw-w-full tw-flex tw-items-center tw-gap-2 tw-px-3 tw-py-2 tw-text-left tw-text-sm tw-rounded tw-transition-colors ${
                    activeSection === section.id
                      ? 'tw-bg-blue-100 tw-text-blue-700 tw-font-medium'
                      : 'tw-text-gray-700 hover:tw-bg-gray-100'
                  }`}
                >
                  <i className={section.icon}></i>
                  {section.title}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="tw-flex-1 tw-overflow-hidden">
            <ScrollView showScrollbar="onHover" height="100%">
              <div className="tw-p-6">
                {renderSectionContent()}
              </div>
            </ScrollView>
          </div>
        </div>
      </div>
    </Popup>
  );
};

export default NotificationHelpPopup;
