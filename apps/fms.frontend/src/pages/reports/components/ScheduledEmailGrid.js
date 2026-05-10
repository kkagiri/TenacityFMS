/**
 * File: ScheduledEmailGrid.js
 * Purpose: Reusable grid for scheduled report email rows with status and action rendering.
 * Dependencies: react, devextreme-react/data-grid, devextreme-react/button
 * Last Modified: 2026-02-07
 *
 * Key Components:
 * - ScheduledEmailGrid: Displays schedule rows and emits adjust/recipient/cancel actions.
 */
import React, { useCallback } from "react";
import DataGrid, {
  Column,
  Paging,
  Pager,
  SearchPanel,
  FilterRow,
} from "devextreme-react/data-grid";
import { Button } from "devextreme-react/button";

const REPORT_TYPE_LABELS = {
  TransactionVolumeHistory: "Transaction Volume History",
  ConsumptionByRefill: "Consumption by Refills",
  VehicleConsumption: "Vehicle Consumption",
  PTSDeviceOffline: "PTS Device Offline",
};

const ScheduledEmailGrid = ({
  schedules,
  loading,
  statusClassByValue,
  formatLocalDateTime,
  onOpenAdjust,
  onOpenRecipients,
  onCancelSchedule,
  onDeleteSchedule,
}) => {
  const renderStatusCell = useCallback(
    (cellInfo) => {
      const statusValue = String(cellInfo.value || "pending").toLowerCase();
      const statusClass =
        statusClassByValue?.[statusValue] || "scheduled-emails__status--pending";
      return (
        <span className={`scheduled-emails__status ${statusClass}`}>
          {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
        </span>
      );
    },
    [statusClassByValue]
  );

  const renderRecipientsCell = useCallback((cellInfo) => {
    const schedule = cellInfo.data;
    const delivered = schedule.deliveredCount || 0;
    const failed = schedule.failedCount || 0;
    const pending = schedule.pendingCount || 0;

    return (
      <div className="tw-text-xs tw-leading-5">
        <div>
          Recipients: <strong>{schedule.recipientCount || 0}</strong>
        </div>
        <div>
          Delivered: <strong>{delivered}</strong> | Failed:{" "}
          <strong>{failed}</strong> | Pending: <strong>{pending}</strong>
        </div>
      </div>
    );
  }, []);

  const renderActionCell = useCallback(
    (cellInfo) => {
      const schedule = cellInfo.data;
      const isCancelled =
        String(schedule.status || "").toLowerCase() === "cancelled";

      return (
        <div className="scheduled-emails__actions">
          <Button
            text="Adjust"
            icon="fa-light fa-clock"
            stylingMode="text"
            onClick={() => onOpenAdjust(schedule)}
            disabled={isCancelled}
          />
          <Button
            text="Recipients"
            icon="fa-light fa-users"
            stylingMode="text"
            onClick={() => onOpenRecipients(schedule)}
          />
          <Button
            text="Cancel"
            icon="fa-light fa-ban"
            stylingMode="text"
            onClick={() => onCancelSchedule(schedule)}
            disabled={isCancelled}
          />
          {onDeleteSchedule && (
            <Button
              text="Delete"
              icon="fa-light fa-trash"
              stylingMode="text"
              onClick={() => onDeleteSchedule(schedule)}
              elementAttr={{ class: 'tw-text-red-500' }}
            />
          )}
        </div>
      );
    },
    [onCancelSchedule, onDeleteSchedule, onOpenAdjust, onOpenRecipients]
  );

  return (
    <DataGrid
      dataSource={schedules}
      keyExpr="id"
      showBorders={true}
      showRowLines={true}
      columnAutoWidth={true}
      repaintChangesOnly={true}
      loadPanel={{ enabled: loading }}
      className="scheduled-emails__grid"
    >
      <SearchPanel visible={true} placeholder="Search schedules..." width={260} />
      <FilterRow visible={true} />
      <Paging defaultPageSize={20} />
      <Pager
        visible={true}
        showPageSizeSelector={true}
        showInfo={true}
        showNavigationButtons={true}
        allowedPageSizes={[10, 20, 50, 100]}
      />

      <Column dataField="title" caption="Report" minWidth={220} />
      <Column
        dataField="reportType"
        caption="Report Type"
        width={220}
        customizeText={(e) => REPORT_TYPE_LABELS[e.value] || e.value || "-"}
      />
      <Column
        caption="Format"
        width={90}
        calculateCellValue={(row) => row.format || row.outputFormat || "-"}
      />
      <Column
        dataField="status"
        caption="Status"
        cellRender={renderStatusCell}
        width={130}
      />
      <Column
        caption="Next Run"
        width={190}
        calculateCellValue={(row) => {
          const val = row.nextRunAtUtc || row.scheduledAt;
          return val ? formatLocalDateTime(val) : "—";
        }}
      />
      <Column
        caption="Time"
        width={100}
        calculateCellValue={(row) => row.scheduleTimeOfDay || "—"}
      />
      <Column dataField="scheduleType" caption="Schedule" width={110} />
      <Column dataField="timeZone" caption="Time Zone" width={180} />
      <Column
        caption="Requested By"
        width={140}
        calculateCellValue={(row) => row.requestedBy || "—"}
      />
      <Column
        caption="Delivery"
        minWidth={220}
        cellRender={renderRecipientsCell}
        allowSorting={false}
      />
      <Column
        caption="Actions"
        minWidth={300}
        cellRender={renderActionCell}
        allowSorting={false}
        allowFiltering={false}
      />
    </DataGrid>
  );
};

export default ScheduledEmailGrid;
