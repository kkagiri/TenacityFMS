import { useState, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTankVolumeHistoryBySiteId, fetchTankVolumeHistoryByDateRange } from '../../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchDeliveriesbyDateRange, fetchDeliveriesbyDateRangebySiteId } from '../../../../redux/actions/DeliveryActions';
import { fetchConsumptionByDateRange, fetchConsumptionByDateRangebySitId } from '../../../../redux/actions/consumptionActions';
import notify from 'devextreme/ui/notify';

//Cursor - Shared hook for managing stock data across all tank stock pages
export const useStockData = (selectedSite, dateRange) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(true);

  // Redux selectors
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const deliveries = useSelector((state) => state.delivery.deliveries);
  const consumption = useSelector((state) => state.consumption.consumption);

  const refreshData = useCallback(async (customDateRange = dateRange) => {
    try {
      setIsLoading(true);
      const [startDate, endDate] = customDateRange;

      // Fetch data based on site selection
      if (selectedSite === 'all') {
        await Promise.all([
          dispatch(fetchTankVolumeHistoryByDateRange(startDate, endDate)),
          dispatch(fetchConsumptionByDateRange(startDate, endDate)),
          dispatch(fetchDeliveriesbyDateRange(startDate, endDate))
        ]);
      } else {
        await Promise.all([
          dispatch(fetchTankVolumeHistoryBySiteId(startDate, endDate, selectedSite)),
          dispatch(fetchConsumptionByDateRangebySitId(startDate, endDate, selectedSite)),
          dispatch(fetchDeliveriesbyDateRangebySiteId(startDate, endDate, selectedSite))
        ]);
      }

      // Fetch static data
      await Promise.all([
        dispatch(fetchTanks()),
        dispatch(fetchSiteList())
      ]);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      notify('Error fetching data', 'error', 3000);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, selectedSite, dateRange]);

  // Initial data fetch
  useEffect(() => {
    refreshData();
  }, [refreshData]);

  // Computed data for dashboard
  const tankLevels = tanks.filter(tank =>
    selectedSite === 'all' || tank.siteId === selectedSite
  ).map(tank => ({
    ...tank,
    fillPercentage: tank.tankVolume > 0 ? (tank.currentStock / tank.tankVolume) * 100 : 0,
    status: tank.currentStock <= tank.lowStockThreshold ? 'critical' :
            tank.currentStock <= tank.mediumStockThreshold ? 'warning' : 'normal'
  }));

  // Critical alerts computation
  const criticalAlerts = tankLevels
    .filter(tank => tank.status === 'critical')
    .map(tank => ({
      id: tank.id,
      type: 'LOW_STOCK',
      severity: 'critical',
      message: `Tank ${tank.name} at ${tank.siteName} is critically low (${tank.currentStock}L)`,
      timestamp: new Date(),
      tankId: tank.id,
      siteId: tank.siteId
    }));

  // Site metrics computation
  const siteMetrics = sites.reduce((acc, site) => {
    if (selectedSite === 'all' || site.id === selectedSite) {
      const siteTanks = tanks.filter(tank => tank.siteId === site.id);
      const totalCapacity = siteTanks.reduce((sum, tank) => sum + tank.tankVolume, 0);
      const currentStock = siteTanks.reduce((sum, tank) => sum + tank.currentStock, 0);
      const criticalTanks = siteTanks.filter(tank => tank.currentStock <= tank.lowStockThreshold).length;

      acc[site.id] = {
        siteId: site.id,
        siteName: site.name,
        totalCapacity,
        currentStock,
        fillPercentage: totalCapacity > 0 ? (currentStock / totalCapacity) * 100 : 0,
        tankCount: siteTanks.length,
        criticalTanks,
        status: criticalTanks > 0 ? 'critical' : currentStock / totalCapacity < 0.3 ? 'warning' : 'normal'
      };
    }
    return acc;
  }, {});

  // Analytics data computation
  const analyticsData = {
    volumeHistory: tankVolumeHistory,
    deliveries: deliveries,
    consumption: consumption,
    trends: {
      stockLevels: tankVolumeHistory,
      deliveryVolumes: deliveries,
      consumptionRates: consumption
    }
  };

  // Reports placeholder (will be expanded in later phases)
  const reports = {
    stockSummary: [],
    varianceAnalysis: [],
    tankUtilization: [],
    stockMovement: []
  };

  // Forecasts placeholder (will be expanded in later phases)
  const forecasts = {
    stockDepletion: {},
    optimalReorder: {},
    seasonalTrends: {}
  };

  // KPI metrics computation
  const kpiMetrics = {
    totalStock: tanks.reduce((sum, tank) =>
      (selectedSite === 'all' || tank.siteId === selectedSite) ? sum + tank.currentStock : sum, 0),
    totalCapacity: tanks.reduce((sum, tank) =>
      (selectedSite === 'all' || tank.siteId === selectedSite) ? sum + tank.tankVolume : sum, 0),
    averageFillRate: tankLevels.length > 0 ?
      tankLevels.reduce((sum, tank) => sum + tank.fillPercentage, 0) / tankLevels.length : 0,
    criticalTankCount: criticalAlerts.length,
    totalDeliveries: deliveries.length,
    totalConsumption: consumption.reduce((sum, cons) => sum + (cons.volume || 0), 0)
  };

  // Transactions placeholder (will be expanded in later phases)
  const transactions = tankVolumeHistory.map(history => ({
    ...history,
    type: 'VOLUME_HISTORY',
    transactionDate: history.date,
    amount: history.volume
  }));

  // Reconciliation data placeholder (will be expanded in later phases)
  const reconciliationData = {
    discrepancies: [],
    pendingReconciliations: [],
    completedReconciliations: []
  };

  // Adjustments placeholder (will be expanded in later phases)
  const adjustments = [];

  // System configuration placeholder (will be expanded in later phases)
  const systemConfig = {
    alertThresholds: {},
    automationRules: {},
    reportSettings: {}
  };

  return {
    isLoading,
    refreshData,
    // Dashboard data
    tankLevels,
    criticalAlerts,
    siteMetrics,
    // Analytics data
    analyticsData,
    reports,
    forecasts,
    kpiMetrics,
    // Management data
    transactions,
    reconciliationData,
    adjustments,
    systemConfig,
    // Raw data
    tankVolumeHistory,
    tanks,
    sites,
    deliveries,
    consumption
  };
};