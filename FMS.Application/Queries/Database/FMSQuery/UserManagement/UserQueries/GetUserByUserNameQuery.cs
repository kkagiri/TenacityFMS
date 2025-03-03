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

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries
{
    public record GetUserByUserNameQuery(string Username) : IRequest<UserDto>;


    public class GetUserByUserNameQueryHandler : IRequestHandler<GetUserByUserNameQuery, UserDto>
    {

        private readonly UserManager<User> _userManager;
        private readonly ILogger<GetUserByUserNameQueryHandler> _logger;

        public GetUserByUserNameQueryHandler(UserManager<User> userManager, ILogger<GetUserByUserNameQueryHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
        }
        public async Task<UserDto> Handle(GetUserByUserNameQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var user = await _userManager.FindByNameAsync(request.Username);
                if (user == null)
                {
                    throw new Exception("User not found");
                }
                var roles = await _userManager.GetRolesAsync(user);
                return new UserDto
                {
                    Id = user.Id,
                    UserName = user.UserName,
                    Email = user.Email,
                    Roles = roles.ToList()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }

    public class UserDto
    {
        public string Id { get; set; }
        public string UserName { get; set; }
        public string Email { get; set; }
        public List<string> Roles { get; set; }
    }
}
