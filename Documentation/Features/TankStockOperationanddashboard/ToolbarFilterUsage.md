# Toolbar Analytics Filter Usage

## Overview

The `ToolbarAnalytics` component has been enhanced with a popup filter that allows users to filter data by date range and site selection. The filter provides quick date presets (Yesterday, This Week, This Month, This Year) and custom date range selection.

## Features

- **Default Date**: Set to yesterday (-1 day from today)
- **Quick Date Selection**: Predefined periods with single checkbox selection
- **Custom Date Range**: Manual date range selection
- **Site Filtering**: Dropdown for site selection
- **Filter Summary**: Compact display showing current filters
- **Responsive Design**: Mobile-friendly layout

## Usage

### Basic Implementation

```jsx
import { ToolbarAnalytics } from "../components/toolBar/toolBarAnalytic";

const MyComponent = () => {
  const [sites, setSites] = useState([]);
  const [selectedSite, setSelectedSite] = useState('all');
  const [currentFilters, setCurrentFilters] = useState(null);

  // Handle filter changes
  const handleFilterChange = (filterData) => {
    setCurrentFilters(filterData);
    console.log('Applied Filters:', filterData);
    // filterData contains:
    // - dateRange: [startDate, endDate]
    // - site: selected site ID
    // - activeFilter: 'Yesterday' | 'This Week' | 'Custom Range' etc.
  };

  // Handle date range changes
  const handleDateRangeChange = (dateRange) => {
    console.log('Date Range:', dateRange);
    // Use the date range for API calls or data filtering
  };

  // Handle site changes
  const handleSiteChange = (siteData) => {
    setSelectedSite(siteData.value);
    console.log('Selected Site:', siteData.value);
  };

  const handleRefresh = () => {
    // Refresh data with current filters
    console.log('Refreshing with filters:', currentFilters);
  };

  return (
    <ToolbarAnalytics
      title="Dashboard"
      sites={sites}
      selectedSite={selectedSite}
      onSiteChange={handleSiteChange}
      onDateRangeChange={handleDateRangeChange}
      onFilterChange={handleFilterChange}
      onRefresh={handleRefresh}
      isLoading={false}
      // ... other props for stock management
    >
      {/* Your page content */}
      <div>Your dashboard content here</div>
    </ToolbarAnalytics>
  );
};
```

### New Props

| Prop | Type | Description |
|------|------|-------------|
| `onDateRangeChange` | `function` | Callback when date range changes |
| `onFilterChange` | `function` | Callback when filters are applied |

### Filter Data Structure

When filters are applied, the `onFilterChange` callback receives:

```javascript
{
  dateRange: [Date, Date],        // Start and end dates
  site: string,                   // Selected site ID
  activeFilter: string            // Active filter name
}
```

### Date Presets

The following date presets are available:

- **Today**: Current date
- **Yesterday**: Previous day (default)
- **This Week**: From start of current week to today
- **This Month**: From start of current month to today
- **This Year**: From start of current year to today
- **Custom Range**: User-defined date range

### Filter Summary

The toolbar displays a compact summary of active filters:
- Format: `{Site Name} | {Date Period}`
- Example: `All Sites | Yesterday`
- Example: `Site A | 01/15/2024 - 01/20/2024`

### Styling

The filter popup uses Tailwind CSS classes with the `tw-` prefix to avoid conflicts with DevExtreme. Custom styles are defined in `filterPopup.scss`.

### Mobile Responsiveness

- Filter popup adjusts for smaller screens
- Summary text truncates appropriately
- Touch-friendly interface elements

## Integration Example

```jsx
// In your page component
const StockAnalyticsPage = () => {
  const [data, setData] = useState([]);
  const [filters, setFilters] = useState(null);

  const fetchData = async (filterParams) => {
    if (!filterParams) return;

    const { dateRange, site } = filterParams;
    const [startDate, endDate] = dateRange;

    // API call with filters
    const response = await api.getStockData({
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
      siteId: site === 'all' ? null : site
    });

    setData(response.data);
  };

  const handleFilterChange = (filterData) => {
    setFilters(filterData);
    fetchData(filterData);
  };

  return (
    <ToolbarAnalytics
      title="Stock Analytics"
      sites={sites}
      onFilterChange={handleFilterChange}
      onRefresh={() => fetchData(filters)}
      // ... other props
    >
      <StockChart data={data} />
    </ToolbarAnalytics>
  );
};
```

## Notes

- Only one date selection can be active at a time (checkbox behavior)
- Default selection is "Yesterday"
- Filter state is managed internally by the component
- Parent components receive filter updates through callbacks
- The filter popup is positioned at the center of the screen
- Filter summary appears before the refresh button in the toolbar