/**
 * File: TaskController.cs
 * Purpose: Manages task CRUD, assignment, completion, and summary endpoints.
 * Dependencies: MediatR task commands/queries, FMSResponse, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - CreateTask(): Creates tasks with authenticated created-by metadata.
 * - AssignTask(): Assigns tasks and records assignment actor.
 * - GetTaskSummary(): Returns task summary with role-sensitive scoping.
 */
//Cursor - Create TaskController in FMS.WebClient/Controllers/
using System.Security.Claims;
using FMS.Application.Common;
using FMS.Application.Features.FMS.Task;
using FMS.Application.Features.TaskManagement.Commands;
using FMS.Application.Features.TaskManagement.Queries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers
{
    [Route("api/v1/[controller]")]
    [ApiController]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    [RequirePermission(Permissions.Admin.Users)]
    public class TaskController : ControllerBase
    {
        private readonly IMediator _mediator;

        public TaskController(IMediator mediator)
        {
            _mediator = mediator;
        }

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User.FindFirstValue(ClaimTypes.NameIdentifier) ??
                User.FindFirstValue("sub") ??
                string.Empty;

            return !string.IsNullOrWhiteSpace(userId);
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTasks([FromQuery] TaskFilterDTO filter)
        {
            try
            {
                var query = new GetTasksQuery { Filter = filter };
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while retrieving tasks"));
            }
        }

        [HttpGet("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTask(int id)
        {
            try
            {
                var query = new GetTaskByIdQuery { TaskId = id };
                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                    return Ok(result);

                return NotFound(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while retrieving the task"));
            }
        }

        [HttpPost]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateTask([FromBody] CreateTaskDTO taskDto)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new CreateTaskCommand
                {
                    Title = taskDto.Title,
                    Description = taskDto.Description,
                    Type = taskDto.Type,
                    Priority = taskDto.Priority,
                    AssignedTo = taskDto.AssignedTo,
                    DueDate = taskDto.DueDate,
                    SiteId = taskDto.SiteId,
                    TankId = taskDto.TankId,
                    SourceType = taskDto.SourceType,
                    SourceId = taskDto.SourceId,
                    CreatedBy = userId
                };

                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while creating the task"));
            }
        }

        [HttpPut("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> UpdateTask(int id, [FromBody] UpdateTaskDTO taskDto)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new UpdateTaskCommand
                {
                    Id = id,
                    Title = taskDto.Title,
                    Description = taskDto.Description,
                    Type = taskDto.Type,
                    Priority = taskDto.Priority,
                    Status = taskDto.Status,
                    AssignedTo = taskDto.AssignedTo,
                    DueDate = taskDto.DueDate,
                    SiteId = taskDto.SiteId,
                    TankId = taskDto.TankId,
                    CompletionNotes = taskDto.CompletionNotes,
                    UpdatedBy = userId
                };

                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while updating the task"));
            }
        }

        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteTask(int id)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new DeleteTaskCommand
                {
                    TaskId = id,
                    DeletedBy = userId
                };

                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while deleting the task"));
            }
        }

        [HttpPost("{id}/assign")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> AssignTask(int id, [FromBody] AssignTaskDTO assignment)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new AssignTaskCommand
                {
                    TaskId = id,
                    AssignedTo = assignment.AssignedTo,
                    DueDate = assignment.DueDate,
                    Notes = assignment.Notes,
                    AssignedBy = userId
                };

                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while assigning the task"));
            }
        }

        [HttpPost("{id}/complete")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CompleteTask(int id, [FromBody] CompleteTaskDTO completion)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var command = new CompleteTaskCommand
                {
                    TaskId = id,
                    CompletionNotes = completion.CompletionNotes,
                    CompletedOn = completion.CompletedOn ?? DateTime.UtcNow,
                    CompletedBy = userId
                };

                var result = await _mediator.Send(command);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while completing the task"));
            }
        }

        [HttpGet("my-tasks")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetMyTasks([FromQuery] bool includeCompleted = false)
        {
            try
            {
                if (!TryGetCurrentUserId(out var userId))
                    return Unauthorized();

                var query = new GetMyTasksQuery
                {
                    UserId = userId,
                    IncludeCompleted = includeCompleted
                };

                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while retrieving your tasks"));
            }
        }

        [HttpGet("summary")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetTaskSummary([FromQuery] int? siteId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate)
        {
            try
            {
                var userId = TryGetCurrentUserId(out var currentUserId) ? currentUserId : null;
                var userRole = User.FindFirst(ClaimTypes.Role)?.Value;

                var query = new GetTaskSummaryQuery
                {
                    UserId = userRole == "Admin" || userRole == "Supervisor" ? null : userId,
                    SiteId = siteId,
                    StartDate = startDate,
                    EndDate = endDate
                };

                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while retrieving task summary"));
            }
        }

        [HttpGet("overdue")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        [Authorize(Roles = "Admin,Supervisor")]
        public async Task<IActionResult> GetOverdueTasks([FromQuery] int? siteId, [FromQuery] string? assignedTo)
        {
            try
            {
                var query = new GetOverdueTasksQuery
                {
                    SiteId = siteId,
                    AssignedTo = assignedTo
                };

                var result = await _mediator.Send(query);

                if (result.IsSuccess)
                    return Ok(result);

                return BadRequest(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, FMSResponse<object>.SystemError("An error occurred while retrieving overdue tasks"));
            }
        }
    }
}
