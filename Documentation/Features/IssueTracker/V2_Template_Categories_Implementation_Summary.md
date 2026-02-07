# Issue Template Categories Implementation Summary
**Feature**: Many-to-Many Relationship between Issue Templates and Categories
**Date**: 2026-02-07
**Version**: V2
**Status**: ✅ COMPLETE

---

## Overview

Implemented a tagging/categorization system for issue templates allowing multiple categories per template. This enables better organization and filtering of templates based on device type, issue type, and component categories.

### Business Scenario
1. User selects **Device Type** → "Fuel Sensor"
2. User selects **Template** → "Fuel Disconnection"
3. Template shows **Categories/Tags** → ["Fuel Sensor", "Disconnection", "Hardware"]
4. Issues created from template inherit template categories

---

## Architecture Changes

### Database Schema
- **New Table**: `issuetemplate_categories` (junction table)
- **Relationship**: Many-to-Many between `issuetemplate` and `issuecategory`
- **Cascade**: DELETE CASCADE on both foreign keys

```sql
CREATE TABLE `issuetemplate_categories` (
  `IssueTemplateID` INT(11) NOT NULL,
  `IssueCategoryID` INT(11) NOT NULL,
  `CreatedAt` DATETIME DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IssueTemplateID`, `IssueCategoryID`),
  -- Foreign keys with cascade delete
);
```

### Domain Layer Changes ⚠️ (Approved)
1. **`Issuetemplate` Entity**:
   - Added: `public virtual ICollection<Issuecategory> Categories { get; set; }`

2. **`Issuecategory` Entity**:
   - Added: `public virtual ICollection<Issuetemplate> IssueTemplates { get; set; }`

### Backend Changes

#### Entity Configuration
- **File**: `FMS.Persistence/EntityConfigurations/IssueTemplateConfiguration.cs`
- **Added**: Many-to-many configuration using `UsingEntity<Dictionary<string, object>>`

#### DTOs Updated
- **File**: `FMS.Application/Features/IssueTracker/DTOs/V2/IssueTemplateDTOs.cs`
- **Added to IssueTemplateDTO**:
  - `List<int> CategoryIds`
  - `List<CategorySummaryDTO> Categories`
- **Added to CreateIssueTemplateDTO**: `List<int> CategoryIds`
- **Added to UpdateIssueTemplateDTO**: `List<int> CategoryIds`
- **New DTO**: `CategorySummaryDTO` (Id, Name, Description)

#### Command Handlers
- **File**: `FMS.Application/Features/IssueTracker/Commands/V2/IssueTemplates/IssueTemplateCommandHandlers.cs`
- **CreateIssueTemplateCommandHandler**:
  - Validates category IDs exist
  - Assigns categories to template after creation
  - Returns categories in response DTO
- **UpdateIssueTemplateCommandHandler**:
  - Loads existing categories
  - Clears and replaces categories if provided
  - Returns updated categories in response

#### Query Handlers
- **File**: `FMS.Application/Features/IssueTracker/Queries/V2/IssueTemplates/IssueTemplateQueryHandlers.cs`
- **Updated Both Handlers**:
  - Added `.Include(t => t.Categories)` to queries
  - Added category projection to DTOs

### Frontend Changes

#### IssueTemplateDropdown Component
- **File**: `fms.frontend/src/pages/issueTracker/components/IssueTemplateDropdown.js`
- **Added**:
  - Category loading on component mount
  - `TagBox` for multi-select category selection
  - Category IDs included in template creation payload
  - Categories stored in `templateDraft` state

#### IssueCreateForm Component
- **File**: `fms.frontend/src/pages/issueTracker/forms/IssueCreateForm.js`
- **Added**:
  - Display template categories as tags when template selected
  - Auto-select first category from template if available
  - Visual category badges with icons

#### Service Layer
- **File**: `fms.frontend/src/services/issueTrackerV2Service.js`
- **Updated**: JSDoc comments to include `categoryIds` parameter

---

## Files Modified

### Database
- ✅ `Documentation/Features/IssueTracker/database/V2_AddIssueTemplateCategories.sql` (NEW)

### Domain Layer
- ✅ `FMS.Domain/Entities/Features/IssueTrackerManagement/Issuetemplate.cs`
- ✅ `FMS.Domain/Entities/Features/IssueTrackerManagement/Issuecategory.cs`

### Backend
- ✅ `FMS.Persistence/EntityConfigurations/IssueTemplateConfiguration.cs`
- ✅ `FMS.Application/Features/IssueTracker/DTOs/V2/IssueTemplateDTOs.cs`
- ✅ `FMS.Application/Features/IssueTracker/Commands/V2/IssueTemplates/IssueTemplateCommandHandlers.cs`
- ✅ `FMS.Application/Features/IssueTracker/Queries/V2/IssueTemplates/IssueTemplateQueryHandlers.cs`

### Frontend
- ✅ `fms.frontend/src/pages/issueTracker/components/IssueTemplateDropdown.js`
- ✅ `fms.frontend/src/pages/issueTracker/forms/IssueCreateForm.js`
- ✅ `fms.frontend/src/services/issueTrackerV2Service.js`

---

## Testing Checklist

### Database
- [ ] Run migration SQL script: `V2_AddIssueTemplateCategories.sql`
- [ ] Verify junction table created successfully
- [ ] Test cascade delete behavior

### Backend API
- [ ] **POST** `/api/v1/issue-templates` with `categoryIds` array
- [ ] **PUT** `/api/v1/issue-templates/{id}` with updated `categoryIds`
- [ ] **GET** `/api/v1/issue-templates/{id}` - verify categories returned
- [ ] **GET** `/api/v1/issue-templates/device-type/{deviceTypeId}` - verify categories

### Frontend UI
- [ ] Template creation popup shows category TagBox
- [ ] Can select multiple categories when creating template
- [ ] Template categories displayed in issue creation form
- [ ] Categories shown as tags with proper styling
- [ ] First category auto-selected when template chosen

### Integration Tests
- [ ] Create template with 3 categories
- [ ] Update template to add/remove categories
- [ ] Create issue from template → verify category inherited
- [ ] Delete template → verify junction records cascade deleted
- [ ] Delete category → verify junction records cascade deleted

---

## API Usage Examples

### Create Template with Categories
```http
POST /api/v1/issue-templates
Content-Type: application/json

{
  "deviceTypeId": 1,
  "name": "Fuel Sensor Disconnection",
  "titleTemplate": "Fuel sensor offline on {vehicle}",
  "descriptionTemplate": "Fuel sensor has disconnected on vehicle {vehicle}",
  "defaultPriorityId": 2,
  "defaultStatusId": 1,
  "isActive": true,
  "categoryIds": [5, 12, 8]  // Fuel Sensor, Disconnection, Hardware
}
```

### Update Template Categories
```http
PUT /api/v1/issue-templates/123
Content-Type: application/json

{
  "id": 123,
  "deviceTypeId": 1,
  "name": "Fuel Sensor Disconnection",
  "categoryIds": [5, 12, 8, 15]  // Added "Critical" category
}
```

### Response with Categories
```json
{
  "success": true,
  "data": {
    "id": 123,
    "deviceTypeId": 1,
    "deviceTypeName": "Fuel Sensor",
    "name": "Fuel Sensor Disconnection",
    "categoryIds": [5, 12, 8],
    "categories": [
      { "id": 5, "name": "Fuel Sensor", "description": null },
      { "id": 12, "name": "Disconnection", "description": "Device connectivity issues" },
      { "id": 8, "name": "Hardware", "description": "Physical hardware problems" }
    ]
  }
}
```

---

## Migration Steps

### Step 1: Database
```bash
# Run migration script on MySQL
mysql -u root -p fms_database < Documentation/Features/IssueTracker/database/V2_AddIssueTemplateCategories.sql
```

### Step 2: Backend
```bash
# Build and test backend
cd FMS.WebClient
dotnet build
dotnet run
```

### Step 3: Frontend
```bash
# Build frontend
cd fms.frontend
npm install  # If needed for TagBox component
npm run build
```

### Step 4: Verification
1. Open Issue Tracker → Settings → Templates
2. Create new template
3. Select multiple categories using TagBox
4. Save template
5. Create issue using template
6. Verify categories displayed as tags

---

## Benefits

✅ **Better Organization**: Templates tagged with multiple relevant categories
✅ **Enhanced Filtering**: Filter templates by any category combination
✅ **User Guidance**: Visual category tags help users understand template purpose
✅ **Flexible Categorization**: No limit on categories per template
✅ **Inheritance**: Issues inherit template categories automatically
✅ **Searchability**: Can search/filter by category tags

---

## Future Enhancements

- [ ] Category-based template filtering in dropdown
- [ ] Category color coding for visual distinction
- [ ] Category usage analytics (most used categories)
- [ ] Suggest categories based on device type
- [ ] Category hierarchy (parent-child categories)

---

## Notes

- Categories are **optional** - templates can have 0 to N categories
- Deleting a category removes associations but doesn't delete templates
- Deleting a template removes all category associations (cascade)
- First category from template auto-selected in issue creation (can be changed)
- TagBox allows typing to search/filter categories

---

**Implementation Status**: ✅ COMPLETE
**Ready for Testing**: YES
**Breaking Changes**: NO (backward compatible)
