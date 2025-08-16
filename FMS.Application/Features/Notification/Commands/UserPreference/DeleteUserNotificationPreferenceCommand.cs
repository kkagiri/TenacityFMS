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
    /// Command to delete a user notification preference
    /// </summary>
    public class DeleteUserNotificationPreferenceCommand : IRequest<FMSResponse<bool>> {
        public int Id { get; set; }
        public string DeletedBy { get; set; } = null!;
    }

    public class DeleteUserNotificationPreferenceCommandHandler : IRequestHandler<DeleteUserNotificationPreferenceCommand, FMSResponse<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteUserNotificationPreferenceCommandHandler> _logger;

        public DeleteUserNotificationPreferenceCommandHandler (
            GpsdataContext context,
            ILogger<DeleteUserNotificationPreferenceCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle (DeleteUserNotificationPreferenceCommand command, CancellationToken cancellationToken) {
            try {
                var preference = await _context.UserNotificationPreferences
                    .FirstOrDefaultAsync (p => p.Id == command.Id, cancellationToken);

                if (preference == null) {
                    return FMSResponse<bool>.Failed ("User notification preference not found");
                }

                _context.UserNotificationPreferences.Remove (preference);
                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Deleted user notification preference {Id} by user {DeletedBy}",
                    command.Id, command.DeletedBy);

                return FMSResponse<bool>.Success (true, "User notification preference deleted successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting user notification preference {Id}",
                    command.Id);
                return FMSResponse<bool>.Failed ("Failed to delete user notification preference");
            }
        }
    }
}