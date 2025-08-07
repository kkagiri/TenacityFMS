import { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchTankVolumeHistoryFiltered } from '../../../../redux/actions/tankVolumeHistoryActions';

/**
 * Hook for managing tank volume history with advanced filtering
 * Specifically optimized for the /api/tankvolumehistory/filtered endpoint
 */
export const useTankVolumeHistory = (initialFilters = {}) => {
  const dispatch = useDispatch();

  // Redux state
  const {
    tankVolumeHistory,
    loading,
    error
  } = useSelector(state => state.tankVolumeHistory);

  // Local state for filters
  const [filters, setFilters] = useState({
    siteId: null,
    tankId: null,
    startDate: null,
    endDate: null,
    includeVehicleNames: true,
    take: 100,
    ...initialFilters
  });

  // Loading and error states
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [lastFetchTime, setLastFetchTime] = useState(null);

  // Fetch data function
  const fetchData = useCallback(async (customFilters = {}) => {
    const finalFilters = { ...filters, ...customFilters };

    try {
      console.log('🔄 Fetching tank volume history with filters:', finalFilters);

      const result = await dispatch(fetchTankVolumeHistoryFiltered(finalFilters));
      setLastFetchTime(new Date());

      if (isInitialLoad) {
        setIsInitialLoad(false);
      }

      return result;
    } catch (error) {
      console.error('❌ Error fetching tank volume history:', error);
      throw error;
    }
  }, [dispatch, filters, isInitialLoad]);

  // Update filters function
  const updateFilters = useCallback((newFilters) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  // Fetch data for specific site and date range (your use case)
  const fetchForSiteAndDateRange = useCallback(async (siteId, startDate, endDate, includeVehicleNames = true) => {
    const filters = {
      siteId: siteId === 'all' ? null : siteId,
      startDate: typeof startDate === 'string' ? startDate : startDate?.toISOString()?.split('T')[0],
      endDate: typeof endDate === 'string' ? endDate : endDate?.toISOString()?.split('T')[0],
      includeVehicleNames,
      take: 200
    };

    console.log('📊 Fetching tank volume for site:', siteId, 'date range:', startDate, 'to', endDate);

    return await fetchData(filters);
  }, [fetchData]);

  // Fetch data for specific tank
  const fetchForTank = useCallback(async (tankId, startDate = null, endDate = null) => {
    const filters = {
      tankId,
      startDate,
      endDate,
      includeVehicleNames: true,
      take: 100
    };

    return await fetchData(filters);
  }, [fetchData]);

  // Real-time refresh function
  const refreshData = useCallback(() => {
    return fetchData();
  }, [fetchData]);

  // Memoized processed data
  const processedData = useMemo(() => {
    if (!tankVolumeHistory || !Array.isArray(tankVolumeHistory)) {
      return [];
    }

    return tankVolumeHistory.map(record => ({
      ...record,
      // Normalize timestamp field
      timestamp: record.timestamp || record.Timestamp,
      // Normalize volume fields
      newVolume: record.newVolume ?? record.NewVolume,
      volumeChange: record.volumeChange ?? record.VolumeChange,
      // Normalize other fields
      changeReason: record.changeReason ?? record.ChangeReason,
      vehicleName: record.vehicleName ?? record.VehicleName,
      referenceType: record.referenceType ?? record.ReferenceType,
      recordedBy: record.recordedBy ?? record.RecordedBy,
      // Add computed fields
      isDispensing: (record.changeReason ?? record.ChangeReason) === 6, // Dispensing
      hasVehicle: !!(record.vehicleName ?? record.VehicleName),
      formattedTimestamp: new Date(record.timestamp || record.Timestamp).toLocaleString(),
      formattedVolume: `${(record.newVolume ?? record.NewVolume)?.toFixed(2) || '0.00'} L`,
      volumeChangeFormatted: `${(record.volumeChange ?? record.VolumeChange) > 0 ? '+' : ''}${(record.volumeChange ?? record.VolumeChange)?.toFixed(2) || '0.00'} L`
    }));
  }, [tankVolumeHistory]);

  // Filter data by criteria
  const filterData = useCallback((criteria = {}) => {
    return processedData.filter(record => {
      if (criteria.hasVehicleOnly && !record.hasVehicle) return false;
      if (criteria.dispensingOnly && !record.isDispensing) return false;
      if (criteria.tankId && record.tankId !== criteria.tankId) return false;
      if (criteria.changeReason && record.changeReason !== criteria.changeReason) return false;
      return true;
    });
  }, [processedData]);

  // Statistics
  const statistics = useMemo(() => {
    const data = processedData;

    if (!data.length) {
      return {
        totalRecords: 0,
        dispensingRecords: 0,
        recordsWithVehicles: 0,
        totalVolumeChange: 0,
        averageVolumeChange: 0,
        dateRange: null
      };
    }

    const dispensingRecords = data.filter(r => r.isDispensing).length;
    const recordsWithVehicles = data.filter(r => r.hasVehicle).length;
    const totalVolumeChange = data.reduce((sum, r) => sum + (r.volumeChange || 0), 0);
    const timestamps = data.map(r => new Date(r.timestamp)).sort();

    return {
      totalRecords: data.length,
      dispensingRecords,
      recordsWithVehicles,
      totalVolumeChange,
      averageVolumeChange: totalVolumeChange / data.length,
      dateRange: timestamps.length > 0 ? {
        start: timestamps[0],
        end: timestamps[timestamps.length - 1]
      } : null
    };
  }, [processedData]);

  // Auto-fetch on mount or filter changes
  useEffect(() => {
    if (isInitialLoad) {
      fetchData();
    }
  }, [fetchData, isInitialLoad]);

  return {
    // Data
    data: processedData,
    rawData: tankVolumeHistory,

    // States
    loading,
    error,
    isInitialLoad,
    lastFetchTime,

    // Filters
    filters,
    updateFilters,

    // Actions
    fetchData,
    fetchForSiteAndDateRange,
    fetchForTank,
    refreshData,
    filterData,

    // Statistics
    statistics,

    // Utilities
    isEmpty: !processedData.length,
    hasData: processedData.length > 0,
    isConnected: !error && !loading // Simplified connection status
  };
};

export default useTankVolumeHistory;
