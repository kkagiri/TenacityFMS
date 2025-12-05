/**
 * Step3TankPreview.js
 * Step 3: Tank Volume Data Preview
 *
 * Purpose: Collect and display tank volume data for user review.
 * This data will be used in subsequent steps (Step 6 Review & Create).
 *
 * Shows selected tanks with their audit period data:
 * - Opening stock (at period start date) - EDITABLE
 * - Closing stock (at period end date) - EDITABLE
 * - Total deliveries
 * - Total dispensed
 * - Transfers in (from other tanks)
 * - Transfers out (to other tanks)
 *
 * Features:
 * - Editable Opening and Closing columns
 * - Export to Excel functionality
 *
 * Data comes from TankVolumeHistory via /fuelaudit/tank-preview endpoint
 */

import React, { useEffect, useCallback, useMemo, memo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, {
  Column,
  Summary,
  TotalItem,
  Editing,
  Export,
  Paging,
  Scrolling
} from 'devextreme-react/data-grid';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';
import { confirm } from 'devextreme/ui/dialog';
import { exportDataGrid } from 'devextreme/excel_exporter';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import notify from 'devextreme/ui/notify';

import {
  selectWizard,
  selectLoading,
  fetchTankVolumePreview,
  selectWizardTankPreview,
  updateTankPreviewData,
  saveDraftAudit,
  selectWizardDraftAudit,
  loadDraftToWizard
} from '../../../../../../redux/slices/fuelAuditSlice';
import { fetchFuelAuditById } from '../../../../../../redux/slices/fuelAuditThunks';

const Step3TankPreview = memo(() => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const loading = useSelector(selectLoading);
  const tankPreview = useSelector(selectWizardTankPreview);
  const draftAudit = useSelector(selectWizardDraftAudit);
  const gridRef = useRef(null);

  // Track if component is mounted to prevent state updates after unmount
  const isMountedRef = useRef(true);

  // Track if data is ready to display (prevents rendering during async updates)
  const [isDataReady, setIsDataReady] = useState(false);

  // Track if save is in progress
  const [isSaving, setIsSaving] = useState(false);

  // Create a mutable copy of tankPreview for DataGrid editing
  // Redux state is immutable, so we need a local copy that DataGrid can modify
  const [localPreviewData, setLocalPreviewData] = useState([]);

  // Check if any data has been edited (marked with isEdited flag)
  const hasEditedData = useMemo(() => {
    return tankPreview?.some(t => t.isEdited) || false;
  }, [tankPreview]);

  // Load tank preview data when step is reached
  const loadPreviewData = useCallback(async () => {
    console.log('[Step3] loadPreviewData called');
    console.log('[Step3] selectedTankIds:', wizard.selectedTankIds);
    console.log('[Step3] periodStart:', wizard.periodStart);
    console.log('[Step3] periodEnd:', wizard.periodEnd);

    if (wizard.selectedTankIds?.length > 0 && wizard.periodStart && wizard.periodEnd) {
      // For multi-site, pass siteIds array; for single site compatibility
      const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : (wizard.siteIds ? [wizard.siteIds] : []);

      console.log('[Step3] Fetching tank volume preview with params:', {
        tankIds: wizard.selectedTankIds,
        startDate: wizard.periodStart,
        endDate: wizard.periodEnd,
        siteIds: siteIds
      });

      try {
        const result = await dispatch(fetchTankVolumePreview({
          tankIds: wizard.selectedTankIds,
          startDate: wizard.periodStart,
          endDate: wizard.periodEnd,
          siteIds: siteIds  // Pass array of site IDs
        })).unwrap();

        console.log('[Step3] fetchTankVolumePreview result:', result);

        // Only set data ready if still mounted
        if (isMountedRef.current) {
          setIsDataReady(true);
        }
      } catch (error) {
        console.error('[Step3] Error loading tank preview:', error);
        if (isMountedRef.current) {
          setIsDataReady(true); // Still set ready so empty state shows
        }
      }
    } else {
      console.log('[Step3] Missing required data for preview - skipping fetch');
    }
  }, [dispatch, wizard.selectedTankIds, wizard.periodStart, wizard.periodEnd, wizard.siteIds]);

  // Fetch original data from database (with confirmation if edited data exists)
  const handleFetchOriginal = useCallback(async () => {
    console.log('[Step3] handleFetchOriginal called');
    console.log('[Step3] hasEditedData:', hasEditedData);
    console.log('[Step3] wizard.selectedTankIds:', wizard.selectedTankIds);
    console.log('[Step3] wizard.periodStart:', wizard.periodStart);
    console.log('[Step3] wizard.periodEnd:', wizard.periodEnd);

    // Show notification immediately to confirm button click
    notify('Fetching original data...', 'info', 1000);

    if (hasEditedData) {
      const result = await confirm(
        'You have edited data that will be lost. Are you sure you want to fetch original data from the database?',
        'Fetch Original Data'
      );
      if (!result) return;
    }

    console.log('[Step3] Calling loadPreviewData...');
    await loadPreviewData();
    notify('Data fetched from database', 'success', 2000);
  }, [hasEditedData, loadPreviewData, wizard.selectedTankIds, wizard.periodStart, wizard.periodEnd]);

  // Load saved data from draft (backend)
  const handleLoadSaved = useCallback(async () => {
    console.log('[Step3] handleLoadSaved called');
    console.log('[Step3] draftAudit.auditId:', draftAudit.auditId);

    if (!draftAudit.auditId) {
      notify('No saved draft found', 'warning', 2000);
      return;
    }

    try {
      notify('Loading saved data...', 'info', 2000);
      const result = await dispatch(fetchFuelAuditById({ auditId: draftAudit.auditId })).unwrap();
      console.log('[Step3] fetchFuelAuditById result:', result);

      if (result.isSuccess && result.data) {
        console.log('[Step3] tankerReadings from API:', result.data.tankerReadings);

        // Update wizard state with loaded data
        dispatch(loadDraftToWizard(result.data));

        // Also manually sync local data since loadDraftToWizard sets tankPreview
        // This ensures the DataGrid updates immediately
        if (result.data.tankerReadings?.length > 0) {
          const mappedData = result.data.tankerReadings.map(r => ({
            tankId: r.tankId,
            tankName: r.tankName,
            tankCapacity: r.tankCapacity,
            openingStock: r.openingStock,
            closingStock: r.closingStock,
            totalDeliveries: r.fuelReceived,
            totalDispensed: r.fuelDispensed,
            totalTransfersIn: r.fuelTransferredIn,
            totalTransfersOut: r.fuelTransferredOut,
            expectedClosing: r.expectedClosing,
            variance: r.variance,
            variancePercent: r.variancePercent,
            openingDataSource: r.openingMethod || 'Draft',
            closingDataSource: r.closingMethod || 'Draft',
            hasVarianceFlag: r.hasVarianceFlag,
            isEdited: false
          }));
          console.log('[Step3] Mapped data for DataGrid:', mappedData);
          setLocalPreviewData(mappedData);
          setIsDataReady(true);
        }

        notify('Saved data loaded successfully', 'success', 3000);
      }
    } catch (error) {
      console.error('[Step3] Error loading saved data:', error);
      notify('Failed to load saved data', 'error', 3000);
    }
  }, [dispatch, draftAudit.auditId]);

  // Save current data to audit draft
  const handleSaveToAudit = useCallback(async () => {
    if (!draftAudit.auditId) {
      notify('Please save the audit draft first (complete Step 1)', 'warning', 3000);
      return;
    }

    setIsSaving(true);
    try {
      const siteIds = Array.isArray(wizard.siteIds) ? wizard.siteIds : [];

      // Prepare tank preview data for saving
      const tankPreviewData = localPreviewData.map(t => ({
        tankId: t.tankId,
        tankName: t.tankName,
        openingStock: t.openingStock,
        closingStock: t.closingStock,
        totalDeliveries: t.totalDeliveries,
        totalDispensed: t.totalDispensed,
        totalTransfersIn: t.totalTransfersIn,
        totalTransfersOut: t.totalTransfersOut,
        openingDataSource: t.openingDataSource,
        closingDataSource: t.closingDataSource,
        isEdited: t.isEdited || false
      }));

      // Debug logging
      console.log('[Step3] Saving tank data to audit:', {
        auditId: draftAudit.auditId,
        selectedTankIds: wizard.selectedTankIds,
        tankPreviewDataCount: tankPreviewData.length,
        tankPreviewData: tankPreviewData
      });

      await dispatch(saveDraftAudit({
        auditId: draftAudit.auditId,
        wizardStep: 3,
        siteIds: siteIds,
        periodStart: wizard.periodStart,
        periodEnd: wizard.periodEnd,
        selectedTankIds: wizard.selectedTankIds,
        tankPreviewData: tankPreviewData
      })).unwrap();

      notify('Tank data saved to audit draft', 'success', 3000);
    } catch (error) {
      console.error('Error saving tank data:', error);
      notify('Failed to save tank data', 'error', 3000);
    } finally {
      setIsSaving(false);
    }
  }, [dispatch, draftAudit.auditId, wizard.siteIds, wizard.periodStart, wizard.periodEnd, wizard.selectedTankIds, localPreviewData]);

  // Handle cell value changes (for editable columns)
  const handleRowUpdated = useCallback((e) => {
    // Update local state with the edited value
    setLocalPreviewData(prevData =>
      prevData.map(item =>
        item.tankId === e.key ? { ...item, ...e.data } : item
      )
    );

    // Update Redux state with the edited value
    dispatch(updateTankPreviewData({
      tankId: e.key,
      changes: e.data
    }));
    notify('Tank data updated', 'success', 2000);
  }, [dispatch]);

  // Export to Excel
  const handleExportExcel = useCallback(() => {
    if (!gridRef.current) return;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Tank Preview');

    // Format dates for filename
    const startDate = wizard.periodStart ? new Date(wizard.periodStart).toISOString().split('T')[0] : 'start';
    const endDate = wizard.periodEnd ? new Date(wizard.periodEnd).toISOString().split('T')[0] : 'end';

    exportDataGrid({
      component: gridRef.current.instance,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        // Format header row
        if (gridCell.rowType === 'header') {
          excelCell.font = { bold: true };
          excelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' }
          };
        }
        // Format summary row
        if (gridCell.rowType === 'totalFooter') {
          excelCell.font = { bold: true };
          excelCell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFFFF0CC' }
          };
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), `Tank_Preview_${startDate}_to_${endDate}.xlsx`);
        notify('Tank preview exported to Excel', 'success', 3000);
      });
    });
  }, [wizard.periodStart, wizard.periodEnd]);

  // Load on mount if we have required data AND no existing data
  // Don't auto-fetch if:
  // 1. Data already exists (tankPreview has items)
  // 2. Data was edited (hasEditedData)
  // This prevents losing edited data when navigating back from Step 4 to Step 2 and back to Step 3
  useEffect(() => {
    if (wizard.selectedTankIds?.length > 0) {
      if (tankPreview?.length > 0) {
        // Data already exists (from draft or previous fetch), just mark as ready
        setIsDataReady(true);
      } else if (!hasEditedData) {
        // No data exists and nothing was edited, fetch from database
        loadPreviewData();
      } else {
        // Has edited data flag but no preview data - this shouldn't happen normally
        setIsDataReady(true);
      }
    }
  }, [wizard.selectedTankIds, tankPreview?.length, hasEditedData, loadPreviewData]);

  // Sync Redux tankPreview to local mutable state for DataGrid editing
  useEffect(() => {
    console.log('[Step3] tankPreview sync useEffect triggered');
    console.log('[Step3] tankPreview:', tankPreview);
    console.log('[Step3] tankPreview length:', tankPreview?.length);

    if (tankPreview && tankPreview.length > 0) {
      // Create deep copy to make data mutable for DataGrid
      console.log('[Step3] Setting localPreviewData from tankPreview');
      setLocalPreviewData(tankPreview.map(item => ({ ...item })));
    } else {
      console.log('[Step3] tankPreview empty, clearing localPreviewData');
      setLocalPreviewData([]);
    }
  }, [tankPreview]);

  // Set mounted flag and cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      // Store the current ref value for cleanup
      const grid = gridRef.current;
      if (grid?.instance) {
        try {
          grid.instance.dispose();
        } catch (e) {
          // Ignore disposal errors
        }
      }
    };
  }, []);

  // Calculate summary totals - use localPreviewData for accurate totals after edits
  const summaryTotals = useMemo(() => {
    if (!localPreviewData || localPreviewData.length === 0) {
      return {
        openingStock: 0,
        closingStock: 0,
        deliveries: 0,
        dispensed: 0,
        transfersIn: 0,
        transfersOut: 0,
        variance: 0,
        tankCount: 0
      };
    }

    return {
      openingStock: localPreviewData.reduce((sum, t) => sum + (t.openingStock || 0), 0),
      closingStock: localPreviewData.reduce((sum, t) => sum + (t.closingStock || 0), 0),
      deliveries: localPreviewData.reduce((sum, t) => sum + (t.totalDeliveries || 0), 0),
      dispensed: localPreviewData.reduce((sum, t) => sum + (t.totalDispensed || 0), 0),
      transfersIn: localPreviewData.reduce((sum, t) => sum + (t.totalTransfersIn || 0), 0),
      transfersOut: localPreviewData.reduce((sum, t) => sum + (t.totalTransfersOut || 0), 0),
      variance: localPreviewData.reduce((sum, t) => sum + (t.variance || 0), 0),
      tankCount: localPreviewData.length
    };
  }, [localPreviewData]);

  // Render data source indicator
  const renderDataSource = (cellData) => {
    const source = cellData.value;
    const isManual = source === 'Manual';
    return (
      <span className={`tw-flex tw-items-center tw-gap-1 tw-text-xs ${isManual ? 'tw-text-green-600' : 'tw-text-yellow-600'}`}>
        <i className={`fa-light ${isManual ? 'fa-check-circle' : 'fa-calculator'}`}></i>
        {source}
      </span>
    );
  };

  // Format date for display
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  const isLoading = loading.tankPreview;
  const previewData = localPreviewData || [];

  return (
    <div className="wizard-step tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
        <i className="fa-light fa-chart-bar tw-mr-2"></i>
        Tank Volume Preview
      </h3>
      <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
        Review tank stock levels and transactions for the audit period.
        Opening and closing stocks are derived from TankVolumeHistory records.
      </p>

      {/* Period info header */}
      {wizard.periodStart && wizard.periodEnd && (
        <div className="tw-mb-4 tw-p-3 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-6">
              <div>
                <i className="fa-light fa-calendar tw-text-blue-600 tw-mr-2"></i>
                <span className="tw-text-sm tw-text-blue-800">
                  {formatDate(wizard.periodStart)} — {formatDate(wizard.periodEnd)}
                </span>
              </div>
              <div>
                <i className="fa-light fa-database tw-text-blue-600 tw-mr-2"></i>
                <span className="tw-text-sm tw-text-blue-800">
                  {wizard.selectedTankIds?.length || 0} tank(s) selected
                </span>
              </div>
              {hasEditedData && (
                <div className="tw-flex tw-items-center tw-gap-1 tw-px-2 tw-py-1 tw-bg-yellow-100 tw-rounded tw-border tw-border-yellow-300">
                  <i className="fa-light fa-pencil tw-text-yellow-600"></i>
                  <span className="tw-text-xs tw-text-yellow-700 tw-font-medium">Edited</span>
                </div>
              )}
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <Button
                text="Load Saved"
                icon="refresh"
                type="normal"
                stylingMode="outlined"
                onClick={handleLoadSaved}
                disabled={isLoading || !draftAudit.auditId}
                hint="Reload data from last saved draft"
              />
              <Button
                text="Fetch Original"
                icon="download"
                type="normal"
                stylingMode="outlined"
                onClick={handleFetchOriginal}
                disabled={isLoading}
                hint="Fetch fresh data from TankVolumeHistory table"
              />
              <Button
                text="Save to Audit"
                icon="save"
                type="success"
                stylingMode="contained"
                onClick={handleSaveToAudit}
                disabled={isLoading || isSaving || !draftAudit.auditId}
                hint={!draftAudit.auditId ? 'Complete Step 1 first to save' : 'Save current data to audit draft'}
              />
            </div>
          </div>
          {!draftAudit.auditId && (
            <div className="tw-mt-2 tw-text-xs tw-text-orange-600">
              <i className="fa-light fa-info-circle tw-mr-1"></i>
              Complete Step 1 (Site &amp; Period) first to enable saving
            </div>
          )}
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
          <LoadIndicator />
          <span className="tw-ml-3 tw-text-gray-600">Loading tank volume data...</span>
        </div>
      )}

      {/* Tank preview data */}
      {!isLoading && isDataReady && previewData.length > 0 && (
        <>
          {/* Summary Cards - 6 columns */}
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-3 tw-mb-4">
            {/* Opening */}
            <div className="tw-bg-green-50 tw-p-3 tw-rounded-lg tw-border tw-border-green-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-sunrise tw-text-green-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-green-600 tw-font-medium">Opening</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-green-700">
                {summaryTotals.openingStock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-green-600">Liters</p>
            </div>

            {/* Deliveries */}
            <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-border tw-border-blue-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-truck-ramp tw-text-blue-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-blue-600 tw-font-medium">Deliveries</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-blue-700">
                +{summaryTotals.deliveries.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-blue-600">Received</p>
            </div>

            {/* Dispensed */}
            <div className="tw-bg-purple-50 tw-p-3 tw-rounded-lg tw-border tw-border-purple-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-gas-pump tw-text-purple-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-purple-600 tw-font-medium">Dispensed</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-purple-700">
                -{summaryTotals.dispensed.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-purple-600">Issued</p>
            </div>

            {/* Transfer In */}
            <div className="tw-bg-cyan-50 tw-p-3 tw-rounded-lg tw-border tw-border-cyan-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-arrow-right-to-arc tw-text-cyan-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-cyan-600 tw-font-medium">Transfer In</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-cyan-700">
                +{summaryTotals.transfersIn.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-cyan-600">From tanks</p>
            </div>

            {/* Transfer Out */}
            <div className="tw-bg-pink-50 tw-p-3 tw-rounded-lg tw-border tw-border-pink-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-arrow-right-from-arc tw-text-pink-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-pink-600 tw-font-medium">Transfer Out</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-pink-700">
                -{summaryTotals.transfersOut.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-pink-600">To tanks</p>
            </div>

            {/* Closing */}
            <div className="tw-bg-orange-50 tw-p-3 tw-rounded-lg tw-border tw-border-orange-200">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-1">
                <i className="fa-light fa-sunset tw-text-orange-600 tw-text-lg"></i>
                <span className="tw-text-xs tw-text-orange-600 tw-font-medium">Closing</span>
              </div>
              <p className="tw-text-xl tw-font-bold tw-text-orange-700">
                {summaryTotals.closingStock.toLocaleString(undefined, { maximumFractionDigits: 0 })}
              </p>
              <p className="tw-text-xs tw-text-orange-600">Liters</p>
            </div>
          </div>

          {/* Export Button */}
          <div className="tw-flex tw-justify-end tw-mb-2">
            <button
              onClick={handleExportExcel}
              className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-green-600 tw-text-white tw-rounded tw-hover:tw-bg-green-700 tw-transition-colors"
            >
              <i className="fa-light fa-file-excel"></i>
              Export to Excel
            </button>
          </div>

          {/* Per-tank DataGrid */}
          <DataGrid
            ref={gridRef}
            dataSource={previewData}
            keyExpr="tankId"
            showBorders={true}
            showRowLines={true}
            columnAutoWidth={true}
            rowAlternationEnabled={true}
            height={400}
            wordWrapEnabled={true}
            onRowUpdated={handleRowUpdated}
          >
            <Editing
              mode="cell"
              allowUpdating={true}
            />
            <Export enabled={true} />
            <Column dataField="tankName" caption="Tank" width={150} fixed={true} allowEditing={false} />

            {/* Opening Stock with date indicator */}
            <Column
              dataField="openingStock"
              caption={`Opening (L)\n${formatDate(wizard.periodStart)}`}
              width={130}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              allowEditing={true}
              headerCellRender={() => (
                <div className="tw-text-center">
                  <div className="tw-font-semibold">Opening (L)</div>
                  <div className="tw-text-xs tw-text-gray-500">{formatDate(wizard.periodStart)}</div>
                </div>
              )}
              cssClass="tw-bg-green-50"
            />

            <Column
              dataField="openingDataSource"
              caption="Source"
              width={90}
              cellRender={renderDataSource}
              alignment="center"
              allowEditing={false}
            />

            {/* Deliveries */}
            <Column
              dataField="totalDeliveries"
              caption="Deliveries (L)"
              width={120}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              allowEditing={false}
              cellRender={(cellData) => (
                <span className="tw-text-blue-600 tw-font-medium">
                  +{(cellData.value || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              )}
            />

            {/* Dispensed */}
            <Column
              dataField="totalDispensed"
              caption="Dispensed (L)"
              width={120}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              allowEditing={false}
              cellRender={(cellData) => (
                <span className="tw-text-purple-600 tw-font-medium">
                  -{(cellData.value || 0).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                </span>
              )}
            />

            {/* Transfers In */}
            <Column
              dataField="totalTransfersIn"
              caption="Transfer In (L)"
              width={120}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              allowEditing={false}
              cellRender={(cellData) => {
                const value = cellData.value || 0;
                return value > 0 ? (
                  <span className="tw-text-cyan-600 tw-font-medium">
                    +{value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                ) : (
                  <span className="tw-text-gray-400">0.0</span>
                );
              }}
            />

            {/* Transfers Out */}
            <Column
              dataField="totalTransfersOut"
              caption="Transfer Out (L)"
              width={130}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              allowEditing={false}
              cellRender={(cellData) => {
                const value = cellData.value || 0;
                return value > 0 ? (
                  <span className="tw-text-pink-600 tw-font-medium">
                    -{value.toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 })}
                  </span>
                ) : (
                  <span className="tw-text-gray-400">0.0</span>
                );
              }}
            />

            {/* Closing Stock with date indicator */}
            <Column
              dataField="closingStock"
              caption={`Closing (L)\n${formatDate(wizard.periodEnd)}`}
              width={130}
              dataType="number"
              format="#,##0.0"
              alignment="right"
              allowEditing={true}
              headerCellRender={() => (
                <div className="tw-text-center">
                  <div className="tw-font-semibold">Closing (L)</div>
                  <div className="tw-text-xs tw-text-gray-500">{formatDate(wizard.periodEnd)}</div>
                </div>
              )}
              cssClass="tw-bg-orange-50"
            />

            <Summary>
              <TotalItem
                column="tankName"
                summaryType="count"
                displayFormat="Total: {0} tanks"
              />
              <TotalItem
                column="openingStock"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="{0} L"
              />
              <TotalItem
                column="totalDeliveries"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="+{0} L"
              />
              <TotalItem
                column="totalDispensed"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="-{0} L"
              />
              <TotalItem
                column="totalTransfersIn"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="+{0} L"
              />
              <TotalItem
                column="totalTransfersOut"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="-{0} L"
              />
              <TotalItem
                column="closingStock"
                summaryType="sum"
                valueFormat="#,##0.0"
                displayFormat="{0} L"
              />
            </Summary>
          </DataGrid>

          {/* Info note */}
          <div className="tw-mt-4 tw-p-3 tw-bg-gray-100 tw-rounded-lg">
            <div className="tw-flex tw-items-start tw-gap-2">
              <i className="fa-light fa-info-circle tw-text-blue-500 tw-mt-0.5"></i>
              <div className="tw-text-sm tw-text-gray-600">
                <p className="tw-mb-2">
                  <strong>Data Collection:</strong> This step collects tank volume data that will be used for the fuel audit review in Step 6.
                </p>
                <p className="tw-mb-1">
                  <strong>Opening/Closing:</strong> "Manual" indicates explicit stock readings. "Calculated" means derived from the most recent transaction before the period boundary.
                </p>
                <p>
                  <strong>Transfers:</strong> Transfer In shows fuel received from other tanks. Transfer Out shows fuel sent to other tanks.
                </p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* No data available */}
      {!isLoading && isDataReady && previewData.length === 0 && wizard.selectedTankIds?.length > 0 && (
        <div className="tw-text-center tw-py-10 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200">
          <i className="fa-light fa-database tw-text-4xl tw-text-yellow-500 tw-mb-3"></i>
          <p className="tw-text-gray-700 tw-font-medium">No volume history data found</p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
            No TankVolumeHistory records exist for the selected tanks during this period.
          </p>
          <Button
            text="Refresh Data"
            icon="refresh"
            type="default"
            className="tw-mt-4"
            onClick={loadPreviewData}
          />
        </div>
      )}

      {/* No tanks selected */}
      {!wizard.selectedTankIds?.length && (
        <div className="tw-text-center tw-py-10 tw-bg-gray-50 tw-rounded-lg">
          <i className="fa-light fa-database tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <p className="tw-text-gray-600">Please select tanks in Step 2 first.</p>
        </div>
      )}
    </div>
  );
}
);

Step3TankPreview.displayName = 'Step3TankPreview';

export default Step3TankPreview;
