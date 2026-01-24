# Fuel Dispense Today Widget Implementation

## Overview

Added "Fuel Dispense Today" and related fuel management widget templates to the dashboard system.

## Changes Made

### 1. Backend - Widget Template Seeder

**File**: `FMS.Application/Features/Dashboard/Services/WidgetTemplateSeeder.cs`

**Changes**:
1. Modified the seeding logic to support incremental seeding (upsert) - new templates are added without deleting existing ones
2. Added 3 new fuel management templates:

| Template Name | Widget Type | Description |
|---------------|-------------|-------------|
| `fuel_dispense_today` | BIG_STAT_CARD | Shows total fuel dispensed today with trend indicator |
| `fuel_dispense_trend_chart` | CHART_LINE_TREND | Line chart showing fuel dispensed trend over time |
| `fuel_dispense_by_site` | CHART_BAR_COMPARISON | Bar chart comparing fuel dispensed across sites |

### 2. Database Migration Script

**File**: `Documentation/Features/Dashboard/database/fuel_dispense_templates_migration.sql`

Created a SQL script to add the templates to existing deployments using `ON DUPLICATE KEY UPDATE` for safe re-running.

## Template Configurations

### Fuel Dispense Today (BIG_STAT_CARD)
```json
{
  "defaultMode": "daily_aggregated",
  "defaultDatePreset": "today",
  "aggregation": "sum",
  "unit": "liters",
  "showTrend": true,
  "showComparison": true,
  "defaultSettings": {
    "mode": "daily_aggregated",
    "datePreset": "today",
    "aggregation": "sum",
    "granularity": "hour",
    "unit": "liters",
    "dataSource": "fuel_dispensed"
  }
}
```

### Fuel Dispense Trend (CHART_LINE_TREND)
```json
{
  "chartType": "line",
  "defaultMode": "daily_aggregated",
  "defaultDatePreset": "last_7_days",
  "aggregation": "sum",
  "granularity": "day",
  "unit": "liters",
  "showDataPoints": true,
  "defaultSettings": {
    "mode": "daily_aggregated",
    "datePreset": "last_7_days",
    "aggregation": "sum",
    "granularity": "day",
    "unit": "liters",
    "dataSource": "fuel_dispensed"
  }
}
```

### Fuel Dispense by Site (CHART_BAR_COMPARISON)
```json
{
  "chartType": "bar",
  "defaultMode": "daily_aggregated",
  "defaultDatePreset": "last_7_days",
  "aggregation": "sum",
  "groupBy": "site",
  "unit": "liters",
  "defaultSettings": {
    "mode": "daily_aggregated",
    "datePreset": "last_7_days",
    "aggregation": "sum",
    "groupBy": "site",
    "unit": "liters",
    "dataSource": "fuel_dispensed"
  }
}
```

## How to Deploy

### Option 1: Automatic Seeding (Recommended)
The templates will be automatically seeded on application startup. The seeder now supports incremental updates, so it will:
- Check which templates already exist in the database
- Only add new templates that don't exist
- Log how many templates were added vs skipped

### Option 2: Manual SQL Script
Run the migration script for existing deployments:
```bash
mysql -u [user] -p gpsdata < Documentation/Features/Dashboard/database/fuel_dispense_templates_migration.sql
```

## User Flow

1. User opens Dashboard and clicks "Add Widget"
2. User sees two options:
   - **Choose Template** - Quick start with pre-configured widgets
   - **Create Custom** - Build a unique widget from scratch

3. For templates:
   - Select from dropdown (includes new "Fuel Dispense Today" template)
   - Pre-filled with optimal settings for the use case
   - Can still customize data source, filters, and date range

4. For custom:
   - Select Category: "Fuel Management"
   - Select Widget Type: "Big Statistics Card" (or other types)
   - Enter name: "My Fuel Widget"
   - Configure data source, filters, and settings

## Permissions Required

All fuel management templates require:
- `dashboard.view` - View dashboard
- `fuel.view` - View fuel data

Roles: User, Manager, Admin
