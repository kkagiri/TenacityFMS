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
  // Get fuel grade info for a nozzle
  const getFuelGradeInfo = (nozzleId) => {
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
    const gradeInfo = getFuelGradeInfo(nozzle.id);
    const fuelColor = getFuelTypeColor(gradeInfo.fuelType);

    return (
      <TouchableOpacity
        key={nozzle.id}
        style={styles.nozzleCard}
        onPress={() => onNozzleSelect(nozzle)}
        activeOpacity={0.7}
      >
        {/* Icon Container */}
        <View
          style={[
            styles.nozzleIconContainer,
            { backgroundColor: fuelColor + "20" },
          ]}
        >
          <Icon name="tint" size={24} color={fuelColor} />
        </View>

        {/* Nozzle Info */}
        <View style={styles.nozzleInfo}>
          <Text style={styles.nozzleName}>
            Nozzle {nozzle.nozzleNumber || nozzle.id}
          </Text>

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
          <Icon name="chevron-right" size={16} color="#9ca3af" />
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

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Icon name="info-circle" size={16} color="#6b7280" />
        <Text style={styles.helpText}>Tap to select the fuel type</Text>
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
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  helpContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: "#f9fafb",
    borderRadius: 8,
  },
  helpText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
});

export default NozzleSelectionStep;
