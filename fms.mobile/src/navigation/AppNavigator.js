/**
 * File: AppNavigator.js
 * Purpose: Main navigation for FMS Mobile - Stack-based navigation (no drawer).
 *          Bottom tabs (Fueling, History) are permission-gated via _Mobile_* permissions.
 * Dependencies: react-navigation, react-redux, screens, usePermissions, mobilePermissions
 * Last Modified: 2026-02-28
 *
 * Key Components:
 * - TabNavigator: Bottom tab with Home, Fueling (gated), Transaction History (gated), Settings
 * - MainStackNavigator: All app screens accessible from Home
 * - AppNavigator: Root navigator with auth check
 */
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Icon from "react-native-vector-icons/FontAwesome5";

// Import screens
import LoginScreen from "../screens/auth/LoginScreen";
import HomeScreen from "../screens/home/HomeScreen";
import DeviceListScreen from "../screens/fueling/DeviceListScreen";
import FuelingProcessScreen from "../screens/fueling/FuelingProcessScreen";
import TransactionHistoryScreen from "../screens/fueling/TransactionHistoryScreen";
import TankTransactionHubScreen from "../screens/tankStock/TankTransactionHubScreen";
import SiteOverviewScreen from "../screens/tankStock/SiteOverviewScreen";
import SettingsScreen from "../screens/settings/SettingsScreen";
import ManageStocksScreen from "../screens/tankStock/ManageStocksScreen";
import OpenStockScreen from "../screens/tankStock/OpenStockScreen";
import VehicleDetailsScreen from "../screens/vehicle/VehicleDetailsScreen";
// VehicleTracking is now integrated into VehicleDetailsScreen (dashboard view)
import ManualRefillScreen from "../screens/tankStock/ManualRefillScreen";
import TankDeliveryScreen from "../screens/tankStock/TankDeliveryScreen";
import TankTransferScreen from "../screens/tankStock/TankTransferScreen";
import NotificationCenterScreen from "../screens/notifications/NotificationCenterScreen";
import LocationSettingsScreen from "../screens/settings/LocationSettingsScreen";
import IssueListScreen from "../screens/issues/IssueListScreen";
import IssueDetailScreen from "../screens/issues/IssueDetailScreen";
import IssueAssignmentResponseScreen from "../screens/issues/IssueAssignmentResponseScreen";

import { useSelector } from "react-redux";
import { usePermissions } from "../hooks/usePermissions";
import { MOBILE_PERMISSIONS } from "../constants/mobilePermissions";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// Main Tab Navigator - Home, Fueling, Transaction History, Settings
// Fueling and History tabs are permission-gated via _Mobile_Fueling / _Mobile_Transactions
const TabNavigator = () => {
  const { hasPermission } = usePermissions();
  const canAccessFueling = hasPermission(MOBILE_PERMISSIONS.FUELING);
  const canAccessTransactions = hasPermission(MOBILE_PERMISSIONS.TRANSACTIONS);

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;
          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Fueling":
              iconName = "gas-pump";
              break;
            case "History":
              iconName = "history";
              break;
            case "SettingsTab":
              iconName = "cog";
              break;
            default:
              iconName = "question";
          }
          return <Icon name={iconName} size={Math.round(size * 1.2)} color={color} />;
        },
        tabBarActiveTintColor: "#2563eb",
        tabBarInactiveTintColor: "#6b7280",
        tabBarStyle: {
          backgroundColor: "white",
          borderTopColor: "#e5e7eb",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarItemStyle: {
          paddingHorizontal: 2,
        },
        headerStyle: {
          backgroundColor: "#1f2937",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerShown: false,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ tabBarLabel: "FMS Home" }}
      />
      {canAccessFueling && (
        <Tab.Screen
          name="Fueling"
          component={DeviceListScreen}
          options={{ tabBarLabel: "Fueling" }}
        />
      )}
      {canAccessTransactions && (
        <Tab.Screen
          name="History"
          component={TransactionHistoryScreen}
          options={{ tabBarLabel: "Transaction History" }}
        />
      )}
      <Tab.Screen
        name="SettingsTab"
        component={SettingsScreen}
        options={{ tabBarLabel: "Settings" }}
      />
    </Tab.Navigator>
  );
};

// Main Stack Navigator - all screens accessible from Home quick actions
const MainStackNavigator = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1f2937",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      <Stack.Screen
        name="MainTabs"
        component={TabNavigator}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FuelingProcess"
        component={FuelingProcessScreen}
        options={{
          title: "Fueling Process",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="Devices"
        component={DeviceListScreen}
        options={{
          title: "FMS Devices",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="ManageStocks"
        component={ManageStocksScreen}
        options={{
          title: "Manage Stocks",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="OpenStock"
        component={OpenStockScreen}
        options={({ route }) => ({
          title:
            route.params?.type === "closing"
              ? "Closing Stock"
              : "Opening Stock",
          headerBackTitleVisible: false,
        })}
      />
      <Stack.Screen
        name="TankTransactionHub"
        component={TankTransactionHubScreen}
        options={{
          title: "Transaction Hub",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="TankStock"
        component={SiteOverviewScreen}
        options={{
          title: "Tank Stock",
          headerShown: false,
        }}
      />
      {/* Keep SiteOverview as alias for backward compatibility */}
      <Stack.Screen
        name="SiteOverview"
        component={SiteOverviewScreen}
        options={{
          title: "Tank Stock",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="VehicleDetails"
        component={VehicleDetailsScreen}
        options={{
          title: "Vehicle Details",
          headerShown: false,
        }}
      />
      {/* VehicleTracking is now integrated into VehicleDetailsScreen */}
      <Stack.Screen
        name="ManualRefill"
        component={ManualRefillScreen}
        options={{
          title: "Manual Refill",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="TankDelivery"
        component={TankDeliveryScreen}
        options={{
          title: "Tank Delivery",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="TankTransfer"
        component={TankTransferScreen}
        options={{
          title: "Tank Transfer",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="NotificationCenter"
        component={NotificationCenterScreen}
        options={{
          title: "Notifications",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="LocationSettings"
        component={LocationSettingsScreen}
        options={{
          title: "Location Settings",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          title: "Settings",
          headerBackTitleVisible: false,
        }}
      />
      <Stack.Screen
        name="IssueList"
        component={IssueListScreen}
        options={{
          title: "Issue Tracker",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="IssueDetail"
        component={IssueDetailScreen}
        options={{
          title: "Issue Details",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="IssueAssignmentResponse"
        component={IssueAssignmentResponseScreen}
        options={{
          title: "Issue Assignment Response",
          headerShown: false,
        }}
      />
    </Stack.Navigator>
  );
};

// Main App Navigator - no drawer, direct to stack
const AppNavigator = () => {
  const isAuthenticated = useSelector((state) => state.auth.isAuthenticated);

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: "#1f2937",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
      }}
    >
      {!isAuthenticated ? (
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />
      ) : (
        <Stack.Screen
          name="MainStack"
          component={MainStackNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
