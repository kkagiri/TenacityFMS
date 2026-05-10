/**
 * File: VehicleDetails.js
 * Purpose: Vehicle details screen with tabbed information, history, and admin-managed settings.
 * Dependencies: Redux actions, DevExtreme UI components, permissions via JWT.
 * Last Modified: 2026-01-15
 */

import React, { useState, useEffect, useMemo, useCallback } from "react";

import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import Tabs from "devextreme-react/tabs";
import Button from "devextreme-react/button";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import { Popup, ScrollView } from "devextreme-react";

// Import tab components
import VehicleEditForm from "./components/VehicleEditForm";
import VehicleConsumptionHistory from "./components/VehicleConsumptionHistory";
import VehicleMaintenanceHistory from "../maintenance/VehicleMaintenanceHistory";
import VehicleFuelingHistory from "../maintenance/VehicleFuelingHistory";
import VehicleDocumentsList from "../documents/VehicleDocumentsList";
import VehicleGPSInformation from "./components/VehicleGPSInformation";
import VehicleFuelingRuleAssignment from "./components/VehicleFuelingRuleAssignment";
import VehicleTransferHistory from "../transfers/VehicleTransferHistory";
import VehicleTripHistory from "./components/VehicleTripHistory";

// Import popup components
import TagAssignmentForm from "../../../components/Tags/TagAssignmentForm/TagAssignmentForm";
import EnhancedExpectedAverageForm from "./components/EnhancedExpectedAverageForm";

// Services
import {
  getVehicleById,
  deleteVehicle,
  updateVehicle,
} from "../../../redux/actions/vehicleActions";
import { fetchTags } from "../../../redux/actions/tagActions";
import { fetchSiteList } from "../../../redux/actions/siteActions";
import { fetchVehicleManufacturers } from "../../../redux/actions/vehicleManufacturerActions";
import { fetchVehicleModels } from "../../../redux/actions/vehicleModelActions";
import axiosInstance from "../../../api/axiosInstance";
import { usePermissions } from "../../../hooks/usePermissions";

import "./VehicleDetails.scss";

// Tab slug mapping — keeps URL in sync with active tab.
// Order must match the tabItems array below.
const TAB_SLUGS = [
  "vehicle-information",
  "gps-information",
  "consumption-history",
  "maintenance-history",
  "fueling-history",
  "documents",
  "fueling-rules",
  "transfers",
  "trip-history",
];

// Legacy (pre-hyphen) slugs — map to the new hyphenated slugs so old deep links still work.
const LEGACY_TAB_SLUGS = {
  vehicleinformation: "vehicle-information",
  gpsinformation: "gps-information",
  consumptionhistory: "consumption-history",
  maintenancehistory: "maintenance-history",
  fuelinghistory: "fueling-history",
  fuelingrules: "fueling-rules",
  triphistory: "trip-history",
};

const getTabIndexFromSlug = (slug) => {
  if (!slug) return -1;
  const normalized = String(slug).toLowerCase();
  const resolved = LEGACY_TAB_SLUGS[normalized] || normalized;
  return TAB_SLUGS.indexOf(resolved);
};

const VehicleDetails = () => {
  const { id, tab: tabParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const slugIndex = getTabIndexFromSlug(tabParam);
  const requestedInitialTab = slugIndex >= 0
    ? slugIndex
    : (Number.isInteger(location.state?.initialTab)
      ? location.state.initialTab
      : 0);

  // Permissions (editing gated by permission)
  const { hasPermission } = usePermissions();
  const isAdmin = hasPermission("_Edit_Vehicle");

  // Redux state
  const vehicles = useSelector((state) => state.vehicle.vehicles);
  const tags = useSelector((state) => state.tag.tags);
  const sites = useSelector((state) => state.site.sites); // Used in SiteAssignmentForm component
  const vehicleManufacturers = useSelector((state) => state.vehicleManufacturer?.manufacturers || []);
  const vehicleModels = useSelector((state) => state.vehicleModel?.vehicleModels || []);
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

  const resolveLookupName = useCallback((list, id, nameKeys = ["name"]) => {
    const numericId = Number(id);
    if (!Number.isFinite(numericId)) return "";

    const match = (Array.isArray(list) ? list : []).find((item) =>
      ["id", "Id", "siteId", "vehicleModelId", "vehicleManufacturerId"].some(
        (key) => Number(item?.[key]) === numericId
      )
    );

    if (!match) return "";
    const keys = Array.isArray(nameKeys) ? nameKeys : [nameKeys];
    const resolvedKey = keys.find((key) => typeof match?.[key] === "string" && match[key].trim());
    return resolvedKey ? match[resolvedKey] : "";
  }, []);

  const vehicleManufacturerDisplay = useMemo(() => {
    return (
      vehicle?.vehicleManufacturer?.name ||
      vehicle?.vehicleManufacturerName ||
      vehicle?.VehicleManufacturerName ||
      resolveLookupName(
        vehicleManufacturers,
        vehicle?.vehicleManufacturerId ?? vehicle?.VehicleManufacturerId ?? vehicle?.vehicleManufacturer?.id,
        ["name", "vehicleManufacturerName"]
      ) ||
      ""
    );
  }, [vehicle, vehicleManufacturers, resolveLookupName]);

  const vehicleModelDisplay = useMemo(() => {
    return (
      vehicle?.vehicleModel?.name ||
      vehicle?.vehicleModelName ||
      vehicle?.VehicleModelName ||
      resolveLookupName(
        vehicleModels,
        vehicle?.vehicleModelId ?? vehicle?.VehicleModelId ?? vehicle?.vehicleModel?.id,
        ["name", "vehicleModelName"]
      ) ||
      ""
    );
  }, [vehicle, vehicleModels, resolveLookupName]);

  const workingSiteDisplay = useMemo(() => {
    return (
      vehicle?.workingSite?.name ||
      vehicle?.workingSiteName ||
      vehicle?.WorkingSiteName ||
      resolveLookupName(
        sites,
        vehicle?.workingSiteId ?? vehicle?.WorkingSiteId ?? vehicle?.workingSite?.id,
        ["name", "siteName"]
      ) ||
      "Not Assigned"
    );
  }, [vehicle, sites, resolveLookupName]);

  // Reset component state when vehicle ID changes
  useEffect(() => {
    setDataLoaded(false);
    setVehicle(null);
    setGpsData(null);
    setTabDataLoaded({});
    setTabLoadingStates({
      [requestedInitialTab]: true,
    });
    setActiveTab(requestedInitialTab);
  }, [id, requestedInitialTab]);

  useEffect(() => {
    if (!dataLoaded || requestedInitialTab === 0 || tabDataLoaded[requestedInitialTab]) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setTabLoadingStates((prev) => ({
        ...prev,
        [requestedInitialTab]: false,
      }));

      setTabDataLoaded((prev) => ({
        ...prev,
        [requestedInitialTab]: true,
      }));
    }, 100);

    return () => clearTimeout(timer);
  }, [dataLoaded, requestedInitialTab, tabDataLoaded]);

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
        await Promise.all([
          dispatch(fetchTags()),
          dispatch(fetchSiteList()),
          dispatch(fetchVehicleManufacturers()),
          dispatch(fetchVehicleModels()),
        ]);

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
    navigate(`/vehicles/${id}/details/fueling-history`);
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
      `Are you sure you want to delete vehicle ${vehicle.vehicleCode} - ${vehicle.numberPlate}? This action cannot be undone.`
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

      // Keep URL in sync with the active tab
      const slug = TAB_SLUGS[newTabIndex];
      if (slug && slug !== tabParam) {
        navigate(`/vehicles/${id}/details/${slug}`, { replace: true });
      }

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
    [tabDataLoaded, tabParam, id, navigate]
  );

  // URL is the source of truth. Normalize legacy slugs, then sync activeTab from the URL.
  useEffect(() => {
    if (!id || !tabParam) return;
    const normalized = String(tabParam).toLowerCase();
    // Legacy slug (no hyphens): redirect to canonical hyphenated slug.
    if (LEGACY_TAB_SLUGS[normalized]) {
      navigate(`/vehicles/${id}/details/${LEGACY_TAB_SLUGS[normalized]}`, { replace: true });
      return;
    }
    const idx = TAB_SLUGS.indexOf(normalized);
    if (idx >= 0 && idx !== activeTab) {
      setActiveTab(idx);
    }
  }, [tabParam, id]); // eslint-disable-line react-hooks/exhaustive-deps

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

  const tripHistoryComponent = useMemo(() => {
    if (!vehicle || tabLoadingStates[8]) return null;
    return (
      <VehicleTripHistory
        key={`trips-${vehicle?.vehicleId}`}
        vehicleId={id}
        canRecompute={isAdmin}
        canManageTrips={isAdmin}
      />
    );
  }, [vehicle, id, tabLoadingStates, isAdmin]);

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
      {
        title: "Trip History",
        icon: "fa-solid fa-route",
        component: tabLoadingStates[8]
          ? loadingSpinner("trip history")
          : tripHistoryComponent,
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
    tripHistoryComponent,
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
    return activeComponent ? <>{activeComponent}</> : null;
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

  const ignitionStatus =
    gpsData?.sensorHealth?.ignitionStatus !== null &&
      gpsData?.sensorHealth?.ignitionStatus !== undefined
      ? gpsData.sensorHealth.ignitionStatus
        ? "ON"
        : "OFF"
      : "N/A";

  const fuelLevelDisplay =
    gpsData?.sensorHealth?.fuelLevel !== null &&
      gpsData?.sensorHealth?.fuelLevel !== undefined
      ? `${Math.floor(gpsData.sensorHealth.fuelLevel)} ${gpsData.sensorHealth.fuelLevelUnit || "L"}`
      : "N/A";

  const metrics = [
    {
      key: "driver", icon: "fa-light fa-user", label: "Default Driver",
      value: vehicle.defaultDriver?.name || vehicle.defaultDriver?.fullName || "Not Assigned"
    },
    { key: "ignition", icon: "fa-light fa-key", label: "Ignition", value: ignitionStatus },
    { key: "site", icon: "fa-light fa-building", label: "Working Site", value: workingSiteDisplay },
    {
      key: "gps", icon: "fa-light fa-satellite", label: "GPS Signal",
      value: gpsData?.sensorHealth?.gpsSignalStrength || "N/A"
    },
    { key: "fuel", icon: "fa-light fa-gas-pump", label: "Fuel Level", value: fuelLevelDisplay },
    {
      key: "capacity", icon: "fa-light fa-gauge-high", label: "Capacity",
      value: vehicle.capacity || "Not Specified"
    },
  ];

  return (
    <div className="vehicle-details">
      {/* M365 Page Header */}
      <div className="vehicle-details__page-header">
        <div className="vehicle-details__page-header-left">
          <button
            type="button"
            className="m365-icon-btn vehicle-details__back-btn"
            onClick={handleBackToList}
            title="Back to Vehicle List"
            aria-label="Back to Vehicle List"
          >
            <i className="fa-light fa-arrow-left"></i>
          </button>
          <div className="vehicle-details__title-block">
            <h2 className="vehicle-details__title">
              <i className="fa-light fa-truck vehicle-details__title-icon"></i>
              {vehicle.vehicleCode} &middot; {vehicle.numberPlate}
            </h2>
            <div className="vehicle-details__subtitle">
              {[vehicleManufacturerDisplay, vehicleModelDisplay].filter(Boolean).join(" ") || "—"}
              {gpsData?.address && (
                <button
                  type="button"
                  className="vehicle-details__address-link"
                  onClick={() => navigate(`/vehicles/${id}/details/gps-information`)}
                  title="View on map"
                >
                  <i className="fa-light fa-location-dot"></i>
                  <span>{gpsData.address}</span>
                </button>
              )}
            </div>
          </div>
        </div>
        <div className="vehicle-details__page-header-actions">
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={handleAssignTag}
            disabled={!isAdmin}
            title={!isAdmin ? "Admin only" : "Assign RFID tag"}
          >
            <i className="fa-light fa-tag"></i>
            <span>Assign Tag</span>
          </button>
          <button
            type="button"
            className="m365-btn m365-btn--ghost"
            onClick={handleAssignExpectedAverage}
            disabled={!isAdmin}
            title={!isAdmin ? "Admin only" : "Set expected average"}
          >
            <i className="fa-light fa-chart-line"></i>
            <span>Expected Average</span>
          </button>
          <button
            type="button"
            className="m365-btn m365-btn--primary"
            onClick={handleGenerateReport}
          >
            <i className="fa-light fa-file-chart-column"></i>
            <span>Generate Report</span>
          </button>
        </div>
      </div>

      {/* Metrics Strip */}
      <div className="vehicle-details__metrics">
        {metrics.map((m) => (
          <div key={m.key} className="vehicle-details__metric">
            <div className="vehicle-details__metric-icon">
              <i className={m.icon}></i>
            </div>
            <div className="vehicle-details__metric-content">
              <div className="vehicle-details__metric-label">{m.label}</div>
              <div className="vehicle-details__metric-value">{m.value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs Section */}
      <div className="vehicle-details__tabs-card">
        <Tabs
          dataSource={tabItems}
          selectedIndex={activeTab}
          onItemClick={handleTabSelectionChange}
          width="100%"
          itemRender={renderTabItem}
        />
        <div className="vehicle-details__tabs-content">{renderContent()}</div>
      </div>

      {/* Popup Forms */}
      <Popup
        visible={showTagPopup}
        onHiding={() => setShowTagPopup(false)}
        dragEnabled={false}
        showTitle={true}
        title={`Assign RFID Tag to ${vehicle.vehicleCode}`}
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
        title={`Change Working Site for ${vehicle.vehicleCode}`}
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
        title={`Set Expected Average for ${vehicle.vehicleCode}`}
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
