import React, { useState, useMemo, useRef, useEffect, useCallback } from "react";
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
  Keyboard,
  Modal,
  ActivityIndicator,
  FlatList,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";
import LocationStatusIndicator from "./LocationStatusIndicator";
import LocationBypassIndicator from "./LocationBypassIndicator";

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
  // Driver/Employee selection
  selectedDriver,
  onDriverChange,
  siteId,
  sites = [],
  siteName,
  // Fueling rules from validation step (contains maxFuelAllowed, limits, etc.)
  fuelingRules = null,
  // Location props for GPS status indicator
  onLocationUpdate,
  showLocationStatus = true,
  maxLocationAgeSeconds = 60,
  // Location bypass props
  isLocationBypassEnabled = false,
  locationBypassReason = null,
  // Legacy props - kept for backward compatibility but deprecated
  enableFuelCapacityValidation = true,
  enableGPSFuelLevelCheck = true,
}) => {
  const [volumeError, setVolumeError] = useState("");
  const [odometerError, setOdometerError] = useState("");
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const scrollViewRef = useRef(null);

  // Driver search state
  const [driverSearchQuery, setDriverSearchQuery] = useState("");
  const [driverSearchResults, setDriverSearchResults] = useState([]);
  const [isSearchingDriver, setIsSearchingDriver] = useState(false);
  const [showDriverResults, setShowDriverResults] = useState(false);

  // Quick-add driver modal state
  const [showAddDriverModal, setShowAddDriverModal] = useState(false);
  const [newDriverName, setNewDriverName] = useState("");
  const [newDriverSiteId, setNewDriverSiteId] = useState(siteId);
  const [showSitePicker, setShowSitePicker] = useState(false);
  const [isCreatingDriver, setIsCreatingDriver] = useState(false);
  const [createDriverError, setCreateDriverError] = useState("");

  // Track keyboard visibility
  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow",
      () => setIsKeyboardVisible(true)
    );
    const keyboardDidHideListener = Keyboard.addListener(
      Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide",
      () => setIsKeyboardVisible(false)
    );

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  // Clear driver search query when selectedDriver is cleared (on step back)
  useEffect(() => {
    if (!selectedDriver) {
      setDriverSearchQuery("");
      setDriverSearchResults([]);
      setShowDriverResults(false);
    }
  }, [selectedDriver]);

  // Driver search effect with debounce
  // Skip search if a driver is already selected (query matches selected driver's name)
  useEffect(() => {
    // If a driver is selected and query matches their name, don't search
    if (selectedDriver && driverSearchQuery === selectedDriver.fullName) {
      setShowDriverResults(false);
      setDriverSearchResults([]);
      return;
    }

    if (driverSearchQuery.length >= 2) {
      setIsSearchingDriver(true);
      setShowDriverResults(true);

      const timer = setTimeout(async () => {
        try {
          const results = await ApiService.searchEmployees(
            driverSearchQuery,
            10,
            true,
            siteId
          );
          // Normalize results
          const normalizedResults = (results || []).map((e) => ({
            id: e.EmployeeId || e.employeeId || e.Id || e.id,
            fullName: e.FullName || e.fullName || e.Name || e.name || "",
            workNo: e.EmployeeWorkNo || e.employeeWorkNo || e.WorkNo || e.workNo || "",
            phone: e.EmployeephoneNumber || e.employeephoneNumber || e.Phone || e.phone || "",
            siteName: e.SiteName || e.siteName || "",
          }));
          setDriverSearchResults(normalizedResults);
        } catch (error) {
          console.error("[FuelingVolumeStep] Driver search error:", error);
          setDriverSearchResults([]);
        } finally {
          setIsSearchingDriver(false);
        }
      }, 400);

      return () => clearTimeout(timer);
    } else {
      setDriverSearchResults([]);
      setShowDriverResults(false);
    }
  }, [driverSearchQuery, siteId, selectedDriver]);

  // Handle driver selection
  const handleDriverSelect = useCallback((driver) => {
    onDriverChange?.(driver);
    setDriverSearchQuery(driver.fullName);
    setShowDriverResults(false);
    setDriverSearchResults([]);
  }, [onDriverChange]);

  // Clear driver selection
  const handleClearDriver = useCallback(() => {
    onDriverChange?.(null);
    setDriverSearchQuery("");
    setShowDriverResults(false);
    setDriverSearchResults([]);
  }, [onDriverChange]);

  // Open add driver modal
  const handleOpenAddDriverModal = useCallback(() => {
    setNewDriverName(driverSearchQuery || "");
    setNewDriverSiteId(siteId);
    setCreateDriverError("");
    setShowAddDriverModal(true);
    setShowDriverResults(false);
  }, [driverSearchQuery, siteId]);

  // Create new driver
  const handleCreateDriver = useCallback(async () => {
    if (!newDriverName.trim()) {
      setCreateDriverError("Please enter employee name");
      return;
    }

    setIsCreatingDriver(true);
    setCreateDriverError("");

    try {
      const newEmployee = await ApiService.createEmployee({
        fullName: newDriverName.trim(),
        siteId: newDriverSiteId,
        isActive: true,
      });

      // Normalize the response
      const normalizedDriver = {
        id: newEmployee.EmployeeId || newEmployee.employeeId || newEmployee.Id || newEmployee.id,
        fullName: newEmployee.FullName || newEmployee.fullName || newDriverName.trim(),
        workNo: newEmployee.EmployeeWorkNo || newEmployee.employeeWorkNo || "",
        phone: newEmployee.EmployeephoneNumber || newEmployee.employeephoneNumber || "",
      };

      // Select the new driver
      onDriverChange?.(normalizedDriver);
      setDriverSearchQuery(normalizedDriver.fullName);
      setShowAddDriverModal(false);
      setNewDriverName("");
    } catch (error) {
      console.error("[FuelingVolumeStep] Create driver error:", error);
      setCreateDriverError(error.message || "Failed to create employee");
    } finally {
      setIsCreatingDriver(false);
    }
  }, [newDriverName, siteId, onDriverChange]);

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
      {/* Header - Compact when keyboard visible */}
      <View style={[styles.header, isKeyboardVisible && styles.headerCompact]}>
        <Text
          style={[
            styles.stepTitle,
            isKeyboardVisible && styles.stepTitleCompact,
          ]}
        >
          Fueling Details
        </Text>
        {!isKeyboardVisible && (
          <Text style={styles.stepDescription}>
            Enter the volume of fuel to dispense
          </Text>
        )}
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
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

        {/* GPS Location Status or Bypass Indicator */}
        {isLocationBypassEnabled ? (
          <LocationBypassIndicator
            bypassReason={locationBypassReason || "Bypass enabled"}
          />
        ) : showLocationStatus ? (
          <LocationStatusIndicator
            onLocationUpdate={onLocationUpdate}
            maxAgeSeconds={maxLocationAgeSeconds}
            autoRefreshOnMount={true}
            showDetails={false}
          />
        ) : null}

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
                onFocus={() => {
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 200, animated: true });
                  }, 100);
                }}
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
              onFocus={() => {
                setTimeout(() => {
                  scrollViewRef.current?.scrollTo({ y: 350, animated: true });
                }, 100);
              }}
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

        {/* Driver/Employee Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>
            Driver <Text style={styles.optionalText}>(Optional)</Text>
          </Text>
          <View style={styles.driverSearchContainer}>
            <View style={[styles.driverInputWrapper, selectedDriver && styles.driverInputSelected]}>
              <Icon
                name="user"
                size={18}
                color={selectedDriver ? "#10b981" : "#6b7280"}
                style={styles.inputIcon}
              />
              <TextInput
                style={styles.input}
                value={selectedDriver ? selectedDriver.fullName : driverSearchQuery}
                onChangeText={(text) => {
                  if (selectedDriver) {
                    handleClearDriver();
                  }
                  setDriverSearchQuery(text);
                }}
                onFocus={() => {
                  if (selectedDriver) {
                    setDriverSearchQuery(selectedDriver.fullName);
                    handleClearDriver();
                  }
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 600, animated: true });
                  }, 100);
                }}
                placeholder="Search driver by name..."
                placeholderTextColor="#9ca3af"
                editable={!selectedDriver}
              />
              {(selectedDriver || driverSearchQuery) && (
                <TouchableOpacity onPress={handleClearDriver} style={styles.clearButton}>
                  <Icon name="times-circle" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Search Results Dropdown */}
            {showDriverResults && (
              <View style={styles.driverResultsContainer}>
                {isSearchingDriver ? (
                  <View style={styles.driverLoadingContainer}>
                    <ActivityIndicator size="small" color="#2563eb" />
                    <Text style={styles.driverLoadingText}>Searching...</Text>
                  </View>
                ) : driverSearchResults.length > 0 ? (
                  <FlatList
                    data={driverSearchResults}
                    keyExtractor={(item) => item.id?.toString()}
                    style={styles.driverResultsList}
                    keyboardShouldPersistTaps="handled"
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={styles.driverResultItem}
                        onPress={() => handleDriverSelect(item)}
                      >
                        <View style={styles.driverResultIcon}>
                          <Icon name="user" size={14} color="#10b981" />
                        </View>
                        <View style={styles.driverResultInfo}>
                          <Text style={styles.driverResultName}>{item.fullName}</Text>
                          <Text style={styles.driverResultMeta}>
                            {item.workNo && `#${item.workNo}`}
                            {item.workNo && item.siteName && " • "}
                            {item.siteName}
                          </Text>
                        </View>
                      </TouchableOpacity>
                    )}
                  />
                ) : driverSearchQuery.length >= 2 ? (
                  <View style={styles.noDriverResults}>
                    <Text style={styles.noDriverResultsText}>No drivers found</Text>
                    <TouchableOpacity
                      style={styles.addDriverButton}
                      onPress={handleOpenAddDriverModal}
                    >
                      <Icon name="plus-circle" size={16} color="#2563eb" />
                      <Text style={styles.addDriverButtonText}>
                        Add "{driverSearchQuery}" as new driver
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </View>
            )}
          </View>
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
            onFocus={() => {
              setTimeout(() => {
                scrollViewRef.current?.scrollToEnd({ animated: true });
              }, 100);
            }}
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
            <Text style={styles.summaryValue}>
              {sourceTank?.tankName || sourceTank?.name || sourceTank?.TankName || '-'}
            </Text>
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
                {parseFloat(odometer).toLocaleString()} {selectedVehicle?.averageKmL ? 'km' : 'hr'}
              </Text>
            </View>
          ) : null}
          {selectedDriver ? (
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Driver:</Text>
              <Text style={styles.summaryValue}>{selectedDriver.fullName}</Text>
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Add Driver Modal */}
      <Modal
        visible={showAddDriverModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddDriverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Add New Driver</Text>
              <TouchableOpacity
                onPress={() => setShowAddDriverModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Full Name *</Text>
                <TextInput
                  style={styles.modalInput}
                  value={newDriverName}
                  onChangeText={setNewDriverName}
                  placeholder="Enter employee full name"
                  placeholderTextColor="#9ca3af"
                  autoFocus={true}
                />
              </View>

              <View style={styles.modalField}>
                <Text style={styles.modalFieldLabel}>Site</Text>
                <TouchableOpacity
                  style={styles.modalSiteSelector}
                  onPress={() => setShowSitePicker(!showSitePicker)}
                >
                  <Icon name="map-marker-alt" size={14} color="#2563eb" />
                  <Text style={styles.modalSiteSelectorText}>
                    {sites?.find(s => s.id === newDriverSiteId)?.name ||
                     sites?.find(s => s.siteId === newDriverSiteId)?.siteName ||
                     siteName ||
                     `Site ${newDriverSiteId}`}
                  </Text>
                  <Icon name={showSitePicker ? "chevron-up" : "chevron-down"} size={12} color="#6b7280" />
                </TouchableOpacity>

                {showSitePicker && sites?.length > 0 && (
                  <View style={styles.sitePickerList}>
                    <FlatList
                      data={sites}
                      keyExtractor={(item) => (item.id || item.siteId)?.toString()}
                      style={{ maxHeight: 150 }}
                      keyboardShouldPersistTaps="handled"
                      renderItem={({ item }) => (
                        <TouchableOpacity
                          style={[
                            styles.sitePickerItem,
                            (item.id === newDriverSiteId || item.siteId === newDriverSiteId) && styles.sitePickerItemSelected
                          ]}
                          onPress={() => {
                            setNewDriverSiteId(item.id || item.siteId);
                            setShowSitePicker(false);
                          }}
                        >
                          <Text style={[
                            styles.sitePickerItemText,
                            (item.id === newDriverSiteId || item.siteId === newDriverSiteId) && styles.sitePickerItemTextSelected
                          ]}>
                            {item.name || item.siteName}
                          </Text>
                          {(item.id === newDriverSiteId || item.siteId === newDriverSiteId) && (
                            <Icon name="check" size={12} color="#2563eb" />
                          )}
                        </TouchableOpacity>
                      )}
                    />
                  </View>
                )}
              </View>

              {createDriverError ? (
                <Text style={styles.modalError}>{createDriverError}</Text>
              ) : null}
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowAddDriverModal(false)}
              >
                <Text style={styles.modalCancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalConfirmButton, isCreatingDriver && styles.buttonDisabled]}
                onPress={handleCreateDriver}
                disabled={isCreatingDriver}
              >
                {isCreatingDriver ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <>
                    <Icon name="check" size={14} color="#ffffff" />
                    <Text style={styles.modalConfirmButtonText}>Add Driver</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  headerCompact: {
    paddingVertical: 10,
    paddingHorizontal: 16,
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
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
  },
  stepTitleCompact: {
    fontSize: 16,
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
  // Driver Search Styles
  driverSearchContainer: {
    position: "relative",
    zIndex: 100,
  },
  driverInputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 14,
    height: 48,
  },
  driverInputSelected: {
    borderColor: "#10b981",
    backgroundColor: "#f0fdf4",
  },
  clearButton: {
    padding: 4,
    marginLeft: 8,
  },
  driverResultsContainer: {
    position: "absolute",
    top: 52,
    left: 0,
    right: 0,
    backgroundColor: "white",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    maxHeight: 240,
    zIndex: 1000,
  },
  driverResultsList: {
    maxHeight: 180,
  },
  driverResultItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  driverResultIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#dcfce7",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  driverResultInfo: {
    flex: 1,
  },
  driverResultName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
  },
  driverResultMeta: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  driverLoadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  driverLoadingText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  noDriverResults: {
    padding: 16,
    alignItems: "center",
  },
  noDriverResultsText: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 12,
  },
  addDriverButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  addDriverButtonText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: "500",
    color: "#2563eb",
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    width: "100%",
    maxWidth: 400,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 10,
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
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    padding: 16,
  },
  modalField: {
    marginBottom: 16,
  },
  modalFieldLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  modalInput: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
  },
  modalSiteInfo: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  modalSiteText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#6b7280",
  },
  modalSiteSelector: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 8,
  },
  modalSiteSelectorText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  sitePickerList: {
    maxHeight: 150,
    backgroundColor: "#ffffff",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    marginTop: 4,
    overflow: "hidden",
  },
  sitePickerItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  sitePickerItemSelected: {
    backgroundColor: "#eff6ff",
  },
  sitePickerItemText: {
    fontSize: 14,
    color: "#374151",
  },
  sitePickerItemTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  modalError: {
    color: "#dc2626",
    fontSize: 13,
    marginTop: 4,
  },
  modalActions: {
    flexDirection: "row",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  modalCancelButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  modalConfirmButton: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  modalConfirmButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default FuelingVolumeStep;
