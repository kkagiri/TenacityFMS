-- ============================================================
-- GPS Offline Issue Template & Auto-Close Configuration
-- Purpose: Enable automatic issue creation when GPS devices go offline
-- Date: 2026-02-09
-- ============================================================

-- 1. Insert GPS Offline issue template (DeviceTypeId=1 is "GPS Device")
INSERT INTO issuetemplate (
    DeviceTypeId,
    Name,
    TitleTemplate,
    DescriptionTemplate,
    DefaultPriorityId,
    DefaultStatusId,
    IsActive,
    CanAutoCreate,
    OfflineThresholdMinutes,
    DefaultAssignee,
    CreatedAt,
    UpdatedAt
) VALUES (
    1,                          -- GPS Device
    'GPS Offline',
    'GPS Offline - {vehicleName}',
    'Vehicle GPS device has been offline for more than {thresholdMinutes} minutes. Last seen: {lastSeen}.',
    3,                          -- High priority
    3,                          -- Open status
    1,                          -- IsActive = true
    1,                          -- CanAutoCreate = true  ← THIS IS THE KEY FLAG
    60,                         -- 60 minutes offline threshold
    NULL,                       -- No default assignee
    NOW(),
    NOW()
);

-- 2. Insert auto-close config linked to the template above
--    When the device comes back online, the issue auto-closes
INSERT INTO issueautocloseconfig (
    IssueTemplateId,
    IsEnabled,
    CheckerType,
    CheckIntervalSeconds,
    CheckerConfigJson,
    AutoCloseWhenSatisfied,
    CreatedAt,
    UpdatedAt
) VALUES (
    LAST_INSERT_ID(),           -- Links to the template just created
    1,                          -- IsEnabled = true
    'Online',                   -- Uses OnlineChecker to detect device coming back online
    300,                        -- Check every 5 minutes
    '{"onlineThresholdMinutes": 15}',  -- Device must be online for 15 min to auto-close
    1,                          -- Auto-close when condition is satisfied
    NOW(),
    NOW()
);

-- Verify the inserts
SELECT t.Id, t.Name, t.CanAutoCreate, t.OfflineThresholdMinutes,
       d.Name AS DeviceType, ac.CheckerType, ac.IsEnabled AS AutoCloseEnabled
FROM issuetemplate t
JOIN devicetype d ON d.Id = t.DeviceTypeId
LEFT JOIN issueautocloseconfig ac ON ac.IssueTemplateId = t.Id
WHERE t.Name = 'GPS Offline';
