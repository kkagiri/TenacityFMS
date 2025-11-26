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

namespace FMS.Application.Handlers.DatabaseHandlers.SystemConfigurationHandlers
{
    /// <summary>
    /// Handler for retrieving a system configuration by its key
    /// </summary>
    public class GetSystemConfigurationByKeyQueryHandler : IRequestHandler<GetSystemConfigurationByKeyQuery, FMSResponseMessage<SystemConfigurationDto>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger<GetSystemConfigurationByKeyQueryHandler> _logger;

        public GetSystemConfigurationByKeyQueryHandler(
            GpsdataContext context,
            IMapper mapper,
            ILogger<GetSystemConfigurationByKeyQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<FMSResponseMessage<SystemConfigurationDto>> Handle(
            GetSystemConfigurationByKeyQuery request,
            CancellationToken cancellationToken)
        {
            _logger.LogInformation("Retrieving system configuration by key: {ConfigKey}", request.ConfigurationKey);

            var configuration = await _context.SystemConfigurations
                .AsNoTracking()
                .Where(c => c.ConfigurationKey == request.ConfigurationKey && c.IsActive)
                .FirstOrDefaultAsync(cancellationToken);

            if (configuration == null)
            {
                _logger.LogWarning("System configuration not found for key: {ConfigKey}", request.ConfigurationKey);
                return new FMSResponseMessage<SystemConfigurationDto>(
                    false,
                    $"Configuration with key '{request.ConfigurationKey}' not found",
                    null);
            }

            var dto = _mapper.Map<SystemConfigurationDto>(configuration);

            return new FMSResponseMessage<SystemConfigurationDto>(
                true,
                "Configuration retrieved successfully",
                dto);
        }
    }
}
