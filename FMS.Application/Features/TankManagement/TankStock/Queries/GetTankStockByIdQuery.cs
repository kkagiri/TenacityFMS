using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.Features.FMS.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankStock;

public record GetTankStockByIdQuery (int Id) : IRequest<TankStockDTO>;

public class GetTankStockByIdQueryHandler : IRequestHandler<GetTankStockByIdQuery, TankStockDTO> {
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;
    private readonly ILogger<GetTankStockByIdQueryHandler> _logger;

    public GetTankStockByIdQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetTankStockByIdQueryHandler> logger) {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<TankStockDTO> Handle (GetTankStockByIdQuery request, CancellationToken cancellationToken) {
        try {
            var tankStock = await _context.Tankstocks.FindAsync (new object[] { request.Id }, cancellationToken);
            return tankStock == null ? null : _mapper.Map<TankStockDTO> (tankStock);
        } catch (System.Exception ex) {
            _logger.LogError (ex, "Error getting tank stock by ID");
            throw;
        }
    }
}