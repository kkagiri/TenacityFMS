/**
 * File: DynamicRuleDto.cs
 * Purpose: DTO representing a single dynamic recipient routing rule.
 * Dependencies: None
 * Last Modified: 2026-02-25
 *
 * Key Classes:
 * - DynamicRuleDto: Defines a rule type and its configuration for resolving recipients dynamically.
 *
 * Supported Rule Types:
 * - "SiteUsers": All users assigned to the event's site via UserSites table
 * - "SiteAdmin": The site administrator (already handled by resolver, but explicit opt-in here)
 * - "RolesAtSite": Users in specific roles who are also assigned to the event's site
 */
using System.Collections.Generic;

namespace FMS.Application.Features.Notification.DTOs.RecipientRules
{
    public class DynamicRuleDto
    {
        /// <summary>
        /// The type of dynamic rule: "SiteUsers", "SiteAdmin", or "RolesAtSite"
        /// </summary>
        public string Type { get; set; } = null!;

        /// <summary>
        /// Whether this rule is active
        /// </summary>
        public bool Enabled { get; set; }

        /// <summary>
        /// For "RolesAtSite" type: the role IDs whose members should receive notifications.
        /// Members are filtered to only those assigned to the event's site via UserSites.
        /// </summary>
        public List<string>? RoleIds { get; set; }
    }
}
