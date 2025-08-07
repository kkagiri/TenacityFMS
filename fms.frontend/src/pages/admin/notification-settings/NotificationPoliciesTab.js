import React from "react";

const NotificationPoliciesTab = () => {
  return (
    <div className="notification-policies-tab">
      <div className="policies-content">
        <div className="coming-soon">
          <div className="coming-soon-icon">
            <i className="fa-light fa-gears tw-text-6xl tw-text-gray-400"></i>
          </div>
          <h3 className="tw-text-xl tw-font-medium tw-text-gray-600 tw-mb-2">
            Notification Policies
          </h3>
          <p className="tw-text-gray-500 tw-mb-4">
            Configure global notification policies, escalation rules, and delivery schedules.
          </p>
          <div className="feature-list tw-text-left">
            <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3">Coming Soon:</h4>
            <ul className="tw-space-y-2 tw-text-gray-600">
              <li className="tw-flex tw-items-center">
                <i className="fa-light fa-check tw-text-green-500 tw-mr-2"></i>
                Escalation Rules Management
              </li>
              <li className="tw-flex tw-items-center">
                <i className="fa-light fa-check tw-text-green-500 tw-mr-2"></i>
                Delivery Schedule Configuration
              </li>
              <li className="tw-flex tw-items-center">
                <i className="fa-light fa-check tw-text-green-500 tw-mr-2"></i>
                Global Rate Limiting
              </li>
              <li className="tw-flex tw-items-center">
                <i className="fa-light fa-check tw-text-green-500 tw-mr-2"></i>
                Priority-based Routing
              </li>
              <li className="tw-flex tw-items-center">
                <i className="fa-light fa-check tw-text-green-500 tw-mr-2"></i>
                Template Management
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationPoliciesTab;
