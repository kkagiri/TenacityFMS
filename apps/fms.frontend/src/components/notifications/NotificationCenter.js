/**
 * File: NotificationCenter.js
 * Purpose: Bell popover for in-app notifications and report/action shortcuts
 * Dependencies: react, react-redux, notification actions, DevExtreme button
 * Last Modified: 2026-03-06
 *
 * Key Components:
 * - NotificationCenter: Loads backend notifications and renders compact actionable list
 */
import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import ReactDOM from "react-dom";
import { useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  fetchNotifications,
  markNotificationAsRead,
  removeCompletedReport,
  clearReportProgress,
} from "../../redux/actions/notificationActions";
import { cancelJob, downloadJobResult } from "../../api/reportJobApi";
import { Button } from "devextreme-react";
import "./NotificationCenter.scss";
import NotificationPreferencesPopup from "./NotificationPreferencesPopup";
import { resolveSafeNotificationLink } from "./notificationLinkUtils";

// Maximum notifications to show initially
const MAX_VISIBLE_NOTIFICATIONS = 3;
const EAST_AFRICA_TIME_ZONE = "Africa/Nairobi";
const RELATIVE_TIME_FORMATTER = new Intl.RelativeTimeFormat("en", {
  numeric: "auto",
});

const parseUtcDate = (value) => {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "number") {
    const numericDate = new Date(value);
    return Number.isNaN(numericDate.getTime()) ? null : numericDate;
  }

  const raw = String(value).trim();
  if (!raw) {
    return null;
  }

  const hasTimezone = /(?:[zZ]|[+\-]\d{2}:?\d{2})$/.test(raw);
  const normalized = hasTimezone
    ? raw
    : `${raw.replace(" ", "T").replace(/\//g, "-")}${raw.includes("T") || raw.includes(" ") ? "Z" : "T00:00:00Z"}`;

  const parsed = new Date(normalized);
  if (!Number.isNaN(parsed.getTime())) {
    return parsed;
  }

  const fallback = new Date(raw);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
};

const formatUtcDateTimeToEastAfrica = (value) => {
  const date = parseUtcDate(value);
  if (!date) return "";

  return new Intl.DateTimeFormat("en-GB", {
    timeZone: EAST_AFRICA_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
};

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

const isBackendNotificationRead = (notification) =>
  notification?.isRead === true || notification?.IsRead === true;

const getUnreadBackendNotificationDbIds = (notifications = []) => {
  if (!Array.isArray(notifications) || notifications.length === 0) {
    return [];
  }

  const unreadIds = new Set();

  notifications.forEach((notification) => {
    if (isBackendNotificationRead(notification)) {
      return;
    }

    const notificationDbId = resolveBackendNotificationDbId(notification);
    if (notificationDbId) {
      unreadIds.add(notificationDbId);
    }
  });

  return Array.from(unreadIds);
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

// ── M365 notification type → icon + color config ──
const NOTIF_TYPE_CONFIG = {
  success: { icon: 'fa-light fa-circle-check', bg: '#dff6dd', color: '#107c10' },
  error: { icon: 'fa-light fa-circle-xmark', bg: '#fde7e9', color: '#d13438' },
  warning: { icon: 'fa-light fa-triangle-exclamation', bg: '#fff4ce', color: '#c09a00' },
  info: { icon: 'fa-light fa-circle-info', bg: '#deecf9', color: '#0078d4' },
  alarm: { icon: 'fa-light fa-bell-exclamation', bg: '#fde7e9', color: '#d13438' },
  report: { icon: 'fa-light fa-file-chart-column', bg: '#e0f2f1', color: '#00897b' },
  import: { icon: 'fa-light fa-file-import', bg: '#e8eaf6', color: '#3949ab' },
  default: { icon: 'fa-light fa-bell', bg: '#f3f2f1', color: '#605e5c' },
};

const getNotifTypeConfig = (type, idString = '', alarmType = '') => {
  if (alarmType === 'VehicleGpsOfflineDuringFueling') {
    return { icon: 'fa-light fa-location-slash', bg: '#fff3e0', color: '#e65100' };
  }
  if (typeof idString === 'string') {
    if (idString.startsWith('pump-')) return { icon: 'fa-light fa-gas-pump', bg: '#e3f2fd', color: '#1565c0' };
    if (idString.startsWith('tag-')) return { icon: 'fa-light fa-tag', bg: '#e8eaf6', color: '#3949ab' };
    if (idString.startsWith('tank-')) return { icon: 'fa-light fa-tank-water', bg: '#fff3e0', color: '#e65100' };
  }
  return NOTIF_TYPE_CONFIG[type] || NOTIF_TYPE_CONFIG.default;
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
  const navigate = useNavigate();
  const isMobile = useIsMobile();

  // Get notifications and import progress from Redux store
  const { notifications, importProgress, reportProgress, completedReports, backendNotifications } = useSelector(
    (state) => state.notification
  );

  const [isOpen, setIsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [showAllNotifications, setShowAllNotifications] = useState(false);
  const [visibleNotifications, setVisibleNotifications] = useState([]);
  const [preferencesPopupVisible, setPreferencesPopupVisible] = useState(false);
  const [isMarkingAllRead, setIsMarkingAllRead] = useState(false);
  const [activeTab, setActiveTab] = useState('all');
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, right: 0 });
  const isMounted = useRef(true);
  const isLoading = useRef(false);
  const popoverRef = useRef(null);
  const buttonRef = useRef(null);
  const unreadBackendNotificationDbIds = useMemo(
    () => getUnreadBackendNotificationDbIds(backendNotifications),
    [backendNotifications]
  );

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

  const handleMarkAllAsRead = useCallback(async () => {
    if (isMarkingAllRead || unreadBackendNotificationDbIds.length === 0) {
      return;
    }

    setIsMarkingAllRead(true);

    try {
      await Promise.all(
        unreadBackendNotificationDbIds.map((notificationId) =>
          dispatch(markNotificationAsRead(notificationId))
        )
      );
      dispatch(fetchNotifications({ take: 50 }));
    } finally {
      if (isMounted.current) {
        setIsMarkingAllRead(false);
      }
    }
  }, [dispatch, isMarkingAllRead, unreadBackendNotificationDbIds]);

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
          timestamp:
            parseUtcDate(
              backendNotification?.createdAt ||
              backendNotification?.CreatedAt ||
              backendNotification?.timestamp ||
              backendNotification?.Timestamp ||
              Date.now()
            )?.getTime() || Date.now(),
          isBackendNotification: true,
          isRead: isBackendNotificationRead(backendNotification),
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
      (notification) => !isBackendNotificationRead(notification)
    ).length;
    const hasAnyUnread =
      notifications.length > 0 || !!importProgress || !!reportProgress || completedReports?.length > 0 || unreadBackendCount > 0;
    setHasUnread(hasAnyUnread);
  }, [notifications, importProgress, reportProgress, completedReports, backendNotifications]);

  // Fetch backend notifications when component mounts
  useEffect(() => {
    dispatch(fetchNotifications({ take: 50 })); // Fetch all recent notifications
  }, [dispatch]);

  // Calculate popover position from bell button for desktop portal
  useEffect(() => {
    if (!isOpen || isMobile) return;
    const computePos = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPopoverPosition({
          top: rect.bottom + 8,
          right: Math.max(window.innerWidth - rect.right - 20, 10),
        });
      }
    };
    computePos();
    window.addEventListener('resize', computePos);
    return () => window.removeEventListener('resize', computePos);
  }, [isOpen, isMobile]);

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
    const parsedTimestamp = parseUtcDate(timestamp)?.getTime();
    if (!parsedTimestamp) return "just now";

    const now = Date.now();
    const seconds = Math.floor((now - parsedTimestamp) / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) {
      return RELATIVE_TIME_FORMATTER.format(-Math.max(seconds, 0), "second");
    }

    if (minutes < 60) {
      return RELATIVE_TIME_FORMATTER.format(-minutes, "minute");
    }

    if (hours < 24) {
      return RELATIVE_TIME_FORMATTER.format(-hours, "hour");
    }

    if (days < 30) {
      return RELATIVE_TIME_FORMATTER.format(-days, "day");
    }

    const months = Math.floor(days / 30);
    if (months < 12) {
      return RELATIVE_TIME_FORMATTER.format(-months, "month");
    }

    const years = Math.floor(days / 365);
    return RELATIVE_TIME_FORMATTER.format(-years, "year");
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

  // Render report progress – M365 style
  const renderReportProgress = () => {
    if (!reportProgress || !reportProgress.id) return null;
    const percentage = Math.min(100, Math.max(0, reportProgress.percentage || 0));
    const timeAgo = reportProgress.lastUpdated
      ? formatTimeAgo(reportProgress.lastUpdated)
      : formatTimeAgo(reportProgress.timestamp || Date.now());
    let statusText = reportProgress.status || 'Processing';
    let statusBg = '#deecf9'; let statusColor = '#0078d4';
    if (statusText === 'Completed') { statusBg = '#dff6dd'; statusColor = '#107c10'; }
    else if (statusText === 'Failed') { statusBg = '#fde7e9'; statusColor = '#d13438'; }
    const isInProgress = reportProgress.inProgress !== false && statusText !== 'Completed' && statusText !== 'Failed' && statusText !== 'Cancelled';
    const handleCancel = async () => {
      if (!reportProgress.id) return;
      try {
        await cancelJob(reportProgress.id);
        dispatch(clearReportProgress());
      } catch (err) {
        console.error('Cancel failed:', err);
      }
    };
    return (
      <div className="m365-import-item">
        <div className="m365-import-header">
          <div className="m365-notif-icon" style={{ background: '#e0f2f1', color: '#00897b', width: 32, height: 32, fontSize: 13 }}>
            <i className="fa-light fa-file-chart-column"></i>
          </div>
          <span className="m365-import-title">
            {reportProgress.reportTitle || reportProgress.outputFormat?.toUpperCase() || 'Report'} Generation
          </span>
          <span className="m365-notif-time">{timeAgo}</span>
          {isInProgress && (
            <button
              type="button"
              onClick={handleCancel}
              title="Cancel report generation"
              style={{ marginLeft: 6, color: '#d13438', background: 'none', border: '1px solid #d13438', borderRadius: 4, padding: '1px 7px', fontSize: 11, cursor: 'pointer' }}
            >
              <i className="fa-light fa-xmark tw-mr-1"></i>Cancel
            </button>
          )}
        </div>
        <div style={{ marginLeft: 44 }}>
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
            <span className="m365-import-status" style={{ background: statusBg, color: statusColor }}>
              {statusText}
            </span>
            <span className="tw-text-xs" style={{ color: '#605e5c' }}>
              {reportProgress.recordCount > 0 ? `${reportProgress.recordCount} records · ` : ''}{percentage}%
            </span>
          </div>
          <div className="m365-progress-bar">
            <div
              className={`m365-progress-fill${statusText === 'Completed' ? ' m365-progress-fill--complete' : statusText === 'Failed' ? ' m365-progress-fill--failed' : ''}`}
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
          {reportProgress.statusMessage && (
            <div className="tw-text-[11px] tw-mt-1" style={{ color: '#605e5c' }}>
              {reportProgress.statusMessage}
            </div>
          )}
          <div className="tw-text-[10px] tw-mt-1" style={{ color: '#a19f9d' }}>
            ID: {reportProgress.id}
          </div>
        </div>
      </div>
    );
  };

  // Render completed reports history list
  const renderCompletedReports = () => {
    const reports = completedReports || [];
    if (reports.length === 0) return null;
    const handleView = async (jobId) => {
      try {
        const blob = await downloadJobResult(jobId);
        const url = URL.createObjectURL(blob);
        window.open(url, '_blank');
        setTimeout(() => URL.revokeObjectURL(url), 120000);
      } catch (err) {
        console.error('Failed to open report:', err);
      }
    };
    return (
      <div>
        {reports.map((rep) => {
          const isCompleted = rep.status === 'Completed';
          const isFailed = rep.status === 'Failed';
          const isCancelled = rep.status === 'Cancelled';
          let iconColor = '#00897b'; let iconBg = '#e0f2f1';
          if (isFailed) { iconColor = '#d13438'; iconBg = '#fde7e9'; }
          else if (isCancelled) { iconColor = '#605e5c'; iconBg = '#f3f2f1'; }
          let statusBg = '#dff6dd'; let statusColor = '#107c10';
          if (isFailed) { statusBg = '#fde7e9'; statusColor = '#d13438'; }
          else if (isCancelled) { statusBg = '#f3f2f1'; statusColor = '#605e5c'; }
          return (
            <div key={rep.jobId} className="m365-import-item">
              <div className="m365-import-header">
                <div className="m365-notif-icon" style={{ background: iconBg, color: iconColor, width: 32, height: 32, fontSize: 13 }}>
                  <i className={`fa-light ${isFailed ? 'fa-circle-xmark' : isCancelled ? 'fa-circle-x' : 'fa-file-chart-column'}`}></i>
                </div>
                <span className="m365-import-title">{rep.reportTitle || 'Report'}</span>
                <span className="m365-notif-time">{rep.completedAt ? formatTimeAgo(rep.completedAt) : ''}</span>
                <button
                  type="button"
                  onClick={() => dispatch(removeCompletedReport(rep.jobId))}
                  title="Dismiss"
                  style={{ marginLeft: 6, color: '#a19f9d', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13 }}
                >
                  <i className="fa-light fa-xmark"></i>
                </button>
              </div>
              <div style={{ marginLeft: 44 }} className="tw-flex tw-items-center tw-gap-3 tw-mt-1">
                <span className="m365-import-status" style={{ background: statusBg, color: statusColor }}>
                  {rep.status}
                </span>
                {rep.recordCount > 0 && (
                  <span className="tw-text-xs" style={{ color: '#605e5c' }}>{rep.recordCount} records</span>
                )}
                {isCompleted && (
                  <button
                    type="button"
                    onClick={() => handleView(rep.jobId)}
                    style={{ marginLeft: 'auto', color: '#0078d4', background: 'none', border: '1px solid #c7e0f4', borderRadius: 4, padding: '2px 10px', fontSize: 11, cursor: 'pointer' }}
                  >
                    <i className="fa-light fa-arrow-up-right-from-square tw-mr-1"></i>View
                  </button>
                )}
              </div>
              {rep.errorMessage && (
                <div className="tw-text-[11px] tw-mt-1" style={{ marginLeft: 44, color: '#d13438' }}>{rep.errorMessage}</div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  // Render import progress – M365 style
  const renderImportProgress = () => {
    if (!importProgress || !importProgress.id) return null;

    const percentage = Math.min(100, Math.max(0, importProgress.percentage || 0));
    const timeAgo = importProgress.lastUpdated
      ? formatTimeAgo(importProgress.lastUpdated)
      : formatTimeAgo(importProgress.timestamp || Date.now());
    const processedRecords = importProgress.processedRecords || 0;
    const totalRecords = importProgress.totalRecords || 0;
    let statusText = importProgress.status || "Processing";
    let statusBg = '#deecf9';
    let statusColor = '#0078d4';
    if (statusText === 'Completed') { statusBg = '#dff6dd'; statusColor = '#107c10'; }
    else if (statusText.includes('Failed')) { statusBg = '#fde7e9'; statusColor = '#d13438'; }

    return (
      <div className="m365-import-item">
        <div className="m365-import-header">
          <div className="m365-notif-icon" style={{ background: '#e8eaf6', color: '#3949ab', width: 32, height: 32, fontSize: 13 }}>
            <i className="fa-light fa-file-import"></i>
          </div>
          <span className="m365-import-title">Fuel Report Import</span>
          <span className="m365-notif-time">{timeAgo}</span>
        </div>
        <div style={{ marginLeft: 44 }}>
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
            <span className="m365-import-status" style={{ background: statusBg, color: statusColor }}>
              {statusText}
            </span>
            <span className="tw-text-xs" style={{ color: '#605e5c' }}>
              {processedRecords}/{totalRecords} &middot; {percentage}%
            </span>
          </div>
          <div className="m365-progress-bar">
            <div
              className={`m365-progress-fill${statusText === 'Completed' ? ' m365-progress-fill--complete' : statusText.includes('Failed') ? ' m365-progress-fill--failed' : ''}`}
              style={{ width: `${Math.max(percentage, 2)}%` }}
            />
          </div>
          <div className="m365-import-stats">
            {(importProgress.successCount > 0) && <span className="m365-import-stat m365-import-stat--ok"><i className="fa-light fa-check"></i> {importProgress.successCount} ok</span>}
            {(importProgress.skippedCount > 0) && <span className="m365-import-stat m365-import-stat--skip"><i className="fa-light fa-forward"></i> {importProgress.skippedCount} skipped</span>}
            {(importProgress.failureCount > 0) && <span className="m365-import-stat m365-import-stat--fail"><i className="fa-light fa-xmark"></i> {importProgress.failureCount} failed</span>}
            {(importProgress.duplicateCount > 0) && <span className="m365-import-stat m365-import-stat--dup"><i className="fa-light fa-copy"></i> {importProgress.duplicateCount} dups</span>}
          </div>
          <div className="tw-text-[10px] tw-mt-1" style={{ color: '#a19f9d' }}>
            ID: {importProgress.id || importProgress.reportId}
          </div>
        </div>
      </div>
    );
  };

  // Handle notification click - navigate to action URL if available
  const handleNotificationClick = useCallback((item) => {
    if (!item) return;
    // Prefer the new top-level link contract; fall back to legacy Data.Link shapes for back-compat.
    const rawLink =
      item.link ||
      item.Link ||
      item.data?.Link ||
      item.data?.link ||
      item.data?.ActionUrl ||
      item.data?.actionUrl ||
      item.data?.IssueUrl ||
      item.data?.issueUrl ||
      item.data?.ImportManagementLink;
    const safeLink = resolveSafeNotificationLink(rawLink);
    if (safeLink) {
      // Mark as read if backend notification
      markBackendNotificationAsRead(item);
      navigate(safeLink);
      setIsOpen(false);
    }
  }, [markBackendNotificationAsRead, navigate]);

  // Render notification item – M365 style
  const renderNotificationItem = (item) => {
    if (!item || !item.id) return null;

    const { id, title, message, type, timestamp, data, link, linkLabel, isBackendNotification, isRead } = item;
    const idString = String(id);
    const alarmType = item.alarmType || data?.alarmType || '';
    const typeConf = getNotifTypeConfig(type, idString, alarmType);
    const resolvedLink = resolveSafeNotificationLink(
      link ||
      item.Link ||
      data?.Link ||
      data?.link ||
      data?.ActionUrl ||
      data?.actionUrl ||
      data?.IssueUrl ||
      data?.issueUrl ||
      data?.ImportManagementLink
    );
    const hasActionUrl = !!resolvedLink;
    const resolvedLinkLabel = linkLabel || item.LinkLabel || 'View';
    const reportLink = resolveReportViewLink(data);
    const reportActionText = resolveReportActionText(data);
    const markReadId = resolveBackendNotificationDbId(item);
    const resolvedTimestamp = timestamp || Date.now();
    const timeAgo = formatTimeAgo(resolvedTimestamp);
    const localTimestampLabel = formatUtcDateTimeToEastAfrica(resolvedTimestamp);

    return (
      <div
        className={`m365-notif-item${isBackendNotification && !isRead ? ' m365-notif-item--unread' : ' m365-notif-item--read'}${hasActionUrl ? ' tw-cursor-pointer' : ''}`}
        onClick={hasActionUrl ? () => handleNotificationClick(item) : undefined}
      >
        {/* Circular type icon */}
        <div className="m365-notif-icon" style={{ background: typeConf.bg, color: typeConf.color }}>
          <i className={typeConf.icon}></i>
        </div>

        {/* Body */}
        <div className="m365-notif-body">
          <div className="m365-notif-title-row">
            <span className="m365-notif-title">{title || 'Notification'}</span>
            {isBackendNotification && !isRead && <span className="m365-new-badge">New</span>}
          </div>
          <div className="m365-notif-message">
            {message || 'Notification'}
            {hasActionUrl && <span style={{ color: '#0078d4', fontWeight: 500, marginLeft: 4 }}>{resolvedLinkLabel} {'\u2192'}</span>}
          </div>
          {/* Report download link */}
          {reportLink && (
            <button
              type="button"
              className="m365-notif-report-link"
              onClick={(e) => { e.stopPropagation(); openReportLink(reportLink); markBackendNotificationAsRead(item); }}
            >
              <i className="fa-light fa-download"></i>
              {reportActionText}
            </button>
          )}
          {/* Metadata: time + chips */}
          <div className="m365-notif-meta">
            <span className="m365-notif-time" title={localTimestampLabel ? `${localTimestampLabel} (UTC+3)` : undefined}>
              {timeAgo}
            </span>
            {data?.source && <span className="m365-notif-chip"><i className="fa-light fa-signal-stream"></i> {data.source}</span>}
            {data?.deviceId && <span className="m365-notif-chip"><i className="fa-light fa-microchip"></i> {data.deviceId}</span>}
          </div>
        </div>

        {/* Mark read button */}
        <div className="tw-flex-shrink-0">
          {isBackendNotification && !isRead && markReadId ? (
            <button
              className="m365-read-btn"
              onClick={(e) => { e.stopPropagation(); markBackendNotificationAsRead(item); }}
              title="Mark as read"
            >
              <i className="fa-solid fa-check"></i>
            </button>
          ) : isBackendNotification && isRead && markReadId ? (
            <div className="m365-read-btn m365-read-btn--read" title="Read">
              <i className="fa-solid fa-check"></i>
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  // Calculate unread count
  const unreadBackendCount = (backendNotifications || []).filter(
    (notification) => !isBackendNotificationRead(notification)
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
            // Render mobile full-screen overlay – M365 style
            ReactDOM.createPortal(
              <>
                <div className="notification-mobile-backdrop" onClick={() => setIsOpen(false)} />
                <div className="notification-popover notification-popover--mobile" ref={popoverRef}>
                  {/* Header */}
                  <div className="m365-panel-header">
                    <h4>Notifications</h4>
                    <div className="m365-header-actions">
                      {unreadBackendNotificationDbIds.length > 0 && (
                        <button type="button" className="m365-header-btn" onClick={handleMarkAllAsRead} disabled={isMarkingAllRead}>
                          {isMarkingAllRead ? 'Marking...' : 'Mark all read'}
                        </button>
                      )}
                      <button type="button" className="m365-header-btn m365-header-btn--icon-only" onClick={handlePreferences} title="Settings">
                        <i className="fa-light fa-gear"></i>
                      </button>
                      <button type="button" className="m365-header-btn m365-header-btn--icon-only" onClick={() => setIsOpen(false)} aria-label="Close">
                        <i className="fa-solid fa-xmark"></i>
                      </button>
                    </div>
                  </div>

                  {/* Tabs */}
                  <div className="m365-tabs">
                    <button type="button" className={`m365-tab${activeTab === 'all' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('all')}>
                      All <span className={`m365-tab-badge${activeTab === 'all' ? ' m365-tab-badge--active' : ''}`}>{totalNotifications}</span>
                    </button>
                    <button type="button" className={`m365-tab${activeTab === 'unread' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('unread')}>
                      Unread {unreadBackendCount > 0 && <span className="m365-tab-badge m365-tab-badge--alert">{unreadBackendCount}</span>}
                    </button>
                    {importProgress && (
                      <button type="button" className={`m365-tab${activeTab === 'import' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('import')}>
                        Import <span className="m365-tab-badge m365-tab-badge--active">{importProgress.percentage || 0}%</span>
                      </button>
                    )}
                    {(reportProgress || completedReports?.length > 0) && (
                      <button type="button" className={`m365-tab${activeTab === 'report' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('report')}>
                        Reports
                        {reportProgress
                          ? <span className="m365-tab-badge m365-tab-badge--alert">{reportProgress.percentage || 0}%</span>
                          : <span className="m365-tab-badge m365-tab-badge--active">{completedReports.length}</span>
                        }
                      </button>
                    )}
                  </div>

                  {/* Content */}
                  <div className="m365-panel-content">
                    {activeTab === 'import' && importProgress ? (
                      renderImportProgress()
                    ) : activeTab === 'report' ? (
                      <div>
                        {renderReportProgress()}
                        {renderCompletedReports()}
                        {!reportProgress && !completedReports?.length && (
                          <div className="m365-empty">
                            <i className="fa-light fa-file-chart-column"></i>
                            <p>No reports yet</p>
                          </div>
                        )}
                      </div>
                    ) : (visibleNotifications.filter(n => activeTab === 'unread' ? !n.isRead : true).length === 0) ? (
                      <div className="m365-empty">
                        <i className="fa-light fa-bell-slash"></i>
                        <p>{activeTab === 'unread' ? 'All caught up!' : 'No notifications'}</p>
                      </div>
                    ) : (
                      visibleNotifications
                        .filter(n => activeTab === 'unread' ? !n.isRead : true)
                        .map((notification) => (
                          <div key={notification.id}>{renderNotificationItem(notification)}</div>
                        ))
                    )}

                    {activeTab !== 'import' && activeTab !== 'report' && hasMoreNotifications && (
                      <div className="m365-show-more">
                        <button onClick={toggleShowAllNotifications}>
                          {showAllNotifications ? 'Show Less' : 'Show More'}
                          <i className={`fa-light fa-chevron-${showAllNotifications ? 'up' : 'down'}`}></i>
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="m365-panel-footer">
                    <button type="button" onClick={() => { setIsOpen(false); navigate('/my-notifications'); }}>
                      <i className="fa-light fa-bell"></i>
                      View All Notifications
                      <i className="fa-light fa-arrow-right"></i>
                    </button>
                  </div>
                </div>
              </>,
              document.body
            )
          ) : ReactDOM.createPortal(
            // Desktop: render popover via portal – above all panels
            <div className="notification-popover notification-popover--portal" ref={popoverRef} style={{ top: `${popoverPosition.top}px`, right: `${popoverPosition.right}px` }}>
              {/* Header */}
              <div className="m365-panel-header">
                <h4>Notifications</h4>
                <div className="m365-header-actions">
                  {unreadBackendNotificationDbIds.length > 0 && (
                    <button type="button" className="m365-header-btn" onClick={handleMarkAllAsRead} disabled={isMarkingAllRead}>
                      <i className="fa-light fa-envelope-open"></i>
                      {isMarkingAllRead ? 'Marking...' : 'Mark all read'}
                    </button>
                  )}
                  <button type="button" className="m365-header-btn m365-header-btn--icon-only" onClick={handlePreferences} title="Settings">
                    <i className="fa-light fa-gear"></i>
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="m365-tabs">
                <button type="button" className={`m365-tab${activeTab === 'all' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('all')}>
                  All
                  <span className={`m365-tab-badge${activeTab === 'all' ? ' m365-tab-badge--active' : ''}`}>{totalNotifications}</span>
                </button>
                <button type="button" className={`m365-tab${activeTab === 'unread' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('unread')}>
                  Unread
                  {unreadBackendCount > 0 && <span className="m365-tab-badge m365-tab-badge--alert">{unreadBackendCount}</span>}
                </button>
                {importProgress && (
                  <button type="button" className={`m365-tab${activeTab === 'import' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('import')}>
                    Import
                    <span className="m365-tab-badge m365-tab-badge--active">{importProgress.percentage || 0}%</span>
                  </button>
                )}
                {(reportProgress || completedReports?.length > 0) && (
                  <button type="button" className={`m365-tab${activeTab === 'report' ? ' m365-tab--active' : ''}`} onClick={() => setActiveTab('report')}>
                    Reports
                    {reportProgress
                      ? <span className="m365-tab-badge m365-tab-badge--alert">{reportProgress.percentage || 0}%</span>
                      : <span className="m365-tab-badge m365-tab-badge--active">{completedReports.length}</span>
                    }
                  </button>
                )}
              </div>

              {/* Content */}
              <div className="m365-panel-content">
                {activeTab === 'import' && importProgress ? (
                  renderImportProgress()
                ) : activeTab === 'report' ? (
                  <div>
                    {renderReportProgress()}
                    {renderCompletedReports()}
                    {!reportProgress && !completedReports?.length && (
                      <div className="m365-empty">
                        <i className="fa-light fa-file-chart-column"></i>
                        <p>No reports yet</p>
                      </div>
                    )}
                  </div>
                ) : (visibleNotifications.filter(n => activeTab === 'unread' ? !n.isRead : true).length === 0) ? (
                  <div className="m365-empty">
                    <i className="fa-light fa-bell-slash"></i>
                    <p>{activeTab === 'unread' ? 'All caught up!' : 'No notifications'}</p>
                  </div>
                ) : (
                  visibleNotifications
                    .filter(n => activeTab === 'unread' ? !n.isRead : true)
                    .map((notification) => (
                      <div key={notification.id}>{renderNotificationItem(notification)}</div>
                    ))
                )}

                {/* Show More/Less */}
                {activeTab !== 'import' && activeTab !== 'report' && hasMoreNotifications && (
                  <div className="m365-show-more">
                    <button onClick={toggleShowAllNotifications}>
                      {showAllNotifications ? 'Show Less' : 'Show More'}
                      <i className={`fa-light fa-chevron-${showAllNotifications ? 'up' : 'down'}`}></i>
                    </button>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="m365-panel-footer">
                <button type="button" onClick={() => { setIsOpen(false); navigate('/my-notifications'); }}>
                  <i className="fa-light fa-bell"></i>
                  View All Notifications
                  <i className="fa-light fa-arrow-right"></i>
                </button>
              </div>
            </div>,
            document.body
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

