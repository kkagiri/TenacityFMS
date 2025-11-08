import React, { useState, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { PivotGrid, FieldChooser, Export } from 'devextreme-react/pivot-grid';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';
import PivotGridDataSource from 'devextreme/ui/pivot_grid/data_source';
import { Workbook } from 'exceljs';
import { saveAs } from 'file-saver';
import { exportPivotGrid } from 'devextreme/excel_exporter';
import TankStockReportsService from '../../../../../services/tankStockReportsService';
import './PivotGridReport.scss';

const PivotGridReport = ({ data, reportType, loading, visible = true }) => {
  const [pivotGridData, setPivotGridData] = useState([]);
  const [canRenderDevExtreme, setCanRenderDevExtreme] = useState(false);
  const [dataSource, setDataSource] = useState(null);
  const [rowsExpanded, setRowsExpanded] = useState(false);
  const [columnsExpanded, setColumnsExpanded] = useState(false);
  const pivotGridRef = useRef(null);

  // Delay DevExtreme initialization until after React's commit phase
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRenderDevExtreme(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Define fields configuration
  const getFields = useCallback(() => {
    // Define the custom order for volume change reasons
    // Supporting both formats: with spaces (display) and without spaces (backend enum)
    // Order: Opening Stock → Dispensing → Transfer In → Transfer Out → Delivery → Others → Closing Stock (LAST)
    const volumeChangeOrder = {
      'OpeningStock': 1,
      'Opening Stock': 1,
      'Dispensing': 2,
      'TransferIn': 3,
      'Transfer In': 3,
      'TransferOut': 4,
      'Transfer Out': 4,
      'Delivery': 5,
      'Adjustment': 6,
      'ManualRefill': 7,
      'Manual Refill': 7,
      'AutomatedDispensing': 8,
      'Automated Dispensing': 8,
      'Reconciliation': 9,
      'AutomatedReconciliation': 10,
      'Automated Reconciliation': 10,
      'ClosingStock': 999,
      'Closing Stock': 999
    };

    // Custom sort function for change reasons
    const customChangeReasonSort = (a, b) => {
      const orderA = volumeChangeOrder[a.value] || 500; // Unknown items appear before Closing Stock
      const orderB = volumeChangeOrder[b.value] || 500;
      return orderA - orderB;
    };

    return [
    {
      caption: 'Site',
      dataField: 'siteName',
      area: 'row',
      sortBySummaryField: 'totalVolume',
      allowSorting: true,
      allowSortingBySummary: true,
      allowFiltering: true,
      allowExpanding: true
    },
    {
      caption: 'Tank',
      dataField: 'tankName',
      area: 'row',
      allowSorting: true,
      allowSortingBySummary: true,
      allowFiltering: true,
      allowExpanding: true
    },
    {
      caption: 'Time Period',
      dataField: 'timePeriod',
      area: 'column',
      sortOrder: 'asc',
      allowSorting: true,
      allowSortingBySummary: true,
      allowFiltering: true,
      allowExpanding: true
    },
    {
      caption: 'Change Reason',
      dataField: 'changeReason',
      area: 'column',
      sortOrder: 'asc',
      sortingMethod: customChangeReasonSort,
      allowSorting: true,
      allowSortingBySummary: true,
      allowFiltering: true,
      allowExpanding: true
    },
    {
      caption: 'Total Volume',
      dataField: 'totalVolume',
      area: 'data',
      summaryType: 'sum',
      format: {
        type: 'fixedPoint',
        precision: 0
      },
      allowSorting: true,
      allowSortingBySummary: true
    },
    // Add fields that actually exist in the data for filter area
    {
      caption: 'Average Volume',
      dataField: 'averageVolume',
      area: 'filter',
      summaryType: 'avg',
      format: {
        type: 'fixedPoint',
        precision: 2
      },
      allowSorting: true,
      allowFiltering: true
    },
    {
      caption: 'Cumulative Volume',
      dataField: 'cumulativeVolume',
      area: 'filter',
      summaryType: 'sum',
      format: {
        type: 'fixedPoint',
        precision: 2
      },
      allowSorting: true,
      allowFiltering: true
    },
    {
      caption: 'Transaction Count',
      dataField: 'transactionCount',
      area: 'filter',
      summaryType: 'sum',
      allowSorting: true,
      allowFiltering: true
    },
    {
      caption: 'Period Start',
      dataField: 'periodStart',
      dataType: 'date',
      area: 'filter',
      allowSorting: true,
      allowFiltering: true
    },
    {
      caption: 'Period End',
      dataField: 'periodEnd',
      dataType: 'date',
      area: 'filter',
      allowSorting: true,
      allowFiltering: true
    }
  ];
  }, []);

  // Process data for pivot grid and create DevExtreme data source
  useEffect(() => {
    if (data?.data) {
      const formattedData = TankStockReportsService.formatPivotData(data);
      setPivotGridData(formattedData);

      console.log('Formatted pivot data:', formattedData);
      console.log('Fields configuration:', getFields());

     // Reset expand state when new data loads
      setRowsExpanded(false);
      setColumnsExpanded(false);

      // Create DevExtreme PivotGridDataSource
      const pivotDataSource = new PivotGridDataSource({
        fields: getFields(),
        store: formattedData
      });

      // Load the data source to initialize it properly
      pivotDataSource.load().then(() => {
        console.log('PivotGridDataSource loaded successfully');

        // Collapse all by default to match the initial button state
        pivotDataSource.collapseAll(0); // Collapse rows
        pivotDataSource.collapseAll(1); // Collapse columns

        setDataSource(pivotDataSource);
      }).catch((error) => {
        console.error('Error loading PivotGridDataSource:', error);
      });
    }
  }, [data, getFields]);

  // Export handler using DevExtreme's exportPivotGrid function
  const onExporting = useCallback((e) => {
    const workbook = new Workbook();
    const worksheet = workbook.addWorksheet('Tank Volume History');

    worksheet.columns = [
      { width: 30 }, // Site
      { width: 20 }, // Tank
      { width: 30 }, // Time Period
      { width: 25 }, // Change Reason
      { width: 20 }, // Total Volume
    ];

    exportPivotGrid({
      component: e.component,
      worksheet,
      topLeftCell: { row: 3, column: 1 },
      keepColumnWidths: false,
    }).then((cellRange) => {
      // Header
      const headerRow = worksheet.getRow(1);
      headerRow.height = 30;
      worksheet.mergeCells(1, 1, 1, 5);
      const headerCell = headerRow.getCell(1);
      headerCell.value = `Tank Volume History Report - ${reportType}`;
      headerCell.font = { name: 'Segoe UI Light', size: 16, bold: true };
      headerCell.alignment = { horizontal: 'center', vertical: 'middle' };

      // Date info
      const dateRow = worksheet.getRow(2);
      worksheet.mergeCells(2, 1, 2, 5);
      const dateCell = dateRow.getCell(1);
      dateCell.value = `Generated on: ${new Date().toLocaleDateString()}`;
      dateCell.font = { size: 10 };
      dateCell.alignment = { horizontal: 'center' };
    }).then(() => {
      workbook.xlsx.writeBuffer().then((buffer) => {
        saveAs(new Blob([buffer], { type: 'application/octet-stream' }),
               `tank-volume-history-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`);
      });
    });
  }, [reportType]);

  // Manual export as fallback if DevExtreme export fails
  const handleExportToExcel = useCallback(() => {
    if (pivotGridRef.current) {
      try {
        // Try to trigger DevExtreme's built-in export via onExporting
        const pivotGrid = pivotGridRef.current.instance;
        onExporting({ component: pivotGrid });
      } catch (error) {
        console.error('Export failed:', error);
        // Fallback: create simple export from raw data
        const workbook = new Workbook();
        const worksheet = workbook.addWorksheet('Tank Volume History');

        // Add headers
        worksheet.addRow(['Site', 'Tank', 'Time Period', 'Change Reason', 'Total Volume']);

        // Add data from our formatted data
        pivotGridData.forEach(row => {
          worksheet.addRow([
            row.siteName || '',
            row.tankName || '',
            row.timePeriod || '',
            row.changeReason || '',
            row.totalVolume || 0
          ]);
        });

        // Export to file
        workbook.xlsx.writeBuffer().then((buffer) => {
          saveAs(new Blob([buffer], { type: 'application/octet-stream' }),
                 `tank-volume-history-${reportType}-${new Date().toISOString().split('T')[0]}.xlsx`);
        });
      }
    }
  }, [reportType, pivotGridData, onExporting]);

  // Expand/Collapse Rows functionality
  const handleExpandCollapseRows = useCallback(() => {
    if (pivotGridRef.current && dataSource) {
      try {
        const pivotGrid = pivotGridRef.current.instance;
        const dataSourceInstance = pivotGrid.getDataSource();

        if (rowsExpanded) {
          // Collapse rows
          dataSourceInstance.collapseAll(0); // Row area
          console.log('Collapsed rows');
        } else {
          // Expand rows
          dataSourceInstance.expandAll(0); // Row area
          console.log('Expanded rows');
        }
        setRowsExpanded(!rowsExpanded);
      } catch (error) {
        console.error('Error expanding/collapsing rows:', error);
      }
    }
  }, [rowsExpanded, dataSource]);

  // Expand/Collapse Columns functionality
  const handleExpandCollapseColumns = useCallback(() => {
    if (pivotGridRef.current && dataSource) {
      try {
        const pivotGrid = pivotGridRef.current.instance;
        const dataSourceInstance = pivotGrid.getDataSource();

        if (columnsExpanded) {
          // Collapse columns
          dataSourceInstance.collapseAll(1); // Column area
          console.log('Collapsed columns');
        } else {
          // Expand columns
          dataSourceInstance.expandAll(1); // Column area
          console.log('Expanded columns');
        }
        setColumnsExpanded(!columnsExpanded);
      } catch (error) {
        console.error('Error expanding/collapsing columns:', error);
      }
    }
  }, [columnsExpanded, dataSource]);

  return (
    <div className="pivot-grid-report tw-bg-white tw-rounded-lg tw-shadow" style={{ display: visible ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="tw-flex tw-flex-col md:tw-flex-row tw-justify-between tw-items-start md:tw-items-center tw-p-4 tw-border-b tw-bg-gray-50 tw-gap-3">
        <div className="tw-flex-1">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-table-pivot tw-mr-2 tw-text-blue-600"></i>
            Volume History Pivot Analysis - {reportType}
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            <i className="fa-light fa-database tw-mr-1"></i>
            {pivotGridData.length} records • Interactive pivot table with drill-down capabilities
          </p>
        </div>

        <div className="pivot-grid-report__action-buttons">
          <Button
            text={rowsExpanded ? "Collapse Rows" : "Expand Rows"}
            icon={rowsExpanded ? "fa-light fa-compress" : "fa-light fa-expand"}
            type="default"
            stylingMode="outlined"
            onClick={handleExpandCollapseRows}
            disabled={!dataSource || pivotGridData.length === 0}
            hint={rowsExpanded ? "Collapse all rows" : "Expand all rows"}
            className="pivot-grid-report__action-btn pivot-grid-report__action-btn--first"
          />

          <Button
            text={columnsExpanded ? "Collapse Columns" : "Expand Columns"}
            icon={columnsExpanded ? "fa-light fa-compress" : "fa-light fa-expand"}
            type="default"
            stylingMode="outlined"
            onClick={handleExpandCollapseColumns}
            disabled={!dataSource || pivotGridData.length === 0}
            hint={columnsExpanded ? "Collapse all columns" : "Expand all columns"}
            className="pivot-grid-report__action-btn"
          />

          <Button
            icon="fa-light fa-file-excel"
            type="default"
            stylingMode="contained"
            onClick={handleExportToExcel}
            disabled={pivotGridData.length === 0}
            hint="Export pivot data to Excel"
            className="pivot-grid-report__action-btn pivot-grid-report__action-btn--excel pivot-grid-report__action-btn--last"
          />
        </div>
      </div>

      {/* Pivot Grid */}
      <div className="pivot-grid-container tw-p-4 tw-overflow-hidden tw-flex tw-flex-col" style={{ flex: 1, minHeight: '800px' }}>
        {loading && (
          <div className="pivot-grid-loading tw-flex tw-justify-center tw-items-center tw-h-full">
            <div className="tw-text-center">
              <LoadIndicator visible={true} />
              <p className="tw-mt-3 tw-text-gray-600">Loading pivot data...</p>
            </div>
          </div>
        )}

        {!loading && !pivotGridData.length && (
          <div className="pivot-grid-no-data tw-flex tw-flex-col tw-items-center tw-justify-center tw-h-full">
            <i className="fa-light fa-table tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
            <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
              No Pivot Data Available
            </h3>
            <p className="tw-text-gray-500">
              Generate report data to view the pivot grid analysis.
            </p>
          </div>
        )}

        {canRenderDevExtreme && dataSource && !loading && pivotGridData.length > 0 && (
          <PivotGrid
            key={`pivot-grid-${reportType}-${pivotGridData.length}`}
            ref={pivotGridRef}
            dataSource={dataSource}
            allowSortingBySummary={true}
            allowSorting={true}
            allowFiltering={true}
            allowExpanding={true}
            showColumnGrandTotals={false}
            showBorders={true}
            showColumnTotals={false}
            showRowTotals={true}
            showRowGrandTotals={true}
            height="100%"
            width="100%"
            onExporting={onExporting}

            onCellPrepared={(e) => {
              // Custom cell styling
              if (e.area === 'data' && e.cell.value < 0) {
                e.cellElement.style.color = '#d73527';
                e.cellElement.style.fontWeight = 'bold';
              }
            }}
          >
            <FieldChooser enabled={true} />
            <Export enabled={true} />
          </PivotGrid>
        )}
      </div>

      {/* Summary Statistics */}
      {data?.summary && (
        <div className="tw-p-4 tw-border-t tw-bg-gray-50">
          <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-text-sm">
            <div>
              <span className="tw-text-gray-600">Grand Total Volume:</span>
              <span className="tw-ml-2 tw-font-semibold tw-text-green-600">
                {data.summary.grandTotalVolume?.toLocaleString(undefined, {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2
                })}
              </span>
            </div>
            <div>
              <span className="tw-text-gray-600">Sites Included:</span>
              <span className="tw-ml-2 tw-font-semibold">
                {data.summary.sitesIncluded?.length || 0}
              </span>
            </div>
            <div>
              <span className="tw-text-gray-600">Tanks Included:</span>
              <span className="tw-ml-2 tw-font-semibold">
                {data.summary.tanksIncluded?.length || 0}
              </span>
            </div>
            <div>
              <span className="tw-text-gray-600">Report Period:</span>
              <span className="tw-ml-2 tw-font-semibold">
                {data.summary.reportPeriod}
              </span>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

PivotGridReport.propTypes = {
  data: PropTypes.object,
  reportType: PropTypes.string.isRequired,
  loading: PropTypes.bool,
  visible: PropTypes.bool
};

export default PivotGridReport;
