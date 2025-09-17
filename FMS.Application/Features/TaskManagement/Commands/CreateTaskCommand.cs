using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Task;
using FMS.Domain.Entities;
using FMS.Domain.Entities.enums;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using TaskStatus = FMS.Domain.Entities.enums.TaskStatus;

namespace FMS.Application.Features.TaskManagement.Commands {
    public class CreateTaskCommand : IRequest<FMSResponse<TaskDTO>> {
        public string Title { get; set; } = null!;
        public string Description { get; set; } = null!;
        public TaskType Type { get; set; }
        public TaskPriority Priority { get; set; }
        public string? AssignedTo { get; set; }
        public DateTime? DueDate { get; set; }
        public int? SiteId { get; set; }
        public int? TankId { get; set; }
        public string? SourceType { get; set; }
        public int? SourceId { get; set; }
        public string CreatedBy { get; set; } = null!;
    }

    public class CreateTaskCommandHandler (GpsdataContext context, ILogger<CreateTaskCommandHandler> logger) : IRequestHandler<CreateTaskCommand, FMSResponse<TaskDTO>> {
        public async Task<FMSResponse<TaskDTO>> Handle (CreateTaskCommand request, CancellationToken cancellationToken) {
            try {
                logger.LogInformation ("Creating new task with title: {Title}", request.Title);

                if (string.IsNullOrWhiteSpace (request.Title)) {
                    return FMSResponse<TaskDTO>.Failed ("Task title is required");
                }

                if (string.IsNullOrWhiteSpace (request.Description)) {
                    return FMSResponse<TaskDTO>.Failed ("Task description is required");
                }

                if (request.SiteId.HasValue) {
                    bool siteExists = await context.Sites
                        .AnyAsync (s => s.Id == request.SiteId.Value, cancellationToken);
                    if (!siteExists) {
                        return FMSResponse<TaskDTO>.Failed ($"Site with ID {request.SiteId} not found");
                    }
                }

                if (request.TankId.HasValue) {
                    bool tankExists = await context.Tanks
                        .AnyAsync (t => t.Id == request.TankId.Value, cancellationToken);
                    if (!tankExists) {
                        return FMSResponse<TaskDTO>.Failed ($"Tank with ID {request.TankId} not found");
                    }
                }

                TaskEntity task = new () {
                    Title = request.Title,
                    Description = request.Description,
                    Type = request.Type,
                    Priority = request.Priority,
                    Status = TaskStatus.Pending,
                    AssignedTo = request.AssignedTo,
                    DueDate = request.DueDate,
                    SiteId = request.SiteId,
                    TankId = request.TankId,
                    SourceType = request.SourceType,
                    SourceId = request.SourceId,
                    CreatedBy = request.CreatedBy,
                    CreatedOn = DateTime.UtcNow,
                    UpdatedBy = request.CreatedBy,
                    UpdatedOn = DateTime.UtcNow
                };

                context.Tasks.Add (task);
                await context.SaveChangesAsync (cancellationToken);

                logger.LogInformation ("Successfully created task with ID: {TaskId}", task.Id);

                TaskDTO taskDto = new () {
                    Id = task.Id,
                    Title = task.Title,
                    Description = task.Description,
                    Type = task.Type.ToString (),
                    Priority = task.Priority.ToString (),
                    Status = task.Status.ToString (),
                    AssignedTo = task.AssignedTo,
                    DueDate = task.DueDate,
                    SiteId = task.SiteId,
                    TankId = task.TankId,
                    SourceType = task.SourceType,
                    SourceId = task.SourceId,
                    CreatedBy = task.CreatedBy,
                    CreatedOn = task.CreatedOn,
                    UpdatedBy = task.UpdatedBy,
                    UpdatedOn = task.UpdatedOn
                };

                return FMSResponse<TaskDTO>.Success (taskDto, "Task created successfully");

            } catch (Exception ex) {
                logger.LogError (ex, "Error creating task with title: {Title}", request.Title);
                return FMSResponse<TaskDTO>.Failed ($"Error creating task: {ex.Message}");
            }
        }
    }
}