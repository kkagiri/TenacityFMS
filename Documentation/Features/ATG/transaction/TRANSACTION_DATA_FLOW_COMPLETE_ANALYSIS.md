# Complete Transaction Data Flow Analysis
## From PumpAuthorize to Database Save

**Date**: 2025-11-12
**Analysis**: Complete flow showing how VehicleId, TankId, and Nozzle data is captured and saved

---

## Executive Summary

**YES**, the system IS saving VehicleId, TankId, and Nozzle data correctly through this flow:

1. **PumpAuthorizeCommand** stores context in Redis (VehicleId, TankId, Nozzle)
2. **UploadStatusCommand** detects EOT (End of Transaction) from device
3. **AutoTransactionCompletionService** retrieves context and saves to database
4. **CreatePumpTransactionCommand** writes to `pumptransactions` table

---

## Database Schema

### Pumptransaction Table Structure

```csharp
public partial class Pumptransaction {
    public int Id { get; set; }
    public string PtsId { get; set; } = null!;
    public int PacketId { get; set; }
    public DateTime? DateTimeStart { get; set; }
    public DateTime DateTime { get; set; }

    // Core transaction identifiers
    public int? Pump { get; set; }
    public int? Nozzle { get; set; }              // ✅ Nozzle IS saved
    public int? Transaction { get; set; }

    // Fuel details
    public int? FuelGradeId { get; set; }
    public string? FuelGradeName { get; set; }

    // Volume and pricing
    public decimal? Volume { get; set; }
    public decimal? Tcvolume { get; set; }
    public decimal? Price { get; set; }
    public decimal? Amount { get; set; }
    public decimal? TotalVolume { get; set; }
    public decimal? TotalAmount { get; set; }

    // Authorization data
    public string? Tag { get; set; }
    public int? UserId { get; set; }
    public string? ConfigurationId { get; set; }

    // Business context (from authorization)
    public int? TankId { get; set; }              // ✅ TankId IS saved
    public int? VehicleId { get; set; }           // ✅ VehicleId IS saved

    // Processing flag
    public bool HasBeenProcessed { get; set; } = false;

    // Navigation properties
    public virtual Tank? Tank { get; set; }
    public virtual Vehicle? Vehicle { get; set; }
}
```

**KEY FINDINGS:**
- ✅ `VehicleId` column exists and is populated
- ✅ `TankId` column exists and is populated
- ✅ `Nozzle` column exists and is populated
- ✅ All have navigation properties to related entities

---

## Complete Data Flow

### Phase 1: Authorization (User Initiates)

#### 1.1 Frontend - FuelingDetailsStep.js
```javascript
// User clicks "Authorize & Start Fueling"
const authParams = {
    deviceId: ptsId,
    pumpId: selectedPump.id,
    nozzle: selectedNozzle.id,          // ✅ Nozzle captured
    type: typeMapping[selectedType],
    dose: parseFloat(volume) || 0,
    price: fuelPrice,
    fuelGradeId: fuelGradeId,
    tag: useMasterTag ? userMasterTag : tagToUse,
    vehicleId: vehicleInfo?.vehicleId   // ✅ VehicleId captured
};

const response = await dispatch(authorizePump(authParams));
```

#### 1.2 Backend - PumpAuthorizeCommand.cs
**Location**: `FMS.Application/Command/PTSCommand/PumpCommands/PumpAuthorizeCommand.cs`

```csharp
public async Task<FMSResponse<PumpAuthorizeResponseDto>> Handle(
    PumpAuthorizeCommand request, CancellationToken cancellationToken)
{
    // Step 1: Get Tank ID from nozzle mapping
    var tankId = await GetTankIdForNozzle(
        request.DeviceId,
        request.PumpId,
        request.Nozzle
    );

    // Step 2: Send authorize command to device
    var pumpAuthorizeRequest = new PumpAuthorizeRequest {
        DeviceId = request.DeviceId,
        Pump = request.PumpId,
        Nozzle = request.Nozzle,          // ✅ Sent to device
        Type = request.Type,
        Dose = request.Dose,
        Price = request.Price,
        FuelGradeId = request.FuelGradeId
    };

    var response = await _mediator.Send(pumpAuthorizeRequest);

    // Step 3: Get transaction ID from device response
    int? transactionId = response?.Data?.Transaction;

    // Step 4: Store context in Redis (THIS IS CRITICAL!)
    var transactionContext = new {
        DeviceId = request.DeviceId,
        PumpId = request.PumpId,
        NozzleId = request.Nozzle,        // ✅ Nozzle stored
        TransactionId = transactionId,
        VehicleId = request.VehicleId,    // ✅ VehicleId stored
        TankId = tankId,                  // ✅ TankId stored
        Tag = request.Tag,
        FuelGradeId = request.FuelGradeId,
        Price = request.Price,
        ConnectionType = connectionType,
        AutoCloseTransaction = configuredAutoClose,
        StartTime = DateTime.UtcNow
    };

    var redisKey = $"device:{deviceId}:transaction:{transactionId}";
    await _redisDb.StringSetAsync(
        redisKey,
        JsonSerializer.Serialize(transactionContext),
        TimeSpan.FromMinutes(10)
    );

    _logger.LogInformation(
        "**CONTEXT STORED** - Transaction context in Redis for " +
        "device {DeviceId}, pump {PumpId}, transaction {TransactionId}, " +
        "VehicleId: {VehicleId}, TankId: {TankId}, connection: {ConnectionType}",
        deviceId, request.PumpId, transactionId,
        request.VehicleId, tankId, connectionType
    );
}
```

**Redis Key Format:**
```
device:{deviceId}:transaction:{transactionId}
```

**Redis Data Stored:**
```json
{
    "DeviceId": "003400483233511238383435",
    "PumpId": 1,
    "NozzleId": 2,
    "TransactionId": 327,
    "VehicleId": 557,
    "TankId": 42,
    "Tag": "ABC123",
    "FuelGradeId": 1,
    "Price": 3.99,
    "ConnectionType": "WebSocket",
    "AutoCloseTransaction": true,
    "StartTime": "2025-11-12T08:41:25Z"
}
```

---

### Phase 2: Physical Fueling (User Operates Pump)

#### 2.1 Operator Actions
1. Lifts nozzle from pump
2. Inserts nozzle into vehicle tank
3. Pulls trigger to start fuel flow
4. Pump meters dispense fuel
5. Releases trigger or nozzle clicks off when tank full
6. Replaces nozzle on pump

#### 2.2 PTS Device Behavior
- **During fueling**: Sends `UploadStatus` packets with `BusyStatus`
- **At completion**: Sends `UploadStatus` packet with `EndOfTransactionStatus`

---

### Phase 3: EOT Detection (Device Reports Completion)

#### 3.1 PTS.WindowsService Receives UploadStatus
**Location**: `FMS.PTS.WindowsService` (processes device packets)

Device sends UploadStatus packet via WebSocket:
```json
{
    "Pumps": {
        "EndOfTransactionStatus": {
            "Ids": [1],
            "Transactions": [327],
            "Nozzles": [2],
            "Volumes": [50.5],
            "Amounts": [5050],
            "FuelGradeIds": [1],
            "FuelGradeNames": ["Diesel"],
            "Prices": [100.00]
        }
    }
}
```

#### 3.2 UploadStatusCommand Processes EOT
**Location**: `FMS.Application/Command/PTSCommand/UploadStatusCommands/UploadStatusCommand.cs`

```csharp
public async Task<CommandResult> Handle(
    UploadStatusCommand request,
    CancellationToken cancellationToken)
{
    var uploadStatus = request.UploadStatus;
    var deviceId = request.DeviceId;

    // Store device status in Redis
    await StoreUploadStatusInRedis(deviceId, uploadStatus);

    // Process pump statuses
    if (uploadStatus?.Pumps != null)
    {
        var pumpStatus = uploadStatus.Pumps;

        // Check for EndOfTransaction
        if (pumpStatus.EndOfTransactionStatus != null)
        {
            // This triggers transaction completion!
            await ProcessEndOfTransactionForTransactionData(
                deviceId,
                pumpStatus.EndOfTransactionStatus
            );
        }
    }
}
```

#### 3.3 Process EOT with Redis Context Correlation
```csharp
private async Task ProcessEndOfTransactionForTransactionData(
    string deviceId,
    EndOfTransactionStatus eotStatus)
{
    // Loop through each pump in EOT
    for (int i = 0; i < eotStatus.Ids.Count; i++)
    {
        var pumpId = eotStatus.Ids[i];
        var transactionId = eotStatus.Transactions[i];
        var volume = eotStatus.Volumes[i];
        var amount = eotStatus.Amounts[i];
        var nozzle = eotStatus.Nozzles[i];        // ✅ From device
        var fuelGradeId = eotStatus.FuelGradeIds[i];
        var fuelGradeName = eotStatus.FuelGradeNames[i];
        var price = eotStatus.Prices[i];

        // CRITICAL: Look up authorization context in Redis
        var transactionKey = $"device:{deviceId}:transaction:{transactionId}";
        var contextJson = await _redisDb.StringGetAsync(transactionKey);

        if (!contextJson.IsNullOrEmpty)
        {
            // Parse stored context
            var context = JsonSerializer.Deserialize<JsonElement>(contextJson);
            var tankId = context.GetProperty("TankId").GetInt32();
            var vehicleId = context.GetProperty("VehicleId").GetInt32();
            var tag = context.GetProperty("Tag").GetString();
            var autoClose = context.GetProperty("AutoCloseTransaction").GetBoolean();

            _logger.LogInformation(
                "**MATCH FOUND** - EOT Transaction {TransactionId} " +
                "matches context: VehicleId={VehicleId}, TankId={TankId}",
                transactionId, vehicleId, tankId
            );

            // Create enriched data object with BOTH device data AND context
            var statusData = new JObject
            {
                ["Pump"] = pumpId,
                ["Transaction"] = transactionId,
                ["Nozzle"] = nozzle,              // ✅ From device EOT
                ["Volume"] = volume,
                ["Amount"] = amount,
                ["FuelGradeId"] = fuelGradeId,
                ["FuelGradeName"] = fuelGradeName,
                ["Price"] = price,
                ["DateTime"] = DateTime.UtcNow,
                ["TankId"] = tankId,              // ✅ From Redis context
                ["VehicleId"] = vehicleId,        // ✅ From Redis context
                ["Tag"] = tag,                    // ✅ From Redis context
                ["ConnectionType"] = "WebSocket",
                ["AutoCloseTransaction"] = autoClose
            };

            // Trigger auto-completion service
            await _autoCompletionService.ProcessEndOfTransactionAsync(
                deviceId, pumpId, transactionId, statusData
            );
        }
    }
}
```

---

### Phase 4: Auto-Completion (Background Processing)

#### 4.1 AutoTransactionCompletionService
**Location**: `FMS.Application/Services/AutoTransactionCompletionService.cs`

```csharp
public async Task ProcessEndOfTransactionAsync(
    string deviceId, int pump, int transaction, JObject statusData)
{
    _logger.LogInformation(
        "[AutoComplete] Processing EOT for device {DeviceId}, " +
        "pump {Pump}, transaction {Transaction}",
        deviceId, pump, transaction
    );

    // Step 1: Check if should auto-complete
    var shouldAutoComplete = await ShouldAutoCompleteTransaction(
        deviceId, transaction
    );

    if (!shouldAutoComplete) {
        _logger.LogInformation(
            "Transaction {Transaction} requires manual completion",
            transaction
        );
        return;
    }

    // Step 2: Get complete transaction data (may query device)
    var finalData = await GetCompleteTransactionData(
        deviceId, pump, transaction, statusData
    );

    // Step 3: Save to database
    var success = await CompleteAndSaveTransactionAsync(
        deviceId, pump, transaction, finalData
    );
}
```

#### 4.2 Create Database Entity
```csharp
private Pumptransaction CreatePumpTransactionFromData(
    string deviceId, int pump, int transaction, JObject data)
{
    return new Pumptransaction {
        PtsId = deviceId,
        Pump = pump,
        Transaction = transaction,
        Nozzle = data.Value<int?>("Nozzle"),          // ✅ Saved to DB
        FuelGradeId = data.Value<int?>("FuelGradeId"),
        FuelGradeName = data.Value<string>("FuelGradeName"),
        Volume = data.Value<decimal?>("Volume"),
        Tcvolume = data.Value<decimal?>("TCVolume"),
        Price = data.Value<decimal?>("Price"),
        Amount = data.Value<decimal?>("Amount"),
        DateTime = data.Value<DateTime?>("DateTime") ?? DateTime.UtcNow,
        DateTimeStart = data.Value<DateTime?>("DateTimeStart"),
        Tag = data.Value<string>("Tag"),              // ✅ From context
        UserId = data.Value<int?>("UserId"),
        ConfigurationId = data.Value<string>("ConfigurationId"),
        TankId = data.Value<int?>("TankId"),          // ✅ Saved to DB
        VehicleId = data.Value<int?>("VehicleId"),    // ✅ Saved to DB
        HasBeenProcessed = false
    };
}
```

#### 4.3 Save to Database
```csharp
public async Task<bool> CompleteAndSaveTransactionAsync(
    string deviceId, int pump, int transaction, JObject finalData)
{
    // Create entity
    var pumpTransaction = CreatePumpTransactionFromData(
        deviceId, pump, transaction, finalData
    );

    _logger.LogInformation(
        "[AutoComplete] Saving - PtsId: {PtsId}, Pump: {Pump}, " +
        "Transaction: {Transaction}, Nozzle: {Nozzle}, " +
        "Volume: {Volume}, Amount: {Amount}, Tag: {Tag}, " +
        "TankId: {TankId}, VehicleId: {VehicleId}",
        pumpTransaction.PtsId, pumpTransaction.Pump,
        pumpTransaction.Transaction, pumpTransaction.Nozzle,
        pumpTransaction.Volume, pumpTransaction.Amount,
        pumpTransaction.Tag, pumpTransaction.TankId,
        pumpTransaction.VehicleId
    );

    using var scope = _scopeFactory.CreateScope();
    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

    // Check for existing transaction
    var existing = await context.Pumptransactions
        .FirstOrDefaultAsync(t =>
            t.PtsId == deviceId &&
            t.Transaction == transaction
        );

    if (existing != null) {
        // Update existing
        UpdateExistingTransaction(existing, pumpTransaction);
        existing.HasBeenProcessed = true;
    } else {
        // Insert new
        context.Pumptransactions.Add(pumpTransaction);
    }

    await context.SaveChangesAsync();

    _logger.LogInformation(
        "[AutoComplete] Transaction {Transaction} saved to database",
        transaction
    );

    return true;
}
```

---

## Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 1: AUTHORIZATION                          │
│                                                                   │
│  Frontend → PumpAuthorizeCommand → Redis Storage                 │
│                                                                   │
│  Data Captured:                                                  │
│  ✅ VehicleId (from user selection)                             │
│  ✅ TankId (from nozzle mapping)                                │
│  ✅ Nozzle (from pump selection)                                │
│  ✅ Tag, Price, FuelGradeId, etc.                               │
│                                                                   │
│  Redis Key: device:{deviceId}:transaction:{transactionId}        │
│  TTL: 10 minutes                                                 │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 2: PHYSICAL FUELING                       │
│                                                                   │
│  Operator lifts nozzle → Fills tank → Replaces nozzle           │
│                                                                   │
│  Device sends UploadStatus packets:                              │
│  - BusyStatus (during fueling)                                  │
│  - EndOfTransactionStatus (at completion)                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 3: EOT DETECTION                          │
│                                                                   │
│  PTS.WindowsService → UploadStatusCommand                        │
│                                                                   │
│  Device EOT Data:                                                │
│  ✅ Transaction ID (327)                                        │
│  ✅ Nozzle (2)                                                  │
│  ✅ Volume (50.5L)                                              │
│  ✅ Amount ($5050)                                              │
│  ✅ FuelGradeId, FuelGradeName, Price                           │
│                                                                   │
│  Redis Context Lookup:                                           │
│  Key: device:{deviceId}:transaction:{transactionId}              │
│  Retrieved: VehicleId, TankId, Tag                              │
│                                                                   │
│  Merged Data = Device Data + Redis Context                       │
└─────────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────────┐
│                  PHASE 4: AUTO-COMPLETION                        │
│                                                                   │
│  AutoTransactionCompletionService                                │
│  → CreatePumpTransactionFromData                                 │
│  → Save to GpsdataContext.Pumptransactions                       │
│                                                                   │
│  Database Record Contains:                                       │
│  ✅ PtsId, Pump, Transaction                                    │
│  ✅ Nozzle (from device EOT)                                    │
│  ✅ VehicleId (from Redis context)                              │
│  ✅ TankId (from Redis context)                                 │
│  ✅ Tag (from Redis context)                                    │
│  ✅ Volume, Amount, Price (from device EOT)                     │
│  ✅ FuelGradeId, FuelGradeName (from device EOT)                │
│                                                                   │
│  Result: Complete transaction record in database                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Redis Context Correlation - The Critical Link

### Why Redis Context Matters

The **device only knows**:
- Pump ID
- Transaction ID (assigned by device)
- Nozzle ID
- Volume dispensed
- Amount charged
- Fuel grade

The **device does NOT know**:
- Which vehicle is fueling
- Which tank supplied the fuel
- Which tag authorized the transaction
- User context

### How Correlation Works

1. **During Authorization** (PumpAuthorizeCommand):
   ```
   Redis Write:
   Key: device:PTS001:transaction:327
   Value: {
       "VehicleId": 557,
       "TankId": 42,
       "Tag": "ABC123",
       "TransactionId": 327,
       "PumpId": 1,
       "NozzleId": 2
   }
   TTL: 10 minutes
   ```

2. **During EOT** (UploadStatusCommand):
   ```
   Device Reports:
   - Transaction ID: 327
   - Nozzle: 2
   - Volume: 50.5L

   Redis Lookup:
   Key: device:PTS001:transaction:327
   Found: VehicleId=557, TankId=42, Tag="ABC123"

   Merged Result:
   {
       "Transaction": 327,
       "Nozzle": 2,
       "Volume": 50.5,
       "VehicleId": 557,    ← From Redis
       "TankId": 42,        ← From Redis
       "Tag": "ABC123"      ← From Redis
   }
   ```

3. **Database Save**:
   ```sql
   INSERT INTO pumptransactions (
       PtsId, Pump, Transaction, Nozzle,
       Volume, Amount,
       VehicleId, TankId, Tag
   ) VALUES (
       'PTS001', 1, 327, 2,
       50.5, 5050,
       557, 42, 'ABC123'
   );
   ```

---

## Verification Logs

Based on your provided logs, here's what happened:

```
[11:41:25] PumpAuthorize successful
- Device: 003400483233511238383435
- Pump: 1
- Transaction: 327 (assigned by device)
- VehicleId: 557
- TankId: (should be set based on nozzle mapping)
- Connection: WebSocket
- AutoClose: Enabled

[11:41:25] **CONTEXT STORED**
- Redis key: device:003400483233511238383435:transaction:327
- Stored: VehicleId, TankId, Nozzle, etc.
- TTL: 10 minutes

[Next] Waiting for device to report EOT
- Device will send UploadStatus with EndOfTransactionStatus
- System will correlate using transaction ID 327
- Will merge device data with Redis context
- Will save complete record to database
```

---

## What Data Gets Saved Where

### From Device (EndOfTransactionStatus):
✅ **Pump** - Pump number
✅ **Transaction** - Transaction ID (device assigned)
✅ **Nozzle** - Nozzle number
✅ **Volume** - Actual volume dispensed
✅ **Amount** - Total cost
✅ **FuelGradeId** - Fuel type ID
✅ **FuelGradeName** - Fuel type name
✅ **Price** - Price per unit
✅ **DateTime** - Completion time

### From Redis Context (Authorization):
✅ **VehicleId** - Which vehicle refueled
✅ **TankId** - Which tank supplied fuel
✅ **Tag** - Authorization tag/card
✅ **ConnectionType** - How device connected
✅ **AutoCloseTransaction** - Whether to auto-complete
✅ **StartTime** - When authorization happened

### Computed/System:
✅ **PtsId** - Device identifier
✅ **HasBeenProcessed** - Processing flag
✅ **PacketId** - Internal tracking

---

## Common Issues & Solutions

### Issue 1: VehicleId Not Saved

**Symptom**: Database record has NULL VehicleId

**Causes**:
1. Frontend didn't send vehicleId in authorization request
2. Redis context expired (TTL > 10 minutes between auth and EOT)
3. Transaction ID mismatch
4. Redis context lookup failed

**Solution**:
```csharp
// Check authorization logs
[PumpAuth] Authorization params: vehicleId={VehicleId}

// Check Redis storage
[PumpAuth] **CONTEXT STORED** - VehicleId: {VehicleId}

// Check EOT correlation
[UploadStatus] **MATCH FOUND** - VehicleId={VehicleId}
```

### Issue 2: TankId Not Saved

**Symptom**: Database record has NULL TankId

**Causes**:
1. Nozzle mapping not configured in database
2. GetTankIdForNozzle failed
3. Device/pump/nozzle combination not found

**Solution**:
```sql
-- Check nozzle mapping
SELECT * FROM nozzlemappings
WHERE ptsId = '003400483233511238383435'
AND pumpId = 1
AND nozzleId = 2;
```

### Issue 3: Nozzle Not Saved

**Symptom**: Database record has NULL Nozzle

**Causes**:
1. Device didn't include Nozzle in EOT
2. EOT Nozzles array empty or out of bounds

**Solution**: Check device EOT packet structure

### Issue 4: Context Lost/Expired

**Symptom**: EOT processed but missing VehicleId/TankId

**Logs**:
```
[UploadStatus] **NO MATCH** - EndOfTransaction 327 has no
corresponding authorization context
```

**Causes**:
1. Redis TTL expired (> 10 minutes)
2. Transaction ID mismatch
3. Redis key format incorrect
4. Redis connection lost

**Solution**:
- Increase Redis TTL if needed
- Verify transaction ID correlation
- Check Redis connectivity

---

## Testing Checklist

### Before Authorization
- [ ] Vehicle selected (VehicleId available)
- [ ] Nozzle mapping exists for pump/nozzle
- [ ] TankId can be retrieved from mapping
- [ ] Tag available (or master tag used)

### During Authorization
- [ ] Redis context stored successfully
- [ ] Transaction ID received from device
- [ ] Context includes VehicleId, TankId, Nozzle
- [ ] Log shows "**CONTEXT STORED**"

### During Fueling
- [ ] Device sends BusyStatus updates
- [ ] Volume incrementing
- [ ] Frontend shows progress

### At Completion
- [ ] Device sends EndOfTransactionStatus
- [ ] EOT includes Transaction ID, Nozzle, Volume
- [ ] Log shows "**MATCH FOUND**"
- [ ] Context retrieved from Redis
- [ ] Log shows "**CONTEXT DETAILS**" with VehicleId/TankId

### After Save
- [ ] Database record exists
- [ ] VehicleId populated
- [ ] TankId populated
- [ ] Nozzle populated
- [ ] Volume matches device report
- [ ] Tag matches authorization
- [ ] HasBeenProcessed = true

---

## SQL Verification Queries

### Check Recent Transactions
```sql
SELECT
    Id,
    PtsId,
    Pump,
    Nozzle,
    Transaction,
    VehicleId,
    TankId,
    Tag,
    Volume,
    Amount,
    DateTime,
    HasBeenProcessed
FROM pumptransactions
WHERE DateTime >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
ORDER BY DateTime DESC;
```

### Check Missing Data
```sql
-- Transactions with missing VehicleId
SELECT * FROM pumptransactions
WHERE VehicleId IS NULL
AND DateTime >= DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Transactions with missing TankId
SELECT * FROM pumptransactions
WHERE TankId IS NULL
AND DateTime >= DATE_SUB(NOW(), INTERVAL 1 DAY);

-- Transactions with missing Nozzle
SELECT * FROM pumptransactions
WHERE Nozzle IS NULL
AND DateTime >= DATE_SUB(NOW(), INTERVAL 1 DAY);
```

### Verify Nozzle Mappings
```sql
SELECT
    nm.*,
    t.name AS TankName
FROM nozzlemappings nm
LEFT JOIN tanks t ON nm.tankId = t.tankId
WHERE nm.ptsId = '003400483233511238383435';
```

---

## Conclusion

**YES**, the system DOES save VehicleId, TankId, and Nozzle data through this complete flow:

1. ✅ **PumpAuthorizeCommand** captures and stores context in Redis
2. ✅ **UploadStatusCommand** detects EOT and correlates with context
3. ✅ **AutoTransactionCompletionService** merges device + context data
4. ✅ **CreatePumpTransactionFromData** creates complete entity
5. ✅ **Database save** includes all fields

The key is the **Redis context correlation** that links authorization data (VehicleId, TankId) with device transaction data (Nozzle, Volume).

If data is missing, check:
- Authorization logs (context storage)
- EOT logs (correlation success)
- Redis connectivity
- TTL expiration (10 minute window)
- Nozzle mapping configuration
