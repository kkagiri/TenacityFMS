# Migration Guide: Old Code to New Report Processing System

## Overview

This guide shows how to migrate from the old `GPSGateDirectoryWebservice` pattern to the new processor-based system.

## Old Code Example (Your Provided Code)

```csharp
// OLD APPROACH - Hardcoded, single report type
public async Task<List<VehicleConsumptionServiceModel>> GetFuelConsumptionReportAsync(
    GPSGateConections conn,
    int FuelConsumptionReportID,
    DateTime from,
    DateTime to)
{
    // Generate report
    var results = await _ReportSoapClient.GenerateReportAsync(
        conn.SessionID, FuelConsumptionReportID, from, to);

    CheckError(results.Body.GenerateReportResult);

    // Parse handleId
    var reportXml = XDocument.Load(new StringReader(results.Body.GenerateReportResult.OuterXml));
    var handleId = reportXml.Descendants("handleid").FirstOrDefault()?.Value;
    int.TryParse(handleId, out int handleIdInt);

    // Poll status
    var state = reportXml.Descendants("state").FirstOrDefault()?.Value;
    while (state == "Processing")
    {
        await Task.Delay(1000);
        var reportstatus = await _ReportSoapClient.GetReportStatusAsync(conn.SessionID, handleIdInt);
        state = reportstatus.Body.GetReportStatusResult.ToString();
    }

    // Fetch report
    var report = await _ReportSoapClient.FetchReportAsync(conn.SessionID, handleIdInt);
    var reportXmls = XDocument.Load(new StringReader(report.Body.FetchReportResult.OuterXml));

    // Remove namespaces
    reportXmls.Descendants().Attributes().Where(a => a.IsNamespaceDeclaration).Remove();

    // Parse rows
    var dataRows = reportXmls.Descendants("{http://gpsgate.com/xml/}Row")
        .Where(r => r.Attribute("kind")?.Value == "i").ToList();

    var result = new List<VehicleConsumptionServiceModel>();
    foreach (var dataRow in dataRows)
    {
        var consumption = ParseVehicleConsumption(dataRow);
        result.Add(consumption);
    }

    return result;
}

private VehicleConsumptionServiceModel ParseVehicleConsumption(XElement dataRow)
{
    var consumption = new VehicleConsumptionServiceModel();
    foreach (var datacell in dataRow.Descendants("{http://gpsgate.com/xml/}Cell"))
    {
        var refValue = datacell.Attribute("ref")?.Value;

        switch (refValue)
        {
            case "i_0_0_0":
                consumption.VehicleId = int.Parse(datacell.Value);
                break;
            case "i_0_0_1":
                if (!string.IsNullOrEmpty(datacell.Value))
                    consumption.EngHours = decimal.Parse(datacell.Value, CultureInfo.InvariantCulture);
                break;
            // ... 11 more cases
        }
    }
    return consumption;
}
```

## New System - API Approach

### Option 1: Use Existing API (Recommended)

```csharp
// NEW APPROACH - Use API endpoints
public class VehicleConsumptionService
{
    private readonly HttpClient _httpClient;
    private readonly string _baseUrl = "http://localhost:5000/api/gpsgate";

    public async Task<List<FuelConsumptionReportDto>> GetFuelConsumptionDataAsync(
        string sessionId,
        DateTime from,
        DateTime to)
    {
        // Step 1: Generate report
        var generateRequest = new
        {
            reportId = 208,
            startDate = from,
            endDate = to
        };

        var generateResponse = await _httpClient.PostAsJsonAsync(
            $"{_baseUrl}/reports/generate?sessionId={sessionId}",
            generateRequest);

        var generateResult = await generateResponse.Content
            .ReadFromJsonAsync<FMSResponse<GenerateReportResponseDto>>();

        if (!generateResult.IsSuccess)
            throw new Exception(generateResult.Message);

        var handleId = generateResult.Data.HandleId;

        // Step 2: Poll until completed
        string status = "Processing";
        while (status == "Processing")
        {
            await Task.Delay(2000);

            var statusResponse = await _httpClient.GetAsync(
                $"{_baseUrl}/reports/status/{handleId}?sessionId={sessionId}");

            var statusResult = await statusResponse.Content
                .ReadFromJsonAsync<FMSResponse<ReportStatusDto>>();

            status = statusResult.Data.Status;
        }

        // Step 3: Process report
        var processResponse = await _httpClient.GetAsync(
            $"{_baseUrl}/reports/process/fuel-consumption/{handleId}?sessionId={sessionId}");

        var processResult = await processResponse.Content
            .ReadFromJsonAsync<FMSResponse<ProcessedReportDto<FuelConsumptionReportDto>>>();

        if (!processResult.IsSuccess)
            throw new Exception(processResult.Message);

        // Return parsed data - strongly typed!
        return processResult.Data.Data;
    }
}
```

### Option 2: Use MediatR Directly

```csharp
// NEW APPROACH - Use MediatR queries
public class VehicleConsumptionService
{
    private readonly IMediator _mediator;

    public VehicleConsumptionService(IMediator mediator)
    {
        _mediator = mediator;
    }

    public async Task<List<FuelConsumptionReportDto>> GetFuelConsumptionDataAsync(
        string sessionId,
        DateTime from,
        DateTime to)
    {
        // Step 1: Generate report
        var generateCommand = new GenerateReportCommand(sessionId, new GenerateReportRequestDto
        {
            ReportId = 208,
            StartDate = from,
            EndDate = to
        });

        var generateResult = await _mediator.Send(generateCommand);
        if (!generateResult.IsSuccess)
            throw new Exception(generateResult.Message);

        var handleId = generateResult.Data.HandleId;

        // Step 2: Poll until completed
        string status = "Processing";
        while (status == "Processing")
        {
            await Task.Delay(2000);

            var statusQuery = new GetReportStatusQuery(sessionId, handleId);
            var statusResult = await _mediator.Send(statusQuery);

            status = statusResult.Data.Status;
        }

        // Step 3: Process report with type-safe processor
        var processQuery = new ProcessReportQuery<FuelConsumptionReportDto>(
            sessionId, handleId, 208);

        var processResult = await _mediator.Send(processQuery);

        if (!processResult.IsSuccess)
            throw new Exception(processResult.Message);

        // Return parsed data - strongly typed!
        return processResult.Data.Data;
    }
}
```

### Option 3: Use Services + Processor Directly

```csharp
// NEW APPROACH - Use services and processor directly
public class VehicleConsumptionService
{
    private readonly IGPSGateReportingService _reportingService;
    private readonly IReportProcessorFactory _processorFactory;

    public async Task<List<FuelConsumptionReportDto>> GetFuelConsumptionDataAsync(
        string sessionId,
        DateTime from,
        DateTime to)
    {
        // Step 1: Generate report
        var handleIdString = await _reportingService.GenerateReportAsync(
            sessionId, 208, from, to);

        int.TryParse(handleIdString, out int handleId);

        // Step 2: Poll until completed
        string status = "Processing";
        while (status == "Processing")
        {
            await Task.Delay(2000);
            status = await _reportingService.GetReportStatusAsync(sessionId, handleId);
        }

        // Step 3: Fetch XML
        var reportXml = await _reportingService.FetchReportAsync(sessionId, handleId);
        var xmlDoc = XDocument.Load(new StringReader(reportXml));

        // Step 4: Use processor to parse
        var processor = _processorFactory.GetProcessor<FuelConsumptionReportDto>(208);
        var parsedData = processor.ProcessReport(xmlDoc);

        // Return parsed data - strongly typed!
        return parsedData;
    }
}
```

## Comparison

### Old Approach
❌ Hardcoded to single report type
❌ Inline XML parsing
❌ No separation of concerns
❌ Difficult to test
❌ No reusability
❌ Manual error handling
❌ No type safety for other reports

### New Approach
✅ Works with any report type
✅ Dedicated processor classes
✅ Clean Architecture layers
✅ Easy to unit test
✅ Highly reusable
✅ Comprehensive error handling
✅ Full type safety
✅ Factory pattern for extensibility

## Migration Steps

### Step 1: Create Processor from Old ParseMethod

Your old `ParseVehicleConsumption` method becomes a processor:

```csharp
// OLD
private VehicleConsumptionServiceModel ParseVehicleConsumption(XElement dataRow)
{
    var consumption = new VehicleConsumptionServiceModel();
    foreach (var datacell in dataRow.Descendants("{http://gpsgate.com/xml/}Cell"))
    {
        var refValue = datacell.Attribute("ref")?.Value;
        switch (refValue)
        {
            case "i_0_0_0":
                consumption.VehicleId = int.Parse(datacell.Value);
                break;
            // ...
        }
    }
    return consumption;
}

// NEW
public class FuelConsumptionReportProcessor : BaseReportProcessor<FuelConsumptionReportDto>
{
    public override int ReportId => 208;
    public override string ReportName => "Fuel Consumption Report";

    public override FuelConsumptionReportDto ParseRow(XElement dataRow)
    {
        var dto = new FuelConsumptionReportDto();
        foreach (var cell in dataRow.Descendants("Cell"))
        {
            var refValue = cell.Attribute("ref")?.Value;
            switch (refValue)
            {
                case "i_0_0_0":
                    dto.VehicleId = ParseInt(cell.Value) ?? 0; // Safer parsing
                    break;
                // ...
            }
        }
        return dto;
    }
}
```

### Step 2: Replace Service Method Calls

```csharp
// OLD
var results = await gpsGateService.GetFuelConsumptionReportAsync(conn, 208, from, to);

// NEW - Option A: API
var results = await httpClient.GetFromJsonAsync<FMSResponse<ProcessedReportDto<FuelConsumptionReportDto>>>(
    $"/api/gpsgate/reports/process/fuel-consumption/{handleId}?sessionId={sessionId}");

// NEW - Option B: MediatR
var query = new ProcessReportQuery<FuelConsumptionReportDto>(sessionId, handleId, 208);
var results = await mediator.Send(query);
```

### Step 3: Update Model References

```csharp
// OLD
List<VehicleConsumptionServiceModel> data = ...

// NEW
List<FuelConsumptionReportDto> data = ...
```

### Step 4: Update Callers

```csharp
// OLD
var fuelData = await _gpsGateService.GetFuelConsumptionReportAsync(conn, 208, from, to);
foreach (var item in fuelData)
{
    Console.WriteLine($"Vehicle {item.VehicleId}: {item.TotalFuel}");
}

// NEW
var processQuery = new ProcessReportQuery<FuelConsumptionReportDto>(sessionId, handleId, 208);
var result = await _mediator.Send(processQuery);

if (result.IsSuccess)
{
    foreach (var item in result.Data.Data)
    {
        Console.WriteLine($"Vehicle {item.VehicleId}: {item.TotalFuelProbe}");
    }
}
```

## Benefits of Migration

### 1. Type Safety
```csharp
// OLD - Runtime error if wrong type
var data = await GetFuelConsumptionReportAsync(...); // Returns List<VehicleConsumptionServiceModel>
// What if we want refueling data? Need another method!

// NEW - Compile-time safety
var fuelQuery = new ProcessReportQuery<FuelConsumptionReportDto>(...);
var refuelQuery = new ProcessReportQuery<RefuelingReportDto>(...);
// Different types, same pattern!
```

### 2. Extensibility
```csharp
// OLD - Need to copy/paste entire method for new report
public async Task<List<NewReportModel>> GetNewReportAsync(...)
{
    // 100+ lines of duplicate code
}

// NEW - Just create processor
public class NewReportProcessor : BaseReportProcessor<NewReportDto>
{
    // 30 lines of code
    // Everything else is reused!
}
```

### 3. Testing
```csharp
// OLD - Hard to test
[Fact]
public async Task TestGetFuelConsumption()
{
    // Need to mock SOAP client
    // Need to mock connection
    // Need sample XML
    // Difficult!
}

// NEW - Easy to test
[Fact]
public void TestProcessor()
{
    var processor = new FuelConsumptionReportProcessor(logger);
    var xml = XElement.Parse("<Row kind='i'><Cell ref='i_0_0_0'>101</Cell></Row>");

    var result = processor.ParseRow(xml);

    Assert.Equal(101, result.VehicleId);
}
```

## Example: Full Refactor

### Before
```csharp
public class OldVehicleService
{
    private readonly GPSGateDirectoryWebservice _gpsGateService;

    public async Task<List<VehicleConsumptionServiceModel>> GetDailyConsumption()
    {
        var conn = new GPSGateConections { SessionID = "abc", ... };
        return await _gpsGateService.GetFuelConsumptionReportAsync(
            conn, 208, DateTime.Today, DateTime.Today);
    }
}
```

### After
```csharp
public class NewVehicleService
{
    private readonly IMediator _mediator;
    private readonly string _sessionId;

    public async Task<List<FuelConsumptionReportDto>> GetDailyConsumption()
    {
        // Generate report
        var generateCmd = new GenerateReportCommand(_sessionId, new GenerateReportRequestDto
        {
            ReportId = 208,
            StartDate = DateTime.Today,
            EndDate = DateTime.Today
        });
        var generateResult = await _mediator.Send(generateCmd);

        // Wait for completion (polling)
        // ... (see full examples above)

        // Process with type-safe processor
        var processQuery = new ProcessReportQuery<FuelConsumptionReportDto>(
            _sessionId, handleId, 208);
        var result = await _mediator.Send(processQuery);

        return result.Data.Data;
    }

    // BONUS: Now we can easily add other reports!
    public async Task<List<RefuelingReportDto>> GetDailyRefueling()
    {
        // Same pattern, different type
        var processQuery = new ProcessReportQuery<RefuelingReportDto>(
            _sessionId, handleId, 212);
        var result = await _mediator.Send(processQuery);

        return result.Data.Data;
    }
}
```

## Summary

The new system provides:
- ✅ **One pattern for all reports** instead of one method per report
- ✅ **Type-safe parsing** with compile-time checking
- ✅ **Reusable components** (factory, processors, queries)
- ✅ **Easy testing** with mockable interfaces
- ✅ **Clean separation** of concerns (CQRS, Clean Architecture)
- ✅ **Extensibility** (add new reports in minutes)
- ✅ **Production-ready** error handling and logging

Your old code is **transformed into a maintainable, scalable system**! 🎉
