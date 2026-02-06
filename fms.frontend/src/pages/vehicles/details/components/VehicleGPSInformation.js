/**
 * File: VehicleGPSInformation.js
 * Purpose: Displays comprehensive GPS information for a vehicle including location map and sensor data
 * Dependencies: vehicleGPSTrackingService, React, DevExtreme, Google Maps API
 * Last Modified: 2025-01-20
 *
 * Key Features:
 * - Location section with Google Maps display
 * - Sensor information display (GPS signal, satellite count, fuel level, etc.)
 * - Device information display
 */

import React, { useState, useEffect, useRef } from "react";
import LoadIndicator from "devextreme-react/load-indicator";
import notify from "devextreme/ui/notify";
import vehicleGPSTrackingService from "../../../../services/vehicleGPSTrackingService";
import axiosInstance from "../../../../api/axiosInstance";

import "./VehicleGPSInformation.scss";

const VehicleGPSInformation = ({ vehicleId }) => {
  const [gpsData, setGpsData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapApiKey, setMapApiKey] = useState(null);
  const [isMapLoading, setIsMapLoading] = useState(false);
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    loadGPSInformation();
    loadMapApiKey();
  }, [vehicleId]);

  useEffect(() => {
    if (mapApiKey && gpsData?.latitude && gpsData?.longitude) {
      loadGoogleMapsScript();
    }
  }, [mapApiKey, gpsData?.latitude, gpsData?.longitude]);

  // Additional effect to ensure map initializes when component is visible
  useEffect(() => {
    if (mapApiKey && gpsData?.latitude && gpsData?.longitude && window.google && window.google.maps && mapRef.current) {
      // Check if map is already initialized
      if (!mapInstanceRef.current) {
        // Use a small delay to ensure DOM is ready
        const timer = setTimeout(() => {
          if (mapRef.current && document.contains(mapRef.current)) {
            const rect = mapRef.current.getBoundingClientRect();
            if (rect.width > 0 && rect.height > 0) {
              initializeMap();
            }
          }
        }, 500);
        return () => clearTimeout(timer);
      }
    }
  }, [mapApiKey, gpsData?.latitude, gpsData?.longitude]);

  const loadGPSInformation = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get(
        `/vehicletracking/${vehicleId}/gps-information`
      );

      if (response.data && (response.data.success || response.data.isSuccess)) {
        setGpsData(response.data.data);
      } else {
        notify(
          response.data?.message || "Failed to load GPS information",
          "error",
          3000
        );
      }
    } catch (error) {
      console.error("Error loading GPS information:", error);
      notify("Error loading GPS information", "error", 3000);
    } finally {
      setIsLoading(false);
    }
  };

  const loadMapApiKey = async () => {
    try {
      const response = await axiosInstance.get(
        "/SystemConfiguration/by-key/GoogleMaps.ApiKey"
      );

      if (response.data && (response.data.success || response.data.isSuccess) && response.data.data) {
        const apiKey = response.data.data.configurationValue;
        console.log("Google Maps API key loaded successfully");
        setMapApiKey(apiKey);
      } else {
        console.error("Failed to load Google Maps API key from configuration", response.data);
        notify("Failed to load map configuration", "warning", 3000);
      }
    } catch (error) {
      console.error("Error loading Google Maps API key:", error);
      notify("Error loading map configuration", "warning", 3000);
    }
  };

  const loadGoogleMapsScript = () => {
    if (!mapApiKey) {
      console.warn("Cannot load Google Maps: API key not available");
      return;
    }

    // Check if Google Maps script is already loaded
    if (window.google && window.google.maps) {
      console.log("Google Maps API already loaded, initializing map...");
      // Wait a bit to ensure mapRef is ready
      setTimeout(() => {
        initializeMap();
      }, 300);
      return;
    }

    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      console.log("Google Maps script already in DOM, waiting for load...");
      // Script is loading, wait for it
      const originalOnLoad = existingScript.onload;
      existingScript.onload = () => {
        setIsMapLoading(false);
        if (originalOnLoad) originalOnLoad();
        setTimeout(() => {
          initializeMap();
        }, 300);
      };
      const originalOnError = existingScript.onerror;
      existingScript.onerror = () => {
        setIsMapLoading(false);
        console.error("Failed to load Google Maps script");
        notify("Failed to load Google Maps", "error", 3000);
        if (originalOnError) originalOnError();
      };
      return;
    }

    console.log("Loading Google Maps script...");
    setIsMapLoading(true);

    const script = document.createElement("script");
    script.src = `https://maps.googleapis.com/maps/api/js?key=${mapApiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      console.log("Google Maps script loaded successfully");
      setIsMapLoading(false);
      // Wait a bit to ensure mapRef is ready
      setTimeout(() => {
        initializeMap();
      }, 300);
    };
    script.onerror = (error) => {
      setIsMapLoading(false);
      console.error("Failed to load Google Maps script", error);
      notify("Failed to load Google Maps. Please check your API key.", "error", 3000);
    };

    document.head.appendChild(script);
  };

  const initializeMap = () => {
    console.log("Attempting to initialize map...", {
      hasMapRef: !!mapRef.current,
      hasLatitude: !!gpsData?.latitude,
      hasLongitude: !!gpsData?.longitude,
      hasGoogleMaps: !!(window.google && window.google.maps),
      mapRefInDOM: mapRef.current ? document.contains(mapRef.current) : false,
    });

    if (!mapRef.current) {
      console.warn("Cannot initialize map: mapRef is not available");
      return;
    }

    if (!document.contains(mapRef.current)) {
      console.warn("Cannot initialize map: mapRef is not in DOM yet");
      // Retry after a short delay
      setTimeout(() => {
        if (document.contains(mapRef.current)) {
          initializeMap();
        }
      }, 500);
      return;
    }

    // Check if map container has dimensions
    const rect = mapRef.current.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) {
      console.warn("Cannot initialize map: map container has no dimensions", rect);
      // Retry after a short delay in case it's just not visible yet
      setTimeout(() => {
        const retryRect = mapRef.current.getBoundingClientRect();
        if (retryRect.width > 0 && retryRect.height > 0) {
          initializeMap();
        }
      }, 500);
      return;
    }

    if (!gpsData?.latitude || !gpsData?.longitude) {
      console.warn("Cannot initialize map: missing GPS coordinates");
      return;
    }

    if (!window.google || !window.google.maps) {
      console.error("Google Maps API not loaded");
      return;
    }

    // Clear existing map if any to allow re-initialization
    if (mapInstanceRef.current) {
      console.log("Clearing existing map instance");
      mapInstanceRef.current = null;
    }

    try {
      const position = {
        lat: parseFloat(gpsData.latitude),
        lng: parseFloat(gpsData.longitude),
      };

      // Validate coordinates
      if (isNaN(position.lat) || isNaN(position.lng)) {
        console.error("Invalid coordinates:", position);
        return;
      }

      console.log("Creating Google Map with position:", position);

      // Create map with zoom level 10
      const map = new window.google.maps.Map(mapRef.current, {
        center: position,
        zoom: 10,
        mapTypeId: "roadmap",
        mapTypeControl: true,
        streetViewControl: true,
        fullscreenControl: true,
        zoomControl: true,
      });

      console.log("Google Map created successfully");

      // Add marker for vehicle location
      const marker = new window.google.maps.Marker({
        position: position,
        map: map,
        title: "Vehicle Location",
        animation: window.google.maps.Animation.DROP,
        // Using default red marker pin icon
      });

      // Add info window
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
        <div style="padding: 8px;">
          <h3 style="margin: 0 0 8px 0; font-size: 14px; font-weight: bold;">Vehicle Location</h3>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Latitude:</strong> ${gpsData.latitude.toFixed(6)}</p>
          <p style="margin: 4px 0; font-size: 12px;"><strong>Longitude:</strong> ${gpsData.longitude.toFixed(6)}</p>
          ${gpsData.speed ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Speed:</strong> ${gpsData.speed.toFixed(2)} km/h</p>` : ""}
          ${gpsData.address ? `<p style="margin: 4px 0; font-size: 12px;"><strong>Address:</strong> ${gpsData.address}</p>` : ""}
        </div>
      `,
      });

      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });

      mapInstanceRef.current = map;
      markerRef.current = marker;
      console.log("Map initialization completed successfully");
    } catch (error) {
      console.error("Error initializing Google Maps:", error);
      notify("Failed to initialize map: " + error.message, "error", 3000);
    }
  };

  if (isLoading) {
    return (
      <div className="tw-flex tw-justify-center tw-items-center tw-h-64">
        <LoadIndicator width="48px" height="48px" visible={true} />
      </div>
    );
  }

  if (!gpsData) {
    return (
      <div className="tw-p-6 tw-text-center">
        <i className="fa-light fa-exclamation-triangle tw-text-4xl tw-text-yellow-500 tw-mb-4"></i>
        <h3 className="tw-text-lg tw-font-semibold tw-mb-2">
          GPS Information Not Available
        </h3>
        <p className="tw-text-gray-600">
          This vehicle does not have GPS installed or GPS data is not available.
        </p>
      </div>
    );
  }

  const formatCoordinate = (value) => {
    return value ? value.toFixed(6) : "N/A";
  };

  const formatSpeed = (speed) => {
    return speed ? `${speed.toFixed(2)} km/h` : "N/A";
  };

  const formatHeading = (heading) => {
    if (!heading) return "N/A";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(heading / 45) % 8;
    return `${heading.toFixed(0)}° (${directions[index]})`;
  };

  const getHealthStatusColor = (health) => {
    switch (health?.toLowerCase()) {
      case "good":
        return "tw-text-green-600";
      case "warning":
        return "tw-text-yellow-600";
      case "critical":
        return "tw-text-red-600";
      default:
        return "tw-text-gray-600";
    }
  };

  const getSignalStrengthColor = (signal) => {
    switch (signal?.toLowerCase()) {
      case "strong":
        return "tw-text-green-600";
      case "moderate":
        return "tw-text-yellow-600";
      case "weak":
        return "tw-text-orange-600";
      case "none":
        return "tw-text-red-600";
      default:
        return "tw-text-gray-600";
    }
  };

  return (
    <div className="vehicle-gps-information tw-p-4">
      {/* Location Section */}
      <div className="tw-mb-6">
        <h2 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-map-location-dot"></i>
          Location
        </h2>
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-overflow-hidden">
          {/* Google Maps Container */}
          <div className="tw-relative tw-w-full" style={{ height: "400px" }}>
            {gpsData.latitude && gpsData.longitude ? (
              <>
                {/* Map container */}
                <div
                  ref={mapRef}
                  className="tw-absolute tw-inset-0"
                  style={{ width: "100%", height: "100%" }}
                />
                {/* Loading overlay */}
                {isMapLoading && (
                  <div className="tw-absolute tw-inset-0 tw-bg-white tw-bg-opacity-75 tw-flex tw-items-center tw-justify-center tw-z-10">
                    <div className="tw-text-center">
                      <LoadIndicator width="48px" height="48px" visible={true} />
                      <p className="tw-text-sm tw-text-gray-600 tw-mt-2">
                        Loading map...
                      </p>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="tw-absolute tw-inset-0 tw-bg-gray-100 tw-flex tw-items-center tw-justify-center">
                <div className="tw-text-center tw-text-gray-500">
                  <i className="fa-light fa-map-marker-slash tw-text-6xl tw-mb-4"></i>
                  <p className="tw-text-lg tw-font-semibold">
                    Location Not Available
                  </p>
                  <p className="tw-text-sm">
                    GPS position data is not currently available
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Location Details */}
          <div className="tw-p-4 tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-border-t tw-border-gray-200">
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Latitude</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {formatCoordinate(gpsData.latitude)}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Longitude</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {formatCoordinate(gpsData.longitude)}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Speed</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {formatSpeed(gpsData.speed)}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Heading</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {formatHeading(gpsData.heading)}
              </div>
            </div>
            {gpsData.altitude && (
              <div>
                <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Altitude</div>
                <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                  {gpsData.altitude.toFixed(2)} m
                </div>
              </div>
            )}
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Status</div>
              <div
                className={`tw-text-base tw-font-semibold ${gpsData.isOnline ? "tw-text-green-600" : "tw-text-red-600"
                  }`}
              >
                {gpsData.isOnline ? "Online" : "Offline"}
              </div>
            </div>
            {gpsData.lastUpdated && (
              <div>
                <div className="tw-text-sm tw-text-gray-600 tw-mb-1">
                  Last Updated
                </div>
                <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                  {new Date(gpsData.lastUpdated).toLocaleString()}
                </div>
              </div>
            )}
            {gpsData.address && (
              <div className="md:tw-col-span-2">
                <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Address</div>
                <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                  {gpsData.address}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sensor Information Section */}
      <div className="tw-mb-6">
        <h2 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-sensor"></i>
          Sensor Information
        </h2>
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-6">
          {gpsData.sensorHealth ? (
            <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-6">
              {/* Sensor Health Overview */}
              <div className="lg:tw-col-span-3">
                <div className="tw-bg-gray-50 tw-rounded-lg tw-p-4 tw-border tw-border-gray-200">
                  <div className="tw-flex tw-items-center tw-justify-between">
                    <div>
                      <div className="tw-text-sm tw-text-gray-600 tw-mb-1">
                        Overall Health
                      </div>
                      <div
                        className={`tw-text-2xl tw-font-bold ${getHealthStatusColor(
                          gpsData.sensorHealth.overallHealth
                        )}`}
                      >
                        {gpsData.sensorHealth.overallHealth || "Unknown"}
                      </div>
                    </div>
                    <div className="tw-text-right">
                      <div className="tw-text-sm tw-text-gray-600 tw-mb-1">
                        Last Sensor Update
                      </div>
                      <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                        {gpsData.sensorHealth.lastSensorUpdate
                          ? new Date(
                            gpsData.sensorHealth.lastSensorUpdate
                          ).toLocaleString()
                          : "N/A"}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* GPS Signal */}
              <div className="tw-bg-blue-50 tw-rounded-lg tw-p-4 tw-border tw-border-blue-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i className="fa-light fa-satellite tw-text-2xl tw-text-blue-600"></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">GPS Signal</div>
                    <div
                      className={`tw-text-lg tw-font-bold ${getSignalStrengthColor(
                        gpsData.sensorHealth.gpsSignalStrength
                      )}`}
                    >
                      {gpsData.sensorHealth.gpsSignalStrength || "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Satellite Count */}
              <div className="tw-bg-purple-50 tw-rounded-lg tw-p-4 tw-border tw-border-purple-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i className="fa-light fa-satellite-dish tw-text-2xl tw-text-purple-600"></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">
                      Satellite Count
                    </div>
                    <div className="tw-text-lg tw-font-bold tw-text-purple-800">
                      {gpsData.sensorHealth.satelliteCount ?? "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Position Valid */}
              <div className="tw-bg-green-50 tw-rounded-lg tw-p-4 tw-border tw-border-green-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i
                    className={`fa-light tw-text-2xl ${gpsData.sensorHealth.isPositionValid
                        ? "fa-circle-check tw-text-green-600"
                        : "fa-circle-xmark tw-text-red-600"
                      }`}
                  ></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">
                      Position Valid
                    </div>
                    <div
                      className={`tw-text-lg tw-font-bold ${gpsData.sensorHealth.isPositionValid
                          ? "tw-text-green-800"
                          : "tw-text-red-800"
                        }`}
                    >
                      {gpsData.sensorHealth.isPositionValid ? "Yes" : "No"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Fuel Level */}
              <div className="tw-bg-yellow-50 tw-rounded-lg tw-p-4 tw-border tw-border-yellow-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i className="fa-light fa-gas-pump tw-text-2xl tw-text-yellow-600"></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">Fuel Level</div>
                    <div className="tw-text-lg tw-font-bold tw-text-yellow-800">
                      {gpsData.sensorHealth.fuelLevel !== null
                        ? `${Math.floor(gpsData.sensorHealth.fuelLevel)} ${gpsData.sensorHealth.fuelLevelUnit || "L"}`
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engine Temperature */}
              <div className="tw-bg-red-50 tw-rounded-lg tw-p-4 tw-border tw-border-red-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i className="fa-light fa-temperature-high tw-text-2xl tw-text-red-600"></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">
                      Engine Temp
                    </div>
                    <div className="tw-text-lg tw-font-bold tw-text-red-800">
                      {gpsData.sensorHealth.engineTemperature !== null
                        ? `${gpsData.sensorHealth.engineTemperature}°C`
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Battery Voltage */}
              <div className="tw-bg-indigo-50 tw-rounded-lg tw-p-4 tw-border tw-border-indigo-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i className="fa-light fa-battery-full tw-text-2xl tw-text-indigo-600"></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">
                      Battery Voltage
                    </div>
                    <div className="tw-text-lg tw-font-bold tw-text-indigo-800">
                      {gpsData.sensorHealth.batteryVoltage !== null
                        ? `${gpsData.sensorHealth.batteryVoltage}V`
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Ignition Status */}
              <div className="tw-bg-orange-50 tw-rounded-lg tw-p-4 tw-border tw-border-orange-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i
                    className={`fa-light tw-text-2xl ${gpsData.sensorHealth.ignitionStatus
                        ? "fa-key tw-text-orange-600"
                        : "fa-key tw-text-gray-400"
                      }`}
                  ></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">Ignition</div>
                    <div
                      className={`tw-text-lg tw-font-bold ${gpsData.sensorHealth.ignitionStatus
                          ? "tw-text-orange-800"
                          : "tw-text-gray-600"
                        }`}
                    >
                      {gpsData.sensorHealth.ignitionStatus !== null
                        ? gpsData.sensorHealth.ignitionStatus
                          ? "On"
                          : "Off"
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Engine Status */}
              <div className="tw-bg-teal-50 tw-rounded-lg tw-p-4 tw-border tw-border-teal-200">
                <div className="tw-flex tw-items-center tw-gap-3 tw-mb-2">
                  <i
                    className={`fa-light tw-text-2xl ${gpsData.sensorHealth.engineStatus
                        ? "fa-engine tw-text-teal-600"
                        : "fa-engine tw-text-gray-400"
                      }`}
                  ></i>
                  <div className="tw-flex-1">
                    <div className="tw-text-sm tw-text-gray-600">Engine</div>
                    <div
                      className={`tw-text-lg tw-font-bold ${gpsData.sensorHealth.engineStatus
                          ? "tw-text-teal-800"
                          : "tw-text-gray-600"
                        }`}
                    >
                      {gpsData.sensorHealth.engineStatus !== null
                        ? gpsData.sensorHealth.engineStatus
                          ? "Running"
                          : "Stopped"
                        : "N/A"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="tw-text-center tw-py-8 tw-text-gray-500">
              <i className="fa-light fa-sensor-off tw-text-4xl tw-mb-4"></i>
              <p>Sensor information is not available</p>
            </div>
          )}
        </div>
      </div>

      {/* Device Information Section */}
      <div>
        <h2 className="tw-text-xl tw-font-bold tw-text-gray-800 tw-mb-4 tw-flex tw-items-center tw-gap-2">
          <i className="fa-light fa-microchip"></i>
          Device Information
        </h2>
        <div className="tw-bg-white tw-rounded-lg tw-border tw-border-gray-200 tw-p-6">
          <div className="tw-grid tw-grid-cols-1 md:tw-grid-cols-2 lg:tw-grid-cols-3 tw-gap-4">
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Device ID</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {gpsData.deviceId || "N/A"}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Device Name</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {gpsData.deviceName || "N/A"}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">IMEI</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {gpsData.deviceIMEI || "N/A"}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Protocol</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {gpsData.protocol || "N/A"}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">Last IP</div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {gpsData.lastIP || "N/A"}
              </div>
            </div>
            <div>
              <div className="tw-text-sm tw-text-gray-600 tw-mb-1">
                Last Device Activity
              </div>
              <div className="tw-text-base tw-font-semibold tw-text-gray-800">
                {gpsData.lastDeviceActivity
                  ? new Date(gpsData.lastDeviceActivity).toLocaleString()
                  : "N/A"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VehicleGPSInformation;

