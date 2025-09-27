# Complete Service Migration Guide

This guide demonstrates the complete migration from Redux actions to our new enterprise service architecture for Vehicle and User Management services.

## Architecture Overview

### 🏗️ New Service Architecture

```
fms.frontend/src/services/
├── core/
│   ├── BaseService.js          # Enterprise foundation class
│   ├── APIErrorHandler.js      # Standardized error processing
│   ├── ServiceFactory.js       # Dependency injection container
│   └── index.js               # Centralized exports
├── domain/
│   ├── TankStockService.js     # Complete tank stock operations
│   ├── VehicleService.js       # Complete vehicle operations
│   ├── UserManagementService.js # Complete user operations
│   └── ServiceMigrationDemo.js # Working demonstration
└── api/
    └── axiosInstance.js        # Updated with v1 support
```

## Migration Examples

### Vehicle Service Migration

#### OLD Pattern (vehicleActions.js)
```javascript
// OLD WAY - Redux actions
import { fetchVehicleList, getVehicleById, updateVehicle } from '../redux/actions/vehicleActions';

const MyComponent = () => {
  const dispatch = useDispatch();

  const loadVehicles = async () => {
    try {
      const vehicles = await dispatch(fetchVehicleList());
      console.log('Vehicles:', vehicles);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  const loadVehicle = async (id) => {
    try {
      const result = await dispatch(getVehicleById(id));
      if (result.success) {
        console.log('Vehicle:', result.data);
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };
};
```

#### NEW Pattern (VehicleService)
```javascript
// NEW WAY - Service architecture
import serviceFactory from '../services/core';

const MyComponent = () => {
  const vehicleService = serviceFactory.getVehicleService();

  const loadVehicles = async () => {
    try {
      const response = await vehicleService.fetchVehicles();

      if (response.success) {
        console.log('Vehicles:', response.data);
      } else {
        console.error('Error:', response.message);

        // Handle specific error types
        if (response.errorType === 'AUTHENTICATION') {
          // Redirect to login
        } else if (response.errorType === 'AUTHORIZATION') {
          // Show access denied
        }
      }
    } catch (error) {
      console.error('Exception:', error);
    }
  };

  const loadVehicle = async (id) => {
    try {
      const response = await vehicleService.getVehicleById(id);

      if (response.success) {
        console.log('Vehicle:', response.data);
      } else {
        console.error('Error:', response.message);
      }
    } catch (error) {
      console.error('Exception:', error);
    }
  };
};
```

### User Service Migration

#### OLD Pattern (userActions.js)
```javascript
// OLD WAY - Redux actions
import { fetchUsers, fetchUserById, createUser } from '../redux/actions/userActions';

const UserComponent = () => {
  const dispatch = useDispatch();

  const loadUsers = async () => {
    try {
      const users = await dispatch(fetchUsers());
      console.log('Users:', users);
    } catch (error) {
      console.error('Error:', error.message);
    }
  };

  const createNewUser = async (userData) => {
    try {
      const result = await dispatch(createUser(userData));
      // Handle FMSResponse format inconsistencies
      if (result && typeof result === 'object' && 'isSuccess' in result) {
        if (result.isSuccess) {
          console.log('User created');
        } else {
          console.error('Validation errors:', result.validationErrors);
        }
      }
    } catch (error) {
      console.error('Error:', error.message);
    }
  };
};
```

#### NEW Pattern (UserManagementService)
```javascript
// NEW WAY - Service architecture
import serviceFactory from '../services/core';

const UserComponent = () => {
  const userService = serviceFactory.getUserManagementService();

  const loadUsers = async () => {
    try {
      const response = await userService.fetchUsers();

      if (response.success) {
        console.log('Users:', response.data);
      } else {
        console.error('Error:', response.message);
      }
    } catch (error) {
      console.error('Exception:', error);
    }
  };

  const createNewUser = async (userData) => {
    try {
      const response = await userService.createUser(userData);

      if (response.success) {
        console.log('User created:', response.data);
      } else {
        console.error('Error:', response.message);

        // Consistent error handling
        if (response.errors && response.errors.length > 0) {
          response.errors.forEach(error => {
            console.error('Validation error:', error);
          });
        }
      }
    } catch (error) {
      console.error('Exception:', error);
    }
  };
};
```

## Available Service Methods

### VehicleService Methods
```javascript
const vehicleService = serviceFactory.getVehicleService();

// Core operations
await vehicleService.fetchVehicles(filters);
await vehicleService.getVehicleById(vehicleId);
await vehicleService.createVehicle(vehicleData);
await vehicleService.updateVehicle(vehicleId, vehicleData);
await vehicleService.updateVehicles(changes);
await vehicleService.deleteVehicle(vehicleId);

// History operations
await vehicleService.fetchVehicleConsumptionHistory(vehicleId, filters);
await vehicleService.fetchVehicleFuelingHistory(vehicleId, filters);
await vehicleService.fetchVehicleMaintenanceHistory(vehicleId, filters);

// Maintenance operations
await vehicleService.addMaintenanceRecord(vehicleId, maintenanceData);

// Schedule operations
await vehicleService.fetchVehicleSchedules(vehicleId, filters);
await vehicleService.addVehicleSchedule(vehicleId, scheduleData);
await vehicleService.updateVehicleSchedule(vehicleId, scheduleId, scheduleData);
await vehicleService.deleteVehicleSchedule(vehicleId, scheduleId);

// Search operations
await vehicleService.quickSearchVehicles(searchTerm, limit);
await vehicleService.searchVehicles(searchCriteria);

// Health check
await vehicleService.healthCheck();
```

### UserManagementService Methods
```javascript
const userService = serviceFactory.getUserManagementService();

// Core operations
await userService.fetchUsers(filters);
await userService.fetchUserById(userId);
await userService.createUser(userData);
await userService.updateUser(userId, userData);
await userService.softDeleteUser(userId);
await userService.restoreUser(userId);
await userService.deleteUser(userId);

// Activities
await userService.fetchUserActivities(userId, filters);
await userService.fetchAllActivities(filters);

// Sites management
await userService.fetchUserSites(userId);
await userService.updateUserSites(userId, siteIds);
await userService.fetchAllSites();

// Roles and permissions
await userService.fetchUserRoles(userId);
await userService.fetchUserPermissions(userId);
await userService.fetchAllRoles();
await userService.updateUserRoles(userId, roleIds);

// Filter and search
await userService.fetchUsersForFilter(options);
await userService.searchUsers(searchTerm, filters);

// Health check
await userService.healthCheck();
```

## Custom Hook Patterns

### Vehicle Hook
```javascript
import { useState, useEffect, useCallback } from 'react';
import serviceFactory from '../services/core';

export const useVehicle = (filters = {}) => {
  const [vehicles, setVehicles] = useState([]);
  const [selectedVehicle, setSelectedVehicle] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const vehicleService = serviceFactory.getVehicleService();

  const fetchVehicles = useCallback(async (newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await vehicleService.fetchVehicles(newFilters);

      if (response.success) {
        setVehicles(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to fetch vehicles');
    } finally {
      setLoading(false);
    }
  }, [vehicleService, filters]);

  const getVehicleById = useCallback(async (vehicleId) => {
    try {
      setLoading(true);
      const response = await vehicleService.getVehicleById(vehicleId);

      if (response.success) {
        setSelectedVehicle(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      setError('Failed to fetch vehicle');
      return { success: false, message: 'Failed to fetch vehicle' };
    } finally {
      setLoading(false);
    }
  }, [vehicleService]);

  const createVehicle = useCallback(async (vehicleData) => {
    try {
      setLoading(true);
      const response = await vehicleService.createVehicle(vehicleData);

      if (response.success) {
        await fetchVehicles(); // Refresh list
        return { success: true, data: response.data };
      } else {
        return { success: false, message: response.message, errors: response.errors };
      }
    } catch (error) {
      return { success: false, message: 'Failed to create vehicle' };
    } finally {
      setLoading(false);
    }
  }, [vehicleService, fetchVehicles]);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

  return {
    vehicles,
    selectedVehicle,
    loading,
    error,
    fetchVehicles,
    getVehicleById,
    createVehicle,
    clearError: () => setError(null)
  };
};
```

### User Hook
```javascript
import { useState, useEffect, useCallback } from 'react';
import serviceFactory from '../services/core';

export const useUser = (filters = {}) => {
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const userService = serviceFactory.getUserManagementService();

  const fetchUsers = useCallback(async (newFilters = filters) => {
    try {
      setLoading(true);
      setError(null);

      const response = await userService.fetchUsers(newFilters);

      if (response.success) {
        setUsers(response.data);
      } else {
        setError(response.message);
      }
    } catch (error) {
      setError('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [userService, filters]);

  const getUserById = useCallback(async (userId) => {
    try {
      setLoading(true);
      const response = await userService.fetchUserById(userId);

      if (response.success) {
        setSelectedUser(response.data);
        return { success: true, data: response.data };
      } else {
        setError(response.message);
        return { success: false, message: response.message };
      }
    } catch (error) {
      setError('Failed to fetch user');
      return { success: false, message: 'Failed to fetch user' };
    } finally {
      setLoading(false);
    }
  }, [userService]);

  const createUser = useCallback(async (userData) => {
    try {
      setLoading(true);
      const response = await userService.createUser(userData);

      if (response.success) {
        await fetchUsers(); // Refresh list
        return { success: true, data: response.data };
      } else {
        return { success: false, message: response.message, errors: response.errors };
      }
    } catch (error) {
      return { success: false, message: 'Failed to create user' };
    } finally {
      setLoading(false);
    }
  }, [userService, fetchUsers]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    selectedUser,
    loading,
    error,
    fetchUsers,
    getUserById,
    createUser,
    clearError: () => setError(null)
  };
};
```

## Benefits Summary

### ✅ Centralized Architecture
- **ServiceFactory**: Single source of truth for all services
- **BaseService**: Consistent patterns across all domain services
- **APIErrorHandler**: Standardized error processing

### ✅ v1 API Integration
- Automatic `API-Version: v1` headers
- URL path prepending with `/v1/`
- Consistent endpoint handling

### ✅ FMSResponse<T> Format
```javascript
{
  success: boolean,
  data: T | null,
  message: string,
  errors: string[],
  errorType?: string
}
```

### ✅ Enterprise Features
- **Caching**: Configurable TTL, cache invalidation
- **Error Handling**: Retry logic, error type classification
- **Logging**: Development logging, performance metrics
- **Health Checks**: Service monitoring and diagnostics
- **Validation**: Client-side validation before API calls

### ✅ Developer Experience
- **Consistent API**: Same patterns across all services
- **Type Safety**: Clear interfaces and response types
- **Error Messages**: User-friendly error descriptions
- **Performance**: Built-in caching and optimization
- **Testing**: Easy to mock and test services

## Migration Checklist

- [ ] Replace Redux action imports with serviceFactory
- [ ] Remove dispatch calls and use service methods directly
- [ ] Update error handling to use FMSResponse format
- [ ] Add proper loading states and error boundaries
- [ ] Implement caching strategies for frequently accessed data
- [ ] Add validation feedback for user inputs
- [ ] Update unit tests to use service mocks
- [ ] Remove old action and reducer files after migration
- [ ] Update documentation and component examples

This enterprise service architecture provides a robust, scalable, and maintainable foundation for all API interactions in the FMS system.