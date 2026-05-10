/**
 * File: CustomerRoutes.js
 * Purpose: Route allowlist for Customer-tenant users (tenant_kind=customer).
 *          Anything not in the allowlist redirects to /home.
 *
 * Design: M365 Admin Center / Insignia. The scoped pages reuse the existing
 *         vehicle / report / notification page modules — they are already
 *         tenant-scoped server-side via ITenantOwned, so a Customer hitting
 *         /vehicles only sees their own data. This component's job is the
 *         UI-surface guard (so Customer never lands on /atg, /admin, etc.).
 *
 * Pages (Phase 1):
 *   - Dashboard (/home)
 *   - My Vehicles (/vehicles, /vehicles/*)
 *   - My Transactions (/my-transactions, /my-transactions/*)
 *   - My Reports (/reports, /reports/*)
 *   - My Users (/my-users, /my-users/*)
 *   - Profile (/profile, /profile/*)
 *   - My Notifications (/my-notifications, /my-notifications/*)
 *   - Force-password-change page (/change-password-required)
 *   - Unauthorized fallback (/unauthorized)
 *
 * Last Modified: 2026-05-10
 */
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import resolvedComponents from "../../app-routes";
import Unauthorized from "../../pages/unauthorized";
import ForcePasswordChangePage from "../../pages/auth/ForcePasswordChangePage";
import CustomerTransactionsPage from "../../pages/customer/CustomerTransactionsPage";
import CustomerProfilePage from "../../pages/customer/CustomerProfilePage";
import UserPage from "../../pages/user/userPage";

export default function CustomerRoutes() {
  return (
    <Routes>
      <Route path="/change-password-required" element={<ForcePasswordChangePage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Dashboard — Customer sees a tenant-scoped dashboard */}
      <Route
        path="/home"
        element={React.createElement(resolvedComponents("dashboard"))}
      />
      <Route
        path="/dashboard"
        element={<Navigate to="/home" replace />}
      />

      {/* My Vehicles — server-side ITenantOwned filter scopes to own tenant */}
      <Route
        path="/vehicles"
        element={React.createElement(resolvedComponents("vehicles"))}
      />
      <Route
        path="/vehicles/*"
        element={React.createElement(resolvedComponents("vehicles"))}
      />

      {/* My Transactions — read-only customer transaction history */}
      <Route path="/my-transactions" element={<CustomerTransactionsPage />} />
      <Route path="/my-transactions/*" element={<CustomerTransactionsPage />} />

      {/* My Reports */}
      <Route
        path="/reports"
        element={React.createElement(resolvedComponents("reports"))}
      />
      <Route
        path="/reports/*"
        element={React.createElement(resolvedComponents("reports"))}
      />

      {/* My Users — existing tenant-scoped user management surface */}
      <Route path="/my-users" element={<UserPage />} />
      <Route path="/my-users/*" element={<UserPage />} />

      {/* Profile */}
      <Route path="/profile" element={<CustomerProfilePage />} />
      <Route path="/profile/*" element={<CustomerProfilePage />} />

      {/* My Notifications */}
      <Route
        path="/my-notifications"
        element={React.createElement(resolvedComponents("notification-center"))}
      />
      <Route
        path="/my-notifications/*"
        element={React.createElement(resolvedComponents("notification-center"))}
      />

      {/* Anything else → /home (blocks /atg, /admin, /providermanagement, etc.) */}
      <Route path="*" element={<Navigate to="/home" replace />} />
    </Routes>
  );
}
