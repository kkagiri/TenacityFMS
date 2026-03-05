/**
 * File: ImportCalendarPopup.js
 * Purpose: Fuel Import Calendar panel — shows import history in a Scheduler view
 *          with summary stats and missing data details in SlidePanel (M365 Fluent design).
 * Dependencies: react, SlidePanel, DevExtreme Scheduler/LoadPanel, fuelImportApi
 * Last Modified: 2026-03-03
 */
import React, { useState, useEffect, useCallback } from "react";
import { Scheduler, Resource } from "devextreme-react/scheduler";
import { LoadPanel } from "devextreme-react/load-panel";
import notify from "devextreme/ui/notify";
import SlidePanel from "../../../components/ui/SlidePanel";
import {
  getImportCalendar,
  getImportSummary,
  getMonthRange,
} from "../../../api/fuelImportApi";
import "./ImportCalendarPopup.scss";

// Status resources for color coding
const statusResources = [
  { text: "Success", id: "Success", color: "#0078d4" },
  { text: "Failed", id: "Failed", color: "#d13438" },
  { text: "Partial", id: "Partial", color: "#ca5010" },
  { text: "Missing", id: "Missing", color: "#ca5010" },
];

const statusFilterOptions = [
  { id: "all", name: "All Data" },
  { id: "imported", name: "Imported Only" },
  { id: "missing", name: "Missing Only" },
];

const ImportCalendarPopup = ({ visible, onHiding, sites = [] }) => {
  const [calendarData, setCalendarData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("all");

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      const validDate =
        currentDate instanceof Date && !isNaN(currentDate.getTime())
          ? currentDate
          : new Date();

      const dateRange = getMonthRange(validDate);

      if (
        !dateRange.startDate ||
        !dateRange.endDate ||
        dateRange.startDate.includes("NaN") ||
        dateRange.endDate.includes("NaN")
      ) {
        console.error("Invalid date range:", dateRange);
        notify("Invalid date range", "error", 3000);
        setLoading(false);
        return;
      }

      // API layer already unwraps FMSResponse — returns the inner data directly
      const dataArray = await getImportCalendar(
        dateRange.startDate,
        dateRange.endDate,
        selectedSiteId
      );

      const items = Array.isArray(dataArray) ? dataArray : [];

      if (items.length === 0) {
        setCalendarData([]);
        setSummary(null);
        notify("No import data found for the selected period", "warning", 3000);
        return;
      }

      const schedulerData = items
        .map((item) => {
          try {
            if (!item || !item.date) return null;
            return {
              text: item.siteName || "Unknown",
              startDate: new Date(item.date),
              endDate: new Date(item.date),
              allDay: true,
              description: `${item.totalRecordCount || 0} records imported`,
              siteId: item.siteId || 0,
              siteName: item.siteName || "Unknown",
              statusId: item.status || "Unknown",
              status: item.status || "Unknown",
              hasDayShift: Boolean(item.hasDayShift),
              hasNightShift: Boolean(item.hasNightShift),
              dayShiftRecordCount: item.dayShiftRecordCount || 0,
              nightShiftRecordCount: item.nightShiftRecordCount || 0,
              totalRecordCount: item.totalRecordCount || 0,
              lastImportedBy: item.lastImportedBy || null,
              lastImportTimestamp: item.lastImportTimestamp || null,
            };
          } catch {
            return null;
          }
        })
        .filter(Boolean);

      setCalendarData(schedulerData);

      // Summary — also returns unwrapped data
      const summaryData = await getImportSummary(
        dateRange.startDate,
        dateRange.endDate,
        selectedSiteId
      );
      if (summaryData) {
        setSummary(summaryData);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      notify("Error loading calendar data", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedSiteId]);

  useEffect(() => {
    if (visible) fetchCalendarData();
  }, [visible, fetchCalendarData]);

  const onCurrentDateChange = (e) => {
    const newDate = e.value || e;
    if (newDate && !isNaN(new Date(newDate).getTime())) {
      setCurrentDate(new Date(newDate));
    }
  };

  const getFilteredCalendarData = () => {
    if (statusFilter === "imported")
      return calendarData.filter((i) => i.status !== "Missing");
    if (statusFilter === "missing")
      return calendarData.filter((i) => i.status === "Missing");
    return calendarData;
  };

  // ── Appointment templates ──
  const AppointmentTemplate = (data) => {
    const ad =
      data?.data?.appointmentData ||
      data?.appointmentData ||
      data?.data ||
      data;
    if (!ad) return <div className="custom-appointment">No data</div>;

    const statusIcon =
      ad.status === "Success"
        ? "fa-light fa-check-circle"
        : ad.status === "Failed"
          ? "fa-light fa-exclamation-circle"
          : ad.status === "Partial"
            ? "fa-light fa-info-circle"
            : "fa-light fa-times-circle";

    return (
      <div className="custom-appointment tw-p-2">
        <div className="tw-flex tw-items-center tw-justify-between">
          <span className="tw-font-semibold tw-text-white">
            {ad.siteName || ad.text}
          </span>
          <i className={`${statusIcon} tw-ml-2 tw-text-white`}></i>
        </div>
        <div className="tw-text-xs tw-mt-1 tw-text-white">
          {ad.status === "Missing" ? (
            <span>No data</span>
          ) : (
            <>
              <div>
                {ad.hasDayShift && (
                  <span>Day: {ad.dayShiftRecordCount || 0} | </span>
                )}
                {ad.hasNightShift && (
                  <span>Night: {ad.nightShiftRecordCount || 0}</span>
                )}
              </div>
              <div className="tw-mt-1">Total: {ad.totalRecordCount || 0}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  const AppointmentTooltipTemplate = (data) => {
    const ad =
      data?.data?.appointmentData ||
      data?.appointmentData ||
      data?.data ||
      data;
    if (!ad) return <div className="tw-p-4">No data available</div>;

    return (
      <div
        className="tw-p-4"
        style={{
          fontFamily: '"Segoe UI", -apple-system, system-ui, sans-serif',
        }}
      >
        <h4
          className="tw-font-bold tw-mb-2"
          style={{ color: "#201f1e" }}
        >
          {ad.siteName || ad.text}
        </h4>
        <div className="tw-text-sm" style={{ color: "#605e5c" }}>
          <div className="tw-mb-1">
            <strong>Date:</strong>{" "}
            {ad.startDate
              ? new Date(ad.startDate).toLocaleDateString()
              : "N/A"}
          </div>
          <div className="tw-mb-1">
            <strong>Status:</strong>{" "}
            <span
              className="tw-px-2 tw-py-0.5 tw-rounded tw-text-white tw-text-xs tw-font-medium"
              style={{
                background:
                  ad.status === "Success"
                    ? "#0078d4"
                    : ad.status === "Failed"
                      ? "#d13438"
                      : "#ca5010",
              }}
            >
              {ad.status}
            </span>
          </div>
          {ad.status !== "Missing" && (
            <>
              {ad.hasDayShift && (
                <div className="tw-mb-1">
                  <strong>Day Shift:</strong> {ad.dayShiftRecordCount || 0}{" "}
                  records
                </div>
              )}
              {ad.hasNightShift && (
                <div className="tw-mb-1">
                  <strong>Night Shift:</strong>{" "}
                  {ad.nightShiftRecordCount || 0} records
                </div>
              )}
              <div className="tw-mb-1">
                <strong>Total Records:</strong> {ad.totalRecordCount || 0}
              </div>
              {ad.lastImportedBy && (
                <div className="tw-mb-1">
                  <strong>Imported By:</strong> {ad.lastImportedBy}
                </div>
              )}
              {ad.lastImportTimestamp && (
                <div className="tw-mb-1">
                  <strong>Last Import:</strong>{" "}
                  {new Date(ad.lastImportTimestamp).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  // ── Render ──
  const filteredData = getFilteredCalendarData();

  return (
    <SlidePanel
      open={visible}
      onClose={onHiding}
      title="Import Calendar"
      width={1200}
    >
      <div
        className="import-calendar-popup tw-flex tw-flex-col tw-h-full"
        style={{
          fontFamily: '"Segoe UI", -apple-system, system-ui, sans-serif',
        }}
      >
        {/* ── Filters ── */}
        <div
          className="tw-flex tw-flex-wrap tw-items-end tw-gap-4 tw-px-6 tw-py-4"
          style={{ borderBottom: "1px solid #edebe9" }}
        >
          <div className="tw-flex tw-flex-col tw-gap-1">
            <label
              className="tw-text-xs tw-font-medium"
              style={{ color: "#605e5c" }}
            >
              Site
            </label>
            <select
              className="m365-select"
              value={selectedSiteId ?? ""}
              onChange={(e) => setSelectedSiteId(e.target.value || null)}
              style={{ minWidth: 160 }}
            >
              <option value="">All Sites</option>
              {sites.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="tw-flex tw-flex-col tw-gap-1">
            <label
              className="tw-text-xs tw-font-medium"
              style={{ color: "#605e5c" }}
            >
              Status
            </label>
            <select
              className="m365-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              style={{ minWidth: 140 }}
            >
              {statusFilterOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.name}
                </option>
              ))}
            </select>
          </div>

          <button
            className="tw-flex tw-items-center tw-gap-1.5 tw-border-0 tw-rounded tw-px-3 tw-cursor-pointer tw-text-xs tw-font-medium"
            style={{ height: 34, background: "#0078d4", color: "#fff" }}
            onClick={fetchCalendarData}
          >
            <i className="fa-light fa-refresh"></i>
            Refresh
          </button>
        </div>

        {/* ── Calendar ── */}
        <div
          className="tw-relative tw-px-6 tw-py-4 tw-flex-shrink-0"
          style={{ height: 520 }}
        >
          <LoadPanel visible={loading} />
          <Scheduler
            dataSource={filteredData}
            views={[
              {
                type: "month",
                name: "Month",
                maxAppointmentsPerCell: 3,
              },
              { type: "week", name: "Week" },
              { type: "day", name: "Day" },
            ]}
            defaultCurrentView="month"
            currentDate={currentDate}
            onCurrentDateChange={onCurrentDateChange}
            height="100%"
            startDayHour={0}
            endDayHour={24}
            showAllDayPanel={true}
            editing={false}
            appointmentComponent={AppointmentTemplate}
            appointmentTooltipComponent={AppointmentTooltipTemplate}
            cellDuration={60}
            firstDayOfWeek={0}
          >
            <Resource
              dataSource={statusResources}
              fieldExpr="statusId"
              label="Status"
              useColorAsDefault={true}
            />
          </Scheduler>
        </div>

        {/* ── Summary Section ── */}
        <div
          className="tw-px-6 tw-py-4 tw-flex-1 tw-overflow-y-auto"
          style={{ borderTop: "1px solid #edebe9" }}
        >
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
            <h4
              className="tw-m-0 tw-text-sm tw-font-semibold"
              style={{ color: "#201f1e" }}
            >
              <i className="fa-light fa-list tw-mr-2"></i>
              Import Details
            </h4>
            <span className="tw-text-xs" style={{ color: "#a19f9d" }}>
              {filteredData.length} of {calendarData.length} records
            </span>
          </div>

          {/* Stat cards */}
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-3 tw-mb-4">
            <StatCard
              label="Total Imports"
              value={summary?.totalImports || 0}
              bg="#faf9f8"
              border="#edebe9"
              fg="#201f1e"
            />
            <StatCard
              label="Successful"
              value={summary?.successfulImports || 0}
              bg="#deecf9"
              border="#b4d6fa"
              fg="#0078d4"
            />
            <StatCard
              label="Failed"
              value={summary?.failedImports || 0}
              bg="#fde7e9"
              border="#f5c6cb"
              fg="#d13438"
            />
            <StatCard
              label="Missing"
              value={summary?.missingSites || 0}
              bg="#fff4ce"
              border="#ffe8a1"
              fg="#ca5010"
            />
          </div>

          {/* Missing site details */}
          {summary?.missingSiteDetails?.length > 0 && (
            <div
              className="tw-rounded-lg tw-overflow-hidden tw-border"
              style={{ borderColor: "#ffe8a1" }}
            >
              <div
                className="tw-px-4 tw-py-2.5 tw-flex tw-items-center tw-justify-between"
                style={{
                  background: "#fff4ce",
                  borderBottom: "1px solid #ffe8a1",
                }}
              >
                <span
                  className="tw-text-xs tw-font-semibold"
                  style={{ color: "#ca5010" }}
                >
                  <i className="fa-light fa-exclamation-triangle tw-mr-1.5"></i>
                  Missing Import Data
                </span>
                <span className="tw-text-xs" style={{ color: "#a19f9d" }}>
                  {summary.missingSiteDetails.length} records
                </span>
              </div>
              <div
                className="tw-p-4 tw-max-h-64 tw-overflow-y-auto"
                style={{ background: "#fffdf6" }}
              >
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-2">
                  {summary.missingSiteDetails.slice(0, 50).map((item, idx) => (
                    <div
                      key={idx}
                      className="tw-flex tw-justify-between tw-items-center tw-px-3 tw-py-2 tw-rounded"
                      style={{ border: "1px solid #edebe9", background: "#fff" }}
                    >
                      <div>
                        <div
                          className="tw-text-xs tw-font-semibold"
                          style={{ color: "#201f1e" }}
                        >
                          {item.siteName}
                        </div>
                        <div
                          className="tw-text-xs"
                          style={{ color: "#a19f9d" }}
                        >
                          {new Date(item.date).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}
                        </div>
                      </div>
                      <i
                        className="fa-light fa-calendar-times"
                        style={{ color: "#ca5010" }}
                      ></i>
                    </div>
                  ))}
                </div>
                {summary.missingSiteDetails.length > 50 && (
                  <div
                    className="tw-text-center tw-mt-3 tw-text-xs"
                    style={{ color: "#a19f9d" }}
                  >
                    ...and {summary.missingSiteDetails.length - 50} more missing
                    records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* All good */}
          {summary &&
            (!summary.missingSiteDetails ||
              summary.missingSiteDetails.length === 0) && (
              <div
                className="tw-p-4 tw-rounded-lg tw-text-center tw-border"
                style={{ background: "#dff6dd", borderColor: "#a8e29f" }}
              >
                <i
                  className="fa-light fa-check-circle tw-text-2xl tw-mb-1"
                  style={{ color: "#107c10" }}
                ></i>
                <div
                  className="tw-text-sm tw-font-semibold"
                  style={{ color: "#107c10" }}
                >
                  All sites have import data!
                </div>
                <div className="tw-text-xs" style={{ color: "#605e5c" }}>
                  No missing imports for the selected period
                </div>
              </div>
            )}
        </div>
      </div>
    </SlidePanel>
  );
};

/** Small stat card */
const StatCard = ({ label, value, bg, border, fg }) => (
  <div
    className="tw-p-3 tw-rounded-lg tw-text-center"
    style={{ background: bg, border: `1px solid ${border}` }}
  >
    <div className="tw-text-xl tw-font-bold" style={{ color: fg }}>
      {value}
    </div>
    <div className="tw-text-xs" style={{ color: "#605e5c" }}>
      {label}
    </div>
  </div>
);

export default ImportCalendarPopup;
