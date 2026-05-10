/**
 * Widget Height Configuration Test
 *
 * This script demonstrates the new smart height defaults for dashboard widgets
 */

// Test data: Different widget types
const testWidgets = [
  {
    instanceId: '1',
    widgetType: 'BIG_STAT_CARD',
    customName: 'Total Fuel Consumption',
    template: { widgetType: 'BIG_STAT_CARD' }
  },
  {
    instanceId: '2',
    widgetType: 'CHART_LINE_TREND',
    customName: 'Fuel Trend',
    template: { widgetType: 'CHART_LINE_TREND' }
  },
  {
    instanceId: '3',
    widgetType: 'CHART_BAR_COMPARISON',
    customName: 'Station Comparison',
    template: { widgetType: 'CHART_BAR_COMPARISON' }
  },
  {
    instanceId: '4',
    widgetType: 'CHART_PIE_DISTRIBUTION',
    customName: 'Fuel Distribution',
    template: { widgetType: 'CHART_PIE_DISTRIBUTION' }
  },
  {
    instanceId: '5',
    widgetType: 'bigstat',
    customName: 'Average Efficiency',
    template: { widgetType: 'bigstat' }
  }
];

// Function to determine default height (replicated from CategoryGroupedWidgetRenderer)
function getDefaultHeight(widget) {
  const widgetType = (widget.widgetType || widget.templateType || widget.template?.widgetType || '').toLowerCase();
  let defaultHeight = 3; // Default for charts

  if (widgetType.includes('big_stat') || widgetType.includes('stat') || widgetType === 'bigstat') {
    defaultHeight = 2; // Shorter for stat cards
  }

  return defaultHeight;
}

// Test the function
console.log('Widget Height Configuration Test\n');
console.log('='.repeat(60));

testWidgets.forEach(widget => {
  const height = getDefaultHeight(widget);
  const type = widget.widgetType;
  const name = widget.customName;

  console.log(`\nWidget: ${name}`);
  console.log(`  Type: ${type}`);
  console.log(`  Default Height: ${height} units`);
  console.log(`  Visual Size: ${height === 2 ? 'Compact (2 units)' : 'Standard (3 units)'}`);
});

console.log('\n' + '='.repeat(60));
console.log('\nExpected Results:');
console.log('  - BIG_STAT_CARD widgets: 2 units (compact)');
console.log('  - bigstat widgets: 2 units (compact)');
console.log('  - CHART_LINE_TREND: 3 units (standard)');
console.log('  - CHART_BAR_COMPARISON: 3 units (standard)');
console.log('  - CHART_PIE_DISTRIBUTION: 3 units (standard)');

console.log('\n✅ All tests should match expected results');
