import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import {
  Chart,
  PieChart,
  LoadPanel,
  Button,
  Popup,
  Tooltip
} from 'devextreme-react';

import DataGrid, {
  Column,
  Paging,
  FilterRow,
  Summary,
  TotalItem
} from 'devextreme-react/data-grid';

import {
  fetchDashboardStats,
  fetchIssues,
  fetchIssueCategories,
  fetchIssuePriorities,
  fetchIssueStatuses,
  setFilters
} from '../../redux/actions/issueTrackerActions';

import IssueCard from './components/IssueCard';
import IssueDashboardStats from './components/IssueDashboardStats';
import IssueFilters from './components/IssueFilters';
import IssueStatusIndicator from './components/IssueStatusIndicator';
import IssuePriorityBadge from './components/IssuePriorityBadge';

import './IssueTracker.scss';

/**
 * Issue Tracker Main Dashboard Page
 * Provides overview of all issues with statistics, recent issues, and quick actions
 */
const IssueTrackerPage = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const {
    issues,
    dashboardStats,
    categories,
    priorities,
    statuses,
    loading,
    error,
    filters
  } = useSelector(state => state.issueTracker);

  const [showFilters, setShowFilters] = useState(false);
  const [selectedPriority, setSelectedPriority] = useState('');

  useEffect(() => {
    // Load initial data
    dispatch(fetchDashboardStats());
    dispatch(fetchIssues({ limit: 10, sortBy: 'createdDate', order: 'desc' })); // Recent issues
    dispatch(fetchIssueCategories());
    dispatch(fetchIssuePriorities());
    dispatch(fetchIssueStatuses());
  }, [dispatch]);

  const handleNavigateToList = () => {
    navigate('/issue-tracker/tickets');
  };

  const handleNavigateToNew = () => {
    navigate('/issue-tracker/create');
  };

  const handleIssueView = (issue) => {
    navigate(`/issue-tracker/details/${issue.id}`);
  };

  const handleIssueEdit = (issue) => {
    navigate(`/issue-tracker/details/${issue.id}`);
  };

  const handleFilterByPriority = (priority) => {
    setSelectedPriority(priority);
    dispatch(setFilters({ priority }));
    dispatch(fetchIssues({ priority, limit: 10 }));
  };

  const handleFilterByStatus = (status) => {
    dispatch(setFilters({ status }));
    dispatch(fetchIssues({ status, limit: 10 }));
  };

  const chartDataSource = dashboardStats ? [
    { priority: 'Critical', count: dashboardStats.criticalCount, color: '#d63384' },
    { priority: 'High', count: dashboardStats.highCount, color: '#fd7e14' },
    { priority: 'Medium', count: dashboardStats.mediumCount, color: '#ffc107' },
    { priority: 'Low', count: dashboardStats.lowCount, color: '#198754' }
  ] : [];

  const statusChartData = dashboardStats ? [
    { status: 'Open', count: dashboardStats.openCount, color: '#0d6efd' },
    { status: 'In Progress', count: dashboardStats.inProgressCount, color: '#ffc107' },
    { status: 'Resolved', count: dashboardStats.resolvedCount, color: '#198754' },
    { status: 'Closed', count: dashboardStats.closedCount, color: '#6c757d' }
  ] : [];

  if (loading.dashboardStats) {
    return (
      <div className="issue-tracker-page">
        <LoadPanel visible={true} message="Loading dashboard..." />
      </div>
    );
  }

  return (
    <div className="issue-tracker-page tw-p-6">
      {/* Header Section */}
      <div className="tw-flex tw-flex-col lg:tw-flex-row tw-justify-between tw-items-start lg:tw-items-center tw-mb-6">
        <div className="tw-mb-4 lg:tw-mb-0">
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-2">
            <i className="fa-light fa-exclamation-triangle tw-mr-3 tw-text-orange-500"></i>
            Issue Tracker
          </h1>
          <p className="tw-text-gray-600">
            Monitor and manage fleet issues with GPS integration and real-time updates
          </p>
        </div>

        <div className="tw-flex tw-flex-wrap tw-gap-3">
          <Button
            text="New Issue"
            type="default"
            stylingMode="contained"
            icon="fa-light fa-plus"
            onClick={handleNavigateToNew}
            className="tw-bg-blue-600 tw-text-white"
          />
          <Button
            text="View All"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-list"
            onClick={handleNavigateToList}
          />
          <Button
            text="Reports"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-chart-line"
            onClick={() => navigate('/issue-tracker/reports')}
          />
          <Button
            text="Advanced Filters"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-filter"
            onClick={() => navigate('/issue-tracker/filters')}
          />
          <Button
            text="Notifications"
            type="normal"
            stylingMode="outlined"
            icon="fa-light fa-bell"
            onClick={() => navigate('/issue-tracker/notifications')}
          />
        </div>
      </div>

      {/* Dashboard Statistics */}
      {dashboardStats && (
        <IssueDashboardStats
          stats={dashboardStats}
          onPriorityFilter={handleFilterByPriority}
          onStatusFilter={handleFilterByStatus}
        />
      )}

      {/* Charts Section */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-8">
        {/* Priority Distribution Chart */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-text-gray-900">
            <i className="fa-light fa-chart-pie tw-mr-2"></i>
            Issues by Priority
          </h3>
          <PieChart
            dataSource={chartDataSource}
            palette="Soft Pastel"
            height={300}
          >
            <Tooltip enabled={true} />
          </PieChart>
        </div>

        {/* Status Distribution Chart */}
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-text-gray-900">
            <i className="fa-light fa-chart-bar tw-mr-2"></i>
            Issues by Status
          </h3>
          <Chart
            dataSource={statusChartData}
            height={300}
          >
            <Tooltip enabled={true} />
          </Chart>
        </div>
      </div>

      {/* Recent Issues Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6">
        <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900">
            <i className="fa-light fa-clock tw-mr-2"></i>
            Recent Issues
          </h3>
          <div className="tw-flex tw-gap-2">
            {priorities.map(priority => (
              <Button
                key={priority.id}
                text={priority.name}
                type={selectedPriority === priority.name ? "default" : "normal"}
                stylingMode={selectedPriority === priority.name ? "contained" : "outlined"}
                onClick={() => handleFilterByPriority(priority.name)}
                className={`tw-text-xs ${selectedPriority === priority.name ? 'tw-bg-blue-600 tw-text-white' : ''}`}
              />
            ))}
          </div>
        </div>

        {loading.issues ? (
          <LoadPanel visible={true} message="Loading issues..." />
        ) : issues.length > 0 ? (
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
            {issues.slice(0, 6).map(issue => (
              <IssueCard
                key={issue.id}
                issue={issue}
                onView={() => handleIssueView(issue)}
                onEdit={() => handleIssueEdit(issue)}
                className="tw-mb-4"
              />
            ))}
          </div>
        ) : (
          <div className="tw-text-center tw-py-12">
            <i className="fa-light fa-inbox tw-text-6xl tw-text-gray-300 tw-mb-4"></i>
            <h4 className="tw-text-xl tw-font-semibold tw-text-gray-600 tw-mb-2">
              No Issues Found
            </h4>
            <p className="tw-text-gray-500 tw-mb-6">
              Get started by creating your first issue or adjust your filters.
            </p>
            <Button
              text="Create First Issue"
              type="default"
              stylingMode="contained"
              icon="fa-light fa-plus"
              onClick={handleNavigateToNew}
              className="tw-bg-blue-600 tw-text-white"
            />
          </div>
        )}

        {issues.length > 6 && (
          <div className="tw-text-center tw-mt-6">
            <Button
              text={`View All ${issues.length} Issues`}
              type="normal"
              stylingMode="outlined"
              icon="fa-light fa-external-link"
              onClick={handleNavigateToList}
            />
          </div>
        )}
      </div>

      {/* Quick Actions DataGrid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-p-6 tw-mt-6">
        <h3 className="tw-text-lg tw-font-semibold tw-mb-4 tw-text-gray-900">
          <i className="fa-light fa-bolt tw-mr-2"></i>
          Quick Actions
        </h3>

        <DataGrid
          dataSource={issues.filter(issue => issue.status === 'Open' || issue.status === 'In Progress')}
          showBorders={false}
          showRowLines={true}
          showColumnLines={false}
          rowAlternationEnabled={true}
          hoverStateEnabled={true}
          height={400}
          allowColumnResizing={true}
          columnAutoWidth={true}
        >
          <FilterRow visible={true} />
          <Paging enabled={true} pageSize={5} />

          <Column
            dataField="title"
            caption="Issue"
            width="300"
            cellRender={(data) => (
              <div className="tw-flex tw-items-center">
                <IssuePriorityBadge priority={data.data.priority} size="sm" />
                <span className="tw-ml-2 tw-font-medium">{data.value}</span>
              </div>
            )}
          />

          <Column
            dataField="vehicle.name"
            caption="Vehicle"
            width="150"
          />

          <Column
            dataField="status"
            caption="Status"
            width="120"
            cellRender={(data) => (
              <IssueStatusIndicator status={data.value} size="sm" />
            )}
          />

          <Column
            dataField="assignedTo"
            caption="Assigned To"
            width="150"
          />

          <Column
            dataField="createdDate"
            caption="Created"
            dataType="datetime"
            width="150"
            format="MM/dd/yyyy HH:mm"
          />

          <Column
            caption="Actions"
            width="120"
            allowSorting={false}
            allowFiltering={false}
            cellRender={(data) => (
              <div className="tw-flex tw-gap-1">
                <Button
                  icon="fa-light fa-eye"
                  hint="View Details"
                  stylingMode="text"
                  onClick={() => handleIssueView(data.data)}
                />
                <Button
                  icon="fa-light fa-edit"
                  hint="Edit Issue"
                  stylingMode="text"
                  onClick={() => handleIssueEdit(data.data)}
                />
              </div>
            )}
          />

          <Summary>
            <TotalItem
              column="title"
              summaryType="count"
              displayFormat="Total: {0} active issues"
            />
          </Summary>
        </DataGrid>
      </div>

      {/* Filters Popup */}
      <Popup
        visible={showFilters}
        onHiding={() => setShowFilters(false)}
        title="Filter Issues"
        showCloseButton={true}
        width="auto"
        height="auto"
      >
        <IssueFilters
          categories={categories}
          priorities={priorities}
          statuses={statuses}
          currentFilters={filters}
          onApplyFilters={(newFilters) => {
            dispatch(setFilters(newFilters));
            dispatch(fetchIssues(newFilters));
            setShowFilters(false);
          }}
          onClearFilters={() => {
            dispatch(setFilters({}));
            dispatch(fetchIssues({}));
            setShowFilters(false);
          }}
        />
      </Popup>

      {/* Error Display */}
      {error && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-md tw-p-4 tw-mt-4">
          <div className="tw-flex">
            <i className="fa-light fa-exclamation-triangle tw-text-red-400 tw-mr-2"></i>
            <div className="tw-text-sm tw-text-red-800">
              <h4 className="tw-font-medium">Error loading data</h4>
              <p>{error}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IssueTrackerPage;
