# Task List: Unified Alert Configuration System

## Status Legend: ⬜ Todo | 🟡 In Progress | ✅ Done

---

## Backend — Core Infrastructure

- [x] 1. `AlertConfigurationConstants.cs` — Alert type registry (all types, params, defaults, groups)
- [x] 2. `IAlertConfigurationService.cs` — Interface
- [x] 3. `AlertConfigurationService.cs` — Cached service with typed getters
- [x] 4. `AlertConfigurationDto.cs` — DTOs for single alert type config
- [x] 5. `AlertTypeGroupDto.cs` — Grouped response DTO
- [x] 6. Add DB key constants to `SystemConfiguration.cs`

## Backend — CQRS (Queries)

- [x] 7. `GetAlertConfigurationsQuery.cs` — Query record
- [x] 8. `GetAlertConfigurationsQueryHandler.cs` — Returns grouped alert configs
- [x] 9. `GetAlertConfigurationByTypeQuery.cs` — Query record
- [x] 10. `GetAlertConfigurationByTypeQueryHandler.cs` — Returns single alert type config

## Backend — CQRS (Commands)

- [x] 11. `UpdateAlertConfigurationCommand.cs` — Update thresholds
- [x] 12. `UpdateAlertConfigurationCommandHandler.cs` — Handler
- [x] 13. `ToggleAlertCommand.cs` — Enable/disable
- [x] 14. `ToggleAlertCommandHandler.cs` — Handler
- [x] 15. `ResetAlertDefaultsCommand.cs` — Reset to factory
- [x] 16. `ResetAlertDefaultsCommandHandler.cs` — Handler
- [x] 17. `SeedAlertConfigurationCommand.cs` — Seed all defaults
- [x] 18. `SeedAlertConfigurationCommandHandler.cs` — Handler

## Backend — API & DI

- [x] 19. `AlertConfigurationController.cs` — API endpoints
- [x] 20. Register `IAlertConfigurationService` in DI

## Backend — Refactor Hardcoded Values

- [x] 21. `ClosingStockCommand.cs` — Inject service, replace thresholds
- [x] 22. `AlarmHandlerService.cs` — Replace legacy thresholds
- [x] 23. `ActiveAlarmService.cs` — Replace escalation thresholds
- [x] 24. `VehicleMaintenanceNotifierService.cs` — Replace thresholds

## Frontend

- [x] 25. `alertConfigurationApi.js` — API service
- [x] 26. `AlertConfiguration.js` — Main management page
- [x] 27. `AlertConfiguration.scss` — Styles
- [x] 28. `AlertTypeCard.js` — Individual alert type card component
- [x] 29. Update `navigationHelper.js` — Add route
- [x] 30. Update `NotificationLayout.js` — Add tab
- [x] 31. Update `index.js` (NotificationSystem) — Add route case
