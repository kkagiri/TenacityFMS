/**
 * File: LocationBypassHistoryView.js
 * Purpose: View component for displaying location bypass history with filtering
 * Dependencies: DevExtreme, geofenceService
 * Last Modified: 2026-01-19
 */

import React, { useState, useEffect, useCallback } from "react";
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  Scrolling,
  Selection,
} from "devextreme-react/data-grid";
import DateBox from "devextreme-react/date-box";
import SelectBox from "devextreme-react/select-box";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { getBypassHistory } from "../../../api/geofenceService";

import "./LocationBypassHistoryView.scss";

const LocationBypassHistoryView = ({ onClose }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [totalCount, setTotalCount] = useState(0);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Filters
  const [filters, setFilters] = useState({
    bypassType: null,
    isActive: null,
    startDate: null,
    endDate: null,
    enabledBy: "",
  });

  const bypassTypeOptions = [
    { value: null, text: "All Types" },
    { value: "All", text: "System-wide" },
    { value: "Vehicle", text: "Vehicle-specific" },
    { value: "User", text: "User-specific" },
  ];

  const statusOptions = [
    { value: null, text: "All Statuses" },
    { value: true, text: "Active" },
    { value: false, text: "Inactive/Expired/Cancelled" },
  ];

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        ...filters,
        pageNumber,
        pageSize,
      };

      const response = await getBypassHistory(params);

      if (response?.isSuccess && response?.data) {
        setData(response.data.items || []);
        setTotalCount(response.data.totalCount || 0);
      } else {
        notify(response?.message || "Failed to load bypass history", "error", 3000);
      }
    } catch (error) {
      console.error("Error loading bypass history:", error);
      notify("Failed to load bypass history", "error", 3000);
    } finally {
      setLoading(false);
    }
  }, [filters, pageNumber, pageSize]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleFilterChange = (field, value) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
    setPageNumber(1); // Reset to first page on filter change
  };

  const handleResetFilters = () => {
    setFilters({
      bypassType: null,
      isActive: null,
      startDate: null,
      endDate: null,
      enabledBy: "",
    });
    setPageNumber(1);
  };

  const handlePageChanged = (e) => {
    if (e.fullName === "paging.pageIndex") {
      setPageNumber(e.value + 1);
    }
    if (e.fullName === "paging.pageSize") {
      setPageSize(e.value);
    }
  };

  const getStatusBadge = (status) => {
    const classes = {
      Active: "tw-bg-green-100 tw-text-green-800",
      Expired: "tw-bg-gray-100 tw-text-gray-800",
      Cancelled: "tw-bg-red-100 tw-text-red-800",
      Inactive: "tw-bg-yellow-100 tw-text-yellow-800",
    };
    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${classes[status] || "tw-bg-gray-100"}`}
      >
        {status}
      </span>
    );
  };

  const getBypassTypeBadge = (type) => {
    const classes = {
      All: "tw-bg-purple-100 tw-text-purple-800",
      Vehicle: "tw-bg-blue-100 tw-text-blue-800",
      User: "tw-bg-teal-100 tw-text-teal-800",
    };
    const labels = {
      All: "System-wide",
      Vehicle: "Vehicle",
      User: "User",
    };
    return (
      <span
        className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${classes[type] || "tw-bg-gray-100"}`}
      >
        {labels[type] || type}
      </span>
    );
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "-";
    // Server returns UTC, convert to local time
    const utcDate = new Date(dateStr);
    return utcDate.toLocaleString();
  };

  // Convert UTC date string to local datetime string for grid display
  const formatDateTimeForGrid = (dateStr) => {
    if (!dateStr) return "-";
    const utcDate = new Date(dateStr);
    // Format: yyyy-MM-dd HH:mm:ss in local time
    const year = utcDate.getFullYear();
    const month = String(utcDate.getMonth() + 1).padStart(2, '0');
    const day = String(utcDate.getDate()).padStart(2, '0');
    const hours = String(utcDate.getHours()).padStart(2, '0');
    const minutes = String(utcDate.getMinutes()).padStart(2, '0');
    const seconds = String(utcDate.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  const formatDuration = (minutes) => {
    if (!minutes && minutes !== 0) return "-";
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  return (
    <div className="tw-flex tw-flex-col tw-h-full">
      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <div>
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-clock-rotate-left tw-text-purple-600"></i>
            Location Bypass History
          </h2>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
            View all past and current location validation bypasses
          </p>
        </div>
        <div className="tw-flex tw-gap-2">
          <Button
            text="Refresh"
            icon="refresh"
            type="default"
            onClick={loadData}
            disabled={loading}
          />
          {onClose && (
            <Button
              text="Close"
              icon="close"
              type="normal"
              onClick={onClose}
            />
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-mb-4">
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-5 tw-gap-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Bypass Type
            </label>
            <SelectBox
              dataSource={bypassTypeOptions}
              valueExpr="value"
              displayExpr="text"
              value={filters.bypassType}
              onValueChanged={(e) => handleFilterChange("bypassType", e.value)}
              placeholder="All Types"
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Status
            </label>
            <SelectBox
              dataSource={statusOptions}
              valueExpr="value"
              displayExpr="text"
              value={filters.isActive}
              onValueChanged={(e) => handleFilterChange("isActive", e.value)}
              placeholder="All Statuses"
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Start Date
            </label>
            <DateBox
              type="datetime"
              value={filters.startDate}
              onValueChanged={(e) => handleFilterChange("startDate", e.value)}
              placeholder="From Date"
              showClearButton
              width="100%"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              End Date
            </label>
            <DateBox
              type="datetime"
              value={filters.endDate}
              onValueChanged={(e) => handleFilterChange("endDate", e.value)}
              placeholder="To Date"
              showClearButton
              width="100%"
            />
          </div>
          <div className="tw-flex tw-items-end">
            <Button
              text="Reset Filters"
              type="normal"
              onClick={handleResetFilters}
              width="100%"
            />
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <div className="tw-flex-1 tw-bg-white tw-rounded-lg tw-shadow tw-overflow-hidden">
        <DataGrid
          dataSource={data}
          showBorders={false}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          hoverStateEnabled={true}
          onOptionChanged={handlePageChanged}
          height="100%"
          noDataText={loading ? "Loading..." : "No bypass records found"}
        >
          <Scrolling mode="virtual" />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Selection mode="single" />

          <Column
            dataField="enabledAt"
            caption="Enabled At"
            width={160}
            sortOrder="desc"
            cellRender={(cellData) => formatDateTimeForGrid(cellData.value)}
          />
          <Column
            dataField="bypassType"
            caption="Type"
            width={120}
            cellRender={(cellData) => getBypassTypeBadge(cellData.value)}
          />
          <Column
            dataField="status"
            caption="Status"
            width={100}
            cellRender={(cellData) => getStatusBadge(cellData.value)}
          />
          <Column
            dataField="vehicleName"
            caption="Vehicle"
            width={150}
            cellRender={(cellData) =>
              cellData.data.bypassType === "Vehicle"
                ? cellData.value || cellData.data.vehicleHyoungNo || "-"
                : "-"
            }
          />
          <Column
            dataField="userName"
            caption="User"
            width={120}
            cellRender={(cellData) =>
              cellData.data.bypassType === "User"
                ? cellData.value || cellData.data.userId || "-"
                : "-"
            }
          />
          <Column
            dataField="durationMinutes"
            caption="Duration"
            width={100}
            cellRender={(cellData) => formatDuration(cellData.value)}
          />
          <Column
            dataField="expiresAt"
            caption="Expires At"
            width={160}
            cellRender={(cellData) =>
              cellData.value ? formatDateTimeForGrid(cellData.value) : "Permanent"
            }
          />
          <Column dataField="enabledBy" caption="Enabled By" width={120} />
          <Column dataField="reason" caption="Reason" minWidth={200} />
          <Column
            dataField="cancelledAt"
            caption="Cancelled At"
            width={160}
            cellRender={(cellData) =>
              cellData.value ? formatDateTimeForGrid(cellData.value) : "-"
            }
          />
          <Column dataField="cancelledBy" caption="Cancelled By" width={120} />

          <Paging
            defaultPageSize={50}
            pageSize={pageSize}
            pageIndex={pageNumber - 1}
          />
          <Pager
            showPageSizeSelector={true}
            allowedPageSizes={[25, 50, 100]}
            showInfo={true}
            infoText={`Page {0} of {1} (${totalCount} items)`}
          />
        </DataGrid>
      </div>

      {/* Loading overlay */}
      {loading && (
        <div className="tw-absolute tw-inset-0 tw-bg-black tw-bg-opacity-10 tw-flex tw-items-center tw-justify-center tw-z-10">
          <div className="tw-bg-white tw-rounded-lg tw-p-4 tw-shadow-lg tw-flex tw-items-center tw-gap-3">
            <LoadIndicator width="24px" height="24px" visible={true} />
            <span className="tw-text-gray-600">Loading...</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LocationBypassHistoryView;
