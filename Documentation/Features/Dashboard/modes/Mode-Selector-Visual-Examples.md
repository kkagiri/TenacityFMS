# Mode Selector - Visual Examples

## Desktop View (≥768px)

```
┌─────────────────────────────────────────────────────────────────┐
│  Widget Configuration                                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  📊 Data Mode                        [👁️ Show Advanced]        │
│  Select how data points should be aggregated over time         │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ⚠️  Alert Summary doesn't support live streaming       │   │
│  │     Try: [Snapshot] [Daily Aggregated]                 │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
│  REAL-TIME                                                      │
│  ┌──────────────────────────────────────────────────────┐     │
│  │  📡  Live                               [Recommended]  │     │
│  │  Stream the most recent telemetry as updates arrive   │     │
│  └──────────────────────────────────────────────────────┘     │
│                                                                 │
│  HISTORICAL                                                     │
│  ┌───────────────────────────┐  ┌───────────────────────────┐ │
│  │  📷  Snapshot              │  │  📅  Daily Aggregated     │ │
│  │  Single point-in-time     │  │  One point per day        │ │
│  │  value for chosen preset  │  │  for the window           │ │
│  └───────────────────────────┘  └───────────────────────────┘ │
│                                                                 │
│  ┌───────────────────────────┐                                 │
│  │  📈  Running Cumulative    │ [SELECTED - Purple Border]     │
│  │  Running totals (MBFU)    │                                 │
│  │  accumulating over range  │                                 │
│  └───────────────────────────┘                                 │
│                                                                 │
│  🔬 ADVANCED                                                    │
│  ┌───────────────────────────┐  ┌───────────────────────────┐ │
│  │  🪟  Rolling Window        │  │  🔀  Compare Periods      │ │
│  │  Fixed-size moving window │  │  Compare current vs       │ │
│  │  (e.g., last 24h)         │  │  previous period          │ │
│  └───────────────────────────┘  └───────────────────────────┘ │
│                                                                 │
│  ┌────────────────────────────────────────────────────────┐   │
│  │ ℹ️  Line shows cumulative total growing each day       │   │
│  │     (MBFU pattern).                                     │   │
│  └────────────────────────────────────────────────────────┘   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Tablet View (640px - 768px)

```
┌──────────────────────────────────────────┐
│  Widget Configuration                    │
├──────────────────────────────────────────┤
│  📊 Data Mode      [👁️ Show Advanced]   │
│  Select how data should be loaded        │
│                                          │
│  REAL-TIME                               │
│  ┌────────────────────────────────────┐ │
│  │  📡  Live                    [Rec]  │ │
│  │  Stream the most recent...         │ │
│  └────────────────────────────────────┘ │
│                                          │
│  HISTORICAL                              │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │ 📷 Snapshot     │ │ 📅 Daily Agg.   ││
│  │ Point-in-time   │ │ One per day     ││
│  └─────────────────┘ └─────────────────┘│
│                                          │
│  ┌─────────────────┐                    │
│  │ 📈 Running Cum. │ [SELECTED]         │
│  │ Running totals  │                    │
│  └─────────────────┘                    │
│                                          │
│  🔬 ADVANCED                             │
│  ┌─────────────────┐ ┌─────────────────┐│
│  │ 🪟 Rolling Win. │ │ 🔀 Compare      ││
│  │ Moving window   │ │ Periods         ││
│  └─────────────────┘ └─────────────────┘│
│                                          │
│  ℹ️  Running totals accumulating...     │
│                                          │
└──────────────────────────────────────────┘
```

## Mobile View (<640px)

```
┌────────────────────────────┐
│  Widget Configuration      │
├────────────────────────────┤
│  📊 Data Mode              │
│     [👁️ Advanced]          │
│  Select how data loads     │
│                            │
│  REAL-TIME                 │
│  ┌────────────────────────┐│
│  │ 📡 Live         [Rec]  ││
│  │ Stream updates         ││
│  └────────────────────────┘│
│                            │
│  HISTORICAL                │
│  ┌────────────────────────┐│
│  │ 📷 Snapshot            ││
│  │ Point-in-time value    ││
│  └────────────────────────┘│
│                            │
│  ┌────────────────────────┐│
│  │ 📅 Daily Aggregated    ││
│  │ One point per day      ││
│  └────────────────────────┘│
│                            │
│  ┌────────────────────────┐│
│  │ 📈 Running Cumulative  ││
│  │ Running totals (MBFU)  ││
│  └────────────────────────┘│
│   ^ SELECTED (purple bg)   │
│                            │
│  ℹ️  Running totals        │
│     accumulating over      │
│     the range.             │
│                            │
└────────────────────────────┘
```

## Color States

### Unselected (Default)
```
┌────────────────────────────┐
│ 📡 Live                    │ ← Gray border (tw-border-gray-200)
│ Stream updates...          │   White background (tw-bg-white)
└────────────────────────────┘
```

### Hover
```
┌────────────────────────────┐
│ 📡 Live                    │ ← Green border (tw-border-green-300)
│ Stream updates...          │   Light green bg (tw-bg-green-50)
└────────────────────────────┘
```

### Selected
```
┌════════════════════════════┐
║ 📡 Live              [Rec] ║ ← Bold green border (tw-border-green-500)
║ Stream updates...          ║   Green background (tw-bg-green-50)
└════════════════════════════┘
```

### Recommended Badge
```
┌────────────────────────────┐
│ 📡 Live    ┌──────────────┐│
│ Stream...  │ Recommended  ││ ← Blue badge (tw-bg-blue-100)
└────────────└──────────────┘│
```

## Mode Colors Reference

| Mode                  | Icon              | Color  | Border (selected)      |
|-----------------------|-------------------|--------|------------------------|
| Live                  | 📡 fa-signal-stream | Green  | tw-border-green-500   |
| Snapshot              | 📷 fa-camera        | Blue   | tw-border-blue-500    |
| Daily Aggregated      | 📅 fa-calendar-days | Purple | tw-border-purple-500  |
| Running Cumulative    | 📈 fa-chart-line-up | Orange | tw-border-orange-500  |
| Rolling Window        | 🪟 fa-window-frame  | Teal   | tw-border-teal-500    |
| Compare Periods       | 🔀 fa-code-compare  | Indigo | tw-border-indigo-500  |

## Interactive States

### 1. Normal State - No Issues
```
┌─────────────────────────────────┐
│ 📊 Data Mode  [👁️ Show Advanced] │
│ Choose how data should load     │
│                                 │
│ REAL-TIME                       │
│ [Live Card]                     │
│                                 │
│ HISTORICAL                      │
│ [Snapshot] [Daily Aggregated]   │
│ [Running Cumulative]            │
│                                 │
│ ℹ️  Line shows cumulative...    │
└─────────────────────────────────┘
```

### 2. Validation Warning
```
┌─────────────────────────────────┐
│ 📊 Data Mode  [👁️ Show Advanced] │
│ Choose how data should load     │
│                                 │
│ ┌─────────────────────────────┐ │
│ │ ⚠️  Alert Summary doesn't   │ │ ← Yellow background
│ │     support live streaming  │ │   (tw-bg-yellow-50)
│ │     Try: [Snapshot] [Daily] │ │
│ └─────────────────────────────┘ │
│                                 │
│ REAL-TIME                       │
│ [Live Card] (grayed out)        │
│                                 │
│ HISTORICAL                      │
│ [Snapshot] [Daily Aggregated]   │
└─────────────────────────────────┘
```

### 3. Advanced Collapsed (Default)
```
┌─────────────────────────────────┐
│ 📊 Data Mode  [👁️ Show Advanced] │
│                                 │
│ REAL-TIME                       │
│ [Live Card]                     │
│                                 │
│ HISTORICAL                      │
│ [Snapshot] [Daily]              │
│ [Running Cumulative]            │
│                                 │
│ (Advanced modes hidden)         │
└─────────────────────────────────┘
```

### 4. Advanced Expanded
```
┌─────────────────────────────────┐
│ 📊 Data Mode  [🙈 Simple View]   │
│                                 │
│ REAL-TIME                       │
│ [Live Card]                     │
│                                 │
│ HISTORICAL                      │
│ [Snapshot] [Daily]              │
│ [Running Cumulative]            │
│                                 │
│ 🔬 ADVANCED                      │
│ [Rolling Window] [Compare]      │
└─────────────────────────────────┘
```

## Animation Examples

### Mode Selection
```
Before:                        After:
┌──────────────┐              ┌══════════════┐
│ 📷 Snapshot  │  →  Click → ║ 📷 Snapshot  ║
│ Point-in...  │              ║ Point-in...  ║
└──────────────┘              └══════════════┘
Gray border                   Blue border (selected)
                              + Help text appears below
```

### Toggle Advanced
```
Collapsed:                     Expanded:
[👁️ Show Advanced]     →      [🙈 Simple View]
(No advanced section)          🔬 ADVANCED
                              [Rolling] [Compare]
```

### Mode Change with Defaults
```
User Action:                   Auto-Applied:
1. Click "Live" card    →     • datePreset: 'today'
                              • granularity: 'minute'
                              • aggregation: 'SUM'

2. Help text updates    →     "New data points will be
                               added to the chart..."
```

## Empty State
```
┌─────────────────────────────────┐
│ 📊 Data Mode                    │
│                                 │
│  ┌───────────────────────────┐ │
│  │     🚫                    │ │
│  │  No compatible data modes │ │
│  │  available for this       │ │
│  │  configuration.           │ │
│  └───────────────────────────┘ │
└─────────────────────────────────┘
```

---

## Implementation CSS Classes

### Card Base
```css
tw-p-3                    /* Padding */
tw-border-2               /* Border width */
tw-rounded-lg             /* Rounded corners */
tw-transition-all         /* Smooth transitions */
tw-text-left              /* Left-aligned text */
tw-w-full                 /* Full width */
```

### Selected State (Example: Live/Green)
```css
tw-border-green-500       /* Green border */
tw-bg-green-50            /* Light green background */
```

### Hover State
```css
hover:tw-border-green-300 /* Lighter green on hover */
```

### Grid Layouts
```css
/* Real-time: 1 column */
tw-grid tw-grid-cols-1 tw-gap-2

/* Historical/Advanced: Responsive 2-column */
tw-grid tw-grid-cols-1 sm:tw-grid-cols-2 tw-gap-2
```

### Icon Classes
```css
fa-light fa-signal-stream  /* Icon font */
tw-text-lg                 /* Icon size */
tw-text-green-600          /* Icon color */
tw-mr-2                    /* Right margin */
```

---

**End of Visual Examples**
