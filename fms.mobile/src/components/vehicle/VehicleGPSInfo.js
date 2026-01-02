/**
 * VehicleGPSInfo.js
 * Purpose: Display GPS information for a vehicle with link to open in maps
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Linking,
  Platform,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";

const VehicleGPSInfo = ({ vehicle }) => {
  const [gpsData, setGpsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (vehicle?.vehicleId) {
      loadGPSData();
    }
  }, [vehicle?.vehicleId]);

  const loadGPSData = async () => {
    if (!vehicle?.vehicleId) return;

    try {
      setIsLoading(true);
      setError(null);
      const response = await ApiService.getVehicleGPSInfo(vehicle.vehicleId);

      if (response && response.isSuccess && response.data) {
        setGpsData(response.data);
      } else if (response && response.data) {
        // Handle response.data directly
        setGpsData(response.data);
      } else {
        setError("No GPS data available");
      }
    } catch (err) {
      console.error("[VehicleGPSInfo] Error loading GPS data:", err);
      setError(err.message || "Failed to load GPS data");
    } finally {
      setIsLoading(false);
    }
  };

  const openInMaps = () => {
    if (!gpsData?.latitude || !gpsData?.longitude) {
      Alert.alert("Error", "No GPS coordinates available");
      return;
    }

    const lat = gpsData.latitude;
    const lng = gpsData.longitude;
    const label = `${vehicle.hyoungNo} - ${vehicle.vehicleName}`;

    const scheme = Platform.select({
      ios: "maps:",
      android: "geo:",
    });

    const url = Platform.select({
      ios: `maps:?q=${label}&ll=${lat},${lng}`,
      android: `geo:${lat},${lng}?q=${lat},${lng}(${label})`,
    });

    const webUrl = `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

    Linking.canOpenURL(url)
      .then((supported) => {
        if (supported) {
          return Linking.openURL(url);
        } else {
          return Linking.openURL(webUrl);
        }
      })
      .catch((err) => {
        console.error("Error opening maps:", err);
        Alert.alert("Error", "Could not open maps application");
      });
  };

  const formatCoordinate = (value) => {
    return value ? value.toFixed(6) : "N/A";
  };

  const formatSpeed = (speed) => {
    return speed ? `${speed.toFixed(1)} km/h` : "0 km/h";
  };

  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getHeadingDirection = (heading) => {
    if (heading === null || heading === undefined) return "N/A";
    const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
    const index = Math.round(heading / 45) % 8;
    return `${directions[index]} (${heading.toFixed(0)}°)`;
  };

  const getSignalColor = (signal) => {
    if (!signal) return "#9ca3af";
    if (typeof signal === "string") {
      const lowerSignal = signal.toLowerCase();
      if (lowerSignal === "strong" || lowerSignal === "excellent")
        return "#10b981";
      if (lowerSignal === "medium" || lowerSignal === "good") return "#f59e0b";
      if (lowerSignal === "weak" || lowerSignal === "poor") return "#ef4444";
    }
    if (typeof signal === "number") {
      if (signal >= 75) return "#10b981";
      if (signal >= 50) return "#f59e0b";
      return "#ef4444";
    }
    return "#9ca3af";
  };

  const getHealthColor = (health) => {
    if (!health) return "#9ca3af";
    const lowerHealth = health.toLowerCase();
    if (
      lowerHealth === "healthy" ||
      lowerHealth === "good" ||
      lowerHealth === "excellent"
    )
      return "#10b981";
    if (lowerHealth === "warning" || lowerHealth === "moderate")
      return "#f59e0b";
    if (
      lowerHealth === "critical" ||
      lowerHealth === "poor" ||
      lowerHealth === "unhealthy"
    )
      return "#ef4444";
    return "#6b7280";
  };

  if (!vehicle) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="satellite-dish" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No vehicle selected</Text>
      </View>
    );
  }

  if (!vehicle.hasGPSInstalled) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="satellite-dish" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>GPS not installed on this vehicle</Text>
        <Text style={styles.emptySubtext}>
          Contact support to add GPS tracking to this vehicle
        </Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading GPS data...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={48} color="#f59e0b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={loadGPSData}>
          <Icon name="redo" size={14} color="white" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Location Card with Map Link */}
      <View style={styles.locationCard}>
        <View style={styles.locationHeader}>
          <View style={styles.locationIconContainer}>
            <Icon name="map-marker-alt" size={24} color="#ef4444" />
          </View>
          <View style={styles.locationInfo}>
            <Text style={styles.locationTitle}>Current Location</Text>
            <Text style={styles.locationSubtitle}>
              Last updated:{" "}
              {formatDate(gpsData?.lastUpdated || gpsData?.receivedAt)}
            </Text>
          </View>
        </View>

        <View style={styles.coordinatesRow}>
          <View style={styles.coordinateItem}>
            <Text style={styles.coordinateLabel}>Latitude</Text>
            <Text style={styles.coordinateValue}>
              {formatCoordinate(gpsData?.latitude)}
            </Text>
          </View>
          <View style={styles.coordinateItem}>
            <Text style={styles.coordinateLabel}>Longitude</Text>
            <Text style={styles.coordinateValue}>
              {formatCoordinate(gpsData?.longitude)}
            </Text>
          </View>
        </View>

        {gpsData?.address && (
          <View style={styles.addressContainer}>
            <Icon name="map-signs" size={14} color="#6b7280" />
            <Text style={styles.addressText}>{gpsData.address}</Text>
          </View>
        )}

        {/* Open in Maps Button */}
        <TouchableOpacity
          style={styles.mapButton}
          onPress={openInMaps}
          activeOpacity={0.8}
        >
          <Icon name="map-marked-alt" size={18} color="white" />
          <Text style={styles.mapButtonText}>View on Map</Text>
          <Icon name="external-link-alt" size={14} color="white" />
        </TouchableOpacity>
      </View>

      {/* Motion Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="tachometer-alt" size={16} color="#3b82f6" />
          <Text style={styles.sectionTitle}>Motion Data</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.motionGrid}>
            <View style={styles.motionItem}>
              <Icon name="gauge-high" size={20} color="#10b981" />
              <Text style={styles.motionValue}>
                {formatSpeed(gpsData?.speed)}
              </Text>
              <Text style={styles.motionLabel}>Speed</Text>
            </View>
            <View style={styles.motionItem}>
              <Icon name="compass" size={20} color="#6366f1" />
              <Text style={styles.motionValue}>
                {getHeadingDirection(gpsData?.heading)}
              </Text>
              <Text style={styles.motionLabel}>Heading</Text>
            </View>
            <View style={styles.motionItem}>
              <Icon name="mountain" size={20} color="#f59e0b" />
              <Text style={styles.motionValue}>
                {gpsData?.altitude ? `${gpsData.altitude.toFixed(0)}m` : "N/A"}
              </Text>
              <Text style={styles.motionLabel}>Altitude</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Signal Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="signal" size={16} color="#10b981" />
          <Text style={styles.sectionTitle}>Signal Quality</Text>
        </View>
        <View style={styles.sectionContent}>
          <View style={styles.signalGrid}>
            <View style={styles.signalItem}>
              <View style={styles.signalIconContainer}>
                <Icon name="satellite" size={18} color="#2563eb" />
              </View>
              <View style={styles.signalInfo}>
                <Text style={styles.signalLabel}>Satellites</Text>
                <Text style={styles.signalValue}>
                  {gpsData?.sensorHealth?.satelliteCount ??
                    gpsData?.satelliteCount ??
                    0}
                </Text>
              </View>
            </View>
            <View style={styles.signalItem}>
              <View
                style={[
                  styles.signalIconContainer,
                  {
                    backgroundColor:
                      getSignalColor(
                        gpsData?.sensorHealth?.gpsSignalStrength ||
                          gpsData?.signalStrength
                      ) + "20",
                  },
                ]}
              >
                <Icon
                  name="wifi"
                  size={18}
                  color={getSignalColor(
                    gpsData?.sensorHealth?.gpsSignalStrength ||
                      gpsData?.signalStrength
                  )}
                />
              </View>
              <View style={styles.signalInfo}>
                <Text style={styles.signalLabel}>Signal</Text>
                <Text
                  style={[
                    styles.signalValue,
                    {
                      color: getSignalColor(
                        gpsData?.sensorHealth?.gpsSignalStrength ||
                          gpsData?.signalStrength
                      ),
                    },
                  ]}
                >
                  {gpsData?.sensorHealth?.gpsSignalStrength ||
                    gpsData?.signalStrength ||
                    "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      </View>

      {/* Sensor Health Information - Following web implementation */}
      {gpsData?.sensorHealth && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Icon name="microchip" size={16} color="#8b5cf6" />
            <Text style={styles.sectionTitle}>Sensor Information</Text>
          </View>
          <View style={styles.sectionContent}>
            {/* Overall Health */}
            <View style={styles.healthCard}>
              <View style={styles.healthRow}>
                <View>
                  <Text style={styles.healthLabel}>Overall Health</Text>
                  <Text
                    style={[
                      styles.healthValue,
                      {
                        color: getHealthColor(
                          gpsData.sensorHealth.overallHealth
                        ),
                      },
                    ]}
                  >
                    {gpsData.sensorHealth.overallHealth || "Unknown"}
                  </Text>
                </View>
                {gpsData.sensorHealth.lastSensorUpdate && (
                  <View style={styles.healthTimeContainer}>
                    <Text style={styles.healthTimeLabel}>Last Update</Text>
                    <Text style={styles.healthTimeValue}>
                      {formatDate(gpsData.sensorHealth.lastSensorUpdate)}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Sensor Grid */}
            <View style={styles.sensorGrid}>
              {/* GPS Signal */}
              <View style={[styles.sensorCard, { backgroundColor: "#eff6ff" }]}>
                <Icon name="satellite" size={20} color="#2563eb" />
                <Text style={styles.sensorCardLabel}>GPS Signal</Text>
                <Text style={[styles.sensorCardValue, { color: "#1e40af" }]}>
                  {gpsData.sensorHealth.gpsSignalStrength || "N/A"}
                </Text>
              </View>

              {/* Satellite Count */}
              <View style={[styles.sensorCard, { backgroundColor: "#f3e8ff" }]}>
                <Icon name="satellite-dish" size={20} color="#7c3aed" />
                <Text style={styles.sensorCardLabel}>Satellites</Text>
                <Text style={[styles.sensorCardValue, { color: "#5b21b6" }]}>
                  {gpsData.sensorHealth.satelliteCount ?? "N/A"}
                </Text>
              </View>

              {/* Position Valid */}
              <View
                style={[
                  styles.sensorCard,
                  {
                    backgroundColor: gpsData.sensorHealth.isPositionValid
                      ? "#ecfdf5"
                      : "#fef2f2",
                  },
                ]}
              >
                <Icon
                  name={
                    gpsData.sensorHealth.isPositionValid
                      ? "check-circle"
                      : "times-circle"
                  }
                  size={20}
                  color={
                    gpsData.sensorHealth.isPositionValid ? "#10b981" : "#ef4444"
                  }
                />
                <Text style={styles.sensorCardLabel}>Position Valid</Text>
                <Text
                  style={[
                    styles.sensorCardValue,
                    {
                      color: gpsData.sensorHealth.isPositionValid
                        ? "#047857"
                        : "#b91c1c",
                    },
                  ]}
                >
                  {gpsData.sensorHealth.isPositionValid ? "Yes" : "No"}
                </Text>
              </View>

              {/* Fuel Level */}
              <View style={[styles.sensorCard, { backgroundColor: "#fef9c3" }]}>
                <Icon name="gas-pump" size={20} color="#ca8a04" />
                <Text style={styles.sensorCardLabel}>Fuel Level</Text>
                <Text style={[styles.sensorCardValue, { color: "#a16207" }]}>
                  {gpsData.sensorHealth.fuelLevel !== null &&
                  gpsData.sensorHealth.fuelLevel !== undefined
                    ? `${Math.floor(gpsData.sensorHealth.fuelLevel)} ${
                        gpsData.sensorHealth.fuelLevelUnit || "L"
                      }`
                    : "N/A"}
                </Text>
              </View>

              {/* Engine Temperature */}
              <View style={[styles.sensorCard, { backgroundColor: "#fef2f2" }]}>
                <Icon name="thermometer-half" size={20} color="#dc2626" />
                <Text style={styles.sensorCardLabel}>Engine Temp</Text>
                <Text style={[styles.sensorCardValue, { color: "#b91c1c" }]}>
                  {gpsData.sensorHealth.engineTemperature !== null &&
                  gpsData.sensorHealth.engineTemperature !== undefined
                    ? `${gpsData.sensorHealth.engineTemperature}°C`
                    : "N/A"}
                </Text>
              </View>

              {/* Battery Voltage */}
              <View style={[styles.sensorCard, { backgroundColor: "#eef2ff" }]}>
                <Icon name="battery-full" size={20} color="#4f46e5" />
                <Text style={styles.sensorCardLabel}>Battery</Text>
                <Text style={[styles.sensorCardValue, { color: "#3730a3" }]}>
                  {gpsData.sensorHealth.batteryVoltage !== null &&
                  gpsData.sensorHealth.batteryVoltage !== undefined
                    ? `${gpsData.sensorHealth.batteryVoltage}V`
                    : "N/A"}
                </Text>
              </View>

              {/* Ignition Status */}
              <View
                style={[
                  styles.sensorCard,
                  {
                    backgroundColor: gpsData.sensorHealth.ignitionStatus
                      ? "#fff7ed"
                      : "#f3f4f6",
                  },
                ]}
              >
                <Icon
                  name="key"
                  size={20}
                  color={
                    gpsData.sensorHealth.ignitionStatus ? "#ea580c" : "#6b7280"
                  }
                />
                <Text style={styles.sensorCardLabel}>Ignition</Text>
                <Text
                  style={[
                    styles.sensorCardValue,
                    {
                      color: gpsData.sensorHealth.ignitionStatus
                        ? "#c2410c"
                        : "#4b5563",
                    },
                  ]}
                >
                  {gpsData.sensorHealth.ignitionStatus !== null &&
                  gpsData.sensorHealth.ignitionStatus !== undefined
                    ? gpsData.sensorHealth.ignitionStatus
                      ? "On"
                      : "Off"
                    : "N/A"}
                </Text>
              </View>

              {/* Engine Status */}
              <View
                style={[
                  styles.sensorCard,
                  {
                    backgroundColor: gpsData.sensorHealth.engineStatus
                      ? "#ecfdf5"
                      : "#f3f4f6",
                  },
                ]}
              >
                <Icon
                  name="cog"
                  size={20}
                  color={
                    gpsData.sensorHealth.engineStatus ? "#059669" : "#6b7280"
                  }
                />
                <Text style={styles.sensorCardLabel}>Engine</Text>
                <Text
                  style={[
                    styles.sensorCardValue,
                    {
                      color: gpsData.sensorHealth.engineStatus
                        ? "#047857"
                        : "#4b5563",
                    },
                  ]}
                >
                  {gpsData.sensorHealth.engineStatus !== null &&
                  gpsData.sensorHealth.engineStatus !== undefined
                    ? gpsData.sensorHealth.engineStatus
                      ? "Running"
                      : "Stopped"
                    : "N/A"}
                </Text>
              </View>
            </View>
          </View>
        </View>
      )}

      {/* Legacy Sensor Data fallback - if sensorHealth not available */}
      {!gpsData?.sensorHealth &&
        (gpsData?.fuelLevel !== undefined ||
          gpsData?.engineHours !== undefined ||
          gpsData?.odometer !== undefined) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Icon name="gas-pump" size={16} color="#f59e0b" />
              <Text style={styles.sectionTitle}>Sensor Data</Text>
            </View>
            <View style={styles.sectionContent}>
              {gpsData?.fuelLevel !== undefined && (
                <View style={styles.sensorItem}>
                  <View style={styles.sensorHeader}>
                    <Text style={styles.sensorLabel}>Fuel Level</Text>
                    <Text style={styles.sensorValue}>
                      {gpsData.fuelLevel?.toFixed(1)}%
                    </Text>
                  </View>
                  <View style={styles.fuelBar}>
                    <View
                      style={[
                        styles.fuelBarFill,
                        { width: `${Math.min(gpsData.fuelLevel, 100)}%` },
                      ]}
                    />
                  </View>
                </View>
              )}
              {gpsData?.engineHours !== undefined && (
                <View style={styles.sensorRow}>
                  <Icon name="clock" size={14} color="#6b7280" />
                  <Text style={styles.sensorRowLabel}>Engine Hours</Text>
                  <Text style={styles.sensorRowValue}>
                    {gpsData.engineHours?.toFixed(1)} hrs
                  </Text>
                </View>
              )}
              {gpsData?.odometer !== undefined && (
                <View style={styles.sensorRow}>
                  <Icon name="road" size={14} color="#6b7280" />
                  <Text style={styles.sensorRowLabel}>Odometer</Text>
                  <Text style={styles.sensorRowValue}>
                    {gpsData.odometer?.toLocaleString()} km
                  </Text>
                </View>
              )}
            </View>
          </View>
        )}

      {/* Device Information */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Icon name="microchip" size={16} color="#64748b" />
          <Text style={styles.sectionTitle}>Device Info</Text>
        </View>
        <View style={styles.sectionContent}>
          {gpsData?.deviceId && (
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>Device ID</Text>
              <Text style={styles.deviceValue}>{gpsData.deviceId}</Text>
            </View>
          )}
          {gpsData?.imei && (
            <View style={styles.deviceRow}>
              <Text style={styles.deviceLabel}>IMEI</Text>
              <Text style={styles.deviceValue}>{gpsData.imei}</Text>
            </View>
          )}
          <View style={styles.deviceRow}>
            <Text style={styles.deviceLabel}>Status</Text>
            <View
              style={[
                styles.statusBadge,
                gpsData?.isOnline && styles.statusOnline,
              ]}
            >
              <Icon
                name="circle"
                size={8}
                color={gpsData?.isOnline ? "#10b981" : "#9ca3af"}
                solid
              />
              <Text
                style={[
                  styles.statusText,
                  gpsData?.isOnline && styles.statusTextOnline,
                ]}
              >
                {gpsData?.isOnline ? "Online" : "Offline"}
              </Text>
            </View>
          </View>
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
    fontWeight: "500",
  },
  emptySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  locationCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  locationHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  locationTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  locationSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  coordinatesRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  coordinateItem: {
    flex: 1,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 4,
  },
  coordinateLabel: {
    fontSize: 11,
    color: "#9ca3af",
    textTransform: "uppercase",
  },
  coordinateValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 4,
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  addressContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
    marginBottom: 16,
  },
  addressText: {
    flex: 1,
    fontSize: 13,
    color: "#4b5563",
    marginLeft: 10,
    lineHeight: 18,
  },
  mapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
  },
  mapButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginHorizontal: 10,
  },
  section: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 10,
  },
  sectionContent: {
    padding: 16,
  },
  motionGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  motionItem: {
    flex: 1,
    alignItems: "center",
    padding: 12,
  },
  motionValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 8,
  },
  motionLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  signalGrid: {
    flexDirection: "row",
  },
  signalItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    padding: 8,
  },
  signalIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
  },
  signalInfo: {
    marginLeft: 12,
  },
  signalLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  signalValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 2,
  },
  sensorItem: {
    marginBottom: 16,
  },
  sensorHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sensorLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  sensorValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  fuelBar: {
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  fuelBarFill: {
    height: "100%",
    backgroundColor: "#f59e0b",
    borderRadius: 4,
  },
  sensorRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sensorRowLabel: {
    flex: 1,
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 10,
  },
  sensorRowValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  deviceLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  deviceValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusOnline: {
    backgroundColor: "#ecfdf5",
  },
  statusText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  statusTextOnline: {
    color: "#10b981",
  },
  // Sensor Health Styles
  healthCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  healthRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  healthLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  healthValue: {
    fontSize: 20,
    fontWeight: "700",
  },
  healthTimeContainer: {
    alignItems: "flex-end",
  },
  healthTimeLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginBottom: 2,
  },
  healthTimeValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  sensorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginHorizontal: -4,
  },
  sensorCard: {
    width: "48%",
    marginHorizontal: "1%",
    marginBottom: 10,
    padding: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  sensorCardLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 8,
  },
  sensorCardValue: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 4,
  },
  bottomPadding: {
    height: 24,
  },
});

export default VehicleGPSInfo;
