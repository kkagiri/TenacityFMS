/**
 * File: TemplateDesigner.js
 * Purpose: Monaco Editor-based Handlebars template designer with live preview.
 *          Consolidated from jsreport/JsReportDesigner.js for the new architecture.
 * Dependencies: React, Monaco Editor, reportingService
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - TemplateDesigner: Split-pane editor (left: code, right: preview)
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import notify from 'devextreme/ui/notify';
import reportingService from '../../../services/reportingService';
import './TemplateDesigner.scss';

const SAMPLE_DATA = {
    reportTitle: 'Sample Report Preview',
    generatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
    generatedBy: 'Template Designer',
    dateFrom: '2026-01-01',
    dateTo: '2026-02-09',
    reportId: 'RPT-PREVIEW-001',
    summary: {
        totalRecords: 25,
        totalVolume: '4,567.50',
        totalAmount: '6,851.25',
        currency: '$',
    },
    data: [
        { date: '2026-01-15', description: 'Sample row 1', amount: '123.98' },
        { date: '2026-01-16', description: 'Sample row 2', amount: '456.00' },
        { date: '2026-01-17', description: 'Sample row 3', amount: '789.50' },
    ],
};

const TemplateDesigner = () => {
    const { templateName } = useParams();
    const navigate = useNavigate();
    const editorRef = useRef(null);
    const previewRef = useRef(null);

    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [content, setContent] = useState('');
    const [originalContent, setOriginalContent] = useState('');
    const [previewHtml, setPreviewHtml] = useState('');
    const [isDirty, setIsDirty] = useState(false);

    // Load template
    useEffect(() => {
        if (!templateName) return;

        const loadTemplate = async () => {
            setLoading(true);
            try {
                const result = await reportingService.getJsReportTemplate(templateName);
                if (result.success) {
                    const tpl = typeof result.data === 'string' ? result.data : result.data?.content || '';
                    setContent(tpl);
                    setOriginalContent(tpl);
                    setIsDirty(false);
                } else {
                    notify({ message: result.error || 'Failed to load template', type: 'error' });
                }
            } catch (err) {
                notify({ message: 'Failed to load template', type: 'error' });
            } finally {
                setLoading(false);
            }
        };

        loadTemplate();
    }, [templateName]);

    const handleEditorChange = useCallback(
        (value) => {
            setContent(value || '');
            setIsDirty(value !== originalContent);
        },
        [originalContent]
    );

    const handleSave = useCallback(async () => {
        if (!templateName) return;
        setSaving(true);
        try {
            const result = await reportingService.saveJsReportTemplate(templateName, content);
            if (result.success) {
                setOriginalContent(content);
                setIsDirty(false);
                notify({ message: 'Template saved successfully', type: 'success' });
            } else {
                notify({ message: result.error || 'Failed to save', type: 'error' });
            }
        } catch (err) {
            notify({ message: 'Failed to save template', type: 'error' });
        } finally {
            setSaving(false);
        }
    }, [templateName, content]);

    const handlePreview = useCallback(async () => {
        if (!templateName) return;
        setLoading(true);
        try {
            // Save first if dirty
            if (isDirty) {
                await reportingService.saveJsReportTemplate(templateName, content);
                setOriginalContent(content);
                setIsDirty(false);
            }

            const result = await reportingService.previewJsReport(templateName, SAMPLE_DATA);
            if (result.success) {
                setPreviewHtml(result.html);
                if (previewRef.current) {
                    const doc = previewRef.current.contentDocument;
                    doc.open();
                    doc.write(result.html);
                    doc.close();
                }
            } else {
                notify({ message: result.error || 'Preview failed', type: 'error' });
            }
        } catch (err) {
            notify({ message: 'Preview failed', type: 'error' });
        } finally {
            setLoading(false);
        }
    }, [templateName, content, isDirty]);

    const handleEditorMount = useCallback((editor) => {
        editorRef.current = editor;
    }, []);

    return (
        <div className="template-designer">
            <LoadPanel visible={loading || saving} />

            {/* Header */}
            <div className="designer-header">
                <div className="tw-flex tw-items-center tw-gap-3">
                    <Button
                        icon="fa-light fa-arrow-left"
                        stylingMode="text"
                        onClick={() => navigate('/reports/templates')}
                    />
                    <div>
                        <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-m-0">
                            <i className="fa-light fa-edit tw-mr-2 tw-text-blue-600"></i>
                            {templateName || 'New Template'}
                            {isDirty && <span className="tw-text-orange-500 tw-ml-2 tw-text-sm">(unsaved)</span>}
                        </h2>
                    </div>
                </div>
                <div className="tw-flex tw-gap-2">
                    <Button
                        icon="fa-light fa-eye"
                        text="Preview"
                        stylingMode="outlined"
                        onClick={handlePreview}
                    />
                    <Button
                        icon="fa-light fa-save"
                        text="Save"
                        type="success"
                        onClick={handleSave}
                        disabled={!isDirty}
                    />
                </div>
            </div>

            {/* Split Pane */}
            <div className="designer-content">
                {/* Editor */}
                <div className="editor-pane">
                    <div className="pane-header">
                        <i className="fa-light fa-code tw-mr-2"></i>
                        Handlebars Template
                    </div>
                    <div className="editor-container">
                        <Editor
                            height="100%"
                            defaultLanguage="html"
                            value={content}
                            onChange={handleEditorChange}
                            onMount={handleEditorMount}
                            theme="vs-dark"
                            options={{
                                minimap: { enabled: false },
                                fontSize: 14,
                                wordWrap: 'on',
                                scrollBeyondLastLine: false,
                                automaticLayout: true,
                            }}
                        />
                    </div>
                </div>

                {/* Preview */}
                <div className="preview-pane">
                    <div className="pane-header">
                        <i className="fa-light fa-eye tw-mr-2"></i>
                        Live Preview
                    </div>
                    <div className="preview-container">
                        {previewHtml ? (
                            <iframe
                                ref={previewRef}
                                title="Template Preview"
                                className="tw-w-full tw-h-full tw-border-0"
                            />
                        ) : (
                            <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-gray-400">
                                <i className="fa-light fa-eye-slash tw-text-4xl tw-mb-3"></i>
                                <p>Click "Preview" to render template with sample data</p>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TemplateDesigner;
