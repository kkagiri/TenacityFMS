/**
 * VehicleSearch.js
 * Purpose: Quick search component for finding vehicles using search term
 * Similar to VehicleSelectionStep search functionality
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";

const VehicleSearch = ({ onSelectVehicle, selectedVehicle }) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Search vehicles using real API (minimum 2 characters)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      setSearchError(null);

      // Debounce API call
      const timer = setTimeout(async () => {
        try {
          console.log("[VehicleSearch] Searching for:", searchQuery);
          const results = await ApiService.searchVehicles(searchQuery, 10);
          console.log("[VehicleSearch] Search results:", results?.length || 0);

          // Normalize the results to handle both PascalCase and camelCase
          const normalizedResults = (results || []).map((v) => ({
            vehicleId: v.VehicleId || v.vehicleId,
            hyoungNo: v.HyoungNo || v.hyoungNo || "",
            vehicleName:
              v.VehicleName || v.vehicleName || v.Name || v.name || "",
            numberPlate:
              v.NumberPlate ||
              v.numberPlate ||
              v.PlateNumber ||
              v.plateNumber ||
              "",
            siteName:
              v.SiteName ||
              v.siteName ||
              v.WorkingSiteName ||
              v.workingSiteName ||
              "",
            vehicleTypeName:
              v.VehicleTypeName ||
              v.vehicleTypeName ||
              v.TypeName ||
              v.typeName ||
              "",
            tankCapacity: v.TankCapacity || v.tankCapacity || 0,
            driverName: v.DriverName || v.driverName || "",
            tagId: v.TagId || v.tagId || v.RfidTag || v.rfidTag || "",
            fuelType: v.FuelType || v.fuelType || "Diesel",
            hasGPSInstalled: v.HasGPSInstalled || v.hasGPSInstalled || false,
          }));

          setFilteredVehicles(normalizedResults);
          setIsSearching(false);
        } catch (error) {
          console.error("[VehicleSearch] Search error:", error.message);
          setSearchError("Search failed. Please try again.");
          setFilteredVehicles([]);
          setIsSearching(false);
        }
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setFilteredVehicles([]);
      setSearchError(null);
    }
  }, [searchQuery]);

  const handleVehicleSelect = useCallback(
    (vehicle) => {
      setSearchQuery("");
      setFilteredVehicles([]);
      onSelectVehicle(vehicle);
    },
    [onSelectVehicle]
  );

  const renderVehicleItem = ({ item }) => {
    const isSelected = selectedVehicle?.vehicleId === item.vehicleId;

    return (
      <TouchableOpacity
        style={[styles.vehicleCard, isSelected && styles.vehicleCardSelected]}
        onPress={() => handleVehicleSelect(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.vehicleIconContainer,
            isSelected && styles.vehicleIconSelected,
          ]}
        >
          <Icon
            name="truck"
            size={18}
            color={isSelected ? "#ffffff" : "#10b981"}
          />
        </View>
        <View style={styles.vehicleInfo}>
          <Text
            style={[
              styles.vehicleHyoung,
              isSelected && styles.vehicleHyoungSelected,
            ]}
          >
            {item.hyoungNo}
          </Text>
          <Text style={styles.vehicleName}>{item.vehicleName}</Text>
          <View style={styles.vehicleMetaRow}>
            <Text style={styles.vehiclePlate}>{item.numberPlate}</Text>
            {item.siteName && (
              <Text style={styles.vehicleSite}>• {item.siteName}</Text>
            )}
          </View>
        </View>
        {item.hasGPSInstalled && (
          <View style={styles.gpsIndicator}>
            <Icon name="satellite-dish" size={12} color="#2563eb" />
          </View>
        )}
        <Icon name="chevron-right" size={14} color="#9ca3af" />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={16}
          color="#6b7280"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by Hyoung No, Plate, or Name..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="times-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Results */}
      <View style={styles.resultsContainer}>
        {isSearching ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Searching vehicles...</Text>
          </View>
        ) : searchError ? (
          <View style={styles.errorContainer}>
            <Icon name="exclamation-circle" size={20} color="#ef4444" />
            <Text style={styles.errorText}>{searchError}</Text>
          </View>
        ) : searchQuery.length > 0 && searchQuery.length < 2 ? (
          <View style={styles.hintContainer}>
            <Icon name="info-circle" size={16} color="#9ca3af" />
            <Text style={styles.hintText}>
              Enter at least 2 characters to search
            </Text>
          </View>
        ) : filteredVehicles.length > 0 ? (
          <FlatList
            data={filteredVehicles}
            keyExtractor={(item) => item.vehicleId?.toString()}
            renderItem={renderVehicleItem}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          />
        ) : searchQuery.length >= 2 ? (
          <View style={styles.emptyContainer}>
            <Icon name="truck" size={32} color="#d1d5db" />
            <Text style={styles.emptyText}>No vehicles found</Text>
          </View>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginHorizontal: 16,
    marginVertical: 12,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1f2937",
    paddingVertical: 14,
  },
  resultsContainer: {
    flex: 1,
    paddingHorizontal: 16,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  loadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  errorText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#ef4444",
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  hintText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#9ca3af",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 32,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#9ca3af",
  },
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  vehicleCardSelected: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  vehicleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleIconSelected: {
    backgroundColor: "#10b981",
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 12,
  },
  vehicleHyoung: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  vehicleHyoungSelected: {
    color: "#059669",
  },
  vehicleName: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  vehicleMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  vehiclePlate: {
    fontSize: 12,
    color: "#9ca3af",
  },
  vehicleSite: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 4,
  },
  gpsIndicator: {
    backgroundColor: "#eff6ff",
    padding: 6,
    borderRadius: 6,
    marginRight: 8,
  },
});

export default VehicleSearch;
