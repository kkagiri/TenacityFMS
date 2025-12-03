/**
 * Step6ReviewCreate.js
 * Step 6: Review Summary, Reconciliation Report & Create Audit
 *
 * Displays:
 * - Summary of all selections (Site, Period, Tanks, Vehicles)
 * - System Reconciliation Report per Hybrid Algorithm
 * - Variance Analysis with flags
 * - Confidence scoring
 * - Audit notes and options
 */

import React, { useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextArea } from 'devextreme-react/text-area';
import { CheckBox } from 'devextreme-react/check-box';

import { setWizardNotes, selectWizard } from '../../../../../redux/slices/fuelAuditSlice';

// Category configuration for display
const CATEGORY_NAMES = {
  1: 'GPS Fleet',
  2: 'Full Tank Policy',
  3: 'Equipment',
  4: 'Cross-Site',
  5: 'External'
};

const Step6ReviewCreate = memo(({ autoPopulate, onAutoPopulateChange }) => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const sites = useSelector((state) => state.site?.sites || []);

  // Get selected site
  const selectedSite = useMemo(() => {
    return sites.find(s => s.siteId === wizard.siteId);
  }, [sites, wizard.siteId]);

  // Get selected tanks from wizard.tanks (already loaded in Step 2)
  const selectedTanks = useMemo(() => {
    const tanks = wizard.tanks || [];
    return tanks.filter(t => wizard.selectedTankIds?.includes(t.tankId));
  }, [wizard.tanks, wizard.selectedTankIds]);

  // Get selected vehicles from wizard.tankRefills (already loaded in Step 4)
  const selectedVehicles = useMemo(() => {
    const tankRefills = wizard.tankRefills || [];
    return tankRefills.filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId));
  }, [wizard.tankRefills, wizard.selectedVehicleIds]);

  // Calculate total fuel from selected vehicles
  const totalFuel = useMemo(() => {
    return selectedVehicles.reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
  }, [selectedVehicles]);

  // Calculate System Reconciliation per Hybrid Algorithm Phase 6
  const reconciliation = useMemo(() => {
    // Get category audit result from wizard (contains variance data)
    const categoryResult = wizard.categoryAuditResult;
    const summary = categoryResult?.summary || {};

    // Group vehicles by category for calculations
    const byCategory = {
      1: selectedVehicles.filter(v => v.vehicleCategory === 1),
      2: selectedVehicles.filter(v => v.vehicleCategory === 2),
      3: selectedVehicles.filter(v => v.vehicleCategory === 3),
      4: selectedVehicles.filter(v => v.vehicleCategory === 4),
      5: selectedVehicles.filter(v => v.vehicleCategory === 5)
    };

    // Category 1: GPS Fleet (verified)
    const cat1Opening = byCategory[1].reduce((sum, v) => sum + (v.openingFuel || 0), 0);
    const cat1Closing = byCategory[1].reduce((sum, v) => sum + (v.closingFuel || 0), 0);
    const cat1Consumed = byCategory[1].reduce((sum, v) => sum + (v.gpsMeasuredConsumption || v.consumption || 0), 0);
    const cat1Refueled = byCategory[1].reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
    const cat1Variance = byCategory[1].reduce((sum, v) => sum + (v.vehicleVariance || 0), 0);
    const cat1WithData = byCategory[1].filter(v => v.openingFuel && v.closingFuel).length;

    // Category 2: Full Tank Policy (estimated)
    const cat2Opening = byCategory[2].reduce((sum, v) => sum + (v.openingFuel || 0), 0);
    const cat2Closing = byCategory[2].reduce((sum, v) => sum + (v.closingFuel || 0), 0);
    const cat2Consumed = byCategory[2].reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0); // Full tank = refuel
    const cat2Refueled = byCategory[2].reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
    const cat2WithData = byCategory[2].filter(v => v.openingFuel && v.closingFuel).length;

    // Category 3: Equipment (fuel issued only)
    const cat3Issued = byCategory[3].reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);

    // Category 4: Cross-Site (verified if SOAP data)
    const cat4Opening = byCategory[4].reduce((sum, v) => sum + (v.openingFuel || 0), 0);
    const cat4Closing = byCategory[4].reduce((sum, v) => sum + (v.closingFuel || 0), 0);
    const cat4Consumed = byCategory[4].reduce((sum, v) => sum + (v.consumption || 0), 0);
    const cat4Refueled = byCategory[4].reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);
    const cat4WithData = byCategory[4].filter(v => v.openingFuel && v.closingFuel).length;

    // Category 5: External (leaves system)
    const cat5Issued = byCategory[5].reduce((sum, v) => sum + (v.totalFuelAmount || 0), 0);

    // Tank data from wizard (Step 3)
    const tankPreview = wizard.tankPreview || [];
    const tankOpening = tankPreview.reduce((sum, t) => sum + (t.openingVolume || 0), 0);
    const tankClosing = tankPreview.reduce((sum, t) => sum + (t.closingVolume || 0), 0);
    const tankDeliveries = tankPreview.reduce((sum, t) => sum + (t.deliveries || 0), 0);
    const tankDispensed = tankPreview.reduce((sum, t) => sum + (t.dispensed || 0), 0);
    const tankVariance = tankPreview.reduce((sum, t) => sum + (t.variance || 0), 0);

    // Phase 6.1: Calculate total opening position (Verified + Estimated)
    const vehicleOpening = cat1Opening + cat2Opening + cat4Opening;
    const totalOpening = tankOpening + vehicleOpening;

    // Phase 6.2: Calculate total closing position
    const vehicleClosing = cat1Closing + cat2Closing + cat4Closing;
    const totalClosingActual = tankClosing + vehicleClosing;

    // Phase 6.3: Calculate expected closing
    const externalIn = tankDeliveries;
    const externalOut = cat1Consumed + cat2Consumed + cat3Issued + cat4Consumed + cat5Issued;
    const expectedClosing = totalOpening + externalIn - externalOut;

    // Phase 6.4: Calculate system variance
    const systemVariance = totalClosingActual - expectedClosing;
    const systemVariancePct = totalOpening > 0 ? (systemVariance / totalOpening) * 100 : 0;

    // Phase 6.5: Calculate confidence
    const totalVerifiedVehicles = cat1WithData + cat4WithData;
    const totalEstimatedVehicles = cat2WithData;
    const totalVehicles = byCategory[1].length + byCategory[2].length + byCategory[4].length;
    const confidenceScore = totalVehicles > 0
      ? ((totalVerifiedVehicles + (totalEstimatedVehicles * 0.5)) / totalVehicles) * 100
      : 0;

    const confidenceLevel = confidenceScore >= 80 ? 'HIGH'
      : confidenceScore >= 50 ? 'MEDIUM'
      : 'LOW';

    // Variance flags
    const vehiclesWithFlags = selectedVehicles.filter(v => v.hasVarianceFlag).length;
    const systemVarianceFlag = Math.abs(systemVariancePct) > 1.0; // 1% threshold

    return {
      // Opening positions
      tankOpening,
      vehicleOpening,
      totalOpening,
      // Closing positions
      tankClosing,
      vehicleClosing,
      totalClosingActual,
      expectedClosing,
      // Movements
      externalIn,
      externalOut,
      tankDeliveries,
      tankDispensed,
      // Category breakdown
      byCategory: {
        1: { count: byCategory[1].length, opening: cat1Opening, closing: cat1Closing, consumed: cat1Consumed, refueled: cat1Refueled, variance: cat1Variance, withData: cat1WithData },
        2: { count: byCategory[2].length, opening: cat2Opening, closing: cat2Closing, consumed: cat2Consumed, refueled: cat2Refueled, withData: cat2WithData },
        3: { count: byCategory[3].length, issued: cat3Issued },
        4: { count: byCategory[4].length, opening: cat4Opening, closing: cat4Closing, consumed: cat4Consumed, refueled: cat4Refueled, withData: cat4WithData },
        5: { count: byCategory[5].length, issued: cat5Issued }
      },
      // Variance
      tankVariance,
      systemVariance,
      systemVariancePct,
      systemVarianceFlag,
      vehiclesWithFlags,
      // Confidence
      confidenceScore,
      confidenceLevel,
      totalVerifiedVehicles,
      totalEstimatedVehicles
    };
  }, [selectedVehicles, wizard.categoryAuditResult, wizard.tankPreview]);

  // Format date for display
  const formatDate = (date) => {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="wizard-step tw-p-6">
      <div className="tw-flex tw-items-center tw-mb-6">
        <i className="fa-light fa-check-circle tw-mr-2 tw-text-lg"></i>
        <h3 className="tw-text-lg tw-font-semibold">Review & Create Audit</h3>
      </div>

      {/* Summary Cards Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5 tw-mb-6">

        {/* Site & Period Card */}
        <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-border tw-border-blue-200">
          <div className="tw-flex tw-items-center tw-mb-3">
            <i className="fa-light fa-building tw-mr-2 tw-text-blue-800"></i>
            <h4 className="tw-font-semibold tw-text-blue-800">Site & Period</h4>
          </div>
          <div className="tw-space-y-2 tw-text-sm">
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-600">Site:</span>
              <span className="tw-font-medium tw-text-gray-800">{selectedSite?.siteName || 'N/A'}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-600">Audit Type:</span>
              <span className="tw-font-medium tw-text-gray-800">{wizard.auditType || 'Weekly'}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-600">Start:</span>
              <span className="tw-font-medium tw-text-gray-800">{formatDate(wizard.periodStart)}</span>
            </div>
            <div className="tw-flex tw-justify-between">
              <span className="tw-text-gray-600">End:</span>
              <span className="tw-font-medium tw-text-gray-800">{formatDate(wizard.periodEnd)}</span>
            </div>
          </div>
        </div>

        {/* Tanks Card */}
        <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-mb-3">
            <i className="fa-light fa-database tw-mr-2 tw-text-green-800"></i>
            <h4 className="tw-font-semibold tw-text-green-800">Tanks ({selectedTanks.length})</h4>
          </div>
          <div className="tw-space-y-1 tw-text-sm tw-max-h-32 tw-overflow-y-auto">
            {selectedTanks.length > 0 ? (
              <>
                {selectedTanks.map(tank => (
                  <div key={tank.tankId} className="tw-flex tw-justify-between tw-items-center tw-py-1">
                    <span className="tw-text-gray-700 tw-font-medium">{tank.tankName}</span>
                    <span className="tw-text-gray-500 tw-text-xs tw-px-2 tw-py-0.5 tw-bg-white tw-rounded">
                      {tank.fuelType || 'Diesel'}
                    </span>
                  </div>
                ))}
              </>
            ) : (
              <p className="tw-text-gray-500 tw-italic tw-text-center tw-py-4">No tanks selected</p>
            )}
          </div>
        </div>

        {/* Vehicles Card */}
        <div className="tw-bg-purple-50 tw-rounded-lg tw-p-4 tw-border tw-border-purple-200 md:tw-col-span-2">
          <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
            <div className="tw-flex tw-items-center">
              <i className="fa-light fa-truck tw-mr-2 tw-text-purple-800"></i>
              <h4 className="tw-font-semibold tw-text-purple-800">Vehicles ({selectedVehicles.length})</h4>
            </div>
            {totalFuel > 0 && (
              <span className="tw-text-sm tw-font-normal tw-text-purple-600">
                Total Fuel: {totalFuel.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
              </span>
            )}
          </div>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-2 tw-max-h-40 tw-overflow-y-auto">
            {selectedVehicles.length > 0 ? (
              selectedVehicles.map(vehicle => (
                <div
                  key={vehicle.vehicleId}
                  className="tw-bg-white tw-rounded tw-p-2 tw-border tw-border-purple-100"
                >
                  <div className="tw-flex tw-justify-between tw-items-start">
                    <div className="tw-flex-1">
                      <p className="tw-text-sm tw-font-medium tw-text-gray-800">
                        {vehicle.vehicleNo || vehicle.vehicleName || 'N/A'}
                      </p>
                      <p className="tw-text-xs tw-text-gray-500">
                        {vehicle.driverName || 'Unassigned'}
                      </p>
                    </div>
                    <div className="tw-text-right">
                      <p className="tw-text-xs tw-font-medium tw-text-purple-700">
                        {(vehicle.totalFuelAmount || 0).toFixed(0)} L
                      </p>
                      <p className="tw-text-xs tw-text-gray-400">
                        {vehicle.refillCount || 0} refills
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="tw-text-gray-500 tw-italic tw-text-center tw-py-4 tw-col-span-full">
                No vehicles selected
              </p>
            )}
          </div>
        </div>
      </div>

      {/* SYSTEM RECONCILIATION REPORT */}
      <div className="tw-mb-6 tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-scale-balanced tw-mr-2 tw-text-gray-700"></i>
            <h4 className="tw-font-semibold tw-text-gray-800">System Reconciliation</h4>
          </div>
          <div className={`tw-px-3 tw-py-1 tw-rounded-full tw-text-xs tw-font-semibold ${
            reconciliation.confidenceLevel === 'HIGH' ? 'tw-bg-green-100 tw-text-green-700' :
            reconciliation.confidenceLevel === 'MEDIUM' ? 'tw-bg-yellow-100 tw-text-yellow-700' :
            'tw-bg-red-100 tw-text-red-700'
          }`}>
            {reconciliation.confidenceLevel} Confidence ({reconciliation.confidenceScore.toFixed(0)}%)
          </div>
        </div>

        {/* Position Summary */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4 tw-mb-4">
          {/* Opening Position */}
          <div className="tw-bg-white tw-rounded tw-p-3 tw-border">
            <p className="tw-text-xs tw-text-gray-500 tw-mb-1">Total Opening Position</p>
            <p className="tw-text-xl tw-font-bold tw-text-gray-800">
              {reconciliation.totalOpening.toLocaleString(undefined, { maximumFractionDigits: 0 })} L
            </p>
            <div className="tw-text-xs tw-text-gray-500 tw-mt-2 tw-space-y-0.5">
              <p>Tanks: {reconciliation.tankOpening.toLocaleString()} L</p>
              <p>Vehicles: {reconciliation.vehicleOpening.toLocaleString()} L</p>
            </div>
          </div>

          {/* Movement */}
          <div className="tw-bg-white tw-rounded tw-p-3 tw-border">
            <p className="tw-text-xs tw-text-gray-500 tw-mb-1">Net Movement</p>
            <div className="tw-space-y-1">
              <p className="tw-text-sm">
                <span className="tw-text-green-600">+ Deliveries:</span>{' '}
                <span className="tw-font-semibold">{reconciliation.externalIn.toLocaleString()} L</span>
              </p>
              <p className="tw-text-sm">
                <span className="tw-text-red-600">- Consumption:</span>{' '}
                <span className="tw-font-semibold">{reconciliation.externalOut.toLocaleString()} L</span>
              </p>
            </div>
          </div>

          {/* Closing Position */}
          <div className="tw-bg-white tw-rounded tw-p-3 tw-border">
            <p className="tw-text-xs tw-text-gray-500 tw-mb-1">Closing Positions</p>
            <div className="tw-space-y-1">
              <p className="tw-text-sm">
                Expected: <span className="tw-font-semibold">{reconciliation.expectedClosing.toLocaleString()} L</span>
              </p>
              <p className="tw-text-sm">
                Actual: <span className="tw-font-semibold">{reconciliation.totalClosingActual.toLocaleString()} L</span>
              </p>
            </div>
          </div>
        </div>

        {/* System Variance */}
        <div className={`tw-p-4 tw-rounded tw-border-2 ${
          reconciliation.systemVarianceFlag
            ? 'tw-bg-red-50 tw-border-red-300'
            : Math.abs(reconciliation.systemVariance) > 0
              ? 'tw-bg-yellow-50 tw-border-yellow-300'
              : 'tw-bg-green-50 tw-border-green-300'
        }`}>
          <div className="tw-flex tw-items-center tw-justify-between">
            <div>
              <p className="tw-text-sm tw-font-medium tw-text-gray-700">System Variance</p>
              <p className={`tw-text-2xl tw-font-bold ${
                reconciliation.systemVarianceFlag ? 'tw-text-red-700' :
                reconciliation.systemVariance > 0 ? 'tw-text-green-700' :
                reconciliation.systemVariance < 0 ? 'tw-text-orange-700' : 'tw-text-gray-700'
              }`}>
                {reconciliation.systemVariance >= 0 ? '+' : ''}{reconciliation.systemVariance.toLocaleString(undefined, { maximumFractionDigits: 1 })} L
                <span className="tw-text-sm tw-font-normal tw-ml-2">
                  ({reconciliation.systemVariancePct >= 0 ? '+' : ''}{reconciliation.systemVariancePct.toFixed(2)}%)
                </span>
              </p>
            </div>
            {reconciliation.systemVarianceFlag && (
              <div className="tw-flex tw-items-center tw-gap-2 tw-text-red-700">
                <i className="fa-light fa-exclamation-triangle tw-text-xl"></i>
                <span className="tw-text-sm tw-font-medium">Exceeds 1% threshold</span>
              </div>
            )}
          </div>
        </div>

        {/* Category Breakdown */}
        <div className="tw-mt-4">
          <p className="tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-2">Consumption by Category</p>
          <div className="tw-grid tw-grid-cols-5 tw-gap-2 tw-text-xs">
            {[1, 2, 3, 4, 5].map(cat => {
              const data = reconciliation.byCategory[cat];
              const consumption = cat === 3 || cat === 5 ? data.issued : data.consumed;
              return (
                <div key={cat} className="tw-bg-white tw-rounded tw-p-2 tw-border tw-text-center">
                  <p className="tw-text-gray-500">{CATEGORY_NAMES[cat]}</p>
                  <p className="tw-font-semibold tw-text-gray-800">
                    {(consumption || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })} L
                  </p>
                  <p className="tw-text-gray-400">{data.count} vehicles</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Variance Flags */}
        {reconciliation.vehiclesWithFlags > 0 && (
          <div className="tw-mt-4 tw-p-3 tw-bg-red-50 tw-rounded tw-border tw-border-red-200">
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-flag tw-text-red-600"></i>
              <span className="tw-text-sm tw-text-red-700">
                <strong>{reconciliation.vehiclesWithFlags}</strong> vehicle(s) have variance flags that require attention
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Notes Section */}
      <div className="tw-mb-5">
        <div className="tw-flex tw-items-center tw-mb-2">
          <i className="fa-light fa-sticky-note tw-mr-2 tw-text-gray-700"></i>
          <label className="tw-text-sm tw-font-medium tw-text-gray-700">
            Audit Notes (Optional)
          </label>
        </div>
        <TextArea
          value={wizard.notes || ''}
          onValueChanged={(e) => dispatch(setWizardNotes(e.value))}
          placeholder="Add any notes, special instructions, or comments for this audit..."
          height={80}
        />
      </div>

      {/* Auto-populate option */}
      <div className="tw-p-4 tw-bg-gray-50 tw-rounded-lg tw-border">
        <CheckBox
          text="Auto-populate tank readings from ATG data (where available)"
          value={autoPopulate}
          onValueChanged={(e) => onAutoPopulateChange(e.value)}
        />
        <p className="tw-text-xs tw-text-gray-500 tw-mt-2 tw-ml-6">
          When enabled, opening and closing tank readings will be automatically filled from ATG sensor data.
        </p>
      </div>

      {/* Validation Summary */}
      <div className="tw-mt-5 tw-p-4 tw-bg-blue-50 tw-rounded-lg tw-border tw-border-blue-200">
        <div className="tw-flex tw-items-center tw-mb-2">
          <i className="fa-light fa-info-circle tw-mr-2 tw-text-blue-800"></i>
          <h4 className="tw-font-medium tw-text-blue-800">Ready to Create</h4>
        </div>
        <p className="tw-text-sm tw-text-blue-700">
          You are about to create a <strong>{wizard.auditType || 'Weekly'}</strong> audit for{' '}
          <strong>{selectedSite?.siteName || 'N/A'}</strong> covering{' '}
          <strong>{selectedTanks.length}</strong> tank{selectedTanks.length !== 1 ? 's' : ''} and{' '}
          <strong>{selectedVehicles.length}</strong> vehicle{selectedVehicles.length !== 1 ? 's' : ''}.
        </p>
        {totalFuel > 0 && (
          <p className="tw-text-sm tw-text-blue-600 tw-mt-2">
            Total fuel dispensed: <strong>{totalFuel.toLocaleString(undefined, { maximumFractionDigits: 1 })} liters</strong>
          </p>
        )}

        {/* Validation warnings */}
        {selectedTanks.length === 0 && (
          <div className="tw-mt-3 tw-p-2 tw-bg-yellow-100 tw-border tw-border-yellow-300 tw-rounded tw-flex tw-items-start">
            <i className="fa-light fa-exclamation-triangle tw-text-yellow-600 tw-mr-2 tw-mt-0.5"></i>
            <p className="tw-text-xs tw-text-yellow-800">
              No tanks selected. Please go back to Step 2 to select at least one tank.
            </p>
          </div>
        )}
        {selectedVehicles.length === 0 && (
          <div className="tw-mt-3 tw-p-2 tw-bg-yellow-100 tw-border tw-border-yellow-300 tw-rounded tw-flex tw-items-start">
            <i className="fa-light fa-exclamation-triangle tw-text-yellow-600 tw-mr-2 tw-mt-0.5"></i>
            <p className="tw-text-xs tw-text-yellow-800">
              No vehicles selected. Please go back to Step 4 to select at least one vehicle.
            </p>
          </div>
        )}
        {reconciliation.systemVarianceFlag && (
          <div className="tw-mt-3 tw-p-2 tw-bg-red-100 tw-border tw-border-red-300 tw-rounded tw-flex tw-items-start">
            <i className="fa-light fa-exclamation-triangle tw-text-red-600 tw-mr-2 tw-mt-0.5"></i>
            <p className="tw-text-xs tw-text-red-800">
              System variance ({reconciliation.systemVariancePct.toFixed(2)}%) exceeds acceptable threshold (1.0%).
              Review the reconciliation report before creating the audit.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
);

Step6ReviewCreate.displayName = 'Step6ReviewCreate';

export default Step6ReviewCreate;
