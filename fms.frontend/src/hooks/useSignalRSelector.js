/**
 * useSignalRSelector Hook
 * A specialized selector hook for SignalR-updated data that prevents unnecessary re-renders
 * by performing deep equality checks on selected data
 */

import { useSelector, shallowEqual } from "react-redux";
import { isEqual } from "lodash";
import { useRef } from "react";

/**
 * Custom equality function that uses deep comparison
 * Only triggers re-render if data actually changed
 */
const deepEqual = (prev, next) => {
  return isEqual(prev, next);
};

/**
 * Hook for selecting SignalR-updated data from Redux store
 * Uses deep equality check to prevent unnecessary re-renders
 *
 * @param {Function} selector - Redux selector function
 * @param {Function} equalityFn - Optional custom equality function (defaults to deep equality)
 * @returns {*} Selected data from Redux store
 *
 * @example
 * // Instead of:
 * const data = useSelector(state => state.dashboard.widgets);
 *
 * // Use:
 * const data = useSignalRSelector(state => state.dashboard.widgets);
 */
export const useSignalRSelector = (selector, equalityFn = deepEqual) => {
  return useSelector(selector, equalityFn);
};

/**
 * Hook for selecting specific widget data with memoization
 * Prevents re-renders when other widgets update
 *
 * @param {number} widgetId - Widget ID to select
 * @returns {Object} Widget data
 *
 * @example
 * const widgetData = useWidgetSelector(123);
 */
export const useWidgetSelector = (widgetId) => {
  const prevDataRef = useRef();

  return useSelector((state) => {
    const widgets = state.dashboard?.widgets || {};
    const widgetData = widgets[widgetId];

    // Only return new object if data actually changed
    if (isEqual(prevDataRef.current, widgetData)) {
      return prevDataRef.current;
    }

    prevDataRef.current = widgetData;
    return widgetData;
  }, shallowEqual);
};

/**
 * Hook for selecting dashboard metrics with deep comparison
 *
 * @returns {Object} Dashboard metrics
 *
 * @example
 * const metrics = useDashboardMetricsSelector();
 */
export const useDashboardMetricsSelector = () => {
  return useSignalRSelector((state) => state.vehicleDashboard?.metrics || {});
};

/**
 * Hook for selecting specific metric by key
 * Only re-renders when the specific metric changes
 *
 * @param {string} metricKey - Key of the metric to select
 * @returns {*} Metric value
 *
 * @example
 * const totalVehicles = useMetricSelector('totalVehicles');
 */
export const useMetricSelector = (metricKey) => {
  const prevValueRef = useRef();

  return useSelector(
    (state) => {
      const metrics = state.vehicleDashboard?.metrics || {};
      const value = metrics[metricKey];

      if (prevValueRef.current === value) {
        return prevValueRef.current;
      }

      prevValueRef.current = value;
      return value;
    },
    (prev, next) => prev === next
  );
};

/**
 * Hook for selecting SignalR connection status
 *
 * @returns {Object} Connection status
 *
 * @example
 * const { isDashboardConnected, isPtsConnected } = useSignalRConnectionStatus();
 */
export const useSignalRConnectionStatus = () => {
  return useSelector(
    (state) => ({
      isDashboardConnected: state.signalR?.dashboard?.connected || false,
      isPtsConnected: state.signalR?.pts?.connected || false,
      dashboardState: state.signalR?.dashboard?.state || "disconnected",
      ptsState: state.signalR?.pts?.state || "disconnected",
    }),
    shallowEqual
  );
};

/**
 * Utility to create a memoized selector for specific data paths
 * Useful for creating reusable selectors
 *
 * @param {Function} selector - Selector function
 * @returns {Function} Memoized selector hook
 *
 * @example
 * const useMyDataSelector = createMemoizedSelector(
 *   state => state.myModule.myData
 * );
 *
 * // In component:
 * const myData = useMyDataSelector();
 */
export const createMemoizedSelector = (selector) => {
  return () => useSignalRSelector(selector);
};

export default useSignalRSelector;
