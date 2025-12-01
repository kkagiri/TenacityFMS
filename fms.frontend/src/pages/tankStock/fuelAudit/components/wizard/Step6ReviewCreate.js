/**
 * Step6ReviewCreate.js
 * Step 6: Review Summary and Create Audit
 */

import React, { useState, useEffect, useMemo, memo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { TextArea } from 'devextreme-react/text-area';
import { CheckBox } from 'devextreme-react/check-box';

import { setWizardNotes, selectWizard } from '../../../../../redux/slices/fuelAuditSlice';
import { fetctTankbySiteId } from '../../../../../redux/actions/tankActions';
import { fetchVehicleList } from '../../../../../redux/actions/vehicleActions';
import { fetchEmployees } from '../../../../../redux/actions/employeeActions';

const Step6ReviewCreate = memo(({ autoPopulate, onAutoPopulateChange }) => {
  const dispatch = useDispatch();
  const wizard = useSelector(selectWizard);
  const sites = useSelector((state) => state.site?.sites || []);

  // Local state for data display
  const [tanks, setTanks] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [employees, setEmployees] = useState([]);

  // Load data for display
  useEffect(() => {
    if (wizard.siteId) {
      dispatch(fetctTankbySiteId(wizard.siteId)).then(result => {
        if (result.success) setTanks(result.data || []);
      });
    }

    dispatch(fetchVehicleList()).then(result => {
      if (Array.isArray(result)) setVehicles(result);
    });

    dispatch(fetchEmployees(true)).then(result => {
      if (result.success) setEmployees(result.data || []);
    });
  }, [wizard.siteId, dispatch]);

  // Get selected site
  const selectedSite = sites.find(s => s.siteId === wizard.siteId);

  // Get selected tanks
  const selectedTanks = tanks.filter(t => wizard.selectedTankIds?.includes(t.tankId));

  // Get selected vehicles with drivers
  const selectedVehicles = useMemo(() => {
    return vehicles
      .filter(v => wizard.selectedVehicleIds?.includes(v.vehicleId))
      .map(vehicle => {
        const driver = employees.find(emp =>
          emp.vehicles?.includes(vehicle.vehicleId) ||
          emp.vehicleId === vehicle.vehicleId
        );
        return {
          ...vehicle,
          driverName: driver
            ? `${driver.firstName || ''} ${driver.lastName || ''}`.trim() || 'N/A'
            : 'Unassigned'
        };
      });
  }, [vehicles, employees, wizard.selectedVehicleIds]);

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
      <h3 className="tw-text-lg tw-font-semibold tw-mb-6">
        <i className="fa-light fa-check-circle tw-mr-2"></i>
        Review & Create Audit
      </h3>

      {/* Summary Cards Grid */}
      <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-5 tw-mb-6">

        {/* Site & Period Card */}
        <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-border tw-border-blue-200">
          <h4 className="tw-font-semibold tw-text-blue-800 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-building tw-mr-2"></i>
            Site & Period
          </h4>
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
          <h4 className="tw-font-semibold tw-text-green-800 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-database tw-mr-2"></i>
            Tanks ({selectedTanks.length})
          </h4>
          <div className="tw-space-y-1 tw-text-sm tw-max-h-24 tw-overflow-y-auto">
            {selectedTanks.slice(0, 4).map(tank => (
              <div key={tank.tankId} className="tw-flex tw-justify-between">
                <span className="tw-text-gray-700">{tank.tankName}</span>
                <span className="tw-text-gray-500 tw-text-xs">{tank.fuelType}</span>
              </div>
            ))}
            {selectedTanks.length > 4 && (
              <p className="tw-text-gray-500 tw-italic">
                +{selectedTanks.length - 4} more tanks
              </p>
            )}
            {selectedTanks.length === 0 && (
              <p className="tw-text-gray-500 tw-italic">No tanks selected</p>
            )}
          </div>
        </div>

        {/* Vehicles Card */}
        <div className="tw-bg-purple-50 tw-rounded-lg tw-p-4 tw-border tw-border-purple-200">
          <h4 className="tw-font-semibold tw-text-purple-800 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-truck tw-mr-2"></i>
            Vehicles ({selectedVehicles.length})
          </h4>
          <div className="tw-space-y-1 tw-text-sm tw-max-h-24 tw-overflow-y-auto">
            {selectedVehicles.slice(0, 4).map(vehicle => (
              <div key={vehicle.vehicleId} className="tw-flex tw-justify-between">
                <span className="tw-text-gray-700">{vehicle.vehicleNo || vehicle.vehicleName}</span>
                <span className="tw-text-gray-500 tw-text-xs">{vehicle.driverName}</span>
              </div>
            ))}
            {selectedVehicles.length > 4 && (
              <p className="tw-text-gray-500 tw-italic">
                +{selectedVehicles.length - 4} more vehicles
              </p>
            )}
            {selectedVehicles.length === 0 && (
              <p className="tw-text-gray-500 tw-italic">No vehicles selected</p>
            )}
          </div>
        </div>

        {/* Options Card */}
        <div className="tw-bg-orange-50 tw-rounded-lg tw-p-4 tw-border tw-border-orange-200">
          <h4 className="tw-font-semibold tw-text-orange-800 tw-mb-3 tw-flex tw-items-center">
            <i className="fa-light fa-cog tw-mr-2"></i>
            Options
          </h4>
          <div className="tw-space-y-2 tw-text-sm">
            <div className="tw-flex tw-items-center">
              <i className={`fa-light ${wizard.includeGpsFleet ? 'fa-check tw-text-green-600' : 'fa-times tw-text-red-500'} tw-mr-2`}></i>
              <span>Include GPS Fleet</span>
            </div>
            <div className="tw-flex tw-items-center">
              <i className={`fa-light ${wizard.includePickups ? 'fa-check tw-text-green-600' : 'fa-times tw-text-red-500'} tw-mr-2`}></i>
              <span>Include Pickups</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      <div className="tw-mb-5">
        <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-2">
          <i className="fa-light fa-sticky-note tw-mr-2"></i>
          Audit Notes (Optional)
        </label>
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
        <h4 className="tw-font-medium tw-text-blue-800 tw-mb-2">
          <i className="fa-light fa-info-circle tw-mr-2"></i>
          Ready to Create
        </h4>
        <p className="tw-text-sm tw-text-blue-700">
          You are about to create a <strong>{wizard.auditType || 'Weekly'}</strong> audit for{' '}
          <strong>{selectedSite?.siteName}</strong> covering{' '}
          <strong>{selectedTanks.length}</strong> tanks and{' '}
          <strong>{selectedVehicles.length}</strong> vehicles.
        </p>
      </div>
    </div>
  );
}
);

Step6ReviewCreate.displayName = 'Step6ReviewCreate';

export default Step6ReviewCreate;
