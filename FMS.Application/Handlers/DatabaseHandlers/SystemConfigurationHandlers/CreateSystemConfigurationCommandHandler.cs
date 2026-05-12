using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands;
using FMS.Application.Common;
using FMS.Application.Features.SystemConfiguration;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers.DatabaseHandlers.SystemConfigurationHandlers {
    public class CreateSystemConfigurationCommandHandler
        : IRequestHandler<CreateSystemConfigurationCommand, FMSResponseMessage<SystemConfigurationDto>> {
            private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
            private readonly ILogger<CreateSystemConfigurationCommandHandler> _logger;

            public CreateSystemConfigurationCommandHandler (
                GpsdataContext context,
                IMapper mapper,
                ILogger<CreateSystemConfigurationCommandHandler> logger) {
                _context = context;
                _mapper = mapper;
                _logger = logger;
            }

            public async Task<FMSResponseMessage<SystemConfigurationDto>> Handle (
                CreateSystemConfigurationCommand request,
                CancellationToken cancellationToken) {
                try {
                    // Check if configuration with same key already exists
                    var existingConfig = await _context.SystemConfigurations
                        .FirstOrDefaultAsync (c => c.ConfigurationKey == request.ConfigurationDto.ConfigurationKey, cancellationToken);

                    if (existingConfig != null) {
                        return new FMSResponseMessage<SystemConfigurationDto> (
                            false, $"Configuration with key '{request.ConfigurationDto.ConfigurationKey}' already exists", null);
                    }

                    // Create new configuration
                    var configuration = new SystemConfiguration {
                        ConfigurationKey = request.ConfigurationDto.ConfigurationKey,
                        ConfigurationValue = request.ConfigurationDto.ConfigurationValue,
                        Description = request.ConfigurationDto.Description,
                        DataType = request.ConfigurationDto.DataType,
                        Category = request.ConfigurationDto.Category,
                        IsActive = request.ConfigurationDto.IsActive,
                        IsEditable = request.ConfigurationDto.IsEditable,
                        ValidationPattern = request.ConfigurationDto.ValidationPattern,
                        MinValue = request.ConfigurationDto.MinValue,
                        MaxValue = request.ConfigurationDto.MaxValue,
                        DefaultValue = request.ConfigurationDto.DefaultValue,
                        CreatedAt = DateTime.UtcNow,
                        CreatedBy = request.CreatedBy
                    };

                    _context.SystemConfigurations.Add (configuration);
                    await _context.SaveChangesAsync (cancellationToken);

                    // Load the created configuration
                    var createdConfig = await _context.SystemConfigurations
                        .FirstOrDefaultAsync (c => c.Id == configuration.Id, cancellationToken);

                    var configDto = _mapper.Map<SystemConfigurationDto> (createdConfig);

                    _logger.LogInformation ("Created system configuration {ConfigKey} with ID {ConfigId}",
                        configuration.ConfigurationKey, configuration.Id);

                    return new FMSResponseMessage<SystemConfigurationDto> (
                        true, "System configuration created successfully", configDto);
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error creating system configuration with key {ConfigKey}",
                        request.ConfigurationDto.ConfigurationKey);
                    return new FMSResponseMessage<SystemConfigurationDto> (
                        false, $"Error creating configuration: {ex.Message}", null);
                }
            }
        }
}