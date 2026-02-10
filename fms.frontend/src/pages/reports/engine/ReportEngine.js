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

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import { getReportSource, getAllReportSources } from '../sources/reportSourceRegistry';
import ReportParameterForm from './ReportParameterForm';
import ReportFormatSelector from './ReportFormatSelector';
import ReportOutputViewer from './ReportOutputViewer';
import buildJsReportPayload from './reportDataBuilder';
import reportingService from '../../../services/reportingService';
import './ReportEngine.scss';

const ReportEngine = () => {
    const { sourceId } = useParams();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Source selection
    const allSources = useMemo(() => getAllReportSources(), []);
    const [activeSourceId, setActiveSourceId] = useState(sourceId || '');
    const activeSource = useMemo(() => getReportSource(activeSourceId), [activeSourceId]);

    // State
    const [filters, setFilters] = useState({});
    const [selectedFormat, setSelectedFormat] = useState('html');
    const [templateOverride, setTemplateOverride] = useState('');
    const [templates, setTemplates] = useState([]);
    const [generating, setGenerating] = useState(false);
    const [htmlContent, setHtmlContent] = useState('');
    const [lastGenerated, setLastGenerated] = useState(null);

    // Sync source from URL params
    useEffect(() => {
        if (sourceId && sourceId !== activeSourceId) {
            setActiveSourceId(sourceId);
        }
    }, [sourceId]);

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
                // Keep arrays as-is — fetchReportData handles repeated key serialization
                if (val.length > 0) {
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
     * Fetch report data from the source's API endpoint, then render via template
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

        const templateName = templateOverride || activeSource.defaultTemplate;
        if (!templateName) {
            notify({ message: 'No template selected or configured for this report', type: 'warning' });
            return;
        }

        setGenerating(true);
        try {
            // Use dedicated endpoint for pump transactions (has its own flow)
            if (activeSource.id === 'pump-transaction') {
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
                } else {
                    notify({ message: result.error || 'Error generating report', type: 'error' });
                }
                return;
            }

            // Step 1: Fetch actual report data from the source's API endpoint
            const queryParams = buildQueryParams();
            const dataResult = await reportingService.fetchReportData(activeSource.apiEndpoint, queryParams);

            if (!dataResult.success) {
                notify({ message: dataResult.error || 'Error fetching report data', type: 'error' });
                return;
            }

            // Step 2: Normalize source response into template-ready payload
            const reportData = buildJsReportPayload({
                sourceId: activeSource.id,
                sourceName: activeSource.name,
                apiResponse: dataResult.data,
                queryParams,
            });

            // Step 3: Render with template
            let result;
            switch (selectedFormat) {
                case 'pdf':
                    result = await reportingService.renderJsReportPdf(templateName, reportData);
                    break;
                case 'excel':
                    result = await reportingService.renderJsReportExcel(templateName, reportData);
                    break;
                case 'csv':
                    result = await reportingService.renderJsReportExcel(templateName, { ...reportData, outputFormat: 'csv' });
                    if (result.success) {
                        result.fileName = result.fileName?.replace('.xlsx', '.csv') || `${templateName}.csv`;
                    }
                    break;
                default:
                    result = await reportingService.previewJsReport(templateName, reportData);
            }

            if (result.success) {
                if (selectedFormat === 'html') {
                    setHtmlContent(result.html);
                } else {
                    reportingService.downloadReportFile(result.blob, result.fileName);
                    notify({
                        message: `${selectedFormat.toUpperCase()} downloaded successfully`,
                        type: 'success',
                    });
                }
                setLastGenerated(new Date());
            } else {
                notify({ message: result.error || 'Error generating report', type: 'error' });
            }
        } catch (err) {
            console.error('Report generation error:', err);
            notify({ message: 'Error generating report', type: 'error' });
        } finally {
            setGenerating(false);
        }
    }, [activeSource, filters, selectedFormat, templateOverride, buildQueryParams]);

    const handleDownloadAs = useCallback(
        async (format) => {
            if (!activeSource) return;
            const prev = selectedFormat;
            setSelectedFormat(format);
            const templateName = templateOverride || activeSource.defaultTemplate;
            if (!templateName) return;

            setGenerating(true);
            try {
                // Fetch data from source API first
                const queryParams = buildQueryParams();

                if (activeSource.id === 'pump-transaction') {
                    const result = await reportingService.generatePumpTransactionReport({ ...queryParams, format });
                    if (result.success) {
                        reportingService.downloadReportFile(result.blob, result.fileName);
                        notify({ message: `${format.toUpperCase()} downloaded`, type: 'success' });
                    } else {
                        notify({ message: result.error || 'Download failed', type: 'error' });
                    }
                } else {
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
                }
            } catch (err) {
                notify({ message: 'Download failed', type: 'error' });
            } finally {
                setGenerating(false);
                setSelectedFormat(prev);
            }
        },
        [activeSource, buildQueryParams, selectedFormat, templateOverride]
    );

    return (
        <div className="report-engine">
            <LoadPanel visible={generating} />

            {/* Header */}
            <div className="engine-header">
                <div className="tw-flex tw-items-center tw-gap-3">
                    <i className={`${activeSource?.icon || 'fa-light fa-file-chart-line'} tw-text-2xl tw-text-blue-600`}></i>
                    <div>
                        <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-m-0">
                            {activeSource?.name || 'Report Engine'}
                        </h2>
                        <p className="tw-text-sm tw-text-gray-500 tw-m-0">
                            {activeSource?.description || 'Select a report source to begin'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="engine-content">
                {/* Left Sidebar - Filters */}
                <div className="engine-sidebar">
                    {/* Source Selector */}
                    <div className="sidebar-section">
                        <div className="section-header">
                            <i className="fa-light fa-database tw-mr-2"></i>
                            Report Source
                        </div>
                        <div className="tw-p-4">
                            <SelectBox
                                value={activeSourceId}
                                dataSource={allSources}
                                valueExpr="id"
                                displayExpr="name"
                                onValueChanged={(e) => handleSourceChange(e.value)}
                                placeholder="Choose a report..."
                                searchEnabled={true}
                                grouped={false}
                            />
                        </div>
                    </div>

                    {/* Parameters */}
                    {activeSource && (
                        <div className="sidebar-section">
                            <div className="section-header">
                                <i className="fa-light fa-filter tw-mr-2"></i>
                                Parameters
                            </div>
                            <div className="tw-p-4">
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
                        <div className="sidebar-section">
                            <div className="section-header">
                                <i className="fa-light fa-file-code tw-mr-2"></i>
                                Template
                            </div>
                            <div className="tw-p-4">
                                <SelectBox
                                    value={templateOverride || activeSource.defaultTemplate}
                                    dataSource={templates.filter((t) => {
                                        // Match templates by source prefix: e.g. "vehicle-consumption" source
                                        // matches "vehicle-consumption-report", "vehicle-consumption-custom", etc.
                                        const prefix = activeSource.defaultTemplate?.replace(/-report$/, '');
                                        return prefix ? t.toLowerCase().startsWith(prefix.toLowerCase()) : true;
                                    })}
                                    onValueChanged={(e) => setTemplateOverride(e.value)}
                                    placeholder="Use default template"
                                    showClearButton={true}
                                    searchEnabled={true}
                                />
                                <p className="tw-text-xs tw-text-gray-400 tw-mt-1">
                                    Default: {activeSource.defaultTemplate}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Output Format */}
                    {activeSource && (
                        <div className="sidebar-section">
                            <div className="section-header">
                                <i className="fa-light fa-file-export tw-mr-2"></i>
                                Output Format
                            </div>
                            <div className="tw-p-4">
                                <ReportFormatSelector
                                    supportedFormats={activeSource.supportedFormats}
                                    selectedFormat={selectedFormat}
                                    onFormatChange={setSelectedFormat}
                                />
                            </div>
                        </div>
                    )}

                    {/* Generate Button */}
                    {activeSource && (
                        <div className="tw-p-4 tw-border-t tw-border-gray-200">
                            <Button
                                icon="fa-light fa-play"
                                text="Generate Report"
                                type="success"
                                onClick={handleGenerate}
                                disabled={generating}
                                width="100%"
                            />
                            <div className="tw-flex tw-gap-2 tw-mt-3">
                                <Button
                                    icon="fa-light fa-calendar-clock"
                                    text="Schedule"
                                    stylingMode="outlined"
                                    onClick={() => navigate(`/reports/scheduling/new?source=${activeSourceId}`)}
                                    width="100%"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Right Content - Output Viewer */}
                <div className="engine-output">
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
        </div>
    );
};

export default ReportEngine;
