/**
 * TransactionSummaryStep.js
 *
 * Displays a summary/receipt of the completed fueling transaction.
 * Shown after authorization completes so users can review what happened
 * before starting a new fueling operation.
 *
 * Features:
 * - Transaction ID and timestamp
 * - Volume dispensed and amount
 * - Vehicle/Tank information
 * - Driver information (if provided)
 * - Fueling duration
 * - Options to start new fueling or go back
 */
import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Share,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const TransactionSummaryStep = ({
  transactionData,
  onStartNewFueling,
  onBackToPumps,
  siteName,
  deviceName,
}) => {
  // Extract transaction details with fallbacks
  const {
    transactionId,
    volume = 0,
    amount = 0,
    elapsedTime = 0,
    vehicleInfo,
    tankInfo,
    pumpId,
    nozzleId,
    operationMode,
    driverInfo,
    completedAt,
    fuelGrade,
  } = transactionData || {};

  // Format elapsed time
  const formatDuration = (seconds) => {
    if (!seconds || seconds === 0) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Format timestamp
  const formatTimestamp = (date) => {
    if (!date) return new Date().toLocaleString();
    const d = new Date(date);
    return d.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Check if this is a transfer operation
  const isTransfer = operationMode === "transfer";

  // Share transaction receipt
  const handleShare = async () => {
    try {
      const receiptText = `
Fueling Receipt
================
Transaction ID: ${transactionId || "N/A"}
Date: ${formatTimestamp(completedAt)}
Site: ${siteName || "N/A"}
Device: ${deviceName || "N/A"}

${isTransfer ? "TANK TRANSFER" : "VEHICLE FUELING"}
------------------
${isTransfer ? `Source Tank: ${tankInfo?.name || "N/A"}` : `Vehicle: ${vehicleInfo?.vehicleName || vehicleInfo?.vehicleCode || "N/A"}`}
${isTransfer ? `Destination Tank: ${transactionData?.destinationTank?.tankName || "N/A"}` : `Plate: ${vehicleInfo?.numberPlate || "N/A"}`}
${driverInfo ? `Driver: ${driverInfo.name}` : ""}
Pump: ${pumpId || "N/A"} | Nozzle: ${nozzleId || "N/A"}
${fuelGrade ? `Fuel Grade: ${fuelGrade}` : ""}

Volume: ${volume?.toFixed(2) || "0.00"} L
${amount > 0 ? `Amount: $${amount?.toFixed(2) || "0.00"}` : ""}
Duration: ${formatDuration(elapsedTime)}

Thank you!
      `.trim();

      await Share.share({
        message: receiptText,
        title: `Fueling Receipt - ${transactionId}`,
      });
    } catch (error) {
      console.error("[TransactionSummaryStep] Share error:", error);
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      showsVerticalScrollIndicator={false}
    >
      {/* Success Header */}
      <View style={styles.successHeader}>
        <View style={styles.checkIconContainer}>
          <Icon name="check-circle" size={56} color="#10b981" solid />
        </View>
        <Text style={styles.successTitle}>Transaction Complete!</Text>
        <Text style={styles.successSubtitle}>
          {isTransfer
            ? "Tank transfer completed successfully"
            : "Vehicle fueling completed successfully"}
        </Text>
      </View>

      {/* Transaction ID Card */}
      <View style={styles.transactionIdCard}>
        <View style={styles.transactionIdRow}>
          <Icon name="receipt" size={18} color="#6b7280" />
          <Text style={styles.transactionIdLabel}>Transaction ID</Text>
        </View>
        <Text style={styles.transactionIdValue}>
          {transactionId || "Pending"}
        </Text>
        <Text style={styles.timestampText}>{formatTimestamp(completedAt)}</Text>
      </View>

      {/* Volume & Amount Card */}
      <View style={styles.metricsCard}>
        <View style={styles.metricItem}>
          <Icon name="gas-pump" size={24} color="#2563eb" />
          <Text style={styles.metricValue}>{volume?.toFixed(2) || "0.00"}</Text>
          <Text style={styles.metricUnit}>Liters</Text>
        </View>
        <View style={styles.metricDivider} />
        <View style={styles.metricItem}>
          <Icon name="clock" size={24} color="#059669" />
          <Text style={styles.metricValue}>{formatDuration(elapsedTime)}</Text>
          <Text style={styles.metricUnit}>Duration</Text>
        </View>

      </View>

      {/* Details Card */}
      <View style={styles.detailsCard}>
        <Text style={styles.sectionTitle}>
          <Icon name="info-circle" size={14} color="#374151" /> Details
        </Text>

        {/* Location Info */}
        {(siteName || deviceName) && (
          <View style={styles.detailRow}>
            <Icon name="map-marker-alt" size={14} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Location</Text>
              <Text style={styles.detailValue}>
                {siteName}
                {deviceName ? ` • ${deviceName}` : ""}
              </Text>
            </View>
          </View>
        )}

        {/* Pump & Nozzle */}
        <View style={styles.detailRow}>
          <Icon name="tint" size={14} color="#6b7280" />
          <View style={styles.detailContent}>
            <Text style={styles.detailLabel}>Pump & Nozzle</Text>
            <Text style={styles.detailValue}>
              Pump {pumpId || "N/A"} • Nozzle {nozzleId || "N/A"}
              {fuelGrade ? ` (${fuelGrade})` : ""}
            </Text>
          </View>
        </View>

        {/* Vehicle Info - for vehicle fueling */}
        {!isTransfer && vehicleInfo && (
          <View style={styles.detailRow}>
            <Icon name="car" size={14} color="#6b7280" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Vehicle</Text>
              <Text style={styles.detailValue}>
                {vehicleInfo.vehicleName ||
                  vehicleInfo.vehicleCode ||
                  vehicleInfo.numberPlate ||
                  "N/A"}
              </Text>
              {vehicleInfo.numberPlate &&
                vehicleInfo.numberPlate !==
                  (vehicleInfo.vehicleName || vehicleInfo.vehicleCode) && (
                  <Text style={styles.detailSubValue}>
                    Plate: {vehicleInfo.numberPlate}
                  </Text>
                )}
            </View>
          </View>
        )}

        {/* Tank Info - for transfers */}
        {isTransfer && tankInfo && (
          <>
            <View style={styles.detailRow}>
              <Icon name="database" size={14} color="#6b7280" />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Source Tank</Text>
                <Text style={styles.detailValue}>
                  {tankInfo.tankName || tankInfo.name || "N/A"}
                </Text>
              </View>
            </View>
            {transactionData?.destinationTank && (
              <View style={styles.detailRow}>
                <Icon name="arrow-right" size={14} color="#7c3aed" />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Destination Tank</Text>
                  <Text style={[styles.detailValue, { color: "#7c3aed" }]}>
                    {transactionData.destinationTank.tankName || "N/A"}
                  </Text>
                </View>
              </View>
            )}
          </>
        )}

        {/* Driver Info */}
        {driverInfo && (
          <View style={styles.detailRow}>
            <Icon name="user" size={14} color="#10b981" />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Driver/Employee</Text>
              <Text style={[styles.detailValue, { color: "#10b981" }]}>
                {driverInfo.name || driverInfo.employeeName || "N/A"}
              </Text>
            </View>
          </View>
        )}

        {/* Operation Mode Badge */}
        <View style={styles.modeBadgeContainer}>
          <View
            style={[
              styles.modeBadge,
              isTransfer ? styles.transferBadge : styles.vehicleBadge,
            ]}
          >
            <Icon
              name={isTransfer ? "exchange-alt" : "car"}
              size={12}
              color={isTransfer ? "#7c3aed" : "#2563eb"}
            />
            <Text
              style={[
                styles.modeBadgeText,
                isTransfer ? styles.transferBadgeText : styles.vehicleBadgeText,
              ]}
            >
              {isTransfer ? "Tank Transfer" : "Vehicle Fueling"}
            </Text>
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsContainer}>
        {/* Share/Print Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Icon name="share-alt" size={16} color="#6b7280" />
          <Text style={styles.shareButtonText}>Share Receipt</Text>
        </TouchableOpacity>

        {/* Primary Action: Start New Fueling */}
        <TouchableOpacity
          style={styles.primaryButton}
          onPress={onStartNewFueling}
        >
          <Icon name="plus-circle" size={18} color="white" />
          <Text style={styles.primaryButtonText}>Start New Fueling</Text>
        </TouchableOpacity>

        {/* Secondary Action: Go Back to Pump Selection */}
        <TouchableOpacity style={styles.secondaryButton} onPress={onBackToPumps}>
          <Icon name="arrow-left" size={14} color="#6b7280" />
          <Text style={styles.secondaryButtonText}>Back to Pumps</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },

  // Success Header
  successHeader: {
    alignItems: "center",
    paddingVertical: 24,
    marginBottom: 8,
  },
  checkIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  successSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
  },

  // Transaction ID Card
  transactionIdCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    alignItems: "center",
  },
  transactionIdRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  transactionIdLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  transactionIdValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    fontFamily: "monospace",
    marginBottom: 4,
  },
  timestampText: {
    fontSize: 13,
    color: "#9ca3af",
  },

  // Metrics Card
  metricsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
  },
  metricItem: {
    alignItems: "center",
    flex: 1,
  },
  metricValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 8,
  },
  metricUnit: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
    textTransform: "uppercase",
  },
  metricDivider: {
    width: 1,
    height: 50,
    backgroundColor: "#e5e7eb",
  },

  // Details Card
  detailsCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "500",
    color: "#1f2937",
  },
  detailSubValue: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  // Mode Badge
  modeBadgeContainer: {
    alignItems: "flex-start",
    marginTop: 8,
  },
  modeBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
  },
  vehicleBadge: {
    backgroundColor: "#dbeafe",
  },
  transferBadge: {
    backgroundColor: "#ede9fe",
  },
  modeBadgeText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  vehicleBadgeText: {
    color: "#2563eb",
  },
  transferBadgeText: {
    color: "#7c3aed",
  },

  // Actions Container
  actionsContainer: {
    gap: 12,
    marginTop: 8,
  },
  shareButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
  },
  shareButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 8,
  },
  primaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: "#10b981",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  primaryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 10,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#6b7280",
    marginLeft: 8,
  },
});

export default TransactionSummaryStep;
