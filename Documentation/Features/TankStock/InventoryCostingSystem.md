# Inventory Costing System

## Overview
The Inventory Costing System provides comprehensive weighted average cost calculations for fuel inventory management in the FMS system. It uses delivery pricing history to calculate accurate business impact assessments in Kenya Shillings (KES).

## Features

### 1. Weighted Average Cost Calculation
- Calculates weighted average cost per liter based on recent delivery history
- Uses last 60 days or 15 most recent deliveries for calculation
- Falls back to historical data if recent deliveries are not available
- Provides default pricing (150 KES/L) when no delivery history exists

### 2. Stock Valuation
- Real-time stock valuation using weighted average costing
- Tank-level and site-level inventory valuations
- Product-specific valuations
- Comprehensive reporting with currency formatting

### 3. Business Impact Analysis
- Accurate cost impact calculations for stock movements
- Variance-based business impact assessments
- Integration with reconciliation policies
- Support for different movement types (deliveries, transfers, consumption)

## Database Changes

### Delivery Entity (`Delivery.cs`)
```csharp
// Added field for pricing tracking
public decimal PricePerLiter { get; set; }
```

### Delivery DTO (`DeliveryDTO.cs`)
```csharp
// Added field for API communication
public decimal PricePerLiter { get; set; }
```

## Frontend Changes

### Tank Delivery Form (`TankDeliveryForm.js`)
- Added price per liter input field with KES currency formatting
- Validation rules for minimum price (> 0.01 KES)
- Integrated with existing form validation

## Services

### InventoryCostingService
Located: `FMS.Application/Features/TankManagement/Services/InventoryCostingService.cs`

#### Key Methods:
- `GetWeightedAverageCostAsync(tankId)` - Calculate weighted average cost
- `GetStockValuationAsync(tankId, stockLiters)` - Get current stock valuation
- `CalculateMovementCostImpactAsync()` - Calculate cost impact of stock movements
- `GetSiteInventoryValuationAsync(siteId)` - Get comprehensive site valuation

### Enhanced DailyReconciliationPolicyService
- Integrated with InventoryCostingService for accurate business impact calculations
- Replaced simple $1.50/L calculation with weighted average costing
- Improved logging and error handling

## Data Models

### StockValuation
```csharp
public class StockValuation
{
    public int TankId { get; set; }
    public string TankName { get; set; }
    public string SiteName { get; set; }
    public decimal StockLiters { get; set; }
    public decimal CostPerLiter { get; set; }
    public decimal TotalValue { get; set; }
    public string Currency { get; set; } // "KES"
    public DateTime ValuationDate { get; set; }
    public string Product { get; set; }
}
```

### StockMovementCostImpact
```csharp
public class StockMovementCostImpact
{
    public int TankId { get; set; }
    public decimal PreviousStockLiters { get; set; }
    public decimal CurrentStockLiters { get; set; }
    public decimal StockMovementLiters { get; set; }
    public decimal CostPerLiter { get; set; }
    public decimal PreviousStockValue { get; set; }
    public decimal CurrentStockValue { get; set; }
    public decimal CostImpact { get; set; }
    public string MovementType { get; set; }
    public string Currency { get; set; } // "KES"
    public DateTime CalculationDate { get; set; }
}
```

### SiteInventoryValuation
```csharp
public class SiteInventoryValuation
{
    public int SiteId { get; set; }
    public string SiteName { get; set; }
    public int TankCount { get; set; }
    public decimal TotalStockLiters { get; set; }
    public decimal TotalValue { get; set; }
    public decimal WeightedAverageCostPerLiter { get; set; }
    public string Currency { get; set; } // "KES"
    public DateTime ValuationDate { get; set; }
    public List<StockValuation> TankValuations { get; set; }
}
```

## Usage Examples

### Getting Tank Weighted Average Cost
```csharp
var costingService = serviceProvider.GetService<InventoryCostingService>();
var costResponse = await costingService.GetWeightedAverageCostAsync(tankId);

if (costResponse.IsSuccess)
{
    var costPerLiter = costResponse.Data; // Cost in KES
    Console.WriteLine($"Weighted average cost: {costPerLiter:C} KES/L");
}
```

### Getting Stock Valuation
```csharp
var valuationResponse = await costingService.GetStockValuationAsync(tankId, currentStock);

if (valuationResponse.IsSuccess)
{
    var valuation = valuationResponse.Data;
    Console.WriteLine($"Tank {valuation.TankName}: {valuation.StockLiters}L worth {valuation.TotalValue:C} KES");
}
```

### Calculating Movement Cost Impact
```csharp
var impactResponse = await costingService.CalculateMovementCostImpactAsync(
    tankId, previousStock, currentStock, "Delivery");

if (impactResponse.IsSuccess)
{
    var impact = impactResponse.Data;
    Console.WriteLine($"Stock movement impact: {impact.CostImpact:C} KES");
}
```

## Business Rules

### Weighted Average Calculation Logic
1. **Primary**: Use deliveries from last 60 days (max 15 deliveries)
2. **Secondary**: Use last 10 deliveries regardless of date
3. **Fallback**: Use default price of 150 KES/L

### Calculation Formula
```
Weighted Average Cost = Sum(Delivery Amount × Price Per Liter) / Sum(Delivery Amount)
```

### Business Impact Calculation
```
Business Impact = |Variance in Liters| × Weighted Average Cost Per Liter
```

## Integration Points

### Automated Reconciliation
- Enhanced business impact calculations for discrepancy records
- Integration with reconciliation policies
- Improved variance analysis with actual cost data

### Delivery Management
- Price tracking for all new deliveries
- Historical pricing analysis
- Cost basis establishment for inventory

### Reporting
- Stock valuation reports
- Cost impact analysis
- Movement tracking with financial implications

## Configuration

### Default Settings
- Default price per liter: 150 KES
- Historical data period: 60 days
- Maximum deliveries in calculation: 15
- Currency: Kenya Shillings (KES)

### Logging
The system provides comprehensive logging for:
- Weighted average cost calculations
- Business impact assessments
- Error handling and fallback scenarios
- Performance monitoring

## Error Handling

### Graceful Fallbacks
- Default pricing when no delivery history available
- Simple calculations when service calls fail
- Comprehensive error logging
- User-friendly error messages

### Validation
- Price per liter must be greater than 0.01 KES
- Stock quantities must be non-negative
- Tank and site existence validation
- Data consistency checks

## Performance Considerations

### Optimization Strategies
- Efficient database queries with proper indexing
- Caching of frequently accessed calculations
- Batch processing for site-level valuations
- Asynchronous operations for better responsiveness

### Monitoring
- Query performance tracking
- Calculation accuracy monitoring
- Error rate analysis
- Usage pattern analysis

## Future Enhancements

### Planned Features
1. **FIFO/LIFO Costing Methods**: Alternative costing methodologies
2. **Price Alerts**: Notifications for significant price changes
3. **Trend Analysis**: Historical cost trend reporting
4. **Budget Integration**: Cost budgeting and variance analysis
5. **Multi-Currency Support**: Support for additional currencies
6. **Real-time Dashboards**: Live inventory valuation displays

### Technical Improvements
1. **Performance Optimization**: Query optimization and caching
2. **Audit Trail**: Comprehensive change tracking
3. **API Endpoints**: RESTful APIs for external integrations
4. **Mobile Support**: Mobile-optimized interfaces
5. **Export Capabilities**: Excel and PDF report generation

## Database Migration Required

### SQL Script for Delivery Table Update
```sql
-- Add PricePerLiter column to Delivery table
ALTER TABLE `Delivery` ADD COLUMN `PricePerLiter` DECIMAL(10,2) NOT NULL DEFAULT 150.00
COMMENT 'Price per liter in Kenya Shillings (KES)';

-- Create index for performance optimization
CREATE INDEX `IX_Delivery_TankId_DeliveryDate_PricePerLiter`
ON `Delivery` (`TankId`, `DeliveryDate` DESC, `PricePerLiter`);

-- Update existing records with default price
UPDATE `Delivery`
SET `PricePerLiter` = 150.00
WHERE `PricePerLiter` = 0 OR `PricePerLiter` IS NULL;
```

## Maintenance

### Regular Tasks
- Monitor calculation accuracy
- Review default pricing settings
- Validate data consistency
- Performance optimization
- Error log analysis

### Database Maintenance
- Regular index maintenance
- Data archival strategies
- Backup and recovery procedures
- Performance monitoring

---

*Last Updated: Created as part of advanced inventory costing implementation*