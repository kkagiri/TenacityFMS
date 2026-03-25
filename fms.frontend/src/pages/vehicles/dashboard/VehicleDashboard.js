/**
 * File: VehicleDashboard.js
 * Purpose: Fleet dashboard view for vehicle KPIs, trends, and quick navigation actions.
 * Dependencies: Redux vehicleDashboard actions, DevExtreme chart/grid components, React Router, ModuleDashboard.
 * Last Modified: 2026-03-20
 *
 * Key Functions:
 * - loadDashboardData(): Loads all dashboard sections.
 * - navigateToFleet(): Opens fleet list.
 * - navigateToVehicleDetails(): Opens selected vehicle details page.
 *
 * Enhancement: Integrates ModuleDashboard for standardized widget-based dashboard
 * experience alongside existing custom fleet-specific components.
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ScrollView from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';
import { Chart, Series, ArgumentAxis, ValueAxis, Legend, Tooltip } from 'devextreme-react/chart';
import { PieChart, Series as PieSeries, Label } from 'devextreme-react/pie-chart';
import LoadIndicator from 'devextreme-react/load-indicator';
import { TabPanel, Item } from 'devextreme-react/tab-panel';
import DataGrid, { Column, Scrolling, Paging } from 'devextreme-react/data-grid';
import '../vehicles.scss';
import VehicleTripDashboardSection from './VehicleTripDashboardSection';
import ModuleDashboard from '../../../components/dashboard/ModuleDashboard';

// Actions
import {
  fetchDashboardMetrics,
  fetchStatusDistribution,
  fetchFleetUtilization,
  fetchMaintenanceAlerts,
  fetchRecentActivities,
  fetchPerformanceMetrics,
  refreshDashboardData
} from '../../../redux/actions/vehicleDashboardActions';

const VehicleDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const metrics = useSelector((state) => state.vehicleDashboard.metrics);
  const statusDistribution = useSelector((state) => state.vehicleDashboard.statusDistribution);
  const fleetUtilization = useSelector((state) => state.vehicleDashboard.fleetUtilization);
  const maintenanceAlerts = useSelector((state) => state.vehicleDashboard.maintenanceAlerts);
  const recentActivities = useSelector((state) => state.vehicleDashboard.recentActivities);
  const performanceMetrics = useSelector((state) => state.vehicleDashboard.performanceMetrics);
  const loading = useSelector((state) => state.vehicleDashboard.loading);
  const errors = useSelector((state) => state.vehicleDashboard.errors);

  // Local state
  const [selectedTab, setSelectedTab] = useState(0);
  const [refreshInterval, setRefreshInterval] = useState(null);

  // Load dashboard data on component mount
  useEffect(() => {
    loadDashboardData();

    // Set up auto-refresh every 5 minutes
    const interval = setInterval(() => {
      dispatch(refreshDashboardData());
    }, 5 * 60 * 1000);

    setRefreshInterval(interval);

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [dispatch]);

  const loadDashboardData = async () => {
    try {
      await Promise.all([
        dispatch(fetchDashboardMetrics()),
        dispatch(fetchStatusDistribution()),
        dispatch(fetchFleetUtilization()),
        dispatch(fetchMaintenanceAlerts()),
        dispatch(fetchRecentActivities()),
        dispatch(fetchPerformanceMetrics())
      ]);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }
  };

  // Handlers
  const handleRefresh = () => {
    dispatch(refreshDashboardData());
  };

  const navigateToFleet = () => {
    navigate('/vehicles/fleet');
  };

  const navigateToMaintenanceAlerts = () => {
    navigate('/vehicles/maintenance');
  };

  const navigateToTracking = () => {
    navigate('/vehicles/tracking');
  };

  const navigateToVehicleDetails = (vehicleRow) => {
    const vehicleIdentifier = vehicleRow?.vehicleId ?? vehicleRow?.id ?? vehicleRow?.VehicleId ?? vehicleRow?.vehicleID;
    if (!vehicleIdentifier) {
      return;
    }
    navigate(`/vehicles/${vehicleIdentifier}/details`);
  };

  // Dashboard Metrics Component
  const DashboardMetrics = () => (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
      {/* Total Vehicles */}
      <div className="tw-bg-gradient-to-r tw-from-blue-500 tw-to-blue-600 tw-text-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-3xl tw-font-bold">
              {loading.metrics ? '-' : metrics.totalVehicles}
            </h3>
            <p className="tw-text-blue-100 tw-font-medium">Total Vehicles</p>
          </div>
          <div className="tw-w-16 tw-h-16 tw-bg-white tw-bg-opacity-20 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-truck tw-text-3xl"></i>
          </div>
        </div>
        <div className="tw-mt-4">
          <Button
            text="Manage Fleet"
            stylingMode="text"
            className="tw-text-white tw-p-0"
            onClick={navigateToFleet}
          />
        </div>
      </div>

      {/* Active Vehicles */}
      <div className="tw-bg-gradient-to-r tw-from-green-500 tw-to-green-600 tw-text-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-3xl tw-font-bold">
              {loading.metrics ? '-' : metrics.activeVehicles}
            </h3>
            <p className="tw-text-green-100 tw-font-medium">Active Vehicles</p>
          </div>
          <div className="tw-w-16 tw-h-16 tw-bg-white tw-bg-opacity-20 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-check-circle tw-text-3xl"></i>
          </div>
        </div>
        <div className="tw-mt-4">
          <div className="tw-flex tw-items-center">
            <div className="tw-w-2 tw-h-2 tw-bg-green-200 tw-rounded-full tw-mr-2 tw-animate-pulse"></div>
            <span className="tw-text-green-100 tw-text-sm">
              {((metrics.activeVehicles / metrics.totalVehicles) * 100).toFixed(1)}% of fleet
            </span>
          </div>
        </div>
      </div>

      {/* Online/GPS Vehicles */}
      <div className="tw-bg-gradient-to-r tw-from-purple-500 tw-to-purple-600 tw-text-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-3xl tw-font-bold">
              {loading.metrics ? '-' : metrics.onlineVehicles}
            </h3>
            <p className="tw-text-purple-100 tw-font-medium">Online/GPS</p>
          </div>
          <div className="tw-w-16 tw-h-16 tw-bg-white tw-bg-opacity-20 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-location-dot tw-text-3xl"></i>
          </div>
        </div>
        <div className="tw-mt-4">
          <Button
            text="Live Tracking"
            stylingMode="text"
            className="tw-text-white tw-p-0"
            onClick={navigateToTracking}
          />
        </div>
      </div>

      {/* Maintenance Alerts */}
      <div className="tw-bg-gradient-to-r tw-from-red-500 tw-to-red-600 tw-text-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-3xl tw-font-bold">
              {loading.maintenanceAlerts ? '-' : maintenanceAlerts.length}
            </h3>
            <p className="tw-text-red-100 tw-font-medium">Maintenance Due</p>
          </div>
          <div className="tw-w-16 tw-h-16 tw-bg-white tw-bg-opacity-20 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-wrench tw-text-3xl"></i>
          </div>
        </div>
        <div className="tw-mt-4">
          <Button
            text="View Alerts"
            stylingMode="text"
            className="tw-text-white tw-p-0"
            onClick={navigateToMaintenanceAlerts}
          />
        </div>
      </div>

      {/* Fleet Health Score */}
      <div className="tw-bg-gradient-to-r tw-from-yellow-500 tw-to-yellow-600 tw-text-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-3xl tw-font-bold">
              {loading.metrics ? '-' : metrics.fleetHealthScore?.toFixed(1) || 'N/A'}
            </h3>
            <p className="tw-text-yellow-100 tw-font-medium">Fleet Health Score</p>
          </div>
          <div className="tw-w-16 tw-h-16 tw-bg-white tw-bg-opacity-20 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-heart-pulse tw-text-3xl"></i>
          </div>
        </div>
        <div className="tw-mt-4">
          <span className="tw-text-yellow-100 tw-text-sm">
            Overall health of your fleet
          </span>
        </div>
      </div>

      {/* Unassigned Vehicles */}
      <div className="tw-bg-gradient-to-r tw-from-orange-500 tw-to-orange-600 tw-text-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-3xl tw-font-bold">
              {loading.metrics ? '-' : metrics.unassignedVehicles}
            </h3>
            <p className="tw-text-orange-100 tw-font-medium">Unassigned Vehicles</p>
          </div>
          <div className="tw-w-16 tw-h-16 tw-bg-white tw-bg-opacity-20 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-user-slash tw-text-3xl"></i>
          </div>
        </div>
        <div className="tw-mt-4">
          <Button
            text="Assign Vehicles"
            stylingMode="text"
            className="tw-text-white tw-p-0"
            onClick={navigateToFleet}
          />
        </div>
      </div>
    </div>
  );

  // Fleet Performance Chart
  const FleetPerformanceChart = () => (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
      <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-4">
        <i className="fa-light fa-chart-line tw-mr-2"></i>
        Fleet Utilization Trend
      </h3>
      {loading.fleetUtilization ? (
        <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
          <LoadIndicator width="32px" height="32px" visible={true} />
        </div>
      ) : (
        <Chart dataSource={fleetUtilization.dailyUtilization || []} height={300}>
          <ArgumentAxis argumentField="date" />
          <ValueAxis />
          <Series
            valueField="utilizationRate"
            argumentField="date"
            name="Utilization Rate (%)"
            type="line"
            color="#3b82f6"
          />
          <Legend visible={false} />
          <Tooltip enabled={true} />
        </Chart>
      )}
    </div>
  );

  // Status Distribution Chart
  const StatusDistributionChart = () => (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
      <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-4">
        <i className="fa-light fa-chart-pie tw-mr-2"></i>
        Vehicle Status Distribution
      </h3>
      {loading.statusDistribution ? (
        <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
          <LoadIndicator width="32px" height="32px" visible={true} />
        </div>
      ) : (
        <PieChart
          dataSource={statusDistribution}
          height={300}
          innerRadius={0.3}
        >
          <PieSeries
            argumentField="status"
            valueField="count"
          >
            <Label visible={true} format="percent" />
          </PieSeries>
          <Legend
            orientation="horizontal"
            itemTextPosition="right"
            horizontalAlignment="center"
            verticalAlignment="bottom"
          />
          <Tooltip enabled={true} />
        </PieChart>
      )}
    </div>
  );

  // Maintenance Alerts Table
  // Moved to MaintenanceAlertsPage.js

  // Recent Activities
  const RecentActivitiesTable = () => (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
      <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-4">
        <i className="fa-light fa-clock tw-mr-2"></i>
        Recent Fleet Activities
      </h3>
      {loading.recentActivities ? (
        <div className="tw-flex tw-justify-center tw-items-center tw-h-32">
          <LoadIndicator width="24px" height="24px" visible={true} />
        </div>
      ) : (
        <div className="tw-space-y-3 tw-max-h-64 tw-overflow-y-auto">
          {Array.isArray(recentActivities) && recentActivities.slice(0, 8).map((activity, index) => (
            <div key={index} className="tw-flex tw-items-center tw-justify-between tw-p-3 tw-bg-gray-50 tw-rounded-lg">
              <div className="tw-flex tw-items-center">
                <div className="tw-w-8 tw-h-8 tw-bg-blue-100 tw-rounded-full tw-flex tw-items-center tw-justify-center tw-mr-3">
                  <i className="fa-light fa-info tw-text-blue-600 tw-text-sm"></i>
                </div>
                <div>
                  <p className="tw-text-sm tw-font-medium tw-text-gray-800">
                    {activity.vehicleName} - {activity.activityType}
                  </p>
                  <p className="tw-text-xs tw-text-gray-600">{activity.description}</p>
                </div>
              </div>
              <div className="tw-text-xs tw-text-gray-500">
                {new Date(activity.timestamp).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // Vehicle Performance Details Table
  const VehiclePerformanceDetailsTable = () => (
    <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
      <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-4">
        <i className="fa-light fa-gauge-high tw-mr-2"></i>
        Individual Vehicle Performance
      </h3>
      {loading.performanceMetrics ? (
        <div className="tw-flex tw-justify-center tw-items-center tw-h-32">
          <LoadIndicator width="24px" height="24px" visible={true} />
        </div>
      ) : (
        <DataGrid
          dataSource={performanceMetrics.vehicleDetails || []}
          showBorders={true}
          rowAlternationEnabled={true}
          columnAutoWidth={true}
          hoverStateEnabled={true}
          onRowClick={(event) => navigateToVehicleDetails(event?.data)}
        >
          <Scrolling mode="standard" />
          <Paging defaultPageSize={5} />

          <Column dataField="vehicleName" caption="Vehicle" minWidth={150} />
          <Column dataField="plateNumber" caption="Plate No." minWidth={120} />
          <Column
            dataField="fuelEfficiency"
            caption="Fuel Eff. (km/l)"
            dataType="number"
            format="fixedPoint"
            precision={2}
            minWidth={150}
          />
          <Column
            dataField="distanceTraveled"
            caption="Distance (km)"
            dataType="number"
            format="fixedPoint"
            precision={0}
            minWidth={120}
          />
          <Column
            dataField="averageSpeed"
            caption="Avg Speed (km/h)"
            dataType="number"
            format="fixedPoint"
            precision={1}
            minWidth={120}
          />
          <Column
            dataField="idleTime"
            caption="Idle Time (hrs)"
            dataType="number"
            format="fixedPoint"
            precision={1}
            minWidth={120}
          />
          <Column
            dataField="safetyScore"
            caption="Safety Score"
            dataType="number"
            minWidth={100}
            cellRender={(cellData) => (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${cellData.value >= 80 ? 'tw-bg-green-100 tw-text-green-800' :
                cellData.value >= 60 ? 'tw-bg-yellow-100 tw-text-yellow-800' :
                  'tw-bg-red-100 tw-text-red-800'
                }`}>
                {cellData.value}
              </span>
            )}
          />
          <Column
            dataField="performanceScore"
            caption="Perf. Score"
            dataType="number"
            minWidth={100}
            cellRender={(cellData) => (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${cellData.value >= 80 ? 'tw-bg-green-100 tw-text-green-800' :
                cellData.value >= 60 ? 'tw-bg-yellow-100 tw-text-yellow-800' :
                  'tw-bg-red-100 tw-text-red-800'
                }`}>
                {cellData.value}
              </span>
            )}
          />
        </DataGrid>
      )}
    </div>
  );

  return (
    <div className="tw-p-6">
      {/* Header Section */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <div>

        </div>

      </div>

      {/* Standardized Widget Dashboard */}
      <div className="tw-mb-8">
        <ModuleDashboard
          moduleId="vehicle"
          title="Vehicle Fleet Dashboard"
          icon="fa-solid fa-truck"
          subtitle="Widget-based fleet analytics — add, resize, and rearrange widgets"
          enableRealtime={true}
        />
      </div>

      {/* Legacy Dashboard Metrics */}
      <DashboardMetrics />

      <VehicleTripDashboardSection />

      {/* Main Content */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6 tw-mb-6">
        <FleetPerformanceChart />
        <StatusDistributionChart />
      </div>

      {/* Secondary Content */}
      <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
        {/* <MaintenanceAlertsTable /> */}
        <RecentActivitiesTable />
        <VehiclePerformanceDetailsTable />
      </div>

      {/* Performance Metrics Summary */}
      {performanceMetrics && (
        <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-mt-6">
          <h3 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-4">
            <i className="fa-light fa-gauge tw-mr-2"></i>
            Fleet Performance Summary
          </h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4">
            <div className="tw-text-center tw-p-4 tw-bg-gray-50 tw-rounded-lg">
              <p className="tw-text-2xl tw-font-bold tw-text-gray-800">
                {loading.performanceMetrics ? '-' : performanceMetrics.fuelEfficiency?.toFixed(2) || '0'}
              </p>
              <p className="tw-text-sm tw-text-gray-600">Avg Fuel Efficiency (km/l)</p>
            </div>
            <div className="tw-text-center tw-p-4 tw-bg-gray-50 tw-rounded-lg">
              <p className="tw-text-2xl tw-font-bold tw-text-gray-800">
                {loading.performanceMetrics ? '-' : performanceMetrics.totalDistance?.toFixed(0) || '0'}
              </p>
              <p className="tw-text-sm tw-text-gray-600">Total Distance (km)</p>
            </div>
            <div className="tw-text-center tw-p-4 tw-bg-gray-50 tw-rounded-lg">
              <p className="tw-text-2xl tw-font-bold tw-text-gray-800">
                {loading.performanceMetrics ? '-' : performanceMetrics.averageSpeed?.toFixed(1) || '0'}
              </p>
              <p className="tw-text-sm tw-text-gray-600">Avg Speed (km/h)</p>
            </div>
            <div className="tw-text-center tw-p-4 tw-bg-gray-50 tw-rounded-lg">
              <p className="tw-text-2xl tw-font-bold tw-text-gray-800">
                {loading.performanceMetrics ? '-' : `${(metrics.averageUtilization || 0).toFixed(1)}%`}
              </p>
              <p className="tw-text-sm tw-text-gray-600">Fleet Utilization</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default VehicleDashboard;