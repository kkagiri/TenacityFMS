# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Backend (.NET)
- **Build solution**: Open `Hyoung.Fms.sln` in Visual Studio and build, or use `dotnet build`
- **Run API**: Start `FMS.WebClient` project (listens on http://localhost:7009 and http://10.0.11.90:7009)
- **Run PTS Service**: Start `FMS.PTS.WindowsService` project for device communication
- **Tests**: Run `FMS.Testing` project via Test Explorer or `dotnet test`

### Frontend (React)
- **Install dependencies**: `npm install` in `fms.frontend/`
- **Start development**: `npm start` (runs on http://localhost:3000)
- **Build for development**: `npm run build:dev`
- **Build for production**: `npm run build:prod`
- **Build themes**: `npm run build-themes` (DevExtreme themes)

### Infrastructure
- **Start Redis**: `scripts/redis/start-redis.bat`
- **Stop Redis**: `scripts/redis/stop-redis.bat`
- **Environment setup**: `scripts/environment/setup-environment.bat`
- **Verify environment**: `scripts/verification/verify-environment.ps1`

## Architecture Overview

### Backend Architecture (Clean Architecture)
The system follows **Clean Architecture** with CQRS pattern:

- **FMS.Domain**: Core entities and business rules
- **FMS.Application**: Business logic, CQRS commands/queries, DTOs
  - Organized by **Features** (Vehicle, TankManagement, UserManagement, etc.)
  - Each feature contains Commands, Queries, DTOs, and Services
  - All responses use `FMSResponse<T>` pattern for consistent error handling
- **FMS.Persistence**: Data access layer with Entity Framework Core and MySQL
- **FMS.Infrastructure**: External service integrations
- **FMS.WebClient**: Web API controllers and SignalR hubs
- **FMS.BackgroundServices**: Background processing services
- **FMS.PTS.WindowsService**: Real-time device communication via WebSocket

### Frontend Architecture (React + Redux)
- **Technology**: React 18 + Redux + DevExtreme UI components
- **Structure**:
  - Pages organized by feature modules (`vehicles/`, `tankStock/`, `admin/`)
  - Each page contains components and hooks specific to that module
  - Comprehensive Redux store with feature-specific reducers
- **Styling**: Sass + Tailwind CSS (with `tw-` prefix) + FontAwesome icons
- **API Communication**: Axios with centralized instance configuration

### Key Features
- **CQRS Pattern**: Commands for writes, Queries for reads using MediatR
- **Feature-Based Organization**: Both backend and frontend organized by business features
- **Real-time Communication**: SignalR for live updates, WebSocket for device communication
- **Multi-tenancy**: Site-based data isolation
- **Device Integration**: PTS device communication for fuel dispensers and tank monitoring
- **Background Processing**: Automated reconciliation, notifications, and data synchronization

## Development Guidelines

### Backend Development
- **Response Pattern**: Always use `FMSResponse<T>` for API responses
- **Feature Organization**: Place new functionality in appropriate `Features/` folder
- **Validation**: Include validation checks in all commands
- **Entity Configuration**: New entities require configuration in `FMS.Persistence/EntityConfigurations/`
- **Database Changes**: Add new entities to `GpsdataContext` and create MySQL migration scripts

### Frontend Development
- **Page Structure**: Create pages in feature folders with associated components and hooks
- **State Management**: Use Redux with feature-specific actions and reducers
- **Styling**: Use Tailwind classes with `tw-` prefix and FontAwesome icons
- **API Integration**: Use centralized axios instance from `src/api/axiosInstance.js`

### Code Conventions
- **Backend**: C# naming conventions, feature-based folder structure
- **Frontend**: camelCase for JavaScript, kebab-case for CSS classes
- **Documentation**: Check `Documentation/Features/` for feature-specific implementation guides
- **Notifications**: Implement notification system for user interactions when needed

### Important Files & Patterns
- **Backend Response**: `FMS.Application/Common/FMSResponse.cs`
- **Feature Documentation**: `Documentation/Features/` folder contains implementation guides
- **Database Entities**: `FMS.Domain/Entities/` (do not create new entities without guidance)
- **Frontend Routes**: `fms.frontend/src/app-routes.js`
- **Redux Store**: `fms.frontend/src/redux/reducers/index.js`

### Environment Requirements
- **.NET 8.0**: Backend framework
- **MySQL 5.5+**: Primary database
- **Redis**: Caching and SignalR backplane (optional for development)
- **Node.js**: Frontend development

### Security Notes
- **JWT Authentication**: Token-based authentication with role-based authorization
- **Environment Variables**: All sensitive configuration stored in environment variables
- **CORS**: Configured for development and production environments
- **No Secrets in Code**: Database connections and API keys never committed

check first in documentation for similar names of the queries that might be PRD document or user flow document contains the query you are being ask for example GetTasksQuery there will be a task PRD or document related to task in teh documentation folder , check this file and see the previous structure you can update it for later  and scan the files and folders . Other system like notifications that you have to implement is a must read . ASk use if to implement notification if need be .
if you have created the file - on applying the code if there is no content do not repeat the file creation or deletetion , just continue with the execution of other files .

if a file is missing , first check  if there is the file in other folder before creating ..

Coding standards, domain knowledge, and preferences that AI should follow.
All Response for CRQS and any CRUD and Queries in returning Errors or validation checkes must use [FMSResponse.cs](mdc:FMS.Application/Common/FMSResponse.cs)
always have validation check
FMS.Application/                // Core business logic, DTOs, commands, queries, and services for the FMS system . All services ,DTO,command and quieres are to located in feature of the module
FMS.webclient/                  // Likely contains the web client API for FMS (files not yet listed) all controllers are located here
FMS.frontend/                   // Modern frontend (React/JS), Redux, UI, and client-side logic (files not yet listed)
FMS.PTS.WindowsService/         // Windows service for PTS integration and background processing (files not yet listed)
FMS.Persistence/                // Data access, repositories, and persistence logic (files not yet listed)
FMS.Deployment/                 // Deployment scripts, configs, and automation for FMS (files not yet listed)
FMS.BackgroundServices/         // Background jobs, schedulers, and hosted services (files no
documentation folder with feature .. create a file folder based on the feature being ask. if you have created a new file , update on process . if you create a new persistence that has to be saved in database entity fms.domain always make sure that its has a entity configuration file in fms .persistence and add it to gpsdatacontext , also create the myslq syntax but do not create the file holding the syntax
   if you use any class component uses Tailwind CSS add tw-
        <span className="tw-font-semibold">tw-</span> prefix to avoid conflicts
        with DevExtreme.
for font awersome icons start with "fa-light fa-icon"



use scss rather than css
if you have created the file - on applying the code if there is no content do not repeat the file eatino or deletetion , just continue with the excution of other files .


After finishing task expect for bugs write or update document in the documentation folder with feature if you have created a new file ,
update on process .if you create a new persistence that has to be saved in database entity fms.domain always make sure that its has a entity configuration file in
 fms .persistence and add it to gpsdatacontext , also create the myslq syntax and place it in the database folder in the feature folder in documentation folder but do not create the file holding the syntax



# Your rule content
all tailwind have tw- prefix
use fontawersome icon

use font awersome icon .
- You can @ files here
- You can use markdown but dont have to


in backend csharp project , if you dealing with return type check if FMSsponse.cs contain the correct response for your case
All PTSModel are in FMS.Domain.Entities project , dont create unless you are told to do so , in the onces that are there either improve based on documentation .


# FMS Frontend Architecture Guide

## Overview
The FMS Frontend is a modern React-based web application built with DevExtreme UI components, Redux for state management, and Tailwind CSS for styling. It serves as the user interface for the Fuel Management System (FMS).

## Key Technology Stack
- **React 18.2.0** - Modern React with hooks and functional components
- **DevExtreme 23.2.8** - Enterprise UI component library
- **Redux Toolkit 2.2.7** - State management
- **Tailwind CSS** - Utility-first CSS framework (with `tw-` prefix)
- **FontAwesome** - Icon library
- **Axios** - HTTP client for API communication
- **SignalR** - Real-time communication
- **SASS/SCSS** - CSS preprocessing

## Critical Files and Their Purposes

### Root Configuration Files

#### `package.json`
- **Purpose**: Defines project dependencies, scripts, and metadata
- **Key Dependencies**:
  - DevExtreme for UI components
  - Redux for state management
  - Axios for API calls
  - SignalR for real-time updates
  - Tailwind CSS for styling
- **Scripts**: Development, build, and theme compilation commands

#### `craco.config.js`
- **Purpose**: Custom webpack configuration for Create React App
- **Key Features**:
  - Tailwind CSS integration
  - PostCSS configuration
  - FontAwesome asset copying
  - Module scope plugin removal for external imports

#### `tailwind.config.js`
- **Purpose**: Tailwind CSS configuration
- **Critical Settings**:
  - `prefix: "tw-"` - Prevents conflicts with DevExtreme styles
  - `preflight: false` - Disables base style reset
  - `important: true` - Ensures Tailwind has higher specificity

#### Environment Files
- `.env`, `.env.development`, `.env.production`
- **Purpose**: Environment-specific configuration
- **Contains**: API URLs, feature flags, build settings

### Core Application Files

#### `src/App.js`
- **Purpose**: Root application component
- **Key Features**:
  - Theme and CSS imports (DevExtreme + custom)
  - FontAwesome setup
  - Redux store provider wrapper
  - Authentication routing logic
  - Error boundary implementation

#### `src/store.js`
- **Purpose**: Redux store configuration
- **Features**:
  - Redux Toolkit configuration
  - Thunk middleware for async actions
  - Development tools integration
  - Mutation checking in development

#### `src/Content.js`
- **Purpose**: Main content router and layout wrapper
- **Key Features**:
  - Dynamic route generation from navigation items
  - Role-based route protection
  - Layout component wrapping
  - Navigation integration

#### `src/app-routes.js`
- **Purpose**: Route definitions and component mapping
- **Features**:
  - Centralized route configuration
  - Lazy loading component imports
  - Page component organization

### API and Communication

#### `src/api/axiosInstance.js`
- **Purpose**: Centralized HTTP client configuration
- **Features**:
  - Environment-based API URL determination
  - Request/response interceptors
  - Authentication token handling
  - Error handling middleware

#### `src/api/axiosInstanceGPSGate.js`
- **Purpose**: Dedicated HTTP client for GPSGate integration
- **Features**: Specialized configuration for external GPS system

#### `proxyServer.js`
- **Purpose**: Development proxy server for CORS and API routing
- **Features**:
  - CORS header management
  - API request proxying during development

### State Management (Redux)

#### `src/redux/`
- **Structure**:
  - `actions/` - Redux action creators
  - `reducers/` - State reducers
  - `selectors/` - State selectors
  - `types/` - Action type constants
- **Purpose**: Centralized application state management

### Services Layer

#### `src/services/`
- **Purpose**: Business logic and API service abstractions
- **Key Files**:
  - `taskService.js` - Task management operations
  - `pumpControlService.js` - Pump control operations
  - `automatedReconciliationService.js` - Reconciliation logic
  - `axiosConfig.js` - Service-level HTTP configuration

### Utility Functions

#### `src/utils/`
- **Purpose**: Shared utility functions and helpers
- **Key Files**:
  - `dateUtils.js` - Date formatting and manipulation
  - `enums.js` - Application constants and enumerations
  - `media-query.js` - Responsive design utilities
  - `withRoleProtection.js` - HOC for role-based access control
  - `navigationHelper.js` - Navigation utilities

### Context Providers

#### `src/contexts/`
- **Purpose**: React context providers for shared state
- **Key Files**:
  - `authContext.js` - Authentication context
  - `navigation.js` - Navigation context

### Custom Hooks

#### `src/hooks/`
- **Purpose**: Reusable React hooks for complex logic
- **Key Files**:
  - `useDeviceData.js` - Device data management
  - `useStockManagement.js` - Stock management operations
  - `useTankStockSignalR.js` - Real-time tank stock updates

### Styling and Theming

#### `src/dx-styles.scss`
- **Purpose**: DevExtreme style customizations
- **Features**: Custom theme overrides and component styling

#### `src/themes/`
- **Purpose**: DevExtreme theme generation and metadata
- **Files**: Generated theme CSS and metadata JSON files

#### `src/variables.scss`
- **Purpose**: Global SCSS variables and mixins
- **Features**: Color schemes, spacing, and reusable styles

### SignalR Integration

#### `src/signalR/`
- **Purpose**: Real-time communication setup
- **Features**: WebSocket connection management for live updates

## Important Conventions

### Styling Rules
1. **Tailwind Classes**: Always use `tw-` prefix (e.g., `tw-font-semibold`)
2. **SCSS Preferred**: Use SCSS over CSS for styling
3. **FontAwesome Icons**: Start with `"fa-light fa-icon"` pattern

### File Organization
1. **Feature-Based**: Components organized by business feature
2. **Shared Resources**: Common utilities in dedicated folders
3. **API Layer**: Centralized in `api/` and `services/` directories

### Development Workflow
1. **Environment Setup**: Use provided batch scripts for environment configuration
2. **Theme Building**: DevExtreme themes must be built before development
3. **Proxy Usage**: Development proxy handles CORS and API routing

## Configuration Notes

### DevExtreme Integration
- Custom theme generation in `themes/` folder
- Component imports from `devextreme-react`
- Style overrides in `dx-styles.scss`

### API Communication
- Environment-based URL switching
- Automatic authentication token handling
- Centralized error handling

### Real-time Features
- SignalR for live data updates
- Tank stock monitoring
- Device status updates

## Mobile Compatibility and Responsive Design

### Mobile Layout Requirements
All FMS layout components must follow proper mobile responsiveness patterns to ensure functionality across all device sizes.

### Critical Mobile Implementation Pattern
When implementing sidebar layouts, use the following proven pattern:

```scss
// Desktop-first approach with proper mobile overrides
@media (max-width: 768px) {
  .layout-container {
    @apply tw-flex-col;  // Stack vertically on mobile
  }

  .sidebar {
    @apply tw-w-full tw-h-auto tw-static;  // Full width, normal flow

    &.collapsed {
      @apply tw-w-full tw-h-16 tw-overflow-hidden;  // Height-based collapsing
    }
  }
}
```

### Common Mobile Issues to Avoid
1. **Width-based collapsing**: Never use `width: 0` for mobile sidebar collapse
2. **Absolute positioning**: Avoid `position: absolute` for mobile sidebars
3. **Hidden collapse buttons**: Always ensure collapse functionality remains accessible

### Reference Implementation
- **Working Example**: TankStock Layout (`pages/tankStock/layout/`)
- **Fixed Examples**: TaskManagement and Notification layouts
- **Documentation**: See `Documentation/Frontend/MobileCompatibilityGuide.md` for detailed implementation guide

### Best Practices for Developers

1. **Always use the `tw-` prefix** for Tailwind classes to avoid DevExtreme conflicts
2. **Follow the established folder structure** for new features
3. **Use the provided axios instances** for API calls
4. **Implement role-based protection** for new routes using `withRoleProtection`
5. **Utilize existing services** before creating new API calls
6. **Follow SCSS conventions** and use the variables file for consistency
7. **Test mobile responsiveness** on all new layout components
8. **Use height-based collapsing** for mobile sidebar implementations

This architecture provides a scalable, maintainable foundation for the FMS frontend application with clear separation of concerns and modern React patterns.