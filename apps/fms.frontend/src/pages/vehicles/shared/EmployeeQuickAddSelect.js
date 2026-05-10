/**
 * File: EmployeeQuickAddSelect.js
 * Purpose: Employee select field with inline add flow for vehicle forms.
 * Dependencies: React, Redux employee actions, DevExtreme SelectBox, SlidePanel, EmployeeFormPanel
 * Last Modified: 2026-03-24
 *
 * Key Components:
 * - EmployeeQuickAddSelect: Opens employee create panel, refreshes employee options, and auto-selects the new employee.
 */
import React, { useCallback, useMemo, useState } from "react";
import { useDispatch } from "react-redux";
import { SelectBox } from "devextreme-react/select-box";
import CustomStore from "devextreme/data/custom_store";
import notify from "devextreme/ui/notify";

import SlidePanel from "../../../components/ui/SlidePanel";
import EmployeeFormPanel from "../../employees/components/EmployeeFormPanel";
import "./EmployeeQuickAddSelect.scss";
import {
    createEmployee,
    fetchEmployees,
    searchEmployees,
    updateEmployee,
} from "../../../redux/actions/employeeActions";

const hasSucceeded = (response) =>
    response?.success === true || response?.Success === true;

const resolveMessage = (response, fallback) =>
    response?.message || response?.Message || fallback;

const normalizeText = (value) =>
    typeof value === "string" ? value.trim().toLowerCase() : "";

const resolveEmployeeId = (employee) => {
    const rawValue =
        employee?.id ??
        employee?.employeeId ??
        employee?.Id ??
        employee?.EmployeeId;
    const parsed = Number(rawValue);
    return Number.isFinite(parsed) ? parsed : null;
};

const resolveEmployeeName = (employee) =>
    employee?.fullName ||
    employee?.FullName ||
    employee?.fullname ||
    employee?.employeeName ||
    employee?.EmployeeName ||
    employee?.name ||
    employee?.Name ||
    "";

const resolveEmployeeWorkNo = (employee) =>
    employee?.employeeWorkNo || employee?.EmployeeWorkNo || "";

const resolveEmployeePosition = (employee) =>
    employee?.position || employee?.Position || "";

const toEmployeeDisplay = (employee) => {
    const name = resolveEmployeeName(employee);
    const workNo = resolveEmployeeWorkNo(employee);
    return workNo ? `${name} (${workNo})` : name;
};

const normalizeEmployeeOption = (employee) => ({
    ...employee,
    __employeeId: resolveEmployeeId(employee),
    __employeeDisplay: toEmployeeDisplay(employee),
    __employeeSearch: [
        resolveEmployeeName(employee),
        resolveEmployeeWorkNo(employee),
        resolveEmployeePosition(employee),
    ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase(),
});

const normalizeEmployeePayload = (payload) => {
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

const dedupeEmployeeOptions = (items) => {
    const seen = new Set();

    return (Array.isArray(items) ? items : []).filter((item) => {
        const id = item?.__employeeId ?? resolveEmployeeId(item);
        if (id === null || id === undefined || seen.has(id)) {
            return false;
        }

        seen.add(id);
        return true;
    });
};

const unwrapCreatedEmployee = (response) =>
    response?.employeeDto ||
    response?.EmployeeDto ||
    response?.data ||
    response?.Data ||
    response?.employee ||
    response?.Employee ||
    null;

const dedupeEmployees = (items) => {
    const seen = new Set();
    return (Array.isArray(items) ? items : []).filter((item) => {
        const id = resolveEmployeeId(item);
        if (id === null || seen.has(id)) return false;
        seen.add(id);
        return true;
    });
};

const matchCreatedEmployee = (employees, createdEmployee) => {
    const source = Array.isArray(employees) ? employees : [];
    const createdEmployeeId = resolveEmployeeId(createdEmployee);
    if (createdEmployeeId !== null) {
        const byId = source.find(
            (employee) => resolveEmployeeId(employee) === createdEmployeeId
        );
        if (byId) return byId;
    }

    const createdName = normalizeText(createdEmployee?.fullName);
    const createdWorkNo = normalizeText(createdEmployee?.employeeWorkNo);
    const createdPhone = normalizeText(createdEmployee?.employeephoneNumber);
    const createdSiteId = Number(createdEmployee?.siteId);

    return source.find((employee) => {
        const sameName = createdName && normalizeText(employee?.fullName) === createdName;
        const sameWorkNo =
            createdWorkNo &&
            normalizeText(employee?.employeeWorkNo) === createdWorkNo;
        const samePhone =
            createdPhone &&
            normalizeText(employee?.employeephoneNumber) === createdPhone;
        const sameSite =
            Number.isFinite(createdSiteId) && Number(employee?.siteId) === createdSiteId;

        if (sameWorkNo || samePhone) {
            return sameName ? sameSite || !Number.isFinite(createdSiteId) : true;
        }

        return sameName && (sameSite || !Number.isFinite(createdSiteId));
    });
};

const EmployeeQuickAddSelect = ({
    employees = [],
    value = null,
    onValueChanged,
    onEmployeesChange,
    sites = [],
    placeholder = "Select default employee",
    disabled = false,
    readOnly = false,
    showHint = true,
    hintText = "Can\'t find the employee? Add one and it will be selected automatically.",
    panelTitle = "Add Employee",
    addButtonText = "Quick Add",
    initialEmployeeDraft = null,
    showEditButton = false,
    renderSelectedEmployeePanel = null,
    searchSiteId = null,
}) => {
    const dispatch = useDispatch();
    const [isPanelOpen, setIsPanelOpen] = useState(false);
    const [panelMode, setPanelMode] = useState("create");
    const [isSavingEmployee, setIsSavingEmployee] = useState(false);
    const [searchedEmployees, setSearchedEmployees] = useState([]);

    const employeeOptions = useMemo(
        () => (Array.isArray(employees) ? employees : []).map(normalizeEmployeeOption),
        [employees]
    );

    const mergedEmployeeOptions = useMemo(
        () => dedupeEmployeeOptions([...employeeOptions, ...searchedEmployees]),
        [employeeOptions, searchedEmployees]
    );

    const employeeStore = useMemo(
        () => new CustomStore({
            key: "__employeeId",
            loadMode: "raw",
            load: async (loadOptions) => {
                const searchTerm = String(loadOptions?.searchValue || "").trim();

                if (searchTerm.length < 2) {
                    return [];
                }

                const result = await dispatch(searchEmployees(searchTerm, {
                    limit: 50,
                    active: true,
                    siteId: searchSiteId || undefined,
                }));

                const nextEmployees = normalizeEmployeePayload(result?.data).map(normalizeEmployeeOption);
                setSearchedEmployees(nextEmployees);
                return nextEmployees;
            },
            byKey: async (key) => {
                const existingEmployee = mergedEmployeeOptions.find(
                    (employee) => employee.__employeeId === Number(key)
                );

                if (existingEmployee) {
                    return existingEmployee;
                }

                const refreshed = await dispatch(fetchEmployees(true));
                const refreshedEmployees = normalizeEmployeePayload(refreshed?.data).map(normalizeEmployeeOption);
                const matchedEmployee = refreshedEmployees.find(
                    (employee) => employee.__employeeId === Number(key)
                );

                if (matchedEmployee) {
                    setSearchedEmployees((prev) => dedupeEmployeeOptions([...prev, matchedEmployee]));
                    return matchedEmployee;
                }

                return null;
            },
        }),
        [dispatch, mergedEmployeeOptions, searchSiteId]
    );

    const selectedEmployee = useMemo(() => {
        if (value === null || value === undefined || value === "") return null;
        return mergedEmployeeOptions.find(
            (emp) => resolveEmployeeId(emp) === Number(value)
        ) || null;
    }, [mergedEmployeeOptions, value]);

    const canAddEmployee = !disabled && !readOnly;
    const canEditEmployee = showEditButton && !disabled && !readOnly && selectedEmployee;

    const handleCreateEmployee = useCallback(
        async (payload) => {
            try {
                setIsSavingEmployee(true);
                const response = await dispatch(createEmployee(payload));

                if (!hasSucceeded(response)) {
                    throw new Error(
                        resolveMessage(response, "Failed to create employee.")
                    );
                }

                const createdEmployee = unwrapCreatedEmployee(response);
                const refreshResult = await dispatch(fetchEmployees(true));

                let nextEmployees = Array.isArray(refreshResult?.data)
                    ? refreshResult.data
                    : null;

                if (!nextEmployees && createdEmployee) {
                    nextEmployees = dedupeEmployees([...employeeOptions, createdEmployee]);
                }

                if (nextEmployees) {
                    onEmployeesChange?.(nextEmployees);
                }

                const matchedEmployee = matchCreatedEmployee(
                    nextEmployees || employeeOptions,
                    createdEmployee
                );
                const matchedEmployeeId = resolveEmployeeId(
                    matchedEmployee || createdEmployee
                );

                if (matchedEmployeeId !== null) {
                    onValueChanged?.(matchedEmployeeId);
                }

                setIsPanelOpen(false);
                notify("Employee created successfully.", "success", 2500);
            } catch (error) {
                notify(
                    error?.message || "Failed to create employee.",
                    "error",
                    3000
                );
            } finally {
                setIsSavingEmployee(false);
            }
        },
        [dispatch, employeeOptions, onEmployeesChange, onValueChanged]
    );

    const handleUpdateEmployee = useCallback(
        async (payload) => {
            const employeeId = resolveEmployeeId(selectedEmployee);
            if (employeeId === null) return;
            try {
                setIsSavingEmployee(true);
                const response = await dispatch(updateEmployee(employeeId, payload));

                if (!hasSucceeded(response)) {
                    throw new Error(
                        resolveMessage(response, "Failed to update employee.")
                    );
                }

                const refreshResult = await dispatch(fetchEmployees(true));
                const nextEmployees = Array.isArray(refreshResult?.data)
                    ? refreshResult.data
                    : null;

                if (nextEmployees) {
                    onEmployeesChange?.(nextEmployees);
                }

                setIsPanelOpen(false);
                notify("Employee updated successfully.", "success", 2500);
            } catch (error) {
                notify(
                    error?.message || "Failed to update employee.",
                    "error",
                    3000
                );
            } finally {
                setIsSavingEmployee(false);
            }
        },
        [dispatch, selectedEmployee, onEmployeesChange]
    );

    const handleOpenCreate = useCallback(() => {
        setPanelMode("create");
        setIsPanelOpen(true);
    }, []);

    const handleOpenEdit = useCallback(() => {
        setPanelMode("edit");
        setIsPanelOpen(true);
    }, []);

    const selectedEmployeePanel =
        typeof renderSelectedEmployeePanel === "function"
            ? renderSelectedEmployeePanel({
                selectedEmployee,
                canEditEmployee: Boolean(canEditEmployee),
                openEditPanel: handleOpenEdit,
            })
            : null;

    return (
        <>
            <div className="tw-space-y-2">
                <div className="tw-flex tw-items-start tw-gap-2">
                    <div className="tw-min-w-0 tw-flex-1">
                        <SelectBox
                            dataSource={employeeStore}
                            value={value}
                            valueExpr="__employeeId"
                            displayExpr="__employeeDisplay"
                            onValueChanged={(event) => onValueChanged?.(event.value)}
                            placeholder={placeholder}
                            searchEnabled
                            searchMode="contains"
                            searchExpr={["__employeeDisplay", "__employeeSearch"]}
                            minSearchLength={2}
                            showDataBeforeSearch={false}
                            noDataText="Type at least 2 characters to search employees"
                            showClearButton
                            disabled={disabled}
                            readOnly={readOnly}
                            height={34}
                            stylingMode="outlined"
                            dropDownOptions={{
                                maxHeight: 320,
                                wrapperAttr: {
                                    class: "employee-quick-add-select__dropdown",
                                },
                            }}
                        />
                    </div>

                    {canEditEmployee && (
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost tw-shrink-0"
                            onClick={handleOpenEdit}
                            title="Edit selected employee"
                        >
                            <i className="fa-light fa-pen-to-square"></i>
                            Edit
                        </button>
                    )}

                    {canAddEmployee && (
                        <button
                            type="button"
                            className="m365-btn m365-btn--ghost tw-shrink-0"
                            onClick={handleOpenCreate}
                        >
                            <i className="fa-light fa-user-plus"></i>
                            {addButtonText}
                        </button>
                    )}
                </div>

                {showHint && canAddEmployee && (
                    <span className="m365-field__hint">{hintText}</span>
                )}

                {selectedEmployeePanel}
            </div>

            <SlidePanel
                open={isPanelOpen}
                onClose={() => setIsPanelOpen(false)}
                title={panelMode === "edit" ? "Edit Employee" : panelTitle}
                width={900}
                panelClassName="employee-quick-add-panel-shell"
            >
                <EmployeeFormPanel
                    mode={panelMode}
                    employee={panelMode === "edit" ? selectedEmployee : null}
                    initialValues={panelMode === "create" ? initialEmployeeDraft : null}
                    sites={sites}
                    saving={isSavingEmployee}
                    hideSectionBorders
                    onSubmit={panelMode === "edit" ? handleUpdateEmployee : handleCreateEmployee}
                    onClose={() => setIsPanelOpen(false)}
                />
            </SlidePanel>
        </>
    );
};

export default EmployeeQuickAddSelect;