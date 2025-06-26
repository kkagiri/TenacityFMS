//Cursor - Created Vehicle Dashboard page with metrics tiles and enhanced data grid
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ScrollView from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import './vehicles.scss';

// Components
import VehicleDashboardTiles from '../../components/vehicle/VehicleDashboardTiles';
import VehicleDataGrid from '../../components/vehicle/vehicleDataGrid';
import VehicleAddForm from '../../components/vehicle/VehicleAddForm';

// Services
import { getVehicleDashboardMetrics } from '../../dataservice';

const VehicleDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // State
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalVehicles: 0,
    activeVehicles: 0,
    maintenanceCount: 0,
    fuelAlerts: 0
  });
  const [showAddVehiclePopup, setShowAddVehiclePopup] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load dashboard data
  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        setIsLoading(true);
        const metrics = await getVehicleDashboardMetrics();
        setDashboardMetrics(metrics);
      } catch (error) {
        console.error('Error loading dashboard metrics:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  // Handlers
  const handleAddVehicle = () => {
    setShowAddVehiclePopup(true);
  };

  const handleVehicleAdded = () => {
    setShowAddVehiclePopup(false);
    // Refresh dashboard metrics
    window.location.reload();
  };

  const handleVehicleRowClick = (rowData) => {
    navigate(`/vehicles/${rowData.data.vehicleId}/edit`);
  };

  return (
    <ScrollView className="tw-view-wrapper-scroll">
      {/* Header Section */}
      <div className="tw-flex tw-justify-between tw-items-center tw-mb-6">
        <h2 className="tw-text-2xl tw-font-semibold tw-text-gray-800">
          <i className="fa-light fa-truck tw-mr-2"></i>
          Vehicle Dashboard
        </h2>

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

      {/* Dashboard Metrics Tiles */}
      <VehicleDashboardTiles
        metrics={dashboardMetrics}
        isLoading={isLoading}
      />

      {/* Vehicle Data Grid Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-mt-6">
        <div className="tw-p-4 tw-border-b tw-border-gray-200">
          <h3 className="tw-text-lg tw-font-medium tw-text-gray-800">
            <i className="fa-light fa-list tw-mr-2"></i>
            Fleet Vehicles
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1">
            Click on any vehicle row to view details and edit information
          </p>
        </div>

        <div className="tw-p-4">
          <VehicleDataGrid
            onRowClick={handleVehicleRowClick}
            showToolbar={false} // Remove top toolbar as per requirements
            enableFiltering={true}
            enablePrinting={true}
            pageSize={20}
          />
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
        width={800}
        height={600}
        className="tw-vehicle-add-popup"
      >
        <VehicleAddForm
          onSave={handleVehicleAdded}
          onCancel={() => setShowAddVehiclePopup(false)}
        />
      </Popup>
    </ScrollView>
  );
};

export default VehicleDashboard;