# Customizable Dashboard Ticker System - Technical Documentation

## 📋 Overview

The Customizable Dashboard Ticker System allows users to personalize their dashboard experience by configuring which data widgets (tickers) they want to see, how they want to filter the data, and in what order they appear. This system provides role-based defaults while allowing individual customization.

## 🎯 Goals

- **Categorized Organization**: Organize dashboard widgets into logical categories (Active Alarms, Key Statistics, Performance Metrics, Fuel Management)
- **Personalization**: Allow users to customize their dashboard according to their workflow within each category
- **Efficiency**: Show only relevant data to reduce cognitive load with category-based filtering
- **Flexibility**: Support different data sources with configurable filters per category and widget
- **Performance**: Optimize data loading by fetching only enabled widgets within enabled categories
- **Role-Based**: Provide sensible defaults based on user roles with category-level permissions

## 🏗️ System Architecture

### Categorized Dashboard Model

```text
User Login → Load Category Preferences → Apply Configuration → Render Dashboard Categories
     ↓              ↓                        ↓                    ↓
Role Check → Merge Category Defaults → Filter Category Widgets → Start Refresh Cycles
```

### Category-Based Component Hierarchy

```text
DashboardContainer
├── PreferencesProvider (Context)
├── CategoryContainer (Active Alarms)
│   ├── AlarmStatisticsTicker
│   ├── RecentAlarmsTicker
│   ├── CriticalAlarmsTicker
│   └── AlarmTrendsTicker
├── CategoryContainer (Key Statistics)
│   ├── TankLevelsTicker
│   ├── TransactionsTicker
│   ├── VolumeTicker
│   └── EfficiencyTicker
├── CategoryContainer (Performance Metrics)
│   ├── FuelEfficiencyTicker
│   ├── VehiclePerformanceTicker
│   ├── WeeklyTrendsTicker
│   └── ComparisonTicker
├── CategoryContainer (Fuel Management)
│   ├── ConsumptionTicker
│   ├── InventoryTicker
│   ├── CostAnalysisTicker
│   └── SupplyTicker
└── ConfigurationModal
    ├── CategorySelectionPanel
    ├── TickerConfigurationPanel
    ├── FilterConfigurationPanel
    ├── DisplayOptionsPanel
    └── OrderingPanel
```

## 📊 Data Structures

### User Preference Schema

```javascript
{
  userId: "string (GUID)",
  dashboardPreferences: {
    version: "2.0",
    lastUpdated: "2025-08-23T10:30:00Z",
    categories: {
      "active_alarms": {
        enabled: true,
        position: 1,
        tickerOrder: [1, 3, 2, 4],
        enabledTickers: [
          {
            id: 1,
            type: "alarm_statistics",
            enabled: true,
            position: 1,
            refreshInterval: 15,
            size: "half", // full, half, quarter, third
            filters: {
              siteId: [1, 2],
              severityLevel: ["critical", "high"],
              alertThreshold: 5
            },
            displayOptions: {
              showCounts: true,
              showTrends: true,
              compactView: false
            }
          }
        ]
      },
      "key_statistics": {
        enabled: true,
        position: 2,
        enabledTickers: [
          {
            id: 2,
            type: "tank_levels",
            enabled: true,
            size: "full",
            filters: {
              siteId: [1, 2],
              tankId: [5, 8, 12],
              alertThreshold: 20
            }
          }
        ]
      },
      "performance_metrics": {
        enabled: true,
        position: 3,
        enabledTickers: [
          {
            id: 3,
            type: "fuel_efficiency",
            enabled: true,
            size: "half"
          }
        ]
      },
      "fuel_management": {
        enabled: false,
        position: 4,
        enabledTickers: []
      }
    }
  }
}
```

### Ticker Configuration Schema
```javascript
{
  type: "tank_levels",
  name: "Tank Levels",
  icon: "fa-light fa-gas-pump",
  category: "operations",
  dataSource: "/api/tankstock/dashboard-metrics",
  refreshInterval: [15, 30, 60, 300],
  requiredPermissions: ["_Read_tankStock"],
  availableFilters: {
    siteId: {
      type: "multiselect",
      required: false,
      dataSource: "/api/sites",
      validation: { maxSelection: 10 }
    }
  },
  displayOptions: {
    showPercentage: {
      type: "boolean",
      default: true,
      description: "Show percentage fill levels"
    }
  }
}
```

## 🎛️ Dashboard Categories

### 1. Active Alarms Category

- **Purpose**: Real-time monitoring and management of system alerts and notifications
- **Default Tickers**:
  - **Alarm Statistics**: Current counts by severity level
  - **Recent Critical Alarms**: Latest high-priority alerts requiring attention
  - **Alarm Trends**: Historical alarm frequency and resolution metrics
  - **Escalated Alarms**: Alerts that have been escalated to management
- **Filters**: Site, Severity Level, Alarm Type, Time Range
- **Refresh**: 15-60 seconds
- **Permissions**: `_Read_activeAlarms`, `_Admin_alerts`

### 2. Key Statistics Category

- **Purpose**: Essential operational metrics and KPIs at a glance
- **Default Tickers**:
  - **Tank Levels**: Current stock levels across all sites
  - **Daily Transactions**: Today's fuel dispensing activity
  - **Volume Summary**: Total volume dispensed and remaining
  - **System Health**: Overall system status indicators
- **Filters**: Site, Tank, Time Range, Transaction Type
- **Refresh**: 30-300 seconds
- **Permissions**: `_Read_tankStock`, `_Read_fueling`

### 3. Performance Metrics Category

- **Purpose**: Track efficiency, trends, and comparative performance
- **Default Tickers**:
  - **Fuel Efficiency**: Km/L and L/Hr performance metrics
  - **Vehicle Performance**: Fleet utilization and status
  - **Weekly Trends**: Historical performance patterns
  - **Expected vs Actual**: Variance analysis
- **Filters**: Site, Vehicle Type, Time Range, Performance Threshold
- **Refresh**: 300-1800 seconds
- **Permissions**: `_Read_vehicle`, `_Read_expectedAverage`

### 4. Fuel Management Category

- **Purpose**: Comprehensive fuel inventory and consumption analysis
- **Default Tickers**:
  - **Consumption Summary**: Detailed consumption patterns
  - **Inventory Status**: Stock levels and reorder points
  - **Cost Analysis**: Fuel costs and budget tracking
  - **Supply Chain**: Delivery schedules and supplier metrics
- **Filters**: Site, Fuel Type, Supplier, Cost Center
- **Refresh**: 600-1800 seconds
- **Permissions**: `_Read_consumption`, `_Read_fuelCost`

## 🔧 Technical Implementation

### Frontend Architecture

#### React Context Structure
```javascript
// PreferencesContext.js
const PreferencesContext = createContext({
  preferences: null,
  updatePreferences: () => {},
  resetToDefaults: () => {},
  isLoading: false,
  error: null
});

// TickerContext.js
const TickerContext = createContext({
  tickers: [],
  refreshTicker: () => {},
  enableTicker: () => {},
  disableTicker: () => {},
  reorderTickers: () => {}
});
```

#### Component Structure
```javascript
// Base Ticker Component
const BaseTicker = ({
  config,
  data,
  loading,
  error,
  onRefresh
}) => {
  // Common ticker functionality
  // Loading states, error handling
  // Refresh controls, settings button
};

// Specific Ticker Implementations
const TankLevelsTicker = ({ preferences }) => {
  const { data, loading, error } = useTankData(preferences.filters);
  return <BaseTicker config={TANK_CONFIG} data={data} />;
};
```

### Backend Implementation

#### API Endpoints
```csharp
[ApiController]
[Route("api/dashboard")]
public class DashboardPreferencesController : ControllerBase
{
    [HttpGet("preferences")]
    public async Task<IActionResult> GetUserPreferences();

    [HttpPost("preferences")]
    public async Task<IActionResult> SaveUserPreferences([FromBody] UserPreferencesDto preferences);

    [HttpGet("ticker-configs")]
    public async Task<IActionResult> GetAvailableTickerConfigs();

    [HttpPost("preferences/reset")]
    public async Task<IActionResult> ResetToRoleDefaults();
}
```

#### Database Schema
```sql
-- User Dashboard Preferences Table
CREATE TABLE UserDashboardPreferences (
    Id UNIQUEIDENTIFIER PRIMARY KEY DEFAULT NEWID(),
    UserId UNIQUEIDENTIFIER NOT NULL,
    PreferencesJson NVARCHAR(MAX) NOT NULL,
    Version NVARCHAR(10) NOT NULL DEFAULT '1.0',
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    IsActive BIT NOT NULL DEFAULT 1,
    FOREIGN KEY (UserId) REFERENCES Users(Id)
);

-- Ticker Configuration Templates
CREATE TABLE DashboardTickerTemplates (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    TickerType NVARCHAR(50) NOT NULL UNIQUE,
    Name NVARCHAR(100) NOT NULL,
    ConfigurationJson NVARCHAR(MAX) NOT NULL,
    RequiredRole NVARCHAR(50),
    RequiredPermissions NVARCHAR(500),
    IsEnabled BIT NOT NULL DEFAULT 1,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);
```

## 🔐 Security & Permissions

### Role-Based Access

- **Admin**: Access to all categories including Active Alarms with system health and admin-specific tickers (cost data, system configuration, user management)
- **Management**: Access to Key Statistics, Performance Metrics, and Fuel Management with site-wide data and cost analysis (no system administration)
- **User**: Access to Key Statistics and Performance Metrics with filtered data (own site/vehicles only, no cost data)
- **Guest**: Access to basic Key Statistics category only (read-only public data)

### Permission Validation

```javascript
// Frontend role-based permission checking (user role stored in Redux at login)
const currentUser = useSelector(state => state.auth.user);
const userRole = currentUser?.role || 'guest'; // "admin", "management", "user", "guest"

// Permission checking for category and ticker access
const validateCategoryAccess = (categoryType, userRole) => {
  const roleConfig = {
    admin: ['active_alarms', 'key_statistics', 'performance_metrics', 'fuel_management'],
    management: ['key_statistics', 'performance_metrics', 'fuel_management'],
    user: ['key_statistics', 'performance_metrics'],
    guest: ['key_statistics']
  };
  return roleConfig[userRole]?.includes(categoryType) || false;
};

const validateTickerAccess = (tickerType, userRole) => {
  const restrictedTickers = {
    // Cost-related tickers
    cost_analysis: ['management', 'admin'],
    budget_tracking: ['admin'],
    supplier_data: ['admin'],

    // System tickers
    system_health: ['admin'],
    user_activity: ['admin'],
    database_metrics: ['admin'],

    // Advanced features
    escalated_alarms: ['admin'],
    alarm_configuration: ['admin']
  };

  const requiredRoles = restrictedTickers[tickerType];
  return !requiredRoles || requiredRoles.includes(userRole);
};

// Data filtering based on user's assigned sites
const filterDataByUserSites = (data, userRole, userSites) => {
  if (userRole === 'admin') return data; // Admin sees all
  return data.filter(item => userSites.includes(item.siteId));
};
```

## ⚡ Performance Considerations

### Data Caching Strategy
```javascript
// Multi-level caching
const cacheStrategy = {
  localStorage: "User preferences (persistent)",
  sessionStorage: "Current session ticker data",
  redux: "Application state management",
  api: "Server-side caching for 30-300 seconds"
};
```

### Optimization Techniques
- **Lazy Loading**: Only load enabled tickers
- **Debounced Saves**: Prevent excessive API calls during configuration
- **Memoization**: Cache expensive calculations
- **Virtual Scrolling**: For large datasets in tickers
- **Progressive Loading**: Load critical tickers first

## 🧪 Testing Strategy

### Unit Tests
- Preference serialization/deserialization
- Filter validation logic
- Permission checking
- Component rendering with different configurations

### Integration Tests
- API endpoint functionality
- Database operations
- Real-time data updates
- Cross-browser compatibility

### User Acceptance Tests
- Role-based access verification
- Configuration workflow testing
- Performance under load
- Mobile responsiveness

## 🚀 Deployment Considerations

### Feature Flags
```javascript
const featureFlags = {
  customizableDashboard: true,
  advancedFilters: false, // Gradual rollout
  realTimeUpdates: true,
  mobileCustomization: false // Future enhancement
};
```

### Migration Strategy
1. **Phase 1**: Deploy with default configurations
2. **Phase 2**: Enable basic customization for admins
3. **Phase 3**: Roll out to all users
4. **Phase 4**: Add advanced features

## 🔄 Future Enhancements

### Planned Features
- **Custom Time Ranges**: User-defined date ranges
- **Advanced Charting**: Interactive charts within tickers
- **Export Functionality**: Export ticker data to Excel/PDF
- **Mobile App Integration**: Sync preferences across platforms
- **AI Recommendations**: Suggest optimal ticker configurations
- **Collaborative Dashboards**: Share configurations with teams

### Technical Improvements
- **GraphQL Integration**: More efficient data fetching
- **WebSocket Optimization**: Reduced bandwidth usage
- **Offline Support**: Cache data for offline viewing
- **Progressive Web App**: Enhanced mobile experience

## 📚 Related Documentation
- [Dashboard Component Architecture](./Dashboard-Architecture.md)
- [Dashboard Template Catalog](./Dashboard-Template-Catalog.md)
- [Role-Based Access Control](../Security/RBAC-Implementation.md)
- [API Documentation](../API/Dashboard-APIs.md)
- [User Interface Guidelines](../UI/Dashboard-UI-Guidelines.md)
