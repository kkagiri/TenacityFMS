import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  Chart,
  PivotGrid,
  DataGrid,
  Button,
  Popup,
  Form,
  LoadPanel,
  TabPanel,
  ScrollView,
  SelectBox,
  DateBox,
  CheckBox
} from 'devextreme-react';

import {
  Column,
  Paging,
  Export,
  FilterRow,
  HeaderFilter,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';

import {
  Item,
  GroupItem,
  SimpleItem
} from 'devextreme-react/form';

import {
  ArgumentAxis,
  ValueAxis,
  Series,
  Legend,
  Title,
  Tooltip
} from 'devextreme-react/chart';

import {
  FieldChooser,
  FieldPanel,
  Field
} from 'devextreme-react/pivot-grid';

import { exportDataGrid, exportPivotGrid } from 'devextreme/excel_exporter';
import { Workbook } from 'exceljs';
import saveAs from 'file-saver';

import {
  fetchIssueAnalytics,
  generateIssueReport,
  exportIssuesReport
} from '../../../redux/actions/issueTrackerActions';

import useIssueTracker from '../../../hooks/useIssueTracker';
import './IssueTrackerReportsPage.scss';

/**
 * Issue Tracker Reports and Export Page
 * Comprehensive reporting system with:
 * - Interactive charts and analytics
 * - Pivot tables for data analysis
 * - Custom report generation
 * - Excel/PDF export capabilities
 * - Scheduled reports
 * - Email delivery
 */
const IssueTrackerReportsPage = () => {
  const dispatch = useDispatch();

  // Redux state
  const {
    issues,
    analytics,
    loading
  } = useSelector(state => state.issueTracker);

  // Custom hook
  const { getIssueAnalytics } = useIssueTracker();

  // Local state
  const [activeTab, setActiveTab] = useState(0);
  const [exportPopupVisible, setExportPopupVisible] = useState(false);
  const [schedulePopupVisible, setSchedulePopupVisible] = useState(false);
  const [reportFilters, setReportFilters] = useState({
    dateFrom: new Date(new Date().setMonth(new Date().getMonth() - 1)),
    dateTo: new Date(),
    categories: [],
    priorities: [],
    statuses: [],
    assignees: [],
    vehicles: []
  });
  const [exportConfig, setExportConfig] = useState({
    format: 'excel',
    includeCharts: true,
    includeDetails: true,
    emailDelivery: false,
    recipients: []
  });
  const [scheduleConfig, setScheduleConfig] = useState({
    name: '',
    frequency: 'weekly',
    schedule: {
      dayOfWeek: 1,
      hour: 9,
      minute: 0
    },
    recipients: [],
    format: 'excel',
    filters: {}
  });

  // Initialize component
  useEffect(() => {
    loadAnalyticsData();
  }, [reportFilters]);

  // Load analytics data
  const loadAnalyticsData = () => {
    dispatch(fetchIssueAnalytics(reportFilters));
  };

  // Handle export to Excel
  const handleExportToExcel = async () => {
    try {
      const workbook = new Workbook();

      // Summary worksheet
      const summarySheet = workbook.addWorksheet('Summary');
      await createSummarySheet(summarySheet);

      // Details worksheet
      if (exportConfig.includeDetails) {
        const detailsSheet = workbook.addWorksheet('Issue Details');
        await createDetailsSheet(detailsSheet);
      }

      // Charts worksheet
      if (exportConfig.includeCharts) {
        const chartsSheet = workbook.addWorksheet('Charts');
        await createChartsSheet(chartsSheet);
      }

      // Generate file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const fileName = `Issue_Tracker_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
      saveAs(blob, fileName);

      setExportPopupVisible(false);
    } catch (error) {
      console.error('Export failed:', error);
    }
  };

  // Handle export to PDF
  const handleExportToPDF = async () => {
    try {
      const response = await dispatch(exportIssuesReport({
        ...reportFilters,
        format: 'pdf',
        includeCharts: exportConfig.includeCharts,
        includeDetails: exportConfig.includeDetails
      }));

      const blob = new Blob([response.data], { type: 'application/pdf' });
      const fileName = `Issue_Tracker_Report_${new Date().toISOString().split('T')[0]}.pdf`;
      saveAs(blob, fileName);

      setExportPopupVisible(false);
    } catch (error) {
      console.error('PDF export failed:', error);
    }
  };

  // Create summary sheet for Excel
  const createSummarySheet = async (worksheet) => {
    // Add title
    worksheet.addRow(['Issue Tracker Summary Report']);
    worksheet.addRow([`Generated: ${new Date().toLocaleString()}`]);
    worksheet.addRow([]);

    // Add summary statistics
    if (analytics) {
      worksheet.addRow(['Summary Statistics']);
      worksheet.addRow(['Total Issues', analytics.totalIssues]);
      worksheet.addRow(['Open Issues', analytics.openIssues]);
      worksheet.addRow(['Resolved Issues', analytics.resolvedIssues]);
      worksheet.addRow(['Average Resolution Time (days)', analytics.avgResolutionTime]);
      worksheet.addRow([]);

      // Add breakdown by priority
      worksheet.addRow(['Issues by Priority']);
      analytics.priorityBreakdown?.forEach(item => {
        worksheet.addRow([item.priority, item.count]);
      });
      worksheet.addRow([]);

      // Add breakdown by status
      worksheet.addRow(['Issues by Status']);
      analytics.statusBreakdown?.forEach(item => {
        worksheet.addRow([item.status, item.count]);
      });
    }

    // Style the header
    worksheet.getRow(1).font = { bold: true, size: 16 };
    worksheet.getRow(4).font = { bold: true };
  };

  // Create details sheet for Excel
  const createDetailsSheet = async (worksheet) => {
    // Add headers
    const headers = [
      'ID', 'Title', 'Description', 'Category', 'Priority', 'Status',
      'Created Date', 'Assigned To', 'Resolution Date', 'Cost'
    ];
    worksheet.addRow(headers);

    // Add data
    issues.forEach(issue => {
      worksheet.addRow([
        issue.id,
        issue.title,
        issue.description,
        issue.category,
        issue.priority,
        issue.status,
        issue.createdDate,
        issue.assignedTo,
        issue.resolutionDate,
        issue.actualCost
      ]);
    });

    // Style headers
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE6E6FA' }
    };
  };

  // Create charts sheet for Excel
  const createChartsSheet = async (worksheet) => {
    worksheet.addRow(['Charts and Visualizations']);
    worksheet.addRow(['Chart data would be exported here']);
    // Note: Actual chart export would require additional libraries
  };

  // Handle scheduled report creation
  const handleCreateScheduledReport = async () => {
    try {
      const response = await dispatch(generateIssueReport({
        name: scheduleConfig.name,
        schedule: scheduleConfig,
        filters: reportFilters,
        deliveryMethod: 'email',
        recipients: scheduleConfig.recipients
      }));

      if (response.success) {
        setSchedulePopupVisible(false);
        // Show success message
      }
    } catch (error) {
      console.error('Failed to create scheduled report:', error);
    }
  };

  // Chart configuration
  const chartDataSource = analytics?.issuesTrend || [];

  // Pivot grid configuration
  const pivotDataSource = {
    fields: [
      { dataField: 'category', area: 'row' },
      { dataField: 'priority', area: 'row' },
      { dataField: 'status', area: 'column' },
      { dataField: 'id', area: 'data', summaryType: 'count' },
      { dataField: 'actualCost', area: 'data', summaryType: 'sum' }
    ],
    store: issues
  };

  // Tab configuration
  const tabItems = [
    {
      title: 'Dashboard',
      icon: 'chart',
      template: 'dashboardTab'
    },
    {
      title: 'Pivot Analysis',
      icon: 'grid',
      template: 'pivotTab'
    },
    {
      title: 'Detailed Reports',
      icon: 'doc',
      template: 'detailsTab'
    },
    {
      title: 'Trends',
      icon: 'trends',
      template: 'trendsTab'
    }
  ];

  // Render dashboard tab
  const renderDashboardTab = () => (
    <div className="dashboard-tab">
      <div className="charts-container">
        <div className="chart-section">
          <h3>Issues by Priority</h3>
          <Chart
            dataSource={analytics?.priorityBreakdown || []}
            palette="Bright"
          >
            <Series
              argumentField="priority"
              valueField="count"
              type="doughnut"
              innerRadius={0.5}
            />
            <Legend visible={true} />
            <Tooltip enabled={true} />
          </Chart>
        </div>

        <div className="chart-section">
          <h3>Issues Trend</h3>
          <Chart
            dataSource={chartDataSource}
            palette="Harmony Light"
          >
            <ArgumentAxis argumentType="datetime" />
            <ValueAxis />
            <Series
              argumentField="date"
              valueField="count"
              type="line"
              point={{ visible: true }}
            />
            <Legend visible={false} />
            <Tooltip enabled={true} />
          </Chart>
        </div>
      </div>

      <div className="metrics-container">
        <div className="metric-card">
          <h4>Total Issues</h4>
          <span className="metric-value">{analytics?.totalIssues || 0}</span>
        </div>
        <div className="metric-card">
          <h4>Open Issues</h4>
          <span className="metric-value">{analytics?.openIssues || 0}</span>
        </div>
        <div className="metric-card">
          <h4>Avg Resolution Time</h4>
          <span className="metric-value">{analytics?.avgResolutionTime || 0} days</span>
        </div>
        <div className="metric-card">
          <h4>Total Cost</h4>
          <span className="metric-value">${analytics?.totalCost || 0}</span>
        </div>
      </div>
    </div>
  );

  // Render pivot tab
  const renderPivotTab = () => (
    <div className="pivot-tab">
      <PivotGrid
        dataSource={pivotDataSource}
        allowSortingBySummary={true}
        allowFiltering={true}
        showBorders={true}
        showColumnTotals={true}
        showRowTotals={true}
        showColumnGrandTotals={true}
        showRowGrandTotals={true}
      >
        <FieldChooser enabled={true} />
        <FieldPanel visible={true} />
      </PivotGrid>
    </div>
  );

  // Render details tab
  const renderDetailsTab = () => (
    <div className="details-tab">
      <DataGrid
        dataSource={issues}
        showBorders={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        wordWrapEnabled={true}
      >
        <Column dataField="id" caption="ID" width={80} />
        <Column dataField="title" caption="Title" />
        <Column dataField="category" caption="Category" width={120} />
        <Column dataField="priority" caption="Priority" width={100} />
        <Column dataField="status" caption="Status" width={100} />
        <Column dataField="createdDate" caption="Created" dataType="date" width={120} />
        <Column dataField="assignedTo" caption="Assigned To" width={150} />
        <Column dataField="actualCost" caption="Cost" dataType="number" format="currency" />

        <Paging pageSize={20} />
        <FilterRow visible={true} />
        <HeaderFilter visible={true} />
        <Export enabled={true} fileName="Issues_Detail_Report" />

        <Summary>
          <TotalItem
            column="id"
            summaryType="count"
            displayFormat="Total: {0} issues"
          />
          <TotalItem
            column="actualCost"
            summaryType="sum"
            displayFormat="Total Cost: {0}"
            valueFormat="currency"
          />
        </Summary>
      </DataGrid>
    </div>
  );

  // Render trends tab
  const renderTrendsTab = () => (
    <div className="trends-tab">
      <div className="trend-charts">
        <div className="chart-section">
          <h3>Monthly Issues Created</h3>
          <Chart
            dataSource={analytics?.monthlyTrend || []}
            palette="Material"
          >
            <ArgumentAxis />
            <ValueAxis />
            <Series
              argumentField="month"
              valueField="created"
              type="bar"
              name="Created"
            />
            <Series
              argumentField="month"
              valueField="resolved"
              type="bar"
              name="Resolved"
            />
            <Legend visible={true} />
            <Tooltip enabled={true} />
          </Chart>
        </div>

        <div className="chart-section">
          <h3>Resolution Time Trend</h3>
          <Chart
            dataSource={analytics?.resolutionTrend || []}
            palette="Soft Pastel"
          >
            <ArgumentAxis />
            <ValueAxis title="Days" />
            <Series
              argumentField="month"
              valueField="avgResolutionTime"
              type="spline"
              point={{ visible: true }}
            />
            <Tooltip enabled={true} />
          </Chart>
        </div>
      </div>
    </div>
  );

  return (
    <div className="issue-tracker-reports-page">
      <div className="reports-header">
        <h1>Issue Tracker Reports & Analytics</h1>

        <div className="header-actions">
          <Button
            text="Export Report"
            type="default"
            icon="export"
            onClick={() => setExportPopupVisible(true)}
          />

          <Button
            text="Schedule Report"
            type="default"
            icon="clock"
            onClick={() => setSchedulePopupVisible(true)}
          />

          <Button
            text="Refresh Data"
            type="default"
            icon="refresh"
            onClick={loadAnalyticsData}
          />
        </div>
      </div>

      <div className="reports-filters">
        <Form
          formData={reportFilters}
          onFieldDataChanged={(e) =>
            setReportFilters({ ...reportFilters, [e.dataField]: e.value })
          }
          colCount={4}
          labelLocation="top"
        >
          <SimpleItem
            dataField="dateFrom"
            editorType="dxDateBox"
            caption="From Date"
          />
          <SimpleItem
            dataField="dateTo"
            editorType="dxDateBox"
            caption="To Date"
          />
          <SimpleItem
            dataField="categories"
            editorType="dxTagBox"
            caption="Categories"
            editorOptions={{
              dataSource: [], // Will be populated
              displayExpr: 'name',
              valueExpr: 'id'
            }}
          />
          <SimpleItem
            dataField="priorities"
            editorType="dxTagBox"
            caption="Priorities"
            editorOptions={{
              dataSource: [], // Will be populated
              displayExpr: 'name',
              valueExpr: 'value'
            }}
          />
        </Form>
      </div>

      <div className="reports-content">
        <TabPanel
          dataSource={tabItems}
          selectedIndex={activeTab}
          onSelectionChanged={(e) => setActiveTab(e.selectedIndex)}
          loop={false}
          animationEnabled={true}
          swipeEnabled={false}
        >
          <Item name="dashboardTab">
            {renderDashboardTab()}
          </Item>
          <Item name="pivotTab">
            {renderPivotTab()}
          </Item>
          <Item name="detailsTab">
            {renderDetailsTab()}
          </Item>
          <Item name="trendsTab">
            {renderTrendsTab()}
          </Item>
        </TabPanel>
      </div>

      {/* Export Configuration Popup */}
      <Popup
        visible={exportPopupVisible}
        onHiding={() => setExportPopupVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Export Report"
        width={500}
        height="auto"
      >
        <ScrollView>
          <Form
            formData={exportConfig}
            onFieldDataChanged={(e) =>
              setExportConfig({ ...exportConfig, [e.dataField]: e.value })
            }
            labelLocation="top"
          >
            <SimpleItem
              dataField="format"
              editorType="dxSelectBox"
              caption="Export Format"
              editorOptions={{
                dataSource: [
                  { value: 'excel', text: 'Excel (.xlsx)' },
                  { value: 'pdf', text: 'PDF (.pdf)' },
                  { value: 'csv', text: 'CSV (.csv)' }
                ],
                displayExpr: 'text',
                valueExpr: 'value'
              }}
            />

            <SimpleItem
              dataField="includeCharts"
              editorType="dxCheckBox"
              caption="Include Charts"
            />

            <SimpleItem
              dataField="includeDetails"
              editorType="dxCheckBox"
              caption="Include Detailed Data"
            />

            <SimpleItem
              dataField="emailDelivery"
              editorType="dxCheckBox"
              caption="Email Delivery"
            />

            {exportConfig.emailDelivery && (
              <SimpleItem
                dataField="recipients"
                editorType="dxTagBox"
                caption="Email Recipients"
                editorOptions={{
                  acceptCustomValue: true,
                  placeholder: 'Enter email addresses...'
                }}
              />
            )}
          </Form>

          <div className="popup-actions">
            <Button
              text="Cancel"
              onClick={() => setExportPopupVisible(false)}
            />
            <Button
              text="Export"
              type="success"
              onClick={exportConfig.format === 'excel' ? handleExportToExcel : handleExportToPDF}
            />
          </div>
        </ScrollView>
      </Popup>

      {/* Schedule Report Popup */}
      <Popup
        visible={schedulePopupVisible}
        onHiding={() => setSchedulePopupVisible(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Schedule Report"
        width={600}
        height="auto"
      >
        <ScrollView>
          <Form
            formData={scheduleConfig}
            onFieldDataChanged={(e) =>
              setScheduleConfig({ ...scheduleConfig, [e.dataField]: e.value })
            }
            labelLocation="top"
          >
            <SimpleItem
              dataField="name"
              caption="Report Name"
              editorOptions={{
                placeholder: 'Enter report name...'
              }}
            />

            <SimpleItem
              dataField="frequency"
              editorType="dxSelectBox"
              caption="Frequency"
              editorOptions={{
                dataSource: [
                  { value: 'daily', text: 'Daily' },
                  { value: 'weekly', text: 'Weekly' },
                  { value: 'monthly', text: 'Monthly' }
                ],
                displayExpr: 'text',
                valueExpr: 'value'
              }}
            />

            <SimpleItem
              dataField="recipients"
              editorType="dxTagBox"
              caption="Email Recipients"
              editorOptions={{
                acceptCustomValue: true,
                placeholder: 'Enter email addresses...'
              }}
            />
          </Form>

          <div className="popup-actions">
            <Button
              text="Cancel"
              onClick={() => setSchedulePopupVisible(false)}
            />
            <Button
              text="Create Schedule"
              type="success"
              onClick={handleCreateScheduledReport}
            />
          </div>
        </ScrollView>
      </Popup>

      <LoadPanel
        visible={loading.analytics}
        message="Loading analytics data..."
        showPane={true}
        shading={true}
      />
    </div>
  );
};

export default IssueTrackerReportsPage;
