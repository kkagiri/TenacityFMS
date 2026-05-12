using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Domain.Entities;
using FMS.Domain.Entities.Features.Notifications;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Commands {
    /// <summary>
    /// Command to create a new notification category
    /// </summary>
    public class CreateNotificationCategoryCommand : IRequest<FMSResponse<int>> {
        public CreateNotificationCategoryRequest Request { get; set; } = null!;
    }

    public class CreateNotificationCategoryCommandHandler : IRequestHandler<CreateNotificationCategoryCommand, FMSResponse<int>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateNotificationCategoryCommandHandler> _logger;

        public CreateNotificationCategoryCommandHandler (
            GpsdataContext context,
            ILogger<CreateNotificationCategoryCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<int>> Handle (CreateNotificationCategoryCommand command, CancellationToken cancellationToken) {
            try {
                var request = command.Request;

                // Check if category already exists
                var existing = await _context.NotificationCategories
                    .FirstOrDefaultAsync (c => c.Id == request.Id, cancellationToken);

                if (existing != null) {
                    return FMSResponse<int>.Failed ("Notification category with this ID already exists");
                }

                var category = new NotificationCategory {
                    Id = request.Id,
                    Name = request.Name,
                    Description = request.Description,
                    DefaultPriority = request.DefaultPriority,
                    IsActive = request.IsActive,
                    DisplayOrder = request.DisplayOrder,
                    IconClass = request.IconClass,
                    DefaultRequireAcknowledgment = request.DefaultRequireAcknowledgment,
                    DefaultDeliveryMethods = string.Join (",", request.DefaultDeliveryMethods),
                    CreatedBy = request.CreatedBy,
                    CreatedAt = DateTime.UtcNow
                };

                _context.NotificationCategories.Add (category);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Created notification category {Id} by user {CreatedBy}",
                    category.Id, request.CreatedBy);

                return FMSResponse<int>.Success (category.Id, "Notification category created successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating notification category {Id}",
                    command.Request.Id);
                return FMSResponse<int>.Failed ("Failed to create notification category");
            }
        }
    }
}