using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Roles
{
  public record class GetRoleByIDQuery(string RoleID) : IRequest<Role>;


    public class GetRoleByIDQueryHandler : IRequestHandler<GetRoleByIDQuery, Role>
    {
       // private readonly GpsdataContext _context;
        private readonly RoleManager<Role> _roleManager;
        private readonly ILogger<GetRoleByIDQueryHandler> _logger;

        public GetRoleByIDQueryHandler(RoleManager<Role> roleManager ,ILogger<GetRoleByIDQueryHandler> logger)
        {
         _logger = logger;
            _roleManager = roleManager; 
        }
    
        public async Task<Role> Handle(GetRoleByIDQuery request, CancellationToken cancellationToken)
        {
            try
            {
               return await _roleManager.FindByIdAsync(request.RoleID);
            }
            catch(Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        
        }
    }
}
