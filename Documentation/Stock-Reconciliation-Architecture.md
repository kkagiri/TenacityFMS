# FMS Reconciliation Service - Physical Stock & Current Stock Management Documentation

## Overview

Your FMS (Fuel Management System) has a robust reconciliation architecture that manages two distinct but interconnected stock values:

- **Current Stock** (`CurrentStock`): Book value calculated from transactions
- **Physical Stock** (`PhysicalStockValue`): Actual measured physical inventory

## Architecture Components

### 1. Core Entities

#### Tank Entity
```csharp
public class Tank {
    // Book Keeping (Calculated Stock)
    public decimal? CurrentStock { get; set; }
    public DateTime LastStockUpdate { get; set; }

    // Physical Stock Tracking
    public decimal? PhysicalStockValue { get; set; }
    public DateTime? LastPhysicalStockUpdate { get; set; }
    public string? PhysicalStockSource { get; set; } // "Manual" | "Automated Sensor Reading"
}
```

### 2. Stock Management Services

#### A. DiscrepancyDetectionService
**Purpose**: Detects and analyzes discrepancies between expected and actual stock levels

**Key Methods**:
- `DetectDiscrepancies()` - Compares calculated vs actual volumes
- `DetectPhysicalStockDiscrepancies()` - **NEW**: Compares physical vs book stock
- `GetTanksWithPhysicalStockDiscrepanciesAsync()` - Bulk physical stock analysis

**Physical vs Book Stock Detection**:
```csharp
var physicalStock = tank.PhysicalStockValue ?? 0;
var bookStock = tank.CurrentStock ?? 0;
var varianceAmount = physicalStock - bookStock;
var variancePercentage = bookStock > 0 ? Math.Abs(varianceAmount) / bookStock * 100 : 0;
```

#### B. AutomatedReconciliationService
**Purpose**: Orchestrates reconciliation policies and executes correction actions

**Key Features**:
- Policy-driven reconciliation execution
- Notification integration
- Multi-threshold variance detection
- Business impact calculation using `InventoryCostingService`

#### C. ReconciliationOrchestrationService
**Purpose**: Manages the reconciliation workflow and resolution strategies

**Reconciliation Approaches**:
1. **Automatic Adjustment** - Small variances auto-corrected
2. **Manual Review** - Significant variances flagged for review
3. **No Action** - Within acceptable thresholds

### 3. Stock Update Mechanisms

#### A. Manual Stock Entry
**Opening Stock Command**:
```csharp
// Updates both book and physical stock for daily opening
tank.CurrentStock = request.OpeningStock; // If UseBookKeeping = 1
tank.PhysicalStockValue = request.OpeningStock;
tank.PhysicalStockSource = "Manual";
tank.LastPhysicalStockUpdate = entryDate;
```

**Closing Stock Command**:
```csharp
// Updates both book and physical stock for daily closing
tank.CurrentStock = request.ClosingStock; // If UseBookKeeping = 1
tank.PhysicalStockValue = request.ClosingStock;
tank.PhysicalStockSource = "Manual";
tank.LastPhysicalStockUpdate = entryDate;
```

#### B. Sensor-Based Updates
**CreateTankMeasurementCommand** (Enhanced):
```csharp
if (enableSensorPhysicalStock && tankMeasurementDto.ProductVolume.HasValue) {
    tank.PhysicalStockValue = (decimal)tankMeasurementDto.ProductVolume.Value;
    tank.PhysicalStockSource = "Automated Sensor Reading";
    tank.LastPhysicalStockUpdate = tankMeasurementDto.DateTime;
}
```

**Configuration Control**:
- System configuration: `Tank.EnableSensorPhysicalStockUpdate`
- Allows enabling/disabling sensor-based physical stock updates

### 4. Background Services

#### A. AutomatedOpeningStockService
**Execution**: Daily at start of shift (configurable, default 6:00 AM)

**Priority Order** (configurable):
1. Sensor readings
2. Previous closing stock
3. Current volume

**Process**:
- Identifies tanks requiring opening stock
- Uses configurable priority to determine stock value
- Updates both `CurrentStock` and `PhysicalStockValue`

#### B. AutomatedClosingStockService
**Execution**: Daily at end of shift (configurable, default 6:00 PM)

**Priority Order** (configurable):
1. Sensor readings
2. Last volume history entry
3. Current volume

**Process**:
- Processes tanks without closing stock for the day
- Updates both stock values using priority hierarchy

#### C. AutomatedReconciliationBackgroundService
**Execution**: Configurable interval (default 15 minutes)

**Process**:
- Evaluates reconciliation policies
- Detects discrepancies (including physical vs book)
- Executes automated corrections
- Sends notifications for manual review items

## Stock Reconciliation Flow

### 1. Daily Stock Cycle
```
Start of Day:
├── AutomatedOpeningStockService
│   ├── Determines opening stock (sensor/closing/current)
│   ├── Updates CurrentStock (if UseBookKeeping = 1)
│   └── Updates PhysicalStockValue + source
│
During Day:
├── Transaction Processing (affects CurrentStock)
│   ├── Deliveries (+)
│   ├── Pump transactions (-)
│   └── Tank transfers (+/-)
│
├── Sensor Updates (affects PhysicalStockValue)
│   └── CreateTankMeasurementCommand
│
End of Day:
└── AutomatedClosingStockService
    ├── Determines closing stock
    ├── Updates CurrentStock
    └── Updates PhysicalStockValue + source
```

### 2. Discrepancy Detection & Resolution

```
Continuous Monitoring:
├── AutomatedReconciliationBackgroundService (15min intervals)
│   ├── Policy Evaluation
│   ├── Discrepancy Detection
│   │   ├── Expected vs Actual Volume (book keeping)
│   │   └── Physical vs Book Stock (NEW)
│   │
│   └── Resolution Actions
│       ├── Auto-adjust (small variances)
│       ├── Flag for manual review (significant)
│       └── Generate notifications
```

### 3. Variance Analysis

**Book Keeping Discrepancy**:
```csharp
Expected Volume = Starting Volume + Deliveries - Consumption ± Transfers
Actual Volume = Latest Volume History
Variance = |Expected - Actual|
```

**Physical vs Book Discrepancy**:
```csharp
Physical Stock = tank.PhysicalStockValue (from sensors/manual)
Book Stock = tank.CurrentStock (calculated)
Variance = Physical - Book
```

## Configuration & Thresholds

### 1. System Configuration
- `Tank.EnableSensorPhysicalStockUpdate`: Boolean to enable sensor updates
- Variance thresholds (liters and percentage)
- Business impact calculations using `InventoryCostingService`

### 2. Reconciliation Policies
- **Scheduled**: Time-based execution
- **Event-driven**: Triggered by external events
- **Manual**: User-initiated
- **Hybrid**: Combination approaches

### 3. Priority Configurations
**Opening Stock Priority**:
```json
["Sensor", "ClosingStock", "CurrentVolume"]
```

**Closing Stock Priority**:
```json
["Sensor", "LastEntry", "CurrentVolume"]
```

## Notification Integration

### Alert Types
1. **Discrepancy Detected**: Physical vs book variance exceeds thresholds
2. **Reconciliation Failed**: Automatic correction failed
3. **Manual Review Required**: Variance requires human intervention
4. **System Errors**: Service failures or critical issues

### Notification Recipients
- Site managers
- System administrators
- Inventory managers
- Operations teams

## Data Flow Summary

### Current Stock (Book Value)
```
Transactions → Volume Calculations → CurrentStock
├── Deliveries
├── Pump Sales
├── Tank Transfers
└── Manual Adjustments (Opening/Closing)
```

### Physical Stock (Measured Value)
```
Physical Measurements → PhysicalStockValue
├── Manual Entry (Opening/Closing Stock)
├── Sensor Readings (PTS Devices)
└── Stock Taking Events
```

### Reconciliation Process
```
Compare Physical vs Book → Detect Variance → Analyze Impact → Take Action
│
├── Auto-Correct (small variances)
├── Generate Alerts (medium variances)
└── Require Manual Review (large variances)
```

## Key Benefits

1. **Dual Stock Tracking**: Maintains both calculated and physical inventory
2. **Automated Reconciliation**: Reduces manual intervention
3. **Configurable Thresholds**: Adapts to business requirements
4. **Multi-Source Physical Data**: Sensors + manual entry
5. **Business Impact Analysis**: KES-based variance assessment
6. **Comprehensive Notifications**: Proactive alert system
7. **Audit Trail**: Complete history of stock changes and reconciliation actions

## Integration Points

- **PTS Devices**: Sensor data via `CreateTankMeasurementCommand`
- **Frontend Forms**: Manual stock entry via Opening/Closing commands
- **Notification System**: Real-time alerts and summaries
- **Inventory Costing**: Accurate business impact calculations
- **Background Services**: Automated daily operations
- **Policy Engine**: Configurable reconciliation rules

This architecture ensures accurate inventory management while providing automated reconciliation capabilities and comprehensive variance detection between physical measurements and calculated book values.
