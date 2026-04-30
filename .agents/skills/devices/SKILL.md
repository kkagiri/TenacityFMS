---
name: devices
description: FMS multi-device provider architecture. Use when adding/modifying device integrations, vendor plugins, or device transport/protocol/channel code for fueling (PTS, ATG) or vehicle tracking (GPSGate, GPSWox). Keywords - device, provider, IoT, PTS, ATG, GPSGate, GPSWox, fueling, tracking, telemetry, websocket, packet, mapper, tenant.
---

# FMS Devices — Multi-Provider Platform Skill

> Use this skill **before** touching any code under `FMS.Devices.*`, `FMS.Application/Features/Devices/`, `FMS.Application/Communication/*`, `FMS.Application/Handlers/*`, `FMS.Infrastructure/ExternalServices/GPS/*`, or `FMS.PTS.WindowsService`.
> Authoritative source: `.github/copilot-instructions.md` §13 + `documentation/features/devices/multi-device-platform/V1/implementation/PRD.md`.

## 1. Mental model

```
Device hardware  ─►  Provider plugin  ─►  Canonical MediatR notification
(PTS, GPSGate)       (FMS.Devices.*)       │
                                            ▼
                                FMS.Application/Features/Devices/...
```

Every external device family is a **Provider plugin**. Provider plugins translate vendor-specific shapes into **canonical** `DeviceMessage<T>` envelopes and publish strongly-typed MediatR notifications. Application features consume only canonical notifications.

## 2. Project map

```
FMS.Devices.Abstractions/   contracts only
FMS.Devices.Core/           registry, factory, router, repositories
FMS.Devices.Tracking/       Providers/{GpsGate,GpsWox,…}/
FMS.Devices.Tracking.Host/  worker process
FMS.Devices.Fueling/        Providers/{TechnotradePts,NaftaAtg,…}/
FMS.Devices.Fueling.Host/   Windows Service (replaces FMS.PTS.WindowsService)

FMS.Application/Features/Devices/
  ├── Provisioning/   provider config + device-mapping CRUD
  ├── Fueling/        PumpTransactions, TankMeasurements, UploadStatus, Reconciliation, Alerts, PumpControl
  └── Tracking/       consumers of IVehicleTrackingProvider
```

## 3. Decision tree

**"Add a new vehicle tracking integration"**
→ `FMS.Devices.Tracking/Providers/<Vendor>/<Vendor>Provider.cs` implementing `IVehicleTrackingProvider`. `[Provider]` attribute. Done.

**"Add a new fueling device integration"**
→ `FMS.Devices.Fueling/Providers/<Vendor>/<Vendor>Provider.cs` implementing `IFuelingDeviceProvider`. Add `Transport/`, `Protocol/`, `Mapping/`, `Commands/`, `Channels/` subfolders.

**"Add support for a new PTS packet type"**
→ ONE class: `Mapping/<PacketName>Mapper.cs` implementing `IPtsPacketMapper<TPacket,TCanonical>`. Register in `TechnotradePtsServiceCollectionExtensions` with `services.AddKeyedSingleton<IPtsPacketMapper>("<PacketTypeString>", typeof(<PacketName>Mapper))`. Add notification handler in `FMS.Application/Features/Devices/Fueling/<Domain>/Notifications/`.

**"Where does business logic for a pump transaction go?"**
→ `FMS.Application/Features/Devices/Fueling/PumpTransactions/Notifications/PumpTransactionReceivedHandler.cs` implementing `INotificationHandler<PumpTransactionReceivedNotification>`. Never in the provider plugin.

**"Where does a vendor-specific API client go?"**
→ `FMS.Devices.Tracking/Providers/<Vendor>/Api/<Vendor>ApiClient.cs`. Never in `FMS.Infrastructure`.

**"Should this code live in `FMS.Application`?"**
→ NO if it imports `Microsoft.AspNetCore.WebSockets`, parses a wire format, talks to a device's REST API, or holds vendor credentials. Move to a provider plugin.
→ YES if it consumes a canonical MediatR notification or implements vendor-independent business rules — place in `Features/Devices/...`.

## 4. Anti-patterns — STOP if you see these

| Anti-pattern | Replacement |
|---|---|
| `[PacketType("UploadStatus")]` attribute | `IPtsPacketMapper<TPacket,TCanonical>` + DI keyed registration |
| `MessageHandlerRegistry.GetHandler(...)` | `DeviceMessageRouter` + MediatR `IPublisher.Publish(notification)` |
| `provider.Name == "GPSGate"` | `provider.Capabilities.HasFlag(ProviderCapabilities.<X>)` |
| `IGPSGateLocationService` injected outside the GpsGate provider | `IVehicleTrackingProvider` resolved via `IProviderFactory.GetForVehicleAsync(vehicleId)` |
| WebSocket / Redis / RabbitMQ in `FMS.Application` | Provider plugin (`Transport/`, `Channels/`) |
| `_context.ProviderConfigurations.Where(...)` | `IProviderConfigRepository` (tenant filter automatic) |
| New code in `FMS.IoT.{Contracts,Gateway,ProcessingEngine}` | Those projects are DELETED — use `FMS.Devices.*` |
| New code in `FMS.PTS.WindowsService` | Replaced by `FMS.Devices.Fueling.Host` after Phase 5 |

## 5. Tenancy contract

- Every provider config row: `TenantId NOT NULL`.
- Every device→provider mapping row: `TenantId NOT NULL`.
- Repositories apply `WHERE TenantId = ITenantContext.TenantId`.
- Cross-tenant access requires `IBypassTenancy` (admin-only, audited).

## 6. Provider conformance — every `[Provider]` class must

1. Be `sealed`, registered as `Singleton`.
2. Carry `[Provider("<UniqueName>", DeviceCategory.<X>, Version="<semver>")]`.
3. Expose `ProviderMetadata` and `ProviderCapabilities`.
4. Implement only supported capabilities; throw `NotSupportedException` from unimplemented ones.
5. Read credentials via `IProviderConfigRepository.GetForCurrentTenantAsync(name)`.
6. Route all vendor calls through a single `<Vendor>ApiClient` for testability.
7. Have ≥1 conformance test in `FMS.Testing/Devices/<Vendor>/`.

## 7. Logging

| Provider type | Log root | Subfolder |
|---|---|---|
| Tracking | `C:\Logs\FMS.Devices.Tracking\` | `tracking-<vendor>/` |
| Fueling | `C:\Logs\FMS.Devices.Fueling\` | `fueling-<vendor>/` |

Categories defined via `SourceContext` namespace match. Always `ILogger<T>`. Always `({SourceContext})` in the template.

## 8. References

- §13 of `.github/copilot-instructions.md` (canonical rules)
- PRD: `documentation/features/devices/multi-device-platform/V1/implementation/PRD.md`
- Tasks: `documentation/features/devices/multi-device-platform/V1/implementation/TASKS.md`
- Provider cookbook: `FMS.Devices.Abstractions/README.md`
- Existing similar pattern: `FMS.Devices.Tracking/Providers/GpsGate/`
