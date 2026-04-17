# Excessive Idling Future Implementation Note

## Current State

- Excessive idling is currently driven by one global configuration key: `WarningLetter:IdlingThresholdHours`.
- In code, if that configuration is missing or invalid, the fallback default is `2.0` hours.
- Candidate selection is currently `Vehicleconsumption.EngHours > idlingThreshold`.
- The current excessive-idling rule is not vehicle-specific and not vehicle-type-specific.
- The current warning-letter settings surface does not expose any idling threshold or idling cost editor.
- The current editable warning-letter settings only cover:
  - Fuel price per litre
  - Issuer name
  - Issuer title
  - Maximum warning count before last warning

## How Idling Data Is Determined Today

- The warning-letter candidate queries use `Vehicleconsumption.EngHours` as the actual idling-hours value.
- For excessive idling:
  - Expected value = configured `WarningLetter:IdlingThresholdHours`
  - Actual value = `Vehicleconsumption.EngHours`
  - Excess value = `Actual - Expected`, bounded at zero
- This means the current system compares every vehicle against the same global hours threshold.
- There is no current logic that checks vehicle consumption mode (`km/l` vs `l/hr`) when evaluating excessive idling.

## Related Consumption-Type Context

- The broader consumption model already distinguishes vehicles by consumption mode:
  - `km/l` for distance-based vehicles
  - `l/hr` for engine-hour-based vehicles
- That distinction is already used in fuel-efficiency calculations elsewhere, but it is not yet used to price or classify excessive idling.

## Requested Future Behaviour

The requested excessive-idling rules should be implemented separately from the current global idling threshold flow.

### Threshold Rules

- Default excessive-idling minimum should be `8` hours for vehicles generally.
- The following vehicle types should use a lower excessive-idling minimum of `5` hours:
  - `SDR`
  - `PR`
  - `DTR`
  - `PV`

### Cost Rules

- Excessive idling should support cost rules by vehicle consumption type.
- The costing logic should distinguish vehicles that operate as:
  - `km/l`
  - `l/hr`
- Idling cost should not reuse the excess-fuel `FuelPricePerLitre` rule directly without a separate idling model.
- A separate excessive-idling cost model is needed so the system can price idling correctly for different vehicle/equipment categories.

## Product Gap

- There is currently no admin page, warning-letter settings field, or system-configuration editor for:
  - Default idling threshold
  - Vehicle-type-specific idling thresholds
  - Consumption-type-specific idling cost rules
  - Exception vehicle types such as `SDR`, `PR`, `DTR`, `PV`

## Recommended Implementation Scope

This should be delivered as a separate excessive-idling enhancement, not mixed into the existing excess-fuel settings flow.

### Suggested Backend Additions

- Add dedicated configuration storage for excessive-idling rules.
- Support:
  - Global default threshold
  - Vehicle-type overrides
  - Cost model by consumption type (`km/l` vs `l/hr`)
- Update excessive-idling candidate queries to resolve threshold in this order:
  1. Vehicle-type override
  2. Global default
- Update summary/report formatting to show the threshold source used.

### Suggested Admin UI Additions

- Add a dedicated excessive-idling settings section/page.
- Allow editing:
  - Default threshold hours
  - Vehicle-type threshold overrides
  - Cost rate model for `km/l` vehicles
  - Cost rate model for `l/hr` vehicles

## Open Design Questions

- Should the 5-hour rule apply by vehicle type abbreviation, by vehicle type Id, or by a configurable lookup table?
- Should idling cost be stored as:
  - cost per excess hour, or
  - derived fuel value based on consumption type?
- For `km/l` vehicles, should idling cost be based on an assumed idle fuel burn rate rather than distance efficiency?
- Should the threshold/cost logic be historical by date, or always use the latest rule?

## References

- Current candidate selection: `FMS.Application/Features/WarningLetter/Queries/GetWarningLetterConsumptionCandidatesQuery.cs`
- Current report selection: `FMS.Application/Features/WarningLetter/Queries/GetWarningLetterCandidatesReportQuery.cs`
- Current warning-letter settings DTO: `FMS.Application/Features/WarningLetter/DTOs/WarningLetterSettingsDto.cs`
- Current warning-letter settings update command: `FMS.Application/Features/WarningLetter/Commands/UpdateWarningLetterSettingsCommand.cs`
- Current warning-letter settings UI: `fms.frontend/src/pages/vehicles/warningLetters/WarningLetterSettingsPanelContent.js`