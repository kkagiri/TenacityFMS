/**
 * File: WarningLetterDocumentRail.js
 * Purpose: Renders the warning letter detail and workflow document cards shown in the left rail.
 * Dependencies: React
 * Last Modified: 2026-04-20
 *
 * Key Functions:
 * - WarningLetterDocumentRail(): Shows letter metadata and document workflow actions.
 */
import React from "react";
import { typeMap } from "./warningLetterPreviewConstants";

const WorkflowCard = ({
    panelKey,
    expanded,
    title,
    description,
    status,
    loading,
    uploadButton,
    downloadButton,
    details,
    onToggle,
}) => (
    <div className="warning-letter-page__panel warning-letter-preview__workflow-card warning-letter-preview__signed-copy">
        <div className="warning-letter-preview__signed-copy-header">
            <div className="warning-letter-preview__section-copy">
                <button
                    type="button"
                    className="warning-letter-preview__collapse-toggle warning-letter-preview__collapse-toggle--section"
                    onClick={() => onToggle(panelKey)}
                    aria-expanded={expanded}
                >
                    <div>
                        <h3>{title}</h3>
                    </div>
                    <div className="warning-letter-preview__panel-heading-meta">
                        <span className={`m365-badge ${status.cls}`}>{status.label}</span>
                    </div>
                </button>
                <p>{description}</p>
            </div>
            <div className="warning-letter-preview__signed-copy-actions">
                {uploadButton}
                {downloadButton}
                <button
                    type="button"
                    className="warning-letter-preview__section-toggle-button"
                    onClick={() => onToggle(panelKey)}
                    aria-expanded={expanded}
                    aria-label={expanded ? `Collapse ${title} section` : `Expand ${title} section`}
                >
                    <i className={`fa-light ${expanded ? "fa-chevron-up" : "fa-chevron-down"}`} />
                </button>
            </div>
        </div>
        {expanded && (
            <>
                {loading && (
                    <div className="warning-letter-preview__signed-copy-uploading">
                        <i className="fa-light fa-spinner-third fa-spin" /> Uploading {title.toLowerCase()}...
                    </div>
                )}
                <div className="warning-letter-preview__compact-list">{details}</div>
            </>
        )}
    </div>
);

const WarningLetterDocumentRail = ({
    letter,
    status,
    workflowLocked,
    approvedStatus,
    signedStatus,
    expandedPanels,
    togglePanel,
    approveLetterInputRef,
    signedCopyInputRef,
    approveLetterUploading,
    signedCopyUploading,
    canUploadApproveLetter,
    canUploadSignedCopy,
    canUploadWorkflowDocuments,
    approvedLetterLocked,
    hasApprovedLetter,
    workflowStage,
    canSend,
    canViewPdf,
    approveLetterUploadedByLabel,
    signedCopyUploadedByLabel,
    ccRecipientsLabel,
    formatDocumentDate,
    formatDocumentSize,
    onApproveLetterSelected,
    onSignedCopySelected,
    onDownloadApproveLetter,
    onDownloadSignedCopy,
    onOpenRequestSignature,
}) => (
    <div className="warning-letter-preview__rail">
        <div className="warning-letter-page__panel warning-letter-preview__meta-card">
            <div className="warning-letter-preview__panel-heading">
                <button
                    type="button"
                    className="warning-letter-preview__collapse-toggle"
                    onClick={() => togglePanel("document")}
                    aria-expanded={expandedPanels.document}
                >
                    <div>
                        <span className="warning-letter-preview__eyebrow">Document</span>
                        <h3>Warning Letter Details</h3>
                    </div>
                    <div className="warning-letter-preview__panel-heading-meta">
                        <span className="m365-badge m365-badge--primary">PDF Only</span>
                        <i className={`fa-light ${expandedPanels.document ? "fa-chevron-up" : "fa-chevron-down"}`} />
                    </div>
                </button>
            </div>
            {expandedPanels.document && (
                <div className="warning-letter-preview__meta-list">
                    <div><span>Reference</span><strong>#{letter.id}</strong></div>
                    <div><span>Type</span><strong>{typeMap[letter.letterType] || "Unknown"}</strong></div>
                    <div><span>Employee</span><strong>{letter.employeeName}</strong></div>
                    <div><span>Email</span><strong>{letter.emailRecipient || letter.employeeEmail || "N/A"}</strong></div>
                    <div><span>Vehicle</span><strong>{letter.vehicleCode}</strong></div>
                    <div><span>Site</span><strong>{letter.siteName}</strong></div>
                    <div><span>Recipient</span><strong>{letter.signatureRequestRecipient || "N/A"}</strong></div>
                </div>
            )}
        </div>

        <WorkflowCard
            panelKey="approved"
            expanded={expandedPanels.approved}
            title="Approved Letter"
            description="Freeze the issued copy before requesting a signature."
            status={approvedStatus}
            loading={approveLetterUploading}
            onToggle={togglePanel}
            uploadButton={canUploadApproveLetter && canUploadWorkflowDocuments && !approvedLetterLocked && (
                <>
                    <input
                        ref={approveLetterInputRef}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="warning-letter-preview__signed-copy-input"
                        onChange={onApproveLetterSelected}
                        disabled={approveLetterUploading}
                    />
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => approveLetterInputRef.current?.click()} disabled={approveLetterUploading}>
                        <i className={`fa-light ${approveLetterUploading ? "fa-spinner-third fa-spin" : "fa-upload"}`} /> {approveLetterUploading ? "Uploading..." : "Upload Approved Letter"}
                    </button>
                </>
            )}
            downloadButton={letter.approveLetterUploadedAt && (
                <button type="button" className="m365-btn m365-btn--ghost" onClick={onDownloadApproveLetter} disabled={approveLetterUploading}>
                    <i className="fa-light fa-download" /> Download Approved Letter
                </button>
            )}
            details={(
                <>
                    <div><span>Uploaded</span><strong>{formatDocumentDate(letter.approveLetterUploadedAt, "Pending")}</strong></div>
                    <div><span>By</span><strong>{approveLetterUploadedByLabel}</strong></div>
                    <div><span>File</span><strong>{letter.approveLetterFileName || "No approved letter uploaded"}</strong></div>
                    <div><span>Type</span><strong>{letter.approveLetterContentType || "N/A"}</strong></div>
                    <div><span>Size</span><strong>{formatDocumentSize(letter.approveLetterFileSize)}</strong></div>
                </>
            )}
        />

        <WorkflowCard
            panelKey="signed"
            expanded={expandedPanels.signed}
            title="Signed Copy"
            description={workflowLocked ? "Signed copy received. Editing actions are locked." : "Request the signature, then upload the returned signed copy."}
            status={signedStatus}
            loading={signedCopyUploading}
            onToggle={togglePanel}
            uploadButton={(
                <>
                    {canSend && hasApprovedLetter && workflowStage < 3 && (
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={onOpenRequestSignature}>
                            <i className="fa-light fa-signature" /> Request Signature
                        </button>
                    )}
                    {canUploadSignedCopy && canUploadWorkflowDocuments && hasApprovedLetter && workflowStage < 4 && (
                        <>
                            <input
                                ref={signedCopyInputRef}
                                type="file"
                                accept=".pdf,.jpg,.jpeg,.png"
                                className="warning-letter-preview__signed-copy-input"
                                onChange={onSignedCopySelected}
                                disabled={signedCopyUploading}
                            />
                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => signedCopyInputRef.current?.click()} disabled={signedCopyUploading}>
                                <i className={`fa-light ${signedCopyUploading ? "fa-spinner-third fa-spin" : "fa-upload"}`} /> {signedCopyUploading ? "Uploading..." : "Upload Signed Copy"}
                            </button>
                        </>
                    )}
                </>
            )}
            downloadButton={letter.signedCopyUploadedAt && (
                <button type="button" className="m365-btn m365-btn--ghost" onClick={onDownloadSignedCopy} disabled={signedCopyUploading}>
                    <i className="fa-light fa-download" /> Download Signed Copy
                </button>
            )}
            details={(
                <>
                    <div><span>Recipient</span><strong>{letter.signatureRequestRecipient || "N/A"}</strong></div>
                    <div><span>CC</span><strong>{ccRecipientsLabel}</strong></div>
                    <div><span>Requested</span><strong>{formatDocumentDate(letter.signatureRequestedAt, "N/A")}</strong></div>
                    <div><span>Uploaded</span><strong>{formatDocumentDate(letter.signedCopyUploadedAt, "Pending")}</strong></div>
                    <div><span>By</span><strong>{signedCopyUploadedByLabel}</strong></div>
                    <div><span>File</span><strong>{letter.signedCopyFileName || "No signed copy uploaded"}</strong></div>
                </>
            )}
        />
    </div>
);

export default WarningLetterDocumentRail;
