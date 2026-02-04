/**
 * File: EmployeeController.cs
 * Purpose: Handles employee CRUD and search endpoints with caching support.
 * Dependencies: MediatR, distributed cache, BaseApiController helpers.
 * Last Modified: 2026-02-04
 *
 * Key Actions:
 * - CreateEmployee(): Creates employee records with created-by metadata.
 * - UpdateEmployee(): Updates employee records with modified-by metadata.
 * - SearchEmployees(): Returns filtered employee search results.
 */
using System.Collections.Generic;
using System.Text.Json;
using AutoMapper.Configuration.Annotations;
using FMS.Application.Command.DatabaseCommand.EmployeeCmd;
using FMS.Application.Common;
using FMS.Application.Features.Employee.Queries;
using FMS.Application.Features.FMS.Employee;
using FMS.Application.Queries.Database.FMSQuery.EmployeeQuery;
using FMS.WebClient.Controllers.Base;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Distributed;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/[controller]")]

    public class EmployeeController : BaseApiController

    {
        private readonly IMediator _mediator;
        private readonly IDistributedCache _cache;

        public EmployeeController(IMediator mediator, IDistributedCache cache)
        {
            _mediator = mediator;
            _cache = cache;
        }

        [HttpPost]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> CreateEmployee([FromBody] EmployeeDto employeeDto)
        {
            var hasPermission = User.HasClaim("permissions", "_createEmployee");

            if (!TryGetCurrentUserId(out var userId)) return BadRequest("Invalid User ID");

            employeeDto.CreatedBy = userId;

            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);
            var command = new EmployeeCreateCmd { EmployeeDto = employeeDto };
            var result = await _mediator.Send(command);
            if (!result.Success) return BadRequest(result.Message);
            return Ok(result);
        }

        [HttpGet("site/{siteId}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetEmployeeBySiteId(int siteId)
        {
            var hasPermission = User.HasClaim("permissions", "_readEmployee");
            if (!hasPermission) return Forbid();
            if (siteId <= 0) return BadRequest("Invalid ID");
            var query = new GetEmployeeBySiteIdQuery { SiteId = siteId };
            var employees = await _mediator.Send(query);
            return Ok(employees);
        }

        [HttpGet]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetEmployeeList([FromQuery] bool? active)
        {
            var hasPermission = User.HasClaim("permissions", "_readEmployee");
            var permissionlist = User.Claims.ToList();

            if (!hasPermission) return Forbid();

            var query = new GetEmployeeQuery(active ?? true);
            var employees = await _mediator.Send(query);
            return Ok(employees);
        }

        [HttpGet("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> GetEmployee(int id)
        {
            var hasPermission = User.HasClaim("permissions", "_readEmployee");
            if (!hasPermission) return Forbid();
            if (id <= 0) return BadRequest("Invalid ID");

            // Try cache first
            var cacheKey = $"Employee:{id}";
            var cachedData = await _cache.GetStringAsync(cacheKey);
            if (!string.IsNullOrEmpty(cachedData))
            {
                var cachedEmployee = JsonSerializer.Deserialize<EmployeeDto>(cachedData);
                return Ok(cachedEmployee);
            }

            var query = new GetEmployeeByIdQuery { Id = id };
            var employee = await _mediator.Send(query);

            if (employee == null) return NotFound();

            // Cache for 30 minutes
            var cacheOptions = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(30)
            };
            await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(employee), cacheOptions);

            return Ok(employee);
        }

        [HttpPut("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]

        public async Task<IActionResult> UpdateEmployee(int id, [FromBody] EmployeeDto employeeDto)
        {
            var hasPermission = User.HasClaim("permissions", "_editEmployee");
            if (!hasPermission) return Forbid();
            if (!ModelState.IsValid) return BadRequest(ModelState);
            if (id <= 0) return BadRequest("Invalid ID");
            if (id != employeeDto.Id) return BadRequest("ID mismatch");

            if (!TryGetCurrentUserId(out var userId)) return BadRequest("Invalid User ID");

            employeeDto.ModifiedBy = userId;

            var command = new EmployeeUpdateCmd(id, employeeDto);

            var result = await _mediator.Send(command);
            if (!result.Success) return BadRequest(result.Message);

            return Ok(result);

        }

        [HttpDelete("{id}")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DeleteEmployee(int id)
        {
            var hasPermission = User.HasClaim("permissions", "_deleteEmployee");
            if (!hasPermission) return Forbid();
            if (id <= 0) return BadRequest("Invalid ID");

            var command = new EmployeeDeleteCmd(id);
            var result = await _mediator.Send(command);
            if (!result.Success) return BadRequest(result.Message);

            return NoContent();
        }

        // Employee Search Endpoints
        [HttpGet("search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> SearchEmployees([FromQuery] string searchTerm, [FromQuery] int? limit = 50, [FromQuery] bool? active = true, [FromQuery] int? siteId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(FMSResponse.FailedResponse("Search term is required"));
                }

                // Normalize search term for consistent caching
                var normalizedSearchTerm = searchTerm.Trim().ToLower();
                var cacheKey = $"EmpSearch:{normalizedSearchTerm}:{limit}:{active}:{siteId}";

                // Try cache first - but only for searches with 3+ characters to avoid caching too many variations
                if (normalizedSearchTerm.Length >= 3)
                {
                    var cached = await _cache.GetStringAsync(cacheKey);
                    if (!string.IsNullOrEmpty(cached))
                    {
                        var cachedResult = JsonSerializer.Deserialize<FMSResponse<List<EmployeeDto>>>(cached);
                        return Ok(cachedResult);
                    }
                }

                var query = new SearchEmployeeQuery
                {
                    SearchTerm = searchTerm,
                    Limit = limit,
                    Active = active,
                    SiteId = siteId
                };

                var result = await _mediator.Send(query);

                // Cache successful results with shorter TTL for fresh data
                if (result.IsSuccess && normalizedSearchTerm.Length >= 3)
                {
                    var options = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(10),
                        SlidingExpiration = TimeSpan.FromMinutes(5)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), options);
                }

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error searching employees", error = ex.Message });
            }
        }

        [HttpGet("quick-search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> QuickSearchEmployees([FromQuery] string searchTerm, [FromQuery] int limit = 10, [FromQuery] bool? active = true)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(FMSResponse.FailedResponse("Search term is required"));
                }
                if (searchTerm.Length < 2)
                {
                    return BadRequest(FMSResponse.FailedResponse("Search term must be at least 2 characters long"));
                }

                // Normalize for consistent caching
                var normalizedSearchTerm = searchTerm.Trim().ToLower();
                var cacheKey = $"EmpQuick:{normalizedSearchTerm}:{limit}:{active}";

                var cached = await _cache.GetStringAsync(cacheKey);
                if (!string.IsNullOrEmpty(cached))
                {
                    var cachedResult = JsonSerializer.Deserialize<FMSResponse<List<EmployeeDto>>>(cached);
                    return Ok(cachedResult);
                }

                var query = new SearchEmployeeQuery
                {
                    SearchTerm = searchTerm,
                    Limit = limit,
                    Active = active
                };

                var result = await _mediator.Send(query);

                // Cache with sliding expiration for frequently accessed searches
                if (result.IsSuccess)
                {
                    var options = new DistributedCacheEntryOptions
                    {
                        AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15),
                        SlidingExpiration = TimeSpan.FromMinutes(5)
                    };
                    await _cache.SetStringAsync(cacheKey, JsonSerializer.Serialize(result), options);
                }

                if (!result.IsSuccess)
                    return BadRequest(result);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error in quick employee search", error = ex.Message });
            }
        }

        [HttpGet("debug-search")]
        [Authorize(AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
        public async Task<IActionResult> DebugSearchEmployees([FromQuery] string searchTerm, [FromQuery] int? limit = 50, [FromQuery] bool? active = true, [FromQuery] int? siteId = null)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(searchTerm))
                {
                    return BadRequest(FMSResponse.FailedResponse("Search term is required"));
                }

                // NO CACHING - Direct query to see what's actually happening
                var query = new SearchEmployeeQuery
                {
                    SearchTerm = searchTerm,
                    Limit = limit,
                    Active = active,
                    SiteId = siteId
                };

                var result = await _mediator.Send(query);

                return Ok(result);
            }
            catch (Exception ex)
            {
                return StatusCode(500, new { message = "Error in debug search", error = ex.Message });
            }
        }

    }
}