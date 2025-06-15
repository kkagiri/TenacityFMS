using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.Vehicle.DTOs;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.VehicleQuery {
    /// <summary>
    /// Request to get a vehicle by its ID
    /// </summary>
    /// <param name="Id"></param>
    public record GetVehicleByIDQuery (int Id) : IRequest<VehicleDTO>;

    public class GetVehicleByIDQueryHandler : IRequestHandler<GetVehicleByIDQuery, VehicleDTO> {
        private readonly GpsdataContext _context;
        private readonly IMapper _mapper;
        private readonly ILogger _logger;

        public GetVehicleByIDQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetVehicleByIDQueryHandler> logger) {
            _context = context;
            _mapper = mapper;
            _logger = logger;

        }

        public async Task<VehicleDTO> Handle (GetVehicleByIDQuery request, CancellationToken cancellationToken) {
            try {
                return _mapper.Map<Vehicle, VehicleDTO> (await _context.Vehicles.FirstOrDefaultAsync (e => e.VehicleId == request.Id));
            } catch (Exception ex) {
                _logger.LogError (ex.Message);
                throw new Exception (ex.Message);

            }

        }
    }

}