# Tank Management Feature Documentation

## 1. User Flow

The Tank Management feature allows users to manage all aspects of fuel tanks, including their creation, monitoring, and the various transactions that affect their stock levels. The primary user flows are:

*   **Tank Administration:** Creating, updating, and deleting tank records.
*   **Deliveries:** Recording fuel deliveries to tanks.
*   **Fuel Refills:** Recording fuel dispensed from tanks into vehicles.
*   **Tank Stock Management:** Managing opening and closing stock, performing stock adjustments, and reconciling stock levels.
*   **Tank Transfers:** Recording the transfer of fuel between tanks.
*   **Reporting:** Generating various reports related to tank stock and volume history.

## 2. Data Flow

The data flow for the Tank Management feature revolves around the `Tank` entity and its related transactional entities. All changes to tank volume are recorded in the `TankVolumeHistory` entity, which serves as a ledger for all tank transactions.

The key data flows are:

*   **Creation/Update of Tanks:** New tanks are created with their specifications. Updates can be made to these details.
*   **Deliveries:** A new `Delivery` record is created, and the `TankVolumeHistory` is updated with a positive volume change.
*   **Fuel Refills:** A new `FuelRefill` record is created, and the `TankVolumeHistory` is updated with a negative volume change.
*   **Tank Transfers:** A `TankTransfer` record is created. The source tank's volume is decreased, and the destination tank's volume is increased in the `TankVolumeHistory`.
*   **Stock Management:** `TankStock` records are created for opening and closing stock. `StockAdjustment` records are created for manual adjustments. Reconciliations update the `Tank`'s `CurrentStock` based on the `TankVolumeHistory`.

## 3. Architectural Design

The Tank Management feature follows a CQRS (Command Query Responsibility Segregation) pattern, utilizing MediatR to decouple commands and queries from their handlers. This results in a clean and maintainable architecture.

The main components are:

*   **Commands:** Represent actions that change the state of the system (e.g., `CreateTankCommand`, `UpdateDeliveryCommand`).
*   **Queries:** Represent requests for data (e.g., `GetTankByIdQuery`, `GetDeliveryListQuery`).
*   **Handlers:** Contain the business logic to process commands and queries.
*   **DTOs (Data Transfer Objects):** Used to transfer data between the application layers.
*   **Entities:** Represent the domain objects (e.g., `Tank`, `Delivery`, `FuelRefill`).
*   **Services:** Encapsulate business logic that doesn't fit neatly into a command or query handler (e.g., `InventoryCostingService`, `TankVolumeHistoryIntegrationService`).

## 4. System Architecture Overview

The following diagram illustrates the high-level architecture and interconnections within the Tank Management feature, showing how various components interact.

```mermaid
graph TD
    subgraph FMSApp[FMS.Application.Features.TankManagement]
        DTR[DailyTankReconciliation]
        DEL[Deliveries]
        FR[FuelRefill]
        PT[PumpTransaction]
        SVC[Services]
        TNK[Tank]
        TS[TankStock]
        TT[TankTransfer]
        TVH[TankVolumeHistory]
    end

    subgraph CoreSvc[Core Services]
        TVHIS[TankVolumeHistoryIntegrationService]
        TSFRS[TankStockFutureRecordsService]
        TVAS[ITankVolumeAdjustmentService]
    end

    subgraph Infra[Infrastructure]
        MED[MediatR]
        AM[AutoMapper]
        EF[GpsdataContext (EF Core)]
    end

    DEL --> MED
    FR --> MED
    TS --> MED
    TT --> MED
    DTR --> MED
    PT --> MED
    TNK --> MED

    DEL -- uses --> TVHIS
    FR -- uses --> TVHIS
    TS -- uses --> TVHIS
    TT -- uses --> TVHIS
    TVHIS -- dispatches --> TVH

    FR -- validates with --> TSFRS
    TS -- validates with --> TSFRS
    TT -- validates with --> TSFRS

    DEL -- adjusts via --> TVAS
    TT -- adjusts via --> TVAS

    MED -- dispatches to --> Handlers[Command/Query Handlers]
    Handlers -- interacts with --> EF
    Handlers -- maps with --> AM

    TVH -- stores data for --> TNK
    TVH -- stores data for --> DEL
    TVH -- stores data for --> FR
    TVH -- stores data for --> TS
    TVH -- stores data for --> TT
    TVH -- stores data for --> PT

    SVC -- provides logic for --> DEL
    SVC -- provides logic for --> FR
    SVC -- provides logic for --> TS
    SVC -- provides logic for --> TT
    SVC -- provides logic for --> PT
    SVC -- provides logic for --> TNK
    SVC -- provides logic for --> DTR

    style FMSApp fill:#f9f,stroke:#333,stroke-width:2px
    style CoreSvc fill:#ccf,stroke:#333,stroke-width:2px
    style Infra fill:#cfc,stroke:#333,stroke-width:2px
```

## 5. Dependencies

The Tank Management feature has the following key dependencies:

*   **MediatR:** For implementing the CQRS pattern.
*   **AutoMapper:** For mapping between entities and DTOs.
*   **Entity Framework Core:** For data access and persistence.

## 6. Important Services Detailed Documentation

### Tank Volume History Integration Service

#### Purpose and Overview
The `TankVolumeHistoryIntegrationService` is a critical component within the FMS application, designed to centralize and standardize how all changes to tank volume are recorded and managed. Its primary purpose is to ensure data consistency and integrity across various operations that affect fuel tank levels, such as deliveries, fuel refills, tank transfers, stock adjustments, and automated pump transactions.

Instead of individual command handlers directly manipulating the `TankVolumeHistory` table, they delegate this responsibility to this service. This approach promotes a single source of truth for tank volume changes, simplifies maintenance, and reduces the risk of discrepancies.

The service ensures that for every volume-affecting event, a corresponding `TankVolumeHistory` record is created or updated, and crucially, it triggers the recalculation of subsequent history entries to maintain an accurate ledger of tank levels over time.

#### How it is Used
Other command handlers and services that modify tank volumes (e.g., `CreateDeliveryCommand`, `CreateFuelRrefillCommand`, `CreateTankTransfer`, `CreateStockAdjustmentCommand`) inject and utilize an instance of `TankVolumeHistoryIntegrationService`. They call the appropriate method on this service, passing the relevant details of the volume change.

The service then handles the creation or update of the `TankVolumeHistory` record and, importantly, dispatches an `UpdateTankVolumeHistoryCommand` via MediatR to ensure that all subsequent historical entries for that tank are re-calculated to reflect the new state.

##### Example Usage (Conceptual)
```csharp
public class CreateDeliveryCommandHandler : IRequestHandler<CreateDeliveryCommand, FMSResponseMessage>
{
    private readonly TankVolumeHistoryIntegrationService _tankVolumeHistoryService;

    public CreateDeliveryCommandHandler(..., TankVolumeHistoryIntegrationService tankVolumeHistoryService)
    {
        _tankVolumeHistoryService = tankVolumeHistoryService;
    }

    public async Task<FMSResponseMessage> Handle(CreateDeliveryCommand request, CancellationToken cancellationToken)
    {
        // ... existing delivery creation logic ...

        // Call the integration service to record the volume change
        var volumeUpdateResult = await _tankVolumeHistoryService.ProcessDeliveryChangeAsync(
            tankId: delivery.TankId,
            timestamp: delivery.DeliveryDate,
            volumeChange: delivery.ManualDeliveryAmount, // Positive for delivery
            deliveryId: delivery.Id,
            actionType: ActionType.Create,
            recordedBy: delivery.RecordedBy,
            cancellationToken: cancellationToken);

        if (!volumeUpdateResult.Success)
        {
            _logger.LogWarning("Failed to update tank volume history: {Message}", volumeUpdateResult.Message);
            // Decide whether to fail the main operation or just log a warning
        }

        // ... rest of the logic ...
    }
}
```

#### Methods and Functionality
The service exposes several methods, each tailored to a specific type of volume-affecting event. All these methods internally call a generic `ProcessChangeAsync` method, which then dispatches a `ProcessTankStockChangeCommand`.

##### `ProcessFuelRefillChangeAsync`
Processes a fuel refill event. Fuel refills decrease tank volume, so the `volumeChange` parameter should be negative.
```csharp
public async Task<FMSResponseMessage> ProcessFuelRefillChangeAsync (
    int tankId,
    DateTime timestamp,
    decimal volumeChange, // Should be negative for refills
    int refillId,
    ActionType actionType,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

##### `ProcessDeliveryChangeAsync`
Processes a fuel delivery event. Deliveries increase tank volume, so the `volumeChange` parameter should be positive.
```csharp
public async Task<FMSResponseMessage> ProcessDeliveryChangeAsync (
    int tankId,
    DateTime timestamp,
    decimal volumeChange, // Should be positive for deliveries
    int deliveryId,
    ActionType actionType,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

##### `ProcessTankStockChangeAsync`
Processes changes related to manual tank stock entries (opening or closing stock).
```csharp
public async Task<FMSResponseMessage> ProcessTankStockChangeAsync (
    int tankId,
    DateTime timestamp,
    decimal volumeChange, // Difference between new and old stock
    int stockId,
    bool isOpening,
    ActionType actionType,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

##### `ProcessTankTransferOutChangeAsync`
Processes the outgoing side of a tank transfer. The volume is removed from the source tank.
```csharp
public async Task<FMSResponseMessage> ProcessTankTransferOutChangeAsync (
    int sourceTankId,
    DateTime timestamp,
    decimal volumeChange, // Should be negative (amount transferred out)
    int transferId,
    ActionType actionType,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

##### `ProcessTankTransferInChangeAsync`
Processes the incoming side of a tank transfer. The volume is added to the destination tank.
```csharp
public async Task<FMSResponseMessage> ProcessTankTransferInChangeAsync (
    int destinationTankId,
    DateTime timestamp,
    decimal volumeChange, // Should be positive (amount transferred in)
    int transferId,
    ActionType actionType,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

##### `ProcessAdjustmentChangeAsync`
Processes a manual stock adjustment. The `volumeChange` can be positive or negative depending on the adjustment type.
```csharp
public async Task<FMSResponseMessage> ProcessAdjustmentChangeAsync (
    int tankId,
    DateTime timestamp,
    decimal volumeChange, // Can be positive or negative
    int adjustmentId,
    ActionType actionType,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

##### `ProcessPumpTransactionChangeAsync`
Processes an automated pump transaction. This typically represents fuel dispensed, so the `volumeChange` should be negative.
```csharp
public async Task<FMSResponseMessage> ProcessPumpTransactionChangeAsync (
    int tankId,
    DateTime timestamp,
    decimal volumeChange, // Should be negative
    int transactionId,
    ActionType actionType,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

##### `ReconcileTankCurrentStockAsync`
This method is used to synchronize a tank's `CurrentStock` property with the latest calculated volume from its `TankVolumeHistory`. It creates a reconciliation entry in the history if a discrepancy is found.
```csharp
public async Task<FMSResponseMessage> ReconcileTankCurrentStockAsync (
    int tankId,
    string recordedBy,
    CancellationToken cancellationToken = default)
```

#### Internal Mechanism (`ProcessChangeAsync` and `UpdateTankVolumeHistoryCommand`)
All the specific `Process...ChangeAsync` methods ultimately call a private generic method `ProcessChangeAsync`. This method constructs and dispatches a `ProcessTankStockChangeCommand` via MediatR. The handler for this command is responsible for:

1.  Creating or updating the raw `TankVolumeHistory` record with the provided `volumeChange`.
2.  Crucially, after the record is saved, it dispatches an `UpdateTankVolumeHistoryCommand`.

The `UpdateTankVolumeHistoryCommand` handler then performs the core logic of recalculating the `NewVolume` for all subsequent `TankVolumeHistory` records for that specific tank, ensuring that the entire historical ledger remains accurate and consistent after any insertion, update, or deletion of a record.

### Tank Stock Future Records Service

#### Purpose and Overview
The `TankStockFutureRecordsService` is designed to enforce data integrity and consistency when historical tank volume entries are made. It prevents or warns against situations where a new historical record might conflict with existing future records (i.e., records with a timestamp later than the new historical entry).

This service is crucial for maintaining an accurate chronological ledger of tank volumes. It uses configurable policies to determine how to react when a historical entry is attempted that would affect existing future data. This helps in preventing logical inconsistencies and provides clear guidance or blocking mechanisms to users.

#### Key Method: `ValidateHistoricalEntryAsync`
This is the primary method used to check if a historical tank stock entry can be processed based on the configured future records policy.

##### Method Signature
```csharp
public async Task<TankStockFutureRecordsValidationResult> ValidateHistoricalEntryAsync (
    int tankId,
    DateTime entryDate,
    VolumeChangeReasonEnum entryType,
    CancellationToken cancellationToken = default)
```
##### Parameters
*   `tankId`: The ID of the tank for which the historical entry is being made.
*   `entryDate`: The date and time of the proposed historical entry.
*   `entryType`: The type of volume change reason (e.g., `OpeningStock`, `ClosingStock`, `Dispensing`, `Delivery`, `TransferIn`, `TransferOut`, `Adjustment`).
*   `cancellationToken`: A token to observe while waiting for the task to complete.

##### Return Value
Returns a `TankStockFutureRecordsValidationResult` object, which contains information about whether the entry is allowed, any messages or warnings, and details about affected future records.

#### Future Records Policies
The service's behavior is governed by a configurable policy, retrieved via `ISystemConfigurationService`. The available policies are:

*   **`BLOCK`:** If future records exist after the `entryDate`, the historical entry is completely blocked. The user receives a message indicating that the operation cannot proceed.
*   **`WARN_RECONCILE`:** If future records exist, the historical entry is allowed, but a warning is issued. The message suggests that a manual reconciliation might be needed to correct subsequent tank stock levels. User confirmation is typically required.
*   **`WARN_RECALCULATE`:** Similar to `WARN_RECONCILE`, but the warning message indicates that an automatic recalculation of future records will occur. User confirmation is typically required.
*   **`ALLOW_RECALCULATE`:** The historical entry is allowed, and any affected future records are automatically recalculated without requiring user confirmation. An informational message may be provided.

The service also considers a `MaxHistoricalDays` configuration, which can block entries that are too far in the past, regardless of future records.

#### Data Structures

##### `TankStockFutureRecordsValidationResult`
This class encapsulates the outcome of the historical entry validation.
```csharp
public class TankStockFutureRecordsValidationResult {
    public bool IsAllowed { get; set; } // Whether the entry is allowed to proceed
    public bool RequiresUserConfirmation { get; set; } // Whether user confirmation is required
    public string Policy { get; set; } = string.Empty; // The policy that was applied
    public string Message { get; set; } = string.Empty; // Main message to display to user
    public string WarningType { get; set; } = string.Empty; // Type of warning (NONE, BLOCKED, WARN_RECONCILE, etc.)
    public string? DetailedWarning { get; set; } // Optional detailed warning information
    public int FutureRecordsCount { get; set; } // Number of future records that will be affected
    public DateTime? EarliestFutureRecord { get; set; } // Earliest future record timestamp
    public DateTime? LatestFutureRecord { get; set; } // Latest future record timestamp
}
```

##### `FutureRecordsPolicyConfig`
This class represents the configuration settings for the future records policy.
```csharp
public class FutureRecordsPolicyConfig {
    public string Policy { get; set; } = string.Empty; // The policy string (BLOCK, WARN_RECONCILE, etc.)
    public bool AllowOverride { get; set; } // Whether users can override warnings
    public int MaxHistoricalDays { get; set; } // Maximum days back to check for future records
    public bool ShowDetailedWarnings { get; set; } // Whether to show detailed warning information
}
```

### Tank Volume Adjustment Service

#### ITankVolumeAdjustmentService
This service provides a method to adjust the tank volume and create a corresponding `TankVolumeHistory` record. It is used when a transaction that affects the tank volume is updated or deleted.

##### Methods
*   **AdjustTankVolumeAsync:** Adjusts the tank volume, creates a `TankVolumeHistory` record, and optionally rebases subsequent transactions.

## 7. Sub-component Details

### Daily Tank Reconciliation

*   **ProcessDailyReconciliationCommand**
    *   **Properties**
        ```csharp
        public DateTime StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public int? TankId { get; set; }
        public int? SiteId { get; set; }
        public bool ForceReprocess { get; set; }
        ```
    *   Note: The handler for this command is currently commented out.

*   **GetDailyReconciliationReportQuery**
    *   **Properties**
        ```csharp
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public bool IncludeDiscrepanciesOnly { get; set; }
        public int PageNumber { get; set; }
        public int PageSize { get; set; }
        ```
    *   Note: The handler for this query is currently commented out.

### Deliveries

*   **CreateDeliveryCommand**
    *   **Properties**
        ```csharp
        public DeliveryDTO DeliveryDTO { get; set; }
        ```
    *   **Validation**
        *   TankId must exist.
        *   SupplierId must exist.
        *   RecordedBy (UserId) must exist.
        *   ManualDeliveryAmount must be greater than 0.
        *   The tank must have enough space for the delivery if the delivery date is today.
        *   StockBeforeDelivery must be less than the stock level at the end of the delivery.
    *   **Data Calculation**
        *   No complex calculations are performed in this command. The `CurrentStock` of the tank is updated if `UseBookKeeping` is enabled and the delivery date is today.
    *   **Services Called**
        *   [TankVolumeHistoryIntegrationService](#tank-volume-history-integration-service): `ProcessDeliveryChangeAsync` is called to record the volume change in the `TankVolumeHistory`.

*   **UpdateDeliveryCommand**
    *   **Properties**
        ```csharp
        public DeliveryDTO DeliveryDTO { get; set; }
        public bool ignoreNegativesValues { get; set; }
        ```
    *   **Validation**
        *   TankId must exist.
        *   SupplierId must exist.
        *   RecordedBy (UserId) must exist.
    *   **Data Calculation**
        *   The command checks if the stock level has changed and, if so, calls the `ITankVolumeAdjustmentService`.
    *   **Services Called**
        *   [ITankVolumeAdjustmentService](#tank-volume-adjustment-service): `AdjustTankVolumeAsync` is called to adjust the tank volume if the stock level has changed.

*   **DeleteDeliveryCommand**
    *   **Properties**
        ```csharp
        public int Id { get; set; }
        ```
    *   **Validation**
        *   Delivery with the given Id must exist.
    *   **Data Calculation**
        *   No complex calculations are performed in this command.
    *   **Services Called**
        *   [ITankVolumeAdjustmentService](#tank-volume-adjustment-service): `AdjustTankVolumeAsync` is called to reverse the tank volume change.

### Fuel Refill

*   **CreateFuelRrefillCommand**
    *   **Properties**
        ```csharp
        public FuelRefilDTO FuelRefilDTO { get; set; }
        ```
    *   **Validation**
        *   FuelRefilDTO cannot be null.
        *   Validates historical entries against future records policy using [TankStockFutureRecordsService](#tank-stock-future-records-service).
        *   Opening stock for the tank on the entry day must exist.
        *   Cannot add a fuel refill after a closing stock for the same day without a new opening stock.
        *   Checks for duplicate fuel refill entries.
        *   Fuel refill amount must be greater than 0.
        *   Vehicle, Site, Tank, and User must exist.
        *   If the tank uses book keeping, it must have sufficient fuel.
        *   Previous meter reading must be less than the current meter reading.
    *   **Data Calculation**
        *   If the tank uses book keeping and the refill date is today, the tank's `CurrentStock` is decreased.
    *   **Services Called**
        *   [TankStockFutureRecordsService](#tank-stock-future-records-service): `ValidateHistoricalEntryAsync` is called to validate historical entries.
        *   [TankVolumeHistoryIntegrationService](#tank-volume-history-integration-service): `ProcessFuelRefillChangeAsync` is called to record the volume change.

*   **UpdateFuelRefillCommand**
    *   **Properties**
        ```csharp
        public int FuelRefillId { get; set; }
        public int TankId { get; set; }
        public DateTime RefillDate { get; set; }
        public decimal NewAmount { get; set; }
        public decimal OldAmount { get; set; }
        public string UserId { get; set; }
        ```
    *   **Validation**
        *   NewAmount must be greater than 0.
        *   FuelRefill with the given ID must exist.
    *   **Data Calculation**
        *   Calculates the volume change based on the difference between the new and old amounts.
    *   **Services Called**
        *   [TankVolumeHistoryIntegrationService](#tank-volume-history-integration-service): `ProcessFuelRefillChangeAsync` is called to update the volume change.

*   **DeleteFuelRefillCommand**
    *   **Properties**
        ```csharp
        public int FuelRefillId { get; set; }
        public int TankId { get; set; }
        public decimal Amount { get; set; }
        public DateTime RefillDate { get; set; }
        public string UserId { get; set; }
        ```
    *   **Validation**
        *   FuelRefill with the given ID must exist.
    *   **Data Calculation**
        *   No complex calculations.
    *   **Services Called**
        *   [TankVolumeHistoryIntegrationService](#tank-volume-history-integration-service): `ProcessFuelRefillChangeAsync` is called to reverse the volume change.

### Pump Transaction

*   **GetPumpTransactionQuery**
    *   **Properties**
        ```csharp
        public int? TankId { get; set; }
        public int? VehicleId { get; set; }
        public string? PtsId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool? ProcessedOnly { get; set; }
        ```
    *   **Validation**
        *   StartDate cannot be greater than EndDate.
        *   PtsId cannot exceed 100 characters.
        *   At least one filter parameter must be provided.

### Services

*   **InventoryCostingService**
    *   This service is responsible for calculating inventory costs using the weighted average method.
    *   **Methods**
        *   **GetWeightedAverageCostAsync:** Calculates the weighted average cost per liter for a specific tank based on recent deliveries.
        *   **GetStockValuationAsync:** Calculates the current stock valuation for a tank.
        *   **CalculateMovementCostImpactAsync:** Calculates the cost impact of a stock movement (consumption or delivery).
        *   **GetSiteInventoryValuationAsync:** Calculates the comprehensive inventory valuation for an entire site.

### Tank

*   **CreateTankCommand**
    *   **Properties**
        ```csharp
        public TankDTO TankDto { get; set; }
        ```
    *   **Validation**
        *   Tank name is required.
        *   SiteId is required and must be valid.
        *   If PtsId is provided, it must be valid.

*   **UpdateTankCommand**
    *   **Properties**
        ```csharp
        public int Id { get; set; }
        public TankDTO Tank { get; set; }
        ```
    *   **Validation**
        *   Tank with the given Id must exist.
        *   SiteId is required and must be valid.
        *   If PtsId is provided, it must be valid.

*   **DeleteTankCommand**
    *   **Properties**
        ```csharp
        public int Id { get; set; }
        ```
    *   **Validation**
        *   Tank with the given Id must exist.

### Tank Stock

*   **OpeningStockCommand**
    *   **Properties**
        ```csharp
        public int TankId { get; set; }
        public decimal OpeningStock { get; set; }
        public string RecordedBy { get; set; }
        public DateTime? EntryDate { get; set; }
        ```
    *   **Validation**
        *   Tank must exist.
        *   OpeningStock must be greater than 0.
        *   Validates historical entries using [TankStockFutureRecordsService](#tank-stock-future-records-service).
        *   An opening stock cannot be created for a date that already has one without a subsequent closing stock.
    *   **Services Called**
        *   [TankStockFutureRecordsService](#tank-stock-future-records-service): `ValidateHistoricalEntryAsync`
        *   [TankVolumeHistoryIntegrationService](#tank-volume-history-integration-service): `ProcessTankStockChangeAsync`

*   **ClosingStockCommand**
    *   **Properties**
        ```csharp
        public int TankId { get; set; }
        public decimal ClosingStock { get; set; }
        public string RecordedBy { get; set; }
        public DateTime? EntryDate { get; set; }
        ```
    *   **Validation**
        *   Tank must exist.
        *   Validates historical entries using [TankStockFutureRecordsService](#tank-stock-future-records-service).
        *   A closing stock cannot be created for a date that already has one.
        *   An opening stock for the same date must exist.
    *   **Services Called**
        *   [TankStockFutureRecordsService](#tank-stock-future-records-service): `ValidateHistoricalEntryAsync`
        *   [TankVolumeHistoryIntegrationService](#tank-volume-history-integration-service): `ProcessTankStockChangeAsync`

### Tank Transfer

*   **CreateTankTransfer**
    *   **Properties**
        ```csharp
        public TankTransferDTO TankTransferDTO { get; set; }
        ```
    *   **Validation**
        *   Source and destination tanks must exist.
        *   Transfer amount must be greater than 0.
        *   Validates historical entries for both tanks using [TankStockFutureRecordsService](#tank-stock-future-records-service).
        *   Source tank must have sufficient stock if the transfer date is today.
    *   **Services Called**
        *   [TankStockFutureRecordsService](#tank-stock-future-records-service): `ValidateHistoricalEntryAsync`

*   **DeleteTankTransferCommand**
    *   **Properties**
        ```csharp
        public int Id { get; set; }
        ```
    *   **Validation**
        *   Tank transfer with the given ID must exist.
    *   **Services Called**
        *   [ITankVolumeAdjustmentService](#tank-volume-adjustment-service): `AdjustTankVolumeAsync` is called for both source and destination tanks to reverse the volume changes.

### Tank Volume History

*   **CreateTankVolumeHistoryCommand**
    *   **Properties**
        ```csharp
        public TankVolumeHistory TankVolumeHistory { get; set; }
        ```
    *   **Validation**
        *   Tank ID and Volume Change are required.
        *   Reference ID is required when Reference Type is provided.
        *   Tank must exist.
    *   **Services Called**
        *   `UpdateTankVolumeHistoryCommand` (dispatched via MediatR) to recalculate volumes.

*   **DeleteTankVolumeHistoryCommand**
    *   **Properties**
        ```csharp
        public int? Id { get; set; }
        public int? TankId { get; set; }
        public string ReferenceType { get; set; }
        public int? ReferenceId { get; set; }
        public DateTime? FromDate { get; set; }
        public DateTime? ToDate { get; set; }
        ```
    *   **Validation**
        *   At least one filter criterion must be provided.
    *   **Services Called**
        *   `UpdateTankVolumeHistoryCommand` (dispatched via MediatR) to recalculate volumes for affected tanks.

*   **ProcessTankStockChangeCommand**
    *   **Properties**
        ```csharp
        public int TankId { get; set; }
        public DateTime Timestamp { get; set; }
        public decimal VolumeChange { get; set; }
        public VolumeChangeReasonEnum ChangeReason { get; set; }
        public string RecordedBy { get; set; }
        public int ReferenceId { get; set; }
        public string ReferenceType { get; set; }
        public ActionType ActionType { get; set; }
        ```
    *   **Validation**
        *   Tank must exist.
    *   **Services Called**
        *   `UpdateTankVolumeHistoryCommand` (dispatched via MediatR) to recalculate volumes.

*   **ReconcileAllTanksCommand**
    *   **Properties**
        ```csharp
        public int? SiteId { get; set; }
        public string RecordedBy { get; set; }
        ```
    *   Note: The handler for this command is currently commented out.

*   **UpdateTankVolumeHistoryCommand**
    *   **Properties**
        ```csharp
        public int TankId { get; set; }
        public DateTime EffectiveDate { get; set; }
        public bool IsHistoricalUpdate { get; set; }
        public bool UpdateTankCurrentStock { get; set; }
        ```
    *   **Functionality**
        *   Recalculates `NewVolume` for all `TankVolumeHistory` records for a given tank from the `EffectiveDate` onwards.
        *   Optionally updates the tank's `CurrentStock` based on the latest calculated volume.

*   **UploadTankVolumeCommand**
    *   **Properties**
        ```csharp
        public List<TankVolumeHistoryDTO> TankVolumeHistories { get; set; }
        public bool IsHistoricalData { get; set; }
        ```
    *   **Validation**
        *   Tank volume records must be provided.
        *   Each record must have a valid Tank ID and Volume Change.
        *   Each Tank ID must correspond to an existing tank.
    *   **Services Called**
        *   `UpdateTankVolumeHistoryCommand` (dispatched via MediatR) for each tank group to recalculate volumes.

*   **GetTankVolumeHistoryFilteredQuery**
    *   **Properties**
        ```csharp
        public int? SiteId { get; init; }
        public int? TankId { get; init; }
        public string? RecordedBy { get; init; }
        public DateTime? StartDate { get; init; }
        public DateTime? EndDate { get; init; }
        public int? Take { get; init; }
        public bool? IncludeVehicleNames { get; init; }
        ```
    *   **Functionality**
        *   Retrieves tank volume history records based on various filters (Site, Tank, RecordedBy, Date Range).
        *   Includes vehicle names for dispensing transactions if requested.

*   **GetTankVolumeHistoryByDateRangeQuery**
    *   **Properties**
        ```csharp
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        ```
    *   **Functionality**
        *   Retrieves tank volume history records within a specified date range.

*   **GetTankVolumeHistoryBySiteQuery**
    *   **Properties**
        ```csharp
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int SiteId { get; set; }
        ```
    *   **Functionality**
        *   Retrieves tank volume history records for a specific site within a date range.

*   **GetTankVolumeHistoryByTankIdQuery**
    *   **Properties**
        ```csharp
        public DateTime StartDate { get; set; }
        public DateTime EndDate { get; set; }
        public int TankId { get; set; }
        ```
    *   **Validation**
        *   Tank with the given ID must exist.
    *   **Functionality**
        *   Retrieves tank volume history records for a specific tank within a date range.

*   **GetTankVolumeHistoryQuery**
    *   **Functionality**
        *   Retrieves all tank volume history records.

*   **GetAllUsersForFilterQuery**
    *   **Functionality**
        *   Retrieves a list of active users for filtering purposes.
