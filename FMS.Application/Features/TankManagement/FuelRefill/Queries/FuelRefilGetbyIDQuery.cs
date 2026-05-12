using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.FuelRefil;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.FuelRefillQueries;

public record FuelRefillGetbyIDQuery (int Id) : IRequest<FuelRefilDTO>;

public class FuelRefillGetbyIDQueryHandler : IRequestHandler<FuelRefillGetbyIDQuery, FuelRefilDTO> {

    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefillGetbyIDQueryHandler> _logger;
    private readonly IMapper _mapper;

    public FuelRefillGetbyIDQueryHandler (GpsdataContext context, ILogger<FuelRefillGetbyIDQueryHandler> logger, IMapper mapper) {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }
    public async Task<FuelRefilDTO> Handle (FuelRefillGetbyIDQuery request, CancellationToken cancellationToken) {
        try {
            return _mapper.Map<FuelRefilDTO> (await _context.FuelRefills.FirstOrDefaultAsync (x => x.Id == request.Id, cancellationToken));
        } catch (Exception ex) {
            _logger.LogError (ex, "Error in GetFuelRefilbyIDQueryHandler");
            throw new Exception (ex.Message);

        }
    }
}