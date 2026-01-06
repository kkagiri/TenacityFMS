import React, { useState, useEffect, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Button } from "devextreme-react/button";
import { LoadPanel } from "devextreme-react/load-panel";
import { NumberBox } from "devextreme-react/number-box";
import notify from "devextreme/ui/notify";
import { usePermissions } from "../../../hooks/usePermissions";
import {
  fetchSystemConfigurations,
  updateSystemConfiguration,
} from "../../../redux/actions/systemConfigActions";

const LocationRulesSettings = () => {
  const dispatch = useDispatch();
  const { userInfo } = usePermissions();
  const { configurations, loading } = useSelector(
    (state) => state.systemConfig
  );

  const [settings, setSettings] = useState({
    enableLocationValidation: false,
    defaultVehicleProximityRadius: 100,
    defaultMobileProximityRadius: 50,
    allowNonGPSVehicles: true,
    bypassOnGPSFailure: true,
    minimumGPSAccuracy: 20,
    locationCacheSeconds: 30,
    proximityGracePeriodMeters: 10,
    allowCachedMobileLocation: true,
    enableLocationAuditLog: true,
  });

  const [configMap, setConfigMap] = useState({});
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);
  const [originalSettings, setOriginalSettings] = useState({});

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
  }, [dispatch]);

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
    </div>
  );
};

export default LocationRulesSettings;
