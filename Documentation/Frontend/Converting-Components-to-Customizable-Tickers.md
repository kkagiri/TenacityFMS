# Converting Existing Dashboard Components to Customizable Tickers

This guide explains how to integrate existing dashboard components (like WeeklyPerformance, FuelEfficiency, etc.) into the customizable ticker system.

## Overview

The ticker system allows users to:
- Enable/disable dashboard widgets through categories
- Resize widgets (quarter, half, full width)
- Reorder widgets within categories
- Role-based access control

## Integration Steps

### 1. Import the Component

Add your component to `CategoryContainer.js`:

```javascript
import { WeeklyPerformance } from '../WeeklyPerformance';
import { FuelEfficiency } from '../FuelEfficiency';
// ... other components
```

### 2. Add to Category Definition

Update the category tickers array in `DASHBOARD_CATEGORIES`:

```javascript
'performance_metrics': {
  name: 'Performance Metrics',
  tickers: ['weekly_performance', 'fuel_efficiency_widget', ...existing_tickers]
}
```

### 3. Set Default Size

Add to `DEFAULT_TICKER_SIZES`:

```javascript
const DEFAULT_TICKER_SIZES = {
  'weekly_performance': 'full',      // Full width for complex widgets
  'fuel_efficiency_widget': 'half',  // Half width for medium widgets
  'tank_status': 'quarter',          // Quarter for simple metrics
  // ...
};
```

### 4. Create Ticker Renderer

Add to `TICKER_RENDERERS`:

```javascript
weekly_performance: (t) => (
  <div className="weekly-performance-ticker">
    <WeeklyPerformance
      engineHoursData={mockData}
      distanceData={mockData}
    />
  </div>
),
```

### 5. Update Configuration Templates

Add to `DEFAULT_TEMPLATES` in `ConfigurationModal.js`:

```javascript
{ tickerType: 'weekly_performance', name: 'Weekly Performance', category: 'performance_metrics' },
```

### 6. Update Default Sizing Configuration

Add to default sizes in `ConfigurationModal.js`:

```javascript
'performance_metrics': {
  'weekly_performance': 'full',
  // ... other sizes
}
```

### 7. Update Shared Categories

Update `dashboardCategories.js`:

```javascript
'performance_metrics': {
  tickers: ['weekly_performance', ...existing_tickers]
}
```

## Widget Sizing Guidelines

| Size | Grid Span | Best For | Example |
|------|-----------|----------|---------|
| `quarter` | 1/4 width | Simple metrics, counters | Daily fuel consumed, Active vehicles |
| `half` | 1/2 width | Medium complexity widgets | Tank levels, Pump status |
| `full` | Full width | Complex widgets, charts | Weekly performance, Fuel management |
| `auto` | Content-based | Dynamic sizing | Responsive widgets |

## CSS Styling

Create responsive styles in `TickerWidgets.scss`:

```scss
.weekly-performance-ticker {
  width: 100%;
  height: 100%;

  .dashboard-card {
    margin: 0;
    height: 100%;
  }
}

/* Responsive adjustments for different sizes */
.col-span-1 { /* Quarter width */
  .weekly-performance-ticker {
    .card-description { display: none; }
  }
}
```

## Best Practices

### Component Adaptation
- Remove hardcoded margins/padding
- Make components height-flexible
- Handle responsive behavior for different ticker sizes
- Provide mock data for demo purposes

### Naming Conventions
- Use descriptive ticker names: `weekly_performance`, `tank_levels_widget`
- Follow pattern: `{functionality}_{type}` or `{functionality}_widget`
- Keep category names consistent with existing patterns

### Data Handling
- Provide sensible default/mock data
- Handle loading states gracefully
- Ensure components work without external API calls

### Responsive Design
- Quarter width: Hide secondary information
- Half width: Compact layout
- Full width: Full feature display
- Mobile: Stack elements vertically

## Example Integration

Here's how `WeeklyPerformance` was integrated:

1. **Component Import**: `import { WeeklyPerformance } from '../WeeklyPerformance';`

2. **Category Addition**: Added to `performance_metrics` category

3. **Default Size**: Set to `'full'` for best display

4. **Renderer Creation**:
```javascript
weekly_performance: (t) => (
  <div className="weekly-performance-ticker">
    <WeeklyPerformance
      engineHoursData={sampleData}
      distanceData={sampleData}
    />
  </div>
),
```

5. **CSS Styling**: Added responsive behavior in `TickerWidgets.scss`

## Benefits of This Approach

- **User Customization**: Users can enable/disable widgets based on their needs
- **Role-Based Access**: Different roles see different widget options
- **Responsive Layout**: Automatic grid-based responsive design
- **Consistent UX**: All widgets follow the same interaction patterns
- **Easy Maintenance**: Centralized widget management
- **Future-Proof**: Easy to add new widgets following the same pattern

## Migration Strategy

For existing dashboards:

1. Keep existing hardcoded widgets temporarily
2. Add ticker versions of the same widgets
3. Allow users to choose between old and new layout
4. Gradually phase out hardcoded versions
5. Update documentation and user training

This approach allows for smooth transition while providing enhanced customization capabilities.
