
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  FilterRow,
  HeaderFilter,
  Scrolling,
  Selection,
  Toolbar,
  Item as ToolbarItem,
  Summary,
  TotalItem,
  Export,
  RowDragging
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { ProgressBar } from 'devextreme-react/progress-bar';
import LoadIndicator from 'devextreme-react/load-indicator';
import { TickerCard } from '../../components/TickerCard/tickerCard';
import { useStockManagement } from '../../hooks/useStockManagement';
//Cursor - Import Redux actions for stock discrepancies
import { fetchStockDiscrepancies, reconcileStocks } from '../../redux/actions/tankStockAction';
import notify from 'devextreme/ui/notify';
import { exportDataGrid } from 'devextreme/pdf_exporter';
//Cursor - Fixed jsPDF autoTable import
import jsPDF from 'jspdf';
import 'jspdf-autotable';

//Cursor - Stock Reconciliation Dashboard Component
const StockReconciliationDashboard = ({ selectedSite, onReconciliationComplete, onClose, isVisible = true, dateRange, selectedPeriod }) => {
  //Cursor - Use Redux dispatch instead of hook for discrepancies
  const dispatch = useDispatch();
  const { reconcileStocks: reconcileStocksHook, isLoading: hookLoading } = useStockManagement();

  //Cursor - Get data from Redux store
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  const user = useSelector((state) => state.auth.user);
  const discrepancies = useSelector((state) => state.tankStock.stockDiscrepancies);
  const discrepanciesLoading = useSelector((state) => state.tankStock.discrepanciesLoading);
  const error = useSelector((state) => state.tankStock.error);
  const [selectedRows, setSelectedRows] = useState([]);
  const [thresholdValue, setThresholdValue] = useState(10); // Default 10L threshold
  const [isReconciling, setIsReconciling] = useState(false);
  const [reconciliationProgress, setReconciliationProgress] = useState(0);

  //Cursor - Removed mock data - will fetch from API

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    return discrepancies.reduce((acc, item) => {
      acc.totalDiscrepancies += 1;
      acc.totalVariance += Math.abs(item.discrepancyVolume);
      if (Math.abs(item.discrepancyVolume) > thresholdValue) {
        acc.criticalDiscrepancies += 1;
      }
      if (item.discrepancyVolume > 0) {
        acc.positiveVariance += item.discrepancyVolume;
      } else {
        acc.negativeVariance += Math.abs(item.discrepancyVolume);
      }
      return acc;
    }, {
      totalDiscrepancies: 0,
      criticalDiscrepancies: 0,
      totalVariance: 0,
      positiveVariance: 0,
      negativeVariance: 0
    });
  }, [discrepancies, thresholdValue]);

  // Fetch discrepancy data using Redux
  const fetchData = useCallback(async () => {
    try {
      //Cursor - Use Redux action to fetch discrepancy data
      const filterParams = {
        siteId: selectedSite && selectedSite !== 'all' ? selectedSite : null,
        threshold: thresholdValue
      };

      const result = await dispatch(fetchStockDiscrepancies(filterParams));
      if (!result.success && result.message) {
        notify(result.message, 'error', 3000);
      }
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
      notify('Error fetching reconciliation data', 'error', 3000);
    }
  }, [selectedSite, thresholdValue, dispatch]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Handle threshold change
  const handleThresholdChange = useCallback((e) => {
    setThresholdValue(e.value);
  }, []);

  const handleRefresh = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Handle bulk reconciliation
  const handleBulkReconciliation = useCallback(async () => {
    if (selectedRows.length === 0) {
      notify('Please select discrepancies to reconcile', 'warning', 3000);
      return;
    }

    try {
      setIsReconciling(true);
      setReconciliationProgress(0);

      //Cursor - Updated to use Redux action for reconciliation with correct tank IDs
      const reconciliationData = {
        discrepancyIds: selectedRows, // selectedRows contains tank IDs
        userId: user?.id,
        reconciliationType: 'Bulk',
        notes: `Bulk reconciliation for ${selectedRows.length} tanks`
      };

      const result = await dispatch(reconcileStocks(reconciliationData));
      if (result.success) {
        setReconciliationProgress(100);
        setSelectedRows([]);
        notify(result.message || `Successfully reconciled ${selectedRows.length} discrepancies`, 'success', 3000);

        if (onReconciliationComplete) {
          onReconciliationComplete(result);
        }

        // Refresh data after successful reconciliation
        fetchData();

        setTimeout(() => {
          setReconciliationProgress(0);
        }, 2000);
      } else {
        notify(result.message || 'Failed to reconcile stocks', 'error', 5000);
      }
    } catch (error) {
      console.error('Error during bulk reconciliation:', error);
      notify('Error during reconciliation process', 'error', 3000);
    } finally {
      setIsReconciling(false);
    }
  }, [selectedRows, selectedSite, user, dispatch, onReconciliationComplete, fetchData]);

  // Handle individual reconciliation
  const handleIndividualReconciliation = useCallback(async (discrepancy) => {
    try {
      //Cursor - Updated to use Redux action for individual reconciliation with correct tank ID
      const reconciliationData = {
        discrepancyIds: [discrepancy.tankId], // Use tankId instead of siteId
        userId: user?.id,
        reconciliationType: 'Individual',
        notes: `Individual reconciliation for tank ${discrepancy.tankName}`
      };

      notify(`Reconciling ${discrepancy.tankName}...`, 'info', 2000);

      const result = await dispatch(reconcileStocks(reconciliationData));
      if (result.success) {
        notify(result.message || `Successfully reconciled ${discrepancy.tankName}`, 'success', 3000);

        if (onReconciliationComplete) {
          onReconciliationComplete(result);
        }

        // Refresh data after successful reconciliation
        fetchData();
      } else {
        notify(result.message || 'Failed to reconcile', 'error', 5000);
      }
    } catch (error) {
      console.error('Error during individual reconciliation:', error);
      notify('Error during reconciliation', 'error', 3000);
    }
  }, [selectedSite, user, dispatch, onReconciliationComplete, fetchData]);

  //Cursor - Add print functionality
  const handlePrint = useCallback(() => {
    const doc = new jsPDF();

    // Add title
    doc.setFontSize(16);
    doc.text('Stock Reconciliation Report', 14, 20);

    // Add date range info
    doc.setFontSize(10);
    const dateInfo = dateRange ?
      `Date Range: ${dateRange[0]} - ${dateRange[1]}` :
      `Period: ${selectedPeriod || 'All'}`;
    doc.text(dateInfo, 14, 30);

    // Add site info
    const siteInfo = selectedSite === 'all' ? 'All Sites' : `Site: ${selectedSite}`;
    doc.text(siteInfo, 14, 36);

    // Prepare data for table
    const tableData = discrepancies.map(item => [
      item.siteName || '',
      item.tankName || '',
      item.currentStock?.toFixed(2) || '0.00',
      item.expectedStock?.toFixed(2) || '0.00',
      item.discrepancyVolume?.toFixed(2) || '0.00',
      item.lastReconciliation ? new Date(item.lastReconciliation).toLocaleDateString() : 'Never'
    ]);

    // Add table
    doc.autoTable({
      head: [['Site', 'Tank', 'Current Stock (L)', 'Expected Stock (L)', 'Variance (L)', 'Last Reconciled']],
      body: tableData,
      startY: 45,
      styles: { fontSize: 8 },
      headStyles: { fillColor: [66, 139, 202] }
    });

    // Save the PDF
    doc.save(`stock_reconciliation_${new Date().toISOString().split('T')[0]}.pdf`);
    notify('Report exported successfully', 'success', 2000);
  }, [discrepancies, dateRange, selectedPeriod, selectedSite]);

  //Cursor - Add help handler
  const handleHelp = useCallback(() => {
    notify('For assistance with Stock Reconciliation, please contact the system administrator or refer to the user manual.', 'info', 5000);
  }, []);

  //Cursor - Add view details handler
  const handleViewDetails = useCallback((discrepancy) => {
    const detailsMessage = `
      Tank: ${discrepancy.tankName}
      Site: ${discrepancy.siteName}
      Current Stock: ${discrepancy.currentStock?.toFixed(2)} L
      Expected Stock: ${discrepancy.expectedStock?.toFixed(2)} L
      Variance: ${discrepancy.discrepancyVolume?.toFixed(2)} L
      Last Reconciled: ${discrepancy.lastReconciliation ? new Date(discrepancy.lastReconciliation).toLocaleDateString() : 'Never'}
    `;
    notify(detailsMessage, 'info', 8000);
  }, []);

  // Column cell render functions
  const renderDiscrepancySeverity = useCallback((cellData) => {
    const value = Math.abs(cellData.value);
    const severity = value > thresholdValue ? 'critical' : value > (thresholdValue / 2) ? 'warning' : 'normal';

    const colorClass = {
      critical: 'tw-text-red-600 tw-bg-red-100',
      warning: 'tw-text-yellow-600 tw-bg-yellow-100',
      normal: 'tw-text-green-600 tw-bg-green-100'
    }[severity];

    const icon = {
      critical: 'fa-light fa-triangle-exclamation',
      warning: 'fa-light fa-exclamation-circle',
      normal: 'fa-light fa-check-circle'
    }[severity];

    return (
      <div className={`tw-flex tw-items-center tw-px-2 tw-py-1 tw-rounded-full ${colorClass}`}>
        <i className={`${icon} tw-mr-1`}></i>
        <span className="tw-font-medium">{value.toFixed(2)} L</span>
      </div>
    );
  }, [thresholdValue]);

  const renderVarianceIndicator = useCallback((cellData) => {
    const value = cellData.value || 0;
    const isPositive = value > 0;
    return (
      <div className="tw-flex tw-items-center">
        <i className={`fa-light ${isPositive ? 'fa-arrow-up tw-text-green-600' : 'fa-arrow-down tw-text-red-600'} tw-mr-2`}></i>
        <span className={isPositive ? 'tw-text-green-600 tw-font-medium' : 'tw-text-red-600 tw-font-medium'}>
          {isPositive ? '+' : ''}{value.toFixed(2)} L
        </span>
      </div>
    );
  }, []);

  const renderUtilization = useCallback((cellData) => {
    const utilization = cellData.data.currentStock / cellData.data.tankCapacity * 100;
    const utilizationClass = utilization > 90 ? 'tw-text-red-600' : utilization > 70 ? 'tw-text-yellow-600' : 'tw-text-green-600';

    return (
      <div className="tw-flex tw-items-center">
        <ProgressBar
          value={utilization}
          width={60}
          height={8}
          showStatus={false}
        />
        <span className={`tw-ml-2 tw-font-medium ${utilizationClass}`}>
          {utilization.toFixed(1)}%
        </span>
      </div>
    );
  }, []);

  //Cursor - Updated actions renderer with better reconcile button and working view details
  const renderActions = useCallback((cellData) => {
    return (
      <div className="tw-flex tw-space-x-1">
        <Button
          text="Reconcile"
          icon="fa-light fa-balance-scale"
          onClick={() => handleIndividualReconciliation(cellData.data)}
          stylingMode="contained"
          type="default"
          height={28}
          disabled={isReconciling}
        />
      </div>
    );
  }, [handleIndividualReconciliation, handleViewDetails, isReconciling]);

  const onSelectionChanged = useCallback((e) => {
    setSelectedRows(e.selectedRowKeys);
  }, []);

  //Cursor - Handle close button
  const handleClose = useCallback(() => {
    if (onClose) {
      onClose();
    }
  }, [onClose]);

  //Cursor - Return null if not visible
  if (!isVisible) {
    return null;
  }

  //Cursor - Use Redux loading state
  if (discrepanciesLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
        <LoadIndicator width={'24px'} height={'24px'} visible={true} />
      </div>
    );
  }

  //Cursor - Format date range display
  const formatDateRange = () => {
    if (dateRange && dateRange.length === 2) {
      return `${dateRange[0]} - ${dateRange[1]}`;
    }
    return selectedPeriod || 'All Time';
  };

  return (
    <div className="tw-space-y-3">
      {/* Cursor - Smaller Header with Close Button and Help */}
      {onClose && (
        <div className="tw-flex tw-justify-between tw-items-center tw-bg-white tw-rounded-lg tw-shadow-md tw-p-3">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-balance-scale tw-text-blue-600 tw-text-lg tw-mr-2"></i>
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800">Stock Reconciliation Dashboard</h2>
          </div>
          <div className="tw-flex tw-items-center tw-space-x-2">
            <Button
              icon="fa-light fa-question-circle"
              hint="Help"
              onClick={handleHelp}
              stylingMode="text"
              width={28}
              height={28}
            />
            <Button
              icon="fa-light fa-times"
              hint="Close Dashboard"
              onClick={handleClose}
              stylingMode="text"
              width={28}
              height={28}
            />
          </div>
        </div>
      )}

      {/* Cursor - Narrower Summary Cards */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-3">
        <TickerCard
          title="Total"
          icon="fa-light fa-exclamation-triangle"
          tone="info"
          value={summaryStats.totalDiscrepancies}
        />
        <TickerCard
          title="Critical"
          icon="fa-light fa-triangle-exclamation"
          tone="negative"
          value={summaryStats.criticalDiscrepancies}
        />
        <TickerCard
          title="Variance"
          icon="fa-light fa-chart-line"
          tone="warning"
          value={`${summaryStats.totalVariance.toFixed(1)}L`}
        />
        <TickerCard
          title="Positive"
          icon="fa-light fa-arrow-up"
          tone="success"
          value={`${summaryStats.positiveVariance.toFixed(1)}L`}
        />
        <TickerCard
          title="Negative"
          icon="fa-light fa-arrow-down"
          tone="negative"
          value={`${summaryStats.negativeVariance.toFixed(1)}L`}
        />
      </div>

      {/* Cursor - Wider Controls and DataGrid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-md">
        <div className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-pb-6 tw-border-b">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-balance-scale tw-text-blue-600 tw-text-lg tw-mr-2"></i>
            <h3 className="tw-text-md tw-font-semibold tw-text-gray-800">Stock Reconciliation</h3>
            <span className="tw-ml-4 tw-text-sm tw-text-gray-600 tw-bg-gray-100 tw-px-2 tw-py-1 tw-rounded">
              Filter: {formatDateRange()}
            </span>
          </div>
          <div className="tw-flex tw-items-center tw-space-x-3">
            <div className="tw-flex tw-items-center tw-space-x-2">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">Threshold:</label>
              <NumberBox
                value={thresholdValue}
                onValueChanged={handleThresholdChange}
                width={70}
                min={0}
                format="10 L"
              />
            </div>
            <Button
              icon="fa-light fa-rotate"
              text="Refresh"
              onClick={handleRefresh}
              stylingMode="outlined"
              height={32}
            />
          </div>
        </div>

        {/* Progress Bar for Bulk Operations */}
        {isReconciling && (
          <div className="tw-p-4 tw-border-b">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">Reconciliation Progress</span>
              <span className="tw-text-sm tw-text-gray-500">{reconciliationProgress.toFixed(0)}%</span>
            </div>
            <ProgressBar
              value={reconciliationProgress}
              showStatus={false}
              height={6}
            />
          </div>
        )}

        {/* Cursor - Wider DataGrid with better fit */}
        <div className="tw-p-5">
          <DataGrid
            dataSource={discrepancies}
            keyExpr="id"
            showBorders={false}
            showRowLines={true}
            showColumnLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            allowColumnResizing={true}
            onSelectionChanged={onSelectionChanged}
            hoverStateEnabled={true}
            width="90%"
            height="calc(100vh - 500px)"
            wordWrapEnabled={true}
          >
            <Selection mode="multiple" />
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Scrolling mode="virtual" />
            <Paging defaultPageSize={25} />
            <Export enabled={true} allowExportSelectedData={true} />

            <Toolbar>
              <ToolbarItem location="before">
                <Button
                  icon="fa-light fa-balance-scale"
                  text="Reconcile Selected"
                  onClick={handleBulkReconciliation}
                  disabled={selectedRows.length === 0 || isReconciling}
                  stylingMode="contained"
                  type="default"
                  height={32}
                />
              </ToolbarItem>
              <ToolbarItem location="before">
                <Button
                  icon="fa-light fa-print"
                  text="Print Report"
                  onClick={handlePrint}
                  stylingMode="outlined"
                  height={32}
                />
              </ToolbarItem>
              <ToolbarItem location="before">
                <span className="tw-text-sm tw-text-gray-600 tw-ml-2">
                  {selectedRows.length} of {discrepancies.length} selected
                </span>
              </ToolbarItem>
            </Toolbar>

            <Column dataField="siteName" caption="Site" minWidth={90} width={150} />
            <Column dataField="tankName" caption="Tank" minWidth={90} width={100} />
            <Column dataField="currentStock" caption="Current (L)" dataType="number" format="0.00" minWidth={90} width={150} />
            <Column dataField="expectedStock" caption="Expected (L)" dataType="number" format="0.00" minWidth={90} width={100} />
            <Column dataField="discrepancyVolume" caption="Variance" cellRender={renderVarianceIndicator} minWidth={90} width={150} />
            <Column caption="Severity" cellRender={renderDiscrepancySeverity} minWidth={90} width={100} />
            <Column caption="Utilization" cellRender={renderUtilization} minWidth={90} width={110} />
            <Column dataField="lastReconciliation" caption="Last Reconciled" dataType="date" minWidth={90} width={120} />
            <Column
              caption="Actions"
              cellRender={renderActions}
              width={140}
              allowSorting={false}
              allowFiltering={false}
            />

            <Summary>
              <TotalItem
                column="discrepancyVolume"
                summaryType="sum"
                valueFormat="0.00 L"
                displayFormat="Total Variance: {0}"
              />
              <TotalItem
                column="currentStock"
                summaryType="sum"
                valueFormat="0.00 L"
                displayFormat="Total Current Stock: {0}"
              />
            </Summary>
          </DataGrid>
        </div>
      </div>
    </div>
  );
};

export default StockReconciliationDashboard;