# Mode Selector - Quick Reference Guide

## 🚀 Quick Start

### For Developers

**Import the component:**
```javascript
import ModeSelector from './ModeSelector';
```

**Basic usage:**
```jsx
<ModeSelector
  selectedMode={newWidget.mode}
  widgetType={newWidget.visualizationType}
  dataSourceMeta={dataSourceMeta}
  onChange={(newMode, defaults) => {
    setNewWidget(prev => ({
      ...prev,
      mode: newMode,
      ...defaults
    }));
  }}
/>
```

**That's it!** The component handles everything else.

---

## 📚 Utility Functions

### Import
```javascript
import {
  getCompatibleModesForWidget,
  getRecommendedMode,
  validateModeForDataSource,
  getDefaultsForMode,
  getModeHelpText
} from '../utils/widgetModeCompatibility';
```

### Quick Examples

```javascript
// Get compatible modes for widget
const modes = getCompatibleModesForWidget('BIG_STAT_CARD', dataSourceMeta.supportedModes);

// Get recommended mode
const recommended = getRecommendedMode('CHART_LINE_TREND', dataSourceMeta);

// Validate mode
const { valid, reason, alternatives } = validateModeForDataSource('live', dataSourceMeta);

// Get smart defaults
const defaults = getDefaultsForMode('live', 'CHART_LINE_TREND');
// → { datePreset: 'today', granularity: 'minute', aggregation: 'SUM' }

// Get help text
const help = getModeHelpText('live', 'BIG_STAT_CARD');
// → "The metric will update automatically as new data arrives..."
```

---

## 🎨 Mode Reference Table

| Mode | When to Use | Best For | Auto-Defaults |
|------|-------------|----------|---------------|
| **Live** | Real-time monitoring | Current activity, alerts | today + minute/hour |
| **Snapshot** | Single period analysis | Yesterday's totals, last week | yesterday + day |
| **Daily Aggregated** | Trend over days | Weekly/monthly patterns | last_7_days + day |
| **Running Cumulative** | Running totals | Month-to-date, MBFU | this_month + day |
| **Rolling Window** | Moving average | Last 24h pattern | last_24_hours + hour |
| **Compare Periods** | Period comparison | This vs last week | last_7_days + day |

---

## 🔧 Widget Compatibility Quick Check

```javascript
// BIG_STAT_CARD
✅ live, snapshot, daily, running, compare
❌ rolling_window

// CHART_LINE_TREND
✅ live, daily, running, rolling, compare
❌ historical_snapshot

// CHART_BAR_COMPARISON
✅ live, snapshot, daily, running, compare
❌ rolling_window

// CHART_PIE_DISTRIBUTION
✅ live, snapshot, daily, running
❌ rolling_window, compare_periods

// DATA_TABLE_DETAILED
✅ live, snapshot, daily
❌ running, rolling, compare

// PROGRESS_LIST
✅ live, snapshot, daily, running
❌ rolling, compare
```

---

## 🐛 Common Issues & Solutions

### Issue: Mode card not showing
**Check:**
- Is the mode supported by data source? `dataSourceMeta.supportedModes`
- Is the mode compatible with widget type? Check compatibility matrix
- Are there any console errors?

### Issue: Wrong default applied
**Check:**
- `getDefaultsForMode()` return value
- `mergeWithMetadataDefaults()` is called correctly
- Data source metadata is loaded

### Issue: Validation warning not clearing
**Check:**
- User selected suggested alternative?
- `validateModeForDataSource()` returns `valid: true`
- Data source metadata refreshed

---

## 🎯 Best Practices

### DO ✅
- Always pass `dataSourceMeta` to ModeSelector
- Apply smart defaults from `getDefaultsForMode()`
- Show validation warnings prominently
- Use recommended modes where possible
- Test on mobile devices

### DON'T ❌
- Don't bypass compatibility checks
- Don't ignore validation results
- Don't hardcode mode defaults
- Don't hide advanced modes permanently
- Don't skip responsive testing

---

## 📱 Responsive Breakpoints

```css
/* Mobile: 1-column stack */
@media (max-width: 639px) {
  .mode-grid { grid-template-columns: 1fr; }
}

/* Tablet: 2-column for historical/advanced */
@media (min-width: 640px) {
  .mode-grid { grid-template-columns: repeat(2, 1fr); }
}

/* Desktop: Full layout */
@media (min-width: 768px) {
  /* All descriptions visible */
}
```

---

## 🔍 Debugging Tips

### Enable console logging
```javascript
// In ModeSelector.js or WidgetForm.js
console.log('[ModeSelector] Compatible modes:', compatibleModes);
console.log('[ModeSelector] Selected mode:', selectedMode);
console.log('[ModeSelector] Validation:', modeValidation);
```

### Check React DevTools
- Component props: `selectedMode`, `widgetType`, `dataSourceMeta`
- State: `showAdvancedModes`
- Hooks: `useMemo` for mode grouping

### Verify mode data
```javascript
// In browser console
console.log(MODE_DEFINITIONS);
console.log(getCompatibleModesForWidget('BIG_STAT_CARD', []));
```

---

## 🧪 Testing Checklist

```markdown
### Component Rendering
- [ ] Mode cards display correctly
- [ ] Icons show properly (fa-light set)
- [ ] Colors match design (green, blue, purple, etc.)
- [ ] Responsive layout works (mobile/tablet/desktop)

### Functionality
- [ ] Mode selection changes state
- [ ] Smart defaults apply on selection
- [ ] Validation warnings show when needed
- [ ] Alternative suggestions work
- [ ] Advanced toggle shows/hides modes
- [ ] Help text updates per mode

### Integration
- [ ] Widget type change applies recommended mode
- [ ] Data source change validates mode
- [ ] Form updates with mode changes
- [ ] Metadata loading triggers defaults

### Edge Cases
- [ ] No compatible modes (empty state)
- [ ] All modes excluded (shows message)
- [ ] Invalid mode selected (auto-switches)
- [ ] Data source without metadata (fallback)
```

---

## 📖 API Reference

### ModeSelector Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `selectedMode` | string | Yes | Current mode value (e.g., 'live') |
| `widgetType` | string | Yes | Widget type ID (e.g., 'BIG_STAT_CARD') |
| `dataSourceMeta` | object | No | Data source metadata with supportedModes |
| `onChange` | function | Yes | Callback: `(mode, defaults) => void` |

### onChange Callback

```javascript
onChange: (newMode: string, defaults: object) => void

// defaults object:
{
  datePreset: string,    // e.g., 'today', 'yesterday'
  granularity: string,   // e.g., 'minute', 'hour', 'day'
  aggregation: string    // e.g., 'SUM', 'AVG'
}
```

---

## 🎨 Styling Customization

### Override mode colors
```javascript
// In widgetModeCompatibility.js
export const MODE_DEFINITIONS = {
  live: {
    // ...
    color: 'emerald',  // Change from 'green'
  }
};
```

### Custom card styles
```jsx
// In ModeSelector.js ModeCard component
<button
  className={`tw-p-4 tw-border-3 ...`}  // Increase padding/border
>
```

### Hide advanced section
```jsx
// In ModeSelector.js
const [showAdvancedModes, setShowAdvancedModes] = useState(true);  // Always show
```

---

## 📦 File Structure

```
fms.frontend/
├── src/
│   ├── components/
│   │   └── dashboard/
│   │       └── ModalPopup/
│   │           ├── WidgetForm.js (modified)
│   │           └── ModeSelector.js (new)
│   └── utils/
│       └── widgetModeCompatibility.js (new)
└── Documentation/
    └── Features/
        └── Dashboard/
            ├── UI-Design-SupportedModes-Analysis.md
            ├── Mode-Selector-Implementation-Summary.md
            ├── Mode-Selector-Visual-Examples.md
            └── Mode-Selector-Quick-Reference.md (this file)
```

---

## 🔗 Related Documentation

- [UI Design Analysis](./UI-Design-SupportedModes-Analysis.md) - Full design brainstorm
- [Implementation Summary](./Mode-Selector-Implementation-Summary.md) - What was built
- [Visual Examples](./Mode-Selector-Visual-Examples.md) - How it looks
- [Widget Capabilities Matrix](./matrix/WidgetCapabilitiesMatrix.md) - Backend contracts

---

## 💡 Tips & Tricks

### Tip 1: Pre-select best mode
```javascript
useEffect(() => {
  if (!newWidget.mode && newWidget.visualizationType && dataSourceMeta) {
    const recommended = getRecommendedMode(newWidget.visualizationType, dataSourceMeta);
    setNewWidget(prev => ({ ...prev, mode: recommended }));
  }
}, [newWidget.visualizationType, dataSourceMeta]);
```

### Tip 2: Log mode changes for analytics
```javascript
onChange={(newMode, defaults) => {
  console.log('[Analytics] Mode changed:', {
    from: selectedMode,
    to: newMode,
    widget: widgetType
  });
  // Send to analytics service
}}
```

### Tip 3: Show mode in widget preview
```javascript
<div className="widget-preview">
  <div className="mode-badge">{selectedMode}</div>
  {/* Widget content */}
</div>
```

---

**Quick Reference Complete!** 🎉

For detailed implementation, see [Implementation Summary](./Mode-Selector-Implementation-Summary.md)
