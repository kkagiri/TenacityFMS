/**
 * File: WarningLetterFormPage.js
 * Purpose: Creates and edits draft warning letters with candidate-assisted metric population.
 * Dependencies: React, react-router-dom, react-redux, warningLetterService, vehicleTransferFormUtils
 * Last Modified: 2026-04-06
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import notify from "devextreme/ui/notify";
import { useNavigate, useParams } from "react-router-dom";
import { useSelector } from "react-redux";
import { getUserDisplayName, getUserId } from "../transfers/vehicleTransferFormUtils";
import {
    createWarningLetter,
    getConsumptionCandidates,
    getEmployees,
    getSites,
    getVehicles,
    getWarningLetter,
    previewWarningLetterHtml,
    updateWarningLetter,
} from "./warningLetterService";
import "./WarningLetters.scss";

const typeOptions = [
    { value: 1, label: "Excess Fuel Consumption" },
    { value: 2, label: "Excessive Speed" },
    { value: 3, label: "Excessive Idling" },
];

const emptyFormState = {
    id: 0,
    letterType: 1,
    employeeId: "",
    vehicleId: "",
    siteId: "",
    letterDate: new Date().toISOString().slice(0, 10),
    periodStart: new Date().toISOString().slice(0, 10),
    periodEnd: new Date().toISOString().slice(0, 10),
    violationSummary: "",
    expectedValue: "",
    actualValue: "",
    excessValue: "",
    fuelPrice: "",
    excessCost: "",
    issuedByUserId: "",
    issuedByName: "",
    issuedByTitle: "Fleet Manager",
    emailRecipient: "",
    notes: "",
};

const toInputDate = (value) => {
    if (!value) {
        return "";
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const toPayload = (form) => ({
    id: Number(form.id || 0),
    letterType: Number(form.letterType),
    employeeId: Number(form.employeeId),
    vehicleId: Number(form.vehicleId),
    siteId: Number(form.siteId),
    letterDate: new Date(form.letterDate).toISOString(),
    periodStart: new Date(form.periodStart).toISOString(),
    periodEnd: new Date(form.periodEnd).toISOString(),
    violationSummary: form.violationSummary.trim(),
    expectedValue: form.expectedValue === "" ? null : Number(form.expectedValue),
    actualValue: form.actualValue === "" ? null : Number(form.actualValue),
    excessValue: form.excessValue === "" ? null : Number(form.excessValue),
    fuelPrice: form.fuelPrice === "" ? null : Number(form.fuelPrice),
    excessCost: form.excessCost === "" ? null : Number(form.excessCost),
    issuedByUserId: form.issuedByUserId,
    issuedByName: form.issuedByName.trim(),
    issuedByTitle: form.issuedByTitle.trim() || null,
    emailRecipient: form.emailRecipient.trim() || null,
    notes: form.notes.trim() || null,
});

const WarningLetterFormPage = () => {
    const navigate = useNavigate();
    const { id } = useParams();
    const currentUser = useSelector((state) => state.auth?.user || {});
    const isEditMode = Boolean(id);

    const [form, setForm] = useState(() => ({
        ...emptyFormState,
        issuedByUserId: String(getUserId(currentUser) || ""),
        issuedByName: getUserDisplayName(currentUser) || "",
    }));
    const [status, setStatus] = useState(0);
    const [lookups, setLookups] = useState({ sites: [], vehicles: [], employees: [] });
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidateId, setSelectedCandidateId] = useState(null);

    const selectedVehicle = useMemo(
        () => lookups.vehicles.find((vehicle) => String(vehicle.vehicleId || vehicle.id) === String(form.vehicleId)),
        [form.vehicleId, lookups.vehicles]
    );

    const isDraft = !isEditMode || status === 0;

    const loadLookups = useCallback(async () => {
        const [sites, vehicles, employees] = await Promise.all([
            getSites(),
            getVehicles(),
            getEmployees(),
        ]);

        setLookups({ sites, vehicles, employees });
    }, []);

    const loadDetail = useCallback(async () => {
        if (!isEditMode) {
            return;
        }

        const detail = await getWarningLetter(id);
        setStatus(detail.status ?? 0);
        setForm({
            id: detail.id,
            letterType: detail.letterType,
            employeeId: String(detail.employeeId || ""),
            vehicleId: String(detail.vehicleId || ""),
            siteId: String(detail.siteId || ""),
            letterDate: toInputDate(detail.letterDate),
            periodStart: toInputDate(detail.periodStart),
            periodEnd: toInputDate(detail.periodEnd),
            violationSummary: detail.violationSummary || "",
            expectedValue: detail.expectedValue ?? "",
            actualValue: detail.actualValue ?? "",
            excessValue: detail.excessValue ?? "",
            fuelPrice: detail.fuelPrice ?? "",
            excessCost: detail.excessCost ?? "",
            issuedByUserId: detail.issuedByUserId || String(getUserId(currentUser) || ""),
            issuedByName: detail.issuedByName || getUserDisplayName(currentUser) || "",
            issuedByTitle: detail.issuedByTitle || "Fleet Manager",
            emailRecipient: detail.emailRecipient || detail.employeeEmail || "",
            notes: detail.notes || "",
        });
    }, [currentUser, id, isEditMode]);

    useEffect(() => {
        let cancelled = false;

        const run = async () => {
            try {
                setLoading(true);
                await loadLookups();
                if (!cancelled) {
                    await loadDetail();
                }
            } catch (error) {
                notify(error.message || "Failed to load warning letter form.", "error", 3000);
            } finally {
                if (!cancelled) {
                    setLoading(false);
                }
            }
        };

        run();
        return () => {
            cancelled = true;
        };
    }, [loadDetail, loadLookups]);

    const updateField = (key, value) => {
        setForm((current) => ({
            ...current,
            [key]: value,
        }));
    };

    const handleLoadCandidates = async () => {
        try {
            setCandidateLoading(true);
            const result = await getConsumptionCandidates({
                letterType: form.letterType,
                siteId: form.siteId,
                vehicleId: form.vehicleId,
                employeeId: form.employeeId,
                startDate: form.periodStart,
                endDate: form.periodEnd,
            });
            setCandidates(result);
            if (!result.length) {
                notify("No matching consumption candidates were found.", "warning", 2500);
            }
        } catch (error) {
            notify(error.message || "Failed to load candidates.", "error", 3000);
        } finally {
            setCandidateLoading(false);
        }
    };

    const applyCandidate = (candidate) => {
        setSelectedCandidateId(candidate.consumptionId);
        setForm((current) => ({
            ...current,
            siteId: String(candidate.siteId || current.siteId),
            vehicleId: String(candidate.vehicleId || current.vehicleId),
            employeeId: candidate.employeeId ? String(candidate.employeeId) : current.employeeId,
            periodStart: toInputDate(candidate.periodStart),
            periodEnd: toInputDate(candidate.periodEnd),
            expectedValue: candidate.expectedValue ?? "",
            actualValue: candidate.actualValue ?? "",
            excessValue: candidate.excessValue ?? "",
            violationSummary: candidate.violationSummary || current.violationSummary,
        }));
    };

    const saveForm = async (previewAfterSave = false) => {
        try {
            setSaving(true);
            const payload = toPayload(form);
            const result = isEditMode
                ? await updateWarningLetter(id, payload)
                : await createWarningLetter(payload);

            const targetId = result.id || Number(id);
            notify(isEditMode ? "Warning letter updated." : "Warning letter created.", "success", 2500);

            if (previewAfterSave) {
                navigate(`/reports/warning-letters/${targetId}/preview`);
                return;
            }

            navigate(`/reports/warning-letters/${targetId}/edit`);
        } catch (error) {
            notify(error.message || "Failed to save warning letter.", "error", 3500);
        } finally {
            setSaving(false);
        }
    };

    const handlePreviewDraft = async () => {
        const previewWindow = window.open("", "_blank");
        if (!previewWindow) {
            notify("Popup blocked. Allow popups to preview the letter.", "warning", 3000);
            return;
        }

        previewWindow.document.write("<html><body style='font-family:Segoe UI,sans-serif;padding:24px;'>Generating preview...</body></html>");

        try {
            const html = await previewWarningLetterHtml(toPayload(form));
            previewWindow.document.open();
            previewWindow.document.write(html);
            previewWindow.document.close();
        } catch (error) {
            previewWindow.close();
            notify(error.message || "Failed to preview warning letter.", "error", 3000);
        }
    };

    return (
        <div className="warning-letter-page warning-letter-form">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-file-signature m365-page-header__icon" />
                    <h2 className="m365-page-header__title">{isEditMode ? `Warning Letter #${id}` : "New Warning Letter"}</h2>
                </div>
                <div className="m365-page-header__actions">
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/reports/warning-letters")}>
                        <i className="fa-light fa-arrow-left" /> Back
                    </button>
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={handlePreviewDraft} disabled={saving || loading}>
                        <i className="fa-light fa-eye" /> Draft Preview
                    </button>
                    {isDraft && (
                        <>
                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => saveForm(false)} disabled={saving || loading}>
                                <i className="fa-light fa-floppy-disk" /> Save Draft
                            </button>
                            <button type="button" className="m365-btn m365-btn--primary" onClick={() => saveForm(true)} disabled={saving || loading}>
                                <i className="fa-light fa-arrow-right" /> Save and Preview
                            </button>
                        </>
                    )}
                </div>
            </div>

            {!isDraft && (
                <div className="m365-info-banner m365-info-banner--warning warning-letter-page__banner">
                    <i className="fa-light fa-circle-info m365-info-banner__icon" />
                    <span className="m365-info-banner__text">This warning letter is no longer in draft state. Fields are shown read-only.</span>
                </div>
            )}

            <div className="warning-letter-page__panel">
                <div className="warning-letter-page__section-header">
                    <i className="fa-light fa-sliders" /> Candidate Source
                </div>
                <div className="warning-letter-page__filter-grid">
                    <label className="warning-letter-page__field">
                        <span>Letter Type</span>
                        <select className="m365-select" value={form.letterType} onChange={(event) => updateField("letterType", event.target.value)} disabled={!isDraft || loading}>
                            {typeOptions.map((option) => (
                                <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Site</span>
                        <select className="m365-select" value={form.siteId} onChange={(event) => updateField("siteId", event.target.value)} disabled={!isDraft || loading}>
                            <option value="">Select site</option>
                            {lookups.sites.map((site) => (
                                <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Vehicle</span>
                        <select className="m365-select" value={form.vehicleId} onChange={(event) => updateField("vehicleId", event.target.value)} disabled={!isDraft || loading}>
                            <option value="">Select vehicle</option>
                            {lookups.vehicles.map((vehicle) => (
                                <option key={vehicle.vehicleId} value={vehicle.vehicleId}>{vehicle.hyoungNo} {vehicle.numberPlate ? `- ${vehicle.numberPlate}` : ""}</option>
                            ))}
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Employee</span>
                        <select className="m365-select" value={form.employeeId} onChange={(event) => updateField("employeeId", event.target.value)} disabled={!isDraft || loading}>
                            <option value="">Select employee</option>
                            {lookups.employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                            ))}
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Period Start</span>
                        <input className="m365-date" type="date" value={form.periodStart} onChange={(event) => updateField("periodStart", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Period End</span>
                        <input className="m365-date" type="date" value={form.periodEnd} onChange={(event) => updateField("periodEnd", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                </div>

                {isDraft && (
                    <div className="warning-letter-page__section-actions">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={handleLoadCandidates} disabled={candidateLoading || loading}>
                            <i className="fa-light fa-magnifying-glass" /> {candidateLoading ? "Loading..." : "Load Candidates"}
                        </button>
                    </div>
                )}

                {candidates.length > 0 && (
                    <div className="warning-letter-candidates">
                        {candidates.map((candidate) => (
                            <button
                                type="button"
                                key={candidate.consumptionId}
                                className={`warning-letter-candidates__item ${selectedCandidateId === candidate.consumptionId ? "warning-letter-candidates__item--active" : ""}`}
                                onClick={() => applyCandidate(candidate)}
                                disabled={!isDraft}
                            >
                                <div className="warning-letter-candidates__topline">
                                    <strong>{candidate.vehicleHyoungNo}</strong>
                                    <span>{candidate.employeeName || "Unassigned"}</span>
                                    <span>{new Date(candidate.metricDate).toLocaleDateString("en-GB")}</span>
                                </div>
                                <div className="warning-letter-candidates__metrics">
                                    <span>Expected: {candidate.expectedValue ?? "-"}</span>
                                    <span>Actual: {candidate.actualValue ?? "-"}</span>
                                    <span>Excess: {candidate.excessValue ?? "-"}</span>
                                </div>
                                <div className="warning-letter-candidates__summary">{candidate.violationSummary}</div>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            <div className="warning-letter-page__panel">
                <div className="warning-letter-page__section-header">
                    <i className="fa-light fa-pen-to-square" /> Letter Details
                </div>
                <div className="warning-letter-page__form-grid">
                    <label className="warning-letter-page__field">
                        <span>Letter Date</span>
                        <input className="m365-date" type="date" value={form.letterDate} onChange={(event) => updateField("letterDate", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Issued By</span>
                        <input className="m365-input" type="text" value={form.issuedByName} onChange={(event) => updateField("issuedByName", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Issuer Title</span>
                        <input className="m365-input" type="text" value={form.issuedByTitle} onChange={(event) => updateField("issuedByTitle", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Email Recipient</span>
                        <input className="m365-input" type="email" value={form.emailRecipient} onChange={(event) => updateField("emailRecipient", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Expected Value</span>
                        <input className="m365-input" type="number" step="0.01" value={form.expectedValue} onChange={(event) => updateField("expectedValue", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Actual Value</span>
                        <input className="m365-input" type="number" step="0.01" value={form.actualValue} onChange={(event) => updateField("actualValue", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Excess Value</span>
                        <input className="m365-input" type="number" step="0.01" value={form.excessValue} onChange={(event) => updateField("excessValue", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Fuel Price</span>
                        <input className="m365-input" type="number" step="0.01" value={form.fuelPrice} onChange={(event) => updateField("fuelPrice", event.target.value)} disabled={!isDraft || loading || Number(form.letterType) !== 1} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Excess Cost</span>
                        <input className="m365-input" type="number" step="0.01" value={form.excessCost} onChange={(event) => updateField("excessCost", event.target.value)} disabled={!isDraft || loading || Number(form.letterType) !== 1} />
                    </label>
                    <label className="warning-letter-page__field warning-letter-page__field--wide">
                        <span>Violation Summary</span>
                        <textarea className="m365-input warning-letter-page__textarea" value={form.violationSummary} onChange={(event) => updateField("violationSummary", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                    <label className="warning-letter-page__field warning-letter-page__field--wide">
                        <span>Notes</span>
                        <textarea className="m365-input warning-letter-page__textarea" value={form.notes} onChange={(event) => updateField("notes", event.target.value)} disabled={!isDraft || loading} />
                    </label>
                </div>
            </div>

            {selectedVehicle && (
                <div className="warning-letter-page__panel warning-letter-page__summary">
                    <div className="warning-letter-page__section-header">
                        <i className="fa-light fa-truck" /> Vehicle Context
                    </div>
                    <div className="warning-letter-page__summary-grid">
                        <div><span>Vehicle</span><strong>{selectedVehicle.hyoungNo}</strong></div>
                        <div><span>Plate</span><strong>{selectedVehicle.numberPlate || "N/A"}</strong></div>
                        <div><span>Type</span><strong>{selectedVehicle.vehicleTypeName || selectedVehicle.vehicleType?.name || "N/A"}</strong></div>
                        <div><span>Site</span><strong>{lookups.sites.find((site) => String(site.id) === String(form.siteId))?.name || "N/A"}</strong></div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default WarningLetterFormPage;