# Vehicle Consumption Comparison - Backend Implementation Guide

**Created:** 2025-11-08
**Feature:** Multi-vehicle consumption comparison with site filtering and trend analysis
**Frontend Implementation:** ✅ Complete
**Backend Implementation:** ⏳ Required

---

## Overview

This feature allows users to compare fuel consumption across multiple vehicles and sites with advanced filtering, grouping options, and trend visualization.

## Frontend Expectations

### API Endpoint
```
GET /api/consumption/comparison
```

### Request Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `dateFrom` | string (ISO) | Yes | Start date (YYYY-MM-DD) |
| `dateTo` | string (ISO) | Yes | End date (YYYY-MM-DD) |
| `siteIds` | string | Conditional* | Comma-separated site IDs (e.g., "1,2,3") |
| `vehicleIds` | string | Conditional* | Comma-separated vehicle IDs (e.g., "5,10,15") |
| `groupBy` | string | Yes | Grouping mode: "vehicle", "site", or "date" |

*At least one of `siteIds` or `vehicleIds` must be provided.

### Example Requests

```http
# Compare all vehicles in specific sites
GET /api/consumption/comparison?dateFrom=2024-10-01&dateTo=2024-10-31&siteIds=1,2,3&groupBy=vehicle

# Compare specific vehicles across all sites
GET /api/consumption/comparison?dateFrom=2024-10-01&dateTo=2024-10-31&vehicleIds=5,10,15&groupBy=site

# Compare specific vehicles in specific sites
GET /api/consumption/comparison?dateFrom=2024-10-01&dateTo=2024-10-31&siteIds=1,2&vehicleIds=5,10&groupBy=date
```

---

## Expected Response Format

### Response Structure
```json
{
  "success": true,
  "data": [
    {
      "vehicleId": 5,
      "vehicleNo": "HK-001",
      "siteId": 1,
      "site": "Nairobi Branch",
      "date": "2024-10-15",
      "fuelType": "Diesel",
      "totalDistance": 250.50,
      "totalFuel": 45.30,
      "engHours": 8.50,
      "fuelLost": 2.10,
      "excessFuel": 0.50,
      "stockReceived": 50.00,
      "openingMeter": 1000.00,
      "closingMeter": 1250.50,
      "openingFuelLevel": 20.00,
      "closingFuelLevel": 25.20,
      "isAverageKm": true,
      "employee": "John Doe",
      "remarks": "Normal operations"
    }
    // ... more records
  ],
  "message": "Comparison data retrieved successfully"
}
```

### Field Descriptions

| Field | Type | Description |
|-------|------|-------------|
| `vehicleId` | int | Unique vehicle identifier |
| `vehicleNo` | string | Vehicle number/registration (e.g., "HK-001") |
| `siteId` | int | Site identifier |
| `site` | string | Site name |
| `date` | string | Date (YYYY-MM-DD format) |
| `fuelType` | string | Fuel type (e.g., "Diesel", "Petrol") |
| `totalDistance` | decimal | Distance traveled in km |
| `totalFuel` | decimal | Fuel consumed in liters |
| `engHours` | decimal | Engine hours |
| `fuelLost` | decimal | Fuel lost in liters |
| `excessFuel` | decimal | Excess fuel in liters |
| `stockReceived` | decimal | Stock received in liters |
| `openingMeter` | decimal | Opening odometer reading |
| `closingMeter` | decimal | Closing odometer reading |
| `openingFuelLevel` | decimal | Opening fuel level in liters |
| `closingFuelLevel` | decimal | Closing fuel level in liters |
| `isAverageKm` | boolean | True if vehicle tracks km/L, false if L/hr |
| `employee` | string | Driver/operator name |
| `remarks` | string | Additional notes |

---

## Backend Implementation Steps

### 1. Create Query in Application Layer

**Location:** `FMS.Application/Features/Consumption/Queries/GetVehicleConsumptionComparisonQuery.cs`

```csharp
using MediatR;
using FMS.Application.Common;

namespace FMS.Application.Features.Consumption.Queries
{
    public record GetVehicleConsumptionComparisonQuery(
        DateTime DateFrom,
        DateTime DateTo,
        List<int>? SiteIds,
        List<int>? VehicleIds,
        string GroupBy
    ) : IRequest<FMSResponse<List<VehicleConsumptionComparisonDto>>>;
}
```

### 2. Create DTO

**Location:** `FMS.Application/Features/Consumption/DTOs/VehicleConsumptionComparisonDto.cs`

```csharp
namespace FMS.Application.Features.Consumption.DTOs
{
    public class VehicleConsumptionComparisonDto
    {
        public int VehicleId { get; set; }
        public string VehicleNo { get; set; }
        public int SiteId { get; set; }
        public string Site { get; set; }
        public DateTime Date { get; set; }
        public string FuelType { get; set; }
        public decimal TotalDistance { get; set; }
        public decimal TotalFuel { get; set; }
        public decimal EngHours { get; set; }
        public decimal FuelLost { get; set; }
        public decimal ExcessFuel { get; set; }
        public decimal StockReceived { get; set; }
        public decimal OpeningMeter { get; set; }
        public decimal ClosingMeter { get; set; }
        public decimal OpeningFuelLevel { get; set; }
        public decimal ClosingFuelLevel { get; set; }
        public bool IsAverageKm { get; set; }
        public string Employee { get; set; }
        public string Remarks { get; set; }
    }
}
```

### 3. Create Query Handler

**Location:** `FMS.Application/Features/Consumption/Queries/GetVehicleConsumptionComparisonQueryHandler.cs`

```csharp
using MediatR;
using Microsoft.EntityFrameworkCore;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;

namespace FMS.Application.Features.Consumption.Queries
{
    public class GetVehicleConsumptionComparisonQueryHandler
        : IRequestHandler<GetVehicleConsumptionComparisonQuery, FMSResponse<List<VehicleConsumptionComparisonDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetVehicleConsumptionComparisonQueryHandler> _logger;

        public GetVehicleConsumptionComparisonQueryHandler(
            GpsdataContext context,
            ILogger<GetVehicleConsumptionComparisonQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<VehicleConsumptionComparisonDto>>> Handle(
            GetVehicleConsumptionComparisonQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Validate at least one filter is provided
                if ((request.SiteIds == null || !request.SiteIds.Any()) &&
                    (request.VehicleIds == null || !request.VehicleIds.Any()))
                {
                    return FMSResponse<List<VehicleConsumptionComparisonDto>>
                        .ValidationFailed("Either siteIds or vehicleIds must be provided");
                }

                // Build base query from consumption history
                var query = _context.VehicleConsumptionHistory
                    .Include(c => c.Vehicle)
                    .Include(c => c.Site)
                    .Where(c => c.Date >= request.DateFrom && c.Date <= request.DateTo);

                // Apply site filter
                if (request.SiteIds != null && request.SiteIds.Any())
                {
                    query = query.Where(c => request.SiteIds.Contains(c.SiteId));
                }

                // Apply vehicle filter
                if (request.VehicleIds != null && request.VehicleIds.Any())
                {
                    query = query.Where(c => request.VehicleIds.Contains(c.VehicleId));
                }

                // Execute query
                var results = await query
                    .OrderBy(c => c.Date)
                    .ThenBy(c => c.VehicleId)
                    .Select(c => new VehicleConsumptionComparisonDto
                    {
                        VehicleId = c.VehicleId,
                        VehicleNo = c.Vehicle.VehicleCode,
                        SiteId = c.SiteId,
                        Site = c.Site.Name,
                        Date = c.Date,
                        FuelType = c.FuelType ?? "Diesel",
                        TotalDistance = c.TotalDistance ?? 0,
                        TotalFuel = c.TotalFuel ?? 0,
                        EngHours = c.EngineHours ?? 0,
                        FuelLost = c.FuelLost ?? 0,
                        ExcessFuel = c.ExcessFuel ?? 0,
                        StockReceived = c.StockReceived ?? 0,
                        OpeningMeter = c.OpeningMeter ?? 0,
                        ClosingMeter = c.ClosingMeter ?? 0,
                        OpeningFuelLevel = c.OpeningFuelLevel ?? 0,
                        ClosingFuelLevel = c.ClosingFuelLevel ?? 0,
                        IsAverageKm = c.IsAverageKm ?? true,
                        Employee = c.Employee ?? "N/A",
                        Remarks = c.Remarks ?? ""
                    })
                    .ToListAsync(cancellationToken);

                _logger.LogInformation(
                    "Retrieved {Count} consumption records for comparison",
                    results.Count);

                return FMSResponse<List<VehicleConsumptionComparisonDto>>
                    .Success(results, $"Retrieved {results.Count} records");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving vehicle consumption comparison data");
                return FMSResponse<List<VehicleConsumptionComparisonDto>>
                    .Error("Failed to retrieve comparison data");
            }
        }
    }
}
```

### 4. Create API Controller Endpoint

**Location:** `FMS.WebClient/Controllers/ConsumptionController.cs`

```csharp
[HttpGet("comparison")]
[ProducesResponseType(typeof(FMSResponse<List<VehicleConsumptionComparisonDto>>), 200)]
public async Task<IActionResult> GetComparison(
    [FromQuery] DateTime dateFrom,
    [FromQuery] DateTime dateTo,
    [FromQuery] string? siteIds,
    [FromQuery] string? vehicleIds,
    [FromQuery] string groupBy = "vehicle")
{
    try
    {
        // Parse comma-separated IDs
        var parsedSiteIds = string.IsNullOrEmpty(siteIds)
            ? null
            : siteIds.Split(',').Select(int.Parse).ToList();

        var parsedVehicleIds = string.IsNullOrEmpty(vehicleIds)
            ? null
            : vehicleIds.Split(',').Select(int.Parse).ToList();

        var query = new GetVehicleConsumptionComparisonQuery(
            dateFrom,
            dateTo,
            parsedSiteIds,
            parsedVehicleIds,
            groupBy
        );

        var result = await _mediator.Send(query);

        return result.IsSuccess ? Ok(result) : BadRequest(result);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in GetComparison endpoint");
        return StatusCode(500, FMSResponse<List<VehicleConsumptionComparisonDto>>
            .Error("Internal server error"));
    }
}
```

---

## Database Considerations

### Required Tables
- `vehicleconsumptionhistory` - Main consumption data
- `vehicles` - Vehicle information
- `sites` - Site information

### Indexes for Performance
```sql
-- Index on date range queries
CREATE INDEX idx_consumption_date ON vehicleconsumptionhistory(Date);

-- Index on site filtering
CREATE INDEX idx_consumption_site ON vehicleconsumptionhistory(SiteId);

-- Index on vehicle filtering
CREATE INDEX idx_consumption_vehicle ON vehicleconsumptionhistory(VehicleId);

-- Composite index for common queries
CREATE INDEX idx_consumption_composite
ON vehicleconsumptionhistory(Date, SiteId, VehicleId);
```

---

## Testing

### Test Cases

1. **Site-based comparison**
   - Request with multiple siteIds
   - Verify all vehicles in those sites are included
   - Check date filtering

2. **Vehicle-based comparison**
   - Request with specific vehicleIds
   - Verify only those vehicles are included
   - Check cross-site data

3. **Combined filtering**
   - Both siteIds and vehicleIds provided
   - Verify intersection logic works correctly

4. **Edge cases**
   - No data in date range
   - Invalid site/vehicle IDs
   - Large date ranges (performance)

### Sample Test Data
```sql
-- Insert test consumption records
INSERT INTO vehicleconsumptionhistory
(VehicleId, SiteId, Date, TotalDistance, TotalFuel, EngineHours, IsAverageKm)
VALUES
(1, 1, '2024-10-15', 250.00, 45.30, 8.5, 1),
(2, 1, '2024-10-15', 180.00, 38.20, 7.2, 1),
(1, 2, '2024-10-16', 220.00, 42.10, 8.0, 1);
```

---

## Performance Considerations

1. **Limit date ranges** - Consider max 1 year for large datasets
2. **Pagination** - Add pagination for very large result sets
3. **Caching** - Cache frequently accessed comparisons
4. **Async operations** - Use async/await for all database calls

---

## Security

- ✅ Validate user permissions to view consumption data
- ✅ Validate site/vehicle access based on user roles
- ✅ Sanitize input parameters to prevent SQL injection
- ✅ Log access for audit trail

---

## Error Handling

### Common Errors
- No site or vehicle IDs provided → 400 Bad Request
- Invalid date range → 400 Bad Request
- No data found → 200 OK with empty array
- Database error → 500 Internal Server Error

---

## Next Steps

1. ✅ Frontend implementation complete
2. ⏳ Implement backend query handler
3. ⏳ Add API controller endpoint
4. ⏳ Test with real data
5. ⏳ Add to API documentation
6. ⏳ Performance testing

---

**Status:** Ready for Backend Implementation
**Priority:** Medium
**Estimated Time:** 4-6 hours
