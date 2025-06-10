import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
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
  TotalItem
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { NumberBox } from 'devextreme-react/number-box';
import { ProgressBar } from 'devextreme-react/progress-bar';
import LoadIndicator from 'devextreme-react/load-indicator';
import { TickerCard } from '../../components/TickerCard/tickerCard';
import { useStockManagement } from '../../hooks/useStockManagement';
import notify from 'devextreme/ui/notify';

//Cursor - Stock Reconciliation Dashboard Component
const StockReconciliationDashboard = ({ selectedSite, onReconciliationComplete, onClose, isVisible = true }) => {
  const { fetchReconciliationDiscrepancies, reconcileStocks, isLoading } = useStockManagement();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  const user = useSelector((state) => state.auth.user);

  const [discrepancies, setDiscrepancies] = useState([]);
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

  // Fetch discrepancy data
  const fetchData = useCallback(async () => {
    try {
      //Cursor - Fetch actual discrepancy data from API
      const filterParams = {
        siteId: selectedSite && selectedSite !== 'all' ? selectedSite : null,
        thresholdValue: thresholdValue
      };

      const result = await fetchReconciliationDiscrepancies(filterParams);
      if (result.success) {
        setDiscrepancies(result.data || []);
      } else {
        setDiscrepancies([]);
        notify(result.message || 'Failed to fetch discrepancies', 'error', 3000);
      }
    } catch (error) {
      console.error('Error fetching discrepancies:', error);
      setDiscrepancies([]);
      notify('Error fetching reconciliation data', 'error', 3000);
    }
  }, [selectedSite, thresholdValue, fetchReconciliationDiscrepancies]);

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

      const reconciliationData = {
        discrepancyIds: selectedRows,
        userId: user?.id,
        reconciliationType: 'Bulk',
        notes: `Bulk reconciliation of ${selectedRows.length} discrepancies`
      };

      //Cursor - Use actual reconciliation API
      const result = await reconcileStocks(reconciliationData);
      if (result.success) {
        setReconciliationProgress(100);
        setSelectedRows([]);
        notify(result.message || `Successfully reconciled ${selectedRows.length} discrepancies`, 'success', 3000);
        await fetchData(); // Refresh data

        if (onReconciliationComplete) {
          onReconciliationComplete(result);
        }

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
  }, [selectedRows, user, fetchData, onReconciliationComplete]);

  // Handle individual reconciliation
  const handleIndividualReconciliation = useCallback(async (discrepancy) => {
    try {
      const reconciliationData = {
        discrepancyIds: [discrepancy.id],
        userId: user?.id,
        reconciliationType: 'Individual',
        notes: `Individual reconciliation for ${discrepancy.tankName}`
      };

      notify(`Reconciling ${discrepancy.tankName}...`, 'info', 2000);

      //Cursor - Use actual reconciliation API
      const result = await reconcileStocks(reconciliationData);
      if (result.success) {
        notify(result.message || `Successfully reconciled ${discrepancy.tankName}`, 'success', 3000);
        await fetchData(); // Refresh data

        if (onReconciliationComplete) {
          onReconciliationComplete(result);
        }
      } else {
        notify(result.message || 'Failed to reconcile', 'error', 5000);
      }
    } catch (error) {
      console.error('Error during individual reconciliation:', error);
      notify('Error during reconciliation', 'error', 3000);
    }
  }, [user, fetchData, onReconciliationComplete]);

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

  const renderActions = useCallback((cellData) => {
    return (
      <div className="tw-flex tw-space-x-2">
        <Button
          icon="fa-light fa-balance-scale"
          hint="Reconcile"
          onClick={() => handleIndividualReconciliation(cellData.data)}
          stylingMode="text"
          width={30}
          height={30}
          disabled={isReconciling}
        />
        <Button
          icon="fa-light fa-eye"
          hint="View Details"
          stylingMode="text"
          width={30}
          height={30}
        />
      </div>
    );
  }, [handleIndividualReconciliation, isReconciling]);

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

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
        <LoadIndicator width={'24px'} height={'24px'} visible={true} />
      </div>
    );
  }

  return (
    <div className="tw-space-y-6">
      {/* Header with Close Button */}
      {onClose && (
        <div className="tw-flex tw-justify-between tw-items-center tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-4">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-balance-scale tw-text-blue-600 tw-text-xl tw-mr-3"></i>
            <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">Stock Reconciliation Dashboard</h2>
          </div>
          <Button
            icon="fa-light fa-times"
            hint="Close Dashboard"
            onClick={handleClose}
            stylingMode="text"
            width={36}
            height={36}
          />
        </div>
      )}

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-5 tw-gap-4">
        <TickerCard
          title="Total Discrepancies"
          icon="fa-light fa-exclamation-triangle"
          tone="info"
          value={summaryStats.totalDiscrepancies}
        />
        <TickerCard
          title="Critical Issues"
          icon="fa-light fa-triangle-exclamation"
          tone="negative"
          value={summaryStats.criticalDiscrepancies}
        />
        <TickerCard
          title="Total Variance"
          icon="fa-light fa-chart-line"
          tone="warning"
          value={`${summaryStats.totalVariance.toFixed(2)} L`}
        />
        <TickerCard
          title="Positive Variance"
          icon="fa-light fa-arrow-up"
          tone="success"
          value={`${summaryStats.positiveVariance.toFixed(2)} L`}
        />
        <TickerCard
          title="Negative Variance"
          icon="fa-light fa-arrow-down"
          tone="negative"
          value={`${summaryStats.negativeVariance.toFixed(2)} L`}
        />
      </div>

      {/* Controls */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-balance-scale tw-text-blue-600 tw-text-xl tw-mr-3"></i>
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Stock Reconciliation</h3>
          </div>
          <div className="tw-flex tw-items-center tw-space-x-4">
            <div className="tw-flex tw-items-center tw-space-x-2">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">Threshold:</label>
              <NumberBox
                value={thresholdValue}
                onValueChanged={handleThresholdChange}
                width={80}
                min={0}
                format="0 L"
              />
            </div>
            <Button
              icon="fa-light fa-rotate"
              text="Refresh"
              onClick={handleRefresh}
              stylingMode="outlined"
            />
          </div>
        </div>

        {/* Progress Bar for Bulk Operations */}
        {isReconciling && (
          <div className="tw-mb-6">
            <div className="tw-flex tw-items-center tw-justify-between tw-mb-2">
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">Reconciliation Progress</span>
              <span className="tw-text-sm tw-text-gray-500">{reconciliationProgress.toFixed(0)}%</span>
            </div>
            <ProgressBar
              value={reconciliationProgress}
              showStatus={false}
              height={8}
            />
          </div>
        )}

        <DataGrid
          dataSource={discrepancies}
          keyExpr="id"
          showBorders={true}
          showRowLines={true}
          showColumnLines={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          onSelectionChanged={onSelectionChanged}
          hoverStateEnabled={true}
        >
          <Selection mode="multiple" />
          <FilterRow visible={true} />
          <HeaderFilter visible={true} />
          <Scrolling mode="virtual" />
          <Paging defaultPageSize={25} />

          <Toolbar>
            <ToolbarItem location="before">
              <Button
                icon="fa-light fa-balance-scale"
                text="Reconcile Selected"
                onClick={handleBulkReconciliation}
                disabled={selectedRows.length === 0 || isReconciling}
                stylingMode="contained"
                type="default"
              />
            </ToolbarItem>
            <ToolbarItem location="before">
              <span className="tw-text-sm tw-text-gray-600 tw-ml-4">
                {selectedRows.length} of {discrepancies.length} selected
              </span>
            </ToolbarItem>
          </Toolbar>

          <Column dataField="siteName" caption="Site" width={120} />
          <Column dataField="tankName" caption="Tank" width={120} />
          <Column dataField="currentStock" caption="Current Stock (L)" dataType="number" format="0.00" width={120} />
          <Column dataField="expectedStock" caption="Expected Stock (L)" dataType="number" format="0.00" width={120} />
          <Column dataField="discrepancyVolume" caption="Variance" cellRender={renderVarianceIndicator} width={120} />
          <Column dataField="discrepancyVolume" caption="Severity" cellRender={renderDiscrepancySeverity} width={120} />
          <Column caption="Utilization" cellRender={renderUtilization} width={120} />
          <Column dataField="lastReconciliation" caption="Last Reconciled" dataType="date" width={120} />
          <Column
            caption="Actions"
            cellRender={renderActions}
            width={100}
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
  );
};

export default StockReconciliationDashboard;
