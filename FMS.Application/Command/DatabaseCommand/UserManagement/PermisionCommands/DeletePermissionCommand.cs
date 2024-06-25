using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Components;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement.PermisionCommands
{
    public record DeletePermissionCommand(int Id) : IRequest<bool>;

    public class DeletePermissionCommandHandler : IRequestHandler<DeletePermissionCommand, bool>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<DeletePermissionCommandHandler> _logger;   


        public DeletePermissionCommandHandler(GpsdataContext context, ILogger<DeletePermissionCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> Handle(DeletePermissionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var permissoin = await _context.Permissions.FindAsync(request.Id);

                if (permissoin == null)
                {
                    throw new Exception("Permission not found");
                }

                _context.Permissions.Remove(permissoin);
                await _context.SaveChangesAsync(cancellationToken);
                return true;


            }catch(Exception ex)
            {
                _logger.LogError(ex.Message, "Issues deleting permission");
                throw;
            }   
        }
    }
}
