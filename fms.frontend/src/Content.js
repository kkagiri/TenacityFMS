import { Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import appInfo from "./app-info";
import { AppDrawerLayout } from "./layouts";
import { Footer } from "./components";

import { useDispatch, useSelector } from "react-redux";
import { fetchNavigationItems } from "./redux/actions/navigationActions";
import resolvedComponents from "./app-routes";
import withRoleProtection from "./utils/withRoleProtection";
import Unauthorized from "./pages/unauthorized";
import FuelingProcess from "./pages/ATG/fuelingprocess/fuelingprocess";
import ErrorBoundary from "./pages/ATG/fuelingprocess/Components/ErrorBoundary";
import { useSignalRRouting } from "./hooks/useSignalRRouting";

export default function Content() {
  const dispatch = useDispatch();
  const { navigationItems } = useSelector((state) => state.navigation);
  const { user } = useSelector((state) => state.auth);

  // Initialize route-based SignalR management
  const signalRState = useSignalRRouting({
    enabled: true,
    debounceMs: 300
  });

  useEffect(() => {
    if (user) {
      dispatch(fetchNavigationItems());
    }
  }, [user, dispatch]);

  const dynamicRoutes = useMemo(() => {
    return navigationItems.map((item) => {
      const Component = resolvedComponents(item.page);
      const ProtectedComponent = withRoleProtection(Component, item.roles);
      return (
        <Route
          key={item.link}
          path={item.link}
          element={<ProtectedComponent />}
        />
      );
    });
  }, [navigationItems]);

  return (
    <AppDrawerLayout title={appInfo.title}>
      <Routes>
        {dynamicRoutes}
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

        {/* User routes - now under admin - ADMIN ONLY */}
        <Route path="/admin/users/:id" element={React.createElement(withRoleProtection(resolvedComponents("user-details"), ["Admin"]))} />
        <Route path="/admin/users/:id/edit" element={React.createElement(withRoleProtection(resolvedComponents("user-edit"), ["Admin"]))} />
        <Route path="/admin/users/:id/activities" element={React.createElement(withRoleProtection(resolvedComponents("user-activities"), ["Admin"]))} />
        <Route path="/admin/users/:id/sites" element={React.createElement(withRoleProtection(resolvedComponents("user-sites"), ["Admin"]))} />
        <Route path="/user-activities" element={React.createElement(resolvedComponents("activity-dashboard"))} />

        {/* Tank routes */}
        <Route path="/tanks" element={React.createElement(resolvedComponents("tanks"))} />
        <Route path="/tanks/:id" element={React.createElement(resolvedComponents("tank-details"))} />
        <Route path="/tanks/:id/edit" element={React.createElement(resolvedComponents("tank-edit"))} />

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
     {/* notification Stock System Routes - Handle all notification sub-routes internally */}
        <Route
          path="/notifications"
          element={React.createElement(resolvedComponents("notifications"))}
        />
        <Route
          path="/notifications/*"
          element={React.createElement(resolvedComponents("notifications"))}
        />

        {/* Admin System Routes - Handle all admin sub-routes internally - ADMIN ONLY */}
        <Route
          path="/admin"
          element={React.createElement(withRoleProtection(resolvedComponents("admin"), ["Admin"]))}
        />
        <Route
          path="/admin/*"
          element={React.createElement(withRoleProtection(resolvedComponents("admin"), ["Admin"]))}
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

        {/* Reports System Routes - Handle all reports sub-routes internally */}
        <Route
          path="/reports"
          element={React.createElement(resolvedComponents("reports"))}
        />
        <Route
          path="/reports/*"
          element={React.createElement(resolvedComponents("reports"))}
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
        <Route path="/active-alarms" element={React.createElement(resolvedComponents("active-alarms"))} />
        <Route path="/active-alarms/*" element={React.createElement(resolvedComponents("active-alarms"))} />

        {/* Home/Dashboard route - maps to the dashboard component */}
        <Route path="/home" element={React.createElement(resolvedComponents("dashboard"))} />

        {/* Widget Testing route - for testing dashboard widgets with mock data */}

        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      <Footer>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            Copyright 2011-{new Date().getFullYear()} {appInfo.title} Inc.
            Version:2.0.2
            <br />
            Develop by Kevin.kagiri@hyoung.co.ke. All trademarks or registered
            trademarks are property of Hyoung EA Co. Ltd.
          </div>
          {/* SignalR Connection Status Indicator */}
          <div style={{ fontSize: '0.8em', opacity: 0.8 }}>
            {signalRState.isDashboardConnected && (
              <span style={{ color: '#4caf50', marginRight: '10px' }}>● Dashboard</span>
            )}
            {signalRState.isPtsConnected && (
              <span style={{ color: '#4caf50', marginRight: '10px' }}>● PTS</span>
            )}
            {signalRState.isBusinessConnected && (
              <span style={{ color: '#4caf50' }}>● Business</span>
            )}
            {!signalRState.isDashboardConnected && !signalRState.isPtsConnected && !signalRState.isBusinessConnected && (
              <span style={{ color: '#ff9800' }}>● Offline</span>
            )}
          </div>
        </div>
      </Footer>
    </AppDrawerLayout>
  );
}
