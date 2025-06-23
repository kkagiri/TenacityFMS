import React from "react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";

const NotificationMenuItem = ({ className = "", showBadge = true }) => {
  const navigate = useNavigate();
  const { notifications, importProgress } = useSelector(
    (state) => state.notification
  );

  const handleClick = () => {
    navigate("/notifications/dashboard");
  };

  // Calculate unread count
  const unreadCount = notifications.length + (importProgress ? 1 : 0);

  return (
    <div
      className={`notification-menu-item ${className}`}
      onClick={handleClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          handleClick();
        }
      }}
    >
      <div className="tw-flex tw-items-center tw-gap-3 tw-p-3 tw-rounded-lg tw-cursor-pointer tw-transition-colors hover:tw-bg-gray-50">
        <div className="tw-relative">
          <i className="fa-light fa-bell tw-text-xl tw-text-gray-600"></i>
          {showBadge && unreadCount > 0 && (
            <span className="tw-absolute tw--top-1 tw--right-1 tw-bg-red-500 tw-text-white tw-text-xs tw-rounded-full tw-w-5 tw-h-5 tw-flex tw-items-center tw-justify-center tw-font-medium">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <div className="tw-flex-1">
          <div className="tw-font-medium tw-text-gray-900">Notifications</div>
          <div className="tw-text-sm tw-text-gray-500">
            Manage alerts and notifications
          </div>
        </div>
        <i className="fa-light fa-chevron-right tw-text-gray-400"></i>
      </div>
    </div>
  );
};

export default NotificationMenuItem;