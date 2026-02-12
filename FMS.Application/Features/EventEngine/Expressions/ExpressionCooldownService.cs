/**
 * File: ExpressionCooldownService.cs
 * Purpose: Manages cooldown and daily rate limiting for EventExpressions.
 *          Queries EventExpressionExecution table to determine if an expression
 *          is within its cooldown period or has hit its daily cap.
 * Dependencies: GpsdataContext, EventExpressionExecution entity
 * Last Modified: 2026-02-11
 *
 * Key Functions:
 * - IsInCooldown(): checks if the expression was triggered recently
 * - HasHitDailyCap(): checks if daily notification limit is reached
 * - GetSuppressedReason(): returns the reason for suppression or null
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
    /// Checks cooldown period and daily cap for an EventExpression
    /// before allowing it to fire a notification.
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
        /// </summary>
        public async Task<string?> GetSuppressedReasonAsync(
            int expressionId,
            int cooldownMinutes,
            int maxNotificationsPerDay,
            CancellationToken ct = default)
        {
            // Check cooldown
            if (cooldownMinutes > 0)
            {
                var cooldownSince = DateTime.UtcNow.AddMinutes(-cooldownMinutes);
                var recentTrigger = await _context.EventExpressionExecutions
                    .Where(e => e.EventExpressionId == expressionId
                        && e.WasTriggered
                        && e.ExecutedAt >= cooldownSince)
                    .AnyAsync(ct);

                if (recentTrigger)
                    return "Cooldown";
            }

            // Check daily cap
            if (maxNotificationsPerDay > 0)
            {
                var todayStart = DateTime.UtcNow.Date;
                var todayCount = await _context.EventExpressionExecutions
                    .Where(e => e.EventExpressionId == expressionId
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
