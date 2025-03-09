using System;
using System.ComponentModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement;

public record UserCreateCommand(string Email, string Username, string Password, string RoleName) : IRequest<string>;

public class UserCreateCommandHandler : IRequestHandler<UserCreateCommand, string>
{
    private readonly GpsdataContext _context;
    private readonly UserManager<User> _manager;

    private readonly ILogger<UserCreateCommandHandler> _logger;
    private readonly RoleManager<Role> _roleManager;

    public UserCreateCommandHandler(GpsdataContext context,
        ILogger<UserCreateCommandHandler>
        logger, UserManager<User> manager,
           RoleManager<Role> roleManager
        )
    {
        _roleManager = roleManager;
        _context = context;
        _logger = logger;
        _manager = manager;

    }

    public async Task<string> Handle(UserCreateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var existingUserByUsername = await _context.Users
                    .AsNoTracking()
                    .FirstOrDefaultAsync(u => u.UserName == request.Username, cancellationToken);
            if (existingUserByUsername != null)
            {
                _logger.LogWarning("Username {Username} already exists.", request.Username);
                throw new Exception("Username already exists.");
            }

            // Direct database context check for email
            var existingUserByEmail = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
            if (existingUserByEmail != null)
            {
                _logger.LogWarning("Email {Email} already exists.", request.Email);
                throw new Exception("Email already exists.");
            }
            var user = new User
            {
                UserName = request.Username,
                Email = request.Email,
                IsDeleted = false
            };

            var result = await _manager.CreateAsync(user, request.Password);
            if (!result.Succeeded)
            {
                throw new Exception(string.Join("; ", result.Errors.Select(e => e.Description)));
            }

            if (!string.IsNullOrEmpty(request.RoleName))
            {
                var roleExist = await _roleManager.RoleExistsAsync(request.RoleName);
                if (!roleExist)
                {
                    throw new Exception($"Role '{request.RoleName}' does not exist");
                }

                var roleResult = await _manager.AddToRoleAsync(user, request.RoleName);
                if (!roleResult.Succeeded)
                {
                    throw new Exception(string.Join("; ", roleResult.Errors.Select(e => e.Description)));
                }
            }

            return user.Id;
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error creating user");
            throw new Exception("Error creating user", ex);
        }

    }
}
