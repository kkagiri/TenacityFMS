import React, { useState, useEffect, useCallback } from "react";
import { Popup } from "devextreme-react/popup";
import { Scheduler, Resource } from "devextreme-react/scheduler";
import { LoadPanel } from "devextreme-react/load-panel";
import { SelectBox } from "devextreme-react/select-box";
import notify from "devextreme/ui/notify";
import {
  getImportCalendar,
  getImportSummary,
  getMonthRange,
} from "../../../api/fuelImportApi";
import "./ImportCalendarPopup.scss";

// Status resources for color coding
const statusResources = [
  {
    text: "Success",
    id: "Success",
    color: "#007bff", // Blue for imported/success
  },
  {
    text: "Failed",
    id: "Failed",
    color: "#dc3545", // Red for failed
  },
  {
    text: "Partial",
    id: "Partial",
    color: "#ffc107", // Yellow for partial
  },
  {
    text: "Missing",
    id: "Missing",
    color: "#ffc107", // Yellow for missing
  },
];

const ImportCalendarPopup = ({ visible, onHiding, sites = [] }) => {
  const [calendarData, setCalendarData] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [statusFilter, setStatusFilter] = useState("all"); // all, imported, missing

  // Fetch calendar data
  const fetchCalendarData = useCallback(async () => {
    setLoading(true);
    try {
      // Ensure currentDate is valid before proceeding
      const validDate = currentDate instanceof Date && !isNaN(currentDate.getTime())
        ? currentDate
        : new Date();

      const dateRange = getMonthRange(validDate);

      // Validate date range before making API call
      if (!dateRange.startDate || !dateRange.endDate ||
          dateRange.startDate.includes('NaN') || dateRange.endDate.includes('NaN')) {
        console.error('Invalid date range:', dateRange);
        notify("Invalid date range", "error", 3000);
        setLoading(false);
        return;
      }

      const response = await getImportCalendar(
        dateRange.startDate,
        dateRange.endDate,
        selectedSiteId
      );

      if (response.isSuccess) {
        console.log('Raw API response:', response);

        // Ensure we have valid data array
        const dataArray = Array.isArray(response.data) ? response.data : [];
        console.log('Data array length:', dataArray.length);

        if (dataArray.length === 0) {
          console.warn('No calendar data returned from API');
          setCalendarData([]);
          setSummary(null);
          notify("No import data found for the selected period", "warning", 3000);
          return;
        }

        // Transform data for Scheduler with safety checks
        const schedulerData = dataArray
          .map((item, index) => {
            try {
              // Validate required fields
              if (!item || !item.date) {
                console.warn(`Invalid item at index ${index}:`, item);
                return null;
              }

              const transformedItem = {
                text: item.siteName || "Unknown",
                startDate: new Date(item.date),
                endDate: new Date(item.date),
                allDay: true,
                description: `${item.totalRecordCount || 0} records imported`,
                siteId: item.siteId || 0,
                siteName: item.siteName || "Unknown",
                statusId: item.status || "Unknown", // Use statusId for Resource binding
                status: item.status || "Unknown",
                hasDayShift: Boolean(item.hasDayShift),
                hasNightShift: Boolean(item.hasNightShift),
                dayShiftRecordCount: item.dayShiftRecordCount || 0,
                nightShiftRecordCount: item.nightShiftRecordCount || 0,
                totalRecordCount: item.totalRecordCount || 0,
                lastImportedBy: item.lastImportedBy || null,
                lastImportTimestamp: item.lastImportTimestamp || null,
              };
              return transformedItem;
            } catch (err) {
              console.error(`Error transforming item at index ${index}:`, item, err);
              return null;
            }
          })
          .filter(item => item !== null); // Remove any items that failed transformation

        console.log('Transformed scheduler data count:', schedulerData.length);
        console.log('Sample transformed item:', schedulerData[0]);
        setCalendarData(schedulerData);

        // Fetch summary
        const summaryResponse = await getImportSummary(
          dateRange.startDate,
          dateRange.endDate,
          selectedSiteId
        );

        if (summaryResponse.isSuccess) {
          setSummary(summaryResponse.data);
        }
      } else {
        notify(response.message || "Failed to fetch calendar data", "error", 3000);
      }
    } catch (error) {
      console.error("Error fetching calendar data:", error);
      notify("Error loading calendar data", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [currentDate, selectedSiteId]);

  // Fetch data when component mounts or dependencies change
  useEffect(() => {
    if (visible) {
      fetchCalendarData();
    }
  }, [visible, fetchCalendarData]);

  // Handle date navigation
  const onCurrentDateChange = (e) => {
    // Ensure we have a valid date before setting state
    const newDate = e.value || e;
    if (newDate && !isNaN(new Date(newDate).getTime())) {
      setCurrentDate(new Date(newDate));
    }
  };

  // Handle site filter change
  const onSiteChange = (e) => {
    setSelectedSiteId(e.value);
  };

  // Handle status filter change
  const onStatusFilterChange = (e) => {
    setStatusFilter(e.value);
  };

  // Filter calendar data based on status filter
  const getFilteredCalendarData = () => {
    if (statusFilter === "all") {
      return calendarData;
    } else if (statusFilter === "imported") {
      return calendarData.filter(item => item.status !== "Missing");
    } else if (statusFilter === "missing") {
      return calendarData.filter(item => item.status === "Missing");
    }
    return calendarData;
  };

  // Custom appointment template
  const AppointmentTemplate = (data) => {
    // DevExtreme passes data in data.data.appointmentData structure
    const appointmentData = data?.data?.appointmentData || data?.appointmentData || data?.data || data;

    // Safety check - if no data, return null
    if (!appointmentData) {
      return <div className="custom-appointment">No data</div>;
    }

    const status = appointmentData.status || "Unknown";
    const siteName = appointmentData.siteName || appointmentData.text || "Unknown Site";

    const statusIcon =
      status === "Success"
        ? "fa-light fa-check-circle"
        : status === "Failed"
        ? "fa-light fa-exclamation-circle"
        : status === "Partial"
        ? "fa-light fa-info-circle"
        : "fa-light fa-times-circle";

    return (
      <div className="custom-appointment tw-p-2">
        <div className="tw-flex tw-items-center tw-justify-between">
          <span className="tw-font-semibold tw-text-white">{siteName}</span>
          <i className={`${statusIcon} tw-ml-2 tw-text-white`}></i>
        </div>
        <div className="tw-text-xs tw-mt-1 tw-text-white">
          {status === "Missing" ? (
            <span>No data</span>
          ) : (
            <>
              <div>
                {appointmentData.hasDayShift && (
                  <span>
                    Day: {appointmentData.dayShiftRecordCount || 0} |{" "}
                  </span>
                )}
                {appointmentData.hasNightShift && (
                  <span>Night: {appointmentData.nightShiftRecordCount || 0}</span>
                )}
              </div>
              <div className="tw-mt-1">Total: {appointmentData.totalRecordCount || 0}</div>
            </>
          )}
        </div>
      </div>
    );
  };

  // Custom appointment tooltip
  const AppointmentTooltipTemplate = (data) => {
    // DevExtreme passes data in data.data.appointmentData structure
    const appointmentData = data?.data?.appointmentData || data?.appointmentData || data?.data || data;

    // Safety check - if no data, return null
    if (!appointmentData) {
      return <div className="tw-p-4">No data available</div>;
    }

    const status = appointmentData.status || "Unknown";
    const siteName = appointmentData.siteName || appointmentData.text || "Unknown Site";

    return (
      <div className="tw-p-4">
        <h4 className="tw-font-bold tw-mb-2">{siteName}</h4>
        <div className="tw-text-sm">
          <div className="tw-mb-1">
            <strong>Date:</strong>{" "}
            {appointmentData.startDate
              ? new Date(appointmentData.startDate).toLocaleDateString()
              : "N/A"}
          </div>
          <div className="tw-mb-1">
            <strong>Status:</strong>{" "}
            <span
              className={`tw-px-2 tw-py-1 tw-rounded tw-text-white ${
                status === "Success"
                  ? "tw-bg-blue-500"
                  : status === "Failed"
                  ? "tw-bg-red-500"
                  : status === "Partial"
                  ? "tw-bg-yellow-500"
                  : "tw-bg-yellow-500"
              }`}
            >
              {status}
            </span>
          </div>
          {status !== "Missing" && (
            <>
              {appointmentData.hasDayShift && (
                <div className="tw-mb-1">
                  <strong>Day Shift:</strong> {appointmentData.dayShiftRecordCount || 0}{" "}
                  records
                </div>
              )}
              {appointmentData.hasNightShift && (
                <div className="tw-mb-1">
                  <strong>Night Shift:</strong>{" "}
                  {appointmentData.nightShiftRecordCount || 0} records
                </div>
              )}
              <div className="tw-mb-1">
                <strong>Total Records:</strong> {appointmentData.totalRecordCount || 0}
              </div>
              {appointmentData.lastImportedBy && (
                <div className="tw-mb-1">
                  <strong>Last Imported By:</strong> {appointmentData.lastImportedBy}
                </div>
              )}
              {appointmentData.lastImportTimestamp && (
                <div className="tw-mb-1">
                  <strong>Last Import:</strong>{" "}
                  {new Date(appointmentData.lastImportTimestamp).toLocaleString()}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    );
  };

  return (
    <Popup
      visible={visible}
      onHiding={onHiding}
      dragEnabled={false}
      showTitle={true}
      title="Fuel Import Calendar"
      showCloseButton={true}
      width="90%"
      height="90%"
      className="import-calendar-popup"
    >
      <div className="tw-h-full tw-flex tw-flex-col">
        {/* Filters */}
        <div className="tw-mb-4 tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-flex-shrink-0">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Filter by Site</label>
            <SelectBox
              dataSource={[{ id: null, name: "All Sites" }, ...sites]}
              displayExpr="name"
              valueExpr="id"
              value={selectedSiteId}
              onValueChanged={onSiteChange}
              placeholder="All Sites"
              showClearButton={true}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-mb-1">Filter by Status</label>
            <SelectBox
              dataSource={[
                { id: "all", name: "All Data" },
                { id: "imported", name: "Imported Only" },
                { id: "missing", name: "Missing Only" }
              ]}
              displayExpr="name"
              valueExpr="id"
              value={statusFilter}
              onValueChanged={onStatusFilterChange}
              placeholder="All Data"
            />
          </div>
          <div className="tw-flex tw-items-end">
            <button
              className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded hover:tw-bg-blue-600 tw-w-full tw-border-0 tw-shadow-none"
              onClick={fetchCalendarData}
            >
              <i className="fa-light fa-refresh tw-mr-2"></i>
              Refresh
            </button>
          </div>
        </div>

        {/* Calendar/Scheduler */}
        <div className="tw-relative tw-mb-4 tw-flex-shrink-0" style={{ height: '450px' }}>
          <LoadPanel visible={loading} />
          <Scheduler
            dataSource={getFilteredCalendarData()}
            views={[
              { type: "month", name: "Month", maxAppointmentsPerCell: 3 },
              { type: "week", name: "Week" },
              { type: "day", name: "Day" },
            ]}
            defaultCurrentView="month"
            currentDate={currentDate}
            onCurrentDateChange={onCurrentDateChange}
            height="450px"
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

        {/* Data Summary Section */}
        <div className="tw-border-t tw-pt-4 tw-flex-1 tw-overflow-y-auto">
          <div className="tw-flex tw-justify-between tw-items-center tw-mb-3">
            <h3 className="tw-text-lg tw-font-bold tw-text-gray-800">
              <i className="fa-light fa-list tw-mr-2"></i>
              Import Details
            </h3>
            <div className="tw-text-sm tw-text-gray-600">
              Showing {getFilteredCalendarData().length} of {calendarData.length} records
            </div>
          </div>

          {/* Summary Stats Row */}
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-3 tw-mb-4">
            <div className="tw-bg-gray-50 tw-p-3 tw-rounded-lg tw-border tw-border-gray-200">
              <div className="tw-text-sm tw-text-gray-600">Total Imports</div>
              <div className="tw-text-xl tw-font-bold tw-text-gray-700">
                {summary?.totalImports || 0}
              </div>
            </div>
            <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-border tw-border-blue-200">
              <div className="tw-text-sm tw-text-gray-600">Successful</div>
              <div className="tw-text-xl tw-font-bold tw-text-blue-600">
                {summary?.successfulImports || 0}
              </div>
            </div>
            <div className="tw-bg-red-50 tw-p-3 tw-rounded-lg tw-border tw-border-red-200">
              <div className="tw-text-sm tw-text-gray-600">Failed</div>
              <div className="tw-text-xl tw-font-bold tw-text-red-600">
                {summary?.failedImports || 0}
              </div>
            </div>
            <div className="tw-bg-yellow-50 tw-p-3 tw-rounded-lg tw-border tw-border-yellow-200">
              <div className="tw-text-sm tw-text-gray-600">Missing</div>
              <div className="tw-text-xl tw-font-bold tw-text-yellow-600">
                {summary?.missingSites || 0}
              </div>
            </div>
          </div>

          {/* Missing Sites List */}
          {summary && summary.missingSiteDetails && summary.missingSiteDetails.length > 0 && (
            <div className="tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200 tw-overflow-hidden">
              <div className="tw-bg-yellow-100 tw-p-3 tw-border-b tw-border-yellow-200">
                <h4 className="tw-font-bold tw-text-yellow-800 tw-flex tw-items-center tw-justify-between">
                  <span>
                    <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                    Missing Import Data
                  </span>
                  <span className="tw-text-sm tw-font-normal">
                    {summary.missingSiteDetails.length} records
                  </span>
                </h4>
              </div>
              <div className="tw-p-4 tw-max-h-64 tw-overflow-y-auto">
                <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-2">
                  {summary.missingSiteDetails.slice(0, 50).map((item, index) => (
                    <div
                      key={index}
                      className="tw-text-sm tw-bg-white tw-p-3 tw-rounded tw-border tw-border-yellow-200 tw-flex tw-justify-between tw-items-center hover:tw-bg-yellow-50 tw-transition-colors"
                    >
                      <div>
                        <div className="tw-font-semibold tw-text-gray-800">{item.siteName}</div>
                        <div className="tw-text-xs tw-text-gray-600">
                          {new Date(item.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </div>
                      </div>
                      <i className="fa-light fa-calendar-times tw-text-yellow-600"></i>
                    </div>
                  ))}
                </div>
                {summary.missingSiteDetails.length > 50 && (
                  <div className="tw-text-center tw-mt-3 tw-text-sm tw-text-gray-600">
                    ... and {summary.missingSiteDetails.length - 50} more missing records
                  </div>
                )}
              </div>
            </div>
          )}

          {/* No Missing Data Message */}
          {summary && (!summary.missingSiteDetails || summary.missingSiteDetails.length === 0) && (
            <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200 tw-text-center">
              <i className="fa-light fa-check-circle tw-text-green-600 tw-text-2xl tw-mb-2"></i>
              <div className="tw-text-green-800 tw-font-semibold">All sites have import data!</div>
              <div className="tw-text-sm tw-text-green-600">No missing imports for the selected period</div>
            </div>
          )}
        </div>
      </div>
    </Popup>
  );
};

export default ImportCalendarPopup;
