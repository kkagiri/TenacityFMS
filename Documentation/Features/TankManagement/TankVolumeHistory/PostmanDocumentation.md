# Tank Volume History API Documentation

This document provides detailed information on how to use the Tank Volume History API endpoints with Postman.

## Authentication

All endpoints require JWT Bearer authentication. Add the following header to your requests:

```
Authorization: Bearer <your_jwt_token>
```

Additionally, the user must have the `_Read_tankVolumeHistory` permission to access these endpoints.

## Endpoints

### 1. Get All Tank Volume History

Retrieves the entire history of volume changes across all tanks.

**Endpoint:** `GET /api/TankVolumeHistory`

**Required Permissions:** `_Read_tankVolumeHistory`

**Response Format:**
```json
[
  {
    "id": 1,
    "tankId": 1,
    "timestamp": "2025-07-01T08:30:00",
    "volumeChange": 500.00,
    "newVolume": 1500.00,
    "changeReason": 2,
    "recordedBy": "admin",
    "vehicleName": "N/A",
    "referenceType": "Delivery",
    "referenceId": 101,
    "site": "Main Site",
    "siteId": 1
  },
  {
    "id": 2,
    "tankId": 2,
    "timestamp": "2025-07-01T09:15:00",
    "volumeChange": -50.00,
    "newVolume": 950.00,
    "changeReason": 6,
    "recordedBy": "system",
    "vehicleName": "HYO-001",
    "referenceType": "Dispensing",
    "referenceId": 202,
    "site": "Main Site",
    "siteId": 1
  }
]
```

**Postman Example:**

```
GET {{baseUrl}}/api/TankVolumeHistory
Headers:
  Authorization: Bearer {{jwtToken}}
```

### 2. Get Tank Volume History By Tank ID and Date Range

Retrieves volume history for a specific tank within a given date range.

**Endpoint:** `GET /api/TankVolumeHistory/byTankAndDateRange`

**Parameters:**
- `TankId` (integer, required): ID of the tank
- `startDate` (date, required): Start date for the history range
- `endDate` (date, required): End date for the history range

**Required Permissions:** `_Read_tankVolumeHistory`

**Response Format:**
```json
{
  "success": true,
  "message": "Tank Volume History List",
  "data": [
    {
      "id": 1,
      "tankId": 1,
      "timestamp": "2025-07-01T08:30:00",
      "volumeChange": 500.00,
      "newVolume": 1500.00,
      "changeReason": 2,
      "recordedBy": "admin",
      "vehicleName": null,
      "referenceType": "Delivery",
      "referenceId": 101,
      "site": null,
      "siteId": null
    },
    {
      "id": 3,
      "tankId": 1,
      "timestamp": "2025-07-02T10:45:00",
      "volumeChange": -100.00,
      "newVolume": 1400.00,
      "changeReason": 6,
      "recordedBy": "operator1",
      "vehicleName": "HYO-002",
      "referenceType": "Dispensing",
      "referenceId": 303,
      "site": null,
      "siteId": null
    }
  ]
}
```

**Error Responses:**
- `400 Bad Request`: Invalid ID or date range
- `403 Forbidden`: User lacks required permissions
- `404 Not Found`: Tank not found

**Postman Example:**

```
GET {{baseUrl}}/api/TankVolumeHistory/byTankAndDateRange?TankId=1&startDate=2025-07-01&endDate=2025-07-10
Headers:
  Authorization: Bearer {{jwtToken}}
```

### 3. Get Tank Volume History By Date Range

Retrieves volume history across all tanks within a given date range.

**Endpoint:** `GET /api/TankVolumeHistory/byDateRange`

**Parameters:**
- `StartDate` (date, required): Start date for the history range
- `EndDate` (date, required): End date for the history range

**Required Permissions:** `_Read_tankVolumeHistory`

**Response Format:**
```json
[
  {
    "id": 1,
    "tankId": 1,
    "timestamp": "2025-07-01T08:30:00",
    "volumeChange": 500.00,
    "newVolume": 1500.00,
    "changeReason": 2,
    "recordedBy": "admin",
    "vehicleName": "N/A",
    "referenceType": "Delivery",
    "referenceId": 101,
    "site": "Main Site",
    "siteId": 1
  },
  {
    "id": 2,
    "tankId": 2,
    "timestamp": "2025-07-01T09:15:00",
    "volumeChange": -50.00,
    "newVolume": 950.00,
    "changeReason": 6,
    "recordedBy": "system",
    "vehicleName": "HYO-001",
    "referenceType": "Dispensing",
    "referenceId": 202,
    "site": "Secondary Site",
    "siteId": 2
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid date range
- `403 Forbidden`: User lacks required permissions
- `404 Not Found`: No records found

**Postman Example:**

```
GET {{baseUrl}}/api/TankVolumeHistory/byDateRange?StartDate=2025-07-01&EndDate=2025-07-10
Headers:
  Authorization: Bearer {{jwtToken}}
```

### 4. Get Tank Volume History By Site

Retrieves volume history for all tanks at a specific site within a given date range.

**Endpoint:** `GET /api/TankVolumeHistory/bySite`

**Parameters:**
- `siteId` (integer, required): ID of the site
- `startDate` (date, required): Start date for the history range
- `endDate` (date, required): End date for the history range

**Required Permissions:** `_Read_tankVolumeHistory`

**Response Format:**
```json
[
  {
    "id": 1,
    "tankId": 1,
    "timestamp": "2025-07-01T08:30:00",
    "volumeChange": 500.00,
    "newVolume": 1500.00,
    "changeReason": 2,
    "recordedBy": "admin",
    "vehicleName": "N/A",
    "referenceType": "Delivery",
    "referenceId": 101,
    "site": "Main Site",
    "siteId": 1
  },
  {
    "id": 3,
    "tankId": 3,
    "timestamp": "2025-07-01T14:20:00",
    "volumeChange": 300.00,
    "newVolume": 800.00,
    "changeReason": 2,
    "recordedBy": "admin",
    "vehicleName": "N/A",
    "referenceType": "Delivery",
    "referenceId": 104,
    "site": "Main Site",
    "siteId": 1
  }
]
```

**Error Responses:**
- `400 Bad Request`: Invalid site ID or date range
- `403 Forbidden`: User lacks required permissions
- `404 Not Found`: No records found

**Postman Example:**

```
GET {{baseUrl}}/api/TankVolumeHistory/bySite?siteId=1&startDate=2025-07-01&endDate=2025-07-10
Headers:
  Authorization: Bearer {{jwtToken}}
```

## ChangeReason Reference

The `changeReason` field in responses corresponds to the following enum values:

| Value | Description |
|-------|-------------|
| 0 | OpeningStock |
| 1 | ClosingStock |
| 2 | Delivery |
| 3 | TransferIn |
| 4 | TransferOut |
| 5 | Adjustment |
| 6 | Dispensing |
| 7 | AutomatedDispensing |
| 8 | Reconciliation |
| 9 | AutomatedReconciliation |

## Postman Collection

Here is a complete Postman Collection for testing these endpoints:

```json
{
  "info": {
    "_postman_id": "bafcd5c4-2a0e-48c1-b5f9-6c8e9a5e4512",
    "name": "Tank Volume History API",
    "description": "Collection for testing the Tank Volume History API endpoints",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
  },
  "item": [
    {
      "name": "Get All Tank Volume History",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/TankVolumeHistory",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "TankVolumeHistory"
          ]
        },
        "description": "Retrieves all tank volume history entries"
      },
      "response": []
    },
    {
      "name": "Get Tank Volume History By Tank ID and Date Range",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/TankVolumeHistory/byTankAndDateRange?TankId=1&startDate=2025-07-01&endDate=2025-07-10",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "TankVolumeHistory",
            "byTankAndDateRange"
          ],
          "query": [
            {
              "key": "TankId",
              "value": "1"
            },
            {
              "key": "startDate",
              "value": "2025-07-01"
            },
            {
              "key": "endDate",
              "value": "2025-07-10"
            }
          ]
        },
        "description": "Retrieves volume history for a specific tank within a date range"
      },
      "response": []
    },
    {
      "name": "Get Tank Volume History By Date Range",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/TankVolumeHistory/byDateRange?StartDate=2025-07-01&EndDate=2025-07-10",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "TankVolumeHistory",
            "byDateRange"
          ],
          "query": [
            {
              "key": "StartDate",
              "value": "2025-07-01"
            },
            {
              "key": "EndDate",
              "value": "2025-07-10"
            }
          ]
        },
        "description": "Retrieves volume history across all tanks within a date range"
      },
      "response": []
    },
    {
      "name": "Get Tank Volume History By Site",
      "request": {
        "method": "GET",
        "header": [
          {
            "key": "Authorization",
            "value": "Bearer {{jwtToken}}",
            "type": "text"
          }
        ],
        "url": {
          "raw": "{{baseUrl}}/api/TankVolumeHistory/bySite?siteId=1&startDate=2025-07-01&endDate=2025-07-10",
          "host": [
            "{{baseUrl}}"
          ],
          "path": [
            "api",
            "TankVolumeHistory",
            "bySite"
          ],
          "query": [
            {
              "key": "siteId",
              "value": "1"
            },
            {
              "key": "startDate",
              "value": "2025-07-01"
            },
            {
              "key": "endDate",
              "value": "2025-07-10"
            }
          ]
        },
        "description": "Retrieves volume history for all tanks at a specific site within a date range"
      },
      "response": []
    }
  ],
  "event": [],
  "variable": [
    {
      "key": "baseUrl",
      "value": "http://localhost:5000",
      "type": "string"
    },
    {
      "key": "jwtToken",
      "value": "your_jwt_token_here",
      "type": "string"
    }
  ]
}
```

## Environment Variables

Set up a Postman environment with these variables:

- `baseUrl`: Your API base URL (e.g., `http://localhost:5000`)
- `jwtToken`: Your JWT authentication token
