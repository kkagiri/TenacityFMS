 //Cursor - Create TaskController in FMS.WebClient/Controllers/
 using System.Security.Claims;
 using FMS.Application.Common;
 using FMS.Application.Features.TaskManagement.Commands;
 using FMS.Application.Features.TaskManagement.Queries;
 using FMS.Application.ModelsDTOs.FMS.Task;
 using MediatR;
 using Microsoft.AspNetCore.Authentication.JwtBearer;
 using Microsoft.AspNetCore.Authorization;
 using Microsoft.AspNetCore.Mvc;

 namespace FMS.WebClient.Controllers {
     [Route ("api/[controller]")]
     [ApiController]
     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

     public class TaskController : ControllerBase {
         private readonly IMediator _mediator;

         public TaskController (IMediator mediator) {
             _mediator = mediator;
         }

         [HttpGet]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> GetTasks ([FromQuery] TaskFilterDTO filter) {
             try {
                 var query = new GetTasksQuery { Filter = filter };
                 var result = await _mediator.Send (query);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while retrieving tasks"));
             }
         }

         [HttpGet ("{id}")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> GetTask (int id) {
             try {
                 var query = new GetTaskByIdQuery { TaskId = id };
                 var result = await _mediator.Send (query);

                 if (result.IsSuccess)
                     return Ok (result);

                 return NotFound (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while retrieving the task"));
             }
         }

         [HttpPost]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> CreateTask ([FromBody] CreateTaskDTO taskDto) {
             try {
                 var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                 if (string.IsNullOrEmpty (userId))
                     return Unauthorized ();

                 var command = new CreateTaskCommand {
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

                 var result = await _mediator.Send (command);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while creating the task"));
             }
         }

         [HttpPut ("{id}")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> UpdateTask (int id, [FromBody] UpdateTaskDTO taskDto) {
             try {
                 var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                 if (string.IsNullOrEmpty (userId))
                     return Unauthorized ();

                 var command = new UpdateTaskCommand {
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

                 var result = await _mediator.Send (command);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while updating the task"));
             }
         }

         [HttpDelete ("{id}")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> DeleteTask (int id) {
             try {
                 var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                 if (string.IsNullOrEmpty (userId))
                     return Unauthorized ();

                 var command = new DeleteTaskCommand {
                     TaskId = id,
                     DeletedBy = userId
                 };

                 var result = await _mediator.Send (command);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while deleting the task"));
             }
         }

         [HttpPost ("{id}/assign")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> AssignTask (int id, [FromBody] AssignTaskDTO assignment) {
             try {
                 var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                 if (string.IsNullOrEmpty (userId))
                     return Unauthorized ();

                 var command = new AssignTaskCommand {
                     TaskId = id,
                     AssignedTo = assignment.AssignedTo,
                     DueDate = assignment.DueDate,
                     Notes = assignment.Notes,
                     AssignedBy = userId
                 };

                 var result = await _mediator.Send (command);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while assigning the task"));
             }
         }

         [HttpPost ("{id}/complete")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> CompleteTask (int id, [FromBody] CompleteTaskDTO completion) {
             try {
                 var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                 if (string.IsNullOrEmpty (userId))
                     return Unauthorized ();

                 var command = new CompleteTaskCommand {
                     TaskId = id,
                     CompletionNotes = completion.CompletionNotes,
                     CompletedOn = completion.CompletedOn ?? DateTime.UtcNow,
                     CompletedBy = userId
                 };

                 var result = await _mediator.Send (command);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while completing the task"));
             }
         }

         [HttpGet ("my-tasks")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> GetMyTasks ([FromQuery] bool includeCompleted = false) {
             try {
                 var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                 if (string.IsNullOrEmpty (userId))
                     return Unauthorized ();

                 var query = new GetMyTasksQuery {
                     UserId = userId,
                     IncludeCompleted = includeCompleted
                 };

                 var result = await _mediator.Send (query);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while retrieving your tasks"));
             }
         }

         [HttpGet ("summary")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         public async Task<IActionResult> GetTaskSummary ([FromQuery] int? siteId, [FromQuery] DateTime? startDate, [FromQuery] DateTime? endDate) {
             try {
                 var userId = User.FindFirst (ClaimTypes.NameIdentifier)?.Value;
                 var userRole = User.FindFirst (ClaimTypes.Role)?.Value;

                 var query = new GetTaskSummaryQuery {
                     UserId = userRole == "Admin" || userRole == "Supervisor" ? null : userId,
                     SiteId = siteId,
                     StartDate = startDate,
                     EndDate = endDate
                 };

                 var result = await _mediator.Send (query);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while retrieving task summary"));
             }
         }

         [HttpGet ("overdue")]
         [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
         [Authorize (Roles = "Admin,Supervisor")]
         public async Task<IActionResult> GetOverdueTasks ([FromQuery] int? siteId, [FromQuery] string? assignedTo) {
             try {
             var query = new GetOverdueTasksQuery {
             SiteId = siteId,
             AssignedTo = assignedTo
                 };

                 var result = await _mediator.Send (query);

                 if (result.IsSuccess)
                     return Ok (result);

                 return BadRequest (result);
             } catch (Exception ex) {
                 return StatusCode (500, FMSResponse<object>.SystemError ("An error occurred while retrieving overdue tasks"));
             }
         }
     }
 }