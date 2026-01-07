import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

/**
 * VehicleConfirmationStep - Displays vehicle details and fueling rules for confirmation
 * @param {Object} vehicle - Selected vehicle object
 * @param {Object} rules - Fueling rules for the vehicle
 * @param {string} selectionMode - How the vehicle was selected ('rfid' | 'manual')
 * @param {string} scannedTagId - RFID tag ID if scanned
 * @param {Function} onConfirm - Callback when user confirms
 * @param {Function} onCancel - Callback when user cancels
 * @param {Function} onRefresh - Callback to refresh vehicle details and rules
 * @param {boolean} isRefreshing - Whether refresh is in progress
 */
const VehicleConfirmationStep = ({
  vehicle,
  rules,
  selectionMode,
  scannedTagId,
  onConfirm,
  onCancel,
  onRefresh,
  isRefreshing = false,
}) => {
  if (!vehicle || !rules) return null;

  // Format limit values for display
  const formatLiters = (value) => {
    if (value === null || value === undefined) return "N/A";
    return `${Number(value).toLocaleString()} L`;
  };

  // Format limit values - show "Unlimited" when 0
  const formatLimit = (value) => {
    if (value === null || value === undefined) return "N/A";
    if (value === 0) return "Unlimited";
    return `${Number(value).toLocaleString()} L`;
  };

  const formatTimeWindow = () => {
    if (rules.timeWindowStart && rules.timeWindowEnd) {
      return `${rules.timeWindowStart} - ${rules.timeWindowEnd}`;
    }
    return "24 Hours";
  };

  // Calculate status colors - handle unlimited (0) as normal
  const getDailyStatus = () => {
    if (!rules.dailyLimit || rules.dailyLimit === 0) return "normal"; // Unlimited
    const remaining = rules.dailyRemaining || 0;
    if (remaining <= 0) return "danger";
    if (remaining < 50) return "warning";
    return "normal";
  };

  const getMonthlyStatus = () => {
    if (!rules.monthlyLimit || rules.monthlyLimit === 0) return "normal"; // Unlimited
    const remaining = rules.monthlyRemaining || 0;
    if (remaining <= 0) return "danger";
    if (remaining < 200) return "warning";
    return "normal";
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "danger":
        return styles.ruleValueDanger;
      case "warning":
        return styles.ruleValueWarning;
      default:
        return {};
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View style={styles.headerTitleContainer}>
            <Text style={styles.stepTitle}>Confirm Vehicle</Text>
            <Text style={styles.stepDescription}>
              Review vehicle details and fueling limits
            </Text>
          </View>
          {onRefresh && (
            <TouchableOpacity
              style={[
                styles.refreshButton,
                isRefreshing && styles.refreshButtonDisabled,
              ]}
              onPress={onRefresh}
              disabled={isRefreshing}
            >
              {isRefreshing ? (
                <ActivityIndicator size="small" color="#3b82f6" />
              ) : (
                <Icon name="sync-alt" size={18} color="#3b82f6" />
              )}
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Scanned Tag Info (for RFID mode) */}
        {selectionMode === "rfid" && scannedTagId && (
          <View style={styles.tagInfoCard}>
            <Icon name="wifi" size={16} color="#2563eb" />
            <Text style={styles.tagInfoText}>
              Tag ID: <Text style={styles.tagIdText}>{scannedTagId}</Text>
            </Text>
          </View>
        )}

        {/* Vehicle Info Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehicleIcon}>
              <Icon name="truck" size={24} color="#1f2937" />
            </View>
            <View style={styles.vehicleInfo}>
              <Text style={styles.vehicleHyoung}>{vehicle.hyoungNo}</Text>
              <Text style={styles.vehicleName}>{vehicle.vehicleName}</Text>
            </View>
          </View>

          <View style={styles.vehicleDetailsGrid}>
            <View style={styles.vehicleDetailItem}>
              <Icon name="id-card" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Plate</Text>
              <Text style={styles.vehicleDetailValue}>
                {vehicle.numberPlate || "N/A"}
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Icon name="gas-pump" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Tank</Text>
              <Text style={styles.vehicleDetailValue}>
                {vehicle.tankCapacity || rules.tankCapacity || 0} L
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Icon name="user" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Driver</Text>
              <Text style={styles.vehicleDetailValue}>
                {vehicle.driverName || "Not Assigned"}
              </Text>
            </View>
            <View style={styles.vehicleDetailItem}>
              <Icon name="map-marker-alt" size={14} color="#6b7280" />
              <Text style={styles.vehicleDetailLabel}>Site</Text>
              <Text style={styles.vehicleDetailValue}>
                {vehicle.siteName || "N/A"}
              </Text>
            </View>
          </View>
        </View>

        {/* Maximum Allowed Fuel - Prominent Display */}
        <View style={styles.maxAllowedCard}>
          <View style={styles.maxAllowedHeader}>
            <Icon name="tachometer-alt" size={20} color="#10b981" />
            <Text style={styles.maxAllowedTitle}>Maximum Allowed</Text>
          </View>
          <Text style={styles.maxAllowedValue}>
            {formatLiters(rules.maxAllowedDose)}
          </Text>
          {rules.limitingFactor && rules.limitingFactor !== "None" && (
            <Text style={styles.limitingFactorText}>
              Limited by: {rules.limitingFactor}
            </Text>
          )}
        </View>

        {/* Hard Limit Card */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesTitleContainer}>
            <Icon name="lock" size={14} color="#dc2626" />
            <Text style={[styles.rulesTitle, { color: "#dc2626" }]}>
              Hard Limit (Tank Capacity)
            </Text>
          </View>

          <View style={styles.hardLimitContainer}>
            <View style={styles.hardLimitRow}>
              <View style={styles.hardLimitItem}>
                <Text style={styles.hardLimitLabel}>Tank Capacity</Text>
                <Text style={styles.hardLimitValue}>
                  {formatLiters(rules.tankCapacity)}
                </Text>
              </View>
              {!!rules.hasGpsFuelSensor && rules.currentFuelLevel !== null && (
                <View style={styles.hardLimitItem}>
                  <Text style={styles.hardLimitLabel}>Current Fuel</Text>
                  <Text style={styles.hardLimitValue}>
                    {formatLiters(rules.currentFuelLevel)}
                  </Text>
                </View>
              )}
              <View style={styles.hardLimitItem}>
                <Text style={styles.hardLimitLabel}>Available Space</Text>
                <Text
                  style={[styles.hardLimitValue, styles.hardLimitHighlight]}
                >
                  {formatLiters(rules.hardLimit)}
                </Text>
              </View>
            </View>
            {!!rules.hasGpsFuelSensor && (
              <View style={styles.gpsIndicator}>
                <Icon name="satellite-dish" size={12} color="#10b981" />
                <Text style={styles.gpsIndicatorText}>
                  GPS Fuel Sensor Active
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Soft Limits Card */}
        <View style={styles.rulesCard}>
          <View style={styles.rulesTitleContainer}>
            <Icon name="clipboard-list" size={14} color="#6366f1" />
            <Text style={styles.rulesTitle}>Soft Limits (Rules)</Text>
          </View>

          <View style={styles.rulesGrid}>
            {/* Daily Limit */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Daily Remaining</Text>
              <Text
                style={[styles.ruleValue, getStatusStyle(getDailyStatus())]}
              >
                {rules.dailyLimit === 0
                  ? "Unlimited"
                  : formatLiters(rules.dailyRemaining)}
              </Text>
              {rules.dailyLimit > 0 && (
                <Text style={styles.ruleSubtext}>
                  Used: {formatLiters(rules.usedToday)} /{" "}
                  {formatLimit(rules.dailyLimit)}
                </Text>
              )}
            </View>

            {/* Monthly Limit */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Monthly Remaining</Text>
              <Text
                style={[styles.ruleValue, getStatusStyle(getMonthlyStatus())]}
              >
                {rules.monthlyLimit === 0
                  ? "Unlimited"
                  : formatLiters(rules.monthlyRemaining)}
              </Text>
              {rules.monthlyLimit > 0 && (
                <Text style={styles.ruleSubtext}>
                  Used: {formatLiters(rules.usedThisMonth)} /{" "}
                  {formatLimit(rules.monthlyLimit)}
                </Text>
              )}
            </View>

            {/* Per Transaction Limit */}
            {rules.perTransactionLimit > 0 && (
              <View style={styles.ruleItem}>
                <Text style={styles.ruleLabel}>Per Transaction</Text>
                <Text style={styles.ruleValue}>
                  {formatLiters(rules.perTransactionLimit)}
                </Text>
              </View>
            )}

            {/* Refills Today */}
            {rules.maxRefillsPerDay !== null && (
              <View style={styles.ruleItem}>
                <Text style={styles.ruleLabel}>Refills Remaining</Text>
                <Text
                  style={[
                    styles.ruleValue,
                    rules.refillsRemainingToday === 0 && styles.ruleValueDanger,
                  ]}
                >
                  {rules.refillsRemainingToday ?? "Unlimited"}
                </Text>
                <Text style={styles.ruleSubtext}>
                  {rules.refillsToday} of {rules.maxRefillsPerDay} used
                </Text>
              </View>
            )}

            {/* Time Window */}
            <View style={styles.ruleItem}>
              <Text style={styles.ruleLabel}>Allowed Time</Text>
              <Text style={styles.ruleValue}>{formatTimeWindow()}</Text>
            </View>
          </View>
        </View>

        {/* Applied Rules Info (if available) */}
        {rules.appliedRuleSets?.length > 0 && (
          <View style={styles.appliedRulesCard}>
            <View style={styles.rulesTitleContainer}>
              <Icon name="layer-group" size={12} color="#6b7280" />
              <Text style={styles.appliedRulesTitle}>Applied Rule Sets</Text>
            </View>
            {rules.appliedRuleSets.map((ruleSet, index) => (
              <View key={index} style={styles.appliedRuleItem}>
                <Text style={styles.appliedRuleName}>
                  {ruleSet.ruleSetName}
                </Text>
                <Text style={styles.appliedRuleTarget}>
                  {ruleSet.targetType}: {ruleSet.targetName}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Confirmation Buttons */}
        <View style={styles.confirmationButtons}>
          <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
            <Icon name="times" size={16} color="#ef4444" />
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
            <Icon name="check" size={16} color="white" />
            <Text style={styles.confirmButtonText}>Confirm & Continue</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  headerTitleContainer: {
    flex: 1,
  },
  refreshButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 12,
  },
  refreshButtonDisabled: {
    opacity: 0.6,
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
  content: {
    flex: 1,
    padding: 16,
  },
  // Tag Info
  tagInfoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  tagInfoText: {
    marginLeft: 10,
    fontSize: 14,
    color: "#1e40af",
  },
  tagIdText: {
    fontWeight: "700",
    fontFamily: "monospace",
  },
  // Vehicle Card
  vehicleCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  vehicleHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  vehicleInfo: {
    flex: 1,
    marginLeft: 14,
  },
  vehicleHyoung: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
  },
  vehicleName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  vehicleDetailsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  vehicleDetailItem: {
    width: "50%",
    paddingVertical: 8,
    paddingRight: 8,
  },
  vehicleDetailLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
    textTransform: "uppercase",
  },
  vehicleDetailValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
  },
  // Max Allowed Card
  maxAllowedCard: {
    backgroundColor: "#ecfdf5",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#10b981",
  },
  maxAllowedHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  maxAllowedTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#065f46",
    marginLeft: 8,
  },
  maxAllowedValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#10b981",
    textAlign: "center",
  },
  limitingFactorText: {
    fontSize: 12,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 4,
  },
  // Rules Card
  rulesCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  rulesTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  rulesTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: "#6366f1",
    marginLeft: 8,
  },
  rulesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  ruleItem: {
    width: "50%",
    paddingVertical: 8,
    paddingRight: 8,
  },
  ruleLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  ruleValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
    marginTop: 2,
  },
  ruleValueWarning: {
    color: "#f59e0b",
  },
  ruleValueDanger: {
    color: "#ef4444",
  },
  ruleSubtext: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  // Hard Limit
  hardLimitContainer: {
    marginTop: 8,
  },
  hardLimitRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hardLimitItem: {
    flex: 1,
    alignItems: "center",
    paddingHorizontal: 4,
  },
  hardLimitLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginBottom: 4,
  },
  hardLimitValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  hardLimitHighlight: {
    color: "#dc2626",
  },
  gpsIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  gpsIndicatorText: {
    fontSize: 11,
    color: "#10b981",
    marginLeft: 6,
    fontWeight: "500",
  },
  // Applied Rules
  appliedRulesCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  appliedRulesTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 6,
  },
  appliedRuleItem: {
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  appliedRuleName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  appliedRuleTarget: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
  },
  // Confirmation Buttons
  confirmationButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    marginBottom: 24,
  },
  cancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 8,
    paddingVertical: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#fecaca",
    backgroundColor: "#fef2f2",
  },
  cancelButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "#ef4444",
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 2,
    paddingVertical: 14,
    borderRadius: 10,
    backgroundColor: "#10b981",
  },
  confirmButtonText: {
    marginLeft: 8,
    fontSize: 15,
    fontWeight: "600",
    color: "white",
  },
});

export default VehicleConfirmationStep;
