//Cursor - Mobile Transaction Monitoring Modal
// Displays real-time fueling progress and allows transaction control
import React, {useEffect, useState, useCallback} from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
} from 'react-native';
import Icon from 'react-native-vector-icons/FontAwesome5';
import signalRService from '../../services/signalRService';
import {useSelector} from 'react-redux';

const TransactionMonitoringModal = ({
  visible,
  deviceId,
  pumpId,
  nozzleId,
  transactionId,
  onComplete,
  onCancel,
}) => {
  const [volume, setVolume] = useState(0);
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState('authorized');
  const [flowRate, setFlowRate] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [progressAnimation] = useState(new Animated.Value(0));

  // Get price from Redux if available
  const deviceStatus = useSelector(state => state.fueling.deviceStatuses[deviceId]);
  const fuelPrice = deviceStatus?.uploadStatus?.price || 3.99;

  // Subscribe to transaction updates
  useEffect(() => {
    if (!visible || !transactionId) return;

    console.log('[TransactionMonitoringModal] Starting monitoring for transaction:', transactionId);

    // Subscribe to SignalR updates
    const unsubscribeTransaction = signalRService.on('TransactionUpdate', (data) => {
      if (data.transactionId !== transactionId) return;

      console.log('[TransactionMonitoringModal] Transaction update:', data);
      setVolume(data.volume || 0);
      setAmount(data.amount || 0);
      setStatus(data.status || 'fueling');
      setFlowRate(data.flowRate || 0);
    });

    const unsubscribeEOT = signalRService.on('EndOfTransaction', (data) => {
      if (data.transactionId !== transactionId) return;

      console.log('[TransactionMonitoringModal] EOT received:', data);
      setVolume(data.finalVolume || data.volume || volume);
      setAmount(data.finalAmount || data.amount || amount);
      setStatus('completed');

      // Show completion alert
      setTimeout(() => {
        Alert.alert(
          'Transaction Complete',
          `Volume: ${(data.finalVolume || volume).toFixed(2)} L\nAmount: $${(data.finalAmount || amount).toFixed(2)}`,
          [{text: 'OK', onPress: () => onComplete(transactionId)}]
        );
      }, 500);
    });

    // Cleanup
    return () => {
      unsubscribeTransaction();
      unsubscribeEOT();
    };
  }, [visible, transactionId, onComplete]);

  // Timer effect
  useEffect(() => {
    if (!visible || status !== 'fueling') return;

    const timer = setInterval(() => {
      setElapsedTime(prev => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, status]);

  // Progress animation
  useEffect(() => {
    if (status === 'fueling') {
      Animated.loop(
        Animated.sequence([
          Animated.timing(progressAnimation, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(progressAnimation, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      ).start();
    } else {
      progressAnimation.setValue(0);
    }
  }, [status, progressAnimation]);

  // Format elapsed time
  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Handle stop
  const handleStop = () => {
    Alert.alert(
      'Stop Fueling',
      'Are you sure you want to stop the current fueling?',
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Stop',
          style: 'destructive',
          onPress: () => {
            // Call stop API through pumpControlService
            // This would trigger the stop command
            console.log('[TransactionMonitoringModal] Stopping transaction:', transactionId);
            setStatus('stopping');
          },
        },
      ]
    );
  };

  // Get status color and icon
  const getStatusConfig = () => {
    switch (status) {
      case 'authorized':
        return {color: '#f59e0b', icon: 'clock', text: 'Authorized - Waiting...'};
      case 'fueling':
        return {color: '#3b82f6', icon: 'gas-pump', text: 'Fueling in Progress'};
      case 'stopping':
        return {color: '#ef4444', icon: 'stop-circle', text: 'Stopping...'};
      case 'completed':
        return {color: '#10b981', icon: 'check-circle', text: 'Complete'};
      default:
        return {color: '#6b7280', icon: 'question-circle', text: status};
    }
  };

  const statusConfig = getStatusConfig();

  // Calculate animated background color for fueling state
  const animatedBackgroundColor = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['#1e40af', '#3b82f6'],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (status === 'completed') {
          onCancel();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={[styles.header, {backgroundColor: statusConfig.color}]}>
            <Icon name={statusConfig.icon} size={32} color="white" />
            <Text style={styles.headerText}>{statusConfig.text}</Text>
            <Text style={styles.transactionId}>Transaction #{transactionId}</Text>
          </View>

          {/* Main Display */}
          <Animated.View
            style={[
              styles.mainDisplay,
              status === 'fueling' && {backgroundColor: animatedBackgroundColor},
            ]}
          >
            {/* Volume */}
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>VOLUME</Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueNumber}>{volume.toFixed(2)}</Text>
                <Text style={styles.valueUnit}>L</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Amount */}
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>AMOUNT</Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueNumber}>${amount.toFixed(2)}</Text>
              </View>
            </View>
          </Animated.View>

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="clock" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>{formatTime(elapsedTime)}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="tachometer-alt" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Flow Rate</Text>
                <Text style={styles.detailValue}>{flowRate.toFixed(1)} L/min</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="gas-pump" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Pump</Text>
                <Text style={styles.detailValue}>#{pumpId}</Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="tint" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Nozzle</Text>
                <Text style={styles.detailValue}>#{nozzleId}</Text>
              </View>
            </View>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="tag" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Price</Text>
                <Text style={styles.detailValue}>${fuelPrice.toFixed(2)}/L</Text>
              </View>
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {status === 'fueling' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.stopButton]}
                onPress={handleStop}
              >
                <Icon name="stop-circle" size={20} color="white" />
                <Text style={styles.actionText}>Stop Fueling</Text>
              </TouchableOpacity>
            )}

            {status === 'completed' && (
              <TouchableOpacity
                style={[styles.actionButton, styles.doneButton]}
                onPress={() => onComplete(transactionId)}
              >
                <Icon name="check" size={20} color="white" />
                <Text style={styles.actionText}>Done</Text>
              </TouchableOpacity>
            )}

            {(status === 'authorized' || status === 'stopping') && (
              <View style={styles.waitingContainer}>
                <Text style={styles.waitingText}>
                  {status === 'authorized'
                    ? 'Waiting for fueling to start...'
                    : 'Waiting for pump to stop...'}
                </Text>
              </View>
            )}
          </View>

          {/* Minimize button - only show when fueling */}
          {status === 'fueling' && (
            <TouchableOpacity
              style={styles.minimizeButton}
              onPress={onCancel}
            >
              <Icon name="chevron-down" size={16} color="#6b7280" />
              <Text style={styles.minimizeText}>Minimize</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: 'white',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    paddingVertical: 24,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  headerText: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    marginTop: 8,
  },
  transactionId: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginTop: 4,
  },
  mainDisplay: {
    flexDirection: 'row',
    backgroundColor: '#1e40af',
    paddingVertical: 32,
    paddingHorizontal: 24,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
  },
  valueLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 1,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  valueNumber: {
    color: 'white',
    fontSize: 42,
    fontWeight: '700',
  },
  valueUnit: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20,
    fontWeight: '500',
    marginLeft: 4,
  },
  divider: {
    width: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    marginHorizontal: 16,
  },
  detailsContainer: {
    padding: 20,
    backgroundColor: '#f9fafb',
  },
  detailRow: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  detailItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  detailLabel: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 8,
    marginRight: 4,
  },
  detailValue: {
    color: '#1f2937',
    fontSize: 14,
    fontWeight: '600',
  },
  actionsContainer: {
    padding: 20,
    paddingTop: 0,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
  },
  stopButton: {
    backgroundColor: '#ef4444',
  },
  doneButton: {
    backgroundColor: '#10b981',
  },
  actionText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  waitingContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  waitingText: {
    color: '#6b7280',
    fontSize: 14,
  },
  minimizeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  minimizeText: {
    color: '#6b7280',
    fontSize: 14,
    marginLeft: 8,
  },
});

export default TransactionMonitoringModal;
