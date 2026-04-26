# GPS Device Mapping Implementation

## Overview
Implementation of GPS device fetching and vehicle-to-device mapping workflow for the FMS system. This allows users to fetch all GPS devices from tracking providers (GPSGate, etc.) and manually map them to FMS vehicles.

## Architecture Changes

### 1. Legacy Field Deprecation
**File**: `FMS.Domain/Entities/Features/VehicleManagement/Vehicle.cs`

Deprecated the following legacy GPS fields with `[Obsolete]` attribute:
- `HasGPSInstalled` (sbyte?) - Use `VehicleProviderMapping.IsActive` instead
- `GpsgategeneratedId` (sbyte?) - Use `VehicleProviderMapping.ExternalDeviceId` instead
- `DeviceId` (int?) - Use `VehicleProviderMapping.ExternalDeviceId` instead

**Migration Path**: These fields are kept for backward compatibility but should not be used in new code. All GPS tracking should use the `VehicleProviderMapping` table.

### 2. New DTOs Created
**File**: `FMS.Application/Features/VehicleTracking/DTOs/GPSDeviceDTO.cs`

#### GPSDeviceDTO
Complete GPS device information from tracking provider:
```csharp
public class GPSDeviceDTO
{
    public int Id { get; set; }                    // Provider's user/device ID
    public string Username { get; set; }           // Username in provider system
    public string Name { get; set; }               // Display name
    public string? IMEI { get; set; }             // Device IMEI
    public string? PhoneNumber { get; set; }      // SIM card number
    public string? DeviceType { get; set; }       // Device model
    public string? Protocol { get; set; }         // Communication protocol

    // Location data
    public decimal? Latitude { get; set; }
    public decimal? Longitude { get; set; }
    public decimal? Speed { get; set; }
    public decimal? Heading { get; set; }

    // Status
    public DateTime? LastPositionUpdate { get; set; }
    public DateTime? LastDeviceActivity { get; set; }
    public bool IsOnline { get; set; }

    // FMS Mapping
    public bool IsMapped { get; set; }
    public int? MappedVehicleId { get; set; }
    public string? MappedVehicleName { get; set; }
    public string? MappedVehicleNumberPlate { get; set; }
}
```

#### MapDeviceToVehicleRequest
Request model for mapping operations:
```csharp
public class MapDeviceToVehicleRequest
{
    public int VehicleId { get; set; }
    public string ProviderName { get; set; }
    public string ExternalDeviceId { get; set; }   // From GPSDeviceDTO.Id
    public string? DeviceIMEI { get; set; }
    public string? DeviceName { get; set; }
    public Dictionary<string, object>? Metadata { get; set; }
}
```

### 3. Provider Interface Extension
**File**: `FMS.Infrastructure/VehicleTracking/Interfaces/IVehicleTrackingProvider.cs`

Added new method to fetch all devices from provider:
```csharp
/// <summary>
/// Get all GPS devices/users from the provider system
/// Used for mapping devices to FMS vehicles
/// </summary>
Task<FMSResponse<List<GPSDeviceDTO>>> GetAllDevicesAsync();
```

### 4. GPSGate Implementation
**File**: `FMS.Infrastructure/VehicleTracking/Providers/GPSGateProvider.cs`

#### New API Models Added
```csharp
// Main user response from /applications/{id}/users
public class GPSGateUser
{
    public int Id { get; set; }
    public string? Username { get; set; }
    public string? Name { get; set; }
    public GPSGateTrackPoint? TrackPoint { get; set; }
    public string? DeviceActivity { get; set; }
    public List<GPSGateDeviceInfo>? Devices { get; set; }
}

// Track point data (position + velocity)
public class GPSGateTrackPoint
{
    public GPSGatePosition? Position { get; set; }
    public GPSGateVelocity? Velocity { get; set; }
    public string? UTC { get; set; }
    public bool Valid { get; set; }
}

// Device information
public class GPSGateDeviceInfo
{
    public string? IMEI { get; set; }
    public string? Name { get; set; }
    public string? ProtocolID { get; set; }
    public GPSGateMsisdn? Msisdn { get; set; }  // Phone number
    // ... additional fields
}
```

#### GetAllDevicesAsync Implementation
Workflow:
1. Call GPSGate API: `GET /applications/{applicationId}/users`
2. Retrieve all vehicle-provider mappings from database
3. For each GPSGate user:
   - Extract device info (IMEI, phone, type, protocol)
   - Extract position data (lat, long, speed, heading)
   - Check if device is mapped to an FMS vehicle
   - Build `GPSDeviceDTO` with all data + mapping status
4. Return complete list with mapped/unmapped counts

### 5. Backend API Endpoint
**File**: `FMS.WebClient/Controllers/VehicleManagement/ProviderManagementController.cs`

#### New Endpoint: GET /api/v1/providers/devices
```csharp
[HttpGet("devices")]
public async Task<IActionResult> GetAllProviderDevices([FromQuery] string? providerName = null)
```

**Parameters**:
- `providerName` (optional): Specific provider to query. Defaults to active/default provider.

**Response**:
```json
{
  "success": true,
  "data": [
    {
      "id": 21,
      "username": "PM05",
      "name": "KAM 585Z PM05",
      "imei": "050424063091910",
      "phoneNumber": "+254091586394",
      "deviceType": "Teltonika FMB640",
      "protocol": "Teltonika",
      "latitude": -1.3357316,
      "longitude": 36.8716116,
      "speed": 0,
      "heading": 334,
      "lastPositionUpdate": "2025-03-18T07:11:23Z",
      "lastDeviceActivity": "2025-03-18T11:22:17Z",
      "isOnline": true,
      "isMapped": true,
      "mappedVehicleId": 123,
      "mappedVehicleName": "TRK-001",
      "mappedVehicleNumberPlate": "KAM 585Z"
    }
  ],
  "totalDevices": 150,
  "mappedDevices": 120,
  "unmappedDevices": 30,
  "providerName": "GPSGate",
  "timestamp": "2025-10-28T12:00:00Z"
}
```

### 6. Database Enhancement
**File**: `FMS.Domain/Entities/VehicleTracking/VehicleProviderMappingEntity.cs`

Added Vehicle navigation property:
```csharp
[ForeignKey("VehicleId")]
public virtual Vehicle? Vehicle { get; set; }
```

This enables eager loading of vehicle data when fetching mappings:
```csharp
var mappings = await _context.VehicleProviderMappings
    .Include(m => m.ProviderConfiguration)
    .Include(m => m.Vehicle)
    .Where(m => m.IsActive)
    .ToListAsync();
```

## API Usage Examples

### Fetch All GPS Devices
```javascript
// Get devices from default provider
const response = await axiosInstance.get('/api/v1/providers/devices');

// Get devices from specific provider
const response = await axiosInstance.get('/api/v1/providers/devices?providerName=GPSGate');

// Response structure
{
  success: true,
  data: [...GPSDeviceDTO],
  totalDevices: 150,
  mappedDevices: 120,
  unmappedDevices: 30,
  providerName: "GPSGate"
}
```

### Map Device to Vehicle
```javascript
const request = {
  vehicleId: 123,
  providerName: "GPSGate",
  externalDeviceId: "21",          // From GPSDeviceDTO.Id
  deviceIMEI: "050424063091910",
  deviceName: "KAM 585Z PM05",
  metadata: {
    deviceType: "Teltonika FMB640",
    protocol: "Teltonika"
  }
};

await axiosInstance.post('/api/v1/providers/map-vehicle', request);
```

## Next Steps (Frontend Implementation)

### 1. Update VehicleAssignments Grid
Add columns to show GPS device information:
- **ExternalDeviceId**: Provider's device/user ID
- **Device IMEI**: Device identifier
- **Last Activity**: When device last communicated
- **Device Type**: GPS hardware model
- **Mapping Status**: Active/Inactive badge

### 2. Create Device Mapping UI
**Component**: `DeviceMappingPopup.js`

Features:
- **Left Grid**: All GPS devices from provider (searchable, filterable)
  - Show: Username, Name, IMEI, Last Activity, Online Status
  - Filter: Online only, Unmapped only, By protocol
  - Search: Name, IMEI, Username

- **Right Grid**: FMS Vehicles (searchable)
  - Show: VehicleCode, NumberPlate, VehicleType, Current Mapping
  - Filter: Unmapped only, By vehicle type, By site

- **Mapping Actions**:
  - Click device → Select vehicle → Map button
  - Batch mapping for multiple devices
  - Unmap existing mappings

### 3. Update ProviderConfigurationService
Enhance `MapVehicleToProviderAsync` to accept device metadata:
```csharp
public async Task<bool> MapVehicleToProviderAsync(
    int vehicleId,
    string providerName,
    string externalDeviceId,
    string? deviceIMEI = null,
    string? deviceName = null,
    Dictionary<string, object>? metadata = null,
    string? currentUser = null)
{
    // Store metadata in VehicleProviderMapping
    var mapping = new VehicleProviderMappingEntity
    {
        ExternalDeviceId = externalDeviceId,
        Metadata = JsonSerializer.Serialize(new {
            IMEI = deviceIMEI,
            DeviceName = deviceName,
            ...metadata
        })
    };
}
```

### 4. Add Metadata Column to Database
```sql
ALTER TABLE vehicle_provider_mappings
ADD COLUMN metadata JSON NULL COMMENT 'Additional device metadata (IMEI, type, etc.)';
```

## Testing Checklist

- [ ] GET /api/v1/providers/devices returns all GPSGate users
- [ ] Response includes correct mapping status (IsMapped, MappedVehicleId)
- [ ] Unmapped devices show null for mapping fields
- [ ] Mapped devices show correct vehicle info
- [ ] Position data (lat/long/speed) correctly extracted
- [ ] Device info (IMEI, phone, type) correctly extracted
- [ ] Last activity timestamps correctly parsed
- [ ] Online status correctly calculated
- [ ] Filter by provider name works
- [ ] Default provider used when providerName omitted

## Migration Notes

### Deprecation Timeline
1. **Phase 1** (Current): Mark legacy fields as `[Obsolete]`, keep data intact
2. **Phase 2** (Next release): Migrate data from `Vehicle.DeviceId` → `VehicleProviderMapping.ExternalDeviceId`
3. **Phase 3** (Future): Remove obsolete fields from database schema

### Data Migration Script
```sql
-- Migrate existing GPS device mappings to VehicleProviderMapping
INSERT INTO vehicle_provider_mappings (vehicle_id, provider_config_id, external_device_id, is_active, created_at)
SELECT
    v.VehicleId,
    (SELECT id FROM provider_configurations WHERE name = 'GPSGate' LIMIT 1),
    v.DeviceId,
    1,
    NOW()
FROM vehicles v
WHERE v.HasGPSInstalled = 1
  AND v.DeviceId IS NOT NULL
  AND NOT EXISTS (
      SELECT 1 FROM vehicle_provider_mappings m
      WHERE m.vehicle_id = v.VehicleId
  );
```

## Benefits

1. **Multi-Provider Support**: One vehicle can potentially use different providers over time
2. **Better Metadata**: Store IMEI, device type, protocol in mapping table
3. **Audit Trail**: Track who mapped devices and when
4. **Soft Delete**: Can deactivate mappings without losing history
5. **Extensibility**: Easy to add new providers (Geotab, Traccar, etc.)
6. **User-Friendly**: UI shows which devices are unmapped, searchable by IMEI
7. **Real-Time Data**: Shows current online status, last activity, position

## Related Files

### Backend
- `FMS.Domain/Entities/Features/VehicleManagement/Vehicle.cs` - Deprecated fields
- `FMS.Application/Features/VehicleTracking/DTOs/GPSDeviceDTO.cs` - New DTOs
- `FMS.Infrastructure/VehicleTracking/Interfaces/IVehicleTrackingProvider.cs` - Interface
- `FMS.Infrastructure/VehicleTracking/Providers/GPSGateProvider.cs` - Implementation
- `FMS.Domain/Entities/VehicleTracking/VehicleProviderMappingEntity.cs` - Navigation property
- `FMS.WebClient/Controllers/VehicleManagement/ProviderManagementController.cs` - API endpoint

### Frontend (To Be Created)
- `fms.frontend/src/pages/vehiclemanagement/components/DeviceMappingPopup.js`
- `fms.frontend/src/pages/vehiclemanagement/VehicleAssignments.js` (update)
- `fms.frontend/src/api/vehicleTrackingClient.js` (add getProviderDevices method)

## Author
Implementation Date: October 28, 2025
Feature: GPS Device Mapping for Multi-Provider Support
