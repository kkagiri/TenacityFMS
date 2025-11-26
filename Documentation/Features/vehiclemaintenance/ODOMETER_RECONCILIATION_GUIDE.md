# GPS Odometer Reconciliation Feature

## Overview

The GPS Odometer Reconciliation feature allows fleet managers to compare GPS-reported odometer readings with database records and perform bulk synchronization operations. This helps maintain accurate mileage data for maintenance scheduling and reporting.

## Features

### 1. **Bulk Comparison Dashboard**
- View all active vehicles in a single grid
- Compare GPS odometer vs Database odometer side-by-side
- Calculate discrepancies automatically
- Filter by vehicles with significant discrepancies
- Real-time GPS data fetching from provider APIs

### 2. **Intelligent Discrepancy Detection**
- Configurable threshold (default: 100 km)
- Percentage-based discrepancy calculation
- Visual indicators for significant differences
- Stale data detection (highlights readings > 24 hours old)

### 3. **Bulk Update Operations**
- Select multiple vehicles for batch updates
- Update database odometers from GPS readings
- Progress tracking with success/fail counters
- Transaction-safe operations with rollback on errors

### 4. **GPS Mapping Status**
- Shows which vehicles have GPS provider mappings
- Displays provider name and external device ID
- Identifies vehicles without GPS tracking

## Architecture

### Backend Components

#### DTOs
**VehicleOdometerComparisonDTO** (`FMS.Application/Dtos/`)
```csharp
public class VehicleOdometerComparisonDTO
{
    // Vehicle Info
    public int VehicleId { get; set; }
    public string HyoungNo { get; set; }
    public string NumberPlate { get; set; }

    // GPS Data
    public int? GpsAccumulatorId { get; set; }
    public double? GpsOdometer { get; set; }
    public string GpsUnit { get; set; }
    public DateTime? GpsTimestamp { get; set; }

    // Database Data
    public double? DatabaseOdometer { get; set; }
    public DateTime? DatabaseLastUpdated { get; set; }

    // Comparison
    public double? Discrepancy { get; set; }
    public double? DiscrepancyPercentage { get; set; }
    public bool HasSignificantDiscrepancy { get; set; }

    // Mapping Status
    public bool HasGpsMapping { get; set; }
    public string ExternalDeviceId { get; set; }
}
```

#### Query Handler
**GetBulkVehicleOdometerComparisonQueryHandler**
- Fetches all active vehicles from database
- Retrieves GPS provider mappings
- Calls GPS accumulator service for each vehicle
- Calculates discrepancies and percentages
- Filters based on threshold (optional)
- Orders by discrepancy (highest first)

**Query Parameters:**
- `OnlyWithDiscrepancies`: bool (default: false) - Filter to only show vehicles with significant differences
- `DiscrepancyThreshold`: double? (default: 100.0 km) - Minimum difference to be considered significant

#### Command Handler
**BulkUpdateVehicleOdometersCommandHandler**
- Updates `CurrentOdometer` field in vehicles table
- Sets `LastOdometerUpdate` to current timestamp
- Processes updates individually with error handling
- Returns success/fail counts and error messages

**Command Structure:**
```csharp
public record BulkUpdateVehicleOdometersCommand(
    List<VehicleOdometerUpdateRequest> Updates
);

public class VehicleOdometerUpdateRequest
{
    public int VehicleId { get; set; }
    public double GpsOdometer { get; set; }
    public string UpdateSource { get; set; } = "GPS";
}
```

#### API Endpoints

**GET** `/api/v1/vehiclemaintenance/odometer-comparison`
- Query Parameters:
  - `onlyWithDiscrepancies`: boolean
  - `discrepancyThreshold`: number (km)
- Returns: `FMSResponse<List<VehicleOdometerComparisonDTO>>`

**POST** `/api/v1/vehiclemaintenance/odometer-bulk-update`
- Body: `BulkUpdateVehicleOdometersCommand`
- Returns: `FMSResponse<BulkUpdateResult>`

### Frontend Component

**Location:** `fms.frontend/src/pages/maintenance/reconciliation/OdometerReconciliation.js`

#### Key Features

1. **Statistics Dashboard**
   - Total vehicles
   - Vehicles with GPS mapping
   - Vehicles with discrepancies
   - Average discrepancy

2. **Data Grid Columns**
   - Vehicle ID, Name, Number Plate
   - GPS Mapping Status (provider name, device ID)
   - GPS Odometer (with unit label and icon)
   - GPS Timestamp (with staleness indicator)
   - Database Odometer
   - Discrepancy (with warning icon for significant)
   - Difference Percentage

3. **Filtering Options**
   - Checkbox: "Only show vehicles with discrepancies"
   - Configurable threshold display

4. **Bulk Actions**
   - Multi-select rows
   - "Update Selected" button
   - Progress popup with success/fail counters
   - Real-time progress tracking

5. **Visual Indicators**
   - 🛰️ Icon for GPS data
   - ⚠️ Warning icon for significant discrepancies
   - 🕐 Clock icon for stale data (> 24 hours)
   - ✅ Checkmark for vehicles with GPS mapping
   - ❌ X-mark for vehicles without GPS

#### State Management
- Uses React hooks (useState, useEffect, useCallback)
- Direct axios API calls (no Redux needed for this isolated feature)
- Local state for grid data, selections, and progress tracking

## Navigation Setup

### Route Configuration

**MaintenanceMain.js:**
```javascript
import OdometerReconciliation from './reconciliation/OdometerReconciliation';

<Route path="/reconciliation" element={<OdometerReconciliation />} />
<Route path="/reconciliation/*" element={<OdometerReconciliation />} />
```

**MaintenanceLayout.js:**
```javascript
{
  id: 'reconciliation',
  label: 'Odometer Reconciliation',
  icon: 'fa-light fa-gauge-high',
  route: maintenanceRoutes.reconciliation,
  description: 'GPS vs Database Sync',
}
```

**navigationHelper.js:**
```javascript
export const maintenanceRoutes = {
  dashboard: '/maintenance',
  records: '/maintenance/records',
  reconciliation: '/maintenance/reconciliation',
  settings: '/maintenance/settings',
};
```

**Content.js:**
Already configured with wildcard route:
```javascript
<Route path="/maintenance/*" element={React.createElement(resolvedComponents("maintenance"))} />
```

### Database Navigation Item

Run the SQL script:
```bash
mysql -u root -p gpsdata < Documentation/Features/VehicleMaintenance/database/odometer-reconciliation-navigation.sql
```

This adds:
- Navigation item: "Odometer Reconciliation"
- Link: `/maintenance/reconciliation`
- Icon: `fa-light fa-gauge-high`
- Parent: Maintenance module
- Role access: Admin (customize as needed)

## Usage Guide

### For Fleet Managers

1. **Access the Feature**
   - Navigate to Maintenance → Odometer Reconciliation
   - System loads all active vehicles automatically

2. **Review Discrepancies**
   - Check the statistics cards at the top
   - Enable "Only show vehicles with discrepancies" filter
   - Sort by discrepancy column to see largest differences first

3. **Investigate Issues**
   - Click on vehicles with large discrepancies
   - Check GPS timestamp for data freshness
   - Verify GPS mapping status
   - Look for missing provider mappings

4. **Perform Bulk Updates**
   - Select vehicles using checkboxes
   - Click "Update Selected (X)" button
   - Monitor progress in the popup
   - Review success/fail counts
   - Close when complete

5. **Best Practices**
   - Run reconciliation weekly or after major trips
   - Investigate vehicles with > 10% discrepancy
   - Ensure GPS data is fresh (< 24 hours old)
   - Update in smaller batches for large fleets

### For Administrators

1. **Configure Threshold**
   - Default: 100 km
   - Adjust based on fleet usage patterns
   - Consider vehicle type and typical daily mileage

2. **Grant Access**
   - Add navigation permissions via Role Management
   - Assign to Maintenance Manager and Admin roles
   - Consider read-only vs update permissions

3. **Monitor Performance**
   - Check logs for GPS API failures
   - Monitor update success rates
   - Review discrepancy trends over time

## Technical Details

### Dependencies

**Backend:**
- `IGPSGateAccumulatorService` - GPS data fetching
- `GpsdataContext` - Database access
- Entity Framework Core
- MediatR for CQRS

**Frontend:**
- DevExtreme DataGrid
- DevExtreme Popup, Button, CheckBox, ProgressBar
- Axios for HTTP requests
- React Router for navigation

### Performance Considerations

1. **GPS API Calls**
   - Fetches accumulator data for each vehicle individually
   - May take 2-5 seconds per vehicle
   - Consider implementing caching for large fleets
   - Filter by discrepancies to reduce load

2. **Database Queries**
   - Single query for all vehicles
   - Single query for all provider mappings
   - Efficient joins and filtering

3. **Bulk Updates**
   - Individual updates with error handling
   - Transaction-safe operations
   - Progress feedback every vehicle

### Error Handling

**GPS Fetch Errors:**
- Logged but don't stop processing
- Vehicle shows "No GPS data" in grid
- Continues with next vehicle

**Update Errors:**
- Individual vehicle update failures tracked
- Error messages collected and displayed
- Successful updates committed immediately
- Failed updates don't affect successful ones

## Future Enhancements

### Planned Features

1. **Automated Scheduling**
   - Schedule automatic reconciliation runs
   - Email reports of discrepancies
   - Notification on threshold breaches

2. **Historical Tracking**
   - Track reconciliation history
   - Show trends over time
   - Identify chronic discrepancy vehicles

3. **Two-Way Sync**
   - Update GPS from database (reverse sync)
   - Useful for manual odometer corrections
   - Requires GPS provider write API support

4. **Advanced Filtering**
   - Filter by vehicle type, department, etc.
   - Date range for GPS timestamp
   - Custom discrepancy thresholds per vehicle

5. **Export Capabilities**
   - Export comparison data to Excel
   - Generate PDF reports
   - Schedule email reports

6. **Dashboard Integration**
   - Add reconciliation widget to main dashboard
   - Show vehicles needing attention
   - Quick action buttons

## Troubleshooting

### Common Issues

**1. "No GPS data" for vehicles**
- Verify vehicle has provider mapping in `vehicle_provider_mappings`
- Check GPS provider is healthy and accessible
- Ensure external device ID is correct
- Review accumulator service logs for API errors

**2. Stale GPS timestamps**
- Check GPS device is powered on and transmitting
- Verify provider API connection
- Review device battery/connectivity issues
- May indicate inactive vehicles

**3. Large discrepancies**
- Could indicate manual database entry errors
- GPS device may have been reset
- Vehicle odometer rollback (rare)
- Data entry in wrong units (km vs miles)

**4. Bulk update fails**
- Check database connection
- Verify user has update permissions
- Review error messages in response
- Check vehicle IDs are valid

**5. Navigation not showing**
- Run navigation SQL script
- Clear browser cache
- Check role permissions in database
- Verify user role has access

### Debug Steps

1. **Check Browser Console**
   ```javascript
   // Enable debug logging
   console.log('[OdometerReconciliation] Comparisons loaded:', comparisons);
   ```

2. **Verify API Response**
   ```bash
   curl -X GET "http://localhost:5000/api/v1/vehiclemaintenance/odometer-comparison?onlyWithDiscrepancies=false"
   ```

3. **Check Database State**
   ```sql
   -- Verify GPS mappings
   SELECT v.VehicleId, v.HyoungNo, vpm.ExternalDeviceId, vpm.ProviderId
   FROM vehicles v
   LEFT JOIN vehicle_provider_mappings vpm ON v.VehicleId = vpm.VehicleId AND vpm.IsActive = 1
   WHERE v.VehicleStatus = 'Active';

   -- Check navigation access
   SELECT rn.*, n.Page, n.Link
   FROM rolenavigations rn
   INNER JOIN navigationitems n ON rn.NavigationItemId = n.NavigationItemId
   WHERE n.Link = '/maintenance/reconciliation';
   ```

4. **Review Server Logs**
   - Check for GPS API connection errors
   - Look for database query failures
   - Review permission denials

## Testing Checklist

- [ ] GPS data fetches successfully for mapped vehicles
- [ ] Discrepancy calculation is accurate
- [ ] Filtering by threshold works correctly
- [ ] Multi-select and bulk update completes
- [ ] Progress popup shows accurate counts
- [ ] Errors are handled gracefully
- [ ] Navigation item appears for authorized roles
- [ ] Grid sorts and searches properly
- [ ] Stale data indicators show correctly
- [ ] Success/fail notifications display

## Related Documentation

- [GPS Accumulator Service Implementation](../GPSGate/accumulator-service.md)
- [Vehicle Maintenance Module](./maintenance-module-guide.md)
- [Navigation Setup Guide](../../Navigation/COMPREHENSIVE_NAVIGATION_GUIDE_FIXED.md)
- [Provider Management](../../VehicleTracking/USER_GUIDE.md)

## Support

For issues or questions:
1. Check troubleshooting section above
2. Review server logs for detailed errors
3. Verify database navigation setup
4. Contact system administrator for access issues
