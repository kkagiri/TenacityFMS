using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.TankStockCommand;

   public record DeleteTankStockCommand(int Id) : IRequest<bool>;

public class DeleteTankStockCommandHandler : IRequestHandler<DeleteTankStockCommand, bool>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<DeleteTankStockCommandHandler> _logger;

    public DeleteTankStockCommandHandler(GpsdataContext context, ILogger<DeleteTankStockCommandHandler> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<bool> Handle(DeleteTankStockCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var tankStock = await _context.Tankstocks.FindAsync(new object[] { request.Id }, cancellationToken);
            if (tankStock == null) return false;

            _context.Tankstocks.Remove(tankStock);
            await _context.SaveChangesAsync(cancellationToken);
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error deleting tank stock");
            throw;
        }
    }

    
}
