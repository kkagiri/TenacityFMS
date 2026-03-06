# Tank Transfer Flow - Visual Architecture

## Overall System Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                    PUMP-BASED TANK TRANSFER FLOW                                    │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────┐
│   START     │  User requests tank transfer from Tank A to Tank B
└──────┬──────┘
       │
       ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ STEP 1: AUTHORIZATION PHASE                                            ║
║ Location: PumpAuthorizeTransferCommand                                  ║
╚═════════════════════════════════════════════════════════════════════════╝
       │
       ├─► Validate nozzle lifted
       │
       ├─► Validate request (tanks, volume, stocks)
       │
       ├─► Check opening stock exists for both tanks
       │
       ├─► Verify physical stock levels
       │
       ├─► Authorize pump with PTS device
       │
       └─► Store context in Redis:
           {
             "DeviceId": "PTS001",
             "TransactionId": 12345,
             "SourceTankId": 10,           ◄── CRITICAL
             "DestinationTankId": 20,      ◄── CRITICAL
             "Volume": 100,
             "IsTransferMode": true,       ◄── CRITICAL FLAG
             "VehicleId": null,            ◄── NULL for transfers
             "Tag": null                   ◄── NULL for transfers
           }
       │
       ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ STEP 2: DISPENSING PHASE                                               ║
║ Location: PTS Device Hardware                                           ║
╚═════════════════════════════════════════════════════════════════════════╝
       │
       ├─► Pump nozzle up (operator action)
       │
       ├─► Fuel flows from Tank A to Tank B
       │
       ├─► Real volume measured: 98.5L
       │
       └─► Dispensing completes
       │
       ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ STEP 3: END OF TRANSACTION (EOT) SIGNAL                                ║
║ Location: PTS Device → WebSocket/HTTP → UploadStatusCommand             ║
╚═════════════════════════════════════════════════════════════════════════╝
       │
       └─► Device sends EOT packet:
           {
             "DeviceId": "PTS001",
             "Pump": 2,
             "Transaction": 12345,
             "Volume": 98.5,
             "Amount": 197.00,
             ...
           }
       │
       ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ STEP 4: UPLOAD STATUS PROCESSING                                       ║
║ Location: UploadStatusCommand.Handle()                                  ║
╚═════════════════════════════════════════════════════════════════════════╝
       │
       ├─► Match EOT with stored Redis context
       │
       └─► Call AutoTransactionCompletionService.ProcessEndOfTransactionAsync()
           │
           ├─ Parameters:
           │  - DeviceId: "PTS001"
           │  - Pump: 2
           │  - Transaction: 12345
           │  - StatusData: { Volume: 98.5, ... }
           │
           ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ STEP 5: AUTO TRANSACTION COMPLETION SERVICE                            ║
║ Location: AutoTransactionCompletionService.CompleteAndSaveTransactionAsync()
║ FILE: FMS.Application/Services/AutoTransactionCompletionService.cs      ║
╚═════════════════════════════════════════════════════════════════════════╝
       │
       ├─► Retrieve Redis context:
       │   {
       │     "IsTransferMode": true,      ◄── CHECK THIS FLAG
       │     "DestinationTankId": 20,     ◄── CHECK THIS VALUE
       │     ...
       │   }
       │
       ├─► Create Pumptransaction record:
       │   {
       │     "PtsId": "PTS001",
       │     "Transaction": 12345,
       │     "Volume": 98.5,
       │     "TankId": 10,
       │     "DestinationTankId": 20,
       │     "IsTransferMode": true,
       │     "HasBeenProcessed": false
       │   }
       │   ✅ Saved to database
       │
       ├─► HERE IS THE PROBLEM:
       │
       │   Current code only checks:
       │   if (TankId && Volume > 0)  ◄── REGULAR FUELING
       │   {
       │       Call PumpTransactionIntegrationService
       │   }
       │
       │   Missing code:
       │   if (IsTransferMode && DestinationTankId)  ◄── NOT IMPLEMENTED
       │   {
       │       Call PumpTankTransferService  ◄── NEVER CALLED
       │   }
       │
       └─► ❌ TRANSFER NOT PROCESSED (END OF CURRENT FLOW)
           │
           ▼
╔═════════════════════════════════════════════════════════════════════════╗
║ STEP 5B: MISSING - TANK TRANSFER PROCESSING                            ║
║ Location: PumpTankTransferService.ProcessPumpTransferAsync()            ║
║ FILE: FMS.Application/Services/TankStock/PumpTankTransferService.cs    ║
║ STATUS: ✅ EXISTS BUT NOT CALLED!                                       ║
╚═════════════════════════════════════════════════════════════════════════╝
       │
       │  This should be called but ISN'T:
       │
       ├─► Create TankTransfer record:
       │   {
       │     "SourceTankId": 10,
       │     "DestinationTankId": 20,
       │     "Amount": 98.5,
       │     "TransferDate": now,
       │     "RecordedBy": "System"
       │   }
       │   ✅ Would be saved
       │
       ├─► Update Tank 10 (Source):
       │   {
       │     "PhysicalStockValue": -= 98.5,
       │     "CurrentStock": -= 98.5
       │   }
       │
       ├─► Update Tank 20 (Destination):
       │   {
       │     "PhysicalStockValue": += 98.5,
       │     "CurrentStock": += 98.5
       │   }
       │
       ├─► Create TankVolumeHistory OUT:
       │   {
       │     "TankId": 10,
       │     "Volume": -98.5,
       │     "ChangeReason": Transfer,
       │     "Timestamp": now
       │   }
       │
       ├─► Create TankVolumeHistory IN:
       │   {
       │     "TankId": 20,
       │     "Volume": +98.5,
       │     "ChangeReason": Transfer,
       │     "Timestamp": now
       │   }
       │
       └─► Update Pumptransaction:
           {
             "HasBeenProcessed": true
           }
       │
       ▼
  ❌ CURRENTLY STOPS HERE - THIS ENTIRE SECTION DOESN'T EXECUTE


═══════════════════════════════════════════════════════════════════════════════

                        END STATE COMPARISON

═══════════════════════════════════════════════════════════════════════════════

CURRENT STATE (BROKEN):
┌──────────────────────────────┐
│ Pumptransaction              │  ✅ Created
├──────────────────────────────┤
│ IsTransferMode: true         │  ✅ Set
│ SourceTankId: 10             │  ✅ Set
│ DestinationTankId: 20        │  ✅ Set
│ Volume: 98.5                 │  ✅ Set
│ HasBeenProcessed: false      │  ⚠️ STILL FALSE - INCOMPLETE
└──────────────────────────────┘

┌──────────────────────────────┐
│ TankTransfer                 │  ❌ NOT CREATED
├──────────────────────────────┤
│ (record doesn't exist)       │
└──────────────────────────────┘

┌──────────────────────────────┐
│ Tank 10 (Source)             │  ⚠️ UNCHANGED
├──────────────────────────────┤
│ PhysicalStockValue: 500      │  Should be: 401.5
│ CurrentStock: 500            │  Should be: 401.5
└──────────────────────────────┘

┌──────────────────────────────┐
│ Tank 20 (Destination)        │  ⚠️ UNCHANGED
├──────────────────────────────┤
│ PhysicalStockValue: 300      │  Should be: 398.5
│ CurrentStock: 300            │  Should be: 398.5
└──────────────────────────────┘

┌──────────────────────────────┐
│ TankVolumeHistory            │  ❌ NO TRANSFER ENTRIES
├──────────────────────────────┤
│ (for this transfer)          │
└──────────────────────────────┘


EXPECTED STATE (AFTER FIX):
┌──────────────────────────────┐
│ Pumptransaction              │  ✅ Created
├──────────────────────────────┤
│ IsTransferMode: true         │  ✅ Set
│ SourceTankId: 10             │  ✅ Set
│ DestinationTankId: 20        │  ✅ Set
│ Volume: 98.5                 │  ✅ Set
│ HasBeenProcessed: true       │  ✅ NOW TRUE - COMPLETE
└──────────────────────────────┘

┌──────────────────────────────┐
│ TankTransfer                 │  ✅ CREATED
├──────────────────────────────┤
│ SourceTankId: 10             │  ✅
│ DestinationTankId: 20        │  ✅
│ Amount: 98.5                 │  ✅
│ RecordedBy: "System"         │  ✅
└──────────────────────────────┘

┌──────────────────────────────┐
│ Tank 10 (Source)             │  ✅ UPDATED
├──────────────────────────────┤
│ PhysicalStockValue: 401.5    │  ✅ Decreased 98.5
│ CurrentStock: 401.5          │  ✅ Decreased 98.5
└──────────────────────────────┘

┌──────────────────────────────┐
│ Tank 20 (Destination)        │  ✅ UPDATED
├──────────────────────────────┤
│ PhysicalStockValue: 398.5    │  ✅ Increased 98.5
│ CurrentStock: 398.5          │  ✅ Increased 98.5
└──────────────────────────────┘

┌──────────────────────────────┐
│ TankVolumeHistory            │  ✅ 2 ENTRIES CREATED
├──────────────────────────────┤
│ Entry 1: Tank 10             │  ✅ -98.5 (OUT)
│ Entry 2: Tank 20             │  ✅ +98.5 (IN)
│ Both marked: Transfer        │  ✅
└──────────────────────────────┘
```

---

## Conditional Logic Flow

### Current (INCOMPLETE):

```
CompleteAndSaveTransactionAsync()
  │
  ├─ if (TankId && Volume > 0)
  │   │
  │   └─► ProcessPumpTransactionAsync()  ◄── Regular fueling
  │
  └─ ❌ No handling for IsTransferMode
```

### Fixed (COMPLETE):

```
CompleteAndSaveTransactionAsync()
  │
  ├─ if (IsTransferMode && DestinationTankId > 0)
  │   │
  │   └─► ProcessPumpTransferAsync()  ◄── Tank transfer
  │
  ├─ else if (TankId && Volume > 0)
  │   │
  │   └─► ProcessPumpTransactionAsync()  ◄── Regular fueling
  │
  └─ else
      │
      └─► Skip (no processing needed)
```

---

## Data Flow for Transfer

```
USER REQUEST
    │
    ▼ Validates, authorizes
┌────────────────────────────┐
│ PumpAuthorizeTransferCommand │
└────────────────────────────┘
    │ Stores in Redis
    ▼
┌────────────────────────────┐
│ Redis Cache                │
│ Key: device:PTS001:...     │
│ Value: {                   │
│   IsTransferMode: true     │
│   SourceTankId: 10         │
│   DestinationTankId: 20    │
│ }                          │
└────────────────────────────┘
    │
    │ Pump dispenses (physical)
    │
    ▼ PTS device sends EOT
┌────────────────────────────┐
│ UploadStatusCommand        │
│ (receives EOT signal)      │
└────────────────────────────┘
    │ Retrieves from Redis
    ▼
┌────────────────────────────┐
│ AutoTransactionCompletion  │
│ .CompleteAndSaveTransaction│
│ Async()                    │
├────────────────────────────┤
│ 1. Create Pumptransaction  │
│    with IsTransferMode=true│
│                            │
│ 2. ❌ Missing:             │
│    Check IsTransferMode    │
│    Call PumpTankTransfer   │
│    Service                 │
│                            │
│ 3. ❌ Missing:             │
│    Create TankTransfer     │
│    Update tank stocks      │
│    Create history entries  │
└────────────────────────────┘
    │
    ▼ ❌ Transfer incomplete
DATABASE
  ✅ Pumptransaction (with transfer data)
  ❌ TankTransfer (missing)
  ❌ Tank stocks (unchanged)
  ❌ TankVolumeHistory (no transfer entries)
```

---

## Class Dependencies

```
AutoTransactionCompletionService
    │
    ├─ depends on: PumpTransactionIntegrationService
    │   (used for regular fueling) ✅
    │
    └─ SHOULD depend on: IPumpTankTransferService
        (used for tank transfers) ❌ MISSING CALL


PumpTankTransferService
    │
    ├─ depends on: GpsdataContext
    │
    ├─ depends on: IMapper
    │
    └─ depends on: TankVolumeHistoryIntegrationService

```

---

## Service Registration (Dependency Injection)

### Required DI Setup:

In `Program.cs` or `Startup.cs`:

```csharp
// Must include:
services.AddScoped<IPumpTankTransferService, PumpTankTransferService>();

// Already exists:
services.AddScoped<PumpTransactionIntegrationService>();
services.AddScoped<IAutoTransactionCompletionService, AutoTransactionCompletionService>();
```

### Service Access in CompleteAndSaveTransactionAsync:

```csharp
using (var scope = _scopeFactory.CreateScope())
{
    var context = scope.ServiceProvider.GetRequiredService<GpsdataContext>();

    // GET existing services:
    var integrationService = scope.ServiceProvider
        .GetRequiredService<PumpTransactionIntegrationService>();

    // GET NEW service (after fix):
    var transferService = scope.ServiceProvider
        .GetRequiredService<IPumpTankTransferService>();  ◄── ADD THIS
}
```

---

## Transaction Commit Points

```
save #1: Pumptransaction created
         └─ HasBeenProcessed: false

    ├─ Transfer processing (NEW)
    │   │
    │   ├─ Check: IsTransferMode && DestinationTankId
    │   │
    │   └─ Call: ProcessPumpTransferAsync()
    │       │
    │       save #2 (inside PumpTankTransferService):
    │           ├─ TankTransfer created
    │           ├─ Tank stocks updated
    │           └─ TankVolumeHistory entries created
    │

save #3: Pumptransaction updated
         └─ HasBeenProcessed: true
         └─ Confirms all processing complete
```
