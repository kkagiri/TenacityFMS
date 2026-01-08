import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useLocation } from "react-router-dom";
import AdminLayout from "./layout/AdminLayout";
import AdminDashboard from "./AdminDashboard";

// Import the existing component pages to be used in admin routes
import UserPage from "../user/userPage";
import Rolepage from "../Role/rolepage";
import PermissionTreeList from "../../components/PermissionTreeList/permissionTreeList";
import NavigationPage from "../Navigation/NavigationPage";
import Tagpage from "../tag/tagPage";
import SitePage from "../site/sitePage";
import TankPage from "../tank/tankPage";
import DeviceDashboard from "../PTSDevice/DeviceDashboard";
import PTSDeviceDetailPage from "../PTSDevice/PTSDeviceDetail/PTSDeviceDetailPage";
import PTSAutomationConfigPage from "../PTSAutomationConfig/PTSAutomationConfigPage";
import ConfigurationPage from "./configuration";
import SystemConfiguration from "./systemConfig/SystemConfigPage";
import PTSServiceControl from "./ptsService/PTSServiceControl";
import NotificationSettings from "./notification-settings/NotificationSettings";
import ProviderManagementMain from "../providermanagement/ProviderManagementMain";
import TaskManagement from "../taskManagement";
import LogManagementPage from "./logManagement/LogManagementPage";
import ExpectedAverageManagementPage from "./expectedaverages/ExpectedAverageManagementPage";
import { FuelingRulesMain } from "./fuelingRules";
import { LocationValidationLogPage } from "./locationValidation";

const AdminMain = () => {
  const location = useLocation();

  return (
    <AdminLayout currentPath={location.pathname}>
      <Routes>
        {/* Admin Dashboard - default route */}
        <Route index element={<AdminDashboard />} />
        <Route path="dashboard" element={<AdminDashboard />} />

        {/* Access Control Routes */}
        <Route path="users" element={<UserPage />} />
        <Route path="users/*" element={<UserPage />} />
        <Route path="roles" element={<Rolepage />} />
        <Route path="roles/*" element={<Rolepage />} />
        <Route path="permissions" element={<PermissionTreeList />} />
        <Route path="permissions/*" element={<PermissionTreeList />} />
        <Route path="navigation" element={<NavigationPage />} />
        <Route path="navigation/*" element={<NavigationPage />} />
        <Route path="notifications" element={<NotificationSettings />} />
        <Route path="notifications/*" element={<NotificationSettings />} />
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
        <Route path="ptsdevice/:deviceid" element={<PTSDeviceDetailPage />} />
        <Route path="ptsdevice/*" element={<DeviceDashboard />} />
        <Route path="ptsconfig" element={<PTSAutomationConfigPage />} />
        <Route path="ptsconfig/*" element={<PTSAutomationConfigPage />} />
        <Route path="systemconfig" element={<SystemConfiguration />} />
        <Route path="systemconfig/*" element={<SystemConfiguration />} />
        <Route path="configuration" element={<ConfigurationPage />} />
        <Route path="configuration/*" element={<ConfigurationPage />} />

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
