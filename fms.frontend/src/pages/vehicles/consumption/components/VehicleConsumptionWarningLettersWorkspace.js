/**
 * File: VehicleConsumptionWarningLettersWorkspace.js
 * Purpose: Shows warning-letter eligibility and linked warning letters for a single consumption detail row.
 * Dependencies: React, react-router-dom, DevExtreme LoadIndicator, warningLetterService, usePermissions
 * Last Modified: 2026-04-24
 */
import React, { useEffect, useMemo, useState } from "react";
import LoadIndicator from "devextreme-react/load-indicator";
import { useNavigate } from "react-router-dom";
import SlidePanel from "../../../../components/ui/SlidePanel";
import { usePermissions } from "../../../../hooks/usePermissions";
import {
    fetchWarningLetterPdf,
    getConsumptionCandidates,
    getWarningLetters,
} from "../../warningLetters/warningLetterService";
import { formatDisplayDate, formatNumber, toLocalInputDateValue } from "../vehicleConsumptionService";

const LETTER_TYPES = [
    {
        id: 1,
        title: "Fuel Lost",
        icon: "fa-light fa-gas-pump",
        badgeClass: "m365-badge--warning",
        actualLabel: "Actual average",
        excessLabel: "Fuel lost",
        actualFormatter: (candidate) => `${formatNumber(candidate?.actualValue)} km/L`,
        excessFormatter: (candidate) => `${formatNumber(candidate?.excessValue)} L`,
    },
    {
        id: 2,
        title: "Overspeeding",
        icon: "fa-light fa-gauge-high",
        badgeClass: "m365-badge--error",
        actualLabel: "Recorded speed",
        excessLabel: "Excess speed",
        actualFormatter: (candidate) => `${formatNumber(candidate?.actualValue)} km/h`,
        excessFormatter: (candidate) => `${formatNumber(candidate?.excessValue)} km/h`,
    },
];

const WORKFLOW_STAGE_MAP = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Approved", cls: "m365-badge--primary" },
    2: { label: "Pending Signed", cls: "m365-badge--warning" },
    3: { label: "Signed", cls: "m365-badge--success" },
    4: { label: "Acknowledged", cls: "m365-badge--success" },
};

const toNumber = (value) => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
};

const matchesViolationDate = (warningLetter, targetDate) => {
    if (!targetDate) {
        return false;
    }

    const startDate = toLocalInputDateValue(warningLetter?.periodStart);
    const endDate = toLocalInputDateValue(warningLetter?.periodEnd || warningLetter?.periodStart);

    if (!startDate) {
        return false;
    }

    return startDate <= targetDate && endDate >= targetDate;
};

const findMatchingCandidate = (candidates, consumptionId) =>
    (Array.isArray(candidates) ? candidates : []).find(
        (candidate) => toNumber(candidate?.consumptionId ?? candidate?.ConsumptionId) === toNumber(consumptionId)
    ) || null;

const getWorkflowBadge = (workflowStage) =>
    WORKFLOW_STAGE_MAP[toNumber(workflowStage)] || { label: "Unknown", cls: "m365-badge--neutral" };

const VehicleConsumptionWarningLettersWorkspace = ({ detail }) => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();

    const canReadWarningLetters = hasPermission("_Read_WarningLetter");
    const canCreateWarningLetters = hasPermission("_Create_WarningLetter");
    const canUpdateWarningLetters = hasPermission("_Update_WarningLetter");
    const canViewWarningLetterPdf = hasPermission("_Generate_WarningLetter_PDF");

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [candidatesByType, setCandidatesByType] = useState({});
    const [relatedLetters, setRelatedLetters] = useState([]);
    const [previewLetter, setPreviewLetter] = useState(null);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [previewError, setPreviewError] = useState("");
    const [previewPdfUrl, setPreviewPdfUrl] = useState("");

    const violationDate = useMemo(() => toLocalInputDateValue(detail?.date), [detail?.date]);

    useEffect(() => () => {
        if (previewPdfUrl) {
            URL.revokeObjectURL(previewPdfUrl);
        }
    }, [previewPdfUrl]);

    const closePreviewPanel = () => {
        setPreviewLetter(null);
        setPreviewError("");
        setPreviewLoading(false);
        setPreviewPdfUrl((currentUrl) => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }

            return "";
        });
    };

    const openPreviewPanel = async (warningLetter) => {
        if (!warningLetter || !canViewWarningLetterPdf) {
            return;
        }

        setPreviewLetter(warningLetter);
        setPreviewError("");
        setPreviewLoading(true);
        setPreviewPdfUrl((currentUrl) => {
            if (currentUrl) {
                URL.revokeObjectURL(currentUrl);
            }

            return "";
        });

        try {
            let document;

            try {
                document = await fetchWarningLetterPdf(warningLetter.id, false);
            } catch (error) {
                document = await fetchWarningLetterPdf(warningLetter.id, true);
            }

            setPreviewPdfUrl(URL.createObjectURL(document.blob));
        } catch (error) {
            setPreviewError(error.message || "Failed to load warning letter PDF preview.");
        } finally {
            setPreviewLoading(false);
        }
    };

    useEffect(() => {
        let isActive = true;

        const loadWorkspace = async () => {
            if (!canReadWarningLetters || !detail?.vehicleId || !detail?.id || !violationDate) {
                if (isActive) {
                    setCandidatesByType({});
                    setRelatedLetters([]);
                }
                return;
            }

            setLoading(true);
            setError("");

            const candidateRequests = LETTER_TYPES.map((letterType) =>
                getConsumptionCandidates({
                    letterType: letterType.id,
                    vehicleId: detail.vehicleId,
                    startDate: violationDate,
                    endDate: violationDate,
                })
            );

            const [candidateResults, warningLettersResult] = await Promise.all([
                Promise.allSettled(candidateRequests),
                getWarningLetters({ vehicleId: String(detail.vehicleId) })
                    .then((letters) => ({ status: "fulfilled", value: letters }))
                    .catch((requestError) => ({ status: "rejected", reason: requestError })),
            ]);

            if (!isActive) {
                return;
            }

            const nextCandidatesByType = {};
            let candidateLoadFailed = false;

            candidateResults.forEach((result, index) => {
                const letterTypeId = LETTER_TYPES[index].id;
                if (result.status === "fulfilled") {
                    nextCandidatesByType[letterTypeId] = findMatchingCandidate(result.value, detail.id);
                    return;
                }

                candidateLoadFailed = true;
                nextCandidatesByType[letterTypeId] = null;
            });

            const nextRelatedLetters = warningLettersResult.status === "fulfilled"
                ? (Array.isArray(warningLettersResult.value) ? warningLettersResult.value : [])
                    .filter((warningLetter) => LETTER_TYPES.some((type) => type.id === toNumber(warningLetter?.letterType)))
                    .filter((warningLetter) => matchesViolationDate(warningLetter, violationDate))
                : [];

            setCandidatesByType(nextCandidatesByType);
            setRelatedLetters(nextRelatedLetters);

            if (warningLettersResult.status === "rejected") {
                setError(warningLettersResult.reason?.message || "Failed to load related warning letters.");
            } else if (candidateLoadFailed) {
                setError("Some warning-letter eligibility checks could not be completed.");
            }

            setLoading(false);
        };

        loadWorkspace();

        return () => {
            isActive = false;
        };
    }, [canReadWarningLetters, detail?.id, detail?.vehicleId, violationDate]);

    if (!canReadWarningLetters) {
        return (
            <div className="m365-info-banner m365-info-banner--warning">
                <i className="fa-light fa-lock m365-info-banner__icon" />
                <span className="m365-info-banner__text">You do not have permission to view warning letters for this consumption record.</span>
            </div>
        );
    }

    return (
        <div className="vehicle-consumption-warning-letters">
            <div className="vehicle-consumption-warning-letters__toolbar">
                <div>
                    <h3 className="vehicle-consumption-warning-letters__title">Consumption Warning Letters</h3>
                    <p className="vehicle-consumption-warning-letters__subtitle">
                        Eligibility and linked letters resolved from the current vehicle, violation date, and warning-letter type.
                    </p>
                </div>
                <div className="vehicle-consumption-warning-letters__toolbar-actions">
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={() => navigate(`/reports/warning-letters?vehicleId=${detail?.vehicleId}`)}
                    >
                        <i className="fa-light fa-arrow-up-right-from-square" /> Open Full Workspace
                    </button>
                </div>
            </div>

            {loading ? (
                <div className="vehicle-consumption-warning-letters__loading">
                    <LoadIndicator visible={true} width={28} height={28} />
                    <span>Loading warning-letter status...</span>
                </div>
            ) : null}

            {error ? (
                <div className="m365-info-banner m365-info-banner--warning">
                    <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
                    <span className="m365-info-banner__text">{error}</span>
                </div>
            ) : null}

            <div className="vehicle-consumption-warning-letters__grid">
                {LETTER_TYPES.map((letterType) => {
                    const candidate = candidatesByType[letterType.id] || null;
                    const letters = relatedLetters
                        .filter((warningLetter) => toNumber(warningLetter?.letterType) === letterType.id)
                        .sort((left, right) => toNumber(right?.id) - toNumber(left?.id));
                    const latestLetter = letters[0] || null;
                    const statusBadge = letters.length > 0
                        ? { label: `${letters.length} linked`, cls: "m365-badge--primary" }
                        : candidate
                            ? { label: "Eligible", cls: letterType.badgeClass }
                            : { label: "No match", cls: "m365-badge--neutral" };

                    return (
                        <article key={letterType.id} className="vehicle-consumption-warning-letters__card">
                            <div className="vehicle-consumption-warning-letters__card-header">
                                <div className="vehicle-consumption-warning-letters__card-title-wrap">
                                    <span className="vehicle-consumption-warning-letters__card-icon"><i className={letterType.icon} /></span>
                                    <div>
                                        <h4 className="vehicle-consumption-warning-letters__card-title">{letterType.title}</h4>
                                        <p className="vehicle-consumption-warning-letters__card-subtitle">Violation date {formatDisplayDate(detail?.date)}</p>
                                    </div>
                                </div>
                                <span className={`m365-badge ${statusBadge.cls}`}>{statusBadge.label}</span>
                            </div>

                            {candidate ? (
                                <div className="vehicle-consumption-warning-letters__metrics">
                                    <div className="vehicle-consumption-warning-letters__metric">
                                        <span>{letterType.actualLabel}</span>
                                        <strong>{letterType.actualFormatter(candidate)}</strong>
                                    </div>
                                    <div className="vehicle-consumption-warning-letters__metric">
                                        <span>{letterType.excessLabel}</span>
                                        <strong>{letterType.excessFormatter(candidate)}</strong>
                                    </div>
                                </div>
                            ) : (
                                <div className="vehicle-consumption-warning-letters__empty-state">
                                    This consumption row does not currently meet the configured {letterType.title.toLowerCase()} criteria.
                                </div>
                            )}

                            <div className="vehicle-consumption-warning-letters__summary" title={candidate?.violationSummary || ""}>
                                {candidate?.violationSummary || `No ${letterType.title.toLowerCase()} warning-letter candidate was detected for this record.`}
                            </div>

                            <div className="vehicle-consumption-warning-letters__actions">
                                {candidate && letters.length === 0 && canCreateWarningLetters ? (
                                    <button
                                        type="button"
                                        className="m365-btn m365-btn--primary"
                                        onClick={() => navigate("/reports/warning-letters/new", {
                                            state: {
                                                initialCandidate: candidate,
                                            },
                                        })}
                                    >
                                        <i className="fa-light fa-plus" /> Create Warning Letter
                                    </button>
                                ) : null}

                                {latestLetter ? (
                                    <button
                                        type="button"
                                        className="m365-btn m365-btn--ghost"
                                        onClick={() => openPreviewPanel(latestLetter)}
                                        disabled={!canViewWarningLetterPdf}
                                    >
                                        <i className="fa-light fa-file-magnifying-glass" /> Preview Latest
                                    </button>
                                ) : null}

                                {latestLetter && canUpdateWarningLetters && toNumber(latestLetter.workflowStage) === 0 ? (
                                    <button
                                        type="button"
                                        className="m365-btn m365-btn--ghost"
                                        onClick={() => navigate(`/reports/warning-letters/${latestLetter.id}/edit`)}
                                    >
                                        <i className="fa-light fa-pen-to-square" /> Edit Draft
                                    </button>
                                ) : null}
                            </div>

                            {letters.length > 0 ? (
                                <div className="vehicle-consumption-warning-letters__linked-list">
                                    {letters.map((warningLetter) => {
                                        const workflowBadge = getWorkflowBadge(warningLetter?.workflowStage);

                                        return (
                                            <button
                                                key={warningLetter.id}
                                                type="button"
                                                className="vehicle-consumption-warning-letters__linked-item"
                                                onClick={() => openPreviewPanel(warningLetter)}
                                                disabled={!canViewWarningLetterPdf}
                                            >
                                                <div>
                                                    <strong>Warning Letter #{warningLetter.id}</strong>
                                                    <span>{formatDisplayDate(warningLetter.letterDate)}</span>
                                                </div>
                                                <span className={`m365-badge ${workflowBadge.cls}`}>{workflowBadge.label}</span>
                                            </button>
                                        );
                                    })}
                                </div>
                            ) : null}
                        </article>
                    );
                })}
            </div>

            <SlidePanel
                open={Boolean(previewLetter)}
                onClose={closePreviewPanel}
                title={previewLetter ? `Warning Letter #${previewLetter.id} PDF` : "Warning Letter PDF"}
                width={1500}
                headerActions={previewLetter ? (
                    <span className={`m365-badge ${getWorkflowBadge(previewLetter.workflowStage).cls}`}>
                        {getWorkflowBadge(previewLetter.workflowStage).label}
                    </span>
                ) : null}
                panelClassName="vehicle-consumption-warning-letters__preview-panel"
            >
                <div className="vehicle-consumption-warning-letters__preview-shell">
                    {previewLoading ? (
                        <div className="vehicle-consumption-warning-letters__preview-loading">
                            <LoadIndicator visible={true} width={32} height={32} />
                            <span>Loading warning letter PDF...</span>
                        </div>
                    ) : null}

                    {!previewLoading && previewError ? (
                        <div className="vehicle-consumption-warning-letters__preview-error">
                            <div className="m365-info-banner m365-info-banner--error">
                                <i className="fa-light fa-circle-exclamation m365-info-banner__icon" />
                                <span className="m365-info-banner__text">{previewError}</span>
                            </div>
                        </div>
                    ) : null}

                    {!previewLoading && !previewError && previewPdfUrl ? (
                        <iframe
                            className="vehicle-consumption-warning-letters__preview-frame"
                            src={previewPdfUrl}
                            title={previewLetter ? `Warning Letter ${previewLetter.id} PDF Preview` : "Warning Letter PDF Preview"}
                        />
                    ) : null}
                </div>
            </SlidePanel>
        </div>
    );
};

export default VehicleConsumptionWarningLettersWorkspace;