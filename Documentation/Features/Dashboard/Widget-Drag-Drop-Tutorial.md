# Dashboard Widget Drag & Drop Tutorial

## Overview
This tutorial explains how to use the new drag & drop functionality to reorder dashboard widgets in the Hyoung FMS system.

## Features Implemented
- ✅ Drag & Drop reordering of Key Statistics widgets
- ✅ Visual feedback during dragging
- ✅ Position persistence across dashboard loads
- ✅ Automatic position calculation for new widgets
- ✅ 4-column responsive grid layout

## How to Access the Drag & Drop Feature

### Step 1: Open the Dashboard
1. Navigate to the main dashboard
2. Look for the "Key Statistics" section

### Step 2: Open Widget Configuration
1. Click the **"Configure"** button in the Key Statistics section header
2. This opens the **Widget Configuration Modal**

### Step 3: Access Widget Visibility
1. In the Widget Configuration Modal, click **"Back to List"** if you're in add/edit mode
2. Look for widgets in the **"Key Statistics"** tab
3. Or you can access the **Widget Visibility Modal** directly (if available as a separate button)

## How to Use Drag & Drop

### Visual Elements to Look For:

1. **Widget Cards**: Each widget appears as a card with:
   - ✅ **Drag handle** (⋮⋮ icon) on the left side
   - ✅ **Position number** badge (#1, #2, #3, etc.)
   - ✅ Checkbox to enable/disable
   - ✅ Widget name and settings

2. **Drag Instructions**: Blue banner at the top saying "Drag to reorder widgets"

### Drag & Drop Steps:

#### Method 1: Drag by the Handle
1. **Hover** over the **drag handle** (⋮⋮ icon) on the left side of any widget card
2. **Click and hold** the drag handle
3. **Drag** the widget to the desired position
4. **Drop** it on another widget card to insert it at that position

#### Method 2: Drag the Entire Card
1. **Click and hold** anywhere on the widget card
2. **Drag** the widget to the desired position
3. **Drop** it on another widget card

### Visual Feedback During Drag:

- **Dragged Item**: Becomes semi-transparent and slightly smaller
- **Drop Target**: Gets a blue border and slight scale-up effect
- **Cursor**: Changes to indicate dragging state

### What Happens After Drop:

1. **Automatic Reordering**: Widgets are reordered in the new sequence
2. **Position Update**: Position numbers (#1, #2, etc.) update automatically
3. **API Save**: New order is saved to the database
4. **Dashboard Update**: Order is applied to the live dashboard immediately

## Troubleshooting

### "I don't see the drag handles"
**Check:**
- Make sure you have widgets configured in Key Statistics
- Look for the ⋮⋮ (grip-vertical) icon on the left side of widget cards
- Try hovering over the icon - it should become more visible and turn blue

### "Drag doesn't work"
**Possible Issues:**
1. **Browser Support**: Ensure you're using a modern browser that supports HTML5 drag & drop
2. **CSS Loading**: Check if the WidgetVisibilityModal.css file is loading properly
3. **Widget Data**: Make sure you have at least 2 widgets to drag between

### "Changes don't persist"
**Check:**
- Browser console for API errors
- Network tab to see if API calls are successful
- Refresh the dashboard to see if changes were saved

## Step-by-Step Example

### Scenario: Reorder 4 widgets

**Current Order:**
1. Today Fuel Dispensed (#1)
2. Engine Hours (#2)
3. Distance Travelled (#3)
4. Yesterday Fuel (#4)

**Goal:** Move "Distance Travelled" to position #1

**Steps:**
1. Open Widget Configuration → Key Statistics tab
2. Find "Distance Travelled" widget (currently #3)
3. Click and drag the ⋮⋮ handle
4. Drag it to the "Today Fuel Dispensed" widget position
5. Drop it there

**Result:**
1. Distance Travelled (#1) ← Moved here
2. Today Fuel Dispensed (#2) ← Shifted down
3. Engine Hours (#3) ← Shifted down
4. Yesterday Fuel (#4) ← Unchanged

## Technical Details

### Position Calculation
- Widgets are arranged in a **4-column grid**
- `positionX = position % 4` (column: 0, 1, 2, 3)
- `positionY = Math.floor(position / 4)` (row: 0, 1, 2, ...)

### Data Structure
Each widget stores:
```javascript
{
  id: "widget_id",
  label: "Widget Name",
  enabled: true,
  position: 0,      // Linear position (0, 1, 2, 3...)
  positionX: 0,     // Grid column (0-3)
  positionY: 0      // Grid row (0, 1, 2...)
}
```

### API Integration
- Changes are saved via `dashboardPreferencesService.updatePreferences()`
- Widget order persists across browser sessions
- Dashboard automatically loads widgets in saved order

## Browser Compatibility

**Supported Browsers:**
- ✅ Chrome 4+
- ✅ Firefox 3.5+
- ✅ Safari 3.1+
- ✅ Edge (all versions)
- ✅ Internet Explorer 9+

## Next Steps

After mastering basic drag & drop:

1. **Add New Widgets**: Use "Add Widget" to create more widgets to arrange
2. **Enable/Disable**: Use checkboxes to control widget visibility
3. **Configure Settings**: Edit individual widget settings for data sources and filters
4. **Monitor Performance**: Check that dashboard loads widgets in your preferred order

## Support

If you encounter issues:
1. Check browser console for JavaScript errors
2. Verify network connectivity for API calls
3. Contact the development team with specific error messages

---

**Last Updated:** September 2, 2025
**Feature Version:** 2.0
**Compatible with:** Hyoung FMS Dashboard v2.0+
