using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Common;
using FMS.Application.Features.Configuration;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.ConfigurationCommand {
    public record UpdateAutomatedFuelingConfigurationCommand (
        UpdateAutomatedFuelingConfigurationDto ConfigurationDto,
        string ModifiedBy) : IRequest<FMSResponseMessage<AutomatedFuelingConfigurationDto>>;

    public class UpdateAutomatedFuelingConfigurationCommandHandler
        : IRequestHandler<UpdateAutomatedFuelingConfigurationCommand, FMSResponseMessage<AutomatedFuelingConfigurationDto>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<UpdateAutomatedFuelingConfigurationCommandHandler> _logger;

            public UpdateAutomatedFuelingConfigurationCommandHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<UpdateAutomatedFuelingConfigurationCommandHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<AutomatedFuelingConfigurationDto>> Handle (
                UpdateAutomatedFuelingConfigurationCommand request,
                CancellationToken cancellationToken) {
                try {
                    // Find the existing configuration
                    var existingConfig = await _context.AutomatedFuelingConfigurations
                        .Include (c => c.Site)
                        .FirstOrDefaultAsync (c => c.Id == request.ConfigurationDto.Id, cancellationToken);

                    if (existingConfig == null) {
                        return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                            false, $"Configuration with ID {request.ConfigurationDto.Id} not found", null);
                    }

                    // Update the configuration properties
                    existingConfig.UpdateTankVolumeFromBookKeeping = request.ConfigurationDto.UpdateTankVolumeFromBookKeeping;
                    existingConfig.UsePtsProbeReadings = request.ConfigurationDto.UsePtsProbeReadings;
                    existingConfig.VolumeSourcePriority = request.ConfigurationDto.VolumeSourcePriority;
                    existingConfig.AutoCreateLedgerEntries = request.ConfigurationDto.AutoCreateLedgerEntries;
                    existingConfig.CheckForDuplicateManualEntries = request.ConfigurationDto.CheckForDuplicateManualEntries;
                    existingConfig.DuplicateVolumeTolerance = request.ConfigurationDto.DuplicateVolumeTolerance;
                    existingConfig.AutoReconcileTankVolumes = request.ConfigurationDto.AutoReconcileTankVolumes;
                    existingConfig.ReconciliationFrequencyMinutes = request.ConfigurationDto.ReconciliationFrequencyMinutes;
                    existingConfig.MaxVolumeDiscrepancyThreshold = request.ConfigurationDto.MaxVolumeDiscrepancyThreshold;
                    existingConfig.DiscrepancyAction = request.ConfigurationDto.DiscrepancyAction;
                    existingConfig.IsActive = request.ConfigurationDto.IsActive;
                    existingConfig.ModifiedOn = DateTime.UtcNow;
                    existingConfig.ModifiedBy = request.ModifiedBy;

                    await _context.SaveChangesAsync (cancellationToken);

                    var configDto = _mapper.Map<AutomatedFuelingConfigurationDto> (existingConfig);

                    _logger.LogInformation ("Updated automated fueling configuration {ConfigId} for {Target}",
                        existingConfig.Id,
                        existingConfig.SiteId.HasValue ? $"site {existingConfig.SiteId}" : "global settings");

                    return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        true, "Configuration updated successfully", configDto);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error updating automated fueling configuration {ConfigId}",
                        request.ConfigurationDto.Id);
                    return new FMSResponseMessage<AutomatedFuelingConfigurationDto> (
                        false, $"Error updating configuration: {ex.Message}", null);
                }
            }
        }
}