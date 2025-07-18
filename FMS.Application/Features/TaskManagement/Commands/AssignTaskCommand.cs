using System;
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.TaskManagement.Helpers;
using FMS.Application.ModelsDTOs.FMS.Task;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = FMS.Domain.Entities.enums.TaskStatus;

namespace FMS.Application.Features.TaskManagement.Commands {
    public class AssignTaskCommand : IRequest<FMSResponse<TaskDTO>> {
        public int TaskId { get; set; }
        public string AssignedTo { get; set; } = null!;
        public DateTime? DueDate { get; set; }
        public string? Notes { get; set; }
        public string AssignedBy { get; set; } = null!;
    }

    public class AssignTaskCommandHandler : IRequestHandler<AssignTaskCommand, FMSResponse<TaskDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<AssignTaskCommandHandler> _logger;

        public AssignTaskCommandHandler (GpsdataContext context, ILogger<AssignTaskCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<TaskDTO>> Handle (AssignTaskCommand request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (string.IsNullOrWhiteSpace (request.AssignedTo)) {
                    return FMSResponse<TaskDTO>.ValidationFailed (new List<string> { "AssignedTo is required" });
                }

                if (string.IsNullOrWhiteSpace (request.AssignedBy)) {
                    return FMSResponse<TaskDTO>.ValidationFailed (new List<string> { "AssignedBy is required" });
                }

                _logger.LogInformation ("Assigning task {TaskId} to user: {AssignedTo}", request.TaskId, request.AssignedTo);

                var task = await _context.Tasks
                    .FirstOrDefaultAsync (t => t.Id == request.TaskId, cancellationToken);

                if (task == null) {
                    return FMSResponse<TaskDTO>.Failed ($"Task with ID {request.TaskId} not found");
                }

                // Check if task is already completed
                if (task.Status == TaskStatus.Completed) {
                    return FMSResponse<TaskDTO>.Failed ("Cannot assign a completed task");
                }

                task.AssignedTo = request.AssignedTo;
                task.AssignedBy = request.AssignedBy;
                task.AssignedOn = DateTime.UtcNow;
                task.DueDate = request.DueDate ?? task.DueDate;
                task.Status = TaskStatus.InProgress;
                task.UpdatedBy = request.AssignedBy;
                task.UpdatedOn = DateTime.UtcNow;

                if (!string.IsNullOrWhiteSpace (request.Notes)) {
                    task.Description += $"\n\nAssignment Notes: {request.Notes}";
                }

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Successfully assigned task {TaskId} to {AssignedTo}", request.TaskId, request.AssignedTo);

                TaskDTO taskDto = TaskMappingHelper.MapTaskToDto (task);
                return FMSResponse<TaskDTO>.Success (taskDto, "Task assigned successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error assigning task {TaskId} to {AssignedTo}", request.TaskId, request.AssignedTo);
                return FMSResponse<TaskDTO>.SystemError ($"Error assigning task: {ex.Message}");
            }
        }
    }
}