/**
 * File: ClosingStockDiscrepancyRefreshService.cs
 * Purpose: Recomputes and refreshes persisted closing-stock discrepancy alerts
 *          after late historical tank transactions are saved.
 * Dependencies: GpsdataContext, TankClosingStockEvent, EventExpression, NotificationPolicy
 * Last Modified: 2026-03-28
 *
 * Key Functions:
 * - RefreshClosingDiscrepancyAsync(): updates matching ActiveEvent and Notification snapshots
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Features.EventEngine.Events;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Domain.Entities.Features.TankStockManagement;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
using NotificationEntity = FMS.Domain.Entities.Features.Notifications.Notification;
using SiteEntity = FMS.Domain.Entities.Site;
using TankVolumeHistoryEntity = FMS.Domain.Entities.Features.TankStockManagement.TankVolumeHistory;

namespace FMS.Application.Features.TankManagement.Services
{
    public class ClosingStockDiscrepancyRefreshService
    {
        private const decimal SignificantVarianceThresholdLiters = 50m;
        private const decimal SignificantVarianceThresholdPercentage = 5m;
        private const decimal InvestigationVarianceThresholdLiters = 100m;
        private const decimal InvestigationVarianceThresholdPercentage = 10m;

        private readonly GpsdataContext _context;
        private readonly ILogger<ClosingStockDiscrepancyRefreshService> _logger;
        private readonly IConfiguration _configuration;

        public ClosingStockDiscrepancyRefreshService(
            GpsdataContext context,
            ILogger<ClosingStockDiscrepancyRefreshService> logger,
            IConfiguration configuration)
        {
            _context = context;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task RefreshClosingDiscrepancyAsync(
            int tankId,
            DateTime affectedTimestamp,
            string refreshedBy,
            CancellationToken cancellationToken = default)
        {
            try
            {
                var businessDay = await ResolveBusinessDayAsync(tankId, affectedTimestamp, cancellationToken);
                if (businessDay == null)
                {
                    _logger.LogDebug(
                        "Skipping closing discrepancy refresh for Tank {TankId}: no matching business day found for {Timestamp}",
                        tankId,
                        affectedTimestamp);
                    return;
                }

                if (businessDay.ClosingStock == null)
                {
                    _logger.LogDebug(
                        "Skipping closing discrepancy refresh for Tank {TankId}: business day {BusinessDayStart} has no closing stock yet",
                        tankId,
                        businessDay.OpeningStock.Timestamp);
                    return;
                }

                var snapshot = await BuildSnapshotAsync(businessDay, refreshedBy, cancellationToken);
                if (snapshot == null)
                {
                    return;
                }

                var activeEvents = await FindMatchingActiveEventsAsync(snapshot, cancellationToken);
                var notifications = await FindMatchingNotificationsAsync(snapshot, cancellationToken);

                if (!activeEvents.Any() && !notifications.Any())
                {
                    _logger.LogInformation(
                        "No persisted closing discrepancy alert found to refresh for Tank {TankId} on business date {BusinessDate}",
                        tankId,
                        snapshot.BusinessDateDisplay);
                    return;
                }

                var expressionIds = activeEvents
                    .Where(e => e.EventExpressionId.HasValue)
                    .Select(e => e.EventExpressionId!.Value)
                    .Concat(notifications.Select(GetExpressionIdFromNotification).Where(id => id.HasValue).Select(id => id!.Value))
                    .Distinct()
                    .ToList();

                var expressions = await _context.EventExpressions
                    .Include(e => e.NotificationPolicy)
                    .Where(e => expressionIds.Contains(e.Id))
                    .ToDictionaryAsync(e => e.Id, cancellationToken);

                var now = DateTime.UtcNow;

                foreach (var activeEvent in activeEvents)
                {
                    expressions.TryGetValue(activeEvent.EventExpressionId ?? 0, out var expression);
                    RefreshActiveEvent(activeEvent, snapshot, expression, refreshedBy, now);
                }

                foreach (var notification in notifications)
                {
                    var expressionId = GetExpressionIdFromNotification(notification);
                    expressions.TryGetValue(expressionId ?? 0, out var expression);
                    RefreshNotification(notification, snapshot, expression, now);
                }

                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation(
                    "Refreshed closing discrepancy snapshots for Tank {TankId} on {BusinessDate}: {ActiveCount} active event(s), {NotificationCount} notification(s)",
                    tankId,
                    snapshot.BusinessDateDisplay,
                    activeEvents.Count,
                    notifications.Count);
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Failed to refresh closing discrepancy snapshots for Tank {TankId} at {Timestamp}",
                    tankId,
                    affectedTimestamp);
            }
        }

        private async Task<BusinessDayContext?> ResolveBusinessDayAsync(
            int tankId,
            DateTime affectedTimestamp,
            CancellationToken cancellationToken)
        {
            var openingStock = await _context.TankVolumeHistories
                .Where(x => x.TankId == tankId &&
                    x.ChangeReason == VolumeChangeReasonEnum.OpeningStock &&
                    x.Timestamp <= affectedTimestamp &&
                    x.IsDeleted != true)
                .OrderByDescending(x => x.Timestamp)
                .ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            if (openingStock == null)
            {
                return null;
            }

            var businessWindowEnd = openingStock.Timestamp.AddDays(1);
            if (affectedTimestamp >= businessWindowEnd)
            {
                return null;
            }

            var closingStock = await _context.TankVolumeHistories
                .Where(x => x.TankId == tankId &&
                    x.ChangeReason == VolumeChangeReasonEnum.ClosingStock &&
                    x.Timestamp >= openingStock.Timestamp &&
                    x.Timestamp <= businessWindowEnd &&
                    x.IsDeleted != true)
                .OrderByDescending(x => x.Timestamp)
                .ThenByDescending(x => x.Id)
                .FirstOrDefaultAsync(cancellationToken);

            var tank = await _context.Tanks
                .AsNoTracking()
                .FirstOrDefaultAsync(t => t.Id == tankId, cancellationToken);

            if (tank == null)
            {
                return null;
            }

            var site = await _context.Sites
                .AsNoTracking()
                .FirstOrDefaultAsync(s => s.Id == tank.SiteId, cancellationToken);

            return new BusinessDayContext
            {
                Tank = tank,
                Site = site,
                OpeningStock = openingStock,
                ClosingStock = closingStock,
                BusinessWindowStartUtc = openingStock.Timestamp,
                BusinessWindowEndUtc = closingStock?.Timestamp ?? businessWindowEnd
            };
        }

        private async Task<RefreshSnapshot?> BuildSnapshotAsync(
            BusinessDayContext businessDay,
            string refreshedBy,
            CancellationToken cancellationToken)
        {
            if (businessDay.ClosingStock == null)
            {
                return null;
            }

            var transactions = await _context.TankVolumeHistories
                .Where(tvh => tvh.TankId == businessDay.Tank.Id &&
                    tvh.Timestamp >= businessDay.BusinessWindowStartUtc &&
                    tvh.Timestamp <= businessDay.BusinessWindowEndUtc &&
                    tvh.IsDeleted != true)
                .OrderBy(tvh => tvh.Timestamp)
                .ThenBy(tvh => tvh.Id)
                .ToListAsync(cancellationToken);

            var transferReferenceIds = transactions
                .Where(t => (t.ChangeReason == VolumeChangeReasonEnum.TransferIn ||
                             t.ChangeReason == VolumeChangeReasonEnum.TransferOut) &&
                            t.ReferenceId.HasValue)
                .Select(t => t.ReferenceId!.Value)
                .Distinct()
                .ToList();

            var validTransferIds = transferReferenceIds.Any()
                ? (await _context.TankTransfers
                    .Where(tt => transferReferenceIds.Contains(tt.Id) && !tt.IsDeleted)
                    .Select(tt => tt.Id)
                    .ToListAsync(cancellationToken))
                    .ToHashSet()
                : new HashSet<int>();

            var openingVolume = businessDay.OpeningStock.NewVolume ?? businessDay.OpeningStock.VolumeChange ?? 0m;
            var actualClosing = businessDay.ClosingStock.NewVolume ?? 0m;
            var totalDeliveries = transactions
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Delivery)
                .Sum(t => t.VolumeChange ?? 0m);
            var totalManualDispensing = transactions
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Dispensing)
                .Sum(t => t.VolumeChange ?? 0m);
            var totalAutomatedDispensing = transactions
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.AutomatedDispensing)
                .Sum(t => t.VolumeChange ?? 0m);
            var totalDispensing = totalManualDispensing + totalAutomatedDispensing;
            var totalTransfersIn = transactions
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferIn &&
                    t.ReferenceId.HasValue &&
                    validTransferIds.Contains(t.ReferenceId.Value))
                .Sum(t => t.VolumeChange ?? 0m);
            var totalTransfersOut = transactions
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.TransferOut &&
                    t.ReferenceId.HasValue &&
                    validTransferIds.Contains(t.ReferenceId.Value))
                .Sum(t => t.VolumeChange ?? 0m);
            var totalInTankDeliveries = transactions
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.InTankDelivery)
                .Sum(t => t.VolumeChange ?? 0m);
            var totalAdjustments = transactions
                .Where(t => t.ChangeReason == VolumeChangeReasonEnum.Adjustment)
                .Sum(t => t.VolumeChange ?? 0m);
            var netMovement = transactions
                .Where(t => t.ChangeReason != VolumeChangeReasonEnum.OpeningStock &&
                    t.ChangeReason != VolumeChangeReasonEnum.ClosingStock)
                .Sum(t => t.VolumeChange ?? 0m);
            var transactionCount = transactions.Count(t =>
                t.ChangeReason != VolumeChangeReasonEnum.OpeningStock &&
                t.ChangeReason != VolumeChangeReasonEnum.ClosingStock);

            var expectedClosing = openingVolume + totalDeliveries + totalTransfersIn + totalDispensing + totalTransfersOut;
            var variance = actualClosing - expectedClosing;
            var variancePercentage = expectedClosing != 0
                ? variance / expectedClosing * 100m
                : 0m;
            var varianceType = variance > 0 ? "GAIN" : variance < 0 ? "LOSS" : "BALANCED";
            var isSignificant = Math.Abs(variance) >= SignificantVarianceThresholdLiters ||
                Math.Abs(variancePercentage) >= SignificantVarianceThresholdPercentage;
            var severity = DetermineSeverity(variance, variancePercentage);
            var priority = severity switch
            {
                DiscrepancySeverity.Critical => "Critical",
                DiscrepancySeverity.High => "High",
                DiscrepancySeverity.Medium => "Medium",
                _ => "Low"
            };
            var businessDateDisplay = businessDay.BusinessWindowEndUtc.ToString("dd MMM yyyy");

            var message = BuildDiscrepancyMessage(
                businessDay.Site?.Name ?? $"Site {businessDay.Tank.SiteId}",
                businessDay.Tank.Name ?? string.Empty,
                businessDateDisplay,
                variance,
                variancePercentage,
                varianceType,
                openingVolume,
                totalDispensing,
                totalDeliveries,
                totalTransfersIn,
                totalTransfersOut,
                expectedClosing,
                actualClosing);

            var stockEvent = new TankClosingStockEvent
            {
                SiteId = businessDay.Tank.SiteId,
                TankId = businessDay.Tank.Id,
                Severity = priority,
                TriggeredBy = refreshedBy,
                Message = message,
                TankName = businessDay.Tank.Name ?? string.Empty,
                ProductName = businessDay.Tank.FuelGradeName ?? string.Empty,
                SiteName = businessDay.Site?.Name ?? $"Site {businessDay.Tank.SiteId}",
                OpeningStock = openingVolume,
                ClosingStock = actualClosing,
                ExpectedClosingStock = expectedClosing,
                Variance = variance,
                VariancePercentage = variancePercentage,
                VarianceType = varianceType,
                TotalDeliveries = totalDeliveries,
                TotalDispensing = totalDispensing,
                TotalManualDispensing = totalManualDispensing,
                TotalAutomatedDispensing = totalAutomatedDispensing,
                TotalTransfersIn = totalTransfersIn,
                TotalTransfersOut = totalTransfersOut,
                TotalInTankDeliveries = totalInTankDeliveries,
                TotalAdjustments = totalAdjustments,
                NetMovement = netMovement,
                TransactionCount = transactionCount,
                BusinessDate = businessDateDisplay,
                BusinessDateUtc = businessDay.BusinessWindowEndUtc.Date,
                BusinessWindowStartUtc = businessDay.BusinessWindowStartUtc,
                BusinessWindowEndUtc = businessDay.BusinessWindowEndUtc,
                ReportUrl = BuildTankVolumeHistoryUrl(
                    businessDay.Tank.Id,
                    businessDay.Tank.SiteId,
                    businessDay.BusinessWindowStartUtc,
                    businessDay.BusinessWindowEndUtc)
            };

            return new RefreshSnapshot
            {
                Event = stockEvent,
                BusinessDateDisplay = businessDateDisplay,
                ClosingCreatedOnUtc = businessDay.ClosingStock.CreatedOn,
                IsSignificantVariance = isSignificant
            };
        }

        private async Task<List<ActiveEvent>> FindMatchingActiveEventsAsync(
            RefreshSnapshot snapshot,
            CancellationToken cancellationToken)
        {
            var candidates = await _context.ActiveEvents
                .Where(a => a.TankId == snapshot.Event.TankId &&
                    a.EventType == TankClosingStockEvent.EventTypeName &&
                    a.EventExpressionId.HasValue &&
                    a.State != "Resolved" &&
                    a.State != "AutoResolved")
                .OrderByDescending(a => a.TriggeredAt)
                .Take(25)
                .ToListAsync(cancellationToken);

            return candidates
                .Where(a => MatchesBusinessDay(a.EventData, snapshot.BusinessDateDisplay, a.TriggeredAt, snapshot.ClosingCreatedOnUtc))
                .ToList();
        }

        private async Task<List<NotificationEntity>> FindMatchingNotificationsAsync(
            RefreshSnapshot snapshot,
            CancellationToken cancellationToken)
        {
            var candidates = await _context.Notifications
                .Where(n => n.TankId == snapshot.Event.TankId &&
                    n.TriggerSource.StartsWith("EventExpression:"))
                .OrderByDescending(n => n.CreatedAt)
                .Take(50)
                .ToListAsync(cancellationToken);

            return candidates
                .Where(n => MatchesNotificationBusinessDay(n, snapshot.BusinessDateDisplay, snapshot.ClosingCreatedOnUtc))
                .ToList();
        }

        private void RefreshActiveEvent(
            ActiveEvent activeEvent,
            RefreshSnapshot snapshot,
            EventExpression? expression,
            string refreshedBy,
            DateTime updatedAt)
        {
            activeEvent.Message = snapshot.Event.Message;
            activeEvent.EventData = System.Text.Json.JsonSerializer.Serialize(snapshot.Event.GetTemplateVariables());
            activeEvent.Severity = ToSeverityInt(snapshot.Event.Severity);
            activeEvent.Priority = expression?.Priority ?? activeEvent.Priority;
            activeEvent.UpdatedAt = updatedAt;

            if (!snapshot.IsSignificantVariance)
            {
                activeEvent.State = "Resolved";
                activeEvent.ResolvedAt ??= updatedAt;
                activeEvent.ResolvedBy ??= refreshedBy;
                activeEvent.ResolutionNotes = $"Auto-resolved after historical transaction refresh for {snapshot.BusinessDateDisplay}.";
            }
        }

        private void RefreshNotification(
            NotificationEntity notification,
            RefreshSnapshot snapshot,
            EventExpression? expression,
            DateTime updatedAt)
        {
            var templateVariables = snapshot.Event.GetTemplateVariables();
            if (expression != null)
            {
                templateVariables["ExpressionName"] = expression.Name;
                templateVariables["Priority"] = expression.Priority;
            }

            var policy = expression?.NotificationPolicy;
            var titleTemplate = policy?.TitleTemplate ?? "{{EventType}} Alert";
            var messageTemplate = !string.IsNullOrWhiteSpace(expression?.MessageTemplate)
                ? expression!.MessageTemplate!
                : policy?.MessageTemplate ?? "{{Message}}";

            notification.Title = RenderTemplate(titleTemplate, templateVariables);
            notification.Message = RenderTemplate(messageTemplate, templateVariables);
            notification.Priority = expression?.Priority ?? notification.Priority;

            var payload = ParseJsonObject(notification.Data);
            payload["eventType"] = snapshot.Event.EventType;
            payload["eventCategory"] = snapshot.Event.EventCategory;
            payload["severity"] = snapshot.Event.Severity;
            payload["templateVariables"] = JObject.FromObject(templateVariables);

            if (expression != null)
            {
                payload["expressionId"] = expression.Id;
                payload["expressionName"] = expression.Name;
            }

            var reportMeta = snapshot.Event.GetReportAttachmentMetadata();
            if (reportMeta != null && IsAttachReportEnabled(expression))
            {
                payload["reportAttachment"] = new JObject
                {
                    ["reportType"] = reportMeta.ReportType,
                    ["templateName"] = reportMeta.TemplateName,
                    ["tankId"] = reportMeta.TankId,
                    ["siteId"] = reportMeta.SiteId,
                    ["startDate"] = reportMeta.StartDate.ToString("o"),
                    ["endDate"] = reportMeta.EndDate.ToString("o"),
                    ["fileNamePrefix"] = reportMeta.FileNamePrefix
                };
            }
            else
            {
                payload.Remove("reportAttachment");
            }

            notification.Data = payload.HasValues
                ? payload.ToString(Formatting.None)
                : null;
        }

        private static bool MatchesBusinessDay(
            string? eventData,
            string businessDate,
            DateTime triggeredAt,
            DateTime closingCreatedOnUtc)
        {
            var payload = ParseJsonObject(eventData);
            var payloadBusinessDate = payload.Value<string>("BusinessDate");
            if (string.Equals(payloadBusinessDate, businessDate, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return Math.Abs((triggeredAt - closingCreatedOnUtc).TotalHours) <= 2;
        }

        private static bool MatchesNotificationBusinessDay(
            NotificationEntity notification,
            string businessDate,
            DateTime closingCreatedOnUtc)
        {
            var payload = ParseJsonObject(notification.Data);
            var eventType = payload.Value<string>("eventType");
            if (!string.Equals(eventType, TankClosingStockEvent.EventTypeName, StringComparison.OrdinalIgnoreCase))
            {
                return false;
            }

            var templateVariables = payload["templateVariables"] as JObject;
            var payloadBusinessDate = templateVariables?.Value<string>("BusinessDate");
            if (string.Equals(payloadBusinessDate, businessDate, StringComparison.OrdinalIgnoreCase))
            {
                return true;
            }

            return Math.Abs((notification.CreatedAt - closingCreatedOnUtc).TotalHours) <= 2;
        }

        private string BuildTankVolumeHistoryUrl(int tankId, int siteId, DateTime windowStartUtc, DateTime windowEndUtc)
        {
            var baseUrl = _configuration["IssueTracker:FrontendBaseUrl"]
                ?? _configuration["App:FrontendBaseUrl"]
                ?? _configuration["FrontendBaseUrl"]
                ?? _configuration["AppSettings:FrontendBaseUrl"]
                ?? "http://localhost:3000";

            var startText = Uri.EscapeDataString(windowStartUtc.ToString("yyyy-MM-ddTHH:mm:ss"));
            var endText = Uri.EscapeDataString(windowEndUtc.ToString("yyyy-MM-ddTHH:mm:ss"));
            return $"{baseUrl.TrimEnd('/')}/reports/tank-volume-history?autoApply=1&startDate={startText}&endDate={endText}&tankIds={tankId}&siteIds={siteId}";
        }

        private static string BuildDiscrepancyMessage(
            string siteName,
            string tankName,
            string businessDate,
            decimal variance,
            decimal variancePercentage,
            string varianceType,
            decimal openingStock,
            decimal totalDispensing,
            decimal totalDeliveries,
            decimal totalTransfersIn,
            decimal totalTransfersOut,
            decimal expectedClosing,
            decimal actualClosing)
        {
            var messageBuilder = new StringBuilder();
            messageBuilder.Append($"{siteName} | Tank {tankName} | {businessDate}: ");
            messageBuilder.Append($"{varianceType} of {Math.Abs(variance):N2}L ({Math.Abs(variancePercentage):F1}%). ");
            messageBuilder.Append($"Opening: {openingStock:N2}L");

            if (totalDispensing != 0)
                messageBuilder.Append($", Dispensed: {totalDispensing:N2}L");
            if (totalDeliveries != 0)
                messageBuilder.Append($", Deliveries: +{totalDeliveries:N2}L");
            if (totalTransfersIn != 0)
                messageBuilder.Append($", TransfersIn: +{totalTransfersIn:N2}L");
            if (totalTransfersOut != 0)
                messageBuilder.Append($", TransfersOut: {totalTransfersOut:N2}L");

            if (totalDispensing == 0 && totalDeliveries == 0 && totalTransfersIn == 0 && totalTransfersOut == 0)
                messageBuilder.Append(", NO TRANSACTIONS RECORDED");

            messageBuilder.Append($", Expected: {expectedClosing:N2}L");
            messageBuilder.Append($", Actual: {actualClosing:N2}L");
            return messageBuilder.ToString();
        }

        private static JObject ParseJsonObject(string? json)
        {
            if (string.IsNullOrWhiteSpace(json))
            {
                return new JObject();
            }

            try
            {
                return JObject.Parse(json);
            }
            catch
            {
                return new JObject();
            }
        }

        private static string RenderTemplate(string template, Dictionary<string, string> variables)
        {
            if (string.IsNullOrEmpty(template))
            {
                return template;
            }

            foreach (var variable in variables)
            {
                template = template.Replace($"{{{{{variable.Key}}}}}", variable.Value ?? string.Empty, StringComparison.OrdinalIgnoreCase);
            }

            return template;
        }

        private static int? GetExpressionIdFromNotification(NotificationEntity notification)
        {
            if (!string.IsNullOrWhiteSpace(notification.TriggerSource) &&
                notification.TriggerSource.StartsWith("EventExpression:", StringComparison.OrdinalIgnoreCase) &&
                int.TryParse(notification.TriggerSource.Substring("EventExpression:".Length), out var expressionId))
            {
                return expressionId;
            }

            var payload = ParseJsonObject(notification.Data);
            return payload.Value<int?>("expressionId");
        }

        private static bool IsAttachReportEnabled(EventExpression? expression)
        {
            if (expression == null || string.IsNullOrWhiteSpace(expression.Conditions))
            {
                return false;
            }

            try
            {
                var conditions = JObject.Parse(expression.Conditions);
                return conditions.Value<bool?>("_attachReport") == true;
            }
            catch
            {
                return false;
            }
        }

        private static int ToSeverityInt(string severity)
        {
            return severity switch
            {
                "Low" => 1,
                "Medium" => 2,
                "High" => 3,
                "Critical" => 4,
                _ => 2
            };
        }

        private static DiscrepancySeverity DetermineSeverity(decimal varianceLiters, decimal variancePercentage)
        {
            var absVarianceLiters = Math.Abs(varianceLiters);
            var absVariancePercentage = Math.Abs(variancePercentage);

            if (absVarianceLiters > InvestigationVarianceThresholdLiters || absVariancePercentage > InvestigationVarianceThresholdPercentage)
            {
                return DiscrepancySeverity.High;
            }

            if (absVarianceLiters > SignificantVarianceThresholdLiters || absVariancePercentage > SignificantVarianceThresholdPercentage)
            {
                return DiscrepancySeverity.Medium;
            }

            return DiscrepancySeverity.Low;
        }

        private sealed class BusinessDayContext
        {
            public Tank Tank { get; set; } = null!;
            public SiteEntity? Site { get; set; }
            public TankVolumeHistoryEntity OpeningStock { get; set; } = null!;
            public TankVolumeHistoryEntity? ClosingStock { get; set; }
            public DateTime BusinessWindowStartUtc { get; set; }
            public DateTime BusinessWindowEndUtc { get; set; }
        }

        private sealed class RefreshSnapshot
        {
            public TankClosingStockEvent Event { get; set; } = null!;
            public string BusinessDateDisplay { get; set; } = string.Empty;
            public DateTime ClosingCreatedOnUtc { get; set; }
            public bool IsSignificantVariance { get; set; }
        }
    }
}