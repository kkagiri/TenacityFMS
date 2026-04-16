/**
 * File: EmployeeWarningLettersWorkspace.js
 * Purpose: Shows warning letters related to a single employee inside the employee details page.
 * Dependencies: React, DataGrid, react-router-dom, warningLetterService, usePermissions
 * Last Modified: 2026-04-15
 *
 * Key Components:
 * - EmployeeWarningLettersWorkspace(): Loads employee-scoped warning letters and renders actions.
 */
import React, { useCallback, useEffect, useMemo, useState } from "react";
import DataGrid, {
    Column,
    FilterRow,
    HeaderFilter,
    Pager,
    Paging,
    SearchPanel,
} from "devextreme-react/data-grid";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { usePermissions } from "../../../../hooks/usePermissions";
import {
    acknowledgeWarningLetter,
    deleteWarningLetter,
    getWarningLetters,
} from "../../../vehicles/warningLetters/warningLetterService";
import { getUserId } from "../../../vehicles/transfers/vehicleTransferFormUtils";

const workflowStageMap = {
    0: { label: "Draft", cls: "m365-badge--neutral" },
    1: { label: "Approved", cls: "m365-badge--primary" },
    2: { label: "Pending Signed", cls: "m365-badge--warning" },
    3: { label: "Signed", cls: "m365-badge--success" },
    4: { label: "Acknowledged", cls: "m365-badge--success" },
};

const typeMap = {
    1: "Excess Fuel",
    2: "Excess Speed",
    3: "Excess Idling",
};

const formatDate = (value) =>
    value
        ? new Date(value).toLocaleDateString("en-GB", {
            day: "2-digit",
            month: "short",
            year: "numeric",
        })
        : "-";

const EmployeeWarningLettersWorkspace = ({ employeeId, employee }) => {
    const navigate = useNavigate();
    const { hasPermission } = usePermissions();
    const currentUser = useSelector((state) => state.auth?.user || {});

    const [letters, setLetters] = useState([]);
    const [loading, setLoading] = useState(false);

    const canCreate = hasPermission("_Create_WarningLetter");
    const canUpdate = hasPermission("_Update_WarningLetter");
    const canDelete = hasPermission("_Delete_WarningLetter");
    const canDeleteAny = hasPermission("_delete_any_letter");
    const currentUserId = useMemo(() => String(getUserId(currentUser) || ""), [currentUser]);

    const loadLetters = useCallback(async () => {
        if (!employeeId) {
            setLetters([]);
            return;
        }

        setLoading(true);
        try {
            const data = await getWarningLetters({ employeeId: String(employeeId) });
            setLetters(Array.isArray(data) ? data : []);
        } catch (error) {
            setLetters([]);
            notify(error.message || "Failed to load employee warning letters.", "error", 3000);
        } finally {
            setLoading(false);
        }
    }, [employeeId]);

    useEffect(() => {
        loadLetters();
    }, [loadLetters]);

    const handleDelete = useCallback(
        async (row) => {
            if (!window.confirm(`Delete warning letter #${row.id}?`)) {
                return;
            }

            try {
                await deleteWarningLetter(row.id);
                notify("Warning letter deleted.", "success", 2500);
                await loadLetters();
            } catch (error) {
                notify(error.message || "Failed to delete warning letter.", "error", 3000);
            }
        },
        [loadLetters]
    );

    const handleAcknowledge = useCallback(
        async (row) => {
            if (!window.confirm(`Mark warning letter #${row.id} as acknowledged?`)) {
                return;
            }

            try {
                await acknowledgeWarningLetter(row.id);
                notify("Warning letter acknowledged.", "success", 2500);
                await loadLetters();
            } catch (error) {
                notify(error.message || "Failed to acknowledge warning letter.", "error", 3000);
            }
        },
        [loadLetters]
    );

    const renderStatus = ({ data, value }) => {
        const item = workflowStageMap[data?.workflowStage ?? value] || {
            label: value || "Unknown",
            cls: "m365-badge--neutral",
        };
        return <span className={`m365-badge ${item.cls}`}>{item.label}</span>;
    };

    const renderLetterType = ({ value }) => typeMap[value] || value || "-";

    const renderActions = ({ data }) => (
        <div className="employee-warning-letters__actions">
            <button
                type="button"
                className="m365-btn m365-btn--ghost employee-warning-letters__action-button"
                onClick={() => navigate(`/reports/warning-letters/${data.id}/preview`)}
            >
                Preview
            </button>
            {canUpdate && data.workflowStage === 0 && (
                <button
                    type="button"
                    className="m365-btn m365-btn--ghost employee-warning-letters__action-button"
                    onClick={() => navigate(`/reports/warning-letters/${data.id}/edit`)}
                >
                    Edit
                </button>
            )}
            {canUpdate && data.workflowStage === 3 && (
                <button
                    type="button"
                    className="m365-btn m365-btn--success employee-warning-letters__action-button"
                    onClick={() => handleAcknowledge(data)}
                >
                    Acknowledge
                </button>
            )}
            {canDelete &&
                (data.workflowStage === 0 || data.workflowStage === 1) &&
                (canDeleteAny || String(data.createdBy || "") === currentUserId) && (
                    <button
                        type="button"
                        className="m365-btn m365-btn--danger employee-warning-letters__action-button"
                        onClick={() => handleDelete(data)}
                    >
                        Delete
                    </button>
                )}
        </div>
    );

    if (loading && letters.length === 0) {
        return (
            <div className="m365-empty">
                <LoadIndicator visible={true} width={32} height={32} />
                <p className="m365-empty__text">Loading warning letters...</p>
            </div>
        );
    }

    return (
        <div className="employee-warning-letters">
            <div className="employee-warning-letters__toolbar">
                <div>
                    <h3 className="employee-warning-letters__title">Employee Warning Letters</h3>
                    <p className="employee-warning-letters__subtitle">
                        {employee?.fullName || "This employee"} has {letters.length} warning letter{letters.length === 1 ? "" : "s"} in the register.
                    </p>
                </div>
                <div className="employee-warning-letters__toolbar-actions">
                    <button type="button" className="m365-btn m365-btn--ghost" onClick={loadLetters}>
                        <i className="fa-light fa-rotate-right" /> Refresh
                    </button>
                    <button
                        type="button"
                        className="m365-btn m365-btn--ghost"
                        onClick={() => navigate(`/reports/warning-letters?employeeId=${employeeId}`)}
                    >
                        <i className="fa-light fa-arrow-up-right-from-square" /> Open Full Workspace
                    </button>
                    {canCreate && (
                        <button
                            type="button"
                            className="m365-btn m365-btn--primary"
                            onClick={() => navigate(`/reports/warning-letters?employeeId=${employeeId}`)}
                        >
                            <i className="fa-light fa-plus" /> New Letter
                        </button>
                    )}
                </div>
            </div>

            <DataGrid
                className="edp-grid"
                dataSource={Array.isArray(letters) ? letters : []}
                keyExpr="id"
                showBorders={false}
                showColumnLines={false}
                showRowLines={true}
                rowAlternationEnabled={false}
                columnAutoWidth={true}
                noDataText="No warning letters found for this employee"
            >
                <SearchPanel visible={true} width={240} placeholder="Search warning letters" />
                <FilterRow visible={true} />
                <HeaderFilter visible={true} />
                <Paging defaultPageSize={10} />
                <Pager
                    visible={true}
                    showNavigationButtons={true}
                    showInfo={true}
                    showPageSizeSelector={true}
                    allowedPageSizes={[10, 25, 50]}
                />

                <Column dataField="id" caption="Ref" width={80} />
                <Column dataField="letterDate" caption="Letter Date" cellRender={({ value }) => formatDate(value)} width={120} />
                <Column dataField="periodStart" caption="Violation Date" cellRender={({ value }) => formatDate(value)} width={120} />
                <Column dataField="letterType" caption="Type" cellRender={renderLetterType} minWidth={140} />
                <Column dataField="vehicleHyoungNo" caption="Vehicle" minWidth={120} />
                <Column dataField="siteName" caption="Site" minWidth={150} />
                <Column dataField="workflowStage" caption="Stage" cellRender={renderStatus} width={150} />
                <Column dataField="signatureRequestRecipient" caption="Site Representative" minWidth={180} />
                <Column dataField="signedCopyUploadedAt" caption="Signed At" cellRender={({ value }) => formatDate(value)} width={120} />
                <Column dataField="employeeAcknowledgedAt" caption="Acknowledged At" cellRender={({ value }) => formatDate(value)} width={140} />
                <Column caption="Actions" width={320} allowSorting={false} allowFiltering={false} cellRender={renderActions} fixed={true} fixedPosition="right" />
            </DataGrid>
        </div>
    );
};

export default EmployeeWarningLettersWorkspace;