/**
 * Step4VehicleSelection.js
 * Step 4: Vehicle Selection - Shows vehicles fueled from selected tanks
 *
 * This step loads fuel refill data from the selected tanks (Step 2)
 * for the audit period (Step 1) and displays vehicle summaries.
 *
 * Vehicles are now classified into 5 categories:
 * 1. Site GPS Fleet (at audit site, has GPS) - HIGH confidence
 * 2. Site Full Tank (at audit site, no GPS, km/L) - MEDIUM confidence
 * 3. Site Equipment (at audit site, no GPS, L/hr) - LOW confidence
 * 4. Cross-Site Company (different site, company-owned) - HIGH confidence
 * 5. External Non-Company (not company-owned) - ACCOUNTED only
 *
 * Data comes from FuelRefill table via /fuelaudit/tank-refills-preview endpoint
 */

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Column, Selection, Paging, Scrolling } from 'devextreme-react/data-grid';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { Button } from 'devextreme-react/button';

import {
  setSelectedVehicles,
  selectWizard,
  selectLoading,
  fetchTankRefillsPreview
} from '../../../../../redux/slices/fuelAuditSlice';

// Category configuration
const CATEGORY_CONFIG = {
  1: {
    name: 'Site GPS Fleet',
    icon: 'fa-satellite',
    color: 'green',
    bgColor: 'tw-bg-green-50',
    borderColor: 'tw-border-green-200',
    textColor: 'tw-text-green-700',
    badgeColor: 'tw-bg-green-100 tw-text-green-800',
    confidence: 'HIGH',
    description: 'Vehicles with GPS at this site. Opening/closing from REST API.'
  },
  2: {
    name: 'Site Full Tank (No GPS)',
    icon: 'fa-truck',
    color: 'yellow',
    bgColor: 'tw-bg-yellow-50',
    borderColor: 'tw-border-yellow-200',
    textColor: 'tw-text-yellow-700',
    badgeColor: 'tw-bg-yellow-100 tw-text-yellow-800',
    confidence: 'MEDIUM',
    description: 'Full tank vehicles without GPS. Consumption = Fuel Added.'
  },
  3: {
    name: 'Site Equipment (No GPS)',
    icon: 'fa-gear',
    color: 'orange',
    bgColor: 'tw-bg-orange-50',
    borderColor: 'tw-border-orange-200',
    textColor: 'tw-text-orange-700',
    badgeColor: 'tw-bg-orange-100 tw-text-orange-800',
    confidence: 'LOW',
    description: 'Equipment without GPS. Track fuel issued only.'
  },
  4: {
    name: 'Cross-Site Company',
    icon: 'fa-arrow-right-arrow-left',
    color: 'cyan',
    bgColor: 'tw-bg-cyan-50',
    borderColor: 'tw-border-cyan-200',
    textColor: 'tw-text-cyan-700',
    badgeColor: 'tw-bg-cyan-100 tw-text-cyan-800',
    confidence: 'HIGH',
    description: 'Company vehicles from other sites. Uses SOAP Report 212.'
  },
  5: {
    name: 'External Non-Company',
    icon: 'fa-user-plus',
    color: 'pink',
    bgColor: 'tw-bg-pink-50',
    borderColor: 'tw-border-pink-200',
    textColor: 'tw-text-pink-700',
    badgeColor: 'tw-bg-pink-100 tw-text-pink-800',
    confidence: 'ACCOUNTED',
    description: 'External/contractor vehicles. Track fuel issued only.'
  }
};

const Step4VehicleSelection = () => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const loading = useSelector(selectLoading);

  // Local state for selection
  const [selectedKeys, setSelectedKeys] = useState([]);
  // Expanded accordion items (by category)
  const [expandedCategories, setExpandedCategories] = useState([0, 1, 2, 3, 4]);

  // Sync local selection with Redux state
  useEffect(() => {
    setSelectedKeys(wizard.selectedVehicleIds ? [...wizard.selectedVehicleIds] : []);
  }, [wizard.selectedVehicleIds]);

  // Load refill data when step is reached
  const loadRefillData = useCallback(() => {
    if (wizard.selectedTankIds?.length > 0 && wizard.periodStart && wizard.periodEnd) {
      dispatch(fetchTankRefillsPreview({
        tankIds: wizard.selectedTankIds,
        startDate: wizard.periodStart,
        endDate: wizard.periodEnd,
        siteId: wizard.siteId
      }));
    }
  }, [dispatch, wizard.selectedTankIds, wizard.periodStart, wizard.periodEnd, wizard.siteId]);

  // Load on mount if we have required data
  useEffect(() => {
    if (wizard.selectedTankIds?.length > 0 && !wizard.tankRefills?.length) {
      loadRefillData();
    }
  }, [loadRefillData, wizard.selectedTankIds, wizard.tankRefills]);

  // Group vehicles by category
  const vehiclesByCategory = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    const grouped = {};

    // Initialize all categories
    for (let i = 1; i <= 5; i++) {
      grouped[i] = [];
    }

    // Group vehicles
    tankRefills.forEach(vehicle => {
      const category = vehicle.vehicleCategory || 5;
      if (grouped[category]) {
        grouped[category].push(vehicle);
      }
    });

    return grouped;
  }, [wizard.tankRefills]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = {};
    Object.keys(vehiclesByCategory).forEach(cat => {
      const vehicles = vehiclesByCategory[cat];
      stats[cat] = {
        count: vehicles.length,
        totalFuel: vehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
        selected: vehicles.filter(v => selectedKeys.includes(v.vehicleId)).length
      };
    });
    return stats;
  }, [vehiclesByCategory, selectedKeys]);

  // Handle selection change for a specific category
  const handleCategorySelectionChanged = useCallback((categoryId, e) => {
    const categoryVehicleIds = vehiclesByCategory[categoryId].map(v => v.vehicleId);
    const otherSelectedIds = selectedKeys.filter(id => !categoryVehicleIds.includes(id));
    const newSelection = [...otherSelectedIds, ...e.selectedRowKeys];
    setSelectedKeys(newSelection);
    dispatch(setSelectedVehicles(newSelection));
  }, [vehiclesByCategory, selectedKeys, dispatch]);

  // Select all in a category
  const handleSelectCategory = useCallback((categoryId) => {
    const categoryVehicleIds = vehiclesByCategory[categoryId].map(v => v.vehicleId);
    const newSelection = [...new Set([...selectedKeys, ...categoryVehicleIds])];
    setSelectedKeys(newSelection);
    dispatch(setSelectedVehicles(newSelection));
  }, [vehiclesByCategory, selectedKeys, dispatch]);

  // Deselect all in a category
  const handleDeselectCategory = useCallback((categoryId) => {
    const categoryVehicleIds = new Set(vehiclesByCategory[categoryId].map(v => v.vehicleId));
    const newSelection = selectedKeys.filter(id => !categoryVehicleIds.has(id));
    setSelectedKeys(newSelection);
    dispatch(setSelectedVehicles(newSelection));
  }, [vehiclesByCategory, selectedKeys, dispatch]);

  // Select all vehicles
  const handleSelectAll = useCallback(() => {
    const allIds = (wizard.tankRefills || []).map(v => v.vehicleId);
    setSelectedKeys(allIds);
    dispatch(setSelectedVehicles(allIds));
  }, [wizard.tankRefills, dispatch]);

  // Clear all selection
  const handleClearSelection = useCallback(() => {
    setSelectedKeys([]);
    dispatch(setSelectedVehicles([]));
  }, [dispatch]);

  // Format date
  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString();
  };

  // Toggle category expansion
  const toggleCategory = (catIndex) => {
    setExpandedCategories(prev =>
      prev.includes(catIndex)
        ? prev.filter(i => i !== catIndex)
        : [...prev, catIndex]
    );
  };

  // Render category header
  const renderCategoryTitle = (categoryId) => {
    const config = CATEGORY_CONFIG[categoryId];
    const stats = categoryStats[categoryId];

    return (
      <div className="tw-flex tw-items-center tw-justify-between tw-w-full tw-py-1">
        <div className="tw-flex tw-items-center tw-gap-3">
          <div className={`tw-w-8 tw-h-8 tw-rounded-lg tw-flex tw-items-center tw-justify-center ${config.bgColor}`}>
            <i className={`fa-light ${config.icon} ${config.textColor}`}></i>
          </div>
          <div>
            <span className="tw-font-semibold tw-text-gray-800">{config.name}</span>
            <span className="tw-text-gray-500 tw-text-sm tw-ml-2">
              ({stats.count} vehicle{stats.count !== 1 ? 's' : ''})
            </span>
          </div>
        </div>
        <div className="tw-flex tw-items-center tw-gap-3">
          <span className={`tw-px-2 tw-py-0.5 tw-rounded-full tw-text-xs tw-font-medium ${config.badgeColor}`}>
            {config.confidence}
          </span>
          {stats.count > 0 && (
            <span className="tw-text-sm tw-text-gray-600">
              {stats.selected}/{stats.count} selected
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render vehicle grid for a category
  const renderCategoryGrid = (categoryId) => {
    const vehicles = vehiclesByCategory[categoryId];
    const config = CATEGORY_CONFIG[categoryId];
    const categorySelectedKeys = selectedKeys.filter(id =>
      vehicles.some(v => v.vehicleId === id)
    );

    if (vehicles.length === 0) {
      return (
        <div className={`tw-p-4 tw-text-center tw-text-gray-500 ${config.bgColor} tw-rounded-lg`}>
          <i className={`fa-light ${config.icon} tw-text-2xl tw-mb-2 ${config.textColor}`}></i>
          <p>No vehicles in this category</p>
        </div>
      );
    }

    return (
      <div className={`tw-border tw-rounded-lg tw-overflow-hidden ${config.borderColor}`}>
        {/* Category action bar */}
        <div className={`tw-px-4 tw-py-2 tw-flex tw-items-center tw-justify-between ${config.bgColor}`}>
          <p className="tw-text-xs tw-text-gray-600">{config.description}</p>
          <div className="tw-flex tw-gap-2">
            <Button
              text="Select all"
              type="default"
              stylingMode="outlined"
              elementAttr={{ class: "tw-text-xs" }}
              onClick={() => handleSelectCategory(categoryId)}
            />
            {categorySelectedKeys.length > 0 && (
              <Button
                text="Clear"
                type="default"
                stylingMode="outlined"
                elementAttr={{ class: "tw-text-xs" }}
                onClick={() => handleDeselectCategory(categoryId)}
              />
            )}
          </div>
        </div>

        {/* DataGrid */}
        <DataGrid
          dataSource={vehicles}
          keyExpr="vehicleId"
          showBorders={false}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          height={Math.min(200, vehicles.length * 40 + 50)}
          selectedRowKeys={categorySelectedKeys}
          onSelectionChanged={(e) => handleCategorySelectionChanged(categoryId, e)}
        >
          <Selection mode="multiple" showCheckBoxesMode="always" />
          <Scrolling mode="virtual" />
          <Paging enabled={false} />

          <Column dataField="vehicleNo" caption="Vehicle" width={120} />
          <Column dataField="vehicleTypeName" caption="Type" width={100} />
          <Column dataField="driverName" caption="Driver" width={140} />
          <Column
            dataField="refillCount"
            caption="Refills"
            width={70}
            alignment="center"
            cellRender={(cellData) => (
              <span className="tw-px-2 tw-py-0.5 tw-rounded tw-bg-gray-100 tw-text-gray-700 tw-text-xs">
                {cellData.value}
              </span>
            )}
          />
          <Column
            dataField="totalFuelAmount"
            caption="Fuel (L)"
            width={90}
            dataType="number"
            format="#,##0.0"
            alignment="right"
          />
          <Column
            dataField="dataSourcePrimary"
            caption="Data Source"
            width={100}
            cellRender={(cellData) => {
              const source = cellData.value;
              const colors = {
                'GPS_REST': 'tw-bg-green-100 tw-text-green-700',
                'GPS_SOAP': 'tw-bg-cyan-100 tw-text-cyan-700',
                'Estimated': 'tw-bg-yellow-100 tw-text-yellow-700',
                'FuelRefill': 'tw-bg-gray-100 tw-text-gray-700',
                'Unavailable': 'tw-bg-red-100 tw-text-red-700'
              };
              return (
                <span className={`tw-px-2 tw-py-0.5 tw-rounded tw-text-xs ${colors[source] || 'tw-bg-gray-100'}`}>
                  {source?.replace('_', ' ') || 'N/A'}
                </span>
              );
            }}
          />
        </DataGrid>
      </div>
    );
  };

  const tankRefills = wizard.tankRefills || [];
  const isLoading = loading.tankRefills;

  return (
    <div className="wizard-step tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
        <i className="fa-light fa-truck tw-mr-2"></i>
        Select Vehicles for Audit
      </h3>
      <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
        Vehicles are grouped by category based on GPS availability and site assignment.
        Each category has different data sources and confidence levels.
      </p>

      {/* Period and tanks info */}
      {wizard.periodStart && wizard.periodEnd && (
        <div className="tw-mb-4 tw-p-3 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200 tw-flex tw-items-center tw-justify-between">
          <div className="tw-flex tw-items-center tw-gap-4">
            <div>
              <i className="fa-light fa-calendar tw-text-blue-600 tw-mr-2"></i>
              <span className="tw-text-sm tw-text-blue-800">
                {formatDate(wizard.periodStart)} — {formatDate(wizard.periodEnd)}
              </span>
            </div>
            <div>
              <i className="fa-light fa-database tw-text-blue-600 tw-mr-2"></i>
              <span className="tw-text-sm tw-text-blue-800">
                {wizard.selectedTankIds?.length || 0} tank(s)
              </span>
            </div>
            <div>
              <i className="fa-light fa-truck tw-text-blue-600 tw-mr-2"></i>
              <span className="tw-text-sm tw-text-blue-800">
                {tankRefills.length} vehicle(s) found
              </span>
            </div>
          </div>
          <Button
            text="Refresh"
            icon="refresh"
            type="normal"
            stylingMode="text"
            onClick={loadRefillData}
            disabled={isLoading}
          />
        </div>
      )}

      {/* Loading state */}
      {isLoading && (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-12">
          <LoadIndicator />
          <span className="tw-ml-3 tw-text-gray-600">Loading fuel refill data...</span>
        </div>
      )}

      {/* Vehicle categories accordion */}
      {!isLoading && tankRefills.length > 0 && (
        <>
          {/* Quick stats bar */}
          <div className="tw-mb-4 tw-grid tw-grid-cols-5 tw-gap-2">
            {Object.entries(CATEGORY_CONFIG).map(([catId, config]) => {
              const stats = categoryStats[catId];
              return (
                <div
                  key={catId}
                  className={`tw-p-2 tw-rounded-lg tw-text-center tw-border ${config.borderColor} ${config.bgColor}`}
                >
                  <div className="tw-flex tw-items-center tw-justify-center tw-gap-1">
                    <i className={`fa-light ${config.icon} ${config.textColor} tw-text-sm`}></i>
                    <span className={`tw-font-bold ${config.textColor}`}>{stats.count}</span>
                  </div>
                  <p className="tw-text-xs tw-text-gray-600 tw-truncate" title={config.name}>
                    {config.name.split(' ')[0]}
                  </p>
                </div>
              );
            })}
          </div>

          {/* Category accordions */}
          <div className="tw-space-y-3">
            {Object.keys(CATEGORY_CONFIG).map(catId => {
              const catIndex = parseInt(catId) - 1;
              return (
                <div key={catId} className="tw-border tw-rounded-lg tw-overflow-hidden">
                  <button
                    className="tw-w-full tw-px-4 tw-py-3 tw-bg-white hover:tw-bg-gray-50 tw-flex tw-items-center tw-justify-between tw-transition-colors"
                    onClick={() => toggleCategory(catIndex)}
                  >
                    {renderCategoryTitle(parseInt(catId))}
                    <i className={`fa-light fa-chevron-${expandedCategories.includes(catIndex) ? 'up' : 'down'} tw-text-gray-400 tw-ml-2`}></i>
                  </button>
                  {expandedCategories.includes(catIndex) && (
                    <div className="tw-border-t">
                      {renderCategoryGrid(parseInt(catId))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* Selection summary */}
          <div className="tw-mt-4 tw-p-4 tw-bg-gray-100 tw-rounded-lg tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-4">
              <span className="tw-text-sm tw-font-medium tw-text-gray-700">
                <i className="fa-light fa-check-square tw-mr-2 tw-text-blue-600"></i>
                {selectedKeys.length} of {tankRefills.length} vehicles selected
              </span>
              <span className="tw-text-sm tw-text-gray-500">
                Total fuel: {tankRefills.filter(v => selectedKeys.includes(v.vehicleId))
                  .reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0)
                  .toLocaleString(undefined, { maximumFractionDigits: 0 })} L
              </span>
            </div>
            <div className="tw-flex tw-gap-3">
              {selectedKeys.length > 0 && (
                <Button
                  text="Clear all"
                  type="default"
                  stylingMode="outlined"
                  onClick={handleClearSelection}
                />
              )}
              <Button
                text="Select all"
                type="default"
                stylingMode="outlined"
                onClick={handleSelectAll}
              />
            </div>
          </div>
        </>
      )}

      {/* No refills found */}
      {!isLoading && tankRefills.length === 0 && wizard.selectedTankIds?.length > 0 && (
        <div className="tw-text-center tw-py-10 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200">
          <i className="fa-light fa-gas-pump tw-text-4xl tw-text-yellow-500 tw-mb-3"></i>
          <p className="tw-text-gray-700 tw-font-medium">No fuel refills found</p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-2">
            No vehicles were fueled from the selected tanks during this period.
          </p>
          <Button
            text="Refresh Data"
            icon="refresh"
            type="default"
            className="tw-mt-4"
            onClick={loadRefillData}
          />
        </div>
      )}

      {/* No tanks selected */}
      {!wizard.selectedTankIds?.length && (
        <div className="tw-text-center tw-py-10 tw-bg-gray-50 tw-rounded-lg">
          <i className="fa-light fa-database tw-text-4xl tw-text-gray-400 tw-mb-3"></i>
          <p className="tw-text-gray-600">Please select tanks in Step 2 first.</p>
        </div>
      )}
    </div>
  );
};

export default Step4VehicleSelection;