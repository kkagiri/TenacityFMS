import { useState, useEffect, useCallback, useRef } from 'react';
import axiosInstance from '../../../api/axiosInstance';

/**
 * Custom hook for real-time stock validation before saving
 * Calculates expected stock and provides variance information
 *
 * @param {number} tankId - Tank ID for validation
 * @param {Date|string} timestamp - Timestamp of the stock entry
 * @param {string} stockType - Type of stock entry ('Opening' or 'Closing')
 * @param {number} enteredValue - User-entered stock value
 * @param {boolean} enabled - Whether validation is enabled (to prevent unnecessary API calls)
 * @returns {Object} Validation state with expected stock, variance, and loading status
 */
export const useStockValidation = (tankId, timestamp, stockType = 'Closing', enteredValue, enabled = true) => {
  const [validationState, setValidationState] = useState({
    expectedStock: null,
    breakdown: null,
    variance: null,
    variancePercentage: null,
    isWithinThreshold: null,
    severity: null, // 'acceptable', 'moderate', 'high'
    loading: false,
    error: null,
    hasData: false,
    message: null
  });

  const debounceTimerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      // Cleanup timers and abort controllers on unmount
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const fetchExpectedStock = useCallback(async () => {
    // Validate inputs before making API call
    if (!tankId || !timestamp || !enabled) {
      setValidationState(prev => ({
        ...prev,
        hasData: false,
        loading: false
      }));
      return;
    }

    // Cancel any pending request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    try {
      if (!isMountedRef.current) return;

      setValidationState(prev => ({
        ...prev,
        loading: true,
        error: null
      }));

      // Format timestamp for API (ISO 8601 format)
      const formattedTimestamp = timestamp instanceof Date
        ? timestamp.toISOString()
        : new Date(timestamp).toISOString();

      // Build query parameters
      const params = new URLSearchParams({
        tankId: tankId.toString(),
        timestamp: formattedTimestamp,
        stockType: stockType
      });

      // Make API call to expected-stock endpoint
      const response = await axiosInstance.get(
        `/tankstock/expected-stock?${params.toString()}`,
        { signal: abortControllerRef.current.signal }
      );

      if (!isMountedRef.current) return;

      // Handle FMSResponse wrapper
      if (response.data && response.data.isSuccess) {
        const data = response.data.data;

        // Calculate variance if user has entered a value
        let variance = null;
        let variancePercentage = null;
        let severity = null;
        let isWithinThreshold = null;

        if (enteredValue != null && data.expectedStock != null) {
          variance = enteredValue - data.expectedStock;
          variancePercentage = data.expectedStock !== 0
            ? (Math.abs(variance) / data.expectedStock) * 100
            : 0;

          // Determine severity based on thresholds
          const thresholds = data.thresholds || {};
          const percentageThreshold = thresholds.percentageThreshold || 5;
          const absoluteThreshold = thresholds.absoluteLitersThreshold || 50;

          const absVariance = Math.abs(variance);

          if (absVariance <= absoluteThreshold || variancePercentage <= percentageThreshold) {
            severity = 'acceptable'; // Green
            isWithinThreshold = true;
          } else if (variancePercentage <= percentageThreshold * 2) {
            severity = 'moderate'; // Yellow
            isWithinThreshold = false;
          } else {
            severity = 'high'; // Red
            isWithinThreshold = false;
          }
        }

        setValidationState({
          expectedStock: data.expectedStock,
          breakdown: data.breakdown,
          variance,
          variancePercentage,
          isWithinThreshold,
          severity,
          loading: false,
          error: null,
          hasData: data.hasPreviousStock,
          message: data.message,
          thresholds: data.thresholds
        });
      } else {
        // API returned non-success response
        setValidationState(prev => ({
          ...prev,
          loading: false,
          error: response.data?.message || 'Failed to fetch expected stock',
          hasData: false
        }));
      }
    } catch (err) {
      if (err.name === 'AbortError' || err.name === 'CanceledError') {
        // Request was cancelled, ignore
        return;
      }

      if (!isMountedRef.current) return;

      console.error('Error fetching expected stock:', err);
      setValidationState(prev => ({
        ...prev,
        loading: false,
        error: err.response?.data?.message || err.message || 'Network error',
        hasData: false
      }));
    }
  }, [tankId, timestamp, stockType, enteredValue, enabled]);

  // Debounced effect to call API
  useEffect(() => {
    // Clear previous timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Don't fetch if not enabled or missing required params
    if (!enabled || !tankId || !timestamp) {
      return;
    }

    // Debounce by 500ms to avoid excessive API calls while user is typing
    debounceTimerRef.current = setTimeout(() => {
      fetchExpectedStock();
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [tankId, timestamp, stockType, enteredValue, enabled, fetchExpectedStock]);

  // Provide manual refresh function
  const refresh = useCallback(() => {
    fetchExpectedStock();
  }, [fetchExpectedStock]);

  return {
    ...validationState,
    refresh
  };
};
