/**
 * File: VehicleTrackingScreen.js
 * Purpose: Main vehicle tracking page with two tabs:
 *   1. Dashboard - Summary cards (active, moving, parked) with searchable vehicle list
 *   2. Live Map  - Embedded Google Maps with live vehicle markers via SignalR
 *
 * Data flows: GPSGate -> RabbitMQ -> GPSGateRabbitMQConsumerService -> VehicleTrackingHub (SignalR) -> this screen
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

import VehicleDashboard from "../../components/vehicle/VehicleDashboard";
import VehicleLiveMap from "../../components/vehicle/VehicleLiveMap";
import { useVehicleTracking } from "../../hooks/useVehicleTracking";

const TABS = [
  { key: "dashboard", title: "Dashboard", icon: "tachometer-alt" },
  { key: "map", title: "Live Map", icon: "map-marked-alt" },
];

const VehicleTrackingScreen = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Connect to vehicle tracking SignalR hub
  const { connectionState, isConnected, refreshData } = useVehicleTracking({
    enabled: true,
  });

  const handleSelectVehicle = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
    // If selecting a vehicle from dashboard, switch to map tab
    if (vehicle) {
      setActiveTab("map");
    }
  }, []);

  const handleBackPress = () => {
    if (selectedVehicle && activeTab === "map") {
      setSelectedVehicle(null);
    } else {
      navigation.goBack();
    }
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case "dashboard":
        return (
          <VehicleDashboard
            onSelectVehicle={handleSelectVehicle}
            isConnected={isConnected}
          />
        );
      case "map":
        return (
          <VehicleLiveMap
            selectedVehicle={selectedVehicle}
            onSelectVehicle={setSelectedVehicle}
          />
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-left" size={18} color="white" />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Vehicle Tracking</Text>
          <View style={styles.headerSubRow}>
            <View
              style={[
                styles.connectionDot,
                { backgroundColor: isConnected ? "#10b981" : "#f59e0b" },
              ]}
            />
            <Text style={styles.headerSubtitle}>
              {isConnected ? "Live" : connectionState}
            </Text>
          </View>
        </View>
        <TouchableOpacity style={styles.refreshButton} onPress={refreshData}>
          <Icon name="sync-alt" size={14} color="white" />
        </TouchableOpacity>
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab.key}
            style={[
              styles.tabItem,
              activeTab === tab.key && styles.tabItemActive,
            ]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.7}
          >
            <Icon
              name={tab.icon}
              size={16}
              color={activeTab === tab.key ? "#2563eb" : "#9ca3af"}
            />
            <Text
              style={[
                styles.tabText,
                activeTab === tab.key && styles.tabTextActive,
              ]}
            >
              {tab.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Tab Content */}
      <View style={styles.content}>{renderTabContent()}</View>
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
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  headerTitleContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "white",
  },
  headerSubRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 2,
  },
  connectionDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
  },
  refreshButton: {
    padding: 8,
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 8,
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  tabItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabItemActive: {
    borderBottomColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  tabText: {
    fontSize: 14,
    color: "#9ca3af",
    marginLeft: 8,
    fontWeight: "500",
  },
  tabTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  content: {
    flex: 1,
  },
});

export default VehicleTrackingScreen;
