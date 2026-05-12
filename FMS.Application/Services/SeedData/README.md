# FMS Seed Data System

## Overview

The FMS seed data system automatically initializes the database with essential data on the first run of the application. This includes:

- **Users**: Default admin, manager, operator, and viewer accounts
- **Roles**: Administrator, Manager, Operator, and Viewer roles
- **Permissions**: Comprehensive permission set for all features
- **Navigation Items**: Menu structure based on the frontend routing
- **Role Permissions**: Mapping of permissions to roles
- **Role Navigations**: Mapping of navigation items to roles

## How It Works

1. **Automatic Execution**: The seeding runs automatically when the application starts via the `DatabaseSeedingHostedService`.

2. **One-Time Execution**: The system tracks whether seeding has been completed in the `seeding_history` table. If an entry exists with `SeedType = "InitialSetup"`, the seeding will be skipped.

3. **Transactional**: All seed operations are wrapped in a database transaction to ensure data consistency.

## Default Users

The following users are created with the password `Admin@123`:

| Username | Email | Role | Description |
|----------|-------|------|-------------|
| admin | admin@fms.com | Administrator | Full system access |
| manager | manager@fms.com | Manager | Management level access |
| operator | operator@fms.com | Operator | Operational level access |
| viewer | viewer@fms.com | Viewer | Read-only access |

## Role Permissions

- **Administrator**: All permissions
- **Manager**: All permissions except system configuration
- **Operator**: View and create permissions for operational tasks
- **Viewer**: View-only permissions

## Navigation Structure

The navigation items are created based on the routes defined in `app-routes.js`:

- Dashboard
- Vehicles
- Tanks
- Tank Stock
- Consumption
- Manual Refill
- Employees
- Tags
- PTS Device
- Automatic Fueling
- Reports
- Fuel Report Importer
- Administration (submenu)
  - Users
  - Roles
  - Permissions
  - Navigations

## Manual Seeding

If you need to manually trigger the seeding process:

1. Delete the record from `seeding_history` table where `seed_type = 'InitialSetup'`
2. Restart the application

## Extending the Seed Data

To add more seed data:

1. Modify the `SeedDataService.cs` file
2. Add your seeding logic in the appropriate method
3. Update the version in `RecordSeedingHistoryAsync` if needed

## Troubleshooting

- Check the application logs for any seeding errors
- Verify the database connection is properly configured
- Ensure the database migrations have been applied
- Check the `seeding_history` table to see if seeding has already been completed