using System;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Command.DatabaseCommand.UserManagement;

public record UserPermanentDeleteCommand(string UserId):IRequest<bool>;


public class UserPermanentDeleteCommandHandler : IRequestHandler<UserPermanentDeleteCommand, bool>
{

     private readonly GpsdataContext _context;
     private readonly ILogger _logger;

     public UserPermanentDeleteCommandHandler(GpsdataContext context, ILogger<UserDeleteCommandHandler> logger)
     {
         _context = context;
         _logger = logger;
     }

    public async Task<bool> Handle(UserPermanentDeleteCommand request, CancellationToken cancellationToken)
    {
        try{

            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == request.UserId, cancellationToken);

            if(user == null)
            {
                _logger.LogWarning ("User not found {UserId}", request.UserId);
                return false;
            }

            //check  if user is the last user in the database
            var totalusers = await _context.Users.CountAsync(cancellationToken);

            if(totalusers <=1)  {throw new ArgumentException( "Cannot delete the last user {UserId}", request.UserId);}

              //check if the user is the last admin 
             var adminRole = await _context.Roles.FirstOrDefaultAsync(r => r.Name == "admin", cancellationToken);
           if (adminRole != null)
    {
          var totalAdmins = await _context.UserRoles.CountAsync(ur => ur.RoleId == adminRole.Id, cancellationToken);
          if (totalAdmins <= 1 && await _context.UserRoles.AnyAsync(ur => ur.UserId == user.Id && ur.RoleId == adminRole.Id, cancellationToken))
           {
             _logger.LogWarning("Cannot delete the last admin {UserId}", request.UserId);
            return false;
          }

    }
           
           _context .Users.Remove(user);

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation ("User deleted {UserId}", request.UserId);
            return true;
        }
        catch(Exception ex)
        {
            _logger.LogError (ex, "Error deleting user {UserId}", request.UserId);
            return false;
            
        }
    }
}
