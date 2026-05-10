/**
 * File: PTSOfflineReport.js
 * Purpose: Display historical offline report for PTS devices with date range selection
 * Dependencies: React, DevExtreme DataGrid, DateBox, axiosInstance
 * Last Modified: 2026-01-17
 *
 * Key Components:
 * - PTSOfflineReport: Fetches historical offline data and renders summary table
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  ColumnChooser,
  Export,
  LoadPanel,
  Summary,
  TotalItem,
  MasterDetail,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";
import { DateBox } from "devextreme-react/date-box";
import { SelectBox } from "devextreme-react/select-box";
import { NumberBox } from "devextreme-react/number-box";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import "./PTSOfflineReport.scss";

const PTSOfflineReport = () => {
  // Default to last 7 days
  const getDefaultStartDate = () => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    date.setHours(0, 0, 0, 0);
    return date;
  };

  const getDefaultEndDate = () => {
    const date = new Date();
    date.setHours(23, 59, 59, 999);
    return date;
  };

  const [isLoading, setIsLoading] = useState(false);
  const [startDate, setStartDate] = useState(getDefaultStartDate());
  const [endDate, setEndDate] = useState(getDefaultEndDate());
  const [offlineData, setOfflineData] = useState([]);
  const [lastRefreshAt, setLastRefreshAt] = useState(null);
  const [viewMode, setViewMode] = useState("daily"); // 'daily' or 'summary'
  const [devices, setDevices] = useState([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState(null);
  const [minThresholdSeconds, setMinThresholdSeconds] = useState(60); // Default 60 seconds (1 minute)

  // Fetch device list for filter dropdown
  const fetchDevices = useCallback(async () => {
    try {
      const response = await axiosInstance.get("/PTSDevice");
      const devicesPayload = Array.isArray(response.data)
        ? response.data
        : response.data?.data || [];
      setDevices(devicesPayload);
    } catch (error) {
      console.error("Failed to fetch devices:", error);
    }
  }, []);

  // Fetch historical offline report
  const fetchOfflineReport = useCallback(async () => {
    if (!startDate || !endDate) {
      notify({ message: "Please select date range", type: "warning" }, { position: "top center" });
      return;
    }

    if (startDate > endDate) {
      notify({ message: "Start date must be before end date", type: "warning" }, { position: "top center" });
      return;
    }

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
      });

      if (selectedDeviceId) {
        params.append("deviceId", selectedDeviceId);
      }

      if (minThresholdSeconds && minThresholdSeconds > 0) {
        params.append("minThresholdSeconds", minThresholdSeconds.toString());
      }

      const response = await axiosInstance.get(`/PTSDevice/offline-report?${params.toString()}`);

      const payload = response.data?.data || response.data || [];
      setOfflineData(Array.isArray(payload) ? payload : []);
      setLastRefreshAt(new Date());

      if (payload.length === 0) {
        notify({ message: "No offline events found for the selected period", type: "info" }, { position: "top center" });
      }
    } catch (error) {
      console.error("Failed to fetch offline report:", error);
      notify(
        { message: "Failed to load offline report. Please try again.", type: "error" },
        { position: "top center" }
      );
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedDeviceId, minThresholdSeconds]);

  useEffect(() => {
    fetchDevices();
  }, [fetchDevices]);

  // Auto-fetch on initial load
  useEffect(() => {
    fetchOfflineReport();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Format duration from seconds
  const formatDuration = (seconds) => {
    if (!seconds || seconds <= 0) return "0m";

    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h ${minutes}m`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  };

  // Format date for display
  const formatDate = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleDateString();
  };

  // Format datetime for display
  const formatDateTime = (value) => {
    if (!value) return "N/A";
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return "N/A";
    return parsed.toLocaleString();
  };

  // Aggregate data by device for summary view
  const summaryData = useMemo(() => {
    if (viewMode !== "summary") return [];

    const deviceMap = new Map();
    offlineData.forEach((row) => {
      const key = row.deviceId;
      if (!deviceMap.has(key)) {
        deviceMap.set(key, {
          deviceId: row.deviceId,
          deviceName: row.deviceName || "Unknown",
          siteName: row.siteName || "N/A",
          totalOfflineCount: 0,
          totalOfflineSeconds: 0,
          daysAffected: new Set(),
        });
      }
      const entry = deviceMap.get(key);
      entry.totalOfflineCount += row.offlineCount || 0;
      entry.totalOfflineSeconds += row.totalOfflineSeconds || 0;
      entry.daysAffected.add(formatDate(row.date));
    });

    return Array.from(deviceMap.values()).map((entry) => ({
      ...entry,
      daysAffected: entry.daysAffected.size,
    }));
  }, [offlineData, viewMode]);

  const gridData = useMemo(() => {
    if (viewMode === "daily") {
      // Add a unique key combining deviceId and date for DataGrid
      return offlineData.map((item, index) => ({
        ...item,
        _rowKey: `${item.deviceId}_${item.date}_${index}`,
      }));
    }
    return summaryData;
  }, [viewMode, offlineData, summaryData]);

  // Device dropdown datasource
  const deviceOptions = useMemo(() => {
    return [
      { ptsid: null, displayName: "All Devices" },
      ...devices.map((d) => ({
        ptsid: d.ptsid || d.id,
        displayName: `${d.ptsName || d.ptsid || d.id} ${d.siteName ? `(${d.siteName})` : ""}`,
      })),
    ];
  }, [devices]);

  // Quick date range presets
  const setDatePreset = (preset) => {
    const end = new Date();
    end.setHours(23, 59, 59, 999);
    const start = new Date();
    start.setHours(0, 0, 0, 0);

    switch (preset) {
      case "today":
        break;
      case "yesterday":
        start.setDate(start.getDate() - 1);
        end.setDate(end.getDate() - 1);
        break;
      case "last7days":
        start.setDate(start.getDate() - 7);
        break;
      case "last30days":
        start.setDate(start.getDate() - 30);
        break;
      case "thisMonth":
        start.setDate(1);
        break;
      default:
        break;
    }

    setStartDate(start);
    setEndDate(end);
  };

  // Master-detail template for daily view periods
  const renderDetailSection = ({ data }) => {
    // DevExtreme passes the row data in 'data' property
    const rowData = data?.data || data;
    const periods = rowData?.periods || [];

    console.log("Master-detail row data:", rowData); // Debug log

    if (periods.length === 0) {
      return (
        <div className="tw-p-4 tw-text-gray-500 tw-text-sm">
          No detailed offline periods available.
        </div>
      );
    }

    return (
      <div className="tw-p-4 tw-bg-gray-50">
        <h4 className="tw-font-semibold tw-text-gray-700 tw-mb-2">
          Offline Periods on {formatDate(rowData.date)}
        </h4>
        <table className="tw-w-full tw-text-sm tw-border-collapse">
          <thead>
            <tr className="tw-bg-gray-200">
              <th className="tw-p-2 tw-text-left tw-border">Start Time</th>
              <th className="tw-p-2 tw-text-left tw-border">End Time</th>
              <th className="tw-p-2 tw-text-left tw-border">Duration</th>
            </tr>
          </thead>
          <tbody>
            {periods.map((period, idx) => (
              <tr key={idx} className="tw-border-b hover:tw-bg-gray-100">
                <td className="tw-p-2 tw-border">{formatDateTime(period.startAt)}</td>
                <td className="tw-p-2 tw-border">
                  {period.endAt ? formatDateTime(period.endAt) : <span className="tw-text-orange-500">Still Offline</span>}
                </td>
                <td className="tw-p-2 tw-border tw-font-medium">{formatDuration(period.durationSeconds)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <div className="tw-mt-2 tw-text-xs tw-text-gray-500">
          Total: {periods.length} offline period(s)
        </div>
      </div>
    );
  };

  return (
    <div className="pts-offline-report">
      {/* Header */}
      <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-center lg:tw-justify-between tw-gap-3 tw-mb-4">
        <div>
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-plug-circle-xmark tw-text-red-500"></i>
            PTS Offline Report
          </h2>
          <p className="tw-text-sm tw-text-gray-500">
            Historical report of PTS device offline events with duration tracking.
          </p>
        </div>
        <div className="tw-text-xs tw-text-gray-500">
          Last refreshed: {lastRefreshAt ? lastRefreshAt.toLocaleString() : "-"}
        </div>
      </div>

      {/* Filters Section */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-mb-4">
        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-items-end">
          {/* Quick Date Presets */}
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <Button text="Today" stylingMode="outlined" onClick={() => setDatePreset("today")} />
            <Button text="Yesterday" stylingMode="outlined" onClick={() => setDatePreset("yesterday")} />
            <Button text="Last 7 Days" stylingMode="outlined" onClick={() => setDatePreset("last7days")} />
            <Button text="Last 30 Days" stylingMode="outlined" onClick={() => setDatePreset("last30days")} />
            <Button text="This Month" stylingMode="outlined" onClick={() => setDatePreset("thisMonth")} />
          </div>

          <div className="tw-flex-grow"></div>

          {/* View Mode Toggle */}
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-text-sm tw-text-gray-600">View:</span>
            <SelectBox
              items={[
                { value: "daily", text: "Daily Breakdown" },
                { value: "summary", text: "Device Summary" },
              ]}
              value={viewMode}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => setViewMode(e.value)}
              width={160}
            />
          </div>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-4 tw-items-end tw-mt-4">
          {/* Start Date */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Start Date
            </label>
            <DateBox
              value={startDate}
              onValueChanged={(e) => setStartDate(e.value)}
              type="date"
              displayFormat="yyyy-MM-dd"
              width={160}
            />
          </div>

          {/* End Date */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              End Date
            </label>
            <DateBox
              value={endDate}
              onValueChanged={(e) => setEndDate(e.value)}
              type="date"
              displayFormat="yyyy-MM-dd"
              width={160}
            />
          </div>

          {/* Device Filter */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Device
            </label>
            <SelectBox
              dataSource={deviceOptions}
              value={selectedDeviceId}
              valueExpr="ptsid"
              displayExpr="displayName"
              onValueChanged={(e) => setSelectedDeviceId(e.value)}
              placeholder="All Devices"
              showClearButton={true}
              width={220}
            />
          </div>

          {/* Minimum Offline Threshold */}
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Min Offline (seconds)
            </label>
            <NumberBox
              value={minThresholdSeconds}
              onValueChanged={(e) => setMinThresholdSeconds(e.value)}
              min={0}
              max={86400}
              showSpinButtons={true}
              width={140}
              hint="Minimum offline duration to include in report"
            />
          </div>

          {/* Fetch Button */}
          <Button
            text="Generate Report"
            icon="find"
            type="default"
            onClick={fetchOfflineReport}
            disabled={isLoading}
          />

          {/* Refresh Button */}
          <Button
            icon="refresh"
            hint="Refresh"
            onClick={fetchOfflineReport}
            disabled={isLoading}
          />
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
        {viewMode === "daily" ? (
          <DataGrid
            dataSource={gridData}
            keyExpr="_rowKey"
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            columnHidingEnabled={true}
            hoverStateEnabled={true}
            repaintChangesOnly={true}
            height="auto"
            width="100%"
          >
            <LoadPanel enabled={isLoading} />
            <Paging defaultPageSize={15} />
            <Pager
              showPageSizeSelector={true}
              allowedPageSizes={[10, 15, 25, 50]}
              showInfo={true}
            />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <ColumnChooser enabled={true} />
            <Export enabled={true} allowExportSelectedData={true} />
            <MasterDetail enabled={true} component={renderDetailSection} />

            <Column dataField="deviceId" caption="Device ID" width={130} />
            <Column dataField="deviceName" caption="Device Name" minWidth={180} />
            <Column dataField="siteName" caption="Site" minWidth={160} />
            <Column
              dataField="date"
              caption="Date"
              width={120}
              calculateCellValue={(row) => formatDate(row.date)}
              sortOrder="desc"
            />
            <Column
              caption="Offline Times"
              minWidth={220}
              cellRender={(cell) => {
                const periods = cell.data?.periods || [];
                if (periods.length === 0) return <span className="tw-text-gray-400">No data</span>;
                const firstPeriod = periods[0];
                const startTime = firstPeriod?.startAt ? new Date(firstPeriod.startAt).toLocaleTimeString() : "N/A";
                const endTime = firstPeriod?.endAt ? new Date(firstPeriod.endAt).toLocaleTimeString() : "Ongoing";
                if (periods.length === 1) {
                  return <span>{startTime} - {endTime}</span>;
                }
                return (
                  <span>
                    {startTime} - {endTime}
                    <span className="tw-text-gray-500 tw-ml-1">(+{periods.length - 1} more)</span>
                  </span>
                );
              }}
            />
            <Column
              dataField="offlineCount"
              caption="Offline Events"
              width={130}
              alignment="center"
              cellRender={(cell) => (
                <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-sm ${
                  cell.value > 5 ? "tw-bg-red-100 tw-text-red-700" :
                  cell.value > 2 ? "tw-bg-yellow-100 tw-text-yellow-700" :
                  "tw-bg-green-100 tw-text-green-700"
                }`}>
                  {cell.value}
                </span>
              )}
            />
            <Column
              dataField="totalOfflineSeconds"
              caption="Total Offline Duration"
              minWidth={160}
              calculateCellValue={(row) => formatDuration(row.totalOfflineSeconds)}
            />

            <Summary>
              <TotalItem column="offlineCount" summaryType="sum" displayFormat="Total: {0}" />
            </Summary>
          </DataGrid>
        ) : (
          <DataGrid
            dataSource={gridData}
            keyExpr="deviceId"
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            columnHidingEnabled={true}
            hoverStateEnabled={true}
            repaintChangesOnly={true}
            height="auto"
            width="100%"
          >
            <LoadPanel enabled={isLoading} />
            <Paging defaultPageSize={15} />
            <Pager
              showPageSizeSelector={true}
              allowedPageSizes={[10, 15, 25, 50]}
              showInfo={true}
            />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <ColumnChooser enabled={true} />
            <Export enabled={true} allowExportSelectedData={true} />

            <Column dataField="deviceId" caption="Device ID" width={130} />
            <Column dataField="deviceName" caption="Device Name" minWidth={180} />
            <Column dataField="siteName" caption="Site" minWidth={160} />
            <Column
              dataField="totalOfflineCount"
              caption="Total Offline Events"
              width={160}
              alignment="center"
              cellRender={(cell) => (
                <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-sm tw-font-semibold ${
                  cell.value > 20 ? "tw-bg-red-100 tw-text-red-700" :
                  cell.value > 10 ? "tw-bg-yellow-100 tw-text-yellow-700" :
                  "tw-bg-green-100 tw-text-green-700"
                }`}>
                  {cell.value}
                </span>
              )}
            />
            <Column
              dataField="totalOfflineSeconds"
              caption="Total Offline Duration"
              minWidth={160}
              calculateCellValue={(row) => formatDuration(row.totalOfflineSeconds)}
            />
            <Column
              dataField="daysAffected"
              caption="Days Affected"
              width={130}
              alignment="center"
            />

            <Summary>
              <TotalItem column="totalOfflineCount" summaryType="sum" displayFormat="Total Events: {0}" />
              <TotalItem column="daysAffected" summaryType="sum" displayFormat="Total Days: {0}" />
            </Summary>
          </DataGrid>
        )}
      </div>

      {/* Empty State */}
      {!isLoading && offlineData.length === 0 && (
        <div className="tw-mt-6 tw-text-center tw-text-sm tw-text-gray-500">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          No offline events found. Try adjusting the date range or device filter.
        </div>
      )}
    </div>
  );
};

export default PTSOfflineReport;
