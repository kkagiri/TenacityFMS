//Cursor - Mobile Nozzle Selection Step Component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';

const NozzleSelectionStep = ({
  pump,
  nozzles = [],
  fuelGrades = [],
  onNozzleSelect,
  onBack,
}) => {
  // Get fuel grade info for a nozzle
  const getFuelGradeInfo = (nozzleId) => {
    const grade = fuelGrades.find(g => g.nozzle === nozzleId || g.id === nozzleId);
    return grade || {name: `Fuel ${nozzleId}`, price: 0, fuelType: 'Unknown'};
  };

  // Get color for fuel type
  const getFuelTypeColor = (fuelType) => {
    const type = (fuelType || '').toLowerCase();
    if (type.includes('diesel')) return '#f59e0b';
    if (type.includes('petrol') || type.includes('gasoline')) return '#10b981';
    if (type.includes('premium')) return '#8b5cf6';
    return '#3b82f6';
  };

  const renderNozzleItem = (nozzle) => {
    const gradeInfo = getFuelGradeInfo(nozzle.id);
    const fuelColor = getFuelTypeColor(gradeInfo.fuelType);

    return (
      <TouchableOpacity
        key={nozzle.id}
        style={[styles.nozzleItem, {borderLeftColor: fuelColor}]}
        onPress={() => onNozzleSelect(nozzle)}
        activeOpacity={0.7}
      >
        <View style={styles.nozzleHeader}>
          <View style={[styles.nozzleIcon, {backgroundColor: fuelColor}]}>
            <Icon name="tint" size={24} color="white" />
          </View>
          <View style={styles.nozzleInfo}>
            <Text style={styles.nozzleName}>
              Nozzle {nozzle.nozzleNumber || nozzle.id}
            </Text>
            <Text style={[styles.fuelType, {color: fuelColor}]}>
              {gradeInfo.fuelType || gradeInfo.name}
            </Text>
          </View>
        </View>

        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>Price</Text>
          <Text style={styles.priceValue}>
            ${(gradeInfo.price || 0).toFixed(2)}/L
          </Text>
        </View>

        <View style={styles.selectIndicator}>
          <Icon name="chevron-right" size={16} color="#9ca3af" />
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Icon name="arrow-left" size={20} color="#374151" />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.title}>Select Nozzle</Text>
          <Text style={styles.subtitle}>
            {pump?.name || `Pump ${pump?.id}`} - Choose fuel type
          </Text>
        </View>
      </View>

      {/* Pump Info */}
      <View style={styles.pumpInfoCard}>
        <Icon name="gas-pump" size={24} color="#3b82f6" />
        <View style={styles.pumpInfoText}>
          <Text style={styles.pumpInfoTitle}>Selected Pump</Text>
          <Text style={styles.pumpInfoValue}>{pump?.name || `Pump ${pump?.id}`}</Text>
        </View>
      </View>

      {/* Nozzle List */}
      <ScrollView style={styles.nozzleList} showsVerticalScrollIndicator={false}>
        {nozzles.length > 0 ? (
          nozzles.map(renderNozzleItem)
        ) : (
          <View style={styles.emptyState}>
            <Icon name="exclamation-circle" size={48} color="#9ca3af" />
            <Text style={styles.emptyText}>No nozzles available</Text>
            <Text style={styles.emptySubtext}>
              Please check pump configuration
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Help Text */}
      <View style={styles.helpContainer}>
        <Icon name="info-circle" size={16} color="#6b7280" />
        <Text style={styles.helpText}>
          Select the fuel type you want to dispense
        </Text>
      </View>
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
  pumpInfoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#eff6ff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  pumpInfoText: {
    marginLeft: 12,
  },
  pumpInfoTitle: {
    fontSize: 12,
    color: '#6b7280',
  },
  pumpInfoValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  nozzleList: {
    flex: 1,
  },
  nozzleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 1},
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  nozzleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  nozzleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  nozzleInfo: {
    marginLeft: 12,
  },
  nozzleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  fuelType: {
    fontSize: 14,
    marginTop: 2,
  },
  priceContainer: {
    alignItems: 'flex-end',
    marginRight: 12,
  },
  priceLabel: {
    fontSize: 12,
    color: '#6b7280',
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  selectIndicator: {
    padding: 4,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6b7280',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9ca3af',
    marginTop: 8,
  },
  helpContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    backgroundColor: '#f9fafb',
    borderRadius: 8,
    marginTop: 12,
  },
  helpText: {
    fontSize: 14,
    color: '#6b7280',
    marginLeft: 8,
  },
});

export default NozzleSelectionStep;
