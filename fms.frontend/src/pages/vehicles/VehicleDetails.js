import React, { useState, useEffect, useMemo, useCallback } from 'react';

import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { TabPanel } from 'devextreme-react/tab-panel';
import Button from 'devextreme-react/button';
import LoadIndicator from 'devextreme-react/load-indicator';
import notify from 'devextreme/ui/notify';
import { Popup } from 'devextreme-react/popup';

// Import tab components
import VehicleEditForm from './component/VehicleEditForm';
import VehicleConsumptionHistory from './component/VehicleConsumptionHistory';
import VehicleMaintenanceHistory from './component/VehicleMaintenanceHistory';
import VehicleFuelingHistory from './component/VehicleFuelingHistory';
import VehicleSchedules from './component/VehicleSchedules';
import VehicleInsuranceLicense from './component/VehicleInsuranceLicense';

// Import popup components
import TagAssignmentForm from '../../components/Tags/TagAssignmentForm/TagAssignmentForm';
import ExpectedAverageForm from './component/ExpectedAverageForm';

// Services
import { getVehicleById, deleteVehicle } from '../../redux/actions/vehicleActions';
import { fetchTags } from '../../redux/actions/tagActions';
import { fetchSiteList } from '../../redux/actions/siteActions';

import './VehicleDetails.scss';

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Redux state
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const tags = useSelector((state) => state.tag.tags);
  const sites = useSelector((state) => state.site.sites); // Used in SiteAssignmentForm component
  // No longer used but will be needed when site form is implemented

  // Local state
  const [vehicle, setVehicle] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState(0);
  const [showTagPopup, setShowTagPopup] = useState(false);
  const [showSitePopup, setShowSitePopup] = useState(false);
  const [showExpectedAvgPopup, setShowExpectedAvgPopup] = useState(false);
  const [tabLoadingStates, setTabLoadingStates] = useState({
    0: true, // Vehicle Information tab starts loading
    // Other tabs will be set to true only when selected
  });
  const [tabDataLoaded, setTabDataLoaded] = useState({}); // Track which tabs have loaded their data
  const [dataLoaded, setDataLoaded] = useState(false); // Track if vehicle data is loaded

  // Load vehicle data - Fixed dependencies and optimized
  useEffect(() => {
    const loadVehicleData = async () => {
      if (dataLoaded) return; // Prevent re-loading

      try {
        setIsLoading(true);

        // Try to get vehicle from existing state first
        let vehicleData = vehicles.find(v => v.vehicleId === parseInt(id));

        if (!vehicleData) {
          // If not in state, fetch from API
          const response = await dispatch(getVehicleById(id));
          vehicleData = response.data;
        }

        setVehicle(vehicleData);

        // Ensure supporting data is loaded
        await Promise.all([
          dispatch(fetchTags()),
          dispatch(fetchSiteList())
        ]);

        setDataLoaded(true); // Mark as loaded

        // Mark first tab as loaded
        setTabLoadingStates(prev => ({
          ...prev,
          0: false
        }));

        setTabDataLoaded(prev => ({
          ...prev,
          0: true
        }));

      } catch (error) {
        console.error('Error loading vehicle data:', error);
        notify('Error loading vehicle data', 'error', 3000);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && !dataLoaded) { // Only load if not already loaded
      loadVehicleData();
    }
  }, [id, dispatch, dataLoaded, vehicles]);

  // Quick action handlers
  const handleAssignTag = () => {
    setShowTagPopup(true);
  };

  // Site popup handler (will be used when SiteAssignmentForm is implemented)
  const handleChangeSite = () => {
    setShowSitePopup(true);
  };

  const handleAssignExpectedAverage = () => {
    setShowExpectedAvgPopup(true);
  };

  // Helper function to navigate to fueling history tab
  const handleViewFuelHistory = () => {
    // Navigate to the fuel history tab
    setActiveTab(3); // Fueling History tab
  };

  const handleGenerateReport = () => {
    // Implement report generation
    notify('Report generation feature coming soon', 'info', 3000);
  };

  const handleBackToList = () => {
    navigate('/vehicles/fleet');
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(`Are you sure you want to delete vehicle ${vehicle.hyoungNo} - ${vehicle.numberPlate}? This action cannot be undone.`);
    if (!confirmed) return;

    try {
      const response = await dispatch(deleteVehicle(id));

      if (response && response.success) {
        notify('Vehicle deleted successfully', 'success', 3000);
        navigate('/vehicles');
      } else {
        throw new Error(response?.message || 'Failed to delete vehicle');
      }
    } catch (error) {
      console.error('Error deleting vehicle:', error);
      notify('Failed to delete vehicle', 'error', 3000);
    }
  };

  // Vehicle metrics calculation (memoized for performance)
  const vehicleMetrics = useMemo(() => {
    if (!vehicle) return {};

    return {
      totalFuel: vehicle.totalFuelConsumed || 0,
      totalDistance: vehicle.totalDistance || 0,
      avgEfficiency: vehicle.avgEfficiency || 0,
      lastActivity: vehicle.lastActivity || 'N/A',
      status: vehicle.isActive ? 'Active' : 'Inactive',
      gpsStatus: vehicle.hasGPSInstalled ? 'Installed' : 'Not Installed'
    };
  }, [vehicle]);

  // Handle tab selection with loading state - Optimized for lazy loading
  const handleTabSelectionChange = useCallback((e) => {
    const newTabIndex = e.selectedIndex;
    setActiveTab(newTabIndex);

    // Only set loading state if we haven't loaded this tab's data before
    if (!tabDataLoaded[newTabIndex]) {
      setTabLoadingStates(prev => ({
        ...prev,
        [newTabIndex]: true
      }));

      // Mark tab as loaded after a short delay to simulate loading
      // In a real implementation, this would be set when data loading completes
      setTimeout(() => {
        setTabLoadingStates(prev => ({
          ...prev,
          [newTabIndex]: false
        }));

        setTabDataLoaded(prev => ({
          ...prev,
          [newTabIndex]: true
        }));
      }, 500);
    }
  }, [tabDataLoaded]);

  // Vehicle save handler - Stable reference
  const handleVehicleSave = useCallback((data) => {
    setVehicle(prevVehicle => ({ ...prevVehicle, ...data }));
    notify('Vehicle updated successfully', 'success', 3000);
  }, []);  // Create individual memoized components to prevent unnecessary re-renders
  const vehicleEditFormComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[0]) return null;
    return (
      <VehicleEditForm
        key={`vehicle-form-${vehicle?.vehicleId}`}
        vehicle={vehicle}
        isEditing={false}
        onSave={handleVehicleSave}
      />
    );
  }, [vehicle, handleVehicleSave, tabLoadingStates]);

  const consumptionHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[1]) return null;
    return <VehicleConsumptionHistory key={`consumption-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const maintenanceHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[2]) return null;
    return <VehicleMaintenanceHistory key={`maintenance-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const fuelingHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[3]) return null;
    return <VehicleFuelingHistory key={`fueling-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const schedulesComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[4]) return null;
    return <VehicleSchedules key={`schedules-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  const insuranceLicenseComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[5]) return null;
    return <VehicleInsuranceLicense key={`insurance-${vehicle?.vehicleId}`} vehicleId={id} />;
  }, [vehicle, id, tabLoadingStates]);

  // Memoize tab items with stable dependencies
  const tabItems = useMemo(() => {
    if (!vehicle) return [];

    // Loading spinner component reused for all tabs
    const loadingSpinner = (title) => (
      <div className="tw-flex tw-items-center tw-justify-center tw-h-64">
        <div className="tw-text-center">
          <i className="fa-light fa-spinner fa-spin tw-text-4xl tw-text-blue-600 tw-mb-4"></i>
          <p className="tw-text-gray-600">Loading {title.toLowerCase()}...</p>
        </div>
      </div>
    );

    return [
      {
        title: 'Vehicle Information',
        icon: 'fa-solid fa-edit',
        component: tabLoadingStates[0] ? loadingSpinner('vehicle information') : vehicleEditFormComponent
      },
      {
        title: 'Consumption History',
        icon: 'fa-solid fa-gas-pump',
        component: tabLoadingStates[1] ? loadingSpinner('consumption history') : consumptionHistoryComponent
      },
      {
        title: 'Maintenance History',
        icon: 'fa-solid fa-wrench',
        component: tabLoadingStates[2] ? loadingSpinner('maintenance history') : maintenanceHistoryComponent
      },
      {
        title: 'Fueling History',
        icon: 'fa-solid fa-pump',
        component: tabLoadingStates[3] ? loadingSpinner('fueling history') : fuelingHistoryComponent
      },
      {
        title: 'Schedules',
        icon: 'fa-solid fa-calendar',
        component: tabLoadingStates[4] ? loadingSpinner('schedules') : schedulesComponent
      },
      {
        title: 'Insurance & License',
        icon: 'fa-solid fa-shield-check',
        component: tabLoadingStates[5] ? loadingSpinner('insurance & license info') : insuranceLicenseComponent
      }
    ];
  }, [
    vehicle,
    vehicleEditFormComponent,
    consumptionHistoryComponent,
    maintenanceHistoryComponent,
    fuelingHistoryComponent,
    schedulesComponent,
    insuranceLicenseComponent,
    tabLoadingStates
  ]);


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

  return (
    <div className="vehicle-details tw-p-4 md:tw-p-6">
      {/* Header Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-4 md:tw-p-6 tw-mb-6">
        <div className="tw-flex tw-flex-col md:tw-flex-row md:tw-items-center md:tw-justify-between tw-mb-4">
          <div className="tw-flex tw-items-center tw-mb-4 md:tw-mb-0">
            <Button
              icon="fa-light fa-arrow-left"
              onClick={handleBackToList}
              stylingMode="text"
              className="tw-mr-4"
            />
            <div>
              <h1 className="tw-text-xl md:tw-text-2xl tw-font-bold tw-text-gray-800">
                {vehicle.hyoungNo} - {vehicle.numberPlate}
              </h1>
              <p className="tw-text-sm md:tw-text-base tw-text-gray-600">
                {vehicle.vehicleManufacturer?.name} {vehicle.vehicleModel?.name} • {vehicle.yom}
              </p>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="tw-flex tw-flex-wrap tw-gap-2">
            <Button
              text="Assign Tag"
              icon="fa-light fa-tag"
              onClick={handleAssignTag}
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


            <Button
              text="Generate Report"
              icon="fa-light fa-file-chart-column"
              onClick={handleGenerateReport}
              type="default"
              stylingMode="outlined"
            />

          </div>
        </div>

        {/* Vehicle Metrics Dashboard */}
        <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-3 lg:tw-grid-cols-6 tw-gap-4">
          <div className="tw-bg-blue-50 tw-p-4 tw-rounded-lg tw-border tw-border-blue-200">
            <div className="tw-text-sm tw-text-blue-600 tw-mb-1">Status</div>
            <div className="tw-text-lg tw-font-semibold tw-text-blue-800">{vehicleMetrics.status}</div>
          </div>

          <div className="tw-bg-green-50 tw-p-4 tw-rounded-lg tw-border tw-border-green-200">
            <div className="tw-text-sm tw-text-green-600 tw-mb-1">GPS Status</div>
            <div className="tw-text-lg tw-font-semibold tw-text-green-800">{vehicleMetrics.gpsStatus}</div>
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
          scrollByContent={true}
          selectedIndex={activeTab}
          onSelectionChanged={handleTabSelectionChange}
          animationEnabled={true}
          swipeEnabled={true}
          showNavButtons={true}
          itemTitleRender={(item) => (
            <div className="tw-flex tw-items-center tw-gap-2">
              <i className={item.icon}></i>
              <span className="tw-hidden md:tw-inline">{item.title}</span>
            </div>
          )}
          itemRender={(item) => (
            <div className="tw-p-4 md:tw-p-6">
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
        showCloseButton={true}
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
        width="90%"
        height="auto"
        showCloseButton={true}
      >
        <div className="tw-p-6 tw-text-center">
          <i className="fa-light fa-wrench tw-text-4xl tw-text-yellow-500 tw-mb-4"></i>
          <h3 className="tw-text-lg tw-font-semibold tw-mb-2">Site Assignment Form</h3>
          <p className="tw-text-gray-600 tw-mb-4">This feature is under development.</p>
          <p className="tw-text-gray-500 tw-mb-4">Site assignment will allow changing the working site for this vehicle.</p>

          {/* Available Sites Display */}
          <div className="tw-mb-4 tw-text-left tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-bg-gray-50">
            <h4 className="tw-font-semibold tw-mb-2">Available Sites ({sites.length})</h4>
            <ul className="tw-space-y-1 tw-max-h-40 tw-overflow-y-auto">
              {sites.map(site => (
                <li key={site.id} className="tw-p-2 tw-border-b tw-border-gray-200">
                  {site.name}
                </li>
              ))}
            </ul>
          </div>

          <Button
            text="Close"
            type="default"
            stylingMode="contained"
            onClick={() => setShowSitePopup(false)}
          />
        </div>
        {/* Uncomment when SiteAssignmentForm is implemented
        <SiteAssignmentForm
          vehicle={vehicle}
          sites={sites}
          onClose={() => setShowSitePopup(false)}
          onSuccess={(newSiteId) => {
            setVehicle({ ...vehicle, workingSiteId: newSiteId });
            setShowSitePopup(false);
            notify('Working site updated successfully', 'success', 3000);
          }}
        /> */}
      </Popup>

      <Popup
        visible={showExpectedAvgPopup}
        onHiding={() => setShowExpectedAvgPopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Set Expected Average for ${vehicle.hyoungNo}`}
        width="90%"
        height={'400'}
        showCloseButton={true}
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
