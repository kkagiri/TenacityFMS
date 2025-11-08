import React, { useState, useEffect, useMemo, useCallback } from "react";

import { useParams, useNavigate } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Tabs from "devextreme-react/tabs";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { Popup, ScrollView } from "devextreme-react";

// Import tab components
import VehicleEditForm from "./component/VehicleEditForm";
import VehicleConsumptionHistory from "./component/VehicleConsumptionHistory";
import VehicleMaintenanceHistory from "./component/VehicleMaintenanceHistory";
import VehicleFuelingHistory from "./component/VehicleFuelingHistory";
import VehicleSchedules from "./component/VehicleSchedules";
import VehicleDocumentsList from "./vehicledocuments/VehicleDocumentsList";
import VehicleGPSInformation from "./component/VehicleGPSInformation";

// Import popup components
import TagAssignmentForm from "../../components/Tags/TagAssignmentForm/TagAssignmentForm";
import ExpectedAverageForm from "./component/vehicledetails/ExpectedAverageForm";

// Services
import {
  getVehicleById,
  deleteVehicle,
} from "../../redux/actions/vehicleActions";
import { fetchTags } from "../../redux/actions/tagActions";
import { fetchSiteList } from "../../redux/actions/siteActions";

import "./VehicleDetails.scss";

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

  // Reset component state when vehicle ID changes
  useEffect(() => {
    setDataLoaded(false);
    setVehicle(null);
    setTabDataLoaded({});
    setTabLoadingStates({
      0: true,
    });
    setActiveTab(0);
  }, [id]);

  // Load vehicle data - Fixed dependencies and optimized
  useEffect(() => {
    const loadVehicleData = async () => {
      if (dataLoaded) return; // Prevent re-loading

      try {
        setIsLoading(true);

        // Try to get vehicle from existing state first
        let vehicleData = vehicles.find((v) => v.vehicleId === parseInt(id));

        if (!vehicleData) {
          // If not in state, fetch from API
          const response = await dispatch(getVehicleById(id));
          vehicleData = response.data;
        }

        setVehicle(vehicleData);

        // Ensure supporting data is loaded
        await Promise.all([dispatch(fetchTags()), dispatch(fetchSiteList())]);

        setDataLoaded(true); // Mark as loaded

        // Mark first tab as loaded
        setTabLoadingStates((prev) => ({
          ...prev,
          0: false,
        }));

        setTabDataLoaded((prev) => ({
          ...prev,
          0: true,
        }));
      } catch (error) {
        console.error("Error loading vehicle data:", error);
        notify("Error loading vehicle data", "error", 3000);
      } finally {
        setIsLoading(false);
      }
    };

    if (id && !dataLoaded) {
      // Only load if not already loaded
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
    notify("Report generation feature coming soon", "info", 3000);
  };

  const handleBackToList = () => {
    navigate("/vehicles/fleet");
  };

  const handleDelete = async () => {
    const confirmed = window.confirm(
      `Are you sure you want to delete vehicle ${vehicle.hyoungNo} - ${vehicle.numberPlate}? This action cannot be undone.`
    );
    if (!confirmed) return;

    try {
      const response = await dispatch(deleteVehicle(id));

      if (response && response.success) {
        notify("Vehicle deleted successfully", "success", 3000);
        navigate("/vehicles");
      } else {
        throw new Error(response?.message || "Failed to delete vehicle");
      }
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      notify("Failed to delete vehicle", "error", 3000);
    }
  };

  // Vehicle metrics calculation (memoized for performance)
  const vehicleMetrics = useMemo(() => {
    if (!vehicle) return {};

    return {
      totalFuel: vehicle.totalFuelConsumed || 0,
      totalDistance: vehicle.totalDistance || 0,
      avgEfficiency: vehicle.avgEfficiency || 0,
      lastActivity: vehicle.lastActivity || "N/A",
      status: vehicle.isActive ? "Active" : "Inactive",
      gpsStatus: vehicle.hasGPSInstalled ? "Installed" : "Not Installed",
    };
  }, [vehicle]);

  // Handle tab selection with loading state - Optimized for lazy loading
  const handleTabSelectionChange = useCallback(
    (e) => {
      const newTabIndex = e.itemIndex;
      setActiveTab(newTabIndex);

      // Only set loading state if we haven't loaded this tab's data before
      if (!tabDataLoaded[newTabIndex]) {
        setTabLoadingStates((prev) => ({
          ...prev,
          [newTabIndex]: true,
        }));

        // Mark tab as loaded after a short delay to simulate loading
        // In a real implementation, this would be set when data loading completes
        setTimeout(() => {
          setTabLoadingStates((prev) => ({
            ...prev,
            [newTabIndex]: false,
          }));

          setTabDataLoaded((prev) => ({
            ...prev,
            [newTabIndex]: true,
          }));
        }, 500);
      }
    },
    [tabDataLoaded]
  );

  // Vehicle save handler - Stable reference
  const handleVehicleSave = useCallback((data) => {
    setVehicle((prevVehicle) => ({ ...prevVehicle, ...data }));
    notify("Vehicle updated successfully", "success", 3000);
  }, []); // Create individual memoized components to prevent unnecessary re-renders
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
    // Always render the component - let it handle its own loading state
    // This prevents unmount/remount which causes DataGrid DOM errors
    return (
      <VehicleConsumptionHistory
        vehicleId={id}
      />
    );
  }, [id]); // Only recreate if vehicle ID changes

  const maintenanceHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[2]) return null;
    return (
      <VehicleMaintenanceHistory
        key={`maintenance-${vehicle?.vehicleId}`}
        vehicleId={id}
      />
    );
  }, [vehicle, id, tabLoadingStates]);

  const fuelingHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[3]) return null;
    return (
      <VehicleFuelingHistory
        key={`fueling-${vehicle?.vehicleId}`}
        vehicleId={id}
      />
    );
  }, [vehicle, id, tabLoadingStates]);

  const schedulesComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[4]) return null;
    return (
      <VehicleSchedules
        key={`schedules-${vehicle?.vehicleId}`}
        vehicleId={id}
      />
    );
  }, [vehicle, id, tabLoadingStates]);

  const documentsComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[5]) return null;
    return (
      <VehicleDocumentsList
        key={`documents-${vehicle?.vehicleId}`}
        vehicleId={id}
      />
    );
  }, [vehicle, id, tabLoadingStates]);

  const gpsInformationComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[6]) return null;
    return (
      <VehicleGPSInformation
        key={`gps-${vehicle?.vehicleId}`}
        vehicleId={id}
      />
    );
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
        title: "Vehicle Information",
        icon: "fa-solid fa-edit",
        component: tabLoadingStates[0]
          ? loadingSpinner("vehicle information")
          : vehicleEditFormComponent,
      },
      {
        title: "Consumption History",
        icon: "fa-solid fa-gas-pump",
        component: tabLoadingStates[1]
          ? loadingSpinner("consumption history")
          : consumptionHistoryComponent,
      },
      {
        title: "Maintenance History",
        icon: "fa-solid fa-wrench",
        component: tabLoadingStates[2]
          ? loadingSpinner("maintenance history")
          : maintenanceHistoryComponent,
      },
      {
        title: "Fueling History",
        icon: "fa-solid fa-pump",
        component: tabLoadingStates[3]
          ? loadingSpinner("fueling history")
          : fuelingHistoryComponent,
      },
      {
        title: "Schedules",
        icon: "fa-solid fa-calendar",
        component: tabLoadingStates[4]
          ? loadingSpinner("schedules")
          : schedulesComponent,
      },
      {
        title: "Documents",
        icon: "fa-solid fa-file-lines",
        component: tabLoadingStates[5]
          ? loadingSpinner("documents")
          : documentsComponent,
      },
      {
        title: "GPS Information",
        icon: "fa-solid fa-satellite",
        component: tabLoadingStates[6]
          ? loadingSpinner("GPS information")
          : gpsInformationComponent,
      },
    ];
  }, [
    vehicle,
    vehicleEditFormComponent,
    consumptionHistoryComponent,
    maintenanceHistoryComponent,
    fuelingHistoryComponent,
    schedulesComponent,
    documentsComponent,
    gpsInformationComponent,
    tabLoadingStates,
  ]);

  const renderTabItem = (item) => {
    return (
      <div className="tw-flex tw-items-center tw-gap-2">
        <i className={item.icon}></i>
        <span className="tw-hidden md:tw-inline">{item.title}</span>
      </div>
    );
  };

  const renderContent = () => {
    const activeComponent = tabItems[activeTab]?.component;
    return activeComponent ? (
      <div className="tw-p-4 md:tw-p-6">{activeComponent}</div>
    ) : null;
  };

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
          <h2 className="tw-text-xl tw-font-semibold tw-text-gray-800">
            Vehicle Not Found
          </h2>
          <p className="tw-text-gray-600 tw-mb-6">
            The requested vehicle could not be found.
          </p>
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
    <div className="vehicle-details tw-p-2 md:tw-p-6">
      {/* Header Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200 tw-p-4 md:tw-p-6 tw-mb-6">
        {/* Back Button - Above Vehicle Name */}
        <div className="tw-mb-4">
          <Button
            icon="fa-light fa-arrow-left"
            onClick={handleBackToList}
            stylingMode="text"
            className="vehicle-details__back-button"
            hint="Back to Vehicle List"
          />
        </div>

        <div className="vehicle-details__header-content tw-relative tw-flex tw-flex-col lg:tw-flex-row lg:tw-items-start lg:tw-justify-between tw-gap-4 tw-mb-4">
          {/* Vehicle Info Section */}
          <div className="tw-flex-1">
            <div>
              <h1 className="tw-text-xl md:tw-text-2xl tw-font-bold tw-text-gray-800 tw-mb-2">
                {vehicle.hyoungNo} - {vehicle.numberPlate}
              </h1>
              <p className="tw-text-sm md:tw-text-base tw-text-gray-600">
                {vehicle.vehicleManufacturer?.name} {vehicle.vehicleModel?.name}
              </p>
            </div>
          </div>

          {/* Quick Action Icon Buttons - Right side on wide screen, below title on small */}
          <div className="vehicle-details__action-buttons">
            <Button
              text="Assign Tag"
              icon="fa-light fa-tag"
              onClick={handleAssignTag}
              type="default"
              stylingMode="outlined"
              className="vehicle-details__action-btn vehicle-details__action-btn--first"
            />
            <Button
              text="Expected Average"
              icon="fa-light fa-chart-line"
              onClick={handleAssignExpectedAverage}
              type="default"
              stylingMode="outlined"
              className="vehicle-details__action-btn vehicle-details__action-btn--middle"
            />
            <Button
              text="Generate Report"
              icon="fa-light fa-file-chart-column"
              onClick={handleGenerateReport}
              type="default"
              stylingMode="outlined"
              className="vehicle-details__action-btn vehicle-details__action-btn--last"
            />
          </div>
        </div>

        {/* Vehicle Metrics Dashboard - Modern Card Design */}
        <div className="vehicle-details__metrics">
          <div className="vehicle-details__metrics-grid tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
            {/* Status Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--status">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-circle-check"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">Status</div>
                <div className="vehicle-details__metric-value">
                  {vehicleMetrics.status}
                </div>
              </div>
            </div>

            {/* GPS Status Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--gps">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-satellite"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">GPS Status</div>
                <div className="vehicle-details__metric-value">
                  {vehicleMetrics.gpsStatus}
                </div>
              </div>
            </div>

            {/* Working Site Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--site">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-building"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">Working Site</div>
                <div className="vehicle-details__metric-value">
                  {vehicle.workingSite?.name || "Not Assigned"}
                </div>
              </div>
            </div>

            {/* Default Driver Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--driver">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-user"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">Default Driver</div>
                <div className="vehicle-details__metric-value">
                  {vehicle.defaultEmployee?.fullName || "Not Assigned"}
                </div>
              </div>
            </div>

            {/* Vehicle Type Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--type">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-car-side"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">Vehicle Type</div>
                <div className="vehicle-details__metric-value">
                  {vehicle.vehicleType?.name || "Not Specified"}
                </div>
              </div>
            </div>

            {/* Capacity Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--capacity">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-gauge-high"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">Capacity</div>
                <div className="vehicle-details__metric-value">
                  {vehicle.capacity || "Not Specified"}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Section */}
      <div className="tw-bg-white tw-rounded-lg tw-shadow-sm tw-border tw-border-gray-200">
        <Tabs
          dataSource={tabItems}
          selectedIndex={activeTab}
          onItemClick={handleTabSelectionChange}
          width="100%"
          className="tw-mb-4"
          itemRender={renderTabItem}
        />
        <div className="tw-p-4">{renderContent()}</div>
      </div>

      {/* Popup Forms */}
      <Popup
        visible={showTagPopup}
        onHiding={() => setShowTagPopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Assign RFID Tag to ${vehicle.hyoungNo}`}
        width="90%"
        height="auto"
        maxWidth={600}
        maxHeight="90%"
        showCloseButton={true}
        position={{ my: "center", at: "center", of: window }}
      >
        <ScrollView width="100%" height="100%">
          <div className="tw-p-4">
            <TagAssignmentForm
              vehicle={vehicle}
              tags={tags}
              onClose={() => setShowTagPopup(false)}
              onSuccess={() => {
                setShowTagPopup(false);
                notify("Tag assigned successfully", "success", 3000);
              }}
            />
          </div>
        </ScrollView>
      </Popup>

      <Popup
        visible={showSitePopup}
        onHiding={() => setShowSitePopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Change Working Site for ${vehicle.hyoungNo}`}
        width="90%"
        height="auto"
        maxWidth={600}
        maxHeight="90%"
        showCloseButton={true}
      >
        <ScrollView width="100%" height="100%">
          <div className="tw-p-4">
            <div className="tw-text-center">
              <i className="fa-light fa-wrench tw-text-4xl tw-text-yellow-500 tw-mb-4"></i>
              <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
                Site Assignment Form
              </h3>
              <p className="tw-text-gray-600 tw-mb-4">
                This feature is under development.
              </p>
              <p className="tw-text-gray-500 tw-mb-4">
                Site assignment will allow changing the working site for this
                vehicle.
              </p>

              {/* Available Sites Display */}
              <div className="tw-mb-4 tw-text-left tw-border tw-border-gray-200 tw-rounded-lg tw-p-4 tw-bg-gray-50">
                <h4 className="tw-font-semibold tw-mb-2">
                  Available Sites ({sites.length})
                </h4>
                <ul className="tw-space-y-1 tw-max-h-40 tw-overflow-y-auto">
                  {sites.map((site) => (
                    <li
                      key={site.id}
                      className="tw-p-2 tw-border-b tw-border-gray-200"
                    >
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
          </div>
        </ScrollView>
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
        height="auto"
        maxWidth={600}
        maxHeight="90%"
        showCloseButton={true}
      >
        <ScrollView width="100%" height="100%">
          <div className="tw-p-4">
            <ExpectedAverageForm
              vehicle={vehicle}
              onClose={() => setShowExpectedAvgPopup(false)}
              onSuccess={(newAverage) => {
                setVehicle({ ...vehicle, defaultExptdAvgid: newAverage });
                setShowExpectedAvgPopup(false);
                notify("Expected average updated successfully", "success", 3000);
              }}
            />
          </div>
        </ScrollView>
      </Popup>
    </div>
  );
};

export default VehicleDetails;
