/**
 * File: ReportScheduleManager.js
 * Purpose: Full schedule management page — lists all scheduled reports, supports
 *          creating new schedules, editing existing, cancelling, and viewing
 *          per-recipient delivery status.
 * Dependencies: React, DevExtreme DataGrid, reportingService, ReportScheduleForm,
 *               RecipientDeliveryStatusPopup
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportScheduleManager: Schedule list + create/edit form in popup +
 *   recipient delivery status popup
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import DataGrid, {
    Column,
    Paging,
    Pager,
    SearchPanel,
    FilterRow,
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Popup } from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
import axiosInstance from '../../../api/axiosInstance';
import reportingService from '../../../services/reportingService';
import { usePermissions } from '../../../hooks/usePermissions';
import ReportScheduleForm from './ReportScheduleForm';
import RecipientDeliveryStatusPopup from '../components/RecipientDeliveryStatusPopup';
import './ReportScheduleManager.scss';

const STATUS_CLASSES = {
    pending: 'tw-bg-yellow-100 tw-text-yellow-800',
    active: 'tw-bg-green-100 tw-text-green-800',
    completed: 'tw-bg-blue-100 tw-text-blue-800',
    cancelled: 'tw-bg-red-100 tw-text-red-800',
    failed: 'tw-bg-red-100 tw-text-red-800',
};

const ReportScheduleManager = () => {
    const [searchParams] = useSearchParams();
    const { hasRole } = usePermissions();
    const isAdmin = hasRole('Admin') || hasRole('SuperAdmin');

    const [schedules, setSchedules] = useState([]);
    const [recipients, setRecipients] = useState([]);
    const [loading, setLoading] = useState(false);
    const [showFormPopup, setShowFormPopup] = useState(false);
    const [editTarget, setEditTarget] = useState(null);
    const [deliveryTarget, setDeliveryTarget] = useState(null);

    // Check if we should auto-open create from URL params
    const preselectedSource = searchParams.get('source');

    const loadSchedules = useCallback(async () => {
        setLoading(true);
        try {
            const result = await reportingService.getScheduledReportEmails({
                includeCompleted: true,
                take: 300,
            });
            if (result.success) {
                setSchedules(Array.isArray(result.data) ? result.data : []);
            } else {
                notify({ message: result.error || 'Failed to load schedules', type: 'error' });
            }
        } catch (err) {
            notify({ message: 'Failed to load schedules', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, []);

    const loadRecipients = useCallback(async () => {
        try {
            const response = await axiosInstance.get('/tankvolumehistory/users');
            const users = response.data || [];
            setRecipients(
                (Array.isArray(users) ? users : []).map((u) => ({
                    email: u.email || u.userName,
                    displayName: u.fullName || u.userName || u.email,
                }))
            );
        } catch (err) {
            console.error('Failed to load recipients:', err);
        }
    }, []);

    useEffect(() => {
        loadSchedules();
        loadRecipients();
    }, [loadSchedules, loadRecipients]);

    // Auto-open form if source param present
    useEffect(() => {
        if (preselectedSource) {
            setEditTarget(null);
            setShowFormPopup(true);
        }
    }, [preselectedSource]);

    const handleCreate = useCallback(
        async (formData) => {
            setLoading(true);
            try {
                const request = {
                    reportType: formData.reportSourceId,
                    scheduleName: formData.scheduleName,
                    description: formData.description,
                    recipients: formData.recipientEmails,
                    frequency: formData.frequency,
                    outputFormat: formData.outputFormat,
                    scheduledAt: formData.scheduledAt instanceof Date
                        ? formData.scheduledAt.toISOString()
                        : formData.scheduledAt,
                    repeatCount: formData.repeatCount,
                    filters: formData.filters,
                    scheduleConfig: JSON.stringify({
                        periodType: formData.frequency,
                        scheduleDayOfWeekIds: formData.scheduleDayOfWeekIds || ['monday'],
                        scheduleWeekOfMonthIds: formData.scheduleWeekOfMonthIds || ['first'],
                        scheduleTime: formData.scheduleTime || '08:00',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                    }),
                };

                const result = await reportingService.scheduleReportEmail(request);
                if (result.success) {
                    notify({ message: 'Schedule created successfully', type: 'success' });
                    setShowFormPopup(false);
                    await loadSchedules();
                } else {
                    notify({ message: result.error || 'Failed to create schedule', type: 'error' });
                }
            } catch (err) {
                notify({ message: 'Failed to create schedule', type: 'error' });
            } finally {
                setLoading(false);
            }
        },
        [loadSchedules]
    );

    const handleUpdate = useCallback(
        async (formData) => {
            if (!editTarget) return;
            setLoading(true);
            try {
                const payload = {
                    scheduleName: formData.scheduleName,
                    description: formData.description,
                    recipients: formData.recipientEmails,
                    frequency: formData.frequency,
                    outputFormat: formData.outputFormat,
                    scheduledAt: formData.scheduledAt instanceof Date
                        ? formData.scheduledAt.toISOString()
                        : formData.scheduledAt,
                    repeatCount: formData.repeatCount,
                    filters: formData.filters,
                    reportType: formData.reportSourceId,
                    scheduleConfig: JSON.stringify({
                        periodType: formData.frequency,
                        scheduleDayOfWeekIds: formData.scheduleDayOfWeekIds || ['monday'],
                        scheduleWeekOfMonthIds: formData.scheduleWeekOfMonthIds || ['first'],
                        scheduleTime: formData.scheduleTime || '08:00',
                        timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
                    }),
                };

                const scheduleId = editTarget.notificationId || editTarget.id;
                const result = await reportingService.updateScheduledReportEmail(scheduleId, payload);
                if (result.success) {
                    notify({ message: 'Schedule updated successfully', type: 'success' });
                    setShowFormPopup(false);
                    setEditTarget(null);
                    await loadSchedules();
                } else {
                    notify({ message: result.error || 'Failed to update schedule', type: 'error' });
                }
            } catch (err) {
                notify({ message: 'Failed to update schedule', type: 'error' });
            } finally {
                setLoading(false);
            }
        },
        [editTarget, loadSchedules]
    );

    const handleFormSubmit = useCallback(
        (formData) => {
            if (editTarget) {
                handleUpdate(formData);
            } else {
                handleCreate(formData);
            }
        },
        [editTarget, handleCreate, handleUpdate]
    );

    const handleEdit = useCallback((schedule) => {
        // Map schedule data back to form shape
        let parsedRecipients = [];
        if (Array.isArray(schedule.recipients)) {
            parsedRecipients = schedule.recipients.map(
                (r) => r.recipientAddress || r.email || r
            );
        } else if (typeof schedule.recipients === 'string') {
            try {
                const parsed = JSON.parse(schedule.recipients);
                parsedRecipients = parsed.map((r) => r.recipientAddress || r.email || r);
            } catch { /* ignore */ }
        }

        let parsedFilters = {};
        if (typeof schedule.filters === 'string') {
            try { parsedFilters = JSON.parse(schedule.filters); } catch { /* ignore */ }
        } else if (schedule.filters) {
            parsedFilters = schedule.filters;
        }

        // Parse scheduleConfig JSON (period & timing)
        let parsedConfig = {};
        if (typeof schedule.scheduleConfig === 'string') {
            try { parsedConfig = JSON.parse(schedule.scheduleConfig); } catch { /* ignore */ }
        } else if (schedule.scheduleConfig) {
            parsedConfig = schedule.scheduleConfig;
        }

        setEditTarget({
            ...schedule,
            formValues: {
                reportSourceId: schedule.reportType || schedule.reportSourceId || '',
                scheduleName: schedule.scheduleName || schedule.title || '',
                description: schedule.description || '',
                recipientEmails: parsedRecipients,
                frequency: schedule.frequency || schedule.scheduleType || 'once',
                outputFormat: schedule.outputFormat || schedule.format || 'pdf',
                scheduledAt: schedule.scheduledAt ? new Date(schedule.scheduledAt) : new Date(),
                repeatCount: schedule.repeatCount || 1,
                filters: parsedFilters,
                scheduleDayOfWeekIds: parsedConfig.scheduleDayOfWeekIds || ['monday'],
                scheduleWeekOfMonthIds: parsedConfig.scheduleWeekOfMonthIds || ['first'],
                scheduleTime: parsedConfig.scheduleTime || '08:00',
            },
        });
        setShowFormPopup(true);
    }, []);

    const handleCancel = useCallback(
        async (schedule) => {
            if (!window.confirm(`Cancel schedule "${schedule.scheduleName || schedule.id}"?`)) return;
            setLoading(true);
            try {
                const result = await reportingService.cancelScheduledReportEmail(
                    schedule.notificationId || schedule.id
                );
                if (result.success) {
                    notify({ message: 'Schedule cancelled', type: 'success' });
                    await loadSchedules();
                } else {
                    notify({ message: result.error || 'Failed to cancel', type: 'error' });
                }
            } catch (err) {
                notify({ message: 'Failed to cancel schedule', type: 'error' });
            } finally {
                setLoading(false);
            }
        },
        [loadSchedules]
    );

    const renderStatus = useCallback((cellInfo) => {
        const status = String(cellInfo.value || 'pending').toLowerCase();
        const cls = STATUS_CLASSES[status] || STATUS_CLASSES.pending;
        return (
            <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${cls}`}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
        );
    }, []);

    const renderActions = useCallback(
        (cellInfo) => {
            const schedule = cellInfo.data;
            const isCancelled = String(schedule.status || '').toLowerCase() === 'cancelled';
            const isCompleted = String(schedule.status || '').toLowerCase() === 'completed';
            const isEditable = !isCancelled && !isCompleted;
            return (
                <div className="tw-flex tw-gap-1">
                    <Button
                        icon="fa-light fa-pen-to-square"
                        hint="Edit Schedule"
                        stylingMode="text"
                        onClick={() => handleEdit(schedule)}
                        disabled={!isEditable}
                    />
                    <Button
                        icon="fa-light fa-users"
                        hint="View Delivery Status"
                        stylingMode="text"
                        onClick={() => setDeliveryTarget(schedule)}
                    />
                    <Button
                        icon="fa-light fa-ban"
                        hint="Cancel Schedule"
                        stylingMode="text"
                        onClick={() => handleCancel(schedule)}
                        disabled={!isEditable}
                    />
                </div>
            );
        },
        [handleCancel, handleEdit]
    );

    const renderDeliveryStats = useCallback((cellInfo) => {
        const schedule = cellInfo.data;
        const recipientList = Array.isArray(schedule.recipients) ? schedule.recipients : [];
        const total = schedule.recipientCount || recipientList.length || 0;
        const delivered = schedule.deliveredCount || recipientList.filter(r => r.deliveryStatus === 'delivered').length || 0;
        const failed = schedule.failedCount || recipientList.filter(r => r.deliveryStatus === 'failed').length || 0;
        const pending = total - delivered - failed;

        if (total === 0) {
            return <span className="tw-text-gray-400 tw-text-xs">—</span>;
        }

        return (
            <div className="tw-text-xs tw-leading-5">
                <span className="tw-text-gray-600">{total} total</span>
                {delivered > 0 && (
                    <span className="tw-ml-2 tw-text-green-600">
                        <i className="fa-light fa-check tw-mr-0.5"></i>{delivered}
                    </span>
                )}
                {failed > 0 && (
                    <span className="tw-ml-2 tw-text-red-600">
                        <i className="fa-light fa-xmark tw-mr-0.5"></i>{failed}
                    </span>
                )}
                {pending > 0 && (
                    <span className="tw-ml-2 tw-text-yellow-600">
                        <i className="fa-light fa-clock tw-mr-0.5"></i>{pending}
                    </span>
                )}
            </div>
        );
    }, []);

    const formatDateTime = useCallback((value) => {
        if (!value) return '—';
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
    }, []);

    if (!isAdmin) {
        return (
            <div className="tw-p-8 tw-text-center tw-text-gray-500">
                <i className="fa-light fa-lock tw-text-4xl tw-mb-3"></i>
                <p>Schedule management requires Admin access.</p>
            </div>
        );
    }

    return (
        <div className="report-schedule-manager">
            <LoadPanel visible={loading} />

            {/* Header */}
            <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
                <div>
                    <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">
                        <i className="fa-light fa-calendar-clock tw-mr-2 tw-text-blue-600"></i>
                        Report Schedules
                    </h2>
                    <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
                        Manage automated report generation and email delivery
                    </p>
                </div>
                <Button
                    icon="fa-light fa-plus"
                    text="New Schedule"
                    type="default"
                    onClick={() => {
                        setEditTarget(null);
                        setShowFormPopup(true);
                    }}
                />
            </div>

            {/* Grid */}
            <DataGrid
                dataSource={schedules}
                showBorders={true}
                columnAutoWidth={true}
                rowAlternationEnabled={true}
                keyExpr="id"
            >
                <SearchPanel visible={true} width={250} />
                <FilterRow visible={true} />
                <Paging defaultPageSize={15} />
                <Pager showPageSizeSelector={true} allowedPageSizes={[10, 15, 30, 50]} showInfo={true} />

                <Column dataField="scheduleName" caption="Schedule Name" />
                <Column dataField="reportType" caption="Report Source" width={180} />
                <Column dataField="frequency" caption="Frequency" width={100} />
                <Column dataField="outputFormat" caption="Format" width={80} />
                <Column
                    dataField="status"
                    caption="Status"
                    width={110}
                    cellRender={renderStatus}
                />
                <Column
                    dataField="scheduledAt"
                    caption="Next Run"
                    width={170}
                    calculateCellValue={(row) => formatDateTime(row.scheduledAt || row.nextRunAt)}
                />
                <Column
                    caption="Delivery"
                    width={160}
                    cellRender={renderDeliveryStats}
                    allowSorting={false}
                    allowFiltering={false}
                />
                <Column caption="Actions" width={120} cellRender={renderActions} alignment="center" />
            </DataGrid>

            {/* Create/Edit Popup */}
            <Popup
                visible={showFormPopup}
                onHiding={() => {
                    setShowFormPopup(false);
                    setEditTarget(null);
                }}
                title={editTarget ? 'Edit Schedule' : 'Create New Schedule'}
                width={650}
                height="auto"
                maxHeight="85vh"
                showCloseButton={true}
            >
                <div className="tw-p-4 tw-overflow-y-auto" style={{ maxHeight: '70vh' }}>
                    <ReportScheduleForm
                        initialValues={
                            editTarget
                                ? editTarget.formValues
                                : preselectedSource
                                    ? { reportSourceId: preselectedSource }
                                    : {}
                        }
                        recipients={recipients}
                        onSubmit={handleFormSubmit}
                        onCancel={() => {
                            setShowFormPopup(false);
                            setEditTarget(null);
                        }}
                        isSubmitting={loading}
                        mode={editTarget ? 'edit' : 'create'}
                    />
                </div>
            </Popup>

            {/* Recipient Delivery Status Popup */}
            <RecipientDeliveryStatusPopup
                schedule={deliveryTarget}
                onHiding={() => setDeliveryTarget(null)}
                formatLocalDateTime={(val) => {
                    if (!val) return '—';
                    const d = new Date(val);
                    return Number.isNaN(d.getTime()) ? '—' : d.toLocaleString();
                }}
            />
        </div>
    );
};

export default ReportScheduleManager;
