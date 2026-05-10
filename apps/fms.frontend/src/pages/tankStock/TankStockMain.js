/**
 * File: TankStockMain.js
 * Purpose: Defines Tank Stock module routes and applies role-based route protection for admin-only pages
 * Dependencies: react-router-dom, StockFilterProvider, TankStockLayout, withRoleProtection
 * Last Modified: 2026-02-10
 *
 * Key Functions/Components:
 * - TankStockMain(): Registers Tank Stock routes and secures admin-only feature routes
 */
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { StockFilterProvider } from "./shared/context/StockFilterContext";
import { TankStockFormProvider } from "./shared/context/TankStockFormContext";
import TankStockLayout from "./layout/TankStockLayout";
import EnhancedTankStockDashboard from "./dashboard/EnhancedTankStockDashboard";
import StockAnalytics from "./analytics/StockAnalytics";
import StockManagement from "./management/StockManagement";
import AutomaticTankStockMain from "./automatic/AutomaticTankStockMain";
import TankStockSettings from "./settings/TankStockSettings";
import ReconciliationMain from "../reconciliation/ReconciliationMain";
import FuelAuditMain from "./fuelAudit/FuelAuditMain";
import VolumeCorrectionMain from "../tankManagement/volumeCorrection/VolumeCorrectionMain";
import withPermissionProtection from "../../utils/withPermissionProtection";

const AdminStockAnalytics = withPermissionProtection(StockAnalytics, ["_Read_TankStock"]);
const AdminReconciliationMain = withPermissionProtection(ReconciliationMain, ["_Read_TankStock"]);
const AdminFuelAuditMain = withPermissionProtection(FuelAuditMain, ["_Read_FuelAudit", "_Read_TankStock"]);
const AdminVolumeCorrectionMain = withPermissionProtection(VolumeCorrectionMain, ["_Read_TankStock"]);

const TankStockMain = () => {
  return (
    <StockFilterProvider>
      <TankStockFormProvider>
        <TankStockLayout>
          <Routes>
            {/* Default route - Enhanced Dashboard */}
            <Route index element={<EnhancedTankStockDashboard />} />
            <Route path="/" element={<EnhancedTankStockDashboard />} />
            <Route path="/dashboard" element={<EnhancedTankStockDashboard />} />

            <Route path="/settings" element={<TankStockSettings />} />
            {/* Feature routes with updated paths */}
            <Route path="/stock-analytics" element={<AdminStockAnalytics />} />
            <Route path="/stock-management/*" element={<StockManagement />} />
            <Route path="/automatic-tank-stock/*" element={<AutomaticTankStockMain />} />
            <Route path="/reconciliation" element={<AdminReconciliationMain />} />

            <Route path="/fuel-audit/*" element={<AdminFuelAuditMain />} />
            <Route path="/volume-correction/*" element={<AdminVolumeCorrectionMain />} />
            <Route path="/settings" element={<TankStockSettings />} />

            {/* Catch all - redirect to dashboard */}
            <Route path="*" element={<Navigate to="/tankstock" replace />} />
          </Routes>
        </TankStockLayout>
      </TankStockFormProvider>
    </StockFilterProvider>
  );
};

export default TankStockMain;
