//Cursor - Mobile Scan Step Component
// Allows vehicle selection via lookup, scanning, or manual entry
// Now integrated with useDeviceData hook for real-time RFID tag detection from upload status
import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useDeviceData } from "../../hooks/useDeviceData";
import { pumpControlService } from "../../services/pumpControlService";

/**
 * Convert API effective rules response to fueling rules format for display
 * @param {Object} apiResponse - Response from getVehicleEffectiveRules
 * @returns {Object} - Formatted fueling rules object for UI display
 */
const convertApiResponseToRules = (apiResponse) => {
  if (!apiResponse) return null;

  // Extract data from FMSResponse wrapper
  const data = apiResponse.data || apiResponse;

  return {
    // Hard Limits (Physics-based)
    tankCapacity: data.tankCapacity || 0,
    currentFuelLevel: data.currentFuelLevel,
    hasGpsFuelSensor: data.hasGpsFuelSensor || false,
    hardLimit: data.hardLimit || data.tankCapacity || 0,

    // Soft Limits (Rule-based)
    dailyLimit: data.dailyLimit || 0,
    monthlyLimit: data.monthlyLimit || 0,
    perTransactionLimit: data.perTransactionLimit,
    usedToday: data.fuelUsedToday || 0,
    usedThisMonth: data.fuelUsedThisMonth || 0,
    dailyRemaining: data.dailyRemaining || 0,
    monthlyRemaining: data.monthlyRemaining || 0,

    // Max allowed considering all limits
    maxAllowedDose: data.maxFuelAllowed || 0,
    limitingFactor: data.limitingFactor || "None",

    // Status
    hasRules: data.hasRules || false,
    isValid: data.isAllowed !== false,
    isAllowed: data.isAllowed !== false,
    message: data.message || "",
    blockedReason: data.blockedReason,

    // Time window
    timeWindowStart: data.timeWindowStart,
    timeWindowEnd: data.timeWindowEnd,

    // Refill counts
    maxRefillsPerDay: data.maxRefillsPerDay || null,
    refillsToday: data.refillsToday || 0,
    refillsRemainingToday: data.refillsRemainingToday,

    // Applied rules (for debugging/display)
    appliedRuleSets: data.appliedRuleSets || [],
  };
};

const SELECTION_METHODS = [
  { id: "lookup", label: "Vehicle Lookup", icon: "search" },
  { id: "scan", label: "Scan Tag/QR", icon: "qrcode" },
  { id: "manual", label: "Manual Entry", icon: "keyboard" },
];

const ScanStep = ({
  isScanning,
  scanResult,
  vehicleInfo,
  selectionMethod,
  vehicles = [],
  vehicleReg,
  onScan,
  onVehicleSelect,
  onNext,
  onBack,
  setSelectionMethod,
  setVehicleReg,
  isLoadingVehicles = false,
  deviceId = null, // PTS device ID for tag detection
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [manualReg, setManualReg] = useState("");

  // Real-time tag detection state (local UI state)
  const [isListeningForTags, setIsListeningForTags] = useState(false);
  const [isValidatingTag, setIsValidatingTag] = useState(false);
  const [localDetectedTags, setLocalDetectedTags] = useState([]);
  const [validatedTag, setValidatedTag] = useState(null);

  // Track which tags have been processed to avoid re-validation
  const processedTagsRef = useRef(new Set());

  // Use the device data hook to get real-time tag detection from UploadStatus
  const {
    detectedTags: hookDetectedTags,
    newlyDetectedTags,
    lastDetectedTag: hookLastDetectedTag,
    clearTagHistory,
  } = useDeviceData(deviceId);

  // Listen for new tags from the hook when scanning is active
  useEffect(() => {
    if (!isListeningForTags || !deviceId) return;

    console.log("[ScanStep] Monitoring for RFID tags from device:", deviceId);

    // When new tags are detected, add them to local state
    if (newlyDetectedTags && newlyDetectedTags.length > 0) {
      newlyDetectedTags.forEach((tag) => {
        // Check if we haven't already processed this tag
        if (!processedTagsRef.current.has(tag.tagId)) {
          console.log(
            "[ScanStep] 🏷️ New tag detected:",
            tag.tagId,
            "from:",
            tag.source
          );

          // Add to local detected tags
          setLocalDetectedTags((prev) => {
            const exists = prev.find((t) => t.tagId === tag.tagId);
            if (!exists) {
              return [...prev, tag];
            }
            return prev;
          });

          // Auto-validate the first new tag detected
          if (!validatedTag && !isValidatingTag) {
            handleTagValidation(tag.tagId);
          }

          // Mark as processed
          processedTagsRef.current.add(tag.tagId);
        }
      });
    }
  }, [
    isListeningForTags,
    deviceId,
    newlyDetectedTags,
    validatedTag,
    isValidatingTag,
  ]);

  // Validate detected tag and get vehicle info with fueling rules
  const handleTagValidation = useCallback(
    async (tagId) => {
      if (!tagId || isValidatingTag) return;

      setIsValidatingTag(true);
      console.log("[ScanStep] Validating tag:", tagId);

      try {
        // Call API to validate tag and get associated vehicle
        const tagDetails = await pumpControlService.getTagDetails(tagId);

        if (tagDetails && tagDetails.vehicleId) {
          console.log("[ScanStep] Tag validated, vehicle found:", tagDetails);

          // Build vehicle info from tag details
          const vehicleFromTag = {
            vehicleId: tagDetails.vehicleId,
            vehicleCode: tagDetails.vehicleCode || "",
            vehicleName: tagDetails.vehicleName || "",
            numberPlate: tagDetails.numberPlate || "",
            tankCapacity: tagDetails.tankCapacity || 0,
            tagId: tagId,
            tagDetails: tagDetails,
          };

          // Also fetch fueling rules for this vehicle
          console.log(
            "[ScanStep] Fetching fueling rules for vehicle:",
            vehicleFromTag.vehicleId
          );
          try {
            const rulesCheck =
              await pumpControlService.checkVehicleFuelingRules(
                vehicleFromTag.vehicleId
              );
            console.log(
              "[ScanStep] Fueling rules response:",
              JSON.stringify(rulesCheck, null, 2)
            );

            const rules = convertApiResponseToRules(rulesCheck);

            // Check if vehicle has no rules configured
            if (rules && !rules.hasRules) {
              console.log("[ScanStep] Vehicle has no rules - showing alert");
              setIsListeningForTags(false);
              Alert.alert(
                "No Fuel Rules Configured",
                "This vehicle has no fuel rules configured. Please contact your administrator to set up fueling rules for this vehicle.",
                [{ text: "OK" }]
              );
              setIsValidatingTag(false);
              return;
            }

            // Check if fueling is blocked
            if (rules && !rules.isAllowed && rules.blockedReason) {
              setIsListeningForTags(false);
              Alert.alert(
                "Fueling Not Allowed",
                rules.blockedReason ||
                  rules.message ||
                  "Fueling is not permitted at this time.",
                [{ text: "OK" }]
              );
              setIsValidatingTag(false);
              return;
            }

            // Stop listening and pass vehicle with rules to parent
            setIsListeningForTags(false);
            onVehicleSelect(vehicleFromTag, rules);
          } catch (rulesError) {
            console.error(
              "[ScanStep] Failed to fetch fueling rules:",
              rulesError.message
            );
            // Still allow selection but without rules
            setIsListeningForTags(false);
            Alert.alert(
              "Warning",
              "Could not fetch fueling rules for this vehicle. Please verify fuel limits manually.",
              [
                { text: "Cancel", style: "cancel" },
                {
                  text: "Continue Anyway",
                  onPress: () => onVehicleSelect(vehicleFromTag, null),
                },
              ]
            );
          }
        } else {
          console.log("[ScanStep] Tag not associated with vehicle:", tagId);
          Alert.alert(
            "Tag Not Recognized",
            `Tag "${tagId}" is not associated with any vehicle. Please try another tag or select vehicle manually.`,
            [{ text: "OK" }]
          );
        }
      } catch (error) {
        console.error("[ScanStep] Tag validation error:", error.message);
        Alert.alert(
          "Validation Error",
          `Could not validate tag: ${error.message}. Please try again or select vehicle manually.`,
          [{ text: "OK" }]
        );
      } finally {
        setIsValidatingTag(false);
      }
    },
    [isValidatingTag, onVehicleSelect]
  );

  // Start/stop tag listening - now uses the hook's tag detection
  const startTagListening = useCallback(() => {
    // Clear local state
    setLocalDetectedTags([]);
    setValidatedTag(null);
    processedTagsRef.current.clear();

    // Clear hook's tag history so all tags appear as "new"
    if (clearTagHistory) {
      clearTagHistory();
    }

    // Enable listening
    setIsListeningForTags(true);
    console.log("[ScanStep] 🔊 Started listening for RFID tags");
    onScan(); // Notify parent that scanning started
  }, [onScan, clearTagHistory]);

  const stopTagListening = useCallback(() => {
    setIsListeningForTags(false);
    console.log("[ScanStep] 🔇 Stopped listening for RFID tags");
  }, []);

  // Filter vehicles based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(vehicles.slice(0, 20)); // Show first 20 by default
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = vehicles
      .filter(
        (v) =>
          (v.numberPlate || "").toLowerCase().includes(query) ||
          (v.vehicleCode || "").toLowerCase().includes(query) ||
          (v.make || "").toLowerCase().includes(query) ||
          (v.model || "").toLowerCase().includes(query)
      )
      .slice(0, 20);

    setFilteredVehicles(filtered);
  }, [searchQuery, vehicles]);

  // State for vehicle selection loading
  const [isSelectingVehicle, setIsSelectingVehicle] = useState(false);

  // Handle vehicle selection from lookup list
  const handleVehiclePress = async (vehicle) => {
    if (isSelectingVehicle) return;

    setIsSelectingVehicle(true);
    console.log("[ScanStep] Vehicle selected from lookup:", vehicle.vehicleId);

    try {
      // Fetch fueling rules for this vehicle
      const rulesCheck = await pumpControlService.checkVehicleFuelingRules(
        vehicle.vehicleId
      );
      console.log(
        "[ScanStep] Fueling rules response:",
        JSON.stringify(rulesCheck, null, 2)
      );

      const rules = convertApiResponseToRules(rulesCheck);

      // Check if vehicle has no rules configured
      if (rules && !rules.hasRules) {
        console.log("[ScanStep] Vehicle has no rules - showing alert");
        Alert.alert(
          "No Fuel Rules Configured",
          "This vehicle has no fuel rules configured. Please contact your administrator to set up fueling rules for this vehicle.",
          [{ text: "OK" }]
        );
        setIsSelectingVehicle(false);
        return;
      }

      // Check if fueling is blocked
      if (rules && !rules.isAllowed && rules.blockedReason) {
        Alert.alert(
          "Fueling Not Allowed",
          rules.blockedReason ||
            rules.message ||
            "Fueling is not permitted at this time.",
          [{ text: "OK" }]
        );
        setIsSelectingVehicle(false);
        return;
      }

      // Pass vehicle with rules to parent
      onVehicleSelect(vehicle, rules);
    } catch (error) {
      console.error("[ScanStep] Failed to fetch fueling rules:", error.message);
      // Show warning but allow to continue
      Alert.alert(
        "Warning",
        "Could not fetch fueling rules for this vehicle. Please verify fuel limits manually.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue Anyway",
            onPress: () => onVehicleSelect(vehicle, null),
          },
        ]
      );
    } finally {
      setIsSelectingVehicle(false);
    }
  };

  // Handle manual entry submission
  const handleManualSubmit = async () => {
    if (!manualReg.trim()) {
      Alert.alert("Error", "Please enter a vehicle registration number");
      return;
    }

    // Check if vehicle exists in the list
    const existingVehicle = vehicles.find(
      (v) => (v.numberPlate || "").toLowerCase() === manualReg.toLowerCase()
    );

    if (existingVehicle) {
      // For existing vehicles, check fueling rules first
      if (isSelectingVehicle) return;
      setIsSelectingVehicle(true);

      try {
        const rulesCheck = await pumpControlService.checkVehicleFuelingRules(
          existingVehicle.vehicleId
        );
        const rules = convertApiResponseToRules(rulesCheck);

        // Check if vehicle has no rules configured
        if (rules && !rules.hasRules) {
          Alert.alert(
            "No Fuel Rules Configured",
            "This vehicle has no fueling rules configured. Please contact your fleet administrator to set up fueling rules before proceeding.",
            [{ text: "OK" }]
          );
          return;
        }

        // Check if fueling is blocked
        if (rules && !rules.isAllowed && rules.blockedReason) {
          Alert.alert("Fueling Not Allowed", rules.blockedReason, [
            { text: "OK" },
          ]);
          return;
        }

        onVehicleSelect(existingVehicle, rules);
      } catch (error) {
        console.error(
          "[ScanStep] Failed to fetch fueling rules for manual entry:",
          error.message
        );
        Alert.alert(
          "Warning",
          "Could not fetch fueling rules for this vehicle. Please verify fuel limits manually.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Continue Anyway",
              onPress: () => onVehicleSelect(existingVehicle, null),
            },
          ]
        );
      } finally {
        setIsSelectingVehicle(false);
      }
    } else {
      // Create a temporary vehicle object for manual entry
      setVehicleReg(manualReg);
      onNext({
        vehicleInfo: {
          numberPlate: manualReg,
          isManualEntry: true,
        },
      });
    }
  };

  // Handle scan action - use real tag listening instead of mock
  const handleScan = () => {
    if (deviceId) {
      // Use real SignalR tag detection
      startTagListening();
    } else {
      // Fallback to original scan behavior if no device connected
      onScan();
    }
  };

  // Cancel tag listening
  const handleCancelScan = () => {
    stopTagListening();
  };

  // Proceed with validated vehicle
  const handleProceed = () => {
    if (!vehicleInfo) {
      Alert.alert("Error", "Please select or enter a vehicle");
      return;
    }
    onNext({ vehicleInfo });
  };

  // Render vehicle item in list
  const renderVehicleItem = ({ item }) => (
    <TouchableOpacity
      style={[
        styles.vehicleItem,
        vehicleInfo?.id === item.id && styles.vehicleItemSelected,
      ]}
      onPress={() => handleVehiclePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.vehicleIcon}>
        <Icon
          name={
            item.vehicleType?.toLowerCase().includes("truck") ? "truck" : "car"
          }
          size={24}
          color={vehicleInfo?.id === item.id ? "#2563eb" : "#6b7280"}
        />
      </View>
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehiclePlate}>
          {item.numberPlate || item.vehicleCode}
        </Text>
        <Text style={styles.vehicleInfo}>
          {[item.make, item.model].filter(Boolean).join(" ") ||
            "Unknown Vehicle"}
        </Text>
        {item.tagId && <Text style={styles.vehicleTag}>Tag: {item.tagId}</Text>}
      </View>
      {vehicleInfo?.id === item.id && (
        <Icon name="check-circle" size={20} color="#2563eb" solid />
      )}
    </TouchableOpacity>
  );

  // Render method selector
  const renderMethodSelector = () => (
    <View style={styles.methodContainer}>
      {SELECTION_METHODS.map((method) => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodButton,
            selectionMethod === method.id && styles.methodButtonActive,
          ]}
          onPress={() => setSelectionMethod(method.id)}
        >
          <Icon
            name={method.icon}
            size={20}
            color={selectionMethod === method.id ? "#2563eb" : "#6b7280"}
          />
          <Text
            style={[
              styles.methodText,
              selectionMethod === method.id && styles.methodTextActive,
            ]}
          >
            {method.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render lookup content
  const renderLookupContent = () => (
    <View style={styles.contentContainer}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon
          name="search"
          size={18}
          color="#9ca3af"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by plate, number, make..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Icon name="times-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Vehicle List */}
      {isLoadingVehicles ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          renderItem={renderVehicleItem}
          keyExtractor={(item) => item.id?.toString() || item.numberPlate}
          style={styles.vehicleList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="car" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No vehicles found</Text>
            </View>
          }
        />
      )}
    </View>
  );

  // Render scan content
  const renderScanContent = () => {
    const isActivelyListening = isListeningForTags || isScanning;
    // Get the most recent detected tag for display
    const displayTag =
      localDetectedTags.length > 0
        ? localDetectedTags[localDetectedTags.length - 1]
        : null;

    return (
      <View style={styles.contentContainer}>
        <View style={styles.scanContainer}>
          <TouchableOpacity
            style={[
              styles.scanButton,
              isActivelyListening && styles.scanButtonActive,
            ]}
            onPress={isActivelyListening ? handleCancelScan : handleScan}
            disabled={isValidatingTag}
          >
            {isValidatingTag ? (
              <ActivityIndicator size="large" color="white" />
            ) : isActivelyListening ? (
              <View style={styles.scanButtonActiveContent}>
                <ActivityIndicator size="large" color="white" />
                <Icon
                  name="times"
                  size={24}
                  color="white"
                  style={{ position: "absolute", top: -10, right: -10 }}
                />
              </View>
            ) : (
              <Icon name="qrcode" size={64} color="white" />
            )}
          </TouchableOpacity>
          <Text style={styles.scanText}>
            {isValidatingTag
              ? "Validating tag..."
              : isActivelyListening
              ? "Listening for RFID tags... (tap to cancel)"
              : "Tap to scan tag or QR code"}
          </Text>

          {/* Show detected tags from real-time UploadStatus */}
          {displayTag && (
            <View style={styles.scanResultContainer}>
              <Icon name="tag" size={24} color="#10b981" />
              <Text style={styles.scanResultText}>
                Tag detected: {displayTag.tagId}
                {displayTag.source === "pump" &&
                  displayTag.pumpId &&
                  ` (Pump ${displayTag.pumpId})`}
                {displayTag.source?.includes("reader") &&
                  displayTag.readerId &&
                  ` (Reader ${displayTag.readerId})`}
              </Text>
            </View>
          )}

          {scanResult && !displayTag && (
            <View style={styles.scanResultContainer}>
              <Icon name="check-circle" size={24} color="#10b981" />
              <Text style={styles.scanResultText}>Scanned: {scanResult}</Text>
            </View>
          )}

          {/* Show all detected tags if multiple */}
          {localDetectedTags.length > 1 && (
            <View style={styles.detectedTagsList}>
              <Text style={styles.detectedTagsTitle}>
                Detected tags ({localDetectedTags.length}):
              </Text>
              {localDetectedTags.map((tag, index) => (
                <TouchableOpacity
                  key={`${tag.tagId}-${index}`}
                  style={styles.detectedTagItem}
                  onPress={() => handleTagValidation(tag.tagId)}
                  disabled={isValidatingTag}
                >
                  <Icon
                    name={
                      tag.source === "pump" ? "gas-pump" : "broadcast-tower"
                    }
                    size={16}
                    color="#6b7280"
                  />
                  <Text style={styles.detectedTagText}>
                    {tag.tagId}
                    {tag.source === "pump" && tag.pumpId && ` (P${tag.pumpId})`}
                  </Text>
                  <Icon name="chevron-right" size={12} color="#9ca3af" />
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Connection Status Indicator */}
        {deviceId && (
          <View
            style={[
              styles.connectionStatus,
              isActivelyListening && styles.connectionStatusActive,
            ]}
          >
            <Icon
              name={isActivelyListening ? "broadcast-tower" : "plug"}
              size={14}
              color={isActivelyListening ? "#10b981" : "#6b7280"}
            />
            <Text
              style={[
                styles.connectionStatusText,
                isActivelyListening && styles.connectionStatusTextActive,
              ]}
            >
              {isActivelyListening
                ? `Connected to ${deviceId} - Waiting for RFID...`
                : `Device: ${deviceId}`}
            </Text>
          </View>
        )}

        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>How to scan:</Text>
          <View style={styles.instructionItem}>
            <Icon name="1" size={16} color="#6b7280" solid />
            <Text style={styles.instructionText}>
              {deviceId
                ? "Hold vehicle RFID tag near reader"
                : "Point camera at QR code or NFC tag"}
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="2" size={16} color="#6b7280" solid />
            <Text style={styles.instructionText}>
              {deviceId
                ? "Tag will be detected automatically"
                : "Hold steady until scan completes"}
            </Text>
          </View>
          <View style={styles.instructionItem}>
            <Icon name="3" size={16} color="#6b7280" solid />
            <Text style={styles.instructionText}>
              Vehicle info will be retrieved automatically
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Render manual entry content
  const renderManualContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.manualContainer}>
        <Text style={styles.manualLabel}>Vehicle Registration Number</Text>
        <TextInput
          style={styles.manualInput}
          placeholder="Enter registration (e.g., ABC 123)"
          placeholderTextColor="#9ca3af"
          value={manualReg}
          onChangeText={setManualReg}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.manualSubmitButton}
          onPress={handleManualSubmit}
        >
          <Text style={styles.manualSubmitText}>Verify & Continue</Text>
          <Icon name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Warning */}
      <View style={styles.warningContainer}>
        <Icon name="exclamation-triangle" size={16} color="#f59e0b" />
        <Text style={styles.warningText}>
          Manual entry may require additional verification
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Vehicle</Text>
          <Text style={styles.subtitle}>Identify the vehicle for fueling</Text>
        </View>
      </View>

      {/* Method Selector */}
      {renderMethodSelector()}

      {/* Content based on selection method */}
      {selectionMethod === "lookup" && renderLookupContent()}
      {selectionMethod === "scan" && renderScanContent()}
      {selectionMethod === "manual" && renderManualContent()}

      {/* Selected Vehicle Summary & Proceed Button */}
      {vehicleInfo && selectionMethod === "lookup" && (
        <View style={styles.selectedSummary}>
          <View style={styles.selectedInfo}>
            <Icon name="car" size={24} color="#2563eb" />
            <View style={styles.selectedText}>
              <Text style={styles.selectedPlate}>
                {vehicleInfo.numberPlate}
              </Text>
              <Text style={styles.selectedDetails}>
                {[vehicleInfo.make, vehicleInfo.model]
                  .filter(Boolean)
                  .join(" ")}
              </Text>
            </View>
          </View>
          <TouchableOpacity
            style={styles.proceedButton}
            onPress={handleProceed}
          >
            <Text style={styles.proceedText}>Continue</Text>
            <Icon name="arrow-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  methodContainer: {
    flexDirection: "row",
    marginBottom: 16,
    backgroundColor: "#f3f4f6",
    borderRadius: 12,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#6b7280",
    fontWeight: "500",
  },
  methodTextActive: {
    color: "#2563eb",
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: "#1f2937",
  },
  vehicleList: {
    flex: 1,
  },
  vehicleItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  vehicleItemSelected: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  vehicleInfo: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  vehicleTag: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  scanContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  scanButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: "#2563eb",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  scanButtonActive: {
    backgroundColor: "#1d4ed8",
  },
  scanText: {
    fontSize: 16,
    color: "#6b7280",
  },
  scanResultContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    padding: 12,
    backgroundColor: "#ecfdf5",
    borderRadius: 8,
  },
  scanResultText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#065f46",
    fontWeight: "500",
  },
  scanButtonActiveContent: {
    justifyContent: "center",
    alignItems: "center",
  },
  detectedTagsList: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    width: "100%",
  },
  detectedTagsTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  detectedTagItem: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 12,
    borderRadius: 6,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  detectedTagText: {
    flex: 1,
    marginLeft: 8,
    fontSize: 14,
    color: "#374151",
  },
  instructionsContainer: {
    backgroundColor: "#f9fafb",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  instructionText: {
    marginLeft: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  // Connection status indicator styles
  connectionStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 8,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    marginTop: 8,
  },
  connectionStatusActive: {
    backgroundColor: "#ecfdf5",
  },
  connectionStatusText: {
    marginLeft: 6,
    fontSize: 12,
    color: "#6b7280",
  },
  connectionStatusTextActive: {
    color: "#065f46",
  },
  manualContainer: {
    paddingVertical: 24,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: "white",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: "#1f2937",
    textAlign: "center",
    letterSpacing: 2,
    marginBottom: 16,
  },
  manualSubmitButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 14,
    borderRadius: 12,
  },
  manualSubmitText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginRight: 8,
  },
  warningContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#92400e",
  },
  selectedSummary: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#2563eb",
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedText: {
    marginLeft: 12,
  },
  selectedPlate: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  selectedDetails: {
    fontSize: 14,
    color: "#6b7280",
  },
  proceedButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  proceedText: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
});

export default ScanStep;
