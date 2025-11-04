/**
 * File: VehicleConsumptionHistory.js
 * Purpose: Render vehicle fuel consumption history with filtering and detail views.
 * Dependencies: react, react-redux, devextreme-react components, notify
 * Last Modified: 2025-10-26 - NUCLEAR OPTION: Imperative DataGrid Implementation
 *
 * Key Functions/Components:
 * - VehicleConsumptionHistory: Main component managing filters, grid data, and details modal
 * - loadConsumptionHistory(): Fetches consumption data and normalizes it for the grid
 * - handleApplyFilter(): Triggers a data reload based on selected date range
 *
 * CRITICAL: Uses ImperativeDataGrid to bypass React reconciliation conflicts
 */

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DateBox } from 'devextreme-react/date-box';
import Button from 'devextreme-react/button';
import notify from 'devextreme/ui/notify';

import ImperativeDataGrid from './vehicleconsumption/ImperativeDataGrid';
import ConsumptionTrendChart from './vehicleconsumption/ConsumptionTrendChart';
import VehicleConsumptionHistoryDetails from './vehicleconsumption/vehicleConsumptionHistoryDetails';
import { fetchVehicleConsumptionHistory, clearVehicleConsumptionHistory } from '../../../redux/actions/vehicleActions';


const VehicleConsumptionHistory = ({ vehicleId }) => {
  const dispatch = useDispatch();

  // Memoize selectors to prevent new array references
  const consumptionData = useSelector(
    state => state.vehicle.consumptionHistory || []
  );
  const isLoading = useSelector(state => state.vehicle.consumptionHistoryLoading);

  // Debug logging
  useEffect(() => {
    console.log('🔄 VehicleConsumptionHistory rendered', {
      vehicleId,
      dataLength: consumptionData.length,
      isLoading,
      firstRecord: consumptionData[0],
      lastRecord: consumptionData[consumptionData.length - 1],
      dateRange: consumptionData.length > 0 ? {
        first: consumptionData[0]?.date,
        last: consumptionData[consumptionData.length - 1]?.date
      } : null
    });
  });

  // Track when vehicleId prop changes
  const prevVehicleIdRef = useRef(vehicleId);
  useEffect(() => {
    if (prevVehicleIdRef.current !== vehicleId) {
      console.log('🆔 vehicleId prop changed:', prevVehicleIdRef.current, '→', vehicleId);
      prevVehicleIdRef.current = vehicleId;
    }
  }, [vehicleId]);

  const [dateFrom, setDateFrom] = useState(new Date(new Date().setDate(new Date().getDate() - 30)));
  const [dateTo, setDateTo] = useState(new Date());
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const loadingRef = useRef(false);
  const requestControllerRef = useRef(null);
  const debounceRef = useRef(null);
  const dataSignatureRef = useRef('');
  const loadConsumptionHistoryRef = useRef(null);

  // DataGrid selection state
  const [selectedRowKeys, setSelectedRowKeys] = useState([]);

  // Define columns configuration for imperative DataGrid
  const gridColumns = useMemo(() => [
    {
      dataField: 'date',
      caption: 'Date',
      dataType: 'date',
      format: 'dd/MM/yyyy',
      width: 110,
      allowSorting: true,
      sortOrder: 'desc'
    },
    { dataField: 'site', caption: 'Site', width: 150 },
    { dataField: 'employee', caption: 'Driver/Operator', width: 150 },
    { dataField: 'fuelType', caption: 'Fuel Type', width: 120 },
    {
      dataField: 'totalDistance',
      caption: 'Distance (km)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120
    },
    {
      dataField: 'totalFuel',
      caption: 'Fuel Used (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120
    },
    {
      dataField: 'avgEfficiency',
      caption: 'Avg Efficiency',
      width: 140,
      calculateCellValue: (rowData) => {
        if (rowData.isAverageKm && rowData.totalDistance > 0 && rowData.totalFuel > 0) {
          const efficiency = rowData.totalDistance / rowData.totalFuel;
          return `${efficiency.toFixed(2)} km/L`;
        } else if (!rowData.isAverageKm && rowData.engHours > 0 && rowData.totalFuel > 0) {
          const efficiency = rowData.totalFuel / rowData.engHours;
          return `${efficiency.toFixed(2)} L/hr`;
        }
        return 'N/A';
      }
    },
    {
      dataField: 'openingMeter',
      caption: 'Opening Meter',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 130
    },
    {
      dataField: 'closingMeter',
      caption: 'Closing Meter',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 130
    },
    {
      dataField: 'engHours',
      caption: 'Engine Hours',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120
    },
    {
      dataField: 'openingFuelLevel',
      caption: 'Opening Fuel (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 140
    },
    {
      dataField: 'closingFuelLevel',
      caption: 'Closing Fuel (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 140
    },
    {
      dataField: 'fuelLost',
      caption: 'Fuel Lost (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 120,
      cellRender: (cellData) => {
        const value = cellData.value || 0;
        const className = value > 0 ? 'tw-text-red-600 tw-font-semibold' : '';
        return `<span class="${className}">${value.toFixed(2)}</span>`;
      }
    },
    {
      dataField: 'excessFuel',
      caption: 'Excess Fuel (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 140,
      cellRender: (cellData) => {
        const value = cellData.value || 0;
        const className = value > 0 ? 'tw-text-green-600 tw-font-semibold' : '';
        return `<span class="${className}">${value.toFixed(2)}</span>`;
      }
    },
    {
      dataField: 'stockReceived',
      caption: 'Stock Received (L)',
      dataType: 'number',
      format: { type: 'fixedPoint', precision: 2 },
      width: 150
    },
    { dataField: 'remarks', caption: 'Remarks', width: 200 }
  ], []);

  // Selected rows data (fallback to all rows when nothing explicitly selected)
  const selectedData = useMemo(() => {
    if (!consumptionData || consumptionData.length === 0) return [];
    if (!selectedRowKeys || selectedRowKeys.length === 0) return consumptionData;
    const keySet = new Set(selectedRowKeys);
    return consumptionData.filter(item => keySet.has(item.rowKey));
  }, [consumptionData, selectedRowKeys]);

  // Calculate summary statistics based on selected rows
  const summaryStats = useMemo(() => {
    if (!selectedData || selectedData.length === 0) {
      return {
        totalDistance: 0,
        totalFuel: 0,
        totalFuelLost: 0,
        totalEngineHours: 0,
        avgEfficiencyKmL: 0,
        avgEfficiencyLHr: 0,
        numberOfDays: 0,
        kmLCount: 0,
        lHrCount: 0
      };
    }

    const uniqueDates = new Set(selectedData.map(item =>
      new Date(item.date).toDateString()
    ));

    // Separate km/L and L/hr records for proper averaging
    const kmLRecords = selectedData.filter(item =>
      item.isAverageKm && item.totalDistance > 0 && item.totalFuel > 0
    );
    const lHrRecords = selectedData.filter(item =>
      !item.isAverageKm && item.engHours > 0 && item.totalFuel > 0
    );

    // Calculate km/L average (ignore records with 0 distance or fuel)
    const avgKmL = kmLRecords.length > 0
      ? kmLRecords.reduce((sum, item) => sum + (item.totalDistance / item.totalFuel), 0) / kmLRecords.length
      : 0;

    // Calculate L/hr average (ignore records with 0 engine hours or fuel)
    const avgLHr = lHrRecords.length > 0
      ? lHrRecords.reduce((sum, item) => sum + (item.totalFuel / item.engHours), 0) / lHrRecords.length
      : 0;

    return {
      totalDistance: selectedData.reduce((sum, item) => sum + (item.totalDistance || 0), 0),
      totalFuel: selectedData.reduce((sum, item) => sum + (item.totalFuel || 0), 0),
      totalFuelLost: selectedData.reduce((sum, item) => sum + (item.fuelLost || 0), 0),
      totalEngineHours: selectedData.reduce((sum, item) => sum + (item.engHours || 0), 0),
      avgEfficiencyKmL: avgKmL,
      avgEfficiencyLHr: avgLHr,
      numberOfDays: uniqueDates.size,
      kmLCount: kmLRecords.length,
      lHrCount: lHrRecords.length
    };
  }, [selectedData]);

  // Auto-select all rows on initial load or when dataset changes
  useEffect(() => {
    const allKeys = (consumptionData || []).map(item => item.rowKey);
    const signature = `${allKeys.length}|${allKeys.join('|')}`;

    console.log('🔑 Auto-select check:', {
      dataLength: consumptionData?.length,
      keysLength: allKeys.length,
      newSignature: signature,
      oldSignature: dataSignatureRef.current,
      willUpdate: signature !== dataSignatureRef.current
    });

    if (!allKeys.length) {
      // Clear selection when no data
      setSelectedRowKeys([]);
      dataSignatureRef.current = '';
      return;
    }

    if (signature !== dataSignatureRef.current) {
      console.log('✅ Updating selection with all keys');
      dataSignatureRef.current = signature;
      setSelectedRowKeys(allKeys);
    }
  }, [consumptionData]);

  const loadConsumptionHistory = useCallback(async () => {
    if (!vehicleId || loadingRef.current) return;

    try {
      loadingRef.current = true;

      // Cancel any in-flight request before starting a new one
      if (requestControllerRef.current) {
        try { requestControllerRef.current.abort(); } catch (_) {}
      }
      const controller = new AbortController();
      requestControllerRef.current = controller;

      const diffTime = Math.abs(dateTo - dateFrom);
      const days = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      const entry = Number.isFinite(days) ? Math.max(5, days) : 5; // Removed max limit

      console.log('📅 Loading consumption history:', {
        vehicleId,
        dateFrom: dateFrom.toISOString(),
        dateTo: dateTo.toISOString(),
        days,
        entry
      });

      const response = await dispatch(
        fetchVehicleConsumptionHistory(
          {
            vehicleId: parseInt(vehicleId),
            dateFrom: dateFrom,
            dateTo: dateTo,
            entry: entry
          },
          { signal: controller.signal }
        )
      );

      console.log('✅ Response received:', {
        success: response?.success,
        dataLength: response?.data?.length
      });

      if (!response?.success) {
        notify(response?.message || 'Failed to load consumption history', 'error', 3000);
      } else {
        notify(`Loaded ${response?.data?.length || 0} consumption records`, 'success', 2000);
      }
    } catch (error) {
      console.error('Error loading consumption history:', error);
      notify(error.message || 'Failed to load consumption history', 'error', 3000);
    } finally {
      loadingRef.current = false;
      if (!requestControllerRef.current?.signal?.aborted) {
        requestControllerRef.current = null;
      }
    }
  }, [dispatch, vehicleId, dateFrom, dateTo]);

  // Store stable reference
  useEffect(() => {
    loadConsumptionHistoryRef.current = loadConsumptionHistory;
  }, [loadConsumptionHistory]);

  useEffect(() => {
    if (vehicleId) {
      // Debounced load on vehicle switch to avoid races during fast navigation
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
      debounceRef.current = setTimeout(() => {
        loadConsumptionHistoryRef.current?.();
      }, 200);
    }

    return () => {
      // Cancel in-flight requests and clear state between vehicle switches/unmount
      if (requestControllerRef.current) {
        try { requestControllerRef.current.abort(); } catch (_) {}
        requestControllerRef.current = null;
      }
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      dispatch(clearVehicleConsumptionHistory());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [vehicleId, dispatch]);

  const handleRefresh = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }
    debounceRef.current = setTimeout(() => {
      if (!loadingRef.current) {
        loadConsumptionHistory();
      }
    }, 200);
  }, [loadConsumptionHistory]);

  const handleApplyFilter = useCallback(() => {
    console.log('🎯 Apply Filter clicked');
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    // Clear existing data first to show loading state
    dispatch(clearVehicleConsumptionHistory());

    debounceRef.current = setTimeout(() => {
      if (!loadingRef.current) {
        console.log('⏰ Executing loadConsumptionHistory after debounce');
        loadConsumptionHistory();
      } else {
        console.log('⚠️ Skipped load - already loading');
      }
    }, 200);
  }, [loadConsumptionHistory, dispatch]);

  const handleRowClick = useCallback((e) => {
    setSelectedRecord(e.data);
    setDetailsVisible(true);
  }, []);

  const handleCloseDetails = useCallback(() => {
    setDetailsVisible(false);
    setSelectedRecord(null);
  }, []);

  return (
    <div className="vehicle-consumption-history">
      <div className="tw-mb-6">
        <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4">
          Fuel Consumption History
        </h3>

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
            {isLoading && (
              <span className="tw-text-sm tw-text-gray-500 tw-ml-2">Loading…</span>
            )}
          </div>
        </div>
      </div>

      {/* IMPERATIVE DATAGRID - Manages lifecycle outside React */}
      <ImperativeDataGrid
        data={consumptionData}
        onRowClick={handleRowClick}
        selectedRowKeys={selectedRowKeys}
        onSelectionChanged={(e) => setSelectedRowKeys(e.selectedRowKeys)}
        columns={gridColumns}
      />

      {/* Summary Cards - Compact Design */}
      <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-7 tw-gap-3 tw-mt-6">
        <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-blue-600 tw-font-medium">Days</p>
              <p className="tw-text-xl tw-font-bold tw-text-blue-900">
                {summaryStats.numberOfDays}
              </p>
            </div>
            <i className="fa-light fa-calendar-days tw-text-xl tw-text-blue-600"></i>
          </div>
        </div>

        <div className="tw-bg-purple-50 tw-p-3 tw-rounded-lg tw-border tw-border-purple-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-purple-600 tw-font-medium">Distance</p>
              <p className="tw-text-xl tw-font-bold tw-text-purple-900">
                {summaryStats.totalDistance.toFixed(0)} <span className="tw-text-sm">km</span>
              </p>
            </div>
            <i className="fa-light fa-route tw-text-xl tw-text-purple-600"></i>
          </div>
        </div>

        <div className="tw-bg-green-50 tw-p-3 tw-rounded-lg tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-green-600 tw-font-medium">Fuel Used</p>
              <p className="tw-text-xl tw-font-bold tw-text-green-900">
                {summaryStats.totalFuel.toFixed(0)} <span className="tw-text-sm">L</span>
              </p>
            </div>
            <i className="fa-light fa-gas-pump tw-text-xl tw-text-green-600"></i>
          </div>
        </div>

        <div className="tw-bg-indigo-50 tw-p-3 tw-rounded-lg tw-border tw-border-indigo-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-indigo-600 tw-font-medium">Engine Hrs</p>
              <p className="tw-text-xl tw-font-bold tw-text-indigo-900">
                {summaryStats.totalEngineHours.toFixed(1)} <span className="tw-text-sm">hr</span>
              </p>
            </div>
            <i className="fa-light fa-engine tw-text-xl tw-text-indigo-600"></i>
          </div>
        </div>

        <div className="tw-bg-yellow-50 tw-p-3 tw-rounded-lg tw-border tw-border-yellow-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-yellow-600 tw-font-medium">Avg km/L</p>
              <p className="tw-text-xl tw-font-bold tw-text-yellow-900">
                {summaryStats.avgEfficiencyKmL > 0 ? summaryStats.avgEfficiencyKmL.toFixed(2) : '-'}
              </p>
              <p className="tw-text-xs tw-text-yellow-600">({summaryStats.kmLCount} records)</p>
            </div>
            <i className="fa-light fa-gauge-high tw-text-xl tw-text-yellow-600"></i>
          </div>
        </div>

        <div className="tw-bg-orange-50 tw-p-3 tw-rounded-lg tw-border tw-border-orange-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-orange-600 tw-font-medium">Avg L/hr</p>
              <p className="tw-text-xl tw-font-bold tw-text-orange-900">
                {summaryStats.avgEfficiencyLHr > 0 ? summaryStats.avgEfficiencyLHr.toFixed(2) : '-'}
              </p>
              <p className="tw-text-xs tw-text-orange-600">({summaryStats.lHrCount} records)</p>
            </div>
            <i className="fa-light fa-droplet tw-text-xl tw-text-orange-600"></i>
          </div>
        </div>

        <div className="tw-bg-red-50 tw-p-3 tw-rounded-lg tw-border tw-border-red-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-xs tw-text-red-600 tw-font-medium">Fuel Lost</p>
              <p className="tw-text-xl tw-font-bold tw-text-red-900">
                {summaryStats.totalFuelLost.toFixed(1)} <span className="tw-text-sm">L</span>
              </p>
            </div>
            <i className="fa-light fa-exclamation-triangle tw-text-xl tw-text-red-600"></i>
          </div>
        </div>
      </div>

      {/* Trend Analysis Chart */}
      <ConsumptionTrendChart selectedData={selectedData} />

      {/* Details Modal */}
      {detailsVisible && selectedRecord && (
        <VehicleConsumptionHistoryDetails
          record={selectedRecord}
          visible={detailsVisible}
          onClose={handleCloseDetails}
        />
      )}
    </div>
  );
};

export default React.memo(VehicleConsumptionHistory, (prevProps, nextProps) => {
  // Only re-render if vehicleId changes
  return prevProps.vehicleId === nextProps.vehicleId;
});
