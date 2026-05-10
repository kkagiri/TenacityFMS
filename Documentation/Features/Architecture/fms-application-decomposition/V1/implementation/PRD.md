# PRD — `packages/FMS.Application` Decomposition

**Status:** Draft · **Version:** V1 · **Owner:** Architecture · **Type:** Implementation

---

## 1. Background

`packages/FMS.Application` has grown into a god-package with ~1,290 files and ~45 MB of source. It currently mixes three concerns into one assembly:

1. **Business workflows** (CQRS Features — the legitimate Application layer)
2. **Transport / protocol code** (Communication, PTSServices, Handlers, Command/PTSCommand)
3. **Infrastructure** (Authorization, ErrorHandling, DistCacheTracker, hosted services, JWT, Redis, WCF)

It also pulls vendor-specific NuGets (WCF, Docnet, ZXing, ClosedXML, QRCoder, Google.Apis.Auth, StackExchange.Redis, NLog) that have no business in a Clean Architecture Application layer, and uses a `<Compile Include="..\FMS.Devices.Fueling\...\RedisCommandService.cs" />` cross-project source-file hack to avoid a circular project reference.

A previous refactor (`RefactoringGuide.md`, `RefactoringExecutionGuide.md`) was started but never completed, leaving parallel old (`Command/`, `Queries/`, `Handlers/`, `ModelsDTOs/`, `MappingProfile/`) and new (`Features/`) structures.

## 2. Goals

| #   | Goal                                                                                                                                      |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| G1  | Restore Clean Architecture: Application layer owns only use cases (CQRS handlers, DTOs, validators, mapping profiles, abstractions).      |
| G2  | Move all device transport/protocol code into `FMS.Devices.Fueling` / `FMS.Devices.Tracking` per `copilot-instructions.md` §13.            |
| G3  | Move all infrastructure concerns (Redis, JWT, NLog, hosted services, WCF, file/PDF/QR generation) out of Application.                     |
| G4  | Eliminate the `<Compile Include>` cross-project hack.                                                                                     |
| G5  | Finish the abandoned 2024 refactor — collapse legacy `Command/` `Queries/` `Handlers/` `ModelsDTOs/` into `Features/{Domain}/`.           |
| G6  | Reduce `FMS.Application` NuGet surface to: `MediatR`, `AutoMapper`, `FluentValidation`, `Microsoft.Extensions.{Logging,DI}.Abstractions`. |

## 3. Non-Goals

- Splitting `Features/TankManagement`, `Features/Notification`, `Features/IssueTracker`, `Features/Dashboard` into separate packages. (Recorded as a future option, not in scope here.)
- Modifying `FMS.Domain` (sacred per `copilot-instructions.md` §1.6).
- Changing public HTTP API surface, JWT claims, permission keys, or database schema.
- Rewriting MySQL queries or migrating to a newer MySQL version.
- Frontend changes.

## 4. Out of Scope (Explicitly Deferred)

- Carving Sales-style sub-packages (e.g., `FMS.Application.TankManagement`) — revisit after Phase 7.
- Replacing AutoMapper, MediatR, or FluentValidation.
- Removing `FMS.Persistence` direct usage from feature handlers (separate repository-pattern initiative).

## 5. Stakeholders & Consumers

| Consumer                             | Impact                                                                                                  |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------- |
| `apps/FMS.WebClient`                 | Will gain new project references (`FMS.Reporting`, refactored Infrastructure). DI registration updates. |
| `services/FMS.BackgroundServices`    | Will receive moved hosted services.                                                                     |
| `services/FMS.PTS.WindowsService`    | Will lose direct PTS code paths (now in `FMS.Devices.Fueling`).                                         |
| `services/FMS.Devices.Tracking.Host` | Gains GPSGate provider code.                                                                            |
| `tests/FMS.Testing`                  | Namespaces and `InternalsVisibleTo` updates.                                                            |
| Frontend apps                        | None — public API contract preserved.                                                                   |

## 6. Current-State Inventory (as audited)

| Folder in `FMS.Application`                            | File Count | Decision                                                                                                                                     |
| ------------------------------------------------------ | ---------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `Features/`                                            | 967        | KEEP. Domain CQRS lives here.                                                                                                                |
| `Queries/`                                             | 42         | MERGE into `Features/{Domain}/Queries/`.                                                                                                     |
| `ModelsDTOs/`                                          | 42         | MERGE into `Features/{Domain}/DTOs/`.                                                                                                        |
| `Communication/`                                       | 36         | MOVE → `FMS.Devices.Fueling` (WS/HTTP/Redis), `FMS.Devices.Tracking` (Tracker/GPSGate), `FMS.Infrastructure` (SignalR).                      |
| `Command/`                                             | 35         | MERGE into `Features/{Domain}/Commands/`; `Command/PTSCommand/` → `FMS.Devices.Fueling`.                                                     |
| `Handlers/`                                            | 28         | `PacketHandlers/`, `PumpResponse/`, `UploadTransactions/` → `FMS.Devices.Fueling`. `DatabaseHandlers/`, `TankStock/` → `Features/{Domain}/`. |
| `MappingProfile/`                                      | 19         | KEEP, but move per-feature profiles into `Features/{Domain}/Mapping/`.                                                                       |
| `Services/`                                            | 14         | `*HostedService.cs` → `FMS.BackgroundServices`. Rest evaluated case-by-case.                                                                 |
| `Infrastructure/`                                      | 14         | MOVE → `FMS.Infrastructure` (Authorization, ErrorHandling, DistCacheTracker, Exceptions, Services).                                          |
| `Common/`                                              | 10         | KEEP `FMSResponse`, common interfaces. PTS message types → `FMS.Devices.Fueling`.                                                            |
| `CommonInterface/`                                     | 8          | EVALUATE — interfaces stay; implementations move.                                                                                            |
| `PTSServices/`                                         | 8          | MOVE → `FMS.Devices.Fueling/Providers/Technotrade/`.                                                                                         |
| `Core/`                                                | 5          | KEEP.                                                                                                                                        |
| `Validation/`                                          | 5          | MERGE into `Features/{Domain}/Validators/`.                                                                                                  |
| `Configuration/`                                       | 3          | EVALUATE — startup-time config → `FMS.WebClient`/host.                                                                                       |
| `Util/`, `Helpers/`, `Extensions/`, `Events/`, `Dtos/` | 12         | KEEP if cross-cutting; otherwise move per-feature.                                                                                           |

## 7. Target Architecture

```
packages/
├── FMS.Application                (slimmed)
│   ├── Features/<Domain>/{Commands,Queries,DTOs,Services,Validators,Mapping}
│   ├── Common/                     ← FMSResponse, MediatR pipeline behaviors
│   ├── Abstractions/               ← interfaces only (no impls)
│   └── Events/                     ← integration event contracts
│   NuGet: MediatR, AutoMapper, FluentValidation, MS.Extensions.*.Abstractions
│
├── FMS.Reporting                  (NEW)
│   └── ClosedXML, Docnet.Core, QRCoder, ZXing.Net
│       Excel/PDF/QR/Barcode generation services
│
├── FMS.Infrastructure             (expanded)
│   ├── Authorization/              ← from Application/Infrastructure/Authorization
│   ├── ErrorHandling/              ← from Application/Infrastructure/ErrorHandling
│   ├── DistCacheTracker/           ← from Application/Infrastructure/DistCacheTracker
│   ├── Identity/                   ← Google.Apis.Auth, JWT
│   ├── Communication/SignalR/      ← from Application/Communication/SignalR
│   └── Logging/                    ← NLog config
│
├── FMS.Devices.Fueling            (expanded)
│   └── Providers/Technotrade/
│       ├── Transport/              ← from Application/Communication/{WebSocket,Redis,HttpPolling,Connection}
│       ├── Protocol/               ← from Application/Handlers/PacketHandlers
│       ├── Commands/               ← from Application/Command/PTSCommand
│       ├── Services/               ← from Application/PTSServices
│       └── Features/               ← absorbs Application/Features/{PTS,PTSDevice,PTSService,Devices}
│   (Removes the <Compile Include> hack)
│
└── FMS.Devices.Tracking           (expanded)
    ├── Providers/GpsGate/          ← from Application/Communication/GPSGate, Features/GPSGate
    └── Providers/<Vendor>/         ← from Features/VehicleTracking transport bits

services/
└── FMS.BackgroundServices         (expanded)
    ← AutoTransactionCompletionService
    ← DatabaseSeedingHostedService
    ← DeviceActivityMonitorService
    ← StaleConnectionDetectionService
```

## 8. Phased Plan (low-risk → high-risk)

| Phase | Scope                                                                                                  | Risk   | Reversible?                   |
| ----- | ------------------------------------------------------------------------------------------------------ | ------ | ----------------------------- |
| P1    | Remove `<Compile Include>` hack; move file properly.                                                   | Low    | Yes                           |
| P2    | Extract `FMS.Reporting` (ClosedXML/Docnet/QRCoder/ZXing).                                              | Low    | Yes                           |
| P3    | Move `*HostedService.cs` to `FMS.BackgroundServices`.                                                  | Low    | Yes                           |
| P4    | Move `Application/Infrastructure/*` into `FMS.Infrastructure`.                                         | Medium | Yes (namespace updates)       |
| P5    | Move fueling transport/protocol/commands into `FMS.Devices.Fueling`.                                   | High   | Partial — touches PTS runtime |
| P6    | Move GPSGate/VehicleTracking transport into `FMS.Devices.Tracking`.                                    | High   | Partial                       |
| P7    | Collapse legacy `Command/`, `Queries/`, `Handlers/Database*`, `ModelsDTOs/` into `Features/{Domain}/`. | High   | Yes (mechanical)              |
| P8    | Remove obsolete NuGets from `FMS.Application.csproj`; verify slimmed surface.                          | Low    | Yes                           |

**Each phase MUST end with a green build of `Tenacy.Fms.sln` and a passing run of `tests/FMS.Testing` before the next phase begins.**

## 9. Acceptance Criteria

- [ ] `packages/FMS.Application/FMS.Application.csproj` references **only**: `MediatR`, `AutoMapper`, `FluentValidation`, `Microsoft.Extensions.Logging.Abstractions`, `Microsoft.Extensions.DependencyInjection.Abstractions`.
- [ ] No `<Compile Include="..\..\..\*" />` in `FMS.Application.csproj`.
- [ ] No `IHostedService` implementations in `packages/FMS.Application/Services/`.
- [ ] `packages/FMS.Application/Communication/`, `PTSServices/`, `Handlers/PacketHandlers/`, `Handlers/PumpResponse/`, `Handlers/UploadTransactions/`, `Command/PTSCommand/` folders removed.
- [ ] `packages/FMS.Application/Infrastructure/` folder removed.
- [ ] `packages/FMS.Application/Command/`, `Queries/`, `ModelsDTOs/`, `Validation/`, `MappingProfile/` either removed or reduced to genuinely cross-cutting items; per-feature contents under `Features/{Domain}/`.
- [ ] `Features/{PTS, PTSDevice, PTSService, Devices, GPSGate}` removed from `FMS.Application` (relocated to device packages).
- [ ] `Tenacy.Fms.sln` builds with 0 errors; warning count not increased.
- [ ] All existing `tests/FMS.Testing` tests pass.
- [ ] No public HTTP route / DTO contract change.
- [ ] No new entries to `FMS.Domain`.
- [ ] No new MySQL migrations introduced by this work.

## 10. Risks & Mitigations

| Risk                                                                                                                              | Mitigation                                                                                                                                              |
| --------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Breaking PTS runtime during P5                                                                                                    | Stage P5 behind a branch; keep service registration in DI extension methods; smoke-test PTS Windows Service before merge.                               |
| Reintroducing the Application↔Infrastructure cycle (the commented-out `<ProjectReference>` in `.csproj` shows it happened before) | Infrastructure depends on Application **abstractions only**; move interfaces to `FMS.Application.Abstractions` namespace before moving implementations. |
| AutoMapper profile discovery loss                                                                                                 | Register profiles via assembly scan in each host's DI extension; verify all profile assemblies are loaded.                                              |
| `InternalsVisibleTo("FMS.Testing")` breakage                                                                                      | Maintain attribute on every package that previously had it; update test references.                                                                     |
| Hidden reflection / string-typed lookups (e.g., `[PacketType]`)                                                                   | Already deleted per devices skill; if found during P5, replace with keyed DI mappers.                                                                   |
| Cross-feature tight coupling inside `Features/PTS*`                                                                               | Resolve before move: extract canonical events into `FMS.Application.Abstractions.Events`.                                                               |

## 11. Rollout

- One PR per phase.
- Each PR title: `refactor(application): P{n} — {phase title}`.
- Feature-flag not required (compile-time refactor only).
- Post-merge: monitor `C:\Logs\FMS.Webclient\errors\` and PTS service logs for 48 h.

## 12. References

- [project-context-ascii.md](../../project-dependencies/V1/implementation/project-context-ascii.md)
- [project-dependency-context.mmd](../../project-dependencies/V1/implementation/project-dependency-context.mmd)
- `packages/FMS.Application/RefactoringGuide.md`
- `packages/FMS.Application/RefactoringExecutionGuide.md`
- `.github/copilot-instructions.md` §1.6 (Domain sacred), §1.9 (CQRS), §13 (Devices Architecture)
- `.agents/skills/devices/SKILL.md`
