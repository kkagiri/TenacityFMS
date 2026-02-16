/**
 * LocationSettingsScreen.js
 * Admin-only screen for managing location bypass
 * Features:
 * - Location Bypass management (enable/disable/cancel)
 * - View active bypasses (system-wide, vehicle-specific, user-specific)
 * - Enable new bypass with type, duration, and reason
 * - Searchable vehicle/user selection for granular bypasses
 */
import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TextInput,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Icon from "react-native-vector-icons/FontAwesome5";
import ApiService from "../../services/apiService";
import { usePermissions } from "../../hooks/usePermissions";
import SearchableSelectionModal from "../../components/common/SearchableSelectionModal";

// Bypass duration options
const BYPASS_DURATION_OPTIONS = [
  { value: 5, label: "5 minutes" },
  { value: 10, label: "10 minutes" },
  { value: 15, label: "15 minutes" },
  { value: 30, label: "30 minutes" },
  { value: 60, label: "1 hour" },
];

// Bypass type options
const BYPASS_TYPE_OPTIONS = [
  { value: "All", label: "All Vehicles (System-wide)" },
  { value: "Vehicle", label: "Specific Vehicles" },
  { value: "User", label: "Specific Users" },
];

const LocationSettingsScreen = ({ navigation }) => {
  const { isAdmin } = usePermissions();

  // Loading states
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [bypassLoading, setBypassLoading] = useState(false);

  // Overview data - used for vehicle/user selection
  const [overviewData, setOverviewData] = useState({
    users: [],
    ptsDevices: [],
    vehicles: [],
    totalUsersWithBypass: 0,
    totalUsersWithoutBypass: 0,
    totalPTSDevicesWithLocationValidation: 0,
    totalPTSDevicesWithoutLocationValidation: 0,
    totalVehiclesWithGPS: 0,
    totalVehiclesWithoutGPS: 0,
  });

  // Bypass state
  const [bypassStatus, setBypassStatus] = useState({
    isActive: false,
    expiresAt: null,
    enabledBy: null,
    reason: null,
    vehicleBypasses: [],
    userBypasses: [],
  });
  const [bypassDuration, setBypassDuration] = useState(5);
  const [bypassReason, setBypassReason] = useState("");
  const [bypassType, setBypassType] = useState("All");
  const [countdownDisplay, setCountdownDisplay] = useState(null);
  const [expiresAtDisplay, setExpiresAtDisplay] = useState(null);

  // Duration picker modal
  const [showDurationPicker, setShowDurationPicker] = useState(false);
  const [showTypePicker, setShowTypePicker] = useState(false);

  // Selection state for specific vehicles/users
  const [selectedVehicleIds, setSelectedVehicleIds] = useState([]);
  const [selectedUserIds, setSelectedUserIds] = useState([]);
  const [showVehicleSelectionModal, setShowVehicleSelectionModal] = useState(false);
  const [showUserSelectionModal, setShowUserSelectionModal] = useState(false);

  // Countdown timer ref
  const countdownRef = useRef(null);

  // Vehicle search function - stable reference using useCallback
  const searchVehicles = useCallback(async (query, limit) => {
    console.log("[LocationSettings] searchVehicles called:", query, limit);
    return await ApiService.searchVehicles(query, limit);
  }, []);

  // User search function - stable reference using useCallback
  const searchUsers = useCallback(async (query, limit) => {
    console.log("[LocationSettings] searchUsers called:", query, limit);
    return await ApiService.searchUsers(query, limit);
  }, []);

  // Normalize vehicle results
  const normalizeVehicle = useCallback((v) => ({
    vehicleId: v.VehicleId || v.vehicleId,
    hyoungNo: v.HyoungNo || v.hyoungNo || "",
    numberPlate: v.NumberPlate || v.numberPlate || v.PlateNumber || v.plateNumber || "",
    vehicleName: v.VehicleName || v.vehicleName || v.Name || v.name || "",
  }), []);

  // Normalize user results
  const normalizeUser = useCallback((u) => ({
    id: u.Id || u.id,
    userName: u.UserName || u.userName || "",
    email: u.Email || u.email || "",
  }), []);

  // Get vehicle display info
  const getVehicleDisplay = useCallback((item) => ({
    title: item.hyoungNo || "Unknown",
    subtitle: item.numberPlate || "",
    icon: "car",
  }), []);

  // Get user display info
  const getUserDisplay = useCallback((item) => ({
    title: item.userName || "Unknown",
    subtitle: item.email || "",
    icon: "user",
  }), []);

  // Key extractors
  const vehicleKeyExtractor = useCallback((item) => item.vehicleId, []);
  const userKeyExtractor = useCallback((item) => item.id, []);

  // Fetch overview data
  const fetchOverviewData = useCallback(async () => {
    try {
      const response = await ApiService.getLocationSettingsOverview();
      if (response?.isSuccess && response?.data) {
        setOverviewData(response.data);
      }
    } catch (error) {
      console.error("Error fetching location settings overview:", error);
    }
  }, []);

  // Fetch bypass status
  const fetchBypassStatus = useCallback(async () => {
    try {
      const response = await ApiService.getTemporaryBypassStatus();
      if (response) {
        setBypassStatus(response);
      }
    } catch (error) {
      console.error("Error fetching bypass status:", error);
    }
  }, []);

  // Initial data load
  useEffect(() => {
    if (isAdmin) {
      Promise.all([fetchOverviewData(), fetchBypassStatus()]).finally(() => {
        setLoading(false);
        setRefreshing(false);
      });
    } else {
      setLoading(false);
    }
  }, [isAdmin, fetchOverviewData, fetchBypassStatus]);

  // Countdown timer effect
  useEffect(() => {
    if (bypassStatus.isActive && bypassStatus.expiresAt) {
      // Format expiration time for display
      const expiresAt = new Date(bypassStatus.expiresAt);
      const timeStr = expiresAt.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
      setExpiresAtDisplay(timeStr);

      const updateCountdown = () => {
        const now = new Date();
        const remainingMs = expiresAt - now;

        if (remainingMs <= 0) {
          setCountdownDisplay(null);
          setExpiresAtDisplay(null);
          fetchBypassStatus();
          return;
        }

        const minutes = Math.floor(remainingMs / 60000);
        const seconds = Math.floor((remainingMs % 60000) / 1000);
        setCountdownDisplay(`${minutes}m ${seconds}s`);
      };

      updateCountdown();
      countdownRef.current = setInterval(updateCountdown, 1000);

      return () => {
        if (countdownRef.current) {
          clearInterval(countdownRef.current);
        }
      };
    } else {
      setCountdownDisplay(null);
      setExpiresAtDisplay(null);
    }
  }, [bypassStatus.isActive, bypassStatus.expiresAt, fetchBypassStatus]);

  // Refresh handler
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([fetchOverviewData(), fetchBypassStatus()]).finally(() => {
      setRefreshing(false);
    });
  }, [fetchOverviewData, fetchBypassStatus]);

  // Enable bypass handler
  const handleEnableBypass = async () => {
    if (!isAdmin) {
      Alert.alert("Error", "You do not have permission to enable bypass");
      return;
    }

    // Validate selection for specific types
    if (bypassType === "Vehicle" && selectedVehicleIds.length === 0) {
      Alert.alert("Error", "Please select at least one vehicle");
      return;
    }
    if (bypassType === "User" && selectedUserIds.length === 0) {
      Alert.alert("Error", "Please select at least one user");
      return;
    }

    setBypassLoading(true);
    try {
      const response = await ApiService.enableTemporaryBypass(
        bypassDuration,
        bypassReason,
        bypassType,
        bypassType === "Vehicle" ? selectedVehicleIds : [],
        bypassType === "User" ? selectedUserIds : []
      );

      if (response?.isSuccess) {
        const bypassTypeLabel =
          bypassType === "All"
            ? "system-wide"
            : bypassType === "Vehicle"
            ? `${selectedVehicleIds.length} vehicle(s)`
            : `${selectedUserIds.length} user(s)`;
        Alert.alert(
          "Success",
          `Location validation bypassed for ${bypassTypeLabel} for ${bypassDuration} minutes`
        );
        await fetchBypassStatus();
        setBypassReason("");
        setSelectedVehicleIds([]);
        setSelectedUserIds([]);
      } else {
        Alert.alert("Error", response?.message || "Failed to enable bypass");
      }
    } catch (error) {
      console.error("Error enabling bypass:", error);
      Alert.alert("Error", "Failed to enable bypass. Please try again.");
    } finally {
      setBypassLoading(false);
    }
  };

  // Cancel bypass handler
  const handleCancelBypass = async () => {
    Alert.alert(
      "Cancel Bypass",
      "Are you sure you want to cancel the active bypass? Location validation will be re-enabled.",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setBypassLoading(true);
            try {
              const response = await ApiService.cancelTemporaryBypass();
              if (response?.isSuccess) {
                Alert.alert(
                  "Success",
                  "Bypass cancelled. Location validation is now active."
                );
                await fetchBypassStatus();
              } else {
                Alert.alert(
                  "Error",
                  response?.message || "Failed to cancel bypass"
                );
              }
            } catch (error) {
              console.error("Error canceling bypass:", error);
              Alert.alert("Error", "Failed to cancel bypass");
            } finally {
              setBypassLoading(false);
            }
          },
        },
      ]
    );
  };

  // Cancel specific bypass
  const handleCancelSpecificBypass = async (bypassId, label) => {
    Alert.alert("Cancel Bypass", `Cancel bypass for ${label}?`, [
      { text: "No", style: "cancel" },
      {
        text: "Yes",
        style: "destructive",
        onPress: async () => {
          setBypassLoading(true);
          try {
            const response = await ApiService.cancelBypassById(bypassId);
            if (response?.isSuccess) {
              Alert.alert("Success", `Bypass for ${label} cancelled`);
              await fetchBypassStatus();
            } else {
              Alert.alert("Error", response?.message || "Failed to cancel");
            }
          } catch (error) {
            Alert.alert("Error", "Failed to cancel bypass");
          } finally {
            setBypassLoading(false);
          }
        },
      },
    ]);
  };

  // Get active bypass count
  const activeBypassCount =
    (bypassStatus.isActive ? 1 : 0) +
    (bypassStatus.vehicleBypasses?.length || 0) +
    (bypassStatus.userBypasses?.length || 0);

  // Access denied view
  if (!isAdmin) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Location Settings</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.accessDenied}>
          <Icon name="lock" size={48} color="#dc2626" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            This feature is available to administrators only.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // Loading view
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={20} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Location Settings</Text>
          <View style={styles.headerRight} />
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  const getSelectedDurationLabel = () => {
    const option = BYPASS_DURATION_OPTIONS.find((o) => o.value === bypassDuration);
    return option?.label || `${bypassDuration} minutes`;
  };

  const getSelectedTypeLabel = () => {
    const option = BYPASS_TYPE_OPTIONS.find((o) => o.value === bypassType);
    return option?.label || bypassType;
  };

  // Get selection count label
  const getSelectionCountLabel = () => {
    if (bypassType === "Vehicle") {
      return selectedVehicleIds.length > 0
        ? `${selectedVehicleIds.length} vehicle(s) selected`
        : "Tap to select vehicles";
    } else if (bypassType === "User") {
      return selectedUserIds.length > 0
        ? `${selectedUserIds.length} user(s) selected`
        : "Tap to select users";
    }
    return "";
  };

  // Open the appropriate selection modal based on bypass type
  const openSelectionModal = () => {
    if (bypassType === "Vehicle") {
      setShowVehicleSelectionModal(true);
    } else if (bypassType === "User") {
      setShowUserSelectionModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={20} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Location Settings</Text>
        <TouchableOpacity
          style={styles.refreshButton}
          onPress={onRefresh}
          disabled={refreshing}
        >
          <Icon name="sync" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* ========== ACTIVE BYPASS STATUS DETAIL SECTION ========== */}
        {bypassStatus.isActive && (
          <View style={styles.bypassStatusCard}>
            <View style={styles.bypassStatusHeader}>
              <View style={styles.bypassStatusIconContainer}>
                <Icon name="shield-alt" size={24} color="#fff" />
              </View>
              <View style={styles.bypassStatusInfo}>
                <Text style={styles.bypassStatusTitle}>System-Wide Bypass</Text>
                <Text style={styles.bypassStatusExpiry}>
                  Expires at {expiresAtDisplay || '--:--'} - {countdownDisplay || '...'} remaining
                </Text>
              </View>
            </View>

            {bypassStatus.enabledBy && (
              <View style={styles.bypassStatusDetail}>
                <Icon name="user" size={14} color="#fecaca" />
                <Text style={styles.bypassStatusDetailText}>
                  Enabled by: {bypassStatus.enabledBy}
                </Text>
              </View>
            )}

            {bypassStatus.reason && (
              <View style={styles.bypassStatusDetail}>
                <Icon name="comment" size={14} color="#fecaca" />
                <Text style={styles.bypassStatusDetailText}>
                  Reason: {bypassStatus.reason}
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.bypassStatusCancelButton}
              onPress={handleCancelBypass}
              disabled={bypassLoading}
            >
              {bypassLoading ? (
                <ActivityIndicator size="small" color="#dc2626" />
              ) : (
                <>
                  <Icon name="times" size={14} color="#dc2626" />
                  <Text style={styles.bypassStatusCancelText}>Cancel Bypass</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* ========== VEHICLE-SPECIFIC BYPASSES ========== */}
        {bypassStatus.vehicleBypasses?.length > 0 && (
          <View style={styles.specificBypassesCard}>
            <View style={styles.specificBypassesHeader}>
              <Icon name="truck" size={18} color="#2563eb" />
              <Text style={styles.specificBypassesTitle}>
                Vehicle Bypasses ({bypassStatus.vehicleBypasses.length})
              </Text>
            </View>
            {bypassStatus.vehicleBypasses.map((bypass, index) => (
              <View key={index} style={styles.specificBypassItem}>
                <View style={styles.specificBypassItemInfo}>
                  <Text style={styles.specificBypassItemName}>
                    {bypass.vehicleName || bypass.hyoungNo || `Vehicle #${bypass.vehicleId}`}
                  </Text>
                  <Text style={styles.specificBypassItemExpiry}>
                    Expires: {new Date(bypass.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                </View>
                {bypass.reason && (
                  <Text style={styles.specificBypassItemReason}>
                    {bypass.reason}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ========== USER-SPECIFIC BYPASSES ========== */}
        {bypassStatus.userBypasses?.length > 0 && (
          <View style={styles.specificBypassesCard}>
            <View style={styles.specificBypassesHeader}>
              <Icon name="user" size={18} color="#7c3aed" />
              <Text style={styles.specificBypassesTitle}>
                User Bypasses ({bypassStatus.userBypasses.length})
              </Text>
            </View>
            {bypassStatus.userBypasses.map((bypass, index) => (
              <View key={index} style={styles.specificBypassItem}>
                <View style={styles.specificBypassItemInfo}>
                  <Text style={styles.specificBypassItemName}>
                    {bypass.userName || bypass.email || `User #${bypass.userId}`}
                  </Text>
                  <Text style={styles.specificBypassItemExpiry}>
                    Expires: {new Date(bypass.expiresAt).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </Text>
                </View>
                {bypass.reason && (
                  <Text style={styles.specificBypassItemReason}>
                    {bypass.reason}
                  </Text>
                )}
              </View>
            ))}
          </View>
        )}

        {/* ========== LOCATION BYPASS SECTION ========== */}
        <View
          style={[
            styles.bypassSection,
            activeBypassCount > 0
              ? styles.bypassSectionActive
              : styles.bypassSectionInactive,
          ]}
        >
          {/* Bypass Header */}
          <View style={styles.bypassHeader}>
            <View
              style={[
                styles.bypassIconContainer,
                activeBypassCount > 0
                  ? styles.bypassIconActive
                  : styles.bypassIconInactive,
              ]}
            >
              <Icon
                name="shield-alt"
                size={24}
                color={activeBypassCount > 0 ? "#dc2626" : "#d97706"}
              />
            </View>
            <View style={styles.bypassHeaderText}>
              <Text style={styles.bypassTitle}>Location Bypass</Text>
              <Text style={styles.bypassSubtitle}>
                {activeBypassCount > 0
                  ? `${activeBypassCount} bypass${activeBypassCount > 1 ? "es" : ""} active`
                  : "Temporarily disable location validation"}
              </Text>
            </View>
          </View>

          {/* Active Bypass Display */}
          {bypassStatus.isActive && (
            <View style={styles.activeBypassCard}>
              <View style={styles.activeBypassHeader}>
                <View style={styles.activeBypassBadge}>
                  <Icon name="exclamation-triangle" size={12} color="#fff" />
                  <Text style={styles.activeBypassBadgeText}>
                    SYSTEM-WIDE BYPASS ACTIVE
                  </Text>
                </View>
                {countdownDisplay && (
                  <Text style={styles.countdownText}>{countdownDisplay}</Text>
                )}
              </View>
              {bypassStatus.reason && (
                <Text style={styles.bypassReasonText}>
                  Reason: {bypassStatus.reason}
                </Text>
              )}
              {bypassStatus.enabledBy && (
                <Text style={styles.bypassEnabledByText}>
                  Enabled by: {bypassStatus.enabledBy}
                </Text>
              )}
              <TouchableOpacity
                style={styles.cancelBypassButton}
                onPress={handleCancelBypass}
                disabled={bypassLoading}
              >
                {bypassLoading ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <>
                    <Icon name="times" size={14} color="#fff" />
                    <Text style={styles.cancelBypassButtonText}>
                      Cancel Bypass
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* Vehicle Bypasses */}
          {bypassStatus.vehicleBypasses?.length > 0 && (
            <View style={styles.granularBypassList}>
              <Text style={styles.granularBypassTitle}>Vehicle Bypasses</Text>
              {bypassStatus.vehicleBypasses.map((bypass) => (
                <View key={bypass.id} style={styles.granularBypassItem}>
                  <View style={styles.granularBypassInfo}>
                    <Icon name="car" size={14} color="#2563eb" />
                    <Text style={styles.granularBypassName}>
                      {bypass.vehicleName || `Vehicle ${bypass.vehicleId}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.granularCancelButton}
                    onPress={() =>
                      handleCancelSpecificBypass(
                        bypass.id,
                        bypass.vehicleName || `Vehicle ${bypass.vehicleId}`
                      )
                    }
                  >
                    <Icon name="times" size={12} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* User Bypasses */}
          {bypassStatus.userBypasses?.length > 0 && (
            <View style={styles.granularBypassList}>
              <Text style={styles.granularBypassTitle}>User Bypasses</Text>
              {bypassStatus.userBypasses.map((bypass) => (
                <View key={bypass.id} style={styles.granularBypassItem}>
                  <View style={styles.granularBypassInfo}>
                    <Icon name="user" size={14} color="#9333ea" />
                    <Text style={styles.granularBypassName}>
                      {bypass.userName || `User ${bypass.userId}`}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.granularCancelButton}
                    onPress={() =>
                      handleCancelSpecificBypass(
                        bypass.id,
                        bypass.userName || `User ${bypass.userId}`
                      )
                    }
                  >
                    <Icon name="times" size={12} color="#dc2626" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}

          {/* Enable New Bypass Form */}
          <View style={styles.bypassForm}>
            <Text style={styles.bypassFormTitle}>Enable New Bypass</Text>

            {/* Bypass Type Selector */}
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowTypePicker(true)}
            >
              <Text style={styles.pickerLabel}>Bypass Type</Text>
              <View style={styles.pickerValue}>
                <Text style={styles.pickerValueText}>
                  {getSelectedTypeLabel()}
                </Text>
                <Icon name="chevron-down" size={12} color="#6b7280" />
              </View>
            </TouchableOpacity>

            {/* Vehicle/User Selector - Only shown for specific types */}
            {(bypassType === "Vehicle" || bypassType === "User") && (
              <TouchableOpacity
                style={[
                  styles.pickerButton,
                  styles.selectionPickerButton,
                  (bypassType === "Vehicle" && selectedVehicleIds.length > 0) ||
                  (bypassType === "User" && selectedUserIds.length > 0)
                    ? styles.selectionPickerButtonActive
                    : null,
                ]}
                onPress={openSelectionModal}
              >
                <Text style={styles.pickerLabel}>
                  {bypassType === "Vehicle" ? "Select Vehicles" : "Select Users"}
                </Text>
                <View style={styles.pickerValue}>
                  <Text
                    style={[
                      styles.pickerValueText,
                      (bypassType === "Vehicle" && selectedVehicleIds.length > 0) ||
                      (bypassType === "User" && selectedUserIds.length > 0)
                        ? styles.pickerValueTextActive
                        : styles.pickerValueTextPlaceholder,
                    ]}
                  >
                    {getSelectionCountLabel()}
                  </Text>
                  <Icon name="chevron-right" size={12} color="#6b7280" />
                </View>
              </TouchableOpacity>
            )}

            {/* Duration Selector */}
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowDurationPicker(true)}
            >
              <Text style={styles.pickerLabel}>Duration</Text>
              <View style={styles.pickerValue}>
                <Text style={styles.pickerValueText}>
                  {getSelectedDurationLabel()}
                </Text>
                <Icon name="chevron-down" size={12} color="#6b7280" />
              </View>
            </TouchableOpacity>

            {/* Reason Input */}
            <View style={styles.reasonInputContainer}>
              <Text style={styles.pickerLabel}>Reason (optional)</Text>
              <TextInput
                style={styles.reasonInput}
                placeholder="Enter reason for bypass..."
                value={bypassReason}
                onChangeText={setBypassReason}
                multiline
                numberOfLines={2}
              />
            </View>

            {/* Enable Button */}
            <TouchableOpacity
              style={[
                styles.enableBypassButton,
                bypassLoading && styles.enableBypassButtonDisabled,
              ]}
              onPress={handleEnableBypass}
              disabled={bypassLoading}
            >
              {bypassLoading ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <>
                  <Icon name="shield-alt" size={16} color="#fff" />
                  <Text style={styles.enableBypassButtonText}>
                    Enable Bypass
                  </Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Duration Picker Modal */}
      <Modal
        visible={showDurationPicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDurationPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Duration</Text>
              <TouchableOpacity onPress={() => setShowDurationPicker(false)}>
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {BYPASS_DURATION_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  bypassDuration === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setBypassDuration(option.value);
                  setShowDurationPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    bypassDuration === option.value &&
                      styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {bypassDuration === option.value && (
                  <Icon name="check" size={16} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Type Picker Modal */}
      <Modal
        visible={showTypePicker}
        transparent
        animationType="slide"
        onRequestClose={() => setShowTypePicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Bypass Type</Text>
              <TouchableOpacity onPress={() => setShowTypePicker(false)}>
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            {BYPASS_TYPE_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[
                  styles.modalOption,
                  bypassType === option.value && styles.modalOptionSelected,
                ]}
                onPress={() => {
                  setBypassType(option.value);
                  setShowTypePicker(false);
                }}
              >
                <Text
                  style={[
                    styles.modalOptionText,
                    bypassType === option.value &&
                      styles.modalOptionTextSelected,
                  ]}
                >
                  {option.label}
                </Text>
                {bypassType === option.value && (
                  <Icon name="check" size={16} color="#2563eb" />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </Modal>

      {/* Vehicle Selection Modal */}
      <SearchableSelectionModal
        visible={showVehicleSelectionModal}
        onClose={() => setShowVehicleSelectionModal(false)}
        title="Select Vehicles"
        searchPlaceholder="Search by vehicle number or plate..."
        itemTypeName="vehicles"
        icon="car"
        searchFn={searchVehicles}
        selectedIds={selectedVehicleIds}
        onSelectionChange={setSelectedVehicleIds}
        keyExtractor={vehicleKeyExtractor}
        getItemDisplay={getVehicleDisplay}
        normalizeResult={normalizeVehicle}
      />

      {/* User Selection Modal */}
      <SearchableSelectionModal
        visible={showUserSelectionModal}
        onClose={() => setShowUserSelectionModal(false)}
        title="Select Users"
        searchPlaceholder="Search by username or email..."
        itemTypeName="users"
        icon="user"
        searchFn={searchUsers}
        selectedIds={selectedUserIds}
        onSelectionChange={setSelectedUserIds}
        keyExtractor={userKeyExtractor}
        getItemDisplay={getUserDisplay}
        normalizeResult={normalizeUser}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#fff",
  },
  headerRight: {
    width: 36,
  },
  refreshButton: {
    padding: 8,
  },
  scrollContainer: {
    flex: 1,
  },

  // Bypass Status Card (Top detail section)
  bypassStatusCard: {
    backgroundColor: "#dc2626",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 16,
    padding: 16,
  },
  bypassStatusHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  bypassStatusIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bypassStatusInfo: {
    flex: 1,
    marginLeft: 14,
  },
  bypassStatusTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  bypassStatusExpiry: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fecaca",
    marginTop: 4,
  },
  bypassStatusDetail: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.15)",
  },
  bypassStatusDetailText: {
    fontSize: 14,
    color: "#fecaca",
    marginLeft: 10,
  },
  bypassStatusCancelButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    paddingVertical: 12,
    marginTop: 12,
    gap: 8,
  },
  bypassStatusCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#dc2626",
  },

  // Specific (Vehicle/User) Bypass Cards
  specificBypassesCard: {
    backgroundColor: "#fff",
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  specificBypassesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  specificBypassesTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f2937",
  },
  specificBypassItem: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  specificBypassItemInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  specificBypassItemName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  specificBypassItemExpiry: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "500",
  },
  specificBypassItemReason: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 6,
    fontStyle: "italic",
  },

  // Active Bypass Banner (kept for vehicle/user bypasses when no system-wide)
  activeBypassBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginHorizontal: 12,
    marginTop: 12,
    borderRadius: 12,
  },
  bannerIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  bannerContent: {
    flex: 1,
    marginLeft: 12,
  },
  bannerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  bannerCountdown: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fecaca",
    marginTop: 2,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: "#fecaca",
    marginTop: 2,
  },
  bannerAction: {
    padding: 8,
  },

  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  accessDenied: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 16,
  },
  accessDeniedText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
  },

  // Bypass Section
  bypassSection: {
    margin: 12,
    borderRadius: 16,
    padding: 16,
    borderWidth: 2,
  },
  bypassSectionActive: {
    backgroundColor: "#fef2f2",
    borderColor: "#fca5a5",
  },
  bypassSectionInactive: {
    backgroundColor: "#fffbeb",
    borderColor: "#fcd34d",
  },
  bypassHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  bypassIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bypassIconActive: {
    backgroundColor: "#fee2e2",
  },
  bypassIconInactive: {
    backgroundColor: "#fef3c7",
  },
  bypassHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  bypassTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
  },
  bypassSubtitle: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },

  // Active Bypass Card
  activeBypassCard: {
    backgroundColor: "#fee2e2",
    borderRadius: 12,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#fca5a5",
  },
  activeBypassHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  activeBypassBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dc2626",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 6,
  },
  activeBypassBadgeText: {
    color: "#fff",
    fontSize: 11,
    fontWeight: "700",
  },
  countdownText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#dc2626",
  },
  bypassReasonText: {
    fontSize: 13,
    color: "#7f1d1d",
    marginBottom: 4,
  },
  bypassEnabledByText: {
    fontSize: 12,
    color: "#991b1b",
    marginBottom: 12,
  },
  cancelBypassButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#dc2626",
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    gap: 6,
  },
  cancelBypassButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },

  // Granular Bypass List
  granularBypassList: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 12,
  },
  granularBypassTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  granularBypassItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  granularBypassInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  granularBypassName: {
    fontSize: 14,
    color: "#1f2937",
  },
  granularCancelButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#fee2e2",
    alignItems: "center",
    justifyContent: "center",
  },

  // Bypass Form
  bypassForm: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 14,
  },
  bypassFormTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  pickerButton: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  pickerLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  pickerValue: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pickerValueText: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
  },
  reasonInputContainer: {
    marginBottom: 12,
  },
  reasonInput: {
    backgroundColor: "#f9fafb",
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    fontSize: 14,
    color: "#1f2937",
    minHeight: 60,
    textAlignVertical: "top",
  },
  enableBypassButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#d97706",
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  enableBypassButtonDisabled: {
    opacity: 0.6,
  },
  enableBypassButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },

  // Overview Section
  overviewSection: {
    margin: 12,
    marginTop: 0,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 12,
  },
  statsScrollView: {
    marginBottom: 12,
  },
  statsContent: {
    gap: 8,
  },
  statCard: {
    width: 100,
    padding: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  statCardPurple: {
    backgroundColor: "#faf5ff",
  },
  statCardGreen: {
    backgroundColor: "#f0fdf4",
  },
  statCardBlue: {
    backgroundColor: "#eff6ff",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 2,
  },

  // Tabs
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 4,
    marginBottom: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    gap: 4,
    borderRadius: 8,
  },
  tabActive: {
    backgroundColor: "#eff6ff",
  },
  tabText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  tabTextActive: {
    color: "#2563eb",
  },

  // List
  listContainer: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 4,
  },
  listItem: {
    padding: 12,
  },
  listItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 6,
  },
  listItemTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  listItemSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  listItemRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 12,
  },
  listItemLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  settingsGrid: {
    flexDirection: "row",
    marginTop: 8,
    gap: 12,
  },
  settingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  settingLabel: {
    fontSize: 11,
    color: "#6b7280",
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 12,
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 40,
  },
  emptyText: {
    marginTop: 8,
    fontSize: 14,
    color: "#9ca3af",
  },

  // Badges
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  badgeIcon: {
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "500",
  },
  badgeSuccess: {
    backgroundColor: "#dcfce7",
  },
  badgeTextSuccess: {
    color: "#166534",
  },
  badgeDefault: {
    backgroundColor: "#f3f4f6",
  },
  badgeTextDefault: {
    color: "#6b7280",
  },
  badgeError: {
    backgroundColor: "#fee2e2",
  },
  badgeTextError: {
    color: "#dc2626",
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 30,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
  },
  modalOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalOptionSelected: {
    backgroundColor: "#eff6ff",
  },
  modalOptionText: {
    fontSize: 15,
    color: "#1f2937",
  },
  modalOptionTextSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },

  // Selection Picker Button Styles
  selectionPickerButton: {
    borderStyle: "dashed",
  },
  selectionPickerButtonActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  pickerValueTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  pickerValueTextPlaceholder: {
    color: "#9ca3af",
  },
});

export default LocationSettingsScreen;
