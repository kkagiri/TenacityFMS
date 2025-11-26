// Navigation helper for tank stock operations routes

export const getTankStockRoute = (subPath = '') => {
  const basePath = '/tankstock';
  if (!subPath) return basePath;
  return `${basePath}/${subPath}`;
};

export const tankStockRoutes = {
  dashboard: '/tankstock/dashboard',
  stockAnalytics: '/tankstock/stock-analytics',
  stockManagement: '/tankstock/stock-management',
  reconciliationControl: '/tankstock/reconciliation',
  transferReconciliation: '/tankstock/transfer-reconciliation',
  fuelDataComparison: '/tankstock/fueldatacomparison',
  settings: '/tankstock/settings'
};

// Helper to check if current path matches a route
export const isActiveRoute = (currentPath, targetPath) => {
  if (targetPath === '/tankstock/dashboard') {
    return currentPath === '/tankstock' || currentPath === '/tankstock/' || currentPath === '/tankstock/dashboard';
  }
  if (targetPath === '/tankstock/reconciliation') {
    return currentPath.startsWith('/tankstock/reconciliation');
  }
  if (targetPath === '/tankstock/fueldatacomparison') {
    return currentPath.startsWith('/tankstock/fueldatacomparison');
  }
  return currentPath.startsWith(targetPath);
};