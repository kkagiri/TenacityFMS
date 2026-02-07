/**
 * File: ReportScheduleSettings.js
 * Purpose: Admin settings page for monitoring and managing scheduled report emails
 * Dependencies: react, DevExtreme components, reportingService, usePermissions
 * Last Modified: 2026-02-07
 *
 * Key Components:
 * - ReportScheduleSettings: Lists scheduled report emails with delivery status and edit/cancel actions
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import DataGrid, { Column, Paging, Pager, SearchPanel, FilterRow } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import { TagBox } from 'devextreme-react/tag-box';
import notify from 'devextreme/ui/notify';
import reportingService from '../../services/reportingService';
import { usePermissions } from '../../hooks/usePermissions';
import './ReportScheduleSettings.scss';

const SCHEDULE_TYPE_OPTIONS = [
  { id: 'weekly', name: 'Weekly' },
  { id: 'monthly', name: 'Monthly' }
];

const DAY_OPTIONS = [
  { id: 'monday', name: 'Monday' },
  { id: 'tuesday', name: 'Tuesday' },
  { id: 'wednesday', name: 'Wednesday' },
  { id: 'thursday', name: 'Thursday' },
  { id: 'friday', name: 'Friday' },
  { id: 'saturday', name: 'Saturday' },
  { id: 'sunday', name: 'Sunday' }
];

const WEEK_OF_MONTH_OPTIONS = [
  { id: 'first', name: '1st Week' },
  { id: 'second', name: '2nd Week' },
  { id: 'third', name: '3rd Week' },
  { id: 'fourth', name: '4th Week' },
  { id: 'last', name: 'Last Week' }
];

const formatLocalDateTime = (value) => {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString();
};

const normalizeTimeFromDate = (dateValue) => {
  const value = new Date(dateValue);
  if (Number.isNaN(value.getTime())) return '08:00';
  return `${String(value.getHours()).padStart(2, '0')}:${String(value.getMinutes()).padStart(2, '0')}`;
};

const normalizeScheduleRow = (row) => {
  if (!row || typeof row !== 'object') {
    return null;
  }

  return {
    ...row,
    id: row.id ?? row.Id ?? null,
    notificationId: row.notificationId ?? row.NotificationId ?? '',
    title: row.title ?? row.Title ?? 'Scheduled Report',
    format: row.format ?? row.Format ?? 'PDF',
    status: row.status ?? row.Status ?? 'Pending',
    scheduledAt: row.scheduledAt ?? row.ScheduledAt ?? null,
    scheduleTimeOfDay: row.scheduleTimeOfDay ?? row.ScheduleTimeOfDay ?? '08:00',
    scheduleType: row.scheduleType ?? row.ScheduleType ?? 'weekly',
    scheduleWeekOfMonth: row.scheduleWeekOfMonth ?? row.ScheduleWeekOfMonth ?? 'first',
    scheduleDaysOfWeek: row.scheduleDaysOfWeek ?? row.ScheduleDaysOfWeek ?? ['monday'],
    timeZone: row.timeZone ?? row.TimeZone ?? 'UTC',
    requestedBy: row.requestedBy ?? row.RequestedBy ?? '-',
    recipientCount: row.recipientCount ?? row.RecipientCount ?? 0,
    deliveredCount: row.deliveredCount ?? row.DeliveredCount ?? 0,
    failedCount: row.failedCount ?? row.FailedCount ?? 0,
    pendingCount: row.pendingCount ?? row.PendingCount ?? 0,
    recipients: row.recipients ?? row.Recipients ?? []
  };
};

const ReportScheduleSettings = () => {
  const { hasRole } = usePermissions();
  const isAdmin = hasRole('Admin') || hasRole('SuperAdmin');

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(false);
  const [includeCompleted, setIncludeCompleted] = useState(true);

  const [editingSchedule, setEditingSchedule] = useState(null);
  const [editForm, setEditForm] = useState({
    nextRunAt: null,
    scheduleType: 'weekly',
    daysOfWeek: ['monday'],
    weekOfMonth: 'first',
    scheduleTimeOfDay: '08:00'
  });

  const [recipientPopupSchedule, setRecipientPopupSchedule] = useState(null);

  const loadSchedules = useCallback(async () => {
    setLoading(true);
    try {
      const result = await reportingService.getScheduledReportEmails({
        includeCompleted,
        take: 300
      });

      if (result.success) {
        const normalizedRows = (Array.isArray(result.data) ? result.data : [])
          .map(normalizeScheduleRow)
          .filter(Boolean);
        setSchedules(normalizedRows);
      } else {
        notify({
          message: result.error || 'Failed to load scheduled report emails.',
          type: 'error',
          displayTime: 3000,
          position: 'top center'
        });
      }
    } catch (error) {
      notify({
        message: 'Failed to load scheduled report emails.',
        type: 'error',
        displayTime: 3000,
        position: 'top center'
      });
    } finally {
      setLoading(false);
    }
  }, [includeCompleted]);

  useEffect(() => {
    if (!isAdmin) return;
    loadSchedules();
  }, [isAdmin, loadSchedules]);

  const statusClassByValue = useMemo(() => ({
    scheduled: 'scheduled-emails__status--scheduled',
    sent: 'scheduled-emails__status--sent',
    cancelled: 'scheduled-emails__status--cancelled',
    failed: 'scheduled-emails__status--failed',
    partiallyfailed: 'scheduled-emails__status--warning',
    pending: 'scheduled-emails__status--pending'
  }), []);

  const openEditPopup = useCallback((schedule) => {
    if (!schedule) return;

    setEditingSchedule(schedule);
    setEditForm({
      nextRunAt: schedule.scheduledAt ? new Date(schedule.scheduledAt) : null,
      scheduleType: schedule.scheduleType || 'weekly',
      daysOfWeek: Array.isArray(schedule.scheduleDaysOfWeek) && schedule.scheduleDaysOfWeek.length
        ? schedule.scheduleDaysOfWeek
        : ['monday'],
      weekOfMonth: schedule.scheduleWeekOfMonth || 'first',
      scheduleTimeOfDay: schedule.scheduleTimeOfDay || '08:00'
    });
  }, []);

  const handleCancelSchedule = useCallback(async (schedule) => {
    if (!schedule?.id) return;

    const shouldCancel = window.confirm(`Cancel schedule '${schedule.title}'?`);
    if (!shouldCancel) return;

    const result = await reportingService.cancelScheduledReportEmail(schedule.id);
    if (result.success) {
      notify({
        message: 'Schedule cancelled successfully.',
        type: 'success',
        displayTime: 2500,
        position: 'top center'
      });
      loadSchedules();
      return;
    }

    notify({
      message: result.error || 'Failed to cancel schedule.',
      type: 'error',
      displayTime: 3000,
      position: 'top center'
    });
  }, [loadSchedules]);

  const handleSaveScheduleChanges = useCallback(async () => {
    if (!editingSchedule?.id) return;

    if (!editForm.nextRunAt) {
      notify({
        message: 'Please select the next run date and time.',
        type: 'warning',
        displayTime: 3000,
        position: 'top center'
      });
      return;
    }

    const payload = {
      scheduledAtUtc: new Date(editForm.nextRunAt).toISOString(),
      scheduleType: editForm.scheduleType,
      daysOfWeek: editForm.daysOfWeek,
      weekOfMonth: editForm.scheduleType === 'monthly' ? editForm.weekOfMonth : null,
      scheduleTimeOfDay: editForm.scheduleTimeOfDay,
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
      enabled: true
    };

    const result = await reportingService.updateScheduledReportEmail(editingSchedule.id, payload);
    if (result.success) {
      notify({
        message: 'Schedule updated successfully.',
        type: 'success',
        displayTime: 2500,
        position: 'top center'
      });
      setEditingSchedule(null);
      loadSchedules();
      return;
    }

    notify({
      message: result.error || 'Failed to update schedule.',
      type: 'error',
      displayTime: 3000,
      position: 'top center'
    });
  }, [editForm, editingSchedule, loadSchedules]);

  const renderStatusCell = useCallback((cellInfo) => {
    const statusValue = String(cellInfo.value || 'pending').toLowerCase();
    const statusClass = statusClassByValue[statusValue] || 'scheduled-emails__status--pending';
    return (
      <span className={`scheduled-emails__status ${statusClass}`}>
        {statusValue.charAt(0).toUpperCase() + statusValue.slice(1)}
      </span>
    );
  }, [statusClassByValue]);

  const renderRecipientsCell = useCallback((cellInfo) => {
    const schedule = cellInfo.data;
    const delivered = schedule.deliveredCount || 0;
    const failed = schedule.failedCount || 0;
    const pending = schedule.pendingCount || 0;

    return (
      <div className="tw-text-xs tw-leading-5">
        <div>Recipients: <strong>{schedule.recipientCount || 0}</strong></div>
        <div>Delivered: <strong>{delivered}</strong> | Failed: <strong>{failed}</strong> | Pending: <strong>{pending}</strong></div>
      </div>
    );
  }, []);

  const renderActionCell = useCallback((cellInfo) => {
    const schedule = cellInfo.data;
    const isCancelled = String(schedule.status || '').toLowerCase() === 'cancelled';

    return (
      <div className="scheduled-emails__actions">
        <Button
          text="Adjust"
          icon="fa-light fa-clock"
          stylingMode="text"
          onClick={() => openEditPopup(schedule)}
          disabled={isCancelled}
        />
        <Button
          text="Recipients"
          icon="fa-light fa-users"
          stylingMode="text"
          onClick={() => setRecipientPopupSchedule(schedule)}
        />
        <Button
          text="Cancel"
          icon="fa-light fa-ban"
          stylingMode="text"
          onClick={() => handleCancelSchedule(schedule)}
          disabled={isCancelled}
        />
      </div>
    );
  }, [handleCancelSchedule, openEditPopup]);

  if (!isAdmin) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-lock tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <div className="tw-text-lg tw-font-semibold tw-text-gray-700">Access Denied</div>
          <div className="tw-text-sm tw-text-gray-500">Only admins can manage scheduled report emails.</div>
        </div>
      </div>
    );
  }

  return (
    <div className="scheduled-emails tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-4">
      <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-mb-4">
        <div>
          <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800">Scheduled Report Emails</h2>
          <p className="tw-text-sm tw-text-gray-500">Monitor delivery, adjust run times, and cancel active schedules.</p>
        </div>

        <div className="tw-flex tw-items-center tw-gap-3">
          <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
            <input
              type="checkbox"
              checked={includeCompleted}
              onChange={(e) => setIncludeCompleted(e.target.checked)}
            />
            Include sent/cancelled
          </label>

          <Button
            text="Refresh"
            icon="fa-light fa-rotate"
            stylingMode="outlined"
            onClick={loadSchedules}
          />
        </div>
      </div>

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
        <Column dataField="format" caption="Format" width={90} />
        <Column dataField="status" caption="Status" cellRender={renderStatusCell} width={130} />
        <Column dataField="scheduledAt" caption="Next Run" width={190} customizeText={(e) => formatLocalDateTime(e.value)} />
        <Column dataField="scheduleTimeOfDay" caption="Time" width={100} />
        <Column dataField="scheduleType" caption="Type" width={100} />
        <Column dataField="timeZone" caption="Time Zone" width={180} />
        <Column dataField="requestedBy" caption="Requested By" width={140} />
        <Column caption="Delivery" minWidth={220} cellRender={renderRecipientsCell} allowSorting={false} />
        <Column caption="Actions" minWidth={260} cellRender={renderActionCell} allowSorting={false} allowFiltering={false} />
      </DataGrid>

      <Popup
        visible={!!editingSchedule}
        onHiding={() => setEditingSchedule(null)}
        title="Adjust Schedule"
        width={620}
        height={520}
        showCloseButton={true}
      >
        <div className="tw-p-4 tw-flex tw-flex-col tw-gap-4">
          <div>
            <div className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">Report</div>
            <div className="tw-text-sm tw-text-gray-900">{editingSchedule?.title || '-'}</div>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Next Run Date & Time</label>
            <DateBox
              type="datetime"
              value={editForm.nextRunAt}
              onValueChanged={(e) => {
                const value = e.value || null;
                setEditForm((prev) => ({
                  ...prev,
                  nextRunAt: value,
                  scheduleTimeOfDay: value ? normalizeTimeFromDate(value) : prev.scheduleTimeOfDay
                }));
              }}
              displayFormat="yyyy-MM-dd HH:mm"
              width="100%"
            />
          </div>

          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Schedule Type</label>
              <SelectBox
                dataSource={SCHEDULE_TYPE_OPTIONS}
                valueExpr="id"
                displayExpr="name"
                value={editForm.scheduleType}
                onValueChanged={(e) => setEditForm((prev) => ({ ...prev, scheduleType: e.value || 'weekly' }))}
                width="100%"
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Time of Day</label>
              <DateBox
                type="time"
                value={editForm.scheduleTimeOfDay ? new Date(`2000-01-01T${editForm.scheduleTimeOfDay}:00`) : null}
                onValueChanged={(e) => {
                  setEditForm((prev) => ({
                    ...prev,
                    scheduleTimeOfDay: e.value ? normalizeTimeFromDate(e.value) : '08:00'
                  }));
                }}
                displayFormat="HH:mm"
                width="100%"
              />
            </div>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Days of Week</label>
            <TagBox
              dataSource={DAY_OPTIONS}
              valueExpr="id"
              displayExpr="name"
              value={editForm.daysOfWeek}
              onValueChanged={(e) => {
                const values = Array.isArray(e.value) ? e.value : [];
                setEditForm((prev) => ({
                  ...prev,
                  daysOfWeek: values.length ? values : ['monday']
                }));
              }}
              applyValueMode="useButtons"
              showSelectionControls={true}
              width="100%"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Week of Month</label>
            <SelectBox
              dataSource={WEEK_OF_MONTH_OPTIONS}
              valueExpr="id"
              displayExpr="name"
              value={editForm.weekOfMonth}
              disabled={editForm.scheduleType !== 'monthly'}
              onValueChanged={(e) => setEditForm((prev) => ({ ...prev, weekOfMonth: e.value || 'first' }))}
              width="100%"
            />
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
            <Button
              text="Cancel"
              icon="fa-light fa-times"
              stylingMode="outlined"
              onClick={() => setEditingSchedule(null)}
            />
            <Button
              text="Save"
              icon="fa-light fa-check"
              type="default"
              stylingMode="contained"
              onClick={handleSaveScheduleChanges}
            />
          </div>
        </div>
      </Popup>

      <Popup
        visible={!!recipientPopupSchedule}
        onHiding={() => setRecipientPopupSchedule(null)}
        title="Recipient Delivery Status"
        width={760}
        height={520}
        showCloseButton={true}
      >
        <div className="tw-p-4 tw-h-full tw-flex tw-flex-col">
          <div className="tw-mb-3 tw-text-sm tw-text-gray-700">
            <strong>{recipientPopupSchedule?.title || 'Scheduled Report'}</strong>
          </div>

          <div className="tw-flex-1">
            <DataGrid
              dataSource={recipientPopupSchedule?.recipients || []}
              keyExpr="userId"
              showBorders={true}
              showRowLines={true}
              columnAutoWidth={true}
            >
              <Column dataField="userName" caption="User" />
              <Column dataField="recipientAddress" caption="Email" />
              <Column dataField="deliveryMethod" caption="Method" width={110} />
              <Column dataField="deliveryStatus" caption="Status" width={120} />
              <Column dataField="sentAt" caption="Sent At" width={180} customizeText={(e) => formatLocalDateTime(e.value)} />
              <Column dataField="deliveredAt" caption="Delivered At" width={180} customizeText={(e) => formatLocalDateTime(e.value)} />
              <Column dataField="deliveryError" caption="Error" minWidth={180} />
            </DataGrid>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default ReportScheduleSettings;
