import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { TabPanel } from 'devextreme-react/tab-panel';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { Popup } from 'devextreme-react/popup';

// Import tab components
import VehicleEditForm from '../components/vehicle/VehicleEditForm';
import VehicleConsumptionHistory from '../components/vehicle/VehicleConsumptionHistory';
import VehicleMaintenanceHistory from '../components/vehicle/VehicleMaintenanceHistory';
import VehicleFuelingHistory from '../components/vehicle/VehicleFuelingHistory';
import VehicleSchedules from '../components/vehicle/VehicleSchedules';

// Import popup components
import TagAssignmentForm from '../components/Tags/TagAssignmentForm/TagAssignmentForm';
import SiteAssignmentForm from '../components/vehicle/SiteAssignmentForm';
import ExpectedAverageForm from '../components/vehicle/ExpectedAverageForm';

// Services
import { fetchVehicleById, updateVehicle } from '../redux/actions/vehicleActions';
import { fetchTags } from '../redux/actions/tagActions';
import { fetchSiteList } from '../redux/actions/siteActions';

import './VehicleDetails.scss';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const tags = useSelector((state) => state.tag.tags);
  const sites = useSelector((state) => state.site.sites);
  const user = useSelector((state) => state.auth.user);

  // Local state
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [showSitePopup, setShowSitePopup] = useState(false);
  const [showExpectedAvgPopup, setShowExpectedAvgPopup] = useState(false);

  // Load vehicle data
  useEffect(() => {
    const loadVehicleData = async () => {
      try {
        setIsLoading(true);

        // Try to get vehicle from existing state first
        let vehicleData = vehicles.find(v => v.vehicleId === parseInt(id));

        if (!vehicleData) {
          // If not in state, fetch from API
          const response = await dispatch(fetchVehicleById(id));
          vehicleData = response.data;
        }

        setVehicle(vehicleData);

        // Ensure supporting data is loaded
        await Promise.all([
          dispatch(fetchTags()),
          dispatch(fetchSiteList())
        ]);

      } catch (error) {
        console.error('Error loading vehicle data:', error);
        notify('Error loading vehicle data', 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    };

    if (id) {
      loadVehicleData();
    }
  }, [id, dispatch, vehicles]);

  // Quick action handlers
  const handleAssignTag = () => {
    setShowTagPopup(true);
  };

  const handleChangeSite = () => {
    setShowSitePopup(true);
  };

  const handleAssignExpectedAverage = () => {
    setShowExpectedAvgPopup(true);
  };

  const handleBackToList = () => {
    navigate('/vehicles');
  };

  // Vehicle metrics calculation
  const getVehicleMetrics = () => {
    if (!vehicle) return {};

    return {
      totalFuel: vehicle.totalFuelConsumed || 0,
      totalDistance: vehicle.totalDistance || 0,
      avgEfficiency: vehicle.avgEfficiency || 0,
      lastActivity: vehicle.lastActivity || 'N/A',
      status: vehicle.isActive ? 'Active' : 'Inactive',
      gpsStatus: vehicle.hasGPSInstalled ? 'Installed' : 'Not Installed'
    };
  };

  // Tab configuration
  const tabItems = [
    {
      title: 'Vehicle Information',
      icon: 'fa-light fa-edit',
      component: <VehicleEditForm vehicle={vehicle} onSave={(data) => {
        // Update vehicle data
        setVehicle({ ...vehicle, ...data });
        notify('Vehicle updated successfully', 'success', 3000);
      }} />
    },
    {
      title: 'Consumption History',
      icon: 'fa-light fa-gas-pump',
      component: <VehicleConsumptionHistory vehicleId={id} />
    },
    {
      title: 'Maintenance History',
      icon: 'fa-light fa-wrench',
      component: <VehicleMaintenanceHistory vehicleId={id} />
    },
    {
      title: 'Fueling History',
      icon: 'fa-light fa-oil-drum',
      component: <VehicleFuelingHistory vehicleId={id} />
    },
    {
      title: 'Schedules',
      icon: 'fa-light fa-calendar',
      component: <VehicleSchedules vehicleId={id} />
    }
  ];

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-screen">
        <LoadIndicator width="48px" height="48px" visible={true} />
      </div>
    );
  }

  if (!vehicle) {
    return (
      <div className="tw-p-6">
        <div className="tw-text-center tw-py-12">
          <i className="fa-light fa-exclamation-triangle tw-text-4xl tw-text-yellow-500 tw-mb-4"></i>
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">Vehicle Not Found</h2>
          <p className="tw-text-gray-600 tw-mb-6">The requested vehicle could not be found.</p>
          <Button
            text="Back to Vehicle List"
            icon="fa-light fa-arrow-left"
            onClick={handleBackToList}
            type="default"
            stylingMode="contained"
          />
        </div>
      </div>
    );
  }

  const metrics = getVehicleMetrics();

  return (
    <div className="vehicle-details tw-p-6">
      {/* Header Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-6 tw-mb-6">
        <div className="tw-flex tw-items-center tw-justify-between tw-mb-4">
          <div className="tw-flex tw-items-center">
            <Button
              icon="fa-light fa-arrow-left"
              onClick={handleBackToList}
              stylingMode="text"
              className="tw-mr-4"
            />
            <div>
              <h1 className="tw-text-2xl tw-font-bold tw-text-gray-800">
                {vehicle.hyoungNo} - {vehicle.numberPlate}
              </h1>
              <p className="tw-text-gray-600">
                {vehicle.vehicleManufacturer?.name} {vehicle.vehicleModel?.name} • {vehicle.yom}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="tw-flex tw-gap-3">
            <Button
              text="Assign Tag"
              icon="fa-light fa-tag"
              onClick={handleAssignTag}
              type="default"
              stylingMode="outlined"
            />
            <Button
              text="Change Site"
              icon="fa-light fa-building"
              onClick={handleChangeSite}
              type="default"
              stylingMode="outlined"
            />
            <Button
              text="Expected Average"
              icon="fa-light fa-chart-line"
              onClick={handleAssignExpectedAverage}
              type="default"
              stylingMode="outlined"
            />
          </div>
        </div>

        {/* Vehicle Metrics Dashboard */}
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4">
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <div className="tw-text-sm tw-text-blue-600 tw-mb-1">Status</div>
            <div className="tw-text-lg tw-font-semibold tw-text-blue-800">{metrics.status}</div>
          </div>

          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
            <div className="tw-text-sm tw-text-green-600 tw-mb-1">GPS Status</div>
            <div className="tw-text-lg tw-font-semibold tw-text-green-800">{metrics.gpsStatus}</div>
          </div>

          <div className="tw-bg-yellow-50 tw-p-4 tw-rounded-lg tw-border tw-border-yellow-200">
            <div className="tw-text-sm tw-text-yellow-600 tw-mb-1">Working Site</div>
            <div className="tw-text-lg tw-font-semibold tw-text-yellow-800">
              {vehicle.workingSite?.name || 'Not Assigned'}
            </div>
          </div>

          <div className="tw-bg-purple-50 tw-p-4 tw-rounded-lg tw-border tw-border-purple-200">
            <div className="tw-text-sm tw-text-purple-600 tw-mb-1">Default Driver</div>
            <div className="tw-text-lg tw-font-semibold tw-text-purple-800">
              {vehicle.defaultEmployee?.fullName || 'Not Assigned'}
            </div>
          </div>

          <div className="tw-bg-red-50 tw-p-4 tw-rounded-lg tw-border tw-border-red-200">
            <div className="tw-text-sm tw-text-red-600 tw-mb-1">Vehicle Type</div>
            <div className="tw-text-lg tw-font-semibold tw-text-red-800">
              {vehicle.vehicleType?.name || 'Not Specified'}
            </div>
          </div>

          <div className="tw-bg-indigo-50 tw-p-4 tw-rounded-lg tw-border tw-border-indigo-200">
            <div className="tw-text-sm tw-text-indigo-600 tw-mb-1">Capacity</div>
            <div className="tw-text-lg tw-font-semibold tw-text-indigo-800">
              {vehicle.capacity || 'Not Specified'}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
        <TabPanel
          dataSource={tabItems}
          selectedIndex={activeTab}
          onSelectionChanged={(e) => setActiveTab(e.selectedIndex)}
          animationEnabled={true}
          swipeEnabled={false}
          itemTitleRender={(item) => (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className={item.icon}></i>
              <span>{item.title}</span>
            </div>
          )}
          itemRender={(item) => (
            <div className="tw-p-6">
              {item.component}
            </div>
          )}
        />
      </div>

      {/* Popup Forms */}
      <Popup
        visible={showTagPopup}
        onHiding={() => setShowTagPopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Assign RFID Tag to ${vehicle.hyoungNo}`}
        width="auto"
        height="auto"
        position={{ my: "center", at: "center", of: window }}
      >
        <TagAssignmentForm
          vehicle={vehicle}
          tags={tags}
          onClose={() => setShowTagPopup(false)}
          onSuccess={() => {
            setShowTagPopup(false);
            notify('Tag assigned successfully', 'success', 3000);
          }}
        />
      </Popup>

      <Popup
        visible={showSitePopup}
        onHiding={() => setShowSitePopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Change Working Site for ${vehicle.hyoungNo}`}
        width={600}
        height={400}
      >
        <SiteAssignmentForm
          vehicle={vehicle}
          sites={sites}
          onClose={() => setShowSitePopup(false)}
          onSuccess={(newSiteId) => {
            setVehicle({ ...vehicle, workingSiteId: newSiteId });
            setShowSitePopup(false);
            notify('Working site updated successfully', 'success', 3000);
          }}
        />
      </Popup>

      <Popup
        visible={showExpectedAvgPopup}
        onHiding={() => setShowExpectedAvgPopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Set Expected Average for ${vehicle.hyoungNo}`}
        width={500}
        height={350}
      >
        <ExpectedAverageForm
          vehicle={vehicle}
          onClose={() => setShowExpectedAvgPopup(false)}
          onSuccess={(newAverage) => {
            setVehicle({ ...vehicle, defaultExptdAvgid: newAverage });
            setShowExpectedAvgPopup(false);
            notify('Expected average updated successfully', 'success', 3000);
          }}
        />
      </Popup>
    </div>
  );
};

export default VehicleDetails;
