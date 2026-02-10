/*
 * File: GetUserListQuery.cs
 * Purpose: Returns user list data for admin screens including department and role information
 * Dependencies: MediatR, EF Core, UserManager<User>, GpsdataContext
 * Last Modified: 2026-02-10
 *
 * Key Functions:
 * - GetUserListQueryHandler.Handle(): Fetches users with department and role assignments
 */
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries
{
    public record GetUserListQuery : IRequest<List<UserDto>>;

    public class GetUserListQueryHandler : IRequestHandler<GetUserListQuery, List<UserDto>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetUserListQueryHandler> _logger;
        private readonly UserManager<User> _userManager;

        public GetUserListQueryHandler(
            GpsdataContext context,
            ILogger<GetUserListQueryHandler> logger,
            UserManager<User> userManager)
        {
            _context = context;
            _logger = logger;
            _userManager = userManager;
        }

        public async Task<List<UserDto>> Handle(GetUserListQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var users = await _context.Users
                    .AsNoTracking()
                    .Include(u => u.Department)
                    .ToListAsync(cancellationToken);

                var userDtos = new List<UserDto>(users.Count);

                foreach (var user in users)
                {
                    var roles = await _userManager.GetRolesAsync(user);
                    var roleNames = roles
                        .Where(r => !string.IsNullOrWhiteSpace(r))
                        .Select(r => r.Trim())
                        .Distinct(StringComparer.OrdinalIgnoreCase)
                        .ToList();

                    userDtos.Add(new UserDto
                    {
                        Id = user.Id,
                        UserName = user.UserName,
                        Email = user.Email,
                        DepartmentId = user.DepartmentId,
                        DepartmentName = user.Department?.Name,
                        IsDeleted = user.IsDeleted,
                        Roles = roleNames
                    });
                }

                return userDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetUserListQueryHandler");
                throw new Exception("Error in GetUserListQueryHandler", ex);
            }
        }
    }
}
