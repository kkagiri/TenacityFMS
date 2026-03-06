# Tank Stock Operations Documentation

## Overview
The Tank Stock Operations system provides comprehensive management and monitoring capabilities for fuel tank inventory, stock levels, and reconciliation processes within the FMS system.

## Features

### 1. Enhanced Tank Stock Dashboard
- **Purpose**: Mission Control-style dashboard for real-time tank monitoring
- **Key Features**:
  - Real-time tank level monitoring with SignalR integration
  - Critical alerts and emergency response capabilities
  - Site overview cards with key metrics
  - Emergency response panel for critical incidents
  - Quick actions for emergency scenarios

### 2. Stock Analytics
- **Purpose**: Advanced analytics and reporting for tank stock data
- **Key Features**:
  - Historical stock trend analysis
  - Consumption pattern analysis
  - Predictive analytics for stock levels
  - Performance metrics and KPIs

### 3. Stock Management
- **Purpose**: Comprehensive stock management operations
- **Key Features**:
  - Stock adjustments and corrections
  - Inventory management
  - Transfer operations between tanks/sites
  - Stock reconciliation workflows

### 4. Reconciliation Mission Control
- **Purpose**: Advanced reconciliation control center
- **Key Features**:
  - Real-time reconciliation monitoring
  - Automated reconciliation processes
  - Discrepancy detection and resolution
  - Reconciliation accuracy metrics

### 5. Settings
- **Purpose**: Configuration and system settings
- **Key Features**:
  - Tank monitoring thresholds
  - Alert configuration
  - System preferences
  - User access controls

## Navigation Structure

### Routes
- `/tankstock` - Main dashboard (Enhanced Tank Stock Dashboard)
- `/tankstock/dashboard` - Enhanced Tank Stock Dashboard (explicit route)
- `/tankstock/stock-analytics` - Stock Analytics
- `/tankstock/stock-management` - Stock Management
- `/tankstock/reconciliation-control` - Reconciliation Mission Control
- `/tankstock/settings` - Settings

### Direct Route Access
Each section can be accessed directly via URL:
- **Dashboard**: `/tankstock/dashboard`
- **Stock Analytics**: `/tankstock/stock-analytics`
- **Stock Management**: `/tankstock/stock-management`
- **Reconciliation Control**: `/tankstock/reconciliation-control`
- **Settings**: `/tankstock/settings`

### Navigation Helper
The system uses a navigation helper (`utils/navigationHelper.js`) to manage routes and active state detection.

## Navigation Setup

### Database Navigation Configuration

The Tank Stock Operations system follows the same navigation pattern as Task Management:

**Database Setup:**
- Only create **ONE** navigation item in the database for "Tank Stock"
- **Do NOT** create separate database entries for sub-routes (Stock Analytics, Stock Management, etc.)

**Required Database Navigation Item:**
- **Page**: `tank stock` (maps to TankStockMain in app-routes.js)
- **Link**: `/tankstock` (this is the main route path)
- **Icon**: `fa-light fa-gas-pump` (FontAwesome icon for tank stock)
- **Parent ID**: `null` (if it's a top-level item) or the ID of the appropriate parent

**Example SQL to insert the navigation item:**
```sql
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('tank stock', '/tankstock', 'fa-light fa-gas-pump', NULL);
```

### Internal Route Handling

All sub-navigation is handled internally by the TankStockMain component:

- `/tankstock` → Dashboard (default)
- `/tankstock/dashboard` → Enhanced Tank Stock Dashboard
- `/tankstock/stock-analytics` → Stock Analytics
- `/tankstock/stock-management` → Stock Management
- `/tankstock/reconciliation-control` → Reconciliation Mission Control
- `/tankstock/settings` → Settings

### Secondary Navigation

The TankStockLayout component provides a persistent sidebar navigation that remains visible when navigating between sub-sections:

- **Dashboard** - Mission Control-style overview
- **Stock Analytics** - Reporting and analysis tools
- **Stock Management** - Stock operations and adjustments
- **Reconciliation Control** - Advanced reconciliation monitoring
- **Settings** - Configuration and preferences

### Troubleshooting Navigation Issues

**Issue: "Can't access lexical declaration" error**
**Cause**: Circular imports or incorrect export/import patterns
**Solution**: Ensure only the main "tank stock" route exists in the database and Content.js

**Issue: Sub-routes not working**
**Cause**: Conflicting routes in Content.js overriding internal routing
**Solution**: Remove individual tank stock routes from Content.js, keep only wildcard routes

**Issue: Secondary navigation disappears**
**Cause**: Routes not properly nested under TankStockLayout
**Solution**: Verify all routes in TankStockMain are wrapped by TankStockLayout

### Route Configuration Files

**Content.js** - Only these routes should exist:
```javascript
<Route
  path="/tankstock"
  element={React.createElement(resolvedComponents("tank stock"))}
/>
<Route
  path="/tankstock/*"
  element={React.createElement(resolvedComponents("tank stock"))}
/>
```

**app-routes.js** - Only this mapping should exist:
```javascript
case "tank stock":
  return TankStockMain;
```

**Do NOT add** individual routes like:
- `case "stock analytics": return StockAnalytics;` ❌
- `case "stock management": return StockManagement;` ❌
- `/tankstock/stock-analytics` in Content.js ❌

All internal routing is handled by TankStockMain with React Router nested routes.

## Components Architecture

### Layout Component
- `TankStockLayout.js` - Main layout with collapsible sidebar navigation
- Features responsive design and consistent styling

### Dashboard Components
- `EnhancedTankStockDashboard.js` - Main dashboard with Mission Control integration
- `TankLevelGauge.js` - Individual tank level monitoring
- `AlertsPanel.js` - Critical alerts display
- `SiteOverviewCards.js` - Site metrics overview
- `EmergencyResponsePanel.js` - Emergency response controls

### Shared Components
- `StockMetricCard.js` - Reusable metric display component
- Various utility components for common functionality

### Toolbar Components

- `TankStockToolbar.js` - Specialized toolbar for tank stock operations
  - Stock management operations (Opening Stock, Closing Stock, Delivery, Transfer)
  - Advanced filtering with date presets and custom ranges
  - Site selection and filtering
  - Form popup management for stock operations
  - Integration with validation and submission workflows

### Form Components

All forms are fully implemented with real-time validation, Redux integration, and comprehensive styling:

- `OpeningStockForm.js` - Form for opening stock entries
  - Site and tank selection
  - Amount validation
  - Date/time picker
  - Real-time tank volume history display

- `ClosingStockForm.js` - Form for closing stock entries
  - Site and tank selection
  - Amount validation with numeric rules
  - Date/time picker with maximum date constraints
  - Tank volume history with grouping and summary calculations

- `TankDeliveryForm.js` - Form for delivery operations
  - Supplier selection and management
  - Multiple product type support
  - Quantity validation
  - Delivery documentation tracking

- `TankTransferForm.js` - Form for transfer operations
  - Inter-tank and inter-site transfer support
  - Source and destination tank selection
  - Transfer type selection (same site vs different sites)
  - Transfer amount validation
  - Transfer reason documentation
  - Source tank volume history monitoring

All forms include:

- SCSS styling with proper component organization
- DevExtreme form components integration
- Redux state management
- Real-time validation
- Responsive design with Tailwind CSS (`tw-` prefix)
- FontAwesome icons (`fa-light` prefix)
- Error handling and loading states

## Data Management

### Hooks

- `useStockData` - Shared hook for stock data management
- `useTankStockSignalR` - Real-time data updates via SignalR

### State Management

- Redux integration for global state management
- Local state for component-specific data
- SignalR for real-time updates

## Styling

- SCSS-based styling with `tw-` prefixed Tailwind classes
- Responsive design principles
- Consistent with FMS design system
- FontAwesome icons with `fa-light` prefix

## Integration Points

- SignalR for real-time updates
- Redux for state management
- Mission Control layout for enhanced dashboard
- Shared services for API communication

## Development Notes

- Components follow React functional component patterns
- Hooks are used for state management and side effects
- Error boundaries and loading states are implemented
- Responsive design for various screen sizes
- Accessibility considerations with proper ARIA labels

## Future Enhancements

- Advanced analytics with machine learning
- Mobile app integration
- Enhanced emergency response workflows
- Advanced reporting capabilities
- Integration with external fuel management systems

## Usage

The Tank Stock Operations system is accessed through the main FMS navigation under "Tank Stock". The default page is the Enhanced Tank Stock Dashboard, which provides a comprehensive overview of all tank operations with real-time monitoring capabilities.
