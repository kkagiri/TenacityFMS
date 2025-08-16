using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Commands {
    /// <summary>
    /// Command to delete a notification category
    /// </summary>
    public class DeleteNotificationCategoryCommand : IRequest<FMSResponse<bool>> {
        public int Id { get; set; }
    }

    public class DeleteNotificationCategoryCommandHandler : IRequestHandler<DeleteNotificationCategoryCommand, FMSResponse<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteNotificationCategoryCommandHandler> _logger;

        public DeleteNotificationCategoryCommandHandler (
            GpsdataContext context,
            ILogger<DeleteNotificationCategoryCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle (DeleteNotificationCategoryCommand command, CancellationToken cancellationToken) {
            try {
                var category = await _context.NotificationCategories
                    .FirstOrDefaultAsync (c => c.Id == command.Id, cancellationToken);

                if (category == null) {
                    return FMSResponse<bool>.Failed ("Notification category not found");
                }

                // Check if there are any preferences using this category
                var hasPreferences = await _context.UserNotificationPreferences
                    .AnyAsync (p => p.NotificationCategoryId == command.Id, cancellationToken);

                if (hasPreferences) {
                    // Soft delete by marking as inactive instead of hard delete
                    category.IsActive = false;
                    category.UpdatedAt = DateTime.UtcNow;
                    await _context.SaveChangesAsync (cancellationToken);

                    _logger.LogInformation ("Soft deleted notification category {Id} (marked as inactive)",
                        command.Id);

                    return FMSResponse<bool>.Success (true, "Notification category deactivated successfully (has existing preferences)");
                } else {
                    // Hard delete if no preferences are using it
                    _context.NotificationCategories.Remove (category);
                    await _context.SaveChangesAsync (cancellationToken);

                    _logger.LogInformation ("Hard deleted notification category {Id}",
                        command.Id);

                    return FMSResponse<bool>.Success (true, "Notification category deleted successfully");
                }
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting notification category {Id}",
                    command.Id);
                return FMSResponse<bool>.Failed ("Failed to delete notification category");
            }
        }
    }
}