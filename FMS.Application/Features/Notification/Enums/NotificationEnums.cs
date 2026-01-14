namespace FMS.Application.Features.Notification.Enums
{
    /// <summary>
    /// Well-known notification categories - these should match database entries
    /// </summary>
    public enum WellKnownCategories
    {
        SensorVariance = 1,
        TankVariance = 2,
        OpeningStock = 3,
        StockReconciliation = 4,
        SystemMaintenance = 5,
        SecurityAlerts = 6,
        DeliveryAlerts = 7,
        InventoryAlerts = 8,
        ClosingStock = 9,
        DeviceAlerts = 10,
        UserActivity = 11,
        SystemError = 12,
        System = 13,
        IssueTracker = 14,

        /// <summary>
        /// Reconciliation related notifications
        /// </summary>
        Reconciliation = 15,
        PtsDeviceAlarm = 16,
        PtsTankAlarm = 17,
        DiscrepancyDetected = 18,
        TagMonitoring = 19,
        Generic = 20
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