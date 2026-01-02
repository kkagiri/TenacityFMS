import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  Dimensions,
  TextInput,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import DateTimePicker from "@react-native-community/datetimepicker";
import { Picker } from "@react-native-picker/picker";

import {
  fetchTransactionHistory,
  fetchTransactionSummary,
  updateFilters,
  clearFilters,
  setPage,
  clearErrors,
} from "../redux/slices/transactionSlice";

const { width } = Dimensions.get("window");

const TransactionHistoryScreen = ({ navigation }) => {
  const dispatch = useDispatch();
  const {
    transactions,
    totalCount,
    currentPage,
    pageSize,
    hasMore,
    isLoading,
    isLoadingMore,
    error,
    filters,
    summary,
  } = useSelector((state) => state.transaction);

  const { user } = useSelector((state) => state.auth);
  const { ptsDeviceList } = useSelector((state) => state.device);

  // Local state for UI
  const [showFilters, setShowFilters] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState("start");
  const [tempFilters, setTempFilters] = useState(filters);
  const [searchQuery, setSearchQuery] = useState("");

  // Available pumps for filtering
  const [availablePumps, setAvailablePumps] = useState([]);

  useEffect(() => {
    // Initial load
    loadTransactions();
    loadSummary();
  }, []);

  useEffect(() => {
    // Extract available pumps from devices
    const pumps = [];
    ptsDeviceList.forEach((device) => {
      if (device.pumps) {
        device.pumps.forEach((pump) => {
          pumps.push({
            id: pump.id,
            name: `Pump ${pump.number} - ${device.name}`,
            deviceId: device.id,
            pumpNumber: pump.number,
          });
        });
      }
    });
    setAvailablePumps(pumps);
  }, [ptsDeviceList]);

  const loadTransactions = useCallback(
    (page = 1, refresh = false) => {
      const searchFilters = {
        ...filters,
        page,
        pageSize,
      };

      if (searchQuery.trim()) {
        searchFilters.search = searchQuery.trim();
      }

      dispatch(fetchTransactionHistory(searchFilters));
    },
    [dispatch, filters, pageSize, searchQuery]
  );

  const loadSummary = useCallback(() => {
    const summaryFilters = {
      startDate: filters.startDate,
      endDate: filters.endDate,
      pumpId: filters.pumpId,
      deviceId: filters.deviceId,
    };
    dispatch(fetchTransactionSummary(summaryFilters));
  }, [dispatch, filters]);

  const handleRefresh = () => {
    dispatch(clearErrors());
    loadTransactions(1, true);
    loadSummary();
  };

  const handleLoadMore = () => {
    if (hasMore && !isLoadingMore) {
      loadTransactions(currentPage + 1);
    }
  };

  const handleApplyFilters = () => {
    dispatch(updateFilters(tempFilters));
    setShowFilters(false);
    setTimeout(() => {
      loadTransactions(1, true);
      loadSummary();
    }, 100);
  };

  const handleClearFilters = () => {
    setTempFilters({
      startDate: null,
      endDate: null,
      pumpId: null,
      deviceId: null,
      sortBy: "createdAt",
      sortOrder: "desc",
    });
    setSearchQuery("");
    dispatch(clearFilters());
    setTimeout(() => {
      loadTransactions(1, true);
      loadSummary();
    }, 100);
  };

  const handleDateChange = (event, selectedDate) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setTempFilters((prev) => ({
        ...prev,
        [datePickerMode === "start" ? "startDate" : "endDate"]: selectedDate
          .toISOString()
          .split("T")[0],
      }));
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-KE", {
      style: "currency",
      currency: "KES",
    }).format(amount || 0);
  };

  const formatVolume = (volume) => {
    return `${(volume || 0).toFixed(2)} L`;
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "#10b981";
      case "cancelled":
        return "#ef4444";
      case "pending":
        return "#f59e0b";
      case "authorized":
        return "#3b82f6";
      default:
        return "#6b7280";
    }
  };

  const getStatusIcon = (status) => {
    switch (status?.toLowerCase()) {
      case "completed":
        return "check-circle";
      case "cancelled":
        return "times-circle";
      case "pending":
        return "clock";
      case "authorized":
        return "play-circle";
      default:
        return "question-circle";
    }
  };

  const renderTransactionItem = ({ item, index }) => (
    <TouchableOpacity
      style={styles.transactionCard}
      onPress={() =>
        navigation.navigate("TransactionDetails", {
          transactionId: item.packetId || item.transaction,
        })
      }
    >
      <View style={styles.transactionHeader}>
        <View style={styles.transactionInfo}>
          <Text style={styles.transactionId}>
            #{item.transaction || item.packetId}
          </Text>
          <Text style={styles.transactionDate}>
            {formatDate(item.dateTime)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: item.hasBeenProcessed ? "#10b981" : "#f59e0b" },
          ]}
        >
          <Icon
            name={item.hasBeenProcessed ? "check" : "clock"}
            size={12}
            color="white"
            style={styles.statusIcon}
          />
          <Text style={styles.statusText}>
            {item.hasBeenProcessed ? "Processed" : "Pending"}
          </Text>
        </View>
      </View>

      <View style={styles.transactionDetails}>
        <View style={styles.detailRow}>
          <Icon name="gas-pump" size={14} color="#6b7280" />
          <Text style={styles.detailText}>
            Pump {item.pump} - Nozzle {item.nozzle}{" "}
            {item.fuelGradeName ? `(${item.fuelGradeName})` : ""}
          </Text>
        </View>

        {(item.vehicleName || item.vehicleNumberPlate) && (
          <View style={styles.detailRow}>
            <Icon name="car" size={14} color="#6b7280" />
            <Text style={styles.detailText}>
              {item.vehicleName || item.vehicleNumberPlate}
            </Text>
          </View>
        )}

        {item.tankName && (
          <View style={styles.detailRow}>
            <Icon name="database" size={14} color="#6b7280" />
            <Text style={styles.detailText}>Tank: {item.tankName}</Text>
          </View>
        )}

        {item.tag && (
          <View style={styles.detailRow}>
            <Icon name="tag" size={14} color="#6b7280" />
            <Text style={styles.detailText}>Tag: {item.tag}</Text>
          </View>
        )}
      </View>

      <View style={styles.transactionAmounts}>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Volume</Text>
          <Text style={styles.amountValue}>{formatVolume(item.volume)}</Text>
        </View>
        <View style={styles.amountItem}>
          <Text style={styles.amountLabel}>Amount</Text>
          <Text style={styles.amountValueMoney}>
            {formatCurrency(item.amount)}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderSummaryCard = () => (
    <View style={styles.summaryCard}>
      <Text style={styles.summaryTitle}>Summary</Text>
      <View style={styles.summaryGrid}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Transactions</Text>
          <Text style={styles.summaryValue}>
            {summary.totalTransactions || 0}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Volume</Text>
          <Text style={styles.summaryValue}>
            {formatVolume(summary.totalVolume)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Total Amount</Text>
          <Text style={styles.summaryValueMoney}>
            {formatCurrency(summary.totalAmount)}
          </Text>
        </View>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Average/Transaction</Text>
          <Text style={styles.summaryValueMoney}>
            {formatCurrency(summary.averageTransactionAmount)}
          </Text>
        </View>
      </View>
    </View>
  );

  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowFilters(false)}>
            <Icon name="times" size={24} color="#6b7280" />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>Filter Transactions</Text>
          <TouchableOpacity onPress={handleClearFilters}>
            <Text style={styles.clearButton}>Clear</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modalContent}>
          {/* Date Range */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Date Range</Text>
            <View style={styles.dateRow}>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode("start");
                  setShowDatePicker(true);
                }}
              >
                <Icon name="calendar" size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {tempFilters.startDate
                    ? formatDate(tempFilters.startDate)
                    : "Start Date"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.dateButton}
                onPress={() => {
                  setDatePickerMode("end");
                  setShowDatePicker(true);
                }}
              >
                <Icon name="calendar" size={16} color="#6b7280" />
                <Text style={styles.dateButtonText}>
                  {tempFilters.endDate
                    ? formatDate(tempFilters.endDate)
                    : "End Date"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Pump Selection */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Pump</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.pumpId}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, pumpId: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="All Pumps" value={null} />
                {availablePumps.map((pump) => (
                  <Picker.Item
                    key={pump.id}
                    label={pump.name}
                    value={pump.id}
                  />
                ))}
              </Picker>
            </View>
          </View>

          {/* Sort Options */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Sort By</Text>
            <View style={styles.pickerContainer}>
              <Picker
                selectedValue={tempFilters.sortBy}
                onValueChange={(value) =>
                  setTempFilters((prev) => ({ ...prev, sortBy: value }))
                }
                style={styles.picker}
              >
                <Picker.Item label="Date Created" value="createdAt" />
                <Picker.Item label="Amount" value="amount" />
                <Picker.Item label="Volume" value="volume" />
                <Picker.Item label="Pump Number" value="pumpNumber" />
              </Picker>
            </View>
          </View>

          {/* Sort Order */}
          <View style={styles.filterSection}>
            <Text style={styles.filterLabel}>Order</Text>
            <View style={styles.sortOrderContainer}>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  tempFilters.sortOrder === "desc" && styles.sortButtonActive,
                ]}
                onPress={() =>
                  setTempFilters((prev) => ({ ...prev, sortOrder: "desc" }))
                }
              >
                <Icon
                  name="sort-amount-down"
                  size={16}
                  color={tempFilters.sortOrder === "desc" ? "white" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    tempFilters.sortOrder === "desc" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Newest First
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.sortButton,
                  tempFilters.sortOrder === "asc" && styles.sortButtonActive,
                ]}
                onPress={() =>
                  setTempFilters((prev) => ({ ...prev, sortOrder: "asc" }))
                }
              >
                <Icon
                  name="sort-amount-up"
                  size={16}
                  color={tempFilters.sortOrder === "asc" ? "white" : "#6b7280"}
                />
                <Text
                  style={[
                    styles.sortButtonText,
                    tempFilters.sortOrder === "asc" &&
                      styles.sortButtonTextActive,
                  ]}
                >
                  Oldest First
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        <View style={styles.modalActions}>
          <TouchableOpacity
            style={styles.applyButton}
            onPress={handleApplyFilters}
          >
            <Text style={styles.applyButtonText}>Apply Filters</Text>
          </TouchableOpacity>
        </View>
      </View>

      {showDatePicker && (
        <DateTimePicker
          value={new Date()}
          mode="date"
          display="default"
          onChange={handleDateChange}
          maximumDate={new Date()}
        />
      )}
    </Modal>
  );

  return (
    <View style={styles.container}>
      {/* Header with Search and Filter */}
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Icon
            name="search"
            size={16}
            color="#6b7280"
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search transactions..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => loadTransactions(1, true)}
          />
        </View>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilters(true)}
        >
          <Icon name="filter" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Summary Card */}
      {renderSummaryCard()}

      {/* Transaction List */}
      <FlatList
        data={transactions}
        renderItem={renderTransactionItem}
        keyExtractor={(item, index) =>
          `${item.packetId || item.transaction}-${index}`
        }
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isLoading && currentPage === 1}
            onRefresh={handleRefresh}
            colors={["#2563eb"]}
            tintColor="#2563eb"
          />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={() =>
          isLoadingMore ? (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" color="#2563eb" />
              <Text style={styles.loadingMoreText}>Loading more...</Text>
            </View>
          ) : null
        }
        ListEmptyComponent={() =>
          !isLoading ? (
            <View style={styles.emptyContainer}>
              <Icon name="receipt" size={48} color="#d1d5db" />
              <Text style={styles.emptyTitle}>No Transactions Found</Text>
              <Text style={styles.emptyDescription}>
                {Object.values(filters).some((v) => v)
                  ? "No transactions match your current filters."
                  : "No transactions have been recorded yet."}
              </Text>
              {Object.values(filters).some((v) => v) && (
                <TouchableOpacity
                  style={styles.clearFiltersButton}
                  onPress={handleClearFilters}
                >
                  <Text style={styles.clearFiltersButtonText}>
                    Clear Filters
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          ) : (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#2563eb" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          )
        }
      />

      {/* Filter Modal */}
      {renderFilterModal()}

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Icon name="exclamation-triangle" size={16} color="#dc2626" />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e7eb",
  },
  searchContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 8,
    fontSize: 16,
    color: "#374151",
  },
  filterButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
  },
  summaryCard: {
    backgroundColor: "white",
    margin: 16,
    padding: 16,
    marginBottom: 8,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 12,
  },
  summaryGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  summaryItem: {
    width: "50%",
    paddingVertical: 8,
  },
  summaryLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 4,
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  summaryValueMoney: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  transactionCard: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  transactionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionId: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  transactionDate: {
    fontSize: 12,
    color: "#6b7280",
    marginTop: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusIcon: {
    marginRight: 4,
  },
  statusText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    textTransform: "capitalize",
  },
  transactionDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    color: "#4b5563",
  },
  transactionAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#f3f4f6",
  },
  amountItem: {
    alignItems: "center",
  },
  amountLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 2,
  },
  amountValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  amountValueMoney: {
    fontSize: 16,
    fontWeight: "600",
    color: "#059669",
  },
  loadingMore: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 16,
  },
  loadingMoreText: {
    marginLeft: 8,
    color: "#6b7280",
  },
  emptyContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: "#6b7280",
    textAlign: "center",
    marginBottom: 16,
  },
  clearFiltersButton: {
    backgroundColor: "#2563eb",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearFiltersButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "500",
  },
  loadingContainer: {
    alignItems: "center",
    paddingVertical: 48,
  },
  loadingText: {
    marginTop: 16,
    color: "#6b7280",
  },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef2f2",
    borderColor: "#fecaca",
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    margin: 16,
  },
  errorText: {
    color: "#dc2626",
    fontSize: 14,
    marginLeft: 8,
    flex: 1,
  },
  retryButton: {
    backgroundColor: "#dc2626",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
  },
  retryButtonText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
  },
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: "white",
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
    fontWeight: "600",
    color: "#1f2937",
  },
  clearButton: {
    color: "#2563eb",
    fontSize: 16,
    fontWeight: "500",
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginBottom: 8,
  },
  dateRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  dateButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    width: "48%",
  },
  dateButtonText: {
    marginLeft: 8,
    color: "#374151",
    fontSize: 14,
  },
  pickerContainer: {
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
  },
  picker: {
    height: 50,
  },
  sortOrderContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  sortButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    width: "48%",
  },
  sortButtonActive: {
    backgroundColor: "#2563eb",
    borderColor: "#2563eb",
  },
  sortButtonText: {
    marginLeft: 8,
    color: "#374151",
    fontSize: 14,
  },
  sortButtonTextActive: {
    color: "white",
  },
  modalActions: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  applyButton: {
    backgroundColor: "#2563eb",
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: "center",
  },
  applyButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default TransactionHistoryScreen;
