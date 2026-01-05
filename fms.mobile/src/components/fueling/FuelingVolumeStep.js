import React, { useState, useMemo } from "react";
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
  selectedPump,
  selectedNozzle,
  pumpDetails,
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
  // Fueling rules from validation step (contains maxFuelAllowed, limits, etc.)
  fuelingRules = null,
  // Legacy props - kept for backward compatibility but deprecated
  enableFuelCapacityValidation = true,
  enableGPSFuelLevelCheck = true,
}) => {
  const [volumeError, setVolumeError] = useState("");
  const [odometerError, setOdometerError] = useState("");

  // Extract limits from fueling rules (from effective rules API)
  const maxFuelAllowed = useMemo(() => {
    if (
      fuelingRules?.maxFuelAllowed != null &&
      fuelingRules.maxFuelAllowed > 0
    ) {
      return fuelingRules.maxFuelAllowed;
    }
    // Fallback to hard limit if maxFuelAllowed is 0 or not set
    if (fuelingRules?.hardLimit != null && fuelingRules.hardLimit > 0) {
      return fuelingRules.hardLimit;
    }
    // Ultimate fallback to tank capacity
    return (
      fuelingRules?.tankCapacity || selectedVehicle?.fuelTankCapacity || null
    );
  }, [fuelingRules, selectedVehicle]);

  const limitingFactor = fuelingRules?.limitingFactor || null;
  const tankCapacity =
    fuelingRules?.tankCapacity || selectedVehicle?.fuelTankCapacity || null;
  const currentFuelLevel = fuelingRules?.currentFuelLevel || null;
  const hasGpsFuelSensor = fuelingRules?.hasGpsFuelSensor || false;
  const hardLimit = fuelingRules?.hardLimit || null;
  const dailyRemaining = fuelingRules?.dailyRemaining || null;
  const monthlyRemaining = fuelingRules?.monthlyRemaining || null;
  const perTransactionLimit = fuelingRules?.perTransactionLimit || null;

  // Check if the selected nozzle is currently up (lifted)
  // nozzleUp value from pump status indicates which nozzle is lifted (0 = none)
  const isNozzleUp = pumpDetails?.nozzleUp === selectedNozzle?.id;

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

    // Check against source tank volume
    if (sourceTank && numValue > sourceTank.currentVolume) {
      setVolumeError(
        `Cannot exceed tank volume (${sourceTank.currentVolume.toLocaleString()} L)`
      );
      return false;
    }

    // Check against max fuel allowed from rules (already calculated considering all limits)
    if (maxFuelAllowed !== null && numValue > maxFuelAllowed) {
      let errorMessage = `Exceeds maximum allowed (${maxFuelAllowed.toLocaleString()} L)`;

      // Add context about the limiting factor
      if (limitingFactor) {
        errorMessage += ` - Limited by: ${limitingFactor}`;
      } else if (hasGpsFuelSensor && currentFuelLevel != null) {
        errorMessage += ` - Current fuel: ${currentFuelLevel.toFixed(0)} L`;
      }

      setVolumeError(errorMessage);
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

  // Can only proceed if nozzle is up AND volume is set
  const canProceed =
    isNozzleUp && (volume || isFullTank) && !volumeError && !odometerError;

  // Quick volume presets based on hard limit (available balance in tank)
  const getQuickVolumes = useMemo(() => {
    // Use hardLimit (available space in tank) for percentage-based quick selections
    // This represents the actual balance/space available
    const availableBalance = hardLimit || maxFuelAllowed || tankCapacity || 200;

    // Always show as percentages of the available balance
    const presets = [
      { label: "25%", percentage: 0.25 },
      { label: "50%", percentage: 0.5 },
      { label: "75%", percentage: 0.75 },
      { label: "100%", percentage: 1.0 },
    ];

    return presets.map((preset) => ({
      label: preset.label,
      value: Math.round(availableBalance * preset.percentage),
      percentage: preset.percentage,
    }));
  }, [hardLimit, maxFuelAllowed, tankCapacity]);

  // Render fuel allowance info card - simplified version
  const renderFuelAllowanceInfo = () => {
    // Only show if there are soft limits remaining
    const hasSoftLimits =
      (dailyRemaining != null && dailyRemaining > 0) ||
      (monthlyRemaining != null && monthlyRemaining > 0);

    if (!hasSoftLimits) return null;

    return (
      <View style={styles.softLimitsCard}>
        {dailyRemaining != null && dailyRemaining > 0 && (
          <View style={styles.softLimitItem}>
            <Text style={styles.softLimitLabel}>Daily Remaining</Text>
            <Text style={styles.softLimitValue}>
              {dailyRemaining.toLocaleString()} L
            </Text>
          </View>
        )}
        {monthlyRemaining != null && monthlyRemaining > 0 && (
          <View style={styles.softLimitItem}>
            <Text style={styles.softLimitLabel}>Monthly Remaining</Text>
            <Text style={styles.softLimitValue}>
              {monthlyRemaining.toLocaleString()} L
            </Text>
          </View>
        )}
      </View>
    );
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
        {/* Fuel Allowance Info Card */}
        {renderFuelAllowanceInfo()}

        {/* Vehicle & Max Limit - Combined Simple Card */}
        <View style={styles.vehicleMaxCard}>
          <View style={styles.vehicleMaxLeft}>
            <Icon name="truck" size={16} color="#2563eb" />
            <Text style={styles.vehicleMaxName}>
              {selectedVehicle?.hyoungNo}
            </Text>
          </View>
          <View style={styles.vehicleMaxRight}>
            <Text style={styles.vehicleMaxLabel}>Max:</Text>
            <Text style={styles.vehicleMaxValue}>
              {maxFuelAllowed != null
                ? `${Math.round(maxFuelAllowed).toLocaleString()} L`
                : "No Limit"}
            </Text>
          </View>
        </View>

        {/* Nozzle Status Card */}
        <View
          style={[
            styles.nozzleStatusCard,
            isNozzleUp ? styles.nozzleStatusReady : styles.nozzleStatusWaiting,
          ]}
        >
          <View style={styles.nozzleStatusContent}>
            <View
              style={[
                styles.nozzleStatusIcon,
                isNozzleUp
                  ? styles.nozzleStatusIconReady
                  : styles.nozzleStatusIconWaiting,
              ]}
            >
              <Icon
                name={isNozzleUp ? "check-circle" : "hand-paper"}
                size={20}
                color={isNozzleUp ? "#10b981" : "#f59e0b"}
              />
            </View>
            <View style={styles.nozzleStatusText}>
              <Text
                style={[
                  styles.nozzleStatusTitle,
                  isNozzleUp
                    ? styles.nozzleStatusTitleReady
                    : styles.nozzleStatusTitleWaiting,
                ]}
              >
                {isNozzleUp ? "Nozzle Ready" : "Lift Nozzle to Continue"}
              </Text>
              <Text style={styles.nozzleStatusSubtitle}>
                Pump {selectedPump?.id || "-"} • Nozzle{" "}
                {selectedNozzle?.id || "-"}
                {!isNozzleUp && " (Currently down)"}
              </Text>
            </View>
          </View>
          {!isNozzleUp && (
            <View style={styles.nozzleStatusPulse}>
              <Icon name="sync" size={16} color="#f59e0b" />
            </View>
          )}
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
              {getQuickVolumes.map((preset) => (
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
          {odometer ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Odometer:</Text>
              <Text style={styles.summaryValue}>
                {parseFloat(odometer).toLocaleString()} km
              </Text>
            </View>
          ) : null}
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
  // Simplified Vehicle + Max Limit Card
  vehicleMaxCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  vehicleMaxLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleMaxName: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1e3a8a",
    marginLeft: 10,
  },
  vehicleMaxRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  vehicleMaxLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginRight: 4,
  },
  vehicleMaxValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#10b981",
  },
  // Soft Limits Card (simplified)
  softLimitsCard: {
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
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
  // Nozzle Status Card Styles
  nozzleStatusCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  nozzleStatusReady: {
    backgroundColor: "#f0fdf4",
    borderColor: "#86efac",
  },
  nozzleStatusWaiting: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  nozzleStatusContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  nozzleStatusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  nozzleStatusIconReady: {
    backgroundColor: "#dcfce7",
  },
  nozzleStatusIconWaiting: {
    backgroundColor: "#fef3c7",
  },
  nozzleStatusText: {
    flex: 1,
  },
  nozzleStatusTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  nozzleStatusTitleReady: {
    color: "#166534",
  },
  nozzleStatusTitleWaiting: {
    color: "#92400e",
  },
  nozzleStatusSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  nozzleStatusPulse: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
  },
  // Fuel Allowance Card Styles (replaces GPS Fuel Card)
  fuelAllowanceCard: {
    backgroundColor: "white",
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    overflow: "hidden",
  },
  // Hard Limit Section Styles
  hardLimitSection: {
    backgroundColor: "#fef2f2",
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#fecaca",
  },
  hardLimitHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  hardLimitTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#991b1b",
    marginLeft: 6,
    textTransform: "uppercase",
  },
  hardLimitGrid: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  hardLimitItem: {
    alignItems: "center",
    flex: 1,
  },
  hardLimitItemHighlight: {
    backgroundColor: "#fee2e2",
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  gpsIndicator: {
    position: "absolute",
    top: -2,
    right: 4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#d1fae5",
    alignItems: "center",
    justifyContent: "center",
  },
  hardLimitLabel: {
    fontSize: 10,
    color: "#7f1d1d",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  hardLimitValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#991b1b",
  },
  hardLimitValueHighlight: {
    color: "#dc2626",
    fontSize: 18,
  },
  // Max Allowed Section Styles
  maxAllowedSection: {
    backgroundColor: "#f0fdf4",
    padding: 14,
  },
  fuelAllowanceHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  fuelAllowanceTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#166534",
    marginLeft: 8,
  },
  maxFuelDisplay: {
    alignItems: "center",
    paddingVertical: 4,
  },
  maxFuelValue: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10b981",
  },
  limitingFactorText: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
    fontStyle: "italic",
  },
  fuelGaugeSection: {
    marginTop: 10,
    paddingTop: 10,
  },
  fuelGaugeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  fuelGauge: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    marginRight: 10,
    overflow: "hidden",
  },
  fuelGaugeFill: {
    height: "100%",
    borderRadius: 4,
  },
  fuelGaugeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#1f2937",
    minWidth: 50,
    textAlign: "right",
  },
  fuelDetailsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  fuelDetailLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  softLimitsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 12,
    paddingHorizontal: 14,
    backgroundColor: "#fafafa",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  softLimitItem: {
    alignItems: "center",
  },
  softLimitLabel: {
    fontSize: 10,
    color: "#6b7280",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  softLimitValue: {
    fontSize: 14,
    fontWeight: "600",
    color: "#166534",
  },
});

export default FuelingVolumeStep;
