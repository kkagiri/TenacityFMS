# Tasks — FMS Multi-Device Platform V1

> Tracks implementation of the [PRD](./PRD.md). Anchors `🧪 X.Y` reference PRD §11.X.Y acceptance criteria.

Legend: `[ ]` open · `[x]` done · ⛓ depends-on · 🧪 verification anchor

---

## Phase 0 — Demolish (1 sprint)

- [x] **T0.1** Remove `FMS.IoT.Contracts/Gateway/ProcessingEngine` from `Tenacy.Fms.sln` and `Hyoung.Fms.sln`. 🧪 0.1
- [x] **T0.2** Delete the three folders from disk. 🧪 0.1
- [x] **T0.3** Delete any `Class1.cs` template stubs that referenced the IoT projects.
- [x] **T0.4** `dotnet build Tenacy.Fms.sln` — green. (Validated via `FMS.WebClient.csproj` build — 0 errors.)
- [x] **T0.5** `grep -r "FMS.IoT" --include="*.cs" --include="*.csproj"` returns empty. 🧪 0.1

---

## Phase 1 — Foundations (1 sprint)

- [x] **T1.1** Create `FMS.Devices.Abstractions` project (TFM `net8.0`). Add to both `.sln` files. _MediatR 12.5.0 added for `INotification` base._
- [x] **T1.2** Create `FMS.Devices.Core` project. References Abstractions + Persistence + Domain.
- [x] **T1.3** Define `DeviceCategory` enum, `ProviderAttribute`, `ProviderMetadata`, `ProviderCapabilities` flags, `DeviceMessage<T>`, `DeviceCommand<T>`, `DeviceCommandResult` in Abstractions/Common. Also added `ITenantScope`, `IDeviceProvider`, `IDeviceTransport`, `IDeviceCommandChannel`, `ITrackingProviderMarker`. ⛓ T1.1
- [x] **T1.4** Move `IVehicleTrackingProvider` + capability interfaces from `FMS.Infrastructure/VehicleTracking/Interfaces` → `FMS.Devices.Abstractions/Tracking`. Add transitional namespace shim. ⛓ T1.1 — added provider-neutral `FMS.Devices.Abstractions/Tracking/IVehicleTrackingProvider.cs` plus canonical tracking models in `TrackingModels.cs`; `ITrackingProviderMarker` now aliases the canonical contract. `GpsGateDeviceProvider` now adapts the existing GPSGate runtime provider to canonical tracking results, and GpsWox implements the canonical stub contract. Legacy `FMS.Infrastructure.VehicleTracking.Interfaces.IVehicleTrackingProvider` remains only as a compatibility shim for existing Application DTO callers.
- [x] **T1.5** Define `IFuelingDeviceProvider`, `IFuelingPersistenceSink`, capability interfaces, canonical messages (`PumpTransactionMessage`, `TankMeasurementMessage`, `UploadStatusMessage`, `AlertRecordMessage`) in `FMS.Devices.Abstractions/Fueling`. Also added MediatR notifications. ⛓ T1.1
- [x] **T1.6** Implement `ProviderRegistry`, `ProviderFactory`, `DeviceMessageRouter`, `ProviderHealthMonitor` in `FMS.Devices.Core`. _`TenantScopedProviderResolver` folded into `ProviderFactory` + `ProviderConfigRepository` (tenant filter is automatic at the repo layer). Provider DI registration now uses collection-safe `AddSingleton<IDeviceProvider, ...>()` for tracking and fueling providers so the registry can see multiple plugins._ ⛓ T1.2, T1.4
- [x] **T1.7** Implement `IProviderConfigRepository` + `IDeviceMappingRepository` with auto tenant filter via `ITenantScope`. ⛓ T1.2
- [x] **T1.8** Add `TenantId` (Guid) and `DeviceCategory` (string, default `"Tracking"`) columns to `ProviderConfigurationEntity`. EF entity-config updated; unique index now `(TenantId, Name)`; added `(TenantId, DeviceCategory, IsEnabled)` index. **Migration generation handed off to user.** 🧪 1.3
- [x] **T1.9** Rename `VehicleProviderMappingEntity` → `DeviceProviderMappingEntity`. Completed after explicit Domain-layer approval; DbContext registration now exposes `DeviceProviderMappings` while existing vehicle-facing query/DTO names remain for API compatibility.
  - [x] **T1.9a** Additive columns applied: `TenantId` (Guid), `DeviceCategory` (string), `FuelingDeviceId` (int?). `VehicleId` widened to `int?`. EF entity-config updated; new tenant-scoped indexes added. Downstream consumers patched for nullable `VehicleId` (FuelAudit, Dashboard, VehicleProviderMappingDTO, ProviderConfigurationService, GPSGateLocationService, GPSGateRabbitMQConsumerService). **Migration generation handed off to user.** 🧪 1.3
  - [x] **T1.9b** Class rename `VehicleProviderMappingEntity` → `DeviceProviderMappingEntity` — atomic step at the end of Phase 2. _Updated repository interfaces, provider services, GPSGate services, WebClient controller usage, tests, and EF configuration type references._
- [x] **T1.10** Move provider entities from `FMS.Domain/Entities/VehicleTracking` → `FMS.Domain/Entities/Devices`. Update `GpsdataContext` registrations. ⛓ T1.8, T1.9 — completed after explicit Domain-layer approval on 2026-05-03. _Provider entity namespaces now use `FMS.Domain.Entities.Devices`; EF provider configurations moved to `FMS.Persistence/EntityConfigurations/Devices`; `GpsdataContext` imports `EntityConfigurations.Devices` and registers `DeviceProviderMappingEntityConfiguration`._
- [x] **T1.11** Tenant filter unit test implemented at `FMS.Testing/Devices/ProviderConfigRepositoryTenantFilterTests.cs`: repository reads return only the active tenant's rows; add/update paths are covered too. 🧪 1.4 _Targeted execution is currently blocked by an unrelated pre-existing compile error in `FMS.Testing/IntegrationTests/AutoTransactionCompletionServiceManualCloseTests.cs` (`IServiceScopeFactory` missing)._
- [x] **T1.12** `AddDeviceCore()` DI extension in `FMS.Devices.Core/DependencyInjection`. ⛓ T1.6
- [ ] **T1.13** **HANDOFF — User action required**: run `dotnet ef migrations add AddDevicesTenancyCategoryAndDomainMove --project FMS.Persistence --startup-project FMS.WebClient`, review the generated rename/move operations, then `dotnet ef database update`. New columns default to `tenant_id = '00000000-0000-0000-0000-000000000000'` (system tenant) and `device_category = 'Tracking'` so existing GPS rows back-fill automatically. Domain type rename/move is code-only; verify EF does not attempt to drop/recreate existing provider tables.
- [x] **T1.14** Wire `ITenantScope` adapter in `FMS.WebClient` startup that delegates to `ITenantContext`. Implemented via `FMS.WebClient/Extensions/TenantContextScopeAdapter.cs` and registered in `FmsServiceCollectionExtensions.AddFmsCore()`. (Required before any device-provider plugin can be resolved per-tenant in the request pipeline.)

---

## Phase 2 — Tracking provider migration (1 sprint, depends on Phase 1)

- [x] **T2.1** Create `FMS.Devices.Tracking` project; added to both `.sln` files and builds cleanly. ⛓ T1.5
- [x] **T2.2** Move `FMS.Infrastructure/VehicleTracking/Providers/GPSGateProvider.cs` → `FMS.Devices.Tracking/Providers/GpsGate/GPSGateProvider.cs`. Namespace updated to `FMS.Devices.Tracking.Providers.GpsGate`; `FMS.WebClient` now references `FMS.Devices.Tracking` and legacy provider discovery loads the `FMS.Devices.Tracking` assembly explicitly. _T1.4 follow-up completed: `GpsGateDeviceProvider` exposes GPSGate through the canonical tracking provider contract while the legacy provider remains for existing DTO callers._
- [x] **T2.3** Move `FMS.Infrastructure/ExternalServices/GPS/GPSGate/*` (26 files) → `FMS.Devices.Tracking/Providers/GpsGate/Api/`. Old namespaces are preserved temporarily so existing consumers continue compiling while the provider boundary is migrated.
- [x] **T2.4** Move `FMS.Application/Communication/GPSGate/RabbitMQ/*` contracts out of Application. RabbitMQ payload/live vehicle models now live in `FMS.Devices.Abstractions/Tracking/Messages/` under `FMS.Devices.Abstractions.Tracking.Messages`.
- [x] **T2.5** Move `FMS.BackgroundServices/VehicleTracking/GPSGateRabbitMQConsumerService.cs` → `FMS.Devices.Tracking/Providers/GpsGate/Channels/GPSGateRabbitMQConsumerService.cs`. Namespace updated to `FMS.Devices.Tracking.Providers.GpsGate.Channels`.
- [x] **T2.6** Replace direct `IGPSGate*Service` injections in FuelAudit, Vehicle, FusionReporting, FuelTagManagement features. ⛓ T2.2 — scoped grep across those feature folders returns no `IGPSGate*Service`/`IGpsGate*Service` injections. Vehicle create/update/site-auto-assignment flows now depend on provider-neutral `ITrackingDriverNameService` and `ITrackingTagTransferService`; GPSGate implementations/adapters are registered behind those contracts. T1.4 now provides canonical `IVehicleTrackingProvider` routing through `GpsGateDeviceProvider`.
- [x] **T2.7** Fix hardcoded `m.ProviderConfiguration.Name == "GPSGate"` at [FMS.WebClient/Controllers/VehicleManagement/VehicleTrackingController.cs](FMS.WebClient/Controllers/VehicleManagement/VehicleTrackingController.cs#L480). It now filters on `DeviceCategory.Tracking` instead of provider name. 🧪 2.2
- [x] **T2.8** Sweep for remaining `Name == "GPSGate"` or `IGPSGate*` injections solution-wide; remediate. 🧪 2.3 — repeated GPSGate provider-name predicates were removed from the moved tracking provider and dashboard distance aggregation. GPSGate provider key is centralized in `GpsGateProviderConstants.Name`; dashboard aggregation filters by `DeviceCategory.Tracking`. Application/WebClient consumers now use neutral `ITrackingDriverNameService`, `ITrackingTagTransferService`, `ITrackingGeofenceService`, `ITrackingReportService`, `ITrackingDirectoryService`, `ITrackingTrackInfoSummaryService`, `ITrackingViewsService`, and `ITrackingTracksService`. Remaining `IGPSGate*` hits are provider-internal dependencies, compatibility shim interfaces/registrations, or commented legacy code.
- [x] **T2.9** Create `FMS.Devices.Tracking/Providers/GpsWox/GpsWoxProvider.cs` stub. Registered as `[Provider("GpsWox", DeviceCategory.Tracking, "0.1.0-stub")]`; capabilities = `None`; `IsHealthyAsync()` returns `false` until T6.1. 🧪 2.4
- [x] **T2.10** Create `FMS.Devices.Tracking.Host` worker project. Wire `AddDeviceCore() + AddTrackingProviders()` + RabbitMQ. 🧪 2.5 — added `FMS.Devices.Tracking.Host`, registered it in both solution files, added `FMS.Devices.Tracking.DependencyInjection.AddTrackingProviders()`, and wired the host to `GpsdataContext`, `ITenantScope`, SignalR, device core, tracking providers, and the GPSGate RabbitMQ consumer. Build validated with 0 errors.
- [ ] **T2.11** QA: vehicle live location, geofence, sensor data still work for GPSGate-mapped vehicles. 🧪 2.1 — **STATIC QA COMPLETE / LIVE SMOKE PENDING**: `FMS.WebClient` and `FMS.Devices.Tracking.Host` build with 0 errors after the provider-neutral interface changes. Verified compile-time wiring for live location broadcasts (`VehicleTrackingHub` + `GPSGateRabbitMQConsumerService`), geofence commands via `ITrackingGeofenceService`, and sensor/fuel-level endpoints via `ITrackingTracksService`. Full live confirmation still requires a configured database, enabled GPSGate provider row, RabbitMQ settings, and GPSGate-mapped vehicle data.

---

## Phase 3 — Fueling abstraction (2 sprints, depends on Phase 1)

**Progress snapshot (2026-05-03):** Foundation moves for the fueling provider boundary are in place (`FMS.Devices.Fueling`, Technotrade PTS transport/protocol/channel folders, and provider shell). The canonical packet pipeline now runs as a sidecar for the main inbound upload packets after the legacy `IPacketHandler` path has processed and ACKed them; old processing remains intact until rich UploadStatus pump/probe behavior and tests are cut over. Outbound command mapping/execution has moved behind the Technotrade provider boundary through `TechnotradePtsCommandExecutor`, while the legacy Application command files remain as transitional references until final cleanup.

- [x] **T3.1** Create `FMS.Devices.Fueling` project. ⛓ T1.5 — added `FMS.Devices.Fueling`, registered it in both solution files, added `AddFuelingProviders()`, and created provider shell for `TechnotradePTS`. Build validated with 0 errors. Destination folders now exist for `Providers/TechnotradePts/{Transport,Protocol,Mapping,Commands,Channels}`.
- [x] **T3.2** Move `FMS.PTS.WindowsService/Infrastructure/Communication/WebSocket/*` → `Providers/TechnotradePts/Transport/`. _`PTSWebSocketListenerService` relocated to `FMS.Devices.Fueling.Providers.TechnotradePts.Transport`. Tightly-coupled config types (`PTSServiceSettings`, `ReconnectionSettings`, `AuthenticationMode`) moved into `FMS.Devices.Fueling.Providers.TechnotradePts.Configuration` so the host project depends on the provider (correct long-term direction for Phase 5). `FMS.PTS.WindowsService.csproj` now references `FMS.Devices.Fueling`. `Program.cs`, `PTSAuthenticationHandler.cs`, and `PTSLoggingConfiguration.cs` updated for new namespaces (incl. log-routing SourceContext override). Empty `Infrastructure/Communication/WebSocket/` and `Core/Configuration/` folders removed. Both `FMS.PTS.WindowsService` and `FMS.WebClient` build with 0 errors._
- [ ] **T3.3** Move `FMS.Application/Communication/{Connection,WebSocket,HttpPolling,Tracker}/*` → `Providers/TechnotradePts/Transport/`. — **PARTIAL / TRANSITIONAL REMAINS**: the WebSocket listener moved in T3.2, but the rest of the transport surface is still entangled with `FMS.Application` runtime services (`DirectHttpTransactionService`, `TransactionMonitoringService`, `TransactionCompletionService`, `OrphanedTransactionCleanupService`) and WebClient DI registrations that compile directly against `DeviceConnectionTracker`, `IDeviceHttpCommandPusher`, `IPTSConnectionManager`, `IPendingCommandRepository`, and tracker models. Completing this task cleanly requires first splitting provider-owned implementations from Application-owned contracts/models or moving those Application services into `Features/Devices/Fueling`.
- [x] **T3.4** Move + rename `FMS.PTS.WindowsService/Core/Protocal/*` → `Providers/TechnotradePts/Protocol/`. Fix typo `Protocal`→`Protocol` in type names too. _Authentication + validation types moved to `FMS.Devices.Fueling/Providers/TechnotradePts/Protocol/{Authentication,Validation}`. Validator types were renamed `IPTSProtocalValidator` → `IPTSProtocolValidator` and `PTSProtocalValidator` → `PTSProtocolValidator`. Old Windows Service copies were deleted. Narrow error check on the moved files passed._
- [x] **T3.5** Move PTS Redis bits (`FMS.PTS.WindowsService/Infrastructure/Communication/RedisMessageHandling/*` + PTS-specific bits of `FMS.Application/Communication/Redis/*`) → `Providers/TechnotradePts/Channels/`. _Moved `RedisPTSCommandProcessor`, `RedisPTSCommandProcessorHostedService`, and the PTS command-path `RedisCommandService` into `FMS.Devices.Fueling/Providers/TechnotradePts/Channels/`. Transitional namespaces were preserved so existing WebClient and Windows Service consumers did not need broad call-site churn. `FMS.WebClient.csproj` now references `FMS.Devices.Fueling`. Generic Redis abstractions and policy-trigger services remain in `FMS.Application/Communication/Redis` because they are not PTS-specific._
- [ ] **T3.6** For each `[PacketType]` handler in `FMS.Application/Handlers/{UploadTransactions,PumpResponse}`, create one `IPtsPacketMapper<TPacket,TCanonical>` in `Providers/TechnotradePts/Mapping/`. Mapper produces canonical message + publishes MediatR `INotification`. — **PARTIAL / LIVE SIDECAR WIRED**: added `IPtsPacketMapper`, `TechnotradePtsPacketMappingService`, and mappers for `UploadPumpTransaction`, `UploadTankMeasurement`, `UploadStatus`, and `UploadAlertRecord` under `FMS.Devices.Fueling/Providers/TechnotradePts/Mapping/`. `PTSMessageProcessor` now invokes registered `ICanonicalPtsPacketProcessor` instances after the legacy handler succeeds, so the device ACK path remains unchanged. Remaining work: pump response packet mappers, UploadStatus parity, and final replacement cutover.
- [ ] **T3.7** Move business logic from each old handler into a notification handler in `FMS.Application/Features/Devices/Fueling/{PumpTransactions,TankMeasurements,UploadStatus,Alerts}/Notifications/`. — **PARTIAL / SAFE PARALLEL SLICE**: added canonical handlers for pump transactions, tank measurements, upload status, and alerts. Pump/tank handlers delegate to existing commands; alert handler stores `PTSAlertRecord`; upload-status handler logs canonical heartbeat only because the current canonical payload does not yet carry the full pump/probe status graph used by the legacy `UploadStatusCommand`.
- [ ] **T3.8** Delete `[PacketType]` attribute, `MessageHandlerRegistry`, `PTSMessageProcessor`. 🧪 3.3 — **BLOCKED BY REPLACEMENT CUTOVER**: legacy processor and registry still exist intentionally so existing WebSocket/HTTP device processing continues while the canonical path runs as a sidecar.
- [ ] **T3.9** Move PTS command serializers from `FMS.Application/Command/PTSCommand/{ProbeCommands,PumpCommands,SystemCommands,TankCommands,UploadStatusCommands}/` → `Providers/TechnotradePts/Commands/`. Business orchestration → `Features/Devices/Fueling/PumpControl/`. — **PARTIAL / PROVIDER EXECUTOR ACTIVE**: provider-owned command mapping now exists under `FMS.Devices.Fueling/Providers/TechnotradePts/Commands/` (`IPtsCommandMapper`, command mapper implementations, `TechnotradePtsCommandMappingService`, `TechnotradePtsCommandExecutor`). WebClient and PTS Windows Service register `TechnotradePtsCommandExecutor` for `ICommandExecutor`. Remaining work: retire or relocate the legacy `FMS.Application/Command/PTSCommand/*` command serializer files once all call sites are confirmed on the provider executor.
- [x] **T3.10** Remove unused external ATG persistence sink scope. — **REMOVED 2026-05-03**: deleted the unused provider shell and related registration; this system will use Technotrade PTS fueling only.
- [x] **T3.11** Remove unused external ATG entity schema from Domain. — **REMOVED 2026-05-03**: deleted the obsolete entity folder and project folder hint after confirming it is not used by this system.
- [x] **T3.12** Fix ATG namespace mismatch: DTOs in `FMS.Application/ModelsDTOs/PTS/*` declared in `FMS.Application.Features.ATG`. Either move physically to match or rename namespace. _Aligned DTO namespaces to the physical tree: `FMS.Application.ModelsDTOs.PTS` and `FMS.Application.ModelsDTOs.PTS.Common`. Updated all current consumer `using` directives. Narrow error check on the DTOs and highest-risk consumers passed._
- [ ] **T3.13** Mapper unit tests against captured packet samples (one test per packet type). 🧪 3.4 — **READY FOR FIRST SLICE**: mapper classes now exist for the main inbound upload packet types; captured sample tests still need to be added.
- [x] **T3.14** External ATG persistence integration test. 🧪 3.5 — **REMOVED FROM SCOPE 2026-05-03**: external ATG persistence is not used in this system.
- [ ] **T3.15** End-to-end test rig: PTS device connects → canonical notifications fire → DB updated. 🧪 3.1 — **READY FOR SIDECAR SMOKE / FINAL TESTS PENDING**: outbound command execution is provider-backed and the live inbound processor invokes the mapper service as a sidecar. Remaining verification needs a configured PTS device path, mapper sample tests, UploadStatus parity, and the final replacement cutover.

---

## Phase 4 — Application consolidation (1 sprint, depends on Phase 3)

- [x] **T4.1** Create `FMS.Application/Features/Devices/{Provisioning,Fueling,Tracking}/` skeleton. _Created the `FMS.Application/Features/Devices/Provisioning`, `Fueling`, and `Tracking` directories as compliant destination folders for subsequent consolidation tasks._
- [ ] **T4.2** Migrate surviving business logic from `Features/PTS` → `Features/Devices/Fueling/UploadStatus`.
- [ ] **T4.3** Migrate `Features/PTSDevice` → `Features/Devices/Provisioning` (device CRUD).
- [ ] **T4.4** Migrate `Features/PTSService` → `Features/Devices/Fueling/{PumpControl,Reconciliation}`.
- [ ] **T4.5** Migrate `FMS.Application/PTSServices/*` → `Features/Devices/Fueling/{Services,PumpControl}`. Delete root `PTSServices/` folder. 🧪 4.1
- [ ] **T4.6** Delete `Features/PTS/`, `Features/PTSDevice/`, `Features/PTSService/`. 🧪 4.2
- [ ] **T4.7** Add permissions `_Read_DeviceProvider`, `_Manage_DeviceProvider` in `Permissions.cs`. 🧪 4.5
- [ ] **T4.8** Build admin page `/admin/device-providers` (Fluent M365 design — `m365-section-group`, `m365-input`, `m365-btn`). List, add, edit, map devices. ⛓ T4.7
- [ ] **T4.9** Add navigation seed entry: route `/admin/device-providers`, permission `_Read_DeviceProvider`.
- [ ] **T4.10** Verify zero `FMS.Domain.PTSCommon` `using` directives in `FMS.Application/*.cs` outside the fueling provider boundary. 🧪 4.3
- [ ] **T4.11** UI smoke: pump authorize → device executes → DB update → SignalR push to dashboard. 🧪 4.4

---

## Phase 5 — Hosting split (1 sprint, depends on Phase 3 & 4)

- [ ] **T5.1** Create `FMS.Devices.Fueling.Host` worker project; copy `Program.cs` from `FMS.PTS.WindowsService` and trim to `services.AddDeviceCore().AddFuelingProviders()`.
- [ ] **T5.2** Migrate `FMS.PTS.WindowsService/Infrastructure/Logging/PTSLoggingConfiguration.cs` to the new host. Rename log roots `C:\Logs\FMS.PTS\` → `C:\Logs\FMS.Devices.Fueling\`. Update category folder names per `.github/copilot-instructions.md` §6 retentions. 🧪 5.1
- [ ] **T5.3** Migrate `Scripts/Install-Service.ps1`, `Uninstall-Service.ps1`. New service name `FMS.Devices.Fueling`.
- [ ] **T5.4** Add matching logging config to `FMS.Devices.Tracking.Host` at `C:\Logs\FMS.Devices.Tracking\` with subfolders `app/`, `errors/`, `provider-raw/`, `events/`, `health/`, `startup/`. 🧪 5.3
- [ ] **T5.5** Dual-host parallel run cutover for live PTS: new host on staging port; devices migrated batch-by-batch; monitor logs + reconciliation. ⛓ T3.15
- [ ] **T5.6** After 100% device cutover + 1-week soak: remove `FMS.PTS.WindowsService` from both `.sln` files; delete folder. 🧪 5.2

---

## Phase 6 — Hardening & extension proof (1 sprint, depends on Phase 5)

- [ ] **T6.1** Implement real `GpsWoxProvider` end-to-end: location + sensor capabilities. 🧪 6.1
- [ ] **T6.2** Per-tenant provider config UI verification: switch tenants → only that tenant's rows visible. 🧪 6.2
- [ ] **T6.3** Provider conformance test suite in `FMS.Testing/Devices/`: every `[Provider]` class must (a) register, (b) expose metadata, (c) declare ≥1 capability, (d) apply tenant filter via repository. 🧪 6.3
- [ ] **T6.4** Author provider cookbook in `FMS.Devices.Abstractions/README.md` (10-step "add a new provider" guide). Cross-link from `.agents/skills/devices/SKILL.md`.
- [ ] **T6.5** Update PRD §13 Open Questions with resolutions or follow-up tickets.

---

## Cross-cutting tasks

- [x] **TX.1** Update `.github/copilot-instructions.md` with new §13 "Devices Architecture (Multi-Provider Platform)".
- [x] **TX.2** Update `.github/instructions/System.instructions.md` mirror.
- [ ] **TX.3** Update `.agent/rules/systemnow.md` mirror (Cursor/Windsurf agents) — _only if file exists in repo_.
- [x] **TX.4** Create `.agents/skills/devices/SKILL.md`.
- [x] **TX.5** Create `.claude/skills/devices/SKILL.md`.
- [ ] **TX.6** Add system configuration keys (`Devices.Fueling.WebSocketListenPort`, `Devices.Tracking.RabbitMQUri`, `Devices.HealthCheckIntervalSeconds`) to `systemconfigurations` table.
