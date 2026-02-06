using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Common;
using FMS.Domain.Entities; // For FMSResponse
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement;

public record UserCreateCommand(string Email, string Username, string Password, string RoleName, int? DepartmentId = null) : IRequest<FMSResponse<string>>;

public class UserCreateCommandHandler : IRequestHandler<UserCreateCommand, FMSResponse<string>>
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

    public async Task<FMSResponse<string>> Handle(UserCreateCommand request, CancellationToken cancellationToken)
    {
        try
        {
            var validationErrors = new List<string>();

            // Username uniqueness
            var existingUserByUsername = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.UserName == request.Username, cancellationToken);
            if (existingUserByUsername != null)
            {
                validationErrors.Add("Username already exists.");
            }

            // Email uniqueness
            var existingUserByEmail = await _context.Users
                .AsNoTracking()
                .FirstOrDefaultAsync(u => u.Email == request.Email, cancellationToken);
            if (existingUserByEmail != null)
            {
                validationErrors.Add("Email already exists.");
            }

            // Validate DepartmentId if provided
            if (request.DepartmentId.HasValue)
            {
                var departmentExists = await _context.Departments
                    .AsNoTracking()
                    .AnyAsync(d => d.DepartmentId == request.DepartmentId.Value && d.IsActive, cancellationToken);
                if (!departmentExists)
                {
                    validationErrors.Add("Selected department does not exist or is inactive.");
                }
            }

            if (validationErrors.Any())
            {
                _logger.LogWarning("User creation validation failed for {@Request}: {Errors}", request, validationErrors);
                return FMSResponse<string>.ValidationFailed(validationErrors);
            }

            var user = new User
            {
                UserName = request.Username,
                Email = request.Email,
                IsDeleted = false,
                DepartmentId = request.DepartmentId
            };

            var identityResult = await _manager.CreateAsync(user, request.Password);
            if (!identityResult.Succeeded)
            {
                var identityErrors = identityResult.Errors.Select(e => e.Description).ToList();
                _logger.LogWarning("Password / identity validation failed for {Username}: {Errors}", request.Username, identityErrors);
                return FMSResponse<string>.ValidationFailed(identityErrors);
            }

            if (!string.IsNullOrWhiteSpace(request.RoleName))
            {
                var roleExist = await _roleManager.RoleExistsAsync(request.RoleName);
                if (!roleExist)
                {
                    _logger.LogWarning("Role {Role} does not exist for new user {User}", request.RoleName, request.Username);
                    return FMSResponse<string>.ValidationFailed(new List<string> { $"Role '{request.RoleName}' does not exist." });
                }

                var roleResult = await _manager.AddToRoleAsync(user, request.RoleName);
                if (!roleResult.Succeeded)
                {
                    var roleErrors = roleResult.Errors.Select(e => e.Description).ToList();
                    _logger.LogWarning("Failed assigning role {Role} to user {User}: {Errors}", request.RoleName, request.Username, roleErrors);
                    return FMSResponse<string>.ValidationFailed(roleErrors);
                }
            }

            return FMSResponse<string>.Success(user.Id, "User created successfully.");
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Unhandled exception during user creation for {Username}", request.Username);
            return FMSResponse<string>.SystemError("Error creating user.");
        }
    }
}