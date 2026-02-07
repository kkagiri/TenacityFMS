# Notification Module — Frontend Routing & Navigation

> See the master [README.md](./README.md) for full system context.

---

## Base Route

```
/admin/notification
```

The notification module is registered in the FMS admin section and uses DevExtreme `Tabs` for sub-navigation within a shared layout (`NotificationLayout.js`).

---

## Route Map

```
/admin/notification
├── /                              → Dashboard (default)
├── /policies                      → Policy Management (list)
├── /policies/create               → Create New Policy
├── /policies/{id}/edit            → Edit Existing Policy
├── /categories                    → Category Management
├── /recipients                    → Recipient Group Management
├── /alert-configuration           → Alert Thresholds (NEW)
├── /preferences                   → User Notification Preferences
├── /history                       → Notification History / Delivery Log
├── /configuration/email           → SMTP Email Configuration
├── /configuration/templates       → Template Management
└── /testing                       → Testing & Troubleshooting Panel
```

---

## Tab Layout

Defined in `NotificationLayout.js`:

| Tab | Icon | Route Key | Component |
|---|---|---|---|
| Dashboard | `fa-light fa-chart-line` | `dashboard` | `Dashboard.js` |
| Notification Rules | `fa-light fa-shield` | `policies` | `PolicyManagement.js` |
| Categories | `fa-light fa-tags` | `categories` | *(via Preferences)* |
| Recipient Groups | `fa-light fa-users-gear` | `recipients` | `RecipientManagement.js` |
| Alert Thresholds | `fa-light fa-sliders` | `alert-configuration` | `AlertConfiguration.js` |
| History | `fa-light fa-clock-rotate-left` | `history` | `NotificationHistory.js` |
| Email Settings | `fa-light fa-envelope-open-text` | `emailConfig` | `EmailConfiguration.js` |

---

## Routing Implementation

The module uses **path-based switching** in `index.js` (not nested `<Routes>`), which is the standard pattern for FMS admin modules:

```javascript
// notifications/index.js
const renderPage = () => {
  if (currentPath.includes('/alert-configuration'))
    return <AlertConfiguration />;
  if (currentPath.includes('/policies/create'))
    return <PolicyCreate />;
  if (currentPath.includes('/policies'))
    return <PolicyManagement />;
  // ... etc
  return <Dashboard />; // default
};
```

Route constants are centralized in `utils/navigationHelper.js`:

```javascript
export const NOTIFICATION_BASE_PATH = '/admin/notification';

export const notificationRoutes = {
  dashboard: NOTIFICATION_BASE_PATH,
  policies: `${NOTIFICATION_BASE_PATH}/policies`,
  policyCreate: `${NOTIFICATION_BASE_PATH}/policies/create`,
  policyEdit: (id) => `${NOTIFICATION_BASE_PATH}/policies/${id}/edit`,
  categories: `${NOTIFICATION_BASE_PATH}/categories`,
  emailConfig: `${NOTIFICATION_BASE_PATH}/configuration/email`,
  templates: `${NOTIFICATION_BASE_PATH}/configuration/templates`,
  recipients: `${NOTIFICATION_BASE_PATH}/recipients`,
  preferences: `${NOTIFICATION_BASE_PATH}/preferences`,
  history: `${NOTIFICATION_BASE_PATH}/history`,
  testing: `${NOTIFICATION_BASE_PATH}/testing`,
  alertConfiguration: `${NOTIFICATION_BASE_PATH}/alert-configuration`
};
```

---

## Adding a New Tab

1. Add route to `notificationRoutes` in `utils/navigationHelper.js`
2. Add tab entry in `NotificationLayout.js` tabs array
3. Add case in `index.js` renderPage switch
4. Create the page component in a new subfolder

---

## Database Navigation Entry

The notification module is registered in the `navigationitems` table:

```sql
-- The parent navigation item
SELECT * FROM navigationitems WHERE path = '/admin/notification';
```

Sub-navigation is handled entirely by the frontend (tab layout), NOT by database navigation items.
