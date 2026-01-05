# Location-Based Fueling Validation

## Overview

The Location Validation feature ensures that fueling operations only occur when the vehicle receiving fuel and/or the mobile app operator are physically present at the fuel dispenser location. This prevents remote authorization fraud and ensures compliance with site-specific fueling policies.

## Key Concepts

### Tank Types

| Type             | Description                           | Location Source                                 |
| ---------------- | ------------------------------------- | ----------------------------------------------- |
| **Stationary**   | Fixed tank at a depot or fuel station | Configured GPS coordinates (Latitude/Longitude) |
| **MobileTanker** | Fuel bowser/tanker truck              | Linked vehicle's real-time GPS location         |

### Proximity Checks

1. **Vehicle Proximity**: Ensures the vehicle receiving fuel is near the dispenser
2. **Mobile App Proximity**: Ensures the operator's mobile device is near the dispenser

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Mobile App / Frontend                        │
│    Sends: TankId, VehicleId, MobileLocation (lat/lng/accuracy)  │
└─────────────────────────────────────────┬───────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                    PumpAuthorizeCommand                          │
│    Step 3: Location Validation (after nozzle & stuck checks)   │
└─────────────────────────────────────────┬───────────────────────┘
                                          │
                                          ▼
┌─────────────────────────────────────────────────────────────────┐
│                  ILocationValidationService                      │
│                                                                  │
│  1. Check if PTS device has EnableLocationValidation = true     │
│  2. Get tank location (static or from linked vehicle GPS)       │
│  3. Check vehicle proximity (if RequireVehicleProximity)        │
│  4. Check mobile proximity (if RequireMobileAppProximity)       │
│  5. Return validation result with distances                     │
└─────────────────────────────────────────┬───────────────────────┘
                                          │
                              ┌───────────┴───────────┐
                              │                       │
                              ▼                       ▼
                    ┌─────────────────┐     ┌─────────────────┐
                    │  GPS Provider   │     │  Mobile Device  │
                    │  (GPSGate)      │     │  Geolocation    │
                    │                 │     │                 │
                    │ Vehicle location│     │ Operator loc    │
                    └─────────────────┘     └─────────────────┘
```

## Database Schema

### Tank Table (Enhanced)

```sql
-- New columns added to 'tank' table
TankType          ENUM('Stationary', 'MobileTanker') -- Type of tank
Latitude          DECIMAL(10, 8)                     -- GPS latitude (stationary)
Longitude         DECIMAL(11, 8)                     -- GPS longitude (stationary)
LinkedVehicleId   INT                                -- FK to vehicle (mobile tanker)
LocationValidationRadius INT DEFAULT 100             -- Override radius in meters
```

### PTS Device Table (Enhanced)

```sql
-- New columns added to 'ptsdevice' table
EnableLocationValidation    TINYINT(1) DEFAULT 0  -- Master switch
RequireVehicleProximity     TINYINT(1) DEFAULT 0  -- Check vehicle GPS
RequireMobileAppProximity   TINYINT(1) DEFAULT 0  -- Check mobile device
VehicleProximityRadius      INT DEFAULT 100       -- Vehicle radius (meters)
MobileAppProximityRadius    INT DEFAULT 50        -- Mobile radius (meters)
BypassOnGPSFailure          TINYINT(1) DEFAULT 1  -- Allow if GPS unavailable
MinimumGPSAccuracy          INT DEFAULT 20        -- Min GPS accuracy (meters)
ProximityGracePeriodMeters  INT DEFAULT 10        -- Grace tolerance (meters)
```

## Configuration

### PTS Device Settings

Settings are configured per PTS device in the admin UI:

| Setting                          | Description                              | Default |
| -------------------------------- | ---------------------------------------- | ------- |
| **Enable Location Validation**   | Master switch for all location checks    | Off     |
| **Require Vehicle Proximity**    | Vehicle must be near tank                | Off     |
| **Require Mobile App Proximity** | Operator device must be near tank        | Off     |
| **Vehicle Proximity Radius**     | Maximum distance for vehicle (meters)    | 100     |
| **Mobile App Proximity Radius**  | Maximum distance for operator (meters)   | 50      |
| **Bypass on GPS Failure**        | Allow fueling if GPS unavailable         | On      |
| **Minimum GPS Accuracy**         | Required GPS accuracy threshold (meters) | 20      |
| **Proximity Grace Period**       | Tolerance added to radius (meters)       | 10      |

### System Configurations

Global defaults in `systemconfigurations` table:

| Key                                          | Default | Description                                       |
| -------------------------------------------- | ------- | ------------------------------------------------- |
| `FuelingRules.EnableLocationValidation`      | false   | Global enable/disable                             |
| `FuelingRules.DefaultVehicleProximityRadius` | 100     | Default vehicle radius                            |
| `FuelingRules.DefaultMobileProximityRadius`  | 50      | Default mobile radius                             |
| `FuelingRules.AllowNonGPSVehicles`           | true    | Allow vehicles without GPS                        |
| `FuelingRules.BypassOnGPSFailure`            | true    | Graceful degradation                              |
| `FuelingRules.MinimumGPSAccuracy`            | 20      | Min accuracy in meters (configurable in frontend) |
| `FuelingRules.ProximityGracePeriodMeters`    | 10      | Grace period tolerance                            |
| `FuelingRules.AllowCachedMobileLocation`     | true    | Allow cached location when offline                |
| `FuelingRules.EnableLocationAuditLog`        | true    | Log all validations for audit                     |

## API Changes

### Pump Authorize Request

```json
POST /api/v1/Pump/authorize
{
    "deviceId": "PTS-001",
    "pumpId": 1,
    "nozzle": 1,
    "tankId": 5,
    "vehicleId": 123,
    "dose": 50,
    "mobileLocation": {
        "latitude": -1.286389,
        "longitude": 36.817223,
        "accuracy": 10,
        "isCached": false
    }
}
```

### Validation Failure Response

```json
{
  "success": false,
  "message": "Location validation failed",
  "validationErrors": [
    "⚠️ Location validation failed",
    "Vehicle is 523m away, must be within 100m"
  ]
}
```

## Mobile App Integration

The mobile app needs to:

1. **Add Geolocation Package**

   ```bash
   npm install react-native-geolocation-service
   ```

2. **Request Location Permission**

   ```javascript
   import Geolocation from "react-native-geolocation-service";

   const getCurrentLocation = async () => {
     return new Promise((resolve, reject) => {
       Geolocation.getCurrentPosition(
         (position) =>
           resolve({
             latitude: position.coords.latitude,
             longitude: position.coords.longitude,
             accuracy: position.coords.accuracy,
           }),
         (error) => reject(error),
         { enableHighAccuracy: true, timeout: 15000 }
       );
     });
   };
   ```

3. **Include in Authorization Request**
   ```javascript
   const authorizeParams = {
     deviceId: selectedDevice,
     pumpId: selectedPump,
     tankId: selectedTank,
     vehicleId: selectedVehicle,
     mobileLocation: await getCurrentLocation(),
   };
   ```

## Distance Calculation

Uses the **Haversine formula** for accurate great-circle distance:

```csharp
public double CalculateDistanceMeters(GeoLocation point1, GeoLocation point2)
{
    const double EarthRadiusMeters = 6371000;

    var lat1Rad = DegreesToRadians((double)point1.Latitude);
    var lat2Rad = DegreesToRadians((double)point2.Latitude);
    var deltaLat = DegreesToRadians((double)(point2.Latitude - point1.Latitude));
    var deltaLon = DegreesToRadians((double)(point2.Longitude - point1.Longitude));

    var a = Math.Sin(deltaLat / 2) * Math.Sin(deltaLat / 2) +
            Math.Cos(lat1Rad) * Math.Cos(lat2Rad) *
            Math.Sin(deltaLon / 2) * Math.Sin(deltaLon / 2);

    var c = 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));

    return EarthRadiusMeters * c;
}
```

## Validation Flow

```
1. Check if PTS device has EnableLocationValidation = true
   └── If false → Skip all location checks, allow authorization

2. Get tank location
   ├── If Stationary → Use Tank.Latitude/Longitude
   └── If MobileTanker → Get LinkedVehicle's GPS location (always fresh, no cache)

3. If tank location unavailable
   ├── If BypassOnGPSFailure = true → Allow (with warning)
   └── If BypassOnGPSFailure = false → Reject

4. If RequireVehicleProximity = true AND VehicleId provided
   ├── Get vehicle GPS from GPSGate
   ├── Validate GPS accuracy against MinimumGPSAccuracy threshold (default 20m)
   ├── Calculate distance to tank
   ├── Apply grace period (effectiveRadius = VehicleProximityRadius + ProximityGracePeriodMeters)
   ├── If within effectiveRadius → Pass
   ├── If vehicle has no GPS → Allow (non-GPS vehicles permitted to fuel)
   └── If distance exceeds effectiveRadius → Reject (unless bypass enabled)

5. If RequireMobileAppProximity = true
   ├── Use MobileLocation from request (can be cached for offline mode)
   ├── Check if AllowCachedMobileLocation is enabled for cached locations
   ├── Calculate distance to tank
   ├── Apply grace period (effectiveRadius = MobileAppProximityRadius + ProximityGracePeriodMeters)
   ├── If within effectiveRadius → Pass
   └── If distance exceeds effectiveRadius → Reject (unless bypass enabled)

6. Log validation result to audit trail (location_validation_log table)

7. If all checks pass → Allow authorization
```

## Grace Period & Accuracy Behavior

### GPS Accuracy Threshold

- **Default**: 20 meters
- **Configurable**: Per PTS device via `MinimumGPSAccuracy` column
- **Behavior**: If GPS accuracy exceeds threshold, a warning is logged but validation continues
- **Frontend**: Configurable in PTS device settings (TODO: specify exact location)

### Grace Period Tolerance

- **Default**: 10 meters
- **Purpose**: Allows minor boundary tolerance for vehicles near the edge of the allowed radius
- **Formula**: `effectiveRadius = allowedRadius + gracePeriodMeters`
- **Example**: If radius is 50m and grace period is 10m, vehicles up to 60m away will pass

### Offline Mode (Mobile App)

- **Feature**: Mobile app can send cached location when offline
- **Detection**: `isCached: true` in the mobileLocation JSON
- **Control**: Enabled via `AllowCachedMobileLocation` system configuration
- **Audit**: Cached status is logged in the audit trail

## Fallback Scenarios

| Scenario                           | Behavior                                       |
| ---------------------------------- | ---------------------------------------------- |
| Tank has no GPS coordinates        | Bypass (if enabled) or reject                  |
| Mobile tanker's vehicle has no GPS | Bypass (if enabled) or reject                  |
| Vehicle receiving fuel has no GPS  | **Allow** (non-GPS vehicles permitted to fuel) |
| Mobile app doesn't send location   | Bypass (if enabled) or reject                  |
| GPS accuracy > threshold           | Warning logged, validation continues           |
| Mobile sends cached location       | Allow if AllowCachedMobileLocation enabled     |
| Vehicle at boundary + grace period | Allow (grace period tolerance applied)         |

## Audit Logging

All location validations are logged to `location_validation_log` table for comprehensive audit purposes:

### Fields Logged

| Category             | Fields                                                                            |
| -------------------- | --------------------------------------------------------------------------------- |
| **Timing**           | ValidationTimestamp                                                               |
| **Tank Location**    | TankId, TankLatitude, TankLongitude                                               |
| **Vehicle Location** | VehicleId, VehicleLatitude, VehicleLongitude, VehicleDistance, VehicleGPSAccuracy |
| **Mobile Location**  | MobileLatitude, MobileLongitude, MobileDistance, MobileLocationCached             |
| **GPS Quality**      | MinimumGPSAccuracyRequired, GPSAccuracyValid                                      |
| **Settings Used**    | VehicleRadiusUsed, MobileRadiusUsed, GracePeriodMetersUsed, BypassOnGPSFailure    |
| **Result**           | IsValid, FailureReason                                                            |
| **Context**          | PtsDeviceId, TransactionId, UserId, AdditionalContext (JSON)                      |

### Enable/Disable

Control via `EnableLocationAuditLog` system configuration:

```sql
INSERT INTO system_configuration (ConfigKey, ConfigValue, Category, Description)
VALUES ('EnableLocationAuditLog', 'true', 'LocationValidation', 'Enable detailed audit logging');
```

### Retention

Consider implementing a cleanup job for old audit records (e.g., delete records older than 90 days).

## Files Created/Modified

### New Files

- `FMS.Domain/Entities/Enums/TankType.cs` - TankType enum (Stationary, MobileTanker)
- `FMS.Domain/Entities/Features/LocationValidation/LocationValidationLog.cs` - Audit log entity
- `FMS.Application/Features/LocationValidation/DTOs/LocationValidationDTOs.cs` - GeoLocation, Request, Result DTOs
- `FMS.Application/Features/LocationValidation/Services/ILocationValidationService.cs` - Service interface
- `FMS.Application/Features/LocationValidation/Services/LocationValidationService.cs` - Core validation service
- `FMS.Application/Features/LocationValidation/Extensions/LocationValidationServiceExtensions.cs` - DI registration
- `FMS.Persistence/EntityConfigurations/LocationValidationLogConfiguration.cs` - EF Core audit log config
- `Documentation/Features/LocationValidation/database/01_location_validation_schema.sql` - Database migration

### Modified Files

- `FMS.Domain/Entities/Features/TankStockManagement/Tank.cs` - Added Latitude, Longitude, TankType, LinkedVehicleId
- `FMS.Domain/Entities/Features/PTS/Ptsdevice.cs` - Added all location validation settings (9 new columns)
- `FMS.Persistence/EntityConfigurations/TankConfiguration.cs` - EF Core configuration for location columns
- `FMS.Persistence/EntityConfigurations/PtsdeviceConfiguration.cs` - EF Core configuration for validation settings
- `FMS.Persistence/DataAccess/GpsdataContext.cs` - Added DbSet<LocationValidationLog>
- `FMS.Application/Command/PTSCommand/PumpCommands/PumpAuthorizeCommand.cs` - Integrated validation

## Frontend Changes Required

### PTS Device Detail Page

Add location validation settings section:

- Toggle: Enable Location Validation
- Toggle: Require Vehicle Proximity (with radius input)
- Toggle: Require Mobile App Proximity (with radius input)
- Toggle: Bypass on GPS Failure

### Tank Management

Add location configuration:

- Dropdown: Tank Type (Stationary / Mobile Tanker)
- For Stationary: Map picker with lat/lng and radius
- For Mobile Tanker: Vehicle selector (GPS-enabled vehicles only)

## Testing

### Unit Tests

- Distance calculation accuracy
- Validation logic branches
- Bypass scenarios

### Integration Tests

- Full authorization flow with location
- GPS provider integration
- Mobile app location handling

### Manual Testing

1. Configure a PTS device with location validation enabled
2. Set up a stationary tank with GPS coordinates
3. Attempt authorization with vehicle outside radius → Should fail
4. Move vehicle within radius → Should pass
5. Test mobile app proximity similarly
6. Test bypass when GPS unavailable
