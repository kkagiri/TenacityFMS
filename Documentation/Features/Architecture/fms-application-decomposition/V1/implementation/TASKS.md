# Tasks — `packages/FMS.Application` Decomposition

**Companion to:** [PRD.md](./PRD.md) · **Version:** V1

Each phase ends with: `dotnet build Tenacy.Fms.sln` ✅ + `dotnet test tests/FMS.Testing` ✅. Do **not** start the next phase until both are green.

---

## Phase 1 — Remove cross-project `<Compile Include>` hack

**Goal:** Eliminate the source-file include of `RedisCommandService.cs` from `FMS.Devices.Fueling` into `FMS.Application`.

- [x] T1.1 Identify all consumers of `Communication\Redis\RedisCommandService` inside `FMS.Application`.
- [x] T1.2 Decide owner: file already physically lives in `FMS.Devices.Fueling/Providers/TechnotradePts/Channels/`. Confirm that is its rightful home.
- [x] T1.3 If `FMS.Application` consumers exist, extract an interface (`IRedisCommandService`) into `FMS.Devices.Abstractions` (or `FMS.Application.Abstractions` if non-device).
- [x] T1.4 Replace `<Compile Include="..\FMS.Devices.Fueling\Providers\TechnotradePts\Channels\RedisCommandService.cs" Link="..." />` in `FMS.Application.csproj` with:
  - the abstraction reference (no implementation in Application), or
  - a proper `ProjectReference` if the dependency direction is acceptable.
- [x] T1.5 Update DI registrations in `FMS.WebClient/Program.cs` and `FMS.PTS.WindowsService/Program.cs`.
- [ ] T1.6 Build + test.

Current Phase 1 status: code changes are in place; the explicit build/test gate in T1.6 is still pending.

**Done when:** `FMS.Application.csproj` contains no `<Compile Include="..\..\*" />` items.

---

## Phase 2 — Extract `FMS.Reporting` package

**Goal:** Move document/spreadsheet/QR/barcode generation out of Application.

- [x] T2.1 Create `packages/FMS.Reporting/FMS.Reporting.csproj` (net8.0).
- [x] T2.2 Add NuGets: `ClosedXML 0.102.3`, `Docnet.Core 2.6.0`, `QRCoder 1.8.0`, `ZXing.Net 0.16.10`.
- [x] T2.3 Reference `FMS.Application` (for FMSResponse) and `FMS.Domain` (for entity types referenced by reports).
- [x] T2.4 Identify all classes in `FMS.Application` using these libraries (search: `ClosedXML`, `Docnet`, `QRCoder`, `ZXing`).
- [x] T2.5 Move those classes (Excel exports, PDF processors, QR/barcode generators) into `FMS.Reporting/Services/` with their interfaces in `FMS.Reporting.Abstractions/` (or `FMS.Application.Abstractions`).
- [x] T2.6 Add abstractions consumed by Application handlers (`IExcelExportService`, `IPdfReportService`, `IQrCodeGenerator`, `IBarcodeGenerator`).
- [x] T2.7 Register implementations in `FMS.Reporting/DependencyInjection/ReportingServiceCollectionExtensions.cs`.
- [x] T2.8 Wire DI in `FMS.WebClient/Program.cs` and `FMS.BackgroundServices`.
- [x] T2.9 Remove `ClosedXML`, `Docnet.Core`, `QRCoder`, `ZXing.Net` from `FMS.Application.csproj`.
- [x] T2.10 Add `Tenacy.Fms.sln` entry for `FMS.Reporting`.
- [ ] T2.11 Build + test.

Current Phase 2 status: code extraction and host wiring are in place; the explicit build/test gate in T2.11 is still pending.

**Done when:** No `using ClosedXML|Docnet|QRCoder|ZXing` statements remain in `FMS.Application`.

---

## Phase 3 — Move hosted services to `FMS.BackgroundServices`

**Goal:** Application layer must not contain `IHostedService`.

- [x] T3.1 List hosted services in `FMS.Application/Services/`:
  - `AutoTransactionCompletionService.cs`
  - `DatabaseSeedingHostedService.cs`
  - `DeviceActivityMonitorService.cs`
  - `StaleConnectionDetectionService.cs`
- [x] T3.2 Move each into `services/FMS.BackgroundServices/` under an appropriately named subfolder.
- [x] T3.3 Move companion non-host helpers (`SeedDataService.cs`, `ISeedDataService.cs`, `SystemUserHelper.cs`, `SystemUserService.cs`) — decide per file: stays in Application if pure logic, moves to BackgroundServices if host-only.
- [x] T3.4 Remove `<PackageReference Include="System.ServiceProcess.ServiceController" />` from `FMS.Application.csproj` if no longer used.
- [x] T3.5 Update DI: hosted services are now registered in `FMS.BackgroundServices`, consumed by `FMS.WebClient` and `FMS.PTS.WindowsService`.
- [ ] T3.6 Build + test.

Current Phase 3 status: active hosted services were extracted from `FMS.Application` into `services/FMS.BackgroundServices/FMS`; dead commented seeding artifacts were removed.

Discovery notes:
- `AutoTransactionCompletionService.cs` and `StaleConnectionDetectionService.cs` are regular scoped services, not hosted services, so they remain in `FMS.Application` for now.
- `LogCleanupBackgroundService.cs` was also an active `BackgroundService` under `FMS.Application` and was moved during this phase even though it was not listed originally.
- `SeedDataService.cs`, `ISeedDataService.cs`, and `DatabaseSeedingHostedService.cs` were dead commented code and were removed instead of moved.
- `SystemUserService.cs` and `SystemUserHelper.cs` remain in `FMS.Application` because system-user logic is still consumed outside host startup.
- Windows-only service control moved to `packages/FMS.Infrastructure/Services/PTSService/ServiceControlService.cs`, which removed `System.ServiceProcess.ServiceController` from `FMS.Application`.

**Done when:** `grep -r "IHostedService\|BackgroundService" packages/FMS.Application` returns nothing.

---

## Phase 4 — Move `Application/Infrastructure/*` into `FMS.Infrastructure`

**Goal:** Eliminate the Infrastructure folder inside the Application project.

- [x] T4.1 Create `FMS.Application.Abstractions` namespace (folder) inside `FMS.Application` for any interfaces currently coupled to the moving implementations. (Extracting a separate package can wait if not strictly necessary.)
- [x] T4.2 For each subfolder, extract abstractions then move implementations:
  - `Authorization/` → `FMS.Infrastructure/Authorization/`
  - `Communication/` (anything left after P5) → `FMS.Infrastructure/Communication/`
  - `DistCacheTracker/` → `FMS.Infrastructure/Caching/`
  - `ErrorCodeHandling/` → `FMS.Infrastructure/ErrorHandling/`
  - `ErrorHandling/` → `FMS.Infrastructure/ErrorHandling/`
  - `Exceptions/` → keep custom exception types in Application (Common/Exceptions); move infra-specific ones to Infrastructure.
  - `Services/` (under Infrastructure folder) → `FMS.Infrastructure/Services/`
- [x] T4.3 Move JWT (`System.IdentityModel.Tokens.Jwt`) and Google.Apis.Auth-using classes into `FMS.Infrastructure/Identity/`.
- [x] T4.4 Move NLog config into hosts (`FMS.WebClient`, `FMS.PTS.WindowsService`) — Application uses only `ILogger<T>`.
- [ ] T4.5 Verify `FMS.Infrastructure.csproj` only depends on Application **abstractions**, not Application impls (no cycle).
- [x] T4.6 Remove `System.IdentityModel.Tokens.Jwt`, `Google.Apis.Auth`, `NLog` from `FMS.Application.csproj`.
- [x] T4.7 Re-enable `<ProjectReference Include="..\FMS.Infrastructure\FMS.Infrastructure.csproj" />` only **at the host level**, not from Application.
- [ ] T4.8 Build + test.

Current Phase 4 status: `packages/FMS.Application/Infrastructure` no longer contains C# source files. DistCacheTracker, SignalR notification delivery, JWT/token generation, permission policy provider, push notification delivery, and Windows service control implementations were moved into `FMS.Infrastructure`; application-facing contracts stayed in `FMS.Application`. PTS error-code helpers and `PTSDeviceException` were relocated into Application common folders so they are no longer stranded under `Application/Infrastructure`.

Remaining T4.5 blockers:
- `packages/FMS.Infrastructure/Communication/SignalR/SignalRNotificationService.cs` still depends on `FMS.Application.Communication.SignalR.FrontEndHub`.
- `packages/FMS.Infrastructure` still consumes several Application DTO/interface namespaces directly, and one host-only registration (`IGeofenceSyncJobProcessor` → `GeofenceSyncJobProcessor`) was moved up into the hosts during this phase to reduce that coupling.
- A deeper cleanup is still needed before `FMS.Infrastructure` can be said to depend only on pure Application abstractions.

Current Phase 4 status: `FMS.Application.Abstractions` now exists and the first infrastructure-backed contracts have moved there. `DistCacheTracker/` moved to `FMS.Infrastructure` with `IAuthorizationStateTracker` + `AuthState` retained as application abstractions, and SignalR notification delivery moved to `FMS.Infrastructure` with `ISignalRNotificationService` retained as an application abstraction.

**Done when:** `packages/FMS.Application/Infrastructure/` folder no longer exists.

---

## Phase 5 — Move fueling transport / protocol / commands into `FMS.Devices.Fueling`

**Goal:** All PTS/fueling device transport and protocol code lives under `FMS.Devices.Fueling/Providers/Technotrade/` per `.github/copilot-instructions.md` §13.

> ⚠️ Highest-risk phase. Stage on a branch. Smoke-test the PTS Windows Service against a real device after each major batch.

- [ ] T5.1 Move `FMS.Application/Communication/WebSocket/` → `FMS.Devices.Fueling/Providers/Technotrade/Transport/WebSocket/`.
- [ ] T5.2 Move `FMS.Application/Communication/Redis/` → `FMS.Devices.Fueling/Providers/Technotrade/Channels/` (consolidates with the file already there).
- [ ] T5.3 Move `FMS.Application/Communication/HttpPolling/` → `FMS.Devices.Fueling/Providers/Technotrade/Transport/HttpPolling/`.
- [ ] T5.4 Move `FMS.Application/Communication/Connection/` → `FMS.Devices.Fueling/Providers/Technotrade/Transport/Connection/`.
- [ ] T5.5 Move `FMS.Application/PTSServices/` (PumpService, ProbeService, PTSConfigService, PTSService.cs, Interfaces) → `FMS.Devices.Fueling/Providers/Technotrade/Services/`.
- [ ] T5.6 Move `FMS.Application/Command/PTSCommand/` → `FMS.Devices.Fueling/Providers/Technotrade/Commands/`. Per devices skill: split serializers (provider) vs. orchestration (Application/Features/Devices/Fueling — see T7).
- [ ] T5.7 Move `FMS.Application/Handlers/PacketHandlers/` → `FMS.Devices.Fueling/Providers/Technotrade/Mapping/` as `IPtsPacketMapper<TPacket,TCanonical>` implementations (devices skill §13.3).
- [ ] T5.8 Move `FMS.Application/Handlers/PumpResponse/` → `FMS.Devices.Fueling/Providers/Technotrade/Mapping/`.
- [ ] T5.9 Move `FMS.Application/Handlers/UploadTransactions/` → `FMS.Devices.Fueling/Providers/Technotrade/Mapping/`.
- [ ] T5.10 Move `FMS.Application/Handlers/Common/PTSMessageProcessor*` → delete; replace with keyed DI mappers per devices skill (this code is documented as "DELETED, replaced by mappers").
- [ ] T5.11 Move `FMS.Application/Common/PTSMessage/` types into `FMS.Devices.Fueling/Providers/Technotrade/Protocol/Models/` (or `FMS.Devices.Abstractions` if canonical).
- [ ] T5.12 Move `FMS.Application/Features/PTS/`, `Features/PTSDevice/`, `Features/PTSService/` (~37 files) — split:
  - Vendor-specific code → `FMS.Devices.Fueling/Providers/Technotrade/`.
  - Cross-cutting fueling business logic → `FMS.Application/Features/Devices/Fueling/` (per devices skill §13.1).
- [ ] T5.13 Remove `StackExchange.Redis` and `System.ServiceModel.*` (WCF) NuGets from `FMS.Application.csproj`. Add to `FMS.Devices.Fueling.csproj` if still needed there.
- [ ] T5.14 Verify per-vendor logging category `fueling-technotrade` exists in `FMS.PTS.WindowsService` log config.
- [ ] T5.15 Build + test + run PTS Windows Service against staging device(s).

**Done when:** No `using FMS.Application.Communication|Handlers.PacketHandlers|PTSServices|Command.PTSCommand` from outside `FMS.Devices.Fueling`.

---

## Phase 6 — Move tracking transport into `FMS.Devices.Tracking`

**Goal:** GPS/vehicle-tracking vendor transport code lives under `FMS.Devices.Tracking/Providers/<Vendor>/`.

- [ ] T6.1 Move `FMS.Application/Communication/GPSGate/` → `FMS.Devices.Tracking/Providers/GpsGate/Channels/`.
- [ ] T6.2 Move `FMS.Application/Communication/Tracker/` → `FMS.Devices.Tracking/Providers/<Vendor>/Channels/` (assess which vendor; may split).
- [ ] T6.3 Move `FMS.Application/Features/GPSGate/` (~28 files) into `FMS.Devices.Tracking/Providers/GpsGate/`.
- [ ] T6.4 Move vendor-specific bits of `FMS.Application/Features/VehicleTracking/` (~14 files) into the corresponding tracking provider folder. Keep canonical/cross-vendor logic in Application.
- [ ] T6.5 Verify per-vendor logging category exists in `FMS.Devices.Tracking.Host` log config.
- [ ] T6.6 Build + test + smoke-test tracking host.

**Done when:** `Features/GPSGate` removed from `FMS.Application`.

---

## Phase 7 — Collapse legacy folders into `Features/{Domain}/`

**Goal:** Finish the abandoned 2024 refactor (per `RefactoringGuide.md`).

- [ ] T7.1 For each file in `FMS.Application/Command/DatabaseCommand/<Domain>/`:
  - move to `Features/<Domain>/Commands/`
  - keep command + handler in same file (per `copilot-instructions.md` §1.9)
  - update namespace to `FMS.Application.Features.<Domain>.Commands`.
- [ ] T7.2 For each file in `FMS.Application/Queries/Database/<Domain>/`:
  - move to `Features/<Domain>/Queries/`
  - keep query + handler in same file
  - update namespace.
- [ ] T7.3 For each file in `FMS.Application/ModelsDTOs/<Domain>/`:
  - move to `Features/<Domain>/DTOs/`
  - one DTO per file (`copilot-instructions.md` §1.9).
- [ ] T7.4 For each profile in `FMS.Application/MappingProfile/<Domain>*`:
  - move to `Features/<Domain>/Mapping/`.
- [ ] T7.5 For each validator in `FMS.Application/Validation/<Domain>*`:
  - move to `Features/<Domain>/Validators/`.
- [ ] T7.6 Delete legacy folders once empty: `Command/`, `Queries/`, `ModelsDTOs/`, `MappingProfile/` (or reduce to genuinely cross-cutting items only), `Validation/`.
- [ ] T7.7 Move `FMS.Application/Handlers/DatabaseHandlers/` and `Handlers/TankStock/` into `Features/{Domain}/Commands|Queries/`.
- [ ] T7.8 Update `FMS.Application.csproj` `<Folder Include="..." />` items — remove obsolete ones.
- [ ] T7.9 Run a global namespace audit: every file under `Features/<Domain>/<Subtype>/` should be in namespace `FMS.Application.Features.<Domain>.<Subtype>`.
- [ ] T7.10 Build + test.

**Done when:** `Command/`, `Queries/`, `ModelsDTOs/`, `Validation/` folders are removed (or are empty/cross-cutting only).

---

## Phase 8 — NuGet cleanup & final audit

**Goal:** `FMS.Application` is a Clean-Architecture Application layer.

- [ ] T8.1 Final `FMS.Application.csproj` should have **only** these `PackageReference` items:
  - `MediatR`
  - `AutoMapper`
  - `FluentValidation` (if used; add if not)
  - `Microsoft.Extensions.Logging.Abstractions`
  - `Microsoft.Extensions.DependencyInjection.Abstractions`
- [ ] T8.2 Remove from `FMS.Application.csproj` (verify already gone after P2–P5):
  - `ClosedXML`, `Docnet.Core`, `QRCoder`, `ZXing.Net` (P2)
  - `System.ServiceProcess.ServiceController` (P3)
  - `System.IdentityModel.Tokens.Jwt`, `Google.Apis.Auth`, `NLog` (P4)
  - `StackExchange.Redis`, `System.ServiceModel.*` (P5)
- [ ] T8.3 Remove unused `<Folder Include="..." />` items from the `.csproj`.
- [ ] T8.4 Audit `using` statements at top of every file under `FMS.Application/Features/` — flag any reference to `System.ServiceModel`, `StackExchange.Redis`, `Docnet`, `ClosedXML`, `QRCoder`, `ZXing`, `Google.Apis`, `NLog`. Each is a regression.
- [ ] T8.5 Audit project references — `FMS.Application` should reference only `FMS.Domain`, `FMS.Persistence`, `FMS.Devices.Abstractions`. (No reference to `FMS.Infrastructure`, no reference to concrete device packages.)
- [ ] T8.6 Run `ArchitectureCompliance` subagent against `packages/FMS.Application/`.
- [ ] T8.7 Update `Documentation/Features/Architecture/project-dependencies/V1/implementation/project-context-ascii.md` to reflect the new structure (Application content list, new `FMS.Reporting` row, dependency edges).
- [ ] T8.8 Update the Mermaid diagram (`project-dependency-context.mmd`) accordingly.
- [ ] T8.9 Update root `Tenacy.Fms.sln`.
- [ ] T8.10 Build + test + smoke-test PTS Windows Service + Tracking Host + WebClient.

**Done when:** All §9 acceptance criteria in [PRD.md](./PRD.md) are checked.

---

## Cross-cutting checks (run at the end of every phase)

- [ ] `dotnet build Tenacy.Fms.sln` — 0 errors, warning count not increased.
- [ ] `dotnet test tests/FMS.Testing` — all green.
- [ ] No new entry under `packages/FMS.Domain/` (per `copilot-instructions.md` §1.6).
- [ ] No new MySQL migration created.
- [ ] No HTTP route renamed, removed, or whose response shape changed.
- [ ] No frontend (`apps/fms.frontend`, `apps/FMS.Admin`, `apps/fms.mobile`) changes.
- [ ] PTS log folder structure (`C:\Logs\FMS.PTS\`) and WebClient log folder structure (`C:\Logs\FMS.Webclient\`) unchanged.

## Estimation discipline

This document does **not** estimate time per phase. Phase boundaries are determined by reviewable PR size, not duration.
