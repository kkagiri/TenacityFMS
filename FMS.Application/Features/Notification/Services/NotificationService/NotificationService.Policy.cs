/**
 * File: NotificationService.Policy.cs
 * Purpose: Notification policy CRUD, statistics, alert records, test notifications,
 *          and shared helper/utility methods (category display names, recipient address
 *          resolution, template formatting, policy limits).
 * Dependencies: GpsdataContext, ILogger, IMapper, ISystemUserService, ICategoryMetadataProvider
 * Last Modified: 2026-04-16
 *
 * Key Functions:
 * - GetNotificationStatisticsAsync(): Dashboard statistics for a user
 * - CreateNotificationPolicyAsync(): Creates a new notification policy
 * - UpdateNotificationPolicyAsync(): Updates an existing notification policy
 * - GetNotificationPoliciesAsync(): Lists all notification policies
 * - SendTestNotificationAsync(): Sends a test notification
 * - GetCategoryDisplayName(): Resolves category display names
 * - CheckPolicyLimitsAsync(): Enforces hourly/daily rate limits
 * - FormatTemplate(): Simple property-based template substitution
 * - GetDefaultEmailTemplate(): Returns the default HTML email template
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Common.Constants;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.DTOs.NotificationRecipient;
using FMS.Application.Features.Notification.Services.AlertConfiguration;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.Notifications;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json.Linq;
using Noti = FMS.Domain.Entities.Features.Notifications;

namespace FMS.Application.Features.Notification.Services
{
    public partial class NotificationService
    {
        /// <summary>
        /// Returns a human-friendly category name from an int categoryId.
        /// </summary>
        private string GetCategoryDisplayName(int categoryId)
        {
            if (categoryId <= 0) return "Unknown";

            if (Enum.IsDefined(typeof(Notification.Enums.WellKnownCategories), categoryId))
            {
                var enumValue = (Notification.Enums.WellKnownCategories)categoryId;
                try
                {
                    return _categoryMetadata.Get(enumValue).Name;
                }
                catch
                {
                    return enumValue.ToString();
                }
            }

            return categoryId.ToString();
        }

        /// <summary>
        /// Backward-compatible helper that accepts a string and delegates to the int overload when possible.
        /// </summary>
        private string GetCategoryDisplayName(string categoryId)
        {
            if (string.IsNullOrWhiteSpace(categoryId)) return "Unknown";
            return int.TryParse(categoryId, out var id) ?
                GetCategoryDisplayName(id) :
                categoryId;
        }

        private string? GetRecipientAddress(User user, string deliveryMethod)
        {
            return deliveryMethod.ToLower() switch
            {
                "email" => user.Email,
                "sms" => user.PhoneNumber,
                "system" => user.Id,
                _ => user.Id // Pass user id for dynamic channels to resolve mapping internally
            };
        }

        private async Task<FMSResponse> CheckPolicyLimitsAsync(NotificationPolicy policy, CancellationToken cancellationToken)
        {
            try
            {
                var now = DateTime.UtcNow;

                // Check hourly limit
                if (policy.MaxNotificationsPerHour > 0)
                {
                    var hourAgo = now.AddHours(-1);
                    var hourlyCount = await _context.Notifications
                        .CountAsync(n => n.NotificationPolicyId == policy.Id && n.CreatedAt >= hourAgo, cancellationToken);

                    if (hourlyCount >= policy.MaxNotificationsPerHour)
                        return FMSResponse.FailedResponse($"Hourly notification limit ({policy.MaxNotificationsPerHour}) exceeded for policy {policy.Name}");
                }

                // Check daily limit
                if (policy.MaxNotificationsPerDay > 0)
                {
                    var dayAgo = now.AddDays(-1);
                    var dailyCount = await _context.Notifications
                        .CountAsync(n => n.NotificationPolicyId == policy.Id && n.CreatedAt >= dayAgo, cancellationToken);

                    if (dailyCount >= policy.MaxNotificationsPerDay)
                        return FMSResponse.FailedResponse($"Daily notification limit ({policy.MaxNotificationsPerDay}) exceeded for policy {policy.Name}");
                }

                return FMSResponse.SuccessResponse();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking policy limits for policy {PolicyId}", policy.Id);
                return FMSResponse.FailedResponse("Error checking policy limits");
            }
        }

        private string FormatTemplate(string template, object data)
        {
            if (string.IsNullOrEmpty(template) || data == null)
                return template;

            var result = template;
            var properties = data.GetType().GetProperties();

            foreach (var prop in properties)
            {
                var value = prop.GetValue(data)?.ToString() ?? "";
                result = result.Replace($"{{{prop.Name}}}", value);
            }

            return result;
        }

        private string GetDefaultEmailTemplate()
        {
            return @"
                <!DOCTYPE html>
                <html lang=""en"">
                <head>
                    <meta charset=""UTF-8"" />
                    <meta name=""viewport"" content=""width=device-width, initial-scale=1.0"" />
                    <title>{Title}</title>
                </head>
                <body style=""margin:0;padding:0;background:#f1f5f9;font-family:Segoe UI,Arial,sans-serif;color:#111827;"">
                    <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""background:#f1f5f9;"">
                        <tr>
                            <td align=""center"" style=""padding:24px 12px;"">
                                <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""max-width:680px;background:#ffffff;border-radius:12px;overflow:hidden;border:1px solid #e2e8f0;"">
                                    <tr>
                                        <td style=""padding:16px 22px;background:#0f172a;color:#ffffff;"">
                                            <div style=""font-size:18px;font-weight:700;line-height:1.2;"">Tenacy FMS</div>
                                            <div style=""font-size:12px;opacity:0.85;margin-top:2px;"">Fleet Management Notification</div>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding:22px;"">
                                            <h2 style=""margin:0 0 14px;font-size:22px;line-height:1.35;color:#111827;"">{Title}</h2>
                                            <div style=""padding:14px;border:1px solid #e2e8f0;border-radius:8px;background:#f8fafc;color:#334155;font-size:14px;line-height:1.6;"">
                                                {Message}
                                            </div>

                                            <table role=""presentation"" cellpadding=""0"" cellspacing=""0"" width=""100%"" style=""margin-top:16px;font-size:13px;color:#334155;"">
                                                <tr>
                                                    <td style=""padding:6px 0;width:110px;color:#64748b;"">Priority</td>
                                                    <td style=""padding:6px 0;font-weight:600;"">{Priority}</td>
                                                </tr>
                                                <tr>
                                                    <td style=""padding:6px 0;width:110px;color:#64748b;"">Category</td>
                                                    <td style=""padding:6px 0;font-weight:600;"">{Category}</td>
                                                </tr>
                                                <tr>
                                                    <td style=""padding:6px 0;width:110px;color:#64748b;"">Time</td>
                                                    <td style=""padding:6px 0;font-weight:600;"">{CreatedAt}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td style=""padding:14px 22px;background:#f8fafc;border-top:1px solid #e2e8f0;color:#64748b;font-size:12px;"">
                                            This is an automated message from Tenacy FMS. Please do not reply directly to this email.
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </body>
                </html>";
        }

        /// <summary>
        /// Ensures a notification category exists by name. Creates it with safe defaults if missing.
        /// Returns the category Id or 0 on failure.
        /// </summary>
        private async Task<int> EnsureCategoryExistsAsync(string categoryName, CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(categoryName)) return 0;

                var existingId = await _context.NotificationCategories
                    .Where(c => c.Name == categoryName)
                    .Select(c => c.Id)
                    .FirstOrDefaultAsync(cancellationToken);

                if (existingId != 0) return existingId;

                // Create with reasonable defaults
                var category = new NotificationCategory
                {
                    Name = categoryName,
                    Description = $"{categoryName} notifications",
                    DefaultPriority = "Medium",
                    IsActive = true,
                    DisplayOrder = 0,
                    DefaultDeliveryMethods = SystemConstants.Notifications.SystemDeliveryMethod,
                    CreatedBy = SystemConstants.Defaults.SystemTriggeredBy,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NotificationCategories.Add(category);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogWarning("Auto-created missing notification category '{CategoryName}' (Id {CategoryId})", categoryName, category.Id);
                return category.Id;
            }
            catch (DbUpdateException)
            {
                // Handle race condition where another thread created it
                var id = await _context.NotificationCategories
                    .Where(c => c.Name == categoryName)
                    .Select(c => c.Id)
                    .FirstOrDefaultAsync(cancellationToken);
                return id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to ensure notification category '{CategoryName}' exists", categoryName);
                return 0;
            }
        }

        /// <summary>
        /// Resolves a user identifier (could be user ID or username) to an actual user.Id for FK fields.
        /// Returns null if the value is null/empty or no matching user is found.
        /// </summary>
        private async Task<string?> ResolveUserIdAsync(string? userIdOrName, CancellationToken cancellationToken)
        {
            if (string.IsNullOrEmpty(userIdOrName))
                return null;

            var userId = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == userIdOrName || u.UserName == userIdOrName)
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return userId;
        }

        /// <summary>
        /// Resolves a valid system user ID from the database for auto-created issue FK fields.
        /// </summary>
        private async Task<string> ResolveSystemUserIdForIssueAsync(CancellationToken cancellationToken)
        {
            var systemUserId = await _context.Users
                .AsNoTracking()
                .Where(u => u.Id == SystemConstants.SystemUser.UserId
                         || u.UserName == SystemConstants.SystemUser.UserName
                         || u.UserName == "admin")
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (!string.IsNullOrEmpty(systemUserId))
                return systemUserId;

            // Fallback: use the first user in the database
            var fallbackId = await _context.Users
                .AsNoTracking()
                .Select(u => u.Id)
                .FirstOrDefaultAsync(cancellationToken);

            return fallbackId ?? throw new InvalidOperationException("No users found in database for auto-issue creation.");
        }

        // Implement remaining interface methods...
        public async Task<FMSResponse<NotificationStatisticsDto>> GetNotificationStatisticsAsync(GetNotificationStatisticsRequest request, CancellationToken cancellationToken = default)
        {
            try
            {
                // Input validation
                if (request == null)
                    return FMSResponse<NotificationStatisticsDto>.Failed("Request cannot be null");

                if (string.IsNullOrEmpty(request.UserId))
                    return FMSResponse<NotificationStatisticsDto>.Failed("User ID is required");
                var fromDate = request.FromDate ?? DateTime.UtcNow.AddDays(-30);
                var toDate = request.ToDate ?? DateTime.UtcNow;

                if (fromDate > toDate)
                    return FMSResponse<NotificationStatisticsDto>.Failed("From date cannot be greater than to date");

                var userNotificationsQuery = _context.Notifications
                    .Include(n => n.Recipients)
                    .Where(n => n.Recipients.Any(r => r.UserId == request.UserId))
                    .Where(n => n.CreatedAt >= fromDate && n.CreatedAt <= toDate);

                // Get total counts
                var totalNotifications = await userNotificationsQuery.CountAsync(cancellationToken);
                var unreadNotifications = await userNotificationsQuery
                    .Where(n => n.Recipients.Any(r => r.UserId == request.UserId && !r.IsRead))
                    .CountAsync(cancellationToken);
                var readNotifications = totalNotifications - unreadNotifications;

                // Get count by priority
                var priorityCounts = await userNotificationsQuery
                    .GroupBy(n => n.Priority)
                    .Select(g => new { Priority = g.Key, Count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Get count by category
                var categoryCounts = await userNotificationsQuery
                    .GroupBy(n => n.Category)
                    .Select(g => new { Category = g.Key, Count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Get count by type
                var typeCounts = await userNotificationsQuery
                    .GroupBy(n => n.Type)
                    .Select(g => new { Type = g.Key, Count = g.Count() })
                    .ToListAsync(cancellationToken);

                // Get daily statistics - Simplified query to avoid EF Core translation issues
                // First, get the raw data with notification IDs and dates
                var notificationsForStats = await _context.Notifications
                    .Where(n => n.Recipients.Any(r => r.UserId == request.UserId))
                    .Where(n => n.CreatedAt >= fromDate && n.CreatedAt <= toDate)
                    .Select(n => new
                    {
                        n.Id,
                        n.CreatedAt,
                        IsRead = n.Recipients.Where(r => r.UserId == request.UserId).Select(r => r.IsRead).FirstOrDefault()
                    })
                    .ToListAsync(cancellationToken);

                // Compute daily stats on the client side
                var dailyStats = notificationsForStats
                    .GroupBy(n => n.CreatedAt.Date)
                    .Select(g => new DailyNotificationStatDto
                    {
                        Date = g.Key,
                        DateString = g.Key.ToString("yyyy-MM-dd"),
                        Count = g.Count(),
                        ReadCount = g.Count(n => n.IsRead),
                        UnreadCount = g.Count(n => !n.IsRead)
                    })
                    .OrderBy(d => d.Date)
                    .ToList();

                // Get recent notifications
                var recentNotifications = await userNotificationsQuery
                    .Include(n => n.Site)
                    .Include(n => n.Tank)
                    .Include(n => n.Vehicle)
                    .Include(n => n.PtsDevice) //Cursor: Include PTS device information
                    .OrderByDescending(n => n.CreatedAt)
                    .Take(request.RecentCount ?? 10)
                    .Select(n => new RecentNotificationDto
                    {
                        Id = n.Id,
                        NotificationId = n.NotificationId,
                        Type = n.Type,
                        Category = n.Category,
                        Priority = n.Priority,
                        Title = n.Title,
                        Message = n.Message,
                        CreatedAt = n.CreatedAt,
                        Status = n.Status,
                        SiteName = n.Site != null ? n.Site.Name : null,
                        TankName = n.Tank != null ? $"Tank {n.Tank.Name}" : null,
                        VehicleName = n.Vehicle != null ? n.Vehicle.VehicleCode : null,
                        PtsDeviceName = n.PtsDevice != null ? n.PtsDevice.Ptsid : null, //Cursor: Add PTS device name
                        IsRead = n.Recipients.Any(r => r.UserId == request.UserId) &&
                            n.Recipients.First(r => r.UserId == request.UserId).IsRead
                    })
                    .ToListAsync(cancellationToken);

                var statistics = new NotificationStatisticsDto
                {
                    TotalNotifications = totalNotifications,
                    ReadNotifications = readNotifications,
                    UnreadNotifications = unreadNotifications,
                    PriorityBreakdown = priorityCounts.ToDictionary(p => p.Priority, p => p.Count),
                    CategoryBreakdown = categoryCounts.ToDictionary(c => c.Category, c => c.Count),
                    TypeBreakdown = typeCounts.ToDictionary(t => t.Type, t => t.Count),
                    DailyStatistics = dailyStats,
                    RecentNotifications = recentNotifications,
                    FromDate = fromDate,
                    ToDate = toDate,
                    GeneratedAt = DateTime.UtcNow
                };

                return FMSResponse<NotificationStatisticsDto>.Success(statistics,
                    $"Retrieved notification statistics successfully. Total: {totalNotifications}, Unread: {unreadNotifications}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting notification statistics for user {UserId}: {Message}",
                    request.UserId, ex.Message);

                return FMSResponse<NotificationStatisticsDto>.Failed($"Error getting notification statistics: {ex.Message}");
            }
        }

        public async Task<FMSResponse<List<NotificationPolicyDto>>> GetNotificationPoliciesAsync(CancellationToken cancellationToken = default)
        {
            try
            {
                var policies = await _context.NotificationPolicies
                    .Include(p => p.NotificationCategory)
                    .Include(p => p.PolicyRecipients)
                    .Include(p => p.PolicyGroups)
                    .Include(p => p.CreatedByNavigation)
                    .Include(p => p.ModifiedByNavigation)
                    .AsNoTracking()
                    .ToListAsync(cancellationToken);

                var dtoList = _mapper.Map<List<NotificationPolicyDto>>(policies);
                foreach (var dto in dtoList)
                {
                    EnrichPolicyDtoWithAlertTypeInfo(dto, policies.FirstOrDefault(p => p.Id == dto.Id)?.TriggerConditions);
                }
                return FMSResponse<List<NotificationPolicyDto>>.Success(dtoList, "Notification policies retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification policies");
                return FMSResponse<List<NotificationPolicyDto>>.Failed("Error retrieving notification policies");
            }
        }

        public async Task<FMSResponse<NotificationPolicyDto>> GetNotificationPolicyAsync(int policyId, CancellationToken cancellationToken = default)
        {
            try
            {
                var policy = await _context.NotificationPolicies
                    .Include(p => p.NotificationCategory)
                    .Include(p => p.PolicyRecipients)
                    .Include(p => p.PolicyGroups)
                    .Include(p => p.CreatedByNavigation)
                    .Include(p => p.ModifiedByNavigation)
                    .AsNoTracking()
                    .FirstOrDefaultAsync(p => p.Id == policyId, cancellationToken);

                if (policy == null)
                {
                    return FMSResponse<NotificationPolicyDto>.Failed($"Policy {policyId} not found");
                }

                var dto = _mapper.Map<NotificationPolicyDto>(policy);
                EnrichPolicyDtoWithAlertTypeInfo(dto, policy.TriggerConditions);
                return FMSResponse<NotificationPolicyDto>.Success(dto, "Notification policy retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving notification policy {PolicyId}", policyId);
                return FMSResponse<NotificationPolicyDto>.Failed("Error retrieving notification policy");
            }
        }

        public async Task<FMSResponse<int>> CreateNotificationPolicyAsync(CreateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default)
        {
            try
            {
                //Cursor: Validation
                var validationErrors = new List<string>();

                if (string.IsNullOrWhiteSpace(request.Name))
                    validationErrors.Add("Policy name is required");

                // AlertTypeKey-based flow: derive category from alert type
                string? alertTypeKey = request.AlertTypeKey;
                if (!string.IsNullOrWhiteSpace(alertTypeKey))
                {
                    if (!AlertConfigurationConstants.IsValidAlertType(alertTypeKey))
                        validationErrors.Add($"Invalid alert type key: {alertTypeKey}");
                }
                else if (request.NotificationCategoryId <= 0)
                {
                    validationErrors.Add("Either AlertTypeKey or Category is required");
                }

                if (!string.IsNullOrWhiteSpace(request.ActiveAlarmFilter))
                {
                    try
                    {
                        JObject.Parse(request.ActiveAlarmFilter);
                    }
                    catch
                    {
                        validationErrors.Add("ActiveAlarmFilter must be a valid JSON object");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<int>.ValidationFailed(validationErrors);
                }

                // Auto-build ActiveAlarmFilter from AlertTypeKey if not explicitly provided
                var activeAlarmFilter = request.ActiveAlarmFilter;
                if (!string.IsNullOrWhiteSpace(alertTypeKey) && string.IsNullOrWhiteSpace(activeAlarmFilter))
                {
                    activeAlarmFilter = System.Text.Json.JsonSerializer.Serialize(new
                    {
                        source = "ActiveAlarm",
                        eventType = "Created",
                        alarmType = alertTypeKey
                    });
                }

                var policy = new NotificationPolicy
                {
                    Name = request.Name,
                    NotificationCategoryId = request.NotificationCategoryId > 0 ? request.NotificationCategoryId : 1,
                    NotificationType = request.NotificationType ?? "Alert",
                    Priority = request.Priority ?? "Medium",
                    EnableEmail = request.EnableEmail,
                    EnableSms = request.EnableSms,
                    EnableSystem = request.EnableSystem,
                    MaxNotificationsPerHour = request.MaxNotificationsPerHour ?? 10,
                    MaxNotificationsPerDay = request.MaxNotificationsPerDay ?? 50,
                    CooldownMinutes = request.CooldownMinutes ?? 30,
                    TitleTemplate = request.TitleTemplate,
                    MessageTemplate = request.MessageTemplate,
                    TriggerConditions = activeAlarmFilter,
                    RequireAcknowledgment = request.RequireAcknowledgment,
                    IsActive = true,
                    CreatedAt = DateTime.UtcNow,
                    CreatedBy = string.IsNullOrWhiteSpace(request.CreatedBy)
                        ? SystemConstants.Defaults.SystemTriggeredBy
                        : request.CreatedBy!
                };

                // Save RecipientRules JSON if provided
                if (!string.IsNullOrWhiteSpace(request.RecipientRules))
                {
                    policy.RecipientRules = request.RecipientRules;
                }

                _context.NotificationPolicies.Add(policy);
                await _context.SaveChangesAsync(cancellationToken);

                // Save static recipients to notification_policy_recipient table
                if (request.RecipientUserIds?.Any() == true)
                {
                    var createdBy = string.IsNullOrWhiteSpace(request.CreatedBy)
                        ? SystemConstants.Defaults.SystemTriggeredBy
                        : request.CreatedBy!;

                    // Build delivery methods string from policy channel flags
                    var deliveryMethods = BuildDeliveryMethodsFromPolicy(policy);

                    foreach (var userId in request.RecipientUserIds.Distinct())
                    {
                        if (string.IsNullOrWhiteSpace(userId)) continue;

                        _context.NotificationPolicyRecipients.Add(new NotificationPolicyRecipient
                        {
                            NotificationPolicyId = policy.Id,
                            UserId = userId,
                            DeliveryMethods = deliveryMethods,
                            IsActive = true,
                            CreatedAt = DateTime.UtcNow,
                            CreatedBy = createdBy
                        });
                    }
                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Saved {Count} static recipients for policy {PolicyId}",
                        request.RecipientUserIds.Count, policy.Id);
                }

                return FMSResponse<int>.Success(policy.Id, "Notification policy created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating notification policy");
                return FMSResponse<int>.Failed("Error creating notification policy");
            }
        }

        public async Task<FMSResponse> UpdateNotificationPolicyAsync(int policyId, UpdateNotificationPolicyRequestDTO request, CancellationToken cancellationToken = default)
        {
            try
            {
                if (request == null)
                {
                    return FMSResponse.FailedResponse("Request is required");
                }

                if (policyId <= 0)
                {
                    return FMSResponse.FailedResponse("Policy id is required");
                }

                var validationErrors = new List<string>();
                if (string.IsNullOrWhiteSpace(request.Name))
                {
                    validationErrors.Add("Policy name is required");
                }

                // Accept AlertTypeKey OR NotificationCategoryId (AlertTypeKey takes precedence)
                bool useAlertTypeKey = !string.IsNullOrWhiteSpace(request.AlertTypeKey);
                if (!useAlertTypeKey && request.NotificationCategoryId <= 0)
                {
                    validationErrors.Add("AlertTypeKey or Category is required");
                }

                if (useAlertTypeKey && !AlertConfigurationConstants.IsValidAlertType(request.AlertTypeKey!))
                {
                    validationErrors.Add($"Invalid alert type key: {request.AlertTypeKey}");
                }

                // Build or validate active alarm filter
                string activeAlarmFilter = request.ActiveAlarmFilter;
                if (useAlertTypeKey && string.IsNullOrWhiteSpace(activeAlarmFilter))
                {
                    var filterObj = new JObject
                    {
                        ["source"] = "ActiveAlarm",
                        ["eventType"] = "Created",
                        ["alarmType"] = request.AlertTypeKey
                    };
                    activeAlarmFilter = filterObj.ToString(Newtonsoft.Json.Formatting.None);
                }
                else if (!string.IsNullOrWhiteSpace(activeAlarmFilter))
                {
                    try
                    {
                        JObject.Parse(activeAlarmFilter);
                    }
                    catch
                    {
                        validationErrors.Add("ActiveAlarmFilter must be a valid JSON object");
                    }
                }

                if (validationErrors.Any())
                {
                    return FMSResponse.FailedResponse(string.Join("; ", validationErrors));
                }

                var policy = await _context.NotificationPolicies
                    .FirstOrDefaultAsync(p => p.Id == policyId, cancellationToken);

                if (policy == null)
                {
                    return FMSResponse.FailedResponse($"Policy {policyId} not found");
                }

                policy.Name = request.Name;
                policy.NotificationCategoryId = useAlertTypeKey ? 1 : request.NotificationCategoryId;
                policy.NotificationType = request.NotificationType ?? "Alert";
                policy.Priority = request.Priority ?? "Medium";
                policy.EnableEmail = request.EnableEmail;
                policy.EnableSms = request.EnableSms;
                policy.EnableSystem = request.EnableSystem;
                policy.MaxNotificationsPerHour = request.MaxNotificationsPerHour ?? 10;
                policy.MaxNotificationsPerDay = request.MaxNotificationsPerDay ?? 50;
                policy.CooldownMinutes = request.CooldownMinutes ?? 30;
                policy.TitleTemplate = request.TitleTemplate;
                policy.MessageTemplate = request.MessageTemplate;
                policy.RequireAcknowledgment = request.RequireAcknowledgment;
                policy.TriggerConditions = activeAlarmFilter;
                policy.IsActive = request.IsActive;
                policy.ModifiedAt = DateTime.UtcNow;
                policy.ModifiedBy = string.IsNullOrWhiteSpace(request.ModifiedBy)
                    ? (policy.ModifiedBy ?? SystemConstants.Defaults.SystemTriggeredBy)
                    : request.ModifiedBy;

                // Update RecipientRules JSON if provided
                if (request.RecipientRules != null)
                {
                    policy.RecipientRules = string.IsNullOrWhiteSpace(request.RecipientRules) ? null : request.RecipientRules;
                }

                await _context.SaveChangesAsync(cancellationToken);

                // Sync static recipients if the list was provided (null = leave unchanged)
                if (request.RecipientUserIds != null)
                {
                    // Remove all existing recipients for this policy
                    var existingRecipients = await _context.NotificationPolicyRecipients
                        .Where(r => r.NotificationPolicyId == policyId)
                        .ToListAsync(cancellationToken);
                    _context.NotificationPolicyRecipients.RemoveRange(existingRecipients);

                    // Add new recipients
                    if (request.RecipientUserIds.Any())
                    {
                        var modifiedBy = string.IsNullOrWhiteSpace(request.ModifiedBy)
                            ? (policy.CreatedBy ?? SystemConstants.Defaults.SystemTriggeredBy)
                            : request.ModifiedBy;

                        var deliveryMethods = BuildDeliveryMethodsFromPolicy(policy);

                        foreach (var userId in request.RecipientUserIds.Distinct())
                        {
                            if (string.IsNullOrWhiteSpace(userId)) continue;

                            _context.NotificationPolicyRecipients.Add(new NotificationPolicyRecipient
                            {
                                NotificationPolicyId = policyId,
                                UserId = userId,
                                DeliveryMethods = deliveryMethods,
                                IsActive = true,
                                CreatedAt = DateTime.UtcNow,
                                CreatedBy = modifiedBy
                            });
                        }
                    }

                    await _context.SaveChangesAsync(cancellationToken);
                    _logger.LogInformation("Synced {Count} static recipients for policy {PolicyId}",
                        request.RecipientUserIds.Count, policyId);
                }

                return FMSResponse.SuccessResponse("Notification policy updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating notification policy {PolicyId}", policyId);
                return FMSResponse.FailedResponse("Error updating notification policy");
            }
        }

        public async Task<FMSResponse<List<object>>> GetAlertRecordsAsync(DateTime? fromDate, DateTime? toDate, int skip, int take, CancellationToken cancellationToken = default)
        {
            // Implementation would go here - truncated for space
            try
            {
                var startDate = fromDate ?? DateTime.UtcNow.AddDays(-7);
                var endDate = toDate ?? DateTime.UtcNow;

                var alertRecords = await _context.PTSAlertRecords
                    .Where(ar => ar.DateTime >= startDate && ar.DateTime <= endDate)
                    .OrderByDescending(ar => ar.DateTime)
                    .Skip(skip)
                    .Take(take)
                    .Select(ar => new
                    {
                        ar.Id,
                        ar.PtsId,
                        ar.DeviceType,
                        ar.DeviceNumber,
                        ar.AlertCode,
                        ar.State,
                        ar.DateTime,
                        ar.ProcessedAt,
                        ar.ConfigurationId,
                        ar.AlarmId
                    })
                    .ToListAsync(cancellationToken);

                var result = alertRecords.Cast<object>().ToList();
                return FMSResponse<List<object>>.Success(result, "Alert records retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving alert records");
                return FMSResponse<List<object>>.Failed("Error retrieving alert records");
            }
        }

        public async Task<FMSResponse> SendTestNotificationAsync(TestNotificationRequest request, CancellationToken cancellationToken = default)
        {
            // Implementation would go here - truncated for space
            try
            {
                //Cursor: Get system user ID instead of hardcoded value
                var systemUserResult = await _systemUserService.GetSystemUserIdAsync(cancellationToken);
                if (!systemUserResult.IsSuccess)
                {
                    return FMSResponse.FailedResponse($"Failed to get system user: {systemUserResult.Message}");
                }

                var testUserId = systemUserResult.Data;

                var createRequest = new CreateNotificationRequest
                {
                    Type = Enums.NotificationType.Info,
                    CategoryId = (int)Enums.WellKnownCategories.System,
                    Priority = (int)Enums.NotificationPriority.Low,
                    Title = request.Title,
                    Message = request.Message,
                    TriggerSource = "TestNotification",
                    TriggeredBy = testUserId,
                    DisableFallbackAllUsers = true // ✅ Test notifications should be targeted, not broadcast
                };

                var result = await CreateNotificationAsync(createRequest, cancellationToken);

                if (result.IsSuccess)
                {
                    return FMSResponse.SuccessResponse("Test notification sent successfully");
                }

                return FMSResponse.FailedResponse($"Failed to send test notification: {result.Message}");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error sending test notification");
                return FMSResponse.FailedResponse("Error sending test notification");
            }
        }

        /// <summary>
        /// Enriches a NotificationPolicyDto with AlertTypeKey, AlertGroup, and AlertDisplayName
        /// by parsing the TriggerConditions JSON to extract the alarmType field.
        /// </summary>
        private void EnrichPolicyDtoWithAlertTypeInfo(NotificationPolicyDto dto, string? triggerConditions)
        {
            if (string.IsNullOrWhiteSpace(triggerConditions)) return;
            try
            {
                var filter = JObject.Parse(triggerConditions);
                var alarmType = filter.Value<string>("alarmType");
                if (string.IsNullOrWhiteSpace(alarmType)) return;

                dto.AlertTypeKey = alarmType;
                dto.AlertGroup = AlertConfigurationConstants.GetGroupForAlertType(alarmType);
                dto.AlertDisplayName = AlertConfigurationConstants.GetDisplayNameForAlertType(alarmType);
            }
            catch
            {
                // Non-standard JSON or missing field — leave fields null
            }
        }

        /// <summary>
        /// Builds a comma-separated delivery methods string from the policy's enabled channels.
        /// Used when creating NotificationPolicyRecipient rows.
        /// </summary>
        private static string BuildDeliveryMethodsFromPolicy(NotificationPolicy policy)
        {
            var methods = new List<string>();
            if (policy.EnableSystem) methods.Add("System");
            if (policy.EnableEmail) methods.Add("Email");
            if (policy.EnableSms) methods.Add("SMS");
            return methods.Any() ? string.Join(",", methods) : "System";
        }
    }
}
