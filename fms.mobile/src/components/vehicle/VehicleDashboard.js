/**
 * File: VehicleDashboard.js
 * Purpose: Vehicle tracking dashboard with summary cards (Active, Moving, Parked),
 *          tag-based group selection, and a searchable vehicle list showing live status.
 *
 * Performance: Vehicles are loaded per-tag (not all 587+ at once).
 *              User selects a tag/group first, then sees vehicles in that group.
 *              Summary cards show global totals from the summary API.
 */

import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useDispatch, useSelector } from "react-redux";
import ApiService from "../../services/apiService";
import {
  fetchTrackingSummary,
} from "../../redux/slices/vehicleSlice";

const SUMMARY_CARDS = [
  { key: "total", label: "Total GPS", icon: "satellite-dish", color: "#3b82f6", bgColor: "#eff6ff", field: "totalGPSVehicles", altField: "TotalGPSVehicles" },
  { key: "online", label: "Online", icon: "signal", color: "#10b981", bgColor: "#ecfdf5", field: "onlineVehicles", altField: "OnlineVehicles" },
  { key: "moving", label: "Moving", icon: "shipping-fast", color: "#8b5cf6", bgColor: "#f5f3ff", field: "inTransitVehicles", altField: "InTransitVehicles" },
  { key: "parked", label: "Parked", icon: "parking", color: "#f59e0b", bgColor: "#fffbeb", field: "parkedVehicles", altField: "ParkedVehicles" },
];

const VehicleDashboard = ({ onSelectVehicle, isConnected }) => {
  const dispatch = useDispatch();
  const { trackingSummary, trackingSummaryLoading } = useSelector((state) => state.vehicle);

  const [searchQuery, setSearchQuery] = useState("");
  const [refreshing, setRefreshing] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");

  // Tag selection
  const [tags, setTags] = useState([]);
  const [tagsLoading, setTagsLoading] = useState(false);
  const [selectedTag, setSelectedTag] = useState(null);

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

  // Filter vehicles by search + status
  const filteredVehicles = useMemo(() => {
    let list = tagVehicles;

    if (statusFilter === "moving") {
      list = list.filter((v) => v.isMoving || v.IsMoving);
    } else if (statusFilter === "parked") {
      list = list.filter((v) => (v.isOnline || v.IsOnline) && !(v.isMoving || v.IsMoving));
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
    const isMoving = vehicle.isMoving || vehicle.IsMoving;
    if (!isOnline) return { label: "Offline", color: "#9ca3af", icon: "circle", bgColor: "#f3f4f6" };
    if (isMoving) return { label: "Moving", color: "#8b5cf6", icon: "shipping-fast", bgColor: "#f5f3ff" };
    return { label: "Parked", color: "#f59e0b", icon: "parking", bgColor: "#fffbeb" };
  };

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
    <View style={styles.summaryContainer}>
      {SUMMARY_CARDS.map((card) => {
        const value = trackingSummary?.[card.field] || trackingSummary?.[card.altField] || 0;
        return (
          <View key={card.key} style={[styles.summaryCard, { backgroundColor: card.bgColor }]}>
            <Icon name={card.icon} size={18} color={card.color} />
            <Text style={[styles.summaryValue, { color: card.color }]}>{value}</Text>
            <Text style={styles.summaryLabel}>{card.label}</Text>
          </View>
        );
      })}
    </View>
  );

  const renderTagSelector = () => (
    <View style={styles.tagSection}>
      <Text style={styles.tagSectionTitle}>Select Group / Tag</Text>
      {tagsLoading ? (
        <View style={styles.tagLoadingRow}>
          <ActivityIndicator size="small" color="#2563eb" />
          <Text style={styles.tagLoadingText}>Loading tags...</Text>
        </View>
      ) : tags.length === 0 ? (
        <View style={styles.tagEmptyRow}>
          <Icon name="folder-open" size={14} color="#9ca3af" />
          <Text style={styles.tagEmptyText}>No tags available</Text>
        </View>
      ) : (
        <FlatList
          data={tags}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => (item.id || item.Id || item.tagId || item.TagId || Math.random()).toString()}
          contentContainerStyle={styles.tagList}
          renderItem={({ item }) => {
            const tagId = item.id || item.Id || item.tagId || item.TagId;
            const tagName = item.name || item.Name || item.tagName || item.TagName || `Tag ${tagId}`;
            const isSelected = selectedTag && (selectedTag.id || selectedTag.Id || selectedTag.tagId || selectedTag.TagId) === tagId;
            return (
              <TouchableOpacity
                style={[styles.tagChip, isSelected && styles.tagChipActive]}
                onPress={() => setSelectedTag(isSelected ? null : item)}
                activeOpacity={0.7}
              >
                <Icon
                  name="tag"
                  size={11}
                  color={isSelected ? "white" : "#6b7280"}
                />
                <Text style={[styles.tagChipText, isSelected && styles.tagChipTextActive]}>
                  {tagName}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );

  const renderHeader = () => (
    <View>
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
      {trackingSummaryLoading && !trackingSummary ? (
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
  summaryContainer: {
    flexDirection: "row",
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 8,
  },
  summaryCard: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    marginHorizontal: 4,
    borderRadius: 12,
  },
  summaryValue: {
    fontSize: 22,
    fontWeight: "800",
    marginTop: 4,
  },
  summaryLabel: {
    fontSize: 11,
    color: "#6b7280",
    fontWeight: "500",
    marginTop: 2,
  },
  loadingRow: {
    paddingVertical: 24,
    alignItems: "center",
  },
  // Tag selector
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
  tagList: {
    paddingRight: 16,
  },
  tagChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tagChipActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  tagChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#6b7280",
    marginLeft: 6,
  },
  tagChipTextActive: {
    color: "white",
  },
  tagLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  tagLoadingText: {
    fontSize: 13,
    color: "#6b7280",
    marginLeft: 8,
  },
  tagEmptyRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
  },
  tagEmptyText: {
    fontSize: 13,
    color: "#9ca3af",
    marginLeft: 8,
  },
  selectTagPrompt: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
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
