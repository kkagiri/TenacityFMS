using System;
using System.Collections.Generic;
using System.Linq;
using System.Net.Http.Headers;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries
{
    public record GetUserByUserNameQuery(string Username) : IRequest<UserDto>;

    public class GetUserByUserNameQueryHandler : IRequestHandler<GetUserByUserNameQuery, UserDto>
    {

        private readonly UserManager<User> _userManager;
        private readonly ILogger<GetUserByUserNameQueryHandler> _logger;
        private readonly GpsdataContext _context;

        public GetUserByUserNameQueryHandler(GpsdataContext context, UserManager<User> userManager, ILogger<GetUserByUserNameQueryHandler> logger)
        {
            _userManager = userManager;
            _logger = logger;
            _context = context;
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

                var masterTag = await _context.FuelTags.FirstOrDefaultAsync(t => t.Id == user.MasterRFIDTag, cancellationToken);

                var roles = await _userManager.GetRolesAsync(user);
                return new UserDto
                {
                    Id = user.Id,
                    FirstName = user.FirstName,
                    LastName = user.LastName,
                    UserName = user.UserName,
                    Email = user.Email,
                    Roles = roles.ToList(),
                    MasterTag = masterTag?.Name ?? string.Empty
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message);
                throw;
            }
        }
    }
}

public class UserDto
{
    public string Id { get; set; }
    public string? FirstName { get; set; }
    public string? LastName { get; set; }
    public string UserName { get; set; }
    public string Email { get; set; }
    public List<string> Roles { get; set; }
    public string MasterTag { get; set; }
    public int? DepartmentId { get; set; }
    public string DepartmentName { get; set; }
    public bool? IsDeleted { get; set; }
    public DateTime? LastLogin { get; set; }
}