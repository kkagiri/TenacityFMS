import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Popup } from 'devextreme-react/popup';
import Button from 'devextreme-react/button';
import VehicleDataGrid from './component/vehicleDataGrid';
import VehicleAddForm from './component/VehicleAddForm';
import { getVehicleDetailsRoute } from './utils/navigationHelper';
import './VehicleFleetPage.scss';

const VehicleFleetPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showAddVehiclePopup, setShowAddVehiclePopup] = useState(false);

  // Check for hash navigation on mount and location changes
  useEffect(() => {
    const hash = location.hash;
    if (hash === '#vehicleaction') {
      setShowAddVehiclePopup(true);
    }
  }, [location]);

  // Handle popup close
  const handleClosePopup = () => {
    setShowAddVehiclePopup(false);
    // Remove hash from URL without affecting browser history
    if (location.hash === '#vehicleaction') {
      navigate(location.pathname, { replace: true });
    }
  };

  // Handle successful vehicle creation
  const handleVehicleSaved = (vehicleData) => {
    handleClosePopup();
    // Navigate to the new vehicle details page
    if (vehicleData && vehicleData.vehicleId) {
      navigate(getVehicleDetailsRoute(vehicleData.vehicleId));
    }
  };

  // Handle add vehicle button click
  const handleAddVehicle = () => {
    setShowAddVehiclePopup(true);
    // Add hash to URL
    navigate(`${location.pathname}#vehicleaction`, { replace: true });
  };

  return (
    <div className="tw-px-1 tw-pt-2 tw-pb-4 md:tw-p-3">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-4">
        <div className="fleet-header tw-flex tw-justify-between tw-items-center tw-mb-4">
          <div className="header-content">
            <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-1">Vehicles</h2>
            <p className="tw-text-gray-600">
              Manage your vehicle fleet, assignments, and operational status.
            </p>
          </div>
          <div className="header-actions add-vehicle-btn">
            <Button
              text="Add Vehicle"
              type="default"
              stylingMode="contained"
              icon="fa-light fa-plus"
              onClick={handleAddVehicle}
              className="tw-bg-blue-600 hover:tw-bg-blue-700"
            />
          </div>
        </div>

        <VehicleDataGrid />
      </div>

      {/* Add Vehicle Popup */}
      <Popup
        visible={showAddVehiclePopup}
        onHiding={handleClosePopup}
        showCloseButton={true}
        width="auto"
        height="auto"
        maxWidth="900px"
        maxHeight="90vh"
        title="Add New Vehicle"
        dragEnabled={false}
        resizeEnabled={true}
        className="vehicle-add-popup"
      >
        <VehicleAddForm
          onSave={handleVehicleSaved}
          onCancel={handleClosePopup}
        />
      </Popup>
    </div>
  );
};

export default VehicleFleetPage;
