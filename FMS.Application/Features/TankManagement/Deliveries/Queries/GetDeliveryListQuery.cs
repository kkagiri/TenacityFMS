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
    public record GetDeliveryListQuery : IRequest<List<DeliveryDTO>>;

    public class GetDeliveryListQueryHandler : IRequestHandler<GetDeliveryListQuery, List<DeliveryDTO>> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        private readonly ILogger<GetDeliveryListQueryHandler> _logger;

        public GetDeliveryListQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetDeliveryListQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<DeliveryDTO>> Handle (GetDeliveryListQuery request, CancellationToken cancellationToken) {
            try {
                return _mapper.Map<List<DeliveryDTO>> (await _context.Deliveries.ToListAsync (cancellationToken));
            } catch (Exception ex) {
                _logger.LogError (ex, "Error getting delivery list");
                throw;
            }
        }
    }

}