using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Command.DatabaseCommand.SystemConfigurationCommands;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Handlers.DatabaseHandlers.SystemConfigurationHandlers {
    public class DeleteSystemConfigurationCommandHandler
        : IRequestHandler<DeleteSystemConfigurationCommand, FMSResponseMessage> {
            private readonly GpsdataContext _context;
            private readonly ILogger<DeleteSystemConfigurationCommandHandler> _logger;

            public DeleteSystemConfigurationCommandHandler (
                GpsdataContext context,
                ILogger<DeleteSystemConfigurationCommandHandler> logger) {
                _context = context;
                _logger = logger;
            }

            public async Task<FMSResponseMessage> Handle (
                DeleteSystemConfigurationCommand request,
                CancellationToken cancellationToken) {
                try {
                    // Find the configuration to delete
                    var existingConfig = await _context.SystemConfigurations
                        .FirstOrDefaultAsync (c => c.Id == request.Id, cancellationToken);

                    if (existingConfig == null) {
                        return new FMSResponseMessage (
                            false, $"Configuration with ID {request.Id} not found");
                    }

                    // Check if configuration is editable
                    if (!existingConfig.IsEditable) {
                        return new FMSResponseMessage (
                            false, "This configuration is not editable and cannot be deleted");
                    }

                    _context.SystemConfigurations.Remove (existingConfig);
                    await _context.SaveChangesAsync (cancellationToken);

                    _logger.LogInformation ("Deleted system configuration {ConfigKey} with ID {ConfigId}",
                        existingConfig.ConfigurationKey, existingConfig.Id);

                    return new FMSResponseMessage (
                        true, "System configuration deleted successfully");
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error deleting system configuration {ConfigId}", request.Id);
                    return new FMSResponseMessage (
                        false, $"Error deleting configuration: {ex.Message}");
                }
            }
        }
}