/**
 * ServiceMigrationDemo - Demonstration of Vehicle and User Services
 *
 * This component demonstrates the new enterprise service architecture
 * for both Vehicle and User Management services, showing how they work
 * together with consistent patterns.
 *
 * @version 1.0.0
 * @since API v1
 */

import React, { useState, useEffect } from 'react';
import serviceFactory from '../core';

const ServiceMigrationDemo = () => {
  const [vehicles, setVehicles] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [activeTab, setActiveTab] = useState('vehicles');

  // Get service instances
  const vehicleService = serviceFactory.getVehicleService();
  const userService = serviceFactory.getUserManagementService();

  // Clear messages after a delay
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  // ===========================================
  // VEHICLE OPERATIONS
  // ===========================================

  const fetchVehicles = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await vehicleService.fetchVehicles({ siteId: 1 });

      if (response.success) {
        setVehicles(response.data || []);
        setSuccess(`Loaded ${response.data?.length || 0} vehicles`);
        console.log('✅ Vehicles fetched:', response.data);
      } else {
        setError(`Failed to load vehicles: ${response.message}`);
        console.error('❌ Vehicles error:', response);
      }
    } catch (error) {
      setError('Unexpected error occurred');
      console.error('💥 Exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchVehicles = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.quickSearchVehicles('H', 5);

      if (response.success) {
        setVehicles(response.data || []);
        setSuccess(`Found ${response.data?.length || 0} vehicles`);
      } else {
        setError(`Search failed: ${response.message}`);
      }
    } catch (error) {
      setError('Search error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchVehicleDetails = async (vehicleId) => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleById(vehicleId);

      if (response.success) {
        setSelectedVehicle(response.data);
        setSuccess('Vehicle details loaded');
        console.log('✅ Vehicle details:', response.data);
      } else {
        setError(`Failed to load vehicle: ${response.message}`);
      }
    } catch (error) {
      setError('Error loading vehicle details');
    } finally {
      setLoading(false);
    }
  };

  const createSampleVehicle = async () => {
    try {
      setLoading(true);
      const response = await vehicleService.createVehicle({
        hyoungNo: `H${Date.now()}`,
        numberPlate: `ABC-${Math.floor(Math.random() * 1000)}`,
        vehicleTypeId: 1,
        status: 'Active'
      });

      if (response.success) {
        setSuccess('Sample vehicle created');
        await fetchVehicles(); // Refresh list
      } else {
        setError(`Failed to create vehicle: ${response.message}`);
      }
    } catch (error) {
      setError('Error creating vehicle');
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // USER OPERATIONS
  // ===========================================

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.fetchUsers();

      if (response.success) {
        setUsers(response.data || []);
        setSuccess(`Loaded ${response.data?.length || 0} users`);
        console.log('✅ Users fetched:', response.data);
      } else {
        setError(`Failed to load users: ${response.message}`);
        console.error('❌ Users error:', response);
      }
    } catch (error) {
      setError('Unexpected error occurred');
      console.error('💥 Exception:', error);
    } finally {
      setLoading(false);
    }
  };

  const searchUsers = async () => {
    try {
      setLoading(true);
      const response = await userService.searchUsers('admin', { limit: 5 });

      if (response.success) {
        setUsers(response.data || []);
        setSuccess(`Found ${response.data?.length || 0} users`);
      } else {
        setError(`Search failed: ${response.message}`);
      }
    } catch (error) {
      setError('Search error occurred');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserDetails = async (userId) => {
    try {
      setLoading(true);
      const response = await userService.fetchUserById(userId);

      if (response.success) {
        setSelectedUser(response.data);
        setSuccess('User details loaded');
        console.log('✅ User details:', response.data);
      } else {
        setError(`Failed to load user: ${response.message}`);
      }
    } catch (error) {
      setError('Error loading user details');
    } finally {
      setLoading(false);
    }
  };

  const createSampleUser = async () => {
    try {
      setLoading(true);
      const timestamp = Date.now();
      const response = await userService.createUser({
        username: `demo_user_${timestamp}`,
        email: `demo_${timestamp}@example.com`,
        firstName: 'Demo',
        lastName: 'User',
        isActive: true
      });

      if (response.success) {
        setSuccess('Sample user created');
        await fetchUsers(); // Refresh list
      } else {
        setError(`Failed to create user: ${response.message}`);
        if (response.errors && response.errors.length > 0) {
          console.error('Validation errors:', response.errors);
        }
      }
    } catch (error) {
      setError('Error creating user');
    } finally {
      setLoading(false);
    }
  };

  // ===========================================
  // SERVICE HEALTH CHECKS
  // ===========================================

  const checkServiceHealth = async () => {
    try {
      const [vehicleHealth, userHealth] = await Promise.all([
        vehicleService.healthCheck(),
        userService.healthCheck()
      ]);

      console.log('🏥 Vehicle service health:', vehicleHealth);
      console.log('🏥 User service health:', userHealth);

      if (vehicleHealth.status === 'healthy' && userHealth.status === 'healthy') {
        setSuccess('All services are healthy');
      } else {
        setError('Some services are experiencing issues');
      }
    } catch (error) {
      setError('Health check failed');
      console.error('💥 Health check exception:', error);
    }
  };

  // ===========================================
  // COMPONENT LIFECYCLE
  // ===========================================

  useEffect(() => {
    console.log('🚀 ServiceMigrationDemo mounted');
    if (activeTab === 'vehicles') {
      fetchVehicles();
    } else {
      fetchUsers();
    }
  }, [activeTab]); // eslint-disable-line react-hooks/exhaustive-deps

  // ===========================================
  // RENDER
  // ===========================================

  return (
    <div className="tw-p-6 tw-bg-white tw-rounded-lg tw-shadow-md">
      <h2 className="tw-text-2xl tw-font-bold tw-mb-6 tw-text-gray-800">
        <i className="fa-light fa-cogs tw-mr-3"></i>
        Service Migration Demo - Vehicle & User Services
      </h2>

      {/* Status Messages */}
      {loading && (
        <div className="tw-bg-blue-50 tw-border tw-border-blue-200 tw-rounded tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-spinner fa-spin tw-mr-2 tw-text-blue-600"></i>
            <span className="tw-text-blue-800">Loading...</span>
          </div>
        </div>
      )}

      {error && (
        <div className="tw-bg-red-50 tw-border tw-border-red-200 tw-rounded tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-exclamation-triangle tw-mr-2 tw-text-red-600"></i>
            <span className="tw-text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="tw-bg-green-50 tw-border tw-border-green-200 tw-rounded tw-p-4 tw-mb-4">
          <div className="tw-flex tw-items-center">
            <i className="fa-light fa-check-circle tw-mr-2 tw-text-green-600"></i>
            <span className="tw-text-green-800">{success}</span>
          </div>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="tw-flex tw-mb-6 tw-border-b">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`tw-px-4 tw-py-2 tw-font-medium tw-border-b-2 ${
            activeTab === 'vehicles'
              ? 'tw-border-blue-500 tw-text-blue-600'
              : 'tw-border-transparent tw-text-gray-500 tw-hover:tw-text-gray-700'
          }`}
        >
          <i className="fa-light fa-car tw-mr-2"></i>
          Vehicles
        </button>
        <button
          onClick={() => setActiveTab('users')}
          className={`tw-px-4 tw-py-2 tw-font-medium tw-border-b-2 ${
            activeTab === 'users'
              ? 'tw-border-blue-500 tw-text-blue-600'
              : 'tw-border-transparent tw-text-gray-500 tw-hover:tw-text-gray-700'
          }`}
        >
          <i className="fa-light fa-users tw-mr-2"></i>
          Users
        </button>
      </div>

      {/* Vehicle Tab */}
      {activeTab === 'vehicles' && (
        <div>
          <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
            <button
              onClick={fetchVehicles}
              disabled={loading}
              className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-blue-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-refresh tw-mr-2"></i>
              Fetch Vehicles
            </button>

            <button
              onClick={searchVehicles}
              disabled={loading}
              className="tw-bg-purple-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-purple-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-search tw-mr-2"></i>
              Search 'H'
            </button>

            <button
              onClick={createSampleVehicle}
              disabled={loading}
              className="tw-bg-green-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-green-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-plus tw-mr-2"></i>
              Create Sample
            </button>

            <button
              onClick={checkServiceHealth}
              disabled={loading}
              className="tw-bg-gray-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-gray-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-heartbeat tw-mr-2"></i>
              Health Check
            </button>
          </div>

          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
            <div className="tw-border tw-rounded tw-p-4">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-3">
                Vehicles ({vehicles.length})
              </h3>
              {vehicles.length > 0 ? (
                <div className="tw-space-y-2 tw-max-h-64 tw-overflow-y-auto">
                  {vehicles.map((vehicle, index) => (
                    <div
                      key={index}
                      className="tw-bg-gray-50 tw-p-2 tw-rounded tw-cursor-pointer tw-hover:tw-bg-gray-100"
                      onClick={() => vehicle.vehicleId && fetchVehicleDetails(vehicle.vehicleId)}
                    >
                      <div className="tw-text-sm tw-font-medium">
                        {vehicle.hyoungNo || 'N/A'} - {vehicle.numberPlate || 'N/A'}
                      </div>
                      <div className="tw-text-xs tw-text-gray-600">
                        {vehicle.vehicleTypeName || 'Unknown Type'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tw-text-gray-500 tw-italic">No vehicles loaded</div>
              )}
            </div>

            <div className="tw-border tw-rounded tw-p-4">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-3">
                Selected Vehicle Details
              </h3>
              {selectedVehicle ? (
                <div className="tw-space-y-2">
                  <div><strong>ID:</strong> {selectedVehicle.vehicleId}</div>
                  <div><strong>Hyoung No:</strong> {selectedVehicle.hyoungNo}</div>
                  <div><strong>Number Plate:</strong> {selectedVehicle.numberPlate}</div>
                  <div><strong>Type:</strong> {selectedVehicle.vehicleTypeName}</div>
                  <div><strong>Status:</strong> {selectedVehicle.status}</div>
                </div>
              ) : (
                <div className="tw-text-gray-500 tw-italic">Click a vehicle to see details</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* User Tab */}
      {activeTab === 'users' && (
        <div>
          <div className="tw-grid tw-grid-cols-2 lg:tw-grid-cols-4 tw-gap-4 tw-mb-6">
            <button
              onClick={fetchUsers}
              disabled={loading}
              className="tw-bg-blue-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-blue-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-refresh tw-mr-2"></i>
              Fetch Users
            </button>

            <button
              onClick={searchUsers}
              disabled={loading}
              className="tw-bg-purple-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-purple-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-search tw-mr-2"></i>
              Search 'admin'
            </button>

            <button
              onClick={createSampleUser}
              disabled={loading}
              className="tw-bg-green-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-green-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-plus tw-mr-2"></i>
              Create Sample
            </button>

            <button
              onClick={checkServiceHealth}
              disabled={loading}
              className="tw-bg-gray-500 tw-text-white tw-px-4 tw-py-2 tw-rounded tw-hover:tw-bg-gray-600 tw-disabled:tw-opacity-50"
            >
              <i className="fa-light fa-heartbeat tw-mr-2"></i>
              Health Check
            </button>
          </div>

          <div className="tw-grid tw-grid-cols-1 lg:tw-grid-cols-2 tw-gap-6">
            <div className="tw-border tw-rounded tw-p-4">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-3">
                Users ({users.length})
              </h3>
              {users.length > 0 ? (
                <div className="tw-space-y-2 tw-max-h-64 tw-overflow-y-auto">
                  {users.map((user, index) => (
                    <div
                      key={index}
                      className="tw-bg-gray-50 tw-p-2 tw-rounded tw-cursor-pointer tw-hover:tw-bg-gray-100"
                      onClick={() => user.id && fetchUserDetails(user.id)}
                    >
                      <div className="tw-text-sm tw-font-medium">
                        {user.username || 'N/A'} - {user.firstName} {user.lastName}
                      </div>
                      <div className="tw-text-xs tw-text-gray-600">
                        {user.email || 'No email'}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="tw-text-gray-500 tw-italic">No users loaded</div>
              )}
            </div>

            <div className="tw-border tw-rounded tw-p-4">
              <h3 className="tw-text-lg tw-font-semibold tw-mb-3">
                Selected User Details
              </h3>
              {selectedUser ? (
                <div className="tw-space-y-2">
                  <div><strong>ID:</strong> {selectedUser.id}</div>
                  <div><strong>Username:</strong> {selectedUser.username}</div>
                  <div><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</div>
                  <div><strong>Email:</strong> {selectedUser.email}</div>
                  <div><strong>Status:</strong> {selectedUser.isActive ? 'Active' : 'Inactive'}</div>
                </div>
              ) : (
                <div className="tw-text-gray-500 tw-italic">Click a user to see details</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Service Info */}
      <div className="tw-mt-6 tw-border-t tw-pt-4">
        <div className="tw-text-sm tw-text-gray-600">
          <p>✅ Using {activeTab === 'vehicles' ? 'Vehicle' : 'User'}Service with v1 API endpoints</p>
          <p>✅ FMSResponse&lt;T&gt; format handling</p>
          <p>✅ Automatic error handling and retry logic</p>
          <p>✅ Built-in caching and performance optimization</p>
          <p>✅ Enterprise service patterns with ServiceFactory</p>
        </div>
      </div>
    </div>
  );
};

export default ServiceMigrationDemo;