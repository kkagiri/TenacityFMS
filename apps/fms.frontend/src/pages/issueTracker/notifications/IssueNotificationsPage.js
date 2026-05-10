import React from 'react';
import { Button } from 'devextreme-react';
import { useNavigate } from 'react-router-dom';

const IssueNotificationsPage = () => {
  const navigate = useNavigate();

  return (
    <div className="tw-p-6">
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-6">
          <div>
            <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-900 tw-mb-2">
              <i className="fa-light fa-bell tw-mr-2 tw-text-orange-500"></i>
              Issue Notifications
            </h2>
            <p className="tw-text-gray-600">
              Manage your notification preferences and view recent alerts.
            </p>
          </div>

          <Button
            text="Settings"
            type="default"
            stylingMode="contained"
            icon="fa-light fa-cog"
            onClick={() => navigate('/issue-tracker/settings')}
            className="tw-bg-orange-600 tw-text-white"
          />
        </div>

        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-bell-ring tw-text-6xl tw-text-orange-300 tw-mb-4"></i>
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-900 tw-mb-2">Smart Notifications</h3>
          <p className="tw-text-gray-600 tw-mb-6">
            Stay informed about critical issues and status updates with intelligent notifications.
          </p>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4 tw-max-w-4xl tw-mx-auto tw-mt-8">
            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-exclamation-triangle tw-mr-2 tw-text-red-500"></i>
                Critical Alerts
              </h4>
              <p className="tw-text-sm tw-text-gray-600">Immediate notifications for critical issues requiring urgent attention</p>
            </div>

            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-user-check tw-mr-2 tw-text-blue-500"></i>
                Assignment Updates
              </h4>
              <p className="tw-text-sm tw-text-gray-600">Get notified when issues are assigned to you or your team</p>
            </div>

            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-clock tw-mr-2 tw-text-yellow-500"></i>
                Status Changes
              </h4>
              <p className="tw-text-sm tw-text-gray-600">Track progress with notifications for status updates</p>
            </div>

            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-calendar-clock tw-mr-2 tw-text-purple-500"></i>
                Deadline Reminders
              </h4>
              <p className="tw-text-sm tw-text-gray-600">Automatic reminders for approaching deadlines</p>
            </div>

            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-envelope tw-mr-2 tw-text-green-500"></i>
                Email & SMS
              </h4>
              <p className="tw-text-sm tw-text-gray-600">Multi-channel notifications via email, SMS, and in-app alerts</p>
            </div>

            <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg tw-border">
              <h4 className="tw-font-semibold tw-text-gray-900 tw-mb-2">
                <i className="fa-light fa-sliders tw-mr-2 tw-text-orange-500"></i>
                Custom Rules
              </h4>
              <p className="tw-text-sm tw-text-gray-600">Create custom notification rules based on your workflow</p>
            </div>
          </div>

          <Button
            text="Coming Soon"
            type="normal"
            stylingMode="outlined"
            disabled={true}
            className="tw-mt-8"
          />
        </div>
      </div>
    </div>
  );
};

export default IssueNotificationsPage;
