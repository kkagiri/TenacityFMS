using AutoMapper;
using AutoMapper.QueryableExtensions;
using FMS.Application.ModelsDTOs.FMS.Vehicle;
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

namespace FMS.Application.Queries.Database.FMSQuery.VehicleQuery
{
    public record GetVehicleListQuery : IRequest<List<VehicleDTO>>;

    public class GetVehicleQueryHandler : IRequestHandler<GetVehicleListQuery, List<VehicleDTO>>
    {

        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger _logger;

        public GetVehicleQueryHandler(GpsdataContext context, IMapper mapper, ILogger<GetVehicleByIDQueryHandler> logger)
        {
            _context = context;
            _mapper = mapper;
            _logger = logger;
        }

        public async Task<List<VehicleDTO>> Handle(GetVehicleListQuery request, CancellationToken cancellationToken)
        {
            try
            {
              return  await _context.Vehicles.Include(x => x.DefaultExptdAvg.ExpectedAverageClassification).ProjectTo<VehicleDTO>(_mapper.ConfigurationProvider).ToListAsync(cancellationToken);
         
            }
            catch (Exception ex)
            {
                _logger.LogError(ex.Message, ex);
                throw new Exception(ex.Message, ex);
            }
        }


    }
}
