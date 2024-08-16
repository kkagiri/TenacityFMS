using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using FMS.PTS.Common;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Command.DatabaseCommand.UserManagement
{
    public record AssignSitesToUserCommand(string UserId, List<int> SiteIds) : IRequest<bool>;

    public class AssignSitesToUserCommandHandler : IRequestHandler<AssignSitesToUserCommand, bool>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<AssignSitesToUserCommandHandler> _logger;

        public AssignSitesToUserCommandHandler(GpsdataContext context, ILogger<AssignSitesToUserCommandHandler> logger)
        {
            _context = context;
            _logger = logger;
        }

        public async Task<bool> Handle(AssignSitesToUserCommand request, CancellationToken cancellationToken)
        {
            try
            {
                var isvalidUserID = await _context.Users.AnyAsync(x => x.Id == request.UserId);
                if (!isvalidUserID) throw new Exception("Invalid User Id");
                
                var userSites = await _context.UserSites.Where(x => x.UserId == request.UserId).ToListAsync(cancellationToken);
                _context.UserSites.RemoveRange(userSites);
                await _context.SaveChangesAsync(cancellationToken);




                foreach (var siteId in request.SiteIds)
                {

                    if (!await _context.Sites.AnyAsync(x => x.Id == siteId))
                    {
                        throw new Exception($"Invalid Site Id {siteId}");
                    }

                    _context.UserSites.Add(new UserSites
                    {
                        SiteId = siteId,
                        UserId = request.UserId
                    });
                }

                await _context.SaveChangesAsync(cancellationToken);

                return true;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in AssignSitesToUserCommandHandler");
                throw new Exception(ex.Message);
            }
        }
    }
}
      