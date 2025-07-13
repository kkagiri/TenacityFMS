import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTankVolumeHistoryBySiteId, fetchTankVolumeHistoryByDateRange } from '../../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchDeliveriesbyDateRange, fetchDeliveriesbyDateRangebySiteId } from '../../../../redux/actions/DeliveryActions';
import { fetchConsumptionByDateRange, fetchConsumptionByDateRangebySitId } from '../../../../redux/actions/consumptionActions';
// New tank stock actions
import {
  fetchTankStocks,
  fetchStockAdjustments,
  fetchStockDiscrepancies
} from '../../../../redux/actions/tankStockAction';
import notify from 'devextreme/ui/notify';

//Cursor - Shared hook for managing stock data across all tank stock pages
//Cursor - Optimized for minimal initial loading and lazy loading of data
export const useStockData = (selectedSite, dateRange) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef(null);
  const prevDateRangeStringRef = useRef(null);

  // Redux selectors - only core data
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const deliveries = useSelector((state) => state.delivery.deliveries);
  const consumption = useSelector((state) => state.consumption.consumption);

  // New tank stock selectors
  const {
    tankStocks,
    stockAdjustments,
    stockDiscrepancies,
    reconciliationData: reduxReconciliationData,
    reports: reduxReports,
    adjustmentsLoading,
    discrepanciesLoading,
    reconciliationLoading,
    reportsLoading,
    error: stockError
  } = useSelector((state) => state.tankStock || {});

  //Cursor - Use refs to avoid dependency issues
  const selectedSiteRef = useRef(selectedSite);
  const dateRangeRef = useRef(dateRange);
  const fetchStockDataRef = useRef();

  // Update refs when props change
  useEffect(() => {
    selectedSiteRef.current = selectedSite;
  }, [selectedSite]);

  useEffect(() => {
    dateRangeRef.current = dateRange;
  }, [dateRange]);

  //Cursor - Convert dateRange to string for stable comparison
  const dateRangeString = useMemo(() => {
    if (!Array.isArray(dateRange) || dateRange.length !== 2) {
      return '';
    }
    const [start, end] = dateRange;
    if (!start || !end) {
      return '';
    }
    return `${start}|${end}`;
  }, [dateRange]);

  //Cursor - Only load essential data on first mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialDataLoaded) return;

      setIsLoading(true);
      try {
        // Only load essential data for initial load
        if (sites.length === 0) {
          await dispatch(fetchSiteList());
        }
        if (tanks.length === 0) {
          await dispatch(fetchTanks());
        }
        setInitialDataLoaded(true);
      } catch (error) {
        console.error('Error loading initial data:', error);
        if (mountedRef.current) {
          notify('Error loading initial data', 'error', 3000);
        }
      } finally {
        if (mountedRef.current) {
          setIsLoading(false);
        }
      }
    };

    loadInitialData();
  }, [dispatch, sites.length, tanks.length, initialDataLoaded]);

  // Stable fetch function that doesn't depend on changing props
  const fetchStockData = useCallback(async (siteId, dateRangeArray, forceRefresh = false) => {
    const fetchKey = `${siteId}-${Array.isArray(dateRangeArray) ? dateRangeArray.join('|') : ''}`;

    //Cursor - Prevent duplicate calls
    if (!forceRefresh && lastFetchRef.current === fetchKey) {
      console.log('Skipping duplicate fetch for:', fetchKey);
      return;
    }

    try {
      if (!mountedRef.current) return;

      setIsLoading(true);
      lastFetchRef.current = fetchKey;

      const [startDate, endDate] = Array.isArray(dateRangeArray) ? dateRangeArray : [];

      //Cursor - Validate dates before making API calls
      if (!startDate || !endDate) {
        console.error('Invalid date range:', { startDate, endDate });
        if (mountedRef.current) {
          notify('Invalid date range', 'error', 3000);
        }
        return;
      }

      console.log('Fetching stock data for:', { siteId, startDate, endDate });

      // Fetch data based on site selection
      const stockFilters = {
        siteId: siteId !== 'all' ? siteId : null,
        startDate,
        endDate
      };

      if (siteId === 'all') {
        await Promise.all([
          dispatch(fetchTankVolumeHistoryByDateRange(startDate, endDate)),
          dispatch(fetchConsumptionByDateRange(startDate, endDate)),
          dispatch(fetchDeliveriesbyDateRange(startDate, endDate)),
          // New stock management data
          dispatch(fetchTankStocks(stockFilters)),
          dispatch(fetchStockAdjustments(stockFilters)),
          dispatch(fetchStockDiscrepancies(stockFilters))
        ]);
      } else {
        await Promise.all([
          dispatch(fetchTankVolumeHistoryBySiteId(startDate, endDate, siteId)),
          dispatch(fetchConsumptionByDateRangebySitId(startDate, endDate, siteId)),
          dispatch(fetchDeliveriesbyDateRangebySiteId(startDate, endDate, siteId)),
          // New stock management data for specific site
          dispatch(fetchTankStocks(stockFilters)),
          dispatch(fetchStockAdjustments(stockFilters)),
          dispatch(fetchStockDiscrepancies(stockFilters))
        ]);
      }

      // Fetch static data less frequently
      await Promise.all([
        dispatch(fetchTanks()),
        dispatch(fetchSiteList())
      ]);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      if (mountedRef.current) {
        notify('Error fetching data. Please try again.', 'error', 3000);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dispatch]); // Only depend on dispatch

  // Store the fetch function in a ref to avoid useEffect dependency cycles
  fetchStockDataRef.current = fetchStockData;

  // Initial data fetch and when key parameters change
  useEffect(() => {
    // Only fetch if the dateRangeString actually changed
    if (dateRangeString !== prevDateRangeStringRef.current) {
      prevDateRangeStringRef.current = dateRangeString;

      // Use the ref to avoid dependency issues
      if (fetchStockDataRef.current) {
        fetchStockDataRef.current(selectedSite, dateRangeRef.current);
      }
    }
  }, [selectedSite, dateRangeString]); // Safe dependencies that won't cause cycles

  // Manual refresh function that forces a refetch
  const refreshData = useCallback(async (customDateRange) => {
    // Reset the fetch key to force a refresh
    lastFetchRef.current = null;

    const targetDateRange = customDateRange || dateRangeRef.current;
    const targetSite = selectedSiteRef.current;

    // Use the ref to avoid dependency issues
    if (fetchStockDataRef.current) {
      await fetchStockDataRef.current(targetSite, targetDateRange);
    }
  }, []); // No dependencies needed since we use refs

  //Cursor - Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  // Computed data for dashboard - memoized to prevent unnecessary recalculations
  const tankLevels = useMemo(() => {
    return tanks.filter(tank =>
      selectedSite === 'all' || tank.siteId === selectedSite
    ).map(tank => ({
      ...tank,
      id: String(tank.id), // Ensure ID is always a string
      fillPercentage: tank.tankVolume > 0 ? (tank.currentStock / tank.tankVolume) * 100 : 0,
      status: tank.currentStock <= tank.lowStockThreshold ? 'critical' :
              tank.currentStock <= tank.mediumStockThreshold ? 'warning' : 'normal'
    }));
  }, [tanks, selectedSite]);

  // Critical alerts computation - memoized to prevent constant re-renders
  const criticalAlerts = useMemo(() => {
    const currentTime = new Date(); // Create timestamp once per memoization
    return tankLevels
      .filter(tank => tank.status === 'critical')
      .map(tank => ({
        id: String(tank.id), // Ensure ID is always a string
        type: 'LOW_STOCK',
        severity: 'critical',
        message: `Tank ${tank.name} at ${tank.siteName} is critically low (${tank.currentStock}L)`,
        timestamp: currentTime, // Use the stable timestamp
        tankId: String(tank.id), // Ensure tankId is always a string
        siteId: tank.siteId
      }));
  }, [tankLevels]); // Only depends on tankLevels

  // Site metrics computation - memoized to prevent unnecessary recalculations
  const siteMetrics = useMemo(() => {
    return sites.reduce((acc, site) => {
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
          averageStockLevel: totalCapacity > 0 ? (currentStock / totalCapacity) * 100 : 0, // Add missing property
          tankCount: siteTanks.length,
          criticalTanks,
          status: criticalTanks > 0 ? 'critical' : currentStock / totalCapacity < 0.3 ? 'warning' : 'normal'
        };
      }
      return acc;
    }, {});
  }, [sites, tanks, selectedSite]); // Proper dependencies

  // Analytics data computation - memoized
  const analyticsData = useMemo(() => ({
    volumeHistory: tankVolumeHistory,
    deliveries: deliveries,
    consumption: consumption,
    trends: {
      stockLevels: tankVolumeHistory,
      deliveryVolumes: deliveries,
      consumptionRates: consumption
    }
  }), [tankVolumeHistory, deliveries, consumption]);

  // Reports placeholder (will be expanded in later phases) - memoized
  const reports = useMemo(() => ({
    stockSummary: [],
    varianceAnalysis: [],
    tankUtilization: [],
    stockMovement: []
  }), []);

  // Forecasts placeholder (will be expanded in later phases) - memoized
  const forecasts = useMemo(() => ({
    stockDepletion: {},
    optimalReorder: {},
    seasonalTrends: {}
  }), []);

  // KPI metrics computation - memoized
  const kpiMetrics = useMemo(() => ({
    totalStock: tanks.reduce((sum, tank) =>
      (selectedSite === 'all' || tank.siteId === selectedSite) ? sum + tank.currentStock : sum, 0),
    totalCapacity: tanks.reduce((sum, tank) =>
      (selectedSite === 'all' || tank.siteId === selectedSite) ? sum + tank.tankVolume : sum, 0),
    averageFillRate: tankLevels.length > 0 ?
      tankLevels.reduce((sum, tank) => sum + tank.fillPercentage, 0) / tankLevels.length : 0,
    criticalTankCount: criticalAlerts.length,
    totalDeliveries: deliveries.length,
    totalConsumption: consumption.reduce((sum, cons) => sum + (cons.volume || 0), 0)
  }), [tanks, tankLevels, criticalAlerts, deliveries, consumption, selectedSite]);

  // Transactions placeholder (will be expanded in later phases) - memoized
  const transactions = useMemo(() => tankVolumeHistory.map(history => ({
    ...history,
    type: 'VOLUME_HISTORY',
    transactionDate: history.date,
    amount: history.volume
  })), [tankVolumeHistory]);

  // Reconciliation data placeholder (will be expanded in later phases) - memoized
  const reconciliationData = useMemo(() => ({
    discrepancies: [],
    pendingReconciliations: [],
    completedReconciliations: []
  }), []);

  // Adjustments placeholder (will be expanded in later phases) - memoized
  const adjustments = useMemo(() => [], []);

  // System configuration placeholder (will be expanded in later phases) - memoized
  const systemConfig = useMemo(() => ({
    alertThresholds: {},
    automationRules: {},
    reportSettings: {}
  }), []);

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
    // New stock management data from Redux
    tankStocks: tankStocks || [],
    stockAdjustments: stockAdjustments || [],
    stockDiscrepancies: stockDiscrepancies || [],
    reduxReconciliationData: reduxReconciliationData || [],
    reduxReports: reduxReports || [],
    // Loading states
    stockLoading: adjustmentsLoading || discrepanciesLoading || reconciliationLoading || reportsLoading,
    stockError,
    // Raw data
    tankVolumeHistory,
    tanks,
    sites,
    deliveries,
    consumption
  };
};