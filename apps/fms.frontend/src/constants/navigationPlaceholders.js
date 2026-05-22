/**
 * File:          navigationPlaceholders.js
 * Purpose:       Documentation-driven fallback IA for the FMS feature shell.
 * Dependencies:  None
 * Last Modified: 2026-05-22
 *
 * Key Functions:
 * - mergeNavigationPlaceholders(): Adds missing placeholder navigation items.
 */

export const NAVIGATION_PLACEHOLDER_ITEMS = [
  {
    id: "placeholder-dashboard",
    text: "Dashboard",
    path: "/home",
    icon: "fa-light fa-gauge-high",
    parentId: null,
    items: [
      {
        id: "placeholder-dashboard-overview",
        text: "Dashboard",
        path: "/home",
        parentId: "placeholder-dashboard",
        items: [],
      },
      {
        id: "placeholder-dashboard-quick-stats",
        text: "Quick Stats",
        path: "/dashboard/quick-stats",
        parentId: "placeholder-dashboard",
        items: [],
      },
      {
        id: "placeholder-dashboard-alerts",
        text: "Active Alerts",
        path: "/dashboard/active-alerts",
        parentId: "placeholder-dashboard",
        items: [],
      },
      {
        id: "placeholder-dashboard-health",
        text: "System Health",
        path: "/dashboard/system-health",
        parentId: "placeholder-dashboard",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-vehicles",
    text: "Vehicles",
    path: "/vehicles",
    icon: "fa-light fa-cars",
    parentId: null,
    items: [
      {
        id: "placeholder-vehicles-fleet",
        text: "Vehicle Fleet",
        path: "/vehicles/fleet",
        parentId: "placeholder-vehicles",
        items: [],
      },
      {
        id: "placeholder-vehicles-live",
        text: "Live Positions",
        path: "/vehicles/tracking",
        parentId: "placeholder-vehicles",
        items: [],
      },
      {
        id: "placeholder-vehicles-trips",
        text: "Trips & History",
        path: "/vehicles/trips",
        parentId: "placeholder-vehicles",
        items: [],
      },
      {
        id: "placeholder-vehicles-geofences",
        text: "Geofences",
        path: "/vehicles/geofencemanagement",
        parentId: "placeholder-vehicles",
        items: [],
      },
      {
        id: "placeholder-vehicles-providers",
        text: "Device Providers",
        path: "/admin/device-providers",
        parentId: "placeholder-vehicles",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-fueling",
    text: "Fueling",
    path: "/fuel-management",
    icon: "fa-light fa-fuel-pump",
    parentId: null,
    items: [
      {
        id: "placeholder-fueling-transactions",
        text: "Pump Transactions",
        path: "/fuel-management/pump-transactions",
        parentId: "placeholder-fueling",
        items: [],
      },
      {
        id: "placeholder-fueling-commands",
        text: "PTS Pump Commands",
        path: "/fuel-management/pts-pump-commands",
        parentId: "placeholder-fueling",
        items: [],
      },
      {
        id: "placeholder-fueling-audit",
        text: "Fuel Audit Trail",
        path: "/tankstock/fuel-audit",
        parentId: "placeholder-fueling",
        items: [],
      },
      {
        id: "placeholder-fueling-providers",
        text: "Device Providers",
        path: "/admin/device-providers",
        parentId: "placeholder-fueling",
        items: [],
      },
      {
        id: "placeholder-fueling-rules",
        text: "Fuel Rules / Setup",
        path: "/admin/fueling-rules",
        parentId: "placeholder-fueling",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-tankstock",
    text: "Tank Stock",
    path: "/tankstock",
    icon: "fa-light fa-gas-pump",
    parentId: null,
    items: [
      {
        id: "placeholder-tankstock-tanks",
        text: "Tanks",
        path: "/tanks",
        parentId: "placeholder-tankstock",
        items: [],
      },
      {
        id: "placeholder-tankstock-stock",
        text: "Opening / Closing Stock",
        path: "/tankstock/stock-management",
        parentId: "placeholder-tankstock",
        items: [],
      },
      {
        id: "placeholder-tankstock-refills",
        text: "Refills & Adjustments",
        path: "/tankstock/automatic-tank-stock",
        parentId: "placeholder-tankstock",
        items: [],
      },
      {
        id: "placeholder-tankstock-reconciliation",
        text: "Reconciliation",
        path: "/tankstock/reconciliation",
        parentId: "placeholder-tankstock",
        items: [],
      },
      {
        id: "placeholder-tankstock-history",
        text: "Tank History",
        path: "/tankstock/stock-analytics",
        parentId: "placeholder-tankstock",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-dispatch",
    text: "Dispatch & Operations",
    path: "/dispatch",
    icon: "fa-light fa-clipboard-list-check",
    parentId: null,
    items: [
      {
        id: "placeholder-dispatch-board",
        text: "Dispatch Board",
        path: "/dispatch/board",
        parentId: "placeholder-dispatch",
        items: [],
      },
      {
        id: "placeholder-dispatch-trips",
        text: "Trip Assignments",
        path: "/dispatch/trip-assignments",
        parentId: "placeholder-dispatch",
        items: [],
      },
      {
        id: "placeholder-dispatch-drivers",
        text: "Driver Management",
        path: "/employees/list",
        parentId: "placeholder-dispatch",
        items: [],
      },
      {
        id: "placeholder-dispatch-kpis",
        text: "Operational KPIs",
        path: "/dispatch/operational-kpis",
        parentId: "placeholder-dispatch",
        items: [],
      },
      {
        id: "placeholder-dispatch-history",
        text: "Task History",
        path: "/dispatch/task-history",
        parentId: "placeholder-dispatch",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-reports",
    text: "Reports & Analytics",
    path: "/reports",
    icon: "fa-light fa-chart-line",
    parentId: null,
    items: [
      {
        id: "placeholder-reports-fuel",
        text: "Fuel Consumption Reports",
        path: "/reports/consumption-refills",
        parentId: "placeholder-reports",
        items: [],
      },
      {
        id: "placeholder-reports-vehicles",
        text: "Vehicle Usage Reports",
        path: "/reports/vehicle-consumption",
        parentId: "placeholder-reports",
        items: [],
      },
      {
        id: "placeholder-reports-tanks",
        text: "Tank Stock Reports",
        path: "/reports/tank-volume-history",
        parentId: "placeholder-reports",
        items: [],
      },
      {
        id: "placeholder-reports-drivers",
        text: "Driver Performance",
        path: "/reports/driver-performance",
        parentId: "placeholder-reports",
        items: [],
      },
      {
        id: "placeholder-reports-cross-tenant",
        text: "Cross-Tenant Summary",
        path: "/reports/cross-tenant-summary",
        parentId: "placeholder-reports",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-fiscal",
    text: "Fiscal Compliance",
    path: "/fiscal-compliance",
    icon: "fa-light fa-file-certificate",
    parentId: null,
    items: [
      {
        id: "placeholder-fiscal-providers",
        text: "Fiscal Providers",
        path: "/fiscal-compliance/providers",
        parentId: "placeholder-fiscal",
        items: [],
      },
      {
        id: "placeholder-fiscal-signing",
        text: "Signing Status",
        path: "/fiscal-compliance/signing-status",
        parentId: "placeholder-fiscal",
        items: [],
      },
      {
        id: "placeholder-fiscal-reports",
        text: "KRA Compliance Reports",
        path: "/fiscal-compliance/kra-reports",
        parentId: "placeholder-fiscal",
        items: [],
      },
      {
        id: "placeholder-fiscal-receipts",
        text: "Digital Receipts / QR Codes",
        path: "/fiscal-compliance/receipts",
        parentId: "placeholder-fiscal",
        items: [],
      },
      {
        id: "placeholder-fiscal-outbox",
        text: "Outbox & Alerts",
        path: "/fiscal-compliance/outbox",
        parentId: "placeholder-fiscal",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-notifications",
    text: "Notifications & Alerts",
    path: "/event-expressions",
    icon: "fa-light fa-bell",
    parentId: null,
    items: [
      {
        id: "placeholder-notifications-alerts",
        text: "Alert Configuration",
        path: "/admin/notification/alert-configuration",
        parentId: "placeholder-notifications",
        items: [],
      },
      {
        id: "placeholder-notifications-expressions",
        text: "Event Expressions",
        path: "/event-expressions/expressions",
        parentId: "placeholder-notifications",
        items: [],
      },
      {
        id: "placeholder-notifications-active",
        text: "Active Events Dashboard",
        path: "/event-expressions/active-events",
        parentId: "placeholder-notifications",
        items: [],
      },
      {
        id: "placeholder-notifications-history",
        text: "Notification History",
        path: "/admin/notification/history",
        parentId: "placeholder-notifications",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-admin",
    text: "Administration",
    path: "/admin",
    icon: "fa-light fa-gear",
    parentId: null,
    items: [
      {
        id: "placeholder-admin-users",
        text: "Users & Roles",
        path: "/admin/users",
        parentId: "placeholder-admin",
        items: [],
      },
      {
        id: "placeholder-admin-permissions",
        text: "Permissions",
        path: "/admin/permissions",
        parentId: "placeholder-admin",
        items: [],
      },
      {
        id: "placeholder-admin-audit",
        text: "Audit Log",
        path: "/admin/logs",
        parentId: "placeholder-admin",
        items: [],
      },
      {
        id: "placeholder-admin-config",
        text: "System Configuration",
        path: "/admin/systemconfig",
        parentId: "placeholder-admin",
        items: [],
      },
      {
        id: "placeholder-admin-sites",
        text: "Sites / Locations",
        path: "/admin/sites",
        parentId: "placeholder-admin",
        items: [],
      },
    ],
  },
  {
    id: "placeholder-profile",
    text: "System & Profile",
    path: "/profile",
    icon: "fa-light fa-circle-user",
    parentId: null,
    items: [
      {
        id: "placeholder-profile-main",
        text: "My Profile",
        path: "/profile",
        parentId: "placeholder-profile",
        items: [],
      },
      {
        id: "placeholder-profile-account",
        text: "Account Settings",
        path: "/profile/account-settings",
        parentId: "placeholder-profile",
        items: [],
      },
      {
        id: "placeholder-profile-notifications",
        text: "Notification Preferences",
        path: "/my-notifications/preferences",
        parentId: "placeholder-profile",
        items: [],
      },
      {
        id: "placeholder-profile-help",
        text: "Help & Documentation",
        path: "/help",
        parentId: "placeholder-profile",
        items: [],
      },
    ],
  },
];

const cloneItem = (item) => ({
  ...item,
  items: Array.isArray(item.items) ? item.items.map(cloneItem) : [],
  children: Array.isArray(item.children) ? item.children.map(cloneItem) : undefined,
});

const getChildren = (item) => item.items || item.children || [];

const setChildren = (item, children) => {
  if (Array.isArray(item.children) && !Array.isArray(item.items)) {
    return { ...item, children };
  }

  return { ...item, items: children };
};

const findByPath = (items, path) =>
  items.find((item) => item.path?.toLowerCase() === path.toLowerCase());

const mergeChildrenByPath = (currentChildren, placeholderChildren) => {
  const nextChildren = currentChildren.map(cloneItem);

  placeholderChildren.forEach((placeholderChild) => {
    const existingChild = findByPath(nextChildren, placeholderChild.path);

    if (!existingChild) {
      nextChildren.push(cloneItem(placeholderChild));
      return;
    }

    const existingIndex = nextChildren.indexOf(existingChild);
    const mergedGrandchildren = mergeChildrenByPath(
      getChildren(existingChild),
      getChildren(placeholderChild)
    );
    nextChildren[existingIndex] = setChildren(existingChild, mergedGrandchildren);
  });

  return nextChildren;
};

export const mergeNavigationPlaceholders = (navigationItems) => {
  const nextItems = Array.isArray(navigationItems)
    ? navigationItems.map(cloneItem)
    : [];

  NAVIGATION_PLACEHOLDER_ITEMS.forEach((placeholderItem) => {
    const existingItem = findByPath(nextItems, placeholderItem.path);

    if (!existingItem) {
      nextItems.push(cloneItem(placeholderItem));
      return;
    }

    const existingIndex = nextItems.indexOf(existingItem);
    const mergedChildren = mergeChildrenByPath(
      getChildren(existingItem),
      getChildren(placeholderItem)
    );

    nextItems[existingIndex] = {
      ...existingItem,
      text: existingItem.text || placeholderItem.text,
      icon: existingItem.icon || placeholderItem.icon,
      items: Array.isArray(existingItem.items) ? mergedChildren : existingItem.items,
      children: Array.isArray(existingItem.children) ? mergedChildren : existingItem.children,
    };
  });

  return nextItems;
};
