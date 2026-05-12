/**
 * File: GetTankListQuery.cs
 * Purpose: Returns all tanks with PTS probe binding information.
 * Dependencies: EF Core, MediatR, AutoMapper
 * Last Modified: 2026-02-05
 */
using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
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

            // AutoMapper will now directly map ProbeNumber and PtsTankId from Tank entity
            var tankDtos = _mapper.Map<List<TankDTO>>(tanks);

            return tankDtos;
        }
    }
}
