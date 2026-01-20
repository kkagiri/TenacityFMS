import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { NumberBox } from "devextreme-react/number-box";
import { TextArea } from "devextreme-react/text-area";
import { SelectBox } from "devextreme-react/select-box";
import { TagBox } from "devextreme-react/tag-box";
import Popup from "devextreme-react/popup";
import notify from "devextreme/ui/notify";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  fetchSystemConfigurations,
  updateSystemConfiguration,
} from "../../../redux/actions/systemConfigActions";
import {
  enableTemporaryBypass,
  getTemporaryBypassStatus,
  cancelTemporaryBypass,
  cancelBypassById,
} from "../../../api/geofenceService";
import { fetchVehicleList } from "../../../redux/actions/vehicleActions";
import { fetchUsers } from "../../../redux/actions/userActions";
import dashboardSignalRService from "../../../signalR/dashboardSignalRService";
import LocationBypassHistoryView from "./LocationBypassHistoryView";
import LocationSettingsOverview from "./LocationSettingsOverview";

const LocationRulesSettings = () => {
  const dispatch = useDispatch();
  const { userInfo } = usePermissions();
  const { configurations, loading } = useSelector(
    (state) => state.systemConfig
  );

  const [settings, setSettings] = useState({
    enableLocationValidation: false,
    enableGeofenceValidation: false,
    requireTankerInGeofence: true,
    requireOperatorInGeofence: false,
    requireVehicleInGeofence: false,
    defaultVehicleProximityRadius: 100,
    defaultMobileProximityRadius: 50,
    allowNonGPSVehicles: true,
    bypassOnGPSFailure: true,
    minimumGPSAccuracy: 20,
    locationCacheSeconds: 30,
    proximityGracePeriodMeters: 10,
    allowCachedMobileLocation: true,
    enableLocationAuditLog: true,
    // Mobile Location Validation Settings
    requireMobileLocation: true,
    maxMobileLocationAgeSeconds: 60,
    maxMobileLocationAccuracyMeters: 500,
    rejectCachedMobileLocation: true,
  });

  // Temporary bypass state
  const [bypassStatus, setBypassStatus] = useState({
    isActive: false,
    expiresAt: null,
    enabledBy: null,
    reason: null,
    vehicleBypasses: [],
    userBypasses: [],
  });
  const [bypassLoading, setBypassLoading] = useState(false);
  const [bypassReason, setBypassReason] = useState("");
  const [bypassDuration, setBypassDuration] = useState(5); // default 5 minutes

  // Granular bypass state
  const [bypassType, setBypassType] = useState("All"); // "All", "Vehicle", "User"
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);

  // Load vehicles and users from Redux
  const vehicles = useSelector((state) => state.vehicle?.vehicles || []);
  const users = useSelector((state) => state.user?.users || []);

  const [configMap, setConfigMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

  // Bypass history popup state
  const [showBypassHistoryPopup, setShowBypassHistoryPopup] = useState(false);

  // Location settings overview popup state
  const [showSettingsOverviewPopup, setShowSettingsOverviewPopup] = useState(false);

  // Check if user has admin role
  const userRoles = Array.isArray(userInfo?.roles)
    ? userInfo.roles.map((r) => r.toLowerCase())
    : userInfo?.roles
    ? [userInfo.roles.toLowerCase()]
    : [];
  const hasAdminPermission = userRoles.includes("admin");

  // Fetch FuelingRules configurations
  useEffect(() => {
    dispatch(fetchSystemConfigurations({ category: "FuelingRules" }));
  }, [dispatch]);

  // Map configurations to settings
  useEffect(() => {
    if (configurations && configurations.length > 0) {
      const configMapping = {};
      const newSettings = { ...settings };

      configurations.forEach((config) => {
        if (config.category !== "FuelingRules") return;

        configMapping[config.configurationKey] = config;

        switch (config.configurationKey) {
          case "FuelingRules.EnableLocationValidation":
            newSettings.enableLocationValidation =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.EnableGeofenceValidation":
            newSettings.enableGeofenceValidation =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.RequireTankerInGeofence":
            newSettings.requireTankerInGeofence =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.RequireOperatorInGeofence":
            newSettings.requireOperatorInGeofence =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.RequireVehicleInGeofence":
            newSettings.requireVehicleInGeofence =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.DefaultVehicleProximityRadius":
            newSettings.defaultVehicleProximityRadius =
              parseInt(config.configurationValue) || 100;
            break;
          case "FuelingRules.DefaultMobileProximityRadius":
            newSettings.defaultMobileProximityRadius =
              parseInt(config.configurationValue) || 50;
            break;
          case "FuelingRules.AllowNonGPSVehicles":
            newSettings.allowNonGPSVehicles =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.BypassOnGPSFailure":
            newSettings.bypassOnGPSFailure =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.MinimumGPSAccuracy":
            newSettings.minimumGPSAccuracy =
              parseInt(config.configurationValue) || 20;
            break;
          case "FuelingRules.LocationCacheSeconds":
            newSettings.locationCacheSeconds =
              parseInt(config.configurationValue) || 30;
            break;
          case "FuelingRules.ProximityGracePeriodMeters":
            newSettings.proximityGracePeriodMeters =
              parseInt(config.configurationValue) || 10;
            break;
          case "FuelingRules.AllowCachedMobileLocation":
            newSettings.allowCachedMobileLocation =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.EnableLocationAuditLog":
            newSettings.enableLocationAuditLog =
              config.configurationValue?.toLowerCase() === "true";
            break;
          // Mobile Location Validation Settings
          case "FuelingRules.RequireMobileLocation":
            newSettings.requireMobileLocation =
              config.configurationValue?.toLowerCase() === "true";
            break;
          case "FuelingRules.MaxMobileLocationAgeSeconds":
            newSettings.maxMobileLocationAgeSeconds =
              parseInt(config.configurationValue) || 60;
            break;
          case "FuelingRules.MaxMobileLocationAccuracyMeters":
            newSettings.maxMobileLocationAccuracyMeters =
              parseInt(config.configurationValue) || 500;
            break;
          case "FuelingRules.RejectCachedMobileLocation":
            newSettings.rejectCachedMobileLocation =
              config.configurationValue?.toLowerCase() === "true";
            break;
          default:
            break;
        }
      });

      setConfigMap(configMapping);
      setSettings(newSettings);
      setOriginalSettings(newSettings);
      setHasChanges(false);
    }
  }, [configurations]);

  const handleSettingChange = useCallback(
    (field, value) => {
      setSettings((prev) => {
        const newSettings = { ...prev, [field]: value };
        // Check if there are changes compared to original
        const changed =
          JSON.stringify(newSettings) !== JSON.stringify(originalSettings);
        setHasChanges(changed);
        return newSettings;
      });
    },
    [originalSettings]
  );

  const handleSave = useCallback(async () => {
    if (!hasAdminPermission) {
      notify(
        "You do not have permission to modify these settings",
        "error",
        4000
      );
      return;
    }

    setSaving(true);
    try {
      const updates = [];

      const settingsToConfigMap = {
        enableLocationValidation: "FuelingRules.EnableLocationValidation",
        enableGeofenceValidation: "FuelingRules.EnableGeofenceValidation",
        requireTankerInGeofence: "FuelingRules.RequireTankerInGeofence",
        requireOperatorInGeofence: "FuelingRules.RequireOperatorInGeofence",
        requireVehicleInGeofence: "FuelingRules.RequireVehicleInGeofence",
        defaultVehicleProximityRadius:
          "FuelingRules.DefaultVehicleProximityRadius",
        defaultMobileProximityRadius:
          "FuelingRules.DefaultMobileProximityRadius",
        allowNonGPSVehicles: "FuelingRules.AllowNonGPSVehicles",
        bypassOnGPSFailure: "FuelingRules.BypassOnGPSFailure",
        minimumGPSAccuracy: "FuelingRules.MinimumGPSAccuracy",
        locationCacheSeconds: "FuelingRules.LocationCacheSeconds",
        proximityGracePeriodMeters: "FuelingRules.ProximityGracePeriodMeters",
        allowCachedMobileLocation: "FuelingRules.AllowCachedMobileLocation",
        enableLocationAuditLog: "FuelingRules.EnableLocationAuditLog",
        // Mobile App Location Settings
        requireMobileLocation: "FuelingRules.RequireMobileLocation",
        maxMobileLocationAgeSeconds: "FuelingRules.MaxMobileLocationAgeSeconds",
        maxMobileLocationAccuracyMeters: "FuelingRules.MaxMobileLocationAccuracyMeters",
        rejectCachedMobileLocation: "FuelingRules.RejectCachedMobileLocation",
      };

      // Prepare updates for each changed setting
      for (const [settingKey, configKey] of Object.entries(
        settingsToConfigMap
      )) {
        const config = configMap[configKey];
        if (config) {
          const newValue = String(settings[settingKey]);
          if (config.configurationValue !== newValue) {
            updates.push(
              dispatch(
                updateSystemConfiguration({
                  ...config,
                  configurationValue: newValue,
                })
              )
            );
          }
        }
      }

      if (updates.length > 0) {
        await Promise.all(updates);
        notify("Location rule settings saved successfully", "success", 3000);
        setOriginalSettings(settings);
        setHasChanges(false);
        // Refresh configurations
        dispatch(fetchSystemConfigurations({ category: "FuelingRules" }));
      } else {
        notify("No changes to save", "info", 2000);
      }
    } catch (error) {
      console.error("Error saving location rule settings:", error);
      notify("Failed to save settings. Please try again.", "error", 4000);
    } finally {
      setSaving(false);
    }
  }, [dispatch, settings, configMap, hasAdminPermission, originalSettings]);

  const handleReset = useCallback(() => {
    setSettings(originalSettings);
    setHasChanges(false);
  }, [originalSettings]);

  const handleRefresh = useCallback(() => {
    dispatch(fetchSystemConfigurations({ category: "FuelingRules" }));
    fetchBypassStatus();
  }, [dispatch]);

  // Fetch temporary bypass status
  const fetchBypassStatus = useCallback(async () => {
    try {
      const response = await getTemporaryBypassStatus();
      // getTemporaryBypassStatus already returns the data object (TemporaryBypassStatusDTO)
      if (response) {
        setBypassStatus({
          isActive: response.isActive || false,
          expiresAt: response.expiresAt
            ? new Date(response.expiresAt)
            : null,
          enabledBy: response.enabledBy || null,
          reason: response.reason || null,
          vehicleBypasses: response.vehicleBypasses || [],
          userBypasses: response.userBypasses || [],
        });
      }
    } catch (error) {
      console.error("Error fetching bypass status:", error);
    }
  }, []);

  // Fetch bypass status and load vehicles/users on component mount
  // Use SignalR for real-time updates instead of polling
  useEffect(() => {
    // Initial fetch
    fetchBypassStatus();
    dispatch(fetchVehicleList());
    dispatch(fetchUsers());

    // Subscribe to SignalR updates for bypass status
    const handleBypassStatusUpdate = (payload) => {
      console.log("[LocationRulesSettings] Received bypass status update via SignalR:", payload);

      if (payload?.status) {
        const status = payload.status;
        setBypassStatus({
          isActive: status.isActive || false,
          expiresAt: status.expiresAt
            ? new Date(status.expiresAt)
            : null,
          enabledBy: status.enabledBy || null,
          reason: status.reason || null,
          vehicleBypasses: status.vehicleBypasses || [],
          userBypasses: status.userBypasses || [],
        });

        // Show notification for bypass changes
        if (payload.action === "expired") {
          notify(payload.message || "Location bypass has expired", "warning", 4000);
        } else if (payload.action === "enabled") {
          notify(payload.message || "Location bypass has been enabled", "info", 4000);
        } else if (payload.action === "cancelled") {
          notify(payload.message || "Location bypass has been cancelled", "info", 4000);
        }
      }
    };

    // Register SignalR event listener
    const unsubscribe = dashboardSignalRService.on(
      "LocationBypassStatusUpdate",
      handleBypassStatusUpdate
    );

    return () => {
      // Cleanup SignalR subscription
      if (unsubscribe) unsubscribe();
    };
  }, [fetchBypassStatus, dispatch]);

  // State for countdown display - updates every second for real-time countdown
  const [countdownDisplay, setCountdownDisplay] = useState(null);

  // Update countdown display every second when bypass is active
  useEffect(() => {
    if (!bypassStatus.isActive || !bypassStatus.expiresAt) {
      setCountdownDisplay(null);
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const expiresAt = new Date(bypassStatus.expiresAt);
      const remainingMs = expiresAt - now;

      if (remainingMs <= 0) {
        // Bypass has expired, refresh status
        setCountdownDisplay(null);
        fetchBypassStatus();
        return;
      }

      const minutes = Math.floor(remainingMs / 60000);
      const seconds = Math.floor((remainingMs % 60000) / 1000);
      setCountdownDisplay(`${minutes}m ${seconds}s`);
    };

    // Update immediately
    updateCountdown();

    // Update every second
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [bypassStatus.isActive, bypassStatus.expiresAt, fetchBypassStatus]);

  // Handle enabling temporary bypass
  const handleEnableBypass = async () => {
    if (!hasAdminPermission) {
      notify(
        "You do not have permission to enable temporary bypass",
        "error",
        4000
      );
      return;
    }

    // Validate selection based on bypass type
    if (bypassType === "Vehicle" && selectedVehicleIds.length === 0) {
      notify("Please select at least one vehicle for vehicle bypass", "warning", 3000);
      return;
    }
    if (bypassType === "User" && selectedUserIds.length === 0) {
      notify("Please select at least one user for user bypass", "warning", 3000);
      return;
    }

    setBypassLoading(true);
    try {
      const response = await enableTemporaryBypass(
        bypassDuration,
        bypassReason,
        bypassType,
        bypassType === "Vehicle" ? selectedVehicleIds : null,
        bypassType === "User" ? selectedUserIds : null
      );
      // FMSResponse uses IsSuccess which serializes to isSuccess in JSON
      if (response?.isSuccess) {
        const bypassTypeLabel = bypassType === "All" ? "system-wide" :
          bypassType === "Vehicle" ? `${selectedVehicleIds.length} vehicle(s)` :
          `${selectedUserIds.length} user(s)`;
        notify(
          `Location validation bypassed for ${bypassTypeLabel} for ${bypassDuration} minutes`,
          "success",
          4000
        );
        // Refresh status to get updated bypass list
        await fetchBypassStatus();
        setBypassReason("");
        setSelectedVehicleIds([]);
        setSelectedUserIds([]);
      } else {
        notify(response?.message || "Failed to enable bypass", "error", 4000);
      }
    } catch (error) {
      console.error("Error enabling temporary bypass:", error);
      notify(
        "Failed to enable temporary bypass. Please try again.",
        "error",
        4000
      );
    } finally {
      setBypassLoading(false);
    }
  };

  // Handle canceling temporary bypass
  const handleCancelBypass = async () => {
    if (!hasAdminPermission) {
      notify(
        "You do not have permission to cancel temporary bypass",
        "error",
        4000
      );
      return;
    }

    setBypassLoading(true);
    try {
      const response = await cancelTemporaryBypass();
      // FMSResponse uses IsSuccess which serializes to isSuccess in JSON
      if (response?.isSuccess) {
        notify(
          "Temporary bypass has been cancelled. Location validation is now active.",
          "success",
          4000
        );
        await fetchBypassStatus();
      } else {
        notify(response?.message || "Failed to cancel bypass", "error", 4000);
      }
    } catch (error) {
      console.error("Error canceling temporary bypass:", error);
      notify(
        "Failed to cancel temporary bypass. Please try again.",
        "error",
        4000
      );
    } finally {
      setBypassLoading(false);
    }
  };

  // Handle canceling a specific bypass by ID
  const handleCancelSpecificBypass = async (bypassId, bypassLabel) => {
    if (!hasAdminPermission) {
      notify("You do not have permission to cancel bypass", "error", 4000);
      return;
    }

    setBypassLoading(true);
    try {
      const response = await cancelBypassById(bypassId);
      // FMSResponse uses IsSuccess which serializes to isSuccess in JSON
      if (response?.isSuccess) {
        notify(`Bypass for ${bypassLabel} has been cancelled.`, "success", 3000);
        await fetchBypassStatus();
      } else {
        notify(response?.message || "Failed to cancel bypass", "error", 4000);
      }
    } catch (error) {
      console.error("Error canceling bypass:", error);
      notify("Failed to cancel bypass. Please try again.", "error", 4000);
    } finally {
      setBypassLoading(false);
    }
  };

  // Calculate remaining time for bypass
  const getRemainingTime = () => {
    if (!bypassStatus.isActive || !bypassStatus.expiresAt) return null;
    const now = new Date();
    const expiresAt = new Date(bypassStatus.expiresAt);
    const remainingMs = expiresAt - now;
    if (remainingMs <= 0) return null;
    const minutes = Math.floor(remainingMs / 60000);
    const seconds = Math.floor((remainingMs % 60000) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  // Duration options for bypass
  const bypassDurationOptions = [
    { value: 5, text: "5 minutes" },
    { value: 10, text: "10 minutes" },
    { value: 15, text: "15 minutes" },
    { value: 30, text: "30 minutes" },
    { value: 60, text: "1 hour" },
  ];

  // Bypass type options
  const bypassTypeOptions = [
    { value: "All", text: "All Vehicles (System-wide)" },
    { value: "Vehicle", text: "Specific Vehicles" },
    { value: "User", text: "Specific Users" },
  ];

  // Check if there are any active granular bypasses
  const hasActiveGranularBypasses =
    (bypassStatus.vehicleBypasses?.length > 0) ||
    (bypassStatus.userBypasses?.length > 0);

  // Total active bypass count
  const activeBypassCount =
    (bypassStatus.isActive ? 1 : 0) +
    (bypassStatus.vehicleBypasses?.length || 0) +
    (bypassStatus.userBypasses?.length || 0);

  // Setting card component
  const SettingCard = ({ icon, iconColor, title, description, children }) => (
    <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm hover:tw-shadow-md tw-transition-shadow">
      <div className="tw-flex tw-items-start tw-gap-4">
        <div
          className={`tw-flex-shrink-0 tw-w-10 tw-h-10 tw-rounded-lg tw-flex tw-items-center tw-justify-center ${iconColor}`}
        >
          <i className={`${icon} tw-text-lg`}></i>
        </div>
        <div className="tw-flex-1 tw-min-w-0">
          <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900 tw-mb-1">
            {title}
          </h4>
          <p className="tw-text-xs tw-text-gray-500 tw-mb-3">{description}</p>
          {children}
        </div>
      </div>
    </div>
  );

  return (
    <div className="location-rules-settings tw-p-4">
      {/* Header */}
      <div className="tw-flex tw-flex-col sm:tw-flex-row tw-items-start sm:tw-items-center tw-justify-between tw-mb-6 tw-gap-3">
        <div>
          <h2 className="tw-text-2xl tw-font-bold tw-text-gray-800 tw-m-0 tw-flex tw-items-center tw-gap-2">
            <span>
              <i className="fa-light fa-location-dot tw-text-green-600"></i>
            </span>
            Location Rules Settings
          </h2>
          <p className="tw-text-sm tw-text-gray-600 tw-mt-1 tw-mb-0">
            Configure GPS and location-based validation for fuel dispensing
          </p>
        </div>
        <div className="tw-flex tw-items-center tw-gap-2">
          <Button
            icon="fa-light fa-refresh"
            text="Refresh"
            stylingMode="outlined"
            onClick={handleRefresh}
            disabled={loading}
          />
          {hasChanges && (
            <Button
              icon="fa-light fa-undo"
              text="Reset"
              stylingMode="outlined"
              type="normal"
              onClick={handleReset}
            />
          )}
          <Button
            icon="fa-light fa-save"
            text="Save Settings"
            type="default"
            stylingMode="contained"
            onClick={handleSave}
            disabled={!hasChanges || !hasAdminPermission || saving}
          />
        </div>
      </div>

      {/* Permission Warning */}
      {!hasAdminPermission && (
        <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-center tw-gap-2 tw-text-amber-700">
            <i className="fa-light fa-triangle-exclamation"></i>
            <span className="tw-text-sm tw-font-medium">
              You don't have permission to modify these settings. Contact an
              administrator.
            </span>
          </div>
        </div>
      )}

      <div className="tw-space-y-6">
        {/* Main Toggle Section */}
        <div className="tw-bg-gradient-to-r tw-from-green-50 tw-to-blue-50 tw-rounded-xl tw-p-6 tw-border tw-border-green-200">
          <div className="tw-flex tw-items-center tw-justify-between">
            <div className="tw-flex tw-items-center tw-gap-4">
              <div className="tw-w-14 tw-h-14 tw-rounded-full tw-bg-green-100 tw-flex tw-items-center tw-justify-center">
                <i className="fa-light fa-location-crosshairs tw-text-2xl tw-text-green-600"></i>
              </div>
              <div>
                <h3 className="tw-text-lg tw-font-bold tw-text-gray-900 tw-mb-1">
                  Enable Location Validation
                </h3>
                <p className="tw-text-sm tw-text-gray-600">
                  When enabled, PTS devices can use location validation to
                  verify vehicle proximity before fueling.
                </p>
              </div>
            </div>
            <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
              <input
                type="checkbox"
                checked={settings.enableLocationValidation}
                onChange={(e) =>
                  handleSettingChange(
                    "enableLocationValidation",
                    e.target.checked
                  )
                }
                disabled={!hasAdminPermission}
                className="tw-sr-only tw-peer"
              />
              <div className="tw-w-14 tw-h-7 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-green-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-0.5 after:tw-left-[4px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-6 after:tw-w-6 after:tw-transition-all peer-checked:tw-bg-green-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
            </label>
          </div>
        </div>

        {/* Temporary Bypass Section */}
        <div
          className={`tw-rounded-xl tw-p-5 tw-border ${
            activeBypassCount > 0
              ? "tw-bg-gradient-to-r tw-from-red-50 tw-to-orange-50 tw-border-red-300"
              : "tw-bg-gradient-to-r tw-from-amber-50 tw-to-yellow-50 tw-border-amber-200"
          }`}
        >
          {/* Header */}
          <div className="tw-flex tw-flex-col lg:tw-flex-row tw-items-start lg:tw-items-center tw-justify-between tw-gap-4 tw-mb-4">
            <div className="tw-flex tw-items-center tw-gap-4">
              <div
                className={`tw-w-14 tw-h-14 tw-rounded-full tw-flex tw-items-center tw-justify-center ${
                  activeBypassCount > 0 ? "tw-bg-red-100" : "tw-bg-amber-100"
                }`}
              >
                <i
                  className={`fa-light fa-shield-xmark tw-text-2xl ${
                    activeBypassCount > 0
                      ? "tw-text-red-600"
                      : "tw-text-amber-600"
                  }`}
                ></i>
              </div>
              <div>
                <h3 className="tw-text-lg tw-font-bold tw-text-gray-900 tw-mb-1 tw-flex tw-items-center tw-gap-2">
                  Temporary Location Bypass
                  {activeBypassCount > 0 && (
                    <span className="tw-px-2 tw-py-0.5 tw-bg-red-500 tw-text-white tw-text-xs tw-font-semibold tw-rounded-full tw-animate-pulse">
                      {activeBypassCount} ACTIVE
                    </span>
                  )}
                </h3>
                <p className="tw-text-sm tw-text-gray-600">
                  {activeBypassCount > 0
                    ? "Location validation is bypassed for some vehicles or users."
                    : "Temporarily disable location validation for emergency or troubleshooting purposes."}
                </p>
              </div>
            </div>
          </div>

          {/* Active System-Wide Bypass */}
          {bypassStatus.isActive && (
            <div className="tw-bg-red-100 tw-rounded-lg tw-p-4 tw-mb-4 tw-border tw-border-red-200">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div>
                  <div className="tw-flex tw-items-center tw-gap-2 tw-mb-1">
                    <i className="fa-light fa-globe tw-text-red-600"></i>
                    <span className="tw-font-semibold tw-text-red-800">System-Wide Bypass</span>
                    <span className="tw-text-red-600 tw-text-sm">
                      (Expires at {bypassStatus.expiresAt ? new Date(bypassStatus.expiresAt).toLocaleTimeString() : "N/A"}
                      {countdownDisplay && ` - ${countdownDisplay} remaining`})
                    </span>
                  </div>
                  <p className="tw-text-xs tw-text-red-700">
                    <i className="fa-light fa-user tw-mr-1"></i>
                    Enabled by: {bypassStatus.enabledBy}
                    {bypassStatus.reason && ` - ${bypassStatus.reason}`}
                  </p>
                </div>
                <Button
                  icon="fa-light fa-times"
                  text="Cancel"
                  type="danger"
                  stylingMode="contained"
                  onClick={handleCancelBypass}
                  disabled={!hasAdminPermission || bypassLoading}
                />
              </div>
            </div>
          )}

          {/* Active Vehicle Bypasses */}
          {bypassStatus.vehicleBypasses?.length > 0 && (
            <div className="tw-mb-4">
              <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-car tw-text-blue-600"></i>
                Vehicle-Specific Bypasses
              </h4>
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-2">
                {bypassStatus.vehicleBypasses.map((bypass) => (
                  <div
                    key={bypass.id}
                    className="tw-bg-blue-50 tw-rounded-lg tw-p-3 tw-border tw-border-blue-200 tw-flex tw-items-center tw-justify-between"
                  >
                    <div>
                      <span className="tw-font-medium tw-text-blue-800">
                        {bypass.vehicleName || bypass.vehicleHyoungNo || `Vehicle #${bypass.vehicleId}`}
                      </span>
                      <p className="tw-text-xs tw-text-blue-600">
                        Expires: {bypass.expiresAt ? new Date(bypass.expiresAt).toLocaleTimeString() : "Never"}
                      </p>
                    </div>
                    <Button
                      icon="fa-light fa-times"
                      type="danger"
                      stylingMode="text"
                      onClick={() => handleCancelSpecificBypass(bypass.id, bypass.vehicleName || bypass.vehicleHyoungNo)}
                      disabled={!hasAdminPermission || bypassLoading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Active User Bypasses */}
          {bypassStatus.userBypasses?.length > 0 && (
            <div className="tw-mb-4">
              <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-2 tw-flex tw-items-center tw-gap-2">
                <i className="fa-light fa-user tw-text-purple-600"></i>
                User-Specific Bypasses
              </h4>
              <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-2">
                {bypassStatus.userBypasses.map((bypass) => (
                  <div
                    key={bypass.id}
                    className="tw-bg-purple-50 tw-rounded-lg tw-p-3 tw-border tw-border-purple-200 tw-flex tw-items-center tw-justify-between"
                  >
                    <div>
                      <span className="tw-font-medium tw-text-purple-800">
                        {bypass.fullName || bypass.userName || `User #${bypass.userId}`}
                      </span>
                      <p className="tw-text-xs tw-text-purple-600">
                        Expires: {bypass.expiresAt ? new Date(bypass.expiresAt).toLocaleTimeString() : "Never"}
                      </p>
                    </div>
                    <Button
                      icon="fa-light fa-times"
                      type="danger"
                      stylingMode="text"
                      onClick={() => handleCancelSpecificBypass(bypass.id, bypass.fullName || bypass.userName)}
                      disabled={!hasAdminPermission || bypassLoading}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Add New Bypass Form */}
          <div className="tw-bg-white tw-rounded-lg tw-p-4 tw-border tw-border-gray-200">
            <h4 className="tw-text-sm tw-font-semibold tw-text-gray-700 tw-mb-3 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-plus tw-text-green-600"></i>
              Add New Bypass
            </h4>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-3 tw-mb-3">
              {/* Bypass Type */}
              <div>
                <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Bypass Type</label>
                <SelectBox
                  items={bypassTypeOptions}
                  value={bypassType}
                  displayExpr="text"
                  valueExpr="value"
                  onValueChanged={(e) => {
                    setBypassType(e.value);
                    setSelectedVehicleIds([]);
                    setSelectedUserIds([]);
                  }}
                  disabled={!hasAdminPermission || bypassLoading}
                  width="100%"
                />
              </div>

              {/* Duration */}
              <div>
                <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Duration</label>
                <SelectBox
                  items={bypassDurationOptions}
                  value={bypassDuration}
                  displayExpr="text"
                  valueExpr="value"
                  onValueChanged={(e) => setBypassDuration(e.value)}
                  disabled={!hasAdminPermission || bypassLoading}
                  width="100%"
                />
              </div>

              {/* Vehicle Selection - Show when Vehicle type selected */}
              {bypassType === "Vehicle" && (
                <div className="md:tw-col-span-2">
                  <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                    Select Vehicles
                  </label>
                  <TagBox
                    dataSource={vehicles}
                    value={selectedVehicleIds}
                    displayExpr="hyoungNo"
                    valueExpr="vehicleId"
                    onValueChanged={(e) => setSelectedVehicleIds(e.value || [])}
                    disabled={!hasAdminPermission || bypassLoading}
                    searchEnabled={true}
                    showSelectionControls={true}
                    placeholder="Select vehicles..."
                    width="100%"
                  />
                </div>
              )}

              {/* User Selection - Show when User type selected */}
              {bypassType === "User" && (
                <div className="md:tw-col-span-2">
                  <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">
                    Select Users
                  </label>
                  <TagBox
                    dataSource={users.filter(u => !u.isDeleted)}
                    value={selectedUserIds}
                    displayExpr={(item) => item ? `${item.fullname || item.username || item.userName}` : ""}
                    valueExpr="id"
                    onValueChanged={(e) => setSelectedUserIds(e.value || [])}
                    disabled={!hasAdminPermission || bypassLoading}
                    searchEnabled={true}
                    showSelectionControls={true}
                    placeholder="Select users..."
                    width="100%"
                  />
                </div>
              )}

              {/* Reason - Full width when All type, partial when vehicle/user */}
              <div className={bypassType === "All" ? "md:tw-col-span-2" : ""}>
                <label className="tw-block tw-text-xs tw-font-medium tw-text-gray-600 tw-mb-1">Reason (optional)</label>
                <TextArea
                  value={bypassReason}
                  onValueChanged={(e) => setBypassReason(e.value)}
                  placeholder="Enter reason..."
                  disabled={!hasAdminPermission || bypassLoading}
                  height={32}
                  maxLength={200}
                />
              </div>
            </div>

            <div className="tw-flex tw-justify-end">
              <Button
                icon="fa-light fa-shield-xmark"
                text={`Enable ${bypassType === "All" ? "System-Wide" : bypassType} Bypass`}
                type="danger"
                stylingMode="contained"
                onClick={handleEnableBypass}
                disabled={!hasAdminPermission || bypassLoading}
              />
            </div>
          </div>

          {/* Warning */}
          <div className="tw-mt-4 tw-p-3 tw-bg-amber-100 tw-rounded-lg tw-border tw-border-amber-200">
            <div className="tw-flex tw-items-start tw-gap-2">
              <i className="fa-light fa-triangle-exclamation tw-text-amber-600 tw-mt-0.5"></i>
              <p className="tw-text-xs tw-text-amber-800 tw-m-0">
                <strong>Warning:</strong> {bypassType === "All"
                  ? "System-wide bypass will disable ALL location validation checks for all vehicles and users."
                  : bypassType === "Vehicle"
                  ? "Vehicle bypass will disable location validation only for the selected vehicles."
                  : "User bypass will disable location validation only when the selected users are fueling."}
                {" "}Use only for emergency situations or troubleshooting.
              </p>
            </div>
          </div>

          {/* View Bypass History Button */}
          <div className="tw-mt-4 tw-flex tw-justify-end tw-gap-2">
            <Button
              icon="fa-light fa-sliders"
              text="View Settings Overview"
              type="normal"
              stylingMode="outlined"
              onClick={() => setShowSettingsOverviewPopup(true)}
            />
            <Button
              icon="fa-light fa-clock-rotate-left"
              text="View Bypass History"
              type="normal"
              stylingMode="outlined"
              onClick={() => setShowBypassHistoryPopup(true)}
            />
          </div>
        </div>

        {/* Secondary Feature Toggles */}
        <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
          {/* Geofence Validation Toggle */}
          <div className="tw-bg-gradient-to-r tw-from-blue-50 tw-to-indigo-50 tw-rounded-xl tw-p-5 tw-border tw-border-blue-200">
            <div className="tw-flex tw-items-center tw-justify-between">
              <div className="tw-flex tw-items-center tw-gap-3">
                <div className="tw-w-12 tw-h-12 tw-rounded-full tw-bg-blue-100 tw-flex tw-items-center tw-justify-center">
                  <i className="fa-light fa-map-location-dot tw-text-xl tw-text-blue-600"></i>
                </div>
                <div>
                  <h3 className="tw-text-base tw-font-bold tw-text-gray-900 tw-mb-1">
                    Enable Geofence Validation
                  </h3>
                  <p className="tw-text-xs tw-text-gray-600">
                    Validate fueling locations against configured geofence
                    boundaries.
                  </p>
                </div>
              </div>
              <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.enableGeofenceValidation}
                  onChange={(e) =>
                    handleSettingChange(
                      "enableGeofenceValidation",
                      e.target.checked
                    )
                  }
                  disabled={!hasAdminPermission}
                  className="tw-sr-only tw-peer"
                />
                <div className="tw-w-12 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-blue-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-0.5 after:tw-left-[4px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-blue-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
              </label>
            </div>
          </div>
        </div>

        {/* Geofence Requirements Section - Only show when geofence validation is enabled */}
        {settings.enableGeofenceValidation && (
          <div className="tw-bg-blue-50 tw-rounded-xl tw-p-5 tw-border tw-border-blue-200">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
              <i className="fa-light fa-shield-check tw-text-blue-600"></i>
              Geofence Validation Requirements
            </h3>
            <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
              Configure which entities must be within an allowed geofence during
              fueling operations.
            </p>
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-3 tw-gap-4">
              {/* Require Tanker In Geofence */}
              <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-orange-100 tw-flex tw-items-center tw-justify-center">
                      <i className="fa-light fa-truck-container tw-text-lg tw-text-orange-600"></i>
                    </div>
                    <div>
                      <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                        Require Tanker in Geofence
                      </h4>
                      <p className="tw-text-xs tw-text-gray-500">
                        Tanker/pump must be within geofence
                      </p>
                    </div>
                  </div>
                  <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireTankerInGeofence}
                      onChange={(e) =>
                        handleSettingChange(
                          "requireTankerInGeofence",
                          e.target.checked
                        )
                      }
                      disabled={!hasAdminPermission}
                      className="tw-sr-only tw-peer"
                    />
                    <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-orange-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-orange-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                  </label>
                </div>
              </div>

              {/* Require Operator In Geofence */}
              <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-teal-100 tw-flex tw-items-center tw-justify-center">
                      <i className="fa-light fa-user-helmet-safety tw-text-lg tw-text-teal-600"></i>
                    </div>
                    <div>
                      <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                        Require Operator in Geofence
                      </h4>
                      <p className="tw-text-xs tw-text-gray-500">
                        Mobile app user must be within geofence
                      </p>
                    </div>
                  </div>
                  <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireOperatorInGeofence}
                      onChange={(e) =>
                        handleSettingChange(
                          "requireOperatorInGeofence",
                          e.target.checked
                        )
                      }
                      disabled={!hasAdminPermission}
                      className="tw-sr-only tw-peer"
                    />
                    <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-teal-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-teal-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                  </label>
                </div>
              </div>

              {/* Require Vehicle In Geofence */}
              <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
                <div className="tw-flex tw-items-center tw-justify-between">
                  <div className="tw-flex tw-items-center tw-gap-3">
                    <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-indigo-100 tw-flex tw-items-center tw-justify-center">
                      <i className="fa-light fa-truck tw-text-lg tw-text-indigo-600"></i>
                    </div>
                    <div>
                      <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                        Require Vehicle in Geofence
                      </h4>
                      <p className="tw-text-xs tw-text-gray-500">
                        Vehicle being fueled must be in geofence
                      </p>
                    </div>
                  </div>
                  <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                    <input
                      type="checkbox"
                      checked={settings.requireVehicleInGeofence}
                      onChange={(e) =>
                        handleSettingChange(
                          "requireVehicleInGeofence",
                          e.target.checked
                        )
                      }
                      disabled={!hasAdminPermission}
                      className="tw-sr-only tw-peer"
                    />
                    <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-indigo-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-indigo-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Proximity Settings */}
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-bullseye tw-text-blue-600"></i>
            Proximity Radius Settings
          </h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
            <SettingCard
              icon="fa-light fa-car"
              iconColor="tw-bg-blue-100 tw-text-blue-600"
              title="Vehicle Proximity Radius"
              description="Default radius in meters for vehicle proximity validation."
            >
              <NumberBox
                value={settings.defaultVehicleProximityRadius}
                onValueChanged={(e) =>
                  handleSettingChange("defaultVehicleProximityRadius", e.value)
                }
                min={10}
                max={1000}
                showSpinButtons={true}
                format="#0 meters"
                disabled={!hasAdminPermission}
                width="100%"
              />
            </SettingCard>

            <SettingCard
              icon="fa-light fa-mobile"
              iconColor="tw-bg-purple-100 tw-text-purple-600"
              title="Mobile Proximity Radius"
              description="Default radius in meters for mobile app proximity validation."
            >
              <NumberBox
                value={settings.defaultMobileProximityRadius}
                onValueChanged={(e) =>
                  handleSettingChange("defaultMobileProximityRadius", e.value)
                }
                min={5}
                max={500}
                showSpinButtons={true}
                format="#0 meters"
                disabled={!hasAdminPermission}
                width="100%"
              />
            </SettingCard>

            <SettingCard
              icon="fa-light fa-plus-circle"
              iconColor="tw-bg-cyan-100 tw-text-cyan-600"
              title="Grace Period"
              description="Extra tolerance in meters added to proximity radius for boundary conditions."
            >
              <NumberBox
                value={settings.proximityGracePeriodMeters}
                onValueChanged={(e) =>
                  handleSettingChange("proximityGracePeriodMeters", e.value)
                }
                min={0}
                max={50}
                showSpinButtons={true}
                format="#0 meters"
                disabled={!hasAdminPermission}
                width="100%"
              />
            </SettingCard>
          </div>
        </div>

        {/* GPS Settings */}
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-satellite tw-text-indigo-600"></i>
            GPS Configuration
          </h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
            <SettingCard
              icon="fa-light fa-crosshairs"
              iconColor="tw-bg-indigo-100 tw-text-indigo-600"
              title="Minimum GPS Accuracy"
              description="Minimum accuracy in meters required for location validation."
            >
              <NumberBox
                value={settings.minimumGPSAccuracy}
                onValueChanged={(e) =>
                  handleSettingChange("minimumGPSAccuracy", e.value)
                }
                min={5}
                max={100}
                showSpinButtons={true}
                format="#0 meters"
                disabled={!hasAdminPermission}
                width="100%"
              />
            </SettingCard>

            <SettingCard
              icon="fa-light fa-clock"
              iconColor="tw-bg-amber-100 tw-text-amber-600"
              title="Location Cache Duration"
              description="How long to cache vehicle GPS location before fetching fresh data."
            >
              <NumberBox
                value={settings.locationCacheSeconds}
                onValueChanged={(e) =>
                  handleSettingChange("locationCacheSeconds", e.value)
                }
                min={5}
                max={300}
                showSpinButtons={true}
                format="#0 seconds"
                disabled={!hasAdminPermission}
                width="100%"
              />
            </SettingCard>
          </div>
        </div>

        {/* Mobile App Location Settings */}
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-mobile-screen-button tw-text-purple-600"></i>
            Mobile App Location Settings
          </h3>
          <p className="tw-text-sm tw-text-gray-600 tw-mb-4">
            Configure how the mobile app obtains and validates GPS location during fueling authorization.
            These settings are synced to the mobile app automatically.
          </p>

          {/* Mobile Location Toggle Cards */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4 tw-mb-4">
            {/* Require Mobile Location */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-purple-100 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-light fa-location-dot tw-text-lg tw-text-purple-600"></i>
                  </div>
                  <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                      Require Mobile Location
                    </h4>
                    <p className="tw-text-xs tw-text-gray-500">
                      Mobile app must provide GPS location for authorization
                    </p>
                  </div>
                </div>
                <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.requireMobileLocation}
                    onChange={(e) =>
                      handleSettingChange(
                        "requireMobileLocation",
                        e.target.checked
                      )
                    }
                    disabled={!hasAdminPermission}
                    className="tw-sr-only tw-peer"
                  />
                  <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-purple-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-purple-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                </label>
              </div>
            </div>

            {/* Reject Cached Mobile Location */}
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-justify-between">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-red-100 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-light fa-location-xmark tw-text-lg tw-text-red-600"></i>
                  </div>
                  <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                      Force Fresh GPS Location
                    </h4>
                    <p className="tw-text-xs tw-text-gray-500">
                      Always get fresh GPS fix, reject cached locations
                    </p>
                  </div>
                </div>
                <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.rejectCachedMobileLocation}
                    onChange={(e) =>
                      handleSettingChange(
                        "rejectCachedMobileLocation",
                        e.target.checked
                      )
                    }
                    disabled={!hasAdminPermission}
                    className="tw-sr-only tw-peer"
                  />
                  <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-red-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-red-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                </label>
              </div>
            </div>
          </div>

          {/* Mobile Location Numeric Settings */}
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-2 tw-gap-4">
            <SettingCard
              icon="fa-light fa-stopwatch"
              iconColor="tw-bg-orange-100 tw-text-orange-600"
              title="Max Location Age"
              description="Maximum age of GPS location in seconds. Older locations will be rejected by the server."
            >
              <NumberBox
                value={settings.maxMobileLocationAgeSeconds}
                onValueChanged={(e) =>
                  handleSettingChange("maxMobileLocationAgeSeconds", e.value)
                }
                min={10}
                max={300}
                step={5}
                showSpinButtons={true}
                format="#0 seconds"
                disabled={!hasAdminPermission}
                width="100%"
              />
            </SettingCard>

            <SettingCard
              icon="fa-light fa-bullseye"
              iconColor="tw-bg-teal-100 tw-text-teal-600"
              title="Max Location Accuracy"
              description="Maximum acceptable GPS accuracy in meters. Less accurate locations may be rejected."
            >
              <NumberBox
                value={settings.maxMobileLocationAccuracyMeters}
                onValueChanged={(e) =>
                  handleSettingChange("maxMobileLocationAccuracyMeters", e.value)
                }
                min={10}
                max={1000}
                step={10}
                showSpinButtons={true}
                format="#0 meters"
                disabled={!hasAdminPermission}
                width="100%"
              />
            </SettingCard>
          </div>

          {/* Info Box */}
          <div className="tw-mt-4 tw-p-3 tw-bg-purple-50 tw-rounded-lg tw-border tw-border-purple-200">
            <div className="tw-flex tw-items-start tw-gap-2">
              <i className="fa-light fa-circle-info tw-text-purple-600 tw-mt-0.5"></i>
              <p className="tw-text-xs tw-text-purple-800 tw-m-0">
                <strong>Note:</strong> These settings control how the mobile app obtains GPS location before requesting
                fueling authorization. The server will validate that the location meets these requirements. If "Force Fresh GPS"
                is enabled, the mobile app will always request a new GPS fix instead of using cached location.
              </p>
            </div>
          </div>
        </div>

        {/* Fallback & Grace Settings */}
        <div>
          <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
            <i className="fa-light fa-shield-check tw-text-green-600"></i>
            Fallback & Grace Options
          </h3>
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 tw-gap-4">
            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-green-100 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-light fa-car-circle-bolt tw-text-lg tw-text-green-600"></i>
                  </div>
                  <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                      Allow Non-GPS Vehicles
                    </h4>
                    <p className="tw-text-xs tw-text-gray-500">
                      Permit fueling for vehicles without GPS tracking
                    </p>
                  </div>
                </div>
                <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowNonGPSVehicles}
                    onChange={(e) =>
                      handleSettingChange(
                        "allowNonGPSVehicles",
                        e.target.checked
                      )
                    }
                    disabled={!hasAdminPermission}
                    className="tw-sr-only tw-peer"
                  />
                  <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-green-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-green-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                </label>
              </div>
            </div>

            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-amber-100 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-light fa-signal-slash tw-text-lg tw-text-amber-600"></i>
                  </div>
                  <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                      Bypass on GPS Failure
                    </h4>
                    <p className="tw-text-xs tw-text-gray-500">
                      Allow fueling if GPS is temporarily unavailable
                    </p>
                  </div>
                </div>
                <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.bypassOnGPSFailure}
                    onChange={(e) =>
                      handleSettingChange(
                        "bypassOnGPSFailure",
                        e.target.checked
                      )
                    }
                    disabled={!hasAdminPermission}
                    className="tw-sr-only tw-peer"
                  />
                  <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-amber-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-amber-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                </label>
              </div>
            </div>

            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-purple-100 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-light fa-database tw-text-lg tw-text-purple-600"></i>
                  </div>
                  <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                      Allow Cached Mobile Location
                    </h4>
                    <p className="tw-text-xs tw-text-gray-500">
                      Accept cached location from mobile app when offline
                    </p>
                  </div>
                </div>
                <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.allowCachedMobileLocation}
                    onChange={(e) =>
                      handleSettingChange(
                        "allowCachedMobileLocation",
                        e.target.checked
                      )
                    }
                    disabled={!hasAdminPermission}
                    className="tw-sr-only tw-peer"
                  />
                  <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-purple-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-purple-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                </label>
              </div>
            </div>

            <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-4 tw-shadow-sm">
              <div className="tw-flex tw-items-center tw-justify-between tw-mb-3">
                <div className="tw-flex tw-items-center tw-gap-3">
                  <div className="tw-w-10 tw-h-10 tw-rounded-lg tw-bg-red-100 tw-flex tw-items-center tw-justify-center">
                    <i className="fa-light fa-file-lines tw-text-lg tw-text-red-600"></i>
                  </div>
                  <div>
                    <h4 className="tw-text-sm tw-font-semibold tw-text-gray-900">
                      Enable Location Audit Log
                    </h4>
                    <p className="tw-text-xs tw-text-gray-500">
                      Log all location validation attempts for auditing
                    </p>
                  </div>
                </div>
                <label className="tw-relative tw-inline-flex tw-items-center tw-cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enableLocationAuditLog}
                    onChange={(e) =>
                      handleSettingChange(
                        "enableLocationAuditLog",
                        e.target.checked
                      )
                    }
                    disabled={!hasAdminPermission}
                    className="tw-sr-only tw-peer"
                  />
                  <div className="tw-w-11 tw-h-6 tw-bg-gray-200 peer-focus:tw-outline-none peer-focus:tw-ring-4 peer-focus:tw-ring-red-300 tw-rounded-full tw-peer peer-checked:after:tw-translate-x-full peer-checked:after:tw-border-white after:tw-content-[''] after:tw-absolute after:tw-top-[2px] after:tw-left-[2px] after:tw-bg-white after:tw-border-gray-300 after:tw-border after:tw-rounded-full after:tw-h-5 after:tw-w-5 after:tw-transition-all peer-checked:tw-bg-red-500 peer-disabled:tw-opacity-50 peer-disabled:tw-cursor-not-allowed"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Info Section */}
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-circle-info tw-text-blue-600 tw-text-lg tw-mt-0.5"></i>
            <div>
              <h4 className="tw-text-sm tw-font-semibold tw-text-blue-900 tw-mb-1">
                About Location Validation
              </h4>
              <p className="tw-text-xs tw-text-blue-700 tw-mb-2">
                Location validation ensures that vehicles are within the
                specified proximity of the fueling station before dispensing
                begins. This helps prevent unauthorized fueling and improves
                fuel management accuracy.
              </p>
              <ul className="tw-text-xs tw-text-blue-700 tw-list-disc tw-list-inside tw-space-y-1">
                <li>
                  Vehicle GPS tracking must be enabled for location validation
                  to work
                </li>
                <li>
                  Mobile app users need location permissions enabled on their
                  devices
                </li>
                <li>
                  Grace period provides tolerance for GPS accuracy variations
                </li>
                <li>
                  Audit logs help track validation attempts for compliance
                  reporting
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Tank Location Info Section */}
        <div className="tw-bg-amber-50 tw-border tw-border-amber-200 tw-rounded-lg tw-p-4">
          <div className="tw-flex tw-items-start tw-gap-3">
            <i className="fa-light fa-location-dot tw-text-amber-600 tw-text-lg tw-mt-0.5"></i>
            <div>
              <h4 className="tw-text-sm tw-font-semibold tw-text-amber-900 tw-mb-1">
                Setting Tank Locations
              </h4>
              <p className="tw-text-xs tw-text-amber-700 tw-mb-2">
                To configure the GPS coordinates (latitude/longitude) for your
                fuel tanks, you need to manage tank locations in the Tank
                Management section.
              </p>
              <div className="tw-flex tw-items-center tw-gap-2 tw-mt-2">
                <i className="fa-light fa-arrow-right tw-text-amber-600"></i>
                <span className="tw-text-xs tw-text-amber-800 tw-font-medium">
                  Navigate to:{" "}
                  <span className="tw-font-bold">Admin → Tank Management</span>{" "}
                  to set or update tank GPS locations
                </span>
              </div>
              <p className="tw-text-xs tw-text-amber-600 tw-mt-2 tw-italic">
                Each tank must have valid GPS coordinates set for location
                validation to work properly.
              </p>
            </div>
          </div>
        </div>
      </div>

      <LoadPanel
        visible={loading || saving}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0, 0, 0, 0.4)"
        showPane={true}
        message={saving ? "Saving settings..." : "Loading..."}
      />

      {/* Bypass History Popup */}
      <Popup
        visible={showBypassHistoryPopup}
        onHiding={() => setShowBypassHistoryPopup(false)}
        dragEnabled={true}
        closeOnOutsideClick={false}
        showCloseButton={true}
        showTitle={true}
        title="Location Bypass History"
        width="90%"
        height="80%"
        maxWidth={1200}
        maxHeight={800}
      >
        <LocationBypassHistoryView
          onClose={() => setShowBypassHistoryPopup(false)}
        />
      </Popup>

      {/* Location Settings Overview Popup */}
      <Popup
        visible={showSettingsOverviewPopup}
        onHiding={() => setShowSettingsOverviewPopup(false)}
        dragEnabled={true}
        closeOnOutsideClick={false}
        showCloseButton={true}
        showTitle={true}
        title="Location Settings Overview"
        width="95%"
        height="90%"
        maxWidth={1400}
        maxHeight={900}
      >
        <LocationSettingsOverview
          onClose={() => setShowSettingsOverviewPopup(false)}
        />
      </Popup>
    </div>
  );
};

export default LocationRulesSettings;
