# Vehicle GPS Offline Alert Feature

## Overview

This feature automatically creates alerts/notifications when a vehicle is fueled but its GPS device is offline or hasn't reported its location for a configurable period of time.

## Use Case

When a vehicle with GPS tracking is fueled (either manually or via automated PTS system), the system checks:
1. If the vehicle has an active GPS tracking device configured
2. If the GPS device is currently offline OR hasn't reported location data for more than X days (configurable)

If either condition is true, an alert notification is created to inform operators that the vehicle was fueled with an offline/stale GPS.

## Configuration

The GPS offline threshold can be configured via the `SystemConfigurations` table:

| Configuration Key | Default Value | Description |
|---|---|---|
| `Vehicle.GpsOfflineAlertThresholdDays` | 2 | Number of days without GPS activity before triggering an alert |

### Setting the Threshold

```sql
-- Update the threshold to 3 days
UPDATE SystemConfigurations
SET ConfigurationValue = '3'
WHERE ConfigurationKey = 'Vehicle.GpsOfflineAlertThresholdDays';
```

## Alert Details

When triggered, the alert contains the following information:

| Field | Description |
|---|---|
| **Alarm Type** | `VehicleGpsOfflineDuringFueling` |
| **Category** | `Vehicle` |
| **Priority** | `High` |
| **Message** | Includes vehicle number, days since last GPS activity, and last seen timestamp |

### Alert Data Payload

```json
{
    "VehicleId": 123,
    "VehicleNo": "H1234",
    "SiteId": 5,
    "FuelAmount": 45.5,
    "LastSeenUtc": "2024-01-15T10:30:00Z",
    "DaysSinceLastSeen": 3,
    "ThresholdDays": 2,
    "DeviceId": "GPS-12345",
    "DeviceName": "Vehicle GPS Device",
    "FuelingTime": "2024-01-18T14:00:00Z"
}
```

## Integration Points

The GPS offline alert is triggered from two locations:

### 1. Manual Fuel Refills (`CreateFuelRrefillCommand`)

When a user creates a manual fuel refill entry, the system:
1. Creates the fuel refill record
2. Checks vehicle site auto-assignment
3. **Checks GPS offline status and creates alert if needed**

### 2. Automated PTS Transactions (`TransactionCompletionService`)

When an automated pump transaction is completed:
1. Transaction is saved to database
2. **Checks GPS offline status and creates alert if needed**

## Files Modified

### New Files
- `FMS.Application/Features/Vehicle/Services/IVehicleGpsOfflineAlertService.cs` - Interface definition
- `FMS.Application/Features/Vehicle/Services/VehicleGpsOfflineAlertService.cs` - Implementation
- `Documentation/database_migrations/20250701_gps_offline_alert_config.sql` - Configuration migration

### Modified Files - Backend
- `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs` - DI registration
- `FMS.Application/Features/TankManagement/FuelRefill/Commands/CreateFuelRrefillCommand.cs` - Manual refill integration
- `FMS.Application/Services/TransactionCompletionService.cs` - Automated transaction integration

### Modified Files - Frontend
- `fms.frontend/src/redux/types/activeAlarmTypes.js` - Added `VEHICLE_GPS_OFFLINE_DURING_FUELING` alarm type
- `fms.frontend/src/pages/activeAlarms/components/shared/AlarmCard.js` - Added GPS offline icon mapping
- `fms.frontend/src/components/notifications/NotificationCenter.js` - Added GPS offline notification icon

## Dependencies

The service depends on:
- **IGPSService** - To get vehicle's last known location and online status
- **INotificationService** - To create alarm notifications
- **GpsdataContext** - To check vehicle GPS provider mappings and configuration

## Error Handling

- If the GPS service is unavailable, the alert check is skipped (doesn't block fueling)
- If notification creation fails, error is logged but fueling continues
- If the vehicle doesn't have GPS configured, no alert is created (check skipped)

## Logging

The service logs:
- **Debug**: When GPS is online (no alert needed)
- **Warning**: When GPS offline alert is created
- **Error**: When GPS check or notification creation fails

## Testing

To test the feature:

1. **Ensure a vehicle has GPS tracking configured** (exists in `VehicleProviderMappings` with `IsActive = true`)

2. **Simulate offline GPS** by ensuring the vehicle hasn't had location updates for > threshold days

3. **Create a fuel refill** for the vehicle (manual or PTS)

4. **Verify notification was created** in the Notifications section

```sql
-- Check recent GPS offline alerts
SELECT * FROM Notifications
WHERE AlarmType = 'VehicleGpsOfflineDuringFueling'
ORDER BY CreatedAt DESC
LIMIT 10;
```

## API Response

The `IVehicleGpsOfflineAlertService.CheckAndAlertIfGpsOfflineAsync` method returns a `VehicleGpsAlertResult`:

```csharp
public class VehicleGpsAlertResult
{
    public bool AlertCreated { get; set; }      // True if alert was created
    public bool VehicleHasGps { get; set; }     // True if vehicle has GPS configured
    public bool IsGpsOffline { get; set; }      // True if GPS is offline/stale
    public string? AlertType { get; set; }      // Type of alert created
    public DateTime? LastSeenUtc { get; set; }  // When GPS was last seen
    public int? DaysSinceLastSeen { get; set; } // Days since last GPS activity
    public string? Message { get; set; }        // Alert message or status
}
```
