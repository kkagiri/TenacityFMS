# Tank Anomaly Filter Panel Implementation

## Overview
This document describes the implementation of the Tank Anomaly Filter Panel for the Enhanced Tank Stock Dashboard, which provides advanced filtering capabilities to identify tanks with various operational anomalies.

## Feature Description
The Tank Anomaly Filter Panel allows users to filter tanks based on specific anomaly conditions, making it easier to identify and manage problematic tanks. The filter panel is integrated into the Enhanced Tank Stock Dashboard and provides real-time filtering of tank data.

## Filter Categories

### 1. Low Stock Level Filter
- **Condition**: Tanks with stock level below 30% capacity
- **Purpose**: Identify tanks that need refueling
- **Badge Color**: Yellow (warning)
- **Calculation**: `(currentStock / tankVolume) * 100 < 30`

### 2. Negative Stock Filter
- **Condition**: Tanks with negative current stock values
- **Purpose**: Identify abnormal readings that indicate sensor or data issues
- **Badge Color**: Red (critical)
- **Calculation**: `currentStock < 0`

### 3. Over Capacity Filter
- **Condition**: Tanks with stock level exceeding tank volume capacity
- **Purpose**: Identify potential overflow conditions or sensor errors
- **Badge Color**: Red (critical)
- **Calculation**: `currentStock > tankVolume`

### 4. Inactive Tanks Filter
- **Condition**: Tanks not updated for more than 1 month
- **Purpose**: Identify tanks with stale data or communication issues
- **Badge Color**: Gray (info)
- **Calculation**: `lastStockUpdate < oneMonthAgo`

### 5. All Tanks Option
- **Condition**: Shows all tanks regardless of status
- **Purpose**: Override filters to show complete tank inventory
- **Badge Color**: Blue (info)

## Implementation Details

### Component Architecture

#### TankFilterPanel Component
- **Location**: `src/pages/tankStock/dashboard/components/TankFilterPanel.js`
- **Props**:
  - `tankData`: Array of tank objects for filtering
  - `onFiltersChange`: Callback function to handle filter changes
- **State Management**:
  - `filters`: Object tracking active filter states
  - `isExpanded`: Boolean controlling panel expansion
  - `filterCounts`: Object containing counts for each filter type

#### Enhanced TankStockDashboard Integration
- **Location**: `src/pages/tankStock/dashboard/EnhancedTankStockDashboard.js`
- **State Addition**:
  - `filteredTankLevels`: Array storing filtered tank results
  - `handleFiltersChange`: Callback to update filtered results

#### TankLevelGauge Enhancements
- **Location**: `src/pages/tankStock/dashboard/components/TankLevelGauge.js`
- **New Features**:
  - Anomaly status detection
  - Visual anomaly indicators
  - Enhanced mode for detailed anomaly display
  - Last update timestamp display

### Key Functions

#### Filter Logic Implementation
```javascript
const filteredTanks = tankData.filter(tank => {
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);

  const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;
  const lastUpdate = new Date(tank.lastStockUpdate);

  const matchesBelowStock = filters.belowStockLevel && fillPercentage < 30;
  const matchesNegative = filters.negativeFuelLevel && tank.currentStock < 0;
  const matchesAboveCapacity = filters.aboveCapacity && tank.currentStock > tank.tankVolume;
  const matchesInactive = filters.inactiveTanks && lastUpdate < oneMonthAgo;

  return matchesBelowStock || matchesNegative || matchesAboveCapacity || matchesInactive;
});
```

#### Anomaly Detection in TankLevelGauge
```javascript
const getAnomalyStatus = () => {
  const fillPercentage = (tank.currentStock / tank.tankVolume) * 100;
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
  const lastUpdate = new Date(tank.lastStockUpdate);

  const anomalies = [];

  if (tank.currentStock < 0) {
    anomalies.push({ type: 'negative', label: 'Negative Stock', severity: 'critical' });
  }

  if (tank.currentStock > tank.tankVolume) {
    anomalies.push({ type: 'overcapacity', label: 'Over Capacity', severity: 'critical' });
  }

  if (fillPercentage < 30) {
    anomalies.push({ type: 'lowstock', label: 'Low Stock', severity: 'warning' });
  }

  if (lastUpdate < oneMonthAgo) {
    anomalies.push({ type: 'inactive', label: 'Inactive', severity: 'warning' });
  }

  return anomalies;
};
```

## User Interface Features

### Filter Panel Header
- Displays filter name and active filter count
- Shows current number of tanks matching filters
- Expandable/collapsible interface
- Click to expand/collapse functionality

### Filter Cards
- Individual filter checkboxes with descriptions
- Real-time count badges showing matching tanks
- Color-coded severity indicators
- Hover effects for better user experience

### Quick Actions
- **Show All**: Clears all filters and shows all tanks
- **Show Anomalies Only**: Activates all anomaly filters simultaneously

### Enhanced Tank Displays
- Visual anomaly indicators on tank cards
- Color-coded borders and backgrounds
- Anomaly badges with icons
- Last update timestamps

## Default Behavior
- **Initial State**: All anomaly filters are enabled by default (as requested)
- **Filter Panel**: Starts in collapsed state to save space
- **Real-time Updates**: Filter counts update automatically as tank data changes
- **Responsive Design**: Adapts to different screen sizes with mobile-friendly layout

## Styling and Theming

### SCSS Implementation
- **File**: `TankFilterPanel.scss`
- **Features**:
  - Smooth animations and transitions
  - Responsive grid layouts
  - Color-coded anomaly indicators
  - Hover and focus states

### Tailwind Classes
- All styles use `tw-` prefix as per project standards
- Mobile-responsive breakpoints
- Consistent spacing and typography
- Accessibility-friendly color contrasts

## Technical Considerations

### Performance Optimization
- Efficient filtering algorithms using single-pass array filtering
- Memoized filter functions to prevent unnecessary re-computations
- Real-time count calculations only when data changes

### Data Dependencies
- Requires tank objects with the following properties:
  - `id`: Unique identifier
  - `name`: Tank name
  - `currentStock`: Current stock level (number)
  - `tankVolume`: Tank capacity (number)
  - `lastStockUpdate`: ISO timestamp string
  - `siteName`: Site identifier (optional)

### Error Handling
- Graceful handling of missing or invalid tank data
- Default values for undefined properties
- Safe date parsing for lastStockUpdate field

## Integration Points

### Mission Control Layout
- Seamlessly integrated into MissionControlLayout
- Updates mission control metrics based on filtered results
- Maintains consistency with existing dashboard components

### SignalR Integration
- Works with real-time tank updates
- Filter results update automatically when new data arrives
- Maintains filter state during live updates

### State Management
- Uses React hooks for local state management
- Callback pattern for parent-child communication
- Preserves filter state during component re-renders

## Usage Instructions

### For Users
1. Navigate to Enhanced Tank Stock Dashboard
2. Locate the "Tank Anomaly Filters" panel below site overview
3. Click header to expand filter options
4. Select desired filter checkboxes
5. View filtered results in tank monitoring section
6. Use quick action buttons for common filter combinations

### For Developers
1. Import TankFilterPanel component
2. Pass tank data array and onChange callback
3. Handle filtered results in parent component
4. Update display logic to use filtered data
5. Ensure tank objects include required properties

## Future Enhancements

### Potential Improvements
- Custom threshold configuration for low stock levels
- Additional anomaly types (rapid stock changes, sensor drift)
- Filter presets and saved configurations
- Export filtered results functionality
- Historical anomaly tracking and reporting

### Database Considerations
- Consider adding indexes on `LastStockUpdate` field for inactive tank queries
- Potential computed columns for anomaly flags
- Archived anomaly history for trend analysis

## Testing Recommendations

### Unit Tests
- Filter logic validation with various tank data scenarios
- Edge cases (null/undefined values, invalid dates)
- Count calculations accuracy
- Filter combination behaviors

### Integration Tests
- Component interaction with parent dashboard
- Real-time data updates with filters active
- SignalR integration with filtering enabled
- Responsive design across different screen sizes

### User Acceptance Tests
- Filter functionality with real tank data
- Performance with large tank datasets
- Usability of filter interface
- Accuracy of anomaly detection

## Dependencies
- React 18.2.0+
- DevExtreme components (CheckBox, Button)
- Tailwind CSS with tw- prefix configuration
- SCSS support for component styling
- FontAwesome icons for UI elements

This implementation provides a comprehensive solution for identifying and managing tank anomalies within the FMS system, improving operational efficiency and data quality monitoring.
