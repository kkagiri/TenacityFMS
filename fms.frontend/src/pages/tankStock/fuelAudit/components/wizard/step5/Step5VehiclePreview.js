/**
 * Step5VehiclePreview.js
 * Step 5: Vehicle Data Preview by Category
 *
 * This step shows fuel data preview for selected vehicles grouped by category:
 * 1. Site GPS Fleet (GPS + Fuel Sensor) - Fetch opening/closing from GPSGate REST API
 * 2. Site Full Tank Policy - Opening = Tank Capacity, Closing = Tank Capacity
 * 3. Site Equipment - Track fuel issued only (no opening/closing)
 * 4. Cross-Site Company - Fetch from GPSGate SOAP Report 212
 * 5. External Non-Company - Track fuel issued for accounting only
 *
 * Features:
 * - Opening/closing fuel values displayed for all applicable categories
 * - Export to Excel per category
 * - Refresh/recalculate per category
 * - Master-detail with DataGrid for refill history
 */

import React, { useState, useMemo, useCallback, memo, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  Scrolling,
  MasterDetail,
  Export,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { ProgressBar } from 'devextreme-react/progress-bar';
import { confirm } from 'devextreme/ui/dialog';
import notify from 'devextreme/ui/notify';

import {
  fetchCategoryAuditData,
  startCategoryAuditAsync,
  cancelCategoryAuditJob,
  selectWizard,
  selectGpsFetchJob,
  gpsFetchProgress,
  gpsFetchCompleted,
  gpsFetchError,
  clearGpsFetchJob,
  saveDraftAudit,
  selectWizardDraftAudit,
  loadDraftToWizard
} from '../../../../../../redux/slices/fuelAuditSlice';
import { fetchFuelAuditById } from '../../../../../../redux/slices/fuelAuditThunks';
import businessSignalRService from '../../../../../../signalR/businessSignalRService';

// Import helpers and components from separate file
import {
  CATEGORY_CONFIG,
  renderDataSource,
  GPSDataDetailsPopup
} from './Step5VehiclePreviewHelpers';

// Import export utilities
import {
  exportCategoryToExcel,
  exportAllCategoriesToExcel
} from './Step5VehiclePreviewExport';

// FuelDataQuality enum mapping (numeric value to string name)
// Must match backend FMS.Application.Features.FuelAudit.DTOs.FuelDataQuality
const FUEL_DATA_QUALITY_MAP = {
  1: 'Exact',
  2: 'Interpolated',
  3: 'Unavailable',
  4: 'NoSensor',
  5: 'SensorNotReporting',
  6: 'ManualEntry',
  7: 'EstimatedFromRefill'
};

/**
 * Convert numeric FuelDataQuality value to string name for backend DTO
 * @param {number|string|null} value - Numeric enum value or already a string
 * @returns {string|null} - String name or null
 */
const dataQualityToString = (value) => {
  if (value == null) return null;
  if (typeof value === 'string') return value; // Already a string
  return FUEL_DATA_QUALITY_MAP[value] || null;
};

const Step5VehiclePreview = memo(() => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const gpsFetchJob = useSelector(selectGpsFetchJob);
  const draftAudit = useSelector(selectWizardDraftAudit);

  // Refs for each category DataGrid (for export)
  const gridRefs = useRef({});

  // Track which categories have been loaded
  const [loadedCategories, setLoadedCategories] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  // Use async SignalR mode for large datasets (can toggle for debugging)
  const useAsyncMode = true;
  // Expanded accordion items (by category)
  const [expandedCategories, setExpandedCategories] = useState([0, 1, 3]); // Default: GPS, Full Tank, Cross-Site

  // Popup state for GPS data details
  const [detailsPopupVisible, setDetailsPopupVisible] = useState(false);
  const [selectedVehicleDetails, setSelectedVehicleDetails] = useState(null);

  // Handler to show vehicle GPS details popup
  const handleShowDetails = useCallback((vehicleData) => {
    setSelectedVehicleDetails(vehicleData);
    setDetailsPopupVisible(true);
  }, []);

  // Handler to close popup
  const handleCloseDetails = useCallback(() => {
    setDetailsPopupVisible(false);
    setSelectedVehicleDetails(null);
  }, []);

  // Ensure SignalR business connection is active for this page
  useEffect(() => {
    const ensureConnection = async () => {
      const isConnected = businessSignalRService.getConnectionStatus();
      console.log('[Step5] Business SignalR connected:', isConnected);
      if (!isConnected) {
        console.log('[Step5] Starting Business SignalR connection...');
        try {
          await businessSignalRService.start();
          console.log('[Step5] Business SignalR connected successfully');
        } catch (err) {
          console.error('[Step5] Failed to connect Business SignalR:', err);
        }
      }
    };
    ensureConnection();
  }, []);

  // Set up SignalR listeners for GPS fetch progress
  useEffect(() => {
    if (!useAsyncMode) return;

    console.log('[Step5] Setting up GPS fetch SignalR listeners...');

    // Progress updates
    const cleanupProgress = businessSignalRService.on('GpsFetchProgress', (data) => {
      console.log('[Step5] 📊 GPS Fetch Progress:', data);
      dispatch(gpsFetchProgress(data));
      setCategoryProgress(data.progressPercent || 0);
      // Keep loading state active while processing
      if (data.status === 'processing' || data.status === 'started') {
        // Don't change loadingCategory - keep whatever was set
      }
    });

    // Completion
    const cleanupCompleted = businessSignalRService.on('GpsFetchCompleted', (data) => {
      console.log('[Step5] ✅ GPS Fetch Completed:', data);

      // Debug: Log detailed vehicle data for Category 1
      if (data.result?.categoryResults) {
        const cat1 = data.result.categoryResults.find(cr => cr.category === 1);
        if (cat1?.vehicles) {
          console.log('[Step5] 🔍 Category 1 (Site GPS Fleet) vehicles:', cat1.vehicles.length);
          cat1.vehicles.forEach(v => {
            console.log(`[Step5] Vehicle ${v.vehicleId}: opening=${v.openingFuelLevel}, closing=${v.closingFuelLevel}, closingQuality=${v.closingDataQuality}`);
          });
        }
      }

      dispatch(gpsFetchCompleted(data));

      // Mark processed categories as loaded based on result data
      if (data.result?.categoryResults) {
        const processedCategories = data.result.categoryResults.map(cr => cr.category);
        setLoadedCategories(prev => {
          const updated = { ...prev };
          processedCategories.forEach(catId => {
            updated[catId] = true;
          });
          return updated;
        });
      } else {
        // Fallback: mark all categories as loaded
        const loadedCats = {};
        Object.keys(CATEGORY_CONFIG).forEach(catId => {
          loadedCats[catId] = true;
        });
        setLoadedCategories(loadedCats);
      }

      setLoadingCategory(null);
      setCategoryProgress(100);

      // Clear job state after a moment
      setTimeout(() => {
        setCategoryProgress(0);
        dispatch(clearGpsFetchJob());
      }, 2000);
    });

    // Error
    const cleanupError = businessSignalRService.on('GpsFetchError', (data) => {
      console.error('[Step5] ❌ GPS Fetch Error:', data);
      dispatch(gpsFetchError(data));
      setLoadingCategory(null);
      setCategoryProgress(0);
    });

    return () => {
      console.log('[Step5] Cleaning up GPS fetch SignalR listeners');
      cleanupProgress?.();
      cleanupCompleted?.();
      cleanupError?.();
    };
  }, [dispatch, useAsyncMode]);

  // Get selected vehicles from wizard (already have category from Step 4)
  const selectedVehicles = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    return tankRefills.filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId));
  }, [wizard.tankRefills, wizard.selectedVehicleIds]);

  // Group selected vehicles by category
  const vehiclesByCategory = useMemo(() => {
    const grouped = {};
    for (let i = 1; i <= 5; i++) {
      grouped[i] = [];
    }
    selectedVehicles.forEach(vehicle => {
      const category = vehicle.vehicleCategory || 5;
      if (grouped[category]) {
        grouped[category].push(vehicle);
      }
    });
    return grouped;
  }, [selectedVehicles]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = {};
    Object.keys(vehiclesByCategory).forEach(cat => {
      const vehicles = vehiclesByCategory[cat];
      stats[cat] = {
        count: vehicles.length,
        totalFuel: vehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
        loaded: loadedCategories[cat] || false
      };
    });
    return stats;
  }, [vehiclesByCategory, loadedCategories]);

  // Export handler for a specific category using utility function
  const handleExportCategory = useCallback(async (categoryId) => {
    const vehicles = vehiclesByCategory[categoryId];
    if (!vehicles?.length) return;

    await exportCategoryToExcel(categoryId, vehicles, {
      siteName: wizard.siteName || 'Unknown Site',
      startDate: wizard.periodStart,
      endDate: wizard.periodEnd,
      includeRefillDetails: true
    });
  }, [vehiclesByCategory, wizard.siteName, wizard.periodStart, wizard.periodEnd]);

  // Export all categories to a single Excel file
  const handleExportAllCategories = useCallback(async () => {
    const hasData = Object.values(vehiclesByCategory).some(v => v?.length > 0);
    if (!hasData) return;

    await exportAllCategoriesToExcel(vehiclesByCategory, {
      siteName: wizard.siteName || 'Unknown Site',
      startDate: wizard.periodStart,
      endDate: wizard.periodEnd,
      includeRefillDetails: true
    });
  }, [vehiclesByCategory, wizard.siteName, wizard.periodStart, wizard.periodEnd]);

  // Check if any vehicle data has been edited
  const hasEditedVehicleData = useMemo(() => {
    return selectedVehicles.some(v => v.isEdited) || false;
  }, [selectedVehicles]);

  // Save vehicle data to audit draft
  const handleSaveToAudit = useCallback(async () => {
    if (!draftAudit.auditId) {
      notify('Please save the audit draft first (complete Step 1)', 'warning', 3000);
      return;
    }

    setIsSaving(true);
    try {
      const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : [];

      // Prepare vehicle data for saving - map to VehicleGpsEditDTO format expected by backend
      const vehicleGpsData = selectedVehicles.map(v => ({
        vehicleId: v.vehicleId,
        vehicleName: v.vehicleNo,
        vehicleCategory: v.vehicleCategory,
        openingFuel: v.openingFuel,
        closingFuel: v.closingFuel,
        consumption: v.fuelConsumed || v.consumption,
        gpsMeasuredConsumption: v.gpsMeasuredConsumption,
        vehicleVariance: v.vehicleVariance,
        totalFuelRefilled: v.totalFuelAmount,
        refillCount: v.refillCount,
        dataSource: v.dataSourcePrimary,
        // Convert numeric FuelDataQuality enum values to string names for backend
        openingDataQuality: dataQualityToString(v.openingDataQuality),
        closingDataQuality: dataQualityToString(v.closingDataQuality),
        openingTimestamp: v.openingReadingTime,
        closingTimestamp: v.closingReadingTime,
        hasVarianceFlag: v.hasVarianceFlag || false,
        varianceFlagMessage: v.varianceFlagMessage,
        gpsDataLoaded: v.gpsDataLoaded || false,
        isEdited: v.isEdited || false
      }));

      console.log('[Step5] Saving vehicle data to audit:', {
        auditId: draftAudit.auditId,
        selectedVehicleIds: wizard.selectedVehicleIds,
        vehicleGpsDataCount: vehicleGpsData.length,
        vehicleGpsData: vehicleGpsData
      });

      await dispatch(saveDraftAudit({
        auditId: draftAudit.auditId,
        wizardStep: 5,
        siteIds: siteIds,
        periodStart: wizard.periodStart,
        periodEnd: wizard.periodEnd,
        selectedVehicleIds: wizard.selectedVehicleIds,
        vehicleGpsData: vehicleGpsData
      })).unwrap();

      notify('Vehicle data saved to audit draft', 'success', 3000);
    } catch (error) {
      console.error('Error saving vehicle data:', error);
      notify('Failed to save vehicle data', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, draftAudit.auditId, wizard.siteIds, wizard.periodStart, wizard.periodEnd, wizard.selectedVehicleIds, selectedVehicles]);

  // Load saved vehicle data from draft (backend)
  const handleLoadSaved = useCallback(async () => {
    console.log('[Step5] handleLoadSaved called');
    console.log('[Step5] draftAudit.auditId:', draftAudit.auditId);

    if (!draftAudit.auditId) {
      notify('No saved draft found', 'warning', 2000);
      return;
    }

    setLoadingCategory('loadSaved');
    try {
      notify('Loading saved data...', 'info', 2000);
      const result = await dispatch(fetchFuelAuditById({ auditId: draftAudit.auditId })).unwrap();
      console.log('[Step5] fetchFuelAuditById result:', result);

      if (result.isSuccess && result.data) {
        console.log('[Step5] vehiclePositions from API:', result.data.vehiclePositions);

        // Update wizard state with loaded data - loadDraftToWizard maps all fields
        dispatch(loadDraftToWizard(result.data));

        // Mark all categories as loaded since we loaded from DB
        if (result.data.vehiclePositions?.length > 0) {
          const loadedCats = {};
          Object.keys(CATEGORY_CONFIG).forEach(catId => {
            loadedCats[catId] = true;
          });
          setLoadedCategories(loadedCats);
        }

        notify('Saved data loaded successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('[Step5] Error loading saved data:', error);
      notify('Failed to load saved data', 'error', 3000);
    } finally {
      setLoadingCategory(null);
    }
  }, [dispatch, draftAudit.auditId]);

  // Synchronous load for a single category (fallback)
  const loadCategorySync = useCallback(async (categoryId, vehicles, siteIds, forceRefresh) => {
    const progressInterval = setInterval(() => {
      setCategoryProgress(prev => Math.min(prev + 10, 90));
    }, 200);

    try {
      await dispatch(fetchCategoryAuditData({
        vehicles: vehicles,
        startDate: wizard.periodStart,
        endDate: wizard.periodEnd,
        auditSiteIds: siteIds,
        categoryId: categoryId,
        forceRefresh: forceRefresh
      }));

      clearInterval(progressInterval);
      setCategoryProgress(100);
      setLoadedCategories(prev => ({ ...prev, [categoryId]: true }));
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setLoadingCategory(null);
        setCategoryProgress(0);
      }, 500);
    }
  }, [wizard.periodStart, wizard.periodEnd, dispatch]);

  // Handle loading GPS data for a specific category
  const handleLoadCategoryData = useCallback(async (categoryId, forceRefresh = false) => {
    const vehicles = vehiclesByCategory[categoryId];
    if (!vehicles?.length) return;

    const config = CATEGORY_CONFIG[categoryId];

    // For non-GPS categories, calculate estimates locally
    if (!config.canFetchGps) {
      // Mark as loaded - data comes from FuelRefill and local calculations
      setLoadedCategories(prev => ({ ...prev, [categoryId]: true }));
      return;
    }

    setLoadingCategory(categoryId);
    setCategoryProgress(0);

    // For multi-site, pass siteIds array
    const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : (wizard.siteIds ? [wizard.siteIds] : []);

    try {
      if (useAsyncMode) {
        // Use async endpoint with SignalR progress for GPS categories
        console.log(`[Step5] Starting async GPS data fetch for category ${categoryId}...`);

        const isConnected = businessSignalRService.getConnectionStatus();
        if (!isConnected) {
          console.log('[Step5] SignalR not connected, attempting to connect...');
          try {
            await businessSignalRService.start();
          } catch (err) {
            console.error('[Step5] SignalR connection failed, falling back to sync mode');
            await loadCategorySync(categoryId, vehicles, siteIds, forceRefresh);
            return;
          }
        }

        const result = await dispatch(startCategoryAuditAsync({
          vehicles: vehicles,
          startDate: wizard.periodStart,
          endDate: wizard.periodEnd,
          auditSiteIds: siteIds,
          categoryId: categoryId,
          forceRefresh: forceRefresh
        })).unwrap();

        console.log(`[Step5] Async job started for category ${categoryId}:`, result);
        // Keep loading state - SignalR listeners will update progress and clear loading on completion
      } else {
        await loadCategorySync(categoryId, vehicles, siteIds, forceRefresh);
      }
    } catch (error) {
      console.error(`Error loading category ${categoryId} data:`, error);
      setLoadingCategory(null);
      setCategoryProgress(0);
    }
  }, [vehiclesByCategory, wizard.periodStart, wizard.periodEnd, wizard.siteIds, dispatch, useAsyncMode, loadCategorySync]);

  // Handle refresh for a category
  const handleRefreshCategory = useCallback((categoryId) => {
    // Reset loaded state for this category
    setLoadedCategories(prev => ({ ...prev, [categoryId]: false }));
    // Reload with force refresh
    handleLoadCategoryData(categoryId, true);
  }, [handleLoadCategoryData]);

  // Synchronous load fallback
  const handleSyncLoad = useCallback(async (siteIds) => {
    const progressInterval = setInterval(() => {
      setCategoryProgress(prev => Math.min(prev + 5, 90));
    }, 300);

    try {
      await dispatch(fetchCategoryAuditData({
        vehicles: selectedVehicles,
        startDate: wizard.periodStart,
        endDate: wizard.periodEnd,
        auditSiteIds: siteIds
      }));

      clearInterval(progressInterval);
      setCategoryProgress(100);

      // Mark all categories as loaded
      const loadedCats = {};
      Object.keys(CATEGORY_CONFIG).forEach(catId => {
        if (vehiclesByCategory[catId]?.length > 0) {
          loadedCats[catId] = true;
        }
      });
      setLoadedCategories(loadedCats);
    } finally {
      clearInterval(progressInterval);
      setTimeout(() => {
        setLoadingCategory(null);
        setCategoryProgress(0);
      }, 500);
    }
  }, [selectedVehicles, wizard.periodStart, wizard.periodEnd, dispatch, vehiclesByCategory]);

  // Handle loading all categories with the category-aware endpoint
  const handleLoadAllGpsData = useCallback(async () => {
    setLoadingCategory('all');
    setCategoryProgress(0);

    try {
      // For multi-site, pass siteIds array
      const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : (wizard.siteIds ? [wizard.siteIds] : []);

      if (useAsyncMode) {
        // Check SignalR connection first
        const isConnected = businessSignalRService.getConnectionStatus();
        if (!isConnected) {
          console.log('[Step5] SignalR not connected, attempting to connect...');
          try {
            await businessSignalRService.start();
          } catch (err) {
            console.error('[Step5] SignalR connection failed, falling back to sync mode');
            // Fall back to sync mode
            await handleSyncLoad(siteIds);
            return;
          }
        }

        // Use async endpoint with SignalR progress updates
        console.log('[Step5] Starting async GPS data fetch via SignalR...');
        const result = await dispatch(startCategoryAuditAsync({
          vehicles: selectedVehicles,
          startDate: wizard.periodStart,
          endDate: wizard.periodEnd,
          auditSiteIds: siteIds
        })).unwrap();

        console.log('[Step5] Async job started:', result);
        // Keep loading state - SignalR listeners will update progress and clear loading on completion
        // The loading state persists because we DON'T call setLoadingCategory(null) here
      } else {
        await handleSyncLoad(siteIds);
      }
    } catch (error) {
      console.error('Error loading category audit data:', error);
      setLoadingCategory(null);
      setCategoryProgress(0);
    }
  }, [selectedVehicles, wizard.periodStart, wizard.periodEnd, wizard.siteIds, dispatch, useAsyncMode, handleSyncLoad]);

  // Handle cancel job
  const handleCancelJob = useCallback(() => {
    if (gpsFetchJob?.jobId) {
      dispatch(cancelCategoryAuditJob(gpsFetchJob.jobId));
    }
    setLoadingCategory(null);
    setCategoryProgress(0);
  }, [gpsFetchJob, dispatch]);

  // Toggle category expansion
  const toggleCategory = (catIndex) => {
    setExpandedCategories(prev =>
      prev.includes(catIndex)
        ? prev.filter(i => i !== catIndex)
        : [...prev, catIndex]
    );
  };

  // Helper function to match GPS events with manual refills and calculate variance
  const mergeGpsAndManualRefills = useCallback((gpsRefillEvents, manualRefills) => {
    // Create a copy of GPS events with matched manual refill data
    return gpsRefillEvents.map(gpsEvent => {
      // Try to find a matching manual refill by date (same day)
      const gpsDate = new Date(gpsEvent.refillDate);
      const matchedRefill = manualRefills.find(r => {
        const refillDate = new Date(r.refillDate);
        // Match if same date (within a day)
        return Math.abs(gpsDate - refillDate) < 24 * 60 * 60 * 1000;
      });

      const manualAmount = matchedRefill?.fuelAmount || null;
      const gpsAmount = gpsEvent.gpsRefillVolume || 0;

      // Calculate variance: Manual - GPS (positive = manual shows more than GPS)
      let variance = null;
      let variancePercent = null;
      if (manualAmount !== null && gpsAmount > 0) {
        variance = manualAmount - gpsAmount;
        variancePercent = (variance / manualAmount) * 100;
      }

      return {
        ...gpsEvent,
        manualRefillAmount: manualAmount,
        variance: variance,
        variancePercent: variancePercent,
        tankName: matchedRefill?.tankName || gpsEvent.tankName,
        fuelRefillId: matchedRefill?.refillId || gpsEvent.fuelRefillId
      };
    });
  }, []);

  // Master-detail template with DataGrid for refill history
  // For GPS categories (1 and 4), show GPS refill events with variance columns
  const renderRefillDetails = useCallback((data) => {
    const vehicle = data.data;
    const refills = vehicle.refills || [];
    const gpsRefillEvents = vehicle.gpsRefillEvents || [];
    const isGpsCategory = vehicle.vehicleCategory === 1 || vehicle.vehicleCategory === 4;

    // For GPS categories (1 & 4), show GPS refill events if available
    if (isGpsCategory && gpsRefillEvents.length > 0) {
      // Merge GPS events with manual refill data for variance calculation
      const mergedEvents = mergeGpsAndManualRefills(gpsRefillEvents, refills);

      return (
        <div className="tw-px-2 tw-py-1 tw-bg-gray-50">
          <div className="tw-flex tw-items-center tw-gap-2 tw-mb-2">
            <i className="fa-light fa-satellite-dish tw-text-blue-500"></i>
            <span className="tw-text-xs tw-text-gray-600 tw-font-medium">
              GPS Refill Events (SOAP Report 212)
            </span>
          </div>
          <DataGrid
            dataSource={mergedEvents}
            keyExpr="entryId"
            showBorders={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            height="auto"
            wordWrapEnabled={true}
          >
            <Paging enabled={true} pageSize={5} />
            <Scrolling mode="standard" />

            <Column
              dataField="refillDate"
              caption="Date"
              width={100}
              dataType="date"
              format="dd/MM/yyyy"
              sortOrder="desc"
            />
            <Column
              dataField="tankName"
              caption="Tank"
              width={100}
              cellRender={(cellData) => (
                <span className="tw-text-gray-700">
                  {cellData.value || '-'}
                </span>
              )}
            />
            <Column
              dataField="fuelBefore"
              caption="Fuel Before"
              width={90}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-text-gray-600">
                  {cellData.value != null ? cellData.value.toFixed(1) : '-'}
                </span>
              )}
            />
            <Column
              dataField="fuelAfter"
              caption="Fuel After"
              width={90}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-text-gray-700 tw-font-medium">
                  {cellData.value != null ? cellData.value.toFixed(1) : '-'}
                </span>
              )}
            />
            <Column
              dataField="gpsRefillVolume"
              caption="GPS Fuel"
              width={85}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-font-medium tw-text-blue-600">
                  +{cellData.value?.toFixed(1) || '0.0'}
                </span>
              )}
            />
            <Column
              dataField="manualRefillAmount"
              caption="Manual (L)"
              width={90}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => (
                <span className="tw-font-medium tw-text-green-600">
                  +{cellData.value?.toFixed(1) || '0.0'}
                </span>
              )}
            />
            <Column
              dataField="variance"
              caption="Variance"
              width={85}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value;
                if (value === null || value === undefined) {
                  return <span className="tw-text-gray-400 tw-text-xs">-</span>;
                }
                const isSignificant = Math.abs(value) > 5;
                return (
                  <span className={`tw-font-medium ${isSignificant ? (value > 0 ? 'tw-text-red-600' : 'tw-text-orange-600') : 'tw-text-gray-600'}`}>
                    {value >= 0 ? '+' : ''}{value.toFixed(1)}
                  </span>
                );
              }}
            />
            <Column
              dataField="variancePercent"
              caption="Var %"
              width={70}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value;
                if (value === null || value === undefined) {
                  return <span className="tw-text-gray-400 tw-text-xs">-</span>;
                }
                const isSignificant = Math.abs(value) > 10;
                return (
                  <span className={`tw-text-xs ${isSignificant ? 'tw-text-red-600 tw-font-medium' : 'tw-text-gray-500'}`}>
                    {value >= 0 ? '+' : ''}{value.toFixed(1)}%
                  </span>
                );
              }}
            />
            <Column
              dataField="isAuditSiteRefill"
              caption="At Site"
              width={60}
              alignment="center"
              cellRender={(cellData) => (
                <span className={`tw-text-xs ${cellData.value ? 'tw-text-green-600' : 'tw-text-gray-400'}`}>
                  <i className={`fa-light ${cellData.value ? 'fa-check-circle' : 'fa-circle-xmark'}`}></i>
                </span>
              )}
            />

            <Summary>
              <TotalItem
                column="gpsRefillVolume"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="GPS: {0} L"
              />
              <TotalItem
                column="manualRefillAmount"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="Manual: {0} L"
              />
            </Summary>
          </DataGrid>
        </div>
      );
    }

    // For non-cross-site or when no GPS events available, show regular refill records
    if (!refills.length) {
      return (
        <div className="tw-p-2 tw-bg-gray-50 tw-text-center tw-text-gray-500">
          <i className="fa-light fa-inbox tw-text-xl tw-mb-1"></i>
          <p className="tw-text-xs">No refill records</p>
        </div>
      );
    }

    return (
      <div className="tw-px-2 tw-py-1 tw-bg-gray-50">
        <DataGrid
          dataSource={refills}
          keyExpr="refillId"
          showBorders={true}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          height="auto"
          wordWrapEnabled={true}
        >
          <Paging enabled={true} pageSize={5} />
          <Scrolling mode="standard" />

          <Column
            dataField="refillDate"
            caption="Date"
            width={100}
            dataType="date"
            format="dd/MM/yyyy"
            sortOrder="desc"
          />
          <Column
            dataField="fuelAmount"
            caption="Fuel (L)"
            width={80}
            dataType="number"
            format="#,##0.0"
            alignment="right"
            cellRender={(cellData) => (
              <span className="tw-font-medium tw-text-green-600">
                +{cellData.value?.toFixed(1) || '0.0'}
              </span>
            )}
          />
          <Column
            dataField="tankName"
            caption="Tank"
            width={120}
          />
          <Column
            dataField="previousMeterReading"
            caption="Prev Reading"
            width={100}
            dataType="number"
            format="#,##0"
            alignment="right"
            cellRender={(cellData) => (
              <span className="tw-text-gray-600">
                {cellData.value ? cellData.value.toLocaleString() : '-'}
              </span>
            )}
          />
          <Column
            dataField="currentMeterReading"
            caption="Curr Reading"
            width={100}
            dataType="number"
            format="#,##0"
            alignment="right"
            cellRender={(cellData) => (
              <span className="tw-text-gray-700 tw-font-medium">
                {cellData.value ? cellData.value.toLocaleString() : '-'}
              </span>
            )}
          />
          <Column
            caption="Distance"
            width={80}
            alignment="right"
            calculateCellValue={(rowData) => {
              if (rowData.currentMeterReading && rowData.previousMeterReading) {
                return rowData.currentMeterReading - rowData.previousMeterReading;
              }
              return null;
            }}
            cellRender={(cellData) => (
              <span className="tw-text-blue-600">
                {cellData.value ? `${cellData.value.toLocaleString()} km` : '-'}
              </span>
            )}
          />

          <Column
            dataField="fuelBy"
            caption="Fueled By"
            width={100}
          />
          <Column
            dataField="siteName"
            caption="Site"
            width={100}
          />
          <Column
            dataField="comment"
            caption="Notes"
            width={150}
            cellRender={(cellData) => (
              <span className="tw-text-xs tw-text-gray-500 tw-truncate" title={cellData.value}>
                {cellData.value || '-'}
              </span>
            )}
          />

          <Summary>
            <TotalItem
              column="fuelAmount"
              summaryType="sum"
              valueFormat="#,##0.0"
              displayFormat="Total: {0} L"
            />
          </Summary>
        </DataGrid>
      </div>
    );
  }, [mergeGpsAndManualRefills]);

  // Render category title
  const renderCategoryTitle = (categoryId) => {
    const config = CATEGORY_CONFIG[categoryId];
    const stats = categoryStats[categoryId];

    return (
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-py-1">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className={`tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center ${config.bgColor}`}>
            <i className={`fa-light ${config.icon} ${config.textColor}`}></i>
          </div>
          <div>
            <span className="tw-font-semibold tw-text-gray-800">{config.name}</span>
            <span className="tw-text-gray-500 tw-text-sm tw-ml-2">
              ({stats.count} vehicle{stats.count !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <span className={`tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${config.badgeColor}`}>
            {config.confidence}
          </span>
          {stats.loaded && (
            <span className="tw-text-xs tw-text-green-600">
              <i className="fa-light fa-check-circle tw-mr-1"></i>
              Loaded
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render category content
  const renderCategoryContent = (categoryId) => {
    const vehicles = vehiclesByCategory[categoryId];
    const config = CATEGORY_CONFIG[categoryId];
    const isLoading = loadingCategory === categoryId || loadingCategory === 'all';

    if (vehicles.length === 0) {
      return (
        <div className={`tw-p-4 tw-text-center tw-text-gray-500 ${config.bgColor} tw-rounded-lg`}>
          <p>No vehicles selected in this category</p>
        </div>
      );
    }

    return (
      <div className={`tw-border tw-rounded-lg tw-overflow-hidden ${config.borderColor}`}>
        {/* Category info bar with actions */}
        <div className={`tw-px-4 tw-py-2 tw-flex tw-items-center tw-justify-between ${config.bgColor}`}>
          <div>
            <p className="tw-text-xs tw-text-gray-600">{config.description}</p>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5">
              Data Source: <span className="tw-font-medium">{config.dataSource}</span>
            </p>
          </div>
          <div className="tw-flex tw-gap-2">
            {/* Export button */}
            <Button
              icon="exportxlsx"
              hint="Export to Excel"
              type="default"
              stylingMode="text"
              onClick={() => handleExportCategory(categoryId)}
              disabled={isLoading}
            />
            {/* Refresh button */}
            <Button
              icon="refresh"
              hint="Refresh/Recalculate"
              type="default"
              stylingMode="text"
              onClick={() => handleRefreshCategory(categoryId)}
              disabled={isLoading}
            />
            {/* Fetch Original button (only for GPS categories that haven't loaded) */}
            {config.canFetchGps && !loadedCategories[categoryId] && (
              <Button
                text="Fetch Original"
                type="default"
                stylingMode="outlined"
                onClick={() => handleLoadCategoryData(categoryId)}
                disabled={isLoading}
              />
            )}
          </div>
        </div>

        {/* Loading progress */}
        {isLoading && loadingCategory === categoryId && (
          <div className="tw-px-4 tw-py-2 tw-bg-white">
            <ProgressBar
              value={categoryProgress}
              width="100%"
              showStatus={true}
              statusFormat={(value) => `Loading data... ${Math.round(value)}%`}
            />
          </div>
        )}

        {/* Vehicle data grid */}
        <DataGrid
          ref={(ref) => { gridRefs.current[categoryId] = ref; }}
          dataSource={vehicles}
          keyExpr="vehicleId"
          showBorders={false}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          height="auto"
          wordWrapEnabled={false}
        >
          <Scrolling mode="standard" />
          <Paging enabled={true} pageSize={10} />
          <Export enabled={false} /> {/* We use custom export */}
          <MasterDetail
            enabled={true}
            render={renderRefillDetails}
          />

          <Column dataField="vehicleNo" caption="Vehicle" width={100} />
          <Column dataField="vehicleTypeName" caption="Type" width={90} />

          {/* Fuel Sensor Status - Show for Category 1 only */}
          {categoryId === 1 && (
            <Column
              caption="Fuel Sensor"
              width={85}
              alignment="center"
              cellRender={(cellData) => {
                const hasGPS = cellData.data.hasGPS;
                const hasGpsData = cellData.data.gpsDataLoaded || cellData.data.openingFuel != null;

                if (hasGPS) {
                  return hasGpsData ? (
                    <span className="tw-px-2 tw-py-0.5 tw-rounded tw-bg-green-100 tw-text-green-700 tw-text-xs"
                          title="Vehicle has fuel sensor with GPS data">
                      <i className="fa-light fa-check tw-mr-1"></i>Yes
                    </span>
                  ) : (
                    <span className="tw-px-2 tw-py-0.5 tw-rounded tw-bg-yellow-100 tw-text-yellow-700 tw-text-xs"
                          title="Vehicle has fuel sensor but no GPS data available for this period">
                      <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>No Data
                    </span>
                  );
                }
                return (
                  <span className="tw-px-2 tw-py-0.5 tw-rounded tw-bg-gray-100 tw-text-gray-500 tw-text-xs"
                        title="No fuel sensor configured">
                    <i className="fa-light fa-times tw-mr-1"></i>No
                  </span>
                );
              }}
            />
          )}

          <Column
            dataField="refillCount"
            caption="Refills"
            width={60}
            alignment="center"
            cellRender={(cellData) => (
              <span className="tw-px-2 tw-py-0.5 tw-rounded tw-bg-gray-100 tw-text-gray-700 tw-text-xs">
                {cellData.value}
              </span>
            )}
          />

          {/* Opening Fuel - Show for categories with showOpeningClosing=true (1, 2, 4) */}
          {config.showOpeningClosing && (
            <Column
              dataField="openingFuel"
              caption="Opening (L)"
              width={110}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value;
                const data = cellData.data;
                const category = data.vehicleCategory;
                const tankCapacity = data.fuelTankCapacity;
                const dataQuality = data.openingDataQuality;
                const qualityReason = data.openingDataQualityReason;
                const daysFrom = data.openingDaysFromRequested;
                const wasOnline = data.openingWasOnline;

                // For Category 2 (Full Tank Policy), show tank capacity
                if (category === 2) {
                  const displayValue = value ?? tankCapacity;
                  if (displayValue != null) {
                    return (
                      <span className="tw-text-yellow-600" title="Tank Capacity (Full Tank Policy)">
                        {displayValue.toFixed(0)}
                      </span>
                    );
                  }
                  return <span className="tw-text-gray-400 tw-text-xs">N/A</span>;
                }

                if (value === null || value === undefined) {
                  // Show reason why data is unavailable
                  const reason = qualityReason || 'No GPS data available';
                  return (
                    <div className="tw-flex tw-items-center tw-justify-end tw-gap-1">
                      <span className="tw-text-gray-400 tw-text-xs">N/A</span>
                      <i className="fa-light fa-circle-question tw-text-xs tw-text-gray-400"
                         title={reason}></i>
                    </div>
                  );
                }

                // Determine quality indicator color
                let qualityColor = 'tw-text-green-500'; // Exact
                let qualityIcon = 'fa-circle-check';
                if (dataQuality === 'Interpolated' || daysFrom > 0) {
                  qualityColor = 'tw-text-yellow-500';
                  qualityIcon = 'fa-circle-half-stroke';
                } else if (dataQuality === 'EstimatedFromRefill' || dataQuality === 'Low') {
                  qualityColor = 'tw-text-orange-500';
                  qualityIcon = 'fa-circle-exclamation';
                } else if (dataQuality === 'Unavailable') {
                  qualityColor = 'tw-text-red-500';
                  qualityIcon = 'fa-circle-xmark';
                }

                const tooltip = qualityReason
                  ? `${dataQuality}: ${qualityReason}${daysFrom > 0 ? ` (${daysFrom} days from requested)` : ''}`
                  : `${dataQuality}${wasOnline === false ? ' (Offline)' : ''}`;

                return (
                  <div className="tw-flex tw-items-center tw-justify-end tw-gap-1">
                    <span>{value.toFixed(0)}</span>
                    <i className={`fa-light ${qualityIcon} tw-text-xs ${qualityColor}`}
                       title={tooltip}></i>
                  </div>
                );
              }}
            />
          )}

          {/* Fuel Dispensed (from FuelRefill table) */}
          <Column
            dataField="totalFuelAmount"
            caption="Dispensed"
            width={85}
            dataType="number"
            format="#,##0"
            alignment="right"
            cellRender={(cellData) => (
              <span className="tw-text-green-600 tw-font-medium"
                    title="Fuel dispensed from site tanks (FuelRefill records)">
                +{cellData.value?.toFixed(0) || 0}
              </span>
            )}
          />

          {/* Closing Fuel - Show for categories with showOpeningClosing=true (1, 2, 4) */}
          {config.showOpeningClosing && (
            <Column
              dataField="closingFuel"
              caption="Closing (L)"
              width={110}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value;
                const data = cellData.data;
                const category = data.vehicleCategory;
                const tankCapacity = data.fuelTankCapacity;
                const dataQuality = data.closingDataQuality;
                const qualityReason = data.closingDataQualityReason;
                const daysFrom = data.closingDaysFromRequested;
                const wasOnline = data.closingWasOnline;

                // For Category 2 (Full Tank Policy), show tank capacity
                if (category === 2) {
                  const displayValue = value ?? tankCapacity;
                  if (displayValue != null) {
                    return (
                      <span className="tw-text-yellow-600" title="Tank Capacity (Full Tank Policy)">
                        {displayValue.toFixed(0)}
                      </span>
                    );
                  }
                  return <span className="tw-text-gray-400 tw-text-xs">N/A</span>;
                }

                if (value === null || value === undefined) {
                  // Show reason why data is unavailable
                  const reason = qualityReason || 'No GPS data available';
                  return (
                    <div className="tw-flex tw-items-center tw-justify-end tw-gap-1">
                      <span className="tw-text-gray-400 tw-text-xs">N/A</span>
                      <i className="fa-light fa-circle-question tw-text-xs tw-text-gray-400"
                         title={reason}></i>
                    </div>
                  );
                }

                // Determine quality indicator color
                let qualityColor = 'tw-text-green-500'; // Exact
                let qualityIcon = 'fa-circle-check';
                if (dataQuality === 'Interpolated' || daysFrom > 0) {
                  qualityColor = 'tw-text-yellow-500';
                  qualityIcon = 'fa-circle-half-stroke';
                } else if (dataQuality === 'EstimatedFromRefill' || dataQuality === 'Low') {
                  qualityColor = 'tw-text-orange-500';
                  qualityIcon = 'fa-circle-exclamation';
                } else if (dataQuality === 'Unavailable') {
                  qualityColor = 'tw-text-red-500';
                  qualityIcon = 'fa-circle-xmark';
                }

                const tooltip = qualityReason
                  ? `${dataQuality}: ${qualityReason}${daysFrom > 0 ? ` (${daysFrom} days from requested)` : ''}`
                  : `${dataQuality}${wasOnline === false ? ' (Offline)' : ''}`;

                return (
                  <div className="tw-flex tw-items-center tw-justify-end tw-gap-1">
                    <span>{value.toFixed(0)}</span>
                    <i className={`fa-light ${qualityIcon} tw-text-xs ${qualityColor}`}
                       title={tooltip}></i>
                  </div>
                );
              }}
            />
          )}

          {/* Calculated Consumption - Show for categories with showOpeningClosing=true */}
          {config.showOpeningClosing && (
            <Column
              caption="Calc Used"
              width={80}
              dataType="number"
              alignment="right"
              calculateCellValue={(rowData) => {
                const category = rowData.vehicleCategory;
                const tankCapacity = rowData.fuelTankCapacity;
                const added = rowData.totalFuelAmount || 0;

                // For Category 2 (Full Tank Policy), consumption = fuel added
                if (category === 2 && rowData.isFullTankPolicy) {
                  return added;
                }

                // For GPS categories, use the calculated consumption from backend
                if (rowData.consumption != null) {
                  return rowData.consumption;
                }

                // Fallback: calculate: Opening + Added - Closing
                const opening = rowData.openingFuel ?? (category === 2 ? tankCapacity : null);
                const closing = rowData.closingFuel ?? (category === 2 ? tankCapacity : null);

                if (opening != null && closing != null) {
                  return opening + added - closing;
                }
                return null;
              }}
              cellRender={(cellData) => {
                const value = cellData.value;
                if (value === null || value === undefined) {
                  return <span className="tw-text-gray-400 tw-text-xs">-</span>;
                }
                return (
                  <span className={`tw-font-medium ${value >= 0 ? 'tw-text-red-600' : 'tw-text-blue-600'}`}
                        title="Calculated: Opening + Dispensed - Closing">
                    {value >= 0 ? '-' : '+'}{Math.abs(value).toFixed(0)}
                  </span>
                );
              }}
            />
          )}

          {/* GPS Measured Consumption - Only for GPS categories (1 and 4) */}
          {config.canFetchGps && (
            <Column
              dataField="gpsMeasuredConsumption"
              caption="GPS Fuel"
              width={80}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value;
                if (value === null || value === undefined || value === 0) {
                  return <span className="tw-text-gray-400 tw-text-xs">-</span>;
                }
                return (
                  <span className="tw-font-medium tw-text-blue-600"
                        title="GPS-measured fuel consumption from VehicleConsumption table">
                    -{Math.abs(value).toFixed(0)}
                  </span>
                );
              }}
            />
          )}

          {/* Variance (for GPS categories) */}
          {config.canFetchGps && (
            <Column
              dataField="vehicleVariance"
              caption="Variance"
              width={85}
              dataType="number"
              alignment="right"
              cellRender={(cellData) => {
                const value = cellData.value;
                const hasFlag = cellData.data.hasVarianceFlag;
                const flagMessage = cellData.data.varianceFlagMessage;

                if (value === null || value === undefined) {
                  return <span className="tw-text-gray-400 tw-text-xs">-</span>;
                }

                const isNegative = value < 0;
                return (
                  <div className="tw-flex tw-items-center tw-justify-end tw-gap-1">
                    <span className={`tw-font-medium ${hasFlag ? 'tw-text-red-600' : isNegative ? 'tw-text-orange-600' : 'tw-text-green-600'}`}
                          title="Variance: Actual Closing - (Opening + Dispensed - GPS Consumption)">
                      {isNegative ? '' : '+'}{value.toFixed(1)}
                    </span>
                    {hasFlag && (
                      <i className="fa-light fa-exclamation-triangle tw-text-xs tw-text-red-500"
                         title={flagMessage || 'Variance exceeds threshold'}></i>
                    )}
                  </div>
                );
              }}
            />
          )}

          {/* Data Source */}
          <Column
            dataField="dataSourcePrimary"
            caption="Source"
            width={90}
            alignment="center"
            cellRender={(cellData) => renderDataSource(cellData.value)}
          />

          {/* Sensors indicator */}
          <Column
            caption="Sensors"
            width={65}
            alignment="center"
            cellRender={(cellData) => {
              const hasGPS = cellData.data.hasGPS;
              const hasFuelSensor = cellData.data.hasFuelSensor;
              return (
                <div className="tw-flex tw-gap-1 tw-justify-center">
                  <span
                    className={`tw-text-xs ${hasGPS ? 'tw-text-blue-500' : 'tw-text-gray-300'}`}
                    title={hasGPS ? 'GPS Tracking' : 'No GPS'}
                  >
                    <i className="fa-light fa-location-dot"></i>
                  </span>
                  <span
                    className={`tw-text-xs ${hasFuelSensor ? 'tw-text-green-500' : 'tw-text-gray-300'}`}
                    title={hasFuelSensor ? 'Fuel Sensor' : 'No Fuel Sensor'}
                  >
                    <i className="fa-light fa-gauge"></i>
                  </span>
                </div>
              );
            }}
          />

          {/* Info button - Show detailed GPS metadata popup */}
          <Column
            caption=""
            width={40}
            alignment="center"
            cellRender={(cellData) => {
              const data = cellData.data;
              const hasGpsData = data.gpsDataLoaded || data.openingDataQuality || data.closingDataQuality;
              return (
                <button
                  type="button"
                  className={`tw-p-1 tw-rounded tw-border-0 tw-bg-transparent tw-cursor-pointer hover:tw-bg-gray-100 ${hasGpsData ? 'tw-text-blue-500' : 'tw-text-gray-400'}`}
                  style={{ border: 'none', outline: 'none', background: 'transparent' }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleShowDetails(data);
                  }}
                  title="View GPS Data Details"
                >
                  <i className="fa-light fa-circle-info tw-text-base"></i>
                </button>
              );
            }}
          />

          {/* Summary row */}
          <Summary>
            <TotalItem
              column="totalFuelAmount"
              summaryType="sum"
              valueFormat="#,##0"
              displayFormat="Total: {0} L"
            />
            <TotalItem
              column="refillCount"
              summaryType="sum"
              displayFormat="{0}"
            />
          </Summary>
        </DataGrid>
      </div>
    );
  };

  // Calculate totals including variance
  const totals = useMemo(() => {
    const gpsVehicles = selectedVehicles.filter(v => [1, 4].includes(v.vehicleCategory));
    const fullTankVehicles = selectedVehicles.filter(v => v.vehicleCategory === 2);

    return {
      vehicles: selectedVehicles.length,
      fuelIssued: selectedVehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
      withGpsSensor: selectedVehicles.filter(v => v.vehicleCategory === 1).length,
      fullTankPolicy: fullTankVehicles.length,
      crossSite: selectedVehicles.filter(v => v.vehicleCategory === 4).length,
      equipment: selectedVehicles.filter(v => v.vehicleCategory === 3).length,
      external: selectedVehicles.filter(v => v.vehicleCategory === 5).length,
      vehiclesWithVariance: gpsVehicles.filter(v => v.hasVarianceFlag).length
    };
  }, [selectedVehicles]);

  return (
    <div className="wizard-step tw-p-6">
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
        <div className="tw-flex tw-items-center tw-gap-3">
          <i className="fa-light fa-chart-mixed tw-mr-2 tw-text-lg"></i>
          <h3 className="tw-text-lg tw-font-semibold">Vehicle Data Preview by Category</h3>
          {hasEditedVehicleData && (
            <div className="tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-bg-yellow-100 tw-rounded tw-border tw-border-yellow-300">
              <i className="fa-light fa-pencil tw-text-yellow-600"></i>
              <span className="tw-text-xs tw-text-yellow-700 tw-font-medium">Edited</span>
            </div>
          )}
        </div>
        {/* Action buttons */}
        {selectedVehicles.length > 0 && (
          <div className="tw-flex tw-gap-2">
            <Button
              text="Export All"
              icon="exportxlsx"
              type="default"
              stylingMode="outlined"
              onClick={handleExportAllCategories}
              disabled={loadingCategory !== null}
            />
            <Button
              text="Load Saved"
              icon="refresh"
              type="normal"
              stylingMode="outlined"
              onClick={handleLoadSaved}
              disabled={loadingCategory !== null || !draftAudit.auditId}
              hint="Reload data from last saved draft"
            />
            <Button
              text="Fetch Original"
              icon="download"
              type="default"
              stylingMode="outlined"
              onClick={handleLoadAllGpsData}
              disabled={loadingCategory !== null}
              hint="Fetch fresh GPS data from GPSGate"
            />
            <Button
              text="Save to Audit"
              icon="save"
              type="success"
              stylingMode="contained"
              onClick={handleSaveToAudit}
              disabled={loadingCategory !== null || isSaving || !draftAudit.auditId}
              hint={!draftAudit.auditId ? 'Complete Step 1 first to save' : 'Save current data to audit draft'}
            />
          </div>
        )}
      </div>
      <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
        Review fuel data for selected vehicles. Expand each row to see refill history. Use refresh to recalculate.
      </p>
      {!draftAudit.auditId && selectedVehicles.length > 0 && (
        <div className="tw-mb-4 tw-p-2 tw-bg-orange-50 tw-border tw-border-orange-200 tw-rounded tw-text-xs tw-text-orange-600">
          <i className="fa-light fa-info-circle tw-mr-1"></i>
          Complete Step 1 (Site &amp; Period) first to enable saving vehicle data to the audit draft
        </div>
      )}

      {/* Summary stats bar */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-2 md:tw-grid-cols-4 lg:tw-grid-cols-7 tw-gap-2">
        <div className="tw-bg-blue-50 tw-p-2 tw-rounded-lg tw-text-center tw-border tw-border-blue-200">
          <p className="tw-text-lg tw-font-bold tw-text-blue-700">{totals.vehicles}</p>
          <p className="tw-text-xs tw-text-blue-600">Total</p>
        </div>
        <div className="tw-bg-green-50 tw-p-2 tw-rounded-lg tw-text-center tw-border tw-border-green-200">
          <p className="tw-text-lg tw-font-bold tw-text-green-700">{totals.withGpsSensor}</p>
          <p className="tw-text-xs tw-text-green-600">GPS+Sensor</p>
        </div>
        <div className="tw-bg-yellow-50 tw-p-2 tw-rounded-lg tw-text-center tw-border tw-border-yellow-200">
          <p className="tw-text-lg tw-font-bold tw-text-yellow-700">{totals.fullTankPolicy}</p>
          <p className="tw-text-xs tw-text-yellow-600">Full Tank</p>
        </div>
        <div className="tw-bg-orange-50 tw-p-2 tw-rounded-lg tw-text-center tw-border tw-border-orange-200">
          <p className="tw-text-lg tw-font-bold tw-text-orange-700">{totals.equipment}</p>
          <p className="tw-text-xs tw-text-orange-600">Equipment</p>
        </div>
        <div className="tw-bg-cyan-50 tw-p-2 tw-rounded-lg tw-text-center tw-border tw-border-cyan-200">
          <p className="tw-text-lg tw-font-bold tw-text-cyan-700">{totals.crossSite}</p>
          <p className="tw-text-xs tw-text-cyan-600">Cross-Site</p>
        </div>
        <div className="tw-bg-pink-50 tw-p-2 tw-rounded-lg tw-text-center tw-border tw-border-pink-200">
          <p className="tw-text-lg tw-font-bold tw-text-pink-700">{totals.external}</p>
          <p className="tw-text-xs tw-text-pink-600">External</p>
        </div>
        <div className={`tw-p-2 tw-rounded-lg tw-text-center tw-border ${
          totals.vehiclesWithVariance > 0 ? 'tw-bg-red-50 tw-border-red-200' : 'tw-bg-gray-50 tw-border-gray-200'
        }`}>
          <p className={`tw-text-lg tw-font-bold ${totals.vehiclesWithVariance > 0 ? 'tw-text-red-700' : 'tw-text-gray-700'}`}>
            {totals.vehiclesWithVariance > 0 ? totals.vehiclesWithVariance : '✓'}
          </p>
          <p className={`tw-text-xs ${totals.vehiclesWithVariance > 0 ? 'tw-text-red-600' : 'tw-text-gray-600'}`}>
            Flags
          </p>
        </div>
      </div>

      {/* Global loading state */}
      {loadingCategory === 'all' && (
        <div className="tw-mb-4 tw-bg-white tw-p-4 tw-rounded-lg tw-border">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
            <span className="tw-text-sm tw-text-gray-700">
              {gpsFetchJob?.message || `Loading all vehicle data... ${Math.round(categoryProgress)}%`}
            </span>
            {gpsFetchJob?.jobId && (
              <Button
                text="Cancel"
                icon="close"
                type="danger"
                stylingMode="outlined"
                onClick={handleCancelJob}
              />
            )}
          </div>
          <ProgressBar
            value={categoryProgress}
            width="100%"
            showStatus={false}
          />
          {gpsFetchJob?.status && (
            <p className="tw-text-xs tw-text-gray-500 tw-mt-1">
              Status: {gpsFetchJob.status} | Job ID: {gpsFetchJob.jobId || 'Starting...'}
            </p>
          )}
        </div>
      )}

      {/* Category accordions */}
      {selectedVehicles.length > 0 && (
        <div className="tw-space-y-3">
          {Object.keys(CATEGORY_CONFIG).map(catId => {
            const catIndex = parseInt(catId) - 1;
            const hasVehicles = vehiclesByCategory[catId]?.length > 0;

            if (!hasVehicles) return null;

            return (
              <div key={catId} className="tw-border tw-rounded-lg tw-overflow-hidden">
                <button
                  className="tw-w-full tw-px-4 tw-py-3 tw-bg-white hover:tw-bg-gray-50 tw-flex tw-items-center tw-justify-between tw-transition-colors"
                  onClick={() => toggleCategory(catIndex)}
                >
                  {renderCategoryTitle(parseInt(catId))}
                  <i className={`fa-light fa-chevron-${expandedCategories.includes(catIndex) ? 'up' : 'down'} tw-text-gray-400 tw-ml-2`}></i>
                </button>
                {expandedCategories.includes(catIndex) && (
                  <div className="tw-border-t">
                    {renderCategoryContent(parseInt(catId))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border">
        <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          Data Source Legend
        </h4>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-3 tw-text-xs">
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('GPS_REST')}
            <span className="tw-text-gray-600">Real-time GPS fuel sensor</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('GPS_SOAP')}
            <span className="tw-text-gray-600">Historical refuel events</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('FullTank')}
            <span className="tw-text-gray-600">Tank capacity estimate</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('FuelRefill')}
            <span className="tw-text-gray-600">Manual entry records</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-location-dot tw-text-blue-500"></i>
            <span className="tw-text-gray-600">GPS Tracking</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-gauge tw-text-green-500"></i>
            <span className="tw-text-gray-600">Fuel Sensor</span>
          </div>
        </div>
      </div>

      {/* No vehicles selected */}
      {selectedVehicles.length === 0 && (
        <div className="tw-text-center tw-py-10 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200">
          <i className="fa-light fa-exclamation-circle tw-text-4xl tw-text-yellow-500 tw-mb-3"></i>
          <p className="tw-text-gray-700">No vehicles selected.</p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
            Please go back to Step 4 and select at least one vehicle.
          </p>
        </div>
      )}

      {/* GPS Data Details Popup */}
      <GPSDataDetailsPopup
        visible={detailsPopupVisible}
        vehicleDetails={selectedVehicleDetails}
        onHiding={handleCloseDetails}
      />
    </div>
  );
}
);

Step5VehiclePreview.displayName = 'Step5VehiclePreview';

export default Step5VehiclePreview;
