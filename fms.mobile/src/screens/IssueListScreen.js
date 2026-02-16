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

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
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
  Modal,
  ScrollView,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation } from "@react-navigation/native";
import issueTrackerService from "../services/issueTrackerService";
import apiService from "../services/apiService";
import { usePermissions } from "../hooks/usePermissions";

// ===== CONSTANTS =====
const FILTER_CHIPS = [
  { key: "all", label: "All", icon: "list" },
  { key: "assignedtome", label: "Assigned to Me", icon: "user-tag", color: "#6D28D9" },
  { key: "open", label: "Open", icon: "folder-open", color: "#3B82F6" },
  { key: "inprogress", label: "In Progress", icon: "clock", color: "#F59E0B" },
  { key: "completed", label: "Completed", icon: "check-circle", color: "#10B981" },
  { key: "overdue", label: "Overdue", icon: "exclamation-triangle", color: "#EF4444" },
  { key: "unassigned", label: "Unassigned", icon: "user-slash", color: "#6B7280" },
  { key: "following", label: "Following", icon: "bell", color: "#8B5CF6" },
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

  const vehicleLabel = issue.vehicleHyoungNo || issue.vehicleNumber || null;
  const siteLabel = issue.siteName || null;

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

      {/* Vehicle / Site info row */}
      {(vehicleLabel || siteLabel) && (
        <View style={styles.cardInfoRow}>
          {vehicleLabel && (
            <View style={styles.cardInfoItem}>
              <Icon name="truck" size={10} color="#6D28D9" />
              <Text style={styles.cardInfoText} numberOfLines={1}>{vehicleLabel}</Text>
            </View>
          )}
          {siteLabel && (
            <View style={styles.cardInfoItem}>
              <Icon name="building" size={10} color="#6B7280" />
              <Text style={styles.cardInfoText} numberOfLines={1}>{siteLabel}</Text>
            </View>
          )}
        </View>
      )}

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
  const { isAdmin, hasPermission, hasAnyPermission, hasRole, userInfo } = usePermissions();

  // Permission check
  const canViewIssues = useMemo(
    () => isAdmin || hasRole("PowerUser") || hasRole("Power User") || hasAnyPermission(["_View_Issue", "_Read_Issue", "_Read_Issues"]),
    [isAdmin, hasRole, hasAnyPermission]
  );

  const [issues, setIssues] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchText, setSearchText] = useState("");
  const [statuses, setStatuses] = useState([]);

  // Filter panel state
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [sites, setSites] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedSiteId, setSelectedSiteId] = useState(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState(null);
  const [dueIssuesOnly, setDueIssuesOnly] = useState(false);
  const [datePreset, setDatePreset] = useState("all");
  const [followedIssueIds, setFollowedIssueIds] = useState(new Set());

  // Vehicle quick search state
  const [vehicleSearchText, setVehicleSearchText] = useState("");
  const [vehicleSearchResults, setVehicleSearchResults] = useState([]);
  const [vehicleSearching, setVehicleSearching] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const vehicleSearchTimeout = useRef(null);

  const handleVehicleSearch = useCallback((text) => {
    setVehicleSearchText(text);
    if (vehicleSearchTimeout.current) clearTimeout(vehicleSearchTimeout.current);
    if (!text.trim()) {
      setVehicleSearchResults([]);
      return;
    }
    vehicleSearchTimeout.current = setTimeout(async () => {
      setVehicleSearching(true);
      try {
        const results = await apiService.searchVehicles(text.trim(), 10);
        setVehicleSearchResults(Array.isArray(results) ? results : []);
      } catch (_e) {
        setVehicleSearchResults([]);
      } finally {
        setVehicleSearching(false);
      }
    }, 400);
  }, []);

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

      // Load filter options in background
      Promise.all([
        apiService.getSiteList().catch(() => []),
        issueTrackerService.getIssueCategories().catch(() => []),
        issueTrackerService.getFollowedIssues().catch(() => []),
      ]).then(([siteData, catData, followedData]) => {
        const sArr = Array.isArray(siteData?.data) ? siteData.data : Array.isArray(siteData) ? siteData : [];
        setSites(sArr);
        setCategories(Array.isArray(catData) ? catData : []);
        const ids = new Set((followedData || []).map((f) => f.issueId || f.id));
        setFollowedIssueIds(ids);
      });
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

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (selectedSiteId) count++;
    if (selectedVehicle) count++;
    if (selectedCategoryId) count++;
    if (dueIssuesOnly) count++;
    if (datePreset !== "all") count++;
    return count;
  }, [selectedSiteId, selectedVehicle, selectedCategoryId, dueIssuesOnly, datePreset]);

  const clearAllFilters = useCallback(() => {
    setSelectedSiteId(null);
    setSelectedVehicle(null);
    setVehicleSearchText("");
    setVehicleSearchResults([]);
    setSelectedCategoryId(null);
    setDueIssuesOnly(false);
    setDatePreset("all");
  }, []);

  // Map filter chip keys to status name matching
  const filteredIssues = useMemo(() => {
    let result = issues;

    // Filter by status chip
    if (activeFilter === "assignedtome") {
      const currentUserId = userInfo?.id;
      result = result.filter((issue) => {
        if (!currentUserId) return false;
        return String(issue.assignToId) === String(currentUserId);
      });
    } else if (activeFilter === "following") {
      result = result.filter((issue) => followedIssueIds.has(issue.id));
    } else if (activeFilter === "overdue") {
      const now = new Date();
      result = result.filter((issue) => {
        if (!issue.dueDate) return false;
        return new Date(issue.dueDate) < now;
      });
    } else if (activeFilter === "unassigned") {
      result = result.filter((issue) => !issue.assignToId && !issue.assignToUserName);
    } else if (activeFilter !== "all") {
      result = result.filter((issue) => {
        const statusName = (issue.statusName || "").toLowerCase().replace(/\s+/g, "");
        if (activeFilter === "open") return statusName === "open";
        if (activeFilter === "inprogress") return statusName === "inprogress" || statusName === "in-progress";
        if (activeFilter === "completed")
          return ["completed", "closed", "resolved", "done"].includes(statusName);
        return true;
      });
    }

    // Filter by site
    if (selectedSiteId) {
      result = result.filter((issue) => issue.siteId === selectedSiteId);
    }

    // Filter by vehicle
    if (selectedVehicle) {
      result = result.filter((issue) => issue.vehicleId === selectedVehicle.id);
    }

    // Filter by category
    if (selectedCategoryId) {
      result = result.filter((issue) => issue.issueCategoryId === selectedCategoryId);
    }

    // Filter due issues (due within next 7 days)
    if (dueIssuesOnly) {
      const now = new Date();
      const in7Days = new Date(now.getTime() + 7 * 86400000);
      result = result.filter((issue) => {
        if (!issue.dueDate) return false;
        const due = new Date(issue.dueDate);
        return due >= now && due <= in7Days;
      });
    }

    // Filter by date preset (creation date)
    if (datePreset !== "all") {
      const now = new Date();
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      let cutoff = null;
      if (datePreset === "today") cutoff = startOfToday;
      else if (datePreset === "7days") cutoff = new Date(now.getTime() - 7 * 86400000);
      else if (datePreset === "30days") cutoff = new Date(now.getTime() - 30 * 86400000);
      if (cutoff) {
        result = result.filter((issue) => {
          const opened = new Date(issue.openDate || issue.createdDate);
          return opened >= cutoff;
        });
      }
    }

    // Filter by search text
    if (searchText.trim()) {
      const query = searchText.toLowerCase();
      result = result.filter(
        (issue) =>
          (issue.problemTitle || "").toLowerCase().includes(query) ||
          String(issue.id).includes(query) ||
          (issue.assignToUserName || "").toLowerCase().includes(query) ||
          (issue.vehicleHyoungNo || "").toLowerCase().includes(query) ||
          (issue.vehicleNumber || "").toLowerCase().includes(query) ||
          (issue.siteName || "").toLowerCase().includes(query)
      );
    }

    return result;
  }, [issues, activeFilter, searchText, selectedSiteId, selectedVehicle, selectedCategoryId, dueIssuesOnly, datePreset, followedIssueIds, userInfo]);

  const counts = useMemo(() => {
    const all = issues.length;
    const currentUserId = userInfo?.id;
    const assignedToMe = currentUserId
      ? issues.filter((i) => String(i.assignToId) === String(currentUserId)).length
      : 0;
    const open = issues.filter((i) => (i.statusName || "").toLowerCase() === "open").length;
    const inProgress = issues.filter((i) => {
      const s = (i.statusName || "").toLowerCase().replace(/\s+/g, "");
      return s === "inprogress" || s === "in-progress";
    }).length;
    const completed = issues.filter((i) => {
      const s = (i.statusName || "").toLowerCase().replace(/\s+/g, "");
      return ["completed", "closed", "resolved", "done"].includes(s);
    }).length;
    const following = followedIssueIds.size;
    const overdue = issues.filter((i) => {
      if (!i.dueDate) return false;
      return new Date(i.dueDate) < new Date();
    }).length;
    const unassigned = issues.filter((i) => !i.assignToId && !i.assignToUserName).length;
    return { all, assignedToMe, open, inProgress, completed, following, overdue, unassigned };
  }, [issues, followedIssueIds, userInfo]);

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

      {/* Filter button */}
      <View style={styles.filterBar}>
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => setShowFilterPanel(true)}
          activeOpacity={0.7}
        >
          <Icon name="sliders-h" size={14} color={activeFilterCount > 0 ? "#6D28D9" : "#6B7280"} />
          <Text style={[styles.filterButtonText, activeFilterCount > 0 && styles.filterButtonTextActive]}>
            Filters
          </Text>
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
        {activeFilterCount > 0 && (
          <TouchableOpacity style={styles.clearFiltersBtn} onPress={clearAllFilters}>
            <Text style={styles.clearFiltersText}>Clear</Text>
            <Icon name="times" size={11} color="#EF4444" />
          </TouchableOpacity>
        )}
      </View>

      {/* Status chips - horizontal scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipRow}
        contentContainerStyle={styles.chipRowContent}
      >
        {FILTER_CHIPS.map((chip) => {
          const isActive = activeFilter === chip.key;
          const count = counts[chip.key === "inprogress" ? "inProgress" : chip.key === "assignedtome" ? "assignedToMe" : chip.key] || 0;

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
      </ScrollView>

      {/* Category filter chips */}
      {categories.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoryChipRow}
          contentContainerStyle={styles.categoryChipRowContent}
        >
          <TouchableOpacity
            style={[styles.categoryChip, !selectedCategoryId && styles.categoryChipActive]}
            onPress={() => setSelectedCategoryId(null)}
            activeOpacity={0.7}
          >
            <Icon name="tags" size={11} color={!selectedCategoryId ? "#fff" : "#6B7280"} style={{ marginRight: 4 }} />
            <Text style={[styles.categoryChipText, !selectedCategoryId && styles.categoryChipTextActive]}>
              All Categories
            </Text>
          </TouchableOpacity>
          {categories.map((cat) => {
            const cId = cat.id || cat.issueCategoryId;
            const cName = cat.name || cat.categoryName || `#${cId}`;
            const isActive = selectedCategoryId === cId;
            return (
              <TouchableOpacity
                key={cId}
                style={[styles.categoryChip, isActive && styles.categoryChipActive]}
                onPress={() => setSelectedCategoryId(isActive ? null : cId)}
                activeOpacity={0.7}
              >
                <Text style={[styles.categoryChipText, isActive && styles.categoryChipTextActive]} numberOfLines={1}>
                  {cName}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

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

      {/* ===== FILTER PANEL MODAL ===== */}
      <Modal
        visible={showFilterPanel}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterPanel(false)}
      >
        <View style={styles.pickerOverlay}>
          <View style={styles.filterPanel}>
            {/* Header */}
            <View style={styles.filterPanelHeader}>
              <Text style={styles.filterPanelTitle}>Filters</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 12 }}>
                {activeFilterCount > 0 && (
                  <TouchableOpacity onPress={clearAllFilters}>
                    <Text style={styles.filterPanelReset}>Reset</Text>
                  </TouchableOpacity>
                )}
                <TouchableOpacity onPress={() => setShowFilterPanel(false)}>
                  <Icon name="times" size={18} color="#6B7280" />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView style={styles.filterPanelBody} showsVerticalScrollIndicator={false}>
              {/* ── Vehicle Search ── */}
              <Text style={styles.filterSectionLabel}>Vehicle</Text>
              {selectedVehicle ? (
                <View style={styles.selectedChipRow}>
                  <View style={styles.selectedChip}>
                    <Icon name="truck" size={11} color="#6D28D9" />
                    <Text style={styles.selectedChipText}>{selectedVehicle.label}</Text>
                    <TouchableOpacity onPress={() => setSelectedVehicle(null)}>
                      <Icon name="times" size={11} color="#6D28D9" />
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.filterSearchBar}>
                    <Icon name="search" size={12} color="#9CA3AF" style={{ marginRight: 8 }} />
                    <TextInput
                      style={styles.filterSearchInput}
                      placeholder="Search by plate, hyoung no..."
                      placeholderTextColor="#9CA3AF"
                      value={vehicleSearchText}
                      onChangeText={handleVehicleSearch}
                    />
                    {vehicleSearching && <ActivityIndicator size="small" color="#6D28D9" />}
                  </View>
                  {vehicleSearchResults.length > 0 && (
                    <View style={styles.searchResultsList}>
                      {vehicleSearchResults.map((v) => {
                        const vId = v.id || v.vehicleId;
                        const vLabel = v.hyoungNo || v.vehicleHyoungNo || v.plateNumber || v.vehicleNumber || `#${vId}`;
                        return (
                          <TouchableOpacity
                            key={vId}
                            style={styles.searchResultItem}
                            onPress={() => {
                              setSelectedVehicle({ id: vId, label: vLabel });
                              setVehicleSearchText("");
                              setVehicleSearchResults([]);
                            }}
                          >
                            <Icon name="truck" size={12} color="#6B7280" />
                            <Text style={styles.searchResultText}>{vLabel}</Text>
                          </TouchableOpacity>
                        );
                      })}
                    </View>
                  )}
                </View>
              )}

              {/* ── Site ── */}
              <Text style={styles.filterSectionLabel}>Site</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedSiteId && styles.filterChipActive]}
                  onPress={() => setSelectedSiteId(null)}
                >
                  <Text style={[styles.filterChipText, !selectedSiteId && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {sites.map((site) => {
                  const sId = site.id || site.siteId;
                  const sName = site.name || site.siteName || `#${sId}`;
                  const isActive = selectedSiteId === sId;
                  return (
                    <TouchableOpacity
                      key={sId}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setSelectedSiteId(isActive ? null : sId)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]} numberOfLines={1}>
                        {sName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ── Category ── */}
              <Text style={styles.filterSectionLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipScroll}>
                <TouchableOpacity
                  style={[styles.filterChip, !selectedCategoryId && styles.filterChipActive]}
                  onPress={() => setSelectedCategoryId(null)}
                >
                  <Text style={[styles.filterChipText, !selectedCategoryId && styles.filterChipTextActive]}>All</Text>
                </TouchableOpacity>
                {categories.map((cat) => {
                  const cId = cat.id || cat.issueCategoryId;
                  const cName = cat.name || cat.categoryName || `#${cId}`;
                  const isActive = selectedCategoryId === cId;
                  return (
                    <TouchableOpacity
                      key={cId}
                      style={[styles.filterChip, isActive && styles.filterChipActive]}
                      onPress={() => setSelectedCategoryId(isActive ? null : cId)}
                    >
                      <Text style={[styles.filterChipText, isActive && styles.filterChipTextActive]} numberOfLines={1}>
                        {cName}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* ── Date Range ── */}
              <Text style={styles.filterSectionLabel}>Date Range</Text>
              <View style={styles.datePresetRow}>
                {[
                  { key: "all", label: "All Time" },
                  { key: "today", label: "Today" },
                  { key: "7days", label: "7 Days" },
                  { key: "30days", label: "30 Days" },
                ].map((preset) => {
                  const isActive = datePreset === preset.key;
                  return (
                    <TouchableOpacity
                      key={preset.key}
                      style={[styles.datePresetChip, isActive && styles.datePresetChipActive]}
                      onPress={() => setDatePreset(preset.key)}
                    >
                      <Text style={[styles.datePresetText, isActive && styles.datePresetTextActive]}>
                        {preset.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* ── Quick Filters ── */}
              <Text style={styles.filterSectionLabel}>Quick Filters</Text>
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setDueIssuesOnly(!dueIssuesOnly)}
                activeOpacity={0.7}
              >
                <View style={styles.toggleInfo}>
                  <Icon name="calendar-check" size={14} color={dueIssuesOnly ? "#F59E0B" : "#6B7280"} />
                  <Text style={[styles.toggleLabel, dueIssuesOnly && styles.toggleLabelActive]}>
                    Due Issues (next 7 days)
                  </Text>
                </View>
                <View style={[styles.toggleSwitch, dueIssuesOnly && styles.toggleSwitchOn]}>
                  <View style={[styles.toggleKnob, dueIssuesOnly && styles.toggleKnobOn]} />
                </View>
              </TouchableOpacity>

              <View style={{ height: 24 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  filterBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
    gap: 8,
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  filterButtonActive: {
    backgroundColor: "#EDE9FE",
    borderColor: "#C4B5FD",
  },
  filterButtonText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6B7280",
  },
  filterButtonTextActive: {
    color: "#6D28D9",
  },
  filterBadge: {
    backgroundColor: "#6D28D9",
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 5,
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#fff",
  },
  clearFiltersBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 6,
    gap: 4,
  },
  clearFiltersText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#EF4444",
  },
  chipRow: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexGrow: 0,
    flexShrink: 0,
  },
  chipRowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
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
    marginBottom: 6,
  },
  cardInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 8,
  },
  cardInfoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    maxWidth: "45%",
  },
  cardInfoText: {
    fontSize: 11,
    color: "#6B7280",
    fontWeight: "500",
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
  // Filter panel modal styles
  pickerOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  filterPanel: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
    paddingBottom: 24,
  },
  filterPanelHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  filterPanelTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1F2937",
  },
  filterPanelReset: {
    fontSize: 14,
    fontWeight: "600",
    color: "#EF4444",
  },
  filterPanelBody: {
    paddingHorizontal: 20,
  },
  filterSectionLabel: {
    fontSize: 13,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  filterSearchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F3F4F6",
    borderRadius: 8,
    paddingHorizontal: 12,
    height: 40,
  },
  filterSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1F2937",
    paddingVertical: 0,
  },
  searchResultsList: {
    backgroundColor: "#F9FAFB",
    borderRadius: 8,
    marginTop: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchResultItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  searchResultText: {
    flex: 1,
    fontSize: 14,
    color: "#374151",
  },
  selectedChipRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  selectedChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EDE9FE",
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    gap: 6,
  },
  selectedChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6D28D9",
  },
  filterChipScroll: {
    marginBottom: 4,
  },
  filterChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: "#6D28D9",
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  filterChipTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  datePresetRow: {
    flexDirection: "row",
    gap: 6,
    flexWrap: "wrap",
  },
  datePresetChip: {
    backgroundColor: "#F3F4F6",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  datePresetChipActive: {
    backgroundColor: "#6D28D9",
  },
  datePresetText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6B7280",
  },
  datePresetTextActive: {
    color: "#fff",
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F3F4F6",
  },
  toggleInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: "500",
    color: "#374151",
  },
  toggleLabelActive: {
    color: "#6D28D9",
    fontWeight: "600",
  },
  toggleSwitch: {
    width: 42,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#D1D5DB",
    justifyContent: "center",
    paddingHorizontal: 2,
  },
  toggleSwitchOn: {
    backgroundColor: "#6D28D9",
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
  },
  toggleKnobOn: {
    alignSelf: "flex-end",
  },
  // Category chips
  categoryChipRow: {
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    flexGrow: 0,
    flexShrink: 0,
  },
  categoryChipRowContent: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
  },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryChipActive: {
    backgroundColor: "#6D28D9",
    borderColor: "#6D28D9",
  },
  categoryChipText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#6B7280",
  },
  categoryChipTextActive: {
    color: "#fff",
  },
});

export default IssueListScreen;
