import React, { useState, useCallback, useEffect, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Button } from 'devextreme-react/button';
import { CheckBox } from 'devextreme-react/check-box';
import { Popup } from 'devextreme-react/popup';
import notify from 'devextreme/ui/notify';
import { fetchTransferReconciliation, clearTransferReconciliation, fetchPeriodDiagnostic, clearPeriodDiagnostic } from '../../../redux/actions/tankStockAction';
import { useStockFilters } from '../../tankStock/shared/context/StockFilterContext';
import HelpPopup from '../../../components/HelpPopup/HelpPopup';
import TransferReconciliationHelp from './TransferReconciliationHelp';
import TransferReconciliationSummary from './components/TransferReconciliationSummary';
import TransferVarianceChart from './components/TransferVarianceChart';
import TransferReconciliationGrid from './components/TransferReconciliationGrid';
import PeriodDiagnosticPanel from './components/PeriodDiagnosticPanel';
import tankStockDiagnosticService from '../../../services/tankStockDiagnosticService';
import './TransferReconciliation.scss';

const TransferReconciliation = () => {
  const dispatch = useDispatch();
  const { singleTankId: selectedTank, startDate, endDate } = useStockFilters();
  const previousTankRef = useRef(selectedTank);
  const {
    transferReconciliation,
    transferReconciliationLoading,
    periodDiagnostic,
    periodDiagnosticLoading,
    error
  } = useSelector(state => state.tankStock);

  const [includeTransferDetails, setIncludeTransferDetails] = useState(false);
  const [lastFetchParams, setLastFetchParams] = useState(null);
  const [isUnmounting, setIsUnmounting] = useState(false);

  // Diagnostic modal state
  const [diagnosticModalVisible, setDiagnosticModalVisible] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState(null);

  // Handle tank deselection - use unmounting flag to hide components before clearing data
  useEffect(() => {
    // If tank was previously selected but now unselected
    if (previousTankRef.current && !selectedTank) {
      console.log('🗑️ Tank deselected - starting unmount sequence');
      console.log('  Previous Tank:', previousTankRef.current);
      console.log('  Current Tank:', selectedTank);
      console.log('  Has Data:', !!transferReconciliation);

      // Set unmounting flag first to hide components
      setIsUnmounting(true);

      // Then clear data after a brief delay to allow components to hide
      setTimeout(() => {
        console.log('  🧹 Clearing data after unmount delay');
        dispatch(clearTransferReconciliation());
        setLastFetchParams(null);
        setIsUnmounting(false);
      }, 100);
    } else if (selectedTank && previousTankRef.current !== selectedTank) {
      console.log('🔄 Tank changed:', previousTankRef.current, '→', selectedTank);
      // Tank changed (not deselected), clear immediately
      dispatch(clearTransferReconciliation());
      setLastFetchParams(null);
      setIsUnmounting(false);
    }

    // Update previous tank reference
    previousTankRef.current = selectedTank;
  }, [selectedTank, dispatch, transferReconciliation]);

  const handleApplyClick = useCallback(async () => {
    if (!selectedTank || !startDate || !endDate) {
      notify('Please select a tank and date range', 'warning', 3000);
      return;
    }

    // Validate date range
    if (startDate >= endDate) {
      notify('Start date must be before end date', 'warning', 3000);
      return;
    }

    // Debug logging
    console.log('🔍 Transfer Reconciliation - Fetch Parameters:', {
      tankId: selectedTank,
      startDate: startDate?.toISOString(),
      endDate: endDate?.toISOString(),
      includeTransferDetails
    });

    // Check if we've already fetched this combination (caching)
    const cacheKey = `${selectedTank}-${startDate?.toISOString()}-${endDate?.toISOString()}-${includeTransferDetails}`;
    if (lastFetchParams === cacheKey) {
      console.log('📦 Using cached data for:', cacheKey);
      return; // Already have this data
    }

    console.log('🚀 Fetching transfer reconciliation analysis...');

    const result = await dispatch(fetchTransferReconciliation(
      selectedTank,
      startDate,
      endDate,
      includeTransferDetails
    ));

    if (result.success) {
      setLastFetchParams(cacheKey);
      console.log('✅ Transfer reconciliation analysis loaded successfully');
      notify('Analysis completed successfully', 'success', 3000);
    } else {
      console.error('❌ Failed to load transfer reconciliation:', result.message);
      notify(result.message || 'Failed to fetch transfer reconciliation', 'error', 4000);
    }
  }, [dispatch, selectedTank, startDate, endDate, includeTransferDetails, lastFetchParams]);

  const handleClearClick = useCallback(() => {
    dispatch(clearTransferReconciliation());
    setLastFetchParams(null);
    console.log('🗑️ Transfer reconciliation data cleared');
    notify('Analysis cleared', 'info', 2000);
  }, [dispatch]);

  const handleIncludeDetailsChange = useCallback((value) => {
    setIncludeTransferDetails(value);
    // Clear cache to force re-fetch with new details setting
    setLastFetchParams(null);
  }, []);

  // Handle diagnostic button click
  const handleDiagnosticClick = useCallback(async (period) => {
    console.log('🔍 Opening diagnostic for period:', period);

    if (!transferReconciliation?.tankId || !period) {
      notify('Missing tank or period information', 'error', 3000);
      return;
    }

    // Set selected period and show modal
    setSelectedPeriod(period);
    setDiagnosticModalVisible(true);

    // Fetch diagnostic data for this period
    const result = await dispatch(fetchPeriodDiagnostic(
      transferReconciliation.tankId,
      new Date(period.startDate),
      new Date(period.endDate),
      true, // includeAllTransactionTypes
      false // includeDeletedRecords
    ));

    if (result.success) {
      console.log('✅ Period diagnostic loaded successfully');
    } else {
      console.error('❌ Failed to load diagnostic:', result.message);
      notify(result.message || 'Failed to load period diagnostic', 'error', 4000);
    }
  }, [dispatch, transferReconciliation]);

  // Handle diagnostic modal close
  const handleCloseDiagnostic = useCallback(() => {
    setDiagnosticModalVisible(false);
    // Delay clearing data to allow modal to close smoothly
    setTimeout(() => {
      setSelectedPeriod(null);
      dispatch(clearPeriodDiagnostic());
    }, 300);
    console.log('🗑️ Diagnostic modal closed');
  }, [dispatch]);

  // Handle export diagnostic data as JSON
  const handleExportDiagnostic = useCallback((diagnosticData, periodInfo) => {
    const filename = `diagnostic_${transferReconciliation.tankName}_period_${periodInfo.periodNumber}_${new Date().toISOString().split('T')[0]}.json`;
    tankStockDiagnosticService.exportAsJSON(diagnosticData, filename);
    notify('Diagnostic data exported successfully', 'success', 3000);
  }, [transferReconciliation]);

  return (
    <div className="transfer-reconciliation-page tw-h-full tw-flex tw-flex-col">
      {/* Header with Help */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-4">
        <div>
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-1">
            <i className="fa-light fa-exchange-alt tw-mr-2"></i>
            Transfer Reconciliation Analysis
          </h2>
          <p className="tw-text-sm tw-text-gray-600">
            Track ST→FT transfers and detect fuel variances across stock entry periods
          </p>
        </div>
        <HelpPopup title="Transfer Reconciliation Help">
          <TransferReconciliationHelp />
        </HelpPopup>
      </div>

      {/* Filter Controls */}
      <div className="filter-section tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-mb-4">
        <div className="tw-flex tw-items-center tw-gap-4 tw-flex-wrap">
          {/* Info about selected tank and dates */}
          <div className="tw-flex-1 tw-min-w-[200px]">
            <div className="tw-text-sm tw-text-gray-600 tw-mb-1">
              {selectedTank ? (
                <>
                  <i className="fa-light fa-oil-can tw-mr-2 tw-text-blue-600"></i>
                  Tank ID: <span className="tw-font-semibold">{selectedTank}</span>
                </>
              ) : (
                <span className="tw-text-orange-600">
                  <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                  No tank selected
                </span>
              )}
            </div>
            <div className="tw-text-sm tw-text-gray-600">
              {startDate && endDate ? (
                <>
                  <i className="fa-light fa-calendar-range tw-mr-2 tw-text-blue-600"></i>
                  {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
                </>
              ) : (
                <span className="tw-text-orange-600">
                  <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
                  No date range selected
                </span>
              )}
            </div>
          </div>

          {/* Include Transfer Details Checkbox */}
          <div className="tw-flex tw-items-center">
            <CheckBox
              value={includeTransferDetails}
              onValueChanged={(e) => handleIncludeDetailsChange(e.value)}
              text="Include Transfer Details"
            />
            <span className="tw-ml-2 tw-text-xs tw-text-gray-500" title="Shows individual transfer transactions in each period">
              <i className="fa-light fa-circle-info"></i>
            </span>
          </div>

          {/* Action Buttons */}
          <div className="tw-flex tw-gap-2">
            <Button
              text="Apply"
              type="default"
              icon="fa-light fa-play"
              onClick={handleApplyClick}
              disabled={!selectedTank || !startDate || !endDate || transferReconciliationLoading}
            />
            <Button
              text="Clear"
              type="normal"
              icon="fa-light fa-eraser"
              onClick={handleClearClick}
              disabled={!transferReconciliation || transferReconciliationLoading}
            />
          </div>
        </div>

        {/* Hint Text */}
        <div className="tw-mt-3 tw-text-xs tw-text-gray-500 tw-flex tw-items-start">
          <i className="fa-light fa-lightbulb tw-mr-2 tw-mt-0.5"></i>
          <span>
            Use the Tank Stock filters above to select a tank and date range, then click Apply to analyze transfer reconciliation.
            The analysis will divide the timeline into periods between consecutive stock entries and calculate variance.
          </span>
        </div>
      </div>

      {/* Content Area */}
      <div className="content-area tw-flex-1 tw-overflow-auto">
        {/* Loading State */}
        {transferReconciliationLoading && (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-64 tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg">
            <div className="tw-mb-4">
              <i className="fa-light fa-spinner-third fa-spin tw-text-4xl tw-text-blue-600"></i>
            </div>
            <div className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-2">
              Analyzing Transfer Reconciliation...
            </div>
            <div className="tw-text-sm tw-text-gray-500">
              Processing stock entries, transfers, and dispensing data
            </div>
          </div>
        )}

        {/* Error State */}
        {!transferReconciliationLoading && error && (
          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-6 tw-text-center">
            <i className="fa-light fa-circle-exclamation tw-text-4xl tw-text-red-600 tw-mb-3"></i>
            <div className="tw-text-lg tw-font-semibold tw-text-red-800 tw-mb-2">
              Analysis Failed
            </div>
            <div className="tw-text-sm tw-text-red-700 tw-mb-4">
              {error}
            </div>
            <Button
              text="Retry"
              type="default"
              icon="fa-light fa-rotate-right"
              onClick={handleApplyClick}
            />
          </div>
        )}

        {/* Empty State (No Data) */}
        {!transferReconciliationLoading && !error && !transferReconciliation && (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-64 tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg">
            <div className="tw-mb-4">
              <i className="fa-light fa-chart-mixed tw-text-6xl tw-text-gray-300"></i>
            </div>
            <div className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-2">
              Ready to Analyze
            </div>
            <div className="tw-text-sm tw-text-gray-500 tw-text-center tw-max-w-md">
              Select a tank and date range using the filters above, then click Apply to begin transfer reconciliation analysis.
              The system will track ST→FT transfers and calculate expected stock for each period.
            </div>
          </div>
        )}

        {/* Results State */}
        {!transferReconciliationLoading && !error && transferReconciliation && !isUnmounting && (
          <div key={`results-${transferReconciliation.tankId}-${transferReconciliation.startDate}`} className="results-section tw-space-y-4">
            {/* Tank Info Banner */}
            <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-text-sm tw-text-blue-600 tw-font-semibold tw-mb-1">
                    Analysis Results
                  </div>
                  <div className="tw-text-lg tw-font-bold tw-text-blue-900">
                    {transferReconciliation.tankName || `Tank #${transferReconciliation.tankId}`}
                  </div>
                  <div className="tw-text-xs tw-text-blue-700 tw-mt-1">
                    <i className="fa-light fa-calendar-range tw-mr-1"></i>
                    {new Date(transferReconciliation.startDate).toLocaleDateString()} - {new Date(transferReconciliation.endDate).toLocaleDateString()}
                  </div>
                </div>
                <div className="tw-text-right">
                  <div className="tw-text-2xl tw-font-bold tw-text-blue-900">
                    {transferReconciliation.periods?.length || 0}
                  </div>
                  <div className="tw-text-xs tw-text-blue-600">
                    Periods Analyzed
                  </div>
                </div>
              </div>
            </div>

            {/* Summary Cards Section */}
            <div className="summary-section">
              <TransferReconciliationSummary summary={transferReconciliation.summary} />
            </div>

            {/* Variance Chart Section */}
            <div className="chart-section">
              <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                    <i className="fa-light fa-chart-line tw-mr-2"></i>
                    Variance Trend
                  </h3>
                </div>
                <TransferVarianceChart periods={transferReconciliation.periods} />
              </div>
            </div>

            {/* Reconciliation Grid Section */}
            <div className="grid-section">
              <div className="tw-bg-white tw-border tw-border-gray-200 tw-rounded-lg tw-p-6">
                <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
                  <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
                    <i className="fa-light fa-table tw-mr-2"></i>
                    Period Details
                  </h3>
                </div>
                <TransferReconciliationGrid
                  periods={transferReconciliation.periods}
                  tankName={transferReconciliation.tankName}
                  onDiagnosticClick={handleDiagnosticClick}
                />
              </div>
            </div>

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <div className="tw-bg-gray-50 tw-border tw-border-gray-300 tw-rounded-lg tw-p-4 tw-text-xs">
                <div className="tw-font-semibold tw-text-gray-700 tw-mb-2">
                  <i className="fa-light fa-bug tw-mr-2"></i>
                  Debug Info (Development Mode)
                </div>
                <pre className="tw-text-gray-600 tw-overflow-auto tw-max-h-48">
                  {JSON.stringify(transferReconciliation, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Diagnostic Modal Popup */}
      <Popup
        visible={diagnosticModalVisible}
        onHiding={handleCloseDiagnostic}
        title={selectedPeriod ? `Period ${selectedPeriod.periodNumber} Diagnostic - ${transferReconciliation?.tankName || 'Tank'}` : 'Period Diagnostic'}
        width="95%"
        height="90%"
        showCloseButton={true}
        showTitle={true}
        dragEnabled={false}
        closeOnOutsideClick={false}
        wrapperAttr={{ class: 'diagnostic-popup-wrapper' }}
      >
        {diagnosticModalVisible && (
          <div key={selectedPeriod?.periodNumber || 'diagnostic'} style={{ height: '100%', width: '100%' }}>
            <PeriodDiagnosticPanel
              diagnosticData={periodDiagnostic}
              periodInfo={selectedPeriod}
              loading={periodDiagnosticLoading}
              error={error}
              onExportJSON={handleExportDiagnostic}
            />
          </div>
        )}
      </Popup>
    </div>
  );
};

export default TransferReconciliation;
