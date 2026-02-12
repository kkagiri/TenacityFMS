# How to Add a New Event to the FMS Event Expression Engine

> **Audience:** AI agents and developers adding new event types to the FMS notification system.
> **Last Updated:** 2026-02-11
> **Prerequisites:** The Event Expression Engine (Phase 1 Foundation) must be deployed.

---

## Quick Reference

Adding a new event requires **4 files + 1 registration step**. Nothing else.

| Step | What | Where | Time |
|------|------|-------|------|
| 1 | Create FMSEvent subclass | `FMS.Application/Features/EventEngine/Events/` | 5 min |
| 2 | Create IExpressionEvaluator | `FMS.Application/Features/EventEngine/Expressions/Evaluators/` | 10 min |
| 3 | Register evaluator in factory | `FMS.Application/Features/EventEngine/Expressions/ExpressionEvaluatorFactory.cs` | 1 min |
| 4 | Register event type metadata | `FMS.Application/Features/EventEngine/DTOs/EventExpressionTypeMetadataDto.cs` | 3 min |
| 5 | Emit event from business code | Wherever the business operation lives | 5 min |

**Total: ~25 minutes per new event type.**

---

## Step-by-Step Guide

### Step 1: Create the FMSEvent Subclass

**File:** `FMS.Application/Features/EventEngine/Events/{EventName}Event.cs`

This class defines **WHAT happened** — the typed data payload.

```csharp
/**
 * File: TankDeliveryEvent.cs
 * Purpose: Event emitted when a fuel delivery is recorded for a tank
 * Dependencies: FMSEvent base class
 * Last Modified: 2026-XX-XX
 */

using System;
using System.Collections.Generic;

namespace FMS.Application.Features.EventEngine.Events;

/// <summary>
/// Emitted when a fuel delivery is recorded for a tank.
/// Business code creates this event and passes it to IEventExpressionEngine.ProcessAsync().
/// </summary>
public class TankDeliveryEvent : FMSEvent
{
    // -- REQUIRED: Set EventType constant --
    public const string EventTypeName = "TankDelivery";

    // -- Typed payload properties --
    public int TankId { get; set; }
    public string TankName { get; set; }
    public string ProductName { get; set; }
    public decimal DeliveredVolume { get; set; }
    public decimal PreDeliveryLevel { get; set; }
    public decimal PostDeliveryLevel { get; set; }
    public decimal ExpectedDeliveryVolume { get; set; }
    public decimal Variance { get; set; }
    public decimal VariancePercentage { get; set; }
    public string DeliveryDocumentNumber { get; set; }

    public TankDeliveryEvent()
    {
        EventType = EventTypeName;
        EventCategory = "FuelManagement"; // Matches notification_categories grouping
    }

    /// <summary>
    /// Template variables for notification message rendering.
    /// Keys become {{placeholders}} in notification templates.
    /// </summary>
    public override Dictionary<string, string> GetTemplateVariables()
    {
        var vars = base.GetTemplateVariables();
        vars["TankName"] = TankName ?? "";
        vars["ProductName"] = ProductName ?? "";
        vars["DeliveredVolume"] = DeliveredVolume.ToString("N2");
        vars["PreDeliveryLevel"] = PreDeliveryLevel.ToString("N2");
        vars["PostDeliveryLevel"] = PostDeliveryLevel.ToString("N2");
        vars["ExpectedDeliveryVolume"] = ExpectedDeliveryVolume.ToString("N2");
        vars["Variance"] = Variance.ToString("N2");
        vars["VariancePercentage"] = VariancePercentage.ToString("N1");
        vars["DeliveryDocumentNumber"] = DeliveryDocumentNumber ?? "N/A";
        return vars;
    }
}
```

#### Rules

- **`EventType`** — set in the constructor. Must be unique. Use PascalCase, no spaces.
- **`EventCategory`** — grouping label. Must match a value from the `notification_categories` table or a new category.
- **Typed properties** — every piece of data the evaluator or notification template might need.
- **`GetTemplateVariables()`** — keys become `{{placeholders}}` in notification message/title templates. Always call `base.GetTemplateVariables()` first.
- **ONE class per file.** No exceptions.

---

### Step 2: Create the Expression Evaluator

**File:** `FMS.Application/Features/EventEngine/Expressions/Evaluators/{EventName}Evaluator.cs`

This class defines **WHEN to care** — evaluating conditions from an EventExpression's `Conditions` JSON column against the event data.

```csharp
/**
 * File: TankDeliveryEvaluator.cs
 * Purpose: Evaluates TankDelivery events against expression conditions
 * Dependencies: IExpressionEvaluator, TankDeliveryEvent
 * Last Modified: 2026-XX-XX
 */

using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators;

/// <summary>
/// Evaluates whether a TankDeliveryEvent matches the conditions
/// stored in an EventExpression's Conditions JSON.
///
/// Example Conditions JSON:
/// {
///   "minVariance": 50,           → variance must be >= 50 liters
///   "minVariancePercent": 2,     → OR variance must be >= 2%
///   "productFilter": "Diesel"    → optional: only trigger for specific product
/// }
///
/// If Conditions JSON is null or empty, the evaluator returns TRUE
/// (scope-only matching via EventType + SiteId + TankId).
/// </summary>
public class TankDeliveryEvaluator : IExpressionEvaluator
{
    public string EventType => TankDeliveryEvent.EventTypeName; // "TankDelivery"

    public bool Evaluate(FMSEvent fmsEvent, string conditionsJson)
    {
        // If no conditions specified, match on scope only (EventType + site + tank)
        if (string.IsNullOrWhiteSpace(conditionsJson))
            return true;

        // Cast to typed event for safe property access
        if (fmsEvent is not TankDeliveryEvent delivery)
            return false;

        try
        {
            using var doc = JsonDocument.Parse(conditionsJson);
            var root = doc.RootElement;

            // --- Condition: minVariance ---
            if (root.TryGetProperty("minVariance", out var minVar)
                && minVar.TryGetDecimal(out var minVariance))
            {
                if (Math.Abs(delivery.Variance) < minVariance)
                    return false;
            }

            // --- Condition: minVariancePercent ---
            if (root.TryGetProperty("minVariancePercent", out var minPct)
                && minPct.TryGetDecimal(out var minPercent))
            {
                if (Math.Abs(delivery.VariancePercentage) < minPercent)
                    return false;
            }

            // --- Condition: productFilter ---
            if (root.TryGetProperty("productFilter", out var prodFilter))
            {
                var filterValue = prodFilter.GetString();
                if (!string.IsNullOrEmpty(filterValue)
                    && !string.Equals(delivery.ProductName, filterValue, StringComparison.OrdinalIgnoreCase))
                {
                    return false;
                }
            }

            return true; // All conditions passed
        }
        catch (JsonException)
        {
            // Malformed JSON — log warning and return true (fail-open)
            return true;
        }
    }
}
```

#### Rules

- **`EventType` property** — must match exactly the `EventTypeName` constant from the FMSEvent subclass.
- **Null/empty conditions = TRUE** — if the admin creates an expression with no conditions, it triggers on scope match alone.
- **Fail-open on malformed JSON** — return `true` and log a warning. Don't swallow events.
- **Each condition is independent** — all conditions must pass (AND logic). If you need OR logic, document it clearly.
- **Use `System.Text.Json`** — not Newtonsoft. The project uses `System.Text.Json` for new code.
- **ONE class per file.**

---

### Step 3: Register Evaluator in Factory

**File:** `FMS.Application/Features/EventEngine/Expressions/ExpressionEvaluatorFactory.cs`

Add one line to the evaluator registry:

```csharp
// In the constructor or registration method:
Register(new TankDeliveryEvaluator());
```

The factory maps `EventType` string → `IExpressionEvaluator` instance. When the engine processes an event, it asks the factory for the evaluator matching `event.EventType`.

If no evaluator is registered for an EventType, the engine uses `AlwaysTrueEvaluator` (scope-only matching).

---

### Step 4: Register Event Type Metadata

**File:** `FMS.Application/Features/EventEngine/DTOs/EventExpressionTypeMetadataDto.cs`

Add your event type to the `GetAvailableTypes()` method. This powers the frontend dropdown when creating an EventExpression:

```csharp
new EventExpressionTypeMetadataDto
{
    EventType = TankDeliveryEvent.EventTypeName,        // "TankDelivery"
    DisplayName = "Tank Delivery Variance",
    Description = "Triggers when a fuel delivery has variance beyond thresholds",
    Category = "FuelManagement",
    AvailableConditions = new List<ConditionFieldDto>
    {
        new("minVariance", "Minimum Variance (Liters)", "number", false, "50"),
        new("minVariancePercent", "Minimum Variance (%)", "number", false, "2"),
        new("productFilter", "Product Filter", "dropdown", false, null,
            new[] { "Diesel", "Petrol", "Kerosene" })
    },
    AvailableScopeFilters = new[] { "SiteId", "TankId" }, // Which scope fields apply
    DefaultSeverity = "Medium",
    DefaultCooldownMinutes = 60
}
```

The `AvailableConditions` list tells the frontend what form fields to render. Each field has:
- `Key` — JSON property name in `Conditions` column
- `Label` — display label
- `InputType` — "number", "text", "dropdown", "boolean", "datetime"
- `IsRequired` — whether the field is mandatory
- `DefaultValue` — pre-filled value
- `Options` — for dropdown type, the available choices

---

### Step 5: Emit the Event from Business Code

In the command, service, or handler where the business operation happens, inject `IEventExpressionEngine` and emit the event:

```csharp
// In your command handler or service:

private readonly IEventExpressionEngine _eventEngine;

// Constructor injection
public CreateTankDeliveryCommandHandler(
    GpsdataContext context,
    IEventExpressionEngine eventEngine,
    // ... other dependencies
)
{
    _context = context;
    _eventEngine = eventEngine;
}

// In the Handle method, after the business logic succeeds:
public async Task<FMSResponse<TankDeliveryDto>> Handle(
    CreateTankDeliveryCommand request,
    CancellationToken ct)
{
    // ... business logic (save delivery to DB, calculate variance, etc.)

    // ✅ EMIT THE EVENT — this is the ONLY notification call
    await _eventEngine.ProcessAsync(new TankDeliveryEvent
    {
        SiteId = delivery.SiteId,
        TankId = delivery.TankId,
        Severity = variance > 5m ? "High" : "Medium",
        TriggeredBy = currentUser.Username,
        TankName = tank.TankName,
        ProductName = tank.Product?.ProductName,
        DeliveredVolume = delivery.Volume,
        PreDeliveryLevel = delivery.PreLevel,
        PostDeliveryLevel = delivery.PostLevel,
        ExpectedDeliveryVolume = delivery.ExpectedVolume,
        Variance = variance,
        VariancePercentage = variancePercent,
        DeliveryDocumentNumber = delivery.DocumentNumber
    }, ct);

    return FMSResponse<TankDeliveryDto>.Success(dto, "Delivery recorded");
}
```

#### Rules

- **ONE `ProcessAsync()` call per event** — never call `CreateNotificationAsync()` directly.
- **Set `SiteId`, `TankId`, `DeviceId`** in the event — the engine uses these for scope matching.
- **Set `Severity`** based on business rules — the engine uses `MinimumSeverity` on the expression to filter.
- **Set `TriggeredBy`** to the current user or "System" for automated operations.
- **Fire-and-forget is OK** — if the notification fails, it shouldn't block the business operation. The engine logs errors internally.

---

## Checklist

Copy this checklist when adding a new event:

```
## New Event: [EventName]

### Files Created
- [ ] `FMS.Application/Features/EventEngine/Events/[EventName]Event.cs`
  - [ ] EventType constant set
  - [ ] EventCategory set
  - [ ] Typed properties defined
  - [ ] GetTemplateVariables() overridden
  - [ ] File header documentation added

- [ ] `FMS.Application/Features/EventEngine/Expressions/Evaluators/[EventName]Evaluator.cs`
  - [ ] EventType property matches FMSEvent constant
  - [ ] Null conditions = true (scope-only match)
  - [ ] All condition fields handled
  - [ ] JsonException caught (fail-open)
  - [ ] File header documentation added

### Registrations
- [ ] Evaluator registered in `ExpressionEvaluatorFactory.cs`
- [ ] Type metadata added to `EventExpressionTypeMetadataDto.GetAvailableTypes()`
  - [ ] DisplayName, Description, Category set
  - [ ] AvailableConditions list complete (key, label, type, required, default)
  - [ ] AvailableScopeFilters set (SiteId, TankId, DeviceId as applicable)
  - [ ] DefaultSeverity and DefaultCooldownMinutes set

### Business Code Integration
- [ ] IEventExpressionEngine injected in the command/service
- [ ] ProcessAsync() called with fully populated event
- [ ] No direct CreateNotificationAsync() calls
- [ ] SiteId/TankId/DeviceId set on event for scope matching
- [ ] Severity set based on business rules

### Verification
- [ ] Build succeeds
- [ ] Event type appears in GET /api/v1/event-expressions/types
- [ ] Can create an EventExpression for this type via API/UI
- [ ] Emitting the event triggers notification when expression matches
- [ ] Cooldown/rate limiting works
- [ ] Template variables render in notification message
```

---

## Common Patterns

### Pattern A: Simple Threshold Event

For events where you just compare a numeric value against a threshold (e.g., temperature, level, count):

- **Event**: Set the value as a property (e.g., `CurrentTemperature`)
- **Evaluator**: Use the existing `ThresholdEvaluator` (generic). Register it in the factory for your EventType.
- **Conditions JSON**: `{ "field": "CurrentTemperature", "operator": ">=", "value": 80 }`

You don't need a custom evaluator — `ThresholdEvaluator` handles `>=`, `<=`, `>`, `<`, `==`, `!=` for any numeric field.

### Pattern B: Status Change Event

For events where something changes state (device online/offline, pump active/failed):

- **Event**: Include `PreviousStatus` and `CurrentStatus` properties
- **Evaluator**: Check if `CurrentStatus` matches a filter (e.g., `"statusFilter": "Offline"`)
- **Conditions JSON**: `{ "statusFilter": "Offline", "minDurationMinutes": 15 }`

### Pattern C: Variance/Discrepancy Event

For events comparing expected vs actual values:

- **Event**: Include `ExpectedValue`, `ActualValue`, `Variance`, `VariancePercentage`
- **Evaluator**: Check `minVariance` and/or `minVariancePercent` thresholds
- **Conditions JSON**: `{ "minVariance": 50, "minVariancePercent": 2 }`

### Pattern D: Always-Trigger Event

For events that should always trigger a notification (system errors, security breaches):

- **Event**: Set `Severity = "Critical"`
- **Evaluator**: Use `AlwaysTrueEvaluator` — no custom evaluator needed
- **Conditions**: None — scope matching on EventType is sufficient

---

## Architecture Diagram

```
Business Code                  Event Expression Engine
─────────────                  ─────────────────────

ClosingStockCmd ──┐             ┌─────────────────────┐
                  │             │ IEventExpressionEngine│
PTS Telemetry  ───┤             │                      │
                  ├── FMSEvent ─┤ 1. Query expressions │
Device Monitor ───┤             │ 2. Scope match       │
                  │             │ 3. Evaluate conditions│
Delivery Cmd   ───┘             │ 4. Cooldown check    │
                               │ 5. Send notification  │
                               │ 6. Log execution      │
                               └─────────────────────┘
                                        │
                               ┌────────┴────────┐
                               │                  │
                        NotificationPolicy    ActiveEvent
                        (HOW to deliver)      (audit trail)
```

---

## FAQ

**Q: What if my event doesn't need an evaluator?**
A: Use `AlwaysTrueEvaluator`. Register it in the factory for your EventType. The engine will match by scope (EventType + SiteId + TankId) only.

**Q: What if I need OR conditions instead of AND?**
A: Create multiple EventExpressions for the same EventType with different conditions. Each expression evaluates independently. Admin creates one expression for "variance > 50L" and another for "variance > 2%".

**Q: What if my event needs a new notification category?**
A: Insert a row into `notification_categories` table first. Then set `EventCategory` in your FMSEvent subclass to match.

**Q: Can one business operation emit multiple events?**
A: Yes. For example, `ClosingStockCommand` emits a `TankClosingStockEvent` AND potentially a `SensorVarianceEvent` if sensor reading differs from manual. Each is processed independently.

**Q: How do I test my event locally?**
A: Use the test endpoint: `POST /api/v1/event-expressions/test` with a JSON body matching your FMSEvent subclass. The response shows which expressions matched, which were suppressed, and what notifications would be sent (without actually sending them).

**Q: Where do I add the `EventType` string constant?**
A: In the FMSEvent subclass itself as `public const string EventTypeName = "YourEventType"`. This is the single source of truth. The evaluator, factory, and metadata all reference it.

**Q: Does the engine handle database transactions?**
A: The engine's `ProcessAsync()` runs independently from the business transaction. If the business operation rolls back, the event still fires. If you need transactional consistency, emit the event AFTER the business `SaveChangesAsync()` succeeds.

---

## Naming Conventions

| Item | Pattern | Example |
|------|---------|---------|
| Event class | `{Domain}{Action}Event` | `TankDeliveryEvent`, `DeviceStatusEvent` |
| Event type string | `{Domain}{Action}` (PascalCase) | `"TankDelivery"`, `"DeviceStatus"` |
| Evaluator class | `{Domain}{Action}Evaluator` | `TankDeliveryEvaluator` |
| Event file | `{Domain}{Action}Event.cs` | `TankDeliveryEvent.cs` |
| Evaluator file | `{Domain}{Action}Evaluator.cs` | `TankDeliveryEvaluator.cs` |
| Condition JSON keys | camelCase | `"minVariance"`, `"productFilter"` |
| Template variables | PascalCase | `{{TankName}}`, `{{DeliveredVolume}}` |

---

## Complete Example: Adding "TankDeliveryEvent"

### 1. Create Event (`Events/TankDeliveryEvent.cs`)
→ See Step 1 above for full code.

### 2. Create Evaluator (`Expressions/Evaluators/TankDeliveryEvaluator.cs`)
→ See Step 2 above for full code.

### 3. Register in Factory (`ExpressionEvaluatorFactory.cs`)
```csharp
Register(new TankDeliveryEvaluator());
```

### 4. Register Metadata (`EventExpressionTypeMetadataDto.cs`)
→ See Step 4 above for full code.

### 5. Emit from Business Code
→ See Step 5 above for full code.

### 6. Verify
```bash
# Check event type is available
GET /api/v1/event-expressions/types
# → Should include "TankDelivery" with conditions metadata

# Create an expression
POST /api/v1/event-expressions
{
  "name": "High Delivery Variance Alert",
  "eventType": "TankDelivery",
  "siteId": 1,
  "conditions": { "minVariancePercent": 2 },
  "notificationPolicyId": 5,
  "cooldownMinutes": 60,
  "priority": "High"
}

# Test with sample event
POST /api/v1/event-expressions/test
{
  "eventType": "TankDelivery",
  "siteId": 1,
  "tankId": 3,
  "severity": "High",
  "tankName": "Diesel Tank 1",
  "deliveredVolume": 5000,
  "expectedDeliveryVolume": 5200,
  "variance": -200,
  "variancePercentage": -3.85
}
# → Should return matched expression + notification preview
```

---

*This guide is part of the Event Expression Engine documentation.*
*See also: [PRD.md](PRD.md) | [TASKLIST.md](TASKLIST.md) | [database/migration.sql](database/migration.sql)*
