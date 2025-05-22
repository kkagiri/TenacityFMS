using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Application.Dtos.UserManagement;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries;

public record GetUserByIdQuery(string UserId) : IRequest<UserDetailDto>;

public class GetUserByIdQueryHandler : IRequestHandler<GetUserByIdQuery, UserDetailDto>
{
    private readonly GpsdataContext _context;
    private readonly ILogger<GetUserByIdQueryHandler> _logger;
    public GetUserByIdQueryHandler(GpsdataContext context, ILogger<GetUserByIdQueryHandler> logger)
    {
        _context = context;
        _logger = logger;
    }
    public async Task<UserDetailDto> Handle(GetUserByIdQuery request, CancellationToken cancellationToken)
    {
        try
        {
            var user = await _context.Users
                .Where(u => u.Id == request.UserId)
                .Select(u => new UserDetailDto
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    Email = u.Email,
                    IsDeleted = u.IsDeleted ?? false,
                    PhoneNumber = u.PhoneNumber ?? string.Empty

                })
                .FirstOrDefaultAsync(cancellationToken);

            return user;

        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetUserByIdQueryHandler");
            throw new Exception("Error in GetUserByIdQueryHandler", ex);
        }
    }


}