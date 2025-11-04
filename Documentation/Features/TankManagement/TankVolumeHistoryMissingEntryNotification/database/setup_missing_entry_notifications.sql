-- ============================================================================
-- Tank Volume Missing Entry Notification - Database Setup Scripts
-- ============================================================================
-- Description: SQL scripts to set up database components for automated
--              missing tank volume entry notifications
-- Date: November 3, 2025
-- Version: 1.0
-- ============================================================================

-- ============================================================================
-- STEP 1: Create Notification Category (if not exists)
-- ============================================================================

INSERT INTO notificationcategories (
    CategoryName,
    Description,
    CreatedAt,
    IsActive
)
SELECT
    'Data Entry',
    'Notifications for missing or incomplete data entries in tank management system',
    NOW(),
    1
WHERE NOT EXISTS (
    SELECT 1 FROM notificationcategories
    WHERE CategoryName = 'Data Entry'
);

-- Verify category was created
SELECT * FROM notificationcategories WHERE CategoryName = 'Data Entry';

-- ============================================================================
-- STEP 2: Create Notification Policy for Missing Tank Volume Entries
--         ⚠️ ONE-TIME SETUP: This policy will be REUSED by all notifications
--         Each daily check will CREATE notifications that REFERENCE this policy
-- ============================================================================

-- First, get the category ID
SET @data_entry_category_id = (
    SELECT Id FROM notificationcategories
    WHERE CategoryName = 'Data Entry'
    LIMIT 1
);

-- Create the notification policy
INSERT INTO notificationpolicies (
    PolicyName,
    Description,
    NotificationCategoryId,
    Priority,
    EnableEmail,
    EnableSMS,
    EnableSystem,
    EmailTemplate,
    SMSTemplate,
    SystemTemplate,
    IsActive,
    CreatedAt,
    UpdatedAt
) VALUES (
    'Tank Volume Missing Entry Daily Alert',
    'Automated daily notification for tanks missing volume entries (opening, closing, transfer, or dispensing) for the previous day',
    @data_entry_category_id,
    'High',
    1, -- Enable email notifications
    0, -- Disable SMS (can be enabled later)
    1, -- Enable in-system notifications
    -- Email Template (HTML with Handlebars placeholders)
    '<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 0; background-color: #f5f5f5; }
        .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #498205 0%, #5fa207 100%); color: #ffffff; padding: 20px; text-align: center; }
        .header h2 { margin: 0; font-size: 24px; }
        .content { padding: 30px; }
        .alert-box { background-color: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; }
        .alert-icon { font-size: 24px; color: #ffc107; margin-right: 10px; }
        .tank-list { background-color: #f9f9f9; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .tank-item { padding: 12px; margin: 8px 0; background-color: #ffffff; border-left: 3px solid #498205; border-radius: 4px; }
        .tank-item strong { color: #498205; font-size: 16px; }
        .tank-detail { color: #666; font-size: 14px; margin: 4px 0; }
        .action-required { background-color: #d1ecf1; border: 1px solid #bee5eb; border-radius: 4px; padding: 15px; margin: 20px 0; }
        .footer { background-color: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
        .footer a { color: #498205; text-decoration: none; }
        .button { display: inline-block; padding: 12px 24px; background-color: #498205; color: #ffffff; text-decoration: none; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h2>⚠️ Missing Tank Volume Entries</h2>
        </div>

        <div class="content">
            <p>Dear Site Administrator,</p>

            <div class="alert-box">
                <span class="alert-icon">⚠️</span>
                <strong>Data Entry Required</strong>
            </div>

            <p>The following tanks at <strong>{{SiteName}}</strong> are missing volume entries for <strong>{{MissingDate}}</strong>:</p>

            <div class="tank-list">
                {{#each MissingTanks}}
                <div class="tank-item">
                    <strong>🛢️ {{this.TankName}}</strong>
                    <div class="tank-detail">Missing Date: {{this.MissingDate}}</div>
                    <div class="tank-detail">Last Entry: {{this.LastEntryDate}}</div>
                </div>
                {{/each}}
            </div>

            <div class="action-required">
                <strong>Action Required:</strong> Please ensure tank volume data (opening balance, closing balance, transfers, or dispensing) is entered by end of day to maintain accurate inventory records.
            </div>

            <p>To enter the missing data:</p>
            <ol>
                <li>Log in to the FMS system</li>
                <li>Navigate to Tank Stock Management</li>
                <li>Select the appropriate tank</li>
                <li>Enter the volume data for {{MissingDate}}</li>
            </ol>

            <center>
                <a href="{{SystemUrl}}/tankstock" class="button">Enter Tank Data Now</a>
            </center>
        </div>

        <div class="footer">
            <p><strong>FMS Tank Management System</strong></p>
            <p>This is an automated notification sent daily at 10:00 AM</p>
            <p>If you have questions or need assistance, please contact your system administrator</p>
            <p><em>Notification ID: {{NotificationId}} | Sent: {{CreatedAt}}</em></p>
        </div>
    </div>
</body>
</html>',
    -- SMS Template (Plain text, under 160 characters)
    'FMS Alert: Tank(s) at {{SiteName}} missing volume entries for {{MissingDate}}. Please enter data ASAP. Log in to FMS for details.',
    -- System Template (For in-app notifications)
    'Tanks at {{SiteName}} are missing volume entries for {{MissingDate}}. {{#each MissingTanks}}{{this.TankName}}, {{/each}}. Please enter data.',
    1, -- IsActive
    NOW(), -- CreatedAt
    NOW()  -- UpdatedAt
);

-- Verify policy was created
SELECT * FROM notificationpolicies
WHERE PolicyName = 'Tank Volume Missing Entry Daily Alert';

-- ============================================================================
-- STEP 3: Create System Configurations for Scheduling
-- ============================================================================

-- Configuration for schedule time
INSERT INTO systemconfigurations (
    ConfigKey,
    ConfigValue,
    Category,
    Description,
    DataType,
    IsEncrypted,
    CreatedAt,
    UpdatedAt
)
SELECT
    'TankVolumeEntryCheck_ScheduleTime',
    '10:00',
    'TankStock',
    'Daily time to check for missing tank volume entries (24-hour format HH:mm, e.g., 10:00 for 10 AM)',
    'String',
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM systemconfigurations
    WHERE ConfigKey = 'TankVolumeEntryCheck_ScheduleTime'
);

-- Configuration to enable/disable the feature
INSERT INTO systemconfigurations (
    ConfigKey,
    ConfigValue,
    Category,
    Description,
    DataType,
    IsEncrypted,
    CreatedAt,
    UpdatedAt
)
SELECT
    'TankVolumeEntryCheck_Enabled',
    'true',
    'TankStock',
    'Enable or disable automated missing tank volume entry notifications',
    'Boolean',
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM systemconfigurations
    WHERE ConfigKey = 'TankVolumeEntryCheck_Enabled'
);

-- Configuration for lookback days
INSERT INTO systemconfigurations (
    ConfigKey,
    ConfigValue,
    Category,
    Description,
    DataType,
    IsEncrypted,
    CreatedAt,
    UpdatedAt
)
SELECT
    'TankVolumeEntryCheck_LookbackDays',
    '1',
    'TankStock',
    'Number of days to look back for missing entries (default: 1 = yesterday only)',
    'Integer',
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM systemconfigurations
    WHERE ConfigKey = 'TankVolumeEntryCheck_LookbackDays'
);

-- Configuration for notification retry attempts
INSERT INTO systemconfigurations (
    ConfigKey,
    ConfigValue,
    Category,
    Description,
    DataType,
    IsEncrypted,
    CreatedAt,
    UpdatedAt
)
SELECT
    'TankVolumeEntryCheck_EmailRetryAttempts',
    '3',
    'TankStock',
    'Number of retry attempts for failed email notifications',
    'Integer',
    0,
    NOW(),
    NOW()
WHERE NOT EXISTS (
    SELECT 1 FROM systemconfigurations
    WHERE ConfigKey = 'TankVolumeEntryCheck_EmailRetryAttempts'
);

-- Verify configurations were created
SELECT * FROM systemconfigurations
WHERE ConfigKey LIKE 'TankVolumeEntryCheck_%'
ORDER BY ConfigKey;

-- ============================================================================
-- STEP 4: Verify Site Administrators are Assigned
-- ============================================================================

-- Check sites without administrator
SELECT
    s.Id,
    s.Name,
    s.SiteAdministratorId,
    s.IsActive,
    CASE
        WHEN s.SiteAdministratorId IS NULL THEN '❌ No Administrator'
        WHEN u.Id IS NULL THEN '⚠️ Invalid Administrator ID'
        WHEN u.Email IS NULL OR u.Email = '' THEN '⚠️ Administrator has no email'
        ELSE '✅ Valid Administrator'
    END AS Status,
    u.UserName,
    u.Email
FROM sites s
LEFT JOIN aspnetusers u ON s.SiteAdministratorId = u.Id
WHERE s.IsActive = 1
ORDER BY
    CASE
        WHEN s.SiteAdministratorId IS NULL THEN 1
        WHEN u.Id IS NULL THEN 2
        WHEN u.Email IS NULL OR u.Email = '' THEN 3
        ELSE 4
    END,
    s.Name;

-- Show count of sites by status
SELECT
    CASE
        WHEN s.SiteAdministratorId IS NULL THEN 'No Administrator'
        WHEN u.Id IS NULL THEN 'Invalid Administrator ID'
        WHEN u.Email IS NULL OR u.Email = '' THEN 'No Email'
        ELSE 'Valid'
    END AS Status,
    COUNT(*) AS Count
FROM sites s
LEFT JOIN aspnetusers u ON s.SiteAdministratorId = u.Id
WHERE s.IsActive = 1
GROUP BY
    CASE
        WHEN s.SiteAdministratorId IS NULL THEN 'No Administrator'
        WHEN u.Id IS NULL THEN 'Invalid Administrator ID'
        WHEN u.Email IS NULL OR u.Email = '' THEN 'No Email'
        ELSE 'Valid'
    END
ORDER BY Status;

-- ============================================================================
-- STEP 5: Create Indexes for Performance (if not exist)
-- ============================================================================

-- Index on TankVolumeHistory for efficient date queries
CREATE INDEX IF NOT EXISTS idx_tankvolumehistory_timestamp_tankid
ON tankvolumehistory(Timestamp, TankId, IsDeleted);

-- Index on TankVolumeHistory for change reason filtering
CREATE INDEX IF NOT EXISTS idx_tankvolumehistory_changereason
ON tankvolumehistory(ChangeReason, Timestamp, IsDeleted);

-- Index on Sites for administrator lookups
CREATE INDEX IF NOT EXISTS idx_sites_siteadministratorid
ON sites(SiteAdministratorId);

-- Verify indexes were created
SHOW INDEX FROM tankvolumehistory WHERE Key_name LIKE 'idx_tankvolumehistory%';
SHOW INDEX FROM sites WHERE Key_name LIKE 'idx_sites%';

-- ============================================================================
-- STEP 6: Test Query to Find Missing Entries (Manual Verification)
-- ============================================================================

-- Set the date to check (yesterday by default)
SET @check_date = DATE_SUB(CURDATE(), INTERVAL 1 DAY);

-- Find all tanks with missing entries for the check date
SELECT
    t.Id AS TankId,
    t.Name AS TankName,
    s.Id AS SiteId,
    s.Name AS SiteName,
    s.SiteAdministratorId,
    u.UserName AS AdminUserName,
    u.Email AS AdminEmail,
    @check_date AS MissingDate,
    (
        SELECT MAX(Timestamp)
        FROM tankvolumehistory tvh
        WHERE tvh.TankId = t.Id
        AND (tvh.IsDeleted IS NULL OR tvh.IsDeleted = 0)
    ) AS LastEntryDate,
    CASE
        WHEN EXISTS (
            SELECT 1
            FROM tankvolumehistory tvh
            WHERE tvh.TankId = t.Id
            AND DATE(tvh.Timestamp) = @check_date
            AND (tvh.IsDeleted IS NULL OR tvh.IsDeleted = 0)
        ) THEN '✅ Has Entry'
        ELSE '❌ Missing Entry'
    END AS Status
FROM tanks t
INNER JOIN sites s ON t.SiteId = s.Id
LEFT JOIN aspnetusers u ON s.SiteAdministratorId = u.Id
WHERE t.IsActive = 1
AND s.IsActive = 1
AND NOT EXISTS (
    SELECT 1
    FROM tankvolumehistory tvh
    WHERE tvh.TankId = t.Id
    AND DATE(tvh.Timestamp) = @check_date
    AND (tvh.IsDeleted IS NULL OR tvh.IsDeleted = 0)
)
ORDER BY s.Name, t.Name;

-- ============================================================================
-- STEP 7: Sample Data for Testing (Optional - Development Only)
-- ============================================================================

-- Uncomment to create sample test data
/*
-- Insert a test user to be site administrator
INSERT INTO aspnetusers (Id, UserName, NormalizedUserName, Email, NormalizedEmail, EmailConfirmed)
VALUES (UUID(), 'test.siteadmin', 'TEST.SITEADMIN', 'test.admin@example.com', 'TEST.ADMIN@EXAMPLE.COM', 1);

-- Get the test user ID
SET @test_admin_id = (SELECT Id FROM aspnetusers WHERE UserName = 'test.siteadmin');

-- Update a test site with the administrator
UPDATE sites
SET SiteAdministratorId = @test_admin_id
WHERE Name = 'Test Site'
LIMIT 1;
*/

-- ============================================================================
-- STEP 8: Verification and Summary
-- ============================================================================

-- Summary of setup
SELECT '========================' AS Separator;
SELECT 'SETUP SUMMARY' AS Info;
SELECT '========================' AS Separator;

SELECT 'Notification Category' AS Component,
       COUNT(*) AS Count,
       '✅ Data Entry category' AS Status
FROM notificationcategories
WHERE CategoryName = 'Data Entry';

SELECT 'Notification Policy' AS Component,
       COUNT(*) AS Count,
       '✅ Missing entry policy' AS Status
FROM notificationpolicies
WHERE PolicyName LIKE '%Tank Volume Missing Entry%';

SELECT 'System Configurations' AS Component,
       COUNT(*) AS Count,
       '✅ Schedule configurations' AS Status
FROM systemconfigurations
WHERE ConfigKey LIKE 'TankVolumeEntryCheck_%';

SELECT 'Active Sites' AS Component,
       COUNT(*) AS Count,
       'Sites enabled' AS Status
FROM sites
WHERE IsActive = 1;

SELECT 'Sites with Admin' AS Component,
       COUNT(*) AS Count,
       'Sites properly configured' AS Status
FROM sites
WHERE IsActive = 1
AND SiteAdministratorId IS NOT NULL;

SELECT 'Sites without Admin' AS Component,
       COUNT(*) AS Count,
       CASE
           WHEN COUNT(*) = 0 THEN '✅ All sites configured'
           ELSE '⚠️ Action required'
       END AS Status
FROM sites
WHERE IsActive = 1
AND SiteAdministratorId IS NULL;

-- ============================================================================
-- ROLLBACK SCRIPTS (Use only if needed to undo changes)
-- ============================================================================

-- Uncomment to rollback changes
/*
-- Remove system configurations
DELETE FROM systemconfigurations
WHERE ConfigKey LIKE 'TankVolumeEntryCheck_%';

-- Remove notification policy
DELETE FROM notificationpolicies
WHERE PolicyName = 'Tank Volume Missing Entry Daily Alert';

-- Remove notification category (only if not used elsewhere)
DELETE FROM notificationcategories
WHERE CategoryName = 'Data Entry'
AND NOT EXISTS (
    SELECT 1 FROM notificationpolicies
    WHERE NotificationCategoryId = notificationcategories.Id
);

-- Drop indexes
DROP INDEX IF EXISTS idx_tankvolumehistory_timestamp_tankid ON tankvolumehistory;
DROP INDEX IF EXISTS idx_tankvolumehistory_changereason ON tankvolumehistory;
DROP INDEX IF EXISTS idx_sites_siteadministratorid ON sites;
*/

-- ============================================================================
-- END OF SETUP SCRIPT
-- ============================================================================

SELECT '========================' AS '';
SELECT 'Database setup completed successfully!' AS Message;
SELECT 'Next steps:' AS '';
SELECT '1. Deploy backend services' AS '';
SELECT '2. Register background service' AS '';
SELECT '3. Configure SMTP settings' AS '';
SELECT '4. Assign site administrators' AS '';
SELECT '5. Test with manual trigger' AS '';
SELECT '========================' AS '';
