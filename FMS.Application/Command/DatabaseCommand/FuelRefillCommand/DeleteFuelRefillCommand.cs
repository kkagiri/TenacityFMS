using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.FuelRefillCommand;

public record FuelRefilDeleteCommand(int Id) : IRequest<bool>;

public class FuelRefilDeleteCommandHandler : IRequestHandler<FuelRefilDeleteCommand, bool>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefilDeleteCommandHandler> _logger;

    public FuelRefilDeleteCommandHandler(GpsdataContext context, ILogger<FuelRefilDeleteCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> Handle(FuelRefilDeleteCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var fuelRefil = await _context.Fuelrefils.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken);
            if (fuelRefil == null) return false;

            _context.Fuelrefils.Remove(fuelRefil);
            await _context.SaveChangesAsync(cancellationToken);

            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in FuelRefilDeleteCommandHandler");
            throw new Exception(ex.ToString());

        }
    }
}