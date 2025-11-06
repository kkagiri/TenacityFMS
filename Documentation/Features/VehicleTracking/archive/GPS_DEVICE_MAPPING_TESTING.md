# GPS Device Mapping - Quick Testing Guide

## Prerequisites

1. **Database Migration Applied**
   ```sql
   USE gpsdata;
   DESCRIBE vehicle_provider_mappings;
   -- Verify columns: device_imei, device_name, device_type, metadata
   ```

2. **Backend Running**
   - FMS.WebClient API running
   - GPSGate provider configured

3. **Frontend Running**
   ```bash
   cd fms.frontend
   npm start
   ```

## Quick Test Scenarios

### Scenario 1: View GPS Devices

**Steps:**
1. Navigate to Provider Management → Vehicle Assignments
2. Click "Map GPS Devices" button
3. Wait for popup to load

**Expected:**
- Popup opens with two grids
- Left grid shows GPS devices from GPSGate
- Device columns: Username, Name, IMEI, Phone, Type, Online, Last Activity, Position, Mapped To
- Right grid shows FMS vehicles
- Vehicle columns: ID, Vehicle Name, Number Plate, Type

**Verify:**
- Devices load successfully
- Online status shows green/gray indicators
- Last Activity shows relative time (e.g., "5m ago")
- Position shows lat/long or "No position"
- Unmapped devices show "Not mapped"

---

### Scenario 2: Filter Devices

**Steps:**
1. In Device Mapping popup
2. Toggle "Show online devices only"
3. Toggle "Show unmapped devices only"
4. Use search box to find specific IMEI

**Expected:**
- Grid filters correctly
- Device count updates in header
- Search highlights matching devices

**Verify:**
- Online filter shows only online devices
- Unmapped filter hides already mapped devices
- Search finds devices by IMEI, name, or username

---

### Scenario 3: Map Device to Vehicle

**Steps:**
1. Click on a device in left grid (unmapped device)
2. Click on a vehicle in right grid
3. Verify action bar shows selection details
4. Click "Map Device to Vehicle" button
5. Wait for success notification

**Expected:**
- Device row highlights in blue
- Vehicle row highlights in blue
- Action bar shows: "Ready to map [Device Name] (IMEI: xxx) to [Vehicle Name] (Plate)"
- Button enabled
- Success notification: "Successfully mapped device X to vehicle Y"
- Grid refreshes automatically
- Device now shows "Mapped To: [Vehicle Name]"

**Verify:**
- Notification appears
- Device shows as mapped
- Vehicle appears in "Mapped To" column
- Close popup and check VehicleAssignments grid
- Device columns populated with IMEI, Name, Mapped At

---

### Scenario 4: Unmap Device

**Steps:**
1. In Device Mapping popup
2. Find a device that's already mapped
3. Click "Unmap" button in "Mapped To" column
4. Wait for confirmation

**Expected:**
- Success notification: "Successfully unmapped device from [Vehicle Name]"
- Grid refreshes
- Device shows "Not mapped" again
- Vehicle removed from mapping

**Verify:**
- Device becomes available for mapping
- VehicleAssignments grid updates
- Database mapping set to inactive

---

### Scenario 5: Verify in VehicleAssignments Grid

**Steps:**
1. Close Device Mapping popup
2. Look at VehicleAssignments grid
3. Find the vehicle you just mapped

**Expected:**
- Grid shows new columns:
  - Device ID (external device ID)
  - Device IMEI (formatted in mono font)
  - Device Name
  - Mapped At (datetime)
- Vehicle row shows device information
- All data matches what you saw in mapping popup

**Verify:**
- Device ID matches GPSGate user ID
- IMEI matches device IMEI
- Device Name matches
- Mapped At shows recent timestamp

---

### Scenario 6: Database Verification

**Query:**
```sql
SELECT
    vpm.id,
    vpm.vehicle_id,
    v.hyoung_no,
    vpm.external_device_id,
    vpm.device_imei,
    vpm.device_name,
    vpm.device_type,
    vpm.metadata,
    pc.name AS provider_name,
    vpm.is_active,
    vpm.created_at,
    vpm.created_by
FROM vehicle_provider_mappings vpm
INNER JOIN vehicles v ON vpm.vehicle_id = v.vehicle_id
INNER JOIN provider_configurations pc ON vpm.provider_config_id = pc.id
WHERE vpm.is_active = 1
ORDER BY vpm.created_at DESC
LIMIT 5;
```

**Expected:**
- Recent mapping appears
- `device_imei` populated
- `device_name` populated
- `device_type` populated
- `metadata` contains JSON with username, protocol, phone, etc.

**Verify:**
- Data matches what you entered
- Metadata JSON is valid
- created_by shows your user ID

---

## API Testing (Optional)

### Test Endpoint 1: Get Devices

```bash
curl -X GET "http://localhost:5000/api/v1/providers/devices?providerName=GPSGate" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Expected Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "12345",
      "username": "vehicle_001",
      "name": "Device 001",
      "imei": "123456789012345",
      "phoneNumber": "+1234567890",
      "deviceType": "GPS Tracker",
      "isOnline": true,
      "isMapped": false,
      "mappedVehicleId": null
    }
  ],
  "totalDevices": 150,
  "mappedDevices": 45,
  "unmappedDevices": 105
}
```

### Test Endpoint 2: Map Device

```bash
curl -X POST "http://localhost:5000/api/v1/providers/mappings/device" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "vehicleId": 123,
    "providerName": "GPSGate",
    "externalDeviceId": "12345",
    "deviceIMEI": "123456789012345",
    "deviceName": "Device 001",
    "deviceType": "GPS Tracker"
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Vehicle 123 mapped to device 12345 successfully",
  "data": {
    "vehicleId": 123,
    "providerName": "GPSGate",
    "externalDeviceId": "12345",
    "deviceIMEI": "123456789012345",
    "deviceName": "Device 001"
  }
}
```

---

## Troubleshooting

### Issue: Devices not loading

**Check:**
1. API endpoint returns 200 OK
2. GPSGate provider credentials correct
3. Network tab shows successful API call
4. Console for JavaScript errors

**Solution:**
- Verify GPSGate configuration in database
- Check API logs for errors
- Ensure provider_configurations.is_enabled = true

---

### Issue: Mapping fails

**Check:**
1. API returns 500 error
2. Database connection working
3. User has valid JWT token
4. Vehicle exists and is active

**Solution:**
- Check API logs for detailed error
- Verify vehicle_id exists in vehicles table
- Ensure provider_config_id valid

---

### Issue: Grid not refreshing

**Check:**
1. Redux state updates
2. fetchProviderMappings called after mapping
3. Mappings endpoint returns updated data

**Solution:**
- Force refresh by closing and reopening popup
- Check Redux DevTools for state changes
- Verify API endpoint returns latest mappings

---

## Success Criteria ✅

Mark each as complete after testing:

- [ ] Device Mapping popup opens successfully
- [ ] GPS devices load from GPSGate
- [ ] Online status displays correctly
- [ ] Filter controls work (online, unmapped)
- [ ] Search finds devices by IMEI/name
- [ ] Device selection highlights row
- [ ] Vehicle selection highlights row
- [ ] Map button creates mapping
- [ ] Success notification appears
- [ ] Grid refreshes after mapping
- [ ] Unmap button removes mapping
- [ ] VehicleAssignments grid shows device columns
- [ ] Database stores device metadata
- [ ] Metadata JSON is valid
- [ ] Multiple devices can be mapped to different vehicles
- [ ] Remapping same device to different vehicle works
- [ ] Position data displays when available

---

## Test Data

### Sample GPSGate Response
```json
[
  {
    "Id": 12345,
    "Username": "vehicle_001",
    "Name": "Test Vehicle 001",
    "TrackPoint": {
      "Position": {
        "Latitude": 37.7749,
        "Longitude": -122.4194,
        "Altitude": 50
      },
      "Velocity": {
        "Speed": 45.5,
        "Heading": 180
      },
      "UTC": "2025-01-28T10:30:00Z",
      "Valid": true
    },
    "DeviceActivity": "2025-01-28T10:35:00Z",
    "Devices": [
      {
        "Id": 67890,
        "Name": "GPS Device 001",
        "IMEI": "123456789012345",
        "Msisdn": {
          "Raw": "+1234567890"
        },
        "ProtocolID": 5,
        "DeviceDefinitionID": 10
      }
    ]
  }
]
```

---

## Performance Metrics

Target performance:

- **Device Load Time:** < 3 seconds for 500 devices
- **Mapping Operation:** < 1 second
- **Grid Refresh:** < 2 seconds
- **Search Response:** < 500ms

Monitor in Network tab and console timings.

---

**Date:** January 28, 2025
**Version:** 1.0
**Status:** Ready for Testing
