/**
 * File: ReportEngine.js
 * Purpose: Central report orchestrator. Given a report source, it:
 *          1) Renders the dynamic parameter form
 *          2) Calls the JSReport backend to generate output (HTML/PDF/Excel)
 *          3) Displays the result in the output viewer
 *          4) Supports scheduling and template override
 * Dependencies: React, ReportParameterForm, ReportFormatSelector, ReportOutputViewer,
 *               reportSourceRegistry, reportingService
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportEngine: Full-page report runner with sidebar filters + preview
 */

import React, { useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { SelectBox } from 'devextreme-react/select-box';
import ProgressBar from 'devextreme-react/progress-bar';
import notify from 'devextreme/ui/notify';
import { filterReportSourcesByPermission, getAllReportSources } from '../sources/reportSourceRegistry';
import ReportParameterForm from './ReportParameterForm';
import ReportFormatSelector from './ReportFormatSelector';
import ReportOutputViewer from './ReportOutputViewer';
import buildJsReportPayload from './reportDataBuilder';
import reportingService from '../../../services/reportingService';
import useReportJobTracking from '../../../hooks/useReportJobTracking';
import { ReportJobStatus } from '../../../hooks/useReportJobTracking';
import RequestReportEmailPanel from '../../../components/Reporting/RequestReportEmailPanel';
import ScheduleReportPanel from '../../../components/Reporting/ScheduleReportPanel';
import { usePermissions } from '../../../hooks/usePermissions';
import './ReportEngine.scss';

const ReportEngine = () => {
    const { sourceId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    // Source selection
    const allSources = useMemo(
        () => filterReportSourcesByPermission(getAllReportSources(), hasPermission),
        [hasPermission]
    );
    const [activeSourceId, setActiveSourceId] = useState(sourceId || '');
    const activeSource = useMemo(
        () => allSources.find((source) => source.id === activeSourceId) || null,
        [activeSourceId, allSources]
    );
    const hasNotifiedMissingSourceRef = useRef(false);

    // State
    const [filters, setFilters] = useState({});
    const [selectedFormat, setSelectedFormat] = useState('html');
    const [templateOverride, setTemplateOverride] = useState('');
    const [templates, setTemplates] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [lastGenerated, setLastGenerated] = useState(null);

    // Email panel
    const [emailPanelOpen, setEmailPanelOpen] = useState(false);

    // Schedule panel
    const [schedulePanelOpen, setSchedulePanelOpen] = useState(false);

    // Async report job tracking
    const {
        activeJob: reportJob,
        isTracking: isReportTracking,
        error: reportError,
        submitJob: submitReportJob,
        cancelActiveJob: cancelReportJob,
        downloadResult: downloadReport,
        fetchHtmlContent,
        dismissJob: dismissReportJob,
        emailWhenDone: emailWhenDoneReport,
    } = useReportJobTracking();

    // Email-when-done: show button after 10s of active tracking
    const [emailVisible, setEmailVisible] = useState(false);
    const emailTimerRef = useRef(null);
    useEffect(() => {
        if (isReportTracking) {
            setEmailVisible(false);
            emailTimerRef.current = setTimeout(() => setEmailVisible(true), 10000);
        } else {
            clearTimeout(emailTimerRef.current);
            setEmailVisible(false);
        }
        return () => clearTimeout(emailTimerRef.current);
    }, [isReportTracking]);

    // Clear previous output when a new job starts so stale content isn't shown
    useEffect(() => {
        if (isReportTracking) {
            setHtmlContent('');
            setLastGenerated(null);
        }
    }, [isReportTracking]);

    // Auto-render HTML (or auto-download PDF/Excel) when async job completes.
    // Track by jobId instead of status so re-running the same report still triggers.
    const prevCompletedJobIdRef = useRef(null);
    useEffect(() => {
        const status = reportJob?.status;
        const jobId = reportJob?.jobId;

        if (
            status === ReportJobStatus.Completed &&
            jobId &&
            prevCompletedJobIdRef.current !== jobId
        ) {
            prevCompletedJobIdRef.current = jobId;
            if (selectedFormat === 'html') {
                fetchHtmlContent().then((html) => {
                    if (html) {
                        setHtmlContent(html);
                        setLastGenerated(new Date());
                    }
                });
            } else {
                // Auto-download PDF / Excel when background job finishes
                downloadReport();
            }
        }
    }, [reportJob?.status, reportJob?.jobId, selectedFormat, fetchHtmlContent, downloadReport]);

    const activeErrorMessage = useMemo(() => {
        if (reportError) {
            return reportError;
        }

        if (reportJob?.status === ReportJobStatus.Failed) {
            return reportJob?.statusMessage || reportJob?.errorMessage || 'Report generation failed';
        }

        return '';
    }, [reportError, reportJob?.status, reportJob?.statusMessage, reportJob?.errorMessage]);

    const lastNotifiedErrorRef = useRef('');
    useEffect(() => {
        const notificationKey = `${reportJob?.jobId || 'no-job'}:${activeErrorMessage}`;
        if (!activeErrorMessage || lastNotifiedErrorRef.current === notificationKey) {
            return;
        }

        lastNotifiedErrorRef.current = notificationKey;
        notify({
            message: activeErrorMessage,
            type: 'error',
            displayTime: 5000,
        });
    }, [activeErrorMessage, reportJob?.jobId]);

    // Sync source from URL params
    useEffect(() => {
        if (sourceId && allSources.some((source) => source.id === sourceId) && sourceId !== activeSourceId) {
            setActiveSourceId(sourceId);
        }
    }, [activeSourceId, allSources, sourceId]);

    useEffect(() => {
        if (!sourceId) {
            hasNotifiedMissingSourceRef.current = false;
            return;
        }

        if (!allSources.length) {
            setActiveSourceId('');
            return;
        }

        if (allSources.some((source) => source.id === sourceId)) {
            hasNotifiedMissingSourceRef.current = false;
            return;
        }

        const fallbackSourceId = allSources[0]?.id || '';
        if (fallbackSourceId && activeSourceId !== fallbackSourceId) {
            setActiveSourceId(fallbackSourceId);
            navigate(`/reports/engine/${fallbackSourceId}`, { replace: true });
        }

        if (!hasNotifiedMissingSourceRef.current) {
            notify({
                message: 'You do not have access to that report source.',
                type: 'warning',
                displayTime: 3000,
            });
            hasNotifiedMissingSourceRef.current = true;
        }
    }, [activeSourceId, allSources, navigate, sourceId]);

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
            setHtmlContent('');
            setLastGenerated(null);
            setSelectedFormat('html');
            setTemplateOverride('');
        }
    }, [activeSource]);

    // Load available templates
    useEffect(() => {
        const loadTemplates = async () => {
            try {
                const result = await reportingService.getJsReportTemplates();
                if (result.success) {
                    setTemplates(result.data || []);
                }
            } catch (err) {
                console.error('Error loading templates:', err);
            }
        };
        loadTemplates();
    }, []);

    // Check for template override from URL
    useEffect(() => {
        const tpl = searchParams.get('template');
        if (tpl) {
            setTemplateOverride(tpl);
        }
    }, [searchParams]);

    const handleSourceChange = useCallback(
        (newSourceId) => {
            setActiveSourceId(newSourceId);
            navigate(`/reports/engine/${newSourceId}`, { replace: true });
        },
        [navigate]
    );

    const handleFilterChange = useCallback((key, value) => {
        setFilters((prev) => {
            const updated = { ...prev, [key]: value };
            return updated;
        });
    }, []);

    /**
     * Build query params for the source API endpoint
     */
    const buildQueryParams = useCallback(() => {
        const params = {};
        if (!activeSource) return params;

        activeSource.parameters.forEach((p) => {
            const val = filters[p.key];
            // Use queryParam if specified, otherwise use key as the backend param name
            const paramName = p.queryParam || p.key;
            if (val instanceof Date) {
                // Send dates as yyyy-MM-dd (compatible with both string and DateTime params)
                const yyyy = val.getFullYear();
                const mm = String(val.getMonth() + 1).padStart(2, '0');
                const dd = String(val.getDate()).padStart(2, '0');
                params[paramName] = `${yyyy}-${mm}-${dd}`;
            } else if (Array.isArray(val)) {
                if (p.multiSelect === false) {
                    if (val.length > 0 && val[0] !== null && val[0] !== undefined && val[0] !== '') {
                        params[paramName] = val[0];
                    }
                } else if (val.length > 0) {
                    // Keep arrays as-is — fetchReportData handles repeated key serialization
                    params[paramName] = val;
                }
                // If empty array, don't send param (means "all")
            } else if (val !== null && val !== undefined && val !== '') {
                params[paramName] = val;
            }
        });

        return params;
    }, [activeSource, filters]);

    /**
     * Generate report — pump-transaction uses sync flow, everything else
     * submits an async background job so the progress bar + "Email When Done"
     * appear immediately (no 30 s loading-spinner wait).
     */
    const handleGenerate = useCallback(async () => {
        if (!activeSource) {
            notify({ message: 'Please select a report source', type: 'warning' });
            return;
        }

        // Validate required parameters
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

        // Date range validation — works for any source that has two date-type parameters
        const dateParams = (activeSource.parameters || []).filter((p) => p.type === 'date');
        if (dateParams.length >= 2) {
            const fromParam = dateParams[0];
            const toParam = dateParams[1];
            const fromVal = filters[fromParam.key];
            const toVal = filters[toParam.key];
            if (!fromVal || !toVal) {
                notify({ message: `Please select both ${fromParam.label} and ${toParam.label}`, type: 'warning' });
                return;
            }
            const fromDate = fromVal instanceof Date ? fromVal : new Date(fromVal);
            const toDate = toVal instanceof Date ? toVal : new Date(toVal);
            if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
                notify({ message: 'Invalid date selection — please re-select the dates', type: 'warning' });
                return;
            }
            if (fromDate > toDate) {
                notify({ message: `${fromParam.label} must be on or before ${toParam.label}`, type: 'warning' });
                return;
            }
        }

        const templateName = templateOverride || activeSource.defaultTemplate;
        if (!templateName) {
            notify({ message: 'No template selected or configured for this report', type: 'warning' });
            return;
        }

        const _t0 = Date.now();

        // ── Pump-transaction: dedicated sync endpoint ─────────────────────
        if (activeSource.id === 'pump-transaction') {
            setGenerating(true);
            try {
                const reportData = buildQueryParams();
                const result = await reportingService.generatePumpTransactionReport({
                    ...reportData,
                    format: selectedFormat,
                });
                if (result.success) {
                    if (selectedFormat === 'html') {
                        setHtmlContent(result.html);
                    } else {
                        reportingService.downloadReportFile(result.blob, result.fileName);
                        notify({ message: `${selectedFormat.toUpperCase()} downloaded successfully`, type: 'success' });
                    }
                    setLastGenerated(new Date());
                    reportingService.logExecution({
                        exportFormat: selectedFormat,
                        filters: JSON.stringify({ sourceId: activeSource.id, sourceName: activeSource.name, ...reportData }),
                        success: true,
                        executionTimeMs: Date.now() - _t0,
                    });
                } else {
                    notify({ message: result.error || 'Error generating report', type: 'error' });
                    reportingService.logExecution({
                        exportFormat: selectedFormat,
                        filters: JSON.stringify({ sourceId: activeSource.id, sourceName: activeSource.name }),
                        success: false,
                        errorMessage: result.error || 'Report generation failed',
                        executionTimeMs: Date.now() - _t0,
                    });
                }
            } catch (err) {
                console.error('Report generation error:', err);
                notify({ message: 'Error generating report', type: 'error' });
                reportingService.logExecution({
                    exportFormat: selectedFormat,
                    filters: JSON.stringify({ sourceId: activeSource.id, sourceName: activeSource.name }),
                    success: false,
                    errorMessage: err?.message || 'Unexpected error',
                });
            } finally {
                setGenerating(false);
            }
            return;
        }

        // Build params once for preview/async paths
        const params = buildQueryParams();
        const useUnifiedBackendPath =
            activeSource?.id === 'tank-volume-history' ||
            activeSource?.id === 'transaction-history-summary' ||
            activeSource?.id === 'consumption-by-refills' ||
            activeSource?.id === 'warning-letter-candidates' ||
            activeSource?.id === 'monthly-fleet-report' ||
            activeSource?.id === 'weekly-fleet-report';

        // ── HTML preview: try sync preview, then auto-fallback to background on timeout ──
        if (selectedFormat === 'html' && !useUnifiedBackendPath) {
            setGenerating(true);
            try {
                const dataResult = await reportingService.fetchReportData(activeSource.apiEndpoint, params);
                if (!dataResult.success) {
                    notify({ message: dataResult.error || 'Error fetching report data', type: 'error' });
                    return;
                }

                const reportData = buildJsReportPayload({
                    sourceId: activeSource.id,
                    sourceName: activeSource.name,
                    apiResponse: dataResult.data,
                    queryParams: params,
                });

                // ── Large-payload bypass ──────────────────────────────────────
                // Skip the synchronous preview entirely when the dataset is too
                // large to render within the 12-second timeout window.  Instead,
                // show an immediate informational message and fall through to the

                if (selectedFormat === 'html' && useUnifiedBackendPath) {
                    notify({
                        message: 'Generating HTML in background to keep HTML/PDF output identical...',
                        type: 'info',
                        displayTime: 2800,
                    });
                }
                // async background job path below.
                const _recordArray = Array.isArray(dataResult.data?.data)
                    ? dataResult.data.data
                    : Array.isArray(dataResult.data) ? dataResult.data : [];
                const _estimatedKb = JSON.stringify(reportData).length / 1024;
                const _isLargePayload = _recordArray.length > 200 || _estimatedKb > 300;

                if (_isLargePayload) {
                    notify({
                        message: `Large dataset (${_recordArray.length.toLocaleString()} records) — generating in background...`,
                        type: 'info',
                        displayTime: 3500,
                    });
                    // setGenerating(false) runs in finally; fall through to async submission
                } else {
                    const previewResult = await reportingService.previewJsReport(templateName, reportData, {
                        timeoutMs: 12000,
                    });

                    if (previewResult.success) {
                        setHtmlContent(previewResult.html);
                        setLastGenerated(new Date());
                        reportingService.logExecution({
                            exportFormat: 'html',
                            filters: JSON.stringify({ sourceId: activeSource.id, sourceName: activeSource.name, ...params }),
                            success: true,
                            recordCount: _recordArray.length || null,
                            executionTimeMs: Date.now() - _t0,
                        });
                        return;
                    }

                    const isTimeout =
                        previewResult.error?.includes('timeout') ||
                        previewResult.error?.includes('ECONNABORTED') ||
                        previewResult.error?.includes('12000ms');

                    if (!isTimeout) {
                        notify({ message: previewResult.error || 'Error generating preview', type: 'error' });
                        return;
                    }

                    notify({
                        message: 'Preview is taking too long. Switching to background generation...',
                        type: 'info',
                        displayTime: 3500,
                    });
                }
            } catch (err) {
                const isTimeout = err?.message?.includes('timeout') || err?.code === 'ECONNABORTED';
                if (!isTimeout) {
                    console.error('HTML preview error:', err);
                    notify({ message: 'Error generating preview', type: 'error' });
                    return;
                }

                notify({
                    message: 'Preview is taking too long. Switching to background generation...',
                    type: 'info',
                    displayTime: 3500,
                });
            } finally {
                setGenerating(false);
            }
            // continue to async submission below after timeout
        }

        // ── PDF / Excel / CSV (and HTML-timeout fallback): async background job ──
        const paramMap = {};
        Object.entries(params).forEach(([k, v]) => {
            paramMap[k] = Array.isArray(v) ? v.join(',') : String(v);
        });

        // Include browser timezone so the backend can convert local dates → UTC
        if (!paramMap.timeZone) {
            paramMap.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        }

        const result = await submitReportJob({
            sourceId: activeSource.id,
            templateName,
            outputFormat: selectedFormat,
            parameters: paramMap,
            deliverByEmail: false,
        });

        if (result) {
            notify({
                message: 'Report generation started. Track progress below.',
                type: 'info',
                displayTime: 3000,
            });
            reportingService.logExecution({
                exportFormat: selectedFormat,
                filters: JSON.stringify({ sourceId: activeSource.id, sourceName: activeSource.name, ...params }),
                success: true,
                executionTimeMs: Date.now() - _t0,
            });
        } else {
            notify({ message: 'Failed to start report generation', type: 'error' });
            reportingService.logExecution({
                exportFormat: selectedFormat,
                filters: JSON.stringify({ sourceId: activeSource.id, sourceName: activeSource.name }),
                success: false,
                errorMessage: 'Failed to start background report job',
                executionTimeMs: Date.now() - _t0,
            });
        }
    }, [activeSource, filters, selectedFormat, templateOverride, buildQueryParams, submitReportJob]);

    const handleDownloadAs = useCallback(
        async (format) => {
            if (!activeSource) return;
            const prev = selectedFormat;
            setSelectedFormat(format);
            const templateName = templateOverride || activeSource.defaultTemplate;
            if (!templateName) return;

            // Sources that have no direct data endpoint must go through the background job path
            const backendOnlySources = ['tank-volume-history', 'transaction-history-summary', 'monthly-fleet-report', 'weekly-fleet-report'];
            if (backendOnlySources.includes(activeSource.id)) {
                const queryParams = buildQueryParams();
                const paramMap = {};
                Object.entries(queryParams).forEach(([k, v]) => {
                    paramMap[k] = Array.isArray(v) ? v.join(',') : String(v);
                });
                if (!paramMap.timeZone) {
                    paramMap.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
                }
                const result = await submitReportJob({
                    sourceId: activeSource.id,
                    templateName,
                    outputFormat: format,
                    parameters: paramMap,
                    deliverByEmail: false,
                });
                if (result) {
                    notify({ message: `${format.toUpperCase()} generation started. Track progress below.`, type: 'info', displayTime: 3000 });
                } else {
                    notify({ message: 'Failed to start report generation', type: 'error' });
                }
                setSelectedFormat(prev);
                return;
            }

            setGenerating(true);
            try {
                const queryParams = buildQueryParams();

                if (activeSource.id === 'pump-transaction') {
                    const result = await reportingService.generatePumpTransactionReport({ ...queryParams, format });
                    if (result.success) {
                        reportingService.downloadReportFile(result.blob, result.fileName);
                        notify({ message: `${format.toUpperCase()} downloaded`, type: 'success' });
                    } else {
                        notify({ message: result.error || 'Download failed', type: 'error' });
                    }
                    return;
                }

                const dataResult = await reportingService.fetchReportData(activeSource.apiEndpoint, queryParams);
                if (!dataResult.success) {
                    notify({ message: dataResult.error || 'Error fetching report data', type: 'error' });
                    return;
                }

                const reportData = buildJsReportPayload({
                    sourceId: activeSource.id,
                    sourceName: activeSource.name,
                    apiResponse: dataResult.data,
                    queryParams,
                });

                const result =
                    format === 'pdf'
                        ? await reportingService.renderJsReportPdf(templateName, reportData)
                        : await reportingService.renderJsReportExcel(templateName, reportData);

                if (result.success) {
                    reportingService.downloadReportFile(result.blob, result.fileName);
                    notify({ message: `${format.toUpperCase()} downloaded`, type: 'success' });
                } else {
                    notify({ message: result.error || 'Download failed', type: 'error' });
                }
            } catch (err) {
                notify({ message: 'Download failed', type: 'error' });
            } finally {
                setGenerating(false);
                setSelectedFormat(prev);
            }
        },
        [activeSource, buildQueryParams, selectedFormat, templateOverride, submitReportJob]
    );

    return (
        <div className="report-engine">

            {/* ── M365 Page Header ── */}
            <div className="engine-header">
                <div className="engine-header__left">
                    <div className="engine-header__icon">
                        <i className={activeSource?.icon || 'fa-light fa-file-chart-line'} />
                    </div>
                    <div>
                        <h2 className="engine-header__title">
                            {activeSource?.name || 'Report Engine'}
                        </h2>
                        <p className="engine-header__subtitle">
                            {activeSource?.description || 'Select a report source to begin'}
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="engine-body">

                {/* Left sidebar */}
                <div className="engine-sidebar">

                    {/* Source Selector */}
                    <div className="engine-section">
                        <div className="engine-section__header">
                            <i className="fa-light fa-database" />
                            Report Source
                        </div>
                        <div className="engine-section__body">
                            <SelectBox
                                value={activeSourceId}
                                dataSource={allSources}
                                valueExpr="id"
                                displayExpr="name"
                                onValueChanged={(e) => handleSourceChange(e.value)}
                                placeholder="Choose a report…"
                                searchEnabled={true}
                                grouped={false}
                            />
                        </div>
                    </div>

                    {/* Parameters */}
                    {activeSource && (
                        <div className="engine-section">
                            <div className="engine-section__header">
                                <i className="fa-light fa-filter" />
                                Parameters
                            </div>
                            <div className="engine-section__body">
                                <ReportParameterForm
                                    parameters={activeSource.parameters}
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                />
                            </div>
                        </div>
                    )}

                    {/* Template Override */}
                    {activeSource && templates.length > 0 && (
                        <div className="engine-section">
                            <div className="engine-section__header">
                                <i className="fa-light fa-file-code" />
                                Template
                            </div>
                            <div className="engine-section__body">
                                <SelectBox
                                    value={templateOverride || activeSource.defaultTemplate}
                                    dataSource={templates.filter((t) => {
                                        const prefix = activeSource.defaultTemplate?.replace(/-report$/, '');
                                        return prefix ? t.toLowerCase().startsWith(prefix.toLowerCase()) : true;
                                    })}
                                    onValueChanged={(e) => setTemplateOverride(e.value)}
                                    placeholder="Use default template"
                                    showClearButton={true}
                                    searchEnabled={true}
                                />
                                <p className="engine-section__hint">
                                    Default: {activeSource.defaultTemplate}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Output Format — M365 segmented button group */}
                    {activeSource && (
                        <div className="engine-section">
                            <div className="engine-section__header">
                                <i className="fa-light fa-file-export" />
                                Output Format
                            </div>
                            <div className="engine-section__body">
                                <ReportFormatSelector
                                    supportedFormats={activeSource.supportedFormats}
                                    selectedFormat={selectedFormat}
                                    onFormatChange={setSelectedFormat}
                                />
                            </div>
                        </div>
                    )}

                    {/* Generate + secondary actions */}
                    {activeSource && (
                        <div className="engine-actions">
                            <button
                                className="m365-btn m365-btn--primary engine-actions__generate"
                                onClick={handleGenerate}
                                disabled={generating || isReportTracking}
                            >
                                <i className="fa-light fa-play" />
                                {isReportTracking ? 'Generating\u2026' : 'Generate Report'}
                            </button>
                            {emailVisible && (
                                <button className="m365-btn m365-btn--ghost engine-actions__secondary" onClick={emailWhenDoneReport}>
                                    <i className="fa-light fa-envelope" />
                                    Email when done
                                </button>
                            )}
                            <div className="engine-actions__row">
                                <button
                                    className="m365-btn m365-btn--ghost"
                                    onClick={() => setSchedulePanelOpen(true)}
                                >
                                    <i className="fa-light fa-calendar-clock" />
                                    Schedule
                                </button>
                                <button
                                    className="m365-btn m365-btn--ghost"
                                    onClick={() => setEmailPanelOpen(true)}
                                >
                                    <i className="fa-light fa-envelope" />
                                    Request via Email
                                </button>
                            </div>
                        </div>
                    )}

                </div>

                {/* Output panel */}
                <div className="engine-output">

                    {activeErrorMessage && (
                        <div className="engine-error">
                            <div className="engine-error__top">
                                <span className="engine-error__msg">
                                    <i className="fa-light fa-circle-exclamation" />
                                    {activeErrorMessage}
                                </span>
                                <button
                                    type="button"
                                    className="m365-btn m365-btn--danger-text"
                                    onClick={dismissReportJob}
                                    title="Dismiss report error"
                                >
                                    <i className="fa-light fa-xmark" />
                                    Dismiss
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Progress banner */}
                    {isReportTracking && reportJob && (
                        <div className="engine-progress">
                            <div className="engine-progress__top">
                                <span className="engine-progress__msg">
                                    <i className="fa-light fa-file-chart-column" />
                                    {reportJob?.statusMessage || 'Generating report…'}
                                </span>
                                <div className="engine-progress__meta">
                                    <span className="engine-progress__pct">
                                        {reportJob?.progressPercent || 0}%
                                        {reportJob?.elapsedSeconds > 0 && (
                                            <span className="engine-progress__elapsed">
                                                {Math.round(reportJob.elapsedSeconds)}s
                                            </span>
                                        )}
                                    </span>
                                    <button
                                        type="button"
                                        className="m365-btn m365-btn--danger-text"
                                        onClick={cancelReportJob}
                                        title="Cancel report generation"
                                    >
                                        <i className="fa-light fa-xmark" />
                                        Cancel
                                    </button>
                                </div>
                            </div>
                            <ProgressBar
                                min={0}
                                max={100}
                                value={reportJob?.progressPercent || 0}
                                statusFormat={() => ''}
                                width="100%"
                            />
                        </div>
                    )}

                    <ReportOutputViewer
                        htmlContent={htmlContent}
                        selectedFormat={selectedFormat}
                        reportName={activeSource?.name}
                        isGenerating={generating}
                        onDownloadAs={handleDownloadAs}
                        lastGenerated={lastGenerated}
                    />
                </div>
            </div>

            {/* Email Report Panel */}
            <RequestReportEmailPanel
                open={emailPanelOpen}
                onClose={() => setEmailPanelOpen(false)}
                initialSourceId={activeSourceId}
            />

            {/* Schedule Report Panel */}
            <ScheduleReportPanel
                open={schedulePanelOpen}
                onClose={() => setSchedulePanelOpen(false)}
                initialSourceId={activeSourceId}
            />
        </div>
    );
};

export default ReportEngine;
