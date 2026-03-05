/**
 * File: ScheduleReportPanel.js
 * Purpose: Slide-in panel for scheduling a report to run on a recurring or one-time basis.
 *          User selects a source, picks frequency/time/days, adds recipients, chooses format,
 *          then submits. Follows M365 Admin Center Fluent design language.
 *          Mirrors the RequestReportEmailPanel pattern.
 * Dependencies: SlidePanel, reportSourceRegistry, buildNotificationRequestFromForm,
 *               reportingService, userActions (Redux)
 * Last Modified: 2026-07-09
 *
 * Key Components:
 * - ScheduleReportPanel: Full slide-in schedule-report configuration panel
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SelectBox } from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';
import SlidePanel from '../ui/SlidePanel';
import ReportParameterForm from '../../pages/reports/engine/ReportParameterForm';
import { getAllReportSources, getReportSource } from '../../pages/reports/sources/reportSourceRegistry';
import { buildNotificationRequestFromForm } from '../../pages/reports/scheduling/reportScheduleFormUtils';
import reportingService from '../../services/reportingService';
import { fetchUsers } from '../../redux/actions/userActions';
import './ScheduleReportPanel.scss';

// ── Constants ──────────────────────────────────────────────────────────────────

const FREQUENCY_OPTIONS = [
    { value: 'once', label: 'Once' },
    { value: 'daily', label: 'Daily' },
    { value: 'weekly', label: 'Weekly' },
    { value: 'monthly', label: 'Monthly' },
];

const DAY_OPTIONS = [
    { id: 'sunday', name: 'Sun' },
    { id: 'monday', name: 'Mon' },
    { id: 'tuesday', name: 'Tue' },
    { id: 'wednesday', name: 'Wed' },
    { id: 'thursday', name: 'Thu' },
    { id: 'friday', name: 'Fri' },
    { id: 'saturday', name: 'Sat' },
];

const WEEK_OF_MONTH_OPTIONS = [
    { id: 'first', name: '1st' },
    { id: 'second', name: '2nd' },
    { id: 'third', name: '3rd' },
    { id: 'fourth', name: '4th' },
    { id: 'last', name: 'Last' },
];

const FORMAT_OPTIONS = [
    { value: 'pdf', label: 'PDF', icon: 'fa-light fa-file-pdf' },
    { value: 'excel', label: 'Excel', icon: 'fa-light fa-file-excel' },
    { value: 'html', label: 'HTML', icon: 'fa-light fa-globe' },
];

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// ── Component ─────────────────────────────────────────────────────────────────

const ScheduleReportPanel = ({ open, onClose, initialSourceId = '', mode = 'create', initialValues = null, onUpdate = null }) => {
    const dispatch = useDispatch();
    const systemUsers = useSelector((state) => state.user?.users || []);
    const currentUser = useSelector((state) => state.auth?.user);

    // ── Report source ──
    const allSources = useMemo(() => getAllReportSources(), []);
    const [selectedSourceId, setSelectedSourceId] = useState(initialSourceId);
    const activeSource = useMemo(() => getReportSource(selectedSourceId), [selectedSourceId]);

    // ── Parameters ──
    const [filters, setFilters] = useState({});

    // ── Schedule name ──
    const [scheduleName, setScheduleName] = useState('');

    // ── Frequency / time ──
    const [frequency, setFrequency] = useState('once');
    const [scheduleTime, setScheduleTime] = useState('08:00');
    const [selectedDays, setSelectedDays] = useState([]);
    const [selectedWeeks, setSelectedWeeks] = useState([]);

    const [dayOfMonth, setDayOfMonth] = useState(1);

    // ── Report window ──
    const [offsetDays, setOffsetDays] = useState(1);
    const [windowDays, setWindowDays] = useState(1);

    // ── Format ──
    const [selectedFormat, setSelectedFormat] = useState('pdf');

    // ── Recipients ──
    const [recipients, setRecipients] = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const emailInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // ── Submitting ──
    const [submitting, setSubmitting] = useState(false);

    // ── Effects ──────────────────────────────────────────────────────────────

    // Sync initialSourceId when panel opens (create mode)
    useEffect(() => {
        if (open) {
            if (mode === 'edit' && initialValues) {
                // Populate all fields from initialValues
                setSelectedSourceId(initialValues.reportSourceId || '');
                setScheduleName(initialValues.scheduleName || '');
                setFrequency(initialValues.frequency || 'once');
                setScheduleTime(initialValues.scheduleTime || initialValues.scheduleTimeOfDay || '08:00');
                setSelectedDays(initialValues.scheduleDayOfWeekIds || []);
                setSelectedWeeks(initialValues.scheduleWeekOfMonthIds || []);
                setDayOfMonth(initialValues.scheduleDayOfMonth || 1);
                setSelectedFormat((initialValues.outputFormat || 'pdf').toLowerCase());
                setRecipients(Array.isArray(initialValues.recipientEmails) ? initialValues.recipientEmails : []);
                setFilters(initialValues.filters || {});
                setOffsetDays(initialValues.offsetDays ?? 1);
                setWindowDays(initialValues.windowDays ?? 1);
            } else {
                setSelectedSourceId(initialSourceId || '');
            }
        }
    }, [open, mode, initialValues, initialSourceId]);

    // Auto-set schedule name from source (create mode only)
    useEffect(() => {
        if (mode !== 'edit' && activeSource?.name) {
            setScheduleName(`${activeSource.name} Schedule`);
        } else if (mode !== 'edit') {
            setScheduleName('');
        }
    }, [mode, activeSource]);

    // Load users when panel opens
    useEffect(() => {
        if (open && systemUsers.length === 0) {
            dispatch(fetchUsers());
        }
    }, [open, systemUsers.length, dispatch]);

    // Reset non-source fields when closing
    useEffect(() => {
        if (!open) {
            setFilters({});
            setScheduleName('');
            setFrequency('once');
            setScheduleTime('08:00');
            setSelectedDays([]);
            setSelectedWeeks([]);
            setDayOfMonth(1);
            setOffsetDays(1);
            setWindowDays(1);
            setSelectedFormat('pdf');
            setRecipients([]);
            setEmailInput('');
            setEmailError('');
            setShowSuggestions(false);
            setSubmitting(false);
        }
    }, [open]);

    // ── User suggestions ─────────────────────────────────────────────────────

    const userSuggestions = useMemo(() => {
        const list = (systemUsers || [])
            .filter((u) => {
                const email = u?.email || u?.Email;
                return email && !u?.isDeleted;
            })
            .map((u) => ({
                id: u.userId || u.id,
                name: u.userName || u.username || u.name || '',
                email: (u.email || u.Email || '').toLowerCase(),
            }));

        const currentEmail = (currentUser?.email || '').toLowerCase();
        if (currentEmail) {
            const idx = list.findIndex((u) => u.email === currentEmail);
            if (idx > 0) {
                const [cur] = list.splice(idx, 1);
                list.unshift(cur);
            } else if (idx < 0) {
                list.unshift({
                    id: currentUser.id || currentUser.Id,
                    name: currentUser.userName || currentUser.UserName || 'Me',
                    email: currentEmail,
                });
            }
        }

        return list;
    }, [systemUsers, currentUser]);

    const filteredSuggestions = useMemo(() => {
        const q = emailInput.trim().toLowerCase();
        return userSuggestions.filter((u) => {
            if (recipients.includes(u.email)) return false;
            if (!q) return true;
            return u.name.toLowerCase().includes(q) || u.email.includes(q);
        });
    }, [userSuggestions, emailInput, recipients]);

    // ── Recipients handlers ──────────────────────────────────────────────────

    const addRecipient = useCallback((email) => {
        const normalized = email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(normalized)) {
            setEmailError('Enter a valid email address.');
            return false;
        }
        if (recipients.includes(normalized)) {
            setEmailError('This email is already added.');
            return false;
        }
        setRecipients((prev) => [...prev, normalized]);
        setEmailInput('');
        setEmailError('');
        setShowSuggestions(false);
        return true;
    }, [recipients]);

    const removeRecipient = useCallback((email) => {
        setRecipients((prev) => prev.filter((r) => r !== email));
    }, []);

    const selectUserSuggestion = useCallback((user) => {
        addRecipient(user.email);
    }, [addRecipient]);

    const handleEmailKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            if (emailInput.trim()) addRecipient(emailInput);
        } else if (e.key === 'Backspace' && !emailInput && recipients.length > 0) {
            removeRecipient(recipients[recipients.length - 1]);
        }
    }, [emailInput, recipients, addRecipient, removeRecipient]);

    const handleEmailBlur = useCallback(() => {
        setTimeout(() => {
            if (emailInput.trim()) addRecipient(emailInput);
            setShowSuggestions(false);
        }, 150);
    }, [emailInput, addRecipient]);

    // ── Day / week toggles ───────────────────────────────────────────────────

    const toggleDay = useCallback((dayId) => {
        setSelectedDays((prev) =>
            prev.includes(dayId) ? prev.filter((d) => d !== dayId) : [...prev, dayId]
        );
    }, []);

    const toggleWeek = useCallback((weekId) => {
        setSelectedWeeks((prev) =>
            prev.includes(weekId) ? prev.filter((w) => w !== weekId) : [...prev, weekId]
        );
    }, []);

    // ── Filter change ────────────────────────────────────────────────────────

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    // ── Submit ───────────────────────────────────────────────────────────────

    const handleSubmit = useCallback(async () => {
        if (!activeSource) {
            notify({ message: 'Please select a report.', type: 'warning', displayTime: 3000 });
            return;
        }
        if (!scheduleName.trim()) {
            notify({ message: 'Please enter a schedule name.', type: 'warning', displayTime: 3000 });
            return;
        }
        if (recipients.length === 0) {
            notify({ message: 'Add at least one recipient.', type: 'warning', displayTime: 3000 });
            return;
        }
        if (frequency === 'weekly' && selectedDays.length === 0) {
            notify({ message: 'Select at least one day of the week.', type: 'warning', displayTime: 3000 });
            return;
        }
        if (frequency !== 'monthly' && windowDays > offsetDays) {
            notify({ message: `Duration (${windowDays}d) cannot exceed start offset (${offsetDays}d) — the window would extend past the run date.`, type: 'warning', displayTime: 5000 });
            return;
        }

        setSubmitting(true);
        try {
            const formData = {
                reportSourceId: activeSource.id,
                reportName: scheduleName.trim(),
                recipientEmails: recipients,
                frequency,
                scheduleTime,
                scheduleDayOfWeekIds: frequency === 'weekly' ? selectedDays : [],
                scheduleWeekOfMonthIds: frequency === 'weekly' ? selectedWeeks : [],
                scheduleDayOfMonth: frequency === 'monthly' ? dayOfMonth : null,
                offsetDays: frequency !== 'monthly' ? offsetDays : undefined,
                windowDays: frequency !== 'monthly' ? windowDays : undefined,
                outputFormat: selectedFormat,
                filters,
            };

            // Edit mode — delegate to parent handler
            if (mode === 'edit' && typeof onUpdate === 'function') {
                await onUpdate(formData);
                setSubmitting(false);
                return;
            }

            // Create mode
            const currentUserName = currentUser?.userName || currentUser?.email || '';
            const recipientList = recipients.map((email) => {
                const match = userSuggestions.find((u) => u.email === email);
                return {
                    email,
                    name: match?.name || email,
                    userId: match?.id,
                };
            });

            const { success, request, error } = buildNotificationRequestFromForm(formData, recipientList, currentUserName);

            if (!success) {
                notify({ message: error || 'Failed to build schedule request.', type: 'error', displayTime: 5000 });
                setSubmitting(false);
                return;
            }

            await reportingService.scheduleReportEmail(request);
            notify({ message: 'Report schedule created successfully.', type: 'success', displayTime: 4000 });
            onClose();
        } catch (err) {
            notify({
                message: err?.response?.data?.message || err?.message || 'Failed to create schedule.',
                type: 'error',
                displayTime: 5000,
            });
        } finally {
            setSubmitting(false);
        }
    }, [mode, onUpdate,
        activeSource, scheduleName, recipients, frequency, scheduleTime,
        selectedDays, selectedWeeks, dayOfMonth, offsetDays, windowDays, selectedFormat, filters,
        currentUser, userSuggestions, onClose,
    ]);

    // ── Render helpers ───────────────────────────────────────────────────────

    const renderSourceSection = () => (
        <div className="schedule-report-panel__section">
            <p className="schedule-report-panel__section-title">Report Source</p>
            <div className="schedule-report-panel__field">
                <SelectBox
                    value={selectedSourceId}
                    dataSource={allSources}
                    valueExpr="id"
                    displayExpr="name"
                    onValueChanged={(e) => setSelectedSourceId(e.value)}
                    placeholder="Select a report..."
                    searchEnabled={true}
                    disabled={submitting || mode === 'edit'}
                    height={34}
                />
            </div>
        </div>
    );

    const renderNameSection = () => (
        <div className="schedule-report-panel__section">
            <p className="schedule-report-panel__section-title">Schedule Name</p>
            <div className="schedule-report-panel__field">
                <input
                    type="text"
                    className="schedule-report-panel__text-input"
                    value={scheduleName}
                    onChange={(e) => setScheduleName(e.target.value)}
                    placeholder="e.g. Daily Fuel Report"
                    disabled={submitting}
                />
            </div>
        </div>
    );

    const renderParametersSection = () => {
        if (!activeSource) return null;
        return (
            <div className="schedule-report-panel__section">
                <p className="schedule-report-panel__section-title">Parameters</p>
                <ReportParameterForm
                    parameters={activeSource.parameters}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                    excludeKeys={['dateFrom', 'dateTo']}
                />
            </div>
        );
    };

    const renderFrequencySection = () => (
        <div className="schedule-report-panel__section">
            <p className="schedule-report-panel__section-title">Schedule</p>

            {/* Frequency button group */}
            <div className="schedule-report-panel__field">
                <label className="schedule-report-panel__label">Frequency</label>
                <div className="schedule-report-panel__freq-group">
                    {FREQUENCY_OPTIONS.map((opt) => (
                        <button
                            key={opt.value}
                            type="button"
                            className={`schedule-report-panel__freq-btn${frequency === opt.value ? ' schedule-report-panel__freq-btn--active' : ''}`}
                            onClick={() => {
                                setFrequency(opt.value);
                                setSelectedDays([]);
                                setSelectedWeeks([]);
                                setDayOfMonth(1);
                            }}
                            disabled={submitting}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Time picker */}
            <div className="schedule-report-panel__field">
                <label className="schedule-report-panel__label">
                    {frequency === 'once' ? 'Run at' : 'Time of Day'}
                </label>
                <input
                    type="time"
                    className="schedule-report-panel__time-input"
                    value={scheduleTime}
                    onChange={(e) => setScheduleTime(e.target.value)}
                    disabled={submitting}
                />
            </div>

            {/* Weekly: Day of Week + Week of Month */}
            {frequency === 'weekly' && (
                <>
                    <div className="schedule-report-panel__field">
                        <label className="schedule-report-panel__label">Day(s) of Week</label>
                        <div className="schedule-report-panel__day-group">
                            {DAY_OPTIONS.map((day) => (
                                <button
                                    key={day.id}
                                    type="button"
                                    className={`schedule-report-panel__day-btn${selectedDays.includes(day.id) ? ' schedule-report-panel__day-btn--active' : ''}`}
                                    onClick={() => toggleDay(day.id)}
                                    disabled={submitting}
                                >
                                    {day.name}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="schedule-report-panel__field">
                        <label className="schedule-report-panel__label">Week(s) of Month</label>
                        <div className="schedule-report-panel__week-group">
                            {WEEK_OF_MONTH_OPTIONS.map((wk) => (
                                <button
                                    key={wk.id}
                                    type="button"
                                    className={`schedule-report-panel__week-btn${selectedWeeks.includes(wk.id) ? ' schedule-report-panel__week-btn--active' : ''}`}
                                    onClick={() => toggleWeek(wk.id)}
                                    disabled={submitting}
                                >
                                    {wk.name}
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}

            {/* Report window — visible for daily / weekly / once */}
            {frequency !== 'monthly' && (
                <div className="schedule-report-panel__field">
                    <label className="schedule-report-panel__label">Report Window</label>
                    <div className="tw-flex tw-items-center tw-gap-2">
                        <span className="schedule-report-panel__hint" style={{ margin: 0, whiteSpace: 'nowrap' }}>Start</span>
                        <input
                            type="number"
                            min={1}
                            max={90}
                            className="schedule-report-panel__time-input"
                            style={{ width: 52, padding: '4px 6px' }}
                            value={offsetDays}
                            onChange={(e) => {
                                const newOffset = Math.max(1, Math.min(90, parseInt(e.target.value, 10) || 1));
                                setOffsetDays(newOffset);
                                // Auto-clamp windowDays so it never exceeds offsetDays
                                if (windowDays > newOffset) setWindowDays(newOffset);
                            }}
                            disabled={submitting}
                        />
                        <span className="schedule-report-panel__hint" style={{ margin: 0, whiteSpace: 'nowrap' }}>day{offsetDays !== 1 ? 's' : ''} ago</span>
                        <span className="schedule-report-panel__hint" style={{ margin: '0 2px', opacity: 0.4 }}>|</span>
                        <span className="schedule-report-panel__hint" style={{ margin: 0, whiteSpace: 'nowrap' }}>Duration</span>
                        <input
                            type="number"
                            min={1}
                            max={offsetDays}
                            className="schedule-report-panel__time-input"
                            style={{ width: 52, padding: '4px 6px' }}
                            value={windowDays}
                            onChange={(e) => setWindowDays(Math.max(1, Math.min(offsetDays, parseInt(e.target.value, 10) || 1)))}
                            disabled={submitting}
                        />
                        <span className="schedule-report-panel__hint" style={{ margin: 0, whiteSpace: 'nowrap' }}>day{windowDays !== 1 ? 's' : ''}</span>
                    </div>
                    <p className="schedule-report-panel__hint">
                        Data from {offsetDays} day{offsetDays !== 1 ? 's' : ''} before run date, spanning {windowDays} day{windowDays !== 1 ? 's' : ''}
                        {windowDays > offsetDays && (
                            <span style={{ color: 'var(--m365-danger, #d13438)', marginLeft: 4 }}>
                                <i className="fa-light fa-triangle-exclamation" style={{ marginRight: 2 }} />
                                Duration exceeds offset — window extends past run date
                            </span>
                        )}
                    </p>
                </div>
            )}

            {/* Monthly: Day of month 1–31 */}
            {frequency === 'monthly' && (
                <div className="schedule-report-panel__field">
                    <label className="schedule-report-panel__label">Day of Month</label>
                    <div className="schedule-report-panel__day-of-month">
                        {Array.from({ length: 31 }, (_, i) => i + 1).map((d) => (
                            <button
                                key={d}
                                type="button"
                                className={`schedule-report-panel__dom-btn${dayOfMonth === d ? ' schedule-report-panel__dom-btn--active' : ''}`}
                                onClick={() => setDayOfMonth(d)}
                                disabled={submitting}
                            >
                                {d}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );

    const renderRecipientsSection = () => (
        <div className="schedule-report-panel__section">
            <p className="schedule-report-panel__section-title">Notify Recipients</p>
            <div className="schedule-report-panel__field">
                <label className="schedule-report-panel__label">Recipients</label>
                <div className="schedule-report-panel__recipients">
                    {recipients.length > 0 && (
                        <div className="schedule-report-panel__recipient-chips">
                            {recipients.map((email) => {
                                const matchedUser = userSuggestions.find((u) => u.email === email);
                                return (
                                    <div key={email} className="schedule-report-panel__chip">
                                        {matchedUser ? (
                                            <span title={email}>
                                                <strong>{matchedUser.name}</strong>
                                                <span className="schedule-report-panel__chip-email"> ({email})</span>
                                            </span>
                                        ) : (
                                            <span>{email}</span>
                                        )}
                                        {!submitting && (
                                            <button
                                                type="button"
                                                className="schedule-report-panel__chip-remove"
                                                onClick={() => removeRecipient(email)}
                                                aria-label={`Remove ${email}`}
                                            >
                                                <i className="fa-light fa-xmark"></i>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                    {!submitting && (
                        <div className="schedule-report-panel__input-wrapper">
                            <input
                                ref={emailInputRef}
                                type="text"
                                className="schedule-report-panel__email-input"
                                placeholder={recipients.length === 0 ? 'Search users or type an email...' : 'Add another...'}
                                value={emailInput}
                                onChange={(e) => {
                                    setEmailInput(e.target.value);
                                    setEmailError('');
                                    setShowSuggestions(true);
                                }}
                                onFocus={() => setShowSuggestions(true)}
                                onKeyDown={handleEmailKeyDown}
                                onBlur={handleEmailBlur}
                                autoComplete="off"
                            />
                            {showSuggestions && filteredSuggestions.length > 0 && (
                                <div className="schedule-report-panel__suggestions" ref={suggestionsRef}>
                                    {filteredSuggestions.slice(0, 8).map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            className="schedule-report-panel__suggestion-item"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => selectUserSuggestion(user)}
                                        >
                                            <div className="schedule-report-panel__suggestion-avatar">
                                                {(user.name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="schedule-report-panel__suggestion-info">
                                                <span className="schedule-report-panel__suggestion-name">{user.name}</span>
                                                <span className="schedule-report-panel__suggestion-email">{user.email}</span>
                                            </div>
                                            {currentUser && user.email === (currentUser.email || '').toLowerCase() && (
                                                <span className="schedule-report-panel__suggestion-badge">You</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {emailError && <p className="schedule-report-panel__validation">{emailError}</p>}
                <p className="schedule-report-panel__hint">
                    Search by name or email. Press Enter to add a custom email address.
                </p>
            </div>
        </div>
    );

    const renderFormatSection = () => (
        <div className="schedule-report-panel__section">
            <p className="schedule-report-panel__section-title">Output Format</p>
            <div className="schedule-report-panel__formats">
                {FORMAT_OPTIONS.map((fmt) => (
                    <button
                        key={fmt.value}
                        type="button"
                        disabled={submitting}
                        className={`schedule-report-panel__format-btn${selectedFormat === fmt.value ? ' schedule-report-panel__format-btn--active' : ''}`}
                        onClick={() => setSelectedFormat(fmt.value)}
                    >
                        <i className={fmt.icon}></i>
                        {fmt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const canSubmit = activeSource && scheduleName.trim() && recipients.length > 0 && !submitting;

    // ── Render ───────────────────────────────────────────────────────────────

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title={mode === 'edit' ? 'Edit Schedule' : 'Schedule Report'}
            width={460}
        >
            <div className="schedule-report-panel">
                <div className="schedule-report-panel__body">
                    {renderSourceSection()}
                    {renderNameSection()}
                    {renderParametersSection()}
                    {renderFrequencySection()}
                    {renderRecipientsSection()}
                    {renderFormatSection()}
                </div>

                {/* Footer */}
                <div className="schedule-report-panel__footer">
                    <button
                        type="button"
                        className="schedule-report-panel__submit-btn"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        <i className={submitting ? 'fa-light fa-spinner-third fa-spin' : 'fa-light fa-calendar-check'}></i>
                        {submitting ? 'Saving...' : mode === 'edit' ? 'Save Changes' : 'Schedule Report'}
                    </button>
                    <button
                        type="button"
                        className="schedule-report-panel__cancel-btn"
                        onClick={onClose}
                        disabled={submitting}
                    >
                        Cancel
                    </button>
                </div>
            </div>
        </SlidePanel>
    );
};

export default ScheduleReportPanel;
