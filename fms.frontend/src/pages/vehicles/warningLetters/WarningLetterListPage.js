/**
 * File: WarningLetterListPage.js
 * Purpose: Displays the warning letter register with filters and draft/workflow shortcuts.
 * Dependencies: React, DataGrid, react-router-dom, warningLetterService, usePermissions
 * Last Modified: 2026-04-09
 */
import React, { useCallback, useEffect, useRef, useState } from "react";
import DataGrid, {
    Column,
    SearchPanel,
    HeaderFilter,
    FilterRow,
    Export,
    Paging,
    Pager,
    LoadPanel,
    Sorting,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import SlidePanel from "../../../components/ui/SlidePanel";
import { usePermissions } from "../../../hooks/usePermissions";
import { quickSearchEmployees, searchEmployees } from "../../../redux/actions/employeeActions";
import { getUserId } from "../transfers/vehicleTransferFormUtils";
import {
    acknowledgeWarningLetter,
    deleteWarningLetter,
    getSites,
    getWarningLetters,
} from "./warningLetterService";
import WarningLetterSettingsPanelContent from "./WarningLetterSettingsPanelContent";
import "./WarningLetters.scss";

const MIN_EMPLOYEE_SEARCH_TERM = 2;

const normalizeEmployeeSearchResults = (payload) => {
    if (Array.isArray(payload)) {
        return payload;
    }

    if (Array.isArray(payload?.data)) {
        return payload.data;
    }

    if (Array.isArray(payload?.Data)) {
        return payload.Data;
    }

    return [];
};

const getEmployeeOptionId = (employee) => String(employee?.id ?? employee?.Id ?? "");

const getEmployeeOptionLabel = (employee) => {
    const fullName = employee?.fullName || employee?.FullName || `Employee #${getEmployeeOptionId(employee)}`;
    const workNo = employee?.employeeWorkNo || employee?.EmployeeWorkNo;
    return workNo ? `${fullName} (${workNo})` : fullName;
};

const workflowStageMap = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Approved", cls: "m365-badge--primary" },
    2: { label: "Pending Signed", cls: "m365-badge--warning" },
    3: { label: "Signed", cls: "m365-badge--success" },
    4: { label: "Acknowledged", cls: "m365-badge--success" },
};

const workflowStageTickerOrder = [0, 1, 2, 3, 4];

const typeMap = {
    1: "Excess Fuel",
    2: "Excess Speed",
    3: "Excess Idling",
};

const canDeleteWarningLetterInStage = (workflowStage) => [0, 1, 2].includes(Number(workflowStage));

const WarningLetterListPage = () => {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const currentUser = useSelector((state) => state.auth?.user || {});
    const [searchParams, setSearchParams] = useSearchParams();
    const gridRef = useRef(null);
    const employeeSearchRef = useRef(null);
    const employeeSearchTimeoutRef = useRef(null);
    const { hasPermission } = usePermissions();

    const [letters, setLetters] = useState([]);
    const [sites, setSites] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [employeeSearchTerm, setEmployeeSearchTerm] = useState("");
    const [employeeSuggestions, setEmployeeSuggestions] = useState([]);
    const [employeeSearchOpen, setEmployeeSearchOpen] = useState(false);
    const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
    const [filters, setFilters] = useState({
        siteId: "",
        employeeId: searchParams.get("employeeId") || "",
        workflowStage: "",
        letterType: "",
        startDate: "",
        endDate: "",
    });

    const canCreate = hasPermission("_Create_WarningLetter");
    const canUpdate = hasPermission("_Update_WarningLetter");
    const canDelete = hasPermission("_Delete_WarningLetter");
    const canDeleteAny = hasPermission("_delete_any_letter");
    const canSend = hasPermission("_Send_WarningLetter");
    const canManageSettings = hasPermission("_Update_WarningLetter");
    const currentUserId = String(getUserId(currentUser) || "");

    const loadReferenceData = useCallback(async () => {
        const [siteResult] = await Promise.allSettled([getSites()]);

        if (siteResult.status === "fulfilled") {
            setSites(siteResult.value);
        } else {
            setSites([]);
            notify(siteResult.reason?.message || "Failed to load your assigned sites.", "warning", 3000);
        }
    }, []);

    const performEmployeeSearch = useCallback(async (term) => {
        const normalizedTerm = term.trim();
        if (normalizedTerm.length < MIN_EMPLOYEE_SEARCH_TERM) {
            setEmployeeSuggestions([]);
            setEmployeeSearchLoading(false);
            return;
        }

        setEmployeeSearchLoading(true);

        try {
            const quickResult = await quickSearchEmployees(normalizedTerm, 8);
            let matches = normalizeEmployeeSearchResults(quickResult?.data);

            if (!matches.length) {
                const fallbackResult = await dispatch(searchEmployees(normalizedTerm, { limit: 8, active: true }));
                matches = normalizeEmployeeSearchResults(fallbackResult?.data);
            }

            setEmployeeSuggestions(matches);
            setEmployeeSearchOpen(true);
        } catch (error) {
            setEmployeeSuggestions([]);
            setEmployeeSearchOpen(true);
        } finally {
            setEmployeeSearchLoading(false);
        }
    }, [dispatch]);

    const loadLetters = useCallback(async () => {
        try {
            setLoading(true);
            const data = await getWarningLetters(filters);
            setLetters(Array.isArray(data) ? data : []);
        } catch (error) {
            setLetters([]);
            notify(error.message || "Failed to load warning letters.", "error", 3000);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        loadReferenceData();
    }, [loadReferenceData]);

    useEffect(() => {
        return () => {
            if (employeeSearchTimeoutRef.current) {
                clearTimeout(employeeSearchTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        loadLetters();
    }, [loadLetters]);

    useEffect(() => {
        const queryEmployeeId = searchParams.get("employeeId") || "";
        setFilters((current) =>
            current.employeeId === queryEmployeeId
                ? current
                : {
                    ...current,
                    employeeId: queryEmployeeId,
                }
        );

        if (!queryEmployeeId) {
            setEmployeeSearchTerm("");
        }
    }, [searchParams]);

    useEffect(() => {
        if (!filters.employeeId || employeeSearchTerm) {
            return;
        }

        const matchedLetter = letters.find((letter) => String(letter?.employeeId || "") === String(filters.employeeId) && letter?.employeeName);
        if (matchedLetter?.employeeName) {
            setEmployeeSearchTerm(matchedLetter.employeeName);
        }
    }, [employeeSearchTerm, filters.employeeId, letters]);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (employeeSearchRef.current && !employeeSearchRef.current.contains(event.target)) {
                setEmployeeSearchOpen(false);
            }
        };

        if (employeeSearchOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [employeeSearchOpen]);

    const setFilterValue = (key, value) => {
        setFilters((current) => {
            const next = {
                ...current,
                [key]: value,
            };

            if (key === "employeeId") {
                const nextParams = new URLSearchParams(searchParams);
                if (value) {
                    nextParams.set("employeeId", value);
                } else {
                    nextParams.delete("employeeId");
                }

                setSearchParams(nextParams, { replace: true });
            }

            return next;
        });
    };

    const handleEmployeeSearchChange = (event) => {
        const value = event.target.value || "";
        setEmployeeSearchTerm(value);

        if (filters.employeeId) {
            setFilterValue("employeeId", "");
        }

        if (employeeSearchTimeoutRef.current) {
            clearTimeout(employeeSearchTimeoutRef.current);
        }

        if (value.trim().length < MIN_EMPLOYEE_SEARCH_TERM) {
            setEmployeeSuggestions([]);
            setEmployeeSearchOpen(false);
            setEmployeeSearchLoading(false);
            return;
        }

        setEmployeeSearchLoading(true);
        setEmployeeSearchOpen(true);
        employeeSearchTimeoutRef.current = setTimeout(() => {
            performEmployeeSearch(value);
        }, 300);
    };

    const handleEmployeeSuggestionSelect = (employee) => {
        setEmployeeSearchTerm(getEmployeeOptionLabel(employee));
        setEmployeeSuggestions([]);
        setEmployeeSearchOpen(false);
        setFilterValue("employeeId", getEmployeeOptionId(employee));
    };

    const handleEmployeeFilterClear = () => {
        if (employeeSearchTimeoutRef.current) {
            clearTimeout(employeeSearchTimeoutRef.current);
        }

        setEmployeeSearchTerm("");
        setEmployeeSuggestions([]);
        setEmployeeSearchOpen(false);
        setEmployeeSearchLoading(false);
        setFilterValue("employeeId", "");
    };

    const handleDelete = async (row) => {
        if (!window.confirm(`Delete warning letter #${row.id}?`)) {
            return;
        }

        try {
            await deleteWarningLetter(row.id);
            notify("Warning letter deleted.", "success", 2500);
            loadLetters();
        } catch (error) {
            notify(error.message || "Failed to delete warning letter.", "error", 3000);
        }
    };

    const handleAcknowledge = async (row) => {
        if (!window.confirm(`Mark warning letter #${row.id} as acknowledged?`)) {
            return;
        }

        try {
            await acknowledgeWarningLetter(row.id);
            notify("Warning letter acknowledged.", "success", 2500);
            loadLetters();
        } catch (error) {
            notify(error.message || "Failed to acknowledge warning letter.", "error", 3000);
        }
    };

    const renderStatus = ({ data, value }) => {
        const item = workflowStageMap[data?.workflowStage ?? value] || { label: value || "Unknown", cls: "m365-badge--neutral" };
        return <span className={`m365-badge ${item.cls}`}>{item.label}</span>;
    };

    const renderLetterType = ({ value }) => typeMap[value] || value || "-";

    const renderDate = ({ value }) =>
        value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

    const renderCreatedBy = ({ data }) => data?.createdByName || data?.createdBy || "-";

    const renderActions = ({ data }) => (
        <div className="warning-letter-list__actions">
            <button type="button" className="m365-btn m365-btn--ghost warning-letter-list__action-button" onClick={() => navigate(`/reports/warning-letters/${data.id}/preview`)}>
                Preview
            </button>
            {canUpdate && data.workflowStage === 0 && (
                <button type="button" className="m365-btn m365-btn--ghost warning-letter-list__action-button" onClick={() => navigate(`/reports/warning-letters/${data.id}/edit`)}>
                    Edit
                </button>
            )}
            {canUpdate && data.workflowStage === 3 && (
                <button type="button" className="m365-btn m365-btn--success warning-letter-list__action-button" onClick={() => handleAcknowledge(data)}>
                    Acknowledge
                </button>
            )}
            {canDelete && canDeleteWarningLetterInStage(data.workflowStage) && (canDeleteAny || String(data.createdBy || "") === currentUserId) && (
                <button type="button" className="m365-btn m365-btn--danger warning-letter-list__action-button" onClick={() => handleDelete(data)}>
                    Delete
                </button>
            )}
        </div>
    );

    const stageTickerItems = workflowStageTickerOrder.map((stage) => {
        const meta = workflowStageMap[stage];
        const count = letters.filter((letter) => Number(letter?.workflowStage) === stage).length;
        const isActive = filters.workflowStage !== "" && String(filters.workflowStage) === String(stage);

        return {
            stage,
            label: meta.label,
            badgeClass: meta.cls,
            count,
            isActive,
        };
    });

    return (
        <div className="warning-letter-page warning-letter-list">
            <div className="m365-page-header">
                <div className="m365-page-header__left">
                    <i className="fa-light fa-triangle-exclamation m365-page-header__icon" />
                    <h2 className="m365-page-header__title">Warning Letters</h2>
                    <span className="m365-page-header__count">{letters.length}</span>
                </div>
                <div className="m365-page-header__actions">
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={() => loadLetters()}>
                        <i className="fa-light fa-rotate-right" /> Refresh
                    </button>
                    {canManageSettings && (
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost warning-letter-list__settings-trigger"
                            onClick={() => setSettingsPanelOpen(true)}
                            title="Warning Letter Settings"
                            aria-label="Open warning letter settings"
                        >
                            <i className="fa-light fa-gear" />
                        </button>
                    )}
                    {canCreate && (
                        <button type="button" className="m365-btn m365-btn--primary" onClick={() => navigate("/reports/warning-letters/new")}>
                            <i className="fa-light fa-plus" /> New Letter
                        </button>
                    )}
                    {canSend && filters.siteId && (
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost"
                            onClick={() => navigate(`/reports/warning-letters/bulk-signature?siteId=${filters.siteId}`)}
                        >
                            <i className="fa-light fa-signature" /> Bulk Request Signature
                        </button>
                    )}
                </div>
            </div>

            <div className="warning-letter-page__panel warning-letter-list__filters">
                <div className="warning-letter-page__filter-grid">
                    <label className="warning-letter-page__field">
                        <span>Site</span>
                        <select className="m365-select" value={filters.siteId} onChange={(event) => setFilterValue("siteId", event.target.value)}>
                            <option value="">All sites</option>
                            {sites.map((site) => (
                                <option key={site.id} value={site.id}>{site.name}</option>
                            ))}
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Employee</span>
                        <div className="warning-letter-list__employee-search" ref={employeeSearchRef}>
                            <div className="warning-letter-list__employee-search-input-wrap">
                                <i className="fa-light fa-magnifying-glass warning-letter-list__employee-search-icon" />
                                <input
                                    type="text"
                                    className="m365-input warning-letter-list__employee-search-input"
                                    value={employeeSearchTerm}
                                    onChange={handleEmployeeSearchChange}
                                    onFocus={() => {
                                        if (employeeSuggestions.length > 0 || employeeSearchTerm.trim().length >= MIN_EMPLOYEE_SEARCH_TERM) {
                                            setEmployeeSearchOpen(true);
                                        }
                                    }}
                                    placeholder="Search employee by name or work no"
                                    autoComplete="off"
                                />
                                {employeeSearchLoading ? (
                                    <i className="fa-light fa-loader warning-letter-list__employee-search-spinner" />
                                ) : (filters.employeeId || employeeSearchTerm) ? (
                                    <button
                                        type="button"
                                        className="warning-letter-list__employee-search-clear"
                                        onClick={handleEmployeeFilterClear}
                                        aria-label="Clear employee filter"
                                    >
                                        <i className="fa-light fa-xmark" />
                                    </button>
                                ) : null}
                            </div>

                            {employeeSearchOpen && (
                                <div className="warning-letter-list__employee-search-dropdown">
                                    {employeeSuggestions.length > 0 ? employeeSuggestions.map((employee) => (
                                        <button
                                            key={getEmployeeOptionId(employee)}
                                            type="button"
                                            className="warning-letter-list__employee-search-option"
                                            onClick={() => handleEmployeeSuggestionSelect(employee)}
                                        >
                                            <strong>{getEmployeeOptionLabel(employee)}</strong>
                                            <span>
                                                {employee?.siteName || employee?.SiteName || "Employee match"}
                                            </span>
                                        </button>
                                    )) : (
                                        <div className="warning-letter-list__employee-search-empty">
                                            {employeeSearchLoading
                                                ? "Searching employees..."
                                                : employeeSearchTerm.trim().length < MIN_EMPLOYEE_SEARCH_TERM
                                                    ? "Type at least 2 characters to search employees"
                                                    : "No employees found"}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Stage</span>
                        <select className="m365-select" value={filters.workflowStage} onChange={(event) => setFilterValue("workflowStage", event.target.value)}>
                            <option value="">All stages</option>
                            <option value="0">Draft</option>
                            <option value="1">Approved</option>
                            <option value="2">Pending Signed</option>
                            <option value="3">Signed</option>
                            <option value="4">Acknowledged</option>
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Letter Type</span>
                        <select className="m365-select" value={filters.letterType} onChange={(event) => setFilterValue("letterType", event.target.value)}>
                            <option value="">All types</option>
                            <option value="1">Excess Fuel</option>
                            <option value="2">Excess Speed</option>
                            <option value="3">Excess Idling</option>
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>From</span>
                        <input className="m365-date" type="date" value={filters.startDate} onChange={(event) => setFilterValue("startDate", event.target.value)} />
                    </label>
                    <label className="warning-letter-page__field">
                        <span>To</span>
                        <input className="m365-date" type="date" value={filters.endDate} onChange={(event) => setFilterValue("endDate", event.target.value)} />
                    </label>
                </div>
            </div>

            <div className="warning-letter-page__panel warning-letter-list__ticker-panel">
                <div className="warning-letter-list__ticker-header">
                    <div>
                        <span className="warning-letter-list__ticker-eyebrow">Stage Dashboard</span>
                        <h3 className="warning-letter-list__ticker-title">Warning Letter Workflow</h3>
                    </div>
                    <div className="warning-letter-list__ticker-summary">
                        <span className="warning-letter-list__ticker-summary-label">Filtered Letters</span>
                        <strong>{letters.length}</strong>
                    </div>
                </div>

                <div className="warning-letter-list__ticker-grid">
                    {stageTickerItems.map((item) => (
                        <button
                            key={item.stage}
                            type="button"
                            className={`warning-letter-list__ticker-card${item.isActive ? " warning-letter-list__ticker-card--active" : ""}`}
                            onClick={() => setFilterValue("workflowStage", item.isActive ? "" : String(item.stage))}
                        >
                            <div className="warning-letter-list__ticker-card-top">
                                <span className={`m365-badge ${item.badgeClass}`}>{item.label}</span>
                                {item.isActive && <span className="warning-letter-list__ticker-active-flag">Active Filter</span>}
                            </div>
                            <strong className="warning-letter-list__ticker-count">{item.count}</strong>
                            <span className="warning-letter-list__ticker-caption">
                                {item.isActive ? "Filter applied to current list" : "Click to focus this stage"}
                            </span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="warning-letter-page__panel warning-letter-list__grid">
                <DataGrid
                    key={`warning-letters-grid-${letters.length}`}
                    ref={gridRef}
                    dataSource={Array.isArray(letters) ? [...letters] : []}
                    keyExpr="id"
                    width="100%"
                    showBorders={false}
                    rowAlternationEnabled={true}
                    columnAutoWidth={true}
                    allowColumnResizing={true}
                    columnResizingMode="widget"
                    hoverStateEnabled={true}
                    noDataText="No warning letters found"
                >
                    <LoadPanel enabled={loading} />
                    <Export enabled={true} fileName={`warning-letters-${new Date().toISOString().split("T")[0]}`} />
                    <SearchPanel visible={true} width={240} placeholder="Search warning letters" />
                    <HeaderFilter visible={true} />
                    <FilterRow visible={true} />
                    <Sorting mode="multiple" />
                    <Paging defaultPageSize={15} />
                    <Pager showPageSizeSelector={true} allowedPageSizes={[15, 30, 60]} showInfo={true} />

                    <Column dataField="id" caption="Ref" width={80} />
                    <Column dataField="letterDate" caption="Letter Date" cellRender={renderDate} width={120} />
                    <Column dataField="periodStart" caption="Violation Date" cellRender={renderDate} width={120} />
                    <Column dataField="letterType" caption="Type" cellRender={renderLetterType} minWidth={140} />
                    <Column dataField="employeeName" caption="Employee" minWidth={180} />
                    <Column dataField="vehicleHyoungNo" caption="Vehicle" minWidth={120} />
                    <Column dataField="siteName" caption="Site" minWidth={160} />
                    <Column caption="Created By" minWidth={180} cellRender={renderCreatedBy} />
                    <Column dataField="workflowStage" caption="Stage" cellRender={renderStatus} width={150} />
                    <Column dataField="signatureRequestRecipient" caption="Site Representative" minWidth={180} />
                    <Column dataField="approveLetterUploadedAt" caption="Approved At" cellRender={renderDate} width={120} />
                    <Column dataField="signatureRequestedAt" caption="Sent At" cellRender={renderDate} width={120} />
                    <Column dataField="signedCopyUploadedAt" caption="Signed At" cellRender={renderDate} width={120} />
                    <Column dataField="employeeAcknowledgedAt" caption="Acknowledged At" cellRender={renderDate} width={140} />
                    <Column caption="Actions" width={320} allowSorting={false} allowFiltering={false} cellRender={renderActions} fixed={true} fixedPosition="right" />
                </DataGrid>
            </div>

            <SlidePanel
                open={settingsPanelOpen}
                onClose={() => setSettingsPanelOpen(false)}
                title="Warning Letter Settings"
                width={640}
                panelClassName="warning-letter-settings-panel"
            >
                <WarningLetterSettingsPanelContent canEdit={canManageSettings} />
            </SlidePanel>
        </div>
    );
};

export default WarningLetterListPage;