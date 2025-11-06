import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Chart, PieChart, DataGrid, LoadIndicator } from 'devextreme-react';
import { Series, Label, Connector, Size, Export, Legend, Tooltip } from 'devextreme-react/chart';
import { Column, Paging } from 'devextreme-react/data-grid';
import { fetchMaintenanceDashboard } from '../../../redux/actions/maintenanceActions';

const MaintenanceDashboard = () => {
  const dispatch = useDispatch();
  const { dashboard, loading, error } = useSelector((state) => state.maintenance);
  const [selectedView, setSelectedView] = useState('overview');

  useEffect(() => {
    dispatch(fetchMaintenanceDashboard());
  }, [dispatch]);

  if (loading.dashboard) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
        <LoadIndicator visible={true} />
      </div>
    );
  }

  if (error.dashboard) {
    return (
      <div className="tw-p-6">
        <div className="tw-bg-red-100 tw-border tw-border-red-400 tw-text-red-700 tw-px-4 tw-py-3 tw-rounded">
          <strong>Error:</strong> {error.dashboard}
        </div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  // Status distribution data for chart
  const statusData = [
    { status: 'Up to Date', count: dashboard.upToDateCount, color: '#10b981' },
    { status: 'Due Soon', count: dashboard.dueSoonCount, color: '#f59e0b' },
    { status: 'Overdue', count: dashboard.overdueCount, color: '#ef4444' },
    { status: 'In Progress', count: dashboard.inProgressCount, color: '#3b82f6' },
  ];

  return (
    <div className="tw-p-6 tw-bg-gray-50 tw-min-h-screen">
      {/* Header */}
      <div className="tw-mb-6">
        <h1 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mb-2">
          Vehicle Maintenance Dashboard
        </h1>
        <p className="tw-text-gray-600">
          Monitor and manage vehicle maintenance schedules and activities
        </p>
      </div>

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
        <div className="tw-bg-green-50 tw-border-l-4 tw-border-green-500 tw-p-6 tw-rounded-lg tw-shadow">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-green-600 tw-text-sm tw-font-medium tw-uppercase">Up to Date</p>
              <h3 className="tw-text-4xl tw-font-bold tw-text-green-700 tw-mt-2">
                {dashboard.upToDateCount}
              </h3>
            </div>
            <i className="fa-light fa-check-circle tw-text-5xl tw-text-green-500"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-border-l-4 tw-border-yellow-500 tw-p-6 tw-rounded-lg tw-shadow">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-yellow-600 tw-text-sm tw-font-medium tw-uppercase">Due Soon</p>
              <h3 className="tw-text-4xl tw-font-bold tw-text-yellow-700 tw-mt-2">
                {dashboard.dueSoonCount}
              </h3>
            </div>
            <i className="fa-light fa-clock tw-text-5xl tw-text-yellow-500"></i>
          </div>
        </div>

        <div className="tw-bg-red-50 tw-border-l-4 tw-border-red-500 tw-p-6 tw-rounded-lg tw-shadow">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-red-600 tw-text-sm tw-font-medium tw-uppercase">Overdue</p>
              <h3 className="tw-text-4xl tw-font-bold tw-text-red-700 tw-mt-2">
                {dashboard.overdueCount}
              </h3>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-5xl tw-text-red-500"></i>
          </div>
        </div>

        <div className="tw-bg-blue-50 tw-border-l-4 tw-border-blue-500 tw-p-6 tw-rounded-lg tw-shadow">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-blue-600 tw-text-sm tw-font-medium tw-uppercase">In Progress</p>
              <h3 className="tw-text-4xl tw-font-bold tw-text-blue-700 tw-mt-2">
                {dashboard.inProgressCount}
              </h3>
            </div>
            <i className="fa-light fa-wrench tw-text-5xl tw-text-blue-500"></i>
          </div>
        </div>
      </div>

      {/* Cost Summary */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-6 tw-mb-8">
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <p className="tw-text-gray-600 tw-text-sm tw-font-medium tw-uppercase">This Month Cost</p>
          <h3 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
            ${dashboard.totalCostThisMonth?.toLocaleString() || 0}
          </h3>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
            {dashboard.completedThisMonthCount} completed
          </p>
        </div>

        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <p className="tw-text-gray-600 tw-text-sm tw-font-medium tw-uppercase">This Year Cost</p>
          <h3 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
            ${dashboard.totalCostThisYear?.toLocaleString() || 0}
          </h3>
        </div>

        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <p className="tw-text-gray-600 tw-text-sm tw-font-medium tw-uppercase">Average Cost</p>
          <h3 className="tw-text-3xl tw-font-bold tw-text-gray-900 tw-mt-2">
            ${dashboard.averageCostPerMaintenance?.toFixed(2) || 0}
          </h3>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">Per maintenance</p>
        </div>
      </div>

      {/* Charts Row */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-8">
        {/* Status Distribution Pie Chart */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            Status Distribution
          </h3>
          <PieChart
            dataSource={statusData}
            palette="Soft"
            title="Maintenance Status"
          >
            <Series argumentField="status" valueField="count">
              <Label visible={true}>
                <Connector visible={true} width={1} />
              </Label>
            </Series>
            <Size height={300} />
            <Legend visible={true} />
            <Export enabled={true} />
          </PieChart>
        </div>

        {/* Maintenance by Type */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            Maintenance by Type
          </h3>
          {dashboard.maintenanceByType && dashboard.maintenanceByType.length > 0 ? (
            <Chart
              dataSource={dashboard.maintenanceByType}
              title="Maintenance Types"
            >
              <Series
                valueField="count"
                argumentField="maintenanceType"
                name="Count"
                type="bar"
                color="#3b82f6"
              />
              <Size height={300} />
              <Tooltip enabled={true} />
              <Export enabled={true} />
            </Chart>
          ) : (
            <div className="tw-text-center tw-text-gray-500 tw-py-12">
              No maintenance data available
            </div>
          )}
        </div>
      </div>

      {/* Upcoming and Overdue Tables */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        {/* Upcoming Maintenance */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            Upcoming Maintenance (Next 30 Days)
          </h3>
          {dashboard.upcomingMaintenance && dashboard.upcomingMaintenance.length > 0 ? (
            <DataGrid
              dataSource={dashboard.upcomingMaintenance}
              keyExpr="maintenanceId"
              showBorders={true}
              columnAutoWidth={true}
            >
              <Column dataField="vehicleName" caption="Vehicle" width={120} />
              <Column dataField="maintenanceType" caption="Type" width={150} />
              <Column
                dataField="daysUntilDue"
                caption="Days Until Due"
                width={120}
                cellRender={(cellData) => (
                  <span className={`tw-font-semibold ${
                    cellData.value <= 7 ? 'tw-text-red-600' : 'tw-text-yellow-600'
                  }`}>
                    {cellData.value}
                  </span>
                )}
              />
              <Paging enabled={false} />
            </DataGrid>
          ) : (
            <div className="tw-text-center tw-text-gray-500 tw-py-8">
              No upcoming maintenance
            </div>
          )}
        </div>

        {/* Overdue Maintenance */}
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            Overdue Maintenance
          </h3>
          {dashboard.overdueMaintenance && dashboard.overdueMaintenance.length > 0 ? (
            <DataGrid
              dataSource={dashboard.overdueMaintenance}
              keyExpr="maintenanceId"
              showBorders={true}
              columnAutoWidth={true}
            >
              <Column dataField="vehicleName" caption="Vehicle" width={120} />
              <Column dataField="maintenanceType" caption="Type" width={150} />
              <Column
                dataField="daysOverdue"
                caption="Days Overdue"
                width={120}
                cellRender={(cellData) => (
                  <span className="tw-font-semibold tw-text-red-600">
                    {cellData.value}
                  </span>
                )}
              />
              <Column
                dataField="priority"
                caption="Priority"
                width={100}
                cellRender={(cellData) => {
                  const priorityColors = {
                    1: 'tw-bg-gray-100 tw-text-gray-800',
                    2: 'tw-bg-blue-100 tw-text-blue-800',
                    3: 'tw-bg-yellow-100 tw-text-yellow-800',
                    4: 'tw-bg-red-100 tw-text-red-800',
                  };
                  return (
                    <span className={`tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-semibold ${priorityColors[cellData.value] || ''}`}>
                      {cellData.value}
                    </span>
                  );
                }}
              />
              <Paging enabled={false} />
            </DataGrid>
          ) : (
            <div className="tw-text-center tw-text-gray-500 tw-py-8">
              No overdue maintenance
            </div>
          )}
        </div>
      </div>

      {/* Monthly Trend */}
      {dashboard.monthlyTrend && dashboard.monthlyTrend.length > 0 && (
        <div className="tw-bg-white tw-p-6 tw-rounded-lg tw-shadow tw-mt-6">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-900 tw-mb-4">
            Monthly Maintenance Trend
          </h3>
          <Chart
            dataSource={dashboard.monthlyTrend}
            title="Last 12 Months"
          >
            <Series
              valueField="count"
              argumentField="monthName"
              name="Maintenance Count"
              type="line"
              color="#3b82f6"
            />
            <Size height={300} />
            <Tooltip enabled={true} />
            <Legend visible={true} />
            <Export enabled={true} />
          </Chart>
        </div>
      )}
    </div>
  );
};

export default MaintenanceDashboard;
