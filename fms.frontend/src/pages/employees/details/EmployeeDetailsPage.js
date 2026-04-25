/**
 * File: EmployeeDetailsPage.js
 * Purpose: Shows employee profile information with overview, consumption, refill, vehicles, document, and warning-letter tabs.
 *          Follows M365 Admin Center design system (SKILL.md).
 * Dependencies: axios instance, redux site/vehicle actions, DevExtreme DataGrid.
 * Last Modified: 2026-04-25
 *
 * Key Components:
 * - EmployeeDetailsPage(): Loads employee profile and renders tabbed history analytics.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useParams } from "react-router-dom";
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
import SlidePanel from "../../../components/ui/SlidePanel";
import EmployeeFormPanel from "../components/EmployeeFormPanel";
import EmployeeDocumentsWorkspace from "./components/EmployeeDocumentsWorkspace";
import EmployeeOverviewWorkspace from "./components/EmployeeOverviewWorkspace";
import EmployeeWarningLettersWorkspace from "./components/EmployeeWarningLettersWorkspace";
import { getVehicleConsumptionHistory } from "../../vehicles/consumption/vehicleConsumptionService";
import { getWarningLetters } from "../../vehicles/warningLetters/warningLetterService";
import "./EmployeeDetailsPage.scss";

const baseTabItems = [
  { key: "overview", label: "Overview", icon: "fa-light fa-circle-info" },
  { key: "consumption", label: "Consumption", icon: "fa-light fa-chart-column" },
  { key: "refill", label: "Fuel Refills", icon: "fa-light fa-gas-pump" },
  { key: "vehicle-change", label: "Vehicles", icon: "fa-light fa-truck" },
  { key: "documents", label: "Documents", icon: "fa-light fa-folder-open" },
  { key: "warning-letters", label: "Warning Letters", icon: "fa-light fa-triangle-exclamation" },
];

const getAvailableTabItems = (canReadWarningLetters) =>
  baseTabItems.filter(
    (tab) => tab.key !== "warning-letters" || canReadWarningLetters
  );

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

const TAB_KEYS = baseTabItems.map((tab) => tab.key);

const formatNumber = (value, fractionDigits = 2) => {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return "0";
  return new Intl.NumberFormat(undefined, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(safe);
};

const formatInt = (value) => {
  const safe = Number(value);
  if (!Number.isFinite(safe)) return "0";
  return new Intl.NumberFormat().format(Math.trunc(safe));
};

const EmployeeDetailsPage = () => {
  const { id, tab: tabParam } = useParams();
  const employeeId = Number(id);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const sites = useSelector((state) => state.site?.sites || []);
  const permissions = useSelector((state) => state.permission?.permissions || []);
  const user = useSelector((state) => state.auth?.user);
  const canReadWarningLetters = permissions.includes("_Read_WarningLetter");

  const [employee, setEmployee] = useState(null);
  const [allTransactions, setAllTransactions] = useState([]);
  const [loadingEmployee, setLoadingEmployee] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [vehicleConsumptionRows, setVehicleConsumptionRows] = useState([]);
  const [warningLetterCount, setWarningLetterCount] = useState(0);
  const [selectedTab, setSelectedTab] = useState(() => {
    if (tabParam && TAB_KEYS.includes(tabParam)) return tabParam;
    const queryTab = new URLSearchParams(window.location.search).get("tab");
    return TAB_KEYS.includes(queryTab) ? queryTab : "overview";
  });
  const [fromDate, setFromDate] = useState(
    toDateInputValue(new Date(Date.now() - 90 * 24 * 60 * 60 * 1000))
  );
  const [toDate, setToDate] = useState(toDateInputValue(new Date()));
  const [showEditPanel, setShowEditPanel] = useState(false);
  const [savingEmployeeChanges, setSavingEmployeeChanges] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);

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

  // URL â†’ state: react to slug changes from router only.
  // No reverse activeTabâ†’URL effect (Firefox replaceState SecurityError lesson).
  useEffect(() => {
    const availableTabs = getAvailableTabItems(
      permissions.includes("_Read_WarningLetter")
    );
    if (tabParam && availableTabs.some((tab) => tab.key === tabParam)) {
      setSelectedTab(tabParam);
      return;
    }
    if (tabParam && !availableTabs.some((tab) => tab.key === tabParam)) {
      // Unknown / not-permitted slug — fall back to overview and rewrite URL.
      setSelectedTab("overview");
      navigate(`/employees/${employeeId}/details/overview`, { replace: true });
    }
  }, [tabParam, permissions, employeeId, navigate]);

  const handleTabChange = useCallback(
    (nextTab) => {
      if (!TAB_KEYS.includes(nextTab)) return;
      setSelectedTab(nextTab);
      navigate(`/employees/${employeeId}/details/${nextTab}`, { replace: true });
    },
    [employeeId, navigate]
  );

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

  const employeeVehicleIds = useMemo(() => {
    const ids = new Set();
    assignedVehicleRows.forEach((row) => {
      if (row.vehicleId) ids.add(Number(row.vehicleId));
    });
    employeeTransactions.forEach((transaction) => {
      if (transaction.vehicleId) ids.add(Number(transaction.vehicleId));
    });
    return Array.from(ids).filter((vehicleId) => Number.isFinite(vehicleId) && vehicleId > 0);
  }, [assignedVehicleRows, employeeTransactions]);

  useEffect(() => {
    let isMounted = true;

    const loadVehicleConsumptionRows = async () => {
      if (!employeeVehicleIds.length || !fromDate || !toDate) {
        setVehicleConsumptionRows([]);
        return;
      }

      try {
        const results = await Promise.all(
          employeeVehicleIds.map((vehicleId) =>
            getVehicleConsumptionHistory(vehicleId, toDate, 500, fromDate)
          )
        );

        if (!isMounted) return;
        const normalizedEmployeeName = (employee?.fullName || "").trim().toLowerCase();
        const flattened = results.flat().filter((row) => {
          const rowEmployeeName = (row.employeeName || "").trim().toLowerCase();
          return !rowEmployeeName || !normalizedEmployeeName || rowEmployeeName === normalizedEmployeeName;
        });
        setVehicleConsumptionRows(flattened);
      } catch (error) {
        if (isMounted) setVehicleConsumptionRows([]);
      }
    };

    loadVehicleConsumptionRows();

    return () => {
      isMounted = false;
    };
  }, [employee?.fullName, employeeVehicleIds, fromDate, toDate]);

  useEffect(() => {
    let isMounted = true;

    const loadWarningLetterCount = async () => {
      if (!employeeId || !canReadWarningLetters) {
        setWarningLetterCount(0);
        return;
      }

      try {
        const letters = await getWarningLetters({ employeeId: String(employeeId) });
        if (isMounted) setWarningLetterCount(Array.isArray(letters) ? letters.length : 0);
      } catch (error) {
        if (isMounted) setWarningLetterCount(0);
      }
    };

    loadWarningLetterCount();

    return () => {
      isMounted = false;
    };
  }, [canReadWarningLetters, employeeId]);

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
    const totalFuelLost = vehicleConsumptionRows.reduce(
      (accumulator, row) => accumulator + toSafeNumber(row.fuelLost),
      0
    );

    return {
      totalTransactions: employeeTransactions.length,
      totalVolume,
      totalFuelLost,
      totalVehicleChanges: vehicleChangeRows.length,
    };
  }, [employeeTransactions, vehicleChangeRows.length, vehicleConsumptionRows]);

  const canEditEmployee = permissions.includes("_Edit_Employee");
  const canDeleteEmployee = permissions.includes("_Delete_Employee");
  const tabItems = useMemo(
    () => getAvailableTabItems(canReadWarningLetters),
    [canReadWarningLetters]
  );

  const handleEditEmployee = useCallback(() => {
    if (!canEditEmployee) {
      notify("You do not have permission to edit employee information.", "warning", 3000);
      return;
    }

    setShowEditPanel(true);
  }, [canEditEmployee, employee]);

  const handleSaveEmployeeChanges = useCallback(async (formData) => {
    if (!canEditEmployee) {
      notify("You do not have permission to edit employee information.", "warning", 3000);
      return;
    }

    setSavingEmployeeChanges(true);
    try {
      const updatePayload = {
        ...employee,
        ...formData,
        id: employeeId,
        fullName: (formData?.fullName || "").trim().toUpperCase(),
        position: (formData?.position || "").trim(),
        siteId: formData?.siteId || null,
        vehicles: Array.isArray(formData?.vehicles) ? formData.vehicles : [],
      };

      const response = await dispatch(updateEmployee(employeeId, updatePayload));
      const success = response?.success || response?.Success;

      if (!success) {
        throw new Error(response?.message || response?.Message || "Failed to update employee.");
      }

      notify("Employee information updated successfully.", "success", 3000);
      setEmployee(updatePayload);
      setShowEditPanel(false);
      await loadEmployee();
    } catch (error) {
      notify(error.message || "Failed to update employee.", "error", 3000);
    } finally {
      setSavingEmployeeChanges(false);
    }
  }, [canEditEmployee, dispatch, employee, employeeId, loadEmployee]);

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

  const currentTab = tabItems.find((tab) => tab.key === selectedTab);
  const showTabLoader =
    selectedTab !== "overview" &&
    selectedTab !== "documents" &&
    selectedTab !== "warning-letters" &&
    loadingTransactions;

  // Derive initials from full name (max 2 chars).
  const initials = (employee.fullName || "?")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("") || "?";

  const subLineParts = [
    employee.position,
    employee.employeeWorkNo,
    siteMap.get(employee.siteId),
    employee.employeephoneNumber,
  ].filter(Boolean);

  return (
    <div className="employee-details-module">

      {/* Breadcrumb */}
      <nav className="employee-details-module__breadcrumb" aria-label="Breadcrumb">
        <button
          type="button"
          className="employee-details-module__breadcrumb-link"
          onClick={() => navigate("/employees/list")}
        >
          Employees
        </button>
        <i className="fa-light fa-chevron-right employee-details-module__breadcrumb-sep" />
        <span className="employee-details-module__breadcrumb-current">{employee.fullName}</span>
      </nav>

      {/* Flat profile header */}
      <header className="employee-details-module__profile">
        <div className="employee-details-module__profile-main">
          <div className="employee-details-module__profile-left">
            <div className="employee-details-module__avatar" aria-hidden="true">{initials}</div>
            <div className="employee-details-module__identity">
              <div className="employee-details-module__name-row">
                <h2 className="employee-details-module__name">{employee.fullName}</h2>
                <span className={`employee-details-module__status employee-details-module__status--${statusTone}`}>
                  <span className="employee-details-module__status-dot" />
                  {employee.employeestatus || "Unknown"}
                </span>
              </div>
              {subLineParts.length > 0 && (
                <div className="employee-details-module__sub">
                  {subLineParts.map((part, index) => (
                    <React.Fragment key={`${part}-${index}`}>
                      <span>{part}</span>
                      {index < subLineParts.length - 1 && (
                        <span className="employee-details-module__sub-dot" aria-hidden="true">·</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="employee-details-module__profile-actions">
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={loadTransactions}
            disabled={loadingTransactions || deletingEmployee}
          >
            <i className="fa-light fa-rotate" /> Refresh
          </button>
          {canEditEmployee && (
            <button
              type="button"
              className="m365-btn m365-btn--primary"
              onClick={handleEditEmployee}
              disabled={savingEmployeeChanges || deletingEmployee}
            >
              <i className="fa-light fa-pen-to-square" /> Edit
            </button>
          )}
          {canDeleteEmployee && (
            <button
              type="button"
              className="m365-btn m365-btn--ghost employee-details-module__profile-action--danger"
              onClick={handleDeleteEmployee}
              disabled={deletingEmployee || savingEmployeeChanges}
              title="Delete employee"
            >
              <i className="fa-light fa-trash-can" /> Delete
            </button>
          )}
        </div>
      </header>

      {/* Underline tabs with count badges */}
      <div className="employee-details-module__tabs" role="tablist">
        {tabItems.map((tab) => {
          const isActive = selectedTab === tab.key;
          let badge = null;
          if (tab.key === "vehicle-change" && assignedVehicleRows.length > 0) {
            badge = assignedVehicleRows.length;
          } else if (tab.key === "warning-letters" && warningLetterCount > 0) {
            badge = warningLetterCount;
          }
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              className={`employee-details-module__tab${isActive ? " employee-details-module__tab--active" : ""}`}
              onClick={() => handleTabChange(tab.key)}
            >
              <span>{tab.label}</span>
              {badge !== null && (
                <span className="employee-details-module__tab-badge">{badge}</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Date range filter (data tabs only) */}
      {selectedTab !== "overview" &&
        selectedTab !== "documents" &&
        selectedTab !== "warning-letters" && (
          <div className="employee-details-module__filter-bar">
            <span className="employee-details-module__filter-label">
              <i className="fa-light fa-calendar-range" /> Date range
            </span>
            <input
              type="date"
              className="m365-input employee-details-module__filter-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
            <span className="employee-details-module__filter-sep">to</span>
            <input
              type="date"
              className="m365-input employee-details-module__filter-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
        )}

      <div className="employee-details-module__panel-body">
        {showTabLoader ? (
          <div className="employee-details-module__tab-loading">
            <LoadIndicator height={18} width={18} />
            <span>Loading {currentTab?.label?.toLowerCase() || "data"}...</span>
          </div>
        ) : (
          <>
            {selectedTab === "overview" && (
              <EmployeeOverviewWorkspace
                employee={employee}
                siteName={siteMap.get(employee.siteId) || ""}
                assignedVehicles={assignedVehicleRows}
                totalStats={totalStats}
                recentTransactions={employeeTransactions}
                onChangeTab={handleTabChange}
              />
            )}

            {selectedTab === "consumption" && (
              <DataGrid
                className="employee-details-module__grid"
                dataSource={consumptionRows}
                height={700}
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
                className="employee-details-module__grid"
                dataSource={employeeTransactions}
                height={700}
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
                className="employee-details-module__grid"
                dataSource={vehicleChangeRows}
                height={700}
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

            {selectedTab === "documents" && (
              <EmployeeDocumentsWorkspace employeeId={employeeId} employee={employee} />
            )}

            {selectedTab === "warning-letters" && canReadWarningLetters && (
              <EmployeeWarningLettersWorkspace
                employeeId={employeeId}
                employee={employee}
                onCountChange={setWarningLetterCount}
              />
            )}
          </>
        )}
      </div>

      <SlidePanel
        open={showEditPanel}
        onClose={() => setShowEditPanel(false)}
        title={`Quick Edit Employee: ${employee.fullName}`}
        width={900}
      >
        <EmployeeFormPanel
          mode="edit"
          employee={employee}
          sites={sites}
          saving={savingEmployeeChanges}
          hideSectionBorders={true}
          onSubmit={handleSaveEmployeeChanges}
          onClose={() => setShowEditPanel(false)}
        />
      </SlidePanel>
    </div>
  );
};

export default EmployeeDetailsPage;
