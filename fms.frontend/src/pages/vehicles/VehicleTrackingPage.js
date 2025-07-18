import React, { useEffect, useState } from 'react';
import { LoadPanel } from 'devextreme-react/load-panel';
import { DataGrid, Column, Paging, FilterRow, HeaderFilter } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { SelectBox } from 'devextreme-react/select-box';
import { DateBox } from 'devextreme-react/date-box';
import { useVehicleTracking } from '../../hooks/useVehicleTracking';

const VehicleTrackingPage = () => {
  const {
    vehicles,
    selectedVehicle,
    setSelectedVehicle,
    trackHistory,
    loading,
    error,
    liveTrackingActive,
    loadVehicles,
    getVehicleLocation,
    getTrackHistory,
    startLiveTracking,
    stopLiveTracking
  } = useVehicleTracking();

  const [fromDate, setFromDate] = useState(new Date(Date.now() - 24 * 60 * 60 * 1000)); // 24 hours ago
  const [toDate, setToDate] = useState(new Date());

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleVehicleSelect = (vehicleId) => {
    const vehicle = vehicles.find(v => v.vehicleId === vehicleId);
    setSelectedVehicle(vehicle);
  };

  const handleStartLiveTracking = () => {
    if (selectedVehicle) {
      startLiveTracking(selectedVehicle.vehicleId);
    }
  };

  const handleLoadTrackHistory = async () => {
    if (selectedVehicle) {
      await getTrackHistory(selectedVehicle.vehicleId, fromDate, toDate);
    }
  };

  const getStatusBadge = (gpsData) => {
    if (!gpsData) return 'tw-bg-gray-100 tw-text-gray-600';

    switch (gpsData.status) {
      case 'online':
        return 'tw-bg-green-100 tw-text-green-700';
      case 'offline':
        return 'tw-bg-red-100 tw-text-red-700';
      default:
        return 'tw-bg-yellow-100 tw-text-yellow-700';
    }
  };

  const formatLastUpdate = (timestamp) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleString();
  };

  // Calculate statistics
  const onlineVehicles = vehicles.filter(v => v.gpsData?.status === 'online').length;
  const totalVehicles = vehicles.length;
  const inTransit = vehicles.filter(v => v.gpsData?.speed > 5).length; // Vehicles moving > 5 km/h
  const alerts = vehicles.filter(v => v.gpsData?.status === 'offline').length;

  return (
    <div className="tw-p-6">
      <LoadPanel visible={loading} />

      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
          <div>
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">GPS Tracking</h2>
            <p className="tw-text-gray-600">
              Real-time vehicle location monitoring and tracking
            </p>
          </div>
          <div className={`tw-flex tw-items-center tw-px-3 tw-py-1 tw-rounded-full ${
            liveTrackingActive ? 'tw-bg-green-100' : 'tw-bg-gray-100'
          }`}>
            <div className={`tw-w-2 tw-h-2 tw-rounded-full tw-mr-2 ${
              liveTrackingActive ? 'tw-bg-green-500 tw-animate-pulse' : 'tw-bg-gray-500'
            }`}></div>
            <span className={`tw-text-sm tw-font-medium ${
              liveTrackingActive ? 'tw-text-green-700' : 'tw-text-gray-700'
            }`}>
              {liveTrackingActive ? 'Live Tracking' : 'Tracking Stopped'}
            </span>
          </div>
        </div>

        {error && (
          <div className="tw-bg-red-100 tw-border tw-border-red-400 tw-text-red-700 tw-px-4 tw-py-3 tw-rounded tw-mb-4">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-6 tw-mb-8">
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-blue-800">{totalVehicles}</h3>
                <p className="tw-text-blue-600 tw-text-sm">Total Vehicles</p>
              </div>
              <i className="fa-light fa-truck tw-text-2xl tw-text-blue-500"></i>
            </div>
          </div>

          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-green-800">{onlineVehicles}</h3>
                <p className="tw-text-green-600 tw-text-sm">Online</p>
              </div>
              <i className="fa-light fa-wifi tw-text-2xl tw-text-green-500"></i>
            </div>
          </div>

          <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-yellow-800">{inTransit}</h3>
                <p className="tw-text-yellow-600 tw-text-sm">In Transit</p>
              </div>
              <i className="fa-light fa-location-arrow tw-text-2xl tw-text-yellow-500"></i>
            </div>
          </div>

          <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div>
                <h3 className="tw-text-2xl tw-font-bold tw-text-red-800">{alerts}</h3>
                <p className="tw-text-red-600 tw-text-sm">Offline</p>
              </div>
              <i className="fa-light fa-exclamation-triangle tw-text-2xl tw-text-red-500"></i>
            </div>
          </div>
        </div>

        {/* Vehicle Selection and Control Panel */}
        <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-3 tw-gap-6 tw-mb-8">
          <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg">
            <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">Select Vehicle</h4>
            <SelectBox
              dataSource={vehicles}
              displayExpr="name"
              valueExpr="vehicleId"
              placeholder="Choose a vehicle..."
              onValueChanged={(e) => handleVehicleSelect(e.value)}
              value={selectedVehicle?.vehicleId}
            />
          </div>

          <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg">
            <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">Live Tracking</h4>
            <div className="tw-flex tw-gap-2">
              <Button
                text="Start"
                type="success"
                disabled={!selectedVehicle || liveTrackingActive}
                onClick={handleStartLiveTracking}
                className="tw-flex-1"
              />
              <Button
                text="Stop"
                type="danger"
                disabled={!liveTrackingActive}
                onClick={stopLiveTracking}
                className="tw-flex-1"
              />
            </div>
          </div>

          <div className="tw-bg-gray-50 tw-p-4 tw-rounded-lg">
            <h4 className="tw-font-semibold tw-text-gray-800 tw-mb-3">Track History</h4>
            <Button
              text="Load History"
              type="default"
              disabled={!selectedVehicle}
              onClick={handleLoadTrackHistory}
              className="tw-w-full"
            />
          </div>
        </div>

        {/* Date Range for History */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-6">
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              From Date
            </label>
            <DateBox
              value={fromDate}
              onValueChanged={(e) => setFromDate(e.value)}
              type="datetime"
            />
          </div>
          <div>
            <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
              To Date
            </label>
            <DateBox
              value={toDate}
              onValueChanged={(e) => setToDate(e.value)}
              type="datetime"
            />
          </div>
        </div>

        {/* Selected Vehicle Info */}
        {selectedVehicle && (
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-mb-6">
            <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-3">
              Selected Vehicle: {selectedVehicle.name}
            </h4>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
              <div>
                <span className="tw-text-sm tw-text-blue-600">Status:</span>
                <div className={`tw-inline-block tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium tw-ml-2 ${
                  getStatusBadge(selectedVehicle.gpsData)
                }`}>
                  {selectedVehicle.gpsData?.status || 'Unknown'}
                </div>
              </div>
              <div>
                <span className="tw-text-sm tw-text-blue-600">Speed:</span>
                <span className="tw-ml-2 tw-font-medium">
                  {selectedVehicle.gpsData?.speed || 0} km/h
                </span>
              </div>
              <div>
                <span className="tw-text-sm tw-text-blue-600">Location:</span>
                <span className="tw-ml-2 tw-font-medium">
                  {selectedVehicle.gpsData?.latitude && selectedVehicle.gpsData?.longitude
                    ? `${selectedVehicle.gpsData.latitude.toFixed(6)}, ${selectedVehicle.gpsData.longitude.toFixed(6)}`
                    : 'Unknown'
                  }
                </span>
              </div>
              <div>
                <span className="tw-text-sm tw-text-blue-600">Last Update:</span>
                <span className="tw-ml-2 tw-font-medium tw-text-xs">
                  {formatLastUpdate(selectedVehicle.gpsData?.timestamp)}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Vehicles Grid */}
        <div className="tw-mb-8">
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">All Vehicles</h3>
          <DataGrid
            dataSource={vehicles}
            showBorders={true}
            remoteOperations={false}
            allowColumnReordering={true}
            allowColumnResizing={true}
            columnAutoWidth={true}
            onRowClick={(e) => setSelectedVehicle(e.data)}
          >
            <FilterRow visible={true} />
            <HeaderFilter visible={true} />
            <Paging defaultPageSize={10} />

            <Column dataField="name" caption="Vehicle Name" />
            <Column dataField="vehicleId" caption="Vehicle ID" />
            <Column
              dataField="gpsData.status"
              caption="GPS Status"
              cellRender={({ data }) => (
                <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                  getStatusBadge(data.gpsData)
                }`}>
                  {data.gpsData?.status || 'Unknown'}
                </span>
              )}
            />
            <Column
              dataField="gpsData.speed"
              caption="Speed (km/h)"
              format="decimal"
              cellRender={({ value }) => value || 0}
            />
            <Column
              dataField="gpsData.latitude"
              caption="Latitude"
              format={{ type: 'decimal', precision: 6 }}
            />
            <Column
              dataField="gpsData.longitude"
              caption="Longitude"
              format={{ type: 'decimal', precision: 6 }}
            />
            <Column
              dataField="gpsData.timestamp"
              caption="Last Update"
              dataType="datetime"
              format="dd/MM/yyyy HH:mm:ss"
            />
          </DataGrid>
        </div>

        {/* Map Placeholder */}
        <div className="tw-bg-gray-100 tw-p-8 tw-rounded-lg tw-text-center">
          <i className="fa-light fa-map tw-text-4xl tw-text-gray-400 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-700 tw-mb-2">Interactive Map</h3>
          <p className="tw-text-gray-500 tw-mb-4">
            GPS tracking map will display vehicle locations here
          </p>
          {selectedVehicle && selectedVehicle.gpsData?.latitude && (
            <p className="tw-text-blue-600 tw-text-sm">
              Selected Vehicle Location: {selectedVehicle.gpsData.latitude.toFixed(6)}, {selectedVehicle.gpsData.longitude.toFixed(6)}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default VehicleTrackingPage;
