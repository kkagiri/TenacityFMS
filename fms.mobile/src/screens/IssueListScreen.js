/**
 * File: IssueListScreen.js
 * Purpose: Issue list view with filter chips, search, and issue cards.
 *          Tap a card to navigate to IssueDetailScreen.
 * Dependencies: React Native, issueTrackerService, usePermissions
 * Last Modified: 2026-02-11
 *
 * Key Features:
 * - Filter chips: All, Open, In Progress, Completed
 * - Issue cards with ID, title, status/priority badges, assigned user avatar
 * - Pull-to-refresh
 * - Permission gated: poweruser, admin, or _View_Issue permission
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Animated,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import issueTrackerService from "../services/issueTrackerService";
import { usePermissions } from "../hooks/usePermissions";

// ===== CONSTANTS =====
const FILTER_CHIPS = [
  { key: "all", label: "All", icon: "list" },
  { key: "open", label: "Open", icon: "folder-open", color: "#3B82F6" },
  { key: "inprogress", label: "In Progress", icon: "clock", color: "#F59E0B" },
  { key: "completed", label: "Completed", icon: "check-circle", color: "#10B981" },
];

// ===== HELPERS =====
const getPriorityConfig = (priority) => {
  if (!priority) return { bg: "#F3F4F6", text: "#6B7280", label: "—" };
  switch (String(priority).toLowerCase()) {
    case "critical":
      return { bg: "#FEE2E2", text: "#991B1B", label: "Critical" };
    case "high":
      return { bg: "#FFEDD5", text: "#9A3412", label: "High" };
    case "medium":
      return { bg: "#FEF9C3", text: "#854D0E", label: "Medium" };
    case "low":
      return { bg: "#DCFCE7", text: "#166534", label: "Low" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280", label: priority };
  }
};

const getStatusConfig = (status) => {
  if (!status) return { bg: "#F3F4F6", text: "#6B7280", label: "—", dot: "#9CA3AF" };
  const normalized = String(status).toLowerCase().replace(/\s+/g, "");
  switch (normalized) {
    case "open":
      return { bg: "#DBEAFE", text: "#1E40AF", label: "Open", dot: "#3B82F6" };
    case "inprogress":
    case "in-progress":
      return { bg: "#FEF3C7", text: "#92400E", label: "In Progress", dot: "#F59E0B" };
    case "pending":
      return { bg: "#FFEDD5", text: "#9A3412", label: "Pending", dot: "#F97316" };
    case "resolved":
      return { bg: "#D1FAE5", text: "#065F46", label: "Resolved", dot: "#10B981" };
    case "completed":
    case "closed":
    case "done":
      return { bg: "#F3F4F6", text: "#374151", label: "Completed", dot: "#6B7280" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280", label: status, dot: "#9CA3AF" };
  }
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
};

const AVATAR_COLORS = ["#6366F1", "#8B5CF6", "#EC4899", "#14B8A6", "#F97316", "#3B82F6"];
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const formatRelativeDate = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const now = new Date();
  const diffMs = now - date;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
};

// ===== ISSUE CARD =====
const IssueCard = React.memo(({ issue, onPress }) => {
  const priorityConfig = getPriorityConfig(issue.priorityName);
  const statusConfig = getStatusConfig(issue.statusName);
  const assignee = issue.assignToUserName || "Unassigned";
  const avatarColor = getAvatarColor(assignee);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={() => onPress(issue)}
      activeOpacity={0.7}
    >
      <View style={styles.cardTop}>
        <View style={styles.cardIdRow}>
          <Text style={styles.cardId}>#{issue.id}</Text>
          <Text style={styles.cardDate}>{formatRelativeDate(issue.openDate)}</Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>
          {issue.problemTitle || "Untitled Issue"}
        </Text>
      </View>

      <View style={styles.cardBottom}>
        <View style={styles.badgeRow}>
          {/* Status badge */}
          <View style={[styles.badge, { backgroundColor: statusConfig.bg }]}>
            <View style={[styles.badgeDot, { backgroundColor: statusConfig.dot }]} />
            <Text style={[styles.badgeText, { color: statusConfig.text }]}>
              {statusConfig.label}
            </Text>
          </View>
          {/* Priority badge */}
          <View style={[styles.badge, { backgroundColor: priorityConfig.bg }]}>
            <Text style={[styles.badgeText, { color: priorityConfig.text }]}>
              {priorityConfig.label}
            </Text>
          </View>
        </View>

        {/* Avatar */}
        <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
          <Text style={styles.avatarText}>{getInitials(assignee)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
});

// ===== MAIN SCREEN =====
const IssueListScreen = () => {
  const navigation = useNavigation();
  const { isAdmin, hasPermission, hasAnyPermission } = usePermissions();

  // Permission check
  const canViewIssues = useMemo(
    () => isAdmin || hasAnyPermission(["_View_Issue", "_Read_Issue", "PowerUser"]),
    [isAdmin, hasAnyPermission]
  );

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [statuses, setStatuses] = useState([]);

  const loadData = useCallback(async (isRefresh = false) => {
    try {
      if (isRefresh) setRefreshing(true);
      else setLoading(true);

      const [issueData, statusData] = await Promise.all([
        issueTrackerService.getIssues(),
        issueTrackerService.getIssueStatuses(),
      ]);

      setIssues(issueData);
      setStatuses(statusData);
    } catch (error) {
      console.error("[IssueListScreen] loadData error:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (canViewIssues) loadData();
  }, [canViewIssues, loadData]);

  // Map filter chip keys to status name matching
  const filteredIssues = useMemo(() => {
    let result = issues;

    // Filter by chip
    if (activeFilter !== "all") {
      result = result.filter((issue) => {
        const statusName = (issue.statusName || "").toLowerCase().replace(/\s+/g, "");
        if (activeFilter === "open") return statusName === "open";
        if (activeFilter === "inprogress") return statusName === "inprogress" || statusName === "in-progress";
        if (activeFilter === "completed")
          return ["completed", "closed", "resolved", "done"].includes(statusName);
        return true;
      });
    }

    // Filter by search text
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      result = result.filter(
        (issue) =>
          (issue.problemTitle || "").toLowerCase().includes(query) ||
          String(issue.id).includes(query) ||
          (issue.assignToUserName || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [issues, activeFilter, searchText]);

  const counts = useMemo(() => {
    const all = issues.length;
    const open = issues.filter((i) => (i.statusName || "").toLowerCase() === "open").length;
    const inProgress = issues.filter((i) => {
      const s = (i.statusName || "").toLowerCase().replace(/\s+/g, "");
      return s === "inprogress" || s === "in-progress";
    }).length;
    const completed = issues.filter((i) => {
      const s = (i.statusName || "").toLowerCase().replace(/\s+/g, "");
      return ["completed", "closed", "resolved", "done"].includes(s);
    }).length;
    return { all, open, inProgress, completed };
  }, [issues]);

  const handleIssuePress = useCallback(
    (issue) => {
      navigation.navigate("IssueDetail", { issueId: issue.id });
    },
    [navigation]
  );

  // ===== ACCESS DENIED =====
  if (!canViewIssues) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6D28D9" />
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerBackBtn}
            onPress={() => navigation.goBack()}
          >
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Tracker</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.accessDenied}>
          <Icon name="lock" size={48} color="#9CA3AF" />
          <Text style={styles.accessDeniedTitle}>Access Denied</Text>
          <Text style={styles.accessDeniedText}>
            You don't have permission to view issues.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ===== RENDER =====
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6D28D9" />

      {/* Purple gradient header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerBackBtn}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Issue Tracker</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Search bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBar}>
          <Icon name="search" size={14} color="#9CA3AF" style={{ marginRight: 8 }} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search issues..."
            placeholderTextColor="#9CA3AF"
            value={searchText}
            onChangeText={setSearchText}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => setSearchText("")}>
              <Icon name="times" size={14} color="#9CA3AF" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter chips */}
      <View style={styles.chipRow}>
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.key;
          const count =
            chip.key === "all"
              ? counts.all
              : chip.key === "open"
              ? counts.open
              : chip.key === "inprogress"
              ? counts.inProgress
              : counts.completed;

          return (
            <TouchableOpacity
              key={chip.key}
              style={[
                styles.chip,
                isActive && styles.chipActive,
                isActive && chip.color && { backgroundColor: chip.color },
              ]}
              onPress={() => setActiveFilter(chip.key)}
              activeOpacity={0.7}
            >
              <Icon
                name={chip.icon}
                size={12}
                color={isActive ? "#fff" : "#6B7280"}
                style={{ marginRight: 4 }}
                solid={isActive}
              />
              <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
                {chip.label}
              </Text>
              <View style={[styles.chipCount, isActive && styles.chipCountActive]}>
                <Text
                  style={[styles.chipCountText, isActive && styles.chipCountTextActive]}
                >
                  {count}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Issue list */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.loadingText}>Loading issues...</Text>
        </View>
      ) : filteredIssues.length === 0 ? (
        <View style={styles.centered}>
          <Icon name="inbox" size={48} color="#D1D5DB" />
          <Text style={styles.emptyTitle}>No Issues Found</Text>
          <Text style={styles.emptyText}>
            {searchText ? "Try a different search term" : "No issues match the selected filter"}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredIssues}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => (
            <IssueCard issue={item} onPress={handleIssuePress} />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => loadData(true)}
              colors={["#6D28D9"]}
              tintColor="#6D28D9"
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
};

// ===== STYLES =====
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#6D28D9",
  },
  headerBackBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#fff",
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#6D28D9",
    paddingBottom: 14,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 10,
    paddingHorizontal: 12,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
  },
  chipRow: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    gap: 6,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: "#F3F4F6",
  },
  chipActive: {
    backgroundColor: "#6D28D9",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6B7280",
  },
  chipTextActive: {
    color: "#fff",
  },
  chipCount: {
    marginLeft: 4,
    backgroundColor: "#E5E7EB",
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 20,
    alignItems: "center",
  },
  chipCountActive: {
    backgroundColor: "rgba(255,255,255,0.25)",
  },
  chipCountText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
  },
  chipCountTextActive: {
    color: "#fff",
  },
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 24,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 10,
    padding: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  cardTop: {
    marginBottom: 10,
  },
  cardIdRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  cardId: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6D28D9",
  },
  cardDate: {
    fontSize: 11,
    color: "#9CA3AF",
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    lineHeight: 20,
  },
  cardBottom: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  badgeRow: {
    flexDirection: "row",
    gap: 6,
    flex: 1,
  },
  badge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
  },
  badgeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#fff",
  },
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: "#6B7280",
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#374151",
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 6,
    textAlign: "center",
  },
  accessDenied: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  accessDeniedTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  accessDeniedText: {
    fontSize: 14,
    color: "#9CA3AF",
    marginTop: 8,
    textAlign: "center",
  },
});

export default IssueListScreen;
