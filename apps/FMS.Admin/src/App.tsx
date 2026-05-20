/**
 * File:          App.tsx
 * Purpose:       FMS.Admin route composition.
 * Dependencies:  react-router-dom, Redux auth state
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - App(): Defines public and protected operator routes.
 */

import { useEffect, type ReactElement } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import OperatorLayout from "./layouts/OperatorLayout";
import DashboardPage from "./pages/DashboardPage";
import AuditLogPage from "./pages/AuditLogPage";
import DeviceProvidersPage from "./pages/DeviceProvidersPage";
import InvoicesPage from "./pages/InvoicesPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import OperatorUsersPage from "./pages/OperatorUsersPage";
import ReportsPage from "./pages/ReportsPage";
import PlansPage from "./pages/PlansPage";
import SalesPipelinePage from "./pages/SalesPipelinePage";
import StationsPage from "./pages/StationsPage";
import SubscriptionsPage from "./pages/SubscriptionsPage";
import TenantDetailPage from "./pages/TenantDetailPage";
import TenantsPage from "./pages/TenantsPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { initializeAuth } from "./store/authSlice";
import { useAppDispatch } from "./store/hooks";
import { RouteErrorBoundary } from "./components/feedback";

// Wrap a route element in a RouteErrorBoundary so one page's crash never
// takes down the whole operator portal. PRD §7.1 L2.
const wrap = (routeName: string, element: ReactElement): ReactElement => (
  <RouteErrorBoundary routeName={routeName}>{element}</RouteErrorBoundary>
);

export default function App() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(initializeAuth());
  }, [dispatch]);

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<OperatorLayout />}>
          <Route index element={wrap("Dashboard", <DashboardPage />)} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="tenants" element={wrap("Tenants", <TenantsPage />)} />
          <Route
            path="tenants/:tenantId"
            element={wrap("Tenant detail", <TenantDetailPage />)}
          />
          <Route
            path="device-providers"
            element={wrap("Device providers", <DeviceProvidersPage />)}
          />
          <Route path="stations" element={wrap("Stations", <StationsPage />)} />
          <Route path="plans" element={wrap("Plans", <PlansPage />)} />
          <Route
            path="sales-pipeline"
            element={wrap("Sales pipeline", <SalesPipelinePage />)}
          />
          <Route
            path="subscriptions"
            element={wrap("Subscriptions", <SubscriptionsPage />)}
          />
          <Route
            path="invoices"
            element={wrap("Invoices", <InvoicesPage />)}
          />
          <Route
            path="operator-users"
            element={wrap("Operators", <OperatorUsersPage />)}
          />
          <Route path="reports" element={wrap("Reports", <ReportsPage />)} />
          <Route path="audit" element={wrap("Audit log", <AuditLogPage />)} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
