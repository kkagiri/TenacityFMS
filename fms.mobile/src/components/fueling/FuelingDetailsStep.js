// Mobile Fueling Details Step Component
// Handles pump authorization, nozzle lift detection, and fueling progress monitoring
import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  Animated,
  Vibration,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/FontAwesome5";

// Fueling phases
const PHASES = {
  READY: "ready", // Initial state - waiting to start
  WAITING_NOZZLE: "waiting_nozzle", // Waiting for user to lift nozzle
  AUTHORIZING: "authorizing", // Authorizing pump
  FUELING: "fueling", // Fueling in progress
  COMPLETING: "completing", // Fueling completed, finalizing
  COMPLETED: "completed", // All done
  ERROR: "error", // Error occurred
  EMERGENCY_STOP: "emergency_stop", // Emergency stop triggered
};

// Generate mock transaction ID
const generateTransactionId = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `TXN-${timestamp}-${random}`;
};

// Simulate upload status data (like from PTS)
const generateMockUploadStatus = (
  transactionId,
  pumpNo,
  nozzleNo,
  elapsedSeconds
) => {
  // Simulate realistic fueling - about 30-50 liters per minute
  const flowRate = 0.6 + Math.random() * 0.3; // L/s
  const totalVolume = Math.min(elapsedSeconds * flowRate, 200); // Cap at 200L
  const pricePerLiter = 2.45;

  return {
    transactionId,
    pumpNo,
    nozzleNo,
    currentVolume: totalVolume.toFixed(2),
    flowRate: (flowRate * 60).toFixed(1), // L/min
    totalAmount: (totalVolume * pricePerLiter).toFixed(2),
    fuelType: "Diesel",
    startTime: new Date(Date.now() - elapsedSeconds * 1000).toISOString(),
    status: "FUELING",
  };
};

const FuelingDetailsStep = ({
  pump,
  nozzle,
  tank,
  vehicle,
  fuelingRules,
  volume: requestedVolume,
  isFullTank,
  onComplete,
  onBack,
  onEmergencyStop,
  onStartNewFueling,
}) => {
  // Current phase state
  const [phase, setPhase] = useState(PHASES.READY);
  const [transactionId, setTransactionId] = useState(null);
  const [uploadStatus, setUploadStatus] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");
  const [nozzleLiftCountdown, setNozzleLiftCountdown] = useState(5);
  const [authorizingProgress, setAuthorizingProgress] = useState(0);
  const [fuelingStartTime, setFuelingStartTime] = useState(null);
  const [showNotification, setShowNotification] = useState(false);

  // Animation refs
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  // Interval refs
  const nozzleTimerRef = useRef(null);
  const authTimerRef = useRef(null);
  const fuelingTimerRef = useRef(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (nozzleTimerRef.current) clearInterval(nozzleTimerRef.current);
      if (authTimerRef.current) clearInterval(authTimerRef.current);
      if (fuelingTimerRef.current) clearInterval(fuelingTimerRef.current);
    };
  }, []);

  // Pulse animation for waiting states
  useEffect(() => {
    if (phase === PHASES.WAITING_NOZZLE || phase === PHASES.AUTHORIZING) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [phase, pulseAnim]);

  // Handle "Start Authorization" button press
  const handleStartAuthorization = useCallback(() => {
    setPhase(PHASES.WAITING_NOZZLE);
    setNozzleLiftCountdown(5);

    // Start countdown for nozzle lift (simulated 5 seconds)
    let countdown = 5;
    nozzleTimerRef.current = setInterval(() => {
      countdown -= 1;
      setNozzleLiftCountdown(countdown);

      if (countdown <= 0) {
        clearInterval(nozzleTimerRef.current);
        // Simulate nozzle lifted - proceed to authorization
        handleNozzleLifted();
      }
    }, 1000);
  }, []);

  // Simulate user lifting the nozzle
  const handleNozzleLifted = useCallback(() => {
    if (nozzleTimerRef.current) {
      clearInterval(nozzleTimerRef.current);
    }

    // Vibrate to indicate nozzle detected
    Vibration.vibrate(200);

    setPhase(PHASES.AUTHORIZING);
    setAuthorizingProgress(0);

    // Simulate authorization process (about 3 seconds)
    let progress = 0;
    authTimerRef.current = setInterval(() => {
      progress += 10;
      setAuthorizingProgress(progress);

      if (progress >= 100) {
        clearInterval(authTimerRef.current);
        // Authorization complete - start fueling
        handleAuthorizationComplete();
      }
    }, 300);
  }, []);

  // Handle authorization complete
  const handleAuthorizationComplete = useCallback(() => {
    // Generate transaction ID
    const txnId = generateTransactionId();
    setTransactionId(txnId);

    // Vibrate to indicate authorization success
    Vibration.vibrate([0, 100, 100, 100]);

    // Start fueling
    setPhase(PHASES.FUELING);
    setFuelingStartTime(Date.now());
    setShowNotification(true);

    // Start monitoring fueling progress
    let elapsedSeconds = 0;
    fuelingTimerRef.current = setInterval(() => {
      elapsedSeconds += 1;

      // Generate mock upload status
      const status = generateMockUploadStatus(
        txnId,
        pump?.pumpNumber || pump?.id || 1,
        nozzle?.nozzleNumber || nozzle?.id || 1,
        elapsedSeconds
      );
      setUploadStatus(status);

      // Check if we should auto-complete (for simulation - stop after ~30 seconds or requested volume)
      const currentVolume = parseFloat(status.currentVolume);
      const targetVolume = isFullTank ? 150 : parseFloat(requestedVolume) || 50;

      if (currentVolume >= targetVolume) {
        clearInterval(fuelingTimerRef.current);
        handleFuelingComplete(status);
      }
    }, 1000);
  }, [pump, nozzle, isFullTank, requestedVolume]);

  // Handle fueling complete
  const handleFuelingComplete = useCallback(
    (finalStatus) => {
      setPhase(PHASES.COMPLETING);
      setShowNotification(false);

      // Brief delay then complete
      setTimeout(() => {
        setPhase(PHASES.COMPLETED);
        Vibration.vibrate([0, 200, 100, 200]);

        if (onComplete) {
          onComplete({
            transactionId,
            finalVolume: finalStatus.currentVolume,
            totalAmount: finalStatus.totalAmount,
            duration: Math.floor((Date.now() - fuelingStartTime) / 1000),
          });
        }
      }, 1500);
    },
    [transactionId, fuelingStartTime, onComplete]
  );

  // Handle emergency stop
  const handleEmergencyStop = useCallback(() => {
    Alert.alert(
      "Emergency Stop",
      "Are you sure you want to trigger an emergency stop? This will immediately halt fueling.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "STOP",
          style: "destructive",
          onPress: () => {
            // Stop all timers
            if (nozzleTimerRef.current) clearInterval(nozzleTimerRef.current);
            if (authTimerRef.current) clearInterval(authTimerRef.current);
            if (fuelingTimerRef.current) clearInterval(fuelingTimerRef.current);

            Vibration.vibrate([0, 500, 200, 500]);
            setPhase(PHASES.EMERGENCY_STOP);
            setShowNotification(false);

            if (onEmergencyStop) {
              onEmergencyStop({
                transactionId,
                stoppedAt: uploadStatus?.currentVolume || "0",
                reason: "User triggered emergency stop",
              });
            }
          },
        },
      ]
    );
  }, [transactionId, uploadStatus, onEmergencyStop]);

  // Handle manual nozzle lift (skip countdown)
  const handleManualNozzleLift = useCallback(() => {
    if (phase === PHASES.WAITING_NOZZLE) {
      handleNozzleLifted();
    }
  }, [phase, handleNozzleLifted]);

  // Render phase-specific content
  const renderPhaseContent = () => {
    switch (phase) {
      case PHASES.READY:
        return renderReadyPhase();
      case PHASES.WAITING_NOZZLE:
        return renderWaitingNozzlePhase();
      case PHASES.AUTHORIZING:
        return renderAuthorizingPhase();
      case PHASES.FUELING:
        return renderFuelingPhase();
      case PHASES.COMPLETING:
        return renderCompletingPhase();
      case PHASES.COMPLETED:
        return renderCompletedPhase();
      case PHASES.EMERGENCY_STOP:
        return renderEmergencyStopPhase();
      case PHASES.ERROR:
        return renderErrorPhase();
      default:
        return null;
    }
  };

  // READY phase - show summary and start button
  const renderReadyPhase = () => (
    <View style={styles.phaseContainer}>
      {/* Summary Header */}
      <View style={styles.summaryHeader}>
        <Icon name="clipboard-check" size={40} color="#3b82f6" />
        <Text style={styles.phaseTitle}>Ready to Fuel</Text>
        <Text style={styles.phaseSubtitle}>
          Review details and start authorization
        </Text>
      </View>

      {/* Details Cards */}
      <View style={styles.detailsContainer}>
        {/* Tank */}
        <View style={styles.detailCard}>
          <View style={[styles.detailIcon, { backgroundColor: "#dbeafe" }]}>
            <Icon name="database" size={20} color="#3b82f6" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Source Tank</Text>
            <Text style={styles.detailValue}>{tank?.tankName || "Tank"}</Text>
            <Text style={styles.detailSub}>
              {tank?.productName || "Diesel"}
            </Text>
          </View>
        </View>

        {/* Pump & Nozzle */}
        <View style={styles.detailCard}>
          <View style={[styles.detailIcon, { backgroundColor: "#fef3c7" }]}>
            <Icon name="gas-pump" size={20} color="#d97706" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Pump & Nozzle</Text>
            <Text style={styles.detailValue}>
              Pump {pump?.pumpNumber || pump?.id || 1} - Nozzle{" "}
              {nozzle?.nozzleNumber || nozzle?.id || 1}
            </Text>
          </View>
        </View>

        {/* Vehicle */}
        <View style={styles.detailCard}>
          <View style={[styles.detailIcon, { backgroundColor: "#d1fae5" }]}>
            <Icon name="truck" size={20} color="#059669" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Vehicle</Text>
            <Text style={styles.detailValue}>
              {vehicle?.hyoungNo || vehicle?.numberPlate || "Vehicle"}
            </Text>
            <Text style={styles.detailSub}>
              {vehicle?.vehicleName || vehicle?.driverName}
            </Text>
          </View>
        </View>

        {/* Volume */}
        <View style={styles.detailCard}>
          <View style={[styles.detailIcon, { backgroundColor: "#ede9fe" }]}>
            <Icon name="tint" size={20} color="#7c3aed" />
          </View>
          <View style={styles.detailInfo}>
            <Text style={styles.detailLabel}>Authorization</Text>
            <Text style={styles.detailValue}>
              {isFullTank ? "Full Tank" : `${requestedVolume || "50"} Liters`}
            </Text>
          </View>
        </View>
      </View>

      {/* Start Button */}
      <TouchableOpacity
        style={styles.startButton}
        onPress={handleStartAuthorization}
      >
        <Icon name="play-circle" size={24} color="white" />
        <Text style={styles.startButtonText}>Start Authorization</Text>
      </TouchableOpacity>

      {/* Back Button */}
      <TouchableOpacity style={styles.backButtonBottom} onPress={onBack}>
        <Icon name="arrow-left" size={16} color="#6b7280" />
        <Text style={styles.backButtonText}>Go Back</Text>
      </TouchableOpacity>
    </View>
  );

  // WAITING_NOZZLE phase - waiting for user to lift nozzle
  const renderWaitingNozzlePhase = () => (
    <View style={styles.phaseContainer}>
      <Animated.View
        style={[
          styles.waitingIconContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Icon name="hand-paper" size={60} color="#f59e0b" />
      </Animated.View>

      <Text style={styles.phaseTitle}>Lift the Nozzle</Text>
      <Text style={styles.phaseSubtitle}>
        Place nozzle in vehicle and lift to start
      </Text>

      {/* Countdown */}
      <View style={styles.countdownContainer}>
        <Text style={styles.countdownLabel}>Auto-detecting in</Text>
        <Text style={styles.countdownValue}>{nozzleLiftCountdown}</Text>
        <Text style={styles.countdownLabel}>seconds</Text>
      </View>

      {/* Manual Lift Button */}
      <TouchableOpacity
        style={styles.nozzleLiftButton}
        onPress={handleManualNozzleLift}
      >
        <Icon name="hand-point-up" size={24} color="white" />
        <Text style={styles.nozzleLiftButtonText}>I've Lifted the Nozzle</Text>
      </TouchableOpacity>

      {/* Cancel Button */}
      <TouchableOpacity
        style={styles.cancelButton}
        onPress={() => {
          if (nozzleTimerRef.current) clearInterval(nozzleTimerRef.current);
          setPhase(PHASES.READY);
        }}
      >
        <Text style={styles.cancelButtonText}>Cancel</Text>
      </TouchableOpacity>
    </View>
  );

  // AUTHORIZING phase - pump authorization in progress
  const renderAuthorizingPhase = () => (
    <View style={styles.phaseContainer}>
      <Animated.View
        style={[
          styles.authorizingIconContainer,
          { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <Icon name="sync" size={50} color="#3b82f6" />
      </Animated.View>

      <Text style={styles.phaseTitle}>Authorizing Pump</Text>
      <Text style={styles.phaseSubtitle}>
        Communicating with pump controller...
      </Text>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View
            style={[styles.progressFill, { width: `${authorizingProgress}%` }]}
          />
        </View>
        <Text style={styles.progressText}>{authorizingProgress}%</Text>
      </View>

      <Text style={styles.authorizingHint}>
        Pump {pump?.pumpNumber || pump?.id || 1} - Nozzle{" "}
        {nozzle?.nozzleNumber || nozzle?.id || 1}
      </Text>
    </View>
  );

  // FUELING phase - fueling in progress with live monitoring
  const renderFuelingPhase = () => (
    <View style={styles.phaseContainer}>
      {/* Live Indicator */}
      <View style={styles.liveIndicator}>
        <View style={styles.liveIndicatorDot} />
        <Text style={styles.liveIndicatorText}>LIVE</Text>
      </View>

      {/* Main Volume Display */}
      <View style={styles.volumeDisplayContainer}>
        <Text style={styles.volumeLabel}>Current Volume</Text>
        <Text style={styles.volumeValue}>
          {uploadStatus?.currentVolume || "0.00"}
        </Text>
        <Text style={styles.volumeUnit}>Liters</Text>
      </View>

      {/* Stats Row */}
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Icon name="tachometer-alt" size={16} color="#6b7280" />
          <Text style={styles.statValue}>
            {uploadStatus?.flowRate || "0"} L/min
          </Text>
          <Text style={styles.statLabel}>Flow Rate</Text>
        </View>
        <View style={styles.statDivider} />
        <View style={styles.statItem}>
          <Icon name="gas-pump" size={16} color="#6b7280" />
          <Text style={styles.statValue}>
            {uploadStatus?.fuelType || "Diesel"}
          </Text>
          <Text style={styles.statLabel}>Fuel Type</Text>
        </View>
      </View>

      {/* Pump Info */}
      <View style={styles.pumpInfoBar}>
        <Text style={styles.pumpInfoText}>
          Pump {uploadStatus?.pumpNo || pump?.pumpNumber || 1} • Nozzle{" "}
          {uploadStatus?.nozzleNo || nozzle?.nozzleNumber || 1}
        </Text>
        <Text style={styles.transactionIdText}>TXN: {transactionId}</Text>
      </View>

      {/* Target Progress (if not full tank) */}
      {!isFullTank && requestedVolume && (
        <View style={styles.targetContainer}>
          <Text style={styles.targetLabel}>Target: {requestedVolume}L</Text>
          <View style={styles.targetProgressBar}>
            <View
              style={[
                styles.targetProgressFill,
                {
                  width: `${Math.min(
                    (parseFloat(uploadStatus?.currentVolume || 0) /
                      parseFloat(requestedVolume)) *
                      100,
                    100
                  )}%`,
                },
              ]}
            />
          </View>
        </View>
      )}

      {/* Emergency Stop Button */}
      <TouchableOpacity
        style={styles.emergencyStopButton}
        onPress={handleEmergencyStop}
      >
        <Icon name="hand-paper" size={24} color="white" />
        <Text style={styles.emergencyStopText}>EMERGENCY STOP</Text>
      </TouchableOpacity>

      {/* Start New Fueling Link */}
      <TouchableOpacity
        style={styles.newFuelingLink}
        onPress={() => {
          Alert.alert(
            "Start New Fueling",
            "Current fueling will continue in background. Start a new fueling process?",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Start New",
                onPress: () => {
                  if (onStartNewFueling) onStartNewFueling();
                },
              },
            ]
          );
        }}
      >
        <Icon name="plus-circle" size={16} color="#3b82f6" />
        <Text style={styles.newFuelingLinkText}>Start Another Fueling</Text>
      </TouchableOpacity>
    </View>
  );

  // COMPLETING phase - finalizing transaction
  const renderCompletingPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.completingIconContainer}>
        <Icon name="check-circle" size={60} color="#10b981" />
      </View>
      <Text style={styles.phaseTitle}>Completing...</Text>
      <Text style={styles.phaseSubtitle}>Finalizing transaction</Text>
    </View>
  );

  // COMPLETED phase - transaction complete
  const renderCompletedPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.completedIconContainer}>
        <Icon name="check-circle" size={80} color="#10b981" solid />
      </View>

      <Text style={styles.completedTitle}>Fueling Complete!</Text>

      {/* Final Summary */}
      <View style={styles.completedSummary}>
        <View style={styles.completedRow}>
          <Text style={styles.completedLabel}>Volume Dispensed</Text>
          <Text style={styles.completedValue}>
            {uploadStatus?.currentVolume || "0.00"} L
          </Text>
        </View>
        <View style={styles.completedDivider} />
        <View style={styles.completedRow}>
          <Text style={styles.completedLabel}>Transaction ID</Text>
          <Text style={styles.completedValue}>{transactionId}</Text>
        </View>
      </View>

      {/* Done Button */}
      <TouchableOpacity
        style={styles.doneButton}
        onPress={() => {
          if (onComplete) {
            onComplete({
              transactionId,
              finalVolume: uploadStatus?.currentVolume,
              status: "completed",
            });
          }
        }}
      >
        <Icon name="check" size={20} color="white" />
        <Text style={styles.doneButtonText}>Done</Text>
      </TouchableOpacity>

      {/* Start New */}
      <TouchableOpacity
        style={styles.startNewButton}
        onPress={onStartNewFueling}
      >
        <Icon name="plus" size={16} color="#3b82f6" />
        <Text style={styles.startNewButtonText}>Start New Fueling</Text>
      </TouchableOpacity>
    </View>
  );

  // EMERGENCY_STOP phase
  const renderEmergencyStopPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.emergencyIconContainer}>
        <Icon name="exclamation-triangle" size={60} color="#ef4444" />
      </View>

      <Text style={styles.emergencyTitle}>Emergency Stop</Text>
      <Text style={styles.emergencySubtitle}>Fueling has been stopped</Text>

      {/* Stopped Summary */}
      <View style={styles.emergencySummary}>
        <Text style={styles.emergencyLabel}>Volume Before Stop</Text>
        <Text style={styles.emergencyValue}>
          {uploadStatus?.currentVolume || "0.00"} L
        </Text>
      </View>

      {/* Return Button */}
      <TouchableOpacity style={styles.returnButton} onPress={onBack}>
        <Icon name="arrow-left" size={16} color="white" />
        <Text style={styles.returnButtonText}>Return to Home</Text>
      </TouchableOpacity>
    </View>
  );

  // ERROR phase
  const renderErrorPhase = () => (
    <View style={styles.phaseContainer}>
      <View style={styles.errorIconContainer}>
        <Icon name="times-circle" size={60} color="#ef4444" />
      </View>

      <Text style={styles.errorTitle}>Error</Text>
      <Text style={styles.errorSubtitle}>
        {errorMessage || "An error occurred"}
      </Text>

      <TouchableOpacity
        style={styles.retryButton}
        onPress={() => setPhase(PHASES.READY)}
      >
        <Icon name="redo" size={16} color="white" />
        <Text style={styles.retryButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderPhaseContent()}
      </ScrollView>

      {/* Notification Modal (shown during fueling) */}
      <Modal visible={showNotification} transparent animationType="slide">
        <View style={styles.notificationContainer}>
          <View style={styles.notificationCard}>
            <View style={styles.notificationHeader}>
              <View style={styles.notificationLive}>
                <View style={styles.notificationLiveDot} />
                <Text style={styles.notificationLiveText}>FUELING</Text>
              </View>
              <TouchableOpacity
                onPress={() => setShowNotification(false)}
                style={styles.notificationClose}
              >
                <Icon name="times" size={16} color="#6b7280" />
              </TouchableOpacity>
            </View>

            <View style={styles.notificationBody}>
              <Text style={styles.notificationPump}>
                Pump {uploadStatus?.pumpNo || pump?.pumpNumber || 1} • Nozzle{" "}
                {uploadStatus?.nozzleNo || nozzle?.nozzleNumber || 1}
              </Text>
              <Text style={styles.notificationVolume}>
                {uploadStatus?.currentVolume || "0.00"} L
              </Text>
              <Text style={styles.notificationFlow}>
                Flow: {uploadStatus?.flowRate || "0"} L/min
              </Text>
            </View>

            <TouchableOpacity
              style={styles.notificationEmergency}
              onPress={handleEmergencyStop}
            >
              <Icon name="hand-paper" size={14} color="#ef4444" />
              <Text style={styles.notificationEmergencyText}>
                Emergency Stop
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f3f4f6",
  },
  scrollContainer: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  phaseContainer: {
    alignItems: "center",
    paddingVertical: 20,
  },

  // Summary Header
  summaryHeader: {
    alignItems: "center",
    marginBottom: 24,
  },
  phaseTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 12,
  },
  phaseSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginTop: 4,
  },

  // Details Cards
  detailsContainer: {
    width: "100%",
    marginBottom: 24,
  },
  detailCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  detailIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  detailInfo: {
    marginLeft: 14,
    flex: 1,
  },
  detailLabel: {
    fontSize: 12,
    color: "#6b7280",
  },
  detailValue: {
    fontSize: 15,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 2,
  },
  detailSub: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 1,
  },

  // Start Button
  startButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    marginBottom: 12,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "600",
    color: "white",
    marginLeft: 10,
  },
  backButtonBottom: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  backButtonText: {
    fontSize: 15,
    color: "#6b7280",
    marginLeft: 8,
  },

  // Waiting Nozzle Phase
  waitingIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#fef3c7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  countdownContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  countdownLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  countdownValue: {
    fontSize: 64,
    fontWeight: "700",
    color: "#f59e0b",
  },
  nozzleLiftButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#f59e0b",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
    marginTop: 16,
  },
  nozzleLiftButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 10,
  },
  cancelButton: {
    paddingVertical: 12,
    marginTop: 16,
  },
  cancelButtonText: {
    fontSize: 15,
    color: "#6b7280",
  },

  // Authorizing Phase
  authorizingIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#dbeafe",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  progressContainer: {
    width: "100%",
    marginVertical: 24,
    alignItems: "center",
  },
  progressBar: {
    width: "80%",
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
    fontSize: 14,
    color: "#6b7280",
    marginTop: 8,
  },
  authorizingHint: {
    fontSize: 14,
    color: "#9ca3af",
  },

  // Fueling Phase
  liveIndicator: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fee2e2",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginBottom: 20,
  },
  liveIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#ef4444",
    marginRight: 6,
  },
  liveIndicatorText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ef4444",
  },
  volumeDisplayContainer: {
    alignItems: "center",
    marginBottom: 24,
  },
  volumeLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  volumeValue: {
    fontSize: 72,
    fontWeight: "700",
    color: "#1f2937",
    letterSpacing: -2,
  },
  volumeUnit: {
    fontSize: 18,
    color: "#6b7280",
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    borderRadius: 12,
    padding: 16,
    width: "100%",
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 40,
    backgroundColor: "#e5e7eb",
  },
  pumpInfoBar: {
    backgroundColor: "white",
    borderRadius: 10,
    padding: 12,
    width: "100%",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  pumpInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#374151",
  },
  transactionIdText: {
    fontSize: 12,
    color: "#6b7280",
  },
  targetContainer: {
    width: "100%",
    marginBottom: 20,
  },
  targetLabel: {
    fontSize: 12,
    color: "#6b7280",
    marginBottom: 6,
    textAlign: "center",
  },
  targetProgressBar: {
    height: 6,
    backgroundColor: "#e5e7eb",
    borderRadius: 3,
    overflow: "hidden",
  },
  targetProgressFill: {
    height: "100%",
    backgroundColor: "#10b981",
    borderRadius: 3,
  },
  emergencyStopButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: "100%",
    marginTop: 8,
  },
  emergencyStopText: {
    fontSize: 16,
    fontWeight: "700",
    color: "white",
    marginLeft: 10,
  },
  newFuelingLink: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    marginTop: 8,
  },
  newFuelingLinkText: {
    fontSize: 14,
    color: "#3b82f6",
    marginLeft: 6,
  },

  // Completing Phase
  completingIconContainer: {
    marginBottom: 20,
  },

  // Completed Phase
  completedIconContainer: {
    marginBottom: 16,
  },
  completedTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: "#10b981",
    marginBottom: 20,
  },
  completedSummary: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    width: "100%",
    marginBottom: 24,
  },
  completedRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
  },
  completedLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  completedValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1f2937",
  },
  completedDivider: {
    height: 1,
    backgroundColor: "#e5e7eb",
    marginVertical: 8,
  },
  doneButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 10,
    width: "100%",
    marginBottom: 12,
  },
  doneButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },
  startNewButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
  },
  startNewButtonText: {
    fontSize: 14,
    color: "#3b82f6",
    marginLeft: 6,
  },

  // Emergency Stop Phase
  emergencyIconContainer: {
    marginBottom: 16,
  },
  emergencyTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 8,
  },
  emergencySubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
  },
  emergencySummary: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
  },
  emergencyLabel: {
    fontSize: 14,
    color: "#6b7280",
  },
  emergencyValue: {
    fontSize: 32,
    fontWeight: "700",
    color: "#1f2937",
    marginTop: 4,
  },
  returnButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#6b7280",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  returnButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },

  // Error Phase
  errorIconContainer: {
    marginBottom: 16,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: "#ef4444",
    marginBottom: 8,
  },
  errorSubtitle: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 24,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#3b82f6",
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 10,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "white",
    marginLeft: 8,
  },

  // Notification Modal
  notificationContainer: {
    flex: 1,
    justifyContent: "flex-start",
    paddingTop: 50,
    paddingHorizontal: 16,
  },
  notificationCard: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
  },
  notificationHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  notificationLive: {
    flexDirection: "row",
    alignItems: "center",
  },
  notificationLiveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
    marginRight: 6,
  },
  notificationLiveText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#10b981",
  },
  notificationClose: {
    padding: 4,
  },
  notificationBody: {
    alignItems: "center",
    marginBottom: 12,
  },
  notificationPump: {
    fontSize: 14,
    color: "#6b7280",
    marginBottom: 4,
  },
  notificationVolume: {
    fontSize: 36,
    fontWeight: "700",
    color: "#1f2937",
  },
  notificationFlow: {
    fontSize: 12,
    color: "#9ca3af",
    marginTop: 2,
  },
  notificationEmergency: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
  },
  notificationEmergencyText: {
    fontSize: 14,
    color: "#ef4444",
    fontWeight: "600",
    marginLeft: 6,
  },
});

export default FuelingDetailsStep;
