/**
 * FuelingProcessScreen - Mobile fueling process screen
 * UI component that renders the fueling workflow steps
 * Business logic is handled by useFuelingProcess hook
 */
import React, { useEffect, useCallback } from "react";
import { View, StyleSheet, SafeAreaView, BackHandler, TouchableOpacity, Text } from "react-native";
import { useRoute, useFocusEffect } from "@react-navigation/native";
import Toast from "react-native-toast-message";
import Icon from "react-native-vector-icons/FontAwesome5";

// Import mobile components
import TankSelectionStep from "../components/fueling/TankSelectionStep";
import PumpSelectionStep from "../components/fueling/PumpSelectionStep";
import NozzleSelectionStep from "../components/fueling/NozzleSelectionStep";
import ModeSelectionStep from "../components/fueling/ModeSelectionStep";
import TransferDetailsStep from "../components/fueling/TransferDetailsStep";
import VehicleSelectionStep from "../components/fueling/VehicleSelectionStep";
import FuelingVolumeStep from "../components/fueling/FuelingVolumeStep";
import ScanStep from "../components/fueling/ScanStep";
import TransactionMonitoringModal from "../components/fueling/TransactionMonitoringModal";
import TransactionSummaryStep from "../components/fueling/TransactionSummaryStep";
import FuelingHeader from "../components/fueling/FuelingHeader";
import LoadingOverlay from "../components/common/LoadingOverlay";

// Import custom hook
import { useFuelingProcess } from "../hooks/useFuelingProcess";

const FuelingProcessScreen = () => {
  const route = useRoute();

  // Get params - ptsId is required for real device connection
  const ptsId = route.params?.ptsId;
  const siteId = route.params?.siteId || 1;

  // Use the custom hook for all state and business logic
  const {
    // Navigation
    navigation,

    // Step state
    step,
    tankLoadingComplete,
    handleStepBack,
    handleStepNext,

    // Device data
    ptsDevice,
    deviceConnectionStatus,
    isDataLoading,
    isRefreshing,
    handleRefreshData,
    rawUploadStatus,

    // Tank state
    availableTanks,
    selectedTank,
    setSelectedTank,
    handleChangeTank,
    destinationTank,
    setDestinationTank,

    // Pump and nozzle state
    availablePumps,
    selectedPump,
    selectedNozzle,
    getPumpDetails,
    getNozzlesForPump,
    fuelGrades,

    // Operation mode
    operationMode,
    setOperationMode,

    // Transfer state
    transferVolume,
    setTransferVolume,
    transferReason,
    setTransferReason,
    handleTransferConfirm,

    // Vehicle state
    vehicles,
    isLoadingVehicles,
    selectedVehicle,
    setSelectedVehicle,
    vehicleReg,
    setVehicleReg,
    vehicleInfo,
    setVehicleInfo,

    // Fueling state
    fuelingVolume,
    setFuelingVolume,
    isFullTank,
    setIsFullTank,
    odometer,
    setOdometer,
    notes,
    setNotes,
    fuelingRules,
    setFuelingRules,
    handleVehicleFuelingConfirm,

    // Driver/Employee state
    selectedDriver,
    setSelectedDriver,

    // Authorization state
    isAuthorizing,
    authorizingStatus,
    authError,
    handleRetryAuthorization,
    handleCancelAuthorization,

    // Scanning state
    isScanning,
    scanResult,
    selectionMethod,
    setSelectionMethod,
    handleScan,

    // Transaction monitoring
    showTransactionMonitoring,
    currentTransactionId,
    isViewingExternalFueling,
    viewingPumpData,
    isTransactionMinimized,
    handleTransactionComplete,
    handleMinimizeMonitoring,
    handleRestoreMonitoring,
    handleCloseTransactionMonitoring,
    handleViewFuelingFromHeader,

    // Summary step
    completedTransactionData,
    handleStartNewFueling,
    handleBackToPumps,

    // Active fueling
    activeFuelingProcesses,
    activeFuelingPump,

    // Validation settings
    validationSettings,

    // Location state for authorization
    currentLocation,
    locationSettings,
    handleLocationUpdate,

    // Site info
    sites,
    siteName,
  } = useFuelingProcess(ptsId, siteId);

  // Validate that ptsId was provided
  useEffect(() => {
    if (!ptsId) {
      console.error(
        "[FuelingProcessScreen] ERROR: No ptsId provided in route params"
      );
      Toast.show({
        type: "error",
        text1: "Device Not Selected",
        text2: "Please select a PTS device from the device list",
        position: "bottom",
        visibilityTime: 4000,
      });
      navigation.goBack();
    }
  }, [ptsId, navigation]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step !== "tank") {
          handleStepBack();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener(
        "hardwareBackPress",
        onBackPress
      );
      return () => backHandler.remove();
    }, [step, handleStepBack])
  );

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case "tank":
        return (
          <TankSelectionStep
            tanks={availableTanks}
            selectedTank={selectedTank}
            onSelectTank={setSelectedTank}
            onNext={(tank) => {
              console.log(
                "[FuelingProcessScreen] Tank selected via callback:",
                tank
              );
              handleStepNext("pump", { tank: tank || selectedTank });
            }}
            onBack={() => navigation.goBack()}
            onRefresh={handleRefreshData}
            isLoadingTanks={isDataLoading}
            isRefreshing={isRefreshing}
          />
        );

      case "pump":
        return (
          <PumpSelectionStep
            pumps={availablePumps}
            activePumps={activeFuelingProcesses}
            onPumpSelect={(pump) => handleStepNext("nozzle", { pump })}
            onRefresh={handleRefreshData}
            connectionStatus={deviceConnectionStatus}
            isRefreshing={isRefreshing}
            nozzleConfig={rawUploadStatus?.Pumps?.NozzleConfig || {}}
          />
        );

      case "nozzle":
        return (
          <NozzleSelectionStep
            pump={selectedPump}
            nozzles={getNozzlesForPump(selectedPump?.id)}
            fuelGrades={fuelGrades}
            onNozzleSelect={(nozzle) => handleStepNext("mode", { nozzle })}
            onRefresh={handleRefreshData}
            isRefreshing={isRefreshing}
            onBack={handleStepBack}
          />
        );

      case "mode":
        return (
          <ModeSelectionStep
            selectedMode={operationMode}
            onSelectMode={setOperationMode}
            onNext={(mode) => {
              const selectedModeValue = mode || operationMode;
              if (selectedModeValue === "transfer") {
                handleStepNext("transfer");
              } else if (selectedModeValue === "vehicle") {
                handleStepNext("vehicle");
              }
            }}
            onBack={handleStepBack}
          />
        );

      case "transfer":
        return (
          <TransferDetailsStep
            sourceTank={selectedTank}
            destinationTank={destinationTank}
            transferVolume={transferVolume}
            transferReason={transferReason}
            onSelectDestination={setDestinationTank}
            onVolumeChange={setTransferVolume}
            onReasonChange={setTransferReason}
            onNext={handleTransferConfirm}
            onBack={handleStepBack}
            selectedPump={selectedPump}
            selectedNozzle={selectedNozzle}
            pumpDetails={getPumpDetails(selectedPump?.id)}
          />
        );

      case "vehicle":
        return (
          <VehicleSelectionStep
            selectedVehicle={selectedVehicle}
            onSelectVehicle={(vehicle, rules) => {
              setSelectedVehicle(vehicle);
              setVehicleInfo(vehicle);
              setFuelingRules(rules);
            }}
            onScanRfid={handleScan}
            isScanning={isScanning}
            onNext={() =>
              handleStepNext("volume", { vehicle: selectedVehicle })
            }
            onBack={handleStepBack}
            enableFuelRulesCheck={validationSettings.fuelRulesCheckEnabled}
          />
        );

      case "volume":
        return (
          <FuelingVolumeStep
            selectedVehicle={selectedVehicle}
            sourceTank={selectedTank}
            selectedPump={selectedPump}
            selectedNozzle={selectedNozzle}
            pumpDetails={getPumpDetails(selectedPump?.id)}
            volume={fuelingVolume}
            isFullTank={isFullTank}
            odometer={odometer}
            notes={notes}
            onVolumeChange={setFuelingVolume}
            onFullTankChange={setIsFullTank}
            onOdometerChange={setOdometer}
            onNotesChange={setNotes}
            onNext={handleVehicleFuelingConfirm}
            onBack={handleStepBack}
            enableFuelCapacityValidation={
              validationSettings.fuelCapacityValidationEnabled
            }
            enableGPSFuelLevelCheck={
              validationSettings.gpsFuelLevelCheckEnabled
            }
            fuelingRules={fuelingRules}
            selectedDriver={selectedDriver}
            onDriverChange={setSelectedDriver}
            siteId={siteId}
            sites={sites}
            siteName={siteName}
            // Location props for GPS status indicator
            onLocationUpdate={handleLocationUpdate}
            showLocationStatus={true}
            maxLocationAgeSeconds={locationSettings.maxLocationAgeSeconds}
          />
        );

      case "scan":
        return (
          <ScanStep
            isScanning={isScanning}
            scanResult={scanResult}
            vehicleInfo={vehicleInfo}
            selectionMethod={selectionMethod}
            vehicles={vehicles}
            vehicleReg={vehicleReg}
            onScan={handleScan}
            onVehicleSelect={(vehicle, rules) => {
              setSelectedVehicle(vehicle);
              setVehicleInfo(vehicle);
              setFuelingRules(rules);
              handleStepNext("volume", { vehicle, rules });
            }}
            onNext={(data) => handleStepNext("volume", data)}
            onBack={handleStepBack}
            setSelectionMethod={setSelectionMethod}
            setVehicleReg={setVehicleReg}
            isLoadingVehicles={isLoadingVehicles}
            deviceId={ptsId}
          />
        );

      case "summary":
        return (
          <TransactionSummaryStep
            transactionData={completedTransactionData}
            onStartNewFueling={handleStartNewFueling}
            onBackToPumps={handleBackToPumps}
            siteName={siteName()}
            deviceName={ptsDevice?.ptsName}
          />
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Show loading state while determining initial step */}
      {!tankLoadingComplete ? (
        <LoadingOverlay message="Loading..." />
      ) : (
        <>
          <FuelingHeader
            siteName={siteName()}
            deviceId={ptsId}
            deviceName={ptsDevice?.ptsName}
            currentStep={step}
            connectionStatus={deviceConnectionStatus}
            deviceOnline={deviceConnectionStatus === "connected"}
            onBack={
              step === "summary"
                ? null // No back button on summary - use buttons in step
                : step === "tank"
                ? () => navigation.goBack()
                : handleStepBack
            }
            selectedTank={selectedTank}
            operationMode={operationMode}
            onChangeTank={handleChangeTank}
            activeFuelingPump={activeFuelingPump}
            activeFuelingPumps={activeFuelingProcesses}
            onViewFueling={handleViewFuelingFromHeader}
          />

          <View style={styles.content}>{renderCurrentStep()}</View>
        </>
      )}

      {/* Authorization loading/error overlay */}
      {(isAuthorizing || authError) && (
        <LoadingOverlay
          visible={true}
          message={
            authorizingStatus === "location"
              ? "Getting location..."
              : "Authorizing pump..."
          }
          subMessage={
            authorizingStatus === "location"
              ? "Please wait while we verify your position"
              : null
          }
          hasError={!!authError}
          errorMessage={authError}
          onRetry={handleRetryAuthorization}
          onCancel={handleCancelAuthorization}
          retryLabel="Try Again"
          cancelLabel="Cancel"
        />
      )}

      {/* Minimized Transaction Banner */}
      {isTransactionMinimized && currentTransactionId && !showTransactionMonitoring && (
        <TouchableOpacity
          style={styles.minimizedBanner}
          onPress={handleRestoreMonitoring}
          activeOpacity={0.8}
        >
          <View style={styles.minimizedBannerContent}>
            <View style={styles.minimizedPulse}>
              <Icon name="gas-pump" size={16} color="white" />
            </View>
            <View style={styles.minimizedTextContainer}>
              <Text style={styles.minimizedTitle}>Fueling in Progress</Text>
              <Text style={styles.minimizedSubtitle}>
                Transaction #{currentTransactionId} • Tap to view
              </Text>
            </View>
            <Icon name="chevron-up" size={16} color="white" />
          </View>
        </TouchableOpacity>
      )}

      <TransactionMonitoringModal
        visible={showTransactionMonitoring}
        deviceId={ptsId}
        pumpId={selectedPump?.id}
        nozzleId={selectedNozzle?.id}
        transactionId={currentTransactionId}
        vehicleInfo={selectedVehicle}
        authorizationType={isFullTank ? "Full" : "Volume"}
        requestedVolume={isFullTank ? null : parseFloat(fuelingVolume) || null}
        operationMode={operationMode}
        onComplete={handleTransactionComplete}
        onCancel={handleCloseTransactionMonitoring}
        onMinimize={handleMinimizeMonitoring}
        isExternalFueling={isViewingExternalFueling}
        initialVolume={
          isViewingExternalFueling ? viewingPumpData?.volume || 0 : 0
        }
        initialAmount={
          isViewingExternalFueling ? viewingPumpData?.amount || 0 : 0
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  minimizedBanner: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#1e40af",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  minimizedBannerContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  minimizedPulse: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  minimizedTextContainer: {
    flex: 1,
  },
  minimizedTitle: {
    color: "white",
    fontSize: 14,
    fontWeight: "600",
  },
  minimizedSubtitle: {
    color: "rgba(255, 255, 255, 0.8)",
    fontSize: 12,
    marginTop: 2,
  },
});

export default FuelingProcessScreen;
