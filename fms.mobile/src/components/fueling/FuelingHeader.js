//Cursor - Mobile Fueling Header Component
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const FuelingHeader = ({
  siteName,
  deviceId,
  currentStep,
  connectionStatus,
  deviceOnline = false,
  onBack,
  selectedTank,
  operationMode,
  onChangeTank,
  // Active fueling props - now supports multiple
  activeFuelingPump,
  activeFuelingPumps = [], // Array of all active fuelings
  onViewFueling,
}) => {
  // Consistent 5-step flow for all modes:
  // 1. Pump -> 2. Nozzle -> 3. Mode -> 4. Details (Vehicle/Transfer) -> 5. Confirmation
  const getStepInfo = () => {
    switch (currentStep) {
      case "pump":
        return { label: "Step 1 of 5", name: "Select Pump" };
      case "nozzle":
        return { label: "Step 2 of 5", name: "Select Nozzle" };
      case "mode":
        return { label: "Step 3 of 5", name: "Select Mode" };
      case "vehicle":
        return { label: "Step 4 of 5", name: "Select Vehicle" };
      case "transfer":
        return { label: "Step 4 of 5", name: "Select Destination" };
      case "volume":
        return { label: "Step 5 of 5", name: "Fueling Details" };
      case "confirmation":
        return { label: "Step 5 of 5", name: "Confirmation" };
      default:
        return { label: "", name: currentStep };
    }
  };

  // Get connection status config
  const getConnectionConfig = () => {
    switch (connectionStatus) {
      case "connected":
        return { color: "#10b981", icon: "wifi", text: "Connected" };
      case "connecting":
        return { color: "#f59e0b", icon: "sync", text: "Connecting..." };
      case "reconnecting":
        return { color: "#f59e0b", icon: "sync", text: "Reconnecting..." };
      case "disconnected":
        return { color: "#ef4444", icon: "wifi-slash", text: "Disconnected" };
      default:
        return { color: "#6b7280", icon: "question", text: connectionStatus };
    }
  };

  // Get step sequence - consistent 5 steps for all modes
  // Steps: pump -> nozzle -> mode -> details -> confirmation
  const getStepSequence = () => {
    // For progress dots, show 5 steps regardless of mode
    // Step 4 varies by mode (vehicle or transfer), Step 5 is confirmation
    return ["pump", "nozzle", "mode", "details", "confirmation"];
  };

  // Map current step to sequence position for progress indicator
  const getCurrentStepIndex = () => {
    const stepMapping = {
      pump: 0,
      nozzle: 1,
      mode: 2,
      vehicle: 3,
      transfer: 3,
      volume: 4,
      confirmation: 4,
    };
    return stepMapping[currentStep] ?? 0;
  };

  const stepInfo = getStepInfo();
  const connectionConfig = getConnectionConfig();

  // Get tank display name
  const getTankDisplayName = () => {
    if (!selectedTank) return null;
    return (
      selectedTank.name ||
      selectedTank.tankName ||
      `Tank ${selectedTank.probeId || selectedTank.id}`
    );
  };

  return (
    <View style={styles.container}>
      {/* Top Row - Site & Connection */}
      <View style={styles.topRow}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={18} color="white" />
        </TouchableOpacity>

        <View style={styles.siteInfo}>
          <Text style={styles.siteLabel}>Site</Text>
          <Text style={styles.siteName} numberOfLines={1}>
            {siteName || "Unknown Site"}
          </Text>
        </View>

        <View style={styles.connectionInfo}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: deviceOnline ? "#10b981" : "#ef4444" },
            ]}
          />
          <Text
            style={[
              styles.connectionText,
              { color: deviceOnline ? "#10b981" : "#ef4444" },
            ]}
          >
            {deviceOnline ? "Online" : "Offline"}
          </Text>
        </View>
      </View>

      {/* Device ID */}
      <View style={styles.deviceRow}>
        <Icon name="microchip" size={14} color="#93c5fd" />
        <Text style={styles.deviceId}>{deviceId}</Text>
      </View>

      {/* Active Fueling Banners - Show all pumps that are actively fueling */}
      {activeFuelingPumps && activeFuelingPumps.length > 0 && onViewFueling && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.activeFuelingsContainer}
          contentContainerStyle={styles.activeFuelingsContent}
        >
          {activeFuelingPumps.map((pump, index) => (
            <TouchableOpacity
              key={`${pump.pumpId || pump.id}-${index}`}
              style={[
                styles.activeFuelingBanner,
                activeFuelingPumps.length > 1 &&
                  styles.activeFuelingBannerCompact,
              ]}
              onPress={() => onViewFueling(pump)}
              activeOpacity={0.8}
            >
              <View style={styles.activeFuelingPulse} />
              <View style={styles.activeFuelingContent}>
                <View style={styles.activeFuelingInfo}>
                  <Icon name="gas-pump" size={16} color="#fbbf24" />
                  <View style={styles.activeFuelingDetails}>
                    <Text style={styles.activeFuelingTitle}>
                      Pump {pump.id || pump.pumpId}
                    </Text>
                    <Text style={styles.activeFuelingVolume}>
                      {(pump.volume || pump.currentVolume || 0).toFixed(2)}L
                    </Text>
                  </View>
                </View>
                <View style={styles.viewFuelingButton}>
                  <Text style={styles.viewFuelingText}>View</Text>
                  <Icon name="chevron-right" size={12} color="#1f2937" />
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
      {/* Fallback for single active pump (backward compatibility) */}
      {(!activeFuelingPumps || activeFuelingPumps.length === 0) &&
        activeFuelingPump &&
        onViewFueling && (
          <TouchableOpacity
            style={styles.activeFuelingBanner}
            onPress={() => onViewFueling(activeFuelingPump)}
            activeOpacity={0.8}
          >
            <View style={styles.activeFuelingPulse} />
            <View style={styles.activeFuelingContent}>
              <View style={styles.activeFuelingInfo}>
                <Icon name="gas-pump" size={16} color="#fbbf24" />
                <View style={styles.activeFuelingDetails}>
                  <Text style={styles.activeFuelingTitle}>
                    Pump {activeFuelingPump.id || activeFuelingPump.pumpId}{" "}
                    Fueling
                  </Text>
                  <Text style={styles.activeFuelingVolume}>
                    {(
                      activeFuelingPump.volume ||
                      activeFuelingPump.currentVolume ||
                      0
                    ).toFixed(2)}
                    L
                  </Text>
                </View>
              </View>
              <View style={styles.viewFuelingButton}>
                <Text style={styles.viewFuelingText}>View</Text>
                <Icon name="chevron-right" size={12} color="#1f2937" />
              </View>
            </View>
          </TouchableOpacity>
        )}

      {/* Selected Tank Banner - Show when tank is selected and not on tank selection step */}
      {selectedTank && currentStep !== "tank" && (
        <View style={styles.tankBanner}>
          <View style={styles.tankInfo}>
            <Icon name="gas-pump" size={16} color="#10b981" />
            <View style={styles.tankDetails}>
              <Text style={styles.tankLabel}>Source Tank</Text>
              <Text style={styles.tankName}>{getTankDisplayName()}</Text>
            </View>
            {selectedTank.fuelType && (
              <View style={styles.fuelBadge}>
                <Text style={styles.fuelBadgeText}>
                  {selectedTank.fuelType}
                </Text>
              </View>
            )}
          </View>
          {onChangeTank && (
            <TouchableOpacity
              style={styles.changeTankButton}
              onPress={onChangeTank}
            >
              <Icon name="exchange-alt" size={12} color="#3b82f6" />
              <Text style={styles.changeTankText}>Change</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Step Progress */}
      <View style={styles.stepContainer}>
        <View style={styles.stepProgress}>
          {getStepSequence().map((step, index) => {
            const currentIndex = getCurrentStepIndex();
            const isActive = index === currentIndex;
            const isPast = index < currentIndex;

            return (
              <React.Fragment key={step}>
                {index > 0 && (
                  <View
                    style={[
                      styles.stepLine,
                      (isPast || isActive) && styles.stepLineActive,
                    ]}
                  />
                )}
                <View
                  style={[
                    styles.stepDot,
                    isActive && styles.stepDotActive,
                    isPast && styles.stepDotPast,
                  ]}
                >
                  {isPast && <Icon name="check" size={10} color="white" />}
                </View>
              </React.Fragment>
            );
          })}
        </View>
        <View style={styles.stepInfo}>
          <Text style={styles.stepLabel}>{stepInfo.label}</Text>
          <Text style={styles.stepName}>{stepInfo.name}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#1f2937",
    paddingTop: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  siteInfo: {
    flex: 1,
  },
  siteLabel: {
    fontSize: 10,
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  siteName: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
  },
  connectionInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
  },
  connectionText: {
    fontSize: 12,
    marginLeft: 6,
    fontWeight: "500",
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  deviceRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    marginLeft: 40, // Align with site info
  },
  deviceId: {
    fontSize: 12,
    color: "#93c5fd",
    marginLeft: 6,
    flex: 1,
  },
  serverStatus: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  serverStatusText: {
    fontSize: 10,
    marginLeft: 4,
  },
  stepContainer: {
    marginTop: 8,
  },
  stepProgress: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#374151",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#4b5563",
  },
  stepDotActive: {
    backgroundColor: "#3b82f6",
    borderColor: "#3b82f6",
  },
  stepDotPast: {
    backgroundColor: "#10b981",
    borderColor: "#10b981",
  },
  stepLine: {
    width: 32,
    height: 2,
    backgroundColor: "#4b5563",
  },
  stepLineActive: {
    backgroundColor: "#10b981",
  },
  stepInfo: {
    alignItems: "center",
  },
  stepLabel: {
    fontSize: 11,
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  stepName: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    marginTop: 2,
  },
  // Tank Banner Styles
  tankBanner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(16, 185, 129, 0.3)",
  },
  tankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  tankDetails: {
    marginLeft: 10,
    flex: 1,
  },
  tankLabel: {
    fontSize: 10,
    color: "#93c5fd",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  tankName: {
    fontSize: 14,
    fontWeight: "600",
    color: "white",
  },
  fuelBadge: {
    backgroundColor: "rgba(59, 130, 246, 0.3)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginRight: 8,
  },
  fuelBadgeText: {
    fontSize: 10,
    color: "#93c5fd",
    fontWeight: "500",
  },
  changeTankButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(59, 130, 246, 0.2)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.4)",
  },
  changeTankText: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 6,
  },
  // Active Fueling Container Styles (for multiple fuelings)
  activeFuelingsContainer: {
    marginBottom: 12,
  },
  activeFuelingsContent: {
    flexDirection: "row",
    gap: 10,
  },
  // Active Fueling Banner Styles
  activeFuelingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(251, 191, 36, 0.2)",
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(251, 191, 36, 0.4)",
    position: "relative",
    overflow: "hidden",
  },
  activeFuelingBannerCompact: {
    marginBottom: 0,
    minWidth: 180,
    maxWidth: 220,
  },
  activeFuelingPulse: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 4,
    backgroundColor: "#fbbf24",
  },
  activeFuelingContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginLeft: 8,
  },
  activeFuelingInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  activeFuelingDetails: {
    marginLeft: 10,
    flex: 1,
  },
  activeFuelingTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#fbbf24",
  },
  activeFuelingVolume: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginTop: 2,
  },
  viewFuelingButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fbbf24",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  viewFuelingText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginRight: 4,
  },
});

export default FuelingHeader;
