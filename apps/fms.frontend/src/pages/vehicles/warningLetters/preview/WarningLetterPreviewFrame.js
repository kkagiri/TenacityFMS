/**
 * File: WarningLetterPreviewFrame.js
 * Purpose: Displays the warning letter PDF preview and page-level workflow actions.
 * Dependencies: React
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - WarningLetterPreviewFrame(): Renders the PDF frame and action toolbar.
 */
import React from "react";

const WarningLetterPreviewFrame = ({
    id,
    letter,
    pdfUrl,
    loading,
    previewLoading,
    canSend,
    canAcknowledge,
    canViewPdf,
    workflowLocked,
    onSendEmail,
    onAcknowledge,
    onRegeneratePdf,
    onDownloadPdf,
}) => (
    <div className="warning-letter-preview__main">
        <div className="warning-letter-page__panel warning-letter-preview__preview-shell">
            <div className="warning-letter-preview__preview-header">
                <div className="warning-letter-preview__preview-title">
                    <span className="warning-letter-preview__eyebrow">Preview</span>
                    <h3>Issued PDF</h3>
                </div>
                <div className="warning-letter-preview__preview-actions">
                    <div className="warning-letter-preview__header-group warning-letter-preview__header-group--workflow">
                        {canSend && letter.status !== 0 && (
                            <button type="button" className="m365-btn m365-btn--primary" onClick={onSendEmail}>
                                <i className="fa-light fa-envelope" /> Email Employee
                            </button>
                        )}
                        {canAcknowledge && (
                            <button type="button" className="m365-btn m365-btn--success" onClick={onAcknowledge}>
                                <i className="fa-light fa-badge-check" /> Acknowledge
                            </button>
                        )}
                    </div>
                    <div className="warning-letter-preview__document-toolbar-actions">
                        {canViewPdf && (
                            <button
                                type="button"
                                className="m365-btn m365-btn--ghost"
                                onClick={onRegeneratePdf}
                                disabled={previewLoading || loading || workflowLocked}
                                title={workflowLocked ? "Signed copy already uploaded. Regeneration disabled to preserve the issued document." : undefined}
                            >
                                <i className="fa-light fa-rotate-right" /> Regenerate PDF
                            </button>
                        )}
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={onDownloadPdf} disabled={!pdfUrl || !canViewPdf}>
                            <i className="fa-light fa-download" /> Download
                        </button>
                    </div>
                </div>
            </div>

            <div className="warning-letter-preview__frame-wrap">
                {(loading || previewLoading) && <div className="warning-letter-preview__loading">Loading preview...</div>}
                {!loading && !previewLoading && pdfUrl && (
                    <iframe title={`Warning letter ${id}`} className="warning-letter-preview__frame" src={pdfUrl} />
                )}
                {!loading && !previewLoading && !pdfUrl && !canViewPdf && (
                    <div className="warning-letter-preview__loading">PDF preview is unavailable because you do not have permission to generate warning letter PDFs.</div>
                )}
            </div>
        </div>
    </div>
);

export default WarningLetterPreviewFrame;
