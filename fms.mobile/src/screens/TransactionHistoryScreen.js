import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  TextInput,
  Linking,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

import {
  fetchTransactionHistory,
  fetchTransactionSummary,
  updateFilters,
  clearFilters,
  setPage,
  clearErrors,
} from "../redux/slices/transactionSlice";

const { width } = Dimensions.get("window");

// Helper to open location in maps using real API coordinates
const openLocationInMapsHelper = (latitude, longitude, siteName) => {
  if (!latitude || !longitude) {
    Alert.alert("Location Unavailable", "Site coordinates are not available.");
    return;
  }
  // Note: Google Maps expects latitude,longitude order
  const url = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
  Linking.openURL(url).catch(() => {
    Alert.alert("Error", "Could not open maps application");
  });
};

// Helper to get display name for the person who fueled
const getFueledByDisplay = (item) => {
  // Check various possible field names from API
  return (
    item.fueledByUserName ||
    item.fueledByName ||
    item.userName ||
    item.operatorName ||
    item.createdByName ||
    item.createdBy ||
    (item.fueledBy && typeof item.fueledBy === "string" ? item.fueledBy : null) ||
    "N/A"
  );
};

const TransactionHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    transactions,
    totalCount,
    currentPage,
    pageSize,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    filters,
    summary,
  } = useSelector((state) => state.transaction);

  const { user } = useSelector((state) => state.auth);
  const { ptsDeviceList } = useSelector((state) => state.device);

  // Local state for UI
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState("start");
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchQuery, setSearchQuery] = useState("");
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);

  // Available pumps for filtering
  const [availablePumps, setAvailablePumps] = useState([]);

  // Client-side filter state (filters loaded data, no backend call)
  const [clientFilters, setClientFilters] = useState({
    vehicleId: null,
    ptsId: null,
    tankId: null,
    siteId: null,
    userId: null,
    processedOnly: null,
  });

  // Build filter options from loaded transaction data
  const filterOptions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return {
        vehicles: [],
        ptsDevices: [],
        tanks: [],
        sites: [],
        users: [],
      };
    }

    // Extract unique values from transaction data
    const vehicleMap = new Map();
    const ptsMap = new Map();
    const tankMap = new Map();
    const siteMap = new Map();
    const userMap = new Map();

    transactions.forEach((t) => {
      if (t.vehicleId && t.vehicleName) {
        vehicleMap.set(t.vehicleId, {
          id: t.vehicleId,
          name: t.vehicleName,
          plate: t.vehicleNumberPlate,
        });
      }
      if (t.ptsId) {
        ptsMap.set(t.ptsId, { id: t.ptsId, name: t.ptsName || t.ptsId });
      }
      if (t.tankId) {
        tankMap.set(t.tankId, {
          id: t.tankId,
          name: t.tankName || `Tank ${t.tankId}`,
        });
      }
      if (t.siteId) {
        siteMap.set(t.siteId, {
          id: t.siteId,
          name: t.siteName || `Site ${t.siteId}`,
        });
      }
      if (t.fueledBy && t.fueledByUserName) {
        userMap.set(t.fueledBy, { id: t.fueledBy, name: t.fueledByUserName });
      }
    });

    return {
      vehicles: [...vehicleMap.values()],
      ptsDevices: [...ptsMap.values()],
      tanks: [...tankMap.values()],
      sites: [...siteMap.values()],
      users: [...userMap.values()],
    };
  }, [transactions]);

  // Apply client-side filters to loaded transactions
  const filteredTransactions = useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return [];
    }

    let filtered = [...transactions];

    // Filter by vehicle
    if (clientFilters.vehicleId) {
      filtered = filtered.filter(
        (t) => t.vehicleId === clientFilters.vehicleId
      );
    }

    // Filter by PTS device
    if (clientFilters.ptsId) {
      filtered = filtered.filter((t) => t.ptsId === clientFilters.ptsId);
    }

    // Filter by tank
    if (clientFilters.tankId) {
      filtered = filtered.filter((t) => t.tankId === clientFilters.tankId);
    }

    // Filter by site
    if (clientFilters.siteId) {
      filtered = filtered.filter((t) => t.siteId === clientFilters.siteId);
    }

    // Filter by user (fueledBy)
    if (clientFilters.userId) {
      filtered = filtered.filter((t) => t.fueledBy === clientFilters.userId);
    }

    // Filter by processing status
    if (clientFilters.processedOnly !== null) {
      filtered = filtered.filter(
        (t) => t.hasBeenProcessed === clientFilters.processedOnly
      );
    }

    return filtered;
  }, [transactions, clientFilters]);

  // Check if any client filter is active
  const hasActiveClientFilters = useMemo(() => {
    return (
      clientFilters.vehicleId !== null ||
      clientFilters.ptsId !== null ||
      clientFilters.tankId !== null ||
      clientFilters.siteId !== null ||
      clientFilters.userId !== null ||
      clientFilters.processedOnly !== null
    );
  }, [clientFilters]);

  // Reset client filters
  const handleClearClientFilters = () => {
    setClientFilters({
      vehicleId: null,
      ptsId: null,
      tankId: null,
      siteId: null,
      userId: null,
      processedOnly: null,
    });
  };

  useEffect(() => {
    // Initial load
    loadTransactions();
    loadSummary();
  }, []);

  useEffect(() => {
    // Extract available pumps from devices
    const pumps = [];
    ptsDeviceList.forEach((device) => {
      if (device.pumps) {
        const deviceDisplayName = device.ptsName || device.name || device.ptsid;
        device.pumps.forEach((pump) => {
          pumps.push({
            id: pump.id,
            name: `Pump ${pump.number} - ${deviceDisplayName}`,
            deviceId: device.id,
            pumpNumber: pump.number,
          });
        });
      }
    });
    setAvailablePumps(pumps);
  }, [ptsDeviceList]);

  const loadTransactions = useCallback(
    (page = 1, refresh = false) => {
      const searchFilters = {
        ...filters,
        page,
        pageSize,
      };

      if (searchQuery.trim()) {
        searchFilters.search = searchQuery.trim();
      }

      dispatch(fetchTransactionHistory(searchFilters));
    },
    [dispatch, filters, pageSize, searchQuery]
  );

  const loadSummary = useCallback(() => {
    const summaryFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      pumpId: filters.pumpId,
      deviceId: filters.deviceId,
    };
    dispatch(fetchTransactionSummary(summaryFilters));
  }, [dispatch, filters]);

  const handleRefresh = () => {
    dispatch(clearErrors());
    loadTransactions(1, true);
    loadSummary();
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadTransactions(currentPage + 1);
    }
  };

  const handleApplyFilters = () => {
    dispatch(updateFilters(tempFilters));
    setShowFilters(false);
    setTimeout(() => {
      loadTransactions(1, true);
      loadSummary();
    }, 100);
  };

  const handleClearFilters = () => {
    setTempFilters({
      startDate: null,
      endDate: null,
      pumpId: null,
      deviceId: null,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    dispatch(clearFilters());
    setTimeout(() => {
      loadTransactions(1, true);
      loadSummary();
    }, 100);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempFilters((prev) => ({
        ...prev,
        [datePickerMode === "start" ? "startDate" : "endDate"]: selectedDate
          .toISOString()
          .split("T")[0],
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatVolume = (volume) => {
    return `${(volume || 0).toFixed(2)} L`;
  };

  const formatDistance = (distance) => {
    if (!distance) return "N/A";
    return `${distance.toLocaleString()} km`;
  };

  const openLocationInMaps = (item) => {
    // Use real coordinates from API - latitude first, then longitude
    const lat = item.siteLatitude || item.latitude;
    const lng = item.siteLongitude || item.longitude;
    openLocationInMapsHelper(lat, lng, item.siteName);
  };

  const handleTransactionPress = (item) => {
    // Use real data from API only - no mock fallbacks
    const auditData = {
      ...item,
      // Site info - from API
      siteName: item.siteName || "Unknown Site",
      siteAddress: item.siteAddress || item.siteLocation || "",
      siteId: item.siteId,
      siteLatitude: item.siteLatitude || item.latitude,
      siteLongitude: item.siteLongitude || item.longitude,

      // User who fueled - use helper function
      fueledBy: getFueledByDisplay(item),

      // Odometer data - from API (FuelRefill)
      currentOdometer: item.odometer,
      previousOdometer: item.previousOdometer,

      // Consumption - from API or calculate
      consumptionSinceLastRefuel: item.consumptionSinceLastRefuel,

      // Fuel levels - from API (GPS sensor data if available)
      fuelLevelBefore: item.fuelLevelBefore,
      fuelLevelAfter: item.fuelLevelAfter,

      // Driver info
      driverName: item.driverName,

      // Employee info
      employeeName: item.employeeName || item.assignedDriverName || item.driverName,
      employeeId: item.employeeId || item.assignedDriverId,
    };

    setSelectedTransaction(auditData);
    setShowAuditModal(true);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      case "authorized":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "check-circle";
      case "cancelled":
        return "times-circle";
      case "pending":
        return "clock";
      case "authorized":
        return "play-circle";
      default:
        return "question-circle";
    }
  };

  const renderTransactionItem = ({ item, index }) => {
    // Use real API data directly - no mock locations
    const consumption = item.consumptionSinceLastRefuel;

    return (
      <TouchableOpacity
        style={styles.transactionCard}
        onPress={() => handleTransactionPress(item)}
      >
        <View style={styles.transactionHeader}>
          <View style={styles.transactionInfo}>
            <View style={{ flexDirection: "row", alignItems: "center" }}>
              <Text style={styles.transactionId}>
                #{item.transaction || item.packetId}
              </Text>
              {item.isTransferMode && (
                <View
                  style={{
                    backgroundColor: "#ede9fe",
                    paddingHorizontal: 6,
                    paddingVertical: 2,
                    borderRadius: 4,
                    marginLeft: 8,
                  }}
                >
                  <Text style={{ fontSize: 10, color: "#7c3aed", fontWeight: "600" }}>
                    TRANSFER
                  </Text>
                </View>
              )}
            </View>
            <Text style={styles.transactionDate}>
              {formatDate(item.dateTime)}
            </Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              {
                backgroundColor: item.hasBeenProcessed ? "#10b981" : "#f59e0b",
              },
            ]}
          >
            <Icon
              name={item.hasBeenProcessed ? "check" : "clock"}
              size={12}
              color="white"
              style={styles.statusIcon}
            />
            <Text style={styles.statusText}>
              {item.hasBeenProcessed ? "Processed" : "Pending"}
            </Text>
          </View>
        </View>

        <View style={styles.transactionDetails}>
          {/* Site/Location - Clickable */}
          <TouchableOpacity
            style={styles.detailRow}
            onPress={() => openLocationInMaps(item.siteId, item.siteName)}
          >
            <Icon name="map-marker-alt" size={14} color="#2563eb" />
            <Text style={styles.locationText}>
              {item.siteName || siteLocation.name}
            </Text>
            <Icon
              name="external-link-alt"
              size={10}
              color="#2563eb"
              style={styles.linkIcon}
            />
          </TouchableOpacity>

          {/* User who fueled */}
          <View style={styles.detailRow}>
            <Icon name="user" size={14} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.fueledByUserName ||
                item.fueledBy ||
                item.createdBy ||
                item.userName ||
                "N/A"}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="gas-pump" size={14} color="#6b7280" />
            <Text style={styles.detailText}>
              Pump {item.pump} - Nozzle {item.nozzle}{" "}
              {item.fuelGradeName ? `(${item.fuelGradeName})` : ""}
            </Text>
          </View>

          {(item.vehicleName || item.vehicleNumberPlate) && (
            <View style={styles.detailRow}>
              <Icon name="car" size={14} color="#6b7280" />
              <Text style={styles.detailText}>
                {item.vehicleName || item.vehicleNumberPlate}
              </Text>
            </View>
          )}

          {item.driverName && (
            <View style={styles.detailRow}>
              <Icon name="id-badge" size={14} color="#10b981" />
              <Text style={[styles.detailText, { color: "#10b981" }]}>
                Driver: {item.driverName}
              </Text>
            </View>
          )}

          {item.tankName && (
            <View style={styles.detailRow}>
              <Icon name="database" size={14} color="#6b7280" />
              <Text style={styles.detailText}>
                {item.isTransferMode ? "From: " : "Tank: "}{item.tankName}
              </Text>
            </View>
          )}

          {item.isTransferMode && item.destinationTankName && (
            <View style={styles.detailRow}>
              <Icon name="arrow-right" size={14} color="#7c3aed" />
              <Text style={[styles.detailText, { color: "#7c3aed", fontWeight: "600" }]}>
                To: {item.destinationTankName}
              </Text>
            </View>
          )}

          {item.tag && (
            <View style={styles.detailRow}>
              <Icon name="tag" size={14} color="#6b7280" />
              <Text style={styles.detailText}>Tag: {item.tag}</Text>
            </View>
          )}
        </View>

        <View style={styles.transactionAmounts}>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Volume</Text>
            <Text style={styles.amountValue}>{formatVolume(item.volume)}</Text>
          </View>
          <View style={styles.amountItem}>
            <Text style={styles.amountLabel}>Consumption</Text>
            <Text style={styles.amountValueConsumption}>
              {formatDistance(consumption)}
            </Text>
          </View>
        </View>

        {/* Tap to view more indicator */}
        <View style={styles.viewMoreIndicator}>
          <Text style={styles.viewMoreText}>Tap to view audit details</Text>
          <Icon name="chevron-right" size={12} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  const renderSummaryCard = () => {
    // Calculate filtered summary (inline, not useMemo since we can't use hooks inside render functions)
    const filtered = filteredTransactions || [];
    const filteredCount = filtered.length;
    const filteredVolume = filtered.reduce(
      (sum, t) => sum + (t.volume || 0),
      0
    );

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <Text style={styles.summaryTitle}>Summary</Text>
          {hasActiveClientFilters && (
            <View style={styles.filteredBadge}>
              <Icon name="filter" size={10} color="#2563eb" />
              <Text style={styles.filteredBadgeText}>Filtered</Text>
            </View>
          )}
        </View>
        <View style={styles.summaryGrid}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              {hasActiveClientFilters
                ? "Filtered Transactions"
                : "Total Transactions"}
            </Text>
            <Text style={styles.summaryValue}>
              {filteredCount}
              {hasActiveClientFilters && (
                <Text style={styles.summarySubValue}>
                  {" "}
                  / {transactions.length}
                </Text>
              )}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              {hasActiveClientFilters ? "Filtered Volume" : "Total Volume"}
            </Text>
            <Text style={styles.summaryValue}>
              {formatVolume(filteredVolume)}
            </Text>
          </View>
        </View>
      </View>
    );
  };

  const renderAuditModal = () => (
    <Modal
      visible={showAuditModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowAuditModal(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAuditModal(false)}>
            <Icon name="times" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Fuel Audit Details</Text>
          <View style={{ width: 24 }} />
        </View>

        {selectedTransaction && (
          <ScrollView style={styles.auditContent}>
            {/* Transaction Header */}
            <View style={styles.auditSection}>
              <Text style={styles.auditSectionTitle}>Transaction Info</Text>
              <View style={styles.auditCard}>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Transaction #</Text>
                  <Text style={styles.auditValue}>
                    {selectedTransaction.transaction ||
                      selectedTransaction.packetId}
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Date & Time</Text>
                  <Text style={styles.auditValue}>
                    {formatDate(selectedTransaction.dateTime)}
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Status</Text>
                  <View
                    style={[
                      styles.auditStatusBadge,
                      {
                        backgroundColor: selectedTransaction.hasBeenProcessed
                          ? "#10b981"
                          : "#f59e0b",
                      },
                    ]}
                  >
                    <Text style={styles.auditStatusText}>
                      {selectedTransaction.hasBeenProcessed
                        ? "Processed"
                        : "Pending"}
                    </Text>
                  </View>
                </View>
              </View>
            </View>

            {/* Location Section */}
            <View style={styles.auditSection}>
              <Text style={styles.auditSectionTitle}>Location</Text>
              <TouchableOpacity
                style={styles.auditLocationCard}
                onPress={() => openLocationInMaps(selectedTransaction)}
                disabled={!selectedTransaction.siteLatitude || !selectedTransaction.siteLongitude}
              >
                <View style={styles.locationIconContainer}>
                  <Icon name="map-marker-alt" size={24} color="#2563eb" />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationName}>
                    {selectedTransaction.siteName}
                  </Text>
                  {selectedTransaction.siteAddress ? (
                    <Text style={styles.locationAddress}>
                      {selectedTransaction.siteAddress}
                    </Text>
                  ) : selectedTransaction.siteLatitude && selectedTransaction.siteLongitude ? (
                    <Text style={styles.locationAddress}>
                      {selectedTransaction.siteLatitude.toFixed(4)}, {selectedTransaction.siteLongitude.toFixed(4)}
                    </Text>
                  ) : null}
                </View>
                {(selectedTransaction.siteLatitude && selectedTransaction.siteLongitude) && (
                  <Icon name="external-link-alt" size={16} color="#2563eb" />
                )}
              </TouchableOpacity>
            </View>

            {/* Fuel Details */}
            <View style={styles.auditSection}>
              <Text style={styles.auditSectionTitle}>Fuel Details</Text>
              <View style={styles.auditCard}>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Fueled By</Text>
                  <Text style={styles.auditValue}>
                    {selectedTransaction.fueledBy}
                  </Text>
                </View>
                {selectedTransaction.driverName && (
                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Driver</Text>
                    <Text style={[styles.auditValue, { color: "#10b981", fontWeight: "500" }]}>
                      {selectedTransaction.driverName}
                    </Text>
                  </View>
                )}
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Volume Dispensed</Text>
                  <Text style={styles.auditValueHighlight}>
                    {formatVolume(selectedTransaction.volume)}
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Transaction Type</Text>
                  <Text style={[styles.auditValue, { color: selectedTransaction.isTransferMode ? "#7c3aed" : "#2563eb" }]}>
                    {selectedTransaction.isTransferMode ? "Tank Transfer" : "Vehicle Fueling"}
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>
                    {selectedTransaction.isTransferMode ? "Source Tank" : "Tank"}
                  </Text>
                  <Text style={styles.auditValue}>
                    {selectedTransaction.tankName || "N/A"}
                  </Text>
                </View>
                {selectedTransaction.isTransferMode && selectedTransaction.destinationTankName && (
                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Destination Tank</Text>
                    <Text style={[styles.auditValue, { color: "#7c3aed", fontWeight: "600" }]}>
                      {selectedTransaction.destinationTankName}
                    </Text>
                  </View>
                )}
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Pump / Nozzle</Text>
                  <Text style={styles.auditValue}>
                    Pump {selectedTransaction.pump} / Nozzle{" "}
                    {selectedTransaction.nozzle}
                  </Text>
                </View>
                {selectedTransaction.fuelGradeName && (
                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Fuel Grade</Text>
                    <Text style={styles.auditValue}>
                      {selectedTransaction.fuelGradeName}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {/* Fuel Levels */}
            <View style={styles.auditSection}>
              <Text style={styles.auditSectionTitle}>Fuel Levels</Text>
              <View style={styles.fuelLevelContainer}>
                <View style={styles.fuelLevelItem}>
                  <Icon name="arrow-down" size={20} color="#ef4444" />
                  <Text style={styles.fuelLevelLabel}>Before Fueling</Text>
                  <Text style={styles.fuelLevelValue}>
                    {selectedTransaction.fuelLevelBefore?.toFixed(1) || "N/A"} L
                  </Text>
                </View>
                <View style={styles.fuelLevelArrow}>
                  <Icon name="arrow-right" size={24} color="#9ca3af" />
                </View>
                <View style={styles.fuelLevelItem}>
                  <Icon name="arrow-up" size={20} color="#10b981" />
                  <Text style={styles.fuelLevelLabel}>After Fueling</Text>
                  <Text style={styles.fuelLevelValueGreen}>
                    {selectedTransaction.fuelLevelAfter?.toFixed(1) || "N/A"} L
                  </Text>
                </View>
              </View>
            </View>

            {/* Odometer & Consumption */}
            <View style={styles.auditSection}>
              <Text style={styles.auditSectionTitle}>
                Odometer & Consumption
              </Text>
              <View style={styles.auditCard}>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Current Odometer</Text>
                  <Text style={styles.auditValue}>
                    {selectedTransaction.currentOdometer?.toLocaleString() ||
                      "N/A"}{" "}
                    km
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>Previous Odometer</Text>
                  <Text style={styles.auditValue}>
                    {selectedTransaction.previousOdometer?.toLocaleString() ||
                      "N/A"}{" "}
                    km
                  </Text>
                </View>
                <View style={[styles.auditRow, styles.auditRowHighlight]}>
                  <Text style={styles.auditLabelBold}>
                    Distance Since Last Refuel
                  </Text>
                  <Text style={styles.auditValueHighlight}>
                    {formatDistance(
                      selectedTransaction.consumptionSinceLastRefuel
                    )}
                  </Text>
                </View>
              </View>
            </View>

            {/* Vehicle Info */}
            {(selectedTransaction.vehicleName ||
              selectedTransaction.vehicleNumberPlate) && (
              <View style={styles.auditSection}>
                <Text style={styles.auditSectionTitle}>
                  Vehicle Information
                </Text>
                <View style={styles.auditCard}>
                  <View style={styles.auditRow}>
                    <Text style={styles.auditLabel}>Vehicle</Text>
                    <Text style={styles.auditValue}>
                      {selectedTransaction.vehicleName ||
                        selectedTransaction.vehicleNumberPlate}
                    </Text>
                  </View>
                  {selectedTransaction.vehicleNumberPlate && selectedTransaction.vehicleName && (
                    <View style={styles.auditRow}>
                      <Text style={styles.auditLabel}>Plate Number</Text>
                      <Text style={styles.auditValue}>
                        {selectedTransaction.vehicleNumberPlate}
                      </Text>
                    </View>
                  )}
                  {selectedTransaction.employeeName && (
                    <View style={styles.auditRow}>
                      <Text style={styles.auditLabel}>Assigned Employee</Text>
                      <Text style={[styles.auditValue, { color: "#059669", fontWeight: "600" }]}>
                        {selectedTransaction.employeeName}
                      </Text>
                    </View>
                  )}
                  {selectedTransaction.tag && (
                    <View style={styles.auditRow}>
                      <Text style={styles.auditLabel}>Tag</Text>
                      <Text style={styles.auditValue}>
                        {selectedTransaction.tag}
                      </Text>
                    </View>
                  )}
                </View>
              </View>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    </Modal>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Icon name="times" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Transactions</Text>
          <TouchableOpacity
            onPress={() => {
              handleClearFilters();
              handleClearClientFilters();
            }}
          >
            <Text style={styles.clearButton}>Clear All</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Data Filters Section Header */}
          <Text style={styles.filterSectionHeader}>
            <Icon name="filter" size={14} color="#6b7280" /> Filter Loaded Data
            {hasActiveClientFilters && (
              <Text style={styles.filterActiveIndicator}> (Active)</Text>
            )}
          </Text>
          <Text style={styles.filterHint}>
            Showing {filteredTransactions.length} of {transactions.length}{" "}
            records
          </Text>

          {/* Vehicle Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              <Icon name="truck" size={12} color="#6b7280" /> Vehicle
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={clientFilters.vehicleId}
                onValueChange={(value) =>
                  setClientFilters((prev) => ({ ...prev, vehicleId: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Vehicles" value={null} />
                {filterOptions.vehicles.map((v) => (
                  <Picker.Item
                    key={v.id}
                    label={v.name + (v.plate ? ` (${v.plate})` : "")}
                    value={v.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* PTS Device Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              <Icon name="gas-pump" size={12} color="#6b7280" /> PTS Device
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={clientFilters.ptsId}
                onValueChange={(value) =>
                  setClientFilters((prev) => ({ ...prev, ptsId: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All PTS Devices" value={null} />
                {filterOptions.ptsDevices.map((p) => (
                  <Picker.Item key={p.id} label={p.name} value={p.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Tank Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              <Icon name="database" size={12} color="#6b7280" /> Tank
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={clientFilters.tankId}
                onValueChange={(value) =>
                  setClientFilters((prev) => ({ ...prev, tankId: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Tanks" value={null} />
                {filterOptions.tanks.map((t) => (
                  <Picker.Item key={t.id} label={t.name} value={t.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Site Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              <Icon name="map-marker-alt" size={12} color="#6b7280" /> Site
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={clientFilters.siteId}
                onValueChange={(value) =>
                  setClientFilters((prev) => ({ ...prev, siteId: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Sites" value={null} />
                {filterOptions.sites.map((s) => (
                  <Picker.Item key={s.id} label={s.name} value={s.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* User Filter (Fueled By) */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              <Icon name="user" size={12} color="#6b7280" /> Fueled By
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={clientFilters.userId}
                onValueChange={(value) =>
                  setClientFilters((prev) => ({ ...prev, userId: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Users" value={null} />
                {filterOptions.users.map((u) => (
                  <Picker.Item key={u.id} label={u.name} value={u.id} />
                ))}
              </Picker>
            </View>
          </View>

          {/* Processing Status Filter */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>
              <Icon name="check-circle" size={12} color="#6b7280" /> Status
            </Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={clientFilters.processedOnly}
                onValueChange={(value) =>
                  setClientFilters((prev) => ({
                    ...prev,
                    processedOnly: value,
                  }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Transactions" value={null} />
                <Picker.Item label="Processed Only" value={true} />
                <Picker.Item label="Pending Only" value={false} />
              </Picker>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.filterDivider} />

          {/* Backend Filters Section Header */}
          <Text style={styles.filterSectionHeader}>
            <Icon name="server" size={14} color="#6b7280" /> Backend Filters
          </Text>
          <Text style={styles.filterHint}>
            These filters reload data from server
          </Text>

          {/* Date Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode("start");
                  setShowDatePicker(true);
                }}
              >
                <Icon name="calendar" size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {tempFilters.startDate
                    ? formatDate(tempFilters.startDate)
                    : "Start Date"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode("end");
                  setShowDatePicker(true);
                }}
              >
                <Icon name="calendar" size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {tempFilters.endDate
                    ? formatDate(tempFilters.endDate)
                    : "End Date"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pump Selection */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Pump</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.pumpId}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, pumpId: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Pumps" value={null} />
                {availablePumps.map((pump) => (
                  <Picker.Item
                    key={pump.id}
                    label={pump.name}
                    value={pump.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.sortBy}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, sortBy: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="Date Created" value="createdAt" />
                <Picker.Item label="Volume" value="volume" />
                <Picker.Item label="Pump Number" value="pumpNumber" />
              </Picker>
            </View>
          </View>

          {/* Sort Order */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Order</Text>
            <View style={styles.sortOrderContainer}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  tempFilters.sortOrder === "desc" && styles.sortButtonActive,
                ]}
                onPress={() =>
                  setTempFilters((prev) => ({ ...prev, sortOrder: "desc" }))
                }
              >
                <Icon
                  name="sort-amount-down"
                  size={16}
                  color={tempFilters.sortOrder === "desc" ? "white" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    tempFilters.sortOrder === "desc" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  tempFilters.sortOrder === "asc" && styles.sortButtonActive,
                ]}
                onPress={() =>
                  setTempFilters((prev) => ({ ...prev, sortOrder: "asc" }))
                }
              >
                <Icon
                  name="sort-amount-up"
                  size={16}
                  color={tempFilters.sortOrder === "asc" ? "white" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    tempFilters.sortOrder === "asc" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          <View style={{ height: 100 }} />
        </ScrollView>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={[styles.applyButton, styles.applyButtonSecondary]}
            onPress={() => setShowFilters(false)}
          >
            <Text style={styles.applyButtonTextSecondary}>Close</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>Reload Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header with Search and Filter */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={16}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadTransactions(1, true)}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="filter" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {renderSummaryCard()}

      {/* Transaction List */}
      <FlatList
        data={filteredTransactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item, index) =>
          `${item.packetId || item.transaction}-${index}`
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && currentPage === 1}
            onRefresh={handleRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() =>
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() =>
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyDescription}>
                {Object.values(filters).some((v) => v)
                  ? "No transactions match your current filters."
                  : "No transactions have been recorded yet."}
              </Text>
              {Object.values(filters).some((v) => v) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={handleClearFilters}
                >
                  <Text style={styles.clearFiltersButtonText}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          )
        }
      />

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* Audit Modal */}
      {renderAuditModal()}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
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
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: "#374151",
  },
  filterButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  summaryCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    width: "50%",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  summaryValueMoney: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transactionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  transactionDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  transactionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4b5563",
  },
  transactionAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  amountItem: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  amountValueMoney: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  loadingMore: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: "#6b7280",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
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
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  clearButton: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "500",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "48%",
  },
  dateButtonText: {
    marginLeft: 8,
    color: "#374151",
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  sortOrderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "48%",
  },
  sortButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  sortButtonText: {
    marginLeft: 8,
    color: "#374151",
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: "white",
  },
  modalActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    gap: 12,
  },
  applyButton: {
    flex: 1,
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonSecondary: {
    backgroundColor: "#f3f4f6",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  applyButtonTextSecondary: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  // Filter section styles
  filterSectionHeader: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
    marginTop: 8,
  },
  filterActiveIndicator: {
    color: "#2563eb",
    fontWeight: "700",
  },
  filterHint: {
    fontSize: 12,
    color: "#9ca3af",
    marginBottom: 12,
  },
  filterDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 16,
  },
  // Summary header styles
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  filteredBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#dbeafe",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  filteredBadgeText: {
    fontSize: 11,
    color: "#2563eb",
    fontWeight: "600",
  },
  summarySubValue: {
    fontSize: 12,
    fontWeight: "400",
    color: "#9ca3af",
  },
  // Location styles
  locationText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#2563eb",
    fontWeight: "500",
    flex: 1,
  },
  linkIcon: {
    marginLeft: 4,
  },
  // Consumption value style
  amountValueConsumption: {
    fontSize: 16,
    fontWeight: "600",
    color: "#7c3aed",
  },
  // View more indicator
  viewMoreIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  viewMoreText: {
    fontSize: 12,
    color: "#9ca3af",
    marginRight: 4,
  },
  // Audit Modal styles
  auditContent: {
    flex: 1,
    padding: 16,
  },
  auditSection: {
    marginBottom: 20,
  },
  auditSectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6b7280",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  auditCard: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  auditRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  auditRowHighlight: {
    backgroundColor: "#faf5ff",
    marginHorizontal: -16,
    paddingHorizontal: 16,
    marginBottom: -16,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    borderBottomWidth: 0,
  },
  auditLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  auditLabelBold: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "600",
  },
  auditValue: {
    fontSize: 14,
    color: "#1f2937",
    fontWeight: "500",
  },
  auditValueHighlight: {
    fontSize: 16,
    color: "#7c3aed",
    fontWeight: "700",
  },
  auditStatusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  auditStatusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  // Location card in audit
  auditLocationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  locationIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "white",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  locationDetails: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 2,
  },
  locationAddress: {
    fontSize: 13,
    color: "#6b7280",
  },
  // Fuel level display
  fuelLevelContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  fuelLevelItem: {
    alignItems: "center",
    flex: 1,
  },
  fuelLevelArrow: {
    paddingHorizontal: 8,
  },
  fuelLevelLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 4,
    marginBottom: 4,
  },
  fuelLevelValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#ef4444",
  },
  fuelLevelValueGreen: {
    fontSize: 18,
    fontWeight: "700",
    color: "#10b981",
  },
});

export default TransactionHistoryScreen;
