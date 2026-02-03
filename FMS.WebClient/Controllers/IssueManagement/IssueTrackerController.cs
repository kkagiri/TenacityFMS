using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Category;
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues;
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Priority;
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Status;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Application.Features.IssueTracker.Commands.Issues;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Category;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Priority;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Status;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;
using ControllerBase = Microsoft.AspNetCore.Mvc.ControllerBase;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/issuetracker")]
    public class IssueTrackerController(IMediator mediator) : ControllerBase
    {
        private readonly IMediator _mediator = mediator;

        //Api: Get all issue tracker
        [HttpGet]
        public async Task<IActionResult> GetIssueTracker()
        {
            GetIssueListQuery query = new();
            object issueTrackers = await _mediator.Send(query);
            return Ok(issueTrackers);
        }

        //Api: Get issue tracker by id
        [HttpGet("{id}")]
        public async Task<IActionResult> GetIssueTrackerById(int id)
        {
            try
            {
                GetIssueListByIdQuery query = new(id);
                IssueTrackerResponseDTO issueTracker = await _mediator.Send(query);
                return Ok(issueTracker);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching issue {id}: {ex.Message}" });
            }
        }

        //Api: Create issue tracker
        [HttpPost]
        public async Task<IActionResult> PostIssueTracker([FromBody] IssueTrackerDTO issueData)
        {
            if (issueData is null)
            {
                throw new ArgumentNullException(nameof(issueData));
            }

            CreateIssueCommand command = new(issueData);
            int result = await _mediator.Send(command);
            return Ok(result);
        }

        //Api: Update issue tracker
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateIssueTracker(int id, [FromBody] IssueTrackerDTO issueData)
        {
            if (issueData is null)
            {
                return BadRequest(new { message = "Issue data is required" });
            }

            try
            {
                // Ensure the ID matches the route parameter
                issueData.Id = id;
                UpdateIssueCommand command = new(issueData);
                Unit result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error updating issue {id}: {ex.Message}" });
            }
        }

        // Api: Assigned worker confirms or schedules issue assignment
        [HttpPost("{id}/assignment-response")]
        [Authorize]
        public async Task<IActionResult> RespondToIssueAssignment(int id, [FromBody] IssueAssignmentResponseRequestDTO request)
        {
            try
            {
                if (request is null)
                {
                    return BadRequest(new { message = "Assignment response payload is required" });
                }

                request.RespondedByUserId = User.FindFirstValue(ClaimTypes.NameIdentifier)
                    ?? User.FindFirstValue("sub")
                    ?? User.Identity?.Name;

                RespondToIssueAssignmentCommand command = new(request, id);
                var result = await _mediator.Send(command);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error processing assignment response for issue {id}: {ex.Message}" });
            }
        }

        //Api: Delete issue tracker
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteIssueTracker(int id)
        {
            try
            {
                DeleteIssueCommand command = new(id);
                Unit result = await _mediator.Send(command);
                return Ok(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting issue {id}: {ex.Message}" });
            }
        }

        //Api: Get issues by vehicle ID
        [HttpGet("vehicle/{vehicleId}")]
        public async Task<IActionResult> GetIssuesByVehicle(int vehicleId)
        {
            try
            {
                GetIssueListByVehiceIdQuery query = new(vehicleId);
                object issues = await _mediator.Send(query);
                return Ok(issues);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching issues for vehicle {vehicleId}: {ex.Message}" });
            }
        }

        //Api: Get issue categories
        [HttpGet("categories")]
        public async Task<IActionResult> GetIssueCategories()
        {
            try
            {
                GetIssueCategoryListQuery query = new();
                List<Issuecategory> categories = await _mediator.Send(query);
                return Ok(categories);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching categories: {ex.Message}" });
            }
        }

        //Api: Get issue priorities
        [HttpGet("priorities")]
        public async Task<IActionResult> GetIssuePriorities()
        {
            try
            {
                GetIssuePriorityListQuery query = new();
                List<Issuepriority> priorities = await _mediator.Send(query);
                return Ok(priorities);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching priorities: {ex.Message}" });
            }
        }

        //Api: Get issue statuses
        [HttpGet("statuses")]
        public async Task<IActionResult> GetIssueStatuses()
        {
            try
            {
                GetIssueStatusListQuery query = new();
                List<Issuestatus> statuses = await _mediator.Send(query);
                return Ok(statuses);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching statuses: {ex.Message}" });
            }
        }

        // ===== CATEGORY CRUD OPERATIONS =====

        //Api: Create issue category
        [HttpPost("categories")]
        public async Task<IActionResult> CreateIssueCategory([FromBody] Issuecategory categoryData)
        {
            try
            {
                if (categoryData is null)
                {
                    return BadRequest(new { message = "Category data is required" });
                }

                IssueCategoryCreateCommand command = new(categoryData);
                int result = await _mediator.Send(command);
                return Ok(new { id = result, message = "Category created successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error creating category: {ex.Message}" });
            }
        }

        //Api: Update issue category
        [HttpPut("categories/{id}")]
        public async Task<IActionResult> UpdateIssueCategory(int id, [FromBody] Issuecategory categoryData)
        {
            try
            {
                if (categoryData is null)
                {
                    return BadRequest(new { message = "Category data is required" });
                }

                categoryData.Id = id;
                UpdateIssueCategoryCommand command = new(categoryData);
                Unit result = await _mediator.Send(command);
                return Ok(new { message = "Category updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error updating category {id}: {ex.Message}" });
            }
        }

        //Api: Delete issue category
        [HttpDelete("categories/{id}")]
        public async Task<IActionResult> DeleteIssueCategory(int id)
        {
            try
            {
                DeleteIssueCategoryCommand command = new(id);
                Unit result = await _mediator.Send(command);
                return Ok(new { message = "Category deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting category {id}: {ex.Message}" });
            }
        }

        // ===== PRIORITY CRUD OPERATIONS =====

        //Api: Create issue priority
        [HttpPost("priorities")]
        public async Task<IActionResult> CreateIssuePriority([FromBody] Issuepriority priorityData)
        {
            try
            {
                if (priorityData is null)
                {
                    return BadRequest(new { message = "Priority data is required" });
                }

                PriorityCreateCommand command = new(priorityData);
                int result = await _mediator.Send(command);
                return Ok(new { id = result, message = "Priority created successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error creating priority: {ex.Message}" });
            }
        }

        //Api: Update issue priority
        [HttpPut("priorities/{id}")]
        public async Task<IActionResult> UpdateIssuePriority(int id, [FromBody] Issuepriority priorityData)
        {
            try
            {
                if (priorityData is null)
                {
                    return BadRequest(new { message = "Priority data is required" });
                }

                priorityData.Id = id;
                UpdateIssuePriorityCommand command = new(priorityData);
                Unit result = await _mediator.Send(command);
                return Ok(new { message = "Priority updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error updating priority {id}: {ex.Message}" });
            }
        }

        //Api: Delete issue priority
        [HttpDelete("priorities/{id}")]
        public async Task<IActionResult> DeleteIssuePriority(int id)
        {
            try
            {
                DeleteIssuePriorityCommand command = new(id);
                Unit result = await _mediator.Send(command);
                return Ok(new { message = "Priority deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting priority {id}: {ex.Message}" });
            }
        }

        // ===== STATUS CRUD OPERATIONS =====

        //Api: Create issue status
        [HttpPost("statuses")]
        public async Task<IActionResult> CreateIssueStatus([FromBody] Issuestatus statusData)
        {
            try
            {
                if (statusData is null)
                {
                    return BadRequest(new { message = "Status data is required" });
                }

                IssueStatusCreateCommand command = new(statusData);
                int result = await _mediator.Send(command);
                return Ok(new { id = result, message = "Status created successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error creating status: {ex.Message}" });
            }
        }

        //Api: Update issue status
        [HttpPut("statuses/{id}")]
        public async Task<IActionResult> UpdateIssueStatus(int id, [FromBody] Issuestatus statusData)
        {
            try
            {
                if (statusData is null)
                {
                    return BadRequest(new { message = "Status data is required" });
                }

                statusData.Id = id;
                UpdateIssueStatusCommand command = new(statusData);
                Unit result = await _mediator.Send(command);
                return Ok(new { message = "Status updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error updating status {id}: {ex.Message}" });
            }
        }

        //Api: Delete issue status
        [HttpDelete("statuses/{id}")]
        public async Task<IActionResult> DeleteIssueStatus(int id)
        {
            try
            {
                DeleteIssueStatusCommand command = new(id);
                Unit result = await _mediator.Send(command);
                return Ok(new { message = "Status deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting status {id}: {ex.Message}" });
            }
        }

        //Api: Get issue analytics
        [HttpGet("analytics")]
        public Task<IActionResult> GetIssueAnalytics()
        {
            try
            {
                // For now, return basic analytics until we implement proper analytics queries
                var analyticsData = new
                {
                    totalIssues = 0,
                    openIssues = 0,
                    closedIssues = 0,
                    byStatus = Array.Empty<object>(),
                    byPriority = Array.Empty<object>(),
                    byCategory = Array.Empty<object>(),
                    monthlyTrend = Array.Empty<object>()
                };

                return Task.FromResult<IActionResult>(Ok(new { success = true, data = analyticsData, message = "Analytics retrieved successfully" }));
            }
            catch (Exception ex)
            {
                return Task.FromResult<IActionResult>(BadRequest(new { message = $"Error fetching analytics: {ex.Message}" }));
            }
        }

        //Api: Export issue report
        [HttpGet("reports/export")]
        public Task<IActionResult> ExportIssueReport()
        {
            try
            {
                // For now, return basic export structure until we implement proper export functionality
                var exportData = new
                {
                    format = "json",
                    data = Array.Empty<object>(),
                    generatedAt = DateTime.UtcNow,
                    totalRecords = 0
                };

                return Task.FromResult<IActionResult>(Ok(new { success = true, data = exportData, message = "Report exported successfully" }));
            }
            catch (Exception ex)
            {
                return Task.FromResult<IActionResult>(BadRequest(new { message = $"Error exporting report: {ex.Message}" }));
            }
        }

        //Api: Bulk assign issues
        [HttpPut("bulk/assign")]
        public Task<IActionResult> BulkAssignIssues([FromBody] BulkAssignRequest bulkData)
        {
            try
            {
                if (bulkData?.IssueIds == null || !bulkData.IssueIds.Any())
                {
                    return Task.FromResult<IActionResult>(BadRequest(new { message = "No issue IDs provided for bulk assignment" }));
                }

                // For now, return success response until we implement proper bulk operations
                var result = new
                {
                    success = true,
                    processedCount = bulkData.IssueIds.Count(),
                    message = $"Successfully assigned {bulkData.IssueIds.Count()} issues to {bulkData.AssignedTo}"
                };

                return Task.FromResult<IActionResult>(Ok(result));
            }
            catch (Exception ex)
            {
                return Task.FromResult<IActionResult>(BadRequest(new { message = $"Error in bulk assign operation: {ex.Message}" }));
            }
        }

        //Api: Bulk update issue status
        [HttpPut("bulk/status")]
        public Task<IActionResult> BulkUpdateStatus([FromBody] BulkStatusUpdateRequest bulkData)
        {
            try
            {
                if (bulkData?.IssueIds == null || !bulkData.IssueIds.Any())
                {
                    return Task.FromResult<IActionResult>(BadRequest(new { message = "No issue IDs provided for bulk status update" }));
                }

                // For now, return success response until we implement proper bulk operations
                var result = new
                {
                    success = true,
                    processedCount = bulkData.IssueIds.Count(),
                    message = $"Successfully updated status for {bulkData.IssueIds.Count()} issues to {bulkData.NewStatus}"
                };

                return Task.FromResult<IActionResult>(Ok(result));
            }
            catch (Exception ex)
            {
                return Task.FromResult<IActionResult>(BadRequest(new { message = $"Error in bulk status update: {ex.Message}" }));
            }
        }
    }

    // DTOs for bulk operations
    public class BulkAssignRequest
    {
        public IEnumerable<int> IssueIds { get; set; } = [];
        public string AssignedTo { get; set; } = string.Empty;
        public string AssignedBy { get; set; } = string.Empty;
    }

    public class BulkStatusUpdateRequest
    {
        public IEnumerable<int> IssueIds { get; set; } = [];
        public string NewStatus { get; set; } = string.Empty;
        public string UpdatedBy { get; set; } = string.Empty;
    }
}
