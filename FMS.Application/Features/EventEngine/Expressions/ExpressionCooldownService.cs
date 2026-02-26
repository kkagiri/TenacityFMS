/**
 * File: ExpressionCooldownService.cs
 * Purpose: Manages cooldown and rate limiting for EventExpressions.
 *          All checks are SCOPED per ScopeKey ("tank:1", "site:2", "global") so that
 *          a cooldown on Tank A's NoTankEntry event does not block Tank B.
 * Dependencies: GpsdataContext, EventExpressionExecution entity
 * Last Modified: 2026-02-24
 *
 * Key Functions:
 * - GetSuppressedReasonAsync(): checks cooldown, hourly cap, and daily cap — returns
 *   the first reason to suppress, or null if the expression may fire.
 *
 * ScopeKey convention (built by EventExpressionEngine from the incoming FMSEvent):
 *   "tank:{TankId}"   → cooldown isolated per tank   (e.g. NoTankEntry, StaleData)
 *   "site:{SiteId}"   → cooldown isolated per site
 *   "global"          → single shared budget across the whole expression
 */

using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Features.EventEngine.Expressions
{
    /// <summary>
    /// Checks cooldown, hourly cap, and daily cap for an EventExpression,
    /// scoped by ScopeKey so per-tank/per-site rate limits stay independent.
    /// </summary>
    public class ExpressionCooldownService
    {
        private readonly GpsdataContext _context;

        public ExpressionCooldownService(GpsdataContext context)
        {
            _context = context;
        }

        /// <summary>
        /// Returns the suppression reason if the expression should NOT fire, or null if it can fire.
        /// Checks in priority order: Cooldown → HourlyCap → DailyCap.
        /// All checks are scoped to <paramref name="scopeKey"/> so Tank A never
        /// blocks Tank B from triggering the same expression.
        /// </summary>
        /// <param name="expressionId">The expression being evaluated.</param>
        /// <param name="scopeKey">"tank:{id}", "site:{id}", or "global".</param>
        /// <param name="cooldownMinutes">Min minutes between triggers (0 = off).</param>
        /// <param name="maxNotificationsPerHour">Max triggers per hour per scope (0 = off).</param>
        /// <param name="maxNotificationsPerDay">Max triggers per day per scope (0 = off).</param>
        public async Task<string?> GetSuppressedReasonAsync(
            int expressionId,
            string scopeKey,
            int cooldownMinutes,
            int maxNotificationsPerHour,
            int maxNotificationsPerDay,
            CancellationToken ct = default)
        {
            // 1. Cooldown — was this expression triggered for this scope recently?
            if (cooldownMinutes > 0)
            {
                var cooldownSince = DateTime.UtcNow.AddMinutes(-cooldownMinutes);
                var recentTrigger = await _context.EventExpressionExecutions
                    .Where(e => e.EventExpressionId == expressionId
                        && e.ScopeKey == scopeKey
                        && e.WasTriggered
                        && e.ExecutedAt >= cooldownSince)
                    .AnyAsync(ct);

                if (recentTrigger)
                    return "Cooldown";
            }

            // 2. Hourly cap — how many times has this scope triggered in the last hour?
            if (maxNotificationsPerHour > 0)
            {
                var hourStart = DateTime.UtcNow.AddHours(-1);
                var hourCount = await _context.EventExpressionExecutions
                    .Where(e => e.EventExpressionId == expressionId
                        && e.ScopeKey == scopeKey
                        && e.WasTriggered
                        && e.ExecutedAt >= hourStart)
                    .CountAsync(ct);

                if (hourCount >= maxNotificationsPerHour)
                    return "HourlyCap";
            }

            // 3. Daily cap — how many times has this scope triggered today?
            if (maxNotificationsPerDay > 0)
            {
                var todayStart = DateTime.UtcNow.Date;
                var todayCount = await _context.EventExpressionExecutions
                    .Where(e => e.EventExpressionId == expressionId
                        && e.ScopeKey == scopeKey
                        && e.WasTriggered
                        && e.ExecutedAt >= todayStart)
                    .CountAsync(ct);

                if (todayCount >= maxNotificationsPerDay)
                    return "DailyCap";
            }

            return null; // Not suppressed — can fire
        }
    }
}
