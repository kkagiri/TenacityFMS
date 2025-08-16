using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Commands {
    /// <summary>
    /// Command to update an existing notification category
    /// </summary>
    public class UpdateNotificationCategoryCommand : IRequest<FMSResponse<bool>> {
        public UpdateNotificationCategoryRequest Request { get; set; } = null!;
    }

    public class UpdateNotificationCategoryCommandHandler : IRequestHandler<UpdateNotificationCategoryCommand, FMSResponse<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateNotificationCategoryCommandHandler> _logger;

        public UpdateNotificationCategoryCommandHandler (
            GpsdataContext context,
            ILogger<UpdateNotificationCategoryCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle (UpdateNotificationCategoryCommand command, CancellationToken cancellationToken) {
            try {
                var request = command.Request;

                var category = await _context.NotificationCategories
                    .FirstOrDefaultAsync (c => c.Id == request.Id, cancellationToken);

                if (category == null) {
                    return FMSResponse<bool>.Failed ("Notification category not found");
                }

                // Update only provided fields
                if (!string.IsNullOrEmpty (request.Name)) {
                    category.Name = request.Name;
                }

                if (request.Description != null) {
                    category.Description = request.Description;
                }

                if (!string.IsNullOrEmpty (request.DefaultPriority)) {
                    category.DefaultPriority = request.DefaultPriority;
                }

                if (request.IsActive.HasValue) {
                    category.IsActive = request.IsActive.Value;
                }

                if (request.DisplayOrder.HasValue) {
                    category.DisplayOrder = request.DisplayOrder.Value;
                }

                if (request.IconClass != null) {
                    category.IconClass = request.IconClass;
                }

                if (request.DefaultRequireAcknowledgment.HasValue) {
                    category.DefaultRequireAcknowledgment = request.DefaultRequireAcknowledgment.Value;
                }

                if (request.DefaultDeliveryMethods != null) {
                    category.DefaultDeliveryMethods = string.Join (",", request.DefaultDeliveryMethods);
                }

                category.UpdatedBy = request.UpdatedBy;
                category.UpdatedAt = DateTime.UtcNow;

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Updated notification category {Id} by user {UpdatedBy}",
                    category.Id, request.UpdatedBy);

                return FMSResponse<bool>.Success (true, "Notification category updated successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating notification category {Id}",
                    command.Request.Id);
                return FMSResponse<bool>.Failed ("Failed to update notification category");
            }
        }
    }
}