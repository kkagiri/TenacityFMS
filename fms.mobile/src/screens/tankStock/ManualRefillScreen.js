import React, { useState, useEffect, useCallback } from "react";
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
import CustomDateTimePicker from "../../components/common/CustomDateTimePicker";
import { fetchTanksBySite } from "../../redux/slices/tankSlice";
import {
  createManualRefill,
  clearRefillResult,
} from "../../redux/slices/stockSlice";
import ApiService from "../../services/apiService";

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
};

const ManualRefillScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { siteId: paramSiteId, siteName: paramSiteName } = route.params || {};

  // Redux state
  const { filteredTanks, isLoading: tanksLoading } = useSelector(
    (state) => state.tank
  );
  const { isCreatingRefill, refillResult, refillError } = useSelector(
    (state) => state.stock
  );
  const currentUser = useSelector((state) => state.auth.user);

  // Local state
  const [defaultSite, setDefaultSite] = useState(null);
  const [selectedTank, setSelectedTank] = useState(null);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedDriver, setSelectedDriver] = useState(null);
  const [showTankModal, setShowTankModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [showDriverModal, setShowDriverModal] = useState(false);
  const [refillDate, setRefillDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Form data
  const [fuelAmount, setFuelAmount] = useState("");
  const [previousMeter, setPreviousMeter] = useState("");
  const [currentMeter, setCurrentMeter] = useState("");
  const [comment, setComment] = useState("");

  // Search states
  const [vehicleSearch, setVehicleSearch] = useState("");
  const [driverSearch, setDriverSearch] = useState("");
  const [searchedVehicles, setSearchedVehicles] = useState([]);
  const [searchedDrivers, setSearchedDrivers] = useState([]);
  const [isSearchingVehicles, setIsSearchingVehicles] = useState(false);
  const [isSearchingDrivers, setIsSearchingDrivers] = useState(false);

  // Theme color for manual refill
  const themeColor = "#f59e0b";

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
  }, [paramSiteId, dispatch]);

  // Handle refill result
  useEffect(() => {
    if (refillResult) {
      if (refillResult.success) {
        Alert.alert("Success", refillResult.message, [
          {
            text: "OK",
            onPress: () => {
              dispatch(clearRefillResult());
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error", refillResult.message);
        dispatch(clearRefillResult());
      }
    }
  }, [refillResult, dispatch, navigation]);

  // Search vehicles
  const searchVehicles = useCallback(async (term) => {
    if (term.length < 2) {
      setSearchedVehicles([]);
      return;
    }
    setIsSearchingVehicles(true);
    try {
      const results = await ApiService.searchVehicles(term, 15);
      // Normalize the results to handle both PascalCase and camelCase
      const normalizedResults = (results || []).map((v) => ({
        id: v.VehicleId || v.vehicleId,
        hyoungNo: v.HyoungNo || v.hyoungNo || "",
        name: v.VehicleName || v.vehicleName || v.Name || v.name || "",
        plateNumber: v.NumberPlate || v.numberPlate || v.PlateNumber || v.plateNumber || "",
        siteName: v.SiteName || v.siteName || v.WorkingSiteName || v.workingSiteName || "",
        vehicleTypeName: v.VehicleTypeName || v.vehicleTypeName || v.TypeName || v.typeName || "",
        tankCapacity: v.TankCapacity || v.tankCapacity || 0,
        driverName: v.DriverName || v.driverName || "",
        tagId: v.TagId || v.tagId || v.RfidTag || v.rfidTag || "",
        fuelType: v.FuelType || v.fuelType || "Diesel",
      }));
      setSearchedVehicles(normalizedResults);
    } catch (error) {
      console.error("Error searching vehicles:", error);
    } finally {
      setIsSearchingVehicles(false);
    }
  }, []);

  // Search drivers/employees
  const searchDrivers = useCallback(async (term) => {
    if (term.length < 2) {
      setSearchedDrivers([]);
      return;
    }
    setIsSearchingDrivers(true);
    try {
      const results = await ApiService.searchEmployees(term, 15);
      // Normalize the results to handle both PascalCase and camelCase
      const normalizedResults = (results || []).map((e) => ({
        id: e.EmployeeId || e.employeeId || e.Id || e.id,
        fullName: e.FullName || e.fullName || e.Name || e.name || "",
        employeeWorkNo: e.EmployeeWorkNo || e.employeeWorkNo || e.WorkNo || e.workNo || "",
        employeephoneNumber: e.EmployeephoneNumber || e.employeephoneNumber || e.PhoneNumber || e.phoneNumber || "",
        siteId: e.SiteId || e.siteId,
        siteName: e.SiteName || e.siteName || "",
      }));
      setSearchedDrivers(normalizedResults);
    } catch (error) {
      console.error("Error searching drivers:", error);
    } finally {
      setIsSearchingDrivers(false);
    }
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (vehicleSearch) searchVehicles(vehicleSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [vehicleSearch, searchVehicles]);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (driverSearch) searchDrivers(driverSearch);
    }, 300);
    return () => clearTimeout(timer);
  }, [driverSearch, searchDrivers]);

  const handleTankSelect = (tank) => {
    setSelectedTank(tank);
    setShowTankModal(false);
  };

  const handleVehicleSelect = (vehicle) => {
    setSelectedVehicle(vehicle);
    setShowVehicleModal(false);
    setVehicleSearch("");
    setSearchedVehicles([]);
  };

  const handleDriverSelect = (driver) => {
    setSelectedDriver(driver);
    setShowDriverModal(false);
    setDriverSearch("");
    setSearchedDrivers([]);
  };

  const validateForm = () => {
    if (!selectedTank) {
      Alert.alert("Error", "Please select a tank");
      return false;
    }
    if (!selectedVehicle) {
      Alert.alert("Error", "Please select a vehicle");
      return false;
    }
    if (!selectedDriver) {
      Alert.alert("Error", "Please select a driver");
      return false;
    }
    const amount = parseFloat(fuelAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert("Error", "Please enter a valid fuel amount greater than 0");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const refillData = {
      vehicleId: selectedVehicle.id,
      tankId: selectedTank.id,
      siteId: defaultSite.id,
      manualFuelrefillAmount: parseFloat(fuelAmount),
      previousMeterReading: previousMeter ? parseFloat(previousMeter) : null,
      currentMeterReading: currentMeter ? parseFloat(currentMeter) : null,
      date: refillDate.toISOString(),
      driverId: selectedDriver.id,
      fuelBy: currentUser?.userName || "Mobile User",
      comment: comment || "",
    };

    dispatch(createManualRefill(refillData));
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
              <Text style={styles.selectedName}>{value.name || value.fullName || value.hyoungNo}</Text>
              {value.plateNumber && (
                <Text style={styles.selectedSubtext}>{value.plateNumber}</Text>
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

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColor + "15" }]}>
          <View style={[styles.headerIconContainer, { backgroundColor: themeColor }]}>
            <Icon name="gas-pump" size={24} color="white" />
          </View>
          <Text style={styles.headerTitle}>Manual Fuel Refill</Text>
          <Text style={styles.headerSubtitle}>
            {defaultSite?.name || "No site selected"}
          </Text>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Refill Date & Time</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowDatePicker(true)}
          >
            <View style={styles.selectedInfo}>
              <Icon name="calendar-alt" size={20} color={themeColor} />
              <Text style={styles.selectedName}>{formatDate(refillDate)}</Text>
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

        {/* Vehicle Selection */}
        {renderSelectButton(
          "Vehicle *",
          selectedVehicle,
          "Search and select a vehicle",
          "truck",
          () => setShowVehicleModal(true)
        )}

        {/* Driver Selection */}
        {renderSelectButton(
          "Driver *",
          selectedDriver,
          "Search and select a driver",
          "user",
          () => setShowDriverModal(true)
        )}

        {/* Fuel Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Fuel Amount (Liters) *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={fuelAmount}
              onChangeText={setFuelAmount}
              placeholder="Enter fuel amount"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputUnit}>L</Text>
          </View>
        </View>

        {/* Meter Readings */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Previous Meter Reading (Optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={previousMeter}
              onChangeText={setPreviousMeter}
              placeholder="Enter previous reading"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputUnit}>km</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Current Meter Reading (Optional)</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={currentMeter}
              onChangeText={setCurrentMeter}
              placeholder="Enter current reading"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputUnit}>km</Text>
          </View>
        </View>

        {/* Comment */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Comment (Optional)</Text>
          <View style={[styles.inputContainer, styles.textAreaContainer]}>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              value={comment}
              onChangeText={setComment}
              placeholder="Add any notes or comments"
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
            />
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: themeColor }]}
            onPress={handleSave}
            disabled={isCreatingRefill}
          >
            {isCreatingRefill ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="save" size={18} color="white" />
                <Text style={styles.saveButtonText}>Save Refill</Text>
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
                keyExtractor={(item) => item.id.toString()}
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

      {/* Vehicle Selection Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Vehicle</Text>
              <TouchableOpacity
                onPress={() => setShowVehicleModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Icon name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={vehicleSearch}
                onChangeText={setVehicleSearch}
                placeholder="Search by hyoung number, plate..."
                placeholderTextColor="#9ca3af"
                autoFocus
              />
              {isSearchingVehicles && (
                <ActivityIndicator size="small" color={themeColor} />
              )}
            </View>

            {searchedVehicles.length > 0 ? (
              <FlatList
                data={searchedVehicles}
                keyExtractor={(item) => String(item.id || item.hyoungNo || Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => handleVehicleSelect(item)}
                  >
                    <View style={[styles.listItemIcon, { backgroundColor: themeColor + "15" }]}>
                      <Icon name="truck" size={20} color={themeColor} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>
                        {item.hyoungNo || item.name}
                      </Text>
                      <Text style={styles.listItemDetails}>
                        {item.plateNumber || "No plate"} • {item.vehicleTypeName || ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : vehicleSearch.length >= 2 && !isSearchingVehicles ? (
              <View style={styles.emptyContainer}>
                <Icon name="truck" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No vehicles found</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="search" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  Type at least 2 characters to search
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Driver Selection Modal */}
      <Modal
        visible={showDriverModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDriverModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Search Driver</Text>
              <TouchableOpacity
                onPress={() => setShowDriverModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.searchContainer}>
              <Icon name="search" size={16} color="#9ca3af" style={styles.searchIcon} />
              <TextInput
                style={styles.searchInput}
                value={driverSearch}
                onChangeText={setDriverSearch}
                placeholder="Search by name, work number..."
                placeholderTextColor="#9ca3af"
                autoFocus
              />
              {isSearchingDrivers && (
                <ActivityIndicator size="small" color={themeColor} />
              )}
            </View>

            {searchedDrivers.length > 0 ? (
              <FlatList
                data={searchedDrivers}
                keyExtractor={(item) => String(item.id || item.employeeWorkNo || Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.listItem}
                    onPress={() => handleDriverSelect(item)}
                  >
                    <View style={[styles.listItemIcon, { backgroundColor: themeColor + "15" }]}>
                      <Icon name="user" size={20} color={themeColor} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{item.fullName}</Text>
                      <Text style={styles.listItemDetails}>
                        {item.employeeWorkNo || "No work number"} • {item.employeephoneNumber || ""}
                      </Text>
                    </View>
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : driverSearch.length >= 2 && !isSearchingDrivers ? (
              <View style={styles.emptyContainer}>
                <Icon name="user" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No drivers found</Text>
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="search" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  Type at least 2 characters to search
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Custom Date Time Picker */}
      <CustomDateTimePicker
        visible={showDatePicker}
        value={refillDate}
        onConfirm={(date) => {
          setRefillDate(date);
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
  textAreaContainer: {
    alignItems: "flex-start",
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top",
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
    maxHeight: "80%",
    minHeight: "50%",
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
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f3f4f6",
    margin: 16,
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
    color: "#1f2937",
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
    backgroundColor: "#fef3c7",
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

export default ManualRefillScreen;
