using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Features.FuelTagManagement.FuelingTags.Command;

public record DeleteFuelTagCommand (int Id) : IRequest<FMSResponseMessage>;

public class DeleteFuelTagCommandHandler : IRequestHandler<DeleteFuelTagCommand, FMSResponseMessage> {
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteFuelTagCommandHandler> _logger;

    public DeleteFuelTagCommandHandler (GpsdataContext context, ILogger<DeleteFuelTagCommandHandler> logger) {
        _context = context;
        _logger = logger;
    }

    public async Task<FMSResponseMessage> Handle (DeleteFuelTagCommand request, CancellationToken cancellationToken) {
        try {
            var tag = await _context.FuelTags.FindAsync (request.Id);
            if (tag == null)
                return new FMSResponseMessage (false, "Tag not found");

            _context.FuelTags.Remove (tag);
            await _context.SaveChangesAsync (cancellationToken);
            return new FMSResponseMessage (true, "Tag deleted successfully");
        } catch (Exception ex) {
            _logger.LogError (ex, "Error deleting tag");
            return new FMSResponseMessage (false, "Error deleting tag");
        }
    }
}