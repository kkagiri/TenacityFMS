import { Routes, Route, Navigate } from "react-router-dom";
import React, { useEffect, useMemo } from "react";
import appInfo from "./app-info";
import { SideNavInnerToolbar as SideNavBarLayout } from "./layouts";
import { Footer } from "./components";

import { useDispatch, useSelector } from "react-redux";
import { fetchNavigationItems } from "./redux/actions/navigationActions";
import resolvedComponents from "./app-routes";
import withRoleProtection from "./utils/withRoleProtection";
import Unauthorized from "./pages/unauthorized";
import FuelingProcess from "./components/fuelingprocess/fuelingprocess";
import ErrorBoundary from "./components/fuelingprocess/ErrorBoundary";

export default function Content() {
  const dispatch = useDispatch();
  const { navigationItems } = useSelector((state) => state.navigation);
  const { user } = useSelector((state) => state.auth);

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
    <SideNavBarLayout title={appInfo.title}>
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

        {/* User routes */}
        <Route path="/users/:id" element={React.createElement(resolvedComponents("user-details"))} />
        <Route path="/users/:id/edit" element={React.createElement(resolvedComponents("user-edit"))} />
        <Route path="/users/:id/activities" element={React.createElement(resolvedComponents("user-activities"))} />
        <Route path="/users/:id/sites" element={React.createElement(resolvedComponents("user-sites"))} />
        <Route path="/user-activities" element={React.createElement(resolvedComponents("activity-dashboard"))} />

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
        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
      <Footer>
        Copyright 2011-{new Date().getFullYear()} {appInfo.title} Inc.
        Version:1.1.0
        <br />
        Develop by Kevin.kagiri@hyoung.co.ke. All trademarks or registered
        trademarks are property of Hyoung EA Co. Ltd.
      </Footer>
    </SideNavBarLayout>
  );
}
