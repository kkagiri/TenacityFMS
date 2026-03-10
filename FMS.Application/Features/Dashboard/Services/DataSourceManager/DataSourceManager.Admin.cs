/**
 * File: DataSourceManager.Admin.cs
 * Purpose: Provides admin-focused dashboard data sources for active users, PTS service health, notifications, validation, and provider health.
 * Dependencies: GpsdataContext, ConnectionMonitor, IServiceControlService, IVehicleTrackingService
 * Last Modified: 2026-03-09
 *
 * Key Functions:
 * - GetAdminDataAsync(): Routes admin dashboard sources to the correct builder.
 * - BuildCurrentLoggedInUsersAsync(): Produces active user/session and recent login data.
 * - BuildNotificationPerformanceAsync(): Produces daily sent/delivered/failed notification series.
 * - BuildLocationValidationOutcomesAsync(): Produces daily passed/failed validation series.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Reflection;
using System.Threading.Tasks;
using FMS.Application.Features.Dashboard;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Services.Dashboard
{
    public partial class DataSourceManager
    {
        private const string CurrentLoggedInUsersDataSource = "current_logged_in_users";
        private const string PtsWindowsServiceStatusDataSource = "pts_windows_service_status";
        private const string NotificationPerformanceAllUsersDataSource = "notification_performance_all_users";
        private const string LocationValidationOutcomesDataSource = "location_validation_outcomes";
        private const string ProviderHealthStatusDataSource = "provider_health_status";
        private const string DefaultPtsWindowsServiceName = "FMS.PTS.Service";

        private static readonly string[] AdminDataSourceKeys =
        {
            CurrentLoggedInUsersDataSource,
            PtsWindowsServiceStatusDataSource,
            NotificationPerformanceAllUsersDataSource,
            LocationValidationOutcomesDataSource,
            ProviderHealthStatusDataSource
        };

        private bool IsAdminDataSource(string canonicalSource)
        {
            return AdminDataSourceKeys.Contains(canonicalSource, StringComparer.OrdinalIgnoreCase);
        }

        private async Task<object> GetAdminDataAsync(
            string canonicalSource,
            DashboardMetricRequestDto request,
            string accessMode,
            string aggregationInterval = "daily")
        {
            return canonicalSource switch
            {
                CurrentLoggedInUsersDataSource => await BuildCurrentLoggedInUsersAsync(request),
                PtsWindowsServiceStatusDataSource => await BuildPtsWindowsServiceStatusAsync(),
                NotificationPerformanceAllUsersDataSource => await BuildNotificationPerformanceAsync(request),
                LocationValidationOutcomesDataSource => await BuildLocationValidationOutcomesAsync(request),
                ProviderHealthStatusDataSource => await BuildProviderHealthStatusAsync(),
                _ => new { error = $"Unsupported admin data source: {canonicalSource}", timestamp = DateTime.UtcNow }
            };
        }

        private async Task<object> BuildCurrentLoggedInUsersAsync(DashboardMetricRequestDto request)
        {
            var activeConnections = _connectionMonitor.GetConnectionCount();
            var (start, end) = ResolveRequestDateRange(request);
            var recentWindowStart = DateTime.UtcNow.AddDays(-1);

            var recentLogins = await (
                from login in _context.Loginactivities.AsNoTracking()
                join user in _context.Users.AsNoTracking() on login.UserId equals user.Id into userJoin
                from user in userJoin.DefaultIfEmpty()
                where login.IsSuccessful && login.Timestamp >= recentWindowStart
                orderby login.Timestamp descending
                select new
                {
                    login.UserId,
                    UserName = user != null
                        ? (user.UserName ?? user.Email ?? login.UserId)
                        : login.UserId,
                    login.Timestamp,
                    login.IpAddress
                })
                .Take(10)
                .ToListAsync();

            var recentDistinctUsers = await _context.Loginactivities
                .AsNoTracking()
                .Where(login => login.IsSuccessful && login.Timestamp >= start && login.Timestamp <= end)
                .Select(login => login.UserId)
                .Distinct()
                .CountAsync();

            var rows = recentLogins.Select((login, index) => new
            {
                id = $"login-{index + 1}",
                userId = login.UserId,
                userName = login.UserName,
                lastLoginAt = login.Timestamp,
                ipAddress = login.IpAddress,
                status = "recent"
            }).Cast<object>().ToList();

            return new
            {
                current = new
                {
                    value = activeConnections,
                    unit = "users",
                    timestamp = DateTime.UtcNow,
                    label = "Currently Logged In Users"
                },
                summary = new
                {
                    activeConnections,
                    recentDistinctUsers,
                    recentLoginCount = recentLogins.Count,
                    measurement = "frontend_connections"
                },
                items = rows,
                rows,
                metadata = GetDataSourceMetadata(CurrentLoggedInUsersDataSource)
            };
        }

        private async Task<object> BuildPtsWindowsServiceStatusAsync()
        {
            var serviceStatus = await _serviceControlService.GetServiceStatusAsync(DefaultPtsWindowsServiceName);
            var isRunning = string.Equals(serviceStatus.Status, "Running", StringComparison.OrdinalIgnoreCase);
            var uptime = isRunning && serviceStatus.LastStartTime.HasValue
                ? DateTime.Now - serviceStatus.LastStartTime.Value
                : TimeSpan.Zero;

            var rows = new List<object>
            {
                new
                {
                    id = serviceStatus.ServiceName,
                    serviceName = serviceStatus.ServiceName,
                    displayName = serviceStatus.DisplayName,
                    status = serviceStatus.Status,
                    startType = serviceStatus.StartType,
                    lastStartTime = serviceStatus.LastStartTime,
                    uptimeHours = Math.Round(uptime.TotalHours, 2),
                    processId = serviceStatus.ProcessId,
                    memoryUsageMB = serviceStatus.MemoryUsageMB,
                    lastStatusCheck = serviceStatus.LastStatusCheck
                }
            };

            return new
            {
                current = new
                {
                    value = Math.Round((decimal)uptime.TotalHours, 2),
                    unit = "hours",
                    timestamp = DateTime.UtcNow,
                    label = isRunning ? "PTS Service Uptime" : "PTS Service Offline"
                },
                summary = new
                {
                    isRunning,
                    status = serviceStatus.Status,
                    displayName = serviceStatus.DisplayName,
                    lastStartTime = serviceStatus.LastStartTime,
                    uptimeHours = Math.Round(uptime.TotalHours, 2),
                    processId = serviceStatus.ProcessId,
                    memoryUsageMB = serviceStatus.MemoryUsageMB
                },
                items = rows,
                rows,
                metadata = GetDataSourceMetadata(PtsWindowsServiceStatusDataSource)
            };
        }

        private async Task<object> BuildNotificationPerformanceAsync(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);

            var notificationsQuery = _context.Notifications
                .AsNoTracking()
                .Where(notification => notification.CreatedAt >= start && notification.CreatedAt <= end);

            if (request.SiteIds != null && request.SiteIds.Any())
            {
                notificationsQuery = notificationsQuery.Where(notification => notification.SiteId.HasValue && request.SiteIds.Contains(notification.SiteId.Value));
            }

            var dailyRows = await notificationsQuery
                .GroupBy(notification => new { notification.CreatedAt.Year, notification.CreatedAt.Month, notification.CreatedAt.Day })
                .Select(group => new
                {
                    Timestamp = new DateTime(group.Key.Year, group.Key.Month, group.Key.Day, 0, 0, 0),
                    Sent = group.Sum(notification => notification.Recipients.Count()),
                    Delivered = group.Sum(notification => notification.Recipients.Count(recipient => recipient.DeliveryStatus == "Delivered" || recipient.DeliveryStatus == "Sent")),
                    Failed = group.Sum(notification => notification.Recipients.Count(recipient => recipient.DeliveryStatus == "Failed"))
                })
                .OrderBy(row => row.Timestamp)
                .ToListAsync();

            var totalSent = dailyRows.Sum(row => row.Sent);
            var totalDelivered = dailyRows.Sum(row => row.Delivered);
            var totalFailed = dailyRows.Sum(row => row.Failed);

            var rows = dailyRows.Select(row => new
            {
                argument = row.Timestamp,
                sent = row.Sent,
                delivered = row.Delivered,
                failed = row.Failed
            }).Cast<object>().ToList();

            return new
            {
                current = new
                {
                    value = totalSent,
                    unit = "notifications",
                    timestamp = DateTime.UtcNow,
                    label = "Notification Performance"
                },
                categories = new List<object>
                {
                    new { key = "Sent", value = totalSent },
                    new { key = "Delivered", value = totalDelivered },
                    new { key = "Failed", value = totalFailed }
                },
                summary = new
                {
                    totalSent,
                    totalDelivered,
                    totalFailed,
                    successRate = totalSent > 0 ? Math.Round((decimal)totalDelivered / totalSent * 100m, 2) : 0m
                },
                series = rows,
                rows,
                metadata = GetDataSourceMetadata(NotificationPerformanceAllUsersDataSource)
            };
        }

        private async Task<object> BuildLocationValidationOutcomesAsync(DashboardMetricRequestDto request)
        {
            var (start, end) = ResolveRequestDateRange(request);

            var query = _context.LocationValidationLogs
                .AsNoTracking()
                .Where(log => log.ValidationTime >= start && log.ValidationTime <= end);

            if (request.VehicleIds != null && request.VehicleIds.Any())
            {
                query = query.Where(log => log.VehicleId.HasValue && request.VehicleIds.Contains(log.VehicleId.Value));
            }

            if (request.TankIds != null && request.TankIds.Any())
            {
                query = query.Where(log => request.TankIds.Contains(log.TankId));
            }

            var dailyRows = await query
                .GroupBy(log => new { log.ValidationTime.Year, log.ValidationTime.Month, log.ValidationTime.Day })
                .Select(group => new
                {
                    Timestamp = new DateTime(group.Key.Year, group.Key.Month, group.Key.Day, 0, 0, 0),
                    Passed = group.Count(log => log.IsValid),
                    Failed = group.Count(log => !log.IsValid),
                    Bypassed = group.Count(log => log.WasBypassedDueToGPSFailure)
                })
                .OrderBy(row => row.Timestamp)
                .ToListAsync();

            var totalPassed = dailyRows.Sum(row => row.Passed);
            var totalFailed = dailyRows.Sum(row => row.Failed);
            var totalBypassed = dailyRows.Sum(row => row.Bypassed);

            var rows = dailyRows.Select(row => new
            {
                argument = row.Timestamp,
                passed = row.Passed,
                failed = row.Failed,
                bypassed = row.Bypassed
            }).Cast<object>().ToList();

            return new
            {
                current = new
                {
                    value = totalPassed + totalFailed,
                    unit = "validations",
                    timestamp = DateTime.UtcNow,
                    label = "Location Validation Outcomes"
                },
                categories = new List<object>
                {
                    new { key = "Passed", value = totalPassed },
                    new { key = "Failed", value = totalFailed },
                    new { key = "Bypassed", value = totalBypassed }
                },
                summary = new
                {
                    totalPassed,
                    totalFailed,
                    totalBypassed,
                    passRate = (totalPassed + totalFailed) > 0 ? Math.Round((decimal)totalPassed / (totalPassed + totalFailed) * 100m, 2) : 0m
                },
                series = rows,
                rows,
                metadata = GetDataSourceMetadata(LocationValidationOutcomesDataSource)
            };
        }

        private async Task<object> BuildProviderHealthStatusAsync()
        {
            object? vehicleTrackingService = ResolveVehicleTrackingService();
            if (vehicleTrackingService == null)
            {
                _logger.LogWarning("Vehicle tracking service is not available for provider health dashboard data.");

                return new
                {
                    error = "Vehicle tracking service is not available",
                    timestamp = DateTime.UtcNow,
                    metadata = GetDataSourceMetadata(ProviderHealthStatusDataSource)
                };
            }

            Dictionary<string, object?> healthStatuses = await InvokeDictionaryResultAsync(
                vehicleTrackingService,
                "GetProvidersHealthAsync");

            object? providerStatistics = await InvokeResultAsync(
                vehicleTrackingService,
                "GetProviderStatisticsAsync");

            var providers = healthStatuses
                .OrderBy(entry => entry.Key)
                .Select(entry =>
                {
                    object? stats = TryGetDictionaryEntry(
                        GetPropertyValue(providerStatistics, "ProviderStats"),
                        entry.Key);

                    long requestCount = GetInt64Property(stats, "RequestCount");
                    long successCount = GetInt64Property(stats, "SuccessCount");
                    long failureCount = GetInt64Property(stats, "FailureCount");
                    decimal entrySuccessRate = GetDecimalProperty(entry.Value, "SuccessRate");

                    var successRate = requestCount > 0
                        ? Math.Round((decimal)successCount / requestCount * 100m, 2)
                        : entrySuccessRate;

                    string status = GetPropertyValue(entry.Value, "Status")?.ToString() ?? "Unknown";

                    return new
                    {
                        id = entry.Key,
                        providerName = entry.Key,
                        status,
                        isHealthy = string.Equals(status, "Healthy", StringComparison.OrdinalIgnoreCase),
                        isAvailable = GetBoolProperty(entry.Value, "IsAvailable"),
                        responseTimeMs = GetNullableDoubleProperty(entry.Value, "ResponseTimeMs"),
                        successRate,
                        requestCount,
                        failureCount,
                        uptimePercentage = GetDecimalProperty(entry.Value, "UptimePercentage"),
                        checkedAt = GetDateTimeProperty(entry.Value, "CheckedAt"),
                        message = GetPropertyValue(entry.Value, "Message")?.ToString()
                    };
                })
                .Cast<object>()
                .ToList();

            var healthyCount = healthStatuses.Count(entry => string.Equals(GetPropertyValue(entry.Value, "Status")?.ToString(), "Healthy", StringComparison.OrdinalIgnoreCase));
            var degradedCount = healthStatuses.Count(entry => string.Equals(GetPropertyValue(entry.Value, "Status")?.ToString(), "Degraded", StringComparison.OrdinalIgnoreCase));
            var unhealthyCount = healthStatuses.Count(entry =>
            {
                string status = GetPropertyValue(entry.Value, "Status")?.ToString() ?? "Unknown";
                return string.Equals(status, "Unhealthy", StringComparison.OrdinalIgnoreCase)
                    || string.Equals(status, "Unknown", StringComparison.OrdinalIgnoreCase);
            });

            return new
            {
                current = new
                {
                    value = healthyCount,
                    unit = "providers",
                    timestamp = DateTime.UtcNow,
                    label = "Healthy Providers"
                },
                categories = new List<object>
                {
                    new { key = "Healthy", value = healthyCount },
                    new { key = "Degraded", value = degradedCount },
                    new { key = "Unhealthy", value = unhealthyCount }
                },
                summary = new
                {
                    totalProviders = healthStatuses.Count,
                    healthyCount,
                    degradedCount,
                    unhealthyCount,
                    totalRequests = GetInt64Property(providerStatistics, "TotalRequests"),
                    averageResponseTimeMs = Math.Round(GetDecimalProperty(providerStatistics, "AverageResponseTimeMs"), 2)
                },
                items = providers,
                rows = providers,
                metadata = GetDataSourceMetadata(ProviderHealthStatusDataSource)
            };
        }

        private object? ResolveVehicleTrackingService()
        {
            Type? serviceType = Type.GetType(
                "FMS.Infrastructure.VehicleTracking.Services.IVehicleTrackingService, FMS.Infrastructure",
                throwOnError: false);

            return serviceType == null ? null : _serviceProvider.GetService(serviceType);
        }

        private static async Task<object?> InvokeResultAsync(object target, string methodName)
        {
            MethodInfo? method = target.GetType().GetMethod(methodName, BindingFlags.Public | BindingFlags.Instance);
            if (method == null)
            {
                return null;
            }

            if (method.Invoke(target, null) is not Task task)
            {
                return null;
            }

            await task.ConfigureAwait(false);

            PropertyInfo? resultProperty = task.GetType().GetProperty("Result", BindingFlags.Public | BindingFlags.Instance);
            return resultProperty?.GetValue(task);
        }

        private static async Task<Dictionary<string, object?>> InvokeDictionaryResultAsync(object target, string methodName)
        {
            object? result = await InvokeResultAsync(target, methodName).ConfigureAwait(false);
            if (result is System.Collections.IDictionary dictionary)
            {
                var values = new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);

                foreach (System.Collections.DictionaryEntry entry in dictionary)
                {
                    string key = entry.Key?.ToString() ?? string.Empty;
                    if (!string.IsNullOrWhiteSpace(key))
                    {
                        values[key] = entry.Value;
                    }
                }

                return values;
            }

            return new Dictionary<string, object?>(StringComparer.OrdinalIgnoreCase);
        }

        private static object? GetPropertyValue(object? target, string propertyName)
        {
            if (target == null)
            {
                return null;
            }

            PropertyInfo? property = target.GetType().GetProperty(propertyName, BindingFlags.Public | BindingFlags.Instance);
            return property?.GetValue(target);
        }

        private static object? TryGetDictionaryEntry(object? dictionaryObject, string key)
        {
            if (dictionaryObject is not System.Collections.IDictionary dictionary)
            {
                return null;
            }

            return dictionary.Contains(key) ? dictionary[key] : null;
        }

        private static long GetInt64Property(object? target, string propertyName)
        {
            object? value = GetPropertyValue(target, propertyName);
            return value == null ? 0L : Convert.ToInt64(value);
        }

        private static decimal GetDecimalProperty(object? target, string propertyName)
        {
            object? value = GetPropertyValue(target, propertyName);
            return value == null ? 0m : Convert.ToDecimal(value);
        }

        private static bool GetBoolProperty(object? target, string propertyName)
        {
            object? value = GetPropertyValue(target, propertyName);
            return value != null && Convert.ToBoolean(value);
        }

        private static double? GetNullableDoubleProperty(object? target, string propertyName)
        {
            object? value = GetPropertyValue(target, propertyName);
            return value == null ? null : Convert.ToDouble(value);
        }

        private static DateTime? GetDateTimeProperty(object? target, string propertyName)
        {
            object? value = GetPropertyValue(target, propertyName);
            return value == null ? null : Convert.ToDateTime(value);
        }
    }
}
