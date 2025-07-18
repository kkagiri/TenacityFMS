import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { DataGrid } from 'devextreme-react/data-grid';
import { Column, Paging, FilterRow, SearchPanel, Export, Selection, LoadPanel } from 'devextreme-react/data-grid';
import { DateBox } from 'devextreme-react/date-box';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

// Components
import VehicleConsumptionHistoryDetails from './vehicleConsumptionHistoryDetails';

// Redux actions
import { fetchVehicleConsumptionHistory } from '../../../redux/actions/vehicleActions';

const VehicleConsumptionHistory = ({ vehicleId }) => {
  const dispatch = useDispatch();
  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [dateTo, setDateTo] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [consumptionData, setConsumptionData] = useState([]);
  const dataLoadedRef = useRef(false); // Use ref instead of state to avoid dependency issues

  // Redux state
  const consumptionHistory = useSelector((state) => state.vehicle.consumptionHistory);

  // Memoize the loadConsumptionHistory function to prevent recreating on every render
  const loadConsumptionHistory = useCallback(async (forceReload = false) => {
    // Skip loading if already loaded and not forced to reload
    if (!vehicleId || (dataLoadedRef.current && !forceReload)) return;

    try {
      setIsLoading(true);

      // Only execute the fetch if we need to
      const response = await dispatch(fetchVehicleConsumptionHistory({
        vehicleId,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString()
      }));

      if (response?.success) {
        // Convert ISO strings back to Date objects for DevExtreme components
        const processedData = (response.data || []).map(item => ({
          ...item,
          date: item.date ? new Date(item.date) : null
        }));
        setConsumptionData(processedData);
        dataLoadedRef.current = true; // Mark as loaded
      } else {
        throw new Error(response?.message || 'Failed to load consumption history');
      }
    } catch (error) {
      console.error('Error loading consumption history:', error);
      notify(error.message || 'Failed to load consumption history', 'error', 3000);
      setConsumptionData([]); // Set empty array on error
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, vehicleId, dateFrom, dateTo]);

  // Only load data when vehicleId changes initially
  useEffect(() => {
    if (vehicleId && !dataLoadedRef.current) { // Only load if not already loaded
      loadConsumptionHistory();
    }
  }, [vehicleId, loadConsumptionHistory]);

  const handleRefresh = useCallback(() => {
    dataLoadedRef.current = false; // Reset data loaded flag to allow reloading
    loadConsumptionHistory(true); // Force reload
  }, [loadConsumptionHistory]);

  const handleRowClick = useCallback((e) => {
    setSelectedRecord(e.data);
    setDetailsVisible(true);
  }, []);

  const onDetailsClose = useCallback(() => {
    setDetailsVisible(false);
    setSelectedRecord(null);
  }, []);

  const formatCurrency = useCallback((value) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(value || 0);
  }, []);

  const formatDate = useCallback((value) => {
    return value ? new Date(value).toLocaleDateString() : '';
  }, []);

  const calculateEfficiency = useCallback((distance, fuelUsed) => {
    if (!distance || !fuelUsed || fuelUsed === 0) return 0;
    return (distance / fuelUsed).toFixed(2);
  }, []);

  // Handle date filter changes
  const handleApplyFilter = useCallback(() => {
    dataLoadedRef.current = false; // Reset data loaded flag to allow reloading
    loadConsumptionHistory(true); // Force reload
  }, [loadConsumptionHistory]);

  return (
    <div className="vehicle-consumption-history">
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
          Fuel Consumption History
        </h3>

        {/* Date Range Filter */}
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center tw-gap-4 tw-mb-4 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
          <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-start tw-gap-4">
            <div className="tw-flex tw-items-center tw-gap-2">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">From:</label>
              <DateBox
                value={dateFrom}
                onValueChanged={(e) => setDateFrom(e.value)}
                displayFormat="dd/MM/yyyy"
                width="100%"
              />
            </div>
            <div className="tw-flex tw-items-center tw-gap-2">
              <label className="tw-text-sm tw-font-medium tw-text-gray-700">To:</label>
              <DateBox
                value={dateTo}
                onValueChanged={(e) => setDateTo(e.value)}
                displayFormat="dd/MM/yyyy"
                width="100%"
              />
            </div>
          </div>
          <div className="tw-flex tw-gap-2">
            <Button
              text="Apply Filter"
              icon="fa-light fa-filter"
              onClick={handleApplyFilter}
              type="default"
              stylingMode="outlined"
              disabled={isLoading}
            />
            <Button
              text="Refresh"
              icon="fa-light fa-sync"
              onClick={handleRefresh}
              type="normal"
              stylingMode="text"
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Data Grid */}
      <DataGrid
        dataSource={consumptionData}
        keyExpr="id"
        showBorders={true}
        showRowLines={true}
        showColumnLines={true}
        allowColumnReordering={true}
        allowColumnResizing={true}
        columnAutoWidth={true}
        onRowClick={handleRowClick}
        height={500}
      >
        <LoadPanel enabled={isLoading} />

        <Column
          dataField="date"
          caption="Date"
          dataType="date"
          format="dd/MM/yyyy"
          width={100}
          allowSorting={true}
          cellRender={(cellData) => formatDate(cellData.value)}
        />

        <Column
          dataField="startLocation"
          caption="Start Location"
          width={150}
        />

        <Column
          dataField="endLocation"
          caption="End Location"
          width={150}
        />

        <Column
          dataField="distance"
          caption="Distance (km)"
          dataType="number"
          format="#,##0.00"
          width={120}
          alignment="right"
        />

        <Column
          dataField="fuelUsed"
          caption="Fuel Used (L)"
          dataType="number"
          format="#,##0.00"
          width={120}
          alignment="right"
        />

        <Column
          caption="Efficiency (km/L)"
          width={130}
          alignment="right"
          cellRender={(cellData) => {
            const efficiency = calculateEfficiency(cellData.data.distance, cellData.data.fuelUsed);
            return (
              <span className={`tw-font-medium ${
                efficiency > 10 ? 'tw-text-green-600' :
                efficiency > 7 ? 'tw-text-yellow-600' :
                'tw-text-red-600'
              }`}>
                {efficiency} km/L
              </span>
            );
          }}
        />

        <Column
          dataField="fuelCost"
          caption="Fuel Cost"
          dataType="number"
          width={120}
          alignment="right"
          cellRender={(cellData) => formatCurrency(cellData.value)}
        />

        <Column
          dataField="driverName"
          caption="Driver"
          width={150}
        />

        <Column
          dataField="purpose"
          caption="Purpose"
          width={200}
        />

        <Column
          dataField="status"
          caption="Status"
          width={100}
          cellRender={(cellData) => {
            const status = cellData.value;
            const statusColors = {
              'Completed': 'tw-bg-green-100 tw-text-green-800',
              'Pending': 'tw-bg-yellow-100 tw-text-yellow-800',
              'Cancelled': 'tw-bg-red-100 tw-text-red-800'
            };

            return (
              <span className={`tw-px-2 tw-py-1 tw-rounded-full tw-text-xs tw-font-medium ${
                statusColors[status] || 'tw-bg-gray-100 tw-text-gray-800'
              }`}>
                {status}
              </span>
            );
          }}
        />

        <Paging enabled={true} pageSize={20} />
        <FilterRow visible={true} />
        <SearchPanel visible={true} width={240} placeholder="Search consumption records..." />
        <Export enabled={true} fileName="vehicle-consumption-history" />
        <Selection mode="single" />
      </DataGrid>

      {/* Summary Cards */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mt-6">
        <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-blue-600 tw-font-medium">Total Distance</p>
              <p className="tw-text-2xl tw-font-bold tw-text-blue-900">
                {consumptionData.reduce((sum, item) => sum + (item.distance || 0), 0).toFixed(2)} km
              </p>
            </div>
            <i className="fa-light fa-route tw-text-2xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-green-600 tw-font-medium">Total Fuel Used</p>
              <p className="tw-text-2xl tw-font-bold tw-text-green-900">
                {consumptionData.reduce((sum, item) => sum + (item.fuelUsed || 0), 0).toFixed(2)} L
              </p>
            </div>
            <i className="fa-light fa-gas-pump tw-text-2xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-yellow-600 tw-font-medium">Avg Efficiency</p>
              <p className="tw-text-2xl tw-font-bold tw-text-yellow-900">
                {consumptionData.length > 0 ?
                  (consumptionData.reduce((sum, item) => sum + (item.distance || 0), 0) /
                   consumptionData.reduce((sum, item) => sum + (item.fuelUsed || 0), 0) || 0).toFixed(2)
                  : '0.00'} km/L
              </p>
            </div>
            <i className="fa-light fa-gauge tw-text-2xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-text-purple-600 tw-font-medium">Total Cost</p>
              <p className="tw-text-2xl tw-font-bold tw-text-purple-900">
                {formatCurrency(consumptionData.reduce((sum, item) => sum + (item.fuelCost || 0), 0))}
              </p>
            </div>
            <i className="fa-light fa-dollar-sign tw-text-2xl tw-text-purple-600"></i>
          </div>
        </div>
      </div>

      {/* Details Modal */}
      {detailsVisible && selectedRecord && (
        <VehicleConsumptionHistoryDetails
          record={selectedRecord}
          visible={detailsVisible}
          onClose={onDetailsClose}
        />
      )}
    </div>
  );
};

export default VehicleConsumptionHistory;