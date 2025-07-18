// //Cursor: API Controller for Automated Fueling Configuration CRUD operations
// using System;
// using System.Collections.Generic;
// using System.Linq;
// using System.Threading.Tasks;
// using FMS.Application.Command.DatabaseCommand.ConfigurationCommand;
// using FMS.Application.Common;
// using FMS.Application.ModelsDTOs.Configuration;
// using FMS.Application.Queries.Database.ConfigurationQuery;
// using MediatR;
// using Microsoft.AspNetCore.Authentication.JwtBearer;
// using Microsoft.AspNetCore.Authorization;
// using Microsoft.AspNetCore.Mvc;
// using Microsoft.Extensions.Logging;

// namespace FMS.WebClient.Controllers {
//     [ApiController]
//     [Route ("api/automated-fueling-configuration")]
//     [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
//     public class ConfigurationController : ControllerBase {
//         private readonly IMediator _mediator;
//         private readonly ILogger<ConfigurationController> _logger;

//         public ConfigurationController (
//             IMediator mediator,
//             ILogger<ConfigurationController> logger) {
//             _mediator = mediator;
//             _logger = logger;
//         }

//         /// <summary>
//         /// Get all automated fueling configurations
//         /// </summary>
//         [HttpGet]
//         public async Task<ActionResult<FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>>>> GetConfigurations (
//             [FromQuery] int? siteId = null, [FromQuery] bool? isActive = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) {
//             try {
//                 var query = new GetConfigurationsListQuery (siteId, isActive, page, pageSize);
//                 var result = await _mediator.Send (query);

//                 if (!result.Success) {
//                     return BadRequest (result);
//                 }

//                 return Ok (result);
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error retrieving automated fueling configurations");
//                 return StatusCode (500, new FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>> (
//                     false, "Internal server error", null));
//             }
//         }

//         /// <summary>
//         /// Get a specific configuration by ID
//         /// </summary>
//         [HttpGet ("{id}")]
//         public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> GetConfiguration (int id) {
//             try {
//                 var query = new GetAutomatedFuelingConfigurationQuery (id);
//                 var result = await _mediator.Send (query);

//                 if (!result.Success) {
//                     return NotFound (result);
//                 }

//                 return Ok (result);
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error retrieving configuration {ConfigId}", id);
//                 return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                     false, "Internal server error", null));
//             }
//         }

//         /// <summary>
//         /// Create a new configuration
//         /// </summary>
//         [HttpPost]
//         public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> CreateConfiguration (
//             [FromBody] CreateAutomatedFuelingConfigurationDto createDto) {
//             try {
//                 if (!ModelState.IsValid) {
//                     return BadRequest (ModelState);
//                 }

//                 var currentUser = User?.Identity?.Name ?? "System"; // ToDO: Use a more robust user retrieval method
//                 var command = new CreateAutomatedFuelingConfigurationCommand (createDto, currentUser);
//                 var result = await _mediator.Send (command);

//                 if (!result.Success) {
//                     return BadRequest (result);
//                 }

//                 return CreatedAtAction (
//                     nameof (GetConfiguration),
//                     new { id = result.Data.Id },
//                     result);
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error creating configuration");
//                 return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                     false, "Internal server error", null));
//             }
//         }

//         /// <summary>
//         /// Update an existing configuration
//         /// </summary>
//         [HttpPut ("{id}")]
//         public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> UpdateConfiguration (
//             int id, [FromBody] UpdateAutomatedFuelingConfigurationDto updateDto) {
//             try {
//                 if (!ModelState.IsValid) {
//                     return BadRequest (ModelState);
//                 }

//                 if (id != updateDto.Id) {
//                     return BadRequest (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                         false, "ID mismatch", null));
//                 }

//                 var currentUser = User?.Identity?.Name ?? "System"; // ToDO: Use a more robust user retrieval method
//                 var command = new UpdateAutomatedFuelingConfigurationCommand (updateDto, currentUser);
//                 var result = await _mediator.Send (command);

//                 if (!result.Success) {
//                     return BadRequest (result);
//                 }

//                 return Ok (result);
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error updating configuration {ConfigId}", id);
//                 return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                     false, "Internal server error", null));
//             }
//         }

//         /// <summary>
//         /// Delete a configuration
//         /// </summary>
//         [HttpDelete ("{id}")]
//         public async Task<ActionResult<FMSResponseMessage>> DeleteConfiguration (int id) {
//             try {
//                 var command = new DeleteAutomatedFuelingConfigurationCommand (id);
//                 var result = await _mediator.Send (command);

//                 if (!result.Success) {
//                     return BadRequest (result);
//                 }

//                 return Ok (result);
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error deleting configuration {ConfigId}", id);
//                 return StatusCode (500, new FMSResponseMessage (false, "Internal server error"));
//             }
//         }

//         /// <summary>
//         /// Get effective configuration for a site
//         /// </summary>
//         [HttpGet ("site/{siteId}")]
//         public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> GetSiteConfiguration (int siteId) {
//             try {
//                 // Try site-specific first
//                 var siteQuery = new GetConfigurationsListQuery (siteId, true, 1, 1);
//                 var siteResult = await _mediator.Send (siteQuery);

//                 if (siteResult.Success && siteResult.Data.Any ()) {
//                     return Ok (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                         true, "Site-specific configuration", siteResult.Data.First ()));
//                 }

//                 // Fall back to global
//                 var globalQuery = new GetConfigurationsListQuery (null, true, 1, 1);
//                 var globalResult = await _mediator.Send (globalQuery);

//                 if (globalResult.Success && globalResult.Data.Any ()) {
//                     return Ok (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                         true, "Global configuration (fallback)", globalResult.Data.First ()));
//                 }

//                 return NotFound (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                     false, "No configuration found", null));
//             } catch (Exception ex) {
//                 _logger.LogError (ex, "Error retrieving configuration for site {SiteId}", siteId);
//                 return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
//                     false, "Internal server error", null));
//             }
//         }
//     }
// }