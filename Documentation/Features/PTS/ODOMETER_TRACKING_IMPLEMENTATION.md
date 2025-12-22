# Odometer Tracking Implementation

## Overview

This document details the implementation of vehicle odometer tracking throughout the pump authorization and transaction flow. Odometer readings are now captured during fueling authorization and stored with pump transaction records for compliance and vehicle tracking purposes.

## Architecture

### Data Flow

```
Mobile App (FuelingVolumeStep)
  ↓ User enters odometer
FuelingProcessScreen
  ↓ Includes in authRequest
PumpAuthorizeCommand
  ↓ Stores in Redis context
Redis Transaction Context
  ↓ Retrieved during completion
AutoTransactionCompletionService
  ↓ Creates pump transaction
Pumptransaction Table
```

## Implementation Details

### 1. Backend Changes

#### PumpAuthorizeCommand.cs

**Location:** `FMS.Application/Command/PTSCommand/PumpCommands/PumpAuthorizeCommand.cs`

**Changes:**

- Added `Odometer` property (decimal?) to command
- Updated `StoreTransactionContextInRedis` method signature to accept odometer parameter
- Stored odometer value in Redis transaction context for correlation
- Updated logging to include odometer value

**Code:**

```csharp
public decimal? Odometer { get; set; }

private async Task StoreTransactionContextInRedis(
    string transactionId,
    int vehicleId,
    string? tag,
    bool useMasterTag,
    decimal? odometer = null)
{
    var transactionContext = new
    {
        TransactionId = transactionId,
        VehicleId = vehicleId,
        Tag = tag,
        UseMasterTag = useMasterTag,
        Timestamp = DateTime.UtcNow,
        Odometer = odometer
    };

    // Store in Redis with 10-minute expiration
    await _redisDb.StringSetAsync(
        $"pts:transaction:{transactionId}",
        JsonConvert.SerializeObject(transactionContext),
        TimeSpan.FromMinutes(10)
    );
}
```

#### Pumptransaction.cs

**Location:** `FMS.Domain/Entities/Features/PTS/PumpTransaction.cs`

**Changes:**

- Added `Odometer` property (decimal?) to entity

**Code:**

```csharp
/// <summary>
/// Vehicle odometer reading captured at the time of fueling authorization
/// </summary>
public decimal? Odometer { get; set; }
```

#### PumpTransactionDto.cs

**Location:** `FMS.Application/ModelsDTOs/PTS/PumpTransactionDto.cs`

**Changes:**

- Added `Odometer` property to DTO

**Code:**

```csharp
/// <summary>
/// Vehicle odometer reading at time of authorization
/// </summary>
public decimal? Odometer { get; set; }
```

#### CreatePumpTransactionCommand.cs

**Location:** `FMS.Application/Command/DatabaseCommand/PTSCommands/PumpTransactionCommand/CreatePumpTransactionCommand.cs`

**Changes:**

- Updated entity creation to map Odometer from DTO

**Code:**

```csharp
var pumpTransaction = new Pumptransaction
{
    // ... other properties
    Odometer = request.PumpTransactionDto.Odometer,
    // ... remaining properties
};
```

#### AutoTransactionCompletionService.cs

**Location:** `FMS.Application/Services/AutoTransactionCompletionService.cs`

**Changes:**

- Updated `CreatePumpTransactionFromData` method to retrieve odometer from Redis context

**Code:**

```csharp
private async Task<CreatePumpTransactionCommand> CreatePumpTransactionFromData(
    JObject data, Vehicle vehicle)
{
    // ... existing code

    return new CreatePumpTransactionCommand(new PumpTransactionDto
    {
        // ... other properties
        Odometer = data.Value<decimal?>("Odometer"),
        // ... remaining properties
    });
}
```

### 2. Database Changes

#### Migration Script

**Location:** `Documentation/Database/Migrations/Add_Odometer_To_Pumptransaction.sql`

**SQL:**

```sql
-- Add Odometer column to pumptransactions table
ALTER TABLE gpsdata.pumptransactions
ADD COLUMN Odometer DECIMAL(10,2) NULL
COMMENT 'Vehicle odometer reading at time of authorization'
AFTER VehicleId;

-- Add index for efficient querying by vehicle and odometer
CREATE INDEX idx_pumptransactions_vehicle_odometer
ON gpsdata.pumptransactions(VehicleId, Odometer);

-- Verify the column was added
SELECT
    COLUMN_NAME,
    DATA_TYPE,
    IS_NULLABLE,
    COLUMN_COMMENT
FROM INFORMATION_SCHEMA.COLUMNS
WHERE TABLE_SCHEMA = 'gpsdata'
  AND TABLE_NAME = 'pumptransactions'
  AND COLUMN_NAME = 'Odometer';
```

**To Execute:**

```bash
mysql -u root -p gpsdata < Documentation/Database/Migrations/Add_Odometer_To_Pumptransaction.sql
```

### 3. Mobile App Changes

#### FuelingProcessScreen.js

**Location:** `fms.mobile/src/screens/FuelingProcessScreen.js`

**Changes:**

- Updated authorization request to include odometer value
- Converted odometer string to decimal before sending to backend

**Code:**

```javascript
// Prepare authorization request
const authRequest = {
  deviceId: ptsId,
  pumpId: selectedPump.id,
  nozzle: selectedNozzle.id,
  type: authType,
  dose: authType === "Full" ? null : dose,
  vehicleId: vehicleId,
  tag: shouldUseMasterTag ? loggedInUser?.masterTag : tagId,
  useMasterTag: shouldUseMasterTag,
  odometer: odometer ? parseFloat(odometer) : null, // Include odometer reading
};
```

**Note:** The FuelingVolumeStep component already had odometer input functionality, so no changes were needed there.

## Data Storage

### Redis Context

Transaction context stored temporarily (10 minutes) with structure:

```json
{
  "TransactionId": "TXN-12345",
  "VehicleId": 42,
  "Tag": "TAG-001",
  "UseMasterTag": false,
  "Timestamp": "2024-01-15T10:30:00Z",
  "Odometer": 125450.5
}
```

### Database (Pumptransaction Table)

```
+-------------------+-----------------+------+-----+---------+
| Field             | Type            | Null | Key | Default |
+-------------------+-----------------+------+-----+---------+
| VehicleId         | int             | YES  | MUL | NULL    |
| Odometer          | decimal(10,2)   | YES  | MUL | NULL    |
| HasBeenProcessed  | tinyint(1)      | NO   |     | 0       |
+-------------------+-----------------+------+-----+---------+
```

## Benefits

1. **Compliance Tracking**: Capture vehicle odometer readings for regulatory compliance
2. **Maintenance Scheduling**: Track vehicle mileage for maintenance planning
3. **Fuel Efficiency Analysis**: Calculate fuel consumption per kilometer/mile
4. **Fraud Detection**: Identify unusual odometer readings or patterns
5. **Vehicle History**: Maintain comprehensive fueling history with mileage data

## Usage

### Mobile App

1. User selects vehicle in fueling flow
2. On volume entry step, user inputs odometer reading (optional)
3. System validates odometer is numeric and positive
4. Odometer is included in pump authorization request

### Backend Processing

1. PumpAuthorizeCommand receives odometer value
2. Stored in Redis with transaction context
3. When transaction completes, AutoTransactionCompletionService retrieves odometer
4. Saved to Pumptransaction table for permanent record

## Validation Rules

### Mobile App

- Odometer must be numeric
- Odometer must be non-negative
- Odometer is optional (can be null)

### Backend

- Accepts decimal? type (nullable)
- No validation enforced (allows flexibility for different vehicle types)
- Stored with 2 decimal places precision

## Testing Checklist

- [ ] Run database migration script
- [ ] Test mobile app odometer input
- [ ] Verify odometer sent in authorization request
- [ ] Confirm odometer stored in Redis context
- [ ] Validate odometer saved to Pumptransaction table
- [ ] Test with null odometer (optional field)
- [ ] Verify odometer appears in transaction reports

## Future Enhancements

1. **Odometer Validation**: Add business rules to validate odometer increases monotonically per vehicle
2. **Alerts**: Notify when odometer reading seems incorrect (e.g., decreased, huge jump)
3. **Reports**: Add odometer-based reports (fuel efficiency, mileage tracking)
4. **Maintenance Integration**: Trigger maintenance alerts based on odometer readings
5. **Historical Analysis**: Compare odometer readings over time for pattern analysis

## Related Files

### Backend

- `FMS.Application/Command/PTSCommand/PumpCommands/PumpAuthorizeCommand.cs`
- `FMS.Domain/Entities/Features/PTS/PumpTransaction.cs`
- `FMS.Application/ModelsDTOs/PTS/PumpTransactionDto.cs`
- `FMS.Application/Command/DatabaseCommand/PTSCommands/PumpTransactionCommand/CreatePumpTransactionCommand.cs`
- `FMS.Application/Services/AutoTransactionCompletionService.cs`

### Mobile

- `fms.mobile/src/screens/FuelingProcessScreen.js`
- `fms.mobile/src/components/fueling/FuelingVolumeStep.js`

### Database

- `Documentation/Database/Migrations/Add_Odometer_To_Pumptransaction.sql`

## Notes

- Odometer is optional to accommodate scenarios where reading cannot be captured
- Decimal(10,2) allows for odometers up to 99,999,999.99 (sufficient for most vehicles)
- Redis context expires after 10 minutes to prevent stale data
- Index on (VehicleId, Odometer) enables efficient vehicle-specific queries
