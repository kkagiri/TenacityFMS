/**
 * VehicleConsumptionHistory.js
 * Purpose: Display fuel consumption history for a vehicle
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
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";

const VehicleConsumptionHistory = ({ vehicle }) => {
  const [consumptionData, setConsumptionData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState({
    from: new Date(new Date().setDate(new Date().getDate() - 30)),
    to: new Date(),
  });
  const [summary, setSummary] = useState({
    totalFuel: 0,
    totalDistance: 0,
    avgEfficiency: 0,
    recordCount: 0,
  });

  useEffect(() => {
    if (vehicle?.vehicleId) {
      loadConsumptionData();
    }
  }, [vehicle?.vehicleId]);

  const loadConsumptionData = async (refresh = false) => {
    if (!vehicle?.vehicleId) return;

    try {
      if (refresh) {
        setIsRefreshing(true);
      } else {
        setIsLoading(true);
      }
      setError(null);

      const response = await ApiService.getVehicleConsumptionHistory(
        vehicle.vehicleId,
        dateRange.from.toISOString(),
        dateRange.to.toISOString()
      );

      if (response && Array.isArray(response)) {
        const processedData = response.map((item, index) => ({
          id: item.id || index,
          date: item.date ? new Date(item.date) : new Date(),
          site: item.siteName || item.site || "N/A",
          driver: item.driverName || item.employee || "N/A",
          fuelType: item.fuelType || "Diesel",
          totalDistance: item.totalDistance || item.distance || 0,
          totalFuel: item.totalFuel || item.fuelUsed || 0,
          avgEfficiency: item.avgEfficiency || item.consumption || 0,
          openingMeter: item.openingMeter || 0,
          closingMeter: item.closingMeter || 0,
          engHours: item.engHours || item.engineHours || 0,
          openingFuelLevel: item.openingFuelLevel || 0,
          closingFuelLevel: item.closingFuelLevel || 0,
          fuelLost: item.fuelLost || 0,
          excessFuel: item.excessFuel || 0,
          stockReceived: item.stockReceived || 0,
          remarks: item.remarks || "",
        }));

        setConsumptionData(processedData);

        // Calculate summary
        const totalFuel = processedData.reduce(
          (sum, item) => sum + item.totalFuel,
          0
        );
        const totalDistance = processedData.reduce(
          (sum, item) => sum + item.totalDistance,
          0
        );
        const avgEfficiency = totalDistance > 0 ? totalDistance / totalFuel : 0;

        setSummary({
          totalFuel: totalFuel.toFixed(1),
          totalDistance: totalDistance.toFixed(1),
          avgEfficiency: avgEfficiency.toFixed(2),
          recordCount: processedData.length,
        });
      } else if (response?.data && Array.isArray(response.data)) {
        // Handle wrapped response
        setConsumptionData(response.data);
      } else {
        setConsumptionData([]);
      }
    } catch (err) {
      console.error("[VehicleConsumptionHistory] Error:", err);
      setError(err.message || "Failed to load consumption data");
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = useCallback(() => {
    loadConsumptionData(true);
  }, [vehicle?.vehicleId]);

  const formatDate = (date) => {
    if (!date) return "N/A";
    return date.toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const ConsumptionCard = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View style={styles.dateContainer}>
          <Icon name="calendar-alt" size={14} color="#2563eb" />
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
        </View>
        <View style={styles.siteBadge}>
          <Text style={styles.siteText}>{item.site}</Text>
        </View>
      </View>

      <View style={styles.cardBody}>
        {/* Primary Stats */}
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Icon name="gas-pump" size={16} color="#f59e0b" />
            <Text style={styles.statValue}>{item.totalFuel.toFixed(1)} L</Text>
            <Text style={styles.statLabel}>Fuel Used</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="road" size={16} color="#3b82f6" />
            <Text style={styles.statValue}>
              {item.totalDistance.toFixed(1)} km
            </Text>
            <Text style={styles.statLabel}>Distance</Text>
          </View>
          <View style={styles.statItem}>
            <Icon name="chart-line" size={16} color="#10b981" />
            <Text style={styles.statValue}>
              {item.avgEfficiency.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>km/L</Text>
          </View>
        </View>

        {/* Additional Info */}
        <View style={styles.infoRow}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Driver</Text>
            <Text style={styles.infoValue}>{item.driver}</Text>
          </View>
          {item.engHours > 0 && (
            <View style={styles.infoItem}>
              <Text style={styles.infoLabel}>Engine Hours</Text>
              <Text style={styles.infoValue}>{item.engHours.toFixed(1)}</Text>
            </View>
          )}
        </View>

        {/* Meter Readings */}
        {(item.openingMeter > 0 || item.closingMeter > 0) && (
          <View style={styles.meterRow}>
            <View style={styles.meterItem}>
              <Text style={styles.meterLabel}>Opening</Text>
              <Text style={styles.meterValue}>
                {item.openingMeter.toLocaleString()}
              </Text>
            </View>
            <Icon name="arrow-right" size={12} color="#9ca3af" />
            <View style={styles.meterItem}>
              <Text style={styles.meterLabel}>Closing</Text>
              <Text style={styles.meterValue}>
                {item.closingMeter.toLocaleString()}
              </Text>
            </View>
          </View>
        )}

        {/* Warnings */}
        {(item.fuelLost > 0 || item.excessFuel > 0) && (
          <View style={styles.warningsRow}>
            {item.fuelLost > 0 && (
              <View style={styles.warningBadge}>
                <Icon name="exclamation-triangle" size={12} color="#ef4444" />
                <Text style={styles.warningText}>
                  Lost: {item.fuelLost.toFixed(1)}L
                </Text>
              </View>
            )}
            {item.excessFuel > 0 && (
              <View style={[styles.warningBadge, styles.excessBadge]}>
                <Icon name="plus-circle" size={12} color="#f59e0b" />
                <Text style={[styles.warningText, styles.excessText]}>
                  Excess: {item.excessFuel.toFixed(1)}L
                </Text>
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );

  if (!vehicle) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="gas-pump" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No vehicle selected</Text>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading consumption history...</Text>
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
          onPress={() => loadConsumptionData()}
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
          <Icon name="gas-pump" size={18} color="#f59e0b" />
          <Text style={styles.summaryValue}>{summary.totalFuel}</Text>
          <Text style={styles.summaryLabel}>Total Fuel (L)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="road" size={18} color="#3b82f6" />
          <Text style={styles.summaryValue}>{summary.totalDistance}</Text>
          <Text style={styles.summaryLabel}>Distance (km)</Text>
        </View>
        <View style={styles.summaryCard}>
          <Icon name="chart-line" size={18} color="#10b981" />
          <Text style={styles.summaryValue}>{summary.avgEfficiency}</Text>
          <Text style={styles.summaryLabel}>Avg (km/L)</Text>
        </View>
      </View>

      {/* Date Range Indicator */}
      <View style={styles.dateRangeContainer}>
        <Icon name="calendar" size={14} color="#6b7280" />
        <Text style={styles.dateRangeText}>
          {formatDate(dateRange.from)} - {formatDate(dateRange.to)}
        </Text>
        <Text style={styles.recordCountText}>
          ({summary.recordCount} records)
        </Text>
      </View>

      {/* List */}
      {consumptionData.length === 0 ? (
        <View style={styles.noDataContainer}>
          <Icon name="inbox" size={48} color="#d1d5db" />
          <Text style={styles.noDataText}>No consumption records found</Text>
          <Text style={styles.noDataSubtext}>for the selected date range</Text>
        </View>
      ) : (
        <FlatList
          data={consumptionData}
          keyExtractor={(item) => item.id?.toString()}
          renderItem={({ item }) => <ConsumptionCard item={item} />}
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
  recordCountText: {
    fontSize: 12,
    color: "#9ca3af",
    marginLeft: 6,
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
  dateContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  dateText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 8,
  },
  siteBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  siteText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
  cardBody: {
    padding: 12,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 12,
  },
  statItem: {
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 4,
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  infoItem: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 11,
    color: "#9ca3af",
  },
  infoValue: {
    fontSize: 13,
    color: "#1f2937",
    fontWeight: "500",
    marginTop: 2,
  },
  meterRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f9fafb",
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  meterItem: {
    alignItems: "center",
    paddingHorizontal: 16,
  },
  meterLabel: {
    fontSize: 10,
    color: "#9ca3af",
  },
  meterValue: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
  },
  warningsRow: {
    flexDirection: "row",
    gap: 8,
  },
  warningBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  excessBadge: {
    backgroundColor: "#fffbeb",
  },
  warningText: {
    fontSize: 12,
    color: "#ef4444",
    fontWeight: "500",
    marginLeft: 6,
  },
  excessText: {
    color: "#f59e0b",
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
});

export default VehicleConsumptionHistory;
