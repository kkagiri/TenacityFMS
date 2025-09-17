using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Task;
using FMS.Application.Features.TaskManagement.Helpers;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = FMS.Domain.Entities.enums.TaskStatus;

namespace FMS.Application.Features.TaskManagement.Commands {
    public class CompleteTaskCommand : IRequest<FMSResponse<TaskDTO>> {
        public int TaskId { get; set; }
        public string CompletionNotes { get; set; } = null!;
        public DateTime? CompletedOn { get; set; }
        public string CompletedBy { get; set; } = null!;
    }

    public class CompleteTaskCommandHandler : IRequestHandler<CompleteTaskCommand, FMSResponse<TaskDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<CompleteTaskCommandHandler> _logger;

        public CompleteTaskCommandHandler (GpsdataContext context, ILogger<CompleteTaskCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<TaskDTO>> Handle (CompleteTaskCommand request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (string.IsNullOrWhiteSpace (request.CompletedBy)) {
                    return FMSResponse<TaskDTO>.ValidationFailed (new List<string> { "CompletedBy is required" });
                }

                if (string.IsNullOrWhiteSpace (request.CompletionNotes)) {
                    return FMSResponse<TaskDTO>.ValidationFailed (new List<string> { "CompletionNotes is required" });
                }

                _logger.LogInformation ("Completing task with ID: {TaskId}", request.TaskId);

                var task = await _context.Tasks
                    .FirstOrDefaultAsync (t => t.Id == request.TaskId, cancellationToken);

                if (task == null) {
                    return FMSResponse<TaskDTO>.Failed ($"Task with ID {request.TaskId} not found");
                }

                if (task.Status == TaskStatus.Completed) {
                    return FMSResponse<TaskDTO>.Failed ("Task is already completed");
                }

                if (task.Status == TaskStatus.Cancelled) {
                    return FMSResponse<TaskDTO>.Failed ("Cannot complete a cancelled task");
                }

                task.Status = TaskStatus.Completed;
                task.CompletionNotes = request.CompletionNotes;
                task.CompletedBy = request.CompletedBy;
                task.CompletedOn = request.CompletedOn ?? DateTime.UtcNow;
                task.UpdatedBy = request.CompletedBy;
                task.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Successfully completed task with ID: {TaskId}", request.TaskId);

                TaskDTO taskDto = TaskMappingHelper.MapTaskToDto (task);
                return FMSResponse<TaskDTO>.Success (taskDto, "Task completed successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error completing task with ID: {TaskId}", request.TaskId);
                return FMSResponse<TaskDTO>.SystemError ($"Error completing task: {ex.Message}");
            }
        }
    }
}