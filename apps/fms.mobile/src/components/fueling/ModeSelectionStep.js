import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const ModeSelectionStep = ({ selectedMode, onSelectMode, onNext, onBack }) => {
  const handleModeSelect = (modeId) => {
    onSelectMode(modeId);
    // Auto-proceed after a brief visual feedback - pass mode directly to avoid state timing issues
    setTimeout(() => onNext(modeId), 150);
  };

  const modes = [
    {
      id: "vehicle",
      name: "Vehicle Fueling",
      icon: "car",
      description:
        "Dispense fuel to a vehicle using RFID tag or manual selection",
      color: "#2563eb",
      features: [
        "Scan RFID tag",
        "Select vehicle manually",
        "Track consumption",
      ],
    },
    {
      id: "transfer",
      name: "Tank Transfer",
      icon: "exchange-alt",
      description: "Transfer fuel between storage tanks at the site",
      color: "#10b981",
      features: [
        "Select destination tank",
        "Enter transfer volume",
        "Record reason",
      ],
    },
  ];

  const renderModeCard = (mode) => {
    const isSelected = selectedMode === mode.id;

    return (
      <TouchableOpacity
        key={mode.id}
        style={[
          styles.modeCard,
          isSelected && {
            borderColor: mode.color,
            backgroundColor: mode.id === "vehicle" ? "#eff6ff" : "#ecfdf5",
          },
        ]}
        onPress={() => handleModeSelect(mode.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.modeIconContainer,
            { backgroundColor: isSelected ? mode.color : mode.color + "15" },
          ]}
        >
          <Icon
            name={mode.icon}
            size={24}
            color={isSelected ? "#ffffff" : mode.color}
          />
        </View>

        <View style={styles.modeInfo}>
          <Text style={[styles.modeName, isSelected && { color: mode.color }]}>
            {mode.name}
          </Text>
          <Text style={styles.modeDescription} numberOfLines={2}>
            {mode.description}
          </Text>
        </View>

        <View style={styles.selectIndicator}>
          <Icon
            name="chevron-right"
            size={16}
            color={isSelected ? mode.color : "#9ca3af"}
          />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Select Operation Mode</Text>
        <Text style={styles.stepDescription}>Tap an option to continue</Text>
      </View>

      {/* Mode Cards */}
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.modesContainer}
        showsVerticalScrollIndicator={false}
      >
        {modes.map(renderModeCard)}
      </ScrollView>

      {/* Action Buttons - Back only, selection auto-proceeds */}
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
  scrollContainer: {
    flex: 1,
  },
  modesContainer: {
    padding: 16,
    paddingBottom: 20,
  },
  modeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  modeIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  modeInfo: {
    flex: 1,
    marginLeft: 14,
  },
  modeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 4,
  },
  modeDescription: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
  },
  selectIndicator: {
    marginLeft: 8,
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
});

export default ModeSelectionStep;
