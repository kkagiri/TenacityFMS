using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.TankCommands
{
    public record DeleteTankCommand(int Id) : IRequest<bool>;
    public class DeleteTankCommandHandler : IRequestHandler<DeleteTankCommand, bool>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteTankCommandHandler> _logger;

        public DeleteTankCommandHandler(GpsdataContext context, ILogger<DeleteTankCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> Handle(DeleteTankCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var tank = await _context.Tanks.FindAsync(request.Id);
                if (tank == null)
                {
                    return false;
                }

                _context.Tanks.Remove(tank);
                await _context.SaveChangesAsync(cancellationToken);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting tank");
                throw;
            }
        }
    }
}
