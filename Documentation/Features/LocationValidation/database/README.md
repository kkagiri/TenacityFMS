# Location Validation Database Migration Scripts

This directory contains SQL migration scripts for the Geofence & Fixed Location Validation feature.

## Overview

These scripts implement database changes required for:

1. **Geofence Caching** - Local storage of GPSGate geofences for validation
2. **Fueling Rule Geofence Assignments** - Link rule sets to allowed geofences
3. **Fixed Location Vehicles** - Register stationary equipment locations

## Script Execution Order

Execute scripts in numerical order:

### 1. Create GPS Geofence Tables

**Script:** `01_create_gps_geofence_tables.sql`

Creates three tables:

- `gps_geofence` - Cached geofence data from GPSGate
- `gps_geofence_group` - Cached geofence groups
- `gps_geofence_group_member` - Many-to-many relationship

**Purpose:** Enable local caching of geofences from GPSGate for fast validation without API calls.

### 2. Create Fueling Rule Set Geofence Assignments

**Script:** `02_create_fueling_rule_geofence_assignments.sql`

Creates two tables:

- `fueling_rule_set_geofence` - Individual geofence assignments
- `fueling_rule_set_geofence_group` - Geofence group assignments

**Purpose:** Link fueling rule sets to specific geofences or groups for location validation.

### 3. Alter Fueling Rule Set Table

**Script:** `03_alter_fueling_rule_set_add_geofence_columns.sql`

Adds columns to `fuelingruleset`:

- `is_geofence_validation_enabled` - Enable/disable geofence validation
- `require_tanker_in_geofence` - Require tanker within geofence
- `require_operator_in_geofence` - Require operator within geofence
- `require_vehicle_in_geofence` - Require vehicle within geofence

**Purpose:** Control which parties must be within geofences during fueling.

### 4. Alter Vehicle Table

**Script:** `04_alter_vehicle_add_fixed_location_columns.sql`

Adds columns to `vehicle`:

- `is_fixed_location` - Flag for fixed/stationary assets
- `fixed_latitude` / `fixed_longitude` - Registered coordinates
- `fixed_location_radius_meters` - Allowed proximity radius
- `fixed_location_name` - Descriptive location name
- `fixed_location_last_verified_at` - Last verification timestamp
- `fixed_location_verified_by` - User who verified
- `require_proximity_validation` - Enable/disable validation

**Purpose:** Support proximity validation for stationary equipment (generators, pumps, etc.).

## Pre-Execution Checklist

- [ ] Backup database before executing
- [ ] Test scripts in development environment first
- [ ] Review table relationships and foreign keys
- [ ] Verify database user has sufficient privileges
- [ ] Check for existing table conflicts

## Post-Execution Verification

After running each script:

1. **Check table creation:**

   ```sql
   SHOW TABLES LIKE 'gps_%';
   SHOW TABLES LIKE 'fueling_rule_set_geofence%';
   ```

2. **Verify column additions:**

   ```sql
   DESCRIBE fuelingruleset;
   DESCRIBE vehicle;
   ```

3. **Check foreign key constraints:**

   ```sql
   SELECT
       TABLE_NAME,
       CONSTRAINT_NAME,
       REFERENCED_TABLE_NAME,
       REFERENCED_COLUMN_NAME
   FROM INFORMATION_SCHEMA.KEY_COLUMN_USAGE
   WHERE TABLE_SCHEMA = DATABASE()
     AND REFERENCED_TABLE_NAME IN ('gps_geofence', 'gps_geofence_group', 'fuelingruleset');
   ```

4. **Test data integrity:**
   ```sql
   -- Verify empty tables are created properly
   SELECT COUNT(*) FROM gps_geofence;
   SELECT COUNT(*) FROM gps_geofence_group;
   ```

## Rollback Scripts

To reverse these changes, execute in reverse order:

```sql
-- Script 4 Rollback
ALTER TABLE `vehicle`
DROP COLUMN `is_fixed_location`,
DROP COLUMN `fixed_latitude`,
DROP COLUMN `fixed_longitude`,
DROP COLUMN `fixed_location_radius_meters`,
DROP COLUMN `fixed_location_name`,
DROP COLUMN `fixed_location_last_verified_at`,
DROP COLUMN `fixed_location_verified_by`,
DROP COLUMN `require_proximity_validation`;

DROP INDEX `IX_vehicle_fixed_location` ON `vehicle`;

-- Script 3 Rollback
ALTER TABLE `fuelingruleset`
DROP COLUMN `is_geofence_validation_enabled`,
DROP COLUMN `require_tanker_in_geofence`,
DROP COLUMN `require_operator_in_geofence`,
DROP COLUMN `require_vehicle_in_geofence`;

-- Script 2 Rollback
DROP TABLE IF EXISTS `fueling_rule_set_geofence_group`;
DROP TABLE IF EXISTS `fueling_rule_set_geofence`;

-- Script 1 Rollback
DROP TABLE IF EXISTS `gps_geofence_group_member`;
DROP TABLE IF EXISTS `gps_geofence_group`;
DROP TABLE IF EXISTS `gps_geofence`;
```

## Related Documentation

- **PRD:** `../GEOFENCE_VALIDATION_PRD.md`
- **Architecture:** `../ARCHITECTURE.md`
- **API Documentation:** `../API.md`

## Notes

### Geofence Sync Strategy

- Geofences are synced from GPSGate on-demand or via scheduled job
- `last_synced_at` timestamp tracks sync freshness
- `external_geofence_id` links to GPSGate source

### Performance Considerations

- Indexes on `external_geofence_id` and `external_group_id` for fast lookups
- Composite unique indexes prevent duplicate assignments
- Cascading deletes maintain referential integrity

### Data Migration

If existing fueling rule sets need geofence assignments:

1. Identify rule sets requiring location validation
2. Sync geofences from GPSGate
3. Create assignments using new relationship tables
4. Enable `is_geofence_validation_enabled` flag

## Support

For issues or questions:

- Review error logs in MySQL error log
- Check application logs for EF Core migration errors
- Contact: FMS Development Team
