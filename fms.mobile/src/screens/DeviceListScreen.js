import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import {
  fetchDevicesBySite,
  fetchDeviceList,
} from "../redux/slices/deviceSlice";
import signalRService from "../services/signalRService";

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
};

const DeviceListScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { ptsDeviceList, connectionStatuses, isLoading, error } = useSelector(
    (state) => state.device
  );
  const [refreshing, setRefreshing] = useState(false);
  const [defaultSite, setDefaultSite] = useState(null);

  // Load saved site and fetch devices on mount
  useEffect(() => {
    loadSavedSiteAndFetchDevices();
  }, []);

  // Start SignalR connection and request device status when screen mounts
  useEffect(() => {
    const initSignalR = async () => {
      try {
        // Start SignalR if not already connected
        if (!signalRService.isConnected()) {
          await signalRService.start();
        } else {
          // If already connected, request fresh status
          await signalRService.requestDeviceStatusSummary();
        }
      } catch (error) {
        console.log("[DeviceListScreen] SignalR connection error:", error);
      }
    };

    initSignalR();
  }, []);

  const loadSavedSiteAndFetchDevices = async () => {
    try {
      const savedSite = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_SITE);
      if (savedSite) {
        const site = JSON.parse(savedSite);
        setDefaultSite(site);
        // Fetch devices for the selected site
        dispatch(fetchDevicesBySite(site.id));
      } else {
        // If no site selected, fetch all devices (fallback)
        dispatch(fetchDeviceList());
      }
    } catch (err) {
      console.error("Error loading site:", err);
      // Fallback to fetching all devices
      dispatch(fetchDeviceList());
    }
  };

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadSavedSiteAndFetchDevices();
    // Also refresh SignalR device status
    try {
      if (signalRService.isConnected()) {
        await signalRService.requestDeviceStatusSummary();
      }
    } catch (error) {
      console.log("[DeviceListScreen] Error refreshing SignalR status:", error);
    }
    setRefreshing(false);
  }, []);

  const handleDevicePress = (device) => {
    navigation.navigate("FuelingProcess", {
      ptsId: device.ptsid || device.id?.toString(),
      siteId: device.site || defaultSite?.id,
      deviceName: device.ptsName || device.name || `PTS ${device.ptsid}`,
    });
  };

  /**
   * Determine device online status
   * Priority: SignalR connection status > API device data
   * @param {object} device - Device object from API
   * @returns {string} Status: "online", "offline", or "idle"
   */
  const getDeviceStatus = (device) => {
    // Get device ID (handle different property names)
    const deviceId = device.ptsid || device.id?.toString();

    // First check SignalR-based connection status (most reliable for real-time)
    if (deviceId && connectionStatuses[deviceId]) {
      const connStatus = connectionStatuses[deviceId];
      if (connStatus.isConnected || connStatus.status === "online") {
        return "online";
      }
      if (connStatus.status === "idle") {
        return "idle";
      }
      // If we have explicit SignalR status, use it
      if (connStatus.status) {
        return connStatus.status;
      }
    }

    // Fallback to API device data (less reliable for real-time status)
    if (device.isOnline !== undefined) {
      return device.isOnline ? "online" : "offline";
    }
    if (device.status) {
      return device.status.toLowerCase();
    }

    // Default to offline if no status information
    return "offline";
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "online":
        return "#10b981"; // Green
      case "offline":
        return "#ef4444"; // Red
      case "idle":
        return "#f59e0b"; // Orange/Amber
      case "busy":
        return "#f59e0b"; // Orange/Amber
      default:
        return "#6b7280"; // Gray
    }
  };

  // Format device ID for display - show shorter version if no name
  const formatDeviceId = (ptsid) => {
    if (!ptsid) return "Unknown";
    const id = ptsid.toString();
    // Show last 8 characters for long IDs
    if (id.length > 12) {
      return `...${id.slice(-8)}`;
    }
    return id;
  };

  const renderDeviceItem = ({ item }) => {
    const status = getDeviceStatus(item);
    const siteName =
      item.siteNavigation?.name || defaultSite?.name || "Unknown Site";
    const deviceId = item.ptsid || item.id?.toString();
    const hasName = !!(item.ptsName || item.name);
    const displayName =
      item.ptsName || item.name || `PTS ${formatDeviceId(deviceId)}`;

    return (
      <TouchableOpacity
        style={styles.deviceCard}
        onPress={() => handleDevicePress(item)}
      >
        <View style={styles.deviceHeader}>
          <View style={styles.deviceInfo}>
            <Icon name="gas-pump" size={24} color="#2563eb" />
            <View style={styles.deviceDetails}>
              <Text style={styles.deviceName}>{displayName}</Text>
              {hasName && deviceId && (
                <Text style={styles.deviceId}>ID: {deviceId}</Text>
              )}
              <Text style={styles.deviceLocation}>
                <Icon name="map-marker-alt" size={12} color="#6b7280" />{" "}
                {siteName}
              </Text>
            </View>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: getStatusColor(status) + "20" },
            ]}
          >
            <View
              style={[
                styles.statusDot,
                { backgroundColor: getStatusColor(status) },
              ]}
            />
            <Text
              style={[styles.statusText, { color: getStatusColor(status) }]}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </Text>
          </View>
        </View>

        <View style={styles.deviceStats}>
          <View style={styles.statItem}>
            <Icon name="tint" size={14} color="#6b7280" />
            <Text style={styles.statText}>{item.pumpCount || 0} Pumps</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderEmptyList = () => (
    <View style={styles.emptyContainer}>
      {!defaultSite ? (
        <>
          <Icon name="map-marker-alt" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No site selected</Text>
          <Text style={styles.emptySubtext}>
            Go to Settings to select a default site
          </Text>
          <TouchableOpacity
            style={styles.selectSiteButton}
            onPress={() =>
              navigation.navigate("MainTabs", { screen: "Settings" })
            }
          >
            <Text style={styles.selectSiteButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </>
      ) : (
        <>
          <Icon name="gas-pump" size={60} color="#d1d5db" />
          <Text style={styles.emptyText}>No devices found</Text>
          <Text style={styles.emptySubtext}>
            No PTS devices found for {defaultSite.name}
          </Text>
        </>
      )}
    </View>
  );

  if (isLoading && ptsDeviceList.length === 0) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563eb" />
        <Text style={styles.loadingText}>Loading devices...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Site Header */}
      <View style={styles.welcomeHeader}>
        {defaultSite ? (
          <>
            <View style={styles.siteHeaderRow}>
              <Icon name="map-marker-alt" size={16} color="#2563eb" />
              <Text style={styles.siteNameText}>{defaultSite.name}</Text>
            </View>
            <Text style={styles.welcomeSubtext}>
              {ptsDeviceList.length} device
              {ptsDeviceList.length !== 1 ? "s" : ""} available
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.welcomeText}>All Devices</Text>
            <Text style={styles.welcomeSubtext}>
              Select a site in Settings for filtered view
            </Text>
          </>
        )}
      </View>

      {/* Device List */}
      <FlatList
        data={ptsDeviceList}
        keyExtractor={(item) =>
          (item.ptsid || item.id || Math.random()).toString()
        }
        renderItem={renderDeviceItem}
        ListEmptyComponent={renderEmptyList}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={["#2563eb"]}
          />
        }
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  welcomeHeader: {
    backgroundColor: "#1f2937",
    padding: 16,
    paddingTop: 8,
  },
  welcomeText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "white",
  },
  welcomeSubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 4,
  },
  listContainer: {
    padding: 16,
    flexGrow: 1,
  },
  deviceCard: {
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
  deviceHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  deviceInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    marginRight: 8,
  },
  deviceDetails: {
    marginLeft: 12,
    flex: 1,
  },
  deviceName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  deviceId: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 1,
  },
  deviceLocation: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    flexShrink: 0,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500",
  },
  deviceStats: {
    flexDirection: "row",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 20,
  },
  statText: {
    fontSize: 12,
    color: "#6b7280",
    marginLeft: 6,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#6b7280",
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  selectSiteButton: {
    marginTop: 16,
    backgroundColor: "#2563eb",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectSiteButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 14,
  },
  siteHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  siteNameText: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginLeft: 8,
  },
});

export default DeviceListScreen;
