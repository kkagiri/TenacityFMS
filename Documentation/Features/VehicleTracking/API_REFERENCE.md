# Provider Management API Reference

## 📋 Overview

This document provides complete API documentation for the Provider Management system. All endpoints are RESTful and return JSON responses.

**Base URL**: `http://your-server:7009/api/v1/providers`

**Authentication**: JWT Bearer Token (required for all endpoints)

**Content-Type**: `application/json`

---

## 🔐 Authentication

All API requests require a valid JWT token in the Authorization header:

```http
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Getting a Token**:

```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "your-password"
}
```

**Response**:

```json
{
  "Success": true,
  "Data": {
    "Token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "ExpiresAt": "2025-10-28T10:00:00Z"
  }
}
```

---

## 📊 Response Format

All endpoints follow a consistent response structure:

### Success Response

```json
{
  "Success": true,
  "Data": {
    /* Response data */
  },
  "Message": "Operation completed successfully",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

### Error Response

```json
{
  "Success": false,
  "Data": null,
  "Message": "Error description",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

---

## 🔌 API Endpoints

### 1. Get Provider Health Status

Get real-time health status of all GPS tracking providers.

**Endpoint**: `GET /api/v1/providers/health`

**Authentication**: Required

**Parameters**: None

**Request Example**:

```http
GET /api/v1/providers/health HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example**:

```json
{
  "Success": true,
  "Data": {
    "ProviderHealthStatuses": [
      {
        "ProviderName": "GPSGate",
        "Status": "Healthy",
        "Message": "Provider is operational",
        "ResponseTimeMs": 145.7,
        "CheckedAt": "2025-10-27T14:30:00Z",
        "IsHealthy": true
      },
      {
        "ProviderName": "BackupProvider",
        "Status": "Degraded",
        "Message": "High response time",
        "ResponseTimeMs": 850.3,
        "CheckedAt": "2025-10-27T14:30:00Z",
        "IsHealthy": false
      }
    ],
    "TotalProviders": 2,
    "HealthyProviders": 1
  },
  "Message": "Provider health retrieved successfully",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

**Status Enum**:

- `Healthy`: Provider is working correctly
- `Degraded`: Provider is slow but functional
- `Unhealthy`: Provider is not responding

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `ProviderName` | string | Internal provider identifier |
| `Status` | string | Health status (Healthy/Degraded/Unhealthy) |
| `Message` | string | Human-readable status message |
| `ResponseTimeMs` | double | Last response time in milliseconds |
| `CheckedAt` | datetime | When health was last checked |
| `IsHealthy` | boolean | True if status is "Healthy" |

**Use Cases**:

- Dashboard monitoring
- Alert systems
- Health check endpoints
- Automated failover decisions

**Error Responses**:

```json
{
  "Success": false,
  "Data": null,
  "Message": "Failed to retrieve provider health",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

---

### 2. Get Provider Statistics

Get usage statistics and performance metrics for all providers.

**Endpoint**: `GET /api/v1/providers/statistics`

**Authentication**: Required

**Parameters**: None

**Request Example**:

```http
GET /api/v1/providers/statistics HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example**:

```json
{
  "Success": true,
  "Data": {
    "TotalRequests": 15847,
    "SuccessfulRequests": 15620,
    "FailedRequests": 227,
    "FailoverCount": 12,
    "AverageResponseTimeMs": 234.5,
    "ProviderStats": [
      {
        "ProviderName": "GPSGate",
        "RequestCount": 12500,
        "SuccessCount": 12350,
        "FailureCount": 150,
        "SuccessRate": 98.8,
        "AverageResponseTimeMs": 198.3,
        "LastRequestAt": "2025-10-27T14:29:55Z"
      },
      {
        "ProviderName": "BackupProvider",
        "RequestCount": 3347,
        "SuccessCount": 3270,
        "FailureCount": 77,
        "SuccessRate": 97.7,
        "AverageResponseTimeMs": 345.8,
        "LastRequestAt": "2025-10-27T14:28:30Z"
      }
    ]
  },
  "Message": "Statistics retrieved successfully",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

**Response Fields**:

**Overall Statistics**:
| Field | Type | Description |
|-------|------|-------------|
| `TotalRequests` | int | Total API requests to all providers |
| `SuccessfulRequests` | int | Number of successful requests |
| `FailedRequests` | int | Number of failed requests |
| `FailoverCount` | int | Times system switched providers |
| `AverageResponseTimeMs` | double | Average response time across all providers |

**Per-Provider Statistics**:
| Field | Type | Description |
|-------|------|-------------|
| `ProviderName` | string | Provider identifier |
| `RequestCount` | int | Requests to this provider |
| `SuccessCount` | int | Successful requests |
| `FailureCount` | int | Failed requests |
| `SuccessRate` | double | Percentage of successful requests |
| `AverageResponseTimeMs` | double | Average response time for this provider |
| `LastRequestAt` | datetime | Timestamp of last request |

**Use Cases**:

- Performance monitoring
- Capacity planning
- Provider comparison
- SLA verification
- Billing and usage reports

---

### 3. Get All Providers

Get list of all configured GPS tracking providers.

**Endpoint**: `GET /api/v1/providers/list`

**Authentication**: Required

**Parameters**: None

**Request Example**:

```http
GET /api/v1/providers/list HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example**:

```json
{
  "Success": true,
  "Data": [
    {
      "ProviderId": 1,
      "ProviderName": "GPSGate",
      "DisplayName": "GPSGate Primary",
      "Description": "Primary GPS tracking provider",
      "IsEnabled": true,
      "IsDefault": true,
      "PriorityOrder": 1,
      "ConfigurationData": "{\"ApiKey\":\"***\",\"BaseUrl\":\"http://10.0.10.150/comGpsGate/api/v.1\",\"ApplicationId\":\"12\"}",
      "CreatedAt": "2025-10-15T10:00:00Z",
      "UpdatedAt": "2025-10-27T14:00:00Z"
    },
    {
      "ProviderId": 2,
      "ProviderName": "BackupProvider",
      "DisplayName": "Backup Tracking",
      "Description": "Failover GPS provider",
      "IsEnabled": true,
      "IsDefault": false,
      "PriorityOrder": 2,
      "ConfigurationData": "{\"ApiKey\":\"***\",\"BaseUrl\":\"http://backup.example.com/api\"}",
      "CreatedAt": "2025-10-20T11:00:00Z",
      "UpdatedAt": "2025-10-26T09:30:00Z"
    }
  ],
  "Message": "Providers retrieved successfully",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `ProviderId` | int | Unique provider identifier |
| `ProviderName` | string | Internal system name |
| `DisplayName` | string | User-friendly name |
| `Description` | string | Provider description |
| `IsEnabled` | boolean | Whether provider is active |
| `IsDefault` | boolean | Whether this is the default provider |
| `PriorityOrder` | int | Failover priority (1 = highest) |
| `ConfigurationData` | string | JSON configuration (API keys masked) |
| `CreatedAt` | datetime | When provider was created |
| `UpdatedAt` | datetime | Last update timestamp |

**Use Cases**:

- List all providers in UI
- Configuration management
- Audit trails
- Provider discovery

---

### 4. Get Provider by ID

Get detailed information about a specific provider.

**Endpoint**: `GET /api/v1/providers/{providerId}`

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `providerId` | int | Yes | Provider's unique ID |

**Request Example**:

```http
GET /api/v1/providers/1 HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example**:

```json
{
  "Success": true,
  "Data": {
    "ProviderId": 1,
    "ProviderName": "GPSGate",
    "DisplayName": "GPSGate Primary",
    "Description": "Primary GPS tracking provider",
    "IsEnabled": true,
    "IsDefault": true,
    "PriorityOrder": 1,
    "ConfigurationData": "{\"ApiKey\":\"your-api-key\",\"BaseUrl\":\"http://10.0.10.150/comGpsGate/api/v.1\",\"ApplicationId\":\"12\"}",
    "CreatedAt": "2025-10-15T10:00:00Z",
    "UpdatedAt": "2025-10-27T14:00:00Z"
  },
  "Message": "Provider retrieved successfully",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

**Error Responses**:

**404 Not Found**:

```json
{
  "Success": false,
  "Data": null,
  "Message": "Provider with ID 999 not found",
  "Timestamp": "2025-10-27T14:30:00Z"
}
```

---

### 5. Update Provider Configuration

Update an existing provider's configuration.

**Endpoint**: `PUT /api/v1/providers/{providerId}`

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `providerId` | int | Yes | Provider's unique ID |

**Request Body**:

```json
{
  "DisplayName": "GPSGate Primary Updated",
  "Description": "Updated description",
  "ConfigurationData": "{\"ApiKey\":\"new-api-key\",\"BaseUrl\":\"http://10.0.10.150/comGpsGate/api/v.1\",\"ApplicationId\":\"12\"}",
  "IsEnabled": true,
  "IsDefault": true,
  "PriorityOrder": 1
}
```

**Request Fields** (all optional):
| Field | Type | Description |
|-------|------|-------------|
| `DisplayName` | string | User-friendly name |
| `Description` | string | Provider description |
| `ConfigurationData` | string | JSON configuration |
| `IsEnabled` | boolean | Enable/disable provider |
| `IsDefault` | boolean | Set as default provider |
| `PriorityOrder` | int | Failover priority |

**Request Example**:

```http
PUT /api/v1/providers/1 HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "ConfigurationData": "{\"ApiKey\":\"updated-key\",\"BaseUrl\":\"http://10.0.10.150/comGpsGate/api/v.1\",\"ApplicationId\":\"12\"}",
  "IsEnabled": true
}
```

**Response Example**:

```json
{
  "Success": true,
  "Data": {
    "ProviderId": 1,
    "ProviderName": "GPSGate",
    "DisplayName": "GPSGate Primary Updated",
    "Description": "Updated description",
    "IsEnabled": true,
    "IsDefault": true,
    "PriorityOrder": 1,
    "ConfigurationData": "{\"ApiKey\":\"updated-key\",\"BaseUrl\":\"http://10.0.10.150/comGpsGate/api/v.1\",\"ApplicationId\":\"12\"}",
    "CreatedAt": "2025-10-15T10:00:00Z",
    "UpdatedAt": "2025-10-27T14:35:00Z"
  },
  "Message": "Provider updated successfully. Providers reloaded.",
  "Timestamp": "2025-10-27T14:35:00Z"
}
```

**Important Notes**:

- ⚠️ System automatically reloads providers after update
- ⚠️ Changes apply immediately
- ⚠️ Invalid configuration may cause provider to fail
- ✅ Test connection after configuration changes

**Error Responses**:

**404 Not Found**:

```json
{
  "Success": false,
  "Data": null,
  "Message": "Provider with ID 999 not found",
  "Timestamp": "2025-10-27T14:35:00Z"
}
```

**400 Bad Request**:

```json
{
  "Success": false,
  "Data": null,
  "Message": "Invalid configuration data",
  "Timestamp": "2025-10-27T14:35:00Z"
}
```

---

### 6. Test Provider Connection

Test connectivity to a specific GPS tracking provider.

**Endpoint**: `POST /api/v1/providers/{providerName}/test`

**Authentication**: Required

**URL Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `providerName` | string | Yes | Provider's name (e.g., "GPSGate") |

**Request Body**: None

**Request Example**:

```http
POST /api/v1/providers/GPSGate/test HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Success Response**:

```json
{
  "Success": true,
  "Data": {
    "ProviderName": "GPSGate",
    "IsConnected": true,
    "Message": "Successfully connected to GPSGate API",
    "ResponseTimeMs": 145.7,
    "TestedAt": "2025-10-27T14:40:00Z"
  },
  "Message": "Connection test completed",
  "Timestamp": "2025-10-27T14:40:00Z"
}
```

**Failure Response**:

```json
{
  "Success": true,
  "Data": {
    "ProviderName": "GPSGate",
    "IsConnected": false,
    "Message": "Connection timeout: Unable to reach API endpoint",
    "ResponseTimeMs": 0,
    "TestedAt": "2025-10-27T14:40:00Z"
  },
  "Message": "Connection test completed",
  "Timestamp": "2025-10-27T14:40:00Z"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `ProviderName` | string | Provider being tested |
| `IsConnected` | boolean | Connection success status |
| `Message` | string | Detailed result message |
| `ResponseTimeMs` | double | Connection response time |
| `TestedAt` | datetime | When test was performed |

**Use Cases**:

- Validate configuration changes
- Troubleshoot connectivity issues
- Pre-deployment testing
- Monitoring and alerts

**Common Error Messages**:

- "Connection timeout: Unable to reach API endpoint"
- "Authentication failed: Invalid API key"
- "Invalid URL: Malformed endpoint address"
- "Network error: Host unreachable"

---

### 7. Reload All Providers

Reload all provider configurations from the database.

**Endpoint**: `POST /api/v1/providers/reload`

**Authentication**: Required

**Request Body**: None

**Request Example**:

```http
POST /api/v1/providers/reload HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example**:

```json
{
  "Success": true,
  "Data": {
    "ReloadedAt": "2025-10-27T14:45:00Z",
    "ProvidersCount": 2,
    "Message": "All providers reloaded successfully"
  },
  "Message": "Providers reloaded",
  "Timestamp": "2025-10-27T14:45:00Z"
}
```

**What This Does**:

1. Queries database for latest configurations
2. Re-initializes all provider instances
3. Updates provider discovery cache
4. Applies new settings immediately

**When to Use**:

- After database configuration changes
- After adding new providers
- When providers show stale data
- During troubleshooting

**Important Notes**:

- ⚠️ Brief interruption in tracking during reload
- ⚠️ Typically completes in < 1 second
- ✅ Automatically called after PUT operations
- ✅ Safe to call multiple times

---

### 8. Get Vehicle-Provider Mappings

Get current vehicle-to-provider assignments.

**Endpoint**: `GET /api/v1/providers/mappings`

**Authentication**: Required

**Query Parameters** (optional):
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `vehicleId` | int | No | Filter by specific vehicle |

**Request Example (All Mappings)**:

```http
GET /api/v1/providers/mappings HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Request Example (Specific Vehicle)**:

```http
GET /api/v1/providers/mappings?vehicleId=123 HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Response Example**:

```json
{
  "Success": true,
  "Data": [
    {
      "MappingId": 1,
      "VehicleId": 123,
      "VehicleName": "HYG001",
      "NumberPlate": "ABC-1234",
      "ProviderId": 1,
      "ProviderName": "GPSGate",
      "AssignedAt": "2025-10-20T10:00:00Z",
      "AssignedBy": "admin@company.com"
    },
    {
      "MappingId": 2,
      "VehicleId": 124,
      "VehicleName": "HYG002",
      "NumberPlate": "DEF-5678",
      "ProviderId": 2,
      "ProviderName": "BackupProvider",
      "AssignedAt": "2025-10-21T11:30:00Z",
      "AssignedBy": "admin@company.com"
    }
  ],
  "Message": "Vehicle mappings retrieved successfully",
  "Timestamp": "2025-10-27T14:50:00Z"
}
```

**Response Fields**:
| Field | Type | Description |
|-------|------|-------------|
| `MappingId` | int | Unique mapping identifier |
| `VehicleId` | int | Vehicle's unique ID |
| `VehicleName` | string | Vehicle name (Tenacity number) |
| `NumberPlate` | string | Vehicle license plate |
| `ProviderId` | int | Assigned provider ID |
| `ProviderName` | string | Assigned provider name |
| `AssignedAt` | datetime | When assignment was created |
| `AssignedBy` | string | User who created assignment |

**Use Cases**:

- View all vehicle assignments
- Check specific vehicle's provider
- Audit vehicle-provider mappings
- Load balancing verification

---

### 9. Assign Vehicle to Provider

Create a new vehicle-to-provider assignment.

**Endpoint**: `POST /api/v1/providers/mappings`

**Authentication**: Required

**Request Body**:

```json
{
  "VehicleId": 123,
  "ProviderId": 1
}
```

**Request Fields**:
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `VehicleId` | int | Yes | Vehicle's unique ID |
| `ProviderId` | int | Yes | Provider's unique ID |

**Request Example**:

```http
POST /api/v1/providers/mappings HTTP/1.1
Host: your-server:7009
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json

{
  "VehicleId": 123,
  "ProviderId": 1
}
```

**Response Example**:

```json
{
  "Success": true,
  "Data": {
    "MappingId": 3,
    "VehicleId": 123,
    "ProviderId": 1,
    "AssignedAt": "2025-10-27T15:00:00Z"
  },
  "Message": "Vehicle assigned to provider successfully",
  "Timestamp": "2025-10-27T15:00:00Z"
}
```

**Error Responses**:

**400 Bad Request (Vehicle Not Found)**:

```json
{
  "Success": false,
  "Data": null,
  "Message": "Vehicle with ID 999 not found",
  "Timestamp": "2025-10-27T15:00:00Z"
}
```

**400 Bad Request (Provider Not Found)**:

```json
{
  "Success": false,
  "Data": null,
  "Message": "Provider with ID 999 not found",
  "Timestamp": "2025-10-27T15:00:00Z"
}
```

**409 Conflict (Duplicate Assignment)**:

```json
{
  "Success": false,
  "Data": null,
  "Message": "Vehicle 123 is already assigned to a provider",
  "Timestamp": "2025-10-27T15:00:00Z"
}
```

**Use Cases**:

- Assign specific vehicles to regional providers
- Load balancing across providers
- Testing new providers with select vehicles
- Geographic optimization

---

## 🔄 Common Workflows

### Workflow 1: Adding and Configuring a New Provider

```bash
# Step 1: Insert provider into database
# (Execute SQL script)

# Step 2: Reload providers
POST /api/v1/providers/reload

# Step 3: Get the new provider ID
GET /api/v1/providers/list

# Step 4: Update configuration
PUT /api/v1/providers/{newProviderId}
{
  "ConfigurationData": "{\"ApiKey\":\"your-key\"}",
  "IsEnabled": true
}

# Step 5: Test connection
POST /api/v1/providers/NewProviderName/test

# Step 6: Verify health
GET /api/v1/providers/health
```

### Workflow 2: Monitoring Provider Health

```bash
# Get current health status
GET /api/v1/providers/health

# Get performance statistics
GET /api/v1/providers/statistics

# Test specific provider
POST /api/v1/providers/GPSGate/test

# Check if action needed based on response
```

### Workflow 3: Switching Default Provider

```bash
# Step 1: Verify backup provider is healthy
POST /api/v1/providers/BackupProvider/test

# Step 2: Set backup as default
PUT /api/v1/providers/2
{
  "IsDefault": true
}

# Step 3: Disable old default (optional)
PUT /api/v1/providers/1
{
  "IsEnabled": false
}

# Step 4: Verify change
GET /api/v1/providers/list
```

### Workflow 4: Load Balancing Vehicles

```bash
# Step 1: Get all providers
GET /api/v1/providers/list

# Step 2: Get current mappings
GET /api/v1/providers/mappings

# Step 3: Assign vehicles to distribute load
POST /api/v1/providers/mappings
{
  "VehicleId": 101,
  "ProviderId": 1
}

POST /api/v1/providers/mappings
{
  "VehicleId": 102,
  "ProviderId": 2
}

# Step 4: Monitor statistics
GET /api/v1/providers/statistics
```

---

## 🚨 Error Codes

### HTTP Status Codes

| Code | Meaning               | Common Causes                        |
| ---- | --------------------- | ------------------------------------ |
| 200  | OK                    | Request successful                   |
| 400  | Bad Request           | Invalid request body, missing fields |
| 401  | Unauthorized          | Missing or invalid JWT token         |
| 403  | Forbidden             | Insufficient permissions             |
| 404  | Not Found             | Provider or vehicle doesn't exist    |
| 409  | Conflict              | Duplicate assignment                 |
| 500  | Internal Server Error | Database error, provider crash       |

### Application Error Messages

| Message                         | Cause               | Solution                        |
| ------------------------------- | ------------------- | ------------------------------- |
| "Provider with ID X not found"  | Invalid provider ID | Check ID, reload provider list  |
| "Invalid configuration data"    | Malformed JSON      | Validate JSON syntax            |
| "Failed to connect to provider" | Network/API issue   | Check connectivity, credentials |
| "Vehicle X already assigned"    | Duplicate mapping   | Update existing or delete first |
| "Unauthorized access"           | Missing permissions | Request admin access            |

---

## 💡 Best Practices

### Rate Limiting

**Recommendations**:

- Health checks: Once per 30-60 seconds
- Statistics: Once per 60 seconds
- Connection tests: On-demand only
- Configuration updates: As needed

**Avoid**:

- ❌ Polling health every second
- ❌ Continuous connection testing
- ❌ Rapid configuration updates

### Caching

**Client-Side Caching**:

- Provider list: 5 minutes
- Health status: 30 seconds
- Statistics: 60 seconds
- Configuration: Until update

### Error Handling

**Retry Strategy**:

```javascript
const retryRequest = async (url, maxRetries = 3) => {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
    }
  }
};
```

### Security

**DO**:

- ✅ Use HTTPS in production
- ✅ Store JWT tokens securely
- ✅ Validate all input
- ✅ Encrypt API keys in database
- ✅ Log security events

**DON'T**:

- ❌ Expose API keys in URLs
- ❌ Store tokens in localStorage (use httpOnly cookies)
- ❌ Log sensitive configuration data
- ❌ Share JWT tokens

---

## 📝 Code Examples

### JavaScript/React Example

```javascript
import axios from "axios";

const axiosInstance = axios.create({
  baseURL: "http://your-server:7009/api/v1",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("jwt")}`,
  },
});

// Get provider health
const getProviderHealth = async () => {
  try {
    const response = await axiosInstance.get("/providers/health");
    if (response.data.Success) {
      return response.data.Data;
    }
  } catch (error) {
    console.error("Failed to get provider health:", error);
  }
};

// Update provider configuration
const updateProvider = async (providerId, config) => {
  try {
    const response = await axiosInstance.put(`/providers/${providerId}`, {
      ConfigurationData: JSON.stringify(config),
      IsEnabled: true,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to update provider:", error);
    throw error;
  }
};

// Test provider connection
const testConnection = async (providerName) => {
  try {
    const response = await axiosInstance.post(
      `/providers/${providerName}/test`,
    );
    return response.data.Data.IsConnected;
  } catch (error) {
    console.error("Connection test failed:", error);
    return false;
  }
};
```

### C# Example

```csharp
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text.Json;

public class ProviderManagementClient
{
    private readonly HttpClient _httpClient;

    public ProviderManagementClient(string baseUrl, string jwtToken)
    {
        _httpClient = new HttpClient
        {
            BaseAddress = new Uri(baseUrl)
        };
        _httpClient.DefaultRequestHeaders.Authorization =
            new AuthenticationHeaderValue("Bearer", jwtToken);
    }

    public async Task<ProviderHealth> GetHealthAsync()
    {
        var response = await _httpClient.GetAsync("/api/v1/providers/health");
        response.EnsureSuccessStatusCode();

        var content = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<ApiResponse<ProviderHealth>>(content);

        return result.Data;
    }

    public async Task<bool> UpdateProviderAsync(int providerId, UpdateProviderRequest request)
    {
        var json = JsonSerializer.Serialize(request);
        var content = new StringContent(json, System.Text.Encoding.UTF8, "application/json");

        var response = await _httpClient.PutAsync($"/api/v1/providers/{providerId}", content);
        return response.IsSuccessStatusCode;
    }
}
```

### Python Example

```python
import requests
import json

class ProviderManagementClient:
    def __init__(self, base_url, jwt_token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {jwt_token}',
            'Content-Type': 'application/json'
        }

    def get_provider_health(self):
        response = requests.get(
            f'{self.base_url}/api/v1/providers/health',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()['Data']

    def update_provider(self, provider_id, config):
        data = {
            'ConfigurationData': json.dumps(config),
            'IsEnabled': True
        }
        response = requests.put(
            f'{self.base_url}/api/v1/providers/{provider_id}',
            headers=self.headers,
            json=data
        )
        response.raise_for_status()
        return response.json()

    def test_connection(self, provider_name):
        response = requests.post(
            f'{self.base_url}/api/v1/providers/{provider_name}/test',
            headers=self.headers
        )
        response.raise_for_status()
        return response.json()['Data']['IsConnected']

# Usage
client = ProviderManagementClient('http://your-server:7009', 'your-jwt-token')
health = client.get_provider_health()
print(f"Healthy providers: {health['HealthyProviders']}/{health['TotalProviders']}")
```

---

## 🧪 Testing

### Postman Collection

Import this collection to test all endpoints:

```json
{
  "info": {
    "name": "Provider Management API",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://your-server:7009"
    },
    {
      "key": "jwtToken",
      "value": "your-jwt-token-here"
    }
  ],
  "item": [
    {
      "name": "Get Provider Health",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}"
          }
        ],
        "url": "{{baseUrl}}/api/v1/providers/health"
      }
    }
  ]
}
```

### cURL Examples

```bash
# Get provider health
curl -X GET "http://your-server:7009/api/v1/providers/health" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Update provider
curl -X PUT "http://your-server:7009/api/v1/providers/1" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"IsEnabled": true, "ConfigurationData": "{\"ApiKey\":\"new-key\"}"}'

# Test connection
curl -X POST "http://your-server:7009/api/v1/providers/GPSGate/test" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

---

## 📚 Additional Resources

- **User Guide**: `Documentation/Features/VehicleTracking/USER_GUIDE.md`
- **Implementation Guide**: `Documentation/Features/VehicleTracking/Phase6-7/PHASE6-7_COMPLETE.md`
- **Database Schema**: `Documentation/Database/provider_tables.sql`
- **Architecture**: `Documentation/Features/VehicleTracking/ARCHITECTURE.md`

---

**Document Version**: 1.0
**Last Updated**: October 27, 2025
**Maintained By**: FMS Development Team
