import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Chart, Series, Legend, ArgumentAxis, ValueAxis, Label } from 'devextreme-react/chart';
import { Button } from 'devextreme-react/button';
import { DateBox } from 'devextreme-react/date-box';
import { SelectBox } from 'devextreme-react/select-box';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import issueTrackerService from '../../../services/issueTrackerService';

const IssueReportsPage = () => {
  const navigate = useNavigate();

  // State management
  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setMonth(new Date().getMonth() - 3)),
    endDate: new Date()
  });
  const [selectedCategory, setSelectedCategory] = useState('');
  const [categories, setCategories] = useState([]);

  // Load data on component mount
  const loadReportData = useCallback(async () => {
    try {
      setLoading(true);

      // Load issues and analytics data
      const [issuesData, analyticsData, categoriesData] = await Promise.all([
        issueTrackerService.getIssues(),
        issueTrackerService.getIssueAnalytics(),
        issueTrackerService.getIssueCategories()
      ]);

      setIssues(issuesData || []);
      setCategories(categoriesData || []);

      // Analytics data is available for future use
      console.log('Analytics data:', analyticsData);

    } catch (error) {
      console.error('Error loading report data:', error);
      notify({
        message: 'Failed to load report data. Please try again.',
        type: 'error',
        displayTime: 4000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReportData();
  }, [loadReportData, dateRange, selectedCategory]);

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    if (!issues.length) return { total: 0, open: 0, resolved: 0, critical: 0 };

    const total = issues.length;
    const open = issues.filter(issue => issue.status === 'Open' || issue.status === 'In Progress').length;
    const resolved = issues.filter(issue => issue.status === 'Resolved' || issue.status === 'Closed').length;
    const critical = issues.filter(issue => issue.priority === 'Critical').length;

    return { total, open, resolved, critical };
  }, [issues]);

  // Prepare chart data
  const priorityChartData = useMemo(() => {
    if (!issues.length) return [];

    const priorityCounts = issues.reduce((acc, issue) => {
      const priority = issue.priority || 'Not Set';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(priorityCounts).map(([priority, count]) => ({
      priority,
      count,
      color: priority === 'Critical' ? '#dc2626' :
             priority === 'High' ? '#ea580c' :
             priority === 'Medium' ? '#ca8a04' :
             priority === 'Low' ? '#16a34a' : '#6b7280'
    }));
  }, [issues]);

  const statusChartData = useMemo(() => {
    if (!issues.length) return [];

    const statusCounts = issues.reduce((acc, issue) => {
      const status = issue.status || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {});

    return Object.entries(statusCounts).map(([status, count]) => ({
      status,
      count,
      color: status === 'Open' ? '#2563eb' :
             status === 'In Progress' ? '#eab308' :
             status === 'Resolved' ? '#16a34a' :
             status === 'Closed' ? '#6b7280' : '#9ca3af'
    }));
  }, [issues]);

  const monthlyTrendData = useMemo(() => {
    if (!issues.length) return [];

    const monthlyData = issues.reduce((acc, issue) => {
      if (issue.openDate) {
        const date = new Date(issue.openDate);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        acc[monthKey] = (acc[monthKey] || 0) + 1;
      }
      return acc;
    }, {});

    return Object.entries(monthlyData)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-6) // Last 6 months
      .map(([month, count]) => ({
        month,
        count,
        monthName: new Date(month + '-01').toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
      }));
  }, [issues]);

  const handleExportReport = async () => {
    try {
      notify({
        message: 'Report export feature coming soon...',
        type: 'info',
        displayTime: 3000,
        position: {
          my: 'top center',
          at: 'top center',
          of: window,
          offset: '0 20'
        }
      });
    } catch (error) {
      console.error('Error exporting report:', error);
    }
  };

  if (loading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-py-12">
        <LoadIndicator visible={true} />
        <span className="tw-ml-3 tw-text-gray-600">Loading report data...</span>
      </div>
    );
  }

  return (
    <div className="tw-p-6">
      {/* Header */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6 tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
          <div>
            <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-900 tw-mb-2">
              <i className="fa-light fa-chart-bar tw-mr-2 tw-text-orange-500"></i>
              Issue Reports & Analytics
            </h2>
            <p className="tw-text-gray-600">
              Comprehensive insights and analytics for issue tracking performance.
            </p>
          </div>

          <div className="tw-flex tw-gap-3">
            <Button
              text="Export Report"
              type="normal"
              stylingMode="outlined"
              icon="fa-light fa-download"
              onClick={handleExportReport}
            />
            <Button
              text="View All Issues"
              type="default"
              stylingMode="contained"
              icon="fa-light fa-list"
              onClick={() => navigate('/issue-tracker/tickets')}
              className="tw-bg-orange-600 tw-text-white"
            />
          </div>
        </div>

        {/* Filter Controls */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mt-4">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Start Date
            </label>
            <DateBox
              value={dateRange.startDate}
              onValueChanged={(e) => setDateRange(prev => ({ ...prev, startDate: e.value }))}
              displayFormat="dd/MM/yyyy"
              showClearButton={true}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              End Date
            </label>
            <DateBox
              value={dateRange.endDate}
              onValueChanged={(e) => setDateRange(prev => ({ ...prev, endDate: e.value }))}
              displayFormat="dd/MM/yyyy"
              showClearButton={true}
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              Category Filter
            </label>
            <SelectBox
              dataSource={categories}
              displayExpr="name"
              valueExpr="id"
              value={selectedCategory}
              onValueChanged={(e) => setSelectedCategory(e.value)}
              placeholder="All Categories"
              showClearButton={true}
            />
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4 tw-mb-6">
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">Total Issues</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-600">{summaryStats.total}</p>
            </div>
            <i className="fa-light fa-clipboard-list tw-text-3xl tw-text-blue-500"></i>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">Open Issues</p>
              <p className="tw-text-2xl tw-font-bold tw-text-orange-600">{summaryStats.open}</p>
            </div>
            <i className="fa-light fa-clock tw-text-3xl tw-text-orange-500"></i>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">Resolved</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-600">{summaryStats.resolved}</p>
            </div>
            <i className="fa-light fa-check-circle tw-text-3xl tw-text-green-500"></i>
          </div>
        </div>

        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-600">Critical</p>
              <p className="tw-text-2xl tw-font-bold tw-text-red-600">{summaryStats.critical}</p>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-3xl tw-text-red-500"></i>
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
        {/* Priority Distribution */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            Issues by Priority
          </h3>
          {priorityChartData.length > 0 ? (
            <Chart
              dataSource={priorityChartData}
              height={300}
            >
              <Series
                valueField="count"
                argumentField="priority"
                type="doughnut"
                innerRadius={0.5}
              />
              <Legend visible={true} />
            </Chart>
          ) : (
            <div className="tw-text-center tw-py-12 tw-text-gray-500">
              No data available for priority chart
            </div>
          )}
        </div>

        {/* Status Distribution */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            Issues by Status
          </h3>
          {statusChartData.length > 0 ? (
            <Chart
              dataSource={statusChartData}
              height={300}
            >
              <Series
                valueField="count"
                argumentField="status"
                type="bar"
              />
              <ArgumentAxis>
                <Label rotationAngle={-45} />
              </ArgumentAxis>
              <ValueAxis>
                <Label format="decimal" />
              </ValueAxis>
            </Chart>
          ) : (
            <div className="tw-text-center tw-py-12 tw-text-gray-500">
              No data available for status chart
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
          Monthly Issue Trend (Last 6 Months)
        </h3>
        {monthlyTrendData.length > 0 ? (
          <Chart
            dataSource={monthlyTrendData}
            height={300}
          >
            <Series
              valueField="count"
              argumentField="monthName"
              type="line"
              color="#f97316"
            />
            <ArgumentAxis>
              <Label />
            </ArgumentAxis>
            <ValueAxis>
              <Label format="decimal" />
            </ValueAxis>
          </Chart>
        ) : (
          <div className="tw-text-center tw-py-12 tw-text-gray-500">
            No data available for trend analysis
          </div>
        )}
      </div>
    </div>
  );
};

export default IssueReportsPage;
