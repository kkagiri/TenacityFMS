/**
 * File: WarningLetterPreviewPage.js
 * Purpose: Presents a saved warning letter with PDF preview and workflow actions.
 * Dependencies: React, react-router-dom, warningLetterService, usePermissions
 * Last Modified: 2026-04-09
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import notify from "devextreme/ui/notify";
import Popup from "devextreme-react/popup";
import SelectBox from "devextreme-react/select-box";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import {
    acknowledgeWarningLetter,
    fetchWarningLetterHtml,
    fetchWarningLetterPdf,
    fetchWarningLetterSignatureRecipients,
    finalizeWarningLetter,
    getWarningLetter,
    downloadWarningLetterSignedCopy,
    requestWarningLetterSignature,
    sendWarningLetterEmail,
    uploadWarningLetterSignedCopy,
} from "./warningLetterService";
import "./WarningLetters.scss";

const statusMap = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Finalized", cls: "m365-badge--primary" },
    2: { label: "Sent", cls: "m365-badge--success" },
    3: { label: "Acknowledged", cls: "m365-badge--success" },
    4: { label: "Signed Copy Received", cls: "m365-badge--success" },
};

const typeMap = {
    1: "Excess Fuel Consumption",
    2: "Excessive Speed",
    3: "Excessive Idling",
};

const isGuidLike = (value) =>
    typeof value === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const WarningLetterPreviewPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission } = usePermissions();
    const signedCopyInputRef = useRef(null);

    const [letter, setLetter] = useState(null);
    const [previewMode, setPreviewMode] = useState("html");
    const [htmlContent, setHtmlContent] = useState("");
    const [pdfUrl, setPdfUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [signaturePopupOpen, setSignaturePopupOpen] = useState(false);
    const [signatureRecipients, setSignatureRecipients] = useState([]);
    const [signatureRecipientsLoading, setSignatureRecipientsLoading] = useState(false);
    const [selectedSignatureRecipientId, setSelectedSignatureRecipientId] = useState(null);
    const [signatureSubmitting, setSignatureSubmitting] = useState(false);
    const [signedCopyUploading, setSignedCopyUploading] = useState(false);

    const canFinalize = hasPermission("_Finalize_WarningLetter");
    const canUpdate = hasPermission("_Update_WarningLetter");
    const canSend = hasPermission("_Send_WarningLetter");
    const canViewPdf = hasPermission("_Generate_WarningLetter_PDF");
    const canUploadSignedCopy = hasPermission("_Update_WarningLetter");

    const selectedSignatureRecipient = signatureRecipients.find((recipient) => recipient.id === selectedSignatureRecipientId) || null;
    const hasSignedCopy = Boolean(letter?.signedCopyUploadedAt);
    const isAcknowledgedState = letter?.status === 3 || hasSignedCopy;
    const workflowLocked = hasSignedCopy;

    const loadHtmlPreview = useCallback(async () => {
        try {
            setPreviewLoading(true);
            const html = await fetchWarningLetterHtml(id);
            setHtmlContent(html);
        } catch (error) {
            notify(error.message || "Failed to load HTML preview.", "error", 3000);
        } finally {
            setPreviewLoading(false);
        }
    }, [id]);

    const loadPdfPreview = useCallback(async (forceGenerate = false) => {
        try {
            setPreviewLoading(true);
            const document = await fetchWarningLetterPdf(id, forceGenerate);
            setPdfUrl((currentUrl) => {
                if (currentUrl) {
                    URL.revokeObjectURL(currentUrl);
                }

                return URL.createObjectURL(document.blob);
            });
        } catch (error) {
            notify(error.message || "Failed to load PDF preview.", "error", 3000);
        } finally {
            setPreviewLoading(false);
        }
    }, [id]);

    const loadDetail = useCallback(async () => {
        try {
            setLoading(true);
            const detail = await getWarningLetter(id);
            setLetter(detail);
        } catch (error) {
            notify(error.message || "Failed to load warning letter.", "error", 3000);
        } finally {
            setLoading(false);
        }
    }, [id]);

    const loadSignatureRecipients = useCallback(async () => {
        try {
            setSignatureRecipientsLoading(true);
            const recipients = await fetchWarningLetterSignatureRecipients(id);
            setSignatureRecipients(recipients);
        } catch (error) {
            notify(error.message || "Failed to load site representatives.", "error", 3000);
        } finally {
            setSignatureRecipientsLoading(false);
        }
    }, [id]);

    useEffect(() => {
        loadDetail();
    }, [loadDetail]);

    useEffect(() => {
        setSelectedSignatureRecipientId(letter?.signatureRequestRecipientUserId || null);
    }, [letter?.signatureRequestRecipientUserId]);

    useEffect(() => {
        if (previewMode === "pdf") {
            if (canViewPdf) {
                loadPdfPreview(false);
            }
            return;
        }

        loadHtmlPreview();
    }, [canViewPdf, loadHtmlPreview, loadPdfPreview, previewMode]);

    useEffect(() => () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
    }, [pdfUrl]);

    useEffect(() => {
        if (!signaturePopupOpen) {
            return;
        }

        loadSignatureRecipients();
    }, [loadSignatureRecipients, signaturePopupOpen]);

    const refreshAll = async (forceGenerate = false) => {
        await loadDetail();

        if (previewMode === "pdf") {
            await loadPdfPreview(forceGenerate);
            return;
        }

        await loadHtmlPreview();
    };

    const handleFinalize = async () => {
        if (!window.confirm(`Finalize warning letter #${id}?`)) {
            return;
        }

        try {
            await finalizeWarningLetter(id);
            notify("Warning letter finalized.", "success", 2500);
            refreshAll(previewMode === "pdf");
        } catch (error) {
            notify(error.message || "Failed to finalize warning letter.", "error", 3000);
        }
    };

    const handleAcknowledge = async () => {
        if (!window.confirm(`Mark warning letter #${id} as acknowledged?`)) {
            return;
        }

        try {
            await acknowledgeWarningLetter(id);
            notify("Warning letter acknowledged.", "success", 2500);
            refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to acknowledge warning letter.", "error", 3000);
        }
    };

    const handleSendEmail = async () => {
        const recipient = window.prompt("Email recipient", letter?.emailRecipient || letter?.employeeEmail || "");
        if (recipient === null) {
            return;
        }

        try {
            await sendWarningLetterEmail(id, recipient);
            notify("Warning letter emailed.", "success", 2500);
            refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to send warning letter email.", "error", 3000);
        }
    };

    const handleOpenRequestSignature = () => {
        setSelectedSignatureRecipientId(letter?.signatureRequestRecipientUserId || null);
        setSignaturePopupOpen(true);
    };

    const handleRequestSignature = async () => {
        if (!selectedSignatureRecipient) {
            notify("Select a site representative first.", "warning", 2500);
            return;
        }

        try {
            setSignatureSubmitting(true);
            await requestWarningLetterSignature(id, {
                signatureRecipientUserId: selectedSignatureRecipient.id,
                emailRecipient: selectedSignatureRecipient.email,
            });
            notify("Signature request sent.", "success", 2500);
            setSignaturePopupOpen(false);
            await refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to request signature.", "error", 3000);
        } finally {
            setSignatureSubmitting(false);
        }
    };

    const handleSignedCopySelected = async (event) => {
        const file = event.target.files?.[0];
        event.target.value = "";
        if (!file) {
            return;
        }

        try {
            setSignedCopyUploading(true);
            const updatedLetter = await uploadWarningLetterSignedCopy(id, file);
            setLetter(updatedLetter);
            notify("Signed copy uploaded.", "success", 2500);
            await refreshAll(false);
        } catch (error) {
            notify(error.message || "Failed to upload signed copy.", "error", 3000);
        } finally {
            setSignedCopyUploading(false);
        }
    };

    const handleDownloadSignedCopy = async () => {
        try {
            const fileDocument = await downloadWarningLetterSignedCopy(id);
            const url = URL.createObjectURL(fileDocument.blob);
            const link = window.document.createElement("a");
            link.href = url;
            link.download = fileDocument.fileName;
            window.document.body.appendChild(link);
            link.click();
            window.document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } catch (error) {
            notify(error.message || "Failed to download signed copy.", "error", 3000);
        }
    };

    const handleDownload = () => {
        if (!pdfUrl) {
            return;
        }

        const link = document.createElement("a");
        link.href = pdfUrl;
        link.download = `warning-letter-${id}.pdf`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const status = isAcknowledgedState
        ? { label: "Acknowledged", cls: "m365-badge--success" }
        : statusMap[letter?.status] || { label: "Unknown", cls: "m365-badge--neutral" };

    const uploadedByLabel = !letter?.signedCopyUploadedBy || isGuidLike(letter.signedCopyUploadedBy)
        ? "Refreshing uploader details..."
        : letter.signedCopyUploadedBy;

    return (
        <div className="warning-letter-page warning-letter-preview">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-file-pdf m365-page-header__icon" />
                    <h2 className="m365-page-header__title">Warning Letter Preview</h2>
                    {letter && <span className={`m365-badge ${status.cls}`}>{status.label}</span>}
                </div>
                <div className="m365-page-header__actions">
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/reports/warning-letters")}>
                        <i className="fa-light fa-arrow-left" /> Back
                    </button>
                    {canUpdate && letter?.status === 0 && (
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate(`/reports/warning-letters/${id}/edit`)}>
                            <i className="fa-light fa-pen" /> Edit
                        </button>
                    )}
                    <div className="warning-letter-preview__mode-toggle">
                        <button
                            type="button"
                            className={`m365-btn ${previewMode === "html" ? "m365-btn--primary" : "m365-btn--ghost"}`}
                            onClick={() => setPreviewMode("html")}
                            disabled={previewLoading || loading}
                        >
                            <i className="fa-light fa-code" /> HTML View
                        </button>
                        {canViewPdf && (
                            <button
                                type="button"
                                className={`m365-btn ${previewMode === "pdf" ? "m365-btn--primary" : "m365-btn--ghost"}`}
                                onClick={() => setPreviewMode("pdf")}
                                disabled={previewLoading || loading}
                            >
                                <i className="fa-light fa-file-pdf" /> PDF View
                            </button>
                        )}
                    </div>
                    {canViewPdf && (
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => { setPreviewMode("pdf"); loadPdfPreview(true); }} disabled={previewLoading || loading || workflowLocked} title={workflowLocked ? "Signed copy already uploaded. Regeneration disabled to preserve the issued document." : undefined}>
                            <i className="fa-light fa-rotate-right" /> Regenerate PDF
                        </button>
                    )}
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={handleDownload} disabled={!pdfUrl || !canViewPdf}>
                        <i className="fa-light fa-download" /> Download
                    </button>
                    {canFinalize && letter?.status === 0 && (
                        <button type="button" className="m365-btn m365-btn--primary" onClick={handleFinalize}>
                            <i className="fa-light fa-lock" /> Finalize
                        </button>
                    )}
                    {canSend && letter && letter.status !== 0 && (
                        <button type="button" className="m365-btn m365-btn--primary" onClick={handleSendEmail}>
                            <i className="fa-light fa-envelope" /> Send Email
                        </button>
                    )}
                    {canSend && letter && letter.status !== 0 && !workflowLocked && (
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleOpenRequestSignature}>
                            <i className="fa-light fa-signature" /> Request Signature
                        </button>
                    )}
                    {canUpdate && letter && letter.status !== 0 && letter.status !== 3 && !workflowLocked && (
                        <button type="button" className="m365-btn m365-btn--success" onClick={handleAcknowledge}>
                            <i className="fa-light fa-badge-check" /> Acknowledge
                        </button>
                    )}
                </div>
            </div>

            {letter && (
                <div className="warning-letter-preview__meta warning-letter-page__panel">
                    <div><span>Reference</span><strong>#{letter.id}</strong></div>
                    <div><span>Type</span><strong>{typeMap[letter.letterType] || "Unknown"}</strong></div>
                    <div><span>Employee</span><strong>{letter.employeeName}</strong></div>
                    <div><span>Vehicle</span><strong>{letter.vehicleHyoungNo}</strong></div>
                    <div><span>Site</span><strong>{letter.siteName}</strong></div>
                    <div><span>Recipient</span><strong>{letter.emailRecipient || letter.employeeEmail || "N/A"}</strong></div>
                </div>
            )}

            {letter && (
                <div className="warning-letter-page__panel warning-letter-preview__signed-copy">
                    <div className="warning-letter-preview__signed-copy-header">
                        <div>
                            <h3>Signed Copy</h3>
                            <p>{workflowLocked ? "Signed copy received. Workflow actions that would change the issued document are now locked." : "Track signature request and upload the scanned signed copy for record keeping."}</p>
                        </div>
                        <div className="warning-letter-preview__signed-copy-actions">
                            {canUploadSignedCopy && !workflowLocked && (
                                <>
                                    <input
                                        ref={signedCopyInputRef}
                                        type="file"
                                        accept=".pdf,.jpg,.jpeg,.png"
                                        className="warning-letter-preview__signed-copy-input"
                                        onChange={handleSignedCopySelected}
                                        disabled={signedCopyUploading}
                                    />
                                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => signedCopyInputRef.current?.click()} disabled={signedCopyUploading}>
                                        <i className={`fa-light ${signedCopyUploading ? "fa-spinner-third fa-spin" : "fa-upload"}`} /> {signedCopyUploading ? "Uploading..." : "Upload Signed Copy"}
                                    </button>
                                </>
                            )}
                            {letter.signedCopyUploadedAt && (
                                <button type="button" className="m365-btn m365-btn--ghost" onClick={handleDownloadSignedCopy} disabled={signedCopyUploading}>
                                    <i className="fa-light fa-download" /> Download Signed Copy
                                </button>
                            )}
                        </div>
                    </div>
                    {signedCopyUploading && (
                        <div className="warning-letter-preview__signed-copy-uploading">
                            <i className="fa-light fa-spinner-third fa-spin" /> Uploading signed document...
                        </div>
                    )}
                    <div className="warning-letter-preview__signed-copy-grid">
                        <div><span>Request Recipient</span><strong>{letter.signatureRequestRecipient || "N/A"}</strong></div>
                        <div><span>Requested At</span><strong>{letter.signatureRequestedAt ? new Date(letter.signatureRequestedAt).toLocaleString() : "N/A"}</strong></div>
                        <div><span>Uploaded At</span><strong>{letter.signedCopyUploadedAt ? new Date(letter.signedCopyUploadedAt).toLocaleString() : "Pending"}</strong></div>
                        <div><span>Uploaded By</span><strong>{uploadedByLabel || "N/A"}</strong></div>
                        <div><span>File</span><strong>{letter.signedCopyFileName || "No signed copy uploaded"}</strong></div>
                    </div>
                </div>
            )}

            <Popup
                visible={signaturePopupOpen}
                onHiding={() => !signatureSubmitting && setSignaturePopupOpen(false)}
                dragEnabled={false}
                showCloseButton={!signatureSubmitting}
                showTitle={false}
                width={520}
                height="auto"
                maxHeight="80vh"
                shading={true}
                shadingColor="rgba(0,0,0,0.4)"
                wrapperAttr={{ class: "warning-letter-preview__signature-popup" }}
            >
                <div className="warning-letter-preview__signature-picker">
                    <div className="warning-letter-preview__signature-picker-header">
                        <div>
                            <h3>Select Site Representative</h3>
                            <p>Only users assigned to this site are shown. The selected representative will receive both email and in-app notification.</p>
                        </div>
                    </div>

                    <div className="warning-letter-preview__signature-picker-field">
                        <span>Site Representative</span>
                        <SelectBox
                            dataSource={signatureRecipients}
                            value={selectedSignatureRecipientId}
                            onValueChanged={(event) => setSelectedSignatureRecipientId(event.value || null)}
                            valueExpr="id"
                            displayExpr={(item) => item ? `${item.userName || "Unknown"}${item.email ? ` (${item.email})` : ""}${item.isSiteAdmin ? " • Site admin" : ""}` : ""}
                            searchEnabled={true}
                            searchExpr={["userName", "email"]}
                            placeholder={signatureRecipientsLoading ? "Loading site representatives..." : "Search and select a site representative"}
                            showClearButton={true}
                            disabled={signatureRecipientsLoading || signatureSubmitting}
                            noDataText="No site representatives with email are assigned to this site"
                            stylingMode="outlined"
                        />
                    </div>

                    <div className="warning-letter-preview__signature-picker-actions">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setSignaturePopupOpen(false)} disabled={signatureSubmitting}>
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="m365-btn m365-btn--primary"
                            onClick={handleRequestSignature}
                            disabled={signatureRecipientsLoading || signatureSubmitting || !selectedSignatureRecipient}
                        >
                            <i className="fa-light fa-paper-plane-top" /> {signatureSubmitting ? "Sending..." : "Send Request"}
                        </button>
                    </div>
                </div>
            </Popup>

            <div className="warning-letter-page__panel warning-letter-preview__frame-wrap">
                {(loading || previewLoading) && <div className="warning-letter-preview__loading">Loading preview...</div>}
                {!loading && !previewLoading && previewMode === "html" && htmlContent && (
                    <iframe title={`Warning letter ${id} html`} className="warning-letter-preview__frame" srcDoc={htmlContent} />
                )}
                {!loading && !previewLoading && previewMode === "pdf" && pdfUrl && (
                    <iframe title={`Warning letter ${id}`} className="warning-letter-preview__frame" src={pdfUrl} />
                )}
            </div>
        </div>
    );
};

export default WarningLetterPreviewPage;