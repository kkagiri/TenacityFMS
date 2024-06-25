using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.NavigationCommand;
    public record DeleteNavigationItemCommand(int Id) : IRequest<bool>;


        public class DeleteNavigationItemCommandHandler : IRequestHandler<DeleteNavigationItemCommand, bool>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeleteNavigationItemCommandHandler> _logger;

        public DeleteNavigationItemCommandHandler(GpsdataContext context, ILogger<DeleteNavigationItemCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> Handle(DeleteNavigationItemCommand request, CancellationToken cancellationToken)
        {
            try{
            var navigationItem = await _context.Navigationitems.FindAsync(request.Id);
            if (navigationItem == null)
            {
                _logger.LogError($"Navigation item with ID {request.Id} not found.");
                return false;
            }

            var roleNavigations = await _context.Rolenavigations
                .Where(r => r.NavigationItemId == request.Id)
                .ToListAsync(cancellationToken);

            _context.Rolenavigations.RemoveRange(roleNavigations);
            _context.Navigationitems.Remove(navigationItem);

            await _context.SaveChangesAsync(cancellationToken);

            return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error deleting navigation item");
                throw;
        }
    }
}
