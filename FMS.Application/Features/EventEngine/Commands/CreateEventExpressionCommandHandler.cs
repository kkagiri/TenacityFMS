/**
 * File: CreateEventExpressionCommandHandler.cs
 * Purpose: Handles creation of a new EventExpression entity.
 * Dependencies: GpsdataContext, AutoMapper, ILogger, FMSResponse
 * Last Modified: 2026-02-11
 */

using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.EventEngine.Commands
{
    public class CreateEventExpressionCommandHandler
        : IRequestHandler<CreateEventExpressionCommand, FMSResponse<EventExpressionDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<CreateEventExpressionCommandHandler> _logger;

        public CreateEventExpressionCommandHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<CreateEventExpressionCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<EventExpressionDto>> Handle(
            CreateEventExpressionCommand command,
            CancellationToken cancellationToken)
        {
            try
            {
                var request = command.Request;

                // Validation
                if (string.IsNullOrWhiteSpace(request.Name))
                    return FMSResponse<EventExpressionDto>.ValidationFailed(
                        new System.Collections.Generic.List<string> { "Name is required" });

                if (string.IsNullOrWhiteSpace(request.EventType))
                    return FMSResponse<EventExpressionDto>.ValidationFailed(
                        new System.Collections.Generic.List<string> { "EventType is required" });

                if (request.NotificationPolicyId <= 0)
                    return FMSResponse<EventExpressionDto>.ValidationFailed(
                        new System.Collections.Generic.List<string> { "NotificationPolicyId is required" });

                // Check for duplicate name within same event type
                var duplicate = await _context.EventExpressions
                    .AnyAsync(e => e.Name == request.Name && e.EventType == request.EventType, cancellationToken);

                if (duplicate)
                    return FMSResponse<EventExpressionDto>.Failed(
                        $"An expression named '{request.Name}' already exists for event type '{request.EventType}'");

                var entity = new EventExpression
                {
                    Name = request.Name,
                    Description = request.Description,
                    IsActive = request.IsActive,
                    EventType = request.EventType,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    DeviceId = request.DeviceId,
                    MinimumSeverity = request.MinimumSeverity,
                    Conditions = request.Conditions,
                    NotificationPolicyId = request.NotificationPolicyId,
                    CreateIssueTracker = request.CreateIssueTracker,
                    IssueCategory = request.IssueCategory,
                    IssuePriority = request.IssuePriority,
                    AssignIssueTo = request.AssignIssueTo,
                    CooldownMinutes = request.CooldownMinutes,
                    MaxNotificationsPerDay = request.MaxNotificationsPerDay,
                    EnableEscalation = request.EnableEscalation,
                    EscalationRules = request.EscalationRules,
                    MessageTemplate = request.MessageTemplate,
                    Priority = request.Priority,
                    CreateActiveEvent = request.CreateActiveEvent,
                    CreatedBy = command.CreatedBy,
                    CreatedAt = DateTime.UtcNow,
                    TriggerCount = 0
                };

                _context.EventExpressions.Add(entity);
                await _context.SaveChangesAsync(cancellationToken);

                var dto = _mapper.Map<EventExpressionDto>(entity);
                return FMSResponse<EventExpressionDto>.Success(dto, "Event expression created successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating event expression");
                return FMSResponse<EventExpressionDto>.SystemError($"Error creating event expression: {ex.Message}");
            }
        }
    }
}
