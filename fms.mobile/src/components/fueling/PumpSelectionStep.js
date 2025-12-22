import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import FuelingUtils from "../../utils/FuelingUtils";

const PumpSelectionStep = ({
  pumps = [],
  activePumps = [],
  onPumpSelect,
  onRefresh,
  connectionStatus,
  isMockData = false,
  isRefreshing = false,
  nozzleConfig = {},
}) => {
  // Auto-proceed when pump is selected
  const handlePumpSelect = (pump) => {
    onPumpSelect(pump);
    // Selection auto-proceeds in parent - no delay needed as parent handles next step
  };

  const renderPumpItem = ({ item: pump }) => {
    const isActive = activePumps.some((ap) => ap.pumpId === pump.id);
    const isSelectable = pump.status === "idle" || pump.status === "nozzleUp";
    const statusColor = FuelingUtils.getPumpStatusColor(pump.status);
    const statusIcon = FuelingUtils.getPumpStatusIcon(pump.status);
    const pumpNozzles = nozzleConfig[pump.id] || [];
    const nozzleCount = pumpNozzles.length;

    return (
      <TouchableOpacity
        style={[
          styles.pumpCard,
          isSelectable && styles.pumpCardSelectable,
          !isSelectable && styles.pumpCardDisabled,
        ]}
        onPress={() => isSelectable && handlePumpSelect(pump)}
        activeOpacity={0.7}
        disabled={!isSelectable}
      >
        {/* Icon Container */}
        <View
          style={[
            styles.pumpIconContainer,
            { backgroundColor: statusColor + "20" },
          ]}
        >
          <Icon name="gas-pump" size={24} color={statusColor} />
        </View>

        {/* Pump Info */}
        <View style={styles.pumpInfo}>
          <Text style={styles.pumpName}>{pump.name}</Text>

          {/* Status Badge */}
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusColor + "20" },
            ]}
          >
            <Icon name={statusIcon} size={10} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>
              {pump.status.toUpperCase()}
            </Text>
          </View>

          {/* Nozzle count */}
          {nozzleCount > 0 && (
            <View style={styles.nozzleInfo}>
              <Icon name="fill-drip" size={10} color="#6366f1" />
              <Text style={styles.nozzleText}>
                {nozzleCount} Nozzle{nozzleCount > 1 ? "s" : ""}
              </Text>
            </View>
          )}
        </View>

        {/* Selection indicator */}
        <View style={styles.selectIndicator}>
          {isSelectable ? (
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          ) : (
            <Icon name="times-circle" size={16} color="#ef4444" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerRow}>
        <View style={styles.headerTextContainer}>
          <Text style={styles.title}>Select Pump</Text>
          <Text style={styles.subtitle}>Tap an available pump to continue</Text>
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

      {/* Mock Data Banner */}
      {isMockData && (
        <View style={styles.mockBanner}>
          <Icon name="flask" size={14} color="#f59e0b" />
          <Text style={styles.mockText}>
            Using simulated pump data from PTS
          </Text>
        </View>
      )}

      {connectionStatus !== "connected" && !isMockData && (
        <View style={styles.connectionWarning}>
          <Icon name="exclamation-triangle" size={16} color="#f59e0b" />
          <Text style={styles.connectionText}>
            Device connection: {connectionStatus}
          </Text>
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.legendRow}>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#10B981" }]} />
          <Text style={styles.legendText}>Available</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#F59E0B" }]} />
          <Text style={styles.legendText}>Nozzle Up</Text>
        </View>
        <View style={styles.legendItem}>
          <View style={[styles.legendDot, { backgroundColor: "#EF4444" }]} />
          <Text style={styles.legendText}>Offline</Text>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={pumps}
      renderItem={renderPumpItem}
      keyExtractor={(item) => item.id.toString()}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
    paddingHorizontal: 16,
  },
  header: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTextContainer: {
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
  mockBanner: {
    backgroundColor: "#fef3c7",
    paddingVertical: 8,
    paddingHorizontal: 12,
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 8,
    marginTop: 12,
  },
  mockText: {
    fontSize: 13,
    color: "#92400e",
    marginLeft: 8,
    fontWeight: "500",
  },
  connectionWarning: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff3cd",
    padding: 12,
    borderRadius: 8,
    marginTop: 12,
  },
  connectionText: {
    marginLeft: 8,
    color: "#856404",
    fontSize: 14,
  },
  pumpCard: {
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
  pumpCardSelectable: {
    borderColor: "#e5e7eb",
  },
  pumpCardDisabled: {
    opacity: 0.5,
    backgroundColor: "#f9fafb",
  },
  pumpIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  pumpInfo: {
    flex: 1,
    marginLeft: 14,
  },
  pumpName: {
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
  nozzleInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
  },
  nozzleText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "500",
    marginLeft: 4,
  },
  selectIndicator: {
    marginLeft: 8,
  },
  footer: {
    marginTop: 12,
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

export default PumpSelectionStep;
