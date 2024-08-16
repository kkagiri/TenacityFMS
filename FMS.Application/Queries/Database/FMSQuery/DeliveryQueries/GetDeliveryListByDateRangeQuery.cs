using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.Delivery.cs;
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

namespace FMS.Application.Queries.Database.FMSQuery.DeliveryQueries
{
    public record GetDeliveryListByDateRangeQuery(DateTime StartDate,DateTime EndDate) : IRequest<List<DeliveryDTO>>;

    public class GetDeliveryListByDateRangeQueryHandler : IRequestHandler<GetDeliveryListByDateRangeQuery, List<DeliveryDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        private readonly ILogger<GetDeliveryListByDateRangeQueryHandler> _logger;

        public GetDeliveryListByDateRangeQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetDeliveryListByDateRangeQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<DeliveryDTO>> Handle(GetDeliveryListByDateRangeQuery request, CancellationToken cancellationToken)
        {
            try
            {
                return _mapper.Map<List<DeliveryDTO>>(await _context.Deliveries.Where(x=>x.DeliveryDate.Date >=request.StartDate.Date && x.DeliveryDate.Date<=request.EndDate.Date).ToListAsync(cancellationToken));
            }

            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting delivery list");
                throw;
            }
        }
    }
   
}
