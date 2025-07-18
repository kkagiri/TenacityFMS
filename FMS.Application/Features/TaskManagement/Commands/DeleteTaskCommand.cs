using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = FMS.Domain.Entities.enums.TaskStatus;

namespace FMS.Application.Features.TaskManagement.Commands {
    public class DeleteTaskCommand : IRequest<FMSResponse<bool>> {
        public int TaskId { get; set; }
        public string DeletedBy { get; set; } = null!;
        public string? DeletionReason { get; set; }
    }

    public class DeleteTaskCommandHandler : IRequestHandler<DeleteTaskCommand, FMSResponse<bool>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteTaskCommandHandler> _logger;

        public DeleteTaskCommandHandler (GpsdataContext context, ILogger<DeleteTaskCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle (DeleteTaskCommand request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (string.IsNullOrWhiteSpace (request.DeletedBy)) {
                    return FMSResponse<bool>.ValidationFailed (new List<string> { "DeletedBy is required" });
                }

                _logger.LogInformation ("Deleting task with ID: {TaskId}", request.TaskId);

                var task = await _context.Tasks
                    .FirstOrDefaultAsync (t => t.Id == request.TaskId, cancellationToken);

                if (task == null) {
                    return FMSResponse<bool>.Failed ($"Task with ID {request.TaskId} not found");
                }

                // Prevent deletion of completed tasks unless specifically allowed
                if (task.Status == TaskStatus.Completed) {
                    return FMSResponse<bool>.Failed ("Cannot delete a completed task");
                }

                // Soft delete - mark as cancelled instead of physically removing
                task.Status = TaskStatus.Cancelled;
                task.UpdatedBy = request.DeletedBy;
                task.UpdatedOn = DateTime.UtcNow;

                var deletionNote = $"Task deleted by {request.DeletedBy} on {DateTime.UtcNow:yyyy-MM-dd HH:mm:ss}";
                if (!string.IsNullOrWhiteSpace (request.DeletionReason)) {
                    deletionNote += $". Reason: {request.DeletionReason}";
                }

                task.CompletionNotes = string.IsNullOrWhiteSpace (task.CompletionNotes) ?
                    deletionNote :
                    $"{task.CompletionNotes}\n\n{deletionNote}";

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Successfully deleted task with ID: {TaskId}", request.TaskId);

                return FMSResponse<bool>.Success (true, "Task deleted successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting task with ID: {TaskId}", request.TaskId);
                return FMSResponse<bool>.SystemError ($"Error deleting task: {ex.Message}");
            }
        }
    }
}