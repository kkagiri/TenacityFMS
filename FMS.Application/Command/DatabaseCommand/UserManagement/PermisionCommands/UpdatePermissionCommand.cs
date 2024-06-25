using FMS.Persistence.DataAccess;
using MediatR;
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
    public record UpdatePermissionCommand(int Id, string Name,int ParentId) : IRequest<bool>;
    public class UpdatePermissionCommandHandler : IRequestHandler<UpdatePermissionCommand, bool>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<UpdatePermissionCommandHandler> _logger;
        public UpdatePermissionCommandHandler(GpsdataContext context, ILogger<UpdatePermissionCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }


        public async Task<bool> Handle(UpdatePermissionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var permission = await _context.Permissions.FindAsync(request.Id);

                if (permission == null)
                {
                    throw new Exception("Permission not found");
                }
                permission.Name = request.Name;
                permission.ParentId = request.ParentId;

                await _context.SaveChangesAsync(cancellationToken);
                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw new Exception(ex.Message);
            }
        }
    }
}
