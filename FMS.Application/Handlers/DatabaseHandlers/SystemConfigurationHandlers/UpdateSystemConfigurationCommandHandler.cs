using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands;
using FMS.Application.Common;
using FMS.Application.ModelsDTOs.SystemConfiguration;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers.DatabaseHandlers.SystemConfigurationHandlers {
    public class UpdateSystemConfigurationCommandHandler
        : IRequestHandler<UpdateSystemConfigurationCommand, FMSResponseMessage<SystemConfigurationDto>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<UpdateSystemConfigurationCommandHandler> _logger;

            public UpdateSystemConfigurationCommandHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<UpdateSystemConfigurationCommandHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<SystemConfigurationDto>> Handle (
                UpdateSystemConfigurationCommand request,
                CancellationToken cancellationToken) {
                try {
                    // Find the existing configuration
                    var existingConfig = await _context.SystemConfigurations
                        .FirstOrDefaultAsync (c => c.Id == request.ConfigurationDto.Id, cancellationToken);

                    if (existingConfig == null) {
                        return new FMSResponseMessage<SystemConfigurationDto> (
                            false, $"Configuration with ID {request.ConfigurationDto.Id} not found", null);
                    }

                    // Check if trying to change key to an existing one
                    if (existingConfig.ConfigurationKey != request.ConfigurationDto.ConfigurationKey) {
                        var duplicateConfig = await _context.SystemConfigurations
                            .FirstOrDefaultAsync (c => c.ConfigurationKey == request.ConfigurationDto.ConfigurationKey &&
                                c.Id != request.ConfigurationDto.Id, cancellationToken);

                        if (duplicateConfig != null) {
                            return new FMSResponseMessage<SystemConfigurationDto> (
                                false, $"Configuration with key '{request.ConfigurationDto.ConfigurationKey}' already exists", null);
                        }
                    }

                    // Update the configuration properties
                    existingConfig.ConfigurationKey = request.ConfigurationDto.ConfigurationKey;
                    existingConfig.ConfigurationValue = request.ConfigurationDto.ConfigurationValue;
                    existingConfig.Description = request.ConfigurationDto.Description;
                    existingConfig.DataType = request.ConfigurationDto.DataType;
                    existingConfig.Category = request.ConfigurationDto.Category;
                    existingConfig.IsActive = request.ConfigurationDto.IsActive;
                    existingConfig.IsEditable = request.ConfigurationDto.IsEditable;
                    existingConfig.ValidationPattern = request.ConfigurationDto.ValidationPattern;
                    existingConfig.MinValue = request.ConfigurationDto.MinValue;
                    existingConfig.MaxValue = request.ConfigurationDto.MaxValue;
                    existingConfig.DefaultValue = request.ConfigurationDto.DefaultValue;
                    existingConfig.UpdatedAt = DateTime.UtcNow;
                    existingConfig.UpdatedBy = request.ModifiedBy;

                    await _context.SaveChangesAsync (cancellationToken);

                    var configDto = _mapper.Map<SystemConfigurationDto> (existingConfig);

                    _logger.LogInformation ("Updated system configuration {ConfigKey} with ID {ConfigId}",
                        existingConfig.ConfigurationKey, existingConfig.Id);

                    return new FMSResponseMessage<SystemConfigurationDto> (
                        true, "System configuration updated successfully", configDto);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error updating system configuration {ConfigId}",
                        request.ConfigurationDto.Id);
                    return new FMSResponseMessage<SystemConfigurationDto> (
                        false, $"Error updating configuration: {ex.Message}", null);
                }
            }
        }
}