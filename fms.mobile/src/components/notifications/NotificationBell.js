/**
 * NotificationBell Component
 * Header button for notifications with badge
 * Can be added to any screen header
 */

import React, { useEffect } from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSelector, useDispatch } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import NotificationBadge from "./NotificationBadge";
import {
  selectUnreadCount,
  fetchNotificationStats,
} from "../../redux/slices/notificationSlice";

const NotificationBell = ({
  size = 22,
  color = "#ffffff",
  style,
  showBadge = true,
  onPress,
}) => {
  const navigation = useNavigation();
  const dispatch = useDispatch();
  const unreadCount = useSelector(selectUnreadCount);

  // Fetch notification stats on mount
  useEffect(() => {
    dispatch(fetchNotificationStats());
  }, [dispatch]);

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else {
      navigation.navigate("NotificationCenter");
    }
  };

  return (
    <TouchableOpacity
      style={[styles.container, style]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View>
        <Icon name="bell" size={size} color={color} />
        {showBadge && unreadCount > 0 && (
          <NotificationBadge
            count={unreadCount}
            size="small"
            style={styles.badge}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
  },
  badge: {
    top: -6,
    right: -8,
  },
});

export default NotificationBell;
