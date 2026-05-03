# PRD — FMS Multi-Device Platform

| Item          | Value                         |
| ------------- | ----------------------------- |
| Document type | Product Requirements Document |
| Domain        | devices                       |
| Feature       | multi-device-platform         |
| Version       | V1                            |
| Status        | Approved for implementation   |
| Last reviewed | 2026-05-03                    |

Implementation status snapshot as of 2026-05-03:

- Phase 0 complete.
- Phase 1 foundations implemented in code, with migration generation still handed off to the user.
- `ITenantScope` is now bridged onto `ITenantContext` in `FMS.WebClient` via `TenantContextScopeAdapter`.
- Tenant-filter repository tests were added under `FMS.Testing/Devices/`.
- Phase 2 tracking migration is structurally in place, with live GPSGate smoke still required.
- Phase 3 fueling migration is in progress: Technotrade PTS transport/protocol/channel folders exist under `FMS.Devices.Fueling`, inbound canonical mappers/handlers have a parallel slice for the main upload packets, and outbound PTS command execution now resolves through `TechnotradePtsCommandExecutor`.
- Legacy `MessageHandlerRegistry` / `PTSMessageProcessor` remain active until the remaining inbound packet types, UploadStatus behavior, and tests are cut over.

---

## 1. Problem

FMS supports two device families today — fueling (Technotrade PTS) and vehicle tracking (GPSGate). Each was built ad-hoc:

- PTS transport, protocol parsing, packet→business mapping, and Redis command channel are scattered across `FMS.Application/Communication`, `FMS.Application/Handlers`, `FMS.Application/Command/PTSCommand`, `FMS.Application/PTSServices`, `FMS.Application/Features/PTS{,Device,Service}`, plus `FMS.PTS.WindowsService`.
- GPSGate is split between `FMS.Infrastructure/ExternalServices/GPS/GPSGate` (26 files), `FMS.Infrastructure/VehicleTracking` (the correct seam), `FMS.Application/Communication/GPSGate`, and `FMS.BackgroundServices/VehicleTracking`. Hardcoded `provider.Name == "GPSGate"` checks exist in the WebClient.
- Three IoT scaffold projects (`FMS.IoT.{Contracts,Gateway,ProcessingEngine}`) existed but were never wired and had contract mismatches. **Deleted in Phase 0.**
- `ProviderConfigurationEntity` has no `TenantId`; provider credentials are global across tenants.
- Legacy ATG persistence schema support has been removed from this system.
- Onboarding new providers (GPSWox, future fueling vendors, real ATG hardware) requires touching 5+ projects.

---

## 2. Goals (V1)

1. Single canonical seam for device providers regardless of family.
2. Move device transport / protocol / mapping out of `FMS.Application` into per-vendor provider plugins.
3. Delete unused IoT scaffolding (`FMS.IoT.*`).
4. Tenant isolation at provider config + device mapping rows.
5. Two purpose-built Windows Service hosts: `FMS.Devices.Fueling.Host` and `FMS.Devices.Tracking.Host`.
6. Replace `[PacketType]` reflection registry with explicit DI-keyed mappers + MediatR notifications.
7. Prove the seam with a real second tracking provider (`GpsWoxProvider`).

---

## 3. Non-Goals (V1)

- Frontend rewrite of vehicle-tracking pages (only adds the device-provider admin page).
- Domain entity schema redesign beyond `TenantId`/`DeviceCategory` columns.
- Replacing MediatR or EF Core.
- Real ATG hardware integration.
- `TenantId` on `pts_devices`, `pumps`, `tanks` (handled by the parallel tier-1 tenancy migration).

---

## 4. Personas

| Persona           | Role                                                         |
| ----------------- | ------------------------------------------------------------ |
| Platform engineer | Adds new device providers (vendor plugin authors).           |
| Tenant admin      | Configures provider credentials, maps devices to providers.  |
| Field tech        | Installs PTS/ATG/GPS devices.                                |
| Support           | Diagnoses connection issues per provider via dedicated logs. |

---

## 5. Functional Requirements

### FR-1 Provider abstraction

Every external device or telemetry source is a Provider plugin: `IVehicleTrackingProvider`, `IFuelingDeviceProvider`, or `IFuelingPersistenceSink`. All decorated with `[Provider(name, DeviceCategory, version)]`. All carry `ProviderMetadata` and `ProviderCapabilities` flags so consumers branch on capabilities, not provider name.

### FR-2 Tenant isolation

- `provider_configurations.TenantId` (non-nullable `uuid`, FK to `tenants`).
- `device_provider_mappings.TenantId` (non-nullable `uuid`, FK to `tenants`).
- All reads go through `IProviderConfigRepository` / `IDeviceMappingRepository` which apply `WHERE TenantId = ITenantScope.TenantId` automatically.
- In `FMS.WebClient`, `ITenantScope` is bridged onto the existing `ITenantContext` per request.
- Cross-tenant access requires explicit `IBypassTenancy` (admin-only, audited).

### FR-3 Canonical message contract

Provider-specific shapes (`PTSMessage`, GPSGate JSON) are mapped to canonical `DeviceMessage<TPayload>` envelopes carrying `(TenantId, ProviderId, ExternalDeviceId, OccurredAtUtc, Payload)`. `DeviceMessageRouter` publishes a strongly-typed MediatR `INotification` per canonical type. Business logic in `FMS.Application/Features/Devices/...` consumes only canonical notifications.

### FR-4 Hosting separation

- `FMS.Devices.Fueling.Host` (Windows Service) — boots fueling providers + Redis command channel + WebSocket listener. Replaces `FMS.PTS.WindowsService`.
- `FMS.Devices.Tracking.Host` (Windows Service) — boots tracking providers + RabbitMQ consumer + provider health monitor.
- `FMS.WebClient` no longer hosts long-running device transports.

### FR-5 Provider lifecycle & health

- Auto-discovery via `[Provider]` attribute scan on host startup.
- Health check loop per provider, results persisted to `provider_health_history`.
- Surface health on `/admin/device-providers` page via `IProviderHealthMonitor`.

### FR-6 Provisioning UX

New admin page `/admin/device-providers`:

- List providers, status (active/disabled), category badge, last health check.
- Add/edit credentials per tenant (Settings JSON encrypted at rest).
- Map devices: vehicleId or fueling deviceId → providerConfigId + externalDeviceId + IMEI.
- Permissions: `_Read_DeviceProvider`, `_Manage_DeviceProvider`.
- M365 Fluent design (per `.agents/skills/design/SKILL.md`).

### FR-7 Logging

- `FmsLoggingConfiguration.cs` adds categories: `tracking-gpsgate/`, `tracking-gpswox/`, `fueling-pts/`, `fueling-atg/`.
- Fueling host: `C:\Logs\FMS.Devices.Fueling\` with current PTS retention (transactions/14d, errors/14d, others/7d).
- Tracking host: `C:\Logs\FMS.Devices.Tracking\` with subfolders `app/`, `errors/`, `provider-raw/`, `events/`, `health/`, `startup/`.
- All log entries include `({SourceContext})`.

---

## 6. Non-Functional Requirements

| ID    | Requirement                                                                                                                                                         |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| NFR-1 | New tracking provider = 1 new project folder + 1 `[Provider]`-decorated class + 1 DI registration line. No changes in `FMS.Application`.                            |
| NFR-2 | New PTS packet type = 1 mapper class + 1 keyed DI registration. No reflection.                                                                                      |
| NFR-3 | MySQL 5.5/5.6 compatible migrations (no `CURRENT_TIMESTAMP`, no `JSON` type).                                                                                       |
| NFR-4 | Zero downtime cutover for live PTS devices (dual-host parallel run).                                                                                                |
| NFR-5 | Provider conformance test suite passes for every `[Provider]`-decorated class.                                                                                      |
| NFR-6 | No hardcoded provider-name string comparisons in `FMS.Application` or `FMS.WebClient`.                                                                              |
| NFR-7 | `FMS.Application` does NOT reference `Microsoft.AspNetCore.WebSockets`, PTS-specific `StackExchange.Redis` bits, `IPTSDevice*`, or `IGPSGate*` interfaces directly. |

---

## 7. Architecture (target)

```
FMS.Devices.Abstractions/        contracts only
├── Common/                      DeviceCategory, ProviderAttribute, ProviderMetadata,
│                                ProviderCapabilities, DeviceMessage<T>, DeviceCommand<T>
├── Tracking/                    IVehicleTrackingProvider + capability interfaces
└── Fueling/                     IFuelingDeviceProvider, IFuelingPersistenceSink,
                                 canonical messages (PumpTransactionMessage, etc.)

FMS.Devices.Core/                runtime services
├── Registry/                    ProviderRegistry, ProviderFactory, [Provider] scanner
├── Routing/                     DeviceMessageRouter
├── Tenancy/                     TenantScopedProviderResolver, IBypassTenancy
├── Health/                      ProviderHealthMonitor
├── Repositories/                IProviderConfigRepository, IDeviceMappingRepository
└── DependencyInjection/         AddDeviceCore(), AddProviderRegistry()

FMS.Devices.Tracking/            tracking provider plugins
└── Providers/
    ├── GpsGate/                 Provider.cs, Api/, Configuration/, Services/, Channels/, Mapping/
    └── GpsWox/                  Provider.cs, Api/, ...

FMS.Devices.Tracking.Host/       worker process; AddDeviceCore().AddTrackingProviders()

FMS.Devices.Fueling/             fueling provider plugins
└── Providers/
    ├── TechnotradePts/          Provider.cs, Transport/, Protocol/, Mapping/, Commands/, Channels/

FMS.Devices.Fueling.Host/        Windows Service (replaces FMS.PTS.WindowsService)

FMS.Application/Features/Devices/
├── Provisioning/                provider config + device-mapping CRUD
├── Fueling/                     PumpTransactions, TankMeasurements, UploadStatus,
│                                Reconciliation, Alerts, PumpControl
└── Tracking/                    consumers of IVehicleTrackingProvider
```

---

## 8. Data Model Changes

### `provider_configurations`

- ADD `TenantId UUID NOT NULL` (FK to `tenants.Id`).
- ADD `DeviceCategory VARCHAR(40) NOT NULL` (`Fueling`, `Tracking`, `Atg`).
- Backfill: existing rows → `TenantId = '00000000-0000-0000-0000-000000000000'` (system tenant) until each tenant gets its own row.

### `vehicle_provider_mappings` → rename to `device_provider_mappings`

- ADD `TenantId UUID NOT NULL`.
- ADD `DeviceCategory VARCHAR(40) NOT NULL`.
- Existing column `VehicleId` becomes nullable.
- ADD `FuelingDeviceId INT NULL`.
- App-level XOR check: exactly one of `VehicleId` / `FuelingDeviceId` is set (MySQL 5.5/5.6 doesn't honor `CHECK`).

### Permissions (in `Permissions.cs`)

- `_Read_DeviceProvider`
- `_Manage_DeviceProvider`

### Navigation

- New entry "Device Providers" under Admin, route `/admin/device-providers`, permission `_Read_DeviceProvider`.

---

## 9. Migration Plan & Cutover

### Phase 0 — Demolish (1 sprint)

Delete `FMS.IoT.{Contracts,Gateway,ProcessingEngine}`. Verify build green. Verify zero `FMS.IoT.*` references.

### Phase 1 — Foundations (1 sprint)

Create `FMS.Devices.Abstractions` + `FMS.Devices.Core`. Move `IVehicleTrackingProvider` from `FMS.Infrastructure/VehicleTracking/Interfaces` (transitional shim, deferred after circular dependency review). Add `TenantId` + `DeviceCategory` columns + EF migration. Wire `ITenantScope` onto the existing `ITenantContext` in `FMS.WebClient` and cover repository tenant filtering with tests.

### Phase 2 — Tracking migration (1 sprint, depends on P1)

Create `FMS.Devices.Tracking` and add the `GpsWoxProvider` stub. Then move GPSGate code from `FMS.Infrastructure/ExternalServices/GPS/GPSGate/*` and `FMS.Infrastructure/VehicleTracking/Providers/*` into `Providers/GpsGate/`. Replace direct `IGPSGate*Service` injections with `IVehicleTrackingProvider` + capability checks. Fix hardcoded `Name == "GPSGate"` at `FMS.WebClient/Controllers/VehicleManagement/VehicleTrackingController.cs:480`. Stand up `FMS.Devices.Tracking.Host`.

### Phase 3 — Fueling abstraction (2 sprints, depends on P1)

Create `FMS.Devices.Fueling`. Move PTS transport from `FMS.PTS.WindowsService/Infrastructure/Communication/WebSocket/*`, `FMS.Application/Communication/{Connection,WebSocket,HttpPolling,Tracker}/*`, and protocol from `FMS.PTS.WindowsService/Core/Protocal/*` (fix typo) into `Providers/TechnotradePts/`. For each `[PacketType]` handler create one `IPtsPacketMapper<TPacket,TCanonical>`. Move business logic into MediatR notification handlers under `FMS.Application/Features/Devices/Fueling/`. Move outbound PTS command serialization/execution into `Providers/TechnotradePts/Commands/` behind `TechnotradePtsCommandExecutor`, while preserving `ICommandExecutor` as the temporary application-facing adapter. Delete `[PacketType]`, `MessageHandlerRegistry`, `PTSMessageProcessor` after canonical inbound cutover is proven.

### Phase 4 — Application consolidation (1 sprint, depends on P3)

Migrate `Features/PTS`, `Features/PTSDevice`, `Features/PTSService`, `PTSServices/*` into `Features/Devices/`. Delete originals. Add permissions + navigation. Build `/admin/device-providers` page (M365 Fluent).

### Phase 5 — Hosting split (1 sprint, depends on P3+P4)

Stand up `FMS.Devices.Fueling.Host` and `FMS.Devices.Tracking.Host`. Migrate `PTSLoggingConfiguration` to fueling host, rename log root to `C:\Logs\FMS.Devices.Fueling\`. Add tracking host logging at `C:\Logs\FMS.Devices.Tracking\`.

**Phase 3 / 5 cutover for live PTS devices: dual-host parallel run.**

- Existing `FMS.PTS.WindowsService` keeps prod port (`PTSServiceSettings.WebSocket.ListenPort`).
- New `FMS.Devices.Fueling.Host` listens on a staging port; writes to the same DB.
- Reconfigure devices one batch at a time. Monitor logs and reconciliation reports.
- Once 100% migrated, swap ports and decommission the old host.

### Phase 6 — Hardening & extension proof (1 sprint, depends on P5)

Implement real `GpsWoxProvider`. Build per-tenant provider config UI verification. Build provider conformance test suite under `FMS.Testing/Devices/`.

---

## 10. Risks & Mitigations

| Risk                                         | Mitigation                                                                                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Live PTS uploads break during transport move | Dual-host parallel run; per-device cutover; reversible by re-pointing devices.                                                                                              |
| Tenant filter introduces regressions         | Tenant filter at repository layer only; comprehensive query tests; system tenant `TenantId=00000000-0000-0000-0000-000000000000` retains current behavior during migration. |
| Mapper rewrite drops a packet type silently  | Conformance test enumerates all mappers and asserts coverage of every known `Packet.Type` from production samples.                                                          |
| Domain churn                                 | Domain-layer changes limited to two new columns + entity moves; each Domain change requires explicit user approval per `.github/copilot-instructions.md` §1.6.              |
| Logs land in wrong category                  | Phase 5 verification step grep-tests `({SourceContext})` and folder routing.                                                                                                |

---

## 11. Acceptance Criteria

### Phase 0

1. `dotnet build Tenacy.Fms.sln` succeeds with no broken references.
2. `grep -r "FMS.IoT" --include="*.cs" --include="*.csproj"` returns zero matches.

### Phase 1

1. `dotnet build` succeeds.
2. `FMS.Devices.Core` and `FMS.Devices.Abstractions` referenced by `FMS.Infrastructure` (transitional) and `FMS.WebClient` builds.
3. EF migration applies cleanly: new columns exist, no `CURRENT_TIMESTAMP` defaults, no `JSON` columns.
4. Tenant filter unit test: query with `ITenantScope.TenantId = <guid>` returns only matching-tenant rows, with the WebClient adapter delegating to `ITenantContext`.

### Phase 2

1. Existing GPSGate features (live location, geofence, sensor data) continue to work in QA.
2. Hardcoded check at `FMS.WebClient/Controllers/VehicleManagement/VehicleTrackingController.cs:480` is gone.
3. `IGPSGate*` services have zero direct injections in `FMS.Application`.
4. `GpsWoxProvider` stub registers; `IProviderRegistry.GetAll()` returns ≥2 entries.
5. `FMS.Devices.Tracking.Host` runs locally; RabbitMQ consumer processes a sample message end-to-end.

### Phase 3

1. PTS device test rig: UploadStatus + PumpTransaction + TankMeasurement packets arrive at canonical MediatR notifications.
2. `FMS.Application` has zero references to `Microsoft.AspNetCore.WebSockets` from PTS code paths.
3. `[PacketType]` and `MessageHandlerRegistry` are deleted (`grep` confirms).
4. New mappers each have a unit test against a real captured packet sample.
6. Outbound PTS commands (`PumpAuthorize`, `PumpGetStatus`, `PumpCloseTransaction`, `PumpGetTransactionInformation`, `PumpGetTag`, configuration, diagnostics, and probe calibration commands) are mapped by `FMS.Devices.Fueling/Providers/TechnotradePts/Commands/` and executed through `TechnotradePtsCommandExecutor` in both WebClient and the PTS service.

### Phase 4

1. `FMS.Application/PTSServices/` folder is gone.
2. `FMS.Application/Features/PTS{,Device,Service}/` folders are gone.
3. `FMS.Application` references `FMS.Domain.PTSCommon` only via the fueling provider boundary.
4. End-to-end UI smoke: pump authorize → device executes → DB update → SignalR push.
5. Permissions `_Read_DeviceProvider`, `_Manage_DeviceProvider` exist; navigation entry visible to authorized roles.

### Phase 5

1. `FMS.Devices.Fueling.Host` runs as a Windows Service; logs at `C:\Logs\FMS.Devices.Fueling\` with `({SourceContext})` populated.
2. `FMS.PTS.WindowsService` removed from both `.sln` files; folder deleted.
3. `FMS.Devices.Tracking.Host` logs at `C:\Logs\FMS.Devices.Tracking\`.

### Phase 6

1. `GpsWoxProvider` end-to-end: location + sensor data flow.
2. Per-tenant provider config UI: switching tenants shows only that tenant's rows.
3. Conformance suite enforces: every `[Provider]` class registers, exposes metadata, has ≥1 capability, applies tenant filter.

---

## 12. Out of Scope

- Frontend rewrite of vehicle-tracking pages (only adds the new admin UI in Phase 4).
- Domain entity schema redesign beyond `TenantId` and `DeviceCategory` columns.
- Replacing MediatR or EF Core.
- Real ATG hardware protocol.
- `TenantId` on `pts_devices`, `pumps`, `tanks` etc. — handled by the existing tier-1 tenancy migration.

---

## 13. Open Questions

1. **Migration strategy during Phase 3 cutover.** Recommended: dual-host parallel run (Option A). Alternatives: feature flag inside the existing PTS host (Option B), hard cutover at maintenance window (Option C — high blast radius).
2. **Should `FMS.Domain.PTSCommon` move into the fueling provider?** It carries `PTSMessage`, `Packet`, `RedisPTSCommand` — wire-format types that belong with the provider. Domain is sacred; recommendation is to file a follow-up after consumer audit.
3. **Should SignalR hubs (`PTSHub`, `FrontEndHub`) move into `FMS.Devices.*`?** Cross-cutting UI/realtime concerns invoked from many places. Recommendation: leave in `FMS.Application/Communication/SignalR` for this plan; revisit after abstraction work surfaces clearer seams.

---

## 14. Appendix

### A. Provider author cookbook (10 steps)

See `.agents/skills/devices/SKILL.md` §3 and `FMS.Devices.Abstractions/README.md` (created in T6.4).

### B. Conformance test catalogue

Produced in T6.3 under `FMS.Testing/Devices/`.

### C. Permission & navigation seed SQL

Produced in T4.7 + T4.9.
