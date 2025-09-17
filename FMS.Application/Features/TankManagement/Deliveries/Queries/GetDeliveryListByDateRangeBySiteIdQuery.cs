using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Delivery.cs;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.DeliveryQueries {
    public record GetDeliveryListQueryByDateRangeBySiteIDQuery (DateTime StartDate, DateTime EndDate, int SiteId) : IRequest<List<DeliveryDTO>>;

    public class GetDeliveryListQueryByDateRangeBySiteIDQueryHandler : IRequestHandler<GetDeliveryListQueryByDateRangeBySiteIDQuery, List<DeliveryDTO>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        private readonly ILogger<GetDeliveryListQueryByDateRangeBySiteIDQueryHandler> _logger;

        public GetDeliveryListQueryByDateRangeBySiteIDQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetDeliveryListQueryByDateRangeBySiteIDQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<DeliveryDTO>> Handle (GetDeliveryListQueryByDateRangeBySiteIDQuery request, CancellationToken cancellationToken) {
            try {
                return _mapper.Map<List<DeliveryDTO>> (await _context.Deliveries.Where (x => x.DeliveryDate.Date >= request.StartDate.Date && x.DeliveryDate.Date <= request.EndDate.Date && x.Tank.Site.Id == request.SiteId).ToListAsync (cancellationToken));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting delivery list by Date Range by Site");
                throw;
            }
        }
    }

}