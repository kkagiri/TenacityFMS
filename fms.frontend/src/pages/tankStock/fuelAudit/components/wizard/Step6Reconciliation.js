/**
 * Step6Reconciliation.js
 * Step 6: Fuel Reconciliation View
 *
 * Shows the complete fuel reconciliation breakdown:
 * Opening Position (Vehicles + Tankers) + Deliveries In - Consumption = Closing Position
 *
 * Features:
 * - Opening Stock breakdown by vehicle category
 * - Tanker (FT/ST) opening stock
 * - Deliveries (external fuel in)
 * - GPS-confirmed consumption per vehicle
 * - Closing stock breakdown
 * - Overall variance calculation
 * - Editable values for adjustments
 */

import React, { useMemo, useState, useCallback, memo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import DataGrid, {
  Column,
  Paging,
  Scrolling,
  Summary,
  TotalItem,
  Editing
} from 'devextreme-react/data-grid';
import { NumberBox } from 'devextreme-react/number-box';

import { selectWizard, updateVehicleFuelData } from '../../../../../redux/slices/fuelAuditSlice';

// Category configuration
const CATEGORY_CONFIG = {
  1: { name: 'Site GPS Fleet', icon: 'fa-satellite-dish', color: 'tw-text-blue-600', bgColor: 'tw-bg-blue-50', hasGpsData: true },
  2: { name: 'Full Tank Policy', icon: 'fa-gas-pump', color: 'tw-text-yellow-600', bgColor: 'tw-bg-yellow-50', hasGpsData: false },
  3: { name: 'Site Equipment', icon: 'fa-tractor', color: 'tw-text-green-600', bgColor: 'tw-bg-green-50', hasGpsData: false },
  4: { name: 'Cross-Site Company', icon: 'fa-route', color: 'tw-text-purple-600', bgColor: 'tw-bg-purple-50', hasGpsData: true },
  5: { name: 'External Non-Company', icon: 'fa-building', color: 'tw-text-gray-600', bgColor: 'tw-bg-gray-50', hasGpsData: false }
};

const Step6Reconciliation = memo(() => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const [expandedSections, setExpandedSections] = useState({
    opening: true,
    movements: true,
    closing: true,
    reconciliation: true
  });

  // Get selected vehicles from wizard.tankRefills
  const selectedVehicles = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    return tankRefills.filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId));
  }, [wizard.tankRefills, wizard.selectedVehicleIds]);

  // Group vehicles by category
  const vehiclesByCategory = useMemo(() => {
    const grouped = { 1: [], 2: [], 3: [], 4: [], 5: [] };
    selectedVehicles.forEach(v => {
      const cat = v.vehicleCategory || 5;
      if (grouped[cat]) {
        grouped[cat].push(v);
      }
    });
    return grouped;
  }, [selectedVehicles]);

  // Tank data from wizard
  const tankData = useMemo(() => {
    const tankPreview = wizard.tankPreview || [];
    return {
      tanks: tankPreview,
      totalOpening: tankPreview.reduce((sum, t) => sum + (t.openingVolume || 0), 0),
      totalClosing: tankPreview.reduce((sum, t) => sum + (t.closingVolume || 0), 0),
      totalDeliveries: tankPreview.reduce((sum, t) => sum + (t.deliveries || 0), 0),
      totalDispensed: tankPreview.reduce((sum, t) => sum + (t.dispensed || 0), 0)
    };
  }, [wizard.tankPreview]);

  // Calculate reconciliation totals
  const reconciliation = useMemo(() => {
    // Opening stock per category
    const openingByCategory = {};
    const closingByCategory = {};
    const consumptionByCategory = {};
    const refueledByCategory = {};

    Object.keys(CATEGORY_CONFIG).forEach(cat => {
      const catNum = parseInt(cat);
      const vehicles = vehiclesByCategory[catNum] || [];

      openingByCategory[catNum] = vehicles.reduce((sum, v) => sum + (v.openingFuel || 0), 0);
      closingByCategory[catNum] = vehicles.reduce((sum, v) => sum + (v.closingFuel || 0), 0);
      consumptionByCategory[catNum] = vehicles.reduce((sum, v) => {
        // For GPS categories, use GPS measured consumption
        if (catNum === 1 || catNum === 4) {
          return sum + (v.gpsMeasuredConsumption || v.consumption || 0);
        }
        // For full tank policy, consumption = fuel refueled
        if (catNum === 2) {
          return sum + (v.totalFuelAmount || 0);
        }
        // For equipment and external, consumption = fuel issued
        return sum + (v.totalFuelAmount || 0);
      }, 0);
      refueledByCategory[catNum] = vehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
    });

    // Total opening position
    const totalVehicleOpening = Object.values(openingByCategory).reduce((a, b) => a + b, 0);
    const totalOpening = tankData.totalOpening + totalVehicleOpening;

    // Total closing position
    const totalVehicleClosing = Object.values(closingByCategory).reduce((a, b) => a + b, 0);
    const totalClosing = tankData.totalClosing + totalVehicleClosing;

    // Movements
    const totalDeliveries = tankData.totalDeliveries;
    const totalConsumption = Object.values(consumptionByCategory).reduce((a, b) => a + b, 0);
    const totalRefueled = Object.values(refueledByCategory).reduce((a, b) => a + b, 0);

    // Expected closing
    const expectedClosing = totalOpening + totalDeliveries - totalConsumption;

    // Variance
    const variance = totalClosing - expectedClosing;
    const variancePercent = totalOpening > 0 ? (variance / totalOpening) * 100 : 0;

    return {
      openingByCategory,
      closingByCategory,
      consumptionByCategory,
      refueledByCategory,
      totalVehicleOpening,
      totalVehicleClosing,
      tankOpening: tankData.totalOpening,
      tankClosing: tankData.totalClosing,
      totalOpening,
      totalClosing,
      totalDeliveries,
      totalConsumption,
      totalRefueled,
      expectedClosing,
      variance,
      variancePercent
    };
  }, [vehiclesByCategory, tankData]);

  // Toggle section expansion
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Format number with commas
  const formatNumber = (num, decimals = 0) => {
    if (num === null || num === undefined) return '-';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  };

  // Render category vehicle details
  const renderCategoryVehicles = (categoryId) => {
    const vehicles = vehiclesByCategory[categoryId] || [];
    const config = CATEGORY_CONFIG[categoryId];

    if (vehicles.length === 0) return null;

    return (
      <DataGrid
        dataSource={vehicles}
        keyExpr="vehicleId"
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        height="auto"
        className="tw-text-sm"
      >
        <Paging enabled={true} pageSize={10} />
        <Scrolling mode="standard" />
        <Editing
          mode="cell"
          allowUpdating={true}
        />

        <Column dataField="vehicleNo" caption="Vehicle" width={100} allowEditing={false} />
        <Column dataField="vehicleTypeName" caption="Type" width={90} allowEditing={false} />

        <Column
          dataField="openingFuel"
          caption="Opening (L)"
          width={100}
          dataType="number"
          format="#,##0"
          alignment="right"
          allowEditing={true}
          cellRender={(cellData) => (
            <span className="tw-text-gray-700">
              {formatNumber(cellData.value)}
            </span>
          )}
        />

        {config.hasGpsData && (
          <>
            <Column
              dataField="gpsMeasuredConsumption"
              caption="GPS Consump."
              width={110}
              dataType="number"
              format="#,##0"
              alignment="right"
              allowEditing={false}
              cellRender={(cellData) => (
                <span className="tw-text-red-600 tw-font-medium">
                  {cellData.value ? `-${formatNumber(cellData.value)}` : '-'}
                </span>
              )}
            />
          </>
        )}

        <Column
          dataField="totalFuelAmount"
          caption="Refueled (L)"
          width={100}
          dataType="number"
          format="#,##0"
          alignment="right"
          allowEditing={false}
          cellRender={(cellData) => (
            <span className="tw-text-green-600 tw-font-medium">
              {cellData.value ? `+${formatNumber(cellData.value)}` : '-'}
            </span>
          )}
        />

        <Column
          dataField="closingFuel"
          caption="Closing (L)"
          width={100}
          dataType="number"
          format="#,##0"
          alignment="right"
          allowEditing={true}
          cellRender={(cellData) => (
            <span className="tw-text-gray-700 tw-font-medium">
              {formatNumber(cellData.value)}
            </span>
          )}
        />

        <Column
          dataField="vehicleVariance"
          caption="Variance"
          width={90}
          dataType="number"
          format="#,##0.0"
          alignment="right"
          allowEditing={false}
          cellRender={(cellData) => {
            const value = cellData.value;
            if (value === null || value === undefined) return <span className="tw-text-gray-400">-</span>;
            const color = Math.abs(value) > 5 ? 'tw-text-red-600' : 'tw-text-gray-600';
            return (
              <span className={`tw-font-medium ${color}`}>
                {value >= 0 ? '+' : ''}{formatNumber(value, 1)}
              </span>
            );
          }}
        />

        <Column
          dataField="dataSourcePrimary"
          caption="Source"
          width={80}
          alignment="center"
          allowEditing={false}
          cellRender={(cellData) => {
            const source = cellData.value || 'N/A';
            const color = source === 'GPS_REST' || source === 'GPS_SOAP' ? 'tw-text-green-600' : 'tw-text-yellow-600';
            return <span className={`tw-text-xs ${color}`}>{source.replace('GPS_', '').replace('_', ' ')}</span>;
          }}
        />

        <Summary>
          <TotalItem
            column="openingFuel"
            summaryType="sum"
            valueFormat="#,##0"
            displayFormat="{0} L"
          />
          <TotalItem
            column="gpsMeasuredConsumption"
            summaryType="sum"
            valueFormat="#,##0"
            displayFormat="-{0} L"
          />
          <TotalItem
            column="totalFuelAmount"
            summaryType="sum"
            valueFormat="#,##0"
            displayFormat="+{0} L"
          />
          <TotalItem
            column="closingFuel"
            summaryType="sum"
            valueFormat="#,##0"
            displayFormat="{0} L"
          />
        </Summary>
      </DataGrid>
    );
  };

  // Render section header
  const renderSectionHeader = (title, icon, section, value, valueColor = 'tw-text-gray-800') => (
    <div
      className="tw-flex tw-items-center tw-justify-between tw-p-4 tw-bg-gray-100 tw-rounded-t-lg tw-cursor-pointer hover:tw-bg-gray-200 tw-transition-colors"
      onClick={() => toggleSection(section)}
    >
      <div className="tw-flex tw-items-center tw-gap-3">
        <i className={`fa-light ${icon} tw-text-lg tw-text-gray-600`}></i>
        <h3 className="tw-font-semibold tw-text-gray-800">{title}</h3>
      </div>
      <div className="tw-flex tw-items-center tw-gap-4">
        <span className={`tw-text-xl tw-font-bold ${valueColor}`}>
          {formatNumber(value)} L
        </span>
        <i className={`fa-light ${expandedSections[section] ? 'fa-chevron-up' : 'fa-chevron-down'} tw-text-gray-500`}></i>
      </div>
    </div>
  );

  return (
    <div className="wizard-step tw-p-6 tw-overflow-auto">
      <div className="tw-flex tw-items-center tw-mb-6">
        <i className="fa-light fa-scale-balanced tw-mr-2 tw-text-lg tw-text-blue-600"></i>
        <h3 className="tw-text-lg tw-font-semibold">Fuel Reconciliation</h3>
        <span className="tw-ml-3 tw-text-sm tw-text-gray-500">
          Period: {wizard.periodStart ? new Date(wizard.periodStart).toLocaleDateString() : 'N/A'} - {wizard.periodEnd ? new Date(wizard.periodEnd).toLocaleDateString() : 'N/A'}
        </span>
      </div>

      {/* Reconciliation Formula Banner */}
      <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-4 tw-text-sm tw-font-medium">
          <span className="tw-text-blue-700">Opening Stock</span>
          <span className="tw-text-gray-400">+</span>
          <span className="tw-text-green-700">Deliveries In</span>
          <span className="tw-text-gray-400">−</span>
          <span className="tw-text-red-700">Consumption</span>
          <span className="tw-text-gray-400">=</span>
          <span className="tw-text-purple-700">Expected Closing</span>
        </div>
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-4 tw-mt-2 tw-text-lg tw-font-bold">
          <span className="tw-text-blue-700">{formatNumber(reconciliation.totalOpening)}</span>
          <span className="tw-text-gray-400">+</span>
          <span className="tw-text-green-700">{formatNumber(reconciliation.totalDeliveries)}</span>
          <span className="tw-text-gray-400">−</span>
          <span className="tw-text-red-700">{formatNumber(reconciliation.totalConsumption)}</span>
          <span className="tw-text-gray-400">=</span>
          <span className="tw-text-purple-700">{formatNumber(reconciliation.expectedClosing)}</span>
        </div>
      </div>

      {/* OPENING STOCK SECTION */}
      <div className="tw-mb-6 tw-border tw-rounded-lg tw-overflow-hidden">
        {renderSectionHeader('Opening Stock (Start of Audit Period)', 'fa-play-circle', 'opening', reconciliation.totalOpening, 'tw-text-blue-600')}

        {expandedSections.opening && (
          <div className="tw-p-4 tw-bg-white">
            {/* Tank Opening Stock */}
            <div className="tw-mb-4">
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2 tw-flex tw-items-center">
                <i className="fa-light fa-database tw-mr-2 tw-text-green-600"></i>
                Tank Stock (FT & ST)
              </h4>
              <div className="tw-bg-green-50 tw-rounded tw-p-3">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-gray-600">Total Tank Opening:</span>
                  <span className="tw-text-lg tw-font-bold tw-text-green-700">{formatNumber(reconciliation.tankOpening)} L</span>
                </div>
                {tankData.tanks.length > 0 && (
                  <div className="tw-mt-2 tw-text-xs tw-text-gray-500">
                    {tankData.tanks.map(t => (
                      <div key={t.tankId} className="tw-flex tw-justify-between">
                        <span>{t.tankName}:</span>
                        <span>{formatNumber(t.openingVolume)} L</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Vehicle Opening Stock by Category */}
            <div>
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2 tw-flex tw-items-center">
                <i className="fa-light fa-truck tw-mr-2 tw-text-blue-600"></i>
                Fleet Dead Stock (Vehicles)
              </h4>

              {Object.keys(CATEGORY_CONFIG).map(catId => {
                const catNum = parseInt(catId);
                const config = CATEGORY_CONFIG[catNum];
                const vehicles = vehiclesByCategory[catNum] || [];
                const opening = reconciliation.openingByCategory[catNum] || 0;

                if (vehicles.length === 0) return null;

                return (
                  <div key={catId} className={`tw-mb-3 tw-rounded tw-overflow-hidden tw-border ${config.bgColor}`}>
                    <div className="tw-p-3 tw-flex tw-justify-between tw-items-center">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className={`fa-light ${config.icon} ${config.color}`}></i>
                        <span className="tw-font-medium tw-text-gray-700">{config.name}</span>
                        <span className="tw-text-xs tw-text-gray-500">({vehicles.length} vehicles)</span>
                      </div>
                      <span className={`tw-font-bold ${config.color}`}>{formatNumber(opening)} L</span>
                    </div>
                    <div className="tw-bg-white tw-border-t">
                      {renderCategoryVehicles(catNum)}
                    </div>
                  </div>
                );
              })}

              {/* Total Fleet Dead Stock */}
              <div className="tw-bg-blue-100 tw-rounded tw-p-3 tw-mt-3">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-font-medium tw-text-blue-800">Total Fleet Dead Stock:</span>
                  <span className="tw-text-lg tw-font-bold tw-text-blue-700">{formatNumber(reconciliation.totalVehicleOpening)} L</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MOVEMENTS SECTION */}
      <div className="tw-mb-6 tw-border tw-rounded-lg tw-overflow-hidden">
        {renderSectionHeader('Movements During Period', 'fa-arrows-alt', 'movements', reconciliation.totalDeliveries - reconciliation.totalConsumption,
          (reconciliation.totalDeliveries - reconciliation.totalConsumption) >= 0 ? 'tw-text-green-600' : 'tw-text-red-600')}

        {expandedSections.movements && (
          <div className="tw-p-4 tw-bg-white">
            {/* Deliveries In */}
            <div className="tw-mb-4">
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2 tw-flex tw-items-center">
                <i className="fa-light fa-truck-loading tw-mr-2 tw-text-green-600"></i>
                Deliveries to Site (External In)
              </h4>
              <div className="tw-bg-green-50 tw-rounded tw-p-3">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-gray-600">Total Deliveries:</span>
                  <span className="tw-text-lg tw-font-bold tw-text-green-700">+{formatNumber(reconciliation.totalDeliveries)} L</span>
                </div>
              </div>
            </div>

            {/* Consumption Out */}
            <div>
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2 tw-flex tw-items-center">
                <i className="fa-light fa-fire-alt tw-mr-2 tw-text-red-600"></i>
                Fleet Consumption (GPS Confirmed)
              </h4>

              {Object.keys(CATEGORY_CONFIG).map(catId => {
                const catNum = parseInt(catId);
                const config = CATEGORY_CONFIG[catNum];
                const vehicles = vehiclesByCategory[catNum] || [];
                const consumption = reconciliation.consumptionByCategory[catNum] || 0;

                if (vehicles.length === 0 || consumption === 0) return null;

                return (
                  <div key={catId} className={`tw-mb-2 tw-rounded tw-p-3 ${config.bgColor}`}>
                    <div className="tw-flex tw-justify-between tw-items-center">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className={`fa-light ${config.icon} ${config.color}`}></i>
                        <span className="tw-text-gray-700">{config.name}</span>
                        {config.hasGpsData && (
                          <span className="tw-text-xs tw-px-2 tw-py-0.5 tw-bg-green-100 tw-text-green-700 tw-rounded">GPS Verified</span>
                        )}
                      </div>
                      <span className={`tw-font-bold tw-text-red-600`}>−{formatNumber(consumption)} L</span>
                    </div>
                  </div>
                );
              })}

              {/* Total Consumption */}
              <div className="tw-bg-red-100 tw-rounded tw-p-3 tw-mt-3">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-font-medium tw-text-red-800">Total Consumption:</span>
                  <span className="tw-text-lg tw-font-bold tw-text-red-700">−{formatNumber(reconciliation.totalConsumption)} L</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CLOSING STOCK SECTION */}
      <div className="tw-mb-6 tw-border tw-rounded-lg tw-overflow-hidden">
        {renderSectionHeader('Closing Stock (End of Audit Period)', 'fa-stop-circle', 'closing', reconciliation.totalClosing, 'tw-text-purple-600')}

        {expandedSections.closing && (
          <div className="tw-p-4 tw-bg-white">
            {/* Tank Closing Stock */}
            <div className="tw-mb-4">
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2 tw-flex tw-items-center">
                <i className="fa-light fa-database tw-mr-2 tw-text-green-600"></i>
                Tank Stock (FT & ST)
              </h4>
              <div className="tw-bg-green-50 tw-rounded tw-p-3">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-text-gray-600">Total Tank Closing:</span>
                  <span className="tw-text-lg tw-font-bold tw-text-green-700">{formatNumber(reconciliation.tankClosing)} L</span>
                </div>
              </div>
            </div>

            {/* Vehicle Closing Stock */}
            <div>
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-2 tw-flex tw-items-center">
                <i className="fa-light fa-truck tw-mr-2 tw-text-blue-600"></i>
                Fleet Dead Stock (Vehicles)
              </h4>

              {Object.keys(CATEGORY_CONFIG).map(catId => {
                const catNum = parseInt(catId);
                const config = CATEGORY_CONFIG[catNum];
                const vehicles = vehiclesByCategory[catNum] || [];
                const closing = reconciliation.closingByCategory[catNum] || 0;

                if (vehicles.length === 0) return null;

                return (
                  <div key={catId} className={`tw-mb-2 tw-rounded tw-p-3 ${config.bgColor}`}>
                    <div className="tw-flex tw-justify-between tw-items-center">
                      <div className="tw-flex tw-items-center tw-gap-2">
                        <i className={`fa-light ${config.icon} ${config.color}`}></i>
                        <span className="tw-text-gray-700">{config.name}</span>
                        <span className="tw-text-xs tw-text-gray-500">({vehicles.length})</span>
                      </div>
                      <span className={`tw-font-bold ${config.color}`}>{formatNumber(closing)} L</span>
                    </div>
                  </div>
                );
              })}

              {/* Total Fleet Dead Stock */}
              <div className="tw-bg-purple-100 tw-rounded tw-p-3 tw-mt-3">
                <div className="tw-flex tw-justify-between tw-items-center">
                  <span className="tw-font-medium tw-text-purple-800">Total Fleet Dead Stock:</span>
                  <span className="tw-text-lg tw-font-bold tw-text-purple-700">{formatNumber(reconciliation.totalVehicleClosing)} L</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RECONCILIATION SUMMARY */}
      <div className="tw-border tw-rounded-lg tw-overflow-hidden">
        {renderSectionHeader('Reconciliation Summary', 'fa-scale-balanced', 'reconciliation', reconciliation.variance,
          Math.abs(reconciliation.variance) > 50 ? 'tw-text-red-600' : 'tw-text-green-600')}

        {expandedSections.reconciliation && (
          <div className="tw-p-4 tw-bg-white">
            <div className="tw-space-y-3">
              {/* Opening */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b">
                <span className="tw-text-gray-700">Total Opening Stock:</span>
                <span className="tw-font-bold tw-text-blue-700">{formatNumber(reconciliation.totalOpening)} L</span>
              </div>

              {/* + Deliveries */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b">
                <span className="tw-text-gray-700">+ Deliveries (External In):</span>
                <span className="tw-font-bold tw-text-green-700">+{formatNumber(reconciliation.totalDeliveries)} L</span>
              </div>

              {/* - Consumption */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b">
                <span className="tw-text-gray-700">− Consumption (GPS Confirmed):</span>
                <span className="tw-font-bold tw-text-red-700">−{formatNumber(reconciliation.totalConsumption)} L</span>
              </div>

              {/* Expected Closing */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-bg-gray-50 tw-px-3 tw--mx-3">
                <span className="tw-font-medium tw-text-gray-800">Expected Closing:</span>
                <span className="tw-font-bold tw-text-purple-700 tw-text-lg">{formatNumber(reconciliation.expectedClosing)} L</span>
              </div>

              {/* Actual Closing */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-2 tw-border-b tw-bg-gray-50 tw-px-3 tw--mx-3">
                <span className="tw-font-medium tw-text-gray-800">Actual Closing (Vehicles + Tankers):</span>
                <span className="tw-font-bold tw-text-purple-700 tw-text-lg">{formatNumber(reconciliation.totalClosing)} L</span>
              </div>

              {/* VARIANCE */}
              <div className={`tw-flex tw-justify-between tw-items-center tw-py-3 tw-px-4 tw-rounded-lg tw--mx-1 ${
                Math.abs(reconciliation.variance) > 50 ? 'tw-bg-red-100' : 'tw-bg-green-100'
              }`}>
                <div>
                  <span className={`tw-font-bold tw-text-lg ${
                    Math.abs(reconciliation.variance) > 50 ? 'tw-text-red-800' : 'tw-text-green-800'
                  }`}>VARIANCE:</span>
                  {Math.abs(reconciliation.variance) > 50 && (
                    <span className="tw-ml-2 tw-text-xs tw-px-2 tw-py-1 tw-bg-red-200 tw-text-red-800 tw-rounded">
                      <i className="fa-light fa-exclamation-triangle tw-mr-1"></i>
                      Exceeds Threshold
                    </span>
                  )}
                </div>
                <div className="tw-text-right">
                  <span className={`tw-font-bold tw-text-2xl ${
                    Math.abs(reconciliation.variance) > 50 ? 'tw-text-red-700' : 'tw-text-green-700'
                  }`}>
                    {reconciliation.variance >= 0 ? '+' : ''}{formatNumber(reconciliation.variance)} L
                  </span>
                  <span className={`tw-block tw-text-sm ${
                    Math.abs(reconciliation.variance) > 50 ? 'tw-text-red-600' : 'tw-text-green-600'
                  }`}>
                    ({reconciliation.variancePercent >= 0 ? '+' : ''}{reconciliation.variancePercent.toFixed(2)}%)
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      <div className="tw-mt-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg">
        <h4 className="tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">Vehicle Categories Legend</h4>
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-5 tw-gap-2">
          {Object.entries(CATEGORY_CONFIG).map(([catId, config]) => (
            <div key={catId} className="tw-flex tw-items-center tw-gap-2 tw-text-xs">
              <i className={`fa-light ${config.icon} ${config.color}`}></i>
              <span className="tw-text-gray-600">{config.name}</span>
              {config.hasGpsData && (
                <span className="tw-text-green-600">(GPS)</span>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});

export default Step6Reconciliation;
