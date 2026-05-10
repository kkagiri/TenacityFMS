# FMS Project Dependency Context

This document is the ASCII companion to `project-dependency-context.mmd`. It summarizes the current workspace context using project names and dependency edges discovered from `.csproj` `ProjectReference` entries plus frontend API client configuration.

## High-Level Runtime Context

```text
+----------------------------------------------------------------------------------+
|                                  Frontend clients                                 |
|                                                                                  |
|  apps/fms.frontend        apps/FMS.Admin        apps/fms.mobile                  |
|  Main FMS React app       Admin/operator app    React Native app                 |
|          \                      |                    /                           |
|           \                     |                   /                            |
|            +--------------------+------------------+                             |
|                                 |                                                |
|                       HTTP /api and /api/v1                                     |
|                                 |                                                |
|                         apps/FMS.WebClient                                      |
|                         Main .NET API host                                      |
|                                 |                                                |
|       +-------------------------+-------------------------+                      |
|       |                         |                         |                      |
| packages/FMS.Application  packages/FMS.Infrastructure   Device platform packages |
| CQRS, features, DTOs      integrations and services     abstractions/core/etc.   |
|       |                         |                         |                      |
|       +------------+------------+-------------------------+                      |
|                    |                                                           |
|          packages/FMS.Persistence                                                |
|          EF data access, GPSDataContext                                          |
|                    |                                                           |
|          packages/FMS.Domain                                                     |
|          domain entities and core models                                         |
|                    |                                                           |
|             MySQL operational database                                           |
+----------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------+
|                         Background and device process hosts                       |
|                                                                                  |
| services/FMS.BackgroundServices                                                  |
|   -> packages/FMS.Application                                                    |
|   -> packages/FMS.Persistence                                                    |
|                                                                                  |
| services/FMS.Devices.Tracking.Host                                               |
|   -> packages/FMS.Application                                                    |
|   -> packages/FMS.Devices.Core                                                   |
|   -> packages/FMS.Devices.Tracking                                               |
|   -> packages/FMS.Persistence                                                    |
|   -> RabbitMQ / tracking provider APIs                                           |
|                                                                                  |
| services/FMS.PTS.WindowsService                                                  |
|   -> packages/FMS.Application                                                    |
|   -> packages/FMS.Domain                                                         |
|   -> packages/FMS.Infrastructure                                                 |
|   -> services/FMS.BackgroundServices                                             |
|   -> packages/FMS.Devices.Fueling                                                |
|   -> Redis / PTS fueling devices                                                 |
+----------------------------------------------------------------------------------+

+----------------------------------------------------------------------------------+
|                              Sales bounded context                               |
|                                                                                  |
| apps/FMS.Landing                  apps/FMS.Admin                                 |
| Public sales/onboarding flows     Operator sales/admin flows                     |
|          \                              /                                        |
|           \                            /                                         |
|            +--------------------------+                                          |
|                         |                                                        |
|                         v                                                        |
| FMS.Sales/FMS.Sales.Api                                                          |
|          |                                                                       |
|          +--> FMS.Sales/FMS.Sales.Application --> FMS.Sales/FMS.Sales.Domain     |
|          |                                                                       |
|          +--> FMS.Sales/FMS.Sales.Persistence --> Sales database                 |
+----------------------------------------------------------------------------------+
```

## Frontend To Backend Entry Points

| Client project      | Backend target                                            | Notes                                                                                                                                                    |
| ------------------- | --------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/fms.frontend` | `apps/FMS.WebClient`                                      | Uses `src/api/axiosInstance.js`; API base is resolved from `REACT_APP_*` variables, local dev `http://localhost:7009/api/`, or window origin `/api`.     |
| `apps/FMS.Admin`    | `apps/FMS.WebClient`, target `FMS.Sales/FMS.Sales.Api`    | Current admin APIs use `src/api/apiClient.ts` with `VITE_FMS_API_URL` or `/api`. Sales admin workflows should call `FMS.Sales.Api`.                      |
| `apps/fms.mobile`   | `apps/FMS.WebClient`                                      | Uses `API_CONFIG.BASE_URL`, defaults around `http://localhost:5000/api`, and calls `/api/v1/...` endpoints plus SignalR hubs.                            |
| `apps/FMS.Landing`  | target `FMS.Sales/FMS.Sales.Api`, configured login target | `.env` defines `VITE_SALES_API_URL` for plans, currencies, onboarding/contact/demo submissions. `VITE_APP_LOGIN_URL` redirects to the authenticated app. |

## Main FMS Project References

| Project                              | Direct project references                                                                                                                                                                                                       |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/FMS.WebClient`                 | `packages/FMS.Application`, `packages/FMS.Infrastructure`, `services/FMS.BackgroundServices`, `packages/FMS.Devices.Abstractions`, `packages/FMS.Devices.Core`, `packages/FMS.Devices.Fueling`, `packages/FMS.Devices.Tracking` |
| `services/FMS.BackgroundServices`    | `packages/FMS.Application`, `packages/FMS.Persistence`                                                                                                                                                                          |
| `services/FMS.Devices.Tracking.Host` | `packages/FMS.Application`, `packages/FMS.Devices.Core`, `packages/FMS.Devices.Tracking`, `packages/FMS.Persistence`                                                                                                            |
| `services/FMS.PTS.WindowsService`    | `packages/FMS.Application`, `packages/FMS.Domain`, `packages/FMS.Infrastructure`, `services/FMS.BackgroundServices`, `packages/FMS.Devices.Fueling`                                                                             |
| `packages/FMS.Application`           | `packages/FMS.Devices.Abstractions`, `packages/FMS.Domain`, `packages/FMS.Persistence`                                                                                                                                          |
| `packages/FMS.Persistence`           | `packages/FMS.Domain`                                                                                                                                                                                                           |
| `packages/FMS.Infrastructure`        | `packages/FMS.Domain`, `packages/FMS.Application`, `packages/FMS.Devices.Tracking`, `packages/FMS.Persistence`                                                                                                                  |

## Device Platform Project References

| Project                         | Direct project references                                                                                                                       |
| ------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `packages/FMS.Devices.Core`     | `packages/FMS.Devices.Abstractions`, `packages/FMS.Domain`, `packages/FMS.Persistence`                                                          |
| `packages/FMS.Devices.Fueling`  | `packages/FMS.Devices.Abstractions`, `packages/FMS.Devices.Core`, `packages/FMS.Application`, `packages/FMS.Domain`, `packages/FMS.Persistence` |
| `packages/FMS.Devices.Tracking` | `packages/FMS.Devices.Abstractions`, `packages/FMS.Application`, `packages/FMS.Domain`, `packages/FMS.Persistence`                              |

## Sales Project References

| Project                           | Direct project references                                                                          |
| --------------------------------- | -------------------------------------------------------------------------------------------------- |
| `FMS.Sales/FMS.Sales.Api`         | `FMS.Sales/FMS.Sales.Domain`, `FMS.Sales/FMS.Sales.Application`, `FMS.Sales/FMS.Sales.Persistence` |
| `FMS.Sales/FMS.Sales.Application` | `FMS.Sales/FMS.Sales.Domain`                                                                       |
| `FMS.Sales/FMS.Sales.Persistence` | `FMS.Sales/FMS.Sales.Domain`, `FMS.Sales/FMS.Sales.Application`                                    |

## Sales API Usage Status

| Client project     | Intended Sales API usage                                                                                                                                                | Current code evidence                                                                                                                                                                           |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/FMS.Landing` | Should call `FMS.Sales/FMS.Sales.Api` for public pricing, currencies, contact requests, onboarding, and demo submissions.                                               | Environment files define `VITE_SALES_API_URL=http://localhost:5101`; current page code still appears to use local/static pricing and onboarding state rather than a dedicated Sales API client. |
| `apps/FMS.Admin`   | Should call `FMS.Sales/FMS.Sales.Api` for operator/admin sales workflows such as plans, subscriptions, leads, sales onboarding, or customer acquisition administration. | Current admin code primarily calls `apps/FMS.WebClient` operator endpoints through `src/api/apiClient.ts`; no dedicated Sales API client was found in `apps/FMS.Admin/src`.                     |

Interpretation: `FMS.Sales.Api` is the correct bounded-context backend for Sales workflows, but the frontend clients may still need explicit API-client wiring where those workflows are implemented.

## Layer Naming Summary

| Layer                     | Projects                                                                                                                          |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Frontend clients          | `apps/fms.frontend`, `apps/FMS.Admin`, `apps/FMS.Landing`, `apps/fms.mobile`                                                      |
| API hosts                 | `apps/FMS.WebClient`, `FMS.Sales/FMS.Sales.Api`                                                                                   |
| Process hosts             | `services/FMS.BackgroundServices`, `services/FMS.Devices.Tracking.Host`, `services/FMS.PTS.WindowsService`                        |
| Main application layer    | `packages/FMS.Application`                                                                                                        |
| Main domain layer         | `packages/FMS.Domain`                                                                                                             |
| Main persistence layer    | `packages/FMS.Persistence`                                                                                                        |
| Main infrastructure layer | `packages/FMS.Infrastructure`                                                                                                     |
| Device platform           | `packages/FMS.Devices.Abstractions`, `packages/FMS.Devices.Core`, `packages/FMS.Devices.Fueling`, `packages/FMS.Devices.Tracking` |
| Sales bounded context     | `FMS.Sales/FMS.Sales.Api`, `FMS.Sales/FMS.Sales.Application`, `FMS.Sales/FMS.Sales.Domain`, `FMS.Sales/FMS.Sales.Persistence`     |
| Tests                     | `tests/FMS.Testing` references main FMS packages and device packages.                                                             |

## Project Details

This section explains what each project does, what it contains, and how it fits into the dependency context.

### Frontend Projects

#### `apps/fms.frontend`

Main authenticated FMS web application used by normal system users. This is the operational React application for fleet, fuel, tank stock, reporting, dashboards, administration pages, and real-time user workflows.

Contains:

| Area                                        | Purpose                                                                       |
| ------------------------------------------- | ----------------------------------------------------------------------------- |
| `src/api/`                                  | Shared HTTP client setup, including `axiosInstance.js` for backend API calls. |
| `src/components/`                           | Reusable React UI components used across pages.                               |
| `src/pages/`                                | Main feature pages and admin pages.                                           |
| `src/layouts/`                              | Application shell layouts, side navigation, and top navigation structure.     |
| `src/redux/`                                | Redux store, slices, and state management.                                    |
| `src/services/`, `src/dataservice/`         | Frontend business/API service wrappers.                                       |
| `src/hooks/`, `src/contexts/`, `src/utils/` | Shared hooks, context providers, and utility functions.                       |
| `src/signalR/`                              | Real-time SignalR client integration.                                         |
| `src/styles/`, `src/themes/`, SCSS files    | Application styling and theme integration.                                    |

Context role:

- Calls `apps/FMS.WebClient` through `/api` and `/api/v1` endpoints.
- Receives live updates through SignalR hubs exposed by the backend.
- Depends on backend permissions and JWT/session behavior for authenticated user flows.

#### `apps/FMS.Admin`

Separate React/Vite TypeScript admin/operator application. It is focused on platform administration workflows such as operator login and tenant management.

Contains:

| Area                       | Purpose                                                         |
| -------------------------- | --------------------------------------------------------------- |
| `src/api/`                 | Admin-specific Axios client. Uses `VITE_FMS_API_URL` or `/api`. |
| `src/pages/`               | Admin pages such as login, tenant lists, and tenant details.    |
| `src/layouts/`             | Admin shell layout and navigation structure.                    |
| `src/routes/`              | Admin routing configuration.                                    |
| `src/store/`               | Admin app state management.                                     |
| `src/styles/`              | Admin styling and shell theme files.                            |
| `src/types/`, `src/utils/` | Shared TypeScript types and utility helpers.                    |

Context role:

- Calls `apps/FMS.WebClient` with `API-Version: v1`.
- Uses operator/admin authentication, storing the admin token client-side.
- Uses `apps/FMS.WebClient` for core tenant/operator APIs.
- Should use `FMS.Sales/FMS.Sales.Api` for Sales bounded-context administration such as plans, subscriptions, sales onboarding, leads, demos, or customer acquisition workflows.

#### `apps/FMS.Landing`

Public-facing landing/marketing application. This is separate from authenticated FMS workflows.

Contains:

| Area                          | Purpose                                                      |
| ----------------------------- | ------------------------------------------------------------ |
| `src/components/`             | Public site layout and reusable marketing components.        |
| `src/pages/`                  | Landing, pricing, placeholder, and public information pages. |
| `src/App.jsx`, `src/main.jsx` | Vite React app entry points.                                 |
| `src/styles.css`              | Landing app styling.                                         |

Context role:

- Should call `FMS.Sales/FMS.Sales.Api` for public sales flows such as pricing plans, currencies, contact requests, onboarding, and demo submissions.
- Has `VITE_SALES_API_URL` configured in the landing environment files as the Sales API base URL.
- Redirects users to the authenticated app through `VITE_APP_LOGIN_URL`.
- Is not part of the core authenticated FMS runtime path unless a user signs in or opens the app.

#### `apps/fms.mobile`

React Native mobile application for field/mobile FMS workflows. It integrates with the same backend API and SignalR endpoints used by the web apps.

Contains:

| Area                                           | Purpose                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------- |
| `src/screens/`                                 | Mobile screens and feature flows.                                               |
| `src/navigation/`                              | React Native navigation setup.                                                  |
| `src/services/`                                | Mobile API, SignalR, pump control, issue tracker, and feature service wrappers. |
| `src/redux/`                                   | Mobile state management.                                                        |
| `src/hooks/`                                   | Mobile-specific reusable hooks.                                                 |
| `src/config/`, `src/constants/`                | API base URL and application constants.                                         |
| `src/components/`, `src/assets/`, `src/utils/` | Shared mobile UI components, static assets, and utilities.                      |

Context role:

- Calls `apps/FMS.WebClient` through `API_CONFIG.BASE_URL`, commonly ending in `/api`.
- Uses `/api/v1/...` endpoints for mobile workflows.
- Connects to SignalR hubs such as vehicle tracking for real-time updates.

#### `apps/Themetemplate`

Theme source/reference material used during frontend theme alignment. It is not shown as a runtime client in the dependency diagram because it does not call the backend as an application.

Contains:

| Area               | Purpose                                                                     |
| ------------------ | --------------------------------------------------------------------------- |
| Theme source files | Reference assets, layouts, styles, and examples from the selected template. |

Context role:

- Provides visual/layout reference material for `apps/fms.frontend` and `apps/FMS.Admin`.
- Should not be treated as a production API client or backend dependency.

### Backend API And Host Projects

#### `apps/FMS.WebClient`

Main .NET API host for the FMS platform. This is the central backend entry point used by the React apps and mobile app.

Contains:

| Area                                   | Purpose                                                                                 |
| -------------------------------------- | --------------------------------------------------------------------------------------- |
| `Controllers/`                         | HTTP API controllers exposed to frontend and mobile clients.                            |
| `Program.cs`                           | Application startup, dependency injection, middleware, and host configuration.          |
| `Extensions/`                          | Startup and service configuration extensions, including logging configuration patterns. |
| `Middleware/`                          | Request pipeline middleware.                                                            |
| `Signal/`                              | SignalR-related backend integration.                                                    |
| `Services/`, `Helper/`, `Util/`        | Web-host-specific services and helpers.                                                 |
| `Models/`, `Constants/`, `Attributes/` | Web API models, constants, and attributes.                                              |
| `wwwroot/`, `Pages/`, `App_Data/`      | Static/runtime web host assets and app data.                                            |

Context role:

- Receives HTTP requests from `apps/fms.frontend`, `apps/FMS.Admin`, and `apps/fms.mobile`.
- Hosts API controllers and SignalR endpoints.
- References `FMS.Application` for business workflows, `FMS.Infrastructure` for external integrations, `FMS.BackgroundServices` for background components, and device packages for provider-related capabilities.

#### `services/FMS.BackgroundServices`

Background processing project for scheduled, asynchronous, and long-running FMS jobs.

Contains:

| Area                                   | Purpose                                         |
| -------------------------------------- | ----------------------------------------------- |
| `Dashboard/`                           | Dashboard-related background processing.        |
| `IssueTracker/`                        | Background jobs for issue tracker workflows.    |
| `Notification/`                        | Notification background work.                   |
| `TankReconciliation/`, `TankStock/`    | Fuel/tank stock background processing.          |
| `VehicleTracking/`                     | Vehicle tracking background services.           |
| `TransferReminderBackgroundService.cs` | Transfer reminder job implementation.           |
| `FMS/`                                 | Shared background service assets/configuration. |

Context role:

- Runs backend work outside normal HTTP request/response flows.
- Depends on `FMS.Application` for business logic and `FMS.Persistence` for data access.
- Is referenced by `apps/FMS.WebClient` and `services/FMS.PTS.WindowsService`.

#### `services/FMS.Devices.Tracking.Host`

Worker host for vehicle tracking device processing.

Contains:

| Area                   | Purpose                                                                         |
| ---------------------- | ------------------------------------------------------------------------------- |
| `Program.cs`           | Worker startup and dependency registration.                                     |
| `SystemTenantScope.cs` | Tenant scope support for system-level tracking processing.                      |
| `.csproj` references   | Pulls in application, persistence, device core, and tracking provider packages. |

Context role:

- Runs tracking provider processing separate from the main web API host.
- Uses `FMS.Devices.Core` and `FMS.Devices.Tracking` for provider registry/routing and tracking provider implementations.
- Uses `FMS.Persistence` and `FMS.Application` to persist and process tracking data.
- Connects conceptually to RabbitMQ and external tracking provider APIs.

#### `services/FMS.PTS.WindowsService`

Windows Service host for PTS/fueling device workflows. It is currently part of the fueling runtime path and references both legacy and newer device-provider layers.

Contains:

| Area                       | Purpose                             |
| -------------------------- | ----------------------------------- |
| `Program.cs`               | Windows Service startup.            |
| `Core/`                    | Core service runtime pieces.        |
| `Infrastructure/`          | Service infrastructure concerns.    |
| `Models/`                  | Host-specific runtime models.       |
| `Scripts/`                 | Supporting scripts for the service. |
| `Logs/`                    | Local logging output area.          |
| `appsettings.example.json` | Example service configuration.      |

Context role:

- Runs PTS/fueling communication outside the main web API process.
- References `FMS.Devices.Fueling` for fueling provider functionality.
- References `FMS.Application`, `FMS.Domain`, `FMS.Infrastructure`, and `FMS.BackgroundServices` for orchestration, business rules, and supporting services.
- Connects conceptually to Redis command channels and PTS fueling devices.

### Main Clean Architecture Packages

#### `packages/FMS.Application`

Main application/business layer. This is where most FMS use cases, CQRS handlers, feature services, DTOs, validation, and business workflows live.

Contains:

| Area                                                 | Purpose                                                                                                                                                     |
| ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Features/`                                          | Preferred feature-oriented CQRS structure for domains, commands, queries, DTOs, services, and validators.                                                   |
| `Command/`, `Queries/`, `Handlers/`                  | Existing command/query/handler code, including legacy organization patterns.                                                                                |
| `Dtos/`, `ModelsDTOs/`                               | Application data transfer objects.                                                                                                                          |
| `Services/`, `CommonInterface/`                      | Application services and interfaces.                                                                                                                        |
| `Events/`                                            | Application events and event-related contracts.                                                                                                             |
| `MappingProfile/`                                    | AutoMapper mapping profiles.                                                                                                                                |
| `Validation/`                                        | Validation logic.                                                                                                                                           |
| `Communication/`, `PTSServices/`                     | Existing communication/fueling-related application code. Some device architecture guidance now prefers moving transport/protocol code into `FMS.Devices.*`. |
| `Configuration/`, `Extensions/`, `Helpers/`, `Util/` | Supporting application configuration and utilities.                                                                                                         |

Context role:

- Owns the main FMS business workflows.
- Depends on `FMS.Domain` for entities/core models, `FMS.Persistence` for data access, and `FMS.Devices.Abstractions` for device provider contracts.
- Is consumed by the main API host, background services, tracking host, fueling service, and device packages.

#### `packages/FMS.Domain`

Main domain model package. This is the source of truth for domain entities and core domain concepts.

Contains:

| Area              | Purpose                                                         |
| ----------------- | --------------------------------------------------------------- |
| `Entities/`       | Domain entities used across application and persistence layers. |
| `Events/`         | Domain events.                                                  |
| `PTSCommon/`      | PTS-related domain/common models.                               |
| `TankTransfer.cs` | Domain model/code related to tank transfer behavior.            |

Context role:

- Sits at the core of the main FMS dependency graph.
- Referenced by `FMS.Application`, `FMS.Persistence`, `FMS.Infrastructure`, device packages, and service hosts.
- Should not depend on application, persistence, infrastructure, web, or frontend projects.
- Requires explicit approval before modification because it impacts the entire system.

#### `packages/FMS.Persistence`

Main persistence/data access package. This is where EF/database access and entity configuration live.

Contains:

| Area                    | Purpose                                                                     |
| ----------------------- | --------------------------------------------------------------------------- |
| `DataAccess/`           | Database context and data access code, including `GPSDataContext` patterns. |
| `EntityConfigurations/` | Entity Framework configuration classes.                                     |
| `Configuration/`        | Persistence configuration.                                                  |
| `Migrations/`           | Database migrations.                                                        |
| `Models/`               | Persistence-specific models.                                                |
| `FactoryPattern/`       | Persistence factory patterns.                                               |

Context role:

- Implements data access for the main FMS operational database.
- Depends on `FMS.Domain` for entity definitions.
- Is consumed by `FMS.Application`, `FMS.Infrastructure`, background services, device hosts, and device provider packages.

#### `packages/FMS.Infrastructure`

Infrastructure integration layer for external services and infrastructure-specific implementations.

Contains:

| Area                | Purpose                                                                 |
| ------------------- | ----------------------------------------------------------------------- |
| `ExternalServices/` | Integration code for external APIs/services.                            |
| `Services/`         | Infrastructure service implementations.                                 |
| `VehicleTracking/`  | Vehicle tracking infrastructure integrations and provider-related code. |

Context role:

- Provides concrete integration code that supports application workflows.
- References `FMS.Application`, `FMS.Domain`, `FMS.Persistence`, and `FMS.Devices.Tracking`.
- Is referenced by `apps/FMS.WebClient` and `services/FMS.PTS.WindowsService`.

### Device Platform Packages

#### `packages/FMS.Devices.Abstractions`

Shared device-provider contracts. This package defines interfaces and canonical contracts used by provider implementations and consumers.

Contains:

| Area        | Purpose                                             |
| ----------- | --------------------------------------------------- |
| `Common/`   | Common provider abstractions and shared contracts.  |
| `Fueling/`  | Fueling device interfaces and contracts.            |
| `Tracking/` | Vehicle tracking provider interfaces and contracts. |
| `Hosting/`  | Hosting-related abstractions.                       |

Context role:

- Lowest-level device package used by application and device provider packages.
- Enables the application to depend on provider contracts rather than vendor-specific implementations.

#### `packages/FMS.Devices.Core`

Core device platform infrastructure. This package provides provider registry, routing, health, and persistence support for the device provider architecture.

Contains:

| Area                   | Purpose                                            |
| ---------------------- | -------------------------------------------------- |
| `DependencyInjection/` | Device core DI registration.                       |
| `Registry/`            | Provider registry and discovery support.           |
| `Routing/`             | Device message routing.                            |
| `Health/`              | Provider health monitoring.                        |
| `Persistence/`         | Device/provider configuration persistence support. |

Context role:

- Builds on `FMS.Devices.Abstractions`.
- Depends on `FMS.Domain` and `FMS.Persistence` for tenant/provider mapping and storage-related concerns.
- Used by `apps/FMS.WebClient`, `services/FMS.Devices.Tracking.Host`, and `FMS.Devices.Fueling`.

#### `packages/FMS.Devices.Fueling`

Fueling device provider package. This is the target location for fueling provider implementations, protocol parsing, commands, channels, and PTS-related provider logic.

Contains:

| Area                   | Purpose                                                         |
| ---------------------- | --------------------------------------------------------------- |
| `DependencyInjection/` | Fueling provider DI registration.                               |
| `Providers/`           | Fueling provider implementations such as PTS-related providers. |

Context role:

- Encapsulates fueling device provider behavior.
- References device abstractions/core plus application, domain, and persistence layers.
- Used by `apps/FMS.WebClient` and `services/FMS.PTS.WindowsService`.
- Connects conceptually to Redis and PTS fueling devices.

#### `packages/FMS.Devices.Tracking`

Vehicle tracking device provider package. This is the target location for tracking provider implementations and tracking integration channels.

Contains:

| Area                   | Purpose                                                              |
| ---------------------- | -------------------------------------------------------------------- |
| `DependencyInjection/` | Tracking provider DI registration.                                   |
| `Providers/`           | Tracking provider implementations such as GPS provider integrations. |
| `Legacy/`              | Existing/legacy tracking integration code retained during migration. |

Context role:

- Encapsulates tracking provider behavior.
- References `FMS.Devices.Abstractions`, `FMS.Application`, `FMS.Domain`, and `FMS.Persistence`.
- Used by `apps/FMS.WebClient`, `services/FMS.Devices.Tracking.Host`, and `FMS.Infrastructure`.
- Connects conceptually to RabbitMQ and external tracking vendors such as GPSGate/GPSWox.

### Sales Bounded Context Projects

#### `FMS.Sales/FMS.Sales.Api`

API host for the Sales bounded context. This is separate from the main FMS API host.

Contains:

| Area                 | Purpose                                                 |
| -------------------- | ------------------------------------------------------- |
| `Program.cs`         | Sales API startup and dependency registration.          |
| `appsettings*.json`  | Sales API configuration files.                          |
| `FMS.Sales.Api.http` | HTTP request scratch/test file for Sales API endpoints. |
| `Properties/`        | Project launch/settings metadata.                       |

Context role:

- Exposes Sales API behavior.
- References `FMS.Sales.Domain`, `FMS.Sales.Application`, and `FMS.Sales.Persistence`.
- Should be consumed by `apps/FMS.Landing` for public sales/onboarding flows and by `apps/FMS.Admin` for operator/admin sales management flows.

#### `FMS.Sales/FMS.Sales.Application`

Application layer for Sales workflows.

Contains:

| Area                                             | Purpose                                                            |
| ------------------------------------------------ | ------------------------------------------------------------------ |
| `Common/`                                        | Shared Sales application abstractions and common code.             |
| `SalesApplicationServiceCollectionExtensions.cs` | Dependency injection registration for the Sales application layer. |

Context role:

- Implements Sales business use cases.
- Depends on `FMS.Sales.Domain`.
- Is referenced by `FMS.Sales.Api` and `FMS.Sales.Persistence`.

#### `FMS.Sales/FMS.Sales.Domain`

Domain layer for the Sales bounded context.

Contains:

| Area        | Purpose                    |
| ----------- | -------------------------- |
| `Entities/` | Sales domain entities.     |
| `Enums/`    | Sales domain enumerations. |

Context role:

- Core model for Sales.
- Referenced by Sales API, Application, and Persistence projects.
- Separate from the main `packages/FMS.Domain` package.

#### `FMS.Sales/FMS.Sales.Persistence`

Persistence layer for Sales data access.

Contains:

| Area                                             | Purpose                                                  |
| ------------------------------------------------ | -------------------------------------------------------- |
| `SalesDbContext.cs`                              | Sales EF database context.                               |
| `SalesDbContextFactory.cs`                       | Design-time/runtime context factory support.             |
| `Configurations/`                                | Sales entity configuration classes.                      |
| `Migrations/`                                    | Sales database migrations.                               |
| `Seeding/`                                       | Sales seed data/setup logic.                             |
| `SalesPersistenceServiceCollectionExtensions.cs` | Dependency injection registration for Sales persistence. |

Context role:

- Persists Sales bounded-context data.
- References `FMS.Sales.Domain` and `FMS.Sales.Application`.
- Is referenced by `FMS.Sales.Api`.

### Test Project

#### `tests/FMS.Testing`

Automated test project for the main FMS solution and device packages.

Contains:

| Area              | Purpose                                                                                                         |
| ----------------- | --------------------------------------------------------------------------------------------------------------- |
| Test source files | Unit/integration tests and verification code for application, persistence, infrastructure, and device behavior. |

Context role:

- References `FMS.Application`, `FMS.Domain`, `FMS.Persistence`, `FMS.Infrastructure`, and device packages.
- Validates behavior across clean architecture layers and device-provider packages.

## Dependency Direction Guide

The practical dependency flow is:

```text
Frontend apps
	-> API hosts / process hosts
		-> Application layer
			-> Domain layer
		-> Persistence / Infrastructure / Device packages
			-> Domain layer and external systems
```

Key interpretation rules:

- Frontend projects do not reference .NET projects directly; they call API endpoints at runtime.
- `.csproj` `ProjectReference` entries are compile-time dependencies and are listed in the tables above.
- External systems such as MySQL, Redis, RabbitMQ, SignalR, PTS devices, and GPS providers are runtime dependencies, not `.csproj` references.
- `FMS.Domain` and `FMS.Sales.Domain` are core model layers for their respective bounded contexts.
- `FMS.Application` should hold use cases and business workflows; transport/protocol-heavy device code should live in `FMS.Devices.*` packages where possible.

## Notes

- The Mermaid diagram focuses on runtime context and compile-time project references. Some arrows are deployment or API-use edges, while the project reference tables list direct compile-time references.
- `packages/FMS.Domain` remains the core domain model package and should not be changed without explicit approval.
- Device transport and protocol code is expected to live under the `packages/FMS.Devices.*` provider platform packages.
