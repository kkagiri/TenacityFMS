# Automated Reconciliation API Documentation

## Overview

The Automated Reconciliation API provides comprehensive endpoints for managing reconciliation policies, monitoring executions, analyzing discrepancies, and accessing performance analytics within the FMS system. The system features complete Redis-based event-driven policy execution with real-time orchestration integration.

## Base URL
```
/api/v1/automated-reconciliation
```

## Authentication

All endpoints require JWT Bearer token authentication with specific role-based permissions:
- **Roles**: Admin, User
- **Permissions**: Various `_tankReconciliation` permissions required per endpoint

### Headers
```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

## Policy Management Endpoints

### Get Policies
Lists reconciliation policies with optional filtering and pagination.

**Endpoint:** `GET /policies`

**Authorization:** `_Read_tankReconciliation` permission required

**Query Parameters:**
- `isActive` (bool, optional) - Filter by active status
- `siteId` (int, optional) - Filter by site ID
- `policyType` (string, optional) - Filter by policy type
- `pageNumber` (int, default: 1) - Page number for pagination
- `pageSize` (int, default: 20, max: 100) - Number of items per page

**Example Request:**
```http
GET /api/v1/automated-reconciliation/policies?isActive=true&siteId=1&pageNumber=1&pageSize=10
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "items": [
      {
        "id": 1,
        "name": "Daily Tank Reconciliation",
        "description": "Automated daily reconciliation for all tanks",
        "executionType": "Scheduled",
        "scheduleFrequencyHours": 24,
        "varianceThresholdLiters": 5.0,
        "varianceThresholdPercentage": 2.0,
        "isActive": true,
        "siteId": 1,
        "siteName": "Main Site",
        "createdBy": "admin",
        "createdOn": "2024-01-01T00:00:00Z",
        "tankScope": {
          "siteIds": [1],
          "tankIds": null,
          "fuelTypes": ["Diesel", "Petrol"],
          "highPriorityOnly": false
        }
      }
    ],
    "totalCount": 1,
    "pageNumber": 1,
    "pageSize": 10,
    "totalPages": 1
  },
  "message": "Policies retrieved successfully"
}
```

### Get Policy by ID
Retrieves a specific reconciliation policy by its ID.

**Endpoint:** `GET /policies/{id}`

**Authorization:** `_Read_tankReconciliation` permission required

**Path Parameters:**
- `id` (int, required) - Policy ID

**Example Request:**
```http
GET /api/v1/automated-reconciliation/policies/1
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "id": 1,
    "name": "Daily Tank Reconciliation",
    "description": "Automated daily reconciliation for all tanks",
    "executionType": "Scheduled",
    "scheduleFrequencyHours": 24,
    "varianceThresholdLiters": 5.0,
    "varianceThresholdPercentage": 2.0,
    "isActive": true,
    "siteId": 1,
    "siteName": "Main Site",
    "tankScope": {
      "siteIds": [1],
      "tankIds": null,
      "fuelTypes": ["Diesel", "Petrol"],
      "highPriorityOnly": false
    },
    "lastExecutionTime": "2024-01-01T12:00:00Z",
    "nextExecutionTime": "2024-01-02T12:00:00Z",
    "executionCount": 30,
    "successRate": 98.5
  },
  "message": "Policy retrieved successfully"
}
```

### Create Policy
Creates a new reconciliation policy.

**Endpoint:** `POST /policies`

**Authorization:** `_Create_tankReconciliation` permission required

**Request Body:**
```json
{
  "name": "Emergency Variance Detection",
  "description": "Event-driven policy for emergency variance detection",
  "executionType": "EventDriven",
  "varianceThresholdLiters": 10.0,
  "varianceThresholdPercentage": 5.0,
  "siteId": 1,
  "tankScope": {
    "siteIds": [1],
    "fuelTypes": ["Diesel"],
    "highPriorityOnly": true
  }
}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "id": 2,
    "name": "Emergency Variance Detection",
    "description": "Event-driven policy for emergency variance detection",
    "executionType": "EventDriven",
    "varianceThresholdLiters": 10.0,
    "varianceThresholdPercentage": 5.0,
    "isActive": true,
    "siteId": 1,
    "createdBy": "admin-user-id",
    "createdOn": "2024-01-01T14:30:00Z"
  },
  "message": "Policy created successfully"
}
```

### Update Policy
Updates an existing reconciliation policy.

**Endpoint:** `PUT /policies/{id}`

**Authorization:** `_Update_tankReconciliation` permission required

**Path Parameters:**
- `id` (int, required) - Policy ID

**Request Body:**
```json
{
  "id": 1,
  "name": "Updated Daily Tank Reconciliation",
  "description": "Updated automated daily reconciliation for all tanks",
  "executionType": "Scheduled",
  "scheduleFrequencyHours": 12,
  "varianceThresholdLiters": 3.0,
  "varianceThresholdPercentage": 1.5,
  "isActive": true,
  "siteId": 1,
  "tankScope": {
    "siteIds": [1, 2],
    "fuelTypes": ["Diesel", "Petrol", "Kerosene"],
    "highPriorityOnly": false
  }
}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "id": 1,
    "name": "Updated Daily Tank Reconciliation",
    "modifiedBy": "admin-user-id",
    "modifiedOn": "2024-01-01T15:00:00Z"
  },
  "message": "Policy updated successfully"
}
```

### Delete Policy
Soft deletes a reconciliation policy (marks as inactive).

**Endpoint:** `DELETE /policies/{id}`

**Authorization:** `_Delete_tankReconciliation` permission required

**Path Parameters:**
- `id` (int, required) - Policy ID

**Response:**
```http
204 No Content
```

## Execution Monitoring Endpoints

### Get Executions
Lists policy execution history with filtering and pagination.

**Endpoint:** `GET /executions`

**Authorization:** `_Read_tankReconciliation` permission required

**Query Parameters:**
- `policyId` (int, optional) - Filter by policy ID
- `status` (string, optional) - Filter by execution status
- `startDate` (datetime, optional) - Filter executions after this date
- `endDate` (datetime, optional) - Filter executions before this date
- `siteId` (int, optional) - Filter by site ID
- `pageNumber` (int, default: 1) - Page number
- `pageSize` (int, default: 20, max: 100) - Items per page

**Example Request:**
```http
GET /api/v1/automated-reconciliation/executions?policyId=1&status=Completed&startDate=2024-01-01&pageSize=5
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "items": [
      {
        "id": 1,
        "policyId": 1,
        "policyName": "Daily Tank Reconciliation",
        "executionStartTime": "2024-01-01T12:00:00Z",
        "executionEndTime": "2024-01-01T12:05:30Z",
        "executionDurationMs": 330000,
        "status": "Completed",
        "tanksEvaluated": 15,
        "discrepanciesDetected": 3,
        "tanksReconciled": 3,
        "reconciliationFailures": 0,
        "totalVolumeVariance": 12.5,
        "averagePercentageVariance": 1.8,
        "successRate": 100.0
      }
    ],
    "totalCount": 1,
    "pageNumber": 1,
    "pageSize": 5,
    "totalPages": 1
  },
  "message": "Executions retrieved successfully"
}
```

### Get Execution by ID
Retrieves detailed information about a specific policy execution.

**Endpoint:** `GET /executions/{id}`

**Authorization:** `_Read_tankReconciliation` permission required

**Path Parameters:**
- `id` (int, required) - Execution ID

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "id": 1,
    "policyId": 1,
    "policyName": "Daily Tank Reconciliation",
    "executionStartTime": "2024-01-01T12:00:00Z",
    "executionEndTime": "2024-01-01T12:05:30Z",
    "status": "Completed",
    "tanksEvaluated": 15,
    "discrepanciesDetected": 3,
    "tanksReconciled": 3,
    "reconciliationFailures": 0,
    "executionResults": {
      "totalDiscrepancies": 3,
      "successfulReconciliations": 3,
      "failedReconciliations": 0,
      "executionDurationMs": 330000,
      "processedTanks": [
        {
          "tankId": 1,
          "success": true,
          "volumeAdjustment": -2.5,
          "errorMessage": null
        },
        {
          "tankId": 5,
          "success": true,
          "volumeAdjustment": 5.0,
          "errorMessage": null
        },
        {
          "tankId": 8,
          "success": true,
          "volumeAdjustment": -10.0,
          "errorMessage": null
        }
      ]
    }
  },
  "message": "Execution details retrieved successfully"
}
```

### Trigger Manual Execution
Manually triggers execution of a reconciliation policy.

**Endpoint:** `POST /executions/manual-trigger`

**Authorization:** `_Execute_tankReconciliation` permission required

**Request Body:**
```json
{
  "policyId": 1,
  "siteId": 1,
  "tankIds": [1, 2, 3],
  "reason": "Manual reconciliation after delivery issue"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "id": 15,
    "policyId": 1,
    "policyName": "Daily Tank Reconciliation",
    "executionStartTime": "2024-01-01T16:30:00Z",
    "status": "Running",
    "triggeredBy": "admin-user-id",
    "reason": "Manual reconciliation after delivery issue",
    "estimatedDurationMinutes": 5
  },
  "message": "Manual execution triggered successfully"
}
```

## Discrepancy Analysis Endpoints

### Get Discrepancies
Lists detected discrepancies with filtering and pagination.

**Endpoint:** `GET /discrepancies`

**Authorization:** `_Read_tankReconciliation` permission required

**Query Parameters:**
- `siteId` (int, optional) - Filter by site ID
- `tankId` (int, optional) - Filter by tank ID
- `severity` (string, optional) - Filter by severity (Low, Medium, High, Critical)
- `isResolved` (bool, optional) - Filter by resolution status
- `startDate` (datetime, optional) - Filter discrepancies after this date
- `endDate` (datetime, optional) - Filter discrepancies before this date
- `pageNumber` (int, default: 1) - Page number
- `pageSize` (int, default: 20, max: 100) - Items per page

**Example Request:**
```http
GET /api/v1/automated-reconciliation/discrepancies?severity=High&isResolved=false&siteId=1
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "items": [
      {
        "id": 1,
        "policyId": 1,
        "policyName": "Daily Tank Reconciliation",
        "tankId": 5,
        "tankName": "Tank 5 - Diesel",
        "siteId": 1,
        "siteName": "Main Site",
        "detectedAt": "2024-01-01T12:01:00Z",
        "severity": "High",
        "varianceLiters": 15.5,
        "variancePercentage": 3.2,
        "expectedVolume": 485.0,
        "actualVolume": 469.5,
        "isResolved": false,
        "resolvedAt": null,
        "resolutionMethod": null,
        "resolvedBy": null
      }
    ],
    "totalCount": 1,
    "pageNumber": 1,
    "pageSize": 20,
    "totalPages": 1
  },
  "message": "Discrepancies retrieved successfully"
}
```

## Analytics and Reporting Endpoints

### Get Analytics Dashboard
Retrieves comprehensive analytics and metrics for the reconciliation system.

**Endpoint:** `GET /analytics/dashboard`

**Authorization:** `_Read_tankReconciliation` permission required

**Query Parameters:**
- `startDate` (datetime, optional) - Analytics period start date
- `endDate` (datetime, optional) - Analytics period end date
- `siteId` (int, optional) - Filter analytics by site ID

**Example Request:**
```http
GET /api/v1/automated-reconciliation/analytics/dashboard?startDate=2024-01-01&endDate=2024-01-31&siteId=1
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "summary": {
      "totalPolicies": 5,
      "activePolicies": 4,
      "totalExecutions": 120,
      "successfulExecutions": 118,
      "failedExecutions": 2,
      "overallSuccessRate": 98.3,
      "totalDiscrepancies": 45,
      "resolvedDiscrepancies": 43,
      "discrepancyResolutionRate": 95.6
    },
    "executionTrends": [
      {
        "date": "2024-01-01",
        "executions": 4,
        "successful": 4,
        "failed": 0,
        "discrepancies": 2
      },
      {
        "date": "2024-01-02",
        "executions": 4,
        "successful": 3,
        "failed": 1,
        "discrepancies": 3
      }
    ],
    "topPoliciesByActivity": [
      {
        "policyId": 1,
        "policyName": "Daily Tank Reconciliation",
        "executionCount": 30,
        "successRate": 100.0,
        "avgDiscrepanciesPerExecution": 1.5
      }
    ],
    "discrepancyDistribution": {
      "low": 25,
      "medium": 15,
      "high": 4,
      "critical": 1
    },
    "volumeVarianceMetrics": {
      "totalVarianceLiters": 125.5,
      "averageVarianceLiters": 2.8,
      "maximumVarianceLiters": 15.5,
      "averageVariancePercentage": 1.2
    },
    "sitePerformance": [
      {
        "siteId": 1,
        "siteName": "Main Site",
        "executionCount": 60,
        "successRate": 98.3,
        "discrepancyCount": 20,
        "averageResolutionTime": "00:05:30"
      }
    ]
  },
  "message": "Analytics dashboard retrieved successfully"
}
```

### Get System Health
Retrieves system health status and operational metrics.

**Endpoint:** `GET /system/health`

**Authorization:** `_Read_tankReconciliation` permission required

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "systemStatus": "Healthy",
    "lastHealthCheck": "2024-01-01T16:45:00Z",
    "backgroundServiceStatus": {
      "isRunning": true,
      "lastCycleTime": "2024-01-01T16:30:00Z",
      "nextCycleTime": "2024-01-01T16:45:00Z",
      "cycleIntervalMinutes": 15
    },
    "redisConnectionStatus": {
      "isConnected": true,
      "connectionString": "localhost:6379",
      "lastConnectionCheck": "2024-01-01T16:44:00Z"
    },
    "databaseConnectionStatus": {
      "isConnected": true,
      "connectionString": "Data Source=localhost...",
      "lastConnectionCheck": "2024-01-01T16:44:30Z"
    },
    "performanceMetrics": {
      "averageCycleDurationMs": 45000,
      "averagePolicyExecutionMs": 8500,
      "queuedTriggers": 0,
      "activeExecutions": 0
    },
    "recentErrors": []
  },
  "message": "System is healthy"
}
```

## Error Responses

### Standard Error Format
All endpoints return errors in a consistent format:

```json
{
  "isSuccess": false,
  "data": null,
  "message": "Error description",
  "errorType": "ValidationError",
  "errors": [
    {
      "field": "PolicyId",
      "message": "Policy ID is required"
    }
  ]
}
```

### Common HTTP Status Codes
- `200 OK` - Successful operation
- `201 Created` - Resource created successfully
- `204 No Content` - Successful deletion
- `400 Bad Request` - Validation errors or malformed request
- `401 Unauthorized` - Invalid or missing authentication
- `403 Forbidden` - Insufficient permissions
- `404 Not Found` - Resource not found
- `500 Internal Server Error` - System error

### Error Types
- `ValidationError` - Input validation failures
- `AuthorizationError` - Permission denied
- `NotFoundError` - Resource not found
- `SystemError` - Internal system errors
- `ConcurrencyError` - Concurrent modification conflicts

## Rate Limiting

### Default Limits
- **Per User**: 100 requests per minute
- **Per IP**: 1000 requests per minute
- **Bulk Operations**: 10 requests per minute

### Rate Limit Headers
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1641024000
```

## Data Models

### ReconciliationPolicyDTO
```typescript
interface ReconciliationPolicyDTO {
  id: number;
  name: string;
  description?: string;
  executionType: "Scheduled" | "EventDriven" | "Manual";
  scheduleFrequencyHours?: number;
  varianceThresholdLiters?: number;
  varianceThresholdPercentage?: number;
  isActive: boolean;
  siteId: number;
  siteName?: string;
  tankScope?: TankScopeDTO;
  createdBy: string;
  createdOn: string;
  modifiedBy?: string;
  modifiedOn?: string;
}
```

### TankScopeDTO
```typescript
interface TankScopeDTO {
  siteIds?: number[];
  tankIds?: number[];
  fuelTypes?: string[];
  highPriorityOnly?: boolean;
}
```

### ReconciliationPolicyExecutionDTO
```typescript
interface ReconciliationPolicyExecutionDTO {
  id: number;
  policyId: number;
  policyName: string;
  executionStartTime: string;
  executionEndTime?: string;
  executionDurationMs?: number;
  status: "Running" | "Completed" | "CompletedWithErrors" | "Failed";
  tanksEvaluated: number;
  discrepanciesDetected: number;
  tanksReconciled: number;
  reconciliationFailures: number;
  totalVolumeVariance?: number;
  averagePercentageVariance?: number;
  errorMessage?: string;
  executionResults?: object;
}
```

This API documentation provides comprehensive coverage of all automated reconciliation endpoints, including detailed request/response examples, error handling, and data models to facilitate integration and development.