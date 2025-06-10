import React, { useState, useCallback, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip } from 'devextreme-react/chart';
import { DataGrid, Column, Export, Summary, TotalItem } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { DateRangeBox } from 'devextreme-react/date-range-box';
import { CheckBox } from 'devextreme-react/check-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import { TickerCard } from '../../components/TickerCard/tickerCard';
import { useStockManagement } from '../../hooks/useStockManagement';
import notify from 'devextreme/ui/notify';

const ReportTypes = [
  { id: 'summary', name: 'Stock Summary Report', icon: 'fa-light fa-chart-pie' },
  { id: 'variance', name: 'Stock Variance Report', icon: 'fa-light fa-chart-line' },
  { id: 'utilization', name: 'Tank Utilization Report', icon: 'fa-light fa-gauge' },
  { id: 'movements', name: 'Stock Movement Report', icon: 'fa-light fa-arrows-rotate' }
];

const ExportFormats = [
  { id: 'excel', name: 'Excel (.xlsx)', icon: 'fa-light fa-file-excel' },
  { id: 'csv', name: 'CSV (.csv)', icon: 'fa-light fa-file-csv' },
  { id: 'pdf', name: 'PDF (.pdf)', icon: 'fa-light fa-file-pdf' }
];

//Cursor - Stock Report Dashboard Component
const StockReportDashboard = ({ selectedSite }) => {
  const { generateStockReport, exportStockReport, isLoading } = useStockManagement();
  const sites = useSelector((state) => state.site.sites);
  const tanks = useSelector((state) => state.tank.tanks);
  const tankVolumeHistory = useSelector((state) => state.tankVolumeHistory.tankVolumeHistory);

  const [reportType, setReportType] = useState('summary');
  const [dateRange, setDateRange] = useState([
    new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    new Date()
  ]);
  const [reportData, setReportData] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [includeCharts, setIncludeCharts] = useState(true);
  const [includeDetails, setIncludeDetails] = useState(true);

  //Cursor - Removed mock data - will generate from API

  // Calculate report summary data
  const summaryData = useMemo(() => {
    if (!reportData || !reportData.tanks) return null;

    return reportData.tanks.reduce((acc, tank) => {
      acc.totalCapacity += tank.capacity;
      acc.totalCurrentStock += tank.currentStock;
      acc.totalDeliveries += tank.deliveries || 0;
      acc.totalDispensed += tank.dispensed || 0;
      acc.averageUtilization += tank.utilization;
      acc.tankCount += 1;
      return acc;
    }, {
      totalCapacity: 0,
      totalCurrentStock: 0,
      totalDeliveries: 0,
      totalDispensed: 0,
      averageUtilization: 0,
      tankCount: 0
    });
  }, [reportData]);

  // Prepare chart data based on report type
  const chartData = useMemo(() => {
    if (!reportData || !reportData.tanks) return [];

    switch (reportType) {
      case 'utilization':
        return reportData.tanks.map(tank => ({
          tankName: tank.name,
          utilization: tank.utilization,
          capacity: tank.capacity,
          currentStock: tank.currentStock
        }));
      case 'variance':
        return reportData.tanks.map(tank => ({
          tankName: tank.name,
          variance: tank.variance || 0,
          expected: tank.expectedStock || 0,
          actual: tank.currentStock
        }));
      case 'movements':
        return reportData.tanks.map(tank => ({
          tankName: tank.name,
          deliveries: tank.deliveries || 0,
          dispensed: tank.dispensed || 0,
          netChange: (tank.deliveries || 0) - (tank.dispensed || 0)
        }));
      default:
        return reportData.tanks.map(tank => ({
          tankName: tank.name,
          currentStock: tank.currentStock,
          capacity: tank.capacity,
          utilization: tank.utilization
        }));
    }
  }, [reportData, reportType]);

  // Handle report generation
  const handleGenerateReport = useCallback(async () => {
    try {
      setIsGenerating(true);

      //Cursor - Generate actual report using API
      const reportParams = {
        reportType,
        siteId: selectedSite && selectedSite !== 'all' ? selectedSite : null,
        startDate: dateRange[0]?.toISOString().split('T')[0],
        endDate: dateRange[1]?.toISOString().split('T')[0],
        includeCharts,
        includeDetails,
        tankIds: tanks.filter(t => !selectedSite || selectedSite === 'all' || t.siteId === selectedSite).map(t => t.id)
      };

      const result = await generateStockReport(reportParams);
      if (result.success) {
        setReportData(result.data);
        notify(result.message || 'Report generated successfully', 'success', 3000);
      } else {
        notify(result.message || 'Failed to generate report', 'error', 5000);
      }
    } catch (error) {
      console.error('Error generating report:', error);
      notify('Error generating stock report', 'error', 3000);
      setIsGenerating(false);
    }
  }, [reportType, selectedSite, dateRange, includeCharts, includeDetails, tanks, generateStockReport]);

  // Handle report export
  const handleExportReport = useCallback(async (format) => {
    if (!reportData) {
      notify('Please generate a report first', 'warning', 3000);
      return;
    }

    try {
      notify(`Exporting report as ${format.toUpperCase()}...`, 'info', 2000);

      //Cursor - Use actual export API
      const result = await exportStockReport(reportData.id, format);
      if (result.success) {
        notify(result.message || `Report exported successfully as ${format.toUpperCase()}`, 'success', 3000);
      } else {
        notify(result.message || 'Failed to export report', 'error', 5000);
      }
    } catch (error) {
      console.error('Error exporting report:', error);
      notify('Error exporting report', 'error', 3000);
    }
  }, [reportData, reportType]);

  // Render chart based on report type
  const renderChart = useCallback(() => {
    if (!chartData.length) return null;

    switch (reportType) {
      case 'utilization':
        return (
          <Chart
            dataSource={chartData}
            height={300}
            title="Tank Utilization"
          >
            <Series
              valueField="utilization"
              argumentField="tankName"
              type="bar"
              color="#36a2eb"
            />
            <ArgumentAxis title="Tanks" />
            <ValueAxis title="Utilization %" />
            <Tooltip enabled={true} />
          </Chart>
        );
      case 'variance':
        return (
          <Chart
            dataSource={chartData}
            height={300}
            title="Stock Variance Analysis"
          >
            <Series
              valueField="expected"
              argumentField="tankName"
              type="bar"
              name="Expected"
              color="#28a745"
            />
            <Series
              valueField="actual"
              argumentField="tankName"
              type="bar"
              name="Actual"
              color="#dc3545"
            />
            <ArgumentAxis title="Tanks" />
            <ValueAxis title="Volume (L)" />
            <Legend visible={true} />
            <Tooltip enabled={true} />
          </Chart>
        );
      case 'movements':
        return (
          <Chart
            dataSource={chartData}
            height={300}
            title="Stock Movement Analysis"
          >
            <Series
              valueField="deliveries"
              argumentField="tankName"
              type="bar"
              name="Deliveries"
              color="#007bff"
            />
            <Series
              valueField="dispensed"
              argumentField="tankName"
              type="bar"
              name="Dispensed"
              color="#dc3545"
            />
            <ArgumentAxis title="Tanks" />
            <ValueAxis title="Volume (L)" />
            <Legend visible={true} />
            <Tooltip enabled={true} />
          </Chart>
        );
      default:
        return (
          <Chart
            dataSource={chartData}
            height={300}
            title="Current Stock vs Capacity"
          >
            <Series
              valueField="capacity"
              argumentField="tankName"
              type="bar"
              name="Capacity"
              color="#e9ecef"
            />
            <Series
              valueField="currentStock"
              argumentField="tankName"
              type="bar"
              name="Current Stock"
              color="#007bff"
            />
            <ArgumentAxis title="Tanks" />
            <ValueAxis title="Volume (L)" />
            <Legend visible={true} />
            <Tooltip enabled={true} />
          </Chart>
        );
    }
  }, [chartData, reportType]);

  return (
    <div className="tw-space-y-6">
      {/* Report Configuration */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-mb-6">
          <i className="fa-light fa-chart-bar tw-text-blue-600 tw-text-xl tw-mr-3"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Stock Reports</h3>
        </div>

        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Report Type</label>
            <SelectBox
              dataSource={ReportTypes}
              valueExpr="id"
              displayExpr="name"
              value={reportType}
              onValueChanged={(e) => setReportType(e.value)}
            />
          </div>
          <div className="md:tw-col-span-2">
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Date Range</label>
            <DateRangeBox
              startDate={dateRange[0]}
              endDate={dateRange[1]}
              onValueChanged={(e) => e.value && setDateRange(e.value)}
              max={new Date()}
            />
          </div>
          <div className="tw-flex tw-flex-col tw-justify-center tw-space-y-2">
            <CheckBox
              text="Include Charts"
              value={includeCharts}
              onValueChanged={(e) => setIncludeCharts(e.value)}
            />
            <CheckBox
              text="Include Details"
              value={includeDetails}
              onValueChanged={(e) => setIncludeDetails(e.value)}
            />
          </div>
        </div>

        <div className="tw-flex tw-items-center tw-space-x-4">
          <Button
            icon="fa-light fa-play"
            text="Generate Report"
            onClick={handleGenerateReport}
            disabled={isGenerating}
            stylingMode="contained"
            type="default"
          >
            {isGenerating && <LoadIndicator width="16px" height="16px" visible={true} />}
          </Button>

          {reportData && (
            <div className="tw-flex tw-space-x-2">
              {ExportFormats.map(format => (
                <Button
                  key={format.id}
                  icon={format.icon}
                  text={format.name}
                  onClick={() => handleExportReport(format.id)}
                  stylingMode="outlined"
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-5 tw-gap-4">
          <TickerCard
            title="Total Tanks"
            icon="fa-light fa-tank-water"
            tone="info"
            value={summaryData.tankCount}
          />
          <TickerCard
            title="Total Capacity"
            icon="fa-light fa-gauge-max"
            tone="info"
            value={`${summaryData.totalCapacity.toFixed(0)} L`}
          />
          <TickerCard
            title="Current Stock"
            icon="fa-light fa-droplet"
            tone="success"
            value={`${summaryData.totalCurrentStock.toFixed(0)} L`}
          />
          <TickerCard
            title="Avg. Utilization"
            icon="fa-light fa-gauge"
            tone="warning"
            value={`${(summaryData.averageUtilization / summaryData.tankCount).toFixed(1)}%`}
          />
          <TickerCard
            title="Available Space"
            icon="fa-light fa-arrows-up-down"
            tone="info"
            value={`${(summaryData.totalCapacity - summaryData.totalCurrentStock).toFixed(0)} L`}
          />
        </div>
      )}

      {/* Chart Section */}
      {reportData && includeCharts && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
          <h4 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Visual Analysis</h4>
          {renderChart()}
        </div>
      )}

      {/* Data Grid Section */}
      {reportData && includeDetails && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
          <h4 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">Detailed Report</h4>
          <DataGrid
            dataSource={reportData.tanks}
            keyExpr="id"
            showBorders={true}
            showRowLines={true}
            showColumnLines={true}
            rowAlternationEnabled={true}
            columnAutoWidth={true}
            hoverStateEnabled={true}
          >
            <Export enabled={true} fileName={`stock-report-${reportType}-${new Date().toISOString().split('T')[0]}`} />

            <Column dataField="siteName" caption="Site" width={120} />
            <Column dataField="name" caption="Tank" width={120} />
            <Column dataField="capacity" caption="Capacity (L)" dataType="number" format="0.00" width={120} />
            <Column dataField="currentStock" caption="Current Stock (L)" dataType="number" format="0.00" width={120} />
            <Column dataField="utilization" caption="Utilization (%)" dataType="number" format="0.0" width={120} />
            <Column
              caption="Available (L)"
              calculateCellValue={(data) => (data.capacity - data.currentStock).toFixed(2)}
              width={120}
            />
            {reportType === 'variance' && (
              <>
                <Column dataField="expectedStock" caption="Expected (L)" dataType="number" format="0.00" width={120} />
                <Column dataField="variance" caption="Variance (L)" dataType="number" format="0.00" width={120} />
              </>
            )}
            {reportType === 'movements' && (
              <>
                <Column dataField="deliveries" caption="Deliveries (L)" dataType="number" format="0.00" width={120} />
                <Column dataField="dispensed" caption="Dispensed (L)" dataType="number" format="0.00" width={120} />
              </>
            )}

            <Summary>
              <TotalItem
                column="capacity"
                summaryType="sum"
                valueFormat="0.00 L"
                displayFormat="Total Capacity: {0}"
              />
              <TotalItem
                column="currentStock"
                summaryType="sum"
                valueFormat="0.00 L"
                displayFormat="Total Stock: {0}"
              />
            </Summary>
          </DataGrid>
        </div>
      )}

      {/* Loading Indicator */}
      {(isLoading || isGenerating) && (
        <div className="tw-flex tw-justify-center tw-items-center tw-h-32">
          <LoadIndicator width={'32px'} height={'32px'} visible={true} />
          <span className="tw-ml-3 tw-text-gray-600">
            {isGenerating ? 'Generating report...' : 'Loading...'}
          </span>
        </div>
      )}
    </div>
  );
};

export default StockReportDashboard;
