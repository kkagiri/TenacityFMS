import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";
import pumpControlService from "../../services/pumpControlService";
import VehicleConfirmationStep from "./VehicleConfirmationStep";

/**
 * Extract time window from applied rule sets
 * Parses strings like "TimeWindow: 04:00-19:00" from rulesApplied arrays
 * @param {Array} appliedRuleSets - Array of applied rule sets
 * @returns {Object} - { timeWindowStart, timeWindowEnd }
 */
const extractTimeWindowFromRuleSets = (appliedRuleSets) => {
  if (!appliedRuleSets || !Array.isArray(appliedRuleSets)) {
    return { timeWindowStart: null, timeWindowEnd: null };
  }

  for (const ruleSet of appliedRuleSets) {
    const rulesApplied = ruleSet.rulesApplied || [];
    for (const rule of rulesApplied) {
      // Match patterns like "TimeWindow: 04:00-19:00" or "Time Window: 04:00-19:00"
      const timeWindowMatch = rule.match(
        /Time\s*Window:\s*(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/i
      );
      if (timeWindowMatch) {
        return {
          timeWindowStart: timeWindowMatch[1],
          timeWindowEnd: timeWindowMatch[2],
        };
      }
    }
  }

  return { timeWindowStart: null, timeWindowEnd: null };
};

/**
 * Parse limiting factor from API message
 * Extracts factor from messages like "limited by HardLimit" or "limited by DailyLimit"
 * @param {string} message - API response message
 * @returns {string} - Limiting factor name
 */
const parseLimitingFactorFromMessage = (message) => {
  if (!message) return "None";
  const match = message.match(/limited by\s+(\w+)/i);
  return match ? match[1] : "None";
};

/**
 * Convert API effective rules response to fueling rules format for display
 * @param {Object} apiResponse - Response from getVehicleEffectiveRules
 * @returns {Object} - Formatted fueling rules object for UI display
 */
export const convertApiResponseToRules = (apiResponse) => {
  console.log(
    "[VehicleSelection] Converting API response to rules:",
    JSON.stringify(apiResponse, null, 2)
  );

  if (!apiResponse) {
    console.warn("[VehicleSelection] API response is null/undefined");
    return null;
  }

  // Extract data from FMSResponse wrapper
  const data = apiResponse.data || apiResponse;

  // Extract time windows from applied rule sets if not directly provided
  const { timeWindowStart, timeWindowEnd } = extractTimeWindowFromRuleSets(
    data.appliedRuleSets
  );

  // Parse limiting factor from message if not provided
  const limitingFactor =
    data.limitingFactor || parseLimitingFactorFromMessage(data.message);

  // Determine hardLimit - use maxFuelAllowed when limited by HardLimit
  let hardLimit = data.hardLimit || 0;
  let tankCapacity = data.tankCapacity || 0;

  // If hardLimit is 0 but we have maxFuelAllowed and it's limited by HardLimit,
  // use maxFuelAllowed as the hardLimit
  if (
    hardLimit === 0 &&
    data.maxFuelAllowed > 0 &&
    limitingFactor.toLowerCase() === "hardlimit"
  ) {
    hardLimit = data.maxFuelAllowed;
    // If tankCapacity is also 0, use hardLimit as an approximation
    if (tankCapacity === 0) {
      tankCapacity = hardLimit;
    }
  }

  return {
    // Hard Limits (Physics-based)
    tankCapacity: tankCapacity,
    currentFuelLevel: data.currentFuelLevel,
    hasGpsFuelSensor: data.hasGpsFuelSensor || false,
    hardLimit: hardLimit,

    // Soft Limits (Rule-based)
    dailyLimit: data.dailyLimit || 0,
    monthlyLimit: data.monthlyLimit || 0,
    perTransactionLimit: data.perTransactionLimit,
    usedToday: data.dailyUsed || data.fuelUsedToday || 0,
    usedThisMonth: data.monthlyUsed || data.fuelUsedThisMonth || 0,
    dailyRemaining: data.dailyRemaining || 0,
    monthlyRemaining: data.monthlyRemaining || 0,

    // Max allowed considering all limits
    maxAllowedDose: data.maxFuelAllowed || 0,
    limitingFactor: limitingFactor,

    // Status
    hasRules: data.hasRules || false,
    isValid: data.isAllowed !== false,
    isAllowed: data.isAllowed !== false,
    message: data.message || "",
    blockedReason: data.blockedReason,

    // Time window - use extracted values if not directly provided
    timeWindowStart: data.timeWindowStart || timeWindowStart,
    timeWindowEnd: data.timeWindowEnd || timeWindowEnd,

    // Refill counts
    maxRefillsPerDay: data.maxRefillsPerDay || null,
    refillsToday: data.refillsToday || 0,
    refillsRemainingToday: data.refillsRemainingToday,

    // Applied rules (for debugging/display)
    appliedRuleSets: data.appliedRuleSets || [],
  };
};

/**
 * VehicleSelectionStep - Allows user to select a vehicle via RFID scan or manual search
 */
const VehicleSelectionStep = ({
  selectedVehicle,
  fuelingRules,
  onSelectVehicle,
  onNext,
  onBack,
  enableFuelRulesCheck = true,
}) => {
  // Selection mode: 'none' | 'rfid' | 'manual'
  const [selectionMode, setSelectionMode] = useState("none");
  const [isScanning, setIsScanning] = useState(false);
  const [scannedTagId, setScannedTagId] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [pendingVehicle, setPendingVehicle] = useState(null);
  const [pendingRules, setPendingRules] = useState(null);
  const [searchError, setSearchError] = useState(null);
  const [isCheckingRules, setIsCheckingRules] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

  // Track keyboard visibility for compact mode
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

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
          setSearchError(
            "Search failed. Please check your connection and try again."
          );
          setFilteredVehicles([]);
          setIsSearching(false);
        }
      }, 400); // Slightly longer debounce for API calls

      return () => clearTimeout(timer);
    } else {
      setFilteredVehicles([]);
      setSearchError(null);
    }
  }, [searchQuery]);

  // Handle RFID scan start
  // Note: Actual RFID tag detection is handled by the parent component via deviceId prop
  // This component should receive scanned tag via props and validate it
  const handleStartScan = () => {
    setSelectionMode("rfid");
    setIsScanning(true);

    // Show scanning UI - parent component handles actual tag detection via SignalR
    // When a tag is detected, parent should call onTagScanned callback
    console.log(
      "[VehicleSelection] RFID scanning started - waiting for tag from device..."
    );

    // Note: In the real flow, the ScanStep component handles tag detection
    // and this component is used for manual vehicle selection
    // If using direct RFID in this component, integrate with device hook here
  };

  // Handle scanned tag - validate and get vehicle info
  const handleTagScanned = async (tagId) => {
    if (!tagId) return;

    setScannedTagId(tagId);
    console.log("[VehicleSelection] Tag scanned:", tagId);

    try {
      // Validate tag and get associated vehicle from API
      const tagDetails = await pumpControlService.getTagDetails(tagId);

      if (tagDetails && tagDetails.vehicleId) {
        // Get vehicle fueling rules
        const rulesCheck = await pumpControlService.checkVehicleFuelingRules(
          tagDetails.vehicleId
        );
        const rules = convertApiResponseToRules(rulesCheck);

        const vehicle = {
          vehicleId: tagDetails.vehicleId,
          hyoungNo: tagDetails.hyoungNo || "",
          vehicleName: tagDetails.vehicleName || "",
          numberPlate: tagDetails.numberPlate || "",
          tagId: tagId,
        };

        setPendingVehicle(vehicle);
        setPendingRules(rules || { noRulesConfigured: true });
        setShowConfirmation(true);
      } else {
        Alert.alert(
          "Tag Not Recognized",
          `Tag "${tagId}" is not associated with any vehicle.`
        );
      }
    } catch (error) {
      console.error("[VehicleSelection] Tag validation error:", error.message);
      Alert.alert("Error", `Failed to validate tag: ${error.message}`);
    } finally {
      setIsScanning(false);
    }
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
    setShowConfirmation(false);
    setPendingVehicle(null);
    setPendingRules(null);
  };

  const handleSelectRfidMode = () => {
    setSelectionMode("rfid");
    setSearchQuery("");
    setFilteredVehicles([]);
  };

  const handleVehicleSelect = async (vehicle) => {
    setIsCheckingRules(true);

    try {
      // Fetch fueling rules from real API
      console.log(
        "[VehicleSelection] Fetching fueling rules for vehicle:",
        vehicle.vehicleId
      );
      const rulesCheck = await pumpControlService.checkVehicleFuelingRules(
        vehicle.vehicleId
      );
      console.log(
        "[VehicleSelection] API response:",
        JSON.stringify(rulesCheck, null, 2)
      );

      // Convert API response to rules format for display
      const rules = convertApiResponseToRules(rulesCheck);

      if (!rules) {
        // API didn't return valid data - show error
        Alert.alert(
          "Error",
          "Unable to fetch fueling rules for this vehicle. Please try again."
        );
        setIsCheckingRules(false);
        return;
      }

      // Check if fuel rules check is enabled and vehicle has no rules
      if (enableFuelRulesCheck && !rules.hasRules) {
        console.log("[VehicleSelection] Vehicle has no rules - showing alert");
        // Vehicle has no rules - show simple alert
        Alert.alert(
          "No Fuel Rules Configured",
          "This vehicle has no fuel rules configured. Please contact your administrator to set up fueling rules for this vehicle.",
          [{ text: "OK", style: "cancel" }]
        );
        setIsCheckingRules(false);
        return;
      }

      // Check if fueling is blocked
      if (!rules.isAllowed && rules.blockedReason) {
        Alert.alert(
          "Fueling Not Allowed",
          rules.blockedReason ||
            rules.message ||
            "Fueling is not permitted at this time.",
          [{ text: "OK", style: "cancel" }]
        );
        setIsCheckingRules(false);
        return;
      }

      console.log("[VehicleSelection] Converted rules:", rules);
      setPendingVehicle(vehicle);
      setPendingRules(rules);
      setShowConfirmation(true);
    } catch (error) {
      console.error(
        "[VehicleSelection] Failed to fetch fueling rules:",
        error.message
      );

      // Show error to user
      Alert.alert(
        "Connection Error",
        `Failed to fetch fueling rules: ${error.message}. Please check your connection and try again.`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Retry",
            onPress: () => handleVehicleSelect(vehicle),
          },
        ]
      );
    } finally {
      setIsCheckingRules(false);
    }
  };

  const handleConfirmVehicle = () => {
    if (pendingVehicle && pendingRules) {
      onSelectVehicle(pendingVehicle, pendingRules);
      setTimeout(() => onNext(), 150);
    }
  };

  const handleRejectVehicle = () => {
    setShowConfirmation(false);
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
      <KeyboardAvoidingView
        style={styles.manualSection}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 180 : 100}
      >
        {/* Search Input - Positioned at top for keyboard visibility */}
        <View style={styles.searchInputWrapper}>
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
              returnKeyType="search"
              blurOnSubmit={false}
            />
            {searchQuery ? (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="times-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            ) : null}
          </View>
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
                  <View style={styles.vehicleInfo}>
                    <Text style={styles.vehicleHyoung}>{item.hyoungNo}</Text>
                    {/* <Text style={styles.vehicleName}>
                      {item.vehicleName} • {item.siteName}
                    </Text> */}
                  </View>
                  <Icon name="chevron-right" size={14} color="#9ca3af" />
                </TouchableOpacity>
              )}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            />
          )}
        </View>

        <TouchableOpacity
          style={styles.switchModeLink}
          onPress={() => {
            Keyboard.dismiss();
            setSelectionMode("none");
          }}
        >
          <Icon name="arrow-left" size={12} color="#6b7280" />
          <Text style={styles.switchModeLinkText}>Choose different method</Text>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    );
  };

  // Show confirmation page if vehicle is selected
  if (showConfirmation && pendingVehicle && pendingRules) {
    return (
      <VehicleConfirmationStep
        vehicle={pendingVehicle}
        rules={pendingRules}
        selectionMode={selectionMode}
        scannedTagId={scannedTagId}
        onConfirm={handleConfirmVehicle}
        onCancel={handleRejectVehicle}
      />
    );
  }

  // Determine if we should use compact mode (keyboard visible in manual mode)
  const isCompactMode = isKeyboardVisible && selectionMode === "manual";

  return (
    <View style={styles.container}>
      {/* Header - Compact when keyboard is visible in manual mode */}
      <View style={[styles.header, isCompactMode && styles.headerCompact]}>
        <Text
          style={[styles.stepTitle, isCompactMode && styles.stepTitleCompact]}
        >
          Select Vehicle
        </Text>
        {!isCompactMode && (
          <Text style={styles.stepDescription}>
            {selectionMode === "none"
              ? "Choose how to identify the vehicle"
              : selectionMode === "rfid"
              ? "Scan the vehicle's RFID tag"
              : "Search and select vehicle"}
          </Text>
        )}
      </View>

      {/* Loading overlay when checking rules */}
      {isCheckingRules && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingCard}>
            <ActivityIndicator size="large" color="#2563eb" />
            <Text style={styles.loadingText}>Checking fueling rules...</Text>
          </View>
        </View>
      )}

      {/* Content */}
      <View style={styles.content}>
        {selectionMode === "none" && renderModeSelection()}
        {renderRfidSection()}
        {renderManualSection()}
      </View>

      {/* Footer - Hidden when keyboard is visible in manual mode */}
      {!isCompactMode && (
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
  headerCompact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  stepTitleCompact: {
    fontSize: 16,
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
  searchInputWrapper: {
    marginBottom: 8,
    paddingTop: 4,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#10b981",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
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
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleHyoung: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  vehicleName: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 1,
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
  // Loading overlay styles for rules check
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loadingCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default VehicleSelectionStep;
