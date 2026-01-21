/**
 * LocationBypassIndicator - Displays when GPS location bypass is enabled
 * Shows that the user has been granted location bypass and GPS fix is not required
 */
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

/**
 * LocationBypassIndicator Component
 * @param {Object} props
 * @param {string} props.bypassReason - Optional reason for bypass (e.g., "User bypass", "Device bypass")
 * @param {Object} props.style - Additional container styles
 */
const LocationBypassIndicator = ({ bypassReason = "User bypass enabled", style }) => {
  return (
    <View style={[styles.container, style]}>
      <View style={styles.statusCard}>
        <View style={styles.iconContainer}>
          <Icon name="shield-check" size={20} color="#059669" solid />
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.statusText}>GPS Bypass Enabled</Text>
          <Text style={styles.subtextText}>
            Location validation not required
          </Text>
        </View>

        <View style={styles.bypassBadge}>
          <Icon name="check" size={10} color="#ffffff" />
          <Text style={styles.bypassBadgeText}>Active</Text>
        </View>
      </View>

      {/* Info message */}
      <View style={styles.infoContainer}>
        <Icon name="info-circle" size={12} color="#059669" />
        <Text style={styles.infoText}>
          {bypassReason} - You can proceed without GPS location fix
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  statusCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: "#ecfdf5",
    borderColor: "#10b981",
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(16, 185, 129, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  statusText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#059669",
  },
  subtextText: {
    fontSize: 12,
    color: "#047857",
    marginTop: 2,
  },
  bypassBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  bypassBadgeText: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  infoContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    paddingHorizontal: 12,
    gap: 6,
  },
  infoText: {
    fontSize: 12,
    color: "#047857",
    flex: 1,
    fontStyle: "italic",
  },
});

export default LocationBypassIndicator;
