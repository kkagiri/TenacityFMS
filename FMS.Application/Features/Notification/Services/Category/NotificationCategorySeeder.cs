using System;
using System.Linq;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.Notification.Services {
    /// <summary>
    /// Service for seeding notification categories into the database
    /// </summary>
    public static class NotificationCategorySeeder {
        /// <summary>
        /// Seeds predefined notification categories into the database
        /// </summary>
        /// <param name="context">The database context</param>
        public static async Task SeedCategoriesAsync (GpsdataContext context) {
            var categories = new [] {
                new { Name = "SensorVariance", Description = "Sensor variance notifications", Priority = "Medium" },
                new { Name = "TankVariance", Description = "Tank variance notifications", Priority = "Medium" },
                new { Name = "OpeningStock", Description = "Opening stock notifications", Priority = "Low" },
                new { Name = "StockReconciliation", Description = "Stock reconciliation notifications", Priority = "High" },
                new { Name = "SystemMaintenance", Description = "System maintenance notifications", Priority = "Low" },
                new { Name = "SecurityAlerts", Description = "Security alert notifications", Priority = "Critical" },
                new { Name = "DeliveryAlerts", Description = "Delivery alert notifications", Priority = "Medium" },
                new { Name = "InventoryAlerts", Description = "Inventory alert notifications", Priority = "Medium" },
                new { Name = "ClosingStock", Description = "Closing stock notifications", Priority = "Low" },
                new { Name = "DeviceAlerts", Description = "Device alert notifications", Priority = "High" },
                new { Name = "UserActivity", Description = "User activity notifications", Priority = "Low" },
                new { Name = "SystemError", Description = "System error notifications", Priority = "Critical" },
                new { Name = "System", Description = "General system notifications", Priority = "Medium" },
                new { Name = "IssueTracker", Description = "Issue tracker notifications", Priority = "Medium" },
                new { Name = "Reconciliation", Description = "Reconciliation related notifications", Priority = "High" },
                new { Name = "PtsDeviceAlarm", Description = "PTS device alarm notifications", Priority = "High" },
                new { Name = "PtsTankAlarm", Description = "PTS tank alarm notifications", Priority = "High" },
                new { Name = "DiscrepancyDetected", Description = "Discrepancy detected notifications", Priority = "High" },
                new { Name = "TagMonitoring", Description = "Tag monitoring notifications", Priority = "Medium" },
                new { Name = "Generic", Description = "Generic notifications", Priority = "Medium" }
            };

            for (int i = 0; i < categories.Length; i++) {
                var categoryData = categories[i];

                if (!await context.NotificationCategories.AnyAsync (c => c.Name == categoryData.Name)) {
                    context.NotificationCategories.Add (new NotificationCategory {
                        Name = categoryData.Name,
                            Description = categoryData.Description,
                            DefaultPriority = categoryData.Priority,
                            IsActive = true,
                            DisplayOrder = i,
                            DefaultDeliveryMethods = "System",
                            CreatedBy = "System",
                            CreatedAt = DateTime.UtcNow
                    });
                }
            }

            await context.SaveChangesAsync ();
        }
    }
}