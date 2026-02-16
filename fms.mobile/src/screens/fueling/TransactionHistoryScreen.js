/**
 * File: TransactionHistoryScreen.js
 * Purpose: Displays pump transaction history with filters, summaries, and audit details
 * Dependencies: react, react-native, react-redux, @react-native-community/datetimepicker, @react-native-picker/picker
 * Last Modified: 2026-01-19
 *
 * Key Functions/Components:
 * - TransactionHistoryScreen: Main screen component for transaction history
 * - formatDate(): Formats UTC timestamps to local device time for display
 * - openLocationInMapsHelper(): Opens site coordinates in a maps app
 * - getFueledByDisplay(): Resolves a display name for the fueling user
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
  Alert,
  Modal,
  Dimensions,
  TextInput,
  Linking,
  ScrollView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import { Picker } from "@react-native-picker/picker";

import {
  fetchTransactionHistory,
  fetchTransactionSummary,
  updateFilters,
  clearFilters,
  setPage,
  clearErrors,
} from "../../redux/slices/transactionSlice";

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

const normalizeCoordinate = (value) => {
  if (value === null || value === undefined) return null;
  const parsed = typeof value === "string" ? parseFloat(value) : value;
  return Number.isFinite(parsed) ? parsed : null;
};

const getFuelingLocation = (item) => {
  if (!item) {
    return { latitude: null, longitude: null, label: "Location", source: null };
  }

  const fuelingLatitude = normalizeCoordinate(item.fuelingLatitude);
  const fuelingLongitude = normalizeCoordinate(item.fuelingLongitude);

  if (fuelingLatitude !== null && fuelingLongitude !== null) {
    return {
      latitude: fuelingLatitude,
      longitude: fuelingLongitude,
      label: "Fueling Location",
      source: item.fuelingLocationSource || "Mobile App",
    };
  }

  const siteLatitude = normalizeCoordinate(item.siteLatitude || item.latitude);
  const siteLongitude = normalizeCoordinate(item.siteLongitude || item.longitude);

  if (siteLatitude !== null && siteLongitude !== null) {
    return {
      latitude: siteLatitude,
      longitude: siteLongitude,
      label: "Site Location",
      source: "Site",
    };
  }

  return { latitude: null, longitude: null, label: "Location", source: null };
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

const normalizeNumber = (value) => {
  if (value === null || value === undefined || value === "") return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const getConsumptionMetric = (item) => {
  const isKmPerLiter = item?.isKmPerLiter !== false;
  const unit = isKmPerLiter ? "km/L" : "L/hr";

  const distanceOrHours =
    normalizeNumber(item?.consumptionSinceLastRefuel) ??
    normalizeNumber(item?.distanceSinceLastRefuel) ??
    normalizeNumber(item?.distance);

  const volumeIssued =
    normalizeNumber(item?.volume) ??
    normalizeNumber(item?.fuelIssued) ??
    normalizeNumber(item?.amount);

  let value = null;

  if (
    distanceOrHours !== null &&
    volumeIssued !== null &&
    distanceOrHours > 0 &&
    volumeIssued > 0
  ) {
    value = isKmPerLiter
      ? distanceOrHours / volumeIssued
      : volumeIssued / distanceOrHours;
  }

  if (value === null) {
    const metricCandidates = isKmPerLiter
      ? [
          item?.consumption,
          item?.avgEfficiency,
          item?.averageConsumption,
          item?.kmPerLiter,
          item?.efficiency,
        ]
      : [
          item?.consumption,
          item?.avgEfficiency,
          item?.averageConsumption,
          item?.literPerHour,
          item?.efficiency,
        ];

    value = metricCandidates
      .map(normalizeNumber)
      .find((candidate) => candidate !== null && candidate > 0);
  }

  return {
    isKmPerLiter,
    unit,
    value,
    detailsLabel: isKmPerLiter ? "Distance" : "Hours",
    detailsValue: distanceOrHours,
  };
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

  // Custom date picker state
  const [pickerYear, setPickerYear] = useState(new Date().getFullYear());
  const [pickerMonth, setPickerMonth] = useState(new Date().getMonth() + 1);
  const [pickerDay, setPickerDay] = useState(new Date().getDate());

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

  const normalizeId = (value) => {
    if (value === null || value === undefined || value === "") return null;
    return String(value);
  };

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
      const selectedVehicleId = normalizeId(clientFilters.vehicleId);
      filtered = filtered.filter(
        (t) => normalizeId(t.vehicleId) === selectedVehicleId
      );
    }

    // Filter by PTS device
    if (clientFilters.ptsId) {
      const selectedPtsId = normalizeId(clientFilters.ptsId);
      filtered = filtered.filter((t) => normalizeId(t.ptsId) === selectedPtsId);
    }

    // Filter by tank
    if (clientFilters.tankId) {
      const selectedTankId = normalizeId(clientFilters.tankId);
      filtered = filtered.filter((t) => normalizeId(t.tankId) === selectedTankId);
    }

    // Filter by site
    if (clientFilters.siteId) {
      const selectedSiteId = normalizeId(clientFilters.siteId);
      filtered = filtered.filter((t) => normalizeId(t.siteId) === selectedSiteId);
    }

    // Filter by user (fueledBy)
    if (clientFilters.userId) {
      const selectedUserId = normalizeId(clientFilters.userId);
      filtered = filtered.filter(
        (t) =>
          normalizeId(t.fueledBy) === selectedUserId ||
          normalizeId(t.fueledByUserId) === selectedUserId ||
          normalizeId(t.userId) === selectedUserId
      );
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

  const summaryMetrics = useMemo(() => {
    const serverTotalTransactions = Number(
      summary?.totalTransactions ?? summary?.transactionCount ?? transactions.length ?? 0
    );
    const serverTotalVolume = Number(summary?.totalVolume ?? 0);

    const filteredCount = filteredTransactions.length;
    const filteredVolume = filteredTransactions.reduce(
      (sum, item) => sum + Number(item?.volume || 0),
      0
    );

    if (hasActiveClientFilters) {
      return {
        count: filteredCount,
        volume: filteredVolume,
        totalLoaded: transactions.length,
      };
    }

    return {
      count: serverTotalTransactions,
      volume: serverTotalVolume,
      totalLoaded: transactions.length,
    };
  }, [filteredTransactions, hasActiveClientFilters, summary, transactions.length]);

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
    const today = new Date();
    const todayStr = today.toISOString().split("T")[0];

    // Default to today
    const initialFilters = {
      ...filters,
      startDate: filters.startDate || todayStr,
      endDate: filters.endDate || todayStr,
    };

    console.log('[TransactionHistory] Initial load with dates:', initialFilters.startDate, 'to', initialFilters.endDate);
    dispatch(updateFilters(initialFilters));
    loadTransactions(1, false, initialFilters);
    loadSummary(initialFilters);
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
    (page = 1, refresh = false, overrideFilters = null) => {
      const effectiveFilters = overrideFilters || filters;
      const searchFilters = {
        ...effectiveFilters,
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

  const loadSummary = useCallback((overrideFilters = null) => {
    const effectiveFilters = overrideFilters || filters;
    const summaryFilters = {
      startDate: effectiveFilters.startDate,
      endDate: effectiveFilters.endDate,
      pumpId: effectiveFilters.pumpId,
      deviceId: effectiveFilters.deviceId,
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
    // Pass tempFilters directly to ensure we use the new values immediately
    loadTransactions(1, true, tempFilters);
    loadSummary(tempFilters);
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

  // Open custom date picker modal
  const openDatePicker = (mode) => {
    const currentValue =
      mode === "start" ? tempFilters.startDate : tempFilters.endDate;
    const initialDate = currentValue ? new Date(currentValue) : new Date();
    setPickerYear(initialDate.getFullYear());
    setPickerMonth(initialDate.getMonth() + 1);
    setPickerDay(initialDate.getDate());
    setDatePickerMode(mode);
    setShowDatePicker(true);
  };

  // Confirm date selection from custom picker
  const handleDateConfirm = () => {
    const dateStr = `${pickerYear}-${String(pickerMonth).padStart(2, "0")}-${String(pickerDay).padStart(2, "0")}`;
    setTempFilters((prev) => ({
      ...prev,
      [datePickerMode === "start" ? "startDate" : "endDate"]: dateStr,
    }));
    setShowDatePicker(false);
  };

  // Get days in month for custom picker
  const getDaysInMonth = (year, month) => {
    return new Date(year, month, 0).getDate();
  };

  // Get the first day of month (0 = Sunday, 1 = Monday, etc.)
  const getFirstDayOfMonth = (year, month) => {
    return new Date(year, month - 1, 1).getDay();
  };

  // Navigate calendar months
  const navigateMonth = (direction) => {
    let newMonth = pickerMonth + direction;
    let newYear = pickerYear;

    if (newMonth > 12) {
      newMonth = 1;
      newYear += 1;
    } else if (newMonth < 1) {
      newMonth = 12;
      newYear -= 1;
    }

    // Don't allow future dates
    const today = new Date();
    if (newYear > today.getFullYear() ||
        (newYear === today.getFullYear() && newMonth > today.getMonth() + 1)) {
      return;
    }

    setPickerYear(newYear);
    setPickerMonth(newMonth);
    // Reset day if it exceeds new month's days
    const daysInNewMonth = getDaysInMonth(newYear, newMonth);
    if (pickerDay > daysInNewMonth) {
      setPickerDay(daysInNewMonth);
    }
  };

  // Select a day from calendar
  const selectDay = (day) => {
    if (day <= 0) return;
    // Don't allow future dates
    const today = new Date();
    const selectedDate = new Date(pickerYear, pickerMonth - 1, day);
    if (selectedDate > today) return;
    setPickerDay(day);
  };

  // Build calendar grid
  const buildCalendarGrid = () => {
    const daysInMonth = getDaysInMonth(pickerYear, pickerMonth);
    const firstDay = getFirstDayOfMonth(pickerYear, pickerMonth);
    const today = new Date();
    const grid = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      grid.push({ day: 0, disabled: true });
    }

    // Days of month
    for (let d = 1; d <= daysInMonth; d++) {
      const dateToCheck = new Date(pickerYear, pickerMonth - 1, d);
      const isFuture = dateToCheck > today;
      const isToday =
        d === today.getDate() &&
        pickerMonth === today.getMonth() + 1 &&
        pickerYear === today.getFullYear();
      grid.push({ day: d, disabled: isFuture, isToday });
    }

    return grid;
  };

  const parseDateToLocal = (value) => {
    if (!value) return null;
    if (value instanceof Date) return value;
    if (typeof value === "string") {
      const trimmed = value.trim();
      const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(trimmed);
      const hasTime = trimmed.includes("T");
      if (hasTimezone) {
        return new Date(trimmed);
      }
      if (hasTime) {
        return new Date(`${trimmed}Z`);
      }
      return new Date(trimmed);
    }
    return new Date(value);
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = parseDateToLocal(dateString);
    if (!date || Number.isNaN(date.getTime())) return "";
    return (
      date.toLocaleDateString() +
      " " +
      date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  };

  const formatVolume = (volume) => {
    return `${(volume || 0).toFixed(2)} L`;
  };

  const formatConsumption = (value, unit) => {
    const normalized = normalizeNumber(value);
    if (normalized === null || normalized <= 0) return "N/A";
    return `${normalized.toFixed(2)} ${unit}`;
  };

  // Format distance (km) or engine hours based on vehicle type
  const formatDistanceOrHours = (value, isKmPerLiter = true) => {
    if (!value) return "N/A";
    if (isKmPerLiter) {
      return `${value.toLocaleString()} km`;
    } else {
      return `${value.toLocaleString()} hr`;
    }
  };

  // Legacy function for backward compatibility
  const formatDistance = (distance) => {
    if (!distance) return "N/A";
    return `${distance.toLocaleString()} km`;
  };

  const openLocationInMaps = (item) => {
    const location = getFuelingLocation(item);
    openLocationInMapsHelper(
      location.latitude,
      location.longitude,
      item?.siteName
    );
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

      // Fueling location - captured from mobile app (if available)
      fuelingLatitude: item.fuelingLatitude,
      fuelingLongitude: item.fuelingLongitude,
      fuelingLocationAccuracy: item.fuelingLocationAccuracy,
      fuelingLocationSource: item.fuelingLocationSource,

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
    const consumptionMetric = getConsumptionMetric(item);
    const location = getFuelingLocation(item);
    const hasLocation = location.latitude !== null && location.longitude !== null;
    const locationText = hasLocation
      ? `${location.label}: ${location.latitude.toFixed(4)}, ${location.longitude.toFixed(4)}`
      : item.siteName || "Location unavailable";

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
            onPress={() => openLocationInMaps(item)}
            disabled={!hasLocation}
          >
            <Icon name="map-marker-alt" size={14} color="#2563eb" />
            <Text style={styles.locationText}>
              {locationText}
            </Text>
            {hasLocation && (
              <Icon
                name="external-link-alt"
                size={10}
                color="#2563eb"
                style={styles.linkIcon}
              />
            )}
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
              {formatConsumption(consumptionMetric.value, consumptionMetric.unit)}
            </Text>
            <Text style={styles.amountSubDetail}>
              {consumptionMetric.detailsLabel}: {formatDistanceOrHours(
                consumptionMetric.detailsValue,
                consumptionMetric.isKmPerLiter
              )}
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

  // Helper to format date for display
  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  // Get today's date string
  const getTodayStr = () => new Date().toISOString().split("T")[0];

  // Determine which date range button is active
  const getActiveDateRange = () => {
    const today = getTodayStr();
    const todayDate = new Date();
    const sevenDaysAgo = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const thirtyDaysAgo = new Date(todayDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    if (filters.startDate === today && filters.endDate === today) return 'today';
    if (filters.startDate === sevenDaysAgo && filters.endDate === today) return '7days';
    if (filters.startDate === thirtyDaysAgo && filters.endDate === today) return '30days';
    return 'custom';
  };

  // Quick date range handlers
  const handleQuickDateRange = (range) => {
    const today = getTodayStr();
    const todayDate = new Date();
    let startDate = today;
    let endDate = today;

    if (range === '7days') {
      startDate = new Date(todayDate.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    } else if (range === '30days') {
      startDate = new Date(todayDate.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    }

    const newFilters = {
      ...filters,
      startDate,
      endDate,
    };
    dispatch(updateFilters(newFilters));
    setTempFilters(newFilters);
    loadTransactions(1, true, newFilters);
    loadSummary(newFilters);
  };

  const renderDateRangeButtons = () => {
    const activeRange = getActiveDateRange();

    return (
      <View style={styles.dateRangeButtonGroup}>
        <TouchableOpacity
          style={[styles.dateRangeButton, activeRange === 'today' && styles.dateRangeButtonActive]}
          onPress={() => handleQuickDateRange('today')}
        >
          <Text style={[styles.dateRangeButtonText, activeRange === 'today' && styles.dateRangeButtonTextActive]}>Today</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateRangeButton, activeRange === '7days' && styles.dateRangeButtonActive]}
          onPress={() => handleQuickDateRange('7days')}
        >
          <Text style={[styles.dateRangeButtonText, activeRange === '7days' && styles.dateRangeButtonTextActive]}>Last 7 Days</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.dateRangeButton, activeRange === '30days' && styles.dateRangeButtonActive]}
          onPress={() => handleQuickDateRange('30days')}
        >
          <Text style={[styles.dateRangeButtonText, activeRange === '30days' && styles.dateRangeButtonTextActive]}>Last 30 Days</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const renderSummaryCard = () => {
    // Get current date range from filters
    const startDateDisplay = formatDisplayDate(filters.startDate);
    const endDateDisplay = formatDisplayDate(filters.endDate);
    const isSameDay = filters.startDate === filters.endDate;
    const dateRangeText = isSameDay
      ? startDateDisplay
      : `${startDateDisplay} - ${endDateDisplay}`;

    return (
      <View style={styles.summaryCard}>
        <View style={styles.summaryHeader}>
          <View>
            <Text style={styles.summaryTitle}>Summary</Text>
            <Text style={styles.summaryDateRange}>{dateRangeText}</Text>
          </View>
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
              {summaryMetrics.count}
              {hasActiveClientFilters && (
                <Text style={styles.summarySubValue}>
                  {" "}
                  / {summaryMetrics.totalLoaded}
                </Text>
              )}
            </Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryLabel}>
              {hasActiveClientFilters ? "Filtered Volume" : "Total Volume"}
            </Text>
            <Text style={styles.summaryValue}>
              {formatVolume(summaryMetrics.volume)}
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
                disabled={
                  !getFuelingLocation(selectedTransaction).latitude ||
                  !getFuelingLocation(selectedTransaction).longitude
                }
              >
                <View style={styles.locationIconContainer}>
                  <Icon name="map-marker-alt" size={24} color="#2563eb" />
                </View>
                <View style={styles.locationDetails}>
                  <Text style={styles.locationName}>
                    {getFuelingLocation(selectedTransaction).label}
                  </Text>
                  {selectedTransaction.siteAddress ? (
                    <Text style={styles.locationAddress}>
                      {selectedTransaction.siteAddress}
                    </Text>
                  ) : getFuelingLocation(selectedTransaction).latitude &&
                    getFuelingLocation(selectedTransaction).longitude ? (
                    <Text style={styles.locationAddress}>
                      {getFuelingLocation(selectedTransaction).latitude.toFixed(4)},
                      {" "}
                      {getFuelingLocation(selectedTransaction).longitude.toFixed(4)}
                    </Text>
                  ) : null}
                </View>
                {getFuelingLocation(selectedTransaction).latitude &&
                  getFuelingLocation(selectedTransaction).longitude && (
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
                {selectedTransaction.isKmPerLiter !== false ? "Odometer & Distance" : "Engine Hours"}
              </Text>
              <View style={styles.auditCard}>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>
                    Current {selectedTransaction.isKmPerLiter !== false ? "Odometer" : "Hours"}
                  </Text>
                  <Text style={styles.auditValue}>
                    {selectedTransaction.currentOdometer?.toLocaleString() ||
                      "N/A"}{" "}
                    {selectedTransaction.isKmPerLiter !== false ? "km" : "hr"}
                  </Text>
                </View>
                <View style={styles.auditRow}>
                  <Text style={styles.auditLabel}>
                    Previous {selectedTransaction.isKmPerLiter !== false ? "Odometer" : "Hours"}
                  </Text>
                  <Text style={styles.auditValue}>
                    {selectedTransaction.previousOdometer?.toLocaleString() ||
                      "N/A"}{" "}
                    {selectedTransaction.isKmPerLiter !== false ? "km" : "hr"}
                  </Text>
                </View>
                <View style={[styles.auditRow, styles.auditRowHighlight]}>
                  <Text style={styles.auditLabelBold}>
                    {selectedTransaction.isKmPerLiter !== false ? "Distance Since Last Refuel" : "Hours Since Last Refuel"}
                  </Text>
                  <Text style={styles.auditValueHighlight}>
                    {formatDistanceOrHours(
                      selectedTransaction.consumptionSinceLastRefuel,
                      selectedTransaction.isKmPerLiter !== false
                    )}
                  </Text>
                </View>
                <View style={[styles.auditRow, styles.auditRowHighlightSecondary]}>
                  <Text style={styles.auditLabelBold}>Consumption ({selectedTransaction.isKmPerLiter !== false ? "km/L" : "L/hr"})</Text>
                  <Text style={styles.auditValueHighlight}>
                    {formatConsumption(
                      getConsumptionMetric(selectedTransaction).value,
                      getConsumptionMetric(selectedTransaction).unit
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
                onPress={() => openDatePicker("start")}
              >
                <Icon name="calendar" size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {tempFilters.startDate || "Start Date"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => openDatePicker("end")}
              >
                <Icon name="calendar" size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {tempFilters.endDate || "End Date"}
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

      {/* Custom Calendar Date Picker Modal */}
      <Modal
        visible={showDatePicker}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowDatePicker(false)}
      >
        <View style={styles.datePickerOverlay}>
          <View style={styles.calendarContainer}>
            {/* Header with title */}
            <View style={styles.calendarHeader}>
              <Text style={styles.calendarTitle}>
                Select {datePickerMode === "start" ? "Start" : "End"} Date
              </Text>
              <TouchableOpacity onPress={() => setShowDatePicker(false)}>
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Quick select buttons */}
            <View style={styles.quickSelectRow}>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const today = new Date();
                  setPickerYear(today.getFullYear());
                  setPickerMonth(today.getMonth() + 1);
                  setPickerDay(today.getDate());
                }}
              >
                <Text style={styles.quickSelectText}>Today</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const yesterday = new Date();
                  yesterday.setDate(yesterday.getDate() - 1);
                  setPickerYear(yesterday.getFullYear());
                  setPickerMonth(yesterday.getMonth() + 1);
                  setPickerDay(yesterday.getDate());
                }}
              >
                <Text style={styles.quickSelectText}>Yesterday</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.quickSelectButton}
                onPress={() => {
                  const weekAgo = new Date();
                  weekAgo.setDate(weekAgo.getDate() - 7);
                  setPickerYear(weekAgo.getFullYear());
                  setPickerMonth(weekAgo.getMonth() + 1);
                  setPickerDay(weekAgo.getDate());
                }}
              >
                <Text style={styles.quickSelectText}>7 Days Ago</Text>
              </TouchableOpacity>
            </View>

            {/* Month/Year Navigation */}
            <View style={styles.calendarNavigation}>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateMonth(-1)}
              >
                <Icon name="chevron-left" size={18} color="#374151" />
              </TouchableOpacity>
              <Text style={styles.calendarMonthYear}>
                {new Date(pickerYear, pickerMonth - 1).toLocaleString("default", {
                  month: "long",
                  year: "numeric",
                })}
              </Text>
              <TouchableOpacity
                style={styles.calendarNavButton}
                onPress={() => navigateMonth(1)}
              >
                <Icon name="chevron-right" size={18} color="#374151" />
              </TouchableOpacity>
            </View>

            {/* Weekday Headers */}
            <View style={styles.calendarWeekRow}>
              {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                <Text key={day} style={styles.calendarWeekDay}>
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Grid */}
            <View style={styles.calendarGrid}>
              {buildCalendarGrid().map((item, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.calendarDayCell,
                    item.day === pickerDay && !item.disabled && styles.calendarDaySelected,
                    item.isToday && styles.calendarDayToday,
                    item.disabled && styles.calendarDayDisabled,
                  ]}
                  onPress={() => selectDay(item.day)}
                  disabled={item.disabled || item.day === 0}
                >
                  <Text
                    style={[
                      styles.calendarDayText,
                      item.day === pickerDay && !item.disabled && styles.calendarDayTextSelected,
                      item.isToday && item.day !== pickerDay && styles.calendarDayTextToday,
                      item.disabled && styles.calendarDayTextDisabled,
                    ]}
                  >
                    {item.day > 0 ? item.day : ""}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Selected Date Preview */}
            <View style={styles.datePickerPreview}>
              <Icon name="calendar-check" size={18} color="#2563eb" />
              <Text style={styles.datePickerPreviewText}>
                {new Date(pickerYear, pickerMonth - 1, pickerDay).toLocaleDateString("en-US", {
                  weekday: "short",
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                })}
              </Text>
            </View>

            {/* Action Buttons */}
            <View style={styles.datePickerActions}>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.datePickerCancelButton]}
                onPress={() => setShowDatePicker(false)}
              >
                <Text style={styles.datePickerCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.datePickerButton, styles.datePickerConfirmButton]}
                onPress={handleDateConfirm}
              >
                <Text style={styles.datePickerConfirmText}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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

      {/* Quick Date Range Buttons */}
      {renderDateRangeButtons()}

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
        ListEmptyComponent={() => {
          if (isLoading) {
            return (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#2563eb" />
                <Text style={styles.loadingText}>Loading transactions...</Text>
              </View>
            );
          }

          return (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyDescription}>
                {hasActiveClientFilters
                  ? "No transactions match your current filters."
                  : "No transactions found for this date range."}
              </Text>
              {hasActiveClientFilters && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={handleClearClientFilters}
                >
                  <Text style={styles.clearFiltersButtonText}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          );
        }}
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
  dateRangeButtonGroup: {
    flexDirection: "row",
    marginHorizontal: 16,
    marginTop: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 8,
    padding: 4,
    flexWrap: "wrap",
  },
  dateRangeButton: {
    flex: 1,
    minWidth: 90,
    paddingVertical: 8,
    paddingHorizontal: 6,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 2,
  },
  dateRangeButtonActive: {
    backgroundColor: "#2563eb",
  },
  dateRangeButtonText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
    textAlign: "center",
    flexWrap: "wrap",
  },
  dateRangeButtonTextActive: {
    color: "#ffffff",
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
    marginBottom: 2,
  },
  summaryDateRange: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 8,
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
    backgroundColor: "#6b7280",
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
  amountSubDetail: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 2,
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
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  auditRowHighlightSecondary: {
    backgroundColor: "#eff6ff",
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
  // Custom date picker styles
  datePickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  // Calendar container
  calendarContainer: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    width: "92%",
    maxWidth: 380,
  },
  calendarHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
  },
  // Quick select buttons
  quickSelectRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
    gap: 8,
  },
  quickSelectButton: {
    flex: 1,
    backgroundColor: "#f3f4f6",
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: "center",
  },
  quickSelectText: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
  },
  // Calendar navigation
  calendarNavigation: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  calendarNavButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#f3f4f6",
  },
  calendarMonthYear: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  // Weekday headers
  calendarWeekRow: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginBottom: 8,
  },
  calendarWeekDay: {
    width: 40,
    textAlign: "center",
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  // Calendar grid
  calendarGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "flex-start",
  },
  calendarDayCell: {
    width: "14.28%",
    aspectRatio: 1,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  calendarDaySelected: {
    backgroundColor: "#2563eb",
  },
  calendarDayTextSelected: {
    color: "white",
    fontWeight: "700",
  },
  calendarDayToday: {
    borderWidth: 2,
    borderColor: "#2563eb",
  },
  calendarDayTextToday: {
    color: "#2563eb",
    fontWeight: "700",
  },
  calendarDayDisabled: {
    opacity: 0.3,
  },
  calendarDayTextDisabled: {
    color: "#9ca3af",
  },
  // Date preview
  datePickerPreview: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    padding: 10,
    marginTop: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  datePickerPreviewText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e40af",
    marginLeft: 8,
  },
  // Action buttons
  datePickerActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    gap: 12,
  },
  datePickerButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  datePickerCancelButton: {
    backgroundColor: "#f3f4f6",
  },
  datePickerConfirmButton: {
    backgroundColor: "#2563eb",
  },
  datePickerCancelText: {
    color: "#374151",
    fontSize: 16,
    fontWeight: "600",
  },
  datePickerConfirmText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TransactionHistoryScreen;
