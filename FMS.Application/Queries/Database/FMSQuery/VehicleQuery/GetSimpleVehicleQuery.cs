using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.Vehicle;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;

namespace FMS.Application.Queries.Database.FMSQuery.VehicleQuery
{
    public record GetSimpleVehicleQuery : IRequest<List<SimpleVehicleDto>>;
 
    public class GetSimpleVehicleQueryHandler : IRequestHandler<GetSimpleVehicleQuery, List<SimpleVehicleDto>>
    {
        private readonly IMapper _mapper;
        private readonly GpsdataContext _context;

        public GetSimpleVehicleQueryHandler(IMapper mapper, GpsdataContext context)
        {
            _mapper = mapper;
            _context = context;
        }



        public async Task<List<SimpleVehicleDto>> Handle(GetSimpleVehicleQuery request, CancellationToken cancellationToken)
        {
            try
            {
                var results = await _context.Vehicles.ToListAsync(cancellationToken);

                return _mapper.Map<List<SimpleVehicleDto>>(results);
            }
            catch (Exception ex)
            {
                throw new Exception("Error getting vehicle list", ex);

            }
        }
    }

}
