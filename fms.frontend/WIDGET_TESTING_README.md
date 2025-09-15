# 🧪 Widget Testing System

A comprehensive testing environment for dashboard widgets with realistic mock data and debugging capabilities.

## 📋 Overview

This testing system allows you to test all your dashboard widgets in isolation with appropriate mock data that matches each widget's expected data format.

### Your Widget Instances

| ID | Name | Type | Visualization | Data Source |
|----|------|------|---------------|-------------|
| 8 | Distance Travel all sites | CHART_LINE_TREND | default | fuel_dispense |
| 9 | Vehicle | CHART_LINE_TREND | default | fuel_dispense |
| 10 | key stats | CHART_LINE_TREND | **ticker** | fuel_dispense |
| 11 | All Site vehicle performance | big_stat_card | **BIG_STAT_CARD** | engine_hours |

## 🚀 Quick Start

### Option 1: Add to Existing App

```javascript
import WidgetTestPage from './components/dashboard/WidgetTestPage';

// Add to your router
<Route path="/widget-test" element={<WidgetTestPage />} />

// Or render directly
<WidgetTestPage />
```

### Option 2: Standalone Testing

1. Open `widget-test.html` in your browser for an overview
2. Use the test component directly in your development environment

## 📊 Mock Data Formats

### Line Chart Widgets (IDs 8, 9)
```javascript
{
  chartData: [
    { argumentField: '2025-09-01', valueField: 1245.5, series: 'Truck-001' },
    { argumentField: '2025-09-02', valueField: 1289.2, series: 'Truck-001' },
    // ... more data points
  ],
  summary: {
    total: 8372.7,
    average: 1046.6,
    trend: '+12.5%'
  }
}
```

### Ticker Widget (ID 10)
```javascript
[
  {
    id: 1,
    text: 'Total Distance: 2,847.3 km (+7.28% vs yesterday)',
    type: 'stat',
    priority: 'high',
    icon: 'road',
    color: '#28a745'
  },
  // ... more ticker items
]
```

### Big Stat Card Widget (ID 11)
```javascript
{
  value: 1847.5,
  unit: 'hours',
  trend: {
    value: +12.8,
    percentage: +0.7,
    direction: 'up'
  },
  breakdown: [
    { label: 'Heavy Trucks', value: 967.2, percentage: 52.3 }
  ]
}
```

## 🔧 Features

### Testing Controls
- **Widget Filter**: Test widgets individually or all together
- **Refresh Simulation**: Test data refresh functionality
- **Loading States**: Simulate API call delays
- **Error Handling**: Test error states

### Debug Information
- **Widget Configuration**: View parsed config JSON
- **Mock Data**: Inspect data format and structure
- **Component Props**: See what props are passed to widgets

### Responsive Testing
- Test widgets across different screen sizes
- Mobile-friendly test interface
- Grid layout that adapts to content

## 🎯 Widget Type Mapping

The test system correctly maps your widget configurations:

```javascript
// Widget 10: Uses visualizationType override
configurationJson: {
  "visualizationType": "ticker"  // → Maps to TICKER widget
}

// Widget 11: Uses template configuration
template: {
  "widgetType": "big_stat_card"  // → Maps to BIG_STAT_CARD widget
}
```

## 📝 Usage Examples

### Test All Widgets
```javascript
// Default view shows all 4 widgets with mock data
<WidgetTestPage />
```

### Test Specific Widget
```javascript
// Use the dropdown filter to isolate widgets
// Or programmatically filter:
const filteredWidgets = widgetInstances.filter(w => w.id === 10);
```

### Simulate Real-time Updates
```javascript
// The refresh button simulates new data
const handleRefresh = () => {
  // Generates new mock data with random variations
  setMockData(generateMockData());
};
```

## 🛠️ Customization

### Add New Mock Data
```javascript
// In WidgetTestPage.js, modify generateMockData()
const generateMockData = () => {
  // Add your custom mock data formats
  mockDataSet[newWidgetId] = customMockData;
};
```

### Modify Widget Display
```javascript
// Customize the widget container styling
.widget-test-display {
  // Your custom styles
}
```

### Add New Widget Types
```javascript
// In EnhancedWidgetRenderer.js
case 'YOUR_NEW_WIDGET_TYPE':
  return <YourNewWidget {...commonProps} />;
```

## 🔍 Debugging Tips

1. **Check Widget Type Mapping**: Use debug panel to verify correct widget type
2. **Validate Data Format**: Expand mock data to ensure it matches widget expectations
3. **Test Configuration**: Verify parsed configuration matches intended settings
4. **Console Logs**: Check browser console for any widget rendering errors

## 📁 File Structure

```
fms.frontend/src/components/dashboard/
├── WidgetTestPage.js          # Main test component
├── WidgetTestPage.css         # Test page styling
├── DashboardRouter.js         # Example router integration
├── EnhancedWidgetRenderer.js  # Widget type mapping
└── widgets/                   # Individual widget components
    ├── LineChartWidget.js
    ├── TickerWidget.js
    ├── BigStatCardWidget.js
    └── ...
```

## 🎉 Next Steps

1. **Start the Test**: Import and render `WidgetTestPage`
2. **Verify Widgets**: Check that all 4 widgets render correctly
3. **Test Interactions**: Try refresh, configuration, and filter features
4. **Debug Issues**: Use debug panels to troubleshoot any problems
5. **Extend Testing**: Add more mock data scenarios or widget types

---

Happy testing! 🚀 Your widgets should now display beautifully with realistic mock data.
