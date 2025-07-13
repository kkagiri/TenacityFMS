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
