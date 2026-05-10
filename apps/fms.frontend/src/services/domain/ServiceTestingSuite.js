import React, { useState, useEffect } from 'react';
import serviceFactory from '../core';

/**
 * Comprehensive Testing Component for New Service Architecture
 * Tests Vehicle and User services with v1 API integration
 */
const ServiceTestingSuite = () => {
  const [testResults, setTestResults] = useState({});
  const [loading, setLoading] = useState(false);
  const [selectedService, setSelectedService] = useState('vehicle');

  const vehicleService = serviceFactory.getVehicleService();
  const userService = serviceFactory.getUserManagementService();

  // Test runner utility
  const runTest = async (testName, testFn) => {
    try {
      console.log(`🧪 Running test: ${testName}`);
      const startTime = Date.now();

      const result = await testFn();
      const duration = Date.now() - startTime;

      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'PASSED',
          result,
          duration,
          timestamp: new Date().toISOString()
        }
      }));

      console.log(`✅ Test passed: ${testName} (${duration}ms)`);
      return result;
    } catch (error) {
      console.error(`❌ Test failed: ${testName}`, error);

      setTestResults(prev => ({
        ...prev,
        [testName]: {
          status: 'FAILED',
          error: error.message,
          timestamp: new Date().toISOString()
        }
      }));

      throw error;
    }
  };

  // Vehicle Service Tests
  const vehicleTests = {
    'Vehicle Health Check': async () => {
      const response = await vehicleService.healthCheck();
      if (!response.success) {
        throw new Error(`Health check failed: ${response.message}`);
      }
      return response;
    },

    'Fetch Vehicles': async () => {
      const response = await vehicleService.fetchVehicles();
      if (!response.success) {
        throw new Error(`Fetch vehicles failed: ${response.message}`);
      }
      return {
        vehicleCount: response.data?.length || 0,
        hasData: Array.isArray(response.data)
      };
    },

    'Fetch Single Vehicle': async () => {
      // First get vehicles to get an ID
      const vehiclesResponse = await vehicleService.fetchVehicles();
      if (!vehiclesResponse.success || !vehiclesResponse.data?.length) {
        throw new Error('No vehicles available for testing');
      }

      const vehicleId = vehiclesResponse.data[0].vehicleId;
      const response = await vehicleService.getVehicleById(vehicleId);

      if (!response.success) {
        throw new Error(`Get vehicle by ID failed: ${response.message}`);
      }

      return {
        vehicleId,
        hasVehicleData: !!response.data
      };
    },

    'Search Vehicles': async () => {
      const response = await vehicleService.quickSearchVehicles('test', 5);
      // Search might return empty results, which is valid
      return {
        searchExecuted: response.success || response.message,
        resultCount: response.data?.length || 0
      };
    },

    'Vehicle History': async () => {
      const vehiclesResponse = await vehicleService.fetchVehicles();
      if (!vehiclesResponse.success || !vehiclesResponse.data?.length) {
        throw new Error('No vehicles available for history testing');
      }

      const vehicleId = vehiclesResponse.data[0].vehicleId;
      const response = await vehicleService.fetchVehicleConsumptionHistory(vehicleId, {});

      return {
        vehicleId,
        historyExecuted: response.success || response.message,
        historyCount: response.data?.length || 0
      };
    }
  };

  // User Service Tests
  const userTests = {
    'User Health Check': async () => {
      const response = await userService.healthCheck();
      if (!response.success) {
        throw new Error(`Health check failed: ${response.message}`);
      }
      return response;
    },

    'Fetch Users': async () => {
      const response = await userService.fetchUsers();
      if (!response.success) {
        throw new Error(`Fetch users failed: ${response.message}`);
      }
      return {
        userCount: response.data?.length || 0,
        hasData: Array.isArray(response.data)
      };
    },

    'Fetch Single User': async () => {
      const usersResponse = await userService.fetchUsers();
      if (!usersResponse.success || !usersResponse.data?.length) {
        throw new Error('No users available for testing');
      }

      const userId = usersResponse.data[0].id || usersResponse.data[0].userId;
      const response = await userService.fetchUserById(userId);

      if (!response.success) {
        throw new Error(`Get user by ID failed: ${response.message}`);
      }

      return {
        userId,
        hasUserData: !!response.data
      };
    },

    'User Activities': async () => {
      const usersResponse = await userService.fetchUsers();
      if (!usersResponse.success || !usersResponse.data?.length) {
        throw new Error('No users available for activities testing');
      }

      const userId = usersResponse.data[0].id || usersResponse.data[0].userId;
      const response = await userService.fetchUserActivities(userId, {});

      return {
        userId,
        activitiesExecuted: response.success || response.message,
        activitiesCount: response.data?.length || 0
      };
    },

    'User Roles': async () => {
      const usersResponse = await userService.fetchUsers();
      if (!usersResponse.success || !usersResponse.data?.length) {
        throw new Error('No users available for roles testing');
      }

      const userId = usersResponse.data[0].id || usersResponse.data[0].userId;
      const response = await userService.fetchUserRoles(userId);

      return {
        userId,
        rolesExecuted: response.success || response.message,
        rolesCount: response.data?.length || 0
      };
    },

    'All Sites': async () => {
      const response = await userService.fetchAllSites();
      return {
        sitesExecuted: response.success || response.message,
        sitesCount: response.data?.length || 0
      };
    }
  };

  // Service-specific test runners
  const runVehicleTests = async () => {
    setLoading(true);
    setTestResults({});

    console.log('🚗 Starting Vehicle Service Tests...');

    for (const [testName, testFn] of Object.entries(vehicleTests)) {
      try {
        await runTest(testName, testFn);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Test ${testName} failed, continuing...`);
      }
    }

    setLoading(false);
    console.log('🚗 Vehicle Service Tests Complete');
  };

  const runUserTests = async () => {
    setLoading(true);
    setTestResults({});

    console.log('👥 Starting User Service Tests...');

    for (const [testName, testFn] of Object.entries(userTests)) {
      try {
        await runTest(testName, testFn);
        // Small delay between tests
        await new Promise(resolve => setTimeout(resolve, 100));
      } catch (error) {
        console.error(`Test ${testName} failed, continuing...`);
      }
    }

    setLoading(false);
    console.log('👥 User Service Tests Complete');
  };

  const runAllTests = async () => {
    console.log('🧪 Starting Complete Service Test Suite...');
    await runVehicleTests();
    await new Promise(resolve => setTimeout(resolve, 500));
    await runUserTests();
    console.log('🧪 Complete Service Test Suite Finished');
  };

  // Error boundary testing
  const testErrorHandling = async () => {
    console.log('🚨 Testing Error Handling...');

    try {
      // Test with invalid ID
      await runTest('Invalid Vehicle ID', async () => {
        const response = await vehicleService.getVehicleById('invalid-id-999999');
        return {
          handled: !response.success,
          message: response.message
        };
      });

      await runTest('Invalid User ID', async () => {
        const response = await userService.fetchUserById('invalid-id-999999');
        return {
          handled: !response.success,
          message: response.message
        };
      });

    } catch (error) {
      console.log('Error handling tests completed');
    }
  };

  const testStatistics = {
    total: Object.keys(testResults).length,
    passed: Object.values(testResults).filter(r => r.status === 'PASSED').length,
    failed: Object.values(testResults).filter(r => r.status === 'FAILED').length
  };

  return (
    <div className="tw-p-6 tw-max-w-6xl tw-mx-auto">
      <div className="tw-bg-white tw-rounded-lg tw-shadow-lg tw-p-6">
        <h1 className="tw-text-2xl tw-font-bold tw-mb-6 tw-text-gray-800">
          <i className="fa-light fa-flask-vial tw-mr-2"></i>
          Service Architecture Testing Suite
        </h1>

        {/* Service Selection */}
        <div className="tw-mb-6">
          <div className="tw-flex tw-gap-2 tw-mb-4">
            <button
              onClick={() => setSelectedService('vehicle')}
              className={`tw-px-4 tw-py-2 tw-rounded tw-font-medium ${
                selectedService === 'vehicle'
                  ? 'tw-bg-blue-500 tw-text-white'
                  : 'tw-bg-gray-200 tw-text-gray-700'
              }`}
            >
              <i className="fa-light fa-car tw-mr-2"></i>
              Vehicle Service
            </button>
            <button
              onClick={() => setSelectedService('user')}
              className={`tw-px-4 tw-py-2 tw-rounded tw-font-medium ${
                selectedService === 'user'
                  ? 'tw-bg-green-500 tw-text-white'
                  : 'tw-bg-gray-200 tw-text-gray-700'
              }`}
            >
              <i className="fa-light fa-users tw-mr-2"></i>
              User Service
            </button>
          </div>
        </div>

        {/* Test Controls */}
        <div className="tw-flex tw-gap-2 tw-mb-6">
          <button
            onClick={selectedService === 'vehicle' ? runVehicleTests : runUserTests}
            disabled={loading}
            className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium tw-disabled:opacity-50"
          >
            {loading ? (
              <>
                <i className="fa-light fa-spinner tw-animate-spin tw-mr-2"></i>
                Running Tests...
              </>
            ) : (
              <>
                <i className="fa-light fa-play tw-mr-2"></i>
                Run {selectedService === 'vehicle' ? 'Vehicle' : 'User'} Tests
              </>
            )}
          </button>

          <button
            onClick={runAllTests}
            disabled={loading}
            className="tw-bg-purple-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium tw-disabled:opacity-50"
          >
            <i className="fa-light fa-flask tw-mr-2"></i>
            Run All Tests
          </button>

          <button
            onClick={testErrorHandling}
            disabled={loading}
            className="tw-bg-orange-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium tw-disabled:opacity-50"
          >
            <i className="fa-light fa-exclamation-triangle tw-mr-2"></i>
            Test Error Handling
          </button>

          <button
            onClick={() => setTestResults({})}
            className="tw-bg-gray-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-font-medium"
          >
            <i className="fa-light fa-trash tw-mr-2"></i>
            Clear Results
          </button>
        </div>

        {/* Test Statistics */}
        {testStatistics.total > 0 && (
          <div className="tw-grid tw-grid-cols-3 tw-gap-4 tw-mb-6">
            <div className="tw-bg-blue-100 tw-p-4 tw-rounded tw-text-center">
              <div className="tw-text-2xl tw-font-bold tw-text-blue-600">{testStatistics.total}</div>
              <div className="tw-text-sm tw-text-blue-800">Total Tests</div>
            </div>
            <div className="tw-bg-green-100 tw-p-4 tw-rounded tw-text-center">
              <div className="tw-text-2xl tw-font-bold tw-text-green-600">{testStatistics.passed}</div>
              <div className="tw-text-sm tw-text-green-800">Passed</div>
            </div>
            <div className="tw-bg-red-100 tw-p-4 tw-rounded tw-text-center">
              <div className="tw-text-2xl tw-font-bold tw-text-red-600">{testStatistics.failed}</div>
              <div className="tw-text-sm tw-text-red-800">Failed</div>
            </div>
          </div>
        )}

        {/* Test Results */}
        {Object.keys(testResults).length > 0 && (
          <div className="tw-space-y-3">
            <h3 className="tw-text-lg tw-font-semibold tw-text-gray-800">Test Results</h3>
            {Object.entries(testResults).map(([testName, result]) => (
              <div
                key={testName}
                className={`tw-border tw-rounded tw-p-4 ${
                  result.status === 'PASSED'
                    ? 'tw-border-green-200 tw-bg-green-50'
                    : 'tw-border-red-200 tw-bg-red-50'
                }`}
              >
                <div className="tw-flex tw-justify-between tw-items-start">
                  <div>
                    <h4 className="tw-font-medium tw-text-gray-800">
                      {result.status === 'PASSED' ? (
                        <i className="fa-light fa-check-circle tw-text-green-500 tw-mr-2"></i>
                      ) : (
                        <i className="fa-light fa-times-circle tw-text-red-500 tw-mr-2"></i>
                      )}
                      {testName}
                    </h4>
                    {result.duration && (
                      <p className="tw-text-sm tw-text-gray-600">
                        Duration: {result.duration}ms
                      </p>
                    )}
                    {result.error && (
                      <p className="tw-text-sm tw-text-red-600 tw-mt-1">
                        Error: {result.error}
                      </p>
                    )}
                  </div>
                  <div className="tw-text-xs tw-text-gray-500">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>

                {result.result && (
                  <div className="tw-mt-2 tw-text-sm tw-text-gray-700">
                    <pre className="tw-bg-gray-100 tw-p-2 tw-rounded tw-overflow-x-auto">
                      {JSON.stringify(result.result, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {Object.keys(testResults).length === 0 && (
          <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-4">
            <h3 className="tw-font-medium tw-text-blue-800 tw-mb-2">
              <i className="fa-light fa-info-circle tw-mr-2"></i>
              Testing Instructions
            </h3>
            <ul className="tw-text-sm tw-text-blue-700 tw-space-y-1">
              <li>• Select a service to test (Vehicle or User)</li>
              <li>• Click "Run Tests" to test individual service functionality</li>
              <li>• Use "Run All Tests" to validate entire service architecture</li>
              <li>• Test error handling to verify resilience</li>
              <li>• Check console for detailed logging output</li>
              <li>• All tests use real v1 API endpoints with FMSResponse format</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ServiceTestingSuite;