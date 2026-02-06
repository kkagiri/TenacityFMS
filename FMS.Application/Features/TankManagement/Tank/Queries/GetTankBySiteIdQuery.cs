/**
 * File: GetTankBySiteIdQuery.cs
 * Purpose: Returns site tanks with PTS probe binding information.
 * Dependencies: EF Core, MediatR, AutoMapper
 * Last Modified: 2026-02-05
 */
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.Tank;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankQueries
{
    public record GetTankBySiteIdQuery(int SiteId) : IRequest<List<TankDTO>>;

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
                var tanks = await _context.Tanks
                    .Where(x => x.SiteId == request.SiteId)
                    .Include(x => x.Site)
                    .Include(x => x.LinkedVehicle)
                    .ToListAsync(cancellationToken);

                // AutoMapper will map ProbeNumber and PtsTankId directly from Tank entity
                var tankDtos = _mapper.Map<List<TankDTO>>(tanks);

                return tankDtos;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error in GetTankBySiteIdQuery");
                throw;
            }
        }
    }
}
