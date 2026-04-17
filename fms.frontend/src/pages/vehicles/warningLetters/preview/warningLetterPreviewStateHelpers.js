/**
 * File: warningLetterPreviewStateHelpers.js
 * Purpose: Provides pure helper logic for warning letter preview state and formatting.
 * Dependencies: warningLetterPreviewConstants
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - buildPreviewDerivedState(): Computes view-friendly workflow flags and labels.
 * - downloadBlobDocument(): Downloads a blob-backed file response.
 */
import { isGuidLike, workflowStageMap } from "./warningLetterPreviewConstants";

export const downloadBlobDocument = (fileDocument) => {
    const url = URL.createObjectURL(fileDocument.blob);
    const link = window.document.createElement("a");
    link.href = url;
    link.download = fileDocument.fileName;
    window.document.body.appendChild(link);
    link.click();
    window.document.body.removeChild(link);
    URL.revokeObjectURL(url);
};

export const formatDocumentDate = (value, fallback) => (value ? new Date(value).toLocaleString() : fallback);

export const formatDocumentSize = (value) => {
    if (!value) {
        return "N/A";
    }

    if (value >= 1024 * 1024) {
        return `${(value / (1024 * 1024)).toFixed(2)} MB`;
    }

    if (value >= 1024) {
        return `${(value / 1024).toFixed(1)} KB`;
    }

    return `${value} bytes`;
};

export const buildPreviewDerivedState = ({
    letter,
    signatureRecipients,
    signatureCcRecipients,
    selectedSignatureRecipientId,
    signatureRecipientsLoading,
    signatureSubmitting,
    canUpdate,
    userInfo,
}) => {
    const selectedSignatureRecipient = signatureRecipients.find((recipient) => recipient.id === selectedSignatureRecipientId) || null;
    const availableSignatureCcRecipients = signatureCcRecipients.filter((recipient) => recipient.id !== selectedSignatureRecipientId);
    const effectiveSignatureRecipientEmail = (selectedSignatureRecipient?.email || "").trim();
    const showSignatureGroupWarning = signatureRecipients.length === 0 && signatureCcRecipients.length > 0;
    const workflowStage = letter?.workflowStage ?? 0;
    const hasApprovedLetter = Boolean(letter?.approveLetterUploadedAt);
    const hasSignedCopy = Boolean(letter?.signedCopyUploadedAt);
    const workflowLocked = workflowStage >= 3;
    const canUploadWorkflowDocuments = Boolean(letter);
    const approvedLetterLocked = Boolean(letter?.signatureRequestedAt || letter?.signedCopyUploadedAt || letter?.employeeAcknowledgedAt);
    const isCreatedByCurrentUser = Boolean(letter?.createdBy && userInfo?.id)
        && String(letter.createdBy).toLowerCase() === String(userInfo.id).toLowerCase();
    const canAcknowledge = canUpdate && workflowStage === 3 && isCreatedByCurrentUser;
    const status = workflowStageMap[workflowStage] || { label: "Unknown", cls: "m365-badge--neutral" };
    const approveLetterUploadedByLabel = letter?.approveLetterUploadedBy
        ? (isGuidLike(letter.approveLetterUploadedBy) ? "Refreshing uploader details..." : letter.approveLetterUploadedBy)
        : "N/A";
    const signedCopyUploadedByLabel = letter?.signedCopyUploadedBy
        ? (isGuidLike(letter.signedCopyUploadedBy) ? "Refreshing uploader details..." : letter.signedCopyUploadedBy)
        : "N/A";
    const ccRecipientsLabel = Array.isArray(letter?.signatureRequestCcRecipients) && letter.signatureRequestCcRecipients.length > 0
        ? letter.signatureRequestCcRecipients.join(", ")
        : "None";
    const approvedStatus = hasApprovedLetter
        ? { label: "Uploaded", cls: "m365-badge--success" }
        : { label: "Pending", cls: "m365-badge--neutral" };
    const signedStatus = hasSignedCopy
        ? { label: "Received", cls: "m365-badge--success" }
        : letter?.signatureRequestedAt
            ? { label: "Requested", cls: "m365-badge--warning" }
            : { label: "Pending", cls: "m365-badge--neutral" };
    const canSubmitSignatureRequest = Boolean(
        !signatureRecipientsLoading
        && !signatureSubmitting
        && selectedSignatureRecipient
    );

    return {
        selectedSignatureRecipient,
        availableSignatureCcRecipients,
        effectiveSignatureRecipientEmail,
        showSignatureGroupWarning,
        workflowStage,
        hasApprovedLetter,
        hasSignedCopy,
        workflowLocked,
        canUploadWorkflowDocuments,
        approvedLetterLocked,
        canAcknowledge,
        status,
        approveLetterUploadedByLabel,
        signedCopyUploadedByLabel,
        ccRecipientsLabel,
        approvedStatus,
        signedStatus,
        canSubmitSignatureRequest,
    };
};
