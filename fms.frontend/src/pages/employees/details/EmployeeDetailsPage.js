/**
 * File: EmployeeDetailsPage.js
 * Purpose: Shows employee profile information with consumption, refill, and vehicle-change history tabs.
 * Dependencies: axios instance, redux site/vehicle actions, DevExtreme tabs/grid components.
 * Last Modified: 2026-02-16
 *
 * Key Components:
 * - EmployeeDetailsPage(): Loads employee profile and renders tabbed history analytics.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Tabs from "devextreme-react/tabs";
import Popup from "devextreme-react/popup";
import TagBox from "devextreme-react/tag-box";
import SelectBox from "devextreme-react/select-box";
import DataGrid, {
  Column,
  FilterRow,
  HeaderFilter,
  Pager,
  Paging,
  SearchPanel,
} from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import axiosInstance from "../../../api/axiosInstance";
import {
  deleteEmployee,
  updateEmployee,
} from "../../../redux/actions/employeeActions";
import { fetchpermissionbyUserId } from "../../../redux/actions/permissionActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import "./EmployeeDetailsPage.scss";

const toDateInputValue = (date) => date.toISOString().split("T")[0];

const normalizeResponseData = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.Data)) return payload.Data;
  return [];
};

const toSafeNumber = (value) => {
  const converted = Number(value);
  return Number.isFinite(converted) ? converted : 0;
};

const parseDate = (value) => {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const tabItems = [
  {
    id: "consumption",
    text: "Consumption History",
    icon: "fa-light fa-chart-column",
  },
  {
    id: "refill",
    text: "Fuel Refill History",
    icon: "fa-light fa-gas-pump",
  },
  {
    id: "vehicle-change",
    text: "Vehicle Change History",
    icon: "fa-light fa-right-left",
  },
];

const employeeStatusOptions = ["Active", "Terminated"];

const toEditFormData = (sourceEmployee) => ({
  fullName: sourceEmployee?.fullName || "",
  employeephoneNumber: sourceEmployee?.employeephoneNumber || "",
  employeeWorkNo: sourceEmployee?.employeeWorkNo || "",
  employeestatus: sourceEmployee?.employeestatus || "Active",
  siteId: sourceEmployee?.siteId ?? null,
  vehicles: Array.isArray(sourceEmployee?.vehicles) ? sourceEmployee.vehicles : [],
});

const EmployeeDetailsPage = () => {
  const { id } = useParams();
  const employeeId = Number(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const sites = useSelector((state) => state.site?.sites || []);
  const permissions = useSelector((state) => state.permission?.permissions || []);
  const user = useSelector((state) => state.auth?.user);

  const [employee, setEmployee] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [selectedTab, setSelectedTab] = useState(0);
  const [fromDate, setFromDate] = useState(
    toDateInputValue(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
  );
  const [toDate, setToDate] = useState(toDateInputValue(new Date()));
  const [showEditPopup, setShowEditPopup] = useState(false);
  const [savingEmployeeChanges, setSavingEmployeeChanges] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);
  const [editFormData, setEditFormData] = useState(() => toEditFormData(null));

  useEffect(() => {
    if (!vehicles.length) {
      dispatch(fetchVehicleList());
    }
    if (!sites.length) {
      dispatch(fetchSiteList());
    }
  }, [dispatch, sites.length, vehicles.length]);

  useEffect(() => {
    if (user?.id) {
      dispatch(fetchpermissionbyUserId(user.id));
    }
  }, [dispatch, user?.id]);

  const loadEmployee = useCallback(async () => {
    if (!employeeId || Number.isNaN(employeeId)) {
      setLoadingEmployee(false);
      setEmployee(null);
      return;
    }

    setLoadingEmployee(true);
    try {
      const response = await axiosInstance.get(`/employee/${employeeId}`);
      const payload = response.data;

      if (payload && payload.id) {
        setEmployee(payload);
      } else {
        const wrapped = payload?.data || payload?.Data || null;
        setEmployee(wrapped);
      }
    } catch (error) {
      setEmployee(null);
      notify(
        error?.response?.data?.message || "Failed to load employee details.",
        "error",
        3500
      );
    } finally {
      setLoadingEmployee(false);
    }
  }, [employeeId]);

  useEffect(() => {
    loadEmployee();
  }, [loadEmployee]);

  useEffect(() => {
    if (employee && !showEditPopup) {
      setEditFormData(toEditFormData(employee));
    }
  }, [employee, showEditPopup]);

  const loadTransactions = useCallback(async () => {
    setLoadingTransactions(true);
    try {
      const response = await axiosInstance.get("/consumption/pumptransactions", {
        params: {
          startDate: new Date(`${fromDate}T00:00:00`).toISOString(),
          endDate: new Date(`${toDate}T23:59:59`).toISOString(),
          processedOnly: true,
        },
      });

      setAllTransactions(normalizeResponseData(response.data));
    } catch (error) {
      setAllTransactions([]);
      notify(
        error?.response?.data?.message ||
          "Failed to load employee transaction history.",
        "error",
        3500
      );
    } finally {
      setLoadingTransactions(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const vehicleMap = useMemo(() => {
    const map = new Map();
    vehicles.forEach((vehicle) => {
      map.set(vehicle.vehicleId, vehicle.hyoungNo || vehicle.numberPlate);
    });
    return map;
  }, [vehicles]);

  const siteMap = useMemo(() => {
    const map = new Map();
    sites.forEach((site) => {
      map.set(site.id, site.name);
    });
    return map;
  }, [sites]);

  const getVehicleName = useCallback(
    (vehicleId, fallbackName = null) => {
      if (fallbackName) return fallbackName;
      return vehicleMap.get(vehicleId) || (vehicleId ? `Vehicle #${vehicleId}` : "-");
    },
    [vehicleMap]
  );

  const assignedVehicleRows = useMemo(() => {
    const assigned = Array.isArray(employee?.vehicles) ? employee.vehicles : [];
    return assigned.map((vehicleId) => ({
      vehicleId,
      vehicleName: getVehicleName(vehicleId),
    }));
  }, [employee?.vehicles, getVehicleName]);

  const employeeTransactions = useMemo(() => {
    if (!employee) return [];

    const normalizedEmployeeName = (employee.fullName || "")
      .trim()
      .toLowerCase();

    return allTransactions
      .filter((transaction) => {
        if (Number(transaction.employeeId) === employeeId) {
          return true;
        }

        if (!transaction.employeeId && normalizedEmployeeName) {
          const candidateName = (
            transaction.employeeName ||
            transaction.driverName ||
            transaction.userName ||
            ""
          )
            .trim()
            .toLowerCase();
          return candidateName === normalizedEmployeeName;
        }

        return false;
      })
      .map((transaction) => ({
        ...transaction,
        vehicleLabel: getVehicleName(transaction.vehicleId, transaction.vehicleName),
        siteLabel:
          transaction.siteName ||
          siteMap.get(transaction.siteId) ||
          "Unknown Site",
      }))
      .sort((left, right) => {
        const leftTime = parseDate(left.dateTime)?.getTime() || 0;
        const rightTime = parseDate(right.dateTime)?.getTime() || 0;
        return rightTime - leftTime;
      });
  }, [allTransactions, employee, employeeId, getVehicleName, siteMap]);

  const consumptionRows = useMemo(() => {
    const grouped = employeeTransactions.reduce((accumulator, transaction) => {
      const dateKey = parseDate(transaction.dateTime)
        ?.toISOString()
        .split("T")[0];
      if (!dateKey) return accumulator;

      if (!accumulator[dateKey]) {
        accumulator[dateKey] = {
          id: dateKey,
          date: dateKey,
          refills: 0,
          totalVolume: 0,
          totalAmount: 0,
          totalConsumptionDelta: 0,
          averageEfficiencyAccumulator: 0,
          efficiencyCount: 0,
        };
      }

      const row = accumulator[dateKey];
      row.refills += 1;
      row.totalVolume += toSafeNumber(transaction.volume);
      row.totalAmount += toSafeNumber(transaction.amount);
      row.totalConsumptionDelta += toSafeNumber(
        transaction.consumptionSinceLastRefuel
      );

      if (transaction.fuelEfficiency !== null && transaction.fuelEfficiency !== undefined) {
        row.averageEfficiencyAccumulator += toSafeNumber(transaction.fuelEfficiency);
        row.efficiencyCount += 1;
      }

      return accumulator;
    }, {});

    return Object.values(grouped)
      .map((row) => ({
        ...row,
        averageEfficiency:
          row.efficiencyCount > 0
            ? row.averageEfficiencyAccumulator / row.efficiencyCount
            : 0,
      }))
      .sort((left, right) => new Date(right.date) - new Date(left.date));
  }, [employeeTransactions]);

  const vehicleChangeRows = useMemo(() => {
    const chronological = [...employeeTransactions]
      .filter((transaction) => transaction.vehicleId)
      .sort((left, right) => {
        const leftTime = parseDate(left.dateTime)?.getTime() || 0;
        const rightTime = parseDate(right.dateTime)?.getTime() || 0;
        return leftTime - rightTime;
      });

    const rows = [];

    if (chronological.length > 0) {
      rows.push({
        id: "initial",
        changedAt: chronological[0].dateTime,
        fromVehicleName: "-",
        toVehicleName: getVehicleName(
          chronological[0].vehicleId,
          chronological[0].vehicleName
        ),
        source: "First recorded fueling",
        reference: chronological[0].transaction || "-",
      });
    }

    for (let index = 1; index < chronological.length; index += 1) {
      const previousTransaction = chronological[index - 1];
      const currentTransaction = chronological[index];

      if (previousTransaction.vehicleId !== currentTransaction.vehicleId) {
        rows.push({
          id: `change-${index}-${currentTransaction.transaction || index}`,
          changedAt: currentTransaction.dateTime,
          fromVehicleName: getVehicleName(
            previousTransaction.vehicleId,
            previousTransaction.vehicleName
          ),
          toVehicleName: getVehicleName(
            currentTransaction.vehicleId,
            currentTransaction.vehicleName
          ),
          source: "Fueling transaction sequence",
          reference: currentTransaction.transaction || "-",
        });
      }
    }

    if (!rows.length && assignedVehicleRows.length > 0) {
      assignedVehicleRows.forEach((assignedVehicle, index) => {
        rows.push({
          id: `assigned-${assignedVehicle.vehicleId}-${index}`,
          changedAt: employee?.dateModified || employee?.dateCreated || null,
          fromVehicleName: "-",
          toVehicleName: assignedVehicle.vehicleName,
          source: "Current employee assignment",
          reference: "-",
        });
      });
    }

    return rows.sort((left, right) => {
      const leftTime = parseDate(left.changedAt)?.getTime() || 0;
      const rightTime = parseDate(right.changedAt)?.getTime() || 0;
      return rightTime - leftTime;
    });
  }, [assignedVehicleRows, employee?.dateCreated, employee?.dateModified, employeeTransactions, getVehicleName]);

  const totalStats = useMemo(() => {
    const totalVolume = employeeTransactions.reduce(
      (accumulator, transaction) => accumulator + toSafeNumber(transaction.volume),
      0
    );
    const totalAmount = employeeTransactions.reduce(
      (accumulator, transaction) => accumulator + toSafeNumber(transaction.amount),
      0
    );

    return {
      totalTransactions: employeeTransactions.length,
      totalVolume,
      totalAmount,
      totalVehicleChanges: vehicleChangeRows.length,
    };
  }, [employeeTransactions, vehicleChangeRows.length]);

  const canEditEmployee = permissions.includes("_Edit_Employee");
  const canDeleteEmployee = permissions.includes("_Delete_Employee");

  const handleEditEmployee = useCallback(() => {
    if (!canEditEmployee) {
      notify("You do not have permission to edit employee information.", "warning", 3000);
      return;
    }

    setEditFormData(toEditFormData(employee));
    setShowEditPopup(true);
  }, [canEditEmployee, employee]);

  const handleSaveEmployeeChanges = useCallback(async () => {
    if (!canEditEmployee) {
      notify("You do not have permission to edit employee information.", "warning", 3000);
      return;
    }

    if (!editFormData.fullName?.trim()) {
      notify("Employee name is required.", "warning", 2500);
      return;
    }

    setSavingEmployeeChanges(true);
    try {
      const updatePayload = {
        ...employee,
        ...editFormData,
        id: employeeId,
        fullName: editFormData.fullName.trim().toUpperCase(),
        siteId: editFormData.siteId || null,
        vehicles: Array.isArray(editFormData.vehicles) ? editFormData.vehicles : [],
      };

      const response = await dispatch(updateEmployee(employeeId, updatePayload));
      const success = response?.success || response?.Success;

      if (!success) {
        throw new Error(response?.message || response?.Message || "Failed to update employee.");
      }

      notify("Employee information updated successfully.", "success", 3000);
      setShowEditPopup(false);
      await loadEmployee();
    } catch (error) {
      notify(error.message || "Failed to update employee.", "error", 3000);
    } finally {
      setSavingEmployeeChanges(false);
    }
  }, [canEditEmployee, dispatch, editFormData, employee, employeeId, loadEmployee]);

  const handleDeleteEmployee = useCallback(async () => {
    if (!canDeleteEmployee) {
      notify("You do not have permission to delete employees.", "warning", 3000);
      return;
    }

    const confirmed = window.confirm(
      `Are you sure you want to delete ${employee?.fullName || "this employee"}? This action cannot be undone.`
    );

    if (!confirmed) {
      return;
    }

    setDeletingEmployee(true);
    try {
      const response = await dispatch(deleteEmployee(employeeId));
      const success = response?.success || response?.Success;

      if (!success) {
        throw new Error(response?.message || response?.Message || "Failed to delete employee.");
      }

      notify("Employee deleted successfully.", "success", 3000);
      navigate("/employees/list");
    } catch (error) {
      notify(error.message || "Failed to delete employee.", "error", 3000);
    } finally {
      setDeletingEmployee(false);
    }
  }, [canDeleteEmployee, dispatch, employee?.fullName, employeeId, navigate]);

  if (loadingEmployee) {
    return (
      <div className="tw-h-[360px] tw-flex tw-items-center tw-justify-center">
        <LoadIndicator visible={true} width="34px" height="34px" />
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-xl tw-p-6 tw-text-center">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
          Employee not found
        </h3>
        <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
          The requested employee record could not be loaded.
        </p>
        <div className="tw-mt-4">
          <Button
            text="Back to Employee List"
            icon="fa-light fa-arrow-left"
            type="default"
            stylingMode="contained"
            onClick={() => navigate("/employees/list")}
          />
        </div>
      </div>
    );
  }

  const statusLower = (employee.employeestatus || "").toLowerCase();
  const statusClasses =
    statusLower === "active"
      ? "tw-bg-emerald-100 tw-text-emerald-800"
      : "tw-bg-rose-100 tw-text-rose-800";

  return (
    <div className="employee-details-page tw-space-y-4">
      <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
        <div className="tw-flex tw-flex-wrap tw-justify-between tw-gap-3">
          <div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">
                {employee.fullName}
              </h2>
              <span
                className={`tw-inline-flex tw-items-center tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-semibold ${statusClasses}`}
              >
                {employee.employeestatus || "Unknown"}
              </span>
            </div>
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
              Work No: {employee.employeeWorkNo || "-"} | Phone:{" "}
              {employee.employeephoneNumber || "-"} | Site:{" "}
              {siteMap.get(employee.siteId) || "Unassigned"}
            </p>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Created:{" "}
              {parseDate(employee.dateCreated)
                ? new Date(employee.dateCreated).toLocaleString()
                : "-"}{" "}
              | Updated:{" "}
              {parseDate(employee.dateModified)
                ? new Date(employee.dateModified).toLocaleString()
                : "-"}
            </p>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-2">
            <div className="user-details__action-buttons employee-details-page__action-group">
              <Button
                text="Edit Employee"
                icon="fa-light fa-pen-to-square"
                type="default"
                stylingMode="outlined"
                className="user-details__action-btn--first"
                disabled={!canEditEmployee || savingEmployeeChanges || deletingEmployee}
                onClick={handleEditEmployee}
              />
              <Button
                text="Delete Employee"
                icon="fa-light fa-trash-can"
                type="default"
                stylingMode="outlined"
                className="user-details__action-btn--last employee-details-page__delete-btn"
                disabled={!canDeleteEmployee || deletingEmployee || savingEmployeeChanges}
                onClick={handleDeleteEmployee}
              />
            </div>
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                From
              </label>
              <input
                type="date"
                value={fromDate}
                onChange={(event) => setFromDate(event.target.value)}
                className="tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
              />
            </div>
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                To
              </label>
              <input
                type="date"
                value={toDate}
                onChange={(event) => setToDate(event.target.value)}
                className="tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
              />
            </div>
            <Button
              text="Refresh"
              icon="fa-light fa-rotate"
              type="default"
              stylingMode="contained"
              disabled={deletingEmployee}
              onClick={loadTransactions}
            />
            <Button
              text="Back"
              icon="fa-light fa-arrow-left"
              type="normal"
              stylingMode="outlined"
              disabled={deletingEmployee}
              onClick={() => navigate("/employees/list")}
            />
          </div>
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-3">
        <div className="tw-bg-orange-50 tw-border tw-border-orange-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-orange-700">
            Transactions
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totalStats.totalTransactions}
          </h3>
        </div>
        <div className="tw-bg-blue-50 tw-border tw-border-blue-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-blue-700">
            Volume (L)
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totalStats.totalVolume.toFixed(2)}
          </h3>
        </div>
        <div className="tw-bg-violet-50 tw-border tw-border-violet-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-violet-700">
            Amount
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totalStats.totalAmount.toFixed(2)}
          </h3>
        </div>
        <div className="tw-bg-emerald-50 tw-border tw-border-emerald-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-emerald-700">
            Vehicle Changes
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totalStats.totalVehicleChanges}
          </h3>
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-200 tw-overflow-hidden">
        <div className="tw-px-4 tw-pt-4 tw-bg-white tw-border-b tw-border-gray-200">
          <Tabs
            dataSource={tabItems}
            selectedIndex={selectedTab}
            onItemClick={(event) => setSelectedTab(event.itemIndex)}
            itemRender={(item) => (
              <div className="tw-flex tw-items-center tw-gap-2">
                <i className={item.icon}></i>
                <span>{item.text}</span>
              </div>
            )}
          />
        </div>

        <div className="tw-p-4">
          {loadingTransactions ? (
            <div className="tw-h-56 tw-flex tw-items-center tw-justify-center">
              <LoadIndicator visible={true} width="30px" height="30px" />
            </div>
          ) : (
            <>
              {selectedTab === 0 && (
                <DataGrid
                  dataSource={consumptionRows}
                  showBorders={true}
                  rowAlternationEnabled={true}
                  columnAutoWidth={true}
                  keyExpr="id"
                >
                  <SearchPanel visible={false} />
                  <FilterRow visible={true} />
                  <HeaderFilter visible={true} />
                  <Paging defaultPageSize={12} />
                  <Pager
                    visible={true}
                    showNavigationButtons={true}
                    showInfo={true}
                    showPageSizeSelector={true}
                    allowedPageSizes={[10, 12, 25, 50]}
                  />

                  <Column dataField="date" caption="Date" dataType="date" />
                  <Column
                    dataField="refills"
                    caption="Refills"
                    alignment="right"
                    minWidth={110}
                  />
                  <Column
                    dataField="totalVolume"
                    caption="Volume (L)"
                    dataType="number"
                    format="fixedPoint"
                    alignment="right"
                  />
                  <Column
                    dataField="totalAmount"
                    caption="Amount"
                    dataType="number"
                    format="fixedPoint"
                    alignment="right"
                  />
                  <Column
                    dataField="totalConsumptionDelta"
                    caption="Distance/Hours"
                    dataType="number"
                    format="fixedPoint"
                    alignment="right"
                  />
                  <Column
                    dataField="averageEfficiency"
                    caption="Avg Efficiency"
                    dataType="number"
                    format="fixedPoint"
                    alignment="right"
                  />
                </DataGrid>
              )}

              {selectedTab === 1 && (
                <DataGrid
                  dataSource={employeeTransactions}
                  showBorders={true}
                  rowAlternationEnabled={true}
                  columnAutoWidth={true}
                >
                  <SearchPanel visible={true} width={260} />
                  <FilterRow visible={true} />
                  <HeaderFilter visible={true} />
                  <Paging defaultPageSize={12} />
                  <Pager
                    visible={true}
                    showNavigationButtons={true}
                    showInfo={true}
                    showPageSizeSelector={true}
                    allowedPageSizes={[10, 12, 25, 50]}
                  />

                  <Column
                    dataField="dateTime"
                    caption="Date/Time"
                    dataType="datetime"
                    format="dd/MM/yyyy HH:mm"
                    minWidth={160}
                  />
                  <Column dataField="vehicleLabel" caption="Vehicle" minWidth={150} />
                  <Column dataField="siteLabel" caption="Site" minWidth={130} />
                  <Column
                    dataField="volume"
                    caption="Volume (L)"
                    dataType="number"
                    format="fixedPoint"
                    alignment="right"
                  />
                  <Column
                    dataField="amount"
                    caption="Amount"
                    dataType="number"
                    format="fixedPoint"
                    alignment="right"
                  />
                  <Column
                    dataField="odometer"
                    caption="Odometer"
                    dataType="number"
                    format="fixedPoint"
                    alignment="right"
                  />
                  <Column dataField="fuelGradeName" caption="Fuel Grade" minWidth={120} />
                  <Column dataField="ptsName" caption="PTS Device" minWidth={120} />
                  <Column
                    dataField="transaction"
                    caption="Txn"
                    alignment="right"
                    minWidth={90}
                  />
                </DataGrid>
              )}

              {selectedTab === 2 && (
                <DataGrid
                  dataSource={vehicleChangeRows}
                  showBorders={true}
                  rowAlternationEnabled={true}
                  columnAutoWidth={true}
                  keyExpr="id"
                >
                  <SearchPanel visible={false} />
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

                  <Column
                    dataField="changedAt"
                    caption="Changed At"
                    dataType="datetime"
                    format="dd/MM/yyyy HH:mm"
                    minWidth={170}
                  />
                  <Column
                    dataField="fromVehicleName"
                    caption="From Vehicle"
                    minWidth={170}
                  />
                  <Column
                    dataField="toVehicleName"
                    caption="To Vehicle"
                    minWidth={170}
                  />
                  <Column dataField="source" caption="Source" minWidth={180} />
                  <Column dataField="reference" caption="Reference" minWidth={110} />
                </DataGrid>
              )}
            </>
          )}
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
          Current Assigned Vehicles
        </h3>
        {assignedVehicleRows.length > 0 ? (
          <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-2">
            {assignedVehicleRows.map((assignedVehicle) => (
              <div
                key={assignedVehicle.vehicleId}
                className="tw-bg-orange-50 tw-border tw-border-orange-100 tw-rounded-lg tw-p-3 tw-flex tw-items-center tw-justify-between"
              >
                <span className="tw-font-medium tw-text-gray-800">
                  {assignedVehicle.vehicleName}
                </span>
                <span className="tw-text-xs tw-text-gray-500">
                  ID: {assignedVehicle.vehicleId}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <div className="tw-text-sm tw-text-gray-500">
            No default vehicles currently assigned to this employee.
          </div>
        )}
      </div>

      <Popup
        visible={showEditPopup}
        onHiding={() => setShowEditPopup(false)}
        dragEnabled={false}
        showTitle={true}
        showCloseButton={true}
        title={`Edit Employee: ${employee.fullName}`}
        width="90%"
        maxWidth={720}
        height="auto"
        maxHeight="90vh"
      >
        <div className="tw-p-4 tw-space-y-4">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-3">
            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Full Name
              </label>
              <input
                type="text"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
                value={editFormData.fullName}
                onChange={(event) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    fullName: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Phone Number
              </label>
              <input
                type="text"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
                value={editFormData.employeephoneNumber}
                onChange={(event) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    employeephoneNumber: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Work Number
              </label>
              <input
                type="text"
                className="tw-w-full tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm"
                value={editFormData.employeeWorkNo}
                onChange={(event) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    employeeWorkNo: event.target.value,
                  }))
                }
              />
            </div>

            <div>
              <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                Status
              </label>
              <SelectBox
                dataSource={employeeStatusOptions}
                value={editFormData.employeestatus}
                onValueChanged={(event) =>
                  setEditFormData((prev) => ({
                    ...prev,
                    employeestatus: event.value || "Active",
                  }))
                }
                searchEnabled={false}
                showClearButton={false}
              />
            </div>
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Site
            </label>
            <SelectBox
              dataSource={sites}
              displayExpr="name"
              valueExpr="id"
              value={editFormData.siteId}
              onValueChanged={(event) =>
                setEditFormData((prev) => ({
                  ...prev,
                  siteId: event.value || null,
                }))
              }
              searchEnabled={true}
              showClearButton={true}
              placeholder="Select site"
            />
          </div>

          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
              Default Vehicles
            </label>
            <TagBox
              dataSource={vehicles}
              value={editFormData.vehicles}
              valueExpr="vehicleId"
              displayExpr="hyoungNo"
              searchEnabled={true}
              showSelectionControls={true}
              showClearButton={true}
              applyValueMode="useButtons"
              maxDisplayedTags={4}
              onValueChanged={(event) =>
                setEditFormData((prev) => ({
                  ...prev,
                  vehicles: event.value || [],
                }))
              }
            />
          </div>

          <div className="tw-flex tw-justify-end tw-gap-2 tw-pt-2">
            <Button
              text="Cancel"
              type="normal"
              stylingMode="outlined"
              disabled={savingEmployeeChanges}
              onClick={() => setShowEditPopup(false)}
            />
            <Button
              text={savingEmployeeChanges ? "Saving..." : "Save Changes"}
              icon="fa-light fa-floppy-disk"
              type="default"
              stylingMode="contained"
              disabled={savingEmployeeChanges}
              onClick={handleSaveEmployeeChanges}
            />
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default EmployeeDetailsPage;
