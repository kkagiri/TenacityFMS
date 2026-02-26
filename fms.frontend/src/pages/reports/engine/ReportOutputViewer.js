/**
 * File: ReportOutputViewer.js
 * Purpose: Unified output viewer that shows HTML preview in an iframe,
 *          or triggers download for PDF/Excel/CSV outputs.
 * Dependencies: React
 * Last Modified: 2026-02-09
 *
 * Key Components:
 * - ReportOutputViewer: Displays report output (preview or download prompt)
 */

import React, { useRef, useEffect, useCallback } from 'react';
import { Button } from 'devextreme-react/button';

const ReportOutputViewer = ({
    htmlContent,
    selectedFormat,
    reportName,
    isGenerating,
    onPrint,
    onDownloadAs,
    lastGenerated,
}) => {
    const iframeRef = useRef(null);

    // Write HTML content to iframe when available
    useEffect(() => {
        if (htmlContent && iframeRef.current) {
            const doc = iframeRef.current.contentDocument;
            doc.open();
            doc.write(htmlContent);
            doc.close();
        }
    }, [htmlContent]);

    const handlePrint = useCallback(() => {
        if (iframeRef.current) {
            iframeRef.current.contentWindow.print();
        }
        if (onPrint) onPrint();
    }, [onPrint]);

    return (
        <div className="report-output-viewer tw-flex tw-flex-col tw-flex-1 tw-bg-white tw-rounded-lg tw-shadow-sm tw-overflow-hidden">
            {/* Preview Header */}
            <div className="tw-flex tw-justify-between tw-items-center tw-px-4 tw-py-3 tw-bg-gray-700 tw-text-white tw-font-medium">
                <div className="tw-flex tw-items-center">
                    <i className="fa-light fa-eye tw-mr-2"></i>
                    Output
                    {reportName && (
                        <span className="tw-text-gray-400 tw-ml-2 tw-font-normal">— {reportName}</span>
                    )}
                </div>
                <div className="tw-flex tw-items-center tw-gap-1">
                    {lastGenerated && (
                        <span className="tw-text-xs tw-text-gray-400 tw-mr-3">
                            Generated: {lastGenerated.toLocaleTimeString()}
                        </span>
                    )}
                    <Button
                        icon="fa-light fa-print"
                        hint="Print"
                        onClick={handlePrint}
                        stylingMode="text"
                        disabled={!htmlContent}
                        elementAttr={{ class: 'tw-text-white' }}
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="tw-flex-1 tw-overflow-hidden tw-relative" style={{ minHeight: 0 }}>
                {htmlContent ? (
                    <iframe
                        ref={iframeRef}
                        title="Report Preview"
                        className="tw-w-full tw-h-full tw-border-0"
                        style={{ minHeight: '500px' }}
                    />
                ) : (
                    <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-gray-400">
                        <i className="fa-light fa-file-chart-line tw-text-6xl tw-mb-4"></i>
                        <p className="tw-text-gray-500 tw-text-lg">
                            {isGenerating ? 'Generating report...' : 'Select a report and click "Generate" to preview'}
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ReportOutputViewer;
