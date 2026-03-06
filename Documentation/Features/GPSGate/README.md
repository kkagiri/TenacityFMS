# GPSGate SOAP Integration - Quick Setup

## Prerequisites
- .NET 8.0 SDK
- MySQL database
- GPSGate Server access

## Setup Steps

### 1. Database Migration
Run the SQL script to create tables:
```sql
mysql -u [username] -p [database] < Documentation/GPSGate/database/01_gpsgate_tables.sql
```

### 2. Service Registration
Services are automatically registered via dependency injection. Ensure your `Startup.cs` or `Program.cs` includes:

```csharp
// In FMS.Application/DependencyInjection.cs or similar
services.AddScoped<IGPSGateDirectoryService, GPSGateDirectoryService>();
services.AddScoped<IGPSGateReportingService, GPSGateReportingService>();
```

### 3. SOAP Service Configuration
The SOAP client endpoints are configured in:
- `DirectoryServiceReference1` (Directory service)
- `ReportingServiceReference` (Reporting service)

Update endpoints if your GPSGate server URL differs from `http://10.0.10.150/GpsGateServer/Services/`

### 4. Test the Integration

#### Using Swagger/Postman:

**Step 1: Login**
```
POST /api/gpsgate/login
{
  "username": "your_username",
  "password": "your_password",
  "applicationId": 1
}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "sessionId": "abc123...",
    "success": true,
    "message": "Login successful"
  }
}
```

**Step 2: Generate Report**
```
POST /api/gpsgate/reports/generate?sessionId=abc123...
{
  "reportId": 208,
  "startDate": "2024-01-01T00:00:00",
  "endDate": "2024-01-31T23:59:59"
}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "handleId": 12345,
    "success": true,
    "message": "Report generation initiated successfully"
  }
}
```

**Step 3: Check Status**
```
GET /api/gpsgate/reports/status/12345?sessionId=abc123...
```

**Step 4: Fetch Report (when completed)**
```
GET /api/gpsgate/reports/fetch/12345?sessionId=abc123...
```

## Available Report Types

Default reports configured:
- **208**: Fuel Consumption Report
- **1**: Track History
- **2**: Speed Report

Add more in `gpsgate_report_definitions` table.

## Troubleshooting

### "Could not connect to SOAP service"
- Check GPSGate server is running
- Verify endpoint URL in service references
- Check firewall/network connectivity

### "Invalid credentials"
- Verify username and password
- Check application ID is correct
- Ensure user has API access in GPSGate

### "Session expired"
- Sessions expire after 24 hours
- Re-authenticate to get new session ID

## Code Structure

```
FMS.Application/Features/GPSGate/
├── Commands/
│   ├── LoginCommand.cs
│   ├── LoginCommandHandler.cs
│   ├── GenerateReportCommand.cs
│   └── GenerateReportCommandHandler.cs
├── Queries/
│   ├── GetReportStatusQuery.cs
│   ├── FetchReportQuery.cs
│   └── GetReportHistoryQuery.cs
├── DTOs/
│   ├── GPSGateSessionDto.cs
│   └── GPSGateReportDto.cs
└── Services/
    ├── IGPSGateDirectoryService.cs
    ├── GPSGateDirectoryService.cs
    ├── IGPSGateReportingService.cs
    └── GPSGateReportingService.cs

FMS.Domain/Entities/GPSGate/
├── GPSGateSession.cs
├── GPSGateReport.cs
└── GPSGateReportDefinition.cs

FMS.Persistence/EntityConfigurations/GPSGate/
├── GPSGateSessionConfiguration.cs
├── GPSGateReportConfiguration.cs
└── GPSGateReportDefinitionConfiguration.cs
```

## Next Steps

1. **Test the endpoints** using Swagger UI
2. **Configure report definitions** in database
3. **Implement background processing** for automatic report fetching
4. **Add scheduled reports** functionality
5. **Create notification system** for report completion

## Support

For detailed documentation, see:
- [Implementation Guide](IMPLEMENTATION_GUIDE.md)
- [Database Schema](database/01_gpsgate_tables.sql)
- FMS Copilot Instructions
