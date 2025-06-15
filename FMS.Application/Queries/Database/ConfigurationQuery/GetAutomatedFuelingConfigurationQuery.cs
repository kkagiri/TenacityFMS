using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.Configuration;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.ConfigurationQuery {
    public record GetAutomatedFuelingConfigurationQuery (int Id) : IRequest<FMSResponseMessage<AutomatedFuelingConfigurationDto>>;

    public class GetAutomatedFuelingConfigurationQueryHandler
        : IRequestHandler<GetAutomatedFuelingConfigurationQuery, FMSResponseMessage<AutomatedFuelingConfigurationDto>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<GetAutomatedFuelingConfigurationQueryHandler> _logger;

            public GetAutomatedFuelingConfigurationQueryHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<GetAutomatedFuelingConfigurationQueryHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<AutomatedFuelingConfigurationDto>> Handle (
                GetAutomatedFuelingConfigurationQuery request,
                CancellationToken cancellationToken) {
                try {
                    var configuration = await _context.AutomatedFuelingConfigurations
                        .Include (c => c.Site)
                        .FirstOrDefaultAsync (c => c.Id == request.Id, cancellationToken);

                    if (configuration == null) {
                        return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                            false, $"Configuration with ID {request.Id} not found", null);
                    }

                    var configDto = _mapper.Map<AutomatedFuelingConfigurationDto> (configuration);

                    return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        true, "Configuration retrieved successfully", configDto);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error retrieving automated fueling configuration {ConfigId}", request.Id);
                    return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        false, $"Error retrieving configuration: {ex.Message}", null);
                }
            }
        }
}