/**
 * Step6Reconciliation.js
 * Step 6: Fuel Reconciliation View
 *
 * Shows the complete fuel reconciliation breakdown:
 * Opening Position (Vehicles + Tanker) + Deliveries In - Actual Consumption = Closing Position (Vehicles + Tanker)
 *
 * Features:
 * - Opening Stock breakdown per vehicle with dead stock
 * - Tanker (FT/ST) opening stock
 * - Deliveries (external fuel in)
 * - GPS-confirmed consumption per vehicle
 * - Closing stock breakdown per vehicle
 * - Overall variance calculation
 * - Editable values for adjustments
 * - Export to Excel functionality (via Step6ReconciliationExport.js)
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

import { selectWizard, updateVehicleFuelData } from '../../../../../../redux/slices/fuelAuditSlice';
import { exportReconciliationToExcel, CATEGORY_CONFIG, formatNumber } from './Step6ReconciliationExport';

const Step6Reconciliation = memo(() => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const [expandedSections, setExpandedSections] = useState({
    opening: true,
    movements: true,
    closing: true,
    reconciliation: true
  });

  // Create local mutable copy of vehicles by category for DataGrid editing
  // Redux state is immutable, so DataGrid needs a mutable copy to edit
  const [localVehiclesByCategory, setLocalVehiclesByCategory] = useState({
    1: [], 2: [], 3: [], 4: [], 5: []
  });

  // Get selected vehicles from wizard.tankRefills
  const selectedVehicles = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    return tankRefills.filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId));
  }, [wizard.tankRefills, wizard.selectedVehicleIds]);

  // Group vehicles by category (from Redux - read only)
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

  // Sync Redux vehiclesByCategory to local mutable state for DataGrid editing
  React.useEffect(() => {
    const mutableCopy = {};
    Object.keys(vehiclesByCategory).forEach(cat => {
      // Create deep copy of each vehicle to make data mutable for DataGrid
      mutableCopy[cat] = (vehiclesByCategory[cat] || []).map(v => ({ ...v }));
    });
    setLocalVehiclesByCategory(mutableCopy);
  }, [vehiclesByCategory]);

  // Tank data from wizard
  const tankData = useMemo(() => {
    const tankPreview = wizard.tankPreview || [];
    return {
      tanks: tankPreview,
      totalOpening: tankPreview.reduce((sum, t) => sum + (t.openingVolume || t.openingStock || 0), 0),
      totalClosing: tankPreview.reduce((sum, t) => sum + (t.closingVolume || t.closingStock || 0), 0),
      totalDeliveries: tankPreview.reduce((sum, t) => sum + (t.deliveries || t.totalDeliveries || 0), 0),
      totalDispensed: tankPreview.reduce((sum, t) => sum + (t.dispensed || t.totalDispensed || 0), 0)
    };
  }, [wizard.tankPreview]);

  // Calculate reconciliation totals - use localVehiclesByCategory for accurate totals after edits
  const reconciliation = useMemo(() => {
    // Opening stock per category
    const openingByCategory = {};
    const closingByCategory = {};
    const consumptionByCategory = {};
    const refueledByCategory = {};

    Object.keys(CATEGORY_CONFIG).forEach(cat => {
      const catNum = parseInt(cat);
      const vehicles = localVehiclesByCategory[catNum] || [];

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

    // Expected closing = Opening + Deliveries - Consumption
    const expectedClosing = totalOpening + totalDeliveries - totalConsumption;

    // Variance = Actual Closing - Expected Closing
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
  }, [localVehiclesByCategory, tankData]);

  // Toggle section expansion
  const toggleSection = useCallback((section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  }, []);

  // Export to Excel using the utility function
  const handleExportToExcel = useCallback(() => {
    exportReconciliationToExcel({
      wizard,
      selectedVehicles,
      reconciliation,
      tankData
    });
  }, [wizard, selectedVehicles, reconciliation, tankData]);

  // Render category vehicle details
  const renderCategoryVehicles = (categoryId) => {
    const vehicles = localVehiclesByCategory[categoryId] || [];
    const config = CATEGORY_CONFIG[categoryId];

    if (vehicles.length === 0) return null;

    /**
     * Handle row update when user edits cell values.
     * Updates local state first (for DataGrid), then saves to Redux for persistence.
     */
    const handleRowUpdating = (e) => {
      const { key: vehicleId, newData } = e;
      const changes = { ...newData };

      // Update local state for DataGrid
      setLocalVehiclesByCategory(prev => ({
        ...prev,
        [categoryId]: prev[categoryId].map(v =>
          v.vehicleId === vehicleId ? { ...v, ...changes } : v
        )
      }));

      // Dispatch update to Redux store
      dispatch(updateVehicleFuelData({
        vehicleId,
        changes
      }));

      console.log(`[Step6] Vehicle ${vehicleId} updated:`, changes);
    };

    return (
      <DataGrid
        dataSource={vehicles}
        keyExpr="vehicleId"
        showBorders={true}
        columnAutoWidth={true}
        rowAlternationEnabled={true}
        height="auto"
        className="tw-text-sm"
        onRowUpdating={handleRowUpdating}
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
      {/* Header with Export Button */}
      <div className="tw-flex tw-items-center tw-justify-between tw-mb-6">
        <div className="tw-flex tw-items-center">
          <i className="fa-light fa-scale-balanced tw-mr-2 tw-text-lg tw-text-blue-600"></i>
          <h3 className="tw-text-lg tw-font-semibold">Fuel Reconciliation</h3>
          <span className="tw-ml-3 tw-text-sm tw-text-gray-500">
            Period: {wizard.periodStart ? new Date(wizard.periodStart).toLocaleDateString() : 'N/A'} - {wizard.periodEnd ? new Date(wizard.periodEnd).toLocaleDateString() : 'N/A'}
          </span>
        </div>
        <button
          onClick={handleExportToExcel}
          className="tw-flex tw-items-center tw-gap-2 tw-px-4 tw-py-2 tw-bg-green-600 tw-text-white tw-rounded-lg hover:tw-bg-green-700 tw-transition-colors tw-text-sm tw-font-medium"
        >
          <i className="fa-light fa-file-excel"></i>
          Export to Excel
        </button>
      </div>

      {/* Reconciliation Formula Banner */}
      <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4 tw-mb-6">
        <div className="tw-text-center tw-mb-2">
          <span className="tw-text-xs tw-text-blue-600 tw-uppercase tw-tracking-wider tw-font-medium">
            Reconciliation Formula
          </span>
        </div>
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-text-sm tw-font-medium tw-flex-wrap">
          <span className="tw-text-blue-700 tw-bg-blue-100 tw-px-2 tw-py-1 tw-rounded">Opening (Vehicles + Tanker)</span>
          <span className="tw-text-gray-400 tw-text-lg">+</span>
          <span className="tw-text-green-700 tw-bg-green-100 tw-px-2 tw-py-1 tw-rounded">Deliveries In</span>
          <span className="tw-text-gray-400 tw-text-lg">−</span>
          <span className="tw-text-red-700 tw-bg-red-100 tw-px-2 tw-py-1 tw-rounded">Actual Consumption</span>
          <span className="tw-text-gray-400 tw-text-lg">=</span>
          <span className="tw-text-purple-700 tw-bg-purple-100 tw-px-2 tw-py-1 tw-rounded">Closing (Vehicles + Tanker)</span>
        </div>
        <div className="tw-flex tw-items-center tw-justify-center tw-gap-2 tw-mt-3 tw-text-lg tw-font-bold tw-flex-wrap">
          <span className="tw-text-blue-700">{formatNumber(reconciliation.totalOpening)} L</span>
          <span className="tw-text-gray-400">+</span>
          <span className="tw-text-green-700">{formatNumber(reconciliation.totalDeliveries)} L</span>
          <span className="tw-text-gray-400">−</span>
          <span className="tw-text-red-700">{formatNumber(reconciliation.totalConsumption)} L</span>
          <span className="tw-text-gray-400">=</span>
          <span className="tw-text-purple-700">{formatNumber(reconciliation.expectedClosing)} L</span>
        </div>
      </div>

      {/* OPENING STOCK SECTION */}
      <div className="tw-mb-6 tw-border tw-rounded-lg tw-overflow-hidden">
        {renderSectionHeader('Opening Stock (Start of Audit Period)', 'fa-play-circle', 'opening', reconciliation.totalOpening, 'tw-text-blue-600')}

        {expandedSections.opening && (
          <div className="tw-p-4 tw-bg-white">
            {/* Vehicle Opening Stock - Individual Vehicle List */}
            <div className="tw-mb-4">
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-truck tw-mr-2 tw-text-blue-600"></i>
                Fleet Dead Stock (Vehicles)
              </h4>

              {/* Individual Vehicle Dead Stock List */}
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-mb-3">
                <div className="tw-space-y-1 tw-font-mono tw-text-sm">
                  {selectedVehicles.map(v => (
                    <div key={v.vehicleId} className="tw-flex tw-justify-between tw-items-center tw-py-1">
                      <span className="tw-text-gray-700">
                        {v.vehicleNo || v.vehicleName || 'Unknown'} Dead Stock:
                      </span>
                      <span className="tw-font-medium tw-text-gray-800">
                        {formatNumber(v.openingFuel || 0)} L
                      </span>
                    </div>
                  ))}
                  <div className="tw-border-t tw-border-gray-300 tw-my-2"></div>
                  <div className="tw-flex tw-justify-between tw-items-center tw-py-1 tw-font-bold">
                    <span className="tw-text-blue-800">Total Fleet Dead Stock:</span>
                    <span className="tw-text-blue-700">{formatNumber(reconciliation.totalVehicleOpening)} L</span>
                  </div>
                </div>
              </div>

              {/* Expandable Category Details */}
              <details className="tw-mb-3">
                <summary className="tw-cursor-pointer tw-text-sm tw-text-blue-600 hover:tw-text-blue-800 tw-font-medium">
                  <i className="fa-light fa-chevron-right tw-mr-1"></i>
                  View by Category (with editing)
                </summary>
                <div className="tw-mt-3">
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
                </div>
              </details>
            </div>

            {/* Tank Opening Stock */}
            <div className="tw-mb-4">
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-database tw-mr-2 tw-text-green-600"></i>
                FT and ST Stock
              </h4>
              <div className="tw-bg-green-50 tw-rounded-lg tw-p-4">
                <div className="tw-space-y-1 tw-font-mono tw-text-sm">
                  {tankData.tanks.length > 0 ? (
                    <>
                      {tankData.tanks.map(t => (
                        <div key={t.tankId} className="tw-flex tw-justify-between tw-items-center tw-py-1">
                          <span className="tw-text-gray-700">{t.tankName}:</span>
                          <span className="tw-font-medium tw-text-gray-800">{formatNumber(t.openingVolume || t.openingStock || 0)} L</span>
                        </div>
                      ))}
                      <div className="tw-border-t tw-border-green-300 tw-my-2"></div>
                    </>
                  ) : null}
                  <div className="tw-flex tw-justify-between tw-items-center tw-py-1 tw-font-bold">
                    <span className="tw-text-green-800">Total Tank Stock:</span>
                    <span className="tw-text-green-700">{formatNumber(reconciliation.tankOpening)} L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOTAL OPENING */}
            <div className="tw-bg-blue-600 tw-text-white tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-justify-between tw-items-center tw-text-lg tw-font-bold">
                <span>TOTAL OPENING:</span>
                <span>{formatNumber(reconciliation.totalOpening)} L</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-text-sm tw-opacity-80 tw-mt-1">
                <span>Fleet Dead Stock + Tank Stock</span>
                <span>{formatNumber(reconciliation.totalVehicleOpening)} + {formatNumber(reconciliation.tankOpening)}</span>
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
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-truck-loading tw-mr-2 tw-text-green-600"></i>
                Deliveries to Tanker (External Fuel In)
              </h4>
              <div className="tw-bg-green-50 tw-rounded-lg tw-p-4">
                <div className="tw-flex tw-justify-between tw-items-center tw-text-lg">
                  <span className="tw-text-gray-700">Total Deliveries:</span>
                  <span className="tw-font-bold tw-text-green-700">+{formatNumber(reconciliation.totalDeliveries)} L</span>
                </div>
              </div>
            </div>

            {/* Consumption Out - Per Vehicle */}
            <div>
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-fire-alt tw-mr-2 tw-text-red-600"></i>
                Fleet Consumption (GPS Confirmed)
              </h4>

              {/* Individual Vehicle Consumption List */}
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-mb-3">
                <div className="tw-space-y-1 tw-font-mono tw-text-sm">
                  {selectedVehicles.map(v => {
                    const consumption = v.gpsMeasuredConsumption || v.consumption || v.totalFuelAmount || 0;
                    const hasGps = v.vehicleCategory === 1 || v.vehicleCategory === 4;
                    if (consumption <= 0) return null;
                    return (
                      <div key={v.vehicleId} className="tw-flex tw-justify-between tw-items-center tw-py-1">
                        <span className="tw-text-gray-700">
                          {v.vehicleNo || v.vehicleName || 'Unknown'}
                          {hasGps && (
                            <span className="tw-text-xs tw-ml-1 tw-text-green-600">(GPS)</span>
                          )}
                          :
                        </span>
                        <span className="tw-font-medium tw-text-red-600">
                          −{formatNumber(consumption)} L
                        </span>
                      </div>
                    );
                  })}
                  <div className="tw-border-t tw-border-gray-300 tw-my-2"></div>
                  <div className="tw-flex tw-justify-between tw-items-center tw-py-1 tw-font-bold">
                    <span className="tw-text-red-800">Total Fleet Consumption:</span>
                    <span className="tw-text-red-700">−{formatNumber(reconciliation.totalConsumption)} L</span>
                  </div>
                </div>
              </div>

              {/* Expandable Category Details */}
              <details className="tw-mb-3">
                <summary className="tw-cursor-pointer tw-text-sm tw-text-blue-600 hover:tw-text-blue-800 tw-font-medium">
                  <i className="fa-light fa-chevron-right tw-mr-1"></i>
                  View by Category
                </summary>
                <div className="tw-mt-3 tw-space-y-2">
                  {Object.keys(CATEGORY_CONFIG).map(catId => {
                    const catNum = parseInt(catId);
                    const config = CATEGORY_CONFIG[catNum];
                    const vehicles = vehiclesByCategory[catNum] || [];
                    const consumption = reconciliation.consumptionByCategory[catNum] || 0;

                    if (vehicles.length === 0 || consumption === 0) return null;

                    return (
                      <div key={catId} className={`tw-rounded tw-p-3 ${config.bgColor}`}>
                        <div className="tw-flex tw-justify-between tw-items-center">
                          <div className="tw-flex tw-items-center tw-gap-2">
                            <i className={`fa-light ${config.icon} ${config.color}`}></i>
                            <span className="tw-text-gray-700">{config.name}</span>
                            {config.hasGpsData && (
                              <span className="tw-text-xs tw-px-2 tw-py-0.5 tw-bg-green-100 tw-text-green-700 tw-rounded">GPS Verified</span>
                            )}
                          </div>
                          <span className="tw-font-bold tw-text-red-600">−{formatNumber(consumption)} L</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </details>
            </div>
          </div>
        )}
      </div>

      {/* CLOSING STOCK SECTION */}
      <div className="tw-mb-6 tw-border tw-rounded-lg tw-overflow-hidden">
        {renderSectionHeader('Closing Stock (End of Audit Period)', 'fa-stop-circle', 'closing', reconciliation.totalClosing, 'tw-text-purple-600')}

        {expandedSections.closing && (
          <div className="tw-p-4 tw-bg-white">
            {/* Vehicle Closing Stock - Individual Vehicle List */}
            <div className="tw-mb-4">
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-truck tw-mr-2 tw-text-purple-600"></i>
                Fleet Dead Stock (Vehicles)
              </h4>

              {/* Individual Vehicle Dead Stock List */}
              <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-mb-3">
                <div className="tw-space-y-1 tw-font-mono tw-text-sm">
                  {selectedVehicles.map(v => (
                    <div key={v.vehicleId} className="tw-flex tw-justify-between tw-items-center tw-py-1">
                      <span className="tw-text-gray-700">
                        {v.vehicleNo || v.vehicleName || 'Unknown'} Dead Stock:
                      </span>
                      <span className="tw-font-medium tw-text-gray-800">
                        {formatNumber(v.closingFuel || 0)} L
                      </span>
                    </div>
                  ))}
                  <div className="tw-border-t tw-border-gray-300 tw-my-2"></div>
                  <div className="tw-flex tw-justify-between tw-items-center tw-py-1 tw-font-bold">
                    <span className="tw-text-purple-800">Total Fleet Dead Stock:</span>
                    <span className="tw-text-purple-700">{formatNumber(reconciliation.totalVehicleClosing)} L</span>
                  </div>
                </div>
              </div>

              {/* Expandable Category Details */}
              <details className="tw-mb-3">
                <summary className="tw-cursor-pointer tw-text-sm tw-text-blue-600 hover:tw-text-blue-800 tw-font-medium">
                  <i className="fa-light fa-chevron-right tw-mr-1"></i>
                  View by Category
                </summary>
                <div className="tw-mt-3 tw-space-y-2">
                  {Object.keys(CATEGORY_CONFIG).map(catId => {
                    const catNum = parseInt(catId);
                    const config = CATEGORY_CONFIG[catNum];
                    const vehicles = vehiclesByCategory[catNum] || [];
                    const closing = reconciliation.closingByCategory[catNum] || 0;

                    if (vehicles.length === 0) return null;

                    return (
                      <div key={catId} className={`tw-rounded tw-p-3 ${config.bgColor}`}>
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
                </div>
              </details>
            </div>

            {/* Tank Closing Stock */}
            <div className="tw-mb-4">
              <h4 className="tw-font-medium tw-text-gray-700 tw-mb-3 tw-flex tw-items-center">
                <i className="fa-light fa-database tw-mr-2 tw-text-green-600"></i>
                Tankers Stock
              </h4>
              <div className="tw-bg-green-50 tw-rounded-lg tw-p-4">
                <div className="tw-space-y-1 tw-font-mono tw-text-sm">
                  {tankData.tanks.length > 0 ? (
                    <>
                      {tankData.tanks.map(t => (
                        <div key={t.tankId} className="tw-flex tw-justify-between tw-items-center tw-py-1">
                          <span className="tw-text-gray-700">{t.tankName}:</span>
                          <span className="tw-font-medium tw-text-gray-800">{formatNumber(t.closingVolume || t.closingStock || 0)} L</span>
                        </div>
                      ))}
                      <div className="tw-border-t tw-border-green-300 tw-my-2"></div>
                    </>
                  ) : null}
                  <div className="tw-flex tw-justify-between tw-items-center tw-py-1 tw-font-bold">
                    <span className="tw-text-green-800">Total Tankers Stock:</span>
                    <span className="tw-text-green-700">{formatNumber(reconciliation.tankClosing)} L</span>
                  </div>
                </div>
              </div>
            </div>

            {/* TOTAL CLOSING */}
            <div className="tw-bg-purple-600 tw-text-white tw-rounded-lg tw-p-4">
              <div className="tw-flex tw-justify-between tw-items-center tw-text-lg tw-font-bold">
                <span>TOTAL CLOSING:</span>
                <span>{formatNumber(reconciliation.totalClosing)} L</span>
              </div>
              <div className="tw-flex tw-justify-between tw-items-center tw-text-sm tw-opacity-80 tw-mt-1">
                <span>Fleet Dead Stock + Tankers Stock</span>
                <span>{formatNumber(reconciliation.totalVehicleClosing)} + {formatNumber(reconciliation.tankClosing)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* THE RECONCILIATION SECTION */}
      <div className="tw-border-2 tw-border-gray-300 tw-rounded-lg tw-overflow-hidden">
        {renderSectionHeader('The Reconciliation', 'fa-scale-balanced', 'reconciliation', reconciliation.variance,
          Math.abs(reconciliation.variance) > 50 ? 'tw-text-red-600' : 'tw-text-green-600')}

        {expandedSections.reconciliation && (
          <div className="tw-p-4 tw-bg-white">
            <div className="tw-font-mono tw-text-base">
              {/* Opening */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-3 tw-border-b tw-border-gray-200">
                <span className="tw-text-gray-700">Total Opening Stock:</span>
                <span className="tw-font-bold tw-text-blue-700">{formatNumber(reconciliation.totalOpening)} L</span>
              </div>

              {/* + Deliveries */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-3 tw-border-b tw-border-gray-200">
                <span className="tw-text-gray-700">+ Deliveries (external in):</span>
                <span className="tw-font-bold tw-text-green-700">+{formatNumber(reconciliation.totalDeliveries)} L</span>
              </div>

              {/* - Consumption */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-3 tw-border-b tw-border-gray-200">
                <span className="tw-text-gray-700">− Consumption (GPS confirmed):</span>
                <span className="tw-font-bold tw-text-red-700">−{formatNumber(reconciliation.totalConsumption)} L</span>
              </div>

              {/* Separator Line */}
              <div className="tw-py-2 tw-text-gray-400 tw-text-center">
                ─────────────────────────────────────────
              </div>

              {/* Expected Closing */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-3 tw-bg-gray-50 tw-px-4 tw--mx-4 tw-border-b tw-border-gray-200">
                <span className="tw-font-semibold tw-text-gray-800">Expected Closing:</span>
                <span className="tw-font-bold tw-text-purple-700 tw-text-lg">{formatNumber(reconciliation.expectedClosing)} L</span>
              </div>

              {/* Actual Closing */}
              <div className="tw-flex tw-justify-between tw-items-center tw-py-3 tw-bg-gray-50 tw-px-4 tw--mx-4 tw-border-b tw-border-gray-200">
                <span className="tw-font-semibold tw-text-gray-800">Actual Closing (Vehicles + Tanker):</span>
                <span className="tw-font-bold tw-text-purple-700 tw-text-lg">{formatNumber(reconciliation.totalClosing)} L</span>
              </div>

              {/* Separator Line */}
              <div className="tw-py-2 tw-text-gray-400 tw-text-center">
                ─────────────────────────────────────────
              </div>

              {/* VARIANCE */}
              <div className={`tw-flex tw-justify-between tw-items-center tw-py-4 tw-px-4 tw--mx-4 tw-rounded-b-lg ${
                Math.abs(reconciliation.variance) > 50 ? 'tw-bg-red-100' : 'tw-bg-green-100'
              }`}>
                <div className="tw-flex tw-items-center tw-gap-3">
                  <span className={`tw-font-bold tw-text-xl ${
                    Math.abs(reconciliation.variance) > 50 ? 'tw-text-red-800' : 'tw-text-green-800'
                  }`}>VARIANCE:</span>
                  {Math.abs(reconciliation.variance) > 50 && (
                    <span className="tw-text-xs tw-px-2 tw-py-1 tw-bg-red-200 tw-text-red-800 tw-rounded tw-flex tw-items-center tw-gap-1">
                      <i className="fa-light fa-exclamation-triangle"></i>
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
