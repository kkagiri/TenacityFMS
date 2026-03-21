# Bulk Import - Scrolling and System Configuration Implementation

**Date**: 2024
**Status**: ✅ Complete
**Related Files**: BulkImportManager.js, BulkImportSettingsPopup.js

---

## Overview

Implemented two critical UX enhancements to the bulk import feature:
1. **Scrolling Support** - Added DevExtreme ScrollView to enable vertical scrolling
2. **System Configuration Integration** - Created settings popup connected to system configuration service

---

## 1. Scrolling Implementation

### Problem
- Content in BulkImportManager was not scrollable
- Long validation reports and large data previews were cut off

### Solution
Wrapped all content in DevExtreme `ScrollView` component:

```javascript
import { ScrollView } from 'devextreme-react/scroll-view';

<ScrollView
  height="calc(100vh - 200px)"
  width="100%"
  direction="vertical"
  showScrollbar="onScroll"
>
  {/* All bulk import content */}
</ScrollView>
```

### Configuration
- **Height**: `calc(100vh - 200px)` - Dynamic viewport height minus header/padding
- **Width**: `100%` - Full container width
- **Direction**: `vertical` - Vertical scrolling only
- **Scrollbar**: `onScroll` - Show scrollbar only when scrolling

---

## 2. System Configuration Integration

### Architecture

#### A. Configuration Service Integration
Connected bulk import to system configuration service using Redux pattern:

```javascript
import { fetchSystemConfigurations } from '../../../../../redux/actions/systemConfigActions';

// Load configurations on mount
React.useEffect(() => {
  dispatch(fetchSystemConfigurations({ category: 'BulkImport' }));
}, [dispatch]);
```

#### B. Configuration Keys
Five configuration settings control bulk import behavior:

| Configuration Key | Type | Default | Description |
|------------------|------|---------|-------------|
| `TankStock.BulkImport.DefaultDuplicateHandling` | String | "Skip" | Default duplicate handling mode |
| `TankStock.BulkImport.AllowWarningImport` | Boolean | true | Allow import with warnings |
| `TankStock.BulkImport.MaxBatchSize` | Number | 1000 | Maximum records per batch |
| `TankStock.BulkImport.EnableAutoValidation` | Boolean | true | Auto-validate after upload |
| `TankStock.BulkImport.ShowAdvancedOptions` | Boolean | false | Show advanced UI options |

#### C. Configuration Application
Configurations are applied as defaults when component loads:

```javascript
React.useEffect(() => {
  if (configurations.length > 0) {
    configurations.forEach(config => {
      switch (config.configurationKey) {
        case 'TankStock.BulkImport.DefaultDuplicateHandling':
          const defaultMode = config.configurationValue === 'Replace' ? 1 : 0;
          setDuplicateHandling(defaultMode);
          break;
        // ... other configurations
      }
    });
  }
}, [configurations]);
```

---

## 3. Settings Popup Component

### File: BulkImportSettingsPopup.js (257 lines)

#### Features
1. **DevExtreme Popup** - Modal dialog for configuration management
2. **Form Component** - Organized configuration fields with groups
3. **Permission-Based** - Requires `_Update_SystemConfiguration` permission
4. **Auto-Save** - Detects changes and enables/disables save button
5. **Redux Integration** - Uses systemConfigActions for CRUD operations

#### Component Structure

```javascript
import { Popup } from 'devextreme-react/popup';
import { ScrollView } from 'devextreme-react/scroll-view';
import Form, { SimpleItem, GroupItem, Label } from 'devextreme-react/form';

const BulkImportSettingsPopup = ({ visible, onHiding }) => {
  // State and Redux hooks
  const dispatch = useDispatch();
  const configurations = useSelector(state => state.systemConfig?.configurations || []);

  // Form data state
  const [formData, setFormData] = useState({
    defaultDuplicateHandling: 'Skip',
    allowWarningImport: true,
    maxBatchSize: 1000,
    enableAutoValidation: true,
    showAdvancedOptions: false
  });

  // Save handler
  const handleSave = async () => {
    // Update or create each configuration
    for (const configUpdate of configUpdates) {
      const existingConfig = configurations.find(
        c => c.configurationKey === configUpdate.key
      );

      if (existingConfig) {
        await dispatch(updateSystemConfiguration({...}));
      } else {
        await dispatch(createSystemConfiguration({...}));
      }
    }
  };

  return (
    <Popup visible={visible} onHiding={onHiding} title="Bulk Import Settings">
      <Form formData={formData} onFieldDataChanged={handleFieldDataChanged}>
        <GroupItem caption="Import Behavior">
          <SimpleItem dataField="defaultDuplicateHandling" editorType="dxSelectBox" />
          <SimpleItem dataField="allowWarningImport" editorType="dxCheckBox" />
        </GroupItem>

        <GroupItem caption="Performance & Limits">
          <SimpleItem dataField="maxBatchSize" editorType="dxNumberBox" />
        </GroupItem>

        <GroupItem caption="Validation Options">
          <SimpleItem dataField="enableAutoValidation" editorType="dxCheckBox" />
          <SimpleItem dataField="showAdvancedOptions" editorType="dxCheckBox" />
        </GroupItem>
      </Form>
    </Popup>
  );
};
```

#### Form Groups

**1. Import Behavior**
- Default Duplicate Handling (SelectBox)
  - Options: "Skip duplicates" or "Replace duplicates"
- Allow Warning Import (CheckBox)
  - Allow import when non-blocking anomalies exist

**2. Performance & Limits**
- Max Batch Size (NumberBox)
  - Range: 100 - 10,000 rows
  - Step: 100

**3. Validation Options**
- Enable Auto-Validation (CheckBox)
  - Automatically validate after file upload
- Show Advanced Options (CheckBox)
  - Show/hide advanced validation options in UI

---

## 4. UI Integration

### Settings Button
Added gear icon button next to "Download Template":

```javascript
<div className="tw-flex tw-gap-2">
  <Button
    text="Settings"
    icon="fa-light fa-cog"
    type="default"
    stylingMode="outlined"
    onClick={() => setShowConfigModal(true)}
  />
  <Button
    text="Download Template"
    icon="fa-light fa-download"
    type="default"
    stylingMode="outlined"
    onClick={handleDownloadTemplate}
  />
</div>
```

### Modal State Management
```javascript
const [showConfigModal, setShowConfigModal] = useState(false);

<BulkImportSettingsPopup
  visible={showConfigModal}
  onHiding={() => setShowConfigModal(false)}
/>
```

---

## 5. Redux Integration

### Actions Used
```javascript
import {
  fetchSystemConfigurations,
  updateSystemConfiguration,
  createSystemConfiguration
} from '../../../../../redux/actions/systemConfigActions';
```

### Workflow
1. **Fetch** - Load configurations on component mount or popup open
2. **Map** - Convert configuration values to form data
3. **Edit** - User modifies settings in popup
4. **Detect Changes** - Track form modifications
5. **Save** - Update existing or create new configurations
6. **Notify** - Show success/error messages

---

## 6. Permission System

### Required Permissions
- **View Settings**: No permission required (read-only access)
- **Update Settings**: `_Update_SystemConfiguration` permission required

### Implementation
```javascript
import { usePermissions } from '../../../../../hooks/usePermissions';

const { hasPermission } = usePermissions();

// Disable save button if no permission
<Button
  text="Save Settings"
  onClick={handleSave}
  disabled={!hasPermission('_Update_SystemConfiguration')}
/>

// Show notification if no permission
if (!hasPermission('_Update_SystemConfiguration')) {
  notify('You do not have permission to update system configurations', 'error', 3000);
  return;
}
```

---

## 7. Error Handling

### Fixed Issues
1. ✅ **Removed unused import** - Removed `Popup` import from BulkImportManager
2. ✅ **Fixed React Hook dependency** - Removed `formData` from useEffect dependency array
3. ✅ **ScrollView closing tag** - Properly closed ScrollView component

### Error Patterns
```javascript
try {
  // Save configuration
  await dispatch(updateSystemConfiguration({...}));
  notify('Settings saved successfully', 'success', 2000);
} catch (error) {
  notify('Failed to save settings: ' + error.message, 'error', 3000);
}
```

---

## 8. Backend Configuration Setup

### Database Table: `systemconfiguration`
Configurations are stored in the existing system configuration table with these columns:
- `ConfigurationId` (PK)
- `ConfigurationKey` (e.g., 'TankStock.BulkImport.DefaultDuplicateHandling')
- `ConfigurationValue` (e.g., 'Skip' or 'Replace')
- `Category` (e.g., 'BulkImport')
- `Description` (Optional)
- `IsActive` (Boolean)

### Initial Configuration SQL
```sql
-- Insert default bulk import configurations
INSERT INTO systemconfiguration (ConfigurationKey, ConfigurationValue, Category, Description, IsActive)
VALUES
  ('TankStock.BulkImport.DefaultDuplicateHandling', 'Skip', 'BulkImport', 'Default duplicate handling mode', 1),
  ('TankStock.BulkImport.AllowWarningImport', 'true', 'BulkImport', 'Allow import with warnings', 1),
  ('TankStock.BulkImport.MaxBatchSize', '1000', 'BulkImport', 'Maximum batch size limit', 1),
  ('TankStock.BulkImport.EnableAutoValidation', 'true', 'BulkImport', 'Enable auto-validation', 1),
  ('TankStock.BulkImport.ShowAdvancedOptions', 'false', 'BulkImport', 'Show advanced options', 1);
```

---

## 9. Testing Checklist

### Scrolling Tests
- [ ] Upload large Excel file (100+ rows)
- [ ] Verify vertical scrolling works
- [ ] Check scrollbar appears on hover/scroll
- [ ] Test on different screen sizes
- [ ] Verify content not cut off

### Configuration Tests
- [ ] Click "Settings" button - popup opens
- [ ] Verify all 5 settings load correctly
- [ ] Modify each setting - verify changes tracked
- [ ] Save settings - verify database updated
- [ ] Close popup - verify no unsaved changes lost
- [ ] Test without permission - verify disabled

### Integration Tests
- [ ] Change default duplicate handling in settings
- [ ] Verify new default applied on page load
- [ ] Upload file with auto-validation enabled
- [ ] Verify validation triggers automatically
- [ ] Test max batch size limit enforcement

---

## 10. Files Modified

### New Files Created
1. **BulkImportSettingsPopup.js** (257 lines)
   - Location: `fms.frontend/src/pages/tankStock/management/components/bulkImport/`
   - Purpose: System configuration popup for bulk import settings

### Modified Files
1. **BulkImportManager.js** (570 lines)
   - Added ScrollView wrapper
   - Added configuration state management
   - Added Settings button
   - Integrated BulkImportSettingsPopup
   - Applied configuration defaults

---

## 11. Usage Examples

### User Workflow: Change Default Duplicate Handling
1. Navigate to Tank Stock > Stock Management > Bulk Import
2. Click "Settings" button in header
3. In "Import Behavior" section, change "Default Duplicate Handling" to "Replace"
4. Click "Save Settings"
5. Close popup
6. Next time user uploads file, "Replace" is pre-selected

### User Workflow: Adjust Batch Size
1. Open Settings popup
2. In "Performance & Limits" section, change "Maximum Batch Size" to 500
3. Save settings
4. System will now enforce 500 row limit per batch

### Developer: Add New Configuration
```javascript
// 1. Add to database
INSERT INTO systemconfiguration
VALUES ('TankStock.BulkImport.NewSetting', 'DefaultValue', 'BulkImport', 'Description', 1);

// 2. Add to BulkImportSettingsPopup.js formData state
const [formData, setFormData] = useState({
  // ... existing settings
  newSetting: 'DefaultValue'
});

// 3. Add mapping in useEffect
case 'TankStock.BulkImport.NewSetting':
  newFormData.newSetting = config.configurationValue;
  break;

// 4. Add Form field
<SimpleItem
  dataField="newSetting"
  editorType="dxTextBox"
>
  <Label text="New Setting" />
</SimpleItem>

// 5. Add to save handler
{
  key: 'TankStock.BulkImport.NewSetting',
  value: formData.newSetting
}
```

---

## 12. Benefits

### User Experience
✅ **Scrolling** - Can now view all data and validation results
✅ **Customization** - Configure bulk import behavior per organization
✅ **Consistency** - Settings persist across sessions
✅ **Permission Control** - Only authorized users can modify settings

### Technical
✅ **Reusable Pattern** - Follows TankStockSettings.js pattern
✅ **Redux Integration** - Uses existing systemConfig infrastructure
✅ **DevExtreme Components** - ScrollView, Popup, Form
✅ **Permission System** - JWT-based permission checks

---

## 13. Future Enhancements

### Potential Additions
1. **Configuration Export/Import** - Backup/restore settings
2. **Audit Trail** - Track who changed what and when
3. **Role-Based Defaults** - Different defaults per role
4. **Advanced Validation Rules** - Configurable anomaly thresholds
5. **Email Notifications** - Alert on import completion/errors

---

## Summary

Successfully implemented scrolling support and system configuration integration for the bulk import feature. Users can now:
- Scroll through large datasets and validation reports
- Customize bulk import behavior via Settings popup
- Persist preferences across sessions
- Control access via permission system

All code follows existing patterns from TankStockSettings.js and integrates seamlessly with the Redux-based system configuration service.
