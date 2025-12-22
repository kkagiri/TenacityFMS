import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  FlatList,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

// Helper to normalize tank object (handle both PTS probe format and internal format)
const normalizeTank = (tank) => {
  if (!tank) return null;
  return {
    tankId: tank.tankId || tank.id || tank.probeId,
    tankName: tank.tankName || tank.name || `Tank ${tank.id || tank.probeId}`,
    productName: tank.productName || "Unknown",
    capacity: tank.capacity || 50000,
    currentVolume: tank.currentVolume || 0,
    siteName: tank.siteName || "Current Site",
    ...tank,
  };
};

// Generate mock destination tanks based on source product
const generateMockDestinations = (sourceProductName) => {
  const dieselTanks = [
    {
      tankId: 101,
      tankName: "Tank B - Backup Storage",
      productName: "Diesel",
      capacity: 50000,
      currentVolume: 15000,
      siteName: "Site A - Doha",
    },
    {
      tankId: 102,
      tankName: "Tank C - Secondary",
      productName: "Diesel",
      capacity: 30000,
      currentVolume: 8000,
      siteName: "Site A - Doha",
    },
    {
      tankId: 103,
      tankName: "Tank D - Reserve",
      productName: "Diesel",
      capacity: 40000,
      currentVolume: 12000,
      siteName: "Site B - Lusail",
    },
  ];

  const petrolTanks = [
    {
      tankId: 201,
      tankName: "Tank P1 - Premium Storage",
      productName: "Petrol",
      capacity: 35000,
      currentVolume: 10000,
      siteName: "Site A - Doha",
    },
    {
      tankId: 202,
      tankName: "Tank P2 - Regular",
      productName: "Petrol",
      capacity: 25000,
      currentVolume: 5000,
      siteName: "Site B - Lusail",
    },
  ];

  // Return tanks matching the source product, or all if no match
  const normalizedProduct = (sourceProductName || "").toLowerCase();
  if (
    normalizedProduct.includes("diesel") ||
    normalizedProduct.includes("ago")
  ) {
    return dieselTanks;
  }
  if (
    normalizedProduct.includes("petrol") ||
    normalizedProduct.includes("pms") ||
    normalizedProduct.includes("gasoline")
  ) {
    return petrolTanks;
  }
  // Return all for unknown products
  return [...dieselTanks, ...petrolTanks];
};

const TransferDetailsStep = ({
  sourceTank,
  destinationTank,
  transferVolume,
  transferReason,
  onSelectDestination,
  onVolumeChange,
  onReasonChange,
  onNext,
  onBack,
}) => {
  // Debug logging
  console.log("[TransferDetailsStep] Render - sourceTank:", sourceTank);
  console.log(
    "[TransferDetailsStep] Render - destinationTank:",
    destinationTank
  );

  const [showDestinationPicker, setShowDestinationPicker] = useState(
    !destinationTank
  );

  // Normalize source tank for consistent field access
  const normalizedSource = useMemo(() => {
    const normalized = normalizeTank(sourceTank);
    console.log("[TransferDetailsStep] normalizedSource:", normalized);
    return normalized;
  }, [sourceTank]);

  // Generate mock destinations based on source product
  const availableDestinations = useMemo(() => {
    const mocks = generateMockDestinations(normalizedSource?.productName);
    // Filter out source tank by ID
    return mocks.filter((tank) => tank.tankId !== normalizedSource?.tankId);
  }, [normalizedSource]);

  const getFillColor = (percentage) => {
    if (percentage >= 80) return "#f59e0b"; // Amber - nearly full
    if (percentage >= 50) return "#10b981"; // Green - good space
    return "#3b82f6"; // Blue - lots of space
  };

  const handleDestinationSelect = (tank) => {
    onSelectDestination(tank);
    setShowDestinationPicker(false);
  };

  const handleConfirm = () => {
    // Validate inputs before proceeding
    if (!destinationTank) {
      console.log("[TransferDetailsStep] No destination tank selected");
      return;
    }

    if (!transferVolume || parseFloat(transferVolume) <= 0) {
      console.log("[TransferDetailsStep] Invalid transfer volume");
      return;
    }

    console.log("[TransferDetailsStep] Proceeding to confirmation:", {
      sourceTank: normalizedSource?.tankName,
      destinationTank: destinationTank.tankName,
      volume: transferVolume,
      reason: transferReason,
    });

    onNext();
  };

  // Check if form is valid
  const isFormValid =
    destinationTank && transferVolume && parseFloat(transferVolume) > 0;

  // Calculate max transferable volume
  const maxVolume = normalizedSource?.currentVolume || 0;
  const destinationSpace = destinationTank
    ? destinationTank.capacity - destinationTank.currentVolume
    : 0;
  const maxTransferVolume = Math.min(maxVolume, destinationSpace);

  const renderDestinationTank = ({ item }) => {
    const isSelected = destinationTank?.tankId === item.tankId;
    const fillPercentage = (item.currentVolume / item.capacity) * 100;
    const availableSpace = item.capacity - item.currentVolume;

    return (
      <TouchableOpacity
        style={[styles.tankCard, isSelected && styles.tankCardSelected]}
        onPress={() => handleDestinationSelect(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.tankIconContainer,
            {
              backgroundColor: isSelected ? "#10b981" : "#10b98115",
            },
          ]}
        >
          <Icon
            name="database"
            size={20}
            color={isSelected ? "#ffffff" : "#10b981"}
          />
        </View>

        <View style={styles.tankInfo}>
          <Text
            style={[styles.tankName, isSelected && styles.tankNameSelected]}
          >
            {item.tankName}
          </Text>
          <View style={styles.tankMeta}>
            <View style={styles.fuelTypeBadge}>
              <Text style={styles.fuelTypeText}>{item.productName}</Text>
            </View>
            <Text style={styles.tankSite}>{item.siteName}</Text>
          </View>

          {/* Capacity bar */}
          <View style={styles.capacityContainer}>
            <View style={styles.capacityBar}>
              <View
                style={[
                  styles.capacityFill,
                  {
                    width: `${fillPercentage}%`,
                    backgroundColor: getFillColor(fillPercentage),
                  },
                ]}
              />
            </View>
            <Text style={styles.availableSpace}>
              {availableSpace.toLocaleString()} L available
            </Text>
          </View>
        </View>

        <Icon
          name="chevron-right"
          size={16}
          color={isSelected ? "#10b981" : "#9ca3af"}
        />
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Tank Transfer</Text>
        <Text style={styles.stepDescription}>
          {destinationTank
            ? "Confirm transfer details"
            : "Select destination tank"}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.content}
      >
        {/* Source Tank Card */}
        <View style={styles.sourceTankCard}>
          <View style={styles.transferDirectionLabel}>
            <View style={styles.directionIconFrom}>
              <Icon name="arrow-up" size={12} color="white" />
            </View>
            <Text style={styles.directionText}>FROM</Text>
          </View>

          <View style={styles.tankSummary}>
            <View style={styles.tankSummaryIcon}>
              <Icon name="database" size={24} color="#ef4444" />
            </View>
            <View style={styles.tankSummaryInfo}>
              <Text style={styles.tankSummaryName}>
                {normalizedSource?.tankName || "No tank selected"}
              </Text>
              <Text style={styles.tankSummaryDetail}>
                {normalizedSource?.productName || "Unknown"} •{" "}
                {normalizedSource?.currentVolume?.toLocaleString() || 0} L
                available
              </Text>
            </View>
          </View>
        </View>

        {/* Transfer Arrow */}
        <View style={styles.transferArrow}>
          <View style={styles.transferArrowLine} />
          <View style={styles.transferArrowIcon}>
            <Icon name="arrow-down" size={16} color="#6b7280" />
          </View>
          <View style={styles.transferArrowLine} />
        </View>

        {/* Destination Tank Section */}
        <View style={styles.destinationSection}>
          <View style={styles.transferDirectionLabel}>
            <View style={styles.directionIconTo}>
              <Icon name="arrow-down" size={12} color="white" />
            </View>
            <Text style={styles.directionText}>TO</Text>
          </View>

          {destinationTank && !showDestinationPicker ? (
            // Selected destination display
            <View style={styles.selectedDestinationCard}>
              <View style={styles.tankSummary}>
                <View
                  style={[
                    styles.tankSummaryIcon,
                    { backgroundColor: "#ecfdf5" },
                  ]}
                >
                  <Icon name="database" size={24} color="#10b981" />
                </View>
                <View style={styles.tankSummaryInfo}>
                  <Text style={styles.tankSummaryName}>
                    {destinationTank.tankName}
                  </Text>
                  <Text style={styles.tankSummaryDetail}>
                    {destinationTank.productName} •{" "}
                    {(
                      destinationTank.capacity - destinationTank.currentVolume
                    ).toLocaleString()}{" "}
                    L available
                  </Text>
                </View>
              </View>
              <TouchableOpacity
                style={styles.changeButton}
                onPress={() => setShowDestinationPicker(true)}
              >
                <Icon name="exchange-alt" size={14} color="#6b7280" />
                <Text style={styles.changeButtonText}>Change</Text>
              </TouchableOpacity>
            </View>
          ) : (
            // Destination picker list
            <View style={styles.destinationPickerContainer}>
              <Text style={styles.pickerTitle}>
                Select destination tank ({availableDestinations.length}{" "}
                available)
              </Text>
              {availableDestinations.length === 0 ? (
                <View style={styles.noTanksContainer}>
                  <Icon name="exclamation-circle" size={24} color="#f59e0b" />
                  <Text style={styles.noTanksText}>
                    No compatible tanks available for transfer
                  </Text>
                </View>
              ) : (
                <FlatList
                  data={availableDestinations}
                  keyExtractor={(item) => item.tankId.toString()}
                  renderItem={renderDestinationTank}
                  scrollEnabled={false}
                />
              )}
            </View>
          )}
        </View>

        {/* Volume and Reason Input */}
        {destinationTank && !showDestinationPicker && (
          <View style={styles.inputSection}>
            <Text style={styles.sectionTitle}>Transfer Details</Text>

            {/* Volume Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputHeader}>
                <View style={styles.inputLabelContainer}>
                  <Icon name="tint" size={14} color="#6366f1" />
                  <Text style={styles.inputLabel}>Volume (Liters)</Text>
                </View>
                <Text style={styles.maxVolumeHint}>
                  Max: {maxTransferVolume.toLocaleString()} L
                </Text>
              </View>
              <TextInput
                style={styles.input}
                placeholder="Enter volume to transfer"
                placeholderTextColor="#9ca3af"
                value={transferVolume}
                onChangeText={onVolumeChange}
                keyboardType="numeric"
              />
            </View>

            {/* Reason Input */}
            <View style={styles.inputGroup}>
              <View style={styles.inputLabelContainer}>
                <Icon name="clipboard" size={14} color="#6366f1" />
                <Text style={styles.inputLabel}>Reason (Optional)</Text>
              </View>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Enter reason for transfer"
                placeholderTextColor="#9ca3af"
                value={transferReason}
                onChangeText={onReasonChange}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Transfer Summary */}
            {transferVolume && parseFloat(transferVolume) > 0 && (
              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Transfer Volume:</Text>
                  <Text style={styles.summaryValue}>
                    {parseFloat(transferVolume).toLocaleString()} L
                  </Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Product:</Text>
                  <Text style={styles.summaryValue}>
                    {normalizedSource?.productName}
                  </Text>
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={16} color="#6b7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        {destinationTank && !showDestinationPicker && (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isFormValid && styles.nextButtonDisabled,
            ]}
            onPress={handleConfirm}
            disabled={!isFormValid}
          >
            <Text
              style={[
                styles.nextButtonText,
                !isFormValid && styles.nextButtonTextDisabled,
              ]}
            >
              Continue
            </Text>
            <Icon
              name="arrow-right"
              size={16}
              color={isFormValid ? "white" : "#9ca3af"}
            />
          </TouchableOpacity>
        )}
      </View>
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
  scrollContainer: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  sourceTankCard: {
    backgroundColor: "#fef2f2",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#fecaca",
  },
  transferDirectionLabel: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  directionIconFrom: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#ef4444",
    alignItems: "center",
    justifyContent: "center",
  },
  directionIconTo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
  },
  directionText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6b7280",
    marginLeft: 8,
    letterSpacing: 1,
  },
  tankSummary: {
    flexDirection: "row",
    alignItems: "center",
  },
  tankSummaryIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
    alignItems: "center",
    justifyContent: "center",
  },
  tankSummaryInfo: {
    flex: 1,
    marginLeft: 14,
  },
  tankSummaryName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  tankSummaryDetail: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  transferArrow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },
  transferArrowLine: {
    flex: 1,
    height: 1,
    backgroundColor: "#d1d5db",
  },
  transferArrowIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginHorizontal: 12,
  },
  destinationSection: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#a7f3d0",
  },
  selectedDestinationCard: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
  },
  changeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#d1d5db",
  },
  changeButtonText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  destinationPickerContainer: {
    marginTop: 4,
  },
  pickerTitle: {
    fontSize: 13,
    color: "#065f46",
    marginBottom: 12,
  },
  noTanksContainer: {
    alignItems: "center",
    paddingVertical: 24,
  },
  noTanksText: {
    marginTop: 8,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  tankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  tankCardSelected: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  tankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tankName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  tankNameSelected: {
    color: "#065f46",
  },
  tankMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  fuelTypeBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  fuelTypeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  tankSite: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 8,
  },
  capacityContainer: {
    marginTop: 8,
  },
  capacityBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    borderRadius: 3,
  },
  availableSpace: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
  },
  inputSection: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  inputLabelContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 6,
  },
  maxVolumeHint: {
    fontSize: 12,
    color: "#6b7280",
  },
  input: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    padding: 12,
    fontSize: 15,
    color: "#1f2937",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
  },
  summaryCard: {
    backgroundColor: "#f0f9ff",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#bae6fd",
    marginTop: 8,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 4,
  },
  summaryLabel: {
    fontSize: 13,
    color: "#475569",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#0f172a",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  nextButtonDisabled: {
    backgroundColor: "#e5e7eb",
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
  nextButtonTextDisabled: {
    color: "#9ca3af",
  },
});

export default TransferDetailsStep;
