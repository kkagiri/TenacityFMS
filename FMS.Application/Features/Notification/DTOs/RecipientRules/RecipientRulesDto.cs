/**
 * File: RecipientRulesDto.cs
 * Purpose: DTO for dynamic recipient routing rules stored in NotificationPolicy.RecipientRules JSON column.
 * Dependencies: None
 * Last Modified: 2026-02-25
 *
 * Key Classes:
 * - RecipientRulesDto: Top-level container for dynamic routing rules
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.RecipientRules
{
    public class RecipientRulesDto
    {
        /// <summary>
        /// List of dynamic recipient routing rules.
        /// Each rule defines a strategy for resolving recipients at notification-send time.
        /// </summary>
        public List<DynamicRuleDto> DynamicRules { get; set; } = new();
    }
}
