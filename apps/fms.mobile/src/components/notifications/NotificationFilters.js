/**
 * NotificationFilters Component
 * Filter bar for notifications (type, category, priority, read status)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

const FILTER_OPTIONS = {
  type: [
    { value: null, label: "All Types" },
    { value: "Alert", label: "Alerts" },
    { value: "Warning", label: "Warnings" },
    { value: "Info", label: "Info" },
    { value: "Error", label: "Errors" },
    { value: "System", label: "System" },
  ],
  category: [
    { value: null, label: "All Categories" },
    { value: "Tank", label: "Tank" },
    { value: "Pump", label: "Pump" },
    { value: "Vehicle", label: "Vehicle" },
    { value: "Fuel", label: "Fuel" },
    { value: "Delivery", label: "Delivery" },
    { value: "Stock", label: "Stock" },
    { value: "System", label: "System" },
  ],
  priority: [
    { value: null, label: "All Priorities" },
    { value: "Critical", label: "Critical" },
    { value: "High", label: "High" },
    { value: "Medium", label: "Medium" },
    { value: "Low", label: "Low" },
  ],
  isRead: [
    { value: null, label: "All" },
    { value: false, label: "Unread" },
    { value: true, label: "Read" },
  ],
};

const QuickFilterChip = ({ label, isActive, onPress, icon }) => (
  <TouchableOpacity
    style={[styles.chip, isActive && styles.chipActive]}
    onPress={onPress}
  >
    {icon && (
      <Icon
        name={icon}
        size={12}
        color={isActive ? "#ffffff" : "#6b7280"}
        style={styles.chipIcon}
      />
    )}
    <Text style={[styles.chipText, isActive && styles.chipTextActive]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const NotificationFilters = ({ filters, onFiltersChange, onClearFilters }) => {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [tempFilters, setTempFilters] = useState(filters);

  // Count active filters
  const activeFilterCount = Object.values(filters).filter(
    (v) => v !== null && v !== undefined
  ).length;

  // Quick filter handlers
  const handleQuickFilter = (key, value) => {
    const newFilters = {
      ...filters,
      [key]: filters[key] === value ? null : value,
    };
    onFiltersChange(newFilters);
  };

  // Apply modal filters
  const applyFilters = () => {
    onFiltersChange(tempFilters);
    setShowFilterModal(false);
  };

  // Clear all filters
  const handleClearAll = () => {
    setTempFilters({
      type: null,
      category: null,
      priority: null,
      isRead: null,
    });
    onClearFilters?.();
    setShowFilterModal(false);
  };

  return (
    <View style={styles.container}>
      {/* Quick Filters Scroll */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Filter button */}
        <TouchableOpacity
          style={[styles.filterButton, activeFilterCount > 0 && styles.filterButtonActive]}
          onPress={() => {
            setTempFilters(filters);
            setShowFilterModal(true);
          }}
        >
          <Icon
            name="filter"
            size={14}
            color={activeFilterCount > 0 ? "#ffffff" : "#6b7280"}
          />
          {activeFilterCount > 0 && (
            <View style={styles.filterBadge}>
              <Text style={styles.filterBadgeText}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Quick filter chips */}
        <QuickFilterChip
          label="Unread"
          icon="envelope"
          isActive={filters.isRead === false}
          onPress={() => handleQuickFilter("isRead", false)}
        />
        <QuickFilterChip
          label="Critical"
          icon="exclamation-circle"
          isActive={filters.priority === "Critical"}
          onPress={() => handleQuickFilter("priority", "Critical")}
        />
        <QuickFilterChip
          label="High"
          icon="exclamation-triangle"
          isActive={filters.priority === "High"}
          onPress={() => handleQuickFilter("priority", "High")}
        />
        <QuickFilterChip
          label="Alerts"
          icon="bell"
          isActive={filters.type === "Alert"}
          onPress={() => handleQuickFilter("type", "Alert")}
        />
        <QuickFilterChip
          label="Tank"
          icon="database"
          isActive={filters.category === "Tank"}
          onPress={() => handleQuickFilter("category", "Tank")}
        />
        <QuickFilterChip
          label="Vehicle"
          icon="car"
          isActive={filters.category === "Vehicle"}
          onPress={() => handleQuickFilter("category", "Vehicle")}
        />
      </ScrollView>

      {/* Filter Modal */}
      <Modal
        visible={showFilterModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowFilterModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Filter Notifications</Text>
              <TouchableOpacity
                onPress={() => setShowFilterModal(false)}
                style={styles.closeButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {/* Filter Sections */}
            <ScrollView style={styles.modalBody}>
              {/* Type Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Type</Text>
                <View style={styles.optionsRow}>
                  {FILTER_OPTIONS.type.map((option) => (
                    <TouchableOpacity
                      key={option.value || "all"}
                      style={[
                        styles.optionChip,
                        tempFilters.type === option.value && styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, type: option.value })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.type === option.value && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Category Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Category</Text>
                <View style={styles.optionsRow}>
                  {FILTER_OPTIONS.category.map((option) => (
                    <TouchableOpacity
                      key={option.value || "all"}
                      style={[
                        styles.optionChip,
                        tempFilters.category === option.value && styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, category: option.value })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.category === option.value && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Priority Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Priority</Text>
                <View style={styles.optionsRow}>
                  {FILTER_OPTIONS.priority.map((option) => (
                    <TouchableOpacity
                      key={option.value || "all"}
                      style={[
                        styles.optionChip,
                        tempFilters.priority === option.value && styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, priority: option.value })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.priority === option.value && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Read Status Filter */}
              <View style={styles.filterSection}>
                <Text style={styles.sectionTitle}>Status</Text>
                <View style={styles.optionsRow}>
                  {FILTER_OPTIONS.isRead.map((option) => (
                    <TouchableOpacity
                      key={String(option.value)}
                      style={[
                        styles.optionChip,
                        tempFilters.isRead === option.value && styles.optionChipActive,
                      ]}
                      onPress={() =>
                        setTempFilters({ ...tempFilters, isRead: option.value })
                      }
                    >
                      <Text
                        style={[
                          styles.optionText,
                          tempFilters.isRead === option.value && styles.optionTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>

            {/* Modal Footer */}
            <View style={styles.modalFooter}>
              <TouchableOpacity
                style={styles.clearButton}
                onPress={handleClearAll}
              >
                <Text style={styles.clearButtonText}>Clear All</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.applyButton}
                onPress={applyFilters}
              >
                <Text style={styles.applyButtonText}>Apply Filters</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
    paddingVertical: 8,
  },
  scrollContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  filterButton: {
    width: 40,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 4,
  },
  filterButtonActive: {
    backgroundColor: "#2563eb",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    backgroundColor: "#dc2626",
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#ffffff",
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 18,
    backgroundColor: "#f3f4f6",
  },
  chipActive: {
    backgroundColor: "#2563eb",
  },
  chipIcon: {
    marginRight: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: "500",
    color: "#6b7280",
  },
  chipTextActive: {
    color: "#ffffff",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: "#ffffff",
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
  filterSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 10,
  },
  optionsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#f3f4f6",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  optionChipActive: {
    backgroundColor: "#dbeafe",
    borderColor: "#2563eb",
  },
  optionText: {
    fontSize: 13,
    color: "#6b7280",
  },
  optionTextActive: {
    color: "#2563eb",
    fontWeight: "600",
  },
  modalFooter: {
    flexDirection: "row",
    padding: 16,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  clearButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f3f4f6",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#6b7280",
  },
  applyButton: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#2563eb",
    alignItems: "center",
  },
  applyButtonText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#ffffff",
  },
});

export default NotificationFilters;
