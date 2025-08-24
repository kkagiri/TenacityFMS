import Dashboard from "./Dashboard";
import RoleBasedDashboard from "./RoleBasedDashboard";
import { DashboardFilters } from "./DashboardFilters";
import { StatsCards } from "./StatsCards";
import { FuelEfficiency } from "./FuelEfficiency";
import { WeeklyPerformance } from "./WeeklyPerformance";
import { FuelManagement } from "./FuelManagement";
import { IssueTracking } from "./IssueTracking";
import { TankLevels } from "./TankLevels";
import { PumpStatus } from "./PumpStatus";
import { SystemModules } from "./SystemModules";
import { QuickActionButtons } from "./QuickActionButtons";
import { RoleTicker } from "./RoleTicker";
import { StockManagementActions } from "./StockManagementActions";

//claude - export all dashboard components including role-based components

export {
  Dashboard as default,
  RoleBasedDashboard,
  DashboardFilters,
  StatsCards,
  FuelEfficiency,
  WeeklyPerformance,
  FuelManagement,
  IssueTracking,
  TankLevels,
  PumpStatus,
  SystemModules,
  QuickActionButtons,
  RoleTicker,
  StockManagementActions,
};
