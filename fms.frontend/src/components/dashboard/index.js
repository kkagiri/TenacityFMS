import Dashboard from "./Dashboard";
// import RoleBasedDashboard from "./RoleBasedDashboard"; // Removed - using RealtimeDashboard instead

import { QuickActionButtons } from "./QuickActionButtons";
import { RoleTicker } from "./widget/RoleTicker";
import { StockManagementActions } from "./widget/StockManagementActions";

//claude - export all dashboard components including role-based components

export {
  Dashboard as default,
  // RoleBasedDashboard, // Removed - using RealtimeDashboard instead
  QuickActionButtons,
  RoleTicker,
  StockManagementActions,
};
