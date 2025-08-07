# Sensor Integration with Reconciliation Services - Implementation Documentation

## Overview

This document describes the enhanced implementation that integrates sensor readings from PTS devices with the robust reconciliation system, enabling comprehensive variance detection between manual entries, sensor readings, and calculated book values.

## Implementation Components

### 1. Enhanced Background Services

#### A. AutomatedClosingStockService - Sensor Integration
```csharp
case "Sensor":
    // Get latest sensor reading from tank measurements
    var tank = await context.Tanks.FindAsync(new object[] { tankId }, stoppingToken);
    if (tank?.PtsId != null) {
        var latestMeasurement = await context.Tankmeasurements
            .Where(tm => tm.Ptsid == tank.PtsId)
            .OrderByDescending(tm => tm.DateTime)
            .FirstOrDefaultAsync(stoppingToken);

        if (latestMeasurement?.ProductVolume.HasValue == true &&
            latestMeasurement.ProductVolume.Value > 0) {
            // Use sensor reading if recent (within last 24 hours)
            var measurementAge = DateTime.Now - latestMeasurement.DateTime;
            if (measurementAge.TotalHours <= 24) {
                return (decimal)latestMeasurement.ProductVolume.Value;
            }
        }
    }
    break;
```

**Features**:
- Automatically retrieves latest sensor readings from PTS devices
- 24-hour freshness validation for sensor data
- Fallback to next priority if sensor data unavailable
- Integrated with existing priority system

#### B. AutomatedOpeningStockService - Sensor Integration
- Same sensor logic implementation
- Configured priority: `["Sensor", "ClosingStock", "CurrentVolume"]`
- Ensures consistent sensor-first approach across opening/closing operations

### 2. Enhanced ClosingStockCommand - Comprehensive Variance Analysis

#### A. Multi-Level Variance Detection

**Traditional Reconciliation**:
```csharp
var reconciliationResult = await PerformReconciliationAnalysis(
    openingStock.NewVolume ?? 0,
    request.ClosingStock,
    totalDeliveries ?? 0,
    totalRefills ?? 0,
    totalTransfersIn ?? 0,
    totalTransfersOut ?? 0,
    request.TankId,
    entryDate,
    cancellationToken);
```

**New Sensor Variance Analysis**:
```csharp
await PerformSensorVarianceAnalysis(
    request.TankId,
    request.ClosingStock,
    entryDate,
    request.RecordedBy,
    cancellationToken);
```

#### B. Sensor vs Manual Variance Detection

```csharp
private async Task PerformSensorVarianceAnalysis(
    int tankId,
    decimal manualClosingStock,
    DateTime entryDate,
    string recordedBy,
    CancellationToken cancellationToken) {

    // Get recent sensor reading (within 24 hours)
    var latestSensorReading = await _context.Tankmeasurements
        .Where(tm => tm.Ptsid == tank.PtsId && tm.DateTime >= cutoffTime)
        .OrderByDescending(tm => tm.DateTime)
        .FirstOrDefaultAsync(cancellationToken);

    // Calculate variance
    var sensorVolume = (decimal)latestSensorReading.ProductVolume.Value;
    var variance = manualClosingStock - sensorVolume;
    var variancePercentage = sensorVolume > 0 ? (Math.Abs(variance) / sensorVolume) * 100 : 0;

    // Create discrepancy record if significant
    if (isSignificantVariance) {
        var discrepancy = new ReconciliationDiscrepancy {
            // ... discrepancy details
            AnalysisNotes = $"Sensor vs Manual Closing Stock variance detected. " +
                $"Manual Entry: {manualClosingStock}L, Sensor Reading: {sensorVolume}L"
        };
    }
}
```

**Thresholds**:
- Variance Threshold: 5.0 liters
- Percentage Threshold: 2.0%
- Higher tolerance than transaction-based reconciliation due to sensor calibration differences

#### C. Severity Classification for Sensor Variance

```csharp
private DiscrepancySeverity DetermineSensorVarianceSeverity(decimal absVarianceLiters, decimal variancePercentage) {
    return (absVarianceLiters, variancePercentage) switch {
        (>= 20.0m, _) or (_, >= 10.0m) => DiscrepancySeverity.Critical,
        (>= 10.0m, _) or (_, >= 5.0m) => DiscrepancySeverity.High,
        (>= 5.0m, _) or (_, >= 2.0m) => DiscrepancySeverity.Medium,
        _ => DiscrepancySeverity.Low
    };
}
```

### 3. Enhanced CreateTankMeasurementCommand

#### A. Configurable Physical Stock Updates

```csharp
// Check system configuration for sensor-based physical stock updates
var enableSensorPhysicalStock = await GetConfigurationValueAsync(
    "Tank.EnableSensorPhysicalStockUpdate", false, cancellationToken);

if (enableSensorPhysicalStock && tankMeasurementDto.ProductVolume.HasValue &&
    tankMeasurementDto.ProductVolume.Value > 0) {
    // Update physical stock from sensor reading
    tank.PhysicalStockValue = (decimal)tankMeasurementDto.ProductVolume.Value;
    tank.PhysicalStockSource = "Automated Sensor Reading";
    tank.LastPhysicalStockUpdate = tankMeasurementDto.DateTime;
}
```

**Configuration Control**:
- Database configuration: `Tank.EnableSensorPhysicalStockUpdate`
- Allows per-deployment control of sensor-based updates
- Proper fallback handling if configuration unavailable

### 4. Enhanced DiscrepancyDetectionService

#### A. Physical vs Book Stock Detection

```csharp
public async Task<PhysicalStockDiscrepancyResult> DetectPhysicalStockDiscrepancies(
    Tank tank,
    decimal? thresholdLiters = null,
    decimal? thresholdPercentage = null,
    CancellationToken cancellationToken = default) {

    var physicalStock = tank.PhysicalStockValue ?? 0;
    var bookStock = tank.CurrentStock ?? 0;
    var varianceAmount = physicalStock - bookStock;
    var variancePercentage = bookStock > 0 ? Math.Abs(varianceAmount) / bookStock * 100 : 0;

    return new PhysicalStockDiscrepancyResult {
        TankId = tank.Id,
        PhysicalStock = physicalStock,
        BookStock = bookStock,
        VarianceAmount = varianceAmount,
        VariancePercentage = variancePercentage,
        IsSignificant = isSignificant,
        PhysicalStockSource = tank.PhysicalStockSource,
        LastPhysicalUpdate = tank.LastPhysicalStockUpdate
    };
}
```

#### B. Bulk Physical Stock Analysis

```csharp
public async Task<List<PhysicalStockDiscrepancyResult>> GetTanksWithPhysicalStockDiscrepanciesAsync(
    int? siteId = null,
    decimal thresholdPercentage = 2.0m,
    CancellationToken cancellationToken = default) {

    // Query tanks with both physical and current stock values
    var tanks = await _context.Tanks
        .Include(t => t.Site)
        .Where(t => t.PhysicalStockValue.HasValue && t.CurrentStock.HasValue)
        .ToListAsync(cancellationToken);

    // Analyze each tank for discrepancies
    foreach (var tank in tanks) {
        var discrepancyResult = await DetectPhysicalStockDiscrepancies(tank, cancellationToken);
        if (discrepancyResult.IsSignificant) {
            results.Add(discrepancyResult);
        }
    }
}
```

## Variance Analysis Flow

### 1. Daily Stock Operations with Sensor Integration

```
Daily Stock Cycle:
├── Opening Stock (Automated)
│   ├── Priority 1: Latest Sensor Reading (< 24h)
│   ├── Priority 2: Previous Closing Stock
│   └── Priority 3: Current Volume
│
├── Transaction Processing (Real-time)
│   ├── Updates CurrentStock (book value)
│   └── Maintains transaction history
│
├── Sensor Updates (Real-time)
│   ├── CreateTankMeasurementCommand
│   ├── Updates PhysicalStockValue (if enabled)
│   └── Sets source as "Automated Sensor Reading"
│
└── Closing Stock (Manual + Automated Analysis)
    ├── Manual Entry Processing
    ├── Traditional Reconciliation (vs transactions)
    ├── Sensor Variance Analysis (vs sensor readings)
    └── Physical vs Book Analysis (via DiscrepancyDetectionService)
```

### 2. Multi-Dimensional Variance Detection

```
Variance Analysis Types:

1. Transaction-Based Reconciliation:
   Expected = Opening + Deliveries - Consumption ± Transfers
   Actual = Manual Closing Stock
   Purpose: Detect transaction recording issues

2. Sensor vs Manual Variance:
   Expected = Latest Sensor Reading
   Actual = Manual Closing Stock
   Purpose: Detect measurement accuracy issues

3. Physical vs Book Reconciliation:
   Expected = CurrentStock (calculated from transactions)
   Actual = PhysicalStockValue (sensor/manual measurements)
   Purpose: Detect ongoing book-keeping accuracy
```

### 3. Discrepancy Record Creation

```csharp
ReconciliationDiscrepancy Record:
├── Traditional Discrepancy
│   ├── AnalysisNotes: "Daily closing stock reconciliation variance"
│   ├── ExpectedStock: Calculated from transactions
│   └── CurrentStock: Manual closing stock entry
│
└── Sensor Variance Discrepancy
    ├── AnalysisNotes: "Sensor vs Manual Closing Stock variance"
    ├── ExpectedStock: Sensor reading
    ├── CurrentStock: Manual closing stock entry
    └── Additional context: Sensor timestamp, recorded by
```

## Notification System Integration

### 1. Sensor Variance Notifications

```csharp
Alert Types:
├── "SensorVariance" Category
├── Priority based on severity (High/Medium/Low)
├── Recipients: Site Manager, Inventory Manager
└── Delivery: System + Email for critical issues

Message Content:
- Manual vs Sensor variance details
- Severity assessment
- Sensor timestamp and reading
- User who recorded manual entry
- Recommended action based on variance magnitude
```

### 2. Multi-Channel Alerts

```
Notification Recipients:
├── Site Managers: Operational awareness
├── Inventory Managers: Stock accuracy oversight
├── System Administrators: Technical issues
└── Maintenance Teams: Sensor calibration needs
```

## Configuration and Thresholds

### 1. System Configuration

```sql
-- Enable sensor-based physical stock updates
INSERT INTO SystemConfigurations (
    ConfigurationKey, ConfigurationValue, Description, DataType,
    IsActive, IsEditable, Category
) VALUES (
    'Tank.EnableSensorPhysicalStockUpdate', 'false',
    'Enable automatic physical stock updates from sensor readings',
    'Bool', 1, 1, 'Tank Management'
);
```

### 2. Variance Thresholds

```
Transaction-Based Reconciliation:
├── Default: 1.0L or 1.0%
├── Configurable via ReconciliationPolicy
└── Business impact calculated via InventoryCostingService

Sensor vs Manual Variance:
├── Default: 5.0L or 2.0%
├── Higher tolerance for sensor calibration differences
└── Severity-based escalation

Physical vs Book Reconciliation:
├── Default: 1.0L or 1.0%
├── Configurable via DiscrepancyDetectionService
└── Continuous monitoring capability
```

## Benefits and Use Cases

### 1. Operational Excellence

- **Early Detection**: Sensor variance alerts identify measurement issues immediately
- **Data Quality**: Multiple validation points ensure accurate inventory records
- **Automated Processing**: Reduces manual intervention while maintaining oversight
- **Audit Trail**: Complete history of all variance types and resolutions

### 2. Business Value

- **Inventory Accuracy**: Multiple reconciliation methods ensure precise stock levels
- **Loss Prevention**: Quick detection of discrepancies prevents significant losses
- **Compliance**: Comprehensive audit trail supports regulatory requirements
- **Cost Optimization**: Accurate costing via InventoryCostingService

### 3. Integration Benefits

- **Existing Infrastructure**: Leverages robust reconciliation framework
- **Scalable Configuration**: Database-driven settings for operational flexibility
- **Comprehensive Notifications**: Multi-channel alerts for appropriate stakeholders
- **Historical Analysis**: Rich data for trend analysis and process improvement

This implementation provides a comprehensive solution that maintains the existing robust reconciliation architecture while adding sophisticated sensor integration and multi-dimensional variance detection capabilities.
