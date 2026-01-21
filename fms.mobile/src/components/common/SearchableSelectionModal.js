/**
 * SearchableSelectionModal.js
 * A reusable modal component for searching and selecting items (vehicles, users, etc.)
 *
 * Features:
 * - Debounced API search
 * - Multi-select with checkboxes
 * - Customizable item rendering
 * - Loading, error, and empty states
 *
 * Usage:
 * <SearchableSelectionModal
 *   visible={showModal}
 *   onClose={() => setShowModal(false)}
 *   title="Select Vehicles"
 *   searchPlaceholder="Search by vehicle number..."
 *   searchFn={(query, limit) => ApiService.searchVehicles(query, limit)}
 *   selectedIds={selectedVehicleIds}
 *   onSelectionChange={setSelectedVehicleIds}
 *   keyExtractor={(item) => item.vehicleId}
 *   renderItem={(item, isSelected) => ({
 *     title: item.hyoungNo,
 *     subtitle: item.numberPlate,
 *     icon: "car"
 *   })}
 *   normalizeResult={(item) => ({
 *     vehicleId: item.VehicleId || item.vehicleId,
 *     hyoungNo: item.HyoungNo || item.hyoungNo,
 *     numberPlate: item.NumberPlate || item.numberPlate
 *   })}
 * />
 */
import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  FlatList,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const SearchableSelectionModal = ({
  // Modal control
  visible,
  onClose,

  // Customization
  title = "Select Items",
  searchPlaceholder = "Search...",
  itemTypeName = "items", // For messages like "No items found"
  icon = "search", // Default icon for items

  // Search configuration
  searchFn, // async (searchTerm, limit) => results[]
  searchLimit = 20,
  minSearchLength = 2,
  debounceMs = 400,

  // Selection
  selectedIds = [],
  onSelectionChange, // (newSelectedIds) => void

  // Item configuration
  keyExtractor, // (item) => string | number
  getItemDisplay, // (item) => { title, subtitle, icon? }
  normalizeResult, // (apiItem) => normalizedItem (optional, for handling PascalCase/camelCase)
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchError, setSearchError] = useState(null);

  // Reset state when modal opens
  useEffect(() => {
    if (visible) {
      setSearchQuery("");
      setSearchResults([]);
      setSearchError(null);
    }
  }, [visible]);

  // Debounced search
  useEffect(() => {
    if (searchQuery.length >= minSearchLength) {
      setIsSearching(true);
      setSearchError(null);

      const timer = setTimeout(async () => {
        try {
          console.log(`[SearchableSelectionModal] Searching: ${searchQuery}`);
          const results = await searchFn(searchQuery, searchLimit);
          console.log(`[SearchableSelectionModal] Results count: ${results?.length || 0}`);

          // Normalize results if normalizeResult function is provided
          const normalizedResults = normalizeResult
            ? (results || []).map(normalizeResult)
            : results || [];

          setSearchResults(normalizedResults);
        } catch (error) {
          console.error("[SearchableSelectionModal] Search error:", error);
          setSearchError("Search failed. Please try again.");
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }, debounceMs);

      return () => clearTimeout(timer);
    } else {
      setSearchResults([]);
      setSearchError(null);
    }
  }, [searchQuery, searchFn, searchLimit, minSearchLength, debounceMs, normalizeResult]);

  // Toggle selection
  const toggleSelection = useCallback((id) => {
    const newSelectedIds = selectedIds.includes(id)
      ? selectedIds.filter((x) => x !== id)
      : [...selectedIds, id];
    onSelectionChange(newSelectedIds);
  }, [selectedIds, onSelectionChange]);

  // Clear all selections
  const clearAllSelections = useCallback(() => {
    onSelectionChange([]);
  }, [onSelectionChange]);

  // Render item
  const renderItem = useCallback(({ item }) => {
    const id = keyExtractor(item);
    const isSelected = selectedIds.includes(id);
    const display = getItemDisplay(item);

    return (
      <TouchableOpacity
        style={[
          styles.selectionItem,
          isSelected && styles.selectionItemSelected,
        ]}
        onPress={() => toggleSelection(id)}
      >
        <View style={styles.selectionItemInfo}>
          <Icon
            name={display.icon || icon}
            size={16}
            color={isSelected ? "#2563eb" : "#6b7280"}
          />
          <View style={styles.selectionItemText}>
            <Text
              style={[
                styles.selectionItemTitle,
                isSelected && styles.selectionItemTitleSelected,
              ]}
            >
              {display.title}
            </Text>
            {display.subtitle ? (
              <Text style={styles.selectionItemSubtitle}>{display.subtitle}</Text>
            ) : null}
          </View>
        </View>
        <View
          style={[
            styles.selectionCheckbox,
            isSelected && styles.selectionCheckboxSelected,
          ]}
        >
          {isSelected && <Icon name="check" size={12} color="#fff" />}
        </View>
      </TouchableOpacity>
    );
  }, [selectedIds, keyExtractor, getItemDisplay, icon, toggleSelection]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>{title}</Text>
            <TouchableOpacity
              style={styles.doneButton}
              onPress={onClose}
            >
              <Text style={styles.doneButtonText}>Done</Text>
            </TouchableOpacity>
          </View>

          {/* Search Bar */}
          <View style={styles.searchContainer}>
            <Icon name="search" size={16} color="#9ca3af" />
            <TextInput
              style={styles.searchInput}
              placeholder={searchPlaceholder}
              placeholderTextColor="#9ca3af"
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
              autoCorrect={false}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <Icon name="times-circle" size={16} color="#9ca3af" />
              </TouchableOpacity>
            )}
          </View>

          {/* Selection Count */}
          <View style={styles.countContainer}>
            <Text style={styles.countText}>
              {selectedIds.length} selected
            </Text>
            {selectedIds.length > 0 && (
              <TouchableOpacity onPress={clearAllSelections}>
                <Text style={styles.clearText}>Clear All</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Content */}
          {isSearching ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : searchQuery.length < minSearchLength ? (
            <View style={styles.hintContainer}>
              <Icon name="info-circle" size={24} color="#9ca3af" />
              <Text style={styles.hintText}>
                Enter at least {minSearchLength} characters to search {itemTypeName}
              </Text>
            </View>
          ) : searchError ? (
            <View style={styles.emptyContainer}>
              <Icon name="exclamation-triangle" size={32} color="#f59e0b" />
              <Text style={styles.emptyText}>{searchError}</Text>
            </View>
          ) : (
            <FlatList
              data={searchResults}
              renderItem={renderItem}
              keyExtractor={(item) => keyExtractor(item)?.toString()}
              style={styles.list}
              contentContainerStyle={styles.listContent}
              keyboardShouldPersistTaps="handled"
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Icon name="search" size={32} color="#9ca3af" />
                  <Text style={styles.emptyText}>
                    No {itemTypeName} found
                  </Text>
                </View>
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "80%",
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
    fontSize: 17,
    fontWeight: "600",
    color: "#1f2937",
  },
  doneButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#2563eb",
    borderRadius: 8,
  },
  doneButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    borderRadius: 10,
    margin: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#1f2937",
    padding: 0,
  },
  countContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  countText: {
    fontSize: 13,
    color: "#6b7280",
  },
  clearText: {
    fontSize: 13,
    color: "#dc2626",
    fontWeight: "500",
  },
  list: {
    flex: 1,
  },
  listContent: {
    paddingBottom: 30,
  },
  selectionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
  },
  selectionItemSelected: {
    backgroundColor: "#eff6ff",
  },
  selectionItemInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    gap: 12,
  },
  selectionItemText: {
    flex: 1,
  },
  selectionItemTitle: {
    fontSize: 15,
    color: "#1f2937",
    fontWeight: "500",
  },
  selectionItemTitleSelected: {
    color: "#2563eb",
    fontWeight: "600",
  },
  selectionItemSubtitle: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  selectionCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#d1d5db",
    alignItems: "center",
    justifyContent: "center",
  },
  selectionCheckboxSelected: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: "#9ca3af",
    marginTop: 8,
    textAlign: "center",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: "#6b7280",
  },
  hintContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 40,
    paddingHorizontal: 24,
  },
  hintText: {
    fontSize: 14,
    color: "#9ca3af",
    textAlign: "center",
    marginTop: 12,
  },
});

export default SearchableSelectionModal;
