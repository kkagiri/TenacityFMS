/**
 * NotificationCard Component
 * Displays a single notification with actions for marking as read and acknowledging
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

// Priority color mapping
const PRIORITY_COLORS = {
  Critical: { bg: "#fef2f2", border: "#dc2626", text: "#991b1b", icon: "#dc2626" },
  High: { bg: "#fff7ed", border: "#ea580c", text: "#9a3412", icon: "#ea580c" },
  Medium: { bg: "#fefce8", border: "#ca8a04", text: "#854d0e", icon: "#ca8a04" },
  Low: { bg: "#f0fdf4", border: "#16a34a", text: "#166534", icon: "#16a34a" },
};

// Type icon mapping
const TYPE_ICONS = {
  Alert: "exclamation-circle",
  Warning: "exclamation-triangle",
  Info: "info-circle",
  Error: "times-circle",
  System: "cog",
  Reminder: "bell",
  Approval: "check-circle",
};

// Category icon mapping
const CATEGORY_ICONS = {
  Tank: "database",
  Pump: "gas-pump",
  Vehicle: "car",
  System: "server",
  User: "user",
  Fuel: "tint",
  Delivery: "truck",
  Stock: "boxes",
  Alarm: "bell",
};

const NotificationCard = ({
  notification,
  onPress,
  onMarkAsRead,
  onAcknowledge,
  isExpanded = false,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [acknowledgeLoading, setAcknowledgeLoading] = useState(false);

  const {
    id,
    title,
    message,
    type = "Info",
    category = "System",
    priority = "Medium",
    createdAt,
    isRead = false,
    isAcknowledged = false,
    requiresAcknowledgment = false,
    siteName,
    tankName,
    vehicleName,
    ptsDeviceName,
  } = notification;

  const priorityColors = PRIORITY_COLORS[priority] || PRIORITY_COLORS.Medium;
  const typeIcon = TYPE_ICONS[type] || "bell";
  const categoryIcon = CATEGORY_ICONS[category] || "bell";

  // Format relative time
  const formatRelativeTime = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  };

  const handleMarkAsRead = async () => {
    if (isRead || isLoading) return;
    setIsLoading(true);
    try {
      await onMarkAsRead?.(id);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAcknowledge = async () => {
    if (isAcknowledged || acknowledgeLoading) return;
    setAcknowledgeLoading(true);
    try {
      await onAcknowledge?.(id);
    } finally {
      setAcknowledgeLoading(false);
    }
  };

  // Get context info string
  const getContextInfo = () => {
    const parts = [];
    if (siteName) parts.push(siteName);
    if (tankName) parts.push(tankName);
    if (vehicleName) parts.push(vehicleName);
    if (ptsDeviceName) parts.push(ptsDeviceName);
    return parts.join(" • ");
  };

  const contextInfo = getContextInfo();

  return (
    <TouchableOpacity
      style={[
        styles.container,
        { backgroundColor: priorityColors.bg, borderLeftColor: priorityColors.border },
        !isRead && styles.unread,
      ]}
      onPress={() => {
        if (!isRead) handleMarkAsRead();
        onPress?.(notification);
      }}
      activeOpacity={0.7}
    >
      {/* Header Row */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconContainer, { backgroundColor: priorityColors.border }]}>
            <Icon name={typeIcon} size={14} color="#ffffff" />
          </View>
          <View style={styles.categoryBadge}>
            <Icon name={categoryIcon} size={10} color={priorityColors.text} />
            <Text style={[styles.categoryText, { color: priorityColors.text }]}>
              {category}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={styles.timeText}>{formatRelativeTime(createdAt)}</Text>
          {!isRead && <View style={styles.unreadDot} />}
        </View>
      </View>

      {/* Title */}
      <Text style={[styles.title, !isRead && styles.titleUnread]} numberOfLines={2}>
        {title}
      </Text>

      {/* Message */}
      <Text style={styles.message} numberOfLines={isExpanded ? undefined : 2}>
        {message}
      </Text>

      {/* Context Info */}
      {contextInfo ? (
        <View style={styles.contextRow}>
          <Icon name="map-marker-alt" size={10} color="#6b7280" />
          <Text style={styles.contextText} numberOfLines={1}>
            {contextInfo}
          </Text>
        </View>
      ) : null}

      {/* Priority Badge */}
      <View style={styles.footer}>
        <View style={[styles.priorityBadge, { backgroundColor: priorityColors.border }]}>
          <Text style={styles.priorityText}>{priority}</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actions}>
          {/* Mark as read button */}
          {!isRead && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkAsRead}
              disabled={isLoading}
            >
              <Icon
                name={isLoading ? "spinner" : "check"}
                size={14}
                color="#6b7280"
              />
            </TouchableOpacity>
          )}

          {/* Acknowledge/Approve button */}
          {requiresAcknowledgment && (
            <TouchableOpacity
              style={[
                styles.acknowledgeButton,
                isAcknowledged && styles.acknowledgedButton,
              ]}
              onPress={handleAcknowledge}
              disabled={isAcknowledged || acknowledgeLoading}
            >
              <Icon
                name={isAcknowledged ? "check-double" : acknowledgeLoading ? "spinner" : "thumbs-up"}
                size={14}
                color={isAcknowledged ? "#16a34a" : "#2563eb"}
                solid={isAcknowledged}
              />
              <Text
                style={[
                  styles.acknowledgeText,
                  isAcknowledged && styles.acknowledgedText,
                ]}
              >
                {isAcknowledged ? "Approved" : "Approve"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 16,
    marginVertical: 6,
    padding: 14,
    borderRadius: 12,
    borderLeftWidth: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  unread: {
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  iconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
  },
  categoryBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  categoryText: {
    fontSize: 11,
    fontWeight: "600",
  },
  timeText: {
    fontSize: 12,
    color: "#6b7280",
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#2563eb",
  },
  title: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
    marginBottom: 4,
  },
  titleUnread: {
    fontWeight: "700",
    color: "#111827",
  },
  message: {
    fontSize: 13,
    color: "#6b7280",
    lineHeight: 18,
    marginBottom: 8,
  },
  contextRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginBottom: 8,
  },
  contextText: {
    fontSize: 11,
    color: "#6b7280",
    flex: 1,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 4,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
    textTransform: "uppercase",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  actionButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(0,0,0,0.05)",
  },
  acknowledgeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#dbeafe",
  },
  acknowledgedButton: {
    backgroundColor: "#dcfce7",
  },
  acknowledgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#2563eb",
  },
  acknowledgedText: {
    color: "#16a34a",
  },
});

export default NotificationCard;
