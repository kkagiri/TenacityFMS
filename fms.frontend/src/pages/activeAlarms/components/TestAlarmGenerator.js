import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { createTestAlarm, fetchAlarmStatistics, testSignalRBroadcast } from '../../../redux/actions/activeAlarmActions';
import { addNotification } from '../../../redux/actions/notificationActions';
import SignalRService from '../../../signalR/SignalRService';
import './TestAlarmGenerator.scss';

const TestAlarmGenerator = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { loading, statistics } = useSelector(state => state.activeAlarm);
  const { isConnected } = useSelector(state => state.signalR || {});

  const [formData, setFormData] = useState({
    alarmType: 'TestAlarm',
    triggerSource: 'Manual',
    message: 'Test alarm generated for system testing',
    description: 'This is a test alarm to verify end-to-end functionality',
    severity: 'Medium',
    priority: 'Medium',
    siteId: null,
    tankId: null,
    deviceId: null,
    ptsDeviceId: '',
    thresholdValue: null,
    actualValue: null,
    unit: '',
    autoResolveMinutes: 0,
    createNotification: true,
    suppressNotifications: false
  });

  const [testResults, setTestResults] = useState({
    alarmCreated: false,
    notificationSent: false,
    signalRReceived: false,
    errors: []
  });

  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAlarmId, setGeneratedAlarmId] = useState(null);

  // Predefined test scenarios
  const testScenarios = [
    {
      name: 'Critical Tank Low Level',
      data: {
        alarmType: 'LowTankVolume',
        triggerSource: 'Hardware',
        message: 'Tank 1 has reached critically low level',
        description: 'Tank volume has dropped below critical threshold of 100L',
        severity: 'High',
        priority: 'Critical',
        thresholdValue: 100,
        actualValue: 85,
        unit: 'Liters',
        autoResolveMinutes: 30
      }
    },
    {
      name: 'Device Disconnection',
      data: {
        alarmType: 'DeviceDisconnection',
        triggerSource: 'System',
        message: 'PTS Device PTS001 has disconnected',
        description: 'Communication lost with PTS device for over 5 minutes',
        severity: 'Medium',
        priority: 'High',
        ptsDeviceId: 'PTS001',
        autoResolveMinutes: 15
      }
    },
    {
      name: 'Fuel Discrepancy',
      data: {
        alarmType: 'DiscrepancyDetected',
        triggerSource: 'Policy',
        message: 'Significant fuel discrepancy detected',
        description: 'Reconciliation shows 15L discrepancy in Tank 2',
        severity: 'Medium',
        priority: 'Medium',
        thresholdValue: 10,
        actualValue: 15,
        unit: 'Liters',
        autoResolveMinutes: 60
      }
    },
    {
      name: 'System Alert',
      data: {
        alarmType: 'SystemAlert',
        triggerSource: 'System',
        message: 'System maintenance required',
        description: 'Routine system maintenance window approaching',
        severity: 'Low',
        priority: 'Low',
        autoResolveMinutes: 0
      }
    }
  ];

  useEffect(() => {
    // Load current statistics
    dispatch(fetchAlarmStatistics());

    // Set up SignalR listeners for testing
    const setupSignalRListeners = () => {
      if (SignalRService.connection) {
        // Listen for alarm-related SignalR events
        SignalRService.connection.on('ActiveAlarmCreated', (alarm) => {
          console.log('SignalR: Active alarm created', alarm);
          setTestResults(prev => ({
            ...prev,
            signalRReceived: true
          }));
        });

        SignalRService.connection.on('ActiveAlarmUpdated', (alarm) => {
          console.log('SignalR: Active alarm updated', alarm);
        });

        SignalRService.connection.on('NotificationCreated', (notification) => {
          console.log('SignalR: Notification created', notification);
          setTestResults(prev => ({
            ...prev,
            notificationSent: true
          }));
        });
      }
    };

    setupSignalRListeners();

    return () => {
      // Cleanup SignalR listeners
      if (SignalRService.connection) {
        SignalRService.connection.off('ActiveAlarmCreated');
        SignalRService.connection.off('ActiveAlarmUpdated');
        SignalRService.connection.off('NotificationCreated');
      }
    };
  }, [dispatch]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleScenarioSelect = (scenario) => {
    setFormData(prev => ({
      ...prev,
      ...scenario.data
    }));
  };

  const resetTestResults = () => {
    setTestResults({
      alarmCreated: false,
      notificationSent: false,
      signalRReceived: false,
      errors: []
    });
    setGeneratedAlarmId(null);
  };

  const generateTestAlarm = async () => {
    setIsGenerating(true);
    resetTestResults();

    try {
      // Step 1: Create the alarm
      console.log('Creating test alarm...', formData);
      const result = await dispatch(createTestAlarm(formData));

      if (result.success) {
        setTestResults(prev => ({
          ...prev,
          alarmCreated: true
        }));
        setGeneratedAlarmId(result.data?.activeAlarm?.id);

        // Step 2: Create a test notification if enabled
        if (formData.createNotification && !formData.suppressNotifications) {
          const notificationData = {
            type: 'alarm',
            title: 'New Active Alarm',
            message: formData.message,
            priority: formData.priority.toLowerCase(),
            relatedId: result.data?.activeAlarm?.id,
            timestamp: Date.now(),
            autoExpire: true,
            expireAfter: 30000 // 30 seconds
          };

          dispatch(addNotification(notificationData));

          setTestResults(prev => ({
            ...prev,
            notificationSent: true
          }));
        }

        // Step 3: Test SignalR broadcast (if connected)
        if (SignalRService.connection && isConnected) {
          try {
            await dispatch(testSignalRBroadcast('Test alarm SignalR broadcast'));
          } catch (signalRError) {
            console.warn('SignalR broadcast failed:', signalRError);
            setTestResults(prev => ({
              ...prev,
              errors: [...prev.errors, 'SignalR broadcast failed']
            }));
          }
        }

      } else {
        setTestResults(prev => ({
          ...prev,
          errors: [...prev.errors, 'Failed to create alarm']
        }));
      }

    } catch (error) {
      console.error('Error generating test alarm:', error);
      setTestResults(prev => ({
        ...prev,
        errors: [...prev.errors, error.message || 'Unknown error occurred']
      }));
    } finally {
      setIsGenerating(false);
    }
  };

  const testSignalRConnection = async () => {
    try {
      console.log('Testing SignalR connection...');

      if (!SignalRService.connection) {
        await SignalRService.startConnection();
      }

      if (SignalRService.connection) {
        const result = await SignalRService.connection.invoke('HealthCheck');
        console.log('SignalR health check result:', result);

        dispatch(addNotification({
          type: 'success',
          title: 'SignalR Test',
          message: 'SignalR connection test successful',
          timestamp: Date.now(),
          autoExpire: true,
          expireAfter: 5000
        }));
      }
    } catch (error) {
      console.error('SignalR test failed:', error);
      dispatch(addNotification({
        type: 'error',
        title: 'SignalR Test Failed',
        message: error.message || 'SignalR connection test failed',
        timestamp: Date.now(),
        autoExpire: true,
        expireAfter: 5000
      }));
    }
  };

  const viewGeneratedAlarm = () => {
    if (generatedAlarmId) {
      navigate(`/active-alarms/details/${generatedAlarmId}`);
    }
  };

  const viewNotifications = () => {
    // Toggle notification center or navigate to notifications page
    dispatch(addNotification({
      type: 'info',
      title: 'Notification Center',
      message: 'Check the notification bell in the top-right corner',
      timestamp: Date.now(),
      autoExpire: true,
      expireAfter: 3000
    }));
  };

  return (
    <div className="test-alarm-generator">
      <div className="tw-container tw-mx-auto tw-p-6">
        {/* Header */}
        <div className="tw-mb-6">
          <h1 className="tw-text-2xl tw-font-bold tw-text-gray-900 tw-mb-2">
            Test Alarm Generator
          </h1>
          <p className="tw-text-gray-600">
            Generate test alarms to verify end-to-end functionality: Alarm → Notification → SignalR
          </p>
        </div>

        <div className="tw-grid tw-grid-cols-1 xl:tw-grid-cols-3 tw-gap-6">
          {/* Test Scenarios */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
            <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Quick Test Scenarios</h2>
            <div className="tw-space-y-3">
              {testScenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => handleScenarioSelect(scenario)}
                  className="tw-w-full tw-text-left tw-p-3 tw-border tw-border-gray-200 tw-rounded hover:tw-bg-gray-50 tw-transition-colors"
                >
                  <div className="tw-font-medium tw-text-gray-900">{scenario.name}</div>
                  <div className="tw-text-sm tw-text-gray-500">
                    {scenario.data.alarmType} - {scenario.data.priority}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Alarm Form */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
            <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Alarm Configuration</h2>
            <div className="tw-space-y-4">
              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Alarm Type
                </label>
                <select
                  value={formData.alarmType}
                  onChange={(e) => handleInputChange('alarmType', e.target.value)}
                  className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                >
                  <option value="TestAlarm">Test Alarm</option>
                  <option value="LowTankVolume">Low Tank Volume</option>
                  <option value="DeviceDisconnection">Device Disconnection</option>
                  <option value="DiscrepancyDetected">Discrepancy Detected</option>
                  <option value="SystemAlert">System Alert</option>
                </select>
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Priority
                </label>
                <select
                  value={formData.priority}
                  onChange={(e) => handleInputChange('priority', e.target.value)}
                  className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Message
                </label>
                <input
                  type="text"
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                  placeholder="Alarm message"
                />
              </div>

              <div>
                <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2 tw-h-20"
                  placeholder="Detailed description"
                />
              </div>

              <div className="tw-grid tw-grid-cols-2 tw-gap-3">
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Threshold Value
                  </label>
                  <input
                    type="number"
                    value={formData.thresholdValue || ''}
                    onChange={(e) => handleInputChange('thresholdValue', parseFloat(e.target.value) || null)}
                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                    placeholder="Threshold"
                  />
                </div>
                <div>
                  <label className="tw-block tw-text-sm tw-font-medium tw-text-gray-700 tw-mb-1">
                    Actual Value
                  </label>
                  <input
                    type="number"
                    value={formData.actualValue || ''}
                    onChange={(e) => handleInputChange('actualValue', parseFloat(e.target.value) || null)}
                    className="tw-w-full tw-border tw-border-gray-300 tw-rounded tw-px-3 tw-py-2"
                    placeholder="Actual"
                  />
                </div>
              </div>

              <div className="tw-flex tw-items-center tw-space-x-4">
                <label className="tw-flex tw-items-center">
                  <input
                    type="checkbox"
                    checked={formData.createNotification}
                    onChange={(e) => handleInputChange('createNotification', e.target.checked)}
                    className="tw-mr-2"
                  />
                  <span className="tw-text-sm">Create Notification</span>
                </label>
                <label className="tw-flex tw-items-center">
                  <input
                    type="checkbox"
                    checked={formData.suppressNotifications}
                    onChange={(e) => handleInputChange('suppressNotifications', e.target.checked)}
                    className="tw-mr-2"
                  />
                  <span className="tw-text-sm">Suppress Notifications</span>
                </label>
              </div>
            </div>
          </div>

          {/* Test Results & Actions */}
          <div className="tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
            <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Test Results</h2>

            {/* Connection Status */}
            <div className="tw-mb-4 tw-p-3 tw-border tw-rounded">
              <div className="tw-flex tw-items-center tw-justify-between">
                <span className="tw-text-sm tw-font-medium">SignalR Status:</span>
                <span className={`tw-text-sm ${isConnected ? 'tw-text-green-600' : 'tw-text-red-600'}`}>
                  {isConnected ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>

            {/* Test Progress */}
            <div className="tw-space-y-2 tw-mb-4">
              <div className="tw-flex tw-items-center">
                <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-mr-3 ${
                  testResults.alarmCreated ? 'tw-bg-green-500' : 'tw-bg-gray-300'
                }`}></div>
                <span className="tw-text-sm">Alarm Created</span>
              </div>
              <div className="tw-flex tw-items-center">
                <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-mr-3 ${
                  testResults.notificationSent ? 'tw-bg-green-500' : 'tw-bg-gray-300'
                }`}></div>
                <span className="tw-text-sm">Notification Sent</span>
              </div>
              <div className="tw-flex tw-items-center">
                <div className={`tw-w-4 tw-h-4 tw-rounded-full tw-mr-3 ${
                  testResults.signalRReceived ? 'tw-bg-green-500' : 'tw-bg-gray-300'
                }`}></div>
                <span className="tw-text-sm">SignalR Received</span>
              </div>
            </div>

            {/* Errors */}
            {testResults.errors.length > 0 && (
              <div className="tw-mb-4 tw-p-3 tw-bg-red-50 tw-border tw-border-red-200 tw-rounded">
                <h4 className="tw-text-sm tw-font-medium tw-text-red-800 tw-mb-2">Errors:</h4>
                <ul className="tw-text-sm tw-text-red-700">
                  {testResults.errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="tw-space-y-3">
              <button
                onClick={generateTestAlarm}
                disabled={isGenerating || loading}
                className="tw-w-full tw-bg-blue-600 tw-text-white tw-py-2 tw-px-4 tw-rounded hover:tw-bg-blue-700 disabled:tw-opacity-50"
              >
                {isGenerating ? 'Generating...' : 'Generate Test Alarm'}
              </button>

              <button
                onClick={testSignalRConnection}
                className="tw-w-full tw-bg-green-600 tw-text-white tw-py-2 tw-px-4 tw-rounded hover:tw-bg-green-700"
              >
                Test SignalR Connection
              </button>

              <div className="tw-grid tw-grid-cols-2 tw-gap-2">
                <button
                  onClick={viewGeneratedAlarm}
                  disabled={!generatedAlarmId}
                  className="tw-bg-gray-600 tw-text-white tw-py-2 tw-px-3 tw-rounded hover:tw-bg-gray-700 disabled:tw-opacity-50 tw-text-sm"
                >
                  View Alarm
                </button>
                <button
                  onClick={viewNotifications}
                  className="tw-bg-purple-600 tw-text-white tw-py-2 tw-px-3 tw-rounded hover:tw-bg-purple-700 tw-text-sm"
                >
                  Notifications
                </button>
              </div>

              <button
                onClick={resetTestResults}
                className="tw-w-full tw-bg-gray-300 tw-text-gray-700 tw-py-2 tw-px-4 tw-rounded hover:tw-bg-gray-400 tw-text-sm"
              >
                Reset Test Results
              </button>
            </div>
          </div>
        </div>

        {/* Current Statistics */}
        {statistics && (
          <div className="tw-mt-6 tw-bg-white tw-rounded-lg tw-shadow tw-p-6">
            <h2 className="tw-text-lg tw-font-semibold tw-mb-4">Current Alarm Statistics</h2>
            <div className="tw-grid tw-grid-cols-2 md:tw-grid-cols-4 tw-gap-4">
              <div className="tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{statistics.totalActive}</div>
                <div className="tw-text-sm tw-text-gray-600">Total Active</div>
              </div>
              <div className="tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-red-600">{statistics.critical}</div>
                <div className="tw-text-sm tw-text-gray-600">Critical</div>
              </div>
              <div className="tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-yellow-600">{statistics.unacknowledged}</div>
                <div className="tw-text-sm tw-text-gray-600">Unacknowledged</div>
              </div>
              <div className="tw-text-center">
                <div className="tw-text-2xl tw-font-bold tw-text-green-600">{statistics.resolvedToday}</div>
                <div className="tw-text-sm tw-text-gray-600">Resolved Today</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TestAlarmGenerator;
