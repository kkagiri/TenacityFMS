using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Configuration;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.ConfigurationCommand {
    public record CreateAutomatedFuelingConfigurationCommand (
        CreateAutomatedFuelingConfigurationDto ConfigurationDto,
        string CreatedBy) : IRequest<FMSResponseMessage<AutomatedFuelingConfigurationDto>>;

    public class CreateAutomatedFuelingConfigurationCommandHandler
        : IRequestHandler<CreateAutomatedFuelingConfigurationCommand, FMSResponseMessage<AutomatedFuelingConfigurationDto>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<CreateAutomatedFuelingConfigurationCommandHandler> _logger;

            public CreateAutomatedFuelingConfigurationCommandHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<CreateAutomatedFuelingConfigurationCommandHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<AutomatedFuelingConfigurationDto>> Handle (
                CreateAutomatedFuelingConfigurationCommand request,
                CancellationToken cancellationToken) {
                try {
                    // Validate site exists if siteId is provided
                    if (request.ConfigurationDto.SiteId.HasValue) {
                        var siteExists = await _context.Sites
                            .AnyAsync (s => s.Id == request.ConfigurationDto.SiteId.Value, cancellationToken);

                        if (!siteExists) {
                            return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                                false, $"Site with ID {request.ConfigurationDto.SiteId.Value} does not exist", null);
                        }
                    }

                    // Check if active configuration already exists for this site
                    var existingConfig = await _context.AutomatedFuelingConfigurations
                        .FirstOrDefaultAsync (c => c.SiteId == request.ConfigurationDto.SiteId && c.IsActive, cancellationToken);

                    if (existingConfig != null) {
                        return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                            false, $"An active configuration already exists for this {(request.ConfigurationDto.SiteId.HasValue ? "site" : "global setting")}", null);
                    }

                    // Create new configuration
                    var configuration = new AutomatedFuelingConfiguration {
                        SiteId = request.ConfigurationDto.SiteId,
                        UpdateTankVolumeFromBookKeeping = request.ConfigurationDto.UpdateTankVolumeFromBookKeeping,
                        UsePtsProbeReadings = request.ConfigurationDto.UsePtsProbeReadings,
                        VolumeSourcePriority = request.ConfigurationDto.VolumeSourcePriority,
                        AutoCreateLedgerEntries = request.ConfigurationDto.AutoCreateLedgerEntries,
                        CheckForDuplicateManualEntries = request.ConfigurationDto.CheckForDuplicateManualEntries,
                        DuplicateVolumeTolerance = request.ConfigurationDto.DuplicateVolumeTolerance,
                        AutoReconcileTankVolumes = request.ConfigurationDto.AutoReconcileTankVolumes,
                        ReconciliationFrequencyMinutes = request.ConfigurationDto.ReconciliationFrequencyMinutes,
                        MaxVolumeDiscrepancyThreshold = request.ConfigurationDto.MaxVolumeDiscrepancyThreshold,
                        DiscrepancyAction = request.ConfigurationDto.DiscrepancyAction,
                        IsActive = request.ConfigurationDto.IsActive,
                        CreatedOn = DateTime.UtcNow,
                        CreatedBy = request.CreatedBy
                    };

                    _context.AutomatedFuelingConfigurations.Add (configuration);
                    await _context.SaveChangesAsync (cancellationToken);

                    // Load the created configuration with site information
                    var createdConfig = await _context.AutomatedFuelingConfigurations
                        .Include (c => c.Site)
                        .FirstOrDefaultAsync (c => c.Id == configuration.Id, cancellationToken);

                    var configDto = _mapper.Map<AutomatedFuelingConfigurationDto> (createdConfig);

                    _logger.LogInformation ("Created automated fueling configuration {ConfigId} for {Target}",
                        configuration.Id,
                        request.ConfigurationDto.SiteId.HasValue ? $"site {request.ConfigurationDto.SiteId}" : "global settings");

                    return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        true, "Configuration created successfully", configDto);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error creating automated fueling configuration");
                    return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        false, $"Error creating configuration: {ex.Message}", null);
                }
            }
        }
}