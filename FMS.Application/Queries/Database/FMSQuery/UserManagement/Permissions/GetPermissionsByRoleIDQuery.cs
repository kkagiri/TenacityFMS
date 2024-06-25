using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions
{
  public record GetPermissionsByRoleIDQuery(string RoleID) : IRequest<List<Permission>>;


    public class GetPermissionsByRoleIDQueryHandler : IRequestHandler<GetPermissionsByRoleIDQuery, List<Permission>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPermissionsByRoleIDQueryHandler> _logger;

        public GetPermissionsByRoleIDQueryHandler(GpsdataContext context, ILogger<GetPermissionsByRoleIDQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<List<Permission>> Handle(GetPermissionsByRoleIDQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var permissions = await _context.Roles
            .Where(r => r.Id == request.RoleID)
            .SelectMany(r => r.RolePermissions)
            .Include(rp => rp.Permission)
            .ThenInclude(p => p.InverseParent)
            .Select(rp => rp.Permission)
            .ToListAsync(cancellationToken);

        return permissions;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }
}
