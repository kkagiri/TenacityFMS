using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Dtos.UserManagement;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;

public record GetUserByIdQuery(string UserId) : IRequest<UserDetailDto?>;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDetailDto?>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetUserByIdQueryHandler> _logger;
    private readonly UserManager<User> _userManager;

    public GetUserByIdQueryHandler(GpsdataContext context, ILogger<GetUserByIdQueryHandler> logger, UserManager<User> userManager)
    {
        _context = context;
        _logger = logger;
        _userManager = userManager;
    }

    public async Task<UserDetailDto?> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _context.Users
                .Include(u => u.Department)
                .Where(u => u.Id == request.UserId)
                .FirstOrDefaultAsync(cancellationToken);

            if (user == null)
            {
                return (UserDetailDto?)null;
            }

            // Get user roles
            var roles = await _userManager.GetRolesAsync(user);

            // Get master tag information
            var masterTag = user.MasterRFIDTag.HasValue ?
                await _context.FuelTags.FirstOrDefaultAsync(t => t.Id == user.MasterRFIDTag, cancellationToken) : null;

            return new UserDetailDto
            {
                Id = user.Id,
                FirstName = user.FirstName,
                LastName = user.LastName,
                UserName = user.UserName ?? string.Empty,
                Email = user.Email ?? string.Empty,
                EmailConfirmed = user.EmailConfirmed,
                IsDeleted = user.IsDeleted ?? false,
                PhoneNumber = user.PhoneNumber ?? string.Empty,
                MasterRFIDTag = user.MasterRFIDTag ?? 0,

                // Master Tag Information
                HasMasterTag = user.MasterRFIDTag.HasValue,
                MasterTagName = masterTag?.Name,
                MasterTagIsEnabled = masterTag?.IsEnabled,

                // Location Validation Settings
                BypassLocationValidation = user.BypassLocationValidation,

                RequirePasswordChangeOnFirstLogin = user.RequirePasswordChangeOnFirstLogin,

                // Department Information
                DepartmentId = user.DepartmentId,
                DepartmentName = user.Department?.Name,

                // Include roles
                Roles = roles.ToList()
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetUserByIdQueryHandler");
            throw new Exception("Error in GetUserByIdQueryHandler", ex);
        }
    }
}