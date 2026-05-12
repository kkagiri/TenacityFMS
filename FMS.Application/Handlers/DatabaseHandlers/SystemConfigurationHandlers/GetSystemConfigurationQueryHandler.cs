using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using FMS.Application.Queries.Database.SystemConfigurationQueries;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers.DatabaseHandlers.SystemConfigurationHandlers {
    public class GetSystemConfigurationQueryHandler
        : IRequestHandler<GetSystemConfigurationQuery, FMSResponseMessage<SystemConfigurationDto>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<GetSystemConfigurationQueryHandler> _logger;

            public GetSystemConfigurationQueryHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<GetSystemConfigurationQueryHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<SystemConfigurationDto>> Handle (
                GetSystemConfigurationQuery request,
                CancellationToken cancellationToken) {
                try {
                    var configuration = await _context.SystemConfigurations
                        .FirstOrDefaultAsync (c => c.Id == request.Id, cancellationToken);

                    if (configuration == null) {
                        return new FMSResponseMessage<SystemConfigurationDto> (
                            false, $"Configuration with ID {request.Id} not found", null);
                    }

                    var configDto = _mapper.Map<SystemConfigurationDto> (configuration);

                    _logger.LogDebug ("Retrieved system configuration {ConfigKey} with ID {ConfigId}",
                        configuration.ConfigurationKey, configuration.Id);

                    return new FMSResponseMessage<SystemConfigurationDto> (
                        true, "Configuration retrieved successfully", configDto);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error retrieving system configuration {ConfigId}", request.Id);
                    return new FMSResponseMessage<SystemConfigurationDto> (
                        false, $"Error retrieving configuration: {ex.Message}", null);
                }
            }
        }
}