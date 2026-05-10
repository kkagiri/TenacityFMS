/**
 * NotificationCenterScreen
 * Main screen for viewing and managing notifications
 * Supports filtering, marking as read, and acknowledging notifications
 */

import React, { useEffect, useCallback, useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";

// Redux
import {
  fetchNotifications,
  fetchNotificationStats,
  markNotificationAsRead,
  markAllAsRead,
  acknowledgeNotification,
  setFilters,
  clearFilters,
  selectNotifications,
  selectUnreadCount,
  selectPendingApprovalCount,
  selectIsLoading,
  selectIsRefreshing,
  selectHasMore,
  selectFilters,
  selectStatistics,
} from "../../redux/slices/notificationSlice";

// Components
import {
  NotificationCard,
  NotificationFilters,
} from "../../components/notifications";

const parseDateToLocal = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;

  const raw = String(value).trim();
  if (!raw) return null;

  const hasTimezone = /[zZ]|[+-]\d{2}:?\d{2}$/.test(raw);
  const hasTime = raw.includes("T");

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
    const [year, month, day] = raw.split("-").map(Number);
    return new Date(year, month - 1, day);
  }

  if (hasTimezone) return new Date(raw);
  if (hasTime) return new Date(`${raw}Z`);
  return new Date(raw);
};

const formatLocalTimestamp = (value) => {
  const date = parseDateToLocal(value);
  if (!date || Number.isNaN(date.getTime())) return "-";
  return date.toLocaleString();
};

const safeParseNotificationData = (notification) => {
  const rawData = notification?.data ?? notification?.Data;
  if (!rawData) return {};
  if (typeof rawData === "object") return rawData;

  if (typeof rawData === "string") {
    try {
      return JSON.parse(rawData);
    } catch (_error) {
      return {};
    }
  }

  return {};
};

const extractIssueLinks = (notification) => {
  const data = safeParseNotificationData(notification);

  const issueUrl =
    data.IssueUrl ||
    data.issueUrl ||
    data.ActionUrl ||
    data.actionUrl ||
    notification?.actionUrl ||
    notification?.ActionUrl ||
    null;

  const assignmentResponseUrl =
    data.AssignmentResponseUrl ||
    data.assignmentResponseUrl ||
    data.AssignmentConfirmUrl ||
    data.assignmentConfirmUrl ||
    null;

  const tryExtractIdFromUrl = (url) => {
    if (!url || typeof url !== "string") return null;
    const match = url.match(/issue-tracker\/(?:details|assignment)\/(\d+)/i);
    if (!match?.[1]) return null;
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) ? parsed : null;
  };

  const issueIdCandidates = [
    notification?.issueTrackerId,
    notification?.IssueTrackerId,
    notification?.issueId,
    notification?.IssueId,
    data.IssueId,
    data.issueId,
    data.IssueTrackerId,
    data.issueTrackerId,
    tryExtractIdFromUrl(issueUrl),
    tryExtractIdFromUrl(assignmentResponseUrl),
  ];

  const issueId = issueIdCandidates
    .map((candidate) => Number(candidate))
    .find((candidate) => Number.isFinite(candidate) && candidate > 0);

  return {
    issueId: issueId || null,
    issueUrl,
    assignmentResponseUrl,
    isAssignmentNotification:
      Boolean(assignmentResponseUrl) ||
      /issue-tracker\/assignment\//i.test(issueUrl || "") ||
      String(notification?.triggerSource || notification?.TriggerSource || "")
        .toLowerCase()
        .includes("issueassignment") ||
      String(notification?.title || "").toLowerCase().includes("issue assigned"),
  };
};

const NotificationCenterScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();

  // Redux state
  const notifications = useSelector(selectNotifications);
  const unreadCount = useSelector(selectUnreadCount);
  const pendingApprovalCount = useSelector(selectPendingApprovalCount);
  const isLoading = useSelector(selectIsLoading);
  const isRefreshing = useSelector(selectIsRefreshing);
  const hasMore = useSelector(selectHasMore);
  const filters = useSelector(selectFilters);
  const statistics = useSelector(selectStatistics);

  // Local state
  const [selectedNotification, setSelectedNotification] = useState(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // "all", "unread", "pending"

  const selectedIssueLinks = useMemo(
    () => extractIssueLinks(selectedNotification),
    [selectedNotification]
  );

  // Initial fetch
  useEffect(() => {
    dispatch(fetchNotifications({ refresh: true }));
    dispatch(fetchNotificationStats());
  }, [dispatch]);

  // Refresh on tab change
  useEffect(() => {
    let newFilters = {};
    switch (activeTab) {
      case "unread":
        newFilters = { isRead: false };
        break;
      case "pending":
        newFilters = { requiresAcknowledgment: true, isAcknowledged: false };
        break;
      default:
        newFilters = {};
    }
    dispatch(setFilters(newFilters));
    dispatch(fetchNotifications({ refresh: true, filters: newFilters }));
  }, [activeTab, dispatch]);

  // Handle refresh
  const handleRefresh = useCallback(() => {
    dispatch(fetchNotifications({ refresh: true }));
    dispatch(fetchNotificationStats());
  }, [dispatch]);

  // Handle load more
  const handleLoadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      dispatch(fetchNotifications());
    }
  }, [dispatch, isLoading, hasMore]);

  // Handle mark as read
  const handleMarkAsRead = useCallback(
    async (notificationId) => {
      await dispatch(markNotificationAsRead(notificationId)).unwrap();
    },
    [dispatch]
  );

  // Handle mark all as read
  const handleMarkAllAsRead = useCallback(async () => {
    await dispatch(markAllAsRead()).unwrap();
  }, [dispatch]);

  // Handle acknowledge
  const handleAcknowledge = useCallback(
    async (notificationId) => {
      await dispatch(acknowledgeNotification(notificationId)).unwrap();
    },
    [dispatch]
  );

  // Handle notification press
  const handleNotificationPress = useCallback(
    (notification) => {
      const links = extractIssueLinks(notification);

      if (links.issueId) {
        if (links.isAssignmentNotification) {
          navigation.navigate("IssueAssignmentResponse", {
            issueId: links.issueId,
          });
          return;
        }

        navigation.navigate("IssueDetail", { issueId: links.issueId });
        return;
      }

      setSelectedNotification(notification);
      setShowDetailModal(true);
    },
    [navigation]
  );

  const handleOpenIssueDetails = useCallback(() => {
    if (!selectedIssueLinks.issueId) return;
    setShowDetailModal(false);
    navigation.navigate("IssueDetail", { issueId: selectedIssueLinks.issueId });
  }, [navigation, selectedIssueLinks.issueId]);

  const handleOpenAssignmentResponse = useCallback(() => {
    if (!selectedIssueLinks.issueId) return;
    setShowDetailModal(false);
    navigation.navigate("IssueAssignmentResponse", {
      issueId: selectedIssueLinks.issueId,
    });
  }, [navigation, selectedIssueLinks.issueId]);

  // Handle filter change
  const handleFiltersChange = useCallback(
    (newFilters) => {
      dispatch(setFilters(newFilters));
      dispatch(fetchNotifications({ refresh: true, filters: newFilters }));
    },
    [dispatch]
  );

  // Handle clear filters
  const handleClearFilters = useCallback(() => {
    dispatch(clearFilters());
    dispatch(fetchNotifications({ refresh: true }));
  }, [dispatch]);

  // Render notification item
  const renderNotification = useCallback(
    ({ item }) => (
      <NotificationCard
        notification={item}
        onPress={handleNotificationPress}
        onMarkAsRead={handleMarkAsRead}
        onAcknowledge={handleAcknowledge}
      />
    ),
    [handleNotificationPress, handleMarkAsRead, handleAcknowledge]
  );

  // Render empty state
  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Icon name="bell-slash" size={60} color="#d1d5db" />
      <Text style={styles.emptyTitle}>No Notifications</Text>
      <Text style={styles.emptySubtitle}>
        {activeTab === "unread"
          ? "You've read all your notifications!"
          : activeTab === "pending"
            ? "No pending approvals at this time"
            : "No notifications yet. We'll notify you when something happens."}
      </Text>
    </View>
  );

  // Render footer (loading indicator for pagination)
  const renderFooter = () => {
    if (!isLoading || isRefreshing) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#2563eb" />
      </View>
    );
  };

  // Key extractor
  const keyExtractor = useCallback(
    (item) => item.id?.toString() || item.notificationId,
    []
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1f2937" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={18} color="#ffffff" />
          </TouchableOpacity>
          <View>
            <Text style={styles.headerTitle}>Notifications</Text>
            <Text style={styles.headerSubtitle}>
              {unreadCount > 0
                ? `${unreadCount} unread`
                : "All caught up!"}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          {unreadCount > 0 && (
            <TouchableOpacity
              style={styles.markAllButton}
              onPress={handleMarkAllAsRead}
            >
              <Icon name="check-double" size={16} color="#ffffff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Stats Bar */}
      <View style={styles.statsBar}>
        <TouchableOpacity
          style={[styles.statItem, activeTab === "all" && styles.statItemActive]}
          onPress={() => setActiveTab("all")}
        >
          <Icon
            name="bell"
            size={18}
            color={activeTab === "all" ? "#2563eb" : "#6b7280"}
          />
          <Text
            style={[
              styles.statLabel,
              activeTab === "all" && styles.statLabelActive,
            ]}
          >
            All
          </Text>
          <Text
            style={[
              styles.statValue,
              activeTab === "all" && styles.statValueActive,
            ]}
          >
            {statistics?.total || notifications.length}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statItem,
            activeTab === "unread" && styles.statItemActive,
          ]}
          onPress={() => setActiveTab("unread")}
        >
          <Icon
            name="envelope"
            size={18}
            color={activeTab === "unread" ? "#ea580c" : "#6b7280"}
          />
          <Text
            style={[
              styles.statLabel,
              activeTab === "unread" && styles.statLabelActive,
            ]}
          >
            Unread
          </Text>
          <View style={styles.statBadge}>
            <Text style={styles.statBadgeText}>{unreadCount}</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.statItem,
            activeTab === "pending" && styles.statItemActive,
          ]}
          onPress={() => setActiveTab("pending")}
        >
          <Icon
            name="clock"
            size={18}
            color={activeTab === "pending" ? "#dc2626" : "#6b7280"}
          />
          <Text
            style={[
              styles.statLabel,
              activeTab === "pending" && styles.statLabelActive,
            ]}
          >
            Pending
          </Text>
          {pendingApprovalCount > 0 && (
            <View style={[styles.statBadge, styles.pendingBadge]}>
              <Text style={styles.statBadgeText}>{pendingApprovalCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters */}
      <NotificationFilters
        filters={filters}
        onFiltersChange={handleFiltersChange}
        onClearFilters={handleClearFilters}
      />

      {/* Notifications List */}
      <FlatList
        data={notifications}
        renderItem={renderNotification}
        keyExtractor={keyExtractor}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={!isLoading ? renderEmptyState : null}
        ListFooterComponent={renderFooter}
        showsVerticalScrollIndicator={false}
      />

      {/* Notification Detail Modal */}
      <Modal
        visible={showDetailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Notification Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Modal Body */}
            {selectedNotification && (
              <ScrollView style={styles.modalBody}>
                {/* Priority & Type */}
                <View style={styles.detailRow}>
                  <View style={styles.detailBadge}>
                    <Text style={styles.detailBadgeText}>
                      {selectedNotification.priority}
                    </Text>
                  </View>
                  <View style={[styles.detailBadge, styles.typeBadge]}>
                    <Text style={styles.typeBadgeText}>
                      {selectedNotification.type}
                    </Text>
                  </View>
                  <View style={[styles.detailBadge, styles.categoryBadge]}>
                    <Text style={styles.categoryBadgeText}>
                      {selectedNotification.category}
                    </Text>
                  </View>
                </View>

                {/* Title */}
                <Text style={styles.detailTitle}>
                  {selectedNotification.title}
                </Text>

                {/* Message */}
                <Text style={styles.detailMessage}>
                  {selectedNotification.message}
                </Text>

                {/* Context Info */}
                <View style={styles.contextSection}>
                  {selectedNotification.siteName && (
                    <View style={styles.contextItem}>
                      <Icon name="map-marker-alt" size={14} color="#6b7280" />
                      <Text style={styles.contextLabel}>Site:</Text>
                      <Text style={styles.contextValue}>
                        {selectedNotification.siteName}
                      </Text>
                    </View>
                  )}
                  {selectedNotification.tankName && (
                    <View style={styles.contextItem}>
                      <Icon name="database" size={14} color="#6b7280" />
                      <Text style={styles.contextLabel}>Tank:</Text>
                      <Text style={styles.contextValue}>
                        {selectedNotification.tankName}
                      </Text>
                    </View>
                  )}
                  {selectedNotification.vehicleName && (
                    <View style={styles.contextItem}>
                      <Icon name="car" size={14} color="#6b7280" />
                      <Text style={styles.contextLabel}>Vehicle:</Text>
                      <Text style={styles.contextValue}>
                        {selectedNotification.vehicleName}
                      </Text>
                    </View>
                  )}
                  {selectedNotification.ptsDeviceName && (
                    <View style={styles.contextItem}>
                      <Icon name="gas-pump" size={14} color="#6b7280" />
                      <Text style={styles.contextLabel}>Device:</Text>
                      <Text style={styles.contextValue}>
                        {selectedNotification.ptsDeviceName}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Timestamps */}
                <View style={styles.timestampSection}>
                  <View style={styles.timestampItem}>
                    <Icon name="clock" size={12} color="#9ca3af" />
                    <Text style={styles.timestampText}>
                      Created: {formatLocalTimestamp(selectedNotification.createdAt)}
                    </Text>
                  </View>
                  {selectedNotification.readAt && (
                    <View style={styles.timestampItem}>
                      <Icon name="eye" size={12} color="#9ca3af" />
                      <Text style={styles.timestampText}>
                        Read: {formatLocalTimestamp(selectedNotification.readAt)}
                      </Text>
                    </View>
                  )}
                  {selectedNotification.acknowledgedAt && (
                    <View style={styles.timestampItem}>
                      <Icon name="check-circle" size={12} color="#16a34a" />
                      <Text style={styles.timestampText}>
                        Acknowledged: {formatLocalTimestamp(selectedNotification.acknowledgedAt)}
                      </Text>
                    </View>
                  )}
                </View>

                {selectedIssueLinks.issueId && (
                  <View style={styles.linkSection}>
                    <TouchableOpacity
                      style={styles.openIssueButton}
                      onPress={handleOpenIssueDetails}
                    >
                      <Icon name="external-link-alt" size={14} color="#ffffff" />
                      <Text style={styles.openIssueButtonText}>Open Issue Details</Text>
                    </TouchableOpacity>

                    {selectedIssueLinks.assignmentResponseUrl && (
                      <TouchableOpacity
                        style={styles.respondButton}
                        onPress={handleOpenAssignmentResponse}
                      >
                        <Icon name="clipboard-check" size={14} color="#2563eb" />
                        <Text style={styles.respondButtonText}>Respond to Assignment</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                )}
              </ScrollView>
            )}

            {/* Modal Footer */}
            {selectedNotification && (
              <View style={styles.modalFooter}>
                {!selectedNotification.isRead && (
                  <TouchableOpacity
                    style={styles.readButton}
                    onPress={async () => {
                      await handleMarkAsRead(selectedNotification.id);
                      setSelectedNotification({
                        ...selectedNotification,
                        isRead: true,
                      });
                    }}
                  >
                    <Icon name="check" size={16} color="#ffffff" />
                    <Text style={styles.readButtonText}>Mark as Read</Text>
                  </TouchableOpacity>
                )}
                {selectedNotification.requiresAcknowledgment &&
                  !selectedNotification.isAcknowledged && (
                    <TouchableOpacity
                      style={styles.acknowledgeButton}
                      onPress={async () => {
                        await handleAcknowledge(selectedNotification.id);
                        setSelectedNotification({
                          ...selectedNotification,
                          isAcknowledged: true,
                        });
                      }}
                    >
                      <Icon name="thumbs-up" size={16} color="#ffffff" />
                      <Text style={styles.acknowledgeButtonText}>Approve</Text>
                    </TouchableOpacity>
                  )}
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  // Header
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1f2937",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#ffffff",
  },
  headerSubtitle: {
    fontSize: 12,
    color: "#9ca3af",
  },
  headerRight: {
    flexDirection: "row",
    gap: 8,
  },
  markAllButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
  },
  // Stats Bar
  statsBar: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 8,
  },
  statItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "#f9fafb",
  },
  statItemActive: {
    backgroundColor: "#dbeafe",
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#6b7280",
  },
  statLabelActive: {
    color: "#2563eb",
  },
  statValue: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  statValueActive: {
    color: "#2563eb",
  },
  statBadge: {
    backgroundColor: "#ea580c",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 24,
    alignItems: "center",
  },
  pendingBadge: {
    backgroundColor: "#dc2626",
  },
  statBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#ffffff",
  },
  // List
  listContent: {
    paddingVertical: 8,
    flexGrow: 1,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: "center",
  },
  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 8,
    lineHeight: 20,
  },
  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "85%",
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
    fontWeight: "700",
    color: "#111827",
  },
  closeButton: {
    padding: 4,
  },
  modalBody: {
    padding: 16,
  },
  detailRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 12,
  },
  detailBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: "#fef2f2",
  },
  detailBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#dc2626",
  },
  typeBadge: {
    backgroundColor: "#dbeafe",
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
  },
  categoryBadge: {
    backgroundColor: "#f3f4f6",
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6b7280",
  },
  detailTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
    marginBottom: 8,
  },
  detailMessage: {
    fontSize: 15,
    color: "#4b5563",
    lineHeight: 22,
    marginBottom: 16,
  },
  contextSection: {
    backgroundColor: "#f9fafb",
    padding: 12,
    borderRadius: 12,
    marginBottom: 16,
  },
  contextItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 6,
  },
  contextLabel: {
    fontSize: 13,
    color: "#6b7280",
    width: 60,
  },
  contextValue: {
    fontSize: 13,
    fontWeight: "500",
    color: "#111827",
    flex: 1,
  },
  timestampSection: {
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 12,
  },
  timestampItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 4,
  },
  timestampText: {
    fontSize: 12,
    color: "#9ca3af",
  },
  linkSection: {
    marginTop: 14,
    gap: 8,
  },
  openIssueButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#2563eb",
    borderRadius: 10,
    paddingVertical: 12,
  },
  openIssueButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "700",
  },
  respondButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#bfdbfe",
    backgroundColor: "#eff6ff",
    borderRadius: 10,
    paddingVertical: 12,
  },
  respondButtonText: {
    color: "#2563eb",
    fontSize: 14,
    fontWeight: "700",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  readButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#6b7280",
  },
  readButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
  acknowledgeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#16a34a",
  },
  acknowledgeButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default NotificationCenterScreen;
