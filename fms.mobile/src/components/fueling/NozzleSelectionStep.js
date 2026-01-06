import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const NozzleSelectionStep = ({
  pump,
  nozzles = [],
  fuelGrades = [],
  onNozzleSelect,
  onRefresh,
  onBack,
  isRefreshing = false,
}) => {
  // Get nozzle status based on pump state
  // nozzleUp from pump indicates which nozzle is currently lifted (0 = none)
  const getNozzleStatus = (nozzleId) => {
    // Check if nozzle is from status data
    const nozzle = nozzles.find((n) => n.id === nozzleId);
    if (nozzle?.status === "busy") return "busy";
    if (nozzle?.status === "offline") return "offline";

    // Check if this nozzle is lifted based on pump's nozzleUp value
    if (pump?.nozzleUp === nozzleId) return "lifted";

    // Check pump status to determine nozzle state
    if (pump?.status === "offline") return "offline";

    return "idle";
  };

  // Get status color for nozzle
  const getNozzleStatusColor = (status) => {
    switch (status) {
      case "idle":
        return "#10B981"; // Green - available
      case "lifted":
        return "#F59E0B"; // Yellow/Amber - nozzle up/ready
      case "busy":
        return "#3B82F6"; // Blue - currently fueling
      case "offline":
        return "#EF4444"; // Red - offline
      default:
        return "#6B7280"; // Gray
    }
  };

  // Get status icon for nozzle
  const getNozzleStatusIcon = (status) => {
    switch (status) {
      case "idle":
        return "check-circle";
      case "lifted":
        return "hand-point-up";
      case "busy":
        return "play-circle";
      case "offline":
        return "times-circle";
      default:
        return "question-circle";
    }
  };

  // Get status display text
  const getNozzleStatusText = (status) => {
    switch (status) {
      case "idle":
        return "AVAILABLE";
      case "lifted":
        return "LIFTED";
      case "busy":
        return "IN USE";
      case "offline":
        return "OFFLINE";
      default:
        return "UNKNOWN";
    }
  };

  // Check if nozzle is selectable
  const isNozzleSelectable = (status) => {
    return status === "idle" || status === "lifted";
  };
  // Get fuel grade info for a nozzle
  const getFuelGradeInfo = (nozzle) => {
    // First, check if the nozzle object already has fuel type/grade info from getNozzlesForPump
    if (nozzle?.fuelType || nozzle?.fuelGrade) {
      return {
        name: nozzle.fuelGrade?.name || nozzle.fuelType || nozzle.name,
        fuelType: nozzle.fuelType || nozzle.fuelGrade?.name || "Unknown",
        price: nozzle.price || nozzle.fuelGrade?.price || 0,
      };
    }

    // Fallback: look up from fuelGrades array
    const nozzleId = nozzle?.id || nozzle;
    const grade = fuelGrades.find(
      (g) => g.nozzle === nozzleId || g.id === nozzleId
    );
    return grade || { name: `Fuel ${nozzleId}`, fuelType: "Unknown" };
  };

  // Get color for fuel type
  const getFuelTypeColor = (fuelType) => {
    const type = (fuelType || "").toLowerCase();
    if (type.includes("diesel")) return "#f59e0b";
    if (type.includes("petrol") || type.includes("gasoline")) return "#10b981";
    if (type.includes("premium")) return "#8b5cf6";
    return "#3b82f6";
  };

  const renderNozzleItem = (nozzle) => {
    const gradeInfo = getFuelGradeInfo(nozzle);
    const fuelColor = getFuelTypeColor(gradeInfo.fuelType);
    const nozzleStatus = getNozzleStatus(nozzle.id);
    const statusColor = getNozzleStatusColor(nozzleStatus);
    const statusIcon = getNozzleStatusIcon(nozzleStatus);
    const statusText = getNozzleStatusText(nozzleStatus);
    const selectable = isNozzleSelectable(nozzleStatus);

    return (
      <TouchableOpacity
        key={nozzle.id}
        style={[
          styles.nozzleCard,
          selectable && styles.nozzleCardSelectable,
          !selectable && styles.nozzleCardDisabled,
        ]}
        onPress={() => selectable && onNozzleSelect(nozzle)}
        activeOpacity={0.7}
        disabled={!selectable}
      >
        {/* Icon Container */}
        <View
          style={[
            styles.nozzleIconContainer,
            { backgroundColor: statusColor + "20" },
          ]}
        >
          <Icon name="tint" size={24} color={statusColor} />
        </View>

        {/* Nozzle Info */}
        <View style={styles.nozzleInfo}>
          <Text style={styles.nozzleName}>
            Nozzle {nozzle.nozzleNumber || nozzle.id}
          </Text>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Icon name={statusIcon} size={10} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {statusText}
            </Text>
          </View>

          {/* Fuel Type Badge */}
          <View
            style={[
              styles.fuelTypeBadge,
              { backgroundColor: fuelColor + "20" },
            ]}
          >
            <Text style={[styles.fuelTypeText, { color: fuelColor }]}>
              {gradeInfo.fuelType || gradeInfo.name}
            </Text>
          </View>
        </View>

        {/* Selection indicator */}
        <View style={styles.selectIndicator}>
          {selectable ? (
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          ) : (
            <Icon name="times-circle" size={16} color="#ef4444" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Nozzle</Text>
          <Text style={styles.subtitle}>Tap a fuel type to continue</Text>
        </View>
        {onRefresh && (
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={onRefresh}
            disabled={isRefreshing}
          >
            {isRefreshing ? (
              <ActivityIndicator size="small" color="#6366f1" />
            ) : (
              <Icon name="sync" size={18} color="#6366f1" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Selected Pump Info */}
      <View style={styles.pumpInfoCard}>
        <View style={styles.pumpIconContainer}>
          <Icon name="gas-pump" size={20} color="#3b82f6" />
        </View>
        <View style={styles.pumpInfoText}>
          <Text style={styles.pumpInfoLabel}>Selected Pump</Text>
          <Text style={styles.pumpInfoValue}>
            {pump?.name || `Pump ${pump?.id}`}
          </Text>
        </View>
      </View>

      {/* Nozzle List */}
      <ScrollView
        style={styles.nozzleList}
        showsVerticalScrollIndicator={false}
      >
        {nozzles.length > 0 ? (
          nozzles.map(renderNozzleItem)
        ) : (
          <View style={styles.emptyState}>
            <Icon name="exclamation-circle" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No nozzles available</Text>
            <Text style={styles.emptySubtext}>
              Please check pump configuration
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Status Legend */}
      <View style={styles.footer}>
        <View style={styles.legendRow}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
            <Text style={styles.legendText}>Lifted</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#3B82F6" }]} />
            <Text style={styles.legendText}>In Use</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
            <Text style={styles.legendText}>Offline</Text>
          </View>
        </View>
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
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  refreshButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  subtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  pumpInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  pumpIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
  },
  pumpInfoText: {
    marginLeft: 12,
  },
  pumpInfoLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  pumpInfoValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  nozzleList: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  nozzleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "transparent",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nozzleCardSelectable: {
    borderColor: "#e5e7eb",
  },
  nozzleCardDisabled: {
    opacity: 0.5,
    backgroundColor: "#f9fafb",
  },
  nozzleIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  nozzleInfo: {
    flex: 1,
    marginLeft: 14,
  },
  nozzleName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  fuelTypeBadge: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    marginTop: 6,
  },
  fuelTypeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectIndicator: {
    marginLeft: 8,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
  },
  footer: {
    marginTop: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  legendRow: {
    flexDirection: "row",
    justifyContent: "center",
    flexWrap: "wrap",
  },
  legendItem: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 4,
  },
  legendText: {
    fontSize: 12,
    color: "#6b7280",
  },
});

export default NozzleSelectionStep;
