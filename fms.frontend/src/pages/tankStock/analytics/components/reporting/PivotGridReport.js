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
  const [isAllExpanded, setIsAllExpanded] = useState(false);
  const pivotGridRef = useRef(null);

  // Delay DevExtreme initialization until after React's commit phase
  useEffect(() => {
    const timer = setTimeout(() => {
      setCanRenderDevExtreme(true);
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Define fields configuration
  const getFields = useCallback(() => ([
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
        precision: 2
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
  ]), []);

  // Process data for pivot grid and create DevExtreme data source
  useEffect(() => {
    if (data?.data) {
      const formattedData = TankStockReportsService.formatPivotData(data);
      setPivotGridData(formattedData);

      console.log('Formatted pivot data:', formattedData);
      console.log('Fields configuration:', getFields());

      // Create DevExtreme PivotGridDataSource
      const pivotDataSource = new PivotGridDataSource({
        fields: getFields(),
        store: formattedData
      });

      // Load the data source to initialize it properly
      pivotDataSource.load().then(() => {
        console.log('PivotGridDataSource loaded successfully');
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

  // Expand/Collapse All functionality
  const handleExpandCollapseAll = useCallback(() => {
    if (pivotGridRef.current && dataSource) {
      try {
        const pivotGrid = pivotGridRef.current.instance;
        const dataSourceInstance = pivotGrid.getDataSource();

        if (isAllExpanded) {
          // Collapse all - collapse both rows and columns
          dataSourceInstance.collapseAll(0); // Row area
          dataSourceInstance.collapseAll(1); // Column area
          console.log('Collapsed all');
        } else {
          // Expand all - expand both rows and columns
          dataSourceInstance.expandAll(0); // Row area
          dataSourceInstance.expandAll(1); // Column area
          console.log('Expanded all');
        }
        setIsAllExpanded(!isAllExpanded);
      } catch (error) {
        console.error('Error expanding/collapsing:', error);
      }
    }
  }, [isAllExpanded, dataSource]);

  return (
    <div className="pivot-grid-report tw-bg-white tw-rounded-lg tw-shadow" style={{ display: visible ? 'flex' : 'none', flexDirection: 'column', height: '100%' }}>
      {/* Header */}
      <div className="tw-flex tw-justify-between tw-items-center tw-p-4 tw-border-b">
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">
            Volume History Pivot Analysis - {reportType}
          </h3>
          <p className="tw-text-sm tw-text-gray-600">
            {pivotGridData.length} records • Interactive pivot table with drill-down capabilities
          </p>
        </div>

        <div className="tw-flex tw-gap-2">
          <Button
            text={isAllExpanded ? "Collapse All" : "Expand All"}
            icon={isAllExpanded ? "fa-light fa-compress-arrows-alt" : "fa-light fa-expand-arrows-alt"}
            type="default"
            onClick={handleExpandCollapseAll}
            disabled={!dataSource || pivotGridData.length === 0}
          />

          <Button
            text="Export to Excel"
            icon="fa-light fa-file-excel"
            type="default"
            onClick={handleExportToExcel}
            disabled={pivotGridData.length === 0}
          />
        </div>
      </div>

      {loading && (
        <div className="pivot-grid-loading tw-flex tw-justify-center tw-items-center tw-py-4">
          <LoadIndicator visible={true} />
          <span className="tw-ml-3 tw-text-gray-600">Loading pivot data...</span>
        </div>
      )}

      {!loading && !pivotGridData.length && (
        <div className="pivot-grid-no-data tw-bg-white tw-rounded-lg tw-shadow tw-p-8 tw-text-center">
          <i key="no-data-icon" className="fa-light fa-table tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
            No Pivot Data Available
          </h3>
          <p className="tw-text-gray-500">
            Generate report data to view the pivot grid analysis.
          </p>
        </div>
      )}

      {/* Pivot Grid */}
      <div className="pivot-grid-container tw-p-4 tw-overflow-hidden tw-flex tw-flex-col" style={{ flex: 1, minHeight: '800px' }}>
        {canRenderDevExtreme && dataSource && (
          <PivotGrid
            key={`pivot-grid-${reportType}-${pivotGridData.length}`}
            ref={pivotGridRef}
            dataSource={dataSource}
            allowSortingBySummary={true}
            allowSorting={true}
            allowFiltering={true}
            allowExpanding={true}
            showBorders={true}
            showColumnTotals={true}
            showRowTotals={true}
            showRowGrandTotals={true}
            height="100%"
            width="100%"
            onExporting={onExporting}
            onCellClick={(e) => {
              // Handle cell click for drill-down functionality
              console.log('Pivot cell clicked:', e);
            }}
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
