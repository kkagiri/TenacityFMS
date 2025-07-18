# GetPumpTransactionQuery Documentation

## Overview
The `GetPumpTransactionQuery` and `GetPumpTransactionQueryHandler` provide a comprehensive querying mechanism for retrieving pump transaction records from the FMS system. This query handler follows CQRS patterns and implements proper validation and error handling using the FMSResponse framework.

## Features

### Query Parameters
- **TankId**: Filter transactions by specific tank
- **VehicleId**: Filter transactions by specific vehicle
- **PtsId**: Filter transactions by PTS device identifier
- **StartDate**: Filter transactions from a specific start date
- **EndDate**: Filter transactions up to a specific end date
- **ProcessedOnly**: Filter by processing status (true for processed, false for unprocessed)

### Validation Rules
1. **Date Range Validation**: Start date cannot be greater than end date
2. **PtsId Length Validation**: PTS ID cannot exceed 100 characters
3. **Required Filter Validation**: At least one filter parameter must be provided to prevent returning all records

### Response Structure
Returns `FMSResponse<IEnumerable<PumpTransactionDto>>` containing:
- **Success/Failure Status**: Boolean indicating operation success
- **Message**: Descriptive message about the operation result
- **Data**: Collection of PumpTransactionDto objects
- **Error Type**: Categorized error type if operation fails

## Implementation Details

### Query Class
```csharp
public class GetPumpTransactionQuery : IRequest<FMSResponse<IEnumerable<PumpTransactionDto>>>
{
    public int? TankId { get; set; }
    public int? VehicleId { get; set; }
    public string? PtsId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public bool? ProcessedOnly { get; set; }
}
```

### Query Handler
The handler implements:
- **Input Validation**: Comprehensive validation of all query parameters
- **Database Querying**: Efficient EF Core queries with proper filtering
- **Entity Relationships**: Includes related Tank and Vehicle data
- **Error Handling**: Catches and categorizes exceptions appropriately
- **Response Mapping**: Maps domain entities to DTOs

### Database Query Logic
1. **Base Query**: Starts with `Pumptransactions.AsNoTracking()` for read-only operations
2. **Filter Application**: Applies filters conditionally based on provided parameters
3. **Relationship Loading**: Uses `Include()` for Tank and Vehicle relationships
4. **Site Filtering**: Filters by site through Tank relationship navigation
5. **Result Ordering**: Orders results by DateTime in descending order (newest first)

### Mapping to DTO
Maps all relevant fields from `Pumptransaction` entity to `PumpTransactionDto`:
- Core transaction data (PtsId, Pump, Transaction, Nozzle)
- Fuel information (FuelGradeId, FuelGradeName)
- Volume and pricing data (Volume, TCVolume, Price, Amount)
- Timestamps (DateTime, DateTimeStart)
- Relationships (TankId, VehicleId)
- Processing status (HasBeenProcessed)

## Usage Examples

### Filter by Tank
```csharp
var query = new GetPumpTransactionQuery
{
    TankId = 123
};
var result = await mediator.Send(query);
```

### Filter by Date Range
```csharp
var query = new GetPumpTransactionQuery
{
    StartDate = DateTime.Today.AddDays(-7),
    EndDate = DateTime.Today
};
var result = await mediator.Send(query);
```

## Error Handling

### Validation Errors
- Returns `FMSResponse.ValidationFailed()` with list of validation errors
- Common validation errors:
  - Invalid date range
  - PTS ID too long
  - No filter parameters provided

### System Errors
- Returns `FMSResponse.SystemError()` for database or system exceptions
- Logs detailed error information for debugging
- Provides user-friendly error messages

## Performance Considerations

### Indexing Requirements
The query benefits from the following database indexes:
- `idx_pumptransaction_tankid` on TankId
- `idx_pumptransaction_vehicleid` on VehicleId
- `idx_pumptransaction_processed` on HasBeenProcessed
- `idx_pumptransaction_datetime` on DateTime
- `idx_pumptransaction_pump_transaction` on (Pump, Transaction)
- `idx_pumptransaction_pts_transaction_unique` on (PtsId, Transaction)

### Query Optimization
- Uses `AsNoTracking()` for read-only operations
- Conditional filtering reduces result set size
- Ordering applied at database level
- Includes related entities efficiently

## Related Components

### Dependencies
- **GpsdataContext**: Entity Framework database context
- **PumpTransactionDto**: Data transfer object for results
- **FMSResponse**: Standardized response wrapper

### Related Entities
- **Pumptransaction**: Main entity being queried
- **Tank**: Related entity for site filtering
- **Vehicle**: Related entity for vehicle information
- **Ptsdevice**: Related entity for PTS device information

### Integration Points
- **TankManagement Module**: Primary consumer for tank-related queries
- **Reporting System**: Uses for transaction reports and analytics
- **API Controllers**: Exposes functionality to frontend applications
- **Background Services**: May use for automated processing workflows

## Best Practices

### Query Usage
1. Always provide at least one filter parameter
2. Use date ranges for time-based queries to limit result sets
3. Consider using ProcessedOnly filter for specific workflows
4. Handle validation errors appropriately in consuming code

### Performance
1. Avoid querying without filters for large datasets
2. Use appropriate date ranges to limit results
3. Consider pagination for large result sets in future enhancements
4. Monitor query performance and adjust indexing as needed

### Error Handling
1. Always check `IsSuccess` property of FMSResponse
2. Display validation errors to users appropriately
3. Log system errors for debugging
4. Provide meaningful feedback for empty result sets

## Future Enhancements

### Pagination Support
Consider adding pagination parameters:
- PageNumber
- PageSize
- TotalCount in response

### Additional Filters
Potential new filter parameters:
- FuelGradeId
- Transaction ID range
- Amount range
- Volume range

### Performance Optimization
- Implement result caching for frequent queries
- Add query result compression for large datasets
- Consider read replicas for reporting scenarios

## Testing Considerations

### Unit Tests
- Test validation logic with various invalid inputs
- Test filter combinations
- Test error handling scenarios
- Test DTO mapping accuracy

### Integration Tests
- Test database queries with real data
- Test performance with large datasets
- Test concurrent access scenarios
- Test transaction isolation levels

### Load Testing
- Test query performance under high load
- Monitor database connection usage
- Test memory usage with large result sets
- Validate response times meet requirements
