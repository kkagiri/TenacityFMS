//Cursor - Updated Vehicle Dashboard with improved metrics and navigation
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ScrollView from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import LoadIndicator from 'devextreme-react/load-indicator';
import './vehicles.scss';

// Components
import VehicleDataGrid from '../../components/vehicle/vehicleDataGrid';
import VehicleAddForm from '../../components/vehicle/VehicleAddForm';

// Services
import { getVehicleDashboardMetrics } from '../../dataservice';

const VehicleDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const vehicles = useSelector((state) => state.vehicle.vehicles);

  // State
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalVehicles: 0,
    onlineVehicles: 0,
    vehiclesWithIssues: 0,
    pendingVehicles: 0
  });
  const [showAddVehiclePopup, setShowAddVehiclePopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Calculate dashboard metrics from vehicle data
  const calculateMetrics = (vehicleList) => {
    const total = vehicleList.length;
    const online = vehicleList.filter(v => v.isActive === 1 && v.hasGPSInstalled === 1).length;
    const withIssues = vehicleList.filter(v => v.issuetrackers && v.issuetrackers.length > 0).length;
    const pending = vehicleList.filter(v => v.isActive === 0 || v.workingSiteId == null).length;

    return {
      totalVehicles: total,
      onlineVehicles: online,
      vehiclesWithIssues: withIssues,
      pendingVehicles: pending
    };
  };

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        // Calculate metrics from existing vehicle data
        const metrics = calculateMetrics(vehicles);
        setDashboardMetrics(metrics);
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    if (vehicles && vehicles.length >= 0) {
      loadDashboardData();
    }
  }, [vehicles]);

  // Handlers
  const handleAddVehicle = () => {
    setShowAddVehiclePopup(true);
  };

  const handleVehicleAdded = () => {
    setShowAddVehiclePopup(false);
    // Refresh will be handled by the data grid component
  };

  const handleVehicleRowClick = (e) => {
    const vehicleId = e.data.vehicleId;
    navigate(`/vehicles/${vehicleId}/details`);
  };

  // Dashboard Metrics Tiles Component
  const DashboardTiles = () => (
    <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
      {/* Total Vehicles */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-2xl tw-font-bold tw-text-gray-800">
              {isLoading ? '-' : dashboardMetrics.totalVehicles}
            </h3>
            <p className="tw-text-sm tw-text-gray-600">Total Vehicles</p>
          </div>
          <div className="tw-w-12 tw-h-12 tw-bg-blue-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-truck tw-text-2xl tw-text-blue-600"></i>
          </div>
        </div>
      </div>

      {/* Online Vehicles */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-2xl tw-font-bold tw-text-green-800">
              {isLoading ? '-' : dashboardMetrics.onlineVehicles}
            </h3>
            <p className="tw-text-sm tw-text-gray-600">Online Vehicles</p>
          </div>
          <div className="tw-w-12 tw-h-12 tw-bg-green-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-wifi tw-text-2xl tw-text-green-600"></i>
          </div>
        </div>
        <div className="tw-mt-2">
          <div className="tw-flex tw-items-center">
            <div className="tw-w-2 tw-h-2 tw-bg-green-500 tw-rounded-full tw-mr-2 tw-animate-pulse"></div>
            <span className="tw-text-xs tw-text-green-600">Live GPS Tracking</span>
          </div>
        </div>
      </div>

      {/* Vehicles with Issues */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-2xl tw-font-bold tw-text-red-800">
              {isLoading ? '-' : dashboardMetrics.vehiclesWithIssues}
            </h3>
            <p className="tw-text-sm tw-text-gray-600">With Issues</p>
          </div>
          <div className="tw-w-12 tw-h-12 tw-bg-red-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-red-600"></i>
          </div>
        </div>
        {dashboardMetrics.vehiclesWithIssues > 0 && (
          <div className="tw-mt-2">
            <span className="tw-text-xs tw-text-red-600">Requires Attention</span>
          </div>
        )}
      </div>

      {/* Pending Vehicles */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between">
          <div>
            <h3 className="tw-text-2xl tw-font-bold tw-text-yellow-800">
              {isLoading ? '-' : dashboardMetrics.pendingVehicles}
            </h3>
            <p className="tw-text-sm tw-text-gray-600">Pending Setup</p>
          </div>
          <div className="tw-w-12 tw-h-12 tw-bg-yellow-100 tw-rounded-lg tw-flex tw-items-center tw-justify-center">
            <i className="fa-light fa-clock tw-text-2xl tw-text-yellow-600"></i>
          </div>
        </div>
        {dashboardMetrics.pendingVehicles > 0 && (
          <div className="tw-mt-2">
            <span className="tw-text-xs tw-text-yellow-600">Setup Required</span>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <div className="tw-p-6">
      {/* Header Section */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <div>
          <h1 className="tw-text-3xl tw-font-bold tw-text-gray-800 tw-mb-2">
            <i className="fa-light fa-truck tw-mr-3"></i>
            Vehicle Fleet Dashboard
          </h1>
          <p className="tw-text-gray-600">Monitor and manage your vehicle fleet operations</p>
        </div>

        {/* Quick Actions */}
        <div className="tw-flex tw-gap-3">
          <Button
            text="Add Vehicle"
            icon="fa-light fa-plus"
            type="default"
            stylingMode="contained"
            onClick={handleAddVehicle}
            className="tw-bg-blue-600 tw-text-white hover:tw-bg-blue-700"
          />
          <Button
            text="Import Vehicles"
            icon="fa-light fa-upload"
            type="normal"
            stylingMode="outlined"
            className="tw-border-gray-300"
          />
          <Button
            text="Export Data"
            icon="fa-light fa-download"
            type="normal"
            stylingMode="outlined"
            className="tw-border-gray-300"
          />
        </div>
      </div>

      {/* Dashboard Metrics */}
      <DashboardTiles />

      {/* Vehicle List Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800 tw-mb-2">
            <i className="fa-light fa-list tw-mr-2"></i>
            Fleet Vehicles
          </h2>
          <p className="tw-text-sm tw-text-gray-600">
            Click on any vehicle row to view detailed information and manage settings
          </p>
        </div>

        <div className="tw-p-6">
          {isLoading ? (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
              <LoadIndicator width="32px" height="32px" visible={true} />
            </div>
          ) : (
            <VehicleDataGrid
              onRowClick={handleVehicleRowClick}
              showToolbar={false}
              enableFiltering={true}
              enablePrinting={true}
              pageSize={25}
            />
          )}
        </div>
      </div>

      {/* Add Vehicle Popup */}
      <Popup
        visible={showAddVehiclePopup}
        onHiding={() => setShowAddVehiclePopup(false)}
        dragEnabled={false}
        closeOnOutsideClick={true}
        showTitle={true}
        title="Add New Vehicle"
        width={900}
        height={700}
        className="tw-vehicle-add-popup"
      >
        <VehicleAddForm
          onSave={handleVehicleAdded}
          onCancel={() => setShowAddVehiclePopup(false)}
        />
      </Popup>
    </div>
  );
};

export default VehicleDashboard;