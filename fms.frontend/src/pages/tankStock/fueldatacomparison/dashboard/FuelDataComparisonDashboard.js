import React, { useState, useEffect, useCallback } from 'react';
import { Button, LoadPanel } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import FuelComparisonMetricCard from '../components/FuelComparisonMetricCard';
import ComparisonDataGrid from '../components/ComparisonDataGrid';
import SettingsModal from '../modals/SettingsModal';
import FetchGpsDataModal from '../modals/FetchGpsDataModal';
import { useStockFilters } from '../../shared/context/StockFilterContext';
import businessSignalRService from '../../../../signalR/businessSignalRService';
import {
  getVarianceReport,
  getUserSettings,
  fetchGpsData
} from '../../../../api/fuelComparisonClient';
import './FuelDataComparisonDashboard.scss';

/**
 * FuelDataComparisonDashboard - Main dashboard for Fuel Data Comparison feature
 *
 * Compares fuel data from 3 sources:
 * - Manual entry (fuelrefil table)
 * - PTS automated (pumptransaction table)
 * - GPS data (gpsgate_report_entries table)
 *
 * Features:
 * - Variance analysis with user-configurable threshold
 * - Row highlighting (RED > threshold, YELLOW > 50% threshold)
 * - Edit/Delete GPS entries with audit trail
 * - Fetch new GPS data from GPSGate
 * - Filter by all/site/tank (uses StockFilterContext)
 *
 * @returns {JSX.Element} Fuel Data Comparison Dashboard
 */
const FuelDataComparisonDashboard = () => {
  // Context for filters (from TankStock shared context)
  const { startDate, endDate, selectedSiteIds, selectedTankIds } = useStockFilters();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isFetchingGps, setIsFetchingGps] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [userSettings, setUserSettings] = useState(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showFetchGpsModal, setShowFetchGpsModal] = useState(false);

  // GPS fetch tracking
  const [gpsFetchJob, setGpsFetchJob] = useState(null);
  const [gpsFetchProgress, setGpsFetchProgress] = useState({
    status: '',
    progressPercent: 0,
    message: ''
  });

  /**
   * Load variance report with comparison data
   */
  const loadVarianceReport = useCallback(async () => {
    if (!startDate || !endDate) {
      return;
    }

    try {
      setIsLoading(true);

      const params = {
        startDate: startDate,
        endDate: endDate,
        filterType: 'all',
        siteId: selectedSiteIds && selectedSiteIds.length > 0 ? selectedSiteIds[0] : null,
        tankId: selectedTankIds && selectedTankIds.length > 0 ? selectedTankIds[0] : null
      };

      const response = await getVarianceReport(params);

      if (response.isSuccess) {
        setReportData(response.data);
      } else {
        notify(response.message || 'Failed to load variance report', 'error', 3000);
        setReportData(null);
      }
    } catch (error) {
      console.error('Error loading variance report:', error);
      notify('Failed to load variance report', 'error', 3000);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedSiteIds, selectedTankIds]);

  /**
   * Load user settings from API
   */
  const loadUserSettings = async () => {
    try {
      setIsLoadingSettings(true);
      const response = await getUserSettings();

      if (response.isSuccess) {
        setUserSettings(response.data);
      } else {
        notify(response.message || 'Failed to load settings', 'error', 3000);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      notify('Failed to load user settings', 'error', 3000);
    } finally {
      setIsLoadingSettings(false);
    }
  };

  /**
   * Load user settings on component mount
   */
  useEffect(() => {
    loadUserSettings();
  }, []);

  /**
   * Subscribe to GPS fetch SignalR events
   */
  useEffect(() => {
    // Ensure SignalR is connected
    if (!businessSignalRService.isConnected) {
      businessSignalRService.start().catch(err => {
        console.error('Failed to connect to SignalR:', err);
      });
    }

    // Subscribe to GPS fetch progress events
    const cleanupProgress = businessSignalRService.on('GpsFetchProgress', (data) => {
      console.log('[GPS Fetch] Progress:', data);
      if (gpsFetchJob && data.jobId === gpsFetchJob) {
        setGpsFetchProgress({
          status: data.status,
          progressPercent: data.progressPercent,
          message: data.message
        });
      }
    });

    const cleanupCompleted = businessSignalRService.on('GpsFetchCompleted', (data) => {
      console.log('[GPS Fetch] Completed:', data);
      if (gpsFetchJob && data.jobId === gpsFetchJob) {
        setIsFetchingGps(false);
        setGpsFetchJob(null);

        const result = data.result;

        // Show success notification
        notify(
          `GPS fetch completed! Fetched: ${result.totalRecordsFetched}, ` +
          `Saved: ${result.newRecordsSaved}, Updated: ${result.recordsUpdated || 0}`,
          'success',
          5000
        );

        // Show warning if there are unmapped vehicles
        if (result.unmappedVehiclesCount > 0) {
          const unmappedList = result.unmappedVehicles?.slice(0, 5).join(', ') || '';
          const moreCount = (result.unmappedVehicles?.length || 0) - 5;
          const moreText = moreCount > 0 ? ` and ${moreCount} more` : '';

          notify(
            `Warning: ${result.unmappedVehiclesCount} records skipped due to unmapped GPSGate vehicles: ${unmappedList}${moreText}. ` +
            `Go to Admin > Provider Configuration to create mappings.`,
            'warning',
            10000
          );
        }

        // Reload report to show new data
        loadVarianceReport();
      }
    });

    const cleanupError = businessSignalRService.on('GpsFetchError', (data) => {
      console.error('[GPS Fetch] Error:', data);
      if (gpsFetchJob && data.jobId === gpsFetchJob) {
        setIsFetchingGps(false);
        setGpsFetchJob(null);
        notify(`GPS fetch failed: ${data.error}`, 'error', 5000);
      }
    });

    // Cleanup on unmount
    return () => {
      cleanupProgress();
      cleanupCompleted();
      cleanupError();
    };
  }, [gpsFetchJob, loadVarianceReport]);

  /**
   * Load variance report when filters change
   */
  useEffect(() => {
    if (userSettings && startDate && endDate) {
      loadVarianceReport();
    }
  }, [startDate, endDate, userSettings, loadVarianceReport]);

  /**
   * Handle settings save
   */
  const handleSettingsSaved = (newSettings) => {
    setUserSettings(newSettings);
    setShowSettingsModal(false);
    // Reload report with new threshold
    loadVarianceReport();
    notify('Settings updated successfully', 'success', 3000);
  };

  /**
   * Handle GPS data fetch (fire-and-forget with SignalR progress)
   */
  const handleFetchGpsData = async (fetchParams) => {
    try {
      setIsFetchingGps(true);
      setShowFetchGpsModal(false);
      setGpsFetchProgress({ status: 'Starting...', progressPercent: 0, message: '' });

      const response = await fetchGpsData(fetchParams);

      if (response.isSuccess) {
        const jobId = response.data.jobId;
        setGpsFetchJob(jobId);

        notify('GPS data fetch started. You will be notified when complete.', 'info', 3000);
      } else {
        setIsFetchingGps(false);
        notify(response.message || 'Failed to start GPS fetch', 'error', 5000);
      }
    } catch (error) {
      console.error('Error starting GPS fetch:', error);
      setIsFetchingGps(false);
      notify('Error starting GPS data fetch', 'error', 5000);
    }
  };

  /**
   * Handle data refresh after grid operations (edit/delete)
   */
  const handleDataRefresh = () => {
    loadVarianceReport();
  };

  // Calculate metrics from summary
  const summary = reportData?.summary || {};
  const highVariancePercent = summary.highVariancePercent || 0;
  const dataCompletenessPercent = summary.dataCompletenessPercent || 0;

  return (
    <div className="fuel-data-comparison-dashboard">
      {/* Action Bar */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center tw-gap-3">
          <Button
            text="Fetch GPS Data"
            icon="fa-light fa-satellite-dish"
            onClick={() => setShowFetchGpsModal(true)}
            type="default"
            stylingMode="contained"
            disabled={isLoading || isFetchingGps}
          />
          <Button
            text="Settings"
            icon="fa-light fa-cog"
            onClick={() => setShowSettingsModal(true)}
            type="normal"
            stylingMode="outlined"
            disabled={isLoadingSettings}
          />
          <Button
            text="Refresh"
            icon="fa-light fa-rotate"
            onClick={loadVarianceReport}
            type="normal"
            stylingMode="text"
            disabled={isLoading}
          />
        </div>

        {/* Current Threshold Display */}
        {userSettings && (
          <div className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg">
            <i className="fa-light fa-ruler tw-text-blue-600"></i>
            <span className="tw-text-sm tw-font-medium tw-text-blue-800">
              Variance Threshold: <span className="tw-font-bold">{userSettings.varianceThreshold}L</span>
            </span>
          </div>
        )}
      </div>

      {/* Metrics Cards */}
      {!isLoading && reportData && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
          <FuelComparisonMetricCard
            title="Total Records"
            icon="fa-light fa-database"
            tone="info"
            value={summary.totalRecords}
            unit="records"
            subtitle={`${summary.completeRecords} complete, ${summary.partialRecords} partial`}
          />
          <FuelComparisonMetricCard
            title="High Variance"
            icon="fa-light fa-triangle-exclamation"
            tone={highVariancePercent > 20 ? 'negative' : highVariancePercent > 10 ? 'warning' : 'success'}
            value={summary.highVarianceCount}
            unit="records"
            subtitle={`${highVariancePercent.toFixed(1)}% of total`}
          />
          <FuelComparisonMetricCard
            title="Average Variance"
            icon="fa-light fa-chart-line"
            tone={summary.averageVariance > 10 ? 'warning' : 'success'}
            value={summary.averageVariance}
            unit="L"
            subtitle={`Max: ${summary.maxVariance?.toFixed(1) || 0}L`}
            formatValue={(val) => val?.toFixed(2) || '0'}
          />
          <FuelComparisonMetricCard
            title="Data Completeness"
            icon="fa-light fa-circle-check"
            tone={dataCompletenessPercent < 70 ? 'negative' : dataCompletenessPercent < 90 ? 'warning' : 'success'}
            value={dataCompletenessPercent}
            unit="%"
            subtitle={`${summary.singleSourceRecords} with 1 source only`}
            formatValue={(val) => val?.toFixed(1) || '0'}
          />
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-p-12">
          <LoadPanel
            visible={true}
            message="Loading comparison data..."
            showPane={true}
          />
        </div>
      )}

      {/* Data Grid */}
      {!isLoading && reportData && (
        <ComparisonDataGrid
          data={reportData.details || []}
          varianceThreshold={userSettings?.varianceThreshold || 10.0}
          onRefresh={handleDataRefresh}
        />
      )}

      {/* Empty State */}
      {!isLoading && !reportData && (
        <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-p-12 tw-bg-white tw-rounded-lg tw-shadow-md tw-border tw-border-gray-200">
          <i className="fa-light fa-inbox tw-text-6xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-700 tw-mb-2">
            No Data Available
          </h3>
          <p className="tw-text-gray-500 tw-mb-6 tw-text-center">
            Select a date range using the filters above to view comparison data.<br />
            Or click "Fetch GPS Data" to retrieve data from GPSGate.
          </p>
        </div>
      )}

      {/* Settings Modal */}
      {showSettingsModal && userSettings && (
        <SettingsModal
          visible={showSettingsModal}
          currentSettings={userSettings}
          onClose={() => setShowSettingsModal(false)}
          onSave={handleSettingsSaved}
        />
      )}

      {/* Fetch GPS Data Modal */}
      {showFetchGpsModal && (
        <FetchGpsDataModal
          visible={showFetchGpsModal}
          currentFilters={{ startDate, endDate, siteId: selectedSiteIds?.[0], vehicleId: null }}
          onClose={() => setShowFetchGpsModal(false)}
          onFetch={handleFetchGpsData}
        />
      )}

      {/* GPS Fetch Progress Overlay */}
      {isFetchingGps && (
        <div className="tw-fixed tw-inset-0 tw-bg-black tw-bg-opacity-50 tw-flex tw-items-center tw-justify-center tw-z-50">
          <div className="tw-bg-white tw-rounded-lg tw-shadow-xl tw-p-8 tw-max-w-md tw-w-full tw-mx-4">
            <div className="tw-flex tw-flex-col tw-items-center">
              {/* Animated Icon */}
              <div className="tw-mb-4">
                <i className="fa-light fa-satellite-dish tw-text-5xl tw-text-blue-500 tw-animate-pulse"></i>
              </div>

              {/* Title */}
              <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-2">
                Fetching GPS Data
              </h3>

              {/* Status */}
              <div className="tw-text-sm tw-text-gray-600 tw-mb-4 tw-text-center">
                {gpsFetchProgress.status || 'Connecting to GPSGate...'}
              </div>

              {/* Progress Bar */}
              <div className="tw-w-full tw-mb-3">
                <div className="tw-flex tw-justify-between tw-text-xs tw-text-gray-500 tw-mb-1">
                  <span>Progress</span>
                  <span>{gpsFetchProgress.progressPercent || 0}%</span>
                </div>
                <div className="tw-w-full tw-bg-gray-200 tw-rounded-full tw-h-3">
                  <div
                    className="tw-bg-gradient-to-r tw-from-blue-500 tw-to-blue-600 tw-h-3 tw-rounded-full tw-transition-all tw-duration-500 tw-ease-out"
                    style={{ width: `${gpsFetchProgress.progressPercent || 0}%` }}
                  />
                </div>
              </div>

              {/* Message */}
              {gpsFetchProgress.message && (
                <div className="tw-text-xs tw-text-gray-500 tw-text-center tw-mt-2">
                  {gpsFetchProgress.message}
                </div>
              )}

              {/* Job ID (for debugging) */}
              {gpsFetchJob && (
                <div className="tw-text-xs tw-text-gray-400 tw-mt-4">
                  Job: {gpsFetchJob.substring(0, 8)}...
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FuelDataComparisonDashboard;
