/**
 * File: employeePage.js
 * Purpose: Employee list management page with CRUD operations, quick search, and details navigation.
 * Dependencies: redux employee/site/vehicle/user actions, DevExtreme DataGrid components.
 * Last Modified: 2026-02-16
 *
 * Key Components:
 * - EmployeePage(): Manages employee listing, editing, export, and detail access.
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
import { fetchVehicleList } from "../../redux/actions/vehicleActions";
import { fetchpermissionbyUserId } from "../../redux/actions/permissionActions";
import { fetchUsers } from "../../redux/actions/userActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import EmployeevehicleTagbox from "../../components/employee/employeeVehicleTagBox";
import Switch from "devextreme-react/switch";
import { format } from "date-fns";
import DataGrid, {
  Column,
  ColumnChooser,
  Editing,
  Export,
  FilterRow,
  HeaderFilter,
  Item as TItems,
  LoadPanel,
  Lookup,
  Pager,
  Paging,
  Position,
  SearchPanel,
  Selection,
  Sorting,
  Toolbar,
  RequiredRule,
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

const EmployeePage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const gridRef = useRef(null);

  const employees = useSelector((state) => state.employee?.employees || []);
  const loading = useSelector((state) => state.employee?.loading);
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const permissions = useSelector((state) => state.permission?.permissions || []);
  const users = useSelector((state) => state.user?.users || []);
  const user = useSelector((state) => state.auth?.user);
  const sites = useSelector((state) => state.site?.sites || []);

  const [saving, setSaving] = useState(false);
  const [activeOnly, setActiveOnly] = useState(true);
  const [quickSearchTerm, setQuickSearchTerm] = useState("");

  const employeeStatusOptions = ["Active", "Terminated"];
  const exportFormats = ["xlsx", "pdf"];
  const switchLabel = useMemo(
    () => (activeOnly ? "Active employees only" : "All employees"),
    [activeOnly]
  );

  const fetchData = useCallback(async () => {
    try {
      const requests = [
        dispatch(fetchEmployees(activeOnly)),
        dispatch(fetchVehicleList()),
        dispatch(fetchUsers()),
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
    if (location.hash === "#add-employee" && gridRef.current?.instance) {
      gridRef.current.instance.addRow();
      navigate(location.pathname, { replace: true });
    }
  }, [location.hash, location.pathname, navigate]);

  const refresh = useCallback(() => {
    fetchData();
    gridRef.current?.instance.refresh();
  }, [fetchData]);

  const addRow = useCallback(() => {
    gridRef.current?.instance.addRow();
  }, []);

  const handleQuickSearchChanged = useCallback((event) => {
    const value = event.value || "";
    setQuickSearchTerm(value);
    gridRef.current?.instance.searchByText(value);
  }, []);

  const formatDateToLocal = useCallback((cellInfo) => {
    if (!cellInfo?.value) return "";
    return format(new Date(cellInfo.value), "dd/MM/yyyy HH:mm");
  }, []);

  const vehicleTemplate = useCallback(
    (container, options) => {
      const text = (options.value || [])
        .map((vehicleId) => {
          const vehicle = vehicles.find((item) => item.vehicleId === vehicleId);
          return vehicle ? vehicle.hyoungNo : vehicleId;
        })
        .join(", ");
      container.textContent = text || "\u00A0";
      container.title = text;
    },
    [vehicles]
  );

  const handleOpenDetails = useCallback(
    (employeeId) => {
      if (!employeeId) return;
      navigate(`/employees/${employeeId}/details`);
    },
    [navigate]
  );

  const onRowInserted = useCallback(
    async (event) => {
      try {
        setSaving(true);
        const payload = {
          ...event.data,
          fullName: (event.data.fullName || "").toUpperCase(),
          vehicles: event.data.vehicles || [],
        };

        delete payload.id;

        const response = await dispatch(createEmployee(payload));
        const success = response?.success || response?.Success;

        if (!success) {
          throw new Error(response?.message || response?.Message || "Create failed");
        }

        await dispatch(fetchEmployees(activeOnly));
        notify("Employee added successfully.", "success", 2500);
      } catch (error) {
        event.cancel = true;
        notify(error.message || "Failed to create employee.", "error", 3000);
      } finally {
        setSaving(false);
      }
    },
    [activeOnly, dispatch]
  );

  const onRowUpdated = useCallback(
    async (event) => {
      try {
        setSaving(true);
        const merged = {
          ...event.oldData,
          ...event.data,
          id: event.key,
          fullName: (event.data.fullName || event.oldData.fullName || "").toUpperCase(),
        };

        merged.vehicles = Array.isArray(merged.vehicles)
          ? merged.vehicles.map((vehicle) =>
              typeof vehicle === "object" && vehicle.vehicleId
                ? vehicle.vehicleId
                : vehicle
            )
          : [];

        const response = await dispatch(updateEmployee(event.key, merged));
        const success = response?.success || response?.Success;

        if (!success) {
          throw new Error(response?.message || response?.Message || "Update failed");
        }

        await dispatch(fetchEmployees(activeOnly));
        notify("Employee updated successfully.", "success", 2500);
      } catch (error) {
        event.cancel = true;
        notify(error.message || "Failed to update employee.", "error", 3000);
      } finally {
        setSaving(false);
      }
    },
    [activeOnly, dispatch]
  );

  const onRowRemoved = useCallback(
    async (event) => {
      try {
        setSaving(true);
        const response = await dispatch(deleteEmployee(event.key));
        const success = response?.success || response?.Success;

        if (!success) {
          throw new Error(response?.message || response?.Message || "Failed to delete employee.");
        }

        await dispatch(fetchEmployees(activeOnly));
        notify("Employee removed successfully.", "success", 2500);
      } catch (error) {
        event.cancel = true;
        notify(error.message || "Failed to delete employee.", "error", 3000);
      } finally {
        setSaving(false);
      }
    },
    [activeOnly, dispatch]
  );

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

  const canEdit = permissions.includes("_Edit_Employee");
  const canDelete = permissions.includes("_Delete_Employee");
  const canCreate = permissions.includes("_Create_Employee");

  if (loading || saving) {
    return (
      <div className="tw-h-[70vh] tw-flex tw-items-center tw-justify-center">
        <LoadIndicator visible={true} width="30px" height="30px" />
      </div>
    );
  }

  return (
    <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-200 tw-p-4">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3 tw-mb-4">
        <div>
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">Employees</h2>
          <p className="tw-text-sm tw-text-gray-600">
            Manage employee records, assignments, and profile lifecycle.
          </p>
        </div>

        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            text="Open Consumption History"
            icon="fa-light fa-chart-column"
            type="normal"
            stylingMode="outlined"
            onClick={() => navigate("/employees/consumption-history")}
          />
          <Button
            text="Add Employee"
            icon="fa-light fa-user-plus"
            type="default"
            stylingMode="contained"
            visible={canCreate}
            onClick={addRow}
          />
        </div>
      </div>

      <DataGrid
        ref={gridRef}
        dataSource={employees}
        showBorders={true}
        keyExpr="id"
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        repaintChangesOnly={true}
        onRowInserted={onRowInserted}
        onRowUpdated={onRowUpdated}
        onRowRemoved={onRowRemoved}
        onExporting={onExporting}
      >
        <LoadPanel enabled={true} />
        <ColumnChooser enabled={true} mode="select" height={220}>
          <Position my="right top" at="right top" />
        </ColumnChooser>
        <Export
          enabled={true}
          allowExportSelectedData={true}
          formats={exportFormats}
        />
        <Paging enabled={true} defaultPageSize={20} />
        <Pager
          visible={true}
          showInfo={true}
          showNavigationButtons={true}
          showPageSizeSelector={true}
          allowedPageSizes={[10, 20, 50, 100]}
        />
        <SearchPanel visible={false} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Sorting mode="multiple" />
        <Selection mode="multiple" />

        <Editing
          mode="row"
          allowUpdating={canEdit}
          allowAdding={canCreate}
          allowDeleting={canDelete}
          selectTextOnEditStart={true}
          startEditAction="dblClick"
          newRowPosition="first"
        />

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
              onValueChanged={(event) => setActiveOnly(event.value)}
            />
          </TItems>
          <TItems name="exportButton" locateInMenu="auto" />
          <TItems name="columnChooserButton" locateInMenu="auto" />
          <TItems location="after" locateInMenu="auto">
            <Button
              icon="refresh"
              text="Refresh"
              stylingMode="text"
              onClick={refresh}
            />
          </TItems>
        </Toolbar>

        <Column dataField="id" visible={false} allowEditing={false} />

        <Column
          dataField="fullName"
          caption="Full Name"
          minWidth={210}
          allowHiding={false}
          calculateCellValue={(data) => (data.fullName ? data.fullName.toUpperCase() : "")}
        >
          <RequiredRule />
        </Column>

        <Column
          dataField="employeephoneNumber"
          caption="Phone No"
          minWidth={150}
          hidingPriority={3}
        />
        <Column
          dataField="employeeWorkNo"
          caption="Work No"
          minWidth={140}
          hidingPriority={3}
        />
        <Column
          dataField="employeestatus"
          caption="Status"
          minWidth={130}
          hidingPriority={3}
        >
          <Lookup dataSource={employeeStatusOptions} />
        </Column>

        <Column
          dataField="vehicles"
          caption="Default Vehicles"
          minWidth={290}
          hidingPriority={4}
          allowSorting={false}
          allowHiding={false}
          allowFiltering={false}
          editCellRender={(cellInfo) => (
            <EmployeevehicleTagbox
              value={cellInfo.value}
              onValueChanged={(newValue) => cellInfo.setValue(newValue)}
            />
          )}
          cellTemplate={vehicleTemplate}
        />

        <Column
          dataField="siteId"
          caption="Site"
          minWidth={150}
          allowHiding={false}
          hidingPriority={5}
        >
          <Lookup dataSource={sites} valueExpr="id" displayExpr="name" />
          <RequiredRule />
        </Column>

        <Column
          dataField="dateCreated"
          caption="Created On"
          dataType="datetime"
          visible={false}
          allowEditing={false}
          cellRender={formatDateToLocal}
        />
        <Column
          dataField="dateModified"
          caption="Updated On"
          dataType="datetime"
          visible={false}
          allowEditing={false}
          cellRender={formatDateToLocal}
        />
        <Column
          dataField="createdBy"
          caption="Created By"
          visible={false}
          allowEditing={false}
        >
          <Lookup dataSource={users} valueExpr="id" displayExpr="userName" />
        </Column>
        <Column
          dataField="modifiedBy"
          caption="Updated By"
          visible={false}
          allowEditing={false}
        >
          <Lookup dataSource={users} valueExpr="id" displayExpr="userName" />
        </Column>

        <Column
          caption="Details"
          width={120}
          fixed={true}
          fixedPosition="right"
          allowEditing={false}
          allowFiltering={false}
          allowSorting={false}
          cellRender={(cell) => (
            <Button
              text="Open"
              icon="fa-light fa-arrow-right"
              stylingMode="text"
              onClick={() => handleOpenDetails(cell.data.id)}
            />
          )}
        />
      </DataGrid>
    </div>
  );
};

export default EmployeePage;
