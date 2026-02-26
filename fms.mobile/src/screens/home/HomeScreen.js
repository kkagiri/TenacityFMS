/**
 * File: HomeScreen.js
 * Purpose: Main dashboard with fuel overview, grouped quick action icons,
 *          and recent transaction hub entries. No drawer - all navigation via quick actions.
 * Dependencies: react-native, react-redux, apiService, signalRService, usePermissions
 * Last Modified: 2026-02-12
 *
 * Key Sections:
 * - Welcome header + notification bell
 * - Site badge
 * - Fuel summary card
 * - Quick Actions (small circular icon tiles, grouped):
 *     Fuel Activity: Fueling, Transaction Hub, Transactions, Stock Management
 *     Apps: Vehicle Details, Issue Tracker (admin/poweruser), Location Settings (admin)
 *     Tank Levels: Tank Stock (with live data toggle)
 * - Recent Transaction Hub (last 3 + See More)
 */
import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
  Switch,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import { fetchTanks } from "../../redux/slices/tankSlice";
import { fetchNotificationStats } from "../../redux/slices/notificationSlice";
import apiService from "../../services/apiService";
import signalRService from "../../services/signalRService";
import { NotificationBell } from "../../components/notifications";
import { usePermissions } from "../../hooks/usePermissions";

const { width } = Dimensions.get("window");

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
};

// Volume change reason mapping (matches TankTransactionHubScreen)
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

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const [defaultSite, setDefaultSite] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayTransactionCount, setTodayTransactionCount] = useState(0);
  const [recentTransactions, setRecentTransactions] = useState([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [liveDataEnabled, setLiveDataEnabled] = useState(false);

  const { tanks } = useSelector((state) => state.tank);
  const { isAdmin, hasPermission, hasAnyPermission } = usePermissions();

  // Check if user can access issues (permission-based)
  const canAccessIssues = useMemo(() => {
    return hasAnyPermission(["_Read_Issues", "_View_Issue", "_Read_Issue", "_Edit_Issues", "_Approve_Issues", "_Delete_Issues"]);
  }, [hasAnyPermission]);

  // Check if user can access location settings
  const canAccessLocationSettings = useMemo(() => {
    return hasPermission("_Manage_LocationValidation");
  }, [hasPermission]);

  // Fuel stats from tanks
  const fuelStats = useMemo(() => {
    const totalCapacity = tanks.reduce(
      (sum, t) => sum + (t.tankVolume || t.capacity || 0),
      0
    );
    const totalStock = tanks.reduce(
      (sum, t) => sum + (t.physicalStockValue ?? t.currentVolume ?? 0),
      0
    );
    const percentFull =
      totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
    return { totalCapacity, totalStock, percentFull };
  }, [tanks]);

  const formatVolume = (volume) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return Math.round(volume).toLocaleString();
  };

  const displayName =
    user?.FullName ||
    user?.fullName ||
    user?.UserName ||
    user?.userName ||
    user?.username ||
    user?.name ||
    "User";

  // Load saved site on mount
  useEffect(() => {
    loadSavedSite();
    dispatch(fetchTanks());
    dispatch(fetchNotificationStats());
    fetchTodayTransactions();
    fetchRecentTransactions();
  }, []);

  const loadSavedSite = async () => {
    try {
      const savedSite = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_SITE);
      if (savedSite) {
        setDefaultSite(JSON.parse(savedSite));
      }
    } catch (error) {
      console.error("Error loading saved site:", error);
    }
  };

  const fetchTodayTransactions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const response = await apiService.getTankVolumeHistory({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        take: 1000,
      });
      const transactions = Array.isArray(response) ? response : [];
      setTodayTransactionCount(transactions.length);
    } catch (error) {
      console.error("Failed to fetch today's transactions:", error);
    }
  };

  const fetchRecentTransactions = async () => {
    setLoadingRecent(true);
    try {
      const today = new Date();
      const weekAgo = new Date(today);
      weekAgo.setDate(weekAgo.getDate() - 7);
      const response = await apiService.getTankVolumeHistory({
        startDate: weekAgo.toISOString(),
        endDate: today.toISOString(),
        take: 3,
      });
      const transactions = Array.isArray(response) ? response : [];
      setRecentTransactions(transactions.slice(0, 3));
    } catch (error) {
      console.error("Failed to fetch recent transactions:", error);
      setRecentTransactions([]);
    } finally {
      setLoadingRecent(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedSite();
    dispatch(fetchTanks());
    await fetchTodayTransactions();
    await fetchRecentTransactions();
    try {
      if (signalRService.isConnected()) {
        await signalRService.requestDeviceStatusSummary();
      }
    } catch (error) {
      console.log("[HomeScreen] Error refreshing SignalR status:", error);
    }
    setRefreshing(false);
  };

  // Toggle live data from PTS HUB
  const handleLiveDataToggle = (value) => {
    setLiveDataEnabled(value);
    // TODO: Connect/disconnect PTS HUB broadcast for tank measurement data
    if (value) {
      console.log("[HomeScreen] Live data enabled - subscribing to PTS HUB tank measurements");
    } else {
      console.log("[HomeScreen] Live data disabled - unsubscribing from PTS HUB");
    }
  };

  // Format date for recent transactions
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

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = parseDateToLocal(dateStr);
    if (!d || Number.isNaN(d.getTime())) return "";
    const now = new Date();
    const diffMs = Math.max(0, now - d);
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor(diffMs / (1000 * 60));

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHrs < 24) return `${diffHrs}h ago`;
    return d.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Get reason info from enum
  const getReasonInfo = (reasonValue, tx = {}) => {
    if (reasonValue !== null && reasonValue !== undefined) {
      const numericReason = Number(reasonValue);
      if (Number.isFinite(numericReason)) {
        const byId = VolumeChangeReasonEnum.find((r) => r.id === numericReason);
        if (byId) return byId;
      }

      if (typeof reasonValue === "string") {
        const normalized = reasonValue.trim().toLowerCase();
        const byName = VolumeChangeReasonEnum.find(
          (r) => r.name.toLowerCase() === normalized
        );
        if (byName) return byName;
      }
    }

    const fallbackName =
      tx.volumeChangeReasonName ||
      tx.reasonName ||
      tx.changeReasonName ||
      tx.transactionType ||
      tx.type ||
      "Unknown";

    return (
      VolumeChangeReasonEnum.find((r) => r.name.toLowerCase() === String(fallbackName).toLowerCase()) || {
        name: fallbackName,
        color: "#6B7280",
        icon: "question-circle",
      }
    );
  };

  // ─── Quick Action Items (grouped) ──────────────────────────────────
  const fuelActivityItems = [
    {
      id: "fueling",
      name: "Fueling",
      icon: "gas-pump",
      color: "#2563eb",
      bgColor: "#eff6ff",
      onPress: () => navigation.navigate("Devices"),
    },
    {
      id: "transactionHub",
      name: "Transaction Hub",
      icon: "exchange-alt",
      color: "#f59e0b",
      bgColor: "#fffbeb",
      onPress: () => navigation.navigate("TankTransactionHub"),
    },
    {
      id: "transactions",
      name: "Transactions",
      icon: "history",
      color: "#10b981",
      bgColor: "#ecfdf5",
      onPress: () => navigation.navigate("History"),
    },
    {
      id: "stocks",
      name: "Stocks",
      icon: "warehouse",
      color: "#059669",
      bgColor: "#ecfdf5",
      onPress: () => navigation.navigate("ManageStocks"),
    },
  ];

  const appItems = [
    {
      id: "vehicleDetails",
      name: "Vehicles",
      icon: "car",
      color: "#0891b2",
      bgColor: "#ecfeff",
      onPress: () => navigation.navigate("VehicleDetails"),
    },
    // Issue Tracker - permission-based
    ...(canAccessIssues
      ? [
        {
          id: "issueTracker",
          name: "Issues",
          icon: "exclamation-circle",
          color: "#7c3aed",
          bgColor: "#f5f3ff",
          onPress: () => navigation.navigate("IssueList"),
        },
      ]
      : []),
    // Location Settings - permission-based
    ...(canAccessLocationSettings
      ? [
        {
          id: "locationSettings",
          name: "Location",
          icon: "map-marker-alt",
          color: "#ef4444",
          bgColor: "#fef2f2",
          onPress: () => navigation.navigate("LocationSettings"),
        },
      ]
      : []),
  ];

  // ─── Render Quick Action Icon Tile ─────────────────────────────────
  const renderQuickActionTile = (item) => (
    <TouchableOpacity
      key={item.id}
      style={styles.quickTile}
      onPress={item.onPress}
      activeOpacity={0.7}
    >
      <View style={[styles.quickTileIcon, { backgroundColor: item.bgColor }]}>
        <Icon name={item.icon} size={22} color={item.color} />
      </View>
      <Text style={styles.quickTileName} numberOfLines={2}>
        {item.name}
      </Text>
      {item.badge && (
        <View style={styles.tileBadge}>
          <Text style={styles.tileBadgeText}>{item.badge}</Text>
        </View>
      )}
    </TouchableOpacity>
  );

  // ─── Render Transaction Item ───────────────────────────────────────
  const renderTransactionItem = (tx, index) => {
    const reason = getReasonInfo(
      tx.volumeChangeReason ??
      tx.reason ??
      tx.reasonId ??
      tx.volumeChangeReasonId ??
      tx.changeReason,
      tx
    );
    const volume = tx.volumeChange ?? tx.volume ?? 0;
    const tankName =
      tx.tankName ||
      tx.tank?.name ||
      tx.productName ||
      tx.vehicleName ||
      tx.siteName ||
      "N/A";
    const date = tx.dateTime || tx.createdDate || tx.dateCreated || tx.timestamp || tx.createdAt;

    return (
      <TouchableOpacity
        key={tx.id || index}
        style={[
          styles.txItem,
          index < recentTransactions.length - 1 && styles.txItemBorder,
        ]}
        onPress={() => navigation.navigate("TankTransactionHub")}
        activeOpacity={0.7}
      >
        <View style={[styles.txIcon, { backgroundColor: reason.color + "18" }]}>
          <Icon name={reason.icon} size={14} color={reason.color} />
        </View>
        <View style={styles.txInfo}>
          <Text style={styles.txReason}>{reason.name}</Text>
          <Text style={styles.txTank}>{tankName}</Text>
        </View>
        <View style={styles.txRight}>
          <Text
            style={[
              styles.txVolume,
              { color: volume >= 0 ? "#10b981" : "#ef4444" },
            ]}
          >
            {volume >= 0 ? "+" : ""}
            {formatVolume(Math.abs(volume))} L
          </Text>
          <Text style={styles.txDate}>{formatDate(date)}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>Welcome back,</Text>
          <Text style={styles.userName}>{displayName}</Text>
        </View>
        <NotificationBell color="#2563eb" style={styles.notificationBell} />
      </View>

      {/* Site Badge Row */}
      <View style={styles.siteBadgeRow}>
        {defaultSite ? (
          <View style={styles.siteBadge}>
            <Icon name="map-marker-alt" size={12} color="#2563eb" />
            <Text style={styles.siteText}>{defaultSite.name}</Text>
          </View>
        ) : (
          <TouchableOpacity
            style={styles.selectSiteBadge}
            onPress={() => navigation.navigate("Settings")}
          >
            <Icon name="exclamation-circle" size={12} color="#f59e0b" />
            <Text style={styles.selectSiteText}>Select a site</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Fuel Summary Card */}
      <View style={styles.fuelSummaryCard}>
        <View style={styles.fuelSummaryHeader}>
          <Text style={styles.fuelSummaryTitle}>Fuel Overview</Text>
          <TouchableOpacity onPress={() => navigation.navigate("TankStock")}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.fuelStatsRow}>
          <View style={styles.fuelStatItem}>
            <View
              style={[styles.fuelStatIcon, { backgroundColor: "#dcfce7" }]}
            >
              <Icon name="gas-pump" size={18} color="#22c55e" />
            </View>
            <Text style={styles.fuelStatValue}>
              {formatVolume(fuelStats.totalStock)} L
            </Text>
            <Text style={styles.fuelStatLabel}>Physical Stock</Text>
          </View>
          <View style={styles.fuelStatDivider} />
          <View style={styles.fuelStatItem}>
            <View
              style={[styles.fuelStatIcon, { backgroundColor: "#e0e7ff" }]}
            >
              <Icon name="database" size={18} color="#6366f1" />
            </View>
            <Text style={styles.fuelStatValue}>
              {formatVolume(fuelStats.totalCapacity)} L
            </Text>
            <Text style={styles.fuelStatLabel}>Total Capacity</Text>
          </View>
          <View style={styles.fuelStatDivider} />
          <View style={styles.fuelStatItem}>
            <View
              style={[
                styles.fuelStatIcon,
                {
                  backgroundColor:
                    fuelStats.percentFull < 30
                      ? "#fee2e2"
                      : fuelStats.percentFull < 60
                        ? "#fef3c7"
                        : "#dcfce7",
                },
              ]}
            >
              <Icon
                name="tachometer-alt"
                size={18}
                color={
                  fuelStats.percentFull < 30
                    ? "#ef4444"
                    : fuelStats.percentFull < 60
                      ? "#f59e0b"
                      : "#22c55e"
                }
              />
            </View>
            <Text
              style={[
                styles.fuelStatValue,
                {
                  color:
                    fuelStats.percentFull < 30
                      ? "#ef4444"
                      : fuelStats.percentFull < 60
                        ? "#f59e0b"
                        : "#22c55e",
                },
              ]}
            >
              {fuelStats.percentFull}%
            </Text>
            <Text style={styles.fuelStatLabel}>Fill Level</Text>
          </View>
        </View>
        {/* Today's Transactions Row */}
        <View style={styles.txRow}>
          <Icon name="exchange-alt" size={14} color="#f59e0b" />
          <Text style={styles.txRowText}>
            {todayTransactionCount} transactions today
          </Text>
        </View>
      </View>

      {/* ─── Quick Actions ─────────────────────────────────────────── */}
      <View style={styles.quickActionsSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        {/* Fuel Activity Group */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupLabel}>Fuel Activity</Text>
          <View style={styles.quickTileRow}>
            {fuelActivityItems.map(renderQuickActionTile)}
          </View>
        </View>

        {/* Apps Group */}
        <View style={styles.groupContainer}>
          <Text style={styles.groupLabel}>Apps</Text>
          <View style={styles.quickTileRow}>
            {appItems.map(renderQuickActionTile)}
          </View>
        </View>

        {/* Sites Group - TankStock */}
        <View style={styles.groupContainer}>
          <View style={styles.groupLabelRow}>
            <Text style={styles.groupLabel}>Tank Levels</Text>
            <View style={styles.liveDataToggle}>
              <Text style={styles.liveDataLabel}>Live Data</Text>
              <Switch
                value={liveDataEnabled}
                onValueChange={handleLiveDataToggle}
                trackColor={{ false: "#d1d5db", true: "#bfdbfe" }}
                thumbColor={liveDataEnabled ? "#2563eb" : "#9ca3af"}
                style={{ transform: [{ scaleX: 0.8 }, { scaleY: 0.8 }] }}
              />
            </View>
          </View>
          <View style={styles.quickTileRow}>
            <TouchableOpacity
              style={styles.quickTile}
              onPress={() => navigation.navigate("TankStock")}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.quickTileIcon,
                  { backgroundColor: "#f5f3ff" },
                ]}
              >
                <Icon name="industry" size={22} color="#8b5cf6" />
                {liveDataEnabled && (
                  <View style={styles.liveDot} />
                )}
              </View>
              <Text style={styles.quickTileName}>Tank Levels</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* ─── Recent Transaction Hub ───────────────────────────────── */}
      <View style={styles.recentSection}>
        <View style={styles.recentHeader}>
          <Text style={styles.sectionTitle}>Recent Transactions</Text>
          <TouchableOpacity
            onPress={() => navigation.navigate("TankTransactionHub")}
          >
            <Text style={styles.seeMoreText}>See More</Text>
          </TouchableOpacity>
        </View>

        {loadingRecent ? (
          <View style={styles.recentLoading}>
            <ActivityIndicator size="small" color="#2563eb" />
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        ) : recentTransactions.length === 0 ? (
          <View style={styles.recentEmpty}>
            <Icon name="inbox" size={28} color="#d1d5db" />
            <Text style={styles.emptyText}>No recent transactions</Text>
          </View>
        ) : (
          <View style={styles.recentList}>
            {recentTransactions.map(renderTransactionItem)}
          </View>
        )}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  welcomeSection: {
    flex: 1,
  },
  welcomeText: {
    fontSize: 14,
    color: "#6b7280",
  },
  userName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#1f2937",
  },
  notificationBell: {
    marginLeft: 12,
    backgroundColor: "#f3f4f6",
    borderRadius: 20,
  },
  siteBadgeRow: {
    marginBottom: 16,
  },
  siteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#eff6ff",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  siteText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "500",
  },
  selectSiteBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: "flex-start",
  },
  selectSiteText: {
    marginLeft: 6,
    fontSize: 13,
    color: "#d97706",
    fontWeight: "500",
  },

  // ─── Fuel Summary Card ───────────────────────────────────────
  fuelSummaryCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  fuelSummaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  fuelSummaryTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
  },
  viewAllLink: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "500",
  },
  fuelStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
  },
  fuelStatItem: {
    alignItems: "center",
    flex: 1,
  },
  fuelStatIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 8,
  },
  fuelStatValue: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#1f2937",
  },
  fuelStatLabel: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
  },
  fuelStatDivider: {
    width: 1,
    height: 60,
    backgroundColor: "#e5e7eb",
  },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  txRowText: {
    marginLeft: 8,
    fontSize: 13,
    color: "#6b7280",
    fontWeight: "500",
  },

  // ─── Quick Actions ───────────────────────────────────────────
  quickActionsSection: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 12,
  },
  groupContainer: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  groupLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9ca3af",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 10,
  },
  groupLabelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  quickTileRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  quickTile: {
    alignItems: "center",
    width: 78,
  },
  quickTileIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
  },
  quickTileName: {
    fontSize: 12,
    fontWeight: "500",
    color: "#374151",
    textAlign: "center",
    minHeight: 30,
  },
  tileBadge: {
    backgroundColor: "#fef3c7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    marginTop: 2,
  },
  tileBadgeText: {
    fontSize: 8,
    fontWeight: "600",
    color: "#92400e",
  },

  // ─── Live Data Toggle ────────────────────────────────────────
  liveDataToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  liveDataLabel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6b7280",
  },
  liveDot: {
    position: "absolute",
    top: 2,
    right: 2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#22c55e",
    borderWidth: 1.5,
    borderColor: "white",
  },

  // ─── Recent Transaction Hub ──────────────────────────────────
  recentSection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  seeMoreText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "500",
  },
  recentLoading: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  loadingText: {
    fontSize: 13,
    color: "#6b7280",
  },
  recentEmpty: {
    alignItems: "center",
    paddingVertical: 24,
    gap: 8,
  },
  emptyText: {
    fontSize: 13,
    color: "#9ca3af",
  },
  recentList: {},
  txItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  txItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: {
    flex: 1,
  },
  txReason: {
    fontSize: 13,
    fontWeight: "600",
    color: "#1f2937",
  },
  txTank: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  txRight: {
    alignItems: "flex-end",
  },
  txVolume: {
    fontSize: 13,
    fontWeight: "600",
  },
  txDate: {
    fontSize: 10,
    color: "#9ca3af",
    marginTop: 2,
  },
});

export default HomeScreen;
