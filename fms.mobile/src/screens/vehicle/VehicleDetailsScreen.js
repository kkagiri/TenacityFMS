/**
 * File: VehicleDetailsScreen.js
 * Purpose: Combined vehicle tracking + details screen.
 *   - Landing: Dashboard (summary cards) + Search
 *   - After search: Vehicle details tabs (Info, GPS, Live Map, Consumption, Fuel Refills)
 *
 * Flow: Home → Vehicles → Dashboard + Search → Select Vehicle → Detail Tabs
 *
 * The dashboard shows live tracking summary via DataSourceManager (fleet_total_gps).
 * Summary cards adjust based on selected group/tag.
 * Live Map tab shows embedded Google Maps with vehicle position.
 *
 * Last Modified: 2026-03-25
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";
import { usePermissions } from "../../hooks/usePermissions";
import { useVehicleTracking } from "../../hooks/useVehicleTracking";

// Import vehicle components
import {
  VehicleSearch,
  VehicleInformation,
  VehicleGPSInfo,
  VehicleLiveMap,
  VehicleConsumptionHistory,
  VehicleFuelingHistory,
  VehicleDashboard,
} from "../../components/vehicle";

const { width } = Dimensions.get("window");

const TABS = [
  { key: "info", title: "Info", icon: "truck" },
  { key: "gps", title: "GPS", icon: "satellite-dish" },
  { key: "livemap", title: "Live Map", icon: "map-marked-alt" },
  { key: "consumption", title: "Consumption", icon: "gas-pump" },
  { key: "fueling", title: "Refills", icon: "tint" },
];

const VehicleDetailsScreen = ({ navigation, route }) => {
  // Permissions
  const { canEditVehicle } = usePermissions();

  // State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

  // SignalR tracking (only active on dashboard, disconnects when viewing vehicle details)
  const showDashboard = !selectedVehicle;
  const { connectionState, isConnected, refreshData } = useVehicleTracking({
    enabled: showDashboard,
  });

  // Load vehicle from route params if passed
  useEffect(() => {
    if (route?.params?.vehicleId) {
      loadVehicleById(route.params.vehicleId);
    }
  }, [route?.params?.vehicleId]);

  const loadVehicleById = async (vehicleId) => {
    try {
      setIsLoadingDetails(true);
      const response = await ApiService.getVehicleById(vehicleId);
      if (response && response.data) {
        const vehicleData = normalizeVehicleData(response.data);
        setSelectedVehicle(vehicleData);
      } else if (response) {
        const vehicleData = normalizeVehicleData(response);
        setSelectedVehicle(vehicleData);
      }
    } catch (error) {
      console.error("[VehicleDetailsScreen] Error loading vehicle:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const normalizeVehicleData = (v) => ({
    vehicleId: v.VehicleId || v.vehicleId || v.Id || v.id,
    vehicleCode: v.VehicleCode || v.vehicleCode || "",
    vehicleName: v.VehicleName || v.vehicleName || v.Name || v.name || "",
    numberPlate:
      v.NumberPlate || v.numberPlate || v.VehicleCode || v.vehicleCode || "",
    siteName:
      v.SiteName || v.siteName || v.WorkingSiteName || v.workingSiteName || "",
    workingSiteId: v.WorkingSiteId || v.workingSiteId || null,
    vehicleTypeName:
      v.VehicleTypeName || v.vehicleTypeName || v.TypeName || v.typeName || "",
    vehicleTypeId: v.VehicleTypeId || v.vehicleTypeId || null,
    vehicleModelId: v.VehicleModelId || v.vehicleModelId || null,
    vehicleManufacturerId:
      v.VehicleManufacturerId || v.vehicleManufacturerId || null,
    fuelTankCapacity: v.FuelTankCapacity || v.fuelTankCapacity || 0,
    tankCapacity:
      v.TankCapacity ||
      v.tankCapacity ||
      v.FuelTankCapacity ||
      v.fuelTankCapacity ||
      0,
    driverName:
      v.DriverName ||
      v.driverName ||
      v.DefaultEmployeeName ||
      v.defaultEmployeeName ||
      "",
    defaultEmployeeId: v.DefaultEmployeeId || v.defaultEmployeeId || null,
    tagId: v.TagId || v.tagId || v.RfidTag || v.rfidTag || "",
    fuelType: v.FuelType || v.fuelType || "Diesel",
    hasGPSInstalled:
      v.HasGPSInstalled ||
      v.hasGPSInstalled ||
      v.HasGpsInstalled ||
      v.hasGpsInstalled ||
      false,
    gpsgategeneratedId: v.GpsgategeneratedId || v.gpsgategeneratedId || false,
    isActive:
      v.IsActive !== undefined
        ? v.IsActive
        : v.isActive !== undefined
        ? v.isActive
        : true,
    isCompanyVehicle:
      v.IsCompanyVehicle !== undefined
        ? v.IsCompanyVehicle
        : v.isCompanyVehicle !== undefined
        ? v.isCompanyVehicle
        : true,
    isFullTankPolicy:
      v.IsFullTankPolicy !== undefined
        ? v.IsFullTankPolicy
        : v.isFullTankPolicy !== undefined
        ? v.isFullTankPolicy
        : false,
    yom: v.Yom || v.yom || "",
    capacity: v.Capacity || v.capacity || "",
    passenger: v.Passenger || v.passenger || "",
    currentPhysicalReading:
      v.CurrentPhysicalReading || v.currentPhysicalReading || "",
    averageKmL: v.AverageKmL || v.averageKmL || false,
    expectedAverageclassificationName:
      v.ExpectedAverageclassificationName ||
      v.expectedAverageclassificationName ||
      "",
    expectedAverageValue: v.ExpectedAverageValue || v.expectedAverageValue || 0,
    deviceId: v.DeviceId || v.deviceId || null,
    tags: v.Tags || v.tags || [],
    dateCreated: v.DateCreated || v.dateCreated || null,
    dateModified: v.DateModified || v.dateModified || null,
    createdBy: v.CreatedBy || v.createdBy || "",
    modifiedBy: v.ModifiedBy || v.modifiedBy || "",
  });

  // When user taps a vehicle from dashboard or search
  const handleSelectVehicle = useCallback(async (vehicle) => {
    try {
      setIsLoadingDetails(true);
      // Handle all possible ID field names from different API responses
      const vehicleId = vehicle.vehicleId || vehicle.VehicleId || vehicle.id || vehicle.Id;
      if (!vehicleId) {
        console.warn("[VehicleDetailsScreen] No vehicle ID found in:", Object.keys(vehicle));
        setSelectedVehicle(normalizeVehicleData(vehicle));
        setIsLoadingDetails(false);
        setActiveTab("info");
        return;
      }
      const response = await ApiService.getVehicleById(vehicleId);
      if (response && response.data) {
        setSelectedVehicle(normalizeVehicleData(response.data));
      } else if (response) {
        setSelectedVehicle(normalizeVehicleData(response));
      } else {
        setSelectedVehicle(normalizeVehicleData(vehicle));
      }
    } catch (error) {
      console.error("[VehicleDetailsScreen] Error fetching vehicle:", error);
      setSelectedVehicle(normalizeVehicleData(vehicle));
    } finally {
      setIsLoadingDetails(false);
      setActiveTab("info");
    }
  }, []);

  const handleVehicleUpdated = useCallback(() => {
    if (selectedVehicle?.vehicleId) {
      loadVehicleById(selectedVehicle.vehicleId);
    }
  }, [selectedVehicle?.vehicleId]);

  const handleClearVehicle = useCallback(() => {
    setSelectedVehicle(null);
    setActiveTab("info");
  }, []);

  const handleBackPress = () => {
    if (selectedVehicle) {
      handleClearVehicle();
    } else {
      navigation.goBack();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "info":
        return (
          <VehicleInformation
            vehicle={selectedVehicle}
            canEdit={canEditVehicle}
            onVehicleUpdated={handleVehicleUpdated}
          />
        );
      case "gps":
        return <VehicleGPSInfo vehicle={selectedVehicle} />;
      case "livemap":
        return <VehicleLiveMap selectedVehicle={selectedVehicle} />;
      case "consumption":
        return <VehicleConsumptionHistory vehicle={selectedVehicle} />;
      case "fueling":
        return <VehicleFuelingHistory vehicle={selectedVehicle} />;
      default:
        return (
          <VehicleInformation
            vehicle={selectedVehicle}
            canEdit={canEditVehicle}
            onVehicleUpdated={handleVehicleUpdated}
          />
        );
    }
  };

  // ─── Loading overlay when fetching vehicle details ───
  if (isLoadingDetails) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1f2937" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
            <Icon name="arrow-left" size={18} color="white" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Loading...</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading vehicle details...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─── Dashboard view (no vehicle selected) ───
  if (showDashboard) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="white" />
          </TouchableOpacity>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Vehicles</Text>
            <View style={styles.headerSubRow}>
              <View style={[styles.connectionDot, { backgroundColor: isConnected ? "#10b981" : "#f59e0b" }]} />
              <Text style={styles.headerSubtitle}>
                {isConnected ? "Live Tracking" : connectionState}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
            <Icon name="sync-alt" size={14} color="white" />
          </TouchableOpacity>
        </View>

        {/* Search + Dashboard combined */}
        <VehicleDashboard
          onSelectVehicle={handleSelectVehicle}
          isConnected={isConnected}
          searchComponent={
            <VehicleSearch
              onSelectVehicle={handleSelectVehicle}
              selectedVehicle={null}
            />
          }
        />
      </SafeAreaView>
    );
  }

  // ─── Vehicle detail view (vehicle selected) ───
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-left" size={18} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>
            {selectedVehicle.vehicleCode}
          </Text>
          <Text style={styles.headerSubtitle}>
            {selectedVehicle.vehicleName}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.searchToggleButton}
          onPress={handleClearVehicle}
        >
          <Icon name="search" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Icon
              name={tab.icon}
              size={14}
              color={activeTab === tab.key ? "#2563eb" : "#9ca3af"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
              numberOfLines={1}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>{renderTabContent()}</View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  searchToggleButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  tabText: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 3,
    fontWeight: "500",
    textAlign: "center",
  },
  tabTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
});

export default VehicleDetailsScreen;
