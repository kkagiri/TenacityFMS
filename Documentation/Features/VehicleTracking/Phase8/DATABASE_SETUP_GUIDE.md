# Database Setup Guide - Provider Management System

## ?? Prerequisites

Before running the database scripts, ensure you have:

- ? MySQL database access
- ? Database connection credentials
- ? GPSGate API credentials ready:
  - API Key
  - Base URL (e.g., `http://10.0.10.150/comGpsGate/api/v.1`)
  - Application ID (numeric)
- ? Admin/DBA permissions

---

## ??? Database Tables Required

### 1. provider_configurations (Should exist from Phase 2)

If not exists, create with:

```sql
CREATE TABLE provider_configurations (
    provider_id INT PRIMARY KEY AUTO_INCREMENT,
    provider_name VARCHAR(100) UNIQUE NOT NULL,
    display_name VARCHAR(200),
    description TEXT,
    is_enabled BOOLEAN DEFAULT TRUE,
    is_default BOOLEAN DEFAULT FALSE,
    priority_order INT DEFAULT 999,
    configuration_data JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_provider_name (provider_name),
    INDEX idx_is_enabled (is_enabled),
    INDEX idx_is_default (is_default),
    INDEX idx_priority (priority_order)
);
```

### 2. navigationitems (Should exist)

Verify with:

```sql
SHOW TABLES LIKE 'navigationitems';
DESC navigationitems;
```

---

## ?? Step-by-Step Setup

### Step 1: Connect to Database

**Using MySQL Command Line**:

```powershell
mysql -h localhost -u your_username -p your_database_name
```

**Using MySQL Workbench**:

1. Open MySQL Workbench
2. Connect to your database server
3. Select the FMS database

**Using DBeaver or Similar**:

1. Open connection to FMS database
2. Open SQL editor

---

### Step 2: Update GPSGate Configuration Script

**IMPORTANT**: Before running the script, you need to update the configuration values.

**Original Script** (DON'T RUN AS-IS):

```sql
JSON_OBJECT(
    'ApiKey', 'YOUR_GPSGATE_API_KEY_HERE',
    'BaseUrl', 'http://YOUR_GPSGATE_SERVER/comGpsGate/api/v.1',
    'ApplicationId', '12'
)
```

**Updated Script** (EXAMPLE - Replace with YOUR values):

```sql
JSON_OBJECT(
    'ApiKey', 'abc123def456ghi789',
    'BaseUrl', 'http://10.0.10.150/comGpsGate/api/v.1',
    'ApplicationId', '12'
)
```

**Where to get these values**:

- **ApiKey**: From your GPSGate administrator or API settings
- **BaseUrl**: Your GPSGate server URL + `/comGpsGate/api/v.1`
- **ApplicationId**: From GPSGate application settings (usually numeric)

---

### Step 3: Execute GPSGate Provider Configuration

**File**: `Documentation/Features/VehicleTracking/Phase4/01_GPSGateProvider_Configuration.sql`

**Option A - Execute Updated Script**:

```sql
-- Insert GPSGate provider configuration
INSERT INTO provider_configurations (
    provider_name,
    display_name,
    description,
    is_enabled,
    is_default,
    priority_order,
    configuration_data,
    created_at,
    updated_at
) VALUES (
    'GPSGate',
    'GPSGate Vehicle Tracker',
    'Integration with GPSGate Vehicle Tracker system for real-time vehicle location and tracking data',
    1,  -- is_enabled: TRUE (provider is active)
    1,  -- is_default: TRUE (this is the default provider)
    1,  -- priority_order: 1 (highest priority)
    JSON_OBJECT(
        'ApiKey', 'YOUR_ACTUAL_API_KEY',        -- ?? UPDATE THIS
        'BaseUrl', 'YOUR_ACTUAL_BASE_URL',      -- ?? UPDATE THIS
        'ApplicationId', 'YOUR_APP_ID'          -- ?? UPDATE THIS
    ),
    NOW(),
    NOW()
)
ON DUPLICATE KEY UPDATE
    display_name = VALUES(display_name),
    description = VALUES(description),
    is_enabled = VALUES(is_enabled),
    is_default = VALUES(is_default),
    priority_order = VALUES(priority_order),
    configuration_data = VALUES(configuration_data),
    updated_at = NOW();
```

**Option B - Quick Update via PowerShell**:

```powershell
# Navigate to the SQL file location
cd "C:\Users\admin\Documents\GitHub\Tenacity.FMS\Documentation\Features\VehicleTracking\Phase4"

# Create a copy with your credentials
$apiKey = "your-api-key-here"
$baseUrl = "http://10.0.10.150/comGpsGate/api/v.1"
$appId = "12"

# Read and replace
$sql = Get-Content "01_GPSGateProvider_Configuration.sql" -Raw
$sql = $sql -replace 'YOUR_GPSGATE_API_KEY_HERE', $apiKey
$sql = $sql -replace 'http://YOUR_GPSGATE_SERVER/comGpsGate/api/v.1', $baseUrl
$sql = $sql -replace "'12'", "'$appId'"

# Save to temp file
$sql | Out-File "01_GPSGateProvider_Configuration_Updated.sql" -Encoding UTF8

# Now execute the updated file in MySQL
```

---

### Step 4: Verify GPSGate Configuration

```sql
-- Verify the configuration was inserted correctly
SELECT
    provider_id,
    provider_name,
    display_name,
    is_enabled,
    is_default,
    priority_order,
    JSON_PRETTY(configuration_data) as configuration,
    created_at,
    updated_at
FROM provider_configurations
WHERE provider_name = 'GPSGate';
```

**Expected Output**:

```
+-------------+--------------+-------------------------+------------+------------+----------------+---------------------+
| provider_id | provider_name | display_name           | is_enabled | is_default | priority_order | configuration       |
+-------------+--------------+-------------------------+------------+------------+----------------+---------------------+
|           1 | GPSGate      | GPSGate Vehicle Tracker |          1 |          1 |              1 | {                   |
|             |              |                         |            |            |                |   "ApiKey": "...",  |
|             |              |                         |            |            |                |   "BaseUrl": "...", |
|             |              |                         |            |            |                |   "ApplicationId":12|
|             |              |                         |            |            |                | }                   |
+-------------+--------------+-------------------------+------------+------------+----------------+---------------------+
```

---

### Step 5: Execute Provider Management Navigation Script

**File**: `Documentation/Features/VehicleTracking/Phase7/01_ProviderManagement_Navigation.sql`

**Execute the Full Script**:

```sql
-- Insert Provider Management navigation item
INSERT INTO navigationitems (
    Title,
    Path,
    Icon,
    ParentId,
    SortOrder,
    IsActive,
    RequiresAuth,
    Description
) VALUES (
    'Provider Management',
    '/providermanagement',
    'fa-light fa-network-wired',
    NULL,
    90,
    1,
    1,
    'Manage GPS tracking providers, configurations, and health monitoring'
);

-- Get the newly created navigation item ID
SET @provider_mgmt_nav_id = LAST_INSERT_ID();

-- Add sub-navigation items
INSERT INTO navigationitems (
    Title,
    Path,
    Icon,
    ParentId,
    SortOrder,
    IsActive,
    RequiresAuth,
    Description
) VALUES
(
    'Provider Dashboard',
    '/providermanagement/dashboard',
    'fa-light fa-gauge-high',
    @provider_mgmt_nav_id,
    1,
    1,
    1,
    'Real-time provider health and statistics dashboard'
),
(
    'Provider Configuration',
    '/providermanagement/configuration',
    'fa-light fa-gear',
    @provider_mgmt_nav_id,
    2,
    1,
    1,
    'Configure and manage provider settings'
),
(
    'Vehicle Assignments',
    '/providermanagement/assignments',
    'fa-light fa-truck',
    @provider_mgmt_nav_id,
    3,
    1,
    1,
    'Assign vehicles to specific tracking providers'
);
```

---

### Step 6: Verify Navigation Items

```sql
-- Verify the navigation items were created
SELECT
    n.NavigationItemId,
    n.Title,
    n.Path,
    n.Icon,
    p.Title AS ParentTitle,
    n.SortOrder,
    n.IsActive
FROM navigationitems n
LEFT JOIN navigationitems p ON n.ParentId = p.NavigationItemId
WHERE n.Title LIKE '%Provider%'
ORDER BY n.ParentId, n.SortOrder;
```

**Expected Output**:

```
+------------------+------------------------+----------------------------------+-------------------------+--------------+-----------+----------+
| NavigationItemId | Title                  | Path                             | Icon                    | ParentTitle  | SortOrder | IsActive |
+------------------+------------------------+----------------------------------+-------------------------+--------------+-----------+----------+
|              XXX | Provider Management    | /providermanagement              | fa-light fa-network...  | NULL         |        90 |        1 |
|              YYY | Provider Dashboard     | /providermanagement/dashboard    | fa-light fa-gauge-high  | Provider ... |         1 |        1 |
|              ZZZ | Provider Configuration | /providermanagement/configuration| fa-light fa-gear        | Provider ... |         2 |        1 |
|              AAA | Vehicle Assignments    | /providermanagement/assignments  | fa-light fa-truck       | Provider ... |         3 |        1 |
+------------------+------------------------+----------------------------------+-------------------------+--------------+-----------+----------+
```

---

### Step 7: Assign Navigation Permissions to Roles

**Check Your Role System**:

```sql
-- Check if you have a roles table
SHOW TABLES LIKE '%role%';

-- View existing roles
SELECT * FROM roles;
```

**Option A - If you have a navigationitem_roles table**:

```sql
-- Get Admin role ID
SET @admin_role_id = (SELECT RoleId FROM roles WHERE RoleName = 'Admin' LIMIT 1);

-- Assign all Provider Management items to Admin
INSERT INTO navigationitem_roles (NavigationItemId, RoleId)
SELECT NavigationItemId, @admin_role_id
FROM navigationitems
WHERE Title LIKE '%Provider%'
ON DUPLICATE KEY UPDATE RoleId = @admin_role_id;
```

**Option B - If you have a different permission system**:

Consult your existing navigation permission setup. You may need to:

- Add permissions to `user_permissions` table
- Update role-based access control (RBAC) tables
- Configure via admin UI

---

## ? Verification Checklist

After completing all steps, verify:

### Database Verification

- [ ] **Provider Configuration Exists**

  ```sql
  SELECT COUNT(*) FROM provider_configurations WHERE provider_name = 'GPSGate';
  -- Expected: 1
  ```

- [ ] **Configuration Data is Valid JSON**

  ```sql
  SELECT JSON_VALID(configuration_data)
  FROM provider_configurations
  WHERE provider_name = 'GPSGate';
  -- Expected: 1 (true)
  ```

- [ ] **Provider is Enabled**

  ```sql
  SELECT is_enabled FROM provider_configurations WHERE provider_name = 'GPSGate';
  -- Expected: 1
  ```

- [ ] **Navigation Items Created**

  ```sql
  SELECT COUNT(*) FROM navigationitems WHERE Title LIKE '%Provider%';
  -- Expected: 4 (1 parent + 3 children)
  ```

- [ ] **Navigation Items Are Active**
  ```sql
  SELECT COUNT(*) FROM navigationitems WHERE Title LIKE '%Provider%' AND IsActive = 1;
  -- Expected: 4
  ```

---

## ?? Troubleshooting

### Issue 1: Table 'provider_configurations' doesn't exist

**Solution**: Create the table first (see schema above), then run the insert script.

### Issue 2: Duplicate entry for key 'provider_name'

**Solution**: GPSGate already exists. Use UPDATE instead:

```sql
UPDATE provider_configurations
SET
    configuration_data = JSON_OBJECT(
        'ApiKey', 'your-api-key',
        'BaseUrl', 'your-base-url',
        'ApplicationId', '12'
    ),
    updated_at = NOW()
WHERE provider_name = 'GPSGate';
```

### Issue 3: Navigation items already exist

**Solution**: Delete and re-insert:

```sql
DELETE FROM navigationitems WHERE Title LIKE '%Provider%';
-- Then re-run the navigation script
```

### Issue 4: JSON_OBJECT not recognized

**Solution**: Ensure MySQL version 5.7.8+ or use string format:

```sql
configuration_data = '{"ApiKey":"your-key","BaseUrl":"your-url","ApplicationId":"12"}'
```

### Issue 5: Can't see menu in UI after adding navigation

**Possible Causes**:

1. User doesn't have role permissions
2. Cache needs clearing (logout/login)
3. Navigation not assigned to user's role
4. Frontend not rebuilt

**Solutions**:

- Clear browser cache (Ctrl+Shift+Del)
- Logout and login again
- Verify role permissions
- Rebuild frontend: `npm run build:prod`

---

## ?? Quick Setup Script (All-in-One)

**For Advanced Users** - Execute this in MySQL Workbench:

```sql
-- ===================================================================
-- QUICK SETUP SCRIPT - Provider Management System
-- ===================================================================
-- IMPORTANT: Update the configuration values below before running!
-- ===================================================================

-- Step 1: Insert GPSGate Provider Configuration
INSERT INTO provider_configurations (
    provider_name,
    display_name,
    description,
    is_enabled,
    is_default,
    priority_order,
    configuration_data,
    created_at,
    updated_at
) VALUES (
    'GPSGate',
    'GPSGate Vehicle Tracker',
    'Integration with GPSGate Vehicle Tracker system',
    1, 1, 1,
    JSON_OBJECT(
        'ApiKey', 'YOUR_API_KEY_HERE',              -- ?? UPDATE
        'BaseUrl', 'http://10.0.10.150/comGpsGate/api/v.1',  -- ?? UPDATE
        'ApplicationId', '12'                       -- ?? UPDATE
    ),
    NOW(), NOW()
)
ON DUPLICATE KEY UPDATE
    configuration_data = VALUES(configuration_data),
    updated_at = NOW();

-- Step 2: Verify Provider
SELECT 'Provider Configuration' AS Step,
       CASE WHEN COUNT(*) = 1 THEN '? SUCCESS' ELSE '? FAILED' END AS Status
FROM provider_configurations WHERE provider_name = 'GPSGate';

-- Step 3: Add Navigation Items
INSERT INTO navigationitems (Title, Path, Icon, ParentId, SortOrder, IsActive, RequiresAuth, Description)
VALUES ('Provider Management', '/providermanagement', 'fa-light fa-network-wired', NULL, 90, 1, 1,
        'Manage GPS tracking providers');

SET @nav_id = LAST_INSERT_ID();

INSERT INTO navigationitems (Title, Path, Icon, ParentId, SortOrder, IsActive, RequiresAuth, Description)
VALUES
('Provider Dashboard', '/providermanagement/dashboard', 'fa-light fa-gauge-high', @nav_id, 1, 1, 1, 'Dashboard'),
('Provider Configuration', '/providermanagement/configuration', 'fa-light fa-gear', @nav_id, 2, 1, 1, 'Configuration'),
('Vehicle Assignments', '/providermanagement/assignments', 'fa-light fa-truck', @nav_id, 3, 1, 1, 'Assignments');

-- Step 4: Verify Navigation
SELECT 'Navigation Items' AS Step,
       CASE WHEN COUNT(*) = 4 THEN '? SUCCESS' ELSE '? FAILED' END AS Status
FROM navigationitems WHERE Title LIKE '%Provider%';

-- Step 5: Summary
SELECT '=== SETUP COMPLETE ===' AS Message;
SELECT provider_name, is_enabled, is_default FROM provider_configurations WHERE provider_name = 'GPSGate';
SELECT Title, Path, IsActive FROM navigationitems WHERE Title LIKE '%Provider%' ORDER BY ParentId, SortOrder;
```

---

## ?? Next Steps

After database setup is complete:

1. ? **Mark todo as complete**
2. ?? **Proceed to "Deploy & Test Backend"**
   - Build frontend: `cd fms.frontend && npm run build:prod`
   - Start API: Open FMS.WebClient in Visual Studio and run
   - Check logs for provider discovery
3. ?? **Proceed to "Test Frontend UI"**
   - Navigate to `/providermanagement`
   - Test all features

---

**Setup Guide Version**: 1.0
**Last Updated**: October 27, 2025
**Estimated Time**: 15-30 minutes
