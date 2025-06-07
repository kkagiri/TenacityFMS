using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.ConfigurationCommand {
    public record DeleteAutomatedFuelingConfigurationCommand (int Id) : IRequest<FMSResponseMessage>;

    public class DeleteAutomatedFuelingConfigurationCommandHandler
        : IRequestHandler<DeleteAutomatedFuelingConfigurationCommand, FMSResponseMessage> {
            private readonly GpsdataContext _context;
            private readonly ILogger<DeleteAutomatedFuelingConfigurationCommandHandler> _logger;

            public DeleteAutomatedFuelingConfigurationCommandHandler (
                GpsdataContext context,
                ILogger<DeleteAutomatedFuelingConfigurationCommandHandler> logger) {
                _context = context;
                _logger = logger;
            }

            public async Task<FMSResponseMessage> Handle (
                DeleteAutomatedFuelingConfigurationCommand request,
                CancellationToken cancellationToken) {
                try {
                    // Find the configuration to delete
                    var configuration = await _context.AutomatedFuelingConfigurations
                        .FirstOrDefaultAsync (c => c.Id == request.Id, cancellationToken);

                    if (configuration == null) {
                        return new FMSResponseMessage (false, $"Configuration with ID {request.Id} not found");
                    }

                    // Check if this is the global configuration
                    if (configuration.SiteId == null) {
                        // Check if there are any site-specific configurations
                        var hasSiteConfigs = await _context.AutomatedFuelingConfigurations
                            .AnyAsync (c => c.SiteId != null && c.IsActive, cancellationToken);

                        if (!hasSiteConfigs) {
                            return new FMSResponseMessage (false,
                                "Cannot delete global configuration when no site-specific configurations exist. " +
                                "This would leave the system without any configuration.");
                        }
                    }

                    // Remove the configuration
                    _context.AutomatedFuelingConfigurations.Remove (configuration);
                    await _context.SaveChangesAsync (cancellationToken);

                    _logger.LogInformation ("Deleted automated fueling configuration {ConfigId} for {Target}",
                        configuration.Id,
                        configuration.SiteId.HasValue ? $"site {configuration.SiteId}" : "global settings");

                    return new FMSResponseMessage (true, "Configuration deleted successfully");
                } catch (Exception ex) {
                    _logger.LogError (ex, "Error deleting automated fueling configuration {ConfigId}", request.Id);
                    return new FMSResponseMessage (false, $"Error deleting configuration: {ex.Message}");
                }
            }
        }
}