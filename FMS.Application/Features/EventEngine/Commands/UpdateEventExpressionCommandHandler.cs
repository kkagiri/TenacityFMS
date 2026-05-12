/**
 * File: UpdateEventExpressionCommandHandler.cs
 * Purpose: Handles updating an existing EventExpression entity.
 * Dependencies: GpsdataContext, AutoMapper, ILogger, FMSResponse
 * Last Modified: 2026-02-11
 */

using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.EventEngine.DTOs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.EventEngine.Commands
{
    public class UpdateEventExpressionCommandHandler
        : IRequestHandler<UpdateEventExpressionCommand, FMSResponse<EventExpressionDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<UpdateEventExpressionCommandHandler> _logger;

        public UpdateEventExpressionCommandHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<UpdateEventExpressionCommandHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponse<EventExpressionDto>> Handle(
            UpdateEventExpressionCommand command,
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

                var entity = await _context.EventExpressions
                    .FirstOrDefaultAsync(e => e.Id == command.Id, cancellationToken);

                if (entity == null)
                    return FMSResponse<EventExpressionDto>.Failed(
                        $"Event expression with ID {command.Id} not found", "NOT_FOUND");

                // Check for duplicate name (excluding current entity)
                var duplicate = await _context.EventExpressions
                    .AnyAsync(e => e.Name == request.Name
                                && e.EventType == request.EventType
                                && e.Id != command.Id, cancellationToken);

                if (duplicate)
                    return FMSResponse<EventExpressionDto>.Failed(
                        $"An expression named '{request.Name}' already exists for event type '{request.EventType}'");

                // Update fields
                entity.Name = request.Name;
                entity.Description = request.Description;
                entity.IsActive = request.IsActive;
                entity.EventType = request.EventType;
                entity.SiteId = request.SiteId;
                entity.TankId = request.TankId;
                entity.DeviceId = request.DeviceId;
                entity.MinimumSeverity = request.MinimumSeverity;
                entity.Conditions = request.Conditions;
                entity.NotificationPolicyId = request.NotificationPolicyId;
                entity.CreateIssueTracker = request.CreateIssueTracker;
                entity.IssueCategory = request.IssueCategory;
                entity.IssuePriority = request.IssuePriority;
                entity.AssignIssueTo = request.AssignIssueTo;
                entity.CooldownMinutes = request.CooldownMinutes;
                entity.MaxNotificationsPerDay = request.MaxNotificationsPerDay;
                entity.EnableEscalation = request.EnableEscalation;
                entity.EscalationRules = request.EscalationRules;
                entity.MessageTemplate = request.MessageTemplate;
                entity.Priority = request.Priority;
                entity.CreateActiveEvent = request.CreateActiveEvent;
                entity.ModifiedBy = command.ModifiedBy;
                entity.ModifiedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync(cancellationToken);

                var dto = _mapper.Map<EventExpressionDto>(entity);
                return FMSResponse<EventExpressionDto>.Success(dto, "Event expression updated successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating event expression {Id}", command.Id);
                return FMSResponse<EventExpressionDto>.SystemError($"Error updating event expression: {ex.Message}");
            }
        }
    }
}
