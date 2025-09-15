/**
 * Enhanced Widget Data Hook
 * Manages widget data acquisition using both legacy and factory systems
 */
import { useState, useEffect, useCallback, useRef } from 'react';
import widgetFactoryService from '../services/widgetFactoryService';
import axiosInstance from '../services/axiosConfig';

const useEnhancedWidgetData = (widgetInstance, options = {}) => {
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [factoryMetadata, setFactoryMetadata] = useState(null);

  const abortControllerRef = useRef(null);
  const retryCountRef = useRef(0);

  const {
    enableAutoRefresh = false,
    refreshInterval = 30000, // 30 seconds
    maxRetries = 3,
    useFactory = 'auto', // 'auto', 'always', 'never'
    fallbackToLegacy = true,
    onDataUpdate = null,
    onError = null
  } = options;

  /**
   * Determine if widget should use factory system
   */
  const shouldUseFactorySystem = useCallback(() => {
    if (useFactory === 'always') return true;
    if (useFactory === 'never') return false;

    // Auto mode - check widget compatibility
    return widgetInstance && widgetFactoryService.shouldUseFactory(widgetInstance);
  }, [widgetInstance, useFactory]);

  /**
   * Fetch data using Widget Factory system
   */
  const fetchViaFactory = useCallback(async (overrides = {}) => {
    try {
      console.log('useEnhancedWidgetData: Fetching via factory for widget', widgetInstance.id);

      const request = widgetFactoryService.buildRequestFromInstance(widgetInstance, overrides);
      if (!request) {
        throw new Error('Failed to build factory request');
      }

      const result = await widgetFactoryService.getWidgetData(request);

      if (result.success) {
        setData(result.data);
        setFactoryMetadata({
          processedFilters: result.processedFilters,
          processedSettings: result.processedSettings,
          aggregationType: result.aggregationType,
          dataQueryType: result.dataQueryType,
          metadata: result.metadata
        });
        setLastUpdated(new Date(result.timestamp));
        setError(null);
        retryCountRef.current = 0;

        if (onDataUpdate) {
          onDataUpdate(result.data, { source: 'factory', metadata: factoryMetadata });
        }

        return result.data;
      } else {
        throw new Error(result.error || 'Factory request failed');
      }
    } catch (error) {
      console.error('useEnhancedWidgetData: Factory fetch error', error);
      throw error;
    }
  }, [widgetInstance, onDataUpdate, factoryMetadata]);

  /**
   * Fetch data using legacy system
   */
  const fetchViaLegacy = useCallback(async () => {
    try {
      console.log('useEnhancedWidgetData: Fetching via legacy for widget', widgetInstance.id);

      // Cancel any existing request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      const response = await axiosInstance.get(
        `/dashboard/widgets/${widgetInstance.id}/data`,
        { signal: abortControllerRef.current.signal }
      );

      if (response.data && response.data.success) {
        setData(response.data.data);
        setFactoryMetadata(null); // Clear factory metadata for legacy data
        setLastUpdated(new Date());
        setError(null);
        retryCountRef.current = 0;

        if (onDataUpdate) {
          onDataUpdate(response.data.data, { source: 'legacy' });
        }

        return response.data.data;
      } else {
        throw new Error(response.data?.message || 'Legacy request failed');
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('useEnhancedWidgetData: Request aborted');
        return null;
      }
      console.error('useEnhancedWidgetData: Legacy fetch error', error);
      throw error;
    }
  }, [widgetInstance, onDataUpdate]);

  /**
   * Main data fetching function with fallback logic
   */
  const fetchData = useCallback(async (overrides = {}) => {
    if (!widgetInstance || !widgetInstance.id) {
      setError(new Error('Invalid widget instance'));
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let fetchedData = null;

      // Determine which system to use
      const useFactory = shouldUseFactorySystem();

      if (useFactory) {
        try {
          fetchedData = await fetchViaFactory(overrides);
        } catch (factoryError) {
          console.warn('useEnhancedWidgetData: Factory failed, attempting fallback', factoryError);

          if (fallbackToLegacy) {
            try {
              fetchedData = await fetchViaLegacy();
              console.log('useEnhancedWidgetData: Successfully fell back to legacy system');
            } catch (legacyError) {
              console.error('useEnhancedWidgetData: Both factory and legacy failed', {
                factoryError,
                legacyError
              });
              throw new Error(`Factory failed: ${factoryError.message}. Legacy fallback failed: ${legacyError.message}`);
            }
          } else {
            throw factoryError;
          }
        }
      } else {
        fetchedData = await fetchViaLegacy();
      }

      return fetchedData;

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      setError(errorObj);

      if (onError) {
        onError(errorObj, { widgetId: widgetInstance.id, retryCount: retryCountRef.current });
      }

      // Implement retry logic
      if (retryCountRef.current < maxRetries) {
        retryCountRef.current++;
        console.log(`useEnhancedWidgetData: Retrying (${retryCountRef.current}/${maxRetries}) for widget ${widgetInstance.id}`);

        setTimeout(() => {
          fetchData(overrides);
        }, Math.pow(2, retryCountRef.current) * 1000); // Exponential backoff
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [widgetInstance, shouldUseFactorySystem, fetchViaFactory, fetchViaLegacy, fallbackToLegacy, maxRetries, onError]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback((overrides = {}) => {
    retryCountRef.current = 0; // Reset retry count on manual refresh
    return fetchData(overrides);
  }, [fetchData]);

  /**
   * Update widget configuration and refetch
   */
  const updateConfiguration = useCallback((newConfig) => {
    return refresh({
      filters: newConfig.filters,
      settings: newConfig.settings,
      timeRange: newConfig.timeRange,
      mode: newConfig.mode
    });
  }, [refresh]);

  // Initial data fetch
  useEffect(() => {
    if (widgetInstance && widgetInstance.id) {
      fetchData();
    }

    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [widgetInstance, fetchData]); // Re-fetch when widget changes or fetchData changes

  // Auto-refresh logic
  useEffect(() => {
    if (!enableAutoRefresh || !widgetInstance || isLoading) {
      return;
    }

    const interval = setInterval(() => {
      fetchData();
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [enableAutoRefresh, refreshInterval, widgetInstance, isLoading, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    data,
    isLoading,
    error,
    lastUpdated,
    factoryMetadata,
    refresh,
    updateConfiguration,
    isUsingFactory: shouldUseFactorySystem(),
    retryCount: retryCountRef.current
  };
};

export default useEnhancedWidgetData;
