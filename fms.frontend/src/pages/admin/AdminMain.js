/**
 * File: AdminMain.js
 * Purpose: Admin module routing with shared admin layout
 * Dependencies: react-router-dom, AdminLayout
 * Last Modified: 2026-01-19
 *
 * Key Functions/Components:
 * - AdminMain(): Admin route definitions under /admin
 */
import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import AdminDashboard from "./AdminDashboard";
import { usePermissions } from "../../hooks/usePermissions";
import { WEB_APP_PERMISSIONS } from "../../constants/webAppPermissions";

// Import the existing component pages to be used in admin routes
import UserPage from "../user/userPage";
import UserDetailsPage from "../user/userDetailsPage";
import UserActivitiesPage from "../user/userActivitiesPage";
import Rolepage from "../Role/rolepage";
import PermissionTreeListNonEdit from "../../components/PermissionTreeList/permissionTreeListNonEdit";
import NavigationPage from "../Navigation/NavigationPage";
import Tagpage from "../tag/tagPage";
import SitePage from "../site/sitePage";
import TankPage from "../tank/tankPage";
import DeviceDashboard from "../PTSDevice/DeviceDashboard";
import PTSDeviceDetailPage from "../PTSDevice/PTSDeviceDetail/PTSDeviceDetailPage";
// PTSAutomationConfigPage removed - migrated to SystemConfiguration
import SystemConfiguration from "./systemConfig/SystemConfigPage";
import PTSServiceControl from "./ptsService/PTSServiceControl";
import NotificationSystem from "../notifications";
import ProviderManagementMain from "../providermanagement/ProviderManagementMain";
import TaskManagement from "../taskManagement";
import LogManagementPage from "./logManagement/LogManagementPage";
import ExpectedAverageManagementPage from "./expectedaverages/ExpectedAverageManagementPage";
import CheckupTemplateManagementPage from "./checkupTemplates/CheckupTemplateManagementPage";
import EmployeePositionManagementPage from "./employeePositions/EmployeePositionManagementPage";
import { FuelingRulesMain } from "./fuelingRules";
import { LocationValidationLogPage } from "./locationValidation";

const LEGACY_ADMIN_ACCESS_PERMISSIONS = [
  "_Manage_Users",
  "_Manage_Roles",
  "_Manage_Site",
  "_Manage_ATG",
  "_Manage_NotificationPolicy",
  "_Manage_NotificationGroups",
  "_Manage_NotificationEmailConfig",
  "_Manage_NotificationPreferences",
  "_Manage_LocationValidation"
];

const AdminMain = () => {
  const location = useLocation();
  const { hasPermission, hasAnyPermission, permissionsLoaded } = usePermissions();
  const canAccessAdmin = hasPermission(WEB_APP_PERMISSIONS.ADMIN) || hasAnyPermission(LEGACY_ADMIN_ACCESS_PERMISSIONS);

  if (!permissionsLoaded) {
    return null;
  }

  if (!canAccessAdmin) {
    return <Navigate to="/home" replace />;
  }

  return (
    <AdminLayout currentPath={location.pathname}>
      <Routes>
        {/* Admin Dashboard - default route */}
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />

        {/* Access Control Routes */}
        <Route path="users" element={<UserPage />} />
        <Route path="users/*" element={<UserPage />} />
        <Route path="users/:id" element={<UserDetailsPage />} />
        <Route path="users/:id/activities" element={<UserActivitiesPage />} />
        <Route path="roles" element={<Rolepage />} />
        <Route path="roles/*" element={<Rolepage />} />
        <Route path="permissions" element={<PermissionTreeListNonEdit />} />
        <Route path="permissions/*" element={<PermissionTreeListNonEdit />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="navigation/*" element={<NavigationPage />} />
        <Route path="notification" element={<NotificationSystem />} />
        <Route path="notification/*" element={<NotificationSystem />} />
        <Route path="task-management" element={<TaskManagement />} />
        <Route path="task-management/*" element={<TaskManagement />} />

        {/* Provider Management */}
        <Route path="providers" element={<ProviderManagementMain />} />
        <Route path="providers/*" element={<ProviderManagementMain />} />

        {/* System Configuration Routes */}
        <Route path="tags" element={<Tagpage />} />
        <Route path="tags/*" element={<Tagpage />} />
        <Route path="sites" element={<SitePage />} />
        <Route path="sites/*" element={<SitePage />} />
        <Route path="tanks" element={<TankPage />} />
        <Route path="tanks/*" element={<TankPage />} />
        <Route path="ptsdevice" element={<DeviceDashboard />} />
        <Route path="ptsdevice/:deviceid/*" element={<PTSDeviceDetailPage />} />
        <Route path="ptsdevice/*" element={<DeviceDashboard />} />
        {/* ptsconfig routes removed - migrated to systemconfig */}
        <Route path="systemconfig" element={<SystemConfiguration />} />
        <Route path="systemconfig/*" element={<SystemConfiguration />} />

        {/* PTS Service Control Route */}
        <Route path="pts-service" element={<PTSServiceControl />} />
        <Route path="pts-service/*" element={<PTSServiceControl />} />

        {/* Log Management Route */}
        <Route path="logs" element={<LogManagementPage />} />
        <Route path="logs/*" element={<LogManagementPage />} />

        {/* Expected Fuel Average Management Route */}
        <Route
          path="expected-averages"
          element={<ExpectedAverageManagementPage />}
        />
        <Route
          path="expected-averages/*"
          element={<ExpectedAverageManagementPage />}
        />

        <Route
          path="employee-positions"
          element={<EmployeePositionManagementPage />}
        />
        <Route
          path="employee-positions/*"
          element={<EmployeePositionManagementPage />}
        />

        {/* Vehicle Transfer Checkup Templates Route */}
        <Route
          path="checkup-templates"
          element={<CheckupTemplateManagementPage />}
        />
        <Route
          path="checkup-templates/*"
          element={<CheckupTemplateManagementPage />}
        />

        {/* Fueling Rules Management Route */}
        <Route path="fueling-rules" element={<FuelingRulesMain />} />
        <Route path="fueling-rules/*" element={<FuelingRulesMain />} />

        {/* Location Validation Logs Route */}
        <Route
          path="location-validation"
          element={<LocationValidationLogPage />}
        />
        <Route
          path="location-validation/*"
          element={<LocationValidationLogPage />}
        />

        {/* Fallback route */}
        <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminMain;
