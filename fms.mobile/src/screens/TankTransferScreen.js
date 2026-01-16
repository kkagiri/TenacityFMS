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
import DateTimePicker from "@react-native-community/datetimepicker";
import { fetchTanksBySite, fetchTanks } from "../redux/slices/tankSlice";
import { fetchSiteList } from "../redux/slices/siteSlice";
import {
  createTankTransfer,
  clearTransferResult,
} from "../redux/slices/stockSlice";

const STORAGE_KEYS = {
  DEFAULT_SITE: "fms_default_site",
};

const TRANSFER_TYPES = [
  { id: "InterTank", name: "Between Tanks (Same Site)" },
  { id: "InterSite", name: "Between Sites" },
];

const TankTransferScreen = ({ navigation, route }) => {
  const dispatch = useDispatch();
  const { siteId: paramSiteId, siteName: paramSiteName } = route.params || {};

  // Redux state
  const { filteredTanks, tanks: allTanks, isLoading: tanksLoading } = useSelector(
    (state) => state.tank
  );
  const { sites } = useSelector((state) => state.site);
  const { isCreatingTransfer, transferResult } = useSelector(
    (state) => state.stock
  );

  // Local state
  const [defaultSite, setDefaultSite] = useState(null);
  const [transferType, setTransferType] = useState("InterTank");
  const [sourceTank, setSourceTank] = useState(null);
  const [destinationSite, setDestinationSite] = useState(null);
  const [destinationTank, setDestinationTank] = useState(null);
  const [transferDate, setTransferDate] = useState(new Date());
  const [amount, setAmount] = useState("");
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [datePickerMode, setDatePickerMode] = useState("date"); // "date" or "time"

  // Modal visibility
  const [showTransferTypeModal, setShowTransferTypeModal] = useState(false);
  const [showSourceTankModal, setShowSourceTankModal] = useState(false);
  const [showDestSiteModal, setShowDestSiteModal] = useState(false);
  const [showDestTankModal, setShowDestTankModal] = useState(false);

  // Filtered tanks for destination
  const [destinationTanks, setDestinationTanks] = useState([]);

  // Theme color for transfer
  const themeColor = "#8b5cf6";

  // Load site from params or storage
  useEffect(() => {
    const loadInitialData = async () => {
      dispatch(fetchSiteList());
      dispatch(fetchTanks());

      if (paramSiteId) {
        const site = { id: paramSiteId, name: paramSiteName };
        setDefaultSite(site);
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
    loadInitialData();
  }, [paramSiteId, dispatch]);

  // Handle transfer result
  useEffect(() => {
    if (transferResult) {
      if (transferResult.success) {
        Alert.alert("Success", transferResult.message, [
          {
            text: "OK",
            onPress: () => {
              dispatch(clearTransferResult());
              navigation.goBack();
            },
          },
        ]);
      } else {
        Alert.alert("Error", transferResult.message);
        dispatch(clearTransferResult());
      }
    }
  }, [transferResult, dispatch, navigation]);

  // Update destination tanks when source tank or transfer type changes
  useEffect(() => {
    if (transferType === "InterTank" && defaultSite) {
      // Same site - exclude source tank
      const availableTanks = filteredTanks.filter(
        (tank) => tank.id !== sourceTank?.id
      );
      setDestinationTanks(availableTanks);
      setDestinationSite(defaultSite);
    } else if (transferType === "InterSite" && destinationSite) {
      // Different site - show all tanks from destination site
      const tanksAtDestination = allTanks.filter(
        (tank) => tank.siteId === destinationSite.id
      );
      setDestinationTanks(tanksAtDestination);
    } else {
      setDestinationTanks([]);
    }
  }, [transferType, sourceTank, destinationSite, filteredTanks, allTanks, defaultSite]);

  // Reset destination when transfer type changes
  useEffect(() => {
    setDestinationTank(null);
    if (transferType === "InterTank") {
      setDestinationSite(defaultSite);
    } else {
      setDestinationSite(null);
    }
  }, [transferType, defaultSite]);

  const handleTransferTypeSelect = (type) => {
    setTransferType(type.id);
    setShowTransferTypeModal(false);
    // Reset selections
    setSourceTank(null);
    setDestinationTank(null);
  };

  const handleSourceTankSelect = (tank) => {
    setSourceTank(tank);
    setShowSourceTankModal(false);
    setDestinationTank(null); // Reset destination when source changes
  };

  const handleDestSiteSelect = (site) => {
    setDestinationSite(site);
    setShowDestSiteModal(false);
    setDestinationTank(null); // Reset destination tank when site changes
  };

  const handleDestTankSelect = (tank) => {
    setDestinationTank(tank);
    setShowDestTankModal(false);
  };

  const validateForm = () => {
    if (!sourceTank) {
      Alert.alert("Error", "Please select a source tank");
      return false;
    }
    if (!destinationSite) {
      Alert.alert("Error", "Please select a destination site");
      return false;
    }
    if (!destinationTank) {
      Alert.alert("Error", "Please select a destination tank");
      return false;
    }
    if (sourceTank.id === destinationTank.id) {
      Alert.alert("Error", "Source and destination tanks must be different");
      return false;
    }
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      Alert.alert("Error", "Please enter a valid transfer amount greater than 0");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    const transferData = {
      sourceTankId: sourceTank.id,
      destinationTankId: destinationTank.id,
      amount: parseFloat(amount),
      date: transferDate.toISOString(),
      transferType: transferType,
    };

    dispatch(createTankTransfer(transferData));
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

  const getTransferTypeName = () => {
    const type = TRANSFER_TYPES.find((t) => t.id === transferType);
    return type?.name || "Select transfer type";
  };

  const getAvailableSites = () => {
    // For inter-site transfer, exclude source site
    if (transferType === "InterSite" && defaultSite) {
      return sites.filter((site) => site.id !== defaultSite.id);
    }
    return sites;
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: themeColor + "15" }]}>
          <View style={[styles.headerIconContainer, { backgroundColor: themeColor }]}>
            <Icon name="exchange-alt" size={24} color="white" />
          </View>
          <Text style={styles.headerTitle}>Tank Transfer</Text>
          <Text style={styles.headerSubtitle}>
            From: {defaultSite?.name || "No site selected"}
          </Text>
        </View>

        {/* Transfer Type Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transfer Type *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowTransferTypeModal(true)}
          >
            <View style={styles.selectedInfo}>
              <Icon name="exchange-alt" size={20} color={themeColor} />
              <Text style={styles.selectedName}>{getTransferTypeName()}</Text>
            </View>
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transfer Date & Time *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => {
              setDatePickerMode("date");
              setShowDatePicker(true);
            }}
          >
            <View style={styles.selectedInfo}>
              <Icon name="calendar-alt" size={20} color={themeColor} />
              <Text style={styles.selectedName}>{formatDate(transferDate)}</Text>
            </View>
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Source Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Source</Text>
        </View>

        {/* Source Site (Read-only) */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Source Site</Text>
          <View style={[styles.selectButton, styles.readOnlyButton]}>
            <View style={styles.selectedInfo}>
              <Icon name="map-marker-alt" size={20} color={themeColor} />
              <Text style={styles.selectedName}>
                {defaultSite?.name || "Not selected"}
              </Text>
            </View>
          </View>
        </View>

        {/* Source Tank Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Source Tank *</Text>
          <TouchableOpacity
            style={styles.selectButton}
            onPress={() => setShowSourceTankModal(true)}
          >
            {sourceTank ? (
              <View style={styles.selectedInfo}>
                <Icon name="database" size={20} color={themeColor} />
                <View style={styles.selectedText}>
                  <Text style={styles.selectedName}>{sourceTank.name}</Text>
                  {sourceTank.productName && (
                    <Text style={styles.selectedSubtext}>{sourceTank.productName}</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Icon name="database" size={20} color="#9ca3af" />
                <Text style={styles.placeholderText}>Select source tank</Text>
              </View>
            )}
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Source Tank Info */}
        {sourceTank && (
          <View style={styles.tankInfoCard}>
            <View style={styles.tankInfoRow}>
              <Text style={styles.tankInfoLabel}>Capacity:</Text>
              <Text style={styles.tankInfoValue}>
                {sourceTank.capacity?.toLocaleString() || "N/A"} L
              </Text>
            </View>
            {(sourceTank.physicalStockValue !== undefined || sourceTank.currentVolume !== undefined) && (
              <View style={styles.tankInfoRow}>
                <Text style={styles.tankInfoLabel}>Physical Stock:</Text>
                <Text style={styles.tankInfoValue}>
                  {(sourceTank.physicalStockValue ?? sourceTank.currentVolume)?.toLocaleString() || "N/A"} L
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Destination Section */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionHeaderText}>Destination</Text>
        </View>

        {/* Destination Site Selection (only for InterSite) */}
        {transferType === "InterSite" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Destination Site *</Text>
            <TouchableOpacity
              style={styles.selectButton}
              onPress={() => setShowDestSiteModal(true)}
            >
              {destinationSite ? (
                <View style={styles.selectedInfo}>
                  <Icon name="map-marker-alt" size={20} color={themeColor} />
                  <Text style={styles.selectedName}>{destinationSite.name}</Text>
                </View>
              ) : (
                <View style={styles.placeholderContainer}>
                  <Icon name="map-marker-alt" size={20} color="#9ca3af" />
                  <Text style={styles.placeholderText}>Select destination site</Text>
                </View>
              )}
              <Icon name="chevron-down" size={16} color="#6b7280" />
            </TouchableOpacity>
          </View>
        )}

        {/* Destination Site (Read-only for InterTank) */}
        {transferType === "InterTank" && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Destination Site</Text>
            <View style={[styles.selectButton, styles.readOnlyButton]}>
              <View style={styles.selectedInfo}>
                <Icon name="map-marker-alt" size={20} color={themeColor} />
                <Text style={styles.selectedName}>
                  {defaultSite?.name || "Same as source"}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Destination Tank Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Destination Tank *</Text>
          <TouchableOpacity
            style={[
              styles.selectButton,
              (!sourceTank || (transferType === "InterSite" && !destinationSite)) &&
                styles.selectButtonDisabled,
            ]}
            onPress={() => setShowDestTankModal(true)}
            disabled={!sourceTank || (transferType === "InterSite" && !destinationSite)}
          >
            {destinationTank ? (
              <View style={styles.selectedInfo}>
                <Icon name="database" size={20} color={themeColor} />
                <View style={styles.selectedText}>
                  <Text style={styles.selectedName}>{destinationTank.name}</Text>
                  {destinationTank.productName && (
                    <Text style={styles.selectedSubtext}>{destinationTank.productName}</Text>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.placeholderContainer}>
                <Icon name="database" size={20} color="#9ca3af" />
                <Text style={styles.placeholderText}>
                  {!sourceTank
                    ? "Select source tank first"
                    : transferType === "InterSite" && !destinationSite
                    ? "Select destination site first"
                    : "Select destination tank"}
                </Text>
              </View>
            )}
            <Icon name="chevron-down" size={16} color="#6b7280" />
          </TouchableOpacity>
        </View>

        {/* Transfer Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>Transfer Amount (Liters) *</Text>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.textInput}
              value={amount}
              onChangeText={setAmount}
              placeholder="Enter transfer amount"
              keyboardType="decimal-pad"
              placeholderTextColor="#9ca3af"
            />
            <Text style={styles.inputUnit}>L</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionSection}>
          <TouchableOpacity
            style={[styles.saveButton, { backgroundColor: themeColor }]}
            onPress={handleSave}
            disabled={isCreatingTransfer}
          >
            {isCreatingTransfer ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <Icon name="save" size={18} color="white" />
                <Text style={styles.saveButtonText}>Save Transfer</Text>
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

      {/* Transfer Type Modal */}
      <Modal
        visible={showTransferTypeModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowTransferTypeModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContainer, styles.smallModal]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Transfer Type</Text>
              <TouchableOpacity
                onPress={() => setShowTransferTypeModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={TRANSFER_TYPES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.listItem,
                    transferType === item.id && styles.listItemSelected,
                  ]}
                  onPress={() => handleTransferTypeSelect(item)}
                >
                  <View style={[styles.listItemIcon, { backgroundColor: themeColor + "15" }]}>
                    <Icon
                      name={item.id === "InterTank" ? "database" : "truck"}
                      size={20}
                      color={themeColor}
                    />
                  </View>
                  <View style={styles.listItemInfo}>
                    <Text style={styles.listItemName}>{item.name}</Text>
                  </View>
                  {transferType === item.id && (
                    <Icon name="check-circle" size={20} color={themeColor} solid />
                  )}
                </TouchableOpacity>
              )}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </View>
      </Modal>

      {/* Source Tank Modal */}
      <Modal
        visible={showSourceTankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowSourceTankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Source Tank</Text>
              <TouchableOpacity
                onPress={() => setShowSourceTankModal(false)}
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
                      sourceTank?.id === item.id && styles.listItemSelected,
                    ]}
                    onPress={() => handleSourceTankSelect(item)}
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
                    {sourceTank?.id === item.id && (
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

      {/* Destination Site Modal */}
      <Modal
        visible={showDestSiteModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDestSiteModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Destination Site</Text>
              <TouchableOpacity
                onPress={() => setShowDestSiteModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {getAvailableSites().length > 0 ? (
              <FlatList
                data={getAvailableSites()}
                keyExtractor={(item) => String(item.id || item.name || Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      destinationSite?.id === item.id && styles.listItemSelected,
                    ]}
                    onPress={() => handleDestSiteSelect(item)}
                  >
                    <View style={[styles.listItemIcon, { backgroundColor: themeColor + "15" }]}>
                      <Icon name="map-marker-alt" size={20} color={themeColor} />
                    </View>
                    <View style={styles.listItemInfo}>
                      <Text style={styles.listItemName}>{item.name}</Text>
                    </View>
                    {destinationSite?.id === item.id && (
                      <Icon name="check-circle" size={20} color={themeColor} solid />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="map-marker-alt" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>No other sites available</Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Destination Tank Modal */}
      <Modal
        visible={showDestTankModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDestTankModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Destination Tank</Text>
              <TouchableOpacity
                onPress={() => setShowDestTankModal(false)}
                style={styles.modalCloseButton}
              >
                <Icon name="times" size={20} color="#6b7280" />
              </TouchableOpacity>
            </View>

            {destinationTanks.length > 0 ? (
              <FlatList
                data={destinationTanks}
                keyExtractor={(item) => String(item.id || item.name || Math.random())}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.listItem,
                      destinationTank?.id === item.id && styles.listItemSelected,
                    ]}
                    onPress={() => handleDestTankSelect(item)}
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
                    {destinationTank?.id === item.id && (
                      <Icon name="check-circle" size={20} color={themeColor} solid />
                    )}
                  </TouchableOpacity>
                )}
                ItemSeparatorComponent={() => <View style={styles.separator} />}
              />
            ) : (
              <View style={styles.emptyContainer}>
                <Icon name="database" size={40} color="#9ca3af" />
                <Text style={styles.emptyText}>
                  {!sourceTank
                    ? "Select source tank first"
                    : "No other tanks available"}
                </Text>
              </View>
            )}
          </View>
        </View>
      </Modal>

      {/* Date Time Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={transferDate}
          mode={datePickerMode}
          display={Platform.OS === "ios" ? "spinner" : "default"}
          onChange={(event, selectedDate) => {
            if (Platform.OS === "android") {
              setShowDatePicker(false);
            }
            if (event.type === "dismissed") {
              setShowDatePicker(false);
              return;
            }
            if (selectedDate) {
              if (datePickerMode === "date") {
                // After selecting date, show time picker
                const newDate = new Date(transferDate);
                newDate.setFullYear(selectedDate.getFullYear());
                newDate.setMonth(selectedDate.getMonth());
                newDate.setDate(selectedDate.getDate());
                setTransferDate(newDate);
                if (Platform.OS === "android") {
                  // On Android, show time picker after date
                  setTimeout(() => {
                    setDatePickerMode("time");
                    setShowDatePicker(true);
                  }, 100);
                } else {
                  setDatePickerMode("time");
                }
              } else {
                // Time selected
                const newDate = new Date(transferDate);
                newDate.setHours(selectedDate.getHours());
                newDate.setMinutes(selectedDate.getMinutes());
                setTransferDate(newDate);
                setShowDatePicker(false);
                setDatePickerMode("date");
              }
            }
          }}
          maximumDate={new Date()}
        />
      )}
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
  readOnlyButton: {
    backgroundColor: "#f9fafb",
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
  tankInfoCard: {
    backgroundColor: "white",
    marginHorizontal: 16,
    marginBottom: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  tankInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  tankInfoLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  tankInfoValue: {
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
  smallModal: {
    minHeight: "25%",
    maxHeight: "35%",
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
    backgroundColor: "#ede9fe",
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

export default TankTransferScreen;
