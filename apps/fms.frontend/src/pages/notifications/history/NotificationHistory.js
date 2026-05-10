/**
 * File: NotificationHistory.js
 * Purpose: Admin notification history page showing ALL system notifications
 *          with M365 Admin Center Fluent design, filters, detail panel with HTML rendering.
 * Dependencies: react, devextreme-react/data-grid, notificationsApi
 * Last Modified: 2026-03-26
 *
 * Key Functions/Components:
 * - loadNotifications: Loads all system notifications via admin-history endpoint.
 * - handleViewDetails: Opens M365-styled detail panel with HTML body rendering.
 * - renderStatusBadge/renderTypeBadge/renderPriorityBadge: Grid cell formatters (M365 badge style).
 */
import React, { useState, useEffect, useCallback } from "react";
import { DataGrid, Column, Paging, Pager, Sorting } from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import notificationsApi from "../../../dataservice/notificationsApi";
import SlidePanel from "../../../components/ui/SlidePanel";
import "./NotificationHistory.scss";

const PAGE_SIZE = 25;

const parseImportRecordDateTime = (value) => {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === "string") {
    const trimmed = value.trim();
    const dateTimeMatch = trimmed.match(
      /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,7}))?)?)?$/
    );

    if (dateTimeMatch) {
      const [, year, month, day, hour = "00", minute = "00", second = "00", fraction = "0"] = dateTimeMatch;
      const milliseconds = Number(fraction.padEnd(3, "0").slice(0, 3));
      return new Date(
        Number(year),
        Number(month) - 1,
        Number(day),
        Number(hour),
        Number(minute),
        Number(second),
        milliseconds
      );
    }
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
};

const formatDateTime = (value) => {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
};

const parseNotificationData = (rawData) => {
  if (!rawData) return null;

  if (typeof rawData === "object") {
    return rawData;
  }

  try {
    return JSON.parse(rawData);
  } catch {
    return null;
  }
};

const isFileImportNotification = (notification) => {
  if (!notification) return false;

  return (
    notification.categoryName === "File Importation Notification Details" ||
    notification.category === "File Importation Notification Details"
  );
};

const getLatestRecord = (notification) => {
  const data = notification?.parsedData;
  if (!data || typeof data !== "object") return null;
  return data.LatestRecord || data.latestRecord || null;
};

const getImportedFileName = (notification) => {
  const data = notification?.parsedData;
  if (!data || typeof data !== "object") return null;

  return data.FileName || data.fileName || "—";
};

const getLatestRecordDisplay = (notification) => {
  const latestRecord = getLatestRecord(notification);
  if (!latestRecord) return "—";

  const recordDateValue = latestRecord.RecordDate || latestRecord.recordDate;
  const recordDate = (() => {
    const parsedDate = parseImportRecordDateTime(recordDateValue);
    if (!parsedDate) return "—";
    return parsedDate.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  })();
  const vehicleLabel = latestRecord.VehicleLabel || latestRecord.vehicleLabel || "Unknown Vehicle";
  const siteLabel = latestRecord.SiteLabel || latestRecord.siteLabel || "Unknown Site";
  const shift = latestRecord.Shift || latestRecord.shift || "Unknown Shift";

  return `${recordDate} | ${vehicleLabel} | ${siteLabel} | ${shift}`;
};

const getImportCounts = (notification) => {
  const data = notification?.parsedData;
  if (!data || typeof data !== "object") return null;

  return {
    successCount: data.SuccessCount ?? data.successCount ?? 0,
    failedCount: data.FailedCount ?? data.failedCount ?? 0,
    skippedCount: data.SkippedCount ?? data.skippedCount ?? 0,
    duplicateCount: data.DuplicateCount ?? data.duplicateCount ?? 0,
  };
};

const NotificationHistory = () => {
  const [notifications, setNotifications] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [panelOpen, setPanelOpen] = useState(false);

  const [filters, setFilters] = useState({
    status: "",
    type: "",
    priority: "",
    search: "",
    dateFrom: "",
    dateTo: "",
  });

  const loadNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const result = await notificationsApi.getAdminNotificationHistory({
        type: filters.type || undefined,
        status: filters.status || undefined,
        priority: filters.priority || undefined,
        dateFrom: filters.dateFrom || undefined,
        dateTo: filters.dateTo || undefined,
        search: filters.search || undefined,
        take: 200,
      });

      if (result.isSuccess) {
        const normalizedNotifications = (Array.isArray(result.data) ? result.data : []).map((notification) => {
          const parsedData = parseNotificationData(notification.data);

          return {
            ...notification,
            parsedData,
            importedFileName: getImportedFileName({ parsedData }),
            latestRecordDisplay: getLatestRecordDisplay({ parsedData }),
          };
        });

        setNotifications(normalizedNotifications);
        setTotalCount(result.totalCount || 0);
      } else {
        notify(result.message || "Failed to load notifications", "error", 3000);
        setNotifications([]);
      }
    } catch (error) {
      console.error("Error loading notification history:", error);
      notify("Error loading notification history", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const handleClearFilters = () => {
    setFilters({ status: "", type: "", priority: "", search: "", dateFrom: "", dateTo: "" });
  };

  const handleViewDetails = (notification) => {
    setSelectedNotification(notification);
    setPanelOpen(true);
  };

  const handleClosePanel = () => {
    setPanelOpen(false);
    setSelectedNotification(null);
  };

  const handleRowClick = (e) => {
    if (e.data) {
      handleViewDetails(e.data);
    }
  };

  // Grid cell renderers — M365 badge style
  const renderStatusBadge = (cellInfo) => {
    const status = (cellInfo.value || "unknown").toLowerCase();
    const config = {
      sent: { cls: "m365-badge--primary", label: "Sent" },
      delivered: { cls: "m365-badge--success", label: "Delivered" },
      failed: { cls: "m365-badge--error", label: "Failed" },
      pending: { cls: "m365-badge--warning", label: "Pending" },
      read: { cls: "m365-badge--success", label: "Read" },
      created: { cls: "m365-badge--neutral", label: "Created" },
    };
    const c = config[status] || { cls: "m365-badge--neutral", label: status };
    return <span className={`m365-badge ${c.cls}`}>{c.label}</span>;
  };

  const renderTypeBadge = (cellInfo) => {
    const type = (cellInfo.value || "system").toLowerCase();
    const icons = {
      email: "fa-light fa-envelope",
      sms: "fa-light fa-message-sms",
      push: "fa-light fa-bell",
      system: "fa-light fa-gear",
      inapp: "fa-light fa-window-maximize",
    };
    const icon = icons[type] || "fa-light fa-bell";
    return (
      <span className="m365-badge m365-badge--neutral">
        <i className={icon}></i>
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    );
  };

  const renderPriorityBadge = (cellInfo) => {
    const priority = (cellInfo.value || "medium").toLowerCase();
    const config = {
      critical: { cls: "m365-badge--error", label: "Critical" },
      high: { cls: "m365-badge--warning", label: "High" },
      medium: { cls: "m365-badge--primary", label: "Medium" },
      low: { cls: "m365-badge--neutral", label: "Low" },
    };
    const c = config[priority] || { cls: "m365-badge--neutral", label: priority };
    return <span className={`m365-badge ${c.cls}`}>{c.label}</span>;
  };

  const renderRecipientCount = (cellInfo) => {
    const count = cellInfo.data?.recipientCount || 0;
    const delivered = cellInfo.data?.deliveredCount || 0;
    const failed = cellInfo.data?.failedCount || 0;
    return (
      <div className="nh-recipient-summary">
        <span className="nh-recipient-summary__total">{count}</span>
        {delivered > 0 && <span className="m365-badge m365-badge--success">{delivered} delivered</span>}
        {failed > 0 && <span className="m365-badge m365-badge--error">{failed} failed</span>}
      </div>
    );
  };

  const renderDateTime = (cellInfo) => {
    return <span className="nh-datetime">{formatDateTime(cellInfo.value)}</span>;
  };

  const renderActions = (cellInfo) => {
    return (
      <button
        className="m365-icon-btn"
        title="View Details"
        onClick={(e) => {
          e.stopPropagation();
          handleViewDetails(cellInfo.data);
        }}
      >
        <i className="fa-light fa-eye"></i>
      </button>
    );
  };

  const renderFileName = (cellInfo) => {
    const isImport = isFileImportNotification(cellInfo.data);
    const fileName = cellInfo.data?.importedFileName;

    if (!isImport || !fileName || fileName === "—") {
      return <span className="nh-secondary-text">—</span>;
    }

    return (
      <div className="nh-file-cell">
        <i className="fa-light fa-file-excel nh-file-cell__icon"></i>
        <span className="nh-file-cell__name" title={fileName}>{fileName}</span>
      </div>
    );
  };

  const renderLatestRecord = (cellInfo) => {
    const isImport = isFileImportNotification(cellInfo.data);
    const latestRecordDisplay = cellInfo.data?.latestRecordDisplay;

    if (!isImport || !latestRecordDisplay || latestRecordDisplay === "—") {
      return <span className="nh-secondary-text">—</span>;
    }

    return <span className="nh-latest-record-cell" title={latestRecordDisplay}>{latestRecordDisplay}</span>;
  };

  const hasActiveFilters = filters.status || filters.type || filters.priority || filters.search || filters.dateFrom || filters.dateTo;

  const selectedNotificationData = selectedNotification?.parsedData || parseNotificationData(selectedNotification?.data);
  const selectedLatestRecord = getLatestRecord({ parsedData: selectedNotificationData });
  const selectedImportCounts = getImportCounts({ parsedData: selectedNotificationData });
  const selectedFileName = getImportedFileName({ parsedData: selectedNotificationData });
  const selectedFilePath = selectedNotificationData?.FilePath || selectedNotificationData?.filePath || "—";
  const selectedReportType = selectedNotificationData?.ReportType || selectedNotificationData?.reportType || "—";
  const selectedDetectedSite = selectedNotificationData?.DetectedSiteName || selectedNotificationData?.detectedSiteName || "—";
  const selectedImportMode = selectedNotificationData?.ImportMode || selectedNotificationData?.importMode || "—";
  const selectedReportId = selectedNotificationData?.ReportId || selectedNotificationData?.reportId || "—";

  return (
    <div className="nh-page">
      {/* M365 Page Header */}
      <div className="m365-page-header">
        <div className="m365-page-header__left">
          <i className="fa-light fa-clock-rotate-left m365-page-header__icon"></i>
          <h2 className="m365-page-header__title">
            Notification History
            <span className="m365-page-header__count">{totalCount}</span>
          </h2>
        </div>
        <div className="m365-page-header__actions">
          <button className="m365-btn m365-btn--ghost" onClick={loadNotifications} disabled={loading}>
            <i className="fa-light fa-rotate-right"></i>
            Refresh
          </button>
        </div>
      </div>

      {/* M365 Filter Bar */}
      <div className="m365-filters">
        <div className="m365-search">
          <i className="fa-light fa-magnifying-glass m365-search__icon"></i>
          <input
            className="m365-search__input"
            placeholder="Search notifications..."
            value={filters.search}
            onChange={(e) => handleFilterChange("search", e.target.value)}
          />
        </div>

        <select
          className="m365-select"
          value={filters.status}
          onChange={(e) => handleFilterChange("status", e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="sent">Sent</option>
          <option value="delivered">Delivered</option>
          <option value="failed">Failed</option>
          <option value="pending">Pending</option>
          <option value="created">Created</option>
        </select>

        <select
          className="m365-select"
          value={filters.type}
          onChange={(e) => handleFilterChange("type", e.target.value)}
        >
          <option value="">All Types</option>
          <option value="email">Email</option>
          <option value="sms">SMS</option>
          <option value="push">Push</option>
          <option value="system">System</option>
        </select>

        <select
          className="m365-select"
          value={filters.priority}
          onChange={(e) => handleFilterChange("priority", e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="critical">Critical</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>

        <input
          type="date"
          className="m365-date"
          value={filters.dateFrom}
          onChange={(e) => handleFilterChange("dateFrom", e.target.value)}
          title="From Date"
        />

        <input
          type="date"
          className="m365-date"
          value={filters.dateTo}
          onChange={(e) => handleFilterChange("dateTo", e.target.value)}
          title="To Date"
        />

        {hasActiveFilters && (
          <button className="m365-btn m365-btn--text" onClick={handleClearFilters}>
            <i className="fa-light fa-xmark"></i>
            Clear
          </button>
        )}
      </div>

      {/* Notification Grid */}
      <div className="nh-grid-container">
        <DataGrid
          dataSource={notifications}
          showBorders={false}
          showRowLines={true}
          showColumnLines={false}
          rowAlternationEnabled={false}
          columnAutoWidth={true}
          hoverStateEnabled={true}
          onRowClick={handleRowClick}
          loadPanel={{ enabled: loading }}
          noDataText="No notifications found"
          className="nh-datagrid"
        >
          <Sorting mode="multiple" />
          <Paging defaultPageSize={PAGE_SIZE} />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[25, 50, 100]}
            showInfo={true}
          />
          <Column dataField="title" caption="Title" minWidth={200} />
          <Column caption="Imported File" cellRender={renderFileName} minWidth={220} allowSorting={false} />
          <Column caption="Latest Record" cellRender={renderLatestRecord} minWidth={260} allowSorting={false} />
          <Column dataField="type" caption="Type" cellRender={renderTypeBadge} width={110} />
          <Column dataField="status" caption="Status" cellRender={renderStatusBadge} width={110} />
          <Column dataField="priority" caption="Priority" cellRender={renderPriorityBadge} width={100} />
          <Column
            caption="Recipients"
            cellRender={renderRecipientCount}
            width={180}
            allowSorting={false}
          />
          <Column dataField="categoryName" caption="Category" width={130} />
          <Column dataField="triggerSource" caption="Source" width={110} />
          <Column dataField="createdAt" caption="Created" cellRender={renderDateTime} width={160} sortOrder="desc" />
          <Column caption="" cellRender={renderActions} width={50} allowSorting={false} />
        </DataGrid>
      </div>

      {/* Detail Panel — uses global SlidePanel (portal to body, below header) */}
      <SlidePanel open={panelOpen} onClose={handleClosePanel} title="Notification Details" width={720}>
        {selectedNotification && (
          <div className="nh-panel-body">
            {/* Title & Badges */}
            <div className="nh-panel-section">
              <h4 className="nh-panel-title">{selectedNotification.title}</h4>
              <div className="nh-panel-badges">
                {renderStatusBadge({ value: selectedNotification.status })}
                {renderTypeBadge({ value: selectedNotification.type })}
                {renderPriorityBadge({ value: selectedNotification.priority })}
              </div>
            </div>

            {/* Meta Info */}
            <div className="nh-panel-section nh-panel-meta">
              <div className="nh-meta-row">
                <span className="nh-meta-label">
                  <i className="fa-light fa-calendar"></i> Created
                </span>
                <span className="nh-meta-value">{formatDateTime(selectedNotification.createdAt)}</span>
              </div>
              {selectedNotification.sentAt && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-paper-plane"></i> Sent
                  </span>
                  <span className="nh-meta-value">{formatDateTime(selectedNotification.sentAt)}</span>
                </div>
              )}
              {selectedNotification.categoryName && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-tag"></i> Category
                  </span>
                  <span className="nh-meta-value">{selectedNotification.categoryName}</span>
                </div>
              )}
              {selectedNotification.policyName && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-shield"></i> Policy
                  </span>
                  <span className="nh-meta-value">{selectedNotification.policyName}</span>
                </div>
              )}
              {selectedNotification.triggerSource && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-bolt"></i> Source
                  </span>
                  <span className="nh-meta-value">{selectedNotification.triggerSource}</span>
                </div>
              )}
              {selectedNotification.siteName && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-location-dot"></i> Site
                  </span>
                  <span className="nh-meta-value">{selectedNotification.siteName}</span>
                </div>
              )}
              {selectedNotification.vehicleName && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-truck"></i> Vehicle
                  </span>
                  <span className="nh-meta-value">{selectedNotification.vehicleName}</span>
                </div>
              )}
              {selectedNotification.tankName && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-droplet"></i> Tank
                  </span>
                  <span className="nh-meta-value">{selectedNotification.tankName}</span>
                </div>
              )}
              {selectedNotification.sendAttempts > 0 && (
                <div className="nh-meta-row">
                  <span className="nh-meta-label">
                    <i className="fa-light fa-rotate"></i> Attempts
                  </span>
                  <span className="nh-meta-value">{selectedNotification.sendAttempts}</span>
                </div>
              )}
            </div>

            {/* Error message */}
            {selectedNotification.errorMessage && (
              <div className="nh-panel-section">
                <div className="m365-info-banner m365-info-banner--error">
                  <i className="fa-light fa-circle-exclamation m365-info-banner__icon"></i>
                  <div className="m365-info-banner__content">
                    <span className="m365-info-banner__text">{selectedNotification.errorMessage}</span>
                  </div>
                </div>
              </div>
            )}

            {/* Message content */}
            {selectedNotification.message && (
              <div className="nh-panel-section">
                <div className="nh-section-label">Message</div>
                <div className="nh-message-box">{selectedNotification.message}</div>
              </div>
            )}

            {isFileImportNotification(selectedNotification) && (
              <div className="nh-panel-section">
                <div className="nh-section-label">File Import Details</div>

                <div className="nh-import-card">
                  <div className="nh-import-card__section">
                    <div className="nh-import-card__title">File Summary</div>
                    <div className="nh-import-grid">
                      <div className="nh-import-cell">
                        <span className="nh-import-cell__label">File Name</span>
                        <span className="nh-import-cell__value">{selectedFileName}</span>
                      </div>
                      <div className="nh-import-cell">
                        <span className="nh-import-cell__label">Report ID</span>
                        <span className="nh-import-cell__value nh-import-cell__value--mono">{selectedReportId}</span>
                      </div>
                      <div className="nh-import-cell nh-import-cell--full">
                        <span className="nh-import-cell__label">File Path</span>
                        <span className="nh-import-cell__value nh-import-cell__value--wrap">{selectedFilePath}</span>
                      </div>
                      <div className="nh-import-cell">
                        <span className="nh-import-cell__label">Report Type</span>
                        <span className="nh-import-cell__value">{selectedReportType}</span>
                      </div>
                      <div className="nh-import-cell">
                        <span className="nh-import-cell__label">Detected Site</span>
                        <span className="nh-import-cell__value">{selectedDetectedSite}</span>
                      </div>
                      <div className="nh-import-cell">
                        <span className="nh-import-cell__label">Import Mode</span>
                        <span className="nh-import-cell__value">{selectedImportMode}</span>
                      </div>
                    </div>
                  </div>

                  {selectedImportCounts && (
                    <div className="nh-import-card__section">
                      <div className="nh-import-card__title">Import Counts</div>
                      <div className="nh-import-grid nh-import-grid--compact">
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Imported</span>
                          <span className="nh-import-cell__value">{selectedImportCounts.successCount}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Failed</span>
                          <span className="nh-import-cell__value">{selectedImportCounts.failedCount}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Skipped</span>
                          <span className="nh-import-cell__value">{selectedImportCounts.skippedCount}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Duplicates</span>
                          <span className="nh-import-cell__value">{selectedImportCounts.duplicateCount}</span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="nh-import-card__section">
                    <div className="nh-import-card__title">Latest Record In File</div>
                    {selectedLatestRecord ? (
                      <div className="nh-import-grid nh-import-grid--compact">
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Record Date</span>
                          <span className="nh-import-cell__value">{(() => {
                            const parsedDate = parseImportRecordDateTime(selectedLatestRecord.RecordDate || selectedLatestRecord.recordDate);
                            if (!parsedDate) return "—";

                            return parsedDate.toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            });
                          })()}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Vehicle</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.VehicleLabel || selectedLatestRecord.vehicleLabel || "—"}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Site</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.SiteLabel || selectedLatestRecord.siteLabel || "—"}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Shift</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.Shift || selectedLatestRecord.shift || "—"}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Employee</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.EmployeeName || selectedLatestRecord.employeeName || "—"}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Total Fuel</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.TotalFuel ?? selectedLatestRecord.totalFuel ?? "—"}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Total Distance</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.TotalDistance ?? selectedLatestRecord.totalDistance ?? "—"}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Engine Hours</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.EngineHours ?? selectedLatestRecord.engineHours ?? "—"}</span>
                        </div>
                        <div className="nh-import-cell">
                          <span className="nh-import-cell__label">Fuel Efficiency</span>
                          <span className="nh-import-cell__value">{selectedLatestRecord.FuelEfficiency ?? selectedLatestRecord.fuelEfficiency ?? "—"}</span>
                        </div>
                      </div>
                    ) : (
                      <div className="nh-message-box">No latest record snapshot is available for this notification.</div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* JSON Metadata (Data field) */}
            {selectedNotification.data && (
              <div className="nh-panel-section">
                <div className="nh-section-label">Event Data</div>
                <div className="nh-message-box nh-json-data">
                  {(() => {
                    try {
                      return JSON.stringify(JSON.parse(selectedNotification.data), null, 2);
                    } catch {
                      return selectedNotification.data;
                    }
                  })()}
                </div>
              </div>
            )}

            {/* Recipients */}
            {selectedNotification.recipients && selectedNotification.recipients.length > 0 && (
              <div className="nh-panel-section">
                <div className="nh-section-label">
                  Recipients
                  <span className="m365-page-header__count">{selectedNotification.recipients.length}</span>
                </div>
                <div className="nh-recipient-list">
                  {selectedNotification.recipients.map((r, idx) => (
                    <div key={idx} className="nh-recipient-item">
                      <div className="nh-recipient-item__info">
                        <i className="fa-light fa-user"></i>
                        <span className="nh-recipient-item__name">{r.userName || r.email || r.userId || "Unknown"}</span>
                        {r.email && r.userName && (
                          <span className="nh-recipient-item__email">{r.email}</span>
                        )}
                      </div>
                      <div className="nh-recipient-item__status">
                        {r.deliveryMethod && (
                          <span className="m365-badge m365-badge--neutral">{r.deliveryMethod}</span>
                        )}
                        {r.deliveryStatus && (
                          <span className={`m365-badge ${r.deliveryStatus.toLowerCase() === "delivered" ? "m365-badge--success" :
                            r.deliveryStatus.toLowerCase() === "failed" ? "m365-badge--error" :
                              r.deliveryStatus.toLowerCase() === "sent" ? "m365-badge--primary" :
                                "m365-badge--neutral"
                            }`}>
                            {r.deliveryStatus}
                          </span>
                        )}
                        {r.isRead && <span className="m365-badge m365-badge--success">Read</span>}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </SlidePanel>
    </div>
  );
};

export default NotificationHistory;
