# Fueling Rules Quick Reference

## At a Glance

### Cascade Priority (Higher Wins)

```
Vehicle (100) > Tag (80) > VehicleType (50) > Site (10)
```

### AssignmentTargetType Enum (1-indexed!)

| Value | Name        | Priority |
| ----- | ----------- | -------- |
| 1     | Site        | 10       |
| 2     | VehicleType | 50       |
| 3     | Tag         | 80       |
| 4     | Vehicle     | 100      |

---

## Quick API Examples

### Get Effective Rules

```bash
GET /api/v1/FuelingRule/vehicle/{vehicleId}/effective-rules?siteId=5&tagId=10
```

### Create Assignment

```bash
POST /api/v1/FuelingRule/assignments
{
  "ruleSetId": 1,
  "targetType": 4,  // 4 = Vehicle
  "targetId": 123,
  "priority": 100,
  "isActive": true
}
```

---

## Key Files

| Component             | Location                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| Evaluation Service    | `FMS.Application/Features/FuelTagManagement/FuelingRules/Services/FuelingRuleEvaluationService.cs`    |
| Effective Rules Query | `FMS.Application/Features/FuelTagManagement/FuelingRules/Queries/GetEffectiveRulesForVehicleQuery.cs` |
| API Controller        | `FMS.WebClient/Controllers/FuelManagement/FuelingRuleController.cs`                                   |
| DI Registration       | `FMS.WebClient/Extensions/FmsServiceCollectionExtensions.cs`                                          |
| Frontend Actions      | `fms.frontend/src/redux/actions/fuelingRuleActions.js`                                                |
| Frontend Reducer      | `fms.frontend/src/redux/reducers/fuelingRuleReducer.js`                                               |
| Popup Component       | `fms.frontend/src/pages/ATG/fuelingprocess/Components/FuelingRulePopup.js`                            |
| Mobile Service        | `fms.mobile/src/services/pumpControlService.js`                                                       |

---

## Common Code Patterns

### Backend - Use Service in Command

```csharp
private readonly IFuelingRuleEvaluationService _fuelingRuleService;

public async Task<FMSResponse<T>> Handle(MyCommand request)
{
    var context = await _fuelingRuleService.BuildContextAsync(vehicleId, siteId, tagId);
    var allowance = await _fuelingRuleService.CalculateFuelAllowanceAsync(context);

    if (!allowance.IsAllowed)
        return FMSResponse<T>.Failure(allowance.Message);
}
```

### Frontend - Dispatch Effective Rules

```javascript
import { fetchEffectiveRulesForVehicle } from "../redux/actions/fuelingRuleActions";

const loadRules = async () => {
  const rules = await dispatch(
    fetchEffectiveRulesForVehicle(vehicleId, siteId, tagId)
  );
  console.log("Max allowed:", rules.maxFuelAllowed);
};
```

### Mobile - Check Rules

```javascript
const { isAllowed, maxFuelAllowed } =
  await pumpControlService.checkVehicleFuelingRules(vehicleId, siteId, tagId);
```

---

## Troubleshooting Checklist

- [ ] DI Registration: Is `IFuelingRuleEvaluationService` registered in `FmsServiceCollectionExtensions.cs`?
- [ ] Enum Values: Is frontend using 1-indexed values (Site=1, not 0)?
- [ ] Assignments: Are rule sets assigned to the correct target type and ID?
- [ ] Priority: Are priorities set correctly (Vehicle=100 should override Site=10)?

---

## See Also

- [Full Implementation Guide](CASCADE_HIERARCHY_IMPLEMENTATION.md)
- [Rule Types Reference](readme.md#rule-types)
