# Quick Reference: GPSGate Report Processing

## 🚀 Quick Start

### 1. Register Services (Program.cs)
```csharp
services.AddScoped<FuelConsumptionReportProcessor>();
services.AddScoped<RefuelingReportProcessor>();
services.AddSingleton<IReportProcessorFactory, ReportProcessorFactory>();
```

### 2. Test Installation
```bash
dotnet build
.\scripts\test-report-processing.ps1
```

## 📊 Supported Reports

| Report ID | Name | Columns | Endpoint |
|-----------|------|---------|----------|
| 208 | Fuel Consumption | 14 | `/process/fuel-consumption/{handleId}` |
| 212 | Refueling | 8 | `/process/refueling/{handleId}` |

## 🔧 API Endpoints

### Process Fuel Consumption Report
```http
GET /api/gpsgate/reports/process/fuel-consumption/{handleId}?sessionId={sessionId}
```

### Process Refueling Report
```http
GET /api/gpsgate/reports/process/refueling/{handleId}?sessionId={sessionId}
```

### Generic Processor
```http
GET /api/gpsgate/reports/process/{reportId}/{handleId}?sessionId={sessionId}
```

## 🔄 Complete Workflow

```bash
# 1. Login
POST /api/gpsgate/login
{"username":"admin","password":"pass","applicationId":1}
→ Returns: sessionId

# 2. Generate Report
POST /api/gpsgate/reports/generate?sessionId={sessionId}
{"reportId":212,"startDate":"2025-11-21T00:00:00","endDate":"2025-11-21T23:59:59"}
→ Returns: handleId

# 3. Poll Status (until "Completed")
GET /api/gpsgate/reports/status/{handleId}?sessionId={sessionId}
→ Returns: status

# 4. Process Report
GET /api/gpsgate/reports/process/refueling/{handleId}?sessionId={sessionId}
→ Returns: ProcessedReportDto<RefuelingReportDto>
```

## ➕ Add New Report (5 Steps)

### Step 1: Create DTO
```csharp
// FMS.Application/Features/GPSGate/DTOs/YourReportDto.cs
public class YourReportDto
{
    public int VehicleId { get; set; }
    public decimal? YourMetric { get; set; }
}
```

### Step 2: Create Processor
```csharp
// FMS.Application/Features/GPSGate/Processors/YourReportProcessor.cs
public class YourReportProcessor : BaseReportProcessor<YourReportDto>
{
    public override int ReportId => 999;
    public override string ReportName => "Your Report";

    public override YourReportDto ParseRow(XElement dataRow)
    {
        var dto = new YourReportDto();
        foreach (var cell in dataRow.Descendants("Cell"))
        {
            switch (cell.Attribute("ref")?.Value)
            {
                case "i_0_0_0": dto.VehicleId = ParseInt(cell.Value) ?? 0; break;
                case "i_0_0_1": dto.YourMetric = ParseDecimal(cell.Value); break;
            }
        }
        return dto;
    }
}
```

### Step 3: Register in Factory
```csharp
// ReportProcessorFactory.cs → RegisterProcessors()
RegisterProcessor<YourReportProcessor>(999);
```

### Step 4: Register in DI
```csharp
// Program.cs
services.AddScoped<YourReportProcessor>();
```

### Step 5: Add Endpoint (Optional)
```csharp
// GPSGateController.cs
[HttpGet("reports/process/your-report/{handleId}")]
public async Task<IActionResult> ProcessYourReport([FromQuery] string sessionId, int handleId)
{
    var query = new ProcessReportQuery<YourReportDto>(sessionId, handleId, 999);
    var result = await _mediator.Send(query);
    return result.IsSuccess ? Ok(result) : BadRequest(result);
}
```

## 🔍 How to Find Report Structure

### Method 1: GPSGate UI
1. Login to http://10.0.10.150/GpsGateServer
2. Generate report manually
3. Export → XML
4. Analyze cell references (i_0_0_0, i_0_0_1, etc.)

### Method 2: Database
```sql
SELECT ReportId, ReportName, LEFT(ReportData, 2000) as XML
FROM gpsgate_reports
WHERE Status = 'Completed' AND ReportId = 999
ORDER BY CompletedAt DESC LIMIT 1;
```

### Method 3: API
```bash
# Generate, wait, then fetch raw XML
curl "http://localhost:5000/api/gpsgate/reports/fetch/{handleId}?sessionId={sessionId}"
```

## 📦 Response Format

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
        "date": "2025-11-21T00:00:00",
        "startTime": "07:22:00",
        "duration": "00:11:45",
        "address": "Katani",
        "fuelBefore": 239.5,
        "fuelAfter": 456.3,
        "refillVolume": 217.0
      }
    ]
  },
  "message": "Successfully processed Refueling Report with 15 rows"
}
```

## 🛠️ Helper Methods (BaseReportProcessor)

```csharp
ParseDecimal(string value)   // Safe decimal parsing with null handling
ParseInt(string value)        // Safe integer parsing
ParseDateTime(string value)   // Safe date/time parsing
ParseTimeSpan(string value)   // Safe timespan parsing
GetCellValue(XElement row, string refId) // Extract cell by reference
```

## 🐛 Troubleshooting

| Issue | Solution |
|-------|----------|
| "No processor registered" | Check Factory.RegisterProcessors() and DI registration |
| "Failed to create processor" | Ensure AddScoped<YourProcessor>() in DI |
| Wrong cell mapping | Export XML and verify ref attributes (i_0_0_X) |
| Decimal parsing fails | Use ParseDecimal() or handle units (e.g., "239.5 l") |

## 📚 Documentation

- `REPORT_PROCESSING_GUIDE.md` - Comprehensive guide (700+ lines)
- `SERVICE_REGISTRATION.md` - DI setup instructions
- `REPORT_SYSTEM_SUMMARY.md` - Architecture overview
- `test-report-processing.ps1` - Automated test script

## ✅ Testing Checklist

- [ ] Services registered in DI
- [ ] Solution builds without errors
- [ ] Login endpoint works
- [ ] Generate report returns handleId
- [ ] Status polling works
- [ ] Process endpoint returns typed data
- [ ] All DTO properties populated correctly
- [ ] Test with empty reports
- [ ] Test with null values
- [ ] Run automated test script

## 🎯 Key Features

- ✅ Type-safe parsing with DTOs
- ✅ Extensible processor pattern
- ✅ Factory-based selection
- ✅ Generic query handlers
- ✅ Comprehensive error handling
- ✅ Full logging support
- ✅ RESTful API endpoints
- ✅ Easy to add new reports (~30 min)

## 📞 Support

For detailed information:
- Read `Documentation/GPSGate/REPORT_PROCESSING_GUIDE.md`
- Check existing processors (208, 212) for examples
- Review test script for working workflow
- Contact development team

---

**You can now process ANY GPSGate report type!** 🎉
