/**
 * File: AlertConfigurationController.cs
 * Purpose: API controller for managing alert configuration thresholds
 * Dependencies: MediatR, Alert Configuration Queries/Commands
 * Last Modified: 2026-02-07
 *
 * Endpoints:
 * - GET /api/v1/alert-configuration — List all alert configurations grouped
 * - GET /api/v1/alert-configuration/{alertType} — Get config for specific alert type
 * - PUT /api/v1/alert-configuration/{alertType} — Update alert type configuration
 * - PUT /api/v1/alert-configuration/{alertType}/toggle — Enable/disable alert type
 * - POST /api/v1/alert-configuration/{alertType}/reset — Reset to defaults
 * - POST /api/v1/alert-configuration/seed — Seed all defaults (admin only)
 */

using System.Linq;
using System.Threading.Tasks;
using FMS.Application.Features.Notification.Commands.AlertConfiguration;
using FMS.Application.Features.Notification.DTOs.AlertConfiguration;
using FMS.Application.Features.Notification.Queries.AlertConfiguration;
using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FMS.WebClient.Controllers
{
    [ApiController]
    [Route("api/v1/alert-configuration")]
    [Authorize]
    public class AlertConfigurationController : ControllerBase
    {
        private readonly IMediator _mediator;

        public AlertConfigurationController(IMediator mediator)
        {
            _mediator = mediator;
        }

        /// <summary>
        /// Get all alert configurations grouped by category
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var result = await _mediator.Send(new GetAlertConfigurationsQuery());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get configuration for a specific alert type
        /// </summary>
        [HttpGet("{alertType}")]
        public async Task<IActionResult> GetByType(string alertType)
        {
            var result = await _mediator.Send(new GetAlertConfigurationByTypeQuery(alertType));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Update alert type configuration (thresholds and/or enabled state)
        /// </summary>
        [HttpPut("{alertType}")]
        public async Task<IActionResult> Update(string alertType, [FromBody] UpdateAlertConfigurationRequestDto request)
        {
            var result = await _mediator.Send(new UpdateAlertConfigurationCommand(
                alertType, request.Enabled, request.Parameters));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Toggle an alert type on or off
        /// </summary>
        [HttpPut("{alertType}/toggle")]
        public async Task<IActionResult> Toggle(string alertType, [FromBody] ToggleAlertRequest request)
        {
            var result = await _mediator.Send(new ToggleAlertCommand(alertType, request.Enabled));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Reset an alert type to factory defaults
        /// </summary>
        [HttpPost("{alertType}/reset")]
        public async Task<IActionResult> Reset(string alertType)
        {
            var result = await _mediator.Send(new ResetAlertDefaultsCommand(alertType));
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Seed all alert configuration defaults (admin only).
        /// Only creates entries that don't already exist.
        /// </summary>
        [HttpPost("seed")]
        public async Task<IActionResult> Seed()
        {
            var result = await _mediator.Send(new SeedAlertConfigurationCommand());
            return result.IsSuccess ? Ok(result) : BadRequest(result);
        }

        /// <summary>
        /// Get enabled alert types as a flat list for policy trigger selection.
        /// Returns key, displayName, group, and current threshold parameters.
        /// </summary>
        [HttpGet("enabled-types")]
        public async Task<IActionResult> GetEnabledTypes()
        {
            var result = await _mediator.Send(new GetAlertConfigurationsQuery());
            if (!result.IsSuccess) return BadRequest(result);

            // Flatten all groups → only enabled alert types
            var enabledTypes = (result.Data ?? new System.Collections.Generic.List<AlertTypeGroupDto>())
                .SelectMany(g => g.AlertTypes.Where(a => a.Enabled).Select(a => new
                {
                    a.Key,
                    a.DisplayName,
                    a.Description,
                    a.Group,
                    ThresholdSummary = string.Join(", ",
                        a.Parameters
                            .Where(p => p.CurrentValue != null)
                            .Select(p => $"{p.DisplayName}: {p.CurrentValue}{(p.Unit != null ? " " + p.Unit : "")}"))
                }))
                .ToList();

            return Ok(new { isSuccess = true, data = enabledTypes, message = $"{enabledTypes.Count} enabled alert types" });
        }
    }

    /// <summary>
    /// Request body for toggle endpoint
    /// </summary>
    public class ToggleAlertRequest
    {
        public bool Enabled { get; set; }
    }
}
