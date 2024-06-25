using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using FMS.PTS.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions
{
    public record GetUserPermissionsQuery(string UserID) : IRequest<List<string>>;


    public class GetUserPermissionsQueryHandler : IRequestHandler<GetUserPermissionsQuery, List<string>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetUserPermissionsQueryHandler> _logger;

        public GetUserPermissionsQueryHandler(GpsdataContext context, ILogger<GetUserPermissionsQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<List<string>> Handle(GetUserPermissionsQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var results = await _context.Users
          .Where(u => u.Id == request.UserID)
          .SelectMany(u => u.UserRoles)
          .SelectMany(ur => ur.Role.RolePermissions)
          .Select(rp => rp.Permission.Name)
          .Distinct()
          .ToListAsync(cancellationToken);

                return results;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }
}
