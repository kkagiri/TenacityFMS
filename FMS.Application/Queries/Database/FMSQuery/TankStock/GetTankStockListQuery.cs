using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using AutoMapper;
using FMS.Application.ModelsDTOs.FMS.TankStock;
using FMS.Persistence.DataAccess;
using MediatR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;

namespace FMS.Application.Queries.Database.FMSQuery.TankStock;

public record GetTankStockListQuery : IRequest<List<TankStockDTO>>;

 public class GetTankStockListQueryHandler : IRequestHandler<GetTankStockListQuery,List<TankStockDTO>>
{
    private readonly GpsdataContext _context;
    private readonly IMapper _mapper;

    private readonly ILogger<GetTankStockListQueryHandler> _logger;

    public GetTankStockListQueryHandler (GpsdataContext context, IMapper mapper, ILogger<GetTankStockListQueryHandler> logger)
    {
        _context = context;
        _mapper = mapper;
        _logger = logger;
    }

    public async Task<List<TankStockDTO>> Handle(GetTankStockListQuery request, CancellationToken cancellationToken)
    {
        try
        {
            return _mapper.Map<List<TankStockDTO>>(await _context.Tankstocks.ToListAsync(cancellationToken));
        }

        catch (Exception ex)
        {
            _logger.LogError(ex, "Error getting tank stock list");
            throw;
        }

        
    }
}
