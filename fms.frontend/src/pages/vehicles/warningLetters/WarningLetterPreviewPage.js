/**
 * File: WarningLetterPreviewPage.js
 * Purpose: Presents a saved warning letter with PDF preview and workflow actions.
 * Dependencies: React, react-router-dom, usePermissions, warning letter preview components
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - WarningLetterPreviewPage(): Composes the warning letter preview workflow experience.
 */
import React from "react";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import WarningLetterDocumentRail from "./preview/WarningLetterDocumentRail";
import WarningLetterHelpPanel from "./preview/WarningLetterHelpPanel";
import WarningLetterPreviewFrame from "./preview/WarningLetterPreviewFrame";
import WarningLetterRecipientGroupPanel from "./preview/WarningLetterRecipientGroupPanel";
import WarningLetterSignaturePanel from "./preview/WarningLetterSignaturePanel";
import { useWarningLetterPreviewState } from "./preview/useWarningLetterPreviewState";
import "./WarningLetters.scss";

const WarningLetterPreviewPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission, userInfo } = usePermissions();

    const canUpdate = hasPermission("_Update_WarningLetter");
    const canSend = hasPermission("_Send_WarningLetter");
    const canViewPdf = hasPermission("_Generate_WarningLetter_PDF");
    const canUploadApproveLetter = hasPermission("_UploadApproveLetter_WarningLetter");
    const canUploadSignedCopy = hasPermission("_UploadSignedCopy_WarningLetter");
    const canManageRecipientGroups = hasPermission("_Manage_NotificationGroups");
    const canEditWarningLetterRecipients = hasPermission("_Update_WarningLetter") || hasPermission("_Send_WarningLetter");
    const canEditSignatureRecipients = canManageRecipientGroups || canEditWarningLetterRecipients;

    const previewState = useWarningLetterPreviewState({
        id,
        canViewPdf,
        canUpdate,
        canManageRecipientGroups: canEditSignatureRecipients,
        userInfo,
    });

    return (
        <div className="warning-letter-page warning-letter-preview">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-file-pdf m365-page-header__icon" />
                    <h2 className="m365-page-header__title">Warning Letter Preview</h2>
                    {previewState.letter && <span className={`m365-badge ${previewState.status.cls}`}>{previewState.status.label}</span>}
                </div>
                <div className="m365-page-header__actions warning-letter-preview__header-actions">
                    <div className="warning-letter-preview__header-group">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/reports/warning-letters")}>
                            <i className="fa-light fa-arrow-left" /> Back
                        </button>
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => previewState.setHelpPanelOpen(true)}>
                            <i className="fa-light fa-circle-question" /> Document Procedure
                        </button>
                        {canUpdate && previewState.letter?.status === 0 && (
                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate(`/reports/warning-letters/${id}/edit`)}>
                                <i className="fa-light fa-pen" /> Edit
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {previewState.letter && (
                <div className="warning-letter-preview__layout">
                    <WarningLetterDocumentRail
                        letter={previewState.letter}
                        status={previewState.status}
                        workflowLocked={previewState.workflowLocked}
                        approvedStatus={previewState.approvedStatus}
                        signedStatus={previewState.signedStatus}
                        expandedPanels={previewState.expandedPanels}
                        togglePanel={previewState.togglePanel}
                        approveLetterInputRef={previewState.approveLetterInputRef}
                        signedCopyInputRef={previewState.signedCopyInputRef}
                        approveLetterUploading={previewState.approveLetterUploading}
                        signedCopyUploading={previewState.signedCopyUploading}
                        canUploadApproveLetter={canUploadApproveLetter}
                        canUploadSignedCopy={canUploadSignedCopy}
                        canUploadWorkflowDocuments={previewState.canUploadWorkflowDocuments}
                        approvedLetterLocked={previewState.approvedLetterLocked}
                        hasApprovedLetter={previewState.hasApprovedLetter}
                        workflowStage={previewState.workflowStage}
                        canSend={canSend}
                        canViewPdf={canViewPdf}
                        approveLetterUploadedByLabel={previewState.approveLetterUploadedByLabel}
                        signedCopyUploadedByLabel={previewState.signedCopyUploadedByLabel}
                        ccRecipientsLabel={previewState.ccRecipientsLabel}
                        formatDocumentDate={previewState.formatDocumentDate}
                        formatDocumentSize={previewState.formatDocumentSize}
                        onApproveLetterSelected={previewState.handleApproveLetterSelected}
                        onSignedCopySelected={previewState.handleSignedCopySelected}
                        onDownloadApproveLetter={previewState.handleDownloadApproveLetter}
                        onDownloadSignedCopy={previewState.handleDownloadSignedCopy}
                        onOpenRequestSignature={previewState.handleOpenRequestSignature}
                    />

                    <WarningLetterPreviewFrame
                        id={id}
                        letter={previewState.letter}
                        pdfUrl={previewState.pdfUrl}
                        loading={previewState.loading}
                        previewLoading={previewState.previewLoading}
                        canSend={canSend}
                        canAcknowledge={previewState.canAcknowledge}
                        canViewPdf={canViewPdf}
                        workflowLocked={previewState.workflowLocked}
                        onSendEmail={previewState.handleSendEmail}
                        onAcknowledge={previewState.handleAcknowledge}
                        onRegeneratePdf={() => previewState.loadPdfPreview(true)}
                        onDownloadPdf={previewState.handleDownloadPdf}
                    />
                </div>
            )}

            <WarningLetterHelpPanel
                open={previewState.helpPanelOpen}
                onClose={() => previewState.setHelpPanelOpen(false)}
            />

            <WarningLetterSignaturePanel
                open={previewState.signaturePopupOpen}
                onClose={() => previewState.setSignaturePopupOpen(false)}
                submitting={previewState.signatureSubmitting}
                canSubmit={previewState.canSubmitSignatureRequest}
                onSubmit={previewState.handleRequestSignature}
                signatureRecipientOptions={previewState.signatureRecipientOptions}
                signatureRecipients={previewState.signatureRecipients}
                signatureCcRecipients={previewState.signatureCcRecipients}
                availableSignatureCcRecipients={previewState.availableSignatureCcRecipients}
                signatureRecipientsLoading={previewState.signatureRecipientsLoading}
                selectedSignatureRecipientId={previewState.selectedSignatureRecipientId}
                selectedCcRecipientIds={previewState.selectedCcRecipientIds}
                onSignatureRecipientChanged={previewState.handleSignatureRecipientChanged}
                onCcRecipientsChanged={previewState.handleCcRecipientsChanged}
                showSignatureGroupWarning={previewState.showSignatureGroupWarning}
                canEditSignatureRecipients={canEditSignatureRecipients}
                onEditRecipientGroup={previewState.openRecipientGroupPanel}
                siteId={previewState.letter?.siteId}
            />

            <WarningLetterRecipientGroupPanel
                open={previewState.recipientGroupPanelOpen}
                onClose={previewState.handleCloseRecipientGroupPanel}
                target={previewState.recipientGroupTarget}
                loading={previewState.recipientGroupLoading}
                userOptions={previewState.recipientGroupUserOptions}
                addMemberId={previewState.recipientGroupAddMemberId}
                onAddMemberIdChange={previewState.setRecipientGroupAddMemberId}
                onAddMember={previewState.handleAddRecipientGroupMember}
                members={previewState.recipientGroupMembers}
                onRemoveMember={previewState.handleRemoveRecipientGroupMember}
            />

        </div>
    );
};

export default WarningLetterPreviewPage;