//Cursor - Mobile Fueling Header Component
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const FuelingHeader = ({
  siteName,
  deviceId,
  currentStep,
  connectionStatus,
  onBack,
  selectedTank,
  operationMode,
  onChangeTank,
}) => {
  // Get step info based on operation mode
  // When tank is already selected, the tank step is skipped from the flow
  const getStepInfo = () => {
    const hasTankSelected = !!selectedTank;

    // Tank Transfer flow
    if (operationMode === "transfer") {
      if (hasTankSelected) {
        // Skip tank step: pump -> nozzle -> mode -> transfer (4 steps)
        switch (currentStep) {
          case "pump":
            return { label: "Step 1 of 4", name: "Select Pump" };
          case "nozzle":
            return { label: "Step 2 of 4", name: "Select Nozzle" };
          case "mode":
            return { label: "Step 3 of 4", name: "Select Mode" };
          case "transfer":
            return { label: "Step 4 of 4", name: "Transfer Details" };
          default:
            return { label: "", name: "" };
        }
      } else {
        switch (currentStep) {
          case "tank":
            return { label: "Step 1 of 5", name: "Select Source Tank" };
          case "pump":
            return { label: "Step 2 of 5", name: "Select Pump" };
          case "nozzle":
            return { label: "Step 3 of 5", name: "Select Nozzle" };
          case "mode":
            return { label: "Step 4 of 5", name: "Select Mode" };
          case "transfer":
            return { label: "Step 5 of 5", name: "Transfer Details" };
          default:
            return { label: "", name: "" };
        }
      }
    }
    // Vehicle Fueling flow
    else if (operationMode === "vehicle") {
      if (hasTankSelected) {
        // Skip tank step: pump -> nozzle -> mode -> vehicle -> volume -> details (5 steps)
        switch (currentStep) {
          case "pump":
            return { label: "Step 1 of 5", name: "Select Pump" };
          case "nozzle":
            return { label: "Step 2 of 5", name: "Select Nozzle" };
          case "mode":
            return { label: "Step 3 of 5", name: "Select Mode" };
          case "vehicle":
            return { label: "Step 4 of 5", name: "Select Vehicle" };
          case "volume":
            return { label: "Step 5 of 5", name: "Fueling Details" };
          default:
            return { label: "", name: "" };
        }
      } else {
        switch (currentStep) {
          case "tank":
            return { label: "Step 1 of 6", name: "Select Source Tank" };
          case "pump":
            return { label: "Step 2 of 6", name: "Select Pump" };
          case "nozzle":
            return { label: "Step 3 of 6", name: "Select Nozzle" };
          case "mode":
            return { label: "Step 4 of 6", name: "Select Mode" };
          case "vehicle":
            return { label: "Step 5 of 6", name: "Select Vehicle" };
          case "volume":
            return { label: "Step 6 of 6", name: "Fueling Details" };
          default:
            return { label: "", name: "" };
        }
      }
    }
    // Initial flow (before mode selection)
    else {
      if (hasTankSelected) {
        // Skip tank step: pump -> nozzle -> mode (3 steps)
        switch (currentStep) {
          case "pump":
            return { label: "Step 1 of 3", name: "Select Pump" };
          case "nozzle":
            return { label: "Step 2 of 3", name: "Select Nozzle" };
          case "mode":
            return { label: "Step 3 of 3", name: "Select Mode" };
          default:
            return { label: "", name: "" };
        }
      } else {
        switch (currentStep) {
          case "tank":
            return { label: "Step 1 of 4", name: "Select Source Tank" };
          case "pump":
            return { label: "Step 2 of 4", name: "Select Pump" };
          case "nozzle":
            return { label: "Step 3 of 4", name: "Select Nozzle" };
          case "mode":
            return { label: "Step 4 of 4", name: "Select Mode" };
          default:
            return { label: "", name: "" };
        }
      }
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

  // Get step sequence based on operation mode
  const getStepSequence = () => {
    if (operationMode === "transfer") {
      return ["tank", "pump", "nozzle", "mode", "transfer"];
    } else if (operationMode === "vehicle") {
      return ["tank", "pump", "nozzle", "mode", "vehicle", "volume"];
    } else {
      return ["tank", "pump", "nozzle", "mode"];
    }
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
          <Icon
            name={connectionConfig.icon}
            size={14}
            color={connectionConfig.color}
          />
          <Text
            style={[styles.connectionText, { color: connectionConfig.color }]}
          >
            {connectionConfig.text}
          </Text>
        </View>
      </View>

      {/* Device ID */}
      <View style={styles.deviceRow}>
        <Icon name="microchip" size={14} color="#93c5fd" />
        <Text style={styles.deviceId}>{deviceId}</Text>
      </View>

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
            const isActive = currentStep === step;
            const isPast = getStepSequence().indexOf(currentStep) > index;

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
});

export default FuelingHeader;
