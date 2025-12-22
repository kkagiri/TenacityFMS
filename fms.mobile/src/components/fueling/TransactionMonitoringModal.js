/**
 * TransactionMonitoringModal.js
 *
 * Enhanced real-time transaction monitoring component for mobile
 * Mirrors the frontend TransactionMonitoringStatus.js capabilities
 *
 * Features:
 * - Real-time SignalR integration with multiple event handlers
 * - Upload status parsing for pump states (idle, filling, EOT, offline)
 * - Status history tracking
 * - Connection status indicator
 * - Manual completion for EOT scenarios
 * - Emergency stop functionality
 */
import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Animated,
  Alert,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";
import { useSelector, useDispatch } from "react-redux";
import signalRService, { ConnectionState } from "../../services/signalRService";
import {
  stopPump,
  completePump,
  cancelTransaction,
} from "../../redux/slices/fuelingSlice";

// Transaction status enum
const TransactionStatus = {
  AUTHORIZED: "authorized",
  WAITING_NOZZLE: "waiting_nozzle",
  FUELING: "fueling",
  FILLING: "filling",
  EOT: "endOfTransaction",
  END_OF_TRANSACTION: "endOfTransaction",
  COMPLETING: "completing",
  COMPLETED: "completed",
  CANCELLED: "cancelled",
  STOPPING: "stopping",
  ERROR: "error",
};

// Pump status from upload status
const PumpStatusType = {
  IDLE: "idle",
  FILLING: "filling",
  EOT: "endOfTransaction",
  OFFLINE: "offline",
};

const TransactionMonitoringModal = ({
  visible,
  deviceId,
  pumpId,
  nozzleId,
  transactionId,
  vehicleInfo,
  authorizationType,
  requestedVolume,
  onComplete,
  onCancel,
  onMinimize,
}) => {
  const dispatch = useDispatch();

  // Local state
  const [volume, setVolume] = useState(0);
  const [amount, setAmount] = useState(0);
  const [status, setStatus] = useState(TransactionStatus.AUTHORIZED);
  const [flowRate, setFlowRate] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [startTime, setStartTime] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [statusHistory, setStatusHistory] = useState([]);
  const [currentPumpStatus, setCurrentPumpStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  // Animations
  const [progressAnimation] = useState(new Animated.Value(0));
  const pulseAnimation = useRef(new Animated.Value(1)).current;

  // Redux state
  const deviceStatus = useSelector(
    (state) => state.fueling?.deviceStatuses?.[deviceId]
  );

  // Add to status history
  const addStatusHistory = useCallback(
    (newStatus, volumeValue, amountValue) => {
      setStatusHistory((prev) => {
        const entry = {
          timestamp: new Date(),
          status: newStatus,
          volume: volumeValue,
          amount: amountValue,
        };
        // Keep last 5 entries
        return [...prev.slice(-4), entry];
      });
    },
    []
  );

  // Parse upload status to get pump state
  const parsePumpStatus = useCallback(
    (uploadStatus) => {
      if (!uploadStatus?.pumps) return null;

      const checkStatus = (statusType, statusKey) => {
        const statusData = uploadStatus.pumps[statusType];
        if (!statusData?.ids) return null;

        const pumpIndex = statusData.ids.findIndex((id) => id === pumpId);
        if (pumpIndex === -1) return null;

        return {
          type: statusKey,
          index: pumpIndex,
          data: statusData,
          volume: statusData.volumes?.[pumpIndex],
          amount: statusData.amounts?.[pumpIndex],
        };
      };

      return (
        checkStatus("fillingStatus", PumpStatusType.FILLING) ||
        checkStatus("endOfTransactionStatus", PumpStatusType.EOT) ||
        checkStatus("idleStatus", PumpStatusType.IDLE) ||
        checkStatus("offlineStatus", PumpStatusType.OFFLINE)
      );
    },
    [pumpId]
  );

  // Handle connection status changes
  useEffect(() => {
    const handleConnectionChange = (state) => {
      setIsConnected(state === ConnectionState.CONNECTED);
    };

    const unsubscribe = signalRService.on(
      "connectionStatusChanged",
      handleConnectionChange
    );
    setIsConnected(
      signalRService.connectionState === ConnectionState.CONNECTED
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Handle upload status updates
  useEffect(() => {
    if (!visible || !transactionId) return;

    const handleUploadStatus = (data) => {
      if (data?.deviceId !== deviceId) return;

      const pumpStatus = parsePumpStatus(data.status);
      if (!pumpStatus) return;

      setCurrentPumpStatus(pumpStatus);
      setLastUpdated(new Date());

      // Update volume and amount from filling status
      if (pumpStatus.type === PumpStatusType.FILLING) {
        if (pumpStatus.volume !== undefined) {
          setVolume(pumpStatus.volume);
        }
        if (pumpStatus.amount !== undefined) {
          setAmount(pumpStatus.amount);
        }

        if (
          status !== TransactionStatus.FUELING &&
          status !== TransactionStatus.FILLING
        ) {
          setStatus(TransactionStatus.FUELING);
          if (!startTime) {
            setStartTime(Date.now());
          }
          addStatusHistory(
            TransactionStatus.FUELING,
            pumpStatus.volume,
            pumpStatus.amount
          );
        }
      }

      // Detect EOT (End of Transaction)
      if (pumpStatus.type === PumpStatusType.EOT) {
        if (
          status !== TransactionStatus.END_OF_TRANSACTION &&
          status !== TransactionStatus.COMPLETED
        ) {
          setStatus(TransactionStatus.END_OF_TRANSACTION);
          addStatusHistory(
            TransactionStatus.END_OF_TRANSACTION,
            volume,
            amount
          );
        }
      }

      // Detect idle after fueling (transaction complete)
      if (
        pumpStatus.type === PumpStatusType.IDLE &&
        (status === TransactionStatus.FUELING ||
          status === TransactionStatus.END_OF_TRANSACTION)
      ) {
        setStatus(TransactionStatus.COMPLETED);
        addStatusHistory(TransactionStatus.COMPLETED, volume, amount);
      }
    };

    const unsubscribe = signalRService.on(
      "UploadStatusUpdate",
      handleUploadStatus
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [
    visible,
    transactionId,
    deviceId,
    status,
    startTime,
    volume,
    amount,
    parsePumpStatus,
    addStatusHistory,
  ]);

  // Handle transaction updates
  useEffect(() => {
    if (!visible || !transactionId) return;

    const handleTransactionUpdate = (data) => {
      if (data?.transactionId !== transactionId) return;

      console.log("[TransactionMonitoring] Transaction update:", data);

      if (data.volume !== undefined) setVolume(data.volume);
      if (data.amount !== undefined) setAmount(data.amount);
      if (data.flowRate !== undefined) setFlowRate(data.flowRate);

      if (data.status) {
        setStatus(data.status.toLowerCase());
        addStatusHistory(data.status.toLowerCase(), data.volume, data.amount);
      }

      setLastUpdated(new Date());
    };

    const unsubscribe = signalRService.on(
      "TransactionUpdate",
      handleTransactionUpdate
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [visible, transactionId, addStatusHistory]);

  // Handle EOT events
  useEffect(() => {
    if (!visible || !transactionId) return;

    const handleEOT = (data) => {
      if (data?.transactionId !== transactionId && data?.deviceId !== deviceId)
        return;

      console.log("[TransactionMonitoring] EOT received:", data);

      const finalVolume = data.finalVolume || data.volume || volume;
      const finalAmount = data.finalAmount || data.amount || amount;

      setVolume(finalVolume);
      setAmount(finalAmount);
      setStatus(TransactionStatus.END_OF_TRANSACTION);
      addStatusHistory(
        TransactionStatus.END_OF_TRANSACTION,
        finalVolume,
        finalAmount
      );
      setLastUpdated(new Date());
    };

    const unsubscribe = signalRService.on("EndOfTransaction", handleEOT);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [visible, transactionId, deviceId, volume, amount, addStatusHistory]);

  // Handle fueling events
  useEffect(() => {
    if (!visible || !transactionId) return;

    const handleFuelingEvent = (data) => {
      if (data?.deviceId !== deviceId) return;

      console.log("[TransactionMonitoring] Fueling event:", data);

      const eventType = data.fuelingData?.type || data.type;

      if (
        eventType === "TransactionStarted" ||
        eventType === "FuelingStarted"
      ) {
        setStatus(TransactionStatus.FUELING);
        if (!startTime) setStartTime(Date.now());
        addStatusHistory(TransactionStatus.FUELING, volume, amount);
      } else if (
        eventType === "TransactionCompleted" ||
        eventType === "FuelingCompleted"
      ) {
        setStatus(TransactionStatus.COMPLETED);
        addStatusHistory(TransactionStatus.COMPLETED, volume, amount);
      }

      setLastUpdated(new Date());
    };

    const unsubscribe = signalRService.on("FuelingEvent", handleFuelingEvent);

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [
    visible,
    transactionId,
    deviceId,
    startTime,
    volume,
    amount,
    addStatusHistory,
  ]);

  // Timer effect
  useEffect(() => {
    if (!visible || !startTime) return;

    const isFueling = [
      TransactionStatus.FUELING,
      TransactionStatus.FILLING,
      TransactionStatus.WAITING_NOZZLE,
    ].includes(status);

    if (!isFueling) return;

    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [visible, startTime, status]);

  // Pulse animation for waiting/fueling states
  useEffect(() => {
    const shouldPulse = [
      TransactionStatus.AUTHORIZED,
      TransactionStatus.WAITING_NOZZLE,
      TransactionStatus.FUELING,
      TransactionStatus.FILLING,
    ].includes(status);

    if (shouldPulse) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 1.05,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [status, pulseAnimation]);

  // Progress animation for fueling
  useEffect(() => {
    if (
      status === TransactionStatus.FUELING ||
      status === TransactionStatus.FILLING
    ) {
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
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  // Format timestamp for status history
  const formatTimestamp = (date) => {
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  // Get progress value for progress bar
  const getProgressValue = () => {
    if (requestedVolume && volume > 0) {
      return Math.min(volume / requestedVolume, 1);
    }
    return 0;
  };

  // Check if can cancel transaction
  const canCancel = () => {
    return [
      TransactionStatus.AUTHORIZED,
      TransactionStatus.WAITING_NOZZLE,
      TransactionStatus.ERROR,
    ].includes(status);
  };

  // Check if can complete manually (EOT detected but not auto-completed)
  const canComplete = () => {
    return (
      status === TransactionStatus.EOT ||
      currentPumpStatus === PumpStatusType.EOT ||
      (status === TransactionStatus.FUELING &&
        currentPumpStatus === PumpStatusType.IDLE)
    );
  };

  // Handle stop pump
  const handleStop = () => {
    Alert.alert(
      "Stop Fueling",
      "Are you sure you want to stop the current fueling?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Stop",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            addStatusHistory("Stopping pump...");
            try {
              await dispatch(stopPump({ deviceId, pumpId })).unwrap();
              setStatus(TransactionStatus.STOPPING);
              addStatusHistory("Stop command sent");
            } catch (error) {
              console.error("[TransactionMonitoringModal] Stop error:", error);
              addStatusHistory(`Stop failed: ${error.message || error}`);
              Alert.alert(
                "Error",
                "Failed to stop pump: " + (error.message || error)
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle manual complete (for EOT scenarios)
  const handleComplete = async () => {
    setIsLoading(true);
    addStatusHistory("Completing transaction...");
    try {
      await dispatch(
        completePump({ deviceId, pumpId, transactionId })
      ).unwrap();
      setStatus(TransactionStatus.COMPLETED);
      addStatusHistory("Transaction completed");
      // Auto-close after a short delay
      setTimeout(() => {
        onComplete(transactionId);
      }, 1500);
    } catch (error) {
      console.error("[TransactionMonitoringModal] Complete error:", error);
      addStatusHistory(`Complete failed: ${error.message || error}`);
      Alert.alert(
        "Error",
        "Failed to complete transaction: " + (error.message || error)
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle cancel transaction
  const handleCancelTransaction = () => {
    Alert.alert(
      "Cancel Transaction",
      "Are you sure you want to cancel this authorization?",
      [
        { text: "No", style: "cancel" },
        {
          text: "Yes, Cancel",
          style: "destructive",
          onPress: async () => {
            setIsLoading(true);
            addStatusHistory("Cancelling transaction...");
            try {
              await dispatch(
                cancelTransaction({
                  deviceId,
                  transactionId,
                  reason: "User cancelled",
                })
              ).unwrap();
              addStatusHistory("Transaction cancelled");
              onCancel();
            } catch (error) {
              console.error(
                "[TransactionMonitoringModal] Cancel error:",
                error
              );
              addStatusHistory(`Cancel failed: ${error.message || error}`);
              Alert.alert(
                "Error",
                "Failed to cancel: " + (error.message || error)
              );
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  // Get status color and icon
  const getStatusConfig = () => {
    switch (status) {
      case TransactionStatus.AUTHORIZED:
        return {
          color: "#f59e0b",
          icon: "clock",
          text: "Authorized - Waiting...",
          description: "Waiting for nozzle to be lifted",
        };
      case TransactionStatus.WAITING_NOZZLE:
        return {
          color: "#f59e0b",
          icon: "hand-pointer",
          text: "Lift Nozzle",
          description: "Please lift the nozzle to start fueling",
        };
      case TransactionStatus.FUELING:
      case TransactionStatus.FILLING:
        return {
          color: "#3b82f6",
          icon: "gas-pump",
          text: "Fueling in Progress",
          description: `Dispensing fuel${
            requestedVolume ? ` (${requestedVolume}L requested)` : ""
          }`,
        };
      case TransactionStatus.EOT:
        return {
          color: "#10b981",
          icon: "flag-checkered",
          text: "End of Transaction",
          description: "Fueling complete - Tap Complete to finish",
        };
      case TransactionStatus.STOPPING:
        return {
          color: "#ef4444",
          icon: "stop-circle",
          text: "Stopping...",
          description: "Waiting for pump to stop",
        };
      case TransactionStatus.COMPLETED:
        return {
          color: "#10b981",
          icon: "check-circle",
          text: "Complete",
          description: "Transaction completed successfully",
        };
      case TransactionStatus.CANCELLED:
        return {
          color: "#6b7280",
          icon: "times-circle",
          text: "Cancelled",
          description: "Transaction was cancelled",
        };
      case TransactionStatus.ERROR:
        return {
          color: "#ef4444",
          icon: "exclamation-triangle",
          text: "Error",
          description: "An error occurred",
        };
      default:
        return {
          color: "#6b7280",
          icon: "question-circle",
          text: status || "Unknown",
          description: "",
        };
    }
  };

  const statusConfig = getStatusConfig();

  // Calculate animated background color for fueling state
  const animatedBackgroundColor = progressAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ["#1e40af", "#3b82f6"],
  });

  // Pulse scale for waiting state
  const pulseScale = pulseAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.95, 1.05],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={() => {
        if (
          status === TransactionStatus.COMPLETED ||
          status === TransactionStatus.CANCELLED
        ) {
          onCancel();
        }
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Connection Status Indicator */}
          <View
            style={[
              styles.connectionIndicator,
              { backgroundColor: isConnected ? "#10b981" : "#ef4444" },
            ]}
          >
            <Icon
              name={isConnected ? "wifi" : "wifi-slash"}
              size={12}
              color="white"
            />
            <Text style={styles.connectionText}>
              {isConnected ? "Connected" : "Disconnected"}
            </Text>
          </View>

          {/* Header */}
          <View
            style={[styles.header, { backgroundColor: statusConfig.color }]}
          >
            <Animated.View style={{ transform: [{ scale: pulseScale }] }}>
              <Icon name={statusConfig.icon} size={32} color="white" />
            </Animated.View>
            <Text style={styles.headerText}>{statusConfig.text}</Text>
            {statusConfig.description && (
              <Text style={styles.headerDescription}>
                {statusConfig.description}
              </Text>
            )}
            <Text style={styles.transactionId}>
              Transaction #{transactionId}
            </Text>
          </View>

          {/* Main Display */}
          <Animated.View
            style={[
              styles.mainDisplay,
              (status === TransactionStatus.FUELING ||
                status === TransactionStatus.FILLING) && {
                backgroundColor: animatedBackgroundColor,
              },
            ]}
          >
            {/* Volume */}
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>VOLUME</Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueNumber}>{volume.toFixed(2)}</Text>
                <Text style={styles.valueUnit}>L</Text>
              </View>
              {requestedVolume > 0 && (
                <Text style={styles.requestedVolume}>
                  of {requestedVolume}L requested
                </Text>
              )}
            </View>

            {/* Divider */}
            <View style={styles.divider} />

            {/* Amount */}
            <View style={styles.valueContainer}>
              <Text style={styles.valueLabel}>AMOUNT</Text>
              <View style={styles.valueRow}>
                <Text style={styles.valueNumber}>{amount.toFixed(0)}</Text>
                <Text style={styles.valueUnit}>KRW</Text>
              </View>
            </View>
          </Animated.View>

          {/* Progress Bar (if requested volume) */}
          {requestedVolume > 0 && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${getProgressValue() * 100}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {(getProgressValue() * 100).toFixed(0)}%
              </Text>
            </View>
          )}

          {/* Details */}
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <View style={styles.detailItem}>
                <Icon name="clock" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Time</Text>
                <Text style={styles.detailValue}>
                  {formatTime(elapsedTime)}
                </Text>
              </View>
              <View style={styles.detailItem}>
                <Icon name="tachometer-alt" size={16} color="#6b7280" />
                <Text style={styles.detailLabel}>Flow Rate</Text>
                <Text style={styles.detailValue}>
                  {flowRate.toFixed(1)} L/min
                </Text>
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

            {/* Vehicle Info */}
            {vehicleInfo && (
              <View style={styles.detailRow}>
                <View style={styles.detailItem}>
                  <Icon name="car" size={16} color="#6b7280" />
                  <Text style={styles.detailLabel}>Vehicle</Text>
                  <Text style={styles.detailValue}>
                    {vehicleInfo.plateNo || vehicleInfo.hyoungNo}
                  </Text>
                </View>
              </View>
            )}

            {/* Live Pump Status */}
            {currentPumpStatus && (
              <View style={styles.pumpStatusContainer}>
                <Icon
                  name={
                    currentPumpStatus === PumpStatusType.FILLING
                      ? "spinner"
                      : "info-circle"
                  }
                  size={14}
                  color={
                    currentPumpStatus === PumpStatusType.EOT
                      ? "#10b981"
                      : "#3b82f6"
                  }
                />
                <Text
                  style={[
                    styles.pumpStatusText,
                    currentPumpStatus === PumpStatusType.EOT &&
                      styles.pumpStatusEOT,
                  ]}
                >
                  Pump Status: {currentPumpStatus.toUpperCase()}
                </Text>
                {lastUpdated && (
                  <Text style={styles.lastUpdatedText}>
                    Updated: {formatTimestamp(lastUpdated)}
                  </Text>
                )}
              </View>
            )}
          </View>

          {/* Status History */}
          {statusHistory.length > 0 && (
            <View style={styles.historyContainer}>
              <Text style={styles.historyTitle}>Recent Updates</Text>
              <ScrollView style={styles.historyScroll} nestedScrollEnabled>
                {statusHistory.map((entry, index) => (
                  <View key={index} style={styles.historyItem}>
                    <Text style={styles.historyTime}>{entry.time}</Text>
                    <Text style={styles.historyMessage}>{entry.message}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Actions */}
          <View style={styles.actionsContainer}>
            {isLoading && (
              <View style={styles.loadingOverlay}>
                <ActivityIndicator size="large" color="#3b82f6" />
                <Text style={styles.loadingText}>Processing...</Text>
              </View>
            )}

            {!isLoading && (
              <>
                {/* Stop button - show during fueling */}
                {(status === TransactionStatus.FUELING ||
                  status === TransactionStatus.FILLING) && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.stopButton]}
                    onPress={handleStop}
                  >
                    <Icon name="stop-circle" size={20} color="white" />
                    <Text style={styles.actionText}>Stop Fueling</Text>
                  </TouchableOpacity>
                )}

                {/* Complete button - show when EOT detected or can complete */}
                {canComplete() && status !== TransactionStatus.COMPLETED && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.completeButton]}
                    onPress={handleComplete}
                  >
                    <Icon name="check-circle" size={20} color="white" />
                    <Text style={styles.actionText}>Complete Transaction</Text>
                  </TouchableOpacity>
                )}

                {/* Done button - show when completed */}
                {status === TransactionStatus.COMPLETED && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.doneButton]}
                    onPress={() => onComplete(transactionId)}
                  >
                    <Icon name="check" size={20} color="white" />
                    <Text style={styles.actionText}>Done</Text>
                  </TouchableOpacity>
                )}

                {/* Cancel button - show when can cancel */}
                {canCancel() && (
                  <TouchableOpacity
                    style={[styles.actionButton, styles.cancelButton]}
                    onPress={handleCancelTransaction}
                  >
                    <Icon name="times" size={20} color="white" />
                    <Text style={styles.actionText}>Cancel Authorization</Text>
                  </TouchableOpacity>
                )}

                {/* Waiting indicator */}
                {status === TransactionStatus.STOPPING && (
                  <View style={styles.waitingContainer}>
                    <ActivityIndicator size="small" color="#6b7280" />
                    <Text style={styles.waitingText}>
                      Waiting for pump to stop...
                    </Text>
                  </View>
                )}

                {status === TransactionStatus.WAITING_NOZZLE && (
                  <View style={styles.waitingContainer}>
                    <Icon name="hand-pointer" size={24} color="#f59e0b" />
                    <Text style={styles.waitingText}>
                      Please lift the nozzle to start fueling
                    </Text>
                  </View>
                )}
              </>
            )}
          </View>

          {/* Minimize button - only show when actively fueling */}
          {(status === TransactionStatus.FUELING ||
            status === TransactionStatus.FILLING) &&
            onMinimize && (
              <TouchableOpacity
                style={styles.minimizeButton}
                onPress={onMinimize}
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
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  container: {
    backgroundColor: "white",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: "95%",
  },
  connectionIndicator: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 6,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  connectionText: {
    color: "white",
    fontSize: 12,
    fontWeight: "500",
    marginLeft: 6,
  },
  header: {
    alignItems: "center",
    paddingVertical: 24,
  },
  headerText: {
    color: "white",
    fontSize: 20,
    fontWeight: "600",
    marginTop: 8,
  },
  headerDescription: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 13,
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  transactionId: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 14,
    marginTop: 4,
  },
  mainDisplay: {
    flexDirection: "row",
    backgroundColor: "#1e40af",
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  valueContainer: {
    flex: 1,
    alignItems: "center",
  },
  valueLabel: {
    color: "rgba(255, 255, 255, 0.7)",
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: "row",
    alignItems: "baseline",
  },
  valueNumber: {
    color: "white",
    fontSize: 36,
    fontWeight: "700",
  },
  valueUnit: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 4,
  },
  requestedVolume: {
    color: "rgba(255, 255, 255, 0.6)",
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    width: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    marginHorizontal: 16,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "#f3f4f6",
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#e5e7eb",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: "#3b82f6",
    borderRadius: 4,
  },
  progressText: {
    marginLeft: 12,
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
    minWidth: 40,
    textAlign: "right",
  },
  detailsContainer: {
    padding: 16,
    backgroundColor: "#f9fafb",
  },
  detailRow: {
    flexDirection: "row",
    marginBottom: 12,
  },
  detailItem: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
  },
  detailLabel: {
    color: "#6b7280",
    fontSize: 13,
    marginLeft: 8,
    marginRight: 4,
  },
  detailValue: {
    color: "#1f2937",
    fontSize: 13,
    fontWeight: "600",
  },
  pumpStatusContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginTop: 8,
  },
  pumpStatusText: {
    color: "#0369a1",
    fontSize: 13,
    fontWeight: "500",
    marginLeft: 8,
    flex: 1,
  },
  pumpStatusEOT: {
    color: "#059669",
  },
  lastUpdatedText: {
    color: "#6b7280",
    fontSize: 11,
  },
  historyContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    maxHeight: 120,
  },
  historyTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
    marginBottom: 8,
  },
  historyScroll: {
    maxHeight: 80,
  },
  historyItem: {
    flexDirection: "row",
    paddingVertical: 4,
  },
  historyTime: {
    fontSize: 11,
    color: "#9ca3af",
    width: 70,
  },
  historyMessage: {
    fontSize: 12,
    color: "#4b5563",
    flex: 1,
  },
  actionsContainer: {
    padding: 16,
    paddingTop: 8,
  },
  loadingOverlay: {
    alignItems: "center",
    paddingVertical: 20,
  },
  loadingText: {
    marginTop: 8,
    color: "#6b7280",
    fontSize: 14,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  stopButton: {
    backgroundColor: "#ef4444",
  },
  completeButton: {
    backgroundColor: "#10b981",
  },
  doneButton: {
    backgroundColor: "#10b981",
  },
  cancelButton: {
    backgroundColor: "#6b7280",
  },
  actionText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  waitingContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
  },
  waitingText: {
    color: "#6b7280",
    fontSize: 14,
    marginLeft: 10,
  },
  minimizeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  minimizeText: {
    color: "#6b7280",
    fontSize: 14,
    marginLeft: 8,
  },
});

export default TransactionMonitoringModal;
