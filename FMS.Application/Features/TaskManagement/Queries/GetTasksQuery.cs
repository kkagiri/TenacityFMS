using System;
using System.Collections.Generic;
using System.Linq;
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

namespace FMS.Application.Features.TaskManagement.Queries {
    public class GetTasksQuery : IRequest<FMSResponse<PagedResult<TaskDTO>>> {
        public TaskFilterDTO Filter { get; set; } = new ();
    }

    public class GetTaskByIdQuery : IRequest<FMSResponse<TaskDTO>> {
        public int TaskId { get; set; }
    }

    public class GetMyTasksQuery : IRequest<FMSResponse<List<TaskDTO>>> {
        public string UserId { get; set; } = null!;
        public bool IncludeCompleted { get; set; } = false;
    }

    public class GetTaskSummaryQuery : IRequest<FMSResponse<TaskSummaryDTO>> {
        public string? UserId { get; set; }
        public int? SiteId { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
    }

    public class GetOverdueTasksQuery : IRequest<FMSResponse<List<TaskDTO>>> {
        public int? SiteId { get; set; }
        public string? AssignedTo { get; set; }
    }

    public class PagedResult<T> {
        public List<T> Data { get; set; } = new ();
        public int TotalCount { get; set; }
        public int Page { get; set; }
        public int PageSize { get; set; }
        public int TotalPages => (int) Math.Ceiling ((double) TotalCount / PageSize);
        public bool HasNextPage => Page < TotalPages;
        public bool HasPreviousPage => Page > 1;
    }

    public class GetTasksQueryHandler : IRequestHandler<GetTasksQuery, FMSResponse<PagedResult<TaskDTO>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTasksQueryHandler> _logger;

        public GetTasksQueryHandler (GpsdataContext context, ILogger<GetTasksQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<PagedResult<TaskDTO>>> Handle (GetTasksQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting tasks with filter");

                var query = _context.Tasks.AsQueryable ();

                // Apply filters
                if (!string.IsNullOrWhiteSpace (request.Filter.SearchTerm)) {
                    query = query.Where (t => t.Title.Contains (request.Filter.SearchTerm) ||
                        t.Description.Contains (request.Filter.SearchTerm));
                }

                if (!string.IsNullOrWhiteSpace (request.Filter.AssignedTo)) {
                    query = query.Where (t => t.AssignedTo == request.Filter.AssignedTo);
                }

                if (request.Filter.Status != null && request.Filter.Status.Any ()) {
                    var statuses = request.Filter.Status.Select (s => Enum.Parse<TaskStatus> (s, true)).ToList ();
                    query = query.Where (t => statuses.Contains (t.Status));
                }

                if (request.Filter.Priorities != null && request.Filter.Priorities.Any ()) {
                    var priorities = request.Filter.Priorities.Select (p => Enum.Parse<TaskPriority> (p, true)).ToList ();
                    query = query.Where (t => priorities.Contains (t.Priority));
                }

                if (request.Filter.Types != null && request.Filter.Types.Any ()) {
                    var types = request.Filter.Types.Select (t => Enum.Parse<TaskType> (t, true)).ToList ();
                    query = query.Where (t => types.Contains (t.Type));
                }

                if (request.Filter.SiteIds != null && request.Filter.SiteIds.Any ()) {
                    query = query.Where (t => t.SiteId.HasValue && request.Filter.SiteIds.Contains (t.SiteId.Value));
                }

                if (request.Filter.TankIds != null && request.Filter.TankIds.Any ()) {
                    query = query.Where (t => t.TankId.HasValue && request.Filter.TankIds.Contains (t.TankId.Value));
                }

                if (request.Filter.StartDate.HasValue) {
                    query = query.Where (t => t.CreatedOn >= request.Filter.StartDate.Value);
                }

                if (request.Filter.EndDate.HasValue) {
                    query = query.Where (t => t.CreatedOn <= request.Filter.EndDate.Value);
                }

                if (request.Filter.OverdueOnly == true) {
                    query = query.Where (t => t.DueDate.HasValue && t.DueDate < DateTime.Now && t.Status != TaskStatus.Completed);
                }

                // Get total count before pagination
                var totalCount = await query.CountAsync (cancellationToken);

                // Apply sorting
                var isDescending = request.Filter.SortDirection?.ToLower () == "desc";
                query = request.Filter.SortBy?.ToLower () switch {
                    "title" => isDescending ? query.OrderByDescending (t => t.Title) : query.OrderBy (t => t.Title),
                    "priority" => isDescending ? query.OrderByDescending (t => t.Priority) : query.OrderBy (t => t.Priority),
                    "status" => isDescending ? query.OrderByDescending (t => t.Status) : query.OrderBy (t => t.Status),
                    "duedate" => isDescending ? query.OrderByDescending (t => t.DueDate) : query.OrderBy (t => t.DueDate),
                    "createdon" => isDescending ? query.OrderByDescending (t => t.CreatedOn) : query.OrderBy (t => t.CreatedOn),
                    _ => query.OrderByDescending (t => t.CreatedOn)
                };

                // Apply pagination
                var tasks = await query
                    .Skip ((request.Filter.Page - 1) * request.Filter.PageSize)
                    .Take (request.Filter.PageSize)
                    .ToListAsync (cancellationToken);

                var taskDtos = tasks.Select (t => new TaskDTO {
                    Id = t.Id,
                        Title = t.Title,
                        Description = t.Description,
                        Type = t.Type.ToString (),
                        Priority = t.Priority.ToString (),
                        Status = t.Status.ToString (),
                        AssignedTo = t.AssignedTo,
                        DueDate = t.DueDate,
                        SiteId = t.SiteId,
                        TankId = t.TankId,
                        SourceType = t.SourceType,
                        SourceId = t.SourceId,
                        CompletionNotes = t.CompletionNotes,
                        CreatedBy = t.CreatedBy,
                        CreatedOn = t.CreatedOn,
                        UpdatedBy = t.UpdatedBy,
                        UpdatedOn = t.UpdatedOn,
                        CompletedOn = t.CompletedOn
                }).ToList ();

                var result = new PagedResult<TaskDTO> {
                    Data = taskDtos,
                    TotalCount = totalCount,
                    Page = request.Filter.Page,
                    PageSize = request.Filter.PageSize
                };

                return FMSResponse<PagedResult<TaskDTO>>.Success (result, "Tasks retrieved successfully");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting tasks");
                return FMSResponse<PagedResult<TaskDTO>>.Failed ($"Error retrieving tasks: {ex.Message}");
            }
        }
    }

    public class GetTaskByIdQueryHandler : IRequestHandler<GetTaskByIdQuery, FMSResponse<TaskDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTaskByIdQueryHandler> _logger;

        public GetTaskByIdQueryHandler (GpsdataContext context, ILogger<GetTaskByIdQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<TaskDTO>> Handle (GetTaskByIdQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting task with ID: {TaskId}", request.TaskId);

                var task = await _context.Tasks
                    .FirstOrDefaultAsync (t => t.Id == request.TaskId, cancellationToken);

                if (task == null) {
                    return FMSResponse<TaskDTO>.Failed ($"Task with ID {request.TaskId} not found");
                }

                var taskDto = new TaskDTO {
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
                    CompletionNotes = task.CompletionNotes,
                    CreatedBy = task.CreatedBy,
                    CreatedOn = task.CreatedOn,
                    UpdatedBy = task.UpdatedBy,
                    UpdatedOn = task.UpdatedOn,
                    CompletedOn = task.CompletedOn
                };

                return FMSResponse<TaskDTO>.Success (taskDto, "Task retrieved successfully");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting task with ID: {TaskId}", request.TaskId);
                return FMSResponse<TaskDTO>.Failed ($"Error retrieving task: {ex.Message}");
            }
        }
    }

    public class GetMyTasksQueryHandler : IRequestHandler<GetMyTasksQuery, FMSResponse<List<TaskDTO>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetMyTasksQueryHandler> _logger;

        public GetMyTasksQueryHandler (GpsdataContext context, ILogger<GetMyTasksQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<TaskDTO>>> Handle (GetMyTasksQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting tasks for user: {UserId}", request.UserId);

                var query = _context.Tasks
                    .Where (t => t.AssignedTo == request.UserId);

                if (!request.IncludeCompleted) {
                    query = query.Where (t => t.Status != TaskStatus.Completed);
                }

                var tasks = await query
                    .OrderByDescending (t => t.Priority)
                    .ThenBy (t => t.DueDate)
                    .ToListAsync (cancellationToken);

                var taskDtos = tasks.Select (t => new TaskDTO {
                    Id = t.Id,
                        Title = t.Title,
                        Description = t.Description,
                        Type = t.Type.ToString (),
                        Priority = t.Priority.ToString (),
                        Status = t.Status.ToString (),
                        AssignedTo = t.AssignedTo,
                        DueDate = t.DueDate,
                        SiteId = t.SiteId,
                        TankId = t.TankId,
                        SourceType = t.SourceType,
                        SourceId = t.SourceId,
                        CompletionNotes = t.CompletionNotes,
                        CreatedBy = t.CreatedBy,
                        CreatedOn = t.CreatedOn,
                        UpdatedBy = t.UpdatedBy,
                        UpdatedOn = t.UpdatedOn,
                        CompletedOn = t.CompletedOn
                }).ToList ();

                return FMSResponse<List<TaskDTO>>.Success (taskDtos, $"Retrieved {taskDtos.Count} tasks for user");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting tasks for user: {UserId}", request.UserId);
                return FMSResponse<List<TaskDTO>>.Failed ($"Error retrieving user tasks: {ex.Message}");
            }
        }
    }

    public class GetTaskSummaryQueryHandler : IRequestHandler<GetTaskSummaryQuery, FMSResponse<TaskSummaryDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetTaskSummaryQueryHandler> _logger;

        public GetTaskSummaryQueryHandler (GpsdataContext context, ILogger<GetTaskSummaryQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<TaskSummaryDTO>> Handle (GetTaskSummaryQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting task summary");

                var query = _context.Tasks.AsQueryable ();

                // Apply filters
                if (!string.IsNullOrWhiteSpace (request.UserId)) {
                    query = query.Where (t => t.AssignedTo == request.UserId);
                }

                if (request.SiteId.HasValue) {
                    query = query.Where (t => t.SiteId == request.SiteId.Value);
                }

                if (request.StartDate.HasValue) {
                    query = query.Where (t => t.CreatedOn >= request.StartDate.Value);
                }

                if (request.EndDate.HasValue) {
                    query = query.Where (t => t.CreatedOn <= request.EndDate.Value);
                }

                var totalTasks = await query.CountAsync (cancellationToken);
                var pendingTasks = await query.CountAsync (t => t.Status == TaskStatus.Pending, cancellationToken);
                var inProgressTasks = await query.CountAsync (t => t.Status == TaskStatus.InProgress, cancellationToken);
                var completedTasks = await query.CountAsync (t => t.Status == TaskStatus.Completed, cancellationToken);
                var cancelledTasks = await query.CountAsync (t => t.Status == TaskStatus.Cancelled, cancellationToken);
                var overdueTasks = await query.CountAsync (t => t.DueDate.HasValue && t.DueDate < DateTime.Now && t.Status != TaskStatus.Completed, cancellationToken);

                var highPriorityTasks = await query.CountAsync (t => t.Priority == TaskPriority.High && t.Status != TaskStatus.Completed, cancellationToken);
                var tasksDueToday = await query.CountAsync (t => t.DueDate.HasValue && t.DueDate.Value.Date == DateTime.Today && t.Status != TaskStatus.Completed, cancellationToken);

                var summary = new TaskSummaryDTO {
                    TotalTasks = totalTasks,
                    PendingTasks = pendingTasks,
                    InProgressTasks = inProgressTasks,
                    CompletedTasks = completedTasks,
                    OverdueTasks = overdueTasks,
                    HighPriorityTasks = highPriorityTasks,
                    TasksDueToday = tasksDueToday
                };

                return FMSResponse<TaskSummaryDTO>.Success (summary, "Task summary retrieved successfully");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting task summary");
                return FMSResponse<TaskSummaryDTO>.Failed ($"Error retrieving task summary: {ex.Message}");
            }
        }
    }

    public class GetOverdueTasksQueryHandler : IRequestHandler<GetOverdueTasksQuery, FMSResponse<List<TaskDTO>>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetOverdueTasksQueryHandler> _logger;

        public GetOverdueTasksQueryHandler (GpsdataContext context, ILogger<GetOverdueTasksQueryHandler> logger) {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<List<TaskDTO>>> Handle (GetOverdueTasksQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Getting overdue tasks");

                var query = _context.Tasks
                    .Where (t => t.DueDate.HasValue && t.DueDate < DateTime.Now && t.Status != TaskStatus.Completed);

                if (request.SiteId.HasValue) {
                    query = query.Where (t => t.SiteId == request.SiteId.Value);
                }

                if (!string.IsNullOrWhiteSpace (request.AssignedTo)) {
                    query = query.Where (t => t.AssignedTo == request.AssignedTo);
                }

                var tasks = await query
                    .OrderByDescending (t => t.Priority)
                    .ThenBy (t => t.DueDate)
                    .ToListAsync (cancellationToken);

                var taskDtos = tasks.Select (t => new TaskDTO {
                    Id = t.Id,
                        Title = t.Title,
                        Description = t.Description,
                        Type = t.Type.ToString (),
                        Priority = t.Priority.ToString (),
                        Status = t.Status.ToString (),
                        AssignedTo = t.AssignedTo,
                        DueDate = t.DueDate,
                        SiteId = t.SiteId,
                        TankId = t.TankId,
                        SourceType = t.SourceType,
                        SourceId = t.SourceId,
                        CompletionNotes = t.CompletionNotes,
                        CreatedBy = t.CreatedBy,
                        CreatedOn = t.CreatedOn,
                        UpdatedBy = t.UpdatedBy,
                        UpdatedOn = t.UpdatedOn,
                        CompletedOn = t.CompletedOn
                }).ToList ();

                return FMSResponse<List<TaskDTO>>.Success (taskDtos, $"Retrieved {taskDtos.Count} overdue tasks");

            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting overdue tasks");
                return FMSResponse<List<TaskDTO>>.Failed ($"Error retrieving overdue tasks: {ex.Message}");
            }
        }
    }
}