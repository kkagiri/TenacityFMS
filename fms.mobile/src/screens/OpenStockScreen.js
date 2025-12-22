import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import {
  fetchTanksBySite,
  createOpeningStock,
  createClosingStock,
  getTankCurrentVolume,
  clearStockResult,
  clearError,
} from "../redux/slices/tankSlice";

const OpenStockScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { siteId, siteName, stockType = "opening" } = route.params || {};

  // Redux state
  const {
    filteredTanks,
    isLoading,
    isCreatingStock,
    isFetchingVolume,
    tankVolumes,
    stockCreationResult,
    error,
  } = useSelector((state) => state.tank);

  // Local state
  const [selectedTank, setSelectedTank] = useState(null);
  const [stockValue, setStockValue] = useState("");
  const [showTankModal, setShowTankModal] = useState(false);

  // Fetch tanks on mount
  useEffect(() => {
    if (siteId) {
      dispatch(fetchTanksBySite(siteId));
    }
  }, [siteId, dispatch]);

  // Handle stock creation result
  useEffect(() => {
    if (stockCreationResult) {
      if (stockCreationResult.success) {
        Alert.alert("Success", stockCreationResult.message, [
          {
            text: "OK",
            onPress: () => {
              dispatch(clearStockResult());
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error", stockCreationResult.message);
        dispatch(clearStockResult());
      }
    }
  }, [stockCreationResult, dispatch, navigation]);

  // Handle errors
  useEffect(() => {
    if (error) {
      Alert.alert("Error", error);
      dispatch(clearError());
    }
  }, [error, dispatch]);

  const handleTankSelect = (tank) => {
    setSelectedTank(tank);
    setShowTankModal(false);
    setStockValue("");
  };

  const handleGetFromSensor = async () => {
    if (!selectedTank) {
      Alert.alert("Error", "Please select a tank first");
      return;
    }

    try {
      const result = await dispatch(
        getTankCurrentVolume(selectedTank.id)
      ).unwrap();
      if (result?.volume !== undefined) {
        setStockValue(result.volume.toString());
      }
    } catch (error) {
      Alert.alert(
        "Sensor Error",
        "Could not retrieve current volume from sensor. Please enter the value manually.",
        [{ text: "OK" }]
      );
    }
  };

  const handleSave = async () => {
    if (!selectedTank) {
      Alert.alert("Error", "Please select a tank");
      return;
    }

    const value = parseFloat(stockValue);
    if (isNaN(value) || value <= 0) {
      Alert.alert("Error", "Please enter a valid stock value greater than 0");
      return;
    }

    // Validate against tank capacity
    if (selectedTank.capacity && value > selectedTank.capacity) {
      Alert.alert(
        "Warning",
        `The entered value (${value.toLocaleString()} L) exceeds the tank capacity (${selectedTank.capacity.toLocaleString()} L). Are you sure you want to continue?`,
        [
          { text: "Cancel", style: "cancel" },
          { text: "Continue", onPress: () => saveStock(value) },
        ]
      );
      return;
    }

    saveStock(value);
  };

  const saveStock = async (value) => {
    const stockData = {
      tankId: selectedTank.id,
      amount: value,
      dateTime: new Date(),
    };

    if (stockType === "opening") {
      dispatch(createOpeningStock(stockData));
    } else {
      dispatch(createClosingStock(stockData));
    }
  };

  const isOpening = stockType === "opening";
  const titleText = isOpening ? "Opening Stock" : "Closing Stock";
  const themeColor = isOpening ? "#10b981" : "#6366f1";

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { backgroundColor: themeColor + "10" }]}>
        <View
          style={[styles.headerIconContainer, { backgroundColor: themeColor }]}
        >
          <Icon
            name={isOpening ? "door-open" : "door-closed"}
            size={24}
            color="white"
          />
        </View>
        <Text style={styles.headerTitle}>{titleText}</Text>
        <Text style={styles.headerSubtitle}>{siteName || "Selected Site"}</Text>
      </View>

      {/* Tank Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>Select Tank</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowTankModal(true)}
        >
          {selectedTank ? (
            <View style={styles.selectedTankInfo}>
              <Icon name="database" size={20} color={themeColor} />
              <View style={styles.selectedTankText}>
                <Text style={styles.selectedTankName}>{selectedTank.name}</Text>
                {selectedTank.productName && (
                  <Text style={styles.selectedTankProduct}>
                    {selectedTank.productName}
                  </Text>
                )}
              </View>
            </View>
          ) : (
            <View style={styles.placeholderContainer}>
              <Icon name="database" size={20} color="#9ca3af" />
              <Text style={styles.placeholderText}>Tap to select a tank</Text>
            </View>
          )}
          <Icon name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>
      </View>

      {/* Tank Details */}
      {selectedTank && (
        <View style={styles.tankDetailsCard}>
          <View style={styles.tankDetailRow}>
            <Text style={styles.tankDetailLabel}>Capacity:</Text>
            <Text style={styles.tankDetailValue}>
              {selectedTank.capacity?.toLocaleString() || "N/A"} L
            </Text>
          </View>
          {selectedTank.productName && (
            <View style={styles.tankDetailRow}>
              <Text style={styles.tankDetailLabel}>Product:</Text>
              <Text style={styles.tankDetailValue}>
                {selectedTank.productName}
              </Text>
            </View>
          )}
          {tankVolumes[selectedTank.id] !== undefined && (
            <View style={styles.tankDetailRow}>
              <Text style={styles.tankDetailLabel}>Last Known Volume:</Text>
              <Text style={styles.tankDetailValue}>
                {tankVolumes[selectedTank.id].toLocaleString()} L
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Stock Value Input */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{titleText} Value (Liters)</Text>
        <View style={styles.inputRow}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={stockValue}
              onChangeText={setStockValue}
              placeholder="Enter volume in liters"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputUnit}>L</Text>
          </View>
        </View>

        {/* Get from Sensor Button */}
        <TouchableOpacity
          style={[styles.sensorButton, !selectedTank && styles.buttonDisabled]}
          onPress={handleGetFromSensor}
          disabled={!selectedTank || isFetchingVolume}
        >
          {isFetchingVolume ? (
            <ActivityIndicator size="small" color={themeColor} />
          ) : (
            <Icon
              name="satellite-dish"
              size={18}
              color={selectedTank ? themeColor : "#9ca3af"}
            />
          )}
          <Text
            style={[
              styles.sensorButtonText,
              { color: selectedTank ? themeColor : "#9ca3af" },
            ]}
          >
            Get from Sensor
          </Text>
        </TouchableOpacity>
      </View>

      {/* Save Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity
          style={[styles.saveButton, { backgroundColor: themeColor }]}
          onPress={handleSave}
          disabled={isCreatingStock || !selectedTank || !stockValue}
        >
          {isCreatingStock ? (
            <ActivityIndicator size="small" color="white" />
          ) : (
            <>
              <Icon name="save" size={18} color="white" />
              <Text style={styles.saveButtonText}>Save {titleText}</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* Tank Selection Modal */}
      <Modal
        visible={showTankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Tank</Text>
              <TouchableOpacity
                onPress={() => setShowTankModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColor} />
                <Text style={styles.loadingText}>Loading tanks...</Text>
              </View>
            ) : filteredTanks?.length > 0 ? (
              <FlatList
                data={filteredTanks}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.tankItem,
                      selectedTank?.id === item.id && styles.tankItemSelected,
                    ]}
                    onPress={() => handleTankSelect(item)}
                  >
                    <View
                      style={[
                        styles.tankItemIcon,
                        { backgroundColor: themeColor + "15" },
                      ]}
                    >
                      <Icon name="database" size={20} color={themeColor} />
                    </View>
                    <View style={styles.tankItemInfo}>
                      <Text style={styles.tankItemName}>{item.name}</Text>
                      <Text style={styles.tankItemDetails}>
                        Capacity: {item.capacity?.toLocaleString() || "N/A"} L
                        {item.productName && ` • ${item.productName}`}
                      </Text>
                    </View>
                    {selectedTank?.id === item.id && (
                      <Icon
                        name="check-circle"
                        size={20}
                        color={themeColor}
                        solid
                      />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="database" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  No tanks found for this site
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  header: {
    alignItems: "center",
    padding: 24,
    marginBottom: 16,
  },
  headerIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },
  section: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  selectButton: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  selectedTankInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedTankText: {
    marginLeft: 12,
    flex: 1,
  },
  selectedTankName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  selectedTankProduct: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  placeholderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeholderText: {
    fontSize: 15,
    color: "#9ca3af",
    marginLeft: 12,
  },
  tankDetailsCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tankDetailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  tankDetailLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  tankDetailValue: {
    fontSize: 14,
    fontWeight: "500",
    color: "#1f2937",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  inputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    paddingHorizontal: 16,
  },
  textInput: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: "#1f2937",
    paddingVertical: 16,
  },
  inputUnit: {
    fontSize: 16,
    color: "#6b7280",
    marginLeft: 8,
  },
  sensorButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    marginTop: 12,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  sensorButtonText: {
    fontSize: 15,
    fontWeight: "600",
    marginLeft: 8,
  },
  actionSection: {
    padding: 16,
    paddingTop: 24,
  },
  saveButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  cancelButton: {
    alignItems: "center",
    paddingVertical: 14,
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#6b7280",
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  modalContainer: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: "70%",
    minHeight: "40%",
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
  modalCloseButton: {
    padding: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: "#6b7280",
  },
  tankItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  tankItemSelected: {
    backgroundColor: "#f0fdf4",
  },
  tankItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tankItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  tankItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  tankItemDetails: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: "#f3f4f6",
    marginHorizontal: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 40,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: "#9ca3af",
    textAlign: "center",
  },
});

export default OpenStockScreen;
