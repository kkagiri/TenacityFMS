/**
 * File: VehicleDetails.js
 * Purpose: Vehicle details screen with tabbed information, history, and admin-managed settings.
 * Dependencies: Redux actions, DevExtreme UI components, permissions via JWT.
 * Last Modified: 2026-01-15
 */

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
import VehicleDocumentsList from "./vehicledocuments/VehicleDocumentsList";
import VehicleGPSInformation from "./component/VehicleGPSInformation";
import VehicleFuelingRuleAssignment from "./component/vehicledetails/VehicleFuelingRuleAssignment";
import { VehicleTransferHistory } from "./component/vehicletransfer";

// Import popup components
import TagAssignmentForm from "../../components/Tags/TagAssignmentForm/TagAssignmentForm";
import EnhancedExpectedAverageForm from "./component/vehicledetails/EnhancedExpectedAverageForm";

// Services
import {
  getVehicleById,
  deleteVehicle,
  updateVehicle,
} from "../../redux/actions/vehicleActions";
import { fetchTags } from "../../redux/actions/tagActions";
import { fetchSiteList } from "../../redux/actions/siteActions";
import axiosInstance from "../../api/axiosInstance";
import { usePermissions } from "../../hooks/usePermissions";

import "./VehicleDetails.scss";

const VehicleDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  // Permissions (admin-only editing for settings)
  const { hasRole } = usePermissions();
  const isAdmin = hasRole("Admin") || hasRole("SuperAdmin");

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
  const [gpsData, setGpsData] = useState(null); // GPS data for fuel level
  const [tabLoadingStates, setTabLoadingStates] = useState({
    0: true, // Vehicle Information tab starts loading
    // Other tabs will be set to true only when selected
  });
  const [tabDataLoaded, setTabDataLoaded] = useState({}); // Track which tabs have loaded their data
  const [dataLoaded, setDataLoaded] = useState(false); // Track if vehicle data is loaded
  const [isSaving, setIsSaving] = useState(false); // Track save operation

  // Reset component state when vehicle ID changes
  useEffect(() => {
    setDataLoaded(false);
    setVehicle(null);
    setGpsData(null);
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

        // Load GPS data for fuel level if vehicle has GPS installed
        if (vehicleData.hasGPSInstalled) {
          try {
            const gpsResponse = await axiosInstance.get(
              `/vehicletracking/${id}/gps-information`
            );
            if (gpsResponse.data && gpsResponse.data.isSuccess) {
              setGpsData(gpsResponse.data.data);
            }
          } catch (error) {
            console.error("Error loading GPS information:", error);
            // Don't show error notification, just log it - GPS data is optional
          }
        }

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
    if (!isAdmin) {
      notify("Only admins can change vehicle settings", "warning", 3000);
      return;
    }
    setShowTagPopup(true);
  };

  // Site popup handler (will be used when SiteAssignmentForm is implemented)
  const handleChangeSite = () => {
    setShowSitePopup(true);
  };

  const handleAssignExpectedAverage = () => {
    if (!isAdmin) {
      notify("Only admins can change vehicle settings", "warning", 3000);
      return;
    }
    setShowExpectedAvgPopup(true);
  };

  // Helper function to navigate to fueling history tab
  const handleViewFuelHistory = () => {
    // Navigate to the fuel history tab
    setActiveTab(4); // Fueling History tab (index changed after removing Schedules and reordering)
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
  const handleVehicleSave = useCallback(
    async (data) => {
      try {
        setIsSaving(true);

        // Build the complete vehicle data for update
        const updateData = {
          ...vehicle,
          ...data,
          vehicleId: parseInt(id),
        };

        const response = await dispatch(updateVehicle(id, updateData));

        if (response.success) {
          setVehicle((prevVehicle) => ({ ...prevVehicle, ...data }));
          notify("Vehicle updated successfully", "success", 3000);
        } else {
          notify(response.message || "Failed to update vehicle", "error", 3000);
        }
      } catch (error) {
        console.error("Error updating vehicle:", error);
        notify(error.message || "Failed to update vehicle", "error", 3000);
      } finally {
        setIsSaving(false);
      }
    },
    [dispatch, id, vehicle]
  ); // Create individual memoized components to prevent unnecessary re-renders
  const vehicleEditFormComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[0]) return null;
    return (
      <VehicleEditForm
        key={`vehicle-form-${vehicle?.vehicleId}`}
        vehicle={vehicle}
        isEditing={false}
        onSave={handleVehicleSave}
        isSaving={isSaving}
        canEdit={isAdmin}
      />
    );
  }, [vehicle, handleVehicleSave, tabLoadingStates, isSaving, isAdmin]);

  const consumptionHistoryComponent = useMemo(() => {
    // Always render the component - let it handle its own loading state
    // This prevents unmount/remount which causes DataGrid DOM errors
    return <VehicleConsumptionHistory vehicleId={id} />;
  }, [id]); // Only recreate if vehicle ID changes

  const maintenanceHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[3]) return null;
    return (
      <VehicleMaintenanceHistory
        key={`maintenance-${vehicle?.vehicleId}`}
        vehicleId={id}
      />
    );
  }, [vehicle, id, tabLoadingStates]);

  const fuelingHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[4]) return null;
    return (
      <VehicleFuelingHistory
        key={`fueling-${vehicle?.vehicleId}`}
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
    if (!vehicle || tabLoadingStates[1]) return null;
    return (
      <VehicleGPSInformation key={`gps-${vehicle?.vehicleId}`} vehicleId={id} />
    );
  }, [vehicle, id, tabLoadingStates]);

  const fuelingRulesComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[6]) return null;
    return (
      <VehicleFuelingRuleAssignment
        key={`fueling-rules-${vehicle?.vehicleId}`}
        vehicle={vehicle}
        canEdit={isAdmin}
      />
    );
  }, [vehicle, tabLoadingStates, isAdmin]);

  const transferHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[7]) return null;
    return (
      <VehicleTransferHistory
        key={`transfer-${vehicle?.vehicleId}`}
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
        title: "GPS Information",
        icon: "fa-solid fa-satellite",
        component: tabLoadingStates[1]
          ? loadingSpinner("GPS information")
          : gpsInformationComponent,
      },
      {
        title: "Consumption History",
        icon: "fa-solid fa-gas-pump",
        component: tabLoadingStates[2]
          ? loadingSpinner("consumption history")
          : consumptionHistoryComponent,
      },
      {
        title: "Maintenance History",
        icon: "fa-solid fa-wrench",
        component: tabLoadingStates[3]
          ? loadingSpinner("maintenance history")
          : maintenanceHistoryComponent,
      },
      {
        title: "Fueling History",
        icon: "fa-solid fa-pump",
        component: tabLoadingStates[4]
          ? loadingSpinner("fueling history")
          : fuelingHistoryComponent,
      },
      {
        title: "Documents",
        icon: "fa-solid fa-file-lines",
        component: tabLoadingStates[5]
          ? loadingSpinner("documents")
          : documentsComponent,
      },
      {
        title: "Fueling Rules",
        icon: "fa-solid fa-gavel",
        component: tabLoadingStates[6]
          ? loadingSpinner("fueling rules")
          : fuelingRulesComponent,
      },
      {
        title: "Transfers",
        icon: "fa-solid fa-truck-moving",
        component: tabLoadingStates[7]
          ? loadingSpinner("transfer history")
          : transferHistoryComponent,
      },
    ];
  }, [
    vehicle,
    vehicleEditFormComponent,
    gpsInformationComponent,
    consumptionHistoryComponent,
    maintenanceHistoryComponent,
    fuelingHistoryComponent,
    documentsComponent,
    fuelingRulesComponent,
    transferHistoryComponent,
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
              {/* Display current location address if available - clickable to go to GPS tab */}
              {gpsData?.address && (
                <p
                  className="tw-text-sm tw-text-blue-600 tw-mt-1 tw-flex tw-items-center tw-gap-2 tw-cursor-pointer hover:tw-text-blue-800 hover:tw-underline"
                  onClick={() => setActiveTab(1)}
                  title="Click to view on map"
                >
                  <i className="fa-light fa-map-marker-alt"></i>
                  <span>{gpsData.address}</span>
                </p>
              )}
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
              disabled={!isAdmin}
              hint={!isAdmin ? "Admin only" : "Assign RFID tag"}
            />
            <Button
              text="Expected Average"
              icon="fa-light fa-chart-line"
              onClick={handleAssignExpectedAverage}
              type="default"
              stylingMode="outlined"
              className="vehicle-details__action-btn vehicle-details__action-btn--middle"
              disabled={!isAdmin}
              hint={!isAdmin ? "Admin only" : "Set expected average"}
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
            {/* Default Driver Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--status">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-user"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">
                  Default Driver
                </div>
                <div className="vehicle-details__metric-value">
                  {vehicle.defaultDriver?.name ||
                    vehicle.defaultDriver?.fullName ||
                    "Not Assigned"}
                </div>
              </div>
            </div>

            {/* Ignition Status Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--gps">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-key"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">Ignition</div>
                <div className="vehicle-details__metric-value">
                  {gpsData?.sensorHealth?.ignitionStatus !== null &&
                  gpsData?.sensorHealth?.ignitionStatus !== undefined
                    ? gpsData.sensorHealth.ignitionStatus
                      ? "ON"
                      : "OFF"
                    : "N/A"}
                </div>
              </div>
            </div>

            {/* Working Site Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--site">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-building"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">
                  Working Site
                </div>
                <div className="vehicle-details__metric-value">
                  {vehicle.workingSite?.name || "Not Assigned"}
                </div>
              </div>
            </div>

            {/* GPS Signal Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--gps-signal">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-satellite"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">GPS Signal</div>
                <div className="vehicle-details__metric-value">
                  {gpsData?.sensorHealth?.gpsSignalStrength || "N/A"}
                </div>
              </div>
            </div>

            {/* Fuel Level Card */}
            <div className="vehicle-details__metric-card vehicle-details__metric-card--fuel">
              <div className="vehicle-details__metric-icon">
                <i className="fa-light fa-gas-pump"></i>
              </div>
              <div className="vehicle-details__metric-content">
                <div className="vehicle-details__metric-label">Fuel Level</div>
                <div className="vehicle-details__metric-value">
                  {gpsData?.sensorHealth?.fuelLevel !== null &&
                  gpsData?.sensorHealth?.fuelLevel !== undefined
                    ? `${Math.floor(gpsData.sensorHealth.fuelLevel)} ${
                        gpsData.sensorHealth.fuelLevelUnit || "L"
                      }`
                    : "N/A"}
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
        maxWidth={800}
        maxHeight="90%"
        showCloseButton={true}
      >
        <ScrollView width="100%" height="100%">
          <EnhancedExpectedAverageForm
            vehicle={vehicle}
            onClose={() => setShowExpectedAvgPopup(false)}
            onSuccess={(newAverage) => {
              setVehicle({ ...vehicle, defaultExptdAvgid: newAverage });
              setShowExpectedAvgPopup(false);
              notify("Expected average updated successfully", "success", 3000);
            }}
          />
        </ScrollView>
      </Popup>
    </div>
  );
};

export default VehicleDetails;
