/**
 * File: ReportScheduleForm.js
 * Purpose: Form for creating or editing a report schedule — defines recipient list,
 *          frequency, output format, and report source + parameters.
 * Dependencies: React, DevExtreme, report source registry
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportScheduleForm: Inline form rendered inside ReportScheduleManager
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { NumberBox } from 'devextreme-react/number-box';
import { TextBox } from 'devextreme-react/text-box';
import { TextArea } from 'devextreme-react/text-area';
import { TagBox } from 'devextreme-react/tag-box';
import { Button } from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';
import { getAllReportSources } from '../sources/reportSourceRegistry';
import ReportParameterForm from '../engine/ReportParameterForm';

const FREQUENCY_OPTIONS = [
    { value: 'once', text: 'Once' },
    { value: 'daily', text: 'Daily' },
    { value: 'weekly', text: 'Weekly' },
    { value: 'monthly', text: 'Monthly' },
];

const FORMAT_OPTIONS = [
    { value: 'pdf', text: 'PDF' },
    { value: 'excel', text: 'Excel' },
    { value: 'html', text: 'HTML (inline email)' },
];

const DAY_OF_WEEK_OPTIONS = [
    { id: 'sunday', name: 'Sunday', dayIndex: 0 },
    { id: 'monday', name: 'Monday', dayIndex: 1 },
    { id: 'tuesday', name: 'Tuesday', dayIndex: 2 },
    { id: 'wednesday', name: 'Wednesday', dayIndex: 3 },
    { id: 'thursday', name: 'Thursday', dayIndex: 4 },
    { id: 'friday', name: 'Friday', dayIndex: 5 },
    { id: 'saturday', name: 'Saturday', dayIndex: 6 },
];

const WEEK_OF_MONTH_OPTIONS = [
    { id: 'first', name: '1st Week' },
    { id: 'second', name: '2nd Week' },
    { id: 'third', name: '3rd Week' },
    { id: 'fourth', name: '4th Week' },
    { id: 'last', name: 'Last Week' },
];

const ReportScheduleForm = ({
    initialValues = {},
    recipients = [],
    onSubmit,
    onCancel,
    isSubmitting = false,
    mode = 'create', // 'create' | 'edit'
}) => {
    const allSources = useMemo(() => getAllReportSources(), []);

    const [formData, setFormData] = useState({
        reportSourceId: initialValues.reportSourceId || '',
        scheduleName: initialValues.scheduleName || '',
        description: initialValues.description || '',
        recipientEmails: initialValues.recipientEmails || [],
        frequency: initialValues.frequency || 'once',
        outputFormat: initialValues.outputFormat || 'pdf',
        scheduledAt: initialValues.scheduledAt || new Date(),
        repeatCount: initialValues.repeatCount || 1,
        filters: initialValues.filters || {},
        // Period & Timing fields (from old ScheduleReportEmailDialog)
        scheduleDayOfWeekIds: initialValues.scheduleDayOfWeekIds || ['monday'],
        scheduleWeekOfMonthIds: initialValues.scheduleWeekOfMonthIds || ['first'],
        scheduleDayOfMonth: initialValues.scheduleDayOfMonth || 1,
        scheduleTime: initialValues.scheduleTime || '08:00',
    });

    const selectedSource = useMemo(
        () => allSources.find((s) => s.id === formData.reportSourceId),
        [allSources, formData.reportSourceId]
    );

    // Reset filters when source changes
    useEffect(() => {
        if (selectedSource) {
            const defaults = {};
            selectedSource.parameters.forEach((p) => {
                if (typeof p.defaultValue === 'function') {
                    defaults[p.key] = p.defaultValue();
                } else if (p.defaultValue !== undefined) {
                    defaults[p.key] = p.defaultValue;
                } else {
                    defaults[p.key] = null;
                }
            });
            setFormData((prev) => ({
                ...prev,
                filters: defaults,
                scheduleName:
                    prev.scheduleName ||
                    `${selectedSource.name} Report - ${new Date().toLocaleDateString()}`,
            }));
        }
    }, [selectedSource]);

    const handleChange = useCallback((field, value) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    }, []);

    const handleFilterChange = useCallback((key, value) => {
        setFormData((prev) => ({
            ...prev,
            filters: { ...prev.filters, [key]: value },
        }));
    }, []);

    const handleSubmit = useCallback(() => {
        if (!formData.reportSourceId) {
            notify({ message: 'Please select a report source', type: 'warning' });
            return;
        }
        if (!formData.recipientEmails?.length) {
            notify({ message: 'Please add at least one recipient', type: 'warning' });
            return;
        }
        if (!formData.scheduledAt) {
            notify({ message: 'Please set a schedule date/time', type: 'warning' });
            return;
        }
        if (onSubmit) onSubmit(formData);
    }, [formData, onSubmit]);

    return (
        <div className="report-schedule-form tw-space-y-6">
            {/* Report Source */}
            <div>
                <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-1">
                    <i className="fa-light fa-database tw-mr-1"></i> Report Source *
                </label>
                <SelectBox
                    value={formData.reportSourceId}
                    dataSource={allSources}
                    valueExpr="id"
                    displayExpr="name"
                    onValueChanged={(e) => handleChange('reportSourceId', e.value)}
                    placeholder="Select report..."
                    searchEnabled={true}
                />
            </div>

            {/* Schedule Name */}
            <div>
                <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-1">
                    <i className="fa-light fa-tag tw-mr-1"></i> Schedule Name
                </label>
                <TextBox
                    value={formData.scheduleName}
                    onValueChanged={(e) => handleChange('scheduleName', e.value)}
                    placeholder="Name for this schedule..."
                />
            </div>

            {/* Description */}
            <div>
                <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-1">
                    Description
                </label>
                <TextArea
                    value={formData.description}
                    onValueChanged={(e) => handleChange('description', e.value)}
                    placeholder="Optional description..."
                    height={60}
                />
            </div>

            {/* Recipients */}
            <div>
                <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-1">
                    <i className="fa-light fa-users tw-mr-1"></i> Recipients *
                </label>
                <TagBox
                    value={formData.recipientEmails}
                    dataSource={recipients}
                    valueExpr="email"
                    displayExpr="displayName"
                    onValueChanged={(e) => handleChange('recipientEmails', e.value)}
                    placeholder="Select recipients..."
                    searchEnabled={true}
                    showSelectionControls={true}
                    acceptCustomValue={true}
                    onCustomItemCreating={(e) => {
                        e.customItem = { email: e.text, displayName: e.text };
                    }}
                />
            </div>

            {/* ── Period & Timing ── */}
            <div className="tw-rounded-md tw-border tw-border-slate-200 tw-bg-slate-50 tw-p-4">
                <div className="tw-mb-3 tw-text-sm tw-font-semibold tw-text-slate-700">
                    <i className="fa-light fa-clock tw-mr-1"></i> Period & Timing
                </div>
                <div className="tw-grid tw-grid-cols-2 tw-gap-4">
                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                            Frequency
                        </label>
                        <SelectBox
                            value={formData.frequency}
                            dataSource={FREQUENCY_OPTIONS}
                            valueExpr="value"
                            displayExpr="text"
                            onValueChanged={(e) => handleChange('frequency', e.value)}
                        />
                    </div>
                    <div>
                        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                            Output Format
                        </label>
                        <SelectBox
                            value={formData.outputFormat}
                            dataSource={FORMAT_OPTIONS}
                            valueExpr="value"
                            displayExpr="text"
                            onValueChanged={(e) => handleChange('outputFormat', e.value)}
                        />
                    </div>
                </div>

                {/* Daily: time only */}
                {formData.frequency === 'daily' && (
                    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-4">
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Time of Day
                            </label>
                            <DateBox
                                type="time"
                                value={(() => {
                                    const [h, m] = (formData.scheduleTime || '08:00').split(':');
                                    const d = new Date();
                                    d.setHours(Number(h) || 8, Number(m) || 0, 0, 0);
                                    return d;
                                })()}
                                onValueChanged={(e) => {
                                    if (e.value) {
                                        const d = new Date(e.value);
                                        const hh = String(d.getHours()).padStart(2, '0');
                                        const mm = String(d.getMinutes()).padStart(2, '0');
                                        handleChange('scheduleTime', `${hh}:${mm}`);
                                    }
                                }}
                                displayFormat="HH:mm"
                            />
                        </div>
                    </div>
                )}

                {/* Weekly: Day(s) of Week + Week(s) of Month + time */}
                {formData.frequency === 'weekly' && (
                    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-4">
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Day(s) of Week
                            </label>
                            <TagBox
                                dataSource={DAY_OF_WEEK_OPTIONS}
                                valueExpr="id"
                                displayExpr="name"
                                value={formData.scheduleDayOfWeekIds}
                                onValueChanged={(e) => {
                                    const val = Array.isArray(e.value) && e.value.length ? e.value : ['sunday'];
                                    handleChange('scheduleDayOfWeekIds', val);
                                }}
                                placeholder="Select days..."
                                searchEnabled={true}
                                showSelectionControls={true}
                                applyValueMode="useButtons"
                                maxDisplayedTags={4}
                            />
                        </div>
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Week(s) of Month
                            </label>
                            <TagBox
                                dataSource={WEEK_OF_MONTH_OPTIONS}
                                valueExpr="id"
                                displayExpr="name"
                                value={formData.scheduleWeekOfMonthIds}
                                onValueChanged={(e) => {
                                    const val = Array.isArray(e.value) && e.value.length ? e.value : ['first'];
                                    handleChange('scheduleWeekOfMonthIds', val);
                                }}
                                placeholder="Select weeks..."
                                searchEnabled={true}
                                showSelectionControls={true}
                                applyValueMode="useButtons"
                                maxDisplayedTags={3}
                            />
                        </div>
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Schedule Time
                            </label>
                            <DateBox
                                type="time"
                                value={(() => {
                                    const [h, m] = (formData.scheduleTime || '08:00').split(':');
                                    const d = new Date();
                                    d.setHours(Number(h) || 8, Number(m) || 0, 0, 0);
                                    return d;
                                })()}
                                onValueChanged={(e) => {
                                    if (e.value) {
                                        const d = new Date(e.value);
                                        const hh = String(d.getHours()).padStart(2, '0');
                                        const mm = String(d.getMinutes()).padStart(2, '0');
                                        handleChange('scheduleTime', `${hh}:${mm}`);
                                    }
                                }}
                                displayFormat="HH:mm"
                            />
                        </div>
                    </div>
                )}

                {/* Monthly: Day of month 1–31 + time */}
                {formData.frequency === 'monthly' && (
                    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-4">
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Day of Month (1–31)
                            </label>
                            <NumberBox
                                value={formData.scheduleDayOfMonth}
                                onValueChanged={(e) => handleChange('scheduleDayOfMonth', Math.min(31, Math.max(1, e.value || 1)))}
                                min={1}
                                max={31}
                                showSpinButtons={true}
                                format="#"
                            />
                        </div>
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Schedule Time
                            </label>
                            <DateBox
                                type="time"
                                value={(() => {
                                    const [h, m] = (formData.scheduleTime || '08:00').split(':');
                                    const d = new Date();
                                    d.setHours(Number(h) || 8, Number(m) || 0, 0, 0);
                                    return d;
                                })()}
                                onValueChanged={(e) => {
                                    if (e.value) {
                                        const d = new Date(e.value);
                                        const hh = String(d.getHours()).padStart(2, '0');
                                        const mm = String(d.getMinutes()).padStart(2, '0');
                                        handleChange('scheduleTime', `${hh}:${mm}`);
                                    }
                                }}
                                displayFormat="HH:mm"
                            />
                        </div>
                    </div>
                )}

                {/* Once — just date/time picker */}
                {formData.frequency === 'once' && (
                    <div className="tw-grid tw-grid-cols-2 tw-gap-4 tw-mt-4">
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Scheduled At *
                            </label>
                            <DateBox
                                value={formData.scheduledAt}
                                onValueChanged={(e) => handleChange('scheduledAt', e.value)}
                                type="datetime"
                                displayFormat="yyyy-MM-dd HH:mm"
                            />
                        </div>
                        <div>
                            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                                Output Format
                            </label>
                            {/* already shown above, keep as spacer */}
                        </div>
                    </div>
                )}
            </div>

            {/* Report Parameters */}
            {selectedSource && (
                <div>
                    <label className="tw-block tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2">
                        <i className="fa-light fa-filter tw-mr-1"></i> Report Parameters
                    </label>
                    <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-border tw-border-gray-200">
                        <ReportParameterForm
                            parameters={selectedSource.parameters}
                            filters={formData.filters}
                            onFilterChange={handleFilterChange}
                        />
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="tw-flex tw-justify-end tw-gap-3 tw-pt-4 tw-border-t tw-border-gray-200">
                <Button text="Cancel" stylingMode="outlined" onClick={onCancel} />
                <Button
                    text={mode === 'create' ? 'Create Schedule' : 'Update Schedule'}
                    type="success"
                    icon={mode === 'create' ? 'fa-light fa-plus' : 'fa-light fa-save'}
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                />
            </div>
        </div>
    );
};

export default ReportScheduleForm;
