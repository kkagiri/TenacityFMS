import { useState, useCallback } from 'react';
import { useDispatch } from 'react-redux';
import axiosInstance from '../api/axiosInstance';
import notify from 'devextreme/ui/notify';

//Cursor - Custom hook for stock management operations
export const useStockManagement = () => {
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Stock Adjustment Operations
  const createStockAdjustment = useCallback(async (adjustmentData) => {
    try {
      setIsLoading(true);
      setError(null);

      //Cursor - Updated to use correct endpoint from TankStockController
      const response = await axiosInstance.post('/tankstock/adjustments', adjustmentData);

      if (response.data.success) {
        notify(response.data.message || 'Stock adjustment created successfully', 'success', 3000);
        return { success: true, data: response.data.data, message: response.data.message };
      } else {
        notify(response.data.message || 'Failed to create stock adjustment', 'error', 5000);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error creating stock adjustment:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchStockAdjustments = useCallback(async (filters = {}) => {
    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (filters.siteId) params.append('siteId', filters.siteId);
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate) params.append('endDate', filters.endDate);
      if (filters.tankId) params.append('tankId', filters.tankId);

      //Cursor - Updated to use correct endpoint from TankStockController
      const response = await axiosInstance.get(`/tankstock/adjustments?${params.toString()}`);

      if (response.data.success) {
        return { success: true, data: response.data.data };
      } else {
        notify(response.data.message || 'Failed to fetch stock adjustments', 'error', 5000);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error fetching stock adjustments:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Stock Reconciliation Operations
  const reconcileStocks = useCallback(async (reconciliationData) => {
    try {
      setIsLoading(true);
      setError(null);

      //Cursor - Updated to use correct endpoint from TankStockController
      const response = await axiosInstance.post('/tankstock/reconcile', reconciliationData);

      if (response.data.success) {
        notify(response.data.message || 'Stock reconciliation completed successfully', 'success', 3000);
        return { success: true, data: response.data.data, message: response.data.message };
      } else {
        notify(response.data.message || 'Failed to reconcile stocks', 'error', 5000);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error reconciling stocks:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  //Cursor: Removed fetchReconciliationDiscrepancies to avoid duplicate API calls
  //Use Redux action fetchStockDiscrepancies instead

  // Stock Reporting Operations
  const generateStockReport = useCallback(async (reportParams) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosInstance.post('/stockreport/generate', reportParams);

      if (response.data.success) {
        notify(response.data.message || 'Stock report generated successfully', 'success', 3000);
        return { success: true, data: response.data.data, message: response.data.message };
      } else {
        notify(response.data.message || 'Failed to generate stock report', 'error', 5000);
        return { success: false, message: response.data.message };
      }
    } catch (error) {
      console.error('Error generating stock report:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportStockReport = useCallback(async (reportId, format = 'excel') => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await axiosInstance.get(`/stockreport/export/${reportId}?format=${format}`, {
        responseType: 'blob'
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `stock-report-${reportId}.${format === 'csv' ? 'csv' : 'xlsx'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      notify('Report exported successfully', 'success', 3000);
      return { success: true };
    } catch (error) {
      console.error('Error exporting stock report:', error);
      const errorMessage = error.response?.data?.message || 'An unexpected error occurred';
      notify(errorMessage, 'error', 5000);
      setError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsLoading(false);
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
    error,
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