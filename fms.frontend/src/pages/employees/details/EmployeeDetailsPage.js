/**
 * File: EmployeeDetailsPage.js
 * Purpose: Shows employee profile information with consumption, refill, and vehicle-change history tabs.
 *          Follows M365 Admin Center design system (SKILL.md).
 * Dependencies: axios instance, redux site/vehicle actions, DevExtreme DataGrid.
 * Last Modified: 2026-03-02
 *
 * Key Components:
 * - EmployeeDetailsPage(): Loads employee profile and renders tabbed history analytics.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
import Popup from "devextreme-react/popup";
import TagBox from "devextreme-react/tag-box";
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

const TAB_ITEMS = [
  { key: "consumption", label: "Consumption History", icon: "fa-light fa-chart-column" },
  { key: "refill", label: "Fuel Refill History", icon: "fa-light fa-gas-pump" },
  { key: "vehicle-change", label: "Vehicle Change History", icon: "fa-light fa-right-left" },
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
  const [selectedTab, setSelectedTab] = useState("consumption");
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
      <div className="m365-empty">
        <i className="fa-light fa-spinner fa-spin m365-empty__icon" />
        <p className="m365-empty__text">Loading employee details...</p>
      </div>
    );
  }

  if (!employee) {
    return (
      <div className="m365-empty">
        <i className="fa-light fa-circle-question m365-empty__icon" />
        <p className="m365-empty__text">Employee not found</p>
        <button className="m365-btn m365-btn--ghost" onClick={() => navigate("/employees/list")}>
          <i className="fa-light fa-arrow-left" /> Back to Employee List
        </button>
      </div>
    );
  }

  const statusTone =
    (employee.employeestatus || "").toLowerCase() === "active" ? "success" : "warning";

  return (
    <div className="employee-details-page">

      {/* ── Profile Header Card ── */}
      <div className="edp-header-card">
        <div className="edp-header-card__top">
          <div className="edp-header-card__profile">
            <div className="m365-detail-header__icon-circle"
                 style={{ background: '#fff4ce', color: '#ca5010' }}>
              <i className="fa-light fa-user-hard-hat" />
            </div>
            <div>
              <h2 className="edp-header-card__name">{employee.fullName}</h2>
              <div className="edp-header-card__meta">
                <span className={`m365-badge m365-badge--${statusTone}`}>
                  {employee.employeestatus || "Unknown"}
                </span>
                <span>Work No: {employee.employeeWorkNo || "-"}</span>
                <span>Phone: {employee.employeephoneNumber || "-"}</span>
                <span>Site: {siteMap.get(employee.siteId) || "Unassigned"}</span>
              </div>
            </div>
          </div>

          <div className="edp-header-card__actions">
            <button className="m365-btn m365-btn--ghost"
                    onClick={() => navigate("/employees/list")}>
              <i className="fa-light fa-arrow-left" /> Back
            </button>
            <button className="m365-btn m365-btn--ghost"
                    onClick={loadTransactions}
                    disabled={deletingEmployee}>
              <i className="fa-light fa-rotate" /> Refresh
            </button>
            {canEditEmployee && (
              <button className="m365-btn m365-btn--ghost"
                      onClick={handleEditEmployee}
                      disabled={savingEmployeeChanges || deletingEmployee}>
                <i className="fa-light fa-pen-to-square" /> Edit
              </button>
            )}
            {canDeleteEmployee && (
              <button className="m365-btn m365-btn--ghost"
                      onClick={handleDeleteEmployee}
                      disabled={deletingEmployee || savingEmployeeChanges}
                      style={{ color: 'var(--m365-error)' }}>
                <i className="fa-light fa-trash-can" /> Delete
              </button>
            )}
          </div>
        </div>

        {/* ── Date Filters ── */}
        <div className="edp-header-card__filters">
          <div className="m365-field" style={{ marginBottom: 0 }}>
            <label className="m365-field__label">From</label>
            <input type="date" className="m365-input"
                   value={fromDate}
                   onChange={(e) => setFromDate(e.target.value)} />
          </div>
          <div className="m365-field" style={{ marginBottom: 0 }}>
            <label className="m365-field__label">To</label>
            <input type="date" className="m365-input"
                   value={toDate}
                   onChange={(e) => setToDate(e.target.value)} />
          </div>
        </div>
      </div>

      {/* ── Stats Row ── */}
      <div className="m365-stats-row edp-stats">
        <div className="m365-stat-item">
          <span className="m365-stat-item__value">{totalStats.totalTransactions}</span>
          <span className="m365-stat-item__label">Transactions</span>
        </div>
        <div className="m365-stat-item">
          <span className="m365-stat-item__value">{totalStats.totalVolume.toFixed(1)}</span>
          <span className="m365-stat-item__label">Volume (L)</span>
        </div>
        <div className="m365-stat-item">
          <span className="m365-stat-item__value">{totalStats.totalAmount.toFixed(1)}</span>
          <span className="m365-stat-item__label">Amount</span>
        </div>
        <div className="m365-stat-item">
          <span className="m365-stat-item__value">{totalStats.totalVehicleChanges}</span>
          <span className="m365-stat-item__label">Vehicle Changes</span>
        </div>
      </div>

      {/* ── M365 Tabs ── */}
      <div className="edp-tabbed-card">
        <div className="m365-tabs">
          {TAB_ITEMS.map((tab) => (
            <button
              key={tab.key}
              className={`m365-tab${selectedTab === tab.key ? " m365-tab--active" : ""}`}
              onClick={() => setSelectedTab(tab.key)}
            >
              <i className={tab.icon} />
              {tab.label}
            </button>
          ))}
        </div>

        <div className="edp-tabbed-card__body">
          {loadingTransactions ? (
            <div className="m365-empty">
              <i className="fa-light fa-spinner fa-spin m365-empty__icon" />
              <p className="m365-empty__text">Loading transactions...</p>
            </div>
          ) : (
            <>
              {selectedTab === "consumption" && (
                <DataGrid
                  className="edp-grid"
                  dataSource={consumptionRows}
                  showBorders={false}
                  showColumnLines={false}
                  showRowLines={true}
                  rowAlternationEnabled={false}
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
                  <Column dataField="refills" caption="Refills" alignment="right" minWidth={110} />
                  <Column dataField="totalVolume" caption="Volume (L)" dataType="number" format="fixedPoint" alignment="right" />
                  <Column dataField="totalAmount" caption="Amount" dataType="number" format="fixedPoint" alignment="right" />
                  <Column dataField="totalConsumptionDelta" caption="Distance/Hours" dataType="number" format="fixedPoint" alignment="right" />
                  <Column dataField="averageEfficiency" caption="Avg Efficiency" dataType="number" format="fixedPoint" alignment="right" />
                </DataGrid>
              )}

              {selectedTab === "refill" && (
                <DataGrid
                  className="edp-grid"
                  dataSource={employeeTransactions}
                  showBorders={false}
                  showColumnLines={false}
                  showRowLines={true}
                  rowAlternationEnabled={false}
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

                  <Column dataField="dateTime" caption="Date/Time" dataType="datetime" format="dd/MM/yyyy HH:mm" minWidth={160} />
                  <Column dataField="vehicleLabel" caption="Vehicle" minWidth={150} />
                  <Column dataField="siteLabel" caption="Site" minWidth={130} />
                  <Column dataField="volume" caption="Volume (L)" dataType="number" format="fixedPoint" alignment="right" />
                  <Column dataField="amount" caption="Amount" dataType="number" format="fixedPoint" alignment="right" />
                  <Column dataField="odometer" caption="Odometer" dataType="number" format="fixedPoint" alignment="right" />
                  <Column dataField="fuelGradeName" caption="Fuel Grade" minWidth={120} />
                  <Column dataField="ptsName" caption="PTS Device" minWidth={120} />
                  <Column dataField="transaction" caption="Txn" alignment="right" minWidth={90} />
                </DataGrid>
              )}

              {selectedTab === "vehicle-change" && (
                <DataGrid
                  className="edp-grid"
                  dataSource={vehicleChangeRows}
                  showBorders={false}
                  showColumnLines={false}
                  showRowLines={true}
                  rowAlternationEnabled={false}
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

                  <Column dataField="changedAt" caption="Changed At" dataType="datetime" format="dd/MM/yyyy HH:mm" minWidth={170} />
                  <Column dataField="fromVehicleName" caption="From Vehicle" minWidth={170} />
                  <Column dataField="toVehicleName" caption="To Vehicle" minWidth={170} />
                  <Column dataField="source" caption="Source" minWidth={180} />
                  <Column dataField="reference" caption="Reference" minWidth={110} />
                </DataGrid>
              )}
            </>
          )}
        </div>
      </div>

      {/* ── Assigned Vehicles ── */}
      <div className="edp-section-card">
        <h3 className="m365-flat-section__title">
          <i className="fa-light fa-truck" /> Current Assigned Vehicles
        </h3>
        {assignedVehicleRows.length > 0 ? (
          <div className="employee-vehicle-tags">
            {assignedVehicleRows.map((assignedVehicle) => (
              <span key={assignedVehicle.vehicleId} className="employee-vehicle-tag">
                {assignedVehicle.vehicleName}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: 13, color: 'var(--m365-text-tertiary)', margin: 0 }}>
            No default vehicles currently assigned to this employee.
          </p>
        )}
      </div>

      {/* ── Edit Popup ── */}
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
        <div style={{ padding: 20 }}>
          <div className="employee-form-grid" style={{ marginBottom: 16 }}>
            <div className="m365-field">
              <label className="m365-field__label">Full Name</label>
              <input
                type="text"
                className="m365-input"
                value={editFormData.fullName}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, fullName: e.target.value }))}
              />
            </div>
            <div className="m365-field">
              <label className="m365-field__label">Phone Number</label>
              <input
                type="text"
                className="m365-input"
                value={editFormData.employeephoneNumber}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, employeephoneNumber: e.target.value }))}
              />
            </div>
            <div className="m365-field">
              <label className="m365-field__label">Work Number</label>
              <input
                type="text"
                className="m365-input"
                value={editFormData.employeeWorkNo}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, employeeWorkNo: e.target.value }))}
              />
            </div>
            <div className="m365-field">
              <label className="m365-field__label">Status</label>
              <select
                className="m365-select"
                value={editFormData.employeestatus}
                onChange={(e) => setEditFormData((prev) => ({ ...prev, employeestatus: e.target.value || "Active" }))}
              >
                {employeeStatusOptions.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="m365-field" style={{ marginBottom: 16 }}>
            <label className="m365-field__label">Site</label>
            <select
              className="m365-select"
              value={editFormData.siteId || ""}
              onChange={(e) => setEditFormData((prev) => ({ ...prev, siteId: e.target.value ? Number(e.target.value) : null }))}
            >
              <option value="">Unassigned</option>
              {sites.map((site) => (
                <option key={site.id} value={site.id}>{site.name}</option>
              ))}
            </select>
          </div>

          <div className="m365-field" style={{ marginBottom: 16 }}>
            <label className="m365-field__label">Default Vehicles</label>
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
                setEditFormData((prev) => ({ ...prev, vehicles: event.value || [] }))
              }
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, paddingTop: 8, borderTop: '1px solid var(--m365-border-light)' }}>
            <button className="m365-btn m365-btn--ghost"
                    onClick={() => setShowEditPopup(false)}
                    disabled={savingEmployeeChanges}>
              Cancel
            </button>
            <button className="m365-btn m365-btn--primary"
                    onClick={handleSaveEmployeeChanges}
                    disabled={savingEmployeeChanges}>
              <i className="fa-light fa-floppy-disk" />
              {savingEmployeeChanges ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </div>
      </Popup>
    </div>
  );
};

export default EmployeeDetailsPage;
