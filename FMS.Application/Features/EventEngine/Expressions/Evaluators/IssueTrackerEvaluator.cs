/**
 * File: IssueTrackerEvaluator.cs
 * Purpose: Evaluates IssueTrackerEvent conditions — SubType matching, priority filter,
 *          entity-type filter, and multi-site scope filtering.
 * Dependencies: IExpressionEvaluator, IssueTrackerEvent
 * Last Modified: 2026-02-18
 *
 * Conditions JSON format:
 * {
 *   "subTypeFilter": "IssueCreated",
 *   "issuePriorityFilter": "High",
 *   "entityTypeFilter": "vehicle",
 *   "_siteIds": [2, 5]
 * }
 */

using System;
using System.Linq;
using System.Text.Json;
using FMS.Application.Features.EventEngine.Events;

namespace FMS.Application.Features.EventEngine.Expressions.Evaluators
{
    /// <summary>
    /// Evaluates IssueTrackerEvent against expression conditions.
    /// Handles SubType filtering, priority/category/entity-type filters,
    /// and multi-site scope filtering.
    /// </summary>
    public class IssueTrackerEvaluator : IExpressionEvaluator
    {
        public string EventType => IssueTrackerEvent.EventTypeName; // "IssueTracker"

        public bool Evaluate(FMSEvent fmsEvent, string? conditionsJson)
        {
            if (string.IsNullOrWhiteSpace(conditionsJson))
                return true;

            if (fmsEvent is not IssueTrackerEvent issueEvent)
                return false;

            try
            {
                using var doc = JsonDocument.Parse(conditionsJson);
                var root = doc.RootElement;

                // 1. SubType filter — IssueCreated, IssueEscalated, IssueOverdue, IssueUpdated
                if (root.TryGetProperty("subTypeFilter", out var subTypeProp))
                {
                    var subTypeFilter = subTypeProp.GetString();
                    if (!string.IsNullOrEmpty(subTypeFilter) &&
                        !string.Equals(issueEvent.SubType, subTypeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 2. Priority filter
                if (root.TryGetProperty("issuePriorityFilter", out var priorityProp))
                {
                    var priorityFilter = priorityProp.GetString();
                    if (!string.IsNullOrEmpty(priorityFilter) &&
                        !string.Equals(issueEvent.IssuePriority, priorityFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 3. Related entity type filter (vehicle / pts / etc)
                if (root.TryGetProperty("entityTypeFilter", out var entityTypeProp))
                {
                    var entityTypeFilter = entityTypeProp.GetString();
                    if (!string.IsNullOrEmpty(entityTypeFilter) &&
                        !string.Equals(issueEvent.RelatedEntityType, entityTypeFilter, StringComparison.OrdinalIgnoreCase))
                    {
                        return false;
                    }
                }

                // 4. Multi-site scope: _siteIds array
                if (root.TryGetProperty("_siteIds", out var siteIdsProp) &&
                    siteIdsProp.ValueKind == JsonValueKind.Array &&
                    fmsEvent.SiteId.HasValue)
                {
                    var siteIds = siteIdsProp.EnumerateArray()
                        .Where(e => e.ValueKind == JsonValueKind.Number)
                        .Select(e => e.TryGetInt32(out var id) ? id : -1)
                        .Where(id => id > 0)
                        .ToList();

                    if (siteIds.Count > 0 && !siteIds.Contains(fmsEvent.SiteId.Value))
                        return false;
                }

                return true;
            }
            catch (JsonException)
            {
                // Malformed JSON — don't suppress, let it trigger
                return true;
            }
        }
    }
}
