//Cursor: API Controller for System-wide Configuration CRUD operations
using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.SystemConfiguration;
using FMS.Application.Queries.Database.SystemConfigurationQueries;
using MediatR;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace FMS.WebClient.Controllers {
    [ApiController]
    [Route ("api/[controller]")]
    [Authorize (AuthenticationSchemes = JwtBearerDefaults.AuthenticationScheme)]
    public class SystemConfigurationController : ControllerBase {
        private readonly IMediator _mediator;
        private readonly ILogger<SystemConfigurationController> _logger;

        public SystemConfigurationController (
            IMediator mediator,
            ILogger<SystemConfigurationController> logger) {
            _mediator = mediator;
            _logger = logger;
        }

        /// <summary>
        /// Get all system configurations
        /// </summary>
        /// <param name="page">Page number (default: 1)</param>
        /// <param name="pageSize">Page size (default: 50)</param>
        /// <param name="category">Filter by category</param>
        /// <param name="dataType">Filter by data type</param>
        /// <param name="isEditable">Filter by editable status</param>
        /// <param name="isActive">Filter by active status</param>
        /// <param name="searchTerm">Search term</param>
        /// <returns>List of system configurations</returns>
        [HttpGet]
        public async Task<ActionResult<FMSResponseMessage<IEnumerable<SystemConfigurationDto>>>> GetConfigurations (
            [FromQuery] int page = 1, [FromQuery] int pageSize = 50, [FromQuery] string? category = null, [FromQuery] string? dataType = null, [FromQuery] string? isEditable = null, [FromQuery] string? isActive = null, [FromQuery] string? searchTerm = null) {
            try {
                // Parse boolean parameters safely
                bool? isEditableParsed = null;
                bool? isActiveParsed = null;

                if (!string.IsNullOrEmpty (isEditable) && !isEditable.Equals ("null", StringComparison.OrdinalIgnoreCase)) {
                    if (bool.TryParse (isEditable, out bool editableValue)) {
                        isEditableParsed = editableValue;
                    }
                }

                if (!string.IsNullOrEmpty (isActive) && !isActive.Equals ("null", StringComparison.OrdinalIgnoreCase)) {
                    if (bool.TryParse (isActive, out bool activeValue)) {
                        isActiveParsed = activeValue;
                    }
                }

                var query = new GetSystemConfigurationsListQuery (page, pageSize) {
                    Category = category,
                    DataType = dataType,
                    IsEditable = isEditableParsed,
                    IsActive = isActiveParsed,
                    SearchTerm = searchTerm
                };
                var result = await _mediator.Send (query);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving system configurations");
                return StatusCode (500, new FMSResponseMessage<IEnumerable<SystemConfigurationDto>> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Get a specific system configuration by ID
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Configuration details</returns>
        [HttpGet ("{id}")]
        public async Task<ActionResult<FMSResponseMessage<SystemConfigurationDto>>> GetConfiguration (int id) {
            try {
                var query = new GetSystemConfigurationQuery (id);
                var result = await _mediator.Send (query);

                if (!result.Success) {
                    return NotFound (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving system configuration {ConfigId}", id);
                return StatusCode (500, new FMSResponseMessage<SystemConfigurationDto> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Create a new system configuration
        /// </summary>
        /// <param name="createDto">Configuration data</param>
        /// <returns>Created configuration</returns>
        [HttpPost]
        public async Task<ActionResult<FMSResponseMessage<SystemConfigurationDto>>> CreateConfiguration (
            [FromBody] CreateSystemConfigurationDto createDto) {
            try {
                if (!ModelState.IsValid) {
                    return BadRequest (ModelState);
                }

                var currentUser = User?.Identity?.Name ?? "System"; // ToDO: Use a more robust user retrieval method
                var command = new CreateSystemConfigurationCommand (createDto, currentUser);
                var result = await _mediator.Send (command);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return CreatedAtAction (
                    nameof (GetConfiguration),
                    new { id = result.Data.Id },
                    result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error creating system configuration");
                return StatusCode (500, new FMSResponseMessage<SystemConfigurationDto> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Update an existing system configuration
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <param name="updateDto">Updated configuration data</param>
        /// <returns>Updated configuration</returns>
        [HttpPut ("{id}")]
        public async Task<ActionResult<FMSResponseMessage<SystemConfigurationDto>>> UpdateConfiguration (
            int id, [FromBody] UpdateSystemConfigurationDto updateDto) {
            try {
                if (!ModelState.IsValid) {
                    return BadRequest (ModelState);
                }

                if (id != updateDto.Id) {
                    return BadRequest (new FMSResponseMessage<SystemConfigurationDto> (
                        false, "ID mismatch", null));
                }

                var currentUser = User?.Identity?.Name ?? "System"; // ToDO: Use a more robust user retrieval method
                var command = new UpdateSystemConfigurationCommand (updateDto, currentUser);
                var result = await _mediator.Send (command);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error updating system configuration {ConfigId}", id);
                return StatusCode (500, new FMSResponseMessage<SystemConfigurationDto> (
                    false, "Internal server error", null));
            }
        }

        /// <summary>
        /// Delete a system configuration
        /// </summary>
        /// <param name="id">Configuration ID</param>
        /// <returns>Success/failure result</returns>
        [HttpDelete ("{id}")]
        public async Task<ActionResult<FMSResponseMessage>> DeleteConfiguration (int id) {
            try {
                var command = new DeleteSystemConfigurationCommand (id);
                var result = await _mediator.Send (command);

                if (!result.Success) {
                    return BadRequest (result);
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error deleting system configuration {ConfigId}", id);
                return StatusCode (500, new FMSResponseMessage (false, "Internal server error"));
            }
        }

        /// <summary>
        /// Get current system configuration (active configuration)
        /// </summary>
        /// <returns>Active system configuration</returns>
        [HttpGet ("current")]
        public async Task<ActionResult<FMSResponseMessage<SystemConfigurationDto>>> GetCurrentConfiguration () {
            try {
                var query = new GetCurrentSystemConfigurationQuery ();
                var result = await _mediator.Send (query);

                if (!result.Success) {
                    return NotFound (new FMSResponseMessage<SystemConfigurationDto> (
                        false, "No active system configuration found", null));
                }

                return Ok (result);
            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving current system configuration");
                return StatusCode (500, new FMSResponseMessage<SystemConfigurationDto> (
                    false, "Internal server error", null));
            }
        }
    }
}