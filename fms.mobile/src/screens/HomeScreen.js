import React, { useEffect, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  Dimensions,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import { fetchDevicesBySite } from "../redux/slices/deviceSlice";
import { fetchTanks } from "../redux/slices/tankSlice";
import apiService from "../services/apiService";
import signalRService from "../services/signalRService";

const { width } = Dimensions.get("window");
const isSmallScreen = width < 380;

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
};

const HomeScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const deviceState = useSelector((state) => state.device);
  // Defensive fallback: ensure ptsDeviceList is always an array
  const ptsDeviceList = Array.isArray(deviceState?.ptsDeviceList)
    ? deviceState.ptsDeviceList
    : [];
  const connectionStatuses = deviceState?.connectionStatuses || {};
  const isLoading = deviceState?.isLoading || false;

  const [defaultSite, setDefaultSite] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [todayTransactionCount, setTodayTransactionCount] = useState(0);

  // Tank state for fuel summary
  const { tanks } = useSelector((state) => state.tank);

  // Calculate fuel stats from tanks
  const fuelStats = useMemo(() => {
    const totalCapacity = tanks.reduce(
      (sum, t) => sum + (t.tankVolume || t.capacity || 0),
      0
    );
    const totalStock = tanks.reduce(
      (sum, t) => sum + (t.currentStock ?? t.currentVolume ?? 0),
      0
    );
    const percentFull =
      totalCapacity > 0 ? Math.round((totalStock / totalCapacity) * 100) : 0;
    return { totalCapacity, totalStock, percentFull };
  }, [tanks]);

  // Format volume for display
  const formatVolume = (volume) => {
    if (volume >= 1000000) return `${(volume / 1000000).toFixed(1)}M`;
    if (volume >= 1000) return `${(volume / 1000).toFixed(0)}K`;
    return Math.round(volume).toLocaleString();
  };

  // Get display name from user object - handle both PascalCase and camelCase
  const displayName =
    user?.FullName ||
    user?.fullName ||
    user?.UserName ||
    user?.userName ||
    user?.username ||
    user?.name ||
    "User";

  // Menu items configuration
  const menuItems = [
    {
      id: "fueling",
      name: "Fueling",
      icon: "gas-pump",
      color: "#2563eb",
      description: "Start fueling process",
      onPress: () => navigation.navigate("Devices"),
    },
    {
      id: "vehicleDetails",
      name: "Vehicle Details",
      icon: "car",
      color: "#0891b2",
      description: "Search & view vehicle info",
      onPress: () => navigation.navigate("VehicleDetails"),
    },
    {
      id: "sites",
      name: "Sites",
      icon: "map-marker-alt",
      color: "#8b5cf6",
      description: "View all sites & tanks",
      onPress: () => navigation.navigate("SiteOverview"),
    },
    {
      id: "transactions",
      name: "Transactions",
      icon: "history",
      color: "#10b981",
      description: "View pump transactions",
      onPress: () => navigation.navigate("History"),
    },
    {
      id: "transactionHub",
      name: "Transaction Hub",
      icon: "exchange-alt",
      color: "#f59e0b",
      description: "Tank volume history",
      onPress: () => navigation.navigate("TankTransactionHub"),
    },
    {
      id: "stocks",
      name: "Stock Management",
      icon: "warehouse",
      color: "#059669",
      description: "Manage tank stocks",
      onPress: () => navigation.navigate("ManageStocks"),
    },
    {
      id: "settings",
      name: "Settings",
      icon: "cog",
      color: "#6b7280",
      description: "App configuration",
      onPress: () => navigation.navigate("Settings"),
    },
  ];

  // Load saved site on mount
  useEffect(() => {
    loadSavedSite();
    dispatch(fetchTanks());
    fetchTodayTransactions();
  }, []);

  // Fetch today's transaction count from TankVolumeHistory (same as Transaction Hub)
  const fetchTodayTransactions = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Use TankVolumeHistory API (same source as Transaction Hub)
      const response = await apiService.getTankVolumeHistory({
        startDate: today.toISOString(),
        endDate: tomorrow.toISOString(),
        take: 1000,
      });
      // Response is an array of transactions
      const transactions = Array.isArray(response) ? response : [];
      setTodayTransactionCount(transactions.length);
    } catch (error) {
      console.error("Failed to fetch today's transactions:", error);
    }
  };

  // Fetch devices when site changes
  useEffect(() => {
    if (defaultSite?.id) {
      dispatch(fetchDevicesBySite(defaultSite.id));
    }
  }, [defaultSite, dispatch]);

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

  const onRefresh = async () => {
    setRefreshing(true);
    await loadSavedSite();
    dispatch(fetchTanks());
    await fetchTodayTransactions();
    if (defaultSite?.id) {
      await dispatch(fetchDevicesBySite(defaultSite.id));
    }
    // Also refresh SignalR device status
    try {
      if (signalRService.isConnected()) {
        await signalRService.requestDeviceStatusSummary();
      }
    } catch (error) {
      console.log("[HomeScreen] Error refreshing SignalR status:", error);
    }
    setRefreshing(false);
  };

  /**
   * Check if a device is online using SignalR status first, then API data
   * @param {object} device - Device object
   * @returns {boolean} True if device is online
   */
  const isDeviceOnline = (device) => {
    const deviceId = device.ptsid || device.id?.toString();
    // Check SignalR-based connection status first (most reliable)
    if (deviceId && connectionStatuses[deviceId]) {
      const connStatus = connectionStatuses[deviceId];
      return connStatus.isConnected || connStatus.status === "online";
    }
    // Fallback to API device data
    return device.isOnline === true;
  };

  // Calculate online devices count using SignalR status
  const onlineDevices = ptsDeviceList?.filter(isDeviceOnline)?.length || 0;
  const totalDevices = ptsDeviceList?.length || 0;

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

        {/* Site Badge */}
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
          <TouchableOpacity onPress={() => navigation.navigate("SiteOverview")}>
            <Text style={styles.viewAllLink}>View All</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.fuelStatsRow}>
          <View style={styles.fuelStatItem}>
            <View style={[styles.fuelStatIcon, { backgroundColor: "#dcfce7" }]}>
              <Icon name="gas-pump" size={18} color="#22c55e" />
            </View>
            <Text style={styles.fuelStatValue}>
              {formatVolume(fuelStats.totalStock)} L
            </Text>
            <Text style={styles.fuelStatLabel}>Available</Text>
          </View>
          <View style={styles.fuelStatDivider} />
          <View style={styles.fuelStatItem}>
            <View style={[styles.fuelStatIcon, { backgroundColor: "#e0e7ff" }]}>
              <Icon name="tachometer-alt" size={18} color="#6366f1" />
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
            <Text style={styles.fuelStatLabel}>Capacity</Text>
          </View>
          <View style={styles.fuelStatDivider} />
          <View style={styles.fuelStatItem}>
            <View style={[styles.fuelStatIcon, { backgroundColor: "#fef3c7" }]}>
              <Icon name="exchange-alt" size={18} color="#f59e0b" />
            </View>
            <Text style={styles.fuelStatValue}>{todayTransactionCount}</Text>
            <Text style={styles.fuelStatLabel}>Today's Tx</Text>
          </View>
        </View>
      </View>

      {/* Device Stats Card */}
      <View style={styles.statsCard}>
        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#dcfce7" }]}>
            <Icon name="gas-pump" size={18} color="#22c55e" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{onlineDevices}</Text>
            <Text style={styles.statLabel}>Online Devices</Text>
          </View>
        </View>

        <View style={styles.statDivider} />

        <View style={styles.statItem}>
          <View style={[styles.statIcon, { backgroundColor: "#e0e7ff" }]}>
            <Icon name="server" size={18} color="#6366f1" />
          </View>
          <View style={styles.statInfo}>
            <Text style={styles.statValue}>{totalDevices}</Text>
            <Text style={styles.statLabel}>Total Devices</Text>
          </View>
        </View>
      </View>

      {/* Menu Grid */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <View style={styles.menuGrid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.id}
              style={styles.menuItem}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={styles.menuIconContainer}>
                <Icon name={item.icon} size={26} color={item.color} />
              </View>
              <Text style={styles.menuName}>{item.name}</Text>
              <Text style={styles.menuDescription}>{item.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Recent Activity Section (placeholder for future) */}
      <View style={styles.activitySection}>
        <View style={styles.activityHeader}>
          <Text style={styles.sectionTitle}>Device Status</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Devices")}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>

        {!defaultSite ? (
          <View style={styles.emptyState}>
            <Icon name="map-marker-alt" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>Select a site in Settings</Text>
            <Text style={styles.emptySubtext}>to see your PTS devices</Text>
          </View>
        ) : isLoading ? (
          <View style={styles.loadingState}>
            <Text style={styles.loadingText}>Loading devices...</Text>
          </View>
        ) : ptsDeviceList?.length === 0 ? (
          <View style={styles.emptyState}>
            <Icon name="gas-pump" size={40} color="#d1d5db" />
            <Text style={styles.emptyText}>No devices found</Text>
            <Text style={styles.emptySubtext}>for the selected site</Text>
          </View>
        ) : (
          <View style={styles.deviceList}>
            {ptsDeviceList.slice(0, 3).map((device) => {
              const online = isDeviceOnline(device);
              return (
                <TouchableOpacity
                  key={device.ptsid || device.id}
                  style={styles.deviceItem}
                  onPress={() =>
                    navigation.navigate("FuelingProcess", {
                      ptsId: device.ptsid,
                      deviceName: device.name || `Device ${device.ptsid}`,
                    })
                  }
                >
                  <View
                    style={[
                      styles.deviceStatus,
                      {
                        backgroundColor: online ? "#22c55e" : "#ef4444",
                      },
                    ]}
                  />
                  <View style={styles.deviceInfo}>
                    <Text style={styles.deviceName}>
                      {device.name || `PTS ${device.ptsid}`}
                    </Text>
                    <Text style={styles.deviceSubtext}>
                      {online ? "Online" : "Offline"} • {device.pumpCount || 0}{" "}
                      pumps
                    </Text>
                  </View>
                  <Icon name="chevron-right" size={14} color="#9ca3af" />
                </TouchableOpacity>
              );
            })}
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
    marginBottom: 20,
  },
  welcomeSection: {
    marginBottom: 12,
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
  statsCard: {
    flexDirection: "row",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  statIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statInfo: {
    marginLeft: 12,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1f2937",
  },
  statLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  statDivider: {
    width: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 12,
  },
  menuSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 16,
  },
  menuGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  menuItem: {
    width: "48%",
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  menuIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f5f5f5",
    marginBottom: 10,
  },
  menuName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1f2937",
    textAlign: "center",
  },
  menuDescription: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 4,
    textAlign: "center",
  },
  activitySection: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  activityHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 13,
    color: "#2563eb",
    fontWeight: "500",
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  loadingState: {
    alignItems: "center",
    paddingVertical: 32,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  deviceList: {
    marginTop: -8,
  },
  deviceItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  deviceStatus: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  deviceInfo: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  deviceSubtext: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
});

export default HomeScreen;
