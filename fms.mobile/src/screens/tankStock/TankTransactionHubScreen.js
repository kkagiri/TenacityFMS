/**
 * TankTransactionHubScreen.js
 *
 * Mobile equivalent of TransactionHub.js from frontend
 * Displays tank volume history with filtering by date, site, tank
 */
import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Modal,
  Dimensions,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import CustomDateTimePicker from "../../components/common/CustomDateTimePicker";
import { Picker } from "@react-native-picker/picker";

import {
  fetchTankVolumeHistory,
  setFilters,
  resetFilters,
  clearTransactions,
  setRefreshing,
} from "../../redux/slices/tankVolumeHistorySlice";
import { fetchSiteList } from "../../redux/slices/siteSlice";
import { fetchTanksBySite } from "../../redux/slices/tankSlice";

const { width } = Dimensions.get("window");

const formatLocalDateForApi = (date) => {
  if (!(date instanceof Date) || Number.isNaN(date.getTime())) return null;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseDateForDisplay = (dateValue) => {
  if (!dateValue) return null;
  if (dateValue instanceof Date) return dateValue;

  const dateText = String(dateValue).trim();

  if (/^\d{4}-\d{2}-\d{2}$/.test(dateText)) {
    const [year, month, day] = dateText.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2}(\.\d{1,7})?)?$/.test(dateText)
  ) {
    return new Date(`${dateText}Z`);
  }

  return new Date(dateText);
};

// Volume change reason mapping (matches backend VolumeChangeReasonEnum.cs)
const VolumeChangeReasonEnum = [
  { id: 0, name: "Opening Stock", color: "#3B82F6", icon: "play-circle" },
  { id: 1, name: "Closing Stock", color: "#6B7280", icon: "stop-circle" },
  { id: 2, name: "Delivery", color: "#10B981", icon: "truck-loading" },
  { id: 3, name: "Transfer In", color: "#3B82F6", icon: "arrow-right" },
  { id: 4, name: "Transfer Out", color: "#F59E0B", icon: "arrow-left" },
  { id: 5, name: "Adjustment", color: "#8B5CF6", icon: "edit" },
  { id: 6, name: "Dispensing", color: "#EF4444", icon: "gas-pump" },
  { id: 7, name: "Auto Dispensing", color: "#DC2626", icon: "robot" },
  { id: 8, name: "Reconciliation", color: "#6366F1", icon: "balance-scale" },
  { id: 9, name: "Auto Reconciliation", color: "#8B5CF6", icon: "sync-alt" },
];

const TankTransactionHubScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  // Redux state
  const { transactions, isLoading, isRefreshing, error, filters, summary } =
    useSelector((state) => state.tankVolumeHistory);

  const { user } = useSelector((state) => state.auth);
  const { sites, isLoading: sitesLoading } = useSelector((state) => state.site);
  const { tanks, isLoading: tanksLoading } = useSelector((state) => state.tank);
  const { selectedSite } = useSelector((state) => state.device);

  // Local UI state
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState("start"); // 'start' or 'end'
  const [tempFilters, setTempFilters] = useState({
    siteId: null,
    tankId: null,
    startDate: null,
    endDate: null,
  });

  // Initialize filters with today's date and selected site
  useEffect(() => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    const initialFilters = {
      startDate: formatLocalDateForApi(startOfDay),
      endDate: formatLocalDateForApi(endOfDay),
      siteId: selectedSite?.id || null,
      tankId: null,
      take: 100,
      includeVehicleNames: true,
    };

    setTempFilters({
      siteId: initialFilters.siteId,
      tankId: null,
      startDate: startOfDay,
      endDate: endOfDay,
    });

    dispatch(setFilters(initialFilters));
    dispatch(fetchSiteList());
  }, []);

  // Fetch tanks when site changes
  useEffect(() => {
    if (tempFilters.siteId) {
      dispatch(fetchTanksBySite(tempFilters.siteId));
    }
  }, [tempFilters.siteId]);

  // Load transactions when filters change
  useEffect(() => {
    if (filters.startDate && filters.endDate) {
      loadTransactions();
    }
  }, [filters]);

  const loadTransactions = useCallback(() => {
    dispatch(fetchTankVolumeHistory(filters));
  }, [dispatch, filters]);

  const handleRefresh = useCallback(() => {
    dispatch(setRefreshing(true));
    loadTransactions();
  }, [loadTransactions]);

  const handleApplyFilters = useCallback(() => {
    const newFilters = {
      siteId: tempFilters.siteId,
      tankId: tempFilters.tankId,
      startDate: tempFilters.startDate
        ? typeof tempFilters.startDate === "string"
          ? tempFilters.startDate
          : formatLocalDateForApi(tempFilters.startDate)
        : null,
      endDate: tempFilters.endDate
        ? typeof tempFilters.endDate === "string"
          ? tempFilters.endDate
          : formatLocalDateForApi(tempFilters.endDate)
        : null,
      take: 100,
      includeVehicleNames: true,
    };

    dispatch(setFilters(newFilters));
    setShowFilters(false);
  }, [dispatch, tempFilters]);

  const handleClearFilters = useCallback(() => {
    const today = new Date();
    const startOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
    const endOfDay = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      23,
      59,
      59
    );

    setTempFilters({
      siteId: selectedSite?.id || null,
      tankId: null,
      startDate: startOfDay,
      endDate: endOfDay,
    });

    dispatch(resetFilters());
    setShowFilters(false);
  }, [dispatch, selectedSite]);

  const handleDateChange = useCallback(
    (selectedDate) => {
      setShowDatePicker(false);
      if (selectedDate) {
        setTempFilters((prev) => ({
          ...prev,
          [datePickerMode === "start" ? "startDate" : "endDate"]: selectedDate,
        }));
      }
    },
    [datePickerMode]
  );

  const openDatePicker = useCallback((mode) => {
    setDatePickerMode(mode);
    setShowDatePicker(true);
  }, []);

  // Default fallback for unknown reason types
  const unknownReason = {
    id: -1,
    name: "Unknown",
    color: "#6B7280",
    icon: "question",
  };

  // Get reason details
  const getReasonDetails = (reasonId) => {
    return (
      VolumeChangeReasonEnum.find((r) => r.id === reasonId) || unknownReason
    );
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = parseDateForDisplay(dateString);
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return "";
    const date = parseDateForDisplay(dateString);
    if (!date || Number.isNaN(date.getTime())) return "";
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Format volume
  const formatVolume = (volume) => {
    if (volume === null || volume === undefined) return "-";
    const num = parseFloat(volume);
    if (isNaN(num)) return "-";

    const prefix = num > 0 ? "+" : "";
    return `${prefix}${num.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })} L`;
  };

  // Get volume color
  const getVolumeColor = (volume) => {
    if (!volume) return "#6B7280";
    const num = parseFloat(volume);
    if (num > 0) return "#10B981"; // Green for positive
    if (num < 0) return "#EF4444"; // Red for negative
    return "#6B7280";
  };

  // Calculate detailed summary by reason type
  const detailedSummary = useMemo(() => {
    const summaryByReason = {
      openingStock: { count: 0, volume: 0 },    // id: 0
      closingStock: { count: 0, volume: 0 },    // id: 1
      delivery: { count: 0, volume: 0 },        // id: 2
      transferIn: { count: 0, volume: 0 },      // id: 3
      transferOut: { count: 0, volume: 0 },     // id: 4
      adjustment: { count: 0, volume: 0 },      // id: 5
      dispensing: { count: 0, volume: 0 },      // id: 6
      autoDispensing: { count: 0, volume: 0 },  // id: 7
      reconciliation: { count: 0, volume: 0 },  // id: 8
      autoReconciliation: { count: 0, volume: 0 }, // id: 9
    };

    transactions.forEach((tx) => {
      const volumeChange = parseFloat(tx.volumeChange || tx.amount || 0);
      const reasonId = tx.reason ?? tx.volumeChangeReason ?? -1;

      switch (reasonId) {
        case 0:
          summaryByReason.openingStock.count++;
          summaryByReason.openingStock.volume += volumeChange;
          break;
        case 1:
          summaryByReason.closingStock.count++;
          summaryByReason.closingStock.volume += volumeChange;
          break;
        case 2:
          summaryByReason.delivery.count++;
          summaryByReason.delivery.volume += volumeChange;
          break;
        case 3:
          summaryByReason.transferIn.count++;
          summaryByReason.transferIn.volume += volumeChange;
          break;
        case 4:
          summaryByReason.transferOut.count++;
          summaryByReason.transferOut.volume += volumeChange;
          break;
        case 5:
          summaryByReason.adjustment.count++;
          summaryByReason.adjustment.volume += volumeChange;
          break;
        case 6:
          summaryByReason.dispensing.count++;
          summaryByReason.dispensing.volume += volumeChange;
          break;
        case 7:
          summaryByReason.autoDispensing.count++;
          summaryByReason.autoDispensing.volume += volumeChange;
          break;
        case 8:
          summaryByReason.reconciliation.count++;
          summaryByReason.reconciliation.volume += volumeChange;
          break;
        case 9:
          summaryByReason.autoReconciliation.count++;
          summaryByReason.autoReconciliation.volume += volumeChange;
          break;
        default:
          break;
      }
    });

    return summaryByReason;
  }, [transactions]);

  // Render transaction item
  const renderTransactionItem = ({ item, index }) => {
    const reason = getReasonDetails(
      item.volumeChangeReason || item.changeReason
    );
    const volumeChange = item.volumeChange || item.amount || 0;

    return (
      <TouchableOpacity style={styles.transactionCard} activeOpacity={0.7}>
        {/* Header Row */}
        <View style={styles.cardHeader}>
          <View
            style={[
              styles.reasonBadge,
              { backgroundColor: reason.color + "20" },
            ]}
          >
            <Icon name={reason.icon} size={12} color={reason.color} />
            <Text style={[styles.reasonText, { color: reason.color }]}>
              {reason.name}
            </Text>
          </View>
          <Text style={styles.timestamp}>
            {formatDate(item.timestamp)} {formatTime(item.timestamp)}
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.cardContent}>
          {/* Left: Tank & Site Info */}
          <View style={styles.infoSection}>
            {item.tankName && (
              <View style={styles.infoRow}>
                <Icon
                  name="database"
                  size={12}
                  color="#6B7280"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.tankName}
                </Text>
              </View>
            )}
            {item.siteName && (
              <View style={styles.infoRow}>
                <Icon
                  name="map-marker-alt"
                  size={12}
                  color="#6B7280"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.siteName}
                </Text>
              </View>
            )}
            {item.vehicleName && (
              <View style={styles.infoRow}>
                <Icon
                  name="truck"
                  size={12}
                  color="#6B7280"
                  style={styles.infoIcon}
                />
                <Text style={styles.infoText} numberOfLines={1}>
                  {item.vehicleName}
                </Text>
              </View>
            )}
          </View>

          {/* Right: Volume Change */}
          <View style={styles.volumeSection}>
            <Text
              style={[
                styles.volumeChange,
                { color: getVolumeColor(volumeChange) },
              ]}
            >
              {formatVolume(volumeChange)}
            </Text>
            {item.newVolume !== undefined && (
              <Text style={styles.newVolume}>
                New:{" "}
                {parseFloat(item.newVolume).toLocaleString("en-US", {
                  maximumFractionDigits: 0,
                })}{" "}
                L
              </Text>
            )}
          </View>
        </View>

        {/* Footer: Recorded By */}
        {(item.recordedByUserName || item.userName) && (
          <View style={styles.cardFooter}>
            <Icon name="user" size={10} color="#9CA3AF" />
            <Text style={styles.recordedBy}>
              {item.recordedByUserName || item.userName}
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  // Helper to format summary volume
  const formatSummaryVolume = (volume) => {
    const absVolume = Math.abs(volume);
    return absVolume.toLocaleString("en-US", { maximumFractionDigits: 0 });
  };

  // Summary items configuration - ordered as requested
  const summaryItems = [
    // Opening Stock - first
    {
      key: "openingStock",
      label: "Opening",
      icon: "play-circle",
      color: "#3B82F6",
      data: detailedSummary.openingStock,
    },
    // Dispensing (combined manual + auto)
    {
      key: "dispensing",
      label: "Dispensed",
      icon: "gas-pump",
      color: "#EF4444",
      data: {
        count: detailedSummary.dispensing.count + detailedSummary.autoDispensing.count,
        volume: detailedSummary.dispensing.volume + detailedSummary.autoDispensing.volume,
      },
    },
    // Transfer In
    {
      key: "transferIn",
      label: "Transfer In",
      icon: "arrow-right",
      color: "#3B82F6",
      data: detailedSummary.transferIn,
    },
    // Transfer Out
    {
      key: "transferOut",
      label: "Transfer Out",
      icon: "arrow-left",
      color: "#F59E0B",
      data: detailedSummary.transferOut,
    },
    // Delivery
    {
      key: "delivery",
      label: "Delivery",
      icon: "truck-loading",
      color: "#10B981",
      data: detailedSummary.delivery,
    },
    // Others (Adjustment + Reconciliation + Auto Reconciliation)
    {
      key: "others",
      label: "Adjustment",
      icon: "edit",
      color: "#8B5CF6",
      data: {
        count:
          detailedSummary.adjustment.count +
          detailedSummary.reconciliation.count +
          detailedSummary.autoReconciliation.count,
        volume:
          detailedSummary.adjustment.volume +
          detailedSummary.reconciliation.volume +
          detailedSummary.autoReconciliation.volume,
      },
    },
    // Closing Stock - last
    {
      key: "closingStock",
      label: "Closing",
      icon: "stop-circle",
      color: "#6B7280",
      data: detailedSummary.closingStock,
    },
  ];

  // Filter out items with no transactions
  const activeSummaryItems = summaryItems.filter((item) => item.data.count > 0);

  // Render summary cards
  const renderSummary = () => (
    <View style={styles.summarySection}>
      {/* Total transactions header */}
      <View style={styles.summaryHeader}>
        <Icon name="exchange-alt" size={14} color="#6B7280" />
        <Text style={styles.summaryHeaderText}>
          {summary.totalTransactions} Transactions
        </Text>
      </View>

      {/* Detailed breakdown */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.summaryScrollView}
        contentContainerStyle={styles.summaryScrollContent}
      >
        {activeSummaryItems.length > 0 ? (
          activeSummaryItems.map((item) => (
            <View key={item.key} style={styles.summaryCard}>
              <View
                style={[
                  styles.summaryIconBadge,
                  { backgroundColor: `${item.color}20` },
                ]}
              >
                <Icon name={item.icon} size={14} color={item.color} />
              </View>
              <Text
                style={[
                  styles.summaryValue,
                  { color: item.data.volume < 0 ? "#EF4444" : item.color },
                ]}
              >
                {item.data.volume < 0 ? "-" : "+"}
                {formatSummaryVolume(item.data.volume)}
              </Text>
              <Text style={styles.summaryLabel}>{item.label}</Text>
              <Text style={styles.summaryCount}>({item.data.count})</Text>
            </View>
          ))
        ) : (
          <View style={styles.summaryEmptyCard}>
            <Text style={styles.summaryEmptyText}>No transactions</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );

  // Render active filters display
  const renderActiveFilters = () => {
    const hasFilters = filters.siteId || filters.tankId;

    return (
      <View style={styles.activeFiltersContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {/* Date Range */}
          <View style={[styles.filterChip, styles.dateChip]}>
            <Icon name="calendar" size={12} color="#059669" />
            <Text style={styles.filterChipText}>
              {formatDate(filters.startDate)} - {formatDate(filters.endDate)}
            </Text>
          </View>

          {/* Site Filter */}
          {filters.siteId && (
            <View style={[styles.filterChip, styles.siteChip]}>
              <Icon name="map-marker-alt" size={12} color="#3B82F6" />
              <Text style={styles.filterChipText}>
                {sites?.find((s) => s.id === filters.siteId)?.name || "Site"}
              </Text>
            </View>
          )}

          {/* Tank Filter */}
          {filters.tankId && (
            <View style={[styles.filterChip, styles.tankChip]}>
              <Icon name="database" size={12} color="#8B5CF6" />
              <Text style={styles.filterChipText}>
                {tanks?.find((t) => t.id === filters.tankId)?.name || "Tank"}
              </Text>
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  // Render filter modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      transparent={true}
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              <Icon name="filter" size={18} color="#1F2937" /> Filter
              Transactions
            </Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Icon name="times" size={20} color="#6B7280" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.filterContent}>
            {/* Date Range Section */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Date Range</Text>

              {/* Start Date */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => openDatePicker("start")}
              >
                <Icon name="calendar" size={16} color="#3B82F6" />
                <Text style={styles.dateButtonText}>
                  Start:{" "}
                  {tempFilters.startDate
                    ? typeof tempFilters.startDate === "string"
                      ? tempFilters.startDate
                      : tempFilters.startDate.toLocaleDateString()
                    : "Select Date"}
                </Text>
              </TouchableOpacity>

              {/* End Date */}
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => openDatePicker("end")}
              >
                <Icon name="calendar" size={16} color="#3B82F6" />
                <Text style={styles.dateButtonText}>
                  End:{" "}
                  {tempFilters.endDate
                    ? typeof tempFilters.endDate === "string"
                      ? tempFilters.endDate
                      : tempFilters.endDate.toLocaleDateString()
                    : "Select Date"}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Site Selection */}
            <View style={styles.filterSection}>
              <Text style={styles.filterSectionTitle}>Site</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={tempFilters.siteId}
                  onValueChange={(value) =>
                    setTempFilters((prev) => ({
                      ...prev,
                      siteId: value,
                      tankId: null,
                    }))
                  }
                  style={styles.picker}
                >
                  <Picker.Item label="All Sites" value={null} />
                  {sites?.map((site) => (
                    <Picker.Item
                      key={site.id}
                      label={site.name}
                      value={site.id}
                    />
                  ))}
                </Picker>
              </View>
            </View>

            {/* Tank Selection (only if site selected) */}
            {tempFilters.siteId && (
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>Tank</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={tempFilters.tankId}
                    onValueChange={(value) =>
                      setTempFilters((prev) => ({ ...prev, tankId: value }))
                    }
                    style={styles.picker}
                    enabled={!tanksLoading}
                  >
                    <Picker.Item label="All Tanks" value={null} />
                    {tanks?.map((tank) => (
                      <Picker.Item
                        key={tank.id}
                        label={`${tank.name} (${tank.fuelTypeName || "Unknown"
                          })`}
                        value={tank.id}
                      />
                    ))}
                  </Picker>
                </View>
                {tanksLoading && (
                  <ActivityIndicator
                    size="small"
                    color="#3B82F6"
                    style={{ marginTop: 8 }}
                  />
                )}
              </View>
            )}
          </ScrollView>

          {/* Modal Footer */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[styles.modalButton, styles.clearButton]}
              onPress={handleClearFilters}
            >
              <Icon name="times" size={14} color="#6B7280" />
              <Text style={styles.clearButtonText}>Clear</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.modalButton, styles.applyButton]}
              onPress={handleApplyFilters}
            >
              <Icon name="check" size={14} color="#FFFFFF" />
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Custom Date Picker */}
      <CustomDateTimePicker
        visible={showDatePicker}
        value={
          datePickerMode === "start"
            ? tempFilters.startDate instanceof Date
              ? tempFilters.startDate
              : new Date()
            : tempFilters.endDate instanceof Date
              ? tempFilters.endDate
              : new Date()
        }
        onConfirm={handleDateChange}
        onCancel={() => setShowDatePicker(false)}
        themeColor="#3B82F6"
        showTimePicker={false}
        maximumDate={new Date()}
      />
    </Modal>
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="inbox" size={48} color="#D1D5DB" />
      <Text style={styles.emptyStateTitle}>No Transactions Found</Text>
      <Text style={styles.emptyStateText}>
        Try adjusting your filters or select a different date range
      </Text>
      <TouchableOpacity
        style={styles.emptyStateButton}
        onPress={() => setShowFilters(true)}
      >
        <Icon name="filter" size={14} color="#3B82F6" />
        <Text style={styles.emptyStateButtonText}>Adjust Filters</Text>
      </TouchableOpacity>
    </View>
  );

  // Render error state
  const renderErrorState = () => (
    <View style={styles.errorState}>
      <Icon name="exclamation-triangle" size={48} color="#EF4444" />
      <Text style={styles.errorStateTitle}>Error Loading Data</Text>
      <Text style={styles.errorStateText}>{error}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
        <Icon name="redo" size={14} color="#FFFFFF" />
        <Text style={styles.retryButtonText}>Retry</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={18} color="#1F2937" />
          </TouchableOpacity>

          <View style={styles.headerTitleContainer}>
            <Text style={styles.headerTitle}>Transaction Hub</Text>
            <Text style={styles.headerSubtitle}>Tank Volume History</Text>
          </View>

          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerButton}
              onPress={handleRefresh}
            >
              <Icon name="sync-alt" size={16} color="#3B82F6" />
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.headerButton,
                showFilters && styles.headerButtonActive,
              ]}
              onPress={() => setShowFilters(true)}
            >
              <Icon
                name="filter"
                size={16}
                color={showFilters ? "#FFFFFF" : "#3B82F6"}
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Active Filters */}
        {renderActiveFilters()}

        {/* Summary Cards */}
        {renderSummary()}
      </View>

      {/* Content */}
      {isLoading && !isRefreshing ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#3B82F6" />
          <Text style={styles.loadingText}>Loading transactions...</Text>
        </View>
      ) : error ? (
        renderErrorState()
      ) : (
        <FlatList
          data={transactions}
          renderItem={renderTransactionItem}
          keyExtractor={(item, index) =>
            `${item.id || index}-${item.timestamp}`
          }
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={["#3B82F6"]}
            />
          }
          ListEmptyComponent={renderEmptyState}
          showsVerticalScrollIndicator={false}
        />
      )}

      {/* Filter Modal */}
      {renderFilterModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F3F4F6",
  },

  // Header Styles
  header: {
    backgroundColor: "#FFFFFF",
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  backButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#6B7280",
    marginTop: 2,
  },
  headerActions: {
    flexDirection: "row",
    gap: 8,
  },
  headerButton: {
    width: 36,
    height: 36,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#EBF5FF",
    borderRadius: 8,
  },
  headerButtonActive: {
    backgroundColor: "#3B82F6",
  },

  // Active Filters
  activeFiltersContainer: {
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  filterChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  dateChip: {
    backgroundColor: "#D1FAE5",
  },
  siteChip: {
    backgroundColor: "#DBEAFE",
  },
  tankChip: {
    backgroundColor: "#EDE9FE",
  },
  filterChipText: {
    fontSize: 12,
    color: "#374151",
    marginLeft: 6,
    fontWeight: "500",
  },

  // Summary Section
  summarySection: {
    paddingTop: 8,
  },
  summaryHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  summaryHeaderText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 6,
  },
  summaryScrollView: {
    flexGrow: 0,
  },
  summaryScrollContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  summaryCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    minWidth: 85,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  summaryIconBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1F2937",
    marginTop: 6,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#6B7280",
    marginTop: 2,
    fontWeight: "500",
  },
  summaryCount: {
    fontSize: 9,
    color: "#9CA3AF",
    marginTop: 1,
  },
  summaryEmptyCard: {
    backgroundColor: "#F9FAFB",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    flex: 1,
  },
  summaryEmptyText: {
    fontSize: 12,
    color: "#9CA3AF",
  },

  // Transaction Card
  transactionCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  reasonBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  reasonText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  timestamp: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  cardContent: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  infoSection: {
    flex: 1,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  infoIcon: {
    width: 16,
  },
  infoText: {
    fontSize: 13,
    color: "#374151",
    flex: 1,
  },
  volumeSection: {
    alignItems: "flex-end",
    justifyContent: "center",
  },
  volumeChange: {
    fontSize: 18,
    fontWeight: "700",
  },
  newVolume: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: "#F3F4F6",
  },
  recordedBy: {
    fontSize: 11,
    color: "#9CA3AF",
    marginLeft: 6,
  },

  // List
  listContent: {
    paddingTop: 16,
    paddingBottom: 24,
  },

  // Loading
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
    paddingTop: 64,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  emptyStateButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#EBF5FF",
    borderRadius: 8,
  },
  emptyStateButtonText: {
    fontSize: 14,
    color: "#3B82F6",
    fontWeight: "600",
    marginLeft: 8,
  },

  // Error State
  errorState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 32,
  },
  errorStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#EF4444",
    marginTop: 16,
  },
  errorStateText: {
    fontSize: 14,
    color: "#6B7280",
    textAlign: "center",
    marginTop: 8,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#EF4444",
    borderRadius: 8,
  },
  retryButtonText: {
    fontSize: 14,
    color: "#FFFFFF",
    fontWeight: "600",
    marginLeft: 8,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  filterModal: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
  },
  filterContent: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  dateButtonText: {
    fontSize: 14,
    color: "#374151",
    marginLeft: 12,
  },
  pickerContainer: {
    backgroundColor: "#F9FAFB",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  modalFooter: {
    flexDirection: "row",
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 14,
    borderRadius: 10,
  },
  clearButton: {
    backgroundColor: "#F3F4F6",
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
    marginLeft: 8,
  },
  applyButton: {
    backgroundColor: "#3B82F6",
    flex: 2,
  },
  applyButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
});

export default TankTransactionHubScreen;
