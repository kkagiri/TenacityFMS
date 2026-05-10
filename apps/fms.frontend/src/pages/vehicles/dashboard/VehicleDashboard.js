/**
 * File: VehicleDashboard.js
 * Purpose: Fleet dashboard view using the standardized ModuleDashboard widget system.
 * Dependencies: ModuleDashboard component.
 * Last Modified: 2026-03-25
 */
import React from 'react';
import '../vehicles.scss';
import ModuleDashboard from '../../../components/dashboard/ModuleDashboard';

const VehicleDashboard = () => {
  return (
    <div className="tw-p-6">
      <ModuleDashboard
        moduleId="vehicle"
        title=""
        icon=""
        subtitle=""
        enableRealtime={true}
      />
    </div>
  );
};

export default VehicleDashboard;