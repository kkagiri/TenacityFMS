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
    public record GetTankByIdQuery(int Id) : IRequest<TankDTO>;
    public class GetTankByIdQueryHandler : IRequestHandler<GetTankByIdQuery, TankDTO>
    {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;

        public GetTankByIdQueryHandler(GpsdataContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<TankDTO> Handle(GetTankByIdQuery request, CancellationToken cancellationToken)
        {
            if (request.Id == 0) throw new ArgumentException("Id is required");
            var tank = await _context.Tanks
                .Include(t => t.Site)
                .Include(t => t.LinkedVehicle)
                .FirstOrDefaultAsync(t => t.Id == request.Id, cancellationToken);
            return tank == null ? null : _mapper.Map<TankDTO>(tank);
        }
    }
}