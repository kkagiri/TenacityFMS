import os

dst = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'dark-theme.scss')

content = '''/**
 * File: dark-theme.scss
 * Purpose: Dark-mode overrides for FMS. Activated via [data-theme="dark"] on <html>.
 * Dependencies: None - loaded globally.
 * Last Modified: 2026-03-04
 *
 * Approach:
 * - CSS custom properties on :root for light (defaults)
 * - Overrides under [data-theme="dark"] split into modular partials in ./dark/
 * - Targets DevExtreme, header, sidebar, cards, popups, grids, selectors
 *
 * Partials:
 * - _dark-variables: CSS custom properties + body/root background
 * - _dark-header-sidebar: Header toolbar, sidebar/drawer navigation
 * - _dark-global-widgets: DataGrid, cards, toolbar, buttons
 * - _dark-selectbox-inputs: SelectBox, popover, textbox, textarea
 * - _dark-datebox-calendar: DateBox, calendar popup
 * - _dark-form-controls: NumberBox, tabs, scrollbar, checkbox, radio, form, tooltips, context menu
 * - _dark-page-layouts: Page-level background overrides (issue tracker, reports, maintenance, etc.)
 * - _dark-issue-tracker: Issue tracker dashboard, detail, list, forms
 * - _dark-settings-system: Navigation management, settings, geofence, system config, update campaign
 * - _dark-login-fuel-fleet: Login page, fuel refill, fleet overview
 * - _dark-m365-components: M365 footers, panels, popup bodies, form actions, buttons
 * - _dark-tabs: All module-specific tab panel overrides
 * - _dark-popups: All popup/modal/dialog overrides
 * - _dark-dashboards: All dashboard overrides (realtime, reports, monitor, device, PTS, etc.)
 * - _dark-m365-pages: M365 design tokens, import management, form common, user details
 * - _dark-vehicle: Vehicle layout, edit form, consumption report
 * - _dark-tankstock: Tank stock layout, stock management, transaction hub
 * - _dark-tankstock-modules: Quick actions, fuel data, reconciliation, variance, fuel audit, pivot, pump, site, emergency
 * - _dark-notifications: Notification pages
 * - _dark-other-pages: Event expressions, issue tracker non-dashboard, maintenance, site, reports engine
 * - _dark-components: Tags, PTS device, user panel, filter, pump transaction, live status, mobile nav, m365 shared
 * - _dark-page-overrides: CSS var overrides, log management, change password, vehicle search, mobile nav, slide panel
 * - _dark-scrollable-sections: Scrollable/complex section overrides
 * - _dark-layout-shells: Config controls, catch-all, layout shells, drawer, notification center, M365 side panel
 */

/* ================================================================
   LIGHT-MODE DEFAULTS (custom props used throughout the app)
   ================================================================ */
:root {
  --fms-text-primary: #201f1e;
  --fms-text-secondary: #605e5c;
  --fms-text-tertiary: #a19f9d;
  --fms-surface: #ffffff;
  --fms-surface-secondary: #faf9f8;
  --fms-border: #e0e0e0;
  --fms-border-light: #edebe9;
  --fms-hover-bg: #f3f2f1;
  --fms-active-bg: #e8f4fd;
  --fms-page-bg: #faf9f8;
  --fms-card-bg: #ffffff;
  --fms-header-bg: #ffffff;
  --fms-sidebar-bg: #ffffff;
  --fms-shadow-color: rgba(0, 0, 0, 0.08);
  --fms-input-bg: #ffffff;
  --fms-input-border: #c8c6c4;
  --fms-dot-color: #333333;
}

/* ================================================================
   DARK-MODE OVERRIDES (modular partials)
   ================================================================ */
@import "dark/dark-variables";
@import "dark/dark-header-sidebar";
@import "dark/dark-global-widgets";
@import "dark/dark-selectbox-inputs";
@import "dark/dark-datebox-calendar";
@import "dark/dark-form-controls";
@import "dark/dark-page-layouts";
@import "dark/dark-issue-tracker";
@import "dark/dark-settings-system";
@import "dark/dark-login-fuel-fleet";
@import "dark/dark-m365-components";
@import "dark/dark-tabs";
@import "dark/dark-popups";
@import "dark/dark-dashboards";
@import "dark/dark-m365-pages";
@import "dark/dark-vehicle";
@import "dark/dark-tankstock";
@import "dark/dark-tankstock-modules";
@import "dark/dark-notifications";
@import "dark/dark-other-pages";
@import "dark/dark-components";
@import "dark/dark-page-overrides";
@import "dark/dark-scrollable-sections";
@import "dark/dark-layout-shells";
'''

with open(dst, 'w', encoding='utf-8') as f:
    f.write(content)

print(f'dark-theme.scss written ({len(content.splitlines())} lines)')
