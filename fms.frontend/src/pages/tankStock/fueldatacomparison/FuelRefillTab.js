/**
 * FuelRefillTab - Fuel Refill data tab integrated with FuelDataComparison
 *
 * Features:
 * - Display fuel refill table with filters (date range, site, tank)
 * - Uses HeaderStockFilters for date/site/tank selection
 * - Admin-only edit/delete functionality
 * - Export to Excel
 *
 * @returns {JSX.Element} Fuel Refill Tab Component
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { LoadPanel } from 'devextreme-react';
import notify from 'devextreme/ui/notify';
import { useStockFilters } from '../shared/context/StockFilterContext';
import HeaderStockFilters from '../shared/components/HeaderStockFilters';
import FuelRefillTable from './components/FuelRefillTable';
import { getFuelRefillList } from '../../../api/fuelRefillClient';
import './FuelRefillTab.scss';

const getRecordsFromResponse = (response) => {
  if (Array.isArray(response)) {
    return response;
  }

  if (Array.isArray(response?.details)) {
    return response.details;
  }

  if (Array.isArray(response?.data?.details)) {
    return response.data.details;
  }

  if (Array.isArray(response?.data)) {
    return response.data;
  }

  return [];
};

const normalizeFuelRefillRecord = (item, index) => {
  const normalizedDate = item.date || item.dispenseDate || item.dateCreated || null;
  const normalizedId = item.id ?? item.gpsEntryId ?? `${item.vehicleId || 'vehicle'}-${normalizedDate || index}-${index}`;

  return {
    ...item,
    rowKey: normalizedId,
    id: item.id ?? normalizedId,
    date: normalizedDate,
    manualFuelrefillAmount: item.manualFuelrefillAmount ?? item.manualVolume ?? 0,
    comment: item.comment ?? item.gpsModificationReason ?? ''
  };
};

/**
 * Statistics card component
 */
const StatCard = ({ icon, label, value, unit = '', color = 'blue' }) => {
  const colorClasses = {
    blue: 'tw-bg-blue-50 tw-text-blue-700 tw-border-blue-200',
    green: 'tw-bg-green-50 tw-text-green-700 tw-border-green-200',
    orange: 'tw-bg-orange-50 tw-text-orange-700 tw-border-orange-200',
    purple: 'tw-bg-purple-50 tw-text-purple-700 tw-border-purple-200'
  };

  return (
    <div className={`tw-p-4 tw-rounded-lg tw-border ${colorClasses[color]}`}>
      <div className="tw-flex tw-items-center tw-gap-3">
        <div className="tw-text-2xl">
          <i className={`fa-light ${icon}`}></i>
        </div>
        <div>
          <p className="tw-text-xs tw-opacity-75">{label}</p>
          <p className="tw-text-xl tw-font-bold">
            {typeof value === 'number' ? value.toLocaleString() : value}
            {unit && <span className="tw-text-sm tw-ml-1">{unit}</span>}
          </p>
        </div>
      </div>
    </div>
  );
};

const FuelRefillTab = () => {
  const dispatch = useDispatch();

  // Get filter context
  const {
    startDate,
    endDate,
    selectedSiteIds,
    selectedTankIds,
    setStartDate,
    setEndDate,
    setSelectedSiteIds,
    setSelectedTankIds
  } = useStockFilters();

  // State management
  const [isLoading, setIsLoading] = useState(false);
  const [fuelRefillData, setFuelRefillData] = useState([]);
  const [allSites, setAllSites] = useState([]);
  const [allVehicles, setAllVehicles] = useState([]);

  // Get sites and vehicles from Redux (if available)
  const sites = useSelector((state) => state.site?.sites || []);
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);

  useEffect(() => {
    if (sites.length > 0) {
      setAllSites(sites);
    }
    if (vehicles.length > 0) {
      setAllVehicles(vehicles);
    }
  }, [sites, vehicles]);

  /**
   * Load fuel refill data with current filters
   */
  const loadFuelRefillData = useCallback(async () => {
    if (!startDate || !endDate) {
      notify({
        message: 'Please select both start and end dates',
        type: 'warning',
        displayTime: 3000
      });
      return;
    }

    try {
      setIsLoading(true);

      // Prepare filter parameters
      const siteId = selectedSiteIds && selectedSiteIds.length > 0 ? selectedSiteIds[0] : null;
      const tankId = selectedTankIds && selectedTankIds.length > 0 ? selectedTankIds[0] : null;

      const response = await getFuelRefillList(
        {
          limit: 100,
          skip: 0,
          startDate: startDate?.toISOString ? startDate.toISOString() : startDate,
          endDate: endDate?.toISOString ? endDate.toISOString() : endDate,
          siteId,
          tankId
        }
      );

      const records = getRecordsFromResponse(response);

      if (records.length > 0) {
        const normalizedRecords = records.map(normalizeFuelRefillRecord);
        let filteredData = normalizedRecords;

        // Filter by tank if selected
        if (selectedTankIds && selectedTankIds.length > 0) {
          filteredData = filteredData.filter((item) =>
            selectedTankIds.includes(item.tankId)
          );
        }

        setFuelRefillData(filteredData);
      } else {
        setFuelRefillData([]);
      }
    } catch (error) {
      console.error('Error loading fuel refill data:', error);
      notify({
        message: 'Failed to load fuel refill data',
        type: 'error',
        displayTime: 3000
      });
      setFuelRefillData([]);
    } finally {
      setIsLoading(false);
    }
  }, [startDate, endDate, selectedSiteIds, selectedTankIds]);

  /**
   * Load data when filters change or component mounts
   */
  useEffect(() => {
    if (startDate && endDate) {
      loadFuelRefillData();
    }
  }, [loadFuelRefillData, startDate, endDate, selectedSiteIds, selectedTankIds]);

  /**
   * Calculate statistics
   */
  const statistics = useMemo(() => {
    return {
      totalRefills: fuelRefillData.length,
      totalFuelAmount: fuelRefillData.reduce((sum, item) => sum + (item.manualFuelrefillAmount || 0), 0),
      avgFuelAmount: fuelRefillData.length > 0
        ? fuelRefillData.reduce((sum, item) => sum + (item.manualFuelrefillAmount || 0), 0) / fuelRefillData.length
        : 0,
      vehiclesCount: new Set(fuelRefillData.map(item => item.vehicleId)).size
    };
  }, [fuelRefillData]);

  /**
   * Handle apply filters from header
   */
  const handleApplyFilters = useCallback(() => {
    loadFuelRefillData();
  }, [loadFuelRefillData]);

  return (
    <div className="fuel-refill-tab tw-p-6">
      <LoadPanel visible={isLoading} />

      {/* Header with title and description */}
      <div className="tw-mb-6">
        <h2 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-2">
          <i className="fa-light fa-gas-pump tw-mr-2"></i>
          Fuel Refill Data
        </h2>
        <p className="tw-text-gray-600">
          Manage and analyze fuel refill records. Edit or delete refill entries as needed.
        </p>
      </div>

      {/* Filters */}
      <div className="tw-mb-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
        <h3 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3">
          <i className="fa-light fa-sliders tw-mr-2"></i>
          Filters
        </h3>
        <HeaderStockFilters
          showUserFilter={false}
          onApplyFilters={handleApplyFilters}
        />
      </div>

      {/* Statistics */}
      {fuelRefillData.length > 0 && (
        <div className="tw-mb-6 tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4">
          <StatCard
            icon="fa-gas-pump"
            label="Total Refills"
            value={statistics.totalRefills}
            color="blue"
          />
          <StatCard
            icon="fa-droplet"
            label="Total Fuel"
            value={statistics.totalFuelAmount.toFixed(2)}
            unit="L"
            color="green"
          />
          <StatCard
            icon="fa-chart-simple"
            label="Average Refill"
            value={statistics.avgFuelAmount.toFixed(2)}
            unit="L"
            color="orange"
          />
          <StatCard
            icon="fa-truck"
            label="Vehicles"
            value={statistics.vehiclesCount}
            color="purple"
          />
        </div>
      )}

      {/* Data Table */}
      <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-overflow-hidden">
        <FuelRefillTable
          data={fuelRefillData}
          isLoading={isLoading}
          onRefresh={loadFuelRefillData}
          sites={allSites}
          vehicles={allVehicles}
        />
      </div>

      {/* No data message */}
      {!isLoading && fuelRefillData.length === 0 && startDate && endDate && (
        <div className="tw-mt-6 tw-text-center tw-py-10 tw-bg-gray-50 tw-rounded-lg tw-border tw-border-gray-200">
          <i className="fa-light fa-inbox tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <p className="tw-text-gray-600 tw-font-medium">No fuel refill data found</p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
            Try adjusting your filters or select a different date range.
          </p>
        </div>
      )}
    </div>
  );
};

export default FuelRefillTab;
