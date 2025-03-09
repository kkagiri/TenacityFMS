using System;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.FuelRefil;
using FMS.Domain.Entities;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Org.BouncyCastle.Bcpg.OpenPgp;

namespace FMS.Application.Queries.Database.FMSQuery.FuelRefilQueries;

public record FuelRefilGetbyIDQuery(int Id) : IRequest<FuelRefilDTO>;

public class FuelRefilGetbyIDQueryHandler : IRequestHandler<FuelRefilGetbyIDQuery, FuelRefilDTO>
{

    private readonly GpsdataContext _context;
    private readonly ILogger<FuelRefilGetbyIDQueryHandler> _logger;
    private readonly IMapper _mapper;

    public FuelRefilGetbyIDQueryHandler(GpsdataContext context, ILogger<FuelRefilGetbyIDQueryHandler> logger, IMapper mapper)
    {
        _context = context;
        _logger = logger;
        _mapper = mapper;
    }
    public async Task<FuelRefilDTO> Handle(FuelRefilGetbyIDQuery request, CancellationToken cancellationToken)
    {
        try
        {
            return _mapper.Map<FuelRefilDTO>(await _context.Fuelrefils.FirstOrDefaultAsync(x => x.Id == request.Id, cancellationToken));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error in GetFuelRefilbyIDQueryHandler");
            throw new Exception(ex.Message);

        }
    }
}
