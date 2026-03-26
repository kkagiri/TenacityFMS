-- File: 2026-03-25_seed_vehicle_document_compliance_event.sql
-- Purpose: Seed the default notification policy and event expression for vehicle document compliance.
-- Dependencies: notificationcategories, notification_policy, event_expressions, user
-- Last Modified: 2026-03-25
-- Key Statements:
-- - resolve a valid seed user for FK-backed CreatedBy columns
-- - seed the default vehicle document compliance notification policy
-- - seed the default VehicleDocumentCompliance event expression

START TRANSACTION;

SET @vehicle_doc_category_id = (
    SELECT Id
    FROM notificationcategories
    WHERE Name = 'System Maintenance'
    LIMIT 1
);

SET @vehicle_doc_seed_user_id = COALESCE(
    (
        SELECT Id
        FROM user
        WHERE UserName = 'System'
        LIMIT 1
    ),
    (
        SELECT Id
        FROM user
        WHERE COALESCE(IsDeleted, 0) = 0
        ORDER BY UserName
        LIMIT 1
    )
);

INSERT INTO notification_policy (
    Name,
    Description,
    IsActive,
    NotificationCategoryId,
    NotificationType,
    Priority,
    MaxNotificationsPerHour,
    MaxNotificationsPerDay,
    CooldownMinutes,
    EnableEmail,
    EnableSms,
    EnableSystem,
    EnableSound,
    TitleTemplate,
    MessageTemplate,
    RequireAcknowledgment,
    AcknowledgmentTimeoutMinutes,
    CreateIssueTracker,
    CreatedBy,
    CreatedAt
)
SELECT
    'Vehicle Document Compliance - Default Policy',
    'System-seeded default policy for vehicle document compliance events.',
    1,
    COALESCE(@vehicle_doc_category_id, 3),
    'Alert',
    'High',
    4,
    20,
    1440,
    1,
    0,
    1,
    0,
    'Vehicle document {{SubType}} - {{VehicleNo}}',
    '{{ComplianceCategoryName}} for {{VehicleNo}} is due on {{ExpiryDate}}.',
    0,
    0,
    0,
    @vehicle_doc_seed_user_id,
    UTC_TIMESTAMP()
FROM DUAL
WHERE @vehicle_doc_seed_user_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM notification_policy p
      WHERE p.Name = 'Vehicle Document Compliance - Default Policy'
  );

SET @vehicle_doc_policy_id = (
    SELECT Id
    FROM notification_policy
    WHERE Name = 'Vehicle Document Compliance - Default Policy'
    ORDER BY Id DESC
    LIMIT 1
);

INSERT INTO event_expressions (
    Name,
    Description,
    IsActive,
    is_system,
    EventType,
    SiteId,
    TankId,
    DeviceId,
    MinimumSeverity,
    Conditions,
    NotificationPolicyId,
    CooldownMinutes,
    MaxNotificationsPerDay,
    MaxNotificationsPerHour,
    Priority,
    CreateActiveEvent,
    MessageTemplate,
    CreatedBy,
    CreatedAt
)
SELECT
    'Vehicle Document Compliance',
    'System default: Raises due-soon and expired vehicle document notifications with document download and attachment support.',
    1,
    1,
    'VehicleDocumentCompliance',
    NULL,
    NULL,
    NULL,
    NULL,
    NULL,
    @vehicle_doc_policy_id,
    1440,
    0,
    0,
    'High',
    1,
    '{{ComplianceCategoryName}} for {{VehicleNo}} expires on {{ExpiryDate}} ({{DaysUntilExpiry}} day(s) remaining).',
    @vehicle_doc_seed_user_id,
    UTC_TIMESTAMP()
FROM DUAL
WHERE @vehicle_doc_seed_user_id IS NOT NULL
  AND @vehicle_doc_policy_id IS NOT NULL
  AND NOT EXISTS (
      SELECT 1
      FROM event_expressions ee
      WHERE ee.Name = 'Vehicle Document Compliance'
        AND ee.EventType = 'VehicleDocumentCompliance'
  );

COMMIT;