import React, { useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import Button from 'devextreme-react/button';
import SelectBox from 'devextreme-react/select-box';
import {
  fetchFleetFuelPositions,
  selectFleetPositions,
  selectLoading
} from '../../../../redux/slices/fuelAuditSlice';

/**
 * GPSFleetMonitor Component
 * Real-time monitoring of vehicle fuel positions from GPS data
 */
const GPSFleetMonitor = () => {
  const dispatch = useDispatch();
  const fleetPositions = useSelector(selectFleetPositions);
  const loading = useSelector(selectLoading);

  const [filter, setFilter] = useState({
    fuelStatus: 'all', // all, low, medium, high
    dataQuality: 'all' // all, good, warning, poor
  });
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    dispatch(fetchFleetFuelPositions());

    // Auto-refresh every 30 seconds if enabled
    let interval;
    if (autoRefresh) {
      interval = setInterval(() => {
        dispatch(fetchFleetFuelPositions());
      }, 30000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [dispatch, autoRefresh]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchFleetFuelPositions());
  }, [dispatch]);

  const getFuelLevelClass = (percentage) => {
    if (percentage <= 20) return 'low';
    if (percentage <= 50) return 'medium';
    return 'high';
  };

  const getDataQualityClass = (quality) => {
    if (quality >= 80) return 'good';
    if (quality >= 50) return 'warning';
    return 'poor';
  };

  const formatLastUpdate = (dateStr) => {
    if (!dateStr) return 'Unknown';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now - date) / 1000 / 60); // minutes
    if (diff < 1) return 'Just now';
    if (diff < 60) return `${diff}m ago`;
    const hours = Math.floor(diff / 60);
    if (hours < 24) return `${hours}h ago`;
    return date.toLocaleDateString();
  };

  const filteredPositions = (fleetPositions || []).filter(pos => {
    if (filter.fuelStatus !== 'all') {
      const level = getFuelLevelClass(pos.fuelLevelPercent);
      if (level !== filter.fuelStatus) return false;
    }
    if (filter.dataQuality !== 'all') {
      const quality = getDataQualityClass(pos.dataQuality);
      if (quality !== filter.dataQuality) return false;
    }
    return true;
  });

  const summaryStats = {
    total: fleetPositions?.length || 0,
    lowFuel: (fleetPositions || []).filter(p => p.fuelLevelPercent <= 20).length,
    poorData: (fleetPositions || []).filter(p => p.dataQuality < 50).length,
    activeVehicles: (fleetPositions || []).filter(p => {
      const diff = (new Date() - new Date(p.lastGpsUpdate)) / 1000 / 60;
      return diff < 30;
    }).length
  };

  return (
    <div className="tw-p-6 gps-monitor">
      {/* Header */}
      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-100 tw-p-6 tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <div>
            <h2 className="tw-text-lg tw-font-semibold tw-text-gray-800">
              <i className="fa-light fa-satellite tw-mr-2 tw-text-blue-600"></i>
              GPS Fleet Monitor
            </h2>
            <p className="tw-text-sm tw-text-gray-500">
              Real-time vehicle fuel positions from GPS sensors
            </p>
          </div>
          <div className="tw-flex tw-items-center tw-gap-3">
            <label className="tw-flex tw-items-center tw-gap-2 tw-text-sm tw-text-gray-600">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="tw-rounded tw-border-gray-300 tw-text-blue-600"
              />
              Auto-refresh (30s)
            </label>
            <Button
              icon="refresh"
              text="Refresh"
              onClick={handleRefresh}
              disabled={loading.fleetPositions}
            />
          </div>
        </div>

        {/* Summary Stats */}
        <div className="tw-grid tw-grid-cols-4 tw-gap-4">
          <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-gray-800">{summaryStats.total}</div>
            <div className="tw-text-sm tw-text-gray-500">Total Vehicles</div>
          </div>
          <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-green-600">{summaryStats.activeVehicles}</div>
            <div className="tw-text-sm tw-text-gray-500">Active Now</div>
          </div>
          <div className="tw-bg-red-50 tw-rounded-lg tw-p-4 tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-red-600">{summaryStats.lowFuel}</div>
            <div className="tw-text-sm tw-text-gray-500">Low Fuel</div>
          </div>
          <div className="tw-bg-yellow-50 tw-rounded-lg tw-p-4 tw-text-center">
            <div className="tw-text-2xl tw-font-bold tw-text-yellow-600">{summaryStats.poorData}</div>
            <div className="tw-text-sm tw-text-gray-500">Poor Data Quality</div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="tw-bg-white tw-rounded-xl tw-shadow-sm tw-border tw-border-gray-100 tw-p-4 tw-mb-6">
        <div className="tw-flex tw-items-center tw-gap-4">
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-text-gray-600">Fuel Level:</label>
            <SelectBox
              items={[
                { value: 'all', text: 'All' },
                { value: 'low', text: 'Low (≤20%)' },
                { value: 'medium', text: 'Medium (21-50%)' },
                { value: 'high', text: 'High (>50%)' }
              ]}
              value={filter.fuelStatus}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => setFilter(prev => ({ ...prev, fuelStatus: e.value }))}
              width={160}
            />
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <label className="tw-text-sm tw-text-gray-600">Data Quality:</label>
            <SelectBox
              items={[
                { value: 'all', text: 'All' },
                { value: 'good', text: 'Good (≥80%)' },
                { value: 'warning', text: 'Warning (50-79%)' },
                { value: 'poor', text: 'Poor (<50%)' }
              ]}
              value={filter.dataQuality}
              valueExpr="value"
              displayExpr="text"
              onValueChanged={(e) => setFilter(prev => ({ ...prev, dataQuality: e.value }))}
              width={160}
            />
          </div>
          <div className="tw-text-sm tw-text-gray-500">
            Showing {filteredPositions.length} of {summaryStats.total} vehicles
          </div>
        </div>
      </div>

      {/* Vehicle Grid */}
      {loading.fleetPositions ? (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
          <i className="fa-light fa-spinner-third fa-spin tw-text-4xl tw-text-blue-600"></i>
        </div>
      ) : filteredPositions.length === 0 ? (
        <div className="tw-text-center tw-py-12 tw-text-gray-500">
          <i className="fa-light fa-car tw-text-4xl tw-mb-3"></i>
          <p>No vehicles found matching filters</p>
        </div>
      ) : (
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 xl:tw-grid-cols-4 tw-gap-4">
          {filteredPositions.map((vehicle) => (
            <div key={vehicle.vehicleId} className="vehicle-card">
              {/* Header */}
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                <div>
                  <div className="tw-font-semibold tw-text-gray-800">
                    {vehicle.vehicleNumber || vehicle.registrationNo}
                  </div>
                  <div className="tw-text-xs tw-text-gray-500">
                    {vehicle.vehicleType}
                  </div>
                </div>
                <div className="data-quality">
                  <span className={`quality-dot ${getDataQualityClass(vehicle.dataQuality)}`}></span>
                  <span className="tw-text-gray-500">{vehicle.dataQuality || 0}%</span>
                </div>
              </div>

              {/* Fuel Gauge */}
              <div className="tw-mb-3">
                <div className="tw-flex tw-items-center tw-justify-between tw-text-sm tw-mb-1">
                  <span className="tw-text-gray-600">Fuel Level</span>
                  <span className="tw-font-semibold">{vehicle.fuelLevelPercent?.toFixed(1) || 0}%</span>
                </div>
                <div className="fuel-gauge">
                  <div
                    className={`fuel-level ${getFuelLevelClass(vehicle.fuelLevelPercent)}`}
                    style={{ width: `${Math.min(vehicle.fuelLevelPercent || 0, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Volume */}
              <div className="tw-grid tw-grid-cols-2 tw-gap-2 tw-text-sm tw-mb-3">
                <div>
                  <span className="tw-text-gray-500 tw-block">Current</span>
                  <span className="tw-font-semibold">{vehicle.currentFuelVolume?.toLocaleString() || 0} L</span>
                </div>
                <div>
                  <span className="tw-text-gray-500 tw-block">Capacity</span>
                  <span className="tw-font-semibold">{vehicle.tankCapacity?.toLocaleString() || 0} L</span>
                </div>
              </div>

              {/* Last Update */}
              <div className="tw-text-xs tw-text-gray-400 tw-flex tw-items-center tw-justify-between tw-pt-2 tw-border-t tw-border-gray-100">
                <span>
                  <i className="fa-light fa-clock tw-mr-1"></i>
                  {formatLastUpdate(vehicle.lastGpsUpdate)}
                </span>
                {vehicle.isMoving && (
                  <span className="tw-text-green-600">
                    <i className="fa-light fa-car-side"></i> Moving
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Legend */}
      <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
        <div className="tw-flex tw-items-center tw-gap-8 tw-text-xs tw-text-gray-600">
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-font-medium">Fuel Level:</span>
            <span className="tw-flex tw-items-center tw-gap-1"><span className="tw-w-3 tw-h-3 tw-rounded tw-bg-red-500"></span> Low (&le;20%)</span>
            <span className="tw-flex tw-items-center tw-gap-1"><span className="tw-w-3 tw-h-3 tw-rounded tw-bg-yellow-500"></span> Medium (21-50%)</span>
            <span className="tw-flex tw-items-center tw-gap-1"><span className="tw-w-3 tw-h-3 tw-rounded tw-bg-green-500"></span> High (&gt;50%)</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            <span className="tw-font-medium">Data Quality:</span>
            <span className="tw-flex tw-items-center tw-gap-1"><span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-green-500"></span> Good</span>
            <span className="tw-flex tw-items-center tw-gap-1"><span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-yellow-500"></span> Warning</span>
            <span className="tw-flex tw-items-center tw-gap-1"><span className="tw-w-2 tw-h-2 tw-rounded-full tw-bg-red-500"></span> Poor</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GPSFleetMonitor;
