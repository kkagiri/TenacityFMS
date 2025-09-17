using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.InteropServices;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.UserManagement;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Permissions {
    public record GetPermissionsByRoleIDQuery (string RoleId) : IRequest<List<PermissionDTO>>;

    public class GetPermissionsByRoleIDQueryHandler : IRequestHandler<GetPermissionsByRoleIDQuery, List<PermissionDTO>> {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetPermissionsByRoleIDQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetPermissionsByRoleIDQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetPermissionsByRoleIDQueryHandler> logger) {
            _context = context;
            _logger = logger;
            _mapper = mapper;
        }
        public async Task<List<PermissionDTO>> Handle (GetPermissionsByRoleIDQuery request, CancellationToken cancellationToken) {
            try {

                var role = await _context.Roles.FindAsync (request.RoleId);
                if (role == null) {
                    throw new Exception ("Role not found");
                }

                var permissions = await _context.Roles
                    .Where (r => r.Id == role.Id)
                    .SelectMany (r => r.RolePermissions)
                    .Include (rp => rp.Permission)
                    .ThenInclude (p => p.InverseParent)
                    .Select (rp => rp.Permission)
                    .ToListAsync (cancellationToken);

                return _mapper.Map<List<PermissionDTO>> (permissions);
            } catch (Exception ex) {
                _logger.LogError (ex.Message);
                throw;
            }
        }
    }
}