import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  ScrollView,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";

// Fallback mock vehicles (used only if API fails)
const FALLBACK_MOCK_VEHICLES = [
  {
    vehicleId: 1,
    hyoungNo: "HY-001",
    vehicleName: "Excavator CAT 320",
    numberPlate: "ABC-1234",
    siteName: "Site A - Doha",
    vehicleTypeName: "Excavator",
    tankCapacity: 400,
    driverName: "Ahmed Hassan",
    tagId: "RFID-001-A1B2C3",
  },
  {
    vehicleId: 2,
    hyoungNo: "HY-002",
    vehicleName: "Dump Truck Volvo",
    numberPlate: "DEF-5678",
    siteName: "Site A - Doha",
    vehicleTypeName: "Dump Truck",
    tankCapacity: 300,
    driverName: "Mohammed Ali",
    tagId: "RFID-002-D4E5F6",
  },
  {
    vehicleId: 3,
    hyoungNo: "HY-003",
    vehicleName: "Loader Komatsu",
    numberPlate: "GHI-9012",
    siteName: "Site B - Lusail",
    vehicleTypeName: "Loader",
    tankCapacity: 250,
    driverName: "Omar Khalid",
    tagId: "RFID-003-G7H8I9",
  },
  {
    vehicleId: 4,
    hyoungNo: "HY-004",
    vehicleName: "Crane Liebherr",
    numberPlate: "JKL-3456",
    siteName: "Site A - Doha",
    vehicleTypeName: "Crane",
    tankCapacity: 500,
    driverName: "Yusuf Ibrahim",
    tagId: "RFID-004-J0K1L2",
  },
  {
    vehicleId: 5,
    hyoungNo: "HY-005",
    vehicleName: "Bulldozer CAT D8",
    numberPlate: "MNO-7890",
    siteName: "Site C - Al Wakra",
    vehicleTypeName: "Bulldozer",
    tankCapacity: 450,
    driverName: "Samir Nasser",
    tagId: "RFID-005-M3N4O5",
  },
];

// Mock fueling rules data
const getMockFuelingRules = (vehicleId) => {
  const rules = {
    1: {
      dailyLimit: 200,
      monthlyLimit: 4000,
      usedToday: 50,
      usedThisMonth: 1200,
      maxRefillsPerDay: 2,
      refillsToday: 0,
      lastRefillDate: "2024-12-18",
      lastRefillAmount: 150,
      allowedTimeWindow: "06:00 - 22:00",
    },
    2: {
      dailyLimit: 250,
      monthlyLimit: 5000,
      usedToday: 100,
      usedThisMonth: 2500,
      maxRefillsPerDay: 3,
      refillsToday: 1,
      lastRefillDate: "2024-12-19",
      lastRefillAmount: 100,
      allowedTimeWindow: "24 Hours",
    },
    3: {
      dailyLimit: 150,
      monthlyLimit: 3000,
      usedToday: 0,
      usedThisMonth: 800,
      maxRefillsPerDay: 2,
      refillsToday: 0,
      lastRefillDate: "2024-12-17",
      lastRefillAmount: 120,
      allowedTimeWindow: "06:00 - 20:00",
    },
    4: {
      dailyLimit: 300,
      monthlyLimit: 6000,
      usedToday: 200,
      usedThisMonth: 4500,
      maxRefillsPerDay: 2,
      refillsToday: 1,
      lastRefillDate: "2024-12-19",
      lastRefillAmount: 200,
      allowedTimeWindow: "24 Hours",
    },
    5: {
      dailyLimit: 280,
      monthlyLimit: 5500,
      usedToday: 0,
      usedThisMonth: 1800,
      maxRefillsPerDay: 3,
      refillsToday: 0,
      lastRefillDate: "2024-12-16",
      lastRefillAmount: 250,
      allowedTimeWindow: "05:00 - 23:00",
    },
  };
  return rules[vehicleId] || rules[1];
};

const VehicleSelectionStep = ({
  selectedVehicle,
  fuelingRules,
  onSelectVehicle,
  onNext,
  onBack,
}) => {
  // Selection mode: 'none' | 'rfid' | 'manual'
  const [selectionMode, setSelectionMode] = useState("none");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTagId, setScannedTagId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showVehicleConfirmation, setShowVehicleConfirmation] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState(null);
  const [pendingRules, setPendingRules] = useState(null);
  const [searchError, setSearchError] = useState(null);

  // Search vehicles using real API (minimum 2 characters)
  useEffect(() => {
    if (searchQuery.length >= 2) {
      setIsSearching(true);
      setSearchError(null);

      // Debounce API call
      const timer = setTimeout(async () => {
        try {
          console.log("[VehicleSelection] Searching for:", searchQuery);
          const results = await ApiService.searchVehicles(searchQuery, 10);
          console.log(
            "[VehicleSelection] Search results:",
            results?.length || 0
          );

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
          }));

          setFilteredVehicles(normalizedResults);
          setIsSearching(false);
        } catch (error) {
          console.error("[VehicleSelection] Search error:", error.message);
          setSearchError("Search failed. Using offline data.");

          // Fallback to mock data on error
          const query = searchQuery.toLowerCase();
          const filtered = FALLBACK_MOCK_VEHICLES.filter(
            (v) =>
              v.hyoungNo.toLowerCase().includes(query) ||
              v.vehicleName.toLowerCase().includes(query) ||
              v.numberPlate.toLowerCase().includes(query)
          );
          setFilteredVehicles(filtered);
          setIsSearching(false);
        }
      }, 400); // Slightly longer debounce for API calls

      return () => clearTimeout(timer);
    } else {
      setFilteredVehicles([]);
      setSearchError(null);
    }
  }, [searchQuery]);

  // Handle RFID scan simulation
  // Note: In production, this would integrate with actual RFID hardware
  const handleStartScan = () => {
    setSelectionMode("rfid");
    setIsScanning(true);

    // Simulate RFID scan after 2 seconds (replace with actual RFID integration)
    setTimeout(() => {
      const randomVehicle =
        FALLBACK_MOCK_VEHICLES[
          Math.floor(Math.random() * FALLBACK_MOCK_VEHICLES.length)
        ];
      setScannedTagId(randomVehicle.tagId);
      setIsScanning(false);

      // Show the scanned tag and wait for user confirmation
      setPendingVehicle(randomVehicle);
      setPendingRules(getMockFuelingRules(randomVehicle.vehicleId));
      setShowVehicleConfirmation(true);
    }, 2000);
  };

  const handleCancelScan = () => {
    setIsScanning(false);
    setScannedTagId("");
    setSelectionMode("none");
  };

  const handleSelectManualMode = () => {
    setSelectionMode("manual");
    setScannedTagId("");
    setIsScanning(false);
    setShowVehicleConfirmation(false);
    setPendingVehicle(null);
    setPendingRules(null);
  };

  const handleSelectRfidMode = () => {
    setSelectionMode("rfid");
    setSearchQuery("");
    setFilteredVehicles([]);
  };

  // Generate default fueling rules for a vehicle
  // TODO: In production, these rules should come from the backend
  const getDefaultFuelingRules = (vehicle) => {
    const tankCapacity = vehicle.tankCapacity || 300;
    return {
      dailyLimit: Math.round(tankCapacity * 0.8),
      monthlyLimit: Math.round(tankCapacity * 20),
      usedToday: 0,
      usedThisMonth: 0,
      maxRefillsPerDay: 3,
      refillsToday: 0,
      lastRefillDate: null,
      lastRefillAmount: 0,
      allowedTimeWindow: "24 Hours",
    };
  };

  const handleVehicleSelect = (vehicle) => {
    // Use vehicle-specific rules if available from mock, otherwise generate defaults
    const rules =
      getMockFuelingRules(vehicle.vehicleId) || getDefaultFuelingRules(vehicle);
    setPendingVehicle(vehicle);
    setPendingRules(rules);
    setShowVehicleConfirmation(true);
  };

  const handleConfirmVehicle = () => {
    if (pendingVehicle && pendingRules) {
      onSelectVehicle(pendingVehicle, pendingRules);
      // Auto-proceed after confirmation
      setTimeout(() => onNext(), 150);
    }
  };

  const handleRejectVehicle = () => {
    setShowVehicleConfirmation(false);
    setPendingVehicle(null);
    setPendingRules(null);
    setScannedTagId("");
    if (selectionMode === "rfid") {
      setSelectionMode("none");
    }
  };

  // Render mode selection cards
  const renderModeSelection = () => (
    <View style={styles.modeContainer}>
      {/* RFID Scan Mode Card */}
      <TouchableOpacity
        style={[
          styles.modeCard,
          selectionMode === "rfid" && styles.modeCardActive,
          selectionMode === "manual" && styles.modeCardDisabled,
        ]}
        onPress={handleSelectRfidMode}
        disabled={selectionMode === "manual"}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.modeIconContainer,
            {
              backgroundColor:
                selectionMode === "rfid" ? "#2563eb" : "#2563eb15",
            },
          ]}
        >
          <Icon
            name="wifi"
            size={22}
            color={selectionMode === "rfid" ? "#ffffff" : "#2563eb"}
          />
        </View>
        <View style={styles.modeInfo}>
          <Text
            style={[
              styles.modeName,
              selectionMode === "rfid" && styles.modeNameActive,
              selectionMode === "manual" && styles.modeNameDisabled,
            ]}
          >
            Scan RFID Tag
          </Text>
          <Text
            style={[
              styles.modeDescription,
              selectionMode === "manual" && styles.modeDescriptionDisabled,
            ]}
          >
            Hold vehicle tag near device
          </Text>
        </View>
        {selectionMode === "manual" ? (
          <Icon name="ban" size={16} color="#d1d5db" />
        ) : (
          <Icon
            name="chevron-right"
            size={16}
            color={selectionMode === "rfid" ? "#2563eb" : "#9ca3af"}
          />
        )}
      </TouchableOpacity>

      {/* Manual Selection Mode Card */}
      <TouchableOpacity
        style={[
          styles.modeCard,
          selectionMode === "manual" && styles.modeCardActiveGreen,
          selectionMode === "rfid" && styles.modeCardDisabled,
        ]}
        onPress={handleSelectManualMode}
        disabled={selectionMode === "rfid" && isScanning}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.modeIconContainer,
            {
              backgroundColor:
                selectionMode === "manual" ? "#10b981" : "#10b98115",
            },
          ]}
        >
          <Icon
            name="search"
            size={22}
            color={selectionMode === "manual" ? "#ffffff" : "#10b981"}
          />
        </View>
        <View style={styles.modeInfo}>
          <Text
            style={[
              styles.modeName,
              selectionMode === "manual" && styles.modeNameActiveGreen,
              selectionMode === "rfid" && styles.modeNameDisabled,
            ]}
          >
            Search & Select
          </Text>
          <Text
            style={[
              styles.modeDescription,
              selectionMode === "rfid" && styles.modeDescriptionDisabled,
            ]}
          >
            Find vehicle by ID or name
          </Text>
        </View>
        {selectionMode === "rfid" ? (
          <Icon name="ban" size={16} color="#d1d5db" />
        ) : (
          <Icon
            name="chevron-right"
            size={16}
            color={selectionMode === "manual" ? "#10b981" : "#9ca3af"}
          />
        )}
      </TouchableOpacity>
    </View>
  );

  // Render RFID scanning interface
  const renderRfidSection = () => {
    if (selectionMode !== "rfid") return null;

    return (
      <View style={styles.rfidSection}>
        {isScanning ? (
          <View style={styles.scanningContainer}>
            <View style={styles.scanningAnimation}>
              <ActivityIndicator size="large" color="#2563eb" />
            </View>
            <Text style={styles.scanningTitle}>Scanning for RFID Tag...</Text>
            <Text style={styles.scanningSubtitle}>
              Hold the vehicle tag near the device
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelScan}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.startScanContainer}>
            <TouchableOpacity
              style={styles.startScanButton}
              onPress={handleStartScan}
            >
              <Icon name="wifi" size={32} color="#2563eb" />
              <Text style={styles.startScanText}>Tap to Start Scanning</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.switchModeLink}
              onPress={() => setSelectionMode("none")}
            >
              <Icon name="arrow-left" size={12} color="#6b7280" />
              <Text style={styles.switchModeLinkText}>
                Choose different method
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    );
  };

  // Render manual search interface
  const renderManualSection = () => {
    if (selectionMode !== "manual") return null;

    return (
      <View style={styles.manualSection}>
        {/* Search Input */}
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={16}
            color="#9ca3af"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search by Hyoung No, Plate, Name..."
            placeholderTextColor="#9ca3af"
            autoFocus
          />
          {searchQuery ? (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Icon name="times-circle" size={16} color="#9ca3af" />
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Search Results */}
        <View style={styles.resultsContainer}>
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#10b981" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : searchQuery.length < 2 ? (
            <View style={styles.hintContainer}>
              <Icon name="info-circle" size={18} color="#9ca3af" />
              <Text style={styles.hintText}>
                Enter at least 2 characters to search vehicles
              </Text>
            </View>
          ) : filteredVehicles.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Icon name="search" size={24} color="#d1d5db" />
              <Text style={styles.emptyText}>No vehicles found</Text>
            </View>
          ) : (
            <FlatList
              data={filteredVehicles}
              keyExtractor={(item) => item.vehicleId.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.vehicleCard}
                  onPress={() => handleVehicleSelect(item)}
                  activeOpacity={0.7}
                >
                  <View style={styles.vehicleIconContainer}>
                    <Icon name="truck" size={20} color="#10b981" />
                  </View>
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleHyoung}>{item.hyoungNo}</Text>
                    <Text style={styles.vehicleName}>{item.vehicleName}</Text>
                    <Text style={styles.vehicleSite}>{item.siteName}</Text>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.switchModeLink}
          onPress={() => setSelectionMode("none")}
        >
          <Icon name="arrow-left" size={12} color="#6b7280" />
          <Text style={styles.switchModeLinkText}>Choose different method</Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Render vehicle confirmation modal
  const renderVehicleConfirmation = () => {
    if (!showVehicleConfirmation || !pendingVehicle || !pendingRules)
      return null;

    const remainingDaily = pendingRules.dailyLimit - pendingRules.usedToday;
    const remainingMonthly =
      pendingRules.monthlyLimit - pendingRules.usedThisMonth;
    const remainingRefills =
      pendingRules.maxRefillsPerDay - pendingRules.refillsToday;

    return (
      <ScrollView style={styles.confirmationContainer}>
        {/* Scanned Tag Info (for RFID mode) */}
        {selectionMode === "rfid" && scannedTagId && (
          <View style={styles.tagInfoCard}>
            <Icon name="wifi" size={16} color="#2563eb" />
            <Text style={styles.tagInfoText}>
              Tag ID: <Text style={styles.tagIdText}>{scannedTagId}</Text>
            </Text>
          </View>
        )}

        {/* Vehicle Info Card */}
        <View style={styles.vehicleConfirmCard}>
          <View style={styles.vehicleConfirmHeader}>
            <View style={styles.vehicleConfirmIcon}>
              <Icon name="truck" size={24} color="#1f2937" />
            </View>
            <View style={styles.vehicleConfirmInfo}>
              <Text style={styles.vehicleConfirmHyoung}>
                {pendingVehicle.hyoungNo}
              </Text>
              <Text style={styles.vehicleConfirmName}>
                {pendingVehicle.vehicleName}
              </Text>
            </View>
          </View>

          <View style={styles.vehicleDetailsGrid}>
            <View style={styles.vehicleDetailItem}>
              <Icon name="id-card" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Plate</Text>
              <Text style={styles.vehicleDetailValue}>
                {pendingVehicle.numberPlate}
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Icon name="gas-pump" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Tank</Text>
              <Text style={styles.vehicleDetailValue}>
                {pendingVehicle.tankCapacity} L
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Icon name="user" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Driver</Text>
              <Text style={styles.vehicleDetailValue}>
                {pendingVehicle.driverName}
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Icon name="map-marker-alt" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Site</Text>
              <Text style={styles.vehicleDetailValue}>
                {pendingVehicle.siteName}
              </Text>
            </View>
          </View>
        </View>

        {/* Fueling Rules Card */}
        <View style={styles.rulesCard}>
          <Text style={styles.rulesTitle}>
            <Icon name="clipboard-list" size={14} color="#6366f1" /> Fueling
            Rules
          </Text>

          <View style={styles.rulesGrid}>
            {/* Daily Limit */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Daily Remaining</Text>
              <Text
                style={[
                  styles.ruleValue,
                  remainingDaily < 50 && styles.ruleValueWarning,
                ]}
              >
                {remainingDaily.toLocaleString()} L
              </Text>
              <Text style={styles.ruleSubtext}>
                of {pendingRules.dailyLimit.toLocaleString()} L limit
              </Text>
            </View>

            {/* Monthly Limit */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Monthly Remaining</Text>
              <Text
                style={[
                  styles.ruleValue,
                  remainingMonthly < 500 && styles.ruleValueWarning,
                ]}
              >
                {remainingMonthly.toLocaleString()} L
              </Text>
              <Text style={styles.ruleSubtext}>
                of {pendingRules.monthlyLimit.toLocaleString()} L limit
              </Text>
            </View>

            {/* Refills Today */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Refills Available</Text>
              <Text
                style={[
                  styles.ruleValue,
                  remainingRefills === 0 && styles.ruleValueDanger,
                ]}
              >
                {remainingRefills}
              </Text>
              <Text style={styles.ruleSubtext}>
                of {pendingRules.maxRefillsPerDay} per day
              </Text>
            </View>

            {/* Time Window */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Allowed Time</Text>
              <Text style={styles.ruleValue}>
                {pendingRules.allowedTimeWindow}
              </Text>
            </View>
          </View>

          {/* Last Refill Info */}
          <View style={styles.lastRefillInfo}>
            <Icon name="history" size={14} color="#6b7280" />
            <Text style={styles.lastRefillText}>
              Last refill: {pendingRules.lastRefillAmount} L on{" "}
              {pendingRules.lastRefillDate}
            </Text>
          </View>
        </View>

        {/* Confirmation Buttons */}
        <View style={styles.confirmationButtons}>
          <TouchableOpacity
            style={styles.rejectButton}
            onPress={handleRejectVehicle}
          >
            <Icon name="times" size={16} color="#ef4444" />
            <Text style={styles.rejectButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.confirmButton}
            onPress={handleConfirmVehicle}
          >
            <Icon name="check" size={16} color="white" />
            <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Select Vehicle</Text>
        <Text style={styles.stepDescription}>
          {showVehicleConfirmation
            ? "Confirm vehicle details"
            : selectionMode === "none"
            ? "Choose how to identify the vehicle"
            : selectionMode === "rfid"
            ? "Scan the vehicle's RFID tag"
            : "Search and select vehicle"}
        </Text>
      </View>

      {/* Content */}
      {showVehicleConfirmation ? (
        renderVehicleConfirmation()
      ) : (
        <View style={styles.content}>
          {selectionMode === "none" && renderModeSelection()}
          {renderRfidSection()}
          {renderManualSection()}
        </View>
      )}

      {/* Footer - only show when not in confirmation */}
      {!showVehicleConfirmation && (
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Icon name="arrow-left" size={16} color="#6b7280" />
            <Text style={styles.backButtonText}>Back</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    padding: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  stepDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  content: {
    flex: 1,
  },
  modeContainer: {
    padding: 16,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
  },
  modeCardActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  modeCardActiveGreen: {
    borderColor: "#10b981",
    backgroundColor: "#ecfdf5",
  },
  modeCardDisabled: {
    opacity: 0.5,
    backgroundColor: "#f9fafb",
  },
  modeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  modeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  modeNameActive: {
    color: "#2563eb",
  },
  modeNameActiveGreen: {
    color: "#10b981",
  },
  modeNameDisabled: {
    color: "#9ca3af",
  },
  modeDescription: {
    fontSize: 13,
    color: "#6b7280",
  },
  modeDescriptionDisabled: {
    color: "#d1d5db",
  },
  rfidSection: {
    flex: 1,
    padding: 16,
  },
  scanningContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  scanningAnimation: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  scanningTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  scanningSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 24,
  },
  cancelButton: {
    paddingVertical: 10,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  cancelButtonText: {
    fontSize: 14,
    color: "#6b7280",
    fontWeight: "500",
  },
  startScanContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  startScanButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#eff6ff",
    borderWidth: 3,
    borderColor: "#bfdbfe",
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  startScanText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2563eb",
    marginTop: 12,
    textAlign: "center",
  },
  switchModeLink: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  switchModeLinkText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  manualSection: {
    flex: 1,
    padding: 16,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10b981",
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
    marginTop: 12,
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
  hintContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingHorizontal: 16,
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
  vehicleIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
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
  vehicleName: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  vehicleSite: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  confirmationContainer: {
    flex: 1,
    padding: 16,
  },
  tagInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  tagInfoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#1e40af",
  },
  tagIdText: {
    fontWeight: "700",
    fontFamily: "monospace",
  },
  vehicleConfirmCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  vehicleConfirmHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  vehicleConfirmIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleConfirmInfo: {
    flex: 1,
    marginLeft: 14,
  },
  vehicleConfirmHyoung: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  vehicleConfirmName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  vehicleDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  vehicleDetailItem: {
    width: "50%",
    paddingVertical: 8,
    paddingRight: 8,
  },
  vehicleDetailLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
    textTransform: "uppercase",
  },
  vehicleDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
  },
  rulesCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rulesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6366f1",
    marginBottom: 16,
  },
  rulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ruleItem: {
    width: "50%",
    paddingVertical: 8,
    paddingRight: 8,
  },
  ruleLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  ruleValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
    marginTop: 2,
  },
  ruleValueWarning: {
    color: "#f59e0b",
  },
  ruleValueDanger: {
    color: "#ef4444",
  },
  ruleSubtext: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  lastRefillInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  lastRefillText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6b7280",
  },
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 24,
  },
  rejectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  rejectButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#ef4444",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#10b981",
  },
  confirmButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  backButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  backButtonText: {
    fontSize: 15,
    color: "#6b7280",
    marginLeft: 8,
  },
});

export default VehicleSelectionStep;
