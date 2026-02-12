//Cursor - Main navigation for FMS Mobile
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createDrawerNavigator } from "@react-navigation/drawer";
import Icon from "react-native-vector-icons/FontAwesome5";

// Import screens
import LoginScreen from "../screens/LoginScreen";
import HomeScreen from "../screens/HomeScreen";
import DeviceListScreen from "../screens/DeviceListScreen";
import FuelingProcessScreen from "../screens/FuelingProcessScreen";
import TransactionHistoryScreen from "../screens/TransactionHistoryScreen";
import TankTransactionHubScreen from "../screens/TankTransactionHubScreen";
import SiteOverviewScreen from "../screens/SiteOverviewScreen";
import SettingsScreen from "../screens/SettingsScreen";
import ManageStocksScreen from "../screens/ManageStocksScreen";
import OpenStockScreen from "../screens/OpenStockScreen";
import VehicleDetailsScreen from "../screens/VehicleDetailsScreen";
import ManualRefillScreen from "../screens/ManualRefillScreen";
import TankDeliveryScreen from "../screens/TankDeliveryScreen";
import TankTransferScreen from "../screens/TankTransferScreen";
import NotificationCenterScreen from "../screens/NotificationCenterScreen";
import LocationSettingsScreen from "../screens/LocationSettingsScreen";
import IssueListScreen from "../screens/IssueListScreen";
import IssueDetailScreen from "../screens/IssueDetailScreen";

// Import custom drawer
import DrawerContent from "../components/navigation/DrawerContent";

// Import components
import { useSelector } from "react-redux";

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();
const Drawer = createDrawerNavigator();

// Import TouchableOpacity for menu button
import { TouchableOpacity } from "react-native";
import { useNavigation, DrawerActions } from "@react-navigation/native";

// Header Left Menu Button Component
const MenuButton = () => {
  const navigation = useNavigation();
  return (
    <TouchableOpacity
      style={{ marginLeft: 15, padding: 5 }}
      onPress={() => navigation.dispatch(DrawerActions.openDrawer())}
    >
      <Icon name="bars" size={20} color="white" />
    </TouchableOpacity>
  );
};

// Main Tab Navigator
const TabNavigator = () => {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName;

          switch (route.name) {
            case "Home":
              iconName = "home";
              break;
            case "Devices":
              iconName = "gas-pump";
              break;
            case "History":
              iconName = "history";
              break;
            case "Settings":
              iconName = "cog";
              break;
            default:
              iconName = "question";
          }

          return <Icon name={iconName} size={size} color={color} />;
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
        headerStyle: {
          backgroundColor: "#1f2937",
        },
        headerTintColor: "white",
        headerTitleStyle: {
          fontWeight: "bold",
        },
        headerLeft: () => <MenuButton />,
      })}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "FMS Home" }}
      />
      <Tab.Screen
        name="Devices"
        component={DeviceListScreen}
        options={{ title: "FMS Devices" }}
      />
      <Tab.Screen
        name="History"
        component={TransactionHistoryScreen}
        options={{ title: "Transaction History" }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: "Settings" }}
      />
    </Tab.Navigator>
  );
};

// Stack Navigator for screens that need to be accessed from drawer
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
          headerShown: false, // Screen has its own header
        }}
      />
      <Stack.Screen
        name="SiteOverview"
        component={SiteOverviewScreen}
        options={{
          title: "Site Overview",
          headerShown: false, // Screen has its own header
        }}
      />
      <Stack.Screen
        name="VehicleDetails"
        component={VehicleDetailsScreen}
        options={{
          title: "Vehicle Details",
          headerShown: false, // Screen has its own header
        }}
      />
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
          headerShown: false, // Screen has its own header
        }}
      />
      <Stack.Screen
        name="LocationSettings"
        component={LocationSettingsScreen}
        options={{
          title: "Location Settings",
          headerShown: false, // Screen has its own header
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
    </Stack.Navigator>
  );
};

// Drawer Navigator
const DrawerNavigator = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <DrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          width: 300,
        },
        drawerType: "front",
        overlayColor: "rgba(0, 0, 0, 0.5)",
      }}
    >
      <Drawer.Screen name="Main" component={MainStackNavigator} />
    </Drawer.Navigator>
  );
};

// Main App Navigator
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
          name="DrawerNav"
          component={DrawerNavigator}
          options={{ headerShown: false }}
        />
      )}
    </Stack.Navigator>
  );
};

export default AppNavigator;
