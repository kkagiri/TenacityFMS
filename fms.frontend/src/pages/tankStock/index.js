//Cursor - Tank Stock Pages Index - Phase 1 Implementation
// Main Entry Point
export { default as TankStockMain } from './TankStockMain';

// Main Pages
export { default as TankStockPage } from './tankStockPage';
export { default as TankStockDashboard } from './dashboard/EnhancedTankStockDashboard'; // Enhanced dashboard as main dashboard
export { default as EnhancedTankStockDashboard } from './dashboard/EnhancedTankStockDashboard';
export { default as StockAnalytics } from './analytics/StockAnalytics';
export { default as StockManagement } from './management/StockManagement';
export { default as ReconciliationMissionControl } from './reconciliation/ReconciliationMissionControl';
export { default as TankStockSettings } from './settings/TankStockSettings';

// Layout
export { default as TankStockLayout } from './layout/TankStockLayout';

// Components
export { TankStockToolbar } from './components/toolbar/TankStockToolbar';

// Shared Components
export { default as StockMetricCard } from './shared/components/StockMetricCard';

// Hooks
export { useStockData } from './shared/hooks/useStockData';