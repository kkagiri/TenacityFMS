# Issue Tracker Backend Enhancements Technical Documentation

## Overview

This document outlines the required backend enhancements to support the comprehensive Issue Tracker frontend implementation with GPS integration and reporting capabilities.

## Current Controller Analysis

The existing `IssueTrackerController.cs` provides basic CRUD operations but lacks several essential endpoints for a complete issue management system. The controller needs to be enhanced with additional endpoints and proper FMSResponse handling.

## Required Controller Enhancements

### 1. Fix Existing Issues

#### Current Problems
- Missing `FMSResponse` wrapper for consistent API responses
- Inconsistent parameter binding for GET operations
- Missing validation and error handling
- No proper response standardization

#### Enhanced Controller Structure

```csharp
using FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues;
using FMS.Application.ModelsDTOs.FMS.Issuetracker;
using FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries;
using FMS.Domain.Entities;
using FMS.Application.Common;
using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using ControllerBase = Microsoft.AspNetCore.Mvc.ControllerBase;

namespace FMS.WebClient.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize] // Add authorization
public class IssueTrackerController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly ILogger<IssueTrackerController> _logger;

    public IssueTrackerController(IMediator mediator, ILogger<IssueTrackerController> logger)
    {
        _mediator = mediator;
        _logger = logger;
    }

    // Enhanced existing endpoints with FMSResponse
    [HttpGet]
    public async Task<IActionResult> GetIssueTracker([FromQuery] IssueTrackerFilterDTO filters)
    {
        try
        {
            var query = new GetIssueListQuery(filters);
            var response = await _mediator.Send(query);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching issue trackers");
            return BadRequest(FMSResponse.Failure("Failed to fetch issues"));
        }
    }

    [HttpGet("{id}")]
    public async Task<IActionResult> GetIssueTrackerById(int id)
    {
        try
        {
            if (id <= 0)
                return BadRequest(FMSResponse.Failure("Invalid issue ID"));

            var query = new GetIssueListByIdQuery(id);
            var response = await _mediator.Send(query);

            if (response.IsSuccess && response.Data != null)
                return Ok(response);

            return NotFound(FMSResponse.Failure("Issue not found"));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error fetching issue {IssueId}", id);
            return BadRequest(FMSResponse.Failure("Failed to fetch issue"));
        }
    }

    [HttpPost]
    public async Task<IActionResult> CreateIssueTracker([FromBody] CreateIssueCommand command)
    {
        try
        {
            if (!ModelState.IsValid)
                return BadRequest(FMSResponse.Failure("Invalid data provided", ModelState));

            var response = await _mediator.Send(command);

            if (response.IsSuccess)
                return CreatedAtAction(nameof(GetIssueTrackerById),
                    new { id = response.Data.Id }, response);

            return BadRequest(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating issue");
            return BadRequest(FMSResponse.Failure("Failed to create issue"));
        }
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateIssueTracker(int id, [FromBody] UpdateIssueCommand command)
    {
        try
        {
            if (id != command.Id)
                return BadRequest(FMSResponse.Failure("ID mismatch"));

            if (!ModelState.IsValid)
                return BadRequest(FMSResponse.Failure("Invalid data provided", ModelState));

            var response = await _mediator.Send(command);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error updating issue {IssueId}", id);
            return BadRequest(FMSResponse.Failure("Failed to update issue"));
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteIssueTracker(int id)
    {
        try
        {
            if (id <= 0)
                return BadRequest(FMSResponse.Failure("Invalid issue ID"));

            var command = new DeleteIssueCommand(id);
            var response = await _mediator.Send(command);
            return Ok(response);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting issue {IssueId}", id);
            return BadRequest(FMSResponse.Failure("Failed to delete issue"));
        }
    }
}
```

### 2. Additional Required Endpoints

```csharp
// Add these methods to the enhanced controller

// Get issues by vehicle
[HttpGet("vehicle/{vehicleId}")]
public async Task<IActionResult> GetIssuesByVehicle(int vehicleId, [FromQuery] IssueTrackerFilterDTO filters)
{
    try
    {
        var query = new GetIssuesByVehicleQuery(vehicleId, filters);
        var response = await _mediator.Send(query);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching issues for vehicle {VehicleId}", vehicleId);
        return BadRequest(FMSResponse.Failure("Failed to fetch vehicle issues"));
    }
}

// Get issue categories
[HttpGet("categories")]
public async Task<IActionResult> GetIssueCategories()
{
    try
    {
        var query = new GetIssueCategoriesQuery();
        var response = await _mediator.Send(query);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching issue categories");
        return BadRequest(FMSResponse.Failure("Failed to fetch categories"));
    }
}

// Get issue priorities
[HttpGet("priorities")]
public async Task<IActionResult> GetIssuePriorities()
{
    try
    {
        var query = new GetIssuePrioritiesQuery();
        var response = await _mediator.Send(query);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching issue priorities");
        return BadRequest(FMSResponse.Failure("Failed to fetch priorities"));
    }
}

// Get issue statuses
[HttpGet("statuses")]
public async Task<IActionResult> GetIssueStatuses()
{
    try
    {
        var query = new GetIssueStatusesQuery();
        var response = await _mediator.Send(query);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching issue statuses");
        return BadRequest(FMSResponse.Failure("Failed to fetch statuses"));
    }
}

// Analytics endpoint
[HttpGet("analytics")]
public async Task<IActionResult> GetIssueAnalytics([FromQuery] AnalyticsFilterDTO filters)
{
    try
    {
        var query = new GetIssueAnalyticsQuery(filters);
        var response = await _mediator.Send(query);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error fetching issue analytics");
        return BadRequest(FMSResponse.Failure("Failed to fetch analytics"));
    }
}

// Export reports
[HttpGet("reports/export")]
public async Task<IActionResult> ExportIssueReport([FromQuery] ExportParametersDTO parameters)
{
    try
    {
        var query = new ExportIssuesQuery(parameters);
        var response = await _mediator.Send(query);

        if (response.IsSuccess)
        {
            return File(response.Data.FileContent, response.Data.ContentType, response.Data.FileName);
        }

        return BadRequest(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error exporting issue report");
        return BadRequest(FMSResponse.Failure("Failed to export report"));
    }
}

// GPS Integration - Auto-create issue from GPS data
[HttpPost("gps/auto-create")]
public async Task<IActionResult> CreateIssueFromGPS([FromBody] CreateIssueFromGPSCommand command)
{
    try
    {
        if (!ModelState.IsValid)
            return BadRequest(FMSResponse.Failure("Invalid GPS data provided", ModelState));

        var response = await _mediator.Send(command);

        if (response.IsSuccess)
            return CreatedAtAction(nameof(GetIssueTrackerById),
                new { id = response.Data.Id }, response);

        return BadRequest(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error creating issue from GPS data");
        return BadRequest(FMSResponse.Failure("Failed to create GPS-based issue"));
    }
}

// Bulk operations
[HttpPut("bulk/assign")]
public async Task<IActionResult> BulkAssignIssues([FromBody] BulkAssignIssuesCommand command)
{
    try
    {
        var response = await _mediator.Send(command);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in bulk assign operation");
        return BadRequest(FMSResponse.Failure("Failed to assign issues"));
    }
}

[HttpPut("bulk/status")]
public async Task<IActionResult> BulkUpdateStatus([FromBody] BulkUpdateStatusCommand command)
{
    try
    {
        var response = await _mediator.Send(command);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error in bulk status update");
        return BadRequest(FMSResponse.Failure("Failed to update status"));
    }
}

// GPS monitoring endpoint
[HttpGet("gps/monitor/{vehicleId}")]
public async Task<IActionResult> MonitorVehicleGPS(int vehicleId)
{
    try
    {
        var query = new MonitorVehicleGPSQuery(vehicleId);
        var response = await _mediator.Send(query);
        return Ok(response);
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error monitoring GPS for vehicle {VehicleId}", vehicleId);
        return BadRequest(FMSResponse.Failure("Failed to monitor GPS"));
    }
}
```

## Required DTOs

### 1. IssueTrackerFilterDTO.cs

```csharp
namespace FMS.Application.ModelsDTOs.FMS.Issuetracker
{
    public class IssueTrackerFilterDTO
    {
        public int? Status { get; set; }
        public int? Priority { get; set; }
        public int? Category { get; set; }
        public string? AssignedTo { get; set; }
        public int? Vehicle { get; set; }
        public DateTime? DateFrom { get; set; }
        public DateTime? DateTo { get; set; }
        public string? SearchTerm { get; set; }
        public bool? HasGPSData { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 20;
        public string? SortBy { get; set; }
        public string? SortDirection { get; set; } = "desc";
    }
}
```

### 2. IssueTrackerAnalyticsDTO.cs

```csharp
namespace FMS.Application.ModelsDTOs.FMS.Issuetracker
{
    public class IssueTrackerAnalyticsDTO
    {
        public int TotalIssues { get; set; }
        public int OpenIssues { get; set; }
        public int InProgressIssues { get; set; }
        public int ResolvedIssues { get; set; }
        public int ClosedIssues { get; set; }
        public int HighPriorityIssues { get; set; }
        public int OverdueIssues { get; set; }
        public int GPSRelatedIssues { get; set; }

        public List<IssueCountByCategory> IssuesByCategory { get; set; } = new();
        public List<IssueCountByVehicle> IssuesByVehicle { get; set; } = new();
        public List<IssueCountByDate> IssuesTrend { get; set; } = new();
        public List<AssigneeWorkload> AssigneeWorkloads { get; set; } = new();

        public double AverageResolutionTimeHours { get; set; }
        public double AverageResponseTimeHours { get; set; }
        public decimal TotalEstimatedCost { get; set; }
    }

    public class IssueCountByCategory
    {
        public int CategoryId { get; set; }
        public string CategoryName { get; set; }
        public int Count { get; set; }
    }

    public class IssueCountByVehicle
    {
        public int VehicleId { get; set; }
        public string VehicleName { get; set; }
        public int Count { get; set; }
    }

    public class IssueCountByDate
    {
        public DateTime Date { get; set; }
        public int Count { get; set; }
    }

    public class AssigneeWorkload
    {
        public string AssigneeId { get; set; }
        public string AssigneeName { get; set; }
        public int OpenIssues { get; set; }
        public int TotalAssigned { get; set; }
    }
}
```

### 3. IssueTrackerGPSCreateDTO.cs

```csharp
namespace FMS.Application.ModelsDTOs.FMS.Issuetracker
{
    public class IssueTrackerGPSCreateDTO
    {
        public int VehicleId { get; set; }
        public string EventType { get; set; } // "vehicle_offline", "speed_violation", etc.
        public string Severity { get; set; } // "low", "medium", "high", "critical"
        public string Title { get; set; }
        public string Description { get; set; }
        public GPSDataDTO GPSData { get; set; }
        public DateTime EventTimestamp { get; set; }
        public Dictionary<string, object> AdditionalData { get; set; } = new();
    }

    public class GPSDataDTO
    {
        public double Latitude { get; set; }
        public double Longitude { get; set; }
        public double? Speed { get; set; }
        public double? Heading { get; set; }
        public DateTime Timestamp { get; set; }
        public bool IsOnline { get; set; }
        public string? Address { get; set; }
        public double? Odometer { get; set; }
    }
}
```

### 4. ExportParametersDTO.cs

```csharp
namespace FMS.Application.ModelsDTOs.FMS.Issuetracker
{
    public class ExportParametersDTO
    {
        public string Format { get; set; } = "excel"; // "excel", "pdf", "csv"
        public IssueTrackerFilterDTO Filters { get; set; } = new();
        public List<string> Columns { get; set; } = new();
        public bool IncludeGPSData { get; set; } = false;
        public bool IncludeComments { get; set; } = false;
        public bool IncludeAttachments { get; set; } = false;
        public string? ReportTitle { get; set; }
        public DateTime? GeneratedDate { get; set; }
    }

    public class ExportResultDTO
    {
        public byte[] FileContent { get; set; }
        public string ContentType { get; set; }
        public string FileName { get; set; }
    }
}
```

## Required Commands

### 1. CreateIssueFromGPSCommand.cs

```csharp
using FMS.Application.ModelsDTOs.FMS.Issuetracker;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues
{
    public record CreateIssueFromGPSCommand : IRequest<FMSResponse<IssueTrackerDTO>>
    {
        public int VehicleId { get; init; }
        public string EventType { get; init; }
        public string Severity { get; init; }
        public string Title { get; init; }
        public string Description { get; init; }
        public GPSDataDTO GPSData { get; init; }
        public DateTime EventTimestamp { get; init; }
        public Dictionary<string, object> AdditionalData { get; init; } = new();
    }

    public class CreateIssueFromGPSCommandHandler : IRequestHandler<CreateIssueFromGPSCommand, FMSResponse<IssueTrackerDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<CreateIssueFromGPSCommandHandler> _logger;
        private readonly IMapper _mapper;

        public CreateIssueFromGPSCommandHandler(
            GpsdataContext context,
            ILogger<CreateIssueFromGPSCommandHandler> logger,
            IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponse<IssueTrackerDTO>> Handle(CreateIssueFromGPSCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Map GPS event type to issue category and priority
                var (categoryId, priorityId) = MapEventTypeToIssueType(request.EventType, request.Severity);

                var issue = new Issuetracker
                {
                    ProblemTitle = request.Title,
                    ProblemDescription = request.Description,
                    Vehicle = request.VehicleId,
                    IssueCategory = categoryId,
                    Priority = priorityId,
                    Status = 1, // Open
                    OpenDate = request.EventTimestamp,
                    Openby = "system_gps",
                    LastModfield = DateTime.UtcNow,

                    // Store GPS data as JSON in a field or related table
                    GPSLatitude = request.GPSData.Latitude,
                    GPSLongitude = request.GPSData.Longitude,
                    GPSTimestamp = request.GPSData.Timestamp,
                    GPSSpeed = request.GPSData.Speed,
                    GPSHeading = request.GPSData.Heading,
                    AdditionalData = JsonSerializer.Serialize(request.AdditionalData)
                };

                _context.Issuetrackers.Add(issue);
                await _context.SaveChangesAsync(cancellationToken);

                var issueDto = _mapper.Map<IssueTrackerDTO>(issue);

                _logger.LogInformation("GPS-based issue created: {IssueId} for vehicle {VehicleId}",
                    issue.Id, request.VehicleId);

                return FMSResponse<IssueTrackerDTO>.Success(issueDto, "Issue created from GPS data");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating GPS-based issue for vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<IssueTrackerDTO>.Failure("Failed to create GPS-based issue");
            }
        }

        private (int categoryId, int priorityId) MapEventTypeToIssueType(string eventType, string severity)
        {
            // Define mapping logic for GPS events to issue categories and priorities
            var eventMapping = new Dictionary<string, int>
            {
                { "vehicle_offline", 1 }, // Connectivity category
                { "geofence_violation", 2 }, // Security category
                { "speed_violation", 3 }, // Safety category
                { "maintenance_due", 4 }, // Maintenance category
                { "engine_fault", 5 }, // Mechanical category
                { "panic_button", 2 } // Security category
            };

            var severityMapping = new Dictionary<string, int>
            {
                { "low", 1 },
                { "medium", 2 },
                { "high", 3 },
                { "critical", 4 }
            };

            var categoryId = eventMapping.GetValueOrDefault(eventType.ToLower(), 1);
            var priorityId = severityMapping.GetValueOrDefault(severity.ToLower(), 2);

            return (categoryId, priorityId);
        }
    }
}
```

### 2. BulkUpdateIssuesCommand.cs

```csharp
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Command.DatabaseCommand.IssueTrackerCommands.Issues
{
    public record BulkAssignIssuesCommand : IRequest<FMSResponse<int>>
    {
        public List<int> IssueIds { get; init; } = new();
        public string AssignToUserId { get; init; }
        public string UpdatedBy { get; init; }
    }

    public record BulkUpdateStatusCommand : IRequest<FMSResponse<int>>
    {
        public List<int> IssueIds { get; init; } = new();
        public int NewStatus { get; init; }
        public string UpdatedBy { get; init; }
        public string? Notes { get; init; }
    }

    public class BulkAssignIssuesCommandHandler : IRequestHandler<BulkAssignIssuesCommand, FMSResponse<int>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<BulkAssignIssuesCommandHandler> _logger;

        public BulkAssignIssuesCommandHandler(GpsdataContext context, ILogger<BulkAssignIssuesCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<int>> Handle(BulkAssignIssuesCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var issues = await _context.Issuetrackers
                    .Where(i => request.IssueIds.Contains(i.Id))
                    .ToListAsync(cancellationToken);

                foreach (var issue in issues)
                {
                    issue.AssignTo = request.AssignToUserId;
                    issue.LastModfield = DateTime.UtcNow;
                }

                var updatedCount = await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Bulk assigned {Count} issues to user {UserId}",
                    updatedCount, request.AssignToUserId);

                return FMSResponse<int>.Success(updatedCount, $"Successfully assigned {updatedCount} issues");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk assign operation");
                return FMSResponse<int>.Failure("Failed to assign issues");
            }
        }
    }

    public class BulkUpdateStatusCommandHandler : IRequestHandler<BulkUpdateStatusCommand, FMSResponse<int>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<BulkUpdateStatusCommandHandler> _logger;

        public BulkUpdateStatusCommandHandler(GpsdataContext context, ILogger<BulkUpdateStatusCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<int>> Handle(BulkUpdateStatusCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var issues = await _context.Issuetrackers
                    .Where(i => request.IssueIds.Contains(i.Id))
                    .ToListAsync(cancellationToken);

                foreach (var issue in issues)
                {
                    issue.Status = request.NewStatus;
                    issue.LastModfield = DateTime.UtcNow;

                    if (request.NewStatus == 3) // Resolved
                    {
                        issue.ClosingDate = DateTime.UtcNow;
                    }
                }

                var updatedCount = await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Bulk updated status for {Count} issues to status {Status}",
                    updatedCount, request.NewStatus);

                return FMSResponse<int>.Success(updatedCount, $"Successfully updated {updatedCount} issues");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in bulk status update operation");
                return FMSResponse<int>.Failure("Failed to update issue status");
            }
        }
    }
}
```

## Required Queries

### 1. GetIssueAnalyticsQuery.cs

```csharp
using FMS.Application.ModelsDTOs.FMS.Issuetracker;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries
{
    public record GetIssueAnalyticsQuery(AnalyticsFilterDTO Filters) : IRequest<FMSResponse<IssueTrackerAnalyticsDTO>>;

    public class GetIssueAnalyticsQueryHandler : IRequestHandler<GetIssueAnalyticsQuery, FMSResponse<IssueTrackerAnalyticsDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssueAnalyticsQueryHandler> _logger;

        public GetIssueAnalyticsQueryHandler(GpsdataContext context, ILogger<GetIssueAnalyticsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<IssueTrackerAnalyticsDTO>> Handle(GetIssueAnalyticsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var dateFrom = request.Filters.DateFrom ?? DateTime.UtcNow.AddMonths(-3);
                var dateTo = request.Filters.DateTo ?? DateTime.UtcNow;

                var baseQuery = _context.Issuetrackers
                    .Where(i => i.OpenDate >= dateFrom && i.OpenDate <= dateTo);

                var analytics = new IssueTrackerAnalyticsDTO
                {
                    TotalIssues = await baseQuery.CountAsync(cancellationToken),
                    OpenIssues = await baseQuery.CountAsync(i => i.Status == 1, cancellationToken),
                    InProgressIssues = await baseQuery.CountAsync(i => i.Status == 2, cancellationToken),
                    ResolvedIssues = await baseQuery.CountAsync(i => i.Status == 3, cancellationToken),
                    ClosedIssues = await baseQuery.CountAsync(i => i.Status == 4, cancellationToken),
                    HighPriorityIssues = await baseQuery.CountAsync(i => i.Priority >= 3, cancellationToken),
                    OverdueIssues = await baseQuery.CountAsync(i => i.DueDate < DateTime.UtcNow && i.Status < 3, cancellationToken),
                    GPSRelatedIssues = await baseQuery.CountAsync(i => i.Openby == "system_gps", cancellationToken)
                };

                // Issues by category
                analytics.IssuesByCategory = await baseQuery
                    .GroupBy(i => new { i.IssueCategory, i.CategoryNavigation.Name })
                    .Select(g => new IssueCountByCategory
                    {
                        CategoryId = g.Key.IssueCategory,
                        CategoryName = g.Key.Name,
                        Count = g.Count()
                    })
                    .ToListAsync(cancellationToken);

                // Issues by vehicle
                analytics.IssuesByVehicle = await baseQuery
                    .GroupBy(i => new { i.Vehicle, i.VehicleNavigation.Name })
                    .Select(g => new IssueCountByVehicle
                    {
                        VehicleId = g.Key.Vehicle,
                        VehicleName = g.Key.Name,
                        Count = g.Count()
                    })
                    .OrderByDescending(x => x.Count)
                    .Take(10)
                    .ToListAsync(cancellationToken);

                // Issues trend
                analytics.IssuesTrend = await baseQuery
                    .GroupBy(i => i.OpenDate.Date)
                    .Select(g => new IssueCountByDate
                    {
                        Date = g.Key,
                        Count = g.Count()
                    })
                    .OrderBy(x => x.Date)
                    .ToListAsync(cancellationToken);

                // Calculate average resolution time
                var resolvedIssues = await baseQuery
                    .Where(i => i.Status == 3 && i.ClosingDate.HasValue)
                    .Select(i => new { i.OpenDate, i.ClosingDate })
                    .ToListAsync(cancellationToken);

                if (resolvedIssues.Any())
                {
                    analytics.AverageResolutionTimeHours = resolvedIssues
                        .Average(i => (i.ClosingDate.Value - i.OpenDate).TotalHours);
                }

                return FMSResponse<IssueTrackerAnalyticsDTO>.Success(analytics, "Analytics retrieved successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching issue analytics");
                return FMSResponse<IssueTrackerAnalyticsDTO>.Failure("Failed to fetch analytics");
            }
        }
    }
}
```

### 2. GetIssuesByVehicleQuery.cs

```csharp
using FMS.Application.ModelsDTOs.FMS.Issuetracker;
using FMS.Application.Common;
using MediatR;

namespace FMS.Application.Queries.Database.FMSQuery.IssueTrackerQueries
{
    public record GetIssuesByVehicleQuery(int VehicleId, IssueTrackerFilterDTO Filters) : IRequest<FMSResponse<PagedResult<IssueTrackerDTO>>>;

    public class GetIssuesByVehicleQueryHandler : IRequestHandler<GetIssuesByVehicleQuery, FMSResponse<PagedResult<IssueTrackerDTO>>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetIssuesByVehicleQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetIssuesByVehicleQueryHandler(GpsdataContext context, ILogger<GetIssuesByVehicleQueryHandler> logger, IMapper mapper)
        {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }

        public async Task<FMSResponse<PagedResult<IssueTrackerDTO>>> Handle(GetIssuesByVehicleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var query = _context.Issuetrackers
                    .Include(x => x.AssignToNavigation)
                    .Include(x => x.Site)
                    .Include(x => x.StatusNavigation)
                    .Include(x => x.OpenbyNavigation)
                    .Include(x => x.PriorityNavigation)
                    .Include(x => x.VehicleNavigation)
                    .Where(x => x.Vehicle == request.VehicleId);

                // Apply filters
                if (request.Filters.Status.HasValue)
                    query = query.Where(x => x.Status == request.Filters.Status.Value);

                if (request.Filters.Priority.HasValue)
                    query = query.Where(x => x.Priority == request.Filters.Priority.Value);

                if (request.Filters.Category.HasValue)
                    query = query.Where(x => x.IssueCategory == request.Filters.Category.Value);

                if (!string.IsNullOrEmpty(request.Filters.SearchTerm))
                {
                    var searchTerm = request.Filters.SearchTerm.ToLower();
                    query = query.Where(x => x.ProblemTitle.ToLower().Contains(searchTerm) ||
                                           x.ProblemDescription.ToLower().Contains(searchTerm));
                }

                if (request.Filters.DateFrom.HasValue)
                    query = query.Where(x => x.OpenDate >= request.Filters.DateFrom.Value);

                if (request.Filters.DateTo.HasValue)
                    query = query.Where(x => x.OpenDate <= request.Filters.DateTo.Value);

                var totalCount = await query.CountAsync(cancellationToken);

                // Apply sorting
                query = request.Filters.SortDirection?.ToLower() == "asc"
                    ? query.OrderBy(x => x.OpenDate)
                    : query.OrderByDescending(x => x.OpenDate);

                // Apply pagination
                var skip = (request.Filters.PageNumber - 1) * request.Filters.PageSize;
                var issues = await query
                    .Skip(skip)
                    .Take(request.Filters.PageSize)
                    .ToListAsync(cancellationToken);

                var issueDtos = _mapper.Map<List<IssueTrackerDTO>>(issues);

                var result = new PagedResult<IssueTrackerDTO>
                {
                    Items = issueDtos,
                    TotalCount = totalCount,
                    PageNumber = request.Filters.PageNumber,
                    PageSize = request.Filters.PageSize
                };

                return FMSResponse<PagedResult<IssueTrackerDTO>>.Success(result, $"Found {totalCount} issues for vehicle");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error fetching issues for vehicle {VehicleId}", request.VehicleId);
                return FMSResponse<PagedResult<IssueTrackerDTO>>.Failure("Failed to fetch vehicle issues");
            }
        }
    }
}
```

## Database Schema Enhancements

### GPS Data Fields
```sql
-- Add GPS-related columns to Issuetracker table
ALTER TABLE Issuetrackers ADD COLUMN GPSLatitude DECIMAL(10, 8) NULL;
ALTER TABLE Issuetrackers ADD COLUMN GPSLongitude DECIMAL(11, 8) NULL;
ALTER TABLE Issuetrackers ADD COLUMN GPSTimestamp DATETIME NULL;
ALTER TABLE Issuetrackers ADD COLUMN GPSSpeed DECIMAL(5, 2) NULL;
ALTER TABLE Issuetrackers ADD COLUMN GPSHeading DECIMAL(5, 2) NULL;
ALTER TABLE Issuetrackers ADD COLUMN AdditionalData TEXT NULL;
ALTER TABLE Issuetrackers ADD COLUMN AutoCreated BOOLEAN DEFAULT FALSE;
```

## SignalR Integration

### Real-time Issue Updates
```csharp
// Add to existing SignalR hub or create new IssueTrackerHub
public class IssueTrackerHub : Hub
{
    public async Task JoinIssueGroup(string issueId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Issue_{issueId}");
    }

    public async Task LeaveIssueGroup(string issueId)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, $"Issue_{issueId}");
    }

    public async Task JoinVehicleGroup(string vehicleId)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, $"Vehicle_{vehicleId}");
    }
}

// Service for broadcasting updates
public interface IIssueTrackerNotificationService
{
    Task NotifyIssueCreated(IssueTrackerDTO issue);
    Task NotifyIssueUpdated(IssueTrackerDTO issue);
    Task NotifyIssueAssigned(int issueId, string assigneeId);
    Task NotifyGPSIssueDetected(int vehicleId, string eventType);
}
```

This comprehensive backend enhancement provides all the necessary endpoints, DTOs, commands, and queries to support the full-featured Issue Tracker frontend with GPS integration and reporting capabilities.
