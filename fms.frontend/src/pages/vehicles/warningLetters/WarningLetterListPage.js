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
    Paging,
    Pager,
    LoadPanel,
    Sorting,
} from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import { useNavigate, useSearchParams } from "react-router-dom";
import SlidePanel from "../../../components/ui/SlidePanel";
import { usePermissions } from "../../../hooks/usePermissions";
import {
    acknowledgeWarningLetter,
    deleteWarningLetter,
    finalizeWarningLetter,
    getEmployees,
    getSites,
    getWarningLetters,
} from "./warningLetterService";
import WarningLetterSettingsPanelContent from "./WarningLetterSettingsPanelContent";
import "./WarningLetters.scss";

const statusMap = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Finalized", cls: "m365-badge--primary" },
    2: { label: "Sent", cls: "m365-badge--success" },
    3: { label: "Acknowledged", cls: "m365-badge--success" },
    4: { label: "Signed Copy Received", cls: "m365-badge--success" },
};

const typeMap = {
    1: "Excess Fuel",
    2: "Excess Speed",
    3: "Excess Idling",
};

const getDisplayStatus = (row) => {
    if (row?.signedCopyUploadedAt) {
        return { label: "Acknowledged", cls: "m365-badge--success" };
    }

    return statusMap[row?.status] || { label: row?.status || "Unknown", cls: "m365-badge--neutral" };
};

const WarningLetterListPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const gridRef = useRef(null);
    const { hasPermission } = usePermissions();

    const [letters, setLetters] = useState([]);
    const [sites, setSites] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [loading, setLoading] = useState(false);
    const [settingsPanelOpen, setSettingsPanelOpen] = useState(false);
    const [filters, setFilters] = useState({
        siteId: "",
        employeeId: searchParams.get("employeeId") || "",
        status: "",
        letterType: "",
        startDate: "",
        endDate: "",
    });

    const canCreate = hasPermission("_Create_WarningLetter");
    const canUpdate = hasPermission("_Update_WarningLetter");
    const canFinalize = hasPermission("_Finalize_WarningLetter");
    const canDelete = hasPermission("_Delete_WarningLetter");
    const canManageSettings = hasPermission("_Update_WarningLetter");

    const loadReferenceData = useCallback(async () => {
        try {
            const [siteItems, employeeItems] = await Promise.all([getSites(), getEmployees()]);
            setSites(siteItems);
            setEmployees(employeeItems);
        } catch (error) {
            notify(error.message || "Failed to load warning letter filters.", "error", 3000);
        }
    }, []);

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
    }, [searchParams]);

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

    const handleFinalize = async (row) => {
        if (!window.confirm(`Finalize warning letter #${row.id}?`)) {
            return;
        }

        try {
            await finalizeWarningLetter(row.id);
            notify("Warning letter finalized.", "success", 2500);
            loadLetters();
        } catch (error) {
            notify(error.message || "Failed to finalize warning letter.", "error", 3000);
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
        const item = getDisplayStatus(data) || statusMap[value] || { label: value || "Unknown", cls: "m365-badge--neutral" };
        return <span className={`m365-badge ${item.cls}`}>{item.label}</span>;
    };

    const renderLetterType = ({ value }) => typeMap[value] || value || "-";

    const renderDate = ({ value }) =>
        value ? new Date(value).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "-";

    const renderActions = ({ data }) => (
        <div className="warning-letter-list__actions">
            <button type="button" className="m365-btn m365-btn--ghost warning-letter-list__action-button" onClick={() => navigate(`/reports/warning-letters/${data.id}/preview`)}>
                Preview
            </button>
            {canUpdate && data.status === 0 && (
                <button type="button" className="m365-btn m365-btn--ghost warning-letter-list__action-button" onClick={() => navigate(`/reports/warning-letters/${data.id}/edit`)}>
                    Edit
                </button>
            )}
            {canFinalize && data.status === 0 && (
                <button type="button" className="m365-btn m365-btn--primary warning-letter-list__action-button" onClick={() => handleFinalize(data)}>
                    Finalize
                </button>
            )}
            {canUpdate && data.status !== 0 && data.status !== 3 && !data.signedCopyUploadedAt && (
                <button type="button" className="m365-btn m365-btn--success warning-letter-list__action-button" onClick={() => handleAcknowledge(data)}>
                    Acknowledge
                </button>
            )}
            {canDelete && data.status === 0 && (
                <button type="button" className="m365-btn m365-btn--danger warning-letter-list__action-button" onClick={() => handleDelete(data)}>
                    Delete
                </button>
            )}
        </div>
    );

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
                        <select className="m365-select" value={filters.employeeId} onChange={(event) => setFilterValue("employeeId", event.target.value)}>
                            <option value="">All employees</option>
                            {employees.map((employee) => (
                                <option key={employee.id} value={employee.id}>{employee.fullName}</option>
                            ))}
                        </select>
                    </label>
                    <label className="warning-letter-page__field">
                        <span>Status</span>
                        <select className="m365-select" value={filters.status} onChange={(event) => setFilterValue("status", event.target.value)}>
                            <option value="">All statuses</option>
                            <option value="0">Draft</option>
                            <option value="1">Finalized</option>
                            <option value="2">Sent</option>
                            <option value="3">Acknowledged</option>
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

            <div className="warning-letter-page__panel warning-letter-list__grid">
                <DataGrid
                    ref={gridRef}
                    dataSource={letters}
                    keyExpr="id"
                    showBorders={false}
                    rowAlternationEnabled={true}
                    columnAutoWidth={true}
                    hoverStateEnabled={true}
                    noDataText="No warning letters found"
                >
                    <LoadPanel enabled={loading} />
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
                    <Column dataField="status" caption="Status" cellRender={renderStatus} width={140} />
                    <Column dataField="emailRecipient" caption="Recipient" minWidth={220} />
                    <Column dataField="emailSentAt" caption="Sent At" cellRender={renderDate} width={120} />
                    <Column caption="Actions" width={320} allowSorting={false} allowFiltering={false} cellRender={renderActions} />
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