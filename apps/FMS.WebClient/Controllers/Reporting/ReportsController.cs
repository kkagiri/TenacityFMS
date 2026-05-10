using FMS.Application.Common;
using FMS.Domain.Entities.Reports;
using FMS.Persistence.DataAccess;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.Reporting;

/// <summary>
/// API Controller for managing report items - provides CRUD operations for reports.
/// </summary>
[Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
[ApiController]
[Route("api/v1/[controller]")]
[RequirePermission(Permissions.Report.VehicleConsumption)]
public class ReportsController : ControllerBase
{
    private readonly GpsdataContext _context;

    public ReportsController(GpsdataContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Get all reports
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<FMSResponse<List<ReportItemDto>>>> GetReports([FromQuery] string? category = null)
    {
        var query = _context.ReportItems.AsNoTracking();

        if (!string.IsNullOrEmpty(category))
        {
            query = query.Where(r => r.Category == category);
        }

        var reports = await query
            .Select(r => new ReportItemDto
            {
                Id = r.Id,
                Name = r.Name,
                DisplayName = r.DisplayName,
                Description = r.Description,
                Category = r.Category,
                Icon = r.Icon,
                ReportType = (int)r.ReportType,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                CreatedBy = r.CreatedBy,
                UpdatedBy = r.UpdatedBy
            })
            .ToListAsync();

        return Ok(FMSResponse<List<ReportItemDto>>.Success(reports));
    }

    /// <summary>
    /// Get all unique categories
    /// </summary>
    [HttpGet("categories")]
    public async Task<ActionResult<FMSResponse<List<CategoryDto>>>> GetCategories()
    {
        var categories = await _context.ReportItems
            .AsNoTracking()
            .Select(r => r.Category)
            .Distinct()
            .OrderBy(c => c)
            .Select(c => new CategoryDto { Name = c, Icon = "fa-light fa-folder" })
            .ToListAsync();

        return Ok(FMSResponse<List<CategoryDto>>.Success(categories));
    }

    /// <summary>
    /// Get a specific report by ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FMSResponse<ReportItemDto>>> GetReport(int id)
    {
        var report = await _context.ReportItems
            .AsNoTracking()
            .Where(r => r.Id == id)
            .Select(r => new ReportItemDto
            {
                Id = r.Id,
                Name = r.Name,
                DisplayName = r.DisplayName,
                Description = r.Description,
                Category = r.Category,
                Icon = r.Icon,
                ReportType = (int)r.ReportType,
                CreatedAt = r.CreatedAt,
                UpdatedAt = r.UpdatedAt,
                CreatedBy = r.CreatedBy,
                UpdatedBy = r.UpdatedBy
            })
            .FirstOrDefaultAsync();

        if (report == null)
        {
            return NotFound(FMSResponse<ReportItemDto>.Failed($"Report with ID {id} not found"));
        }

        return Ok(FMSResponse<ReportItemDto>.Success(report));
    }

    /// <summary>
    /// Create a new report
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FMSResponse<ReportItemDto>>> CreateReport([FromBody] CreateReportRequest request)
    {
        if (string.IsNullOrWhiteSpace(request.Name))
        {
            return BadRequest(FMSResponse<ReportItemDto>.Failed("Report name is required"));
        }

        // Check for duplicate name
        var exists = await _context.ReportItems.AnyAsync(r => r.Name == request.Name);
        if (exists)
        {
            return BadRequest(FMSResponse<ReportItemDto>.Failed($"Report with name '{request.Name}' already exists"));
        }

        var report = new ReportItem
        {
            Name = request.Name,
            DisplayName = request.DisplayName ?? request.Name,
            Description = request.Description,
            Category = request.Category ?? "DevExtreme Reports",
            Icon = request.Icon ?? "fa-light fa-file-chart-column",
            ReportType = (ReportType)(request.ReportType ?? 4),
            CreatedAt = DateTime.UtcNow,
            CreatedBy = User.Identity?.Name
        };

        _context.ReportItems.Add(report);
        await _context.SaveChangesAsync();

        var dto = new ReportItemDto
        {
            Id = report.Id,
            Name = report.Name,
            DisplayName = report.DisplayName,
            Description = report.Description,
            Category = report.Category,
            Icon = report.Icon,
            ReportType = (int)report.ReportType,
            CreatedAt = report.CreatedAt,
            CreatedBy = report.CreatedBy
        };

        return CreatedAtAction(nameof(GetReport), new { id = report.Id }, FMSResponse<ReportItemDto>.Success(dto, "Report created successfully"));
    }

    /// <summary>
    /// Update an existing report
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<FMSResponse<ReportItemDto>>> UpdateReport(int id, [FromBody] UpdateReportRequest request)
    {
        var report = await _context.ReportItems.FindAsync(id);
        if (report == null)
        {
            return NotFound(FMSResponse<ReportItemDto>.Failed($"Report with ID {id} not found"));
        }

        if (!string.IsNullOrWhiteSpace(request.DisplayName))
        {
            report.DisplayName = request.DisplayName;
        }

        if (!string.IsNullOrWhiteSpace(request.Description))
        {
            report.Description = request.Description;
        }

        if (!string.IsNullOrWhiteSpace(request.Category))
        {
            report.Category = request.Category;
        }

        if (!string.IsNullOrWhiteSpace(request.Icon))
        {
            report.Icon = request.Icon;
        }

        if (request.ReportType.HasValue)
        {
            report.ReportType = (ReportType)request.ReportType.Value;
        }

        report.UpdatedAt = DateTime.UtcNow;
        report.UpdatedBy = User.Identity?.Name;

        await _context.SaveChangesAsync();

        var dto = new ReportItemDto
        {
            Id = report.Id,
            Name = report.Name,
            DisplayName = report.DisplayName,
            Description = report.Description,
            Category = report.Category,
            Icon = report.Icon,
            ReportType = (int)report.ReportType,
            CreatedAt = report.CreatedAt,
            UpdatedAt = report.UpdatedAt,
            CreatedBy = report.CreatedBy,
            UpdatedBy = report.UpdatedBy
        };

        return Ok(FMSResponse<ReportItemDto>.Success(dto, "Report updated successfully"));
    }

    /// <summary>
    /// Delete a report
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<ActionResult<FMSResponse<bool>>> DeleteReport(int id)
    {
        var report = await _context.ReportItems.FindAsync(id);
        if (report == null)
        {
            return NotFound(FMSResponse<bool>.Failed($"Report with ID {id} not found"));
        }

        _context.ReportItems.Remove(report);
        await _context.SaveChangesAsync();

        return Ok(FMSResponse<bool>.Success(true, "Report deleted successfully"));
    }
}

/// <summary>
/// DTO for report item responses
/// </summary>
public class ReportItemDto
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string Category { get; set; } = "DevExtreme Reports";
    public string Icon { get; set; } = "fa-light fa-file-chart-column";
    public int ReportType { get; set; } = 4;
    public DateTime CreatedAt { get; set; }
    public DateTime? UpdatedAt { get; set; }
    public string? CreatedBy { get; set; }
    public string? UpdatedBy { get; set; }
}

/// <summary>
/// DTO for category listing
/// </summary>
public class CategoryDto
{
    public string Name { get; set; } = string.Empty;
    public string Icon { get; set; } = "fa-light fa-folder";
}

/// <summary>
/// Request model for creating a report
/// </summary>
public class CreateReportRequest
{
    public string Name { get; set; } = string.Empty;
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Icon { get; set; }
    public int? ReportType { get; set; }
}

/// <summary>
/// Request model for updating a report
/// </summary>
public class UpdateReportRequest
{
    public string? DisplayName { get; set; }
    public string? Description { get; set; }
    public string? Category { get; set; }
    public string? Icon { get; set; }
    public int? ReportType { get; set; }
}
