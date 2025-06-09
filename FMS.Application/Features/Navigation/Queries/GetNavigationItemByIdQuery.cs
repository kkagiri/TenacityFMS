using System;
using System.Threading;
using System.Threading.Tasks;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.Navigation
{
    public record GetNavigationItemByIdQuery(int Id) : IRequest<Navigationitem>;

    public class GetNavigationItemByIdQueryHandler : IRequestHandler<GetNavigationItemByIdQuery, Navigationitem>
    {

        private readonly GpsdataContext _context;
        private readonly ILogger<GetNavigationItemByIdQueryHandler> _logger;

        public GetNavigationItemByIdQueryHandler(GpsdataContext context, ILogger<GetNavigationItemByIdQueryHandler> logger)
        {
            _context = context;
            _logger = logger;
        }
        public async Task<Navigationitem> Handle(GetNavigationItemByIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var navigationItem = await _context.Navigationitems.FindAsync(request.Id);
                return navigationItem;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message, "Error retrieving navigation item");
                throw;
            }
        }
    }

}