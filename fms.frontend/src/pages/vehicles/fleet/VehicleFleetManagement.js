//Vehicle Fleet Management - Separate page for vehicle data grid
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import ScrollView from 'devextreme-react/scroll-view';
import Button from 'devextreme-react/button';
import { Popup } from 'devextreme-react/popup';
import LoadIndicator from 'devextreme-react/load-indicator';
import { DropDownBox } from 'devextreme-react/drop-down-box';
import { TextBox } from 'devextreme-react/text-box';
import '../vehicles.scss';

// Components
import VehicleDataGrid from './VehicleDataGrid';
import VehicleAddForm from './VehicleAddForm';

// Actions
import { getVehicleList } from '../../../redux/actions/vehicleActions';

const VehicleFleetManagement = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const loading = useSelector((state) => state.vehicle.loading);

  // State
  const [showAddVehiclePopup, setShowAddVehiclePopup] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [filterValue, setFilterValue] = useState('all');
  const [selectedVehicles, setSelectedVehicles] = useState([]);

  // Filter options
  const filterOptions = [
    { value: 'all', text: 'All Vehicles' },
    { value: 'active', text: 'Active Vehicles' },
    { value: 'inactive', text: 'Inactive Vehicles' },
    { value: 'gps_enabled', text: 'GPS Enabled' },
    { value: 'maintenance_due', text: 'Maintenance Due' },
    { value: 'unassigned', text: 'Unassigned' }
  ];

  // Load vehicles on component mount
  useEffect(() => {
    if (!vehicles || vehicles.length === 0) {
      dispatch(getVehicleList());
    }
  }, [dispatch, vehicles]);

  // Handlers
  const handleAddVehicle = () => {
    setShowAddVehiclePopup(true);
  };

  const handleVehicleAdded = () => {
    setShowAddVehiclePopup(false);
    dispatch(getVehicleList()); // Refresh the list
  };

  const handleVehicleRowClick = (e) => {
    const vehicleId = e.data.vehicleId;
    navigate(`/vehicles/${vehicleId}/details`);
  };

  const handleBulkAction = (action) => {
    if (selectedVehicles.length === 0) {
      return;
    }

    switch (action) {
      case 'activate':
        // Handle bulk activation
        console.log('Activating vehicles:', selectedVehicles);
        break;
      case 'deactivate':
        // Handle bulk deactivation
        console.log('Deactivating vehicles:', selectedVehicles);
        break;
      case 'delete':
        // Handle bulk deletion
        console.log('Deleting vehicles:', selectedVehicles);
        break;
      case 'export':
        // Handle export
        console.log('Exporting vehicles:', selectedVehicles);
        break;
      default:
        break;
    }
  };

  const handleRefresh = () => {
    dispatch(getVehicleList());
  };

  const handleImportVehicles = () => {
    // Handle vehicle import
    console.log('Import vehicles functionality');
  };

  const handleExportAll = () => {
    // Handle export all vehicles
    console.log('Export all vehicles functionality');
  };

  // Quick stats calculation
  const getQuickStats = () => {
    if (!vehicles || vehicles.length === 0) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        gpsEnabled: 0
      };
    }

    return {
      total: vehicles.length,
      active: vehicles.filter(v => v.isActive === 1).length,
      inactive: vehicles.filter(v => v.isActive === 0).length,
      gpsEnabled: vehicles.filter(v => v.hasGPSInstalled === 1).length
    };
  };

  const stats = getQuickStats();

  return (
    <div className="tw-p-6">
      {/* Header Section */}
      <div className="tw-mb-6">
        <div className="tw-flex tw-justify-between tw-items-start tw-mb-4">
          <div>
            <h1 className="tw-text-3xl tw-font-bold tw-text-gray-800 tw-mb-2">
              <i className="fa-light fa-cars tw-mr-3"></i>
              Fleet Management
            </h1>
            <p className="tw-text-gray-600">
              Manage and monitor all vehicles in your fleet
            </p>
          </div>

          {/* Action Buttons */}
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
              text="Import"
              icon="fa-light fa-upload"
              type="normal"
              stylingMode="outlined"
              onClick={handleImportVehicles}
              className="tw-border-gray-300"
            />
            <Button
              text="Export All"
              icon="fa-light fa-download"
              type="normal"
              stylingMode="outlined"
              onClick={handleExportAll}
              className="tw-border-gray-300"
            />
            <Button
              text="Refresh"
              icon="fa-light fa-refresh"
              type="normal"
              stylingMode="outlined"
              onClick={handleRefresh}
              className="tw-border-gray-300"
            />
          </div>
        </div>

        {/* Quick Stats */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mb-6">
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <p className="tw-text-blue-600 tw-text-sm tw-font-medium">Total Vehicles</p>
                <p className="tw-text-2xl tw-font-bold tw-text-blue-800">{stats.total}</p>
              </div>
              <i className="fa-light fa-truck tw-text-2xl tw-text-blue-600"></i>
            </div>
          </div>

          <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <p className="tw-text-green-600 tw-text-sm tw-font-medium">Active</p>
                <p className="tw-text-2xl tw-font-bold tw-text-green-800">{stats.active}</p>
              </div>
              <i className="fa-light fa-check-circle tw-text-2xl tw-text-green-600"></i>
            </div>
          </div>

          <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <p className="tw-text-red-600 tw-text-sm tw-font-medium">Inactive</p>
                <p className="tw-text-2xl tw-font-bold tw-text-red-800">{stats.inactive}</p>
              </div>
              <i className="fa-light fa-times-circle tw-text-2xl tw-text-red-600"></i>
            </div>
          </div>

          <div className="tw-bg-purple-50 tw-border tw-border-purple-200 tw-rounded-lg tw-p-4">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <p className="tw-text-purple-600 tw-text-sm tw-font-medium">GPS Enabled</p>
                <p className="tw-text-2xl tw-font-bold tw-text-purple-800">{stats.gpsEnabled}</p>
              </div>
              <i className="fa-light fa-location-dot tw-text-2xl tw-text-purple-600"></i>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-mb-6">
        <div className="tw-p-4 tw-border-b tw-border-gray-200">
          <div className="tw-flex tw-flex-wrap tw-gap-4 tw-items-center tw-justify-between">
            <div className="tw-flex tw-gap-4 tw-items-center">
              <div className="tw-w-64">
                <TextBox
                  placeholder="Search vehicles..."
                  value={searchValue}
                  onValueChanged={(e) => setSearchValue(e.value)}
                  showClearButton={true}
                >
                  <i className="fa-light fa-search tw-text-gray-400" slot="before" />
                </TextBox>
              </div>

              <div className="tw-w-48">
                <DropDownBox
                  value={filterValue}
                  displayExpr="text"
                  valueExpr="value"
                  dataSource={filterOptions}
                  onValueChanged={(e) => setFilterValue(e.value)}
                  placeholder="Filter by status"
                />
              </div>
            </div>

            {/* Bulk Actions */}
            {selectedVehicles.length > 0 && (
              <div className="tw-flex tw-gap-2">
                <span className="tw-text-sm tw-text-gray-600 tw-self-center">
                  {selectedVehicles.length} selected
                </span>
                <Button
                  text="Activate"
                  icon="fa-light fa-check"
                  type="normal"
                  stylingMode="outlined"
                  onClick={() => handleBulkAction('activate')}
                  className="tw-border-green-300 tw-text-green-600"
                />
                <Button
                  text="Deactivate"
                  icon="fa-light fa-times"
                  type="normal"
                  stylingMode="outlined"
                  onClick={() => handleBulkAction('deactivate')}
                  className="tw-border-yellow-300 tw-text-yellow-600"
                />
                <Button
                  text="Export"
                  icon="fa-light fa-download"
                  type="normal"
                  stylingMode="outlined"
                  onClick={() => handleBulkAction('export')}
                  className="tw-border-blue-300 tw-text-blue-600"
                />
                <Button
                  text="Delete"
                  icon="fa-light fa-trash"
                  type="normal"
                  stylingMode="outlined"
                  onClick={() => handleBulkAction('delete')}
                  className="tw-border-red-300 tw-text-red-600"
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Vehicle Data Grid */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
        <div className="tw-p-6 tw-border-b tw-border-gray-200">
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
            <i className="fa-light fa-table tw-mr-2"></i>
            Vehicle Fleet List
          </h2>
        </div>

        <div className="tw-p-6">
          {loading ? (
            <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
              <LoadIndicator width="32px" height="32px" visible={true} />
            </div>
          ) : (
            <VehicleDataGrid
              onRowClick={handleVehicleRowClick}
              onSelectionChanged={setSelectedVehicles}
              showToolbar={true}
              enableFiltering={true}
              enablePrinting={true}
              enableExporting={true}
              enableSelection={true}
              pageSize={50}
              searchValue={searchValue}
              filterValue={filterValue}
              allowColumnReordering={true}
              allowColumnResizing={true}
              showBorders={true}
              columnAutoWidth={true}
            />
          )}
        </div>
      </div>

      {/* Add Vehicle Popup */}
      <Popup
        visible={showAddVehiclePopup}
        onHiding={() => setShowAddVehiclePopup(false)}
        dragEnabled={false}
        showCloseButton
        ={true}
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

export default VehicleFleetManagement;