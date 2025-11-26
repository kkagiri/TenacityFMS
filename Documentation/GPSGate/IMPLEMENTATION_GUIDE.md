# GPSGate SOAP Service Integration

## Overview
Complete SOAP service integration for GPSGate Directory and Reporting services following FMS Clean Architecture and CQRS patterns.

## Architecture

### Components Created

#### 1. Domain Entities (`FMS.Domain/Entities/GPSGate/`)
- **GPSGateSession**: Manages authentication sessions
- **GPSGateReport**: Tracks report generation requests and results
- **GPSGateReportDefinition**: Defines available report types

#### 2. DTOs (`FMS.Application/Features/GPSGate/DTOs/`)
- **GPSGateSessionDto**: Session transfer objects
- **LoginRequestDto/LoginResponseDto**: Authentication DTOs
- **GPSGateReportDto**: Report information
- **GenerateReportRequestDto/GenerateReportResponseDto**: Report generation
- **ReportStatusDto**: Report status tracking
- **FetchReportResponseDto**: Report data retrieval

#### 3. Services (`FMS.Application/Features/GPSGate/Services/`)
- **IGPSGateDirectoryService/GPSGateDirectoryService**: Directory SOAP service wrapper
- **IGPSGateReportingService/GPSGateReportingService**: Reporting SOAP service wrapper

#### 4. CQRS Commands (`FMS.Application/Features/GPSGate/Commands/`)
- **LoginCommand**: Authenticate with GPSGate
- **GenerateReportCommand**: Request report generation

#### 5. CQRS Queries (`FMS.Application/Features/GPSGate/Queries/`)
- **GetReportStatusQuery**: Check report generation progress
- **FetchReportQuery**: Retrieve completed report data
- **GetReportHistoryQuery**: Query historical reports

#### 6. Entity Configurations (`FMS.Persistence/EntityConfigurations/GPSGate/`)
- Entity Framework Core configurations for all GPSGate entities

#### 7. API Controller (`FMS.WebClient/Controllers/`)
- **GPSGateController**: RESTful API endpoints

## Database Schema

### Tables Created
```sql
- gpsgate_sessions: Authentication session management
- gpsgate_reports: Report generation tracking
- gpsgate_report_definitions: Available report types
```

### Migration Script
Location: `Documentation/GPSGate/database/01_gpsgate_tables.sql`

## API Endpoints

### Authentication
```
POST /api/gpsgate/login
Body: { "username": "string", "password": "string", "applicationId": 1 }
Response: { "sessionId": "string", "success": true, "message": "string" }
```

### Report Generation
```
POST /api/gpsgate/reports/generate?sessionId={sessionId}
Body: { "reportId": 208, "startDate": "2024-01-01", "endDate": "2024-01-31" }
Response: { "handleId": 12345, "success": true, "message": "string" }
```

### Report Status
```
GET /api/gpsgate/reports/status/{handleId}?sessionId={sessionId}
Response: { "handleId": 12345, "status": "Processing", "progress": 50, "message": "string" }
```

### Fetch Report
```
GET /api/gpsgate/reports/fetch/{handleId}?sessionId={sessionId}
Response: { "reportData": "xml", "success": true, "message": "string" }
```

### Report History
```
GET /api/gpsgate/reports/history?reportId=208&status=Completed
Response: [ { report objects } ]
```

## Usage Examples

### 1. Login and Generate Report
```csharp
// Login
var loginRequest = new LoginRequestDto
{
    Username = "admin",
    Password = "password",
    ApplicationId = 1
};

var loginCommand = new LoginCommand(loginRequest);
var loginResult = await _mediator.Send(loginCommand);

if (loginResult.IsSuccess)
{
    var sessionId = loginResult.Data.SessionId;

    // Generate report
    var reportRequest = new GenerateReportRequestDto
    {
        ReportId = 208, // Fuel Consumption Report
        StartDate = DateTime.Now.AddDays(-30),
        EndDate = DateTime.Now
    };

    var generateCommand = new GenerateReportCommand(sessionId, reportRequest);
    var reportResult = await _mediator.Send(generateCommand);

    if (reportResult.IsSuccess)
    {
        var handleId = reportResult.Data.HandleId;

        // Check status
        var statusQuery = new GetReportStatusQuery(sessionId, handleId);
        var status = await _mediator.Send(statusQuery);

        // Fetch when completed
        if (status.Data.Status == "Completed")
        {
            var fetchQuery = new FetchReportQuery(sessionId, handleId);
            var report = await _mediator.Send(fetchQuery);
            // Process report.Data.ReportData
        }
    }
}
```

### 2. Service Registration (Startup.cs or Program.cs)
```csharp
// Register services
services.AddScoped<IGPSGateDirectoryService, GPSGateDirectoryService>();
services.AddScoped<IGPSGateReportingService, GPSGateReportingService>();

// AutoMapper profiles are auto-registered via assembly scanning
```

## Key Features

### 1. Session Management
- Automatic session tracking in database
- Session validation before operations
- Session expiration handling
- Last used timestamp tracking

### 2. Error Handling
- XML error parsing from SOAP responses
- FMSResponse pattern for consistent error reporting
- Comprehensive logging at all levels
- Database error tracking

### 3. Report Workflow
1. **Generate**: Request report generation, receive handle ID
2. **Poll Status**: Check generation progress
3. **Fetch**: Retrieve completed report data
4. **Store**: Report data saved to database

### 4. Security
- Session-based authentication
- Validation at all endpoints
- Authorization attributes on controllers

## Configuration

### SOAP Endpoints
Configure in `ConnectedServices/`:
- Directory Service: `http://10.0.10.150/GpsGateServer/Services/directory.asmx`
- Reporting Service: `http://10.0.10.150/GpsGateServer/Services/reporting.asmx`

### Connection Settings
Update endpoint addresses in service reference configurations if GPSGate server changes.

## Testing

### Manual Testing
1. Use Postman/Swagger to test endpoints
2. Login first to obtain session ID
3. Use session ID for subsequent requests
4. Check database for session and report tracking

### Integration Testing
```csharp
// Test login
var loginResult = await _mediator.Send(new LoginCommand(loginRequest));
Assert.True(loginResult.IsSuccess);
Assert.NotNull(loginResult.Data.SessionId);

// Test report generation
var reportResult = await _mediator.Send(new GenerateReportCommand(sessionId, reportRequest));
Assert.True(reportResult.IsSuccess);
Assert.True(reportResult.Data.HandleId > 0);
```

## Troubleshooting

### Common Issues

1. **"Session ID not found in login response"**
   - Check GPSGate credentials
   - Verify application ID
   - Check GPSGate server connectivity

2. **"Invalid or expired session"**
   - Session expired (default 24 hours)
   - Re-authenticate to get new session

3. **"Handle ID not found"**
   - Report generation failed
   - Check error_message in gpsgate_reports table

4. **SOAP Connection Issues**
   - Verify endpoint URLs
   - Check network connectivity
   - Ensure SOAP service is running

## Future Enhancements

1. **Background Report Processing**
   - Implement background service to poll report status
   - Automatic report fetching when completed
   - Notification on report completion

2. **Report Caching**
   - Cache frequently requested reports
   - Reduce GPSGate server load

3. **Report Templates**
   - Pre-configured report templates
   - Scheduled report generation

4. **Multi-Session Support**
   - Multiple concurrent sessions per user
   - Session pooling for performance

## Maintenance

### Database Cleanup
```sql
-- Remove old expired sessions
DELETE FROM gpsgate_sessions
WHERE is_active = FALSE
AND expires_at < DATE_SUB(NOW(), INTERVAL 7 DAY);

-- Archive old reports
-- Move reports older than 90 days to archive table
```

### Monitoring
- Monitor session creation rate
- Track report generation success rate
- Log SOAP service performance
- Alert on repeated failures

## References

- [GPSGate SOAP API Documentation](http://gpsgate.com/api/)
- [FMS Clean Architecture Guide](../Backend-Improvements/CleanArchitectureImplementation.md)
- [CQRS Pattern Documentation](../Backend-Improvements/CQRSPattern.md)
