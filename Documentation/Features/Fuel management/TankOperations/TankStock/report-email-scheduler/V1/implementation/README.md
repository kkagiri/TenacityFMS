# Tank Stock Report Email Scheduler - Implementation Update (V1)

## Scope
This update implements the requested scheduler enhancements for tank volume history report emails:

1. Day selector now supports **multiple days**.
2. Dialog layout is reordered into three groups:
   - Group 1: **Report Name** and **Description**
   - Group 2: **Period & Timing**
   - Group 3: **Parameters** (Sites, Tanks, Recipients)
3. Schedule time remains **time-only** (no date input).
4. Report name prefix remains enforced via `TankVolumeHistory - `.
5. Backend recurring schedule now supports `daysOfWeek` arrays in addition to legacy `dayOfWeek`.

## Frontend Changes

### Reusable Scheduler Component
- `fms.frontend/src/components/Reporting/ReportScheduler/ScheduleReportEmailDialog.js`
  - Converted day selector to multi-select `TagBox`.
  - Added normalized day array handling and fallback to Monday.
  - Reordered UI into requested group sections.
  - Next-run preview now uses selected day list.

### Scheduler Utilities
- `fms.frontend/src/components/Reporting/ReportScheduler/reportEmailScheduleUtils.js`
  - Normalizes selected day IDs in default config.
  - Supports next-run computation for multiple days (weekly and monthly patterns).
  - Summary HTML now prints all selected days.

### Transaction Hub Integration
- `fms.frontend/src/pages/tankStock/management/components/TransactionHub.js`
  - Preserves and initializes `scheduleDayOfWeekIds`.
  - Sends multi-day schedule in payload:
    - `recurringSchedule.daysOfWeek` (new)
    - `recurringSchedule.dayOfWeek` (legacy fallback)
  - Scheduler payload version incremented to `schedulerVersion: 3`.

## Backend Changes

### Notification Recurrence Engine
- `FMS.Application/Features/Notification/Services/NotificationService.cs`
  - Recurring parser now accepts:
    - `recurringSchedule.daysOfWeek` (array)
    - `recurringSchedule.dayOfWeek` (legacy single value)
  - Added support for numeric day values (`0`-`6`) and string day names.
  - Next-run computation now resolves the earliest candidate across selected days for:
    - Weekly schedules
    - Monthly week-of-month schedules

## Compatibility
- Existing schedules using only `dayOfWeek` continue to work.
- New schedules can include both `daysOfWeek` and `dayOfWeek` for backward compatibility.

## Known Remaining Gaps (Not in this change)
- Dedicated scheduler tracking tables for schedule history/audit.
- A separate background service dedicated to report generation lifecycle.
- Expanded data-parameter persistence model beyond notification payload JSON.

## Verification Checklist
1. Open Transaction Hub and schedule report email.
2. Confirm day selector allows selecting multiple days.
3. Confirm layout order matches requested grouping.
4. Confirm API payload contains `recurringSchedule.daysOfWeek`.
5. Confirm next-run date reflects earliest valid selected day.
6. Confirm old schedule records using single `dayOfWeek` still process.
