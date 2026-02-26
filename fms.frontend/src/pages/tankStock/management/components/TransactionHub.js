/**
 * File: TransactionHub.js
 * Purpose: Central tank transaction management hub providing data grids, filtering,
 *          chart views, manual refill workflows, and transaction maintenance actions.
 * Dependencies: react, react-redux, DevExtreme data grid and popup components, exceljs,
 *               Redux tank/site/user actions, custom services/hooks/components.
 * Last Modified: 2026-02-07
 *
 * Key Components:
 * - TransactionHub: Main container orchestrating transaction data loading, filtering,
 *   visualization, exports, and deletion flows with responsive layout considerations.
 *
 * Refactored: Components and hooks extracted to separate files in transactionHub folder
 */
import React, { useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import DropDownButton from "devextreme-react/drop-down-button";
import DataGrid, {
  Paging,
  Pager,
  HeaderFilter,
  Toolbar,
  ColumnChooser,
  Position,
  ColumnChooserSelection,
  FilterRow,
  Column,
  Lookup,
  Selection,
  FilterPanel,
  GroupPanel,
  Grouping,
  Summary,
  TotalItem,
  GroupItem,
} from "devextreme-react/data-grid";
import { LoadPanel } from "devextreme-react/load-panel";
import Button from "devextreme-react/button";
import Popup from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import ChartView from "./ChartView";

// Utilities and exports
import { exportTransactionsToExcel } from "../utils/transactionExportUtils";
import { exportAnalysisReport } from "../utils/transactionAnalysisExportUtils";

// Components
import ManualRefillForm from "../../forms/ManualRefillForm";
import QuickActions from "../../components/QuickActions";

// Extracted components and hooks
import {
  VolumeChangeReasonEnum,
  allowedPageSizes,
} from "./transactionHub/transactionHubConstants";
import { calculateDispensingCustomSummary } from "./transactionHub/transactionHubUtils";
import { DeleteConfirmationDialog } from "./transactionHub/DeleteConfirmationDialog";
import { TransactionFilters } from "./transactionHub/TransactionFilters";
import { GroupingControls } from "./transactionHub/GroupingControls";
import {
  useTransactionData,
  useDeleteTransaction,
  useEditTransaction,
  useDataGridGrouping,
} from "./transactionHub/useTransactionHub";
import { EditTransactionDialog } from "./transactionHub/EditTransactionDialog";
// Hooks
import { usePermissions } from "../../../../hooks/usePermissions";
import useReportJobTracking from "../../../../hooks/useReportJobTracking";
import ReportJobTracker from "./transactionHub/ReportJobTracker";
import "./TransactionHub.scss";

const TransactionHub = () => {
  const dataGridRef = useRef(null);

  // Permission checks using JWT token
  const { hasPermission } = usePermissions();
  const canReadTankVolumeHistory = hasPermission("_Read_TankVolumeHistory");
  const canDeleteTankVolumeHistory = hasPermission("_Delete_TankVolumeHistory");
  const canEditTankVolumeHistory = hasPermission("_Update_TankVolumeHistory");

  // Use extracted hooks for data management
  const {
    tankVolumeHistory,
    tanks,
    sites,
    isLoading,
    usersForFilter,
    user,
    filterUserId,
    setFilterUserId,
    useManualDispensing,
    setUseManualDispensing,
    showGpsVolume,
    setShowGpsVolume,
    headerStartDate,
    headerEndDate,
    selectedSiteIds,
    selectedTankIds,
    handleApplyFilters,
    handleRefresh,
    handleClearFilters,
  } = useTransactionData();

  // Use extracted hook for delete functionality
  const {
    deleteConfirmation,
    handleDeleteTransaction,
    executeDelete,
    handleCancelDelete,
    handleToggleDetails,
    handleConfirmChange,
  } = useDeleteTransaction(handleRefresh);

  // Use extracted hook for edit functionality
  const {
    editState,
    isTransactionEditable,
    handleEditTransaction,
    handleEditSuccess,
    handleCancelEdit,
    handleEditDialogHiding,
  } = useEditTransaction(handleRefresh);

  // Use extracted hook for grouping
  const {
    groupBy,
    isGroupsExpanded,
    showDispensingTotal,
    hasActiveGrouping,
    handleGroupByChange,
    handleClearGrouping,
    handleToggleExpandGroups,
    handleToggleDispensingTotal,
  } = useDataGridGrouping(dataGridRef);

  const navigate = useNavigate();

  // Async report job tracking
  const {
    activeJob: reportJob,
    isTracking: isReportTracking,
    error: reportError,
    cancelActiveJob: cancelReportJob,
    downloadResult: downloadReport,
    dismissJob: dismissReportJob,
    emailWhenDone: emailWhenDoneReport,
  } = useReportJobTracking();

  // Local state for manual refill form
  const [showManualRefillForm, setShowManualRefillForm] = useState(false);

  // Chart view state
  const [showChartView, setShowChartView] = useState(false);
  const [selectedChartType, setSelectedChartType] = useState('candlestick');

  // Refresh data after successful manual refill
  const handleManualRefillSuccess = useCallback(() => {
    setShowManualRefillForm(false);
    handleRefresh();
    notify({
      message: "Manual refill recorded successfully",
      type: "success",
      displayTime: 3000,
      position: "top center",
    });
  }, [handleRefresh]);

  // Navigate to the report engine page with current filter params in the URL
  const handleGenerateHistoryReport = useCallback(() => {
    const params = new URLSearchParams();
    if (headerStartDate) {
      const start = headerStartDate instanceof Date ? headerStartDate.toISOString() : headerStartDate;
      params.set('startDate', start);
    }
    if (headerEndDate) {
      const end = headerEndDate instanceof Date ? headerEndDate.toISOString() : headerEndDate;
      params.set('endDate', end);
    }
    if (selectedSiteIds && selectedSiteIds.length > 0) {
      params.set('siteIds', selectedSiteIds.join(','));
    }
    if (selectedTankIds && selectedTankIds.length > 0) {
      params.set('tankIds', selectedTankIds.join(','));
    }
    const url = `/reports/engine/tank-volume-history?${params.toString()}`;
    navigate(url);
  }, [navigate, headerStartDate, headerEndDate, selectedSiteIds, selectedTankIds]);

  // Handle row click to prevent errors with group rows
  const onRowClick = useCallback((e) => {
    if (e.rowType === "group") {
      return;
    }
  }, []);

  // Format timestamp for display - uses local timezone (East Africa Time for Kenya)
  const formatTime = useCallback((cellInfo) => {
    if (!cellInfo.value) return "";
    const date = new Date(cellInfo.value);
    if (isNaN(date.getTime())) return cellInfo.value;

    // Format with explicit locale and timezone display
    // This will show local time based on user's browser timezone
    return date.toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }, []);

  // Calculate group value for date grouping - extracts date only (no time) in LOCAL timezone
  const calculateDateGroupValue = useCallback((rowData) => {
    if (!rowData.timestamp) return null;
    const date = new Date(rowData.timestamp);
    if (isNaN(date.getTime())) return null;
    // Return date string in YYYY-MM-DD format using LOCAL timezone (not UTC)
    // This ensures dates match the displayed time in the user's timezone
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  // Render group cell for date grouping - displays formatted date
  const groupCellRenderDate = useCallback((cellInfo) => {
    if (!cellInfo.value) return "No Date";
    const date = new Date(cellInfo.value);
    if (isNaN(date.getTime())) return cellInfo.value;
    return date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  }, []);

  // Render change reason
  const changeReasonCellRender = useCallback((cellInfo) => {
    const reason = VolumeChangeReasonEnum.find((r) => r.id === cellInfo.value);
    return reason ? reason.name : cellInfo.value;
  }, []);

  // Export functionality
  const onExporting = useCallback(async () => {
    try {
      await exportTransactionsToExcel({
        dataGridInstance: dataGridRef.current?.instance,
        startDate: headerStartDate,
        endDate: headerEndDate,
        userName: user?.userName || user?.username || "Unknown User",
        volumeChangeReasonEnum: VolumeChangeReasonEnum,
      });

      notify({
        message: "Export completed successfully!",
        type: "success",
        displayTime: 2000,
        position: "top center",
      });
    } catch (error) {
      console.error("Export failed:", error);
      notify({
        message: "Failed to export data. Please try again.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    }
  }, [headerStartDate, headerEndDate, user]);

  // AI Analysis Report Export
  const onExportingAnalysis = useCallback(async () => {
    try {
      await exportAnalysisReport({
        transactions: tankVolumeHistory,
        tanks: tanks,
        sites: sites,
        startDate: headerStartDate,
        endDate: headerEndDate,
        volumeChangeReasonEnum: VolumeChangeReasonEnum,
        userName: user?.userName || user?.username || "Unknown User",
      });

      notify({
        message: "AI-Style Analysis Report generated successfully!",
        type: "success",
        displayTime: 3000,
        position: "top center",
      });
    } catch (error) {
      console.error("Analysis export failed:", error);
      notify({
        message: "Failed to generate analysis report. Please try again.",
        type: "error",
        displayTime: 3000,
        position: "top center",
      });
    }
  }, [tankVolumeHistory, tanks, sites, headerStartDate, headerEndDate, user]);

  // Chart view items for the dropdown
  const chartViewItems = [
    { id: 'candlestick', text: '📈 Candlestick Chart', icon: 'fa-light fa-chart-line' },
    { id: 'volume', text: '📊 Volume Chart', icon: 'fa-light fa-chart-bar' },
    { id: 'multi-series', text: '🎯 Multi-Series Line', icon: 'fa-light fa-chart-area' },
    { id: 'ohlc', text: '📉 OHLC Bars', icon: 'fa-light fa-chart-column' },
  ];

  // Action items for the Actions dropdown
  const actionItems = [
    { id: 'export-excel', text: 'Export to Excel', icon: 'fa-light fa-file-excel' },
    { id: 'history-report', text: 'History Report', icon: 'fa-light fa-file-pdf' },
    { id: 'analysis-report', text: 'Analysis Report', icon: 'fa-light fa-chart-mixed' },
  ];

  const handleActionItemClick = useCallback((e) => {
    const id = e.itemData?.id;
    if (id === 'export-excel') {
      onExporting();
    } else if (id === 'history-report') {
      handleGenerateHistoryReport();
    } else if (id === 'analysis-report') {
      onExportingAnalysis();
    }
  }, [onExporting, handleGenerateHistoryReport, onExportingAnalysis]);

  const handleChartViewItemClick = useCallback((e) => {
    const type = e.itemData?.id;
    if (type) {
      setSelectedChartType(type);
      setShowChartView(true);
    }
  }, []);

  // Custom summary calculation for dispensing totals
  const calculateCustomSummary = useCallback(
    (options) => {
      calculateDispensingCustomSummary(options, showDispensingTotal);
    },
    [showDispensingTotal]
  );

  // Early return if no read permission
  if (!canReadTankVolumeHistory) {
    return (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-lock tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-600 tw-mb-2">
            Access Denied
          </h3>
          <p className="tw-text-gray-500">
            You don't have permission to view tank volume history.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="transaction-hub tw-h-full tw-flex tw-flex-col">
      {/* Header with actions */}
      <div className="tw-bg-white tw-p-4 tw-border-b tw-border-gray-200">
        {/* Header content - responsive layout */}
        <div className="tw-flex tw-flex-col lg:tw-flex-row lg:tw-justify-between lg:tw-items-center tw-gap-4">
          {/* Title section */}
          <div className="tw-flex-shrink-0">
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-flex tw-items-center">
              <i className="fa-light fa-exchange-alt tw-mr-2 tw-text-blue-600"></i>
              Transaction Hub
            </h2>
            <p className="tw-text-gray-600 tw-text-sm tw-mt-1">
              Unified view of all tank transactions (Default: Today's data)
            </p>
          </div>

          {/* Actions section - responsive */}
          <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-3 tw-items-stretch sm:tw-items-center">
            <div className="tw-flex tw-flex-col sm:tw-flex-row tw-gap-2 tw-w-full sm:tw-w-auto">
              {/* Stock Management */}
              <div className="tw-w-full sm:tw-w-auto">
                <QuickActions
                  collapsed={false}
                  onRefreshData={handleRefresh}
                  sites={sites}
                  user={user}
                />
              </div>

              {/* Action Buttons: Refresh | Export | Actions | Chart Views */}
              <div className="transaction-hub__action-buttons">
                <Button
                  text="Refresh"
                  icon="fa-light fa-refresh"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleRefresh}
                  hint="Refresh data"
                  className="transaction-hub__action-btn transaction-hub__action-btn--first"
                />

                <DropDownButton
                  text="Actions"
                  icon="fa-light fa-bolt"
                  items={actionItems}
                  displayExpr="text"
                  keyExpr="id"
                  onItemClick={handleActionItemClick}
                  stylingMode="outlined"
                  type="default"
                  hint="Report actions"
                  className="transaction-hub__action-btn"
                  dropDownOptions={{ width: 230 }}
                />

                <DropDownButton
                  text="Chart Views"
                  icon="fa-light fa-chart-line"
                  items={chartViewItems}
                  displayExpr="text"
                  keyExpr="id"
                  onItemClick={handleChartViewItemClick}
                  stylingMode="outlined"
                  type="default"
                  hint="Open a chart visualisation"
                  className="transaction-hub__action-btn transaction-hub__action-btn--last"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Transaction Filters Component */}
        <TransactionFilters
          usersForFilter={usersForFilter}
          filterUserId={filterUserId}
          setFilterUserId={setFilterUserId}
          useManualDispensing={useManualDispensing}
          setUseManualDispensing={setUseManualDispensing}
          showGpsVolume={showGpsVolume}
          setShowGpsVolume={setShowGpsVolume}
          handleApplyFilters={handleApplyFilters}
          handleClearFilters={handleClearFilters}
          selectedSiteIds={selectedSiteIds}
          selectedTankIds={selectedTankIds}
          sites={sites}
          tanks={tanks}
          headerStartDate={headerStartDate}
          headerEndDate={headerEndDate}
        />
      </div>

      {/* Main content - Responsive padding */}
      <div className="tw-flex-1 tw-p-2 sm:tw-p-4 tw-overflow-hidden tw-flex tw-flex-col">
        {/* DataGrid Container */}
        <div className="tw-flex-1 tw-min-h-0">
          <DataGrid
            dataSource={tankVolumeHistory}
            keyExpr="id"
            showBorders={true}
            ref={dataGridRef}
            showColumnLines={true}
            showRowLines={true}
            allowColumnResizing={true}
            showColumnHeaders={true}
            className="tw-h-full"
            onRowClick={onRowClick}
          >
            <FilterPanel visible={true} />
            <GroupPanel visible={false} />
            <Grouping
              visible={true}
              autoExpandAll={isGroupsExpanded}
              allowCollapsing={true}
            />
            <HeaderFilter visible={true} />
            <FilterRow visible={true} />
            <Paging enabled={true} defaultPageSize={100} />
            <Pager
              visible={true}
              allowedPageSizes={allowedPageSizes}
              displayMode="full"
              showPageSizeSelector={true}
              showInfo={true}
              showNavigationButtons={true}
            />
            <Selection mode="multiple" />

            <Toolbar />

            {/* Columns */}
            <Column
              dataField="id"
              caption="ID"
              visible={false}
              defaultSortOrder="desc"
            />
            <Column
              dataField="timestamp"
              caption="Date & Time"
              cellRender={formatTime}
              minWidth={150}
              defaultSortOrder="desc"
              sortIndex={0}
              allowGrouping={true}
              calculateGroupValue={calculateDateGroupValue}
              groupCellRender={groupCellRenderDate}
            />
            <Column dataField="site" caption="Site" allowGrouping={true} />
            <Column dataField="tankId" caption="Tank" allowGrouping={true}>
              <Lookup dataSource={tanks} valueExpr="id" displayExpr="name" />
            </Column>
            <Column
              dataField="changeReason"
              caption="Transaction Type"
              minWidth={130}
              cellRender={changeReasonCellRender}
              allowGrouping={true}
            >
              <Lookup
                dataSource={VolumeChangeReasonEnum}
                valueExpr="id"
                displayExpr="name"
              />
            </Column>
            <Column
              dataField="vehicleName"
              caption="Vehicle"
              minWidth={120}
              visible={true}
            />

            <Column
              dataField="vehicleType"
              caption="Vehicle Type"
              minWidth={120}
              visible={true}
            />
            <Column
              dataField="transferTankName"
              caption="Transfer Tank"
              minWidth={120}
              visible={true}
              customizeText={(cellInfo) => {
                // 1. Use cellInfo.data for direct access to the row object
                const rowData = cellInfo.data;
                const tankName = cellInfo.value;

                // 2. If no data (e.g. Filter Row), just show the value if it exists
                if (!rowData) return tankName || "";

                // 3. Ensure changeReason is evaluated as a number
                const reason = Number(rowData.changeReason);

                // Only show for TransferIn (3) or TransferOut (4)
                if (reason === 3) return `From: ${tankName || "Unknown"}`;
                if (reason === 4) return `To: ${tankName || "Unknown"}`;

                return ""; // Hide for other types
              }}
            />

            <Column
              dataField="transferTankSite"
              caption="Transfer Site"
              minWidth={120}
              visible={true}
              customizeText={(cellInfo) => {
                const rowData = cellInfo.data;
                const siteName = cellInfo.value;

                if (!rowData) return siteName || "";

                const reason = Number(rowData.changeReason);

                if (reason === 3) return `From: ${siteName || "Unknown"}`;
                if (reason === 4) return `To: ${siteName || "Unknown"}`;

                return "";
              }}
            />
            <Column
              dataField="volumeChange"
              caption="Volume Change (L)"
              minWidth={150}
              format="#,##0.00"
            />
            {/* GPS Volume Column - Only visible when toggle is enabled */}
            {showGpsVolume && (
              <Column
                dataField="gpsVolume"
                caption="GPS Volume (L)"
                minWidth={130}
                alignment="right"
                format="#,##0.00"
                customizeText={(cellInfo) => {
                  const rowData = cellInfo.row?.data;
                  if (
                    !rowData ||
                    (rowData.changeReason !== 6 && rowData.changeReason !== 7)
                  ) {
                    return "-";
                  }
                  if (cellInfo.value === null || cellInfo.value === undefined) {
                    return "-";
                  }
                  return cellInfo.value.toFixed(2);
                }}
                cssClass="gps-volume-column"
              />
            )}
            <Column
              dataField="newVolume"
              caption="New Volume (L)"
              minWidth={120}
              format="#,##0.00"
            />
            <Column
              dataField="recordedByUserName"
              caption="Recorded By"
              minWidth={120}
            />
            <ColumnChooser height="340px" enabled={true} mode="selection">
              <ColumnChooserSelection
                allowSelectAll={true}
                selectByClick={true}
                recursive="true"
              />
              <Position
                my="right top"
                at="right bottom"
                of=".dx-datagrid-column-chooser-button"
              />
            </ColumnChooser>

            {/* Actions Column */}
            <Column
              type="buttons"
              width={120}
              caption="Actions"
              allowSorting={false}
              allowGrouping={false}
              allowFiltering={false}
              cellRender={(cellData) => (
                <div className="tw-flex tw-space-x-1">
                  {/* Edit Button */}
                  {canEditTankVolumeHistory &&
                    isTransactionEditable(cellData.data) && (
                      <Button
                        icon="fa-light fa-pencil"
                        stylingMode="text"
                        onClick={() => handleEditTransaction(cellData.data)}
                        className="tw-text-blue-600 hover:tw-text-blue-800"
                        hint="Edit Transaction"
                        disabled={isLoading || editState.visible}
                      />
                    )}
                  {canEditTankVolumeHistory &&
                    !isTransactionEditable(cellData.data) && (
                      <span
                        className="tw-text-gray-300 tw-px-2"
                        title="This type cannot be edited"
                      >
                        <i className="fa-light fa-pencil-slash"></i>
                      </span>
                    )}
                  {!canEditTankVolumeHistory && (
                    <span
                      className="tw-text-gray-300 tw-px-2"
                      title="No edit permission"
                    >
                      <i className="fa-light fa-pencil"></i>
                    </span>
                  )}

                  {/* Delete Button */}
                  {canDeleteTankVolumeHistory && (
                    <Button
                      icon="fa-light fa-trash"
                      stylingMode="text"
                      onClick={() => handleDeleteTransaction(cellData.data)}
                      className="tw-text-red-600 hover:tw-text-red-800"
                      hint="Delete Transaction"
                      disabled={isLoading || deleteConfirmation.isDeleting}
                    />
                  )}
                  {!canDeleteTankVolumeHistory && (
                    <span
                      className="tw-text-gray-300 tw-px-2"
                      title="No delete permission"
                    >
                      <i className="fa-light fa-trash"></i>
                    </span>
                  )}
                </div>
              )}
            />

            {/* Summary for grouped data */}
            <Summary calculateCustomSummary={calculateCustomSummary}>
              {showDispensingTotal && (
                <GroupItem
                  name="GroupDispensing"
                  summaryType="custom"
                  customizeText={(data) => {
                    return `Dispensing: ${data.value?.toLocaleString("en-US", {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    }) || "0"
                      } L`;
                  }}
                  alignByColumn={true}
                  showInGroupFooter={false}
                />
              )}
              <GroupItem
                column="id"
                summaryType="count"
                displayFormat="Transactions: {0}"
                alignByColumn={true}
              />

              <TotalItem
                column="volumeChange"
                summaryType="sum"
                valueFormat="#,##0.00"
                displayFormat="Total Volume Change: {0}L"
              />
              {showDispensingTotal && (
                <TotalItem
                  name="TotalDispensing"
                  summaryType="custom"
                  customizeText={(data) => {
                    return `Total Dispensing: ${data.value?.toLocaleString("en-US", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    }) || "0.00"
                      }L`;
                  }}
                />
              )}
              <TotalItem
                column="id"
                summaryType="count"
                displayFormat="Total Transactions: {0}"
              />
            </Summary>
          </DataGrid>
        </div>

        {/* Grouping Controls Component */}
        <GroupingControls
          groupBy={groupBy}
          hasActiveGrouping={hasActiveGrouping}
          isGroupsExpanded={isGroupsExpanded}
          showDispensingTotal={showDispensingTotal}
          handleGroupByChange={handleGroupByChange}
          handleClearGrouping={handleClearGrouping}
          handleToggleExpandGroups={handleToggleExpandGroups}
          handleToggleDispensingTotal={handleToggleDispensingTotal}
        />
      </div>

      {/* Manual Refill Popup */}
      <Popup
        visible={showManualRefillForm}
        onHiding={() => setShowManualRefillForm(false)}
        showTitle={true}
        title="Manual Fuel Refill"
        width={1040}
        height={780}
        showCloseButton={true}
        dragEnabled={true}
        resizeEnabled={true}
        className="manual-refill-popup"
      >
        <ManualRefillForm
          onCancel={() => setShowManualRefillForm(false)}
          onSuccess={handleManualRefillSuccess}
        />
      </Popup>

      {/* Delete Confirmation Dialog Component */}
      <DeleteConfirmationDialog
        visible={deleteConfirmation.visible}
        onHiding={handleCancelDelete}
        transaction={deleteConfirmation.transaction}
        validationResult={deleteConfirmation.validationResult}
        isDeleting={deleteConfirmation.isDeleting}
        showDetails={deleteConfirmation.showDetails}
        userConfirmed={deleteConfirmation.userConfirmed}
        onToggleDetails={handleToggleDetails}
        onConfirmChange={handleConfirmChange}
        onCancel={handleCancelDelete}
        onExecuteDelete={executeDelete}
        tanks={tanks}
      />

      {/* Edit Transaction Dialog Component */}
      <EditTransactionDialog
        visible={editState.visible}
        onHiding={handleEditDialogHiding}
        transaction={editState.transaction}
        tanks={tanks}
        sites={sites}
        onSuccess={handleEditSuccess}
        onCancel={handleCancelEdit}
      />

      {/* Chart View Popup */}
      <ChartView
        visible={showChartView}
        onClose={() => setShowChartView(false)}
        tankVolumeHistory={tankVolumeHistory}
        tanks={tanks}
        sites={sites}
        currentFilters={{
          startDate: headerStartDate,
          endDate: headerEndDate,
          siteId: selectedSiteIds && selectedSiteIds.length === 1 ? selectedSiteIds[0] : null,
          tankId: selectedTankIds && selectedTankIds.length === 1 ? selectedTankIds[0] : null,
        }}
        selectedChartType={selectedChartType}
      />

      {/* Page-level LoadPanel */}
      <LoadPanel
        visible={isLoading}
        showIndicator={true}
        showPane={true}
        text="Loading transaction data..."
        position="center"
      />

      {/* Async Report Job Tracker */}
      <ReportJobTracker
        activeJob={reportJob}
        isTracking={isReportTracking}
        error={reportError}
        onCancel={cancelReportJob}
        onDownload={downloadReport}
        onDismiss={dismissReportJob}
        onEmailWhenDone={emailWhenDoneReport}
      />
    </div>
  );
};

export default TransactionHub;
