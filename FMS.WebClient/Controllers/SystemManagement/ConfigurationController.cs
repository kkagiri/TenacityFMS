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
