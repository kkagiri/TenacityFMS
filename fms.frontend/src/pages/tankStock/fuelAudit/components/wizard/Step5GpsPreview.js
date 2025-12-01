/**
 * Step5GpsPreview.js
 * Step 5: Fuel Data Preview by Vehicle Category
 *
 * This step shows fuel data preview for selected vehicles grouped by category:
 * 1. Site GPS Fleet - Fetch opening/closing from GPSGate REST API
 * 2. Site Full Tank (No GPS) - Use fuel added = consumption estimate
 * 3. Site Equipment (No GPS) - Track fuel issued only
 * 4. Cross-Site Company - Fetch from GPSGate SOAP Report 212
 * 5. External Non-Company - Track fuel issued for accounting only
 *
 * Each category has its own data source and confidence level.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import DataGrid, { Column, Selection, Paging, Scrolling } from 'devextreme-react/data-grid';
import { Button } from 'devextreme-react/button';
import { LoadIndicator } from 'devextreme-react/load-indicator';
import { ProgressBar } from 'devextreme-react/progress-bar';

import {
  fetchCategoryAuditData,
  selectWizard,
  selectLoading
} from '../../../../../redux/slices/fuelAuditSlice';

// Category configuration matching Step4
const CATEGORY_CONFIG = {
  1: {
    name: 'Site GPS Fleet',
    icon: 'fa-satellite',
    bgColor: 'tw-bg-green-50',
    borderColor: 'tw-border-green-200',
    textColor: 'tw-text-green-700',
    badgeColor: 'tw-bg-green-100 tw-text-green-800',
    confidence: 'HIGH',
    dataSource: 'GPS REST API',
    description: 'Real-time opening/closing fuel from GPS tracks',
    canFetchGps: true
  },
  2: {
    name: 'Site Full Tank (No GPS)',
    icon: 'fa-truck',
    bgColor: 'tw-bg-yellow-50',
    borderColor: 'tw-border-yellow-200',
    textColor: 'tw-text-yellow-700',
    badgeColor: 'tw-bg-yellow-100 tw-text-yellow-800',
    confidence: 'MEDIUM',
    dataSource: 'Fuel Added = Consumption',
    description: 'Consumption estimated from total fuel added',
    canFetchGps: false
  },
  3: {
    name: 'Site Equipment (No GPS)',
    icon: 'fa-gear',
    bgColor: 'tw-bg-orange-50',
    borderColor: 'tw-border-orange-200',
    textColor: 'tw-text-orange-700',
    badgeColor: 'tw-bg-orange-100 tw-text-orange-800',
    confidence: 'LOW',
    dataSource: 'Fuel Issued Only',
    description: 'Track fuel dispensed, no consumption calculation',
    canFetchGps: false
  },
  4: {
    name: 'Cross-Site Company',
    icon: 'fa-arrow-right-arrow-left',
    bgColor: 'tw-bg-cyan-50',
    borderColor: 'tw-border-cyan-200',
    textColor: 'tw-text-cyan-700',
    badgeColor: 'tw-bg-cyan-100 tw-text-cyan-800',
    confidence: 'HIGH',
    dataSource: 'GPS SOAP Report 212',
    description: 'Refuel events from SOAP API historical data',
    canFetchGps: true
  },
  5: {
    name: 'External Non-Company',
    icon: 'fa-user-plus',
    bgColor: 'tw-bg-pink-50',
    borderColor: 'tw-border-pink-200',
    textColor: 'tw-text-pink-700',
    badgeColor: 'tw-bg-pink-100 tw-text-pink-800',
    confidence: 'ACCOUNTED',
    dataSource: 'Fuel Issued Only',
    description: 'Fuel accountability for external/contractor vehicles',
    canFetchGps: false
  }
};

const Step5GpsPreview = () => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const loading = useSelector(selectLoading);

  // Track which categories have been loaded
  const [loadedCategories, setLoadedCategories] = useState({});
  const [loadingCategory, setLoadingCategory] = useState(null);
  const [categoryProgress, setCategoryProgress] = useState(0);
  // Expanded accordion items (by category)
  const [expandedCategories, setExpandedCategories] = useState([0, 3]); // Default: Site GPS and Cross-Site

  // Get selected vehicles from wizard (already have category from Step 4)
  const selectedVehicles = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    return tankRefills.filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId));
  }, [wizard.tankRefills, wizard.selectedVehicleIds]);

  // Group selected vehicles by category
  const vehiclesByCategory = useMemo(() => {
    const grouped = {};
    for (let i = 1; i <= 5; i++) {
      grouped[i] = [];
    }
    selectedVehicles.forEach(vehicle => {
      const category = vehicle.vehicleCategory || 5;
      if (grouped[category]) {
        grouped[category].push(vehicle);
      }
    });
    return grouped;
  }, [selectedVehicles]);

  // Calculate category statistics
  const categoryStats = useMemo(() => {
    const stats = {};
    Object.keys(vehiclesByCategory).forEach(cat => {
      const vehicles = vehiclesByCategory[cat];
      stats[cat] = {
        count: vehicles.length,
        totalFuel: vehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
        loaded: loadedCategories[cat] || false
      };
    });
    return stats;
  }, [vehiclesByCategory, loadedCategories]);

  // Handle loading GPS data for a specific category
  const handleLoadCategoryData = useCallback(async (categoryId) => {
    const vehicles = vehiclesByCategory[categoryId];
    if (!vehicles?.length) return;

    const config = CATEGORY_CONFIG[categoryId];
    if (!config.canFetchGps) {
      // For non-GPS categories, just mark as loaded (data comes from FuelRefill)
      setLoadedCategories(prev => ({ ...prev, [categoryId]: true }));
      return;
    }

    setLoadingCategory(categoryId);
    setCategoryProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setCategoryProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Use category-aware endpoint for single category
      await dispatch(fetchCategoryAuditData({
        vehicles: vehicles,
        startDate: wizard.periodStart,
        endDate: wizard.periodEnd,
        auditSiteId: wizard.selectedSiteId
      }));

      clearInterval(progressInterval);
      setCategoryProgress(100);

      // Mark category as loaded
      setLoadedCategories(prev => ({ ...prev, [categoryId]: true }));
    } catch (error) {
      console.error(`Error loading category ${categoryId} data:`, error);
    } finally {
      setTimeout(() => {
        setLoadingCategory(null);
        setCategoryProgress(0);
      }, 500);
    }
  }, [vehiclesByCategory, wizard.periodStart, wizard.periodEnd, wizard.selectedSiteId, dispatch]);

  // Handle loading all categories with the category-aware endpoint
  const handleLoadAllGpsData = useCallback(async () => {
    setLoadingCategory('all');
    setCategoryProgress(0);

    try {
      // Simulate progress for UX
      const progressInterval = setInterval(() => {
        setCategoryProgress(prev => Math.min(prev + 5, 90));
      }, 300);

      // Call the new category-aware endpoint with all vehicles
      await dispatch(fetchCategoryAuditData({
        vehicles: selectedVehicles,
        startDate: wizard.periodStart,
        endDate: wizard.periodEnd,
        auditSiteId: wizard.selectedSiteId
      }));

      clearInterval(progressInterval);
      setCategoryProgress(100);

      // Mark all categories as loaded
      const loadedCats = {};
      Object.keys(CATEGORY_CONFIG).forEach(catId => {
        if (vehiclesByCategory[catId]?.length > 0) {
          loadedCats[catId] = true;
        }
      });
      setLoadedCategories(loadedCats);
    } catch (error) {
      console.error('Error loading category audit data:', error);
    } finally {
      setTimeout(() => {
        setLoadingCategory(null);
        setCategoryProgress(0);
      }, 500);
    }
  }, [selectedVehicles, wizard.periodStart, wizard.periodEnd, wizard.selectedSiteId, dispatch, vehiclesByCategory]);

  // Toggle category expansion
  const toggleCategory = (catIndex) => {
    setExpandedCategories(prev =>
      prev.includes(catIndex)
        ? prev.filter(i => i !== catIndex)
        : [...prev, catIndex]
    );
  };

  // Render data source badge
  const renderDataSource = (source) => {
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
  };

  // Render category title
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
          {stats.loaded && (
            <span className="tw-text-xs tw-text-green-600">
              <i className="fa-light fa-check-circle tw-mr-1"></i>
              Loaded
            </span>
          )}
        </div>
      </div>
    );
  };

  // Render category content
  const renderCategoryContent = (categoryId) => {
    const vehicles = vehiclesByCategory[categoryId];
    const config = CATEGORY_CONFIG[categoryId];
    const isLoading = loadingCategory === categoryId;

    if (vehicles.length === 0) {
      return (
        <div className={`tw-p-4 tw-text-center tw-text-gray-500 ${config.bgColor} tw-rounded-lg`}>
          <p>No vehicles selected in this category</p>
        </div>
      );
    }

    return (
      <div className={`tw-border tw-rounded-lg tw-overflow-hidden ${config.borderColor}`}>
        {/* Category info bar */}
        <div className={`tw-px-4 tw-py-2 tw-flex tw-items-center tw-justify-between ${config.bgColor}`}>
          <div>
            <p className="tw-text-xs tw-text-gray-600">{config.description}</p>
            <p className="tw-text-xs tw-text-gray-500 tw-mt-0.5">
              Data Source: <span className="tw-font-medium">{config.dataSource}</span>
            </p>
          </div>
          {config.canFetchGps && !loadedCategories[categoryId] && (
            <Button
              text={isLoading ? 'Loading...' : 'Load GPS Data'}
              icon={isLoading ? '' : 'refresh'}
              type="default"
              stylingMode="outlined"
              onClick={() => handleLoadCategoryData(categoryId)}
              disabled={isLoading}
            />
          )}
        </div>

        {/* Loading progress */}
        {isLoading && (
          <div className="tw-px-4 tw-py-2 tw-bg-white">
            <ProgressBar
              value={categoryProgress}
              width="100%"
              showStatus={true}
              statusFormat={(value) => `Loading GPS data... ${Math.round(value)}%`}
            />
          </div>
        )}

        {/* Vehicle data grid */}
        <DataGrid
          dataSource={vehicles}
          keyExpr="vehicleId"
          showBorders={false}
          columnAutoWidth={true}
          rowAlternationEnabled={true}
          height={Math.min(200, vehicles.length * 40 + 50)}
        >
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

          {/* Show opening/closing only for GPS categories */}
          {config.canFetchGps && (
            <>
              <Column
                dataField="openingFuel"
                caption="Opening (L)"
                width={100}
                dataType="number"
                format="#,##0.0"
                alignment="right"
                cellRender={(cellData) => {
                  const value = cellData.value;
                  if (value === null || value === undefined) {
                    return <span className="tw-text-gray-400 tw-italic">-</span>;
                  }
                  return value.toFixed(1);
                }}
              />
              <Column
                dataField="closingFuel"
                caption="Closing (L)"
                width={100}
                dataType="number"
                format="#,##0.0"
                alignment="right"
                cellRender={(cellData) => {
                  const value = cellData.value;
                  if (value === null || value === undefined) {
                    return <span className="tw-text-gray-400 tw-italic">-</span>;
                  }
                  return value.toFixed(1);
                }}
              />
              <Column
                dataField="consumption"
                caption="Used (L)"
                width={90}
                dataType="number"
                format="#,##0.0"
                alignment="right"
                cellRender={(cellData) => {
                  const value = cellData.value;
                  if (value === null || value === undefined) {
                    return <span className="tw-text-gray-400 tw-italic">-</span>;
                  }
                  return (
                    <span className={value > 0 ? 'tw-text-red-600' : 'tw-text-green-600'}>
                      {value.toFixed(1)}
                    </span>
                  );
                }}
              />
            </>
          )}

          <Column
            dataField="dataSourcePrimary"
            caption="Source"
            width={90}
            cellRender={(cellData) => renderDataSource(cellData.value)}
            alignment="center"
          />
        </DataGrid>
      </div>
    );
  };

  // Calculate totals
  const totals = useMemo(() => {
    return {
      vehicles: selectedVehicles.length,
      fuelIssued: selectedVehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0),
      withGps: selectedVehicles.filter(v => [1, 4].includes(v.vehicleCategory)).length,
      consumption: selectedVehicles.reduce((sum, v) => sum + (v.consumption || 0), 0)
    };
  }, [selectedVehicles]);

  return (
    <div className="wizard-step tw-p-6">
      <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
        <i className="fa-light fa-chart-mixed tw-mr-2"></i>
        Fuel Data Preview by Category
      </h3>
      <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
        Review fuel data for selected vehicles. Each category uses different data sources with varying confidence levels.
      </p>

      {/* Summary stats bar */}
      <div className="tw-mb-4 tw-grid tw-grid-cols-4 tw-gap-3">
        <div className="tw-bg-blue-50 tw-p-3 tw-rounded-lg tw-text-center tw-border tw-border-blue-200">
          <p className="tw-text-2xl tw-font-bold tw-text-blue-700">{totals.vehicles}</p>
          <p className="tw-text-xs tw-text-blue-600">Vehicles Selected</p>
        </div>
        <div className="tw-bg-green-50 tw-p-3 tw-rounded-lg tw-text-center tw-border tw-border-green-200">
          <p className="tw-text-2xl tw-font-bold tw-text-green-700">{totals.withGps}</p>
          <p className="tw-text-xs tw-text-green-600">With GPS Data</p>
        </div>
        <div className="tw-bg-orange-50 tw-p-3 tw-rounded-lg tw-text-center tw-border tw-border-orange-200">
          <p className="tw-text-2xl tw-font-bold tw-text-orange-700">
            {totals.fuelIssued.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
          </p>
          <p className="tw-text-xs tw-text-orange-600">Total Fuel Issued</p>
        </div>
        <div className="tw-bg-purple-50 tw-p-3 tw-rounded-lg tw-text-center tw-border tw-border-purple-200">
          <p className="tw-text-2xl tw-font-bold tw-text-purple-700">
            {totals.consumption > 0 ? totals.consumption.toLocaleString(undefined, { maximumFractionDigits: 0 }) : '—'} L
          </p>
          <p className="tw-text-xs tw-text-purple-600">Consumption (GPS)</p>
        </div>
      </div>

      {/* Load all button */}
      {selectedVehicles.some(v => [1, 4].includes(v.vehicleCategory)) && !loading.gpsPreview && (
        <div className="tw-mb-4 tw-flex tw-justify-end">
          <Button
            text="Load All GPS Data"
            icon="download"
            type="default"
            onClick={handleLoadAllGpsData}
            disabled={loadingCategory !== null}
          />
        </div>
      )}

      {/* Global loading state */}
      {loading.gpsPreview && !loadingCategory && (
        <div className="tw-flex tw-items-center tw-justify-center tw-py-10">
          <LoadIndicator />
          <span className="tw-ml-3 tw-text-gray-600">Loading GPS fuel data...</span>
        </div>
      )}

      {/* Category accordions */}
      {selectedVehicles.length > 0 && (
        <div className="tw-space-y-3">
          {Object.keys(CATEGORY_CONFIG).map(catId => {
            const catIndex = parseInt(catId) - 1;
            const hasVehicles = vehiclesByCategory[catId]?.length > 0;

            if (!hasVehicles) return null;

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
                    {renderCategoryContent(parseInt(catId))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Legend */}
      <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border">
        <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          Data Source Legend
        </h4>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 tw-gap-3 tw-text-xs">
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('GPS_REST')}
            <span className="tw-text-gray-600">Real-time GPS tracks</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('GPS_SOAP')}
            <span className="tw-text-gray-600">Historical refuel events</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('Estimated')}
            <span className="tw-text-gray-600">Calculated estimate</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('FuelRefill')}
            <span className="tw-text-gray-600">Manual entry data</span>
          </div>
          <div className="tw-flex tw-items-center tw-gap-2">
            {renderDataSource('Unavailable')}
            <span className="tw-text-gray-600">No data available</span>
          </div>
        </div>
      </div>

      {/* No vehicles selected */}
      {selectedVehicles.length === 0 && (
        <div className="tw-text-center tw-py-10 tw-bg-yellow-50 tw-rounded-lg tw-border tw-border-yellow-200">
          <i className="fa-light fa-exclamation-circle tw-text-4xl tw-text-yellow-500 tw-mb-3"></i>
          <p className="tw-text-gray-700">No vehicles selected.</p>
          <p className="tw-text-sm tw-text-gray-500 tw-mt-1">
            Please go back to Step 4 and select at least one vehicle.
          </p>
        </div>
      )}
    </div>
  );
};

export default Step5GpsPreview;
