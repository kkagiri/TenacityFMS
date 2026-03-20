# Bulk Import - User Guide: Scrolling & Settings

**Version**: 2.0
**Last Updated**: 2024
**Feature**: Tank Stock Bulk Import - Enhanced UX

---

## What's New

### 1. ✨ Scrolling Support
- You can now scroll through long validation reports and large data previews
- No more cut-off content when working with large Excel files
- Smooth vertical scrolling for better navigation

### 2. ⚙️ Configuration Settings
- New "Settings" button to customize bulk import behavior
- Save your preferred settings for all future imports
- Control duplicate handling, batch size, and validation options

---

## Using the Scrolling Feature

### How to Scroll

**Desktop:**
- Use mouse wheel to scroll up/down
- Click and drag scrollbar on the right side
- Use Page Up/Page Down keys

**Laptop:**
- Use two-finger scroll on touchpad
- Use scroll gesture on touchpad

### What You Can Scroll Through

1. **Excel Preview Grid** - View all uploaded rows
2. **Validation Report** - See all anomalies and warnings
3. **Import Instructions** - Read complete quick start guide
4. **Step-by-step sections** - Navigate through entire workflow

---

## Configuration Settings Guide

### Opening Settings

1. Navigate to **Tank Stock > Stock Management > Bulk Import**
2. Click the **"Settings"** button (⚙️ gear icon) in the top-right corner
3. Settings popup will open

### Available Settings

#### 📋 Import Behavior

**1. Default Duplicate Handling**
- **What it does**: Controls how duplicate records are handled
- **Options**:
  - **Skip duplicates (keep existing)** - If record exists, keep old data, ignore new data
  - **Replace duplicates (update existing)** - If record exists, update with new data
- **Default**: Skip duplicates
- **When to use**:
  - Skip: Importing historical data, protecting existing records
  - Replace: Correcting errors, updating with latest values

**2. Allow Import with Warnings**
- **What it does**: Allow import when warnings exist (non-blocking anomalies)
- **Options**: On/Off (checkbox)
- **Default**: On (checked)
- **When to use**:
  - On: Trust your data, proceed despite minor warnings
  - Off: Be strict, block import if any anomalies detected

#### ⚡ Performance & Limits

**3. Maximum Batch Size**
- **What it does**: Limits how many rows you can import at once
- **Range**: 100 - 10,000 rows
- **Default**: 1,000 rows
- **Step**: 100 (increments by 100)
- **When to adjust**:
  - Lower (500): Slower computer, smaller datasets
  - Higher (5,000): Powerful computer, large datasets
  - **Note**: Very large batches may slow down validation

#### ✅ Validation Options

**4. Enable Auto-Validation**
- **What it does**: Automatically validate data after file upload
- **Options**: On/Off (checkbox)
- **Default**: On (checked)
- **When to use**:
  - On: Faster workflow, immediate feedback
  - Off: Want to review data before validation

**5. Show Advanced Options**
- **What it does**: Show/hide advanced validation options in UI
- **Options**: On/Off (checkbox)
- **Default**: Off (unchecked)
- **When to use**:
  - On: Power users, need fine-grained control
  - Off: Simplified interface, standard workflow

---

## Step-by-Step: Configuring Settings

### Scenario 1: Change Default Duplicate Handling

**Goal**: Always update existing records when importing

**Steps**:
1. Click **"Settings"** button
2. In **"Import Behavior"** section, find **"Default Duplicate Handling"**
3. Select **"Replace duplicates (update existing)"** from dropdown
4. Click **"Save Settings"**
5. Close popup by clicking X or Cancel
6. Done! Next time you upload a file, "Replace" will be pre-selected

### Scenario 2: Increase Batch Size for Large Imports

**Goal**: Import 3,000 rows at once instead of default 1,000

**Steps**:
1. Click **"Settings"** button
2. In **"Performance & Limits"** section, find **"Maximum Batch Size (rows)"**
3. Click in the number box
4. Type **3000** or use up/down arrows
5. Click **"Save Settings"**
6. Close popup
7. Done! You can now import up to 3,000 rows per batch

### Scenario 3: Disable Auto-Validation

**Goal**: Review data before validating (manual control)

**Steps**:
1. Click **"Settings"** button
2. In **"Validation Options"** section, find **"Auto-Validation"**
3. Uncheck the box **"Automatically validate data after file upload"**
4. Click **"Save Settings"**
5. Close popup
6. Done! You must now click "Validate Data" button manually

---

## Understanding Settings Persistence

### Your Settings are Saved
- ✅ Settings save to database when you click "Save Settings"
- ✅ Settings persist across browser sessions (no need to reconfigure)
- ✅ Settings apply to all future imports
- ✅ Settings sync across different computers (if using same account)

### When Settings Apply
- **Default Duplicate Handling**: Pre-selected when you open page
- **Allow Warning Import**: Controls if import button enabled with warnings
- **Max Batch Size**: Enforced during validation
- **Auto-Validation**: Triggers validation after file upload
- **Advanced Options**: Shows/hides advanced UI elements

---

## Permissions

### Who Can View Settings?
- **Everyone** - All users can open and view settings

### Who Can Change Settings?
- **Administrators Only** - Users with `_Update_SystemConfiguration` permission
- If you don't have permission:
  - Settings button still visible
  - Can view current settings
  - "Save Settings" button disabled
  - Error message if you try to save

### Checking Your Permission
1. Click "Settings" button
2. Try to modify a setting
3. Click "Save Settings"
4. If you see error: "You do not have permission to update system configurations"
   - Contact your system administrator
   - They can grant you the `_Update_SystemConfiguration` permission

---

## Troubleshooting

### Settings Not Saving
**Problem**: Clicked "Save Settings" but changes don't persist

**Solutions**:
1. ✅ Check you have `_Update_SystemConfiguration` permission
2. ✅ Wait for success notification: "Settings saved successfully"
3. ✅ Refresh page and check if changes applied
4. ✅ Check browser console for errors (F12)
5. ✅ Contact system administrator if issue persists

### Scrolling Not Working
**Problem**: Cannot scroll through content

**Solutions**:
1. ✅ Try using mouse wheel instead of scrollbar
2. ✅ Check if content is long enough to require scrolling
3. ✅ Refresh page (Ctrl+F5 or Cmd+Shift+R)
4. ✅ Clear browser cache
5. ✅ Try different browser

### Settings Popup Won't Close
**Problem**: Popup stuck open or unresponsive

**Solutions**:
1. ✅ Click "Cancel" button
2. ✅ Click X button in top-right of popup
3. ✅ Press Escape key
4. ✅ Refresh page if stuck

### Default Not Applied
**Problem**: Changed default duplicate handling but old value still showing

**Solutions**:
1. ✅ Verify settings saved (success notification appeared)
2. ✅ Refresh the page (F5)
3. ✅ Log out and log back in
4. ✅ Clear browser cache

---

## Best Practices

### 💡 Recommended Settings for Different Scenarios

#### Scenario: First-Time Historical Import
```
✅ Default Duplicate Handling: Skip
✅ Allow Warning Import: Off (be strict)
✅ Max Batch Size: 1000 (default)
✅ Auto-Validation: On (immediate feedback)
✅ Advanced Options: Off (simpler)
```

#### Scenario: Regular Daily Updates
```
✅ Default Duplicate Handling: Replace
✅ Allow Warning Import: On (warnings ok)
✅ Max Batch Size: 500 (smaller batches)
✅ Auto-Validation: On (faster workflow)
✅ Advanced Options: Off
```

#### Scenario: Data Correction/Cleanup
```
✅ Default Duplicate Handling: Replace
✅ Allow Warning Import: Off (strict)
✅ Max Batch Size: 1000
✅ Auto-Validation: On
✅ Advanced Options: On (fine control)
```

#### Scenario: Large One-Time Import
```
✅ Default Duplicate Handling: Skip
✅ Allow Warning Import: On
✅ Max Batch Size: 5000 (higher limit)
✅ Auto-Validation: Off (manual review)
✅ Advanced Options: On
```

### 📊 Performance Tips

**For Faster Imports**:
- ✅ Enable auto-validation (saves one click)
- ✅ Set appropriate batch size (not too large, not too small)
- ✅ Use "Skip" for duplicates if data already exists
- ✅ Keep "Advanced Options" off unless needed

**For Better Accuracy**:
- ✅ Disable "Allow Warning Import" (strict validation)
- ✅ Review data before validation (disable auto-validation)
- ✅ Use "Replace" to ensure latest data
- ✅ Enable "Advanced Options" for granular control

---

## Quick Reference

### Settings Button Location
```
Top-right corner of bulk import page
Next to "Download Template" button
Icon: ⚙️ (gear/cog icon)
```

### Keyboard Shortcuts
- **Escape**: Close settings popup
- **Mouse Wheel**: Scroll up/down
- **Page Up/Down**: Scroll by page
- **Home/End**: Jump to top/bottom

### Default Values (Fresh Install)
| Setting | Default |
|---------|---------|
| Default Duplicate Handling | Skip |
| Allow Warning Import | ✅ On |
| Max Batch Size | 1000 |
| Auto-Validation | ✅ On |
| Advanced Options | ❌ Off |

---

## FAQ

**Q: Will my settings affect other users?**
A: No, settings are system-wide but each user sees the same defaults. If you change settings, it affects all future imports system-wide (not per-user).

**Q: Can I reset to default settings?**
A: Yes, manually change each setting back to default value, or ask administrator to run database script.

**Q: How do I know which settings are active?**
A: Open Settings popup to see current values. The form shows active configuration.

**Q: What happens if I change settings during an import?**
A: Current import uses old settings. New settings apply to next import.

**Q: Can I export/import settings?**
A: Not yet. Future enhancement planned for configuration backup/restore.

---

## Support

### Need Help?
1. Check this guide first
2. Review [SCROLLING_AND_CONFIGURATION_IMPLEMENTATION.md](./SCROLLING_AND_CONFIGURATION_IMPLEMENTATION.md) for technical details
3. Contact system administrator
4. Report bug if feature not working as described

### Feedback
- Report issues to development team
- Suggest new configuration options
- Share your use cases and workflows

---

**Last Updated**: 2024
**Related Documents**:
- [Bulk Import Implementation Guide](./BULK_IMPORT_IMPLEMENTATION.md)
- [Scrolling & Configuration Implementation](./SCROLLING_AND_CONFIGURATION_IMPLEMENTATION.md)
- [Database Schema](./database/BulkImport_SystemConfiguration.sql)
