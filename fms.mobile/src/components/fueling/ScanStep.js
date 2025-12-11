//Cursor - Mobile Scan Step Component
// Allows vehicle selection via lookup, scanning, or manual entry
import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const SELECTION_METHODS = [
  {id: 'lookup', label: 'Vehicle Lookup', icon: 'search'},
  {id: 'scan', label: 'Scan Tag/QR', icon: 'qrcode'},
  {id: 'manual', label: 'Manual Entry', icon: 'keyboard'},
];

const ScanStep = ({
  isScanning,
  scanResult,
  vehicleInfo,
  selectionMethod,
  vehicles = [],
  vehicleReg,
  onScan,
  onVehicleSelect,
  onNext,
  onBack,
  setSelectionMethod,
  setVehicleReg,
  isLoadingVehicles = false,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredVehicles, setFilteredVehicles] = useState([]);
  const [manualReg, setManualReg] = useState('');

  // Filter vehicles based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredVehicles(vehicles.slice(0, 20)); // Show first 20 by default
      return;
    }

    const query = searchQuery.toLowerCase();
    const filtered = vehicles.filter(v =>
      (v.numberPlate || '').toLowerCase().includes(query) ||
      (v.hyoungNo || '').toLowerCase().includes(query) ||
      (v.make || '').toLowerCase().includes(query) ||
      (v.model || '').toLowerCase().includes(query)
    ).slice(0, 20);

    setFilteredVehicles(filtered);
  }, [searchQuery, vehicles]);

  // Handle vehicle selection
  const handleVehiclePress = (vehicle) => {
    onVehicleSelect(vehicle);
  };

  // Handle manual entry submission
  const handleManualSubmit = () => {
    if (!manualReg.trim()) {
      Alert.alert('Error', 'Please enter a vehicle registration number');
      return;
    }

    // Check if vehicle exists in the list
    const existingVehicle = vehicles.find(
      v => (v.numberPlate || '').toLowerCase() === manualReg.toLowerCase()
    );

    if (existingVehicle) {
      onVehicleSelect(existingVehicle);
    } else {
      // Create a temporary vehicle object for manual entry
      setVehicleReg(manualReg);
      onNext({
        vehicleInfo: {
          numberPlate: manualReg,
          isManualEntry: true,
        },
      });
    }
  };

  // Handle scan action
  const handleScan = () => {
    onScan();
  };

  // Proceed with validated vehicle
  const handleProceed = () => {
    if (!vehicleInfo) {
      Alert.alert('Error', 'Please select or enter a vehicle');
      return;
    }
    onNext({vehicleInfo});
  };

  // Render vehicle item in list
  const renderVehicleItem = ({item}) => (
    <TouchableOpacity
      style={[
        styles.vehicleItem,
        vehicleInfo?.id === item.id && styles.vehicleItemSelected,
      ]}
      onPress={() => handleVehiclePress(item)}
      activeOpacity={0.7}
    >
      <View style={styles.vehicleIcon}>
        <Icon
          name={item.vehicleType?.toLowerCase().includes('truck') ? 'truck' : 'car'}
          size={24}
          color={vehicleInfo?.id === item.id ? '#2563eb' : '#6b7280'}
        />
      </View>
      <View style={styles.vehicleDetails}>
        <Text style={styles.vehiclePlate}>{item.numberPlate || item.hyoungNo}</Text>
        <Text style={styles.vehicleInfo}>
          {[item.make, item.model].filter(Boolean).join(' ') || 'Unknown Vehicle'}
        </Text>
        {item.tagId && (
          <Text style={styles.vehicleTag}>Tag: {item.tagId}</Text>
        )}
      </View>
      {vehicleInfo?.id === item.id && (
        <Icon name="check-circle" size={20} color="#2563eb" solid />
      )}
    </TouchableOpacity>
  );

  // Render method selector
  const renderMethodSelector = () => (
    <View style={styles.methodContainer}>
      {SELECTION_METHODS.map(method => (
        <TouchableOpacity
          key={method.id}
          style={[
            styles.methodButton,
            selectionMethod === method.id && styles.methodButtonActive,
          ]}
          onPress={() => setSelectionMethod(method.id)}
        >
          <Icon
            name={method.icon}
            size={20}
            color={selectionMethod === method.id ? '#2563eb' : '#6b7280'}
          />
          <Text
            style={[
              styles.methodText,
              selectionMethod === method.id && styles.methodTextActive,
            ]}
          >
            {method.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  // Render lookup content
  const renderLookupContent = () => (
    <View style={styles.contentContainer}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={18} color="#9ca3af" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by plate, number, make..."
          placeholderTextColor="#9ca3af"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Icon name="times-circle" size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>

      {/* Vehicle List */}
      {isLoadingVehicles ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2563eb" />
          <Text style={styles.loadingText}>Loading vehicles...</Text>
        </View>
      ) : (
        <FlatList
          data={filteredVehicles}
          renderItem={renderVehicleItem}
          keyExtractor={item => item.id?.toString() || item.numberPlate}
          style={styles.vehicleList}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyState}>
              <Icon name="car" size={48} color="#9ca3af" />
              <Text style={styles.emptyText}>No vehicles found</Text>
            </View>
          }
        />
      )}
    </View>
  );

  // Render scan content
  const renderScanContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.scanContainer}>
        <TouchableOpacity
          style={[styles.scanButton, isScanning && styles.scanButtonActive]}
          onPress={handleScan}
          disabled={isScanning}
        >
          {isScanning ? (
            <ActivityIndicator size="large" color="white" />
          ) : (
            <Icon name="qrcode" size={64} color="white" />
          )}
        </TouchableOpacity>
        <Text style={styles.scanText}>
          {isScanning ? 'Scanning...' : 'Tap to scan tag or QR code'}
        </Text>

        {scanResult && (
          <View style={styles.scanResultContainer}>
            <Icon name="check-circle" size={24} color="#10b981" />
            <Text style={styles.scanResultText}>Scanned: {scanResult}</Text>
          </View>
        )}
      </View>

      {/* Instructions */}
      <View style={styles.instructionsContainer}>
        <Text style={styles.instructionsTitle}>How to scan:</Text>
        <View style={styles.instructionItem}>
          <Icon name="1" size={16} color="#6b7280" solid />
          <Text style={styles.instructionText}>Point camera at QR code or NFC tag</Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="2" size={16} color="#6b7280" solid />
          <Text style={styles.instructionText}>Hold steady until scan completes</Text>
        </View>
        <View style={styles.instructionItem}>
          <Icon name="3" size={16} color="#6b7280" solid />
          <Text style={styles.instructionText}>Vehicle info will be retrieved automatically</Text>
        </View>
      </View>
    </View>
  );

  // Render manual entry content
  const renderManualContent = () => (
    <View style={styles.contentContainer}>
      <View style={styles.manualContainer}>
        <Text style={styles.manualLabel}>Vehicle Registration Number</Text>
        <TextInput
          style={styles.manualInput}
          placeholder="Enter registration (e.g., ABC 123)"
          placeholderTextColor="#9ca3af"
          value={manualReg}
          onChangeText={setManualReg}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TouchableOpacity
          style={styles.manualSubmitButton}
          onPress={handleManualSubmit}
        >
          <Text style={styles.manualSubmitText}>Verify & Continue</Text>
          <Icon name="arrow-right" size={16} color="white" />
        </TouchableOpacity>
      </View>

      {/* Warning */}
      <View style={styles.warningContainer}>
        <Icon name="exclamation-triangle" size={16} color="#f59e0b" />
        <Text style={styles.warningText}>
          Manual entry may require additional verification
        </Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Vehicle</Text>
          <Text style={styles.subtitle}>Identify the vehicle for fueling</Text>
        </View>
      </View>

      {/* Method Selector */}
      {renderMethodSelector()}

      {/* Content based on selection method */}
      {selectionMethod === 'lookup' && renderLookupContent()}
      {selectionMethod === 'scan' && renderScanContent()}
      {selectionMethod === 'manual' && renderManualContent()}

      {/* Selected Vehicle Summary & Proceed Button */}
      {vehicleInfo && selectionMethod === 'lookup' && (
        <View style={styles.selectedSummary}>
          <View style={styles.selectedInfo}>
            <Icon name="car" size={24} color="#2563eb" />
            <View style={styles.selectedText}>
              <Text style={styles.selectedPlate}>{vehicleInfo.numberPlate}</Text>
              <Text style={styles.selectedDetails}>
                {[vehicleInfo.make, vehicleInfo.model].filter(Boolean).join(' ')}
              </Text>
            </View>
          </View>
          <TouchableOpacity style={styles.proceedButton} onPress={handleProceed}>
            <Text style={styles.proceedText}>Continue</Text>
            <Icon name="arrow-right" size={16} color="white" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 4,
  },
  methodContainer: {
    flexDirection: 'row',
    marginBottom: 16,
    backgroundColor: '#f3f4f6',
    borderRadius: 12,
    padding: 4,
  },
  methodButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  methodButtonActive: {
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  methodText: {
    marginLeft: 6,
    fontSize: 12,
    color: '#6b7280',
    fontWeight: '500',
  },
  methodTextActive: {
    color: '#2563eb',
  },
  contentContainer: {
    flex: 1,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 16,
    color: '#1f2937',
  },
  vehicleList: {
    flex: 1,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  vehicleItemSelected: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  vehicleDetails: {
    flex: 1,
  },
  vehiclePlate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  vehicleInfo: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  vehicleTag: {
    fontSize: 12,
    color: '#9ca3af',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyText: {
    marginTop: 12,
    fontSize: 16,
    color: '#6b7280',
  },
  scanContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  scanButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: '#2563eb',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scanButtonActive: {
    backgroundColor: '#1d4ed8',
  },
  scanText: {
    fontSize: 16,
    color: '#6b7280',
  },
  scanResultContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    padding: 12,
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
  },
  scanResultText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#065f46',
    fontWeight: '500',
  },
  instructionsContainer: {
    backgroundColor: '#f9fafb',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  instructionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  instructionText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#6b7280',
  },
  manualContainer: {
    paddingVertical: 24,
  },
  manualLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  manualInput: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 18,
    color: '#1f2937',
    textAlign: 'center',
    letterSpacing: 2,
    marginBottom: 16,
  },
  manualSubmitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    borderRadius: 12,
  },
  manualSubmitText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fffbeb',
    padding: 12,
    borderRadius: 8,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#92400e',
  },
  selectedSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#2563eb',
  },
  selectedInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedText: {
    marginLeft: 12,
  },
  selectedPlate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectedDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  proceedButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  proceedText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
    marginRight: 6,
  },
});

export default ScanStep;
