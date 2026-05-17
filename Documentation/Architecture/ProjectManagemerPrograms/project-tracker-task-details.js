/**
 * File:          project-tracker-task-details.js
 * Purpose:       Provides static milestone item detail data for the project tracker HTML page.
 * Dependencies:  project-tracker.html
 * Last Modified: 2026-05-17
 *
 * Key Functions:
 * - window.PROJECT_TRACKER_TASK_DETAILS: Task-level milestone detail cache used by the tracker UI.
 */
window.PROJECT_TRACKER_TASK_DETAILS = {
    "devices-multi-device-platform-v1": {
        "phase-0": {
            "summary": "Demolish unused IoT scaffolding",
            "items": [
                { "status": "done", "label": "T0.1", "text": "Remove FMS.IoT.Contracts/Gateway/ProcessingEngine from solution files" },
                { "status": "done", "label": "T0.2", "text": "Delete the three folders from disk" },
                { "status": "done", "label": "T0.3", "text": "Delete Class1.cs template stubs" },
                { "status": "done", "label": "T0.4", "text": "dotnet build Tenacity.Fms.sln — green" },
                { "status": "done", "label": "T0.5", "text": "Verify no remaining FMS.IoT references" }
            ]
        },
        "phase-1": {
            "summary": "Provider foundations",
            "items": [
                { "status": "done", "label": "T1.1", "text": "Create FMS.Devices.Abstractions project" },
                { "status": "done", "label": "T1.2", "text": "Create FMS.Devices.Core project" },
                { "status": "done", "label": "T1.3", "text": "Define DeviceCategory enum, ProviderAttribute, canonical message types" },
                { "status": "done", "label": "T1.4", "text": "Move IVehicleTrackingProvider to Abstractions/Tracking" },
                { "status": "done", "label": "T1.5", "text": "Define IFuelingDeviceProvider, canonical fueling messages" },
                { "status": "done", "label": "T1.6", "text": "Implement ProviderRegistry, ProviderFactory, DeviceMessageRouter, ProviderHealthMonitor" },
                { "status": "done", "label": "T1.7", "text": "Implement IProviderConfigRepository, IDeviceMappingRepository with tenant filter" },
                { "status": "done", "label": "T1.8", "text": "Add TenantId and DeviceCategory columns to ProviderConfigurationEntity" },
                { "status": "done", "label": "T1.9", "text": "Rename VehicleProviderMappingEntity to DeviceProviderMappingEntity" },
                { "status": "done", "label": "T1.10", "text": "Move provider entities from Domain/VehicleTracking to Domain/Devices" },
                { "status": "done", "label": "T1.11", "text": "Tenant filter unit test for provider repositories" },
                { "status": "done", "label": "T1.12", "text": "AddDeviceCore() DI extension" },
                { "status": "notStarted", "label": "T1.13", "text": "User handoff: run EF migrations and dotnet ef database update" },
                { "status": "done", "label": "T1.14", "text": "Wire ITenantScope adapter in FMS.WebClient" }
            ]
        },
        "phase-2": {
            "summary": "Tracking provider migration",
            "items": [
                { "status": "done", "label": "T2.1", "text": "Create FMS.Devices.Tracking project" },
                { "status": "done", "label": "T2.2", "text": "Move GPSGateProvider to FMS.Devices.Tracking/Providers/GpsGate" },
                { "status": "done", "label": "T2.3", "text": "Move FMS.Infrastructure/ExternalServices/GPS/GPSGate (26 files) to tracking provider" },
                { "status": "done", "label": "T2.4", "text": "Move RabbitMQ contracts to Abstractions/Tracking/Messages" },
                { "status": "done", "label": "T2.5", "text": "Move GPSGateRabbitMQConsumerService to tracking provider channels" },
                { "status": "done", "label": "T2.6", "text": "Replace IGPSGate* injections in FuelAudit, Vehicle, FusionReporting, FuelTagManagement" },
                { "status": "done", "label": "T2.7", "text": "Fix hardcoded provider-name predicate to filter on DeviceCategory.Tracking" },
                { "status": "done", "label": "T2.8", "text": "Sweep for remaining provider-name predicates solution-wide" },
                { "status": "done", "label": "T2.9", "text": "Create GpsWoxProvider stub" },
                { "status": "done", "label": "T2.10", "text": "Create FMS.Devices.Tracking.Host worker project" },
                { "status": "inProgress", "label": "T2.11", "text": "QA: vehicle live location, geofence, sensor data still work for GPSGate-mapped vehicles" }
            ]
        },
        "phase-3": {
            "summary": "Fueling abstraction",
            "items": [
                { "status": "done", "label": "T3.1", "text": "Create FMS.Devices.Fueling project" },
                { "status": "done", "label": "T3.2", "text": "Move WebSocket listener to FMS.Devices.Fueling/Providers/TechnotradePts/Transport" },
                { "status": "inProgress", "label": "T3.3", "text": "Move remaining FMS.Application/Communication surface to provider boundary (partial/transitional)" },
                { "status": "done", "label": "T3.4", "text": "Move PTS protocol surface to provider Protocol folder" },
                { "status": "done", "label": "T3.5", "text": "Move Redis PTS bits to provider Channels" },
                { "status": "inProgress", "label": "T3.6", "text": "Create IPtsPacketMapper for each packet type (partial/sidecar wired)" },
                { "status": "inProgress", "label": "T3.7", "text": "Move business logic from handlers into notification handlers (partial/safe parallel slice)" },
                { "status": "blocked", "label": "T3.8", "text": "Delete PacketType registry path after replacement cutover" },
                { "status": "inProgress", "label": "T3.9", "text": "Move PTS command serializers to provider executor path" },
                { "status": "done", "label": "T3.10", "text": "Remove unused external ATG persistence sink scope" },
                { "status": "done", "label": "T3.11", "text": "Remove unused external ATG entity schema from Domain" },
                { "status": "done", "label": "T3.12", "text": "Fix ATG namespace mismatch in DTOs" },
                { "status": "inProgress", "label": "T3.13", "text": "Mapper unit tests against captured packet samples (partial/first slice added)" },
                { "status": "done", "label": "T3.14", "text": "External ATG persistence integration test removed from scope" },
                { "status": "inProgress", "label": "T3.15", "text": "End-to-end test: PTS device to canonical notifications to DB" }
            ]
        },
        "phase-4": {
            "summary": "Application consolidation",
            "items": [
                { "status": "done", "label": "T4.1", "text": "Create FMS.Application/Features/Devices skeleton" },
                { "status": "inProgress", "label": "T4.2", "text": "Migrate business logic from Features/PTS to Devices/Fueling/UploadStatus" },
                { "status": "inProgress", "label": "T4.3", "text": "Migrate Features/PTSDevice to Devices/Provisioning" },
                { "status": "notStarted", "label": "T4.4", "text": "Migrate Features/PTSService to Devices/Fueling" },
                { "status": "inProgress", "label": "T4.5", "text": "Migrate PTSServices into Devices feature folders" },
                { "status": "notStarted", "label": "T4.6", "text": "Delete legacy PTS feature folders" },
                { "status": "done", "label": "T4.7", "text": "Add client device-provider permissions" },
                { "status": "done", "label": "T4.8", "text": "Build client-tenant /admin/device-providers page in fms.frontend" },
                { "status": "done", "label": "T4.8a", "text": "Add FMS.Admin operator device-provider page" },
                { "status": "done", "label": "T4.8b", "text": "Enforce Customer view restrictions for provider endpoints" },
                { "status": "done", "label": "T4.9", "text": "Add navigation seed entries for device-provider routes" },
                { "status": "inProgress", "label": "T4.10", "text": "Verify zero FMS.Domain.PTSCommon references outside fueling provider boundary" },
                { "status": "notStarted", "label": "T4.11", "text": "UI smoke: pump authorize to DB update to SignalR push" }
            ]
        },
        "phase-5": {
            "summary": "Hosting split",
            "items": [
                { "status": "notStarted", "label": "T5.1", "text": "Create FMS.Devices.Fueling.Host worker project" },
                { "status": "notStarted", "label": "T5.2", "text": "Migrate PTS logging config and rename log roots" },
                { "status": "notStarted", "label": "T5.3", "text": "Migrate service install and uninstall scripts" },
                { "status": "notStarted", "label": "T5.4", "text": "Add logging config to FMS.Devices.Tracking.Host" },
                { "status": "notStarted", "label": "T5.5", "text": "Dual-host parallel run cutover for live PTS" },
                { "status": "notStarted", "label": "T5.6", "text": "Remove FMS.PTS.WindowsService after full cutover" }
            ]
        },
        "phase-6": {
            "summary": "Hardening and extension proof",
            "items": [
                { "status": "notStarted", "label": "T6.1", "text": "Implement real GpsWoxProvider end-to-end" },
                { "status": "notStarted", "label": "T6.2", "text": "Per-tenant provider config UI verification" },
                { "status": "notStarted", "label": "T6.3", "text": "Provider conformance test suite" },
                { "status": "notStarted", "label": "T6.4", "text": "Author provider cookbook" },
                { "status": "notStarted", "label": "T6.5", "text": "Update PRD open questions with resolutions" },
                { "status": "done", "label": "T6.6", "text": "Multi-tenancy conformance tests for device-provider isolation" }
            ]
        },
        "cross-cutting": {
            "summary": "Agent/config synchronization",
            "items": [
                { "status": "done", "label": "TX.1", "text": "Update .github/copilot-instructions.md with Devices Architecture section" },
                { "status": "done", "label": "TX.2", "text": "Update System.instructions.md mirror" },
                { "status": "notStarted", "label": "TX.3", "text": "Update .agent mirror if the file exists" },
                { "status": "done", "label": "TX.4", "text": "Create .agents/skills/devices/SKILL.md" },
                { "status": "done", "label": "TX.5", "text": "Create .claude/skills/devices/SKILL.md" },
                { "status": "notStarted", "label": "TX.6", "text": "Add system configuration keys to systemconfigurations" },
                { "status": "done", "label": "TX.7", "text": "Keep device-provider permission and tenancy notes in sync with MultiTenancy" }
            ]
        }
    },
    "fiscal-kra-etims-integration-v1": {
        "phase-0": {
            "summary": "Spec ingestion and architecture sign-off",
            "items": [
                { "status": "notStarted", "label": "T0.1", "text": "Read all four KRA PDFs and produce endpoint mapping notes" },
                { "status": "notStarted", "label": "T0.2", "text": "Confirm OSCU sandbox and production base URLs" },
                { "status": "notStarted", "label": "T0.3", "text": "Validate void and credit-note flow against FMS sales void command" },
                { "status": "notStarted", "label": "T0.4", "text": "Confirm fuel SKU classification codes with finance and KRA" },
                { "status": "notStarted", "label": "T0.5", "text": "Architecture sign-off on the folder structure" },
                { "status": "notStarted", "label": "T0.6", "text": "Decide outbox host for V1 versus future dedicated host" }
            ]
        },
        "phase-1": {
            "summary": "Foundations (FMS.Fiscal.Abstractions and Core)",
            "items": [
                { "status": "notStarted", "label": "T1.1", "text": "Create FMS.Fiscal.Abstractions project" },
                { "status": "notStarted", "label": "T1.2", "text": "Define FiscalProviderAttribute, capability flags, and metadata" },
                { "status": "notStarted", "label": "T1.3", "text": "Define IFiscalProvider and canonical fiscal DTOs" },
                { "status": "notStarted", "label": "T1.4", "text": "Define invoice signing notification types" },
                { "status": "notStarted", "label": "T1.5", "text": "Create FMS.Fiscal.Core project" },
                { "status": "notStarted", "label": "T1.6", "text": "Implement FiscalProviderRegistry and FiscalProviderFactory" },
                { "status": "notStarted", "label": "T1.7", "text": "Implement fiscal repositories with automatic tenant filter" },
                { "status": "notStarted", "label": "T1.8", "text": "Implement IFiscalOrchestrator and FiscalOrchestrator" },
                { "status": "notStarted", "label": "T1.9", "text": "Implement FiscalSigningOutboxProcessor BackgroundService" },
                { "status": "notStarted", "label": "T1.10", "text": "AddFiscalCore() DI extension" },
                { "status": "notStarted", "label": "T1.11", "text": "Add EF entity configs for fiscal tables" },
                { "status": "notStarted", "label": "T1.12", "text": "Register fiscal entities on GpsdataContext" },
                { "status": "notStarted", "label": "T1.13", "text": "User handoff: run fiscal EF migrations" },
                { "status": "notStarted", "label": "T1.14", "text": "Tenant-filter unit tests for fiscal repositories" }
            ]
        },
        "phase-2": {
            "summary": "KRA provider plugin",
            "items": [
                { "status": "notStarted", "label": "T2.1", "text": "Create FMS.Fiscal.Kra project" },
                { "status": "notStarted", "label": "T2.2", "text": "Implement KraFiscalProvider shell with FiscalProvider attribute" },
                { "status": "notStarted", "label": "T2.3", "text": "Implement KraSecretsProtector" },
                { "status": "notStarted", "label": "T2.4", "text": "Implement KraDeviceInitializer" },
                { "status": "notStarted", "label": "T2.5", "text": "Implement OscuHttpClient with retry and redacted logging" },
                { "status": "notStarted", "label": "T2.6", "text": "Implement OscuPayloadSerializer and invoice mapper" },
                { "status": "notStarted", "label": "T2.7", "text": "Implement KRA response to canonical mapper" },
                { "status": "notStarted", "label": "T2.8", "text": "Implement SaveItem and RegisterItemAsync" },
                { "status": "notStarted", "label": "T2.9", "text": "Implement SaveCustomer and RegisterCustomerAsync" },
                { "status": "notStarted", "label": "T2.10", "text": "Implement code-list sync and classification cache" },
                { "status": "notStarted", "label": "T2.11", "text": "Implement VscuLocalClient" },
                { "status": "notStarted", "label": "T2.12", "text": "Implement VoidAsync credit-note path" },
                { "status": "notStarted", "label": "T2.13", "text": "AddFiscalKra() service registration" },
                { "status": "notStarted", "label": "T2.14", "text": "Mapper unit tests against captured KRA payloads" },
                { "status": "notStarted", "label": "T2.15", "text": "Sandbox smoke from device init to signed sale" }
            ]
        },
        "phase-3": {
            "summary": "Application layer and sales hook",
            "items": [
                { "status": "notStarted", "label": "T3.1", "text": "Create FMS.Application/Features/Fiscal skeleton" },
                { "status": "notStarted", "label": "T3.2", "text": "Add SignSaleInvoiceCommand and handler" },
                { "status": "notStarted", "label": "T3.3", "text": "Add SaleCompletedFiscalHandler" },
                { "status": "notStarted", "label": "T3.4", "text": "Raise or reuse SaleCompletedNotification from sales completion" },
                { "status": "notStarted", "label": "T3.5", "text": "Add VoidSignedInvoiceCommand and handler" },
                { "status": "notStarted", "label": "T3.6", "text": "Add RegisterFiscalItemCommand and handler" },
                { "status": "notStarted", "label": "T3.7", "text": "Add RegisterFiscalCustomerCommand and handler" },
                { "status": "notStarted", "label": "T3.8", "text": "Add RetryFiscalSigningCommand and handler" },
                { "status": "notStarted", "label": "T3.9", "text": "Add ConfigureFiscalProviderCommand and handler" },
                { "status": "notStarted", "label": "T3.10", "text": "Add provider, signing record, status, and queue queries" },
                { "status": "notStarted", "label": "T3.11", "text": "Add IFiscalReceiptService" },
                { "status": "notStarted", "label": "T3.12", "text": "Add InvoiceSignedFiscalHandler for audit and SignalR" },
                { "status": "notStarted", "label": "T3.13", "text": "Wire FiscalSigningOutboxProcessor into WebClient hosted services" }
            ]
        },
        "phase-4": {
            "summary": "WebClient API, permissions, and system config",
            "items": [
                { "status": "notStarted", "label": "T4.1", "text": "Add fiscal permissions to Permissions.cs" },
                { "status": "notStarted", "label": "T4.2", "text": "Seed permission rows into permissions table" },
                { "status": "notStarted", "label": "T4.3", "text": "Seed system configuration rows for fiscal keys" },
                { "status": "notStarted", "label": "T4.4", "text": "Add FiscalProvidersController" },
                { "status": "notStarted", "label": "T4.5", "text": "Add FiscalSigningController" },
                { "status": "notStarted", "label": "T4.6", "text": "Return FMSResponse types from all endpoints" },
                { "status": "notStarted", "label": "T4.7", "text": "Extend FmsLoggingConfiguration with fiscal categories" },
                { "status": "notStarted", "label": "T4.8", "text": "Add KraSensitiveFieldsRedactor enricher" }
            ]
        },
        "phase-5": {
            "summary": "Frontend",
            "items": [
                { "status": "notStarted", "label": "T5.1", "text": "Create fiscalProviderApi.js and fiscalSigningApi.js" },
                { "status": "notStarted", "label": "T5.2", "text": "Create fiscalSlice.js" },
                { "status": "notStarted", "label": "T5.3", "text": "Create FiscalProvidersMain page with M365 layout" },
                { "status": "notStarted", "label": "T5.4", "text": "Create FiscalSigningStatusMain page" },
                { "status": "notStarted", "label": "T5.5", "text": "Add navigation entries via Navigation Management UI" },
                { "status": "notStarted", "label": "T5.6", "text": "Add Content.js route pairs and app-routes.js cases" },
                { "status": "notStarted", "label": "T5.7", "text": "Update receipt component with KRA block and QR" },
                { "status": "notStarted", "label": "T5.8", "text": "Use usePermissions() for UI gating" },
                { "status": "notStarted", "label": "T5.9", "text": "Run mobile responsiveness pass" }
            ]
        },
        "phase-6": {
            "summary": "VSCU local host",
            "items": [
                { "status": "notStarted", "label": "T6.1", "text": "Create FMS.Fiscal.Vscu.Host worker project" },
                { "status": "notStarted", "label": "T6.2", "text": "Implement VscuLocalAgentBridge" },
                { "status": "notStarted", "label": "T6.3", "text": "Add VSCU log structure" },
                { "status": "notStarted", "label": "T6.4", "text": "Create install and uninstall PowerShell scripts" },
                { "status": "notStarted", "label": "T6.5", "text": "Run end-to-end WebClient to VSCU smoke test" }
            ]
        },
        "phase-7": {
            "summary": "Outbox and alerting",
            "items": [
                { "status": "notStarted", "label": "T7.1", "text": "Confirm outbox backoff schedule configuration" },
                { "status": "notStarted", "label": "T7.2", "text": "Expose outbox metrics to admin dashboard" },
                { "status": "notStarted", "label": "T7.3", "text": "Add FiscalOutboxAgeExceeded alert to Event Expression Engine" },
                { "status": "notStarted", "label": "T7.4", "text": "Run chaos test for KRA 5xx handling" }
            ]
        },
        "phase-8": {
            "summary": "Hardening, tests, and docs",
            "items": [
                { "status": "notStarted", "label": "T8.1", "text": "Add conformance test suite under FMS.Testing/Fiscal" },
                { "status": "notStarted", "label": "T8.2", "text": "Verify per-tenant fiscal config UI isolation" },
                { "status": "notStarted", "label": "T8.3", "text": "Add capability-flag negative test with stub provider" },
                { "status": "notStarted", "label": "T8.4", "text": "Add spec-mismatch monitoring alert" },
                { "status": "notStarted", "label": "T8.5", "text": "Update PRD open questions with resolutions" },
                { "status": "notStarted", "label": "T8.6", "text": "Author provider cookbook in FMS.Fiscal.Abstractions/README.md" },
                { "status": "notStarted", "label": "T8.7", "text": "Cross-link cookbook from fiscal skill" }
            ]
        },
        "cross-cutting": {
            "summary": "Cross-cutting tasks",
            "items": [
                { "status": "notStarted", "label": "TX.1", "text": "Add Fiscal Architecture section to agent instructions after V1 ships" },
                { "status": "notStarted", "label": "TX.2", "text": "Verify file documentation headers on new code files" },
                { "status": "notStarted", "label": "TX.3", "text": "Verify no file exceeds 600 lines" },
                { "status": "notStarted", "label": "TX.4", "text": "Build via build task and then ask user to test" }
            ]
        }
    },
    "multitenancy-3-audience-v1": {
        "phase-1": {
            "summary": "Foundation (tenant hierarchy and ViewMode)",
            "items": [
                { "status": "done", "label": "1.1.1", "text": "Add ParentTenantId to Tenant entity" },
                { "status": "done", "label": "1.1.2", "text": "Add TenantKind enum to Tenant" },
                { "status": "done", "label": "1.1.3", "text": "Add branding columns to Tenant" },
                { "status": "done", "label": "1.1.4", "text": "Update TenantConfiguration with mappings, self-FK, and index" },
                { "status": "done", "label": "1.1.5", "text": "Create AddTenantHierarchyAndBranding migration" },
                { "status": "done", "label": "1.1.6", "text": "Write SQL migration mirror" },
                { "status": "done", "label": "1.1.7", "text": "Seed _platform system tenant" },
                { "status": "done", "label": "1.1.8", "text": "Backfill existing tenants to TenantKind=Client" },
                { "status": "done", "label": "1.2.1", "text": "Extend JwtTokenGenerator with tenant claims" },
                { "status": "done", "label": "1.2.2", "text": "Update TenantResolutionMiddleware to read new claims" },
                { "status": "done", "label": "1.2.3", "text": "Add TenantKind, IsPlatformOperator, IsCrossTenant to ITenantContext" },
                { "status": "done", "label": "1.2.4", "text": "Add AllowCrossTenant attribute and filter" },
                { "status": "done", "label": "1.2.5", "text": "Add BuildTenantOwnedFilter helper to GpsdataContext" },
                { "status": "done", "label": "1.2.6", "text": "Add tenant context and JWT claim tests" },
                { "status": "done", "label": "1.3.1", "text": "Add tenant-level permissions" },
                { "status": "done", "label": "1.3.2", "text": "Add platform-level permissions" },
                { "status": "done", "label": "1.3.3", "text": "Seed PlatformOperator role and platform permissions" },
                { "status": "done", "label": "1.4.1", "text": "Create tenantContextReducer Redux slice" },
                { "status": "done", "label": "1.4.2", "text": "Update auth flow to hydrate tenantContext from JWT" },
                { "status": "done", "label": "1.4.3", "text": "Expose viewMode and isPlatformOperator in auth context" },
                { "status": "done", "label": "1.4.4", "text": "Split route tree into Client and Customer branches" },
                { "status": "done", "label": "1.4.5", "text": "Build CustomerRoutes allowlist" },
                { "status": "done", "label": "1.4.6", "text": "Build restricted Customer navigation" },
                { "status": "done", "label": "1.4.7", "text": "Redirect Customer users away from client-only routes" },
                { "status": "done", "label": "1.4.8", "text": "Default legacy tokens to Client view" },
                { "status": "done", "label": "1.5.1", "text": "Add GET /api/v1/tenant/branding endpoint" },
                { "status": "done", "label": "1.5.2", "text": "Add fetchBranding bootstrap thunk" },
                { "status": "done", "label": "1.5.3", "text": "Apply branding CSS variables from response" },
                { "status": "done", "label": "1.5.4", "text": "Replace hardcoded logo usage with useBranding hook" },
                { "status": "notStarted", "label": "1.5.5", "text": "Smoke test tenant-specific branding swap" },
                { "status": "notStarted", "label": "1.6.1", "text": "Manual smoke: Client login path" },
                { "status": "notStarted", "label": "1.6.2", "text": "Manual smoke: Customer login path" },
                { "status": "notStarted", "label": "1.6.3", "text": "Run full fms.frontend regression suite" },
                { "status": "notStarted", "label": "1.6.4", "text": "Decode JWT and confirm new claims" }
            ]
        },
        "phase-2": {
            "summary": "FMS.Admin operator portal scaffold",
            "items": [
                { "status": "done", "label": "2.1.1", "text": "Create FMS.Admin with Vite, React, and TypeScript" },
                { "status": "done", "label": "2.1.2", "text": "Configure routing, Redux, and axios" },
                { "status": "done", "label": "2.1.3", "text": "Add Tailwind and SCSS with M365 tokens" },
                { "status": "done", "label": "2.1.4", "text": "Add build and deploy scripts" },
                { "status": "done", "label": "2.1.5", "text": "Document local dev URL in README" },
                { "status": "done", "label": "2.2.1", "text": "Add operator login endpoint for _platform tenant only" },
                { "status": "done", "label": "2.2.2", "text": "Emit is_platform_operator only for platform operators" },
                { "status": "done", "label": "2.2.3", "text": "Build FMS.Admin login page and JWT storage" },
                { "status": "done", "label": "2.2.4", "text": "Add protected route guard for platform operator portal" },
                { "status": "notStarted", "label": "2.2.5", "text": "Integration test: Client JWT blocked from FMS.Admin APIs" },
                { "status": "done", "label": "2.3.1", "text": "Add operator tenants list endpoint" },
                { "status": "done", "label": "2.3.2", "text": "Add operator tenant detail endpoint" },
                { "status": "done", "label": "2.3.3", "text": "Add operator tenant create endpoint" },
                { "status": "done", "label": "2.3.4", "text": "Add operator tenant status patch endpoint" },
                { "status": "done", "label": "2.3.5", "text": "Build FMS.Admin tenants list page" },
                { "status": "done", "label": "2.3.6", "text": "Build FMS.Admin tenant detail page" },
                { "status": "done", "label": "2.3.7", "text": "Build create-tenant form" },
                { "status": "done", "label": "2.4.1", "text": "Add operator subscriptions list endpoint" },
                { "status": "done", "label": "2.4.2", "text": "Add operator subscription detail endpoint" },
                { "status": "done", "label": "2.4.3", "text": "Add operator invoices endpoint with PDF support" },
                { "status": "done", "label": "2.4.4", "text": "Build subscriptions list page" },
                { "status": "done", "label": "2.4.5", "text": "Build invoices list with PDF download" },
                { "status": "notStarted", "label": "2.5.1", "text": "Operator login smoke and Client JWT 404 verification" },
                { "status": "notStarted", "label": "2.5.2", "text": "Create new client tenant and verify downstream visibility" },
                { "status": "notStarted", "label": "2.5.3", "text": "Validate separate-origin deployment for FMS.Admin" }
            ]
        },
        "phase-3": {
            "summary": "Cross-tenant reports and sub-customer management",
            "items": [
                { "status": "done", "label": "3.1.1", "text": "Add sub-customer create endpoint" },
                { "status": "done", "label": "3.1.2", "text": "Add sub-customer list endpoint" },
                { "status": "done", "label": "3.1.3", "text": "Add sub-customer patch endpoint" },
                { "status": "done", "label": "3.1.4", "text": "Add sub-customer invite-admin endpoint" },
                { "status": "done", "label": "3.1.5", "text": "Build SubCustomersPage under /admin/sub-customers" },
                { "status": "done", "label": "3.1.6", "text": "Build create, edit, and invite dialogs" },
                { "status": "done", "label": "3.1.7", "text": "Build sub-customer detail page" },
                { "status": "notStarted", "label": "3.2.1", "text": "Add PATCH /api/v1/tenant/branding endpoint" },
                { "status": "notStarted", "label": "3.2.2", "text": "Build Branding Settings page" },
                { "status": "notStarted", "label": "3.2.3", "text": "Add logo URL input and preview" },
                { "status": "notStarted", "label": "3.2.4", "text": "Add colour pickers with live preview" },
                { "status": "notStarted", "label": "3.3.1", "text": "Add cross-tenant usage report endpoint" },
                { "status": "notStarted", "label": "3.3.2", "text": "Add cross-tenant revenue report endpoint" },
                { "status": "notStarted", "label": "3.3.3", "text": "Build cross-tenant reports page" },
                { "status": "notStarted", "label": "3.3.4", "text": "Add charts for consumption, revenue, and device activity" },
                { "status": "notStarted", "label": "3.3.5", "text": "Add CSV and PDF export" },
                { "status": "notStarted", "label": "3.4.1", "text": "Extend audit model for cross-tenant operator actions" },
                { "status": "notStarted", "label": "3.4.2", "text": "Add operator audit endpoint" },
                { "status": "notStarted", "label": "3.4.3", "text": "Build audit log page" },
                { "status": "done", "label": "3.5.1", "text": "Add OperatorUsersController with platform permissions" },
                { "status": "done", "label": "3.5.2", "text": "Build OperatorUsersPage" },
                { "status": "notStarted", "label": "3.6.1", "text": "Verify sub-customer invite to Customer login flow" },
                { "status": "notStarted", "label": "3.6.2", "text": "Verify parent branding flows to Customer tenant" },
                { "status": "notStarted", "label": "3.6.3", "text": "Verify cross-tenant report totals" },
                { "status": "notStarted", "label": "3.6.4", "text": "Verify audit log records tenant creation and plan changes" }
            ]
        },
        "phase-4": {
            "summary": "Polish and white-label",
            "items": [
                { "status": "notStarted", "label": "4.1", "text": "Add logo file upload to blob or CDN" },
                { "status": "notStarted", "label": "4.2", "text": "Upgrade colour picker with presets and contrast warnings" },
                { "status": "notStarted", "label": "4.3", "text": "Add live theme preview on Branding Settings page" },
                { "status": "notStarted", "label": "4.4", "text": "Add Stations Provisioning module in FMS.Admin" },
                { "status": "notStarted", "label": "4.5", "text": "Add Plans and Pricing CRUD in FMS.Admin" },
                { "status": "notStarted", "label": "4.6", "text": "Add Sales Pipeline module in FMS.Admin" },
                { "status": "notStarted", "label": "4.7", "text": "Update MultiTenancy README with architecture diagram" }
            ]
        },
        "cross-cutting": {
            "summary": "Testing, security, and documentation",
            "items": [
                { "status": "notStarted", "label": "T-1", "text": "Add backend integration tests for sub-tenant provisioning" },
                { "status": "notStarted", "label": "T-2", "text": "Add backend tests for AllowCrossTenant filter" },
                { "status": "notStarted", "label": "T-3", "text": "Add frontend smoke test for ViewMode routing" },
                { "status": "notStarted", "label": "T-4", "text": "Run regression suite for Client and Customer view modes" },
                { "status": "done", "label": "T-5", "text": "Complete device-provider tenancy tests" },
                { "status": "notStarted", "label": "T-6", "text": "Backfill TenantId on legacy User rows and add user filter" },
                { "status": "notStarted", "label": "S-1", "text": "Pen-test Customer cross-tenant read path to confirm 404" },
                { "status": "notStarted", "label": "S-2", "text": "Confirm FMS.Admin is unreachable from client/customer origin" },
                { "status": "notStarted", "label": "S-3", "text": "Review JWT claim leakage risk" },
                { "status": "notStarted", "label": "S-4", "text": "Audit permissions on every new endpoint" },
                { "status": "done", "label": "S-5", "text": "Complete device-provider permission audit" },
                { "status": "notStarted", "label": "D-1", "text": "Update MultiTenancy README with schema columns and claims" },
                { "status": "notStarted", "label": "D-2", "text": "Add 3-audience architecture document" },
                { "status": "notStarted", "label": "D-3", "text": "Add API docs for operator and sub-tenant endpoints" },
                { "status": "notStarted", "label": "D-4", "text": "Add onboarding playbook for provisioning a Client tenant" }
            ]
        }
    },
    "notification-event-expression-engine-v1": {
        "phase-1": {
            "summary": "Foundation (41 tasks)",
            "items": [
                { "status": "notStarted", "label": "B1.1", "text": "Create FMSEvent abstract base class" },
                { "status": "notStarted", "label": "B1.2", "text": "Create TankClosingStockEvent subclass" },
                { "status": "notStarted", "label": "B1.3", "text": "Create TankLevelEvent subclass" },
                { "status": "notStarted", "label": "B1.4", "text": "Create SensorVarianceEvent subclass" },
                { "status": "notStarted", "label": "B1.5", "text": "Create DeviceStatusEvent subclass" },
                { "status": "notStarted", "label": "B1.6", "text": "Create PumpAlarmEvent subclass" },
                { "status": "notStarted", "label": "B1.7", "text": "Create VehicleGpsEvent subclass" },
                { "status": "notStarted", "label": "B1.8", "text": "Create SystemEvent subclass" },
                { "status": "notStarted", "label": "B1.9", "text": "Create EventProcessingResult class" },
                { "status": "notStarted", "label": "B1.10", "text": "Create EventExpression entity" },
                { "status": "notStarted", "label": "B1.11", "text": "Create EventExpressionExecution entity" },
                { "status": "notStarted", "label": "B1.12", "text": "Create ActiveEvent entity" },
                { "status": "notStarted", "label": "B1.13", "text": "Create EventExpressionConfiguration" },
                { "status": "notStarted", "label": "B1.14", "text": "Create EventExpressionExecutionConfiguration" },
                { "status": "notStarted", "label": "B1.15", "text": "Create ActiveEventConfiguration" },
                { "status": "notStarted", "label": "B1.16", "text": "Add DbSets to GpsdataContext" },
                { "status": "notStarted", "label": "B1.17", "text": "Create DB migration SQL" },
                { "status": "notStarted", "label": "B1.18", "text": "Create IExpressionEvaluator interface" },
                { "status": "notStarted", "label": "B1.19", "text": "Create ExpressionEvaluatorFactory" },
                { "status": "notStarted", "label": "B1.20", "text": "Create ThresholdEvaluator" },
                { "status": "notStarted", "label": "B1.21", "text": "Create TankLevelEvaluator" },
                { "status": "notStarted", "label": "B1.22", "text": "Create DeviceOfflineEvaluator" },
                { "status": "notStarted", "label": "B1.23", "text": "Create AlwaysTrueEvaluator" },
                { "status": "notStarted", "label": "B1.24", "text": "Create ExpressionCooldownService" },
                { "status": "notStarted", "label": "B1.25", "text": "Create IEventExpressionEngine interface" },
                { "status": "notStarted", "label": "B1.26", "text": "Create EventExpressionEngine implementation" },
                { "status": "notStarted", "label": "B1.27", "text": "Create EventLogService" },
                { "status": "notStarted", "label": "B1.28", "text": "Create EventExpressionDto" },
                { "status": "notStarted", "label": "B1.29", "text": "Create CreateEventExpressionRequest" },
                { "status": "notStarted", "label": "B1.30", "text": "Create UpdateEventExpressionRequest" },
                { "status": "notStarted", "label": "B1.31", "text": "Create EventExpressionTypeMetadataDto" },
                { "status": "notStarted", "label": "B1.32", "text": "Create CRUD commands and handlers" },
                { "status": "notStarted", "label": "B1.33", "text": "Create queries and handlers" },
                { "status": "notStarted", "label": "B1.34", "text": "Create EventExpressionsController" },
                { "status": "notStarted", "label": "B1.35", "text": "Create ActiveEventsController" },
                { "status": "notStarted", "label": "B1.36", "text": "Register DI services" },
                { "status": "notStarted", "label": "B1.37", "text": "Create AutoMapper profile" },
                { "status": "notStarted", "label": "B1.38", "text": "Create alarm_handlers to event_expressions migration script" },
                { "status": "notStarted", "label": "B1.39", "text": "Fix WellKnownCategories enum to match DB IDs" }
            ]
        },
        "phase-2": {
            "summary": "Integration (12 tasks)",
            "items": [
                { "status": "notStarted", "label": "B2.1", "text": "ClosingStockCommand emits TankClosingStockEvent" },
                { "status": "notStarted", "label": "B2.2", "text": "ClosingStockCommand emits SensorVarianceEvent" },
                { "status": "notStarted", "label": "B2.3", "text": "CreateTankMeasurementCommand emits TankLevelEvent" },
                { "status": "notStarted", "label": "B2.4", "text": "UploadAlertRecordHandler emits typed events" },
                { "status": "notStarted", "label": "B2.5", "text": "VehicleGpsOfflineAlertService emits VehicleGpsEvent" },
                { "status": "notStarted", "label": "B2.6", "text": "UnifiedTankReconciliationService emits events" },
                { "status": "notStarted", "label": "B2.7", "text": "AutomatedReconciliationService emits events" },
                { "status": "notStarted", "label": "B2.8", "text": "IssueMonitoringService emits SystemEvent" },
                { "status": "notStarted", "label": "B2.9", "text": "CreateIssueCommand emits SystemEvent" },
                { "status": "notStarted", "label": "B2.10", "text": "Device disconnection handler emits DeviceStatusEvent" },
                { "status": "notStarted", "label": "B2.11", "text": "ActiveAlarmService emits lifecycle events" },
                { "status": "notStarted", "label": "B2.12", "text": "Create EventLifecycleEvent subclass" }
            ]
        },
        "phase-3": {
            "summary": "Frontend (16 tasks)",
            "items": [
                { "status": "notStarted", "label": "F3.1", "text": "Create EventExpressionManagement.js" },
                { "status": "notStarted", "label": "F3.2", "text": "Create EventExpressionCreate.js" },
                { "status": "notStarted", "label": "F3.3", "text": "Create EventExpressionEdit.js" },
                { "status": "notStarted", "label": "F3.4", "text": "Create EventExpressionTester.js" },
                { "status": "notStarted", "label": "F3.5", "text": "Create event-expressions.scss" },
                { "status": "notStarted", "label": "F3.6", "text": "Create eventExpressionApi.js" },
                { "status": "notStarted", "label": "F3.7", "text": "Create activeEventsApi.js" },
                { "status": "notStarted", "label": "F3.8", "text": "Remove Active Alarm Filters tab from PolicyEdit.js" },
                { "status": "notStarted", "label": "F3.9", "text": "Remove trigger filter from PolicyCreate.js" },
                { "status": "notStarted", "label": "F3.10", "text": "Deprecate PolicyTriggersManager.js" },
                { "status": "notStarted", "label": "F3.11", "text": "Deprecate TriggerCreate.js" },
                { "status": "notStarted", "label": "F3.12", "text": "Switch Active Alarms dashboard to Active Events API" },
                { "status": "notStarted", "label": "F3.13", "text": "Add Event Expressions nav item" },
                { "status": "notStarted", "label": "F3.14", "text": "Add notification routes" },
                { "status": "notStarted", "label": "F3.15", "text": "Update navigationHelper.js" },
                { "status": "notStarted", "label": "F3.16", "text": "Update notification enums and types" }
            ]
        },
        "phase-4": {
            "summary": "Cleanup (18 tasks)",
            "items": [
                { "status": "notStarted", "label": "C4.1", "text": "Remove AlarmHandlerService.cs" },
                { "status": "notStarted", "label": "C4.2", "text": "Remove AlarmHandlerActiveAlarmIntegration.cs" },
                { "status": "notStarted", "label": "C4.3", "text": "Remove PolicyRulesProcessor.cs" },
                { "status": "notStarted", "label": "C4.4", "text": "Remove PolicyMatchesActiveAlarm() from ActiveAlarmService" },
                { "status": "notStarted", "label": "C4.5", "text": "Remove CreateAlarmNotificationAsync from ActiveAlarmService" },
                { "status": "notStarted", "label": "C4.6", "text": "Remove CreateAlarmNotificationAsync from NotificationService" },
                { "status": "notStarted", "label": "C4.7", "text": "Remove TriggerConditions from NotificationPolicy entity" },
                { "status": "notStarted", "label": "C4.8", "text": "Remove NullPolicyRulesProcessor inner class" },
                { "status": "notStarted", "label": "C4.9", "text": "Remove alarm handler DTOs" },
                { "status": "notStarted", "label": "C4.10", "text": "Remove alarm handler API endpoints" },
                { "status": "notStarted", "label": "C4.11", "text": "Verify event_expressions data matches alarm_handlers" },
                { "status": "notStarted", "label": "C4.12", "text": "Drop alarm_handlers table" },
                { "status": "notStarted", "label": "C4.13", "text": "Drop alarm_handler_executions table" },
                { "status": "notStarted", "label": "C4.14", "text": "Remove TriggerConditions from notification_policies table" },
                { "status": "notStarted", "label": "C4.15", "text": "Remove PolicyTriggersManager.js" },
                { "status": "notStarted", "label": "C4.16", "text": "Remove TriggerCreate.js" },
                { "status": "notStarted", "label": "C4.17", "text": "Remove PolicyJsonFieldsEditor.js if unused" },
                { "status": "notStarted", "label": "C4.18", "text": "Remove alarmHandlerApi.js" }
            ]
        }
    },
    "notification-alert-configuration-v1": {
        "all-tasks": {
            "summary": "All 31 tasks complete",
            "items": [
                { "status": "done", "label": "1", "text": "AlertConfigurationConstants.cs alert type registry" },
                { "status": "done", "label": "2", "text": "IAlertConfigurationService.cs interface" },
                { "status": "done", "label": "3", "text": "AlertConfigurationService.cs cached service" },
                { "status": "done", "label": "4", "text": "AlertConfigurationDto.cs" },
                { "status": "done", "label": "5", "text": "AlertTypeGroupDto.cs" },
                { "status": "done", "label": "6", "text": "Add DB key constants to SystemConfiguration.cs" },
                { "status": "done", "label": "7", "text": "GetAlertConfigurationsQuery.cs" },
                { "status": "done", "label": "8", "text": "GetAlertConfigurationsQueryHandler.cs" },
                { "status": "done", "label": "9", "text": "GetAlertConfigurationByTypeQuery.cs" },
                { "status": "done", "label": "10", "text": "GetAlertConfigurationByTypeQueryHandler.cs" },
                { "status": "done", "label": "11", "text": "UpdateAlertConfigurationCommand.cs" },
                { "status": "done", "label": "12", "text": "UpdateAlertConfigurationCommandHandler.cs" },
                { "status": "done", "label": "13", "text": "ToggleAlertCommand.cs" },
                { "status": "done", "label": "14", "text": "ToggleAlertCommandHandler.cs" },
                { "status": "done", "label": "15", "text": "ResetAlertDefaultsCommand.cs" },
                { "status": "done", "label": "16", "text": "ResetAlertDefaultsCommandHandler.cs" },
                { "status": "done", "label": "17", "text": "SeedAlertConfigurationCommand.cs" },
                { "status": "done", "label": "18", "text": "SeedAlertConfigurationCommandHandler.cs" },
                { "status": "done", "label": "19", "text": "AlertConfigurationController.cs" },
                { "status": "done", "label": "20", "text": "Register IAlertConfigurationService in DI" },
                { "status": "done", "label": "21", "text": "ClosingStockCommand.cs threshold refactor" },
                { "status": "done", "label": "22", "text": "AlarmHandlerService.cs threshold refactor" },
                { "status": "done", "label": "23", "text": "ActiveAlarmService.cs escalation threshold refactor" },
                { "status": "done", "label": "24", "text": "VehicleMaintenanceNotifierService.cs threshold refactor" },
                { "status": "done", "label": "25", "text": "alertConfigurationApi.js frontend service" },
                { "status": "done", "label": "26", "text": "AlertConfiguration.js main page" },
                { "status": "done", "label": "27", "text": "AlertConfiguration.scss" },
                { "status": "done", "label": "28", "text": "AlertTypeCard.js" },
                { "status": "done", "label": "29", "text": "Update navigationHelper.js" },
                { "status": "done", "label": "30", "text": "Update NotificationLayout.js" },
                { "status": "done", "label": "31", "text": "Update NotificationSystem index.js" }
            ]
        }
    },
    "security-permission-standardization-v1": {
        "phase-0": {
            "summary": "Critical database fixes",
            "items": [
                { "status": "done", "label": "T0.1", "text": "Fix tab characters in permission names (script created)" },
                { "status": "done", "label": "T0.2", "text": "Assign IssueTracker permissions to Admin role (script created)" },
                { "status": "done", "label": "T0.3", "text": "Assign Delivery read permissions to roles (script created)" },
                { "status": "done", "label": "T0.4", "text": "Assign Dashboard CRUD permissions (script created)" }
            ]
        },
        "phase-1": {
            "summary": "Backend permission constants",
            "items": [
                { "status": "done", "label": "T1.1", "text": "Create PermissionConstants.cs" },
                { "status": "done", "label": "T1.2", "text": "Update VehicleController to use constants" },
                { "status": "done", "label": "T1.3", "text": "Update IssueTrackerController to use constants" },
                { "status": "done", "label": "T1.4", "text": "Update FuelRefillController to use constants" },
                { "status": "done", "label": "T1.5", "text": "Update TankStockReportsController to use constants" }
            ]
        },
        "phase-2": {
            "summary": "Convert inline checks to attributes",
            "items": [
                { "status": "done", "label": "T2.1", "text": "Convert TankStockController inline checks" },
                { "status": "done", "label": "T2.2", "text": "Convert DeliveryController inline checks" },
                { "status": "done", "label": "T2.3", "text": "Convert TankStockReconciliationController" },
                { "status": "done", "label": "T2.4", "text": "Convert EmployeeController" },
                { "status": "done", "label": "T2.5", "text": "Convert FuelTagController" },
                { "status": "done", "label": "T2.6", "text": "Convert TankVolumeHistoryController" }
            ]
        },
        "phase-3": {
            "summary": "Protect unprotected controllers",
            "items": [
                { "status": "done", "label": "T3.1-5", "text": "Admin and UserManagement controllers" },
                { "status": "done", "label": "T3.6-12b", "text": "Vehicle module controllers" },
                { "status": "done", "label": "T3.13-20c", "text": "Fuel management controllers" },
                { "status": "done", "label": "T3.21-26a", "text": "Dashboard and reporting controllers" },
                { "status": "done", "label": "T3.27-50", "text": "Other controllers" }
            ]
        },
        "phase-4": {
            "summary": "Database permission renaming",
            "items": [
                { "status": "blocked", "label": "T4.1", "text": "Create SQL migration script for permission renaming" },
                { "status": "blocked", "label": "T4.2", "text": "Update PermissionConstants.cs values to match new names" },
                { "status": "blocked", "label": "T4.3", "text": "Update frontend permission references" },
                { "status": "blocked", "label": "T4.4", "text": "Test all six roles after renaming" }
            ]
        },
        "phase-5": {
            "summary": "Add missing permissions",
            "items": [
                { "status": "done", "label": "T5.1", "text": "Create parent modules for new permission groups" },
                { "status": "done", "label": "T5.2", "text": "Insert child CRUD permissions" },
                { "status": "done", "label": "T5.3", "text": "Assign new permissions to roles" },
                { "status": "notStarted", "label": "T5.4", "text": "Update Permission Management UI" }
            ]
        },
        "phase-6": {
            "summary": "Frontend permission sync",
            "items": [
                { "status": "notStarted", "label": "T6.1", "text": "Create permissionConstants.js" },
                { "status": "notStarted", "label": "T6.2", "text": "Update permissions.js utility" },
                { "status": "notStarted", "label": "T6.3", "text": "Audit frontend permission checks and replace magic strings" },
                { "status": "notStarted", "label": "T6.4", "text": "Update usePermissions hook" }
            ]
        },
        "phase-7": {
            "summary": "Testing and validation",
            "items": [
                { "status": "notStarted", "label": "T7.1", "text": "Create permission test matrix spreadsheet" },
                { "status": "notStarted", "label": "T7.2", "text": "Manual testing for Admin role" },
                { "status": "notStarted", "label": "T7.3", "text": "Manual testing for Guest role" },
                { "status": "notStarted", "label": "T7.4", "text": "Manual testing for unauthenticated access" },
                { "status": "notStarted", "label": "T7.5", "text": "Run automated grep for remaining magic strings" },
                { "status": "notStarted", "label": "T7.6", "text": "Run frontend smoke test" },
                { "status": "notStarted", "label": "T7.7", "text": "Run regression test" }
            ]
        }
    },
    "usermanagement-v2": {
        "phase-1": {
            "summary": "Domain and backend",
            "items": [
                { "status": "notStarted", "label": "1.1", "text": "Add FirstName and LastName to User entity" },
                { "status": "notStarted", "label": "1.2", "text": "Create database migration script for new user columns" },
                { "status": "notStarted", "label": "1.3", "text": "Update UserDto with FirstName, LastName, and PhoneNumber" },
                { "status": "notStarted", "label": "1.4", "text": "Update UserDetailDto with FirstName and LastName" },
                { "status": "notStarted", "label": "1.5", "text": "Update UserCreateCommand with new fields" },
                { "status": "notStarted", "label": "1.6", "text": "Update UserUpdateCommand with new fields" },
                { "status": "notStarted", "label": "1.7", "text": "Update query handlers and AutoMapper" }
            ]
        },
        "phase-2": {
            "summary": "Frontend foundation",
            "items": [
                { "status": "notStarted", "label": "2.1", "text": "Create M365 style foundation SCSS partials" },
                { "status": "notStarted", "label": "2.2", "text": "Create UserAvatar component" },
                { "status": "notStarted", "label": "2.3", "text": "Create UserStatusBadge and UserRoleBadge components" },
                { "status": "notStarted", "label": "2.4", "text": "Create custom hooks for filtering, normalization, and departments" }
            ]
        },
        "phase-3": {
            "summary": "Frontend main page",
            "items": [
                { "status": "notStarted", "label": "3.1", "text": "Redesign UserPage shell with M365 header and tabs" },
                { "status": "notStarted", "label": "3.2", "text": "Create UserFilterBar component" },
                { "status": "notStarted", "label": "3.3", "text": "Create UserListView component" },
                { "status": "notStarted", "label": "3.4", "text": "Create UserCardView and UserCard components" }
            ]
        },
        "phase-4": {
            "summary": "Panels and popups",
            "items": [
                { "status": "notStarted", "label": "4.1", "text": "Create EditUserPanel" },
                { "status": "notStarted", "label": "4.2", "text": "Create EditUserListNav" },
                { "status": "notStarted", "label": "4.3", "text": "Create EditUserForm" },
                { "status": "notStarted", "label": "4.4", "text": "Create ChangePasswordPopup" },
                { "status": "notStarted", "label": "4.5", "text": "Create CreateUserPopup" },
                { "status": "notStarted", "label": "4.6", "text": "Create ManageSitesPopup" },
                { "status": "notStarted", "label": "4.7", "text": "Create DepartmentTab and related forms" }
            ]
        },
        "phase-5": {
            "summary": "Integration and cleanup",
            "items": [
                { "status": "notStarted", "label": "5.1", "text": "Update Redux actions for new fields" },
                { "status": "notStarted", "label": "5.2", "text": "Remove old files and clean up" },
                { "status": "notStarted", "label": "5.3", "text": "Run testing and verification across CRUD, sites, departments, filters, and mobile" }
            ]
        }
    },
    "frontend-layout-shell-design-language-v1": {
        "phase-1": {
            "summary": "Design token foundation",
            "items": [
                { "status": "done", "label": "1.1", "text": "Extract Inspinia and M365 tokens into design token SCSS" },
                { "status": "done", "label": "1.2", "text": "Mirror token file in FMS.Admin" },
                { "status": "done", "label": "1.3", "text": "Document Inspinia inheritance matrix in README" },
                { "status": "done", "label": "1.4", "text": "Replace hardcoded hex values with token variables" }
            ]
        },
        "phase-2": {
            "summary": "Layout shell unification",
            "items": [
                { "status": "done", "label": "2.1", "text": "Audit tenant and admin shells for divergence" },
                { "status": "done", "label": "2.2", "text": "Align both shells to shared layout rules" },
                { "status": "done", "label": "2.3", "text": "Set identical layout data attributes" },
                { "status": "done", "label": "2.4", "text": "Extract useLayoutAttributes hook" },
                { "status": "done", "label": "2.5", "text": "Use height-based mobile sidebar collapse" }
            ]
        },
        "phase-3": {
            "summary": "Error handling stack",
            "items": [
                { "status": "done", "label": "3.1", "text": "Create RouteErrorBoundary in both apps" },
                { "status": "done", "label": "3.2", "text": "Wrap every route with RouteErrorBoundary" },
                { "status": "done", "label": "3.3", "text": "Port AdminErrorBoundary to FMS.Admin" },
                { "status": "done", "label": "3.4", "text": "Implement useApiError hook" },
                { "status": "done", "label": "3.5", "text": "Create EmptyState, ForbiddenState, and PageSkeleton" },
                { "status": "done", "label": "3.6", "text": "Refactor five high-traffic pages to use shared feedback components" },
                { "status": "done", "label": "3.7", "text": "Normalize axiosInstance API error event emission" }
            ]
        },
        "phase-4": {
            "summary": "Design language enforcement",
            "items": [
                { "status": "done", "label": "4.1", "text": "Add ESLint rule banning new CSS files" },
                { "status": "done", "label": "4.2", "text": "Add stylelint rule for Inspinia teal outside sidebars" },
                { "status": "done", "label": "4.3", "text": "Add stylelint rule for tw- Tailwind prefix" },
                { "status": "done", "label": "4.4", "text": "Document m365 patterns in README" },
                { "status": "done", "label": "4.5", "text": "Adopt m365-page-header across FMS.Admin pages" }
            ]
        },
        "phase-5": {
            "summary": "3-audience validation",
            "items": [
                { "status": "notStarted", "label": "5.1", "text": "Verify Customer ViewMode is blocked from /admin" },
                { "status": "notStarted", "label": "5.2", "text": "Verify Customer side nav renders the allowlist" },
                { "status": "notStarted", "label": "5.3", "text": "Verify Operator portal is platform-operator only" }
            ]
        },
        "phase-6": {
            "summary": "Validation and outcomes",
            "items": [
                { "status": "notStarted", "label": "6.1", "text": "Add Playwright visual regression snapshots" },
                { "status": "notStarted", "label": "6.2", "text": "Add Storybook entries for feedback components" },
                { "status": "notStarted", "label": "6.3", "text": "Capture baseline support and error metrics" },
                { "status": "notStarted", "label": "6.4", "text": "Record business-goals outcome entry after release" }
            ]
        },
        "cross-cutting": {
            "summary": "Documentation and instructions",
            "items": [
                { "status": "notStarted", "label": "X.1", "text": "Update .github/copilot-instructions.md section 10" },
                { "status": "notStarted", "label": "X.2", "text": "Update design skill file" },
                { "status": "notStarted", "label": "X.3", "text": "Add roadmap item to business-goals.json" },
                { "status": "notStarted", "label": "X.4", "text": "Add user stories US-009 through US-015 to business-goals.json" }
            ]
        }
    }
};