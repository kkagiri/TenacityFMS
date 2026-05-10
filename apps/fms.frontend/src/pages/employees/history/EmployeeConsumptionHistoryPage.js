/**
 * File: EmployeeConsumptionHistoryPage.js
 * Purpose: Provides module-level employee fuel consumption history with summary analytics.
 * Dependencies: axios instance, redux employee loading, DevExtreme grid/button components.
 * Last Modified: 2026-02-16
 *
 * Key Components:
 * - EmployeeConsumptionHistoryPage(): Aggregates pump transactions by employee and date range.
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
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
import { fetchEmployees } from "../../../redux/actions/employeeActions";

const toDateInputValue = (date) => date.toISOString().split("T")[0];

const normalizeResponseList = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.data)) return payload.data;
  if (Array.isArray(payload?.Data)) return payload.Data;
  return [];
};

const EmployeeConsumptionHistoryPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const employees = useSelector((state) => state.employee?.employees || []);

  const [fromDate, setFromDate] = useState(
    toDateInputValue(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
  );
  const [toDate, setToDate] = useState(toDateInputValue(new Date()));
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    dispatch(fetchEmployees(false));
  }, [dispatch]);

  const loadTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/consumption/pumptransactions", {
        params: {
          startDate: new Date(`${fromDate}T00:00:00`).toISOString(),
          endDate: new Date(`${toDate}T23:59:59`).toISOString(),
          processedOnly: true,
        },
      });

      const records = normalizeResponseList(response.data);
      setTransactions(records);
    } catch (error) {
      setTransactions([]);
      notify(
        error?.response?.data?.message ||
          "Failed to load employee consumption history.",
        "error",
        3500
      );
    } finally {
      setLoading(false);
    }
  }, [fromDate, toDate]);

  useEffect(() => {
    loadTransactions();
  }, [loadTransactions]);

  const employeeMap = useMemo(() => {
    const map = new Map();
    employees.forEach((employee) => {
      map.set(employee.id, employee.fullName);
    });
    return map;
  }, [employees]);

  const summaryRows = useMemo(() => {
    const grouped = transactions.reduce((accumulator, transaction) => {
      const resolvedName =
        transaction.employeeName ||
        transaction.driverName ||
        transaction.userName ||
        (transaction.employeeId ? employeeMap.get(transaction.employeeId) : null) ||
        "Unknown Employee";
      const employeeKey =
        transaction.employeeId || `name:${resolvedName.toLowerCase()}`;

      if (!accumulator[employeeKey]) {
        accumulator[employeeKey] = {
          id: employeeKey,
          employeeId: transaction.employeeId || null,
          employeeName: resolvedName,
          transactionCount: 0,
          totalVolume: 0,
          totalAmount: 0,
          vehicles: new Set(),
          lastTransactionAt: null,
        };
      }

      const row = accumulator[employeeKey];
      row.transactionCount += 1;
      row.totalVolume += Number(transaction.volume || 0);
      row.totalAmount += Number(transaction.amount || 0);

      if (transaction.vehicleId) {
        row.vehicles.add(transaction.vehicleId);
      }

      const transactionDate = transaction.dateTime
        ? new Date(transaction.dateTime)
        : null;
      if (transactionDate && !Number.isNaN(transactionDate.getTime())) {
        if (
          !row.lastTransactionAt ||
          transactionDate > new Date(row.lastTransactionAt)
        ) {
          row.lastTransactionAt = transactionDate.toISOString();
        }
      }

      return accumulator;
    }, {});

    const normalizedRows = Object.values(grouped).map((row) => ({
      ...row,
      uniqueVehicles: row.vehicles.size,
    }));

    let filtered = normalizedRows;
    if (searchTerm.trim()) {
      const query = searchTerm.trim().toLowerCase();
      filtered = filtered.filter((row) =>
        (row.employeeName || "").toLowerCase().includes(query)
      );
    }

    return filtered.sort((left, right) => right.totalVolume - left.totalVolume);
  }, [employeeMap, searchTerm, transactions]);

  const totals = useMemo(() => {
    const totalVolume = summaryRows.reduce(
      (accumulator, row) => accumulator + row.totalVolume,
      0
    );
    const totalAmount = summaryRows.reduce(
      (accumulator, row) => accumulator + row.totalAmount,
      0
    );
    const totalTransactions = summaryRows.reduce(
      (accumulator, row) => accumulator + row.transactionCount,
      0
    );

    return {
      employeeCount: summaryRows.length,
      totalTransactions,
      totalVolume,
      totalAmount,
    };
  }, [summaryRows]);

  return (
    <div className="tw-space-y-4">
      <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
        <div className="tw-flex tw-flex-wrap tw-items-end tw-justify-between tw-gap-3">
          <div>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
              Employee Consumption History
            </h2>
            <p className="tw-text-sm tw-text-gray-600">
              Analyze fuel transactions by employee for the selected date range.
            </p>
          </div>

          <div className="tw-flex tw-flex-wrap tw-items-end tw-gap-2">
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
            <div>
              <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                Quick Search
              </label>
              <input
                type="text"
                value={searchTerm}
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search employee..."
                className="tw-border tw-border-gray-300 tw-rounded-md tw-px-3 tw-py-2 tw-text-sm tw-min-w-[180px]"
              />
            </div>
            <Button
              text="Refresh"
              icon="fa-light fa-rotate"
              type="default"
              stylingMode="contained"
              onClick={loadTransactions}
            />
          </div>
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-3">
        <div className="tw-bg-orange-50 tw-border tw-border-orange-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-orange-700">
            Employees
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totals.employeeCount}
          </h3>
        </div>
        <div className="tw-bg-blue-50 tw-border tw-border-blue-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-blue-700">
            Transactions
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totals.totalTransactions}
          </h3>
        </div>
        <div className="tw-bg-emerald-50 tw-border tw-border-emerald-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-emerald-700">
            Fuel Volume (L)
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totals.totalVolume.toFixed(2)}
          </h3>
        </div>
        <div className="tw-bg-violet-50 tw-border tw-border-violet-100 tw-rounded-lg tw-p-3">
          <p className="tw-text-xs tw-uppercase tw-font-semibold tw-text-violet-700">
            Fuel Amount
          </p>
          <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            {totals.totalAmount.toFixed(2)}
          </h3>
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-xl tw-border tw-border-gray-200 tw-shadow-sm tw-p-4">
        {loading ? (
          <div className="tw-h-64 tw-flex tw-items-center tw-justify-center">
            <LoadIndicator visible={true} width="30px" height="30px" />
          </div>
        ) : (
          <DataGrid
            dataSource={summaryRows}
            showBorders={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            keyExpr="id"
          >
            <SearchPanel visible={false} />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={15} />
            <Pager
              visible={true}
              showNavigationButtons={true}
              showInfo={true}
              showPageSizeSelector={true}
              allowedPageSizes={[10, 15, 25, 50]}
            />

            <Column dataField="employeeName" caption="Employee" minWidth={220} />
            <Column
              dataField="transactionCount"
              caption="Transactions"
              alignment="right"
              minWidth={130}
            />
            <Column
              dataField="uniqueVehicles"
              caption="Vehicles"
              alignment="right"
              minWidth={100}
            />
            <Column
              dataField="totalVolume"
              caption="Total Volume (L)"
              dataType="number"
              format="fixedPoint"
              alignment="right"
              minWidth={140}
            />
            <Column
              dataField="totalAmount"
              caption="Total Amount"
              dataType="number"
              format="fixedPoint"
              alignment="right"
              minWidth={140}
            />
            <Column
              dataField="lastTransactionAt"
              caption="Last Transaction"
              dataType="datetime"
              format="dd/MM/yyyy HH:mm"
              minWidth={170}
            />
            <Column
              caption="Details"
              width={120}
              allowSorting={false}
              allowFiltering={false}
              cellRender={(cell) => (
                <Button
                  text="Open"
                  icon="fa-light fa-arrow-up-right-from-square"
                  stylingMode="text"
                  disabled={!cell.data.employeeId}
                  onClick={() =>
                    cell.data.employeeId &&
                    navigate(`/employees/${cell.data.employeeId}/details`)
                  }
                />
              )}
            />
          </DataGrid>
        )}
      </div>
    </div>
  );
};

export default EmployeeConsumptionHistoryPage;
