//Cursor - Mobile fueling process screen adapted from web frontend
import React, {useState, useEffect, useCallback, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  BackHandler,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {useNavigation, useRoute, useFocusEffect} from '@react-navigation/native';
import Toast from 'react-native-toast-message';

// Import mobile components
import PumpSelectionStep from '../components/fueling/PumpSelectionStep';
import NozzleSelectionStep from '../components/fueling/NozzleSelectionStep';
import ScanStep from '../components/fueling/ScanStep';
import FuelingDetailsStep from '../components/fueling/FuelingDetailsStep';
import TransactionMonitoringModal from '../components/fueling/TransactionMonitoringModal';
import FuelingHeader from '../components/fueling/FuelingHeader';
import LoadingOverlay from '../components/common/LoadingOverlay';

// Import hooks and services
import {useDeviceData} from '../hooks/useDeviceData';
import {pumpControlService} from '../services/pumpControlService';
import FuelingUtils from '../utils/FuelingUtils';

// Import Redux actions
import {
  fetchVehicleList,
  fetchTagsByVehicleId,
  validateTag,
  validateVehicle,
} from '../redux/slices/vehicleSlice';
import {fetchSiteList} from '../redux/slices/siteSlice';
import {authorizePump} from '../redux/slices/fuelingSlice';
import {createFuelingEvent} from '../redux/slices/fuelingEventSlice';

const FuelingProcessScreen = () => {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const route = useRoute();

  const {ptsId} = route.params;
  const previousPumpStatuses = useRef({});

  // Redux state
  const {
    devicePumpStatus,
    pumps: availablePumps,
    activeFuelingProcesses,
    lastUpdated: deviceLastUpdated,
    isLiveDataEnabled,
    getPumpDetails,
    getNozzlesForPump,
    rawUploadStatus,
    fuelGrades,
  } = useDeviceData(ptsId);

  const ptsDevice = useSelector(state =>
    state.device.ptsDeviceList.find(dev => dev.ptsid === ptsId),
  );

  const sites = useSelector(state => state.site.sites);
  const vehicles = useSelector(state => state.vehicle.vehicles);
  const isLoadingVehicles = useSelector(state => state.vehicle.loading);
  const loggedInUser = useSelector(state => state.auth.user);
  const fuelingEvents = useSelector(state =>
    state.fuelingEvent.events.filter(e => e.deviceId === ptsId),
  );

  // Local state
  const [step, setStep] = useState('pump');
  const [selectedPump, setSelectedPump] = useState(null);
  const [selectedNozzle, setSelectedNozzle] = useState(null);
  const [selectedVehicleId, setSelectedVehicleId] = useState(null);
  const [vehicleReg, setVehicleReg] = useState('');
  const [isAuthorizing, setIsAuthorizing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [vehicleInfo, setVehicleInfo] = useState(null);
  const [selectedType, setSelectedType] = useState('Amount');
  const [amount, setAmount] = useState('');
  const [volume, setVolume] = useState('');
  const [fuelPrice, setFuelPrice] = useState(3.99);
  const [showTransactionMonitoring, setShowTransactionMonitoring] = useState(false);
  const [currentTransactionId, setCurrentTransactionId] = useState(null);
  const [tagDetails, setTagDetails] = useState(null);
  const [selectedTag, setSelectedTag] = useState(null);
  const [selectionMethod, setSelectionMethod] = useState('lookup');
  const [useMasterTag, setUseMasterTag] = useState(false);
  const [deviceConnectionStatus, setDeviceConnectionStatus] = useState('connecting');

  // Get site name
  const siteName = useCallback(() => {
    if (!ptsDevice?.site || !sites?.length) return null;
    const site = sites.find(s => s.id === ptsDevice.site);
    return site?.name || null;
  }, [ptsDevice, sites]);

  // Initialize data
  useEffect(() => {
    dispatch(fetchVehicleList());
    dispatch(fetchSiteList());
  }, [dispatch]);

  // Handle back button
  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        if (step !== 'pump') {
          handleStepBack();
          return true;
        }
        return false;
      };

      const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => backHandler.remove();
    }, [step]),
  );

  // Handle step navigation
  const handleStepBack = () => {
    switch (step) {
      case 'nozzle':
        setStep('pump');
        setSelectedPump(null);
        break;
      case 'scan':
        setStep('nozzle');
        setSelectedNozzle(null);
        break;
      case 'details':
        setStep('scan');
        setScanResult(null);
        setVehicleInfo(null);
        break;
      default:
        navigation.goBack();
    }
  };

  const handleStepNext = (nextStep, data = {}) => {
    switch (nextStep) {
      case 'nozzle':
        setSelectedPump(data.pump);
        setStep('nozzle');
        break;
      case 'scan':
        setSelectedNozzle(data.nozzle);
        setStep('scan');
        break;
      case 'details':
        if (data.vehicleInfo) {
          setVehicleInfo(data.vehicleInfo);
          setSelectedVehicleId(data.vehicleInfo.id);
        }
        if (data.tagDetails) {
          setTagDetails(data.tagDetails);
          setSelectedTag(data.tagDetails.id);
        }
        setStep('details');
        break;
    }
  };

  // Start fueling authorization
  const startFueling = async (authorizationData) => {
    if (isAuthorizing) return;

    try {
      setIsAuthorizing(true);

      const {
        authType,
        dose,
        vehicleId,
        tagId,
        useMasterTag: shouldUseMasterTag,
      } = authorizationData;

      // Validate required data
      const validation = FuelingUtils.validateTransactionData(
        selectedPump?.id,
        selectedNozzle?.id,
        vehicleId,
        tagId,
        authType,
        dose,
      );

      if (!validation.isValid) {
        Alert.alert('Validation Error', validation.errors.join('\n'));
        return;
      }

      // Prepare authorization request
      const authRequest = {
        deviceId: ptsId,
        pumpId: selectedPump.id,
        nozzle: selectedNozzle.id,
        type: authType,
        dose: authType === 'Full' ? null : dose,
        vehicleId: vehicleId,
        tag: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
        useMasterTag: shouldUseMasterTag,
      };

      console.log('[Mobile Fueling] Starting authorization:', authRequest);

      // Dispatch authorization action
      const result = await dispatch(authorizePump(authRequest)).unwrap();

      if (result.success) {
        setCurrentTransactionId(result.data?.transactionId);
        setShowTransactionMonitoring(true);

        // Create fueling event
        dispatch(createFuelingEvent('started', ptsId, {
          pumpId: selectedPump.id,
          nozzleNumber: selectedNozzle.id,
          transactionId: result.data?.transactionId,
          authType,
          dose,
          vehicleId,
          tagId: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
        }));

        Toast.show({
          type: 'success',
          text1: 'Authorization Successful',
          text2: 'Transaction started successfully',
        });
      } else {
        Alert.alert('Authorization Failed', result.message || 'Failed to authorize pump');
      }
    } catch (error) {
      console.error('[Mobile Fueling] Authorization error:', error);
      Alert.alert('Error', error.message || 'Failed to start fueling');
    } finally {
      setIsAuthorizing(false);
    }
  };

  // Handle transaction completion
  const handleTransactionComplete = (transactionId) => {
    setShowTransactionMonitoring(false);
    setCurrentTransactionId(null);

    // Reset to pump selection
    resetFuelingProcess();

    Toast.show({
      type: 'success',
      text1: 'Transaction Complete',
      text2: `Transaction ${transactionId} completed successfully`,
    });
  };

  // Reset fueling process
  const resetFuelingProcess = () => {
    setStep('pump');
    setSelectedPump(null);
    setSelectedNozzle(null);
    setSelectedVehicleId(null);
    setVehicleReg('');
    setScanResult(null);
    setVehicleInfo(null);
    setTagDetails(null);
    setSelectedTag(null);
    setAmount('');
    setVolume('');
    setSelectedType('Amount');
    setUseMasterTag(false);
  };

  // Render current step
  const renderCurrentStep = () => {
    switch (step) {
      case 'pump':
        return (
          <PumpSelectionStep
            pumps={availablePumps}
            activePumps={activeFuelingProcesses}
            onPumpSelect={(pump) => handleStepNext('nozzle', {pump})}
            connectionStatus={deviceConnectionStatus}
          />
        );
      case 'nozzle':
        return (
          <NozzleSelectionStep
            pump={selectedPump}
            nozzles={getNozzlesForPump(selectedPump?.id)}
            fuelGrades={fuelGrades}
            onNozzleSelect={(nozzle) => handleStepNext('scan', {nozzle})}
            onBack={handleStepBack}
          />
        );
      case 'scan':
        return (
          <ScanStep
            isScanning={isScanning}
            scanResult={scanResult}
            vehicleInfo={vehicleInfo}
            selectionMethod={selectionMethod}
            vehicles={vehicles}
            vehicleReg={vehicleReg}
            onScan={handleScan}
            onVehicleSelect={handleVehicleSelect}
            onNext={(data) => handleStepNext('details', data)}
            onBack={handleStepBack}
            setSelectionMethod={setSelectionMethod}
            setVehicleReg={setVehicleReg}
          />
        );
      case 'details':
        return (
          <FuelingDetailsStep
            pump={selectedPump}
            nozzle={selectedNozzle}
            vehicleInfo={vehicleInfo}
            tagDetails={tagDetails}
            selectedType={selectedType}
            amount={amount}
            volume={volume}
            fuelPrice={fuelPrice}
            useMasterTag={useMasterTag}
            masterTag={loggedInUser?.masterTag}
            isAuthorizing={isAuthorizing}
            onAuthorize={startFueling}
            onBack={handleStepBack}
            setSelectedType={setSelectedType}
            setAmount={setAmount}
            setVolume={setVolume}
            setUseMasterTag={setUseMasterTag}
          />
        );
      default:
        return null;
    }
  };

  // Handle tag scanning
  const handleScan = async () => {
    // Implementation for RFID/QR code scanning
    setIsScanning(true);
    // This would integrate with camera/NFC scanning
    // For now, simulate scan
    setTimeout(() => {
      setIsScanning(false);
      setScanResult('sample-tag-123');
    }, 2000);
  };

  // Handle vehicle selection
  const handleVehicleSelect = async (vehicle) => {
    try {
      const result = await dispatch(validateVehicle(vehicle.id)).unwrap();
      if (result.success) {
        setVehicleInfo(result.data);
        setSelectedVehicleId(vehicle.id);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to validate vehicle');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <FuelingHeader
        siteName={siteName()}
        deviceId={ptsId}
        currentStep={step}
        connectionStatus={deviceConnectionStatus}
        onBack={step === 'pump' ? () => navigation.goBack() : handleStepBack}
      />

      <View style={styles.content}>
        {renderCurrentStep()}
      </View>

      {isAuthorizing && <LoadingOverlay message="Authorizing pump..." />}

      <TransactionMonitoringModal
        visible={showTransactionMonitoring}
        deviceId={ptsId}
        pumpId={selectedPump?.id}
        nozzleId={selectedNozzle?.id}
        transactionId={currentTransactionId}
        onComplete={handleTransactionComplete}
        onCancel={() => setShowTransactionMonitoring(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    padding: 16,
  },
});

export default FuelingProcessScreen;