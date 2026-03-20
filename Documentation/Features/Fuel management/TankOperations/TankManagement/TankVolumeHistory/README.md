# FMS Tank Volume History API Documentation

This folder contains comprehensive documentation and Postman resources for working with the FMS Tank Volume History API.

## Contents

1. **PostmanDocumentation.md** - Detailed API documentation including endpoints, parameters, and example responses
2. **TankVolumeHistoryAPI.postman_collection.json** - Importable Postman collection with ready-to-use API requests
3. **FMS_API_Environment.postman_environment.json** - Postman environment template with necessary variables

## Getting Started

### Setting Up Postman

1. Install [Postman](https://www.postman.com/downloads/) if you haven't already
2. Import the collection:
   - Click "Import" in Postman
   - Select the `TankVolumeHistoryAPI.postman_collection.json` file
3. Import the environment:
   - Click "Import" in Postman
   - Select the `FMS_API_Environment.postman_environment.json` file
4. Configure the environment:
   - Click the "Environments" tab in Postman
   - Select "FMS API Environment"
   - Update the `baseUrl` to match your deployment (default: `http://localhost:5000`)
   - Update the `jwtToken` with your valid authentication token
5. Make sure to select "FMS API Environment" from the environment dropdown in Postman before sending requests

### Available Endpoints

The Tank Volume History API provides the following endpoints:

- **GET /api/TankVolumeHistory** - Get all tank volume history entries
- **GET /api/TankVolumeHistory/byTankAndDateRange** - Get history for a specific tank within a date range
- **GET /api/TankVolumeHistory/byDateRange** - Get history across all tanks within a date range
- **GET /api/TankVolumeHistory/bySite** - Get history for all tanks at a specific site within a date range

For detailed information on each endpoint, including parameters and response formats, refer to the `PostmanDocumentation.md` file.

## Authentication

All endpoints require:
1. JWT Bearer authentication via the `Authorization` header
2. The `_Read_tankVolumeHistory` permission assigned to the user

## Understanding ChangeReason Values

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

## Example Usage

To get tank volume history for a specific tank between July 1-10, 2025:

1. Select the "Get Tank Volume History By Tank ID and Date Range" request
2. Make sure the query parameters are set correctly:
   - TankId: 1
   - startDate: 2025-07-01
   - endDate: 2025-07-10
3. Click "Send"

The API will return a JSON response with the tank's volume history data for the specified period.

## Error Handling

The API returns appropriate HTTP status codes and error messages:

- `400 Bad Request` - Invalid parameters (e.g., invalid ID or date range)
- `403 Forbidden` - Missing required permissions
- `404 Not Found` - Requested resource not found

## Further Help

For additional assistance, refer to the full API documentation or contact the development team.
