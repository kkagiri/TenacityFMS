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
    public record GetRolesByUserIDQuery(string UserID) : IRequest<List<string>>;

    public class GetRolesByUserIDQueryHandler : IRequestHandler<GetRolesByUserIDQuery, List<string>>
    {

        private readonly UserManager<User> _userManager;
        private readonly ILogger<GetRolesByUserIDQueryHandler> _logger;


        public GetRolesByUserIDQueryHandler(UserManager<User> userManager, ILogger<GetRolesByUserIDQueryHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }
        public async Task<List<string>> Handle(GetRolesByUserIDQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _userManager.FindByIdAsync(request.UserID);
                if(user == null) throw new Exception("User not found");

                var roles = await _userManager.GetRolesAsync(user);

                return roles.ToList();
            } catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }
}
