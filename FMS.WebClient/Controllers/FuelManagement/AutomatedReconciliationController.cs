// using FMS.Application.Common;
// using FMS.Application.Features.AutomatedReconciliation.Commands;
// using FMS.Application.Features.AutomatedReconciliation.Entities;
// using FMS.Application.ModelsDTOs.FMS.AutomatedReconciliation;
// using MediatR;
// using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;

// namespace FMS.WebClient.Controllers;

// [Route ("api/v1/automated-reconciliation")]
// [ApiController]
// [Authorize (Roles = "Admin,User")]
// public class AutomatedReconciliationController : ControllerBase {
//     private readonly IMediator _mediator;

//     public AutomatedReconciliationController (IMediator mediator) {
//         _mediator = mediator;
//     }

//     // Policy Management Endpoints
//     [HttpGet ("policies")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> GetPolicies (
//         [FromQuery] bool? isActive = null, [FromQuery] int? siteId = null, [FromQuery] string? policyType = null, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20) {

//         var hasPermission = User.HasClaim ("permissions", "_Read_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (pageNumber < 1) pageNumber = 1;
//         if (pageSize < 1 || pageSize > 100) pageSize = 20;

//         var query = new GetPoliciesQuery {
//             IsActive = isActive,
//             SiteId = siteId,
//             PolicyType = policyType,
//             PageNumber = pageNumber,
//             PageSize = pageSize
//         };

//         var result = await _mediator.Send (query);
//         return Ok (result);
//     }

//     [HttpGet ("policies/{id}")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> GetPolicyById (int id) {
//         var hasPermission = User.HasClaim ("permissions", "_Read_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (id <= 0) return BadRequest (FMSResponse.FailedResponse ("Invalid policy ID"));

//         var result = await _mediator.Send (new GetPolicyByIdQuery { PolicyId = id });

//         if (!result.IsSuccess) {
//             return result.ErrorType == ErrorType.Validation ? NotFound (result) : BadRequest (result);
//         }

//         return Ok (result);
//     }

//     [HttpPost ("policies")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> CreatePolicy ([FromBody] CreatePolicyRequest request) {
//         var hasPermission = User.HasClaim ("permissions", "_Create_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (!ModelState.IsValid) return BadRequest (ModelState);

//         var userIdClaim = User.Claims.FirstOrDefault (c =>
//             c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
//             Guid.TryParse (c.Value, out _));

//         if (userIdClaim == null) {
//             return BadRequest (FMSResponse.FailedResponse ("Invalid User ID"));
//         }

//         var command = new CreatePolicyCommand {
//             PolicyData = request,
//             CreatedBy = userIdClaim.Value
//         };

//         var result = await _mediator.Send (command);

//         if (!result.IsSuccess) {
//             return BadRequest (result);
//         }

//         return CreatedAtAction (
//             nameof (GetPolicyById),
//             new { id = result.Data.Id },
//             result);
//     }

//     [HttpPut ("policies/{id}")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> UpdatePolicy (int id, [FromBody] UpdatePolicyRequest request) {
//         var hasPermission = User.HasClaim ("permissions", "_Update_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (!ModelState.IsValid) return BadRequest (ModelState);
//         if (id != request.Id) return BadRequest (FMSResponse.FailedResponse ("ID mismatch"));

//         var userIdClaim = User.Claims.FirstOrDefault (c =>
//             c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
//             Guid.TryParse (c.Value, out _));

//         if (userIdClaim == null) {
//             return BadRequest (FMSResponse.FailedResponse ("Invalid User ID"));
//         }

//         var command = new UpdatePolicyCommand {
//             PolicyData = request,
//             ModifiedBy = userIdClaim.Value
//         };

//         var result = await _mediator.Send (command);

//         if (!result.IsSuccess) {
//             return result.ErrorType == ErrorType.Validation ? NotFound (result) : BadRequest (result);
//         }

//         return Ok (result);
//     }

//     [HttpDelete ("policies/{id}")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> DeletePolicy (int id) {
//         var hasPermission = User.HasClaim ("permissions", "_Delete_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (id <= 0) return BadRequest (FMSResponse.FailedResponse ("Invalid policy ID"));

//         var userIdClaim = User.Claims.FirstOrDefault (c =>
//             c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
//             Guid.TryParse (c.Value, out _));

//         if (userIdClaim == null) {
//             return BadRequest (FMSResponse.FailedResponse ("Invalid User ID"));
//         }

//         var command = new DeletePolicyCommand {
//             PolicyId = id,
//             ModifiedBy = userIdClaim.Value
//         };

//         var result = await _mediator.Send (command);

//         if (!result.IsSuccess) {
//             return result.ErrorType == ErrorType.Validation ? NotFound (result) : BadRequest (result);
//         }

//         return NoContent ();
//     }

//     // Execution Monitoring Endpoints
//     [HttpGet ("executions")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> GetExecutions (
//         [FromQuery] int? policyId = null, [FromQuery] string? status = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int? siteId = null, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20) {

//         var hasPermission = User.HasClaim ("permissions", "_Read_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (pageNumber < 1) pageNumber = 1;
//         if (pageSize < 1 || pageSize > 100) pageSize = 20;

//         var query = new GetExecutionsQuery {
//             PolicyId = policyId,
//             Status = status,
//             StartDate = startDate,
//             EndDate = endDate,
//             SiteId = siteId,
//             PageNumber = pageNumber,
//             PageSize = pageSize
//         };

//         var result = await _mediator.Send (query);
//         return Ok (result);
//     }

//     [HttpGet ("executions/{id}")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> GetExecutionById (int id) {
//         var hasPermission = User.HasClaim ("permissions", "_Read_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (id <= 0) return BadRequest (FMSResponse.FailedResponse ("Invalid execution ID"));

//         var result = await _mediator.Send (new GetExecutionByIdQuery { ExecutionId = id });

//         if (!result.IsSuccess) {
//             return result.ErrorType == ErrorType.Validation ? NotFound (result) : BadRequest (result);
//         }

//         return Ok (result);
//     }

//     [HttpPost ("executions/manual-trigger")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> TriggerManualExecution ([FromBody] ManualExecutionRequest request) {
//         var hasPermission = User.HasClaim ("permissions", "_Execute_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (!ModelState.IsValid) return BadRequest (ModelState);

//         var userIdClaim = User.Claims.FirstOrDefault (c =>
//             c.Type == "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier" &&
//             Guid.TryParse (c.Value, out _));

//         if (userIdClaim == null) {
//             return BadRequest (FMSResponse.FailedResponse ("Invalid User ID"));
//         }

//         var command = new TriggerManualExecutionCommand {
//             PolicyId = request.PolicyId,
//             SiteId = request.SiteId,
//             TankIds = request.TankIds,
//             TriggeredBy = userIdClaim.Value,
//             Reason = request.Reason
//         };

//         var result = await _mediator.Send (command);

//         if (!result.IsSuccess) {
//             return BadRequest (result);
//         }

//         return Accepted (result);
//     }

//     // Discrepancy Analysis Endpoints
//     [HttpGet ("discrepancies")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> GetDiscrepancies (
//         [FromQuery] int? siteId = null, [FromQuery] int? tankId = null, [FromQuery] string? severity = null, [FromQuery] bool? isResolved = null, [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int pageNumber = 1, [FromQuery] int pageSize = 20) {

//         var hasPermission = User.HasClaim ("permissions", "_Read_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         if (pageNumber < 1) pageNumber = 1;
//         if (pageSize < 1 || pageSize > 100) pageSize = 20;

//         var query = new GetDiscrepanciesQuery {
//             SiteId = siteId,
//             TankId = tankId,
//             Severity = severity,
//             IsResolved = isResolved,
//             StartDate = startDate,
//             EndDate = endDate,
//             PageNumber = pageNumber,
//             PageSize = pageSize
//         };

//         var result = await _mediator.Send (query);
//         return Ok (result);
//     }

//     // Performance Analytics Endpoints
//     [HttpGet ("analytics/dashboard")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> GetAnalyticsDashboard (
//         [FromQuery] DateTime? startDate = null, [FromQuery] DateTime? endDate = null, [FromQuery] int? siteId = null) {

//         var hasPermission = User.HasClaim ("permissions", "_Read_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         var query = new GetAnalyticsDashboardQuery {
//             StartDate = startDate,
//             EndDate = endDate,
//             SiteId = siteId
//         };

//         var result = await _mediator.Send (query);
//         return Ok (result);
//     }

//     // System Health Endpoints
//     [HttpGet ("system/health")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public async Task<IActionResult> GetSystemHealth () {
//         var hasPermission = User.HasClaim ("permissions", "_Read_tankReconciliation");
//         if (!hasPermission) return Forbid ();

//         var healthData

//         return Ok (FMSResponse<object>.Success (healthData, "System is healthy"));
//     }
// }

// // Request Models