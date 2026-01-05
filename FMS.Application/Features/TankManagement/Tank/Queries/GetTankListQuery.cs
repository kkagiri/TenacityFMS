using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS;
using FMS.Application.Features.FMS.Tank;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;

namespace FMS.Application.Queries.Database.FMSQuery.TankQueries
{
    public record GetTankListQuery : IRequest<List<TankDTO>>;

    public class GetTankListQueryHandler : IRequestHandler<GetTankListQuery, List<TankDTO>>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        public GetTankListQueryHandler(GpsdataContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<List<TankDTO>> Handle(GetTankListQuery request, CancellationToken cancellationToken)
        {
            var tanks = await _context.Tanks
                .Include(x => x.Site)
                .Include(x => x.LinkedVehicle)
                .ToListAsync(cancellationToken);
            return _mapper.Map<List<TankDTO>>(tanks);
        }
    }
}