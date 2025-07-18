# Automated Reconciliation System - Deployment Guide

## 🎯 Overview

This guide provides step-by-step instructions to deploy the rebuilt Automated Reconciliation System with full **Notification System Integration** and **Automated Fueling Configuration** support.

## ✅ Implementation Status

### Completed Integrations

| Component | Status | Notification Integration | Configuration Integration | Description |
|-----------|--------|-------------------------|---------------------------|-------------|
| **AutomatedReconciliationService** | ✅ **ACTIVE** | ✅ Complete | ✅ Complete | Enhanced with notifications and config support |
| **ReconciliationOrchestrationService** | ✅ **RECREATED** | ✅ Complete | ✅ Complete | Fully rewritten with notification integration |
| **AutomatedReconciliationBackgroundService** | ✅ **RECREATED** | ✅ Complete | ✅ Complete | Enhanced with health monitoring |
| **PolicyTriggerBackgroundService** | ✅ **RECREATED** | ✅ Complete | ❌ N/A | Redis event handling with notifications |

### Services Requiring Activation

| Service | Location | Status | Action Required |
|---------|----------|--------|-----------------|
| **PolicyEvaluationEngine** | `FMS.Application/Features/AutomatedReconciliation/Services/PolicyEvaluationEngine.cs` | 🔄 **COMMENTED** | Uncomment |
| **DiscrepancyDetectionService** | `FMS.Application/Features/AutomatedReconciliation/Services/DiscrepancyDetectionService.cs` | 🔄 **COMMENTED** | Uncomment |
| **DailyReconciliationPolicyService** | `FMS.Application/Features/AutomatedReconciliation/Services/DailyReconciliationPolicyService.cs` | 🔄 **COMMENTED** | Uncomment |

## 🚀 Deployment Steps

### Step 1: Uncomment Remaining Services

Execute these commands to uncomment the remaining services:

```bash
# Navigate to the project directory
cd FMS.Application/Features/AutomatedReconciliation/Services/

# Uncomment PolicyEvaluationEngine
sed -i 's|^//||g' PolicyEvaluationEngine.cs

# Uncomment DiscrepancyDetectionService
sed -i 's|^//||g' DiscrepancyDetectionService.cs

# Uncomment DailyReconciliationPolicyService
sed -i 's|^//||g' DailyReconciliationPolicyService.cs
```

### Step 2: Update Service Registration

Add the following to your `Program.cs` or `Startup.cs`:

```csharp
// Automated Reconciliation Services
services.AddScoped<AutomatedReconciliationService>();
services.AddScoped<ReconciliationOrchestrationService>();
services.AddScoped<PolicyEvaluationEngine>();
services.AddScoped<DiscrepancyDetectionService>();
services.AddScoped<DailyReconciliationPolicyService>();

// Configuration Integration (if not already registered)
services.AddScoped<IAutomatedFuelingConfigurationService, AutomatedFuelingConfigurationService>();

// Notification Integration (if not already registered)
services.AddScoped<INotificationService, NotificationService>();
services.AddScoped<IAlarmHandlerService, AlarmHandlerService>();

// Background Services
services.AddHostedService<AutomatedReconciliationBackgroundService>();
services.AddHostedService<PolicyTriggerBackgroundService>();

// Redis Services (if using policy triggers)
services.AddScoped<IPolicyTriggerService, PolicyTriggerService>();
```

### Step 3: Configuration Settings

Update your `appsettings.json`:

```json
{
  "AutomatedReconciliation": {
    "ExecutionIntervalMinutes": 15,
    "EnableNotifications": true,
    "DefaultThresholdLiters": 10.0,
    "MaxRetryAttempts": 3,
    "RetryDelayMinutes": 5,
    "EnableHealthMonitoring": true,
    "HealthCheckIntervalMinutes": 30
  },
  "NotificationSettings": {
    "DefaultSender": "FMS Reconciliation System",
    "EnableBackgroundService": true,
    "MaxRetryAttempts": 3,
    "RetryDelayMinutes": 5
  },
  "Redis": {
    "ConnectionString": "localhost:6379",
    "PolicyTriggerChannel": "fms:reconciliation:triggers"
  }
}
```

### Step 4: Database Verification

Ensure these tables exist and are properly configured:

```sql
-- Verify notification tables exist
SHOW TABLES LIKE 'notifications';
SHOW TABLES LIKE 'notification_recipients';
SHOW TABLES LIKE 'notification_policies';

-- Verify reconciliation tables exist
SHOW TABLES LIKE 'reconciliation_policies';
SHOW TABLES LIKE 'reconciliation_policy_executions';
SHOW TABLES LIKE 'reconciliation_discrepancies';

-- Verify configuration table exists
SHOW TABLES LIKE 'automated_fueling_configurations';
```

### Step 5: Initial Configuration Setup

Run this SQL to set up basic configurations for all sites:

```sql
-- Enable reconciliation for all sites with sensible defaults
INSERT INTO automated_fueling_configurations (
    site_id,
    auto_reconcile_tank_volumes,
    max_volume_discrepancy_threshold,
    reconciliation_frequency_minutes,
    discrepancy_action,
    is_active,
    created_by,
    created_on
)
SELECT DISTINCT
    s.site_id,
    1 as auto_reconcile_tank_volumes,                    -- Enable reconciliation
    10.0 as max_volume_discrepancy_threshold,            -- 10L threshold
    15 as reconciliation_frequency_minutes,              -- 15 minutes
    1 as discrepancy_action,                            -- 1=Alert, 2=Block, 3=AutoAdjust
    1 as is_active,
    'System' as created_by,
    NOW() as created_on
FROM sites s
WHERE s.site_id NOT IN (
    SELECT site_id FROM automated_fueling_configurations
    WHERE site_id IS NOT NULL
);

-- Set up global fallback configuration
INSERT INTO automated_fueling_configurations (
    site_id,
    auto_reconcile_tank_volumes,
    max_volume_discrepancy_threshold,
    reconciliation_frequency_minutes,
    discrepancy_action,
    is_active,
    created_by,
    created_on
) VALUES (
    NULL,                                               -- Global configuration
    1,                                                  -- Enable reconciliation
    10.0,                                              -- 10L threshold
    15,                                                -- 15 minutes
    1,                                                 -- Alert only
    1,                                                 -- Active
    'System',
    NOW()
) ON DUPLICATE KEY UPDATE
    auto_reconcile_tank_volumes = 1,
    max_volume_discrepancy_threshold = 10.0,
    reconciliation_frequency_minutes = 15,
    discrepancy_action = 1,
    is_active = 1;
```

### Step 6: Notification Recipients Setup

Configure notification recipients:

```sql
-- Create notification policies for reconciliation events
INSERT INTO notification_policies (name, category, notification_type, priority, enable_email, enable_sms, enable_system, title_template, message_template, is_active) VALUES
('Reconciliation Alerts', 'Reconciliation', 'Alert', 'Medium', 1, 0, 1, 'Reconciliation Alert: {Title}', '{Message}', 1),
('Critical Reconciliation Errors', 'Reconciliation', 'Alert', 'Critical', 1, 1, 1, 'CRITICAL: {Title}', '{Message}', 1),
('System Health Alerts', 'System', 'Alert', 'High', 1, 0, 1, 'System Health: {Title}', '{Message}', 1);

-- Set up default recipients (adjust user IDs as needed)
INSERT INTO notification_policy_recipients (policy_id, user_id, delivery_method, recipient_address, is_active)
SELECT
    np.id as policy_id,
    'fuel-operations' as user_id,
    'System' as delivery_method,
    NULL as recipient_address,
    1 as is_active
FROM notification_policies np
WHERE np.category IN ('Reconciliation', 'System');

-- Add email recipients for critical alerts
INSERT INTO notification_policy_recipients (policy_id, user_id, delivery_method, recipient_address, is_active)
SELECT
    np.id as policy_id,
    'system-administrator' as user_id,
    'Email' as delivery_method,
    'admin@company.com' as recipient_address,  -- Update with actual email
    1 as is_active
FROM notification_policies np
WHERE np.priority = 'Critical';
```

## 🧪 Testing the Deployment

### Step 1: Verify Services are Running

Check logs for service startup:

```bash
# Check if background services started
grep "Automated Reconciliation Background Service starting" /path/to/logs/app.log
grep "PolicyTriggerBackgroundService starting" /path/to/logs/app.log
```

### Step 2: Test Notification Integration

Create a test notification:

```csharp
// Test notification service
var testRequest = new CreateNotificationRequest
{
    Type = "Info",
    Category = "System",
    Priority = "Low",
    Title = "Reconciliation System Test",
    Message = "Automated Reconciliation System deployment test",
    TriggerSource = "ManualTest",
    TriggeredBy = "Administrator",
    Recipients = new List<CreateNotificationRecipientRequest>
    {
        new CreateNotificationRecipientRequest
        {
            UserId = "fuel-operations",
            DeliveryMethods = new List<string> { "System" }
        }
    }
};

await notificationService.CreateNotificationAsync(testRequest);
```

### Step 3: Test Configuration Integration

Verify configuration is being read:

```sql
-- Check if configurations are loaded properly
SELECT
    COALESCE(site_id, 'GLOBAL') as site,
    auto_reconcile_tank_volumes,
    max_volume_discrepancy_threshold,
    reconciliation_frequency_minutes,
    discrepancy_action
FROM automated_fueling_configurations
WHERE is_active = 1
ORDER BY site_id;
```

### Step 4: Monitor First Reconciliation Cycle

Watch for the first reconciliation cycle (default: 15 minutes):

```bash
# Monitor reconciliation cycle logs
tail -f /path/to/logs/app.log | grep "reconciliation cycle"
```

## 📊 Monitoring and Health Checks

### Key Metrics to Track

1. **Service Health**:
   ```sql
   -- Check recent reconciliation executions
   SELECT
       COUNT(*) as total_executions,
       SUM(CASE WHEN status = 'Completed' THEN 1 ELSE 0 END) as successful,
       SUM(CASE WHEN status = 'Failed' THEN 1 ELSE 0 END) as failed
   FROM reconciliation_policy_executions
   WHERE execution_start_time > DATE_SUB(NOW(), INTERVAL 24 HOUR);
   ```

2. **Notification Delivery**:
   ```sql
   -- Check notification delivery rates
   SELECT
       delivery_status,
       COUNT(*) as count,
       ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM notification_recipients WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)), 2) as percentage
   FROM notification_recipients
   WHERE created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR)
   GROUP BY delivery_status;
   ```

3. **Configuration Usage**:
   ```sql
   -- Check which sites are using reconciliation
   SELECT
       s.site_name,
       afc.auto_reconcile_tank_volumes,
       afc.max_volume_discrepancy_threshold,
       COUNT(rpe.id) as executions_last_24h
   FROM sites s
   LEFT JOIN automated_fueling_configurations afc ON s.site_id = afc.site_id
   LEFT JOIN reconciliation_policies rp ON s.site_id = rp.site_id
   LEFT JOIN reconciliation_policy_executions rpe ON rp.id = rpe.policy_id
       AND rpe.execution_start_time > DATE_SUB(NOW(), INTERVAL 24 HOUR)
   GROUP BY s.site_id, s.site_name, afc.auto_reconcile_tank_volumes, afc.max_volume_discrepancy_threshold;
   ```

## 🛠️ Troubleshooting

### Common Issues

| Issue | Symptoms | Solution |
|-------|----------|----------|
| **Services not starting** | No log entries | Check service registration in `Program.cs` |
| **No reconciliation cycles** | No execution records | Verify `AutoReconcileTankVolumes = 1` in configuration |
| **Notifications not sending** | No notification records | Check notification service registration and SMTP settings |
| **Redis connection errors** | Policy trigger errors | Verify Redis connection string and service availability |
| **Database connection issues** | Service startup failures | Check connection strings and database accessibility |

### Debug Commands

```sql
-- Check service configuration
SELECT * FROM automated_fueling_configurations WHERE is_active = 1;

-- Check recent notifications
SELECT * FROM notifications WHERE created_at > DATE_SUB(NOW(), INTERVAL 1 HOUR) ORDER BY created_at DESC;

-- Check policy execution status
SELECT * FROM reconciliation_policy_executions WHERE execution_start_time > DATE_SUB(NOW(), INTERVAL 1 HOUR) ORDER BY execution_start_time DESC;

-- Check for errors
SELECT * FROM notification_recipients WHERE delivery_status = 'Failed' AND created_at > DATE_SUB(NOW(), INTERVAL 24 HOUR);
```

## 🎉 Post-Deployment Verification

### Success Criteria

- ✅ Background services start without errors
- ✅ First reconciliation cycle completes within 15 minutes
- ✅ Notifications are created and delivered successfully
- ✅ Configuration settings are respected
- ✅ Health monitoring notifications work
- ✅ Error handling and recovery work properly

### Performance Baseline

After 24 hours of operation, establish baselines:
- Reconciliation cycle success rate: >95%
- Notification delivery rate: >98%
- Average cycle duration: <5 minutes
- Memory usage: <500MB per background service

## 📞 Support

### Contact Information

- **Operations Team**: For reconciliation alerts and manual reviews
- **System Administrator**: For service health and configuration issues
- **Development Team**: For code issues and enhancements

### Log Locations

- **Application Logs**: `/var/log/fms/application.log`
- **Reconciliation Logs**: Filter by `AutomatedReconciliation`
- **Notification Logs**: Filter by `NotificationService`
- **Background Service Logs**: Filter by `BackgroundService`

---

**🎯 Ready for Production!**

The Automated Reconciliation System is now fully integrated with notifications and configuration management, providing robust, monitored, and configurable reconciliation capabilities.