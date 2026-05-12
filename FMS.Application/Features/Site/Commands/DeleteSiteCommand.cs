using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.SiteCommands
{
    public record DeleteSiteCommand(int Id) : IRequest<FMSResponse<bool>>;

    public class DeleteSiteCommandHandler : IRequestHandler<DeleteSiteCommand, FMSResponse<bool>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteSiteCommandHandler> _logger;

        public DeleteSiteCommandHandler(GpsdataContext context, ILogger<DeleteSiteCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<FMSResponse<bool>> Handle(DeleteSiteCommand request, CancellationToken cancellationToken)
        {
            try
            {
                // Validation
                var validationErrors = new List<string>();

                if (request.Id <= 0)
                {
                    validationErrors.Add("Valid site ID is required");
                }

                if (validationErrors.Any())
                {
                    return FMSResponse<bool>.ValidationFailed(validationErrors);
                }

                var site = await _context.Sites.FindAsync(request.Id);
                if (site == null)
                {
                    return FMSResponse<bool>.Failed("Site not found");
                }

                // Check for dependencies
                var hasTanks = await _context.Tanks.AnyAsync(t => t.SiteId == request.Id, cancellationToken);
                if (hasTanks)
                {
                    return FMSResponse<bool>.ValidationFailed(new List<string> { "Cannot delete site with associated tanks" });
                }

                var hasEmployees = await _context.Employees.AnyAsync(e => e.SiteId == request.Id, cancellationToken);
                if (hasEmployees)
                {
                    return FMSResponse<bool>.ValidationFailed(new List<string> { "Cannot delete site with associated employees" });
                }

                var hasVehicles = await _context.Vehicles.AnyAsync(v => v.WorkingSiteId == request.Id, cancellationToken);
                if (hasVehicles)
                {
                    return FMSResponse<bool>.ValidationFailed(new List<string> { "Cannot delete site with associated vehicles" });
                }

                var hasPTSDevices = await _context.Ptsdevices.AnyAsync(p => p.Site == request.Id, cancellationToken);
                if (hasPTSDevices)
                {
                    return FMSResponse<bool>.ValidationFailed(new List<string> { "Cannot delete site with associated PTS devices" });
                }

                _context.Sites.Remove(site);
                await _context.SaveChangesAsync(cancellationToken);

                _logger.LogInformation("Site deleted successfully with ID: {SiteId}", request.Id);
                return FMSResponse<bool>.Success(true, "Site deleted successfully");
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting site with ID: {SiteId}", request.Id);
                return FMSResponse<bool>.Failed("An error occurred while deleting the site");
            }
        }
    }
}