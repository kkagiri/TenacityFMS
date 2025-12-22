import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Icon from "react-native-vector-icons/FontAwesome5";
import { logoutUser } from "../redux/slices/authSlice";
import { fetchSiteList } from "../redux/slices/siteSlice";
import { fetchDeviceList } from "../redux/slices/deviceSlice";

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
  DEFAULT_PTS: "fms_default_pts",
};

const SettingsScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { sites, isLoading: sitesLoading } = useSelector((state) => state.site);
  const { ptsDeviceList, isLoading: devicesLoading } = useSelector(
    (state) => state.device
  );

  // Default selections
  const [defaultSite, setDefaultSite] = useState(null);
  const [defaultPTS, setDefaultPTS] = useState(null);
  const [showSiteModal, setShowSiteModal] = useState(false);
  const [showPTSModal, setShowPTSModal] = useState(false);
  const [filteredDevices, setFilteredDevices] = useState([]);

  // Load saved defaults on mount
  useEffect(() => {
    loadSavedDefaults();
    dispatch(fetchSiteList());
    dispatch(fetchDeviceList());
  }, [dispatch]);

  // Filter PTS devices when site changes
  useEffect(() => {
    if (defaultSite && ptsDeviceList?.length > 0) {
      const filtered = ptsDeviceList.filter(
        (device) => device.site === defaultSite.id
      );
      setFilteredDevices(filtered);
      // Clear PTS selection if it doesn't belong to new site
      if (defaultPTS && defaultPTS.site !== defaultSite.id) {
        setDefaultPTS(null);
        AsyncStorage.removeItem(STORAGE_KEYS.DEFAULT_PTS);
      }
    } else {
      setFilteredDevices([]);
    }
  }, [defaultSite, ptsDeviceList]);

  const loadSavedDefaults = async () => {
    try {
      const savedSite = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_SITE);
      const savedPTS = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_PTS);

      if (savedSite) {
        setDefaultSite(JSON.parse(savedSite));
      }
      if (savedPTS) {
        setDefaultPTS(JSON.parse(savedPTS));
      }
    } catch (error) {
      console.error("Error loading saved defaults:", error);
    }
  };

  const saveDefaultSite = async (site) => {
    try {
      await AsyncStorage.setItem(
        STORAGE_KEYS.DEFAULT_SITE,
        JSON.stringify(site)
      );
      setDefaultSite(site);
      setShowSiteModal(false);
    } catch (error) {
      console.error("Error saving default site:", error);
      Alert.alert("Error", "Failed to save default site");
    }
  };

  const saveDefaultPTS = async (pts) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.DEFAULT_PTS, JSON.stringify(pts));
      setDefaultPTS(pts);
      setShowPTSModal(false);
    } catch (error) {
      console.error("Error saving default PTS:", error);
      Alert.alert("Error", "Failed to save default PTS device");
    }
  };

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Logout",
        style: "destructive",
        onPress: () => dispatch(logoutUser()),
      },
    ]);
  };

  const renderMenuItem = (
    icon,
    title,
    onPress,
    color = "#374151",
    rightText = null
  ) => (
    <TouchableOpacity style={styles.menuItem} onPress={onPress}>
      <Icon name={icon} size={20} color={color} />
      <Text style={[styles.menuText, { color }]}>{title}</Text>
      {rightText && (
        <Text style={styles.menuRightText} numberOfLines={1}>
          {rightText}
        </Text>
      )}
      <Icon name="chevron-right" size={16} color="#9ca3af" />
    </TouchableOpacity>
  );

  const renderSelectionModal = (
    visible,
    onClose,
    title,
    data,
    onSelect,
    isLoading,
    emptyText
  ) => (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.modalCloseButton}>
              <Icon name="times" size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : data?.length > 0 ? (
            <FlatList
              data={data}
              keyExtractor={(item) => item.id?.toString() || item.ptsid}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.selectionItem}
                  onPress={() => onSelect(item)}
                >
                  <View style={styles.selectionItemContent}>
                    <Icon
                      name={
                        title.includes("Site") ? "map-marker-alt" : "gas-pump"
                      }
                      size={20}
                      color="#2563eb"
                    />
                    <View style={styles.selectionItemText}>
                      <Text style={styles.selectionItemTitle}>
                        {item.name || item.ptsid}
                      </Text>
                      {item.description && (
                        <Text style={styles.selectionItemSubtitle}>
                          {item.description}
                        </Text>
                      )}
                      {item.ipaddress && (
                        <Text style={styles.selectionItemSubtitle}>
                          IP: {item.ipaddress}
                        </Text>
                      )}
                    </View>
                  </View>
                  <Icon name="chevron-right" size={16} color="#9ca3af" />
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="inbox" size={40} color="#9ca3af" />
              <Text style={styles.emptyText}>{emptyText}</Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollView style={styles.container}>
      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <View style={styles.profileInfo}>
          <Icon name="user-circle" size={60} color="#2563eb" />
          <View style={styles.userDetails}>
            <Text style={styles.userName}>{user?.name || user?.username}</Text>
            <Text style={styles.userEmail}>{user?.email}</Text>
          </View>
        </View>
      </View>

      {/* Default Configuration Section */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Default Configuration</Text>
        {renderMenuItem(
          "map-marker-alt",
          "Default Site",
          () => setShowSiteModal(true),
          "#374151",
          defaultSite?.name || "Not set"
        )}
        {renderMenuItem(
          "gas-pump",
          "Default PTS Device",
          () => {
            if (!defaultSite) {
              Alert.alert(
                "Select Site First",
                "Please select a default site before selecting a PTS device."
              );
              return;
            }
            setShowPTSModal(true);
          },
          "#374151",
          defaultPTS?.ptsid || "Not set"
        )}
      </View>

      {/* Account Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Account</Text>
        {renderMenuItem("user-cog", "Profile Settings", () => {})}
        {renderMenuItem("bell", "Notifications", () => {})}
        {renderMenuItem("shield-alt", "Security", () => {})}
      </View>

      {/* App Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>App</Text>
        {renderMenuItem("clipboard-list", "Manage Stocks", () =>
          navigation.navigate("ManageStocks")
        )}
        {renderMenuItem("download", "Offline Data", () => {})}
        {renderMenuItem("info-circle", "About", () => {})}
      </View>

      {/* Support Menu */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>Support</Text>
        {renderMenuItem("question-circle", "Help & Support", () => {})}
        {renderMenuItem("bug", "Report Issue", () => {})}
      </View>

      {/* Logout Button */}
      <View style={styles.logoutSection}>
        {renderMenuItem("sign-out-alt", "Logout", handleLogout, "#dc2626")}
      </View>

      {/* App Info */}
      <View style={styles.appInfo}>
        <Text style={styles.appVersion}>Hyoung FMS v1.0.0</Text>
        <Text style={styles.copyright}>© 2024 Hyoung FMS</Text>
      </View>

      {/* Site Selection Modal */}
      {renderSelectionModal(
        showSiteModal,
        () => setShowSiteModal(false),
        "Select Default Site",
        sites,
        saveDefaultSite,
        sitesLoading,
        "No sites available"
      )}

      {/* PTS Selection Modal */}
      {renderSelectionModal(
        showPTSModal,
        () => setShowPTSModal(false),
        "Select Default PTS Device",
        filteredDevices,
        saveDefaultPTS,
        devicesLoading,
        defaultSite ? "No PTS devices for this site" : "Select a site first"
      )}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  profileSection: {
    backgroundColor: "white",
    padding: 20,
    marginBottom: 20,
  },
  profileInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#1f2937",
  },
  userEmail: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  menuSection: {
    backgroundColor: "white",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    padding: 16,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  menuText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  menuRightText: {
    fontSize: 14,
    color: "#6b7280",
    maxWidth: 120,
    marginRight: 8,
  },
  logoutSection: {
    backgroundColor: "white",
    marginBottom: 20,
  },
  appInfo: {
    alignItems: "center",
    paddingVertical: 20,
  },
  appVersion: {
    fontSize: 14,
    color: "#9ca3af",
  },
  copyright: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 4,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    minHeight: "40%",
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
  modalCloseButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
  },
  selectionItemContent: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectionItemText: {
    marginLeft: 12,
    flex: 1,
  },
  selectionItemTitle: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  selectionItemSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default SettingsScreen;
