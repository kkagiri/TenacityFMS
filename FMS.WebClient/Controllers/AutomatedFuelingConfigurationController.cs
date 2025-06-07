//Cursor: API Controller for Automated Fueling Configuration CRUD operations
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.ConfigurationCommand;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.Configuration;
using FMS.Application.Queries.Database.ConfigurationQuery;
using FMS.WebClient.Infrastructure;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/[controller]")]
    [Authorize]
    public class AutomatedFuelingConfigurationController : ControllerBase {
        private readonly IMediator _mediator;
        private readonly ILogger<AutomatedFuelingConfigurationController> _logger;

        public AutomatedFuelingConfigurationController (
            IMediator mediator,
            ILogger<AutomatedFuelingConfigurationController> logger) {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get all automated fueling configurations
        /// </summary>
        /// <param name="siteId">Filter by site ID (optional)</param>
        /// <param name="isActive">Filter by active status (optional)</param>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 50)</param>
        /// <returns>List of configurations</returns>
        [HttpGet]
        public async Task<ActionResult<FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>>>> GetConfigurations (
            [FromQuery] int? siteId = null, [FromQuery] bool? isActive = null, [FromQuery] int page = 1, [FromQuery] int pageSize = 50) {
            try {
                var query = new GetConfigurationsListQuery (siteId, isActive, page, pageSize);
                var result = await _mediator.Send (query);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving automated fueling configurations");
                return StatusCode (500, new FMSResponseMessage<IEnumerable<AutomatedFuelingConfigurationDto>> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Get a specific automated fueling configuration by ID
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Configuration details</returns>
        [HttpGet ("{id}")]
        public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> GetConfiguration (int id) {
            try {
                var query = new GetAutomatedFuelingConfigurationQuery (id);
                var result = await _mediator.Send (query);

                if (!result.Success) {
                    return NotFound (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving automated fueling configuration {ConfigId}", id);
                return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Create a new automated fueling configuration
        /// </summary>
        /// <param name="createDto">Configuration data</param>
        /// <returns>Created configuration</returns>
        [HttpPost]
        public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> CreateConfiguration (
            [FromBody] CreateAutomatedFuelingConfigurationDto createDto) {
            try {
                if (!ModelState.IsValid) {
                    return BadRequest (ModelState);
                }

                var currentUser = HttpContext.GetCurrentUserId () ?? "System";
                var command = new CreateAutomatedFuelingConfigurationCommand (createDto, currentUser);
                var result = await _mediator.Send (command);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return CreatedAtAction (
                    nameof (GetConfiguration),
                    new { id = result.Data.Id },
                    result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating automated fueling configuration");
                return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Update an existing automated fueling configuration
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <param name="updateDto">Updated configuration data</param>
        /// <returns>Updated configuration</returns>
        [HttpPut ("{id}")]
        public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> UpdateConfiguration (
            int id, [FromBody] UpdateAutomatedFuelingConfigurationDto updateDto) {
            try {
                if (!ModelState.IsValid) {
                    return BadRequest (ModelState);
                }

                if (id != updateDto.Id) {
                    return BadRequest (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        false, "ID in URL does not match ID in body", null));
                }

                var currentUser = HttpContext.GetCurrentUserId () ?? "System";
                var command = new UpdateAutomatedFuelingConfigurationCommand (updateDto, currentUser);
                var result = await _mediator.Send (command);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating automated fueling configuration {ConfigId}", id);
                return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Delete an automated fueling configuration
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Success/failure result</returns>
        [HttpDelete ("{id}")]
        public async Task<ActionResult<FMSResponseMessage>> DeleteConfiguration (int id) {
            try {
                var command = new DeleteAutomatedFuelingConfigurationCommand (id);
                var result = await _mediator.Send (command);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting automated fueling configuration {ConfigId}", id);
                return StatusCode (500, new FMSResponseMessage (false, "Internal server error"));
            }
        }

        /// <summary>
        /// Get configuration for a specific site (including fallback to global)
        /// </summary>
        /// <param name="siteId">Site ID</param>
        /// <returns>Effective configuration for the site</returns>
        [HttpGet ("site/{siteId}")]
        public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> GetSiteConfiguration (int siteId) {
            try {
                // First try to get site-specific configuration
                var siteQuery = new GetConfigurationsListQuery (siteId, true, 1, 1);
                var siteResult = await _mediator.Send (siteQuery);

                if (siteResult.Success && siteResult.Data.Any ()) {
                    return Ok (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        true, "Site-specific configuration found", siteResult.Data.First ()));
                }

                // Fall back to global configuration
                var globalQuery = new GetConfigurationsListQuery (null, true, 1, 1);
                var globalResult = await _mediator.Send (globalQuery);

                if (globalResult.Success && globalResult.Data.Any ()) {
                    return Ok (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        true, "Global configuration used (no site-specific configuration found)", globalResult.Data.First ()));
                }

                return NotFound (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                    false, "No configuration found for site or global settings", null));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving configuration for site {SiteId}", siteId);
                return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Get the global configuration
        /// </summary>
        /// <returns>Global configuration</returns>
        [HttpGet ("global")]
        public async Task<ActionResult<FMSResponseMessage<AutomatedFuelingConfigurationDto>>> GetGlobalConfiguration () {
            try {
                var query = new GetConfigurationsListQuery (null, true, 1, 1);
                var result = await _mediator.Send (query);

                if (!result.Success || !result.Data.Any ()) {
                    return NotFound (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        false, "Global configuration not found", null));
                }

                return Ok (new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                    true, "Global configuration retrieved", result.Data.First ()));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving global configuration");
                return StatusCode (500, new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                    false, "Internal server error", null));
            }
        }
    }
}