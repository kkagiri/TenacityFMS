import React, { useState, useEffect, useCallback } from 'react';
import { DataGrid, Button, Chart, LoadIndicator } from 'devextreme-react';
import { Column, Paging, SearchPanel, Summary, TotalItem } from 'devextreme-react/data-grid';
import { Series, ArgumentAxis, ValueAxis, Legend } from 'devextreme-react/chart';
import { notify } from 'devextreme/ui/notify';

import vehicleGPSTrackingService from '../services/vehicleGPSTrackingService';
import { MaintenanceModuleIntegration, GPSErrorHandler } from '../examples/vehicleGPSIntegrationExamples';

/**
 * Vehicle Maintenance Page Component
 * Example of integrating GPS odometer tracking into maintenance module
 */
const VehicleMaintenancePage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [summaryData, setSummaryData] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Load fleet maintenance overview
  const loadMaintenanceData = useCallback(async () => {
    setLoading(true);
    try {
      const maintenanceData = await MaintenanceModuleIntegration.getFleetMaintenanceOverview();

      if (maintenanceData && maintenanceData.length > 0) {
        const formattedData = maintenanceData.map(vehicle => ({
          ...vehicle,
          nextMaintenanceDistance: Math.min(
            vehicle.maintenanceInfo.nextOilChange.remaining,
            vehicle.maintenanceInfo.nextTireRotation.remaining,
            vehicle.maintenanceInfo.nextMajorService.remaining
          ),
          maintenanceStatus: getMaintenanceStatusText(vehicle.maintenanceInfo),
          priorityText: getPriorityText(vehicle.priority)
        }));

        setVehicles(formattedData);

        // Calculate summary
        const summary = {
          totalVehicles: formattedData.length,
          overdueCount: formattedData.filter(v => v.priority >= 4).length,
          dueSoonCount: formattedData.filter(v => v.priority === 3).length,
          totalOdometer: formattedData.reduce((sum, v) => sum + (v.currentOdometer || 0), 0)
        };
        setSummaryData(summary);
      } else {
        setVehicles([]);
        setSummaryData(null);
      }
    } catch (error) {
      GPSErrorHandler.handleGPSError(error, 'loading maintenance data');
      setVehicles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Get maintenance status text
  const getMaintenanceStatusText = (maintenanceInfo) => {
    if (maintenanceInfo.nextOilChange.isOverdue) return 'Oil Change Overdue';
    if (maintenanceInfo.nextMajorService.isOverdue) return 'Major Service Overdue';
    if (maintenanceInfo.nextTireRotation.isOverdue) return 'Tire Rotation Overdue';
    if (maintenanceInfo.nextOilChange.remaining < 500) return 'Oil Change Due Soon';
    if (maintenanceInfo.nextMajorService.remaining < 1000) return 'Major Service Due Soon';
    return 'Up to Date';
  };

  // Get priority text
  const getPriorityText = (priority) => {
    switch (priority) {
      case 5: return 'Critical';
      case 4: return 'High';
      case 3: return 'Medium';
      case 2: return 'Low';
      default: return 'Normal';
    }
  };

  // Handle vehicle selection for detailed view
  const handleViewDetails = async (vehicleId) => {
    try {
      const detailedData = await MaintenanceModuleIntegration.getVehicleMaintenanceData(vehicleId);

      if (detailedData) {
        setSelectedVehicle(detailedData);
        // Here you could open a modal or navigate to detailed page
        notify(`Loaded details for ${detailedData.vehicleName}`, 'success', 2000);
      }
    } catch (error) {
      GPSErrorHandler.handleGPSError(error, 'loading vehicle details');
    }
  };

  // Schedule maintenance (placeholder for integration)
  const handleScheduleMaintenance = (vehicleId, maintenanceType) => {
    notify(`Scheduling ${maintenanceType} for vehicle ${vehicleId}`, 'info', 3000);
    // TODO: Integrate with your maintenance scheduling system
  };

  // Component lifecycle
  useEffect(() => {
    loadMaintenanceData();
  }, [loadMaintenanceData]);

  // Auto-refresh every 5 minutes (maintenance data doesn't change as frequently)
  useEffect(() => {
    const interval = setInterval(() => {
      loadMaintenanceData();
    }, 300000); // 5 minutes

    return () => clearInterval(interval);
  }, [loadMaintenanceData]);

  // Render priority cell with color coding
  const renderPriorityCell = (cellData) => {
    const priority = cellData.value;
    let className = 'tw-px-2 tw-py-1 tw-rounded tw-text-xs tw-font-semibold ';

    switch (priority) {
      case 'Critical':
        className += 'tw-bg-red-100 tw-text-red-800';
        break;
      case 'High':
        className += 'tw-bg-orange-100 tw-text-orange-800';
        break;
      case 'Medium':
        className += 'tw-bg-yellow-100 tw-text-yellow-800';
        break;
      default:
        className += 'tw-bg-green-100 tw-text-green-800';
    }

    return <span className={className}>{priority}</span>;
  };

  // Render odometer cell with formatting
  const renderOdometerCell = (cellData) => {
    const value = cellData.value;
    return value ? `${value.toLocaleString()} km` : 'N/A';
  };

  // Render action buttons
  const renderActionButtons = (cellData) => {
    const vehicle = cellData.data;
    return (
      <div className="tw-space-x-2">
        <Button
          text="Details"
          type="default"
          onClick={() => handleViewDetails(vehicle.vehicleId)}
        />
        {vehicle.priority >= 3 && (
          <Button
            text="Schedule"
            type="success"
            onClick={() => handleScheduleMaintenance(vehicle.vehicleId, vehicle.maintenanceStatus)}
          />
        )}
      </div>
    );
  };

  // Chart data for maintenance overview
  const getChartData = () => {
    if (!summaryData) return [];

    return [
      { status: 'Overdue', count: summaryData.overdueCount },
      { status: 'Due Soon', count: summaryData.dueSoonCount },
      { status: 'Up to Date', count: summaryData.totalVehicles - summaryData.overdueCount - summaryData.dueSoonCount }
    ];
  };

  return (
    <div className="tw-p-6">
      {/* Header */}
      <div className="tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-mb-4">Vehicle Maintenance - GPS Odometer Tracking</h2>

        <div className="tw-flex tw-items-center tw-space-x-4 tw-mb-4">
          <Button
            icon="refresh"
            text="Refresh Data"
            type="default"
            onClick={loadMaintenanceData}
            disabled={loading}
          />
        </div>
      </div>

      {/* Summary Cards */}
      {summaryData && (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-4 tw-gap-4 tw-mb-6">
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg">
            <h3 className="tw-text-lg tw-font-semibold tw-text-blue-800">Total Vehicles</h3>
            <p className="tw-text-2xl tw-font-bold tw-text-blue-600">{summaryData.totalVehicles}</p>
          </div>

          <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg">
            <h3 className="tw-text-lg tw-font-semibold tw-text-red-800">Overdue</h3>
            <p className="tw-text-2xl tw-font-bold tw-text-red-600">{summaryData.overdueCount}</p>
          </div>

          <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg">
            <h3 className="tw-text-lg tw-font-semibold tw-text-yellow-800">Due Soon</h3>
            <p className="tw-text-2xl tw-font-bold tw-text-yellow-600">{summaryData.dueSoonCount}</p>
          </div>

          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg">
            <h3 className="tw-text-lg tw-font-semibold tw-text-green-800">Total Distance</h3>
            <p className="tw-text-2xl tw-font-bold tw-text-green-600">
              {summaryData.totalOdometer.toLocaleString()} km
            </p>
          </div>
        </div>
      )}

      {/* Chart */}
      {summaryData && (
        <div className="tw-mb-6">
          <Chart
            dataSource={getChartData()}
            title="Maintenance Status Overview"
            height={300}
          >
            <Series
              valueField="count"
              argumentField="status"
              type="doughnut"
              innerRadius={0.5}
            />
            <Legend visible={true} />
          </Chart>
        </div>
      )}

      {/* Vehicle Maintenance Grid */}
      <div className="tw-relative">
        {loading && (
          <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-10">
            <LoadIndicator visible={true} />
          </div>
        )}

        <DataGrid
          dataSource={vehicles}
          keyExpr="vehicleId"
          allowColumnReordering={true}
          allowColumnResizing={true}
          columnAutoWidth={true}
          showBorders={true}
          rowAlternationEnabled={true}
        >
          <SearchPanel visible={true} width={300} placeholder="Search vehicles..." />
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
            dataField="currentOdometer"
            caption="Current Odometer"
            width={130}
            alignment="right"
            cellRender={renderOdometerCell}
          />

          <Column
            dataField="nextMaintenanceDistance"
            caption="Next Maintenance"
            width={130}
            alignment="right"
            cellRender={renderOdometerCell}
          />

          <Column
            dataField="maintenanceStatus"
            caption="Status"
            width={150}
          />

          <Column
            dataField="priorityText"
            caption="Priority"
            width={80}
            cellRender={renderPriorityCell}
          />

          <Column
            dataField="lastUpdated"
            caption="Last Updated"
            width={150}
            dataType="datetime"
          />

          <Column
            caption="Actions"
            width={150}
            allowSorting={false}
            cellRender={renderActionButtons}
          />

          <Summary>
            <TotalItem
              column="currentOdometer"
              summaryType="sum"
              valueFormat="decimal"
              displayFormat="Total: {0} km"
            />
          </Summary>
        </DataGrid>
      </div>

      {/* Selected Vehicle Details Modal (placeholder) */}
      {selectedVehicle && (
        <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
          <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
            Selected Vehicle: {selectedVehicle.vehicleName}
          </h3>
          <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-text-sm">
            <div>
              <strong>Current Odometer:</strong> {selectedVehicle.currentOdometer} km
            </div>
            <div>
              <strong>Oil Change Due:</strong> {selectedVehicle.maintenanceInfo.nextOilChange.dueAt} km
            </div>
            <div>
              <strong>Major Service Due:</strong> {selectedVehicle.maintenanceInfo.nextMajorService.dueAt} km
            </div>
          </div>
          <Button
            text="Close"
            type="default"
            onClick={() => setSelectedVehicle(null)}
            className="tw-mt-2"
          />
        </div>
      )}
    </div>
  );
};

export default VehicleMaintenancePage;
