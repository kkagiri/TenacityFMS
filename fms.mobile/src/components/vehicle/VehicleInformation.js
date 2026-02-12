/**
 * VehicleInformation.js
 * Purpose: Display comprehensive vehicle information
 * Admin users can edit fuel tank capacity
 * Last Modified: 2026-02-12
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";

const VehicleInformation = ({ vehicle, canEdit = false, onVehicleUpdated }) => {
  const [isEditingCapacity, setIsEditingCapacity] = useState(false);
  const [capacityValue, setCapacityValue] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  if (!vehicle) {
    return (
      <View style={styles.emptyContainer}>
        <Icon name="truck" size={48} color="#d1d5db" />
        <Text style={styles.emptyText}>No vehicle selected</Text>
      </View>
    );
  }

  const handleEditCapacity = () => {
    if (!canEdit) {
      Alert.alert(
        "Permission Denied",
        "Only administrators can edit tank capacity."
      );
      return;
    }

    const currentCapacity =
      vehicle.fuelTankCapacity || vehicle.tankCapacity || "";
    setCapacityValue(String(currentCapacity));
    setIsEditingCapacity(true);
  };

  const handleCancelEdit = () => {
    setIsEditingCapacity(false);
    setCapacityValue("");
  };

  const handleSaveCapacity = async () => {
    if (!canEdit) {
      Alert.alert(
        "Permission Denied",
        "Only administrators can edit tank capacity."
      );
      return;
    }

    const newCapacity = parseFloat(capacityValue);
    if (isNaN(newCapacity) || newCapacity <= 0) {
      Alert.alert("Invalid Value", "Please enter a valid tank capacity.");
      return;
    }

    try {
      setIsSaving(true);
      await ApiService.updateVehicleFuelCapacity(vehicle.vehicleId, newCapacity);
      setIsEditingCapacity(false);

      // Notify parent to refresh vehicle data
      if (onVehicleUpdated) {
        onVehicleUpdated();
      }

      Alert.alert("Success", "Fuel tank capacity updated successfully.");
    } catch (error) {
      console.error("[VehicleInformation] Error updating capacity:", error);
      Alert.alert("Error", "Failed to update fuel tank capacity. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const InfoRow = ({ icon, label, value, iconColor = "#6b7280" }) => (
    <View style={styles.infoRow}>
      <View
        style={[
          styles.infoIconContainer,
          { backgroundColor: iconColor + "15" },
        ]}
      >
        <Icon name={icon} size={14} color={iconColor} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || "N/A"}</Text>
      </View>
    </View>
  );

  // Editable info row for tank capacity (admin only)
  const EditableCapacityRow = () => {
    const currentValue = vehicle.fuelTankCapacity || vehicle.tankCapacity;
    const displayValue = currentValue ? `${currentValue} L` : "N/A";

    if (isEditingCapacity) {
      return (
        <View style={styles.editableRow}>
          <View
            style={[
              styles.infoIconContainer,
              { backgroundColor: "#06b6d415" },
            ]}
          >
            <Icon name="tint" size={14} color="#06b6d4" />
          </View>
          <View style={styles.editContent}>
            <Text style={styles.infoLabel}>Tank Capacity (L)</Text>
            <View style={styles.editInputRow}>
              <TextInput
                style={styles.editInput}
                value={capacityValue}
                onChangeText={setCapacityValue}
                keyboardType="numeric"
                placeholder="Enter capacity"
                editable={!isSaving}
                autoFocus
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={handleSaveCapacity}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Icon name="check" size={12} color="white" />
                )}
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleCancelEdit}
                disabled={isSaving}
              >
                <Icon name="times" size={12} color="#6b7280" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return (
      <View style={styles.infoRow}>
        <View
          style={[
            styles.infoIconContainer,
            { backgroundColor: "#06b6d415" },
          ]}
        >
          <Icon name="tint" size={14} color="#06b6d4" />
        </View>
        <View style={styles.infoContent}>
          <Text style={styles.infoLabel}>Tank Capacity</Text>
          <Text style={styles.infoValue}>{displayValue}</Text>
        </View>
        {canEdit && (
          <TouchableOpacity
            style={styles.editIconButton}
            onPress={handleEditCapacity}
          >
            <Icon name="pencil-alt" size={12} color="#3b82f6" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const SectionHeader = ({ icon, title, iconColor = "#2563eb" }) => (
    <View style={styles.sectionHeader}>
      <Icon name={icon} size={16} color={iconColor} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Edit Notice - different message based on permission */}
      <View style={[styles.adminNotice, canEdit && styles.adminNoticeEditable]}>
        <Icon
          name={canEdit ? "edit" : "lock"}
          size={12}
          color={canEdit ? "#3b82f6" : "#6b7280"}
        />
        <Text style={[styles.adminNoticeText, canEdit && styles.adminNoticeTextEditable]}>
          {canEdit
            ? "Admin mode: Tap the pencil icon to edit tank capacity."
            : "View-only. Editing requires admin permission."
          }
        </Text>
      </View>

      {/* Vehicle Header Card */}
      <View style={styles.headerCard}>
        <View style={styles.vehicleIconContainer}>
          <Icon name="truck" size={28} color="#10b981" />
        </View>
        <View style={styles.headerInfo}>
          <Text style={styles.hyoungNo}>{vehicle.hyoungNo}</Text>
          <Text style={styles.vehicleName}>{vehicle.vehicleName}</Text>
          <View style={styles.statusRow}>
            <View
              style={[
                styles.statusBadge,
                vehicle.isActive !== false && styles.statusActive,
              ]}
            >
              <Icon
                name="circle"
                size={8}
                color={vehicle.isActive !== false ? "#10b981" : "#9ca3af"}
                solid
              />
              <Text
                style={[
                  styles.statusText,
                  vehicle.isActive !== false && styles.statusTextActive,
                ]}
              >
                {vehicle.isActive !== false ? "Active" : "Inactive"}
              </Text>
            </View>
            {vehicle.hasGPSInstalled && (
              <View style={styles.gpsBadge}>
                <Icon name="satellite-dish" size={10} color="#2563eb" />
                <Text style={styles.gpsText}>GPS</Text>
              </View>
            )}
          </View>
        </View>
      </View>

      {/* Basic Information Section */}
      <View style={styles.section}>
        <SectionHeader icon="info-circle" title="Basic Information" />
        <View style={styles.sectionContent}>
          <InfoRow
            icon="id-card"
            label="Number Plate"
            value={vehicle.numberPlate || vehicle.hyoungNo}
            iconColor="#6366f1"
          />
          <InfoRow
            icon="tag"
            label="Vehicle Type"
            value={vehicle.vehicleTypeName}
            iconColor="#8b5cf6"
          />
          <InfoRow
            icon="calendar"
            label="Year of Manufacture"
            value={vehicle.yom}
            iconColor="#14b8a6"
          />
          <InfoRow
            icon="cogs"
            label="Capacity"
            value={vehicle.capacity}
            iconColor="#f59e0b"
          />
          <InfoRow
            icon="users"
            label="Passengers"
            value={vehicle.passenger}
            iconColor="#ec4899"
          />
          <InfoRow
            icon="building"
            label="Company Vehicle"
            value={vehicle.isCompanyVehicle ? "Yes" : "No"}
            iconColor="#10b981"
          />
        </View>
      </View>

      {/* Location & Assignment Section */}
      <View style={styles.section}>
        <SectionHeader
          icon="map-marker-alt"
          title="Location & Assignment"
          iconColor="#10b981"
        />
        <View style={styles.sectionContent}>
          <InfoRow
            icon="building"
            label="Working Site"
            value={vehicle.siteName}
            iconColor="#10b981"
          />
          <InfoRow
            icon="user"
            label="Default Driver"
            value={vehicle.driverName}
            iconColor="#3b82f6"
          />
        </View>
      </View>

      {/* Fuel & Capacity Section */}
      <View style={styles.section}>
        <SectionHeader
          icon="gas-pump"
          title="Fuel & Capacity"
          iconColor="#f59e0b"
        />
        <View style={styles.sectionContent}>
          <InfoRow
            icon="gas-pump"
            label="Fuel Type"
            value={vehicle.fuelType || "Diesel"}
            iconColor="#f59e0b"
          />
          {/* Editable Tank Capacity for admins */}
          <EditableCapacityRow />
          <InfoRow
            icon="check-circle"
            label="Full Tank Policy"
            value={vehicle.isFullTankPolicy ? "Yes" : "No"}
            iconColor="#10b981"
          />
          <InfoRow
            icon="tachometer-alt"
            label="Expected Average"
            value={
              vehicle.expectedAverageValue
                ? `${vehicle.expectedAverageclassificationName || ""} ${
                    vehicle.expectedAverageValue
                  } km/L`
                : vehicle.averageKmL
                ? "km/L"
                : "N/A"
            }
            iconColor="#8b5cf6"
          />
        </View>
      </View>

      {/* Meter & GPS Section */}
      <View style={styles.section}>
        <SectionHeader
          icon="tachometer-alt"
          title="Meter & GPS"
          iconColor="#6366f1"
        />
        <View style={styles.sectionContent}>
          <InfoRow
            icon="digital-tachograph"
            label="Current Reading"
            value={vehicle.currentPhysicalReading}
            iconColor="#6366f1"
          />
          <InfoRow
            icon="satellite-dish"
            label="GPS Installed"
            value={vehicle.hasGPSInstalled ? "Yes" : "No"}
            iconColor="#2563eb"
          />
          <InfoRow
            icon="microchip"
            label="Device ID"
            value={vehicle.deviceId?.toString()}
            iconColor="#64748b"
          />
        </View>
      </View>

      {/* Tags Section */}
      {vehicle.tags && vehicle.tags.length > 0 && (
        <View style={styles.section}>
          <SectionHeader icon="tags" title="Tags" iconColor="#f97316" />
          <View style={styles.tagsContainer}>
            {vehicle.tags.map((tag, index) => (
              <View key={index} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Audit Information Section */}
      <View style={styles.section}>
        <SectionHeader
          icon="history"
          title="Audit Information"
          iconColor="#78716c"
        />
        <View style={styles.sectionContent}>
          <InfoRow
            icon="calendar-plus"
            label="Date Created"
            value={
              vehicle.dateCreated
                ? new Date(vehicle.dateCreated).toLocaleDateString()
                : "N/A"
            }
            iconColor="#10b981"
          />
          <InfoRow
            icon="user-plus"
            label="Created By"
            value={vehicle.createdBy}
            iconColor="#3b82f6"
          />
          <InfoRow
            icon="calendar-check"
            label="Date Modified"
            value={
              vehicle.dateModified
                ? new Date(vehicle.dateModified).toLocaleDateString()
                : "N/A"
            }
            iconColor="#f59e0b"
          />
          <InfoRow
            icon="user-edit"
            label="Modified By"
            value={vehicle.modifiedBy}
            iconColor="#8b5cf6"
          />
        </View>
      </View>

      <View style={styles.bottomPadding} />
    </ScrollView>
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
  headerCard: {
    flexDirection: "row",
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  vehicleIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 16,
    backgroundColor: "#ecfdf5",
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
    marginLeft: 14,
    justifyContent: "center",
  },
  hyoungNo: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  vehicleName: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  statusRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusActive: {
    backgroundColor: "#ecfdf5",
  },
  statusText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
    fontWeight: "500",
  },
  statusTextActive: {
    color: "#10b981",
  },
  gpsBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
  },
  gpsText: {
    fontSize: 12,
    color: "#2563eb",
    marginLeft: 4,
    fontWeight: "500",
  },
  section: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#f9fafb",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginLeft: 10,
  },
  sectionContent: {
    padding: 12,
  },
  tagsContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    padding: 12,
  },
  tagBadge: {
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: "#2563eb",
    fontWeight: "500",
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  infoIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 12,
    color: "#9ca3af",
  },
  infoValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    marginTop: 2,
  },
  statsContainer: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginBottom: 16,
  },
  statCard: {
    flex: 1,
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  statValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 8,
  },
  statLabel: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
  },
  bottomPadding: {
    height: 24,
  },
  adminNotice: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  adminNoticeEditable: {
    backgroundColor: "#eff6ff",
    borderColor: "#bfdbfe",
  },
  adminNoticeText: {
    flex: 1,
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 8,
  },
  adminNoticeTextEditable: {
    color: "#3b82f6",
  },
  // Editable row styles
  editableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    backgroundColor: "#fffbeb",
  },
  editContent: {
    flex: 1,
    marginLeft: 12,
  },
  editInputRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  editInput: {
    flex: 1,
    height: 36,
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 6,
    paddingHorizontal: 10,
    fontSize: 14,
    backgroundColor: "white",
    color: "#1f2937",
  },
  saveButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#10b981",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  cancelButton: {
    width: 36,
    height: 36,
    borderRadius: 6,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 4,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  editIconButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#eff6ff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
});

export default VehicleInformation;
