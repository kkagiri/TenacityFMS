/**
 * VehicleFuelingHistory.js
 * Purpose: Display fuel dispensing/refill history for a vehicle
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";

const VehicleFuelingHistory = ({ vehicle }) => {
  const [fuelingData, setFuelingData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [summary, setSummary] = useState({
    totalRefills: 0,
    totalFuel: 0,
    avgPerRefill: 0,
  });

  useEffect(() => {
    if (vehicle?.vehicleId) {
      loadFuelingData();
    }
  }, [vehicle?.vehicleId]);

  const loadFuelingData = async (refresh = false) => {
    if (!vehicle?.vehicleId) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await ApiService.getVehicleFuelingHistory(
        vehicle.vehicleId,
        dateRange.from.toISOString(),
        dateRange.to.toISOString()
      );

      if (response && Array.isArray(response)) {
        const processedData = response.map((item, index) => ({
          id: item.id || index,
          date: item.date ? new Date(item.date) : new Date(),
          tankName: item.tankName || "Tank",
          fuelType: item.fuelType || "Diesel",
          fuelAmount: item.manualFuelrefillAmount || item.fuelAmount || 0,
          siteName: item.siteName || "N/A",
          fueledBy: item.fuelBy || item.fueledBy || item.driverName || "N/A",
          previousMeterReading: item.previousMeterReading || 0,
          currentMeterReading: item.currentMeterReading || 0,
          distanceOrEngineHours: item.distanceOrEngineHours || 0,
          consumption: item.consumption || 0,
          isKmL: item.isKmL ?? true,
          comment: item.comment || "",
        }));

        setFuelingData(processedData);

        // Calculate summary
        const totalFuel = processedData.reduce(
          (sum, item) => sum + item.fuelAmount,
          0
        );
        const avgPerRefill =
          processedData.length > 0 ? totalFuel / processedData.length : 0;

        setSummary({
          totalRefills: processedData.length,
          totalFuel: totalFuel.toFixed(1),
          avgPerRefill: avgPerRefill.toFixed(1),
        });
      } else if (response?.data && Array.isArray(response.data)) {
        setFuelingData(response.data);
      } else {
        setFuelingData([]);
      }
    } catch (err) {
      console.error("[VehicleFuelingHistory] Error:", err);
      setError(err.message || "Failed to load fueling data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    loadFuelingData(true);
  }, [vehicle?.vehicleId]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const formatTime = (date) => {
    if (!date) return "";
    return date.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleRecordPress = (record) => {
    setSelectedRecord(record);
    setDetailsVisible(true);
  };

  const FuelingCard = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => handleRecordPress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.dateTimeContainer}>
          <View style={styles.dateRow}>
            <Icon name="calendar-alt" size={14} color="#2563eb" />
            <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          </View>
          <Text style={styles.timeText}>{formatTime(item.date)}</Text>
        </View>
        <View style={styles.amountContainer}>
          <Icon name="gas-pump" size={16} color="#f59e0b" />
          <Text style={styles.amountText}>{item.fuelAmount.toFixed(1)} L</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        <View style={styles.infoGrid}>
          <View style={styles.infoItem}>
            <Icon name="map-marker-alt" size={12} color="#9ca3af" />
            <Text style={styles.infoLabel}>Site</Text>
            <Text style={styles.infoValue}>{item.siteName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="database" size={12} color="#9ca3af" />
            <Text style={styles.infoLabel}>Tank</Text>
            <Text style={styles.infoValue}>{item.tankName}</Text>
          </View>
          <View style={styles.infoItem}>
            <Icon name="user" size={12} color="#9ca3af" />
            <Text style={styles.infoLabel}>By</Text>
            <Text style={styles.infoValue}>{item.fueledBy}</Text>
          </View>
        </View>

        {item.consumption > 0 && (
          <View style={styles.consumptionRow}>
            <Icon name="chart-line" size={12} color="#10b981" />
            <Text style={styles.consumptionText}>
              Efficiency: {item.consumption.toFixed(2)}{" "}
              {item.isKmL ? "km/L" : "L/hr"}
            </Text>
          </View>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.viewDetailsText}>Tap for details</Text>
        <Icon name="chevron-right" size={12} color="#9ca3af" />
      </View>
    </TouchableOpacity>
  );

  const DetailsModal = () => (
    <Modal
      visible={detailsVisible}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setDetailsVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Refill Details</Text>
            <TouchableOpacity
              onPress={() => setDetailsVisible(false)}
              style={styles.closeButton}
            >
              <Icon name="times" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {selectedRecord && (
            <View style={styles.modalBody}>
              {/* Date & Time */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Date & Time</Text>
                <Text style={styles.detailValue}>
                  {formatDate(selectedRecord.date)} at{" "}
                  {formatTime(selectedRecord.date)}
                </Text>
              </View>

              {/* Fuel Amount */}
              <View style={styles.detailHighlight}>
                <Icon name="gas-pump" size={24} color="#f59e0b" />
                <View style={styles.detailHighlightInfo}>
                  <Text style={styles.detailHighlightValue}>
                    {selectedRecord.fuelAmount.toFixed(1)} L
                  </Text>
                  <Text style={styles.detailHighlightLabel}>
                    {selectedRecord.fuelType}
                  </Text>
                </View>
              </View>

              {/* Location */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Location</Text>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Site</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.siteName}
                  </Text>
                </View>
                <View style={styles.detailRow}>
                  <Text style={styles.detailLabel}>Tank</Text>
                  <Text style={styles.detailValue}>
                    {selectedRecord.tankName}
                  </Text>
                </View>
              </View>

              {/* Meter Readings */}
              {(selectedRecord.previousMeterReading > 0 ||
                selectedRecord.currentMeterReading > 0) && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Meter Readings</Text>
                  <View style={styles.meterCompare}>
                    <View style={styles.meterBox}>
                      <Text style={styles.meterLabel}>Previous</Text>
                      <Text style={styles.meterValue}>
                        {selectedRecord.previousMeterReading.toLocaleString()}
                      </Text>
                    </View>
                    <Icon name="arrow-right" size={14} color="#9ca3af" />
                    <View style={styles.meterBox}>
                      <Text style={styles.meterLabel}>Current</Text>
                      <Text style={styles.meterValue}>
                        {selectedRecord.currentMeterReading.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                  {selectedRecord.distanceOrEngineHours > 0 && (
                    <View style={styles.distanceRow}>
                      <Icon name="road" size={12} color="#3b82f6" />
                      <Text style={styles.distanceText}>
                        Distance/Hours:{" "}
                        {selectedRecord.distanceOrEngineHours.toFixed(1)}
                      </Text>
                    </View>
                  )}
                </View>
              )}

              {/* Efficiency */}
              {selectedRecord.consumption > 0 && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Efficiency</Text>
                  <View style={styles.efficiencyBox}>
                    <Icon name="chart-line" size={18} color="#10b981" />
                    <Text style={styles.efficiencyValue}>
                      {selectedRecord.consumption.toFixed(2)}{" "}
                      {selectedRecord.isKmL ? "km/L" : "L/hr"}
                    </Text>
                  </View>
                </View>
              )}

              {/* Fueled By */}
              <View style={styles.detailSection}>
                <Text style={styles.detailSectionTitle}>Fueled By</Text>
                <Text style={styles.detailValue}>
                  {selectedRecord.fueledBy}
                </Text>
              </View>

              {/* Comment */}
              {selectedRecord.comment && (
                <View style={styles.detailSection}>
                  <Text style={styles.detailSectionTitle}>Comment</Text>
                  <Text style={styles.commentText}>
                    {selectedRecord.comment}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  if (!vehicle) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="tint" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No vehicle selected</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading fueling history...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Icon name="exclamation-triangle" size={48} color="#f59e0b" />
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity
          style={styles.retryButton}
          onPress={() => loadFuelingData()}
        >
          <Icon name="redo" size={14} color="white" />
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Summary Header */}
      <View style={styles.summaryContainer}>
        <View style={styles.summaryCard}>
          <Icon name="sync" size={18} color="#6366f1" />
          <Text style={styles.summaryValue}>{summary.totalRefills}</Text>
          <Text style={styles.summaryLabel}>Total Refills</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="gas-pump" size={18} color="#f59e0b" />
          <Text style={styles.summaryValue}>{summary.totalFuel}</Text>
          <Text style={styles.summaryLabel}>Total Fuel (L)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="tint" size={18} color="#10b981" />
          <Text style={styles.summaryValue}>{summary.avgPerRefill}</Text>
          <Text style={styles.summaryLabel}>Avg/Refill (L)</Text>
        </View>
      </View>

      {/* Date Range Indicator */}
      <View style={styles.dateRangeContainer}>
        <Icon name="calendar" size={14} color="#6b7280" />
        <Text style={styles.dateRangeText}>
          {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
        </Text>
      </View>

      {/* List */}
      {fuelingData.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Icon name="inbox" size={48} color="#d1d5db" />
          <Text style={styles.noDataText}>No refill records found</Text>
          <Text style={styles.noDataSubtext}>for the selected date range</Text>
        </View>
      ) : (
        <FlatList
          data={fuelingData}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => <FuelingCard item={item} />}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#2563eb"]}
            />
          }
        />
      )}

      <DetailsModal />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
    paddingHorizontal: 24,
  },
  errorText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
  },
  retryButtonText: {
    color: "white",
    fontWeight: "600",
    marginLeft: 8,
  },
  summaryContainer: {
    flexDirection: "row",
    padding: 16,
    gap: 8,
  },
  summaryCard: {
    flex: 1,
    backgroundColor: "white",
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
  dateRangeContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  dateRangeText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 12,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  dateTimeContainer: {
    flex: 1,
  },
  dateRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  timeText: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
    marginLeft: 22,
  },
  amountContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
  },
  amountText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#f59e0b",
    marginLeft: 6,
  },
  cardBody: {
    padding: 12,
  },
  infoGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoItem: {
    flex: 1,
    alignItems: "center",
  },
  infoLabel: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 4,
  },
  infoValue: {
    fontSize: 12,
    fontWeight: "500",
    color: "#1f2937",
    marginTop: 2,
    textAlign: "center",
  },
  consumptionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ecfdf5",
    padding: 8,
    borderRadius: 8,
    marginTop: 10,
  },
  consumptionText: {
    fontSize: 13,
    color: "#10b981",
    fontWeight: "600",
    marginLeft: 6,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  viewDetailsText: {
    fontSize: 12,
    color: "#9ca3af",
    marginRight: 4,
  },
  noDataContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  noDataText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  noDataSubtext: {
    marginTop: 4,
    fontSize: 14,
    color: "#9ca3af",
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  detailSection: {
    marginBottom: 16,
  },
  detailSectionTitle: {
    fontSize: 12,
    color: "#9ca3af",
    textTransform: "uppercase",
    marginBottom: 8,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  detailHighlight: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fffbeb",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  detailHighlightInfo: {
    marginLeft: 12,
  },
  detailHighlightValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f59e0b",
  },
  detailHighlightLabel: {
    fontSize: 14,
    color: "#92400e",
  },
  meterCompare: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  meterBox: {
    flex: 1,
    alignItems: "center",
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 8,
  },
  meterLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  meterValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
  },
  distanceText: {
    fontSize: 13,
    color: "#3b82f6",
    fontWeight: "500",
    marginLeft: 6,
  },
  efficiencyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    padding: 12,
    borderRadius: 10,
  },
  efficiencyValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
    marginLeft: 10,
  },
  commentText: {
    fontSize: 14,
    color: "#4b5563",
    lineHeight: 20,
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 8,
  },
});

export default VehicleFuelingHistory;
