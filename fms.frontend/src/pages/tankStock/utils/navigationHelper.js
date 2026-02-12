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
  automaticTankStock: '/tankstock/automatic-tank-stock',
  reconciliationControl: '/tankstock/reconciliation',
  fuelDataComparison: '/tankstock/fueldatacomparison',
  fuelAudit: '/tankstock/fuel-audit',
  volumeCorrection: '/tankstock/volume-correction',
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
  if (targetPath === '/tankstock/fuel-audit') {
    return currentPath.startsWith('/tankstock/fuel-audit');
  }
  if (targetPath === '/tankstock/volume-correction') {
    return currentPath.startsWith('/tankstock/volume-correction');
  }
  if (targetPath === '/tankstock/automatic-tank-stock') {
    return currentPath.startsWith('/tankstock/automatic-tank-stock');
  }
  return currentPath.startsWith(targetPath);
};