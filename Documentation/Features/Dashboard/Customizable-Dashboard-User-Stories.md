# Customizable Dashboard Ticker System - User Stories

## � Implementation Status (as of 2025-08-22)

Active work on Stories 1.1, 1.2 (initial scaffold), and 5.1. Others remain Not Started.

### Progress Summary

| Epic | Story | Title | Status | Owner | Notes |
|------|-------|-------|--------|-------|-------|
| 1 | 1.1 | Enable/Disable Tickers | In Progress | BE/FE | Backend done; frontend enable/disable scaffold + auto-save added |
| 1 | 1.2 | Reorder Tickers | In Progress | FE | Drag & drop scaffold (ordering chips + DnD) added; refining UX |
| 1 | 1.3 | Reset to Defaults | Not Started | | Deferred (Won't Have phase) |
| 2 | 2.1 | Configure Site Filters | In Progress | FE | Multi-select UI scaffold + persistence (siteFilters) added; awaiting data binding to tickers & auth trimming |
| 2 | 2.2 | Configure Tank-Specific Filters | Not Started | | |
| 2 | 2.3 | Configure Vehicle Filters | Not Started | | |
| 2 | 2.4 | Configure Alert Thresholds | Not Started | | |
| 3 | 3.1 | Choose Display Density | Not Started | | |
| 3 | 3.2 | Configure Refresh Intervals | Not Started | | |
| 3 | 3.3 | Toggle Data Elements | Not Started | | Deferred (Won't Have phase) |
| 4 | 4.1 | Select Predefined Time Ranges | Not Started | | |
| 4 | 4.2 | Custom Date Range Selection | Not Started | | |
| 5 | 5.1 | Admin Role Configuration | In Progress | BE/FE | Backend filtering + frontend consumption of filtered templates |
| 5 | 5.2 | User Role Restrictions | Not Started | | |
| 5 | 5.3 | Management Role Features | Not Started | | |
| 6 | 6.1 | Efficient Data Loading | Not Started | | To address after core CRUD |
| 6 | 6.2 | Reliable Configuration Saving | Not Started | | |
| 7 | 7.1 | Mobile Ticker Display | Not Started | | Deferred (Won't Have phase) |
| 7 | 7.2 | Mobile Configuration Interface | Not Started | | Deferred (Won't Have phase) |

Legend: Not Started | In Progress | Blocked | Done | Deferred

Backend & Frontend Progress Notes (2025-08-22):

- Added entities: `UserDashboardPreference`, `DashboardTickerTemplate`
- Added EF configurations & DbSets
- Added CQRS: GetUserDashboardPreferences, GetDashboardTickerTemplates, SaveUserDashboardPreferences
- Added AutoMapper profile
- Added secured `DashboardController` endpoints (preferences + ticker-configs)
- Seeded initial ticker templates (tank_levels, consumption_summary, vehicle_status, admin_alerts, system_health)
- Implemented role hierarchy & multi-role filtering in backend query
- Frontend: added dashboardPreferences reducer, actions, hook, context provider, configuration UI, drag & drop ordering draft, auto-save with toast notifications
- Next: generate EF migration, add unit tests (handlers + reducer), flesh out ticker renderer components with real data, add loading skeletons, finalize Story 1.1 acceptance criteria

> Update this table each sprint. When a story begins, change Status to In Progress and add Owner initials. Upon completion, link PRs in Notes.

## �📋 Overview

This document contains detailed user stories for the Customizable Dashboard Ticker System, organized by epic and priority. Each story includes acceptance criteria, business value, and technical considerations.

## 🎯 Epic 1: Ticker Management

### Story 1.1: Enable/Disable Tickers

**As a** user
**I want to** enable and disable dashboard tickers
**So that** I only see information relevant to my role and responsibilities

**Acceptance Criteria:**

- [x] I can see a list of all available tickers for my role (checkbox list rendered from filtered templates)
- [x] I can toggle tickers on/off with a clear visual indicator (checkbox state + immediate UI update)
- [x] Changes are saved automatically (debounced auto-save with toast confirmation)
- [x] Disabled tickers are hidden from my dashboard immediately (container filters out disabled types)
- [x] I cannot enable tickers I don't have permission to view (backend filters templates by role/permissions)

**Progress Notes:**
- Backend entities, CQRS, controller endpoints complete.
- Frontend reducer / context / hook implemented; auto-save & toast notifications integrated.
- Remaining polish: loading skeletons, error banner styling, final accessibility pass, test coverage, confirmation of unauthorized enable attempt scenario (guard already implicit by absence in list).


**Business Value:** High - Reduces information overload and improves focus

**Story Points:** 5

**Technical Notes:**

- Requires role-based filtering of available tickers
- Need real-time UI updates when toggling
- Implement permission validation on backend


---

### Story 1.2: Reorder Tickers

**As a** user
**I want to** reorder my dashboard tickers
**So that** my most important information appears first

**Acceptance Criteria:**

- [x] I can drag and drop tickers to reorder them (drag handles applied to chips; basic DnD working)
- [x] Visual feedback shows valid drop zones during dragging (ring highlight on drag)
- [x] New order is saved automatically (order dispatch triggers debounced save)
- [ ] Reordering works on both desktop and tablet (tablet/touch testing pending)
- [x] Order persists across browser sessions (persisted via backend preferences)

**Progress Notes:**
- Minimal drag & drop implementation using `react-beautiful-dnd`.
- Needs: touch gesture validation, ARIA drag & drop accessibility improvements, performance test with many tickers, unit tests for reducer order handling.


**Business Value:** Medium - Improves workflow efficiency

**Story Points:** 8

**Technical Notes:**

- Implement drag-and-drop library (react-beautiful-dnd)
- Handle responsive design for different screen sizes
- Debounce save operations during reordering


---

### Story 1.3: Reset to Defaults

**As a** user
**I want to** reset my ticker configuration to role defaults
**So that** I can start over if my customizations become problematic

**Acceptance Criteria:**

- [ ] I can access a "Reset to Defaults" option in settings
- [ ] System asks for confirmation before resetting
- [ ] All tickers return to default enabled state for my role
- [ ] Default order and filters are restored
- [ ] I receive confirmation that reset was successful


**Business Value:** Low - Safety net for user errors

**Story Points:** 3

**Technical Notes:**

- Store role-based default configurations
- Implement confirmation dialog
- Clear user preferences and reload defaults


---

## 🎯 Epic 2: Filter Configuration

### Story 2.1: Configure Site Filters

**As a** site operator
**I want to** filter tickers to show only data from my assigned sites
**So that** I focus on locations I'm responsible for

**Acceptance Criteria:**

- [x] I can select one or multiple sites from a dropdown (prototype checkbox multi-select in Configuration panel)
- [ ] Only sites I have access to are available for selection (legacy fallback implemented; auth trimming pending)
- [ ] Ticker data updates immediately when filters change (data layer not yet wired)
- [x] Filter selections are saved with my preferences (saved in JSON: siteFilters)
- [ ] Clear indication when filters are applied (basic count shown; need global badge/state indicator)

**Progress Notes:**
- Added `siteFilters` array to preferences schema (backend persisted via existing SavePreferences endpoint).
- Added `SET_SITE_FILTERS` action, reducer logic, hook support, and auto-save integration.
- Configuration panel now loads authorized sites from `/api/site/me` with legacy fallback; displays multi-select.
- Pending: enforce authorized site intersection on backend queries; apply filter to each ticker's data provider; add visual badge and empty-state messaging.


**Business Value:** High - Critical for multi-site operations

**Story Points:** 5

**Technical Notes:**

- Implement cascading dropdowns for site selection
- Validate site access permissions
- Real-time data filtering on frontend


---

### Story 2.2: Configure Tank-Specific Filters

**As a** site operator
**I want to** filter tank-related tickers to specific tanks
**So that** I can monitor only the tanks I'm responsible for

**Acceptance Criteria:**

- [ ] I can select specific tanks after choosing sites
- [ ] Tank list updates based on selected sites
- [ ] I can select all tanks or individual tanks
- [ ] Filter applies to all tank-related tickers
- [ ] Clear visual indication of active filters


**Business Value:** Medium - Useful for large sites with many tanks

**Story Points:** 5

**Technical Notes:**

- Dependent filtering (site → tank relationship)
- Handle dynamic option loading
- Apply filters across multiple ticker types


---

### Story 2.3: Configure Vehicle Filters

**As a** fleet manager
**I want to** filter vehicle-related tickers by vehicle type and assignment
**So that** I can focus on vehicles under my management

**Acceptance Criteria:**

- [ ] I can filter by vehicle type (truck, van, car, etc.)
- [ ] I can filter by vehicle status (active, maintenance, etc.)
- [ ] Multiple filter types can be combined
- [ ] Filter combinations are saved with preferences


**Business Value:** High - Essential for fleet management roles

**Story Points:** 8

**Technical Notes:**

- Multiple filter types with AND/OR logic
- Complex filter state management
- Performance considerations for large vehicle fleets


---

### Story 2.4: Configure Alert Thresholds

**As a** user
**I want to** set custom alert thresholds for tank levels
**So that** I receive warnings at levels appropriate for my operation

**Acceptance Criteria:**

- [ ] I can set low fuel threshold as a percentage
- [ ] I can set critical fuel threshold as a percentage
- [ ] Visual indicators change based on my thresholds
- [ ] Thresholds apply to all relevant tickers
- [ ] Default thresholds are provided for new users


**Business Value:** Medium - Customizable alerting improves response time

**Story Points:** 5

**Technical Notes:**

- Slider or input components for threshold setting
- Real-time threshold validation
- Apply thresholds across ticker components


---

## 🎯 Epic 3: Display Customization

### Story 3.1: Choose Display Density

**As a** user
**I want to** switch between compact and detailed views
**So that** I can optimize screen space based on my needs

**Acceptance Criteria:**

- [ ] I can toggle between compact and detailed view per ticker
- [ ] Compact view shows essential information only
- [ ] Detailed view shows all available data points
- [ ] View preference is saved for each ticker type
- [ ] Responsive design works in both modes


**Business Value:** Medium - Flexibility for different user preferences

**Story Points:** 5

**Technical Notes:**

- Create compact and detailed component variants
- Conditional rendering based on user preference
- Maintain responsive design in both modes


---

### Story 3.2: Configure Refresh Intervals

**As a** user
**I want to** set refresh intervals for each ticker
**So that** I can balance data freshness with system performance

**Acceptance Criteria:**

- [ ] I can choose from predefined refresh intervals (15s, 30s, 1min, 5min)
- [ ] Critical tickers (alerts) have faster minimum refresh rates
- [ ] Visual indicator shows when ticker was last updated
- [ ] I can manually refresh any ticker
- [ ] Refresh intervals are saved per ticker type


**Business Value:** Medium - Performance optimization and data freshness

**Story Points:** 5

**Technical Notes:**

- Implement configurable timer system
- Handle multiple refresh intervals simultaneously
- Show last update timestamps


---

### Story 3.3: Toggle Data Elements

**As a** user
**I want to** show/hide specific data elements within tickers
**So that** I can focus on the metrics most important to me

**Acceptance Criteria:**

- [ ] I can toggle visibility of percentages in tank tickers
- [ ] I can show/hide trend indicators
- [ ] I can display/hide secondary metrics
- [ ] Changes apply immediately without page refresh
- [ ] Element visibility preferences are saved


**Business Value:** Low - Nice-to-have for power users

**Story Points:** 3

**Technical Notes:**

- Granular component visibility controls
- Conditional rendering of data elements
- Save detailed display preferences


---

## 🎯 Epic 4: Time Range Configuration

### Story 4.1: Select Predefined Time Ranges

**As a** manager
**I want to** choose from common time ranges (today, yesterday, last week)
**So that** I can quickly view data for standard reporting periods

**Acceptance Criteria:**
- [ ] I can select from: Today, Yesterday, Last 7 days, Last 30 days, This Week, Last Week, This Month, Last Month
- [ ] Selection applies to all time-based tickers
- [ ] Data updates immediately when time range changes
- [ ] Default time range is set based on role
- [ ] Time range selection is persistent

**Business Value:** High - Standard reporting requirements

**Story Points:** 5

**Technical Notes:**
- Standardized time range calculation
- Handle timezone considerations
- Efficient date range queries

---

### Story 4.2: Custom Date Range Selection

**As a** analyst
**I want to** select custom date ranges
**So that** I can analyze data for specific periods relevant to my analysis

**Acceptance Criteria:**
- [ ] I can select custom start and end dates
- [ ] Date picker prevents invalid date ranges
- [ ] Maximum range is limited based on performance
- [ ] Custom ranges are saved for quick reuse
- [ ] Clear indication when custom range is active

**Business Value:** Medium - Advanced analysis capabilities

**Story Points:** 8

**Technical Notes:**
- Implement date range picker component
- Validate date range limits
- Cache custom ranges for performance

---

## 🎯 Epic 5: Role-Based Configuration

### Story 5.1: Admin Role Configuration

**As an** administrator
**I want to** access all available tickers including system health metrics
**So that** I can monitor the entire system comprehensively

**Acceptance Criteria:**
- [ ] I can see all ticker types including admin-only tickers
- [ ] I have access to system health and performance metrics
- [ ] I can view cross-site data without restrictions
- [ ] I can configure team default settings
- [ ] I have access to user configuration audit logs

**Business Value:** High - Critical for system administration

**Story Points:** 8

**Technical Notes:**
- Implement comprehensive permission checking
- Admin-specific ticker types
- Audit trail functionality

---

### Story 5.2: User Role Restrictions

**As a** regular user
**I want to** see only tickers relevant to my permissions
**So that** I'm not confused by data I cannot access or act upon

**Acceptance Criteria:**
- [ ] I only see tickers for data I have permission to view
- [ ] Site and vehicle filters are limited to my assignments
- [ ] System admin tickers are hidden from my view
- [ ] Error messages clearly explain permission restrictions
- [ ] Role-appropriate defaults are applied

**Business Value:** High - Security and user experience

**Story Points:** 5

**Technical Notes:**
- Role-based UI rendering
- Permission validation on all data sources
- Clear error handling for unauthorized access

---

### Story 5.3: Management Role Features

**As a** manager
**I want to** access strategic metrics and cross-team data
**So that** I can make informed decisions about operations

**Acceptance Criteria:**
- [ ] I can view aggregated data across sites/teams under my management
- [ ] I have access to trend analysis and KPI tickers
- [ ] I can see performance comparison metrics
- [ ] I can configure tickers for operational vs strategic views
- [ ] I can access team performance dashboards

**Business Value:** High - Management decision support

**Story Points:** 8

**Technical Notes:**
- Aggregated data views
- KPI calculation and presentation
- Performance comparison logic

---

## 🎯 Epic 6: Performance & Reliability

### Story 6.1: Efficient Data Loading

**As a** user
**I want** tickers to load quickly
**So that** I can access information without delays

**Acceptance Criteria:**
- [ ] Initial dashboard loads in under 2 seconds
- [ ] Individual ticker updates complete in under 500ms
- [ ] Loading states are clearly indicated
- [ ] Failed requests are retried automatically
- [ ] Offline state is handled gracefully

**Business Value:** High - User experience requirement

**Story Points:** 8

**Technical Notes:**
- Implement data caching strategies
- Optimize API calls and responses
- Progressive loading of ticker data

---

### Story 6.2: Reliable Configuration Saving

**As a** user
**I want** my configuration changes to be saved reliably
**So that** I don't lose my customizations

**Acceptance Criteria:**
- [ ] Configuration saves succeed 99.9% of the time
- [ ] Failed saves are retried automatically
- [ ] User is notified of save failures
- [ ] Partial configuration recovery is possible
- [ ] Configuration backup is available

**Business Value:** High - Data integrity requirement

**Story Points:** 5

**Technical Notes:**
- Implement retry logic for failed saves
- Local storage backup of configurations
- Conflict resolution for concurrent edits

---

## 🎯 Epic 7: Mobile Responsiveness

### Story 7.1: Mobile Ticker Display

**As a** mobile user
**I want** tickers to display properly on mobile devices
**So that** I can access dashboard information while mobile

**Acceptance Criteria:**
- [ ] Tickers stack vertically on mobile screens
- [ ] Text and controls are appropriately sized for touch
- [ ] Scrolling performance is smooth
- [ ] Most important tickers are visible without scrolling
- [ ] Configuration can be accessed on mobile

**Business Value:** Medium - Mobile access requirement

**Story Points:** 8

**Technical Notes:**
- Responsive design implementation
- Touch-friendly UI elements
- Performance optimization for mobile devices

---

### Story 7.2: Mobile Configuration Interface

**As a** mobile user
**I want to** configure tickers using touch-friendly controls
**So that** I can customize my dashboard while mobile

**Acceptance Criteria:**
- [ ] Configuration modal is optimized for mobile
- [ ] Touch targets are appropriately sized
- [ ] Drag and drop works with touch gestures
- [ ] Form inputs are mobile-friendly
- [ ] Configuration saves work reliably on mobile

**Business Value:** Low - Advanced mobile functionality

**Story Points:** 8

**Technical Notes:**
- Touch gesture handling
- Mobile-optimized form controls
- Responsive modal design

---

## 📊 Story Prioritization

### Must Have (MVP)
1. Enable/Disable Tickers (1.1)
2. Configure Site Filters (2.1)
3. Admin Role Configuration (5.1)
4. User Role Restrictions (5.2)
5. Efficient Data Loading (6.1)

### Should Have (Phase 2)
1. Reorder Tickers (1.2)
2. Configure Tank-Specific Filters (2.2)
3. Configure Vehicle Filters (2.3)
4. Select Predefined Time Ranges (4.1)
5. Management Role Features (5.3)

### Could Have (Phase 3)
1. Configure Alert Thresholds (2.4)
2. Choose Display Density (3.1)
3. Configure Refresh Intervals (3.2)
4. Custom Date Range Selection (4.2)
5. Reliable Configuration Saving (6.2)

### Won't Have (Future)
1. Reset to Defaults (1.3)
2. Toggle Data Elements (3.3)
3. Mobile Ticker Display (7.1)
4. Mobile Configuration Interface (7.2)

## 📋 Definition of Done

For each user story to be considered complete:

- [ ] **Functionality**: All acceptance criteria are met
- [ ] **Testing**: Unit tests cover core functionality
- [ ] **Integration**: API integration works correctly
- [ ] **UI/UX**: Design review approved
- [ ] **Performance**: Meets performance requirements
- [ ] **Security**: Security review passed
- [ ] **Documentation**: Technical documentation updated
- [ ] **Accessibility**: WCAG 2.1 AA compliance verified
- [ ] **Browser Testing**: Works in all supported browsers
- [ ] **User Testing**: User acceptance criteria validated

## 🔗 Related Documents

- [Product Requirements Document](./Customizable-Dashboard-PRD.md)
- [Technical Architecture](./Customizable-Dashboard-Ticker-System.md)
- [API Specifications](../API/Dashboard-Preferences-API.md)
- [UI/UX Guidelines](../UI/Dashboard-Customization-Guidelines.md)

## 🚀 Immediate Next Steps (Focused Execution Queue)

Ordered for the next 2 sprints to convert current In Progress stories to Done and unblock subsequent epics.

### Sprint N (Hardening Core + Site Filters)
2. Backend: Implement server-side site authorization intersection on vehicle & tank endpoints (siteIds limited to user scope)
3. Backend: Move site filtering from in-memory to query-level (include siteIds in repository queries)
4. Backend: Adjust vehicle cache key strategy to incorporate site filter hash
5. Frontend: Wire `siteFilters` into each ticker data request (append query params / request body)
6. Frontend: Add visual site filter indicator badge + clear filter action
7. Testing: Unit tests for preference reducer (enable/disable, reorder, siteFilters)
8. Testing: Integration tests for Get/Save preferences round-trip (handler tests)
9. Accessibility: Add ARIA roles & keyboard focus order to configuration modal + DnD fallbacks
10. Documentation: Update Implementation Guide with migration reference & caching note

### Sprint N+1 (Complete Reordering & Begin Tank Filters)
1. Frontend: Touch support verification & enhancements for drag & drop (Story 1.2 remaining AC)
2. Frontend: Introduce tank filter UI scaffold (cascading selection from selected sites)
3. Backend: Add tankIds filtering param & authorization intersection
4. Frontend: Add optimistic update + error rollback for reorder saves
5. Testing: Add reducer tests for reorder logic (edge cases: duplicate IDs, missing ticker on reorder)
6. Performance: Add lightweight timing instrumentation around preference load/save
7. Documentation: Start CHANGELOG.md (see template below)

## ⚠️ Risk & Mitigation Backlog

| Risk | Impact | Current Status | Mitigation Action | Owner |
|------|--------|----------------|-------------------|-------|
| In-memory filtering cost (vehicles/tanks) | Perf degradation under load | Present | Shift to DB query predicates | BE |
| Missing auth trimming for siteIds | Data exposure risk | Present | Enforce site intersection in query layer | BE |
| No cache key variance for site filters | Stale / incorrect data served | Present | Add composite key (user + site hash) | BE |
| Lacking reducer & handler tests | Regression risk | Present | Write focused unit tests (stories 1.1, 2.1) | QA/BE |
| Drag & drop touch accessibility | Mobile usability gap | Pending | Implement touch test matrix + fallback reorder buttons | FE |
| No migration applied yet | Prod deployment blocker | Unknown | Generate & commit migration script | BE |

## 🧩 Technical Debt Register

| Area | Description | Priority | Planned Resolution |
|------|-------------|----------|--------------------|
| Controllers | Analyzer warnings (braces, explicit types) in Tank/Vehicle modifications | Medium | Style cleanup after filter query refactor |
| Preferences JSON | Lacks schema version bump after adding siteFilters | Low | Add `schemaVersion` on next persistence change |
| Caching | Vehicle list cache unaware of filters | High | Introduce layered cache key & TTL tuning |
| Error Handling | Configuration modal lacks centralized error banner | Medium | Add error boundary + toast escalation |
| Accessibility | DnD lacks keyboard reordering | High | Provide up/down buttons & aria-live announcements |
| Logging | Sparse logs around save failures | Medium | Add structured log events (PreferenceSaveAttempt/Result) |

## 🧪 Test Coverage Roadmap

| Layer | Test Focus | Framework | Status |
|-------|------------|-----------|--------|
| Reducer | enable/disable, reorder, siteFilters merge | Jest | Planned |
| Hook | useDashboardPreferences side effects (debounce) | Jest + react-testing-library | Planned |
| Handlers | Get/Save preferences happy & malformed JSON cases | xUnit | Planned |
| Controller | Role-based template filtering matrix | xUnit | Planned |
| Integration | Round-trip preference persistence | xUnit + TestServer | Planned |
| Performance | Load time of preference fetch (<150ms local) | Benchmark harness | Backlog |

## 🗓️ Proposed CHANGELOG Template (to create `CHANGELOG.md`)

```markdown
# Changelog

All notable changes to the Customizable Dashboard will be documented here.

## [Unreleased]
### Added
- Dashboard preference entities, CQRS handlers, and secured endpoints
- Role-based ticker template filtering (hierarchical & multi-role)
- Frontend preference state (enable/disable, ordering scaffold, auto-save)
- Site filter UI & persistence (siteFilters) with multi-select component

### Changed
- Refactored SiteController routes to REST naming (legacy aliases retained)

### Pending
- DB-level filtering for sites
- Touch accessibility for drag & drop
- Caching strategy update for filtered vehicle data

### Fixed
- N/A (initial phase)

## [0.1.0] - YYYY-MM-DD
Initial internal preview.
```

> Action: Create `CHANGELOG.md` once first migration is merged; update per PR.

## ✅ Completion Triggers

Add these acceptance gates before promoting stories 1.1, 1.2, 2.1 to Done:
- All listed unit tests implemented & green
- Site filter applied to at least one ticker data feed end-to-end
- Analyzer warnings resolved in modified controllers
- EF migration merged & applied in integration environment
- Accessibility audit pass (keyboard + screen reader) for configuration modal & DnD

---

This extension section keeps momentum focused on converting partial implementations into production-ready deliverables while minimizing risk accumulation.
