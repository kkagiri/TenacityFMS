import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  TextInput,
  Switch,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const FuelingVolumeStep = ({
  selectedVehicle,
  sourceTank,
  volume,
  isFullTank,
  odometer,
  notes,
  onVolumeChange,
  onFullTankChange,
  onOdometerChange,
  onNotesChange,
  onNext,
  onBack,
}) => {
  const [volumeError, setVolumeError] = useState("");
  const [odometerError, setOdometerError] = useState("");

  const validateVolume = (value) => {
    if (!value && !isFullTank) {
      setVolumeError("Please enter a volume or select Full Tank");
      return false;
    }

    const numValue = parseFloat(value);

    if (value && (isNaN(numValue) || numValue <= 0)) {
      setVolumeError("Please enter a valid volume");
      return false;
    }

    if (sourceTank && numValue > sourceTank.currentVolume) {
      setVolumeError(
        `Cannot exceed tank volume (${sourceTank.currentVolume.toLocaleString()} L)`
      );
      return false;
    }

    if (
      selectedVehicle?.tankCapacity &&
      numValue > selectedVehicle.tankCapacity
    ) {
      setVolumeError(
        `Exceeds vehicle tank capacity (${selectedVehicle.tankCapacity} L)`
      );
      return false;
    }

    setVolumeError("");
    return true;
  };

  const handleVolumeChange = (value) => {
    onVolumeChange(value);
    if (value) {
      validateVolume(value);
    } else {
      setVolumeError("");
    }
  };

  const handleFullTankToggle = (value) => {
    onFullTankChange(value);
    if (value) {
      setVolumeError("");
    }
  };

  const handleOdometerChange = (value) => {
    onOdometerChange(value);

    if (value) {
      const numValue = parseFloat(value);
      if (isNaN(numValue) || numValue < 0) {
        setOdometerError("Please enter a valid odometer reading");
      } else {
        setOdometerError("");
      }
    } else {
      setOdometerError("");
    }
  };

  const canProceed = (volume || isFullTank) && !volumeError && !odometerError;

  // Quick volume presets based on vehicle tank capacity
  const getQuickVolumes = () => {
    const tankCapacity = selectedVehicle?.tankCapacity || 200;
    return [
      { label: "25%", value: Math.round(tankCapacity * 0.25) },
      { label: "50%", value: Math.round(tankCapacity * 0.5) },
      { label: "75%", value: Math.round(tankCapacity * 0.75) },
      { label: "Full", value: tankCapacity },
    ];
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.stepTitle}>Fueling Details</Text>
        <Text style={styles.stepDescription}>
          Enter the volume of fuel to dispense
        </Text>
      </View>

      <ScrollView
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Vehicle Info Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleCardHeader}>
            <Icon name="truck" size={18} color="#2563eb" />
            <Text style={styles.vehicleCardTitle}>Vehicle</Text>
          </View>
          <View style={styles.vehicleCardBody}>
            <Text style={styles.vehicleNumber}>
              {selectedVehicle?.hyoungNo}
            </Text>
            <View style={styles.vehicleDetails}>
              <Text style={styles.vehicleDetailText}>
                {selectedVehicle?.plateNo}
              </Text>
              {selectedVehicle?.tankCapacity && (
                <Text style={styles.vehicleDetailText}>
                  Tank: {selectedVehicle.tankCapacity}L
                </Text>
              )}
            </View>
          </View>
        </View>

        {/* Full Tank Option */}
        <View style={styles.fullTankCard}>
          <View style={styles.fullTankContent}>
            <Icon name="gas-pump" size={22} color="#10b981" />
            <View style={styles.fullTankText}>
              <Text style={styles.fullTankTitle}>Fill Full Tank</Text>
              <Text style={styles.fullTankSubtitle}>
                Dispense until vehicle tank is full
              </Text>
            </View>
          </View>
          <Switch
            value={isFullTank}
            onValueChange={handleFullTankToggle}
            trackColor={{ false: "#d1d5db", true: "#86efac" }}
            thumbColor={isFullTank ? "#10b981" : "#f4f4f5"}
          />
        </View>

        {/* Volume Input */}
        {!isFullTank && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Fuel Volume (Liters)</Text>
            <View
              style={[
                styles.volumeInputContainer,
                volumeError && styles.volumeInputError,
              ]}
            >
              <Icon
                name="tint"
                size={20}
                color="#6b7280"
                style={styles.volumeIcon}
              />
              <TextInput
                style={styles.volumeInput}
                value={volume}
                onChangeText={handleVolumeChange}
                keyboardType="numeric"
                placeholder="Enter fuel volume"
                placeholderTextColor="#9ca3af"
              />
              <Text style={styles.volumeUnit}>L</Text>
            </View>
            {volumeError ? (
              <Text style={styles.errorText}>{volumeError}</Text>
            ) : null}

            {/* Quick Volume Buttons */}
            <View style={styles.quickVolumeContainer}>
              {getQuickVolumes().map((preset) => (
                <TouchableOpacity
                  key={preset.label}
                  style={[
                    styles.quickVolumeButton,
                    volume === preset.value.toString() &&
                      styles.quickVolumeButtonActive,
                  ]}
                  onPress={() => handleVolumeChange(preset.value.toString())}
                >
                  <Text
                    style={[
                      styles.quickVolumeLabel,
                      volume === preset.value.toString() &&
                        styles.quickVolumeLabelActive,
                    ]}
                  >
                    {preset.label}
                  </Text>
                  <Text
                    style={[
                      styles.quickVolumeValue,
                      volume === preset.value.toString() &&
                        styles.quickVolumeValueActive,
                    ]}
                  >
                    {preset.value}L
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Odometer Reading */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Odometer Reading <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <View
            style={[styles.inputContainer, odometerError && styles.inputError]}
          >
            <Icon
              name="tachometer-alt"
              size={18}
              color="#6b7280"
              style={styles.inputIcon}
            />
            <TextInput
              style={styles.input}
              value={odometer}
              onChangeText={handleOdometerChange}
              keyboardType="numeric"
              placeholder="Enter current odometer"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputUnit}>km</Text>
          </View>
          {odometerError ? (
            <Text style={styles.errorText}>{odometerError}</Text>
          ) : null}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Notes <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <TextInput
            style={styles.notesInput}
            value={notes}
            onChangeText={onNotesChange}
            placeholder="Add any additional notes..."
            placeholderTextColor="#9ca3af"
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>Fueling Summary</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Vehicle:</Text>
            <Text style={styles.summaryValue}>{selectedVehicle?.hyoungNo}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Source Tank:</Text>
            <Text style={styles.summaryValue}>{sourceTank?.tankName}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>Volume:</Text>
            <Text style={[styles.summaryValue, styles.summaryValueHighlight]}>
              {isFullTank
                ? "Full Tank"
                : volume
                ? `${parseFloat(volume).toLocaleString()} L`
                : "-"}
            </Text>
          </View>
          {odometer && (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Odometer:</Text>
              <Text style={styles.summaryValue}>
                {parseFloat(odometer).toLocaleString()} km
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={16} color="#6b7280" />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.nextButton, !canProceed && styles.buttonDisabled]}
          onPress={onNext}
          disabled={!canProceed}
        >
          <Text style={styles.nextButtonText}>Confirm Fueling</Text>
          <Icon name="check" size={16} color="white" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
  stepIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#2563eb",
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
  scrollContent: {
    flex: 1,
    padding: 16,
  },
  vehicleCard: {
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  vehicleCardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  vehicleCardTitle: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1e40af",
    marginLeft: 8,
    textTransform: "uppercase",
  },
  vehicleCardBody: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  vehicleNumber: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e3a8a",
  },
  vehicleDetails: {
    alignItems: "flex-end",
  },
  vehicleDetailText: {
    fontSize: 13,
    color: "#3b82f6",
  },
  fullTankCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "white",
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  fullTankContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  fullTankText: {
    marginLeft: 14,
  },
  fullTankTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  fullTankSubtitle: {
    fontSize: 13,
    color: "#6b7280",
  },
  section: {
    marginBottom: 20,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  optionalText: {
    fontWeight: "400",
    color: "#9ca3af",
  },
  volumeInputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
  },
  volumeInputError: {
    borderColor: "#ef4444",
  },
  volumeIcon: {
    marginRight: 12,
  },
  volumeInput: {
    flex: 1,
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    paddingVertical: 16,
  },
  volumeUnit: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 8,
  },
  errorText: {
    fontSize: 12,
    color: "#ef4444",
    marginTop: 6,
  },
  quickVolumeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 14,
  },
  quickVolumeButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  quickVolumeButtonActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  quickVolumeLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
  },
  quickVolumeLabelActive: {
    color: "#2563eb",
  },
  quickVolumeValue: {
    fontSize: 12,
    color: "#9ca3af",
  },
  quickVolumeValueActive: {
    color: "#3b82f6",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
  },
  inputError: {
    borderColor: "#ef4444",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: "#1f2937",
    paddingVertical: 14,
  },
  inputUnit: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  notesInput: {
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    padding: 14,
    fontSize: 15,
    color: "#1f2937",
    minHeight: 80,
  },
  summaryCard: {
    backgroundColor: "#f0fdf4",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#bbf7d0",
  },
  summaryTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#166534",
    marginBottom: 12,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  summaryLabel: {
    fontSize: 14,
    color: "#166534",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
  },
  summaryValueHighlight: {
    fontSize: 16,
    color: "#047857",
  },
  actionContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
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
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
  },
  buttonDisabled: {
    backgroundColor: "#a7f3d0",
  },
  nextButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    marginRight: 8,
  },
});

export default FuelingVolumeStep;
