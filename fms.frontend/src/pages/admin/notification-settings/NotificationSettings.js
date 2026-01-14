import React, { useState } from "react";
import { LoadPanel } from "devextreme-react";
import { Link } from "react-router-dom";
import NotificationCategoriesTab from "./NotificationCategoriesTab";
import "./NotificationSettings.css";

/**
 * Admin Notification Settings
 *
 * This page manages SYSTEM-WIDE notification configuration:
 * - Categories: Define notification types (Tank Alerts, Security, etc.)
 *
 * NOTE: Policies are managed in the /notifications/policies page
 * to avoid duplication. Link provided below for convenience.
 */
const NotificationSettings = () => {
  const [loading] = useState(false);

  return (
    <div className="notification-settings">
      <div className="notification-settings-header">
        <div className="header-content">
          <h1 className="settings-title">
            <i className="fa-light fa-bell tw-mr-3"></i>
            Notification Categories
          </h1>
          <p className="settings-subtitle">
            Manage notification categories that define how notifications are grouped and configured.
            Categories set default priorities, delivery methods, and acknowledgment requirements.
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-4 tw-mt-4">
          <Link
            to="/admin/notification/policies"
            className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-blue-600 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-md hover:tw-bg-blue-100"
          >
            <i className="fa-light fa-shield-check tw-mr-2"></i>
            Manage Notification Policies
          </Link>
          <Link
            to="/admin/notification/preferences"
            className="tw-inline-flex tw-items-center tw-px-4 tw-py-2 tw-text-sm tw-font-medium tw-text-gray-600 tw-bg-gray-50 tw-border tw-border-gray-200 tw-rounded-md hover:tw-bg-gray-100"
          >
            <i className="fa-light fa-user-cog tw-mr-2"></i>
            User Preferences
          </Link>
        </div>
      </div>

      <div className="settings-content tw-mt-6">
        <NotificationCategoriesTab />
      </div>

      <LoadPanel visible={loading} message="Loading notification settings..." />
    </div>
  );
};

export default NotificationSettings;
