//Cursor - Mobile Fueling Details Step Component
// Configures authorization type and dose before starting fueling
import React, {useState, useMemo, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const AUTHORIZATION_TYPES = [
  {id: 'Full', label: 'Full Tank', icon: 'gas-pump', description: 'Fill until full or stopped'},
  {id: 'Amount', label: 'By Amount', icon: 'dollar-sign', description: 'Specify $ amount'},
  {id: 'Volume', label: 'By Volume', icon: 'tint', description: 'Specify liters'},
];

const FuelingDetailsStep = ({
  pump,
  nozzle,
  vehicleInfo,
  tagDetails,
  selectedType,
  amount,
  volume,
  fuelPrice = 0,
  useMasterTag,
  masterTag,
  isAuthorizing,
  onAuthorize,
  onBack,
  setSelectedType,
  setAmount,
  setVolume,
  setUseMasterTag,
}) => {
  const [doseError, setDoseError] = useState('');

  // Calculate estimated volume from amount or vice versa
  const estimatedVolume = useMemo(() => {
    if (selectedType === 'Amount' && amount && fuelPrice > 0) {
      return (parseFloat(amount) / fuelPrice).toFixed(2);
    }
    return volume;
  }, [selectedType, amount, fuelPrice, volume]);

  const estimatedAmount = useMemo(() => {
    if (selectedType === 'Volume' && volume && fuelPrice > 0) {
      return (parseFloat(volume) * fuelPrice).toFixed(2);
    }
    return amount;
  }, [selectedType, volume, fuelPrice, amount]);

  // Validate dose input
  useEffect(() => {
    setDoseError('');

    if (selectedType === 'Full') return;

    const value = selectedType === 'Amount' ? amount : volume;
    if (!value) {
      setDoseError('Please enter a value');
      return;
    }

    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue <= 0) {
      setDoseError('Please enter a valid positive number');
      return;
    }

    if (selectedType === 'Amount' && numValue < 1) {
      setDoseError('Minimum amount is $1.00');
      return;
    }

    if (selectedType === 'Volume' && numValue < 0.5) {
      setDoseError('Minimum volume is 0.5 liters');
      return;
    }
  }, [selectedType, amount, volume]);

  // Handle authorization
  const handleAuthorize = () => {
    // Validate
    if (selectedType !== 'Full' && doseError) {
      Alert.alert('Validation Error', doseError);
      return;
    }

    // Determine tag to use
    const tagToUse = useMasterTag ? masterTag : (tagDetails?.tagId || vehicleInfo?.tagId);

    if (!tagToUse && !useMasterTag) {
      Alert.alert(
        'No Tag Available',
        'Please enable "Use Master Tag" or ensure the vehicle has a tag assigned.',
        [{text: 'OK'}]
      );
      return;
    }

    // Build authorization data
    const authData = {
      authType: selectedType,
      dose: selectedType === 'Full'
        ? null
        : selectedType === 'Amount'
          ? parseFloat(amount)
          : parseFloat(volume),
      vehicleId: vehicleInfo?.id,
      tagId: tagToUse,
      useMasterTag,
    };

    console.log('[FuelingDetailsStep] Authorizing with:', authData);
    onAuthorize(authData);
  };

  // Get vehicle display info
  const vehicleDisplay = vehicleInfo?.numberPlate || vehicleInfo?.hyoungNo || 'Unknown Vehicle';
  const vehicleDescription = [vehicleInfo?.make, vehicleInfo?.model].filter(Boolean).join(' ');

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Fueling Details</Text>
          <Text style={styles.subtitle}>Configure authorization settings</Text>
        </View>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {/* Pump & Nozzle */}
        <View style={styles.summaryCard}>
          <Icon name="gas-pump" size={20} color="#3b82f6" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Pump & Nozzle</Text>
            <Text style={styles.summaryValue}>
              {pump?.name || `Pump ${pump?.id}`} - Nozzle {nozzle?.nozzleNumber || nozzle?.id}
            </Text>
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.summaryCard}>
          <Icon name="car" size={20} color="#10b981" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Vehicle</Text>
            <Text style={styles.summaryValue}>{vehicleDisplay}</Text>
            {vehicleDescription && (
              <Text style={styles.summarySubvalue}>{vehicleDescription}</Text>
            )}
          </View>
        </View>

        {/* Fuel Price */}
        <View style={styles.summaryCard}>
          <Icon name="tag" size={20} color="#f59e0b" />
          <View style={styles.summaryText}>
            <Text style={styles.summaryLabel}>Fuel Price</Text>
            <Text style={styles.summaryValue}>${fuelPrice.toFixed(2)}/L</Text>
          </View>
        </View>
      </View>

      {/* Authorization Type Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authorization Type</Text>
        <View style={styles.typeContainer}>
          {AUTHORIZATION_TYPES.map(type => (
            <TouchableOpacity
              key={type.id}
              style={[
                styles.typeButton,
                selectedType === type.id && styles.typeButtonActive,
              ]}
              onPress={() => setSelectedType(type.id)}
            >
              <Icon
                name={type.icon}
                size={24}
                color={selectedType === type.id ? '#2563eb' : '#6b7280'}
              />
              <Text
                style={[
                  styles.typeLabel,
                  selectedType === type.id && styles.typeLabelActive,
                ]}
              >
                {type.label}
              </Text>
              <Text style={styles.typeDescription}>{type.description}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Dose Input (for Amount or Volume) */}
      {selectedType !== 'Full' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {selectedType === 'Amount' ? 'Enter Amount ($)' : 'Enter Volume (L)'}
          </Text>
          <View style={styles.doseContainer}>
            <View style={styles.doseInputContainer}>
              <Text style={styles.dosePrefix}>
                {selectedType === 'Amount' ? '$' : ''}
              </Text>
              <TextInput
                style={styles.doseInput}
                placeholder={selectedType === 'Amount' ? '0.00' : '0.00'}
                placeholderTextColor="#9ca3af"
                value={selectedType === 'Amount' ? amount : volume}
                onChangeText={selectedType === 'Amount' ? setAmount : setVolume}
                keyboardType="decimal-pad"
                autoFocus
              />
              <Text style={styles.doseSuffix}>
                {selectedType === 'Volume' ? 'L' : ''}
              </Text>
            </View>
            {doseError && (
              <Text style={styles.errorText}>{doseError}</Text>
            )}

            {/* Estimate */}
            <View style={styles.estimateContainer}>
              <Text style={styles.estimateLabel}>Estimated:</Text>
              <Text style={styles.estimateValue}>
                {selectedType === 'Amount'
                  ? `${estimatedVolume} liters`
                  : `$${estimatedAmount}`
                }
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Tag Selection */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Authorization Tag</Text>
        <View style={styles.tagContainer}>
          {/* Master Tag Toggle */}
          {masterTag && (
            <View style={styles.tagOption}>
              <View style={styles.tagInfo}>
                <Icon name="id-badge" size={20} color="#8b5cf6" />
                <View style={styles.tagText}>
                  <Text style={styles.tagLabel}>Use Master Tag</Text>
                  <Text style={styles.tagValue}>{masterTag}</Text>
                </View>
              </View>
              <Switch
                value={useMasterTag}
                onValueChange={setUseMasterTag}
                trackColor={{false: '#d1d5db', true: '#c4b5fd'}}
                thumbColor={useMasterTag ? '#8b5cf6' : '#f4f3f4'}
              />
            </View>
          )}

          {/* Vehicle Tag */}
          {!useMasterTag && (
            <View style={styles.tagOption}>
              <View style={styles.tagInfo}>
                <Icon name="tag" size={20} color="#10b981" />
                <View style={styles.tagText}>
                  <Text style={styles.tagLabel}>Vehicle Tag</Text>
                  <Text style={styles.tagValue}>
                    {tagDetails?.tagId || vehicleInfo?.tagId || 'No tag assigned'}
                  </Text>
                </View>
              </View>
              {(tagDetails?.tagId || vehicleInfo?.tagId) && (
                <Icon name="check-circle" size={20} color="#10b981" />
              )}
            </View>
          )}
        </View>
      </View>

      {/* Authorize Button */}
      <TouchableOpacity
        style={[styles.authorizeButton, isAuthorizing && styles.authorizeButtonDisabled]}
        onPress={handleAuthorize}
        disabled={isAuthorizing || (selectedType !== 'Full' && !!doseError)}
      >
        {isAuthorizing ? (
          <Text style={styles.authorizeText}>Authorizing...</Text>
        ) : (
          <>
            <Icon name="play-circle" size={20} color="white" />
            <Text style={styles.authorizeText}>Start Fueling</Text>
          </>
        )}
      </TouchableOpacity>

      {/* Warning */}
      <View style={styles.warningContainer}>
        <Icon name="info-circle" size={16} color="#6b7280" />
        <Text style={styles.warningText}>
          Ensure nozzle is placed in vehicle before authorizing
        </Text>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
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
  summaryContainer: {
    marginBottom: 20,
  },
  summaryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 10,
    marginBottom: 8,
  },
  summaryText: {
    marginLeft: 12,
    flex: 1,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  summarySubvalue: {
    fontSize: 12,
    color: '#9ca3af',
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  typeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  typeButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginHorizontal: 4,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  typeButtonActive: {
    borderColor: '#2563eb',
    backgroundColor: '#eff6ff',
  },
  typeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
    marginTop: 8,
  },
  typeLabelActive: {
    color: '#2563eb',
  },
  typeDescription: {
    fontSize: 10,
    color: '#9ca3af',
    marginTop: 4,
    textAlign: 'center',
  },
  doseContainer: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
  },
  doseInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  dosePrefix: {
    fontSize: 32,
    fontWeight: '600',
    color: '#374151',
  },
  doseInput: {
    fontSize: 48,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    minWidth: 150,
  },
  doseSuffix: {
    fontSize: 24,
    fontWeight: '500',
    color: '#6b7280',
  },
  errorText: {
    color: '#ef4444',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  estimateContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  estimateLabel: {
    fontSize: 14,
    color: '#6b7280',
    marginRight: 8,
  },
  estimateValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
  },
  tagContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    overflow: 'hidden',
  },
  tagOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  tagInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  tagText: {
    marginLeft: 12,
  },
  tagLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
  },
  tagValue: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  authorizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    paddingVertical: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  authorizeButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
  authorizeText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 8,
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingBottom: 24,
  },
  warningText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#6b7280',
  },
});

export default FuelingDetailsStep;
