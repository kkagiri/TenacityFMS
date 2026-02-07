/**
 * File: GetAlertConfigurationsQueryHandler.cs
 * Purpose: Handler for GetAlertConfigurationsQuery — returns grouped alert configurations
 * Dependencies: IAlertConfigurationService, AlertConfigurationConstants
 * Last Modified: 2026-02-07
 */

using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.Notification.DTOs.AlertConfiguration;
using FMS.Application.Features.Notification.Services.AlertConfiguration;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.Notification.Queries.AlertConfiguration
{
    public class GetAlertConfigurationsQueryHandler
        : IRequestHandler<GetAlertConfigurationsQuery, FMSResponse<List<AlertTypeGroupDto>>>
    {
        private readonly IAlertConfigurationService _alertConfigService;
        private readonly ILogger<GetAlertConfigurationsQueryHandler> _logger;

        public GetAlertConfigurationsQueryHandler(
            IAlertConfigurationService alertConfigService,
            ILogger<GetAlertConfigurationsQueryHandler> logger)
        {
            _alertConfigService = alertConfigService;
            _logger = logger;
        }

        public async Task<FMSResponse<List<AlertTypeGroupDto>>> Handle(
            GetAlertConfigurationsQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var allConfigs = await _alertConfigService.GetAllAlertConfigurationsAsync(cancellationToken);
                var groups = AlertConfigurationConstants.GetAlertGroups();

                var result = new List<AlertTypeGroupDto>();

                foreach (var group in groups)
                {
                    var groupAlerts = allConfigs
                        .Where(c => group.AlertTypes.Contains(c.Key))
                        .Select(c => new AlertConfigurationDto
                        {
                            Key = c.Key,
                            DisplayName = c.DisplayName,
                            Description = c.Description,
                            Group = c.Group,
                            Enabled = c.Enabled,
                            Parameters = c.Parameters.Select(p => new AlertParameterDto
                            {
                                Name = p.Name,
                                DisplayName = p.DisplayName,
                                DataType = p.DataType,
                                Unit = p.Unit,
                                Required = p.Required,
                                CurrentValue = p.CurrentValue,
                                DefaultValue = p.DefaultValue,
                                Description = p.Description
                            }).ToList()
                        })
                        .ToList();

                    result.Add(new AlertTypeGroupDto
                    {
                        GroupName = group.Name,
                        Icon = group.Icon,
                        Description = group.Description,
                        TotalAlerts = groupAlerts.Count,
                        EnabledAlerts = groupAlerts.Count(a => a.Enabled),
                        AlertTypes = groupAlerts
                    });
                }

                return FMSResponse<List<AlertTypeGroupDto>>.Success(result, "Alert configurations retrieved successfully");
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve alert configurations");
                return FMSResponse<List<AlertTypeGroupDto>>.Failed("Failed to retrieve alert configurations");
            }
        }
    }
}
