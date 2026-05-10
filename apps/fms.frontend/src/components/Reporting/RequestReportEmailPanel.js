/**
 * File: RequestReportEmailPanel.js
 * Purpose: Slide-in panel for requesting a report to be generated and delivered via email.
 *          User selects a report source, fills in parameters, chooses output format,
 *          adds one or more email recipients, then submits. The report is generated
 *          in the background and emailed as an attachment.
 *          Follows M365 Admin Center Fluent design language.
 * Dependencies: SlidePanel, ReportParameterForm, reportSourceRegistry, useReportJobTracking, reportJobApi
 * Last Modified: 2026-02-27
 *
 * Key Components:
 * - RequestReportEmailPanel: Full slide-in email-report request form
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { SelectBox } from 'devextreme-react/select-box';
import notify from 'devextreme/ui/notify';
import SlidePanel from '../ui/SlidePanel';
import ReportParameterForm from '../../pages/reports/engine/ReportParameterForm';
import { filterReportSourcesByPermission, getAllReportSources, getReportSource } from '../../pages/reports/sources/reportSourceRegistry';
import { submitReportJob } from '../../api/reportJobApi';
import { fetchUsers } from '../../redux/actions/userActions';
import { usePermissions } from '../../hooks/usePermissions';
import './RequestReportEmailPanel.scss';

/** Email format options */
const FORMAT_OPTIONS = [
    { value: 'pdf', label: 'PDF', icon: 'fa-light fa-file-pdf' },
    { value: 'excel', label: 'Excel', icon: 'fa-light fa-file-excel' },
    { value: 'html', label: 'HTML', icon: 'fa-light fa-globe' },
];

/** Simple email regex for client validation */
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const RequestReportEmailPanel = ({ open, onClose, initialSourceId = '' }) => {
    const dispatch = useDispatch();
    const systemUsers = useSelector((state) => state.user?.users || []);
    const currentUser = useSelector((state) => state.auth?.user);
    const { hasPermission } = usePermissions();

    // ── Report source ──
    const allSources = useMemo(
        () => filterReportSourcesByPermission(getAllReportSources(), hasPermission),
        [hasPermission]
    );
    const [selectedSourceId, setSelectedSourceId] = useState(initialSourceId);
    const activeSource = useMemo(
        () => allSources.find((source) => source.id === selectedSourceId) || null,
        [allSources, selectedSourceId]
    );

    // ── Parameters & format ──
    const [filters, setFilters] = useState({});
    const [selectedFormat, setSelectedFormat] = useState('pdf');

    // ── Email recipients ──
    const [recipients, setRecipients] = useState([]);
    const [emailInput, setEmailInput] = useState('');
    const [emailError, setEmailError] = useState('');
    const [showSuggestions, setShowSuggestions] = useState(false);
    const emailInputRef = useRef(null);
    const suggestionsRef = useRef(null);

    // Load users when panel opens
    useEffect(() => {
        if (open && systemUsers.length === 0) {
            dispatch(fetchUsers());
        }
    }, [open, systemUsers.length, dispatch]);

    // Build searchable user list from system users
    const userSuggestions = useMemo(() => {
        const list = (systemUsers || []).filter((u) => {
            const email = u?.email || u?.Email;
            return email && !u?.isDeleted;
        }).map((u) => ({
            id: u.userId || u.id,
            name: u.userName || u.username || u.name || '',
            email: (u.email || u.Email || '').toLowerCase(),
        }));

        // Put current user first if they have an email
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

    // Filter suggestions by search input and exclude already-added emails
    const filteredSuggestions = useMemo(() => {
        const q = emailInput.trim().toLowerCase();
        return userSuggestions.filter((u) => {
            if (recipients.includes(u.email)) return false;
            if (!q) return true;
            return u.name.toLowerCase().includes(q) || u.email.includes(q);
        });
    }, [emailInput, userSuggestions, recipients]);

    // Close suggestions when clicking outside
    useEffect(() => {
        if (!showSuggestions) return;
        const handleClick = (e) => {
            if (
                suggestionsRef.current &&
                !suggestionsRef.current.contains(e.target) &&
                emailInputRef.current !== e.target
            ) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [showSuggestions]);

    // ── Submitting state ──
    const [submitting, setSubmitting] = useState(false);

    // Sync initialSourceId when panel opens
    useEffect(() => {
        if (open && initialSourceId) {
            setSelectedSourceId(initialSourceId);
        }
    }, [open, initialSourceId]);

    // Initialize filters when source changes
    useEffect(() => {
        if (activeSource) {
            const defaults = {};
            activeSource.parameters.forEach((p) => {
                if (typeof p.defaultValue === 'function') {
                    defaults[p.key] = p.defaultValue();
                } else if (p.defaultValue !== undefined) {
                    defaults[p.key] = p.defaultValue;
                } else {
                    defaults[p.key] = activeSource.defaultFilters?.[p.key] ?? null;
                }
            });
            setFilters(defaults);
        }
    }, [activeSource]);

    // Reset state when panel closes
    useEffect(() => {
        if (!open) {
            const timer = setTimeout(() => {
                setSubmitting(false);
                setRecipients([]);
                setEmailInput('');
                setEmailError('');
                setSelectedFormat('pdf');
            }, 300);
            return () => clearTimeout(timer);
        }
    }, [open]);

    // ── Handlers ──
    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => ({ ...prev, [key]: value }));
    }, []);

    const addRecipient = useCallback((email) => {
        const trimmed = email.trim().toLowerCase();
        if (!trimmed) return;
        if (!EMAIL_REGEX.test(trimmed)) {
            setEmailError('Invalid email address');
            return;
        }
        if (recipients.includes(trimmed)) {
            setEmailError('Email already added');
            return;
        }
        setRecipients((prev) => [...prev, trimmed]);
        setEmailInput('');
        setEmailError('');
        setShowSuggestions(false);
    }, [recipients]);

    /** Select a user from the suggestion dropdown */
    const selectUserSuggestion = useCallback((user) => {
        addRecipient(user.email);
        emailInputRef.current?.focus();
    }, [addRecipient]);

    const handleEmailKeyDown = useCallback((e) => {
        if (e.key === 'Enter' || e.key === ',' || e.key === ';' || e.key === 'Tab') {
            e.preventDefault();
            if (emailInput.trim()) {
                addRecipient(emailInput);
            }
        }
        if (e.key === 'Backspace' && !emailInput && recipients.length > 0) {
            setRecipients((prev) => prev.slice(0, -1));
        }
        if (e.key === 'Escape') {
            setShowSuggestions(false);
        }
    }, [emailInput, recipients, addRecipient]);

    const handleEmailBlur = useCallback(() => {
        // Delay so click on suggestion can register first
        setTimeout(() => {
            if (emailInput.trim()) {
                addRecipient(emailInput);
            }
        }, 150);
    }, [emailInput, addRecipient]);

    const removeRecipient = useCallback((email) => {
        setRecipients((prev) => prev.filter((r) => r !== email));
    }, []);

    /** Build query params matching ReportEngine's buildQueryParams */
    const buildQueryParams = useCallback(() => {
        const params = {};
        if (!activeSource) return params;
        activeSource.parameters.forEach((p) => {
            const val = filters[p.key];
            const paramName = p.queryParam || p.key;
            if (val instanceof Date) {
                const yyyy = val.getFullYear();
                const mm = String(val.getMonth() + 1).padStart(2, '0');
                const dd = String(val.getDate()).padStart(2, '0');
                params[paramName] = `${yyyy}-${mm}-${dd}`;
            } else if (Array.isArray(val)) {
                if (p.multiSelect === false) {
                    if (val.length > 0 && val[0] !== null && val[0] !== undefined && val[0] !== '') {
                        params[paramName] = String(val[0]);
                    }
                } else if (val.length > 0) {
                    params[paramName] = val.join(',');
                }
            } else if (val !== null && val !== undefined && val !== '') {
                params[paramName] = String(val);
            }
        });
        return params;
    }, [activeSource, filters]);

    const handleSubmit = useCallback(async () => {
        // Validate
        if (!activeSource) {
            notify({ message: 'Please select a report source', type: 'warning' });
            return;
        }

        const missing = activeSource.parameters
            .filter((p) => {
                const val = filters[p.key];
                if (!p.required) return false;
                if (val === null || val === undefined || val === '') return true;
                if (Array.isArray(val) && val.length === 0) return true;
                return false;
            })
            .map((p) => p.label);

        if (missing.length > 0) {
            notify({ message: `Missing required fields: ${missing.join(', ')}`, type: 'warning' });
            return;
        }

        if (recipients.length === 0) {
            setEmailError('Add at least one email recipient');
            emailInputRef.current?.focus();
            return;
        }

        const templateName = activeSource.defaultTemplate;
        if (!templateName) {
            notify({ message: 'No template configured for this report', type: 'warning' });
            return;
        }

        // Build parameters
        const paramMap = buildQueryParams();

        // Submit job — fire-and-forget, backend handles everything
        setSubmitting(true);
        try {
            await submitReportJob({
                sourceId: activeSource.id,
                templateName,
                outputFormat: selectedFormat,
                reportTitle: activeSource.name,
                parameters: paramMap,
                deliverByEmail: true,
                emailAddress: recipients.join(','),
            });

            notify({
                message: `Report queued. You'll receive it at ${recipients.join(', ')} when ready.`,
                type: 'success',
                displayTime: 4000,
            });

            // Close panel immediately
            onClose?.();
        } catch (err) {
            notify({
                message: err?.response?.data?.message || err?.message || 'Failed to submit report request',
                type: 'error',
                displayTime: 5000,
            });
            setSubmitting(false);
        }
    }, [activeSource, filters, recipients, selectedFormat, buildQueryParams, onClose]);

    // ── Render Helpers ──
    const renderSourceSelector = () => (
        <div className="email-report-panel__section">
            <p className="email-report-panel__section-title">Report Source</p>
            <div className="email-report-panel__field">
                <SelectBox
                    value={selectedSourceId}
                    dataSource={allSources}
                    valueExpr="id"
                    displayExpr="name"
                    onValueChanged={(e) => setSelectedSourceId(e.value)}
                    placeholder="Select a report..."
                    searchEnabled={true}
                    disabled={submitting}
                    height={34}
                />
            </div>
        </div>
    );

    const renderParameters = () => {
        if (!activeSource) return null;
        return (
            <div className="email-report-panel__section">
                <p className="email-report-panel__section-title">Parameters</p>
                <ReportParameterForm
                    parameters={activeSource.parameters}
                    filters={filters}
                    onFilterChange={handleFilterChange}
                />
            </div>
        );
    };

    const renderFormatSelector = () => (
        <div className="email-report-panel__section">
            <p className="email-report-panel__section-title">Output Format</p>
            <div className="email-report-panel__formats">
                {FORMAT_OPTIONS.map((fmt) => (
                    <button
                        key={fmt.value}
                        type="button"
                        disabled={submitting}
                        className={`email-report-panel__format-btn ${selectedFormat === fmt.value ? 'email-report-panel__format-btn--active' : ''}`}
                        onClick={() => setSelectedFormat(fmt.value)}
                    >
                        <i className={fmt.icon}></i>
                        {fmt.label}
                    </button>
                ))}
            </div>
        </div>
    );

    const renderRecipients = () => (
        <div className="email-report-panel__section">
            <p className="email-report-panel__section-title">Send To</p>
            <div className="email-report-panel__field">
                <label className="email-report-panel__label">Recipients</label>
                <div className="email-report-panel__recipients">
                    {recipients.length > 0 && (
                        <div className="email-report-panel__recipient-chips">
                            {recipients.map((email) => {
                                // Find matching user to show name
                                const matchedUser = userSuggestions.find((u) => u.email === email);
                                return (
                                    <div key={email} className="email-report-panel__chip">
                                        {matchedUser ? (
                                            <span title={email}>
                                                <strong>{matchedUser.name}</strong>
                                                <span className="email-report-panel__chip-email"> ({email})</span>
                                            </span>
                                        ) : (
                                            <span>{email}</span>
                                        )}
                                        {!submitting && (
                                            <button
                                                type="button"
                                                className="email-report-panel__chip-remove"
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
                        <div className="email-report-panel__input-wrapper">
                            <input
                                ref={emailInputRef}
                                type="text"
                                className="email-report-panel__email-input"
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
                                <div className="email-report-panel__suggestions" ref={suggestionsRef}>
                                    {filteredSuggestions.slice(0, 8).map((user) => (
                                        <button
                                            key={user.id}
                                            type="button"
                                            className="email-report-panel__suggestion-item"
                                            onMouseDown={(e) => e.preventDefault()}
                                            onClick={() => selectUserSuggestion(user)}
                                        >
                                            <div className="email-report-panel__suggestion-avatar">
                                                {(user.name || user.email).charAt(0).toUpperCase()}
                                            </div>
                                            <div className="email-report-panel__suggestion-info">
                                                <span className="email-report-panel__suggestion-name">{user.name}</span>
                                                <span className="email-report-panel__suggestion-email">{user.email}</span>
                                            </div>
                                            {currentUser && user.email === (currentUser.email || '').toLowerCase() && (
                                                <span className="email-report-panel__suggestion-badge">You</span>
                                            )}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
                {emailError && <p className="email-report-panel__validation">{emailError}</p>}
                <p className="email-report-panel__hint">
                    Search by name or email. Press Enter to add a custom email address.
                </p>
            </div>
        </div>
    );

    const renderSummary = () => {
        if (!activeSource) return null;
        return (
            <div className="email-report-panel__info-card">
                <div className="email-report-panel__info-row">
                    <span className="email-report-panel__info-label">Report</span>
                    <span className="email-report-panel__info-value">{activeSource.name}</span>
                </div>
                <div className="email-report-panel__info-row">
                    <span className="email-report-panel__info-label">Format</span>
                    <span className="email-report-panel__info-value">{selectedFormat.toUpperCase()}</span>
                </div>
                <div className="email-report-panel__info-row">
                    <span className="email-report-panel__info-label">Recipients</span>
                    <span className="email-report-panel__info-value">{recipients.length}</span>
                </div>
            </div>
        );
    };

    // Determine if submit is allowed
    const canSubmit = activeSource && recipients.length > 0 && !submitting;

    return (
        <SlidePanel
            open={open}
            onClose={onClose}
            title="Request Report via Email"
            width={420}
        >
            <div className="email-report-panel">
                <div className="email-report-panel__body">
                    {renderSourceSelector()}
                    {renderParameters()}
                    {renderFormatSelector()}
                    {renderRecipients()}
                    {renderSummary()}
                </div>

                {/* Footer */}
                <div className="email-report-panel__footer">
                    <button
                        type="button"
                        className="email-report-panel__submit-btn"
                        disabled={!canSubmit}
                        onClick={handleSubmit}
                    >
                        <i className={submitting ? 'fa-light fa-spinner-third fa-spin' : 'fa-light fa-paper-plane'}></i>
                        {submitting ? 'Submitting...' : 'Send Report'}
                    </button>
                    <button
                        type="button"
                        className="email-report-panel__cancel-btn"
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

export default RequestReportEmailPanel;
