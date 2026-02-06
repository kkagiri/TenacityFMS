/**
 * File: index.js
 * Purpose: Export all Issue Tracker components
 * Last Modified: 2026-02-05
 */

// Dashboard Components
export { default as CombinedIssueDashboard } from './CombinedIssueDashboard';
export { default as UserIssuesDashboard } from './UserIssuesDashboard';
export { default as IssueDashboardStats } from './IssueDashboardStats';
export { default as IssueTrackerDashboard } from './IssueTrackerDashboard';

// Form & Popup Components
export { default as GPSTriggeredIssueForm } from './GPSTriggeredIssueForm';
export { default as QuickCreateIssuePopup } from './QuickCreateIssuePopup';

// UI Components
export { default as IssueCard } from './IssueCard';
export { default as IssueFilters } from './IssueFilters';
export { default as IssuePriorityBadge } from './IssuePriorityBadge';
export { default as IssueStatusIndicator } from './IssueStatusIndicator';

// Dropdown Components
export { default as DeviceTypeDropdown } from './DeviceTypeDropdown';
export { default as IssueTemplateDropdown } from './IssueTemplateDropdown';

// Shared Components
export * from './shared';
