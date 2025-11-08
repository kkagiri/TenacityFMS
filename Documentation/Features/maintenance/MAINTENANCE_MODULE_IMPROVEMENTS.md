# Maintenance Module Improvements

## Overview
This document outlines the improvements made to the FMS Maintenance Module to enhance usability, mobile-friendliness, and integration with the GPS tracking system.

## Date
November 8, 2025

## Changes Implemented

### 1. Backend Changes

#### VehicleMaintenance Entity
**File**: `FMS.Domain/Entities/Features/VehicleManagement/VehicleMaintenance.cs`

- **Added**: `IssueNote` property (VARCHAR(2000), nullable)
  - Purpose: Track specific issues encountered during maintenance
  - Allows maintenance staff to document problems separately from general notes

#### VehicleMaintenanceDTO
**File**: `FMS.Application/Features/VehicleMaintenance/DTOs/VehicleMaintenanceDTO.cs`

- **Added**: `IssueNote` property to match entity
- Mapping handled automatically by AutoMapper's ReverseMap()

#### Database Migration
**File**: `Documentation/database_migrations/add_issuenote_to_vehiclemaintenance.sql`

- Adds `IssueNote` column to VehicleMaintenance table
- Creates search index on IssueNote field
- Includes verification query

**To Apply**:
```bash
mysql -u username -p database_name < Documentation/database_migrations/add_issuenote_to_vehiclemaintenance.sql
```

---

### 2. Frontend Changes - Maintenance List

#### File: `fms.frontend/src/pages/maintenance/list/MaintenanceList.js`

##### Form Improvements

**Full Screen & Mobile Friendly**:
- Popup width: `95%` (max 1200px)
- Popup height: `95%`
- Added ScrollView for better mobile experience
- Form layout: `labelLocation="top"` for better mobile rendering
- Grouped form fields with `GroupItem` components

**Removed Fields**:
- ❌ Cost field (removed from form)
- ❌ Service Provider field (removed from form)
- ❌ Cost column (removed from grid)
- ❌ Service Provider column (removed from grid)

**Added Fields**:
- ✅ Issue Note (textarea with placeholder)
- ✅ Description field
- ✅ Odometer at Schedule field

**Vehicle Selector**:
- Upgraded to searchable SelectBox
- Properties:
  - `searchEnabled: true`
  - `placeholder: 'Select vehicle'`
  - `showClearButton: true`
  - Uses `hyoungNo` as display
  - Uses `vehicleId` as value

**Maintenance Type Selector**:
- Changed from TextBox to searchable SelectBox
- Predefined list of maintenance types
- `searchEnabled: true` for quick filtering
- Integrates with maintenance type management in settings

**Form Sections**:
1. **Vehicle Information**
   - Vehicle selector (searchable)
   - Maintenance type selector (searchable)

2. **Scheduling**
   - Status
   - Scheduled Date
   - Priority

3. **Odometer Reading**
   - GPS Pull button
   - Odometer at Schedule field

4. **Details**
   - Description
   - Notes
   - Issue Note

---

### 3. Frontend Changes - Maintenance Settings

#### File: `fms.frontend/src/pages/maintenance/settings/MaintenanceSettings.js`

##### Schedule Form Improvements

**Smaller Form with ScrollView**:
- Popup width: `600px`
- Popup height: `600px`
- Added ScrollView for all content
- Grouped form fields for better organization

**Removed Fields**:
- ❌ Estimated Cost field (removed from form)
- ❌ Estimated Cost column (removed from grid)

**Interval Selection**:
- ✅ Added Interval Type selector (Kilometers or Hours)
- Dynamic form fields based on selection:
  - If "Kilometers": Shows Interval (Kilometers) field
  - If "Hours": Shows Interval (Hours) field
- Warning thresholds adapt to interval type

**Form Sections**:
1. **Basic Information**
   - Maintenance Type (searchable dropdown)
   - Description

2. **Interval Configuration**
   - Interval Type (KM or Hours)
   - Interval value (dynamic based on type)
   - Interval (Days)

3. **Warning Thresholds**
   - Warning Threshold (KM) - only shown for KM interval type
   - Warning Threshold (Days)

4. **Settings**
   - Default Priority
   - Apply to All Vehicles
   - Active

##### Maintenance Type Management

**New Feature**: Maintenance Type CRUD

**Access**: New "Manage Types" button in settings header

**Capabilities**:
- ✅ Add new maintenance types
- ✅ View all existing types
- ✅ Delete maintenance types
- ✅ Real-time updates to forms

**Popup Features**:
- Width: 500px, Height: 600px
- ScrollView for type list
- Add new type input with Enter key support
- List of existing types with delete buttons
- Type count display

**Predefined Types**:
1. Oil Change
2. Tire Rotation
3. Brake Service
4. Engine Service
5. Transmission Service
6. Battery Replacement
7. Air Filter Replacement
8. Spark Plug Replacement
9. Coolant Service
10. Inspection
11. General Repair
12. Other

---

### 4. GPS Integration

#### Odometer Data Pull Feature

**Location**: Maintenance List form, Odometer Reading section

**Functionality**:
- Button: "Pull Odometer from GPS"
- Fetches real-time odometer data from GPS tracking system
- Updates `odometerAtSchedule` field automatically
- Loading state during fetch
- Error handling with notifications

**API Endpoint Used**:
```
GET /api/v1/tracking/vehicles/{vehicleId}/location
```

**Response Expected**:
```json
{
  "vehicleId": 123,
  "latitude": 12.345,
  "longitude": 67.890,
  "odometer": 45678.5,
  "timestamp": "2025-11-08T10:30:00Z"
}
```

**User Flow**:
1. Select vehicle from dropdown
2. Click "Pull Odometer from GPS" button
3. System fetches current GPS location and odometer
4. Odometer field populates automatically
5. User can manually override if needed

**Benefits**:
- Eliminates manual odometer entry errors
- Real-time accuracy
- Integrates with existing VehicleTracking system
- Supports maintenance background checks

---

## Benefits

### User Experience
1. **Mobile Friendly**: Full-screen forms work well on tablets and mobile devices
2. **Searchable Dropdowns**: Quick filtering for vehicles and maintenance types
3. **Organized Forms**: Grouped sections with clear labels
4. **ScrollView**: No content cutoff on smaller screens

### Data Quality
1. **GPS Integration**: Accurate odometer readings from GPS
2. **Issue Tracking**: Separate field for issue notes
3. **Type Management**: Standardized maintenance type names

### Maintenance
1. **Cleaner Interface**: Removed unused cost/provider fields
2. **Better Organization**: Grouped form fields
3. **Flexible Intervals**: Support for both KM and hours-based schedules

---

## Testing Checklist

### Backend
- [ ] Run database migration
- [ ] Verify IssueNote column exists
- [ ] Test CRUD operations with IssueNote
- [ ] Verify AutoMapper mapping works

### Frontend - Maintenance List
- [ ] Test full-screen popup on desktop
- [ ] Test full-screen popup on tablet/mobile
- [ ] Test vehicle selector search functionality
- [ ] Test maintenance type selector search functionality
- [ ] Test GPS odometer pull with valid vehicle
- [ ] Test GPS odometer pull without vehicle selected
- [ ] Test GPS odometer pull with vehicle without GPS data
- [ ] Verify cost and service provider fields are hidden
- [ ] Test form scrolling with long content
- [ ] Test issue note field saves correctly

### Frontend - Maintenance Settings
- [ ] Test schedule form popup size (600x600)
- [ ] Test interval type switching (KM/Hours)
- [ ] Test conditional field display based on interval type
- [ ] Verify estimated cost field is hidden
- [ ] Test maintenance type management popup
- [ ] Test adding new maintenance type
- [ ] Test deleting maintenance type
- [ ] Test type persistence across forms
- [ ] Test form scrolling

### Integration
- [ ] Test GPS API endpoint responds correctly
- [ ] Verify odometer data updates vehicle records
- [ ] Test maintenance background service checks
- [ ] Verify navigation between maintenance pages works

---

## Future Enhancements

1. **Maintenance Type Backend Storage**
   - Move maintenance types from frontend state to database
   - Create MaintenanceType entity and table
   - API endpoints for CRUD operations

2. **Enhanced GPS Integration**
   - Show last GPS update timestamp
   - Display GPS health status
   - Warning if GPS data is stale

3. **Maintenance Reminders**
   - Push notifications when maintenance is due
   - Email reminders based on schedules
   - Dashboard widgets for upcoming maintenance

4. **Reporting**
   - Maintenance history reports
   - Cost analysis (when re-enabled)
   - Issue tracking and trends

5. **Mobile App**
   - Native mobile app for maintenance staff
   - Offline support
   - Photo attachments for issues

---

## Related Documentation

- [Vehicle Tracking System](../VehicleTracking/README.md)
- [GPS Integration Guide](../VehicleTracking/API_REFERENCE.md)
- [Database Schema](../../database_schema.md)

---

## Support

For issues or questions:
- Check the [Troubleshooting Guide](../../TROUBLESHOOTING.md)
- Review [API Documentation](../../API_REFERENCE.md)
- Contact development team

---

**Last Updated**: November 8, 2025
**Version**: 1.0
**Status**: Completed ✅
