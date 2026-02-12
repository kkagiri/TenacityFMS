namespace FMS.Application.Features.Notification.Enums
{
    /// <summary>
    /// Well-known notification categories — values MUST match notificationcategories.Id in the database.
    ///
    /// ⚠️ FIXED (2026-02-11): Previous enum values were completely misaligned with DB IDs.
    /// For example: StockReconciliation was =4 but DB id=4 is "Security Alerts".
    /// All values below now match the actual notificationcategories table.
    ///
    /// DB query: SELECT Id, Name FROM notificationcategories ORDER BY Id;
    /// </summary>
    public enum WellKnownCategories
    {
        // ==========================================
        // IDs that exist in the database
        // ==========================================
        SensorVariance = 1,         // DB: "Sensor Variance"
        StockReconciliation = 2,    // DB: "Stock Reconciliation"
        SystemMaintenance = 3,      // DB: "System Maintenance"
        SecurityAlerts = 4,         // DB: "Security Alerts"
        DeliveryAlerts = 5,         // DB: "Delivery Alerts"
        InventoryAlerts = 6,        // DB: "Inventory Alerts"
        ClosingStock = 7,           // DB: "Closing Stock"
        DeviceAlerts = 8,           // DB: "Device Alerts"
        UserActivity = 9,           // DB: "User Activity"
        SystemError = 10,           // DB: "System Error"
        Generic = 11,               // DB: "Generic"
        System = 12,                // DB: "System"
        // Note: DB id=13 does not exist
        PtsDeviceAlarm = 14,        // DB: "PtsDeviceAlarm"
        Reconciliation = 15,        // DB: "Reconciliation"
        IssueTracker = 16,          // DB: "IssueTracker"
        TankVariance = 17,          // DB: "TankVariance"

        // ==========================================
        // IDs that do NOT yet exist in the database.
        // Will require INSERT migration before use.
        // ==========================================
        OpeningStock = 100,         // Planned: opening stock discrepancy alerts
        PtsTankAlarm = 101,         // Planned: PTS tank-level alarms
        DiscrepancyDetected = 102,  // Planned: generic discrepancy alerts
        TagMonitoring = 103         // Planned: vehicle tag monitoring alerts
    }

    /// <summary>
    /// Well-known notification priorities
    /// </summary>
    public enum NotificationPriority
    {
        Low,
        Medium,
        High,
        Critical
    }

    /// <summary>
    /// Well-known notification types
    /// </summary>
    public enum NotificationType
    {
        Info,
        Warning,
        Alert,
        Error
    }

    /// <summary>
    /// Well-known delivery methods
    /// </summary>
    public enum DeliveryMethod
    {
        /// <summary>In-app notification via SignalR</summary>
        System,
        /// <summary>Email notification via SMTP</summary>
        Email,
        /// <summary>SMS text message</summary>
        SMS,
        /// <summary>Mobile/Web push notification (FCM, Expo, APNS)</summary>
        Push
    }
}