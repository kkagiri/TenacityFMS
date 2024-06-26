using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.SiteQuery
{
    public record GetSitesByUserIdQuery (string UserId) : IRequest<List<Site>>;

    public class GetSitesByUserIdQueryHandler : IRequestHandler<GetSitesByUserIdQuery, List<Site>>
    {
        private readonly GpsdataContext _context;
        private readonly ILogger<GetSitesByUserIdQueryHandler> _logger;

        public GetSitesByUserIdQueryHandler(GpsdataContext context, ILogger<GetSitesByUserIdQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<List<Site>> Handle(GetSitesByUserIdQuery request, CancellationToken cancellationToken)
        {

            try
            {
                //To:do verify if t he userID is valid 

                var userId = await _context.Users.FirstOrDefaultAsync(x=>x.Id == request.UserId);
                if(userId == null)
                {
                    throw new Exception("Invalid User Id");
                }
                
                var sites = await _context.Sites
                    .Join(_context.UserSites,site=>site.Id,
                           usersite=>usersite.SiteId,
                           (site,usersite) => new {site,usersite}) 
                    .Where(x=>x.usersite.UserId == userId.Id)
                    .Select(x=>x.site).ToListAsync(cancellationToken);

                return sites;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetSitesByUserIdQueryHandler");
                throw new Exception(ex.Message);    
            }
            
        }
    }
    
}
