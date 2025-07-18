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
    public class UpdateTaskCommand : IRequest<FMSResponse<TaskDTO>> {
        public int Id { get; set; }
        public string? Title { get; set; }
        public string? Description { get; set; }
        public TaskType? Type { get; set; }
        public TaskPriority? Priority { get; set; }
        public TaskStatus? Status { get; set; }
        public string? AssignedTo { get; set; }
        public DateTime? DueDate { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public string? CompletionNotes { get; set; }
        public string UpdatedBy { get; set; } = null!;
    }

    public class UpdateTaskCommandHandler : IRequestHandler<UpdateTaskCommand, FMSResponse<TaskDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdateTaskCommandHandler> _logger;

        public UpdateTaskCommandHandler (GpsdataContext context, ILogger<UpdateTaskCommandHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<TaskDTO>> Handle (UpdateTaskCommand request, CancellationToken cancellationToken) {
            try {
                // Validation
                if (string.IsNullOrWhiteSpace (request.UpdatedBy)) {
                    return FMSResponse<TaskDTO>.ValidationFailed (new List<string> { "UpdatedBy is required" });
                }

                _logger.LogInformation ("Updating task with ID: {TaskId}", request.Id);

                var task = await _context.Tasks
                    .FirstOrDefaultAsync (t => t.Id == request.Id, cancellationToken);

                if (task == null) {
                    return FMSResponse<TaskDTO>.Failed ($"Task with ID {request.Id} not found");
                }

                // Update only provided fields
                if (!string.IsNullOrWhiteSpace (request.Title)) {
                    task.Title = request.Title;
                }

                if (!string.IsNullOrWhiteSpace (request.Description)) {
                    task.Description = request.Description;
                }

                if (request.Type.HasValue) {
                    task.Type = request.Type.Value;
                }

                if (request.Priority.HasValue) {
                    task.Priority = request.Priority.Value;
                }

                if (request.Status.HasValue) {
                    task.Status = request.Status.Value;
                    if (request.Status.Value == TaskStatus.Completed) {
                        task.CompletedOn = DateTime.UtcNow;
                        task.CompletedBy = request.UpdatedBy;
                    }
                }

                if (request.AssignedTo != null) {
                    task.AssignedTo = request.AssignedTo;
                    if (!string.IsNullOrWhiteSpace (request.AssignedTo) && task.AssignedOn == null) {
                        task.AssignedOn = DateTime.UtcNow;
                        task.AssignedBy = request.UpdatedBy;
                    }
                }

                if (request.DueDate.HasValue) {
                    task.DueDate = request.DueDate;
                }

                if (request.SiteId.HasValue) {
                    var siteExists = await _context.Sites
                        .AnyAsync (s => s.Id == request.SiteId.Value, cancellationToken);
                    if (!siteExists) {
                        return FMSResponse<TaskDTO>.Failed ($"Site with ID {request.SiteId} not found");
                    }
                    task.SiteId = request.SiteId;
                }

                if (request.TankId.HasValue) {
                    var tankExists = await _context.Tanks
                        .AnyAsync (t => t.Id == request.TankId.Value, cancellationToken);
                    if (!tankExists) {
                        return FMSResponse<TaskDTO>.Failed ($"Tank with ID {request.TankId} not found");
                    }
                    task.TankId = request.TankId;
                }

                if (!string.IsNullOrWhiteSpace (request.CompletionNotes)) {
                    task.CompletionNotes = request.CompletionNotes;
                }

                task.UpdatedBy = request.UpdatedBy;
                task.UpdatedOn = DateTime.UtcNow;

                await _context.SaveChangesAsync (cancellationToken);

                _logger.LogInformation ("Successfully updated task with ID: {TaskId}", task.Id);

                var taskDto = TaskMappingHelper.MapTaskToDto (task);
                return FMSResponse<TaskDTO>.Success (taskDto, "Task updated successfully");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating task with ID: {TaskId}", request.Id);
                return FMSResponse<TaskDTO>.SystemError ($"Error updating task: {ex.Message}");
            }
        }
    }
}