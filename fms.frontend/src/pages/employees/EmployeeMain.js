/**
 * File: EmployeeMain.js
 * Purpose: Root routing entry point for the employee management module.
 * Dependencies: react-router-dom, EmployeeLayout, employee feature pages.
 * Last Modified: 2026-02-16
 *
 * Key Components:
 * - EmployeeMain(): Hosts nested employee routes inside the shared module layout.
 */

import React from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";
import EmployeeLayout from "./layout/EmployeeLayout";
import EmployeePage from "./employeePage";
import EmployeeDashboard from "./dashboard/EmployeeDashboard";
import EmployeeConsumptionHistoryPage from "./history/EmployeeConsumptionHistoryPage";
import EmployeeDetailsPage from "./details/EmployeeDetailsPage";

const EmployeeMain = () => {
  const location = useLocation();

  return (
    <EmployeeLayout currentPath={location.pathname}>
      <Routes>
        <Route index element={<Navigate to="/employees/dashboard" replace />} />
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="list" element={<EmployeePage />} />
        <Route
          path="consumption-history"
          element={<EmployeeConsumptionHistoryPage />}
        />
        <Route path=":id/details" element={<EmployeeDetailsPage />} />
        <Route
          path="*"
          element={<Navigate to="/employees/dashboard" replace />}
        />
      </Routes>
    </EmployeeLayout>
  );
};

export default EmployeeMain;
