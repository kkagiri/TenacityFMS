import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { StockFilterProvider } from "./shared/context/StockFilterContext";
import { TankStockFormProvider } from "./shared/context/TankStockFormContext";
import TankStockLayout from "./layout/TankStockLayout";
import EnhancedTankStockDashboard from "./dashboard/EnhancedTankStockDashboard";
import StockAnalytics from "./analytics/StockAnalytics";
import StockManagement from "./management/StockManagement";
import TankStockSettings from "./settings/TankStockSettings";
import TransferReconciliation from "./analytics/TransferReconciliation";
import ReconciliationMain from "../reconciliation/ReconciliationMain";
import FuelDataComparisonMain from "./fueldatacomparison/FuelDataComparisonMain";
import FuelAuditMain from "./fuelAudit/FuelAuditMain";

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
            <Route path="/stock-analytics" element={<StockAnalytics />} />
            <Route path="/stock-management" element={<StockManagement />} />
            <Route path="/reconciliation" element={<ReconciliationMain />} />
            <Route
              path="/transfer-reconciliation"
              element={<TransferReconciliation />}
            />
            <Route
              path="/fueldatacomparison/*"
              element={<FuelDataComparisonMain />}
            />
            <Route path="/fuel-audit/*" element={<FuelAuditMain />} />
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
