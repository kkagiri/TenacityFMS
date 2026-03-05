/**
 * File: LocationRulesSettings.js
 * Purpose: Manage location validation settings, bypass controls, and related geofence rules.
 * Dependencies: redux, devextreme-react, geofenceService, M365SidePanel
 * Last Modified: 2026-03-05
 *
 * Key Components:
 * - LocationRulesSettings: Full-page configuration UI for location rule administration.
 */
import React, { useState, useEffect, useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { LoadPanel } from "devextreme-react/load-panel";
import { NumberBox } from "devextreme-react/number-box";
import { TextArea } from "devextreme-react/text-area";
import { SelectBox } from "devextreme-react/select-box";
import { TagBox } from "devextreme-react/tag-box";
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
import M365SidePanel from "../../../components/common/M365SidePanel";
import "./LocationRulesSettings.scss";

const LocationRulesSettings = ({ showTopInfo = true, onActionStateChange = null }) => {
  const dispatch = useDispatch();
  const { hasPermission } = usePermissions();
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
  const [bypassHistoryHeaderActions, setBypassHistoryHeaderActions] = useState({
    onRefresh: null,
    canRefresh: false,
  });

  // Location settings overview popup state
  const [showSettingsOverviewPopup, setShowSettingsOverviewPopup] = useState(false);
  const [settingsOverviewHeaderActions, setSettingsOverviewHeaderActions] = useState({
    onRefresh: null,
    canRefresh: false,
  });

  // Check if user has admin permission for location rules
  const hasAdminPermission = hasPermission("_Manage_LocationValidation");

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

  useEffect(() => {
    if (!onActionStateChange) {
      return;
    }

    onActionStateChange({
      onRefresh: handleRefresh,
      onSave: handleSave,
      canRefresh: !loading && !saving,
      canSave: hasChanges && hasAdminPermission && !saving,
    });
  }, [
    onActionStateChange,
    handleRefresh,
    handleSave,
    loading,
    saving,
    hasChanges,
    hasAdminPermission,
  ]);

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

  const [activeConfigSection, setActiveConfigSection] = useState("bypass");

  const SECTION_ITEMS = [
    {
      id: "bypass",
      icon: "fa-shield-xmark",
      title: "Temporary Bypass",
      description: "Emergency controls",
      badge: activeBypassCount > 0 ? `${activeBypassCount}` : null,
    },
    {
      id: "geofence",
      icon: "fa-map-location-dot",
      title: "Geofence Validation",
      description: "Boundary requirements",
    },
    {
      id: "proximity",
      icon: "fa-bullseye",
      title: "Proximity Radius",
      description: "Distance thresholds",
    },
    {
      id: "gps",
      icon: "fa-satellite",
      title: "GPS Configuration",
      description: "Accuracy and cache",
    },
    {
      id: "mobile",
      icon: "fa-mobile-screen-button",
      title: "Mobile App Location",
      description: "App GPS validation",
    },
    {
      id: "fallback",
      icon: "fa-shield-check",
      title: "Fallback & Grace",
      description: "Exception handling",
    },
  ];

  const ConfigNavItem = ({ item }) => (
    <button
      type="button"
      className={`loc-config-nav__item ${activeConfigSection === item.id ? "loc-config-nav__item--active" : ""}`}
      onClick={() => setActiveConfigSection(item.id)}
    >
      <div className="loc-config-nav__content">
        <i className={`fa-light ${item.icon} loc-config-nav__icon`}></i>
        <div className="loc-config-nav__text">
          <span className="loc-config-nav__title">{item.title}</span>
          <span className="loc-config-nav__desc">{item.description}</span>
        </div>
      </div>
      {item.badge && <span className="m365-badge m365-badge--error">{item.badge}</span>}
    </button>
  );

  // Clean setting row component (flat, no color)
  const SettingRow = ({ icon, title, description, children }) => (
    <div className="loc-setting-row">
      <div className="loc-setting-row__info">
        <i className={`fa-light ${icon} loc-setting-row__icon`}></i>
        <div>
          <span className="loc-setting-row__title">{title}</span>
          <span className="loc-setting-row__desc">{description}</span>
        </div>
      </div>
      <div className="loc-setting-row__control">
        {children}
      </div>
    </div>
  );

  // Checkbox control component
  const ToggleSwitch = ({ checked, onChange, disabled }) => (
    <label className="loc-checkbox-control">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
        className="loc-checkbox-control__input"
      />
      <span className="loc-checkbox-control__box">
        <i className="fa-light fa-check"></i>
      </span>
    </label>
  );

  return (
    <div className="location-rules-settings">
      {/* Header */}
      <div className="loc-header">
        <div className="loc-header__left">
          <i className="fa-light fa-location-dot loc-header__icon"></i>
          <div>
            <h2 className="loc-header__title">Location Rules</h2>
            <span className="loc-header__subtitle">Configure GPS and location-based validation for fuel dispensing</span>
          </div>
        </div>
      </div>

      {/* Permission Warning */}
      {!hasAdminPermission && (
        <div className="m365-info-banner m365-info-banner--warning" style={{ margin: "0 0 12px 0" }}>
          <i className="fa-light fa-triangle-exclamation m365-info-banner__icon"></i>
          <span className="m365-info-banner__text">You don't have permission to modify these settings.</span>
        </div>
      )}

      {/* Top Info Bubbles */}
      {showTopInfo && (
        <div className="loc-info-section loc-info-section--top">
          <div className="m365-info-banner">
            <i className="fa-light fa-circle-info m365-info-banner__icon"></i>
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                Location validation ensures vehicles are within the specified proximity before dispensing.
                Vehicle GPS tracking must be enabled. Mobile app users need location permissions.
              </span>
            </div>
          </div>
          <div className="m365-info-banner m365-info-banner--warning">
            <i className="fa-light fa-location-dot m365-info-banner__icon"></i>
            <div className="m365-info-banner__content">
              <span className="m365-info-banner__text">
                To set tank GPS coordinates, navigate to <strong>Admin → Tank Management</strong>.
                Each tank must have valid GPS coordinates for location validation to work.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Main Location Toggle */}
      <div className="loc-main-toggle">
        <div className="loc-main-toggle__info">
          <i className="fa-light fa-location-crosshairs loc-main-toggle__icon"></i>
          <div>
            <span className="loc-main-toggle__title">Enable Location Validation</span>
            <span className="loc-main-toggle__desc">When enabled, PTS devices can use location validation to verify vehicle proximity before fueling.</span>
          </div>
        </div>
        <ToggleSwitch
          checked={settings.enableLocationValidation}
          onChange={(val) => handleSettingChange("enableLocationValidation", val)}
          disabled={!hasAdminPermission}
        />
      </div>

      {/* Configuration Layout */}
      <div className="loc-config-layout">
        <aside className="loc-config-nav">
          {SECTION_ITEMS.map((item) => (
            <ConfigNavItem key={item.id} item={item} />
          ))}
        </aside>

        <section className="loc-config-content">
          {activeConfigSection === "bypass" && (
            <div className="loc-config-panel">
              <div className="loc-config-panel__header">
                <h3 className="loc-config-panel__title">
                  <i className="fa-light fa-shield-xmark"></i>
                  Temporary Location Bypass
                </h3>
                <span className="loc-config-panel__desc">Disable location validation temporarily for emergencies.</span>
              </div>

              <div className="loc-accordion__body">
                {/* Active System-Wide Bypass */}
                {bypassStatus.isActive && (
                  <div className="loc-bypass-active">
                    <div className="loc-bypass-active__info">
                      <i className="fa-light fa-globe"></i>
                      <div>
                        <span className="loc-bypass-active__label">System-Wide Bypass</span>
                        <span className="loc-bypass-active__meta">
                          Expires: {bypassStatus.expiresAt ? new Date(bypassStatus.expiresAt).toLocaleTimeString() : "N/A"}
                          {countdownDisplay && ` — ${countdownDisplay} remaining`}
                        </span>
                        <span className="loc-bypass-active__meta">
                          By: {bypassStatus.enabledBy}{bypassStatus.reason && ` — ${bypassStatus.reason}`}
                        </span>
                      </div>
                    </div>
                    <button className="m365-btn m365-btn--danger" onClick={handleCancelBypass} disabled={!hasAdminPermission || bypassLoading}>
                      <i className="fa-light fa-times"></i> Cancel
                    </button>
                  </div>
                )}

                {/* Active Vehicle Bypasses */}
                {bypassStatus.vehicleBypasses?.length > 0 && (
                  <div className="loc-bypass-group">
                    <span className="loc-bypass-group__label"><i className="fa-light fa-car"></i> Vehicle Bypasses</span>
                    {bypassStatus.vehicleBypasses.map((bypass) => (
                      <div key={bypass.id} className="loc-bypass-item">
                        <div>
                          <span className="loc-bypass-item__name">{bypass.vehicleName || bypass.vehicleHyoungNo || `Vehicle #${bypass.vehicleId}`}</span>
                          <span className="loc-bypass-item__meta">Expires: {bypass.expiresAt ? new Date(bypass.expiresAt).toLocaleTimeString() : "Never"}</span>
                        </div>
                        <button className="m365-icon-btn m365-icon-btn--danger" onClick={() => handleCancelSpecificBypass(bypass.id, bypass.vehicleName || bypass.vehicleHyoungNo)} disabled={!hasAdminPermission || bypassLoading} title="Cancel">
                          <i className="fa-light fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Active User Bypasses */}
                {bypassStatus.userBypasses?.length > 0 && (
                  <div className="loc-bypass-group">
                    <span className="loc-bypass-group__label"><i className="fa-light fa-user"></i> User Bypasses</span>
                    {bypassStatus.userBypasses.map((bypass) => (
                      <div key={bypass.id} className="loc-bypass-item">
                        <div>
                          <span className="loc-bypass-item__name">{bypass.fullName || bypass.userName || `User #${bypass.userId}`}</span>
                          <span className="loc-bypass-item__meta">Expires: {bypass.expiresAt ? new Date(bypass.expiresAt).toLocaleTimeString() : "Never"}</span>
                        </div>
                        <button className="m365-icon-btn m365-icon-btn--danger" onClick={() => handleCancelSpecificBypass(bypass.id, bypass.fullName || bypass.userName)} disabled={!hasAdminPermission || bypassLoading} title="Cancel">
                          <i className="fa-light fa-times"></i>
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add New Bypass Form */}
                <div className="loc-bypass-form">
                  <span className="loc-bypass-form__title"><i className="fa-light fa-plus"></i> Add New Bypass</span>
                  <div className="loc-bypass-form__grid">
                    <div className="loc-bypass-form__field">
                      <label>Bypass Type</label>
                      <SelectBox
                        items={bypassTypeOptions}
                        value={bypassType}
                        displayExpr="text"
                        valueExpr="value"
                        onValueChanged={(e) => { setBypassType(e.value); setSelectedVehicleIds([]); setSelectedUserIds([]); }}
                        disabled={!hasAdminPermission || bypassLoading}
                        width="100%"
                      />
                    </div>
                    <div className="loc-bypass-form__field">
                      <label>Duration</label>
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
                    {bypassType === "Vehicle" && (
                      <div className="loc-bypass-form__field loc-bypass-form__field--wide">
                        <label>Select Vehicles</label>
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
                    {bypassType === "User" && (
                      <div className="loc-bypass-form__field loc-bypass-form__field--wide">
                        <label>Select Users</label>
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
                    <div className="loc-bypass-form__field">
                      <label>Reason (optional)</label>
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
                  <div className="loc-bypass-form__actions">
                    <button className="m365-btn m365-btn--danger" onClick={handleEnableBypass} disabled={!hasAdminPermission || bypassLoading}>
                      <i className="fa-light fa-shield-xmark"></i> Enable {bypassType === "All" ? "System-Wide" : bypassType} Bypass
                    </button>
                  </div>
                </div>

                {/* Warning */}
                <div className="m365-info-banner m365-info-banner--warning" style={{ margin: "12px 0 0 0" }}>
                  <i className="fa-light fa-triangle-exclamation m365-info-banner__icon"></i>
                  <span className="m365-info-banner__text">
                    {bypassType === "All"
                      ? "System-wide bypass disables ALL location validation for all vehicles."
                      : bypassType === "Vehicle"
                        ? "Vehicle bypass disables location validation only for selected vehicles."
                        : "User bypass disables location validation only for selected users."}
                    {" "}Use for emergencies only.
                  </span>
                </div>

                {/* History/Overview buttons */}
                <div className="loc-bypass-links">
                  <button className="m365-btn m365-btn--ghost" onClick={() => setShowSettingsOverviewPopup(true)}>
                    <i className="fa-light fa-sliders"></i> Settings Overview
                  </button>
                  <button className="m365-btn m365-btn--ghost" onClick={() => setShowBypassHistoryPopup(true)}>
                    <i className="fa-light fa-clock-rotate-left"></i> Bypass History
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeConfigSection === "geofence" && (
            <div className="loc-config-panel">
              <div className="loc-config-panel__header">
                <h3 className="loc-config-panel__title">
                  <i className="fa-light fa-map-location-dot"></i>
                  Geofence Validation
                </h3>
                <span className="loc-config-panel__desc">Validate fueling against geofence boundaries.</span>
              </div>

              <div className="loc-accordion__body">
                <SettingRow icon="fa-map-location-dot" title="Enable Geofence Validation" description="Validate fueling locations against configured geofence boundaries.">
                  <ToggleSwitch checked={settings.enableGeofenceValidation} onChange={(val) => handleSettingChange("enableGeofenceValidation", val)} disabled={!hasAdminPermission} />
                </SettingRow>
                {settings.enableGeofenceValidation && (
                  <>
                    <div className="loc-accordion__divider"></div>
                    <span className="loc-accordion__sub-heading">Geofence Requirements</span>
                    <SettingRow icon="fa-truck-container" title="Require Tanker in Geofence" description="Tanker/pump must be within geofence boundary.">
                      <ToggleSwitch checked={settings.requireTankerInGeofence} onChange={(val) => handleSettingChange("requireTankerInGeofence", val)} disabled={!hasAdminPermission} />
                    </SettingRow>
                    <SettingRow icon="fa-user-helmet-safety" title="Require Operator in Geofence" description="Mobile app user must be within geofence.">
                      <ToggleSwitch checked={settings.requireOperatorInGeofence} onChange={(val) => handleSettingChange("requireOperatorInGeofence", val)} disabled={!hasAdminPermission} />
                    </SettingRow>
                    <SettingRow icon="fa-truck" title="Require Vehicle in Geofence" description="Vehicle being fueled must be in geofence.">
                      <ToggleSwitch checked={settings.requireVehicleInGeofence} onChange={(val) => handleSettingChange("requireVehicleInGeofence", val)} disabled={!hasAdminPermission} />
                    </SettingRow>
                  </>
                )}
              </div>
            </div>
          )}

          {activeConfigSection === "proximity" && (
            <div className="loc-config-panel">
              <div className="loc-config-panel__header">
                <h3 className="loc-config-panel__title">
                  <i className="fa-light fa-bullseye"></i>
                  Proximity Radius
                </h3>
                <span className="loc-config-panel__desc">Default radius settings for vehicle and mobile proximity.</span>
              </div>

              <div className="loc-accordion__body">
                <SettingRow icon="fa-car" title="Vehicle Proximity Radius" description="Default radius in meters for vehicle proximity validation.">
                  <NumberBox value={settings.defaultVehicleProximityRadius} onValueChanged={(e) => handleSettingChange("defaultVehicleProximityRadius", e.value)} min={10} max={1000} showSpinButtons={true} format="#0 m" disabled={!hasAdminPermission} width={120} />
                </SettingRow>
                <SettingRow icon="fa-mobile" title="Mobile Proximity Radius" description="Default radius in meters for mobile app proximity.">
                  <NumberBox value={settings.defaultMobileProximityRadius} onValueChanged={(e) => handleSettingChange("defaultMobileProximityRadius", e.value)} min={5} max={500} showSpinButtons={true} format="#0 m" disabled={!hasAdminPermission} width={120} />
                </SettingRow>
                <SettingRow icon="fa-plus-circle" title="Grace Period" description="Extra tolerance in meters added to proximity radius.">
                  <NumberBox value={settings.proximityGracePeriodMeters} onValueChanged={(e) => handleSettingChange("proximityGracePeriodMeters", e.value)} min={0} max={50} showSpinButtons={true} format="#0 m" disabled={!hasAdminPermission} width={120} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeConfigSection === "gps" && (
            <div className="loc-config-panel">
              <div className="loc-config-panel__header">
                <h3 className="loc-config-panel__title">
                  <i className="fa-light fa-satellite"></i>
                  GPS Configuration
                </h3>
                <span className="loc-config-panel__desc">Minimum accuracy and location cache settings.</span>
              </div>

              <div className="loc-accordion__body">
                <SettingRow icon="fa-crosshairs" title="Minimum GPS Accuracy" description="Minimum accuracy in meters required for location validation.">
                  <NumberBox value={settings.minimumGPSAccuracy} onValueChanged={(e) => handleSettingChange("minimumGPSAccuracy", e.value)} min={5} max={100} showSpinButtons={true} format="#0 m" disabled={!hasAdminPermission} width={120} />
                </SettingRow>
                <SettingRow icon="fa-clock" title="Location Cache Duration" description="How long to cache vehicle GPS location before fetching fresh data.">
                  <NumberBox value={settings.locationCacheSeconds} onValueChanged={(e) => handleSettingChange("locationCacheSeconds", e.value)} min={5} max={300} showSpinButtons={true} format="#0 sec" disabled={!hasAdminPermission} width={120} />
                </SettingRow>
              </div>
            </div>
          )}

          {activeConfigSection === "mobile" && (
            <div className="loc-config-panel">
              <div className="loc-config-panel__header">
                <h3 className="loc-config-panel__title">
                  <i className="fa-light fa-mobile-screen-button"></i>
                  Mobile App Location
                </h3>
                <span className="loc-config-panel__desc">How the mobile app obtains and validates GPS location.</span>
              </div>

              <div className="loc-accordion__body">
                <SettingRow icon="fa-location-dot" title="Require Mobile Location" description="Mobile app must provide GPS location for authorization.">
                  <ToggleSwitch checked={settings.requireMobileLocation} onChange={(val) => handleSettingChange("requireMobileLocation", val)} disabled={!hasAdminPermission} />
                </SettingRow>
                <SettingRow icon="fa-location-xmark" title="Force Fresh GPS Location" description="Always get fresh GPS fix, reject cached locations.">
                  <ToggleSwitch checked={settings.rejectCachedMobileLocation} onChange={(val) => handleSettingChange("rejectCachedMobileLocation", val)} disabled={!hasAdminPermission} />
                </SettingRow>
                <div className="loc-accordion__divider"></div>
                <SettingRow icon="fa-stopwatch" title="Max Location Age" description="Maximum age of GPS location in seconds.">
                  <NumberBox value={settings.maxMobileLocationAgeSeconds} onValueChanged={(e) => handleSettingChange("maxMobileLocationAgeSeconds", e.value)} min={10} max={300} step={5} showSpinButtons={true} format="#0 sec" disabled={!hasAdminPermission} width={120} />
                </SettingRow>
                <SettingRow icon="fa-bullseye" title="Max Location Accuracy" description="Maximum acceptable GPS accuracy in meters.">
                  <NumberBox value={settings.maxMobileLocationAccuracyMeters} onValueChanged={(e) => handleSettingChange("maxMobileLocationAccuracyMeters", e.value)} min={10} max={1000} step={10} showSpinButtons={true} format="#0 m" disabled={!hasAdminPermission} width={120} />
                </SettingRow>
                <div className="m365-info-banner" style={{ margin: "12px 0 0 0" }}>
                  <i className="fa-light fa-circle-info m365-info-banner__icon"></i>
                  <span className="m365-info-banner__text">These settings control how the mobile app obtains GPS location before requesting authorization. The server validates that the location meets these requirements.</span>
                </div>
              </div>
            </div>
          )}

          {activeConfigSection === "fallback" && (
            <div className="loc-config-panel">
              <div className="loc-config-panel__header">
                <h3 className="loc-config-panel__title">
                  <i className="fa-light fa-shield-check"></i>
                  Fallback & Grace Options
                </h3>
                <span className="loc-config-panel__desc">Handling of non-GPS vehicles, GPS failures, and audit logging.</span>
              </div>

              <div className="loc-accordion__body">
                <SettingRow icon="fa-car-circle-bolt" title="Allow Non-GPS Vehicles" description="Permit fueling for vehicles without GPS tracking.">
                  <ToggleSwitch checked={settings.allowNonGPSVehicles} onChange={(val) => handleSettingChange("allowNonGPSVehicles", val)} disabled={!hasAdminPermission} />
                </SettingRow>
                <SettingRow icon="fa-signal-slash" title="Bypass on GPS Failure" description="Allow fueling if GPS is temporarily unavailable.">
                  <ToggleSwitch checked={settings.bypassOnGPSFailure} onChange={(val) => handleSettingChange("bypassOnGPSFailure", val)} disabled={!hasAdminPermission} />
                </SettingRow>
                <SettingRow icon="fa-database" title="Allow Cached Mobile Location" description="Accept cached location from mobile app when offline.">
                  <ToggleSwitch checked={settings.allowCachedMobileLocation} onChange={(val) => handleSettingChange("allowCachedMobileLocation", val)} disabled={!hasAdminPermission} />
                </SettingRow>
                <SettingRow icon="fa-file-lines" title="Enable Location Audit Log" description="Log all location validation attempts for auditing.">
                  <ToggleSwitch checked={settings.enableLocationAuditLog} onChange={(val) => handleSettingChange("enableLocationAuditLog", val)} disabled={!hasAdminPermission} />
                </SettingRow>
              </div>
            </div>
          )}
        </section>
      </div>

      <LoadPanel
        visible={loading || saving}
        showIndicator={true}
        shading={true}
        shadingColor="rgba(0, 0, 0, 0.4)"
        showPane={true}
        message={saving ? "Saving settings..." : "Loading..."}
      />

      {/* Bypass History Panel */}
      <M365SidePanel
        visible={showBypassHistoryPopup}
        onClose={() => setShowBypassHistoryPopup(false)}
        title="Location Bypass History"
        width={1200}
        headerActions={(
          <button
            className="m365-side-panel__header-action-btn"
            onClick={() => bypassHistoryHeaderActions.onRefresh?.()}
            disabled={!bypassHistoryHeaderActions.canRefresh}
          >
            <i className="fa-light fa-rotate-right" />
            Refresh
          </button>
        )}
      >
        <div className="tw-p-4">
          <LocationBypassHistoryView
            onHeaderActionsChange={setBypassHistoryHeaderActions}
          />
        </div>
      </M365SidePanel>

      {/* Settings Overview Panel */}
      <M365SidePanel
        visible={showSettingsOverviewPopup}
        onClose={() => setShowSettingsOverviewPopup(false)}
        title="Location Settings Overview"
        width={1200}
        headerActions={(
          <button
            className="m365-side-panel__header-action-btn"
            onClick={() => settingsOverviewHeaderActions.onRefresh?.()}
            disabled={!settingsOverviewHeaderActions.canRefresh}
          >
            <i className="fa-light fa-rotate-right" />
            Refresh
          </button>
        )}
      >
        <div className="tw-p-4">
          <LocationSettingsOverview
            onHeaderActionsChange={setSettingsOverviewHeaderActions}
          />
        </div>
      </M365SidePanel>
    </div>
  );
};

export default LocationRulesSettings;
