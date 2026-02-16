/**
 * File: EmployeeDashboard.js
 * Purpose: Displays employee module KPIs and operational overview widgets.
 * Dependencies: redux employee/vehicle/site actions, DevExtreme grid/button components.
 * Last Modified: 2026-02-16
 *
 * Key Components:
 * - EmployeeDashboard(): Employee summary dashboard with key metrics and quick insights.
 */

import React, { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import DataGrid, { Column, Pager, Paging } from "devextreme-react/data-grid";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import { fetchEmployees } from "../../../redux/actions/employeeActions";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";

const EmployeeDashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const employees = useSelector((state) => state.employee?.employees || []);
  const employeeLoading = useSelector((state) => state.employee?.loading);
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const sites = useSelector((state) => state.site?.sites || []);

  useEffect(() => {
    dispatch(fetchEmployees(false));
    dispatch(fetchVehicleList());
    dispatch(fetchSiteList());
  }, [dispatch]);

  const dashboardData = useMemo(() => {
    const totalEmployees = employees.length;
    const activeEmployees = employees.filter(
      (employee) => (employee.employeestatus || "").toLowerCase() === "active"
    ).length;
    const terminatedEmployees = employees.filter(
      (employee) => (employee.employeestatus || "").toLowerCase() === "terminated"
    ).length;
    const assignedEmployees = employees.filter(
      (employee) => Array.isArray(employee.vehicles) && employee.vehicles.length > 0
    ).length;
    const unassignedEmployees = totalEmployees - assignedEmployees;

    const assignedVehicleCount = new Set(
      employees
        .filter((employee) => Array.isArray(employee.vehicles))
        .flatMap((employee) => employee.vehicles)
    ).size;

    const uniqueSiteCount = new Set(
      employees.filter((employee) => employee.siteId).map((employee) => employee.siteId)
    ).size;

    const siteMap = new Map(sites.map((site) => [site.id, site.name]));

    const employeeSiteDistribution = Object.values(
      employees.reduce((accumulator, employee) => {
        const siteName = siteMap.get(employee.siteId) || "Unassigned Site";
        if (!accumulator[siteName]) {
          accumulator[siteName] = { siteName, employeeCount: 0 };
        }
        accumulator[siteName].employeeCount += 1;
        return accumulator;
      }, {})
    ).sort((left, right) => right.employeeCount - left.employeeCount);

    const topAssignments = [...employees]
      .map((employee) => ({
        ...employee,
        assignedVehicleCount: Array.isArray(employee.vehicles)
          ? employee.vehicles.length
          : 0,
      }))
      .sort((left, right) => right.assignedVehicleCount - left.assignedVehicleCount)
      .slice(0, 10);

    const recentUpdates = [...employees]
      .map((employee) => ({
        ...employee,
        sortDate: employee.dateModified || employee.dateCreated,
      }))
      .filter((employee) => !!employee.sortDate)
      .sort((left, right) => new Date(right.sortDate) - new Date(left.sortDate))
      .slice(0, 10);

    return {
      totalEmployees,
      activeEmployees,
      terminatedEmployees,
      assignedEmployees,
      unassignedEmployees,
      assignedVehicleCount,
      uniqueSiteCount,
      employeeSiteDistribution,
      topAssignments,
      recentUpdates,
    };
  }, [employees, sites]);

  const metricCards = [
    {
      title: "Total Employees",
      value: dashboardData.totalEmployees,
      icon: "fa-light fa-users",
      classes:
        "tw-bg-gradient-to-r tw-from-orange-500 tw-to-orange-600 tw-text-white",
    },
    {
      title: "Active Employees",
      value: dashboardData.activeEmployees,
      icon: "fa-light fa-user-check",
      classes: "tw-bg-gradient-to-r tw-from-emerald-500 tw-to-emerald-600 tw-text-white",
    },
    {
      title: "Terminated Employees",
      value: dashboardData.terminatedEmployees,
      icon: "fa-light fa-user-minus",
      classes: "tw-bg-gradient-to-r tw-from-rose-500 tw-to-rose-600 tw-text-white",
    },
    {
      title: "Assigned Vehicles",
      value: dashboardData.assignedVehicleCount,
      icon: "fa-light fa-car",
      classes: "tw-bg-gradient-to-r tw-from-amber-500 tw-to-amber-600 tw-text-white",
    },
    {
      title: "Assigned Employees",
      value: dashboardData.assignedEmployees,
      icon: "fa-light fa-id-card",
      classes:
        "tw-bg-gradient-to-r tw-from-sky-500 tw-to-sky-600 tw-text-white",
    },
    {
      title: "Unassigned Employees",
      value: dashboardData.unassignedEmployees,
      icon: "fa-light fa-user-clock",
      classes:
        "tw-bg-gradient-to-r tw-from-slate-500 tw-to-slate-600 tw-text-white",
    },
    {
      title: "Total Vehicles",
      value: vehicles.length,
      icon: "fa-light fa-truck",
      classes:
        "tw-bg-gradient-to-r tw-from-indigo-500 tw-to-indigo-600 tw-text-white",
    },
    {
      title: "Sites With Employees",
      value: dashboardData.uniqueSiteCount,
      icon: "fa-light fa-location-dot",
      classes:
        "tw-bg-gradient-to-r tw-from-fuchsia-500 tw-to-fuchsia-600 tw-text-white",
    },
  ];

  if (employeeLoading) {
    return (
      <div className="tw-h-[420px] tw-flex tw-items-center tw-justify-center">
        <LoadIndicator visible={true} width="34px" height="34px" />
      </div>
    );
  }

  return (
    <div className="tw-space-y-5">
      <div className="tw-flex tw-flex-wrap tw-items-center tw-justify-between tw-gap-3">
        <div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800">
            Employee Operations Snapshot
          </h2>
          <p className="tw-text-sm tw-text-gray-600">
            Workforce assignment, status, and latest changes across all sites.
          </p>
        </div>

        <div className="tw-flex tw-gap-2">
          <Button
            text="Employee List"
            icon="fa-light fa-list"
            type="default"
            stylingMode="contained"
            onClick={() => navigate("/employees/list")}
          />
          <Button
            text="Consumption History"
            icon="fa-light fa-chart-column"
            type="normal"
            stylingMode="outlined"
            onClick={() => navigate("/employees/consumption-history")}
          />
        </div>
      </div>

      <div className="tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 xl:tw-grid-cols-4 tw-gap-4">
        {metricCards.map((metric) => (
          <div
            key={metric.title}
            className={`${metric.classes} tw-rounded-xl tw-p-4 tw-shadow-md`}
          >
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <p className="tw-text-sm tw-opacity-90">{metric.title}</p>
                <h3 className="tw-text-3xl tw-font-bold">{metric.value}</h3>
              </div>
              <i className={`${metric.icon} tw-text-2xl tw-opacity-90`}></i>
            </div>
          </div>
        ))}
      </div>

      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-4">
        <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-200 tw-p-4">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
              <i className="fa-light fa-car-side tw-mr-2 tw-text-orange-600"></i>
              Top Vehicle Assignments
            </h3>
          </div>

          <DataGrid
            dataSource={dashboardData.topAssignments}
            showBorders={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            keyExpr="id"
          >
            <Paging defaultPageSize={5} />
            <Pager
              visible={true}
              showNavigationButtons={true}
              showInfo={true}
              showPageSizeSelector={false}
            />
            <Column dataField="fullName" caption="Employee" minWidth={160} />
            <Column dataField="employeeWorkNo" caption="Work No" minWidth={100} />
            <Column
              dataField="assignedVehicleCount"
              caption="Assigned Vehicles"
              alignment="right"
              minWidth={130}
            />
            <Column dataField="employeestatus" caption="Status" minWidth={100} />
          </DataGrid>
        </div>

        <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-200 tw-p-4">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
            <i className="fa-light fa-map-location-dot tw-mr-2 tw-text-orange-600"></i>
            Employee Distribution by Site
          </h3>

          <div className="tw-space-y-2">
            {dashboardData.employeeSiteDistribution.length > 0 ? (
              dashboardData.employeeSiteDistribution.map((entry) => (
                <div
                  key={entry.siteName}
                  className="tw-flex tw-items-center tw-justify-between tw-bg-orange-50 tw-border tw-border-orange-100 tw-rounded-lg tw-px-3 tw-py-2"
                >
                  <span className="tw-font-medium tw-text-gray-800">
                    {entry.siteName}
                  </span>
                  <span className="tw-text-sm tw-font-semibold tw-text-orange-700">
                    {entry.employeeCount}
                  </span>
                </div>
              ))
            ) : (
              <div className="tw-text-sm tw-text-gray-500">
                No site assignments found.
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-200 tw-p-4">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-3">
          <i className="fa-light fa-clock-rotate-left tw-mr-2 tw-text-orange-600"></i>
          Recently Updated Employees
        </h3>

        <DataGrid
          dataSource={dashboardData.recentUpdates}
          showBorders={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          keyExpr="id"
        >
          <Paging defaultPageSize={6} />
          <Pager
            visible={true}
            showNavigationButtons={true}
            showInfo={true}
            showPageSizeSelector={false}
          />
          <Column dataField="fullName" caption="Employee" minWidth={180} />
          <Column dataField="employeephoneNumber" caption="Phone" minWidth={140} />
          <Column dataField="employeestatus" caption="Status" minWidth={110} />
          <Column
            caption="Last Updated"
            minWidth={170}
            calculateCellValue={(row) => row.dateModified || row.dateCreated}
            dataType="datetime"
            format="dd/MM/yyyy HH:mm"
          />
          <Column
            caption="Action"
            width={120}
            allowSorting={false}
            allowFiltering={false}
            cellRender={(cell) => (
              <Button
                text="Details"
                icon="fa-light fa-arrow-right"
                stylingMode="text"
                onClick={() => navigate(`/employees/${cell.data.id}/details`)}
              />
            )}
          />
        </DataGrid>
      </div>
    </div>
  );
};

export default EmployeeDashboard;
