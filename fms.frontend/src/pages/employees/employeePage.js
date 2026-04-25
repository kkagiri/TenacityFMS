/**
 * File: employeePage.js
 * Purpose: Employee list page with Microsoft-style grid and side-panel CRUD workflow.
 * Dependencies: redux employee/site/permission actions, DevExtreme DataGrid and toolbar components.
 * Last Modified: 2026-04-25
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
import { fetchSiteList } from "../../redux/actions/siteActions";
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import DataGrid, {
  Column,
  Export,
  FilterRow,
  HeaderFilter,
  Item as TItems,
  LoadPanel,
  Pager,
  Paging,
  Sorting,
  Toolbar,
} from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
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
import EmployeeGridActionMenu from "./components/EmployeeGridActionMenu";
import EmployeeListSearchPanel from "./components/EmployeeListSearchPanel";
import EmployeeNameCell from "./components/EmployeeNameCell";
import EmployeeVehiclesCell from "./components/EmployeeVehiclesCell";
import { usePermissions } from "../../hooks/usePermissions";
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

const normalizeFilterText = (value) => String(value || "").trim();

const toFilterKey = (value) => normalizeFilterText(value).toLowerCase();

const EmployeePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const gridRef = useRef(null);
  const { hasPermission } = usePermissions();

  const employees = useSelector((state) => state.employee?.employees || []);
  const loading = useSelector((state) => state.employee?.loading);
  const sites = useSelector((state) => state.site?.sites || []);
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);

  const [searchText, setSearchText] = useState("");
  const [positionFilter, setPositionFilter] = useState("all");
  const [siteFilter, setSiteFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("active");
  const [openActionMenu, setOpenActionMenu] = useState(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("create");
  const canEdit = hasPermission("_Edit_Employee");
  const canDelete = hasPermission("_Delete_Employee");
  const canCreate = hasPermission("_Create_Employee");

  const siteMap = useMemo(() => {
    const result = new Map();
    (sites || []).forEach((site) => {
      result.set(String(site.id), site.name);
    });
    return result;
  }, [sites]);

  const fetchData = useCallback(async () => {
    try {
      const requests = [dispatch(fetchEmployees(false)), dispatch(fetchSiteList())];

      await Promise.all(requests);
    } catch (error) {
      notify("Failed to refresh employee data.", "error", 3000);
    }
  }, [dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!vehicles.length) {
      dispatch(fetchVehicleList()).catch(() => {
        notify("Failed to load vehicle references for employee assignments.", "warning", 3000);
      });
    }
  }, [dispatch, vehicles.length]);

  useEffect(() => {
    if (location.hash !== "#add-employee") return;
    if (!canCreate) {
      notify("You do not have permission to add employees.", "warning", 2500);
      navigate(location.pathname, { replace: true });
      return;
    }
    setSelectedEmployee(null);
    setFormMode("create");
    setFormOpen(true);
    setDetailOpen(false);
    navigate(location.pathname, { replace: true });
  }, [canCreate, location.hash, location.pathname, navigate]);

  useEffect(() => {
    if (!openActionMenu) return undefined;

    const closeMenu = (event) => {
      if (!event.target.closest(".employee-grid__action-menu-wrap")) {
        setOpenActionMenu(null);
      }
    };

    document.addEventListener("mousedown", closeMenu);
    return () => document.removeEventListener("mousedown", closeMenu);
  }, [openActionMenu]);

  const refresh = useCallback(() => {
    fetchData();
    gridRef.current?.instance?.refresh();
  }, [fetchData]);

  const handleOpenDetails = useCallback((employee) => {
    if (!employee) return;
    setOpenActionMenu(null);
    setSelectedEmployee(employee);
    setFormOpen(false);
    setDetailOpen(true);
  }, []);

  const handleOpenCreate = useCallback(() => {
    if (!canCreate) {
      notify("You do not have permission to add employees.", "warning", 2500);
      return;
    }
    setSelectedEmployee(null);
    setFormMode("create");
    setDetailOpen(false);
    setFormOpen(true);
  }, [canCreate]);

  const handleOpenEdit = useCallback(
    (employee) => {
      const target = employee || selectedEmployee;
      if (!target) return;
      setOpenActionMenu(null);
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
      const refreshResult = await dispatch(fetchEmployees(false));
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
    [dispatch]
  );

  const handleCreateEmployee = useCallback(
    async (payload) => {
      try {
        setSaving(true);
        const response = await dispatch(createEmployee(payload));
        if (!hasSucceeded(response)) {
          throw new Error(resolveMessage(response, "Failed to create employee."));
        }

        await dispatch(fetchEmployees(false));
        setFormOpen(false);
        notify("Employee created successfully.", "success", 2500);
      } catch (error) {
        notify(error.message || "Failed to create employee.", "error", 3000);
      } finally {
        setSaving(false);
      }
    },
    [dispatch]
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
      setOpenActionMenu(null);

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

        await dispatch(fetchEmployees(false));
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
    [dispatch, selectedEmployee]
  );
  const vehicleMap = useMemo(() => {
    const result = new Map();
    (vehicles || []).forEach((vehicle) => {
      const vehicleId = vehicle?.vehicleId ?? vehicle?.id;
      if (vehicleId === undefined || vehicleId === null) return;
      result.set(
        String(vehicleId),
        vehicle?.hyoungNo || vehicle?.HyoungNo || vehicle?.numberPlate || vehicle?.vehicleName || vehicle?.name || null
      );
    });
    return result;
  }, [vehicles]);

  const resolveVehicleLabel = useCallback(
    (value) => {
      if (typeof value === "object" && value !== null) {
        const vehicleId = value.vehicleId ?? value.id;
        return (
          value.hyoungNo ||
          value.HyoungNo ||
          value.vehicleHyoungNo ||
          value.numberPlate ||
          value.vehicleName ||
          value.name ||
          (vehicleId !== undefined && vehicleId !== null
            ? vehicleMap.get(String(vehicleId)) || `Vehicle #${vehicleId}`
            : "")
        );
      }

      if (value === undefined || value === null || value === "") {
        return "";
      }

      return vehicleMap.get(String(value)) || `Vehicle #${value}`;
    },
    [vehicleMap]
  );

  const getVehicleDisplayText = useCallback(
    (row) => {
      const values = toVehiclesArray(row?.vehicles);
      if (!values.length) return "";

      return values
        .map(resolveVehicleLabel)
        .filter(Boolean)
        .join(", ");
    },
    [resolveVehicleLabel]
  );

  const positionOptions = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return Array.from(new Set(list.map((employee) => normalizeFilterText(employee.position)).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right));
  }, [employees]);

  const statusOptions = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    return Array.from(new Set(list.map((employee) => normalizeFilterText(employee.employeestatus)).filter(Boolean)))
      .sort((left, right) => left.localeCompare(right));
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    const list = Array.isArray(employees) ? employees : [];
    const query = toFilterKey(searchText);

    return list.filter((employee) => {
      const siteName = employee.siteId ? siteMap.get(String(employee.siteId)) || "" : "Unassigned";
      const matchesSearch = !query || [
        employee.fullName,
        employee.employeeWorkNo,
        employee.employeephoneNumber,
        employee.position,
        employee.employeestatus,
        siteName,
      ].some((value) => toFilterKey(value).includes(query));

      const matchesPosition = positionFilter === "all" || toFilterKey(employee.position) === positionFilter;
      const employeeSiteKey = employee.siteId ? String(employee.siteId) : "unassigned";
      const matchesSite = siteFilter === "all" || employeeSiteKey === siteFilter;
      const matchesStatus = statusFilter === "all" || toFilterKey(employee.employeestatus) === statusFilter;

      return matchesSearch && matchesPosition && matchesSite && matchesStatus;
    });
  }, [employees, positionFilter, searchText, siteFilter, siteMap, statusFilter]);

  const handleToggleActionMenu = useCallback((employeeId, triggerRect) => {
    setOpenActionMenu((current) => {
      if (current?.employeeId === employeeId) return null;

      const menuWidth = 150;
      return {
        employeeId,
        position: triggerRect
          ? {
            top: Math.round(triggerRect.bottom + 4),
            left: Math.max(8, Math.round(triggerRect.right - menuWidth)),
          }
          : null,
      };
    });
  }, []);

  if (loading && !employees.length) {
    return (
      <div className="employee-page-loading">
        <LoadIndicator visible width="30px" height="30px" />
      </div>
    );
  }

  return (
    <div className="employee-page">
      <EmployeeListSearchPanel
        searchText={searchText}
        positionFilter={positionFilter}
        siteFilter={siteFilter}
        statusFilter={statusFilter}
        positionOptions={positionOptions}
        statusOptions={statusOptions}
        sites={sites}
        canCreate={canCreate}
        onSearchTextChange={setSearchText}
        onPositionFilterChange={setPositionFilter}
        onSiteFilterChange={setSiteFilter}
        onStatusFilterChange={setStatusFilter}
        onCreateEmployee={handleOpenCreate}
        toFilterKey={toFilterKey}
      />

      <div className="employee-page__grid-shell">
        <DataGrid
          ref={gridRef}
          className="employee-grid employee-grid--simple"
          dataSource={filteredEmployees}
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
          <HeaderFilter visible={true} />
          <FilterRow visible={true} />
          <Sorting mode="multiple" />

          <Toolbar>
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
            cellRender={(cell) => <EmployeeNameCell employee={cell.data} />}
          />
          <Column dataField="employeephoneNumber" caption="Phone No" minWidth={140} />
          <Column dataField="employeeWorkNo" caption="Work No" minWidth={120} />
          <Column dataField="position" caption="Position" minWidth={160} />
          <Column dataField="employeestatus" caption="Status" minWidth={120} />
          <Column
            dataField="vehicles"
            caption="Default Vehicles"
            minWidth={260}
            calculateCellValue={getVehicleDisplayText}
            cellRender={(cell) => <EmployeeVehiclesCell text={cell.value || ""} />}
          />
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
            width={76}
            fixed={true}
            fixedPosition="right"
            allowSorting={false}
            allowFiltering={false}
            cellRender={(cell) => (
              <EmployeeGridActionMenu
                employee={cell.data}
                isOpen={openActionMenu?.employeeId === cell.data?.id}
                canEdit={canEdit}
                canDelete={canDelete}
                deleting={deleting}
                menuPosition={openActionMenu?.employeeId === cell.data?.id ? openActionMenu.position : null}
                onToggle={handleToggleActionMenu}
                onView={handleOpenDetails}
                onEdit={handleOpenEdit}
                onDelete={handleDeleteEmployee}
              />
            )}
          />
        </DataGrid>
      </div>

      <SlidePanel
        open={detailOpen}
        onClose={closeDetailPanel}
        title={selectedEmployee?.fullName || "Employee Details"}
        width={900}
      >
        <EmployeeDetailPanel
          employee={selectedEmployee}
          sites={sites}
          onEdit={canEdit ? () => handleOpenEdit(selectedEmployee) : undefined}
          onDelete={canDelete ? () => handleDeleteEmployee(selectedEmployee) : undefined}
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
          hideSectionBorders={true}
          onSubmit={formMode === "create" ? handleCreateEmployee : handleUpdateEmployee}
          onClose={closeFormPanel}
        />
      </SlidePanel>
    </div>
  );
};

export default EmployeePage;
