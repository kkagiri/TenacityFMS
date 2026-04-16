/**
 * File:          WarningLetterFormPage.js
 * Purpose:       Multi-step wizard for creating/editing warning letters with candidate-based metric population.
 * Dependencies:  React, react-router-dom, react-redux, DevExtreme DateBox, warningLetterService
 * Last Modified: 2026-04-11
 *
 * Key Functions:
 * - handleLoadCandidates(): queries consumption records matching type + month
 * - handleSelectCandidate(): picks a candidate and pre-fills form fields
 * - handlePreview(): generates HTML preview via jsreport
 * - handleSave(): creates or updates the warning letter draft
 */
import React, { useEffect, useState } from "react";
import DateBox from "devextreme-react/date-box";
import notify from "devextreme/ui/notify";
import { useNavigate, useParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { getUserDisplayName, getUserId } from "../transfers/vehicleTransferFormUtils";
import EmployeeSearchableSelector from "../../../components/selectors/EmployeeSearchableSelector";
import SlidePanel from "../../../components/ui/SlidePanel";
import EmployeeFormPanel from "../../employees/components/EmployeeFormPanel";
import { createEmployee, updateEmployee } from "../../../redux/actions/employeeActions";
import {
    createWarningLetter,
    getConsumptionCandidates,
    getEmployees,
    getSites,
    getWarningLetter,
    getWarningLetterSettings,
    previewWarningLetterHtml,
    updateWarningLetter,
} from "./warningLetterService";
import WarningLetterCandidateGrid from "./WarningLetterCandidateGrid";
import "./WarningLetters.scss";

const typeOptions = [
    { value: 1, label: "Excess Fuel Consumption" },
    { value: 2, label: "Excessive Speed" },
    { value: 3, label: "Excessive Idling" },
];

const metricLabelsByType = {
    1: { expectedLabel: "Expected Average", actualLabel: "Actual Average", excessLabel: "Fuel Lost", expectedUnit: "km/l", actualUnit: "km/l", excessUnit: "litres", showFuelFields: true },
    2: { expectedLabel: "Speed Limit (km/h)", actualLabel: "Recorded Speed (km/h)", excessLabel: "Excess Speed (km/h)", expectedUnit: "km/h", actualUnit: "km/h", excessUnit: "km/h", showFuelFields: false },
    3: { expectedLabel: "Allowed Idle Hours", actualLabel: "Recorded Idle Hours", excessLabel: "Excess Idle Hours", expectedUnit: "hours", actualUnit: "hours", excessUnit: "hours", showFuelFields: false },
};

const stepLabels = ["Type & Month", "Select Candidate", "Letter Details", "Preview"];

const getCurrentMonth = () => {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    return y + "-" + m;
};

const formatDateParts = (year, month, day) => {
    return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
};

const getMonthRange = (yearMonth) => {
    const parts = yearMonth.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);
    const lastDay = new Date(year, month, 0).getDate();
    return {
        periodStart: formatDateParts(year, month, 1),
        periodEnd: formatDateParts(year, month, lastDay),
    };
};

const monthStringToDate = (value) => {
    if (!value) return null;

    const parts = value.split("-");
    const year = Number(parts[0]);
    const month = Number(parts[1]);

    if (!Number.isFinite(year) || !Number.isFinite(month)) {
        return null;
    }

    return new Date(year, month - 1, 1);
};

const dateToMonthString = (value) => {
    if (!value) return "";

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
        return "";
    }

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return `${year}-${month}`;
};

const toInputDate = (value) => {
    if (!value) return "";
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? "" : date.toISOString().slice(0, 10);
};

const normalizeEmployeeName = (value) =>
    (value || "")
        .toString()
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

const getEmployeeId = (employee) =>
    employee?.id ?? employee?.Id ?? employee?.employeeId ?? employee?.EmployeeId ?? "";

const getEmployeeDisplayName = (employee) => {
    const firstName = (employee?.firstName || employee?.FirstName || "").toString().trim();
    const lastName = (employee?.lastName || employee?.LastName || "").toString().trim();
    const combinedName = `${firstName} ${lastName}`.trim();

    return (
        employee?.fullName ||
        employee?.FullName ||
        employee?.fullname ||
        employee?.employeeName ||
        employee?.EmployeeName ||
        employee?.name ||
        employee?.Name ||
        combinedName
    );
};

const getEmployeeWorkNumber = (employee) =>
    employee?.employeeWorkNo || employee?.EmployeeWorkNo || "";

const getEmployeeSiteId = (employee) => {
    const rawValue = employee?.siteId ?? employee?.SiteId;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
};

const getEmployeePosition = (employee) =>
    employee?.position || employee?.Position || "";

const hasSucceeded = (response) =>
    response?.success === true || response?.Success === true;

const resolveMessage = (response, fallback) =>
    response?.message || response?.Message || fallback;

const unwrapCreatedEmployee = (response) =>
    response?.employeeDto ||
    response?.EmployeeDto ||
    response?.data ||
    response?.Data ||
    response?.employee ||
    response?.Employee ||
    null;

const hasEmployeePosition = (employee) =>
    Boolean(getEmployeePosition(employee).toString().trim());

const getEmployeeVehicleIds = (employee) => {
    const rawVehicles = employee?.vehicles || employee?.Vehicles || [];
    return Array.isArray(rawVehicles)
        ? rawVehicles
            .map((vehicleId) => Number(vehicleId))
            .filter((vehicleId) => Number.isFinite(vehicleId))
        : [];
};

const getEmployeeName = (employee) =>
    getEmployeeDisplayName(employee);

const getSiteName = (sites, siteId) => {
    if (!siteId) return "Unassigned";
    const matchedSite = (Array.isArray(sites) ? sites : []).find(
        (site) => String(site?.id ?? site?.Id) === String(siteId)
    );
    return matchedSite?.name || matchedSite?.Name || `Site ${siteId}`;
};

const isEmployeeAllowedForWarningLetter = ({ employee, siteId, vehicleId, candidateEmployeeId }) => {
    if (!employee) return false;

    const employeeSiteId = getEmployeeSiteId(employee);
    if (employeeSiteId === null || String(employeeSiteId) === String(siteId)) {
        return true;
    }

    if (candidateEmployeeId && String(getEmployeeId(employee)) === String(candidateEmployeeId)) {
        return true;
    }

    return getEmployeeVehicleIds(employee).includes(Number(vehicleId));
};

const resolveCandidateEmployeeSelection = (candidate, employeeOptions) => {
    const candidateSiteId = Number(candidate?.siteId);
    const sameSiteEmployees = employeeOptions.filter((employee) => {
        if (!Number.isFinite(candidateSiteId)) {
            return true;
        }

        const employeeSiteId = getEmployeeSiteId(employee);
        return employeeSiteId === null || employeeSiteId === candidateSiteId;
    });

    if (candidate?.employeeId) {
        const exactEmployee = sameSiteEmployees.find(
            (employee) => String(getEmployeeId(employee)) === String(candidate.employeeId)
        );

        if (getEmployeeId(exactEmployee)) {
            return String(getEmployeeId(exactEmployee));
        }
    }

    const gpsDriverName = normalizeEmployeeName(candidate?.gpsDriverName);

    if (gpsDriverName) {
        const matchedEmployee = sameSiteEmployees.find(
            (employee) => normalizeEmployeeName(getEmployeeName(employee)) === gpsDriverName
        );

        if (getEmployeeId(matchedEmployee)) {
            return String(getEmployeeId(matchedEmployee));
        }
    }

    return "";
};

const computeExcessCost = (excessValue, fuelPrice) => {
    const fuelLost = Number(excessValue);
    const price = Number(fuelPrice);
    if (!Number.isFinite(fuelLost) || !Number.isFinite(price)) return "";
    if (fuelLost <= 0 || price <= 0) return "";
    return Math.round(fuelLost * price * 100) / 100;
};

const toApiDateTime = (value) => {
    if (!value) return null;
    return `${value}T00:00:00`;
};

const toPayload = (form) => {
    return {
        id: Number(form.id || 0),
        letterType: Number(form.letterType),
        employeeId: Number(form.employeeId),
        vehicleId: Number(form.vehicleId),
        siteId: Number(form.siteId),
        letterDate: toApiDateTime(form.letterDate),
        periodStart: toApiDateTime(form.affectedDate),
        periodEnd: toApiDateTime(form.affectedDate),
        violationSummary: form.violationSummary.trim(),
        expectedValue: form.expectedValue === "" ? null : Number(form.expectedValue),
        actualValue: form.actualValue === "" ? null : Number(form.actualValue),
        excessValue: form.excessValue === "" ? null : Number(form.excessValue),
        fuelPrice: form.fuelPrice === "" ? null : Number(form.fuelPrice),
        excessCost: form.excessCost === "" ? null : Number(form.excessCost),
        issuedByUserId: form.issuedByUserId,
        issuedByName: form.issuedByName.trim(),
        issuedByTitle: form.issuedByTitle.trim() || null,
    };
};

const WarningLetterFormPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { id } = useParams();
    const currentUser = useSelector((state) => state.auth?.user || {});
    const isEditMode = Boolean(id);

    const [step, setStep] = useState(isEditMode ? 3 : 1);
    const [letterType, setLetterType] = useState(1);
    const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
    const [candidates, setCandidates] = useState([]);
    const [selectedCandidate, setSelectedCandidate] = useState(null);
    const [employees, setEmployees] = useState([]);
    const [sites, setSites] = useState([]);
    const [previewHtml, setPreviewHtml] = useState("");
    const [status, setStatus] = useState(0);
    const [loading, setLoading] = useState(false);
    const [candidateLoading, setCandidateLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [previewLoading, setPreviewLoading] = useState(false);
    const [vehicleDisplayName, setVehicleDisplayName] = useState("");
    const [isEmployeePanelOpen, setIsEmployeePanelOpen] = useState(false);
    const [employeePanelMode, setEmployeePanelMode] = useState("create");
    const [isSavingEmployee, setIsSavingEmployee] = useState(false);

    const [form, setForm] = useState({
        id: 0, letterType: 1, employeeId: "", vehicleId: "", siteId: "",
        letterDate: new Date().toISOString().slice(0, 10),
        affectedDate: "",
        violationSummary: "", expectedValue: "", actualValue: "", excessValue: "",
        fuelPrice: "", excessCost: "",
        issuedByUserId: String(getUserId(currentUser) || ""),
        issuedByName: getUserDisplayName(currentUser) || "",
        issuedByTitle: "Fleet Manager",
    });
    const [settings, setSettings] = useState({
        fuelPricePerLitre: 0,
        issuerName: "",
        issuerTitle: "",
        maxWarningCountBeforeLast: 3,
    });

    const metricLabels = metricLabelsByType[Number(form.letterType)] || metricLabelsByType[1];
    const isDraft = !isEditMode || status === 0;
    const resolvedSiteId = form.siteId || selectedCandidate?.siteId || "";
    const resolvedSiteName = getSiteName(sites, resolvedSiteId);
    const resolvedVehicleName = vehicleDisplayName || (form.vehicleId ? `Vehicle #${form.vehicleId}` : "");
    const selectedEmployee = employees.find(
        (employee) => String(getEmployeeId(employee)) === String(form.employeeId)
    );
    const selectedEmployeeSiteId = getEmployeeSiteId(selectedEmployee);
    const selectedEmployeeAllowed = !form.employeeId || isEmployeeAllowedForWarningLetter({
        employee: selectedEmployee,
        siteId: form.siteId,
        vehicleId: form.vehicleId,
        candidateEmployeeId: selectedCandidate?.employeeId,
    });
    const selectedEmployeeValidationMessage = !form.employeeId
        ? ""
        : !selectedEmployee
            ? "The selected employee could not be resolved from the employee list. Please select the employee again."
            : selectedEmployeeAllowed
                ? ""
                : `The selected employee belongs to ${getSiteName(sites, selectedEmployeeSiteId)} and is not currently linked to the selected vehicle/site context. Saving this warning letter will assign the vehicle and update GPSGate driver details.`;
    const selectedEmployeePositionMessage = !form.employeeId
        ? ""
        : !selectedEmployee
            ? ""
            : hasEmployeePosition(selectedEmployee)
                ? ""
                : "The selected employee must have a position before you can generate this warning letter. Update the employee position, then select the employee again.";

    useEffect(() => {
        Promise.allSettled([getEmployees(), getSites()])
            .then(([employeeResult, siteResult]) => {
                if (employeeResult.status === "fulfilled") {
                    setEmployees(employeeResult.value);
                } else {
                    setEmployees([]);
                    notify(employeeResult.reason?.message || "Failed to load employees.", "warning", 3000);
                }

                if (siteResult.status === "fulfilled") {
                    setSites(siteResult.value);
                } else {
                    setSites([]);
                    notify(siteResult.reason?.message || "Failed to load your assigned sites.", "warning", 3000);
                }
            });
    }, []);

    useEffect(() => {
        let cancelled = false;
        getWarningLetterSettings()
            .then((settings) => {
                if (cancelled) return;
                const price = Number(settings?.fuelPricePerLitre ?? 0);
                const maxWarningCount = Number(settings?.maxWarningCountBeforeLast ?? 3);
                setSettings({
                    fuelPricePerLitre: Number.isFinite(price) ? price : 0,
                    issuerName: (settings?.issuerName || "").toString(),
                    issuerTitle: (settings?.issuerTitle || "").toString(),
                    maxWarningCountBeforeLast: Number.isFinite(maxWarningCount) && maxWarningCount > 0 ? maxWarningCount : 3,
                });
            })
            .catch(() => {
                if (!cancelled) {
                    notify("Failed to load warning letter settings.", "warning", 2500);
                }
            });
        return () => { cancelled = true; };
    }, []);

    // Keep fuel price + excess cost in sync with the configured setting and the current fuel-lost value
    useEffect(() => {
        if (Number(form.letterType) !== 1) return;
        setForm((prev) => {
            const nextFuelPrice = settings.fuelPricePerLitre ? String(settings.fuelPricePerLitre) : "";
            const nextExcessCost = computeExcessCost(prev.excessValue, settings.fuelPricePerLitre);
            const cost = nextExcessCost === "" ? "" : String(nextExcessCost);
            if (prev.fuelPrice === nextFuelPrice && prev.excessCost === cost) {
                return prev;
            }
            return { ...prev, fuelPrice: nextFuelPrice, excessCost: cost };
        });
    }, [settings.fuelPricePerLitre, form.excessValue, form.letterType]);

    useEffect(() => {
        setForm((prev) => {
            const nextIssuedByName = settings.issuerName?.trim() || prev.issuedByName;
            const nextIssuedByTitle = settings.issuerTitle?.trim() || prev.issuedByTitle;

            if (prev.issuedByName === nextIssuedByName && prev.issuedByTitle === nextIssuedByTitle) {
                return prev;
            }

            return {
                ...prev,
                issuedByName: nextIssuedByName,
                issuedByTitle: nextIssuedByTitle,
            };
        });
    }, [settings.issuerName, settings.issuerTitle]);

    useEffect(() => {
        if (!isEditMode) return;
        let cancelled = false;
        const load = async () => {
            try {
                setLoading(true);
                const d = await getWarningLetter(id);
                if (cancelled) return;
                setStatus(d.status ?? 0);
                setLetterType(d.letterType);
                setVehicleDisplayName(d.vehicleHyoungNo || d.numberPlate || d.vehicleName || "");
                setForm({
                    id: d.id, letterType: d.letterType,
                    employeeId: String(d.employeeId || ""), vehicleId: String(d.vehicleId || ""),
                    siteId: String(d.siteId || ""),
                    letterDate: toInputDate(d.letterDate),
                    affectedDate: toInputDate(d.periodStart),
                    violationSummary: d.violationSummary || "",
                    expectedValue: d.expectedValue ?? "", actualValue: d.actualValue ?? "",
                    excessValue: d.excessValue ?? "",
                    fuelPrice: d.fuelPrice ?? "", excessCost: d.excessCost ?? "",
                    issuedByUserId: d.issuedByUserId || String(getUserId(currentUser) || ""),
                    issuedByName: d.issuedByName || getUserDisplayName(currentUser) || "",
                    issuedByTitle: d.issuedByTitle || "Fleet Manager",
                });
            } catch (err) {
                notify(err.message || "Failed to load warning letter.", "error", 3000);
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, [currentUser, id, isEditMode]);

    useEffect(() => {
        if (!selectedCandidate || isEditMode || employees.length === 0) {
            return;
        }

        const fallbackEmployeeId = selectedCandidate.employeeId ? String(selectedCandidate.employeeId) : "";
        const resolvedEmployeeId = resolveCandidateEmployeeSelection(selectedCandidate, employees);

        if (!resolvedEmployeeId) {
            return;
        }

        setForm((prev) => {
            if (prev.employeeId && prev.employeeId !== fallbackEmployeeId) {
                return prev;
            }

            if (prev.employeeId === resolvedEmployeeId) {
                return prev;
            }

            return {
                ...prev,
                employeeId: resolvedEmployeeId,
            };
        });
    }, [employees, isEditMode, selectedCandidate]);

    const handleOpenCreateEmployee = () => {
        setEmployeePanelMode("create");
        setIsEmployeePanelOpen(true);
    };

    const handleOpenEditEmployee = () => {
        if (!selectedEmployee) {
            return;
        }

        setEmployeePanelMode("edit");
        setIsEmployeePanelOpen(true);
    };

    const refreshEmployees = async () => {
        const employeeList = await getEmployees();
        setEmployees(employeeList);
        return employeeList;
    };

    const handleCreateEmployee = async (payload) => {
        try {
            setIsSavingEmployee(true);
            const response = await dispatch(createEmployee(payload));

            if (!hasSucceeded(response)) {
                throw new Error(resolveMessage(response, "Failed to create employee."));
            }

            const createdEmployee = unwrapCreatedEmployee(response);
            const refreshedEmployees = await refreshEmployees();
            const createdEmployeeId = Number(getEmployeeId(createdEmployee));

            if (Number.isFinite(createdEmployeeId) && createdEmployeeId > 0) {
                updateField("employeeId", String(createdEmployeeId));
            } else if (Array.isArray(refreshedEmployees)) {
                const matchedEmployee = refreshedEmployees.find(
                    (employee) => normalizeEmployeeName(getEmployeeName(employee)) === normalizeEmployeeName(getEmployeeName(createdEmployee))
                );

                if (matchedEmployee) {
                    updateField("employeeId", String(getEmployeeId(matchedEmployee)));
                }
            }

            setIsEmployeePanelOpen(false);
            notify("Employee created successfully.", "success", 2500);
        } catch (error) {
            notify(error?.message || "Failed to create employee.", "error", 3000);
        } finally {
            setIsSavingEmployee(false);
        }
    };

    const handleUpdateEmployee = async (payload) => {
        const employeeId = Number(getEmployeeId(selectedEmployee));
        if (!Number.isFinite(employeeId) || employeeId <= 0) {
            return;
        }

        try {
            setIsSavingEmployee(true);
            const response = await dispatch(updateEmployee(employeeId, payload));

            if (!hasSucceeded(response)) {
                throw new Error(resolveMessage(response, "Failed to update employee."));
            }

            await refreshEmployees();
            setIsEmployeePanelOpen(false);
            notify("Employee updated successfully.", "success", 2500);
        } catch (error) {
            notify(error?.message || "Failed to update employee.", "error", 3000);
        } finally {
            setIsSavingEmployee(false);
        }
    };

    const updateField = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const handleLoadCandidates = async () => {
        const range = getMonthRange(selectedMonth);
        try {
            setCandidateLoading(true);
            const result = await getConsumptionCandidates({
                letterType, startDate: range.periodStart, endDate: range.periodEnd,
            });
            setCandidates(result);
            if (!result.length) {
                notify("No matching candidates found for this period.", "warning", 2500);
                return;
            }
            setStep(2);
        } catch (err) {
            notify(err.message || "Failed to load candidates.", "error", 3000);
        } finally {
            setCandidateLoading(false);
        }
    };

    const handleSelectCandidate = (c) => {
        if (c.hasExistingLetter) return;
        setSelectedCandidate(c);
        setVehicleDisplayName(c.vehicleHyoungNo || c.numberPlate || "");
        const resolvedEmployeeId = resolveCandidateEmployeeSelection(c, employees);
        setForm((prev) => ({
            ...prev,
            letterType,
            siteId: String(c.siteId || ""),
            vehicleId: String(c.vehicleId || ""),
            employeeId: resolvedEmployeeId,
            affectedDate: toInputDate(c.metricDate),
            expectedValue: c.expectedValue ?? "",
            actualValue: c.actualValue ?? "",
            excessValue: c.excessValue ?? "",
            violationSummary: c.violationSummary || "",
        }));
        setStep(3);
    };

    const handlePreview = async () => {
        if (!Number(form.employeeId)) {
            notify("Please assign an employee before previewing.", "warning", 2500);
            return;
        }
        if (selectedEmployeePositionMessage) {
            notify(selectedEmployeePositionMessage, "warning", 3500);
            return;
        }
        try {
            setPreviewLoading(true);
            const html = await previewWarningLetterHtml(toPayload(form));
            setPreviewHtml(html);
            setStep(4);
        } catch (err) {
            notify(err.message || "Failed to generate preview.", "error", 3000);
        } finally {
            setPreviewLoading(false);
        }
    };

    const handleSave = async (goToPreviewPage = false) => {
        if (!Number(form.employeeId)) {
            notify("Employee is required.", "warning", 2500);
            return;
        }
        if (selectedEmployeePositionMessage) {
            notify(selectedEmployeePositionMessage, "warning", 3500);
            return;
        }
        try {
            setSaving(true);
            const payload = toPayload(form);
            const result = isEditMode
                ? await updateWarningLetter(id, payload)
                : await createWarningLetter(payload);
            const targetId = result.id || Number(id);
            notify(isEditMode ? "Warning letter updated." : "Warning letter created.", "success", 2500);
            if (goToPreviewPage) {
                navigate("/reports/warning-letters/" + targetId + "/preview");
                return;
            }
            navigate("/reports/warning-letters");
        } catch (err) {
            notify(err.message || "Failed to save warning letter.", "error", 3500);
        } finally {
            setSaving(false);
        }
    };

    const activeSteps = isEditMode ? [3, 4] : [1, 2, 3, 4];

    return (
        <div className="warning-letter-page warning-letter-wizard">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-file-signature m365-page-header__icon" />
                    <h2 className="m365-page-header__title">
                        {isEditMode ? "Edit Warning Letter #" + id : "New Warning Letter"}
                    </h2>
                </div>
                <div className="m365-page-header__actions">
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => navigate("/reports/warning-letters")}>
                        <i className="fa-light fa-arrow-left" /> Back to List
                    </button>
                </div>
            </div>

            <div className="warning-letter-wizard__stepper">
                {activeSteps.map((s, idx) => (
                    <div
                        key={s}
                        className={
                            "warning-letter-wizard__step-indicator"
                            + (step === s ? " warning-letter-wizard__step-indicator--active" : "")
                            + (step > s ? " warning-letter-wizard__step-indicator--done" : "")
                        }
                    >
                        <span className="warning-letter-wizard__step-number">{idx + 1}</span>
                        <span className="warning-letter-wizard__step-label">{stepLabels[s - 1]}</span>
                    </div>
                ))}
            </div>

            {!isDraft && (
                <div className="m365-info-banner m365-info-banner--warning warning-letter-page__banner">
                    <i className="fa-light fa-circle-info m365-info-banner__icon" />
                    <span className="m365-info-banner__text">This letter is no longer a draft. Fields are read-only.</span>
                </div>
            )}

            {step === 1 && (
                <div className="warning-letter-page__panel warning-letter-wizard__panel">
                    <div className="warning-letter-wizard__panel-content">
                        <div className="warning-letter-page__section-header">
                            <i className="fa-light fa-sliders" /> Select Letter Type & Period
                        </div>
                        <div className="warning-letter-wizard__type-period">
                            <label className="warning-letter-page__field">
                                <span>Letter Type</span>
                                <select className="m365-select" value={letterType} onChange={(e) => setLetterType(Number(e.target.value))}>
                                    {typeOptions.map((o) => (
                                        <option key={o.value} value={o.value}>{o.label}</option>
                                    ))}
                                </select>
                            </label>
                            <label className="warning-letter-page__field">
                                <span>Month</span>
                                <DateBox
                                    className="warning-letter-page__month-picker"
                                    type="date"
                                    pickerType="calendar"
                                    stylingMode="outlined"
                                    displayFormat="MMMM yyyy"
                                    value={monthStringToDate(selectedMonth)}
                                    calendarOptions={{
                                        zoomLevel: "year",
                                        minZoomLevel: "year",
                                        maxZoomLevel: "decade",
                                    }}
                                    openOnFieldClick={true}
                                    showClearButton={false}
                                    onValueChanged={(e) => {
                                        const nextValue = dateToMonthString(e.value);
                                        if (nextValue) {
                                            setSelectedMonth(nextValue);
                                        }
                                    }}
                                />
                            </label>
                        </div>
                    </div>
                    <div className="warning-letter-wizard__step-actions">
                        <button type="button" className="m365-btn m365-btn--primary" onClick={handleLoadCandidates} disabled={candidateLoading}>
                            <i className="fa-light fa-magnifying-glass" /> {candidateLoading ? "Loading..." : "Load Candidates"}
                        </button>
                    </div>
                </div>
            )}

            {step === 2 && (
                <div className="warning-letter-page__panel warning-letter-wizard__panel">
                    <div className="warning-letter-wizard__panel-content">
                        <div className="warning-letter-page__section-header">
                            <i className="fa-light fa-list-check" /> Select a Candidate
                        </div>
                        <p className="warning-letter-wizard__hint">
                            {typeOptions.find((t) => t.value === letterType)?.label} &mdash; {selectedMonth}
                            {" \u00B7 "}{candidates.length} candidate{candidates.length !== 1 ? "s" : ""}
                        </p>
                        <WarningLetterCandidateGrid
                            candidates={candidates}
                            metricLabels={metricLabels}
                            selectedCandidate={selectedCandidate}
                            onSelectCandidate={handleSelectCandidate}
                        />
                    </div>
                    <div className="warning-letter-wizard__step-actions">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setStep(1)}>
                            <i className="fa-light fa-arrow-left" /> Back
                        </button>
                    </div>
                </div>
            )}

            {step === 3 && (
                <div className="warning-letter-page__panel warning-letter-wizard__panel">
                    <div className="warning-letter-wizard__panel-content">
                        <div className="warning-letter-page__section-header">
                            <i className="fa-light fa-pen-to-square" /> Letter Details
                        </div>

                        <div className="warning-letter-wizard__employee-section">
                            <div className="warning-letter-wizard__employee-section-header">
                                <i className="fa-light fa-user" /> Employee Assignment
                            </div>
                            {selectedCandidate?.gpsDriverName && (
                                <div className="warning-letter-wizard__employee-gps">
                                    <span>GPS Driver Name</span>
                                    <strong>{selectedCandidate.gpsDriverName}</strong>
                                </div>
                            )}
                            <label className="warning-letter-page__field">
                                <span>
                                    Assign Employee
                                    {!form.employeeId && <span className="warning-letter-wizard__required"> *required</span>}
                                </span>
                                <div className="tw-space-y-2">
                                    <div className="tw-flex tw-items-start tw-gap-2">
                                        <div className="tw-min-w-0 tw-flex-1">
                                            <EmployeeSearchableSelector
                                                value={form.employeeId ? Number(form.employeeId) : null}
                                                onValueChanged={(event) => updateField("employeeId", event?.value ? String(event.value) : "")}
                                                placeholder="Search employee by name or work number"
                                                disabled={!isDraft || loading}
                                                width="100%"
                                                activeOnly={true}
                                                siteId={form.siteId || selectedCandidate?.siteId || null}
                                            />
                                        </div>
                                        <button
                                            type="button"
                                            className="m365-btn m365-btn--ghost tw-shrink-0"
                                            onClick={handleOpenEditEmployee}
                                            disabled={!isDraft || loading || !selectedEmployee}
                                            title="Edit selected employee"
                                        >
                                            <i className="fa-light fa-pen-to-square" />
                                            Edit Employee
                                        </button>
                                        <button
                                            type="button"
                                            className="m365-btn m365-btn--ghost tw-shrink-0"
                                            onClick={handleOpenCreateEmployee}
                                            disabled={!isDraft || loading}
                                        >
                                            <i className="fa-light fa-user-plus" />
                                            Add Employee
                                        </button>
                                    </div>

                                    {isDraft && (
                                        <span className="m365-field__hint">
                                            Search for an employee. If no match exists, use Add Employee to create one with the current site and vehicle prefilled.
                                        </span>
                                    )}

                                    {selectedEmployee && (
                                        <div className="warning-letter-wizard__employee-meta">
                                            <div className="warning-letter-wizard__employee-meta-header">
                                                <span>Selected Employee</span>
                                            </div>
                                            <strong>{getEmployeeDisplayName(selectedEmployee)}</strong>
                                            <span>Work Number: {getEmployeeWorkNumber(selectedEmployee) || "Not set"}</span>
                                            <span>Position: {getEmployeePosition(selectedEmployee) || "Not set"}</span>
                                            <span>Site: {getSiteName(sites, selectedEmployeeSiteId)}</span>
                                        </div>
                                    )}
                                </div>
                            </label>
                            {!form.employeeId && (
                                <div className="m365-info-banner m365-info-banner--warning warning-letter-wizard__employee-warn">
                                    <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
                                    <span className="m365-info-banner__text">An employee must be assigned to generate the warning letter.</span>
                                </div>
                            )}
                            {selectedEmployeeValidationMessage && (
                                <div className="m365-info-banner m365-info-banner--warning warning-letter-wizard__employee-warn">
                                    <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
                                    <span className="m365-info-banner__text">{selectedEmployeeValidationMessage}</span>
                                </div>
                            )}
                            {selectedEmployeePositionMessage && (
                                <div className="m365-info-banner m365-info-banner--warning warning-letter-wizard__employee-warn">
                                    <i className="fa-light fa-triangle-exclamation m365-info-banner__icon" />
                                    <span className="m365-info-banner__text">{selectedEmployeePositionMessage}</span>
                                </div>
                            )}
                        </div>

                        <div className="warning-letter-page__form-grid warning-letter-wizard__details-grid">
                            <label className="warning-letter-page__field">
                                <span>Letter Date</span>
                                <input className="m365-date" type="date" value={form.letterDate} onChange={(e) => updateField("letterDate", e.target.value)} disabled={!isDraft || loading} />
                            </label>
                            <label className="warning-letter-page__field">
                                <span>Site</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="text" value={resolvedSiteName} readOnly title="Derived from the selected warning letter candidate or saved warning letter context" />
                                <small className="warning-letter-page__field-hint">Read from the selected vehicle/site context.</small>
                            </label>
                            <label className="warning-letter-page__field">
                                <span>Vehicle</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="text" value={resolvedVehicleName} readOnly title="Derived from the selected warning letter candidate or saved warning letter context" />
                                <small className="warning-letter-page__field-hint">Read from the selected vehicle context.</small>
                            </label>
                            <label className="warning-letter-page__field">
                                <span>Affected Date</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="text" value={form.affectedDate || ""} readOnly title="Read from the selected warning letter candidate or saved warning letter context" />
                                <small className="warning-letter-page__field-hint">Read from the selected warning letter data.</small>
                            </label>
                            <label className="warning-letter-page__field">
                                <span>{metricLabels.expectedLabel}</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="number" step="0.01" value={form.expectedValue} readOnly title="Read from the selected warning letter candidate or saved warning letter context" />
                                <small className="warning-letter-page__field-hint">Read from the selected warning letter data.</small>
                            </label>
                            <label className="warning-letter-page__field">
                                <span>{metricLabels.actualLabel}</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="number" step="0.01" value={form.actualValue} readOnly title="Read from the selected warning letter candidate or saved warning letter context" />
                                <small className="warning-letter-page__field-hint">Read from the selected warning letter data.</small>
                            </label>
                            <label className="warning-letter-page__field">
                                <span>{metricLabels.excessLabel}</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="number" step="0.01" value={form.excessValue} readOnly title="Read from the selected warning letter candidate or saved warning letter context" />
                                <small className="warning-letter-page__field-hint">Read from the selected warning letter data.</small>
                            </label>
                            {metricLabels.showFuelFields && (
                                <>
                                    <label className="warning-letter-page__field">
                                        <span>Fuel Price</span>
                                        <input className="m365-input warning-letter-page__readonly-input" type="number" value={form.fuelPrice} readOnly title="Configured in System Settings" />
                                        <small className="warning-letter-page__field-hint">Read from warning letter settings.</small>
                                    </label>
                                    <label className="warning-letter-page__field">
                                        <span>Excess Cost</span>
                                        <input className="m365-input warning-letter-page__readonly-input" type="number" value={form.excessCost} readOnly title="Auto-calculated: Fuel Lost x Fuel Price" />
                                        <small className="warning-letter-page__field-hint">Fuel Lost x Fuel Price.</small>
                                    </label>
                                </>
                            )}
                            <label className="warning-letter-page__field">
                                <span>Issued By</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="text" value={form.issuedByName} readOnly title="Configured in warning letter settings" />
                                <small className="warning-letter-page__field-hint">Read from warning letter settings.</small>
                            </label>
                            <label className="warning-letter-page__field">
                                <span>Issuer Title</span>
                                <input className="m365-input warning-letter-page__readonly-input" type="text" value={form.issuedByTitle} readOnly title="Configured in warning letter settings" />
                                <small className="warning-letter-page__field-hint">Read from warning letter settings.</small>
                            </label>
                            <label className="warning-letter-page__field warning-letter-page__field--wide">
                                <span>Violation Summary</span>
                                <textarea className="m365-input warning-letter-page__textarea warning-letter-page__readonly-input" value={form.violationSummary} readOnly title="Read from the selected warning letter candidate or saved warning letter context" />
                                <small className="warning-letter-page__field-hint">Read from the selected warning letter data.</small>
                            </label>
                        </div>
                    </div>

                    <div className="warning-letter-wizard__step-actions">
                        {!isEditMode && (
                            <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setStep(2)}>
                                <i className="fa-light fa-arrow-left" /> Back
                            </button>
                        )}
                        <button type="button" className="m365-btn m365-btn--primary" onClick={handlePreview} disabled={previewLoading || saving || loading}>
                            <i className="fa-light fa-eye" /> {previewLoading ? "Generating..." : "Preview"}
                        </button>
                    </div>
                </div>
            )}

            {step === 4 && (
                <div className="warning-letter-page__panel warning-letter-wizard__panel">
                    <div className="warning-letter-wizard__panel-content warning-letter-wizard__panel-content--preview">
                        <div className="warning-letter-page__section-header">
                            <i className="fa-light fa-file-lines" /> Letter Preview
                        </div>
                        <div className="warning-letter-preview__frame-wrap">
                            {previewHtml ? (
                                <iframe
                                    className="warning-letter-preview__frame"
                                    srcDoc={previewHtml}
                                    title="Warning Letter Preview"
                                    sandbox="allow-same-origin"
                                />
                            ) : (
                                <div className="warning-letter-preview__loading">No preview available.</div>
                            )}
                        </div>
                    </div>
                    <div className="warning-letter-wizard__step-actions">
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => setStep(3)}>
                            <i className="fa-light fa-arrow-left" /> Back
                        </button>
                        <button type="button" className="m365-btn m365-btn--ghost" onClick={() => handleSave(false)} disabled={saving}>
                            <i className="fa-light fa-floppy-disk" /> {saving ? "Saving..." : "Save Draft"}
                        </button>
                        <button type="button" className="m365-btn m365-btn--primary" onClick={() => handleSave(true)} disabled={saving}>
                            <i className="fa-light fa-arrow-right" /> {saving ? "Saving..." : "Save & View"}
                        </button>
                    </div>
                </div>
            )}

            <SlidePanel
                open={isEmployeePanelOpen}
                onClose={() => setIsEmployeePanelOpen(false)}
                title={employeePanelMode === "edit" ? "Edit Employee" : "Quick Add Employee"}
                width={900}
                panelClassName="employee-quick-add-panel-shell"
            >
                <EmployeeFormPanel
                    mode={employeePanelMode}
                    employee={employeePanelMode === "edit" ? selectedEmployee : null}
                    initialValues={{
                        siteId: resolvedSiteId,
                        vehicles: form.vehicleId || selectedCandidate?.vehicleId
                            ? [Number(form.vehicleId || selectedCandidate?.vehicleId)]
                            : [],
                    }}
                    sites={sites}
                    saving={isSavingEmployee}
                    hideSectionBorders
                    onSubmit={employeePanelMode === "edit" ? handleUpdateEmployee : handleCreateEmployee}
                    onClose={() => setIsEmployeePanelOpen(false)}
                />
            </SlidePanel>
        </div>
    );
};

export default WarningLetterFormPage;