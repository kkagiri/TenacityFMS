import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  Alert,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import { fetchTanksBySite } from "../../redux/slices/tankSlice";
import { fetchSiteList } from "../../redux/slices/siteSlice";

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
  DEFAULT_PTS: "fms_default_pts",
};

const ManageStocksScreen = ({ navigation }) => {
  const dispatch = useDispatch();

  // Redux state
  const { filteredTanks, isLoading: tanksLoading } = useSelector(
    (state) => state.tank
  );
  const { sites } = useSelector((state) => state.site);

  // Local state
  const [defaultSite, setDefaultSite] = useState(null);
  const [defaultPTS, setDefaultPTS] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Load saved defaults and fetch data
  useEffect(() => {
    loadDefaults();
  }, []);

  // Fetch tanks when default site changes
  useEffect(() => {
    if (defaultSite?.id) {
      dispatch(fetchTanksBySite(defaultSite.id));
    }
  }, [defaultSite, dispatch]);

  const loadDefaults = async () => {
    try {
      const savedSite = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_SITE);
      const savedPTS = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_PTS);

      if (savedSite) {
        const site = JSON.parse(savedSite);
        setDefaultSite(site);
      }
      if (savedPTS) {
        setDefaultPTS(JSON.parse(savedPTS));
      }

      dispatch(fetchSiteList());
    } catch (error) {
      console.error("Error loading defaults:", error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDefaults();
    if (defaultSite?.id) {
      await dispatch(fetchTanksBySite(defaultSite.id));
    }
    setRefreshing(false);
  };

  const handleOpenStock = () => {
    if (!defaultSite) {
      Alert.alert(
        "Select Site First",
        "Please go to Settings and select a default site before recording opening stock.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => navigation.navigate("Settings"),
          },
        ]
      );
      return;
    }
    navigation.navigate("OpenStock", {
      siteId: defaultSite.id,
      siteName: defaultSite.name,
      stockType: "opening",
    });
  };

  const handleClosingStock = () => {
    if (!defaultSite) {
      Alert.alert(
        "Select Site First",
        "Please go to Settings and select a default site before recording closing stock.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => navigation.navigate("Settings"),
          },
        ]
      );
      return;
    }
    navigation.navigate("OpenStock", {
      siteId: defaultSite.id,
      siteName: defaultSite.name,
      stockType: "closing",
    });
  };

  const handleManualRefill = () => {
    if (!defaultSite) {
      Alert.alert(
        "Select Site First",
        "Please go to Settings and select a default site before recording manual refills.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => navigation.navigate("Settings"),
          },
        ]
      );
      return;
    }
    navigation.navigate("ManualRefill", {
      siteId: defaultSite.id,
      siteName: defaultSite.name,
    });
  };

  const handleTankDelivery = () => {
    if (!defaultSite) {
      Alert.alert(
        "Select Site First",
        "Please go to Settings and select a default site before recording deliveries.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => navigation.navigate("Settings"),
          },
        ]
      );
      return;
    }
    navigation.navigate("TankDelivery", {
      siteId: defaultSite.id,
      siteName: defaultSite.name,
    });
  };

  const handleTankTransfer = () => {
    if (!defaultSite) {
      Alert.alert(
        "Select Site First",
        "Please go to Settings and select a default site before recording transfers.",
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Go to Settings",
            onPress: () => navigation.navigate("Settings"),
          },
        ]
      );
      return;
    }
    navigation.navigate("TankTransfer", {
      siteId: defaultSite.id,
      siteName: defaultSite.name,
    });
  };

  const renderActionCard = (title, description, icon, color, onPress) => (
    <TouchableOpacity
      style={[styles.actionCard, { borderLeftColor: color }]}
      onPress={onPress}
    >
      <View style={[styles.iconContainer, { backgroundColor: color + "15" }]}>
        <Icon name={icon} size={28} color={color} />
      </View>
      <View style={styles.actionTextContainer}>
        <Text style={styles.actionTitle}>{title}</Text>
        <Text style={styles.actionDescription}>{description}</Text>
      </View>
      <Icon name="chevron-right" size={18} color="#9ca3af" />
    </TouchableOpacity>
  );

  const getSiteName = () => {
    if (defaultSite?.name) return defaultSite.name;
    return "Not configured";
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Current Configuration */}
      <View style={styles.configSection}>
        <Text style={styles.sectionTitle}>Current Configuration</Text>
        <View style={styles.configCard}>
          <View style={styles.configRow}>
            <Icon name="map-marker-alt" size={18} color="#2563eb" />
            <Text style={styles.configLabel}>Site:</Text>
            <Text
              style={[
                styles.configValue,
                !defaultSite && styles.configValueEmpty,
              ]}
            >
              {getSiteName()}
            </Text>
          </View>
          <View style={styles.configRow}>
            <Icon name="gas-pump" size={18} color="#2563eb" />
            <Text style={styles.configLabel}>PTS Device:</Text>
            <Text
              style={[
                styles.configValue,
                !defaultPTS && styles.configValueEmpty,
              ]}
            >
              {defaultPTS?.ptsid || "Not configured"}
            </Text>
          </View>
          {!defaultSite && (
            <TouchableOpacity
              style={styles.configureButton}
              onPress={() => navigation.navigate("Settings")}
            >
              <Icon name="cog" size={14} color="#2563eb" />
              <Text style={styles.configureButtonText}>
                Configure in Settings
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stock Actions */}
      <View style={styles.actionsSection}>
        <Text style={styles.sectionTitle}>Stock Operations</Text>

        {renderActionCard(
          "Opening Stock",
          "Record the opening stock for tanks at the start of day",
          "door-open",
          "#10b981",
          handleOpenStock
        )}

        {renderActionCard(
          "Closing Stock",
          "Record the closing stock for tanks at end of day",
          "door-closed",
          "#6366f1",
          handleClosingStock
        )}

        {renderActionCard(
          "Manual Refill",
          "Record manual fuel refills for vehicles",
          "gas-pump",
          "#f59e0b",
          handleManualRefill
        )}

        {renderActionCard(
          "Tank Delivery",
          "Record fuel deliveries from suppliers",
          "truck-loading",
          "#10b981",
          handleTankDelivery
        )}

        {renderActionCard(
          "Tank Transfer",
          "Transfer fuel between tanks",
          "exchange-alt",
          "#8b5cf6",
          handleTankTransfer
        )}
      </View>

      {/* Tank Summary */}
      {defaultSite && filteredTanks?.length > 0 && (
        <View style={styles.tankSection}>
          <Text style={styles.sectionTitle}>Tanks at {defaultSite.name}</Text>
          {filteredTanks.map((tank) => (
            <View key={tank.id} style={styles.tankCard}>
              <View style={styles.tankIconContainer}>
                <Icon name="database" size={20} color="#6366f1" />
              </View>
              <View style={styles.tankInfo}>
                <Text style={styles.tankName}>{tank.name}</Text>
                <Text style={styles.tankDetails}>
                  Capacity: {tank.capacity?.toLocaleString() || "N/A"} L
                </Text>
                {tank.productName && (
                  <Text style={styles.tankProduct}>{tank.productName}</Text>
                )}
              </View>
            </View>
          ))}
        </View>
      )}

      {/* No site configured message */}
      {!defaultSite && (
        <View style={styles.emptyState}>
          <Icon name="exclamation-circle" size={48} color="#9ca3af" />
          <Text style={styles.emptyStateTitle}>No Site Configured</Text>
          <Text style={styles.emptyStateText}>
            Please configure a default site in Settings to manage tank stocks.
          </Text>
          <TouchableOpacity
            style={styles.settingsButton}
            onPress={() => navigation.navigate("Settings")}
          >
            <Icon name="cog" size={16} color="white" />
            <Text style={styles.settingsButtonText}>Go to Settings</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  configSection: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  configCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  configRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  configLabel: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
    width: 80,
  },
  configValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
    flex: 1,
  },
  configValueEmpty: {
    color: "#9ca3af",
    fontStyle: "italic",
  },
  configureButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  configureButtonText: {
    fontSize: 14,
    color: "#2563eb",
    marginLeft: 6,
  },
  actionsSection: {
    padding: 16,
    paddingTop: 0,
  },
  actionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  actionTextContainer: {
    flex: 1,
    marginLeft: 12,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  actionDescription: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  tankSection: {
    padding: 16,
    paddingTop: 0,
  },
  tankCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  tankIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    alignItems: "center",
    justifyContent: "center",
  },
  tankInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tankName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  tankDetails: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  tankProduct: {
    fontSize: 12,
    color: "#2563eb",
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    marginTop: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyStateText: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  settingsButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2563eb",
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 20,
  },
  settingsButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
});

export default ManageStocksScreen;
