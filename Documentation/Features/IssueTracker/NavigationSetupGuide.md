# Issue Tracker Navigation Setup Instructions

## Database Navigation Item Required

To complete the Issue Tracker navigation setup, you need to create a navigation item in the database using the Navigation Management page.

### Steps to Add Navigation Item:

1. **Navigate to Admin > Navigation Management**: `/admin/navigation`

2. **Click "Add" to create a new navigation item**

3. **Fill in the following details**:
   - **Page**: `issue tracker` (exactly as shown - this maps to the component in app-routes.js)
   - **Link**: `/issue-tracker` (this is the exact route path)
   - **Icon**: `fa-light fa-exclamation-triangle` (FontAwesome icon for issue tracking)
   - **Parent ID**: Leave empty for top-level item (or select a parent if you want it nested)
   - **Roles**: Select appropriate roles (Admin, Manager, etc.)

4. **Click "Save"**

### Alternative SQL (if direct database access):

```sql
INSERT INTO navigationitems (Page, Link, Icon, ParentId)
VALUES ('issue tracker', '/issue-tracker', 'fa-light fa-exclamation-triangle', NULL);
```

### Verification:

After creating the navigation item:
- The "Issue Tracker" menu item should appear in the main navigation
- Clicking it should navigate to `/issue-tracker`
- The orange triangle icon should be displayed
- Internal navigation should work with the sidebar layout

### Navigation Features Implemented:

✅ **Content.js Routes**: Added base route `/issue-tracker` and wildcard `/issue-tracker/*`
✅ **app-routes.js Mapping**: Maps "issue tracker" to IssueTrackerMain component
✅ **Layout Component**: IssueTrackerLayout with orange theme and sidebar navigation
✅ **Navigation Helper**: Routes and active state management
✅ **Main Component**: IssueTrackerMain with internal React Router routes
✅ **Placeholder Pages**: Create, Reports, Analytics, Settings pages

### Module Structure Created:

```
pages/issueTracker/
├── IssueTrackerMain.js          # Main entry point with routing
├── IssueTrackerPage.js          # Existing dashboard/list page
├── layout/
│   ├── IssueTrackerLayout.js    # Sidebar layout component
│   └── IssueTrackerLayout.scss  # Orange-themed styling
├── utils/
│   └── navigationHelper.js      # Route definitions and helpers
├── forms/
│   └── IssueCreateForm.js       # Create issue form
├── reports/
│   └── IssueReportsPage.js      # Issue reports
├── analytics/
│   └── IssueAnalyticsPage.js    # Issue analytics
└── settings/
    └── IssueSettingsPage.js     # Settings page
```

### Navigation Routes Available:

- `/issue-tracker` - Dashboard (uses existing IssueTrackerPage)
- `/issue-tracker/tickets` - Issue tickets list
- `/issue-tracker/create` - Create new issue
- `/issue-tracker/reports` - Issue reports
- `/issue-tracker/analytics` - Issue analytics
- `/issue-tracker/settings` - Configuration

The navigation setup follows the same pattern as Tank Stock, Vehicles, and Admin modules with a consistent sidebar layout and internal routing structure.
