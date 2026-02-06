/**
 * File: DashboardController.cs
 * Purpose: Manages dashboard widgets, layouts, and data source orchestration endpoints.
 * Dependencies: MediatR, widget services, GpsdataContext, JWT claims.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - GetWidgetTemplates(): Returns available widgets for the current user.
 * - CreateWidgetInstance(): Creates widget instances in a user's dashboard.
 * - SaveLayout(): Persists dashboard layout state per user.
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.Dashboard;
using FMS.Application.Common;
using FMS.Application.Features.Dashboard;
using FMS.Application.Features.Dashboard.Command;
using FMS.Application.Features.Dashboard.Commands;
using FMS.Application.Features.Dashboard.DTOs;
using FMS.Application.Queries.Database.Dashboard;
using FMS.Application.Services.Dashboard;
using FMS.Domain.Entities.Dashboard;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]
    [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class DashboardController : ControllerBase
    {
        private readonly IMediator _mediator;
        // Deprecated: IWidgetDataService
        // private readonly IWidgetDataService _widgetDataService;
        private readonly IWidgetFactoryService _widgetFactoryService;
        private readonly IDataSourceManager _dataSourceManager;
        private readonly ILogger<DashboardController> _logger;
        private readonly GpsdataContext _context;

        public DashboardController(
            IMediator mediator,
            // IWidgetDataService widgetDataService,
            IWidgetFactoryService widgetFactoryService,
            IDataSourceManager dataSourceManager,
            ILogger<DashboardController> logger,
            GpsdataContext context)
        {
            _mediator = mediator;
            // _widgetDataService = widgetDataService;
            _widgetFactoryService = widgetFactoryService;
            _dataSourceManager = dataSourceManager;
            _logger = logger;
            _context = context;
        }

        private bool TryGetCurrentUserId(out string userId)
        {
            userId = User?.FindFirstValue(ClaimTypes.NameIdentifier)
                ?? User?.FindFirstValue("sub")
                ?? string.Empty;

            return !string.IsNullOrWhiteSpace(userId);
        }

        private string GetCurrentUserIdOrDefault(string fallback = "system")
        {
            return TryGetCurrentUserId(out var userId) ? userId : fallback;
        }

        private string CurrentUserId => GetCurrentUserIdOrDefault(User?.Identity?.Name ?? "system");
        private string CurrentActor => User?.Identity?.Name ?? "system";

        // ===== WIDGET MANAGEMENT ENDPOINTS =====

        /// <summary>
        /// Get available widget templates for the current user
        /// </summary>
        [HttpGet("widgets/templates")]
        public async Task<ActionResult<FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>>>> GetWidgetTemplates(
            [FromQuery] string? category = null, [FromQuery] bool onlyEnabled = true)
        {
            string userId = CurrentUserId;
            FMSResponseMessage<IEnumerable<DashboardWidgetTemplateDto>> result = await _mediator.Send(new GetWidgetTemplatesQuery(userId, category, onlyEnabled));
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Get user's widget instances
        /// </summary>
        [HttpGet("widgets/instances")]
        public async Task<ActionResult<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>>>> GetWidgetInstances(
            [FromQuery] string? category = null)
        {
            string userId = CurrentUserId;
            FMSResponseMessage<IEnumerable<DashboardWidgetInstanceDto>> result = await _mediator.Send(new GetUserWidgetInstancesQuery(userId, category));
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Get specific widget instance
        /// </summary>
        [HttpGet("widgets/instances/{widgetInstanceId}")]
        public async Task<ActionResult<FMSResponseMessage<DashboardWidgetInstanceDto>>> GetWidgetInstance(int widgetInstanceId)
        {
            string userId = CurrentUserId;
            FMSResponseMessage<DashboardWidgetInstanceDto> result = await _mediator.Send(new GetWidgetInstanceQuery(userId, widgetInstanceId));
            if (!result.Success)
            {
                return NotFound(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Create a new widget instance
        /// </summary>
        [HttpPost("widgets/instances")]
        public async Task<ActionResult<FMSResponseMessage<DashboardWidgetInstanceDto>>> CreateWidgetInstance(
            [FromBody] WidgetConfigurationDto configuration)
        {
            if (configuration == null)
            {
                return BadRequest(new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    false, "Invalid widget configuration", null!));
            }

            string userId = CurrentUserId;
            FMSResponseMessage<DashboardWidgetInstanceDto> result = await _mediator.Send(new CreateWidgetInstanceCommand(userId, configuration, CurrentActor));
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return CreatedAtAction(nameof(GetWidgetInstance), new { widgetInstanceId = result.Data?.Id }, result);
        }

        /// <summary>
        /// Update an existing widget instance
        /// </summary>
        [HttpPut("widgets/instances/{widgetInstanceId}")]
        public async Task<ActionResult<FMSResponseMessage<DashboardWidgetInstanceDto>>> UpdateWidgetInstance(
            int widgetInstanceId, [FromBody] WidgetConfigurationDto configuration)
        {
            if (configuration == null)
            {
                return BadRequest(new FMSResponseMessage<DashboardWidgetInstanceDto>(
                    false, "Invalid widget configuration", null!));
            }

            string userId = CurrentUserId;
            FMSResponseMessage<DashboardWidgetInstanceDto> result = await _mediator.Send(new UpdateWidgetInstanceCommand(userId, widgetInstanceId, configuration, CurrentActor));
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        /// <summary>
        /// Delete a widget instance
        /// </summary>
        [HttpDelete("widgets/instances/{widgetInstanceId}")]
        public async Task<ActionResult<FMSResponseMessage<bool>>> DeleteWidgetInstance(int widgetInstanceId)
        {
            string userId = CurrentUserId;
            FMSResponseMessage<bool> result = await _mediator.Send(new DeleteWidgetInstanceCommand(userId, widgetInstanceId, CurrentActor));
            if (!result.Success)
            {
                return BadRequest(result);
            }
            return Ok(result);
        }

        // ===== WIDGET DATA ENDPOINTS =====

        /// <summary>
        /// Get data for a specific widget
        /// </summary>
        [HttpGet("widgets/{widgetInstanceId}/data")]
        public async Task<ActionResult<WidgetDataResponseDto>> GetWidgetData(int widgetInstanceId)
        {
            string userId = CurrentUserId;
            // Load widget configuration
            var widgetInstance = await _context.DashboardWidgetInstances
                .Include(w => w.Template)
                .FirstOrDefaultAsync(w => w.Id == widgetInstanceId && w.UserId == userId && w.IsVisible);

            if (widgetInstance == null)
            {
                return Ok(new WidgetDataResponseDto
                {
                    WidgetInstanceId = widgetInstanceId,
                    WidgetType = "unknown",
                    ErrorMessage = "Widget instance not found or not visible",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // Parse configuration safely
            Dictionary<string, object> configuration;
            try
            {
                configuration = JsonConvert.DeserializeObject<Dictionary<string, object>>(widgetInstance.ConfigurationJson) ??
                    new Dictionary<string, object>();
            }
            catch
            {
                configuration = new Dictionary<string, object>();
            }

            var widgetType = widgetInstance.Template?.WidgetType ??
                configuration.GetValueOrDefault("widgetType", widgetInstance.WidgetType)?.ToString() ??
                "unknown";

            var dataSource = widgetInstance.Template?.DataSource ??
                configuration.GetValueOrDefault("dataSource", null)?.ToString();

            if (string.IsNullOrWhiteSpace(dataSource))
            {
                return Ok(new WidgetDataResponseDto
                {
                    WidgetInstanceId = widgetInstanceId,
                    WidgetType = widgetType,
                    ErrorMessage = "Widget data source not defined",
                    LastUpdated = DateTime.UtcNow
                });
            }

            // Build a request for IDataSourceManager
            var metricRequest = new DashboardMetricRequestDto
            {
                MetricType = dataSource,
                Mode = configuration.GetValueOrDefault("mode", "historical_snapshot")?.ToString() ?? "historical_snapshot",
                DatePreset = configuration.GetValueOrDefault("datePreset", "last_7_days")?.ToString() ?? "last_7_days"
            };
            if (configuration.TryGetValue("siteIds", out var siteIdsObj) && siteIdsObj is IEnumerable<object> siteIds)
            {
                metricRequest.SiteIds = siteIds.Select(s => Convert.ToInt32(s)).ToList();
            }
            if (configuration.TryGetValue("vehicleIds", out var vehicleIdsObj) && vehicleIdsObj is IEnumerable<object> vehicleIds)
            {
                metricRequest.VehicleIds = vehicleIds.Select(v => Convert.ToInt32(v)).ToList();
            }
            if (configuration.TryGetValue("startDate", out var startDateObj) && startDateObj is DateTime startDate)
            {
                metricRequest.StartDate = startDate;
            }
            if (configuration.TryGetValue("endDate", out var endDateObj) && endDateObj is DateTime endDate)
            {
                metricRequest.EndDate = endDate;
            }

            // Fetch metric + time series via DataSourceManager
            var initial = await _dataSourceManager.GetInitialDataAsync(dataSource, metricRequest);
            // Transform for widget rendering
            var transformed = await _dataSourceManager.TransformDataForWidgetType(widgetType, initial, configuration);

            return Ok(new WidgetDataResponseDto
            {
                WidgetInstanceId = widgetInstanceId,
                WidgetType = widgetType,
                Data = transformed,
                LastUpdated = DateTime.UtcNow
            });
        }

        /// <summary>
        /// Get data for all user's widgets
        /// </summary>
        [HttpGet("widgets/data")]
        public async Task<ActionResult<List<WidgetDataResponseDto>>> GetAllWidgetData()
        {
            string userId = CurrentUserId;
            var widgetInstances = await _context.DashboardWidgetInstances
                .Include(w => w.Template)
                .Where(w => w.UserId == userId && w.IsVisible)
                .ToListAsync();

            var results = new List<WidgetDataResponseDto>(widgetInstances.Count);
            foreach (var widgetInstance in widgetInstances)
            {
                var single = await GetWidgetData(widgetInstance.Id);
                if (single.Result is OkObjectResult ok && ok.Value is WidgetDataResponseDto dto)
                {
                    results.Add(dto);
                }
            }
            return Ok(results);
        }

        /// <summary>
        /// Refresh data for a specific widget
        /// </summary>
        [HttpPost("widgets/{widgetInstanceId}/refresh")]
        public async Task<ActionResult<WidgetDataResponseDto>> RefreshWidgetData(int widgetInstanceId)
        {
            // For now, just call GetWidgetData to refresh from source
            return await GetWidgetData(widgetInstanceId);
        }

        // ===== WIDGET SHARING ENDPOINTS =====

        /// <summary>
        /// Share a widget with other users
        /// Creates new widget instances for each target user
        /// </summary>
        [HttpPost("widgets/{widgetInstanceId}/share")]
        public async Task<ActionResult<FMSResponseMessage<ShareWidgetResponseDto>>> ShareWidget(
            int widgetInstanceId,
            [FromBody] List<string> targetUserIds)
        {
            if (targetUserIds == null || !targetUserIds.Any())
            {
                return BadRequest(new FMSResponseMessage<ShareWidgetResponseDto>(
                    false,
                    "No target users specified",
                    null!
                ));
            }

            string userId = CurrentUserId;
            var request = new ShareWidgetRequestDto
            {
                WidgetInstanceId = widgetInstanceId,
                TargetUserIds = targetUserIds,
                AllowEdit = true // As per requirements, shared users can edit parameters
            };

            var result = await _mediator.Send(new ShareWidgetCommand(
                userId,
                request,
                CurrentActor
            ));

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get list of users a widget has been shared with (for original owner)
        /// </summary>
        [HttpGet("widgets/{widgetInstanceId}/shares")]
        public async Task<ActionResult<FMSResponseMessage<List<SharedWithUserDto>>>> GetWidgetShares(int widgetInstanceId)
        {
            string userId = CurrentUserId;
            var result = await _mediator.Send(new GetWidgetSharesQuery(userId, widgetInstanceId));

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get widgets that have been shared with the current user
        /// </summary>
        [HttpGet("widgets/shared-with-me")]
        public async Task<ActionResult<FMSResponseMessage<IEnumerable<DashboardWidgetInstanceWithSharingDto>>>> GetSharedWidgets(
            [FromQuery] string? category = null)
        {
            string userId = CurrentUserId;
            var result = await _mediator.Send(new GetSharedWidgetsQuery(userId, category));

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Remove a shared widget (for the user who received it)
        /// </summary>
        [HttpDelete("widgets/{sharedWidgetInstanceId}/unshare")]
        public async Task<ActionResult<FMSResponseMessage<bool>>> UnshareWidget(int sharedWidgetInstanceId)
        {
            string userId = CurrentUserId;
            var result = await _mediator.Send(new UnshareWidgetCommand(
                userId,
                sharedWidgetInstanceId,
                CurrentActor
            ));

            if (!result.Success)
            {
                return BadRequest(result);
            }

            return Ok(result);
        }

        /// <summary>
        /// Get all users in the system (for sharing selection)
        /// </summary>
        [HttpGet("users")]
        public async Task<ActionResult<List<object>>> GetUsersForSharing()
        {
            try
            {
                string currentUserId = CurrentUserId;

                var users = await _context.Users
                    .Where(u => u.Id != currentUserId) // Exclude current user
                    .Select(u => new
                    {
                        id = u.Id,
                        userName = u.UserName,
                        email = u.Email,
                        displayName = u.UserName ?? u.Email ?? u.Id
                    })
                    .Take(100) // Limit to 100 users for performance
                    .ToListAsync();

                return Ok(users);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error retrieving users for sharing");
                return StatusCode(500, new { error = "Error retrieving users" });
            }
        }

        // ===== DASHBOARD LAYOUT ENDPOINTS =====

        /// <summary>
        /// Get user's dashboard layout configuration
        /// </summary>
        [HttpGet("layout")]
        public async Task<ActionResult<CategoryGroupedLayoutDto>> GetDashboardLayout()
        {
            try
            {
                string userId = CurrentUserId;

                var layout = await _context.UserDashboardLayouts
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.IsActive);

                if (layout == null)
                {
                    // Return default layout
                    return Ok(new CategoryGroupedLayoutDto
                    {
                        LayoutName = "Category Grouped Dashboard",
                        CategoryOrder = new string[0],
                        WidgetOrder = new Dictionary<string, string[]>(),
                        WidgetSizes = new Dictionary<string, WidgetSizeDto>(),
                        Version = "1.0",
                        LastUpdated = DateTime.UtcNow
                    });
                }

                // Parse the stored JSON layout
                var parsedLayout = JsonConvert.DeserializeObject<CategoryGroupedLayoutDto>(layout.LayoutJson);
                if (parsedLayout != null)
                {
                    parsedLayout.LastUpdated = layout.UpdatedAt;
                    return Ok(parsedLayout);
                }

                // Fallback to default if parsing fails
                return Ok(new CategoryGroupedLayoutDto());
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard layout for user {UserId}", CurrentUserId);
                return StatusCode(500, new { success = false, message = "Error retrieving dashboard layout" });
            }
        }

        /// <summary>
        /// Save user's dashboard layout configuration
        /// </summary>
        [HttpPost("layout")]
        public async Task<ActionResult<object>> SaveDashboardLayout([FromBody] SaveCategoryGroupedLayoutDto request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest(new { success = false, message = "Layout data is required" });
                }

                string userId = CurrentUserId;

                // Convert DTO to full layout object for storage
                var layoutData = new CategoryGroupedLayoutDto
                {
                    LayoutName = request.LayoutName,
                    CategoryOrder = request.CategoryOrder,
                    WidgetOrder = request.WidgetOrder,
                    WidgetSizes = request.WidgetSizes,
                    Version = request.Version,
                    LastUpdated = DateTime.UtcNow
                };

                var layoutJson = JsonConvert.SerializeObject(layoutData, Formatting.Indented);

                // Find existing active layout or create new one
                var existingLayout = await _context.UserDashboardLayouts
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.IsActive);

                if (existingLayout != null)
                {
                    // Update existing layout
                    existingLayout.LayoutName = request.LayoutName;
                    existingLayout.LayoutJson = layoutJson;
                    existingLayout.UpdatedAt = DateTime.UtcNow;
                    existingLayout.UpdatedBy = CurrentActor;
                }
                else
                {
                    // Create new layout
                    var newLayout = new UserDashboardLayout
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        LayoutName = request.LayoutName,
                        LayoutJson = layoutJson,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = CurrentActor,
                        UpdatedBy = CurrentActor
                    };

                    _context.UserDashboardLayouts.Add(newLayout);
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Dashboard layout saved for user {UserId}", userId);

                return Ok(new
                {
                    success = true,
                    message = "Dashboard layout saved successfully",
                    layout = layoutData,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error saving dashboard layout for user {UserId}", CurrentUserId);
                return StatusCode(500, new { success = false, message = "Error saving dashboard layout" });
            }
        }

        /// <summary>
        /// Update individual widget size in the layout
        /// </summary>
        [HttpPut("layout/widget-size/{widgetInstanceId}")]
        public async Task<ActionResult<object>> UpdateWidgetSize(int widgetInstanceId, [FromBody] WidgetSizeDto newSize)
        {
            try
            {
                if (newSize == null)
                {
                    return BadRequest(new { success = false, message = "Widget size data is required" });
                }

                string userId = CurrentUserId;

                // Get current layout
                var layout = await _context.UserDashboardLayouts
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.IsActive);

                CategoryGroupedLayoutDto layoutData;

                if (layout == null)
                {
                    // Create default layout if none exists
                    layoutData = new CategoryGroupedLayoutDto();
                }
                else
                {
                    // Parse existing layout
                    layoutData = JsonConvert.DeserializeObject<CategoryGroupedLayoutDto>(layout.LayoutJson) ??
                        new CategoryGroupedLayoutDto();
                }

                // Update widget size
                layoutData.WidgetSizes[widgetInstanceId.ToString()] = newSize;
                layoutData.LastUpdated = DateTime.UtcNow;

                // Save back to database
                var layoutJson = JsonConvert.SerializeObject(layoutData, Formatting.Indented);

                if (layout == null)
                {
                    // Create new layout
                    layout = new UserDashboardLayout
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        LayoutName = layoutData.LayoutName,
                        LayoutJson = layoutJson,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = CurrentActor,
                        UpdatedBy = CurrentActor
                    };
                    _context.UserDashboardLayouts.Add(layout);
                }
                else
                {
                    // Update existing layout
                    layout.LayoutJson = layoutJson;
                    layout.UpdatedAt = DateTime.UtcNow;
                    layout.UpdatedBy = CurrentActor;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Widget size updated for user {UserId}, widget {WidgetId}", userId, widgetInstanceId);

                return Ok(new
                {
                    success = true,
                    message = "Widget size updated successfully",
                    widgetInstanceId = widgetInstanceId,
                    newSize = newSize,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating widget size for user {UserId}, widget {WidgetId}", CurrentUserId, widgetInstanceId);
                return StatusCode(500, new { success = false, message = "Error updating widget size" });
            }
        }

        /// <summary>
        /// Update widget order within a category
        /// </summary>
        [HttpPut("layout/widget-order/{category}")]
        public async Task<ActionResult<object>> UpdateWidgetOrder(string category, [FromBody] string[] widgetOrder)
        {
            try
            {
                if (widgetOrder == null)
                {
                    return BadRequest(new { success = false, message = "Widget order data is required" });
                }

                string userId = CurrentUserId;

                // Get current layout
                var layout = await _context.UserDashboardLayouts
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.IsActive);

                CategoryGroupedLayoutDto layoutData;

                if (layout == null)
                {
                    layoutData = new CategoryGroupedLayoutDto();
                }
                else
                {
                    layoutData = JsonConvert.DeserializeObject<CategoryGroupedLayoutDto>(layout.LayoutJson) ??
                        new CategoryGroupedLayoutDto();
                }

                // Update widget order for the category
                layoutData.WidgetOrder[category] = widgetOrder;
                layoutData.LastUpdated = DateTime.UtcNow;

                // Save back to database
                var layoutJson = JsonConvert.SerializeObject(layoutData, Formatting.Indented);

                if (layout == null)
                {
                    layout = new UserDashboardLayout
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        LayoutName = layoutData.LayoutName,
                        LayoutJson = layoutJson,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = CurrentActor,
                        UpdatedBy = CurrentActor
                    };
                    _context.UserDashboardLayouts.Add(layout);
                }
                else
                {
                    layout.LayoutJson = layoutJson;
                    layout.UpdatedAt = DateTime.UtcNow;
                    layout.UpdatedBy = CurrentActor;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Widget order updated for user {UserId}, category {Category}", userId, category);

                return Ok(new
                {
                    success = true,
                    message = "Widget order updated successfully",
                    category = category,
                    newOrder = widgetOrder,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating widget order for user {UserId}, category {Category}", CurrentUserId, category);
                return StatusCode(500, new { success = false, message = "Error updating widget order" });
            }
        }

        /// <summary>
        /// Update category order
        /// </summary>
        [HttpPut("layout/category-order")]
        public async Task<ActionResult<object>> UpdateCategoryOrder([FromBody] string[] categoryOrder)
        {
            try
            {
                if (categoryOrder == null)
                {
                    return BadRequest(new { success = false, message = "Category order data is required" });
                }

                string userId = CurrentUserId;

                // Get current layout
                var layout = await _context.UserDashboardLayouts
                    .FirstOrDefaultAsync(l => l.UserId == userId && l.IsActive);

                CategoryGroupedLayoutDto layoutData;

                if (layout == null)
                {
                    layoutData = new CategoryGroupedLayoutDto();
                }
                else
                {
                    layoutData = JsonConvert.DeserializeObject<CategoryGroupedLayoutDto>(layout.LayoutJson) ??
                        new CategoryGroupedLayoutDto();
                }

                // Update category order
                layoutData.CategoryOrder = categoryOrder;
                layoutData.LastUpdated = DateTime.UtcNow;

                // Save back to database
                var layoutJson = JsonConvert.SerializeObject(layoutData, Formatting.Indented);

                if (layout == null)
                {
                    layout = new UserDashboardLayout
                    {
                        Id = Guid.NewGuid(),
                        UserId = userId,
                        LayoutName = layoutData.LayoutName,
                        LayoutJson = layoutJson,
                        IsActive = true,
                        CreatedAt = DateTime.UtcNow,
                        UpdatedAt = DateTime.UtcNow,
                        CreatedBy = CurrentActor,
                        UpdatedBy = CurrentActor
                    };
                    _context.UserDashboardLayouts.Add(layout);
                }
                else
                {
                    layout.LayoutJson = layoutJson;
                    layout.UpdatedAt = DateTime.UtcNow;
                    layout.UpdatedBy = CurrentActor;
                }

                await _context.SaveChangesAsync();

                _logger.LogInformation("Category order updated for user {UserId}", userId);

                return Ok(new
                {
                    success = true,
                    message = "Category order updated successfully",
                    newOrder = categoryOrder,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error updating category order for user {UserId}", CurrentUserId);
                return StatusCode(500, new { success = false, message = "Error updating category order" });
            }
        }

        // ===== PHASE 1 ENHANCED DATA FETCH ENGINE ENDPOINTS =====

        /// <summary>
        /// Get initial widget data using the Enhanced Data Fetch Engine (Phase 1)
        /// DevExtreme-style data loading with unified data source management
        /// </summary>
        [HttpGet("initial-widget-data")]
        public async Task<ActionResult<object>> GetInitialWidgetData([FromQuery] int widgetId)
        {
            try
            {
                _logger.LogInformation("Phase 1: Getting initial widget data for widget {WidgetId}", widgetId);

                var actionResult = await GetWidgetData(widgetId);
                if (actionResult.Result is OkObjectResult ok && ok.Value is WidgetDataResponseDto dto)
                {
                    var isSuccess = string.IsNullOrWhiteSpace(dto.ErrorMessage);
                    if (!isSuccess)
                    {
                        return BadRequest(new
                        {
                            success = false,
                            error = dto.ErrorMessage,
                            widgetId = widgetId,
                            timestamp = DateTime.UtcNow
                        });
                    }

                    return Ok(new
                    {
                        success = true,
                        widgetId = widgetId,
                        widgetType = dto.WidgetType,
                        data = dto.Data,
                        lastUpdated = dto.LastUpdated,
                        isInitialData = true,
                        enhancedDataEngine = "Phase1",
                        timestamp = DateTime.UtcNow
                    });
                }

                // Fallback unexpected result type
                return BadRequest(new
                {
                    success = false,
                    error = "Failed to get widget data",
                    widgetId = widgetId,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Phase 1: Error getting initial widget data for widget {WidgetId}", widgetId);
                return StatusCode(500, new
                {
                    success = false,
                    error = "Internal server error",
                    widgetId = widgetId,
                    timestamp = DateTime.UtcNow
                });
            }
        }

        // ===== ENHANCED WIDGET FACTORY ENDPOINTS =====

        /// <summary>
        /// Get widget data using the enhanced Widget Factory system
        /// </summary>
        [HttpPost("widgets/factory/data")]
        public async Task<IActionResult> GetWidgetDataViaFactory([FromBody] WidgetFactoryRequest request)
        {
            try
            {
                _logger.LogInformation("Getting widget data via factory for widget type {WidgetType}, data source {DataSource}",
                    request.WidgetType, request.DataSource);

                var factoryRequest = new WidgetDataRequest
                {
                    WidgetType = request.WidgetType,
                    Category = request.Category,
                    DataSource = request.DataSource,
                    Filters = request.Filters ?? new Dictionary<string, object>(),
                    Settings = request.Settings ?? new Dictionary<string, object>(),
                    TimeRange = request.TimeRange ?? "yesterday",
                    Mode = request.Mode ?? "cumulative"
                };

                var result = await _widgetFactoryService.GetWidgetDataAsync(factoryRequest);

                if (result.Success)
                {
                    return Ok(new
                    {
                        success = true,
                        data = result.Data,
                        processedFilters = result.ProcessedFilters,
                        processedSettings = result.ProcessedSettings,
                        aggregationType = result.AggregationType,
                        dataQueryType = result.DataQueryType,
                        metadata = result.Metadata,
                        timestamp = DateTime.UtcNow
                    });
                }
                else
                {
                    return BadRequest(new
                    {
                        success = false,
                        message = result.ErrorMessage,
                        validationErrors = result.ValidationErrors,
                        timestamp = DateTime.UtcNow
                    });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting widget data via factory");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error while processing widget factory request",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Validate widget configuration using the Widget Factory
        /// </summary>
        [HttpPost("widgets/factory/validate")]
        public async Task<IActionResult> ValidateWidgetConfiguration([FromBody] WidgetFactoryValidationRequest request)
        {
            try
            {
                _logger.LogInformation("Validating widget configuration for widget type {WidgetType}", request.WidgetType);

                var validationRequest = new WidgetValidationRequest
                {
                    WidgetType = request.WidgetType,
                    Category = request.Category,
                    DataSource = request.DataSource,
                    Filters = request.Filters ?? new Dictionary<string, object>(),
                    Settings = request.Settings ?? new Dictionary<string, object>(),
                    Mode = request.Mode ?? "cumulative",
                    AggregationType = request.AggregationType ?? "sum"
                };

                var result = await _widgetFactoryService.ValidateWidgetConfigurationAsync(validationRequest);

                return Ok(new
                {
                    success = result.IsValid,
                    message = result.ErrorMessage,
                    validationErrors = result.ValidationErrors,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error validating widget configuration");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error while validating widget configuration",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        /// <summary>
        /// Get available widget types from the Widget Factory
        /// </summary>
        [HttpGet("widgets/factory/types")]
        public async Task<IActionResult> GetAvailableWidgetTypes()
        {
            try
            {
                _logger.LogInformation("Getting available widget types from factory");

                var widgetTypes = await _widgetFactoryService.GetAvailableWidgetTypesAsync();

                return Ok(new
                {
                    success = true,
                    data = widgetTypes,
                    count = widgetTypes.Count,
                    timestamp = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting available widget types");
                return StatusCode(500, new
                {
                    success = false,
                    message = "Internal server error while getting widget types",
                    timestamp = DateTime.UtcNow
                });
            }
        }

        // ===== END OF CORE ENDPOINTS =====
    }

    // ===== WIDGET FACTORY REQUEST DTOs =====

    public class WidgetFactoryRequest
    {
        public string WidgetType { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string DataSource { get; set; } = null!;
        public Dictionary<string, object>? Filters { get; set; }
        public Dictionary<string, object>? Settings { get; set; }
        public string? TimeRange { get; set; }
        public string? Mode { get; set; }
    }

    public class WidgetFactoryValidationRequest
    {
        public string WidgetType { get; set; } = null!;
        public string Category { get; set; } = null!;
        public string DataSource { get; set; } = null!;
        public Dictionary<string, object>? Filters { get; set; }
        public Dictionary<string, object>? Settings { get; set; }
        public string? Mode { get; set; }
        public string? AggregationType { get; set; }
    }
}