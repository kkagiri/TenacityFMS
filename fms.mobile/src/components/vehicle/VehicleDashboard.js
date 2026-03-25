/**
 * File: VehicleDashboard.js
 * Purpose: Vehicle tracking dashboard with summary cards (Total GPS, Online, Moving, Parked, Stopped),
 *          tag-based group selection, and a searchable vehicle list showing live status.
 *
 * Data Source: Uses FMS.Application.Services.Dashboard.DataSourceManager (fleet_total_gps)
 *             via GET /api/v1/dashboard/data-sources/fleet_total_gps/initial
 *
 * Performance: Vehicles are loaded per-tag (not all 587+ at once).
 *              User selects a tag/group first, then sees vehicles in that group.
 *              Summary cards show global totals from DataSourceManager fleet data source.
 *
 * Last Modified: 2026-03-25
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Modal,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useDispatch, useSelector } from "react-redux";
import ApiService from "../../services/apiService";
import {
  fetchTrackingSummary,
} from "../../redux/slices/vehicleSlice";

const SUMMARY_CARDS = [
  { key: "total", label: "Total GPS", icon: "satellite-dish", color: "#3b82f6", bgColor: "#eff6ff", field: "totalGPSVehicles" },
  { key: "online", label: "Online", icon: "signal", color: "#10b981", bgColor: "#ecfdf5", field: "onlineVehicles" },
  { key: "moving", label: "Moving", icon: "shipping-fast", color: "#8b5cf6", bgColor: "#f5f3ff", field: "movingVehicles" },
  { key: "parked", label: "Parked", icon: "parking", color: "#f59e0b", bgColor: "#fffbeb", field: "parkedVehicles" },
  { key: "stopped", label: "Stopped", icon: "hand-paper", color: "#ef4444", bgColor: "#fef2f2", field: "stoppedVehicles" },
];

const VehicleDashboard = ({ onSelectVehicle, isConnected, searchComponent }) => {
  const dispatch = useDispatch();
  // Select ONLY the fields we need — NOT the entire slice.
  // Selecting state.vehicle would re-render on every liveLocation update (587 vehicles).
  const trackingSummary = useSelector((state) => state.vehicle.trackingSummary);
  const trackingSummaryLoading = useSelector((state) => state.vehicle.trackingSummaryLoading);

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Tag selection (searchable dropdown)
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);
  const [tagDropdownVisible, setTagDropdownVisible] = useState(false);
  const [tagSearchQuery, setTagSearchQuery] = useState("");

  // Vehicles loaded per-tag (NOT all 587 at once)
  const [tagVehicles, setTagVehicles] = useState([]);
  const [tagVehiclesLoading, setTagVehiclesLoading] = useState(false);

  // Load summary + tags on mount
  useEffect(() => {
    dispatch(fetchTrackingSummary());
    loadTags();
  }, [dispatch]);

  const loadTags = async () => {
    try {
      setTagsLoading(true);
      const result = await ApiService.getTrackingTags();
      const tagList = Array.isArray(result) ? result : [];
      setTags(tagList);
    } catch (error) {
      console.error("[VehicleDashboard] Error loading tags:", error.message);
    } finally {
      setTagsLoading(false);
    }
  };

  // Load vehicles when tag is selected
  useEffect(() => {
    if (selectedTag) {
      loadVehiclesByTag(selectedTag);
    } else {
      setTagVehicles([]);
    }
  }, [selectedTag]);

  const loadVehiclesByTag = async (tag) => {
    const tagId = tag.id || tag.Id || tag.tagId || tag.TagId;
    if (!tagId) return;
    try {
      setTagVehiclesLoading(true);
      const result = await ApiService.getVehiclesByTag(tagId, 0, 50);
      const vehicles = Array.isArray(result) ? result : [];
      setTagVehicles(vehicles);
    } catch (error) {
      console.error("[VehicleDashboard] Error loading tag vehicles:", error.message);
      setTagVehicles([]);
    } finally {
      setTagVehiclesLoading(false);
    }
  };

  // Summary adjusts based on selected tag: local counts from tag vehicles, or global from DataSourceManager
  const displaySummary = useMemo(() => {
    if (!selectedTag || tagVehicles.length === 0) {
      // No tag selected — show global summary from DataSourceManager
      return trackingSummary;
    }
    // Tag selected — compute counts from loaded tag vehicles
    // Use speed > 2 km/h as fallback for isMoving (API may not return isMoving boolean)
    const isVehicleMoving = (v) => {
      const speed = v.speed || v.Speed || v.speedKmh || v.SpeedKmh || 0;
      return v.isMoving || v.IsMoving || speed > 2;
    };
    const total = tagVehicles.length;
    const online = tagVehicles.filter((v) => v.isOnline || v.IsOnline).length;
    const offline = total - online;
    const moving = tagVehicles.filter((v) => (v.isOnline || v.IsOnline) && isVehicleMoving(v)).length;
    const stationary = tagVehicles.filter((v) => (v.isOnline || v.IsOnline) && !isVehicleMoving(v));
    const parked = stationary.filter((v) => {
      const lastUpdated = v.lastUpdated || v.LastUpdated;
      if (!lastUpdated) return false;
      const diff = Date.now() - new Date(lastUpdated).getTime();
      return diff >= 15 * 60 * 1000; // 15 minutes
    }).length;
    const stopped = Math.max(0, stationary.length - parked);

    return {
      totalGPSVehicles: total,
      onlineVehicles: online,
      offlineVehicles: offline,
      movingVehicles: moving,
      parkedVehicles: parked,
      stoppedVehicles: stopped,
    };
  }, [selectedTag, tagVehicles, trackingSummary]);

  // Filter vehicles by search + status
  const filteredVehicles = useMemo(() => {
    let list = tagVehicles;

    // Use speed > 2 km/h as fallback for isMoving
    const isVehicleMoving = (v) => {
      const speed = v.speed || v.Speed || v.speedKmh || v.SpeedKmh || 0;
      return v.isMoving || v.IsMoving || speed > 2;
    };

    if (statusFilter === "moving") {
      list = list.filter((v) => isVehicleMoving(v));
    } else if (statusFilter === "parked") {
      list = list.filter((v) => (v.isOnline || v.IsOnline) && !isVehicleMoving(v));
    } else if (statusFilter === "offline") {
      list = list.filter((v) => !(v.isOnline || v.IsOnline));
    }

    if (searchQuery.length >= 2) {
      const query = searchQuery.toLowerCase();
      list = list.filter((v) => {
        const name = (v.vehicleName || v.VehicleName || v.name || v.Name || "").toLowerCase();
        const plate = (v.numberPlate || v.NumberPlate || v.hyoungNo || v.HyoungNo || "").toLowerCase();
        const driver = (v.driverName || v.DriverName || "").toLowerCase();
        return name.includes(query) || plate.includes(query) || driver.includes(query);
      });
    }

    return list;
  }, [tagVehicles, searchQuery, statusFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    dispatch(fetchTrackingSummary());
    await loadTags();
    if (selectedTag) {
      await loadVehiclesByTag(selectedTag);
    }
    setRefreshing(false);
  }, [dispatch, selectedTag]);

  const getStatusInfo = (vehicle) => {
    const isOnline = vehicle.isOnline || vehicle.IsOnline;
    const speed = vehicle.speed || vehicle.Speed || vehicle.speedKmh || vehicle.SpeedKmh || 0;
    // Use isMoving if available, otherwise fall back to speed > 2 km/h (accounts for GPS drift)
    const isMoving = vehicle.isMoving || vehicle.IsMoving || speed > 2;
    if (!isOnline) return { label: "Offline", color: "#9ca3af", icon: "circle", bgColor: "#f3f4f6" };
    if (isMoving) return { label: "Moving", color: "#8b5cf6", icon: "shipping-fast", bgColor: "#f5f3ff" };
    return { label: "Parked", color: "#f59e0b", icon: "parking", bgColor: "#fffbeb" };
  };

  // Filter tags by dropdown search
  const filteredTags = useMemo(() => {
    if (!tagSearchQuery || tagSearchQuery.length < 1) return tags;
    const q = tagSearchQuery.toLowerCase();
    return tags.filter((t) => {
      const name = (t.name || t.Name || t.tagName || t.TagName || "").toLowerCase();
      return name.includes(q);
    });
  }, [tags, tagSearchQuery]);

  const getTagName = (tag) =>
    tag?.name || tag?.Name || tag?.tagName || tag?.TagName || `Tag ${tag?.id || tag?.Id || ""}`;

  const getTagId = (tag) =>
    tag?.id || tag?.Id || tag?.tagId || tag?.TagId;

  const handleSelectTag = useCallback((tag) => {
    const currentId = selectedTag ? getTagId(selectedTag) : null;
    const newId = getTagId(tag);
    if (currentId === newId) {
      setSelectedTag(null);
    } else {
      setSelectedTag(tag);
    }
    setTagDropdownVisible(false);
    setTagSearchQuery("");
  }, [selectedTag]);

  const handleClearTag = useCallback(() => {
    setSelectedTag(null);
    setTagDropdownVisible(false);
    setTagSearchQuery("");
  }, []);

  const formatSpeed = (vehicle) => {
    const speed = vehicle.speedKmh || vehicle.SpeedKmh || vehicle.speed || vehicle.Speed || 0;
    return `${Math.round(speed)} km/h`;
  };

  const renderVehicleItem = ({ item }) => {
    const status = getStatusInfo(item);
    const vehicleName = item.vehicleName || item.VehicleName || item.name || item.Name || "";
    const plate = item.numberPlate || item.NumberPlate || item.hyoungNo || item.HyoungNo || "";
    const driver = item.driverName || item.DriverName || "";

    return (
      <TouchableOpacity
        style={styles.vehicleCard}
        onPress={() => onSelectVehicle?.(item)}
        activeOpacity={0.7}
      >
        <View style={[styles.statusDot, { backgroundColor: status.color }]} />
        <View style={styles.vehicleInfo}>
          <Text style={styles.vehiclePlate} numberOfLines={1}>{plate}</Text>
          <Text style={styles.vehicleName} numberOfLines={1}>{vehicleName}</Text>
          {driver ? (
            <Text style={styles.vehicleDriver} numberOfLines={1}>
              <Icon name="user" size={10} color="#9ca3af" /> {driver}
            </Text>
          ) : null}
        </View>
        <View style={styles.vehicleRight}>
          <View style={[styles.statusBadge, { backgroundColor: status.bgColor }]}>
            <Icon name={status.icon} size={10} color={status.color} />
            <Text style={[styles.statusText, { color: status.color }]}>{status.label}</Text>
          </View>
          {(item.isOnline || item.IsOnline) && (
            <Text style={styles.speedText}>{formatSpeed(item)}</Text>
          )}
        </View>
        <Icon name="chevron-right" size={12} color="#d1d5db" style={styles.chevron} />
      </TouchableOpacity>
    );
  };

  const renderSummaryCards = () => (
    <View>
      {/* Scope indicator */}
      {selectedTag && (
        <View style={styles.summaryScope}>
          <Icon name="filter" size={10} color="#2563eb" />
          <Text style={styles.summaryScopeText}>
            Showing: {getTagName(selectedTag)}
          </Text>
        </View>
      )}
      <View style={styles.summaryContainer}>
        {SUMMARY_CARDS.map((card) => {
          const value = displaySummary?.[card.field] ?? 0;
          return (
            <View key={card.key} style={[styles.summaryCard, { backgroundColor: card.bgColor }]}>
              <Icon name={card.icon} size={14} color={card.color} />
              <Text style={[styles.summaryValue, { color: card.color }]}>{value}</Text>
              <Text style={styles.summaryLabel}>{card.label}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );

  const renderTagSelector = () => (
    <View style={styles.tagSection}>
      <Text style={styles.tagSectionTitle}>Vehicle Group / Tag</Text>

      {/* Dropdown trigger button */}
      <TouchableOpacity
        style={[styles.dropdownTrigger, selectedTag && styles.dropdownTriggerActive]}
        onPress={() => setTagDropdownVisible(true)}
        activeOpacity={0.7}
      >
        <Icon
          name={selectedTag ? "tag" : "caret-down"}
          size={14}
          color={selectedTag ? "#2563eb" : "#6b7280"}
          style={styles.dropdownIcon}
        />
        <Text
          style={[styles.dropdownText, selectedTag && styles.dropdownTextActive]}
          numberOfLines={1}
        >
          {tagsLoading
            ? "Loading groups..."
            : selectedTag
            ? getTagName(selectedTag)
            : "Select a group / tag..."}
        </Text>
        {selectedTag ? (
          <TouchableOpacity onPress={handleClearTag} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Icon name="times-circle" size={16} color="#9ca3af" />
          </TouchableOpacity>
        ) : (
          <Icon name="chevron-down" size={12} color="#9ca3af" />
        )}
      </TouchableOpacity>

      {/* Dropdown modal */}
      <Modal
        visible={tagDropdownVisible}
        animationType="slide"
        transparent
        onRequestClose={() => {
          setTagDropdownVisible(false);
          setTagSearchQuery("");
        }}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => {
            setTagDropdownVisible(false);
            setTagSearchQuery("");
          }}
        >
          <View style={styles.modalContent} onStartShouldSetResponder={() => true}>
            {/* Modal header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Group / Tag</Text>
              <TouchableOpacity
                onPress={() => {
                  setTagDropdownVisible(false);
                  setTagSearchQuery("");
                }}
              >
                <Icon name="times" size={18} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Search input */}
            <View style={styles.modalSearchContainer}>
              <Icon name="search" size={14} color="#9ca3af" style={styles.modalSearchIcon} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="Search tags..."
                placeholderTextColor="#9ca3af"
                value={tagSearchQuery}
                onChangeText={setTagSearchQuery}
                autoCapitalize="none"
                autoFocus
              />
              {tagSearchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setTagSearchQuery("")}>
                  <Icon name="times-circle" size={14} color="#9ca3af" />
                </TouchableOpacity>
              )}
            </View>

            {/* Tag list */}
            <ScrollView
              style={styles.modalList}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {filteredTags.length === 0 ? (
                <View style={styles.modalEmptyRow}>
                  <Icon name="folder-open" size={16} color="#9ca3af" />
                  <Text style={styles.modalEmptyText}>
                    {tagSearchQuery ? "No matching tags" : "No tags available"}
                  </Text>
                </View>
              ) : (
                filteredTags.map((tag) => {
                  const tagId = getTagId(tag);
                  const tagName = getTagName(tag);
                  const isSelected = selectedTag && getTagId(selectedTag) === tagId;
                  return (
                    <TouchableOpacity
                      key={tagId?.toString() || Math.random().toString()}
                      style={[styles.modalTagItem, isSelected && styles.modalTagItemActive]}
                      onPress={() => handleSelectTag(tag)}
                      activeOpacity={0.7}
                    >
                      <Icon
                        name="tag"
                        size={13}
                        color={isSelected ? "#2563eb" : "#6b7280"}
                        style={styles.modalTagIcon}
                      />
                      <Text style={[styles.modalTagText, isSelected && styles.modalTagTextActive]}>
                        {tagName}
                      </Text>
                      {isSelected && (
                        <Icon name="check" size={14} color="#2563eb" />
                      )}
                    </TouchableOpacity>
                  );
                })
              )}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );

  const renderHeader = () => (
    <View>
      {/* Vehicle Search (passed from parent) */}
      {searchComponent && (
        <View style={styles.searchComponentWrapper}>
          {searchComponent}
        </View>
      )}

      {/* Connection Status */}
      <View style={[styles.connectionBar, isConnected ? styles.connectionOnline : styles.connectionOffline]}>
        <Icon
          name={isConnected ? "broadcast-tower" : "exclamation-triangle"}
          size={12}
          color={isConnected ? "#10b981" : "#f59e0b"}
        />
        <Text style={[styles.connectionText, { color: isConnected ? "#10b981" : "#f59e0b" }]}>
          {isConnected ? "Live Tracking Active" : "Connecting..."}
        </Text>
      </View>

      {/* Summary Cards */}
      {trackingSummaryLoading && !displaySummary ? (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" color="#2563eb" />
        </View>
      ) : (
        renderSummaryCards()
      )}

      {/* Tag Selector */}
      {renderTagSelector()}

      {/* Search + Filters (only show when a tag is selected) */}
      {selectedTag && (
        <>
          <View style={styles.searchContainer}>
            <Icon name="search" size={14} color="#9ca3af" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search vehicles..."
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="times-circle" size={14} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          <View style={styles.filterRow}>
            {[
              { key: "all", label: "All" },
              { key: "moving", label: "Moving" },
              { key: "parked", label: "Parked" },
              { key: "offline", label: "Offline" },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, statusFilter === f.key && styles.filterChipActive]}
                onPress={() => setStatusFilter(f.key)}
              >
                <Text style={[styles.filterChipText, statusFilter === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
            <Text style={styles.resultCount}>{filteredVehicles.length} vehicles</Text>
          </View>
        </>
      )}

      {/* Prompt to select tag if none selected */}
      {!selectedTag && tags.length > 0 && (
        <View style={styles.selectTagPrompt}>
          <Icon name="hand-pointer" size={16} color="#9ca3af" />
          <Text style={styles.selectTagText}>Select a group above to see vehicles</Text>
        </View>
      )}
    </View>
  );

  return (
    <FlatList
      data={selectedTag ? filteredVehicles : []}
      keyExtractor={(item) =>
        (item.vehicleId || item.VehicleId || item.id || item.Id || Math.random()).toString()
      }
      renderItem={renderVehicleItem}
      ListHeaderComponent={renderHeader}
      ListEmptyComponent={
        selectedTag ? (
          tagVehiclesLoading ? (
            <View style={styles.emptyContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.emptyText}>Loading vehicles...</Text>
            </View>
          ) : (
            <View style={styles.emptyContainer}>
              <Icon name="truck" size={40} color="#d1d5db" />
              <Text style={styles.emptyText}>No vehicles found in this group</Text>
            </View>
          )
        ) : null
      }
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#2563eb" />
      }
      contentContainerStyle={styles.listContent}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    paddingBottom: 20,
  },
  searchComponentWrapper: {
    backgroundColor: "white",
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  connectionBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  connectionOnline: {
    backgroundColor: "#ecfdf5",
  },
  connectionOffline: {
    backgroundColor: "#fffbeb",
  },
  connectionText: {
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 6,
  },
  summaryScope: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    paddingHorizontal: 16,
  },
  summaryScopeText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#2563eb",
    marginLeft: 6,
  },
  summaryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 8,
  },
  summaryCard: {
    flex: 1,
    minWidth: 60,
    alignItems: "center",
    paddingVertical: 10,
    marginHorizontal: 3,
    borderRadius: 10,
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: "800",
    marginTop: 3,
  },
  summaryLabel: {
    fontSize: 10,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 2,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  // Tag selector (dropdown)
  tagSection: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 4,
  },
  tagSectionTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  dropdownTrigger: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  dropdownTriggerActive: {
    borderColor: "#2563eb",
    backgroundColor: "#eff6ff",
  },
  dropdownIcon: {
    marginRight: 10,
  },
  dropdownText: {
    flex: 1,
    fontSize: 14,
    color: "#9ca3af",
  },
  dropdownTextActive: {
    color: "#1f2937",
    fontWeight: "600",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1f2937",
  },
  modalSearchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  modalSearchIcon: {
    marginRight: 8,
  },
  modalSearchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
    paddingVertical: 10,
  },
  modalList: {
    paddingHorizontal: 16,
  },
  modalTagItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  modalTagItemActive: {
    backgroundColor: "#eff6ff",
    borderRadius: 8,
    borderBottomColor: "transparent",
  },
  modalTagIcon: {
    marginRight: 12,
  },
  modalTagText: {
    flex: 1,
    fontSize: 15,
    color: "#374151",
  },
  modalTagTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  modalEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  modalEmptyText: {
    fontSize: 14,
    color: "#9ca3af",
    marginLeft: 8,
  },
  selectTagPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 20,
  },
  selectTagText: {
    fontSize: 14,
    color: "#9ca3af",
    marginLeft: 8,
  },
  // Search
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginTop: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: "#1f2937",
    paddingVertical: 10,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
  },
  filterChipActive: {
    backgroundColor: "#2563eb",
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
  },
  filterChipTextActive: {
    color: "white",
  },
  resultCount: {
    flex: 1,
    textAlign: "right",
    fontSize: 12,
    color: "#9ca3af",
  },
  // Vehicle cards
  vehicleCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#f3f4f6",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: 12,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 15,
    fontWeight: "700",
    color: "#1f2937",
  },
  vehicleName: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  vehicleDriver: {
    fontSize: 11,
    color: "#9ca3af",
    marginTop: 2,
  },
  vehicleRight: {
    alignItems: "flex-end",
    marginRight: 8,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 11,
    fontWeight: "600",
    marginLeft: 4,
  },
  speedText: {
    fontSize: 11,
    color: "#6b7280",
    marginTop: 4,
    fontWeight: "500",
  },
  chevron: {
    marginLeft: 4,
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    color: "#9ca3af",
  },
});

export default VehicleDashboard;
