# Fueling Rules Cascade Hierarchy Implementation

## Table of Contents

1. [Overview](#overview)
2. [Cascade Architecture](#cascade-architecture)
3. [Project Structure](#project-structure)
4. [Sequence Diagrams](#sequence-diagrams)
5. [Implementation Details](#implementation-details)
6. [API Reference](#api-reference)
7. [Frontend Integration](#frontend-integration)
8. [Mobile App Integration](#mobile-app-integration)
9. [Usage Examples](#usage-examples)
10. [Testing Guide](#testing-guide)

---

## Overview

The Fueling Rules Cascade Hierarchy system allows rules to be assigned at multiple levels (Site, Vehicle Type, Tag, Vehicle) with automatic merging based on priority. Higher priority rules override lower priority ones, enabling flexible organization-wide defaults with specific overrides.

### Key Concepts

| Level        | Priority | Description                                   |
| ------------ | -------- | --------------------------------------------- |
| Site         | 10       | Organization-wide defaults                    |
| Vehicle Type | 50       | Type-specific rules (e.g., trucks vs. cars)   |
| Tag          | 80       | Tag-based rules for grouped vehicles          |
| Vehicle      | 100      | Vehicle-specific overrides (highest priority) |

### Rule Merging Behavior

- **Limits**: Lower values win (more restrictive)
- **Permissions**: More restrictive wins
- **Time Windows**: Intersection of allowed times
- **Applied Rules**: All applicable rule sets are tracked

---

## Cascade Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cascade Priority Flow                        │
│                                                                  │
│   Site (P:10)  →  VehicleType (P:50)  →  Tag (P:80)  →  Vehicle (P:100)
│      ↓                   ↓                  ↓              ↓     │
│   ┌─────────┐      ┌──────────┐       ┌─────────┐    ┌─────────┐│
│   │ 100L/day│  →   │ 80L/day  │   →   │ 60L/day │ →  │ 50L/day ││
│   └─────────┘      └──────────┘       └─────────┘    └─────────┘│
│                                                                  │
│   Final Effective Limit: 50L/day (highest priority wins)        │
└─────────────────────────────────────────────────────────────────┘
```

### Evaluation Flow

```
┌──────────────────────────────────────────────────────────────────┐
│                    FuelingRuleEvaluationService                   │
├──────────────────────────────────────────────────────────────────┤
│                                                                   │
│  1. Build FuelingContext                                         │
│     ├── Vehicle ID, Type, Site                                   │
│     ├── Tag ID (if applicable)                                   │
│     └── Current usage (daily/monthly)                            │
│                                                                   │
│  2. Load Applicable Assignments                                  │
│     ├── Site-level rules      (Priority: 10)                    │
│     ├── VehicleType-level     (Priority: 50)                    │
│     ├── Tag-level rules       (Priority: 80)                    │
│     └── Vehicle-level rules   (Priority: 100)                   │
│                                                                   │
│  3. Check if Rules Exist                                         │
│     └── NO RULES = BLOCKED (vehicle must have rules assigned)   │
│                                                                   │
│  4. Sort by Priority (descending)                                │
│                                                                   │
│  5. Merge Rules (cascade override)                               │
│     └── Higher priority values override lower                    │
│                                                                   │
│  6. Calculate Fuel Allowance                                     │
│     ├── IsAllowed: bool                                          │
│     ├── MaxFuelAllowed: decimal                                  │
│     ├── SoftLimit/HardLimit: decimal                             │
│     └── AppliedRuleSets: List                                    │
│                                                                   │
└──────────────────────────────────────────────────────────────────┘
```

### No Rules = Blocked Policy

**IMPORTANT**: Vehicles without any fueling rules assigned are **blocked from fueling**.

This "opt-in" approach means:

- ✅ Administrators must explicitly configure rules before a vehicle can fuel
- ✅ Prevents unauthorized or accidental fueling
- ✅ Forces proper fleet configuration
- ⚠️ New vehicles require rule assignment before first fueling

---

## Project Structure

### Backend Structure

```
FMS.Application/
├── Features/
│   └── FuelTagManagement/
│       └── FuelingRules/
│           ├── Services/
│           │   └── FuelingRuleEvaluationService.cs    # Core cascade logic
│           ├── Queries/
│           │   └── GetEffectiveRulesForVehicleQuery.cs # API query
│           ├── RuleSetAssignments/
│           │   ├── Commands/
│           │   │   ├── CreateRuleSetAssignmentCommand.cs
│           │   │   ├── UpdateRuleSetAssignmentCommand.cs
│           │   │   └── DeleteRuleSetAssignmentCommand.cs
│           │   ├── Queries/
│           │   │   ├── GetAssignmentsQuery.cs
│           │   │   └── GetAssignmentsByTargetQuery.cs
│           │   └── DTOs/
│           │       └── RuleSetAssignmentDTO.cs
│           ├── RuleSet/
│           │   ├── Commands/
│           │   └── Queries/
│           └── Rules/
│               └── Commands/
│                   ├── DailyMonthlyRules/
│                   ├── NoOfRefilRules/
│                   └── TimeWIndowLimitRule/
│
├── Command/
│   └── PTSCommand/
│       └── PumpCommands/
│           └── PumpAuthorizeCommand.cs    # Uses FuelingRuleEvaluationService
│
└── Common/
    └── FMSResponse.cs

FMS.WebClient/
├── Controllers/
│   └── FuelManagement/
│       └── FuelingRuleController.cs       # API endpoints
└── Extensions/
    └── FmsServiceCollectionExtensions.cs  # DI registration

FMS.Domain/
└── Entities/
    └── Features/
        └── FuelRule/
            ├── FuelingRuleSetAssignment.cs
            └── AssignmentTargetType.cs
```

### Frontend Structure

```
fms.frontend/src/
├── redux/
│   ├── actions/
│   │   └── fuelingRuleActions.js          # Redux actions
│   └── reducers/
│       └── fuelingRuleReducer.js          # Redux state
└── pages/
    └── ATG/
        └── fuelingprocess/
            └── Components/
                └── FuelingRulePopup.js    # UI component
```

### Mobile Structure

```
fms.mobile/src/
└── services/
    └── pumpControlService.js              # API integration
```

---

## Sequence Diagrams

### 1. Pump Authorization with Fueling Rules

```
┌─────────┐    ┌─────────┐    ┌────────────────────┐    ┌─────────────────────────┐    ┌────────┐
│  User   │    │  API    │    │PumpAuthorizeCommand│    │FuelingRuleEvaluationSvc │    │Database│
└────┬────┘    └────┬────┘    └─────────┬──────────┘    └────────────┬────────────┘    └────┬───┘
     │              │                    │                            │                      │
     │ POST /authorize                   │                            │                      │
     │──────────────>                    │                            │                      │
     │              │                    │                            │                      │
     │              │  Send Command      │                            │                      │
     │              │───────────────────>│                            │                      │
     │              │                    │                            │                      │
     │              │                    │ Build Context              │                      │
     │              │                    │───────────────────────────>│                      │
     │              │                    │                            │                      │
     │              │                    │                            │ Load Assignments     │
     │              │                    │                            │─────────────────────>│
     │              │                    │                            │                      │
     │              │                    │                            │<─────────────────────│
     │              │                    │                            │  Assignments         │
     │              │                    │                            │                      │
     │              │                    │                            │ Load Rule Sets       │
     │              │                    │                            │─────────────────────>│
     │              │                    │                            │                      │
     │              │                    │                            │<─────────────────────│
     │              │                    │                            │  Rule Sets           │
     │              │                    │                            │                      │
     │              │                    │                            │ Calculate Usage      │
     │              │                    │                            │─────────────────────>│
     │              │                    │                            │                      │
     │              │                    │                            │<─────────────────────│
     │              │                    │                            │  Daily/Monthly Usage │
     │              │                    │                            │                      │
     │              │                    │                            │ Merge & Calculate    │
     │              │                    │                            │ ─────────────────    │
     │              │                    │                            │                      │
     │              │                    │<───────────────────────────│                      │
     │              │                    │  FuelAllowanceResult       │                      │
     │              │                    │                            │                      │
     │              │                    │ Apply Limits to Dose       │                      │
     │              │                    │ ─────────────────────      │                      │
     │              │                    │                            │                      │
     │              │<───────────────────│                            │                      │
     │              │  Authorization     │                            │                      │
     │<─────────────│  Result            │                            │                      │
     │              │                    │                            │                      │
```

### 2. Fetching Effective Rules for Display

```
┌─────────┐    ┌─────────┐    ┌───────────────────────────┐    ┌─────────────────────────┐    ┌────────┐
│Frontend │    │  API    │    │GetEffectiveRulesForVehicle│    │FuelingRuleEvaluationSvc │    │Database│
└────┬────┘    └────┬────┘    └───────────┬───────────────┘    └────────────┬────────────┘    └────┬───┘
     │              │                      │                                 │                      │
     │ GET /vehicle/{id}/effective-rules   │                                 │                      │
     │──────────────>                      │                                 │                      │
     │              │                      │                                 │                      │
     │              │  Send Query          │                                 │                      │
     │              │─────────────────────>│                                 │                      │
     │              │                      │                                 │                      │
     │              │                      │ Get Vehicle Info               │                      │
     │              │                      │────────────────────────────────────────────────────────>
     │              │                      │                                 │                      │
     │              │                      │<────────────────────────────────────────────────────────
     │              │                      │                                 │                      │
     │              │                      │ Build Context & Calculate       │                      │
     │              │                      │────────────────────────────────>│                      │
     │              │                      │                                 │                      │
     │              │                      │                                 │ [Load & Merge Rules] │
     │              │                      │                                 │                      │
     │              │                      │<────────────────────────────────│                      │
     │              │                      │  FuelAllowanceResult            │                      │
     │              │                      │                                 │                      │
     │              │                      │ Map to EffectiveRulesDTO        │                      │
     │              │                      │ ─────────────────────────       │                      │
     │              │                      │                                 │                      │
     │              │<─────────────────────│                                 │                      │
     │              │  EffectiveRulesDTO   │                                 │                      │
     │<─────────────│                      │                                 │                      │
     │              │                      │                                 │                      │
```

### 3. Creating Rule Set Assignment

```
┌─────────┐    ┌─────────┐    ┌───────────────────────────┐    ┌────────┐
│Frontend │    │  API    │    │CreateRuleSetAssignmentCmd │    │Database│
└────┬────┘    └────┬────┘    └───────────┬───────────────┘    └────┬───┘
     │              │                      │                         │
     │ POST /assignments                   │                         │
     │ {ruleSetId, targetType, targetId}   │                         │
     │──────────────>                      │                         │
     │              │                      │                         │
     │              │  Send Command        │                         │
     │              │─────────────────────>│                         │
     │              │                      │                         │
     │              │                      │ Validate RuleSet exists │
     │              │                      │────────────────────────>│
     │              │                      │                         │
     │              │                      │<────────────────────────│
     │              │                      │                         │
     │              │                      │ Validate Target exists  │
     │              │                      │────────────────────────>│
     │              │                      │                         │
     │              │                      │<────────────────────────│
     │              │                      │                         │
     │              │                      │ Check no duplicate      │
     │              │                      │────────────────────────>│
     │              │                      │                         │
     │              │                      │<────────────────────────│
     │              │                      │                         │
     │              │                      │ Create Assignment       │
     │              │                      │────────────────────────>│
     │              │                      │                         │
     │              │                      │<────────────────────────│
     │              │                      │                         │
     │              │<─────────────────────│                         │
     │              │  AssignmentDTO       │                         │
     │<─────────────│                      │                         │
     │              │                      │                         │
```

---

## Implementation Details

### 1. FuelingRuleEvaluationService

The core service that handles cascade merging logic.

**Location**: `FMS.Application/Features/FuelTagManagement/FuelingRules/Services/FuelingRuleEvaluationService.cs`

```csharp
public interface IFuelingRuleEvaluationService
{
    /// <summary>
    /// Build context from vehicle, site, and tag information
    /// </summary>
    Task<FuelingContext> BuildContextAsync(
        int? vehicleId,
        int? siteId = null,
        int? tagId = null);

    /// <summary>
    /// Calculate fuel allowance using cascade hierarchy
    /// </summary>
    Task<FuelAllowanceResult> CalculateFuelAllowanceAsync(FuelingContext context);
}
```

**Key Methods**:

| Method                        | Description                                              |
| ----------------------------- | -------------------------------------------------------- |
| `BuildContextAsync`           | Creates FuelingContext with vehicle info and usage stats |
| `CalculateFuelAllowanceAsync` | Loads assignments, merges rules, calculates limits       |
| `LoadApplicableAssignments`   | Queries DB for all applicable rule set assignments       |
| `MergeRuleSets`               | Applies cascade priority to merge multiple rule sets     |

### 2. FuelAllowanceResult

The result of rule evaluation.

```csharp
public class FuelAllowanceResult
{
    public bool IsAllowed { get; set; }
    public decimal? MaxFuelAllowed { get; set; }
    public decimal? SoftLimit { get; set; }
    public decimal? HardLimit { get; set; }
    public decimal DailyLimit { get; set; }
    public decimal MonthlyLimit { get; set; }
    public decimal PerTransactionLimit { get; set; }
    public decimal DailyUsed { get; set; }
    public decimal MonthlyUsed { get; set; }
    public string Message { get; set; }
    public List<AppliedRuleSetInfo> AppliedRuleSets { get; set; }
}

public class AppliedRuleSetInfo
{
    public int RuleSetId { get; set; }
    public string RuleSetName { get; set; }
    public int TargetType { get; set; }  // 1=Site, 2=VehicleType, 3=Tag, 4=Vehicle
    public int? TargetId { get; set; }
    public string TargetName { get; set; }
    public int Priority { get; set; }
}
```

### 3. AssignmentTargetType Enum

```csharp
public enum AssignmentTargetType
{
    Site = 1,
    VehicleType = 2,
    Tag = 3,
    Vehicle = 4
}
```

**Frontend Equivalent** (`fuelingRuleActions.js`):

```javascript
export const AssignmentTargetType = {
  Site: 1,
  VehicleType: 2,
  Tag: 3,
  Vehicle: 4,
};
```

### 4. PumpAuthorizeCommand Integration

**Location**: `FMS.Application/Command/PTSCommand/PumpCommands/PumpAuthorizeCommand.cs`

```csharp
// In handler constructor
private readonly IFuelingRuleEvaluationService _fuelingRuleService;

// In Handle method
if (pumpAuthorize.VehicleId.HasValue)
{
    var context = await _fuelingRuleService.BuildContextAsync(
        pumpAuthorize.VehicleId.Value,
        pumpAuthorize.SiteId,
        tagId);

    var allowance = await _fuelingRuleService.CalculateFuelAllowanceAsync(context);

    if (!allowance.IsAllowed)
    {
        return FMSResponse<PumpAuthorizeConfirmation>.Failure(
            $"Fueling not allowed: {allowance.Message}",
            "FUELING_RULES_BLOCKED");
    }

    // Apply limit to requested dose
    if (allowance.MaxFuelAllowed.HasValue &&
        allowance.MaxFuelAllowed.Value < pumpAuthorize.Dose)
    {
        pumpAuthorize.Dose = (int)allowance.MaxFuelAllowed.Value;
    }
}
```

---

## API Reference

### Get Effective Rules for Vehicle

**Endpoint**: `GET /api/v1/FuelingRule/vehicle/{vehicleId}/effective-rules`

**Query Parameters**:
| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| vehicleId | int | Yes | Vehicle ID (path) |
| siteId | int | No | Site ID for site-level rules |
| tagId | int | No | Tag ID for tag-level rules |

**Response**:

```json
{
  "isSuccess": true,
  "data": {
    "vehicle": {
      "vehicleId": 123,
      "hyoungNo": "HYG-001",
      "vehicleTypeName": "Truck",
      "workingSiteName": "Main Depot"
    },
    "hasRules": true,
    "isAllowed": true,
    "maxFuelAllowed": 45.5,
    "dailyLimit": 100,
    "monthlyLimit": 2000,
    "perTransactionLimit": 50,
    "dailyUsed": 54.5,
    "monthlyUsed": 450.0,
    "appliedRuleSets": [
      {
        "ruleSetId": 1,
        "ruleSetName": "Site Default Rules",
        "targetType": 1,
        "targetName": "Main Depot",
        "priority": 10
      },
      {
        "ruleSetId": 5,
        "ruleSetName": "Truck Limits",
        "targetType": 2,
        "targetName": "Heavy Truck",
        "priority": 50
      },
      {
        "ruleSetId": 8,
        "ruleSetName": "Vehicle Override",
        "targetType": 4,
        "targetName": "HYG-001",
        "priority": 100
      }
    ]
  }
}
```

### Create Rule Set Assignment

**Endpoint**: `POST /api/v1/FuelingRule/assignments`

**Request Body**:

```json
{
  "ruleSetId": 5,
  "targetType": 2,
  "targetId": 10,
  "priority": 50,
  "isActive": true
}
```

**Target Types**:
| Value | Description |
|-------|-------------|
| 1 | Site |
| 2 | VehicleType |
| 3 | Tag |
| 4 | Vehicle |

---

## Frontend Integration

### Redux Actions

**File**: `fms.frontend/src/redux/actions/fuelingRuleActions.js`

```javascript
// Fetch effective rules for a vehicle
export const fetchEffectiveRulesForVehicle = (
  vehicleId,
  siteId = null,
  tagId = null
) => {
  return async (dispatch) => {
    dispatch({ type: FETCH_EFFECTIVE_RULES_REQUEST });
    try {
      let url = `/v1/FuelingRule/vehicle/${vehicleId}/effective-rules`;
      const params = [];
      if (siteId) params.push(`siteId=${siteId}`);
      if (tagId) params.push(`tagId=${tagId}`);
      if (params.length > 0) url += `?${params.join("&")}`;

      const response = await axiosInstance.get(url);
      const effectiveRules = response.data?.data || response.data;

      dispatch({
        type: FETCH_EFFECTIVE_RULES_SUCCESS,
        payload: { vehicleId, effectiveRules },
      });
      return effectiveRules;
    } catch (error) {
      dispatch({ type: FETCH_EFFECTIVE_RULES_FAILURE, payload: error.message });
      throw error;
    }
  };
};
```

### Redux State

```javascript
// fuelingRuleReducer.js
const initialState = {
  ruleSets: [],
  assignments: [],
  vehicleEffectiveRules: {}, // { [vehicleId]: effectiveRulesData }
  effectiveRulesLoading: false,
  loading: false,
  error: null,
};
```

### FuelingRulePopup Component

**File**: `fms.frontend/src/pages/ATG/fuelingprocess/Components/FuelingRulePopup.js`

Features:

- **Tabs**: "Effective Rules" and "Assign Rules"
- **Effective Rules Tab**:
  - Status summary (allowed/blocked)
  - Merged limits display
  - Usage statistics with progress bars
  - Applied rule sets with cascade hierarchy
- **Assign Rules Tab**:
  - Rule set selection
  - Preview of selected rule set

---

## Mobile App Integration

### pumpControlService.js

**File**: `fms.mobile/src/services/pumpControlService.js`

```javascript
/**
 * Get effective/merged fueling rules for a vehicle
 */
async getVehicleEffectiveRules(vehicleId, siteId = null, tagId = null) {
  let url = `/v1/FuelingRule/vehicle/${vehicleId}/effective-rules`;
  const params = [];
  if (siteId) params.push(`siteId=${siteId}`);
  if (tagId) params.push(`tagId=${tagId}`);
  if (params.length > 0) url += `?${params.join('&')}`;

  const response = await this.api.get(url);
  return response.data;
}

/**
 * Check if vehicle has fueling rules configured
 */
async checkVehicleFuelingRules(vehicleId, siteId = null, tagId = null) {
  const effectiveRules = await this.getVehicleEffectiveRules(vehicleId, siteId, tagId);

  return {
    hasRules: effectiveRules?.hasRules || false,
    isAllowed: effectiveRules?.isAllowed ?? true,
    maxFuelAllowed: effectiveRules?.maxFuelAllowed || null,
    dailyLimit: effectiveRules?.dailyLimit || 0,
    monthlyLimit: effectiveRules?.monthlyLimit || 0,
    appliedRuleSets: effectiveRules?.appliedRuleSets || []
  };
}
```

---

## Usage Examples

### Example 1: Organization-Wide Default with Vehicle Override

**Scenario**: Set a 100L daily limit for all vehicles at a site, but allow a specific truck 150L.

```http
# Step 1: Create a rule set for site default
POST /api/v1/FuelingRule/rulesets
{
  "name": "Site Default Limits",
  "description": "Default limits for all vehicles"
}

# Step 2: Add a daily limit rule
POST /api/v1/FuelingRule/rulesets/1/rules/daily-monthly
{
  "ruleName": "100L Daily Limit",
  "dailyLimit": 100,
  "monthlyLimit": 2000
}

# Step 3: Assign to site
POST /api/v1/FuelingRule/assignments
{
  "ruleSetId": 1,
  "targetType": 1,
  "targetId": 5,
  "priority": 10
}

# Step 4: Create override rule set
POST /api/v1/FuelingRule/rulesets
{
  "name": "Heavy Truck Override",
  "description": "Higher limit for heavy trucks"
}

# Step 5: Add higher limit rule
POST /api/v1/FuelingRule/rulesets/2/rules/daily-monthly
{
  "ruleName": "150L Daily Limit",
  "dailyLimit": 150,
  "monthlyLimit": 3000
}

# Step 6: Assign to specific vehicle
POST /api/v1/FuelingRule/assignments
{
  "ruleSetId": 2,
  "targetType": 4,
  "targetId": 123,
  "priority": 100
}
```

**Result**: Vehicle 123 gets 150L daily limit, all others get 100L.

### Example 2: Vehicle Type Based Rules

**Scenario**: Different limits for different vehicle types.

```http
# Light vehicles: 50L daily
POST /api/v1/FuelingRule/assignments
{
  "ruleSetId": 3,
  "targetType": 2,
  "targetId": 1,
  "priority": 50
}

# Heavy trucks: 200L daily
POST /api/v1/FuelingRule/assignments
{
  "ruleSetId": 4,
  "targetType": 2,
  "targetId": 2,
  "priority": 50
}
```

---

## Testing Guide

### Unit Testing the Cascade Logic

```csharp
[Fact]
public async Task CalculateFuelAllowance_VehicleLevelOverridesSiteLevel()
{
    // Arrange
    var siteRuleSet = new FuelingRuleSet { /* 100L daily limit */ };
    var vehicleRuleSet = new FuelingRuleSet { /* 150L daily limit */ };

    // Act
    var result = await _service.CalculateFuelAllowanceAsync(context);

    // Assert
    Assert.Equal(150, result.DailyLimit); // Vehicle level wins
    Assert.Equal(2, result.AppliedRuleSets.Count);
}
```

### Integration Testing

```bash
# Test effective rules endpoint
curl -X GET "http://localhost:7009/api/v1/FuelingRule/vehicle/123/effective-rules?siteId=5" \
  -H "Authorization: Bearer {token}"

# Expected: Returns merged rules from all applicable levels
```

### Frontend Testing

1. Open FuelingRulePopup for a vehicle
2. Check "Effective Rules" tab shows:
   - Correct merged limits
   - All applied rule sets in priority order
   - Usage statistics

---

## Dependency Injection Registration

**File**: `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs`

```csharp
// Fueling Rules Services
services.AddScoped<IFuelingRuleEvaluationService, FuelingRuleEvaluationService>();
```

---

## Troubleshooting

### Common Issues

| Issue                                             | Cause                             | Solution                                                     |
| ------------------------------------------------- | --------------------------------- | ------------------------------------------------------------ |
| "Unable to resolve IFuelingRuleEvaluationService" | Service not registered in DI      | Add to FmsServiceCollectionExtensions.cs                     |
| Rules not applying                                | Wrong targetType value            | Ensure frontend uses 1-indexed enum (Site=1, not 0)          |
| Higher priority not winning                       | Priority values not set correctly | Check priority: Site=10, VehicleType=50, Tag=80, Vehicle=100 |
| No rules found for vehicle                        | Missing assignments               | Create assignments linking rule sets to targets              |

### Debugging Tips

1. **Check applied rule sets**: Use the effective-rules endpoint to see which rule sets are being applied
2. **Verify enum values**: Frontend AssignmentTargetType must match backend (1-indexed)
3. **Check priorities**: Higher priority (100) overrides lower (10)
4. **Review logs**: PumpAuthorizeCommand logs fueling rule decisions

---

## Version History

| Version | Date       | Changes                                  |
| ------- | ---------- | ---------------------------------------- |
| 1.0     | 2026-01-05 | Initial cascade hierarchy implementation |

---

## Related Documentation

- [Fuel Rule Management System](readme.md) - Core rule types and structure
- [PTS Integration](../PTS/readme.md) - Pump authorization flow
- [Tag Management](../FuelTagManagement/readme.md) - Tag and vehicle association
