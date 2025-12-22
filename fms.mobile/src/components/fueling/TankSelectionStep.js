import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const TankSelectionStep = ({
  tanks,
  selectedTank,
  onSelectTank,
  onNext,
  onBack,
  onRefresh,
  isLoadingTanks = false,
  isRefreshing = false,
  isMockData = false,
}) => {
  // Auto-proceed when tank is selected
  const handleTankSelect = (tank) => {
    onSelectTank(tank);
    // Auto-proceed to next step after short delay for visual feedback
    // Pass tank directly to avoid state closure issues
    setTimeout(() => {
      onNext(tank);
    }, 150);
  };

  // Determine fill bar color based on level
  const getFillColor = (percentFull) => {
    if (percentFull < 20) return "#ef4444"; // Red - low
    if (percentFull < 50) return "#f59e0b"; // Amber - medium
    return "#10b981"; // Green - good
  };

  const renderTankItem = ({ item }) => {
    const isSelected = selectedTank?.id === item.id;
    const currentVolume = item.currentVolume || 0;
    const capacity = item.capacity || 50000;
    const percentFull =
      item.percentFull || Math.round((currentVolume / capacity) * 100);
    const temperature = item.temperature;

    return (
      <TouchableOpacity
        style={[styles.tankCard, isSelected && styles.tankCardSelected]}
        onPress={() => handleTankSelect(item)}
      >
        <View
          style={[
            styles.tankIconContainer,
            isSelected && styles.tankIconContainerSelected,
          ]}
        >
          <Icon
            name="database"
            size={24}
            color={isSelected ? "#ffffff" : "#6366f1"}
          />
        </View>
        <View style={styles.tankInfo}>
          <Text
            style={[styles.tankName, isSelected && styles.tankNameSelected]}
          >
            {item.name}
          </Text>

          {/* Product Badge */}
          {item.productName && (
            <View style={styles.productBadge}>
              <Text style={styles.productText}>{item.productName}</Text>
            </View>
          )}

          {/* Current Stock Display - Always show */}
          <View style={styles.stockContainer}>
            <View style={styles.stockRow}>
              <Icon name="fill-drip" size={12} color="#374151" />
              <Text style={styles.stockValue}>
                {currentVolume.toLocaleString()} L
              </Text>
              <Text style={styles.stockLabel}>current stock</Text>
            </View>

            {/* Percentage Bar */}
            <View style={styles.percentBar}>
              <View
                style={[
                  styles.percentFill,
                  {
                    width: `${percentFull}%`,
                    backgroundColor: getFillColor(percentFull),
                  },
                ]}
              />
            </View>

            {/* Percentage Text */}
            <Text
              style={[styles.percentText, { color: getFillColor(percentFull) }]}
            >
              {percentFull}% Full
            </Text>
          </View>

          {/* Temperature - Show if available */}
          {temperature !== undefined && (
            <View style={styles.tempRow}>
              <Icon name="temperature-low" size={12} color="#ef4444" />
              <Text style={styles.tempText}>{temperature}°C</Text>
            </View>
          )}
        </View>

        {/* Selection indicator */}
        <View style={styles.selectIndicator}>
          {isSelected ? (
            <Icon name="check-circle" size={24} color="#10b981" solid />
          ) : (
            <Icon name="chevron-right" size={16} color="#9ca3af" />
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <View style={styles.headerTextContainer}>
            <Text style={styles.stepTitle}>Select Source Tank</Text>
            <Text style={styles.stepDescription}>Tap a tank to continue</Text>
          </View>
          {onRefresh && (
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={onRefresh}
              disabled={isRefreshing || isLoadingTanks}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#6366f1" />
              ) : (
                <Icon name="sync" size={18} color="#6366f1" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Mock Data Indicator */}
      {isMockData && (
        <View style={styles.mockBanner}>
          <Icon name="flask" size={14} color="#f59e0b" />
          <Text style={styles.mockText}>
            Using simulated tank data from PTS
          </Text>
        </View>
      )}

      {/* Tank List */}
      {isLoadingTanks ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#6366f1" />
          <Text style={styles.loadingText}>Loading tanks...</Text>
        </View>
      ) : tanks?.length > 0 ? (
        <FlatList
          data={tanks}
          keyExtractor={(item) =>
            item.id?.toString() || item.probeId?.toString()
          }
          renderItem={renderTankItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Icon name="database" size={48} color="#9ca3af" />
          <Text style={styles.emptyTitle}>No Tanks Available</Text>
          <Text style={styles.emptyText}>
            {isMockData
              ? "No probe data available in PTS status"
              : "No tanks found for this site. Please check your configuration."}
          </Text>
        </View>
      )}

      {/* Back Button Only */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={16} color="#6b7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>
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
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#6366f1",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  stepNumberText: {
    color: "white",
    fontWeight: "700",
    fontSize: 14,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  stepDescription: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 38,
  },
  listContainer: {
    padding: 16,
  },
  tankCard: {
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
  tankCardSelected: {
    borderColor: "#6366f1",
    backgroundColor: "#f0f0ff",
  },
  tankIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  tankIconContainerSelected: {
    backgroundColor: "#6366f1",
  },
  tankInfo: {
    flex: 1,
    marginLeft: 14,
  },
  tankName: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
  },
  tankNameSelected: {
    color: "#4338ca",
  },
  tankDetails: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  productBadge: {
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 6,
  },
  productText: {
    fontSize: 12,
    color: "#1d4ed8",
    fontWeight: "500",
  },
  stockContainer: {
    marginTop: 8,
  },
  stockRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  stockValue: {
    fontSize: 15,
    color: "#1f2937",
    marginLeft: 6,
    fontWeight: "700",
  },
  stockLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 4,
  },
  percentBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
    marginVertical: 4,
  },
  percentFill: {
    height: "100%",
    borderRadius: 3,
  },
  percentText: {
    fontSize: 12,
    fontWeight: "600",
  },
  selectIndicator: {
    marginLeft: 8,
  },
  tempRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  tempText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
  },
  mockBanner: {
    backgroundColor: "#fef3c7",
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#fcd34d",
  },
  mockText: {
    fontSize: 13,
    color: "#92400e",
    marginLeft: 8,
    fontWeight: "500",
  },
  checkIcon: {
    marginLeft: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
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
  nextButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#6366f1",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: "#c7d2fe",
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
});

export default TankSelectionStep;
