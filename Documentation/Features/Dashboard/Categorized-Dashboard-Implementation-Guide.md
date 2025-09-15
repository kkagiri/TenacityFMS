# Categorized Dashboard System - Implementation Guide
<!-- markdownlint-disable MD024 MD022 MD032 MD031 MD040 -->

## 📋 Executive Summary

This document provides implementation guidance for the Categorized Dashboard System, where the existing dashboard sections (Active Alarms, Key Statistics, Performance Metrics, Fuel Management) become customizable categories with individual tickers/widgets within each category.

## 🎯 Architectural Transformation

### From Current State to Categorized Dashboard

**Current Dashboard Structure (RoleBasedDashboard.js):**
```javascript
// Current fixed sections
{canViewWidget("alarms") && <DashboardAlarmWidget />}
{canViewWidget("stats") && <StatsCards />}
{canViewWidget("performance") && <><FuelEfficiency /><WeeklyPerformance /></>}
{canViewWidget("fuelManagement") && <FuelManagement />}
```

**Target Categorized Structure:**
```javascript
// New categorized structure
<CategoryContainer category="active_alarms">
  <AlarmStatisticsTicker />
  <RecentAlarmsTicker />
  <CriticalAlarmsTicker />
</CategoryContainer>

<CategoryContainer category="key_statistics">
  <TankLevelsTicker />
  <TransactionsTicker />
  <VolumeTicker />
</CategoryContainer>

<CategoryContainer category="performance_metrics">
  <FuelEfficiencyTicker />
  <VehiclePerformanceTicker />
  <WeeklyTrendsTicker />
</CategoryContainer>

<CategoryContainer category="fuel_management">
  <ConsumptionTicker />
  <InventoryTicker />
  <CostAnalysisTicker />
</CategoryContainer>
```

## 🏗️ Implementation Phases

### Phase 1: Category Infrastructure (Weeks 1-4)

#### Week 1-2: Database Schema Updates

```sql
-- Extended preferences schema to support categories
ALTER TABLE UserDashboardPreferences
ADD CategoryPreferencesJson NVARCHAR(MAX);

-- Category template configurations
CREATE TABLE DashboardCategoryTemplates (
    Id INT IDENTITY(1,1) PRIMARY KEY,
    CategoryType NVARCHAR(50) NOT NULL UNIQUE, -- 'active_alarms', 'key_statistics', etc.
    Name NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    ConfigurationJson NVARCHAR(MAX) NOT NULL,
    RequiredRole NVARCHAR(50),
    RequiredPermissions NVARCHAR(500),
    DefaultEnabled BIT NOT NULL DEFAULT 1,
    DisplayOrder INT NOT NULL DEFAULT 0,
    CreatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE(),
    UpdatedAt DATETIME2 NOT NULL DEFAULT GETUTCDATE()
);

-- Seed category templates
INSERT INTO DashboardCategoryTemplates (CategoryType, Name, Description, ConfigurationJson, RequiredPermissions, DefaultEnabled, DisplayOrder) VALUES
('active_alarms', 'Active Alarms', 'Real-time system alerts and notifications', '{"refreshInterval": 15, "defaultTickers": ["alarm_statistics", "recent_alarms", "critical_alerts"]}', '_Read_activeAlarms', 1, 1),
('key_statistics', 'Key Statistics', 'Essential operational metrics and KPIs', '{"refreshInterval": 60, "defaultTickers": ["tank_levels", "daily_transactions", "volume_summary"]}', '_Read_tankStock,_Read_fueling', 1, 2),
('performance_metrics', 'Performance Metrics', 'Efficiency and performance tracking', '{"refreshInterval": 300, "defaultTickers": ["fuel_efficiency", "vehicle_performance", "weekly_trends"]}', '_Read_vehicle,_Read_expectedAverage', 1, 3),
('fuel_management', 'Fuel Management', 'Comprehensive fuel inventory and analysis', '{"refreshInterval": 600, "defaultTickers": ["consumption_summary", "inventory_status", "cost_analysis"]}', '_Read_consumption,_Read_fuelCost', 0, 4);
```

#### Week 3-4: Backend API Enhancements

```csharp
// New controller endpoints for categories
[ApiController]
[Route("api/dashboard/categories")]
public class DashboardCategoryController : ControllerBase
{
    [HttpGet]
    public async Task<IActionResult> GetAvailableCategories()
    {
        // Return categories filtered by user permissions
    }

    [HttpGet("{categoryType}/tickers")]
    public async Task<IActionResult> GetCategoryTickers(string categoryType)
    {
        // Return available tickers for specific category
    }

    [HttpPost("preferences")]
    public async Task<IActionResult> SaveCategoryPreferences([FromBody] CategoryPreferencesDto preferences)
    {
        // Save category-specific preferences
    }
}
```

### Phase 2: Frontend Category Components (Weeks 5-8)

#### Category Container Component

```javascript
// CategoryContainer.js - Wrapper for each dashboard category
const CategoryContainer = ({ category, title, enabled, onToggle, children }) => {
  const { categoryPreferences } = useCategoryPreferences();
  const categoryConfig = categoryPreferences?.[category] || {};

  if (!enabled) return null;

  return (
    <div className={`category-container category-${category}`}>
      <div className="category-header">
        <h2 className="category-title">{title}</h2>
        <div className="category-controls">
          <CategoryConfigButton category={category} />
          <CategoryToggleButton category={category} enabled={enabled} onToggle={onToggle} />
        </div>
      </div>

      <div className="category-content">
        <TickerGrid category={category} tickers={categoryConfig.enabledTickers}>
          {children}
        </TickerGrid>
      </div>
    </div>
  );
};
```

#### Ticker Grid Component

```javascript
// TickerGrid.js - Handles layout within categories
const TickerGrid = ({ category, tickers, children }) => {
  const { tickerOrder, onReorder } = useCategoryPreferences(category);

  return (
    <DragDropContext onDragEnd={onReorder}>
      <Droppable droppableId={`category-${category}`}>
        {(provided) => (
          <div
            className="ticker-grid"
            ref={provided.innerRef}
            {...provided.droppableProps}
          >
            {tickers.map((ticker, index) => (
              <Draggable draggableId={ticker.id} index={index} key={ticker.id}>
                {(dragProvided) => (
                  <div
                    ref={dragProvided.innerRef}
                    {...dragProvided.draggableProps}
                    {...dragProvided.dragHandleProps}
                    className={`ticker-item ticker-size-${ticker.size || 'full'}`}
                  >
                    {renderTicker(ticker.type, ticker.config)}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
};
```

### Phase 3: Category-Specific Tickers (Weeks 9-12)

#### Active Alarms Category Tickers

```javascript
// AlarmStatisticsTicker.js
const AlarmStatisticsTicker = ({ config }) => {
  const { data, loading } = useAlarmStatistics(config.filters);

  return (
    <BaseTicker title="Alarm Statistics" loading={loading}>
      <div className="alarm-stats-grid">
        <StatCard label="Critical" value={data.critical} severity="critical" />
        <StatCard label="High" value={data.high} severity="high" />
        <StatCard label="Active" value={data.totalActive} severity="info" />
        <StatCard label="Resolved Today" value={data.resolvedToday} severity="success" />
      </div>
    </BaseTicker>
  );
};

// RecentAlarmsTicker.js
const RecentAlarmsTicker = ({ config }) => {
  const { data, loading } = useRecentAlarms(config.filters);

  return (
    <BaseTicker title="Recent Critical Alarms" loading={loading}>
      <div className="recent-alarms-list">
        {data.slice(0, 5).map(alarm => (
          <AlarmListItem key={alarm.id} alarm={alarm} compact />
        ))}
      </div>
    </BaseTicker>
  );
};
```

#### Key Statistics Category Tickers

```javascript
// TankLevelsTicker.js
const TankLevelsTicker = ({ config }) => {
  const { data, loading } = useTankLevels(config.filters);

  return (
    <BaseTicker title="Tank Levels" loading={loading}>
      <div className="tank-levels-grid">
        {data.map(tank => (
          <TankLevelCard key={tank.id} tank={tank} />
        ))}
      </div>
    </BaseTicker>
  );
};

// TransactionsTicker.js
const TransactionsTicker = ({ config }) => {
  const { data, loading } = useDailyTransactions(config.filters);

  return (
    <BaseTicker title="Daily Transactions" loading={loading}>
      <div className="transaction-summary">
        <StatCard label="Transactions" value={data.count} />
        <StatCard label="Volume" value={`${data.volume}L`} />
        <StatCard label="Revenue" value={`$${data.revenue}`} />
      </div>
    </BaseTicker>
  );
};
```

### Phase 4: Advanced Category Features (Weeks 13-16)

#### Category Configuration Modal with Role Restrictions

```javascript
// CategoryConfigurationModal.js - Role-aware configuration
const CategoryConfigurationModal = ({ open, onClose, category, userRole }) => {
  const [categoryConfig, setCategoryConfig] = useState({});
  const { availableTickers } = useCategoryTickers(category);

  // Filter tickers based on user role
  const allowedTickers = getFilteredTickers(category, availableTickers, userRole);

  return (
    <DevExtreme.Popup visible={open} onHiding={onClose} title={`Configure ${category}`}>
      <div className="category-config-content">

        {/* Role-based ticker selection */}
        <div className="config-section">
          <h3>Available Tickers</h3>
          <div className="role-info">
            <span className="role-badge">{userRole.toUpperCase()}</span>
            <span className="role-description">
              {getRoleDescription(userRole, category)}
            </span>
          </div>

          {allowedTickers.map(ticker => (
            <DevExtreme.CheckBox
              key={ticker.type}
              text={ticker.name}
              value={categoryConfig.enabledTickers?.includes(ticker.type)}
              onValueChanged={(e) => handleTickerToggle(ticker.type, e.value)}
              hint={ticker.description}
            />
          ))}

          {/* Show restricted tickers (disabled) for transparency */}
          {userRole !== 'admin' && (
            <div className="restricted-tickers">
              <h4>Restricted for your role:</h4>
              {availableTickers
                .filter(ticker => !canViewTicker(ticker.type, category, userRole))
                .map(ticker => (
                  <DevExtreme.CheckBox
                    key={ticker.type}
                    text={ticker.name}
                    value={false}
                    disabled={true}
                    hint={`Requires ${getRequiredRole(ticker.type)} role or higher`}
                  />
                ))
              }
            </div>
          )}
        </div>

        {/* Role-based filter options */}
        <div className="config-section">
          <h3>Filters</h3>
          <RoleBasedCategoryFilters
            category={category}
            userRole={userRole}
            config={categoryConfig}
            onChange={setCategoryConfig}
          />
        </div>

        {/* Refresh Settings - Admin can set lower intervals */}
        <div className="config-section">
          <h3>Refresh Settings</h3>
          <DevExtreme.NumberBox
            label="Refresh Interval (seconds)"
            value={categoryConfig.refreshInterval || 60}
            min={getMinRefreshInterval(category, userRole)}
            max={getMaxRefreshInterval(category, userRole)}
            onValueChanged={(e) => setCategoryConfig(prev => ({...prev, refreshInterval: e.value}))}
          />
          <div className="refresh-info">
            <small>
              {userRole === 'admin'
                ? 'Admin: Full control over refresh intervals'
                : `${userRole}: Limited to ${getMinRefreshInterval(category, userRole)}-${getMaxRefreshInterval(category, userRole)}s intervals`
              }
            </small>
          </div>
        </div>

      </div>
    </DevExtreme.Popup>
  );
};

// Helper functions for role-based restrictions
const getRoleDescription = (userRole, category) => {
  const descriptions = {
    admin: "Full access to all features and data",
    management: "Access to operational and cost data for assigned sites",
    user: "Access to basic operational data for assigned sites",
    guest: "Read-only access to public operational data"
  };
  return descriptions[userRole] || descriptions.guest;
};

const getRequiredRole = (tickerType) => {
  const requirements = {
    'cost_analysis': 'Management',
    'supply_chain': 'Admin',
    'system_health': 'Admin',
    'escalated_alarms': 'Admin',
    'budget_tracking': 'Management',
    'advanced_cost_analysis': 'Admin'
  };
  return requirements[tickerType] || 'User';
};

const getMinRefreshInterval = (category, userRole) => {
  if (userRole === 'admin') return 5; // Admin can have very fast refresh
  if (userRole === 'management') return 15;
  return 30; // User/Guest have slower minimum refresh
};

const getMaxRefreshInterval = (category, userRole) => {
  if (userRole === 'admin') return 3600; // 1 hour max
  return 1800; // 30 minutes max for non-admin
};
```

#### Category-Specific Filters

```javascript
// CategoryFilters.js
const CategoryFilters = ({ category, config, onChange }) => {
  switch (category) {
    case 'active_alarms':
      return <AlarmCategoryFilters config={config} onChange={onChange} />;
    case 'key_statistics':
      return <StatisticsCategoryFilters config={config} onChange={onChange} />;
    case 'performance_metrics':
      return <PerformanceCategoryFilters config={config} onChange={onChange} />;
    case 'fuel_management':
      return <FuelCategoryFilters config={config} onChange={onChange} />;
    default:
      return null;
  }
};

// AlarmCategoryFilters.js
const AlarmCategoryFilters = ({ config, onChange }) => {
  return (
    <div className="alarm-filters">
      <DevExtreme.TagBox
        dataSource={['Critical', 'High', 'Medium', 'Low']}
        value={config.severityFilter || []}
        onValueChanged={(e) => onChange(prev => ({...prev, severityFilter: e.value}))}
        placeholder="Filter by severity"
      />

      <DevExtreme.TagBox
        dataSource={['Tank', 'Vehicle', 'System', 'PTS']}
        value={config.typeFilter || []}
        onValueChanged={(e) => onChange(prev => ({...prev, typeFilter: e.value}))}
        placeholder="Filter by alarm type"
      />
    </div>
  );
};
```

## 🔐 Role-Based Category Access Control

### Frontend Role Checking Strategy

Since user details and roles are saved in the Redux store at login (`{user, role: "admin"}`), all category and ticker visibility is controlled on the frontend based on the user's role.

```javascript
// Role-based category configuration
const ROLE_CATEGORY_CONFIG = {
  admin: {
    allowedCategories: ['active_alarms', 'key_statistics', 'performance_metrics', 'fuel_management'],
    permissions: {
      active_alarms: ['view_all_sites', 'manage_escalations', 'system_alerts'],
      key_statistics: ['view_all_sites', 'system_health', 'cross_site_analytics'],
      performance_metrics: ['view_all_sites', 'cost_data', 'advanced_analytics'],
      fuel_management: ['view_all_sites', 'cost_analysis', 'supplier_data', 'budget_tracking']
    },
    restrictedTickers: [] // Admin can see all tickers
  },
  management: {
    allowedCategories: ['key_statistics', 'performance_metrics', 'fuel_management'],
    permissions: {
      key_statistics: ['view_assigned_sites', 'basic_analytics'],
      performance_metrics: ['view_assigned_sites', 'cost_data', 'efficiency_reports'],
      fuel_management: ['view_assigned_sites', 'cost_analysis', 'consumption_reports']
    },
    restrictedTickers: ['system_health', 'supply_chain', 'advanced_cost_analysis']
  },
  user: {
    allowedCategories: ['key_statistics', 'performance_metrics'],
    permissions: {
      key_statistics: ['view_assigned_sites', 'basic_operations'],
      performance_metrics: ['view_assigned_sites', 'basic_efficiency']
    },
    restrictedTickers: ['cost_analysis', 'system_health', 'supply_chain', 'budget_tracking']
  },
  guest: {
    allowedCategories: ['key_statistics'],
    permissions: {
      key_statistics: ['view_public_data', 'read_only']
    },
    restrictedTickers: ['cost_analysis', 'detailed_transactions', 'system_health']
  }
};

// Role checking functions
const canViewCategory = (categoryType, userRole) => {
  const roleConfig = ROLE_CATEGORY_CONFIG[userRole] || ROLE_CATEGORY_CONFIG.guest;
  return roleConfig.allowedCategories.includes(categoryType);
};

const canViewTicker = (tickerType, categoryType, userRole) => {
  const roleConfig = ROLE_CATEGORY_CONFIG[userRole] || ROLE_CATEGORY_CONFIG.guest;

  // First check if user can view the category
  if (!canViewCategory(categoryType, userRole)) return false;

  // Then check if ticker is specifically restricted for this role
  return !roleConfig.restrictedTickers.includes(tickerType);
};

const getFilteredTickers = (categoryType, availableTickers, userRole) => {
  return availableTickers.filter(ticker =>
    canViewTicker(ticker.type, categoryType, userRole)
  );
};
```

### Phase 5: Integration & Polish (Weeks 17-20)

#### Role-Based Category Filtering Integration

```javascript
// Updated RoleBasedDashboard.js with role-based category filtering
const RoleBasedDashboardContent = () => {
  // Get user role from Redux store (saved at login)
  const currentUser = useSelector(state => state.auth.user);
  const userRole = currentUser?.role || 'guest'; // e.g., "admin", "management", "user", "guest"

  const { categoryPreferences, enabledCategories } = useCategoryPreferences();

  // Filter categories based on user role
  const visibleCategories = enabledCategories.filter(category =>
    canViewCategory(category, userRole)
  );

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        {/* Existing header content */}
        <CategoryConfigurationButton userRole={userRole} />
      </div>

      {/* Role-Based Categorized Dashboard Sections */}
      {visibleCategories.includes('active_alarms') && (
        <CategoryContainer
          category="active_alarms"
          title="Active Alarms"
          userRole={userRole}
          enabled
        >
          {/* Only admin can see system alerts and escalation management */}
          {canViewTicker('alarm_statistics', 'active_alarms', userRole) && <AlarmStatisticsTicker />}
          {canViewTicker('recent_alarms', 'active_alarms', userRole) && <RecentAlarmsTicker />}
          {canViewTicker('critical_alarms', 'active_alarms', userRole) && <CriticalAlarmsTicker />}
          {canViewTicker('escalated_alarms', 'active_alarms', userRole) && <EscalatedAlarmsTicker />}
        </CategoryContainer>
      )}

      {visibleCategories.includes('key_statistics') && (
        <CategoryContainer
          category="key_statistics"
          title="Key Statistics"
          userRole={userRole}
          enabled
        >
          {canViewTicker('tank_levels', 'key_statistics', userRole) && <TankLevelsTicker />}
          {canViewTicker('daily_transactions', 'key_statistics', userRole) && <TransactionsTicker />}
          {canViewTicker('volume_summary', 'key_statistics', userRole) && <VolumeTicker />}
          {/* System health only for admin users */}
          {canViewTicker('system_health', 'key_statistics', userRole) && <SystemHealthTicker />}
        </CategoryContainer>
      )}

      {visibleCategories.includes('performance_metrics') && (
        <CategoryContainer
          category="performance_metrics"
          title="Performance Metrics"
          userRole={userRole}
          enabled
        >
          {canViewTicker('fuel_efficiency', 'performance_metrics', userRole) && <FuelEfficiencyTicker />}
          {canViewTicker('vehicle_performance', 'performance_metrics', userRole) && <VehiclePerformanceTicker />}
          {canViewTicker('weekly_trends', 'performance_metrics', userRole) && <WeeklyTrendsTicker />}
          {canViewTicker('expected_vs_actual', 'performance_metrics', userRole) && <ExpectedVsActualTicker />}
        </CategoryContainer>
      )}

      {/* Fuel Management category - only for management and admin */}
      {visibleCategories.includes('fuel_management') && (
        <CategoryContainer
          category="fuel_management"
          title="Fuel Management"
          userRole={userRole}
          enabled
        >
          {canViewTicker('consumption_summary', 'fuel_management', userRole) && <ConsumptionTicker />}
          {canViewTicker('inventory_status', 'fuel_management', userRole) && <InventoryTicker />}
          {/* Cost analysis only for management and admin */}
          {canViewTicker('cost_analysis', 'fuel_management', userRole) && <CostAnalysisTicker />}
          {/* Supply chain only for admin */}
          {canViewTicker('supply_chain', 'fuel_management', userRole) && <SupplyChainTicker />}
        </CategoryContainer>
      )}
    </div>
  );
};
```

## 🎛️ Configuration Schema

### Category Preferences JSON

```json
{
  "userId": "string (GUID)",
  "categoryPreferences": {
    "version": "2.0",
    "lastUpdated": "2025-08-23T10:30:00Z",
    "categories": {
      "active_alarms": {
        "enabled": true,
        "position": 1,
        "refreshInterval": 15,
        "enabledTickers": [
          {
            "type": "alarm_statistics",
            "size": "half",
            "position": 1,
            "filters": {
              "severityFilter": ["Critical", "High"],
              "typeFilter": ["Tank", "System"]
            }
          },
          {
            "type": "recent_alarms",
            "size": "half",
            "position": 2
          }
        ]
      },
      "key_statistics": {
        "enabled": true,
        "position": 2,
        "refreshInterval": 60,
        "enabledTickers": [
          {
            "type": "tank_levels",
            "size": "full",
            "position": 1,
            "filters": {
              "siteIds": [1, 2],
              "tankIds": [5, 8, 12]
            }
          }
        ]
      }
    }
  }
}
```

## 🔧 Technical Considerations

### Performance Optimization

- **Category-based lazy loading**: Only load data for enabled categories
- **Independent refresh cycles**: Each category manages its own refresh interval
- **Optimistic updates**: Category configuration changes apply immediately
- **Cached category templates**: Store category configurations in memory

### State Management

```javascript
// Redux store structure for categories
const dashboardState = {
  categories: {
    availableCategories: [], // From API based on permissions
    enabledCategories: [], // User preferences
    categoryPreferences: {}, // Detailed configuration per category
    loadingStates: {},
    errors: {}
  }
};
```

### Migration Strategy

1. **Phase 1**: Implement category infrastructure alongside existing dashboard
2. **Phase 2**: Create category components that wrap existing widgets
3. **Phase 3**: Gradually move users to categorized view with feature flag
4. **Phase 4**: Deprecate old dashboard structure
5. **Phase 5**: Remove legacy components

## 🎯 Testing Strategy

### Category-Specific Testing

- **Category enable/disable functionality**
- **Ticker management within categories**
- **Drag-and-drop between positions (not categories)**
- **Category-specific filtering**
- **Permission-based category access**
- **Performance with multiple active categories**

### Integration Testing

- **Category state synchronization**
- **Cross-category data consistency**
- **Role-based category restrictions**
- **Real-time updates across categories**

## 📊 Migration Plan

### Database Migration

```sql
-- Step 1: Add category support to existing preferences
UPDATE UserDashboardPreferences
SET CategoryPreferencesJson = '{"version": "2.0", "categories": {}}'
WHERE CategoryPreferencesJson IS NULL;

-- Step 2: Migrate existing ticker preferences to category structure
-- (Custom migration script based on existing PreferencesJson data)
```

### User Migration Strategy

1. **Preserve existing preferences**: Convert current ticker preferences to new category format
2. **Default category assignment**: Automatically assign existing widgets to appropriate categories
3. **Gradual rollout**: Use feature flags to gradually enable categorized view
4. **User education**: Provide in-app guidance for new categorized interface

## 🎯 Success Metrics

- **Category adoption rate**: Percentage of users actively using category customization
- **Performance improvement**: Load time reduction per category vs. full dashboard
- **User satisfaction**: Feedback scores on categorized interface
- **Support ticket reduction**: Decrease in dashboard-related support requests
- **Feature utilization**: Usage analytics for category-specific features

## 🔒 Data Security & Role-Based Access

### Frontend Data Filtering by Role

All data queries must respect the user's role and assigned sites/permissions stored in Redux:

```javascript
// Data hooks with role-based filtering
const useTankLevels = (filters, userRole, userSites) => {
  const { data, loading, error } = useQuery(['tankLevels', filters, userRole], async () => {
    const params = {
      ...filters,
      // Automatically restrict to user's sites if not admin
      siteIds: userRole === 'admin' ? filters.siteIds :
               filters.siteIds?.filter(id => userSites.includes(id)) || userSites
    };
    return await dashboardApi.getTankLevels(params);
  });

  return { data, loading, error };
};

const useCostAnalysis = (filters, userRole, userSites) => {
  // Cost data only for management and admin
  if (!['admin', 'management'].includes(userRole)) {
    return { data: null, loading: false, error: 'Insufficient permissions' };
  }

  const { data, loading, error } = useQuery(['costAnalysis', filters, userRole], async () => {
    const params = {
      ...filters,
      siteIds: userRole === 'admin' ? filters.siteIds : userSites,
      // Additional cost-specific restrictions
      includeBudgetData: userRole === 'admin',
      includeSupplierCosts: userRole === 'admin'
    };
    return await dashboardApi.getCostAnalysis(params);
  });

  return { data, loading, error };
};
```

### Role-Based Ticker Restrictions

```javascript
// Specific tickers that require elevated permissions
const RESTRICTED_TICKERS = {
  // Cost-related tickers - Management/Admin only
  cost_analysis: ['management', 'admin'],
  budget_tracking: ['management', 'admin'],
  supplier_performance: ['admin'],

  // System/Infrastructure tickers - Admin only
  system_health: ['admin'],
  database_performance: ['admin'],
  user_activity: ['admin'],

  // Advanced alarm features - Admin only
  escalated_alarms: ['admin'],
  alarm_configuration: ['admin'],

  // Supply chain - Admin only
  supply_chain: ['admin'],
  vendor_contracts: ['admin']
};

// Ticker permission checking
const hasTickerPermission = (tickerType, userRole) => {
  const requiredRoles = RESTRICTED_TICKERS[tickerType];
  if (!requiredRoles) return true; // No restrictions
  return requiredRoles.includes(userRole);
};
```

### Site-Based Data Filtering

```javascript
// Site filtering based on user assignments
const filterDataBySites = (data, userRole, userSites) => {
  if (userRole === 'admin') {
    return data; // Admin sees all data
  }

  // Filter data to only include user's assigned sites
  return data.filter(item => {
    if (item.siteId) return userSites.includes(item.siteId);
    if (item.site?.id) return userSites.includes(item.site.id);
    return true; // Include items without site association
  });
};

// Cost data masking for non-privileged users
const maskSensitiveData = (data, userRole) => {
  if (['admin', 'management'].includes(userRole)) {
    return data; // Show all data
  }

  // Remove or mask cost-related fields for regular users
  return data.map(item => ({
    ...item,
    cost: undefined,
    totalCost: undefined,
    unitPrice: undefined,
    budgetVariance: undefined,
    supplierInfo: undefined
  }));
};
```

### Redux State Security

```javascript
// Secure user data in Redux store
const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        isAuthenticated: true,
        user: action.payload.user,
        role: action.payload.user.role, // e.g., "admin", "management", "user", "guest"
        assignedSites: action.payload.user.assignedSites || [],
        permissions: action.payload.user.permissions || [],
        // Cache role-based capabilities for quick access
        capabilities: {
          canViewCosts: ['admin', 'management'].includes(action.payload.user.role),
          canViewAllSites: action.payload.user.role === 'admin',
          canManageAlarms: action.payload.user.role === 'admin',
          canConfigureSystem: action.payload.user.role === 'admin'
        }
      };
    default:
      return state;
  }
};

// Selectors for secure data access
export const selectUserCapabilities = (state) => state.auth.capabilities;
export const selectUserSites = (state) => state.auth.assignedSites;
export const selectCanViewCategory = (categoryType) => (state) => {
  const role = state.auth.role;
  return canViewCategory(categoryType, role);
};
```

This implementation transforms the existing dashboard into a powerful, categorized system while maintaining backward compatibility and providing a clear migration path.
