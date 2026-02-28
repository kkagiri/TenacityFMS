/**
 * File: employeePage.js
 * Purpose: Employee list page with Microsoft-style grid and side-panel CRUD workflow.
 * Dependencies: redux employee/site/permission actions, DevExtreme DataGrid and toolbar components.
 * Last Modified: 2026-02-26
 *
 * Key Components:
 * - EmployeePage(): Manages employee listing, side-panel add/edit/view, export, and refresh operations.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router-dom";
import {
  createEmployee,
  deleteEmployee,
  fetchEmployees,
  updateEmployee,
} from "../../redux/actions/employeeActions";
import { fetchpermissionbyUserId } from "../../redux/actions/permissionActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import Switch from "devextreme-react/switch";
import DataGrid, {
  Column,
  Export,
  Item as TItems,
  LoadPanel,
  Pager,
  Paging,
  SearchPanel,
  Sorting,
  Toolbar,
} from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
import TextBox from "devextreme-react/text-box";
import notify from "devextreme/ui/notify";
import LoadIndicator from "devextreme-react/load-indicator";
import { jsPDF } from "jspdf";
import { exportDataGrid } from "devextreme/pdf_exporter";
import { Workbook } from "exceljs";
import saveAs from "file-saver";
import { exportDataGrid as exportDataGridToExcel } from "devextreme/excel_exporter";
import SlidePanel from "../../components/ui/SlidePanel";
import EmployeeDetailPanel from "./components/EmployeeDetailPanel";
import EmployeeFormPanel from "./components/EmployeeFormPanel";
import "./employeePage.scss";

const EXPORT_FORMATS = ["xlsx", "pdf"];

const toVehiclesArray = (value) => {
  if (!Array.isArray(value)) return [];
  return value.filter((item) => item !== undefined && item !== null);
};

const hasSucceeded = (response) =>
  response?.success === true || response?.Success === true;

const resolveMessage = (response, fallback) =>
  response?.message || response?.Message || fallback;

const EmployeePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const gridRef = useRef(null);

  const employees = useSelector((state) => state.employee?.employees || []);
  const loading = useSelector((state) => state.employee?.loading);
  const permissions = useSelector((state) => state.permission?.permissions || []);
  const user = useSelector((state) => state.auth?.user);
  const sites = useSelector((state) => state.site?.sites || []);

  const [activeOnly, setActiveOnly] = useState(true);
  const [quickSearchTerm, setQuickSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");

  const switchLabel = useMemo(
    () => (activeOnly ? "Active employees only" : "All employees"),
    [activeOnly]
  );

  const canEdit = permissions.includes("_Edit_Employee");
  const canDelete = permissions.includes("_Delete_Employee");
  const canCreate = permissions.includes("_Create_Employee");

  const siteMap = useMemo(() => {
    const result = new Map();
    (sites || []).forEach((site) => {
      result.set(String(site.id), site.name);
    });
    return result;
  }, [sites]);

  const fetchData = useCallback(async () => {
    try {
      const requests = [
        dispatch(fetchEmployees(activeOnly)),
        dispatch(fetchSiteList()),
      ];

      if (user?.id) {
        requests.push(dispatch(fetchpermissionbyUserId(user.id)));
      }

      await Promise.all(requests);
    } catch (error) {
      notify("Failed to refresh employee data.", "error", 3000);
    }
  }, [activeOnly, dispatch, user?.id]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (location.hash !== "#add-employee") return;
    setSelectedEmployee(null);
    setFormMode("create");
    setFormOpen(true);
    setDetailOpen(false);
    navigate(location.pathname, { replace: true });
  }, [location.hash, location.pathname, navigate]);

  const refresh = useCallback(() => {
    fetchData();
    gridRef.current?.instance?.refresh();
  }, [fetchData]);

  const handleQuickSearchChanged = useCallback((event) => {
    const value = event.value || "";
    setQuickSearchTerm(value);
    gridRef.current?.instance?.searchByText(value);
  }, []);

  const handleOpenDetails = useCallback((employee) => {
    if (!employee) return;
    setSelectedEmployee(employee);
    setFormOpen(false);
    setDetailOpen(true);
  }, []);

  const handleOpenCreate = useCallback(() => {
    setSelectedEmployee(null);
    setFormMode("create");
    setDetailOpen(false);
    setFormOpen(true);
  }, []);

  const handleOpenEdit = useCallback(
    (employee) => {
      const target = employee || selectedEmployee;
      if (!target) return;
      setSelectedEmployee(target);
      setFormMode("edit");
      setDetailOpen(false);
      setFormOpen(true);
    },
    [selectedEmployee]
  );

  const closeDetailPanel = useCallback(() => {
    setDetailOpen(false);
  }, []);

  const closeFormPanel = useCallback(() => {
    setFormOpen(false);
    if (formMode === "edit" && selectedEmployee) {
      setDetailOpen(true);
    }
  }, [formMode, selectedEmployee]);

  const onExporting = useCallback((event) => {
    const selectedFormat = event.format;

    if (selectedFormat === "xlsx") {
      const workbook = new Workbook();
      const worksheet = workbook.addWorksheet("Employees");

      exportDataGridToExcel({
        component: event.component,
        worksheet,
        autoFilterEnabled: true,
      })
        .then(() => workbook.xlsx.writeBuffer())
        .then((buffer) => {
          saveAs(
            new Blob([buffer], { type: "application/octet-stream" }),
            "Employees.xlsx"
          );
          notify("Export complete.", "success", 2000);
        })
        .catch(() => notify("Excel export failed.", "error", 2500));
    } else if (selectedFormat === "pdf") {
      const pdfDocument = new jsPDF();
      exportDataGrid({
        jsPDFDocument: pdfDocument,
        component: event.component,
        indent: 5,
      })
        .then(() => {
          pdfDocument.save("Employees.pdf");
          notify("Export complete.", "success", 2000);
        })
        .catch(() => notify("PDF export failed.", "error", 2500));
    }

    event.cancel = true;
  }, []);

  const syncSelectionAfterRefresh = useCallback(
    async (employeeId, closeDetailsWhenMissing = true) => {
      const refreshResult = await dispatch(fetchEmployees(activeOnly));
      const refreshed = Array.isArray(refreshResult?.data) ? refreshResult.data : [];
      const matched = refreshed.find(
        (employee) => String(employee.id) === String(employeeId)
      );

      if (matched) {
        setSelectedEmployee(matched);
        return matched;
      }

      setSelectedEmployee(null);
      if (closeDetailsWhenMissing) {
        setDetailOpen(false);
      }
      return null;
    },
    [activeOnly, dispatch]
  );

  const handleCreateEmployee = useCallback(
    async (payload) => {
      try {
        setSaving(true);
        const response = await dispatch(createEmployee(payload));
        if (!hasSucceeded(response)) {
          throw new Error(resolveMessage(response, "Failed to create employee."));
        }

        await dispatch(fetchEmployees(activeOnly));
        setFormOpen(false);
        notify("Employee created successfully.", "success", 2500);
      } catch (error) {
        notify(error.message || "Failed to create employee.", "error", 3000);
      } finally {
        setSaving(false);
      }
    },
    [activeOnly, dispatch]
  );

  const handleUpdateEmployee = useCallback(
    async (payload) => {
      if (!selectedEmployee?.id) return;

      try {
        setSaving(true);
        const response = await dispatch(updateEmployee(selectedEmployee.id, payload));
        if (!hasSucceeded(response)) {
          throw new Error(resolveMessage(response, "Failed to update employee."));
        }

        const updated = await syncSelectionAfterRefresh(selectedEmployee.id, true);
        setFormOpen(false);
        setDetailOpen(Boolean(updated));
        notify("Employee updated successfully.", "success", 2500);
      } catch (error) {
        notify(error.message || "Failed to update employee.", "error", 3000);
      } finally {
        setSaving(false);
      }
    },
    [dispatch, selectedEmployee?.id, syncSelectionAfterRefresh]
  );

  const handleDeleteEmployee = useCallback(
    async (employee) => {
      const target = employee || selectedEmployee;
      if (!target?.id) return;

      const confirmed = window.confirm(
        `Delete employee "${target.fullName || target.id}"? This action cannot be undone.`
      );
      if (!confirmed) return;

      try {
        setDeleting(true);
        const response = await dispatch(deleteEmployee(target.id));
        if (!hasSucceeded(response)) {
          throw new Error(resolveMessage(response, "Failed to delete employee."));
        }

        await dispatch(fetchEmployees(activeOnly));
        if (String(selectedEmployee?.id) === String(target.id)) {
          setSelectedEmployee(null);
          setDetailOpen(false);
        }
        setFormOpen(false);
        notify("Employee removed successfully.", "success", 2500);
      } catch (error) {
        notify(error.message || "Failed to delete employee.", "error", 3000);
      } finally {
        setDeleting(false);
      }
    },
    [activeOnly, dispatch, selectedEmployee]
  );

  const detailHeaderActions =
    canEdit || canDelete ? (
      <>
        {canEdit && (
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={() => handleOpenEdit(selectedEmployee)}
            disabled={deleting}
          >
            <i className="fa-light fa-pen-to-square"></i>
            Edit
          </button>
        )}
        {canDelete && (
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={() => handleDeleteEmployee(selectedEmployee)}
            disabled={deleting}
            style={{ color: "#d13438" }}
          >
            <i className="fa-light fa-trash-can"></i>
            Delete
          </button>
        )}
      </>
    ) : null;

  const renderVehiclesCell = useCallback(
    (cell) => {
      const values = toVehiclesArray(cell.data?.vehicles);
      if (!values.length) return <span className="employee-grid__muted">-</span>;

      const text = values
        .map((value) => {
          if (typeof value === "object" && value !== null) {
            return (
              value.hyoungNo ||
              value.numberPlate ||
              value.vehicleName ||
              value.name ||
              `Vehicle #${value.vehicleId || value.id || "-"}`
            );
          }
          return `Vehicle #${value}`;
        })
        .join(", ");
      return <span title={text}>{text}</span>;
    },
    []
  );

  if (loading && !employees.length) {
    return (
      <div className="employee-page-loading">
        <LoadIndicator visible width="30px" height="30px" />
      </div>
    );
  }

  return (
    <div className="employee-page">
      <div className="employee-page__header">
        <div>
          <h2 className="employee-page__title">Employees</h2>
          <p className="employee-page__subtitle">
            Manage employee records, assignments, and profile lifecycle.
          </p>
        </div>

        <div className="employee-page__header-actions">
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={() => navigate("/employees/consumption-history")}
          >
            <i className="fa-light fa-chart-column"></i>
            Open Consumption History
          </button>
          {canCreate && (
            <button type="button" className="m365-btn m365-btn--primary" onClick={handleOpenCreate}>
              <i className="fa-light fa-user-plus"></i>
              Add Employee
            </button>
          )}
        </div>
      </div>

      <div className="employee-page__grid-shell">
        <DataGrid
          ref={gridRef}
          className="employee-grid employee-grid--simple"
          dataSource={employees}
          keyExpr="id"
          showBorders={false}
          showColumnLines={false}
          showRowLines={true}
          rowAlternationEnabled={false}
          columnAutoWidth={true}
          allowColumnResizing={true}
          allowColumnReordering={true}
          repaintChangesOnly
          onRowClick={(event) => handleOpenDetails(event.data)}
          onExporting={onExporting}
        >
          <LoadPanel enabled={true} />
          <Export enabled={true} allowExportSelectedData={false} formats={EXPORT_FORMATS} />
          <Paging enabled={true} defaultPageSize={20} />
          <Pager
            visible={true}
            showInfo={true}
            showNavigationButtons={true}
            showPageSizeSelector={true}
            allowedPageSizes={[10, 20, 50, 100]}
          />
          <SearchPanel visible={false} />
          <Sorting mode="multiple" />

          <Toolbar>
            <TItems location="before" locateInMenu="auto">
              <TextBox
                value={quickSearchTerm}
                width={280}
                mode="search"
                showClearButton={true}
                placeholder="Quick employee search..."
                onValueChanged={handleQuickSearchChanged}
              />
            </TItems>

            <TItems location="after" locateInMenu="auto">
              <span>{switchLabel}</span>
            </TItems>
            <TItems location="after" locateInMenu="auto">
              <Switch
                value={activeOnly}
                onValueChanged={(event) => setActiveOnly(Boolean(event.value))}
              />
            </TItems>
            <TItems name="exportButton" locateInMenu="auto" />
            <TItems location="after" locateInMenu="auto">
              <Button icon="refresh" text="Refresh" stylingMode="text" onClick={refresh} />
            </TItems>
          </Toolbar>

          <Column
            dataField="fullName"
            caption="Full Name"
            minWidth={220}
            allowHiding={false}
            calculateCellValue={(row) => (row.fullName ? row.fullName.toUpperCase() : "")}
          />
          <Column dataField="employeephoneNumber" caption="Phone No" minWidth={140} />
          <Column dataField="employeeWorkNo" caption="Work No" minWidth={120} />
          <Column dataField="employeestatus" caption="Status" minWidth={120} />
          <Column dataField="vehicles" caption="Default Vehicles" minWidth={260} cellRender={renderVehiclesCell} />
          <Column
            dataField="siteId"
            caption="Site"
            minWidth={160}
            calculateCellValue={(row) =>
              row.siteId ? siteMap.get(String(row.siteId)) || "-" : "Unassigned"
            }
          />
          <Column
            caption="Actions"
            width={160}
            fixed={true}
            fixedPosition="right"
            allowSorting={false}
            allowFiltering={false}
            cellRender={(cell) => (
              <div className="employee-grid__actions">
                <button
                  type="button"
                  className="employee-grid__action-link"
                  onClick={(event) => {
                    event.stopPropagation();
                    handleOpenDetails(cell.data);
                  }}
                >
                  View
                </button>
                {canEdit && (
                  <button
                    type="button"
                    className="employee-grid__action-link"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleOpenEdit(cell.data);
                    }}
                  >
                    Edit
                  </button>
                )}
              </div>
            )}
          />
        </DataGrid>
      </div>

      <SlidePanel
        open={detailOpen}
        onClose={closeDetailPanel}
        title={selectedEmployee?.fullName || "Employee Details"}
        width={900}
        headerActions={detailHeaderActions}
      >
        <EmployeeDetailPanel
          employee={selectedEmployee}
          sites={sites}
        />
      </SlidePanel>

      <SlidePanel
        open={formOpen}
        onClose={closeFormPanel}
        title={
          formMode === "create"
            ? "Add Employee"
            : `Edit Employee: ${selectedEmployee?.fullName || ""}`
        }
        width={900}
      >
        <EmployeeFormPanel
          mode={formMode}
          employee={formMode === "edit" ? selectedEmployee : null}
          sites={sites}
          saving={saving}
          onSubmit={formMode === "create" ? handleCreateEmployee : handleUpdateEmployee}
          onClose={closeFormPanel}
        />
      </SlidePanel>
    </div>
  );
};

export default EmployeePage;
