//Cursor: Handler for Get Current System Configuration Query
using System;
using System.Linq;
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
    public class GetCurrentSystemConfigurationQueryHandler : IRequestHandler<GetCurrentSystemConfigurationQuery, FMSResponseMessage<SystemConfigurationDto>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetCurrentSystemConfigurationQueryHandler> _logger;

        public GetCurrentSystemConfigurationQueryHandler (
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetCurrentSystemConfigurationQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<SystemConfigurationDto>> Handle (GetCurrentSystemConfigurationQuery request, CancellationToken cancellationToken) {
            try {
                _logger.LogInformation ("Retrieving current active system configuration");

                // Get the currently active system configuration
                var activeConfig = await _context.SystemConfigurations
                    .Where (sc => sc.IsActive == true)
                    .OrderByDescending (sc => sc.CreatedAt) // Get the most recent active config
                    .FirstOrDefaultAsync (cancellationToken);

                if (activeConfig == null) {
                    _logger.LogWarning ("No active system configuration found");
                    return new FMSResponseMessage<SystemConfigurationDto> (
                        false, "No active system configuration found", null);
                }

                var configDto = _mapper.Map<SystemConfigurationDto> (activeConfig);

                _logger.LogInformation ("Successfully retrieved current system configuration with ID: {ConfigId}", activeConfig.Id);

                return new FMSResponseMessage<SystemConfigurationDto> (
                    true, "Current system configuration retrieved successfully", configDto);

            } catch (Exception ex) {
                _logger.LogError (ex, "Error retrieving current system configuration");
                return new FMSResponseMessage<SystemConfigurationDto> (
                    false, "An error occurred while retrieving the current system configuration", null);
            }
        }
    }
}