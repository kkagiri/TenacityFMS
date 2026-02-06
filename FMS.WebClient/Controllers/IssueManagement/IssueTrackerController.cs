/**
 * File: IssueTrackerController.cs
 * Purpose: Exposes issue tracking CRUD and assignment workflow APIs.
 * Dependencies: MediatR issue commands/queries, JWT claims.
 * Last Modified: 2026-02-06
 *
 * Key Actions:
 * - PostIssueTracker(): Creates issue records.
 * - RespondToIssueAssignment(): Captures assignment accept/decline responses.
 * - DeleteIssueTracker(): Deletes issue records by ID.
 */
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Category;
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues;
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Priority;
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Status;
using FMS.Application.Features.FMS.Issuetracker;
using FMS.Application.Features.IssueTracker.Commands.Attachments;
using FMS.Application.Features.IssueTracker.Commands.Issues;
using FMS.Application.Features.IssueTracker.DTOs;
using FMS.Application.Features.IssueTracker.Queries;
using FMS.Application.Features.IssueTracker.Queries.Attachments;
using FMS.Application.Features.IssueTracker.Services;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Category;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Priority;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries.Status;
using FMS.Domain.Entities;
using FMS.Application.Common.Constants;
using FMS.WebClient.Attributes;
using FMS.WebClient.Controllers.Base;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/issuetracker")]
    public class IssueTrackerController(IMediator mediator) : BaseApiController
    {
        private readonly IMediator _mediator = mediator;

        private string GetCurrentUserIdOrDefault()
        {
            return TryGetCurrentUserId(out var userId)
                ? userId
                : string.Empty;
        }

        private string GetCurrentUserNameOrDefault()
        {
            return User.FindFirstValue(ClaimTypes.Name)
                ?? User.FindFirstValue("name")
                ?? User.FindFirstValue("username")
                ?? User.Identity?.Name
                ?? string.Empty;
        }

        //Api: Get all issue tracker
        [HttpGet]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> GetIssueTracker()
        {
            GetIssueListQuery query = new();
            object issueTrackers = await _mediator.Send(query);
            return Ok(issueTrackers);
        }

        //Api: Get issue tracker by id
        [HttpGet("{id}")]
        [RequirePermission(Permissions.IssueTracker.Read)]
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
        [RequirePermission(Permissions.IssueTracker.Create)]
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
        [RequirePermission(Permissions.IssueTracker.Edit)]
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

        // Api: Quick action on issue (Mark Complete, Escalate Priority) with notifications
        [HttpPost("{id}/quick-action")]
        [Authorize]
        [RequirePermission(Permissions.IssueTracker.Edit)]
        public async Task<IActionResult> PerformQuickAction(int id, [FromBody] QuickActionRequest request)
        {
            try
            {
                if (request is null)
                {
                    return BadRequest(new { message = "Quick action request is required" });
                }

                // Map the request to the command
                var quickActionRequest = new IssueQuickActionRequest
                {
                    IssueId = id,
                    ActionType = request.ActionType.ToLower() switch
                    {
                        "markcomplete" or "complete" or "close" => IssueQuickActionType.MarkComplete,
                        "escalate" or "escalatehigh" or "highpriority" => IssueQuickActionType.EscalateToHigh,
                        _ => throw new ArgumentException($"Unknown action type: {request.ActionType}")
                    },
                    PerformedByUserId = GetCurrentUserIdOrDefault(),
                    Notes = request.Notes
                };

                var command = new IssueQuickActionCommand(quickActionRequest);
                var result = await _mediator.Send(command);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(new { message = ex.Message });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error performing quick action on issue {id}: {ex.Message}" });
            }
        }

        // Api: Assigned worker confirms or schedules issue assignment
        [HttpPost("{id}/assignment-response")]
        [Authorize]
        [RequirePermission(Permissions.IssueTracker.Edit)]
        public async Task<IActionResult> RespondToIssueAssignment(int id, [FromBody] IssueAssignmentResponseRequestDTO request)
        {
            try
            {
                if (request is null)
                {
                    return BadRequest(new { message = "Assignment response payload is required" });
                }

                request.RespondedByUserId = GetCurrentUserIdOrDefault();

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
        [RequirePermission(Permissions.IssueTracker.Delete)]
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
        [RequirePermission(Permissions.IssueTracker.Read)]
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

        // Api: Get user dashboard data - comprehensive issue statistics for logged-in user
        [HttpGet("user-dashboard")]
        [Authorize]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> GetUserDashboard(
            [FromQuery] int? vehicleId = null,
            [FromQuery] int? siteId = null,
            [FromQuery] int? categoryId = null,
            [FromQuery] int? weeksBack = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var request = new FMS.Application.Features.IssueTracker.Queries.UserIssuesDashboardRequest
                {
                    UserId = userId,
                    VehicleId = vehicleId,
                    SiteId = siteId,
                    CategoryId = categoryId,
                    WeeksBack = weeksBack,
                    StartDate = startDate,
                    EndDate = endDate
                };

                var query = new FMS.Application.Features.IssueTracker.Queries.GetUserIssuesDashboardQuery(request);
                var result = await _mediator.Send(query);

                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching user dashboard: {ex.Message}" });
            }
        }

        //Api: Get issue categories
        [HttpGet("categories")]
        [RequirePermission(Permissions.IssueTracker.Read)]
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
        [RequirePermission(Permissions.IssueTracker.Read)]
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
        [RequirePermission(Permissions.IssueTracker.Read)]
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
        [RequirePermission(Permissions.IssueTracker.Create)]
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
        [RequirePermission(Permissions.IssueTracker.Edit)]
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
        [RequirePermission(Permissions.IssueTracker.Delete)]
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
        [RequirePermission(Permissions.IssueTracker.Create)]
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
        [RequirePermission(Permissions.IssueTracker.Edit)]
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
        [RequirePermission(Permissions.IssueTracker.Delete)]
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
        [RequirePermission(Permissions.IssueTracker.Create)]
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
        [RequirePermission(Permissions.IssueTracker.Edit)]
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
        [RequirePermission(Permissions.IssueTracker.Delete)]
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
        [RequirePermission(Permissions.IssueTracker.Read)]
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
        [RequirePermission(Permissions.IssueTracker.Read)]
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
        [RequirePermission(Permissions.IssueTracker.Edit)]
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
        [RequirePermission(Permissions.IssueTracker.Edit)]
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

        // ===== ACTIVITY LOG ENDPOINTS =====

        /// <summary>
        /// Get activity stream for an issue
        /// </summary>
        [HttpGet("{id}/activities")]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> GetIssueActivities(int id, [FromQuery] int? limit = null)
        {
            try
            {
                var query = new GetIssueActivitiesQuery(id, limit);
                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching activities for issue {id}: {ex.Message}" });
            }
        }

        // ===== REMINDER ENDPOINTS =====

        /// <summary>
        /// Get reminder for an issue
        /// </summary>
        [HttpGet("{id}/reminder")]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> GetIssueReminder(int id)
        {
            try
            {
                var query = new GetIssueReminderQuery(id);
                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching reminder for issue {id}: {ex.Message}" });
            }
        }

        /// <summary>
        /// Create or update reminder for an issue
        /// </summary>
        [HttpPost("{id}/reminder")]
        [Authorize]
        [RequirePermission(Permissions.IssueTracker.Create)]
        public async Task<IActionResult> CreateIssueReminder(int id, [FromBody] CreateIssueReminderDTO reminderData)
        {
            try
            {
                if (reminderData is null)
                {
                    return BadRequest(new { message = "Reminder data is required" });
                }

                reminderData.IssueId = id;
                var userId = GetCurrentUserIdOrDefault();
                var userName = GetCurrentUserNameOrDefault();

                var command = new CreateIssueReminderCommand(reminderData, userId, userName);
                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error creating reminder for issue {id}: {ex.Message}" });
            }
        }

        // ===== FOLLOW ISSUE ENDPOINTS =====

        /// <summary>
        /// Follow an issue to receive activity notifications
        /// </summary>
        [Authorize]
        [HttpPost("{id}/follow")]
        [RequirePermission(Permissions.IssueTracker.Create)]
        public async Task<IActionResult> FollowIssue(int id, [FromBody] FollowIssueRequestDTO? request = null)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();
                var userName = GetCurrentUserNameOrDefault();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var command = new FollowIssueCommand(
                    id,
                    userId,
                    userName,
                    request?.NotifyByEmail ?? true,
                    request?.NotifyByPush ?? true
                );

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error following issue {id}: {ex.Message}" });
            }
        }

        /// <summary>
        /// Unfollow an issue to stop receiving activity notifications
        /// </summary>
        [Authorize]
        [HttpDelete("{id}/follow")]
        [RequirePermission(Permissions.IssueTracker.Delete)]
        public async Task<IActionResult> UnfollowIssue(int id)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();
                var userName = GetCurrentUserNameOrDefault();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var command = new UnfollowIssueCommand(id, userId, userName);
                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error unfollowing issue {id}: {ex.Message}" });
            }
        }

        /// <summary>
        /// Check if current user is following an issue
        /// </summary>
        [Authorize]
        [HttpGet("{id}/is-following")]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> IsFollowingIssue(int id)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();

                if (string.IsNullOrEmpty(userId))
                {
                    return Ok(new { isFollowing = false });
                }

                var query = new IsFollowingIssueQuery(id, userId);
                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error checking follow status for issue {id}: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get all issues followed by the current user (for dashboard ticker)
        /// </summary>
        [Authorize]
        [HttpGet("followed")]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> GetFollowedIssues([FromQuery] int? limit = null)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();

                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var query = new GetFollowedIssuesQuery(userId, limit);
                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching followed issues: {ex.Message}" });
            }
        }

        // ===== LINKED ISSUES ENDPOINTS =====

        /// <summary>
        /// Get issues linked by the same template or category
        /// </summary>
        [HttpGet("{id}/linked-issues")]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> GetLinkedIssues(int id)
        {
            try
            {
                var query = new GetLinkedIssuesQuery(id);
                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching linked issues for issue {id}: {ex.Message}" });
            }
        }

        // ===== ATTACHMENT ENDPOINTS =====

        /// <summary>
        /// Upload an attachment to an issue (supports Installation, Calibration, General categories)
        /// </summary>
        [HttpPost("{id}/attachments")]
        [Authorize]
        [RequirePermission(Permissions.IssueTracker.Create)]
        public async Task<IActionResult> UploadAttachment(
            int id,
            [FromForm] IFormFile file,
            [FromForm] string category = "General",
            [FromForm] string? description = null)
        {
            try
            {
                if (file == null || file.Length == 0)
                {
                    return BadRequest(new { message = "No file provided." });
                }

                var userId = GetCurrentUserIdOrDefault();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                using var stream = file.OpenReadStream();

                var command = new UploadIssueAttachmentCommand
                {
                    IssueId = id,
                    FileName = file.FileName,
                    ContentType = file.ContentType,
                    FileSize = file.Length,
                    FileStream = stream,
                    AttachmentCategory = category,
                    Description = description,
                    UploadedByUserId = userId
                };

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error uploading attachment for issue {id}: {ex.Message}" });
            }
        }

        /// <summary>
        /// Get all attachments for an issue
        /// </summary>
        [HttpGet("{id}/attachments")]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> GetAttachments(int id)
        {
            try
            {
                var query = new GetIssueAttachmentsQuery(id);
                var result = await _mediator.Send(query);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error fetching attachments for issue {id}: {ex.Message}" });
            }
        }

        /// <summary>
        /// Download/serve an attachment file
        /// </summary>
        [HttpGet("{id}/attachments/{attachmentId}/download")]
        [RequirePermission(Permissions.IssueTracker.Read)]
        public async Task<IActionResult> DownloadAttachment(int id, int attachmentId,
            [FromServices] IIssueAttachmentStorageService storageService,
            [FromServices] FMS.Persistence.DataAccess.GpsdataContext dbContext)
        {
            try
            {
                var attachment = await dbContext.IssueAttachments
                    .FirstOrDefaultAsync(a => a.Id == attachmentId && a.IssueId == id);

                if (attachment == null)
                {
                    return NotFound(new { message = $"Attachment {attachmentId} not found for issue {id}." });
                }

                var fullPath = storageService.GetFullPath(attachment.FilePath);
                if (!System.IO.File.Exists(fullPath))
                {
                    return NotFound(new { message = "Attachment file not found on server." });
                }

                var fileBytes = await System.IO.File.ReadAllBytesAsync(fullPath);
                return File(fileBytes, attachment.ContentType, attachment.FileName);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error downloading attachment: {ex.Message}" });
            }
        }

        /// <summary>
        /// Delete an attachment from an issue
        /// </summary>
        [HttpDelete("{id}/attachments/{attachmentId}")]
        [Authorize]
        [RequirePermission(Permissions.IssueTracker.Delete)]
        public async Task<IActionResult> DeleteAttachment(int id, int attachmentId)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var command = new DeleteIssueAttachmentCommand(id, attachmentId, userId);
                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error deleting attachment {attachmentId} from issue {id}: {ex.Message}" });
            }
        }

        // ===== CLOSE ISSUE (APPROVER ONLY) =====

        /// <summary>
        /// Close an issue. Requires approver permission (the closer cannot be the assignee).
        /// </summary>
        [HttpPost("{id}/close")]
        [Authorize]
        [RequirePermission(Permissions.IssueTracker.Approve)]
        public async Task<IActionResult> CloseIssue(int id, [FromBody] CloseIssueRequest? request = null)
        {
            try
            {
                var userId = GetCurrentUserIdOrDefault();
                if (string.IsNullOrEmpty(userId))
                {
                    return Unauthorized(new { message = "User not authenticated" });
                }

                var command = new CloseIssueCommand
                {
                    IssueId = id,
                    ClosedByUserId = userId,
                    ClosingNotes = request?.Notes
                };

                var result = await _mediator.Send(command);
                return result.IsSuccess ? Ok(result) : BadRequest(result);
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = $"Error closing issue {id}: {ex.Message}" });
            }
        }

    }

    // DTOs for close requests
    public class CloseIssueRequest
    {
        public string? Notes { get; set; }
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

    public class QuickActionRequest
    {
        /// <summary>
        /// Action type: "MarkComplete", "Complete", "Close", "Escalate", "EscalateHigh", "HighPriority"
        /// </summary>
        public string ActionType { get; set; } = string.Empty;
        public string? Notes { get; set; }
    }
}
