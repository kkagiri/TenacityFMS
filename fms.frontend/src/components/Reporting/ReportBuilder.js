import React, { useState, useEffect, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { DataGrid } from 'devextreme-react/data-grid';
import { PivotGrid, FieldChooser } from 'devextreme-react/pivot-grid';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import { Column, Grouping, GroupPanel, Paging, Pager, FilterRow, HeaderFilter, Export, Summary, TotalItem } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadPanel } from 'devextreme-react/load-panel';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportDataGrid, exportPivotGrid } from 'devextreme/excel_exporter';
import notify from 'devextreme/ui/notify';
import reportingService from '../../services/reportingService';
import './ReportBuilder.scss';

/**
 * ReportBuilder - A flexible component for rendering DevExtreme reports
 * Supports both DataGrid and PivotGrid report types
 */
const ReportBuilder = ({ reportDefinition, filters, onFiltersChange, autoLoad = false }) => {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [pivotDataSource, setPivotDataSource] = useState(null);
  const dataGridRef = useRef(null);
  const pivotGridRef = useRef(null);

  // Load report data
  const loadReportData = useCallback(async () => {
    if (!reportDefinition || !reportDefinition.dataSourceEndpoint) {
      notify({ message: 'Invalid report definition', type: 'error' });
      return;
    }

    setLoading(true);
    try {
      // Merge default filters with user filters
      const mergedFilters = {
        ...reportDefinition.defaultFilters,
        ...filters
      };

      // Format filters for API
      const formattedFilters = reportingService.formatReportFilters(mergedFilters);

      // Fetch data from the data source endpoint
      const result = await reportingService.fetchReportData(
        reportDefinition.dataSourceEndpoint,
        formattedFilters
      );

      if (result.success) {
        setReportData(result.data);

        // For PivotGrid, create PivotGridDataSource
        if (reportDefinition.type === 1 && reportDefinition.pivotConfiguration) { // 1 = PivotGrid
          createPivotDataSource(result.data, reportDefinition.pivotConfiguration);
        }

        notify({
          message: 'Report data loaded successfully',
          type: 'success',
          displayTime: 2000
        });
      } else {
        notify({ message: result.error || 'Failed to load report data', type: 'error' });
      }
    } catch (error) {
      console.error('Error loading report data:', error);
      notify({ message: `Error loading report: ${error.message}`, type: 'error' });
    } finally {
      setLoading(false);
    }
  }, [reportDefinition, filters]);

  // Create PivotGrid data source
  const createPivotDataSource = useCallback((data, pivotConfig) => {
    const dataSource = new PivotGridDataSource({
      fields: pivotConfig.fields || [],
      store: data
    });

    dataSource.load().then(() => {
      setPivotDataSource(dataSource);
    }).catch((error) => {
      console.error('Error loading PivotGridDataSource:', error);
    });
  }, []);

  // Auto-load on mount if specified
  useEffect(() => {
    if (autoLoad) {
      loadReportData();
    }
  }, [autoLoad, loadReportData]);

  // Export to Excel - DataGrid
  const handleExportDataGrid = useCallback(() => {
    if (!dataGridRef.current) return;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(reportDefinition.reportName);

    exportDataGrid({
      component: dataGridRef.current.instance,
      worksheet,
      autoFilterEnabled: true,
      topLeftCell: { row: 4, column: 1 }
    }).then(() => {
      // Add header
      const headerRow = worksheet.getRow(1);
      worksheet.mergeCells(1, 1, 1, 10);
      headerRow.getCell(1).value = reportDefinition.reportName;
      headerRow.getCell(1).font = { name: 'Segoe UI Light', size: 18, bold: true };
      headerRow.getCell(1).alignment = { horizontal: 'center' };

      // Add generation date
      const dateRow = worksheet.getRow(2);
      worksheet.mergeCells(2, 1, 2, 10);
      dateRow.getCell(1).value = `Generated on: ${new Date().toLocaleString()}`;
      dateRow.getCell(1).font = { size: 10 };
      dateRow.getCell(1).alignment = { horizontal: 'center' };

      workbook.xlsx.writeBuffer().then((buffer) => {
        const fileName = `${reportDefinition.exportOptions?.defaultFileName || 'report'}_${Date.now()}.xlsx`;
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), fileName);
        notify({ message: 'Report exported successfully', type: 'success' });
      });
    });
  }, [reportDefinition]);

  // Export to Excel - PivotGrid
  const handleExportPivotGrid = useCallback(() => {
    if (!pivotGridRef.current) return;

    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet(reportDefinition.reportName);

    exportPivotGrid({
      component: pivotGridRef.current.instance,
      worksheet,
      topLeftCell: { row: 4, column: 1 }
    }).then(() => {
      // Add header
      const headerRow = worksheet.getRow(1);
      worksheet.mergeCells(1, 1, 1, 10);
      headerRow.getCell(1).value = reportDefinition.reportName;
      headerRow.getCell(1).font = { name: 'Segoe UI Light', size: 18, bold: true };
      headerRow.getCell(1).alignment = { horizontal: 'center' };

      // Add generation date
      const dateRow = worksheet.getRow(2);
      worksheet.mergeCells(2, 1, 2, 10);
      dateRow.getCell(1).value = `Generated on: ${new Date().toLocaleString()}`;
      dateRow.getCell(1).font = { size: 10 };
      dateRow.getCell(1).alignment = { horizontal: 'center' };

      workbook.xlsx.writeBuffer().then((buffer) => {
        const fileName = `${reportDefinition.exportOptions?.defaultFileName || 'report'}_${Date.now()}.xlsx`;
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }), fileName);
        notify({ message: 'Report exported successfully', type: 'success' });
      });
    });
  }, [reportDefinition]);

  // Render DataGrid report
  const renderDataGrid = () => {
    if (!reportData) return null;

    return (
      <DataGrid
        ref={dataGridRef}
        dataSource={reportData}
        showBorders={true}
        columnAutoWidth={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        wordWrapEnabled={true}
        height="100%"
      >
        <Paging defaultPageSize={50} />
        <Pager
          visible={true}
          showPageSizeSelector={true}
          allowedPageSizes={[25, 50, 100, 'all']}
          showInfo={true}
        />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <GroupPanel visible={true} />
        <Grouping autoExpandAll={false} />
        <Export enabled={false} /> {/* Using custom export */}

        {/* Render columns from report definition */}
        {reportDefinition.columns?.map((col, index) => (
          <Column
            key={index}
            dataField={col.dataField}
            caption={col.caption}
            dataType={col.dataType}
            format={col.format}
            visible={col.visible}
            width={col.width || undefined}
            allowSorting={col.allowSorting}
            allowFiltering={col.allowFiltering}
            allowGrouping={col.allowGrouping}
            alignment={col.alignment}
            fixed={col.fixed}
            fixedPosition={col.fixedPosition}
          />
        ))}

        {/* Render summaries */}
        {reportDefinition.summaries && reportDefinition.summaries.length > 0 && (
          <Summary>
            {reportDefinition.summaries.map((summary, index) => (
              <TotalItem
                key={index}
                column={summary.dataField}
                summaryType={summary.summaryType}
                displayFormat={summary.displayFormat}
              />
            ))}
          </Summary>
        )}
      </DataGrid>
    );
  };

  // Render PivotGrid report
  const renderPivotGrid = () => {
    if (!pivotDataSource) return null;

    const config = reportDefinition.pivotConfiguration;

    return (
      <PivotGrid
        ref={pivotGridRef}
        dataSource={pivotDataSource}
        allowSortingBySummary={config?.allowSortingBySummary ?? true}
        allowSorting={config?.allowSorting ?? true}
        allowFiltering={config?.allowFiltering ?? true}
        allowExpanding={config?.allowExpanding ?? true}
        showBorders={config?.showBorders ?? true}
        showColumnGrandTotals={config?.showColumnGrandTotals ?? true}
        showRowGrandTotals={config?.showRowGrandTotals ?? true}
        showColumnTotals={config?.showColumnTotals ?? true}
        showRowTotals={config?.showRowTotals ?? true}
        height="100%"
      >
        <FieldChooser enabled={true} />
      </PivotGrid>
    );
  };

  if (!reportDefinition) {
    return (
      <div className="report-builder-empty tw-flex tw-items-center tw-justify-center tw-h-full tw-text-gray-500">
        <div className="tw-text-center">
          <i className="fa-light fa-file-chart-column tw-text-6xl tw-mb-4"></i>
          <p>No report definition provided</p>
        </div>
      </div>
    );
  }

  return (
    <div className="report-builder tw-flex tw-flex-col tw-h-full tw-bg-white tw-rounded-lg tw-shadow">
      {/* Header */}
      <div className="report-builder__header tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center tw-p-4 tw-border-b tw-gap-3">
        <div className="tw-flex-1">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-flex tw-items-center tw-gap-2">
            <i className={reportDefinition.icon || 'fa-light fa-file-chart-column'}></i>
            {reportDefinition.reportName}
          </h3>
          {reportDefinition.description && (
            <p className="tw-text-sm tw-text-gray-600 tw-mt-1">{reportDefinition.description}</p>
          )}
        </div>

        <div className="tw-flex tw-gap-2">
          <Button
            text="Refresh"
            icon="fa-light fa-refresh"
            type="default"
            stylingMode="outlined"
            onClick={loadReportData}
            disabled={loading}
          />
          <Button
            text="Export"
            icon="fa-light fa-file-excel"
            type="success"
            stylingMode="contained"
            onClick={reportDefinition.type === 1 ? handleExportPivotGrid : handleExportDataGrid}
            disabled={!reportData || loading}
          />
        </div>
      </div>

      {/* Report Content */}
      <div className="report-builder__content tw-flex-1 tw-p-4" style={{ minHeight: 0 }}>
        {loading && (
          <div className="tw-flex tw-items-center tw-justify-center tw-h-full">
            <LoadPanel visible={true} message="Loading report data..." />
          </div>
        )}

        {!loading && !reportData && (
          <div className="tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full tw-text-gray-500">
            <i className="fa-light fa-chart-bar tw-text-6xl tw-mb-4"></i>
            <h3 className="tw-text-xl tw-font-semibold tw-mb-2">No Data Available</h3>
            <p className="tw-mb-4">Click "Refresh" to load report data</p>
            <Button
              text="Load Report"
              icon="fa-light fa-play"
              type="default"
              onClick={loadReportData}
            />
          </div>
        )}

        {!loading && reportData && (
          <div className="tw-h-full">
            {reportDefinition.type === 0 && renderDataGrid()} {/* DataGrid */}
            {reportDefinition.type === 1 && renderPivotGrid()} {/* PivotGrid */}
          </div>
        )}
      </div>
    </div>
  );
};

ReportBuilder.propTypes = {
  reportDefinition: PropTypes.object,
  filters: PropTypes.object,
  onFiltersChange: PropTypes.func,
  autoLoad: PropTypes.bool
};

export default ReportBuilder;
