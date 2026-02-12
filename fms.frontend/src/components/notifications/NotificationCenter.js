/**
 * File: NotificationCenter.js
 * Purpose: Bell popover for in-app notifications and report/action shortcuts
 * Dependencies: react, react-redux, notification actions, DevExtreme button
 * Last Modified: 2026-02-07
 *
 * Key Components:
 * - NotificationCenter: Loads backend notifications and renders compact actionable list
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import ReactDOM from "react-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markNotificationAsRead,
} from "../../redux/actions/notificationActions";
import { Button } from "devextreme-react";
import "./NotificationCenter.scss";
import NotificationPreferencesPopup from "./NotificationPreferencesPopup";

// Maximum notifications to show initially
const MAX_VISIBLE_NOTIFICATIONS = 3;

const stripHtmlTags = (value) => {
  if (!value) return "";
  return String(value).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
};

const tryParseNotificationData = (value) => {
  if (!value) return null;
  if (typeof value === "object") return value;

  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return null;
    }
  }

  return null;
};

const resolveBackendNotificationDbId = (notification) => {
  if (!notification) return null;

  const candidates = [
    notification.notificationDbId,
    notification.id,
    notification.Id,
  ];

  for (const candidate of candidates) {
    if (candidate === null || candidate === undefined || candidate === "") {
      continue;
    }

    const parsed = Number(candidate);
    if (Number.isInteger(parsed) && parsed > 0) {
      return parsed;
    }
  }

  return null;
};

const resolveReportActionText = (data) => {
  if (!data || typeof data !== "object") {
    return "Click here to view report";
  }

  const value = data.reportActionText || data.ReportActionText;
  if (!value || typeof value !== "string") {
    return "Click here to view report";
  }

  const normalized = value.trim();
  return normalized || "Click here to view report";
};

const resolveReportViewLink = (data) => {
  if (!data || typeof data !== "object") return null;

  const rawLink =
    data.reportViewPath ||
    data.reportViewUrl ||
    data.ReportViewPath ||
    data.ReportViewUrl ||
    null;

  if (!rawLink || typeof rawLink !== "string") return null;
  const trimmedLink = rawLink.trim();
  if (!trimmedLink) return null;

  if (/^https?:\/\//i.test(trimmedLink)) {
    return trimmedLink;
  }

  return trimmedLink.startsWith("/") ? trimmedLink : `/${trimmedLink}`;
};

// Error boundary component
class NotificationErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Error in NotificationCenter:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      // Render fallback UI
      return (
        <div className="notification-center">
          <div className="bell-wrapper">
            <i className="fa-regular fa-bell"></i>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Custom hook to detect mobile viewport
const useIsMobile = (breakpoint = 640) => {
  const [isMobile, setIsMobile] = useState(
    typeof window !== 'undefined' ? window.innerWidth < breakpoint : false
  );

  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const handler = (e) => setIsMobile(e.matches);
    setIsMobile(mql.matches);
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  }, [breakpoint]);

  return isMobile;
};

const NotificationCenter = () => {
  const dispatch = useDispatch();
  const isMobile = useIsMobile();

  // Get notifications and import progress from Redux store
  const { notifications, importProgress, backendNotifications } = useSelector(
    (state) => state.notification
  );

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [preferencesPopupVisible, setPreferencesPopupVisible] = useState(false);
  const isMounted = useRef(true);
  const isLoading = useRef(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);

  const markBackendNotificationAsRead = useCallback((item) => {
    if (!item?.isBackendNotification || item.isRead) {
      return;
    }

    const notificationDbId = resolveBackendNotificationDbId(item);
    if (!notificationDbId) {
      return;
    }

    dispatch(markNotificationAsRead(notificationDbId));
  }, [dispatch]);

  // Update mounted status on unmount
  useEffect(() => {
    isMounted.current = true;

    // Add keyboard shortcut for testing notifications (Ctrl+Shift+N)
    const handleKeyDown = (event) => {
      if (event.ctrlKey && event.shiftKey && event.key === "N") {
        const testNotifications = [
          {
            id: `test-info-${Date.now()}`,
            title: "Info Notification",
            message: "This is a test info notification",
            type: "info",
            timestamp: Date.now(),
          },
          {
            id: `test-success-${Date.now() + 1}`,
            title: "Success Notification",
            message: "This is a test success notification",
            type: "success",
            timestamp: Date.now(),
          },
          {
            id: `test-warning-${Date.now() + 2}`,
            title: "Warning Notification",
            message: "This is a test warning notification",
            type: "warning",
            timestamp: Date.now(),
          },
          {
            id: `test-error-${Date.now() + 3}`,
            title: "Error Notification",
            message: "This is a test error notification",
            type: "error",
            timestamp: Date.now(),
          },
          {
            id: `pump-123-${Date.now() + 4}`,
            title: "Pump Status",
            message: "Pump 123 is now offline",
            type: "error",
            timestamp: Date.now(),
            data: { deviceId: "123" },
          },
          {
            id: `tag-ABC123-${Date.now() + 5}`,
            title: "Tag Read",
            message: "Tag ABC123 read at Main Entrance",
            type: "info",
            timestamp: Date.now(),
            data: { tagId: "ABC123" },
          },
        ];

        // Add test notifications
        testNotifications.forEach((notification) => {
          dispatch({ type: "ADD_NOTIFICATION", payload: notification });
        });

        // Add test import progress
        dispatch({
          type: "ADD_IMPORT_PROGRESS",
          payload: {
            reportId: `test-imp-${Date.now()}`,
            status: "Processing",
            percentage: 45,
            processedRecords: 450,
            totalRecords: 1000,
            timestamp: Date.now(),
          },
        });
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    // SignalR connection lifecycle is managed globally by SignalRConnectionManager
    // based on the current route. Do NOT call dashboardSignalRService.start() here
    // to avoid race conditions during login navigation (the HttpConnection start/stop overlap
    // causes "Failed to start the HttpConnection before stop() was called").

    return () => {
      isMounted.current = false;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [dispatch]);

  // Update visible notifications when notifications changes or showAllNotifications toggles
  useEffect(() => {
    // Combine UI notifications and backend notifications
    const allNotifications = [
      ...notifications,
      ...(backendNotifications || []).map((backendNotification) => {
        const parsedData = tryParseNotificationData(
          backendNotification?.data ?? backendNotification?.Data
        );
        const backendDbId = resolveBackendNotificationDbId(backendNotification);
        const reportLink = resolveReportViewLink(parsedData);
        const rawMessage =
          backendNotification?.message ||
          backendNotification?.Message ||
          backendNotification?.content ||
          backendNotification?.Content;
        const normalizedMessage = reportLink
          ? "Click here to view the report."
          : (stripHtmlTags(rawMessage) || "Notification");

        return {
          ...backendNotification,
          id:
            backendDbId ||
            backendNotification?.notificationId ||
            backendNotification?.NotificationId ||
            `backend-${backendNotification?.title || backendNotification?.Title || "notification"}-${backendNotification?.createdAt || backendNotification?.CreatedAt || "unknown"}`,
          notificationDbId: backendDbId,
          type: String(
            backendNotification?.type || backendNotification?.Type || "info"
          ).toLowerCase(),
          title: backendNotification?.title || backendNotification?.Title || "Notification",
          message: normalizedMessage,
          data: parsedData,
          timestamp: new Date(
            backendNotification?.createdAt ||
            backendNotification?.CreatedAt ||
            backendNotification?.timestamp ||
            backendNotification?.Timestamp ||
            Date.now()
          ).getTime(),
          isBackendNotification: true,
          isRead:
            backendNotification?.isRead === true ||
            backendNotification?.IsRead === true,
        };
      }),
    ]; // Sort notifications by timestamp (latest first), with fallback sorting
    const sortedNotifications = allNotifications.sort((a, b) => {
      const timeA = a.timestamp || a.createdAt || 0;
      const timeB = b.timestamp || b.createdAt || 0;

      // Primary sort: by timestamp (latest first)
      const timeDiff = timeB - timeA;
      if (timeDiff !== 0) return timeDiff;

      // Secondary sort: by ID (higher ID first - newer records)
      const idA = typeof a.id === "number" ? a.id : parseInt(a.id) || 0;
      const idB = typeof b.id === "number" ? b.id : parseInt(b.id) || 0;
      return idB - idA;
    });

    if (showAllNotifications) {
      setVisibleNotifications(sortedNotifications);
    } else {
      setVisibleNotifications(
        sortedNotifications.slice(0, MAX_VISIBLE_NOTIFICATIONS)
      );
    }
  }, [notifications, backendNotifications, showAllNotifications]);

  // Handle click outside to close notification panel
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isOpen &&
        popoverRef.current &&
        buttonRef.current &&
        !popoverRef.current.contains(event.target) &&
        !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Check for unread notifications
  useEffect(() => {
    const unreadBackendCount = (backendNotifications || []).filter(
      (n) => !n.isRead
    ).length;
    const hasAnyUnread =
      notifications.length > 0 || !!importProgress || unreadBackendCount > 0;
    setHasUnread(hasAnyUnread);
  }, [notifications, importProgress, backendNotifications]);

  // Fetch backend notifications when component mounts
  useEffect(() => {
    dispatch(fetchNotifications({ take: 50 })); // Fetch all recent notifications
  }, [dispatch]);

  // Handle toggle notifications
  const toggleNotifications = useCallback(() => {
    if (isLoading.current) return;

    isLoading.current = true;
    setIsOpen((prevOpen) => {
      const newOpen = !prevOpen;

      // Fetch fresh notifications when opening
      if (newOpen) {
        dispatch(fetchNotifications({ take: 50 })); // Get all recent notifications, not just unread
        setHasUnread(false);
      }

      return newOpen;
    });

    // Reset loading state after a small delay
    setTimeout(() => {
      isLoading.current = false;
    }, 300);
  }, [dispatch]);

  // Toggle show all notifications
  const toggleShowAllNotifications = useCallback(() => {
    setShowAllNotifications((prev) => !prev);
  }, []);

  // Navigate to notification preferences
  const handlePreferences = useCallback(() => {
    setPreferencesPopupVisible(true);
    setIsOpen(false); // Close the notification center
  }, []);

  // Format timestamp into relative time
  const formatTimeAgo = (timestamp) => {
    if (!timestamp) return "just now";

    const now = Date.now();
    const seconds = Math.floor((now - timestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "just now";
    if (minutes === 1) return "1 minute ago";
    if (minutes < 60) return `${minutes} minutes ago`;
    if (hours === 1) return "1 hour ago";
    if (hours < 24) return `${hours} hours ago`;
    if (days === 1) return "1 day ago";
    return `${days} days ago`;
  };

  const openReportLink = useCallback((reportLink) => {
    if (!reportLink) return;

    if (/^https?:\/\//i.test(reportLink)) {
      window.open(reportLink, "_blank", "noopener,noreferrer");
      return;
    }

    const normalizedPath = reportLink.startsWith("/")
      ? reportLink
      : `/${reportLink}`;
    window.open(normalizedPath, "_blank", "noopener,noreferrer");
  }, []);

  // Render import progress
  const renderImportProgress = () => {
    if (!importProgress || !importProgress.id) return null;

    // Calculate percentage, handle edge cases
    const percentage = Math.min(
      100,
      Math.max(0, importProgress.percentage || 0)
    );

    // Get formatted time
    const timeAgo = importProgress.lastUpdated
      ? formatTimeAgo(importProgress.lastUpdated)
      : formatTimeAgo(importProgress.timestamp || Date.now());

    const processedRecords = importProgress.processedRecords || 0;
    const totalRecords = importProgress.totalRecords || 0;

    // Determine status display and color
    let statusText = importProgress.status || "Processing";
    let statusColor = "tw-text-blue-500";
    let statusIcon = "fa-regular fa-clock";

    if (statusText === "Completed") {
      statusColor = "tw-text-green-500";
      statusIcon = "fa-regular fa-check-circle";
    } else if (statusText.includes("Failed")) {
      statusColor = "tw-text-red-500";
      statusIcon = "fa-regular fa-circle-xmark";
    } else if (statusText === "Validating") {
      statusIcon = "fa-regular fa-check";
    } else if (statusText === "Saving") {
      statusIcon = "fa-regular fa-database";
      statusColor = "tw-text-teal-500";
    }

    return (
      <div className="notification-item tw-pb-3 tw-mb-2 tw-border-b tw-border-gray-200">
        <div className="tw-flex tw-items-center tw-mb-2">
          <div className="tw-w-6 tw-h-6 tw-mr-2 tw-flex tw-items-center tw-justify-center">
            <i className="fa-solid fa-file-import tw-text-blue-600"></i>
          </div>
          <div className="tw-font-semibold tw-flex-grow">
            Fuel Report Import
          </div>
          <div className="tw-text-xs tw-text-gray-500 tw-mr-2">{timeAgo}</div>
        </div>

        <div className="tw-flex tw-items-center tw-justify-between tw-gap-2 tw-mb-2">
          <div
            className={`tw-ml-8 ${statusColor} tw-flex tw-items-center tw-min-w-0`}
          >
            <i className={`${statusIcon} tw-mr-2`}></i>
            <span className="tw-truncate">{statusText}</span>
          </div>
          <div className="tw-text-xs tw-text-gray-600 tw-whitespace-nowrap tw-mr-2">
            {processedRecords}/{totalRecords}  {percentage}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="tw-ml-8 tw-w-full tw-max-w-[230px] tw-bg-gray-200 tw-h-2 tw-mb-2 tw-rounded-full tw-overflow-hidden">
          <div
            className={`tw-h-2 tw-rounded-full ${statusText.includes("Failed")
              ? "tw-bg-red-500"
              : statusText === "Completed"
                ? "tw-bg-green-500"
                : "tw-bg-blue-500 progress-bar-animated"
              }`}
            style={{
              width: `${Math.max(percentage, 2)}%`,
              minWidth: percentage > 0 ? "8px" : "0",
            }}
          ></div>
        </div>

        {(importProgress.successCount > 0 ||
          importProgress.skippedCount > 0 ||
          importProgress.failureCount > 0) && (
            <div className="tw-ml-8 tw-text-xs tw-text-gray-600 tw-mb-1">
              {importProgress.successCount || 0} success,{" "}
              {importProgress.skippedCount || 0} skipped,{" "}
              {importProgress.failureCount || 0} failed
            </div>
          )}

        {/* Display additional info based on status */}
        {importProgress.failureCount > 0 && (
          <div className="tw-ml-8 tw-text-xs tw-text-red-500 tw-mb-1">
            Failed: {importProgress.failureCount} records
          </div>
        )}

        {importProgress.duplicateCount > 0 && (
          <div className="tw-ml-8 tw-text-xs tw-text-rose-500 tw-mb-1">
            Duplicates: {importProgress.duplicateCount} records
          </div>
        )}

        {/* Report ID */}
        <div className="tw-ml-8 tw-text-xs tw-text-gray-500 tw-break-all">
          Report ID: {importProgress.id || importProgress.reportId}
        </div>
      </div>
    );
  };

  // Handle notification click - navigate to action URL if available
  const handleNotificationClick = useCallback((item) => {
    if (!item) return;
    const actionUrl = item.data?.ActionUrl || item.data?.actionUrl || item.data?.IssueUrl || item.data?.issueUrl;
    if (actionUrl) {
      // Mark as read if backend notification
      markBackendNotificationAsRead(item);
      // Navigate using relative path from the action URL
      try {
        const url = new URL(actionUrl);
        window.location.href = url.pathname;
      } catch {
        // If not a full URL, treat as relative path
        window.location.href = actionUrl;
      }
      setIsOpen(false);
    }
  }, [markBackendNotificationAsRead]);

  // Render notification item
  const renderNotificationItem = (item) => {
    if (!item || !item.id) return null;

    const {
      id,
      title,
      message,
      type,
      timestamp,
      data,
      isBackendNotification,
      isRead,
    } = item;
    const hasActionUrl = !!(data?.ActionUrl || data?.actionUrl || data?.IssueUrl || data?.issueUrl);
    const reportLink = resolveReportViewLink(data);
    const reportActionText = resolveReportActionText(data);
    const markReadId = resolveBackendNotificationDbId(item);
    const timeAgo = formatTimeAgo(timestamp || Date.now());

    // Determine icon based on notification type
    let icon = "fa-regular fa-bell";
    let iconColor = "tw-text-blue-500";

    if (type === "success") {
      icon = "fa-regular fa-circle-check";
      iconColor = "tw-text-green-500";
    } else if (type === "error") {
      icon = "fa-regular fa-circle-xmark";
      iconColor = "tw-text-red-500";
    } else if (type === "warning") {
      icon = "fa-regular fa-triangle-exclamation";
      iconColor = "tw-text-yellow-500";
    } else if (type === "info") {
      icon = "fa-regular fa-circle-info";
      iconColor = "tw-text-blue-500";
    } else if (type === "alarm") {
      icon = "fa-regular fa-bell-exclamation";
      iconColor = "tw-text-red-500";
    }

    // Check for specific notification types based on ID prefix
    // Convert id to string to handle both string and number IDs
    const idString = String(id);
    const alarmType = item.alarmType || data?.alarmType || '';

    // Check for GPS offline alarm
    if (alarmType === 'VehicleGpsOfflineDuringFueling') {
      icon = "fa-regular fa-location-slash";
      iconColor = "tw-text-orange-500";
    } else if (idString.startsWith("pump-")) {
      icon = "fa-regular fa-gas-pump";
      iconColor = type === "error" ? "tw-text-red-500" : "tw-text-blue-500";
    } else if (idString.startsWith("tag-")) {
      icon = "fa-regular fa-tag";
      iconColor = "tw-text-indigo-500";
    } else if (idString.startsWith("tank-")) {
      icon = "fa-regular fa-tank";
      iconColor = "tw-text-amber-600";
    }

    return (
      <div
        className={`notification-item tw-py-2 tw-px-2 tw-border-t tw-border-gray-200 ${isBackendNotification && !isRead ? "tw-bg-blue-50" : ""
          } ${hasActionUrl ? "tw-cursor-pointer hover:tw-bg-gray-100" : ""}`}
        onClick={hasActionUrl ? () => handleNotificationClick(item) : undefined}
      >
        <div className="tw-flex tw-gap-2">
          {/* Icon */}
          <div className="tw-flex-shrink-0 tw-w-5 tw-h-5 tw-flex tw-items-center tw-justify-center tw-mt-0.5">
            <i className={`${icon} ${iconColor}`}></i>
          </div>
          {/* Content */}
          <div className="tw-flex-1 tw-min-w-0">
            {title && (
              <div
                className={`tw-text-sm tw-font-semibold tw-leading-tight ${isBackendNotification && !isRead
                  ? "tw-text-gray-900"
                  : "tw-text-gray-800"
                  }`}
              >
                {title}
              </div>
            )}
            <div className="tw-text-xs tw-text-gray-600 tw-leading-snug tw-mt-0.5">
              {message || "Notification"}
              {hasActionUrl && (
                <span className="tw-text-blue-600 tw-font-medium tw-ml-1">
                  View details ->
                </span>
              )}
            </div>
            {reportLink && (
              <div className="tw-mt-1">
                <button
                  type="button"
                  className="tw-inline-flex tw-items-center tw-gap-1 tw-text-xs tw-text-blue-700 hover:tw-text-blue-800 tw-font-medium tw-underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    openReportLink(reportLink);
                    markBackendNotificationAsRead(item);
                  }}
                >
                  <i className="fa-light fa-link"></i>
                  {reportActionText}
                </button>
              </div>
            )}
            {/* Device ID */}
            {data?.deviceId && (
              <div className="tw-text-xs tw-text-blue-600 tw-mt-0.5">
                Device: {data.deviceId}
              </div>
            )}
            {/* Time + unread badge */}
            <div className="tw-text-xs tw-text-gray-400 tw-mt-1 tw-flex tw-items-center tw-gap-2">
              <span>{timeAgo}</span>
              {isBackendNotification && !isRead && (
                <span className="tw-px-1.5 tw-py-0.5 tw-rounded tw-text-[10px] tw-font-medium tw-bg-blue-100 tw-text-blue-700">
                  New
                </span>
              )}
            </div>
          </div>
          {/* Action button */}
          <div className="tw-flex-shrink-0 tw-flex tw-items-start">
            {isBackendNotification && !isRead && markReadId && (
              <button
                className="tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-bg-blue-100 tw-text-blue-600 hover:tw-bg-blue-200 tw-rounded-full tw-border tw-border-blue-300 tw-text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  markBackendNotificationAsRead(item);
                }}
                title="Mark as read"
              >
                <i className="fa-solid fa-check"></i>
              </button>
            )}
            {isBackendNotification && isRead && markReadId && (
              <div
                className="tw-w-6 tw-h-6 tw-flex tw-items-center tw-justify-center tw-bg-green-100 tw-text-green-500 tw-rounded-full tw-border tw-border-green-200 tw-text-xs tw-opacity-60"
                title="Read"
              >
                <i className="fa-solid fa-check"></i>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  // Calculate unread count
  const unreadBackendCount = (backendNotifications || []).filter(
    (n) => !n.isRead
  ).length;
  const unreadCount =
    notifications.length + unreadBackendCount + (importProgress ? 1 : 0);

  // Check if we need to show the "Show More" button
  const totalNotifications =
    notifications.length + (backendNotifications || []).length;
  const hasMoreNotifications = totalNotifications > MAX_VISIBLE_NOTIFICATIONS;

  return (
    <NotificationErrorBoundary>
      <div className="notification-center">
        {/* Bell button with notification badge */}
        <div
          ref={buttonRef}
          className={`bell-button-wrapper ${hasUnread ? "has-unread" : ""}`}
          onClick={toggleNotifications}
        >
          <div className="bell-icon">
            <i className="fa-regular fa-bell"></i>
            {unreadCount > 0 && (
              <span className="notification-badge">{unreadCount}</span>
            )}
          </div>
        </div>

        {/* Popover / Full-screen for notifications */}
        {isOpen && (
          isMobile ? (
            // Render mobile full-screen overlay via portal at <body> to escape overflow clipping
            ReactDOM.createPortal(
              <>
                <div
                  className="notification-mobile-backdrop"
                  onClick={() => setIsOpen(false)}
                />
                <div
                  className="notification-popover notification-popover--mobile"
                  ref={popoverRef}
                >
                  <div className="tw-bg-white tw-w-full tw-h-full tw-flex tw-flex-col">
                    <div className="tw-flex tw-justify-between tw-items-center tw-p-3 tw-border-b tw-border-gray-200 tw-flex-shrink-0">
                      <h4 className="tw-text-lg tw-font-semibold tw-m-0">
                        Notifications
                      </h4>
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <Button
                          onClick={handlePreferences}
                          stylingMode="text"
                          className="preferences-btn"
                          icon="fa-solid fa-cog"
                          hint="Notification Preferences"
                        />
                        <button
                          type="button"
                          className="tw-w-8 tw-h-8 tw-flex tw-items-center tw-justify-center tw-rounded-full tw-bg-gray-100 hover:tw-bg-gray-200 tw-text-gray-600 tw-border-0 tw-cursor-pointer"
                          onClick={() => setIsOpen(false)}
                          aria-label="Close notifications"
                        >
                          <i className="fa-solid fa-xmark tw-text-base"></i>
                        </button>
                      </div>
                    </div>

                    <div className="tw-overflow-auto tw-flex-1 notification-content">
                      <div className="tw-p-2">
                        {importProgress && renderImportProgress()}

                        {visibleNotifications.length === 0 && !importProgress ? (
                          <div className="tw-text-center tw-py-8 tw-text-gray-500">
                            <i className="fa-regular fa-inbox-empty tw-text-3xl tw-block tw-mb-2"></i>
                            <div>No notifications</div>
                          </div>
                        ) : (
                          visibleNotifications.map((notification) => (
                            <div key={notification.id}>
                              {renderNotificationItem(notification)}
                            </div>
                          ))
                        )}

                        {/* Show More/Less button */}
                        {hasMoreNotifications && (
                          <div className="tw-text-center tw-py-3 tw-mt-2 tw-border-t tw-border-gray-200">
                            <button
                              className="tw-flex tw-items-center tw-justify-center tw-mx-auto tw-border tw-border-gray-200 tw-rounded-full tw-px-4 tw-py-1.5 hover:tw-bg-gray-50"
                              onClick={toggleShowAllNotifications}
                            >
                              <span className="tw-text-blue-500 tw-font-medium">
                                {showAllNotifications ? "Show Less" : "Show More"}
                              </span>
                              <i
                                className={`fa-solid fa-chevron-${showAllNotifications ? "up" : "down"
                                  } tw-text-blue-500 tw-ml-1 tw-text-xs`}
                              ></i>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </>,
              document.body
            )
          ) : (
            // Desktop: render inline popover
            <div className="notification-popover" ref={popoverRef}>
              <div className="tw-bg-white tw-rounded tw-shadow-lg tw-w-96">
                <div className="tw-flex tw-justify-between tw-items-center tw-p-3">
                  <h4 className="tw-text-lg tw-font-semibold tw-m-0">
                    Notifications
                  </h4>
                  <div className="tw-flex tw-gap-2">
                    <Button
                      onClick={handlePreferences}
                      stylingMode="text"
                      className="preferences-btn"
                      icon="fa-solid fa-cog"
                      hint="Notification Preferences"
                    />
                  </div>
                </div>

                <div className="tw-overflow-auto notification-content">
                  <div className="tw-p-2">
                    {importProgress && renderImportProgress()}

                    {visibleNotifications.length === 0 && !importProgress ? (
                      <div className="tw-text-center tw-py-8 tw-text-gray-500">
                        <i className="fa-regular fa-inbox-empty tw-text-3xl tw-block tw-mb-2"></i>
                        <div>No notifications</div>
                      </div>
                    ) : (
                      visibleNotifications.map((notification) => (
                        <div key={notification.id}>
                          {renderNotificationItem(notification)}
                        </div>
                      ))
                    )}

                    {/* Show More/Less button */}
                    {hasMoreNotifications && (
                      <div className="tw-text-center tw-py-3 tw-mt-2 tw-border-t tw-border-gray-200">
                        <button
                          className="tw-flex tw-items-center tw-justify-center tw-mx-auto tw-border tw-border-gray-200 tw-rounded-full tw-px-4 tw-py-1.5 hover:tw-bg-gray-50"
                          onClick={toggleShowAllNotifications}
                        >
                          <span className="tw-text-blue-500 tw-font-medium">
                            {showAllNotifications ? "Show Less" : "Show More"}
                          </span>
                          <i
                            className={`fa-solid fa-chevron-${showAllNotifications ? "up" : "down"
                              } tw-text-blue-500 tw-ml-1 tw-text-xs`}
                          ></i>
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )
        )}

        {/* Notification Preferences Popup */}
        <NotificationPreferencesPopup
          visible={preferencesPopupVisible}
          onHiding={() => setPreferencesPopupVisible(false)}
        />
      </div>
    </NotificationErrorBoundary>
  );
};

export default NotificationCenter;

