# Dashboard Configuration and Layout System

## Overview

The FMS Dashboard Configuration system provides a comprehensive solution for customizing dashboard layouts with advanced categorization, role-based access control, and flexible ticker sizing options. This system allows users to personalize their dashboard experience while maintaining appropriate security and organizational constraints.

## Features

### 1. Category-Based Organization

The dashboard organizes tickers into logical categories based on business function:

#### **Active Alarms** 🚨
- **Purpose**: Critical alerts and system warnings requiring immediate attention
- **Color**: Red (#dc3545)
- **Access**: Admin, Management, User
- **Tickers**: Critical alarms, tank alerts, pump warnings, system alerts, fuel level warnings

#### **Key Statistics** 📊
- **Purpose**: Essential operational metrics and KPIs
- **Color**: Blue (#007bff)
- **Access**: Admin, Management, User
- **Tickers**: Daily fuel consumed, active vehicles, tank capacity utilization, pump efficiency, transaction count

#### **Performance Metrics** 📈
- **Purpose**: Advanced analytics and performance indicators
- **Color**: Green (#28a745)
- **Access**: Admin, Management
- **Tickers**: Fuel efficiency trends, cost analysis, usage patterns, maintenance schedules, predictive analytics

#### **Fuel Management** ⛽
- **Purpose**: Inventory, reconciliation, and stock management
- **Color**: Yellow (#ffc107)
- **Access**: Admin, Management, User
- **Tickers**: Inventory levels, reconciliation status, delivery schedules, stock movements, variance reports

### 2. Role-Based Access Control

The system implements frontend role-based filtering with four access levels:

- **Admin**: Full access to all categories and functionality
- **Management**: Business metrics, fuel management, and performance analytics
- **User**: Basic statistics, active alarms, and fuel management
- **Guest**: Limited to key statistics only

### 3. Ticker Layout System

#### Size Options

| Size | Width | Description | Use Case |
|------|-------|-------------|----------|
| **Full** | 100% | Takes entire row width | Critical alarms, detailed charts |
| **Half** | 50% | Two tickers per row | Important metrics, status displays |
| **Quarter** | 25% | Four tickers per row | KPIs, counters, small indicators |
| **Auto** | Variable | Automatic based on content | Dynamic content adaptation |

#### Default Size Mappings

```javascript
const DEFAULT_TICKER_SIZES = {
  // Active Alarms - Larger for visibility
  'critical_alarms': 'full',
  'tank_alerts': 'half',
  'pump_warnings': 'half',
  'system_alerts': 'quarter',
  'fuel_level_warnings': 'quarter',

  // Key Statistics - Consistent quarter layout
  'daily_fuel_consumed': 'quarter',
  'active_vehicles': 'quarter',
  'tank_capacity_utilization': 'quarter',
  'pump_efficiency': 'quarter',
  'transaction_count': 'quarter',

  // Performance Metrics - Mixed for readability
  'fuel_efficiency_trends': 'half',
  'cost_analysis': 'half',
  'usage_patterns': 'full',
  'maintenance_schedules': 'half',
  'predictive_analytics': 'full',

  // Fuel Management - Balanced approach
  'inventory_levels': 'quarter',
  'reconciliation_status': 'half',
  'delivery_schedules': 'quarter',
  'stock_movements': 'quarter',
  'variance_reports': 'half'
};
```

### 4. Layout Settings

#### Display Options
- **Compact Mode**: Reduces spacing and padding for higher content density
- **Responsive Layout**: Automatically adjusts ticker sizes for different screen sizes
- **Layout Preview**: Real-time preview of current configuration

#### Grid System
- **Base Grid**: 4-column CSS Grid layout
- **Responsive Breakpoints**: Automatic adjustment for mobile/tablet/desktop
- **Dynamic Sizing**: Flexible column spanning based on ticker size

## Configuration Interface

### 1. Category Tabs
- **TabPanel Interface**: Professional DevExtreme TabPanel component
- **Visual Identity**: Each category has unique color coding and icons
- **Role Filtering**: Only accessible categories are displayed

### 2. Ticker Management
- **Enable/Disable**: Checkbox-based ticker activation
- **Size Configuration**: SelectBox for individual ticker sizing
- **Drag & Drop Ordering**: Within-category reordering with visual feedback

### 3. Global Filters
- **Site Filters**: Multi-select site filtering (implemented)
- **Tank Filters**: Coming in Story 2.2
- **Vehicle Filters**: Coming in Story 2.3

### 4. Layout Preview
- **Real-time Preview**: Visual representation of current layout
- **Category Organization**: Shows how tickers will be arranged
- **Size Visualization**: Color-coded size indicators

## Technical Implementation

### State Management

```javascript
// Redux State Structure
{
  enabledTickers: ['critical_alarms', 'daily_fuel_consumed'],
  tickerOrder: {
    'active_alarms_order': ['critical_alarms', 'tank_alerts'],
    'key_statistics_order': ['daily_fuel_consumed', 'active_vehicles']
  },
  tickerSizes: {
    'critical_alarms': 'full',
    'daily_fuel_consumed': 'quarter'
  },
  layoutSettings: {
    compactMode: false,
    responsiveLayout: true
  }
}
```

### Component Architecture

```
ConfigurationModal.js          # Main configuration interface
├── CategoryContainer.js       # Category-specific ticker rendering
├── TickerContainer.js         # Overall dashboard layout
├── PreferencesProvider.js     # Context provider for state
└── dashboardCategories.js     # Shared category definitions
```

### Hook Integration

```javascript
const {
  enabledTickers,
  tickerSizes,
  layoutSettings,
  setTickerSizes,
  setLayoutSettings
} = usePreferencesContext();
```

## Usage Examples

### 1. Enable Ticker with Custom Size

```javascript
// Enable a ticker
toggleTicker('critical_alarms');

// Set custom size
updateTickerSize('critical_alarms', 'full');
```

### 2. Configure Layout Settings

```javascript
// Enable compact mode
updateLayoutSettings({ compactMode: true });

// Disable responsive layout
updateLayoutSettings({ responsiveLayout: false });
```

### 3. Category-Based Ordering

```javascript
// Reorder tickers within a category
const newOrder = ['tank_alerts', 'critical_alarms'];
setOrder({
  ...tickerOrder,
  'active_alarms_order': newOrder
});
```

## CSS Classes and Styling

### Grid Layout
```css
.tw-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 0.75rem;
}

.tw-col-span-1 { grid-column: span 1; }
.tw-col-span-2 { grid-column: span 2; }
.tw-col-span-4 { grid-column: span 4; }
```

### Responsive Design
```css
/* Compact mode adjustments */
.compact-mode {
  gap: 0.5rem;
  padding: 0.75rem;
}

/* Size-specific styling */
.ticker-full { min-height: 120px; }
.ticker-half { min-height: 100px; }
.ticker-quarter { min-height: 80px; }
```

## Data Persistence

### Backend Integration
- **Preferences Storage**: JSON serialization to database
- **Version Control**: Preference versioning for migration support
- **Auto-save**: Debounced saving with 800ms delay

### Storage Format
```json
{
  "enabledTickers": ["critical_alarms", "daily_fuel_consumed"],
  "tickerOrder": {
    "active_alarms_order": ["critical_alarms", "tank_alerts"]
  },
  "tickerSizes": {
    "critical_alarms": "full",
    "daily_fuel_consumed": "quarter"
  },
  "layoutSettings": {
    "compactMode": false,
    "responsiveLayout": true
  },
  "siteFilters": [1, 2, 3],
  "version": "1.0"
}
```

## Performance Considerations

### Optimization Strategies
- **useMemo**: Expensive category filtering operations
- **useCallback**: Event handlers and functions
- **Component Memoization**: Prevent unnecessary re-renders
- **Lazy Loading**: Category content rendered on-demand

### Memory Management
- **State Cleanup**: Proper cleanup of event listeners
- **Debounced Saves**: Prevent excessive API calls
- **Efficient Updates**: Minimal state mutations

## Security & Access Control

### Frontend Validation
- **Role Checking**: Redux auth state validation
- **Category Filtering**: Dynamic category access
- **Permission Boundaries**: UI-level access restrictions

### Data Integrity
- **Input Validation**: Size option validation
- **State Consistency**: Automated cleanup of orphaned data
- **Error Handling**: Graceful fallbacks for invalid states

## Future Enhancements

### Planned Features
1. **Advanced Filters**: Tank and vehicle filtering (Stories 2.2, 2.3)
2. **Custom Categories**: User-defined category creation
3. **Import/Export**: Configuration backup and sharing
4. **Templates**: Pre-configured layout templates
5. **Analytics**: Usage analytics and optimization suggestions

### Technical Improvements
1. **Server-side Rendering**: Category definitions from backend
2. **Real-time Updates**: WebSocket-based preference synchronization
3. **A/B Testing**: Layout effectiveness testing
4. **Accessibility**: Enhanced screen reader support

## Troubleshooting

### Common Issues

#### Tickers Not Displaying
1. Check role permissions for category access
2. Verify ticker is enabled in configuration
3. Confirm template exists in backend data

#### Layout Not Updating
1. Ensure layout settings are saved
2. Check browser cache and refresh
3. Verify Redux state updates

#### Performance Issues
1. Reduce enabled ticker count
2. Enable compact mode
3. Check for JavaScript errors in console

### Debug Commands
```javascript
// Check current state
console.log(store.getState().dashboardPreferences);

// Force preference save
forceSave();

// Reset to defaults
dispatch({ type: 'DASHBOARD/RESET_TO_DEFAULTS' });
```

## API Documentation

### Actions
- `toggleTicker(tickerType)`: Enable/disable ticker
- `setTickerSizes(sizes)`: Update ticker size configurations
- `setLayoutSettings(settings)`: Update layout preferences
- `setOrder(orderMap)`: Update category-based ordering

### Selectors
- `selectEnabledTickers(state)`: Get enabled ticker list
- `selectTickerSizes(state)`: Get size configurations
- `selectLayoutSettings(state)`: Get layout preferences
- `selectAccessibleCategories(state, role)`: Get role-filtered categories

This comprehensive configuration system provides a powerful, flexible, and user-friendly way to customize dashboard layouts while maintaining proper security boundaries and optimal performance.
