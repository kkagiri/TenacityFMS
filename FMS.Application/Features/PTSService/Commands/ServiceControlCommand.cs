using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Application.Features.PTSService.DTOs;
using FMS.Application.Features.PTSService.Services;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.PTSService.Commands {
    public record ServiceControlCommand : IRequest<FMSResponse<ServiceStatusDto>> {
        public ServiceAction Action { get; init; }
        public string ServiceName { get; init; } = "FMS.PTS.WindowsService";
    }

    public enum ServiceAction {
        Start,
        Stop,
        Restart,
        GetStatus
    }

    public class ServiceControlCommandHandler : IRequestHandler<ServiceControlCommand, FMSResponse<ServiceStatusDto>> {
        private readonly IServiceControlService _serviceControlService;
        private readonly ILogger<ServiceControlCommandHandler> _logger;

        public ServiceControlCommandHandler (
            IServiceControlService serviceControlService,
            ILogger<ServiceControlCommandHandler> logger) {
            _serviceControlService = serviceControlService;
            _logger = logger;
        }

        public async Task<FMSResponse<ServiceStatusDto>> Handle (ServiceControlCommand request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Processing service control command: {Action} for service: {ServiceName}",
                    request.Action, request.ServiceName);

                var result = await _serviceControlService.ExecuteServiceActionAsync (request.Action, request.ServiceName);

                return FMSResponse<ServiceStatusDto>.Success (result);
            } catch (UnauthorizedAccessException ex) {
                _logger.LogError (ex, "Unauthorized access when controlling service: {ServiceName}", request.ServiceName);
                return FMSResponse<ServiceStatusDto>.Failed ("Insufficient permissions to control the service");
            } catch (Exception ex) {
                _logger.LogError (ex, "Error controlling service: {ServiceName}, Action: {Action}",
                    request.ServiceName, request.Action);
                return FMSResponse<ServiceStatusDto>.Failed ($"Failed to {request.Action.ToString().ToLower()} service: {ex.Message}");
            }
        }
    }
}