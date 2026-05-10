/**
 * NotificationBadge Component
 * Shows notification count badge on icons/buttons
 */

import React from "react";
import { View, Text, StyleSheet } from "react-native";

const NotificationBadge = ({
  count = 0,
  maxCount = 99,
  size = "medium",
  color = "#dc2626",
  textColor = "#ffffff",
  showZero = false,
  style,
}) => {
  if (count <= 0 && !showZero) return null;

  const displayCount = count > maxCount ? `${maxCount}+` : count.toString();

  const sizeStyles = {
    small: {
      minWidth: 16,
      height: 16,
      fontSize: 9,
      paddingHorizontal: 4,
    },
    medium: {
      minWidth: 20,
      height: 20,
      fontSize: 11,
      paddingHorizontal: 5,
    },
    large: {
      minWidth: 24,
      height: 24,
      fontSize: 13,
      paddingHorizontal: 6,
    },
  };

  const currentSize = sizeStyles[size] || sizeStyles.medium;

  return (
    <View
      style={[
        styles.badge,
        {
          minWidth: currentSize.minWidth,
          height: currentSize.height,
          paddingHorizontal: currentSize.paddingHorizontal,
          backgroundColor: color,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          {
            fontSize: currentSize.fontSize,
            color: textColor,
          },
        ]}
      >
        {displayCount}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    borderRadius: 100,
    justifyContent: "center",
    alignItems: "center",
    position: "absolute",
    top: -6,
    right: -6,
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  text: {
    fontWeight: "700",
    textAlign: "center",
  },
});

export default NotificationBadge;
