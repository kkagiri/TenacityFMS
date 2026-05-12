/**
 * File: GetAlertConfigurationByTypeQueryHandler.cs
 * Purpose: Handler for GetAlertConfigurationByTypeQuery
 * Dependencies: IAlertConfigurationService, AlertConfigurationConstants
 * Last Modified: 2026-02-07
 */

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
    public class GetAlertConfigurationByTypeQueryHandler
        : IRequestHandler<GetAlertConfigurationByTypeQuery, FMSResponse<AlertConfigurationDto>>
    {
        private readonly IAlertConfigurationService _alertConfigService;
        private readonly ILogger<GetAlertConfigurationByTypeQueryHandler> _logger;

        public GetAlertConfigurationByTypeQueryHandler(
            IAlertConfigurationService alertConfigService,
            ILogger<GetAlertConfigurationByTypeQueryHandler> logger)
        {
            _alertConfigService = alertConfigService;
            _logger = logger;
        }

        public async Task<FMSResponse<AlertConfigurationDto>> Handle(
            GetAlertConfigurationByTypeQuery request,
            CancellationToken cancellationToken)
        {
            try
            {
                var allTypes = AlertConfigurationConstants.GetAllAlertTypes();
                if (!allTypes.ContainsKey(request.AlertType))
                {
                    return FMSResponse<AlertConfigurationDto>.Failed($"Unknown alert type: {request.AlertType}");
                }

                var allConfigs = await _alertConfigService.GetAllAlertConfigurationsAsync(cancellationToken);
                var config = allConfigs.FirstOrDefault(c => c.Key == request.AlertType);

                if (config == null)
                {
                    return FMSResponse<AlertConfigurationDto>.Failed($"Configuration not found for alert type: {request.AlertType}");
                }

                var dto = new AlertConfigurationDto
                {
                    Key = config.Key,
                    DisplayName = config.DisplayName,
                    Description = config.Description,
                    Group = config.Group,
                    Enabled = config.Enabled,
                    Parameters = config.Parameters.Select(p => new AlertParameterDto
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
                };

                return FMSResponse<AlertConfigurationDto>.Success(dto);
            }
            catch (System.Exception ex)
            {
                _logger.LogError(ex, "Failed to retrieve alert configuration for type {AlertType}", request.AlertType);
                return FMSResponse<AlertConfigurationDto>.Failed("Failed to retrieve alert configuration");
            }
        }
    }
}
