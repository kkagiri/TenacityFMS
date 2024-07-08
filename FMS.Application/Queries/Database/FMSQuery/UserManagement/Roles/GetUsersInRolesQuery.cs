using AutoMapper;
using FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;
using FMS.Domain.Entities;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.Roles
{
       public record GetUsersInRoleQuery(string RoleId ):IRequest<List<UserDto>>;


    public class GetUsersInRoleQueryHandler : IRequestHandler<GetUsersInRoleQuery, List<UserDto>>
    {
        private readonly UserManager<User> _userManager;  
            private readonly RoleManager<Role> _roleManager;  
        private readonly ILogger<GetUsersInRoleQueryHandler> _logger;
        private readonly IMapper _mapper;

        public GetUsersInRoleQueryHandler(UserManager<User> userManager, IMapper mapper, ILogger<GetUsersInRoleQueryHandler> logger , RoleManager<Role> roleManager)
        {
            _userManager = userManager;
               _roleManager = roleManager;
            _logger = logger;
            _mapper = mapper;
        }
        public async Task<List<UserDto>> Handle(GetUsersInRoleQuery request, CancellationToken cancellationToken)
        {
            try
                {
                 var role = await _roleManager.FindByIdAsync(request.RoleId);
            if (role == null)
            {
                _logger.LogWarning("Role with ID {RoleId} not found.", request.RoleId);
                throw new Exception($"Role with ID {request.RoleId} not found.");
            }

            var usersInRole = await _userManager.GetUsersInRoleAsync(role.Name);

            return _mapper.Map<List<UserDto>>(usersInRole.ToList());
            }catch(Exception ex)
            {
                _logger.LogError(ex.Message,"Error gettting Users in Role");
                throw;
            }

        }
    }
}
