/**
 * VehicleDetailsScreen.js
 * Purpose: Main screen for viewing vehicle details with search, GPS info, consumption, and fueling history
 * Similar functionality to web VehicleDetails.js
 */

/**
 * File: VehicleDetailsScreen.js
 * Purpose: Main screen for viewing vehicle details with search, GPS info, consumption, and fueling history
 * Similar functionality to web VehicleDetails.js
 * Last Modified: 2026-02-12
 *
 * Notes:
 * - Tank capacity editing in Vehicle Info is admin-only
 * - Other vehicle details remain view-only in mobile
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";
import { usePermissions } from "../../hooks/usePermissions";

// Import vehicle components
import {
  VehicleSearch,
  VehicleInformation,
  VehicleGPSInfo,
  VehicleConsumptionHistory,
  VehicleFuelingHistory,
} from "../../components/vehicle";

const { width } = Dimensions.get("window");

const TABS = [
  { key: "info", title: "Vehicle Info", icon: "truck" },
  { key: "gps", title: "GPS", icon: "satellite-dish" },
  { key: "consumption", title: "Consumption", icon: "gas-pump" },
  { key: "fueling", title: "Fuel Refills", icon: "tint" },
];

const VehicleDetailsScreen = ({ navigation, route }) => {
  // Permissions - use canEditVehicle (permission-based)
  const { canEditVehicle } = usePermissions();

  // State
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [activeTab, setActiveTab] = useState("info");
  const [showSearch, setShowSearch] = useState(true);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);

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
        setShowSearch(false);
      } else if (response) {
        const vehicleData = normalizeVehicleData(response);
        setSelectedVehicle(vehicleData);
        setShowSearch(false);
      }
    } catch (error) {
      console.error("[VehicleDetailsScreen] Error loading vehicle:", error);
    } finally {
      setIsLoadingDetails(false);
    }
  };

  const normalizeVehicleData = (v) => ({
    vehicleId: v.VehicleId || v.vehicleId,
    hyoungNo: v.HyoungNo || v.hyoungNo || "",
    vehicleName: v.VehicleName || v.vehicleName || v.Name || v.name || "",
    numberPlate:
      v.NumberPlate || v.numberPlate || v.HyoungNo || v.hyoungNo || "",
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

  const handleSelectVehicle = useCallback(async (vehicle) => {
    // Fetch full vehicle details from API
    try {
      setIsLoadingDetails(true);
      const response = await ApiService.getVehicleById(vehicle.vehicleId);
      if (response && response.data) {
        const vehicleData = normalizeVehicleData(response.data);
        setSelectedVehicle(vehicleData);
      } else if (response) {
        const vehicleData = normalizeVehicleData(response);
        setSelectedVehicle(vehicleData);
      } else {
        // Fallback to search result data
        const normalizedVehicle = normalizeVehicleData(vehicle);
        setSelectedVehicle(normalizedVehicle);
      }
    } catch (error) {
      console.error(
        "[VehicleDetailsScreen] Error fetching vehicle details:",
        error
      );
      // Fallback to search result data
      const normalizedVehicle = normalizeVehicleData(vehicle);
      setSelectedVehicle(normalizedVehicle);
    } finally {
      setIsLoadingDetails(false);
      setShowSearch(false);
      setActiveTab("info");
    }
  }, []);

  const handleVehicleUpdated = useCallback(() => {
    // Reload vehicle data after update
    if (selectedVehicle?.vehicleId) {
      loadVehicleById(selectedVehicle.vehicleId);
    }
  }, [selectedVehicle?.vehicleId]);

  const handleClearVehicle = useCallback(() => {
    setSelectedVehicle(null);
    setShowSearch(true);
    setActiveTab("info");
  }, []);

  const handleBackPress = () => {
    if (selectedVehicle && !showSearch) {
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
            {selectedVehicle ? selectedVehicle.hyoungNo : "Vehicle Details"}
          </Text>
          {selectedVehicle && (
            <Text style={styles.headerSubtitle}>
              {selectedVehicle.vehicleName}
            </Text>
          )}
        </View>
        {selectedVehicle && (
          <TouchableOpacity
            style={styles.searchToggleButton}
            onPress={() => setShowSearch(!showSearch)}
          >
            <Icon
              name={showSearch ? "times" : "search"}
              size={16}
              color="white"
            />
          </TouchableOpacity>
        )}
      </View>

      {/* Search Section */}
      {showSearch && (
        <View style={styles.searchSection}>
          <VehicleSearch
            onSelectVehicle={handleSelectVehicle}
            selectedVehicle={selectedVehicle}
          />
        </View>
      )}

      {/* Vehicle Content */}
      {selectedVehicle && !showSearch && (
        <>
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
                  size={16}
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
        </>
      )}

      {/* Empty State when no vehicle selected and search hidden */}
      {!selectedVehicle && !showSearch && (
        <View style={styles.emptyState}>
          <Icon name="truck" size={64} color="#d1d5db" />
          <Text style={styles.emptyTitle}>No Vehicle Selected</Text>
          <Text style={styles.emptySubtitle}>
            Search for a vehicle to view its details
          </Text>
          <TouchableOpacity
            style={styles.searchButton}
            onPress={() => setShowSearch(true)}
          >
            <Icon name="search" size={16} color="white" />
            <Text style={styles.searchButtonText}>Search Vehicles</Text>
          </TouchableOpacity>
        </View>
      )}
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
  headerSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  searchToggleButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  searchSection: {
    flex: 1,
    backgroundColor: "#f8fafc",
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
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
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
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 8,
  },
  searchButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
  },
  searchButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 10,
  },
});

export default VehicleDetailsScreen;
