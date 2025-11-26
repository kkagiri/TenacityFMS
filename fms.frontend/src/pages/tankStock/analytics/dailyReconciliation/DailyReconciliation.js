import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  Pager,
  FilterRow,
  HeaderFilter,
  Export,
  Summary,
  TotalItem,
  Toolbar,
  Item,
  Scrolling
} from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { CheckBox } from 'devextreme-react/check-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid } from 'devextreme/excel_exporter';
import {
  fetchDailyReconciliationReport,
  fetchReconciliationSummary,
  processReconciliation
} from '../../../../redux/actions/dailyTankReconciliationActions';
import { useStockFilters } from '../../shared/context/StockFilterContext';
import './DailyReconciliation.scss';

const DailyReconciliation = () => {
  const dispatch = useDispatch();

  // Redux state
  const report = useSelector((state) => state.dailyTankReconciliation?.report);
  const summary = useSelector((state) => state.dailyTankReconciliation?.summary);
  const reportLoading = useSelector((state) => state.dailyTankReconciliation?.reportLoading || false);
  const summaryLoading = useSelector((state) => state.dailyTankReconciliation?.summaryLoading || false);
  const processingLoading = useSelector((state) => state.dailyTankReconciliation?.processingLoading || false);

  // Filters from shared context
  const { startDate, endDate, selectedSiteIds } = useStockFilters();

  // Local state
  const [discrepanciesOnly, setDiscrepanciesOnly] = useState(false);
  const [pageNumber, setPageNumber] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  // Auto-fetch data when filters change
  useEffect(() => {
    if (startDate && endDate) {
      handleFetchReport();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, selectedSiteIds, discrepanciesOnly, pageNumber, pageSize]);

  // Fetch summary on mount
  useEffect(() => {
    dispatch(fetchReconciliationSummary({
      days: 7,
      siteId: selectedSiteIds && selectedSiteIds.length > 0 ? selectedSiteIds[0] : null
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteIds]);

  const handleFetchReport = useCallback(async () => {
    if (!startDate || !endDate) {
      notify('Please select a date range', 'warning', 2000);
      return;
    }

    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      siteId: selectedSiteIds && selectedSiteIds.length > 0 ? selectedSiteIds[0] : null,
      discrepanciesOnly,
      pageNumber,
      pageSize
    };

    const result = await dispatch(fetchDailyReconciliationReport(params));
    if (!result.success) {
      notify(result.error || 'Failed to load daily reconciliation report', 'error', 3000);
    }
  }, [startDate, endDate, selectedSiteIds, discrepanciesOnly, pageNumber, pageSize, dispatch]);

  const handleProcessReconciliation = useCallback(async () => {
    if (!startDate || !endDate) {
      notify('Please select a date range', 'warning', 2000);
      return;
    }

    const params = {
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0],
      siteId: selectedSiteIds && selectedSiteIds.length > 0 ? selectedSiteIds[0] : null,
      forceReprocess: false
    };

    const result = await dispatch(processReconciliation(params));
    if (result.success) {
      notify(`Successfully processed ${result.data?.totalTanksProcessed || 0} tanks`, 'success', 3000);
      handleFetchReport(); // Refresh data
    } else {
      notify(result.error || 'Failed to process reconciliation', 'error', 3000);
    }
  }, [startDate, endDate, selectedSiteIds, dispatch, handleFetchReport]);

  const handleExport = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Daily Reconciliation');

    exportDataGrid({
      component: e.component,
      worksheet,
      autoFilterEnabled: true,
      customizeCell: ({ gridCell, excelCell }) => {
        if (gridCell.rowType === 'data') {
          if (gridCell.column.dataField === 'hasDiscrepancy' && gridCell.value) {
            excelCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFE0B2' }
            };
          }
        }
      }
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), 'DailyReconciliation.xlsx');
      });
    });
  }, []);

  // Don't render until we have data or loading state
  const gridData = report?.items || [];

  const renderSummaryCard = (title, value, icon, color = 'blue') => (
    <div className={`summary-card summary-card-${color}`}>
      <div className="summary-card-icon">
        <i className={icon}></i>
      </div>
      <div className="summary-card-content">
        <div className="summary-card-value">{value}</div>
        <div className="summary-card-title">{title}</div>
      </div>
    </div>
  );

  return (
    <div className="daily-reconciliation tw-flex tw-flex-col tw-h-full tw-p-4">
      {/* Summary Cards */}
      {summary && (
        <div className="summary-section">
          <div className="summary-grid">
            {renderSummaryCard('Total Records', summary.totalRecords || 0, 'fa-light fa-file-lines', 'blue')}
            {renderSummaryCard('Discrepancies', summary.recordsWithDiscrepancies || 0, 'fa-light fa-exclamation-triangle', 'orange')}
            {renderSummaryCard('Avg Variance', `${(summary.averageVariance || 0).toFixed(2)}L`, 'fa-light fa-chart-line', 'purple')}
            {renderSummaryCard('Discrepancy Rate', `${(summary.discrepancyRate || 0).toFixed(1)}%`, 'fa-light fa-percentage', 'red')}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="reconciliation-toolbar">
        <div className="toolbar-left">
          <CheckBox
            text="Show Discrepancies Only"
            value={discrepanciesOnly}
            onValueChanged={(e) => setDiscrepanciesOnly(e.value)}
          />
        </div>
        <div className="toolbar-right">
          <Button
            text="Process Reconciliation"
            icon="fa-light fa-play"
            type="default"
            onClick={handleProcessReconciliation}
            disabled={processingLoading || !startDate || !endDate}
          />
          <Button
            text="Refresh"
            icon="fa-light fa-refresh"
            onClick={handleFetchReport}
            disabled={reportLoading}
          />
        </div>
      </div>

      {/* Loading Indicator */}
      {reportLoading && (
        <div className="loading-container">
          <LoadIndicator visible={true} />
          <span className="loading-text">Loading reconciliation data...</span>
        </div>
      )}

      {/* DataGrid */}
      {!reportLoading && (
        <div className="datagrid-container" style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column' }}>
          <DataGrid
            dataSource={gridData}
            keyExpr="id"
            showBorders={true}
            showRowLines={true}
            showColumnLines={true}
            rowAlternationEnabled={true}
            hoverStateEnabled={true}
            columnAutoWidth={true}
            allowColumnReordering={true}
            allowColumnResizing={true}
            height="100%"
            onExporting={handleExport}
          >
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Scrolling mode="virtual" />
            <Paging enabled={false} />

            <Column dataField="reconciliationDate" caption="Date" dataType="date" format="yyyy-MM-dd" width={120} />
            <Column dataField="tankName" caption="Tank" width={150} />
            <Column dataField="siteName" caption="Site" width={150} />
            <Column dataField="openingLevel" caption="Opening" dataType="number" format="#,##0.00" width={100} />
            <Column dataField="totalDeliveries" caption="Deliveries" dataType="number" format="#,##0.00" width={100} />
            <Column dataField="totalTransfersIn" caption="Transfers In" dataType="number" format="#,##0.00" width={100} />
            <Column dataField="totalRefills" caption="Dispense" dataType="number" format="#,##0.00" width={100} />
            <Column dataField="totalTransfersOut" caption="Transfers Out" dataType="number" format="#,##0.00" width={100} />
            <Column dataField="closingLevel" caption="Closing" dataType="number" format="#,##0.00" width={100} />
            <Column dataField="calculatedClosing" caption="Expected" dataType="number" format="#,##0.00" width={100} />
            <Column
              dataField="variance"
              caption="Variance"
              dataType="number"
              format="#,##0.00"
              width={100}
              cellRender={(data) => (
                <span className={data.value > 1 ? 'variance-high' : ''}>
                  {data.value.toFixed(2)}
                </span>
              )}
            />
            <Column
              dataField="variancePercentage"
              caption="Variance %"
              dataType="number"
              format="#,##0.00"
              width={100}
              cellRender={(data) => (
                <span className={data.value > 5 ? 'variance-high' : ''}>
                  {data.value.toFixed(2)}%
                </span>
              )}
            />
            <Column
              dataField="status"
              caption="Status"
              width={120}
              cellRender={(data) => (
                <span className={`status-badge status-${data.value === 'Reconciled' ? 'success' : 'warning'}`}>
                  {data.value}
                </span>
              )}
            />

            <Export enabled={true} allowExportSelectedData={false} />

            <Summary>
              <TotalItem column="tankName" summaryType="count" displayFormat="Total: {0}" />
              <TotalItem column="totalDeliveries" summaryType="sum" valueFormat="#,##0.00" />
              <TotalItem column="totalRefills" summaryType="sum" valueFormat="#,##0.00" />
              <TotalItem column="variance" summaryType="sum" valueFormat="#,##0.00" />
            </Summary>

            <Toolbar>
              <Item name="exportButton" />
              <Item name="columnChooserButton" />
              <Item location="after">
                <div className="grid-info">
                  {report?.pagination && (
                    <span>
                      Page {report.pagination.currentPage} of {report.pagination.totalPages}
                      ({report.pagination.totalRecords} records)
                    </span>
                  )}
                </div>
              </Item>
            </Toolbar>
          </DataGrid>
        </div>
      )}

      {/* No Data Message */}
      {!reportLoading && gridData.length === 0 && (
        <div className="no-data-message">
          <i className="fa-light fa-inbox fa-3x"></i>
          <h3>No Reconciliation Data</h3>
          <p>No reconciliation records found for the selected date range.</p>
          <Button
            text="Process Reconciliation"
            icon="fa-light fa-play"
            type="default"
            onClick={handleProcessReconciliation}
            disabled={processingLoading}
          />
        </div>
      )}
    </div>
  );
};

export default DailyReconciliation;
