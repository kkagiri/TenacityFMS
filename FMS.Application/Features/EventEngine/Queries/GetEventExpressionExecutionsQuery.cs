/**
 * File: GetEventExpressionExecutionsQuery.cs
 * Purpose: MediatR query for fetching execution history of an EventExpression.
 * Dependencies: MediatR, FMSResponse
 * Last Modified: 2026-02-11
 */

using System;
using System.Collections.Generic;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Features.EventEngine.Queries
{
    public record GetEventExpressionExecutionsQuery(
        int ExpressionId,
        DateTime? FromDate = null,
        DateTime? ToDate = null,
        bool? WasTriggered = null,
        int Skip = 0,
        int Take = 50
    ) : IRequest<FMSResponse<List<EventExpressionExecutionDto>>>;

    /// <summary>
    /// Lightweight DTO for execution history results.
    /// </summary>
    public class EventExpressionExecutionDto
    {
        public int Id { get; set; }
        public int EventExpressionId { get; set; }
        public string EventType { get; set; } = string.Empty;
        public DateTime ExecutedAt { get; set; }
        public bool WasTriggered { get; set; }
        public string? SuppressedReason { get; set; }
        public string? EventData { get; set; }
        public int? NotificationId { get; set; }
        public int? IssueTrackerId { get; set; }
        public bool Success { get; set; }
        public string? ErrorMessage { get; set; }
        public int? ExecutionTimeMs { get; set; }
    }
}
