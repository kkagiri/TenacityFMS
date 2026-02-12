/**
 * File: GetEventExpressionExecutionsQueryHandler.cs
 * Purpose: Handles fetching execution history for a specific EventExpression.
 * Dependencies: GpsdataContext, FMSResponse
 * Last Modified: 2026-02-11
 */

using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.EventEngine.Queries
{
    public class GetEventExpressionExecutionsQueryHandler
        : IRequestHandler<GetEventExpressionExecutionsQuery, FMSResponse<List<EventExpressionExecutionDto>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetEventExpressionExecutionsQueryHandler> _logger;

        public GetEventExpressionExecutionsQueryHandler(
            GpsdataContext context,
            ILogger<GetEventExpressionExecutionsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<EventExpressionExecutionDto>>> Handle(
            GetEventExpressionExecutionsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                // Verify expression exists
                var exists = await _context.EventExpressions
                    .AnyAsync(e => e.Id == request.ExpressionId, cancellationToken);

                if (!exists)
                    return FMSResponse<List<EventExpressionExecutionDto>>.Failed(
                        $"Event expression with ID {request.ExpressionId} not found", "NOT_FOUND");

                var query = _context.EventExpressionExecutions
                    .Where(e => e.EventExpressionId == request.ExpressionId)
                    .AsQueryable();

                // Apply filters
                if (request.FromDate.HasValue)
                    query = query.Where(e => e.ExecutedAt >= request.FromDate.Value);

                if (request.ToDate.HasValue)
                    query = query.Where(e => e.ExecutedAt <= request.ToDate.Value);

                if (request.WasTriggered.HasValue)
                    query = query.Where(e => e.WasTriggered == request.WasTriggered.Value);

                query = query.OrderByDescending(e => e.ExecutedAt);

                var executions = await query
                    .Skip(request.Skip)
                    .Take(request.Take)
                    .Select(e => new EventExpressionExecutionDto
                    {
                        Id = e.Id,
                        EventExpressionId = e.EventExpressionId,
                        EventType = e.EventType,
                        ExecutedAt = e.ExecutedAt,
                        WasTriggered = e.WasTriggered,
                        SuppressedReason = e.SuppressedReason,
                        EventData = e.EventData,
                        NotificationId = e.NotificationId,
                        IssueTrackerId = e.IssueTrackerId,
                        Success = e.Success,
                        ErrorMessage = e.ErrorMessage,
                        ExecutionTimeMs = e.ExecutionTimeMs
                    })
                    .ToListAsync(cancellationToken);

                return FMSResponse<List<EventExpressionExecutionDto>>.Success(
                    executions, "Execution history fetched successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching executions for expression {Id}", request.ExpressionId);
                return FMSResponse<List<EventExpressionExecutionDto>>.SystemError(
                    $"Error fetching execution history: {ex.Message}");
            }
        }
    }
}
