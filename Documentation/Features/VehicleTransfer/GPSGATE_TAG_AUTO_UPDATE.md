# GPSGate Tag Auto-Update on Vehicle Transfer

## Overview

This feature automatically updates GPSGate tag assignments when vehicles are transferred between sites. When a vehicle transfer is marked as "Completed", the system:

1. Removes the vehicle from the source site's GPSGate tag (if configured)
2. Adds the vehicle to the destination site's GPSGate tag

This ensures that GPSGate monitoring views are automatically updated to reflect the current vehicle locations.

## Architecture

### Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Application Layer                              │
├─────────────────────────────────────────────────────────────────────────┤
│  UpdateVehicleTransferStatusCommand                                     │
│  - Handles status updates for vehicle transfers                         │
│  - When status = "Completed", triggers GPSGate tag update               │
│  └─> IGpsGateTagTransferService (Interface in Application)              │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                         Infrastructure Layer                             │
├─────────────────────────────────────────────────────────────────────────┤
│  GpsGateTagTransferServiceAdapter                                       │
│  - Implements IGpsGateTagTransferService                                │
│  └─> IGpsGateTagManagementService                                       │
│                                                                         │
│  GpsGateTagManagementService                                            │
│  - AddUserToTagAsync(gpsGateUserId, tagId)                              │
│  - RemoveUserFromTagAsync(gpsGateUserId, tagId)                         │
│  - MoveUserBetweenTagsAsync(gpsGateUserId, fromTagId, toTagId)          │
│  - MoveVehicleBetweenSiteTagsAsync(vehicleId, fromSiteId, toSiteId)     │
│  └─> GPSGate REST API                                                   │
└─────────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                            GPSGate API                                   │
├─────────────────────────────────────────────────────────────────────────┤
│  POST   /applications/{appId}/tags/{tagId}/users  (Add user to tag)     │
│  DELETE /applications/{appId}/tags/{tagId}/users/{userId}  (Remove)     │
└─────────────────────────────────────────────────────────────────────────┘
```

### Database Schema Changes

**Site Table** - Added fields:

| Column | Type | Description |
|--------|------|-------------|
| `gps_gate_tag_id` | INT(11) NULL | The GPSGate tag ID for this site |
| `gps_gate_tag_name` | VARCHAR(100) NULL | Tag name for display purposes |
| `auto_update_gps_gate_tag` | TINYINT(1) DEFAULT 1 | Enable/disable auto-update |

## Configuration

### 1. Run Database Migration

```sql
-- Add GPSGate tag fields to site table
ALTER TABLE `site`
ADD COLUMN `gps_gate_tag_id` INT(11) NULL,
ADD COLUMN `gps_gate_tag_name` VARCHAR(100) NULL,
ADD COLUMN `auto_update_gps_gate_tag` TINYINT(1) NOT NULL DEFAULT 1;
```

### 2. Configure Site Tags

Retrieve available tags from GPSGate:
```
GET /applications/12/tags
```

Then configure each site:
```sql
UPDATE site SET
    gps_gate_tag_id = 123,
    gps_gate_tag_name = 'HE_Meru'
WHERE name = 'Meru';

UPDATE site SET
    gps_gate_tag_id = 124,
    gps_gate_tag_name = 'HE_Fujita'
WHERE name = 'Fujita';
```

### 3. Disable Auto-Update for Specific Sites (Optional)

```sql
UPDATE site SET auto_update_gps_gate_tag = 0 WHERE name = 'Workshop';
```

## How It Works

### Transfer Flow

1. User creates a vehicle transfer (FromSite → ToSite)
2. Transfer goes through status workflow: `Pending` → `InTransit` → `Completed`
3. When status changes to `Completed`:
   - System looks up GPSGate tag IDs for both sites
   - Gets the vehicle's GPSGate user ID from `VehicleProviderMappings`
   - Calls GPSGate API to add vehicle to new site's tag
   - Calls GPSGate API to remove vehicle from old site's tag

### GPSGate User ID Resolution

The system resolves GPSGate user IDs in this order:
1. **VehicleProviderMappings.ExternalDeviceId** - Primary source
2. **GPSGate Tags Search** - Fallback: searches all tags for matching vehicle name

## Error Handling

- Tag update failures **do not** fail the transfer operation
- All errors are logged for troubleshooting
- Manual correction can be done through GPSGate admin interface

## Files

### Application Layer
- [UpdateVehicleTransferStatusCommand.cs](../../FMS.Application/Features/VehicleTransfer/Commands/UpdateVehicleTransferStatusCommand.cs)
  - Contains `IGpsGateTagTransferService` interface
  - Calls tag transfer on transfer completion

### Infrastructure Layer
- [IGpsGateTagManagementService.cs](../../FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/IGpsGateTagManagementService.cs)
  - Interface for tag management operations
- [GpsGateTagManagementService.cs](../../FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/GpsGateTagManagementService.cs)
  - Implementation using GPSGate REST API
- [GpsGateTagTransferServiceAdapter.cs](../../FMS.Infrastructure/ExternalServices/GPS/GPSGate/Services/GpsGateTagTransferServiceAdapter.cs)
  - Adapter bridging Application and Infrastructure layers

### Domain Layer
- [Site.cs](../../FMS.Domain/Entities/Site.cs)
  - Added `GpsGateTagId`, `GpsGateTagName`, `AutoUpdateGpsGateTag` properties

### Persistence Layer
- [SiteConfiguration.cs](../../FMS.Persistence/EntityConfigurations/SiteConfiguration.cs)
  - Entity configuration for new Site properties

### Database
- [2025-01-20_add_gpsgate_tag_to_site.sql](../database_migrations/2025-01-20_add_gpsgate_tag_to_site.sql)
  - Migration script for Site table changes

## Testing

### Unit Testing Scenarios

1. **Transfer completion triggers tag update**
   - Create transfer, complete it, verify GPSGate API calls

2. **Site without GPSGate tag configured**
   - Should log warning and skip update

3. **Auto-update disabled**
   - Should skip update when `AutoUpdateGpsGateTag = false`

4. **GPSGate API failure**
   - Should log error but not fail transfer

### Integration Testing

1. Create vehicle transfer from Site A to Site B
2. Complete the transfer
3. Verify vehicle appears in Site B's tag in GPSGate
4. Verify vehicle is removed from Site A's tag in GPSGate

## Troubleshooting

### Common Issues

1. **Tag not updating**
   - Check Site has `gps_gate_tag_id` configured
   - Check `auto_update_gps_gate_tag` is `true`
   - Check vehicle has `VehicleProviderMappings.ExternalDeviceId`
   - Check logs for API errors

2. **Vehicle not found in GPSGate**
   - Ensure vehicle name in GPSGate matches `HyoungNo`
   - Check `VehicleProviderMappings` has correct `ExternalDeviceId`

3. **API Authentication errors**
   - Verify GPSGate credentials in configuration
   - Check token hasn't expired

### Logs

Look for these log entries:
```
"Initiating GPSGate tag update for vehicle {VehicleId} transfer from site {FromSiteId} to site {ToSiteId}"
"Successfully updated GPSGate tags for vehicle {VehicleId}"
"Failed to update GPSGate tags for vehicle {VehicleId}. Error: {Error}"
```

## Future Enhancements

1. **~~UI for Site Tag Configuration~~** ✅ IMPLEMENTED
   - Admin interface to configure GPSGate tags per site
   - Dropdown populated from GPSGate API
   - Located in Vehicle Settings > GPSGate Tags tab

2. **Bulk Tag Sync**
   - Scheduled job to verify/sync all vehicle tags
   - Fix any discrepancies between FMS and GPSGate

3. **Tag Update Notifications**
   - SignalR notifications when tags are updated
   - Dashboard widget showing recent tag changes

4. **Rollback Support**
   - If transfer is cancelled, rollback tag changes
