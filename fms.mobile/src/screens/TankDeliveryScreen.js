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
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useDispatch, useSelector } from "react-redux";
import Icon from "react-native-vector-icons/FontAwesome5";
import AsyncStorage from "@react-native-async-storage/async-storage";
import CustomDateTimePicker from "../components/common/CustomDateTimePicker";
import { fetchTanksBySite } from "../redux/slices/tankSlice";
import {
  createDelivery,
  clearDeliveryResult,
  fetchSuppliers,
} from "../redux/slices/stockSlice";

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
};

const TankDeliveryScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { siteId: paramSiteId, siteName: paramSiteName } = route.params || {};

  // Redux state
  const { filteredTanks, isLoading: tanksLoading } = useSelector(
    (state) => state.tank
  );
  const {
    isCreatingDelivery,
    deliveryResult,
    suppliers,
    isLoadingSuppliers
  } = useSelector((state) => state.stock);

  // Local state
  const [defaultSite, setDefaultSite] = useState(null);
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [showTankModal, setShowTankModal] = useState(false);
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [deliveryDate, setDeliveryDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState("date"); // "date" or "time"

  // Form data
  const [manualDeliveryAmount, setManualDeliveryAmount] = useState("");
  const [sensorDeliveryAmount, setSensorDeliveryAmount] = useState("");
  const [deliveryTemperature, setDeliveryTemperature] = useState("");
  const [deliveryDensity, setDeliveryDensity] = useState("");
  const [deliveryMass, setDeliveryMass] = useState("");

  // Theme color for delivery
  const themeColor = "#10b981";

  // Load site from params or storage
  useEffect(() => {
    const loadSite = async () => {
      if (paramSiteId) {
        setDefaultSite({ id: paramSiteId, name: paramSiteName });
        dispatch(fetchTanksBySite(paramSiteId));
      } else {
        const savedSite = await AsyncStorage.getItem(STORAGE_KEYS.DEFAULT_SITE);
        if (savedSite) {
          const site = JSON.parse(savedSite);
          setDefaultSite(site);
          dispatch(fetchTanksBySite(site.id));
        }
      }
    };
    loadSite();
    dispatch(fetchSuppliers());
  }, [paramSiteId, dispatch]);

  // Handle delivery result
  useEffect(() => {
    if (deliveryResult) {
      if (deliveryResult.success) {
        Alert.alert("Success", deliveryResult.message, [
          {
            text: "OK",
            onPress: () => {
              dispatch(clearDeliveryResult());
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error", deliveryResult.message);
        dispatch(clearDeliveryResult());
      }
    }
  }, [deliveryResult, dispatch, navigation]);

  const handleTankSelect = (tank) => {
    setSelectedTank(tank);
    setShowTankModal(false);
  };

  const handleSupplierSelect = (supplier) => {
    setSelectedSupplier(supplier);
    setShowSupplierModal(false);
  };

  const validateForm = () => {
    if (!selectedTank) {
      Alert.alert("Error", "Please select a tank");
      return false;
    }
    if (!selectedSupplier) {
      Alert.alert("Error", "Please select a supplier");
      return false;
    }
    const amount = parseFloat(manualDeliveryAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid delivery amount greater than 0");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const deliveryData = {
      tankId: selectedTank.id,
      deliveryDate: deliveryDate.toISOString(),
      manualDeliveryAmount: parseFloat(manualDeliveryAmount),
      sensorDeliveryAmount: sensorDeliveryAmount ? parseFloat(sensorDeliveryAmount) : null,
      deliveryTemperature: deliveryTemperature ? parseFloat(deliveryTemperature) : null,
      deliveryDensity: deliveryDensity ? parseFloat(deliveryDensity) : null,
      deliveryMass: deliveryMass ? parseFloat(deliveryMass) : null,
      supplierId: selectedSupplier.id,
    };

    dispatch(createDelivery(deliveryData));
  };

  const formatDate = (date) => {
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const renderSelectButton = (
    label,
    value,
    placeholder,
    icon,
    onPress,
    disabled = false
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>{label}</Text>
      <TouchableOpacity
        style={[styles.selectButton, disabled && styles.selectButtonDisabled]}
        onPress={onPress}
        disabled={disabled}
      >
        {value ? (
          <View style={styles.selectedInfo}>
            <Icon name={icon} size={20} color={themeColor} />
            <View style={styles.selectedText}>
              <Text style={styles.selectedName}>{value.name}</Text>
              {value.productName && (
                <Text style={styles.selectedSubtext}>{value.productName}</Text>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.placeholderContainer}>
            <Icon name={icon} size={20} color="#9ca3af" />
            <Text style={styles.placeholderText}>{placeholder}</Text>
          </View>
        )}
        <Icon name="chevron-down" size={16} color="#6b7280" />
      </TouchableOpacity>
    </View>
  );

  const renderInputField = (
    label,
    value,
    onChangeText,
    placeholder,
    unit,
    required = false
  ) => (
    <View style={styles.section}>
      <Text style={styles.sectionLabel}>
        {label} {required && "*"}
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.textInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          keyboardType="decimal-pad"
          placeholderTextColor="#9ca3af"
        />
        {unit && <Text style={styles.inputUnit}>{unit}</Text>}
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColor + "15" }]}>
          <View style={[styles.headerIconContainer, { backgroundColor: themeColor }]}>
            <Icon name="truck-loading" size={24} color="white" />
          </View>
          <Text style={styles.headerTitle}>Tank Delivery</Text>
          <Text style={styles.headerSubtitle}>
            {defaultSite?.name || "No site selected"}
          </Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Delivery Date & Time *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.selectedInfo}>
              <Icon name="calendar-alt" size={20} color={themeColor} />
              <Text style={styles.selectedName}>{formatDate(deliveryDate)}</Text>
            </View>
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Tank Selection */}
        {renderSelectButton(
          "Tank *",
          selectedTank,
          "Select a tank",
          "database",
          () => setShowTankModal(true)
        )}

        {/* Selected Tank Details */}
        {selectedTank && (
          <View style={styles.tankDetailsCard}>
            <View style={styles.tankDetailRow}>
              <Text style={styles.tankDetailLabel}>Capacity:</Text>
              <Text style={styles.tankDetailValue}>
                {selectedTank.capacity?.toLocaleString() || "N/A"} L
              </Text>
            </View>
            <View style={styles.tankDetailRow}>
              <Text style={styles.tankDetailLabel}>Physical Stock:</Text>
              <Text style={[styles.tankDetailValue, { color: "#10b981", fontWeight: "700" }]}>
                {(selectedTank.physicalStockValue || selectedTank.currentVolume || 0).toLocaleString()} L
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
          </View>
        )}

        {/* Supplier Selection */}
        {renderSelectButton(
          "Supplier *",
          selectedSupplier,
          "Select a supplier",
          "building",
          () => setShowSupplierModal(true)
        )}

        {/* Delivery Amount (Required) */}
        {renderInputField(
          "Manual Delivery Amount",
          manualDeliveryAmount,
          setManualDeliveryAmount,
          "Enter delivery amount",
          "L",
          true
        )}

        {/* Sensor Delivery Amount (Optional) */}
        {renderInputField(
          "Sensor Delivery Amount (Optional)",
          sensorDeliveryAmount,
          setSensorDeliveryAmount,
          "Enter sensor reading",
          "L"
        )}

        {/* Delivery Measurements Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Delivery Measurements (Optional)</Text>
        </View>

        {/* Temperature */}
        {renderInputField(
          "Temperature",
          deliveryTemperature,
          setDeliveryTemperature,
          "Enter temperature",
          "°C"
        )}

        {/* Density */}
        {renderInputField(
          "Density",
          deliveryDensity,
          setDeliveryDensity,
          "Enter density",
          "kg/L"
        )}

        {/* Mass */}
        {renderInputField(
          "Mass",
          deliveryMass,
          setDeliveryMass,
          "Enter mass",
          "kg"
        )}

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: themeColor }]}
            onPress={handleSave}
            disabled={isCreatingDelivery}
          >
            {isCreatingDelivery ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="save" size={18} color="white" />
                <Text style={styles.saveButtonText}>Save Delivery</Text>
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
      </ScrollView>

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

            {tanksLoading ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColor} />
                <Text style={styles.loadingText}>Loading tanks...</Text>
              </View>
            ) : filteredTanks?.length > 0 ? (
              <FlatList
                data={filteredTanks}
                keyExtractor={(item) => String(item.id || item.name || Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      selectedTank?.id === item.id && styles.listItemSelected,
                    ]}
                    onPress={() => handleTankSelect(item)}
                  >
                    <View style={[styles.listItemIcon, { backgroundColor: themeColor + "15" }]}>
                      <Icon name="database" size={20} color={themeColor} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{item.name}</Text>
                      <Text style={styles.listItemDetails}>
                        Capacity: {item.capacity?.toLocaleString() || "N/A"} L • Physical Stock: {(item.physicalStockValue || item.currentVolume || 0).toLocaleString()} L
                        {item.productName && ` • ${item.productName}`}
                      </Text>
                    </View>
                    {selectedTank?.id === item.id && (
                      <Icon name="check-circle" size={20} color={themeColor} solid />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="database" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No tanks found</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Supplier Selection Modal */}
      <Modal
        visible={showSupplierModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSupplierModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Supplier</Text>
              <TouchableOpacity
                onPress={() => setShowSupplierModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {isLoadingSuppliers ? (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color={themeColor} />
                <Text style={styles.loadingText}>Loading suppliers...</Text>
              </View>
            ) : suppliers?.length > 0 ? (
              <FlatList
                data={suppliers}
                keyExtractor={(item) => String(item.id || item.name || Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      selectedSupplier?.id === item.id && styles.listItemSelected,
                    ]}
                    onPress={() => handleSupplierSelect(item)}
                  >
                    <View style={[styles.listItemIcon, { backgroundColor: themeColor + "15" }]}>
                      <Icon name="building" size={20} color={themeColor} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{item.name}</Text>
                      {item.contactPerson && (
                        <Text style={styles.listItemDetails}>
                          Contact: {item.contactPerson}
                        </Text>
                      )}
                    </View>
                    {selectedSupplier?.id === item.id && (
                      <Icon name="check-circle" size={20} color={themeColor} solid />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="building" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No suppliers found</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Date Time Picker */}
      <CustomDateTimePicker
        visible={showDatePicker}
        value={deliveryDate}
        onConfirm={(date) => {
          setDeliveryDate(date);
          setShowDatePicker(false);
        }}
        onCancel={() => setShowDatePicker(false)}
        themeColor={themeColor}
        maximumDate={new Date()}
      />
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  scrollView: {
    flex: 1,
  },
  header: {
    alignItems: "center",
    padding: 24,
    marginBottom: 8,
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
  sectionHeader: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: "#f1f5f9",
    marginBottom: 16,
  },
  sectionHeaderText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
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
  selectButtonDisabled: {
    opacity: 0.5,
  },
  selectedInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  selectedText: {
    marginLeft: 12,
    flex: 1,
  },
  selectedName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginLeft: 12,
  },
  selectedSubtext: {
    fontSize: 13,
    color: "#6b7280",
    marginTop: 2,
    marginLeft: 12,
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
  inputContainer: {
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
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
    paddingVertical: 16,
  },
  inputUnit: {
    fontSize: 14,
    color: "#6b7280",
    marginLeft: 8,
  },
  actionSection: {
    padding: 16,
    paddingTop: 24,
    paddingBottom: 40,
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
  listItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
  },
  listItemSelected: {
    backgroundColor: "#d1fae5",
  },
  listItemIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  listItemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  listItemName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#1f2937",
  },
  listItemDetails: {
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

export default TankDeliveryScreen;
