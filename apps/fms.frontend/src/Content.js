/**
 * File: Content.js
 * Purpose: Defines application routing and global layout wrappers
 * Dependencies: react-router-dom, react-redux, SideNavOuterToolbar, AdminLayout
 * Last Modified: 2026-05-10
 *
 * Key Functions/Components:
 * - Content(): Root route configuration and layout composition
 *
 * Layout Standard:
 * - All feature applications render inside SideNavOuterToolbar (Inspinia shell)
 *   with the shared backend-driven side navigation menu.
 * - Admin (/admin/*) renders OUTSIDE the Inspinia shell as its own full-page
 *   layout so AdminLayout owns the sidebar + header chrome end-to-end.
 *
 * 3-Audience ViewMode (added 2026-05-10):
 * - Customer-tenant users (tenant_kind=customer in JWT) see CustomerRoutes —
 *   a scoped allowlist of pages (Dashboard, Vehicles, Reports, Notifications,
 *   Profile). All operational/admin routes redirect them to /home.
 *   Data isolation is already enforced server-side by ITenantOwned, so
 *   re-using the existing pages for Customer is safe; CustomerRoutes is
 *   the route-level guard that prevents UI surface leak.
 */
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import React from "react";
import appInfo from "./app-info";
import { SideNavOuterToolbar } from "./layouts";
import { Footer } from "./components";

import { useSelector } from "react-redux";
import resolvedComponents from "./app-routes";
import withPermissionProtection from "./utils/withPermissionProtection";
import Unauthorized from "./pages/unauthorized";
import FuelingProcess from "./pages/ATG/fuelingprocess/fuelingprocess";
import ErrorBoundary from "./pages/ATG/fuelingprocess/Components/ErrorBoundary";
import ForcePasswordChangePage from "./pages/auth/ForcePasswordChangePage";
import CustomerRoutes from "./components/CustomerRoutes/CustomerRoutes";
import { useSignalRRouting } from "./hooks/useSignalRRouting";
import useDocumentTitle from "./hooks/useDocumentTitle";
import { getSafeInternalRedirect } from "./utils/authRedirect";

export default function Content() {
  const { user } = useSelector((state) => state.auth);
  const tenantKind = useSelector((state) => state.tenantContext?.tenantKind ?? "client");
  const isCustomerView = tenantKind === "customer";
  const location = useLocation();

  // Initialize route-based SignalR management
  const signalRState = useSignalRRouting({
    enabled: true,
    debounceMs: 300,
  });

  // Update browser tab title based on current route
  useDocumentTitle();

  const requiresPasswordChange = Boolean(
    user?.requirePasswordChangeOnFirstLogin ?? user?.RequirePasswordChangeOnFirstLogin
  );

  const requestedRedirect = getSafeInternalRedirect(
    new URLSearchParams(location.search).get("redirect")
  );

  if (requiresPasswordChange && location.pathname !== "/change-password-required") {
    const returnUrl = `${location.pathname}${location.search}${location.hash}`;
    return (
      <Navigate
        to={`/change-password-required?redirect=${encodeURIComponent(returnUrl)}`}
        replace
      />
    );
  }

  if (location.pathname === "/login") {
    return (
      <Navigate
        to={requestedRedirect && !requestedRedirect.startsWith("/login") ? requestedRedirect : "/home"}
        replace
      />
    );
  }

  // Admin runs as its own full-page shell (own sidebar + header from AdminLayout).
  // It is rendered OUTSIDE the Inspinia SideNavOuterToolbar by design.
  // Customer ViewMode users are blocked from /admin and redirected to /home.
  if (location.pathname.startsWith("/admin")) {
    if (isCustomerView) {
      return <Navigate to="/home" replace />;
    }
    return (
      <Routes>
        <Route
          path="/admin"
          element={React.createElement(
            withPermissionProtection(resolvedComponents("admin"), ["_Manage_Users", "_Manage_Roles", "_Manage_Site", "_Manage_ATG", "_Manage_ExpectedAverage", "_Manage_Issues", "_Manage_Device"])
          )}
        />
        <Route
          path="/admin/*"
          element={React.createElement(
            withPermissionProtection(resolvedComponents("admin"), ["_Manage_Users", "_Manage_Roles", "_Manage_Site", "_Manage_ATG", "_Manage_ExpectedAverage", "_Manage_Issues", "_Manage_Device"])
          )}
        />
        <Route path="*" element={<Navigate to="/admin" replace />} />
      </Routes>
    );
  }

  // 3-Audience ViewMode — Customer-tenant users see a scoped route allowlist.
  // The server-side ITenantOwned filter already enforces data isolation; this
  // branch prevents UI surface leak (no /atg, no /providermanagement, etc.).
  if (isCustomerView) {
    return (
      <SideNavOuterToolbar title={appInfo.title}>
        <CustomerRoutes />
      </SideNavOuterToolbar>
    );
  }

  return (
    <SideNavOuterToolbar title={appInfo.title}>
      <Routes>
        <Route path="/change-password-required" element={<ForcePasswordChangePage />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* Fueling routes with proper error handling */}
        <Route
          path="/fueling/:ptsId"
          element={
            <ErrorBoundary>
              <FuelingProcess />
            </ErrorBoundary>
          }
        />

        <Route
          path="/user-activities"
          element={React.createElement(
            resolvedComponents("activity-dashboard")
          )}
        />

        {/* Tank routes */}
        <Route
          path="/tanks"
          element={React.createElement(resolvedComponents("tanks"))}
        />
        <Route
          path="/tanks/:id"
          element={React.createElement(resolvedComponents("tank-details"))}
        />
        <Route
          path="/tanks/:id/edit"
          element={React.createElement(resolvedComponents("tank-edit"))}
        />

        {/* Keep the old route for backward compatibility */}
        <Route
          path="/atg/:ptsId"
          element={
            <Navigate
              to={(location) => location.pathname.replace("/atg/", "/fueling/")}
            />
          }
        />

        <Route
          path="/atg"
          element={React.createElement(resolvedComponents("atg"))}
        />

        {/* Tank Stock System Routes - Handle all tankstock sub-routes internally */}
        <Route
          path="/tankstock"
          element={React.createElement(resolvedComponents("tank stock"))}
        />
        <Route
          path="/tankstock/*"
          element={React.createElement(resolvedComponents("tank stock"))}
        />
        {/* Notification System Routes removed - now handled under /admin/notification */}

        {/* User Notification Center - view, read and manage personal notifications */}
        <Route
          path="/my-notifications"
          element={React.createElement(resolvedComponents("notification-center"))}
        />
        <Route
          path="/my-notifications/*"
          element={React.createElement(resolvedComponents("notification-center"))}
        />

        {/* Admin routes intentionally NOT here — admin renders OUTSIDE this shell.
            See the early-return branch above for /admin/* handling. */}

        {/* PTS Terminal Test Page - ISOLATED for debugging */}
        <Route
          path="/pts-terminal-test"
          element={React.createElement(resolvedComponents("pts-terminal-test"))}
        />

        {/* Vehicle Management System Routes - Handle all vehicle sub-routes internally */}
        <Route
          path="/vehicles"
          element={React.createElement(resolvedComponents("vehicles"))}
        />
        <Route
          path="/vehicles/*"
          element={React.createElement(resolvedComponents("vehicles"))}
        />

        {/* Employee Management System Routes - Handle all employee sub-routes internally */}
        <Route
          path="/employees"
          element={React.createElement(resolvedComponents("employees"))}
        />
        <Route
          path="/employees/*"
          element={React.createElement(resolvedComponents("employees"))}
        />

        {/* Reports System Routes - Handle all reports sub-routes internally */}
        <Route
          path="/reports"
          element={React.createElement(resolvedComponents("reports"))}
        />
        <Route
          path="/reports/*"
          element={React.createElement(resolvedComponents("reports"))}
        />

        {/* Maintenance System Routes - Handle all maintenance sub-routes internally */}
        <Route
          path="/maintenance"
          element={React.createElement(resolvedComponents("maintenance"))}
        />
        <Route
          path="/maintenance/*"
          element={React.createElement(resolvedComponents("maintenance"))}
        />

        {/* Provider Management System Routes - Handle all providermanagement sub-routes internally */}
        <Route
          path="/providermanagement"
          element={React.createElement(
            resolvedComponents("provider management")
          )}
        />
        <Route
          path="/providermanagement/*"
          element={React.createElement(
            resolvedComponents("provider management")
          )}
        />

        {/* Issue Tracker System Routes - Handle all issue-tracker sub-routes internally */}
        <Route
          path="/issue-tracker"
          element={React.createElement(resolvedComponents("issue tracker"))}
        />
        <Route
          path="/issue-tracker/*"
          element={React.createElement(resolvedComponents("issue tracker"))}
        />

        {/* Event Expressions Management */}
        <Route
          path="/event-expressions"
          element={React.createElement(resolvedComponents("event-expressions"))}
        />
        <Route
          path="/event-expressions/*"
          element={React.createElement(resolvedComponents("event-expressions"))}
        />

        {/* Home/Dashboard route - maps to the dashboard component */}
        <Route
          path="/home"
          element={React.createElement(resolvedComponents("dashboard"))}
        />

        {/* Widget Testing route - for testing dashboard widgets with mock data */}

        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      <Footer>
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: "12px",
            flexWrap: "nowrap",
          }}
        >
          <div
            style={{
              flex: 1,
              minWidth: 0,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            Copyright 2011-{new Date().getFullYear()} {appInfo.title} Inc.
            <span style={{ marginLeft: '10px', color: '#888' }}>v{appInfo.version}</span>
            <span style={{ marginLeft: '12px' }}>
              Develop by Kevin.kagiri@example.com. All trademarks or registered
              trademarks are property of Tenacy Co. Ltd.
            </span>
          </div>
          {/* SignalR Connection Status Indicator */}
          <div
            style={{
              fontSize: "0.8em",
              opacity: 0.8,
              whiteSpace: "nowrap",
              flexShrink: 0,
            }}
          >
            {signalRState.isDashboardConnected && (
              <span style={{ color: "#4caf50", marginRight: "10px" }}>
                ● Dashboard
              </span>
            )}
            {signalRState.isPtsConnected && (
              <span style={{ color: "#4caf50", marginRight: "10px" }}>
                ● PTS
              </span>
            )}
            {signalRState.isBusinessConnected && (
              <span style={{ color: "#4caf50" }}>● Business</span>
            )}
            {signalRState.isVehicleTrackingConnected && (
              <span style={{ color: "#4caf50", marginLeft: signalRState.isBusinessConnected ? "10px" : 0 }}>
                ● Vehicle Tracking
              </span>
            )}
            {!signalRState.isDashboardConnected &&
              !signalRState.isPtsConnected &&
              !signalRState.isBusinessConnected &&
              !signalRState.isVehicleTrackingConnected && (
                <span style={{ color: "#ff9800" }}>● Offline</span>
              )}
          </div>
        </div>
      </Footer>
    </SideNavOuterToolbar>
  );
}
