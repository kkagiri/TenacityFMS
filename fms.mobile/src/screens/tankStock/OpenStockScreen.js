/**
 * File: OpenStockScreen.js
 * Purpose: Capture opening/closing stock entries for tanks with date-time selection
 * Dependencies: react, react-native, react-redux, FontAwesome5, CustomDateTimePicker
 * Last Modified: 2026-02-07
 *
 * Key Functions/Components:
 * - OpenStockScreen: Main screen for opening/closing stock creation
 */
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  FlatList,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import CustomDateTimePicker from "../../components/common/CustomDateTimePicker";
import {
  fetchTanksBySite,
  createOpeningStock,
  createClosingStock,
  getTankCurrentVolume,
  clearStockResult,
  clearError,
} from "../../redux/slices/tankSlice";
import styles from "./OpenStockScreen.styles";

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
  const [stockDate, setStockDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

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
      dateTime: stockDate,
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

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

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

      {/* Date Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionLabel}>{titleText} Date & Time</Text>
        <TouchableOpacity
          style={styles.selectButton}
          onPress={() => setShowDatePicker(true)}
        >
          <View style={styles.dateInfo}>
            <Icon name="calendar-alt" size={20} color={themeColor} />
            <View style={styles.dateText}>
              <Text style={styles.dateValue}>{formatDate(stockDate)}</Text>
            </View>
          </View>
          <Icon name="chevron-down" size={16} color="#6b7280" />
        </TouchableOpacity>
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

      <CustomDateTimePicker
        visible={showDatePicker}
        value={stockDate}
        onConfirm={(date) => {
          setStockDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        themeColor={themeColor}
        maximumDate={new Date()}
      />
    </ScrollView>
  );
};

export default OpenStockScreen;
