/*
 * File: DepartmentController.cs
 * Purpose: API controller for Department CRUD operations
 * Dependencies: MediatR, FMS.Application.Features.UserManagement
 * Last Modified: 2026-02-05
 *
 * Key Endpoints:
 * - GET /api/department: Get all departments
 * - GET /api/department/{id}: Get department by ID
 * - POST /api/department: Create new department
 * - PUT /api/department/{id}: Update department
 * - DELETE /api/department/{id}: Delete department
 */
using FMS.Application.Features.UserManagement.Commands;
using FMS.Application.Features.UserManagement.DTOs;
using FMS.Application.Features.UserManagement.Queries;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using FMS.WebClient.Attributes;
using FMS.Application.Common.Constants;

namespace FMS.WebClient.Controllers.UserManagement;

[Route("api/v1/[controller]")]
[ApiController]
[Authorize]
[RequirePermission(Permissions.Admin.Users)]
public class DepartmentController : ControllerBase
{
    private readonly IMediator _mediator;

    public DepartmentController(IMediator mediator)
    {
        _mediator = mediator;
    }

    /// <summary>
    /// Get all departments
    /// </summary>
    /// <param name="includeInactive">Include inactive departments</param>
    /// <returns>List of departments</returns>
    [HttpGet]
    public async Task<IActionResult> GetDepartments([FromQuery] bool includeInactive = false)
    {
        try
        {
            var query = new GetDepartmentsQuery(includeInactive);
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error fetching departments: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get all active departments (for dropdowns)
    /// </summary>
    /// <returns>List of active departments</returns>
    [HttpGet("all")]
    public async Task<IActionResult> GetAllActiveDepartments()
    {
        try
        {
            var query = new GetDepartmentsQuery(false);
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error fetching departments: {ex.Message}" });
        }
    }

    /// <summary>
    /// Get department by ID
    /// </summary>
    /// <param name="id">Department ID</param>
    /// <returns>Department details</returns>
    [HttpGet("{id}")]
    public async Task<IActionResult> GetDepartmentById(int id)
    {
        try
        {
            var query = new GetDepartmentByIdQuery(id);
            var result = await _mediator.Send(query);
            return result.IsSuccess ? Ok(result) : NotFound(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error fetching department: {ex.Message}" });
        }
    }

    /// <summary>
    /// Create a new department
    /// </summary>
    /// <param name="dto">Department creation data</param>
    /// <returns>Created department</returns>
    [HttpPost]
    public async Task<IActionResult> CreateDepartment([FromBody] CreateDepartmentDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Department data is required" });
            }

            var command = new CreateDepartmentCommand(dto);
            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error creating department: {ex.Message}" });
        }
    }

    /// <summary>
    /// Update an existing department
    /// </summary>
    /// <param name="id">Department ID</param>
    /// <param name="dto">Department update data</param>
    /// <returns>Updated department</returns>
    [HttpPut("{id}")]
    public async Task<IActionResult> UpdateDepartment(int id, [FromBody] UpdateDepartmentDto dto)
    {
        try
        {
            if (dto == null)
            {
                return BadRequest(new { message = "Department data is required" });
            }

            if (id != dto.DepartmentId)
            {
                return BadRequest(new { message = "Department ID mismatch" });
            }

            var command = new UpdateDepartmentCommand(dto);
            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error updating department: {ex.Message}" });
        }
    }

    /// <summary>
    /// Delete a department
    /// </summary>
    /// <param name="id">Department ID</param>
    /// <param name="forceDelete">Force delete even if users exist</param>
    /// <returns>Success result</returns>
    [HttpDelete("{id}")]
    public async Task<IActionResult> DeleteDepartment(int id, [FromQuery] bool forceDelete = false)
    {
        try
        {
            var command = new DeleteDepartmentCommand(id, forceDelete);
            var result = await _mediator.Send(command);
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = $"Error deleting department: {ex.Message}" });
        }
    }
}
