//Cursor - Mobile pump selection step component
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import FuelingUtils from '../../utils/FuelingUtils';

const {width} = Dimensions.get('window');
const ITEM_WIDTH = (width - 48) / 2; // 2 columns with padding

const PumpSelectionStep = ({
  pumps = [],
  activePumps = [],
  onPumpSelect,
  connectionStatus,
}) => {
  const renderPumpItem = ({item: pump}) => {
    const isActive = activePumps.some(ap => ap.pumpId === pump.id);
    const isSelectable = pump.status === 'idle' || pump.status === 'nozzleUp';
    const statusColor = FuelingUtils.getPumpStatusColor(pump.status);
    const statusIcon = FuelingUtils.getPumpStatusIcon(pump.status);

    return (
      <TouchableOpacity
        style={[
          styles.pumpItem,
          {borderColor: statusColor},
          !isSelectable && styles.pumpItemDisabled,
        ]}
        onPress={() => isSelectable && onPumpSelect(pump)}
        activeOpacity={0.7}
        disabled={!isSelectable}>

        {/* Status indicator */}
        <View style={[styles.statusIndicator, {backgroundColor: statusColor}]}>
          <Icon name={statusIcon} size={16} color="white" />
        </View>

        {/* Pump icon */}
        <View style={styles.pumpIcon}>
          <Icon name="gas-pump" size={32} color={statusColor} />
        </View>

        {/* Pump info */}
        <Text style={styles.pumpName}>{pump.name}</Text>
        <Text style={[styles.pumpStatus, {color: statusColor}]}>
          {pump.status.toUpperCase()}
        </Text>

        {/* Additional info */}
        {pump.status === 'fueling' && (
          <View style={styles.fuelingInfo}>
            <Text style={styles.fuelingText}>
              {FuelingUtils.formatVolume(pump.currentVolume || 0)}
            </Text>
            <Text style={styles.fuelingText}>
              {FuelingUtils.formatCurrency(pump.currentAmount || 0)}
            </Text>
          </View>
        )}

        {pump.status === 'nozzleUp' && (
          <Text style={styles.nozzleUpText}>
            Nozzle {pump.nozzleUp} Up
          </Text>
        )}

        {pump.status === 'endOfTransaction' && (
          <View style={styles.completedInfo}>
            <Text style={styles.completedText}>
              Transaction {pump.transaction} Complete
            </Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.title}>Select Pump</Text>
      <Text style={styles.subtitle}>
        Choose an available pump to start fueling
      </Text>

      {connectionStatus !== 'connected' && (
        <View style={styles.connectionWarning}>
          <Icon name="exclamation-triangle" size={16} color="#f59e0b" />
          <Text style={styles.connectionText}>
            Device connection: {connectionStatus}
          </Text>
        </View>
      )}
    </View>
  );

  const renderFooter = () => (
    <View style={styles.footer}>
      <View style={styles.legend}>
        <Text style={styles.legendTitle}>Status Legend:</Text>
        <View style={styles.legendItems}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#10B981'}]} />
            <Text style={styles.legendText}>Available</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#F59E0B'}]} />
            <Text style={styles.legendText}>Nozzle Up</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#3B82F6'}]} />
            <Text style={styles.legendText}>Fueling</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, {backgroundColor: '#EF4444'}]} />
            <Text style={styles.legendText}>Offline</Text>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <FlatList
      data={pumps}
      renderItem={renderPumpItem}
      keyExtractor={item => item.id.toString()}
      numColumns={2}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={renderHeader}
      ListFooterComponent={renderFooter}
      contentContainerStyle={styles.container}
      showsVerticalScrollIndicator={false}
    />
  );
};

const styles = StyleSheet.create({
  container: {
    paddingBottom: 20,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginBottom: 16,
  },
  connectionWarning: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff3cd',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  connectionText: {
    marginLeft: 8,
    color: '#856404',
    fontSize: 14,
  },
  row: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pumpItem: {
    width: ITEM_WIDTH,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  pumpItemDisabled: {
    opacity: 0.6,
  },
  statusIndicator: {
    position: 'absolute',
    top: -8,
    right: -8,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'white',
  },
  pumpIcon: {
    marginBottom: 12,
  },
  pumpName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  pumpStatus: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 8,
  },
  fuelingInfo: {
    alignItems: 'center',
  },
  fuelingText: {
    fontSize: 12,
    color: '#6b7280',
    marginBottom: 2,
  },
  nozzleUpText: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '500',
  },
  completedInfo: {
    alignItems: 'center',
  },
  completedText: {
    fontSize: 12,
    color: '#8b5cf6',
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    marginTop: 24,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  legend: {
    alignItems: 'center',
  },
  legendTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 12,
  },
  legendItems: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 8,
    marginBottom: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    color: '#6b7280',
  },
});

export default PumpSelectionStep;