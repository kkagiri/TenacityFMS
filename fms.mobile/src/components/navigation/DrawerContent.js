import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
} from "react-native";
import { DrawerContentScrollView } from "@react-navigation/drawer";
import { useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";

const DrawerContent = ({ navigation, state }) => {
  const user = useSelector((state) => state.auth.user);
  const currentRoute = state?.routes[state?.index]?.name;

  const menuItems = [
    {
      id: "home",
      label: "Home",
      icon: "home",
      screen: "MainTabs",
      tabName: "Home",
      description: "Dashboard & Quick Actions",
    },
    {
      id: "fueling",
      label: "Fueling",
      icon: "gas-pump",
      screen: "MainTabs",
      tabName: "Devices",
      description: "Start fueling process",
    },
    {
      id: "manageStocks",
      label: "Stock Management",
      icon: "warehouse",
      screen: "ManageStocks",
      description: "Opening & Closing Stocks",
    },
    {
      id: "divider1",
      type: "divider",
    },
    {
      id: "history",
      label: "Transactions",
      icon: "history",
      screen: "MainTabs",
      tabName: "History",
      description: "Pump transaction records",
    },
    {
      id: "transactionHub",
      label: "Transaction Hub",
      icon: "exchange-alt",
      screen: "TankTransactionHub",
      description: "Tank volume history",
    },
    {
      id: "divider2",
      type: "divider",
    },
    {
      id: "settings",
      label: "Settings",
      icon: "cog",
      screen: "MainTabs",
      tabName: "Settings",
      description: "App configuration",
    },
  ];

  const handleNavigation = (item) => {
    if (item.tabName) {
      navigation.navigate("MainTabs", { screen: item.tabName });
    } else {
      navigation.navigate(item.screen);
    }
  };

  const isActive = (item) => {
    if (item.screen === currentRoute) return true;
    if (item.tabName && currentRoute === "MainTabs") {
      // Check if we're on the specific tab
      return false; // Can be enhanced with tab state tracking
    }
    return false;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoContainer}>
          <View style={styles.logoCircle}>
            <Icon name="gas-pump" size={28} color="#ffffff" />
          </View>
        </View>
        <Text style={styles.appTitle}>FMS Mobile</Text>
        <Text style={styles.appSubtitle}>Fleet Management System</Text>

        {user && (
          <View style={styles.userInfo}>
            <View style={styles.userAvatar}>
              <Icon name="user" size={16} color="#2563eb" />
            </View>
            <View style={styles.userDetails}>
              <Text style={styles.userName}>
                {user.fullName || user.username}
              </Text>
              <Text style={styles.userRole}>{user.roleName || "User"}</Text>
            </View>
          </View>
        )}
      </View>

      {/* Menu Items */}
      <ScrollView
        style={styles.menuContainer}
        showsVerticalScrollIndicator={false}
      >
        {menuItems.map((item) => {
          if (item.type === "divider") {
            return <View key={item.id} style={styles.divider} />;
          }

          const active = isActive(item);

          return (
            <TouchableOpacity
              key={item.id}
              style={[styles.menuItem, active && styles.menuItemActive]}
              onPress={() => handleNavigation(item)}
            >
              <View
                style={[
                  styles.menuIconContainer,
                  active && styles.menuIconContainerActive,
                ]}
              >
                <Icon
                  name={item.icon}
                  size={18}
                  color={active ? "#ffffff" : "#6b7280"}
                />
              </View>
              <View style={styles.menuTextContainer}>
                <Text
                  style={[styles.menuLabel, active && styles.menuLabelActive]}
                >
                  {item.label}
                </Text>
                <Text style={styles.menuDescription}>{item.description}</Text>
              </View>
              <Icon
                name="chevron-right"
                size={12}
                color={active ? "#2563eb" : "#d1d5db"}
              />
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <View style={styles.versionContainer}>
          <Text style={styles.versionText}>Version 1.0.0</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#1f2937",
    paddingTop: 50,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#2563eb",
    alignItems: "center",
    justifyContent: "center",
  },
  appTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#ffffff",
    marginBottom: 2,
  },
  appSubtitle: {
    fontSize: 13,
    color: "#9ca3af",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#374151",
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#e0e7ff",
    alignItems: "center",
    justifyContent: "center",
  },
  userDetails: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 14,
    fontWeight: "600",
    color: "#ffffff",
  },
  userRole: {
    fontSize: 12,
    color: "#9ca3af",
  },
  menuContainer: {
    flex: 1,
    paddingTop: 12,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 20,
    marginHorizontal: 12,
    marginVertical: 2,
    borderRadius: 10,
  },
  menuItemActive: {
    backgroundColor: "#eff6ff",
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
    justifyContent: "center",
  },
  menuIconContainerActive: {
    backgroundColor: "#2563eb",
  },
  menuTextContainer: {
    flex: 1,
    marginLeft: 14,
  },
  menuLabel: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
  },
  menuLabelActive: {
    color: "#2563eb",
  },
  menuDescription: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginHorizontal: 32,
    marginVertical: 12,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  versionContainer: {
    alignItems: "center",
  },
  versionText: {
    fontSize: 12,
    color: "#9ca3af",
  },
});

export default DrawerContent;
