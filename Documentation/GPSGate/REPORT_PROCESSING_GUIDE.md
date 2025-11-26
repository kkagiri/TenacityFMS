# GPSGate Report Processing Guide

## Overview

The GPSGate integration now supports **flexible report processing** with a processor pattern that allows you to handle different report types with different column structures.

## Architecture

### Report Processing Flow

```
1. Generate Report → HandleId returned
2. Poll Status → Wait for "Completed"
3. Process Report → Parse XML with appropriate processor
4. Get Typed Data → Receive strongly-typed DTO list
```

### Components

#### 1. **IReportProcessor<T>** Interface
- Defines contract for all report processors
- Generic interface for type-safe report parsing
- Methods: `ProcessReport()`, `ParseRow()`, `ValidateReportStructure()`

#### 2. **BaseReportProcessor<T>** Abstract Class
- Common XML parsing logic
- Helper methods for type conversion (decimal, int, DateTime, TimeSpan)
- Error handling and logging
- Namespace removal for simplified XPath

#### 3. **Specific Processors**
- **FuelConsumptionReportProcessor** (Report ID: 208)
- **RefuelingReportProcessor** (Report ID: 212)
- Easily extensible for new report types

#### 4. **ReportProcessorFactory**
- Factory pattern for processor creation
- Automatic processor registration
- Type-safe processor retrieval
- Support for checking available processors

## Supported Reports

### Report 208: Fuel Consumption Report

**Columns:**
- Vehicle ID
- Engine Hours (Ignition Hours)
- Total Fuel from Fuel Probe
- Engine Hours from Flowmeter
- Total Fuel from Flowmeter
- GPS Last Location
- Total Distance
- Average Speed
- Max Speed
- Total Fuel Normal (Flowmeter)
- Total Fuel Idle (Flowmeter)
- Engine Hours Normal (Flowmeter)
- Engine Hours Idle (Flowmeter)
- Date

**DTO:** `FuelConsumptionReportDto`

**XML Structure:**
```xml
<Row kind="i">
  <Cell ref="i_0_0_0">vehicleID</Cell>
  <Cell ref="i_0_0_1">engineHours</Cell>
  <Cell ref="i_0_0_2">totalFuel</Cell>
  ...
  <Cell ref="i_0_0_13">date</Cell>
</Row>
```

### Report 212: Refueling Report

**Columns:**
- Vehicle (Name/ID)
- Date
- Start Time
- Duration
- Address
- Fuel Before
- Fuel After
- Refill Volume

**DTO:** `RefuelingReportDto`

**XML Structure:**
```xml
<Row kind="i">
  <Cell ref="i_0_0_0">ADT09</Cell>
  <Cell ref="i_0_0_1">21/11/2025</Cell>
  <Cell ref="i_0_0_2">07:22</Cell>
  <Cell ref="i_0_0_3">0:11:45</Cell>
  <Cell ref="i_0_0_4">Katani</Cell>
  <Cell ref="i_0_0_5">239.5 l</Cell>
  <Cell ref="i_0_0_6">456.3 l</Cell>
  <Cell ref="i_0_0_7">217</Cell>
</Row>
```

## API Endpoints

### 1. Process Fuel Consumption Report
```http
GET /api/gpsgate/reports/process/fuel-consumption/{handleId}?sessionId={sessionId}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "reportId": 208,
    "reportName": "Fuel Consumption Report",
    "handleId": 12345,
    "totalRows": 25,
    "data": [
      {
        "vehicleId": 101,
        "vehicleName": null,
        "engineHours": 8.5,
        "totalFuelProbe": 125.3,
        "flowMeterEngineHours": 8.3,
        "flowMeterFuelUsed": 120.0,
        "lastLocation": "Nairobi, Kenya",
        "totalDistance": 285.5,
        "averageSpeed": 45.2,
        "maxSpeed": 85.0,
        "totalFuelNormal": 100.0,
        "totalFuelIdle": 20.0,
        "engineHoursNormal": 7.0,
        "engineHoursIdle": 1.3,
        "reportDate": "2025-11-21T00:00:00"
      }
    ]
  },
  "message": "Successfully processed Fuel Consumption Report with 25 rows"
}
```

### 2. Process Refueling Report
```http
GET /api/gpsgate/reports/process/refueling/{handleId}?sessionId={sessionId}
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "reportId": 212,
    "reportName": "Refueling Report",
    "handleId": 12346,
    "totalRows": 15,
    "data": [
      {
        "vehicle": "ADT09",
        "vehicleId": null,
        "date": "2025-11-21T00:00:00",
        "startTime": "07:22:00",
        "duration": "00:11:45",
        "address": "Katani",
        "fuelBefore": 239.5,
        "fuelAfter": 456.3,
        "refillVolume": 217.0,
        "refuelingDateTime": "2025-11-21T07:22:00"
      }
    ]
  },
  "message": "Successfully processed Refueling Report with 15 rows"
}
```

### 3. Process Any Report (Generic)
```http
GET /api/gpsgate/reports/process/{reportId}/{handleId}?sessionId={sessionId}
```

**Example:**
```bash
curl "http://localhost:5000/api/gpsgate/reports/process/212/12346?sessionId=abc123"
```

## Complete Workflow Example

### Step 1: Login
```bash
curl -X POST "http://localhost:5000/api/gpsgate/login" \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "password",
    "applicationId": 1
  }'
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "sessionId": "abc123xyz",
    "expiresAt": "2025-11-22T10:00:00"
  }
}
```

### Step 2: Generate Report
```bash
curl -X POST "http://localhost:5000/api/gpsgate/reports/generate?sessionId=abc123xyz" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 212,
    "startDate": "2025-11-21T00:00:00",
    "endDate": "2025-11-21T23:59:59"
  }'
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "handleId": 12346,
    "status": "Processing"
  }
}
```

### Step 3: Check Status (Poll until Completed)
```bash
curl "http://localhost:5000/api/gpsgate/reports/status/12346?sessionId=abc123xyz"
```

**Response:**
```json
{
  "isSuccess": true,
  "data": {
    "handleId": 12346,
    "status": "Completed"
  }
}
```

### Step 4: Process Report with Type-Safe Parsing
```bash
curl "http://localhost:5000/api/gpsgate/reports/process/refueling/12346?sessionId=abc123xyz"
```

**Response:** Fully parsed RefuelingReportDto objects (see above)

## How to Test Report Structures

### Method 1: Using GPSGate Web UI

1. **Login to GPSGate**
   - Navigate to http://10.0.10.150/GpsGateServer
   - Login with credentials

2. **Generate Test Report**
   - Go to Reports section
   - Select report type (e.g., "Refueling Events")
   - Choose date range
   - Select vehicles
   - Click "Generate"

3. **Export XML**
   - Click "Export" → "XML"
   - Save the XML file
   - Open in text editor

4. **Analyze Structure**
   - Look at `<Row kind="h">` for header
   - Look at `<Row kind="i">` for data rows
   - Note the `ref` attributes: `i_0_0_0`, `i_0_0_1`, etc.
   - Identify column positions

### Method 2: Using API Inspection

1. **Generate Report via API**
```bash
curl -X POST "http://localhost:5000/api/gpsgate/reports/generate?sessionId=YOUR_SESSION" \
  -H "Content-Type: application/json" \
  -d '{
    "reportId": 999,
    "startDate": "2025-11-21T00:00:00",
    "endDate": "2025-11-21T23:59:59"
  }'
```

2. **Wait and Fetch Raw XML**
```bash
curl "http://localhost:5000/api/gpsgate/reports/fetch/HANDLE_ID?sessionId=YOUR_SESSION"
```

3. **Save XML Response**
   - Copy the XML from `reportData` field
   - Format it for readability
   - Analyze structure

### Method 3: Database Inspection

```sql
-- Get completed reports with XML data
SELECT
    ReportId,
    ReportName,
    HandleId,
    Status,
    LEFT(ReportData, 1000) as SampleXML
FROM gpsgate_reports
WHERE Status = 'Completed'
AND ReportData IS NOT NULL
ORDER BY CompletedAt DESC
LIMIT 5;

-- Get specific report XML
SELECT ReportData
FROM gpsgate_reports
WHERE HandleId = 'YOUR_HANDLE_ID';
```

## Adding a New Report Processor

### Step 1: Create DTO

Create file: `FMS.Application/Features/GPSGate/DTOs/YourReportDto.cs`

```csharp
using System;

namespace FMS.Application.Features.GPSGate.DTOs
{
    /// <summary>
    /// DTO for Your Report (Report ID: XXX)
    /// </summary>
    public class YourReportDto
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; }
        public DateTime? ReportDate { get; set; }
        // Add properties matching report columns
        public decimal? YourMetric1 { get; set; }
        public decimal? YourMetric2 { get; set; }
    }
}
```

### Step 2: Create Processor

Create file: `FMS.Application/Features/GPSGate/Processors/YourReportProcessor.cs`

```csharp
using FMS.Application.Features.GPSGate.DTOs;
using Microsoft.Extensions.Logging;
using System.Linq;
using System.Xml.Linq;

namespace FMS.Application.Features.GPSGate.Processors
{
    public class YourReportProcessor : BaseReportProcessor<YourReportDto>
    {
        public YourReportProcessor(ILogger<YourReportProcessor> logger)
            : base(logger)
        {
        }

        public override int ReportId => 999; // Your report ID
        public override string ReportName => "Your Report Name";

        public override YourReportDto ParseRow(XElement dataRow)
        {
            var dto = new YourReportDto();

            foreach (var cell in dataRow.Descendants("Cell"))
            {
                var refValue = cell.Attribute("ref")?.Value;
                if (string.IsNullOrEmpty(refValue))
                    continue;

                var cellValue = cell.Value;

                switch (refValue)
                {
                    case "i_0_0_0": // First column
                        dto.VehicleId = ParseInt(cellValue) ?? 0;
                        break;

                    case "i_0_0_1": // Second column
                        dto.VehicleName = cellValue;
                        break;

                    case "i_0_0_2": // Third column
                        dto.YourMetric1 = ParseDecimal(cellValue);
                        break;

                    // Add more cases for each column

                    default:
                        _logger.LogDebug($"Unknown cell reference: {refValue}");
                        break;
                }
            }

            return dto;
        }
    }
}
```

### Step 3: Register in Factory

Update `FMS.Application/Features/GPSGate/Processors/ReportProcessorFactory.cs`:

```csharp
private void RegisterProcessors()
{
    RegisterProcessor<FuelConsumptionReportProcessor>(208);
    RegisterProcessor<RefuelingReportProcessor>(212);
    RegisterProcessor<YourReportProcessor>(999); // Add your processor
}
```

### Step 4: Register in DI Container

Update `Program.cs` or `Startup.cs`:

```csharp
// Register report processors
services.AddScoped<FuelConsumptionReportProcessor>();
services.AddScoped<RefuelingReportProcessor>();
services.AddScoped<YourReportProcessor>(); // Add your processor

// Register factory
services.AddSingleton<IReportProcessorFactory, ReportProcessorFactory>();
```

### Step 5: Add Controller Endpoint (Optional)

Update `GPSGateController.cs`:

```csharp
[HttpGet("reports/process/your-report/{handleId}")]
public async Task<IActionResult> ProcessYourReport([FromQuery] string sessionId, int handleId)
{
    var query = new ProcessReportQuery<YourReportDto>(sessionId, handleId, 999);
    var result = await _mediator.Send(query);
    return result.IsSuccess ? Ok(result) : BadRequest(result);
}
```

### Step 6: Update Generic Endpoint Switch

```csharp
case 999: // Your Report
    var yourQuery = new ProcessReportQuery<YourReportDto>(sessionId, handleId, reportId);
    var yourResult = await _mediator.Send(yourQuery);
    return yourResult.IsSuccess ? Ok(yourResult) : BadRequest(yourResult);
```

## Testing Checklist

### Unit Tests

```csharp
// Test processor parsing
[Fact]
public void ParseRow_ValidXml_ReturnsDto()
{
    // Arrange
    var processor = new RefuelingReportProcessor(logger);
    var xml = XElement.Parse(@"
        <Row kind='i'>
            <Cell ref='i_0_0_0'>ADT09</Cell>
            <Cell ref='i_0_0_5'>239.5 l</Cell>
        </Row>
    ");

    // Act
    var result = processor.ParseRow(xml);

    // Assert
    Assert.Equal("ADT09", result.Vehicle);
    Assert.Equal(239.5m, result.FuelBefore);
}
```

### Integration Tests

1. **Login Test**
   - Verify session creation
   - Check session expiration

2. **Report Generation Test**
   - Generate report for each type
   - Verify handleId returned

3. **Status Polling Test**
   - Poll until "Completed"
   - Verify status transitions

4. **Processing Test**
   - Process each report type
   - Verify DTO population
   - Check data accuracy

### Manual Testing

1. **Test with Real GPSGate Data**
   ```bash
   # Full workflow for Report 212
   ./test-refueling-report.sh
   ```

2. **Verify Column Mapping**
   - Compare GPSGate UI report with API response
   - Check all columns are mapped correctly
   - Verify data types and formatting

3. **Edge Cases**
   - Empty reports (no data rows)
   - Missing columns
   - Null/empty values
   - Special characters in data

## Troubleshooting

### Issue: "No processor available for report ID X"

**Solution:** Check if processor is:
1. Created and implements `IReportProcessor<T>`
2. Registered in `ReportProcessorFactory.RegisterProcessors()`
3. Registered in DI container

### Issue: "Wrong cell reference mapping"

**Solution:**
1. Export actual report XML from GPSGate
2. Check cell `ref` attributes
3. Update switch cases in processor
4. Column positions may vary by report configuration

### Issue: "Parsing errors on decimal values"

**Solution:**
- Check for unit suffixes (e.g., "239.5 l")
- Use custom parsing methods (see `RefuelingReportProcessor.ParseFuelValue`)
- Handle both invariant and local culture formats

### Issue: "DateTime parsing fails"

**Solution:**
- GPSGate may use different date formats
- Use `DateTime.TryParse` with multiple formats
- Consider timezone handling

## Best Practices

1. **Always Test with Real Data**
   - Export sample XML from GPSGate
   - Test with edge cases

2. **Use Helper Methods**
   - `ParseDecimal()`, `ParseInt()`, `ParseDateTime()`
   - Handle nulls gracefully

3. **Log Debug Information**
   - Unknown cell references
   - Parsing failures
   - Row counts

4. **Handle Units**
   - Strip unit suffixes (l, km, km/h)
   - Document expected units

5. **Validate Structure**
   - Override `ValidateReportStructure()` if needed
   - Check for required columns

6. **Document Column Mapping**
   - Add comments in ParseRow method
   - Document expected GPSGate report format
   - Include sample XML in comments

## Support

For questions or issues:
1. Check this guide
2. Review existing processors (208, 212)
3. Check GPSGate documentation
4. Contact development team

## Summary

The report processing system provides:
- ✅ Type-safe parsing with DTOs
- ✅ Flexible processor pattern
- ✅ Easy addition of new report types
- ✅ Comprehensive error handling
- ✅ Factory-based processor selection
- ✅ Full logging and debugging support
- ✅ RESTful API endpoints
- ✅ Supports different XML structures

You can now handle ANY GPSGate report type by creating a new processor and DTO!
