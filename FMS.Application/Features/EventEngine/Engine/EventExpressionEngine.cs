/**
 * File: EventExpressionEngine.cs
 * Purpose: Core orchestrator that processes FMSEvents through EventExpressions.
 *          The ONLY path for triggering notifications from business operations.
 * Dependencies: GpsdataContext, ExpressionEvaluatorFactory,
 *               INotificationService, EventLogService, ExpressionCooldownService
 * Last Modified: 2026-02-24
 *
 * Key Functions:
 * - ProcessAsync(): main entry point — find expressions, evaluate, notify, log
 *
 * Pipeline per expression:
 *   SeverityFilter → ConditionsMet → CooldownCheck (Cooldown/HourlyCap/DailyCap) → CreateActiveEvent → SendNotification → Log
 *
 * ScopeKey convention:
 *   "tank:{TankId}"  — cooldown isolated per tank  (NoTankEntry, StaleData, etc.)
 *   "site:{SiteId}"  — cooldown isolated per site
 *   "global"         — single shared budget for the whole expression
 *   This ensures Tank A going offline does not burn Tank B's cooldown.
 */

using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.EventEngine.Events;
using FMS.Application.Features.EventEngine.Expressions;
using FMS.Application.Features.Notification.DTOs;
using FMS.Application.Features.Notification.Enums;
using FMS.Application.Features.Notification.Services;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.EventEngine.Engine
{
    /// <summary>
    /// Core engine implementation. Orchestrates the full event evaluation pipeline:
    /// find matching expressions → evaluate conditions → notify → log.
    /// </summary>
    public class EventExpressionEngine : IEventExpressionEngine
    {
        private readonly GpsdataContext _context;
        private readonly ExpressionEvaluatorFactory _evaluatorFactory;
        private readonly EventLogService _logService;
        private readonly INotificationService _notificationService;
        private readonly ILogger<EventExpressionEngine> _logger;
        private readonly ExpressionCooldownService _cooldownService;

        // Severity ordering for MinimumSeverity filter
        private static readonly Dictionary<string, int> SeverityLevels = new(StringComparer.OrdinalIgnoreCase)
        {
            ["Low"] = 1,
            ["Medium"] = 2,
            ["High"] = 3,
            ["Critical"] = 4
        };

        public EventExpressionEngine(
            GpsdataContext context,
            ExpressionEvaluatorFactory evaluatorFactory,
            EventLogService logService,
            INotificationService notificationService,
            ILogger<EventExpressionEngine> logger,
            ExpressionCooldownService cooldownService)
        {
            _context = context;
            _evaluatorFactory = evaluatorFactory;
            _logService = logService;
            _notificationService = notificationService;
            _logger = logger;
            _cooldownService = cooldownService;
        }

        public async Task<EventProcessingResult> ProcessAsync(FMSEvent fmsEvent, CancellationToken ct = default)
        {
            var result = new EventProcessingResult { EventType = fmsEvent.EventType };

            try
            {
                // 1. Find matching expressions (EventType + scope + active)
                var expressions = await FindMatchingExpressionsAsync(fmsEvent, ct);
                result.MatchedExpressions = expressions.Count;

                if (expressions.Count == 0)
                {
                    _logger.LogDebug("No EventExpressions matched for EventType={EventType}", fmsEvent.EventType);
                    return result;
                }

                // 2. Evaluate each expression
                foreach (var expression in expressions)
                {
                    var sw = Stopwatch.StartNew();
                    var detail = new ExpressionEvaluationDetail
                    {
                        EventExpressionId = expression.Id,
                        ExpressionName = expression.Name
                    };

                    try
                    {
                        // Compute scope key once — used for cooldown scoping and execution log
                        var scopeKey = BuildScopeKey(fmsEvent);
                        detail.ScopeKey = scopeKey;

                        // 2a. Check severity filter
                        if (!PassesSeverityFilter(fmsEvent.Severity, expression.MinimumSeverity))
                        {
                            detail.SuppressedReason = "SeverityTooLow";
                            result.SuppressedCount++;
                            await LogExecutionAsync(expression, fmsEvent, detail, sw.ElapsedMilliseconds, ct);
                            result.Details.Add(detail);
                            continue;
                        }

                        // 2b. Evaluate conditions via the type-specific evaluator
                        var evaluator = _evaluatorFactory.GetEvaluator(fmsEvent.EventType);
                        var conditionsMet = evaluator.Evaluate(fmsEvent, expression.Conditions);
                        if (!conditionsMet)
                        {
                            detail.SuppressedReason = "ConditionNotMet";
                            result.SuppressedCount++;
                            await LogExecutionAsync(expression, fmsEvent, detail, sw.ElapsedMilliseconds, ct);
                            result.Details.Add(detail);
                            continue;
                        }

                        // 2c. Cooldown / rate-limit check — scoped per tank/site/global.
                        //     CooldownMinutes and MaxNotificationsPerDay have always been stored
                        //     in DB but were never called until now. MaxNotificationsPerHour is new.
                        var suppressReason = await _cooldownService.GetSuppressedReasonAsync(
                            expression.Id,
                            scopeKey,
                            expression.CooldownMinutes,
                            expression.MaxNotificationsPerHour,
                            expression.MaxNotificationsPerDay,
                            ct);

                        if (suppressReason != null)
                        {
                            detail.SuppressedReason = suppressReason;
                            result.SuppressedCount++;
                            await LogExecutionAsync(expression, fmsEvent, detail, sw.ElapsedMilliseconds, ct);
                            result.Details.Add(detail);
                            continue;
                        }

                        // 3. Create ActiveEvent record (if configured)
                        if (expression.CreateActiveEvent)
                        {
                            await _logService.CreateActiveEventAsync(fmsEvent, expression, ct);
                        }

                        // 4. Send notification via the linked NotificationPolicy
                        int? notificationId = null;
                        try
                        {
                            notificationId = await SendNotificationAsync(fmsEvent, expression, ct);
                            if (notificationId.HasValue)
                            {
                                detail.NotificationId = notificationId;
                                _logger.LogInformation(
                                    "Notification {NotificationId} sent for expression {ExpressionId}",
                                    notificationId.Value, expression.Id);
                            }
                        }
                        catch (Exception notifEx)
                        {
                            _logger.LogWarning(notifEx,
                                "Failed to send notification for expression {ExpressionId}, event processing continues",
                                expression.Id);
                        }

                        // 5. Update expression trigger stats
                        expression.TriggerCount++;
                        expression.LastTriggeredAt = DateTime.UtcNow;

                        // 6. Log successful execution
                        detail.WasTriggered = true;
                        result.TriggeredCount++;
                        await LogExecutionAsync(expression, fmsEvent, detail, sw.ElapsedMilliseconds, ct);
                        result.Details.Add(detail);

                        _logger.LogInformation(
                            "EventExpression {ExpressionId} ({ExpressionName}) triggered for EventType={EventType}",
                            expression.Id, expression.Name, fmsEvent.EventType);
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex,
                            "Error evaluating EventExpression {ExpressionId} for EventType={EventType}",
                            expression.Id, fmsEvent.EventType);

                        detail.SuppressedReason = $"Error: {ex.Message}";
                        result.Errors.Add($"Expression {expression.Id}: {ex.Message}");
                        await LogExecutionAsync(expression, fmsEvent, detail, sw.ElapsedMilliseconds, ct);
                        result.Details.Add(detail);
                    }
                }

                await _context.SaveChangesAsync(ct);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Fatal error processing EventType={EventType}", fmsEvent.EventType);
                result.Errors.Add($"Engine error: {ex.Message}");
            }

            return result;
        }

        /// <summary>
        /// Find all active EventExpressions matching this event's type and scope.
        /// </summary>
        private async Task<List<EventExpression>> FindMatchingExpressionsAsync(FMSEvent fmsEvent, CancellationToken ct)
        {
            var query = _context.EventExpressions
                .Include(e => e.NotificationPolicy)
                .Where(e => e.IsActive && e.EventType == fmsEvent.EventType);

            // Scope matching: expression scope is null (match all) or matches event value
            if (fmsEvent.SiteId.HasValue)
            {
                query = query.Where(e => e.SiteId == null || e.SiteId == fmsEvent.SiteId);
            }
            else
            {
                query = query.Where(e => e.SiteId == null);
            }

            if (fmsEvent.TankId.HasValue)
            {
                query = query.Where(e => e.TankId == null || e.TankId == fmsEvent.TankId);
            }
            else
            {
                query = query.Where(e => e.TankId == null);
            }

            if (fmsEvent.DeviceId.HasValue)
            {
                query = query.Where(e => e.DeviceId == null || e.DeviceId == fmsEvent.DeviceId);
            }
            else
            {
                query = query.Where(e => e.DeviceId == null);
            }

            return await query.ToListAsync(ct);
        }

        /// <summary>
        /// Builds the scope key for cooldown/rate-limit isolation from an incoming FMSEvent.
        /// Scoping ensures Tank A's cooldown budget is completely independent from Tank B's,
        /// even if both are evaluated by the same expression.
        /// </summary>
        private static string BuildScopeKey(FMSEvent fmsEvent)
        {
            if (fmsEvent.TankId.HasValue)
                return $"tank:{fmsEvent.TankId.Value}";

            if (fmsEvent.SiteId.HasValue)
                return $"site:{fmsEvent.SiteId.Value}";

            return "global";
        }

        /// <summary>
        /// Check if the event severity meets the expression's MinimumSeverity.
        /// </summary>
        private static bool PassesSeverityFilter(string eventSeverity, string? minimumSeverity)
        {
            if (string.IsNullOrEmpty(minimumSeverity))
                return true;

            var eventLevel = SeverityLevels.TryGetValue(eventSeverity, out var el) ? el : 2;
            var minLevel = SeverityLevels.TryGetValue(minimumSeverity, out var ml) ? ml : 1;

            return eventLevel >= minLevel;
        }

        /// <summary>
        /// Record the evaluation result in EventExpressionExecutions.
        /// </summary>
        private async Task LogExecutionAsync(
            EventExpression expression,
            FMSEvent fmsEvent,
            ExpressionEvaluationDetail detail,
            long executionTimeMs,
            CancellationToken ct)
        {
            var execution = new EventExpressionExecution
            {
                EventExpressionId = expression.Id,
                EventType = fmsEvent.EventType,
                ExecutedAt = DateTime.UtcNow,
                WasTriggered = detail.WasTriggered,
                SuppressedReason = detail.SuppressedReason,
                NotificationId = detail.NotificationId,
                Success = detail.SuppressedReason == null || !detail.SuppressedReason.StartsWith("Error"),
                ExecutionTimeMs = (int)executionTimeMs,
                ScopeKey = detail.ScopeKey ?? "global"
            };

            // Serialize event data snapshot
            try
            {
                execution.EventData = JsonSerializer.Serialize(fmsEvent.GetTemplateVariables());
            }
            catch
            {
                execution.EventData = "{}";
            }

            _context.EventExpressionExecutions.Add(execution);
        }

        /// <summary>
        /// Send a notification via the linked NotificationPolicy.
        /// Expression-level fields (MessageTemplate, Priority, CooldownMinutes) override policy defaults.
        /// The policy defines HOW to deliver (channels, recipients, templates).
        /// The expression defines WHEN to fire (conditions, scope) and can override rate limits.
        /// </summary>
        private async Task<int?> SendNotificationAsync(
            FMSEvent fmsEvent,
            EventExpression expression,
            CancellationToken ct)
        {
            var policy = expression.NotificationPolicy;
            if (policy == null || !policy.IsActive)
            {
                _logger.LogWarning(
                    "NotificationPolicy {PolicyId} is null or inactive for expression {ExpressionId}",
                    expression.NotificationPolicyId, expression.Id);
                return null;
            }

            // Resolve category from the policy
            var categoryId = policy.NotificationCategoryId;

            // Build title and message from templates
            // Expression-level MessageTemplate overrides the policy template
            var templateVars = fmsEvent.GetTemplateVariables();
            // Add expression-specific variables
            templateVars["ExpressionName"] = expression.Name;
            templateVars["Priority"] = expression.Priority;

            var titleTemplate = policy.TitleTemplate ?? "{{EventType}} Alert";
            var messageTemplate = !string.IsNullOrEmpty(expression.MessageTemplate)
                ? expression.MessageTemplate
                : policy.MessageTemplate ?? "{{Message}}";

            var title = RenderTemplate(titleTemplate, templateVars);
            var message = RenderTemplate(messageTemplate, templateVars);

            // Map expression priority to enum
            var priority = Enum.TryParse<NotificationPriority>(expression.Priority, true, out var p)
                ? p
                : NotificationPriority.Medium;

            // Map policy type to NotificationType enum
            var notificationType = Enum.TryParse<NotificationType>(policy.NotificationType, true, out var nt)
                ? nt
                : NotificationType.Alert;

            var request = new CreateNotificationRequest
            {
                Type = notificationType,
                CategoryId = categoryId,
                Priority = priority,
                Title = title,
                Message = message,
                TriggerSource = $"EventExpression:{expression.Id}",
                TriggeredBy = fmsEvent.TriggeredBy,
                SiteId = fmsEvent.SiteId,
                TankId = fmsEvent.TankId,
                PtsDeviceId = fmsEvent.PtsDeviceId,
                NotificationPolicyId = policy.Id,
                DisableFallbackAllUsers = true,
                Data = BuildNotificationData(fmsEvent, expression, templateVars)
            };

            var result = await _notificationService.CreateNotificationAsync(request, ct);

            if (result.IsSuccess)
            {
                return result.Data; // notification ID
            }

            _logger.LogWarning(
                "CreateNotificationAsync failed for expression {ExpressionId}: {Message}",
                expression.Id, result.Message);
            return null;
        }

        /// <summary>
        /// Builds the serializable Data object for the notification request.
        /// Includes report attachment metadata when the event provides it
        /// AND the expression has opted in via _attachReport in conditions.
        /// </summary>
        private static object BuildNotificationData(
            FMSEvent fmsEvent,
            EventExpression expression,
            Dictionary<string, string> templateVars)
        {
            var customEmailBodyHtml = fmsEvent.GetCustomEmailBodyHtml();
            var reportMeta = fmsEvent.GetReportAttachmentMetadata();
            if (reportMeta != null && IsAttachReportEnabled(expression))
            {
                return new
                {
                    eventType = fmsEvent.EventType,
                    eventCategory = fmsEvent.EventCategory,
                    expressionId = expression.Id,
                    expressionName = expression.Name,
                    severity = fmsEvent.Severity,
                    templateVariables = templateVars,
                    EmailBodyHtml = customEmailBodyHtml,
                    reportAttachment = new
                    {
                        reportType = reportMeta.ReportType,
                        templateName = reportMeta.TemplateName,
                        tankId = reportMeta.TankId,
                        siteId = reportMeta.SiteId,
                        startDate = reportMeta.StartDate.ToString("o"),
                        endDate = reportMeta.EndDate.ToString("o"),
                        fileNamePrefix = reportMeta.FileNamePrefix
                    }
                };
            }

            return new
            {
                eventType = fmsEvent.EventType,
                eventCategory = fmsEvent.EventCategory,
                expressionId = expression.Id,
                expressionName = expression.Name,
                severity = fmsEvent.Severity,
                templateVariables = templateVars,
                EmailBodyHtml = customEmailBodyHtml
            };
        }

        /// <summary>
        /// Checks whether the expression has the _attachReport flag set in its conditions JSON.
        /// </summary>
        private static bool IsAttachReportEnabled(EventExpression expression)
        {
            if (string.IsNullOrWhiteSpace(expression.Conditions))
                return false;

            try
            {
                var conditionsObj = Newtonsoft.Json.Linq.JObject.Parse(expression.Conditions);
                return conditionsObj.Value<bool?>("_attachReport") == true;
            }
            catch
            {
                return false;
            }
        }

        /// <summary>
        /// Simple {{placeholder}} template renderer.
        /// </summary>
        private static string RenderTemplate(string template, Dictionary<string, string> variables)
        {
            if (string.IsNullOrEmpty(template))
                return template;

            foreach (var kvp in variables)
            {
                template = template.Replace($"{{{{{kvp.Key}}}}}", kvp.Value ?? "", StringComparison.OrdinalIgnoreCase);
            }

            return template;
        }
    }
}
