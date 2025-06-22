import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "devextreme-react";
import NotificationDashboard from "./NotificationDashboard";
import "./NotificationDashboardPage.scss";

const NotificationDashboardPage = () => {
  const navigate = useNavigate();

  const handleBackClick = () => {
    navigate(-1);
  };

  return (
    <div className="notification-dashboard-page">
      <div className="dashboard-header">
        <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-bg-white tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-items-center tw-gap-4">
            <Button
              icon="fa-light fa-arrow-left"
              onClick={handleBackClick}
              stylingMode="text"
              hint="Go Back"
            />
            <div>
              <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-m-0">
                Notification Management
              </h1>
              <p className="tw-text-gray-600 tw-m-0">
                Monitor, configure, and manage all system notifications
              </p>
            </div>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <div className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-500">
              <i className="fa-light fa-clock"></i>
              <span>Last updated: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        <NotificationDashboard />
      </div>
    </div>
  );
};

export default NotificationDashboardPage;