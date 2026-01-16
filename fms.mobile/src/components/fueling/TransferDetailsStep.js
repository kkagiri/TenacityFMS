import React, { useState, useMemo, useEffect, useRef } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SectionList,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Keyboard,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useSelector, useDispatch } from "react-redux";
import {
  selectAllTanks,
  selectIsLoading,
  fetchTanks,
} from "../../redux/slices/tankSlice";

// Helper to normalize tank object (handle both PTS probe format and internal format)
const normalizeTank = (tank) => {
  if (!tank) return null;
  return {
    tankId: tank.tankId || tank.id || tank.Id || tank.probeId,
    tankName:
      tank.tankName ||
      tank.name ||
      tank.Name ||
      `Tank ${tank.id || tank.probeId}`,
    productName:
      tank.productName ||
      tank.ProductName ||
      tank.fuelGradeName ||
      tank.FuelGradeName ||
      "Unknown",
    capacity:
      tank.capacity ||
      tank.tankCapacity ||
      tank.TankVolume ||
      tank.tankVolume ||
      50000,
    // Use physicalStockValue (actual physical fuel level) - not currentStock (book value)
    currentVolume:
      tank.PhysicalStockValue ||
      tank.physicalStockValue ||
      tank.currentVolume ||
      tank.volume ||
      0,
    siteName: tank.siteName || tank.SiteName || "Current Site",
    ...tank,
  };
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
  // Nozzle validation props
  selectedPump,
  selectedNozzle,
  pumpDetails,
}) => {
  // Check if selected nozzle is lifted (nozzleUp value matches selected nozzle ID)
  const isNozzleUp = pumpDetails?.nozzleUp === selectedNozzle?.id;
  const dispatch = useDispatch();
  const allTanks = useSelector(selectAllTanks);
  const isLoadingTanks = useSelector(selectIsLoading);

  const [showDestinationPicker, setShowDestinationPicker] = useState(
    !destinationTank
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [activeInput, setActiveInput] = useState(null); // 'search', 'volume', 'notes'
  const scrollViewRef = useRef(null);

  // Track keyboard visibility
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

  // Fetch tanks from API on mount if not already loaded
  useEffect(() => {
    if (!allTanks || allTanks.length === 0) {
      dispatch(fetchTanks());
    }
  }, [dispatch, allTanks]);

  // Normalize source tank for consistent field access
  const normalizedSource = useMemo(() => {
    const normalized = normalizeTank(sourceTank);
    return normalized;
  }, [sourceTank]);

  // Get destination tanks from API - filter out source tank
  const availableDestinations = useMemo(() => {
    if (!allTanks || allTanks.length === 0) return [];

    // Normalize all tanks and filter out the source tank
    return allTanks.map(normalizeTank).filter((tank) => {
      const sourceId = normalizedSource?.tankId || normalizedSource?.probeId;
      const tankId = tank?.tankId || tank?.probeId;
      return tankId !== sourceId;
    });
  }, [allTanks, normalizedSource]);

  // Filter destinations based on search query
  const filteredDestinations = useMemo(() => {
    if (!searchQuery.trim()) return availableDestinations;
    const query = searchQuery.toLowerCase().trim();
    return availableDestinations.filter((tank) => {
      const name = (tank.tankName || "").toLowerCase();
      const product = (tank.productName || "").toLowerCase();
      const site = (tank.siteName || "").toLowerCase();
      return (
        name.includes(query) || product.includes(query) || site.includes(query)
      );
    });
  }, [availableDestinations, searchQuery]);

  // Group filtered destinations by site
  const groupedDestinations = useMemo(() => {
    if (!filteredDestinations || filteredDestinations.length === 0) return [];

    const groups = {};
    filteredDestinations.forEach((tank) => {
      const siteName = tank.siteName || "Unknown Site";
      if (!groups[siteName]) {
        groups[siteName] = [];
      }
      groups[siteName].push(tank);
    });

    return Object.keys(groups)
      .sort()
      .map((siteName) => ({
        title: siteName,
        data: groups[siteName],
      }));
  }, [filteredDestinations]);

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
      return;
    }

    if (!transferVolume || parseFloat(transferVolume) <= 0) {
      return;
    }

    onNext();
  };

  // Check if form is valid - must have destination, volume, AND nozzle must be up
  const isFormValid =
    isNozzleUp &&
    destinationTank &&
    transferVolume &&
    parseFloat(transferVolume) > 0;

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
        <View style={styles.tankInfo}>
          <View style={styles.tankHeader}>
            <Text
              style={[styles.tankName, isSelected && styles.tankNameSelected]}
              numberOfLines={1}
            >
              {item.tankName}
            </Text>
            <View style={styles.fuelTypeBadge}>
              <Text style={styles.fuelTypeText}>{item.productName}</Text>
            </View>
          </View>

          {/* Compact capacity display */}
          <View style={styles.capacityRow}>
            <Text style={styles.availableSpace}>
              {availableSpace.toLocaleString()} L available
            </Text>
            <View style={styles.capacityBarContainer}>
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
              <Text
                style={[
                  styles.capacityPercent,
                  { color: getFillColor(fillPercentage) },
                ]}
              >
                {Math.round(fillPercentage)}%
              </Text>
            </View>
          </View>
        </View>

        <Icon
          name={isSelected ? "check-circle" : "chevron-right"}
          size={isSelected ? 18 : 14}
          color={isSelected ? "#10b981" : "#9ca3af"}
          solid={isSelected}
        />
      </TouchableOpacity>
    );
  };

  // Render section header for site grouping
  const renderSectionHeader = ({ section: { title, data } }) => (
    <View style={styles.sectionHeader}>
      <Icon name="map-marker-alt" size={11} color="#10b981" />
      <Text style={styles.sectionHeaderTitle}>{title}</Text>
      <Text style={styles.sectionCount}>({data.length})</Text>
    </View>
  );

  const isCompactMode = isKeyboardVisible;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <View style={styles.innerContainer}>
        {/* Header - Compact when keyboard visible */}
        <View style={[styles.header, isCompactMode && styles.headerCompact]}>
          <Text
            style={[styles.stepTitle, isCompactMode && styles.stepTitleCompact]}
          >
            Tank Transfer
          </Text>
          {!isCompactMode && (
            <Text style={styles.stepDescription}>
              {destinationTank
                ? "Confirm transfer details"
                : "Select destination tank"}
            </Text>
          )}
        </View>

        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollContainer}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Source Tank Card - Hidden when searching */}
          {!(isCompactMode && showDestinationPicker) && (
            <View
              style={[
                styles.sourceTankCard,
                isCompactMode && styles.sourceTankCardCompact,
              ]}
            >
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
          )}

          {/* Transfer Arrow - Hidden when keyboard visible during search */}
          {!(isCompactMode && showDestinationPicker) && (
            <View style={styles.transferArrow}>
              <View style={styles.transferArrowLine} />
              <View style={styles.transferArrowIcon}>
                <Icon name="arrow-down" size={16} color="#6b7280" />
              </View>
              <View style={styles.transferArrowLine} />
            </View>
          )}

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
                {/* Search Box */}
                <View style={styles.searchContainer}>
                  <View style={styles.searchInputWrapper}>
                    <Icon
                      name="search"
                      size={14}
                      color="#9ca3af"
                      style={styles.searchIcon}
                    />
                    <TextInput
                      style={styles.searchInput}
                      placeholder="Search tanks by name, site or fuel..."
                      placeholderTextColor="#9ca3af"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    {searchQuery.length > 0 && (
                      <TouchableOpacity
                        onPress={() => setSearchQuery("")}
                        style={styles.clearButton}
                      >
                        <Icon name="times-circle" size={14} color="#9ca3af" />
                      </TouchableOpacity>
                    )}
                  </View>
                  {searchQuery.length > 0 && (
                    <Text style={styles.searchResultsText}>
                      {filteredDestinations.length} of{" "}
                      {availableDestinations.length} tanks
                    </Text>
                  )}
                </View>

                {isLoadingTanks ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color="#6366f1" />
                    <Text style={styles.loadingText}>Loading tanks...</Text>
                  </View>
                ) : groupedDestinations.length === 0 ? (
                  <View style={styles.noTanksContainer}>
                    <Icon
                      name={searchQuery ? "search" : "exclamation-circle"}
                      size={24}
                      color="#f59e0b"
                    />
                    <Text style={styles.noTanksText}>
                      {searchQuery
                        ? `No tanks found matching "${searchQuery}"`
                        : "No compatible tanks available for transfer"}
                    </Text>
                  </View>
                ) : (
                  <SectionList
                    sections={groupedDestinations}
                    keyExtractor={(item) =>
                      (item.tankId || item.id || item.probeId).toString()
                    }
                    renderItem={renderDestinationTank}
                    renderSectionHeader={renderSectionHeader}
                    scrollEnabled={false}
                    keyboardShouldPersistTaps="handled"
                    stickySectionHeadersEnabled={false}
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
                  onFocus={() => {
                    setActiveInput("volume");
                    setTimeout(() => {
                      scrollViewRef.current?.scrollToEnd({ animated: true });
                    }, 100);
                  }}
                  onBlur={() => setActiveInput(null)}
                  keyboardType="numeric"
                  returnKeyType="done"
                  blurOnSubmit={true}
                />
              </View>

              {/* Transfer Summary - Hidden when keyboard visible */}
              {!isKeyboardVisible &&
                transferVolume &&
                parseFloat(transferVolume) > 0 && (
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

              {/* Nozzle Status Card - Hidden when keyboard visible */}
              {!isKeyboardVisible && (
                <View
                  style={[
                    styles.nozzleStatusCard,
                    isNozzleUp
                      ? styles.nozzleStatusReady
                      : styles.nozzleStatusWaiting,
                  ]}
                >
                  <View style={styles.nozzleStatusContent}>
                    <View
                      style={[
                        styles.nozzleStatusIcon,
                        isNozzleUp
                          ? styles.nozzleStatusIconReady
                          : styles.nozzleStatusIconWaiting,
                      ]}
                    >
                      <Icon
                        name={isNozzleUp ? "check-circle" : "hand-paper"}
                        size={20}
                        color={isNozzleUp ? "#10b981" : "#f59e0b"}
                      />
                    </View>
                    <View style={styles.nozzleStatusText}>
                      <Text
                        style={[
                          styles.nozzleStatusTitle,
                          isNozzleUp
                            ? styles.nozzleStatusTitleReady
                            : styles.nozzleStatusTitleWaiting,
                        ]}
                      >
                        {isNozzleUp
                          ? "Nozzle Ready"
                          : "Lift Nozzle to Continue"}
                      </Text>
                      <Text style={styles.nozzleStatusSubtitle}>
                        Pump {selectedPump?.id || "-"} • Nozzle{" "}
                        {selectedNozzle?.id || "-"}
                        {!isNozzleUp ? " (Currently down)" : ""}
                      </Text>
                    </View>
                  </View>
                  {!isNozzleUp ? (
                    <View style={styles.nozzleStatusPulse}>
                      <Icon name="sync" size={16} color="#f59e0b" />
                    </View>
                  ) : null}
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
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  innerContainer: {
    flex: 1,
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
  sourceTankCardCompact: {
    padding: 10,
    marginBottom: 8,
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
  // Search box styles
  searchContainer: {
    marginBottom: 10,
  },
  searchInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#10b981",
    paddingHorizontal: 10,
  },
  searchIcon: {
    marginRight: 6,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 14,
    color: "#1f2937",
  },
  clearButton: {
    padding: 4,
  },
  searchResultsText: {
    fontSize: 11,
    color: "#065f46",
    marginTop: 4,
    textAlign: "center",
  },
  // Section header for site grouping
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 2,
    marginTop: 4,
  },
  sectionHeaderTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#065f46",
    marginLeft: 4,
  },
  sectionCount: {
    fontSize: 11,
    color: "#9ca3af",
    marginLeft: 4,
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
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
  // Compact tank card
  tankCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "#d1fae5",
  },
  tankCardSelected: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
    borderWidth: 2,
  },
  tankInfo: {
    flex: 1,
  },
  tankHeader: {
    flexDirection: "row",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 6,
  },
  tankName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  tankNameSelected: {
    color: "#065f46",
  },
  fuelTypeBadge: {
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  fuelTypeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#6b7280",
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 3,
    gap: 8,
  },
  availableSpace: {
    fontSize: 12,
    color: "#374151",
    fontWeight: "500",
    minWidth: 90,
  },
  capacityBarContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  capacityBar: {
    flex: 1,
    height: 4,
    backgroundColor: "#e5e7eb",
    borderRadius: 2,
    overflow: "hidden",
  },
  capacityFill: {
    height: "100%",
    borderRadius: 2,
  },
  capacityPercent: {
    fontSize: 10,
    fontWeight: "600",
    minWidth: 24,
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
  // Nozzle Status Card Styles
  nozzleStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    marginTop: 16,
    borderWidth: 1,
  },
  nozzleStatusReady: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },
  nozzleStatusWaiting: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  nozzleStatusContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  nozzleStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nozzleStatusIconReady: {
    backgroundColor: "#dcfce7",
  },
  nozzleStatusIconWaiting: {
    backgroundColor: "#fef3c7",
  },
  nozzleStatusText: {
    flex: 1,
  },
  nozzleStatusTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  nozzleStatusTitleReady: {
    color: "#166534",
  },
  nozzleStatusTitleWaiting: {
    color: "#92400e",
  },
  nozzleStatusSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  nozzleStatusPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
});

export default TransferDetailsStep;
