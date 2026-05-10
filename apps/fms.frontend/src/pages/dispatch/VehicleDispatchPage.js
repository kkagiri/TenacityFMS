import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, Button, SelectBox, LoadIndicator } from 'devextreme-react';
import { Column, Paging, SearchPanel, Selection } from 'devextreme-react/data-grid';
import { notify } from 'devextreme/ui/notify';

import vehicleGPSTrackingService from '../services/vehicleGPSTrackingService';
import { DispatchModuleIntegration, GPSErrorHandler } from '../examples/vehicleGPSIntegrationExamples';

/**
 * Vehicle Dispatch Page Component
 * Example of integrating GPS tracking into existing FMS dispatch functionality
 */
const VehicleDispatchPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedVehicles, setSelectedVehicles] = useState([]);
  const [gpsStatus, setGpsStatus] = useState({ connected: false, lastChecked: null });
  const [filterOption, setFilterOption] = useState('available');

  const filterOptions = [
    { value: 'all', text: 'All GPS Vehicles' },
    { value: 'available', text: 'Available for Dispatch' },
    { value: 'online', text: 'Online Only' },
    { value: 'moving', text: 'Currently Moving' }
  ];

  // Load vehicles based on filter
  const loadVehicles = useCallback(async () => {
    setLoading(true);
    try {
      let vehicleData = [];

      switch (filterOption) {
        case 'available':
          vehicleData = await DispatchModuleIntegration.getAvailableVehiclesForDispatch();
          break;
        case 'online':
          const onlineResponse = await vehicleGPSTrackingService.getAllVehicleLocations(true, true);
          if (onlineResponse.isSuccess) {
            vehicleData = onlineResponse.data.map(v => formatVehicleForDisplay(v));
          }
          break;
        case 'moving':
          const allResponse = await vehicleGPSTrackingService.getAllVehicleLocations(false, true);
          if (allResponse.isSuccess) {
            vehicleData = allResponse.data
              .filter(v => v.isMoving)
              .map(v => formatVehicleForDisplay(v));
          }
          break;
        default: // 'all'
          const response = await vehicleGPSTrackingService.getAllVehicleLocations(false, true);
          if (response.isSuccess) {
            vehicleData = response.data.map(v => formatVehicleForDisplay(v));
          }
          break;
      }

      setVehicles(vehicleData);
    } catch (error) {
      GPSErrorHandler.handleGPSError(error, 'loading vehicles');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, [filterOption]);

  // Check GPS system status
  const checkGPSStatus = useCallback(async () => {
    try {
      const status = await vehicleGPSTrackingService.getConnectionStatus();
      setGpsStatus({
        connected: status.isSuccess && status.data,
        lastChecked: new Date()
      });

      if (!status.isSuccess) {
        notify('GPS system is offline', 'warning', 3000);
      }
    } catch (error) {
      setGpsStatus({ connected: false, lastChecked: new Date() });
      GPSErrorHandler.handleGPSError(error, 'checking GPS status');
    }
  }, []);

  // Format vehicle data for display
  const formatVehicleForDisplay = (vehicle) => ({
    vehicleId: vehicle.vehicleId,
    vehicleName: vehicle.vehicleName,
    numberPlate: vehicle.numberPlate,
    status: vehicle.isOnline ? 'Online' : 'Offline',
    location: vehicle.latitude && vehicle.longitude
      ? `${vehicle.latitude.toFixed(4)}, ${vehicle.longitude.toFixed(4)}`
      : 'Location unavailable',
    speed: vehicle.speed ? `${vehicle.speed.toFixed(1)} km/h` : '0 km/h',
    lastUpdated: new Date(vehicle.lastUpdated).toLocaleString(),
    isMoving: vehicle.isMoving || false,
    canDispatch: vehicle.isOnline && !vehicle.isMoving,
    address: vehicle.address || 'Address not available'
  });

  // Handle vehicle dispatch
  const handleDispatchVehicles = async () => {
    if (selectedVehicles.length === 0) {
      notify('Please select at least one vehicle', 'warning', 2000);
      return;
    }

    try {
      // Here you would integrate with your existing dispatch logic
      // For now, we'll just show the selected vehicles
      const vehicleInfo = selectedVehicles.map(id => {
        const vehicle = vehicles.find(v => v.vehicleId === id);
        return `${vehicle.vehicleName} (${vehicle.numberPlate})`;
      }).join(', ');

      notify(`Dispatching vehicles: ${vehicleInfo}`, 'success', 3000);

      // TODO: Integrate with your dispatch creation logic here
      // Example: await dispatchService.createDispatch(selectedVehicles, destination);

    } catch (error) {
      GPSErrorHandler.handleGPSError(error, 'dispatching vehicles');
    }
  };

  // Get location details for selected vehicle
  const handleViewLocation = async (vehicleId) => {
    try {
      const locationData = await DispatchModuleIntegration.getVehicleForDispatch(vehicleId);

      if (locationData) {
        // Here you could open a map modal or navigate to a detailed view
        notify(`Vehicle Location: ${locationData.currentLocation.address || 'Address not available'}`, 'info', 4000);

        // TODO: Integrate with your map component
        // Example: openMapModal(locationData.currentLocation);
      }
    } catch (error) {
      GPSErrorHandler.handleGPSError(error, 'getting vehicle location');
    }
  };

  // Component lifecycle
  useEffect(() => {
    checkGPSStatus();
    loadVehicles();
  }, [checkGPSStatus, loadVehicles]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      loadVehicles();
    }, 30000);

    return () => clearInterval(interval);
  }, [loadVehicles]);

  // Render status cell with color coding
  const renderStatusCell = (cellData) => {
    const status = cellData.value;
    const className = status === 'Online' ? 'tw-text-green-600' : 'tw-text-red-600';
    return <span className={className}>{status}</span>;
  };

  // Render action buttons
  const renderActionButtons = (cellData) => {
    const vehicleId = cellData.data.vehicleId;
    return (
      <div className="tw-space-x-2">
        <Button
          text="View Location"
          type="default"
          onClick={() => handleViewLocation(vehicleId)}
          disabled={!cellData.data.canDispatch}
        />
      </div>
    );
  };

  return (
    <div className="tw-p-6">
      {/* Header */}
      <div className="tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Vehicle Dispatch - GPS Tracking</h2>

        {/* GPS Status Indicator */}
        <div className="tw-flex tw-items-center tw-mb-4">
          <div className={`tw-w-3 tw-h-3 tw-rounded-full tw-mr-2 ${
            gpsStatus.connected ? 'tw-bg-green-500' : 'tw-bg-red-500'
          }`} />
          <span className="tw-text-sm tw-text-gray-600">
            GPS System: {gpsStatus.connected ? 'Connected' : 'Offline'}
            {gpsStatus.lastChecked && (
              <span className="tw-ml-2">
                (Last checked: {gpsStatus.lastChecked.toLocaleTimeString()})
              </span>
            )}
          </span>
          <Button
            icon="refresh"
            type="default"
            onClick={checkGPSStatus}
            className="tw-ml-4"
            hint="Refresh GPS Status"
          />
        </div>

        {/* Controls */}
        <div className="tw-flex tw-items-center tw-space-x-4 tw-mb-4">
          <SelectBox
            items={filterOptions}
            value={filterOption}
            onValueChanged={(e) => setFilterOption(e.value)}
            displayExpr="text"
            valueExpr="value"
            width={200}
          />

          <Button
            icon="refresh"
            text="Refresh"
            type="default"
            onClick={loadVehicles}
            disabled={loading}
          />

          <Button
            icon="runner"
            text={`Dispatch Selected (${selectedVehicles.length})`}
            type="success"
            onClick={handleDispatchVehicles}
            disabled={selectedVehicles.length === 0 || loading}
          />
        </div>
      </div>

      {/* Vehicle Grid */}
      <div className="tw-relative">
        {loading && (
          <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-10">
            <LoadIndicator visible={true} />
          </div>
        )}

        <DataGrid
          dataSource={vehicles}
          keyExpr="vehicleId"
          selection={{ mode: 'multiple' }}
          onSelectionChanged={(e) => setSelectedVehicles(e.selectedRowKeys)}
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          showBorders={true}
          rowAlternationEnabled={true}
        >
          <SearchPanel visible={true} width={300} placeholder="Search vehicles..." />
          <Selection mode="multiple" />
          <Paging defaultPageSize={20} />

          <Column
            dataField="vehicleName"
            caption="Vehicle Name"
            width={150}
          />

          <Column
            dataField="numberPlate"
            caption="Number Plate"
            width={120}
          />

          <Column
            dataField="status"
            caption="Status"
            width={80}
            cellRender={renderStatusCell}
          />

          <Column
            dataField="location"
            caption="Current Location"
            width={200}
          />

          <Column
            dataField="speed"
            caption="Speed"
            width={80}
            alignment="right"
          />

          <Column
            dataField="lastUpdated"
            caption="Last Updated"
            width={150}
            dataType="datetime"
          />

          <Column
            dataField="canDispatch"
            caption="Available"
            width={80}
            dataType="boolean"
          />

          <Column
            caption="Actions"
            width={120}
            allowSorting={false}
            cellRender={renderActionButtons}
          />
        </DataGrid>
      </div>

      {/* Summary Info */}
      <div className="tw-mt-4 tw-text-sm tw-text-gray-600">
        <span>Total Vehicles: {vehicles.length}</span>
        <span className="tw-ml-4">
          Available: {vehicles.filter(v => v.canDispatch).length}
        </span>
        <span className="tw-ml-4">
          Moving: {vehicles.filter(v => v.isMoving).length}
        </span>
      </div>
    </div>
  );
};

export default VehicleDispatchPage;
