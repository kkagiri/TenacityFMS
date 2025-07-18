import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTankVolumeHistoryBySiteId, fetchTankVolumeHistoryByDateRange } from '../../../../redux/actions/tankVolumeHistoryActions';
import { fetchTanks } from '../../../../redux/actions/tankActions';
import { fetchSiteList } from '../../../../redux/actions/siteActions';
import { fetchDeliveriesbyDateRange, fetchDeliveriesbyDateRangebySiteId } from '../../../../redux/actions/DeliveryActions';
import { fetchConsumptionByDateRange, fetchConsumptionByDateRangebySitId } from '../../../../redux/actions/consumptionActions';
import {
  fetchTankStocks,
  fetchStockAdjustments,
  fetchStockDiscrepancies
} from '../../../../redux/actions/tankStockAction';
import notify from 'devextreme/ui/notify';

//Cursor - Optimized shared hook for managing stock data across all tank stock pages
export const useStockData = (selectedSite, dateRange) => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [initialDataLoaded, setInitialDataLoaded] = useState(false);
  const mountedRef = useRef(true);
  const lastFetchRef = useRef(null);

  // Redux selectors - only core data initially
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);
  const tanks = useSelector((state) => state.tank.tanks);
  const sites = useSelector((state) => state.site.sites);
  const deliveries = useSelector((state) => state.delivery.deliveries);
  const consumption = useSelector((state) => state.consumption.consumption);

  // Stock management selectors
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

  //Cursor - Only load essential data on first mount
  useEffect(() => {
    const loadInitialData = async () => {
      if (initialDataLoaded) return;

      setIsLoading(true);
      try {
        // Only load essential data for initial load
        const promises = [];
        if (sites.length === 0) {
          promises.push(dispatch(fetchSiteList()));
        }
        if (tanks.length === 0) {
          promises.push(dispatch(fetchTanks()));
        }

        if (promises.length > 0) {
          await Promise.allSettled(promises);
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

  // Stable fetch function for loading additional data when needed
  const fetchStockData = useCallback(async (siteId, dateRangeArray, loadAdvanced = false) => {
    if (!dateRangeArray || !Array.isArray(dateRangeArray) || dateRangeArray.length !== 2) {
      console.warn('Invalid date range provided to fetchStockData');
      return;
    }

    const fetchKey = `${siteId}-${dateRangeArray.join('|')}-${loadAdvanced}`;

    //Cursor - Prevent duplicate calls
    if (lastFetchRef.current === fetchKey) {
      console.log('Skipping duplicate fetch for:', fetchKey);
      return;
    }

    try {
      if (!mountedRef.current) return;

      setIsLoading(true);
      lastFetchRef.current = fetchKey;

      const [startDate, endDate] = dateRangeArray;

      console.log('Fetching stock data for:', { siteId, startDate, endDate, loadAdvanced });

      //Cursor - Core data promises
      const corePromises = [];

      if (siteId === 'all') {
        corePromises.push(
          dispatch(fetchTankVolumeHistoryByDateRange(startDate, endDate)),
          dispatch(fetchDeliveriesbyDateRange(startDate, endDate)),
          dispatch(fetchConsumptionByDateRange(startDate, endDate))
        );
      } else {
        corePromises.push(
          dispatch(fetchTankVolumeHistoryBySiteId(siteId, startDate, endDate)),
          dispatch(fetchDeliveriesbyDateRangebySiteId(siteId, startDate, endDate)),
          dispatch(fetchConsumptionByDateRangebySitId(siteId, startDate, endDate))
        );
      }

      // Execute core data fetch
      await Promise.allSettled(corePromises);

      //Cursor - Advanced data promises (only if requested)
      if (loadAdvanced) {
        const advancedPromises = [
          dispatch(fetchStockAdjustments({
            siteId: siteId === 'all' ? null : siteId,
            startDate,
            endDate
          })),
          dispatch(fetchStockDiscrepancies({
            siteId: siteId === 'all' ? null : siteId,
            threshold: 10
          })),
          dispatch(fetchTankStocks({
            siteId: siteId === 'all' ? null : siteId,
            startDate,
            endDate
          }))
        ];

        await Promise.allSettled(advancedPromises);
      }

      console.log('Stock data fetch completed for:', fetchKey);
    } catch (error) {
      console.error('Error fetching stock data:', error);
      if (mountedRef.current) {
        notify('Error loading stock data', 'error', 3000);
      }
    } finally {
      if (mountedRef.current) {
        setIsLoading(false);
      }
    }
  }, [dispatch]);

  // Manual refresh function
  const refreshData = useCallback(async (customDateRange) => {
    const targetDateRange = customDateRange || dateRange;

    if (targetDateRange && selectedSite) {
      // Reset fetch key to force refresh
      lastFetchRef.current = null;
      await fetchStockData(selectedSite, targetDateRange, true);
    }
  }, [fetchStockData, selectedSite, dateRange]);

  // Load advanced data for management features
  const loadAdvancedData = useCallback(async () => {
    if (dateRange && selectedSite) {
      await fetchStockData(selectedSite, dateRange, true);
    }
  }, [fetchStockData, selectedSite, dateRange]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  //Cursor - Memoized processed data to avoid recalculation
  const processedData = useMemo(() => {
    return {
      // Analytics data
      analyticsData: {
        volumeHistory: tankVolumeHistory || [],
        consumption: consumption || [],
        deliveries: deliveries || [],
        tanks: tanks || []
      },

      // Reconciliation data
      reconciliationData: reduxReconciliationData || {
        discrepancies: stockDiscrepancies || [],
        adjustments: stockAdjustments || [],
        summary: {
          totalDiscrepancies: (stockDiscrepancies || []).length,
          totalAdjustments: (stockAdjustments || []).length,
          pendingReconciliations: 0
        }
      },

      // Management data
      adjustments: stockAdjustments || [],

      // System configuration
      systemConfig: {
        autoReconciliation: false,
        discrepancyThreshold: 10,
        approvalRequired: true
      },

      // Reports data
      reports: reduxReports || [],

      // Forecasting data
      forecasts: {
        consumptionTrend: [],
        stockProjections: [],
        deliverySchedule: []
      },

      // KPI metrics
      kpiMetrics: {
        stockAccuracy: 95,
        reconciliationRate: 98,
        averageDiscrepancy: 2.5,
        totalAdjustments: (stockAdjustments || []).length
      }
    };
  }, [
    tankVolumeHistory,
    consumption,
    deliveries,
    tanks,
    stockAdjustments,
    stockDiscrepancies,
    reduxReconciliationData,
    reduxReports
  ]);

  return {
    // Loading states
    isLoading: isLoading || adjustmentsLoading || discrepanciesLoading || reconciliationLoading || reportsLoading,

    // Core data
    tankVolumeHistory: tankVolumeHistory || [],
    tanks: tanks || [],
    sites: sites || [],
    deliveries: deliveries || [],
    consumption: consumption || [],

    // Stock management data
    tankStocks: tankStocks || [],
    stockAdjustments: stockAdjustments || [],
    stockDiscrepancies: stockDiscrepancies || [],

    // Processed data
    ...processedData,

    // Functions
    refreshData,
    loadAdvancedData,

    // Error state
    error: stockError
  };
};
