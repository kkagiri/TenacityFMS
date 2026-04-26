/**
 * File: IssueDetailScreen.js
 * Purpose: Detailed issue view for mobile with tabbed sections:
 *          Overview, Activity Stream, Attachments.
 *          Features quick actions (Follow/Unfollow, Complete, Close),
 *          property sections, vehicle navigation, and attachment upload.
 * Dependencies: React Native, issueTrackerService, usePermissions
 * Last Modified: 2026-02-16
 *
 * Key Sections:
 * - Header with quick action menu
 * - Overview: ID, Status, Priority, Description, Assignment & Tracking, Asset Information
 * - Activity Stream: Real-time activity feed with avatars & timestamps
 * - Attachments: Grid layout with upload via camera/file picker
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  FlatList,
  Linking,
  Platform,
  TextInput,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useNavigation, useRoute } from "@react-navigation/native";
import { launchImageLibrary, launchCamera } from "react-native-image-picker";
import issueTrackerService from "../../services/issueTrackerService";
import { usePermissions } from "../../hooks/usePermissions";
import { API_CONFIG } from "../../config/environment";

// ===== HELPERS =====
const formatDateTime = (value) => {
  if (!value) return "Not available";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "Not available";
  return d.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

const formatRelativeTime = (value) => {
  if (!value) return "";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "";
  const now = new Date();
  const diffMs = now - d;
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
};

const getInitials = (name) => {
  if (!name) return "?";
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return parts[0].substring(0, 2).toUpperCase();
};

const AVATAR_COLORS = [
  "#6366F1",
  "#8B5CF6",
  "#EC4899",
  "#14B8A6",
  "#F97316",
  "#3B82F6",
];
const getAvatarColor = (name) => {
  if (!name) return AVATAR_COLORS[0];
  let hash = 0;
  for (let i = 0; i < name.length; i++)
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
};

const getPriorityConfig = (priority) => {
  if (!priority) return { bg: "#F3F4F6", text: "#6B7280", label: "—", icon: "minus" };
  switch (String(priority).toLowerCase()) {
    case "critical":
      return { bg: "#FEE2E2", text: "#991B1B", label: "Critical", icon: "exclamation-triangle" };
    case "high":
      return { bg: "#FFEDD5", text: "#9A3412", label: "High", icon: "chevron-up" };
    case "medium":
      return { bg: "#FEF9C3", text: "#854D0E", label: "Medium", icon: "minus" };
    case "low":
      return { bg: "#DCFCE7", text: "#166534", label: "Low", icon: "chevron-down" };
    default:
      return { bg: "#F3F4F6", text: "#6B7280", label: priority, icon: "question" };
  }
};

const getStatusConfig = (status) => {
  if (!status) return { bg: "#F3F4F6", text: "#6B7280", label: "—", dot: "#9CA3AF" };
  const n = String(status).toLowerCase().replace(/\s+/g, "");
  switch (n) {
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

const normalizeIssueTags = (issue) => {
  if (!issue) return [];
  if (Array.isArray(issue.issueCategoryTagNames) && issue.issueCategoryTagNames.length > 0) {
    return issue.issueCategoryTagNames;
  }
  if (issue.categoryName) {
    return [issue.categoryName];
  }
  return [];
};

const ACTIVITY_ICONS = {
  Created: { icon: "plus-circle", color: "#10B981" },
  Updated: { icon: "pen", color: "#3B82F6" },
  StatusChanged: { icon: "exchange-alt", color: "#8B5CF6" },
  PriorityChanged: { icon: "arrow-up", color: "#F97316" },
  Assigned: { icon: "user-check", color: "#6366F1" },
  ReminderSet: { icon: "bell", color: "#EAB308" },
  Followed: { icon: "bell", color: "#3B82F6" },
  Unfollowed: { icon: "bell-slash", color: "#6B7280" },
  Closed: { icon: "check-circle", color: "#6B7280" },
  Reopened: { icon: "redo-alt", color: "#F59E0B" },
  AttachmentAdded: { icon: "paperclip", color: "#14B8A6" },
};

const getActivityIcon = (type) =>
  ACTIVITY_ICONS[type] || { icon: "clock", color: "#9CA3AF" };

const formatFileSize = (bytes) => {
  if (!bytes) return "0 B";
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

const TAB_KEYS = ["overview", "activity", "attachments"];
const TABS = [
  { key: "overview", label: "Overview", icon: "info-circle" },
  { key: "activity", label: "Activity", icon: "history" },
  { key: "attachments", label: "Files", icon: "paperclip" },
];

// ===== MAIN SCREEN =====
const IssueDetailScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { issueId } = route.params;
  const { hasPermission, hasAnyPermission, userInfo } = usePermissions();

  const canView = useMemo(
    () => hasAnyPermission(["_View_Issue", "_Read_Issue", "_Read_Issues", "_Edit_Issues", "_Approve_Issues"]),
    [hasAnyPermission]
  );

  // State
  const [issue, setIssue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);

  // Activity
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);

  // Attachments
  const [attachments, setAttachments] = useState([]);
  const [attachmentsLoading, setAttachmentsLoading] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);

  // Notes dialog (Android fallback for Alert.prompt)
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notesDialogMode, setNotesDialogMode] = useState(null); // 'close' | 'complete'
  const [actionNotes, setActionNotes] = useState("");

  // ===== DATA LOADING =====
  const loadIssue = useCallback(
    async (isRefresh = false) => {
      try {
        if (isRefresh) setRefreshing(true);
        else setLoading(true);

        const [issueData, followStatus] = await Promise.all([
          issueTrackerService.getIssueById(issueId),
          issueTrackerService.isFollowingIssue(issueId),
        ]);

        setIssue(issueData);
        setIsFollowing(followStatus?.isFollowing || false);
      } catch (error) {
        console.error("[IssueDetailScreen] loadIssue error:", error);
        if (error?.isNotFound || error?.status === 404) {
          setIssue(null);
        } else {
          Alert.alert("Error", "Unable to load issue details.");
        }
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [issueId]
  );

  const loadActivities = useCallback(async () => {
    setActivitiesLoading(true);
    try {
      const data = await issueTrackerService.getIssueActivities(issueId);
      setActivities(data);
    } catch (_e) {
      setActivities([]);
    } finally {
      setActivitiesLoading(false);
    }
  }, [issueId]);

  const loadAttachments = useCallback(async () => {
    setAttachmentsLoading(true);
    try {
      const data = await issueTrackerService.getAttachments(issueId);
      setAttachments(Array.isArray(data) ? data : []);
    } catch (_e) {
      setAttachments([]);
    } finally {
      setAttachmentsLoading(false);
    }
  }, [issueId]);

  useEffect(() => {
    if (canView) loadIssue();
  }, [canView, loadIssue]);

  // Load tab-specific data
  useEffect(() => {
    if (!issue) return;
    if (activeTab === "activity") loadActivities();
    if (activeTab === "attachments") loadAttachments();
  }, [activeTab, issue, loadActivities, loadAttachments]);

  // ===== ACTIONS =====
  const handleToggleFollow = useCallback(async () => {
    if (!issue?.id) return;
    setIsFollowLoading(true);
    try {
      if (isFollowing) {
        await issueTrackerService.unfollowIssue(issue.id);
        setIsFollowing(false);
      } else {
        await issueTrackerService.followIssue(issue.id);
        setIsFollowing(true);
      }
      if (activeTab === "activity") loadActivities();
    } catch (error) {
      const serverMsg =
        error?.response?.data?.message ||
        error?.response?.data?.Message ||
        error?.response?.data?.errors?.join(", ") ||
        error?.message ||
        "Unable to update follow preference.";
      console.error("[IssueDetail] Follow error:", error?.response?.status, error?.response?.data);
      Alert.alert("Follow Error", serverMsg);
    } finally {
      setIsFollowLoading(false);
    }
  }, [issue, isFollowing, activeTab, loadActivities]);

  const doMarkComplete = useCallback(async (notes) => {
    if (!issue?.id) return;
    setIsSaving(true);
    try {
      await issueTrackerService.markIssueComplete(issue.id, notes || null);
      await loadIssue(true);
      if (activeTab === "activity") loadActivities();
      Alert.alert("Success", "Issue marked as complete.");
    } catch (_e) {
      Alert.alert("Error", "Unable to mark issue as complete.");
    } finally {
      setIsSaving(false);
      setShowQuickActions(false);
      setShowNotesDialog(false);
      setNotesDialogMode(null);
      setActionNotes("");
    }
  }, [issue, loadIssue, activeTab, loadActivities]);

  const handleMarkComplete = useCallback(() => {
    if (!issue?.id) return;
    setShowQuickActions(false);

    if (Platform.OS === "ios") {
      Alert.prompt(
        "Mark as Complete",
        "Completion notes (optional). These notes will be saved in the activity log and notify the issue opener:",
        (notes) => doMarkComplete(notes),
        "plain-text"
      );
    } else {
      setActionNotes("");
      setNotesDialogMode("complete");
      setShowNotesDialog(true);
    }
  }, [issue, doMarkComplete]);

  const doCloseIssue = useCallback(async (notes) => {
    if (!issue?.id) return;
    setIsSaving(true);
    try {
      await issueTrackerService.closeIssue(issue.id, notes || null);
      await loadIssue(true);
      if (activeTab === "activity") loadActivities();
      Alert.alert("Success", "Issue closed successfully.");
    } catch (_e) {
      // error alert shown in service
    } finally {
      setIsSaving(false);
      setShowQuickActions(false);
      setShowNotesDialog(false);
      setNotesDialogMode(null);
      setActionNotes("");
    }
  }, [issue, loadIssue, activeTab, loadActivities]);

  const handleCloseIssue = useCallback(() => {
    if (!issue?.id) return;
    setShowQuickActions(false);

    if (Platform.OS === "ios") {
      // iOS supports Alert.prompt with text input
      Alert.prompt(
        "Close Issue",
        "Enter closing/approval notes (optional):",
        (notes) => doCloseIssue(notes),
        "plain-text"
      );
    } else {
      // Android — show custom dialog with TextInput
      setActionNotes("");
      setNotesDialogMode("close");
      setShowNotesDialog(true);
    }
  }, [issue, doCloseIssue]);

  const handleUploadAttachment = useCallback(() => {
    Alert.alert("Upload Attachment", "Choose source:", [
      {
        text: "Camera",
        onPress: () => {
          launchCamera(
            { mediaType: "photo", quality: 0.8, maxWidth: 1920, maxHeight: 1920 },
            async (result) => {
              if (result.didCancel || result.errorCode || !result.assets?.[0]) return;
              const asset = result.assets[0];
              try {
                await issueTrackerService.uploadAttachment(
                  issueId,
                  asset.uri,
                  asset.fileName || "photo.jpg",
                  asset.type || "image/jpeg",
                  "General"
                );
                Alert.alert("Success", "Attachment uploaded.");
                loadAttachments();
                if (activeTab === "activity") loadActivities();
              } catch (err) {
                Alert.alert("Upload Failed", err?.message || "Unable to upload attachment.");
              }
            }
          );
        },
      },
      {
        text: "Photo Library",
        onPress: () => {
          launchImageLibrary(
            { mediaType: "mixed", selectionLimit: 1, quality: 0.8 },
            async (result) => {
              if (result.didCancel || result.errorCode || !result.assets?.[0]) return;
              const asset = result.assets[0];
              try {
                await issueTrackerService.uploadAttachment(
                  issueId,
                  asset.uri,
                  asset.fileName || "attachment",
                  asset.type || "application/octet-stream",
                  "General"
                );
                Alert.alert("Success", "Attachment uploaded.");
                loadAttachments();
                if (activeTab === "activity") loadActivities();
              } catch (err) {
                Alert.alert("Upload Failed", err?.message || "Unable to upload attachment.");
              }
            }
          );
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  }, [issueId, loadAttachments, activeTab, loadActivities]);

  const handleDeleteAttachment = useCallback(
    (att) => {
      Alert.alert("Delete Attachment", `Delete "${att.fileName}"?`, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await issueTrackerService.deleteAttachment(issueId, att.id);
              loadAttachments();
              if (activeTab === "activity") loadActivities();
            } catch (_e) {
              Alert.alert("Error", "Failed to delete attachment.");
            }
          },
        },
      ]);
    },
    [issueId, loadAttachments, activeTab, loadActivities]
  );

  const handleNavigateToVehicle = useCallback(() => {
    if (issue?.vehicleId) {
      navigation.navigate("VehicleDetails", { vehicleId: issue.vehicleId });
    }
  }, [issue, navigation]);

  const handleRefresh = useCallback(async () => {
    await loadIssue(true);
    if (activeTab === "activity") loadActivities();
    if (activeTab === "attachments") loadAttachments();
  }, [loadIssue, activeTab, loadActivities, loadAttachments]);

  // ===== COMPUTED =====
  const priorityConfig = useMemo(
    () => getPriorityConfig(issue?.priorityName),
    [issue?.priorityName]
  );
  const statusConfig = useMemo(
    () => getStatusConfig(issue?.statusName),
    [issue?.statusName]
  );

  const isCompleted = useMemo(() => {
    const s = (issue?.statusName || "").toLowerCase().replace(/\s+/g, "");
    return ["complete", "completed", "close", "closed", "resolved", "done"].includes(s);
  }, [issue?.statusName]);

  // Permission-based action guards (no hardcoded role bypass)
  const canEdit = useMemo(
    () => hasAnyPermission(["_Edit_Issues", "_Edit_Issue"]),
    [hasAnyPermission]
  );

  const canApprove = useMemo(
    () => hasAnyPermission(["_Approve_Issues", "_Approve_Issue"]),
    [hasAnyPermission]
  );

  const canDelete = useMemo(
    () => hasAnyPermission(["_Delete_Issues", "_Delete_Issue"]),
    [hasAnyPermission]
  );

  const isIssueOpener = useMemo(() => {
    if (!userInfo?.id || !issue) return false;
    return (
      String(userInfo.id) === String(issue.openbyId || issue.openById || issue.openBy)
    );
  }, [userInfo, issue]);

  const canCloseIssue = useMemo(
    () => canApprove || isIssueOpener,
    [canApprove, isIssueOpener]
  );

  const issueTagNames = useMemo(() => normalizeIssueTags(issue), [issue]);

  // ===== TAB RENDERERS (must be before return) =====

  const renderOverview = () => {
    if (!issue) return null;
    return (
      <View style={styles.overviewContainer}>
        {/* Description */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Icon name="align-left" size={14} color="#6D28D9" />
            <Text style={styles.sectionTitle}>  Description</Text>
          </View>
          <Text style={styles.descriptionText}>
            {issue.problemDescription || "No description provided."}
          </Text>
        </View>

        {/* Assignment & Tracking */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Icon name="users" size={14} color="#6D28D9" />
            <Text style={styles.sectionTitle}>  Assignment & Tracking</Text>
          </View>
          <View style={styles.propertyGrid}>
            <PropertyRow
              label="Assigned To"
              value={issue.assignToUserName || "Unassigned"}
              icon="user-check"
              showAvatar
            />
            <PropertyRow
              label="Opened By"
              value={issue.openbyUserName || "Unknown"}
              icon="user"
              showAvatar
            />
            <PropertyRow
              label="Opened"
              value={formatDateTime(issue.openDate)}
              icon="calendar-plus"
            />
            <PropertyRow
              label="Due Date"
              value={formatDateTime(issue.dueDate)}
              icon="calendar-alt"
            />
            {issue.closingDate && (
              <PropertyRow
                label="Closed"
                value={formatDateTime(issue.closingDate)}
                icon="calendar-check"
              />
            )}
          </View>
        </View>

        {/* Asset Information */}
        <View style={styles.section}>
          <View style={styles.sectionTitleRow}>
            <Icon name="truck" size={14} color="#6D28D9" />
            <Text style={styles.sectionTitle}>  Asset Information</Text>
          </View>
          <View style={styles.propertyGrid}>
            {/* Vehicle — tappable to navigate to VehicleDetails */}
            {issue.vehicleId ? (
              <TouchableOpacity
                onPress={handleNavigateToVehicle}
                activeOpacity={0.6}
              >
                <View style={styles.propertyRow}>
                  <View style={styles.propertyIconBox}>
                    <Icon name="truck" size={12} color="#6D28D9" />
                  </View>
                  <View style={styles.propertyContent}>
                    <Text style={styles.propertyLabel}>Vehicle</Text>
                    <View style={styles.linkRow}>
                      <Text style={styles.propertyValueLink}>
                        {issue.vehicleCode || issue.vehicleNumber || `#${issue.vehicleId}`}
                      </Text>
                      <Icon name="external-link-alt" size={10} color="#6D28D9" style={{ marginLeft: 6 }} />
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ) : (
              <PropertyRow label="Vehicle" value="Not linked" icon="truck" />
            )}

            <PropertyRow
              label="Site"
              value={issue.siteName || "Not specified"}
              icon="building"
            />
            {(issue.deviceId || issue.deviceTypeName) && (
              <PropertyRow
                label="Device"
                value={issue.deviceTypeName || `Device #${issue.deviceId}`}
                icon="microchip"
              />
            )}
          </View>
        </View>
      </View>
    );
  };

  const renderActivityStream = () => {
    if (activitiesLoading) {
      return (
        <View style={styles.tabLoading}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.tabLoadingText}>Loading activities...</Text>
        </View>
      );
    }

    if (activities.length === 0) {
      return (
        <View style={styles.tabEmpty}>
          <Icon name="history" size={40} color="#D1D5DB" />
          <Text style={styles.tabEmptyText}>No activity recorded yet.</Text>
        </View>
      );
    }

    return (
      <View style={styles.activityContainer}>
        {activities.map((activity, index) => {
          const activityIconInfo = getActivityIcon(activity.activityType);
          const desc = activity.description || "";
          const match = desc.match(/^(.+?)\s+has\s+(.+)$/);
          const userName = match ? match[1] : "";
          const actionText = match ? `has ${match[2]}` : desc;
          const isLast = index === activities.length - 1;

          return (
            <View key={activity.id || index} style={styles.activityRow}>
              {/* Timeline line */}
              {!isLast && <View style={styles.timelineLine} />}

              {/* Icon */}
              <View style={[styles.activityIconBox, { backgroundColor: activityIconInfo.color + "20" }]}>
                <Icon name={activityIconInfo.icon} size={12} color={activityIconInfo.color} solid />
              </View>

              {/* Content */}
              <View style={styles.activityContent}>
                <View style={styles.activityHeader}>
                  {userName ? (
                    <View style={[styles.miniAvatar, { backgroundColor: getAvatarColor(userName) }]}>
                      <Text style={styles.miniAvatarText}>{getInitials(userName)}</Text>
                    </View>
                  ) : null}
                  <Text style={styles.activityTime}>
                    {formatRelativeTime(activity.activityDate)}
                  </Text>
                </View>
                <Text style={styles.activityDesc}>
                  {userName ? (
                    <Text style={styles.activityUser}>{userName} </Text>
                  ) : null}
                  {actionText}
                </Text>
              </View>
            </View>
          );
        })}
      </View>
    );
  };

  const renderAttachments = () => {
    return (
      <View>
        {/* Upload button — requires _Edit_Issues permission */}
        {canEdit && (
          <TouchableOpacity
            style={styles.uploadButton}
            onPress={handleUploadAttachment}
            activeOpacity={0.7}
          >
            <Icon name="plus" size={16} color="#6D28D9" />
            <Text style={styles.uploadButtonText}>Add Attachment</Text>
          </TouchableOpacity>
        )}

        {attachmentsLoading ? (
          <View style={styles.tabLoading}>
            <ActivityIndicator size="large" color="#6D28D9" />
            <Text style={styles.tabLoadingText}>Loading attachments...</Text>
          </View>
        ) : attachments.length === 0 ? (
          <View style={styles.tabEmpty}>
            <Icon name="paperclip" size={40} color="#D1D5DB" />
            <Text style={styles.tabEmptyText}>No attachments yet.</Text>
            <Text style={styles.tabEmptySubtext}>
              Upload photos, documents, or other files.
            </Text>
          </View>
        ) : (
          <View style={styles.attachmentList}>
            {attachments.map((att) => (
              <View key={att.id} style={styles.attachmentCard}>
                <View style={styles.attachmentIcon}>
                  <Icon
                    name={getAttachmentIcon(att.attachmentCategory)}
                    size={16}
                    color="#6D28D9"
                  />
                </View>
                <View style={styles.attachmentInfo}>
                  <Text style={styles.attachmentName} numberOfLines={1}>
                    {att.fileName}
                  </Text>
                  <Text style={styles.attachmentMeta}>
                    {att.attachmentCategory || "General"} · {formatFileSize(att.fileSize)} ·{" "}
                    {formatRelativeTime(att.uploadedAt)}
                  </Text>
                </View>
                {canDelete && (
                  <TouchableOpacity
                    style={styles.attachmentDeleteBtn}
                    onPress={() => handleDeleteAttachment(att)}
                  >
                    <Icon name="trash-alt" size={14} color="#EF4444" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  // ===== LOADING / ACCESS DENIED =====
  if (!canView) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6D28D9" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Icon name="lock" size={48} color="#9CA3AF" />
          <Text style={styles.centeredTitle}>Access Denied</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6D28D9" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#6D28D9" />
          <Text style={styles.centeredText}>Loading issue...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!issue) {
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" backgroundColor="#6D28D9" />
        <View style={styles.header}>
          <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
            <Icon name="arrow-left" size={18} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Issue Details</Text>
          <View style={{ width: 40 }} />
        </View>
        <View style={styles.centered}>
          <Icon name="exclamation-circle" size={48} color="#EF4444" />
          <Text style={styles.centeredTitle}>Issue not found</Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Go Back</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ===== RENDER =====
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#6D28D9" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn} onPress={() => navigation.goBack()}>
          <Icon name="arrow-left" size={18} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerSubtitle}>Issue #{issue.id}</Text>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {issue.problemTitle || "Untitled"}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.headerBtn}
          onPress={() => setShowQuickActions(true)}
        >
          <Icon name="ellipsis-v" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Follow bar */}
      <TouchableOpacity
        style={[styles.followBar, isFollowing && styles.followBarActive]}
        onPress={handleToggleFollow}
        disabled={isFollowLoading}
        activeOpacity={0.7}
      >
        <Icon
          name={isFollowing ? "bell" : "bell-slash"}
          size={14}
          color={isFollowing ? "#6D28D9" : "#9CA3AF"}
          solid={isFollowing}
        />
        <Text
          style={[
            styles.followBarText,
            isFollowing && styles.followBarTextActive,
          ]}
        >
          {isFollowing
            ? "Receiving notifications"
            : "Tap to follow this issue"}
        </Text>
        {isFollowLoading && (
          <ActivityIndicator size="small" color="#6D28D9" style={{ marginLeft: 8 }} />
        )}
      </TouchableOpacity>

      {/* Badges row */}
      <View style={styles.badgesRow}>
        <View style={[styles.bigBadge, { backgroundColor: statusConfig.bg }]}>
          <View style={[styles.badgeDot, { backgroundColor: statusConfig.dot }]} />
          <Text style={[styles.bigBadgeText, { color: statusConfig.text }]}>
            {statusConfig.label}
          </Text>
        </View>
        <View style={[styles.bigBadge, { backgroundColor: priorityConfig.bg }]}>
          <Icon name={priorityConfig.icon} size={10} color={priorityConfig.text} />
          <Text style={[styles.bigBadgeText, { color: priorityConfig.text, marginLeft: 4 }]}>
            {priorityConfig.label}
          </Text>
        </View>
        {issueTagNames.map((tagName) => (
          <View key={tagName} style={[styles.bigBadge, { backgroundColor: "#F3F4F6" }]}>
            <Icon name="tag" size={10} color="#6B7280" />
            <Text style={[styles.bigBadgeText, { color: "#6B7280", marginLeft: 4 }]}>
              {tagName}
            </Text>
          </View>
        ))}
      </View>

      {/* Tabs */}
      <View style={styles.tabBar}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[styles.tab, isActive && styles.tabActive]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Icon
                name={tab.icon}
                size={14}
                color={isActive ? "#6D28D9" : "#9CA3AF"}
                solid={isActive}
              />
              <Text style={[styles.tabText, isActive && styles.tabTextActive]}>
                {tab.label}
                {tab.key === "attachments" ? ` (${attachments.length})` : ""}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab Content */}
      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 32 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={["#6D28D9"]}
            tintColor="#6D28D9"
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "overview" && renderOverview()}
        {activeTab === "activity" && renderActivityStream()}
        {activeTab === "attachments" && renderAttachments()}
      </ScrollView>

      {/* Quick Actions Modal */}
      <Modal
        visible={showQuickActions}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQuickActions(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowQuickActions(false)}
        >
          <View style={styles.quickActionsSheet}>
            <Text style={styles.quickActionsTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.quickActionItem}
              onPress={handleToggleFollow}
              disabled={isFollowLoading}
            >
              <Icon
                name={isFollowing ? "bell-slash" : "bell"}
                size={16}
                color="#6D28D9"
              />
              <Text style={styles.quickActionText}>
                {isFollowing ? "Unfollow Issue" : "Follow Issue"}
              </Text>
            </TouchableOpacity>

            {!isCompleted && canEdit && (
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={handleMarkComplete}
                disabled={isSaving}
              >
                <Icon name="check-circle" size={16} color="#10B981" />
                <Text style={styles.quickActionText}>Mark as Complete</Text>
              </TouchableOpacity>
            )}

            {!isCompleted && canCloseIssue && (
              <TouchableOpacity
                style={styles.quickActionItem}
                onPress={handleCloseIssue}
                disabled={isSaving}
              >
                <Icon name="lock" size={16} color="#6B7280" />
                <Text style={styles.quickActionText}>
                  {canApprove ? "Close Issue (Approver)" : "Close Issue"}
                </Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[styles.quickActionItem, styles.quickActionCancel]}
              onPress={() => setShowQuickActions(false)}
            >
              <Icon name="times" size={16} color="#EF4444" />
              <Text style={[styles.quickActionText, { color: "#EF4444" }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Notes Dialog (Android) */}
      <Modal
        visible={showNotesDialog}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setShowNotesDialog(false);
          setNotesDialogMode(null);
          setActionNotes("");
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setShowNotesDialog(false);
            setNotesDialogMode(null);
            setActionNotes("");
          }}
        >
          <View style={styles.closeDialogSheet}>
            <Text style={styles.closeDialogTitle}>
              {notesDialogMode === "complete" ? "Mark as Complete" : "Close Issue"}
            </Text>
            <Text style={styles.closeDialogSubtitle}>
              {notesDialogMode === "complete"
                ? "Completion notes (optional). These notes will be saved in the activity log and notify the issue opener:"
                : "Enter closing/approval notes (optional):"}
            </Text>
            <TextInput
              style={styles.closeDialogInput}
              value={actionNotes}
              onChangeText={setActionNotes}
              placeholder="Enter notes..."
              placeholderTextColor="#9CA3AF"
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoFocus
            />
            <View style={styles.closeDialogButtons}>
              <TouchableOpacity
                style={styles.closeDialogCancelBtn}
                onPress={() => {
                  setShowNotesDialog(false);
                  setNotesDialogMode(null);
                  setActionNotes("");
                }}
              >
                <Text style={styles.closeDialogCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeDialogConfirmBtn}
                onPress={() => {
                  if (notesDialogMode === "complete") {
                    doMarkComplete(actionNotes);
                  } else {
                    doCloseIssue(actionNotes);
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? (
                  <ActivityIndicator size="small" color="#fff" />
                ) : (
                  <Text style={styles.closeDialogConfirmText}>
                    {notesDialogMode === "complete" ? "Mark Complete" : "Close Issue"}
                  </Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

// ===== PROPERTY ROW =====
const PropertyRow = ({ label, value, icon, showAvatar = false }) => (
  <View style={styles.propertyRow}>
    <View style={styles.propertyIconBox}>
      <Icon name={icon} size={12} color="#6D28D9" />
    </View>
    <View style={styles.propertyContent}>
      <Text style={styles.propertyLabel}>{label}</Text>
      <View style={{ flexDirection: "row", alignItems: "center" }}>
        {showAvatar && value && value !== "Unassigned" && value !== "Unknown" && (
          <View
            style={[
              styles.miniAvatar,
              { backgroundColor: getAvatarColor(value), marginRight: 6 },
            ]}
          >
            <Text style={styles.miniAvatarText}>{getInitials(value)}</Text>
          </View>
        )}
        <Text style={styles.propertyValue}>{value}</Text>
      </View>
    </View>
  </View>
);

const getAttachmentIcon = (category) => {
  switch ((category || "").toLowerCase()) {
    case "installation":
      return "camera";
    case "calibration":
      return "ruler-combined";
    default:
      return "file";
  }
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
    paddingVertical: 12,
    backgroundColor: "#6D28D9",
  },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: {
    flex: 1,
    alignItems: "center",
    marginHorizontal: 12,
  },
  headerSubtitle: {
    fontSize: 11,
    color: "rgba(255,255,255,0.7)",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#fff",
  },
  followBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#F9FAFB",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  followBarActive: {
    backgroundColor: "#EDE9FE",
  },
  followBarText: {
    fontSize: 12,
    color: "#9CA3AF",
    marginLeft: 6,
    fontWeight: "500",
  },
  followBarTextActive: {
    color: "#6D28D9",
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  bigBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  badgeDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: 5,
  },
  bigBadgeText: {
    fontSize: 12,
    fontWeight: "600",
  },
  tabBar: {
    flexDirection: "row",
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 5,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: "#6D28D9",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#9CA3AF",
  },
  tabTextActive: {
    color: "#6D28D9",
  },
  content: {
    flex: 1,
  },

  // Overview
  overviewContainer: {
    padding: 16,
  },
  section: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
  },
  sectionTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#374151",
  },
  descriptionText: {
    fontSize: 14,
    color: "#4B5563",
    lineHeight: 22,
  },
  propertyGrid: {
    gap: 10,
  },
  propertyRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  propertyIconBox: {
    width: 30,
    height: 30,
    borderRadius: 8,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  propertyContent: {
    flex: 1,
  },
  propertyLabel: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  propertyValue: {
    fontSize: 14,
    color: "#111827",
    fontWeight: "500",
    marginTop: 1,
  },
  propertyValueLink: {
    fontSize: 14,
    color: "#6D28D9",
    fontWeight: "600",
    marginTop: 1,
  },
  linkRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 1,
  },
  miniAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  miniAvatarText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#fff",
  },

  // Activity
  activityContainer: {
    padding: 16,
  },
  activityRow: {
    flexDirection: "row",
    marginBottom: 4,
    minHeight: 56,
  },
  timelineLine: {
    position: "absolute",
    left: 15,
    top: 32,
    bottom: -4,
    width: 2,
    backgroundColor: "#E5E7EB",
  },
  activityIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
    zIndex: 1,
  },
  activityContent: {
    flex: 1,
    paddingBottom: 12,
  },
  activityHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: "#9CA3AF",
    fontWeight: "500",
  },
  activityDesc: {
    fontSize: 13,
    color: "#4B5563",
    lineHeight: 18,
  },
  activityUser: {
    fontWeight: "600",
    color: "#111827",
  },

  // Attachments
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    margin: 16,
    marginBottom: 8,
    paddingVertical: 12,
    backgroundColor: "#EDE9FE",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#C4B5FD",
    borderStyle: "dashed",
    gap: 8,
  },
  uploadButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6D28D9",
  },
  attachmentList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  attachmentCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    borderWidth: 1,
    borderColor: "#F3F4F6",
  },
  attachmentIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#EDE9FE",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 13,
    fontWeight: "600",
    color: "#111827",
  },
  attachmentMeta: {
    fontSize: 11,
    color: "#9CA3AF",
    marginTop: 2,
  },
  attachmentDeleteBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },

  // Quick Actions Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  quickActionsSheet: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 20,
  },
  quickActionsTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#111827",
    textAlign: "center",
    marginBottom: 16,
  },
  quickActionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 10,
    gap: 12,
  },
  quickActionText: {
    fontSize: 15,
    fontWeight: "500",
    color: "#374151",
  },
  quickActionCancel: {
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 14,
  },

  // Shared
  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 32,
  },
  centeredTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#374151",
    marginTop: 16,
  },
  centeredText: {
    fontSize: 14,
    color: "#6B7280",
    marginTop: 12,
  },
  backButton: {
    marginTop: 16,
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#6D28D9",
    borderRadius: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
  tabLoading: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  tabLoadingText: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 12,
  },
  tabEmpty: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  tabEmptyText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6B7280",
    marginTop: 12,
  },
  tabEmptySubtext: {
    fontSize: 13,
    color: "#9CA3AF",
    marginTop: 4,
  },
  // Close Dialog (Android)
  closeDialogSheet: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    width: "85%",
    alignSelf: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
  },
  closeDialogTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1F2937",
    marginBottom: 4,
  },
  closeDialogSubtitle: {
    fontSize: 13,
    color: "#6B7280",
    marginBottom: 12,
  },
  closeDialogInput: {
    borderWidth: 1,
    borderColor: "#D1D5DB",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: "#1F2937",
    minHeight: 80,
    backgroundColor: "#F9FAFB",
  },
  closeDialogButtons: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 16,
    gap: 10,
  },
  closeDialogCancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#F3F4F6",
  },
  closeDialogCancelText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#6B7280",
  },
  closeDialogConfirmBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#6D28D9",
    minWidth: 100,
    alignItems: "center",
  },
  closeDialogConfirmText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});

export default IssueDetailScreen;
