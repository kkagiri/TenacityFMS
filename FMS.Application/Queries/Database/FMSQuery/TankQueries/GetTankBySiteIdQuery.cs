using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.Tank;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.TankQueries
{
    public record  GetTankBySiteIdQuery(int SiteId) : IRequest<List<TankDTO>>;
  

    public class GetTankBySiteIdQueryHandler : IRequestHandler<GetTankBySiteIdQuery, List<TankDTO>>
    {

        private readonly GpsdataContext _context;
            private readonly IMapper _mapper;
           private readonly ILogger<GetTankBySiteIdQueryHandler> _logger;

        public GetTankBySiteIdQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetTankBySiteIdQueryHandler> logger)
        {
             _context = context;
            _mapper = mapper;
            _logger = logger;

        }

        public async Task<List<TankDTO>> Handle(GetTankBySiteIdQuery request, CancellationToken cancellationToken)
        {
            try
            {
                return _mapper.Map<List<TankDTO>>(_context.Tanks.Where(x => x.SiteId == request.SiteId).ToList());
            } catch(Exception ex)

            {
                _logger.LogError(ex, "Error in GetTankBySiteIdQuery");
                 throw;
            }
        }
    }
}
