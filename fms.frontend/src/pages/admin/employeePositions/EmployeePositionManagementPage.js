/**
 * File: EmployeePositionManagementPage.js
 * Purpose: Admin CRUD page for employee positions.
 * Dependencies: react, devextreme-react/data-grid, usePermissions, SlidePanel, employeePositionApi
 * Last Modified: 2026-04-15
 */
import React, { useEffect, useMemo, useState } from "react";
import DataGrid, { Column, FilterRow, Paging, Toolbar, Item } from "devextreme-react/data-grid";
import notify from "devextreme/ui/notify";
import SlidePanel from "../../../components/ui/SlidePanel";
import { usePermissions } from "../../../hooks/usePermissions";
import employeePositionApi from "../../../api/employeePositionApi";

const EMPTY_FORM = {
    name: "",
    description: "",
    sortOrder: 0,
    isActive: true,
};

const hasSucceeded = (response) => response?.success === true || response?.Success === true || response?.isSuccess === true || response?.IsSuccess === true;
const resolveMessage = (response, fallback) => response?.message || response?.Message || fallback;
const resolveApiErrorMessage = (error, fallback) => {
    const responseData = error?.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
        return responseData;
    }

    if (responseData?.message) {
        return responseData.message;
    }

    if (responseData?.Message) {
        return responseData.Message;
    }

    return error?.message || fallback;
};

const resolveAssignedEmployees = (source) => {
    const responseData = source?.response?.data ?? source;
    const assignedEmployees = responseData?.assignedEmployees || responseData?.AssignedEmployees;
    return Array.isArray(assignedEmployees) ? assignedEmployees : [];
};

const resolveAssignedEmployeeCount = (source, fallbackCount = 0) => {
    const responseData = source?.response?.data ?? source;
    const count = responseData?.assignedEmployeeCount ?? responseData?.AssignedEmployeeCount;
    return Number.isFinite(count) ? Number(count) : fallbackCount;
};

const EmployeePositionManagementPage = () => {
    const { hasPermission } = usePermissions();
    const canRead = hasPermission("_Read_Employee");
    const canCreate = hasPermission("_Create_Employee");
    const canEdit = hasPermission("_Edit_Employee");
    const canDelete = hasPermission("_Delete_Employee");

    const [positions, setPositions] = useState([]);
    const [includeInactive, setIncludeInactive] = useState(true);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [panelOpen, setPanelOpen] = useState(false);
    const [editingPosition, setEditingPosition] = useState(null);
    const [form, setForm] = useState(EMPTY_FORM);
    const [assignmentPanelOpen, setAssignmentPanelOpen] = useState(false);
    const [selectedAssignmentPosition, setSelectedAssignmentPosition] = useState(null);
    const [removingEmployeeId, setRemovingEmployeeId] = useState(null);

    const sortedPositions = useMemo(
        () => [...positions].sort((left, right) => (left.sortOrder - right.sortOrder) || left.name.localeCompare(right.name)),
        [positions]
    );

    const loadPositions = async () => {
        if (!canRead) return;
        setLoading(true);
        try {
            const response = await employeePositionApi.getEmployeePositions(!includeInactive ? true : false);
            setPositions(Array.isArray(response) ? response : []);
        } catch (error) {
            notify(resolveApiErrorMessage(error, "Failed to load employee positions."), "error", 3000);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadPositions();
    }, [includeInactive]);

    const openCreatePanel = () => {
        setEditingPosition(null);
        setForm(EMPTY_FORM);
        setPanelOpen(true);
    };

    const openEditPanel = (position) => {
        setEditingPosition(position);
        setForm({
            name: position?.name || "",
            description: position?.description || "",
            sortOrder: Number(position?.sortOrder || 0),
            isActive: Boolean(position?.isActive),
        });
        setPanelOpen(true);
    };

    const closePanel = () => {
        if (saving) return;
        setPanelOpen(false);
        setEditingPosition(null);
        setForm(EMPTY_FORM);
    };

    const openAssignmentPanel = (position, assignedEmployees = null) => {
        const employees = Array.isArray(assignedEmployees)
            ? assignedEmployees
            : Array.isArray(position?.assignedEmployees)
                ? position.assignedEmployees
                : [];

        setSelectedAssignmentPosition({
            ...position,
            assignedEmployees: employees,
            assignedEmployeeCount: resolveAssignedEmployeeCount(position, employees.length),
        });
        setAssignmentPanelOpen(true);
    };

    const closeAssignmentPanel = () => {
        if (removingEmployeeId) return;
        setAssignmentPanelOpen(false);
        setSelectedAssignmentPosition(null);
    };

    const handleSave = async () => {
        if (!form.name.trim()) {
            notify("Position name is required.", "warning", 2500);
            return;
        }

        setSaving(true);
        try {
            const payload = {
                id: editingPosition?.id || 0,
                name: form.name.trim(),
                description: form.description.trim(),
                sortOrder: Number(form.sortOrder || 0),
                isActive: Boolean(form.isActive),
            };

            const response = editingPosition
                ? await employeePositionApi.updateEmployeePosition(editingPosition.id, payload)
                : await employeePositionApi.createEmployeePosition(payload);

            if (!hasSucceeded(response)) {
                throw new Error(resolveMessage(response, "Failed to save employee position."));
            }

            notify(resolveMessage(response, "Employee position saved."), "success", 2500);
            closePanel();
            await loadPositions();
        } catch (error) {
            notify(error?.message || "Failed to save employee position.", "error", 3000);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (position) => {
        if (!canDelete) return;
        if (!window.confirm(`Delete position '${position.name}'?`)) return;

        try {
            const response = await employeePositionApi.deleteEmployeePosition(position.id);
            if (!hasSucceeded(response)) {
                throw new Error(resolveMessage(response, "Failed to delete employee position."));
            }

            notify(resolveMessage(response, "Employee position deleted."), "success", 2500);
            await loadPositions();
        } catch (error) {
            const message = resolveApiErrorMessage(error, "Failed to delete employee position.");
            notify(message, "error", 3500);

            const assignedEmployees = resolveAssignedEmployees(error);
            if (assignedEmployees.length > 0) {
                openAssignmentPanel({
                    ...position,
                    assignedEmployeeCount: resolveAssignedEmployeeCount(error, assignedEmployees.length),
                }, assignedEmployees);
            }
        }
    };

    const handleRemoveAssignment = async (employee) => {
        if (!selectedAssignmentPosition) return;
        if (!canEdit) {
            notify("You do not have permission to remove employee assignments.", "warning", 3000);
            return;
        }

        if (!window.confirm(`Remove '${employee.fullName}' from position '${selectedAssignmentPosition.name}'?`)) {
            return;
        }

        setRemovingEmployeeId(employee.id);
        try {
            const response = await employeePositionApi.removeEmployeePositionAssignment(employee.id);
            if (!hasSucceeded(response)) {
                throw new Error(resolveMessage(response, "Failed to remove employee assignment."));
            }

            notify(resolveMessage(response, "Employee assignment removed."), "success", 2500);

            setSelectedAssignmentPosition((current) => {
                if (!current) return current;

                const nextEmployees = (current.assignedEmployees || []).filter((item) => item.id !== employee.id);
                return {
                    ...current,
                    assignedEmployees: nextEmployees,
                    assignedEmployeeCount: nextEmployees.length,
                };
            });

            setPositions((current) => current.map((item) => {
                if (item.id !== selectedAssignmentPosition.id) {
                    return item;
                }

                return {
                    ...item,
                    assignedEmployeeCount: Math.max(0, Number(item.assignedEmployeeCount || 0) - 1),
                };
            }));
        } catch (error) {
            notify(resolveApiErrorMessage(error, "Failed to remove employee assignment."), "error", 3000);
        } finally {
            setRemovingEmployeeId(null);
        }
    };

    const assignedEmployees = selectedAssignmentPosition?.assignedEmployees || [];

    if (!canRead) {
        return (
            <div className="tw-p-6">
                <div className="m365-info-banner m365-info-banner--warning">
                    <i className="fa-light fa-lock m365-info-banner__icon" />
                    <span className="m365-info-banner__text">You do not have permission to manage employee positions.</span>
                </div>
            </div>
        );
    }

    return (
        <div className="tw-p-4 tw-flex tw-flex-col tw-gap-4 tw-h-full">
            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-items-center tw-justify-between tw-gap-4 tw-flex-wrap">
                    <div>
                        <h2 className="tw-text-xl tw-font-semibold tw-text-slate-800">Employee Position Management</h2>
                        <p className="tw-text-sm tw-text-slate-500 tw-mt-1">Manage master data for employee positions such as Tipper Driver, Pickup Driver, and Operator.</p>
                    </div>
                    <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                        <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-slate-600">
                            <input
                                type="checkbox"
                                checked={includeInactive}
                                onChange={(event) => setIncludeInactive(event.target.checked)}
                            />
                            Show inactive
                        </label>
                        {canCreate && (
                            <button type="button" className="m365-btn m365-btn--primary" onClick={openCreatePanel}>
                                <i className="fa-light fa-plus" /> Add Position
                            </button>
                        )}
                    </div>
                </div>
            </div>

            <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-overflow-hidden tw-flex-1">
                <DataGrid
                    dataSource={sortedPositions}
                    keyExpr="id"
                    showBorders={false}
                    showRowLines={true}
                    rowAlternationEnabled={false}
                    columnAutoWidth={true}
                    hoverStateEnabled={true}
                    noDataText={loading ? "Loading positions..." : "No employee positions found."}
                >
                    <FilterRow visible={true} />
                    <Paging defaultPageSize={12} />
                    <Toolbar>
                        <Item location="before">
                            <span className="tw-text-sm tw-text-slate-500">{sortedPositions.length} position{sortedPositions.length === 1 ? "" : "s"}</span>
                        </Item>
                        <Item location="after">
                            <button type="button" className="m365-btn m365-btn--ghost" onClick={loadPositions}>
                                <i className="fa-light fa-rotate" /> Refresh
                            </button>
                        </Item>
                    </Toolbar>
                    <Column dataField="name" caption="Position" minWidth={220} />
                    <Column dataField="description" caption="Description" minWidth={260} />
                    <Column
                        dataField="assignedEmployeeCount"
                        caption="Assigned Employees"
                        width={170}
                        alignment="center"
                        cellRender={({ data }) => {
                            const count = Number(data?.assignedEmployeeCount || 0);

                            return count > 0 ? (
                                <span className="m365-badge m365-badge--info">{count}</span>
                            ) : (
                                <span className="m365-badge m365-badge--neutral">0</span>
                            );
                        }}
                    />
                    <Column dataField="sortOrder" caption="Sort Order" width={110} alignment="right" />
                    <Column
                        dataField="isActive"
                        caption="Status"
                        width={110}
                        cellRender={({ data }) => (
                            <span className={`m365-badge ${data.isActive ? "m365-badge--success" : "m365-badge--warning"}`}>
                                {data.isActive ? "Active" : "Inactive"}
                            </span>
                        )}
                    />
                    <Column
                        caption="Actions"
                        width={160}
                        allowFiltering={false}
                        allowSorting={false}
                        cellRender={({ data }) => (
                            <div className="tw-flex tw-items-center tw-gap-3">
                                {canEdit && (
                                    <button type="button" className="employee-grid__action-link" onClick={() => openEditPanel(data)}>
                                        Edit
                                    </button>
                                )}
                                {canDelete && (
                                    <button type="button" className="employee-grid__action-link" onClick={() => handleDelete(data)}>
                                        Delete
                                    </button>
                                )}
                            </div>
                        )}
                    />
                </DataGrid>
            </div>

            <SlidePanel
                open={panelOpen}
                onClose={closePanel}
                title={editingPosition ? `Edit Position: ${editingPosition.name}` : "Add Position"}
                width={720}
            >
                <div className="employee-panel employee-panel--form">
                    <div className="m365-flat-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                        <h3 className="m365-flat-section__title">Position Details</h3>
                        <div className="employee-form-grid">
                            <div className="m365-field">
                                <label className="m365-field__label m365-field__label--required">Name</label>
                                <input
                                    type="text"
                                    className="m365-input"
                                    value={form.name}
                                    onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
                                    maxLength={100}
                                    placeholder="Enter position name"
                                />
                            </div>

                            <div className="m365-field">
                                <label className="m365-field__label">Sort Order</label>
                                <input
                                    type="number"
                                    className="m365-input"
                                    value={form.sortOrder}
                                    onChange={(event) => setForm((prev) => ({ ...prev, sortOrder: event.target.value }))}
                                />
                            </div>

                            <div className="m365-field warning-letter-page__field--wide">
                                <label className="m365-field__label">Description</label>
                                <textarea
                                    className="m365-input warning-letter-page__textarea"
                                    value={form.description}
                                    onChange={(event) => setForm((prev) => ({ ...prev, description: event.target.value }))}
                                    placeholder="Optional description"
                                />
                            </div>

                            <div className="m365-field">
                                <label className="m365-field__label">Active</label>
                                <label className="tw-inline-flex tw-items-center tw-gap-2 tw-text-sm tw-text-slate-600 tw-h-[34px]">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(event) => setForm((prev) => ({ ...prev, isActive: event.target.checked }))}
                                    />
                                    Enable this position
                                </label>
                            </div>
                        </div>
                    </div>

                    <div className="m365-panel-footer">
                        <button className="m365-btn m365-btn--ghost" onClick={closePanel} disabled={saving}>Cancel</button>
                        <button className="m365-btn m365-btn--primary" onClick={handleSave} disabled={saving}>
                            {saving ? "Saving..." : editingPosition ? "Save Changes" : "Create Position"}
                        </button>
                    </div>
                </div>
            </SlidePanel>

            <SlidePanel
                open={assignmentPanelOpen}
                onClose={closeAssignmentPanel}
                title={selectedAssignmentPosition ? `Assigned Employees: ${selectedAssignmentPosition.name}` : "Assigned Employees"}
                width={760}
            >
                <div className="employee-panel employee-panel--form">
                    <div className="m365-flat-section" style={{ marginTop: 0, paddingTop: 0, borderTop: "none" }}>
                        <div className="tw-flex tw-items-start tw-justify-between tw-gap-3 tw-flex-wrap">
                            <div>
                                <h3 className="m365-flat-section__title">Position Assignment Details</h3>
                                <p className="tw-text-sm tw-text-slate-500 tw-mt-1">
                                    Remove employees from this position, then delete the position once the count reaches zero.
                                </p>
                            </div>
                            <span className="m365-badge m365-badge--info">
                                {selectedAssignmentPosition?.assignedEmployeeCount || 0} assigned
                            </span>
                        </div>

                        {!canEdit && assignedEmployees.length > 0 && (
                            <div className="m365-info-banner m365-info-banner--warning" style={{ marginTop: 12 }}>
                                <i className="fa-light fa-lock m365-info-banner__icon" />
                                <span className="m365-info-banner__text">You can view assigned employees, but you do not have permission to remove assignments.</span>
                            </div>
                        )}

                        {assignedEmployees.length === 0 ? (
                            <div className="m365-info-banner" style={{ marginTop: 12 }}>
                                <i className="fa-light fa-circle-info m365-info-banner__icon" />
                                <span className="m365-info-banner__text">No employees are currently assigned. You can close this panel and delete the position.</span>
                            </div>
                        ) : (
                            <div className="tw-mt-4 tw-flex tw-flex-col tw-gap-3">
                                {assignedEmployees.map((employee) => (
                                    <div
                                        key={employee.id}
                                        className="tw-border tw-border-gray-200 tw-rounded-lg tw-bg-white tw-p-4 tw-flex tw-items-center tw-justify-between tw-gap-4 tw-flex-wrap"
                                    >
                                        <div className="tw-min-w-0 tw-flex-1">
                                            <div className="tw-flex tw-items-center tw-gap-2 tw-flex-wrap">
                                                <span className="tw-text-sm tw-font-semibold tw-text-slate-800">{employee.fullName || "Unnamed employee"}</span>
                                                <span className={`m365-badge ${employee.employeestatus === "Active" ? "m365-badge--success" : "m365-badge--neutral"}`}>
                                                    {employee.employeestatus || "Unknown"}
                                                </span>
                                            </div>
                                            <div className="tw-text-sm tw-text-slate-500 tw-mt-1">
                                                Work No: {employee.employeeWorkNo || "-"}
                                            </div>
                                        </div>
                                        {canEdit && (
                                            <button
                                                type="button"
                                                className="m365-btn m365-btn--danger"
                                                onClick={() => handleRemoveAssignment(employee)}
                                                disabled={removingEmployeeId === employee.id}
                                            >
                                                <i className="fa-light fa-user-minus" />
                                                {removingEmployeeId === employee.id ? "Removing..." : "Remove Assignment"}
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="m365-panel-footer">
                        <button className="m365-btn m365-btn--ghost" onClick={closeAssignmentPanel} disabled={Boolean(removingEmployeeId)}>
                            Close
                        </button>
                    </div>
                </div>
            </SlidePanel>
        </div>
    );
};

export default EmployeePositionManagementPage;