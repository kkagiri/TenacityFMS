using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement.PermisionCommands
{
    public record AddPermissionCommand(string Name,int? ParentId) : IRequest<int>;
    public class AddPermissionCommandHandler : IRequestHandler<AddPermissionCommand, int>
    {

       private readonly GpsdataContext _context;
        private readonly ILogger<AddPermissionCommandHandler> _logger;
        public AddPermissionCommandHandler(GpsdataContext context, ILogger<AddPermissionCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<int> Handle(AddPermissionCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var permission = new Domain.Entities.Permission
                {
                    Name = request.Name,
                    ParentId = request.ParentId
                };
                _context.Permissions.Add(permission);
                await _context.SaveChangesAsync(cancellationToken);
                return permission.Id;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw new Exception(ex.Message);
            }
        }
    }
}
   
