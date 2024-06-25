using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement;

public record RestoreUserCommand(string UserId): IRequest<bool>;

public class RestoreUserCommandHandler : IRequestHandler<RestoreUserCommand, bool>
{
   private readonly GpsdataContext _context;
   private readonly ILogger<RestoreUserCommandHandler> _logger;

   public RestoreUserCommandHandler(GpsdataContext context, ILogger<RestoreUserCommandHandler> logger)
   {
       _context = context;
       _logger = logger;
   }

    public async Task<bool> Handle(RestoreUserCommand request, CancellationToken cancellationToken)
    {
         try
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

if (user == null || (!user.IsDeleted ?? false))
        {
            _logger.LogWarning("User not found or not deleted {UserId}", request.UserId);
            return false;
        }

        user.IsDeleted = false;
        _context.Users.Update(user);

        await _context.SaveChangesAsync(cancellationToken);

        _logger.LogInformation("User restored {UserId}", request.UserId);
        return true;
    }
    catch (Exception ex)
    {
        _logger.LogError(ex, "Error restoring user {UserId}", request.UserId);
        return false;
    }
    }
}
