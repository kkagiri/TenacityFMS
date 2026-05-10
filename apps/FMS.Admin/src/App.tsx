/**
 * File:          App.tsx
 * Purpose:       FMS.Admin route composition.
 * Dependencies:  react-router-dom, Redux auth state
 * Last Modified: 2026-05-10
 *
 * Key Functions:
 * - App(): Defines public and protected operator routes.
 */

import { useEffect } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import OperatorLayout from "./layouts/OperatorLayout";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPage";
import NotFoundPage from "./pages/NotFoundPage";
import PlaceholderPage from "./pages/PlaceholderPage";
import TenantDetailPage from "./pages/TenantDetailPage";
import TenantsPage from "./pages/TenantsPage";
import ProtectedRoute from "./routes/ProtectedRoute";
import { initializeAuth } from "./store/authSlice";
import { useAppDispatch } from "./store/hooks";

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
          <Route index element={<DashboardPage />} />
          <Route path="dashboard" element={<Navigate to="/" replace />} />
          <Route path="tenants" element={<TenantsPage />} />
          <Route path="tenants/:tenantId" element={<TenantDetailPage />} />
          <Route
            path="subscriptions"
            element={
              <PlaceholderPage
                title="Subscriptions"
                icon="fa-light fa-file-invoice-dollar"
              />
            }
          />
          <Route
            path="reports"
            element={
              <PlaceholderPage title="Reports" icon="fa-light fa-chart-line" />
            }
          />
          <Route
            path="audit"
            element={
              <PlaceholderPage
                title="Audit Log"
                icon="fa-light fa-shield-check"
              />
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>
    </Routes>
  );
}
