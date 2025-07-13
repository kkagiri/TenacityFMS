import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import notify from 'devextreme/ui/notify';
import {
  createStockAdjustment as createStockAdjustmentAction,
  fetchStockAdjustments as fetchStockAdjustmentsAction,
  reconcileStocks as reconcileStocksAction,
  generateStockReport as generateStockReportAction
} from '../redux/actions/tankStockAction';

//Cursor - Custom hook for stock management operations using Redux
export const useStockManagement = () => {
  const dispatch = useDispatch();
  const [localLoading, setLocalLoading] = useState(false);
  const [error, setError] = useState(null);

  // Get loading states and data from Redux store
  const {
    adjustmentsLoading,
    reconciliationLoading,
    reportsLoading,
    stockAdjustments,
    reconciliationData,
    reports,
    error: reduxError
  } = useSelector((state) => state.tankStock);

  const isLoading = localLoading || adjustmentsLoading || reconciliationLoading || reportsLoading;

  // Stock Adjustment Operations
  const createStockAdjustment = useCallback(async (adjustmentData) => {
    try {
      setError(null);
      const result = await dispatch(createStockAdjustmentAction(adjustmentData));

      if (result.success) {
        notify(result.message || 'Stock adjustment created successfully', 'success', 3000);
        return result;
      } else {
        notify(result.message || 'Failed to create stock adjustment', 'error', 5000);
        setError(result.message);
        return result;
      }
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [dispatch]);

  const fetchStockAdjustments = useCallback(async (filters = {}) => {
    try {
      setError(null);
      const result = await dispatch(fetchStockAdjustmentsAction(filters));

      if (result.success) {
        return result;
      } else {
        notify(result.message || 'Failed to fetch stock adjustments', 'error', 5000);
        setError(result.message);
        return result;
      }
    } catch (error) {
      console.error('Error fetching stock adjustments:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [dispatch]);

  // Stock Reconciliation Operations
  const reconcileStocks = useCallback(async (reconciliationData) => {
    try {
      setError(null);
      const result = await dispatch(reconcileStocksAction(reconciliationData));

      if (result.success) {
        notify(result.message || 'Stock reconciliation completed successfully', 'success', 3000);
        return result;
      } else {
        notify(result.message || 'Failed to reconcile stocks', 'error', 5000);
        setError(result.message);
        return result;
      }
    } catch (error) {
      console.error('Error reconciling stocks:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [dispatch]);

  //Cursor: Removed fetchReconciliationDiscrepancies to avoid duplicate API calls
  //Use Redux action fetchStockDiscrepancies instead

  // Stock Reporting Operations
  const generateStockReport = useCallback(async (reportParams) => {
    try {
      setError(null);
      const result = await dispatch(generateStockReportAction(reportParams));

      if (result.success) {
        notify(result.message || 'Stock report generated successfully', 'success', 3000);
        return result;
      } else {
        notify(result.message || 'Failed to generate stock report', 'error', 5000);
        setError(result.message);
        return result;
      }
    } catch (error) {
      console.error('Error generating stock report:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    }
  }, [dispatch]);

  const exportStockReport = useCallback(async (reportId, format = 'excel') => {
    try {
      setLocalLoading(true);
      setError(null);

      // For file export, we'll create a direct download link
      // This could be improved by adding an export action to Redux later
      const exportUrl = `/api/stockreport/export/${reportId}?format=${format}`;
      const link = document.createElement('a');
      link.href = exportUrl;
      link.setAttribute('download', `stock-report-${reportId}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      link.setAttribute('target', '_blank');
      document.body.appendChild(link);
      link.click();
      link.remove();

      notify('Report export initiated', 'success', 3000);
      return { success: true };
    } catch (error) {
      console.error('Error exporting stock report:', error);
      const errorMessage = error.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setLocalLoading(false);
    }
  }, []);

  // Validation Helpers
  const validateTankCapacity = useCallback((tankId, newVolume, tanks) => {
    const tank = tanks.find(t => t.id === tankId);
    if (!tank) return { isValid: false, message: 'Tank not found' };

    if (newVolume < 0) return { isValid: false, message: 'Volume cannot be negative' };
    if (newVolume > tank.tankVolume) return { isValid: false, message: 'Volume exceeds tank capacity' };

    return { isValid: true };
  }, []);

  const calculateVolumeChange = useCallback((currentVolume, newVolume) => {
    return newVolume - currentVolume;
  }, []);

  return {
    isLoading,
    error: error || reduxError,
    // Redux state data
    stockAdjustments,
    reconciliationData,
    reports,
    // Stock Adjustment
    createStockAdjustment,
    fetchStockAdjustments,
    // Stock Reconciliation
    reconcileStocks,
    // Stock Reporting
    generateStockReport,
    exportStockReport,
    // Validation Helpers
    validateTankCapacity,
    calculateVolumeChange
  };
};