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

namespace FMS.Application.Queries.Database.FMSQuery.UserManagement.UserQueries
{
   public record GetUserListQuery : IRequest<List<User>>;

    public class GetUserListQueryHandler : IRequestHandler<GetUserListQuery, List<User>>
    {
        private readonly GpsdataContext _context;

        private readonly ILogger<GetUserListQueryHandler> _logger;
        public GetUserListQueryHandler(GpsdataContext context ,ILogger<GetUserListQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<List<User>> Handle(GetUserListQuery request, CancellationToken cancellationToken)
        {

            try
            {
                return await _context.Users.ToListAsync(cancellationToken);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetUserListQueryHandler");
                throw new Exception("Error in GetUserListQueryHandler", ex);
            }   

        
        }

     
    }
}
