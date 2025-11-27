# GPS Fetch Cancellation - GPSGate Server Integration

## Overview
Enhanced the GPS fetch cancellation feature to properly instruct the GPSGate server to cancel report generation, not just the local processing.

## Problem
Previously, when users cancelled a GPS fetch operation:
- ✅ Local processing was cancelled (CancellationToken)
- ❌ GPSGate server continued generating the report
- Issue: JobId (GUID) and HandleId (int from GPSGate) were not linked

## Solution

### 1. Database Schema Change
Added `JobId` column to `gpsgate_reports` table to link the controller's GUID job identifier with GPSGate's HandleId.

**Migration Script:** `Documentation/Features/FuelComparison/database/add_jobid_to_gpsgate_reports.sql`

```sql
ALTER TABLE `gpsgate_reports`
ADD COLUMN `JobId` VARCHAR(50) NULL
COMMENT 'GUID job identifier for tracking cancellation'
AFTER `HandleId`;

CREATE INDEX `idx_gpsgate_reports_jobid` ON `gpsgate_reports` (`JobId`);
CREATE INDEX `idx_gpsgate_reports_jobid_status` ON `gpsgate_reports` (`JobId`, `Status`);
```

### 2. Domain Entity Update
**File:** `FMS.Domain/Entities/GPSGate/GPSGateReport.cs`

```csharp
public class GPSGateReport
{
    public int Id { get; set; }
    public int ReportId { get; set; }
    public string? ReportName { get; set; }
    public int HandleId { get; set; }
    public string? JobId { get; set; } // NEW: GUID job identifier for tracking cancellation
    public string SessionId { get; set; }
    // ... other properties
}
```

### 3. Service Layer Updates

**File:** `FMS.Application/Features/GPSGate/Services/IGPSGateReportingService.cs`
```csharp
Task<GenerateReportResponseDto> GenerateReportAsync(
    string sessionId,
    int reportId,
    DateTime startDate,
    DateTime endDate,
    string? jobId = null); // NEW: Added jobId parameter
```

**File:** `FMS.Application/Features/GPSGate/Services/GPSGateReportingService.cs`
- Updated `GenerateReportAsync` to accept and store `jobId`
- Database record now includes: `JobId = jobId`

### 4. Command Layer Updates

**File:** `FMS.Application/Features/GPSGate/Commands/GenerateGPSReportCommand.cs`
```csharp
public record GenerateGPSReportCommand(
    string SessionId,
    GenerateReportRequestDto ReportRequest,
    string? JobId = null) : IRequest<FMSResponse<GenerateReportResponseDto>>;
```

**File:** `FMS.Application/Features/GPSGate/Commands/CancelGpsReportCommand.cs`
- Changed lookup strategy from HandleId parsing to direct JobId lookup
- Now finds report by: `WHERE JobId = @JobId AND Status = 'Processing'`
- Calls `GPSGateReportingSoapHttpClient.CancelReportAsync()` to instruct GPSGate server

```csharp
// Find the GPSGateReport record by JobId
var report = await _context.GPSGateReports
    .FirstOrDefaultAsync(r => r.JobId == request.JobId && r.Status == "Processing", cancellationToken);

// Send cancellation request to GPSGate server
var cancelResult = await _reportingService.CancelReportAsync(report.SessionId, report.HandleId);

// Update local database status
report.Status = "Cancelled";
report.CompletedAt = DateTime.UtcNow;
report.ErrorMessage = "Cancelled by user";
```

### 5. Workflow Integration

**File:** `FMS.Application/Features/FuelComparison/Commands/FetchAndStoreGpsDataCommandHandler.cs`
- Updated to pass `request.JobId` when generating report
- Links controller's GUID job ID with GPSGate's HandleId in database

```csharp
var generateResult = await _mediator.Send(new GenerateGPSReportCommand(
    sessionId,
    new GenerateReportRequestDto
    {
        ReportId = reportId,
        StartDate = request.StartDate,
        EndDate = request.EndDate
    },
    request.JobId // Pass JobId for tracking
), cancellationToken);
```

**File:** `FMS.WebClient/Controllers/FuelComparisonController.cs`
- Controller already creates unique JobId (GUID)
- When user cancels, sends `CancelGpsReportCommand` with JobId
- Command handler looks up HandleId and SessionId from database
- Sends cancellation instruction to GPSGate server via SOAP API

## Data Flow

### Report Generation:
```
1. Controller creates JobId (GUID): "abc123-def456-..."
2. Fire-and-forget task starts with JobId
3. FetchAndStoreGpsDataCommandHandler passes JobId to GenerateGPSReportCommand
4. GPSGate returns HandleId (int): 12345
5. Database stores: JobId="abc123...", HandleId=12345, SessionId="xyz789", Status="Processing"
```

### Cancellation:
```
1. User clicks "Cancel Fetch" button
2. Frontend calls: POST /api/v1/fuelcomparison/cancel-gps-fetch/{jobId}
3. Controller retrieves CancellationTokenSource and cancels it (local)
4. Controller sends: CancelGpsReportCommand(jobId="abc123...")
5. Command handler queries: SELECT * FROM gpsgate_reports WHERE JobId='abc123...' AND Status='Processing'
6. Command handler extracts: HandleId=12345, SessionId="xyz789"
7. Command handler calls: GPSGateReportingSoapHttpClient.CancelReportAsync(sessionId, handleId)
8. GPSGate server cancels report generation for HandleId=12345
9. Database updated: Status="Cancelled", CompletedAt=NOW()
```

## Benefits

1. **Complete Cancellation**: Both local processing AND GPSGate server report generation are cancelled
2. **Resource Efficiency**: GPSGate server stops processing, freeing resources
3. **Proper Tracking**: JobId links controller's async job with GPSGate's report
4. **Database Integrity**: Report status accurately reflects cancellation state
5. **User Experience**: Cancellation is truly effective, not just local

## Testing Checklist

- [ ] Run database migration script
- [ ] Test report generation (verify JobId stored in database)
- [ ] Test cancellation during "Logging in" phase
- [ ] Test cancellation during "Processing Report" phase (polling loop)
- [ ] Test cancellation during "Saving Data" phase
- [ ] Verify GPSGate server receives CancelReport SOAP call
- [ ] Verify database status updates to "Cancelled"
- [ ] Test error handling if GPSGate cancellation fails
- [ ] Verify existing reports without JobId (backward compatibility)

## Notes

- JobId column is nullable for backward compatibility with existing records
- If JobId is null (old records), cancellation uses fallback logic (most recent Processing report)
- GPSGate CancelReport API may fail if report already completed - this is handled gracefully
- Local database status is updated to "Cancelled" regardless of GPSGate API response

## Related Files

**Backend:**
- `FMS.Domain/Entities/GPSGate/GPSGateReport.cs` - Entity with JobId
- `FMS.Application/Features/GPSGate/Services/IGPSGateReportingService.cs` - Service interface
- `FMS.Application/Features/GPSGate/Services/GPSGateReportingService.cs` - Service implementation
- `FMS.Application/Features/GPSGate/Services/GPSGateReportingSoapHttpClient.cs` - SOAP client (CancelReportAsync)
- `FMS.Application/Features/GPSGate/Commands/GenerateGPSReportCommand.cs` - Generate command with JobId
- `FMS.Application/Features/GPSGate/Commands/CancelGpsReportCommand.cs` - Cancel command
- `FMS.Application/Features/FuelComparison/Commands/FetchAndStoreGpsDataCommandHandler.cs` - Main workflow
- `FMS.WebClient/Controllers/FuelComparisonController.cs` - Controller with cancel endpoint

**Database:**
- `Documentation/Features/FuelComparison/database/add_jobid_to_gpsgate_reports.sql` - Migration script

**Frontend:** (already implemented in previous phase)
- `fms.frontend/src/pages/tankStock/fueldatacomparison/FuelDataComparisonDashboard.js`
- `fms.frontend/src/pages/tankStock/fueldatacomparison/modals/FetchGpsDataModal.js`
- `fms.frontend/src/api/tankstock/fuelComparisonClient.js`
