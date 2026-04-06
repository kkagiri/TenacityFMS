/**
 * File: WarningLetterPreviewPage.js
 * Purpose: Presents a saved warning letter with PDF preview and workflow actions.
 * Dependencies: React, react-router-dom, warningLetterService, usePermissions
 * Last Modified: 2026-04-06
 */
import React, { useCallback, useEffect, useState } from "react";
import notify from "devextreme/ui/notify";
import { useNavigate, useParams } from "react-router-dom";
import { usePermissions } from "../../../hooks/usePermissions";
import {
    acknowledgeWarningLetter,
    fetchWarningLetterPdf,
    finalizeWarningLetter,
    getWarningLetter,
    sendWarningLetterEmail,
} from "./warningLetterService";
import "./WarningLetters.scss";

const statusMap = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Finalized", cls: "m365-badge--primary" },
    2: { label: "Sent", cls: "m365-badge--success" },
    3: { label: "Acknowledged", cls: "m365-badge--success" },
};

const typeMap = {
    1: "Excess Fuel Consumption",
    2: "Excessive Speed",
    3: "Excessive Idling",
};

const WarningLetterPreviewPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const { hasPermission } = usePermissions();

    const [letter, setLetter] = useState(null);
    const [pdfUrl, setPdfUrl] = useState("");
    const [loading, setLoading] = useState(false);
    const [pdfLoading, setPdfLoading] = useState(false);

    const canFinalize = hasPermission("_Finalize_WarningLetter");
    const canUpdate = hasPermission("_Update_WarningLetter");
    const canSend = hasPermission("_Send_WarningLetter");

    const loadPreview = useCallback(async (forceGenerate = false) => {
        try {
            setPdfLoading(true);
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
            setPdfLoading(false);
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

    useEffect(() => {
        loadDetail();
        loadPreview(false);
    }, [loadDetail, loadPreview]);

    useEffect(() => () => {
        if (pdfUrl) {
            URL.revokeObjectURL(pdfUrl);
        }
    }, [pdfUrl]);

    const refreshAll = async (forceGenerate = false) => {
        await loadDetail();
        await loadPreview(forceGenerate);
    };

    const handleFinalize = async () => {
        if (!window.confirm(`Finalize warning letter #${id}?`)) {
            return;
        }

        try {
            await finalizeWarningLetter(id);
            notify("Warning letter finalized.", "success", 2500);
            refreshAll(true);
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

    const status = statusMap[letter?.status] || { label: "Unknown", cls: "m365-badge--neutral" };

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
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => refreshAll(true)} disabled={pdfLoading || loading}>
                        <i className="fa-light fa-rotate-right" /> Regenerate PDF
                    </button>
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={handleDownload} disabled={!pdfUrl}>
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
                    {canUpdate && letter && letter.status !== 0 && letter.status !== 3 && (
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

            <div className="warning-letter-page__panel warning-letter-preview__frame-wrap">
                {(loading || pdfLoading) && <div className="warning-letter-preview__loading">Loading preview...</div>}
                {!loading && !pdfLoading && pdfUrl && (
                    <iframe title={`Warning letter ${id}`} className="warning-letter-preview__frame" src={pdfUrl} />
                )}
            </div>
        </div>
    );
};

export default WarningLetterPreviewPage;